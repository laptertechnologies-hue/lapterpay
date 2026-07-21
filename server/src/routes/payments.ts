import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticate } from '../middlewares/auth';
import { idempotency } from '../middlewares/idempotency';
import { dispatchWebhook } from '../services/webhooks';
import { z } from 'zod';

const router = Router();

// Validation schema for payment initialization
const initializePaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('UGX'),
  payment_method: z.enum(['MTN MoMo', 'Airtel Money', 'Visa Card', 'Mastercard', 'Bank Transfer']),
  customer_identifier: z.string().min(3, 'Customer identifier is required (e.g. mobile number or card preview)'),
  description: z.string().optional(),
  reference: z.string().optional()
});

// Helper to generate transaction IDs, e.g. TXN20260623000001
function generateTransactionId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `TXN${dateStr}${rand}`;
}

// Helper to calculate transaction fees based on type and payment method
function calculateFee(amount: number, type: 'collection' | 'payout', method: string) {
  if (type === 'payout') {
    if (method.includes('Bank')) return 5000; // Bank transfer flat fee
    return Math.floor(amount * 0.01); // 1% mobile money payout fee
  }
  
  // Collections
  if (method.includes('Visa') || method.includes('Mastercard')) {
    return Math.floor(amount * 0.03); // 3% Card collection fee
  }
  return Math.floor(amount * 0.01); // 1% Mobile Money collection fee
}

// 1. GET /api/v1/payments - List merchant transactions
router.get('/', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const environment = req.merchant!.environment;

    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('merchant_id', merchantId)
      .eq('environment', environment)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data: transactions
    });
  } catch (err) {
    next(err);
  }
});

// 2. POST /api/v1/payments/initialize - Initialize a payment (Collection)
router.post('/initialize', authenticate, idempotency, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const environment = req.merchant!.environment;
    const body = initializePaymentSchema.parse(req.body);

    const txnId = generateTransactionId();
    const fee = calculateFee(body.amount, 'collection', body.payment_method);

    // Insert transaction with "pending" status
    const { data: transaction, error: insertError } = await supabaseAdmin
      .from('transactions')
      .insert({
        id: txnId,
        merchant_id: merchantId,
        type: 'collection',
        amount: body.amount,
        fee,
        currency: body.currency,
        payment_method: body.payment_method,
        customer_identifier: body.customer_identifier,
        status: 'pending',
        environment,
        reference: body.reference || null,
        description: body.description || `Collection via ${body.payment_method}`
      })
      .select('*')
      .single();

    if (insertError) throw insertError;

    // For sandbox/test environment, automatically approve/process the transaction after a slight delay
    if (environment === 'test') {
      setTimeout(async () => {
        try {
          // 1. Update wallet balance atomically for collections
          const netAmount = body.amount - fee;

          const { data: success, error: rpcError } = await supabaseAdmin.rpc('increment_wallet_balance', {
            p_merchant_id: merchantId,
            p_environment: 'test',
            p_currency: body.currency,
            p_amount: netAmount
          });

          if (rpcError || !success) {
            console.error('[Simulator] Failed to atomically credit test wallet:', rpcError);
          }

          // 2. Mark transaction as completed
          await supabaseAdmin
            .from('transactions')
            .update({ 
              status: 'completed', 
              completed_at: new Date().toISOString() 
            })
            .eq('id', txnId);

          // 3. Dispatch webhook callback
          await dispatchWebhook(txnId, 'payment.completed');
        } catch (simErr) {
          console.error('[Simulator] Auto-approval failed:', simErr);
        }
      }, 1000); // 1-second delay for background simulation
    }

    return res.status(201).json({
      success: true,
      message: 'Payment collection initialized successfully.',
      data: {
        transactionId: transaction.id,
        status: transaction.status,
        amount: parseFloat(transaction.amount),
        fee: parseFloat(transaction.fee),
        currency: transaction.currency,
        payment_method: transaction.payment_method,
        customer_identifier: transaction.customer_identifier,
        checkout_url: `https://checkout.lapterpay.com/pay/${transaction.id}`
      }
    });

  } catch (err) {
    next(err);
  }
});

// 3. GET /api/v1/payments/:id - Get payment details
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const environment = req.merchant!.environment;
    const txnId = req.params.id;

    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', txnId)
      .eq('merchant_id', merchantId)
      .eq('environment', environment)
      .single();

    if (error || !transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found.'
      });
    }

    return res.json({
      success: true,
      data: transaction
    });
  } catch (err) {
    next(err);
  }
});

// 4. POST /api/v1/payments/:id/simulate-callback - Manually force complete/fail in test mode
router.post('/:id/simulate-callback', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const txnId = req.params.id;
    const { status } = req.body; // 'completed' or 'failed'

    if (!['completed', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status must be 'completed' or 'failed'."
      });
    }

    // Retrieve transaction
    const { data: transaction, error: getErr } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', txnId)
      .eq('merchant_id', merchantId)
      .single();

    if (getErr || !transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found.'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Transaction is already in status: ${transaction.status}`
      });
    }

    const netAmount = parseFloat(transaction.amount) - parseFloat(transaction.fee);

    if (status === 'completed') {
      // Top up merchant wallet balance atomically
      const { data: success, error: rpcError } = await supabaseAdmin.rpc('increment_wallet_balance', {
        p_merchant_id: merchantId,
        p_environment: transaction.environment,
        p_currency: transaction.currency,
        p_amount: netAmount
      });

      if (rpcError || !success) {
        console.error('[Callback Simulation] Failed to credit wallet atomically:', rpcError);
        return res.status(500).json({
          success: false,
          error: 'Failed to atomically credit balance.'
        });
      }
    }

    // Update status
    const { data: updatedTxn, error: updateErr } = await supabaseAdmin
      .from('transactions')
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', txnId)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    // Dispatch webhook
    const event = status === 'completed' ? 'payment.completed' : 'payment.failed';
    await dispatchWebhook(txnId, event);

    return res.json({
      success: true,
      message: `Transaction simulated as ${status}. Webhook dispatched.`,
      data: updatedTxn
    });

  } catch (err) {
    next(err);
  }
});

export default router;
