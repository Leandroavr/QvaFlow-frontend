<template>
  <BaseDrawer
    :open="open"
    :title="sale ? `Detalle de Venta #${sale.id}` : 'Detalle de Venta'"
    size="lg"
    @update:open="emit('update:open', $event)"
  >
    <!-- Estado: Cargando Detalle -->
    <div v-if="isLoading" class="flex h-64 flex-col items-center justify-center gap-2">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span class="text-xs text-content-muted">Cargando comprobante de venta...</span>
    </div>

    <!-- Estado: Error al Cargar Detalle -->
    <div v-else-if="error" class="p-6 text-center">
      <div
        class="bg-state-error-subtle mx-auto flex h-10 w-10 items-center justify-center rounded-full text-state-error"
      >
        <AlertCircle class="h-5 w-5" />
      </div>
      <p class="mt-2 text-xs font-semibold text-content-primary">{{ error }}</p>
    </div>

    <!-- Estado: Venta Cargada -->
    <div v-else-if="sale" class="space-y-5 pb-6 text-xs text-content-primary">
      <!-- 1. Alerta de Venta Anulada (Si Aplica) -->
      <div
        v-if="sale.status === 'CANCELLED'"
        class="bg-state-error-subtle/40 rounded-xl border border-state-error-border p-3.5 text-state-error"
        data-testid="sale-cancelled-alert"
      >
        <div class="flex items-start gap-2.5">
          <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div class="space-y-1">
            <h4 class="text-xs font-bold uppercase tracking-wider">Comprobante Anulado</h4>
            <p v-if="sale.cancelledAt" class="text-[11px] text-content-secondary">
              Fecha de anulación:
              <span class="font-mono">{{
                formatDate(sale.cancelledAt, { includeTime: true })
              }}</span>
            </p>
            <p v-if="sale.cancellationReason" class="text-[11px] text-content-primary">
              <span class="font-semibold">Motivo:</span> {{ sale.cancellationReason }}
            </p>
            <p class="text-[11px] font-medium text-state-success">
              ✓ Existencias de mercancía repuestas al inventario.
            </p>
          </div>
        </div>
      </div>

      <!-- 2. Tarjeta Resumen de Metadatos -->
      <div class="space-y-2.5 rounded-xl border border-border-subtle bg-surface-card p-3.5">
        <div class="flex items-center justify-between border-b border-border-subtle pb-2">
          <div>
            <span class="text-content-tertiary text-[10px] font-semibold uppercase tracking-wider">
              Folio Fiscal
            </span>
            <div class="font-mono text-sm font-bold text-content-primary">
              {{ sale.id }}
            </div>
          </div>
          <BaseBadge
            :variant="sale.status === 'COMPLETED' ? 'success' : 'danger'"
            size="md"
            data-testid="drawer-status-badge"
          >
            {{ sale.status === 'COMPLETED' ? 'Completada' : 'Anulada' }}
          </BaseBadge>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-3">
          <div>
            <span class="block text-content-muted">Fecha de emisión:</span>
            <span class="font-mono font-medium text-content-primary">
              {{ formatDate(sale.createdAt, { includeTime: true }) }}
            </span>
          </div>

          <div>
            <span class="block text-content-muted">Cajero:</span>
            <span class="font-medium text-content-primary" :title="sale.cashierName">
              {{ sale.cashierName }}
            </span>
          </div>

          <div>
            <span class="block text-content-muted">Turno:</span>
            <span class="font-mono font-medium text-content-secondary">
              {{ sale.shiftId }}
            </span>
          </div>

          <div>
            <span class="block text-content-muted">Almacén:</span>
            <span class="font-mono font-medium text-content-secondary">
              {{ sale.warehouseId }}
            </span>
          </div>

          <div v-if="sale.clientRequestId" class="col-span-2">
            <span class="block text-content-muted">Idempotencia (UUID):</span>
            <span class="block truncate font-mono text-[10px] text-content-muted">
              {{ sale.clientRequestId }}
            </span>
          </div>
        </div>
      </div>

      <!-- 3. Tabla de Artículos Facturados -->
      <div>
        <h4 class="mb-2 text-xs font-bold uppercase tracking-wider text-content-secondary">
          Artículos Facturados ({{ sale.items.length }})
        </h4>

        <div class="overflow-x-auto rounded-xl border border-border-subtle bg-surface-card">
          <table class="w-full border-collapse text-left text-xs">
            <thead class="border-b border-border-subtle bg-surface-sunken text-content-secondary">
              <tr>
                <th class="px-3 py-2 text-left font-semibold">Producto</th>
                <th class="w-20 px-3 py-2 text-right font-semibold">Cant.</th>
                <th class="w-24 px-3 py-2 text-right font-semibold">P. Unit</th>
                <th class="w-24 px-3 py-2 text-right font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <tr
                v-for="item in sale.items"
                :key="item.productCode"
                class="hover:bg-surface-sunken/40"
              >
                <td class="px-3 py-2">
                  <div class="font-medium text-content-primary">{{ item.name }}</div>
                  <div class="font-mono text-[10px] text-content-muted">{{ item.productCode }}</div>
                </td>
                <td class="px-3 py-2 text-right font-mono font-medium">
                  {{ item.quantity }}
                </td>
                <td class="px-3 py-2 text-right font-mono text-content-secondary">
                  {{ item.unitPriceCUP }} CUP
                </td>
                <td class="px-3 py-2 text-right font-mono font-bold text-content-primary">
                  {{ item.subtotalCUP }} CUP
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 4. Desglose de Totales y Liquidación de Cobro -->
      <div class="space-y-2.5 rounded-xl border border-border-subtle bg-surface-sunken p-4">
        <h4 class="text-xs font-bold uppercase tracking-wider text-content-secondary">
          Liquidación de Cobro
        </h4>

        <div class="space-y-1.5 text-xs">
          <div class="flex justify-between">
            <span class="text-content-secondary">Importe Total Base (CUP):</span>
            <span class="font-mono font-bold text-content-primary">{{ sale.totalCUP }} CUP</span>
          </div>

          <div
            v-if="sale.exchangeRateApplied && sale.paidCurrency !== 'CUP'"
            class="flex justify-between text-content-secondary"
          >
            <span>Tasa de cambio aplicada:</span>
            <span class="font-mono font-semibold">1 USD = {{ sale.exchangeRateApplied }} CUP</span>
          </div>

          <div class="flex justify-between">
            <span class="text-content-secondary">Moneda y Método de Pago:</span>
            <span class="font-semibold text-content-primary">
              {{ sale.paidCurrency }} &bull; {{ formatPaymentMethod(sale.paymentMethod) }}
            </span>
          </div>

          <div class="flex justify-between border-t border-border-subtle pt-1.5 font-bold">
            <span class="text-content-primary">Total Cobrado en Divisa:</span>
            <span class="font-mono text-sm text-primary">
              {{ sale.totalInCurrency }} {{ sale.paidCurrency }}
            </span>
          </div>

          <div v-if="sale.paymentMethod === 'CASH'" class="space-y-1 text-content-secondary">
            <div class="flex justify-between">
              <span>Efectivo entregado por cliente:</span>
              <span class="font-mono font-medium"
                >{{ sale.cashReceived }} {{ sale.paidCurrency }}</span
              >
            </div>
            <div class="flex justify-between font-semibold text-state-success">
              <span>Vuelto entregado en CUP:</span>
              <span class="font-mono">{{ sale.changeGivenCUP }} CUP</span>
            </div>
          </div>

          <!-- Si el cobro fue transferencia -->
          <div
            v-if="sale.paymentMethod === 'TRANSFER' || sale.transferReference"
            class="mt-2 rounded-lg border border-border-subtle bg-surface-card p-2 text-[11px]"
          >
            <div class="flex justify-between">
              <span class="text-content-secondary">Pasarela:</span>
              <span class="font-medium text-content-primary">
                {{ sale.transferGateway || 'Transferencia Bancaria' }}
              </span>
            </div>
            <div class="mt-0.5 flex justify-between">
              <span class="text-content-secondary">Comprobante / Referencia:</span>
              <span class="font-mono font-bold text-primary">
                {{ sale.transferReference || '—' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Formulario de Anulación (Visible al pulsar 'Anular') -->
      <div
        v-if="showCancelForm && sale.status !== 'CANCELLED'"
        class="bg-state-error-subtle/20 space-y-3 rounded-xl border border-state-error-border p-4"
        data-testid="cancel-sale-form-container"
      >
        <div class="flex items-center gap-2 font-bold text-state-error">
          <AlertCircle class="h-4 w-4" />
          <span>Confirmar Anulación del Ticket #{{ sale.id }}</span>
        </div>

        <p class="text-[11px] text-content-secondary">
          Esta acción cancelará el comprobante comercial y reintegrará automáticamente las
          existencias al inventario. Ingrese el motivo formal de la anulación (mínimo 10
          caracteres).
        </p>

        <div>
          <label
            class="mb-1 block text-xs font-semibold uppercase tracking-wider text-content-secondary"
          >
            Motivo de anulación <span class="text-state-error">*</span>
          </label>
          <BaseInput
            v-model="cancelReason"
            placeholder="Ej. Devolución de mercancía por empaque defectuoso..."
            :has-error="Boolean(reasonError)"
            data-testid="input-cancel-reason"
            @keydown.enter.prevent="handleConfirmCancellation"
          />
          <p
            v-if="reasonError"
            class="mt-1 text-xs text-state-error"
            data-testid="cancel-reason-error"
          >
            {{ reasonError }}
          </p>
          <p
            v-else-if="cancelError"
            class="mt-1 text-xs text-state-error"
            data-testid="cancel-server-error"
          >
            {{ cancelError }}
          </p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-1">
          <BaseButton
            variant="secondary"
            density="compact"
            :disabled="isCancelling"
            data-testid="btn-abort-cancel"
            @click="handleAbortCancellation"
          >
            Cancelar
          </BaseButton>

          <BaseButton
            variant="danger"
            density="compact"
            :loading="isCancelling"
            data-testid="btn-confirm-cancel"
            @click="handleConfirmCancellation"
          >
            Confirmar Anulación
          </BaseButton>
        </div>
      </div>

      <!-- 6. Botones de Acción: Imprimir y Anular -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4"
      >
        <BaseButton
          variant="secondary"
          density="compact"
          class="gap-1.5"
          data-testid="btn-print-receipt"
          @click="handlePrint"
        >
          <Printer class="h-4 w-4" aria-hidden="true" />
          <span>Imprimir Comprobante (80 mm)</span>
        </BaseButton>

        <!-- Botón Anular Venta (Visible solo con permiso sales.cancel y si no está cancelada) -->
        <BaseButton
          v-if="can('sales.cancel') && sale.status !== 'CANCELLED' && !showCancelForm"
          variant="danger"
          density="compact"
          class="gap-1.5"
          data-testid="btn-start-cancel"
          @click="showCancelForm = true"
        >
          <XCircle class="h-4 w-4" aria-hidden="true" />
          <span>Anular Ticket</span>
        </BaseButton>
      </div>

      <!-- 7. Plantilla Térmica de Impresión de 80 mm (@media print) -->
      <div class="receipt-print-area hidden">
        <div style="text-align: center; margin-bottom: 6px">
          <h2 style="margin: 0; font-size: 14px; font-weight: bold">QvaFlow POS</h2>
          <p style="margin: 2px 0; font-size: 10px">Comprobante de Venta</p>
          <p style="margin: 0; font-size: 11px; font-weight: bold">Ticket #{{ sale.id }}</p>
          <p style="margin: 2px 0; font-size: 9px">
            {{ formatDate(sale.createdAt, { includeTime: true }) }}
          </p>
          <p style="margin: 0; font-size: 9px">Cajero: {{ sale.cashierName }}</p>
        </div>

        <div
          style="
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 4px 0;
            margin-bottom: 6px;
          "
        >
          <table style="width: 100%; border-collapse: collapse; font-size: 10px">
            <thead>
              <tr style="text-align: left">
                <th>Art.</th>
                <th style="text-align: right">Cant</th>
                <th style="text-align: right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in sale.items" :key="item.productCode">
                <td style="padding: 2px 0">{{ item.name }}</td>
                <td style="text-align: right; padding: 2px 0">{{ item.quantity }}</td>
                <td style="text-align: right; padding: 2px 0">{{ item.subtotalCUP }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="font-size: 10px; line-height: 1.4">
          <div style="display: flex; justify-content: space-between; font-weight: bold">
            <span>TOTAL:</span>
            <span>{{ sale.totalCUP }} CUP</span>
          </div>
          <div
            v-if="sale.paidCurrency !== 'CUP'"
            style="display: flex; justify-content: space-between"
          >
            <span>Cobrado:</span>
            <span>{{ sale.totalInCurrency }} {{ sale.paidCurrency }}</span>
          </div>
          <div
            v-if="sale.exchangeRateApplied && sale.paidCurrency !== 'CUP'"
            style="display: flex; justify-content: space-between; font-size: 9px"
          >
            <span>Tasa USD:</span>
            <span>1 USD = {{ sale.exchangeRateApplied }} CUP</span>
          </div>
          <div
            v-if="sale.changeGivenCUP && sale.changeGivenCUP !== '0.00'"
            style="display: flex; justify-content: space-between"
          >
            <span>Vuelto CUP:</span>
            <span>{{ sale.changeGivenCUP }} CUP</span>
          </div>
          <div v-if="sale.transferReference" style="display: flex; justify-content: space-between">
            <span>Ref. Transf:</span>
            <span>{{ sale.transferReference }}</span>
          </div>
        </div>

        <div
          style="
            text-align: center;
            margin-top: 10px;
            font-size: 9px;
            border-top: 1px dashed #000;
            padding-top: 4px;
          "
        >
          <p style="margin: 0">¡Gracias por su compra!</p>
          <p style="margin: 2px 0 0 0">QvaFlow &bull; Sistema POS Local</p>
        </div>
      </div>
    </div>
  </BaseDrawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Printer, XCircle, AlertCircle, AlertTriangle } from 'lucide-vue-next'
import BaseDrawer from '@/shared/ui/BaseDrawer.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseBadge from '@/shared/ui/BaseBadge.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import { usePermissions } from '@/shared/composables/usePermissions'
import { formatDate } from '@/shared/utils/formatDate'
import type { Sale, PaymentMethod } from '../types'

interface Props {
  open: boolean
  sale: Sale | null
  isLoading?: boolean
  error?: string | null
  isCancelling?: boolean
  cancelError?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'cancel', reason: string): void
}>()

const { can } = usePermissions()

const showCancelForm = ref<boolean>(false)
const cancelReason = ref<string>('')
const reasonError = ref<string>('')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      showCancelForm.value = false
      cancelReason.value = ''
      reasonError.value = ''
    }
  }
)

const formatPaymentMethod = (method?: PaymentMethod): string => {
  switch (method) {
    case 'CASH':
      return 'Efectivo'
    case 'TRANSFER':
      return 'Transferencia'
    case 'CARD':
      return 'Tarjeta'
    default:
      return method || 'Efectivo'
  }
}

const handleAbortCancellation = () => {
  showCancelForm.value = false
  cancelReason.value = ''
  reasonError.value = ''
}

const handleConfirmCancellation = () => {
  const trimmed = cancelReason.value.trim()
  if (!trimmed || trimmed.length < 10) {
    reasonError.value = 'El motivo de anulación debe tener al menos 10 caracteres'
    return
  }
  reasonError.value = ''
  emit('cancel', trimmed)
}

const handlePrint = () => {
  window.print()
}
</script>

<style>
@media print {
  /* Ocultar todos los elementos de la interfaz en la impresión */
  body > * {
    display: none !important;
  }

  /* Área térmica de 80 mm */
  .receipt-print-area {
    display: block !important;
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 80mm !important;
    max-width: 80mm !important;
    padding: 3mm !important;
    margin: 0 !important;
    background: #ffffff !important;
    color: #000000 !important;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
      monospace !important;
    font-size: 11px !important;
    line-height: 1.3 !important;
  }
}
</style>
