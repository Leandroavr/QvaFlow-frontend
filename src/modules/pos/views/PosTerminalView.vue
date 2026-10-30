<template>
  <div class="flex h-[calc(100vh-7rem)] flex-col gap-3">
    <!-- BARRA OPERACIONAL SUPERIOR: Control de Turno, Tickets en Espera y Atajos -->
    <div
      class="shadow-xs flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5"
    >
      <!-- Izquierda: Estado del Turno y Botón de Apertura / Cierre -->
      <div class="flex items-center gap-2.5">
        <a-tag
          :color="posStore.isShiftOpen ? 'success' : 'error'"
          class="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold"
        >
          <span
            class="h-2 w-2 rounded-full"
            :class="posStore.isShiftOpen ? 'animate-pulse bg-emerald-500' : 'bg-red-500'"
          ></span>
          <span>{{
            posStore.isShiftOpen
              ? `Turno Abierto: ${posStore.currentShift?.id}`
              : 'Turno de Caja Cerrado'
          }}</span>
        </a-tag>

        <!-- Botón para Abrir o Cerrar Turno -->
        <a-button
          v-if="!posStore.isShiftOpen"
          type="primary"
          size="small"
          class="border-none bg-emerald-600 text-xs font-semibold hover:bg-emerald-500"
          @click="openShiftModal('OPEN')"
        >
          Abrir Turno
        </a-button>

        <a-button
          v-else
          size="small"
          class="text-xs font-semibold text-slate-700 hover:border-red-400 hover:text-red-600"
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
          class="flex items-center gap-1 border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
          @click="isDailyRateModalVisible = true"
        >
          <span>💵 Tasa: 1 USD = {{ posStore.exchangeRates.USD }} CUP</span>
        </a-button>

        <!-- Historial de Ventas y Cuadres -->
        <a-button
          size="small"
          class="flex items-center gap-1 border-slate-300 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          @click="router.push('/sales-and-shifts')"
        >
          <span>🧾 Ventas y Cuadres</span>
        </a-button>

        <!-- Canje de Divisas en Mostrador -->
        <a-button
          size="small"
          class="flex items-center gap-1 border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          @click="isExchangeModalVisible = true"
        >
          <span>💱 Canje Divisas</span>
          <span class="rounded bg-blue-200/80 px-1 font-mono text-[10px]">F6</span>
        </a-button>

        <!-- Botón Poner en Espera (Hold F4) -->
        <a-button
          size="small"
          :disabled="posStore.cart.length === 0"
          class="flex items-center gap-1 border-amber-200 bg-amber-50 text-xs font-semibold text-amber-800 hover:bg-amber-100"
          @click="handleHoldOrder"
        >
          <span>⏸️ Suspender</span>
          <span class="rounded bg-amber-200/80 px-1 font-mono text-[10px]">F4</span>
        </a-button>

        <!-- Popover para Ver y Restaurar Tickets en Espera -->
        <a-popover title="Tickets en Espera" trigger="click" placement="bottomRight">
          <template #content>
            <div v-if="posStore.heldOrders.length > 0" class="w-64 space-y-2">
              <div
                v-for="order in posStore.heldOrders"
                :key="order.id"
                class="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-2 text-xs"
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
                    class="h-6 border-none bg-emerald-600 px-2 text-[11px]"
                    @click="posStore.restoreHeldOrder(order.id)"
                  >
                    Restaurar
                  </a-button>
                  <button
                    type="button"
                    class="p-1 text-slate-400 hover:text-red-500"
                    title="Descartar ticket"
                    @click="posStore.deleteHeldOrder(order.id)"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="py-2 text-center text-xs text-slate-400">
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
    <div class="flex flex-1 flex-col gap-4 overflow-hidden lg:flex-row">
      <!-- COLUMNA IZQUIERDA (70%): Catálogo y Buscador Pistola USB -->
      <div
        class="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:w-[68%]"
      >
        <!-- Barra Superior: Buscador Lector de Códigos y Filtro de Categorías -->
        <div class="shrink-0 space-y-3 border-b border-slate-100 pb-3">
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
                <SearchOutlined class="mr-1 text-base text-slate-400" />
              </template>
              <template #suffix>
                <div class="flex items-center gap-1.5">
                  <span class="rounded bg-slate-100 px-1 font-mono text-[10px] text-slate-400"
                    >F2</span
                  >
                  <BarcodeOutlined
                    class="text-lg text-emerald-600"
                    title="Lector de código USB listo"
                  />
                </div>
              </template>
            </a-input>

            <a-button
              size="large"
              class="flex items-center justify-center rounded-lg"
              title="Refrescar catálogo"
              @click="posStore.loadInitialData"
            >
              <ReloadOutlined />
            </a-button>
          </div>

          <!-- Píldoras de Categorías para Filtrado Táctil -->
          <div class="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              v-for="cat in posStore.categories"
              :key="cat"
              type="button"
              class="shrink-0 select-none rounded-lg px-3 py-1.5 font-medium transition-all"
              :class="[
                posStore.selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              ]"
              @click="posStore.selectedCategory = cat"
            >
              {{ cat === 'all' ? 'Todos los Productos' : cat }}
            </button>
          </div>
        </div>

        <!-- Grid de Productos (Scrollable) -->
        <div class="flex-1 overflow-y-auto pr-1 pt-3">
          <div
            v-if="posStore.filteredProducts.length > 0"
            class="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4"
          >
            <PosProductCard
              v-for="product in posStore.filteredProducts"
              :key="product.id"
              :product="product"
              @add="handleProductClick"
            />
          </div>

          <!-- Estado vacío -->
          <div v-else class="flex h-64 flex-col items-center justify-center text-slate-400">
            <div class="mb-2 text-4xl">🔍</div>
            <p class="text-sm font-medium">
              No se encontraron productos para "{{ posStore.searchQuery }}"
            </p>
            <button
              type="button"
              class="mt-1 text-xs text-emerald-600 hover:underline"
              @click="posStore.searchQuery = ''"
            >
              Limpiar búsqueda
            </button>
          </div>
        </div>
      </div>

      <!-- COLUMNA DERECHA (30%): Carrito de Venta y Multimoneda -->
      <div
        class="flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:w-[32%]"
      >
        <!-- Encabezado del Carrito -->
        <div
          class="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 p-3.5"
        >
          <div class="flex items-center gap-2">
            <ShoppingCartOutlined class="text-lg text-emerald-600" />
            <h3 class="m-0 text-sm font-bold text-slate-800">Carrito de Venta</h3>
            <span
              class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800"
            >
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
              class="cursor-pointer rounded px-2 py-1 text-xs font-semibold text-red-500 outline-none transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none"
            >
              Vaciar
            </button>
          </a-popconfirm>
        </div>

        <!-- Lista de Artículos en el Carrito (Scrollable) -->
        <div class="flex-1 space-y-2 overflow-y-auto p-3">
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
            class="flex h-full flex-col items-center justify-center p-6 text-center text-slate-400"
          >
            <div
              class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl"
            >
              🛒
            </div>
            <h4 class="m-0 text-sm font-semibold text-slate-600">Carrito Vacío</h4>
            <p class="mt-1 max-w-[200px] text-xs text-slate-400">
              Escanee con la pistola USB o seleccione productos del catálogo.
            </p>
          </div>
        </div>

        <!-- Panel Inferior: Resumen Multimoneda y Botón de Cobro (F8) -->
        <div class="shrink-0 space-y-3 border-t border-slate-200 bg-slate-50 p-4">
          <!-- Selector Ágil de Modalidad de Cobro (1-Click) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                Forma de Cobro:
              </span>
              <!-- Badge si está en USD canje o Transferencia -->
              <span
                v-if="posStore.paymentMode === 'USD_CASH'"
                class="rounded border border-amber-300 bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-900"
              >
                Canje: 1 USD = {{ posStore.effectiveRateUSD }} CUP (-10)
              </span>
              <span
                v-else-if="posStore.paymentMode === 'CUP_TRANSFER'"
                class="rounded border border-blue-200 bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-900"
              >
                📱 Transfermóvil / EnZona
              </span>
            </div>

            <!-- Botonera Ágil de 1 Clic -->
            <div class="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-200/80 p-1">
              <button
                type="button"
                class="flex cursor-pointer select-none flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-2 text-xs font-bold transition-all"
                :class="
                  posStore.paymentMode === 'CUP_CASH'
                    ? 'border-emerald-300 bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-400'
                    : 'border-transparent bg-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900'
                "
                @click="posStore.setPaymentMode('CUP_CASH')"
              >
                <span class="text-sm">💵</span>
                <span class="text-[11px] leading-tight">CUP Efectivo</span>
              </button>

              <button
                type="button"
                class="flex cursor-pointer select-none flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-2 text-xs font-bold transition-all"
                :class="
                  posStore.paymentMode === 'CUP_TRANSFER'
                    ? 'border-blue-700 bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
                    : 'border-transparent bg-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900'
                "
                @click="posStore.setPaymentMode('CUP_TRANSFER')"
              >
                <span class="text-sm">📱</span>
                <span class="text-[11px] leading-tight">CUP Transf.</span>
              </button>

              <button
                type="button"
                class="flex cursor-pointer select-none flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-2 text-xs font-bold transition-all"
                :class="
                  posStore.paymentMode === 'USD_CASH'
                    ? 'border-emerald-700 bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                    : 'border-transparent bg-transparent text-slate-600 hover:bg-white/60 hover:text-slate-900'
                "
                @click="posStore.setPaymentMode('USD_CASH')"
              >
                <span class="text-sm">🇺🇸</span>
                <span class="text-[11px] leading-tight">USD Efectivo</span>
              </button>
            </div>
          </div>

          <!-- Desglose de Tasas y Total -->
          <div class="shadow-xs space-y-1.5 rounded-lg border border-slate-200/80 bg-white p-3">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-slate-500">Equivalente USD (Base):</span>
              <span class="font-mono text-xs font-black text-slate-700">
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
              class="space-y-0.5 rounded-lg border-t border-dashed border-amber-200 bg-amber-50/70 p-2 pt-1.5 text-[11px] text-amber-900"
            >
              <div class="flex items-center justify-between">
                <span>Tasa Canje Aplicada:</span>
                <span class="font-mono font-bold">1 USD = {{ posStore.effectiveRateUSD }} CUP</span>
              </div>
              <div class="flex items-center justify-between text-slate-600">
                <span>Regla de Efectivo:</span>
                <span class="font-medium">Redondeo arriba (sin centavos)</span>
              </div>
              <div
                v-if="posStore.changeInCUPForRoundedUSD > 0"
                class="flex items-center justify-between border-t border-amber-200/60 pt-0.5 font-semibold text-emerald-700"
              >
                <span>Vuelto al cliente en CUP:</span>
                <span class="font-bold">{{
                  formatearMoneda(posStore.changeInCUPForRoundedUSD, 'CUP')
                }}</span>
              </div>
            </div>

            <!-- Desglose si es transferencia QR -->
            <div
              v-else-if="posStore.paymentMode === 'CUP_TRANSFER'"
              class="flex items-center justify-between rounded-lg border-t border-dashed border-blue-200 bg-blue-50/70 p-2 pt-1.5 text-[11px] text-blue-800"
            >
              <span>Canal de Cobro:</span>
              <span class="font-bold">Transfermóvil / EnZona (Sin vuelto físico)</span>
            </div>

            <div class="flex items-baseline justify-between border-t border-slate-100 pt-1">
              <span class="text-xs font-bold text-slate-700">Total a Cobrar:</span>
              <span
                class="text-xl font-black tracking-tight"
                :class="
                  posStore.paymentMode === 'CUP_TRANSFER' ? 'text-blue-600' : 'text-emerald-600'
                "
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
            class="flex h-12 items-center justify-center gap-2 border-none text-base font-bold shadow-md disabled:cursor-not-allowed disabled:bg-slate-300"
            :class="
              posStore.paymentMode === 'CUP_TRANSFER'
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            "
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
