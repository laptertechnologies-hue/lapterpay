import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticate } from '../middlewares/auth';
import { ipCheck } from '../middlewares/ipCheck';
import { idempotency } from '../middlewares/idempotency';
import { dispatchWebhook } from '../services/webhooks';
import { z } from 'zod';

const router = Router();

// Validation for payout
const initializePayoutSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  payment_method: z.enum(['MTN MoMo', 'Airtel Money', 'Bank Transfer']),
  customer_identifier: z.string().min(3, 'Destination account identifier is required'),
  description: z.string().optional(),
  reference: z.string().optional()
});

// Validation for wallet transfer. Callers may identify the destination
// either by merchant ID (UUID) or by the human-facing business account
// number shown in the dashboard — at least one is required. Resolving
// the account number happens server-side (via the service-role client)
// since merchants' RLS policy only allows a merchant to read their own
// row, so this lookup cannot be done safely from the browser.
const walletTransferSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  destination_merchant_id: z.string().uuid('Invalid destination merchant ID').optional(),
  destination_account_number: z.string().min(3, 'Invalid destination account number').optional(),
  description: z.string().optional()
}).refine(data => data.destination_merchant_id || data.destination_account_number, {
  message: 'Either destination_merchant_id or destination_account_number is required',
  path: ['destination_account_number']
});

// Validation for float top-up
const topupFloatSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('UGX')
});

// Helper to generate transaction IDs, e.g. TXN20260623000001
function generateTransactionId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TXN${dateStr}${rand}`;
}

// 1. GET /api/v1/float/balance - Retrieve wallets balance
router.get('/balance', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;

    const { data: wallets, error } = await supabaseAdmin
      .from('wallets')
      .select('environment, balance, currency')
      .eq('merchant_id', merchantId);

    if (error) throw error;

    return res.json({
      success: true,
      data: wallets
    });
  } catch (err) {
    next(err);
  }
});

// 2. POST /api/v1/float/topup - Simulate topping up test float balance
router.post('/topup', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const environment = req.merchant!.environment;
    const body = topupFloatSchema.parse(req.body);

    if (environment !== 'test') {
      return res.status(403).json({
        success: false,
        error: 'Top-ups can only be simulated in test/sandbox environment.'
      });
    }

    // Retrieve test wallet
    const { data: wallet, error: getErr } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('merchant_id', merchantId)
      .eq('environment', 'test')
      .eq('currency', body.currency)
      .single();

    if (getErr || !wallet) {
      return res.status(404).json({
        success: false,
        error: 'Test wallet not found.'
      });
    }

    const newBalance = parseFloat(wallet.balance) + body.amount;

    const { data: updatedWallet, error: updateErr } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id)
      .select('environment, balance, currency')
      .single();

    if (updateErr) throw updateErr;

    // Create a deposit transaction record
    const txnId = generateTransactionId();
    await supabaseAdmin.from('transactions').insert({
      id: txnId,
      merchant_id: merchantId,
      type: 'collection',
      amount: body.amount,
      fee: 0,
      currency: body.currency,
      payment_method: 'Float Deposit',
      customer_identifier: 'System',
      status: 'completed',
      environment: 'test',
      description: `Float top-up simulation of ${body.amount} ${body.currency}`,
      completed_at: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'Float topped up successfully.',
      data: updatedWallet
    });

  } catch (err) {
    next(err);
  }
});

// 3. POST /api/v1/payouts/initialize - Process a payout (Disbursement)
router.post('/payouts/initialize', authenticate, ipCheck, idempotency, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const environment = req.merchant!.environment;
    const body = initializePayoutSchema.parse(req.body);

    const currency = 'UGX'; // Default currency

    // 1. Calculate Payout fees
    let fee = 1000; // Flat fee default
    if (body.payment_method === 'Bank Transfer') {
      fee = 5000;
    } else if (body.amount > 100000) {
      fee = Math.floor(body.amount * 0.01); // 1% for MM above 100k
    }

    const totalDeduction = body.amount + fee;

    // 2. Atomically deduct balance using RPC (preventing double spending / negative balances)
    const { data: success, error: rpcError } = await supabaseAdmin.rpc('increment_wallet_balance', {
      p_merchant_id: merchantId,
      p_environment: environment,
      p_currency: currency,
      p_amount: -totalDeduction // Negative amount to subtract
    });

    if (rpcError || !success) {
      return res.status(400).json({
        success: false,
        error: `Insufficient float balance or wallet not found to process payout of ${totalDeduction} UGX.`
      });
    }

    // 4. Create payout transaction record (pending)
    const txnId = generateTransactionId();
    const { data: transaction, error: insertError } = await supabaseAdmin
      .from('transactions')
      .insert({
        id: txnId,
        merchant_id: merchantId,
        type: 'payout',
        amount: body.amount,
        fee,
        currency,
        payment_method: body.payment_method,
        customer_identifier: body.customer_identifier,
        status: 'pending',
        environment,
        reference: body.reference || null,
        description: body.description || `Payout to ${body.customer_identifier} via ${body.payment_method}`
      })
      .select('*')
      .single();

    if (insertError) throw insertError;

    // For sandbox/test environment, automatically approve/process the payout
    if (environment === 'test') {
      setTimeout(async () => {
        try {
          let status: 'completed' | 'failed' = 'completed';

          // Simulate payout failure for amount = 9999
          if (body.amount === 9999) {
            status = 'failed';
            // Refund wallet balance atomically using RPC
            await supabaseAdmin.rpc('increment_wallet_balance', {
              p_merchant_id: merchantId,
              p_environment: 'test',
              p_currency: currency,
              p_amount: totalDeduction
            });
          }

          // Update transaction
          await supabaseAdmin
            .from('transactions')
            .update({ 
              status, 
              completed_at: status === 'completed' ? new Date().toISOString() : null 
            })
            .eq('id', txnId);

          // Dispatch Webhook
          const event = status === 'completed' ? 'payout.completed' : 'payout.failed';
          await dispatchWebhook(txnId, event);

        } catch (simErr) {
          console.error('[Payout Simulator] Process failed:', simErr);
        }
      }, 1500); // 1.5 seconds delay for background simulation
    }

    return res.status(201).json({
      success: true,
      message: 'Payout request initiated successfully.',
      data: {
        transactionId: transaction.id,
        status: transaction.status,
        amount: parseFloat(transaction.amount),
        fee: parseFloat(transaction.fee),
        currency: transaction.currency,
        payment_method: transaction.payment_method,
        customer_identifier: transaction.customer_identifier
      }
    });

  } catch (err) {
    next(err);
  }
});

// 4. POST /api/v1/transfers/wallet - Transfer float to another merchant (Peer-to-Peer Wallet Transfer)
router.post('/transfers/wallet', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const environment = req.merchant!.environment;
    const body = walletTransferSchema.parse(req.body);

    const currency = 'UGX';

    // 1. Resolve the destination merchant ID — either given directly, or
    // looked up from the business account number using the service-role
    // client (bypasses RLS; merchants cannot read each other's rows directly).
    let destinationMerchantId = body.destination_merchant_id;
    if (!destinationMerchantId && body.destination_account_number) {
      const { data: destMerchant, error: destMerchantErr } = await supabaseAdmin
        .from('merchants')
        .select('id')
        .eq('account_number', body.destination_account_number)
        .single();

      if (destMerchantErr || !destMerchant) {
        return res.status(404).json({
          success: false,
          error: 'No business found with that account number.'
        });
      }
      destinationMerchantId = destMerchant.id;
    }

    if (merchantId === destinationMerchantId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot transfer float to yourself.'
      });
    }

    // 2. Fetch destination wallet to check its existence first
    const { data: destWallet, error: destError } = await supabaseAdmin
      .from('wallets')
      .select('id')
      .eq('merchant_id', destinationMerchantId)
      .eq('environment', environment)
      .eq('currency', currency)
      .single();

    if (destError || !destWallet) {
      return res.status(400).json({
        success: false,
        error: 'Destination merchant does not have a wallet set up.'
      });
    }

    // 3. Deduct atomically from source using RPC
    const { data: deductSuccess, error: deductError } = await supabaseAdmin.rpc('increment_wallet_balance', {
      p_merchant_id: merchantId,
      p_environment: environment,
      p_currency: currency,
      p_amount: -body.amount
    });

    if (deductError || !deductSuccess) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance to transfer ${body.amount} UGX.`
      });
    }

    // 4. Add atomically to destination using RPC
    const { data: creditSuccess, error: creditError } = await supabaseAdmin.rpc('increment_wallet_balance', {
      p_merchant_id: destinationMerchantId,
      p_environment: environment,
      p_currency: currency,
      p_amount: body.amount
    });

    if (creditError || !creditSuccess) {
      // Rollback deduction if destination credit fails (compensating transaction rollback)
      await supabaseAdmin.rpc('increment_wallet_balance', {
        p_merchant_id: merchantId,
        p_environment: environment,
        p_currency: currency,
        p_amount: body.amount
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to credit destination wallet. Transfer rolled back.'
      });
    }

    // 5. Create Transaction record (type=transfer)
    const txnId = generateTransactionId();
    const { data: transaction, error: insertError } = await supabaseAdmin
      .from('transactions')
      .insert({
        id: txnId,
        merchant_id: merchantId,
        type: 'transfer',
        amount: body.amount,
        fee: 0,
        currency,
        payment_method: 'Wallet Transfer',
        customer_identifier: `To Merchant ID: ${destinationMerchantId}`,
        status: 'completed',
        environment,
        description: body.description || `Wallet transfer to merchant ID ${destinationMerchantId}`,
        completed_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (insertError) throw insertError;

    // Create a receipt transaction for destination merchant
    const destTxnId = generateTransactionId();
    await supabaseAdmin.from('transactions').insert({
      id: destTxnId,
      merchant_id: destinationMerchantId,
      type: 'collection',
      amount: body.amount,
      fee: 0,
      currency,
      payment_method: 'Wallet Transfer',
      customer_identifier: `From Merchant ID: ${merchantId}`,
      status: 'completed',
      environment,
      description: `Wallet transfer received from merchant ID ${merchantId}`,
      completed_at: new Date().toISOString()
    });

    // Fetch updated balance for source wallet to return to client
    const { data: sourceWallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('merchant_id', merchantId)
      .eq('environment', environment)
      .eq('currency', currency)
      .single();

    const newSrcBalance = sourceWallet ? parseFloat(sourceWallet.balance) : 0;

    return res.json({
      success: true,
      message: 'Wallet transfer completed successfully.',
      data: {
        transactionId: transaction.id,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency,
        new_balance: newSrcBalance
      }
    });

  } catch (err) {
    next(err);
  }
});

export default router;
