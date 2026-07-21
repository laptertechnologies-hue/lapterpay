import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function ManageSubAccounts() {
  const [activeTab, setActiveTab] = useState<'my' | 'pending' | 'incoming' | 'send'>('my')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Send request form states
  const [searchBusiness, setSearchBusiness] = useState('')
  const [notes, setNotes] = useState('')
  const [requestSent, setRequestSent] = useState(false)

  // Create new form states
  const [subAccountName, setSubAccountName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [businessCreated, setBusinessCreated] = useState(false)

  // DB integration states
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [subAccounts, setSubAccounts] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [incomingRequests, setIncomingRequests] = useState<any[]>([])

  const fetchSubAccounts = async (uid: string, email: string) => {
    // 1. My sub-accounts (where I am owner)
    const { data: mySubs, error: myErr } = await supabase
      .from('sub_accounts')
      .select('*, merchants:linked_merchant_id(id, business_name, email, contact_phone)')
      .eq('owner_merchant_id', uid)

    if (!myErr && mySubs) {
      // Accepted subaccounts
      const active = mySubs.filter(s => s.status === 'accepted').map(s => ({
        id: s.id,
        name: s.label || s.merchants?.business_name || s.invited_email,
        email: s.merchants?.email || s.invited_email,
        phone: s.merchants?.contact_phone || 'None',
        status: 'Active',
        balance: 'UGX 0'
      }))
      setSubAccounts(active)

      // Pending invitations sent
      const pending = mySubs.filter(s => s.status === 'pending').map(s => ({
        id: s.id,
        name: s.label || s.invited_email,
        email: s.invited_email,
        date: new Date(s.created_at).toISOString().split('T')[0],
        status: 'Pending'
      }))
      setPendingRequests(pending)
    }

    // 2. Incoming invitations (where I am invited)
    const { data: incomingSubs, error: incErr } = await supabase
      .from('sub_accounts')
      .select('*, owner:owner_merchant_id(id, business_name, email, contact_phone)')
      .eq('invited_email', email)
      .eq('status', 'pending')

    if (!incErr && incomingSubs) {
      const incoming = incomingSubs.map(s => ({
        id: s.id,
        name: s.owner?.business_name || 'Lapter Merchant',
        email: s.owner?.email || 'payouts@lapterpay.com',
        date: new Date(s.created_at).toISOString().split('T')[0],
        status: 'Pending'
      }))
      setIncomingRequests(incoming)
    }
  }

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserEmail(user.email || null)
        fetchSubAccounts(user.id, user.email || '')
      }
    }
    loadData()
  }, [])

  // Checkbox selection & delete states
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Reset selection when tab changes or search query changes
  useEffect(() => {
    setSelectedIds([])
  }, [activeTab, searchQuery])

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchBusiness || !userId) return
    setIsDeleting(true)

    const { error } = await supabase
      .from('sub_accounts')
      .insert({
        owner_merchant_id: userId,
        invited_email: searchBusiness,
        label: searchBusiness,
        status: 'pending'
      })

    if (error) {
      if (window.showToast) {
        window.showToast(error.message, 'error')
      }
      setIsDeleting(false)
      return
    }

    setRequestSent(true)
    setTimeout(() => {
      setRequestSent(false)
      setSearchBusiness('')
      setNotes('')
      if (userEmail) {
        fetchSubAccounts(userId, userEmail)
      }
      setActiveTab('pending')
    }, 1500)
    setIsDeleting(false)
  }

  const handleManage = (subName: string) => {
    localStorage.setItem('merchant_business_name', subName)
    // Dispatch a custom event to notify DashboardLayout to reload business name
    window.dispatchEvent(new Event('businessNameChanged'))
    if (window.showToast) {
      window.showToast(`Switched context to subaccount: ${subName}`, 'success')
    }
  }

  const handleCreateSubaccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subAccountName || !email || !userId) return
    setIsDeleting(true)

    const { error } = await supabase
      .from('sub_accounts')
      .insert({
        owner_merchant_id: userId,
        invited_email: email,
        label: subAccountName,
        status: 'pending'
      })

    if (error) {
      if (window.showToast) {
        window.showToast(error.message, 'error')
      }
      setIsDeleting(false)
      return
    }

    setBusinessCreated(true)
    setTimeout(() => {
      setBusinessCreated(false)
      setShowCreateModal(false)
      setSubAccountName('')
      setEmail('')
      setPhone('')
      setAddress('')
      setLogoFile(null)
      if (userEmail) {
        fetchSubAccounts(userId, userEmail)
      }
      setActiveTab('pending')
    }, 1500)
    setIsDeleting(false)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    const { error } = await supabase
      .from('sub_accounts')
      .delete()
      .in('id', selectedIds)

    if (error) {
      if (window.showToast) {
        window.showToast(error.message, 'error')
      }
      setIsDeleting(false)
      return
    }

    if (activeTab === 'my') {
      setSubAccounts(prev => prev.filter(x => !selectedIds.includes(x.id)))
    } else if (activeTab === 'pending') {
      setPendingRequests(prev => prev.filter(x => !selectedIds.includes(x.id)))
    } else if (activeTab === 'incoming') {
      setIncomingRequests(prev => prev.filter(x => !selectedIds.includes(x.id)))
    }
    setSelectedIds([])
    setIsDeleting(false)
    setShowDeleteConfirm(false)
    if (window.showToast) {
      window.showToast('Successfully deleted selected items', 'success')
    }
  }

  const handleAcceptRequest = async (id: string, name: string) => {
    const { error } = await supabase
      .from('sub_accounts')
      .update({ status: 'accepted', responded_at: new Date() })
      .eq('id', id)

    if (error) {
      if (window.showToast) {
        window.showToast(error.message, 'error')
      }
      return
    }

    if (window.showToast) {
      window.showToast(`Request from ${name} accepted`, 'success')
    }
    if (userId && userEmail) {
      fetchSubAccounts(userId, userEmail)
    }
  }

  const handleDeclineRequest = async (id: string, name: string) => {
    const { error } = await supabase
      .from('sub_accounts')
      .update({ status: 'declined', responded_at: new Date() })
      .eq('id', id)

    if (error) {
      if (window.showToast) {
        window.showToast(error.message, 'error')
      }
      return
    }

    if (window.showToast) {
      window.showToast(`Request from ${name} declined`, 'success')
    }
    if (userId && userEmail) {
      fetchSubAccounts(userId, userEmail)
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id))
    }
  }

  const handleSelectAll = (checked: boolean, visibleIds: string[]) => {
    if (checked) {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])))
    } else {
      setSelectedIds(prev => prev.filter(x => !visibleIds.includes(x)))
    }
  }

  // Filtering Logic
  const filteredSubAccounts = subAccounts.filter(x => 
    x.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    x.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPendingRequests = pendingRequests.filter(x => 
    x.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    x.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredIncomingRequests = incomingRequests.filter(x => 
    x.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    x.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { id: 'my' as const, label: 'My Subaccounts', icon: 'fa-solid fa-building', count: subAccounts.length },
    { id: 'pending' as const, label: 'Pending Requests', icon: 'fa-solid fa-hourglass-half', count: pendingRequests.length },
    { id: 'incoming' as const, label: 'Incoming Requests', icon: 'fa-solid fa-reply', count: incomingRequests.length },
    { id: 'send' as const, label: 'Send Request', icon: 'fa-solid fa-paper-plane' },
  ]

  const activeVisibleIds = 
    activeTab === 'my' ? filteredSubAccounts.map(x => x.id) :
    activeTab === 'pending' ? filteredPendingRequests.map(x => x.id) :
    activeTab === 'incoming' ? filteredIncomingRequests.map(x => x.id) : []

  const isAllChecked = activeVisibleIds.length > 0 && activeVisibleIds.every(id => selectedIds.includes(id))

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Sub Accounts</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Manage your subaccounts and requests for Lapter Wifi</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all"
        >
          <i className="fa-solid fa-plus text-[10px]"></i>
          Create New
        </button>
      </div>

      {/* Tabs navigation (Pill Controller Style) */}
      <div className="flex justify-center">
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-1.5 inline-flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const hasCount = typeof tab.count === 'number'
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
                {hasCount && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && activeTab !== 'send' && (
        <div className="flex items-center justify-between bg-brand-50/80 border border-brand-100 rounded-2xl px-5 py-3 mb-4 animate-fade-in">
          <span className="text-xs font-semibold text-brand-900">
            {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="btn-secondary px-3.5 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-full"
            >
              Deselect all
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-primary bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 text-xs rounded-full flex items-center gap-1.5 shadow-2xs"
            >
              <Trash2 size={14} />
              Delete selected
            </button>
          </div>
        </div>
      )}

      {/* Tab Contents Wrapper */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm min-h-[220px]">
        {/* Search Toolbar */}
        {activeTab !== 'send' && (
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xs">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[11px]"></i>
              <input
                type="text"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-all"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'my' && (
          filteredSubAccounts.length === 0 ? (
            <div className="text-center py-10 flex flex-col justify-center items-center min-h-[180px]">
              <i className="fa-solid fa-building text-neutral-400 text-2xl mb-3"></i>
              <h3 className="text-sm font-semibold text-neutral-600">No subaccounts found</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Create a new subaccount or send a request to manage an existing business.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    <th className="px-4 py-3 text-center w-10">
                      <input 
                        type="checkbox"
                        checked={isAllChecked}
                        onChange={(e) => handleSelectAll(e.target.checked, activeVisibleIds)}
                      />
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Sub Account Name</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Email</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Balance</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredSubAccounts.map(sub => (
                    <tr key={sub.id} className={`hover:bg-brand-50/20 transition-colors ${selectedIds.includes(sub.id) ? 'bg-brand-50/10' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(sub.id)}
                          onChange={(e) => handleSelectRow(sub.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-5 py-4 font-bold text-neutral-900">{sub.name}</td>
                      <td className="px-4 py-4 text-neutral-600">{sub.email}</td>
                      <td className="px-4 py-4 text-neutral-500">{sub.phone}</td>
                      <td className="px-4 py-4 font-bold text-neutral-800">{sub.balance}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-emerald-50 text-emerald-705 border-emerald-100">
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => handleManage(sub.name)} className="text-brand-600 hover:text-brand-700 font-semibold hover:underline">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'pending' && (
          filteredPendingRequests.length === 0 ? (
            <div className="text-center py-10 flex flex-col justify-center items-center min-h-[180px]">
              <i className="fa-solid fa-hourglass-half text-neutral-400 text-2xl mb-3"></i>
              <h3 className="text-sm font-semibold text-neutral-600">No pending requests</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Outgoing requests to manage other business accounts will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    <th className="px-4 py-3 text-center w-10">
                      <input 
                        type="checkbox"
                        checked={isAllChecked}
                        onChange={(e) => handleSelectAll(e.target.checked, activeVisibleIds)}
                      />
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Business Name</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Email</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Date Sent</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredPendingRequests.map(req => (
                    <tr key={req.id} className={`hover:bg-brand-50/20 transition-colors ${selectedIds.includes(req.id) ? 'bg-brand-50/10' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(req.id)}
                          onChange={(e) => handleSelectRow(req.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-5 py-4 font-bold text-neutral-900">{req.name}</td>
                      <td className="px-4 py-4 text-neutral-600">{req.email}</td>
                      <td className="px-4 py-4 text-neutral-500">{req.date}</td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-amber-50 text-amber-705 border-amber-100">
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'incoming' && (
          filteredIncomingRequests.length === 0 ? (
            <div className="text-center py-10 flex flex-col justify-center items-center min-h-[180px]">
              <i className="fa-solid fa-reply text-neutral-400 text-2xl mb-3"></i>
              <h3 className="text-sm font-semibold text-neutral-600">No incoming requests</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Requests from other businesses wanting to connect with you will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-100">
                    <th className="px-4 py-3 text-center w-10">
                      <input 
                        type="checkbox"
                        checked={isAllChecked}
                        onChange={(e) => handleSelectAll(e.target.checked, activeVisibleIds)}
                      />
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Business Name</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Email</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Date Received</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredIncomingRequests.map(req => (
                    <tr key={req.id} className={`hover:bg-brand-50/20 transition-colors ${selectedIds.includes(req.id) ? 'bg-brand-50/10' : ''}`}>
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(req.id)}
                          onChange={(e) => handleSelectRow(req.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-5 py-4 font-bold text-neutral-900">{req.name}</td>
                      <td className="px-4 py-4 text-neutral-600">{req.email}</td>
                      <td className="px-4 py-4 text-neutral-500">{req.date}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold border bg-blue-50 text-blue-700 border-blue-100">
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-3">
                        <button 
                          onClick={() => handleAcceptRequest(req.id, req.name)} 
                          className="text-emerald-650 hover:text-emerald-700 font-semibold hover:underline"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleDeclineRequest(req.id, req.name)} 
                          className="text-red-600 hover:text-red-700 font-semibold hover:underline"
                        >
                          Decline
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'send' && (
          <div className="w-full max-w-3xl p-6">
            <h3 className="text-sm font-bold text-neutral-800 mb-1">
              Send Request to Manage Business
            </h3>
            <p className="text-xs text-neutral-500 mb-6">
              Search for an existing business and send them a request to manage their business as a subaccount.
            </p>
            
            {requestSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 max-w-xl shadow-2xs">
                <i className="fa-solid fa-circle-check text-emerald-500 shrink-0 mt-0.5 text-base"></i>
                <div>
                  <h4 className="text-xs font-semibold text-emerald-800">Request Sent Successfully</h4>
                  <p className="text-2xs text-emerald-600 mt-0.5">
                    We've sent a management request to the business.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendRequest} className="space-y-5 max-w-2xl">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Search Business</label>
                  <input
                    type="text"
                    required
                    value={searchBusiness}
                    onChange={(e) => setSearchBusiness(e.target.value)}
                    placeholder="Search by name, email, or account number..."
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Notes (Optional)</label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes or context for this request..."
                    className="input w-full"
                  />
                </div>
                <div className="flex justify-start pt-2">
                  <button type="submit" className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-colors">
                    Send Request
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4">
            <div className="text-center space-y-2">
              <Trash2 className="mx-auto mb-2 text-rose-500" size={36} />
              <h3 className="text-sm font-bold text-neutral-800">
                Confirm Delete
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Are you sure you want to delete {selectedIds.length} selected item{selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary flex-1 py-2 text-xs rounded-full"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="btn-primary bg-rose-600 hover:bg-rose-700 text-white flex-1 py-2 text-xs rounded-full flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-neutral-800">Create New Sub Account</h3>
                <p className="text-xs text-neutral-500 mt-0.5">The subaccount will inherit the mode (LIVE) from the parent business.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {businessCreated ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <i className="fa-solid fa-circle-check text-emerald-500 shrink-0 mt-0.5 text-base"></i>
                <div>
                  <h4 className="text-xs font-semibold text-emerald-800">Sub Account Created</h4>
                  <p className="text-2xs text-emerald-600 mt-0.5">The sub account has been created and registered under your primary account.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateSubaccount} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Sub Account Name <span className="text-red-500">*</span></label>
                    <input type="text" required value={subAccountName} onChange={(e) => setSubAccountName(e.target.value)} placeholder="Enter subaccount name" className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Email <span className="text-red-500">*</span></label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter subaccount email" className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Phone <span className="text-red-500">*</span></label>
                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Address <span className="text-red-500">*</span></label>
                    <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter business address" className="input w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Logo (Optional)</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100/50 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5">
                      <i className="fa-solid fa-upload text-[11px]"></i>
                      Choose File
                      <input type="file" className="hidden" onChange={(e) => { if (e.target.files && e.target.files[0]) { setLogoFile(e.target.files[0]) } }} />
                    </label>
                    <span className="text-xs text-neutral-500">{logoFile ? logoFile.name : 'No file chosen'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-neutral-200 text-neutral-600 rounded-full text-xs font-semibold hover:bg-neutral-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-colors">
                    Create Sub Account
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
