import { Module } from '@nestjs/common';
import { EmotionBoardController } from './emotion-board.controller';
import { EmotionBoardService } from './emotion-board.service';

@Module({
  controllers: [EmotionBoardController],
  providers: [EmotionBoardService],
})
export class EmotionBoardModule {}
