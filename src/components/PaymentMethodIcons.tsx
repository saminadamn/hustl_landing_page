import React from 'react';
import { CreditCard, Wallet } from 'lucide-react';

// Credit Card Icon - SVG
export const CreditCardIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <img 
    src="https://t4.ftcdn.net/jpg/04/06/75/39/360_F_406753914_SFSBhjhp6kbHblNiUFZ1MXHcuEKe7e7P.jpg" 
    alt="Credit/DebitCard" 
    className={`${className} object-contain`}
  />
);

// Wallet Icon - SVG
export const WalletIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <Wallet className={`${className} text-[#0021A5]`} />
);

// Venmo Icon - Image (you can replace this URL)
export const VenmoIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <img 
    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQl-I-bt88aHvMoL9iXz7jnJpSapWK2bJVX4g&s" 
    alt="Venmo" 
    className={`${className} object-contain`}
  />
);

// Cash App Icon - Image (you can replace this URL)
export const CashAppIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <img 
    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgVJxN1SaHWIAWT4MMjB-UhEvQtKN-HSnkfQ&s" 
    alt="Cash App" 
    className={`${className} object-contain`}
  />
);

// Apple Pay Icon - Image (you can replace this URL)
export const ApplePayIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <img 
    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWxYUQvdwKXZ9meVu4Jx6fr7nNNo99TLl-bA&s" 
    alt="Apple Pay" 
    className={`${className} object-contain`}
  />
);

// Stripe Icon - Image (you can replace this URL)
export const StripeIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <img 
    src="https://logos-world.net/wp-content/uploads/2021/03/Stripe-Logo.png" 
    alt="Stripe" 
    className={`${className} object-contain`}
  />
);

// PayPal Icon - Image (you can replace this URL)
export const PayPalIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <img 
    src="https://logos-world.net/wp-content/uploads/2020/07/PayPal-Logo.png" 
    alt="PayPal" 
    className={`${className} object-contain`}
  />
);

// Bank Transfer Icon - Image (you can replace this URL)
export const BankTransferIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <img 
    src="https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?auto=format&fit=crop&w=100&q=80" 
    alt="Bank Transfer" 
    className={`${className} object-contain rounded`}
  />
);

// Generic Payment Icon - Image (you can replace this URL)
export const GenericPaymentIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <img 
    src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=100&q=80" 
    alt="Payment" 
    className={`${className} object-contain rounded`}
  />
);