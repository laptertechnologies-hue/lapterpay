import { useState, useRef, useEffect } from 'react'
import { Trash2, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const tabsConfig = [
  { id: 'all', label: 'All Transactions', icon: 'fa-solid fa-layer-group' },
  { id: 'collections', label: 'Collections', icon: 'fa-solid fa-hand-holding-dollar' },
  { id: 'disbursements', label: 'Disbursements', icon: 'fa-solid fa-paper-plane' },
  { id: 'card', label: 'Card Payments', icon: 'fa-solid fa-credit-card' },
  { id: 'bill', label: 'Bill Transactions', icon: 'fa-solid fa-file-invoice' },
  { id: 'airtime', label: 'Airtime & Data', icon: 'fa-solid fa-mobile-screen-button' },
  { id: 'bank', label: 'Bank Transfers', icon: 'fa-solid fa-building-columns' },
  { id: 'reversed', label: 'Reversed', icon: 'fa-solid fa-rotate-left' },
]

const statusConfig = [
  { id: 'all', label: 'All', icon: 'fa-solid fa-layer-group', color: 'text-brand-600' },
  { id: 'completed', label: 'Completed', icon: 'fa-solid fa-circle-check', color: 'text-emerald-500' },
  { id: 'pending', label: 'Pending', icon: 'fa-solid fa-clock', color: 'text-amber-500' },
  { id: 'failed', label: 'Failed', icon: 'fa-solid fa-circle-xmark', color: 'text-red-500' },
]

export function Transactions() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: txs, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('merchant_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        if (txs) {
          const formatted = txs.map(t => ({
            id: t.id,
            reference: t.reference || t.id,
            date: new Date(t.created_at).toISOString().replace('T', ' ').substring(0, 19),
            type: t.type === 'collection' ? 'collections' : t.type === 'payout' ? 'disbursements' : 'reversed',
            method: t.payment_method,
            phone: t.customer_identifier,
            amount: parseFloat(t.amount),
            charge: parseFloat(t.fee),
            status: t.status,
            wallet: t.environment === 'test' ? 'Sandbox Wallet' : 'Live Wallet',
            narration: t.description || ''
          }))
          setData(formatted)
        }
      } catch (err) {
        console.error('Failed to query transactions:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])
  const [activeTab, setActiveTab] = useState('all')
  const [activeStatus, setActiveStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState('25')
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [exporting, setExporting] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)
  const pillScrollRef = useRef<HTMLDivElement>(null)

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      if (window.showToast) window.showToast('Transactions exported successfully', 'success')
    }, 500)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setShowFilters(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkScroll = () => {
    const el = pillScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    const el = pillScrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

  const scrollPills = (dir: 'left' | 'right') => {
    const el = pillScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' })
  }

  // Calculate dynamic count for tabs
  const getTabCount = (tabId: string) => {
    if (tabId === 'all') return data.length
    return data.filter(txn => txn.type === tabId).length
  }

  // Calculate dynamic count for status filters (based on currently selected tab)
  const getStatusCount = (statusId: string) => {
    const tabFiltered = activeTab === 'all'
      ? data
      : data.filter(txn => txn.type === activeTab)
    if (statusId === 'all') return tabFiltered.length
    return tabFiltered.filter(txn => txn.status === statusId).length
  }

  // Filter transactions based on tab, status, date range and search query
  const filteredTransactions = data.filter(txn => {
    const matchesTab = activeTab === 'all' || txn.type === activeTab
    const matchesStatus = activeStatus === 'all' || txn.status === activeStatus
    
    // Date filter logic (extract date part YYYY-MM-DD from 'YYYY-MM-DD HH:MM:SS')
    const txnDateOnly = txn.date.split(' ')[0]
    const matchesFrom = !fromDate || txnDateOnly >= fromDate
    const matchesTo = !toDate || txnDateOnly <= toDate

    const matchesSearch = 
      txn.reference.toLowerCase().includes(search.toLowerCase()) ||
      txn.phone.toLowerCase().includes(search.toLowerCase()) ||
      txn.narration.toLowerCase().includes(search.toLowerCase()) ||
      txn.method.toLowerCase().includes(search.toLowerCase()) ||
      txn.amount.toString().includes(search)
      
    return matchesTab && matchesStatus && matchesSearch && matchesFrom && matchesTo
  })

  const paginatedTransactions = filteredTransactions.slice(0, Number(perPage))
  const allVisibleIds = paginatedTransactions.map(t => t.id)
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.includes(id))
  const toggleAll = () => {
    if (allSelected) setSelectedIds(prev => prev.filter(id => !allVisibleIds.includes(id)))
    else setSelectedIds(prev => [...new Set([...prev, ...allVisibleIds])])
  }
  const activeTabData = tabsConfig.find(t => t.id === activeTab)

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Page Title */}
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Transactions</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Monitor and manage all payment activity</p>
      </div>

      {/* ── PILL CONTROLLER ── */}
      <div className="flex flex-col items-center gap-1.5">
        {(canScrollLeft || canScrollRight) && (
          <div className="flex items-center justify-between w-full" style={{ maxWidth: 'min(730px, 95vw)' }}>
            <button
              onClick={() => scrollPills('left')}
              disabled={!canScrollLeft}
              className={`flex items-center gap-1 text-[10px] font-medium rounded-full px-2.5 py-1 border transition-all ${
                canScrollLeft
                  ? 'border-neutral-200 text-neutral-600 bg-white hover:bg-neutral-50 shadow-sm'
                  : 'border-transparent text-transparent pointer-events-none'
              }`}
            >
              <i className="fa-solid fa-chevron-left text-[8px]"></i>
              <span>Scroll</span>
            </button>
            {canScrollRight && (
              <span className="text-[10px] text-neutral-400 font-medium flex items-center gap-1 animate-pulse">
                Scroll for more tabs
                <i className="fa-solid fa-arrow-right text-[9px]"></i>
              </span>
            )}
            <button
              onClick={() => scrollPills('right')}
              disabled={!canScrollRight}
              className={`flex items-center gap-1 text-[10px] font-medium rounded-full px-2.5 py-1 border transition-all ${
                canScrollRight
                  ? 'border-neutral-200 text-neutral-600 bg-white hover:bg-neutral-50 shadow-sm'
                  : 'border-transparent text-transparent pointer-events-none'
              }`}
            >
              <span>Scroll</span>
              <i className="fa-solid fa-chevron-right text-[8px]"></i>
            </button>
          </div>
        )}

        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-1.5 inline-flex items-center gap-1 max-w-full">
          <div
            ref={pillScrollRef}
            className="flex items-center gap-1 overflow-x-auto no-scrollbar"
            style={{ maxWidth: 'min(700px, 90vw)' }}
          >
            {tabsConfig.map((tab) => {
              const isActive = activeTab === tab.id
              const count = getTabCount(tab.id)
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setActiveStatus('all') // Reset status filter on tab switch
                  }}
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
      </div>

      {/* ── STATUS PILLS ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusConfig.map((sf) => {
          const isActive = activeStatus === sf.id
          const count = getStatusCount(sf.id)
          return (
            <button
              key={sf.id}
              onClick={() => setActiveStatus(sf.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                isActive
                  ? 'bg-brand-50 border-brand-200 text-brand-700 font-semibold'
                  : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
              }`}
            >
              <i className={`${sf.icon} text-[10px] ${isActive ? 'text-brand-600' : sf.color}`}></i>
              <span>{sf.label}</span>
              <span className={`font-semibold ml-0.5 ${isActive ? 'text-brand-500' : 'text-neutral-400'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── MAIN TABLE CONTAINER ── */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-neutral-100">
          <div className="relative flex-1 max-w-xs">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[11px]"></i>
            <input
              className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-all"
              placeholder="Search transactions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Filters dropdown */}
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
                    <span className="text-xs font-semibold text-neutral-800">Date Range</span>
                    <button 
                      onClick={() => { setFromDate(''); setToDate('') }}
                      className="text-[10px] text-brand-600 font-medium hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider block mb-1">From</label>
                      <input 
                        type="date" 
                        value={fromDate}
                        onChange={e => setFromDate(e.target.value)}
                        className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-xs text-neutral-700 focus:outline-none focus:ring-1 focus:ring-brand-300" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider block mb-1">To</label>
                      <input 
                        type="date" 
                        value={toDate}
                        onChange={e => setToDate(e.target.value)}
                        className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-xs text-neutral-700 focus:outline-none focus:ring-1 focus:ring-brand-300" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider block mb-1">Wallet</label>
                    <select className="w-full border border-neutral-200 rounded-lg px-2 py-1.5 text-xs text-neutral-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand-300">
                      <option>All Wallets</option>
                      <option>Live Wallet</option>
                      <option>Test Wallet</option>
                    </select>
                  </div>
                  <button className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2 rounded-lg transition" onClick={() => setShowFilters(false)}>Apply Filters</button>
                </div>
              )}
            </div>

            {/* Export */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs border border-neutral-200 text-neutral-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 bg-white transition-all disabled:opacity-60"
            >
              {exporting ? <i className="fa-solid fa-spinner fa-spin text-[12px]"></i> : <Download size={15} />}
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
              <button onClick={() => setShowDeleteConfirm(true)} className="text-xs text-red-600 hover:text-red-700 px-3 py-1.5 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-1.5">
                <Trash2 size={13} /> Delete selected
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded-full accent-brand-600 cursor-pointer" style={{borderRadius:'50%'}} />
                </th>
                <th className="px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Reference</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Date &amp; Time</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap text-right">Amount</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap text-right">Charge</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Wallet</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Narration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-xs text-neutral-450 font-normal">
                    <div className="flex flex-col items-center gap-2">
                      <i className="fa-solid fa-spinner fa-spin text-xl text-[#0022a6] mb-2"></i>
                      <span>Synchronizing transaction history...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <i className="fa-solid fa-receipt text-neutral-400 text-2xl mb-2"></i>
                      <div>
                        <div className="text-xs font-semibold text-neutral-700">No {activeTabData?.label} yet</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">Transactions will appear here once available</div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((txn) => (
                  <tr 
                    key={txn.id} 
                    className={`hover:bg-brand-50/20 transition-colors cursor-pointer ${selectedIds.includes(txn.id) ? 'bg-brand-50/30' : ''}`}
                  >
                    <td className="px-4 py-3.5" onClick={e => { e.stopPropagation(); toggleSelect(txn.id) }}>
                      <input type="checkbox" checked={selectedIds.includes(txn.id)} onChange={() => toggleSelect(txn.id)} className="w-4 h-4 accent-brand-600 cursor-pointer" style={{borderRadius:'50%'}} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-neutral-800 font-semibold" onClick={() => setSelectedTxn(txn)}>{txn.reference}</td>
                    <td className="px-4 py-3.5 text-neutral-550 whitespace-nowrap" onClick={() => setSelectedTxn(txn)}>{txn.date}</td>
                    <td className="px-4 py-3.5 capitalize font-medium text-neutral-700" onClick={() => setSelectedTxn(txn)}>
                      <div className="flex items-center gap-1.5">
                        <i className={`${tabsConfig.find(t => t.id === txn.type)?.icon || 'fa-solid fa-receipt'} text-[11px] text-neutral-400`}></i>
                        <span className="capitalize">{txn.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-600 font-medium" onClick={() => setSelectedTxn(txn)}>{txn.phone}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-neutral-900" onClick={() => setSelectedTxn(txn)}>UGX {txn.amount.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-right text-neutral-500" onClick={() => setSelectedTxn(txn)}>UGX {txn.charge.toLocaleString()}</td>
                    <td className="px-4 py-3.5" onClick={() => setSelectedTxn(txn)}>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        txn.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : txn.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-655 font-medium" onClick={() => setSelectedTxn(txn)}>{txn.wallet}</td>
                    <td className="px-4 py-3.5 text-neutral-500 truncate max-w-[160px]" title={txn.narration} onClick={() => setSelectedTxn(txn)}>{txn.narration}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 border-t border-neutral-100 flex items-center justify-between">
          <span className="text-[11px] text-neutral-450">Showing {filteredTransactions.length} result{filteredTransactions.length !== 1 && 's'}</span>
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
              <option value="100">100</option>
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
            <p className="text-xs text-neutral-500 mb-5">Are you sure you want to delete {selectedIds.length} selected transaction{selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-all">Cancel</button>
              <button onClick={() => { setData(prev => prev.filter(r => !selectedIds.includes(r.id))); setSelectedIds([]); setShowDeleteConfirm(false); if (window.showToast) window.showToast('Selected transactions deleted', 'success') }} className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-850">Transaction details</h3>
              <button 
                onClick={() => setSelectedTxn(null)}
                className="text-neutral-450 hover:text-neutral-700 transition-colors focus:outline-none"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs text-neutral-700">
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Reference</span>
                <span className="font-mono font-bold text-neutral-800 select-all">{selectedTxn.reference}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Date & time</span>
                <span className="font-medium text-neutral-805">{selectedTxn.date}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Type</span>
                <span className="capitalize font-semibold text-brand-600">{selectedTxn.type}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Method</span>
                <span className="font-semibold text-neutral-800">{selectedTxn.method}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Phone / Account</span>
                <span className="font-semibold text-neutral-800">{selectedTxn.phone}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Amount</span>
                <span className="font-bold text-neutral-900">UGX {selectedTxn.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Charge</span>
                <span className="font-medium text-neutral-500">UGX {selectedTxn.charge.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  selectedTxn.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : selectedTxn.status === 'pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-red-50 text-red-650 border-red-100'
                }`}>
                  {selectedTxn.status}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-400 font-semibold">Wallet</span>
                <span className="font-medium text-neutral-600">{selectedTxn.wallet}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-neutral-400 font-semibold">Narration</span>
                <span className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-neutral-655 leading-relaxed font-medium">
                  {selectedTxn.narration}
                </span>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-200/60 bg-neutral-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedTxn(null)}
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
