import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, QrCode, Smartphone, ArrowDownLeft } from 'lucide-react';
import { walletService } from '../lib/walletService';
import { auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

interface WithdrawFundsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const WithdrawFundsModal: React.FC<WithdrawFundsModalProps> = ({ onClose, onSuccess }) => {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [withdrawalNote, setWithdrawalNote] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [methods, walletBalance] = await Promise.all([
        walletService.getPaymentMethods(),
        walletService.getBalance()
      ]);
      
      setPaymentMethods(methods);
      setBalance(walletBalance);
      
      // Set default payment method if available
      const defaultMethod = methods.find(m => m.is_default);
      if (defaultMethod) {
        setSelectedMethodId(defaultMethod.id);
      } else if (methods.length > 0) {
        setSelectedMethodId(methods[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (withdrawAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }
    
    if (!selectedMethodId) {
      toast.error('Please select a payment method');
      return;
    }
    
    setLoading(true);
    try {
      await walletService.requestWithdrawal(withdrawAmount, selectedMethodId);
      
      // Create a transaction record for the withdrawal
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, 'transactions'), {
          user_id: user.uid,
          amount: -withdrawAmount,
          type: 'debit',
          description: `Withdrawal request${withdrawalNote ? ': ' + withdrawalNote : ''}`,
          created_at: serverTimestamp()
        });
      }
      
      toast.success('Withdrawal request submitted successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      toast.error(error.message || 'Error requesting withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="w-5 h-5 text-[#0021A5]" />;
      case 'venmo':
      case 'cashapp':
        return <QrCode className="w-5 h-5 text-[#0021A5]" />;
      case 'applepay':
        return <Smartphone className="w-5 h-5 text-[#0021A5]" />;
      default:
        return <CreditCard className="w-5 h-5 text-[#0021A5]" />;
    }
  };

  const getPaymentMethodLabel = (method: any) => {
    switch (method.type) {
      case 'card':
        return `${method.details.brand?.toUpperCase() || 'Card'} •••• ${method.details.last4}`;
      case 'venmo':
        return `Venmo - ${method.details.username}`;
      case 'cashapp':
        return `Cash App - ${method.details.username}`;
      case 'applepay':
        return 'Apple Pay';
      default:
        return 'Unknown payment method';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <ArrowDownLeft className="w-6 h-6 text-[#0021A5] mr-2" />
            Withdraw Funds
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              Available Balance: <span className="font-bold">${balance.toFixed(2)}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Withdrawal Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                max={balance}
                className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-[#0021A5] focus:border-[#0021A5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            {paymentMethods.length > 0 ? (
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                      selectedMethodId === method.id
                        ? 'border-[#0021A5] bg-blue-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedMethodId === method.id}
                      onChange={() => setSelectedMethodId(method.id)}
                      className="h-4 w-4 text-[#0021A5] focus:ring-[#0021A5]"
                    />
                    <div className="ml-3 flex items-center">
                      {getPaymentMethodIcon(method.type)}
                      <span className="ml-2">{getPaymentMethodLabel(method)}</span>
                    </div>
                    {method.is_default && (
                      <span className="ml-auto text-xs text-green-600 font-medium">Default</span>
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border rounded-lg border-gray-300">
                <p className="text-gray-500">No payment methods available</p>
                <p className="text-sm text-[#0021A5] mt-1">
                  Please add a payment method first
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (Optional)
            </label>
            <textarea
              value={withdrawalNote}
              onChange={(e) => setWithdrawalNote(e.target.value)}
              placeholder="Add a note for this withdrawal"
              className="w-full rounded-lg border-gray-300 focus:ring-[#0021A5] focus:border-[#0021A5]"
              rows={2}
            />
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-700">
              Withdrawal requests are typically processed within 1-3 business days. You'll receive a notification when your withdrawal is complete.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !selectedMethodId || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
              className="w-full bg-[#0021A5] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#001B8C] transition duration-200 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <ArrowDownLeft className="w-5 h-5 mr-2" />
                  Request Withdrawal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawFundsModal;