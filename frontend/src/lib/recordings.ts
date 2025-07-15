import api from './api';

export interface Recording {
  id: number;
  title: string;
  description?: string;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioFormat?: string;
  totalChunks: number;
  uploadedChunks: number;
  createdAt: string;
  updatedAt: string;
  userId: number;
}

export interface CreateRecordingDto {
  title: string;
  description?: string;
  audioFormat?: string;
  totalChunks?: number;
}

export interface UpdateRecordingDto {
  title?: string;
  description?: string;
  duration?: number;
}

export interface RecordingStats {
  totalRecordings: number;
  totalDuration: number;
  completedRecordings: number;
  pendingRecordings: number;
}

export const recordingsService = {
  async createRecording(data: CreateRecordingDto): Promise<Recording> {
    const response = await api.post<Recording>('/recordings', data);
    return response.data;
  },

  async getRecordings(): Promise<Recording[]> {
    const response = await api.get<Recording[]>('/recordings');
    return response.data;
  },

  async getRecording(id: number): Promise<Recording> {
    const response = await api.get<Recording>(`/recordings/${id}`);
    return response.data;
  },

  async updateRecording(
    id: number,
    data: UpdateRecordingDto
  ): Promise<Recording> {
    const response = await api.patch<Recording>(`/recordings/${id}`, data);
    return response.data;
  },

  async deleteRecording(id: number): Promise<void> {
    await api.delete(`/recordings/${id}`);
  },

  async uploadChunk(
    recordingId: number,
    chunk: Blob,
    chunkOrder: number,
    mimeType?: string
  ): Promise<{ success: boolean; message: string }> {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkOrder', chunkOrder.toString());
    if (mimeType) {
      formData.append('mimeType', mimeType);
    }

    const response = await api.post(
      `/recordings/${recordingId}/chunks`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  async getAudioStream(recordingId: number): Promise<string> {
    const response = await api.get(`/recordings/${recordingId}/stream`, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  },

  async getStats(): Promise<RecordingStats> {
    const response = await api.get<RecordingStats>('/recordings/stats');
    return response.data;
  },
};
