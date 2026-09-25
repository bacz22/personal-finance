# Backend

## Cấu hình local

`compose.yaml` yêu cầu `POSTGRES_PASSWORD`; Spring Boot yêu cầu `DB_PASSWORD`.
Sao chép `.env.example` thành `backend/personalfinance/.env` rồi đặt hai biến mật khẩu theo mật khẩu PostgreSQL hiện tại. Backend tự nạp file này khi chạy từ thư mục gốc dự án hoặc `backend/personalfinance`; biến môi trường trong IDE hoặc terminal vẫn có thể ghi đè giá trị trong file. Nếu đang dùng volume PostgreSQL cũ, hãy nhập đúng mật khẩu đã khởi tạo volume; sửa biến môi trường không tự đổi mật khẩu trong database.

Không lưu mật khẩu thật vào `application.yaml` hay `.env.example`. Backend không còn tích hợp SMTP; nếu app password SMTP cũ từng bị chia sẻ, hãy thu hồi tại nhà cung cấp.

Flyway migration V3 được giữ nguyên để bảo toàn lịch sử migration trên database hiện có; bảng và cột recovery cũ không còn được ứng dụng sử dụng.
