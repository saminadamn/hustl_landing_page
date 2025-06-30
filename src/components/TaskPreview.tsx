import React from 'react';
import { Clock, MapPin, DollarSign, Tag, X } from 'lucide-react';
import { calculateTaskPrice } from '../lib/priceCalculator';
import { Location } from '../lib/locationService';

interface TaskPreviewProps {
  task: any;
  currentLocation: Location | null;
  onClose: () => void;
}

const TaskPreview: React.FC<TaskPreviewProps> = ({ task, currentLocation, onClose }) => {
  const [priceBreakdown, setPriceBreakdown] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    calculatePrice();
  }, [task, currentLocation]);

  const calculatePrice = async () => {
    if (!task?.location_coords || !currentLocation) return;

    try {
      setLoading(true);
      const breakdown = await calculateTaskPrice(
        task.location_coords,
        currentLocation,
        'low', // Default to low urgency for preview
        false
      );
      setPriceBreakdown(breakdown);
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-md mx-auto">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{task.title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-gray-600">{task.description}</p>

        <div className="flex items-center text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{task.location}</span>
        </div>

        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>{task.estimated_time}</span>
        </div>

        <div className="flex items-center text-gray-600">
          <Tag className="w-4 h-4 mr-2" />
          <span className="capitalize">{task.category.replace(/_/g, ' ')}</span>
        </div>

        {loading ? (
          <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
        ) : (
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-[#0021A5]" />
              <span className="font-semibold text-[#0021A5]">
                Starting from ${priceBreakdown?.total.toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {priceBreakdown?.distance.toFixed(1)} miles away
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskPreview;