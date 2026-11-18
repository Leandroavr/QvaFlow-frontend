<template>
  <div class="space-y-6 pb-12" data-testid="cash-shift-view">
    <!-- Cabecera de Página -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-2">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-sunken text-primary"
          >
            <Coins class="h-5 w-5" />
          </div>
          <h1 class="text-xl font-bold tracking-tight text-content-primary sm:text-2xl">
            Turno y Arqueo de Caja
          </h1>
        </div>
        <p class="mt-1 text-xs text-content-secondary sm:text-sm">
          Apertura de turno operativo, control en tiempo real de fondos en gaveta y arqueo físico de cierre.
        </p>
      </div>

      <!-- Acciones de cabecera: solo Abrir Turno (Cerrar Turno queda en la tarjeta) -->
      <div class="flex items-center gap-2">
        <BaseButton
          v-if="!isShiftOpen && !lastCloseResult"
          variant="primary"
          density="compact"
          data-testid="btn-open-shift-header"
          @click="openShiftModal"
        >
          <template #icon-start>
            <Plus class="h-4 w-4" />
          </template>
          Abrir Turno
        </BaseButton>
      </div>
    </div>

    <!-- Alerta de Error si ocurre -->
    <div
      v-if="error"
      class="flex items-start gap-2.5 rounded-lg border border-state-error-border bg-state-error-bg p-3 text-xs text-state-error sm:text-sm"
      role="alert"
      data-testid="cash-shift-error-alert"
    >
      <AlertTriangle class="h-4 w-4 shrink-0 translate-y-0.5" />
      <span class="flex-1 font-medium">{{ error }}</span>
    </div>

    <!-- ESTADO 1: TURNO ABIERTO (TARJETA ACTIVA) -->
    <div v-if="isShiftOpen && currentShift" class="space-y-6" data-testid="active-shift-card">
      <!-- Tarjeta Principal del Turno Abierto -->
      <div
        class="overflow-hidden rounded-xl border border-border-subtle bg-surface-card shadow-xs transition-colors"
      >
        <!-- Encabezado de la Tarjeta -->
        <div
          class="flex flex-col gap-4 border-b border-border-subtle bg-surface-sunken/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex flex-wrap items-center gap-3">
            <span
              class="font-mono text-base font-bold text-content-primary"
              data-testid="active-shift-code"
            >
              {{ currentShift.id }}
            </span>
            <BaseBadge variant="success" size="sm">
              <span class="flex items-center gap-1.5 font-medium">
                <span class="h-1.5 w-1.5 rounded-full bg-state-success animate-pulse" />
                Turno Abierto
              </span>
            </BaseBadge>
          </div>

          <div class="flex items-center gap-2">
            <BaseButton
              variant="danger"
              density="compact"
              data-testid="btn-close-shift"
              @click="isCloseModalOpen = true"
            >
              <template #icon-start>
                <Lock class="h-4 w-4" />
              </template>
              Cerrar Turno
            </BaseButton>
          </div>
        </div>

        <!-- Metadatos Operativos del Turno -->
        <div class="grid grid-cols-1 gap-4 border-b border-border-subtle p-5 sm:grid-cols-2 lg:grid-cols-3">
          <div class="flex items-center gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-sunken text-content-secondary"
            >
              <User class="h-4 w-4" />
            </div>
            <div>
              <span class="text-xs text-content-tertiary">Cajero Asignado</span>
              <p
                class="text-sm font-semibold text-content-primary"
                data-testid="active-shift-cashier"
              >
                {{ currentShift.cashierName }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-sunken text-content-secondary"
            >
              <Clock class="h-4 w-4" />
            </div>
            <div>
              <span class="text-xs text-content-tertiary">Hora de Apertura</span>
              <p
                class="text-sm font-semibold text-content-primary"
                data-testid="active-shift-opened-at"
              >
                {{ formatDate(currentShift.openedAt, { includeTime: true }) }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-sunken text-content-secondary"
            >
              <Store class="h-4 w-4" />
            </div>
            <div>
              <span class="text-xs text-content-tertiary">Almacén de Operación</span>
              <p
                class="text-sm font-semibold text-content-primary"
                data-testid="active-shift-warehouse"
              >
                ALM-TIENDA-01 (Almacén Principal)
              </p>
            </div>
          </div>
        </div>

        <!-- Secciones de Fondos y Resumen Operativo -->
        <div
          class="grid grid-cols-1 divide-y divide-border-subtle"
          :class="canSeeExpected
            ? 'lg:grid-cols-3 lg:divide-x lg:divide-y-0'
            : 'lg:grid-cols-2 lg:divide-x lg:divide-y-0'"
        >
          <!-- Columna 1: Fondo Inicial (siempre visible) -->
          <div class="p-5">
            <div class="flex items-center gap-2 mb-3">
              <Coins class="h-4 w-4 text-content-tertiary" />
              <h2 class="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                Fondo Inicial Asignado
              </h2>
            </div>
            <div class="space-y-3">
              <div
                class="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-sunken/40 p-3"
              >
                <span class="text-xs font-medium text-content-secondary">Efectivo CUP:</span>
                <span
                  class="font-mono text-sm font-bold text-content-primary"
                  data-testid="initial-funds-cup"
                >
                  {{ formatExplicitAmount(currentShift.initialFunds.CUP, 'CUP') }}
                </span>
              </div>
              <div
                class="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-sunken/40 p-3"
              >
                <span class="text-xs font-medium text-content-secondary">Efectivo USD:</span>
                <span
                  class="font-mono text-sm font-bold text-content-primary"
                  data-testid="initial-funds-usd"
                >
                  {{ formatExplicitAmount(currentShift.initialFunds.USD, 'USD') }}
                </span>
              </div>

              <!-- Tickets emitidos (solo cierre ciego, si el dato existe) -->
              <div
                v-if="!canSeeExpected && currentShift.ticketCount != null"
                class="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-sunken/40 p-3"
                data-testid="blind-ticket-count"
              >
                <span class="text-xs font-medium text-content-secondary">Tickets emitidos:</span>
                <span class="font-mono text-sm font-bold text-content-primary">
                  {{ currentShift.ticketCount }}
                </span>
              </div>
            </div>
          </div>

          <!-- Columna 2: Recaudación en Ventas (solo si canSeeExpected) -->
          <div v-if="canSeeExpected" class="p-5">
            <div class="flex items-center gap-2 mb-3">
              <TrendingUp class="h-4 w-4 text-state-success" />
              <h2 class="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                Ventas Cobradas en Turno
              </h2>
            </div>
            <div class="space-y-2">
              <div
                class="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-sunken/40 px-3 py-2 text-xs"
              >
                <span class="text-content-secondary">Efectivo CUP:</span>
                <span
                  class="font-mono font-semibold text-state-success"
                  data-testid="sales-cup-cash"
                >
                  +{{ formatExplicitAmount(currentShift.salesTotals.cupCash, 'CUP') }}
                </span>
              </div>
              <div
                class="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-sunken/40 px-3 py-2 text-xs"
              >
                <span class="text-content-secondary">Transferencia CUP:</span>
                <span
                  class="font-mono font-semibold text-content-primary"
                  data-testid="sales-cup-transfer"
                >
                  +{{ formatExplicitAmount(currentShift.salesTotals.cupTransfer, 'CUP') }}
                </span>
              </div>
              <div
                class="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-sunken/40 px-3 py-2 text-xs"
              >
                <span class="text-content-secondary">Efectivo USD:</span>
                <span
                  class="font-mono font-semibold text-state-success"
                  data-testid="sales-usd"
                >
                  +{{ formatExplicitAmount(currentShift.salesTotals.USD, 'USD') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Columna 3: Efectivo Esperado en Gaveta (solo si canSeeExpected) -->
          <div v-if="canSeeExpected" class="p-5 bg-surface-sunken/20">
            <div class="flex items-center gap-2 mb-3">
              <Wallet class="h-4 w-4 text-primary" />
              <h2 class="text-xs font-semibold uppercase tracking-wider text-content-secondary">
                Efectivo Esperado en Gaveta
              </h2>
            </div>
            <div class="space-y-3">
              <div
                class="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3"
              >
                <div>
                  <span class="block text-xs font-semibold text-primary">Esperado CUP</span>
                  <span class="text-[11px] text-content-tertiary">Fondo + Ventas Efectivo + Canjes</span>
                </div>
                <span
                  class="font-mono text-base font-extrabold text-primary"
                  data-testid="expected-cash-cup"
                >
                  {{ formatExplicitAmount(expectedDrawerCUP, 'CUP') }}
                </span>
              </div>
              <div
                class="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3"
              >
                <div>
                  <span class="block text-xs font-semibold text-primary">Esperado USD</span>
                  <span class="text-[11px] text-content-tertiary">Fondo + Ventas Efectivo + Canjes</span>
                </div>
                <span
                  class="font-mono text-base font-extrabold text-primary"
                  data-testid="expected-cash-usd"
                >
                  {{ formatExplicitAmount(expectedDrawerUSD, 'USD') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ESTADO 2: RESULTADO DEL ARQUEO TRAS CIERRE -->
    <div
      v-else-if="lastCloseResult"
      class="space-y-6"
      data-testid="close-arqueo-result"
    >
      <div class="overflow-hidden rounded-xl border border-border-subtle bg-surface-card shadow-xs">
        <!-- RESULTADO CIERRE CIEGO (sin permiso cash.view_history) -->
        <template v-if="!canSeeExpected">
          <div class="px-5 py-6 text-center" data-testid="blind-close-success">
            <div
              class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-state-success-border bg-state-success-bg text-state-success"
            >
              <CheckCircle2 class="h-6 w-6" />
            </div>
            <h2 class="text-base font-bold text-content-primary">
              Turno cerrado. Tu arqueo fue enviado a revision.
            </h2>

            <!-- Importes declarados por divisa -->
            <div class="mx-auto mt-4 max-w-sm space-y-2" data-testid="blind-declared-funds">
              <div
                class="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-sunken/40 px-3 py-2 text-xs"
              >
                <span class="text-content-secondary">Declarado CUP:</span>
                <span class="font-mono font-bold text-content-primary" data-testid="blind-counted-cup">
                  {{ formatExplicitAmount(lastCloseResult.countedFunds?.CUP, 'CUP') }}
                </span>
              </div>
              <div
                class="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-sunken/40 px-3 py-2 text-xs"
              >
                <span class="text-content-secondary">Declarado USD:</span>
                <span class="font-mono font-bold text-content-primary" data-testid="blind-counted-usd">
                  {{ formatExplicitAmount(lastCloseResult.countedFunds?.USD, 'USD') }}
                </span>
              </div>
            </div>

            <div class="mt-5 flex justify-center">
              <BaseButton
                variant="primary"
                density="compact"
                data-testid="btn-open-after-close"
                @click="openShiftModal"
              >
                <template #icon-start>
                  <Plus class="h-4 w-4" />
                </template>
                Abrir Nuevo Turno
              </BaseButton>
            </div>
          </div>
        </template>

        <!-- RESULTADO COMPLETO (con permiso cash.view_history) -->
        <template v-else>
          <!-- Cabecera de Arqueo -->
          <div
            class="flex flex-col gap-4 border-b border-border-subtle bg-surface-sunken/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-state-success-border bg-state-success-bg text-state-success"
              >
                <CheckCircle2 class="h-5 w-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-bold text-content-primary">
                    Arqueo de Cierre Registrado
                  </h2>
                  <BaseBadge variant="neutral" size="sm">
                    Turno {{ lastCloseResult.id }}
                  </BaseBadge>
                </div>
                <p class="text-xs text-content-secondary">
                  Turno cerrado el {{ formatDate(lastCloseResult.closedAt, { includeTime: true }) }} por
                  {{ lastCloseResult.cashierName }}
                </p>
              </div>
            </div>

            <BaseButton
              variant="primary"
              density="compact"
              data-testid="btn-open-after-close"
              @click="openShiftModal"
            >
              <template #icon-start>
                <Plus class="h-4 w-4" />
              </template>
              Abrir Nuevo Turno
            </BaseButton>
          </div>

          <!-- Tabla / Cuadrícula de Conciliación de Arqueo -->
          <div class="p-5">
            <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-content-secondary">
              Conciliación de Fondos por Divisa
            </h3>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <!-- Arqueo CUP -->
              <div
                class="rounded-xl border border-border-subtle bg-surface-sunken/30 p-4 space-y-3"
                data-testid="arqueo-card-cup"
              >
                <div class="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span class="text-sm font-bold text-content-primary">Moneda Nacional (CUP)</span>
                  <span class="font-mono text-xs text-content-secondary">Efectivo Físico</span>
                </div>

                <div class="space-y-1.5 text-xs">
                  <div class="flex justify-between">
                    <span class="text-content-secondary">Esperado en Gaveta:</span>
                    <span class="font-mono font-semibold text-content-primary" data-testid="arqueo-expected-cup">
                      {{ formatExplicitAmount(lastCloseResult.expectedFunds?.CUP, 'CUP') }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-content-secondary">Contado Físicamente:</span>
                    <span class="font-mono font-semibold text-content-primary" data-testid="arqueo-counted-cup">
                      {{ formatExplicitAmount(lastCloseResult.countedFunds?.CUP, 'CUP') }}
                    </span>
                  </div>
                </div>

                <!-- Indicador de Diferencia con Texto e Ícono -->
                <div
                  class="flex items-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition-colors"
                  :class="diffInfoCUP.bgClass"
                  data-testid="arqueo-diff-cup-indicator"
                >
                  <component :is="diffInfoCUP.icon" class="h-4 w-4 shrink-0" />
                  <span class="flex-1">{{ diffInfoCUP.label }}</span>
                </div>
              </div>

              <!-- Arqueo USD -->
              <div
                class="rounded-xl border border-border-subtle bg-surface-sunken/30 p-4 space-y-3"
                data-testid="arqueo-card-usd"
              >
                <div class="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span class="text-sm font-bold text-content-primary">Dólar Estadounidense (USD)</span>
                  <span class="font-mono text-xs text-content-secondary">Efectivo Físico</span>
                </div>

                <div class="space-y-1.5 text-xs">
                  <div class="flex justify-between">
                    <span class="text-content-secondary">Esperado en Gaveta:</span>
                    <span class="font-mono font-semibold text-content-primary" data-testid="arqueo-expected-usd">
                      {{ formatExplicitAmount(lastCloseResult.expectedFunds?.USD, 'USD') }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-content-secondary">Contado Físicamente:</span>
                    <span class="font-mono font-semibold text-content-primary" data-testid="arqueo-counted-usd">
                      {{ formatExplicitAmount(lastCloseResult.countedFunds?.USD, 'USD') }}
                    </span>
                  </div>
                </div>

                <!-- Indicador de Diferencia con Texto e Ícono -->
                <div
                  class="flex items-center gap-2 rounded-lg border p-2.5 text-xs font-semibold transition-colors"
                  :class="diffInfoUSD.bgClass"
                  data-testid="arqueo-diff-usd-indicator"
                >
                  <component :is="diffInfoUSD.icon" class="h-4 w-4 shrink-0" />
                  <span class="flex-1">{{ diffInfoUSD.label }}</span>
                </div>
              </div>
            </div>

            <!-- Justificación registrada si hubo descuadre -->
            <div
              v-if="lastCloseResult.discrepancyReason || lastCloseResult.notes"
              class="mt-4 rounded-xl border border-border-subtle bg-surface-card p-3.5 text-xs"
              data-testid="arqueo-reason-box"
            >
              <div class="flex items-center gap-2 mb-1">
                <FileText class="h-3.5 w-3.5 text-content-tertiary" />
                <span class="font-semibold text-content-secondary">
                  Justificación y Observaciones de Cierre:
                </span>
              </div>
              <p class="italic text-content-primary">
                {{ lastCloseResult.discrepancyReason || lastCloseResult.notes }}
              </p>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- ESTADO 3: SIN TURNO ABIERTO (ESTADO VACÍO) -->
    <div
      v-else
      class="space-y-6"
      data-testid="empty-shift-state"
    >
      <div
        class="overflow-hidden rounded-xl border border-dashed border-border-subtle bg-surface-card/60 p-6 sm:p-10 text-center"
      >
        <div
          class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border-subtle bg-surface-sunken text-content-muted"
        >
          <Coins class="h-7 w-7 text-primary" />
        </div>

        <h2 class="text-lg font-bold text-content-primary">
          Sin Turno de Caja Abierto
        </h2>
        <p class="mx-auto mt-1.5 max-w-md text-xs text-content-secondary sm:text-sm">
          Actualmente no hay ningún turno operativo activo en este terminal. Debe abrir un turno para comenzar a registrar cobros y ventas en mostrador.
        </p>

        <!-- Resumen de Configuración Inicial Predeterminada -->
        <div class="mx-auto mt-6 max-w-lg rounded-xl border border-border-subtle bg-surface-sunken/40 p-4 text-left">
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-content-secondary">
            Parámetros de Apertura Predeterminados
          </h3>

          <div class="space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-content-secondary flex items-center gap-1.5">
                <Store class="h-3.5 w-3.5 text-content-tertiary" />
                Almacén Asignado:
              </span>
              <span class="font-semibold text-content-primary" data-testid="default-warehouse">
                ALM-TIENDA-01 (Almacén Principal)
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-content-secondary flex items-center gap-1.5">
                <Coins class="h-3.5 w-3.5 text-content-tertiary" />
                Fondo Inicial Sugerido (CUP):
              </span>
              <span class="font-mono font-bold text-content-primary" data-testid="default-initial-cup">
                {{ formatExplicitAmount('10000.00', 'CUP') }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-content-secondary flex items-center gap-1.5">
                <Coins class="h-3.5 w-3.5 text-content-tertiary" />
                Fondo Inicial Sugerido (USD):
              </span>
              <span class="font-mono font-bold text-content-primary" data-testid="default-initial-usd">
                {{ formatExplicitAmount('100.00', 'USD') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Botón de Apertura -->
        <div class="mt-6 flex justify-center">
          <BaseButton
            variant="primary"
            density="compact"
            data-testid="btn-open-shift"
            @click="openShiftModal"
          >
            <template #icon-start>
              <Plus class="h-4 w-4" />
            </template>
            Abrir Turno
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Modales Compartidos -->
    <OpenShiftModal
      :open="isOpenModalOpen"
      :default-rate-u-s-d="dailyRateUSD"
      @update:open="isOpenModalOpen = $event"
      @success="handleOpenShiftSuccess"
    />

    <CloseShiftModal
      :open="isCloseModalOpen"
      :shift="currentShift"
      :can-see-expected="canSeeExpected"
      @update:open="isCloseModalOpen = $event"
      @success="handleCloseShiftSuccess"
      @close="isCloseModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Coins,
  Plus,
  Lock,
  User,
  Clock,
  Store,
  TrendingUp,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-vue-next'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseBadge from '@/shared/ui/BaseBadge.vue'
import OpenShiftModal from '@/features/sales/components/OpenShiftModal.vue'
import CloseShiftModal from '@/features/sales/components/CloseShiftModal.vue'
import { usePosShift } from '@/features/sales/composables/usePosShift'
import { useAuthStore } from '@/features/auth/stores/authStore'
import type { ShiftCloseResult } from '@/features/sales/types'
import { formatDate } from '@/shared/utils/formatDate'
import {
  addDecimals,
  compareDecimals,
} from '@/shared/utils/decimal'

const {
  currentShift,
  isShiftOpen,
  dailyRateUSD,
  error,
  loadShiftData,
} = usePosShift()

const authStore = useAuthStore()

const isOpenModalOpen = ref(false)
const isCloseModalOpen = ref(false)
const lastCloseResult = ref<ShiftCloseResult | null>(null)

/**
 * El backend decide quien ve los montos esperados.
 * Solo los usuarios con permiso cash.view_history ven esperado/diferencia.
 */
const canSeeExpected = computed<boolean>(() => {
  return authStore.hasPermission('cash.view_history')
})

/**
 * Formatea cantidades con moneda explícita ("1,200.00 CUP" / "100.00 USD")
 * mediante manipulación directa de strings sin conversión a coma flotante.
 */
function formatExplicitAmount(
  amount: string | undefined | null,
  currency: string
): string {
  if (!amount) {
    return `0.00 ${currency}`
  }
  const trimmed = amount.trim()
  const isNegative = trimmed.startsWith('-')
  const clean = isNegative ? trimmed.slice(1) : trimmed
  const [intPart = '0', decPart = '00'] = clean.split('.')
  const formattedDec = (decPart + '00').slice(0, 2)
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = isNegative ? '-' : ''
  return `${sign}${formattedInt}.${formattedDec} ${currency}`
}

/**
 * Efectivo esperado en gaveta para CUP
 */
const expectedDrawerCUP = computed<string>(() => {
  if (!currentShift.value) return '0.00'
  const base = addDecimals(
    currentShift.value.initialFunds.CUP,
    currentShift.value.salesTotals.cupCash
  )
  return addDecimals(base, currentShift.value.exchangeAdjustments.CUP)
})

/**
 * Efectivo esperado en gaveta para USD
 */
const expectedDrawerUSD = computed<string>(() => {
  if (!currentShift.value) return '0.00'
  const base = addDecimals(
    currentShift.value.initialFunds.USD,
    currentShift.value.salesTotals.USD
  )
  return addDecimals(base, currentShift.value.exchangeAdjustments.USD)
})

/**
 * Indicador de diferencia con texto explícito e icono para CUP
 */
const diffInfoCUP = computed(() => {
  const diff = lastCloseResult.value?.differences?.CUP || '0.00'
  const comp = compareDecimals(diff, '0.00')
  if (comp === 0) {
    return {
      label: 'Exacto (sin diferencia): 0.00 CUP',
      bgClass: 'bg-state-success-bg border-state-success-border text-state-success',
      icon: CheckCircle2,
    }
  } else if (comp > 0) {
    return {
      label: `Sobrante: +${formatExplicitAmount(diff, 'CUP')}`,
      bgClass: 'bg-state-warning-bg border-state-warning-border text-state-warning',
      icon: TrendingUp,
    }
  } else {
    return {
      label: `Faltante: ${formatExplicitAmount(diff, 'CUP')}`,
      bgClass: 'bg-state-error-bg border-state-error-border text-state-error',
      icon: AlertTriangle,
    }
  }
})

/**
 * Indicador de diferencia con texto explícito e icono para USD
 */
const diffInfoUSD = computed(() => {
  const diff = lastCloseResult.value?.differences?.USD || '0.00'
  const comp = compareDecimals(diff, '0.00')
  if (comp === 0) {
    return {
      label: 'Exacto (sin diferencia): 0.00 USD',
      bgClass: 'bg-state-success-bg border-state-success-border text-state-success',
      icon: CheckCircle2,
    }
  } else if (comp > 0) {
    return {
      label: `Sobrante: +${formatExplicitAmount(diff, 'USD')}`,
      bgClass: 'bg-state-warning-bg border-state-warning-border text-state-warning',
      icon: TrendingUp,
    }
  } else {
    return {
      label: `Faltante: ${formatExplicitAmount(diff, 'USD')}`,
      bgClass: 'bg-state-error-bg border-state-error-border text-state-error',
      icon: AlertTriangle,
    }
  }
})

const openShiftModal = () => {
  isOpenModalOpen.value = true
}

const handleOpenShiftSuccess = async () => {
  isOpenModalOpen.value = false
  lastCloseResult.value = null
  await loadShiftData()
}

const handleCloseShiftSuccess = (result: ShiftCloseResult) => {
  lastCloseResult.value = result
  isCloseModalOpen.value = false
}

onMounted(() => {
  loadShiftData()
})

defineExpose({
  handleCloseShiftSuccess,
  lastCloseResult,
})
</script>
