import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRecordingDto {
  @ApiProperty({ example: 'My Voice Recording' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'A description of my recording', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'webm' })
  @IsOptional()
  @IsString()
  audioFormat?: string;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalChunks?: number;
}
