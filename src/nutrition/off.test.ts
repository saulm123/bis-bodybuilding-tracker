import { describe, expect, it } from 'vitest'
import { mapProduct } from './off'
import { macrosFor } from './macros'

describe('Open Food Facts mapping', () => {
  it('maps a UK product (carbs already exclude fibre)', () => {
    const f = mapProduct({
      code: '5000',
      product_name: 'Greek yoghurt',
      brands: 'Fage, Something',
      serving_quantity: '170',
      countries_tags: ['en:united-kingdom'],
      nutriments: { 'energy-kcal_100g': 97, proteins_100g: 9, carbohydrates_100g: 3, fiber_100g: 0, fat_100g: 5 },
    })!
    expect(f).toMatchObject({ name: 'Greek yoghurt', brand: 'Fage', servingG: 170, carbsIncludeFiber: false })
    expect(macrosFor(f, 170)).toEqual({ kcal: 165, protein: 15.3, netCarbs: 5.1, fat: 8.5 })
  })

  it('subtracts fibre for US-only products and converts kJ', () => {
    const f = mapProduct({
      product_name: 'Tortilla',
      countries_tags: ['en:united-states'],
      nutriments: { energy_100g: 1255, proteins_100g: 8, carbohydrates_100g: 50, fiber_100g: 20, fat_100g: 6 },
    })!
    expect(f.per100.kcal).toBe(300)
    expect(f.carbsIncludeFiber).toBe(true)
    expect(macrosFor(f, 100).netCarbs).toBe(30)
  })

  it('handles brands given as a list (search service format)', () => {
    const f = mapProduct({ product_name: 'Yoghurt', brands: ['Fage', 'Other'], nutriments: { 'energy-kcal_100g': 97 } })
    expect(f?.brand).toBe('Fage')
  })

  it('skips products without calories or a name', () => {
    expect(mapProduct({ product_name: 'Mystery', nutriments: {} })).toBeUndefined()
    expect(mapProduct({ nutriments: { 'energy-kcal_100g': 100 } })).toBeUndefined()
  })
})
