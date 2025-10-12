import { describe, it, expect } from 'vitest';
import {
  Ingredient,
  InventoryFailed,
  InventoryReserved,
  InventoryReserveRequested,
  Item,
  OrderCreateRequested,
  PlatePrepared,
  PurchaseCompleted,
  PurchaseFailed,
  PurchaseRequested,
  PurchasesQuery,
  Requirement,
  ReservationsQuery,
} from '../index.js';

describe('Unit - Shared Kernel: Ingredient', () => {
  describe('Ingredient Enum', () => {
    it('debe aceptar "tomato"', () => {
      const result = Ingredient.safeParse('tomato');
      expect(result.success).toBe(true);
    });

    it('debe rechazar "pizza"', () => {
      const result = Ingredient.safeParse('pizza');
      expect(result.success).toBe(false);
    });

    it('debe aceptar "lettuce"', () => {
      const result = Ingredient.safeParse('lettuce');
      expect(result.success).toBe(true);
    });

    it('debe aceptar "chicken"', () => {
      const result = Ingredient.safeParse('chicken');
      expect(result.success).toBe(true);
    });

    it('debe rechazar ingrediente vacío', () => {
      const result = Ingredient.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('Item Schema', () => {
    it('debe validar item correcto', () => {
      const validItem = {
        ingredient: 'tomato',
        qty: 5,
      };

      const result = Item.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it('debe rechazar qty negativa', () => {
      const invalidItem = {
        ingredient: 'tomato',
        qty: -5,
      };

      const result = Item.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('debe rechazar qty cero', () => {
      const invalidItem = {
        ingredient: 'tomato',
        qty: 0,
      };

      const result = Item.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe('PurchaseRequested', () => {
    it('debe validar evento correcto', () => {
      const validEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        shortages: [
          { ingredient: 'tomato', missing: 5 },
          { ingredient: 'lettuce', missing: 2 },
        ],
      };

      const result = PurchaseRequested.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('debe rechazar messageId inválido', () => {
      const invalidEvent = {
        messageId: 'not-a-uuid',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        shortages: [{ ingredient: 'tomato', missing: 5 }],
      };

      const result = PurchaseRequested.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('debe rechazar shortages vacío', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        shortages: [],
      };

      const result = PurchaseRequested.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('debe rechazar missing negativo', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        shortages: [{ ingredient: 'tomato', missing: -3 }],
      };

      const result = PurchaseRequested.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('debe rechazar missing cero', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        shortages: [{ ingredient: 'tomato', missing: 0 }],
      };

      const result = PurchaseRequested.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('PurchaseCompleted', () => {
    it('debe validar evento correcto', () => {
      const validEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        purchased: [
          { ingredient: 'tomato', qty: 5 },
          { ingredient: 'cheese', qty: 2 },
        ],
      };

      const result = PurchaseCompleted.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('debe rechazar purchased vacío', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        purchased: [],
      };

      const result = PurchaseCompleted.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('debe rechazar qty negativa en purchased', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        purchased: [{ ingredient: 'tomato', qty: -5 }],
      };

      const result = PurchaseCompleted.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('PurchaseFailed', () => {
    it('debe validar evento correcto', () => {
      const validEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        reason: 'ingredient unavailable',
      };

      const result = PurchaseFailed.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('debe usar valor por defecto si no se provee reason', () => {
      const eventWithoutReason = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = PurchaseFailed.safeParse(eventWithoutReason);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reason).toBe('unavailable');
      }
    });

    it('debe rechazar reason vacío', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        reason: '',
      };

      const result = PurchaseFailed.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('InventoryReserveRequested', () => {
    it('debe validar evento correcto', () => {
      const validEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        items: [
          { ingredient: 'tomato', qty: 2 },
          { ingredient: 'cheese', qty: 1 },
        ],
      };

      const result = InventoryReserveRequested.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('debe rechazar items vacío', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        items: [],
      };

      const result = InventoryReserveRequested.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('debe rechazar item con qty inválida', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        items: [{ ingredient: 'tomato', qty: -2 }],
      };

      const result = InventoryReserveRequested.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('debe rechazar plateId inválido', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: 'invalid-uuid',
        items: [{ ingredient: 'tomato', qty: 2 }],
      };

      const result = InventoryReserveRequested.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('InventoryReserved', () => {
    it('debe validar evento correcto', () => {
      const validEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        items: [
          { ingredient: 'lettuce', qty: 2 },
          { ingredient: 'chicken', qty: 1 },
        ],
      };

      const result = InventoryReserved.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('debe rechazar items vacío', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        items: [],
      };

      const result = InventoryReserved.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('InventoryFailed', () => {
    it('debe validar evento correcto', () => {
      const validEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        reason: 'insufficient stock',
      };

      const result = InventoryFailed.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('debe rechazar reason vacío', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        reason: '',
      };

      const result = InventoryFailed.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('debe rechazar sin reason', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = InventoryFailed.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('PlatePrepared', () => {
    it('debe validar evento correcto', () => {
      const validEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        preparedAt: new Date().toISOString(),
      };

      const result = PlatePrepared.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('debe aceptar string de fecha válido', () => {
      const validEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
        preparedAt: '2025-01-15T10:30:00.000Z',
      };

      const result = PlatePrepared.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('debe rechazar sin preparedAt', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        plateId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = PlatePrepared.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('OrderCreateRequested', () => {
    it('debe validar evento correcto', () => {
      const validEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        count: 5,
      };

      const result = OrderCreateRequested.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('debe rechazar count cero', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        count: 0,
      };

      const result = OrderCreateRequested.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('debe rechazar count negativo', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        count: -5,
      };

      const result = OrderCreateRequested.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('debe rechazar count decimal', () => {
      const invalidEvent = {
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        count: 3.5,
      };

      const result = OrderCreateRequested.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('ReservationsQuery', () => {
    it('debe validar query vacío con defaults', () => {
      const emptyQuery = {};

      const result = ReservationsQuery.safeParse(emptyQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50); // default
        expect(result.data.offset).toBe(0); // default
      }
    });

    it('debe validar query con status', () => {
      const validQuery = {
        status: 'pending',
      };

      const result = ReservationsQuery.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('debe validar todos los status válidos', () => {
      const statuses = ['pending', 'purchasing', 'reserved', 'failed'];

      statuses.forEach((status) => {
        const result = ReservationsQuery.safeParse({ status });
        expect(result.success).toBe(true);
      });
    });

    it('debe rechazar status inválido', () => {
      const invalidQuery = {
        status: 'invalid-status',
      };

      const result = ReservationsQuery.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('debe validar prepared como boolean', () => {
      const validQuery = {
        prepared: true,
      };

      const result = ReservationsQuery.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('debe coerce prepared de string a boolean', () => {
      const queryWithString = {
        prepared: 'true',
      };

      const result = ReservationsQuery.safeParse(queryWithString);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prepared).toBe(true);
      }
    });

    it('debe validar limit entre 1 y 200', () => {
      const validQuery = {
        limit: 100,
      };

      const result = ReservationsQuery.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('debe rechazar limit mayor a 200', () => {
      const invalidQuery = {
        limit: 500,
      };

      const result = ReservationsQuery.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('debe rechazar limit menor a 1', () => {
      const invalidQuery = {
        limit: 0,
      };

      const result = ReservationsQuery.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('debe validar offset', () => {
      const validQuery = {
        offset: 50,
      };

      const result = ReservationsQuery.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('debe rechazar offset negativo', () => {
      const invalidQuery = {
        offset: -10,
      };

      const result = ReservationsQuery.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });
  });

  describe('PurchasesQuery', () => {
    it('debe validar query vacío con defaults', () => {
      const emptyQuery = {};

      const result = PurchasesQuery.safeParse(emptyQuery);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it('debe validar query con plateId', () => {
      const validQuery = {
        plateId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = PurchasesQuery.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('debe validar query con ingredient', () => {
      const validQuery = {
        ingredient: 'tomato',
      };

      const result = PurchasesQuery.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('debe rechazar ingredient inválido', () => {
      const invalidQuery = {
        ingredient: 'pizza',
      };

      const result = PurchasesQuery.safeParse(invalidQuery);
      expect(result.success).toBe(false);
    });

    it('debe validar limit y offset', () => {
      const validQuery = {
        limit: 100,
        offset: 50,
      };

      const result = PurchasesQuery.safeParse(validQuery);
      expect(result.success).toBe(true);
    });
  });

  describe('Requirement', () => {
    it('debe validar requirement correcto', () => {
      const validReq = {
        ingredient: 'tomato',
        qty: 5,
      };

      const result = Requirement.safeParse(validReq);
      expect(result.success).toBe(true);
    });

    it('debe rechazar qty negativa', () => {
      const invalidReq = {
        ingredient: 'tomato',
        qty: -5,
      };

      const result = Requirement.safeParse(invalidReq);
      expect(result.success).toBe(false);
    });

    it('debe rechazar qty cero', () => {
      const invalidReq = {
        ingredient: 'tomato',
        qty: 0,
      };

      const result = Requirement.safeParse(invalidReq);
      expect(result.success).toBe(false);
    });
  });
});
