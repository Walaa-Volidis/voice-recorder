'use client';

import { useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface VoiceRecorderProps {
  onRecordingComplete: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { state, startRecording, stopRecording, resetRecording } =
    useAudioRecorder({
      onRecordingCompleted: (recordingId) => {
        console.log('Recording completed:', recordingId);
        onRecordingComplete();
        resetRecording();
        setShowForm(false);
        setTitle('');
        setDescription('');
      },
      onError: (error) => {
        console.error('Recording error:', error);
      },
    });

  const handleStartRecording = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your recording');
      return;
    }

    try {
      await startRecording(title, description);
      setShowForm(false);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (state.isRecording) {
    return (
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-red-500 rounded-full"></div>
            </div>
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-background px-2 py-1 rounded text-sm font-medium">
            Recording...
          </div>
        </div>

        <div className="text-3xl font-mono font-bold">
          {formatTime(state.recordingTime)}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Recording: {title}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={stopRecording}
            className="btn btn-destructive btn-lg"
            disabled={state.isProcessing}
          >
            {state.isProcessing ? 'Processing...' : 'Stop Recording'}
          </button>
        </div>

        {state.error && (
          <div className="text-destructive text-sm p-3 bg-destructive/10 rounded">
            {state.error}
          </div>
        )}
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="label">
              Recording Title *
            </label>
            <input
              id="title"
              type="text"
              className="input mt-1"
              placeholder="Enter recording title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description (optional)
            </label>
            <textarea
              id="description"
              className="textarea mt-1"
              placeholder="Enter recording description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setShowForm(false)}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={handleStartRecording}
            className="btn btn-primary"
            disabled={!title.trim() || state.isProcessing}
          >
            {state.isProcessing ? 'Starting...' : 'Start Recording'}
          </button>
        </div>

        {state.error && (
          <div className="text-destructive text-sm p-3 bg-destructive/10 rounded">
            {state.error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <div className="w-32 h-32 mx-auto bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-primary"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Ready to Record</h3>
        <p className="text-sm text-muted-foreground">
          Click the button below to start a new voice recording
        </p>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="btn btn-primary btn-lg"
      >
        New Recording
      </button>
    </div>
  );
};

export default VoiceRecorder;
