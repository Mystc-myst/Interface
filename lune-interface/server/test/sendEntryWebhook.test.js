const axios = require('axios');
const diaryRoutes = require('../routes/diary');
const diaryStore = require('../diaryStore');

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.example') });

jest.mock('axios');

describe('sendEntryWebhook', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends payload with folder info via POST', async () => {
    axios.post.mockResolvedValue({ status: 200 });
    jest.spyOn(diaryStore, 'findFolderById').mockResolvedValue({ id: 'folder-uuid-123', name: 'Personal' });

    const now = new Date();
    const entry = {
      id: 'entry-uuid-456',
      text: 'test',
      FolderId: 'folder-uuid-123',
      createdAt: now,
      updatedAt: now,
    };

    await diaryRoutes.sendEntryWebhook(entry);

    const expectedPayload = {
      entry_id: 'entry-uuid-456',
      content: 'test',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      idea: null,
      folder: {
        folder_id: 'folder-uuid-123',
        name: 'Personal',
        description: null
      },
    };

    expect(diaryStore.findFolderById).toHaveBeenCalledWith('folder-uuid-123');
    expect(axios.post).toHaveBeenCalledWith(
      process.env.N8N_WEBHOOK_URL,
      expectedPayload,
      {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: null,
      }
    );
  });

  it('sends payload without folder via POST', async () => {
    axios.post.mockResolvedValue({ status: 200 });

    const now = new Date();
    const entry = {
      id: 'entry-uuid-789',
      text: 'hello',
      FolderId: null,
      createdAt: now,
      updatedAt: now,
    };

    await diaryRoutes.sendEntryWebhook(entry);

    const expectedPayload = {
      entry_id: 'entry-uuid-789',
      content: 'hello',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      idea: null,
      folder: null,
    };

    expect(diaryStore.findFolderById).not.toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith(
      process.env.N8N_WEBHOOK_URL,
      expectedPayload,
      {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: null,
      }
    );
  });
});
