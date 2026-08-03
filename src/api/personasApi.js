import api from './api';

const basePath = '/backendDocker/personas';

export const listPersonas = async (params = {}) => (await api.get(basePath, { params })).data;

export const getPersona = async (rut) => (await api.get(`${basePath}/${encodeURIComponent(rut)}`)).data;

export const getPersonaPhotoUrl = (rut) => `${api.defaults.baseURL || ''}${basePath}/${encodeURIComponent(rut)}/foto`;
