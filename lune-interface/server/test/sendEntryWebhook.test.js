const axios = require('axios');
const diaryRoutes = require('../routes/diary');
const diaryStore = require('../diaryStore');

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.example') });

jest.mock('axios');

describe('sendEntryWebhook', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends payload with folder info', async () => {
    axios.get.mockResolvedValue({});
    jest.spyOn(diaryStore, 'findFolderById').mockResolvedValue({ id: 5, name: 'Personal' });

    const entry = {
      id: 1,
      text: 'test',
      timestamp: '2024-01-01',
      FolderId: 5,
      agent_logs: { Lune: { reflection: 'idea' } }
    };

    await diaryRoutes.sendEntryWebhook(entry);

    const expectedPayload = {
      entry_id: 1,
      content: 'test',
      created_at: '2024-01-01',
      folder: { folder_id: 5, folder_name: 'Personal' },
      idea: 'idea'
    };

    expect(diaryStore.findFolderById).toHaveBeenCalledWith(5);
    expect(axios.get).toHaveBeenCalledWith(
      process.env.N8N_WEBHOOK_URL,
      { params: expectedPayload, timeout: 2000 }
    );
  });

  it('sends payload without folder', async () => {
    axios.get.mockResolvedValue({});

    const entry = {
      id: 2,
      text: 'hello',
      timestamp: '2024',
      agent_logs: {}
    };

    await diaryRoutes.sendEntryWebhook(entry);

    const expectedPayload = {
      entry_id: 2,
      content: 'hello',
      created_at: '2024',
      folder: null,
      idea: ''
    };

    expect(diaryStore.findFolderById).not.toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalledWith(
      process.env.N8N_WEBHOOK_URL,
      { params: expectedPayload, timeout: 2000 }
    );
  });
});
