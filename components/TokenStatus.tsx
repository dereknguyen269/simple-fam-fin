import React, { useState, useEffect } from 'react';
import { getTokenTimeRemaining, shouldRefreshToken } from '../services/storageService';

/**
 * Token Status Debug Component
 * Shows current token status and time remaining
 * Useful for testing and debugging token refresh
 */
export const TokenStatus: React.FC<{ isConnected: boolean }> = ({ isConnected }) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [needsRefresh, setNeedsRefresh] = useState<boolean>(false);

  useEffect(() => {
    if (!isConnected) {
      setTimeRemaining(0);
      setNeedsRefresh(false);
      return;
    }

    const updateStatus = () => {
      const remaining = getTokenTimeRemaining();
      const shouldRefresh = shouldRefreshToken();

      setTimeRemaining(remaining);
      setNeedsRefresh(shouldRefresh);
    };

    // Update immediately
    updateStatus();

    // Update every second
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  if (!isConnected) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (): string => {
    if (timeRemaining === 0) return 'text-red-500';
    if (needsRefresh) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusText = (): string => {
    if (timeRemaining === 0) return 'Expired';
    if (needsRefresh) return 'Refreshing Soon';
    return 'Valid';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${needsRefresh ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
        <div>
          <div className="font-semibold text-gray-700 dark:text-gray-300">
            Token Status: <span className={getStatusColor()}>{getStatusText()}</span>
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            Time remaining: {formatTime(timeRemaining)}
          </div>
        </div>
      </div>
    </div>
  );
};
