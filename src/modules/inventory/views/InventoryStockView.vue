<template>
  <div class="space-y-4">
    <!-- Fila Superior de Métricas / KPIs del Inventario -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Unidades Totales -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unidades Totales</p>
          <h3 class="text-2xl font-bold text-slate-800 m-0">{{ inventoryStore.totalStockUnits }}</h3>
          <span class="text-[11px] text-slate-400">Distribuidas en almacenes</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
          📦
        </div>
      </div>

      <!-- Valorización al Costo (Protegido por canViewCosts) -->
      <div
        v-if="authStore.canViewCosts"
        class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
      >
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor en Costo</p>
          <h3 class="text-xl font-bold text-slate-800 m-0">
            {{ formatearMoneda(inventoryStore.totalCostValue, 'CUP') }}
          </h3>
          <span class="text-[11px] text-slate-400">Capital invertido</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
          💰
        </div>
      </div>

      <!-- Stock Bajo (< 10) -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-amber-600 uppercase tracking-wider">Bajo Stock (&lt; 10)</p>
          <h3 class="text-2xl font-bold text-amber-600 m-0">{{ inventoryStore.lowStockCount }}</h3>
          <span class="text-[11px] text-amber-500 font-medium">Requieren reposición</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
          ⚠️
        </div>
      </div>

      <!-- Agotados (0) -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-red-600 uppercase tracking-wider">Agotados (0)</p>
          <h3 class="text-2xl font-bold text-red-600 m-0">{{ inventoryStore.outOfStockCount }}</h3>
          <span class="text-[11px] text-red-500 font-medium">Sin disponibilidad</span>
        </div>
        <div class="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-xl font-bold">
          🚫
        </div>
      </div>
    </div>

    <!-- Contenedor Principal: Filtros y Tabla de Existencias -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <!-- Barra Superior de Controles y Filtros -->
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-5">
        <div class="flex flex-wrap items-center gap-3">
          <!-- Búsqueda rápida por nombre o código -->
          <a-input
            v-model:value="inventoryStore.searchQuery"
            placeholder="Buscar por código o producto..."
            class="w-full sm:w-60"
            allow-clear
          >
            <template #prefix>
              <SearchOutlined class="text-slate-400" />
            </template>
          </a-input>

          <!-- Filtro por Almacén -->
          <a-select
            v-model:value="inventoryStore.selectedWarehouse"
            :popup-match-select-width="false"
            :dropdown-match-select-width="false"
            class="w-full sm:min-w-[180px]"
          >
            <a-select-option value="all">🏢 Todos Almacenes</a-select-option>
            <a-select-option
              v-for="w in inventoryStore.warehouses.filter((w) => w !== 'all')"
              :key="w"
              :value="w"
            >
              {{ w }}
            </a-select-option>
          </a-select>

          <!-- Filtro por Localización -->
          <a-select
            v-model:value="inventoryStore.selectedLocation"
            :popup-match-select-width="false"
            :dropdown-match-select-width="false"
            class="w-full sm:min-w-[230px]"
          >
            <a-select-option value="all">📍 Todas Localizaciones</a-select-option>
            <a-select-option
              v-for="loc in inventoryStore.allLocations"
              :key="loc.codigo"
              :value="loc.codigo"
            >
              {{ loc.nombre }}
            </a-select-option>
          </a-select>

          <!-- Filtro por Categoría -->
          <a-select
            v-model:value="inventoryStore.selectedCategory"
            :popup-match-select-width="false"
            :dropdown-match-select-width="false"
            class="w-full sm:min-w-[160px]"
          >
            <a-select-option value="all">🏷️ Categorías</a-select-option>
            <a-select-option
              v-for="cat in inventoryStore.categories.filter((c) => c !== 'all')"
              :key="cat"
              :value="cat"
            >
              {{ cat }}
            </a-select-option>
          </a-select>

          <!-- Botón Refrescar -->
          <a-button @click="inventoryStore.fetchInventory">
            <template #icon><ReloadOutlined /></template>
          </a-button>
        </div>

        <!-- Botones de Acción -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Botón: Nuevo Almacén y Localizaciones -->
          <a-button
            class="border-slate-300 hover:border-qvaflow-navy flex items-center gap-1.5 h-10 px-4 text-sm font-semibold"
            @click="isWarehouseModalVisible = true"
          >
            <span>🏢</span>
            <span>+ Nuevo Almacén</span>
          </a-button>

          <!-- Botón: Registrar Movimiento / Traslado -->
          <a-button
            type="primary"
            class="bg-emerald-600 hover:bg-emerald-500 border-none shadow-sm flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold"
            @click="openMovementModal"
          >
            <SwapOutlined class="text-base" />
            Movimiento / Traslado
          </a-button>
        </div>
      </div>

      <!-- Tabla de Existencias de Ant Design Vue -->
      <a-table
        :columns="columns"
        :data-source="inventoryStore.filteredItems"
        :loading="inventoryStore.loading"
        :pagination="{
          pageSize: 8,
          showSizeChanger: true,
          showTotal: (total: number) => `Total ${total} artículos en existencias`
        }"
        row-key="id"
        class="overflow-x-auto"
      >
        <template #bodyCell="{ column, record }">
          <!-- Columna Código -->
          <template v-if="column.key === 'code'">
            <span class="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {{ record.code }}
            </span>
          </template>

          <!-- Columna Nombre -->
          <template v-else-if="column.key === 'name'">
            <div>
              <div class="font-semibold text-slate-800">{{ record.name }}</div>
              <div class="text-[11px] text-slate-400">Actualizado: {{ formatearFechaHora(record.lastUpdated) }}</div>
            </div>
          </template>

          <!-- Columna Categoría -->
          <template v-else-if="column.key === 'category'">
            <span class="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
              {{ record.category }}
            </span>
          </template>

          <!-- Columna Almacén y Localización Física -->
          <template v-else-if="column.key === 'warehouse'">
            <div class="text-xs space-y-0.5">
              <div class="font-semibold text-slate-800 flex items-center gap-1">
                <span>🏢</span>
                <span>{{ record.warehouse }}</span>
              </div>
              <div class="text-slate-500 flex items-center gap-1">
                <span class="text-[11px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                  📍 {{ record.locationName || record.location || 'Localización General' }}
                </span>
              </div>
            </div>
          </template>

          <!-- Columna Precio de Costo -->
          <template v-else-if="column.key === 'costPrice'">
            <span class="font-medium text-slate-600">
              {{ formatearMoneda(record.costPrice, record.currency) }}
            </span>
          </template>

          <!-- Columna Precio de Venta -->
          <template v-else-if="column.key === 'salePrice'">
            <span class="font-semibold text-slate-800">
              {{ formatearMoneda(record.salePrice, record.currency) }}
            </span>
          </template>

          <!-- Columna Stock Actual -->
          <template v-else-if="column.key === 'stock'">
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                :class="getStockBadgeClasses(record.stock)"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="getStockDotClasses(record.stock)"></span>
                {{ record.stock }} {{ record.unit }}
              </span>

              <!-- Etiqueta de Alerta -->
              <a-tag v-if="record.stock === 0" color="error" class="text-xs">
                Agotado
              </a-tag>
              <a-tag v-else-if="record.stock < 10" color="warning" class="text-xs">
                Bajo
              </a-tag>
            </div>
          </template>

          <!-- Columna Acciones -->
          <template v-else-if="column.key === 'actions'">
            <a-button
              size="small"
              type="link"
              class="text-emerald-600 hover:text-emerald-700 font-medium p-0"
              @click="openMovementModalForProduct(record)"
            >
              Trasladar / Ajustar
            </a-button>
          </template>
        </template>
      </a-table>
    </div>

    <!-- Modal de Registro de Movimientos / Traslados de Inventario -->
    <InventoryMovementModal
      v-model:visible="isModalVisible"
      :available-products="inventoryStore.items"
      :initial-product-id="selectedProductId"
      :loading="inventoryStore.loading"
      @submit="handleSaveMovement"
    />

    <!-- Modal de Creación de Nuevo Almacén con Múltiples Localizaciones -->
    <WarehouseFormModal
      v-model:visible="isWarehouseModalVisible"
      :loading="inventoryStore.loading"
      @submit="handleSaveWarehouse"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  SearchOutlined,
  ReloadOutlined,
  SwapOutlined,
} from '@ant-design/icons-vue'
import useInventoryStore from '../store/inventoryStore'
import useAuthStore from '@/modules/auth/store/authStore'
import InventoryMovementModal from '../components/InventoryMovementModal.vue'
import WarehouseFormModal from '../components/WarehouseFormModal.vue'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'
import { useFormatoFecha } from '@/shared/composables/useFormatoFecha'
import type { InventoryItem, CreateMovementDto } from '../types/inventory'

const inventoryStore = useInventoryStore()
const authStore = useAuthStore()
const { formatearMoneda } = useFormatoMoneda()
const { formatearFechaHora } = useFormatoFecha()

const isModalVisible = ref<boolean>(false)
const isWarehouseModalVisible = ref<boolean>(false)
const selectedProductId = ref<number | null>(null)

// Configuración de columnas dinámica según permisos RBAC
const columns = computed(() => {
  const base = [
    {
      title: 'Código',
      key: 'code',
      dataIndex: 'code',
      width: 120,
    },
    {
      title: 'Producto',
      key: 'name',
      dataIndex: 'name',
      sorter: (a: InventoryItem, b: InventoryItem) => a.name.localeCompare(b.name),
    },
    {
      title: 'Categoría',
      key: 'category',
      dataIndex: 'category',
      width: 120,
    },
    {
      title: 'Almacén y Localización',
      key: 'warehouse',
      dataIndex: 'warehouse',
      width: 210,
    },
  ]

  // Solo si el usuario tiene permiso para ver costos
  if (authStore.canViewCosts) {
    base.push({
      title: 'P. Costo',
      key: 'costPrice',
      dataIndex: 'costPrice',
      sorter: (a: InventoryItem, b: InventoryItem) => a.costPrice - b.costPrice,
      width: 110,
    } as any)
  }

  base.push(
    {
      title: 'P. Venta',
      key: 'salePrice',
      dataIndex: 'salePrice',
      sorter: (a: InventoryItem, b: InventoryItem) => a.salePrice - b.salePrice,
      width: 110,
    } as any,
    {
      title: 'Stock Actual',
      key: 'stock',
      dataIndex: 'stock',
      sorter: (a: InventoryItem, b: InventoryItem) => a.stock - b.stock,
      width: 160,
    } as any,
    {
      title: 'Acciones',
      key: 'actions',
      width: 130,
      align: 'center' as const,
    } as any
  )

  return base
})

onMounted(() => {
  inventoryStore.fetchInventory()
})

const getStockBadgeClasses = (stock: number) => {
  if (stock === 0) {
    return 'bg-red-50 text-red-700 border border-red-200'
  }
  if (stock < 10) {
    return 'bg-amber-50 text-amber-700 border border-amber-200'
  }
  return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
}

const getStockDotClasses = (stock: number) => {
  if (stock === 0) return 'bg-red-500'
  if (stock < 10) return 'bg-amber-500'
  return 'bg-emerald-500'
}

const openMovementModal = () => {
  selectedProductId.value = null
  isModalVisible.value = true
}

const openMovementModalForProduct = (item: InventoryItem) => {
  selectedProductId.value = item.id
  isModalVisible.value = true
}

const handleSaveMovement = async (payload: CreateMovementDto) => {
  const ok = await inventoryStore.registerMovement(payload)
  if (ok) {
    isModalVisible.value = false
  }
}

const handleSaveWarehouse = async (payload: {
  nombre: string
  locations: { nombre: string }[]
}) => {
  const ok = await inventoryStore.createWarehouse(payload)
  if (ok) {
    isWarehouseModalVisible.value = false
  }
}
</script>
