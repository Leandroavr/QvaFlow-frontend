<template>
  <div class="mx-auto mt-4 w-full max-w-md">
    <!-- Botón discreto para colapsar / expandir el panel mock -->
    <div class="text-center">
      <button
        type="button"
        :aria-expanded="isExpanded"
        aria-controls="mock-quick-access-panel"
        class="hover:bg-surface-subtle/80 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-content-muted transition-colors hover:text-content-primary"
        @click="isExpanded = !isExpanded"
      >
        <FlaskConical class="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
        <span>Acceso rápido (modo mock)</span>
        <ChevronDown
          class="h-3.5 w-3.5 transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded }"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Contenido colapsable -->
    <div
      v-show="isExpanded"
      id="mock-quick-access-panel"
      class="bg-surface-card/90 border-border-default/80 backdrop-blur-xs mt-2.5 rounded-xl border p-4 shadow-md transition-all dark:bg-surface-card"
    >
      <div class="mb-2.5 flex items-center justify-between">
        <span
          class="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-content-secondary"
        >
          <span>Perfiles de Demostración:</span>
        </span>
        <span
          class="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
        >
          Solo pruebas
        </span>
      </div>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <!-- 1. Superadmin -->
        <button
          type="button"
          class="border-border-default hover:border-primary/50 group cursor-pointer rounded-lg border bg-surface-subtle p-2.5 text-left transition-all hover:bg-surface-muted"
          @click="selectMockUser('superadmin')"
        >
          <div
            class="flex items-center gap-1 text-xs font-bold text-content-primary group-hover:text-primary"
          >
            <span>🛡️ Superadmin</span>
          </div>
          <div class="mt-1 text-[10px] leading-tight text-content-muted">
            Acceso total, costos y configuración.
          </div>
        </button>

        <!-- 2. Vendedor / Cajero -->
        <button
          type="button"
          class="border-border-default hover:border-primary/50 group cursor-pointer rounded-lg border bg-surface-subtle p-2.5 text-left transition-all hover:bg-surface-muted"
          @click="selectMockUser('vendedor')"
        >
          <div
            class="flex items-center gap-1 text-xs font-bold text-content-primary group-hover:text-primary"
          >
            <span>🛒 Vendedor</span>
          </div>
          <div class="mt-1 text-[10px] leading-tight text-content-muted">
            Caja y ventas. Sin ver costos de compra.
          </div>
        </button>

        <!-- 3. Almacenero -->
        <button
          type="button"
          class="border-border-default hover:border-primary/50 group cursor-pointer rounded-lg border bg-surface-subtle p-2.5 text-left transition-all hover:bg-surface-muted"
          @click="selectMockUser('almacenero')"
        >
          <div
            class="flex items-center gap-1 text-xs font-bold text-content-primary group-hover:text-primary"
          >
            <span>📦 Almacenero</span>
          </div>
          <div class="mt-1 text-[10px] leading-tight text-content-muted">
            Stock y compras con costos. Sin ventas.
          </div>
        </button>
      </div>

      <p class="mb-0 mt-3 text-center text-[11px] text-content-muted">
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
