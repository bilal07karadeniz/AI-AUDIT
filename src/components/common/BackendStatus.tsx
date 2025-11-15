import React, { useState, useEffect } from 'react';
import { checkBackendHealth, API_CONFIG } from '../../config/api';
import { AlertCircle, CheckCircle, Loader, XCircle } from 'lucide-react';

type Status = 'checking' | 'online' | 'offline' | 'error';

interface BackendStatusProps {
  showDetails?: boolean;
  autoCheck?: boolean;
  checkInterval?: number;
  onStatusChange?: (status: Status) => void;
}

/**
 * Backend Status Component
 * Displays the current status of the backend API server
 */
export function BackendStatus({
  showDetails = false,
  autoCheck = true,
  checkInterval = 30000, // 30 seconds
  onStatusChange
}: BackendStatusProps) {
  const [status, setStatus] = useState<Status>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isManualChecking, setIsManualChecking] = useState(false);

  const checkStatus = async () => {
    try {
      const isOnline = await checkBackendHealth();
      const newStatus: Status = isOnline ? 'online' : 'offline';
      setStatus(newStatus);
      setLastCheck(new Date());

      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      setStatus('error');
      setLastCheck(new Date());

      if (onStatusChange) {
        onStatusChange('error');
      }
    } finally {
      setIsManualChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkStatus();

    // Set up interval if autoCheck is enabled
    if (autoCheck) {
      const interval = setInterval(checkStatus, checkInterval);
      return () => clearInterval(interval);
    }
  }, [autoCheck, checkInterval]);

  const handleManualCheck = async () => {
    setIsManualChecking(true);
    await checkStatus();
  };

  const getStatusIcon = () => {
    if (isManualChecking || status === 'checking') {
      return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
    }

    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Loader className="w-4 h-4 animate-spin text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (isManualChecking) return 'Checking...';

    switch (status) {
      case 'checking':
        return 'Checking backend...';
      case 'online':
        return 'Backend Online';
      case 'offline':
        return 'Backend Offline';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'offline':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'error':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (!showDetails) {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-sm font-semibold">{getStatusText()}</h3>
            {lastCheck && (
              <p className="text-xs mt-1 opacity-75">
                Last checked: {lastCheck.toLocaleTimeString()}
              </p>
            )}
            <p className="text-xs mt-1 opacity-75">
              Endpoint: {API_CONFIG.baseUrl}
            </p>
          </div>
        </div>

        <button
          onClick={handleManualCheck}
          disabled={isManualChecking}
          className="text-xs px-3 py-1 rounded bg-white/50 hover:bg-white/80 transition-colors disabled:opacity-50"
        >
          Check Now
        </button>
      </div>

      {status === 'offline' && (
        <div className="mt-3 pt-3 border-t border-current/20">
          <p className="text-sm font-medium">Troubleshooting Steps:</p>
          <ul className="mt-2 text-xs space-y-1 list-disc list-inside">
            <li>Ensure the backend server is running: <code className="bg-black/10 px-1 py-0.5 rounded">npm run server:dev</code></li>
            <li>Check if the server is accessible at {API_CONFIG.baseUrl}</li>
            <li>Verify your .env configuration in the server directory</li>
            <li>Check console for detailed error messages</li>
          </ul>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-3 pt-3 border-t border-current/20">
          <p className="text-sm">
            Unable to connect to backend. Please check your network connection and ensure the backend server is running.
          </p>
        </div>
      )}

      {status === 'online' && (
        <div className="mt-3 pt-3 border-t border-current/20">
          <p className="text-xs">
            All systems operational. Backend API is responding normally.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact backend status indicator
 */
export function BackendStatusDot() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const isOnline = await checkBackendHealth();
        setStatus(isOnline ? 'online' : 'offline');
      } catch {
        setStatus('error');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const getColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'error':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'online':
        return 'Backend Online';
      case 'offline':
        return 'Backend Offline';
      case 'error':
        return 'Connection Error';
      default:
        return 'Checking...';
    }
  };

  return (
    <div className="inline-flex items-center space-x-2" title={getLabel()}>
      <div className={`w-2 h-2 rounded-full ${getColor()} ${status === 'checking' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-gray-600">{getLabel()}</span>
    </div>
  );
}
