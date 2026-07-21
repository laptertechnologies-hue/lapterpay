import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';

interface WebhookPayload {
  event: 'payment.completed' | 'payment.failed' | 'payout.completed' | 'payout.failed';
  timestamp: string;
  data: {
    id: string;
    type: 'collection' | 'payout' | 'transfer';
    amount: number;
    fee: number;
    currency: string;
    payment_method: string;
    customer_identifier: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    reference?: string;
    description?: string;
    created_at: string;
    completed_at?: string;
  };
}

/**
 * Dispatch a webhook event to a merchant's configured webhook endpoint
 */
export async function dispatchWebhook(transactionId: string, event: WebhookPayload['event']) {
  try {
    // 1. Fetch transaction details
    const { data: transaction, error: txnError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txnError || !transaction) {
      console.error(`[Webhook] Transaction ${transactionId} not found:`, txnError);
      return;
    }

    const environment = transaction.environment;
    const merchantId = transaction.merchant_id;

    // 2. Fetch active webhook endpoint for this merchant & environment
    const { data: endpoint, error: endpointError } = await supabaseAdmin
      .from('webhook_endpoints')
      .select('id, url, secret_key')
      .eq('merchant_id', merchantId)
      .eq('environment', environment)
      .eq('active', true)
      .limit(1)
      .maybeSingle();

    if (endpointError) {
      console.error(`[Webhook] Error querying webhook endpoint for merchant ${merchantId}:`, endpointError);
      return;
    }

    if (!endpoint) {
      console.log(`[Webhook] No active webhook endpoint found for merchant ${merchantId} in ${environment} mode.`);
      return;
    }

    // 3. Prepare payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: {
        id: transaction.id,
        type: transaction.type,
        amount: parseFloat(transaction.amount),
        fee: parseFloat(transaction.fee),
        currency: transaction.currency,
        payment_method: transaction.payment_method,
        customer_identifier: transaction.customer_identifier,
        status: transaction.status,
        reference: transaction.reference,
        description: transaction.description,
        created_at: transaction.created_at,
        completed_at: transaction.completed_at
      }
    };

    const payloadString = JSON.stringify(payload);

    // 4. Generate HMAC signature to verify authenticity
    // Header format: t=<timestamp>,v1=<signature>
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signaturePayload = `${timestamp}.${payloadString}`;
    const signature = crypto
      .createHmac('sha256', endpoint.secret_key)
      .update(signaturePayload)
      .digest('hex');

    const signatureHeader = `t=${timestamp},v1=${signature}`;

    console.log(`[Webhook] Dispatching to ${endpoint.url} with signature ${signatureHeader}`);

    let responseStatus = 0;
    let responseBody = '';
    let success = false;

    // 5. Send POST request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Tamupay-Webhook-Dispatcher/1.0',
          'x-tamupay-signature': signatureHeader
        },
        body: payloadString,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      responseStatus = response.status;
      responseBody = await response.text();
      success = responseStatus >= 200 && responseStatus < 300;
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      responseBody = fetchErr.message || 'Fetch aborted or host unreachable';
      console.warn(`[Webhook] Delivery failed to ${endpoint.url}:`, responseBody);
    }

    // 6. Record callback log in database (running in background)
    await supabaseAdmin.from('callback_logs').insert({
      merchant_id: merchantId,
      endpoint_id: endpoint.id,
      transaction_id: transactionId,
      payload,
      response_status: responseStatus || null,
      response_body: responseBody.substring(0, 1000), // truncate if too long
      success
    });

    console.log(`[Webhook] Logged webhook dispatch for transaction ${transactionId}. Status: ${responseStatus}, Success: ${success}`);

  } catch (err) {
    console.error(`[Webhook] Unhandled error during webhook dispatch for ${transactionId}:`, err);
  }
}
