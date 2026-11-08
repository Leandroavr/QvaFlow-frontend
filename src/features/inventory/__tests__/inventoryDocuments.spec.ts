import { describe, it, expect, beforeEach } from 'vitest'
import { MockInventoryService } from '@/services/mock/mockInventoryService'
import { ApiError } from '@/shared/types/api'

describe('Documentos de Inventario: Traslados y Ajustes (MockInventoryService)', () => {
  let service: MockInventoryService

  beforeEach(() => {
    localStorage.clear()
    // Por defecto autenticado como almacenero con permisos completos de inventario
    localStorage.setItem('qvaflow_token', 'mock-jwt-token-almacenero-qvaflow-def-2026')
    service = new MockInventoryService()
  })

  // 1. Traslado válido: stock origen baja, destino sube, el documento nace CONFIRMED con numeración TRF-
  it('1. realiza un traslado válido: stock origen baja, destino sube y genera documento CONFIRMED con prefijo TRF-', async () => {
    // 78910001 tiene 24.00 en LOC-TND-E1 y 0 en LOC-CEN-P1
    const res = await service.createTransfer({
      reason: 'Reabastecimiento de prueba',
      items: [
        {
          productCode: '78910001',
          quantity: '4.00',
          sourceLocationCode: 'LOC-TND-E1',
          targetLocationCode: 'LOC-CEN-P1',
        },
      ],
    })

    expect(res.id).toBeDefined()
    expect(res.status).toBe('CONFIRMED')
    expect(res.noDocument).toMatch(/^TRF-\d{4}-\d{4}$/)
    expect(res.createdBy).toBe('almacenero')
    expect(res.items).toHaveLength(1)
    expect(res.items[0].quantity).toBe('4.00')
    expect(res.items[0].sourceWarehouseName).toBe('Tienda Principal')
    expect(res.items[0].targetWarehouseName).toBe('Almacén Central')

    // Verificar existencias actualizadas en el servicio
    const originStock = await service.getStock({
      location: 'LOC-TND-E1',
      search: '78910001',
    })
    const targetStock = await service.getStock({
      location: 'LOC-CEN-P1',
      search: '78910001',
    })

    expect(originStock.items[0].quantity).toBe('20.00')
    expect(targetStock.items[0].quantity).toBe('4.00')
  })

  // 2. Origen igual a destino: 400
  it('2. rechaza con 400 si la localización de origen es igual a la de destino', async () => {
    await expect(
      service.createTransfer({
        reason: 'Traslado inválido',
        items: [
          {
            productCode: '78910001',
            quantity: '5.00',
            sourceLocationCode: 'LOC-TND-E1',
            targetLocationCode: 'LOC-TND-E1',
          },
        ],
      })
    ).rejects.toThrow(ApiError)

    try {
      await service.createTransfer({
        reason: 'Traslado inválido',
        items: [
          {
            productCode: '78910001',
            quantity: '5.00',
            sourceLocationCode: 'LOC-TND-E1',
            targetLocationCode: 'LOC-TND-E1',
          },
        ],
      })
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
      expect(err.code).toBe('VALIDATION_ERROR')
      expect(err.details?.targetLocationCode).toBeDefined()
    }
  })

  // 3. Stock insuficiente: 409 con availableQuantity, y el stock no cambia (atomicidad)
  it('3. rechaza con 409 STOCK_INSUFFICIENT con availableQuantity y mantiene intacto el stock origen', async () => {
    // 78910001 tiene 24.00 en LOC-TND-E1
    try {
      await service.createTransfer({
        reason: 'Intento de sobregiro',
        items: [
          {
            productCode: '78910001',
            quantity: '50.00',
            sourceLocationCode: 'LOC-TND-E1',
            targetLocationCode: 'LOC-CEN-P1',
          },
        ],
      })
      expect.unreachable('Debió lanzar ApiError 409')
    } catch (err: any) {
      expect(err.statusCode).toBe(409)
      expect(err.code).toBe('STOCK_INSUFFICIENT')
      expect(err.details?.availableQuantity).toBe('24.00')
      expect(err.details?.requestedQuantity).toBe('50.00')
    }

    // Atomicidad: el stock origen no debió cambiar
    const stockAfter = await service.getStock({
      location: 'LOC-TND-E1',
      search: '78910001',
    })
    expect(stockAfter.items[0].quantity).toBe('24.00')
  })

  // 4. Dos líneas del mismo producto y origen cuya suma supera el stock: 409
  it('4. rechaza con 409 si dos líneas del mismo producto y origen superan el stock acumulado', async () => {
    // 78910001 tiene 24.00 en LOC-TND-E1; pedimos 15.00 + 15.00 = 30.00
    try {
      await service.createTransfer({
        reason: 'Doble línea acumulada excedida',
        items: [
          {
            productCode: '78910001',
            quantity: '15.00',
            sourceLocationCode: 'LOC-TND-E1',
            targetLocationCode: 'LOC-CEN-P1',
          },
          {
            productCode: '78910001',
            quantity: '15.00',
            sourceLocationCode: 'LOC-TND-E1',
            targetLocationCode: 'LOC-CEN-EA',
          },
        ],
      })
      expect.unreachable('Debió lanzar ApiError 409')
    } catch (err: any) {
      expect(err.statusCode).toBe(409)
      expect(err.code).toBe('STOCK_INSUFFICIENT')
      expect(err.details?.requestedQuantity).toBe('30.00')
      expect(err.details?.availableQuantity).toBe('24.00')
    }

    const stock = await service.getStock({
      location: 'LOC-TND-E1',
      search: '78910001',
    })
    expect(stock.items[0].quantity).toBe('24.00')
  })

  // 5. Items vacío y cantidad no positiva: 400
  it('5. rechaza con 400 cuando items está vacío o contiene cantidad no positiva', async () => {
    // Items vacío
    await expect(
      service.createTransfer({
        reason: 'Sin items',
        items: [],
      })
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' })

    // Cantidad cero
    await expect(
      service.createTransfer({
        reason: 'Cantidad cero',
        items: [
          {
            productCode: '78910001',
            quantity: '0.00',
            sourceLocationCode: 'LOC-TND-E1',
            targetLocationCode: 'LOC-CEN-P1',
          },
        ],
      })
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' })

    // Cantidad negativa
    await expect(
      service.createTransfer({
        reason: 'Cantidad negativa',
        items: [
          {
            productCode: '78910001',
            quantity: '-5.00',
            sourceLocationCode: 'LOC-TND-E1',
            targetLocationCode: 'LOC-CEN-P1',
          },
        ],
      })
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' })
  })

  // 6. Localización inexistente: 404
  it('6. rechaza con 404 cuando la localización o el producto no existen', async () => {
    await expect(
      service.createTransfer({
        reason: 'Localización fantasma',
        items: [
          {
            productCode: '78910001',
            quantity: '1.00',
            sourceLocationCode: 'LOC-TND-E1',
            targetLocationCode: 'LOC-INEXISTENTE',
          },
        ],
      })
    ).rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' })
  })

  // 7. Sin permiso: 403 al crear
  it('7. rechaza con 403 al crear traslados o ajustes sin los permisos correspondientes', async () => {
    // Autenticamos como vendedor (no tiene inventory.transfer ni inventory.adjust)
    localStorage.setItem('qvaflow_token', 'mock-jwt-token-vendedor-qvaflow-abc-2026')

    await expect(
      service.createTransfer({
        reason: 'Sin permiso',
        items: [
          {
            productCode: '78910001',
            quantity: '1.00',
            sourceLocationCode: 'LOC-TND-E1',
            targetLocationCode: 'LOC-CEN-P1',
          },
        ],
      })
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' })

    await expect(
      service.createAdjustment({
        reason: 'Sin permiso',
        items: [
          {
            productCode: '78910001',
            locationCode: 'LOC-TND-E1',
            countedQuantity: '10.00',
          },
        ],
      })
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' })
  })

  // 8. Ajuste a 0: se acepta; systemQuantity y difference correctos
  it('8. acepta ajuste a 0 registrando systemQuantity y difference correctamente', async () => {
    // 78910005 tiene 8.00 en LOC-TND-M1
    const res = await service.createAdjustment({
      reason: 'Pérdida total por rotura',
      items: [
        {
          productCode: '78910005',
          locationCode: 'LOC-TND-M1',
          countedQuantity: '0.00',
        },
      ],
    })

    expect(res.status).toBe('CONFIRMED')
    expect(res.noDocument).toMatch(/^AJU-\d{4}-\d{4}$/)
    expect(res.items[0].systemQuantity).toBe('8.00')
    expect(res.items[0].countedQuantity).toBe('0.00')
    expect(res.items[0].difference).toBe('-8.00')

    const stock = await service.getStock({
      location: 'LOC-TND-M1',
      search: '78910005',
    })
    expect(stock.items[0].quantity).toBe('0.00')
  })

  // 9. Ajuste con conteo mayor y menor que el sistema: difference con signo
  it('9. calcula difference con signo positivo o negativo en ajustes mayores y menores que el sistema', async () => {
    // 78910001 tiene 24.00 en LOC-TND-E1 -> ajustamos a 28.00 (+4.00)
    // 78910002 tiene 15.00 en LOC-CEN-P1 -> ajustamos a 10.00 (-5.00)
    const res = await service.createAdjustment({
      reason: 'Conteo físico general',
      items: [
        {
          productCode: '78910001',
          locationCode: 'LOC-TND-E1',
          countedQuantity: '28.00',
        },
        {
          productCode: '78910002',
          locationCode: 'LOC-CEN-P1',
          countedQuantity: '10.00',
        },
      ],
    })

    expect(res.items[0].systemQuantity).toBe('24.00')
    expect(res.items[0].countedQuantity).toBe('28.00')
    expect(res.items[0].difference).toBe('4.00')

    expect(res.items[1].systemQuantity).toBe('15.00')
    expect(res.items[1].countedQuantity).toBe('10.00')
    expect(res.items[1].difference).toBe('-5.00')
  })

  // 10. Ajuste duplicado producto+localización: 400
  it('10. rechaza con 400 si la misma combinación producto+localización está duplicada en el ajuste', async () => {
    await expect(
      service.createAdjustment({
        reason: 'Duplicado erróneo',
        items: [
          {
            productCode: '78910001',
            locationCode: 'LOC-TND-E1',
            countedQuantity: '20.00',
          },
          {
            productCode: '78910001',
            locationCode: 'LOC-TND-E1',
            countedQuantity: '22.00',
          },
        ],
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
    })
  })

  // 11. Listados: filtro, orden y paginación de ambos documentos
  it('11. lista traslados y ajustes con filtrado, ordenación y paginación correcta', async () => {
    // 11.1 Traslados
    const allTransfers = await service.listTransfers()
    expect(allTransfers.total).toBeGreaterThanOrEqual(3)

    const searchRes = await service.listTransfers({ search: 'TRF-2026-0001' })
    expect(searchRes.items).toHaveLength(1)
    expect(searchRes.items[0].noDocument).toBe('TRF-2026-0001')

    const pagedTransfers = await service.listTransfers({ page: 1, perPage: 2, sort: 'date:asc' })
    expect(pagedTransfers.items).toHaveLength(2)
    expect(new Date(pagedTransfers.items[0].date).getTime()).toBeLessThanOrEqual(
      new Date(pagedTransfers.items[1].date).getTime()
    )

    // 11.2 Ajustes
    const allAdjustments = await service.listAdjustments()
    expect(allAdjustments.total).toBeGreaterThanOrEqual(2)

    const searchAdj = await service.listAdjustments({ search: 'rotura' })
    expect(searchAdj.items.length).toBeGreaterThan(0)
    expect(searchAdj.items[0].reason).toContain('rotura')

    const pagedAdj = await service.listAdjustments({ page: 1, perPage: 1 })
    expect(pagedAdj.items).toHaveLength(1)
    expect(pagedAdj.total).toBe(allAdjustments.total)
  })

  // 12. El stock mostrado por el servicio de stock cambia tras crear un documento
  it('12. actualiza el stock visible en getStock tras crear traslados y ajustes', async () => {
    // Stock inicial de 78910001 en LOC-TND-E1 es 24.00
    const beforeStock = await service.getStock({
      location: 'LOC-TND-E1',
      search: '78910001',
    })
    expect(beforeStock.items[0].quantity).toBe('24.00')

    // 1. Traslado de 10.00
    await service.createTransfer({
      reason: 'Traslado verificado',
      items: [
        {
          productCode: '78910001',
          quantity: '10.00',
          sourceLocationCode: 'LOC-TND-E1',
          targetLocationCode: 'LOC-CEN-P1',
        },
      ],
    })

    const afterTransferStock = await service.getStock({
      location: 'LOC-TND-E1',
      search: '78910001',
    })
    expect(afterTransferStock.items[0].quantity).toBe('14.00')

    // 2. Ajuste a 35.00
    await service.createAdjustment({
      reason: 'Ajuste verificado',
      items: [
        {
          productCode: '78910001',
          locationCode: 'LOC-TND-E1',
          countedQuantity: '35.00',
        },
      ],
    })

    const afterAdjustmentStock = await service.getStock({
      location: 'LOC-TND-E1',
      search: '78910001',
    })
    expect(afterAdjustmentStock.items[0].quantity).toBe('35.00')
  })
})
