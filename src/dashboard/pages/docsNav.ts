export interface DocNavItem {
  id: string
  title: string
  desc: string
  icon: string
  iconColor: string
}

export interface DocNavGroup {
  label: string
  items: DocNavItem[]
}

// Grouped, TamuPay-branded documentation navigation.
// Grouping (Start / Payment Methods / Platform / Help) is our own
// information architecture — distinct from the flat card-grid layout
// this was originally built from.
export const DOCS_NAV: DocNavGroup[] = [
  {
    label: 'Start here',
    items: [
      { id: 'payments', title: 'Getting Started', desc: 'Quick start guide to begin integrating with Tamupay', icon: 'fa-solid fa-bolt', iconColor: '#dc2626' },
      { id: 'api', title: 'API Reference', desc: 'Understanding the Tamupay API structure and endpoints', icon: 'fa-solid fa-code', iconColor: '#dc2626' },
      { id: 'sandbox', title: 'Sandbox Mode', desc: 'Test the API without real transactions or database changes', icon: 'fa-solid fa-vial', iconColor: '#dc2626' },
      { id: 'security', title: 'Security', desc: 'Security best practices and authentication standards', icon: 'fa-solid fa-shield-halved', iconColor: '#dc2626' },
    ],
  },
  {
    label: 'Collect payments',
    items: [
      { id: 'collections', title: 'Collections', desc: 'Collect money from customers using mobile money', icon: 'fa-solid fa-hand-holding-dollar', iconColor: '#0f172a' },
      { id: 'card-payments', title: 'Card Payments', desc: 'Collect via card: redirect URLs, checkout forms, and integration', icon: 'fa-solid fa-credit-card', iconColor: '#0f172a' },
      { id: 'payment-links', title: 'Payment Links', desc: 'Create shareable payment links for easy payment collection', icon: 'fa-solid fa-link', iconColor: '#0f172a' },
      { id: 'phone-verification', title: 'Phone Verification', desc: 'Verify phone numbers and retrieve owner carrier information', icon: 'fa-solid fa-phone-volume', iconColor: '#0f172a' },
    ],
  },
  {
    label: 'Send & disburse',
    items: [
      { id: 'send-money', title: 'Send Money', desc: 'Send money to recipients via mobile money wallets', icon: 'fa-solid fa-paper-plane', iconColor: '#0f172a' },
      { id: 'bank-transfer', title: 'Bank Transfer', desc: 'Request bank transfers to send money to bank accounts', icon: 'fa-solid fa-building-columns', iconColor: '#0f172a' },
      { id: 'bill-payments', title: 'Bill Payments', desc: 'Pay utility bills including electricity, water, and TV packages', icon: 'fa-solid fa-file-invoice', iconColor: '#0f172a' },
      { id: 'airtime-data', title: 'Airtime & Data', desc: 'Buy MTN and Airtel airtime and data bundles instantly', icon: 'fa-solid fa-mobile-screen-button', iconColor: '#0f172a' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { id: 'webhooks', title: 'Webhooks', desc: 'Set up webhooks to receive real-time transaction updates', icon: 'fa-solid fa-network-wired', iconColor: '#0f172a' },
    ],
  },
  {
    label: 'Help',
    items: [
      { id: 'troubleshooting', title: 'Troubleshooting', desc: 'Common integration issues, status diagnostics, and remedies', icon: 'fa-solid fa-triangle-exclamation', iconColor: '#64748b' },
      { id: 'faq', title: 'FAQ', desc: 'Frequently asked questions and technical reference answers', icon: 'fa-solid fa-circle-question', iconColor: '#64748b' },
    ],
  },
]

export const DOCS_FLAT: DocNavItem[] = DOCS_NAV.flatMap(g => g.items)
