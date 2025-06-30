import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Check, Smartphone, QrCode } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { walletService } from '../lib/walletService';
import { auth } from '../lib/firebase';
import { 
  CreditCardIcon, 
  VenmoIcon, 
  CashAppIcon, 
  ApplePayIcon 
} from './PaymentMethodIcons';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface AddFundsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100];

const AddFundsForm = ({ onClose, onSuccess }: AddFundsModalProps) => {
  const [amount, setAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'applepay' | 'venmo' | 'cashapp'>('card');
  const [showQRCode, setShowQRCode] = useState(false);
  const [cardholderName, setCardholderName] = useState('');
  
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalAmount = useCustomAmount ? parseFloat(customAmount) : amount;
    
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (paymentMethod === 'venmo' || paymentMethod === 'cashapp') {
      setShowQRCode(true);
      return;
    }
    
    setLoading(true);
    setCardError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      if (paymentMethod === 'card') {
        if (!stripe || !elements) {
          throw new Error('Stripe has not been properly initialized');
        }
        
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error('Card element not found');
        }
        
        if (!cardholderName.trim()) {
          throw new Error('Please enter the cardholder name');
        }
        
        // For demo purposes, we'll simulate adding funds directly to wallet
        await walletService.addFundsToWallet(finalAmount);
        
        toast.success(`$${finalAmount.toFixed(2)} added to your wallet`);
        onSuccess();
      } else if (paymentMethod === 'applepay') {
        if (!stripe) {
          throw new Error('Stripe has not been properly initialized');
        }
        
        // Check if Apple Pay is available
        const canUseApplePay = await stripe.canMakePayment({
          applePay: true
        });
        
        if (!canUseApplePay) {
          throw new Error('Apple Pay is not available on this device or browser');
        }
        
        // For demo purposes, simulate Apple Pay success
        await walletService.addFundsToWallet(finalAmount);
        toast.success(`$${finalAmount.toFixed(2)} added to your wallet via Apple Pay`);
        onSuccess();
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setCardError(error.message || 'An error occurred during payment');
      toast.error(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : null);
  };
  
  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setUseCustomAmount(false);
  };
  
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setUseCustomAmount(true);
  };

  const getQRValue = () => {
    const finalAmount = useCustomAmount ? parseFloat(customAmount) : amount;
    if (paymentMethod === 'venmo') {
      return `venmo://paycharge?txn=pay&recipients=hustl&amount=${finalAmount}&note=Wallet%20Deposit`;
    } else {
      return `https://cash.app/$hustl/${finalAmount}`;
    }
  };
  
  if (showQRCode) {
    return (
      <div className="space-y-6 text-center">
        <div className="bg-gray-50 p-6 rounded-lg">
          <QRCodeSVG
            value={getQRValue()}
            size={200}
            level="H"
            className="mx-auto"
          />
        </div>
        <p className="text-gray-700">
          Scan with {paymentMethod === 'venmo' ? 'Venmo' : 'Cash App'} to add funds
        </p>
        <p className="text-sm text-gray-500">
          After completing the payment, your wallet will be updated within a few minutes
        </p>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setShowQRCode(false)}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#0021A5] text-white px-4 py-2 rounded-lg hover:bg-[#001B8C] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Amount
        </label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {PRESET_AMOUNTS.map((presetAmount) => (
            <button
              key={presetAmount}
              type="button"
              onClick={() => handleAmountSelect(presetAmount)}
              className={`py-2 px-4 rounded-lg border ${
                amount === presetAmount && !useCustomAmount
                  ? 'bg-[#0021A5] text-white border-[#0021A5]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              ${presetAmount}
            </button>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            value={useCustomAmount ? customAmount : ''}
            onChange={handleCustomAmountChange}
            placeholder="Custom amount"
            className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-[#0021A5] focus:border-[#0021A5]"
            min="1"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`py-3 px-4 rounded-lg border flex flex-col items-center justify-center transition-colors ${
              paymentMethod === 'card'
                ? 'bg-[#0021A5] text-white border-[#0021A5]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <CreditCardIcon className="w-6 h-6 mb-1" />
            <span className="text-sm">Card</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('applepay')}
            className={`py-3 px-4 rounded-lg border flex flex-col items-center justify-center transition-colors ${
              paymentMethod === 'applepay'
                ? 'bg-[#0021A5] text-white border-[#0021A5]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ApplePayIcon className="w-6 h-6 mb-1" />
            <span className="text-sm">Apple Pay</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('venmo')}
            className={`py-3 px-4 rounded-lg border flex flex-col items-center justify-center transition-colors ${
              paymentMethod === 'venmo'
                ? 'bg-[#0021A5] text-white border-[#0021A5]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <VenmoIcon className="w-6 h-6 mb-1" />
            <span className="text-sm">Venmo</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('cashapp')}
            className={`py-3 px-4 rounded-lg border flex flex-col items-center justify-center transition-colors ${
              paymentMethod === 'cashapp'
                ? 'bg-[#0021A5] text-white border-[#0021A5]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <CashAppIcon className="w-6 h-6 mb-1" />
            <span className="text-sm">Cash App</span>
          </button>
        </div>
      </div>

      {paymentMethod === 'card' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Name on card"
              className="w-full rounded-lg border border-gray-300 p-2 focus:ring-[#0021A5] focus:border-[#0021A5]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Details
            </label>
            <div className="p-3 border border-gray-300 rounded-lg focus-within:ring-1 focus-within:ring-[#0021A5] focus-within:border-[#0021A5]">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                  hidePostalCode: true
                }}
                onChange={handleCardChange}
              />
            </div>
            {cardError && (
              <p className="mt-1 text-sm text-red-600">{cardError}</p>
            )}
          </div>
        </>
      )}

      {paymentMethod === 'applepay' && (
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <ApplePayIcon className="w-12 h-12 mx-auto mb-2" />
          <p className="text-gray-700 mb-2">Pay with Apple Pay</p>
          <p className="text-sm text-gray-500">
            You'll be prompted to confirm payment with Face ID, Touch ID, or your passcode
          </p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading || !stripe || !elements || (useCustomAmount && (!customAmount || parseFloat(customAmount) <= 0)) || (paymentMethod === 'card' && !cardholderName.trim())}
          className="flex-1 bg-[#0021A5] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#001B8C] transition duration-200 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <DollarSign className="w-5 h-5 mr-2" />
              {paymentMethod === 'venmo' || paymentMethod === 'cashapp' ? 'Continue' : 'Add Funds'}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const AddFundsModal: React.FC<AddFundsModalProps> = (props) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <DollarSign className="w-6 h-6 text-[#0021A5] mr-2" />
            Add Funds to Wallet
          </h2>
          <button onClick={props.onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <Elements stripe={stripePromise}>
            <AddFundsForm {...props} />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default AddFundsModal;