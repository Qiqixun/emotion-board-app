import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { EmotionBoardService } from './emotion-board.service';
import type {
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  SendEmotionRequest,
  ListMessagesResponse,
  RoomStatusResponse,
  HeartbeatRequest,
  HeartbeatResponse,
} from '@shared/api.interface';

@Controller('api/emotion')
export class EmotionBoardController {
  constructor(private readonly emotionBoardService: EmotionBoardService) {}

  @Post('room/create')
  async createRoom(): Promise<CreateRoomResponse> {
    return this.emotionBoardService.createRoom();
  }

  @Post('room/join')
  async joinRoom(@Body() body: JoinRoomRequest): Promise<JoinRoomResponse> {
    return this.emotionBoardService.joinRoom(body.code);
  }

  @Post('send')
  async sendEmotion(@Body() body: SendEmotionRequest): Promise<{ id: string }> {
    return this.emotionBoardService.sendEmotion(
      body.roomId,
      body.emotion,
      body.message,
      body.playerIndex,
    );
  }

  @Get('messages')
  async getMessages(
    @Query('roomId') roomId: string,
    @Query('since') since?: string,
  ): Promise<ListMessagesResponse> {
    return this.emotionBoardService.listMessages(roomId, since);
  }

  @Post('heartbeat')
  async heartbeat(@Body() body: HeartbeatRequest): Promise<HeartbeatResponse> {
    return this.emotionBoardService.heartbeat(body.roomId, body.playerIndex);
  }

  @Get('room/status')
  async getRoomStatus(@Query('roomId') roomId: string): Promise<RoomStatusResponse> {
    return this.emotionBoardService.getRoomStatus(roomId);
  }
}
