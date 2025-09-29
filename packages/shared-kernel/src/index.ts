import { z } from 'zod';

export const Ingredient = z
  .enum([
    'tomato',
    'lemon',
    'potato',
    'rice',
    'ketchup',
    'lettuce',
    'onion',
    'cheese',
    'meat',
    'chicken',
  ])
  .describe('Ingredient');
export type Ingredient = z.infer<typeof Ingredient>;

export const Item = z
  .object({
    ingredient: Ingredient,
    qty: z.number().int().positive(),
  })
  .describe('Item');
export type Item = z.infer<typeof Item>;

export const PurchaseRequested = z
  .object({
    messageId: z.uuid(),
    plateId: z.uuid(),
    shortages: z
      .array(
        z.object({
          ingredient: Ingredient,
          missing: z.number().int().positive(),
        }),
      )
      .min(1),
  })
  .describe('PurchaseRequested');
export type PurchaseRequested = z.infer<typeof PurchaseRequested>;

export const PurchaseCompleted = z
  .object({
    messageId: z.uuid(),
    plateId: z.uuid(),
    purchased: z
      .array(
        z.object({
          ingredient: Ingredient,
          qty: z.number().int().positive(),
        }),
      )
      .min(1),
  })
  .describe('PurchaseCompleted');
export type PurchaseCompleted = z.infer<typeof PurchaseCompleted>;

export const PurchaseFailed = z
  .object({
    messageId: z.uuid(),
    plateId: z.uuid(),
    reason: z.string().min(1).default('unavailable'),
  })
  .describe('PurchaseFailed');
export type PurchaseFailed = z.infer<typeof PurchaseFailed>;

export const InventoryReserveRequested = z
  .object({
    messageId: z.uuid(),
    plateId: z.uuid(),
    items: z.array(Item).min(1),
  })
  .describe('InventoryReserveRequested');
export type InventoryReserveRequested = z.infer<typeof InventoryReserveRequested>;

export const InventoryReserved = z
  .object({
    messageId: z.uuid(),
    plateId: z.uuid(),
    items: z.array(Item).min(1),
  })
  .describe('InventoryReserved');
export type InventoryReserved = z.infer<typeof InventoryReserved>;

export const InventoryFailed = z
  .object({
    messageId: z.uuid(),
    plateId: z.uuid(),
    reason: z.string().min(1),
  })
  .describe('InventoryFailed');
export type InventoryFailed = z.infer<typeof InventoryFailed>;

export const PlatePrepared = z
  .object({
    messageId: z.uuid(),
    plateId: z.uuid(),
    preparedAt: z.string(),
  })
  .describe('PlatePrepared');
export type PlatePrepared = z.infer<typeof PlatePrepared>;

export const OrderCreateRequested = z.object({
  messageId: z.uuid(),
  count: z.number().int().positive(),
});
export type OrderCreateRequested = z.infer<typeof OrderCreateRequested>;

export const ReservationsQuery = z.object({
  status: z.enum(['pending', 'reserved', 'failed']).optional(),
  prepared: z.coerce.boolean().optional(),
  plateId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const PurchasesQuery = z.object({
  plateId: z.uuid().optional(),
  ingredient: z
    .enum([
      'tomato',
      'lemon',
      'potato',
      'rice',
      'ketchup',
      'lettuce',
      'onion',
      'cheese',
      'meat',
      'chicken',
    ])
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const Exchanges = {
  purchase: 'purchase',
  inventory: 'inventory',
  plate: 'plate',
  order: 'order',
} as const;

export const RoutingKeys = {
  purchaseRequested: 'purchase.requested',
  purchaseCompleted: 'purchase.completed',
  purchaseFailed: 'purchase.failed',
  inventoryReserveRequested: 'inventory.reserve.requested',
  inventoryReserved: 'inventory.reserved',
  inventoryFailed: 'inventory.failed',
  plateRequested: 'plate.requested',
  platePrepared: 'plate.prepared',
  orderCreateRequested: 'order.create.requested',
} as const;

export const Requirement = z.object({
  ingredient: Ingredient,
  qty: z.number().int().positive(),
});
export type Requirement = z.infer<typeof Requirement>;
