import React, { useState } from 'react';
import { X, Zap, Star, Lock, CreditCard } from 'lucide-react';
import { revenueCatService } from '../lib/revenueCatService';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';
import { StarBorder } from './ui/star-border';
import SubscriptionPlans from './SubscriptionPlans';

interface PremiumFeatureModalProps {
  featureName: string;
  description: string;
  onClose: () => void;
  onSubscribe?: () => void;
}

const PremiumFeatureModal: React.FC<PremiumFeatureModalProps> = ({
  featureName,
  description,
  onClose,
  onSubscribe
}) => {
  const [loading, setLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  const handleViewPlans = () => {
    setShowPlans(true);
  };

  const handleSubscriptionComplete = () => {
    setShowPlans(false);
    if (onSubscribe) {
      onSubscribe();
    }
    onClose();
  };

  return (
    <>
      {showPlans ? (
        <SubscriptionPlans onClose={() => setShowPlans(false)} />
      ) : (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <Lock className="w-6 h-6 mr-2" />
                  Premium Feature
                </h2>
                <button onClick={onClose} className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-center mb-2">{featureName}</h3>
              <p className="text-gray-600 text-center mb-6">{description}</p>

              <div className="bg-blue-50 p-4 rounded-xl mb-6">
                <h4 className="font-medium text-blue-800 mb-2">Hustl Premium Benefits:</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-700">No service fees on tasks</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-700">Priority task matching</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-700">Advanced analytics and insights</span>
                  </li>
                  <li className="flex items-start">
                    <Star className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-700">Exclusive premium features</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <StarBorder color="#0038FF">
                  <button
                    onClick={handleViewPlans}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    View Premium Plans
                  </button>
                </StarBorder>

                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PremiumFeatureModal;