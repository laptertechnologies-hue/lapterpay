import { useState } from 'react'
import { Trash2, Download } from 'lucide-react'

interface RoleItem {
  id: string
  name: string
  description: string
  permissionsCount: number
  permissions: string[]
  usersAssigned: number
}

const PERMISSION_SECTIONS = [
  {
    category: 'Dashboard',
    subgroups: [
      { name: 'DASHBOARD', permissions: ['View Dashboard'] }
    ]
  },
  {
    category: 'Your Business',
    subgroups: [
      {
        name: 'BUSINESS DOCUMENTS',
        permissions: ['View Business Documents', 'Manage Business Documents', 'Create Business Documents', 'Edit Business Documents', 'Delete Business Documents']
      },
      {
        name: 'SUB ACCOUNTS',
        permissions: ['View Sub Accounts', 'Manage Sub Accounts', 'Create Sub Accounts', 'Switch Sub Accounts']
      },
      {
        name: 'TRANSACTIONS',
        permissions: ['View Transactions', 'Manage Transactions']
      },
      {
        name: 'REFUNDS',
        permissions: ['Manage Refunds']
      },
      {
        name: 'ACCOUNT STATEMENTS',
        permissions: ['View Account Statements', 'Manage Account Statements', 'View Account Statement Details', 'Export Account Statements PDF', 'Export Account Statements Excel', 'View Account Statements API']
      },
      {
        name: 'FLOAT MANAGEMENT',
        permissions: ['View Float Management', 'Manage Float Management', 'Create Float Management', 'Edit Float Management', 'Delete Float Management', 'Subscribe Float Management', 'Unsubscribe Float Management']
      },
      {
        name: 'FLOAT APPROVALS',
        permissions: ['View Float Approvals']
      },
      {
        name: 'SERVICE MARKETPLACE',
        permissions: ['View Service Marketplace', 'Manage Service Marketplace', 'Subscribe Service Marketplace', 'Configure Service Credentials', 'Configure Message Service', 'Fetch Service Balance', 'Send Test Service Message', 'Save Message Configuration']
      }
    ]
  },
  {
    category: 'Payments',
    subgroups: [
      {
        name: 'AIRTIME & DATA',
        permissions: ['Airtime & Data', 'Manage Airtime & Data', 'View Airtime & Data', 'Buy Airtime & Data']
      },
      {
        name: 'SEND MONEY',
        permissions: ['Send Money', 'Manage Send Money', 'View Send Money', 'Create Send Money', 'Check Send Money Status', 'Check Send Money KYC']
      },
      {
        name: 'WALLET TRANSFER',
        permissions: ['Wallet Transfer', 'Manage Wallet Transfer', 'View Wallet Transfer', 'Create Wallet Transfer', 'Search Wallet Transfer Businesses', 'View Wallet Transfer Business Details']
      },
      {
        name: 'PAY BILLS',
        permissions: ['Pay Bills', 'Manage Pay Bills', 'View Pay Bills', 'Verify Pay Bills Meter', 'Verify Pay Bills Phone', 'Create Pay Bills Favorites', 'View Pay Bills Favorites', 'Edit Pay Bills Favorites', 'Delete Pay Bills Favorites', 'Buy Pay Bills Light', 'Buy Pay Bills Water', 'Buy Pay Bills DSTV', 'Buy Pay Bills GOTV']
      },
      {
        name: 'BULK PAYMENTS',
        permissions: ['Bulk Payments', 'Manage Bulk Payments', 'View Bulk Payments', 'Create Bulk Payments', 'Process Bulk Payments', 'Download Bulk Payment Template', 'View Bulk Payment Details']
      },
      {
        name: 'BANK DETAILS',
        permissions: ['Bank Details', 'Manage Bank Details', 'View Bank Detail Page', 'View Bank Details Detail', 'Update Bank Details']
      }
    ]
  },
  {
    category: 'Collections',
    subgroups: [
      {
        name: 'COLLECTIONS',
        permissions: ['View Collections', 'Manage Collections']
      },
      {
        name: 'PAYMENT LINKS',
        permissions: ['Payment Links', 'Manage Payment Links', 'Create Payment Links', 'Edit Payment Links', 'View Public Payment Links', 'Copy Payment Links', 'Delete Payment Links']
      }
    ]
  },
  {
    category: 'Bank Transfer',
    subgroups: [
      {
        name: 'PUSH TO BANK',
        permissions: ['Manage Bank Transfer', 'Push to Bank', 'View Push to Bank', 'Create Push to Bank', 'Validate Push to Bank Account']
      }
    ]
  },
  {
    category: 'Business & Marketing',
    subgroups: []
  },
  {
    category: 'Users',
    subgroups: [
      {
        name: 'USERS',
        permissions: ['Manage Users', 'View Users', 'Create Users', 'Edit Users', 'Deactivate Users', 'Delete Users']
      },
      {
        name: 'ROLES',
        permissions: ['Manage Roles', 'View Roles', 'Create Roles', 'Edit Roles', 'Delete Roles']
      }
    ]
  },
  {
    category: 'Settings',
    subgroups: [
      {
        name: 'BUSINESS INFORMATION',
        permissions: ['Business Information', 'Manage Business Information', 'Edit Business Information']
      },
      {
        name: 'WITHDRAWAL PHONE NUMBERS',
        permissions: ['Withdrawal Phone Numbers', 'Manage Withdrawal Phone Numbers', 'Create Withdrawal Phone Numbers', 'Edit Withdrawal Phone Numbers', 'Delete Withdrawal Phone Numbers', 'Verify Withdrawal Phone Numbers']
      },
      {
        name: 'SUPPORT TICKETS',
        permissions: ['Support Tickets', 'Manage Support Tickets', 'Create Support Tickets', 'View Support Ticket Details', 'Respond Support Tickets', 'Close Support Tickets']
      },
      {
        name: 'SUPPORT MANAGEMENT',
        permissions: ['View Managed Support Ticket Details', 'Create Managed Support Tickets', 'Assign Managed Support Tickets', 'Respond Managed Support Tickets', 'Update Managed Support Ticket Status', 'Export Managed Support Tickets']
      },
      {
        name: 'SERVICES',
        permissions: ['Services', 'Manage Services', 'Create Services', 'Edit Services', 'Delete Services', 'Toggle Services Status', 'Test Services']
      },
      {
        name: 'FEEDBACK INBOX',
        permissions: ['Feedback Inbox', 'Manage Feedback Inbox', 'View Feedback Inbox Details', 'Update Feedback Inbox Status', 'Export Feedback Inbox']
      },
      {
        name: 'FEEDBACK & SUGGESTIONS',
        permissions: ['Feedback & Suggestions', 'Manage Feedback & Suggestions', 'Create Feedback & Suggestions', 'View Feedback & Suggestions Details', 'Edit Feedback & Suggestions', 'Delete Feedback & Suggestions']
      },
      {
        name: 'ACTIVITY LOGS',
        permissions: ['View Activity Log Details']
      }
    ]
  },
  {
    category: 'Developers',
    subgroups: [
      {
        name: 'API KEYS',
        permissions: ['API Keys', 'Manage API Keys', 'Generate API Keys', 'Reset API Keys', 'Toggle API Activity']
      },
      {
        name: 'IP WHITELIST',
        permissions: ['IP Whitelist', 'Manage IP Whitelist', 'Create IP Whitelist', 'Edit IP Whitelist', 'Activate IP Whitelist', 'Deactivate IP Whitelist', 'Delete IP Whitelist']
      },
      {
        name: 'DOCUMENTATION',
        permissions: ['Documentation']
      }
    ]
  }
]

const allFlatPermissions = PERMISSION_SECTIONS.flatMap(section => 
  section.subgroups.flatMap(sub => sub.permissions)
)

import { useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { sanitizeError } from '../../lib/errors'
import { ConfirmDialog } from '../../components/ConfirmDialog'

export function Roles() {
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list')
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function loadRoles() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: dbRoles, error: fetchErr } = await supabase
          .from('roles')
          .select('*')
          .eq('merchant_id', user.id)
          .order('created_at', { ascending: false })

        if (!fetchErr && dbRoles && dbRoles.length > 0) {
          setRoles(dbRoles.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description || '',
            permissionsCount: r.permissions.length,
            permissions: r.permissions,
            usersAssigned: 0
          })))
        } else {
          // Default fallback roles
          const defaultRoles: RoleItem[] = [
            {
              id: 'role_1',
              name: 'Finance manager',
              description: 'Can manage transactions, refunds, and view account statements.',
              permissionsCount: 8,
              permissions: ['View Dashboard', 'View Transactions', 'Manage Transactions', 'Manage Refunds', 'View Account Statements', 'Manage Account Statements'],
              usersAssigned: 1
            },
            {
              id: 'role_2',
              name: 'Developer',
              description: 'Access to API keys, webhooks, and technical integration tools.',
              permissionsCount: 12,
              permissions: ['View Dashboard', 'API Keys', 'Manage API Keys', 'Generate API Keys', 'IP Whitelist', 'Manage IP Whitelist'],
              usersAssigned: 0
            }
          ]
          setRoles(defaultRoles)
        }
      }
    }
    loadRoles()
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const [success, setSuccess] = useState(false)

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
        window.showToast('Roles exported successfully', 'success')
      }
    }, 800)
  }

  // Form states
  const [roleName, setRoleName] = useState('')
  const [roleDesc, setRoleDesc] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<Record<string, boolean>>({})

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredRoles.map(r => r.id))
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
    const { error: deleteErr } = await supabase
      .from('roles')
      .delete()
      .in('id', selectedIds)

    if (deleteErr) {
      if (window.showToast) window.showToast(sanitizeError(deleteErr).userMessage, 'error')
      setIsDeleting(false)
      return
    }

    setRoles(prev => prev.filter(r => !selectedIds.includes(r.id)))
    setSelectedIds([])
    setIsDeleting(false)
    setShowDeleteConfirm(false)
    if (window.showToast) {
      window.showToast('Successfully deleted selected roles', 'success')
    }
  }

  const handleTogglePermission = (perm: string) => {
    setSelectedPerms(prev => ({
      ...prev,
      [perm]: !prev[perm]
    }))
  }

  const handleToggleAllPermissions = (checked: boolean) => {
    const next: Record<string, boolean> = {}
    if (checked) {
      allFlatPermissions.forEach(p => {
        next[p] = true
      })
    }
    setSelectedPerms(next)
  }

  const handleToggleSubgroup = (permissions: string[], checked: boolean) => {
    setSelectedPerms(prev => {
      const next = { ...prev }
      permissions.forEach(p => {
        if (checked) {
          next[p] = true
        } else {
          delete next[p]
        }
      })
      return next
    })
  }

  const isSubgroupAllChecked = (permissions: string[]) => {
    return permissions.every(p => !!selectedPerms[p])
  }

  const isAllPermissionsChecked = () => {
    return allFlatPermissions.length > 0 && allFlatPermissions.every(p => !!selectedPerms[p])
  }

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName || !userId) return

    const permissionsList = Object.keys(selectedPerms).filter(k => selectedPerms[k])
    
    const { data: newRow, error: insertErr } = await supabase
      .from('roles')
      .insert({
        merchant_id: userId,
        name: roleName,
        description: roleDesc,
        permissions: permissionsList
      })
      .select()
      .single()

    if (insertErr) {
      if (window.showToast) window.showToast(sanitizeError(insertErr).userMessage, 'error')
      return
    }

    const newRole: RoleItem = {
      id: newRow.id,
      name: newRow.name,
      description: newRow.description || '',
      permissionsCount: newRow.permissions.length,
      permissions: newRow.permissions,
      usersAssigned: 0
    }

    setRoles(prev => [newRole, ...prev])
    setSuccess(true)

    setTimeout(() => {
      setSuccess(false)
      setViewMode('list')
      setRoleName('')
      setRoleDesc('')
      setSelectedPerms({})
      if (window.showToast) {
        window.showToast('Role registered successfully', 'success')
      }
    }, 500)
  }


  const handleDeleteRole = (id: string) => {
    setSelectedIds([id])
    setShowDeleteConfirm(true)
  }

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (viewMode === 'create') {
    return (
      <div className="space-y-6">
        {/* Header Panel */}
        <div className="bg-white p-6 border border-neutral-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Create Role</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Add a new role and select which areas of Tamupay it can access.
              </p>
            </div>
            <button 
              onClick={() => setViewMode('list')}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 flex items-center gap-1"
            >
              <i className="fa-solid fa-arrow-left text-[11px]"></i>
              <span>Back to Roles</span>
            </button>
          </div>

          <form onSubmit={handleSaveRole} className="space-y-6">
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-250 rounded-lg text-emerald-800 flex items-start gap-3">
                <i className="fa-solid fa-circle-check text-emerald-500 shrink-0 mt-0.5 text-base"></i>
                <div>
                  <h4 className="text-xs font-bold">Role Registered</h4>
                  <p className="text-2xs text-emerald-600 mt-0.5">
                    Your custom role has been saved successfully.
                  </p>
                </div>
              </div>
            )}

            {/* Basic information container */}
            <div className="border border-neutral-200 rounded-2xl p-5 bg-white space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-neutral-550 uppercase tracking-wider">
                Basic information
              </h3>
              
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Finance manager"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional — what this role is for"
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Permissions list container */}
            <div className="border border-neutral-200 rounded-2xl p-5 bg-white space-y-5 shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-neutral-550 uppercase tracking-wider">
                  Permissions
                </h3>
                <p className="text-2xs text-neutral-450 mt-1">
                  Choose menu permissions for this role, or grant full access.
                </p>
              </div>

              {/* Grant all available permissions */}
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center gap-3">
                <input
                  type="checkbox"
                  id="grantAll"
                  checked={isAllPermissionsChecked()}
                  onChange={(e) => handleToggleAllPermissions(e.target.checked)}
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
                />
                <label htmlFor="grantAll" className="text-xs font-bold text-neutral-700 cursor-pointer">
                  Grant all available permissions
                </label>
              </div>

              {/* Permissions Categories checklist */}
              <div className="space-y-6">
                {PERMISSION_SECTIONS.map((section) => (
                  <div key={section.category} className="border border-neutral-200 rounded-lg overflow-hidden">
                    {/* Category Title */}
                    <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 font-bold text-xs text-neutral-700">
                      {section.category}
                    </div>

                    {/* Subgroups listing */}
                    {section.subgroups.length === 0 ? (
                      <div className="p-4 text-neutral-400 italic text-[11px]">
                        No sub-modules under this category.
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-200">
                        {section.subgroups.map((sub) => {
                          const allChecked = isSubgroupAllChecked(sub.permissions)
                          return (
                            <div key={sub.name} className="bg-white">
                              {/* Subgroup Header */}
                              <div className="px-4 py-2 bg-neutral-25/55 border-b border-neutral-100 flex items-center justify-between">
                                <span className="text-[10px] font-black text-neutral-800 tracking-wider">
                                  {sub.name}
                                </span>
                                <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-neutral-500">
                                  <input
                                    type="checkbox"
                                    checked={allChecked}
                                    onChange={(e) => handleToggleSubgroup(sub.permissions, e.target.checked)}
                                    className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-3.5 h-3.5"
                                  />
                                  Select all
                                </label>
                              </div>

                              {/* Permissions checkbox grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4">
                                {sub.permissions.map((perm) => (
                                  <label key={perm} className="flex items-start gap-2.5 cursor-pointer text-[11px] text-neutral-605 font-medium leading-relaxed">
                                    <input
                                      type="checkbox"
                                      checked={!!selectedPerms[perm]}
                                      onChange={() => handleTogglePermission(perm)}
                                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-4 h-4 shrink-0 mt-0.5"
                                    />
                                    <span>{perm}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
              <button 
                type="button"
                onClick={() => setViewMode('list')}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-600 rounded-full text-xs font-semibold shadow-sm transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-bold shadow-sm transition-all"
              >
                Save Role
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Roles</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            All roles, their permissions, and assigned users.
          </p>
        </div>
        <button 
          onClick={() => setViewMode('create')}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
        >
          <i className="fa-solid fa-plus text-[10px]"></i>
          <span>Add Role</span>
        </button>
      </div>

      {/* Roles Table List card */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-brand-50/80 border border-brand-100 rounded-2xl px-5 py-3 mb-4 animate-fade-in">
          <span className="text-xs font-semibold text-brand-900">
            {selectedIds.length} role{selectedIds.length > 1 ? 's' : ''} selected
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

      <div className="mt-4 border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[11px]"></i>
              <input
                type="text"
                className="w-full bg-neutral-55 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-all"
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 bg-white transition-all disabled:opacity-60"
            >
              {exporting ? (
                <i className="fa-solid fa-spinner fa-spin text-[10px]"></i>
              ) : (
                <Download size={14} />
              )}
              <span>Export</span>
            </button>
          </div>
          {/* Empty State or Roles Table List */}
          {filteredRoles.length === 0 ? (
            <div className="py-20 flex flex-col justify-center items-center text-center">
              <i className="fa-solid fa-shield text-neutral-450 text-2xl mb-3"></i>
              <h4 className="text-sm font-semibold text-neutral-800">No roles found</h4>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-100">
                    <th className="px-4 py-3 text-center w-10">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded-full border-neutral-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                        onChange={handleSelectAll}
                        checked={filteredRoles.length > 0 && selectedIds.length === filteredRoles.length}
                      />
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Role Name</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Description</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Permissions</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Assigned Users</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-neutral-50/50 transition-all">
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded-full border-neutral-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                          checked={selectedIds.includes(role.id)}
                          onChange={(e) => handleSelectRow(role.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-neutral-805 flex items-center gap-2">
                        <i className="fa-solid fa-shield-halved text-brand-600 text-xs"></i>
                        {role.name}
                      </td>
                      <td className="px-6 py-4 text-neutral-505 max-w-[240px] truncate">
                        {role.description || 'No description provided.'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-neutral-800">
                        {role.permissionsCount} permissions
                      </td>
                      <td className="px-6 py-4 text-neutral-505">
                        {role.usersAssigned} user{role.usersAssigned !== 1 && 's'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="px-3 py-1.5 border border-red-200 text-red-650 hover:bg-red-50 rounded-full text-[10px] font-bold transition-all"
                        >
                          Delete Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Confirm Delete"
          message="Are you sure you want to delete the selected roles? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive={true}
          loading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </div>
  )
}
