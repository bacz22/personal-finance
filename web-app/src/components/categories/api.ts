import {
  createOfflineCategory,
  deactivateOfflineCategory,
  listOfflineCategories,
  updateOfflineCategory,
} from '../../offline/repository'
import { type CategoryDraft, type CategoryItem, type CategoryType } from './types'
import { CATEGORY_ICON_OPTIONS } from './palette'

type ApiCategoryType = 'INCOME' | 'EXPENSE'

interface ApiCategory {
  id: string
  name: string
  type: ApiCategoryType
  iconKey: string
  color: string
  description?: string | null
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
    description: category.description || undefined,
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
  list: async () => (await listOfflineCategories()).map((category) => toUiCategory(category)),

  create: async (category: CategoryDraft) => {
    const request = toWriteRequest(category)
    return toUiCategory(await createOfflineCategory({
      ...request,
      description: request.description ?? null,
    }, { ...request }))
  },

  update: async (category: CategoryItem) => {
    const request = toWriteRequest(category)
    const updated = await updateOfflineCategory({
      id: category.id,
      name: request.name,
      type: request.type,
      iconKey: request.iconKey,
      color: request.color,
      description: request.description ?? null,
      active: request.active,
      transactionCount: category.transactionCount ?? 0,
    }, { ...request })
    return toUiCategory(updated.data)
  },

  deactivate: async (categoryId: string) => {
    const category = await deactivateOfflineCategory(categoryId)
    return toUiCategory(category)
  },
}
