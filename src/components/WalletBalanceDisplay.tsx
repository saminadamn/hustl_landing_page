import React from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface WalletBalanceDisplayProps {
  balance: number;
  recentChange?: number;
}

const WalletBalanceDisplay: React.FC<WalletBalanceDisplayProps> = ({ balance, recentChange }) => {
  return (
    <div className="bg-gradient-to-r from-[#002B7F] to-[#0038FF] text-white rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium opacity-90">Available Balance</h3>
        <DollarSign className="w-5 h-5 opacity-75" />
      </div>
      
      <div className="flex items-baseline">
        <span className="text-3xl font-bold">${balance.toFixed(2)}</span>
        {recentChange && (
          <div className={`ml-3 flex items-center text-sm ${
            recentChange >= 0 ? 'text-green-300' : 'text-red-300'
          }`}>
            {recentChange >= 0 ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            ${Math.abs(recentChange).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletBalanceDisplay;