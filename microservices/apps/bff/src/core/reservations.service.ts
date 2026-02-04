import type { ReservationsRepository } from '../repositories/reservations.repo.js';

export class ReservationsService {
    constructor(private repo: ReservationsRepository) { }

    async searchReservations(params: {
        status?: string;
        plateId?: string;
        limit: number;
        offset: number;
        prepared?: boolean;
    }) {
        const { status, plateId, limit, offset, prepared } = params;

        // Pass high-level criteria to Repository
        const criteria = { status, plateId, prepared };

        const { rows: countRows } = await this.repo.countReservations(criteria);
        const { rows } = await this.repo.searchReservations({ ...criteria, limit, offset });

        const data = rows.map((r) => ({
            ...r,
            isPrepared: Boolean(r.prepared_at),
        }));

        return {
            total: Number(countRows[0]?.total ?? 0),
            limit,
            offset,
            data,
        };
    }

    async getReservationDetails(plateId: string) {
        const { rows: head } = await this.repo.getReservationById(plateId);
        if (head.length === 0) return null;

        const { rows: items } = await this.repo.getReservationItems(plateId);
        const { rows: purchases } = await this.repo.getMarketPurchasesForPlate(plateId);

        const headRow = head[0];
        return {
            ...headRow,
            isPrepared: Boolean(headRow.prepared_at),
            items,
            purchases,
        };
    }
}
