import { describe, it, expect } from 'vitest';
import {
    Ingredient,
    Item,
    InventoryReserveRequested,
    OrderCreateRequested,
    PurchaseRequested,
    PurchaseCompleted,
    PurchaseFailed,
    InventoryReserved,
    PlatePrepared,
} from '../index.js';

describe('Ingredient Schema', () => {
    it('should accept valid ingredients', () => {
        const validIngredients = ['tomato', 'lemon', 'potato', 'rice', 'ketchup',
            'lettuce', 'onion', 'cheese', 'meat', 'chicken'];

        validIngredients.forEach(ingredient => {
            const result = Ingredient.safeParse(ingredient);
            expect(result.success).toBe(true);
        });
    });

    it('should reject invalid ingredients', () => {
        const invalidIngredients = ['apple', 'banana', '', 123, null, undefined];

        invalidIngredients.forEach(ingredient => {
            const result = Ingredient.safeParse(ingredient);
            expect(result.success).toBe(false);
        });
    });
});

describe('Item Schema', () => {
    it('should validate correct item', () => {
        const item = { ingredient: 'tomato', qty: 5 };
        const result = Item.safeParse(item);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.ingredient).toBe('tomato');
            expect(result.data.qty).toBe(5);
        }
    });

    it('should reject negative quantity', () => {
        const item = { ingredient: 'tomato', qty: -5 };
        const result = Item.safeParse(item);

        expect(result.success).toBe(false);
    });

    it('should reject zero quantity', () => {
        const item = { ingredient: 'tomato', qty: 0 };
        const result = Item.safeParse(item);

        expect(result.success).toBe(false);
    });

    it('should reject decimal quantity', () => {
        const item = { ingredient: 'tomato', qty: 5.5 };
        const result = Item.safeParse(item);

        expect(result.success).toBe(false);
    });
});

describe('InventoryReserveRequested Schema', () => {
    it('should validate correct payload', () => {
        const payload = {
            messageId: '123e4567-e89b-12d3-a456-426614174000',
            plateId: '123e4567-e89b-12d3-a456-426614174001',
            items: [
                { ingredient: 'tomato', qty: 5 },
                { ingredient: 'lettuce', qty: 3 }
            ]
        };

        const result = InventoryReserveRequested.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('should reject invalid UUID for messageId', () => {
        const payload = {
            messageId: 'not-a-uuid',
            plateId: '123e4567-e89b-12d3-a456-426614174001',
            items: [{ ingredient: 'tomato', qty: 5 }]
        };

        const result = InventoryReserveRequested.safeParse(payload);
        expect(result.success).toBe(false);
    });

    it('should reject empty items array', () => {
        const payload = {
            messageId: '123e4567-e89b-12d3-a456-426614174000',
            plateId: '123e4567-e89b-12d3-a456-426614174001',
            items: []
        };

        const result = InventoryReserveRequested.safeParse(payload);
        expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
        const payload = {
            messageId: '123e4567-e89b-12d3-a456-426614174000',
            // missing plateId
            items: [{ ingredient: 'tomato', qty: 5 }]
        };

        const result = InventoryReserveRequested.safeParse(payload);
        expect(result.success).toBe(false);
    });
});

describe('OrderCreateRequested Schema', () => {
    it('should validate correct order', () => {
        const payload = {
            messageId: '123e4567-e89b-12d3-a456-426614174000',
            count: 5
        };

        const result = OrderCreateRequested.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('should reject negative count', () => {
        const payload = {
            messageId: '123e4567-e89b-12d3-a456-426614174000',
            count: -5
        };

        const result = OrderCreateRequested.safeParse(payload);
        expect(result.success).toBe(false);
    });

    it('should reject zero count', () => {
        const payload = {
            messageId: '123e4567-e89b-12d3-a456-426614174000',
            count: 0
        };

        const result = OrderCreateRequested.safeParse(payload);
        expect(result.success).toBe(false);
    });
});

describe('PurchaseRequested Schema', () => {
    it('should validate correct purchase request', () => {
        const payload = {
            messageId: '123e4567-e89b-12d3-a456-426614174000',
            plateId: '123e4567-e89b-12d3-a456-426614174001',
            shortages: [
                { ingredient: 'tomato', missing: 5 }
            ]
        };

        const result = PurchaseRequested.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('should reject empty shortages', () => {
        const payload = {
            messageId: '123e4567-e89b-12d3-a456-426614174000',
            plateId: '123e4567-e89b-12d3-a456-426614174001',
            shortages: []
        };

        const result = PurchaseRequested.safeParse(payload);
        expect(result.success).toBe(false);
    });
});

describe('PurchaseCompleted Schema', () => {
    it('should validate correct completion', () => {
        const payload = {
            messageId: '123e4567-e89b-12d3-a456-426614174000',
            plateId: '123e4567-e89b-12d3-a456-426614174001',
            purchased: [
                { ingredient: 'tomato', qty: 10 }
            ]
        };

        const result = PurchaseCompleted.safeParse(payload);
        expect(result.success).toBe(true);
    });
});

describe('PurchaseFailed Schema', () => {
    it('should validate failure with reason', () => {
        const payload = {
            messageId: '123e4567-e89b-12d3-a456-426614174000',
            plateId: '123e4567-e89b-12d3-a456-426614174001',
            reason: 'Market API unavailable'
        };

        const result = PurchaseFailed.safeParse(payload);
        expect(result.success).toBe(true);
    });

    it('should use default reason if not provided', () => {
        const payload = {
            messageId: '123e4567-e89b-12d3-a456-426614174000',
            plateId: '123e4567-e89b-12d3-a456-426614174001',
        };

        const result = PurchaseFailed.safeParse(payload);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.reason).toBe('unavailable');
        }
    });
});

describe('PlatePrepared Schema', () => {
    it('should validate prepared plate', () => {
        const payload = {
            messageId: '123e4567-e89b-12d3-a456-426614174000',
            plateId: '123e4567-e89b-12d3-a456-426614174001',
            preparedAt: new Date().toISOString()
        };

        const result = PlatePrepared.safeParse(payload);
        expect(result.success).toBe(true);
    });
});
