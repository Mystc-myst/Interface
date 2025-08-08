import axiosClient from './axiosClient';

export const logToLune = (data, { signal } = {}) => {
  return axiosClient.post('/api/lune/log', data, { signal });
};

export const sendToLune = (data, { signal } = {}) => {
  return axiosClient.post('/api/lune/send', data, { signal });
};
