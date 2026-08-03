import api from './api';

const basePath = '/backendDocker/casino/pedidos';

export const getOrderContext = async () => (await api.get(`${basePath}/contexto`)).data;

export const createOrderDraft = async (payload) => (await api.post(basePath, payload)).data;

export const sendOrder = async (number) => (await api.post(`${basePath}/${encodeURIComponent(number)}/enviar`)).data;
