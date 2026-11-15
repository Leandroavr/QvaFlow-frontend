import { ref, computed } from 'vue'
import type { PosProduct } from '../types'
import { salesService } from '@/services'

export function usePosCatalog() {
  const products = ref<PosProduct[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const searchQuery = ref<string>('')
  const selectedCategory = ref<string>('ALL')

  const loadProducts = async (warehouseId?: string): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      products.value = await salesService.getPosProducts({ warehouseId })
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al cargar el catálogo de productos.'
    } finally {
      loading.value = false
    }
  }

  const categories = computed<string[]>(() => {
    const set = new Set<string>()
    for (const p of products.value) {
      if (p.category) {
        set.add(p.category)
      }
    }
    return ['ALL', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  })

  const filteredProducts = computed<PosProduct[]>(() => {
    let list = products.value

    if (selectedCategory.value !== 'ALL') {
      const cat = selectedCategory.value.toLowerCase()
      list = list.filter((p) => p.category.toLowerCase() === cat)
    }

    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
      )
    }

    return list
  })

  const findProductByExactCode = (code: string): PosProduct | undefined => {
    const clean = code.trim().toLowerCase()
    if (!clean) return undefined
    return products.value.find((p) => p.code.toLowerCase() === clean)
  }

  return {
    products,
    loading,
    error,
    searchQuery,
    selectedCategory,
    categories,
    filteredProducts,
    loadProducts,
    findProductByExactCode,
  }
}
