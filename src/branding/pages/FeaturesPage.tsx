import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '../../components/Reveal'

const SLIDES = [
  { id: 'mobile-money', src: '/slider1.png', alt: 'Merchant accepting a mobile money payment at a market stall' },
  { id: 'cards', src: '/slider2.png', alt: 'Customer tapping a card to pay at checkout' },
  { id: 'payment-links', src: '/payment_phone_mockups.png', alt: 'TamuPay send-money and payment link phone screens' },
  { id: 'bank-payouts', src: '/hero-dashboard.png', alt: 'Payout sent and webhook delivered confirmations' },
  { id: 'airtime', src: '/tamupay_airtime_data.png', alt: 'MTN and Airtel airtime top-up confirmations' },
  { id: 'security', src: '/tamupay_dev_integration.png', alt: 'API payment confirmation and webhook success' },
]

function ServicesHeroSlider() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setActive(i => (i + 1) % SLIDES.length), 4000)
    return () => clearInterval(t)
  }, [paused])

  const goTo = (i: number) => setActive((i + SLIDES.length) % SLIDES.length)

  const jumpToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section
      className="relative pt-32 pb-16 sm:pb-20 text-white overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="bg-orb w-[380px] h-[380px] -top-20 -right-20 bg-red-600/20 animate-orb-drift" />
      <div className="bg-orb w-[300px] h-[300px] -bottom-24 -left-16 bg-red-500/10 animate-orb-drift-slow" />

      <Reveal className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Integrated payment channels<br />
          <span className="text-red-500 mt-2 block">built specifically for East Africa</span>
        </h1>
      </Reveal>

      {/* Pure image slider — no card container, no overlaid copy */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => jumpToSection(s.id)}
              aria-label={`Jump to ${s.id.replace('-', ' ')} section`}
              className={`absolute inset-0 w-full h-full border-0 p-0 cursor-pointer transition-opacity duration-700 ease-out ${
                i === active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img src={s.src} alt={s.alt} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all border-0 ${
                i === active ? 'w-7 bg-red-500' : 'w-1.5 bg-white/25 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link to="/register" className="btn-shimmer w-full sm:w-auto bg-red-600 text-white px-8 py-3.5 rounded-full text-sm font-bold hover:bg-red-700 transition-all text-center shadow-md border-0 hover:scale-[1.02]">
            Create Free Account
          </Link>
          <Link to="/documentation" className="w-full sm:w-auto text-white border border-neutral-700 hover:border-white hover:bg-white/5 px-8 py-3.5 rounded-full text-sm font-bold transition-all text-center">
            Read API Docs
          </Link>
        </div>
      </div>
    </section>
  )
}

export function FeaturesPage() {
  return (
    <div className="font-sans overflow-x-hidden bg-white text-neutral-850">

      <ServicesHeroSlider />

      {/* Mobile Money Collections */}
      <section id="mobile-money" className="py-16 sm:py-24 bg-white scroll-mt-20">
        <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">Mobile money collections</h2>
              <p className="text-sm sm:text-base text-neutral-500 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Direct connections to MTN and Airtel Money. Prompt users to confirm collections on their handset via automated USSD push popups.
              </p>
              <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0 text-sm text-neutral-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Automatic prefix detection (MTN or Airtel)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Direct USSD push notifications to client phones</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Webhook triggers on transaction confirmations</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Sandbox simulation models for rapid development</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start pt-3">
                {['MTN MoMo', 'Airtel Money', 'USSD Push', 'Webhooks', 'Sandbox'].map(t => (
                  <span key={t} className="px-3.5 py-1 rounded-full text-xs font-semibold bg-neutral-50 text-neutral-800 border border-neutral-150">{t}</span>
                ))}
              </div>
            </div>
            {/* Visual - Simple card stripe style */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="bg-neutral-950 text-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <span className="text-neutral-400 text-xs font-bold tracking-tight">TamuPay Checkout</span>
                  <span className="bg-red-500/10 text-red-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Sandbox</span>
                </div>
                <p className="text-neutral-400 text-[10px] uppercase tracking-wider font-bold">Select Network</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-neutral-900 p-3 rounded-xl border border-red-600/30">
                    <img src="/mtn.jpg" alt="MTN" className="h-5 object-contain rounded" />
                    <span className="text-white text-xs font-bold">MTN MoMo</span>
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-900 p-3 rounded-xl border border-neutral-800 opacity-55">
                    <img src="/airtel.jpg" alt="Airtel" className="h-5 object-contain rounded" />
                    <span className="text-white text-xs font-medium">Airtel</span>
                  </div>
                </div>
                <p className="text-neutral-400 text-[10px] uppercase tracking-wider font-bold pt-1">Phone Number</p>
                <input readOnly value="+256 771 234567" className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white text-xs font-mono focus:outline-none" />
                <button type="button" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-full text-xs transition-colors mt-2 shadow-sm border-0">
                  Collect 50,000 UGX
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Card Payments */}
      <section
        id="cards"
        className="relative py-16 sm:py-24 text-white scroll-mt-20"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
      >
        <div className="absolute inset-0 bg-black/15" />
        <Reveal className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left card visual - Simple style */}
            <div className="lg:col-span-6 flex justify-center lg:justify-start order-2 lg:order-1">
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-neutral-850">
                <p className="text-neutral-800 font-bold text-sm tracking-tight border-b border-neutral-100 pb-2">Credit / Debit Card</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-neutral-400 text-[10px] uppercase tracking-wider font-bold mb-1">Card Number</p>
                    <input readOnly value="4000 1234 5678 9010" className="w-full bg-neutral-50 border border-neutral-250 rounded-xl px-3 py-2.5 text-neutral-800 text-xs font-mono focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-neutral-400 text-[10px] uppercase tracking-wider font-bold mb-1">Expiry</p>
                      <input readOnly value="12/28" className="w-full bg-neutral-50 border border-neutral-250 rounded-xl px-3 py-2.5 text-neutral-800 text-xs font-mono focus:outline-none" />
                    </div>
                    <div>
                      <p className="text-neutral-400 text-[10px] uppercase tracking-wider font-bold mb-1">CVV</p>
                      <input readOnly value="***" className="w-full bg-neutral-50 border border-neutral-250 rounded-xl px-3 py-2.5 text-neutral-800 text-xs font-mono focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full font-bold uppercase">Visa</span>
                    <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full font-bold uppercase">Mastercard</span>
                    <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full font-bold uppercase">3D Secure</span>
                  </div>
                  <button type="button" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-full text-xs transition-colors shadow-xs border-0">
                    Authorize Payment
                  </button>
                </div>
              </div>
            </div>
            {/* Copy right */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">Visa &amp; Mastercard</h2>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Accept major credit and debit cards. Employ 3D-Secure secondary checks to safeguard merchant profiles against unauthorized chargebacks.
              </p>
              <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0 text-sm text-neutral-300 font-medium">
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-500 mt-1" />
                  <span>Visa and Mastercard transactions supported</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-500 mt-1" />
                  <span>Standardized 3D Secure verification flows</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-500 mt-1" />
                  <span>Direct checkout integration with zero technical complexity</span>
                </li>
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Payment Links */}
      <section id="payment-links" className="py-16 sm:py-24 bg-white scroll-mt-20">
        <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Copy left */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">Branded billing links</h2>
              <p className="text-sm sm:text-base text-neutral-500 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Configure instant checkout pages and share links via SMS, WhatsApp, or email. Senders input values or complete preset payouts with zero website development.
              </p>
              <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0 text-sm text-neutral-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Fixed amounts or flexible customer values</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Merchant branding displays directly on checkout</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Accept MoMo or bank cards from the same page</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Push notifications to the dashboard on every settlement</span>
                </li>
              </ul>
            </div>
            {/* Visual - Simple card stripe style */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="bg-white border border-neutral-200 rounded-3xl shadow-xl p-6 w-full max-w-sm space-y-4 text-neutral-850">
                <p className="text-neutral-800 font-bold text-sm tracking-tight border-b border-neutral-100 pb-2">Billing Link Page</p>
                <div className="bg-neutral-50 border border-neutral-150 rounded-xl px-4 py-3 text-xs text-red-600 font-mono break-all font-bold">
                  tamupay.ug/pay/inv-2026-0091
                </div>
                <div className="bg-neutral-50 rounded-xl p-4 space-y-1 border border-neutral-100">
                  <p className="text-neutral-900 font-black text-xl">UGX 750,000</p>
                  <p className="text-neutral-500 text-xs font-semibold">Tamu Wifi - Invoice 91</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['MTN MoMo', 'Airtel Money', 'Cards'].map(m => (
                    <div key={m} className="bg-neutral-50 border border-neutral-150 rounded-lg py-2 text-center text-[10px] font-bold text-neutral-600">{m}</div>
                  ))}
                </div>
                <button type="button" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-full text-xs transition-colors shadow-xs border-0 font-bold">Pay Now</button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Bank Disbursements */}
      <section
        id="bank-payouts"
        className="relative py-16 sm:py-24 text-white scroll-mt-20"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
      >
        <div className="absolute inset-0 bg-black/15" />
        <Reveal className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left visual - Simple card stripe style */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end order-2 lg:order-1">
              <div className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-neutral-850">
                <p className="text-neutral-800 font-bold text-sm tracking-tight border-b border-neutral-100 pb-2">Settlement Registry</p>
                {[
                  { bank: 'Stanbic Bank', acct: '9030012345', amount: 'UGX 2,500,000', status: 'Settled', sc: 'text-emerald-600 bg-emerald-50' },
                  { bank: 'Centenary Bank', acct: '4050567890', amount: 'UGX 850,000', status: 'Processing', sc: 'text-amber-600 bg-amber-50' },
                  { bank: 'Equity Bank', acct: '6010234567', amount: 'UGX 4,000,000', status: 'Settled', sc: 'text-emerald-600 bg-emerald-50' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between bg-neutral-50/50 rounded-xl px-4 py-2.5">
                    <div>
                      <p className="text-neutral-800 text-xs font-bold">{r.bank}</p>
                      <p className="text-neutral-500 text-[10px] mt-0.5">{r.acct} · {r.amount}</p>
                    </div>
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${r.sc}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Copy right */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">Bank settlements</h2>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Execute transfer requests to 26+ Ugandan commercial banks. Automate staff payrolls or clear supplier balances via dashboard uploads or REST API methods.
              </p>
              <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0 text-sm text-neutral-300 font-medium">
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-500 mt-1" />
                  <span>Execute single payouts or upload bulk CSV files</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-500 mt-1" />
                  <span>Automated account name lookups before validation</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-500 mt-1" />
                  <span>Track payout logs, pull statements, and receive callbacks</span>
                </li>
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Airtime & Data */}
      <section id="airtime" className="py-16 sm:py-24 bg-white scroll-mt-20">
        <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">Top up MTN &amp; Airtel</h2>
              <p className="text-sm sm:text-base text-neutral-500 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Execute mobile top-ups for employees, field staff, or clients. Deducted instantly from your main TamuPay float balance with immediate verification.
              </p>
              <ul className="space-y-3 text-left max-w-md mx-auto lg:mx-0 text-sm text-neutral-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Accessible via both admin panel UI and API hooks</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Supports both MTN and Airtel network bundles</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa-solid fa-check text-red-600 mt-1" />
                  <span>Zero carrier markup — buy at standard price list</span>
                </li>
              </ul>
            </div>
            {/* Visual - Simple card stripe style */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="bg-white border border-neutral-200 rounded-3xl shadow-xl p-6 w-full max-w-sm space-y-4 text-neutral-850">
                <p className="text-neutral-800 font-bold text-sm tracking-tight border-b border-neutral-100 pb-2">Purchase Airtime</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-red-600 rounded-xl p-3 flex items-center gap-2 bg-red-50/30">
                    <img src="/mtn.jpg" alt="MTN" className="h-5 object-contain" />
                    <span className="text-red-700 font-bold text-xs">MTN Uganda</span>
                  </div>
                  <div className="border border-neutral-200 rounded-xl p-3 flex items-center gap-2 opacity-65">
                    <img src="/airtel.jpg" alt="Airtel" className="h-6 object-contain" />
                    <span className="text-neutral-600 font-bold text-xs">Airtel</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Daily 1GB', price: 'UGX 1,500' },
                    { label: 'Weekly 5GB', price: 'UGX 7,000' },
                    { label: 'Monthly 20GB', price: 'UGX 25,000' },
                    { label: 'Airtime credit', price: 'Flexible' },
                  ].map(b => (
                    <div key={b.label} className="bg-neutral-50 border border-neutral-100 rounded-xl p-3 text-center cursor-pointer hover:border-red-600 transition-colors">
                      <p className="text-neutral-700 text-2xs font-bold">{b.label}</p>
                      <p className="text-red-600 text-xs font-extrabold mt-0.5">{b.price}</p>
                    </div>
                  ))}
                </div>
                <button type="button" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-full text-xs transition-colors shadow-xs border-0">Top Up Now</button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Security Section */}
      <section
        id="security"
        className="relative py-16 sm:py-24 text-white scroll-mt-20"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
      >
        <div className="absolute inset-0 bg-black/15" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Security-first infrastructure</h2>
            <p className="text-sm text-neutral-300 max-w-xl mx-auto mt-2">
              Enterprise-grade protocols to protect funds, API endpoints, and customer records.
            </p>
          </Reveal>
          {/* Simple card stripe style for cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {[
              { iconClass: 'fa-solid fa-lock text-red-500', title: 'SSL Encryption', desc: 'All data packets are strictly encrypted over HTTPS. Access token validation and strict IP allowlisting.' },
              { iconClass: 'fa-solid fa-users-gear text-red-500', title: 'Granular Permissions', desc: 'Restrict staff member access. Control who can trigger disbursements, view balances, or pull log files.' },
              { iconClass: 'fa-solid fa-clock-rotate-left text-red-500', title: 'Audit Trails', desc: 'Complete ledger entries, webhook delivery history, and downloadable statements for fast reconciliation.' },
              { iconClass: 'fa-solid fa-shield-halved text-red-500', title: 'Fraud Prevention', desc: 'System limits and account velocity rules identify and prevent unusual transaction spikes.' },
              { iconClass: 'fa-solid fa-vial text-red-500', title: 'Isolated Sandbox', desc: 'Completely separated sandbox keys — simulate collection flows without routing real cash.' },
              { iconClass: 'fa-solid fa-envelope-open-text text-red-500', title: 'User Verification', desc: 'Two-factor checks during registration and settings updates prevent profile hijacking.' },
            ].map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <div className="card-lift bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs text-neutral-850 space-y-3 h-full">
                  <div className="pb-1">
                    <i className={`${s.iconClass} text-xl`} />
                  </div>
                  <h3 className="text-neutral-900 font-bold text-sm tracking-tight">{s.title}</h3>
                  <p className="text-neutral-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 text-center bg-white">
        <Reveal className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">Ready to integrate your payments?</h2>
          <p className="text-sm sm:text-base text-neutral-500 max-w-xl mx-auto">
            Create your TamuPay profile, complete simple merchant checks, and collect local customer payments.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/register" className="btn-shimmer w-full sm:w-auto bg-red-600 text-white px-8 py-3.5 rounded-full text-sm font-bold hover:bg-red-700 transition-all text-center shadow-md border-0 hover:scale-[1.02]">
              Sign Up Now — Free
            </Link>
            <Link to="/pricing" className="w-full sm:w-auto text-neutral-800 border border-neutral-250 hover:bg-neutral-50 px-8 py-3.5 rounded-full text-sm font-bold transition-all text-center">
              View Rates
            </Link>
          </div>
        </Reveal>
      </section>

    </div>
  )
}

export default FeaturesPage
