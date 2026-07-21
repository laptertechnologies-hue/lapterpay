import { Link } from 'react-router-dom'
import { Reveal } from '../../components/Reveal'
import { CountUp } from '../../components/CountUp'

const objectives = [
  {
    icon: 'fa-solid fa-money-bill-transfer',
    title: 'I want to collect payments',
    desc: 'MTN & Airtel MoMo, cards, and bank transfers into one wallet.',
    to: '/features',
  },
  {
    icon: 'fa-solid fa-building-columns',
    title: 'I want to pay out to banks',
    desc: 'Send salaries or supplier settlements to 26+ Ugandan banks.',
    to: '/features',
  },
  {
    icon: 'fa-solid fa-mobile-screen-button',
    title: 'I want to top up airtime & data',
    desc: 'Distribute bundles to staff, clients, or customers in bulk.',
    to: '/features',
  },
  {
    icon: 'fa-solid fa-code',
    title: 'I want to build with the API',
    desc: 'Ship an integration in hours with sandbox keys and clear docs.',
    to: '/developers',
  },
]

const stackingCards = [
  {
    title: 'Secure Payment Gateway',
    subtitle: 'Enterprise-grade collections routing',
    description: 'Accept customer payments via mobile money, card networks, and direct bank transfers under a single integrated gateway. Senders experience a frictionless pop-up prompt on their mobile device to finalize transactions immediately.',
    icon: 'fa-solid fa-credit-card',
    borderClass: 'border-red-600',
    features: [
      'Settle MTN & Airtel MoMo push-pull instantly',
      'Verify carrier network prefix validity',
      'Secure callback hooks upon payment success',
      'Direct card rails via Visa and Mastercard'
    ],
    visual: (
      <img 
        src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80" 
        alt="Secure payment terminal and cards" 
        className="w-full h-auto object-cover rounded-3xl shadow-2xl"
      />
    )
  },
  {
    title: 'Frictionless Merchant Onboarding',
    subtitle: 'Automated compliance verification',
    description: 'Register your corporate profile, configure webhook endpoints, and upload business documents directly from the admin dashboard. Our compliance team accelerates validating profiles so you can trigger real-time transaction processing.',
    icon: 'fa-solid fa-user-plus',
    borderClass: 'border-white',
    features: [
      'Submit incorporation files via dashboard wizard',
      'Automatic profile classification systems',
      'Immediate sandbox developer keys access',
      'Seamless transition from staging to live'
    ],
    visual: (
      <img 
        src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80" 
        alt="Business team onboarding" 
        className="w-full h-auto object-cover rounded-3xl shadow-2xl"
      />
    )
  },
  {
    title: 'Automated Bank Settlements',
    subtitle: 'Direct payouts to 26+ Ugandan banks',
    description: 'Execute payouts to major commercial banks or settle vendor balances instantly. Trigger single cashouts from your dashboard, or upload batch CSV salary files to clear hundreds of disbursements synchronously.',
    icon: 'fa-solid fa-building-columns',
    borderClass: 'border-red-600',
    features: [
      'Salary payouts to local bank accounts',
      'Verify routing codes and card holders',
      'Immediate webhook confirmations on settle',
      'Robust retry queue logic on server lag'
    ],
    visual: (
      <img 
        src="https://images.unsplash.com/photo-1601597111158-2fceff292cac?auto=format&fit=crop&w=600&q=80" 
        alt="Bank cash register and settlements" 
        className="w-full h-auto object-cover rounded-3xl shadow-2xl"
      />
    )
  },
  {
    title: 'Distribute Airtime & Data',
    subtitle: 'Unified bulk utilities dispatcher',
    description: 'Top up MTN & Airtel airtime, data bundles, or settle utility bills for clients, employees, or field staff. Balances deduct instantly from your unified float wallet, ensuring rapid local distributions.',
    icon: 'fa-solid fa-mobile-screen-button',
    borderClass: 'border-white',
    features: [
      'MTN & Airtel network topups supported',
      'No carrier markups on bulk distributions',
      'Automated batch triggers using portal tools',
      'Ledger audit records generated instantly'
    ],
    visual: (
      <img 
        src="/lapterpay_airtime_data.png" 
        alt="Airtime and Data dashboard mockup" 
        className="w-full h-auto object-cover rounded-3xl shadow-2xl"
      />
    )
  },
  {
    title: 'Developer REST APIs',
    subtitle: 'Build with staging sandbox keys',
    description: 'Integrate collections, payouts, and ledger requests inside your applications in hours. Leverage fully documented REST endpoints, separated staging sandbox credentials, and HMAC-signed webhook validation.',
    icon: 'fa-solid fa-code',
    borderClass: 'border-red-600',
    features: [
      'HMAC SHA-256 webhook headers validation',
      'Separated sandboxed mock database keys',
      'Clean JSON payloads with explicit versioning',
      'Dynamic callback triggers to simulate lag'
    ],
    visual: (
      <img 
        src="/lapterpay_dev_integration.png" 
        alt="Developer REST API integration illustration" 
        className="w-full h-auto object-cover rounded-3xl shadow-2xl"
      />
    )
  },
  {
    title: 'East Africa Coverage Map',
    subtitle: 'Unified regional float expansion',
    description: 'Grow your business across local borders. We are live in Uganda with MTN & Airtel mobile money rails, with Kenya, Tanzania, and Rwanda regional connections currently under active construction.',
    icon: 'fa-solid fa-earth-africa',
    borderClass: 'border-white',
    features: [
      'Live operations running in Uganda',
      'Coming soon flags for Kenya & Rwanda',
      'Unified multi-currency wallet conversion',
      'Compliance alignment for regional rules'
    ],
    visual: (
      <img 
        src="/lapterpay_east_africa_coverage.png" 
        alt="East Africa coverage payment map" 
        className="w-full h-auto object-cover rounded-3xl shadow-2xl"
      />
    )
  },
  {
    title: 'Enterprise-Grade Security',
    subtitle: 'Safeguard transactions and records',
    description: 'Enforce security protocols across all operations. Control user permissions, restrict API routing to specific server IPs, and secure client collections using strict SSL encryption safeguards.',
    icon: 'fa-solid fa-shield-halved',
    borderClass: 'border-red-600',
    features: [
      'Granular staff roles & permission gates',
      'Strict server IP whitelist restrictions',
      'Secure SSL transaction transfers',
      'Two-factor check steps during setups'
    ],
    visual: (
      <img 
        src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80" 
        alt="Secure server data lock" 
        className="w-full h-auto object-cover rounded-3xl shadow-2xl"
      />
    )
  }
]

export function HomePage() {
  return (
    <div className="font-sans overflow-x-hidden bg-white text-neutral-850">

      {/* ── 1. HERO WITH BACKSTAGE PHOTO BACKGROUND + AMBIENT MOTION ── */}
      <section
        className="relative flex items-center min-h-[600px] sm:min-h-[680px] lg:min-h-[760px] pt-24 pb-16 text-white bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: "url('/slider1.png')" }}
      >
        {/* Directional gradient for text contrast — lets the photo show through instead of a flat black wash */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/40 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent z-0" />

        {/* Ambient drifting gradient orbs for a modern, alive feel */}
        <div className="bg-orb w-[420px] h-[420px] -top-24 -left-24 bg-red-600/25 animate-orb-drift" />
        <div className="bg-orb w-[360px] h-[360px] -bottom-32 -right-16 bg-red-500/15 animate-orb-drift-slow" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Copy */}
            <Reveal variant="up" className="text-white text-center lg:text-left space-y-6">
              <span className="inline-flex items-center gap-2 bg-red-600/15 border border-red-500/30 text-red-400 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
                <i className="fa-solid fa-bolt text-[10px]" /> Live in Uganda
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white">
                Simplify Mobile Money,
                <span className="block text-red-500 mt-2">Card &amp; Bank Settlements.</span>
              </h1>

              <p className="text-xs sm:text-sm text-neutral-250 leading-relaxed font-medium">
                Collect business payments, execute payouts to 26+ banks, buy MTN &amp; Airtel airtime or data, and automate transaction bookkeeping via our integrated portal.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/register"
                  className="btn-shimmer inline-block bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full text-xs font-bold transition-all shadow-md border-0 cursor-pointer hover:scale-[1.03]"
                >
                  Create Free Account
                </Link>
                <a href="#objectives" className="text-xs font-bold text-neutral-300 hover:text-white transition-colors">
                  See what you can do <i className="fa-solid fa-arrow-down text-[10px] ml-1" />
                </a>
              </div>

              {/* Quick trust stats, animated on scroll into view */}
              <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
                <div>
                  <p className="text-2xl font-extrabold text-white">
                    <CountUp end={26} suffix="+" />
                  </p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Banks connected</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-white">
                    <CountUp end={3} decimals={1} suffix="%" />
                  </p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Flat transaction fee</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-white">T+1</p>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Settlement speed</p>
                </div>
              </div>
            </Reveal>

            {/* Pic on side (smiling woman) directly placed, no containing card wrappers */}
            <Reveal variant="scale" delay={150}>
              <img
                src="/hero-dashboard.png"
                alt="LapterPay payment dashboard"
                className="w-full h-auto max-h-[380px] lg:max-h-[460px] object-contain rounded-3xl animate-float"
                width={650}
                height={430}
              />
            </Reveal>
          </div>
        </div>

        {/* Scroll cue, echoing the "scroll to explore" pattern common on modern landing pages */}
        <a href="#objectives" className="scroll-cue absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-neutral-300 hover:text-white transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-widest">Scroll down</span>
          <i className="fa-solid fa-chevron-down text-sm" />
        </a>
      </section>

      {/* ── OBJECTIVE PICKER: "What do you want to do?" ── */}
      <section id="objectives" className="py-20 sm:py-28 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              What do you want to do today?
            </h2>
            <p className="text-neutral-500 text-sm sm:text-base leading-relaxed">
              Pick a goal — we will point you to the right part of LapterPay.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {objectives.map((o, i) => (
              <Reveal key={o.title} delay={i * 90} variant="up">
                <Link
                  to={o.to}
                  className="card-lift group block h-full bg-white border border-neutral-150 rounded-2xl p-6 shadow-card"
                >
                  <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <i className={`${o.icon} text-base`} />
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm leading-snug">{o.title}</h3>
                  <p className="text-xs text-neutral-500 mt-2 leading-relaxed">{o.desc}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <i className="fa-solid fa-arrow-right text-[9px]" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. PREMIUM SCROLL-DRIVEN STACKING CARDS SECTION ── */}
      <section className="relative bg-neutral-950 py-24 sm:py-32 overflow-hidden">
        {/* Parallax networks network graphic behind cards */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center bg-fixed opacity-15 z-0" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section title */}
          <Reveal className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              One unified portal. <span className="text-red-500">Infinite operations.</span>
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              Scroll down to explore how our stacked payment features consolidate float, simplify cashout, and protect integrations.
            </p>
          </Reveal>

          {/* Stacking Cards List */}
          <div className="relative space-y-12">
            {stackingCards.map((card, idx) => (
              <div 
                key={idx}
                className="sticky top-28 sm:top-32 pb-8 sm:pb-16 transition-all duration-300"
                style={{ top: `${112 + idx * 24}px` }} // Dynamic offset so headers stack neatly
              >
                {/* Floating Card Container */}
                <div className="card-lift bg-neutral-900 border border-neutral-800 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col md:flex-row gap-8 items-center min-h-[380px] sm:min-h-[420px]">
                  {/* Copy left */}
                  <div className="flex-1 space-y-4 text-left">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-950/40 text-red-500">
                      <i className={`${card.icon} text-lg`} />
                    </div>
                    <div>
                      <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider">{card.subtitle}</span>
                      <h3 className="text-2xl font-bold text-white mt-1">{card.title}</h3>
                    </div>
                    <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
                      {card.description}
                    </p>
                    <ul className="space-y-2 text-xs text-neutral-300 font-medium pt-2">
                      {card.features.map(f => (
                        <li key={f} className="flex items-center gap-2">
                          <i className="fa-solid fa-check text-red-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Graphic right */}
                  <div className="flex-1 w-full min-w-0 max-w-sm">
                    {card.visual}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. DETAILED CALL TO ACTION ── */}
      <section className="py-20 sm:py-28 text-center bg-neutral-50 border-t border-neutral-100">
        <Reveal className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight leading-tight">
            Ready to secure your business settlements?
          </h2>
          <p className="text-sm sm:text-base text-neutral-500 max-w-xl mx-auto">
            Get instant developer keys or request live merchant authorization profile. Settle collections daily direct to your wallet.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="btn-shimmer w-full sm:w-auto bg-red-600 text-white px-8 py-3.5 rounded-full text-sm font-bold hover:bg-red-700 transition-all text-center shadow-md border-0 hover:scale-[1.02]"
            >
              Sign Up Now — Free
            </Link>
            <Link
              to="/features"
              className="w-full sm:w-auto text-neutral-800 border border-neutral-250 hover:bg-neutral-50 px-8 py-3.5 rounded-full text-sm font-bold transition-all text-center"
            >
              Explore Services
            </Link>
          </div>
        </Reveal>
      </section>

    </div>
  )
}

export default HomePage
