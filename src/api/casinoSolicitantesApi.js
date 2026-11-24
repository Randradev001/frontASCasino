import api from './api';

const path = '/backendDocker/casino/maestros/solicitantes';
export const listCasinoRequesters = async (params) => (await api.get(path, { params })).data;
export const createCasinoRequester = async (payload) => (await api.post(path, payload)).data;
export const updateCasinoRequester = async (id, payload) => (await api.put(`${path}/${id}`, payload)).data;
export const deleteCasinoRequester = async (id) => (await api.delete(`${path}/${id}`)).data;
