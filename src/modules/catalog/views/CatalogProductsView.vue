<template>
  <div class="space-y-4">
    <!-- Barra superior de métricas y acciones -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total de Productos
          </p>
          <h3 class="m-0 text-2xl font-bold text-slate-800">{{ catalogStore.totalProducts }}</h3>
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-lg font-bold text-emerald-600"
        >
          📦
        </div>
      </div>

      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-amber-600">Stock Crítico</p>
          <h3 class="m-0 text-2xl font-bold text-amber-600">{{ catalogStore.lowStockCount }}</h3>
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-lg font-bold text-amber-600"
        >
          ⚠️
        </div>
      </div>

      <div
        class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Categorías Activas
          </p>
          <h3 class="m-0 text-2xl font-bold text-slate-800">
            {{ catalogStore.categories.length - 1 }}
          </h3>
        </div>
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg font-bold text-blue-600"
        >
          🏷️
        </div>
      </div>
    </div>

    <!-- Contenedor principal de la tabla y filtros -->
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <!-- Filtros y botón de creación -->
      <div class="mb-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div class="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <!-- Búsqueda rápida por nombre o código -->
          <a-input
            v-model:value="catalogStore.searchQuery"
            placeholder="Buscar por código o nombre..."
            class="w-full sm:w-72"
            allow-clear
          >
            <template #prefix>
              <SearchOutlined class="text-slate-400" />
            </template>
          </a-input>

          <!-- Filtro por categoría -->
          <a-select
            v-model:value="catalogStore.selectedCategory"
            class="w-full sm:w-48 sm:min-w-[180px]"
            :dropdown-match-select-width="false"
            :popup-match-select-width="false"
          >
            <a-select-option value="all">Todas las categorías</a-select-option>
            <a-select-option
              v-for="cat in catalogStore.categories.filter((c) => c !== 'all')"
              :key="cat"
              :value="cat"
            >
              {{ cat }}
            </a-select-option>
          </a-select>

          <!-- Recargar datos -->
          <a-button @click="catalogStore.fetchProducts">
            <template #icon><ReloadOutlined /></template>
          </a-button>
        </div>

        <!-- Botón para nuevo producto (Siempre visible para Administrador o con permiso) -->
        <a-button
          v-if="authStore.hasPermission('MANAGE_CATALOG') || authStore.canManageUsers"
          type="primary"
          size="middle"
          class="flex w-full items-center justify-center gap-2 border-none bg-emerald-600 px-4 font-bold shadow-md hover:bg-emerald-500 sm:w-auto"
          @click="openCreateModal"
        >
          <PlusOutlined />
          <span>+ Ingresar Nuevo Producto</span>
        </a-button>
      </div>

      <!-- Tabla de Productos de Ant Design Vue con Columnas Dinámicas RBAC -->
      <a-table
        :columns="tableColumns"
        :data-source="catalogStore.filteredProducts"
        :loading="catalogStore.loading"
        :pagination="{
          pageSize: 8,
          showSizeChanger: true,
          showTotal: (total: number) => `Total ${total} productos`,
        }"
        row-key="id"
        class="overflow-x-auto"
      >
        <!-- Columna de Código, Miniatura e Información -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'productInfo'">
            <div class="flex items-center gap-3">
              <!-- Miniatura del producto si existe -->
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-lg"
              >
                <img
                  v-if="record.images && record.images.length > 0"
                  :src="record.images[0].url"
                  :alt="record.name"
                  class="h-full w-full object-cover"
                />
                <span v-else>📦</span>
              </div>

              <div>
                <div class="font-semibold leading-snug text-slate-800">{{ record.name }}</div>
                <div class="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <span class="font-mono">SKU: {{ record.code }}</span>
                  <a-tag
                    v-if="record.barcodes && record.barcodes.length > 1"
                    color="cyan"
                    class="px-1 py-0 text-[10px]"
                  >
                    +{{ record.barcodes.length - 1 }} códigos
                  </a-tag>
                </div>

                <!-- Atributos dinámicos EAV resumidos -->
                <div
                  v-if="record.attributes && record.attributes.length > 0"
                  class="mt-1 flex flex-wrap gap-1"
                >
                  <span
                    v-for="attr in record.attributes.slice(0, 2)"
                    :key="attr.id"
                    class="py-0.2 rounded bg-slate-100 px-1.5 text-[10px] text-slate-600"
                  >
                    {{ attr.name }}: {{ attr.value }}
                  </span>
                  <span v-if="record.attributes.length > 2" class="text-[10px] text-slate-400">
                    +{{ record.attributes.length - 2 }}
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- Columna Categoría -->
          <template v-else-if="column.key === 'category'">
            <a-tag color="blue">{{ record.category }}</a-tag>
          </template>

          <!-- Columna Precio Costo (USD / CUP con permisos RBAC) -->
          <template v-else-if="column.key === 'costPrice'">
            <div>
              <div v-if="record.costPriceUSD" class="font-mono text-xs font-bold text-slate-800">
                ${{ record.costPriceUSD }} USD
              </div>
              <div class="text-[11px] text-slate-500">
                {{ formatearMoneda(record.costPriceCUP || record.costPrice, 'CUP') }}
              </div>
            </div>
          </template>

          <!-- Columna Precio Venta (USD / CUP) -->
          <template v-else-if="column.key === 'salePrice'">
            <div>
              <div class="font-mono text-xs font-black text-emerald-700">
                ${{
                  record.salePriceUSD || record.prices?.USD || (record.salePrice / 360).toFixed(2)
                }}
                USD
              </div>
              <div class="text-xs font-semibold text-slate-800">
                {{ formatearMoneda(record.salePriceCUP || record.salePrice, 'CUP') }}
              </div>
            </div>
          </template>

          <!-- Columna Stock -->
          <template v-else-if="column.key === 'stock'">
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'text-sm font-medium',
                  record.stock <= record.minStock ? 'font-bold text-red-600' : 'text-slate-700',
                ]"
              >
                {{ record.stock }} {{ record.unit }}
              </span>
              <a-tag v-if="record.stock <= record.minStock" color="error" class="text-xs">
                Bajo Stock
              </a-tag>
            </div>
          </template>

          <!-- Columna Estado -->
          <template v-else-if="column.key === 'active'">
            <a-tag :color="record.active ? 'success' : 'default'">
              {{ record.active ? 'Disponible' : 'Inactivo' }}
            </a-tag>
          </template>

          <!-- Columna Acciones -->
          <template v-else-if="column.key === 'actions'">
            <div class="flex items-center gap-2">
              <a-button
                v-if="authStore.hasPermission('MANAGE_CATALOG')"
                size="small"
                type="text"
                class="text-blue-600 hover:text-blue-500"
                @click="openEditModal(record)"
              >
                <template #icon><EditOutlined /></template>
              </a-button>

              <a-popconfirm
                v-if="authStore.hasPermission('MANAGE_CATALOG')"
                title="¿Está seguro de eliminar este producto del catálogo?"
                ok-text="Sí, eliminar"
                cancel-text="Cancelar"
                placement="bottomRight"
                overlay-class-name="min-w-[250px]"
                :ok-button-props="{ danger: true, type: 'primary' }"
                @confirm="handleDelete(record.id)"
              >
                <a-button size="small" type="text" danger>
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-popconfirm>
            </div>
          </template>
        </template>
      </a-table>
    </div>

    <!-- Modal de Formulario Avanzado (EAV, Múltiples Códigos, Upload, Multimoneda) -->
    <ProductFormModal
      v-model:visible="isModalVisible"
      :product-to-edit="currentProductToEdit"
      :loading="catalogStore.loading"
      @submit="handleSaveProduct"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import useCatalogStore from '../store/catalogStore'
import useAuthStore from '@/modules/auth/store/authStore'
import ProductFormModal from '../components/ProductFormModal.vue'
import { useFormatoMoneda } from '@/shared/composables/useFormatoMoneda'
import type { Product, CreateProductDto } from '../types/product'

const catalogStore = useCatalogStore()
const authStore = useAuthStore()
const { formatearMoneda } = useFormatoMoneda()

// Estado para control del modal
const isModalVisible = ref<boolean>(false)
const currentProductToEdit = ref<Product | null>(null)

// Definición dinámica de columnas con RBAC (canViewCosts oculta columna de costo)
const tableColumns = computed(() => {
  const base = [
    {
      title: 'Producto / Códigos',
      key: 'productInfo',
      dataIndex: 'name',
      sorter: (a: Product, b: Product) => a.name.localeCompare(b.name),
    },
    {
      title: 'Categoría',
      key: 'category',
      dataIndex: 'category',
      width: 140,
    },
  ]

  // Columna Precio de Costo solo visible para usuarios con permiso
  if (authStore.canViewCosts) {
    base.push({
      title: 'Precio Costo',
      key: 'costPrice',
      dataIndex: 'costPrice',
      sorter: (a: Product, b: Product) => a.costPrice - b.costPrice,
      width: 125,
    } as any)
  }

  base.push(
    {
      title: 'Precio Venta',
      key: 'salePrice',
      dataIndex: 'salePrice',
      sorter: (a: Product, b: Product) => a.salePrice - b.salePrice,
      width: 140,
    } as any,
    {
      title: 'Stock Actual',
      key: 'stock',
      dataIndex: 'stock',
      sorter: (a: Product, b: Product) => a.stock - b.stock,
      width: 130,
    } as any,
    {
      title: 'Estado',
      key: 'active',
      dataIndex: 'active',
      width: 110,
    } as any,
    {
      title: 'Acciones',
      key: 'actions',
      width: 110,
      align: 'center' as const,
    } as any
  )

  return base
})

onMounted(() => {
  catalogStore.fetchProducts()
})

const openCreateModal = () => {
  currentProductToEdit.value = null
  isModalVisible.value = true
}

const openEditModal = (product: Product) => {
  currentProductToEdit.value = { ...product }
  isModalVisible.value = true
}

const handleSaveProduct = async (formData: CreateProductDto) => {
  if (currentProductToEdit.value) {
    const ok = await catalogStore.updateProduct(currentProductToEdit.value.id, formData)
    if (ok) isModalVisible.value = false
  } else {
    const ok = await catalogStore.createProduct(formData)
    if (ok) isModalVisible.value = false
  }
}

const handleDelete = async (id: number) => {
  await catalogStore.deleteProduct(id)
}
</script>
