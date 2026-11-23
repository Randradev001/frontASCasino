import api from './api';

export const getCasinoAnnualReport = async (report, params) =>
  (await api.get(`/backendDocker/casino/consultas/${report}`, { params })).data;

export const getCasinoGeneralDownload = async (params) =>
  (await api.get('/backendDocker/casino/consultas/descarga-general', { params })).data;
