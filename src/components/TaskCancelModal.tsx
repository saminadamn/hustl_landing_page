import React, { useState } from 'react';
import { X, AlertTriangle, Clock, DollarSign, User, MessageSquare } from 'lucide-react';
import { taskService, notificationService } from '../lib/database';
import { walletService } from '../lib/walletService';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

interface TaskCancelModalProps {
  task: any;
  onClose: () => void;
  onCancelled: () => void;
}

const TaskCancelModal: React.FC<TaskCancelModalProps> = ({ task, onClose, onCancelled }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFeeConfirmation, setShowFeeConfirmation] = useState(false);
  const [cancellationCount, setCancellationCount] = useState(0);
  const [cancellationFee, setCancellationFee] = useState(0);

  // Check cancellation count when component mounts
  React.useEffect(() => {
    checkCancellationCount();
  }, []);

  const checkCancellationCount = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // In a real app, you would fetch this from the database
      // For this demo, we'll simulate it with localStorage
      const count = parseInt(localStorage.getItem(`cancellations_${user.uid}`) || '0');
      setCancellationCount(count);

      // Calculate fee if applicable
      if (count >= 3 && task.price > 0) {
        // Fee is 10% of task price, minimum $1
        const fee = Math.max(1, task.price * 0.1);
        setCancellationFee(fee);
        setShowFeeConfirmation(true);
      }
    } catch (error) {
      console.error('Error checking cancellation count:', error);
    }
  };

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Update task status to cancelled
      await taskService.updateTask(task.id, {
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: user.uid,
        cancelled_at: new Date()
      });

      // Create notification for the other user
      const otherUserId = task.created_by === user.uid ? task.accepted_by : task.created_by;
      if (otherUserId) {
        await notificationService.createNotification({
          user_id: otherUserId,
          type: 'status',
          title: 'Task Cancelled',
          content: `The task "${task.title}" has been cancelled. Reason: ${reason}`,
          task_id: task.id,
          read: false
        });
      }

      // If this is a paid task and user has 3+ cancellations, apply fee
      if (cancellationCount >= 3 && task.price > 0 && user.uid === task.created_by) {
        // Apply cancellation fee
        await walletService.addFundsToWallet(-cancellationFee);
        toast.success(`Task cancelled. A $${cancellationFee.toFixed(2)} cancellation fee was applied.`);
      } else {
        toast.success('Task cancelled successfully');
      }

      // Update cancellation count in localStorage
      const newCount = cancellationCount + 1;
      localStorage.setItem(`cancellations_${user.uid}`, newCount.toString());

      onCancelled();
    } catch (error) {
      console.error('Error cancelling task:', error);
      toast.error('Error cancelling task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-red-500 text-white rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2" />
            Cancel Task
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {showFeeConfirmation ? (
            <>
              <div className="bg-red-50 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-700 mb-1">Cancellation Fee Applies</h3>
                    <p className="text-red-600 mb-2">
                      This is your {cancellationCount + 1}th cancellation. A fee of ${cancellationFee.toFixed(2)} will be charged.
                    </p>
                    <p className="text-sm text-red-600">
                      After 3 cancellations, a fee is applied for canceling paid tasks.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 mb-4">
                Are you sure you want to proceed with cancelling this task?
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowFeeConfirmation(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    'Confirm Cancellation'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-yellow-800 mb-1">Warning</h3>
                    <p className="text-yellow-700 mb-2">
                      Cancelling a task affects the other person and should only be done if absolutely necessary.
                    </p>
                    <p className="text-sm text-yellow-700 font-medium">
                      After 3 cancellations, a fee will be applied for future cancellations on paid tasks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation (required)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-red-500 focus:ring focus:ring-red-200"
                  rows={3}
                  placeholder="Please explain why you're cancelling this task..."
                  required
                />
                {reason.length === 0 && (
                  <p className="mt-1 text-sm text-red-600">
                    A reason is required to cancel the task
                  </p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-2">Task Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700">Status</span>
                    </div>
                    <span className="text-sm font-medium">
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700">Price</span>
                    </div>
                    <span className="text-sm font-medium">${task.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-700">Participants</span>
                    </div>
                    <span className="text-sm font-medium">
                      {task.accepted_by ? '2 people' : '1 person'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Keep Task
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading || !reason.trim()}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    'Cancel Task'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCancelModal;