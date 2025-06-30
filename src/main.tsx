import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import StripeProvider from './components/StripeProvider.tsx';
import { TranslationProvider } from './components/TranslationProvider.tsx';
import { LingoProviderWrapper, loadDictionary } from "lingo.dev/react/client";
import * as Sentry from "@sentry/react";

// Initialize Sentry
Sentry.init({
  dsn: "https://9212e6b7c7de8e29a2a6ad0e5562294d@o4509580473925632.ingest.us.sentry.io/4509580770541568",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for performance monitoring
      // This sets the percentage of transactions that will be traced
      // Lower in production for better performance (e.g., 0.1)
      tracesSampleRate: 0.5,
    }),
    new Sentry.Replay({
      // Capture 10% of all sessions
      sessionSampleRate: 0.1,
      // Capture 100% of sessions with errors
      errorSampleRate: 1.0,
    }),
  ],
  
  // Set environment based on NODE_ENV
  environment: import.meta.env.MODE,
  
  // Enable performance monitoring
  tracesSampleRate: 0.5,
  
  // Capture errors in React components
  beforeSend(event) {
    // Check if it's a development environment
    if (import.meta.env.DEV) {
      console.log("Sentry event:", event);
      // Optionally disable sending in development
      // return null;
    }
    return event;
  },
  
  // Add release information if available
  release: import.meta.env.VITE_APP_VERSION || "hustl@dev",
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>An error has occurred. Our team has been notified.</p>}>
      <LingoProviderWrapper loadDictionary={(locale) => loadDictionary(locale)}>
        <TranslationProvider>
          <StripeProvider>
            <App />
          </StripeProvider>
        </TranslationProvider>
      </LingoProviderWrapper>
    </Sentry.ErrorBoundary>
  </StrictMode>
);