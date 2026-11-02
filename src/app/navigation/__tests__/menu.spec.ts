import { describe, it, expect } from 'vitest'
import { APP_MENU, filterMenuByPermissions } from '../menu'

describe('filterMenuByPermissions', () => {
  it('permite a un superadmin con todos los permisos ver el menú completo', () => {
    const canSuperAdmin = () => true
    const filtered = filterMenuByPermissions(APP_MENU, canSuperAdmin)

    expect(filtered.length).toBe(APP_MENU.length)
    const ids = filtered.map((item) => item.id)
    expect(ids).toEqual([
      'home',
      'sales',
      'cash',
      'inventory',
      'products',
      'purchases',
      'reports',
      'admin',
    ])

    // Verificar que los grupos conservan todos sus sub-elementos
    const salesGroup = filtered.find((i) => i.id === 'sales')
    expect(salesGroup?.children?.length).toBe(2)

    const adminGroup = filtered.find((i) => i.id === 'admin')
    expect(adminGroup?.children?.length).toBe(4)
  })

  it('permite a un vendedor ver únicamente ventas, productos e inicio', () => {
    const vendedorPermissions = ['sales.create', 'sales.view', 'products.view']
    const canVendedor = (p: string) => vendedorPermissions.includes(p)
    const filtered = filterMenuByPermissions(APP_MENU, canVendedor)

    const ids = filtered.map((item) => item.id)
    expect(ids).toEqual(['home', 'sales', 'products'])

    const salesGroup = filtered.find((i) => i.id === 'sales')
    expect(salesGroup?.children?.map((c) => c.id)).toEqual(['sales-pos', 'sales-history'])

    const productsGroup = filtered.find((i) => i.id === 'products')
    expect(productsGroup?.children?.map((c) => c.id)).toEqual(['products-catalog'])
  })

  it('permite a un almacenero ver únicamente inventario, productos, compras e inicio', () => {
    const almaceneroPermissions = [
      'inventory.view',
      'inventory.transfer',
      'inventory.adjust',
      'products.view',
      'products.view_cost',
      'purchases.view',
    ]
    const canAlmacenero = (p: string) => almaceneroPermissions.includes(p)
    const filtered = filterMenuByPermissions(APP_MENU, canAlmacenero)

    const ids = filtered.map((item) => item.id)
    expect(ids).toEqual(['home', 'inventory', 'products', 'purchases'])

    // No debe ver ventas, caja, reportes ni administración
    expect(ids).not.toContain('sales')
    expect(ids).not.toContain('cash')
    expect(ids).not.toContain('reports')
    expect(ids).not.toContain('admin')
  })

  it('oculta por completo cualquier grupo cuyos hijos no tengan permisos visibles', () => {
    // Si un usuario no tiene permisos, solo ve las rutas sin permiso (Inicio)
    const canNobody = () => false
    const filtered = filterMenuByPermissions(APP_MENU, canNobody)

    expect(filtered.length).toBe(1)
    expect(filtered[0].id).toBe('home')
  })
})
