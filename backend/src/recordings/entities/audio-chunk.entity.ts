import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Recording } from './recording.entity';

@Entity('audio_chunks')
@Index(['recordingId', 'chunkOrder'], { unique: true }) // Ensure unique chunk order per recording
export class AudioChunk {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  chunkOrder: number; // Order of the chunk in the recording (0, 1, 2, ...)

  @Column({ type: 'longblob' })
  chunkData: Buffer; // Binary audio data

  @Column({ type: 'int' })
  chunkSize: number; // Size in bytes

  @Column({ nullable: true })
  mimeType?: string; // e.g., 'audio/webm', 'audio/wav'

  @CreateDateColumn()
  createdAt: Date;

  // Many chunks belong to one recording
  @ManyToOne(() => Recording, (recording) => recording.audioChunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recordingId' })
  recording: Recording;

  @Column()
  recordingId: number;
}
