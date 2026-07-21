import { Router } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';
import { authenticate } from '../middlewares/auth';
import { z } from 'zod';

const router = Router();

// Validate key creation input
const createKeySchema = z.object({
  name: z.string().min(1, 'Key name is required').max(100),
  environment: z.enum(['live', 'test'])
});

// GET /api/v1/keys - List keys for the authenticated merchant
router.get('/', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;

    const { data: keys, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, name, key_preview, environment, created_at, last_used_at')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data: keys
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/keys - Create a new API key
router.post('/', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const body = createKeySchema.parse(req.body);

    // Generate full secure key
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const fullKey = `tp_${body.environment}_${randomBytes}`;
    
    // Hash key for DB lookup
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');
    
    // Preview format
    const keyPreview = `${fullKey.substring(0, 12)}...${fullKey.substring(fullKey.length - 4)}`;

    const { data: newKey, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        merchant_id: merchantId,
        name: body.name,
        key_hash: keyHash,
        key_preview: keyPreview,
        environment: body.environment
      })
      .select('id, name, key_preview, environment, created_at')
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'API Key generated successfully. Please copy it now as it will not be displayed again.',
      data: {
        ...newKey,
        secretKey: fullKey // Return the full secret key ONLY ONCE
      }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/keys/:id - Revoke an API key
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const keyId = req.params.id;

    const { error } = await supabaseAdmin
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('merchant_id', merchantId);

    if (error) throw error;

    return res.json({
      success: true,
      message: 'API Key revoked successfully.'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
