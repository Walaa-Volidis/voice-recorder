import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AudioChunk } from './audio-chunk.entity';

@Entity('recordings')
export class Recording {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  duration: number; // Duration in seconds

  @Column({ default: 'pending' })
  status: string; // 'pending', 'processing', 'completed', 'failed'

  @Column({ nullable: true })
  audioFormat?: string; // 'webm', 'wav', etc.

  @Column({ type: 'int', default: 0 })
  totalChunks: number;

  @Column({ type: 'int', default: 0 })
  uploadedChunks: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Many recordings belong to one user
  @ManyToOne(() => User, (user) => user.recordings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  // One recording has many audio chunks
  @OneToMany(() => AudioChunk, (chunk) => chunk.recording, { cascade: true })
  audioChunks: AudioChunk[];
}
