import api from './api';

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all')
  );

export const getOrdersDashboard = async (params = {}) =>
  (await api.get('/backendDocker/casino/bi/pedidos', { params: cleanParams(params) })).data;

export const getOrdersHistory = async (params = {}) =>
  (await api.get('/backendDocker/casino/bi/historial', { params: cleanParams(params) })).data;

export const getOrderHistoryDetail = async (number) =>
  (await api.get(`/backendDocker/casino/bi/pedidos/${encodeURIComponent(number)}`)).data;

export const getSecuritySummary = async () => (await api.get('/backendDocker/seguridad/resumen')).data;
