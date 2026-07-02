# Plan thiết kế nghiệp vụ cho role admin:
yêu cầu chung: Hiện tại đã có chức năng đầy đủ cho phần role Student và Teacher. Việc Route và thiết kế giao diện cho trang admin phải đảm bảo tính đồng bộ với 2 phần role kia về kiến trúc tổng quát (chỉ khác về nghiệp vụ chức năng và chi tiết các thành phần giao diện)
## Các nghiệp vụ cần thiết:
1. Quản lý người dùng:
- Xem danh sách Teacher/Student (theo role).
- Khóa / mở khóa tài khoản (khi Teacher tạo nội dung vi phạm, hoặc Student spam).
- Reset mật khẩu (Tạm thời hãy để vào trạng thái "Không khả dụng" trên UI).
2. Duyệt nội dung
- Teacher tạo Quiz/Flashcard → trạng thái PENDING → Admin duyệt → PUBLISHED mới hiện trên Marketplace.
NOTE: Hiện tại thì Teacher khi tạo Quiz/Flashcard thì được PUBLISHED luôn. Vì ta cần thêm nghiệp vụ của Admin này nên cũng cần phải đổi lại nghiệp vụ của Teacher là giờ cần phải gửi yêu cầu cho admin duyệt thì mới publish được.
3. Quản lý tỷ giá/ cấu hình hệ thống
- Cấu hình 1 coin= ? VNĐ
NOTE: Theo tôi nhớ thì cấu hình hiện tại đang hardcode tỷ giá này. Thay đổi sao cho admin được điều chỉnh tỷ giá này.
- Số coin khởi đầu của Student (Hiện tại đang được hardcode là 500)
- Số coin khởi đầu của Teacher (Hiện tại đang được hardcode là 0)
- Giới hạn khoảng giá mà Teacher được đặt trên mỗi sản phẩm.
- Số ngày cooldown để flashcard reward (Hiện tại thì đang hardcode 3 ngày)
4. Dashboard thống kê tổng quan
- Tổng số Teacher / Student.
- Tổng coin lưu hành nội bộ
NOTE:ở chức năng này thì hãy tùy biến theo các API đã có sẵn hoặc có thể tạo thêm API dựa trên các dữ liệu có sẵn.

## Lưu ý:
NOTE: Hãy tạo thêm Schema mới trong các Service có sẵn nếu cần. Nếu bắt buộc cần phải tạo thêm Service mới để thỏa tính Seperation of concern thì hỏi tôi trước (Tôi sẽ tự tạo Spring Project mới với boilerplate code để bạn edit, như vậy sẽ tiết kiệm token hơn).
NOTE: Thêm API nếu cần.