import type { Component } from 'vue'
import type { DropdownMenuItemConfig } from '../BaseDropdownMenu.vue'

export type DataTableMode = 'client' | 'server'

export type SortDirection = 'asc' | 'desc'

export interface DataTableColumn<T = any> {
  key: string
  title: string
  currency?: string
  width?: string
  minWidth?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  visible?: boolean
  cell?: (row: T) => any
  headerClass?: string
  cellClass?: string
}

export interface ServerDataResponse<T = any> {
  items: T[]
  total: number
  page: number
  perPage: number
}

export interface DataTableQueryState {
  page: number
  perPage: number
  sort?: string
  search?: string
  [key: string]: any
}

export interface BatchAction<T = any> {
  id: string
  label: string
  icon?: Component
  danger?: boolean
  onClick: (selectedRows: T[], selectedKeys: (string | number)[]) => void
}

export interface FilterChip {
  id: string
  label: string
  onRemove: () => void
}

export type RowActionsResolver<T = any> = (row: T) => DropdownMenuItemConfig[]
