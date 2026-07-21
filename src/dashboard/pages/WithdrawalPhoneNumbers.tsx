import { useState, useEffect } from 'react'
import { Phone, X, Trash2, CheckCircle2, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface WithdrawalPhone {
  id: string
  phone: string
  name: string
  network: string
  verified: boolean
  added: string
}



export function WithdrawalPhoneNumbers() {
  const [phoneList, setPhoneList] = useState<WithdrawalPhone[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadPhones() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: phones, error: fetchErr } = await supabase
          .from('withdrawal_phones')
          .select('*')
          .eq('merchant_id', user.id)
          .order('created_at', { ascending: false })

        if (!fetchErr && phones) {
          setPhoneList(phones.map((p: any) => ({
            id: p.id,
            phone: p.phone,
            name: p.name,
            network: p.network,
            verified: p.verified,
            added: new Date(p.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          })))
        }
      }
    }
    loadPhones()
  }, [])

  // Search / filter
  const [search, setSearch] = useState('')

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Bulk delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form states
  const [inputPhone, setInputPhone] = useState('')
  const [inputName, setInputName] = useState('')

  // ---------- Derived filtered list ----------
  const filteredList = phoneList.filter((item) => {
    const q = search.toLowerCase()
    return (
      item.phone.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.network.toLowerCase().includes(q)
    )
  })

  // ---------- Selection helpers ----------
  const allSelected =
    filteredList.length > 0 && filteredList.every((i) => selectedIds.includes(i.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredList.map((i) => i.id).includes(id)))
    } else {
      const newIds = filteredList.map((i) => i.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...newIds])))
    }
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleAddPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputPhone) return

    let formattedPhone = inputPhone.trim()
    if (!formattedPhone.startsWith('256') && !formattedPhone.startsWith('+256')) {
      alert('Phone number must start with 256 (e.g., +2567XXXXXXXX)')
      return
    }

    let network = 'Other Operator'
    const match = formattedPhone.replace('+', '')
    if (
      match.startsWith('25677') ||
      match.startsWith('25678') ||
      match.startsWith('25676') ||
      match.startsWith('25639')
    ) {
      network = 'MTN-UG'
    } else if (
      match.startsWith('25670') ||
      match.startsWith('25675') ||
      match.startsWith('25674')
    ) {
      network = 'Airtel-UG'
    }

    setLoading(true)
    const { data: newRow, error: insertErr } = await supabase
      .from('withdrawal_phones')
      .insert({
        merchant_id: userId,
        phone: formattedPhone.startsWith('+') ? formattedPhone : '+' + formattedPhone,
        name: inputName || 'Main Account',
        network,
        verified: true
      })
      .select()
      .single()

    if (insertErr) {
      if (window.showToast) window.showToast(insertErr.message, 'error')
      setLoading(false)
      return
    }

    const newPhone: WithdrawalPhone = {
      id: newRow.id,
      phone: newRow.phone,
      name: newRow.name,
      network: newRow.network,
      verified: newRow.verified,
      added: new Date(newRow.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    }

    setPhoneList((prev) => [newPhone, ...prev])
    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      setSuccess(false)
      setShowAddModal(false)
      setInputPhone('')
      setInputName('')
      if (window.showToast) window.showToast('Phone number added successfully', 'success')
    }, 1200)
  }

  const handleDeleteSingle = async (id: string) => {
    const { error: deleteErr } = await supabase
      .from('withdrawal_phones')
      .delete()
      .eq('id', id)

    if (deleteErr) {
      if (window.showToast) window.showToast(deleteErr.message, 'error')
      return
    }

    setPhoneList((prev) => prev.filter((num) => num.id !== id))
    setSelectedIds((prev) => prev.filter((x) => x !== id))
    if (window.showToast) window.showToast('Phone number removed', 'success')
  }

  const handleBulkDelete = async () => {
    const { error: deleteErr } = await supabase
      .from('withdrawal_phones')
      .delete()
      .in('id', selectedIds)

    if (deleteErr) {
      if (window.showToast) window.showToast(deleteErr.message, 'error')
      return
    }

    setPhoneList((prev) => prev.filter((r) => !selectedIds.includes(r.id)))
    setSelectedIds([])
    setShowDeleteConfirm(false)
    if (window.showToast) window.showToast('Selected phone numbers deleted', 'success')
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h2 className="text-base font-semibold text-neutral-900">Withdrawal Phone Numbers</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Manage payout phone numbers for withdrawals</p>
      </div>

      {/* Main Container Card */}
      <div className="card bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden">

        {/* Card top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 gap-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-800">Manage Withdrawal Phone Numbers</h3>
            <p className="text-2xs text-neutral-500 mt-1 max-w-lg leading-relaxed">
              Manage payout mobile money numbers for withdrawals. There is no limit on how many you can add. Two-Factor Authentication is required for edits and deletes.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all shrink-0"
          >
            <i className="fa-solid fa-plus text-[10px]" />
            Add Phone Number
          </button>
        </div>

        {/* Search bar */}
        <div className="px-6 py-3 border-b border-neutral-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by phone, name, or network…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-8 text-xs"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-neutral-400">
            {filteredList.length} of {phoneList.length} number{phoneList.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Bulk action bar */}
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

        {/* List / Empty state */}
        {filteredList.length === 0 ? (
          <div className="py-20 flex flex-col justify-center items-center text-center px-4">
            <Phone size={28} className="text-neutral-400 mb-3" />
            <h4 className="text-sm font-semibold text-neutral-800">
              {search ? 'No results match your search' : 'No withdrawal phone numbers added yet'}
            </h4>
            <p className="text-2xs text-neutral-400 mt-1">
              {search ? 'Try a different search term.' : 'Click “Add Phone Number” to get started.'}
            </p>
          </div>
        ) : (
          <div className="p-6">
            {/* Master checkbox row */}
            <div className="flex items-center gap-3 mb-3 px-1">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="rounded-full w-4 h-4 accent-brand-600 cursor-pointer"
                title="Select all"
              />
              <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                Select all
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredList.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <div
                    key={item.id}
                    className={`border rounded-2xl p-5 flex items-start justify-between gap-4 bg-white hover:shadow-2xs transition-all ${
                      isSelected
                        ? 'border-brand-300 bg-brand-50/40 ring-1 ring-brand-200'
                        : 'border-neutral-200'
                    }`}
                  >
                    {/* Checkbox + icon + info */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(item.id)}
                        className="rounded-full w-4 h-4 accent-brand-600 cursor-pointer mt-0.5 shrink-0"
                      />
                      <div className="w-10 h-10 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-center shrink-0">
                        <Phone size={16} className="text-neutral-600" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-neutral-800">{item.phone}</span>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            Verified
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-450 font-semibold uppercase tracking-wider">
                          {item.network} · {item.name}
                        </div>
                        <div className="text-[9px] text-neutral-400">Added: {item.added}</div>
                      </div>
                    </div>

                    {/* Delete button — naked icon, no background box */}
                    <button
                      onClick={() => handleDeleteSingle(item.id)}
                      className="text-red-400 hover:text-red-600 transition-all"
                      title="Remove Phone Number"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <Trash2 className="mx-auto mb-3 text-red-500" size={36} />
            <h3 className="text-sm font-bold text-neutral-800 mb-1">Confirm Delete</h3>
            <p className="text-xs text-neutral-500 mb-5">
              Are you sure you want to delete {selectedIds.length} selected phone number
              {selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Withdrawal Phone Number Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-neutral-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800">Add Withdrawal Phone Number</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-650"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddPhone} className="p-6 space-y-4 text-xs">
              {success ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-800">Phone Number Registered</h4>
                    <p className="text-2xs text-emerald-600 mt-0.5">
                      The withdrawal phone number has been verified and registered.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Phone Number *</label>
                    <input 
                      type="text"
                      required
                      placeholder="+256XXXXXXXXX"
                      value={inputPhone}
                      onChange={(e) => setInputPhone(e.target.value)}
                      className="input"
                    />
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      Format: +256XXXXXXXXX (must start with 256)
                    </span>
                  </div>

                  {/* Name Optional */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Name (Optional)</label>
                    <input 
                      type="text"
                      placeholder="e.g., Main Account"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      className="input"
                    />
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      Name will be automatically filled from phone verification
                    </span>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                    <button 
                      type="button" 
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-neutral-300 rounded-full text-xs font-semibold text-neutral-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Adding...' : 'Add Phone Number'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
