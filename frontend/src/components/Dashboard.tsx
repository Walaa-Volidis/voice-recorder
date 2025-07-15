'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { recordingsService, Recording } from '../lib/recordings';
import { webSocketService } from '../lib/websocket';
import VoiceRecorder from './VoiceRecorder';
import RecordingsList from './RecordingsList';
import DashboardStats from './DashboardStats';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleRecordingCompleted = (data: { recordingId: number }) => {
      console.log('Recording completed:', data);
      loadRecordings(); // Refresh the recordings list
    };

    const handleRecordingDeleted = (data: { recordingId: number }) => {
      console.log('Recording deleted:', data);
      setRecordings((prev) => prev.filter((r) => r.id !== data.recordingId));
    };

    const setupWebSocketListeners = () => {
      webSocketService.onRecordingCompleted(handleRecordingCompleted);
      webSocketService.onRecordingDeleted(handleRecordingDeleted);
    };

    loadRecordings();
    setupWebSocketListeners();

    return () => {
      // Cleanup WebSocket listeners
      webSocketService.offRecordingCompleted(handleRecordingCompleted);
      webSocketService.offRecordingDeleted(handleRecordingDeleted);
    };
  }, []);

  const loadRecordings = async () => {
    try {
      setIsLoading(true);
      const data = await recordingsService.getRecordings();
      setRecordings(data);
    } catch (error) {
      console.error('Error loading recordings:', error);
      setError('Failed to load recordings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewRecording = () => {
    loadRecordings(); // Refresh the recordings list
  };

  const handleDeleteRecording = async (recordingId: number) => {
    try {
      await recordingsService.deleteRecording(recordingId);
      setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
    } catch (error) {
      console.error('Error deleting recording:', error);
      setError('Failed to delete recording');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Voice Recorder</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user?.firstName || user?.email}
              </p>
            </div>
            <button onClick={handleLogout} className="btn btn-outline btn-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Recorder */}
          <div className="lg:col-span-2">
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Record New Audio</h2>
              <VoiceRecorder onRecordingComplete={handleNewRecording} />
            </div>

            {/* Recordings List */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Your Recordings</h2>
              {error && (
                <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 rounded">
                  {error}
                </div>
              )}
              <RecordingsList
                recordings={recordings}
                onDelete={handleDeleteRecording}
                onRefresh={loadRecordings}
              />
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <DashboardStats />

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={loadRecordings}
                  className="btn btn-secondary w-full"
                >
                  Refresh Recordings
                </button>
                <button
                  onClick={() => setError('')}
                  className="btn btn-outline w-full"
                >
                  Clear Errors
                </button>
              </div>
            </div>

            {/* Connection Status */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Connection Status</h3>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    webSocketService.isConnectedToSocket()
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-sm">
                  {webSocketService.isConnectedToSocket()
                    ? 'Connected'
                    : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
