import { Link } from 'react-router-dom'
import { Reveal } from '../../components/Reveal'

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of these Terms',
    body: (
      <>
        <p>
          These Terms of Service ("Terms") govern access to and use of the LapterPay payment gateway, dashboard, APIs,
          and related services (collectively, the "Service"), operated by LapterPay ("LapterPay", "we", "us", or "our"),
          a payment services provider based in Kampala, Uganda.
        </p>
        <p>
          By creating a LapterPay account, integrating our API, or otherwise using the Service, you ("Merchant", "you")
          agree to be bound by these Terms and by our <Link to="/privacy" className="text-red-600 font-semibold hover:underline">Privacy Policy</Link>.
          If you are agreeing on behalf of a business, you confirm that you have authority to bind that business.
        </p>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: '2. Eligibility and account verification (KYC)',
    body: (
      <>
        <p>
          You must be at least 18 years old and capable of forming a binding contract to register for LapterPay. Business
          accounts must be lawfully registered in Uganda (or, for later-supported markets, that market's jurisdiction).
        </p>
        <p>
          Sandbox access is granted immediately on sign-up so you can test integrations. Access to <strong>live</strong>{' '}
          transaction processing requires you to complete our Know-Your-Customer (KYC) verification — submitting
          accurate business information and supporting documents. We may approve, reject, or request additional
          information at our discretion, in line with our obligations under Uganda's National Payment Systems Act,
          2020 and applicable anti-money-laundering regulations.
        </p>
      </>
    ),
  },
  {
    id: 'services',
    title: '3. Description of the Service',
    body: (
      <p>
        LapterPay provides tools to collect payments (mobile money, cards, bank transfers), disburse payouts, buy
        airtime and data bundles, generate payment links, and receive webhook notifications, through the dashboard and
        REST API. We act as a technical intermediary connecting you to underlying payment rails (mobile network
        operators, card networks, and partner banks); we do not guarantee the uptime or behavior of those third-party
        systems, though we take commercially reasonable steps to maintain reliable service.
      </p>
    ),
  },
  {
    id: 'fees',
    title: '4. Fees and settlement',
    body: (
      <>
        <p>
          Fees are as published on our <Link to="/pricing" className="text-red-600 font-semibold hover:underline">Pricing</Link> page
          at the time of the transaction, unless a separate written agreement specifies custom rates. Fees are
          deducted automatically from the transaction amount or your wallet balance; we do not send separate invoices
          for standard per-transaction fees.
        </p>
        <p>
          Settlement timing (e.g. instant wallet credit, T+1 bank settlement) is disclosed in the dashboard and
          developer documentation for each payment method. We reserve the right to delay, hold, or reverse settlement
          of a transaction we reasonably believe to be fraudulent, disputed, or in breach of these Terms, pending
          investigation.
        </p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: '5. Acceptable use',
    body: (
      <>
        <p>You agree not to use the Service to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Process payments for illegal goods or services, including under Ugandan or applicable international law;</li>
          <li>Facilitate money laundering, terrorist financing, or sanctions evasion;</li>
          <li>Circumvent our fraud, KYC, or transaction-limit controls;</li>
          <li>Attempt to gain unauthorized access to our systems, other merchants' data, or API keys not issued to you;</li>
          <li>Misrepresent your identity, business, or the nature of goods/services sold to customers.</li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate this section immediately and without prior notice where
          reasonably necessary to prevent harm or comply with law.
        </p>
      </>
    ),
  },
  {
    id: 'api-keys',
    title: '6. API keys and account security',
    body: (
      <p>
        You are responsible for safeguarding your API keys, dashboard credentials, and any two-factor authentication
        methods enabled on your account. LapterPay stores API secret keys only as irreversible cryptographic hashes and
        shows you the full secret exactly once at creation — we cannot recover a lost key, only issue a new one. You
        must notify us immediately at <a href="mailto:support@lapterpay.ug" className="text-red-600 font-semibold hover:underline">support@lapterpay.ug</a>{' '}
        if you suspect a key or account has been compromised, so we can revoke it.
      </p>
    ),
  },
  {
    id: 'refunds',
    title: '7. Refunds, chargebacks, and disputes',
    body: (
      <p>
        Refunds are processed through the dashboard or API and are subject to review before funds move. You remain
        responsible for chargebacks, reversals, or disputes initiated by your customers' banks or mobile money
        providers, and LapterPay may debit your wallet balance to cover such reversals where the underlying payment
        rail reverses a settled transaction.
      </p>
    ),
  },
  {
    id: 'liability',
    title: '8. Limitation of liability',
    body: (
      <p>
        To the maximum extent permitted by Ugandan law, LapterPay's aggregate liability for any claim arising from your
        use of the Service is limited to the fees you paid us in the three (3) months preceding the event giving rise
        to the claim. We are not liable for indirect, incidental, or consequential losses, including lost profits or
        lost data, except where such exclusion is not permitted by law.
      </p>
    ),
  },
  {
    id: 'termination',
    title: '9. Suspension and termination',
    body: (
      <p>
        Either party may terminate the relationship at any time; you may close your account from the dashboard or by
        contacting support. We may suspend or terminate access immediately for suspected fraud, legal or regulatory
        requirement, unpaid fees, or material breach of these Terms. On termination, outstanding settled balances will
        be paid out to your registered bank account, less any fees or amounts held for pending disputes.
      </p>
    ),
  },
  {
    id: 'changes',
    title: '10. Changes to these Terms',
    body: (
      <p>
        We may update these Terms from time to time. Material changes will be notified via the dashboard or email at
        least 14 days before taking effect. Continued use of the Service after changes take effect constitutes
        acceptance of the revised Terms.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: '11. Governing law',
    body: (
      <p>
        These Terms are governed by the laws of the Republic of Uganda. Any dispute not resolved informally will be
        subject to the exclusive jurisdiction of the courts of Uganda.
      </p>
    ),
  },
  {
    id: 'contact',
    title: '12. Contact us',
    body: (
      <p>
        Questions about these Terms can be sent to{' '}
        <a href="mailto:support@lapterpay.ug" className="text-red-600 font-semibold hover:underline">support@lapterpay.ug</a>{' '}
        or +256 763 721005, or via our <Link to="/contact" className="text-red-600 font-semibold hover:underline">Contact page</Link>.
      </p>
    ),
  },
]

export function TermsPage() {
  return (
    <div className="font-sans overflow-x-hidden bg-white text-neutral-850">
      <section
        className="relative pt-32 pb-16 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
      >
        <div className="bg-orb w-[320px] h-[320px] -top-16 -right-16 bg-red-600/20 animate-orb-drift" />
        <Reveal className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-neutral-300">Last updated: July 2026</p>
        </Reveal>
      </section>

      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <Reveal className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-2xl p-4 leading-relaxed">
            This document is provided as a plain-language starting point for LapterPay's merchant agreement. It is not a
            substitute for advice from a Uganda-licensed lawyer, and should be reviewed by one — together with your
            National Payment Systems Act, 2020 licensing counsel — before being relied on as your binding merchant terms.
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

export default TermsPage
