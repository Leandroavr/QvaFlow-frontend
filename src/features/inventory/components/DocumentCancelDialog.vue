<template>
  <ConfirmDialog
    :open="open"
    :title="title"
    :message="message"
    confirm-text="Sí, descartar"
    cancel-text="Continuar editando"
    variant="warning"
    @confirm="$emit('confirm')"
    @cancel="$emit('cancel')"
    @update:open="$emit('update:open', $event)"
  />
</template>

<script setup lang="ts">
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'

interface Props {
  open: boolean
  title?: string
  message?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Descartar cambios',
  message:
    '¿Está seguro de que desea cancelar? Se perderán todos los datos y líneas del documento no guardados.',
})

defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:open', val: boolean): void
}>()
</script>
