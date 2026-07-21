import { supabase } from './supabase';
import { sanitizeError } from './errors';

const API_BASE = '/api/v1';

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

/**
 * Robust API helper with retries, validation, error mapping, and standardized structures.
 */
async function request<T>(path: string, options: RequestInit = {}, retriesRemaining = 1): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // Handle 401 Session Expiry
    if (response.status === 401) {
      await supabase.auth.signOut();
      window.location.href = '/login?expired=true';
      throw new Error('Your session has expired. Please sign in again.');
    }

    const body = await response.json();

    if (!response.ok) {
      // Map API technical error message into AppError
      const errorMsg = body?.message || body?.error || `Server responded with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return {
      success: true,
      data: body.data ?? body,
      message: body.message,
    };
  } catch (err: any) {
    if (retriesRemaining > 0 && err.message?.includes('Failed to fetch')) {
      // Retry transient network errors once after 1.2 seconds
      await new Promise(resolve => setTimeout(resolve, 1200));
      return request<T>(path, options, retriesRemaining - 1);
    }
    // Convert to structured user-friendly AppError
    throw sanitizeError(err);
  }
}

export const api = {
  // Float Balance Operations
  async getBalance() {
    return request<{ balance: number; currency: string }>(`/float/balance`);
  },
  
  async topupFloat(amount: number) {
    return request<any>(`/float/topup`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  },

  // Payments / Collections
  async getPayments() {
    return request<any[]>(`/payments`);
  },

  async initializePayment(data: {
    amount: number;
    payment_method: string;
    customer_identifier: string;
    description?: string;
    reference?: string;
  }) {
    return request<any>(`/payments/initialize`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async simulateCallback(transactionId: string, status: 'completed' | 'failed') {
    return request<any>(`/payments/${transactionId}/simulate-callback`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  },

  // Payouts / Disbursements
  async initializePayout(data: {
    amount: number;
    payment_method: string;
    customer_identifier: string;
    description?: string;
    reference?: string;
  }) {
    return request<any>(`/float/payouts/initialize`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Wallet peer-to-peer transfer. Identify the destination by its
  // human-facing business account number (preferred — this is what's
  // shown in the dashboard) or, if already known, its merchant ID.
  async walletTransfer(data: {
    amount: number;
    destination_account_number?: string;
    destination_merchant_id?: string;
    description?: string;
  }) {
    return request<any>(`/float/transfers/wallet`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // API keys
  async getApiKeys() {
    return request<any[]>(`/keys`);
  },

  async generateApiKey(name: string, environment: 'live' | 'test') {
    return request<any>(`/keys`, {
      method: 'POST',
      body: JSON.stringify({ name, environment })
    });
  },

  async deleteApiKey(id: string) {
    return request<any>(`/keys/${id}`, {
      method: 'DELETE'
    });
  },

  // Webhooks Configuration
  async getWebhooks() {
    return request<any[]>(`/webhooks`);
  },

  async configureWebhook(url: string, environment: 'live' | 'test') {
    return request<any>(`/webhooks`, {
      method: 'POST',
      body: JSON.stringify({ url, environment })
    });
  },

  async deleteWebhook(id: string) {
    return request<any>(`/webhooks/${id}`, {
      method: 'DELETE'
    });
  },

  async getWebhookLogs() {
    return request<any[]>(`/webhooks/logs`);
  }
};
