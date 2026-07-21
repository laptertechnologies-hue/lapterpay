import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

export function BrandLayout() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Scroll-driven UI: compact nav + top progress bar (modern SaaS pattern)
  const [scrolled, setScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Custom chat card states
  const [showChatCard, setShowChatCard] = useState(false)
  const [chatTab, setChatTab] = useState<'home' | 'messages'>('home')
  const [chatMessageInput, setChatMessageInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ text: string; time: string; sender: 'user' | 'agent' }[]>([
    { text: 'Hi! Let us know if you have any questions about integrations.', time: 'now', sender: 'agent' }
  ])

  // Close mobile menu on route change
  useEffect(() => setMobileMenuOpen(false), [location.pathname])

  // Reset scroll UI state on route change and track scroll for nav + progress bar
  useEffect(() => {
    window.scrollTo(0, 0)
    const handleScroll = () => {
      const doc = document.documentElement
      const scrollTop = doc.scrollTop || document.body.scrollTop
      const scrollHeight = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight
      setScrolled(scrollTop > 12)
      setScrollProgress(scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/features', label: 'Services' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/developers', label: 'Developers' },
    { path: '/faq', label: 'FAQs' },
    { path: '/documentation', label: 'Documentation' },
    { path: '/contact', label: 'Contact Us' },
  ]

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessageInput.trim()) return
    const newMsg = chatMessageInput
    setChatMessages(prev => [...prev, { text: newMsg, time: 'now', sender: 'user' }])
    setChatMessageInput('')

    // Simulated reply
    setTimeout(() => {
      setChatMessages(prev => [...prev, { text: 'Thanks for contacting TamuPay! A support agent will respond shortly on WhatsApp.', time: 'now', sender: 'agent' }])
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-850 relative">
      
      {/* ── GLOBAL FLOATING ACTION BUTTONS ── */}
      
      {/* Left side: WhatsApp support */}
      <a
        href="https://wa.me/256763721005"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 bg-[#25D366] hover:bg-[#20ba5a] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
        title="WhatsApp Support"
      >
        <i className="fa-brands fa-whatsapp text-2xl" />
      </a>

      {/* Right side: Floating chat button + interactive card */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 max-w-[340px] sm:max-w-[380px]">
        {/* Interactive Chat Card (TamuPay system colors: red, black, white) */}
        {showChatCard && (
          <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col w-[300px] sm:w-[360px] max-h-[460px] animate-fade-in mb-3">
            {/* Header: Dark charcoal with red highlight stripe */}
            <div className="bg-neutral-950 text-white p-5 relative border-b-2 border-red-600">
              <button
                onClick={() => setShowChatCard(false)}
                type="button"
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors bg-transparent border-0 outline-none text-base cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
              
              {chatTab === 'home' ? (
                <div className="space-y-2 pr-4">
                  <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    Hi there 👋
                  </h3>
                  <p className="text-neutral-400 text-xs leading-relaxed font-medium">
                    Need help? Search our help center for answers or start a conversation:
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setChatTab('home')}
                    type="button"
                    className="text-neutral-400 hover:text-white bg-transparent border-0 outline-none cursor-pointer"
                  >
                    <i className="fa-solid fa-chevron-left text-sm" />
                  </button>
                  <span className="font-bold text-sm tracking-tight">Messages</span>
                </div>
              )}
            </div>

            {/* Body: Clean white UI */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white text-neutral-850">
              {chatTab === 'home' ? (
                <div className="space-y-4">
                  {/* Search Section */}
                  <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-bold text-neutral-900">Help Center</h4>
                    <div className="relative">
                      <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
                      <input
                        type="text"
                        placeholder="Search for answers"
                        className="w-full bg-white border border-neutral-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-red-600 focus:ring-0 text-neutral-800"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setChatTab('messages');
                        }}
                      />
                    </div>
                  </div>

                  {/* Start Conversation Section */}
                  <div 
                    onClick={() => setChatTab('messages')}
                    className="bg-neutral-50 hover:bg-neutral-100 rounded-2xl p-4 border border-neutral-100 flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                  >
                    <div className="space-y-0.5 text-left">
                      <h4 className="text-xs font-bold text-neutral-900 group-hover:text-red-600 transition-colors">New Conversation</h4>
                      <p className="text-[10px] text-neutral-500 font-medium">We typically reply in a few minutes</p>
                    </div>
                    <i className="fa-regular fa-paper-plane text-neutral-400 group-hover:text-red-600 transition-colors text-xs" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-[280px]">
                  {/* Message log */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-left">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider text-center py-1">Start a new chat</p>
                    
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
                          m.sender === 'user' 
                            ? 'bg-neutral-900 text-white rounded-tr-none' 
                            : 'bg-neutral-100 text-neutral-800 rounded-tl-none'
                        }`}>
                          <p className="leading-relaxed">{m.text}</p>
                        </div>
                        <span className="text-[9px] text-neutral-400 font-medium mt-0.5 px-1">{m.time}</span>
                      </div>
                    ))}
                  </div>

                  {/* Chat input form */}
                  <form onSubmit={handleSendMessage} className="pt-3 border-t border-neutral-150 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatMessageInput}
                      onChange={e => setChatMessageInput(e.target.value)}
                      className="flex-1 bg-neutral-50 border border-neutral-250 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-red-600 text-neutral-800"
                    />
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors border-0 cursor-pointer"
                    >
                      <i className="fa-regular fa-paper-plane text-2xs" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Toggle Button (Red system design) */}
        <div className="relative group">
          {/* Bouncing Tooltip (only when closed) */}
          {!showChatCard && (
            <div className="absolute -top-11 right-0 bg-red-600 text-white text-[10px] font-bold py-1 px-2.5 rounded-full whitespace-nowrap shadow-md animate-bounce pointer-events-none">
              We Are Here!
              <div className="absolute -bottom-1 right-5 w-2.5 h-2.5 bg-red-600 rotate-45" />
            </div>
          )}

          <button
            onClick={() => setShowChatCard(prev => !prev)}
            type="button"
            className="bg-red-600 hover:bg-red-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 outline-none focus:outline-none cursor-pointer border-0"
            title="Customer Support Chat"
          >
            {showChatCard ? (
              <i className="fa-solid fa-xmark text-lg" />
            ) : (
              <i className="fa-regular fa-comment-dots text-lg" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation — Always fixed to clean white header to support dark logo. Compresses + gains elevation on scroll. */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-100 transition-all duration-300 ${
          scrolled ? 'nav-shrink' : 'shadow-xs'
        }`}
      >
        {/* Scroll progress indicator */}
        <div className="scroll-progress-track">
          <div className="scroll-progress-bar" style={{ transform: `scaleX(${scrollProgress})` }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className={`flex justify-between items-center transition-all duration-300 ${scrolled ? 'h-12 sm:h-14' : 'h-14 sm:h-16'}`}>
            {/* Left: Logo */}
            <div className="flex items-center shrink-0">
              <Link to="/" className="flex items-center">
                <img src="/tamu.png" alt="TamuPay" className={`w-auto transition-all duration-300 ${scrolled ? 'h-8 sm:h-9' : 'h-9 sm:h-11'}`} />
              </Link>
            </div>

            {/* Center: Desktop nav links */}
            <div className="hidden lg:flex items-center justify-center flex-1">
              <div className="flex items-center gap-1">
                {navItems.map(item => {
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-4 py-2 text-xs font-bold tracking-wide transition-all rounded-full ${
                        isActive
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-neutral-700 hover:bg-red-600 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Right: Auth buttons (desktop) */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-red-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-shimmer bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs border-0 cursor-pointer hover:scale-[1.03]"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="lg:hidden focus:outline-none p-2 text-neutral-800 hover:text-red-600"
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen(o => !o)}
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile menu overlay: opens on top of content displaying nav links and buttons alone without outer box */}
          {mobileMenuOpen && (
            <div className="absolute top-[56px] left-0 right-0 bg-white border-b border-neutral-200 shadow-2xl z-[100] py-6 px-6 space-y-4 animate-fade-in flex flex-col lg:hidden">
              {navItems.map(item => {
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-4 py-2.5 text-xs font-bold transition-all rounded-full ${
                      isActive
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-neutral-800 hover:bg-red-600 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
              <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2.5">
                <Link
                  to="/login"
                  className="block px-4 py-2.5 text-xs font-bold text-neutral-750 hover:text-red-600 hover:bg-neutral-50 rounded-full transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-3 text-xs font-bold rounded-full transition-colors bg-red-600 hover:bg-red-700 text-white text-center shadow-xs border-0"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Page content */}
      <main>
        <Outlet />
      </main>

      {/* Footer with Handshake Background & Tint Overlay */}
      <footer className="relative bg-[url('https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center text-white border-t border-neutral-900 overflow-hidden">
        {/* Dark opacity overlay layer */}
        <div className="absolute inset-0 bg-neutral-950/93 z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand details */}
            <div className="col-span-2 md:col-span-2 space-y-4">
              <img src="/tamu.png" alt="TamuPay" className="h-10 w-auto" />
              <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
                Direct and secure payments for East Africa. Easily process MTN and Airtel mobile money collections, utility payouts, and automated commercial ledger bookkeeping.
              </p>
              <div className="space-y-1.5 text-neutral-400 text-xs font-medium">
                <p className="flex items-center gap-2"><i className="fa-solid fa-phone text-red-500" /> +256 763 721005</p>
                <p className="flex items-center gap-2"><i className="fa-solid fa-envelope text-red-500" /> support@tamupay.ug</p>
                <p className="flex items-center gap-2 text-neutral-500"><i className="fa-solid fa-location-dot text-red-500" /> Kampala, Uganda</p>
              </div>
              {/* Circular Social Icons — GitHub removed */}
              <div className="flex items-center gap-3 pt-2">
                <a href="#" className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-red-600 hover:bg-red-600/10 transition-all">
                  <i className="fa-brands fa-x-twitter text-sm" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-red-600 hover:bg-red-600/10 transition-all">
                  <i className="fa-brands fa-linkedin-in text-sm" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-red-600 hover:bg-red-600/10 transition-all">
                  <i className="fa-brands fa-tiktok text-sm" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-red-600 hover:bg-red-600/10 transition-all">
                  <i className="fa-brands fa-facebook-f text-sm" />
                </a>
              </div>
            </div>

            {/* Product & Solutions */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Solutions</h4>
              <div className="space-y-3">
                <Link to="/features" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">MoMo Collections</Link>
                <Link to="/features" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">Bank Disbursements</Link>
                <Link to="/features" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">Dynamic Billing Links</Link>
                <Link to="/features" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">Airtime Bundles</Link>
                <Link to="/developers" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">Sandbox Testing</Link>
              </div>
            </div>

            {/* Developers & Docs */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Developers</h4>
              <div className="space-y-3">
                <Link to="/developers" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">Developer Portal</Link>
                <Link to="/documentation" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">API Docs</Link>
                <Link to="/documentation" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">Staging Credentials</Link>
                <Link to="/documentation" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">Signed Webhooks</Link>
                <Link to="/faq" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">FAQs Help</Link>
              </div>
            </div>

            {/* Compliance & Legal */}
            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Compliance</h4>
              <div className="space-y-3">
                <Link to="/documentation/security" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">Security Auditing</Link>
                <Link to="/privacy" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">Terms of Service</Link>
                <Link to="/documentation/security" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">Fraud Prevention</Link>
                <Link to="/contact" className="block text-xs text-neutral-400 hover:text-red-500 transition-colors">Contact Support</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-neutral-500 text-xs">
              © {new Date().getFullYear()} TamuPay. All rights reserved.
            </p>
            <p className="text-neutral-500 text-xs">
              Uganda's Reliable Mobile Money &amp; Card Gateway
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
