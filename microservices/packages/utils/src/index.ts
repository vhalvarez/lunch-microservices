export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const jitter = (baseMs: number) => baseMs + Math.floor(Math.random() * baseMs);
