import React, { useState, useEffect } from 'react';
import { Clock, MapPin, DollarSign, Star, MessageSquare, Calendar, Award, Filter, Search, ChevronDown, Eye, User, Trophy, CheckCircle } from 'lucide-react';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { reviewService, profileService } from '../lib/database';
import ReviewModal from './ReviewModal';
import ViewReviewsModal from './ViewReviewsModal';
import toast from 'react-hot-toast';

interface CompletedTask {
  id: string;
  title: string;
  description: string;
  location: string;
  location_coords?: { lat: number; lng: number };
  price: number;
  category: string;
  estimated_time: string;
  created_by: string;
  accepted_by: string;
  completed_at: any;
  created_at: any;
  status: string;
  creator?: any;
  performer?: any;
  user_role?: 'creator' | 'performer';
  earnings?: number;
  review_given?: boolean;
  review_received?: boolean;
}

const TaskHistory: React.FC = () => {
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showViewReviews, setShowViewReviews] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CompletedTask | null>(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalTasksCompleted, setTotalTasksCompleted] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewStatusFilter, setReviewStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const tasksPerPage = 10;

  useEffect(() => {
    loadCompletedTasks();
  }, []);

  const loadCompletedTasks = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      // Get tasks where user was either creator or performer and status is completed
      const createdTasksQuery = query(
        collection(db, 'tasks'),
        where('created_by', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('completed_at', 'desc')
      );

      const acceptedTasksQuery = query(
        collection(db, 'tasks'),
        where('accepted_by', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('completed_at', 'desc')
      );

      const [createdSnapshot, acceptedSnapshot] = await Promise.all([
        getDocs(createdTasksQuery),
        getDocs(acceptedTasksQuery)
      ]);

      const createdTasks = createdSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        user_role: 'creator' as const,
        earnings: 0
      }));

      const acceptedTasks = acceptedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        user_role: 'performer' as const,
        earnings: doc.data().price || 0
      }));

      const allTasks = [...createdTasks, ...acceptedTasks];

      // Enrich tasks with user profiles and review status
      const enrichedTasks = await Promise.all(
        allTasks.map(async (task) => {
          try {
            // Get other user's profile
            const otherUserId = task.user_role === 'creator' ? task.accepted_by : task.created_by;
            const otherUserProfile = await profileService.getProfile(otherUserId);

            // Check if user has given/received reviews for this task
            const reviews = await reviewService.getTaskReviews(task.id);
            const userReview = reviews.find(r => r.reviewer_id === user.uid);
            const receivedReview = reviews.find(r => r.user_id === user.uid);

            return {
              ...task,
              [task.user_role === 'creator' ? 'performer' : 'creator']: otherUserProfile,
              review_given: !!userReview,
              review_received: !!receivedReview
            };
          } catch (error) {
            console.error('Error enriching task:', error);
            return task;
          }
        })
      );

      // Sort tasks
      const sortedTasks = sortTasks(enrichedTasks, sortBy);
      setCompletedTasks(sortedTasks);

      // Calculate totals
      const earnings = acceptedTasks.reduce((sum, task) => sum + (task.price || 0), 0);
      setTotalEarnings(earnings);
      setTotalTasksCompleted(allTasks.length);

    } catch (error) {
      console.error('Error loading completed tasks:', error);
      toast.error('Error loading task history');
    } finally {
      setLoading(false);
    }
  };

  const sortTasks = (tasks: CompletedTask[], sortType: string) => {
    switch (sortType) {
      case 'recent':
        return tasks.sort((a, b) => {
          const dateA = a.completed_at?.toDate?.() || new Date(a.completed_at);
          const dateB = b.completed_at?.toDate?.() || new Date(b.completed_at);
          return dateB.getTime() - dateA.getTime();
        });
      case 'oldest':
        return tasks.sort((a, b) => {
          const dateA = a.completed_at?.toDate?.() || new Date(a.completed_at);
          const dateB = b.completed_at?.toDate?.() || new Date(b.completed_at);
          return dateA.getTime() - dateB.getTime();
        });
      case 'highest-earning':
        return tasks.sort((a, b) => (b.earnings || 0) - (a.earnings || 0));
      case 'lowest-earning':
        return tasks.sort((a, b) => (a.earnings || 0) - (b.earnings || 0));
      default:
        return tasks;
    }
  };

  const handleLeaveReview = (task: CompletedTask) => {
    setSelectedTask(task);
    setShowReviewModal(true);
  };

  const handleViewReviews = (task: CompletedTask) => {
    setSelectedTask(task);
    setShowViewReviews(true);
  };

  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    loadCompletedTasks(); // Refresh to update review status
    toast.success('Review submitted successfully!');
  };

  const filterByDateRange = (task: CompletedTask) => {
    if (dateRangeFilter === 'all') return true;
    
    const completedDate = task.completed_at?.toDate?.() || new Date(task.completed_at);
    const now = new Date();
    
    switch (dateRangeFilter) {
      case 'today':
        return completedDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return completedDate >= weekAgo;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return completedDate >= monthAgo;
      case 'year':
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        return completedDate >= yearAgo;
      default:
        return true;
    }
  };

  const filterByReviewStatus = (task: CompletedTask) => {
    switch (reviewStatusFilter) {
      case 'reviewed':
        return task.review_given;
      case 'not-reviewed':
        return !task.review_given;
      default:
        return true;
    }
  };

  const filteredTasks = completedTasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      task.category === selectedCategory;
    
    const matchesDateRange = filterByDateRange(task);
    const matchesReviewStatus = filterByReviewStatus(task);
    
    return matchesSearch && matchesCategory && matchesDateRange && matchesReviewStatus;
  });

  // Pagination
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'delivery', name: 'Delivery' },
    { id: 'coffee_run', name: 'Coffee Run' },
    { id: 'academic_help', name: 'Academic Help' },
    { id: 'pet_care', name: 'Pet Care' },
    { id: 'transportation', name: 'Transportation' },
    { id: 'other', name: 'Other' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0038FF]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      {/* Header with Stats */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Completed Tasks</h1>
        <p className="text-gray-600 mb-4 sm:mb-6">View your completed tasks and manage reviews</p>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Tasks Completed</p>
                <p className="text-2xl sm:text-3xl font-bold">{totalTasksCompleted}</p>
              </div>
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-[#FF5A1F] to-[#E63A0B] text-white rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Total Earnings</p>
                <p className="text-2xl sm:text-3xl font-bold">${totalEarnings.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-orange-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl p-4 sm:p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Reviews Given</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {completedTasks.filter(t => t.review_given).length}
                </p>
              </div>
              <Star className="w-10 h-10 sm:w-12 sm:h-12 text-purple-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search and Filters */}
      <div className="md:hidden mb-4">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border border-gray-300 rounded-lg bg-white"
          >
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
                <option value="year">Past Year</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Status</label>
              <select
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
              >
                <option value="all">All Reviews</option>
                <option value="reviewed">Reviewed</option>
                <option value="not-reviewed">Not Reviewed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="highest-earning">Highest Earning</option>
                <option value="lowest-earning">Lowest Earning</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0038FF] shadow-sm"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0038FF] shadow-sm"
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={dateRangeFilter}
          onChange={(e) => setDateRangeFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0038FF] shadow-sm"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Past Week</option>
          <option value="month">Past Month</option>
          <option value="year">Past Year</option>
        </select>

        <select
          value={reviewStatusFilter}
          onChange={(e) => setReviewStatusFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0038FF] shadow-sm"
        >
          <option value="all">All Reviews</option>
          <option value="reviewed">Reviewed</option>
          <option value="not-reviewed">Not Reviewed</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0038FF] shadow-sm"
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest First</option>
          <option value="highest-earning">Highest Earning</option>
          <option value="lowest-earning">Lowest Earning</option>
        </select>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No completed tasks found</h3>
          <p className="text-gray-500">
            {completedTasks.length === 0 
              ? "Complete your first task to see it appear in your history!" 
              : "Try adjusting your filters to see more results."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Task List */}
          <div className="md:hidden space-y-4">
            {currentTasks.map((task) => (
              <div key={task.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{task.title}</h3>
                    <div className={`text-sm font-medium ${task.user_role === 'performer' ? 'text-green-600' : 'text-gray-900'}`}>
                      {task.user_role === 'performer' ? '+' : '-'}${task.price.toFixed(2)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{formatDate(task.completed_at)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      {task.review_given ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Reviewed
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending Review
                        </span>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewReviews(task)}
                        className="text-xs text-blue-600 hover:text-blue-900 px-2 py-1 rounded-lg bg-blue-50"
                      >
                        View
                      </button>
                      {!task.review_given && (
                        <button
                          onClick={() => handleLeaveReview(task)}
                          className="text-xs text-green-600 hover:text-green-900 px-2 py-1 rounded-lg bg-green-50"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop Task List */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow-sm border border-gray-200">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3 border-b border-gray-200">Task</th>
                  <th className="px-6 py-3 border-b border-gray-200">Date Completed</th>
                  <th className="px-6 py-3 border-b border-gray-200">Amount</th>
                  <th className="px-6 py-3 border-b border-gray-200">Review Status</th>
                  <th className="px-6 py-3 border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {task.user_role === 'performer' ? 'You performed this task' : 'You posted this task'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(task.completed_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${task.user_role === 'performer' ? 'text-green-600' : 'text-gray-900'}`}>
                        {task.user_role === 'performer' ? '+' : '-'}${task.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.review_given ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Reviewed
                        </span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewReviews(task)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {!task.review_given && (
                          <button
                            onClick={() => handleLeaveReview(task)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6">
              <div className="text-sm text-gray-500 mb-3 sm:mb-0">
                Showing {indexOfFirstTask + 1} to {Math.min(indexOfLastTask, filteredTasks.length)} of {filteredTasks.length} tasks
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded-md text-sm font-medium ${
                      currentPage === page
                        ? 'bg-[#0038FF] text-white border-[#0038FF]'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedTask && (
        <ReviewModal
          task={selectedTask}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmitted}
        />
      )}

      {/* View Reviews Modal */}
      {showViewReviews && selectedTask && (
        <ViewReviewsModal
          taskId={selectedTask.id}
          onClose={() => setShowViewReviews(false)}
        />
      )}
    </div>
  );
};

export default TaskHistory;