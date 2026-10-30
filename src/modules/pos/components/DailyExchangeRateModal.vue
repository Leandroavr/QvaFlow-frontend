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
      <div class="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
        <span class="text-base shrink-0">💡</span>
        <div>
          <span class="font-bold">Moneda Principal del Negocio: USD</span>
          <p class="m-0 mt-0.5 text-amber-800">
            Al actualizar la tasa del día, el sistema recalcula en tiempo real los equivalentes en CUP en el Punto de Venta. Los productos con precio fijo manual en CUP o USD respetarán siempre lo establecido por el administrador.
          </p>
        </div>
      </div>

      <a-form layout="vertical">
        <!-- Tasa USD a CUP (Principal) -->
        <div class="p-3.5 bg-slate-50 rounded-xl border-2 border-emerald-500 shadow-xs">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-black text-emerald-800 uppercase tracking-wide">
              🇺🇸 Tasa USD Oficial (Base CUP)
            </span>
            <a-tag color="success" class="text-[10px] m-0 font-bold">Referencia Central</a-tag>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-slate-600">1 USD =</span>
            <a-input-number
              v-model:value="formRates.USD"
              :min="1"
              :precision="0"
              class="flex-1 font-bold text-base"
              addon-after="CUP"
            />
          </div>
          <span class="text-[11px] text-slate-500 mt-1 block">
            Tasa informal / representativa vigente para el día de operaciones.
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <!-- Tasa EUR -->
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-xs font-bold text-slate-700 block mb-1.5">🇪🇺 Tasa EUR</span>
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
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span class="text-xs font-bold text-slate-700 block mb-1.5">💳 Tasa MLC</span>
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
        <div class="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-blue-900 mt-3">
          <div class="font-bold mb-1 flex items-center justify-between">
            <span>Ejemplo de cobro en POS:</span>
            <span class="font-mono text-emerald-700">$10.00 USD = {{ 10 * (formRates.USD || 360) }} CUP</span>
          </div>
          <p class="m-0 text-blue-800 text-[11px]">
            Un producto valorado en $10.00 USD se cobrará al cliente a <strong>{{ 10 * (formRates.USD || 360) }} CUP</strong> cuando pague en moneda nacional.
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
