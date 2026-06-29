# Lý Thuyết Về Observability Stack (Hệ Thống Quan Sát)

Khi hệ thống phát triển từ kiến trúc nguyên khối (Monolith) sang Vi dịch vụ (Microservices), một request từ người dùng không còn được xử lý bởi một ứng dụng duy nhất nữa. Thay vào đó, nó đi qua API Gateway, gọi đến Service A (vd: `flashcard-service`), Service A lại gọi Service B (vd: `wallet-service`), và gửi một event qua RabbitMQ đến Service C (`notification-service`).

Nếu một lỗi xảy ra (ví dụ: Người dùng mua Flashcard nhưng không bị trừ tiền, hoặc request bị chậm), làm sao bạn biết lỗi nằm ở đâu? Đọc log thủ công của từng service là một "ác mộng".

Đây là lúc **Observability (Khả năng quan sát)** xuất hiện. Observability giúp bạn hiểu được trạng thái bên trong của hệ thống từ những dữ liệu đầu ra mà hệ thống đó sinh ra.

Observability dựa trên **3 trụ cột chính (3 Pillars of Observability)**: Metrics (Chỉ số), Logs (Nhật ký), và Traces (Dấu vết).

---

## 1. Metrics (Chỉ Số - Hệ Thống Đo Lường)

**Metrics** là những con số định lượng mô tả trạng thái hệ thống tại một thời điểm nhất định. Nó trả lời cho câu hỏi: _"Chuyện gì đang xảy ra?"_ hoặc _"Hệ thống có đang hoạt động tốt không?"_.

- **Công cụ trong Seika:** Prometheus (thu thập metrics từ Spring Boot Actuator) và Grafana (hiển thị biểu đồ).
- **Đặc điểm:** Tốn rất ít tài nguyên lưu trữ vì nó chỉ là những con số (ví dụ: CPU 80%, số lượng request là 100/giây).
- **Ví dụ thực tế trong Seika:**
  - Bạn nhìn vào Dashboard của Grafana và thấy chỉ số **Error Rate (Tỷ lệ lỗi 500)** của `wallet-service` đột nhiên tăng vọt từ 0% lên 15%.
  - Bạn thấy **Response Time (Thời gian phản hồi)** của `quiz-service` tăng từ 200ms lên 3000ms.
  - **Hành động:** Metrics đóng vai trò như một "chuông báo cháy". Nó cho bạn biết có cháy, nhưng không cho bạn biết nguyên nhân tại sao cháy.

## 2. Logs (Nhật Ký - Hồ Sơ Sự Kiện)

**Logs** là các bản ghi dạng text về các sự kiện đã xảy ra trong hệ thống, kèm theo thời gian (timestamp). Nó trả lời cho câu hỏi: _"Tại sao chuyện đó lại xảy ra?"_.

- **Công cụ trong Seika:** Promtail (đi gom logs từ các Docker container) và Loki (lưu trữ và cho phép tìm kiếm logs tập trung).
- **Đặc điểm:** Chi tiết, tốn nhiều dung lượng. Thay vì phải ssh/vào từng container để gõ `docker logs`, tất cả log của 8 service được gom về một chỗ.
- **Ví dụ thực tế trong Seika:**
  - Từ tiếng "chuông báo cháy" của Metrics ở trên (lỗi ở `wallet-service`), bạn mở Loki lên và tìm kiếm log của `wallet-service`.
  - Bạn thấy dòng chữ màu đỏ: `ERROR 1324 --- [wallet-service] c.c.w.service.WalletService : Insufficient balance for user 123`.
  - **Hành động:** Bạn đã biết nguyên nhân gây ra lỗi. Nhưng đợi đã, người dùng 123 đang gọi API nào mà lại dẫn đến lỗi này?

## 3. Traces (Dấu Vết - Theo Dõi Luồng Xử Lý)

**Distributed Tracing (Truy xuất dấu vết phân tán)** giúp theo dõi vòng đời của một request từ lúc nó đi vào hệ thống cho đến lúc kết thúc, xuyên qua nhiều microservices. Nó trả lời cho câu hỏi: _"Request này đã đi qua những đâu và tốn bao nhiêu thời gian ở mỗi bước?"_.

- **Công cụ trong Seika:** Micrometer Tracing (tạo ra dấu vết trong code Spring Boot) và Tempo (nhận và hiển thị sơ đồ dấu vết).
- **Khái niệm cốt lõi:**
  - **Trace ID:** Một ID duy nhất được gán cho một request khi nó vừa tới API Gateway. ID này sẽ được truyền đi (propagate) sang tất cả các service khác (qua HTTP Header hoặc RabbitMQ).
  - **Span ID:** Mỗi khi request nhảy vào một service (hoặc một hàm quan trọng, hoặc gọi DB), một Span mới được tạo ra (nằm trong Trace đó).
- **Ví dụ thực tế trong Seika:**
  - Một user báo cáo: _"Tôi ấn nút mua Flashcard, nó xoay vòng vòng mất 5 giây rồi báo lỗi."_
  - Bạn mở Tempo, tìm kiếm các request bị chậm (duration > 4000ms) hoặc tìm theo Trace ID của request đó.
  - Tempo vẽ ra một biểu đồ thời gian (Gantt chart) như sau:
    1. `api-gateway` (5000ms) 2. `identity-service` (kiểm tra token) (20ms) 3. `flashcard-service` (xử lý logic mua) (4980ms) 4. Gọi HTTP sang `wallet-service` (4900ms) --> Báo lỗi 500 (Timeout).
  - **Hành động:** Nhờ Traces, bạn biết chính xác thủ phạm gây chậm là đoạn `flashcard-service` gọi sang `wallet-service`, và biết cụ thể hàm nào mất nhiều thời gian nhất.

---

## 4. Sự Kếp Hợp Ma Thuật (Correlation)

Sức mạnh thực sự của Observability Stack (Prometheus + Loki + Tempo trên nền Grafana) là sự liên kết giữa 3 trụ cột này:

1. Bạn thấy **Metrics** báo có lỗi (Lỗi tăng vọt).
2. Bạn nhìn vào biểu đồ Metrics, click vào khoảng thời gian bị lỗi để chuyển sang **Logs (Loki)**.
3. Trong Logs, cấu hình log của Seika đã được tôi thêm Trace ID vào (ví dụ: `INFO [wallet-service, 65b8c123a4, 87d5b]`). Bạn tìm thấy dòng báo lỗi.
4. Bạn click thẳng vào cái ID `65b8c123a4` đó trong màn hình Log.
5. Grafana tự động mở **Traces (Tempo)**, vẽ lại chính xác toàn bộ đường đi của cái request gây ra lỗi đó! Bạn thấy rõ nó xuất phát từ Gateway, qua Flashcard, sang Wallet rồi chết ở hàm nào, gọi DB ra sao.

Đó là lý do tại sao chúng ta cần một Observability Stack cho Microservices!
