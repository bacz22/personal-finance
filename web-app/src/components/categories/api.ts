import { apiRequest } from '../../api'
import { type CategoryDraft, type CategoryItem, type CategoryType } from './types'
import { CATEGORY_ICON_OPTIONS } from './palette'

type ApiCategoryType = 'INCOME' | 'EXPENSE'

interface ApiCategory {
  id: number
  name: string
  type: ApiCategoryType
  iconKey: string
  color: string
  description?: string
  active: boolean
  transactionCount: number
}

interface CategoryWriteRequest {
  name: string
  type: ApiCategoryType
  iconKey: string
  color: string
  description?: string
  active: boolean
}

function toUiCategory(category: ApiCategory): CategoryItem {
  const icon = CATEGORY_ICON_OPTIONS.find((option) => option.id === category.iconKey)
    ?? CATEGORY_ICON_OPTIONS.find((option) => option.id === 'more-horizontal')!

  return {
    id: String(category.id),
    name: category.name,
    type: category.type === 'INCOME' ? 'income' : 'expense',
    icon: icon.icon,
    color: category.color,
    status: category.active ? 'active' : 'inactive',
    transactionCount: category.transactionCount,
    description: category.description,
  }
}

function toApiType(type: CategoryType): ApiCategoryType {
  return type === 'income' ? 'INCOME' : 'EXPENSE'
}

function toIconKey(icon: CategoryItem['icon']): string {
  return CATEGORY_ICON_OPTIONS.find((option) => option.icon === icon)?.id ?? 'more-horizontal'
}

function toWriteRequest(category: CategoryDraft | CategoryItem): CategoryWriteRequest {
  return {
    name: category.name.trim(),
    type: toApiType(category.type),
    iconKey: toIconKey(category.icon),
    color: category.color,
    description: category.description?.trim() || undefined,
    active: 'status' in category ? category.status === 'active' : true,
  }
}

export const categoriesApi = {
  list: async () => {
    const categories = await apiRequest<ApiCategory[]>('/api/v1/categories')
    return categories.map(toUiCategory)
  },

  create: async (category: CategoryDraft) => {
    const created = await apiRequest<ApiCategory>('/api/v1/categories', {
      method: 'POST',
      body: JSON.stringify(toWriteRequest(category)),
    })
    return toUiCategory(created)
  },

  update: async (category: CategoryItem) => {
    const updated = await apiRequest<ApiCategory>(`/api/v1/categories/${category.id}`, {
      method: 'PUT',
      body: JSON.stringify(toWriteRequest(category)),
    })
    return toUiCategory(updated)
  },

  deactivate: (categoryId: string) =>
    apiRequest<void>(`/api/v1/categories/${categoryId}`, { method: 'DELETE' }),
}
