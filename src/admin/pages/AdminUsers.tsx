import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'

interface AdminUser {
  id: string
  name: string
  email: string
  phone: string
  role: 'Super Admin' | 'Auditor' | 'Support Specialist' | 'Merchant Owner' | 'Merchant Finance'
  businessContext: string
  status: 'Active' | 'Suspended'
  joined: string
}

export function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list')
  const [successMsg, setSuccessMsg] = useState('')

  // Mock system users list
  const [users, setUsers] = useState<AdminUser[]>([
    { id: 'usr_admin1', name: 'System Super Admin', email: 'admin@lapterpay.com', phone: '+256701000100', role: 'Super Admin', businessContext: 'Lapterpay HQ', status: 'Active', joined: 'Jan 01, 2026' },
    { id: 'usr_admin2', name: 'Compliance Officer Pro', email: 'compliance@lapterpay.com', phone: '+256701000200', role: 'Auditor', businessContext: 'Lapterpay HQ', status: 'Active', joined: 'Feb 15, 2026' },
    { id: 'usr_m1', name: 'Bangole Alvin', email: 'bangolealvin@gmail.com', phone: '+256763721005', role: 'Merchant Owner', businessContext: 'Lapter Wifi', status: 'Active', joined: 'Jun 10, 2026' },
    { id: 'usr_m2', name: 'Punjab Alvin', email: 'alvinpunjab@gmail.com', phone: '+256712345678', role: 'Merchant Finance', businessContext: 'Lapter Wifi', status: 'Active', joined: 'Jun 11, 2026' },
    { id: 'usr_m3', name: 'Cafe Manager Stan', email: 'stan@ntindacafe.com', phone: '+256773902938', role: 'Merchant Owner', businessContext: 'Ntinda Cafe', status: 'Suspended', joined: 'May 04, 2026' }
  ])

  // Form states for creating a new user
  const [newFullName, setNewFullName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState<'Super Admin' | 'Auditor' | 'Support Specialist'>('Support Specialist')

  // Edit states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editRole, setEditRole] = useState<any>('')
  const [editStatus, setEditStatus] = useState<'Active' | 'Suspended'>('Active')

  // Load custom registered merchant if exists in localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('merchant_email')
    const savedName = localStorage.getItem('merchant_business_name')
    const savedPhone = localStorage.getItem('merchant_phone')
    if (savedEmail && savedName) {
      const exists = users.some(u => u.email === savedEmail)
      if (!exists) {
        const customUser: AdminUser = {
          id: 'usr_custom_' + Math.floor(100 + Math.random() * 900),
          name: savedName.split(' ')[0] || 'Merchant Owner',
          email: savedEmail,
          phone: savedPhone || '+256700000000',
          role: 'Merchant Owner',
          businessContext: savedName,
          status: 'Active',
          joined: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        }
        setUsers(prev => [...prev, customUser])
      }
    }
  }, [])

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFullName || !newEmail || !newPhone) return

    const newUser: AdminUser = {
      id: 'usr_admin_' + Math.floor(1000 + Math.random() * 9000),
      name: newFullName,
      email: newEmail,
      phone: newPhone,
      role: newRole,
      businessContext: 'Lapterpay HQ',
      status: 'Active',
      joined: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    setUsers(prev => [newUser, ...prev])
    setSuccessMsg('Administrative user added successfully.')
    
    setTimeout(() => {
      setSuccessMsg('')
      setViewMode('list')
      setNewFullName('')
      setNewEmail('')
      setNewPhone('')
    }, 1200)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setUsers(prev => prev.map(u => u.id === editingUser.id ? {
      ...u,
      role: editRole,
      status: editStatus
    } : u))

    setEditingUser(null)
    if (window.showToast) {
      window.showToast('User profile updated successfully', 'success')
    }
  }

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user from the system?')) {
      setUsers(prev => prev.filter(u => u.id !== id))
      if (window.showToast) {
        window.showToast('User deleted from system records', 'success')
      }
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.businessContext.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter ? u.role === roleFilter : true
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">User Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage administrative credentials and merchant profiles platform-wide</p>
        </div>
        
        {viewMode === 'list' ? (
          <button 
            onClick={() => setViewMode('create')}
            className="bg-[#0022a6] hover:bg-[#001c80] text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm flex items-center gap-1.5 transition-all"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            Add Admin User
          </button>
        ) : (
          <button 
            onClick={() => setViewMode('list')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 border border-slate-300 rounded-full transition-all"
          >
            Back to Directory
          </button>
        )}
      </div>

      {/* CREATE VIEW */}
      {viewMode === 'create' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Add Administrative Staff</h3>
            <p className="text-xs text-slate-400 mt-1">Assign platform responsibilities to new support or compliance personnel.</p>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-650 font-bold mb-1.5 uppercase">Full Name *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. John Support"
                value={newFullName}
                onChange={e => setNewFullName(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-slate-650 font-bold mb-1.5 uppercase">Email Address *</label>
              <input 
                type="email" 
                required 
                placeholder="e.g. john@lapterpay.com"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-slate-650 font-bold mb-1.5 uppercase">Phone Number *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. +256700000000"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-slate-650 font-bold mb-1.5 uppercase">System Role *</label>
              <select 
                value={newRole}
                onChange={e => setNewRole(e.target.value as any)}
                className="input bg-white"
              >
                <option value="Super Admin">Super Admin (Full Access)</option>
                <option value="Auditor">Compliance Auditor (Read-Only Logs)</option>
                <option value="Support Specialist">Support Specialist (Manage Tickets)</option>
              </select>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#0022a6] hover:bg-[#001c80] text-white font-bold py-3 rounded-xl transition-all shadow mt-2"
            >
              Register Staff Account
            </button>
          </form>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 animate-fade-in">
          
          {/* Filters controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-xs w-full">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
              <input 
                type="text" 
                placeholder="Search by name, email, merchant..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-700 bg-white focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Auditor">Auditor</option>
                <option value="Support Specialist">Support Specialist</option>
                <option value="Merchant Owner">Merchant Owner</option>
                <option value="Merchant Finance">Merchant Finance</option>
              </select>
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3">User</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">System Role</th>
                  <th className="p-3">Business Entity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-450 font-normal">
                      No users match the search filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-25/50 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-805 uppercase shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-slate-900 font-bold capitalize">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal font-mono">{user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-slate-700">{user.email}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{user.phone}</p>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          user.role.startsWith('Super')
                            ? 'bg-amber-55 bg-amber-50 text-amber-705 border-amber-200'
                            : user.role === 'Auditor'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-800 font-bold capitalize">{user.businessContext}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          user.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-705 border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-3 font-bold text-[11px]">
                          <span 
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            View
                          </span>
                          <span 
                            onClick={() => { setEditingUser(user); setEditRole(user.role); setEditStatus(user.status); }}
                            className="text-amber-600 hover:text-amber-800 cursor-pointer"
                          >
                            Edit
                          </span>
                          <span 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-rose-600 hover:text-rose-800 cursor-pointer"
                          >
                            Delete
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4 text-xs">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 font-bold uppercase text-sm shrink-0">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-slate-850 capitalize">{selectedUser.name}</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedUser.id}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-slate-700">
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-400 font-semibold">Email</span>
                <span>{selectedUser.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-400 font-semibold">Phone</span>
                <span>{selectedUser.phone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-400 font-semibold">Role</span>
                <span className="font-bold">{selectedUser.role}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-400 font-semibold">Business Entity</span>
                <span className="font-bold capitalize">{selectedUser.businessContext}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-400 font-semibold">Status</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  selectedUser.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>{selectedUser.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Joined Date</span>
                <span>{selectedUser.joined}</span>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-350 text-slate-700 font-bold py-2 rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4 text-xs">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Edit User Profile</h3>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-slate-650 font-bold mb-1.5">Full Name</label>
                <input type="text" disabled value={editingUser.name} className="input bg-slate-50 cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-slate-650 font-bold mb-1.5">System Role</label>
                <select 
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as any)}
                  className="input bg-white"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Auditor">Compliance Auditor</option>
                  <option value="Support Specialist">Support Specialist</option>
                  <option value="Merchant Owner">Merchant Owner</option>
                  <option value="Merchant Finance">Merchant Finance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-650 font-bold mb-1.5">Account Status</label>
                <select 
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="input bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold py-2 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#0022a6] hover:bg-[#001c80] text-white font-bold py-2 rounded-xl transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
export default AdminUsers
