<template>
  <div class="h-[calc(100vh-7rem)] flex flex-col gap-3">
    <!-- BARRA OPERACIONAL SUPERIOR: Control de Turno, Tickets en Espera y Atajos -->
    <div class="bg-white rounded-xl border border-slate-200 px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
      <!-- Izquierda: Estado del Turno y Botón de Apertura / Cierre -->
      <div class="flex items-center gap-2.5">
        <a-tag
          :color="posStore.isShiftOpen ? 'success' : 'error'"
          class="px-2.5 py-1 text-xs font-bold flex items-center gap-1.5"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="posStore.isShiftOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'"
          ></span>
          <span>{{ posStore.isShiftOpen ? `Turno Abierto: ${posStore.currentShift?.id}` : 'Turno de Caja Cerrado' }}</span>
        </a-tag>

        <!-- Botón para Abrir o Cerrar Turno -->
        <a-button
          v-if="!posStore.isShiftOpen"
          type="primary"
          size="small"
          class="bg-emerald-600 hover:bg-emerald-500 border-none font-semibold text-xs"
          @click="openShiftModal('OPEN')"
        >
          Abrir Turno
        </a-button>

        <a-button
          v-else
          size="small"
          class="font-semibold text-xs text-slate-700 hover:text-red-600 hover:border-red-400"
          @click="openShiftModal('CLOSE')"
        >
          Arqueo / Cerrar Turno
        </a-button>
      </div>

      <!-- Centro / Derecha: Tasa del Día, Ventas/Cuadres, Canje Mostrador (F6), Tickets en Espera (F4) -->
      <div class="flex items-center gap-2">
        <!-- Tasa de Cambio del Día -->
        <a-button
          size="small"
          class="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-emerald-100"
          @click="isDailyRateModalVisible = true"
        >
          <span>💵 Tasa: 1 USD = {{ posStore.exchangeRates.USD }} CUP</span>
        </a-button>

        <!-- Historial de Ventas y Cuadres -->
        <a-button
          size="small"
          class="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-50 border-slate-300 hover:bg-slate-100"
          @click="router.push('/sales-and-shifts')"
        >
          <span>🧾 Ventas y Cuadres</span>
        </a-button>

        <!-- Canje de Divisas en Mostrador -->
        <a-button
          size="small"
          class="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
          @click="isExchangeModalVisible = true"
        >
          <span>💱 Canje Divisas</span>
          <span class="text-[10px] bg-blue-200/80 px-1 rounded font-mono">F6</span>
        </a-button>

        <!-- Botón Poner en Espera (Hold F4) -->
        <a-button
          size="small"
          :disabled="posStore.cart.length === 0"
          class="flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100"
          @click="handleHoldOrder"
        >
          <span>⏸️ Suspender</span>
          <span class="text-[10px] bg-amber-200/80 px-1 rounded font-mono">F4</span>
        </a-button>

        <!-- Popover para Ver y Restaurar Tickets en Espera -->
        <a-popover title="Tickets en Espera" trigger="click" placement="bottomRight">
          <template #content>
            <div v-if="posStore.heldOrders.length > 0" class="w-64 space-y-2">
              <div
                v-for="order in posStore.heldOrders"
                :key="order.id"
                class="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div class="font-bold text-slate-800">{{ order.name }}</div>
                  <div class="text-[10px] text-slate-400">
                    {{ order.createdAt }} • {{ formatearMoneda(order.totalCUP, 'CUP') }}
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <a-button
                    size="small"
                    type="primary"
                    class="bg-emerald-600 border-none text-[11px] h-6 px-2"
                    @click="posStore.restoreHeldOrder(order.id)"
                  >
                    Restaurar
                  </a-button>
                  <button
                    type="button"
                    class="text-slate-400 hover:text-red-500 p-1"
                    title="Descartar ticket"
                    @click="posStore.deleteHeldOrder(order.id)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-slate-400 text-center py-2">
              No hay tickets en espera.
            </div>
          </template>

          <a-badge :count="posStore.heldOrders.length" :offset="[-2, 2]">
            <a-button size="small" class="text-xs font-semibold">
              En Espera ({{ posStore.heldOrders.length }})
            </a-button>
          </a-badge>
        </a-popover>
      </div>
    </div>

    <!-- CUERPO PRINCIPAL: CATÁLOGO (70%) Y CARRITO (30%) -->
    <div class="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
      <!-- COLUMNA IZQUIERDA (70%): Catálogo y Buscador Pistola USB -->
      <div class="w-full lg:w-[68%] flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-hidden">
        <!-- Barra Superior: Buscador Lector de Códigos y Filtro de Categorías -->
        <div class="space-y-3 pb-3 border-b border-slate-100 shrink-0">
          <div class="flex items-center gap-3">
            <!-- Input optimizado para Pistolas USB (captura Enter automático) -->
            <a-input
              ref="searchInputRef"
              v-model:value="posStore.searchQuery"
              placeholder="Escanear código de barras o teclear producto (F2)..."
              size="large"
              class="flex-1 rounded-lg"
              allow-clear
              @keydown.enter="handleBarcodeScanned"
            >
              <template #prefix>
                <SearchOutlined class="text-slate-400 text-base mr-1" />
              </template>
              <template #suffix>
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] text-slate-400 font-mono bg-slate-100 px-1 rounded">F2</span>
                  <BarcodeOutlined class="text-emerald-600 text-lg" title="Lector de código USB listo" />
                </div>
              </template>
            </a-input>

            <a-button
              size="large"
              class="rounded-lg flex items-center justify-center"
              title="Refrescar catálogo"
              @click="posStore.loadInitialData"
            >
              <ReloadOutlined />
            </a-button>
          </div>

          <!-- Píldoras de Categorías para Filtrado Táctil -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              v-for="cat in posStore.categories"
              :key="cat"
              type="button"
              class="px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 select-none"
              :class="[
                posStore.selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              ]"
              @click="posStore.selectedCategory = cat"
            >
              {{ cat === 'all' ? 'Todos los Productos' : cat }}
            </button>
          </div>
        </div>

        <!-- Grid de Productos (Scrollable) -->
        <div class="flex-1 overflow-y-auto pt-3 pr-1">
          <div
            v-if="posStore.filteredProducts.length > 0"
            class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5"
          >
            <PosProductCard
              v-for="product in posStore.filteredProducts"
              :key="product.id"
              :product="product"
              @add="handleProductClick"
            />
          </div>

          <!-- Estado vacío -->
          <div
            v-else
            class="h-64 flex flex-col items-center justify-center text-slate-400"
          >
            <div class="text-4xl mb-2">🔍</div>
            <p class="text-sm font-medium">No se encontraron productos para "{{ posStore.searchQuery }}"</p>
            <button
              type="button"
              class="text-xs text-emerald-600 hover:underline mt-1"
              @click="posStore.searchQuery = ''"
            >
              Limpiar búsqueda
            </button>
          </div>
        </div>
      </div>

      <!-- COLUMNA DERECHA (30%): Carrito de Venta y Multimoneda -->
      <div class="w-full lg:w-[32%] flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <!-- Encabezado del Carrito -->
        <div class="p-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div class="flex items-center gap-2">
            <ShoppingCartOutlined class="text-emerald-600 text-lg" />
            <h3 class="font-bold text-slate-800 text-sm m-0">Carrito de Venta</h3>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {{ posStore.totalUnitsInCart }}
            </span>
          </div>

          <!-- Botón Vaciar Carrito -->
          <a-popconfirm
            v-if="posStore.cart.length > 0"
            title="¿Desea vaciar todos los artículos del carrito?"
            ok-text="Sí, vaciar"
            cancel-text="Cancelar"
            placement="bottomRight"
            overlay-class-name="min-w-[250px]"
            :ok-button-props="{ danger: true, type: 'primary' }"
            @confirm="posStore.clearCart"
          >
            <button
              type="button"
              class="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors px-2 py-1 rounded hover:bg-red-50 focus:outline-none outline-none cursor-pointer"
            >
              Vaciar
            </button>
          </a-popconfirm>
        </div>

        <!-- Lista de Artículos en el Carrito (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2">
          <template v-if="posStore.cart.length > 0">
            <PosCartItem
              v-for="item in posStore.cart"
              :key="item.id"
              :item="item"
              @update-quantity="posStore.updateQuantity"
              @remove="posStore.removeFromCart"
            />
          </template>

          <div
            v-else
            class="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center"
          >
            <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl mb-2">
              🛒
            </div>
            <h4 class="font-semibold text-slate-600 text-sm m-0">Carrito Vacío</h4>
            <p class="text-xs text-slate-400 mt-1 max-w-[200px]">
              Escanee con la pistola USB o seleccione productos del catálogo.
            </p>
          </div>
        </div>

        <!-- Panel Inferior: Resumen Multimoneda y Botón de Cobro (F8) -->
        <div class="p-4 border-t border-slate-200 bg-slate-50 shrink-0 space-y-3">
          <!-- Selector Ágil de Modalidad de Cobro (1-Click) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-slate-600 uppercase tracking-wide text-[11px]">
                Forma de Cobro:
              </span>
              <!-- Badge si está en USD canje o Transferencia -->
              <span
                v-if="posStore.paymentMode === 'USD_CASH'"
                class="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded border border-amber-300"
              >
                Canje: 1 USD = {{ posStore.effectiveRateUSD }} CUP (-10)
              </span>
              <span
                v-else-if="posStore.paymentMode === 'CUP_TRANSFER'"
                class="text-[10px] bg-blue-100 text-blue-900 font-bold px-1.5 py-0.5 rounded border border-blue-200"
              >
                📱 Transfermóvil / EnZona
              </span>
            </div>

            <!-- Botonera Ágil de 1 Clic -->
            <div class="grid grid-cols-3 gap-1.5 bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                class="py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer select-none"
                :class="posStore.paymentMode === 'CUP_CASH'
                  ? 'bg-white text-emerald-700 shadow-sm border-emerald-300 ring-1 ring-emerald-400'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 border-transparent'"
                @click="posStore.setPaymentMode('CUP_CASH')"
              >
                <span class="text-sm">💵</span>
                <span class="leading-tight text-[11px]">CUP Efectivo</span>
              </button>

              <button
                type="button"
                class="py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer select-none"
                :class="posStore.paymentMode === 'CUP_TRANSFER'
                  ? 'bg-blue-600 text-white shadow-sm border-blue-700 ring-1 ring-blue-500'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 border-transparent'"
                @click="posStore.setPaymentMode('CUP_TRANSFER')"
              >
                <span class="text-sm">📱</span>
                <span class="leading-tight text-[11px]">CUP Transf.</span>
              </button>

              <button
                type="button"
                class="py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer select-none"
                :class="posStore.paymentMode === 'USD_CASH'
                  ? 'bg-emerald-600 text-white shadow-sm border-emerald-700 ring-1 ring-emerald-500'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60 border-transparent'"
                @click="posStore.setPaymentMode('USD_CASH')"
              >
                <span class="text-sm">🇺🇸</span>
                <span class="leading-tight text-[11px]">USD Efectivo</span>
              </button>
            </div>
          </div>

          <!-- Desglose de Tasas y Total -->
          <div class="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-500 font-semibold">Equivalente USD (Base):</span>
              <span class="font-black text-slate-700 font-mono text-xs">
                ${{ posStore.totalUSD.toFixed(2) }} USD
              </span>
            </div>

            <div class="flex items-center justify-between text-xs text-slate-500">
              <span>Subtotal en CUP:</span>
              <span class="font-medium text-slate-800">
                {{ formatearMoneda(posStore.totalCUP, 'CUP') }}
              </span>
            </div>

            <!-- Desglose especial si se cobra en USD Efectivo (Margen Canje -10 CUP y Redondeo sin centavos) -->
            <div
              v-if="posStore.paymentMode === 'USD_CASH'"
              class="pt-1.5 border-t border-dashed border-amber-200 text-[11px] space-y-0.5 text-amber-900 bg-amber-50/70 p-2 rounded-lg"
            >
              <div class="flex items-center justify-between">
                <span>Tasa Canje Aplicada:</span>
                <span class="font-bold font-mono">1 USD = {{ posStore.effectiveRateUSD }} CUP</span>
              </div>
              <div class="flex items-center justify-between text-slate-600">
                <span>Regla de Efectivo:</span>
                <span class="font-medium">Redondeo arriba (sin centavos)</span>
              </div>
              <div
                v-if="posStore.changeInCUPForRoundedUSD > 0"
                class="flex items-center justify-between text-emerald-700 font-semibold pt-0.5 border-t border-amber-200/60"
              >
                <span>Vuelto al cliente en CUP:</span>
                <span class="font-bold">{{ formatearMoneda(posStore.changeInCUPForRoundedUSD, 'CUP') }}</span>
              </div>
            </div>

            <!-- Desglose si es transferencia QR -->
            <div
              v-else-if="posStore.paymentMode === 'CUP_TRANSFER'"
              class="pt-1.5 border-t border-dashed border-blue-200 text-[11px] text-blue-800 bg-blue-50/70 p-2 rounded-lg flex items-center justify-between"
            >
              <span>Canal de Cobro:</span>
              <span class="font-bold">Transfermóvil / EnZona (Sin vuelto físico)</span>
            </div>

            <div class="flex items-baseline justify-between pt-1 border-t border-slate-100">
              <span class="text-xs font-bold text-slate-700">Total a Cobrar:</span>
              <span
                class="text-xl font-black tracking-tight"
                :class="posStore.paymentMode === 'CUP_TRANSFER' ? 'text-blue-600' : 'text-emerald-600'"
              >
                {{ formatearMoneda(posStore.totalInSelectedCurrency, posStore.selectedCurrency) }}
              </span>
            </div>
          </div>

          <!-- Botón de Cobro Principal con atajo F8 -->
          <a-button
            type="primary"
            size="large"
            block
            :disabled="posStore.cart.length === 0"
            :loading="posStore.loading"
            class="h-12 border-none font-bold text-base flex items-center justify-center gap-2 shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed"
            :class="posStore.paymentMode === 'CUP_TRANSFER' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'"
            @click="openPaymentDrawer"
          >
            <DollarCircleOutlined class="text-lg" />
            <span>Cobrar (F8)</span>
          </a-button>
        </div>
      </div>
    </div>

    <!-- DRAWER LATERAL DE COBRO Y PASARELAS (EFECTIVO + QR) -->
    <PosPaymentDrawer
      v-model:visible="isPaymentDrawerVisible"
      :total-c-u-p="posStore.totalCUP"
      :total-in-currency="posStore.totalInSelectedCurrency"
      :currency="posStore.selectedCurrency"
      :exchange-rate="posStore.currentRate"
      :initial-payment-method="posStore.paymentMode === 'CUP_TRANSFER' ? 'TRANSFER_QR' : 'CASH'"
      :loading="posStore.loading"
      @confirm="handleConfirmPayment"
    />

    <!-- MODAL DE APERTURA / CIERRE Y ARQUEO DE TURNO -->
    <CashShiftModal
      v-model:visible="isShiftModalVisible"
      :mode="shiftModalMode"
      :shift="posStore.currentShift"
      :expected-c-u-p="posStore.expectedCUP"
      :expected-u-s-d="posStore.expectedUSD"
      :loading="posStore.loading"
      @open-shift="handleOpenShiftSubmit"
      @close-shift="handleCloseShiftSubmit"
    />

    <!-- MODAL DE CANJE DE DIVISAS EN MOSTRADOR (F6) -->
    <CurrencyExchangeModal
      v-model:visible="isExchangeModalVisible"
      :exchange-rates="posStore.exchangeRates"
      :loading="posStore.loading"
      @submit="handleExchangeSubmit"
    />

    <!-- MODAL DE TASA DE CAMBIO DEL DÍA -->
    <DailyExchangeRateModal v-model:visible="isDailyRateModalVisible" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  SearchOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  DollarCircleOutlined,
  BarcodeOutlined,
} from '@ant-design/icons-vue'
import usePosStore from '../store/posStore'
import PosProductCard from '../components/PosProductCard.vue'
import PosCartItem from '../components/PosCartItem.vue'
import PosPaymentDrawer from '../components/PosPaymentDrawer.vue'
import CashShiftModal from '../components/CashShiftModal.vue'
import CurrencyExchangeModal from '../components/CurrencyExchangeModal.vue'
import DailyExchangeRateModal from '../components/DailyExchangeRateModal.vue'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'
import type { PosProduct, PaymentCurrency, PaymentMethod, TransferGateway } from '../types/pos'

const router = useRouter()
const posStore = usePosStore()
const { formatearMoneda } = useFormatoMoneda()

// Control de vistas operacionales
const isPaymentDrawerVisible = ref<boolean>(false)
const isShiftModalVisible = ref<boolean>(false)
const isDailyRateModalVisible = ref<boolean>(false)
const shiftModalMode = ref<'OPEN' | 'CLOSE'>('OPEN')
const isExchangeModalVisible = ref<boolean>(false)
const searchInputRef = ref()

// 1. Manejador de Atajos Globales de Teclado
const handleGlobalKeydown = (e: KeyboardEvent) => {
  // F2: Enfocar buscador/lector USB
  if (e.key === 'F2') {
    e.preventDefault()
    searchInputRef.value?.focus()
  }

  // F4: Poner ticket en espera
  if (e.key === 'F4') {
    e.preventDefault()
    handleHoldOrder()
  }

  // F6: Abrir modal de canje de divisas
  if (e.key === 'F6') {
    e.preventDefault()
    isExchangeModalVisible.value = true
  }

  // F8: Abrir drawer de cobro
  if (e.key === 'F8') {
    e.preventDefault()
    openPaymentDrawer()
  }
}

onMounted(async () => {
  await posStore.loadInitialData()
  window.addEventListener('keydown', handleGlobalKeydown)
  searchInputRef.value?.focus()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

// 2. Captura automática para pistolas lectoras de códigos USB
const handleBarcodeScanned = () => {
  const query = posStore.searchQuery.trim()
  if (!query) return

  const success = posStore.addByBarcode(query)
  if (success) {
    posStore.searchQuery = '' // Limpiar para la siguiente pistola lectura
  }
}

const handleProductClick = (product: PosProduct) => {
  posStore.addToCart(product)
}

const handleHoldOrder = () => {
  posStore.holdCurrentCart()
}

const openPaymentDrawer = () => {
  if (posStore.cart.length > 0) {
    isPaymentDrawerVisible.value = true
  }
}

const handleConfirmPayment = async (payload: {
  cashReceived: number
  paymentMethod: PaymentMethod
  transferGateway?: TransferGateway
  transferReference?: string
}) => {
  const result = await posStore.processSale(payload)
  if (result) {
    isPaymentDrawerVisible.value = false
  }
}

// 3. Control de Turnos
const openShiftModal = (mode: 'OPEN' | 'CLOSE') => {
  shiftModalMode.value = mode
  isShiftModalVisible.value = true
}

const handleOpenShiftSubmit = async (payload: {
  initialCUP: number
  initialUSD: number
  cashierName: string
  dailyRateUSD: number
}) => {
  const ok = await posStore.openCashShift(
    payload.initialCUP,
    payload.initialUSD,
    payload.cashierName,
    payload.dailyRateUSD
  )
  if (ok) isShiftModalVisible.value = false
}

const handleCloseShiftSubmit = async (payload: {
  countedCUP: number
  countedUSD: number
  notes?: string
}) => {
  const ok = await posStore.closeCashShift(payload.countedCUP, payload.countedUSD, payload.notes)
  if (ok) isShiftModalVisible.value = false
}

// 4. Canje de Divisas
const handleExchangeSubmit = async (payload: {
  currencyFrom: PaymentCurrency
  amountFrom: number
  currencyTo: PaymentCurrency
  amountTo: number
  rate: number
}) => {
  const ok = await posStore.performCurrencyExchange(
    payload.currencyFrom,
    payload.amountFrom,
    payload.currencyTo,
    payload.amountTo,
    payload.rate
  )
  if (ok) isExchangeModalVisible.value = false
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
