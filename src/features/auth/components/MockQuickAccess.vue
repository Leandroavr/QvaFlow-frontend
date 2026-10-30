<template>
  <div class="mt-4 w-full max-w-md mx-auto">
    <!-- Botón discreto para colapsar / expandir el panel mock -->
    <div class="text-center">
      <button
        type="button"
        :aria-expanded="isExpanded"
        aria-controls="mock-quick-access-panel"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-content-muted hover:text-content-primary px-3 py-1.5 rounded-md hover:bg-surface-subtle/80 transition-colors cursor-pointer"
        @click="isExpanded = !isExpanded"
      >
        <FlaskConical class="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
        <span>Acceso rápido (modo mock)</span>
        <ChevronDown
          class="w-3.5 h-3.5 transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded }"
          aria-hidden="true"
        />
      </button>
    </div>

    <!-- Contenido colapsable -->
    <div
      v-show="isExpanded"
      id="mock-quick-access-panel"
      class="mt-2.5 p-4 bg-surface-card/90 dark:bg-surface-card border border-border-default/80 rounded-xl shadow-md backdrop-blur-xs transition-all"
    >
      <div class="flex items-center justify-between mb-2.5">
        <span class="text-xs font-bold text-content-secondary uppercase tracking-wider flex items-center gap-1">
          <span>Perfiles de Demostración:</span>
        </span>
        <span class="text-[11px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
          Solo pruebas
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <!-- 1. Superadmin -->
        <button
          type="button"
          class="p-2.5 bg-surface-subtle hover:bg-surface-muted border border-border-default hover:border-primary/50 rounded-lg text-left transition-all cursor-pointer group"
          @click="selectMockUser('superadmin')"
        >
          <div class="font-bold text-xs text-content-primary group-hover:text-primary flex items-center gap-1">
            <span>🛡️ Superadmin</span>
          </div>
          <div class="text-[10px] text-content-muted mt-1 leading-tight">
            Acceso total, costos y configuración.
          </div>
        </button>

        <!-- 2. Vendedor / Cajero -->
        <button
          type="button"
          class="p-2.5 bg-surface-subtle hover:bg-surface-muted border border-border-default hover:border-primary/50 rounded-lg text-left transition-all cursor-pointer group"
          @click="selectMockUser('vendedor')"
        >
          <div class="font-bold text-xs text-content-primary group-hover:text-primary flex items-center gap-1">
            <span>🛒 Vendedor</span>
          </div>
          <div class="text-[10px] text-content-muted mt-1 leading-tight">
            Caja y ventas. Sin ver costos de compra.
          </div>
        </button>

        <!-- 3. Almacenero -->
        <button
          type="button"
          class="p-2.5 bg-surface-subtle hover:bg-surface-muted border border-border-default hover:border-primary/50 rounded-lg text-left transition-all cursor-pointer group"
          @click="selectMockUser('almacenero')"
        >
          <div class="font-bold text-xs text-content-primary group-hover:text-primary flex items-center gap-1">
            <span>📦 Almacenero</span>
          </div>
          <div class="text-[10px] text-content-muted mt-1 leading-tight">
            Stock y compras con costos. Sin ventas.
          </div>
        </button>
      </div>

      <p class="text-[11px] text-content-muted mt-3 mb-0 text-center">
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
