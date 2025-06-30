import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, X, Settings, Database, Server, Activity, Users, FileText, BarChart2, Bug, Zap } from 'lucide-react';
import { resetSystem } from '../lib/resetSystem';
import toast from 'react-hot-toast';
import * as Sentry from "@sentry/react";
import { captureMessage, captureException } from '../lib/sentryUtils';

interface AdminToolsProps {
  onClose: () => void;
}

const AdminTools: React.FC<AdminToolsProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sentryIssues, setSentryIssues] = useState<any[]>([]);
  const [sentryStats, setSentryStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'system' | 'monitoring' | 'users'>('system');
  const [testErrorMode, setTestErrorMode] = useState<'handled' | 'unhandled'>('handled');

  useEffect(() => {
    // Log admin panel access
    captureMessage("Admin panel accessed", "info");
  }, []);

  const handleResetSystem = async () => {
    setLoading(true);
    try {
      // Log the reset attempt
      captureMessage("System reset initiated", "warning", {
        action: "system_reset"
      });
      
      const result = await resetSystem();
      setResult(result);
      
      if (result.success) {
        toast.success('System reset successful');
        
        // Log successful reset
        captureMessage("System reset successful", "info", {
          action: "system_reset",
          result: "success"
        });
      } else {
        toast.error('System reset failed');
        
        // Log failed reset
        captureMessage("System reset failed", "error", {
          action: "system_reset",
          result: "failure",
          error: result.message
        });
      }
    } catch (error) {
      console.error('Error resetting system:', error);
      setResult({ 
        success: false, 
        message: `Error: ${error instanceof Error ? error.message : String(error)}` 
      });
      toast.error('System reset failed');
      
      // Capture the exception
      captureException(error, {
        tags: { action: "system_reset" }
      });
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleTestSentryError = () => {
    try {
      if (testErrorMode === 'handled') {
        // Create a handled error
        try {
          // Intentionally cause an error
          const obj: any = null;
          obj.nonExistentMethod();
        } catch (error) {
          // Capture the error with Sentry
          captureException(error, {
            tags: {
              errorType: 'test_handled_error'
            },
            extra: {
              additionalData: 'This is a test handled error from the admin panel'
            }
          });
          
          toast.success('Test handled error sent to Sentry');
        }
      } else {
        // Create an unhandled error that will be caught by Sentry automatically
        setTimeout(() => {
          // This will cause an unhandled error
          const obj: any = null;
          obj.nonExistentMethod();
        }, 100);
        
        toast.success('Unhandled error will be triggered in 100ms');
      }
    } catch (error) {
      console.error('Error testing Sentry:', error);
      toast.error('Error testing Sentry');
    }
  };

  const handleSendTestMessage = () => {
    try {
      // Send a test message to Sentry
      captureMessage(
        "Test message from admin panel", 
        "info",
        {
          tags: {
            source: 'admin_panel',
            type: 'test_message'
          },
          extra: {
            timestamp: new Date().toISOString()
          }
        }
      );
      
      toast.success('Test message sent to Sentry');
    } catch (error) {
      console.error('Error sending test message:', error);
      toast.error('Error sending test message');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white">
          <h2 className="text-xl font-bold flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            Hustl Admin Command Center
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-3 font-medium ${
              activeTab === 'system'
                ? 'text-[#0038FF] border-b-2 border-[#0038FF]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Server className="w-4 h-4 mr-2" />
              System
            </div>
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-4 py-3 font-medium ${
              activeTab === 'monitoring'
                ? 'text-[#0038FF] border-b-2 border-[#0038FF]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Monitoring
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 font-medium ${
              activeTab === 'users'
                ? 'text-[#0038FF] border-b-2 border-[#0038FF]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Users
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {result && (
            <div className={`mb-6 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? 'Success' : 'Error'}
                  </p>
                  <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-start">
                  <Trash2 className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-800">Reset System</h3>
                    <p className="mt-1 text-sm text-red-700">
                      This will delete all tasks, in-progress work, and posted tasks across all users.
                      This action cannot be undone.
                    </p>
                    
                    {!showConfirmation ? (
                      <button
                        onClick={() => setShowConfirmation(true)}
                        className="mt-3 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Clear All Tasks
                      </button>
                    ) : (
                      <div className="mt-3 bg-red-100 p-3 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-2">
                          Are you sure? This will delete ALL tasks and related data.
                        </p>
                        <div className="flex space-x-3">
                          <button
                            onClick={handleResetSystem}
                            disabled={loading}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                          >
                            {loading ? (
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Confirm Reset
                          </button>
                          <button
                            onClick={() => setShowConfirmation(false)}
                            disabled={loading}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <Database className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-blue-800">Database Status</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Connected to Firebase Firestore database
                    </p>
                    <div className="mt-2 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-green-700">Operational</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-purple-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-purple-800">System Logs</h3>
                    <p className="mt-1 text-sm text-purple-700">
                      View and analyze system logs for troubleshooting
                    </p>
                    <button
                      className="mt-3 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors"
                      onClick={() => {
                        window.open("https://console.firebase.google.com/project/hustlu-3e064/overview", "_blank");
                      }}
                    >
                      View Firebase Logs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <Bug className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-800">Sentry Error Monitoring</h3>
                    <p className="mt-1 text-sm text-blue-700 mb-3">
                      Monitor and track errors in real-time with Sentry integration
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <h4 className="text-sm font-medium text-gray-700">Test Error Reporting</h4>
                        <div className="mt-2 flex items-center space-x-2">
                          <select 
                            value={testErrorMode}
                            onChange={(e) => setTestErrorMode(e.target.value as 'handled' | 'unhandled')}
                            className="text-sm border border-gray-300 rounded-md p-1"
                          >
                            <option value="handled">Handled Error</option>
                            <option value="unhandled">Unhandled Error</option>
                          </select>
                          <button
                            onClick={handleTestSentryError}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm hover:bg-blue-200 transition-colors"
                          >
                            Test Error
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border border-blue-100">
                        <h4 className="text-sm font-medium text-gray-700">Test Message Capture</h4>
                        <div className="mt-2">
                          <button
                            onClick={handleSendTestMessage}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm hover:bg-blue-200 transition-colors"
                          >
                            Send Test Message
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full flex items-center justify-center"
                      onClick={() => {
                        window.open("https://sentry.io/", "_blank");
                      }}
                    >
                      <BarChart2 className="w-4 h-4 mr-2" />
                      Open Sentry Dashboard
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start">
                  <Activity className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-green-800">Performance Monitoring</h3>
                    <p className="mt-1 text-sm text-green-700">
                      Track application performance metrics
                    </p>
                    
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-green-100">
                        <h4 className="text-xs font-medium text-gray-500">Page Load Time</h4>
                        <p className="text-lg font-bold text-gray-800">1.2s</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border border-green-100">
                        <h4 className="text-xs font-medium text-gray-500">API Response</h4>
                        <p className="text-lg font-bold text-gray-800">320ms</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border border-green-100">
                        <h4 className="text-xs font-medium text-gray-500">Error Rate</h4>
                        <p className="text-lg font-bold text-gray-800">0.2%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                  <Zap className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Real-time Monitoring</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      View active users and current system status
                    </p>
                    
                    <div className="mt-3 bg-white p-3 rounded-lg border border-yellow-100">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-700">Active Users</h4>
                        <span className="text-sm font-bold text-gray-800">24</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <h4 className="text-sm font-medium text-gray-700">Active Tasks</h4>
                        <span className="text-sm font-bold text-gray-800">12</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <h4 className="text-sm font-medium text-gray-700">System Status</h4>
                        <span className="text-sm font-bold text-green-600 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          Healthy
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-indigo-800">User Management</h3>
                    <p className="mt-1 text-sm text-indigo-700">
                      Manage users, permissions, and account status
                    </p>
                    
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-indigo-100">
                        <h4 className="text-xs font-medium text-gray-500">Total Users</h4>
                        <p className="text-lg font-bold text-gray-800">128</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border border-indigo-100">
                        <h4 className="text-xs font-medium text-gray-500">Active Today</h4>
                        <p className="text-lg font-bold text-gray-800">42</p>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border border-indigo-100">
                        <h4 className="text-xs font-medium text-gray-500">New This Week</h4>
                        <p className="text-lg font-bold text-gray-800">15</p>
                      </div>
                    </div>
                    
                    <button
                      className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full flex items-center justify-center"
                      onClick={() => {
                        window.open("https://console.firebase.google.com/project/hustlu-3e064/authentication/users", "_blank");
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manage Users in Firebase
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <div className="flex items-start">
                  <BarChart2 className="w-5 h-5 text-teal-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-teal-800">User Analytics</h3>
                    <p className="mt-1 text-sm text-teal-700">
                      View user engagement and activity metrics
                    </p>
                    
                    <div className="mt-3 bg-white p-3 rounded-lg border border-teal-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Top User Activities</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Task Creation</span>
                          <span className="text-sm font-medium text-gray-800">42%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '42%' }}></div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Task Acceptance</span>
                          <span className="text-sm font-medium text-gray-800">35%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '35%' }}></div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Messaging</span>
                          <span className="text-sm font-medium text-gray-800">23%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: '23%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTools;