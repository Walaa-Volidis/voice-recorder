import { io, Socket } from 'socket.io-client';
import { authService } from './auth';

export interface ChunkUploadedEvent {
  recordingId: number;
  chunkOrder: number;
  totalChunks: number;
  progress: number;
}

export interface RecordingCompletedEvent {
  recordingId: number;
  timestamp: string;
}

export interface RecordingDeletedEvent {
  recordingId: number;
  timestamp: string;
}

export interface RecordingStatusUpdateEvent {
  recordingId: number;
  status: string;
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(): void {
    if (this.socket && this.isConnected) {
      return;
    }

    const token = authService.getToken();
    if (!token) {
      console.error('No token found, cannot connect to WebSocket');
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    this.socket = io(`${API_URL}/audio`, {
      auth: {
        token: token,
      },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.socket.on('connected', (data) => {
      console.log('WebSocket connection confirmed:', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinRecording(recordingId: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_recording', { recordingId });
    }
  }

  leaveRecording(recordingId: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_recording', { recordingId });
    }
  }

  onChunkUploaded(callback: (data: ChunkUploadedEvent) => void): void {
    if (this.socket) {
      this.socket.on('chunk_uploaded', callback);
    }
  }

  onRecordingCompleted(
    callback: (data: RecordingCompletedEvent) => void
  ): void {
    if (this.socket) {
      this.socket.on('recording_completed', callback);
    }
  }

  onRecordingDeleted(callback: (data: RecordingDeletedEvent) => void): void {
    if (this.socket) {
      this.socket.on('recording_deleted', callback);
    }
  }

  onRecordingStatusUpdate(
    callback: (data: RecordingStatusUpdateEvent) => void
  ): void {
    if (this.socket) {
      this.socket.on('recording_status_update', callback);
    }
  }

  offChunkUploaded(callback: (data: ChunkUploadedEvent) => void): void {
    if (this.socket) {
      this.socket.off('chunk_uploaded', callback);
    }
  }

  offRecordingCompleted(
    callback: (data: RecordingCompletedEvent) => void
  ): void {
    if (this.socket) {
      this.socket.off('recording_completed', callback);
    }
  }

  offRecordingDeleted(callback: (data: RecordingDeletedEvent) => void): void {
    if (this.socket) {
      this.socket.off('recording_deleted', callback);
    }
  }

  offRecordingStatusUpdate(
    callback: (data: RecordingStatusUpdateEvent) => void
  ): void {
    if (this.socket) {
      this.socket.off('recording_status_update', callback);
    }
  }

  isConnectedToSocket(): boolean {
    return this.isConnected;
  }
}

export const webSocketService = new WebSocketService();
