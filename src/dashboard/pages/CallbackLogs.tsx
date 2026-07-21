import { useState, useRef, useEffect } from 'react'
import { Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const statusTabsConfig = [
  { id: 'all', label: 'All Callbacks', icon: 'fa-solid fa-layer-group' },
  { id: 'success', label: 'Successful', icon: 'fa-solid fa-circle-check' },
  { id: 'failed', label: 'Failed', icon: 'fa-solid fa-circle-xmark' },
  { id: 'timeout', label: 'Timeout', icon: 'fa-solid fa-hourglass-half' },
]

export function CallbackLogs() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const perPage = '10'
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [exporting, setExporting] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadLogs() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const res = await fetch('/api/v1/webhooks/logs', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        const body = await res.json()
        if (body.success && body.data) {
          const formatted = body.data.map((l: any) => ({
            id: l.id,
            reference: l.transaction_id,
            url: l.payload?.url || 'https://api.merchant.com/v1/webhook',
            event: l.payload?.event || 'payment.completed',
            status: l.success ? 'success' : 'failed',
            response: l.response_body || `Status: ${l.response_status}`,
            date: new Date(l.created_at).toISOString().replace('T', ' ').substring(0, 19)
          }))
          setData(formatted)
        }
      } catch (err) {
        console.error('Failed to load callback logs:', err)
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setShowFilters(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => { 
      setExporting(false)
      if (window.showToast) window.showToast('Callback logs exported successfully', 'success') 
    }, 500)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const totalCallbacks = data.length
  const successCount = data.filter(c => c.status === 'success').length
  const failedCount = data.filter(c => c.status === 'failed').length
  const successRate = totalCallbacks > 0 ? Math.round((successCount / totalCallbacks) * 100) : 0

  const getTabCount = (tabId: string) => {
    if (tabId === 'all') return data.length
    return data.filter(c => c.status === tabId).length
  }

  const filteredCallbacks = data.filter(c => {
    const matchesTab = activeTab === 'all' || c.status === activeTab
    const matchesSearch =
      c.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.response.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const paginatedCallbacks = filteredCallbacks.slice(0, Number(perPage))
  const allVisibleIds = paginatedCallbacks.map(c => c.id)
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.includes(id))
  
  const toggleAll = () => {
    if (allSelected) setSelectedIds(prev => prev.filter(id => !allVisibleIds.includes(id)))
    else setSelectedIds(prev => [...new Set([...prev, ...allVisibleIds])])
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Callback Logs</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Outgoing webhook callbacks for UG — endpoint delivery tracking</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-brand-500 flex flex-col items-start gap-2.5 shadow-sm">
          <i className="fa-solid fa-network-wired text-xl text-brand-600"></i>
          <div className="w-full">
            <span className="text-xs text-neutral-500 font-normal">Total Callbacks</span>
            <div className="text-2xl font-semibold text-neutral-900 mt-1.5">{totalCallbacks}</div>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-emerald-500 flex flex-col items-start gap-2.5 shadow-sm">
          <i className="fa-solid fa-circle-check text-xl text-emerald-600"></i>
          <div className="w-full">
            <span className="text-xs text-neutral-500 font-normal">Successful</span>
            <div className="text-2xl font-semibold text-neutral-900 mt-1.5">{successCount}</div>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-red-500 flex flex-col items-start gap-2.5 shadow-sm">
          <i className="fa-solid fa-circle-xmark text-xl text-red-600"></i>
          <div className="w-full">
            <span className="text-xs text-neutral-500 font-normal">Failed</span>
            <div className="text-2xl font-semibold text-neutral-900 mt-1.5">{failedCount}</div>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-blue-500 flex flex-col items-start gap-2.5 shadow-sm">
          <i className="fa-solid fa-chart-line text-xl text-blue-600"></i>
          <div className="w-full">
            <span className="text-xs text-neutral-500 font-normal">Success Rate</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-semibold text-neutral-900">{successRate}</span>
              <span className="text-xs font-normal text-neutral-450">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pill Controller */}
      <div className="flex justify-center">
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-1.5 inline-flex items-center gap-1 overflow-x-auto no-scrollbar">
          {statusTabsConfig.map((tab) => {
            const isActive = activeTab === tab.id
            const count = getTabCount(tab.id)
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${isActive ? 'bg-brand-600 text-white shadow-sm font-semibold' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'}`}>
                <i className={`${tab.icon} text-[11px] ${isActive ? 'text-white/80' : 'text-neutral-400'}`}></i>
                <span>{tab.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'}`}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-neutral-100">
          <div className="relative flex-1 max-w-xs">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[11px]"></i>
            <input type="text" className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-all" placeholder="Search callbacks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div ref={filtersRef} className="relative">
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs border transition-all cursor-pointer ${showFilters ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'}`}>
                <i className="fa-solid fa-sliders text-[10px]"></i><span>Filters</span>
              </button>
              {showFilters && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold text-neutral-800">Date Range</span><button className="text-[10px] text-brand-600 font-medium hover:underline">Reset</button></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider block mb-1">From</label><input type="date" className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-300" /></div>
                    <div><label className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider block mb-1">To</label><input type="date" className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-300" /></div>
                  </div>
                  <button className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2 rounded-lg transition" onClick={() => setShowFilters(false)}>Apply</button>
                </div>
              )}
            </div>
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs border border-neutral-200 text-neutral-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 bg-white transition-all disabled:opacity-60 cursor-pointer">
              {exporting ? <i className="fa-solid fa-spinner fa-spin text-[11px]"></i> : <Download size={15} />}
              <span>{exporting ? 'Exporting...' : 'Export'}</span>
            </button>
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-brand-50 border-b border-brand-100">
            <span className="text-xs font-semibold text-brand-700">{selectedIds.length} row{selectedIds.length > 1 ? 's' : ''} selected</span>
            <div className="flex gap-2">
              <button onClick={() => setSelectedIds([])} className="text-xs text-neutral-500 hover:text-neutral-700 px-3 py-1.5 rounded-full border border-neutral-200 bg-white transition-all cursor-pointer">Deselect all</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded-full accent-brand-600 cursor-pointer" />
                </th>
                <th className="px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Transaction Ref</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Target Post URL</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Callback Event</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Payload Response</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap text-right">Dispatched Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">Loading webhook attempts...</td>
                </tr>
              ) : paginatedCallbacks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <i className="fa-solid fa-receipt text-neutral-400 text-2xl mb-2"></i>
                      <div>
                        <div className="text-xs font-semibold text-neutral-700">No callbacks triggered yet</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">Logs will populate as checkout requests execute.</div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCallbacks.map((cb) => (
                  <tr key={cb.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={selectedIds.includes(cb.id)} onChange={() => toggleSelect(cb.id)} className="w-4 h-4 rounded accent-brand-650 cursor-pointer" />
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-[10px] text-slate-500">{cb.reference}</td>
                    <td className="px-4 py-3.5 font-mono text-[10px] text-neutral-600 max-w-[200px] truncate" title={cb.url}>{cb.url}</td>
                    <td className="px-4 py-3.5"><span className="bg-slate-100 border border-slate-150 px-2 py-0.5 rounded text-[10px] font-semibold text-neutral-700">{cb.event}</span></td>
                    <td className="px-4 py-3.5 font-mono text-[10px] text-neutral-500 max-w-[250px] truncate" title={cb.response}>{cb.response}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        cb.status === 'success' ? 'bg-emerald-50 text-emerald-705 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>{cb.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-neutral-450">{cb.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
export default CallbackLogs
