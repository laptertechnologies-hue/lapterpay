-- ============================================================================
-- LapterPay — Migration 002: Extend schema for full-system implementation
-- Target Database: PostgreSQL (Supabase SQL Editor)
--
-- This migration is ADDITIVE ONLY — it does not modify or drop anything
-- created by supabase/init.sql. Run it after init.sql on the same project.
-- It fills the gaps identified in the July 2026 full-system audit: pages
-- that were previously mock/localStorage-only (sub-accounts, team members,
-- service subscriptions, bulk payments, refunds) now have real tables to
-- write to, and the security features the UI already references but never
-- implemented (2FA, OTP, admin sessions, float approvals, audit trail) now
-- have somewhere to live.
--
-- IMPORTANT: every table below that is admin-only (admin_staff,
-- admin_sessions, platform_settings, float_topup_requests, audit_logs,
-- otp_codes, two_factor_secrets) is created with Row Level Security
-- enabled and *no* policy granted to the anon/authenticated roles. That is
-- intentional: these must only ever be read or written by the backend
-- using the Supabase service-role key (server/src/config/supabase.ts),
-- never directly from the browser. Do not add permissive policies to them.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

---------------------------------------------------------------------------
-- 1. SUB-ACCOUNTS
-- Backs ManageSubAccounts.tsx (currently 100% local React state).
-- A merchant can invite another registered merchant as a linked sub-account
-- (e.g. a franchise branch); the linked merchant must accept before the
-- relationship becomes active.
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sub_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    linked_merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    label TEXT,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'removed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (owner_merchant_id, invited_email)
);

---------------------------------------------------------------------------
-- 2. TEAM MEMBERS
-- Backs UserManagement.tsx (currently `localStorage['users_' + userId]`).
-- Real staff-user records under a merchant account, each tied to one of
-- the merchant's own `roles` rows for permissions.
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'invited' NOT NULL CHECK (status IN ('invited', 'active', 'suspended')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    activated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (merchant_id, email)
);

---------------------------------------------------------------------------
-- 3. SERVICE SUBSCRIPTIONS
-- Backs src/lib/subscriptions.ts + ServiceMarketplace.tsx (currently
-- localStorage-only, so it resets per-browser and never syncs across
-- devices for the same merchant).
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    service_key TEXT NOT NULL,           -- e.g. 'wallet_transfer', 'bulk_payments', 'payment_links'
    status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'cancelled')),
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (merchant_id, service_key)
);

---------------------------------------------------------------------------
-- 4. BULK PAYMENT BATCHES + ITEMS
-- Backs BulkPayments.tsx. Currently the page ignores the uploaded CSV
-- entirely and always inserts 3 hardcoded recipients — these tables let a
-- real upload be parsed, stored, and processed line-by-line with a status
-- per recipient (so partial failures are visible, not silent).
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bulk_payment_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    environment VARCHAR(10) NOT NULL CHECK (environment IN ('live', 'test')),
    file_name TEXT,
    total_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    total_items INTEGER DEFAULT 0 NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.bulk_payment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.bulk_payment_batches(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    recipient_name TEXT,
    recipient_identifier TEXT NOT NULL,   -- phone number / bank account
    payment_method VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    transaction_id TEXT REFERENCES public.transactions(id) ON DELETE SET NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

---------------------------------------------------------------------------
-- 5. REFUND REQUESTS
-- Backs Refunds.tsx. There is currently no way to actually request a
-- refund anywhere in the system (frontend or backend) — this table plus
-- the "no merchant-side status escalation" trigger below is the missing
-- piece; the actual funds-movement endpoint still needs to be built in
-- server/src/routes and should be the only thing allowed to mark a
-- refund 'completed'.
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Merchants may only ever create refund requests and see them; they must
-- never move a refund out of 'pending' themselves. Note that RLS is
-- bypassed entirely for the service-role key, but *triggers are not* —
-- so this one explicitly allows the change through when the caller is the
-- backend (auth.role() = 'service_role'), and blocks it otherwise.
CREATE OR REPLACE FUNCTION public.prevent_merchant_refund_status_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Refund status changes must go through the backend review process.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lock_refund_status ON public.refund_requests;
CREATE TRIGGER lock_refund_status
    BEFORE UPDATE ON public.refund_requests
    FOR EACH ROW EXECUTE FUNCTION public.prevent_merchant_refund_status_escalation();

---------------------------------------------------------------------------
-- 6. ADMIN STAFF + ADMIN SESSIONS
-- Backs AdminUsers.tsx (currently 5 hardcoded mock rows) and replaces the
-- bypassable `localStorage['super_admin_authenticated'] === 'true'` gate
-- in AdminLayout.tsx with a real server-verified session token.
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'support' NOT NULL CHECK (role IN ('super_admin', 'compliance', 'support', 'finance')),
    status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'suspended')),
    two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admin_staff(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,   -- SHA-256 of the session token; never store the raw token
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL  -- enforce real session timeout server-side, not just a client toast
);

-- Real session tokens for the existing public.super_admins table (from
-- init.sql, already seeded with username 'admin'). AdminLogin.tsx used to
-- set `localStorage['super_admin_authenticated'] = 'true'` on success,
-- which anyone can forge from devtools with zero credentials — this table
-- backs a real server-issued, server-verified session token instead. Kept
-- separate from admin_sessions/admin_staff above (that pair is for a
-- future multi-staff-with-roles system); this one unblocks a real login
-- gate today against the single super-admin account that already exists.
CREATE TABLE IF NOT EXISTS public.super_admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    super_admin_id UUID NOT NULL REFERENCES public.super_admins(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,   -- SHA-256 of the session token; never store the raw token
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

---------------------------------------------------------------------------
-- 7. FLOAT TOP-UP REQUESTS
-- Backs AdminFloat.tsx (currently 3 hardcoded local-state rows; approving
-- one today does not credit any real wallet). Real bank-slip-backed
-- top-up requests that an admin reviews and, on approval, triggers a real
-- call to increment_wallet_balance().
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.float_topup_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'UGX' NOT NULL,
    bank_slip_url TEXT,
    reference TEXT,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.admin_staff(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

---------------------------------------------------------------------------
-- 8. PLATFORM SETTINGS
-- Backs AdminSettings.tsx commission/fee configuration (currently local
-- state only — "Save" just shows a toast and persists nothing). A simple
-- key/value config table the backend reads when calculating fees, instead
-- of the hardcoded 3% flat rate baked into server/src/routes today.
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES public.admin_staff(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

INSERT INTO public.platform_settings (key, value) VALUES
    ('collection_fee_percent', '3.0'),
    ('payout_fee_flat_ugx', '1000'),
    ('payout_fee_percent_over_100k', '1.0'),
    ('bank_payout_fee_flat_ugx', '5000'),
    ('wallet_transfer_fee_percent', '0')
ON CONFLICT (key) DO NOTHING;

---------------------------------------------------------------------------
-- 9. OTP CODES
-- Backs the email-verification step in RegisterPage.tsx, which today just
-- hardcodes the code "123456" client-side and sends nothing. Also usable
-- for login-step-up and sensitive-action confirmation (large payouts,
-- wallet transfers, API key rotation).
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE, -- NULL for pre-signup verification
    code_hash TEXT NOT NULL,          -- SHA-256 of the 6-digit code; never store the raw code
    purpose VARCHAR(30) NOT NULL CHECK (purpose IN ('signup_verification', 'login_step_up', 'password_reset', 'sensitive_action')),
    attempts INTEGER DEFAULT 0 NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_lookup ON public.otp_codes (email, purpose, consumed_at);

---------------------------------------------------------------------------
-- 10. TWO-FACTOR (TOTP) SECRETS
-- Backs the "2FA Required" claims already shown in WithdrawalPhoneNumbers.tsx
-- and UserManagement.tsx, which currently check nothing at all.
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.two_factor_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL UNIQUE REFERENCES public.merchants(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,             -- TOTP secret; encrypt at the application layer before storing
    backup_codes_hash TEXT[] DEFAULT '{}' NOT NULL,
    enabled BOOLEAN DEFAULT FALSE NOT NULL,
    enabled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL;

---------------------------------------------------------------------------
-- 11. AUDIT LOGS
-- General security/action audit trail — who did what, from where. Needed
-- for any real KYC-approval, admin-action, or high-value-payout review.
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('merchant', 'admin', 'system')),
    actor_id UUID,
    action TEXT NOT NULL,             -- e.g. 'merchant.kyc_approved', 'api_key.created', 'wallet_transfer.completed'
    target_table TEXT,
    target_id TEXT,
    metadata JSONB DEFAULT '{}' NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_type, actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs (target_table, target_id);

---------------------------------------------------------------------------
-- 12. EMAIL LOGS
-- Tracks every email LapterPay attempts to send once a real mailer is wired
-- up to server/src/services/emailTemplates.ts (currently that file's
-- buildWelcomeEmail/buildOtpEmail/buildPasswordResetEmail functions exist
-- but are never called or sent anywhere).
---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
    to_email TEXT NOT NULL,
    template VARCHAR(50) NOT NULL,   -- 'welcome', 'otp', 'password_reset', etc.
    status VARCHAR(20) DEFAULT 'sent' NOT NULL CHECK (status IN ('sent', 'failed')),
    provider_message_id TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

---------------------------------------------------------------------------
-- USEFUL INDEXES ON EXISTING HIGH-TRAFFIC TABLES (init.sql didn't add any
-- beyond primary keys / unique constraints; these matter once merchant
-- volume grows beyond a handful of test rows).
---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_env ON public.transactions (merchant_id, environment, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);
CREATE INDEX IF NOT EXISTS idx_callback_logs_merchant ON public.callback_logs (merchant_id, created_at DESC);

---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
---------------------------------------------------------------------------

-- Merchant-owned tables: same self-access pattern as init.sql
ALTER TABLE public.sub_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_payment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_payment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY sub_accounts_owner_access ON public.sub_accounts
    FOR ALL USING (auth.uid() = owner_merchant_id);
CREATE POLICY sub_accounts_linked_read ON public.sub_accounts
    FOR SELECT USING (auth.uid() = linked_merchant_id);
CREATE POLICY sub_accounts_linked_respond ON public.sub_accounts
    FOR UPDATE USING (auth.uid() = linked_merchant_id);

CREATE POLICY team_members_self_access ON public.team_members
    FOR ALL USING (auth.uid() = merchant_id);

CREATE POLICY service_subscriptions_self_access ON public.service_subscriptions
    FOR ALL USING (auth.uid() = merchant_id);

CREATE POLICY bulk_payment_batches_self_access ON public.bulk_payment_batches
    FOR ALL USING (auth.uid() = merchant_id);
CREATE POLICY bulk_payment_items_self_access ON public.bulk_payment_items
    FOR ALL USING (auth.uid() = merchant_id);

CREATE POLICY refund_requests_self_access ON public.refund_requests
    FOR ALL USING (auth.uid() = merchant_id);

-- Admin-only / backend-only tables: RLS enabled, deliberately NO policy
-- granted to anon/authenticated. Only the service-role key (used
-- exclusively by server/src, never shipped to the browser) can read or
-- write these — see the file header note.
ALTER TABLE public.float_topup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

---------------------------------------------------------------------------
-- HELPER TRIGGERS ON NEW TABLES
---------------------------------------------------------------------------

-- Keep bulk_payment_batches.total_amount / total_items in sync with items
CREATE OR REPLACE FUNCTION public.recalc_bulk_batch_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_batch_id UUID := COALESCE(NEW.batch_id, OLD.batch_id);
BEGIN
    UPDATE public.bulk_payment_batches b
    SET total_amount = COALESCE((SELECT SUM(amount) FROM public.bulk_payment_items WHERE batch_id = v_batch_id), 0),
        total_items = (SELECT COUNT(*) FROM public.bulk_payment_items WHERE batch_id = v_batch_id)
    WHERE b.id = v_batch_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS recalc_bulk_batch_totals_trigger ON public.bulk_payment_items;
CREATE TRIGGER recalc_bulk_batch_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.bulk_payment_items
    FOR EACH ROW EXECUTE FUNCTION public.recalc_bulk_batch_totals();

-- Housekeeping RPC: expire stale admin sessions and used/expired OTP codes.
-- Call this periodically (e.g. via a scheduled Supabase Edge Function or
-- cron) — it is safe to run as often as you like.
CREATE OR REPLACE FUNCTION public.cleanup_expired_security_records()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.admin_sessions WHERE expires_at < NOW();
    DELETE FROM public.super_admin_sessions WHERE expires_at < NOW();
    DELETE FROM public.otp_codes WHERE expires_at < NOW() AND consumed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- End of migration 002.
--
-- Still needed after running this (application code, not SQL):
--   1. server/src/routes/admin.ts — issue/verify admin_sessions tokens on
--      top of the existing verify_super_admin RPC and admin_staff table.
--   2. server/src/routes/otp.ts — generate/verify otp_codes, and an actual
--      mailer call (server/src/services/emailTemplates.ts already has the
--      templates; nothing currently sends them).
--   3. server/src/routes/2fa.ts — TOTP enroll/verify against
--      two_factor_secrets (e.g. using the `otpauth`/`speakeasy` npm package).
--   4. Point ManageSubAccounts.tsx, UserManagement.tsx, ServiceMarketplace
--      (src/lib/subscriptions.ts), BulkPayments.tsx, Refunds.tsx,
--      AdminFloat.tsx, AdminUsers.tsx, AdminSettings.tsx at these new
--      tables instead of their current mock/localStorage state.
--   5. Real Supabase Storage bucket + upload flow for business_documents
--      and merchant/product logos (currently fabricated URL strings).
-- ============================================================================
