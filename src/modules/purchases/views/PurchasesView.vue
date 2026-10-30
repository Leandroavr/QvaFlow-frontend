<template>
  <div class="space-y-4">
    <!-- Tarjetas KPI Superiores -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <!-- Total Comprado CUP -->
      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Comprado (CUP)
          </p>
          <h3 class="m-0 text-2xl font-bold text-slate-800">
            {{ formatearMoneda(purchasesStore.totalPurchasedAmountCUP, 'CUP') }}
          </h3>
          <span class="text-[11px] text-slate-400">Total en pesos</span>
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-xl font-bold text-emerald-600"
        >
          🇨🇺
        </div>
      </div>

      <!-- Total Comprado USD -->
      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Comprado (USD)
          </p>
          <h3 class="m-0 text-2xl font-bold text-emerald-700">
            ${{ purchasesStore.totalPurchasedAmountUSD.toLocaleString() }} USD
          </h3>
          <span class="text-[11px] text-slate-400">Total en dólares</span>
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl font-bold text-blue-600"
        >
          💵
        </div>
      </div>

      <!-- Facturas Pendientes de Recibir -->
      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-amber-600">Por Recibir</p>
          <h3 class="m-0 text-2xl font-bold text-amber-600">
            {{ purchasesStore.pendingInvoicesCount }} facturas
          </h3>
          <span class="text-[11px] font-medium text-amber-500">Pendientes de confirmar</span>
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-xl font-bold text-amber-600"
        >
          ⏳
        </div>
      </div>
    </div>

    <!-- Contenedor Principal: Filtros y Tabla Histórica de Facturas -->
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <!-- Barra Superior de Controles y Filtros -->
      <div class="mb-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div class="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <!-- Búsqueda rápida por número de factura o nombre de proveedor -->
          <a-input
            v-model:value="purchasesStore.searchQuery"
            placeholder="Buscar factura o proveedor..."
            class="w-full sm:w-64"
            allow-clear
          >
            <template #prefix>
              <SearchOutlined class="text-slate-400" />
            </template>
          </a-input>

          <!-- Filtro por Estado -->
          <a-select
            v-model:value="purchasesStore.statusFilter"
            :popup-match-select-width="false"
            :dropdown-match-select-width="false"
            class="w-full sm:min-w-[190px]"
          >
            <a-select-option value="all">Todos los estados</a-select-option>
            <a-select-option value="PENDIENTE">⏳ Pendientes de Entrada</a-select-option>
            <a-select-option value="CONFIRMADA">✓ Confirmadas (En Stock)</a-select-option>
          </a-select>

          <!-- Filtro por Moneda -->
          <a-select
            v-model:value="purchasesStore.currencyFilter"
            :popup-match-select-width="false"
            :dropdown-match-select-width="false"
            class="w-full sm:min-w-[130px]"
          >
            <a-select-option value="all">Todas divisas</a-select-option>
            <a-select-option value="CUP">🇨🇺 CUP</a-select-option>
            <a-select-option value="USD">💵 USD</a-select-option>
          </a-select>

          <!-- Botón Refrescar -->
          <a-button @click="purchasesStore.fetchPurchasesData">
            <template #icon><ReloadOutlined /></template>
          </a-button>
        </div>

        <!-- Botón para Registrar Nueva Factura -->
        <a-button
          type="primary"
          class="flex h-10 w-full items-center justify-center gap-2 border-none bg-emerald-600 px-5 text-sm font-semibold shadow-sm hover:bg-emerald-500 sm:w-auto"
          @click="openCreateDrawer"
        >
          <PlusOutlined class="text-base" />
          Registrar Factura
        </a-button>
      </div>

      <!-- Tabla de Facturas Históricas -->
      <a-table
        :columns="columns"
        :data-source="purchasesStore.filteredInvoices"
        :loading="purchasesStore.loading"
        :pagination="{
          pageSize: 8,
          showSizeChanger: true,
          showTotal: (total: number) => `Total ${total} facturas registradas`,
        }"
        row-key="id"
        class="overflow-x-auto"
      >
        <!-- Fila expandible con el detalle de productos y la localización asignada -->
        <template #expandedRowRender="{ record }">
          <div class="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <h5 class="mb-2 text-xs font-bold uppercase text-slate-700">
              Artículos en el documento y localización física de entrada:
            </h5>
            <div class="space-y-1.5 text-xs text-slate-700">
              <div
                v-for="item in record.items"
                :key="item.id"
                class="flex items-center justify-between border-b border-slate-200/50 py-1 last:border-0"
              >
                <div class="flex items-center gap-2">
                  <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <strong>{{ item.cantidad }} {{ item.unit }}</strong> de {{ item.productName }}
                  <span class="font-mono text-[10px] text-slate-400">({{ item.producto }})</span>
                  <span
                    class="py-0.2 rounded border border-blue-200 bg-blue-50 px-1.5 font-mono text-[11px] text-blue-700"
                  >
                    📍 Destino: {{ item.localizacion }}
                  </span>
                </div>
                <span class="font-medium text-slate-900">
                  @ {{ formatearMoneda(item.unitCost, record.moneda) }} =
                  <strong>{{ formatearMoneda(item.subtotal, record.moneda) }}</strong>
                </span>
              </div>
            </div>

            <div v-if="record.notes" class="mt-2 text-[11px] italic text-slate-500">
              Nota: {{ record.notes }}
            </div>
          </div>
        </template>

        <template #bodyCell="{ column, record }">
          <!-- Columna Número de Factura -->
          <template v-if="column.key === 'noDocument'">
            <div class="font-mono font-semibold text-slate-800">
              {{ record.noDocument }}
            </div>
          </template>

          <!-- Columna Proveedor (Texto libre) -->
          <template v-else-if="column.key === 'proveedor'">
            <div class="font-medium text-slate-800">{{ record.proveedor }}</div>
          </template>

          <!-- Columna Fecha (DD/MM/YYYY) -->
          <template v-else-if="column.key === 'fechaMovimiento'">
            <span class="font-mono text-xs text-slate-700">{{
              formatearFecha(record.fechaMovimiento)
            }}</span>
          </template>

          <!-- Columna Monto Total -->
          <template v-else-if="column.key === 'importeTotal'">
            <span class="font-bold text-slate-900">
              {{ formatearMoneda(record.importeTotal, record.moneda) }}
            </span>
          </template>

          <!-- Columna Estado usando Badges -->
          <template v-else-if="column.key === 'estado'">
            <a-tag
              :color="record.estado === 'CONFIRMADA' ? 'success' : 'warning'"
              class="px-2.5 py-0.5 text-xs font-semibold"
            >
              {{ record.estado === 'CONFIRMADA' ? '✓ En Stock' : '⏳ Pendiente' }}
            </a-tag>
          </template>

          <!-- Columna Acciones -->
          <template v-else-if="column.key === 'actions'">
            <div class="flex items-center gap-2">
              <a-popconfirm
                v-if="record.estado === 'PENDIENTE'"
                title="¿Confirmas que la mercancía ya llegó físicamente para ingresar las existencias al Stock?"
                ok-text="Sí, recibir y sumar stock"
                cancel-text="Cancelar"
                placement="bottomRight"
                overlay-class-name="min-w-[280px]"
                :ok-button-props="{ type: 'primary' }"
                @confirm="handleConfirmInvoice(record.id)"
              >
                <a-button
                  size="small"
                  type="primary"
                  class="h-7 border-none bg-emerald-600 text-xs font-semibold hover:bg-emerald-500"
                >
                  ✓ Recibir Stock
                </a-button>
              </a-popconfirm>
              <span v-else class="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <span>✓</span>
                <span>Procesada</span>
              </span>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <!-- Drawer Lateral para Registrar Nueva Factura / Albarán -->
    <PurchaseInvoiceDrawer
      v-model:visible="isDrawerVisible"
      :providers="purchasesStore.providers"
      :available-products="purchasesStore.availableProducts"
      :loading="purchasesStore.loading"
      @submit="handleSaveInvoice"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SearchOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons-vue'
import usePurchasesStore from '../store/purchasesStore'
import PurchaseInvoiceDrawer from '../components/PurchaseInvoiceDrawer.vue'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'
import { useFormatoFecha } from '@/shared/composables/useFormatoFecha'
import type { PurchaseInvoice, CreatePurchaseInvoiceDto } from '../types/purchases'

const purchasesStore = usePurchasesStore()
const { formatearMoneda } = useFormatoMoneda()
const { formatearFecha } = useFormatoFecha()

const isDrawerVisible = ref<boolean>(false)

// Columnas de la tabla de facturas
const columns = [
  {
    title: 'No. Factura',
    key: 'noDocument',
    dataIndex: 'noDocument',
    width: 150,
  },
  {
    title: 'Proveedor',
    key: 'proveedor',
    dataIndex: 'proveedor',
    sorter: (a: PurchaseInvoice, b: PurchaseInvoice) => a.proveedor.localeCompare(b.proveedor),
  },
  {
    title: 'Fecha',
    key: 'fechaMovimiento',
    dataIndex: 'fechaMovimiento',
    sorter: (a: PurchaseInvoice, b: PurchaseInvoice) =>
      a.fechaMovimiento.localeCompare(b.fechaMovimiento),
    width: 130,
  },
  {
    title: 'Importe Total',
    key: 'importeTotal',
    dataIndex: 'importeTotal',
    sorter: (a: PurchaseInvoice, b: PurchaseInvoice) => a.importeTotal - b.importeTotal,
    width: 160,
  },
  {
    title: 'Estado',
    key: 'estado',
    dataIndex: 'estado',
    width: 140,
  },
  {
    title: 'Acciones',
    key: 'actions',
    width: 140,
    align: 'center' as const,
  },
]

onMounted(() => {
  purchasesStore.fetchPurchasesData()
})

const openCreateDrawer = () => {
  isDrawerVisible.value = true
}

const handleSaveInvoice = async (dto: CreatePurchaseInvoiceDto) => {
  const ok = await purchasesStore.createInvoice(dto)
  if (ok) {
    isDrawerVisible.value = false
  }
}

const handleConfirmInvoice = async (invoiceId: string) => {
  await purchasesStore.confirmInvoice(invoiceId)
}
</script>
