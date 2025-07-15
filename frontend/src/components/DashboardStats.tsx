'use client';

import { useEffect, useState } from 'react';
import { recordingsService, RecordingStats } from '../lib/recordings';

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<RecordingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await recordingsService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  if (isLoading) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Statistics</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Statistics</h3>
        <p className="text-muted-foreground">Failed to load statistics</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4">Statistics</h3>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Total Recordings
          </span>
          <span className="font-semibold">{stats.totalRecordings}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Duration</span>
          <span className="font-semibold">
            {formatDuration(stats.totalDuration)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Completed</span>
          <span className="font-semibold text-green-600">
            {stats.completedRecordings}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Pending</span>
          <span className="font-semibold text-yellow-600">
            {stats.pendingRecordings}
          </span>
        </div>

        {stats.totalRecordings > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-semibold">
                {Math.round(
                  (stats.completedRecordings / stats.totalRecordings) * 100
                )}
                %
              </span>
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (stats.completedRecordings / stats.totalRecordings) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardStats;
