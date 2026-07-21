// A comprehensive script to verify Lapterpay API Server security policies.
// Usage: Node test-endpoints.js

const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, './.env') });

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// Helper to hash test API key
function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

async function runTests() {
  console.log('🧪 Starting Lapterpay Security Verification Tests...\n');

  // ==========================================
  // SECTION A: DATABASE-INDEPENDENT TESTS
  // ==========================================

  // Test 1: Health check
  try {
    console.log('Test 1: Health check...');
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.ok && data.success) {
      console.log('✅ Health check passed:', data.service, `(${data.status})`);
    } else {
      console.error('❌ Health check failed:', data);
    }
  } catch (err) {
    console.error('❌ Health check request failed. Is the server running? Run "npm run dev" first.', err.message);
    return;
  }

  // Test 2: Unauthorized request (Payments list)
  try {
    console.log('\nTest 2: Request without authorization header...');
    const res = await fetch(`${BASE_URL}/api/v1/payments`);
    const data = await res.json();
    if (res.status === 401) {
      console.log('✅ Correctly blocked unauthorized request (401):', data.error);
    } else {
      console.error('❌ Failed to block unauthorized request:', res.status, data);
    }
  } catch (err) {
    console.error('❌ Request failed:', err.message);
  }

  // Test 3: Invalid API Key request
  try {
    console.log('\nTest 3: Request with invalid API Key format...');
    const res = await fetch(`${BASE_URL}/api/v1/payments`, {
      headers: {
        'x-api-key': 'tp_test_invalidkeyhere'
      }
    });
    const data = await res.json();
    if (res.status === 401) {
      console.log('✅ Correctly blocked invalid API key format (401):', data.error);
    } else {
      console.error('❌ Failed to block invalid API key format:', res.status, data);
    }
  } catch (err) {
    console.error('❌ Request failed:', err.message);
  }

  // Test 4: NotFound Fallback
  try {
    console.log('\nTest 4: Requesting non-existent route...');
    const res = await fetch(`${BASE_URL}/api/v1/invalid-route`);
    const data = await res.json();
    if (res.status === 404) {
      console.log('✅ Correctly returned 404 error:', data.error);
    } else {
      console.error('❌ Failed to return 404 for invalid route:', res.status, data);
    }
  } catch (err) {
    console.error('❌ Request failed:', err.message);
  }

  // Test 5: Rate Limiting Verification
  try {
    console.log('\nTest 5: Rate limit verification (hitting /health 61 times)...');
    const limitKey = 'tp_test_ratelimit_mock_key';
    let isBlocked = false;
    let limitHeader = '';
    let remainingHeader = '';

    for (let i = 1; i <= 61; i++) {
      const res = await fetch(`${BASE_URL}/health`, {
        headers: {
          'x-api-key': limitKey
        }
      });
      limitHeader = res.headers.get('x-ratelimit-limit') || '';
      remainingHeader = res.headers.get('x-ratelimit-remaining') || '';

      if (res.status === 429) {
        const data = await res.json();
        isBlocked = true;
        console.log(`✅ Correctly rate-limited on request #${i} (429):`, data.error);
        console.log(`📊 Rate Limit Headers: Limit = ${limitHeader}, Remaining = ${remainingHeader}, Retry-After = ${res.headers.get('retry-after')}s`);
        break;
      }
    }

    if (!isBlocked) {
      console.error('❌ Failed to trigger rate limiter. Did not receive 429 after 61 requests.');
    }
  } catch (err) {
    console.error('❌ Rate limit test failed:', err.message);
  }

  // ==========================================
  // SECTION B: DATABASE-DEPENDENT SECURITY TESTS
  // ==========================================
  console.log('\n--- Checking Database Integration Settings ---');
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseKey.includes('your_supabase_service_role_key')) {
    printDatabaseSetupGuide();
    console.log('\n🏁 Verification Tests complete (Database-dependent tests skipped).');
    return;
  }

  // Initialize Supabase admin client locally for seeding/cleanup
  let supabase;
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error('⚠️ Could not load @supabase/supabase-js. Skipping DB integration tests.', err.message);
    console.log('\n🏁 Verification Tests complete.');
    return;
  }

  // Generate random IDs for temporary seed merchant
  const testMerchantId = crypto.randomUUID();
  const testApiKey = `tp_test_integration_${crypto.randomBytes(8).toString('hex')}`;
  const testApiKeyHash = hashApiKey(testApiKey);
  const whitelistedIP = '127.0.0.1';
  const blockedIP = '192.168.1.99';

  try {
    console.log('Seeding temporary test merchant in database...');
    
    // 1. Insert Merchant
    const { error: mErr } = await supabase
      .from('merchants')
      .insert({
        id: testMerchantId,
        business_name: 'Integration Test Merchant',
        currency: 'UGX'
      });
    if (mErr) throw mErr;

    // 2. Insert Test Wallet (Trigger should automatically create it, but let's make sure it exists or update it)
    const { error: wErr } = await supabase
      .from('wallets')
      .update({ balance: 500000.00 }) // top up to 500k
      .eq('merchant_id', testMerchantId)
      .eq('environment', 'test');

    // 3. Insert hashed API Key
    const { error: kErr } = await supabase
      .from('api_keys')
      .insert({
        merchant_id: testMerchantId,
        name: 'Integration Test Key',
        key_hash: testApiKeyHash,
        key_preview: 'tp_test_integ...',
        environment: 'test'
      });
    if (kErr) throw kErr;

    // 4. Configure IP Whitelists
    const { error: ipErr } = await supabase
      .from('ip_whitelists')
      .insert({
        merchant_id: testMerchantId,
        ip_address: whitelistedIP,
        description: 'Mock Whitelist IP for local verification'
      });
    if (ipErr) throw ipErr;

    console.log('✅ Temporary merchant seeded successfully. Running transactional tests...');

    // Test 6: Idempotency Key - Success Caching
    console.log('\nTest 6: Idempotency Caching...');
    const idempotencyKey = `idemp_${crypto.randomBytes(8).toString('hex')}`;
    const paymentPayload = {
      amount: 25000,
      payment_method: 'MTN MoMo',
      customer_identifier: '256770000000',
      description: 'Idempotency test charge'
    };

    // First request
    const res1 = await fetch(`${BASE_URL}/api/v1/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': testApiKey,
        'idempotency-key': idempotencyKey
      },
      body: JSON.stringify(paymentPayload)
    });
    const data1 = await res1.json();
    
    if (res1.status === 201 && data1.success) {
      console.log('✅ Request 1: Initialized successfully. Txn ID:', data1.data.transactionId);
    } else {
      console.error('❌ Request 1: Failed to initialize:', res1.status, data1);
    }

    // Second request (identical key and payload - should return identical cached payload)
    const res2 = await fetch(`${BASE_URL}/api/v1/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': testApiKey,
        'idempotency-key': idempotencyKey
      },
      body: JSON.stringify(paymentPayload)
    });
    const data2 = await res2.json();

    if (res2.status === 201 && data2.success && data2.data.transactionId === data1.data.transactionId) {
      console.log('✅ Request 2: Replayed cached response successfully.');
    } else {
      console.error('❌ Request 2: Failed to replay cache:', res2.status, data2);
    }

    // Test 7: Idempotency Key - Mismatched Payload rejection
    console.log('\nTest 7: Idempotency Mismatched Payload Block...');
    const mismatchedPayload = { ...paymentPayload, amount: 99999 };
    const res3 = await fetch(`${BASE_URL}/api/v1/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': testApiKey,
        'idempotency-key': idempotencyKey
      },
      body: JSON.stringify(mismatchedPayload)
    });
    const data3 = await res3.json();

    if (res3.status === 400 && !data3.success) {
      console.log('✅ Correctly blocked payload mismatch (400):', data3.error);
    } else {
      console.error('❌ Failed to block payload mismatch:', res3.status, data3);
    }

    // Test 8: IP Whitelist - Block Non-whitelisted IP
    console.log('\nTest 8: IP Whitelist Payout Block (non-whitelisted IP)...');
    const payoutPayload = {
      amount: 10000,
      payment_method: 'MTN MoMo',
      customer_identifier: '256771112223',
      description: 'Test Payout'
    };

    const resBlocked = await fetch(`${BASE_URL}/api/v1/float/payouts/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': testApiKey,
        'x-forwarded-for': blockedIP
      },
      body: JSON.stringify(payoutPayload)
    });
    const dataBlocked = await resBlocked.json();

    if (resBlocked.status === 403) {
      console.log('✅ Correctly blocked payout from unauthorized IP (403):', dataBlocked.error);
    } else {
      console.error('❌ Failed to block unauthorized IP payout:', resBlocked.status, dataBlocked);
    }

    // Test 9: IP Whitelist - Allow Whitelisted IP
    console.log('\nTest 9: IP Whitelist Payout Allow (whitelisted IP)...');
    const resAllowed = await fetch(`${BASE_URL}/api/v1/float/payouts/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': testApiKey,
        'x-forwarded-for': whitelistedIP
      },
      body: JSON.stringify(payoutPayload)
    });
    const dataAllowed = await resAllowed.json();

    if (resAllowed.status === 201 && dataAllowed.success) {
      console.log('✅ Payout initiated successfully from whitelisted IP. Txn ID:', dataAllowed.data.transactionId);
    } else {
      console.error('❌ Failed to allow whitelisted IP payout:', resAllowed.status, dataAllowed);
    }

  } catch (err) {
    console.error('❌ Database integration tests encountered error:', err.message);
  } finally {
    console.log('\nCleaning up temporary test merchant records...');
    try {
      await supabase
        .from('merchants')
        .delete()
        .eq('id', testMerchantId);
      console.log('✅ Database cleaned up.');
    } catch (err) {
      console.error('⚠️ Cleanup failed:', err.message);
    }
  }

  console.log('\n🏁 Verification Tests complete.');
}

function printDatabaseSetupGuide() {
  console.log('\n💡 DATABASE INTEGRATION TEST GUIDE:');
  console.log('To run end-to-end transaction, idempotency, and IP whitelisting tests:');
  console.log('1. Open your Supabase SQL Editor and run the entire script in:');
  console.log('   supabase/init.sql');
  console.log('2. Copy your Supabase Project URL and Service Role Key.');
  console.log('3. Add them to the root .env file:');
  console.log('   SUPABASE_URL=https://your-project.supabase.co');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.log('4. Restart the Express server and re-run this script.');
}

runTests();
