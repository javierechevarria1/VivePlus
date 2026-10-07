import axios from 'axios';


const httpClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en petición HTTP:', error);
    return Promise.reject(error);
  }
);

export function extractApiError(e: unknown, fallback = 'Error en la solicitud'): never {
  const msg = axios.isAxiosError(e) ? (e.response?.data?.error ?? fallback) : fallback;
  throw new Error(msg);
}

export default httpClient;

