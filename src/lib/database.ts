import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  setDoc,
  runTransaction,
  writeBatch,
  DocumentReference,
  GetOptions
} from 'firebase/firestore';
import { db, auth } from './firebase';
import * as Sentry from "@sentry/react";
import { captureException } from './sentryUtils';

// Task service object
export const taskService = {
  async createTask(taskData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...taskData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      
      // Create chat collection for this task
      await setDoc(doc(db, 'chats', docRef.id), {
        task_id: docRef.id,
        created_at: serverTimestamp()
      });
      
      // Log task creation in Sentry
      Sentry.addBreadcrumb({
        category: 'task',
        message: `Task created: ${taskData.title}`,
        level: 'info'
      });
      
      return docRef.id;
    } catch (error) {
      captureException(error, {
        tags: { action: 'create_task' },
        extra: { taskData }
      });
      throw error;
    }
  },

  async getTasks(filters?: any[]): Promise<any[]> {
    try {
      let q = query(collection(db, 'tasks'), orderBy('created_at', 'desc'));

      if (filters) {
        filters.forEach(filter => {
          if (filter.field && filter.value) {
            q = query(q, where(filter.field, filter.operator || '==', filter.value));
          }
        });
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_tasks' },
        extra: { filters }
      });
      throw error;
    }
  },

  async getTaskById(taskId: string): Promise<any> {
    try {
      const docRef = doc(db, 'tasks', taskId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_task_by_id' },
        extra: { taskId }
      });
      throw error;
    }
  },

  async updateTask(taskId: string, updates: any): Promise<void> {
    try {
      const docRef = doc(db, 'tasks', taskId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
      
      // Log task update in Sentry
      Sentry.addBreadcrumb({
        category: 'task',
        message: `Task updated: ${taskId}`,
        level: 'info',
        data: { updates }
      });
    } catch (error) {
      captureException(error, {
        tags: { action: 'update_task' },
        extra: { taskId, updates }
      });
      throw error;
    }
  },

  async completeTask(taskId: string): Promise<void> {
    try {
      const docRef = doc(db, 'tasks', taskId);
      await updateDoc(docRef, {
        status: 'completed',
        completed_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      
      // Create notification for task completion
      const taskDoc = await getDoc(docRef);
      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        
        // Notify task creator
        await notificationService.createNotification({
          user_id: taskData.created_by,
          type: 'task',
          title: 'Task Completed',
          content: `Your task "${taskData.title}" has been completed successfully!`,
          task_id: taskId,
          read: false
        });
        
        // Notify task performer
        if (taskData.accepted_by) {
          await notificationService.createNotification({
            user_id: taskData.accepted_by,
            type: 'task',
            title: 'Task Completed',
            content: `The task "${taskData.title}" has been marked as completed.`,
            task_id: taskId,
            read: false
          });
        }
      }
      
      // Log task completion in Sentry
      Sentry.addBreadcrumb({
        category: 'task',
        message: `Task completed: ${taskId}`,
        level: 'info'
      });
    } catch (error) {
      captureException(error, {
        tags: { action: 'complete_task' },
        extra: { taskId }
      });
      throw error;
    }
  },

  subscribeToTasks(callback: (tasks: any[]) => void, filters?: any[]) {
    let q = query(collection(db, 'tasks'), orderBy('created_at', 'desc'));

    if (filters) {
      filters.forEach(filter => {
        if (filter.field && filter.value) {
          q = query(q, where(filter.field, filter.operator || '==', filter.value));
        }
      });
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(tasks);
    }, (error) => {
      captureException(error, {
        tags: { action: 'subscribe_to_tasks' },
        extra: { filters }
      });
    });

    return unsubscribe;
  }
};

// Profile service object
export const profileService = {
  async getProfile(userId: string): Promise<any> {
    try {
      const docRef = doc(db, 'profiles', userId);
      
      // Check if client is offline and use cache if available
      const options: GetOptions = {
        source: !navigator.onLine ? 'cache' : 'default'
      };
      
      const docSnap = await getDoc(docRef, options);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_profile' },
        extra: { userId }
      });
      throw error;
    }
  },

  async createProfile(userId: string, profileData: any): Promise<void> {
    try {
      await setDoc(doc(db, 'profiles', userId), {
        ...profileData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    } catch (error) {
      captureException(error, {
        tags: { action: 'create_profile' },
        extra: { userId, profileData }
      });
      throw error;
    }
  },

  async updateProfile(userId: string, updates: any): Promise<void> {
    try {
      const docRef = doc(db, 'profiles', userId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      captureException(error, {
        tags: { action: 'update_profile' },
        extra: { userId, updates }
      });
      throw error;
    }
  }
};

// User stats service object
export const userStatsService = {
  async getUserStats(userId: string): Promise<any> {
    try {
      const docRef = doc(db, 'user_stats', userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_user_stats' },
        extra: { userId }
      });
      throw error;
    }
  },

  async createUserStats(userId: string, statsData: any): Promise<void> {
    try {
      await setDoc(doc(db, 'user_stats', userId), {
        user_id: userId,
        ...statsData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    } catch (error) {
      captureException(error, {
        tags: { action: 'create_user_stats' },
        extra: { userId, statsData }
      });
      throw error;
    }
  },

  async updateUserStats(userId: string, updates: any): Promise<void> {
    try {
      const docRef = doc(db, 'user_stats', userId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      captureException(error, {
        tags: { action: 'update_user_stats' },
        extra: { userId, updates }
      });
      throw error;
    }
  },

  // Update stats when a task is completed
  async updateStatsOnTaskCompletion(userId: string, taskPrice: number): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const statsRef = doc(db, 'user_stats', userId);
        const statsDoc = await transaction.get(statsRef);
        
        if (statsDoc.exists()) {
          const currentStats = statsDoc.data();
          const newTasksCompleted = (currentStats.tasks_completed || 0) + 1;
          const newTotalEarnings = (currentStats.total_earnings || 0) + taskPrice;
          
          transaction.update(statsRef, {
            tasks_completed: newTasksCompleted,
            total_earnings: newTotalEarnings,
            updated_at: serverTimestamp()
          });
          
          // Add badge for first task completion
          if (newTasksCompleted === 1) {
            const profileRef = doc(db, 'profiles', userId);
            const profileDoc = await transaction.get(profileRef);
            
            if (profileDoc.exists()) {
              const currentBadges = profileDoc.data().badges || [];
              if (!currentBadges.includes('First Task')) {
                transaction.update(profileRef, {
                  badges: [...currentBadges, 'First Task'],
                  updated_at: serverTimestamp()
                });
              }
            }
          }
          
          // Add badge for completing 5 tasks
          if (newTasksCompleted === 5) {
            const profileRef = doc(db, 'profiles', userId);
            const profileDoc = await transaction.get(profileRef);
            
            if (profileDoc.exists()) {
              const currentBadges = profileDoc.data().badges || [];
              if (!currentBadges.includes('Task Master')) {
                transaction.update(profileRef, {
                  badges: [...currentBadges, 'Task Master'],
                  updated_at: serverTimestamp()
                });
              }
            }
          }
          
        } else {
          // Create stats if they don't exist
          transaction.set(statsRef, {
            user_id: userId,
            tasks_completed: 1,
            total_earnings: taskPrice,
            points: 0,
            average_rating: 0,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
        }
      });
      
      // Log stats update in Sentry
      Sentry.addBreadcrumb({
        category: 'user_stats',
        message: `Stats updated for user ${userId} - task completion`,
        level: 'info',
        data: { taskPrice }
      });
    } catch (error) {
      captureException(error, {
        tags: { action: 'update_stats_on_task_completion' },
        extra: { userId, taskPrice }
      });
      throw error;
    }
  }
};

// Task progress service object
export const taskProgressService = {
  async createProgress(progressData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'task_progress'), {
        ...progressData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      
      // Log progress creation in Sentry
      Sentry.addBreadcrumb({
        category: 'task_progress',
        message: `Progress created for task ${progressData.task_id}: ${progressData.status}`,
        level: 'info'
      });
      
      return docRef.id;
    } catch (error) {
      captureException(error, {
        tags: { action: 'create_progress' },
        extra: { progressData }
      });
      throw error;
    }
  },

  async getTaskProgress(taskId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'task_progress'),
        where('task_id', '==', taskId),
        orderBy('created_at', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_task_progress' },
        extra: { taskId }
      });
      throw error;
    }
  },

  subscribeToTaskProgress(taskId: string, callback: (progress: any[]) => void) {
    try {
      const q = query(
        collection(db, 'task_progress'),
        where('task_id', '==', taskId),
        orderBy('created_at', 'asc')
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const progress = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(progress);
      }, (error) => {
        captureException(error, {
          tags: { action: 'subscribe_to_task_progress' },
          extra: { taskId }
        });
      });

      return unsubscribe;
    } catch (error) {
      captureException(error, {
        tags: { action: 'subscribe_to_task_progress_setup' },
        extra: { taskId }
      });
      return () => {}; // Return empty function as fallback
    }
  }
};

// Location service object
export const locationService = {
  async updateLocation(taskId: string, userId: string, location: any, history: any[] = []): Promise<string> {
    try {
      // Add timestamp to location data
      const locationWithTimestamp = {
        ...location,
        timestamp: Date.now()
      };
      
      // Use set with merge to update or create the document
      await setDoc(doc(db, 'task_locations', taskId), {
        task_id: taskId,
        user_id: userId,
        location: locationWithTimestamp,
        history: history.length > 0 ? history : undefined,
        updated_at: serverTimestamp()
      }, { merge: true });
      
      return taskId;
    } catch (error) {
      captureException(error, {
        tags: { action: 'update_location' },
        extra: { taskId, userId }
      });
      throw error;
    }
  },

  async getTaskLocation(taskId: string): Promise<any> {
    try {
      const docRef = doc(db, 'task_locations', taskId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_task_location' },
        extra: { taskId }
      });
      throw error;
    }
  },

  subscribeToTaskLocation(taskId: string, callback: (location: any) => void) {
    try {
      const docRef = doc(db, 'task_locations', taskId);
      
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          callback({
            id: docSnap.id,
            ...docSnap.data()
          });
        } else {
          callback(null);
        }
      }, (error) => {
        captureException(error, {
          tags: { action: 'subscribe_to_task_location' },
          extra: { taskId }
        });
      });

      return unsubscribe;
    } catch (error) {
      captureException(error, {
        tags: { action: 'subscribe_to_task_location_setup' },
        extra: { taskId }
      });
      return () => {}; // Return empty function as fallback
    }
  },

  async deleteTaskLocation(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'task_locations', taskId));
    } catch (error) {
      captureException(error, {
        tags: { action: 'delete_task_location' },
        extra: { taskId }
      });
      throw error;
    }
  }
};

// Notification service object
export const notificationService = {
  async createNotification(notificationData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      captureException(error, {
        tags: { action: 'create_notification' },
        extra: { notificationData }
      });
      throw error;
    }
  },

  async getUserNotifications(userId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_user_notifications' },
        extra: { userId }
      });
      throw error;
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, {
        read: true,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      captureException(error, {
        tags: { action: 'mark_notification_as_read' },
        extra: { notificationId }
      });
      throw error;
    }
  },

  subscribeToUserNotifications(userId: string, callback: (notifications: any[]) => void) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(notifications);
      }, (error) => {
        captureException(error, {
          tags: { action: 'subscribe_to_user_notifications' },
          extra: { userId }
        });
      });

      return unsubscribe;
    } catch (error) {
      captureException(error, {
        tags: { action: 'subscribe_to_user_notifications_setup' },
        extra: { userId }
      });
      return () => {}; // Return empty function as fallback
    }
  }
};

// Transaction service object
export const transactionService = {
  async createTransaction(transactionData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'transactions'), {
        ...transactionData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      captureException(error, {
        tags: { action: 'create_transaction' },
        extra: { transactionData }
      });
      throw error;
    }
  },

  async getUserTransactions(userId: string, limitCount: number = 50): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_user_transactions' },
        extra: { userId, limitCount }
      });
      throw error;
    }
  },

  subscribeToUserTransactions(userId: string, callback: (transactions: any[]) => void) {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const transactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(transactions);
      }, (error) => {
        captureException(error, {
          tags: { action: 'subscribe_to_user_transactions' },
          extra: { userId }
        });
      });

      return unsubscribe;
    } catch (error) {
      captureException(error, {
        tags: { action: 'subscribe_to_user_transactions_setup' },
        extra: { userId }
      });
      return () => {}; // Return empty function as fallback
    }
  }
};

// Payment method service object
export const paymentMethodService = {
  async addPaymentMethod(userId: string, methodData: any): Promise<string> {
    try {
      // Check if this should be the default payment method
      const q = query(
        collection(db, 'payment_methods'),
        where('user_id', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const isDefault = querySnapshot.empty;

      const paymentMethodRef = await addDoc(collection(db, 'payment_methods'), {
        user_id: userId,
        ...methodData,
        is_default: isDefault,
        is_verified: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      return paymentMethodRef.id;
    } catch (error) {
      captureException(error, {
        tags: { action: 'add_payment_method' },
        extra: { userId }
      });
      throw error;
    }
  },

  async getUserPaymentMethods(userId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'payment_methods'),
        where('user_id', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      }) as any[];
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_user_payment_methods' },
        extra: { userId }
      });
      throw error;
    }
  },

  async setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
    try {
      // First, set all methods to non-default
      const q = query(
        collection(db, 'payment_methods'),
        where('user_id', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { 
          is_default: false,
          updated_at: serverTimestamp()
        })
      );
      
      await Promise.all(updatePromises);

      // Then set the selected method as default
      await updateDoc(doc(db, 'payment_methods', methodId), {
        is_default: true,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      captureException(error, {
        tags: { action: 'set_default_payment_method' },
        extra: { userId, methodId }
      });
      throw error;
    }
  },

  async deletePaymentMethod(methodId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'payment_methods', methodId), {
        deleted_at: serverTimestamp()
      });
    } catch (error) {
      captureException(error, {
        tags: { action: 'delete_payment_method' },
        extra: { methodId }
      });
      throw error;
    }
  }
};

// Task template service object
export const taskTemplateService = {
  async getTemplates(): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'task_templates'),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_templates' }
      });
      throw error;
    }
  }
};

// Message service object
export const messageService = {
  // Find or create a chat thread between two users
  async findOrCreateChatThread(user1Id: string, user2Id: string, taskId?: string): Promise<string> {
    try {
      console.log('Finding or creating chat thread between users:', user1Id, user2Id, 'for task:', taskId);
      
      // Sort user IDs to ensure consistent chat ID regardless of who initiates
      const participants = [user1Id, user2Id].sort();
      
      // Check if a chat thread already exists between these users
      const q = query(
        collection(db, 'user_chats'),
        where('participants', 'array-contains', user1Id)
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Found', querySnapshot.size, 'chat threads for user', user1Id);
      
      // Find the chat thread with both participants
      const existingThread = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants && 
               Array.isArray(data.participants) && 
               data.participants.includes(user2Id);
      });
      
      // If a chat thread exists, update it with the task ID if provided
      if (existingThread) {
        const chatThreadId = existingThread.id;
        console.log('Found existing chat thread:', chatThreadId);
        
        // If a taskId is provided, update the chat thread with this task ID
        if (taskId) {
          console.log('Updating chat thread with task ID:', taskId);
          await updateDoc(doc(db, 'user_chats', chatThreadId), {
            last_task_id: taskId,
            updated_at: serverTimestamp()
          });
        }
        
        return chatThreadId;
      }
      
      // Otherwise, create a new chat thread
      console.log('Creating new chat thread for users:', participants);
      const chatRef = await addDoc(collection(db, 'user_chats'), {
        participants,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        last_message: null,
        last_message_time: null,
        last_task_id: taskId || null
      });
      
      console.log('Created new chat thread:', chatRef.id);
      return chatRef.id;
    } catch (error) {
      console.error('Error in findOrCreateChatThread:', error);
      captureException(error, {
        tags: { action: 'find_or_create_chat_thread' },
        extra: { user1Id, user2Id, taskId }
      });
      throw error;
    }
  },

  async sendMessage(chatThreadId: string, messageData: any): Promise<string> {
    try {
      console.log('Sending message to chat thread:', chatThreadId, messageData);
      
      // Add the message to the chat thread
      const messagesRef = collection(db, 'user_chats', chatThreadId, 'messages');
      const docRef = await addDoc(messagesRef, {
        ...messageData,
        created_at: serverTimestamp()
      });
      
      // Update the chat thread with latest message info
      await updateDoc(doc(db, 'user_chats', chatThreadId), {
        last_message: messageData.content,
        last_message_time: serverTimestamp(),
        last_sender: messageData.sender_id,
        updated_at: serverTimestamp()
      });
      
      // If task_id is provided, also update the task-specific chat for backward compatibility
      if (messageData.task_id) {
        try {
          // Update the task-specific chat
          await setDoc(doc(db, 'chats', messageData.task_id), {
            task_id: messageData.task_id,
            updated_at: serverTimestamp(),
            last_message: messageData.content,
            last_message_time: serverTimestamp(),
            last_sender: messageData.sender_id
          }, { merge: true });
          
          // Add the message to the task-specific chat collection
          const taskMessagesRef = collection(db, 'chats', messageData.task_id, 'messages');
          await addDoc(taskMessagesRef, {
            ...messageData,
            created_at: serverTimestamp()
          });
        } catch (taskChatError) {
          console.warn('Error updating task-specific chat:', taskChatError);
          // Don't fail the whole operation if task chat update fails
        }
      }
      
      console.log('Message sent successfully, ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      captureException(error, {
        tags: { action: 'send_message' },
        extra: { chatThreadId, messageData }
      });
      throw error;
    }
  },

  async getMessages(chatThreadId: string): Promise<any[]> {
    try {
      console.log('Getting messages for chat thread:', chatThreadId);
      
      // Return empty array if no chatThreadId provided
      if (!chatThreadId || chatThreadId.trim() === '') {
        console.warn('No chat thread ID provided to getMessages');
        return [];
      }
      
      // Get messages from the chat thread
      const messagesRef = collection(db, 'user_chats', chatThreadId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('created_at', 'asc'));
      
      const messagesSnapshot = await getDocs(messagesQuery);
      console.log('Found', messagesSnapshot.size, 'messages');
      
      return messagesSnapshot.docs.map(doc => {
        const data = doc.data();
        let createdAt;
        
        // Handle different timestamp formats
        if (data.created_at && typeof data.created_at.toDate === 'function') {
          createdAt = data.created_at.toDate();
        } else if (data.created_at) {
          createdAt = new Date(data.created_at);
        } else {
          createdAt = new Date();
        }
        
        return {
          id: doc.id,
          ...data,
          created_at: createdAt
        };
      });
    } catch (error) {
      console.error('Error in getMessages:', error);
      captureException(error, {
        tags: { action: 'get_messages' },
        extra: { chatThreadId }
      });
      throw error;
    }
  },

  async markAsRead(chatThreadId: string, messageId: string): Promise<void> {
    try {
      // Mark the message as read in the chat thread
      const messageRef = doc(db, 'user_chats', chatThreadId, 'messages', messageId);
      await updateDoc(messageRef, {
        is_read: true
      });
      
      // If the message has a task_id, also mark it as read in the task-specific chat
      const messageDoc = await getDoc(messageRef);
      if (messageDoc.exists() && messageDoc.data().task_id) {
        try {
          const taskMessageRef = doc(db, 'chats', messageDoc.data().task_id, 'messages', messageId);
          await updateDoc(taskMessageRef, {
            is_read: true
          });
        } catch (taskChatError) {
          console.warn('Error updating task-specific message read status:', taskChatError);
          // Don't fail the whole operation if task message update fails
        }
      }
    } catch (error) {
      captureException(error, {
        tags: { action: 'mark_message_as_read' },
        extra: { chatThreadId, messageId }
      });
      throw error;
    }
  },

  subscribeToMessages(chatThreadId: string, callback: (messages: any[]) => void) {
    try {
      console.log('Subscribing to messages for chat thread:', chatThreadId);
      
      // If no chatThreadId provided, return early with empty messages
      if (!chatThreadId || chatThreadId.trim() === '') {
        console.warn('No chat thread ID provided to subscribeToMessages');
        callback([]);
        return () => {};
      }
      
      // Subscribe to messages from the chat thread
      const messagesRef = collection(db, 'user_chats', chatThreadId, 'messages');
      const messagesQuery = query(messagesRef, orderBy('created_at', 'asc'));
      
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        console.log('Received message snapshot with', snapshot.docs.length, 'messages');
        
        const messages = snapshot.docs.map(doc => {
          const data = doc.data();
          let createdAt;
          
          // Handle different timestamp formats
          if (data.created_at && typeof data.created_at.toDate === 'function') {
            createdAt = data.created_at.toDate();
          } else if (data.created_at) {
            createdAt = new Date(data.created_at);
          } else {
            createdAt = new Date();
          }
          
          return {
            id: doc.id,
            ...data,
            created_at: createdAt
          };
        });
        callback(messages);
      }, (error) => {
        console.error('Error in subscribeToMessages onSnapshot:', error);
        captureException(error, {
          tags: { action: 'subscribe_to_messages' },
          extra: { chatThreadId }
        });
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up subscribeToMessages:', error);
      captureException(error, {
        tags: { action: 'subscribe_to_messages_setup' },
        extra: { chatThreadId }
      });
      return () => {}; // Return empty function as fallback
    }
  },
  
  async addReaction(chatThreadId: string, messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      // Find the message in the chat thread
      const messageRef = doc(db, 'user_chats', chatThreadId, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }
      
      // Update reaction in chat thread
      const reactions = messageDoc.data().reactions || {};
      
      // Toggle reaction
      if (reactions[userId] === emoji) {
        // Remove reaction
        const { [userId]: removed, ...rest } = reactions;
        await updateDoc(messageRef, { reactions: rest });
      } else {
        // Add or update reaction
        await updateDoc(messageRef, {
          reactions: {
            ...reactions,
            [userId]: emoji
          }
        });
      }
      
      // If the message has a task_id, also update the reaction in the task-specific chat
      if (messageDoc.data().task_id) {
        try {
          const taskMessageRef = doc(db, 'chats', messageDoc.data().task_id, 'messages', messageId);
          const taskMessageDoc = await getDoc(taskMessageRef);
          
          if (taskMessageDoc.exists()) {
            const taskReactions = taskMessageDoc.data().reactions || {};
            
            // Toggle reaction in task chat
            if (taskReactions[userId] === emoji) {
              // Remove reaction
              const { [userId]: removed, ...rest } = taskReactions;
              await updateDoc(taskMessageRef, { reactions: rest });
            } else {
              // Add or update reaction
              await updateDoc(taskMessageRef, {
                reactions: {
                  ...taskReactions,
                  [userId]: emoji
                }
              });
            }
          }
        } catch (taskChatError) {
          console.warn('Error updating task-specific message reaction:', taskChatError);
          // Don't fail the whole operation if task message update fails
        }
      }
    } catch (error) {
      captureException(error, {
        tags: { action: 'add_reaction' },
        extra: { chatThreadId, messageId, userId, emoji }
      });
      throw error;
    }
  },
  
  // Get all chat threads for a user
  async getUserChatThreads(userId: string): Promise<any[]> {
    try {
      // Query for chat threads where the user is a participant
      const q = query(
        collection(db, 'user_chats'),
        where('participants', 'array-contains', userId),
        orderBy('updated_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      // Map the chat threads to a more usable format
      const chatThreads = await Promise.all(querySnapshot.docs.map(async snapshotDoc => {
        const data = snapshotDoc.data();
        
        // Get the other participant's ID
        const otherUserId = data.participants.find((id: string) => id !== userId);
        
        // Get the other participant's profile
        let otherUserProfile = null;
        if (otherUserId) {
          const profileDoc = await getDoc(doc(db, 'profiles', otherUserId));
          if (profileDoc.exists()) {
            otherUserProfile = {
              id: otherUserId,
              ...profileDoc.data()
            };
          }
        }
        
        return {
          id: snapshotDoc.id,
          ...data,
          other_user: otherUserProfile
        };
      }));
      
      return chatThreads;
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_user_chat_threads' },
        extra: { userId }
      });
      throw error;
    }
  },
  
  // Subscribe to all chat threads for a user
  subscribeToUserChatThreads(userId: string, callback: (chatThreads: any[]) => void) {
    try {
      // Query for chat threads where the user is a participant
      const q = query(
        collection(db, 'user_chats'),
        where('participants', 'array-contains', userId),
        orderBy('updated_at', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        // Map the chat threads to a more usable format
        const chatThreadsPromises = querySnapshot.docs.map(async snapshotDoc => {
          const data = snapshotDoc.data();
          
          // Get the other participant's ID
          const otherUserId = data.participants.find((id: string) => id !== userId);
          
          // Get the other participant's profile
          let otherUserProfile = null;
          if (otherUserId) {
            try {
              const profileDoc = await getDoc(doc(db, 'profiles', otherUserId));
              if (profileDoc.exists()) {
                otherUserProfile = {
                  id: otherUserId,
                  ...profileDoc.data()
                };
              }
            } catch (error) {
              console.warn(`Error fetching profile for user ${otherUserId}:`, error);
            }
          }
          
          return {
            id: snapshotDoc.id,
            ...data,
            other_user: otherUserProfile
          };
        });
        
        const chatThreads = await Promise.all(chatThreadsPromises);
        callback(chatThreads);
      }, (error) => {
        captureException(error, {
          tags: { action: 'subscribe_to_user_chat_threads' },
          extra: { userId }
        });
      });
      
      return unsubscribe;
    } catch (error) {
      captureException(error, {
        tags: { action: 'subscribe_to_user_chat_threads_setup' },
        extra: { userId }
      });
      return () => {}; // Return empty function as fallback
    }
  }
};

// Reviews service
export const reviewService = {
  async addReview(reviewData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'reviews'), {
        ...reviewData,
        created_at: serverTimestamp()
      });
      
      // Update user's average rating
      await this.updateUserRating(reviewData.user_id);
      
      // Create notification for the user being reviewed
      await notificationService.createNotification({
        user_id: reviewData.user_id,
        type: 'review',
        title: 'New Review Received',
        content: `You've received a ${reviewData.rating}-star review for a recent task.`,
        task_id: reviewData.task_id,
        read: false
      });
      
      // Log review creation in Sentry
      Sentry.addBreadcrumb({
        category: 'review',
        message: `Review added for user ${reviewData.user_id} with rating ${reviewData.rating}`,
        level: 'info'
      });
      
      return docRef.id;
    } catch (error) {
      captureException(error, {
        tags: { action: 'add_review' },
        extra: { reviewData }
      });
      throw error;
    }
  },
  
  async getUserReviews(userId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_user_reviews' },
        extra: { userId }
      });
      throw error;
    }
  },
  
  async getTaskReviews(taskId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('task_id', '==', taskId),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_task_reviews' },
        extra: { taskId }
      });
      throw error;
    }
  },
  
  async updateUserRating(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('user_id', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map(doc => doc.data());
      
      if (reviews.length === 0) return;
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;
      
      const statsRef = doc(db, 'user_stats', userId);
      await updateDoc(statsRef, {
        average_rating: averageRating,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      captureException(error, {
        tags: { action: 'update_user_rating' },
        extra: { userId }
      });
      throw error;
    }
  }
};

// Badges service
export const badgeService = {
  async addBadgeToUser(userId: string, badgeName: string): Promise<void> {
    try {
      const profileRef = doc(db, 'profiles', userId);
      const profileDoc = await getDoc(profileRef);
      
      if (!profileDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const currentBadges = profileDoc.data().badges || [];
      
      // Only add if badge doesn't already exist
      if (!currentBadges.includes(badgeName)) {
        await updateDoc(profileRef, {
          badges: [...currentBadges, badgeName],
          updated_at: serverTimestamp()
        });
        
        // Create notification for badge
        await notificationService.createNotification({
          user_id: userId,
          type: 'achievement',
          title: `🏆 New Badge: ${badgeName}`,
          content: `Congratulations! You've earned the "${badgeName}" badge!`,
          read: false
        });
        
        // Log badge award in Sentry
        Sentry.addBreadcrumb({
          category: 'badge',
          message: `Badge awarded to user ${userId}: ${badgeName}`,
          level: 'info'
        });
      }
    } catch (error) {
      captureException(error, {
        tags: { action: 'add_badge_to_user' },
        extra: { userId, badgeName }
      });
      throw error;
    }
  },
  
  async getUserBadges(userId: string): Promise<string[]> {
    try {
      const profileRef = doc(db, 'profiles', userId);
      const profileDoc = await getDoc(profileRef);
      
      if (!profileDoc.exists()) {
        return [];
      }
      
      return profileDoc.data().badges || [];
    } catch (error) {
      captureException(error, {
        tags: { action: 'get_user_badges' },
        extra: { userId }
      });
      throw error;
    }
  }
};