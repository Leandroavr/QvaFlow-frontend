<template>
  <a-modal
    :open="visible"
    title="Tasa de Cambio Oficial del Día (Mercado Cubano)"
    :confirm-loading="posStore.loading"
    ok-text="Guardar Tasas del Día"
    cancel-text="Cancelar"
    width="540px"
    @ok="handleSave"
    @cancel="handleClose"
  >
    <div class="space-y-4 pt-1">
      <div
        class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
      >
        <span class="shrink-0 text-base">💡</span>
        <div>
          <span class="font-bold">Moneda Principal del Negocio: USD</span>
          <p class="m-0 mt-0.5 text-amber-800">
            Al actualizar la tasa del día, el sistema recalcula en tiempo real los equivalentes en
            CUP en el Punto de Venta. Los productos con precio fijo manual en CUP o USD respetarán
            siempre lo establecido por el administrador.
          </p>
        </div>
      </div>

      <a-form layout="vertical">
        <!-- Tasa USD a CUP (Principal) -->
        <div class="shadow-xs rounded-xl border-2 border-emerald-500 bg-slate-50 p-3.5">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs font-black uppercase tracking-wide text-emerald-800">
              🇺🇸 Tasa USD Oficial (Base CUP)
            </span>
            <a-tag color="success" class="m-0 text-[10px] font-bold">Referencia Central</a-tag>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-slate-600">1 USD =</span>
            <a-input-number
              v-model:value="formRates.USD"
              :min="1"
              :precision="0"
              class="flex-1 text-base font-bold"
              addon-after="CUP"
            />
          </div>
          <span class="mt-1 block text-[11px] text-slate-500">
            Tasa informal / representativa vigente para el día de operaciones.
          </span>
        </div>

        <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <!-- Tasa EUR -->
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <span class="mb-1.5 block text-xs font-bold text-slate-700">🇪🇺 Tasa EUR</span>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-slate-500">1 EUR =</span>
              <a-input-number
                v-model:value="formRates.EUR"
                :min="1"
                :precision="0"
                class="w-full font-semibold"
                addon-after="CUP"
              />
            </div>
          </div>

          <!-- Tasa MLC -->
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <span class="mb-1.5 block text-xs font-bold text-slate-700">💳 Tasa MLC</span>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-slate-500">1 MLC =</span>
              <a-input-number
                v-model:value="formRates.MLC"
                :min="1"
                :precision="0"
                class="w-full font-semibold"
                addon-after="CUP"
              />
            </div>
          </div>
        </div>

        <!-- Simulación en vivo de Conversión -->
        <div class="mt-3 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
          <div class="mb-1 flex items-center justify-between font-bold">
            <span>Ejemplo de cobro en POS:</span>
            <span class="font-mono text-emerald-700"
              >$10.00 USD = {{ 10 * (formRates.USD || 360) }} CUP</span
            >
          </div>
          <p class="m-0 text-[11px] text-blue-800">
            Un producto valorado en $10.00 USD se cobrará al cliente a
            <strong>{{ 10 * (formRates.USD || 360) }} CUP</strong> cuando pague en moneda nacional.
          </p>
        </div>
      </a-form>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import usePosStore from '../store/posStore'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'saved'): void
}>()

const posStore = usePosStore()

const formRates = ref({
  USD: 360,
  EUR: 380,
  MLC: 275,
})

watch(
  () => props.visible,
  (isOpen) => {
    if (isOpen) {
      formRates.value = {
        USD: posStore.exchangeRates.USD || 360,
        EUR: posStore.exchangeRates.EUR || 380,
        MLC: posStore.exchangeRates.MLC || 275,
      }
    }
  },
  { immediate: true }
)

const handleClose = () => {
  emit('update:visible', false)
}

const handleSave = async () => {
  const success = await posStore.setDailyRates({
    USD: Number(formRates.value.USD),
    EUR: Number(formRates.value.EUR),
    MLC: Number(formRates.value.MLC),
  })

  if (success) {
    emit('saved')
    emit('update:visible', false)
  }
}
</script>
