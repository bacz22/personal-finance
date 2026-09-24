import {
  Utensils,
  Coffee,
  ShoppingBag,
  Shirt,
  ShoppingCart,
  Home,
  Receipt,
  Zap,
  Smartphone,
  Wifi,
  Car,
  Plane,
  Fuel,
  Bus,
  Film,
  Music,
  Gamepad2,
  Gift,
  HeartPulse,
  Dumbbell,
  GraduationCap,
  Briefcase,
  Laptop,
  PiggyBank,
  Wallet,
  Coins,
  Award,
  Sparkles,
  Layers,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react'
import { CATEGORY_COLORS } from '@/tokens'

export interface ColorSwatch {
  id: string
  name: string
  hex: string
  twBg: string
  twRing: string
  tokenVar?: string
}

export const CATEGORY_COLOR_PALETTE: ColorSwatch[] = [
  {
    id: 'orange',
    name: 'Cam ấm (Ăn uống & Ẩm thực)',
    hex: '#F97316',
    twBg: 'bg-orange-500',
    twRing: 'ring-orange-400',
    tokenVar: CATEGORY_COLORS.food,
  },
  {
    id: 'blue',
    name: 'Xanh dương (Nhà ở & Tiện ích)',
    hex: '#3B82F6',
    twBg: 'bg-blue-500',
    twRing: 'ring-blue-400',
    tokenVar: CATEGORY_COLORS.housing,
  },
  {
    id: 'cyan',
    name: 'Xanh ngọc biển (Đi lại & Xăng xe)',
    hex: '#06B6D4',
    twBg: 'bg-cyan-500',
    twRing: 'ring-cyan-400',
    tokenVar: CATEGORY_COLORS.health,
  },
  {
    id: 'pink',
    name: 'Hồng tươi (Mua sắm & Làm đẹp)',
    hex: '#EC4899',
    twBg: 'bg-pink-500',
    twRing: 'ring-pink-400',
    tokenVar: CATEGORY_COLORS.entertainment,
  },
  {
    id: 'purple',
    name: 'Tím thanh lịch (Giải trí & Sách)',
    hex: '#8B5CF6',
    twBg: 'bg-purple-500',
    twRing: 'ring-purple-400',
    tokenVar: CATEGORY_COLORS.shopping,
  },
  {
    id: 'emerald',
    name: 'Xanh lục bảo (Lương & Tiết kiệm)',
    hex: '#10B981',
    twBg: 'bg-emerald-500',
    twRing: 'ring-emerald-400',
    tokenVar: CATEGORY_COLORS.education,
  },
  {
    id: 'yellow',
    name: 'Vàng hổ phách (Hóa đơn & Dịch vụ)',
    hex: '#EAB308',
    twBg: 'bg-yellow-500',
    twRing: 'ring-yellow-400',
    tokenVar: 'var(--cat-other, #EAB308)',
  },
  {
    id: 'red',
    name: 'Đỏ san hô (Sức khỏe & Y tế)',
    hex: '#EF4444',
    twBg: 'bg-red-500',
    twRing: 'ring-red-400',
    tokenVar: 'var(--color-danger, #EF4444)',
  },
  {
    id: 'rose',
    name: 'Hồng quyến rũ (Quà tặng & Thiện nguyện)',
    hex: '#F43F5E',
    twBg: 'bg-rose-500',
    twRing: 'ring-rose-400',
    tokenVar: 'var(--color-expense, #F43F5E)',
  },
  {
    id: 'teal',
    name: 'Xanh mòng két (Du lịch & Nghỉ dưỡng)',
    hex: '#14B8A6',
    twBg: 'bg-teal-500',
    twRing: 'ring-teal-400',
    tokenVar: CATEGORY_COLORS.transport,
  },
  {
    id: 'indigo',
    name: 'Xanh chàm (Freelance & Đầu tư)',
    hex: '#6366F1',
    twBg: 'bg-indigo-500',
    twRing: 'ring-indigo-400',
    tokenVar: CATEGORY_COLORS.invest,
  },
  {
    id: 'slate',
    name: 'Xám đá phiến (Khác / Dự phòng)',
    hex: '#64748B',
    twBg: 'bg-slate-500',
    twRing: 'ring-slate-400',
    tokenVar: CATEGORY_COLORS.other,
  },
]

export interface CategoryIconOption {
  id: string
  name: string
  icon: LucideIcon
  tags: string[]
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  // Ăn uống & Tiêu dùng
  { id: 'utensils', name: 'Ăn uống', icon: Utensils, tags: ['cơm', 'bún', 'ăn'] },
  { id: 'coffee', name: 'Cà phê / Đồ uống', icon: Coffee, tags: ['trà', 'nước', 'cafe'] },
  { id: 'shopping-bag', name: 'Mua sắm', icon: ShoppingBag, tags: ['đồ', 'chợ', 'shop'] },
  { id: 'shirt', name: 'Trang phục', icon: Shirt, tags: ['quần áo', 'giày dép'] },
  { id: 'shopping-cart', name: 'Siêu thị', icon: ShoppingCart, tags: ['tạp hóa', 'tiêu dùng'] },

  // Nhà cửa & Tiện ích
  { id: 'home', name: 'Nhà ở', icon: Home, tags: ['tiền nhà', 'thuê trọ'] },
  { id: 'receipt', name: 'Hóa đơn', icon: Receipt, tags: ['thanh toán', 'phiếu'] },
  { id: 'zap', name: 'Điện năng', icon: Zap, tags: ['điện', 'tiền điện'] },
  { id: 'smartphone', name: 'Điện thoại', icon: Smartphone, tags: ['viễn thông', 'cước'] },
  { id: 'wifi', name: 'Internet', icon: Wifi, tags: ['mạng', 'wifi'] },

  // Di chuyển & Du lịch
  { id: 'car', name: 'Đi lại / Xe cộ', icon: Car, tags: ['ô tô', 'taxi', 'grab'] },
  { id: 'fuel', name: 'Xăng dầu', icon: Fuel, tags: ['xăng xe', 'dầu'] },
  { id: 'bus', name: 'Xe bus / Tàu điện', icon: Bus, tags: ['công cộng', 'xe buýt'] },
  { id: 'plane', name: 'Du lịch / Vé bay', icon: Plane, tags: ['bay', 'khách sạn'] },

  // Đời sống & Phát triển
  { id: 'film', name: 'Giải trí / Phim ảnh', icon: Film, tags: ['rạp', 'cinema', 'video'] },
  { id: 'music', name: 'Âm nhạc', icon: Music, tags: ['nhạc', 'spotify', 'show'] },
  { id: 'gamepad', name: 'Trò chơi', icon: Gamepad2, tags: ['game', 'máy chơi'] },
  { id: 'gift', name: 'Quà tặng', icon: Gift, tags: ['sinh nhật', 'cưới', 'lễ'] },
  { id: 'heart-pulse', name: 'Sức khỏe / Y tế', icon: HeartPulse, tags: ['thuốc', 'khám'] },
  { id: 'dumbbell', name: 'Thể thao / Gym', icon: Dumbbell, tags: ['tập luyện', 'yoga'] },
  { id: 'graduation-cap', name: 'Giáo dục', icon: GraduationCap, tags: ['học phí', 'sách'] },

  // Thu nhập & Tài chính
  { id: 'briefcase', name: 'Lương / Công việc', icon: Briefcase, tags: ['tiền lương', 'công ty'] },
  { id: 'laptop', name: 'Freelance / Làm thêm', icon: Laptop, tags: ['dự án', 'ngoài giờ'] },
  { id: 'piggy-bank', name: 'Tiết kiệm', icon: PiggyBank, tags: ['heo đất', 'gửi tiết kiệm'] },
  { id: 'wallet', name: 'Ví tiền', icon: Wallet, tags: ['ngân hàng', 'tài khoản'] },
  { id: 'coins', name: 'Đầu tư / Cổ tức', icon: Coins, tags: ['lợi nhuận', 'chứng khoán'] },
  { id: 'award', name: 'Thưởng / Vinh danh', icon: Award, tags: ['bonus', 'kpi', 'thành tích'] },
  { id: 'sparkles', name: 'Thu nhập đặc biệt', icon: Sparkles, tags: ['may mắn', 'lộc'] },
  { id: 'layers', name: 'Nguồn khác', icon: Layers, tags: ['đa dạng', 'tổng hợp'] },
  { id: 'more-horizontal', name: 'Khác', icon: MoreHorizontal, tags: ['chưa phân loại'] },
]

/**
 * Tìm icon id tương ứng từ LucideIcon component
 */
export function findIconIdByIcon(icon: LucideIcon): string {
  const found = CATEGORY_ICON_OPTIONS.find((item) => item.icon === icon)
  return found ? found.id : 'more-horizontal'
}
