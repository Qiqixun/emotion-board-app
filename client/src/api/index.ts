import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

export const emotion = {
  createRoom: async () => {
    try {
      const res = await axiosForBackend.post('/api/emotion/room/create');
      return res.data;
    } catch (e) {
      logger.error('创建房间失败', e);
      throw e;
    }
  },

  joinRoom: async (code: string) => {
    try {
      const res = await axiosForBackend.post('/api/emotion/room/join', { code });
      return res.data;
    } catch (e) {
      logger.error('加入房间失败', e);
      throw e;
    }
  },

  sendEmotion: async (
    roomId: string,
    emotion: string,
    message: string | undefined,
    playerIndex: 1 | 2,
  ) => {
    try {
      const res = await axiosForBackend.post('/api/emotion/send', {
        roomId,
        emotion,
        message,
        playerIndex,
      });
      return res.data;
    } catch (e) {
      logger.error('发送情绪失败', e);
      throw e;
    }
  },

  listMessages: async (roomId: string, since?: string) => {
    try {
      const url = since
        ? `/api/emotion/messages?roomId=${roomId}&since=${encodeURIComponent(since)}`
        : `/api/emotion/messages?roomId=${roomId}`;
      const res = await axiosForBackend.get(url);
      return res.data;
    } catch (e) {
      logger.error('获取消息失败', e);
      throw e;
    }
  },

  heartbeat: async (roomId: string, playerIndex: 1 | 2) => {
    try {
      const res = await axiosForBackend.post('/api/emotion/heartbeat', {
        roomId,
        playerIndex,
      });
      return res.data;
    } catch (e) {
      logger.error('心跳失败', e);
      throw e;
    }
  },

  getRoomStatus: async (roomId: string) => {
    try {
      const res = await axiosForBackend.get(`/api/emotion/room/status?roomId=${roomId}`);
      return res.data;
    } catch (e) {
      logger.error('获取房间状态失败', e);
      throw e;
    }
  },
};
