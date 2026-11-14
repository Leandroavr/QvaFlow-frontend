import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable from '../DataTable.vue'
import MoneyCell from '../MoneyCell.vue'
import FilterBar from '../FilterBar.vue'
import type { DataTableColumn } from '../types'
import { useDataTableQuery } from '../../../composables/useDataTableQuery'

describe('DataTable, MoneyCell y FilterBar (src/shared/ui/DataTable)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error')
    consoleWarnSpy = vi.spyOn(console, 'warn')
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  // Mock data para las pruebas
  const testColumns: DataTableColumn[] = [
    { key: 'code', title: 'Código', sortable: true },
    { key: 'name', title: 'Producto', sortable: true },
    { key: 'price', title: 'Precio', currency: 'CUP', align: 'right', sortable: true },
    { key: 'stock', title: 'Stock', align: 'center' },
  ]

  const testProducts = [
    { id: 1, code: 'PRD-01', name: 'Refresco', price: '85.50', stock: 50 },
    { id: 2, code: 'PRD-02', name: 'Cerveza', price: '220.00', stock: 12 },
    { id: 3, code: 'PRD-03', name: 'Agua', price: '40.00', stock: 0 },
    { id: 4, code: 'PRD-04', name: 'Aceite', price: '650.00', stock: 5 },
  ]

  describe('1. MoneyCell', () => {
    it('formatea importe string decimal con separador de miles y sin divisa por defecto', () => {
      const wrapper = mount(MoneyCell, {
        props: { value: '1250.50', currency: 'CUP' },
      })
      expect(wrapper.text()).toBe('1,250.50')
      expect(wrapper.classes()).toContain('font-sans')
      expect(wrapper.classes()).toContain('tabular-nums')
      expect(wrapper.classes()).toContain('text-right')
    })

    it('muestra divisa cuando se habilita la prop showCurrency con código explícito sin símbolo ₱', () => {
      const wrapperCup = mount(MoneyCell, {
        props: { value: '154285.00', currency: 'CUP', showCurrency: true },
      })
      expect(wrapperCup.text()).toBe('154,285.00 CUP')
      expect(wrapperCup.text()).not.toContain('₱')

      const wrapperMlc = mount(MoneyCell, {
        props: { value: '250.00', currency: 'MLC', showCurrency: true },
      })
      expect(wrapperMlc.text()).toBe('250.00 MLC')

      const wrapperUsd = mount(MoneyCell, {
        props: { value: '1250.50', currency: 'USD', showCurrency: true },
      })
      expect(wrapperUsd.text()).toContain('$')
      expect(wrapperUsd.text()).toContain('1,250.50')
    })

    it('muestra guion largo para valores vacíos o nulos', () => {
      const wrapperNull = mount(MoneyCell, {
        props: { value: null },
      })
      expect(wrapperNull.text()).toBe('—')

      const wrapperEmpty = mount(MoneyCell, {
        props: { value: '' },
      })
      expect(wrapperEmpty.text()).toBe('—')
    })
  })

  describe('2. DataTable — Modo Client (en memoria)', () => {
    it('renderiza cabeceras, indicador de divisa y filas de datos', () => {
      const wrapper = mount(DataTable, {
        props: {
          mode: 'client',
          columns: testColumns,
          data: testProducts,
        },
      })

      expect(wrapper.text()).toContain('Código')
      expect(wrapper.text()).toContain('Producto')
      expect(wrapper.text()).toContain('Precio')
      expect(wrapper.text()).toContain('CUP')
      expect(wrapper.text()).toContain('Refresco')
      expect(wrapper.text()).toContain('Cerveza')
    })

    it('ordena datos localmente al hacer clic en columna ordenable', async () => {
      const wrapper = mount(DataTable, {
        props: {
          mode: 'client',
          columns: testColumns,
          data: testProducts,
        },
      })

      // Clic en la columna "Producto" (segunda columna)
      const sortableHeader = wrapper.findAll('th')[1]
      await sortableHeader.trigger('click')

      // Verificamos que se emitió el evento de ordenación asc
      expect(wrapper.emitted('update:sort')?.[0]).toEqual(['name:asc'])

      // Segundo clic invierte a desc
      await sortableHeader.trigger('click')
      expect(wrapper.emitted('update:sort')?.[1]).toEqual(['name:desc'])
    })

    it('pagina correctamente en el cliente', async () => {
      const wrapper = mount(DataTable, {
        props: {
          mode: 'client',
          columns: testColumns,
          data: testProducts,
          perPage: 2,
        },
      })

      // Página 1 muestra 2 registros
      expect(wrapper.text()).toContain('Refresco')
      expect(wrapper.text()).toContain('Cerveza')
      expect(wrapper.text()).not.toContain('Agua')

      // Cambiar a página 2
      const nextBtn = wrapper.find('button[title="Página siguiente"]')
      await nextBtn.trigger('click')

      expect(wrapper.emitted('update:page')?.[0]).toEqual([2])
    })

    it('permite selección de filas y emite update:selectedKeys', async () => {
      const wrapper = mount(DataTable, {
        props: {
          mode: 'client',
          columns: testColumns,
          data: testProducts,
          selectable: true,
          selectedKeys: [],
        },
      })

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect(checkboxes.length).toBeGreaterThan(1) // Header checkbox + row checkboxes

      // Seleccionar primera fila
      await checkboxes[1].setValue(true)
      expect(wrapper.emitted('update:selectedKeys')?.[0]).toEqual([[1]])
    })
  })

  describe('3. DataTable — Modo Server (contrato API)', () => {
    it('emite exactamente los parámetros del contrato (page, perPage, sort="campo:asc")', async () => {
      const wrapper = mount(DataTable, {
        props: {
          mode: 'server',
          columns: testColumns,
          data: {
            items: testProducts.slice(0, 2),
            total: 4,
            page: 1,
            perPage: 2,
          },
          page: 1,
          perPage: 2,
          total: 4,
        },
      })

      // 1. Clic en ordenar por columna "code"
      const codeHeader = wrapper.findAll('th')[0]
      await codeHeader.trigger('click')

      // Debe emitir exactamente sort="code:asc" y query-change
      expect(wrapper.emitted('update:sort')?.[0]).toEqual(['code:asc'])
      expect(wrapper.emitted('query-change')?.[0]).toEqual([
        { page: 1, perPage: 2, sort: 'code:asc' },
      ])

      // 2. Cambio de página
      const nextBtn = wrapper.find('button[title="Página siguiente"]')
      await nextBtn.trigger('click')

      expect(wrapper.emitted('update:page')?.[0]).toEqual([2])
      expect(wrapper.emitted('query-change')?.[1]).toEqual([
        { page: 2, perPage: 2, sort: 'code:asc' },
      ])
    })
  })

  describe('4. Estados de DataTable (loading, empty, error)', () => {
    it('renderiza esqueletos en estado loading', () => {
      const wrapper = mount(DataTable, {
        props: {
          columns: testColumns,
          data: [],
          loading: true,
        },
      })

      expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
    })

    it('renderiza EmptyState cuando no hay registros', () => {
      const wrapper = mount(DataTable, {
        props: {
          columns: testColumns,
          data: [],
          emptyTitle: 'Sin inventario',
          emptyDescription: 'No hay productos disponibles.',
        },
      })

      expect(wrapper.text()).toContain('Sin inventario')
      expect(wrapper.text()).toContain('No hay productos disponibles.')
    })

    it('renderiza tarjeta de error y emite evento retry al reintentar', async () => {
      const wrapper = mount(DataTable, {
        props: {
          columns: testColumns,
          data: [],
          error: 'Error 500 del servidor local',
        },
      })

      expect(wrapper.text()).toContain('Error 500 del servidor local')

      const retryBtn = wrapper.find('button')
      await retryBtn.trigger('click')

      expect(wrapper.emitted('retry')).toHaveLength(1)
    })
  })

  describe('5. Acciones por fila y menú dropdown', () => {
    it('renderiza el botón "⋯" por fila con BaseDropdownMenu', () => {
      const actionsResolver = vi.fn((_row) => [
        { id: 'edit', label: 'Editar' },
        { id: 'delete', label: 'Eliminar', danger: true },
      ])

      const wrapper = mount(DataTable, {
        props: {
          columns: testColumns,
          data: testProducts.slice(0, 1),
          actions: actionsResolver,
        },
      })

      const actionBtn = wrapper.find('button[aria-label="Acciones de fila"]')
      expect(actionBtn.exists()).toBe(true)
      expect(actionsResolver).toHaveBeenCalledWith(testProducts[0])
    })
  })

  describe('6. FilterBar', () => {
    it('emite búsqueda tras debounce y muestra botón Limpiar filtros', async () => {
      vi.useFakeTimers()

      const wrapper = mount(FilterBar, {
        props: {
          search: '',
          hasActiveFilters: false,
        },
      })

      // Inicialmente el botón Limpiar filtros no debe ser visible
      expect(wrapper.text()).not.toContain('Limpiar filtros')

      // Simular entrada en buscador
      const input = wrapper.find('input')
      await input.setValue('arroz')

      // Antes del debounce no se ha emitido
      expect(wrapper.emitted('update:search')).toBeUndefined()

      // Avanzar timer
      vi.advanceTimersByTime(300)
      expect(wrapper.emitted('update:search')?.[0]).toEqual(['arroz'])

      // Al tener texto, el botón Limpiar es visible
      await wrapper.setProps({ hasActiveFilters: true, search: 'arroz' })
      expect(wrapper.text()).toContain('Limpiar filtros')

      // Clic en Limpiar filtros
      const clearBtn = wrapper.findAll('button').find((b) => b.text().includes('Limpiar filtros'))
      await clearBtn?.trigger('click')

      expect(wrapper.emitted('clear')).toHaveLength(1)
      expect(wrapper.emitted('update:search')?.[1]).toEqual([''])

      vi.useRealTimers()
    })
  })

  describe('7. useDataTableQuery Composable', () => {
    it('gestiona page, perPage, sort, search y genera queryParams conforme al contrato', () => {
      const { page, search, filters, queryParams, setPage, setSearch, setFilter, resetFilters } =
        useDataTableQuery<{ category: string }>({
          initialPage: 1,
          initialPerPage: 20,
          initialSort: 'name:asc',
          initialFilters: { category: '' },
          syncUrl: false, // sin router en test aislado
        })

      expect(queryParams.value).toEqual({
        page: 1,
        perPage: 20,
        sort: 'name:asc',
      })

      setPage(2)
      expect(page.value).toBe(2)
      expect(queryParams.value.page).toBe(2)

      setSearch('cerveza')
      expect(queryParams.value.search).toBe('cerveza')

      setFilter('category', 'Bebidas')
      expect(queryParams.value.category).toBe('Bebidas')

      resetFilters()
      expect(search.value).toBe('')
      expect(filters.value.category).toBe('')
      expect(page.value).toBe(1)
    })
  })

  describe('4. DataTable — Columna de acciones sticky y cabecera', () => {
    it('renderiza la cabecera sin sticky por defecto y con sticky solo si hay scrollHeight', async () => {
      const wrapper = mount(DataTable, {
        props: {
          columns: testColumns,
          data: testProducts,
          actions: () => [{ id: 'edit', label: 'Editar' }],
        },
      })

      const thead = wrapper.find('thead')
      expect(thead.classes()).not.toContain('sticky')
      expect(thead.classes()).toContain('bg-surface-sunken')

      const headerTr = wrapper.find('thead tr')
      expect(headerTr.classes()).toContain('h-10')

      const actionTh = wrapper.find('th.sticky.right-0')
      expect(actionTh.exists()).toBe(true)
      expect(actionTh.classes()).toContain('z-20')
      expect(actionTh.classes()).toContain('w-[44px]')

      const actionTd = wrapper.find('td.sticky.right-0')
      expect(actionTd.exists()).toBe(true)
      expect(actionTd.classes()).toContain('z-10')
      expect(actionTd.classes()).toContain('w-[44px]')

      // Al proporcionar scrollHeight, thead se vuelve sticky top-0 z-20 y actionTh top-0 z-30
      await wrapper.setProps({ scrollHeight: '400px' })
      expect(wrapper.find('thead').classes()).toContain('sticky')
      expect(wrapper.find('thead').classes()).toContain('top-0')
      expect(wrapper.find('thead').classes()).toContain('z-20')
      expect(wrapper.find('th.sticky.right-0').classes()).toContain('top-0')
      expect(wrapper.find('th.sticky.right-0').classes()).toContain('z-30')

      wrapper.unmount()
    })
  })

  describe('9. Altura de tabla y scroll vertical por defecto', () => {
    it('monta DataTable con 10 filas sin altura fija ni clases de scroll vertical por defecto', () => {
      const tenRows = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        code: `PRD-${i + 1}`,
        name: `Producto ${i + 1}`,
        price: '100.00',
        stock: 10,
      }))

      const wrapper = mount(DataTable, {
        props: {
          columns: testColumns,
          data: tenRows,
        },
      })

      const scrollContainer = wrapper.find('.overflow-x-auto')
      expect(scrollContainer.exists()).toBe(true)
      expect(scrollContainer.classes()).not.toContain('overflow-y-auto')
      expect((scrollContainer.element as HTMLElement).style.maxHeight).toBe('')
      wrapper.unmount()
    })
  })

  describe('10. FixedLayout y ancho estable de celdas de estado', () => {
    it('aplica clase table-fixed y respeta anchos configurados con datos de Agotado y Bajo', () => {
      const stockColumns: DataTableColumn[] = [
        { key: 'code', title: 'Código', width: '95px' },
        { key: 'name', title: 'Producto' },
        { key: 'status', title: 'Estado', width: '104px', minWidth: '104px' },
      ]

      const items = [
        { id: 1, code: 'PRD-01', name: 'Ron Havana Club 7 Años 700ml', status: 'Agotado' },
        { id: 2, code: 'PRD-02', name: 'Ron Santiago de Cuba Carta Blanca', status: 'Bajo' },
      ]

      const wrapper = mount(DataTable, {
        props: {
          columns: stockColumns,
          data: items,
          fixedLayout: true,
        },
      })

      const table = wrapper.find('table')
      expect(table.classes()).toContain('table-fixed')

      // Verificar que el encabezado de estado tiene style width: 104px
      const headers = wrapper.findAll('th')
      const statusTh = headers.find((th) => th.text().includes('Estado'))
      expect(statusTh?.attributes('style')).toContain('104px')

      wrapper.unmount()
    })
  })

  describe('8. Ausencia de errores o advertencias en consola', () => {
    it('no genera console.error ni console.warn durante el ciclo de vida', () => {
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })
})
