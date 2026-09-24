import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  X,
  Check,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  EyeOff,
  Hash,
  Save,
  CheckCircle2,
} from 'lucide-react'
import {
  type CategoryItem,
  type CategoryType,
  type CategoryStatus,
} from './types'
import {
  CATEGORY_COLOR_PALETTE,
  CATEGORY_ICON_OPTIONS,
  type ColorSwatch,
  type CategoryIconOption,
  findIconIdByIcon,
} from './palette'
import { Tabs, Button, Badge, Textarea } from '../ui'
import { getCategoryBadgeStyle } from '@/tokens'
import { ApiError } from '../../api'

export interface EditCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category: CategoryItem | null
  onUpdate: (updatedCategory: CategoryItem) => Promise<void>
  existingCategories?: CategoryItem[]
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

interface EditCategoryModalContentProps {
  category: CategoryItem
  onClose: () => void
  onUpdate: (updatedCategory: CategoryItem) => Promise<void>
  existingCategories?: CategoryItem[]
}

const EditCategoryModalContent: React.FC<EditCategoryModalContentProps> = ({
  category,
  onClose,
  onUpdate,
  existingCategories = [],
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Form States khởi tạo từ category
  const [name, setName] = useState(category.name)
  const [type, setType] = useState<CategoryType>(category.type)
  const [selectedIconId, setSelectedIconId] = useState<string>(() =>
    findIconIdByIcon(category.icon)
  )
  const [selectedColorHex, setSelectedColorHex] = useState<string>(category.color)
  const [status, setStatus] = useState<CategoryStatus>(category.status)
  const [description, setDescription] = useState(category.description || '')

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

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const trimmedName = name.trim()

    if (!trimmedName) {
      newErrors.name = 'Vui lòng nhập tên danh mục'
    } else if (trimmedName.length > 50) {
      newErrors.name = 'Tên danh mục không được vượt quá 50 ký tự'
    } else {
      // Kiểm tra trùng tên với danh mục khác cùng loại (trừ chính danh mục này)
      const isDuplicate = existingCategories.some(
        (c) =>
          c.id !== category.id &&
          c.type === type &&
          c.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )
      if (isDuplicate) {
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

    if (!validateForm()) {
      return
    }

    // Tạo object danh mục đã cập nhật
    const updatedCategory: CategoryItem = {
      ...category,
      name: name.trim(),
      type,
      icon: activeIconOption.icon,
      color: selectedColorHex,
      status,
      description: description.trim() || undefined,
    }

    setSubmitError('')
    setIsSubmitting(true)
    try {
      await onUpdate(updatedCategory)
      onClose()
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === 'CATEGORY_NAME_EXISTS') {
        setErrors((previous) => ({ ...previous, name: error.message }))
      } else if (error instanceof ApiError) {
        const nameError = error.fieldErrors.find((field) => field.field === 'name')
        if (nameError) setErrors((previous) => ({ ...previous, name: nameError.message }))
        setSubmitError(nameError ? '' : error.message)
      } else {
        setSubmitError('Không thể cập nhật danh mục lúc này. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const PreviewIcon = activeIconOption.icon

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-category-modal-title"
    >
      {/* 1. BACKDROP NỀN TRONG SUỐT NHẸ KÈM HIỆU ỨNG MỜ */}
      <div
        className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm transition-opacity duration-200"
      onClick={() => {
        if (!isSubmitting) onClose()
      }}
        aria-hidden="true"
      />

      {/* 2. MODAL CARD CONTAINER */}
      <div className="relative w-full max-w-lg bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.12),0_4px_20px_rgba(0,0,0,0.04)] border border-white/80 dark:border-slate-700/60 z-10 my-auto flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* ========================================================================= */}
        {/* HEADER MODAL */}
        {/* ========================================================================= */}
        <div className="p-4 sm:px-6 sm:py-4.5 border-b border-white/60 dark:border-slate-800/60 flex items-center justify-between shrink-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/60 dark:border-slate-700/60 shadow-2xs"
              style={getCategoryBadgeStyle(selectedColorHex)}
            >
              <PreviewIcon className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="edit-category-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug"
              >
                Chỉnh sửa danh mục
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cập nhật thông tin và trạng thái sử dụng của danh mục
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ chỉnh sửa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* BODY MODAL CÓ CUỘN NỘI DUNG */}
        {/* ========================================================================= */}
        <form
          id="edit-category-form"
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1"
        >
          {submitError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* 2.1 LIVE PREVIEW CARD */}
          <div className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-[var(--glass-surface,rgba(255,255,255,0.6))] backdrop-blur-sm flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50 shadow-2xs transition-all"
                style={getCategoryBadgeStyle(selectedColorHex)}
              >
                <PreviewIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">
                    {name.trim() || 'Tên danh mục'}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900 shadow-2xs"
                    style={{ backgroundColor: selectedColorHex }}
                  />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{category.transactionCount || 0} giao dịch liên kết</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant={type === 'expense' ? 'expense' : 'income'} size="sm">
                {type === 'expense' ? 'Chi tiêu' : 'Thu nhập'}
              </Badge>
              {status === 'active' ? (
                <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                  Đang dùng
                </Badge>
              ) : (
                <Badge variant="warning" size="sm" icon={<EyeOff className="w-3 h-3" />}>
                  Ngưng dùng
                </Badge>
              )}
            </div>
          </div>

          {/* 2.2 LOẠI DANH MỤC (CHI TIÊU / THU NHẬP) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Phân loại danh mục <span className="text-rose-500">*</span>
            </label>
            <Tabs<CategoryType>
              value={type}
              onChange={(newType) => {
                setType(newType)
                if (errors.name) setErrors({})
              }}
              size="sm"
              fullWidth
              tabs={[
                {
                  id: 'expense',
                  label: (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                      Chi tiêu
                    </span>
                  ),
                  activeColor: 'rose',
                },
                {
                  id: 'income',
                  label: (
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      Thu nhập
                    </span>
                  ),
                  activeColor: 'emerald',
                },
              ]}
            />
          </div>

          {/* 2.3 TRẠNG THÁI DANH MỤC: ĐANG SỬ DỤNG vs NGƯNG SỬ DỤNG (DISABLE) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Trạng thái sử dụng
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {status === 'active' ? 'Đang kích hoạt' : 'Đang tạm ngưng'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: Đang sử dụng (Active) */}
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  status === 'active'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800 bg-[var(--glass-surface,rgba(255,255,255,0.7))] backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        status === 'active'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        status === 'active'
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Đang sử dụng
                    </span>
                  </div>
                  {status === 'active' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Hiển thị khi thêm mới giao dịch
                </p>
              </button>

              {/* Option 2: Ngưng sử dụng (Disabled / Inactive) */}
              <button
                type="button"
                onClick={() => setStatus('inactive')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  status === 'inactive'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800 bg-[var(--glass-surface,rgba(255,255,255,0.7))] backdrop-blur-sm hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <EyeOff
                      className={`w-4 h-4 ${
                        status === 'inactive'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-400'
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        status === 'inactive'
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Ngưng sử dụng
                    </span>
                  </div>
                  {status === 'inactive' && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Ẩn khỏi danh mục chọn, giữ giao dịch cũ
                </p>
              </button>
            </div>
          </div>

          {/* 2.4 TÊN DANH MỤC */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="edit-category-name-input"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Tên danh mục <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                {name.length}/50
              </span>
            </div>

            <div className="relative">
              <input
                ref={nameInputRef}
                id="edit-category-name-input"
                type="text"
                value={name}
                maxLength={50}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors({})
                }}
                placeholder="Ví dụ: Ăn uống, Tiền điện, Lương tháng..."
                className={`w-full h-11 px-3.5 text-sm bg-[var(--glass-surface,rgba(255,255,255,0.75))] dark:bg-slate-800/75 backdrop-blur-[var(--glass-blur,16px)] border rounded-2xl focus:outline-hidden focus:ring-2 focus:bg-[var(--glass-surface,rgba(255,255,255,0.88))] dark:focus:bg-slate-800/88 transition-all placeholder-slate-400 text-slate-900 dark:text-slate-100 ${
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-white/80 dark:border-slate-700/70 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {errors.name && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-rose-500">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2.5 BẢNG CHỌN MÀU NHẬN DIỆN (12 NÚT TRÒN ĐỒNG BỘ 100%) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Màu nhận diện <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {activeColorSwatch.name.split(' (')[0]}
              </span>
            </div>

            <div
              className="grid grid-cols-6 gap-2.5 sm:gap-3 p-3 bg-[var(--glass-surface,rgba(255,255,255,0.5))] backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-800"
              role="radiogroup"
              aria-label="Bảng chọn màu sắc danh mục"
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

          {/* 2.6 CHỌN BIỂU TƯỢNG VỚI BỘ LỌC DANH MỤC */}
          <div>
            <div className="mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Biểu tượng <span className="text-rose-500">*</span>
              </label>
            </div>

            {/* Quick-Pick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-2">
              {ICON_CATEGORY_TAGS.map((tag) => {
                const isSelected = activeIconCategory === tag.id
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setActiveIconCategory(tag.id)}
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
            </div>
          </div>

          {/* 2.7 GHI CHÚ MÔ TẢ: COMPONENT TEXTAREA DÙNG CHUNG */}
          <Textarea
            id="edit-category-desc-input"
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
        {/* FOOTER: ACTIONS CANCEL & SAVE */}
        {/* ========================================================================= */}
        <div className="p-4 sm:px-6 sm:py-4.5 border-t border-white/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-end gap-3 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial sm:min-w-[100px] h-11 rounded-2xl font-semibold shadow-2xs cursor-pointer"
          >
            Hủy
          </Button>

          <Button
            variant="primary"
            size="md"
            type="submit"
            form="edit-category-form"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="Đang lưu..."
            leftIcon={<Save className="w-4 h-4" />}
            className="flex-1 sm:flex-initial sm:min-w-[140px] h-11 rounded-2xl font-bold shadow-md shadow-emerald-600/25 cursor-pointer"
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  )
}

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  category,
  ...props
}) => {
  if (!isOpen || !category) return null
  return <EditCategoryModalContent key={category.id} category={category} {...props} />
}
