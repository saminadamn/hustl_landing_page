import React, { useState, useEffect } from 'react';
import { X, Star, User, MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { reviewService, profileService } from '../lib/database';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

interface ViewReviewsModalProps {
  taskId: string;
  onClose: () => void;
}

interface Review {
  id: string;
  task_id: string;
  user_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at: any;
  reviewer_role: string;
  reviewer?: any;
}

const ViewReviewsModal: React.FC<ViewReviewsModalProps> = ({ taskId, onClose }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [taskId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const reviewsData = await reviewService.getTaskReviews(taskId);
      
      // Enrich reviews with reviewer profiles
      const enrichedReviews = await Promise.all(
        reviewsData.map(async (review) => {
          try {
            const reviewerProfile = await profileService.getProfile(review.reviewer_id);
            return {
              ...review,
              reviewer: reviewerProfile
            };
          } catch (error) {
            console.error('Error loading reviewer profile:', error);
            return review;
          }
        })
      );
      
      setReviews(enrichedReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Error loading reviews');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <MessageSquare className="w-6 h-6 mr-2" />
              Task Reviews
            </h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0038FF]"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-500">
                This task doesn't have any reviews yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-gray-50 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        {review.reviewer?.avatar_url ? (
                          <img
                            src={review.reviewer.avatar_url}
                            alt={review.reviewer.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{review.reviewer?.full_name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">
                          {review.reviewer_role === 'creator' ? 'Task Creator' : 'Task Performer'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewReviewsModal;