import * as Sentry from "@sentry/react";

/**
 * Utility functions for Sentry error tracking
 */

/**
 * Capture an exception with Sentry
 * @param error The error to capture
 * @param context Additional context to include with the error
 */
export const captureException = (error: unknown, context?: Record<string, any>): void => {
  console.error("Error captured:", error);
  
  Sentry.captureException(error, {
    contexts: {
      ...context
    }
  });
};

/**
 * Capture a message with Sentry
 * @param message The message to capture
 * @param level The severity level
 * @param context Additional context to include with the message
 */
export const captureMessage = (
  message: string, 
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, any>
): void => {
  console.log(`[${level}] ${message}`);
  
  Sentry.captureMessage(message, {
    level,
    contexts: {
      ...context
    }
  });
};

/**
 * Set user information for Sentry
 * @param user User information
 */
export const setUser = (user: { id: string; email?: string; username?: string }): void => {
  Sentry.setUser(user);
};

/**
 * Clear user information from Sentry
 */
export const clearUser = (): void => {
  Sentry.setUser(null);
};

/**
 * Start a new transaction for performance monitoring
 * @param name Transaction name
 * @param op Operation type
 */
export const startTransaction = (name: string, op: string): Sentry.Transaction => {
  return Sentry.startTransaction({
    name,
    op
  });
};

/**
 * Set a tag for the current scope
 * @param key Tag key
 * @param value Tag value
 */
export const setTag = (key: string, value: string): void => {
  Sentry.setTag(key, value);
};

/**
 * Add breadcrumb to the current scope
 * @param breadcrumb Breadcrumb data
 */
export const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb): void => {
  Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Wrap a component with Sentry error boundary
 * @param component The component to wrap
 * @param options Error boundary options
 */
export const withErrorBoundary = <P extends object>(
  component: React.ComponentType<P>,
  options?: Sentry.ErrorBoundaryOptions
): React.ComponentType<P> => {
  return Sentry.withErrorBoundary(component, options);
};

/**
 * Create a Sentry error boundary component
 * @param options Error boundary options
 */
export const ErrorBoundary = Sentry.ErrorBoundary;