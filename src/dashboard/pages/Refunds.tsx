import { useState, useRef, useEffect } from 'react'
import { Trash2, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const statusTabsConfig = [
  { id: 'all', label: 'All Refunds', icon: 'fa-solid fa-layer-group' },
  { id: 'completed', label: 'Completed', icon: 'fa-solid fa-circle-check' },
  { id: 'pending', label: 'Pending', icon: 'fa-solid fa-clock' },
  { id: 'failed', label: 'Failed', icon: 'fa-solid fa-circle-xmark' },
]

export function Refunds() {
  const [data, setData] = useState<any[]>([])
  
  useEffect(() => {
    async function loadRefundedTransactions() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('merchant_id', user.id)
          .eq('status', 'refunded')
          .eq('environment', 'test')
          .order('created_at', { ascending: false })
        
        if (txs) {
          setData(txs.map(t => ({
            id: t.id,
            reference: t.reference || t.id,
            date: new Date(t.created_at).toLocaleString(),
            refundType: 'Full',
            phone: t.customer_identifier,
            amount: Number(t.amount),
            status: 'completed',
            wallet: t.environment === 'test' ? 'Sandbox Wallet' : 'Live Wallet',
            reason: t.description || 'Transaction refunded'
          })))
        }
      }
    }
    loadRefundedTransactions()
  }, [])
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState('10')
  const [selectedRefund, setSelectedRefund] = useState<any | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [exporting, setExporting] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => { setExporting(false); if (window.showToast) window.showToast('Refunds exported successfully', 'success') }, 500)
  }
  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setShowFilters(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const totalRefunds = data.length
  const completedRefundsCount = data.filter(r => r.status === 'completed').length
  const failedRefundsCount = data.filter(r => r.status === 'failed').length
  const totalRefundedAmount = data.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0)

  const getTabCount = (tabId: string) => {
    if (tabId === 'all') return data.length
    return data.filter(r => r.status === tabId).length
  }

  const filteredRefunds = data.filter(r => {
    const matchesTab = activeTab === 'all' || r.status === activeTab
    const matchesSearch =
      r.reference.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.refundType.toLowerCase().includes(search.toLowerCase()) ||
      r.amount.toString().includes(search)
    return matchesTab && matchesSearch
  })

  const paginatedRefunds = filteredRefunds.slice(0, Number(perPage))
  const allVisibleIds = paginatedRefunds.map(r => r.id)
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.includes(id))
  const toggleAll = () => {
    if (allSelected) setSelectedIds(prev => prev.filter(id => !allVisibleIds.includes(id)))
    else setSelectedIds(prev => [...new Set([...prev, ...allVisibleIds])])
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Page Title */}
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Refunds</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Manage and track all transaction refund requests</p>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-brand-500 flex flex-col items-start gap-2.5 shadow-sm">
          <i className="fa-solid fa-clock-rotate-left text-xl text-brand-600"></i>
          <div className="w-full">
            <span className="text-xs text-neutral-500 font-normal">Total Refunds</span>
            <div className="text-2xl font-semibold text-neutral-900 mt-1.5">{totalRefunds}</div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-emerald-500 flex flex-col items-start gap-2.5 shadow-sm">
          <i className="fa-solid fa-circle-check text-xl text-emerald-600"></i>
          <div className="w-full">
            <span className="text-xs text-neutral-500 font-normal">Completed</span>
            <div className="text-2xl font-semibold text-neutral-900 mt-1.5">{completedRefundsCount}</div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-red-500 flex flex-col items-start gap-2.5 shadow-sm">
          <i className="fa-solid fa-triangle-exclamation text-xl text-red-600"></i>
          <div className="w-full">
            <span className="text-xs text-neutral-500 font-normal">Failed</span>
            <div className="text-2xl font-semibold text-neutral-900 mt-1.5">{failedRefundsCount}</div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-blue-500 flex flex-col items-start gap-2.5 shadow-sm">
          <i className="fa-solid fa-coins text-xl text-blue-600"></i>
          <div className="w-full">
            <span className="text-xs text-neutral-500 font-normal">Total Refunded</span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-semibold text-neutral-900">{totalRefundedAmount.toLocaleString()}</span>
              <span className="text-xs font-normal text-neutral-400">UGX</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── PILL STATUS CONTROLLER ── */}
      <div className="flex justify-center">
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-1.5 inline-flex items-center gap-1 overflow-x-auto no-scrollbar">
          {statusTabsConfig.map((tab) => {
            const isActive = activeTab === tab.id
            const count = getTabCount(tab.id)
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm font-semibold'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                }`}
              >
                <i className={`${tab.icon} text-[11px] ${isActive ? 'text-white/80' : 'text-neutral-400'}`}></i>
                <span>{tab.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── MAIN TABLE CONTAINER ── */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-neutral-100">
          <div className="relative flex-1 max-w-xs">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[11px]"></i>
            <input
              className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-all"
              placeholder="Search refunds..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Filters */}
            <div ref={filtersRef} className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs border transition-all ${
                  showFilters
                    ? 'bg-brand-50 border-brand-200 text-brand-700'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <i className="fa-solid fa-sliders text-[10px]"></i>
                <span>Filters</span>
              </button>
              {showFilters && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-800">Filter Options</span>
                    <button className="text-[10px] text-brand-600 font-medium hover:underline">Reset</button>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider block mb-1">Refund Type</label>
                    <select className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-xs text-neutral-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand-300">
                      <option>All Types</option>
                      <option>Full</option>
                      <option>Partial</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider block mb-1">From</label>
                      <input type="date" className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-xs text-neutral-700 focus:outline-none focus:ring-1 focus:ring-brand-300" />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider block mb-1">To</label>
                      <input type="date" className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-xs text-neutral-700 focus:outline-none focus:ring-1 focus:ring-brand-300" />
                    </div>
                  </div>
                  <button className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2 rounded-lg transition" onClick={() => setShowFilters(false)}>Apply</button>
                </div>
              )}
            </div>

            {/* Export */}
            <button onClick={handleExport} disabled={exporting} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs border border-neutral-200 text-neutral-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 bg-white transition-all disabled:opacity-60">
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
              <button onClick={() => setSelectedIds([])} className="text-xs text-neutral-500 hover:text-neutral-700 px-3 py-1.5 rounded-full border border-neutral-200 bg-white transition-all">Deselect all</button>
              <button onClick={() => setShowDeleteConfirm(true)} className="text-xs text-red-600 hover:text-red-700 px-3 py-1.5 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-1.5"><Trash2 size={13} /> Delete selected</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-brand-600 cursor-pointer" style={{borderRadius:'50%'}} />
                </th>
                <th className="px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Reference</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Refund Type</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap text-right">Amount</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Wallet</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginatedRefunds.length === 0 ? (
                <tr><td colSpan={9} className="py-20 text-center"><div className="flex flex-col items-center gap-2"><i className="fa-solid fa-clock-rotate-left text-neutral-400 text-2xl mb-2"></i><div className="text-xs font-semibold text-neutral-700">No refunds found</div><div className="text-[11px] text-neutral-400 mt-0.5">Refund records will appear here once available</div></div></td></tr>
              ) : (
                paginatedRefunds.map((refund) => (
                  <tr key={refund.id} className={`hover:bg-brand-50/20 transition-colors cursor-pointer ${selectedIds.includes(refund.id) ? 'bg-brand-50/30' : ''}`}>
                    <td className="px-4 py-3.5" onClick={e => { e.stopPropagation(); toggleSelect(refund.id) }}>
                      <input type="checkbox" checked={selectedIds.includes(refund.id)} onChange={() => toggleSelect(refund.id)} className="w-4 h-4 accent-brand-600 cursor-pointer" style={{borderRadius:'50%'}} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-neutral-805 font-semibold" onClick={() => setSelectedRefund(refund)}>{refund.reference}</td>
                    <td className="px-4 py-3.5 text-neutral-550 whitespace-nowrap" onClick={() => setSelectedRefund(refund)}>{refund.date}</td>
                    <td className="px-4 py-3.5 font-medium text-neutral-700" onClick={() => setSelectedRefund(refund)}>{refund.refundType}</td>
                    <td className="px-4 py-3.5 text-neutral-600 font-medium" onClick={() => setSelectedRefund(refund)}>{refund.phone}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-neutral-905" onClick={() => setSelectedRefund(refund)}>UGX {refund.amount.toLocaleString()}</td>
                    <td className="px-4 py-3.5" onClick={() => setSelectedRefund(refund)}>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${refund.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : refund.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{refund.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-655 font-medium" onClick={() => setSelectedRefund(refund)}>{refund.wallet}</td>
                    <td className="px-4 py-3.5 text-neutral-500 truncate max-w-[200px]" title={refund.reason} onClick={() => setSelectedRefund(refund)}>{refund.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-[11px] text-neutral-450">Showing {filteredRefunds.length} result{filteredRefunds.length !== 1 && 's'}</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500">Per page</span>
            <select
              value={perPage}
              onChange={e => setPerPage(e.target.value)}
              className="border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand-300"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <Trash2 className="mx-auto mb-3 text-red-500" size={36} />
            <h3 className="text-sm font-bold text-neutral-800 mb-1">Confirm delete</h3>
            <p className="text-xs text-neutral-500 mb-5">Are you sure you want to delete {selectedIds.length} selected refund{selectedIds.length > 1 ? 's' : ''}? This cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-all">Cancel</button>
              <button onClick={() => { setData(prev => prev.filter(r => !selectedIds.includes(r.id))); setSelectedIds([]); setShowDeleteConfirm(false); if (window.showToast) window.showToast('Selected refunds deleted', 'success') }} className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Details Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-805">Refund details</h3>
              <button 
                onClick={() => setSelectedRefund(null)}
                className="text-neutral-450 hover:text-neutral-700 transition-colors focus:outline-none"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs text-neutral-700">
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Reference</span>
                <span className="font-mono font-bold text-neutral-800 select-all">{selectedRefund.reference}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Date & time</span>
                <span className="font-medium text-neutral-805">{selectedRefund.date}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Refund type</span>
                <span className="font-semibold text-neutral-800">{selectedRefund.refundType}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Phone</span>
                <span className="font-semibold text-neutral-800">{selectedRefund.phone}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Amount</span>
                <span className="font-bold text-neutral-900">UGX {selectedRefund.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  selectedRefund.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : selectedRefund.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                  {selectedRefund.status}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Wallet</span>
                <span className="font-medium text-neutral-600">{selectedRefund.wallet}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-neutral-400 font-semibold">Reason</span>
                <span className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-neutral-655 leading-relaxed font-medium">
                  {selectedRefund.reason}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-200/60 bg-neutral-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedRefund(null)}
                className="btn-secondary px-4 py-2 text-xs rounded-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
