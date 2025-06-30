import React from 'react';
import { X, MapPin, ExternalLink } from 'lucide-react';

interface FoodLocation {
  name: string;
  address: string;
  coords: { lat: number; lng: number };
  logo?: string;
}

interface FoodLocationModalProps {
  locations: FoodLocation[];
  onClose: () => void;
  onSelectLocation: (location: FoodLocation) => void;
  title: string;
}

const FoodLocationModal: React.FC<FoodLocationModalProps> = ({ 
  locations, 
  onClose, 
  onSelectLocation,
  title
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#002B7F] to-[#0038FF] text-white rounded-t-xl">
          <h2 className="text-xl font-bold">{title}</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(80vh-4rem)]">
          {locations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No locations available</p>
            </div>
          ) : (
            <div className="p-2">
              {locations.map((location, index) => (
                <div 
                  key={index}
                  onClick={() => onSelectLocation(location)}
                  className="flex items-center p-4 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors border border-gray-100 m-2 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden mr-4 border border-gray-200 shadow-sm">
                    {location.logo ? (
                      <img 
                        src={location.logo} 
                        alt={location.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{location.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{location.address}</p>
                  </div>
                  
                  <div className="ml-2 p-2 rounded-full bg-blue-50 text-[#0038FF] hover:bg-blue-100 transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodLocationModal;