import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import catalogService from '../services/catalogService'
import type { Product, CreateProductDto, UpdateProductDto } from '../types/product'

/**
 * Store Pinia para el catálogo de productos (Sintaxis Setup).
 */
export const useCatalogStore = defineStore('catalog', () => {
  // Estado
  const products = ref<Product[]>([])
  const loading = ref<boolean>(false)
  const searchQuery = ref<string>('')
  const selectedCategory = ref<string>('all')

  // Getters computados
  const categories = computed(() => {
    const list = new Set<string>()
    products.value.forEach((p) => {
      if (p.category) list.add(p.category)
    })
    return ['all', ...Array.from(list)]
  })

  const filteredProducts = computed(() => {
    return products.value.filter((product) => {
      const matchSearch =
        product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.value.toLowerCase())

      const matchCategory =
        selectedCategory.value === 'all' || product.category === selectedCategory.value

      return matchSearch && matchCategory
    })
  })

  const totalProducts = computed(() => products.value.length)
  const lowStockCount = computed(
    () => products.value.filter((p) => p.stock <= p.minStock && p.active).length
  )

  // Acciones
  const fetchProducts = async () => {
    loading.value = true
    try {
      products.value = await catalogService.getProducts()
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar productos'
      message.error(errorMsg)
    } finally {
      loading.value = false
    }
  }

  const createProduct = async (dto: CreateProductDto): Promise<boolean> => {
    loading.value = true
    try {
      const created = await catalogService.createProduct(dto)
      products.value.unshift(created)
      message.success(`Producto "${created.name}" registrado con éxito.`)
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al guardar el producto'
      message.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  const updateProduct = async (id: number, dto: UpdateProductDto): Promise<boolean> => {
    loading.value = true
    try {
      const updated = await catalogService.updateProduct(id, dto)
      const index = products.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        products.value[index] = updated
      }
      message.success(`Producto "${updated.name}" actualizado con éxito.`)
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar el producto'
      message.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteProduct = async (id: number): Promise<boolean> => {
    loading.value = true
    try {
      await catalogService.deleteProduct(id)
      products.value = products.value.filter((p) => p.id !== id)
      message.success('Producto eliminado del catálogo.')
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar el producto'
      message.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // Estado
    products,
    loading,
    searchQuery,
    selectedCategory,
    // Getters
    categories,
    filteredProducts,
    totalProducts,
    lowStockCount,
    // Acciones
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
})

export default useCatalogStore
