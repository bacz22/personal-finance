# Ghi chú chi tiêu — Web UI

## Chạy giao diện

```bash
npm install
npm run dev
```

Mặc định Vite chạy tại `http://localhost:5175`, còn API chạy tại `http://localhost:8080`. Có thể ghi đè URL API trong file `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

## API đang kết nối

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me` (cập nhật họ tên)
- `PATCH /api/v1/users/me/password` (đổi mật khẩu, yêu cầu mật khẩu hiện tại)
- `GET /api/v1/categories` (danh sách danh mục của tài khoản)
- `POST /api/v1/categories` (tạo danh mục)
- `PUT /api/v1/categories/{id}` (cập nhật danh mục)
- `DELETE /api/v1/categories/{id}` (tạm ngưng danh mục)

Access token chỉ được giữ trong bộ nhớ của trình duyệt; refresh token do backend cấp qua HttpOnly cookie. Khi tải lại trang, giao diện thử khôi phục phiên bằng refresh cookie. Backend cần cho phép origin của web app và credentials trong CORS.
