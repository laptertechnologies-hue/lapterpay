import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitInfo>();

// Clean up memory store periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, info] of rateLimitStore.entries()) {
    if (now > info.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 600000);

/**
 * Global rate-limiting middleware
 * Sandbox keys: 60 requests / minute
 * Live keys / Client IPs: 300 requests / minute
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const clientIP = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  
  // Resolve unique identifier: API key or client IP
  const apiKey = req.headers['x-api-key'] as string;
  const isBearerKey = req.headers.authorization?.startsWith('Bearer tp_');
  const fullKey = apiKey || (isBearerKey ? req.headers.authorization?.substring(7) : null);
  
  const id = fullKey || clientIP;
  const isSandbox = fullKey?.includes('_test_') || false;

  const limit = isSandbox ? 60 : 300; // 60 requests/min for test, 300 for live
  const windowMs = 60000; // 1 minute window

  const now = Date.now();
  let limitInfo = rateLimitStore.get(id);

  if (!limitInfo || now > limitInfo.resetTime) {
    limitInfo = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitStore.set(id, limitInfo);
    
    // Set headers
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - 1);
    res.setHeader('X-RateLimit-Reset', Math.ceil(limitInfo.resetTime / 1000));
    return next();
  }

  if (limitInfo.count >= limit) {
    const secondsLeft = Math.ceil((limitInfo.resetTime - now) / 1000);
    res.setHeader('Retry-After', secondsLeft);
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', Math.ceil(limitInfo.resetTime / 1000));
    
    return res.status(429).json({
      success: false,
      error: `Too many requests. Rate limit exceeded. Please try again in ${secondsLeft} seconds.`
    });
  }

  limitInfo.count += 1;
  rateLimitStore.set(id, limitInfo);

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', limit - limitInfo.count);
  res.setHeader('X-RateLimit-Reset', Math.ceil(limitInfo.resetTime / 1000));
  
  next();
}
