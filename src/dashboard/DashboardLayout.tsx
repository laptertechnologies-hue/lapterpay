import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { syncSubscriptions } from '../lib/subscriptions'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { ToastContainer } from '../components/Toast'

interface NavGroup {
  label: string
  items: NavItem[]
}

interface NavItem {
  path: string
  label: string
  iconClass: string
  iconColor: string
  badge?: string
  badgeClass?: string
  count?: number
  countColor?: string
}

// Live counts — replace with real API data when available
const liveCounts: Record<string, number> = {
  transactions: 64,
  refunds: 0,
  'callback-logs': 0,
  'support-tickets': 2,
  users: 0,
  roles: 0,
  'payment-links': 0,
  'sub-accounts': 0,
}

const navGroups: NavGroup[] = [
  {
    label: 'YOUR BUSINESS',
    items: [
      { path: 'transactions', label: 'Transactions', iconClass: 'fa-solid fa-list-check', iconColor: '#10b981', count: liveCounts['transactions'] },
      { path: 'refunds', label: 'Refunds', iconClass: 'fa-solid fa-arrow-rotate-left', iconColor: '#ef4444' },
      { path: 'account-statement', label: 'Account Statement', iconClass: 'fa-solid fa-file-invoice-dollar', iconColor: '#f59e0b' },
      { path: 'float-management', label: 'Float Management', iconClass: 'fa-solid fa-scale-balanced', iconColor: '#6366f1', badge: 'Sandbox', badgeClass: 'bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto' },
      { path: 'business-documents', label: 'Business Documents', iconClass: 'fa-solid fa-shield-halved', iconColor: '#06b6d4' },
      { path: 'service-marketplace', label: 'Service Marketplace', iconClass: 'fa-solid fa-cubes', iconColor: '#a855f7' },
      { path: 'sub-accounts', label: 'Manage Sub Accounts', iconClass: 'fa-solid fa-network-wired', iconColor: '#3b82f6' },
      { path: 'callback-logs', label: 'Callback Logs', iconClass: 'fa-solid fa-terminal', iconColor: '#ec4899' },
    ]
  },
  {
    label: 'PAYMENTS',
    items: [
      { path: 'send-money', label: 'Send Money', iconClass: 'fa-solid fa-paper-plane', iconColor: '#14b8a6', badge: 'Sandbox', badgeClass: 'bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto' },
      { path: 'wallet-transfer', label: 'Wallet Transfer', iconClass: 'fa-solid fa-arrows-left-right', iconColor: '#8b5cf6', badge: 'Subscribe', badgeClass: 'bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto' },
      { path: 'pay-bills', label: 'Pay Bills', iconClass: 'fa-solid fa-file-invoice', iconColor: '#f43f5e' },
      { path: 'airtime-data', label: 'Airtime & Data', iconClass: 'fa-solid fa-mobile-screen-button', iconColor: '#eab308', badge: 'NEW', badgeClass: 'bg-emerald-105 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto' },
      { path: 'bulk-payments', label: 'Bulk Payments', iconClass: 'fa-solid fa-users-gear', iconColor: '#06b6d4', badge: 'Sandbox', badgeClass: 'bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto' },
      { path: 'bank-details', label: 'Bank Details', iconClass: 'fa-solid fa-building-columns', iconColor: '#6b7280' },
    ]
  },
  {
    label: 'COLLECTIONS',
    items: [
      { path: 'collection', label: 'Collection', iconClass: 'fa-solid fa-hand-holding-dollar', iconColor: '#10b981', badge: 'Sandbox', badgeClass: 'bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto' },
      { path: 'payment-links', label: 'Payment Links', iconClass: 'fa-solid fa-link', iconColor: '#3b82f6', badge: 'Sandbox', badgeClass: 'bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-auto' },
      { path: 'products', label: 'Products', iconClass: 'fa-solid fa-store', iconColor: '#a855f7' },
    ]
  },
  {
    label: 'BANK TRANSFER',
    items: [
      { path: 'push-to-bank', label: 'Push to Bank', iconClass: 'fa-solid fa-arrow-right-to-bracket', iconColor: '#f97316' },
    ]
  },
  {
    label: 'USERS',
    items: [
      { path: 'users', label: 'User Management', iconClass: 'fa-solid fa-users', iconColor: '#3b82f6' },
      { path: 'roles', label: 'Roles', iconClass: 'fa-solid fa-user-shield', iconColor: '#06b6d4' },
    ]
  },
  {
    label: 'SETTINGS',
    items: [
      { path: 'business-information', label: 'Business Information', iconClass: 'fa-solid fa-gears', iconColor: '#6b7280' },
      { path: 'security', label: 'Security', iconClass: 'fa-solid fa-shield-halved', iconColor: '#dc2626' },
      { path: 'withdrawal-numbers', label: 'Withdrawal Phone Numbers', iconClass: 'fa-solid fa-phone-volume', iconColor: '#10b981' },
      { path: 'support-tickets', label: 'Support Tickets', iconClass: 'fa-solid fa-headset', iconColor: '#ec4899', count: liveCounts['support-tickets'] },
    ]
  },
  {
    label: 'DEVELOPERS',
    items: [
      { path: 'api-keys', label: 'API Keys', iconClass: 'fa-solid fa-key', iconColor: '#f59e0b' },
      { path: 'ip-whitelist', label: 'IP Whitelist', iconClass: 'fa-solid fa-network-wired', iconColor: '#ef4444' },
      { path: 'documentation', label: 'Documentation', iconClass: 'fa-solid fa-book-open-reader', iconColor: '#10b981' },
    ]
  }
]



export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [businessName, setBusinessName] = useState('Lapter Wifi')
  const [accountNumber, setAccountNumber] = useState('A/C: 201775010270')
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)

  // Mode states (Live vs Sandbox)
  const [isLiveMode, setIsLiveMode] = useState(() => {
    return localStorage.getItem('user_environment') === 'live'
  })
  const [kycStatus, setKycStatus] = useState(() => {
    return localStorage.getItem('kyc_status') || 'pending'
  })

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  })

  const handleModeToggle = () => {
    if (kycStatus !== 'approved') {
      if (window.showToast) {
        window.showToast('KYC verification required to access Live mode. Account locked to Sandbox.', 'error')
      }
      return
    }
    const nextMode = !isLiveMode
    setIsLiveMode(nextMode)
    localStorage.setItem('user_environment', nextMode ? 'live' : 'test')
    window.dispatchEvent(new Event('environment_changed'))
    if (window.showToast) {
      window.showToast(`Switched gateway to ${nextMode ? 'Live' : 'Sandbox/Test'} mode`, 'success')
    }
  }

  useEffect(() => {
    (window as any).showToast = (message: string, type: 'success' | 'error' = 'success') => {
      // Ensure sentence case: Capitalize first character
      const formattedMessage = message.charAt(0).toUpperCase() + message.slice(1)
      setToast({ message: formattedMessage, type, visible: true })
    }
  }, [])

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }))
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [toast.visible])

  // Collapsible group state — all open by default
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  // Country selector configuration
  const countries = [
    { code: 'UG', name: 'Uganda', flagUrl: 'https://flagcdn.com/w40/ug.png', currency: 'UGX' },
    { code: 'KE', name: 'Kenya', flagUrl: 'https://flagcdn.com/w40/ke.png', currency: 'KES' },
    { code: 'TZ', name: 'Tanzania', flagUrl: 'https://flagcdn.com/w40/tz.png', currency: 'TZS' },
    { code: 'RW', name: 'Rwanda', flagUrl: 'https://flagcdn.com/w40/rw.png', currency: 'RWF' },
  ]
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return localStorage.getItem('user_country') || 'UG'
  })
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      
      // Fetch dynamic merchant profile (business_name, account_number, kyc_status)
      const { data: profile } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', session.user.id)
        .single()
        
      if (profile) {
        setBusinessName(profile.business_name)
        setAccountNumber(profile.account_number ? `A/C: ${profile.account_number}` : 'A/C: Pending')
        localStorage.setItem('merchant_business_name', profile.business_name)
        if (profile.account_number) {
          localStorage.setItem('merchant_account_number', profile.account_number)
        }
        if (profile.kyc_status) {
          localStorage.setItem('kyc_status', profile.kyc_status)
          setKycStatus(profile.kyc_status)
        }
      }

      // Fetch and sync service subscriptions
      const { data: dbSubs } = await supabase
        .from('service_subscriptions')
        .select('service_key, status')
        .eq('merchant_id', session.user.id)
      
      if (dbSubs) {
        syncSubscriptions(dbSubs)
      }
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let timeoutId: number
    let warningId: number

    const SESSION_TIMEOUT_MS = 900000 // 15 minutes
    const WARNING_BEFORE_MS = 60000 // warn 60s before sign-out

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (warningId) clearTimeout(warningId)

      warningId = window.setTimeout(() => {
        if (window.showToast) {
          window.showToast('You will be signed out in 1 minute due to inactivity. Move your mouse or tap to stay signed in.', 'error')
        }
      }, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS)

      timeoutId = window.setTimeout(() => {
        supabase.auth.signOut().then(() => {
          localStorage.removeItem('merchant_business_name')
          localStorage.removeItem('merchant_account_number')
          navigate('/login')
          if (window.showToast) {
            window.showToast('You have been signed out due to 15 minutes of inactivity', 'error')
          }
        })
      }, SESSION_TIMEOUT_MS)
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, resetTimer)
    })

    resetTimer()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (warningId) clearTimeout(warningId)
      events.forEach(event => {
        window.removeEventListener(event, resetTimer)
      })
    }
  }, [navigate])

  const activePath = location.pathname.split('/').pop() || ''
  let currentHeaderLabel = 'Dashboard'
  if (activePath && activePath !== 'dashboard') {
    for (const group of navGroups) {
      const matchedItem = group.items.find(item => item.path === activePath)
      if (matchedItem) {
        currentHeaderLabel = matchedItem.label
        break
      }
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-neutral-200 z-50 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Brand header */}
        <div className="flex flex-col items-center justify-center pt-6 pb-5 border-b border-neutral-100 px-4 relative">
          <img src="/lapterpay.png" alt="Lapter Pay" className="h-10 object-contain mx-auto" />
          
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 lg:hidden text-neutral-400 hover:text-neutral-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 custom-scrollbar space-y-1">
          {/* Dashboard Item */}
          <NavLink
            to="/dashboard"
            end
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <i className="fa-solid fa-house w-5 text-center text-neutral-500 text-[15px]"></i>
            <span>Dashboard</span>
          </NavLink>

          {/* Groups with collapse */}
          {navGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.label)
            return (
              <div key={group.label} className="pt-2">
                {/* Group header — clickable to collapse */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3.5 py-1 text-2xs text-neutral-400 font-semibold uppercase tracking-wider hover:text-neutral-600 transition-colors"
                >
                  <span>{group.label}</span>
                  {isCollapsed
                    ? <ChevronDown size={15} className="text-neutral-350" />
                    : <ChevronUp size={15} className="text-neutral-350" />
                  }
                </button>

                {/* Collapsible items */}
                {!isCollapsed && (
                  <div className="space-y-0.5 mt-0.5">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.label}
                        to={item.path === 'documentation' ? '/documentation' : `/dashboard/${item.path}`}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
                        }
                      >
                        <i className={`${item.iconClass} w-5 text-center text-[15px]`} style={{ color: item.iconColor }}></i>
                        <span className="flex-1 min-w-0 truncate">{item.label}</span>
                        {/* Count badge */}
                        {typeof item.count === 'number' && item.count > 0 && (
                          <span className="ml-auto shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center">
                            {item.count > 99 ? '99+' : item.count}
                          </span>
                        )}
                        {/* Text badge */}
                        {item.badge && !item.count && (
                          <span className={item.badgeClass}>
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Sidebar Footer with Sign Out */}
        <div className="p-3 border-t border-neutral-100 bg-neutral-25">
          <button
            onClick={() => {
              localStorage.removeItem('merchant_business_name')
              localStorage.removeItem('merchant_account_number')
              navigate('/')
            }}
            className="sidebar-item w-full !text-red-500 hover:!bg-red-50 hover:!text-red-700"
          >
            <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center !text-red-500 text-[15px]"></i>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-100 flex items-center justify-between h-14 px-5 gap-3">
          {/* Left: Mobile menu + page title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-neutral-500 hover:text-neutral-700 shrink-0"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-semibold text-neutral-800 truncate">{currentHeaderLabel}</h1>
          </div>

          {/* Right: Clock, Country, Notifications, User */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Clock */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-full px-3 py-1.5">
              <i className="fa-regular fa-clock text-neutral-400 text-[10px]"></i>
              <span className="font-medium tabular-nums">
                {currentTime.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Live / Test Mode Toggle */}
            <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-full px-2.5 py-1 text-xs shrink-0 select-none">
              <span className="text-[10px] font-semibold text-neutral-500">Mode:</span>
              <button
                onClick={handleModeToggle}
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all border ${
                  isLiveMode 
                    ? 'bg-emerald-105 text-emerald-800 border-emerald-200' 
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}
              >
                {isLiveMode ? 'Live' : 'Sandbox'}
              </button>
            </div>

            {/* Country selector */}
            <div className="relative">
              <button
                onClick={() => { setCountryDropdownOpen(!countryDropdownOpen); setUserDropdownOpen(false); setNotifDropdownOpen(false) }}
                className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-full px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 transition-all"
              >
                <img
                  src={countries.find(c => c.code === selectedCountry)?.flagUrl}
                  alt={selectedCountry}
                  className="w-4 h-3 object-cover rounded-[2px]"
                />
                <span className="font-medium">{selectedCountry}</span>
                <ChevronDown size={11} className="text-neutral-400" />
              </button>
              {countryDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-44 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  {countries.map(c => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setSelectedCountry(c.code)
                        localStorage.setItem('user_country', c.code)
                        localStorage.setItem('user_currency', c.currency)
                        setCountryDropdownOpen(false)
                        window.dispatchEvent(new Event('currency_changed'))
                        if (window.showToast) {
                          window.showToast(`Switched currency to ${c.currency}`, 'success')
                        }
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${selectedCountry === c.code ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-neutral-700 hover:bg-neutral-50'}`}
                    >
                      <img src={c.flagUrl} alt={c.code} className="w-5 h-3.5 object-cover rounded-[2px] shrink-0" />
                      <span>{c.name}</span>
                      <span className="ml-auto text-neutral-400 text-[10px]">{c.currency}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifDropdownOpen(!notifDropdownOpen); setUserDropdownOpen(false); setCountryDropdownOpen(false) }}
                className="relative w-8 h-8 flex items-center justify-center rounded-full bg-neutral-50 border border-neutral-200 text-neutral-500 hover:bg-neutral-100 transition-all"
              >
                <i className="fa-regular fa-bell text-[14px]"></i>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">2</span>
              </button>
              {notifDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800">Notifications</span>
                    <span className="text-[10px] text-brand-600 font-medium cursor-pointer hover:underline">Mark all read</span>
                  </div>
                  <div className="divide-y divide-neutral-50">
                    <div className="px-4 py-3 hover:bg-neutral-50 cursor-pointer">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <i className="fa-solid fa-circle-check text-emerald-600 text-[10px]"></i>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-neutral-800">Payment received</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">UGX 150,000 from MTN MoMo</p>
                          <p className="text-[10px] text-neutral-400 mt-1">2 minutes ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 hover:bg-neutral-50 cursor-pointer">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                          <i className="fa-solid fa-triangle-exclamation text-amber-600 text-[10px]"></i>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-neutral-800">Support ticket opened</p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">Ticket #2 needs your attention</p>
                          <p className="text-[10px] text-neutral-400 mt-1">15 minutes ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => { setUserDropdownOpen(!userDropdownOpen); setNotifDropdownOpen(false); setCountryDropdownOpen(false) }}
                className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-full pl-1 pr-2.5 py-1 hover:bg-neutral-100 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-[9px] font-bold">TW</span>
                </div>
                <span className="text-xs font-medium text-neutral-700 hidden sm:block max-w-[80px] truncate">{businessName}</span>
                <ChevronDown size={11} className="text-neutral-400" />
              </button>
              {userDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-800">{businessName}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{accountNumber}</p>
                  </div>
                  <div className="py-1">
                    <button onClick={() => { navigate('/dashboard/business-information'); setUserDropdownOpen(false) }} className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors">
                      <i className="fa-solid fa-gears text-neutral-400 text-[11px] w-4 text-center"></i>
                      Account Settings
                    </button>
                    <button onClick={() => { navigate('/documentation'); setUserDropdownOpen(false) }} className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors">
                      <i className="fa-solid fa-book-open text-neutral-400 text-[11px] w-4 text-center"></i>
                      Documentation
                    </button>
                    <div className="border-t border-neutral-100 mt-1 pt-1">
                      <button
                        onClick={() => { localStorage.removeItem('merchant_business_name'); localStorage.removeItem('merchant_account_number'); navigate('/') }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <i className="fa-solid fa-arrow-right-from-bracket text-red-500 text-[11px] w-4 text-center"></i>
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-5 md:p-6">
          {kycStatus !== 'approved' && (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <i className="fa-solid fa-triangle-exclamation text-amber-600 text-sm"></i>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-amber-800">Sandbox Mode Active</h4>
                  <p className="text-[10px] text-amber-600">Your account is restricted to Test/Sandbox mode. Upload and get your business KYC documents approved to unlock Live payouts.</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/dashboard/business-documents')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-[10px] font-semibold transition shrink-0"
              >
                Submit Documents
              </button>
            </div>
          )}
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
