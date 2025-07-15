import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Response } from 'express';
import { RecordingsService } from './recordings.service';
import { CreateRecordingDto } from './dto/create-recording.dto';
import { UpdateRecordingDto } from './dto/update-recording.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Recording } from './entities/recording.entity';

@ApiTags('recordings')
@Controller('recordings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recording' })
  @ApiResponse({
    status: 201,
    description: 'Recording created successfully',
    type: Recording,
  })
  create(
    @Body() createRecordingDto: CreateRecordingDto,
    @Request() req,
  ): Promise<Recording> {
    return this.recordingsService.create(createRecordingDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all recordings for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Recordings retrieved successfully',
    type: [Recording],
  })
  findAll(@Request() req): Promise<Recording[]> {
    return this.recordingsService.findAll(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get recording statistics for the user' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalRecordings: { type: 'number' },
        totalDuration: { type: 'number' },
        completedRecordings: { type: 'number' },
        pendingRecordings: { type: 'number' },
      },
    },
  })
  getStats(@Request() req) {
    return this.recordingsService.getRecordingStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific recording' })
  @ApiResponse({ status: 200, description: 'Recording found', type: Recording })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<Recording> {
    return this.recordingsService.findOne(id, req.user.id);
  }

  @Post(':id/chunks')
  @UseInterceptors(FileInterceptor('chunk'))
  @ApiOperation({ summary: 'Upload an audio chunk' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Chunk uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async uploadChunk(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadChunkDto: UploadChunkDto,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No audio chunk provided');
    }

    // Convert chunkOrder to number if it comes as string from form data
    const chunkOrder = Number(uploadChunkDto.chunkOrder);
    if (isNaN(chunkOrder)) {
      throw new BadRequestException('Invalid chunk order');
    }

    return this.recordingsService.uploadChunk(
      id,
      file.buffer,
      { ...uploadChunkDto, chunkOrder },
      req.user.id,
    );
  }

  @Get(':id/stream')
  @ApiOperation({ summary: 'Stream the complete audio recording' })
  @ApiResponse({ status: 200, description: 'Audio stream' })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  @ApiResponse({ status: 400, description: 'Recording not completed' })
  async streamAudio(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Res() res: Response,
  ) {
    const audioBuffer = await this.recordingsService.getAudioStream(
      id,
      req.user.id,
    );

    // Get recording details for proper content type
    const recording = await this.recordingsService.findOne(id, req.user.id);

    res.set({
      'Content-Type':
        recording.audioFormat === 'wav' ? 'audio/wav' : 'audio/webm',
      'Content-Length': audioBuffer.length.toString(),
      'Content-Disposition': `inline; filename="${recording.title}.${recording.audioFormat || 'webm'}"`,
    });

    res.send(audioBuffer);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recording' })
  @ApiResponse({
    status: 200,
    description: 'Recording updated successfully',
    type: Recording,
  })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecordingDto: UpdateRecordingDto,
    @Request() req,
  ): Promise<Recording> {
    return this.recordingsService.update(id, updateRecordingDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recording' })
  @ApiResponse({ status: 200, description: 'Recording deleted successfully' })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<void> {
    return this.recordingsService.remove(id, req.user.id);
  }
}
