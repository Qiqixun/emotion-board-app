import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { emotion } from '@client/src/api';
import type { CreateRoomResponse, JoinRoomResponse } from '@shared/api.interface';

const ROOM_STORAGE_KEY = 'emotion_room_info';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);

  const handleCreateRoom = async () => {
    setLoading('create');
    try {
      const res: CreateRoomResponse = await emotion.createRoom();
      const roomInfo = {
        roomId: res.roomId,
        roomCode: res.roomCode,
        playerIndex: res.playerIndex,
      };
      localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(roomInfo));
      toast.success('房间创建成功');
      navigate('/board');
    } catch {
      toast.error('创建房间失败，请重试');
    } finally {
      setLoading(null);
    }
  };

  const handleJoinRoom = async () => {
    if (!/^\d{6}$/.test(joinCode)) {
      toast.error('请输入6位数字房间码');
      return;
    }
    setLoading('join');
    try {
      const res: JoinRoomResponse = await emotion.joinRoom(joinCode);
      const roomInfo = {
        roomId: res.roomId,
        roomCode: res.roomCode,
        playerIndex: res.playerIndex,
      };
      localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(roomInfo));
      toast.success('加入房间成功');
      navigate('/board');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg = e?.response?.data?.message;
      if (msg?.includes('不存在')) {
        toast.error('房间不存在，请检查房间码');
      } else if (msg?.includes('已满')) {
        toast.error('房间已满，无法加入');
      } else {
        toast.error(msg || '加入失败，请重试');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setJoinCode(val);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[hsl(340_70%_96%)] to-[hsl(260_60%_96%)] flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8 flex flex-col items-center gap-6">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="text-5xl mb-2">💕</div>
            <h1 className="text-xl font-semibold text-foreground">情绪看板</h1>
            <p className="text-sm text-muted-foreground">和TA分享此刻的心情</p>
          </div>

          {/* Buttons */}
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={handleCreateRoom}
              disabled={loading !== null}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'create' ? '创建中...' : '创建房间'}
            </button>

            {!showJoinInput ? (
              <button
                onClick={() => setShowJoinInput(true)}
                disabled={loading !== null}
                className="w-full h-12 rounded-xl bg-white text-foreground border border-border font-medium text-sm hover:bg-muted/50 active:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                加入房间
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={handleCodeChange}
                    placeholder="请输入6位房间码"
                    maxLength={6}
                    className="flex-1 h-12 px-4 rounded-xl border border-input bg-white text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={loading !== null || joinCode.length !== 6}
                    className="h-12 px-5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === 'join' ? '...' : '加入'}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowJoinInput(false);
                    setJoinCode('');
                  }}
                  className="text-xs text-muted-foreground self-center hover:text-foreground transition-colors"
                >
                  取消
                </button>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <p className="text-xs text-muted-foreground text-center">
            创建后分享房间码给TA，一起记录心情
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
