import { useState, useEffect } from 'react'
import { Trash2, Lock, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sanitizeError } from '../../lib/errors'
import { ConfirmDialog } from '../../components/ConfirmDialog'

interface WhitelistedIp {
  id: string
  ip: string
  label: string
  status: 'Active' | 'Inactive'
  added: string
}

export function IpWhitelist() {
  const [ips, setIps] = useState<WhitelistedIp[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [success, setSuccess] = useState(false)
  const [activeFilterStatus, setActiveFilterStatus] = useState<string>('Active')

  // Selected rows
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form states
  const [ipAddress, setIpAddress] = useState('')
  const [ipLabel, setIpLabel] = useState('')

  useEffect(() => {
    async function loadIps() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('ip_whitelists')
          .select('*')
          .eq('merchant_id', user.id)

        if (error) throw error
        if (data) {
          const formatted = data.map(item => ({
            id: item.id,
            ip: item.ip_address,
            label: item.description || 'API IP',
            status: 'Active' as const,
            added: new Date(item.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          }))
          setIps(formatted)
        }
      } catch (err) {
        console.error('Failed to load IP whitelists:', err)
      } finally {
        setLoading(false)
      }
    }
    loadIps()
  }, [])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredIps.map(ip => ip.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id))
    }
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('ip_whitelists')
        .delete()
        .in('id', selectedIds)

      if (error) throw error

      setIps(prev => prev.filter(ip => !selectedIds.includes(ip.id)))
      setSelectedIds([])
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      if (window.showToast) {
        window.showToast('Successfully deleted selected IP addresses', 'success')
      }
    } catch (err: any) {
      if (window.showToast) window.showToast(sanitizeError(err).userMessage, 'error')
      else alert(sanitizeError(err).userMessage)
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ipAddress || !ipLabel) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: newRow, error } = await supabase
        .from('ip_whitelists')
        .insert({
          merchant_id: user.id,
          ip_address: ipAddress,
          description: ipLabel
        })
        .select()
        .single()

      if (error) throw error

      const newIp: WhitelistedIp = {
        id: newRow.id,
        ip: newRow.ip_address,
        label: newRow.description || 'API IP',
        status: 'Active',
        added: new Date(newRow.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }

      setIps(prev => [newIp, ...prev])
      setSuccess(true)

      setTimeout(() => {
        setSuccess(false)
        setShowAddModal(false)
        setIpAddress('')
        setIpLabel('')
        if (window.showToast) {
          window.showToast('IP address whitelisted successfully', 'success')
        }
      }, 500)
    } catch (err: any) {
      if (window.showToast) window.showToast(sanitizeError(err).userMessage, 'error')
      else alert(sanitizeError(err).userMessage)
    }
  }

  const handleDelete = (id: string) => {
    setSelectedIds([id])
    setShowDeleteConfirm(true)
  }

  const filteredIps = ips.filter(item => {
    const matchesSearch = item.ip.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.label.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilterStatus ? item.status === activeFilterStatus : true
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">IP Whitelist</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage your IP address whitelist. Only whitelisted IPs can make API calls to your account.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <i className="fa-solid fa-plus text-[10px]"></i>
          <span>Add IP Address</span>
        </button>
      </div>

      {/* Security Information alert panel */}
      <div className="p-5 bg-white border border-neutral-200 border-l-4 border-l-brand-500 rounded-2xl flex gap-3 text-xs text-neutral-600 leading-relaxed shadow-sm">
        <Lock className="text-brand-600 shrink-0 mt-0.5" size={16} />
        <div className="space-y-2">
          <div className="font-bold text-neutral-800 font-semibold">Security Information</div>
          <div>
            <span className="font-bold text-neutral-700">Default Behavior:</span> You can currently make API calls from any IP address. Once you add IP addresses to your whitelist, only those specific IPs will be allowed to make API calls to your account.
          </div>
          <div>
            <span className="font-bold text-neutral-700">Security Recommendation:</span> For enhanced security, consider whitelisting only trusted IP addresses such as your office network, server IPs, or specific development environments.
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 border-b border-neutral-100 bg-neutral-25/30">
          <div className="relative w-full sm:max-w-xs">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[11px]"></i>
            <input 
              type="text" 
              placeholder="Search whitelisted IPs..." 
              className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-805 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <select 
              value={activeFilterStatus}
              onChange={(e) => setActiveFilterStatus(e.target.value)}
              className="border border-neutral-200 rounded-full px-3 py-1.5 text-xs text-neutral-700 bg-white focus:outline-none"
            >
              <option value="Active">Active IPs</option>
              <option value="">All Statuses</option>
            </select>
          </div>
        </div>

        {/* Selected rows action bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-brand-50 border-b border-brand-100">
            <span className="text-xs font-semibold text-brand-700">{selectedIds.length} row{selectedIds.length > 1 ? 's' : ''} selected</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedIds([])} 
                className="text-xs text-neutral-500 hover:text-neutral-700 px-3 py-1.5 rounded-full border border-neutral-200 bg-white transition-all cursor-pointer"
              >
                Deselect all
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="text-xs text-red-600 hover:text-red-700 px-3 py-1.5 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} /> Remove selected
              </button>
            </div>
          </div>
        )}

        {/* Table layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                <th className="px-4 py-3 w-10">
                  <input 
                    type="checkbox" 
                    checked={filteredIps.length > 0 && selectedIds.length === filteredIps.length} 
                    onChange={handleSelectAll} 
                    className="w-4 h-4 rounded accent-brand-650 cursor-pointer" 
                  />
                </th>
                <th className="px-5 py-3">IP Address</th>
                <th className="px-5 py-3">Label / Description</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Added Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">Loading whitelist...</td>
                </tr>
              ) : filteredIps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-neutral-450 font-normal">
                    No whitelisted IP addresses found.
                  </td>
                </tr>
              ) : (
                filteredIps.map(ip => (
                  <tr key={ip.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(ip.id)} 
                        onChange={(e) => handleSelectRow(ip.id, e.target.checked)} 
                        className="w-4 h-4 rounded accent-brand-650 cursor-pointer" 
                      />
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-neutral-805 select-all">{ip.ip}</td>
                    <td className="px-5 py-3.5 font-semibold text-neutral-700">{ip.label}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-705 border border-emerald-100">
                        {ip.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-450">{ip.added}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button 
                        onClick={() => handleDelete(ip.id)} 
                        className="text-red-500 hover:text-red-700 transition font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Remove Whitelist IP"
        message="Are you sure you want to remove the selected IP address whitelist? Requests from these servers will be blocked."
        confirmText="Remove IP"
        cancelText="Cancel"
        isDestructive={true}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Add IP Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-neutral-200 max-w-md w-full p-6 shadow-xl space-y-4 text-xs animate-fade-in">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-800">Add IP Address to Whitelist</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-450 hover:text-neutral-600 cursor-pointer">
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-805 rounded-xl flex items-center gap-2 font-bold animate-fade-in">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <span>IP Address added to Whitelist successfully!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 mb-1.5 uppercase tracking-wide">IP Address *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. 192.168.1.1 or 2001:db8::1"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 mb-1.5 uppercase tracking-wide">Label / Description *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Office Server, Dev Box"
                  value={ipLabel}
                  onChange={(e) => setIpLabel(e.target.value)}
                  className="input"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow transition-all cursor-pointer"
              >
                Whitelist IP Address
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default IpWhitelist
