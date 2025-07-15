'use client';

import { useState } from 'react';
import { Recording, recordingsService } from '../lib/recordings';

interface RecordingsListProps {
  recordings: Recording[];
  onDelete: (recordingId: number) => void;
  onRefresh: () => void;
}

const RecordingsList: React.FC<RecordingsListProps> = ({
  recordings,
  onDelete,
}) => {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [loadingAudio, setLoadingAudio] = useState<number | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handlePlayRecording = async (recordingId: number) => {
    if (playingId === recordingId) {
      setPlayingId(null);
      return;
    }

    try {
      setLoadingAudio(recordingId);
      const audioUrl = await recordingsService.getAudioStream(recordingId);

      // Create audio element and play
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        setPlayingId(null);
        setLoadingAudio(null);
        alert('Failed to play recording');
      };

      setPlayingId(recordingId);
      setLoadingAudio(null);
      audio.play();
    } catch (error) {
      console.error('Error playing recording:', error);
      setLoadingAudio(null);
      alert('Failed to play recording');
    }
  };

  const handleDeleteRecording = async (recordingId: number) => {
    if (confirm('Are you sure you want to delete this recording?')) {
      await onDelete(recordingId);
    }
  };

  if (recordings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">No recordings yet</h3>
        <p className="text-muted-foreground">
          Create your first voice recording to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recordings.map((recording) => (
        <div
          key={recording.id}
          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="font-semibold truncate">{recording.title}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    recording.status
                  )}`}
                >
                  {recording.status}
                </span>
              </div>

              {recording.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {recording.description}
                </p>
              )}

              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>{formatDate(recording.createdAt)}</span>
                <span>{formatDuration(recording.duration)}</span>
                <span>
                  {recording.uploadedChunks}/{recording.totalChunks} chunks
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {recording.status === 'completed' && (
                <button
                  onClick={() => handlePlayRecording(recording.id)}
                  disabled={loadingAudio === recording.id}
                  className="btn btn-outline btn-sm"
                >
                  {loadingAudio === recording.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : playingId === recording.id ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              )}

              <button
                onClick={() => handleDeleteRecording(recording.id)}
                className="btn btn-destructive btn-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecordingsList;
