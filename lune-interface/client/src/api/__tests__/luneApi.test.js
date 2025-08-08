import axiosClient from '../axiosClient';
import { logToLune, sendToLune } from '../luneApi';

jest.mock('../axiosClient');

describe('luneApi', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('logToLune', () => {
        it('should call axiosClient.post with the correct URL and data', async () => {
            const mockData = { data: {} };
            const conversation = [{ sender: 'user', text: 'hello' }];
            axiosClient.post.mockResolvedValue(mockData);

            const result = await logToLune({ conversation });

            expect(axiosClient.post).toHaveBeenCalledWith('/api/lune/log', { conversation }, { signal: undefined });
            expect(result).toEqual(mockData);
        });
    });

    describe('sendToLune', () => {
        it('should call axiosClient.post with the correct URL and data', async () => {
            const mockData = { data: { aiReply: 'hello there' } };
            const message = { sessionId: '123', userMessage: 'hello' };
            axiosClient.post.mockResolvedValue(mockData);

            const result = await sendToLune(message);

            expect(axiosClient.post).toHaveBeenCalledWith('/api/lune/send', message, { signal: undefined });
            expect(result).toEqual(mockData);
        });
    });
});
