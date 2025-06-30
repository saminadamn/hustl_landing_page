import React, { useState, useEffect } from 'react';
import { X, DollarSign, ArrowUpRight, ArrowDownRight, Clock, AlertTriangle, CreditCard, QrCode, Smartphone, Plus, Wallet, RefreshCw, ArrowDownLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import WalletBalanceDisplay from './WalletBalanceDisplay';
import PaymentMethodForm from './PaymentMethodForm';
import AddFundsModal from './AddFundsModal';
import WithdrawFundsModal from './WithdrawFundsModal';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { walletService } from '../lib/walletService';
import { transactionService, paymentMethodService } from '../lib/database';
import { auth } from '../lib/firebase';
import { 
  CreditCardIcon, 
  VenmoIcon, 
  CashAppIcon, 
  ApplePayIcon,
  WalletIcon 
} from './PaymentMethodIcons';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface WalletModalProps {
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ onClose }) => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [recentChange, setRecentChange] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState<'overview' | 'payment-methods' | 'transactions'>('overview');

  useEffect(() => {
    loadWalletData();
    
    // Subscribe to wallet updates
    const unsubscribe = walletService.subscribeToWalletUpdates((newBalance) => {
      const change = newBalance - balance;
      setBalance(newBalance);
      if (change !== 0) {
        setRecentChange(change);
      }
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Get wallet balance
      const walletBalance = await walletService.getBalance();
      setBalance(walletBalance);

      // Get current user
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Get payment methods and transactions
      const [methods, recentTransactions] = await Promise.all([
        paymentMethodService.getUserPaymentMethods(user.uid),
        transactionService.getUserTransactions(user.uid, 10)
      ]);

      setPaymentMethods(methods || []);
      setTransactions(recentTransactions || []);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      toast.error('Error loading wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultPayment = async (methodId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      await paymentMethodService.setDefaultPaymentMethod(user.uid, methodId);
      await loadWalletData();
      toast.success('Default payment method updated');
    } catch (error) {
      console.error('Error updating default payment method:', error);
      toast.error('Error updating payment method');
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    try {
      await paymentMethodService.deletePaymentMethod(methodId);
      await loadWalletData();
      toast.success('Payment method removed');
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error('Error removing payment method');
    }
  };

  const refreshWalletData = async () => {
    setRefreshing(true);
    try {
      await loadWalletData();
      toast.success('Wallet data refreshed');
    } catch (error) {
      console.error('Error refreshing wallet data:', error);
      toast.error('Error refreshing data');
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCardIcon className="w-5 h-5 mr-2" />;
      case 'venmo':
        return <VenmoIcon className="w-5 h-5 mr-2" />;
      case 'cashapp':
        return <CashAppIcon className="w-5 h-5 mr-2" />;
      case 'applepay':
        return <ApplePayIcon className="w-5 h-5 mr-2" />;
      default:
        return <CreditCardIcon className="w-5 h-5 mr-2" />;
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
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <WalletIcon className="w-6 h-6 mr-2" />
            Your Wallet
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'overview'
                  ? 'text-[#002B7F] border-b-2 border-[#002B7F]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('payment-methods')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'payment-methods'
                  ? 'text-[#002B7F] border-b-2 border-[#002B7F]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Payment Methods
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'transactions'
                  ? 'text-[#002B7F] border-b-2 border-[#002B7F]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Transactions
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002B7F]"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Balance Display */}
                  <WalletBalanceDisplay balance={balance} recentChange={recentChange} />

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowAddFunds(true)}
                      className="bg-[#002B7F] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#0038FF] transition duration-200 flex items-center justify-center shadow-sm"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Funds
                    </button>
                    <button
                      onClick={() => setShowWithdraw(true)}
                      className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition duration-200 flex items-center justify-center"
                    >
                      <ArrowDownLeft className="w-5 h-5 mr-2" />
                      Withdraw
                    </button>
                  </div>

                  {/* Recent Transactions */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Recent Transactions</h3>
                      <button
                        onClick={() => setActiveTab('transactions')}
                        className="text-[#002B7F] hover:text-[#0038FF] text-sm"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-2">
                      {transactions.slice(0, 3).map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(transaction.created_at)}
                            </p>
                          </div>
                          <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'credit' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {transactions.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          <Clock className="w-6 h-6 mx-auto mb-2" />
                          <p>No transactions yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Methods Summary */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Payment Methods</h3>
                      <button
                        onClick={() => setActiveTab('payment-methods')}
                        className="text-[#002B7F] hover:text-[#0038FF] text-sm"
                      >
                        Manage
                      </button>
                    </div>
                    <div className="space-y-2">
                      {paymentMethods.slice(0, 2).map((method) => (
                        <div
                          key={method.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center">
                            {getPaymentMethodIcon(method.type)}
                            <div>
                              <p className="font-medium">
                                {getPaymentMethodLabel(method)}
                              </p>
                              {method.is_default && (
                                <span className="text-xs text-green-600">Default</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {paymentMethods.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          <CreditCard className="w-6 h-6 mx-auto mb-2" />
                          <p>No payment methods added yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payment-methods' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Payment Methods</h3>
                    <button
                      onClick={() => setShowAddPayment(true)}
                      className="text-[#002B7F] hover:text-[#0038FF] text-sm font-medium"
                    >
                      + Add New
                    </button>
                  </div>

                  {showAddPayment ? (
                    <Elements stripe={stripePromise}>
                      <PaymentMethodForm
                        onSuccess={() => {
                          setShowAddPayment(false);
                          loadWalletData();
                        }}
                        onCancel={() => setShowAddPayment(false)}
                      />
                    </Elements>
                  ) : (
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center">
                            {getPaymentMethodIcon(method.type)}
                            <div>
                              <p className="font-medium">
                                {getPaymentMethodLabel(method)}
                              </p>
                              {method.is_default && (
                                <span className="text-xs text-green-600">Default</span>
                              )}
                              {method.details?.cardholder_name && (
                                <p className="text-xs text-gray-500">
                                  {method.details.cardholder_name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            {!method.is_default && (
                              <button
                                onClick={() => handleSetDefaultPayment(method.id)}
                                className="text-sm text-[#002B7F] hover:text-[#0038FF]"
                              >
                                Make Default
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePaymentMethod(method.id)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}

                      {paymentMethods.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <CreditCard className="w-8 h-8 mx-auto mb-2" />
                          <p>No payment methods added yet</p>
                          <button
                            onClick={() => setShowAddPayment(true)}
                            className="mt-2 text-[#002B7F] hover:text-[#0038FF]"
                          >
                            Add a payment method
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'transactions' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Transaction History</h3>
                    <button
                      onClick={refreshWalletData}
                      disabled={refreshing}
                      className="text-[#002B7F] hover:text-[#0038FF] text-sm flex items-center"
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                  <div className="space-y-2">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                        <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'credit' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}

                    {transactions.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <Clock className="w-6 h-6 mx-auto mb-2" />
                        <p>No transactions yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showAddFunds && (
        <AddFundsModal
          onClose={() => setShowAddFunds(false)}
          onSuccess={() => {
            setShowAddFunds(false);
            loadWalletData();
          }}
        />
      )}

      {showWithdraw && (
        <WithdrawFundsModal
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => {
            setShowWithdraw(false);
            loadWalletData();
          }}
        />
      )}
    </div>
  );
};

export default WalletModal;