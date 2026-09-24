# Backend

## Cấu hình local

`compose.yaml` yêu cầu `POSTGRES_PASSWORD`; Spring Boot yêu cầu `DB_PASSWORD`.
Sao chép `.env.example` thành `backend/personalfinance/.env` rồi đặt hai biến mật khẩu theo mật khẩu PostgreSQL hiện tại. Backend tự nạp file này khi chạy từ thư mục gốc dự án hoặc `backend/personalfinance`; biến môi trường trong IDE hoặc terminal vẫn có thể ghi đè giá trị trong file. Nếu đang dùng volume PostgreSQL cũ, hãy nhập đúng mật khẩu đã khởi tạo volume; sửa biến môi trường không tự đổi mật khẩu trong database.

Không lưu mật khẩu thật vào `application.yaml` hay `.env.example`. Nếu app password SMTP trước đây đã được lưu trong YAML và chia sẻ, hãy thu hồi và tạo app password mới.

## Cấu hình SMTP cho khôi phục mật khẩu

API quên mật khẩu gửi một mật khẩu tạm qua SMTP. Mật khẩu tạm chỉ có hiệu lực 15 phút; sau khi đăng nhập bằng mật khẩu đó, người dùng phải đổi mật khẩu trước khi gọi các API nghiệp vụ.

Đặt các biến sau trong `backend/personalfinance/.env` hoặc cấu hình chạy của IDE/terminal. Không commit thông tin SMTP thật vào repository:

| Biến | Ý nghĩa |
| --- | --- |
| `SMTP_HOST` | Host SMTP của nhà cung cấp email |
| `SMTP_PORT` | Cổng SMTP, thường là `587` khi dùng STARTTLS |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | Thông tin xác thực SMTP |
| `MAIL_FROM` | Địa chỉ người gửi đã được nhà cung cấp xác minh |
| `SMTP_AUTH` | Đặt `true` khi nhà cung cấp yêu cầu xác thực |
| `SMTP_STARTTLS_ENABLE` / `SMTP_STARTTLS_REQUIRED` | Đặt `true` khi dùng STARTTLS |

Sau khi mật khẩu tạm được dùng để đăng nhập, nó bị vô hiệu hóa ngay. Nếu người dùng thoát trước khi đổi mật khẩu, họ cần gửi yêu cầu khôi phục mới.

Nếu SMTP từ chối gửi, API trả `503 PASSWORD_RECOVERY_MAIL_UNAVAILABLE` thay vì báo đã nhận yêu cầu thành công. Thay đổi mật khẩu tạm được rollback, lượt giới hạn yêu cầu được hoàn lại và hệ thống tạm ngừng thử gửi trong một phút để tránh lặp lại lỗi/quá hạn mức. Backend ghi lỗi gửi mail mà không ghi nội dung hoặc mật khẩu vào log. Với email không tồn tại, API vẫn trả lời chung; lỗi gửi cho email có tài khoản có thể làm lộ sự tồn tại của tài khoản, nên cần cân nhắc hàng đợi email khi triển khai công khai.
