# DESIGN SYSTEM MASTER SPECIFICATION
# Personal Finance Tracker (Quản Lý Chi Tiêu Cá Nhân)

> **Status**: Approved & Persisted
> **Target App**: Ghi chú chi tiêu / Personal Finance Web App
> **Tech Stack**: React 19 + Vite + TypeScript + Tailwind CSS v4 + Lucide React + React Router v7
> **Project Slug**: `personal-finance-tracker`
> **File Version**: 2.0.0 (Liquid Glass Revision)
> **Design Persona**: Trong suốt, Chiều sâu, Tinh tế, Hiện đại, Data-Focused

---

## 1. TỔNG QUAN & NGUYÊN TẮC THIẾT KẾ (DESIGN PHILOSOPHY)

### 1.1 Mục tiêu sản phẩm
Hỗ trợ người dùng cá nhân ghi chép thu/chi hằng ngày nhanh chóng (dưới 5 giây), tự động tổng hợp số liệu trực quan, theo dõi ngân sách theo danh mục và so sánh biến động chi tiêu qua từng tháng.

### 1.2 Định vị phong cách thiết kế — Liquid Glass
- **Liquid Glass (Kính lỏng)**: Toàn bộ hệ thống bề mặt (surface) được xây dựng như các lớp kính mờ trong suốt, xếp chồng theo chiều sâu (z-depth), khúc xạ ánh sáng và nội dung phía sau qua `backdrop-filter: blur()`. Đây là vật liệu chính thay cho các mặt phẳng đặc màu (opaque) trong bản gốc.
- **Trustworthy & Financial**: Vẫn giữ nguyên tắc tin cậy về số liệu — độ tương phản chữ/số trên nền kính phải luôn đạt WCAG AA dù nền là trong suốt; không để hiệu ứng kính làm giảm khả năng đọc số tiền.
- **Depth over Flat**: Thay vì phân cấp bằng shadow đơn thuần, hệ thống phân cấp bằng **độ mờ (blur radius)**, **độ trong suốt (opacity)** và **viền sáng khúc xạ (specular edge)** — lớp càng nổi (modal, dropdown) thì blur càng lớn, viền sáng càng rõ.
- **Light Refraction, không phải Gradient sến**: Không dùng gradient tím-hồng kiểu AI chatbot phẳng. Ánh sáng trên bề mặt kính đến từ **highlight viền trên (inset light)** kết hợp nền động (mesh gradient/aurora nhẹ phía sau lớp kính), không phải gradient tô trực tiếp lên chữ hay nút.
- **Iconography**: 100% sử dụng bộ icon SVG từ `lucide-react`, stroke-width giữ `1.75–2` để icon không bị "loãng" khi đặt trên nền kính mờ.

### 1.3 Thông số kỹ thuật thiết kế (Design Dimensions)
| Chiều đo (Dimension) | Mức độ | Diễn giải |
| :--- | :--- | :--- |
| **Density (Mật độ)** | **Khá cao (Compact / Medium-High)** | Tối ưu không gian hiển thị cho dashboard tài chính; các lớp kính xếp chồng vẫn phải giữ mật độ thông tin cao, không để hiệu ứng kính làm loãng bố cục. |
| **Motion (Chuyển động)** | **Thấp–Trung bình (150ms – 300ms)** | Micro-transitions ở hover/focus/active; thêm hiệu ứng "specular shift" nhẹ khi hover (viền sáng di chuyển theo con trỏ) nhưng vẫn tôn trọng `prefers-reduced-motion`. |
| **Variance (Độ biến thiên)** | **Trung bình (Medium)** | Component chuẩn hóa cao về layout/spacing, nhưng có 2–3 cấp độ "độ dày kính" (glass tiers) tùy ngữ cảnh (surface / elevated / overlay). |
| **Theme** | **Light-first, nền động (Dynamic light background)** | Nền tổng thể là gradient mesh sáng, êm dịu (không phải màu phẳng `bg-slate-50` đơn thuần) để các lớp kính phía trên có chất liệu để khúc xạ. |

---

## 2. COLOR SYSTEM & DESIGN TOKENS

Toàn bộ màu sắc được ánh xạ trực tiếp sang class Tailwind CSS v4 hoặc CSS custom properties. Với Liquid Glass, mỗi token bề mặt đi kèm 2 thành phần: **màu nền (tint)** dạng `rgba`/opacity thấp và **giá trị blur** tương ứng.

### 2.1 Nền động & Lớp kính (Background & Glass Surface Tokens)

| Token Name | Giá trị | Tailwind v4 Utility | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| `color-bg-app` | `radial-gradient(at 20% 0%, #EFF6FF 0%, #F8FAFC 45%, #ECFDF5 100%)` | `bg-[image:var(--bg-mesh)]` (custom property) | Nền tổng thể toàn trang — mesh gradient tĩnh, rất nhạt, đóng vai trò "ánh sáng nền" cho các lớp kính phía trên |
| `glass-surface-1` (Base) | `rgba(255,255,255,0.55)` + `blur(12px)` | `bg-white/55 backdrop-blur-md` | Card thường, sidebar, hàng bảng — lớp kính mỏng nhất |
| `glass-surface-2` (Elevated) | `rgba(255,255,255,0.65)` + `blur(20px)` | `bg-white/65 backdrop-blur-xl` | KPI card, panel biểu đồ, header sticky — lớp nổi hơn nền |
| `glass-surface-3` (Overlay) | `rgba(255,255,255,0.75)` + `blur(32px)` | `bg-white/75 backdrop-blur-2xl` | Modal, dropdown, popover, toast — lớp trên cùng, blur mạnh nhất |
| `glass-border-light` | `rgba(255,255,255,0.8)` (viền trên, mô phỏng ánh sáng hắt vào mép kính) | `border-t border-white/80` | Viền trên cùng mỗi khối kính — tạo hiệu ứng "specular edge" |
| `glass-border-base` | `rgba(148,163,184,0.25)` | `border border-slate-400/25` | Viền tổng thể quanh khối kính (3 cạnh còn lại) |
| `glass-noise-overlay` | SVG fractal-noise opacity `0.02–0.03` | class tùy chỉnh `.glass-grain` | Lớp nhiễu hạt cực nhẹ phủ lên kính để tránh cảm giác "nhựa giả", chỉ áp dụng cho `glass-surface-2`/`3` |

### 2.2 Bảng màu trung tính (Neutrals / Grayscale — dùng cho chữ & icon trên nền kính)
Thang màu Slate vẫn giữ nguyên vì độ tương phản đã được kiểm chứng trên nền kính trắng mờ:

| Token Name | Hex Code | Tailwind v4 Utility | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| `color-text-primary` | `#0F172A` | `text-slate-900` | Tiêu đề chính, số dư, số tiền quan trọng — luôn đủ tương phản trên `glass-surface-1/2/3` |
| `color-text-secondary` | `#334155` | `text-slate-700` | Label, đoạn văn mô tả (đậm hơn bản gốc 1 bậc vì nền kính làm giảm tương phản tự nhiên) |
| `color-text-muted` | `#64748B` | `text-slate-500` | Placeholder, thời gian phụ, đơn vị tiền tệ nhỏ |
| `color-text-subtle` | `#94A3B8` | `text-slate-400` | Icon phụ, trạng thái disabled |
| `color-border-subtle` | `rgba(226,232,240,0.6)` | `border-slate-200/60` | Đường kẻ chia cắt bên trong khối kính (dùng opacity thay vì màu đặc để không phá vỡ hiệu ứng trong suốt) |

> **Lưu ý bắt buộc về tương phản**: Vì nền là kính mờ (nội dung phía sau có thể thay đổi), mọi text `color-text-secondary` trở xuống phải được kiểm tra độ tương phản thực tế trên cả nền sáng nhất và tối nhất mà mesh gradient tạo ra. Nếu không đạt AA, tăng opacity của `glass-surface` chứa nó thêm một bậc thay vì đổi màu chữ.

### 2.3 Màu thương hiệu & Hành động chính (Brand & Primary Action)
Màu xanh ngọc lục bảo (Emerald) vẫn là brand color, nay được thể hiện qua **kính màu (tinted glass)** thay vì mặt phẳng đặc:

| Token Name | Giá trị | Tailwind v4 Utility | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| `color-primary-glass` | `rgba(16,185,129,0.16)` + `blur(16px)` | `bg-emerald-500/16 backdrop-blur-lg` | Nền badge, trạng thái hover subtle dạng kính màu |
| `color-primary-600` | `#059669` | `bg-emerald-600` | **Primary Brand Color** — nút CTA chính vẫn dùng mặt kính đặc hơn (opacity cao ~90%) để đảm bảo độ nổi bật và tương phản chữ trắng |
| `color-primary-700` | `#047857` | `bg-emerald-700` | Active / Hover của nút CTA chính |
| `color-primary-glow` | `0 0 24px rgba(16,185,129,0.35)` | `shadow-[0_0_24px_rgba(16,185,129,0.35)]` | Glow ánh sáng ngọc lục bảo hắt ra từ nút CTA chính, mô phỏng ánh sáng xuyên qua kính màu |

### 2.4 Màu ngữ nghĩa tài chính (Financial Semantic Colors)
> **Nguyên tắc kép (Double Encoding)** vẫn giữ nguyên: không bao giờ chỉ dùng màu sắc đơn thuần để truyền đạt trạng thái — luôn kèm icon mũi tên, dấu `+`/`-`, hoặc label chữ cụ thể. Trên nền kính, mỗi trạng thái nay là một "kính màu" bán trong suốt thay vì khối màu đặc.

| Ngữ nghĩa | Text Color | Glass Tint (nền) | Tailwind Class | Kèm ký hiệu bắt buộc |
| :--- | :--- | :--- | :--- | :--- |
| **Income (Thu nhập / Dương)** | `#047857` | `rgba(16,185,129,0.14)` | `text-emerald-700 bg-emerald-500/14 backdrop-blur-md border border-emerald-500/20` | Dấu `+` (ví dụ `+15.000.000 ₫`), Icon `TrendingUp` |
| **Expense (Chi tiêu / Âm)** | `#BE123C` | `rgba(225,29,72,0.14)` | `text-rose-700 bg-rose-500/14 backdrop-blur-md border border-rose-500/20` | Dấu `-` (ví dụ `-2.450.000 ₫`), Icon `TrendingDown` |
| **Success (Hoàn thành / Đạt chỉ tiêu)** | `#047857` | `rgba(16,185,129,0.14)` | `text-emerald-700 bg-emerald-500/14 backdrop-blur-md` | Icon `CheckCircle2`, label "Đạt mục tiêu" |
| **Warning (Cảnh báo 70%-99%)** | `#B45309` | `rgba(217,119,6,0.14)` | `text-amber-700 bg-amber-500/14 backdrop-blur-md border border-amber-500/20` | Icon `AlertTriangle`, label "Sắp chạm ngưỡng" |
| **Danger (Vượt ngân sách >= 100%)** | `#B91C1C` | `rgba(220,38,38,0.16)` | `text-red-700 bg-red-500/16 backdrop-blur-md border border-red-500/25` | Icon `AlertCircle`, label "Đã vượt hạn mức" |
| **Info / Balance (Số dư / Thông tin)** | `#1D4ED8` | `rgba(37,99,235,0.14)` | `text-blue-700 bg-blue-500/14 backdrop-blur-md border border-blue-500/20` | Icon `Wallet` / `Info` |

### 2.5 Bảng màu biểu đồ (Financial Chart Palette)
Giữ nguyên hue để đảm bảo tính nhận diện danh mục, nhưng khi vẽ trên nền kính (donut/bar), thêm lớp `fill-opacity: 0.9` và viền `stroke-white/40` mảnh 1px quanh mỗi lát cắt để tránh hiệu ứng màu "chìm" vào nền mờ:

| Danh mục mẫu | Token Chart | Hex Code | Mô tả cảm xúc / Thể loại |
| :--- | :--- | :--- | :--- |
| **Ăn uống & Ẩm thực** | `chart-1` | `#F97316` | Cam ấm (Food & Dining) |
| **Nhà cửa & Tiện ích** | `chart-2` | `#2563EB` | Xanh dương đậm (Housing & Bills) |
| **Đi lại & Xăng xe** | `chart-3` | `#0D9488` | Xanh mòng két (Transportation) |
| **Mua sắm cá nhân** | `chart-4` | `#8B5CF6` | Tím thanh lịch (Shopping) |
| **Giải trí & Du lịch** | `chart-5` | `#EC4899` | Hồng tươi (Entertainment) |
| **Sức khỏe & Y tế** | `chart-6` | `#06B6D4` | Xanh ngọc biển (Healthcare) |
| **Giáo dục & Học tập** | `chart-7` | `#10B981` | Xanh lá cây (Education) |
| **Khác / Dự phòng** | `chart-8` | `#64748B` | Xám trung tính (Miscellaneous) |

---

## 3. TYPOGRAPHY SYSTEM

Giữ nguyên font **Inter** — phù hợp với ngữ cảnh kính vì có độ tương phản nét chữ tốt, không bị "nhòe" khi đặt trên nền blur.

### 3.1 Cấu hình Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### 3.2 Thang kích thước chữ (Type Scale)
| Cấp bậc | Tailwind Class | Size / Line-height | Font Weight | Ngữ cảnh sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Display / Hero** | `text-3xl md:text-4xl` | 32px / 40px | Bold (700) | Banner trang chủ, số dư tổng lớn — có thể thêm `drop-shadow-sm` cực nhẹ để tách khỏi nền kính |
| **Heading 1 (H1)** | `text-2xl` | 24px / 32px | Bold (700) | Tiêu đề các trang (Dashboard, Giao dịch, Ngân sách) |
| **Heading 2 (H2)** | `text-lg` | 18px / 26px | SemiBold (600) | Tiêu đề card, tiêu đề section biểu đồ |
| **Heading 3 (H3)** | `text-base` | 16px / 24px | SemiBold (600) | Tên danh mục, tên nhóm giao dịch, modal title |
| **Body (Default)** | `text-sm` | 14px / 20px | Regular (400) | Nội dung form, bảng giao dịch, text giải thích |
| **Body Medium** | `text-sm` | 14px / 20px | Medium (500) | Label form, tên người dùng, tên action |
| **Caption / Small**| `text-xs` | 12px / 16px | Medium (500) | Ngày tháng, nhãn phụ, helper text, badge |
| **Micro / Tag** | `text-[11px]` | 11px / 14px | SemiBold (600) | Tỷ lệ phần trăm nhỏ trên progress bar |

### 3.3 Quy tắc trình bày số liệu tài chính (Financial Number Formatting)
1. **Font số cố định độ rộng**: Sử dụng `tabular-nums` (`font-feature-settings: 'tnum'`) cho tất cả các cột tiền tệ trong bảng và số KPI để các con số thẳng hàng khi scan dọc.
2. **Định dạng tiền tệ chuẩn**:
   - Định dạng: `xx.xxx.xxx ₫` (ngăn cách hàng nghìn bằng dấu chấm `.`, ký hiệu `₫` đặt sau và cách 1 dấu khoảng trắng).
   - Ví dụ chuẩn: `14.250.000 ₫`, `500.000 ₫`, `0 ₫`.
   - Thu nhập: `+28.500.000 ₫` (kèm class `text-emerald-700 font-semibold`).
   - Chi phí: `-14.250.000 ₫` (kèm class `text-rose-700 font-semibold`).
3. **Số liệu trên nền kính**: Với các con số Hero/Display đặt trực tiếp trên nền mesh gradient (không có glass-surface bọc), bắt buộc thêm `text-shadow: 0 1px 2px rgba(255,255,255,0.6)` (mô phỏng bằng `drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]`) để giữ độ rõ nét.

---

## 4. SPACING, ELEVATION, RADIUS & BORDER (Glass Depth System)

### 4.1 Thang khoảng trắng (Spacing Scale - 4px Grid)
Không đổi so với bản gốc:
- `space-1` (4px): Khoảng cách giữa icon và text nhỏ.
- `space-2` (8px): Khoảng cách giữa các chip, padding nút nhỏ.
- `space-3` (12px): Khoảng cách các thành phần con trong row/item.
- `space-4` (16px): Padding chuẩn trong card nhỏ, gap giữa các trường form.
- `space-5` (20px): Padding chuẩn cho Card Dashboard trên mobile.
- `space-6` (24px): Padding chuẩn cho Card Dashboard desktop, gap giữa các cột.
- `space-8` (32px): Khoảng cách giữa các khối lớn trên Dashboard.

### 4.2 Thang bo góc (Border Radius Scale)
Bo góc lớn hơn và liên tục hơn (continuous corner) để phù hợp với chất liệu kính — cạnh vuông sắc phá vỡ ảo giác "giọt kính":
- **Small (`rounded-xl` / 12px)**: Input form, dropdown button, badge tag, table rows.
- **Medium (`rounded-2xl` / 16px)**: Button chính, icon container, dropdown menu popover.
- **Large (`rounded-[28px]`)**: Card nội dung, KPI card, container biểu đồ, modal dialog.
- **Full (`rounded-full`)**: Avatar, status pill, notification dot, nút icon tròn (FAB "Thêm giao dịch" trên mobile).

### 4.3 Hệ thống chiều sâu kính (Glass Elevation Tiers)
Thay hoàn toàn hệ thống `shadow-sm/md/lg/2xl` bằng 3 tier kính, mỗi tier là tổ hợp **blur + opacity nền + viền sáng + bóng đổ màu trung tính nhạt** (không dùng bóng đen thuần):

| Tier | Class tổng hợp | Blur | Bóng đổ | Ứng dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Glass Tier 1 — Surface** | `bg-white/55 backdrop-blur-md border border-t-white/80 border-x-slate-200/40 border-b-slate-200/40 shadow-[0_2px_12px_rgba(15,23,42,0.06)]` | 12px | Rất nhạt | Card danh sách, hàng bảng, sidebar item |
| **Glass Tier 2 — Elevated** | `bg-white/65 backdrop-blur-xl border border-t-white/90 border-x-slate-200/50 border-b-slate-200/50 shadow-[0_8px_24px_rgba(15,23,42,0.08)]` | 20px | Trung bình | KPI card, panel biểu đồ, header sticky |
| **Glass Tier 3 — Overlay** | `bg-white/75 backdrop-blur-2xl border border-t-white/95 border-x-slate-200/60 border-b-slate-200/60 shadow-[0_16px_48px_rgba(15,23,42,0.14)]` | 32px | Rõ nét nhất | Modal, dropdown menu, popover, toast notification |

- **Hover trên khối kính**: Tăng nhẹ opacity nền lên +5–8% và blur lên +2px thay vì chỉ đổi shadow (`hover:bg-white/63 hover:backdrop-blur-lg transition-all duration-200`).
- **Specular edge bắt buộc**: Mọi khối `Tier 2` và `Tier 3` phải có `border-t` sáng hơn 3 cạnh còn lại (`border-t-white/80–95`) để mô phỏng ánh sáng hắt vào mép trên của kính.
- **Fallback không hỗ trợ `backdrop-filter`**: Dùng `bg-white/92` (gần như đặc) làm phương án dự phòng qua `@supports not (backdrop-filter: blur(1px))`.

---

## 5. QUY CHUẨN THÀNH PHẦN GIAO DIỆN (COMPONENT SPECIFICATIONS)

### 5.1 Buttons (Nút bấm)
Chuẩn hóa 5 biến thể button — nút Primary vẫn giữ độ đặc cao để đảm bảo độ nổi bật CTA, các nút còn lại dùng chất liệu kính:

1. **Primary Button (CTA chính)**:
   - *Class*: `bg-emerald-600/92 backdrop-blur-sm text-white font-medium hover:bg-emerald-700/95 active:scale-[0.98] border-t border-white/30 shadow-[0_4px_16px_rgba(5,150,105,0.35)] transition-all rounded-2xl px-4 py-2 text-sm flex items-center gap-2`
   - *Ứng dụng*: `+ Thêm giao dịch`, `Lưu thay đổi`, `Tạo tài khoản`.
2. **Secondary Button (Glass)**:
   - *Class*: `bg-white/55 backdrop-blur-md text-slate-700 font-medium border border-t-white/80 border-x-slate-200/40 border-b-slate-200/40 hover:bg-white/70 active:scale-[0.98] transition-all rounded-2xl px-4 py-2 text-sm flex items-center gap-2`
   - *Ứng dụng*: `Xuất báo cáo`, `Bộ lọc nâng cao`, `Hủy`.
3. **Outline Button (Thin Glass)**:
   - *Class*: `bg-white/30 backdrop-blur-sm border border-slate-300/50 text-slate-700 font-medium hover:bg-white/50 hover:border-slate-400/50 transition-all rounded-2xl px-4 py-2 text-sm flex items-center gap-2`
   - *Ứng dụng*: Chọn tháng/năm, Đăng xuất, Chi tiết.
4. **Ghost / Icon Button**:
   - *Class*: `text-slate-500 hover:text-slate-800 hover:bg-white/50 hover:backdrop-blur-sm rounded-full p-2 transition-colors`
   - *Ứng dụng*: Nút toggle mật khẩu, icon đóng modal, icon chuyển tháng.
5. **Danger Button (Glass)**:
   - *Class*: `bg-rose-500/14 backdrop-blur-md border border-rose-500/25 text-rose-700 hover:bg-rose-500/22 rounded-2xl px-4 py-2 text-sm font-medium transition-colors`
   - *Ứng dụng*: Xóa giao dịch, Đặt lại dữ liệu.
- **Trạng thái Disabled**: `opacity-45 saturate-50 cursor-not-allowed pointer-events-none` (giảm cả saturation để "kính" trông như bị phủ sương mù).
- **Trạng thái Submitting (Loading)**: Thay thế icon bên trái bằng Spinner SVG xoay đều, giữ nguyên kích thước nút, disable pointer.

### 5.2 Form Controls & Inputs
- **Label**: `text-xs font-semibold text-slate-700 mb-1.5 block`, không bao giờ dùng placeholder thay thế nhãn.
- **Input field tiêu chuẩn (Glass Input)**:
  - *Class*: `w-full px-3.5 py-2.5 bg-white/50 backdrop-blur-md border border-slate-200/60 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-600/60 transition-all`
  - *Lưu ý*: `focus:bg-white/80` tăng độ đặc khi focus để tối ưu độ đọc khi người dùng đang gõ số liệu.
- **Invalid / Error State**:
  - *Border & Ring*: `border-rose-400/60 focus:border-rose-500/70 focus:ring-rose-500/25 text-rose-900`
  - *Error Message*: `text-xs text-rose-700 mt-1 flex items-center gap-1 font-medium`.
- **Input Password**:
  - Tích hợp nút icon mắt `Eye` / `EyeOff` của Lucide ở góc phải bên trong ô input để bật/tắt hiển thị.
- **Input Tiền tệ (VND Input)**:
  - Có đơn vị `₫` ghim cố định ở góc phải (`text-slate-500 font-medium select-none pr-3`).
  - Text số căn phải (`text-right font-semibold text-slate-900 tabular-nums`).

### 5.3 KPI Dashboard Card (Glass Tier 2)
- **Cấu trúc**:
  - Header: Nhãn chỉ số nhỏ (`text-xs font-semibold text-slate-600`) + Icon container kính màu ở góc phải (`w-8 h-8 rounded-xl flex items-center justify-center bg-{semantic}-500/16 backdrop-blur-sm border border-{semantic}-500/20`).
  - Body: Con số giá trị VND lớn, in đậm (`text-2xl font-bold text-slate-900 tracking-tight`).
  - Footer: Thông tin phụ/so sánh (`text-xs text-slate-500` hoặc badge biến động `+12% so với tháng trước` dạng kính màu ngữ nghĩa).
- **Style container**: `bg-white/65 backdrop-blur-xl rounded-[28px] p-5 border border-t-white/90 border-x-slate-200/50 border-b-slate-200/50 shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:bg-white/72 hover:shadow-[0_12px_32px_rgba(15,23,42,0.10)] transition-all duration-200`.

### 5.4 Danh sách giao dịch & Table (Glass Tier 1)
- **Container bảng**: `bg-white/55 backdrop-blur-md rounded-[28px] border border-t-white/80 border-x-slate-200/40 border-b-slate-200/40 overflow-hidden`.
- **Header bảng**: `bg-white/40 backdrop-blur-sm border-b border-slate-200/50 text-xs font-semibold text-slate-600 sticky top-0`.
- **Cấu trúc hàng (Transaction Row)**:
  - Cột 1: Icon danh mục (hình tròn có nền kính màu pastel theo danh mục, `bg-{chart-color}/14 backdrop-blur-sm`).
  - Cột 2: Tên giao dịch / ghi chú (`font-semibold text-sm text-slate-900`) + Tên danh mục bên dưới (`text-xs text-slate-500`).
  - Cột 3 (desktop): Ngày thực hiện (`text-xs text-slate-500`).
  - Cột 4: Số tiền (căn phải, `tabular-nums`, kèm dấu `+` màu xanh hoặc dấu `-` màu đỏ) + Thao tác sửa/xóa khi hover.
  - **Hover hàng**: `hover:bg-white/40 transition-colors` (không dùng màu đặc để giữ hiệu ứng kính xuyên suốt cả bảng).
- **Empty State**:
  - Khối kính Tier 1 chứa icon nhạt (`text-slate-300`) + Dòng thông báo rõ ràng + CTA kích hoạt (ví dụ: "Chưa có giao dịch nào trong tháng này", nút "Thêm giao dịch ngay").

### 5.5 Modal & Dropdown (Glass Tier 3)
- **Modal Dialog**: `bg-white/75 backdrop-blur-2xl rounded-[28px] border border-t-white/95 border-x-slate-200/60 border-b-slate-200/60 shadow-[0_16px_48px_rgba(15,23,42,0.14)]`.
- **Overlay phía sau modal**: `bg-slate-900/20 backdrop-blur-sm` (không dùng đen đặc `bg-black/50` như thông thường — giữ tinh thần "kính chồng kính", lớp overlay cũng phải trong suốt).
- **Dropdown / Popover**: `bg-white/75 backdrop-blur-2xl border border-t-white/90 border-x-slate-200/50 border-b-slate-200/50 rounded-2xl shadow-[0_12px_32px_rgba(15,23,42,0.12)]`.

---

## 6. QUY TẮC BỐ CỤC & RESPONSIVE (LAYOUT & RESPONSIVE RULES)

### 6.1 Breakpoints hệ thống
- `sm`: **640px** (Mobile màn lớn)
- `md`: **768px** (Tablet portrait)
- `lg`: **1024px** (Tablet landscape / Laptop nhỏ)
- `xl`: **1280px** (Desktop chuẩn)
- `2xl`: **1536px** (Màn hình lớn)

### 6.2 Chiến lược điều hướng đa thiết bị (Responsive Navigation Matrix)
| Thiết bị | Điểm ngắt | Cơ chế Sidebar / Navigation |
| :--- | :--- | :--- |
| **Desktop** | `>= 1024px` | Sidebar kính cố định bên trái rộng **240px** (`bg-white/55 backdrop-blur-xl border-r border-white/60`, nổi trên nền mesh gradient, không chạm cạnh màn hình — có `margin` nhỏ + `rounded-r-[28px]` để trông như một "tấm kính lơ lửng"). Menu gồm Logo, Dashboard, Giao dịch, Ngân sách, Báo cáo, Danh mục, Cài đặt. Dưới đáy có Avatar, Tên người dùng và Đăng xuất. |
| **Tablet** | `768px - 1023px` | Sidebar tự động thu gọn thành **Icon Sidebar** (72px) cùng chất liệu kính, chỉ hiện icon kèm tooltip dạng kính (Tier 3) khi hover. |
| **Mobile** | `< 768px` | Ẩn sidebar hoàn toàn. Sử dụng **Bottom Navigation Bar kính** (`bg-white/70 backdrop-blur-2xl border-t border-white/70`) 4 mục chính (Dashboard, Giao dịch, Ngân sách, Thêm `+` dạng FAB tròn nổi `rounded-full` với glow emerald) hoặc Header Bar kính tích hợp Drawer Menu. Tuyệt đối không để vỡ ngang (`overflow-x-hidden`). |

### 6.3 Vùng nội dung chính (Main Content Area)
- Chiều rộng tối đa chuẩn: `max-w-7xl` (1280px), căn giữa màn hình với `mx-auto`.
- Padding biên: `px-4` trên mobile, `px-6` trên tablet, `px-8` trên desktop.
- Nền tổng thể (`color-bg-app`) là mesh gradient **cố định theo viewport** (`background-attachment: fixed` trên desktop) để khi cuộn trang, các khối kính phía trên luôn khúc xạ đúng phần ánh sáng nền tương ứng, tạo cảm giác chiều sâu nhất quán.
- Không để xảy ra lỗi horizontal scrollbar trên bất kỳ thiết bị nào từ 375px trở lên.

---

## 7. QUY CHUẨN BIỂU ĐỒ & VISUALIZATION (CHART GUIDELINES)

1. **Thư viện tiêu chuẩn**: Recharts (phù hợp tuyệt đối với React & Tailwind).
2. **Container biểu đồ**: Luôn đặt trong khối `Glass Tier 2` (`bg-white/65 backdrop-blur-xl rounded-[28px]`), không vẽ chart trực tiếp lên nền mesh gradient để tránh nhiễu thị giác.
3. **Biểu đồ cơ cấu chi tiêu (Donut Chart)**:
   - Tối đa hiển thị từ 5 - 6 lát cắt danh mục lớn nhất, các mục còn lại gộp vào "Khác" để tránh vụn biểu đồ.
   - Mỗi lát cắt thêm `stroke="rgba(255,255,255,0.5)"` độ dày 1–2px để phân tách rõ trên nền kính.
   - Luôn có Legend chú thích tên danh mục và tỷ lệ % bên cạnh.
   - Vùng trung tâm của Donut hiển thị tổng chi tiêu của kỳ đang chọn, nền vùng trung tâm dùng `Glass Tier 1` mỏng nếu cần đặt số bên trong.
4. **Biểu đồ xu hướng ngày (Daily Trend)**:
   - Sử dụng Line Chart hoặc Bar Chart đơn giản; trục X hiển thị ngày (1, 5, 10, 15...); trục Y làm tròn số tiền gọn (`2tr`, `4tr` thay vì chuỗi dài).
   - Tooltip hover: `bg-slate-900/80 backdrop-blur-md text-white text-xs rounded-xl p-2 shadow-[0_8px_24px_rgba(15,23,42,0.25)] border border-white/10`, hiển thị ngày chính xác và số tiền định dạng `xx.xxx.xxx ₫`.
5. **Trạng thái rỗng (Empty State)**:
   - Khi kỳ được chọn chưa có giao dịch nào, hiển thị khung `Glass Tier 1` có thông báo thân thiện kèm nút thêm giao dịch, tuyệt đối không render biểu đồ méo hoặc NaN%.

---

## 8. DANH MỤC ICON HỆ THỐNG (LUCIDE ICON REGISTRY)

| Chức năng / Danh mục | Tên Lucide Icon | Kích cỡ chuẩn (px) |
| :--- | :--- | :--- |
| **Logo / Ví tổng** | `Wallet` | 20px / 24px |
| **Dashboard** | `LayoutDashboard` | 20px |
| **Giao dịch** | `ReceiptText` / `ArrowLeftRight` | 20px |
| **Ngân sách** | `PieChart` / `PiggyBank` | 20px |
| **Báo cáo / Thống kê** | `BarChart3` | 20px |
| **Danh mục** | `Tags` / `FolderTree` | 20px |
| **Cài đặt** | `Settings` | 20px |
| **Thu nhập / Tăng** | `TrendingUp` | 16px / 18px |
| **Chi phí / Giảm** | `TrendingDown` | 16px / 18px |
| **Thời gian / Chọn tháng**| `Calendar` | 16px / 18px |
| **Tìm kiếm** | `Search` | 16px / 18px |
| **Bộ lọc** | `Filter` | 16px / 18px |
| **Thêm mới** | `Plus` | 16px / 18px |
| **Ẩn / Hiện mật khẩu** | `Eye` / `EyeOff` | 18px |
| **Thành công** | `CheckCircle2` | 18px |
| **Cảnh báo** | `AlertTriangle` | 18px |
| **Lỗi / Nguy hiểm** | `AlertCircle` | 18px |
| **Đăng xuất** | `LogOut` | 18px |

---

## 9. QUY TẮC BẢO TOÀN (PERSISTENCE & COMPLIANCE RULES)

> [!IMPORTANT]
> - Mọi prompt tiếp theo (từ **PROMPT 02** đến **PROMPT 11**) đều **BẮT BUỘC** phải tham chiếu và tuân thủ các quyết định trong file `MASTER.md` này.
> - **KHÔNG ĐƯỢC PHÉP** tùy tiện thay đổi font chữ, bảng mã màu semantic income/expense, hoặc tự thêm gradient tô trực tiếp lên chữ/nút (chỉ dùng gradient cho nền mesh phía sau các lớp kính).
> - **BẮT BUỘC** mọi surface mới (card, panel, sidebar, modal...) phải chọn đúng 1 trong 3 `Glass Tier` đã định nghĩa ở Mục 4.3 — không tự tạo giá trị blur/opacity tùy tiện ngoài 3 tier này.
> - **BẮT BUỘC** kiểm tra tương phản chữ/số trên nền kính (xem lưu ý Mục 2.2) trước khi đưa component vào production; nếu không đạt AA, tăng opacity nền thay vì đổi màu chữ.
> - Khi bổ sung component mới, hãy sử dụng đúng class token đã được định nghĩa tại các mục 2, 4 và 5.