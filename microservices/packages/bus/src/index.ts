import { Bus } from '@lunch/messaging';

export function createBus(url: string, prefetch: number) {
  return new Bus({ url, prefetch });
}
