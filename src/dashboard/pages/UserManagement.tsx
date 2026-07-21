import { useState, useEffect } from 'react'
import { Eye, Edit2, Info, Check, Trash2, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'


interface User {
  id: string
  name: string
  email: string
  status: 'Active' | 'Inactive'
  accountStatus: 'active' | 'suspended'
  joined: string
  emailVerification: 'Verified' | 'Pending'
  twoFactorStatus: 'Enabled' | 'Disabled'
  phone?: string
  role?: string
  photo?: string
}

export function UserManagement() {
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list')
  const [users, setUsers] = useState<User[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function initUsers() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        // Fetch merchant profile for initialization details
        const { data: merchant } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', user.id)
          .single()

        const stored = localStorage.getItem(`users_${user.id}`)
        if (stored) {
          try {
            setUsers(JSON.parse(stored))
          } catch (e) {
            console.error(e)
          }
        } else {
          const initialUser: User = {
            id: 'usr_1',
            name: merchant?.business_name || 'Admin User',
            email: user.email || 'admin@tamupay.ug',
            status: 'Active',
            accountStatus: 'active',
            joined: new Date(user.created_at || Date.now()).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            emailVerification: 'Verified',
            twoFactorStatus: 'Enabled',
            phone: merchant?.contact_phone || '+256783721005',
            role: 'Owner'
          }
          const defaultList = [initialUser]
          setUsers(defaultList)
          localStorage.setItem(`users_${user.id}`, JSON.stringify(defaultList))
        }
      }
    }
    initUsers()
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const [perPage, setPerPage] = useState(10)
  const [successMsg, setSuccessMsg] = useState(false)


  // Form states
  const [fullName, setFullName] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [mobilePhone, setMobilePhone] = useState('')
  const [accountStatusInput, setAccountStatusInput] = useState('')
  const [roleInput, setRoleInput] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  // Selected rows
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => {
      setExporting(false)
      if (window.showToast) {
        window.showToast('Users exported successfully', 'success')
      }
    }, 800)
  }

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active')
  const [isSaving, setIsSaving] = useState(false)

  const startEdit = (user: User) => {
    setEditingUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditPhone(user.phone || '')
    setEditRole(user.role || '')
    setEditStatus(user.status)
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setIsSaving(true)
    setTimeout(() => {
      setUsers(prev => {
        const next = prev.map(u => u.id === editingUser.id ? {
          ...u,
          name: editName,
          email: editEmail,
          phone: editPhone,
          role: editRole,
          status: editStatus
        } : u)
        if (userId) {
          localStorage.setItem(`users_${userId}`, JSON.stringify(next))
        }
        return next
      })
      setIsSaving(false)
      setEditingUser(null)
      if (window.showToast) {
        window.showToast('User details updated successfully', 'success')
      }
    }, 500)
  }
  
  // Business context
  const [businessName, setBusinessName] = useState('Tamu wifi')
  useEffect(() => {
    const savedName = localStorage.getItem('merchant_business_name')
    if (savedName) setBusinessName(savedName)
  }, [])

  const handleDeleteConfirm = () => {
    setIsDeleting(true)
    setTimeout(() => {
      setUsers(prev => {
        const next = prev.filter(u => !selectedIds.includes(u.id))
        if (userId) {
          localStorage.setItem(`users_${userId}`, JSON.stringify(next))
        }
        return next
      })
      setSelectedIds([])
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      if (window.showToast) {
        window.showToast('Successfully deleted selected users', 'success')
      }
    }, 500)
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredUsers.map(u => u.id))
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

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !emailAddress || !accountStatusInput) return

    let photoUrl = ''
    if (photoFile) {
      photoUrl = URL.createObjectURL(photoFile)
    }

    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: fullName,
      email: emailAddress,
      status: accountStatusInput === 'active' ? 'Active' : 'Inactive',
      accountStatus: accountStatusInput as 'active' | 'suspended',
      joined: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      emailVerification: 'Pending',
      twoFactorStatus: 'Disabled',
      phone: mobilePhone,
      role: roleInput || 'No role selected',
      photo: photoUrl
    }

    setUsers(prev => {
      const next = [newUser, ...prev]
      if (userId) {
        localStorage.setItem(`users_${userId}`, JSON.stringify(next))
      }
      return next
    })
    setSuccessMsg(true)

    setTimeout(() => {
      setSuccessMsg(false)
      setViewMode('list')
      setFullName('')
      setEmailAddress('')
      setMobilePhone('')
      setAccountStatusInput('')
      setRoleInput('')
      setPhotoFile(null)
    }, 1200)
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (viewMode === 'create') {
    return (
      <div className="space-y-6">
        {/* Header Panel */}
        <div className="card bg-white p-6 border border-neutral-200/80 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Create New User</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Add a new user to your business. A password setup link will be sent to their email address.
              </p>
            </div>
            <button 
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-full text-xs font-semibold text-neutral-600 transition-all"
            >
              <i className="fa-solid fa-arrow-left text-[10px]"></i>
              Back to Users
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-6">
            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-250 rounded-lg text-emerald-800 flex items-start gap-3">
                <Check className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="text-xs font-bold">User Invitation Initialized</h4>
                  <p className="text-2xs text-emerald-600 mt-0.5">
                    User account has been registered and setup link dispatched.
                  </p>
                </div>
              </div>
            )}

            {/* Basic Info Container */}
            <div className="border border-neutral-200 rounded-2xl p-6 bg-white space-y-4">
              <h3 className="text-sm font-bold text-neutral-800 border-b border-neutral-100 pb-2">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter the user's full name (e.g., John Doe)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter the user's email address (e.g., john.doe@company.com)"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="input"
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Mobile phone</label>
                  <input
                    type="text"
                    placeholder="+256712345678"
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value)}
                    className="input"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    {mobilePhone || '+256712345678'}
                  </span>
                </div>

                {/* Business */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Business</label>
                  <div className="border border-neutral-200 rounded-2xl p-3 bg-neutral-50/70 text-xs">
                    <div className="font-bold text-neutral-800">{businessName}</div>
                    <div className="text-[10px] text-neutral-450 mt-1 leading-relaxed">
                      New users are always created for your current business context (switch business in the header if you need a subaccount).
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Account Status *</label>
                  <select
                    required
                    value={accountStatusInput}
                    onChange={(e) => setAccountStatusInput(e.target.value)}
                    className="input bg-white"
                  >
                    <option value="">Select the user's account status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* Role dropdown */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Role (Optional)</label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="input bg-white"
                  >
                    <option value="">No role selected</option>
                    <option value="Finance manager">Finance manager</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Support specialist">Support specialist</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Only roles created for this business are shown (switch business in the header to see another business's roles).
                  </span>
                </div>

                {/* Profile Photo */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Profile Photo (Optional)</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-neutral-700 border border-neutral-300 rounded px-3 py-1.5 text-xs font-semibold transition-colors">
                      Choose File
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPhotoFile(e.target.files[0])
                          }
                        }}
                      />
                    </label>
                    <span className="text-xs text-neutral-500">
                      {photoFile ? photoFile.name : 'No file chosen'}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-450 mt-1.5 block">
                    Accepted formats: JPG, PNG, GIF. Maximum size: 2MB
                  </span>
                </div>
              </div>
            </div>

            {/* Important Info Alert Box */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 flex gap-3 text-xs text-blue-805">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <div className="font-bold">Important Information</div>
                <ul className="list-disc pl-4 space-y-1 text-neutral-600 text-[11px]">
                  <li>The new user will receive a password setup link via email.</li>
                  <li>They will be assigned to your current business (shown above).</li>
                  <li>Only business users can be created (not system administrators).</li>
                  <li>You can only create users for your own business.</li>
                  <li>Profile photos are optional but recommended for better user identification.</li>
                </ul>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
              <button 
                type="button"
                onClick={() => setViewMode('list')}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-full text-xs font-semibold text-neutral-600 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header Panel */}
      <div>
        <h2 className="text-base font-semibold text-neutral-900">User Management</h2>
        <p className="text-xs text-neutral-400 mt-0.5">Manage user accounts for your business</p>
      </div>
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800">All Users</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Manage user accounts for your business. You can view, edit, activate or deactivate users as needed.
            </p>
          </div>
          <div className="flex items-center gap-3.5">
            <span className="text-xs text-neutral-550 italic">Loading user statistics...</span>
            <button 
              onClick={() => setViewMode('create')}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all"
            >
              <i className="fa-solid fa-plus text-[10px]"></i>
              Add User
            </button>
          </div>
        </div>

        {/* Table & Filtering */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-brand-50/80 border border-brand-100 rounded-2xl px-5 py-3 mb-4 animate-fade-in">
            <span className="text-xs font-semibold text-brand-900">
              {selectedIds.length} user{selectedIds.length > 1 ? 's' : ''} selected
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

        <div className="mt-4 border border-neutral-200 rounded-2xl overflow-hidden bg-white">
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xs">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[11px]"></i>
              <input
                type="text"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-all"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 bg-white transition-all">
                <i className="fa-solid fa-sliders text-[10px]"></i>
                <span>Filters</span>
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 bg-white transition-all animate-all"
              >
                {exporting ? (
                  <i className="fa-solid fa-spinner fa-spin text-[10px]"></i>
                ) : (
                  <Download size={14} />
                )}
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                  <th className="px-4 py-3 text-center w-10">
                    <input 
                      type="checkbox"
                      className="w-4 h-4 rounded-full border-neutral-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                      onChange={handleSelectAll}
                      checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                    />
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Email</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Account Status</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Joined</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Email Verified</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">2FA</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-center">
                        <i className="fa-solid fa-users-slash text-neutral-450 text-2xl mb-3"></i>
                        <span className="text-xs text-neutral-550 font-medium">No matching user accounts found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-25 transition-all">
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded-full border-neutral-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                          checked={selectedIds.includes(user.id)}
                          onChange={(e) => handleSelectRow(user.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-4 py-4 font-bold text-neutral-900 capitalize">
                        {user.name}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {user.email}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          user.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-705 border-emerald-100'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="bg-neutral-100 text-neutral-550 border border-neutral-150 px-2 py-0.5 rounded text-[10px] lowercase font-semibold">
                          {user.accountStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-neutral-500">
                        {user.joined}
                      </td>
                      <td className="px-4 py-4">
                        <span className="bg-emerald-50 text-emerald-705 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {user.emailVerification}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          user.twoFactorStatus === 'Enabled'
                            ? 'bg-emerald-50 text-emerald-705 border-emerald-100'
                            : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                        }`}>
                          {user.twoFactorStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 font-semibold text-[11px]">
                          <span 
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye size={12} />
                            View
                          </span>
                          <span 
                            onClick={() => startEdit(user)}
                            className="text-amber-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit2 size={12} />
                            Edit
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination */}
          <div className="p-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 bg-neutral-25">
            <div>
              Showing {filteredUsers.length} result{filteredUsers.length !== 1 && 's'}
            </div>
            
            <div className="flex items-center gap-2">
              <span>Per page</span>
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand-300"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4">
            <div className="text-center space-y-2">
              <Trash2 className="mx-auto mb-2 text-rose-500" size={36} />
              <h3 className="text-sm font-bold text-neutral-800">
                Confirm delete
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Are you sure you want to delete the selected users? This action cannot be undone.
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

      {/* View User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-850">User details</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-neutral-450 hover:text-neutral-700 transition-colors focus:outline-none"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs text-neutral-700">
              <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-655 font-bold uppercase shrink-0">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-850 capitalize">{selectedUser.name}</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{selectedUser.email}</p>
                </div>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-450 font-semibold">User ID</span>
                <span className="font-mono text-neutral-800">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-450 font-semibold">Phone</span>
                <span className="font-semibold text-neutral-800">{selectedUser.phone || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-450 font-semibold">Role</span>
                <span className="font-semibold text-neutral-800 capitalize">{selectedUser.role || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-450 font-semibold">Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  selectedUser.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                }`}>
                  {selectedUser.status}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-450 font-semibold">Account Status</span>
                <span className="bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded text-[10px] lowercase font-semibold capitalize">
                  {selectedUser.accountStatus}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-450 font-semibold">Joined</span>
                <span className="font-medium text-neutral-700">{selectedUser.joined}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                <span className="text-neutral-450 font-semibold">Email Verification</span>
                <span className="bg-emerald-50 text-emerald-705 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-semibold">
                  {selectedUser.emailVerification}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-450 font-semibold">2FA Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                  selectedUser.twoFactorStatus === 'Enabled'
                    ? 'bg-emerald-50 text-emerald-705 border-emerald-100'
                    : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                }`}>
                  {selectedUser.twoFactorStatus}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-200/60 bg-neutral-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedUser(null)}
                className="btn-secondary px-4 py-2 text-xs rounded-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-850">Edit user profile</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-neutral-450 hover:text-neutral-700 transition-colors focus:outline-none"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit}>
              <div className="p-6 space-y-4 text-xs text-neutral-700">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="input"
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Mobile Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="input"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Finance manager"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="input"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-neutral-600 mb-1.5">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                    className="input bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-neutral-200/60 bg-neutral-50/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn-secondary px-4 py-2 text-xs rounded-full"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 text-xs rounded-full flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

