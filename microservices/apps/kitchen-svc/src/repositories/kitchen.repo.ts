import type { Pool } from '@lunch/db';

export class KitchenRepository {
    constructor(private pool: Pool) { }

    async markAsPrepared(plateId: string): Promise<Date | null> {
        const { rows } = await this.pool.query<{ prepared_at: string }>(
            `
      update reservations
         set prepared_at = coalesce(prepared_at, now())
       where plate_id = $1
       returning prepared_at
    `,
            [plateId],
        );

        if (rows.length === 0) return null;
        return new Date(rows[0].prepared_at);
    }
}
