'use client';

import { useState, useRef, useCallback } from 'react';
import { recordingsService } from '../lib/recordings';

export interface UseAudioRecorderOptions {
  onChunkUploaded?: (chunkOrder: number, totalChunks: number) => void;
  onRecordingCompleted?: (recordingId: number) => void;
  onError?: (error: string) => void;
  chunkSizeMS?: number; // Chunk size in milliseconds
}

export interface AudioRecorderState {
  isRecording: boolean;
  isProcessing: boolean;
  recordingTime: number;
  recordingId: number | null;
  uploadProgress: number;
  error: string | null;
}

export const useAudioRecorder = (options: UseAudioRecorderOptions = {}) => {
  const {
    onChunkUploaded,
    onRecordingCompleted,
    onError,
    chunkSizeMS = 5000, // 5 seconds chunks
  } = options;

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isProcessing: false,
    recordingTime: 0,
    recordingId: null,
    uploadProgress: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const chunkOrderRef = useRef(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(
    async (title: string, description?: string) => {
      try {
        setState((prev) => ({ ...prev, error: null, isProcessing: true }));

        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // Create new recording in the backend
        const recording = await recordingsService.createRecording({
          title,
          description,
          audioFormat: 'webm',
          totalChunks: 0, // Will be updated when recording stops
        });

        setState((prev) => ({
          ...prev,
          recordingId: recording.id,
          isProcessing: false,
          isRecording: true,
          recordingTime: 0,
          uploadProgress: 0,
        }));

        // Initialize MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm',
        });

        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        chunkOrderRef.current = 0;

        // Handle data available event
        mediaRecorder.ondataavailable = async (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);

            // Upload chunk to backend
            try {
              await recordingsService.uploadChunk(
                recording.id,
                event.data,
                chunkOrderRef.current,
                'audio/webm'
              );

              chunkOrderRef.current++;
              onChunkUploaded?.(chunkOrderRef.current - 1, 0); // Total chunks unknown yet
            } catch (error) {
              console.error('Error uploading chunk:', error);
              onError?.('Failed to upload audio chunk');
            }
          }
        };

        // Handle recording stop
        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());

          // Update recording with total chunks
          try {
            setState((prev) => {
              const duration = Math.floor(prev.recordingTime / 1000);
              recordingsService.updateRecording(recording.id, { duration });
              return prev;
            });

            onRecordingCompleted?.(recording.id);
          } catch (error) {
            console.error('Error finalizing recording:', error);
            onError?.('Failed to finalize recording');
          }
        };

        // Start recording
        mediaRecorder.start();

        // Set up chunk timer (record in chunks)
        chunkTimerRef.current = setInterval(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            mediaRecorder.start();
          }
        }, chunkSizeMS);

        // Set up recording timer
        recordingTimerRef.current = setInterval(() => {
          setState((prev) => ({
            ...prev,
            recordingTime: prev.recordingTime + 1000,
          }));
        }, 1000);
      } catch (error) {
        console.error('Error starting recording:', error);
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: 'Failed to start recording',
        }));
        onError?.('Failed to start recording');
      }
    },
    [chunkSizeMS, onChunkUploaded, onRecordingCompleted, onError]
  );

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isRecording: false,
      isProcessing: true,
    }));
  }, []);

  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.pause();
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'paused'
    ) {
      mediaRecorderRef.current.resume();
    }

    // Restart timers
    recordingTimerRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        recordingTime: prev.recordingTime + 1000,
      }));
    }, 1000);

    chunkTimerRef.current = setInterval(() => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === 'recording'
      ) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.start();
      }
    }, chunkSizeMS);
  }, [chunkSizeMS]);

  const resetRecording = useCallback(() => {
    setState({
      isRecording: false,
      isProcessing: false,
      recordingTime: 0,
      recordingId: null,
      uploadProgress: 0,
      error: null,
    });

    chunksRef.current = [];
    chunkOrderRef.current = 0;
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  };
};
