<template>
  <BaseModal
    :open="open"
    :title="title"
    :description="message"
    :size="size"
    @update:open="handleOpenUpdate"
  >
    <div class="flex items-start gap-3.5 py-1">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        :class="iconContainerClasses[variant]"
        aria-hidden="true"
      >
        <component :is="iconComponent" class="h-5 w-5" :class="iconClasses[variant]" />
      </div>

      <div class="flex-1 text-xs text-content-primary sm:text-sm">
        <slot>
          <p>{{ message }}</p>
        </slot>
      </div>
    </div>

    <template #actions>
      <BaseButton
        ref="cancelButtonRef"
        variant="secondary"
        density="compact"
        :disabled="loading"
        @click="handleCancel"
      >
        {{ cancelText }}
      </BaseButton>

      <BaseButton
        :variant="confirmButtonVariant"
        density="compact"
        :loading="loading"
        @click="handleConfirm"
      >
        {{ confirmText }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-vue-next'
import BaseModal from './BaseModal.vue'
import type { ModalSize } from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

export type ConfirmVariant = 'danger' | 'warning' | 'primary'

interface Props {
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  loading?: boolean
  size?: ModalSize
}

const props = withDefaults(defineProps<Props>(), {
  title: '¿Confirmar acción?',
  message: '¿Está seguro de que desea continuar? Esta acción no se puede deshacer.',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'danger',
  loading: false,
  size: 'sm',
})

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const cancelButtonRef = ref<any>(null)

// Enfocar automáticamente el botón cancelar al abrirse por seguridad accesible
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      const el = cancelButtonRef.value?.$el || cancelButtonRef.value
      if (el && typeof el.focus === 'function') {
        el.focus()
      }
    }
  }
)

const confirmButtonVariant = computed(() => {
  if (props.variant === 'danger') return 'danger'
  if (props.variant === 'warning') return 'primary'
  return 'primary'
})

const iconComponent = computed(() => {
  if (props.variant === 'danger') return AlertCircle
  if (props.variant === 'warning') return AlertTriangle
  return HelpCircle
})

const iconContainerClasses: Record<ConfirmVariant, string> = {
  danger: 'bg-state-error-bg text-state-error border border-state-error-border',
  warning: 'bg-state-warning-bg text-state-warning border border-state-warning-border',
  primary: 'bg-primary-subtle text-primary border border-primary/20',
}

const iconClasses: Record<ConfirmVariant, string> = {
  danger: 'text-state-error',
  warning: 'text-state-warning',
  primary: 'text-primary',
}

function handleOpenUpdate(val: boolean) {
  emit('update:open', val)
  if (!val) {
    emit('cancel')
  }
}

function handleCancel() {
  emit('update:open', false)
  emit('cancel')
}

function handleConfirm() {
  emit('confirm')
}
</script>
