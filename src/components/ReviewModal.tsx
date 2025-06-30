import React, { useState } from 'react';
import { X, Star, Send, User, AlertTriangle } from 'lucide-react';
import { reviewService } from '../lib/database';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

interface ReviewModalProps {
  task: any;
  onClose: () => void;
  onSubmit: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ task, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating < 1) {
      toast.error('Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }
    
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      // Determine who is being reviewed
      const revieweeId = task.user_role === 'creator' ? task.accepted_by : task.created_by;
      
      // Create the review
      await reviewService.addReview({
        task_id: task.id,
        user_id: revieweeId, // The person being reviewed
        reviewer_id: user.uid, // The person giving the review
        rating,
        comment: comment.trim(),
        reviewer_role: task.user_role, // 'creator' or 'performer'
        reviewee_role: task.user_role === 'creator' ? 'performer' : 'creator',
        created_at: new Date()
      });
      
      onSubmit();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Error submitting review');
    } finally {
      setLoading(false);
    }
  };

  const otherUser = task.user_role === 'creator' ? task.performer : task.creator;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Leave a Review</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* User Info */}
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
              {otherUser?.avatar_url ? (
                <img
                  src={otherUser.avatar_url}
                  alt={otherUser.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">{otherUser?.full_name || 'User'}</h3>
              <p className="text-gray-600 text-sm">
                {task.user_role === 'creator' ? 'Task Performer' : 'Task Creator'}
              </p>
            </div>
          </div>

          {/* Task Info */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <h4 className="font-medium mb-2">{task.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
            <div className="flex items-center text-sm text-gray-500">
              <Star className="w-4 h-4 mr-1 text-yellow-500" />
              <span>${task.price.toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate your experience
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        (hoverRating || rating) >= star
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your review
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-[#0038FF] focus:ring focus:ring-[#0038FF] focus:ring-opacity-50"
                placeholder="Share your experience working with this person..."
                required
              />
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 p-4 rounded-xl">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Review Guidelines</h4>
                  <ul className="mt-1 text-xs text-blue-700 space-y-1">
                    <li>• Be honest and constructive in your feedback</li>
                    <li>• Focus on the task experience and communication</li>
                    <li>• Avoid personal attacks or inappropriate language</li>
                    <li>• Reviews help build trust in our community</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading || !comment.trim() || rating < 1}
                className="flex-1 bg-[#0038FF] text-white px-4 py-3 rounded-xl font-semibold hover:bg-[#0021A5] transition duration-200 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Review
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;