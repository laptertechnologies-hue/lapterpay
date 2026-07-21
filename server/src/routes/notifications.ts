import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { supabaseAdmin } from '../config/supabase';
import { buildWelcomeEmail } from '../services/emailTemplates';
import { sendMail } from '../services/mailer';

const router = Router();

// POST /api/v1/notifications/welcome — send the welcome email for the
// authenticated merchant. Safe to call once right after registration;
// idempotent-ish in that it just re-sends (email_logs keeps every attempt).
router.post('/welcome', authenticate, async (req, res, next) => {
  try {
    const merchantId = req.merchant!.id;

    const { data: merchant, error } = await supabaseAdmin
      .from('merchants')
      .select('business_name, account_number')
      .eq('id', merchantId)
      .single();

    if (error || !merchant) {
      return res.status(404).json({ success: false, error: 'Merchant profile not found.' });
    }

    const email = req.user?.email;
    if (!email) {
      return res.status(400).json({ success: false, error: 'No email address on the authenticated session.' });
    }

    const fullName = req.user?.user_metadata?.contact_phone
      ? merchant.business_name
      : merchant.business_name;

    const { subject, html, text } = buildWelcomeEmail({
      businessName: merchant.business_name,
      fullName,
      accountNumber: merchant.account_number || 'Pending',
      email,
    });

    const result = await sendMail({
      to: email,
      subject,
      html,
      text,
      template: 'welcome',
      merchantId,
    });

    return res.json({
      success: true,
      data: { delivered: result.sent },
      message: result.sent
        ? 'Welcome email sent.'
        : 'Welcome email logged, but SMTP is not configured yet so it was not actually delivered.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
