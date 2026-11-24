import api from './api';

const upload = async (path, file) => {
  const data = new FormData();
  data.append('file', file);
  return (await api.post(`/backendDocker/casino/cargas/${path}`, data)).data;
};

export const validateCasinoWorkbook = (file) => upload('validar', file);
export const importCasinoWorkbook = (file) => upload('importar', file);
