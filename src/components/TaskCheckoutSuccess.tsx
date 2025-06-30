import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, MapPin, DollarSign } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

interface TaskCheckoutSuccessProps {
  onClose: () => void;
  onViewTask?: (taskId: string) => void;
}

const TaskCheckoutSuccess: React.FC<TaskCheckoutSuccessProps> = ({ onClose, onViewTask }) => {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get task ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const taskId = urlParams.get('task_id');
    const success = urlParams.get('success') === 'true';

    if (taskId && success) {
      loadTask(taskId);
      
      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      url.searchParams.delete('task_id');
      window.history.replaceState({}, '', url.toString());
    } else {
      setLoading(false);
    }
  }, []);

  const loadTask = async (id: string) => {
    try {
      const taskDoc = await getDoc(doc(db, 'tasks', id));
      
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }
      
      const taskData = {
        id: taskDoc.id,
        ...taskDoc.data()
      };
      
      // Get creator profile
      if (taskData.created_by) {
        const creatorDoc = await getDoc(doc(db, 'profiles', taskData.created_by));
        if (creatorDoc.exists()) {
          taskData.profiles = {
            full_name: creatorDoc.data().full_name,
            avatar_url: creatorDoc.data().avatar_url
          };
        }
      }
      
      setTask(taskData);
      
      // Update task status if needed
      if (taskData.status === 'cancelled' || taskData.status === 'pending_payment') {
        await updateDoc(doc(db, 'tasks', id), {
          status: 'open',
          updated_at: new Date()
        });
      }
    } catch (error) {
      console.error('Error loading task:', error);
      toast.error('Error loading task details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0021A5] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold">Payment Successful!</h2>
          <p className="text-gray-600 mt-2">
            Your task has been created and is now visible to potential helpers.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium mb-2">{task.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1" />
            {task.location}
          </div>
          <div className="mt-2 text-sm font-medium text-[#0021A5] flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            {task.price}
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onViewTask?.(task.id)}
            className="w-full bg-[#0021A5] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#001B8C] transition duration-200 flex items-center justify-center"
          >
            View Task Details
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCheckoutSuccess;