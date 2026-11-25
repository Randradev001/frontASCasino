import api from './api';

const basePath = '/backendDocker/casino/maestros';
const cleanParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

export const listCasinoMaster = async (catalog, params = {}) =>
  (await api.get(`${basePath}/${catalog}`, { params: cleanParams(params) })).data;
const requestPayload = (catalog, payload) => {
  if (catalog !== 'productos') return payload;
  const data = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'imagePreview') return;
    if (key === 'image') {
      if (value) data.append('image', value);
      return;
    }
    data.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
  });
  return data;
};

export const createCasinoMaster = async (catalog, payload) =>
  (await api.post(`${basePath}/${catalog}`, requestPayload(catalog, payload))).data;
export const updateCasinoMaster = async (catalog, id, payload) =>
  (await api.put(`${basePath}/${catalog}/${encodeURIComponent(id)}`, requestPayload(catalog, payload))).data;
export const deleteCasinoMaster = async (catalog, id) => (await api.delete(`${basePath}/${catalog}/${encodeURIComponent(id)}`)).data;
export const getCasinoMasterOptions = async () => (await api.get(`${basePath}/opciones`)).data;
export const casinoProductImageUrl = (id) => `${basePath}/productos/${encodeURIComponent(id)}/imagen`;
