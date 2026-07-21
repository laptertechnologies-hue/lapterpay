-- Complete Database Setup Schema for Lapterpay Payment Gateway
-- Target Database: PostgreSQL (Supabase SQL Editor)

-- Enable pgcrypto extension for generating random UUIDs and bcrypt hashes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

---------------------------------------------------------
-- 1. MERCHANTS TABLE (Linked to Supabase Auth)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT,
    contact_phone TEXT,
    currency VARCHAR(10) DEFAULT 'UGX',
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'approved', 'rejected')),
    logo_url TEXT,
    account_number VARCHAR(30) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

---------------------------------------------------------
-- 2. WALLETS / BALANCES (Test & Live environment float ledger)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    environment VARCHAR(10) NOT NULL CHECK (environment IN ('live', 'test')),
    balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
    currency VARCHAR(10) DEFAULT 'UGX' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (merchant_id, environment, currency)
);

---------------------------------------------------------
-- 3. API KEYS (Hashed API keys for merchant systems authentication)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,       -- SHA-256 hash of the full API key
    key_preview TEXT NOT NULL,          -- e.g., tp_live_abc123...
    environment VARCHAR(10) NOT NULL CHECK (environment IN ('live', 'test')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

---------------------------------------------------------
-- 4. TRANSACTIONS (Ledger of Collections, Payouts, and P2P Transfers)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,                 -- Formatted ID, e.g. TXN202606230001
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('collection', 'payout', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    fee NUMERIC(15, 2) DEFAULT 0.00 NOT NULL CHECK (fee >= 0),
    currency VARCHAR(10) DEFAULT 'UGX' NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- e.g., 'MTN MoMo', 'Airtel Money', 'Visa Card', 'Bank Transfer', 'Wallet Transfer'
    customer_identifier TEXT NOT NULL,  -- Customer mobile number, card details, or target account ID
    status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    environment VARCHAR(10) NOT NULL CHECK (environment IN ('live', 'test')),
    reference TEXT,                      -- External telco/bank reference
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

---------------------------------------------------------
-- 5. PAYMENT LINKS (Reusable checkouts)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    amount NUMERIC(15, 2),              -- NULL indicates flexible amount
    currency VARCHAR(10) DEFAULT 'UGX' NOT NULL,
    environment VARCHAR(10) NOT NULL CHECK (environment IN ('live', 'test')),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

---------------------------------------------------------
-- 6. WEBHOOK ENDPOINTS (Callback settings for postbacks)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    environment VARCHAR(10) NOT NULL CHECK (environment IN ('live', 'test')),
    secret_key TEXT NOT NULL,            -- Webhook signature signing secret (whsec_...)
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

---------------------------------------------------------
-- 7. CALLBACK LOGS (Audit trail of dispatched webhook notifications)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.callback_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    endpoint_id UUID REFERENCES public.webhook_endpoints(id) ON DELETE SET NULL,
    transaction_id TEXT REFERENCES public.transactions(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    success BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

---------------------------------------------------------
-- 8. IP WHITELISTS (Payout safety IP locks)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ip_whitelists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    ip_address VARCHAR(45) NOT NULL,    -- Supports IPv4 & IPv6
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (merchant_id, ip_address)
);

---------------------------------------------------------
-- 9. IDEMPOTENCY KEYS (Double charge prevention cache)
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    idempotency_key TEXT NOT NULL,
    request_path TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    response_status INTEGER NOT NULL,
    response_body JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (merchant_id, idempotency_key)
);

---------------------------------------------------------
-- 10. SUPPORT TICKETS
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id TEXT PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

---------------------------------------------------------
-- 11. BANK DETAILS
---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (merchant_id)
);

---------------------------------------------------------
-- 12. BUSINESS DOCUMENTS (KYC Verification Files)
CREATE TABLE IF NOT EXISTS public.business_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 13. PRODUCTS (Merchant inventory items for checkouts)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(10) DEFAULT 'UGX' NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 14. WITHDRAWAL PHONE NUMBERS (Payout Mobile Money numbers)
CREATE TABLE IF NOT EXISTS public.withdrawal_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    name TEXT NOT NULL,
    network VARCHAR(20) NOT NULL,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 15. ROLES (Custom merchant permissions definitions)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 16. SUPER ADMINS (Securely Authenticated Administrator Panel credentials)
CREATE TABLE IF NOT EXISTS public.super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default Super Admin credentials (username: admin, password: adminpassword)
INSERT INTO public.super_admins (username, password_hash)
VALUES ('admin', crypt('adminpassword', gen_salt('bf')))
ON CONFLICT (username) DO NOTHING;

---------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
---------------------------------------------------------

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callback_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_whitelists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Create policies mapping auth.uid() to respective merchant records
CREATE POLICY merchant_self_access ON public.merchants FOR ALL USING (auth.uid() = id);
CREATE POLICY wallet_self_access ON public.wallets FOR SELECT USING (auth.uid() = merchant_id);
CREATE POLICY api_key_self_access ON public.api_keys FOR ALL USING (auth.uid() = merchant_id);
CREATE POLICY transaction_self_access ON public.transactions FOR SELECT USING (auth.uid() = merchant_id);
CREATE POLICY payment_link_self_access ON public.payment_links FOR ALL USING (auth.uid() = merchant_id);
CREATE POLICY webhook_self_access ON public.webhook_endpoints FOR ALL USING (auth.uid() = merchant_id);
CREATE POLICY callback_log_self_access ON public.callback_logs FOR SELECT USING (auth.uid() = merchant_id);
CREATE POLICY ip_whitelist_self_access ON public.ip_whitelists FOR ALL USING (auth.uid() = merchant_id);
CREATE POLICY idempotency_self_access ON public.idempotency_keys FOR SELECT USING (auth.uid() = merchant_id);
CREATE POLICY support_tickets_self_access ON public.support_tickets FOR ALL USING (auth.uid() = merchant_id);
CREATE POLICY bank_details_self_access ON public.bank_details FOR ALL USING (auth.uid() = merchant_id);
CREATE POLICY business_documents_self_access ON public.business_documents FOR ALL USING (auth.uid() = merchant_id);
CREATE POLICY products_self_access ON public.products FOR ALL USING (auth.uid() = merchant_id);
CREATE POLICY withdrawal_phones_self_access ON public.withdrawal_phones FOR ALL USING (auth.uid() = merchant_id);
CREATE POLICY roles_self_access ON public.roles FOR ALL USING (auth.uid() = merchant_id);

---------------------------------------------------------
-- HELPER TRIGGERS AND FUNCTIONS
---------------------------------------------------------

-- Auto updated_at field handler
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_merchants_updated_at
    BEFORE UPDATE ON public.merchants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto account number trigger before insert
CREATE OR REPLACE FUNCTION public.before_merchant_created()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.account_number IS NULL OR NEW.account_number = '' THEN
        NEW.account_number := '201' || FLOOR(10000000 + RANDOM() * 90000000)::TEXT;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_merchant_account_number
    BEFORE INSERT ON public.merchants
    FOR EACH ROW EXECUTE FUNCTION public.before_merchant_created();

-- Auto wallet trigger when a new merchant is profile-saved
CREATE OR REPLACE FUNCTION public.after_merchant_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Create test/sandbox wallet with 1,000,000 UGX float
    INSERT INTO public.wallets (merchant_id, environment, balance, currency)
    VALUES (NEW.id, 'test', 1000000.00, NEW.currency);

    -- Create live wallet with 0.00 balance
    INSERT INTO public.wallets (merchant_id, environment, balance, currency)
    VALUES (NEW.id, 'live', 0.00, NEW.currency);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_wallets_on_signup
    AFTER INSERT ON public.merchants
    FOR EACH ROW EXECUTE FUNCTION public.after_merchant_created();


-- 10. ATOMIC BALANCE LEDGER ADJUSTMENT FUNCTION
-- SECURE: Checks balance checks before decrementing, avoiding race-conditions double-spending.
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(
    p_merchant_id UUID,
    p_environment VARCHAR,
    p_currency VARCHAR,
    p_amount NUMERIC
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    UPDATE public.wallets
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE merchant_id = p_merchant_id
      AND environment = p_environment
      AND currency = p_currency
      -- If amount is negative, ensure merchant has enough balance
      AND (p_amount >= 0 OR balance >= ABS(p_amount));
      
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. SECURE SUPER ADMIN PASSWORD VERIFICATION RPC
CREATE OR REPLACE FUNCTION public.verify_super_admin(
    p_username TEXT,
    p_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_hash TEXT;
BEGIN
    SELECT password_hash INTO v_hash FROM public.super_admins WHERE username = p_username;
    IF v_hash IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN v_hash = crypt(p_password, v_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. SUPER ADMIN APPROVE KYC RPC
CREATE OR REPLACE FUNCTION public.approve_merchant_kyc(
    p_merchant_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.merchants
    SET kyc_status = 'approved'
    WHERE id = p_merchant_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
