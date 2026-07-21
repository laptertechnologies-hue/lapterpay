import { useState, useEffect } from 'react'
import { X, Search, CheckCircle, Trash2, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface FloatRequest {
  id: string
  channel: string
  amount: number
  date: string
  status: 'Pending' | 'Approved' | 'Rejected'
}

export function FloatManagement() {
  const [isModalOpen, setIsModalOpen]         = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<FloatRequest | null>(null)
  const [currency, setCurrency]               = useState('UGX')
  const [channel, setChannel]                 = useState('')
  const [amount, setAmount]                   = useState('')
  const [dateLoaded, setDateLoaded]           = useState('')
  const [successMsg, setSuccessMsg]           = useState(false)
  const [userId, setUserId]                   = useState<string | null>(null)
  const [errorMsg, setErrorMsg]               = useState('')
  const [loading, setLoading]                 = useState(false)

  // ── data (mutable for delete) ───────────────────────────────────────────────
  const [data, setData] = useState<FloatRequest[]>([])

  useEffect(() => {
    async function loadFloatDeposits() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('merchant_id', user.id)
          .eq('type', 'collection')
          .eq('environment', 'test')
          .order('created_at', { ascending: false })

        if (txs) {
          setData(txs.map(t => ({
            id: t.id,
            channel: t.payment_method,
            amount: Number(t.amount),
            date: new Date(t.created_at).toISOString().split('T')[0],
            status: t.status === 'completed' ? 'Approved' : t.status === 'failed' ? 'Rejected' : 'Pending'
          })))
        }
      }
    }
    loadFloatDeposits()
  }, [])

  // ── filters ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]     = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [channelFilter, setChannelFilter] = useState('')

  // ── row selection ───────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds]         = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // ── export ──────────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false)

  // ── derived / filtered rows ─────────────────────────────────────────────────
  const filteredData = data.filter(r => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.channel.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    const matchesStatus  = !statusFilter  || r.status  === statusFilter
    const matchesChannel = !channelFilter || r.channel === channelFilter
    return matchesSearch && matchesStatus && matchesChannel
  })

  // ── master checkbox helpers ──────────────────────────────────────────────────
  const allFilteredSelected =
    filteredData.length > 0 && filteredData.every(r => selectedIds.includes(r.id))

  const toggleMaster = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredData.map(r => r.id).includes(id)))
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...filteredData.map(r => r.id)])])
    }
  }

  const toggleRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // ── export handler ───────────────────────────────────────────────────────────
  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      if (window.showToast) window.showToast('Data exported successfully', 'success')
    }, 500)
  }

  // ── form submit ──────────────────────────────────────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!channel || !amount || !dateLoaded || !userId) return

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount')
      return
    }

    setLoading(true)

    // Call RPC to increment balance
    const { data: isOk, error: rpcErr } = await supabase.rpc('increment_wallet_balance', {
      p_merchant_id: userId,
      p_environment: 'test',
      p_currency: 'UGX',
      p_amount: numAmount
    })

    if (rpcErr || !isOk) {
      setErrorMsg(rpcErr?.message || 'Failed to request top-up balance. Please try again.')
      setLoading(false)
      return
    }

    const newTxId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000)

    // Insert collection transaction record
    const { error: txErr } = await supabase
      .from('transactions')
      .insert({
        id: newTxId,
        merchant_id: userId,
        type: 'collection',
        amount: numAmount,
        fee: 0,
        currency: 'UGX',
        payment_method: channel,
        customer_identifier: 'Float Topup',
        status: 'completed',
        environment: 'test',
        description: 'Float Deposit Topup'
      })

    setLoading(false)
    if (txErr) {
      setErrorMsg(txErr.message)
      return
    }

    const newRequest: FloatRequest = {
      id: newTxId,
      channel,
      amount: numAmount,
      date: dateLoaded,
      status: 'Approved',
    }

    setData(prev => [newRequest, ...prev])
    setSuccessMsg(true)
    setTimeout(() => {
      setSuccessMsg(false)
      setIsModalOpen(false)
      setChannel('')
      setAmount('')
      setDateLoaded('')
    }, 2000)
  }

  return (
    <div className="relative min-h-[600px] space-y-6">

      {/* ── Main Page Content ─────────────────────────────────────────────── */}
      <div className="card bg-white p-6 border border-neutral-200/80 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
              Manage Your Float ()
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 bg-white transition-all disabled:opacity-60"
            >
              <Download size={15} />
              {exporting ? 'Exporting…' : 'Export'}
            </button>

            {/* Request Top-Up */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all"
            >
              <i className="fa-solid fa-plus text-[10px]"></i>
              Request Top-Up
            </button>
          </div>
        </div>

        {/* ── Search / Filter Row ─────────────────────────────────────────── */}
        <div className="border border-neutral-200/60 rounded-t-lg bg-neutral-50/50 p-3 flex items-center justify-between gap-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
            <input
              type="text"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="Search by ID, channel…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-neutral-200 rounded-full px-3 py-2 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-200 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Channel filter */}
            <select
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value)}
              className="bg-white border border-neutral-200 rounded-full px-3 py-2 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-200 cursor-pointer"
            >
              <option value="">All Channels</option>
              <option value="MTN MoMo UG">MTN MoMo UG</option>
              <option value="Airtel Money UG">Airtel Money UG</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* ── Float Table ─────────────────────────────────────────────────── */}
        <div className="border-x border-b border-neutral-200/60 rounded-b-lg overflow-hidden">
          {data.length === 0 ? (
            <div className="py-20 flex flex-col justify-center items-center text-center">
              <i className="fa-solid fa-scale-balanced text-neutral-400 text-2xl mb-3"></i>
              <p className="text-xs text-neutral-400">
                No float top-up requests found. Click "Request Top-Up" to make your first deposit.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white m-3">

              {/* ── Bulk Action Bar ──────────────────────────────────────── */}
              {selectedIds.length > 0 && (
                <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-brand-50 border-b border-brand-100">
                  <span className="text-xs font-semibold text-brand-700">
                    {selectedIds.length} row{selectedIds.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedIds([])}
                      className="text-xs text-neutral-500 hover:text-neutral-700 px-3 py-1.5 rounded-full border border-neutral-200 bg-white transition-all"
                    >
                      Deselect all
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-xs text-red-600 hover:text-red-700 px-3 py-1.5 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      Delete selected
                    </button>
                  </div>
                </div>
              )}

              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-semibold border-b border-neutral-200/60">
                  <tr>
                    {/* Master checkbox */}
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleMaster}
                        className="rounded-full w-4 h-4 accent-brand-600 cursor-pointer"
                      />
                    </th>
                    <th className="p-3">Request ID</th>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Date Loaded</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/40">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                        No results match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map(req => (
                      <tr
                        key={req.id}
                        className={`hover:bg-brand-50/20 transition-colors cursor-pointer ${
                          selectedIds.includes(req.id) ? 'bg-brand-50/30' : ''
                        }`}
                      >
                        {/* Row checkbox — stop propagation so it doesn't open details */}
                        <td className="p-3" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(req.id)}
                            onChange={() => toggleRow(req.id)}
                            className="rounded-full w-4 h-4 accent-brand-600 cursor-pointer"
                          />
                        </td>
                        <td
                          className="p-3 font-semibold text-neutral-700"
                          onClick={() => setSelectedRequest(req)}
                        >
                          {req.id}
                        </td>
                        <td
                          className="p-3 text-neutral-600"
                          onClick={() => setSelectedRequest(req)}
                        >
                          {req.channel}
                        </td>
                        <td
                          className="p-3 font-medium text-neutral-900"
                          onClick={() => setSelectedRequest(req)}
                        >
                          UGX {req.amount.toLocaleString()}
                        </td>
                        <td
                          className="p-3 text-neutral-500"
                          onClick={() => setSelectedRequest(req)}
                        >
                          {req.date}
                        </td>
                        <td
                          className="p-3"
                          onClick={() => setSelectedRequest(req)}
                        >
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            req.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'Rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <Trash2 className="mx-auto mb-3 text-red-500" size={36} />
            <h3 className="text-sm font-bold text-neutral-800 mb-1">Confirm Delete</h3>
            <p className="text-xs text-neutral-500 mb-5">
              Are you sure you want to delete {selectedIds.length} selected row{selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setData(prev => prev.filter(r => !selectedIds.includes(r.id)))
                  setSelectedIds([])
                  setShowDeleteConfirm(false)
                  if (window.showToast) window.showToast('Selected rows deleted', 'success')
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request Top-Up Modal ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-neutral-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-800">Request Float Top-Up</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              {successMsg ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-800">Float Request Submitted</h4>
                    <p className="text-2xs text-emerald-600 mt-0.5">
                      Your request has been submitted for review.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-655 rounded-xl text-xs flex items-center gap-2">
                      <i className="fa-solid fa-circle-exclamation text-xs"></i>
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Warning Instructions Alert Box */}
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md text-xs text-neutral-500">
                    Please select a channel above to see deposit instructions.
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="label text-neutral-600 font-semibold mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="input w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white"
                    >
                      <option value="UGX">UGX</option>
                    </select>
                    <p className="text-[10px] italic text-amber-600 mt-1">
                      Only UGX is supported at the moment.
                    </p>
                  </div>

                  {/* Channel */}
                  <div>
                    <label className="label text-neutral-600 font-semibold mb-1">Channel</label>
                    <select
                      required
                      value={channel}
                      onChange={e => setChannel(e.target.value)}
                      className="input w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-white"
                    >
                      <option value="">Select a channel</option>
                      <option value="MTN MoMo UG">MTN MoMo UG</option>
                      <option value="Airtel Money UG">Airtel Money UG</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="label text-neutral-600 font-semibold mb-1">Amount</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 100000"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="input w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>

                  {/* Date Loaded */}
                  <div>
                    <label className="label text-neutral-600 font-semibold mb-1">Date Loaded</label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={dateLoaded}
                        onChange={e => setDateLoaded(e.target.value)}
                        className="input w-full border border-neutral-300 rounded px-3 py-2 text-xs focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Reference Scan / Proof */}
                  <div>
                    <label className="label text-neutral-600 font-semibold mb-1">Reference Scan / Proof</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            console.log('Selected file:', e.target.files[0].name)
                          }
                        }}
                        className="text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-neutral-300 file:text-xs file:font-semibold file:bg-neutral-50 file:text-neutral-700 hover:file:bg-neutral-100 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex justify-end items-center gap-3 pt-3 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-neutral-300 rounded-full text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      {loading && <i className="fa-solid fa-spinner animate-spin text-[10px]"></i>}
                      <span>Request Float Top-Up</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ── Float Request Details Modal ──────────────────────────────────────── */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-805">Float request details</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-neutral-450 hover:text-neutral-700 transition-colors focus:outline-none"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs text-neutral-700">
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-450 font-semibold">Request ID</span>
                <span className="font-mono font-bold text-neutral-850 select-all">{selectedRequest.id}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-450 font-semibold">Channel</span>
                <span className="font-semibold text-neutral-800">{selectedRequest.channel}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-450 font-semibold">Amount</span>
                <span className="font-bold text-neutral-900">UGX {selectedRequest.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-450 font-semibold">Date Loaded</span>
                <span className="font-medium text-neutral-800">{selectedRequest.date}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-neutral-450 font-semibold">Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  selectedRequest.status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : selectedRequest.status === 'Pending'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                  {selectedRequest.status}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-200/60 bg-neutral-50/50 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
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
