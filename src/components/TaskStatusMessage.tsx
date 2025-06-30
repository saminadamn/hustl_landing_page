import React from 'react';
import { CheckCircle, Package, Clock, Truck, Flag, AlertTriangle } from 'lucide-react';

interface TaskStatusMessageProps {
  status: string;
  notes?: string;
  timestamp: Date;
  userName?: string;
}

const TaskStatusMessage: React.FC<TaskStatusMessageProps> = ({ status, notes, timestamp, userName }) => {
  const formatStatus = (status: string): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTimestamp = (date: Date) => {
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', date);
      return 'Unknown time';
    }
    
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'picked_up':
        return <Package className="w-5 h-5 text-yellow-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'on_way':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <Flag className="w-5 h-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="flex justify-center my-4">
      <div className="bg-blue-50 rounded-lg px-4 py-2 inline-flex items-start shadow-sm border border-blue-100 max-w-md">
        {getStatusIcon()}
        <div className="ml-2">
          <p className="text-sm font-medium text-blue-800">
            {userName ? `${userName} updated status to ` : 'Status updated to '}
            <span className="font-bold">{formatStatus(status)}</span>
          </p>
          {notes && (
            <p className="text-xs text-blue-600 mt-1 italic">
              "{notes}"
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {formatTimestamp(timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskStatusMessage;