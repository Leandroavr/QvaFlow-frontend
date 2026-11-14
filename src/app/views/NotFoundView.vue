<template>
  <div class="flex min-h-screen items-center justify-center bg-surface-app p-4">
    <div
      class="w-full max-w-md rounded-2xl border border-border bg-surface-card p-8 text-center shadow-lg"
    >
      <div
        class="bg-accent/10 border-accent/20 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border text-accent"
      >
        <FileQuestion class="h-8 w-8" aria-hidden="true" />
      </div>

      <h1 class="text-3xl font-extrabold tracking-tight text-content-primary">404</h1>
      <h2 class="mt-1 text-base font-semibold text-content-primary">Página no encontrada</h2>
      <p class="mt-2 text-xs text-content-muted">
        La ruta a la que intentas acceder no existe, ha cambiado o fue movida a otra ubicación.
      </p>

      <div class="mt-6">
        <BaseButton variant="primary" block density="compact" @click="goHome">
          <Home class="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Volver al Inicio</span>
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { FileQuestion, Home } from 'lucide-vue-next'
import BaseButton from '../../shared/ui/BaseButton.vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>
