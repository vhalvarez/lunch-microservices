import type { InventoryRepository } from '../repositories/inventory.repo.js';
import type { Ingredient } from '@lunch/shared-kernel';

export class InventoryService {
    constructor(private repo: InventoryRepository) { }

    async processReservation(plateId: string, items: { ingredient: Ingredient; qty: number }[]) {
        // 1. Crear/Actualizar estructura de reserva
        await this.repo.createReservation(plateId);
        await this.repo.upsertReservationItems(plateId, items);

        const shortages: Array<{ ingredient: Ingredient; missing: number }> = [];

        // 2. Verificar stock y reservar
        for (const r of items) {
            const curr = await this.repo.getStockForUpdate(r.ingredient);

            if (curr >= r.qty) {
                // Hay suficiente stock
                await this.repo.updateStock(r.ingredient, r.qty);
                await this.repo.setReservationReserved(plateId, r.ingredient, r.qty);
            } else {
                // Stock parcial
                const reserveNow = Math.max(Math.min(curr, r.qty), 0);
                if (reserveNow > 0) {
                    await this.repo.updateStock(r.ingredient, reserveNow);
                    await this.repo.incrementReservationReserved(plateId, r.ingredient, reserveNow);
                }

                const missing = r.qty - reserveNow;
                if (missing > 0) {
                    shortages.push({ ingredient: r.ingredient, missing });
                }
            }
        }

        // 3. Decidir estado final
        const shouldPurchase = shortages.length > 0;
        const finalStatus = shouldPurchase ? 'purchasing' : 'reserved';

        await this.repo.updateReservationStatus(plateId, finalStatus);

        return { shortages, shouldPurchase };
    }

    async processPurchaseCompleted(plateId: string, purchased: { ingredient: Ingredient; qty: number }[]) {
        // 1. Ingresar stock comprado
        for (const p of purchased) {
            await this.repo.upsertStock(p.ingredient, p.qty);
        }

        // 2. Intentar completar la reserva pendiente
        const items = await this.repo.getReservationItems(plateId);
        let allOk = true;

        for (const it of items) {
            const need = Number(it.needed) - Number(it.reserved);
            if (need <= 0) continue;

            const curr = await this.repo.getStockForUpdate(it.ingredient);
            const reserveNow = Math.min(curr, need);

            if (reserveNow > 0) {
                await this.repo.updateStock(it.ingredient, reserveNow);
                await this.repo.incrementReservationReserved(plateId, it.ingredient, reserveNow);
            }

            if (reserveNow < need) {
                allOk = false;
            }
        }

        // 3. Actualizar estado
        if (allOk) {
            await this.repo.updateReservationStatus(plateId, 'reserved');
        } else {
            // Si aún falta, volver a pending para que el reconciler lo tome
            await this.repo.updateReservationStatus(plateId, 'pending');
        }

        // Retorna items reservados para el evento
        const finalItems = await this.repo.getReservationItems(plateId);
        const itemsPub = finalItems.map((r: any) => ({
            ingredient: r.ingredient as Ingredient,
            qty: Number(r.reserved),
        }));

        return { allOk, itemsPub };
    }

    async handlePurchaseFailed(plateId: string) {
        const needsRetry = await this.repo.findPendingReservationToRetry(plateId);
        if (needsRetry) {
            await this.repo.updateReservationStatus(plateId, 'pending');
            return true; // Was updated
        }
        return false;
    }
}
