/**
 * File này chứa các hàm adapter để chuyển đổi dữ liệu giữa định dạng của API và định dạng mà ứng dụng sử dụng.
 */

export const toDateOnlyString = (value: Date) =>
  value.toISOString().split("T")[0];
