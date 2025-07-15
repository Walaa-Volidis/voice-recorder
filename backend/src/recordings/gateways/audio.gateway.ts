import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RecordingsService } from '../recordings.service';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  email?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/audio',
})
export class AudioGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('AudioGateway');

  constructor(
    private jwtService: JwtService,
    private recordingsService: RecordingsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Client attempted to connect without token');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.email = payload.email;

      this.logger.log(
        `Client connected: ${client.id} (User: ${payload.email})`,
      );

      // Join user to their personal room
      client.join(`user_${client.userId}`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to audio gateway',
        userId: client.userId,
      });
    } catch (error) {
      this.logger.error('Authentication failed:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_recording')
  handleJoinRecording(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recordingId: number },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const roomName = `recording_${data.recordingId}`;
    client.join(roomName);

    this.logger.log(`User ${client.userId} joined recording room: ${roomName}`);
    client.emit('joined_recording', { recordingId: data.recordingId });
  }

  @SubscribeMessage('leave_recording')
  handleLeaveRecording(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recordingId: number },
  ) {
    const roomName = `recording_${data.recordingId}`;
    client.leave(roomName);

    this.logger.log(`User ${client.userId} left recording room: ${roomName}`);
    client.emit('left_recording', { recordingId: data.recordingId });
  }

  @SubscribeMessage('recording_status')
  handleRecordingStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { recordingId: number; status: string },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Broadcast status to all clients in the recording room
    const roomName = `recording_${data.recordingId}`;
    this.server.to(roomName).emit('recording_status_update', {
      recordingId: data.recordingId,
      status: data.status,
      timestamp: new Date().toISOString(),
    });
  }

  // Method to notify clients about chunk upload progress
  notifyChunkUploaded(
    userId: number,
    recordingId: number,
    chunkOrder: number,
    totalChunks: number,
  ) {
    this.server.to(`user_${userId}`).emit('chunk_uploaded', {
      recordingId,
      chunkOrder,
      totalChunks,
      progress: totalChunks > 0 ? ((chunkOrder + 1) / totalChunks) * 100 : 0,
    });
  }

  // Method to notify clients about recording completion
  notifyRecordingCompleted(userId: number, recordingId: number) {
    this.server.to(`user_${userId}`).emit('recording_completed', {
      recordingId,
      timestamp: new Date().toISOString(),
    });
  }

  // Method to notify clients about recording deletion
  notifyRecordingDeleted(userId: number, recordingId: number) {
    this.server.to(`user_${userId}`).emit('recording_deleted', {
      recordingId,
      timestamp: new Date().toISOString(),
    });
  }
}
