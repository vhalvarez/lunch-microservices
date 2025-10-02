import axios, { AxiosError } from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_BFF_URL ?? 'http://localhost:4000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const statusText = error.response?.statusText ?? 'Network/timeout';
    const payload =
      typeof error.response?.data === 'string'
        ? error.response.data
        : JSON.stringify(error.response?.data ?? {});
    return Promise.reject(
      new Error(`HTTP ${status} ${statusText} - ${payload}`)
    );
  }
);
