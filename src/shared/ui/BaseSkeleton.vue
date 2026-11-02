<template>
  <div
    :class="[
      'animate-pulse bg-surface-skeleton',
      rounded || 'rounded-md',
      width ? '' : 'w-full',
      height ? '' : 'h-4',
      customClass,
    ]"
    :style="{
      width: width || undefined,
      height: height || undefined,
    }"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
interface Props {
  width?: string
  height?: string
  rounded?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
})

const customClass = props.class
</script>
