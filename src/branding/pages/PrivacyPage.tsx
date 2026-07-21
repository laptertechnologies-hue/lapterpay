import { Link } from 'react-router-dom'
import { Reveal } from '../../components/Reveal'

const sections = [
  {
    id: 'overview',
    title: '1. Overview',
    body: (
      <p>
        This Privacy Policy explains how TamuPay ("we", "us") collects, uses, shares, and protects personal data when
        you use our website, dashboard, and API (the "Service"). It applies to merchants who register with TamuPay and,
        where relevant, to the customers your business transacts with through our rails. We process personal data in
        line with Uganda's Data Protection and Privacy Act, 2019.
      </p>
    ),
  },
  {
    id: 'data-we-collect',
    title: '2. Data we collect',
    body: (
      <>
        <p><strong>Account data:</strong> name, email, phone number, password (hashed, never stored in plain text), business name and type.</p>
        <p><strong>KYC/verification data:</strong> government ID details, certificate of incorporation, proof of address, and other documents you submit for merchant verification.</p>
        <p><strong>Transaction data:</strong> amounts, timestamps, payment method, and the mobile number, card, or bank account details necessary to process a collection or payout.</p>
        <p><strong>Technical data:</strong> IP address, device/browser information, and API request logs, collected for security, fraud prevention, and debugging.</p>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: '3. How we use your data',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>To create and manage your account, and verify your business for live transaction access;</li>
        <li>To process collections, payouts, and other transactions you initiate;</li>
        <li>To detect and prevent fraud, money laundering, and unauthorized account access;</li>
        <li>To send transactional emails (welcome, verification codes, receipts, security alerts) and, where you've opted in, product updates;</li>
        <li>To comply with legal, tax, and regulatory obligations applicable to payment service providers in Uganda.</li>
      </ul>
    ),
  },
  {
    id: 'sharing',
    title: '4. Who we share data with',
    body: (
      <>
        <p>We share the minimum data necessary with:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Mobile network operators (MTN, Airtel) and card networks, to route and confirm transactions;</li>
          <li>Partner banks, for bank transfer settlements and payouts;</li>
          <li>Cloud infrastructure and database providers (e.g. Supabase) who host our systems under data-processing agreements;</li>
          <li>Regulators or law enforcement, where legally required.</li>
        </ul>
        <p>We do not sell personal data to third parties for advertising purposes.</p>
      </>
    ),
  },
  {
    id: 'security',
    title: '5. How we protect your data',
    body: (
      <p>
        All data in transit is encrypted over HTTPS/TLS. API secret keys are stored only as irreversible cryptographic
        hashes — even TamuPay staff cannot view a generated secret after the moment it is issued. Database access is
        governed by row-level security so a merchant's data is only reachable by that merchant's authenticated
        session (or by our backend using elevated, audited service credentials). We restrict payout-affecting API
        requests using IP allow-listing and idempotency protection to prevent replay/duplicate transactions.
      </p>
    ),
  },
  {
    id: 'retention',
    title: '6. Data retention',
    body: (
      <p>
        We retain transaction and KYC records for as long as your account is active and for a minimum period afterward
        as required by Ugandan financial recordkeeping regulations (typically at least five years for transaction
        records). You may request deletion of account data that is not subject to a legal retention requirement by
        contacting us.
      </p>
    ),
  },
  {
    id: 'your-rights',
    title: '7. Your rights',
    body: (
      <>
        <p>Under the Data Protection and Privacy Act, 2019, you have the right to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Access the personal data we hold about you;</li>
          <li>Request correction of inaccurate data;</li>
          <li>Request deletion of data we are not legally required to retain;</li>
          <li>Object to certain processing, such as marketing communications.</li>
        </ul>
        <p>
          To exercise any of these rights, email{' '}
          <a href="mailto:support@tamupay.ug" className="text-red-600 font-semibold hover:underline">support@tamupay.ug</a>.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: '8. Cookies',
    body: (
      <p>
        We use essential cookies/local storage to keep you signed in and remember dashboard preferences (such as
        selected currency or environment). We do not use third-party advertising trackers on the dashboard.
      </p>
    ),
  },
  {
    id: 'changes',
    title: '9. Changes to this policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. Material changes will be announced via the dashboard or
        email at least 14 days before taking effect.
      </p>
    ),
  },
  {
    id: 'contact',
    title: '10. Contact us',
    body: (
      <p>
        Questions about this Privacy Policy can be sent to{' '}
        <a href="mailto:support@tamupay.ug" className="text-red-600 font-semibold hover:underline">support@tamupay.ug</a>{' '}
        or via our <Link to="/contact" className="text-red-600 font-semibold hover:underline">Contact page</Link>.
      </p>
    ),
  },
]

export function PrivacyPage() {
  return (
    <div className="font-sans overflow-x-hidden bg-white text-neutral-850">
      <section
        className="relative pt-32 pb-16 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
      >
        <div className="bg-orb w-[320px] h-[320px] -top-16 -left-16 bg-red-600/20 animate-orb-drift" />
        <Reveal className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-neutral-300">Last updated: July 2026</p>
        </Reveal>
      </section>

      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <Reveal className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-2xl p-4 leading-relaxed">
            This document is a plain-language starting point for TamuPay's privacy practices. It is not a substitute
            for advice from a Uganda-licensed data protection or fintech-compliance lawyer, and should be reviewed by
            one before being relied on as your binding privacy notice.
          </Reveal>

          {sections.map((s, i) => (
            <Reveal key={s.id} delay={Math.min(i * 40, 300)} id={s.id} className="space-y-3 scroll-mt-24">
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">{s.title}</h2>
              <div className="text-sm text-neutral-600 leading-relaxed space-y-3">{s.body}</div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}

export default PrivacyPage
