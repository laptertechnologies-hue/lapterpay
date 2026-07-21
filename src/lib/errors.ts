export const ERR_NETWORK = 'ERR_NETWORK';
export const ERR_AUTH = 'ERR_AUTH';
export const ERR_PERMISSION = 'ERR_PERMISSION';
export const ERR_NOT_FOUND = 'ERR_NOT_FOUND';
export const ERR_VALIDATION = 'ERR_VALIDATION';
export const ERR_INSUFFICIENT_BALANCE = 'ERR_INSUFFICIENT_BALANCE';
export const ERR_KYC_REQUIRED = 'ERR_KYC_REQUIRED';
export const ERR_SUBSCRIPTION_REQUIRED = 'ERR_SUBSCRIPTION_REQUIRED';
export const ERR_DUPLICATE = 'ERR_DUPLICATE';
export const ERR_TIMEOUT = 'ERR_TIMEOUT';
export const ERR_PAYMENT_FAILED = 'ERR_PAYMENT_FAILED';
export const ERR_SERVER = 'ERR_SERVER';

export class AppError extends Error {
  code: string;
  userMessage: string;
  technical?: string;

  constructor(code: string, userMessage: string, technical?: string) {
    super(userMessage);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.technical = technical;
  }
}

export function formatUserMessage(code: string): string {
  switch (code) {
    case ERR_NETWORK:
      return 'Unable to connect. Please check your internet connection and try again.';
    case ERR_AUTH:
      return 'Your session has expired. Please sign in again to continue.';
    case ERR_PERMISSION:
      return 'You do not have permission to perform this action. Contact your account administrator.';
    case ERR_NOT_FOUND:
      return 'The requested resource was not found.';
    case ERR_VALIDATION:
      return 'Please correct the highlighted errors in the form before submitting.';
    case ERR_INSUFFICIENT_BALANCE:
      return 'Your wallet balance is too low for this transaction. Please top up your float first.';
    case ERR_KYC_REQUIRED:
      return 'Your business is not yet verified. Please upload your business documents to proceed.';
    case ERR_SUBSCRIPTION_REQUIRED:
      return 'You need an active subscription to use this service. Please subscribe first.';
    case ERR_DUPLICATE:
      return 'A record with this information already exists. Please check and try again.';
    case ERR_TIMEOUT:
      return 'The operation took too long to respond. Please check your dashboard history before retrying.';
    case ERR_PAYMENT_FAILED:
      return 'Payment could not be processed. Please verify the details and try again.';
    case ERR_SERVER:
    default:
      return 'An unexpected error occurred. Our team has been notified. Please try again later.';
  }
}

export function sanitizeError(err: any): AppError {
  if (err instanceof AppError) return err;

  const message = err?.message || '';
  const code = err?.code || '';

  // Handle network issues
  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('network')) {
    return new AppError(ERR_NETWORK, formatUserMessage(ERR_NETWORK), message);
  }

  // Handle Supabase/PostgREST error codes
  // reference: https://postgrest.org/en/stable/errors.html or postgres error codes
  if (code === '23505' || message.includes('duplicate key') || message.includes('already exists')) {
    return new AppError(ERR_DUPLICATE, formatUserMessage(ERR_DUPLICATE), message);
  }
  if (code === '42501' || message.includes('permission denied') || message.includes('row-level security')) {
    return new AppError(ERR_PERMISSION, formatUserMessage(ERR_PERMISSION), message);
  }
  if (message.includes('JWT') || message.includes('invalid ticket') || message.includes('AuthApiError')) {
    return new AppError(ERR_AUTH, formatUserMessage(ERR_AUTH), message);
  }

  // Business logic errors (string matched)
  if (message.toLowerCase().includes('insufficient balance') || message.toLowerCase().includes('low balance') || message.toLowerCase().includes('not enough balance')) {
    return new AppError(ERR_INSUFFICIENT_BALANCE, formatUserMessage(ERR_INSUFFICIENT_BALANCE), message);
  }
  if (message.toLowerCase().includes('kyc') || message.toLowerCase().includes('verify business') || message.toLowerCase().includes('unverified business')) {
    return new AppError(ERR_KYC_REQUIRED, formatUserMessage(ERR_KYC_REQUIRED), message);
  }
  if (message.toLowerCase().includes('subscription') || message.toLowerCase().includes('subscribe first') || message.toLowerCase().includes('not subscribed')) {
    return new AppError(ERR_SUBSCRIPTION_REQUIRED, formatUserMessage(ERR_SUBSCRIPTION_REQUIRED), message);
  }

  // Default server error
  return new AppError(ERR_SERVER, formatUserMessage(ERR_SERVER), message);
}
