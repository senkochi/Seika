Tài liệu này giải thích cấu trúc và nguyên lý hoạt động của thư mục `src/api` trong dự án. Kiến trúc này được thiết kế theo hướng module hóa, phân tách rõ ràng giữa cấu hình hạ tầng và logic nghiệp vụ nhằm đảm bảo tính **dễ mở rộng (Scalable)**, **dễ bảo trì (Maintainable)** và **Type-safe** tuyệt đối với TypeScript.

## 📂 Cấu trúc thư mục

Kết quả chạy mã
File created successfully: API_ARCHITECTURE_GUIDE.md

```text
src/api/
├── services/               # Tầng Nghiệp Vụ (Domain Services)
│   ├── auth.ts             # API liên quan đến xác thực (Login, Register, Refresh Token,...)
│   ├── userProfiles.ts     # API liên quan đến thông tin người dùng
│   ├── ...                 # API của các domain khác,...
│   └── index.ts            # Export tập trung các services
├── adapters.ts             # Tách/Chuyển đổi định dạng dữ liệu (Data Transformers)
├── client.ts               # Cấu hình Axios Instance (Base URL, Interceptors,...)
├── errors.ts               # Quản lý và định nghĩa các lỗi API tập trung
├── index.ts                # Entry point - Export mọi thứ ra ngoài cho UI sử dụng
└── types.ts                # Định nghĩa các Interface/Type TypeScript dùng chung
```

---

## 🎛️ Chi tiết vai trò từng File

### 1. Tầng Cấu Hình Hạ Tầng (Infrastructure)

- **`client.ts`**:
- Khởi tạo `axios.create()` với các cấu hình cơ bản (`baseURL`, `timeout`, `headers`).
- Chứa **Request Interceptor** để tự động đính kèm Token (Access Token) vào Header trước khi gửi đi.
- Chứa **Response Interceptor** để bắt các mã lỗi toàn cục (ví dụ: `401 Unauthorized` để tự động gọi API Refresh Token, hoặc `403`, `500` để hiển thị Toast thông báo nhanh).

- **`types.ts`**:
- Định nghĩa cấu trúc chuẩn của dữ liệu trả về từ server (ví dụ: `ApiResponse<T>`, `PaginationMeta`).
- Giúp đồng bộ kiểu dữ liệu và tăng tính bao bọc, ép buộc tất cả API phải tuân thủ schema chung.

- **`errors.ts`**:
- Định nghĩa các class hoặc hàm xử lý lỗi tùy biến (Custom Errors).
- Giúp phân loại rõ ràng đâu là lỗi mạng (Network Error), lỗi từ Server trả về, hay lỗi Client để tầng UI xử lý hiển thị thông điệp phù hợp.

- **`adapters.ts`**:
- Đóng vai trò là màng lọc/chuyển đổi dữ liệu.
- _Ví dụ:_ Nếu Backend trả về dữ liệu kiểu `snake_case` (`user_id`, `created_at`), bạn sẽ viết hàm biến đổi chúng thành `camelCase` (`userId`, `createdAt`) tại đây trước khi trả về cho tầng UI sử dụng.

- **`index.ts` (Ngoài cùng)**:
- Export lại (Re-export/Barrel file) các API Client, các hàm bổ trợ hoặc các Service để các Component phía UI chỉ cần import ngắn gọn từ `@/api`.

### 2. Tầng Nghiệp Vụ (Domain Services)

- **Thư mục `services/`**:
- Chứa các file đại diện cho từng module/thực thể cụ thể trong hệ thống (Ví dụ: `auth.ts`, `userProfiles.ts`,...).
- **Quy tắc:** Chỉ gọi các hàm HTTP (`client.get`, `client.post`) và định nghĩa kiểu dữ liệu (DTO - Data Transfer Object) cho Request và Response của riêng API đó.

---

## 🔄 Luồng Đi Của Dữ Liệu (Data Flow)

```text
[Component UI]
      │
      ▼
[services/auth.ts (Hàm login)]
      │
      ▼
[client.ts (Axios Instance + Tự động đính kèm token)]
      │
      ▼
( Gửi request lên Backend Server )
      │
      ▼
( Nhận response từ Server về client.ts )
      │
      ▼
[adapters.ts (Chuẩn hóa format data)]  ◀─── (Nếu có lỗi ──► [errors.ts])
      │
      ▼
[Trả về Dữ liệu Sạch & Đúng Type cho UI]

```

---

## 🛠️ Hướng dẫn viết thêm API mới

Khi bạn được giao nhiệm vụ làm một tính năng mới (Ví dụ: Quản lý Sản phẩm - `products`), hãy thực hiện theo đúng 3 bước sau:

### Bước 1: Khai báo Types (Nếu có dữ liệu chung) hoặc định nghĩa ngay trong service

Mở file `src/api/types.ts` (hoặc tạo file types riêng trong service nếu quá dài) để định nghĩa cấu trúc dữ liệu:

```typescript
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface CreateProductDTO {
  name: string;
  price: number;
  description: string;
}
```

### Bước 2: Tạo Service File mới

Tạo file `src/api/services/products.ts`:

```typescript
import apiClient from "../client";
import { ApiResponse } from "../types";
import { Product, CreateProductDTO } from "../types";

export const productInterface = {
  // Lấy danh sách sản phẩm
  getProducts: async (): Promise<ApiResponse<Product[]>> => {
    const response = await apiClient.get<ApiResponse<Product[]>>("/products");
    return response.data;
  },

  // Tạo mới sản phẩm
  createProduct: async (
    data: CreateProductDTO,
  ): Promise<ApiResponse<Product>> => {
    const response = await apiClient.post<ApiResponse<Product>>(
      "/products",
      data,
    );
    return response.data;
  },
};
```

### Bước 3: Đăng ký Service vào `services/index.ts`

Mở `src/api/services/index.ts` và export service mới thêm vào:

```typescript
export * from "./adapters";
export * from "./client";
export * from "./errors";
export * from "./services";
export * from "./types";
```

### 💡 Cách sử dụng ở phía Component UI:

```typescript
import { apiServices } from "@/api/services";

const fetchProducts = async () => {
  try {
    const res = await apiServices.product.getProducts();
    console.log("Danh sách sản phẩm: ", res.data);
  } catch (error) {
    console.error("Lỗi lấy sản phẩm: ", error);
  }
};
```

---

## ⚠️ Một số nguyên tắc cốt lõi cần tuân thủ

1. **Không tự ý config Axios thủ công ở UI**: Tất cả config (URL, Header, Auth) bắt buộc phải đi qua `client.ts`.
2. **Luôn định nghĩa Type rõ ràng**: Tuyệt đối không sử dụng kiểu `any` cho dữ liệu trả về từ API. Luôn bọc qua `ApiResponse<T>`.
3. **Giữ Service sạch sẽ**: Tầng service chỉ làm nhiệm vụ gọi API và trả data. Không xử lý logic hiển thị (như bật tắt loading, thông báo alert) ở trong file service.
