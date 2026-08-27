import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { emotion } from '@client/src/api';
import { EMOTION_CONFIG } from '@shared/api.interface';
import type {
  EmotionType,
  EmotionMessage,
  HeartbeatResponse,
} from '@shared/api.interface';

const ROOM_STORAGE_KEY = 'emotion_room_info';

interface RoomInfo {
  roomId: string;
  roomCode: string;
  playerIndex: 1 | 2;
}

const EMOTIONS: EmotionType[] = ['happy', 'tired', 'angry', 'miss', 'sad'];
const MAX_MESSAGE_LEN = 30;
const POLL_INTERVAL = 3000;
const HEARTBEAT_INTERVAL = 5000;

const BoardPage: React.FC = () => {
  const navigate = useNavigate();
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<EmotionMessage[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [messageText, setMessageText] = useState('');
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastCreatedAtRef = useRef<string>('');
  const pollTimerRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const visibleRef = useRef(true);

  // Load room info from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(ROOM_STORAGE_KEY);
    if (!raw) {
      navigate('/');
      return;
    }
    try {
      const info: RoomInfo = JSON.parse(raw);
      if (!info.roomId || !info.roomCode || !info.playerIndex) {
        navigate('/');
        return;
      }
      setRoomInfo(info);
    } catch {
      navigate('/');
    }
  }, [navigate]);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch initial messages
  const fetchInitialMessages = useCallback(async (roomId: string) => {
    try {
      const res = await emotion.listMessages(roomId);
      const items: EmotionMessage[] = res.items || [];
      setMessages(items);
      if (items.length > 0) {
        lastCreatedAtRef.current = items[items.length - 1].createdAt;
      }
      setTimeout(scrollToBottom, 100);
    } catch {
      toast.error('加载消息失败');
    }
  }, [scrollToBottom]);

  // Poll for new messages
  const pollNewMessages = useCallback(async (roomId: string) => {
    if (!visibleRef.current) return;
    try {
      const since = lastCreatedAtRef.current;
      const res = await emotion.listMessages(roomId, since);
      const items: EmotionMessage[] = res.items || [];
      if (items.length > 0) {
        setMessages((prev) => [...prev, ...items]);
        lastCreatedAtRef.current = items[items.length - 1].createdAt;
        setTimeout(scrollToBottom, 50);
      }
    } catch {
      // silent fail for poll
    }
  }, [scrollToBottom]);

  // Send heartbeat
  const sendHeartbeat = useCallback(async (roomId: string, playerIndex: 1 | 2) => {
    if (!visibleRef.current) return;
    try {
      const res: HeartbeatResponse = await emotion.heartbeat(roomId, playerIndex);
      const partnerIsOnline = playerIndex === 1 ? res.player2Online : res.player1Online;
      setPartnerOnline(partnerIsOnline);
    } catch {
      // silent fail for heartbeat
    }
  }, []);

  // Setup polling and heartbeat
  useEffect(() => {
    if (!roomInfo) return;

    fetchInitialMessages(roomInfo.roomId);
    sendHeartbeat(roomInfo.roomId, roomInfo.playerIndex);

    // Visibility change handler
    const handleVisibilityChange = () => {
      visibleRef.current = document.visibilityState === 'visible';
      if (visibleRef.current) {
        // Resume: poll immediately
        pollNewMessages(roomInfo.roomId);
        sendHeartbeat(roomInfo.roomId, roomInfo.playerIndex);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    pollTimerRef.current = window.setInterval(() => {
      if (visibleRef.current) {
        pollNewMessages(roomInfo.roomId);
      }
    }, POLL_INTERVAL);

    heartbeatTimerRef.current = window.setInterval(() => {
      if (visibleRef.current) {
        sendHeartbeat(roomInfo.roomId, roomInfo.playerIndex);
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [roomInfo, fetchInitialMessages, pollNewMessages, sendHeartbeat]);

  const handleCopyCode = async () => {
    if (!roomInfo) return;
    try {
      await navigator.clipboard.writeText(roomInfo.roomCode);
      toast.success('房间码已复制');
    } catch {
      toast.error('复制失败');
    }
  };

  const handleSend = async () => {
    if (!roomInfo) return;
    if (!selectedEmotion) {
      toast.warning('请先选择一个情绪');
      return;
    }

    setSending(true);
    try {
      await emotion.sendEmotion(
        roomInfo.roomId,
        selectedEmotion,
        messageText.trim() || undefined,
        roomInfo.playerIndex,
      );
      setMessageText('');
      // Poll immediately to get the new message
      pollNewMessages(roomInfo.roomId);
    } catch {
      toast.error('发送失败，请重试');
    } finally {
      setSending(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, MAX_MESSAGE_LEN);
    setMessageText(val);
  };

  if (!roomInfo) {
    return null;
  }

  const isOwnMessage = (msg: EmotionMessage): boolean => {
    return msg.senderIndex === roomInfo.playerIndex;
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-[hsl(340_70%_96%)] to-[hsl(260_60%_96%)] flex flex-col">
      <div className="max-w-md w-full mx-auto flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm border-b border-border/50">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <span className="text-sm font-medium text-foreground">
              房间 {roomInfo.roomCode}
            </span>
            <span className="text-xs text-muted-foreground">点击复制</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                partnerOnline ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {partnerOnline ? '对方在线' : '对方已离线'}
            </span>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                还没有情绪记录，发送第一条吧~
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const own = isOwnMessage(msg);
              const config = EMOTION_CONFIG[msg.emotion];
              return (
                <div
                  key={msg.id}
                  className={`flex ${own ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                      own
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-white text-foreground rounded-bl-md'
                    }`}
                  >
                    <div className="text-3xl mb-1">{config.emoji}</div>
                    <div className="text-sm font-medium mb-1">{config.label}</div>
                    {msg.message && (
                      <div className="text-sm mb-1 break-words">{msg.message}</div>
                    )}
                    <div
                      className={`text-xs ${
                        own ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {dayjs(msg.createdAt).format('HH:mm')}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Emotion picker + input */}
        <div className="p-4 bg-white/90 backdrop-blur-sm border-t border-border/50">
          {/* Emotion buttons */}
          <div className="flex justify-around gap-2 mb-3">
            {EMOTIONS.map((emo) => {
              const config = EMOTION_CONFIG[emo];
              const selected = selectedEmotion === emo;
              return (
                <button
                  key={emo}
                  onClick={() => setSelectedEmotion(emo)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                    selected
                      ? 'bg-primary/10 ring-2 ring-primary ring-offset-2 scale-110'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  aria-label={config.label}
                >
                  {config.emoji}
                </button>
              );
            })}
          </div>

          {/* Message input + send */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={messageText}
                onChange={handleMessageChange}
                placeholder="说点什么...（选填）"
                maxLength={MAX_MESSAGE_LEN}
                className="w-full h-11 pl-4 pr-10 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {messageText.length}/{MAX_MESSAGE_LEN}
              </span>
            </div>
            <button
              onClick={handleSend}
              disabled={sending}
              className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? '...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardPage;
