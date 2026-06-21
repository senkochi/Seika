# Frontend State Management Architecture (Redux)

## Mục tiêu

Tài liệu này mô tả cấu trúc tổng quan của Redux trong frontend để thống nhất cách tổ chức state và giúp các thành viên hiểu luồng quản lý trạng thái khi phát triển hoặc mở rộng hệ thống.

Phạm vi tài liệu chỉ tập trung vào kiến trúc và tổ chức mã nguồn, không mô tả chi tiết logic nghiệp vụ.

---

# Thư mục

```text
src/
├── pages/
│
├── store/
│   ├── authSlice.ts
│   ├── ...(các slice khác)
│   ├── hooks.ts
│   └── index.ts
```

---

# Tổng quan kiến trúc

Frontend sử dụng:

- Redux Toolkit (RTK)
- React Redux
- Async Thunk cho bất đồng bộ
- Typed Hooks cho TypeScript

Kiến trúc được tổ chức theo hướng:

```text
UI Layer
   ↓
Redux Hooks
   ↓
Slice
   ↓
Async Actions (Thunk)
   ↓
API Layer
   ↓
Backend
```

---

# Thành phần chính

## 1. Store (`store/index.ts`)

Store đóng vai trò:

- Centralized State Container
- Quản lý toàn bộ global state
- Kết hợp các reducers
- Export type dùng cho toàn hệ thống

Các kiểu dữ liệu được export:

```text
RootState
AppDispatch
```

---

## 2. Typed Hooks (`store/hooks.ts`)

Cung cấp wrapper cho Redux hooks mặc định.

Mục tiêu:

- Chuẩn hóa cách truy cập state
- Tự động suy luận kiểu dữ liệu
- Tránh import trực tiếp `useDispatch` và `useSelector`

Expose:

```text
useAppDispatch()
useAppSelector()
```

Luồng sử dụng:

```text
Component
   ↓
useAppDispatch()
useAppSelector()
   ↓
Redux Store
```

---

## 3. Slice (`store/authSlice.ts`)

Mỗi domain state được quản lý thông qua một Redux Slice.

Cấu trúc của một Slice:

```text
State
Reducers
Async Actions
Extra Reducers
```

Trách nhiệm:

- Định nghĩa state của domain
- Xử lý cập nhật state
- Đồng bộ dữ liệu với API
- Điều phối trạng thái bất đồng bộ

---

# Auth Domain

Hiện tại hệ thống có:

```text
authSlice
```

Quản lý:

```text
Authentication State
```

Bao gồm:

```text
Token
User Identity
Roles
Request Status
Error State
Persistence
```

---

# Luồng dữ liệu

## Đọc dữ liệu

```text
Component
   ↓
useAppSelector()
   ↓
Redux Store
   ↓
Slice State
```

---

## Gửi hành động đồng bộ

```text
Component
   ↓
dispatch()
   ↓
Reducer
   ↓
Store Update
```

---

## Gửi hành động bất đồng bộ

```text
Component
   ↓
dispatch(asyncThunk)
   ↓
API Call
   ↓
fulfilled / rejected
   ↓
extraReducers
   ↓
Store Update
```

---

# Persistence Layer

Một số state có thể được duy trì sau khi reload.

Luồng:

```text
Storage
(local/session)
      ↓
State Hydration
      ↓
Redux Store
      ↓
Application Runtime
```

Redux là nguồn dữ liệu chạy chính trong runtime, storage chỉ dùng để khởi tạo hoặc đồng bộ.

---

# Quy tắc mở rộng

Khi thêm domain mới:

```text
store/
├── authSlice.ts
├── userSlice.ts
├── walletSlice.ts
├── quizSlice.ts
└── index.ts
```

Mỗi slice nên:

- Chỉ quản lý một domain
- Không truy cập trực tiếp state của slice khác
- Giao tiếp thông qua dispatch hoặc selector
- Giữ reducer thuần (predictable)

---

# Quy ước sử dụng

Component:

```text
useAppSelector()
useAppDispatch()
```

Không dùng:

```text
useSelector()
useDispatch()
```

---

# Nguyên tắc tổ chức

- Global state nằm trong Redux Store
- UI state cục bộ nằm trong component
- API interaction đi qua async thunk
- State được chia theo domain
- Mỗi domain có một slice riêng
