import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Plus,
  Tag,
  Layers,
  Search,
} from 'lucide-react'
import { Button, useToast, DataLoadError, Skeleton } from '../components/ui'
import {
  CategoryCard,
  CategoryFilterBar,
  CategoryStatsOverview,
  type CategoryItem,
  type CategoryType,
  type CategoryStatus,
  type CategoryDraft,
  AddCategoryModal,
  EditCategoryModal,
  categoriesApi,
} from '../components/categories'

export const CategoriesPage: React.FC = () => {
  const toast = useToast()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const loadCategories = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)
    try {
      setCategories(await categoriesApi.list())
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  // Quản lý Modal Thêm Danh Mục (Prompt 22)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Quản lý Modal Chỉnh Sửa & Disable Danh Mục
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Bộ lọc danh mục
  const [selectedType, setSelectedType] = useState<'all' | CategoryType>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | CategoryStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Thống kê số lượng theo từng nhóm
  const counts = useMemo(() => {
    return {
      all: categories.length,
      expense: categories.filter((c) => c.type === 'expense').length,
      income: categories.filter((c) => c.type === 'income').length,
      active: categories.filter((c) => c.status === 'active').length,
      inactive: categories.filter((c) => c.status === 'inactive').length,
    }
  }, [categories])

  // Lọc danh mục theo loại, trạng thái và từ khóa tìm kiếm
  const filteredCategories = useMemo(() => {
    return categories.filter((item) => {
      // Lọc theo Loại (Chi tiêu / Thu nhập / Tất cả)
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false
      }

      // Lọc theo Trạng thái (Đang sử dụng / Ngưng sử dụng / Tất cả)
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false
      }

      // Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchName = item.name.toLowerCase().includes(query)
        const matchDesc = item.description?.toLowerCase().includes(query) || false
        if (!matchName && !matchDesc) return false
      }

      return true
    })
  }, [categories, selectedType, selectedStatus, searchQuery])

  // Handlers cho các action
  const handleAddCategoryClick = () => {
    setIsAddModalOpen(true)
  }

  const handleAddCategorySuccess = async (newCategory: CategoryDraft) => {
    const created = await categoriesApi.create(newCategory)
    setCategories((current) => [...current, created])
    toast.success('Đã tạo danh mục.')
  }

  const handleEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat)
    setIsEditModalOpen(true)
  }

  const handleUpdateCategory = async (updatedCategory: CategoryItem) => {
    const saved = await categoriesApi.update(updatedCategory)
    setCategories((current) => current.map((category) =>
      category.id === saved.id ? saved : category,
    ))
    toast.success('Đã cập nhật danh mục.')
  }

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ========================================================================= */}
      {/* 1. HEADER TRANG DANH MỤC & ACTION + THÊM DANH MỤC */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3 pb-4 sm:pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
              Danh mục thu chi
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900">
              <Tag className="w-3 h-3" />
              {counts.all}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-normal max-w-xl line-clamp-1 sm:line-clamp-none">
            Quản lý các nhóm chi tiêu và thu nhập cá nhân hóa để phân loại và theo dõi dòng tiền chính xác.
          </p>
        </div>

        {/* Nút Action: + Thêm danh mục */}
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleAddCategoryClick}
          className="shadow-sm shadow-emerald-600/20 cursor-pointer shrink-0"
        >
          <span className="hidden sm:inline">Thêm danh mục</span>
          <span className="sm:hidden">Thêm</span>
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* 2. THẺ CHỈ SỐ METRIC KIÊM BỘ LỌC LOẠI DANH MỤC TRỰC QUAN */}
      {/* ========================================================================= */}
      <CategoryStatsOverview
        total={counts.all}
        expenseCount={counts.expense}
        incomeCount={counts.income}
        activeCount={counts.active}
        inactiveCount={counts.inactive}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />

      {/* ========================================================================= */}
      {/* 3. THANH TÌM KIẾM & BỘ LỌC TRẠNG THÁI GỌN GÀNG */}
      {/* ========================================================================= */}
      <div className="bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <CategoryFilterBar
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          counts={counts}
        />
      </div>

      {/* ========================================================================= */}
      {/* 4. LƯỚI DANH SÁCH CÁC DANH MỤC (RESPONSIVE GRID) */}
      {/* ========================================================================= */}
      {isLoading ? (
        <div role="status" aria-label="Đang tải danh mục" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <DataLoadError
          title="Không thể tải danh mục"
          message="Hãy kiểm tra kết nối và thử tải lại danh sách."
          onRetry={() => void loadCategories()}
        />
      ) : filteredCategories.length === 0 ? (
        /* Empty State khi không tìm thấy danh mục */
        <div className="bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-10 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Không tìm thấy danh mục nào phù hợp
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `Không có danh mục nào chứa từ khóa "${searchQuery}". Vui lòng thử tìm kiếm với từ khóa khác.`
              : 'Hiện chưa có danh mục nào trong nhóm lọc này.'}
          </p>
          {(searchQuery || selectedStatus !== 'all' || selectedType !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedType('all')
                setSelectedStatus('all')
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Đặt lại tất cả bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div>
          {/* Section subtitle với số lượng kết quả */}
          <div className="flex items-center justify-between gap-2 mb-3.5 px-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {selectedType === 'expense'
                  ? 'Danh mục Chi tiêu'
                  : selectedType === 'income'
                  ? 'Danh mục Thu nhập'
                  : 'Tất cả danh mục'}{' '}
                ({filteredCategories.length})
              </h2>
            </div>
          </div>

          {/* Cards Grid: 1 cột trên Mobile, 2 cột trên Tablet, 3 cột trên Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onEdit={handleEditCategory}
              />
            ))}
          </div>
        </div>
      )}

      {/* MODAL THÊM DANH MỤC MỚI (PROMPT 22) */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddCategorySuccess}
        existingCategories={categories}
        initialType={selectedType === 'income' ? 'income' : 'expense'}
      />

      {/* MODAL CHỈNH SỬA & DISABLE/ENABLE DANH MỤC */}
      <EditCategoryModal
        isOpen={isEditModalOpen}
        category={editingCategory}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingCategory(null)
        }}
        onUpdate={handleUpdateCategory}
        existingCategories={categories}
      />
    </div>
  )
}
