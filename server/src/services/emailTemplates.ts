/**
 * LapterPay Email Templates
 * 
 * HTML email templates for:
 *  - Welcome email (sent on successful registration)
 *  - OTP verification email (sent on sign-up for email confirmation)
 *  - Password reset email
 */

// ──────────────────────────────────────────────
// Shared styles (inline for email clients)
// ──────────────────────────────────────────────
const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  background: #f4f6fb;
  margin: 0;
  padding: 0;
`;

const CARD_STYLES = `
  background: #ffffff;
  border-radius: 16px;
  padding: 40px 36px;
  max-width: 560px;
  margin: 32px auto;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
`;

const HEADER_STYLES = `
  text-align: center;
  padding-bottom: 28px;
  border-bottom: 1px solid #e8ecf0;
  margin-bottom: 28px;
`;

const LOGO_STYLES = `
  display: inline-block;
  background: #011478;
  color: white;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.5px;
  padding: 10px 24px;
  border-radius: 12px;
`;

const FOOTER_STYLES = `
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid #e8ecf0;
  margin-top: 28px;
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.6;
`;

// ──────────────────────────────────────────────
// 1. WELCOME EMAIL
// ──────────────────────────────────────────────
export function buildWelcomeEmail({
  businessName,
  fullName,
  accountNumber,
  email,
}: {
  businessName: string;
  fullName: string;
  accountNumber: string;
  email: string;
}): { subject: string; html: string; text: string } {
  const subject = `Welcome to LapterPay, ${businessName}!`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="${BASE_STYLES}">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6fb; padding: 24px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="${CARD_STYLES}">

              <!-- Header -->
              <div style="${HEADER_STYLES}">
                <div style="${LOGO_STYLES}">LapterPay</div>
                <p style="margin:16px 0 0; color:#6b7280; font-size:14px;">Payment Gateway for East Africa</p>
              </div>

              <!-- Greeting -->
              <p style="font-size:20px; font-weight:700; color:#111827; margin:0 0 8px;">
                Welcome, ${fullName}! 🎉
              </p>
              <p style="font-size:15px; color:#374151; line-height:1.7; margin:0 0 20px;">
                Your <strong>${businessName}</strong> merchant account has been successfully created on LapterPay.
                You're now ready to start integrating payments for your business.
              </p>

              <!-- Account details box -->
              <div style="background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; padding:20px 24px; margin-bottom:24px;">
                <p style="font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 14px;">Your Account Details</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:13px; color:#6b7280; padding:4px 0;">Business Name</td>
                    <td style="font-size:13px; color:#111827; font-weight:600; text-align:right;">${businessName}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px; color:#6b7280; padding:4px 0;">Email</td>
                    <td style="font-size:13px; color:#111827; font-weight:600; text-align:right;">${email}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px; color:#6b7280; padding:4px 0;">Account Number</td>
                    <td style="font-size:13px; color:#011478; font-weight:700; font-family:monospace; text-align:right;">${accountNumber}</td>
                  </tr>
                  <tr>
                    <td style="font-size:13px; color:#6b7280; padding:4px 0;">Mode</td>
                    <td style="font-size:13px; text-align:right;">
                      <span style="background:#fef3c7; color:#92400e; font-size:11px; font-weight:700; padding:3px 8px; border-radius:999px; text-transform:uppercase;">Sandbox</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Next steps -->
              <p style="font-size:14px; font-weight:700; color:#111827; margin:0 0 12px;">What's next?</p>
              <div style="margin-bottom:24px;">
                <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:12px;">
                  <div style="width:28px; height:28px; min-width:28px; background:#011478; color:white; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">1</div>
                  <div>
                    <p style="font-size:14px; color:#111827; font-weight:600; margin:4px 0 2px;">Test in Sandbox</p>
                    <p style="font-size:13px; color:#6b7280; margin:0; line-height:1.5;">Your account is in sandbox mode. Use test API keys to simulate MTN MoMo and bank payout flows.</p>
                  </div>
                </div>
                <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:12px;">
                  <div style="width:28px; height:28px; min-width:28px; background:#011478; color:white; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">2</div>
                  <div>
                    <p style="font-size:14px; color:#111827; font-weight:600; margin:4px 0 2px;">Upload Business Documents</p>
                    <p style="font-size:13px; color:#6b7280; margin:0; line-height:1.5;">Submit your KYC documents in the dashboard. Our team will review and verify your business within a few business days.</p>
                  </div>
                </div>
                <div style="display:flex; align-items:flex-start; gap:12px;">
                  <div style="width:28px; height:28px; min-width:28px; background:#011478; color:white; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">3</div>
                  <div>
                    <p style="font-size:14px; color:#111827; font-weight:600; margin:4px 0 2px;">Go Live</p>
                    <p style="font-size:13px; color:#6b7280; margin:0; line-height:1.5;">Once verified, your account unlocks live payment processing with real MTN, Airtel, Visa, and bank transfers.</p>
                  </div>
                </div>
              </div>

              <!-- CTA -->
              <div style="text-align:center; margin-bottom:24px;">
                <a href="https://lapterpay.ug/dashboard" style="display:inline-block; background:#011478; color:white; font-size:15px; font-weight:700; padding:14px 32px; border-radius:12px; text-decoration:none;">
                  Open Your Dashboard →
                </a>
              </div>

              <p style="font-size:14px; color:#374151; line-height:1.7;">
                If you have any questions, our support team is ready to help.<br />
                Reply to this email or contact us at <a href="mailto:support@lapterpay.ug" style="color:#011478;">support@lapterpay.ug</a>.
              </p>

              <!-- Footer -->
              <div style="${FOOTER_STYLES}">
                <p style="margin:0 0 4px;">© ${new Date().getFullYear()} LapterPay. All rights reserved.</p>
                <p style="margin:0 0 4px;">Payment Gateway for East Africa · Live in Uganda</p>
                <p style="margin:0;">
                  <a href="#" style="color:#9ca3af;">Privacy Policy</a> ·
                  <a href="#" style="color:#9ca3af; margin-left:8px;">Terms of Service</a>
                </p>
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
Welcome to LapterPay, ${fullName}!

Your ${businessName} merchant account has been successfully created.

Account Details:
  Business Name: ${businessName}
  Email: ${email}
  Account Number: ${accountNumber}
  Mode: Sandbox

Next Steps:
  1. Test in Sandbox — use test API keys to simulate payments
  2. Upload Business Documents — submit KYC for verification
  3. Go Live — start processing real payments once verified

Open your dashboard: https://lapterpay.ug/dashboard

Questions? Email us at support@lapterpay.ug

© ${new Date().getFullYear()} LapterPay. All rights reserved.
  `.trim();

  return { subject, html, text };
}

// ──────────────────────────────────────────────
// 2. OTP VERIFICATION EMAIL
// ──────────────────────────────────────────────
export function buildOtpEmail({
  fullName,
  email,
  otpCode,
  expiresMinutes = 10,
}: {
  fullName: string;
  email: string;
  otpCode: string;
  expiresMinutes?: number;
}): { subject: string; html: string; text: string } {
  const subject = `LapterPay — Your verification code is ${otpCode}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="${BASE_STYLES}">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6fb; padding: 24px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="${CARD_STYLES}">

              <!-- Header -->
              <div style="${HEADER_STYLES}">
                <div style="${LOGO_STYLES}">LapterPay</div>
                <p style="margin:16px 0 0; color:#6b7280; font-size:14px;">Payment Gateway for East Africa</p>
              </div>

              <!-- Greeting -->
              <p style="font-size:20px; font-weight:700; color:#111827; margin:0 0 8px;">
                Verify your email address
              </p>
              <p style="font-size:15px; color:#374151; line-height:1.7; margin:0 0 24px;">
                Hi ${fullName}, use the code below to verify your email address <strong>${email}</strong> and complete your LapterPay account registration.
              </p>

              <!-- OTP Code box -->
              <div style="background:#f0f4ff; border:2px solid #011478; border-radius:16px; padding:28px; text-align:center; margin-bottom:24px;">
                <p style="font-size:12px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 12px;">Your Verification Code</p>
                <p style="font-size:48px; font-weight:800; color:#011478; letter-spacing:0.2em; font-family:monospace; margin:0;">
                  ${otpCode}
                </p>
                <p style="font-size:13px; color:#6b7280; margin:12px 0 0;">
                  This code expires in <strong>${expiresMinutes} minutes</strong>
                </p>
              </div>

              <!-- Security note -->
              <div style="background:#fef9ec; border:1px solid #fde68a; border-radius:12px; padding:14px 18px; margin-bottom:24px;">
                <p style="font-size:13px; color:#92400e; margin:0; line-height:1.6;">
                  🔒 <strong>Security tip:</strong> LapterPay staff will never ask for your OTP code. Do not share this code with anyone. If you didn't request this code, please ignore this email.
                </p>
              </div>

              <p style="font-size:14px; color:#374151; line-height:1.7;">
                Enter this code on the registration page to continue setting up your merchant account.
              </p>

              <!-- Footer -->
              <div style="${FOOTER_STYLES}">
                <p style="margin:0 0 4px;">© ${new Date().getFullYear()} LapterPay. All rights reserved.</p>
                <p style="margin:0 0 4px;">This email was sent to ${email} because you registered on LapterPay.</p>
                <p style="margin:0;">If this wasn't you, please contact <a href="mailto:support@lapterpay.ug" style="color:#9ca3af;">support@lapterpay.ug</a>.</p>
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
LapterPay — Email Verification

Hi ${fullName},

Your verification code for ${email} is:

  ${otpCode}

This code expires in ${expiresMinutes} minutes.

Security tip: LapterPay staff will never ask for your OTP code. Do not share this code with anyone.

If you did not request this, please contact support@lapterpay.ug.

© ${new Date().getFullYear()} LapterPay. All rights reserved.
  `.trim();

  return { subject, html, text };
}

// ──────────────────────────────────────────────
// 3. PASSWORD RESET EMAIL
// ──────────────────────────────────────────────
export function buildPasswordResetEmail({
  fullName,
  email,
  resetUrl,
}: {
  fullName: string;
  email: string;
  resetUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = 'LapterPay — Reset your password';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="${BASE_STYLES}">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6fb; padding: 24px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="${CARD_STYLES}">

              <!-- Header -->
              <div style="${HEADER_STYLES}">
                <div style="${LOGO_STYLES}">LapterPay</div>
                <p style="margin:16px 0 0; color:#6b7280; font-size:14px;">Payment Gateway for East Africa</p>
              </div>

              <p style="font-size:20px; font-weight:700; color:#111827; margin:0 0 8px;">
                Reset your password
              </p>
              <p style="font-size:15px; color:#374151; line-height:1.7; margin:0 0 24px;">
                Hi ${fullName}, we received a request to reset the password for your LapterPay account associated with <strong>${email}</strong>.
              </p>

              <div style="text-align:center; margin-bottom:24px;">
                <a href="${resetUrl}" style="display:inline-block; background:#011478; color:white; font-size:15px; font-weight:700; padding:14px 32px; border-radius:12px; text-decoration:none;">
                  Reset My Password →
                </a>
              </div>

              <p style="font-size:13px; color:#6b7280; line-height:1.6; margin-bottom:16px;">
                Or copy and paste this link into your browser:<br />
                <a href="${resetUrl}" style="color:#011478; word-break:break-all;">${resetUrl}</a>
              </p>

              <div style="background:#fef9ec; border:1px solid #fde68a; border-radius:12px; padding:14px 18px; margin-bottom:24px;">
                <p style="font-size:13px; color:#92400e; margin:0; line-height:1.6;">
                  ⚠️ This link expires in <strong>60 minutes</strong>. If you did not request a password reset, please ignore this email — your account is safe.
                </p>
              </div>

              <!-- Footer -->
              <div style="${FOOTER_STYLES}">
                <p style="margin:0 0 4px;">© ${new Date().getFullYear()} LapterPay. All rights reserved.</p>
                <p style="margin:0;">Questions? Contact <a href="mailto:support@lapterpay.ug" style="color:#9ca3af;">support@lapterpay.ug</a></p>
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
LapterPay — Reset your password

Hi ${fullName},

We received a request to reset the password for your LapterPay account (${email}).

Click the link below to reset your password:
${resetUrl}

This link expires in 60 minutes.

If you did not request a password reset, please ignore this email — your account is safe.

© ${new Date().getFullYear()} LapterPay. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * Usage example:
 * 
 * import { buildWelcomeEmail, buildOtpEmail } from './emailTemplates';
 * 
 * // On registration success:
 * const welcome = buildWelcomeEmail({
 *   businessName: 'Kampala Traders Ltd',
 *   fullName: 'John Mukasa',
 *   accountNumber: '2012345678',
 *   email: 'john@kampalatraders.com',
 * });
 * await mailer.send({ to: email, subject: welcome.subject, html: welcome.html });
 * 
 * // For OTP email:
 * const otp = buildOtpEmail({
 *   fullName: 'John Mukasa',
 *   email: 'john@kampalatraders.com',
 *   otpCode: '847291',
 * });
 * await mailer.send({ to: email, subject: otp.subject, html: otp.html });
 */
