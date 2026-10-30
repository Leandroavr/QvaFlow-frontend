<template>
  <div id="qvaflow-root" class="min-h-screen bg-surface-app text-content-primary">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './features/auth/stores/authStore'
import { initThemeBeforeMount } from './shared/composables/useTheme'

// Pre-render theme synchronization
initThemeBeforeMount()

const authStore = useAuthStore()

onMounted(async () => {
  // Validar sesión activa en segundo plano al arrancar la SPA
  if (authStore.token && !authStore.user) {
    await authStore.checkAuth()
  }
})
</script>
