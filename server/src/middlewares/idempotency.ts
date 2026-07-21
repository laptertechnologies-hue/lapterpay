import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';

/**
 * Middleware to enforce API idempotency.
 * Prevents duplicate transactions by checking and caching responses using the 'Idempotency-Key' header.
 */
export async function idempotency(req: Request, res: Response, next: NextFunction) {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const merchant = req.merchant;

    // If no key is provided, bypass idempotency check
    if (!idempotencyKey) {
      return next();
    }

    if (!merchant) {
      return res.status(401).json({
        success: false,
        error: 'Authentication is required before verifying idempotency keys.'
      });
    }

    // Hash the request path and body to detect payload mismatches
    const payloadString = req.path + '|' + JSON.stringify(req.body || {});
    const requestHash = crypto.createHash('sha256').update(payloadString).digest('hex');

    // Query DB for cached response
    const { data: cachedRecord, error } = await supabaseAdmin
      .from('idempotency_keys')
      .select('request_hash, response_status, response_body')
      .eq('merchant_id', merchant.id)
      .eq('idempotency_key', idempotencyKey)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[Idempotency] Failed to query keys:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error verifying request idempotency.'
      });
    }

    if (cachedRecord) {
      // 1. Check if the payload matches the original request
      if (cachedRecord.request_hash !== requestHash) {
        return res.status(400).json({
          success: false,
          error: "Idempotency Key Mismatch: The key has already been used for a request with a different payload."
        });
      }

      // 2. Replay cached response
      console.log(`[Idempotency] Replaying cached response for key: ${idempotencyKey}`);
      return res.status(cachedRecord.response_status).json(cachedRecord.response_body);
    }

    // Override res.json to capture response payload and cache it before sending
    const originalJson = res.json;

    res.json = function (bodyData: any): Response {
      const statusCode = res.statusCode || 200;

      // Only cache successful or non-server-error responses (2xx and 4xx, bypass 5xx caching)
      if (statusCode < 500) {
        // Run async insert in background without blocking current request thread
        supabaseAdmin
          .from('idempotency_keys')
          .insert({
            merchant_id: merchant.id,
            idempotency_key: idempotencyKey,
            request_path: req.path,
            request_hash: requestHash,
            response_status: statusCode,
            response_body: bodyData
          })
          .then(({ error }) => {
            if (error) console.error('[Idempotency] Failed to cache response key:', error);
          });
      }

      // Call original Express res.json
      return originalJson.call(this, bodyData);
    };

    return next();

  } catch (err) {
    console.error('Idempotency middleware error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred verifying request idempotency.'
    });
  }
}
