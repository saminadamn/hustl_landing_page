import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, DollarSign, CreditCard, Shield, AlertTriangle, Smartphone, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { auth } from '../lib/firebase';

interface StripeCheckoutProps {
  taskId: string;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

// Initialize Stripe with the publishable key from environment variables
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : Promise.reject(new Error('Stripe publishable key is not configured'));

const CheckoutForm = ({ taskId, amount, onClose, onSuccess }: StripeCheckoutProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'applepay' | 'venmo' | 'cashapp'>('card');
  const [showQRCode, setShowQRCode] = useState(false);
  
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    // Verify Stripe configuration on mount
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      setError('Stripe is not properly configured');
      toast.error('Payment system is currently unavailable');
    }
  }, []);

  const handleCardPayment = async () => {
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
    
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to make a payment');
    }

    // For demo purposes, simulate successful payment
    // In a real implementation, you would create a payment intent on your server
    toast.success('Payment processed successfully (demo mode)');
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const handleApplePayment = async () => {
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
    
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to make a payment');
    }

    // For demo purposes, simulate Apple Pay success
    toast.success('Apple Pay payment processed successfully (demo mode)');
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const handleMobilePayment = async () => {
    // For Venmo and Cash App, we'll show a QR code
    setShowQRCode(true);
    
    // In a real implementation, you would:
    // 1. Create a payment intent on the server
    // 2. Generate a deep link or QR code for the mobile payment app
    // 3. Monitor the payment status and update the task when payment is complete
    
    // For this demo, we'll just show a QR code and simulate success
    setTimeout(() => {
      // Simulate payment verification
      toast.success('Payment verification would happen here');
      onSuccess();
    }, 5000);
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verify Stripe is properly initialized
      if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
        throw new Error('Stripe is not properly configured');
      }

      switch (paymentMethod) {
        case 'card':
          await handleCardPayment();
          break;
        case 'applepay':
          await handleApplePayment();
          break;
        case 'venmo':
        case 'cashapp':
          await handleMobilePayment();
          return; // Return early as we'll handle success in the mobile payment flow
        default:
          throw new Error('Invalid payment method');
      }

      toast.success('Payment successful!');
      onSuccess();
    } catch (error: any) {
      console.error('Checkout error:', error);
      setError(error.message || 'An error occurred during checkout');
      toast.error(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (event: any) => {
    setError(event.error ? event.error.message : null);
  };

  const getQRValue = () => {
    if (paymentMethod === 'venmo') {
      return `venmo://paycharge?txn=pay&recipients=hustl&amount=${amount}&note=Task%20Payment`;
    } else {
      return `https://cash.app/$hustl/${amount}`;
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
          Scan with {paymentMethod === 'venmo' ? 'Venmo' : 'Cash App'} to pay
        </p>
        <p className="text-sm text-gray-500">
          After completing the payment, your task will be activated automatically
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
            onClick={onSuccess}
            className="flex-1 bg-[#0021A5] text-white px-4 py-2 rounded-lg hover:bg-[#001B8C] transition-colors"
          >
            I've Paid
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <DollarSign className="w-12 h-12 text-[#0021A5] mx-auto mb-2" />
        <p className="text-2xl font-bold">${amount.toFixed(2)}</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
          <p className="text-sm text-blue-700">
            Your payment is protected. If there's any issue with the task, 
            our support team will help resolve it.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`py-2 px-4 rounded-lg border flex items-center justify-center ${
              paymentMethod === 'card'
                ? 'bg-[#0021A5] text-white border-[#0021A5]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Card
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('applepay')}
            className={`py-2 px-4 rounded-lg border flex items-center justify-center ${
              paymentMethod === 'applepay'
                ? 'bg-[#0021A5] text-white border-[#0021A5]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Apple Pay
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('venmo')}
            className={`py-2 px-4 rounded-lg border flex items-center justify-center ${
              paymentMethod === 'venmo'
                ? 'bg-[#0021A5] text-white border-[#0021A5]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Venmo
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('cashapp')}
            className={`py-2 px-4 rounded-lg border flex items-center justify-center ${
              paymentMethod === 'cashapp'
                ? 'bg-[#0021A5] text-white border-[#0021A5]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Cash App
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
              className="w-full rounded-lg border-gray-300 focus:ring-[#0021A5] focus:border-[#0021A5] p-2 border"
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
          </div>
        </>
      )}

      {paymentMethod === 'applepay' && (
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <Smartphone className="w-12 h-12 text-[#0021A5] mx-auto mb-2" />
          <p className="text-gray-700 mb-2">Pay with Apple Pay</p>
          <p className="text-sm text-gray-500">
            You'll be prompted to confirm payment with Face ID, Touch ID, or your passcode
          </p>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading || !!error || (paymentMethod === 'card' && (!stripe || !elements || !cardholderName.trim()))}
        className="w-full bg-[#0021A5] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#001B8C] transition duration-200 flex items-center justify-center disabled:opacity-50"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        ) : (
          <>
            {paymentMethod === 'card' ? (
              <CreditCard className="w-5 h-5 mr-2" />
            ) : paymentMethod === 'applepay' ? (
              <Smartphone className="w-5 h-5 mr-2" />
            ) : (
              <QrCode className="w-5 h-5 mr-2" />
            )}
            {paymentMethod === 'venmo' || paymentMethod === 'cashapp' ? 'Continue to Payment' : 'Pay Now'}
          </>
        )}
      </button>
    </div>
  );
};

const StripeCheckout: React.FC<StripeCheckoutProps> = (props) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Complete Payment</h2>
          <button onClick={props.onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm {...props} />
        </Elements>
      </div>
    </div>
  );
};

export default StripeCheckout;