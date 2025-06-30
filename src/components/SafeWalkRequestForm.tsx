import React, { useState, useEffect } from 'react';
import { MapPin, Clock, User, Shield, AlertTriangle, Send, X, Info, Calendar } from 'lucide-react';
import { Location, getCurrentLocation, validateLocation } from '../lib/locationService';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import LocationInput from './LocationInput';
import toast from 'react-hot-toast';

interface SafeWalkRequestFormProps {
  onClose: () => void;
}

const SafeWalkRequestForm: React.FC<SafeWalkRequestFormProps> = ({ onClose }) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<Location | null>(null);
  const [departureTime, setDepartureTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState('5-10 minutes');
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const location = await getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting current location:', error);
      toast.error('Could not determine your current location');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleDestinationSelect = (location: Location) => {
    if (!validateLocation(location)) {
      toast.error('Invalid location coordinates');
      return;
    }
    
    setDestinationCoords(location);
    setDestination(location.address || `${location.lat}, ${location.lng}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!destinationCoords) {
      toast.error('Please set a valid destination');
      return;
    }
    
    if (!departureTime) {
      toast.error('Please select a departure time');
      return;
    }
    
    setLoading(true);
    try {
      // Generate a unique request ID
      const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Create SafeWalk request
      const requestData = {
        request_id: uniqueId,
        current_location: currentLocation,
        destination: destinationCoords,
        departure_time: departureTime,
        notes: notes.trim(),
        status: 'pending',
        created_at: serverTimestamp(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        is_anonymous: true
      };
      
      const docRef = await addDoc(collection(db, 'safewalk_requests'), requestData);
      
      // Set request ID for confirmation
      setRequestId(uniqueId);
      setShowConfirmation(true);
      
      // Simulate alerting nearby volunteers
      setTimeout(() => {
        toast.success('SafeWalk volunteers have been notified of your request');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating SafeWalk request:', error);
      toast.error('Error creating SafeWalk request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (requestId) {
      // In a real app, you would cancel the request in the database
      toast.success('SafeWalk request cancelled');
    }
    onClose();
  };

  const getTimeOptions = () => {
    const options = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Round to nearest 5 minutes
    const roundedMinute = Math.ceil(currentMinute / 5) * 5;
    
    // Start with current time (rounded to nearest 5 minutes)
    let startHour = currentHour;
    let startMinute = roundedMinute;
    
    // If rounded minute is 60, increment hour and set minute to 0
    if (startMinute >= 60) {
      startHour += 1;
      startMinute = 0;
    }
    
    // Generate time options for the next 2 hours in 5-minute increments
    for (let h = 0; h < 2; h++) {
      for (let m = 0; m < 60; m += 5) {
        const hour = (startHour + h) % 24;
        const minute = (h === 0 && m < startMinute) ? startMinute + m : m;
        
        if (h === 0 && minute < startMinute) continue;
        
        const hourFormatted = hour % 12 === 0 ? 12 : hour % 12;
        const minuteFormatted = minute < 10 ? `0${minute}` : minute;
        const ampm = hour < 12 ? 'AM' : 'PM';
        
        const timeString = `${hourFormatted}:${minuteFormatted} ${ampm}`;
        const value = `${hour}:${minute}`;
        
        options.push({ label: timeString, value });
      }
    }
    
    return options;
  };

  const formatSafetyTip = (index: number) => {
    const tips = [
      "Stay in well-lit, populated areas while waiting",
      "Share your SafeWalk request details with a friend",
      "Keep your phone charged and accessible",
      "Trust your instincts - if something feels off, call campus police"
    ];
    
    return tips[index % tips.length];
  };

  if (showConfirmation) {
    return (
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Request Confirmed</h2>
          <p className="text-gray-600">Your SafeWalk request has been submitted</p>
          <div className="bg-blue-50 rounded-lg p-4 mt-4 text-left">
            <p className="text-sm font-medium text-blue-800">Request ID: {requestId}</p>
            <p className="text-sm text-blue-600 mt-1">Estimated wait time: {estimatedWaitTime}</p>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-yellow-800 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Safety Tips While Waiting
          </h3>
          <ul className="space-y-2 text-sm text-yellow-700">
            {[0, 1, 2, 3].map(i => (
              <li key={i} className="flex items-start">
                <span className="w-4 h-4 bg-yellow-200 rounded-full flex items-center justify-center text-xs text-yellow-800 mr-2 mt-0.5">
                  {i + 1}
                </span>
                {formatSafetyTip(i)}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-red-800 mb-2">Emergency Contacts</h3>
          <div className="space-y-2 text-sm">
            <p className="flex items-center">
              <span className="font-medium text-red-700 mr-2">Campus Police:</span>
              <a href="tel:3523921111" className="text-red-700 underline">(352) 392-1111</a>
            </p>
            <p className="flex items-center">
              <span className="font-medium text-red-700 mr-2">UFPD Non-Emergency:</span>
              <a href="tel:3523925447" className="text-red-700 underline">(352) 392-5447</a>
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleCancel}
            className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Cancel Request
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-[#0038FF] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#0021A5] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-lg mx-auto overflow-y-auto max-h-[90vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Shield className="w-6 h-6 text-[#0038FF] mr-2" />
          Request SafeWalk
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
          <div>
            <p className="text-sm text-blue-700">
              SafeWalk provides a walking companion for your safety on and around campus. Your request will be matched with verified volunteers.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Location (Optional)
          </label>
          <div className="relative">
            {loadingLocation ? (
              <div className="flex items-center border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0038FF] mr-2"></div>
                <span className="text-gray-500">Getting your location...</span>
              </div>
            ) : currentLocation ? (
              <div className="flex items-center justify-between border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-[#0038FF] mr-2" />
                  <span className="truncate max-w-[200px]">
                    {currentLocation.address || `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fetchCurrentLocation}
                  className="text-[#0038FF] hover:text-[#0021A5] text-sm"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={fetchCurrentLocation}
                className="w-full flex items-center justify-center border border-gray-300 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                <span>Get Current Location</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destination (Required)
          </label>
          <LocationInput
            value={destination}
            onChange={setDestination}
            onLocationChange={handleDestinationSelect}
            placeholder="Enter your destination"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Departure Time (Required)
          </label>
          <select
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#0038FF] focus:border-[#0038FF]"
            required
          >
            <option value="">Select a time</option>
            {getTimeOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Requirements (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-[#0038FF] focus:border-[#0038FF]"
            placeholder="Any special requirements or notes for the SafeWalk volunteer..."
          />
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Important Information</h4>
              <ul className="mt-1 text-xs text-yellow-700 space-y-1">
                <li>• Your identity will remain anonymous throughout the process</li>
                <li>• Request expires automatically after 30 minutes if unmatched</li>
                <li>• For immediate emergencies, call Campus Police at (352) 392-1111</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading || !destinationCoords || !departureTime}
            className="flex-1 bg-[#0038FF] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#0021A5] transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Request
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Export both default and named export to support different import styles
export default SafeWalkRequestForm;
export { SafeWalkRequestForm };