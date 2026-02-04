import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from '../core/inventory.service.js';
import type { InventoryRepository } from '../repositories/inventory.repo.js';

describe('InventoryService', () => {
    let service: InventoryService;
    let mockRepo: any;

    beforeEach(() => {
        mockRepo = {
            createReservation: vi.fn(),
            upsertReservationItems: vi.fn(),
            getStockForUpdate: vi.fn(),
            updateStock: vi.fn(),
            setReservationReserved: vi.fn(),
            incrementReservationReserved: vi.fn(),
            updateReservationStatus: vi.fn(),
            upsertStock: vi.fn(),
            getReservationItems: vi.fn(),
        };
        service = new InventoryService(mockRepo as InventoryRepository);
    });

    it('should reserve items immediately if sufficient stock exists', async () => {
        const plateId = 'plate-123';
        const items = [{ ingredient: 'tomato', qty: 2 }];

        // Mock stock: 10 tomatoes available
        mockRepo.getStockForUpdate.mockResolvedValue(10);

        const result = await service.processReservation(plateId, items as any);

        expect(mockRepo.createReservation).toHaveBeenCalledWith(plateId);
        expect(mockRepo.updateStock).toHaveBeenCalledWith('tomato', 2);
        expect(mockRepo.updateReservationStatus).toHaveBeenCalledWith(plateId, 'reserved');
        expect(result).toEqual({ shortages: [], shouldPurchase: false });
    });

    it('should identify shortages and status purchasing if stock is insufficient', async () => {
        const plateId = 'plate-456';
        const items = [{ ingredient: 'cheese', qty: 5 }];

        // Mock stock: only 2 cheese available
        mockRepo.getStockForUpdate.mockResolvedValue(2);

        const result = await service.processReservation(plateId, items as any);

        // Should use the 2 available
        expect(mockRepo.updateStock).toHaveBeenCalledWith('cheese', 2);
        expect(mockRepo.incrementReservationReserved).toHaveBeenCalledWith(plateId, 'cheese', 2);

        // Status should be purchasing
        expect(mockRepo.updateReservationStatus).toHaveBeenCalledWith(plateId, 'purchasing');

        // Should report shortage of 3
        expect(result.shortages).toHaveLength(1);
        expect(result.shortages[0]).toEqual({ ingredient: 'cheese', missing: 3 });
        expect(result.shouldPurchase).toBe(true);
    });
});
