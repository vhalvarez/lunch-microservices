import type { InventoryRepository } from '../repositories/inventory.repo.js';

export class InventoryService {
    constructor(private repo: InventoryRepository) { }

    async getStock() {
        const { rows } = await this.repo.getStock();
        return rows;
    }
}
