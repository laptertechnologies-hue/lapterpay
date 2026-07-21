import { Link } from 'react-router-dom'
import { Reveal } from '../../components/Reveal'
import { CountUp } from '../../components/CountUp'

export function PricingPage() {
  return (
    <div className="font-sans overflow-x-hidden bg-white text-neutral-850">

      {/* Hero — brand gradient, no external stock imagery */}
      <section
        className="relative pt-32 pb-20 sm:pb-28 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
      >
        <div className="bg-orb w-[360px] h-[360px] -top-16 -left-16 bg-red-600/20 animate-orb-drift" />
        <Reveal className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">Pay strictly on results</h1>
          <p className="text-sm sm:text-base text-neutral-300 max-w-xl mx-auto leading-relaxed">
            Zero setup fees. Zero monthly software licensing costs. Test in sandbox for free and upgrade as soon as you verify your profile.
          </p>
        </Reveal>
      </section>

      {/* Key metrics */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center mb-16">
            <div className="space-y-1">
              <p className="text-5xl sm:text-6xl font-extrabold text-red-655 leading-none">
                <CountUp end={3} decimals={0} suffix="%" />
              </p>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">per successful transaction</p>
            </div>
            <div className="space-y-1">
              <p className="text-5xl sm:text-6xl font-extrabold text-neutral-900 leading-none">UGX 0</p>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">setup &amp; monthly platform fees</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-neutral-900 leading-snug pt-3 sm:pt-4">Custom rates</p>
              <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">for high-volume merchants</p>
            </div>
          </Reveal>

          {/* Feature comparison - Stripe style simple cards, outline removed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sandbox */}
            <Reveal variant="left" className="card-lift bg-white border border-neutral-200 rounded-3xl p-8 space-y-6 shadow-md">
              <div>
                <p className="text-3xl font-black text-neutral-900">Free</p>
                <p className="text-xs text-neutral-500 mt-1">No billing or setup fees</p>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">For developers integrating and testing the API endpoints.</p>
              <ul className="space-y-3">
                {[
                  'Simulate mobile money collections',
                  'Test wallet peer-to-peer transfers',
                  'Simulate payouts & disbursements',
                  'Mock callback logs audit console',
                  'Access developer sandbox API keys',
                  'Standard community support lines',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-xs text-neutral-600 font-medium">
                    <i className="fa-solid fa-check text-neutral-500 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="block w-full text-center border border-neutral-250 text-neutral-700 hover:text-red-605 hover:border-red-605 px-6 py-3 rounded-full font-bold text-xs transition-colors">
                Register Sandbox Keys
              </Link>
            </Reveal>

            {/* Production */}
            <Reveal variant="right" delay={100} className="card-lift bg-white border-2 border-red-600 rounded-3xl p-8 space-y-6 relative shadow-lg">
              <span className="absolute -top-3 left-8 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                Most popular
              </span>
              <div>
                <p className="text-3xl font-black text-neutral-900">3.0%</p>
                <p className="text-xs text-neutral-500 mt-1">per successful transaction only</p>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">For verified businesses collecting real customer payments.</p>
              <ul className="space-y-3">
                {[
                  'Includes all sandbox features',
                  'Live MTN & Airtel collections (3.0%)',
                  'Live Visa & Mastercard payments (3.0%)',
                  'Standard payouts & bank settlements (3.0%)',
                  'Active webhook signature validation',
                  'IP whitelist routing protection',
                  'Priority email & ticket support',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-xs text-neutral-600 font-medium">
                    <i className="fa-solid fa-check text-red-650 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="btn-shimmer block w-full text-center bg-red-600 text-white px-6 py-3 rounded-full font-bold text-xs hover:bg-red-700 transition-all border-0 hover:scale-[1.02]">
                Go Live Now
              </Link>
            </Reveal>
          </div>

          {/* Included in all plans */}
          <Reveal className="mt-16 bg-neutral-50 rounded-3xl border border-neutral-200 p-8 space-y-6 shadow-xs">
            <h3 className="text-neutral-900 font-bold text-sm uppercase tracking-wider text-center">Included in all plans</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { iconClass: 'fa-solid fa-lock text-red-600', label: 'SSL encryption' },
                { iconClass: 'fa-solid fa-chart-line text-red-600', label: 'Real-time dashboard' },
                { iconClass: 'fa-solid fa-bell text-red-600', label: 'Webhook callbacks' },
                { iconClass: 'fa-solid fa-mobile-screen text-red-600', label: 'MTN & Airtel' },
                { iconClass: 'fa-solid fa-building-columns text-red-600', label: '26+ Ugandan banks' },
                { iconClass: 'fa-solid fa-list-check text-red-600', label: 'Transaction logs' },
                { iconClass: 'fa-solid fa-users text-red-600', label: 'Team roles' },
                { iconClass: 'fa-solid fa-earth-africa text-red-600', label: 'East Africa expansion' },
              ].map(i => (
                <div key={i.label} className="flex items-center gap-2.5">
                  <i className={`${i.iconClass} text-sm shrink-0`} />
                  <span className="text-xs text-neutral-600 font-semibold">{i.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
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

export default PricingPage
