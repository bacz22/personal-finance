# Ghi chú chi tiêu

Ứng dụng quản lý tài chính cá nhân với giao diện React/Vite và API Spring Boot/PostgreSQL.

## Chạy local

1. Tạo `backend/personalfinance/.env` từ `.env.example` và điền cấu hình PostgreSQL local.
2. Từ thư mục gốc, chạy `docker compose --env-file backend/personalfinance/.env -f backend/personalfinance/compose.yaml up -d postgres`.
3. Chạy backend bằng `cd backend/personalfinance; .\mvnw.cmd spring-boot:run`.
4. Chạy frontend bằng `cd web-app; npm ci; npm run dev`.

Không commit `.env`, private key, database dump hoặc bản sao lưu. Ví dụ biến môi trường không chứa bí mật nằm trong `.env.example`.

## Triển khai

Hướng dẫn môi trường production, DNS, chuyển dữ liệu, sao lưu, nghiệm thu và rollback nằm trong [DEPLOYMENT.md](DEPLOYMENT.md).
