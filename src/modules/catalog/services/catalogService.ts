import apiClient from '@/core/axios'
import type { Product, CreateProductDto, UpdateProductDto } from '../types/product'

// Datos simulados iniciales con atributos EAV, múltiples códigos de barra y multimoneda
const PRODUCTOS_MOCK: Product[] = [
  {
    id: 1,
    code: '78910001',
    barcodes: [
      { id: 'bc-1', code: '78910001', isPrimary: true, description: 'EAN-13 Envase' },
      { id: 'bc-2', code: '78910001-CJ', isPrimary: false, description: 'Caja x24' },
    ],
    name: 'Café Serrano Clásico 250g',
    category: 'Alimentos',
    costPriceUSD: 1.25,
    costPriceCUP: 450,
    costPrice: 450,
    salePriceUSD: 1.8,
    salePriceCUP: 650,
    salePrice: 650,
    prices: {
      CUP: 650,
      USD: 1.8,
      EUR: 1.7,
      MLC: 2.35,
    },
    stock: 24,
    minStock: 5,
    currency: 'CUP',
    unit: 'pqte',
    active: true,
    description: 'Café molido tostado cubano de la Sierra Maestra',
    attributes: [
      { id: 'att-1', name: 'Tipo de Grano', value: 'Arábica' },
      { id: 'att-2', name: 'Tostado', value: 'Oscuro' },
      { id: 'att-3', name: 'Origen', value: 'Granma, Cuba' },
    ],
    images: [
      {
        uid: 'img-1',
        name: 'serrano-250g.png',
        url: '/logo-icon.png',
      },
    ],
  },
  {
    id: 2,
    code: '78910002',
    barcodes: [{ id: 'bc-3', code: '78910002', isPrimary: true, description: 'EAN-13 Botella' }],
    name: 'Aceite de Girasol Criollo 1L',
    category: 'Alimentos',
    costPriceUSD: 1.95,
    costPriceCUP: 700,
    costPrice: 700,
    salePriceUSD: 2.65,
    salePriceCUP: 950,
    salePrice: 950,
    prices: {
      CUP: 950,
      USD: 2.65,
      EUR: 2.5,
      MLC: 3.45,
    },
    stock: 12,
    minStock: 4,
    currency: 'CUP',
    unit: 'u',
    active: true,
    attributes: [
      { id: 'att-4', name: 'Volumen', value: '1 Litro' },
      { id: 'att-5', name: 'Envase', value: 'PET Libre de BPA' },
    ],
    images: [],
  },
  {
    id: 3,
    code: '78910003',
    barcodes: [{ id: 'bc-4', code: '78910003', isPrimary: true, description: 'Lata 330ml' }],
    name: 'Refresco Tukola Lata 330ml',
    category: 'Bebidas',
    costPriceUSD: 0.5,
    costPriceCUP: 180,
    costPrice: 180,
    salePriceUSD: 0.8,
    salePriceCUP: 280,
    salePrice: 280,
    prices: {
      CUP: 280,
      USD: 0.8,
      EUR: 0.75,
      MLC: 1.0,
    },
    stock: 3,
    minStock: 10,
    currency: 'CUP',
    unit: 'u',
    active: true,
    attributes: [
      { id: 'att-6', name: 'Sabor', value: 'Cola Cubana' },
      { id: 'att-7', name: 'Presentación', value: 'Lata Aluminio' },
    ],
    images: [],
  },
  {
    id: 4,
    code: '78910004',
    barcodes: [{ id: 'bc-5', code: '78910004', isPrimary: true, description: 'Bolsa 500g' }],
    name: 'Detergente OMO 500g',
    category: 'Aseo y Limpieza',
    costPrice: 320,
    salePrice: 450,
    prices: {
      CUP: 450,
      USD: 1.25,
      EUR: 1.2,
      MLC: 1.65,
    },
    stock: 0,
    minStock: 6,
    currency: 'CUP',
    unit: 'pqte',
    active: false,
    attributes: [{ id: 'att-8', name: 'Aroma', value: 'Flores Silvestres' }],
    images: [],
  },
]

let localMockData: Product[] = [...PRODUCTOS_MOCK]

/**
 * Servicio para gestión del catálogo de productos (CRUD).
 */
export const catalogService = {
  /**
   * Obtiene la lista completa de productos.
   */
  async getProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.get<Product[]>('/products')
      return response.data
    } catch {
      return Promise.resolve([...localMockData])
    }
  },

  /**
   * Obtiene un producto por su ID.
   */
  async getProductById(id: number): Promise<Product> {
    try {
      const response = await apiClient.get<Product>(`/products/${id}`)
      return response.data
    } catch {
      const found = localMockData.find((p) => p.id === id)
      if (found) return Promise.resolve(found)
      throw new Error(`Producto con ID ${id} no encontrado`)
    }
  },

  /**
   * Crea un nuevo producto.
   */
  async createProduct(payload: CreateProductDto): Promise<Product> {
    try {
      const response = await apiClient.post<Product>('/products', payload)
      return response.data
    } catch {
      const newProduct: Product = {
        ...payload,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      }
      localMockData.unshift(newProduct)
      return Promise.resolve(newProduct)
    }
  },

  /**
   * Actualiza un producto existente.
   */
  async updateProduct(id: number, payload: UpdateProductDto): Promise<Product> {
    try {
      const response = await apiClient.put<Product>(`/products/${id}`, payload)
      return response.data
    } catch {
      const index = localMockData.findIndex((p) => p.id === id)
      if (index !== -1) {
        localMockData[index] = {
          ...localMockData[index],
          ...payload,
          updatedAt: new Date().toISOString(),
        }
        return Promise.resolve(localMockData[index])
      }
      throw new Error(`Producto con ID ${id} no encontrado`)
    }
  },

  /**
   * Elimina un producto.
   */
  async deleteProduct(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/products/${id}`)
      return true
    } catch {
      localMockData = localMockData.filter((p) => p.id !== id)
      return Promise.resolve(true)
    }
  },
}

export default catalogService
