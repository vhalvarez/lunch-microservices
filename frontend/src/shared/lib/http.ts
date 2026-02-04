import axios, { AxiosError } from 'axios';

export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public apiData: any;

  constructor(status: number, statusText: string, message: string, apiData: any) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.statusText = statusText;
      this.apiData = apiData;
  }
}

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
    
    const apiError = new ApiError(
        status, 
        statusText, 
        `HTTP ${status} ${statusText} - ${payload}`, 
        error.response?.data
    );
    return Promise.reject(apiError);
  }
);
