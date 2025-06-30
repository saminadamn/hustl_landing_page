import React, { useState } from 'react';
import { CreditCard, QrCode, AlertTriangle, Smartphone } from 'lucide-react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentMethodService } from '../lib/database';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';
import { 
  CreditCardIcon, 
  VenmoIcon, 
  CashAppIcon, 
  ApplePayIcon 
} from './PaymentMethodIcons';

interface PaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ onSuccess, onCancel }) => {
  const [type, setType] = useState<'card' | 'venmo' | 'cashapp' | 'applepay'>('card');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      if (type === 'card') {
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
        
        // Create a payment method with Stripe
        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: cardholderName,
          }
        });
        
        if (error) {
          throw error;
        }
        
        // Save payment method to database
        await paymentMethodService.addPaymentMethod(user.uid, {
          type: 'card',
          details: {
            last4: paymentMethod.card?.last4,
            brand: paymentMethod.card?.brand,
            exp_month: paymentMethod.card?.exp_month,
            exp_year: paymentMethod.card?.exp_year,
            stripe_payment_method_id: paymentMethod.id,
            cardholder_name: cardholderName
          }
        });
      } else if (type === 'applepay') {
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
        
        // Save Apple Pay as a payment method
        await paymentMethodService.addPaymentMethod(user.uid, {
          type: 'applepay',
          details: {
            device_type: navigator.platform,
            browser: navigator.userAgent.split(' ').pop(),
            is_apple_pay_capable: true
          }
        });
      } else {
        // For Venmo and Cash App payment methods
        if (!username.trim()) {
          throw new Error(`Please enter your ${type} username`);
        }
        
        // Save payment method to database
        await paymentMethodService.addPaymentMethod(user.uid, {
          type,
          details: {
            username,
            verified: false
          }
        });
      }
      
      toast.success('Payment method added successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      setCardError(error.message || 'Error adding payment method');
      toast.error(error.message || 'Error adding payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : null);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('card')}
              className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-colors ${
                type === 'card'
                  ? 'border-[#002B7F] bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <CreditCardIcon className="w-8 h-8 mb-1" />
              <span className="text-sm font-medium">Credit Card</span>
            </button>
            
            <button
              type="button"
              onClick={() => setType('applepay')}
              className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-colors ${
                type === 'applepay'
                  ? 'border-[#002B7F] bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <ApplePayIcon className="w-8 h-8 mb-1" />
              <span className="text-sm font-medium">Apple Pay</span>
            </button>
            
            <button
              type="button"
              onClick={() => setType('venmo')}
              className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-colors ${
                type === 'venmo'
                  ? 'border-[#002B7F] bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <VenmoIcon className="w-8 h-8 mb-1" />
              <span className="text-sm font-medium">Venmo</span>
            </button>
            
            <button
              type="button"
              onClick={() => setType('cashapp')}
              className={`p-3 rounded-lg border flex flex-col items-center justify-center transition-colors ${
                type === 'cashapp'
                  ? 'border-[#002B7F] bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <CashAppIcon className="w-8 h-8 mb-1" />
              <span className="text-sm font-medium">Cash App</span>
            </button>
          </div>
        </div>

        {type === 'card' ? (
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
                className="w-full rounded-lg border-gray-300 p-2 border focus:ring-[#002B7F] focus:border-[#002B7F]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Details
              </label>
              <div className="p-3 border border-gray-300 rounded-lg focus-within:ring-1 focus-within:ring-[#002B7F] focus-within:border-[#002B7F]">
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
                <div className="mt-1 flex items-start text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span>{cardError}</span>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="save-card"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="h-4 w-4 text-[#002B7F] focus:ring-[#002B7F] border-gray-300 rounded"
              />
              <label htmlFor="save-card" className="ml-2 block text-sm text-gray-700">
                Save this card for future payments
              </label>
            </div>
          </>
        ) : type === 'applepay' ? (
          <div className="text-center py-4">
            <ApplePayIcon className="w-16 h-16 mx-auto mb-2" />
            <p className="text-gray-700 mb-2">Add Apple Pay to your wallet</p>
            <p className="text-sm text-gray-500">
              You'll be able to use Apple Pay for quick and secure payments
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'venmo' ? 'Venmo' : 'Cash App'} Username
            </label>
            <div className="relative">
              {type === 'venmo' ? (
                <VenmoIcon className="absolute left-3 top-2.5 w-5 h-5" />
              ) : (
                <CashAppIcon className="absolute left-3 top-2.5 w-5 h-5" />
              )}
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-12 w-full rounded-lg border-gray-300 p-2 border focus:ring-[#002B7F] focus:border-[#002B7F]"
                placeholder={`Enter your ${type === 'venmo' ? 'Venmo' : 'Cash App'} username`}
                required
              />
            </div>
            <div className="mt-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  {type === 'venmo' 
                    ? "Enter your Venmo username without the @ symbol. We'll send you a verification request to confirm your account."
                    : "Enter your Cash App $Cashtag including the $ symbol. We'll send you a verification request to confirm your account."}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <button
            type="submit"
            disabled={loading || (type === 'card' && (!stripe || !elements || !cardholderName.trim()))}
            className="flex-1 bg-[#002B7F] text-white px-4 py-2 rounded-lg hover:bg-[#0038FF] transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                {type === 'card' ? (
                  <CreditCardIcon className="w-5 h-5 mr-2" />
                ) : type === 'applepay' ? (
                  <ApplePayIcon className="w-5 h-5 mr-2" />
                ) : type === 'venmo' ? (
                  <VenmoIcon className="w-5 h-5 mr-2" />
                ) : (
                  <CashAppIcon className="w-5 h-5 mr-2" />
                )}
                Add Payment Method
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentMethodForm;
