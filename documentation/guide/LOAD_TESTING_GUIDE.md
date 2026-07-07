# 🚀 HƯỚNG DẪN LOAD TESTING & TÌM BOTTLENECK VỚI GRAFANA K6 + OBSERVABILITY STACK

## 🛠️ 1. CHUẨN BỊ MÔI TRƯỜNG

Trước khi bắt đầu test tải, hãy đảm bảo toàn bộ hệ thống và bộ Observability đã được khởi động và hoạt động ổn định.

### Kiểm tra các container đang chạy

Mở PowerShell tại thư mục gốc của project và kiểm tra:

```powershell
docker ps
```

Đảm bảo các container sau đang ở trạng thái `Up` / `Healthy`:

- `seika-api-gateway-1` (Port 8080)
- `seika-identity-service-1`, `seika-flashcard-service-1`, v.v.
- `loki`, `tempo` (Port 3200, 4318), `prometheus` (Port 9090), `grafana` (Port 3000)

---

## 🏃‍♂️ 2. CÁCH CHẠY KỊCH BẢN LOAD TEST K6

Kịch bản test tải tự động đã được viết sẵn tại file: **`scripts/load-test.js`**.
Bạn có thể chạy test theo 1 trong 2 cách dưới đây:

### Cách 1: Chạy bằng Docker (Khuyên dùng - Không cần cài đặt K6 lên máy)

Mở PowerShell tại thư mục gốc của project và chạy lệnh:

```powershell
Get-Content scripts\load-test.js | docker run --rm -i --network host grafana/k6 run -
```

_(Lưu ý: Nếu Docker Desktop của bạn trên Windows không hỗ trợ `--network host`, hãy truyền biến môi trường `BASE_URL`:)_

```powershell
Get-Content scripts\load-test.js | docker run --rm -i -e BASE_URL="http://host.docker.internal:8080" grafana/k6 run -
```

### Cách 2: Chạy trực tiếp qua K6 CLI (Nếu máy đã cài đặt K6)

```powershell
k6 run scripts\load-test.js
```

---

## 📊 3. HIỂU VỀ KỊCH BẢN TEST (`scripts/load-test.js`)

Kịch bản được thiết kế theo mô hình **Ep tải 4 Giai đoạn (Multi-stage Ramp-up/down)** để mô phỏng hành vi thực tế của người dùng:

```
  Virtual Users (VUs)
  100 |           +-------------------+ (Stage 3: Spike / Stress - 100 VUs trong 30s)
      |          /                     \
   50 |         +-------+               +
      |        /        | (Stage 2: 50 VUs) \
   20 |       +         |                    + (Stage 4: Cool-down về 0 trong 20s)
      |      / (Stage 1: Warm-up trong 30s)
    0 +-----+---------------------------------+---> Thời gian
```

### Các kịch bản nghiệp vụ (Scenarios) được ép tải song song:

1. **Scenario 1: `POST /api/auth/login` (Authentication Stress Test)**
   - Mô phỏng lượng lớn người dùng gửi request đăng nhập đồng thời.
   - **Mục đích**: Kiểm tra khả năng chịu tải của tầng Security Filter Chain, thuật toán mã hóa Bcrypt và tốc độ truy vấn cơ sở dữ liệu `identity-db`.
2. **Scenario 2: `GET /api/flashcards` (Read Catalog Throughput Test)**
   - Mô phỏng người dùng lướt xem danh sách các bộ từ vựng Flashcard.
   - **Mục đích**: Đánh giá chỉ số thông lượng (Throughput/RPS) khi đọc dữ liệu từ MongoDB qua `flashcard-service`.

### Tiêu chuẩn chấp nhận (Thresholds):

- **`p(95) < 800ms`**: 95% số lượng request phải hoàn thành dưới 800ms.
- **`p(99) < 1500ms`**: 99% số lượng request phải hoàn thành dưới 1.5 giây.
- **`errors < 5%`**: Tỷ lệ lỗi toàn hệ thống không được vượt quá 5%.

---

## 🕵️‍♂️ 4. QUY TRÌNH 4 BƯỚC "TRINH THÁM" TÌM BOTTLENECK

Đây là quy trình chuyên nghiệp để tìm ra **chính xác dòng code hoặc câu lệnh SQL/MongoDB** gây nghẽn hệ thống khi chịu tải cao.

### 🔍 Bước 1: Đọc chỉ số tổng thể trên Console K6

Khi test kết thúc, chú ý vào 2 dòng quan trọng nhất trên màn hình terminal:

- **`http_req_duration`**: Look vào cột **`p(95)`** và **`p(99)`**.
  - Nếu `p(95) > 1000ms`, hệ thống bắt đầu xuất hiện độ trễ cao (Latency Spike).
- **`errors`**: Nếu tỷ lệ lỗi > 0%, nhìn vào mã HTTP trả về (500 Internal Server Error, 502/503/504 Gateway Timeout).

### 🔍 Bước 2: Khoanh vùng Container nghẽn trên Grafana Prometheus

1. Mở trình duyệt truy cập Grafana: **`http://localhost:3000`** (User: `admin` / Pass: `admin`).
2. Vào menu **Dashboards** -> Mở dashboard **Spring Boot APM** (hoặc JVM / Micrometer Dashboard).
3. Kiểm tra 3 chỉ số tài nguyên trọng yếu:
   - **CPU Usage > 80%**: Container nào vọt lên ngưỡng này (ví dụ `identity-service`) chứng tỏ logic xử lý bên trong đang quá nặng.
   - **GC Thrashing (Garbage Collection Vọt Cao)**: Nhìn biểu đồ JVM Memory, nếu đường Heap Memory dốc đứng và bộ dọn rác (GC) phải chạy liên tục không ngừng -> Service đang bị nghẽn bộ nhớ do tạo quá nhiều temporary objects.
   - **HikariCP / DB Connection Pool Pending**: Nếu số lượng `Pending Threads` tăng vọt -> Service không đủ kết nối (connections) để gọi vào Database, các request đang phải xếp hàng chờ kết nối!

### 🔍 Bước 3: Soi vết "Thủ phạm" bằng Tempo Distributed Tracing

Sau khi biết Service nào bị chậm từ Bước 2, ta dùng Tracing để tìm nguyên nhân gốc rễ:

1. Vào Grafana -> **Explore** -> Chọn Data Source là **Tempo**.
2. Chọn tab **Search** (Tìm kiếm).
3. Tại ô **Min Duration**, nhập: `1000ms` (hoặc `1s`) -> Bấm **Run query**.
   - _Lệnh này sẽ lọc ra toàn bộ các giao dịch đi qua hệ thống mất nhiều hơn 1 giây._
4. Bấm vào một mã **TraceID** bất kỳ trong danh sách kết quả để mở biểu đồ **Waterfall (Thác nước)**.

### 🔍 Bước 4: Khám nghiệm biểu đồ Waterfall & Chuẩn đoán bệnh

Trên biểu đồ Waterfall, mỗi thanh ngang đại diện cho 1 công đoạn (Span). **Thanh nào dài nhất chính là thủ phạm gây nghẽn!**

| Hiện tượng trên Waterfall                                                     | Nguyên nhân gốc rễ (Root Cause)                                                                                | Giải pháp khắc phục                                                                                               |
| :---------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **Thanh dài nằm ở query DB** (`SELECT`, `find`, gọi vào `mongodb`/`postgres`) | Thiếu Index (chỉ mục) trên trường tìm kiếm, hoặc dính lỗi **N+1 Query** (gọi DB liên tục trong vòng lặp).      | Thêm Index cho Database; Sử dụng `JOIN` / `Eager Loading` thay vì N+1 Query.                                      |
| **Thanh dài nằm ở HTTP GET/POST giữa các Services** (`lb://PROFILE-SERVICE`)  | Giao tiếp Đồng bộ (Synchronous Blocking) bị trễ do service bị gọi xử lý chậm, gây nghẽn dây chuyền.            | Tăng Timeout; Áp dụng **Circuit Breaker (Resilience4j)** hoặc chuyển sang giao tiếp Bất đồng bộ qua **RabbitMQ**. |
| **Thanh dài nằm tại API Gateway** nhưng downstream rất ngắn                   | Quá tải tại tầng Filter của Gateway (Security, CORS, Rate Limiting).                                           | Tối ưu hóa WebFlux Filter, cache token verification.                                                              |
| **Thanh dài nằm ở nhịp `authorize` / Security**                               | Thuật toán băm mật khẩu (Bcrypt/Argon2) được cấu hình độ khó (work factor) quá cao khi chịu tải đồng thời lớn. | Giảm work factor của Bcrypt hoặc bổ sung cơ chế Cache cho Session/JWT Validation.                                 |

---

## 🎓 5. KỊCH BẢN DEMO BÁO CÁO ĐỒ ÁN / SHOWCASE VỚI GIÁO VIÊN

Khi trình bày đồ án trước giáo viên, bạn có thể thực hiện theo kịch bản 3 phút cực kỳ ấn tượng sau:

1. **Phát biểu dẫn dắt**:
   > _"Thưa thầy, để kiểm chứng kiến trúc Microservices của nhóm không chỉ chạy đúng nghiệp vụ mà còn đảm bảo hiệu năng cao, em sử dụng công cụ **Grafana k6** để ép tải hệ thống và dùng bộ **Observability Stack** để tìm điểm nghẽn theo thời gian thực."_
2. **Khởi chạy tải**: Mở terminal và chạy lệnh Docker k6. Cho thầy xem các chỉ số RPS và `http_req_duration` đang nhảy trên màn hình.
3. **Mở Grafana Dashboard**: Chuyển sang màn hình Grafana, mở dashboard JVM/Prometheus cho thầy xem chỉ số CPU và Connection Pool đang dao động ra sao dưới áp lực tải.
4. **Mở Tempo Waterfall**: Mở Grafana Explore -> Tempo -> Lọc các request `> 800ms`. Mở 1 Trace Waterfall ra và giải thích:
   > _"Thầy thấy ở đây, nhờ hệ thống Distributed Tracing bằng OpenTelemetry, khi một request đăng nhập bị chậm, em có thể nhìn vào Waterfall này để biết chính xác nó tốn bao nhiêu mili-giây tại API Gateway, bao nhiêu mili-giây để xác thực tại Identity Service, và mất bao nhiêu thời gian để truy vấn vào MongoDB mà không cần phải phỏng đoán mù quáng!"_
