import React from 'react';
import { DollarSign, Clock, MapPin, TrendingUp, Info } from 'lucide-react';

interface PriceBreakdownProps {
  breakdown: {
    basePrice: number;
    distanceFee: number;
    urgencyFee: number;
    serviceFee: number;
    total: number;
    distance: number;
    urgencyMultiplier: number;
    distanceRate: number;
    serviceFeePercentage: number;
  };
  urgencyLevel: string;
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({ breakdown, urgencyLevel }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-semibold text-lg flex items-center">
          <DollarSign className="w-5 h-5 text-[#0021A5] mr-1" />
          Price Breakdown
        </h3>
        <span className="text-lg font-bold">${breakdown.total.toFixed(2)}</span>
      </div>

      <div className="space-y-3">
        {/* Base Price */}
        <div className="flex items-start justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <div>
            <div className="font-medium">Base Price</div>
            <div className="text-sm text-gray-500">Standard task rate</div>
          </div>
          <span className="font-medium">${breakdown.basePrice.toFixed(2)}</span>
        </div>

        {/* Distance Fee */}
        <div className="flex items-start justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <div>
            <div className="font-medium flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-gray-500" />
              Distance Fee
            </div>
            <div className="text-sm text-gray-500">
              {breakdown.distance.toFixed(1)} miles (${breakdown.distanceRate}/0.5mi)
            </div>
          </div>
          <span className="font-medium">${breakdown.distanceFee.toFixed(2)}</span>
        </div>

        {/* Urgency Fee */}
        <div className="flex items-start justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <div>
            <div className="font-medium flex items-center">
              <Clock className="w-4 h-4 mr-1 text-gray-500" />
              Urgency Fee
            </div>
            <div className="text-sm text-gray-500">
              {urgencyLevel} priority (×{breakdown.urgencyMultiplier})
            </div>
          </div>
          <span className="font-medium">${breakdown.urgencyFee.toFixed(2)}</span>
        </div>

        {/* Service Fee */}
        <div className="flex items-start justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <div>
            <div className="font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-1 text-gray-500" />
              Service Fee
            </div>
            <div className="text-sm text-gray-500">
              {breakdown.serviceFeePercentage}% platform fee
            </div>
          </div>
          <span className="font-medium">${breakdown.serviceFee.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-start text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
          <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-blue-500" />
          <p>
            The service fee supports platform maintenance and helps keep the Hustl community thriving.
            Distance fees are calculated in 0.5-mile increments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceBreakdown;