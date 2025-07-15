import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRecordingDto {
  @ApiProperty({ example: 'Updated Recording Title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 120.5,
    description: 'Duration in seconds',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiProperty({ example: 'completed', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
