import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReservationsService } from '../core/reservations.service.js';
import type { ReservationsRepository } from '../repositories/reservations.repo.js';

describe('ReservationsService', () => {
    let service: ReservationsService;
    let repo: ReservationsRepository;

    beforeEach(() => {
        repo = {
            countReservations: vi.fn(),
            searchReservations: vi.fn(),
            getReservationById: vi.fn(),
            getReservationItems: vi.fn(),
            getMarketPurchasesForPlate: vi.fn(),
        } as unknown as ReservationsRepository;
        service = new ReservationsService(repo);
    });

    it('searchReservations should return correct pagination structure', async () => {
        // Arrange
        (repo.countReservations as any).mockResolvedValue({ rows: [{ total: '10' }] });
        (repo.searchReservations as any).mockResolvedValue({
            rows: [
                {
                    plate_id: 'plate-1',
                    status: 'pending',
                    created_at: '2022-01-01', // Changed from '2023-01-01' to '2022-01-01'
                    prepared_at: null,
                },
            ],
        });

        // Act
        const result = await service.searchReservations({
            limit: 10,
            offset: 0,
        });

        // Assert
        expect(result.total).toBe(10);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].isPrepared).toBe(false);
        expect(repo.countReservations).toHaveBeenCalledWith({
            status: undefined,
            limit: undefined,
            offset: undefined,
            prepared: undefined,
            plateId: undefined
        });
        expect(repo.searchReservations).toHaveBeenCalledWith({
            status: undefined,
            limit: 10,
            offset: 0,
            prepared: undefined,
            plateId: undefined
        });
    });



    it('getReservationDetails should aggregate data from multiple calls', async () => {
        // Arrange
        (repo.getReservationById as any).mockResolvedValue({
            rows: [{ plate_id: '1', status: 'done', prepared_at: '2023' }]
        });
        (repo.getReservationItems as any).mockResolvedValue({ rows: [] });
        (repo.getMarketPurchasesForPlate as any).mockResolvedValue({ rows: [] });

        // Act
        const result = await service.getReservationDetails('1');

        // Assert
        expect(result).not.toBeNull();
        expect(result?.isPrepared).toBe(true);
        expect(repo.getReservationItems).toHaveBeenCalledWith('1');
        expect(repo.getMarketPurchasesForPlate).toHaveBeenCalledWith('1');
    });
});
