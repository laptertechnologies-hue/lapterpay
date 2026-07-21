import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * Middleware to restrict payout/withdrawal operations to merchant-whitelisted IP addresses.
 * (Enforced only if the merchant has configured one or more IP whitelist rules).
 */
export async function ipCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const merchant = req.merchant;
    if (!merchant) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required before checking IP whitelist rules.'
      });
    }

    // Extract client IP address
    let clientIP = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    if (clientIP.includes(',')) {
      clientIP = clientIP.split(',')[0].trim();
    }
    
    // Normalize IPv6 mapped IPv4 addresses (e.g. ::ffff:127.0.0.1)
    if (clientIP.startsWith('::ffff:')) {
      clientIP = clientIP.substring(7);
    }

    // Fetch configured IP whitelists for this merchant
    const { data: whitelist, error } = await supabaseAdmin
      .from('ip_whitelists')
      .select('ip_address')
      .eq('merchant_id', merchant.id);

    if (error) {
      console.error('[IP Check] Failed to query whitelists:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error verifying IP access controls.'
      });
    }

    // If the merchant has not configured any IP whitelists, allow the request by default
    if (!whitelist || whitelist.length === 0) {
      return next();
    }

    const whitelistedIps = whitelist.map(w => w.ip_address.trim());
    
    // Check for direct match
    if (whitelistedIps.includes(clientIP)) {
      return next();
    }

    // Block request if IP is not whitelisted
    console.warn(`[IP Check] Blocked unauthorized payout request from IP: ${clientIP} for merchant: ${merchant.id}`);
    return res.status(403).json({
      success: false,
      error: `Access Forbidden: Client IP address (${clientIP}) is not whitelisted for payouts.`
    });

  } catch (err) {
    console.error('IP Check middleware error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred verifying IP whitelist.'
    });
  }
}
