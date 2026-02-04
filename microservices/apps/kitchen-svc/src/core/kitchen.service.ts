import { jitter, sleep } from '@lunch/utils';
import type { KitchenRepository } from '../repositories/kitchen.repo.js';

export class KitchenService {
    constructor(private repo: KitchenRepository) { }

    async preparePlate(plateId: string): Promise<Date | null> {
        // Simulación de tiempo de cocina (200–600 ms, con jitter)
        await sleep(jitter(200));

        // Marcar como preparado en DB
        return this.repo.markAsPrepared(plateId);
    }
}
