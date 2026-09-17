export interface SalesRow {
  id: number
  seller_code: string | null
  seller_name: string | null
  buyer_name: string | null
  buyer_code: string | null
  financial_year: string | null
  month: string | null // "MMM-YY" e.g. "Apr-25"
  item_code: string | null
  item_name: string | null
  qty: number | null
  amount: number | null
  territory_code: string | null
  asm_area: string | null
  group_name: string | null
  category: string | null
  top_25: string | null
  club: string | null
}

export interface FieldConfigRow {
  id: number
  field_name: string
  display_label: string
  is_active: boolean
}

export type ComparisonMode = 'yoy' | 'mom' | 'custom'

export interface GrowthResult {
  direction: 'up' | 'down' | 'flat' | 'new'
  percentLabel: string // e.g. "12.4%", "0.0%", or "" for flat-zero case
  changeValue: number // current - previous
}

export interface TerritoryRow {
  territoryCode: string
  current: number
  previous: number
  growth: GrowthResult
}

export interface GroupSummary {
  groupName: string
  current: number
  previous: number
  growth: GrowthResult
}
