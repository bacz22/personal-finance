# Kế hoạch triển khai production

Kiến trúc đã chuẩn bị: Cloudflare Pages cho UI tại `https://chitieu.bmailflow.online`, Render Free cho Spring Boot tại `https://api-chitieu.bmailflow.online`, Neon Free cho PostgreSQL. Cần quyền truy cập Cloudflare, Render, Neon và Spaceship; repo GitHub hiện để public để Render đọc mã nguồn.

## Đã cấu hình trong mã nguồn

- Backend chạy theo `PORT` do Render cấp; production bật profile `production`.
- Docker image chạy Java 21, non-root, giới hạn heap theo bộ nhớ gói free.
- `GET /actuator/health` là endpoint duy nhất được expose công khai; tắt discovery và ẩn chi tiết health.
- `MANAGEMENT_HEALTH_MAIL_ENABLED=false` trên Render vì khôi phục mật khẩu đang tắt; nếu không, Spring Boot vẫn thử SMTP localhost và đánh dấu health check là lỗi.
- CORS production chỉ cho origin UI chính thức, các method `GET, POST, PUT, PATCH, DELETE, OPTIONS`, headers `Authorization, Content-Type, X-Requested-With`; credentials được bật. Preflight `OPTIONS` được phép qua bộ lọc CORS trước xác thực Spring Security.
- Cookie refresh bật `Secure`; khôi phục mật khẩu tắt ở production, vẫn bật mặc định ở local. Đăng ký công khai được giữ nguyên.
- Các request API tối đa 90 giây; UI báo khi chờ hơn 3 giây và không tự gửi lại request. Khi timeout đăng ký, cần thử đăng nhập trước khi gửi lại để tránh tạo request trùng.
- Không có rate limit hiện tại. Đây là lựa chọn tạm cho demo, không phải biện pháp chống spam lâu dài.
- Bản offline thêm migration Flyway V6: cột version cho giao dịch, danh mục, ngân sách và bảng idempotency receipt. Đây là migration bổ sung, không nhập hoặc xóa dữ liệu người dùng.

## Thứ tự triển khai

1. Dùng Neon project Free hiện có, branch `production` tại Ohio. Giữ nguyên dữ liệu production; không drop database và không restore dữ liệu local. Kiểm tra usage trong Console định kỳ vì giới hạn Free có thể đổi.
2. Trước khi deploy backend, tạo một bản `pg_dump` của Neon để có điểm khôi phục. Khi API production khởi động, Flyway tự áp dụng V6. Sau deploy, xác nhận `flyway_schema_history` đạt version 6, các cột `version` và bảng `offline_operation_receipts` tồn tại. Không chạy SQL migration thủ công.
3. Tạo Render Web Service từ GitHub repo với Runtime Docker, root directory `backend/personalfinance`, region Ohio (gần Neon), health-check path `/actuator/health`, instance Free. Kiểm tra log build/start trước khi thêm DNS.
4. Thêm biến môi trường Render (secret nhập trực tiếp trong dashboard):

   | Key | Giá trị |
   | --- | --- |
   | `SPRING_PROFILES_ACTIVE` | `production` |
   | `SPRING_DATASOURCE_URL` | JDBC URL Neon, ví dụ `jdbc:postgresql://<host>/<database>?sslmode=require&channel_binding=require` |
   | `DB_USER` / `DB_PASSWORD` | Neon role/database credentials |
   | `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | Cặp RSA riêng production, không dùng key local |
   | `JWT_KEY_ID` | ID mới cho key production |
   | `CORS_ALLOWED_ORIGINS` | `https://chitieu.bmailflow.online` |
   | `REFRESH_COOKIE_SECURE` | `true` |
   | `PASSWORD_RECOVERY_ENABLED` | `false` |
   | `MANAGEMENT_HEALTH_MAIL_ENABLED` | `false` |
   | `DB_POOL_MAX_SIZE` / `DB_POOL_MIN_IDLE` | `5` / `0` |

   Không cần cấu hình SMTP cho đợt demo vì API quên mật khẩu đang tắt. Không bật ping cron để giữ Render thức.

5. Pages project `bmailflow-chitieu` đang ở chế độ Direct Upload. Build tại local từ `web-app` với `NODE_VERSION=22`, `VITE_API_BASE_URL=https://api-chitieu.bmailflow.online`, `VITE_PASSWORD_RECOVERY_ENABLED=false`; tải thư mục `dist` lên Pages sau khi API sẵn sàng. Direct Upload không tự deploy khi có commit mới; mỗi lần cập nhật cần build và upload thủ công.
6. Thêm custom domain `api-chitieu.bmailflow.online` trong Render, rồi tạo đúng DNS record Render hướng dẫn trong Cloudflare. Thêm `chitieu.bmailflow.online` trong Cloudflare Pages và hoàn tất record theo dashboard Pages. Không đoán target CNAME trước khi Render/Pages cấp host đích; chờ TLS active.
7. Trước khi đổi nameserver tại Spaceship, bảo toàn các bản ghi email đã nhập vào Cloudflare; chỉ đổi sau khi DNS cho cả API và Pages đã sẵn sàng. DNSSEC hiện đang bật ở Spaceship: phải tắt ngay trước khi chuyển nameserver và bật lại DNSSEC bằng cấu hình Cloudflare sau khi zone active. Việc tắt DNSSEC làm giảm bảo vệ DNS tạm thời; xác nhận với chủ dự án ngay trước thao tác. Chưa đổi nameserver trong lúc chờ service.
8. Trước khi nghiệm thu: test API health, kiểm tra danh sách actuator public chỉ có health; kiểm tra preflight từ origin UI; test đăng ký/đăng nhập/refresh/logout, CRUD transactions, dashboard/reports/budget, đồng bộ offline và xử lý xung đột, cookie Secure, link refresh trên route SPA, màn hình mobile và dark mode. Thử cold start một lần; chờ tối đa 90 giây, retry thủ công.

## Backup và lưu trữ

- Người thực hiện: chủ dự án, thủ công mỗi thứ Sáu và trước mỗi lần deploy có migration database.
- Dùng `pg_dump` custom-format cho Neon; lưu file tạm và file `.7z` đã mã hóa AES-256 trong `C:\Users\Admin\Documents\ghi-chu-chi-tieu-backups`, tuyệt đối không trong repo/OneDrive công khai.
- Tạo archive bằng 7-Zip GUI, format `7z`, bật encrypt file names, dùng AES-256 và passphrase dài riêng biệt; lưu passphrase trong password manager, không cùng thư mục backup.
- Giữ 4 bản backup hàng tuần gần nhất cùng bản trước migration cho đến khi nghiệm thu xong. Sau nghiệm thu, tiếp tục giữ rolling 4 tuần; xác nhận có thể mở archive và xem được dump sau mỗi lần tạo.
- Neon free có khôi phục tức thời giới hạn theo plan; không thay thế backup độc lập. Theo dõi storage/compute trong Console.

## Git, bí mật và rollback

- Chỉ commit `backend/`, `web-app/`, `.gitignore`, README và tài liệu deploy đã rà soát. Không commit `.env`, key, dump, backup, thư mục IDE/AI cá nhân hoặc tài liệu nguồn không cần thiết cho build.
- Nếu SMTP app password cũ từng nằm trong YAML/chat, thu hồi trước khi deploy. Không bật lại quên mật khẩu cho đến khi có SMTP provider ổn định và kiểm tra gửi mail thực tế.
- Trước nghiệm thu, không gộp một migration DB không thể đảo ngược với release ứng dụng. Nếu migration đã chạy, ưu tiên phát hành code tương thích/roll-forward; chỉ khôi phục backup khi chấp nhận mất các thay đổi phát sinh sau thời điểm backup.
- Nếu API deploy lỗi trước khi có người dùng, rollback Render về deploy trước và giữ nguyên Neon; không xóa database. Nếu code mới đã chạy migration thì không rollback code mù quáng về bản cũ.

## Điều kiện cần chủ dự án thao tác

- Giữ repository GitHub ở chế độ public trong thời gian Render dùng Public Git Repository; không cần cấp OAuth quyền đọc thêm repository.
- Nhập Neon credentials và JWT RSA key production trực tiếp vào Render dashboard; không gửi mật khẩu hoặc private key vào chat.
- Xác nhận nameserver cutover tại Spaceship khi DNS cho API/UI đã sẵn sàng; DNSSEC hiện đang bật.

Tài liệu nhà cung cấp: [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/), [Render Free services](https://render.com/docs/free), [Render health checks](https://render.com/docs/health-checks), [Render custom domains](https://render.com/docs/custom-domains), [Neon Free Plan](https://neon.com/blog/building-patterns-unlocked-by-scale-to-zero), [Neon connection strings](https://neon.com/docs/get-started/connect-neon).
