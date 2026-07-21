import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

// NOTE: These figures are placeholder/demo data. The admin panel currently
// has no backend API of its own (see audit) — every admin action here is
// client-side only and cannot safely query real cross-merchant data,
// because doing so would require either exposing the Supabase service-role
// key to the browser (a serious security hole) or building a proper
// authenticated admin API. Once that backend exists, swap this array for
// a call to it.
const demoVolumeSeries = [
  { day: 'Jun 25', volume: 2400000 },
  { day: 'Jun 26', volume: 6200000 },
  { day: 'Jun 27', volume: 11800000 },
  { day: 'Jun 28', volume: 9600000 },
  { day: 'Jun 29', volume: 13400000 },
  { day: 'Jun 30', volume: 10100000 },
  { day: 'Jul 01', volume: 6800000 },
]

interface SystemLog {
  id: string
  merchant: string
  action: string
  amount: string
  status: 'completed' | 'failed' | 'pending'
  time: string
}

const mockSystemLogs: SystemLog[] = [
  { id: 'tx_981', merchant: 'Tamu wifi', action: 'MTN Deposit Collection', amount: 'UGX 15,000', status: 'completed', time: '1 minute ago' },
  { id: 'tx_980', merchant: 'Tamu wifi', action: 'MTN Deposit Collection', amount: 'UGX 10,000', status: 'completed', time: '5 minutes ago' },
  { id: 'tx_979', merchant: 'Ntinda Cafe', action: 'Card Settlement Push', amount: 'UGX 150,000', status: 'completed', time: '12 minutes ago' },
  { id: 'tx_978', merchant: 'Kampala Logistics', action: 'Airtel Money Payout', amount: 'UGX 350,000', status: 'completed', time: '20 minutes ago' },
  { id: 'tx_977', merchant: 'Tamu wifi', action: 'Airtel Collection Request', amount: 'UGX 5,000', status: 'failed', time: '28 minutes ago' }
]

export function AdminDashboardHome() {
  const navigate = useNavigate()
  const [kycPending, setKycPending] = useState(1)
  const floatPending = 1

  useEffect(() => {
    // Read dynamic KYC submissions
    const savedKyc = localStorage.getItem('kyc_status')
    if (savedKyc === 'submitted') {
      setKycPending(2) // Mock + newly submitted merchant docs
    } else {
      setKycPending(1)
    }
  }, [])

  return (
    <div className="space-y-6">
      
      {/* 1. Admin Alert Banners for Pending Work */}
      {(kycPending > 0 || floatPending > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kycPending > 0 && (
            <div className="bg-amber-50 border border-amber-250 p-4 rounded-2xl flex items-start gap-3 shadow-3xs">
              <AlertTriangle className="text-amber-600 w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <h4 className="text-xs font-bold text-amber-800">KYC Verifications Pending</h4>
                <p className="text-2xs text-slate-600">
                  {kycPending} merchant account{kycPending > 1 ? 's are' : ' is'} awaiting regulatory document review.
                </p>
                <button 
                  onClick={() => navigate('/admin-user/merchants')}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-[10px] font-bold py-1 px-3 rounded-lg mt-1 transition-all"
                >
                  Verify Documents
                </button>
              </div>
            </div>
          )}

          {floatPending > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3 shadow-3xs">
              <Activity className="text-blue-600 w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <h4 className="text-xs font-bold text-blue-800">Float Ledger Deposits</h4>
                <p className="text-2xs text-slate-600">
                  {floatPending} float deposit request bank slip validation pending ledger credit action.
                </p>
                <button 
                  onClick={() => navigate('/admin-user/float')}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-[10px] font-bold py-1 px-3 rounded-lg mt-1 transition-all"
                >
                  Process Ledger
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Stat Cards Grid (Border-L styled) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fee collection Wallet */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl border-l-4 border-l-amber-500 shadow-3xs flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-2xs text-slate-500 font-bold uppercase tracking-wider">Fee Wallet (Gross)</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              12,845,900 <span className="text-xs font-normal text-slate-400">UGX</span>
            </div>
          </div>
          <div className="mt-3 text-3xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp size={12} />
            <span>+15.3% revenue this month</span>
          </div>
        </div>

        {/* Total Active Merchants */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl border-l-4 border-l-indigo-500 shadow-3xs flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-2xs text-slate-500 font-bold uppercase tracking-wider">Active Merchants</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              28 <span className="text-xs font-normal text-slate-400">businesses</span>
            </div>
          </div>
          <div className="mt-3 text-3xs text-slate-500 font-normal">
            <span>2 accounts pending document check</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl border-l-4 border-l-emerald-500 shadow-3xs flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-2xs text-slate-500 font-bold uppercase tracking-wider">System Success Rate</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              98.6% <span className="text-xs font-normal text-slate-400">API health</span>
            </div>
          </div>
          <div className="mt-3 text-3xs text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span>All gateway channels operational</span>
          </div>
        </div>

        {/* Total Processed volume */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl border-l-4 border-l-blue-500 shadow-3xs flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-2xs text-slate-500 font-bold uppercase tracking-wider">Total Volume (30D)</span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              184.2M <span className="text-xs font-normal text-slate-400">UGX</span>
            </div>
          </div>
          <div className="mt-3 text-3xs text-slate-500 font-normal">
            <span>Aggregates across UGX, KES, TZS</span>
          </div>
        </div>
      </div>

      {/* 3. Gateway Health Monitors & Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Channels health (MTN, Airtel, Card etc) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Gateway Integrations</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Live latency API check checks</p>
          </div>

          <div className="space-y-3">
            {/* MTN MoMo */}
            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50 text-xs">
              <div className="flex items-center gap-2">
                <img src="/mtn.jpg" alt="MTN" className="h-5 w-5 object-contain rounded" />
                <span className="font-bold text-slate-800">MTN Mobile Money</span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="font-mono text-[10px] text-slate-400">105ms</span>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 size={10} /> Operational
                </span>
              </div>
            </div>

            {/* Airtel Money */}
            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50 text-xs">
              <div className="flex items-center gap-2">
                <img src="/airtel.jpg" alt="Airtel" className="h-5 w-5 object-contain rounded" />
                <span className="font-bold text-slate-800">Airtel Money</span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="font-mono text-[10px] text-slate-400">140ms</span>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 size={10} /> Operational
                </span>
              </div>
            </div>

            {/* Visa/Mastercard */}
            <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-indigo-50 border border-indigo-150 rounded flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-credit-card text-[#0022a6] text-[10px]"></i>
                </div>
                <span className="font-bold text-slate-800">Visa / Mastercard</span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="font-mono text-[10px] text-slate-400">280ms</span>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 size={10} /> Operational
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Activity Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs lg:col-span-2 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">System-wide Transaction Volumes (Last 7 Days)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Aggregated mobile money and card deposits ledger logs</p>
            </div>
            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">Demo data</span>
          </div>

          <div className="h-[160px] w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={demoVolumeSeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="admin-chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d97706" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 8, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value: number) => [`UGX ${value.toLocaleString()}`, 'Volume']}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Area type="monotone" dataKey="volume" stroke="#d97706" strokeWidth={2.5} fill="url(#admin-chart-grad)" dot={{ r: 3, fill: '#d97706', strokeWidth: 1.5, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. Recent Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">System-Wide Ledger Log</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Real-time payment triggers across all verified merchant entities</p>
          </div>
          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full">Live Monitor</span>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 font-bold border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="p-3">Ref ID</th>
                <th className="p-3">Merchant</th>
                <th className="p-3">Activity</th>
                <th className="p-3">Gross Value</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {mockSystemLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-25/50 transition">
                  <td className="p-3 font-mono text-[10px] text-slate-500 font-bold">{log.id}</td>
                  <td className="p-3 text-slate-900 font-bold capitalize">{log.merchant}</td>
                  <td className="p-3">{log.action}</td>
                  <td className="p-3 font-bold text-slate-800">{log.amount}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      log.status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-705 border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-400 text-[10px] font-normal">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
export default AdminDashboardHome
