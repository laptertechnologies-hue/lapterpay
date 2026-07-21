import { Router } from 'express';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

const codeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code from your authenticator app'),
});

function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(5).toString('hex').toUpperCase().match(/.{1,5}/g)!.join('-')
  );
}

// GET /api/v1/2fa/status — is 2FA enabled for the authenticated merchant?
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const { data } = await supabaseAdmin
      .from('two_factor_secrets')
      .select('enabled, enabled_at')
      .eq('merchant_id', merchantId)
      .maybeSingle();

    return res.json({
      success: true,
      data: { enabled: !!data?.enabled, enabledAt: data?.enabled_at ?? null },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/2fa/setup — generate a new pending TOTP secret + QR code.
// Enrollment isn't finalized (and merchants.two_factor_enabled isn't set)
// until the merchant proves possession by calling /verify with a valid code.
router.post('/setup', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const email = req.user?.email || merchantId;

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, 'LapterPay', secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Upsert as a pending (not-yet-enabled) secret. Re-running setup
    // before verification simply replaces the pending secret.
    const { error } = await supabaseAdmin
      .from('two_factor_secrets')
      .upsert(
        { merchant_id: merchantId, secret, enabled: false, enabled_at: null },
        { onConflict: 'merchant_id' }
      );

    if (error) throw error;

    return res.json({
      success: true,
      data: { qrDataUrl, secret, otpauthUrl },
      message: 'Scan the QR code with Google Authenticator (or any TOTP app), then confirm with a 6-digit code.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/2fa/verify — confirm enrollment with a code from the app.
// On success, flips two_factor_secrets.enabled + merchants.two_factor_enabled
// and issues one-time backup codes (shown to the merchant exactly once).
router.post('/verify', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const { code } = codeSchema.parse(req.body);

    const { data: record, error } = await supabaseAdmin
      .from('two_factor_secrets')
      .select('secret')
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (error || !record) {
      return res.status(400).json({ success: false, error: 'No pending 2FA setup found. Call /2fa/setup first.' });
    }

    const isValid = authenticator.verify({ token: code, secret: record.secret });
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid or expired code. Please try again.' });
    }

    const backupCodes = generateBackupCodes();
    const backupCodesHash = backupCodes.map(hashBackupCode);

    const { error: updateError } = await supabaseAdmin
      .from('two_factor_secrets')
      .update({ enabled: true, enabled_at: new Date().toISOString(), backup_codes_hash: backupCodesHash })
      .eq('merchant_id', merchantId);

    if (updateError) throw updateError;

    const { error: merchantError } = await supabaseAdmin
      .from('merchants')
      .update({ two_factor_enabled: true })
      .eq('id', merchantId);

    if (merchantError) throw merchantError;

    return res.json({
      success: true,
      data: { backupCodes },
      message: 'Two-factor authentication is now enabled. Save these backup codes — they will not be shown again.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/2fa/challenge — verify a code against an already-enabled
// secret (used at login time / for sensitive actions). Accepts either a
// live TOTP code or one of the unused backup codes.
router.post('/challenge', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const rawCode = String(req.body?.code || '').trim();

    const { data: record, error } = await supabaseAdmin
      .from('two_factor_secrets')
      .select('secret, enabled, backup_codes_hash')
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (error || !record || !record.enabled) {
      return res.status(400).json({ success: false, error: '2FA is not enabled on this account.' });
    }

    // Try TOTP first
    if (/^\d{6}$/.test(rawCode) && authenticator.verify({ token: rawCode, secret: record.secret })) {
      return res.json({ success: true, data: { verified: true, method: 'totp' } });
    }

    // Fall back to a backup code (single use — remove it once consumed)
    const normalized = rawCode.toUpperCase();
    const hashed = hashBackupCode(normalized);
    const backupCodes: string[] = record.backup_codes_hash || [];
    if (backupCodes.includes(hashed)) {
      const remaining = backupCodes.filter(c => c !== hashed);
      await supabaseAdmin
        .from('two_factor_secrets')
        .update({ backup_codes_hash: remaining })
        .eq('merchant_id', merchantId);
      return res.json({ success: true, data: { verified: true, method: 'backup_code' } });
    }

    return res.status(400).json({ success: false, error: 'Invalid code.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/2fa/disable — turn 2FA off. Requires a valid current code
// (or backup code) so a hijacked session can't silently disable it.
router.post('/disable', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;
    const rawCode = String(req.body?.code || '').trim();

    const { data: record, error } = await supabaseAdmin
      .from('two_factor_secrets')
      .select('secret, enabled, backup_codes_hash')
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (error || !record || !record.enabled) {
      return res.status(400).json({ success: false, error: '2FA is not currently enabled.' });
    }

    const totpValid = /^\d{6}$/.test(rawCode) && authenticator.verify({ token: rawCode, secret: record.secret });
    const backupValid = (record.backup_codes_hash || []).includes(hashBackupCode(rawCode.toUpperCase()));

    if (!totpValid && !backupValid) {
      return res.status(400).json({ success: false, error: 'Invalid code. 2FA was not disabled.' });
    }

    await supabaseAdmin.from('two_factor_secrets').delete().eq('merchant_id', merchantId);
    await supabaseAdmin.from('merchants').update({ two_factor_enabled: false }).eq('id', merchantId);

    return res.json({ success: true, message: 'Two-factor authentication has been disabled.' });
  } catch (err) {
    next(err);
  }
});

export default router;
