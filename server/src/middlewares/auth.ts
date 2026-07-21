import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../config/supabase';

// Extend Express Request interface to include merchant & user info
declare global {
  namespace Express {
    interface Request {
      merchant?: {
        id: string;
        environment: 'live' | 'test';
      };
      user?: any;
    }
  }
}

/**
 * Middleware to authenticate requests using:
 * 1. API Keys (x-api-key or Bearer tp_live_... / tp_test_...)
 * 2. Supabase Access Tokens (Bearer JWT) for dashboard requests
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    let token = '';
    
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Check x-api-key header
    const apiKeyHeader = req.headers['x-api-key'];
    if (apiKeyHeader) {
      token = apiKeyHeader as string;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication credentials are required. Use x-api-key or Authorization Bearer header.'
      });
    }

    // A. Verify if it's an API Key (Lapterpay API keys start with 'tp_')
    if (token.startsWith('tp_')) {
      const hashedKey = crypto.createHash('sha256').update(token).digest('hex');

      // Query database for the active api key
      const { data: apiKeyData, error } = await supabaseAdmin
        .from('api_keys')
        .select('merchant_id, environment')
        .eq('key_hash', hashedKey)
        .single();

      if (error || !apiKeyData) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or revoked API key.'
        });
      }

      // Update last used timestamp in the background
      supabaseAdmin
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_hash', hashedKey)
        .then(({ error }) => {
          if (error) console.error('Failed to update API key last used time:', error);
        });

      req.merchant = {
        id: apiKeyData.merchant_id,
        environment: apiKeyData.environment as 'live' | 'test',
      };
      
      return next();
    }

    // B. Otherwise, treat as Supabase Auth JWT (for Dashboard actions calling custom server endpoints)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token.'
      });
    }

    // Resolve merchant profile
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, currency')
      .eq('id', user.id)
      .single();

    if (merchantError || !merchant) {
      // If merchant record doesn't exist, create it on-the-fly (e.g. if registered through Supabase directly)
      const email = user.email || '';
      const businessName = user.user_metadata?.business_name || email.split('@')[0] || 'My Business';
      
      const { data: newMerchant, error: insertError } = await supabaseAdmin
        .from('merchants')
        .insert({
          id: user.id,
          business_name: businessName,
          currency: 'UGX'
        })
        .select()
        .single();

      if (insertError || !newMerchant) {
        return res.status(500).json({
          success: false,
          error: 'Failed to initialize merchant profile.'
        });
      }

      req.merchant = {
        id: newMerchant.id,
        environment: 'test' // default to test for dashboard API requests
      };
    } else {
      req.merchant = {
        id: merchant.id,
        environment: 'test' // default to test for dashboard API requests
      };
    }

    req.user = user;
    return next();

  } catch (err: any) {
    console.error('Authentication middleware error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during authentication.'
    });
  }
}
