import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recording } from './entities/recording.entity';
import { AudioChunk } from './entities/audio-chunk.entity';
import { CreateRecordingDto } from './dto/create-recording.dto';
import { UpdateRecordingDto } from './dto/update-recording.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { AudioGateway } from './gateways/audio.gateway';

@Injectable()
export class RecordingsService {
  constructor(
    @InjectRepository(Recording)
    private recordingsRepository: Repository<Recording>,
    @InjectRepository(AudioChunk)
    private audioChunksRepository: Repository<AudioChunk>,
    @Inject(forwardRef(() => AudioGateway))
    private audioGateway: AudioGateway,
  ) {}

  async create(
    createRecordingDto: CreateRecordingDto,
    userId: number,
  ): Promise<Recording> {
    const recording = this.recordingsRepository.create({
      ...createRecordingDto,
      userId,
      status: 'pending',
    });

    return this.recordingsRepository.save(recording);
  }

  async findAll(userId: number): Promise<Recording[]> {
    return this.recordingsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'title',
        'description',
        'duration',
        'status',
        'audioFormat',
        'totalChunks',
        'uploadedChunks',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async findOne(id: number, userId: number): Promise<Recording> {
    const recording = await this.recordingsRepository.findOne({
      where: { id, userId },
      relations: ['audioChunks'],
    });

    if (!recording) {
      throw new NotFoundException(`Recording with ID ${id} not found`);
    }

    return recording;
  }

  async update(
    id: number,
    updateRecordingDto: UpdateRecordingDto,
    userId: number,
  ): Promise<Recording> {
    const recording = await this.findOne(id, userId);

    Object.assign(recording, updateRecordingDto);
    return this.recordingsRepository.save(recording);
  }

  async remove(id: number, userId: number): Promise<void> {
    const recording = await this.findOne(id, userId);
    await this.recordingsRepository.remove(recording);

    // Notify via WebSocket about recording deletion
    this.audioGateway.notifyRecordingDeleted(userId, id);
  }

  async uploadChunk(
    recordingId: number,
    chunkData: Buffer,
    uploadChunkDto: UploadChunkDto,
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    const recording = await this.findOne(recordingId, userId);

    // Check if chunk already exists
    const existingChunk = await this.audioChunksRepository.findOne({
      where: {
        recordingId,
        chunkOrder: uploadChunkDto.chunkOrder,
      },
    });

    if (existingChunk) {
      throw new BadRequestException(
        `Chunk ${uploadChunkDto.chunkOrder} already exists`,
      );
    }

    // Create and save chunk
    const audioChunk = this.audioChunksRepository.create({
      recordingId,
      chunkOrder: uploadChunkDto.chunkOrder,
      chunkData,
      chunkSize: chunkData.length,
      mimeType: uploadChunkDto.mimeType,
    });

    await this.audioChunksRepository.save(audioChunk);

    // Update recording's uploaded chunks count
    recording.uploadedChunks += 1;

    // If all chunks are uploaded, mark as completed
    if (
      recording.totalChunks > 0 &&
      recording.uploadedChunks >= recording.totalChunks
    ) {
      recording.status = 'completed';

      // Notify via WebSocket that recording is completed
      this.audioGateway.notifyRecordingCompleted(userId, recordingId);
    }

    await this.recordingsRepository.save(recording);

    // Notify via WebSocket about chunk upload progress
    this.audioGateway.notifyChunkUploaded(
      userId,
      recordingId,
      uploadChunkDto.chunkOrder,
      recording.totalChunks,
    );

    return {
      success: true,
      message: `Chunk ${uploadChunkDto.chunkOrder} uploaded successfully`,
    };
  }

  async getAudioStream(recordingId: number, userId: number): Promise<Buffer> {
    const recording = await this.findOne(recordingId, userId);

    if (recording.status !== 'completed') {
      throw new BadRequestException('Recording is not yet completed');
    }

    // Get all chunks in order
    const chunks = await this.audioChunksRepository.find({
      where: { recordingId },
      order: { chunkOrder: 'ASC' },
    });

    if (chunks.length === 0) {
      throw new NotFoundException('No audio chunks found for this recording');
    }

    // Combine all chunks into one buffer
    const buffers = chunks.map((chunk) => chunk.chunkData);
    return Buffer.concat(buffers);
  }

  async getRecordingStats(userId: number): Promise<{
    totalRecordings: number;
    totalDuration: number;
    completedRecordings: number;
    pendingRecordings: number;
  }> {
    const recordings = await this.recordingsRepository.find({
      where: { userId },
    });

    return {
      totalRecordings: recordings.length,
      totalDuration: recordings.reduce((sum, r) => sum + Number(r.duration), 0),
      completedRecordings: recordings.filter((r) => r.status === 'completed')
        .length,
      pendingRecordings: recordings.filter((r) => r.status === 'pending')
        .length,
    };
  }
}
