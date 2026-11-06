<template>
  <span
    :class="[
      'inline-block w-full text-right font-sans text-xs tabular-nums text-content-primary',
      customClass,
    ]"
    :title="displayTitle"
  >
    {{ formattedValue }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatMoney } from '@/shared/utils/formatMoney'
import type { Currency, DecimalString } from '@/shared/types/currency'

interface Props {
  value?: DecimalString | number | null
  currency?: Currency
  showCurrency?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  value: undefined,
  currency: 'USD',
  showCurrency: false,
  class: '',
})

const customClass = computed(() => props.class)

const formattedValue = computed(() => {
  return formatMoney(props.value, props.currency, { showCurrency: props.showCurrency })
})

const displayTitle = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') {
    return undefined
  }
  return formatMoney(props.value, props.currency, { showCurrency: true })
})
</script>
