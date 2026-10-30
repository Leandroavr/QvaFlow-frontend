import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import purchasesService from '../services/purchasesService'
import useInventoryStore from '@/modules/inventory/store/inventoryStore'
import type { PurchaseInvoice, Provider, CreatePurchaseInvoiceDto } from '../types/purchases'

/**
 * Store Pinia para el módulo de Facturas de Compra (Sintaxis Setup).
 */
export const usePurchasesStore = defineStore('purchases', () => {
  const inventoryStore = useInventoryStore()

  // Estado Reactivo
  const invoices = ref<PurchaseInvoice[]>([])
  const providers = ref<Provider[]>([])
  const availableProducts = ref<
    { id: number; code: string; name: string; unit: string; defaultCost: number }[]
  >([])
  const loading = ref<boolean>(false)
  const searchQuery = ref<string>('')
  const statusFilter = ref<string>('all')
  const currencyFilter = ref<string>('all')

  // Getters Computados
  const filteredInvoices = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()

    return invoices.value.filter((inv) => {
      const matchQuery =
        !query ||
        inv.noDocument.toLowerCase().includes(query) ||
        inv.proveedor.toLowerCase().includes(query)

      const matchStatus = statusFilter.value === 'all' || inv.estado === statusFilter.value

      const matchCurrency = currencyFilter.value === 'all' || inv.moneda === currencyFilter.value

      return matchQuery && matchStatus && matchCurrency
    })
  })

  // Total acumulado comprado (CUP)
  const totalPurchasedAmountCUP = computed(() => {
    return invoices.value
      .filter((inv) => inv.moneda === 'CUP')
      .reduce((acc, inv) => acc + inv.importeTotal, 0)
  })

  // Total acumulado comprado (USD)
  const totalPurchasedAmountUSD = computed(() => {
    return invoices.value
      .filter((inv) => inv.moneda === 'USD')
      .reduce((acc, inv) => acc + inv.importeTotal, 0)
  })

  // Compras pendientes de recibir (Mercancía en camino)
  const pendingInvoicesCount = computed(() => {
    return invoices.value.filter((inv) => inv.estado === 'PENDIENTE').length
  })

  // Compras confirmadas en stock
  const confirmedInvoicesCount = computed(() => {
    return invoices.value.filter((inv) => inv.estado === 'CONFIRMADA').length
  })

  // Acciones

  /**
   * Carga facturas históricas, catálogo de proveedores y productos disponibles.
   */
  const fetchPurchasesData = async () => {
    loading.value = true
    try {
      const [invs, provs, prods] = await Promise.all([
        purchasesService.getInvoices(),
        purchasesService.getProviders(),
        purchasesService.getAvailableProducts(),
      ])
      invoices.value = invs
      providers.value = provs
      availableProducts.value = prods
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar compras'
      message.error(errorMsg)
    } finally {
      loading.value = false
    }
  }

  /**
   * Registra una nueva factura/albarán de entrada (inicia en 'PENDIENTE').
   */
  const createInvoice = async (dto: CreatePurchaseInvoiceDto): Promise<boolean> => {
    loading.value = true
    try {
      const created = await purchasesService.createInvoice(dto)
      invoices.value.unshift(created)
      message.success(`Factura "${created.noDocument}" registrada en estado Pendiente.`)
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar la factura'
      message.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Confirma la factura de compra y hace el ingreso real de las existencias al Stock.
   */
  const confirmInvoice = async (invoiceId: string): Promise<boolean> => {
    loading.value = true
    try {
      const updated = await purchasesService.confirmInvoice(invoiceId)
      const index = invoices.value.findIndex(
        (inv) => inv.id === invoiceId || inv.noDocument === invoiceId
      )
      if (index !== -1) {
        invoices.value[index] = updated
      }
      // Refrescar el inventario en pantalla para reflejar el nuevo stock
      await inventoryStore.fetchInventory()
      message.success(`Factura "${updated.noDocument}" confirmada. ¡Existencias añadidas al stock!`)
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al confirmar la factura'
      message.error(errorMsg)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // Estado
    invoices,
    providers,
    availableProducts,
    loading,
    searchQuery,
    statusFilter,
    currencyFilter,
    // Getters
    filteredInvoices,
    totalPurchasedAmountCUP,
    totalPurchasedAmountUSD,
    pendingInvoicesCount,
    confirmedInvoicesCount,
    // Acciones
    fetchPurchasesData,
    createInvoice,
    confirmInvoice,
  }
})

export default usePurchasesStore
