import { Injectable, Inject, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { room, emotionMessage } from '@server/database/schema';
import { eq, and, gt, asc, isNull, isNotNull } from 'drizzle-orm';
import type { CreateRoomResponse, JoinRoomResponse, EmotionMessage as EmotionMessageDto, ListMessagesResponse, RoomStatusResponse, HeartbeatResponse } from '@shared/api.interface';

const ONLINE_THRESHOLD_MS = 20_000;
const SLOT_TIMEOUT_MS = 60_000;

function generateRoomCode(): string {
  return String(Math.floor(Math.random() * 900_000) + 100_000);
}

function isOnline(lastSeen: Date | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - lastSeen.getTime() < ONLINE_THRESHOLD_MS;
}

@Injectable()
export class EmotionBoardService {
  private readonly logger = new Logger(EmotionBoardService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async createRoom(): Promise<CreateRoomResponse> {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i += 1) {
      const code: string = generateRoomCode();
      const existing = await this.db.select({ id: room.id }).from(room).where(eq(room.code, code));
      if (existing.length === 0) {
        const now: Date = new Date();
        const inserted = await this.db.insert(room).values({
          code,
          user1LastSeen: now,
        }).returning({ id: room.id, code: room.code });
        if (inserted.length > 0) {
          return {
            roomId: inserted[0].id,
            roomCode: inserted[0].code,
            playerIndex: 1,
          };
        }
      }
    }
    throw new ConflictException('无法生成可用房间码，请稍后再试');
  }

  async joinRoom(code: string): Promise<JoinRoomResponse> {
    const rooms = await this.db.select().from(room).where(eq(room.code, code));
    if (rooms.length === 0) {
      throw new NotFoundException('房间不存在');
    }

    const targetRoom = rooms[0];
    const now: Date = new Date();

    const p1Expired = targetRoom.user1LastSeen == null
      || now.getTime() - targetRoom.user1LastSeen.getTime() > SLOT_TIMEOUT_MS;
    const p2Expired = targetRoom.user2LastSeen == null
      || now.getTime() - targetRoom.user2LastSeen.getTime() > SLOT_TIMEOUT_MS;

    if (p1Expired) {
      await this.db.update(room).set({ user1LastSeen: now }).where(eq(room.id, targetRoom.id));
      return {
        roomId: targetRoom.id,
        roomCode: targetRoom.code,
        playerIndex: 1,
      };
    }

    if (p2Expired) {
      await this.db.update(room).set({ user2LastSeen: now }).where(eq(room.id, targetRoom.id));
      return {
        roomId: targetRoom.id,
        roomCode: targetRoom.code,
        playerIndex: 2,
      };
    }

    throw new ConflictException('房间已满，最多2人');
  }

  async sendEmotion(roomId: string, emotion: string, message: string | undefined, playerIndex: 1 | 2): Promise<{ id: string }> {
    if (message !== undefined && message.length > 30) {
      throw new BadRequestException('消息长度不能超过30字');
    }

    const rooms = await this.db.select({ id: room.id }).from(room).where(eq(room.id, roomId));
    if (rooms.length === 0) {
      throw new NotFoundException('房间不存在');
    }

    const inserted = await this.db.insert(emotionMessage).values({
      roomId,
      emotion,
      message: message ?? null,
      senderIndex: playerIndex,
    }).returning({ id: emotionMessage.id });

    return { id: inserted[0].id };
  }

  async listMessages(roomId: string, since?: string): Promise<ListMessagesResponse> {
    const conditions = [eq(emotionMessage.roomId, roomId)];
    if (since) {
      conditions.push(gt(emotionMessage.createdAt, new Date(since)));
    }

    const rows = await this.db.select({
      id: emotionMessage.id,
      emotion: emotionMessage.emotion,
      message: emotionMessage.message,
      senderIndex: emotionMessage.senderIndex,
      createdAt: emotionMessage.createdAt,
    }).from(emotionMessage)
      .where(and(...conditions))
      .orderBy(asc(emotionMessage.createdAt));

    const items: EmotionMessageDto[] = rows.map((row) => ({
      id: row.id,
      emotion: row.emotion as EmotionMessageDto['emotion'],
      message: row.message,
      senderIndex: row.senderIndex,
      createdAt: row.createdAt.toISOString(),
    }));

    return { items };
  }

  async heartbeat(roomId: string, playerIndex: 1 | 2): Promise<HeartbeatResponse> {
    const rooms = await this.db.select().from(room).where(eq(room.id, roomId));
    if (rooms.length === 0) {
      throw new NotFoundException('房间不存在');
    }

    const now: Date = new Date();
    const updateData: { user1LastSeen?: Date; user2LastSeen?: Date } = {};
    if (playerIndex === 1) {
      updateData.user1LastSeen = now;
    } else {
      updateData.user2LastSeen = now;
    }

    await this.db.update(room).set(updateData).where(eq(room.id, roomId));

    const updated = await this.db.select({
      user1LastSeen: room.user1LastSeen,
      user2LastSeen: room.user2LastSeen,
    }).from(room).where(eq(room.id, roomId));

    const r = updated[0];
    return {
      player1Online: isOnline(r.user1LastSeen),
      player2Online: isOnline(r.user2LastSeen),
    };
  }

  async getRoomStatus(roomId: string): Promise<RoomStatusResponse> {
    const rooms = await this.db.select({
      code: room.code,
      user1LastSeen: room.user1LastSeen,
      user2LastSeen: room.user2LastSeen,
    }).from(room).where(eq(room.id, roomId));

    if (rooms.length === 0) {
      throw new NotFoundException('房间不存在');
    }

    const r = rooms[0];
    const p1Online: boolean = isOnline(r.user1LastSeen);
    const p2Online: boolean = isOnline(r.user2LastSeen);
    const joinedCount: number = [r.user1LastSeen, r.user2LastSeen].filter((t: Date | null) => t != null).length;

    return {
      roomCode: r.code,
      player1Online: p1Online,
      player2Online: p2Online,
      joinedCount,
    };
  }
}
