export interface Link {
  id: string
  user_id: string
  slug: string
  original_url: string
  title?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Click {
  id: string
  link_id: string
  referrer?: string
  browser?: string
  device?: string
  os?: string
  source?: string
  action?: string
  country?: string
  ip?: string
  created_at: string
}

export interface LinkStats extends Link {
  total_clicks: number
  clicks_today: number
  clicks_week: number
  clicks_month: number
}

export interface ClicksByDay {
  date: string
  clicks: number
}

export interface ClicksBySource {
  source: string
  count: number
}
