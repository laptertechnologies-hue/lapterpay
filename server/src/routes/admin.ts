import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; username: string };
    }
  }
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Middleware: real, server-verified admin session check. Replaces the old
// `localStorage['super_admin_authenticated'] === 'true'` client-only gate,
// which anyone could forge from devtools without ever knowing a password.
export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';

    if (!token) {
      return res.status(401).json({ success: false, error: 'Admin authentication required.' });
    }

    const tokenHash = hashToken(token);
    const { data: session, error } = await supabaseAdmin
      .from('super_admin_sessions')
      .select('super_admin_id, expires_at, super_admins(username)')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error || !session || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ success: false, error: 'Admin session expired or invalid. Please sign in again.' });
    }

    const adminRecord = Array.isArray(session.super_admins) ? session.super_admins[0] : session.super_admins;

    req.admin = { id: session.super_admin_id, username: (adminRecord as any)?.username || 'admin' };
    return next();
  } catch (err) {
    next(err);
  }
}

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST /api/v1/admin/login — verifies credentials server-side against the
// existing public.verify_super_admin RPC (bcrypt comparison happens inside
// Postgres, the raw password never touches any table), then issues a real
// session token stored (hashed) in super_admin_sessions.
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const { data: isValid, error: rpcError } = await supabaseAdmin.rpc('verify_super_admin', {
      p_username: username,
      p_password: password,
    });

    if (rpcError) throw rpcError;

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid super admin credentials.' });
    }

    const { data: adminRow, error: lookupError } = await supabaseAdmin
      .from('super_admins')
      .select('id, username')
      .eq('username', username)
      .single();

    if (lookupError || !adminRow) {
      return res.status(500).json({ success: false, error: 'Admin account lookup failed.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

    const { error: sessionError } = await supabaseAdmin.from('super_admin_sessions').insert({
      super_admin_id: adminRow.id,
      token_hash: tokenHash,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] || null,
      expires_at: expiresAt,
    });

    if (sessionError) throw sessionError;

    return res.json({
      success: true,
      data: { token, username: adminRow.username, expiresAt },
      message: 'Authenticated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/me — used by AdminLayout on mount to confirm the
// stored token is still a real, unexpired, server-issued session.
router.get('/me', authenticateAdmin, async (req, res) => {
  return res.json({ success: true, data: { username: req.admin!.username } });
});

// POST /api/v1/admin/logout — invalidate the session server-side too (not
// just clearing localStorage), so a copied token can't be reused.
router.post('/logout', authenticateAdmin, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    if (token) {
      await supabaseAdmin.from('super_admin_sessions').delete().eq('token_hash', hashToken(token));
    }
    return res.json({ success: true, message: 'Signed out.' });
  } catch (err) {
    next(err);
  }
});

export default router;
