import api from './api';

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all')
  );

const basePath = '/backendDocker/casino/solicitudes';

export const getCasinoRequests = async (params = {}) => (await api.get(basePath, { params: cleanParams(params) })).data;
export const getCasinoRequestDetail = async (number) => (await api.get(`${basePath}/${encodeURIComponent(number)}`)).data;
export const getRequesterCasinoHistory = async (rut) => (await api.get(`${basePath}/personas/${encodeURIComponent(rut)}/historial`)).data;
export const approveCasinoRequest = async (number, payload) =>
  (await api.post(`${basePath}/${encodeURIComponent(number)}/aprobar`, payload)).data;
export const rejectCasinoRequest = async (number, payload) =>
  (await api.post(`${basePath}/${encodeURIComponent(number)}/rechazar`, payload)).data;
export const deliverCasinoRequest = async (number) => (await api.post(`${basePath}/${encodeURIComponent(number)}/entregar`)).data;
