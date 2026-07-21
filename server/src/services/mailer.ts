/**
 * TamuPay Mailer
 *
 * Thin wrapper around nodemailer's SMTP transport. Every send attempt is
 * recorded in public.email_logs regardless of outcome, so delivery history
 * is auditable from the database even before a provider is configured.
 *
 * Configure via server/.env:
 *   SMTP_HOST=smtp.your-provider.com
 *   SMTP_PORT=587
 *   SMTP_SECURE=false          # true for port 465
 *   SMTP_USER=apikey-or-username
 *   SMTP_PASS=your-smtp-password
 *   SMTP_FROM="TamuPay <no-reply@tamupay.ug>"
 *
 * Until those are set, sendMail() logs the email to email_logs with
 * status='failed' and an explanatory error_message instead of throwing —
 * registration and other flows that trigger emails should never fail
 * just because outbound mail isn't configured yet.
 */
import nodemailer, { Transporter } from 'nodemailer';
import { supabaseAdmin } from '../config/supabase';

let transporter: Transporter | null = null;
let attemptedInit = false;

function getTransporter(): Transporter | null {
  if (attemptedInit) return transporter;
  attemptedInit = true;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    console.warn(
      'WARNING: SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS are not fully configured. ' +
      'Outbound emails (welcome, OTP, password reset) will be logged but not actually delivered ' +
      'until these are set in server/.env.'
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });

  return transporter;
}

export async function sendMail({
  to,
  subject,
  html,
  text,
  template,
  merchantId,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  merchantId?: string | null;
}): Promise<{ sent: boolean; error?: string }> {
  const from = process.env.SMTP_FROM || 'TamuPay <no-reply@tamupay.ug>';
  const t = getTransporter();

  if (!t) {
    await supabaseAdmin.from('email_logs').insert({
      merchant_id: merchantId ?? null,
      to_email: to,
      template,
      status: 'failed',
      error_message: 'SMTP not configured on the server (see server/.env.example).',
    });
    return { sent: false, error: 'SMTP not configured' };
  }

  try {
    const info = await t.sendMail({ from, to, subject, html, text });
    await supabaseAdmin.from('email_logs').insert({
      merchant_id: merchantId ?? null,
      to_email: to,
      template,
      status: 'sent',
      provider_message_id: info.messageId,
    });
    return { sent: true };
  } catch (err: any) {
    await supabaseAdmin.from('email_logs').insert({
      merchant_id: merchantId ?? null,
      to_email: to,
      template,
      status: 'failed',
      error_message: err?.message || 'Unknown SMTP error',
    });
    return { sent: false, error: err?.message };
  }
}
