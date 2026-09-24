import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  X,
  Plus,
  Check,
  TrendingDown,
  TrendingUp,
  Tag,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import {
  type CategoryDraft,
  type CategoryItem,
  type CategoryType,
} from './types'
import {
  CATEGORY_COLOR_PALETTE,
  CATEGORY_ICON_OPTIONS,
  type ColorSwatch,
  type CategoryIconOption,
} from './palette'
import { Tabs, Button, Badge, Textarea } from '../ui'
import { getCategoryBadgeStyle } from '@/tokens'
import { ApiError } from '../../api'

export interface AddCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newCategory: CategoryDraft) => Promise<void>
  existingCategories?: CategoryItem[]
  initialType?: CategoryType
}

interface IconCategoryTag {
  id: string
  label: string
  matchIds?: string[]
}

const ICON_CATEGORY_TAGS: IconCategoryTag[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'food', label: 'Ăn uống', matchIds: ['utensils', 'coffee', 'shopping-bag', 'shirt', 'shopping-cart'] },
  { id: 'home', label: 'Nhà cửa & Hóa đơn', matchIds: ['home', 'receipt', 'zap', 'smartphone', 'wifi'] },
  { id: 'transport', label: 'Đi lại', matchIds: ['car', 'fuel', 'bus', 'plane'] },
  { id: 'life', label: 'Đời sống', matchIds: ['film', 'music', 'gamepad', 'gift', 'heart-pulse', 'dumbbell', 'graduation-cap'] },
  { id: 'income', label: 'Tài chính', matchIds: ['briefcase', 'laptop', 'piggy-bank', 'wallet', 'coins', 'award', 'sparkles', 'layers', 'more-horizontal'] },
]

interface AddCategoryModalContentProps extends Omit<AddCategoryModalProps, 'isOpen'> {}

const AddCategoryModalContent: React.FC<AddCategoryModalContentProps> = ({
  onClose,
  onSuccess,
  existingCategories = [],
  initialType = 'expense',
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Form States
  const [name, setName] = useState('')
  const [type, setType] = useState<CategoryType>(initialType)
  const [selectedIconId, setSelectedIconId] = useState<string>(
    initialType === 'income' ? 'briefcase' : 'utensils'
  )
  const [selectedColorHex, setSelectedColorHex] = useState<string>(
    initialType === 'income' ? '#059669' : '#F97316'
  )
  const [description, setDescription] = useState('')

  // Icon category filter
  const [activeIconCategory, setActiveIconCategory] = useState<string>('all')

  // Validation & Submission
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Lấy icon và color swatch đang chọn
  const activeIconOption = useMemo<CategoryIconOption>(() => {
    return (
      CATEGORY_ICON_OPTIONS.find((i) => i.id === selectedIconId) ||
      CATEGORY_ICON_OPTIONS[0]
    )
  }, [selectedIconId])

  const activeColorSwatch = useMemo<ColorSwatch>(() => {
    return (
      CATEGORY_COLOR_PALETTE.find((c) => c.hex === selectedColorHex) ||
      CATEGORY_COLOR_PALETTE[0]
    )
  }, [selectedColorHex])

  // Lọc danh sách icon theo nhóm category
  const filteredIcons = useMemo(() => {
    if (activeIconCategory === 'all') {
      return CATEGORY_ICON_OPTIONS
    }
    const cat = ICON_CATEGORY_TAGS.find((c) => c.id === activeIconCategory)
    if (cat?.matchIds) {
      return CATEGORY_ICON_OPTIONS.filter((i) => cat.matchIds!.includes(i.id))
    }
    return CATEGORY_ICON_OPTIONS
  }, [activeIconCategory])

  // Quản lý autofocus và khóa cuộn trang
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const timer = setTimeout(() => {
      nameInputRef.current?.focus()
    }, 80)

    const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, isSubmitting])

  // Chuyển loại danh mục -> Cập nhật gợi ý màu và icon mặc định phù hợp
  const handleTypeChange = (newType: CategoryType) => {
    setType(newType)
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: '' }))
    }
    if (newType === 'income') {
      setSelectedColorHex('#059669') // Emerald cho thu nhập
      setSelectedIconId('briefcase')
      setActiveIconCategory('income')
    } else {
      setSelectedColorHex('#F97316') // Cam cho chi tiêu
      setSelectedIconId('utensils')
      setActiveIconCategory('food')
    }
  }

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    const trimmedName = name.trim()

    if (!trimmedName) {
      newErrors.name = 'Vui lòng nhập tên danh mục'
    } else if (trimmedName.length > 50) {
      newErrors.name = 'Tên danh mục không được vượt quá 50 ký tự'
    } else {
      // Kiểm tra trùng tên trong cùng loại (Chi tiêu hoặc Thu nhập)
      const duplicate = existingCategories.find(
        (c) =>
          c.type === type &&
          c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )
      if (duplicate) {
        newErrors.name = `Danh mục "${trimmedName}" đã tồn tại trong nhóm ${
          type === 'expense' ? 'Chi tiêu' : 'Thu nhập'
        }`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      nameInputRef.current?.focus()
      return
    }

    const newCategory: CategoryDraft = {
      name: name.trim(),
      type,
      icon: activeIconOption.icon,
      color: selectedColorHex,
      description: description.trim() || undefined,
    }
    setSubmitError('')
    setIsSubmitting(true)
    try {
      await onSuccess(newCategory)
      onClose()
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === 'CATEGORY_NAME_EXISTS') {
        setErrors((previous) => ({ ...previous, name: error.message }))
      } else if (error instanceof ApiError) {
        const nameError = error.fieldErrors.find((field) => field.field === 'name')
        if (nameError) setErrors((previous) => ({ ...previous, name: nameError.message }))
        setSubmitError(nameError ? '' : error.message)
      } else {
        setSubmitError('Không thể lưu danh mục lúc này. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const ActiveIcon = activeIconOption.icon

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/20 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (!isSubmitting) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-category-title"
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.12),0_4px_20px_rgba(0,0,0,0.04)] border border-white/80 dark:border-slate-700/60 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* 1. HEADER: TIÊU ĐỀ, PHỤ ĐỀ & NÚT ĐÓNG */}
        {/* ========================================================================= */}
        <div className="p-4 sm:px-6 sm:py-4.5 border-b border-white/60 dark:border-slate-800/60 flex items-center justify-between shrink-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/25 shadow-2xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="add-category-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug"
              >
                Thêm danh mục mới
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                Tạo nhóm thu hoặc chi tùy chỉnh để theo dõi dòng tiền
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* ========================================================================= */}
        {/* 2. BODY FORM (CUỘN NỘI DUNG MƯỢT MÀ, GỌN GÀNG) */}
        {/* ========================================================================= */}
        <form
          id="add-category-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-4.5"
        >
          {submitError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* 2.1 LIVE PREVIEW: XEM TRƯỚC DANH MỤC TRỰC QUAN GỌN GÀNG TINH TẾ */}
          <div className="p-4 rounded-2xl border border-white/90 dark:border-slate-700/70 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              {/* Selected Icon in Tinted Container using Design Tokens */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/60 dark:border-slate-700/50 shadow-2xs transition-all duration-300"
                style={getCategoryBadgeStyle(selectedColorHex)}
              >
                <ActiveIcon className="w-5 h-5 transition-transform duration-200" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                    {name.trim() || 'Tên danh mục mới...'}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900 shadow-2xs"
                    style={{ backgroundColor: selectedColorHex }}
                    title={activeColorSwatch.name}
                  />
                </div>

                <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Xem trước thẻ danh mục</span>
                </div>
              </div>
            </div>

            {/* Type Badge using shared Badge component */}
            <Badge
              variant={type === 'expense' ? 'expense' : 'income'}
              size="sm"
              className="shrink-0"
            >
              {type === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
            </Badge>
          </div>

          {/* 2.2 LOẠI DANH MỤC: CHI TIÊU HOẶC THU NHẬP (SEGMENTED CONTROL) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phân loại danh mục <span className="text-rose-500">*</span>
            </label>
            <Tabs<CategoryType>
              value={type}
              onChange={handleTypeChange}
              size="md"
              fullWidth
              containerClassName="w-full"
              tabs={[
                {
                  id: 'expense',
                  label: 'Chi tiêu',
                  icon: <TrendingDown className="w-4 h-4 text-rose-500" />,
                  activeColor: 'rose',
                },
                {
                  id: 'income',
                  label: 'Thu nhập',
                  icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
                  activeColor: 'emerald',
                },
              ]}
            />
          </div>

          {/* 2.3 TÊN DANH MỤC */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="category-name-input"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Tên danh mục <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono tabular-nums ${
                  name.length >= 50
                    ? 'text-rose-600 font-bold'
                    : 'text-slate-400'
                }`}
              >
                {name.length}/50 ký tự
              </span>
            </div>

            <div className="relative">
              <input
                ref={nameInputRef}
                id="category-name-input"
                type="text"
                value={name}
                maxLength={50}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: '' }))
                  }
                }}
                placeholder={
                  type === 'expense'
                    ? 'Ví dụ: Cơm trưa, Xăng xe, Mua sắm đồ tết...'
                    : 'Ví dụ: Tiền lương, Hoa hồng, Bán hàng online...'
                }
                className={`w-full h-11 px-4 text-sm bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/80 dark:border-slate-700/70 rounded-2xl shadow-2xs focus:bg-white/85 dark:focus:bg-slate-800/85 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-slate-400 text-slate-900 dark:text-slate-100 ${
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-500'
                    : 'border-white/80 dark:border-slate-700/70 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Inline validation error message */}
            {errors.name && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 animate-in fade-in duration-150">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* 2.4 CHỌN MÀU SẮC */}
          <div>
            <div className="mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Màu nhận diện <span className="text-rose-500">*</span>
              </label>
            </div>

            {/* Color Swatch Buttons Grid (6 cols mobile, 12 cols desktop) */}
            <div
              className="grid grid-cols-6 sm:grid-cols-12 gap-2 p-2 bg-[var(--glass-surface,rgba(255,255,255,0.5))] backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-800"
              role="radiogroup"
              aria-label="Chọn màu nhận diện cho danh mục"
            >
              {CATEGORY_COLOR_PALETTE.map((swatch) => {
                const isSelected = selectedColorHex === swatch.hex

                return (
                  <button
                    key={swatch.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={swatch.name}
                    title={swatch.name}
                    onClick={() => setSelectedColorHex(swatch.hex)}
                    className={`w-8 h-8 aspect-square rounded-full flex items-center justify-center transition-all cursor-pointer relative shadow-2xs hover:scale-110 active:scale-95 focus:outline-hidden mx-auto ${
                      isSelected
                        ? 'ring-2 ring-slate-900 dark:ring-white scale-105 shadow-sm'
                        : 'hover:opacity-90'
                    }`}
                    style={{ backgroundColor: swatch.hex }}
                  >
                    {isSelected && (
                      <Check className="w-4 h-4 text-white stroke-[3] drop-shadow-xs" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2.5 CHỌN ICON VỚI BỘ LỌC DANH MỤC NHANH */}
          <div>
            <div className="mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Biểu tượng <span className="text-rose-500">*</span>
              </label>
            </div>

            {/* Category Quick-Pick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-2">
              {ICON_CATEGORY_TAGS.map((tag) => {
                const isSelected = activeIconCategory === tag.id
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      setActiveIconCategory(tag.id)
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                        : 'bg-[var(--glass-surface,rgba(255,255,255,0.65))] backdrop-blur-sm text-slate-600 hover:bg-white border border-slate-200/60 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tag.label}
                  </button>
                )
              })}
            </div>

            {/* Icon Picker Grid */}
            <div
              className="grid grid-cols-6 gap-2 max-h-36 sm:max-h-40 overflow-y-auto overscroll-contain p-2 bg-[var(--glass-surface,rgba(255,255,255,0.5))] backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-800"
              role="radiogroup"
              aria-label="Chọn biểu tượng cho danh mục"
            >
              {filteredIcons.map((opt) => {
                const IconComp = opt.icon
                const isSelected = selectedIconId === opt.id

                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={opt.name}
                    title={opt.name}
                    onClick={() => setSelectedIconId(opt.id)}
                    className={`h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group backdrop-blur-sm ${
                      isSelected
                        ? 'bg-[var(--glass-surface,rgba(255,255,255,0.95))] shadow-xs ring-2'
                        : 'bg-[var(--glass-surface,rgba(255,255,255,0.6))] dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50'
                    }`}
                    style={{
                      color: isSelected ? selectedColorHex : undefined,
                      borderColor: isSelected ? selectedColorHex : undefined,
                    }}
                  >
                    <IconComp
                      className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                        isSelected
                          ? ''
                          : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100'
                      }`}
                    />
                  </button>
                )
              })}

              {filteredIcons.length === 0 && (
                <div className="col-span-full py-4 text-center text-xs text-slate-400">
                  Không có biểu tượng nào trong nhóm này
                </div>
              )}
            </div>
          </div>

          {/* 2.6 MÔ TẢ DANH MỤC: COMPONENT TEXTAREA DÙNG CHUNG */}
          <Textarea
            id="category-desc-input"
            label="Ghi chú mô tả (Tùy chọn)"
            value={description}
            maxLength={100}
            showCount
            countSuffix=""
            rows={2}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Thêm mô tả ngắn để ghi nhớ mục đích của danh mục này..."
          />
        </form>

        {/* ========================================================================= */}
        {/* 3. FOOTER: ACTIONS CANCEL & SAVE (STICKY, FULL TOUCH TARGETS 44PX) */}
        {/* ========================================================================= */}
        <div className="p-4 sm:px-6 sm:py-4.5 border-t border-white/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-end gap-3 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial sm:min-w-[100px] h-11 rounded-2xl font-semibold shadow-2xs"
          >
            Hủy
          </Button>

          <Button
            variant="primary"
            size="md"
            type="submit"
            form="add-category-form"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="Đang lưu..."
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="flex-1 sm:flex-initial sm:min-w-[140px] h-11 rounded-2xl font-bold shadow-md shadow-emerald-600/25"
          >
            Lưu danh mục
          </Button>
        </div>
      </div>
    </div>
  )
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  ...props
}) => {
  if (!isOpen) return null
  return <AddCategoryModalContent {...props} />
}
