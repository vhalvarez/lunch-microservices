import { env } from '@lunch/config';
import { request } from 'undici';
import { jitter, sleep } from '@lunch/utils';
import { createLogger } from '@lunch/logger';
import type { MarketRepository } from '../repositories/market.repo.js';
import CircuitBreaker from 'opossum';

const log = createLogger('market-service');

export class MarketService {
    private breaker: CircuitBreaker<[string], number>;

    constructor(private repo: MarketRepository) {
        this.breaker = new CircuitBreaker(this.buyOnceRaw.bind(this), {
            timeout: 3000, // 3s timeout
            errorThresholdPercentage: 50, // Open if 50% fail
            resetTimeout: 30000, // Try again after 30s
        });

        this.breaker.on('open', () => log.warn('🔥 Circuit breaker OPEN - Market API unreachable'));
        this.breaker.on('halfOpen', () => log.info('⚠️ Circuit breaker HALF-OPEN - testing market'));
        this.breaker.on('close', () => log.info('✅ Circuit breaker CLOSED - market recovered'));
    }

    private async buyOnceRaw(ingredient: string): Promise<number> {
        const url = `${env.MARKET_URL}/buy?ingredient=${encodeURIComponent(ingredient)}`;
        const res = await request(url, {
            method: 'GET',
            headers: { accept: 'application/json' },
        });

        if (res.statusCode !== 200) throw new Error(`Market returned ${res.statusCode}`);

        const body = await res.body.json().catch(() => ({}) as any);
        const sold = Number((body as { quantitySold?: number })?.quantitySold ?? 0);
        return Number.isFinite(sold) ? sold : 0;
    }

    private async buyOnce(ingredient: string): Promise<number> {
        // Fallback to 0 if breaker is open or call fails
        return this.breaker.fire(ingredient).catch((err: Error) => {
            log.warn({ err: err.message, ingredient }, 'Market purchase failed (breaker/error)');
            return 0;
        });
    }

    async processShortage(shortage: { ingredient: string; missing: number }, plateId: string) {
        let remaining = shortage.missing;
        let soldTotal = 0;

        for (let attempt = 1; attempt <= env.MARKET_MAX_ATTEMPTS && remaining > 0; attempt++) {
            const qtyRequestedNow = remaining;
            const sold = await this.buyOnce(shortage.ingredient).catch(() => 0);

            log.info(
                {
                    plateId,
                    ingredient: shortage.ingredient,
                    attempt,
                    requested: qtyRequestedNow,
                    sold,
                },
                'market response',
            );

            await this.repo.recordMarketPurchase({
                plateId,
                ingredient: shortage.ingredient,
                qtyRequested: qtyRequestedNow,
                quantitySold: sold,
            });

            if (sold > 0) {
                soldTotal += sold;
                remaining = Math.max(0, remaining - sold);
            } else {
                await sleep(jitter(env.MARKET_BASE_BACKOFF_MS * attempt));
            }
        }

        return { remaining, soldTotal };
    }
}
