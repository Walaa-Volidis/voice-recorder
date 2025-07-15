import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RecordingsService } from './recordings.service';
import { RecordingsController } from './recordings.controller';
import { Recording } from './entities/recording.entity';
import { AudioChunk } from './entities/audio-chunk.entity';
import { AudioGateway } from './gateways/audio.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recording, AudioChunk]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RecordingsController],
  providers: [RecordingsService, AudioGateway],
  exports: [RecordingsService],
})
export class RecordingsModule {}
