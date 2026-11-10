<template>
  <div
    class="flex min-h-screen select-none flex-col items-center justify-center bg-surface-app p-6 text-center"
  >
    <div
      class="w-full max-w-md space-y-5 rounded-2xl border border-border bg-surface-card p-8 shadow-card"
    >
      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-state-error-border bg-state-error-bg text-state-error"
      >
        <ShieldAlert class="h-8 w-8" aria-hidden="true" />
      </div>

      <div class="space-y-2">
        <h1 class="text-xl font-bold tracking-tight text-content-primary">
          Acceso no autorizado (403)
        </h1>
        <p class="text-xs leading-relaxed text-content-muted">
          Su cuenta no dispone de los permisos requeridos para acceder a este módulo del sistema.
        </p>
      </div>

      <div
        class="rounded-lg border border-border-subtle bg-surface-subtle p-3 font-mono text-xs text-content-secondary"
      >
        Permiso requerido:
        <span class="font-bold text-state-error">{{ requiredPermission || 'Restringido' }}</span>
      </div>

      <div class="flex flex-col justify-center gap-2 pt-2 sm:flex-row">
        <BaseButton variant="secondary" size="md" @click="router.back()"> Volver atrás </BaseButton>
        <BaseButton variant="primary" size="md" @click="router.push('/')">
          Ir al Inicio
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ShieldAlert } from 'lucide-vue-next'
import BaseButton from '../../shared/ui/BaseButton.vue'

const router = useRouter()
const route = useRoute()

const requiredPermission = computed(() => {
  return (route.query.permission as string) || ''
})
</script>
