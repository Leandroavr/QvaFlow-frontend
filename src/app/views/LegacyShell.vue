<template>
  <div class="legacy-shell flex min-h-screen flex-col bg-slate-100">
    <!-- Franja fija superior ámbar con aviso y enlaces de navegación rápida -->
    <header
      class="sticky top-0 z-[999] flex flex-wrap items-center justify-between gap-3 border-b border-amber-600 bg-amber-500 px-4 py-2 text-xs text-slate-950 shadow-md"
    >
      <div class="flex items-center gap-2.5">
        <span
          class="shadow-xs rounded-md bg-amber-900 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-100"
        >
          VISTA LEGADA (solo referencia)
        </span>
        <span class="hidden font-medium text-amber-950 lg:inline">
          Herramienta temporal de desarrollo para capturas
        </span>
      </div>

      <!-- Enlaces a las 8 rutas legacy -->
      <nav class="flex flex-wrap items-center gap-1">
        <router-link
          v-for="link in legacyLinks"
          :key="link.path"
          :to="link.path"
          class="rounded px-2.5 py-1 text-xs font-semibold transition-all"
          :class="
            route.path === link.path
              ? 'shadow-xs bg-amber-800 text-white'
              : 'text-amber-950 hover:bg-amber-400'
          "
        >
          {{ link.label }}
        </router-link>

        <router-link
          to="/"
          class="ml-2 flex items-center gap-1 rounded bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
          title="Volver a la vista principal de la SPA"
        >
          <span>← Salir a SPA moderna</span>
        </router-link>
      </nav>
    </header>

    <!-- Contenedor simple sin MainLayout legado para garantizar máxima compatibilidad y aislamiento -->
    <main class="flex-1 overflow-auto p-4 sm:p-6">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
import Antd from 'ant-design-vue'
import { syncLegacyAuthSession } from '../legacy/legacyAuthBridge'

const route = useRoute()

// Registrar Ant Design Vue en el contexto de la aplicación para soportar componentes legados
const vm = getCurrentInstance()
if (vm?.appContext.app) {
  vm.appContext.app.use(Antd)
}

// Sincronizar sesión y permisos antes de renderizar
syncLegacyAuthSession()

const legacyLinks = [
  { path: '/legacy/pos', label: 'TPV (POS)' },
  { path: '/legacy/ventas', label: 'Ventas' },
  { path: '/legacy/inventario', label: 'Inventario' },
  { path: '/legacy/catalogo', label: 'Catálogo' },
  { path: '/legacy/compras', label: 'Compras' },
  { path: '/legacy/reportes', label: 'Reportes' },
  { path: '/legacy/usuarios', label: 'Usuarios' },
  { path: '/legacy/respaldos', label: 'Respaldos' },
]
</script>
