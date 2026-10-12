import { Capacitor } from '@capacitor/core'
import type { Food, Per100g } from '../db/schema'

// Open Food Facts: free, open food database. This file is the ONLY place the app
// talks to the internet. It sends a barcode or search words, nothing else.

const BASE = 'https://world.openfoodfacts.org'
// Newer full-text search service. It doesn't allow calls from web pages (no CORS), so
// it only works in the Android app, which makes requests natively (CapacitorHttp).
const SEARCH = 'https://search.openfoodfacts.org/search'
const FIELDS = 'code,product_name,product_name_en,brands,nutriments,serving_quantity,countries_tags'

export type OffFood = Omit<Food, 'id' | 'createdAt' | 'updatedAt'>

interface OffProduct {
  code?: string
  product_name?: string
  product_name_en?: string
  brands?: string | string[]
  serving_quantity?: number | string
  countries_tags?: string[]
  nutriments?: Record<string, number | string | undefined>
}

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : undefined
}

// Countries whose labels include fibre in the carbohydrate figure.
const FIBRE_IN_CARBS = ['en:united-states', 'en:canada']

/** Converts an Open Food Facts product into our food shape. Returns undefined if it has no usable calories. */
export function mapProduct(p: OffProduct): OffFood | undefined {
  const n = p.nutriments ?? {}
  const kcal = num(n['energy-kcal_100g']) ?? (num(n['energy_100g']) !== undefined ? num(n['energy_100g'])! / 4.184 : undefined)
  const name = (p.product_name || p.product_name_en || '').trim()
  if (kcal === undefined || !name) return undefined
  const per100: Per100g = {
    kcal: Math.round(kcal),
    protein: num(n['proteins_100g']) ?? 0,
    carbs: num(n['carbohydrates_100g']) ?? 0,
    fiber: num(n['fiber_100g']) ?? 0,
    fat: num(n['fat_100g']) ?? 0,
  }
  const tags = p.countries_tags ?? []
  const serving = num(p.serving_quantity)
  return {
    name,
    brand: (Array.isArray(p.brands) ? p.brands[0] : p.brands?.split(',')[0])?.trim() || undefined,
    barcode: p.code,
    per100,
    // Only treat carbs as total-with-fibre when the product is sold *only* in those countries.
    carbsIncludeFiber: tags.length > 0 && tags.every((t) => FIBRE_IN_CARBS.includes(t)),
    servingG: serving && serving > 0 ? serving : undefined,
    source: 'off',
  }
}

async function getJson(url: string): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 12_000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (res.status === 404) return null
    if (res.status === 429) throw new Error('Open Food Facts is busy. Wait a minute and try again.')
    if (!res.ok) throw new Error(`Open Food Facts error (${res.status}).`)
    return await res.json()
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw new Error('No response from Open Food Facts. Check your connection.')
    if (e instanceof TypeError) throw new Error("Can't reach Open Food Facts. Are you offline?")
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export async function lookupBarcode(code: string): Promise<OffFood | undefined> {
  const data = (await getJson(`${BASE}/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`)) as
    | { status?: number; product?: OffProduct }
    | null
  if (!data || data.status !== 1 || !data.product) return undefined
  return mapProduct({ code, ...data.product })
}

export async function searchOff(query: string): Promise<OffFood[]> {
  const q = encodeURIComponent(query)
  const map = (list: OffProduct[] | undefined) => (list ?? []).map(mapProduct).filter((f): f is OffFood => !!f)
  try {
    const data = (await getJson(`${SEARCH}?q=${q}&page_size=40&fields=${FIELDS}`)) as { hits?: OffProduct[] } | null
    return map(data?.hits)
  } catch (first) {
    // Fall back to the classic search (allows browsers, but is often overloaded).
    try {
      const url = `${BASE}/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1&page_size=25&fields=${FIELDS}`
      const data = (await getJson(url)) as { products?: OffProduct[] } | null
      return map(data?.products)
    } catch {
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Online food search only works in the Android app right now. Barcode scanning and your saved foods work here.')
      }
      throw first
    }
  }
}
