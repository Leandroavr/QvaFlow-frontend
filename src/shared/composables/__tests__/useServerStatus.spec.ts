import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useServerStatus, _resetSharedServerStatusState } from '../useServerStatus'
import { authService } from '../../../services'
import { useUiStore } from '../../stores/uiStore'

describe('useServerStatus Composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    _resetSharedServerStatusState()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    _resetSharedServerStatusState()
    vi.clearAllTimers()
  })

  it('resuelve el estado del servidor a "connected" en modo mock en menos de 2 segundos', async () => {
    const startTime = Date.now()
    const { serverStatus, checkConnection } = useServerStatus()

    expect(serverStatus.value).toBe('checking')

    await checkConnection()

    const elapsedTimeMs = Date.now() - startTime
    expect(elapsedTimeMs).toBeLessThan(2000)
    expect(serverStatus.value).toBe('connected')
  })

  it('mantiene la reactividad al desestructurar y refleja cambios del store', async () => {
    const uiStore = useUiStore()
    const { serverStatus, isServerAvailable } = useServerStatus()

    expect(serverStatus.value).toBe('checking')
    expect(isServerAvailable.value).toBe(true)

    uiStore.setServerStatus('connected')
    expect(serverStatus.value).toBe('connected')
    expect(isServerAvailable.value).toBe(true)

    uiStore.setServerStatus('disconnected')
    expect(serverStatus.value).toBe('disconnected')
    expect(isServerAvailable.value).toBe(false)
  })

  it('comparte un único temporizador (single polling) entre múltiples componentes montados', async () => {
    const setIntervalSpy = vi.spyOn(window, 'setInterval')

    const TestComponentA = defineComponent({
      setup() {
        const { serverStatus } = useServerStatus(10000)
        return () => h('div', { class: 'comp-a' }, serverStatus.value)
      },
    })

    const TestComponentB = defineComponent({
      setup() {
        const { serverStatus } = useServerStatus(10000)
        return () => h('div', { class: 'comp-b' }, serverStatus.value)
      },
    })

    const wrapperA = mount(TestComponentA)
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    // El segundo componente montado no debe iniciar otro setInterval
    const wrapperB = mount(TestComponentB)
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    wrapperA.unmount()
    // Aún queda wrapperB activo, no debe cancelarse
    wrapperB.unmount()
    // Al desmontarse el último componente, se limpia el polling compartido
  })

  it('actualiza el estado a "disconnected" si authService.checkHealth lanza un error', async () => {
    vi.spyOn(authService, 'checkHealth').mockRejectedValueOnce(new Error('Network offline'))

    const { serverStatus, isServerAvailable, checkConnection } = useServerStatus()
    await checkConnection()

    expect(serverStatus.value).toBe('disconnected')
    expect(isServerAvailable.value).toBe(false)
  })

  it('responde inmediatamente al evento offline de la red del navegador', async () => {
    const TestComponent = defineComponent({
      setup() {
        useServerStatus()
        return () => h('div', 'test')
      },
    })

    const wrapper = mount(TestComponent)
    const { serverStatus } = useServerStatus()

    window.dispatchEvent(new Event('offline'))
    expect(serverStatus.value).toBe('disconnected')

    wrapper.unmount()
  })
})
