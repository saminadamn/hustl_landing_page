import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Zap, Star, Award, Shield, Loader, CreditCard, RefreshCw, Crown, Clock, DollarSign, Users, MessageSquare } from 'lucide-react';
import { revenueCatService } from '../lib/revenueCatService';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';
import { StarBorder } from './ui/star-border';

interface SubscriptionPlansProps {
  onClose: () => void;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  period: 'monthly' | 'yearly' | 'weekly' | 'lifetime';
  features: string[];
  popular?: boolean;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ onClose }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [restoring, setRestoring] = useState(false);
  const planRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    loadPlans();
    
    // Add entrance animations with staggered delay
    const timer = setTimeout(() => {
      const cards = document.querySelectorAll('.plan-card');
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add('animate-in');
        }, index * 150);
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      
      // Initialize RevenueCat service
      revenueCatService.initialize();
      
      // Define our updated pricing plans
      const subscriptionPlans: SubscriptionPlan[] = [
        {
          id: 'hustl_free',
          name: 'Free Plan',
          description: 'Basic features for casual users',
          price: '$0',
          period: 'monthly',
          features: [
            'Create up to 5 tasks per month',
            'Accept unlimited tasks',
            'Basic task tracking',
            'Standard support'
          ]
        },
        {
          id: 'hustl_premium_monthly',
          name: 'Hustl Premium',
          description: 'Enhanced features for regular users',
          price: '$3.99',
          period: 'monthly',
          popular: true,
          features: [
            'No service fees (save 15%)',
            'Unlimited task creation',
            'Priority task matching',
            'Premium badge on profile',
            'Advanced analytics',
            'Priority support'
          ]
        },
        {
          id: 'hustl_premium_yearly',
          name: 'Hustl Premium',
          description: 'Save with annual billing',
          price: '$39.99',
          period: 'yearly',
          features: [
            'All monthly premium features',
            'Save over 16% vs monthly',
            'Premium badge on profile',
            'Advanced analytics',
            'Priority support',
            'Early access to new features'
          ]
        },
        {
          id: 'hustl_pro',
          name: 'Hustl Pro',
          description: 'For power users and businesses',
          price: '$7.99',
          period: 'monthly',
          features: [
            'All Premium features',
            'Pro badge on profile',
            'Dedicated account manager',
            'API access',
            'Custom branding options',
            'Business analytics dashboard',
            '24/7 priority support'
          ]
        }
      ];
      
      setPlans(subscriptionPlans);
      
      // Check if user has an active subscription
      const user = auth.currentUser;
      if (user) {
        const subscription = await revenueCatService.getCurrentSubscription(user.uid);
        setCurrentSubscription(subscription);
      }
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId: string) => {
    try {
      setPurchasing(true);
      setSelectedPlan(planId);
      
      const success = await revenueCatService.purchaseSubscription(planId);
      
      if (success) {
        toast.success('Subscription purchased successfully!');
        
        // Reload subscription status
        const user = auth.currentUser;
        if (user) {
          const subscription = await revenueCatService.getCurrentSubscription(user.uid);
          setCurrentSubscription(subscription);
        }
      }
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      toast.error('Failed to purchase subscription');
    } finally {
      setPurchasing(false);
      setSelectedPlan(null);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setRestoring(true);
      
      const success = await revenueCatService.restorePurchases();
      
      if (success) {
        toast.success('Purchases restored successfully!');
        
        // Reload subscription status
        const user = auth.currentUser;
        if (user) {
          const subscription = await revenueCatService.getCurrentSubscription(user.uid);
          setCurrentSubscription(subscription);
        }
      } else {
        toast.error('No previous purchases found');
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      toast.error('Failed to restore purchases');
    } finally {
      setRestoring(false);
    }
  };

  const getPlanIcon = (plan: SubscriptionPlan) => {
    if (plan.id === 'hustl_free') {
      return <Users className="w-6 h-6 text-gray-500" />;
    } else if (plan.id.includes('premium')) {
      return <Star className="w-6 h-6 text-yellow-400" />;
    } else if (plan.id.includes('pro')) {
      return <Crown className="w-6 h-6 text-purple-500" />;
    } else {
      return <Shield className="w-6 h-6 text-blue-500" />;
    }
  };

  // Find the maximum number of features across all plans
  const maxFeatures = Math.max(...plans.map(plan => plan.features.length));

  // Ensure all plans have the same number of features for alignment
  const normalizedPlans = plans.map(plan => {
    const paddedFeatures = [...plan.features];
    while (paddedFeatures.length < maxFeatures) {
      paddedFeatures.push('');
    }
    return {
      ...plan,
      features: paddedFeatures
    };
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center">
              <Zap className="w-6 h-6 mr-2" />
              Hustl Premium Plans
            </h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="mt-2 text-blue-100">
            Upgrade your Hustl experience with premium features and benefits
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0038FF]"></div>
            </div>
          ) : (
            <>
              {currentSubscription && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-800">Active Subscription</h3>
                      <p className="text-green-700">
                        You're currently subscribed to {currentSubscription.planName}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        Next billing date: {new Date(currentSubscription.expirationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {normalizedPlans.map((plan, planIndex) => (
                  <div 
                    key={plan.id} 
                    ref={el => planRefs.current[plan.id] = el}
                    className={`plan-card opacity-0 translate-y-8 transition-all duration-500 ease-out ${
                      plan.popular ? 'border-2 border-yellow-400 relative' : 'border border-gray-200'
                    } rounded-xl overflow-hidden bg-white shadow-lg`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-yellow-400 text-[#0038FF] px-3 py-1 font-bold text-xs transform rotate-0 shadow-md">
                          MOST POPULAR
                        </div>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 rounded-full ${
                          plan.id === 'hustl_free' ? 'bg-gray-100' :
                          plan.id.includes('premium') ? 'bg-yellow-100' :
                          'bg-purple-100'
                        } flex items-center justify-center mr-3`}>
                          {getPlanIcon(plan)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{plan.name}</h3>
                          <p className="text-sm text-gray-500">{plan.period}</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 h-12">{plan.description}</p>
                      
                      <div className="text-3xl font-bold mb-6 flex items-baseline">
                        {plan.price}
                        <span className="text-sm text-gray-500 ml-1">
                          /{plan.period === 'lifetime' ? 'one-time' : plan.period === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>
                      
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className={`flex items-start ${!feature ? 'invisible' : ''}`}>
                            {feature && (
                              <>
                                <Check className={`w-5 h-5 ${
                                  plan.id === 'hustl_free' ? 'text-gray-500' :
                                  plan.id.includes('premium') ? 'text-yellow-500' :
                                  'text-purple-500'
                                } mr-2 flex-shrink-0 mt-0.5`} />
                                <span className="text-sm">{feature}</span>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-auto">
                        {plan.id === 'hustl_free' ? (
                          <button
                            className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 transform hover:-translate-y-1"
                          >
                            Current Plan
                          </button>
                        ) : (
                          <StarBorder color={plan.id.includes('premium') ? "#FFB800" : "#8B5CF6"}>
                            <button
                              onClick={() => handlePurchase(plan.id)}
                              disabled={purchasing || !!currentSubscription}
                              className={`w-full ${
                                plan.id.includes('premium') 
                                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                                  : 'bg-gradient-to-r from-purple-500 to-purple-600'
                              } text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center`}
                            >
                              {purchasing && selectedPlan === plan.id ? (
                                <Loader className="w-5 h-5 animate-spin" />
                              ) : currentSubscription ? (
                                'Current Plan'
                              ) : (
                                <>
                                  <CreditCard className="w-5 h-5 mr-2" />
                                  Subscribe
                                </>
                              )}
                            </button>
                          </StarBorder>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={handleRestorePurchases}
                  disabled={restoring}
                  className="text-[#0038FF] hover:text-[#0021A5] font-medium flex items-center mx-auto"
                >
                  {restoring ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Restore Previous Purchases
                </button>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center mb-2">
                    <DollarSign className="w-5 h-5 text-[#0038FF] mr-2" />
                    <h4 className="font-medium">Save on Service Fees</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Premium members save 15% on every transaction by eliminating service fees.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 text-[#0038FF] mr-2" />
                    <h4 className="font-medium">Priority Matching</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get matched with helpers faster with priority placement in the task feed.
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center mb-2">
                    <MessageSquare className="w-5 h-5 text-[#0038FF] mr-2" />
                    <h4 className="font-medium">Premium Support</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get priority support with dedicated assistance for all your questions.
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 p-4 rounded-xl text-sm text-gray-600">
                <p className="mb-2">
                  Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period.
                </p>
                <p>
                  You can manage your subscriptions in your account settings after purchase.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;