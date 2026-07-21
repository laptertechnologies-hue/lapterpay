import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  X,
  Upload,
  Receipt,
  XCircle,
  CheckCircle2
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { supabase } from '../../lib/supabase'

const METHOD_COLORS: Record<string, string> = {
  'MTN MoMo': '#ffcc02',
  'Airtel Money': '#e10000',
  'Visa': '#1a56db',
  'Mastercard': '#dc2626',
  'Bank Transfer': '#0f172a',
  'Wallet Transfer': '#7c3aed',
  'Float Deposit': '#059669',
}
const FALLBACK_COLORS = ['#dc2626', '#0f172a', '#64748b', '#f59e0b', '#0ea5e9']

export function DashboardHome() {
  const [businessName, setBusinessName] = useState('Lapter Wifi')
  const [showBalance, setShowBalance] = useState(false)
  const [currency, setCurrency] = useState(localStorage.getItem('user_currency') || 'UGX')
  
  // Banner visibility state
  const [banner3Visible, setBanner3Visible] = useState(true)

  // Supabase dynamic states
  const [balance, setBalance] = useState<number>(0.00)
  const [transactionsCount, setTransactionsCount] = useState(0)
  const [successRate, setSuccessRate] = useState('0.0%')
  const [pendingCount, setPendingCount] = useState(0)
  const [transactionsList, setTransactionsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Aggregated activity periods
  const [todayTxns, setTodayTxns] = useState({ count: 0, net: 0 })
  const [weekTxns, setWeekTxns] = useState({ count: 0, net: 0 })
  const [monthTxns, setMonthTxns] = useState({ count: 0, net: 0 })

  // Real-time chart data, computed from the actual transaction ledger
  const [methodBreakdown, setMethodBreakdown] = useState<{ name: string; value: number }[]>([])
  const [dailyActivity, setDailyActivity] = useState<{ day: string; volume: number }[]>([])

  useEffect(() => {
    const savedName = localStorage.getItem('merchant_business_name')
    if (savedName) setBusinessName(savedName)

    async function loadDashboardMetrics() {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const activeCurr = localStorage.getItem('user_currency') || 'UGX'
        const activeEnv = localStorage.getItem('user_environment') || 'test'
        
        // 1. Fetch merchant wallet balance matching currency and environment
        let { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('merchant_id', user.id)
          .eq('environment', activeEnv)
          .eq('currency', activeCurr)
          .maybeSingle()

        if (!wallet) {
          // Dynamic initialization of wallet for switched country currency
          await supabase.from('wallets').insert([
            { merchant_id: user.id, environment: 'test', balance: 1000000.00, currency: activeCurr },
            { merchant_id: user.id, environment: 'live', balance: 0.00, currency: activeCurr }
          ])

          const { data: retryWallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('merchant_id', user.id)
            .eq('environment', activeEnv)
            .eq('currency', activeCurr)
            .single()
          wallet = retryWallet
        }

        if (wallet) {
          setBalance(parseFloat(wallet.balance))
        }

        // 2. Fetch merchant transactions list filtered by currency and environment
        const { data: txs, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('merchant_id', user.id)
          .eq('environment', activeEnv)
          .eq('currency', activeCurr)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (txs) {
          setTransactionsList(txs.slice(0, 5))
          setTransactionsCount(txs.length)

          const completed = txs.filter(t => t.status === 'completed')
          const pending = txs.filter(t => t.status === 'pending')
          setPendingCount(pending.length)

          if (txs.length > 0) {
            const rate = ((completed.length / txs.length) * 100).toFixed(1)
            setSuccessRate(`${rate}%`)
          } else {
            setSuccessRate('0.0%')
          }

          // Calculate activity windows
          const now = new Date()
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

          const todayList = txs.filter(t => new Date(t.created_at) >= startOfToday)
          const weekList = txs.filter(t => new Date(t.created_at) >= startOfWeek)
          const monthList = txs.filter(t => new Date(t.created_at) >= startOfMonth)

          const getSums = (list: any[]) => {
            const count = list.length
            const net = list
              .filter(t => t.status === 'completed')
              .reduce((acc, t) => acc + (t.type === 'collection' ? parseFloat(t.amount) - parseFloat(t.fee) : -parseFloat(t.amount)), 0)
            return { count, net }
          }

          setTodayTxns(getSums(todayList))
          setWeekTxns(getSums(weekList))
          setMonthTxns(getSums(monthList))

          // Real payment-method distribution (replaces the previous
          // hardcoded 65/35 MTN/Airtel split)
          const methodCounts = new Map<string, number>()
          for (const t of txs) {
            const key = t.payment_method || 'Other'
            methodCounts.set(key, (methodCounts.get(key) || 0) + 1)
          }
          setMethodBreakdown(
            Array.from(methodCounts.entries())
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value)
          )

          // Real last-7-day net completed volume (replaces the previous
          // hand-drawn fake curve)
          const days: { day: string; volume: number }[] = []
          for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            d.setHours(0, 0, 0, 0)
            const dayEnd = new Date(d)
            dayEnd.setHours(23, 59, 59, 999)
            const dayTxns = txs.filter(t => {
              const created = new Date(t.created_at)
              return created >= d && created <= dayEnd && t.status === 'completed'
            })
            const volume = dayTxns.reduce(
              (acc, t) => acc + (t.type === 'collection' ? parseFloat(t.amount) - parseFloat(t.fee) : parseFloat(t.amount)),
              0
            )
            days.push({ day: d.toLocaleDateString('en-US', { weekday: 'short' }), volume: Math.round(volume) })
          }
          setDailyActivity(days)
        } else {
          setTransactionsList([])
          setTransactionsCount(0)
          setPendingCount(0)
          setSuccessRate('0.0%')
          setTodayTxns({ count: 0, net: 0 })
          setWeekTxns({ count: 0, net: 0 })
          setMonthTxns({ count: 0, net: 0 })
          setMethodBreakdown([])
          setDailyActivity([])
        }
      } catch (err) {
        console.error('Failed to load Supabase dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardMetrics()

    const handleCurrencyChange = () => {
      setCurrency(localStorage.getItem('user_currency') || 'UGX')
      loadDashboardMetrics()
    }
    const handleEnvChange = () => {
      loadDashboardMetrics()
    }

    window.addEventListener('currency_changed', handleCurrencyChange)
    window.addEventListener('environment_changed', handleEnvChange)
    return () => {
      window.removeEventListener('currency_changed', handleCurrencyChange)
      window.removeEventListener('environment_changed', handleEnvChange)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* 1. Welcome Back Banner */}
      <div className="relative overflow-hidden bg-[#1e1b4b] text-white rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md border border-neutral-850">
        <div className="relative z-10 space-y-2 max-w-xl">
          <h2 className="text-2xl font-normal tracking-tight">
            Welcome back, <span className="text-[#fbbf24] font-medium">{businessName || 'Administrator'}!</span>
          </h2>
          <p className="text-xs text-neutral-300 leading-relaxed font-normal">
            Everything is looking great today. You have full control over the business transactions, payout flows, and gateway digital configurations.
          </p>
          <div className="relative z-10 flex flex-wrap items-center gap-3 pt-3">
            <Link 
              to="/dashboard/transactions" 
              className="bg-[#fbbf24] hover:bg-[#f59e0b] text-[#1e1b4b] font-medium text-xs px-5 py-2.5 rounded-full shadow-sm transition-all duration-200"
            >
              View Ledger
            </Link>
            <Link 
              to="/dashboard/callback-logs" 
              className="bg-white/10 hover:bg-white/20 text-white font-medium text-xs px-5 py-2.5 rounded-full border border-white/10 transition-all duration-200"
            >
              Callback Logs
            </Link>
            <div className="flex items-center gap-1.5 bg-white/10 text-white font-medium text-xs px-4 py-2.5 rounded-full border border-white/10 shadow-2xs shrink-0 select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <span className="text-[11px] font-semibold text-neutral-200">Sandbox Active</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 hidden md:block shrink-0 pr-2">
          <img 
            src="/cartoon/cartoon_payment.png" 
            alt="Cartoon Payment Mascot" 
            className="h-28 w-28 rounded-2xl object-cover drop-shadow-lg animate-pulse hover:scale-110 transition-all duration-500 cursor-pointer" 
          />
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Balance */}
        <div className="stat-card bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-brand-500 flex flex-col items-start gap-2.5 shadow-3xs">
          <i className="fa-solid fa-wallet text-xl text-brand-600"></i>
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 font-normal">Balance</span>
              <span className="text-xs text-neutral-400 font-mono">{currency} Wallet</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="text-2xl font-semibold text-neutral-900 tracking-tight">
                {showBalance ? balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '••••••'} <span className="text-sm font-normal text-slate-400">{currency}</span>
              </div>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="text-neutral-400 hover:text-neutral-650 p-1 cursor-pointer"
                title={showBalance ? 'Hide Balance' : 'Show Balance'}
              >
                {showBalance ? <i className="fa-solid fa-eye-slash text-xs"></i> : <i className="fa-solid fa-eye text-xs"></i>}
              </button>
            </div>
            <div className="mt-1.5 text-xs text-neutral-450 font-normal flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-neutral-450 rounded-full"></div>
              <span>Wallet balance synced dynamically</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Transactions */}
        <div className="stat-card bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-indigo-500 flex flex-col items-start gap-2.5 shadow-3xs">
          <i className="fa-solid fa-list-check text-xl text-indigo-600"></i>
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 font-normal">Total Transactions</span>
              <span className="text-xs text-neutral-400 font-normal">All time</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-semibold text-neutral-900">{transactionsCount}</span>
              <span className="text-sm font-normal text-neutral-400">Txns</span>
            </div>
            <div className="mt-1.5 text-xs text-neutral-500 font-normal flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-brand-600 rounded-full"></div>
              <span>Volume loaded from ledger logs</span>
            </div>
          </div>
        </div>

        {/* Card 3: Success Rate */}
        <div className="stat-card bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-emerald-500 flex flex-col items-start gap-2.5 shadow-3xs">
          <i className="fa-solid fa-chart-line text-xl text-emerald-600"></i>
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 font-normal">Success Rate</span>
              <span className="text-xs text-neutral-400 font-normal">Performance</span>
            </div>
            <div className="flex items-baseline mt-1.5">
              <span className="text-2xl font-semibold text-neutral-900">{successRate}</span>
            </div>
            <div className="mt-1.5 text-xs text-success-700 font-normal flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-success-500 rounded-full"></div>
              <span>Based on completed logs</span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending */}
        <div className="stat-card bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-amber-500 flex flex-col items-start gap-2.5 shadow-3xs">
          <i className="fa-solid fa-clock text-xl text-amber-600"></i>
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 font-normal">Pending</span>
              <span className="text-xs text-neutral-400 font-normal">Awaiting</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-semibold text-neutral-900">{pendingCount}</span>
              <span className="text-sm font-normal text-neutral-400">Txns</span>
            </div>
            <div className="mt-1.5 text-xs text-warning-700 font-normal flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-warning-500 rounded-full"></div>
              <span>Awaiting callback completions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Business Logo Alert Banner */}
      {banner3Visible && (
        <div className="bg-[#fffbeb] border border-warning-100 rounded-2xl p-4 flex items-start justify-between relative shadow-2xs animate-fade-in">
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5 text-warning-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1 pr-6 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-medium text-warning-700 tracking-wide">Upload Your Business Logo</h4>
                <p className="text-xs text-neutral-600 leading-relaxed mt-0.5">
                  Complete your business profile by uploading a professional logo to represent your brand.
                </p>
              </div>
              <div className="shrink-0 pt-1 md:pt-0">
                <Link to="/dashboard/business-information" className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 font-medium text-xs px-4 py-2 rounded-full shadow-2xs transition block text-center flex items-center justify-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Upload Business Logo
                </Link>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setBanner3Visible(false)}
            className="text-neutral-400 hover:text-neutral-650 transition p-1 absolute top-3 right-3 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 4. Three-Column Activity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Activity */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100 mb-3">
            <span className="text-sm font-medium text-neutral-800">Today's Activity</span>
            <span className="text-xs text-neutral-400 font-normal">Today</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-500">Transactions</span>
            <span className="font-semibold text-neutral-855">{todayTxns.count}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-neutral-500">Net Volume</span>
            <span className="font-bold text-[#0022a6]">{todayTxns.net.toLocaleString()} {currency}</span>
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100 mb-3">
            <span className="text-sm font-medium text-neutral-800">This Week</span>
            <span className="text-xs text-neutral-400 font-normal">7-day cycle</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-500">Transactions</span>
            <span className="font-semibold text-neutral-855">{weekTxns.count}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-neutral-500">Net Volume</span>
            <span className="font-bold text-[#0022a6]">{weekTxns.net.toLocaleString()} {currency}</span>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100 mb-3">
            <span className="text-sm font-medium text-neutral-800">This Month</span>
            <span className="text-xs text-neutral-400 font-normal">30-day cycle</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-500">Transactions</span>
            <span className="font-semibold text-[#0022a6]">{monthTxns.count}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-neutral-500">Net Volume</span>
            <span className="font-bold text-[#0022a6]">{monthTxns.net.toLocaleString()} {currency}</span>
          </div>
        </div>
      </div>

      {/* 5. Lower Sections: Charts and Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column A: Payment Methods */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-neutral-800 tracking-wide pb-2 border-b border-neutral-100 mb-3">Payment Methods</h3>
            <div className="text-xs text-neutral-405 mb-3 font-normal">Distribution of payment methods used</div>

            {methodBreakdown.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-xs text-neutral-400">No transactions yet</div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={methodBreakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={38}
                        outerRadius={58}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {methodBreakdown.map((entry, i) => (
                          <Cell key={entry.name} fill={METHOD_COLORS[entry.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any) => [`${value} txns`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-semibold text-neutral-800">{transactionsCount}</span>
                    <span className="text-[9px] text-neutral-400">Txns</span>
                  </div>
                </div>

                <div className="w-full space-y-2 mt-3">
                  {methodBreakdown.slice(0, 4).map((m, i) => (
                    <div key={m.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-neutral-600">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: METHOD_COLORS[m.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
                        />
                        {m.name}
                      </span>
                      <span className="font-semibold text-neutral-800">
                        {transactionsCount > 0 ? Math.round((m.value / transactionsCount) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column B: Bill Payments card */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100 mb-3">
              <h3 className="text-sm font-medium text-neutral-800 tracking-wide">Utility Services</h3>
              <Link to="/dashboard/service-marketplace" className="text-xs font-normal text-brand-600 hover:text-brand-850">Marketplace</Link>
            </div>
            <div className="text-xs text-neutral-400 mb-4 font-normal">Utility bill payment statistics</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Airtime Refills</span>
                <span className="font-medium text-neutral-855">0 UGX</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1 border-b border-neutral-50">
                <span className="text-neutral-500">DSTV/GOTV Payments</span>
                <span className="font-medium text-neutral-855">0 UGX</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1 border-b border-neutral-50">
                <span className="text-neutral-500">NWSC Water Bills</span>
                <span className="font-medium text-neutral-855">0 UGX</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1">
                <span className="text-neutral-500">Umeme Electricity</span>
                <span className="font-medium text-neutral-855">0 UGX</span>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <Link to="/dashboard/service-marketplace" className="btn-primary w-full py-2 flex items-center justify-center gap-2">
              <Receipt size={14} />
              <span>Purchase Services</span>
            </Link>
          </div>
        </div>

        {/* Column C: Activity Chart */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <h3 className="text-sm font-medium text-neutral-800 tracking-wide pb-2 border-b border-neutral-100">Transaction Activity</h3>

          <div className="flex-1 flex flex-col justify-center py-2">
            <div className="h-[150px] w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyActivity} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString()} ${currency}`, 'Net volume']}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2} fill="url(#chart-grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Recent Transactions Table Section */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
        <div className="flex justify-between items-center pb-2 border-b border-neutral-100 mb-4">
          <h3 className="text-sm font-medium text-neutral-800 tracking-wide">Recent Transactions</h3>
          <Link to="/dashboard/transactions" className="text-xs font-normal text-brand-600 hover:text-brand-850">View All</Link>
        </div>
        
        <div className="divide-y divide-neutral-100">
          {loading ? (
            <div className="py-8 text-center text-sm text-neutral-400">Loading ledger records...</div>
          ) : transactionsList.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-450">No transaction records found.</div>
          ) : (
            transactionsList.map((tx) => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-xl transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`shrink-0 ${tx.status === 'completed' ? 'text-emerald-500' : 'text-rose-505'}`}>
                    {tx.status === 'completed' ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <XCircle size={18} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-neutral-800 capitalize truncate">
                      {tx.type} - {tx.payment_method}
                    </h4>
                    <p className="text-xs text-neutral-450 truncate mt-0.5">{tx.description || tx.customer_identifier}</p>
                    <p className="text-xs text-neutral-400 font-mono mt-1 select-all">{tx.id}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-medium ${tx.type === 'collection' ? 'text-emerald-650' : 'text-slate-800'}`}>
                    {tx.type === 'collection' ? '+' : '-'}{parseFloat(tx.amount).toLocaleString()} <span className="text-xs font-normal text-neutral-400">{tx.currency}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1.5">
                    <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      tx.status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-105'
                    }`}>
                      {tx.status}
                    </span>
                    <span className="text-xs text-neutral-400 font-normal">
                      {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
export default DashboardHome
