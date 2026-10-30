<template>
  <div class="min-h-screen bg-surface-app flex flex-col items-center justify-center p-6 text-center select-none">
    <div class="max-w-md w-full bg-surface-card border border-border-default rounded-2xl p-8 shadow-card space-y-5">
      <div class="w-16 h-16 rounded-2xl bg-state-error-bg text-state-error flex items-center justify-center mx-auto border border-state-error-border">
        <ShieldAlert class="w-8 h-8" aria-hidden="true" />
      </div>

      <div class="space-y-2">
        <h1 class="text-xl font-bold text-content-primary tracking-tight">
          Acceso no autorizado (403)
        </h1>
        <p class="text-xs text-content-muted leading-relaxed">
          Su cuenta no dispone de los permisos requeridos para acceder a este módulo del sistema.
        </p>
      </div>

      <div class="p-3 bg-surface-subtle border border-border-subtle rounded-lg text-xs font-mono text-content-secondary">
        Permiso requerido: <span class="font-bold text-state-error">{{ requiredPermission || 'Restringido' }}</span>
      </div>

      <div class="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
        <BaseButton
          variant="secondary"
          size="md"
          @click="router.back()"
        >
          Volver atrás
        </BaseButton>
        <BaseButton
          variant="primary"
          size="md"
          @click="router.push('/')"
        >
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
