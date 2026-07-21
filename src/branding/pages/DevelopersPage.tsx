import { Link } from 'react-router-dom'
import { Reveal } from '../../components/Reveal'

export function DevelopersPage() {
  return (
    <div className="font-sans overflow-x-hidden bg-white text-neutral-850">

      {/* Hero — brand gradient, no external stock imagery */}
      <section
        className="relative pt-32 pb-20 sm:pb-28 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
      >
        <div className="bg-orb w-[380px] h-[380px] -top-24 -right-24 bg-red-600/20 animate-orb-drift" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <Reveal variant="up" className="text-white text-center lg:text-left space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white">
                Deploy payments in days,<br />
                <span className="text-red-500 mt-2 block">with clean developer endpoints</span>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
                Predictable REST endpoints, SHA-256 HMAC secure webhook callbacks, and sandbox testing keys. Focus on your product while we route your payments.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/register" className="btn-shimmer w-full sm:w-auto bg-red-600 text-white px-8 py-3 rounded-full text-xs font-bold hover:bg-red-700 transition-all text-center border-0 cursor-pointer shadow-md hover:scale-[1.03]">
                  Get Sandbox Keys
                </Link>
                <Link to="/documentation" className="w-full sm:w-auto bg-white text-neutral-900 hover:bg-neutral-100 px-8 py-3 rounded-full text-xs font-bold transition-all text-center border-0 cursor-pointer shadow-md">
                  Read API Docs
                </Link>
              </div>
            </Reveal>

            {/* Mockup visual right side */}
            <Reveal variant="scale" delay={150} className="w-full min-w-0 max-w-xl mx-auto lg:max-w-none">
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-neutral-950 p-2 border border-neutral-900">
                <img
                  src="/tamupay_dev_integration.png"
                  alt="Developer integration mockup illustration"
                  className="w-full h-auto object-cover rounded-xl"
                  width={600}
                  height={400}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* REST APIs */}
      <section className="py-16 sm:py-24 bg-white">
        <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">Predictable JSON payloads</h2>
              <p className="text-sm sm:text-base text-neutral-500 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Predictable endpoints returning clean JSON body structures. Features explicit API versioning, uniform responses, and clear HTTP error categories across all rails.
              </p>
              <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0 text-sm text-neutral-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-650 mt-1" />
                  <span>Collections, bank disbursements, and balance queries</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-650 mt-1" />
                  <span>Synchronous request outcomes with retry records</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-650 mt-1" />
                  <span>Explicit API versioning namespaces — e.g. <code className="bg-neutral-50 border border-neutral-200 px-1.5 py-0.5 rounded text-xs font-semibold">/v1/...</code></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-650 mt-1" />
                  <span>Centralized, document-mapped error codes</span>
                </li>
              </ul>
              <Link to="/documentation" className="inline-flex items-center gap-1 text-red-650 font-bold text-xs hover:text-red-700 transition-colors pt-2">
                <span>View Full API Reference</span> <i className="fa-solid fa-chevron-right text-[10px]" />
              </Link>
            </div>
            {/* Visual cURL */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="bg-neutral-950 text-neutral-300 rounded-3xl border border-neutral-800 p-6 w-full max-w-md shadow-2xl font-mono text-xs overflow-x-auto">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-3">
                  <span className="text-neutral-500 text-[10px]">POST /v1/payments/initialize</span>
                  <span className="text-red-500 text-[10px] font-bold">cURL</span>
                </div>
                <pre className="text-left text-neutral-250 leading-relaxed text-xs whitespace-pre-wrap">
{`curl -X POST \\
  "https://api.tamupay.ug/v1/payments/initialize" \\
  -H "Authorization: Bearer tp_test_CcXqJGv8" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 50000,
    "currency": "UGX",
    "payment_method": "MTN_MOMO",
    "customer_phone": "+256771234567",
    "description": "Order #1091"
  }'`}
                </pre>
                <div className="mt-3 pt-3 border-t border-neutral-900">
                  <p className="text-neutral-500 text-[10px] mb-2">200 Response</p>
                  <pre className="text-emerald-400 text-xs leading-relaxed whitespace-pre-wrap">
{`{
  "status": "pending",
  "reference": "tp_ref_1eQjkP8",
  "checkout_url": "https://pay.tamupay.ug/...",
  "expires_at": "2026-07-01T12:05:00Z"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Webhooks */}
      <section
        className="relative py-16 sm:py-24 text-white"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
      >
        <div className="absolute inset-0 bg-black/15" />
        <Reveal className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Visual webhook */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end order-2 lg:order-1">
              <div className="bg-neutral-950 text-neutral-300 rounded-3xl border border-neutral-800 p-6 w-full max-w-md shadow-2xl font-mono text-xs overflow-x-auto">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-3">
                  <span className="text-neutral-500 text-[10px]">POST /your-webhook-endpoint</span>
                  <span className="text-amber-500 text-[10px] font-bold">Webhook JSON</span>
                </div>
                <pre className="text-left text-neutral-250 leading-relaxed text-xs whitespace-pre-wrap">
{`{
  "event": "payment.success",
  "reference": "tp_ref_1eQjkP8",
  "amount": 50000,
  "currency": "UGX",
  "customer_phone": "+256771234567",
  "payment_method": "MTN_MOMO",
  "timestamp": "2026-07-01T12:04:55Z",
  "signature": "sha256=a4bc2e..."
}`}
                </pre>
                <div className="mt-3 pt-3 border-t border-neutral-900">
                  <p className="text-neutral-500 text-[10px] mb-1">Verify Signature Header</p>
                  <pre className="text-red-400 text-xs leading-relaxed whitespace-pre-wrap">
{`HMAC-SHA256(secret_key, request_payload)`}
                  </pre>
                </div>
              </div>
            </div>
            {/* Copy right */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">HMAC-signed webhooks</h2>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Get notified in real-time when payments settle, fail, or expire. Secured with HMAC signatures. Includes automatic retries if your server experiences downtime.
              </p>
              <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0 text-sm text-neutral-300 font-medium">
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-500 mt-1" />
                  <span>Success, failure, and payout state events</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-500 mt-1" />
                  <span>Automatic retry logic with progressive delay spacing</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-500 mt-1" />
                  <span>Signature validation headers to prevent spoofing</span>
                </li>
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Sandbox */}
      <section className="py-16 sm:py-24 bg-white">
        <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Copy left */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">Sandbox simulation</h2>
              <p className="text-sm sm:text-base text-neutral-500 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Sandbox mode operates on isolated mock databases. Run tests, mock errors, and simulate transaction confirmations without transferring live money.
              </p>
              <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0 text-sm text-neutral-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Completely isolated sandbox DB state</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Simulate successful and failed push requests</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Activate live keys with simple config file swap</span>
                </li>
              </ul>
              <div className="pt-2">
                <Link to="/register" className="inline-flex items-center justify-center bg-red-600 text-white px-6 py-2.5 rounded-full font-bold text-xs hover:bg-red-700 transition-colors border-0">
                  Get Sandbox Keys
                </Link>
              </div>
            </div>
            {/* Right card visual - Simple style, border outlines removed */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="bg-white border border-neutral-200 rounded-3xl shadow-xl p-6 w-full max-w-sm space-y-4 text-neutral-850">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <p className="text-neutral-800 font-bold text-sm">Staging Keys</p>
                  <span className="text-[10px] bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Test Mode</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Publishable Key', value: 'tp_test_pk_CcXqJGv8nNX2' },
                    { label: 'Secret Key', value: 'tp_test_sk_••••••••••••' },
                    { label: 'Webhook Secret', value: 'whsec_••••••••••••' },
                  ].map(k => (
                    <div key={k.label} className="space-y-1">
                      <p className="text-neutral-400 text-[10px] uppercase tracking-wider font-bold">{k.label}</p>
                      <div className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5">
                        <span className="text-neutral-800 font-mono text-[11px] truncate mr-2">{k.value}</span>
                        <i className="fa-regular fa-copy text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 text-center bg-neutral-50 border-t border-neutral-100">
        <Reveal className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">Ready to integrate your payments?</h2>
          <p className="text-sm sm:text-base text-neutral-500 max-w-xl mx-auto">
            Create your TamuPay profile, complete simple merchant checks, and collect local customer payments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/register" className="btn-shimmer w-full sm:w-auto bg-red-600 text-white px-8 py-3.5 rounded-full text-sm font-bold hover:bg-red-700 transition-all text-center shadow-md border-0 hover:scale-[1.02]">
              Sign Up Now — Free
            </Link>
            <Link to="/features" className="w-full sm:w-auto text-neutral-800 border border-neutral-250 hover:bg-neutral-50 px-8 py-3.5 rounded-full text-sm font-bold transition-all text-center">
              Explore Services
            </Link>
          </div>
        </Reveal>
      </section>

    </div>
  )
}

export default DevelopersPage
