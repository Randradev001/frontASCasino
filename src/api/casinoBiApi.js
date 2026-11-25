import api from './api';

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all')
  );

export const getOrdersDashboard = async (params = {}) =>
  (await api.get('/backendDocker/casino/bi/pedidos', { params: cleanParams(params) })).data;

export const getMyOrdersDashboard = async () => (await api.get('/backendDocker/casino/bi/mis-pedidos')).data;
export const getCasinoDashboard = async () => (await api.get('/backendDocker/casino/bi/casino')).data;

export const getOrdersHistory = async (params = {}) =>
  (await api.get('/backendDocker/casino/bi/historial', { params: cleanParams(params) })).data;

export const getOrderHistoryDetail = async (number) =>
  (await api.get(`/backendDocker/casino/bi/pedidos/${encodeURIComponent(number)}`)).data;

export const evaluateCasinoOrder = async (number, payload) =>
  (await api.post(`/backendDocker/casino/pedidos/${encodeURIComponent(number)}/evaluacion`, payload)).data;

export const getSecuritySummary = async () => (await api.get('/backendDocker/seguridad/resumen')).data;
