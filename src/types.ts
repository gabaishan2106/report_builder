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

export type PeriodMode = 'ytd' | 'mom' | 'yoy' | 'custom'
export type CustomCompareMode = 'yoy' | 'custom'

export interface TerritoryDirectoryEntry {
  territoryCode: string
  employeeCode: string | null
  status: 'assigned' | 'vacant' | 'direct'
  employeeName: string | null
}

export interface GrowthResult {
  direction: 'up' | 'down' | 'flat' | 'new'
  percentLabel: string // e.g. "12.4%", "0.0%", or "" for the "New" case
  percentValue: number // raw signed percent, for sorting (New = Infinity, flat = 0)
  changeValue: number // current - previous
}

export interface TerritoryRow {
  territoryCode: string
  asmArea: string
  bdeName: string // "Vacant" when status = vacant, regardless of who covers it internally
  status: 'assigned' | 'vacant' | 'direct'
  current: number
  previous: number
  growth: GrowthResult
}

export interface GroupSummary {
  groupName: string
  current: number
  previous: number
  growth: GrowthResult
  panIndiaGrowth?: GrowthResult
}
