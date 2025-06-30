import React, { useState } from 'react';
import { Bug, AlertTriangle } from 'lucide-react';
import * as Sentry from "@sentry/react";
import { captureException, captureMessage } from '../lib/sentryUtils';

interface ErrorBoundaryTestProps {
  showControls?: boolean;
}

// Component that can throw different types of errors for testing
const ErrorBoundaryTest: React.FC<ErrorBoundaryTestProps> = ({ showControls = true }) => {
  const [errorType, setErrorType] = useState<'none' | 'handled' | 'unhandled' | 'message'>('none');

  const throwHandledError = () => {
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
          additionalData: 'This is a test handled error'
        }
      });
      
      // Show a user-friendly message
      alert('A handled error was captured and sent to Sentry');
    }
  };

  const throwUnhandledError = () => {
    // This will cause an unhandled error that will be caught by Sentry's ErrorBoundary
    setTimeout(() => {
      const obj: any = null;
      obj.nonExistentMethod();
    }, 100);
  };

  const sendTestMessage = () => {
    // Send a test message to Sentry
    captureMessage(
      "Test message from ErrorBoundaryTest component", 
      "info",
      {
        tags: {
          source: 'error_boundary_test',
          type: 'test_message'
        }
      }
    );
    
    alert('A test message was sent to Sentry');
  };

  if (errorType === 'unhandled') {
    // This will throw an error immediately when the component renders
    throw new Error("This is an intentional unhandled error for testing");
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center mb-4">
        <Bug className="w-6 h-6 text-red-500 mr-2" />
        <h2 className="text-xl font-bold">Sentry Error Testing</h2>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-yellow-700">
            This component allows you to test Sentry error reporting. Use the buttons below to trigger different types of errors.
          </p>
        </div>
      </div>
      
      {showControls && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={throwHandledError}
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Test Handled Error
          </button>
          
          <button
            onClick={throwUnhandledError}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
          >
            Test Unhandled Error
          </button>
          
          <button
            onClick={sendTestMessage}
            className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
          >
            Send Test Message
          </button>
          
          <button
            onClick={() => setErrorType('unhandled')}
            className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors"
          >
            Throw Render Error
          </button>
        </div>
      )}
      
      {!showControls && (
        <button
          onClick={() => {throw new Error("This is your first error!");}}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Break the world
        </button>
      )}
    </div>
  );
};

// Wrap the component with Sentry's error boundary
export default Sentry.withErrorBoundary(ErrorBoundaryTest, {
  fallback: (
    <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-red-700 mb-2">Something went wrong</h3>
      <p className="text-red-600">
        An error occurred in the error testing component. Our team has been notified.
      </p>
    </div>
  ),
});