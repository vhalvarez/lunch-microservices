import { z } from 'zod'

export const Ingredient = z.enum([
  'tomato','lemon','potato','rice','ketchup',
  'lettuce','onion','cheese','meat','chicken'
])
export type Ingredient = z.infer<typeof Ingredient>

export const Item = z.object({
  ingredient: Ingredient,
  qty: z.number().int().positive()
})
export type Item = z.infer<typeof Item>

// --- Eventos clave ---
export const PurchaseRequested = z.object({
  messageId: z.string(),
  plateId: z.string(),
  shortages: z.array(z.object({
    ingredient: Ingredient, missing: z.number().int().positive()
  }))
})
export type PurchaseRequested = z.infer<typeof PurchaseRequested>

export const PurchaseCompleted = z.object({
  messageId: z.string(),
  plateId: z.string(),
  purchased: z.array(z.object({
    ingredient: Ingredient, qty: z.number().int().nonnegative()
  }))
})
export type PurchaseCompleted = z.infer<typeof PurchaseCompleted>

export const InventoryReserveRequested = z.object({
  messageId: z.string(),
  plateId: z.string(),
  items: z.array(Item)
})
export type InventoryReserveRequested = z.infer<typeof InventoryReserveRequested>

export const InventoryReserved = z.object({
  messageId: z.string(),
  plateId: z.string(),
  items: z.array(Item)
})
export type InventoryReserved = z.infer<typeof InventoryReserved>

// --- Topics/Exchanges ---
export const Exchanges = {
  purchase: 'purchase',
  inventory: 'inventory',
  plate: 'plate',
  order: 'order'
} as const

export const RoutingKeys = {
  purchaseRequested: 'purchase.requested',
  purchaseCompleted: 'purchase.completed',
  purchaseFailed: 'purchase.failed',
  inventoryReserveRequested: 'inventory.reserve.requested',
  inventoryReserved: 'inventory.reserved',
  plateRequested: 'plate.requested',
  platePrepared: 'plate.prepared'
} as const
