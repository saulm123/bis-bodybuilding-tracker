import { db, newId, nowIso, type Food, type FoodLogEntry, type Meal } from '../db/schema'
import { macrosFor, type Totals } from './macros'
import type { OffFood } from './off'

/** Saves a food (from Open Food Facts or typed in). Re-uses an existing record with the same barcode. */
export async function saveFood(input: OffFood & { id?: string }): Promise<Food> {
  const now = nowIso()
  const existing = input.id
    ? await db.foods.get(input.id)
    : input.barcode
      ? await db.foods.where('barcode').equals(input.barcode).first()
      : undefined
  const food: Food = {
    ...existing,
    ...input,
    favourite: input.favourite ?? existing?.favourite,
    id: existing?.id ?? newId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  await db.foods.put(food)
  return food
}

export async function logFood(food: Food, grams: number, date: string): Promise<void> {
  const now = nowIso()
  const m = macrosFor(food, grams)
  await db.transaction('rw', db.foodLog, db.foods, async () => {
    await db.foodLog.add({ id: newId(), date, foodId: food.id, name: food.name, grams, ...m, createdAt: now, updatedAt: now })
    await db.foods.update(food.id, { lastUsedAt: now })
  })
}

export async function quickAdd(name: string, t: Totals, date: string): Promise<void> {
  const now = nowIso()
  await db.foodLog.add({ id: newId(), date, name: name.trim() || 'Quick add', ...t, createdAt: now, updatedAt: now })
}

/** Changes the amount of a logged food, recalculating from the saved food if we still have it. */
export async function updateEntryGrams(entry: FoodLogEntry, grams: number): Promise<void> {
  const food = entry.foodId ? await db.foods.get(entry.foodId) : undefined
  const m = food
    ? macrosFor(food, grams)
    : (() => {
        const k = entry.grams ? grams / entry.grams : 1
        const r1 = (n: number) => Math.round(n * k * 10) / 10
        return { kcal: Math.round(entry.kcal * k), protein: r1(entry.protein), netCarbs: r1(entry.netCarbs), fat: r1(entry.fat) }
      })()
  await db.foodLog.update(entry.id, { grams, ...m, updatedAt: nowIso() })
}

export async function deleteEntry(id: string): Promise<void> {
  await db.foodLog.delete(id)
}

/** Copies every entry from one day to another (e.g. "same as yesterday"). */
export async function copyDay(from: string, to: string): Promise<number> {
  const entries = await db.foodLog.where('date').equals(from).toArray()
  const now = nowIso()
  await db.foodLog.bulkAdd(entries.map((e) => ({ ...e, id: newId(), date: to, createdAt: now, updatedAt: now })))
  return entries.length
}

export async function toggleFavourite(foodId: string): Promise<void> {
  const food = await db.foods.get(foodId)
  if (food) await db.foods.update(foodId, { favourite: !food.favourite, updatedAt: nowIso() })
}

export async function saveMeal(name: string, entries: FoodLogEntry[]): Promise<void> {
  const now = nowIso()
  const items = entries.filter((e) => e.foodId && e.grams).map((e) => ({ foodId: e.foodId!, name: e.name, grams: e.grams! }))
  await db.meals.add({ id: newId(), name: name.trim() || 'Meal', favourite: true, items, createdAt: now, updatedAt: now })
}

export async function logMeal(meal: Meal, date: string): Promise<number> {
  let n = 0
  for (const item of meal.items) {
    const food = await db.foods.get(item.foodId)
    if (!food) continue
    await logFood(food, item.grams, date)
    n++
  }
  return n
}

export async function recentFoods(limit = 15): Promise<Food[]> {
  return db.foods.orderBy('lastUsedAt').reverse().filter((f) => !!f.lastUsedAt).limit(limit).toArray()
}

export async function searchLocal(query: string): Promise<Food[]> {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return []
  return db.foods
    .filter((f) => {
      const text = `${f.name} ${f.brand ?? ''}`.toLowerCase()
      return words.every((w) => text.includes(w))
    })
    .limit(20)
    .toArray()
}
