import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '../../components/Reveal'

const allFaqs = [
  {
    q: 'How much does TamuPay cost?',
    a: 'We bill a transparent flat fee of 3% per successful collection. Senders pay 0 startup, setup, or recurring monthly fees.',
  },
  {
    q: 'Can I test before going live?',
    a: 'Yes, absolutely. Registration activates immediate developer sandbox credentials so you can test endpoints, payloads, and mock webhooks.',
  },
  {
    q: 'Which regions are supported?',
    a: 'TamuPay is fully live in Uganda with MTN & Airtel mobile money, bank disbursements, and utility topups. Kenya, Tanzania, and Rwanda will be released next.',
  },
  {
    q: 'How long does merchant validation take?',
    a: 'Submit your business details and legal documents in the dashboard. Our local compliance team reviews and approves profiles in a few business days.',
  },
  {
    q: 'Are there any registration or monthly setup fees?',
    a: 'Absolutely none. Signing up and configuring your account is completely free. We do not charge setup fees or monthly maintenance fees. You are only billed per successful transaction.',
  },
  {
    q: 'What is the processing fee for live transactions?',
    a: 'We charge a flat 3% processing fee per successful transaction across all payment channels — including MTN Mobile Money, Airtel Money, Visa, and Mastercard.',
  },
  {
    q: 'What is the sandbox environment for?',
    a: 'Our sandbox mode allows development teams to thoroughly test and verify integrations, callbacks, webhooks, and payouts using mock data without processing real money.',
  },
  {
    q: 'How fast are payouts settled to bank accounts?',
    a: 'We process settlements daily (T+1 basis) directly to your Ugandan bank account or mobile money payout wallet.',
  },
  {
    q: 'Are there volume discounts for large businesses?',
    a: 'Yes. High-throughput businesses processing significant monthly volumes can contact our sales team to discuss custom pricing and reduced rates.',
  },
  {
    q: 'Which payment methods are supported?',
    a: 'MTN Mobile Money, Airtel Money, Visa, Mastercard, and direct bank disbursements to 26+ Ugandan banks. Airtime and data bundle purchases are also supported.',
  },
]

export function FaqPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFaqs = allFaqs.filter(faq =>
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="font-sans overflow-x-hidden bg-white text-neutral-850">
      {/* Hero — brand gradient, no external stock imagery */}
      <section
        className="relative pt-32 pb-20 sm:pb-28 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
      >
        <div className="bg-orb w-[340px] h-[340px] -top-20 -right-20 bg-red-600/20 animate-orb-drift" />
        <Reveal className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 max-w-xl mx-auto leading-relaxed">
            Find answers to common questions about TamuPay collections, payouts, sandbox testing, and pricing setup.
          </p>
          <div className="max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 text-xs bg-neutral-900/80 border border-neutral-800 rounded-full text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 focus:ring-0"
            />
          </div>
        </Reveal>
      </section>

      {/* FAQ Accordion List */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-sm">
              No matching questions found. Try a different search term.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 border-t border-b border-neutral-100">
              {filteredFaqs.map((faq, i) => (
                <Reveal key={i} delay={Math.min(i * 40, 320)} className="py-4.5">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-3 text-left bg-transparent border-0 outline-none cursor-pointer py-1"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-bold text-neutral-900 text-sm sm:text-base">{faq.q}</span>
                    <span className="text-red-600 transition-transform shrink-0">
                      <i className={`fa-solid ${openFaq === i ? 'fa-angle-up' : 'fa-angle-down'} text-sm`} />
                    </span>
                  </button>
                  {openFaq === i && (
                    <p className="pt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed font-medium">
                      {faq.a}
                    </p>
                  )}
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 text-center bg-neutral-50 border-t border-neutral-100">
        <Reveal className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">Still have questions?</h2>
          <p className="text-sm text-neutral-500 max-w-xl mx-auto">
            Our support and compliance integration teams are here to help you get started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/register" className="btn-shimmer w-full sm:w-auto bg-red-600 text-white px-8 py-3.5 rounded-full text-sm font-bold hover:bg-red-700 transition-all text-center shadow-md border-0 hover:scale-[1.02]">
              Sign Up Now — Free
            </Link>
            <Link to="/pricing" className="w-full sm:w-auto text-neutral-800 border border-neutral-250 hover:bg-neutral-50 px-8 py-3.5 rounded-full text-sm font-bold transition-all text-center">
              Contact Support
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

export default FaqPage
