import React, { useState, useRef } from 'react';
import { X, AlertTriangle, Shield, Flag, Loader, Upload, Trash, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../lib/firebase';

interface ReportModalProps {
  taskId: string;
  userId: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  {
    id: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'The task contains inappropriate or offensive content'
  },
  {
    id: 'spam',
    label: 'Spam or Misleading',
    description: 'The task appears to be spam or contains misleading information'
  },
  {
    id: 'safety',
    label: 'Safety Concerns',
    description: 'The task raises safety concerns or seems dangerous'
  },
  {
    id: 'scam',
    label: 'Potential Scam',
    description: 'The task might be a scam or fraudulent activity'
  },
  {
    id: 'harassment',
    label: 'Harassment',
    description: 'The user is engaging in harassment or bullying behavior'
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other concerns not listed above'
  }
];

const ReportModal: React.FC<ReportModalProps> = ({ taskId, userId, onClose }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supportEmail = 'hustlapp@outlook.com';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      
      // Check file size (limit to 10MB per file)
      const validFiles = fileList.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large (max 10MB)`);
          return false;
        }
        return true;
      });
      
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    if (description.length < 20) {
      toast.error('Please provide a more detailed description (at least 20 characters)');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Upload files if any
      const fileUrls: string[] = [];
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileRef = ref(storage, `reports/${taskId}/${Date.now()}_${file.name}`);
          
          await uploadBytes(fileRef, file);
          const downloadUrl = await getDownloadURL(fileRef);
          fileUrls.push(downloadUrl);
          
          // Update progress
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));
        }
      }

      // Create report in Firestore
      await addDoc(collection(db, 'reports'), {
        reported_user_id: userId,
        reporter_id: user.uid,
        task_id: taskId,
        reason: selectedReason,
        description: description.trim(),
        file_urls: fileUrls,
        status: 'pending',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Open email client with report details
      const subject = `Report: ${selectedReason} - Task ID: ${taskId}`;
      const body = `
Reporter ID: ${user.uid}
Reporter Name: ${user.displayName || 'Not provided'}
Reported User ID: ${userId}
Task ID: ${taskId}
Report Type: ${selectedReason}
Description: ${description.trim()}
Timestamp: ${new Date().toISOString()}
File Attachments: ${fileUrls.length > 0 ? 'Yes' : 'No'}
      `.trim();
      
      const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;

      toast.success('Report submitted successfully');
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Error submitting report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <Flag className="w-6 h-6 text-red-500 mr-2" />
            Report Task
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Safety Notice */}
          <div className="bg-yellow-50 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Safety First</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  If you feel unsafe or witness illegal activity, please contact campus police immediately.
                  This reporting system is for platform-related issues only.
                </p>
              </div>
            </div>
          </div>

          {/* Report Reasons */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Reporting
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason.id}
                  className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedReason === reason.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.id}
                    checked={selectedReason === reason.id}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{reason.label}</p>
                    <p className="text-sm text-gray-500">{reason.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Explanation (Required)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border-gray-300 focus:border-red-500 focus:ring focus:ring-red-200"
              placeholder="Please provide specific details about the issue (minimum 20 characters)..."
              required
              minLength={20}
            ></textarea>
            <p className="mt-1 text-sm text-gray-500">
              {description.length < 20 ? 
                `Please enter at least ${20 - description.length} more characters` : 
                `${description.length} characters`}
            </p>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidence (Optional)
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Click to upload screenshots or evidence
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Max 10MB per file, any format
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Attached Files:</p>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center overflow-hidden">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center mr-2">
                        <span className="text-xs font-medium text-gray-600">
                          {file.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Notice */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Email Notification</h3>
                <p className="mt-1 text-sm text-blue-700">
                  When you submit this report, an email will be sent to our support team at {supportEmail} with your report details.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedReason || description.length < 20}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  {files.length > 0 ? `Uploading ${uploadProgress}%` : 'Submitting...'}
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;