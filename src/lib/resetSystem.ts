import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Utility to clear all tasks and related data from the system
 */
export const resetSystem = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. Clear all tasks
    const tasksSnapshot = await getDocs(collection(db, 'tasks'));
    const taskIds = tasksSnapshot.docs.map(doc => doc.id);
    
    console.log(`Found ${taskIds.length} tasks to delete`);
    
    // 2. Clear all task progress entries
    const progressSnapshot = await getDocs(collection(db, 'task_progress'));
    console.log(`Found ${progressSnapshot.size} progress entries to delete`);
    
    // 3. Clear all task locations
    const locationsSnapshot = await getDocs(collection(db, 'task_locations'));
    console.log(`Found ${locationsSnapshot.size} location entries to delete`);
    
    // 4. Clear all chat messages for tasks
    for (const taskId of taskIds) {
      const messagesSnapshot = await getDocs(collection(db, 'chats', taskId, 'messages'));
      console.log(`Found ${messagesSnapshot.size} messages for task ${taskId} to delete`);
      
      // Delete all messages for this task
      for (const messageDoc of messagesSnapshot.docs) {
        await deleteDoc(doc(db, 'chats', taskId, 'messages', messageDoc.id));
      }
      
      // Delete the chat document itself
      await deleteDoc(doc(db, 'chats', taskId));
    }
    
    // 5. Clear all reviews related to tasks
    const reviewsSnapshot = await getDocs(
      query(collection(db, 'reviews'), where('task_id', 'in', taskIds.length > 0 ? taskIds : ['placeholder']))
    );
    console.log(`Found ${reviewsSnapshot.size} reviews to delete`);
    
    // 6. Clear all notifications related to tasks
    const notificationsSnapshot = await getDocs(
      query(collection(db, 'notifications'), where('task_id', 'in', taskIds.length > 0 ? taskIds : ['placeholder']))
    );
    console.log(`Found ${notificationsSnapshot.size} notifications to delete`);
    
    // 7. Clear all transactions related to tasks
    const transactionsSnapshot = await getDocs(
      query(collection(db, 'transactions'), where('task_id', 'in', taskIds.length > 0 ? taskIds : ['placeholder']))
    );
    console.log(`Found ${transactionsSnapshot.size} transactions to delete`);
    
    // Now perform all the deletions
    
    // Delete tasks
    for (const taskDoc of tasksSnapshot.docs) {
      await deleteDoc(doc(db, 'tasks', taskDoc.id));
    }
    
    // Delete progress entries
    for (const progressDoc of progressSnapshot.docs) {
      await deleteDoc(doc(db, 'task_progress', progressDoc.id));
    }
    
    // Delete location entries
    for (const locationDoc of locationsSnapshot.docs) {
      await deleteDoc(doc(db, 'task_locations', locationDoc.id));
    }
    
    // Delete reviews
    for (const reviewDoc of reviewsSnapshot.docs) {
      await deleteDoc(doc(db, 'reviews', reviewDoc.id));
    }
    
    // Delete notifications
    for (const notificationDoc of notificationsSnapshot.docs) {
      await deleteDoc(doc(db, 'notifications', notificationDoc.id));
    }
    
    // Delete transactions
    for (const transactionDoc of transactionsSnapshot.docs) {
      await deleteDoc(doc(db, 'transactions', transactionDoc.id));
    }
    
    return { 
      success: true, 
      message: `Successfully cleared ${taskIds.length} tasks and all related data` 
    };
  } catch (error) {
    console.error('Error resetting system:', error);
    return { 
      success: false, 
      message: `Error resetting system: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};