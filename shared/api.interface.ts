export type EmotionType = 'happy' | 'tired' | 'angry' | 'miss' | 'sad';

export const EMOTION_CONFIG: Record<EmotionType, { emoji: string; label: string }> = {
  happy: { emoji: '😊', label: '开心' },
  tired: { emoji: '😩', label: '疲惫' },
  angry: { emoji: '😠', label: '生气' },
  miss: { emoji: '🥺', label: '想你' },
  sad: { emoji: '😔', label: '低落' },
};

export interface CreateRoomResponse {
  roomId: string;
  roomCode: string;
  playerIndex: 1 | 2;
}

export interface JoinRoomRequest {
  code: string;
}

export interface JoinRoomResponse {
  roomId: string;
  roomCode: string;
  playerIndex: 1 | 2;
}

export interface SendEmotionRequest {
  roomId: string;
  emotion: EmotionType;
  message?: string;
  playerIndex: 1 | 2;
}

export interface EmotionMessage {
  id: string;
  emotion: EmotionType;
  message: string | null;
  senderIndex: number;
  createdAt: string;
}

export interface ListMessagesResponse {
  items: EmotionMessage[];
}

export interface RoomStatusResponse {
  roomCode: string;
  player1Online: boolean;
  player2Online: boolean;
  joinedCount: number;
}

export interface HeartbeatRequest {
  roomId: string;
  playerIndex: 1 | 2;
}

export interface HeartbeatResponse {
  player1Online: boolean;
  player2Online: boolean;
}
