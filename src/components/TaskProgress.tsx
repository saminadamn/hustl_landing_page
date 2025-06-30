import React from 'react';
import { Check, Clock, Package, Bike, MapPin, Flag, User } from 'lucide-react';

interface ProgressUpdate {
  id: string;
  status: string;
  notes?: string;
  created_at: any;
}

interface TaskProgressProps {
  progressUpdates: ProgressUpdate[];
  taskStatus: string;
}

const PROGRESS_STEPS = [
  { key: 'accepted', label: 'Task Accepted', icon: Check, description: 'Helper has accepted your task' },
  { key: 'picked_up', label: 'Picked Up', icon: Package, description: 'Items have been collected' },
  { key: 'in_progress', label: 'In Progress', icon: Clock, description: 'Task is being worked on' },
  { key: 'on_way', label: 'On the Way', icon: Bike, description: 'Helper is heading to delivery location' },
  { key: 'delivered', label: 'Delivered', icon: Flag, description: 'Task has been delivered' },
  { key: 'completed', label: 'Completed', icon: Check, description: 'Task has been completed and verified' }
];

const TaskProgress: React.FC<TaskProgressProps> = ({ progressUpdates, taskStatus }) => {
  // Find the latest progress update to determine current step
  const getLatestProgressStatus = () => {
    if (progressUpdates.length === 0) return taskStatus;
    return progressUpdates[progressUpdates.length - 1].status;
  };

  const currentStatus = getLatestProgressStatus();
  const currentStepIndex = PROGRESS_STEPS.findIndex(step => step.key === currentStatus);

  // Create a map of status to progress update for easy lookup
  const progressMap = progressUpdates.reduce((acc, update) => {
    acc[update.status] = update;
    return acc;
  }, {} as Record<string, ProgressUpdate>);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="font-semibold text-lg mb-6 flex items-center">
        <Clock className="w-5 h-5 text-[#0021A5] mr-2" />
        Task Progress Timeline
      </h3>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Progress Steps */}
        <div className="space-y-8">
          {PROGRESS_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const progressUpdate = progressMap[step.key];
            const hasUpdate = !!progressUpdate;

            return (
              <div key={step.key} className="relative flex items-start">
                {/* Step Icon */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[#0021A5] border-[#0021A5] text-white shadow-lg'
                      : isCurrent
                      ? 'bg-blue-50 border-[#0021A5] text-[#0021A5] animate-pulse'
                      : 'bg-gray-50 border-gray-300 text-gray-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Step Content */}
                <div className="ml-6 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium text-lg ${
                      isCompleted 
                        ? 'text-[#0021A5]' 
                        : isCurrent
                        ? 'text-[#0021A5]'
                        : 'text-gray-500'
                    }`}>
                      {step.label}
                    </h4>
                    
                    {hasUpdate && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTimestamp(progressUpdate.created_at)}
                      </div>
                    )}
                  </div>
                  
                  <p className={`text-sm mt-1 ${
                    isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {step.description}
                  </p>

                  {/* Show notes if available */}
                  {hasUpdate && progressUpdate.notes && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border-l-4 border-[#0021A5]">
                      <p className="text-sm text-gray-700 italic">
                        "{progressUpdate.notes}"
                      </p>
                    </div>
                  )}

                  {/* Current step indicator */}
                  {isCurrent && (
                    <div className="mt-2 flex items-center text-sm text-[#0021A5] font-medium">
                      <div className="w-2 h-2 bg-[#0021A5] rounded-full mr-2 animate-pulse"></div>
                      Current Status
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <User className="w-5 h-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Progress Updates: {progressUpdates.length}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {progressUpdates.length > 0 && (
              <>Last updated: {formatTimestamp(progressUpdates[progressUpdates.length - 1]?.created_at)}</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskProgress;