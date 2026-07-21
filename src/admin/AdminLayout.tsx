import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown, ShieldAlert, Users, Scale, Settings, LayoutDashboard } from 'lucide-react'

interface AdminNavItem {
  path: string
  label: string
  icon: React.ComponentType<any>
  iconColor: string
  badgeKey?: string
}

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const adminName = 'System Administrator'
  const adminRole = 'Super Admin'
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Dynamic counts for pending actions (loaded from localStorage/state)
  const [pendingKYCCount, setPendingKYCCount] = useState(1)
  const pendingFloatCount = 1

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  })

  useEffect(() => {
    const isAuth = localStorage.getItem('super_admin_authenticated')
    if (isAuth !== 'true') {
      navigate('/admin-login')
    }
  }, [navigate])

  useEffect(() => {
    (window as any).showToast = (message: string, type: 'success' | 'error' = 'success') => {
      const formattedMessage = message.charAt(0).toUpperCase() + message.slice(1)
      setToast({ message: formattedMessage, type, visible: true })
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Load dynamic counts from localStorage
    const kycStatus = localStorage.getItem('kyc_status')
    if (kycStatus === 'submitted') {
      setPendingKYCCount(2) // include the newly submitted one + mock
    } else {
      setPendingKYCCount(1) // just mock
    }

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }))
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [toast.visible])

  const adminNavItems: AdminNavItem[] = [
    { path: '', label: 'System Overview', icon: LayoutDashboard, iconColor: '#fbbf24' },
    { path: 'users', label: 'User Directory', icon: Users, iconColor: '#3b82f6' },
    { path: 'merchants', label: 'Merchant KYC', icon: ShieldAlert, iconColor: '#ef4444', badgeKey: 'kyc' },
    { path: 'float', label: 'Float Ledger', icon: Scale, iconColor: '#10b981', badgeKey: 'float' },
    { path: 'settings', label: 'Commission Fees', icon: Settings, iconColor: '#a855f7' }
  ]

  const activePath = location.pathname.split('/').pop() || ''
  let currentHeaderLabel = 'Admin Overview'
  const matchedItem = adminNavItems.find(item => item.path === activePath || (item.path === '' && activePath === 'admin-user'))
  if (matchedItem) {
    currentHeaderLabel = matchedItem.label
  }

  const getBadgeValue = (key?: string) => {
    if (key === 'kyc') return pendingKYCCount
    if (key === 'float') return pendingFloatCount
    return 0
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 text-slate-200 border-r border-slate-950 z-50 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        {/* Brand header */}
        <div className="flex flex-col items-center justify-center pt-6 pb-5 border-b border-slate-800 px-4 relative">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
            <img src="/tamu.png" alt="Tamu Pay" className="h-9 object-contain brightness-0 invert" />
            <span className="text-[9px] font-bold uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full tracking-wider animate-pulse">
              Super Admin
            </span>
          </div>
          
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 lg:hidden text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-1.5">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const badgeValue = getBadgeValue(item.badgeKey)
            
            return (
              <NavLink
                key={item.label}
                to={item.path === '' ? '/admin-user' : `/admin-user/${item.path}`}
                end={item.path === ''}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-slate-800 text-white font-bold border-l-4 border-l-amber-500' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: item.iconColor }} />
                <span className="flex-1 truncate">{item.label}</span>
                {badgeValue > 0 && (
                  <span className="ml-auto shrink-0 min-w-[18px] h-4.5 px-1.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center shadow-sm">
                    {badgeValue}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar Footer with Sign Out */}
        <div className="p-3 border-t border-slate-800 bg-slate-950">
          <button
            onClick={() => {
              navigate('/')
            }}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-350 transition-all"
          >
            <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center text-rose-450 text-[14px]"></i>
            <span>Exit Admin Panel</span>
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 flex items-center justify-between h-14 px-5 gap-3">
          {/* Left: Mobile menu + page title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-700 shrink-0"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-semibold text-slate-800 truncate">{currentHeaderLabel}</h1>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Health Widget */}
            <div className="hidden md:flex items-center gap-1.5 text-[10px] text-emerald-705 font-bold uppercase bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Platform Live</span>
            </div>

            {/* Current ticking system clock */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 font-medium font-mono">
              <i className="fa-regular fa-clock text-slate-400"></i>
              <span>
                {currentTime.toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifDropdownOpen(!notifDropdownOpen); setUserDropdownOpen(false) }}
                className="relative w-8.5 h-8.5 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all"
              >
                <i className="fa-regular fa-bell text-[14px]"></i>
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-slate-950 text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {pendingKYCCount + pendingFloatCount}
                </span>
              </button>
              {notifDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-250 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">Admin Actions Pending</span>
                    <span className="text-[10px] text-amber-600 font-bold cursor-pointer hover:underline" onClick={() => setNotifDropdownOpen(false)}>dismiss</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {pendingKYCCount > 0 && (
                      <div className="px-4 py-3 hover:bg-slate-25 cursor-pointer" onClick={() => { navigate('/admin-user/merchants'); setNotifDropdownOpen(false); }}>
                        <div className="flex items-start gap-2.5 text-xs">
                          <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5 text-rose-600">
                            <i className="fa-solid fa-user-shield text-[10px]"></i>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">KYC Verification Queue</p>
                            <p className="text-[11px] text-slate-550 mt-0.5">{pendingKYCCount} merchants awaiting document approval.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {pendingFloatCount > 0 && (
                      <div className="px-4 py-3 hover:bg-slate-25 cursor-pointer" onClick={() => { navigate('/admin-user/float'); setNotifDropdownOpen(false); }}>
                        <div className="flex items-start gap-2.5 text-xs">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 text-emerald-600">
                            <i className="fa-solid fa-scale-balanced text-[10px]"></i>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Float Ledger Deposits</p>
                            <p className="text-[11px] text-slate-550 mt-0.5">{pendingFloatCount} float requests pending bank slip validation.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => { setUserDropdownOpen(!userDropdownOpen); setNotifDropdownOpen(false) }}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full pl-1 pr-2.5 py-1 hover:bg-slate-100 transition-all"
              >
                <div className="w-6.5 h-6.5 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-amber-500">SA</span>
                </div>
                <span className="text-xs font-semibold text-slate-700 hidden sm:block max-w-[90px] truncate">{adminRole}</span>
                <ChevronDown size={11} className="text-slate-400" />
              </button>
              {userDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-250 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold text-slate-800">{adminName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{adminRole}</p>
                  </div>
                  <div className="py-1 text-xs">
                    <button onClick={() => { navigate('/admin-user/settings'); setUserDropdownOpen(false) }} className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors">
                      <i className="fa-solid fa-gears text-slate-400 text-[11px] w-4 text-center"></i>
                      Global Settings
                    </button>
                    <button onClick={() => { navigate('/'); setUserDropdownOpen(false) }} className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors">
                      <i className="fa-solid fa-house text-slate-400 text-[11px] w-4 text-center"></i>
                      Brand Website
                    </button>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => { navigate('/') }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-bold"
                      >
                        <i className="fa-solid fa-arrow-right-from-bracket text-rose-500 text-[11px] w-4 text-center"></i>
                        Exit Admin Panel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-5 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Toast */}
      {toast.visible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-250 shadow-xl rounded-full animate-toast-slide max-w-sm sm:max-w-md pointer-events-auto">
          {toast.type === 'success' ? (
            <i className="fa-solid fa-check text-emerald-500 text-[14px]"></i>
          ) : (
            <i className="fa-solid fa-triangle-exclamation text-rose-500 text-[14px]"></i>
          )}
          <span className="text-xs font-semibold text-slate-700">{toast.message}</span>
        </div>
      )}
    </div>
  )
}
export default AdminLayout
