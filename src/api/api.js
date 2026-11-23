import axios from 'axios';

const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

const resolveApiUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8065`;

  try {
    const apiUrl = new URL(configuredUrl, window.location.origin);
    if (localHosts.has(apiUrl.hostname) && localHosts.has(window.location.hostname)) apiUrl.hostname = window.location.hostname;
    return apiUrl.toString().replace(/\/$/, '');
  } catch {
    return configuredUrl;
  }
};

const api = axios.create({
  baseURL: resolveApiUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) window.dispatchEvent(new Event('casino:unauthenticated'));
    return Promise.reject(error);
  }
);

export default api;
