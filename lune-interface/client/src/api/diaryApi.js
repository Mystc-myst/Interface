import axiosClient from './axiosClient';

export const getEntries = ({ signal } = {}) => {
  return axiosClient.get('/diary', { signal });
};

export const getFolders = ({ signal } = {}) => {
  return axiosClient.get('/diary/folders', { signal });
};

export const getTagIndex = ({ signal } = {}) => {
  return axiosClient.get('/diary/tags', { signal });
};

export const createEntry = (data, { signal } = {}) => {
  return axiosClient.post('/diary', data, { signal });
};

export const updateEntry = (id, data, { signal } = {}) => {
  return axiosClient.put(`/diary/${id}`, data, { signal });
};

export const deleteEntry = (id, { signal } = {}) => {
  return axiosClient.delete(`/diary/${id}`, { signal });
};

export const createFolder = (data, { signal } = {}) => {
  return axiosClient.post('/diary/folders', data, { signal });
};

export const updateEntryFolder = (entryId, folderId, { signal } = {}) => {
  return axiosClient.post(`/diary/${entryId}/folder`, { folderId }, { signal });
};
