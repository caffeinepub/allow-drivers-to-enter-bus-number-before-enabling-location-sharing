/**
 * Normalizes backend errors into user-friendly messages.
 * Handles trapped calls, rejected promises, and other backend errors.
 */
export function normalizeBackendError(error: unknown): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;
    
    // Handle authorization/trap errors
    if (message.includes('Unauthorized')) {
      return message;
    }
    
    // Handle other common backend errors
    if (message.includes('Actor not available')) {
      return 'Backend service is not available. Please try again.';
    }
    
    return message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle objects with message property
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  // Fallback
  return 'An unexpected error occurred. Please try again.';
}
