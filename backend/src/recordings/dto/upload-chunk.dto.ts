import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadChunkDto {
  @ApiProperty({ example: 0, description: 'Order of the chunk (0, 1, 2, ...)' })
  @IsNumber()
  @Min(0)
  chunkOrder: number;

  @ApiProperty({ example: 'audio/webm', required: false })
  @IsString()
  mimeType?: string;
}
