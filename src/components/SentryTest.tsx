import React, { useState } from 'react';
import { Bug, AlertTriangle, Info, Check } from 'lucide-react';
import * as Sentry from "@sentry/react";
import { captureMessage, captureException } from '../lib/sentryUtils';

const SentryTest: React.FC = () => {
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [loading, setLoading] = useState(false);

  const testTranslationError = () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      // Simulate a translation error
      const fakeTranslationError = new Error("Translation failed: Language 'FR' not supported");
      fakeTranslationError.name = "TranslationError";
      
      // Add context to the error
      captureException(fakeTranslationError, {
        tags: {
          component: "TranslationProvider",
          language: "FR",
          errorType: "translation_error"
        },
        extra: {
          attemptedText: "This is some text that failed to translate",
          timestamp: new Date().toISOString()
        }
      });
      
      // Log a breadcrumb for context
      Sentry.addBreadcrumb({
        category: 'translation',
        message: 'User attempted to translate to FR language',
        level: 'info'
      });
      
      setTestResult({
        success: true,
        message: "Translation error successfully sent to Sentry"
      });
    } catch (error) {
      console.error("Error testing Sentry:", error);
      setTestResult({
        success: false,
        message: "Failed to send test error to Sentry"
      });
    } finally {
      setLoading(false);
    }
  };

  const testUnhandledError = () => {
    // This will cause an unhandled error that should be caught by Sentry
    setTimeout(() => {
      const obj: any = null;
      obj.nonExistentMethod();
    }, 100);
    
    setTestResult({
      success: true,
      message: "Unhandled error triggered (check Sentry dashboard)"
    });
  };

  const testSentryMessage = () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      // Send a test message to Sentry
      captureMessage(
        "Test message from SentryTest component", 
        "info",
        {
          tags: {
            component: "SentryTest",
            type: "test_message"
          }
        }
      );
      
      setTestResult({
        success: true,
        message: "Test message successfully sent to Sentry"
      });
    } catch (error) {
      console.error("Error sending test message:", error);
      setTestResult({
        success: false,
        message: "Failed to send test message to Sentry"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center mb-4">
        <Bug className="w-6 h-6 text-[#0038FF] mr-2" />
        <h2 className="text-xl font-bold">Sentry Integration Test</h2>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-700">
              This component allows you to test if Sentry is properly integrated. Click the buttons below to trigger different types of events that should be captured by Sentry.
            </p>
            <p className="text-sm text-blue-700 mt-2">
              After triggering events, check your Sentry dashboard to verify they were captured.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <button
          onClick={testTranslationError}
          disabled={loading}
          className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
        >
          Test Translation Error
        </button>
        
        <button
          onClick={testUnhandledError}
          disabled={loading}
          className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          Test Unhandled Error
        </button>
        
        <button
          onClick={testSentryMessage}
          disabled={loading}
          className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
        >
          Send Test Message
        </button>
      </div>
      
      {testResult && (
        <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start">
            {testResult.success ? (
              <Check className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            )}
            <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {testResult.message}
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-500">
        <p>Note: The translation error test simulates what would happen if a user tried to translate content to French but the service failed.</p>
      </div>
    </div>
  );
};

export default SentryTest;