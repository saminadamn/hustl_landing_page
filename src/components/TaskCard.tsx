import React from 'react';
import { Clock, MapPin, DollarSign, User, Star } from 'lucide-react';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    location: string;
    estimated_time: string;
    price: number;
    creator?: {
      full_name: string;
      avatar_url?: string;
    };
    distance?: number;
    status?: string;
  };
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    return distance < 1 ? `${(distance * 1000).toFixed(0)}m away` : `${distance.toFixed(1)}mi away`;
  };

  return (
    <div 
      className="task-card cursor-pointer touch-target"
      onClick={onClick}
    >
      <div className="task-card-header"></div>
      <div className="task-card-body">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-gray-900 mobile-text-base">{task.title}</h3>
          <span className="text-xl font-bold text-[#0038FF] mobile-text-lg">${task.price}</span>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{task.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1 text-gray-400" />
            <span>{task.estimated_time}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
            <span className="truncate max-w-[150px]">{task.location.split(',')[0]}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {task.creator?.avatar_url ? (
              <img
                src={task.creator.avatar_url}
                alt={task.creator.full_name}
                className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0038FF] to-[#0021A5] flex items-center justify-center mr-2 text-white">
                <User className="w-4 h-4" />
              </div>
            )}
            <span className="text-sm font-medium">{task.creator?.full_name || 'Anonymous'}</span>
          </div>
          
          {task.distance !== undefined && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {formatDistance(task.distance)}
            </span>
          )}
          
          {task.status && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              task.status === 'open' ? 'bg-blue-100 text-blue-800' :
              task.status === 'accepted' ? 'bg-yellow-100 text-yellow-800' :
              task.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;