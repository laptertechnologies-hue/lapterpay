import { Router } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { authenticate } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();

// Validate webhook setup input
const configureWebhookSchema = z.object({
  url: z.string().url('Must be a valid URL starting with http/https'),
  environment: z.enum(['live', 'test'])
});

// Helper to generate webhook signing secrets
function generateWebhookSecret() {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

// 1. GET /api/v1/webhooks - List webhook endpoints
router.get('/', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;

    const { data: endpoints, error } = await supabaseAdmin
      .from('webhook_endpoints')
      .select('id, url, environment, active, created_at')
      .eq('merchant_id', merchantId);

    if (error) throw error;

    return res.json({
      success: true,
      data: endpoints
    });
  } catch (err) {
    next(err);
  }
});

// 2. POST /api/v1/webhooks - Configure or update a webhook endpoint
router.post('/', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const body = configureWebhookSchema.parse(req.body);

    // Check if there is already an endpoint configured for this merchant + environment
    const { data: existingEndpoint } = await supabaseAdmin
      .from('webhook_endpoints')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('environment', body.environment)
      .limit(1)
      .maybeSingle();

    let result;
    if (existingEndpoint) {
      // Update existing endpoint (update URL and regenerate secret)
      const { data, error } = await supabaseAdmin
        .from('webhook_endpoints')
        .update({
          url: body.url,
          secret_key: generateWebhookSecret()
        })
        .eq('id', existingEndpoint.id)
        .select('id, url, environment, secret_key, active, created_at')
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new webhook endpoint
      const { data, error } = await supabaseAdmin
        .from('webhook_endpoints')
        .insert({
          merchant_id: merchantId,
          url: body.url,
          environment: body.environment,
          secret_key: generateWebhookSecret(),
          active: true
        })
        .select('id, url, environment, secret_key, active, created_at')
        .single();
      
      if (error) throw error;
      result = data;
    }

    return res.json({
      success: true,
      message: 'Webhook endpoint configured successfully.',
      data: result
    });

  } catch (err) {
    next(err);
  }
});

// 3. DELETE /api/v1/webhooks/:id - Delete Webhook configuration
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const endpointId = req.params.id;

    const { error } = await supabaseAdmin
      .from('webhook_endpoints')
      .delete()
      .eq('id', endpointId)
      .eq('merchant_id', merchantId);

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Webhook endpoint deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
});

// 4. GET /api/v1/webhooks/logs - Get webhook callback logs
router.get('/logs', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;

    const { data: logs, error } = await supabaseAdmin
      .from('callback_logs')
      .select('id, transaction_id, payload, response_status, response_body, success, created_at')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return res.json({
      success: true,
      data: logs
    });
  } catch (err) {
    next(err);
  }
});

export default router;
