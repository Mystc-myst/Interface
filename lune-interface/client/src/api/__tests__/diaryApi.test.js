import axiosClient from '../axiosClient';
import {
  getEntries,
  getFolders,
  getTagIndex,
  createEntry,
  updateEntry,
  deleteEntry,
  createFolder,
  updateEntryFolder,
} from '../diaryApi';

jest.mock('../axiosClient');

describe('diaryApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEntries', () => {
    it('should call axiosClient.get with the correct URL', async () => {
      const mockData = { data: [{ id: 1, text: 'Test Entry' }] };
      axiosClient.get.mockResolvedValue(mockData);

      const result = await getEntries();

      expect(axiosClient.get).toHaveBeenCalledWith('/diary', { signal: undefined });
      expect(result).toEqual(mockData);
    });
  });

  describe('getFolders', () => {
    it('should call axiosClient.get with the correct URL', async () => {
      const mockData = { data: [{ id: 1, name: 'Test Folder' }] };
      axiosClient.get.mockResolvedValue(mockData);

      const result = await getFolders();

      expect(axiosClient.get).toHaveBeenCalledWith('/diary/folders', { signal: undefined });
      expect(result).toEqual(mockData);
    });
  });

  describe('getTagIndex', () => {
    it('should call axiosClient.get with the correct URL', async () => {
      const mockData = { data: { test: 1 } };
      axiosClient.get.mockResolvedValue(mockData);

      const result = await getTagIndex();

      expect(axiosClient.get).toHaveBeenCalledWith('/diary/tags', { signal: undefined });
      expect(result).toEqual(mockData);
    });
  });

  describe('createEntry', () => {
    it('should call axiosClient.post with the correct URL and data', async () => {
      const mockData = { data: { id: 1, text: 'New Entry' } };
      const newEntry = { text: 'New Entry' };
      axiosClient.post.mockResolvedValue(mockData);

      const result = await createEntry(newEntry);

      expect(axiosClient.post).toHaveBeenCalledWith('/diary', newEntry, { signal: undefined });
      expect(result).toEqual(mockData);
    });
  });

  describe('updateEntry', () => {
    it('should call axiosClient.put with the correct URL and data', async () => {
      const mockData = { data: { id: 1, text: 'Updated Entry' } };
      const updatedEntry = { text: 'Updated Entry' };
      axiosClient.put.mockResolvedValue(mockData);

      const result = await updateEntry(1, updatedEntry);

      expect(axiosClient.put).toHaveBeenCalledWith('/diary/1', updatedEntry, { signal: undefined });
      expect(result).toEqual(mockData);
    });
  });

  describe('deleteEntry', () => {
    it('should call axiosClient.delete with the correct URL', async () => {
      const mockData = { data: {} };
      axiosClient.delete.mockResolvedValue(mockData);

      const result = await deleteEntry(1);

      expect(axiosClient.delete).toHaveBeenCalledWith('/diary/1', { signal: undefined });
      expect(result).toEqual(mockData);
    });
  });

  describe('createFolder', () => {
    it('should call axiosClient.post with the correct URL and data', async () => {
        const mockData = { data: { id: 1, name: 'New Folder' } };
        const newFolder = { name: 'New Folder' };
        axiosClient.post.mockResolvedValue(mockData);

        const result = await createFolder(newFolder);

        expect(axiosClient.post).toHaveBeenCalledWith('/diary/folders', newFolder, { signal: undefined });
        expect(result).toEqual(mockData);
    });
  });

    describe('updateEntryFolder', () => {
        it('should call axiosClient.post with the correct URL and data', async () => {
            const mockData = { data: {} };
            axiosClient.post.mockResolvedValue(mockData);

            const result = await updateEntryFolder(1, 2);

            expect(axiosClient.post).toHaveBeenCalledWith('/diary/1/folder', { folderId: 2 }, { signal: undefined });
            expect(result).toEqual(mockData);
        });
    });
});
