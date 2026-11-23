import api from './api';

const basePath = '/backendDocker/casino/maestros';
const cleanParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

export const listCasinoMaster = async (catalog, params = {}) =>
  (await api.get(`${basePath}/${catalog}`, { params: cleanParams(params) })).data;
export const createCasinoMaster = async (catalog, payload) => (await api.post(`${basePath}/${catalog}`, payload)).data;
export const updateCasinoMaster = async (catalog, id, payload) =>
  (await api.put(`${basePath}/${catalog}/${encodeURIComponent(id)}`, payload)).data;
export const deleteCasinoMaster = async (catalog, id) => (await api.delete(`${basePath}/${catalog}/${encodeURIComponent(id)}`)).data;
export const getCasinoMasterOptions = async () => (await api.get(`${basePath}/opciones`)).data;
