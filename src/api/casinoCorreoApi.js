import api from './api';
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));
const base = '/backendDocker/casino/correos';
export const getCasinoMailStatus = async (params) => (await api.get(base, { params: clean(params) })).data;
export const getCasinoMailDetail = async (id) => (await api.get(`${base}/${encodeURIComponent(id)}`)).data;
export const retryCasinoMail = async (id) => (await api.post(`${base}/${encodeURIComponent(id)}/reintentar`)).data;
export const processCasinoMail = async () => (await api.post('/backendDocker/casino/correos-procesar', { limit: 10 })).data;
