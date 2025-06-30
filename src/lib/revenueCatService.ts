import { captureException } from './sentryUtils';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  period: 'monthly' | 'yearly' | 'weekly' | 'lifetime';
  features: string[];
}

class RevenueCatService {
  private apiKey: string;
  private isInitialized: boolean = false;
  
  constructor() {
    // Initialize with the API key
    this.apiKey = 'strp_PrivcvaDyhWGBrdNYYjiaSiVaya';
  }
  
  /**
   * Initialize the RevenueCat SDK
   */
  initialize(): void {
    if (this.isInitialized) return;
    
    try {
      // In a real implementation, this would initialize the RevenueCat SDK
      // For this demo, we'll just mark it as initialized
      this.isInitialized = true;
      console.log('RevenueCat SDK initialized with API key:', this.apiKey);
    } catch (error) {
      console.error('Failed to initialize RevenueCat SDK:', error);
      captureException(error, {
        tags: { component: "RevenueCatService", action: "initialize" }
      });
    }
  }
  
  /**
   * Get available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      // In a real implementation, this would fetch plans from RevenueCat
      // For this demo, we'll return mock data
      return [
        {
          id: 'hustl_premium_monthly',
          name: 'Hustl Premium',
          description: 'Unlock all premium features',
          price: '$4.99',
          period: 'monthly',
          features: [
            'No service fees',
            'Priority task matching',
            'Advanced analytics',
            'Premium support'
          ]
        },
        {
          id: 'hustl_premium_yearly',
          name: 'Hustl Premium (Yearly)',
          description: 'Save 20% with annual billing',
          price: '$47.99',
          period: 'yearly',
          features: [
            'No service fees',
            'Priority task matching',
            'Advanced analytics',
            'Premium support',
            '20% discount'
          ]
        },
        {
          id: 'hustl_pro',
          name: 'Hustl Pro',
          description: 'For power users and frequent helpers',
          price: '$9.99',
          period: 'monthly',
          features: [
            'All Premium features',
            'Unlimited task creation',
            'Verified Pro badge',
            'Dedicated support line',
            'Early access to new features'
          ]
        }
      ];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      captureException(error, {
        tags: { component: "RevenueCatService", action: "getSubscriptionPlans" }
      });
      throw error;
    }
  }
  
  /**
   * Check if user has an active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      // In a real implementation, this would check with RevenueCat
      // For this demo, we'll return a mock value
      return false;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      captureException(error, {
        tags: { component: "RevenueCatService", action: "hasActiveSubscription" }
      });
      return false;
    }
  }
  
  /**
   * Get user's current subscription details
   */
  async getCurrentSubscription(userId: string): Promise<any> {
    try {
      // In a real implementation, this would fetch from RevenueCat
      // For this demo, we'll return null (no subscription)
      return null;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      captureException(error, {
        tags: { component: "RevenueCatService", action: "getCurrentSubscription" }
      });
      return null;
    }
  }
  
  /**
   * Purchase a subscription
   */
  async purchaseSubscription(planId: string): Promise<boolean> {
    try {
      // In a real implementation, this would initiate the purchase flow with RevenueCat
      // For this demo, we'll just log the attempt and return success
      console.log(`Attempting to purchase plan: ${planId}`);
      return true;
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      captureException(error, {
        tags: { component: "RevenueCatService", action: "purchaseSubscription" }
      });
      throw error;
    }
  }
  
  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<boolean> {
    try {
      // In a real implementation, this would restore purchases with RevenueCat
      // For this demo, we'll just log the attempt and return success
      console.log('Attempting to restore purchases');
      return true;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      captureException(error, {
        tags: { component: "RevenueCatService", action: "restorePurchases" }
      });
      throw error;
    }
  }
}

export const revenueCatService = new RevenueCatService();