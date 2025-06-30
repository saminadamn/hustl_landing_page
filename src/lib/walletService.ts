import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from './firebase';

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'venmo' | 'cashapp' | 'applepay';
  details: any;
  is_default: boolean;
  is_verified: boolean;
}

class WalletService {
  private _currentUnsubscribe: (() => void) | null = null;

  // Get wallet balance
  async getBalance(): Promise<number> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const walletDoc = await getDoc(doc(db, 'wallets', user.uid));
      
      if (!walletDoc.exists()) {
        // Create wallet if it doesn't exist
        await addDoc(collection(db, 'wallets'), {
          user_id: user.uid,
          balance: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
        
        return 0;
      }

      return walletDoc.data().balance || 0;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  // Get transaction history
  async getTransactions(limitCount = 10): Promise<Transaction[]> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const q = query(
        collection(db, 'transactions'),
        where('user_id', '==', user.uid),
        where('created_at', '<=', serverTimestamp())
      );
      
      const querySnapshot = await getDocs(q);
      
      const transactions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.() || data.created_at
        };
      });
      
      // Sort by created_at in descending order
      transactions.sort((a, b) => {
        const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
        const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
      
      return transactions.slice(0, limitCount) as Transaction[];
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }

  // Add payment method
  async addPaymentMethod(
    type: PaymentMethod['type'],
    details: PaymentMethod['details']
  ): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Check if this should be the default payment method
      const q = query(
        collection(db, 'payment_methods'),
        where('user_id', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const isDefault = querySnapshot.empty;

      const paymentMethodRef = await addDoc(collection(db, 'payment_methods'), {
        user_id: user.uid,
        type,
        details,
        is_default: isDefault,
        is_verified: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      return paymentMethodRef.id;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  // Get payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const q = query(
        collection(db, 'payment_methods'),
        where('user_id', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      }) as PaymentMethod[];
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }

  // Set default payment method
  async setDefaultPaymentMethod(methodId: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // First, set all methods to non-default
      const q = query(
        collection(db, 'payment_methods'),
        where('user_id', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { is_default: false, updated_at: serverTimestamp() })
      );
      
      await Promise.all(updatePromises);

      // Then set the selected method as default
      await updateDoc(doc(db, 'payment_methods', methodId), {
        is_default: true,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  }

  // Delete payment method
  async deletePaymentMethod(methodId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'payment_methods', methodId), {
        deleted_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }

  // Request withdrawal
  async requestWithdrawal(
    amount: number,
    paymentMethodId: string
  ): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Check balance
      const balance = await this.getBalance();
      if (balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Create transaction record
      const transactionRef = await addDoc(collection(db, 'transactions'), {
        user_id: user.uid,
        amount: -amount,
        type: 'debit',
        description: 'Withdrawal request',
        created_at: serverTimestamp()
      });

      // Update wallet balance
      const walletRef = doc(db, 'wallets', user.uid);
      await updateDoc(walletRef, {
        balance: balance - amount,
        updated_at: serverTimestamp()
      });

      return transactionRef.id;
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      throw error;
    }
  }

  // Process task payment
  async processTaskPayment(taskId: string, amount: number): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const balance = await this.getBalance();
      if (balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Create transaction record
      await addDoc(collection(db, 'transactions'), {
        user_id: user.uid,
        task_id: taskId,
        amount: -amount,
        type: 'debit',
        description: `Payment for task ${taskId}`,
        created_at: serverTimestamp()
      });

      // Update wallet balance
      const walletRef = doc(db, 'wallets', user.uid);
      await updateDoc(walletRef, {
        balance: balance - amount,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error processing task payment:', error);
      throw error;
    }
  }

  // Add funds to wallet
  async addFundsToWallet(amount: number): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Get current balance
      const walletRef = doc(db, 'wallets', user.uid);
      const walletDoc = await getDoc(walletRef);
      
      let currentBalance = 0;
      
      if (walletDoc.exists()) {
        currentBalance = walletDoc.data().balance || 0;
      } else {
        // Create wallet if it doesn't exist
        await addDoc(collection(db, 'wallets'), {
          user_id: user.uid,
          balance: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }

      // Update wallet balance
      await updateDoc(walletRef, {
        balance: currentBalance + amount,
        updated_at: serverTimestamp()
      });

      // Create transaction record
      const transactionRef = await addDoc(collection(db, 'transactions'), {
        user_id: user.uid,
        amount: amount,
        type: 'credit',
        description: 'Wallet deposit',
        created_at: serverTimestamp()
      });

      return transactionRef.id;
    } catch (error) {
      console.error('Error adding funds to wallet:', error);
      throw error;
    }
  }

  // Transfer funds from one user to another (for task completion)
  async transferFunds(
    fromUserId: string,
    toUserId: string,
    amount: number,
    taskId: string
  ): Promise<void> {
    try {
      // Get sender's wallet
      const fromWalletRef = doc(db, 'wallets', fromUserId);
      const fromWalletDoc = await getDoc(fromWalletRef);
      
      if (!fromWalletDoc.exists()) {
        throw new Error('Sender wallet not found');
      }
      
      // Get receiver's wallet
      const toWalletRef = doc(db, 'wallets', toUserId);
      const toWalletDoc = await getDoc(toWalletRef);
      
      if (!toWalletDoc.exists()) {
        // Create receiver wallet if it doesn't exist
        await setDoc(toWalletRef, {
          user_id: toUserId,
          balance: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      }
      
      // Get current balances
      const fromBalance = fromWalletDoc.data().balance || 0;
      const toBalance = toWalletDoc.exists() ? toWalletDoc.data().balance || 0 : 0;
      
      // Check if sender has sufficient balance
      if (fromBalance < amount) {
        throw new Error('Insufficient balance for transfer');
      }
      
      // Create transaction records
      await addDoc(collection(db, 'transactions'), {
        user_id: fromUserId,
        task_id: taskId,
        amount: -amount,
        type: 'debit',
        description: `Payment for task ${taskId}`,
        created_at: serverTimestamp()
      });
      
      await addDoc(collection(db, 'transactions'), {
        user_id: toUserId,
        task_id: taskId,
        amount: amount,
        type: 'credit',
        description: `Payment received for task ${taskId}`,
        created_at: serverTimestamp()
      });
      
      // Update wallet balances
      await updateDoc(fromWalletRef, {
        balance: fromBalance - amount,
        updated_at: serverTimestamp()
      });
      
      await updateDoc(toWalletRef, {
        balance: toBalance + amount,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error transferring funds:', error);
      throw error;
    }
  }

  // Subscribe to wallet changes
  subscribeToWalletUpdates = (callback: (balance: number) => void): (() => void) => {
    // Clean up any existing subscription first
    this.cleanupSubscription();

    const user = auth.currentUser;
    if (!user) {
      console.warn('Cannot subscribe to wallet updates: user not authenticated');
      return () => {};
    }

    const walletRef = doc(db, 'wallets', user.uid);
    
    const unsubscribe = onSnapshot(walletRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data().balance || 0);
      }
    });
    
    this._currentUnsubscribe = unsubscribe;
    
    return () => {
      this.cleanupSubscription();
    };
  };

  // Helper method to clean up subscriptions
  private cleanupSubscription(): void {
    if (this._currentUnsubscribe) {
      this._currentUnsubscribe();
      this._currentUnsubscribe = null;
    }
  }
}

export const walletService = new WalletService();