<template>
  <div class="mx-auto mt-2 w-full max-w-md">
    <!-- Botón discreto para colapsar / expandir el panel mock (colores claros sobre fondo oscuro en ambos temas) -->
    <div class="text-center">
      <button
        type="button"
        :aria-expanded="isExpanded"
        aria-controls="mock-quick-access-panel"
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#162e56]"
        @click="isExpanded = !isExpanded"
      >
        <FlaskConical class="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
        <span>Acceso rápido (modo mock)</span>
        <ChevronDown
          class="h-3.5 w-3.5 transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded }"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Contenido colapsable (conserva superficie y tokens del tema) -->
    <div
      v-show="isExpanded"
      id="mock-quick-access-panel"
      class="border-border-default mt-2 rounded-xl border bg-surface-card p-4 shadow-xl transition-all"
    >
      <div class="mb-2.5 flex items-center justify-between">
        <span
          class="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100"
        >
          <span>Perfiles de Demostración:</span>
        </span>
        <span
          class="rounded border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/60 dark:text-amber-300"
        >
          Solo pruebas
        </span>
      </div>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <!-- 1. Superadmin -->
        <button
          type="button"
          class="border-border-default hover:border-primary/60 group cursor-pointer rounded-lg border bg-surface-subtle p-2.5 text-left transition-all hover:bg-surface-muted"
          @click="selectMockUser('superadmin')"
        >
          <div
            class="flex items-center gap-1 text-xs font-bold text-slate-900 group-hover:text-primary dark:text-slate-100 dark:group-hover:text-primary"
          >
            <span>🛡️ Superadmin</span>
          </div>
          <div class="mt-1 text-[10px] leading-tight text-slate-600 dark:text-slate-300">
            Acceso total, costos y configuración.
          </div>
        </button>

        <!-- 2. Vendedor / Cajero -->
        <button
          type="button"
          class="border-border-default hover:border-primary/60 group cursor-pointer rounded-lg border bg-surface-subtle p-2.5 text-left transition-all hover:bg-surface-muted"
          @click="selectMockUser('vendedor')"
        >
          <div
            class="flex items-center gap-1 text-xs font-bold text-slate-900 group-hover:text-primary dark:text-slate-100 dark:group-hover:text-primary"
          >
            <span>🛒 Vendedor</span>
          </div>
          <div class="mt-1 text-[10px] leading-tight text-slate-600 dark:text-slate-300">
            Caja y ventas. Sin ver costos de compra.
          </div>
        </button>

        <!-- 3. Almacenero -->
        <button
          type="button"
          class="border-border-default hover:border-primary/60 group cursor-pointer rounded-lg border bg-surface-subtle p-2.5 text-left transition-all hover:bg-surface-muted"
          @click="selectMockUser('almacenero')"
        >
          <div
            class="flex items-center gap-1 text-xs font-bold text-slate-900 group-hover:text-primary dark:text-slate-100 dark:group-hover:text-primary"
          >
            <span>📦 Almacenero</span>
          </div>
          <div class="mt-1 text-[10px] leading-tight text-slate-600 dark:text-slate-300">
            Stock y compras con costos. Sin ventas.
          </div>
        </button>
      </div>

      <p class="mb-0 mt-3 text-center text-[11px] text-slate-600 dark:text-slate-300">
        Al hacer clic se rellenan las credenciales y se inicia sesión con el perfil seleccionado.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { FlaskConical, ChevronDown } from 'lucide-vue-next'
import { MOCK_USERS } from '../../../mocks/users'

const emit = defineEmits<{
  (e: 'select', credentials: { username: string; password: string; autoSubmit: boolean }): void
}>()

const isExpanded = ref(false)

const selectMockUser = (userKey: 'superadmin' | 'vendedor' | 'almacenero') => {
  const mock = MOCK_USERS[userKey]
  if (mock) {
    emit('select', {
      username: mock.user.username,
      password: mock.passwordHash,
      autoSubmit: true,
    })
  }
}
</script>
