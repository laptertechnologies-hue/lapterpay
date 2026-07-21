import { useState, useEffect } from 'react'
import { Plus, Search, Landmark, MapPin, Calendar, ChevronLeft, ChevronRight, X, Check, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sanitizeError } from '../../lib/errors'
import { ConfirmDialog } from '../../components/ConfirmDialog'

interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountName: string
  currency: string
  status: string
}

interface SupportedBank {
  name: string
  group: string
  badge: 'Commercial' | 'Development'
  est: string
  desc: string
}

const supportedBanksList: SupportedBank[] = [
  {
    name: 'Absa Bank Uganda Limited',
    group: 'Absa Group',
    badge: 'Commercial',
    est: 'Est. 2020',
    desc: 'Part of Absa Group, providing comprehensive banking services across Uganda.'
  },
  {
    name: 'Bank of Africa Limited',
    group: 'Bank of Africa Group',
    badge: 'Commercial',
    est: 'Est. 2007',
    desc: 'Part of Bank of Africa Group, offering retail and corporate banking services.'
  },
  {
    name: 'Bank of Baroda Uganda Limited',
    group: 'Bank of Baroda Group',
    badge: 'Commercial',
    est: 'Est. 2007',
    desc: 'Part of Bank of Baroda Group, providing international banking services.'
  },
  {
    name: 'Bank of India (Uganda) Limited',
    group: 'Bank of India Group',
    badge: 'Commercial',
    est: 'Est. 2012',
    desc: 'Part of Bank of India Group, specializing in trade finance and remittances.'
  },
  {
    name: 'Cairo Bank Uganda Limited',
    group: 'Banque du Caire Group',
    badge: 'Commercial',
    est: 'Est. 1995',
    desc: 'Part of Banque du Caire Group, offering Islamic and conventional banking.'
  },
  {
    name: 'Centenary Rural Development Bank Limited',
    group: 'Centenary Group',
    badge: 'Development',
    est: 'Est. 1983',
    desc: 'Part of the Centenary Group, focusing on rural development and microfinance.'
  },
  {
    name: 'Citibank Uganda Limited',
    group: 'Citigroup',
    badge: 'Commercial',
    est: 'Est. 1999',
    desc: 'Part of Citigroup, providing corporate and investment banking services.'
  },
  {
    name: 'DFCU Bank Limited',
    group: 'Independent',
    badge: 'Commercial',
    est: 'Est. 1984',
    desc: 'Independent commercial bank with strong local presence and international partnerships.'
  },
  {
    name: 'Diamond Trust Bank Uganda Limited',
    group: 'Diamond Trust Bank Group',
    badge: 'Commercial',
    est: 'Est. 2007',
    desc: 'Part of Diamond Trust Bank Group, offering retail and SME banking services.'
  },
  {
    name: 'Ecobank Uganda Limited',
    group: 'Ecobank Group',
    badge: 'Commercial',
    est: 'Est. 2008',
    desc: 'Part of Ecobank Group, providing pan-African banking services.'
  },
  {
    name: 'Equity Bank Uganda Limited',
    group: 'Equity Group',
    badge: 'Commercial',
    est: 'Est. 2008',
    desc: 'Part of Equity Group, focusing on financial inclusion and digital banking.'
  },
  {
    name: 'Exim Bank Uganda Limited',
    group: 'Exim Bank Group',
    badge: 'Commercial',
    est: 'Est. 2011',
    desc: 'Part of Exim Bank Group based in Tanzania, offering trade finance services.'
  }
]

export function BankDetails() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState<1 | 2>(1)
  
  // Add Account form states
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [currency, setCurrency] = useState('UGX')
  const [success, setSuccess] = useState(false)

  // Confirm delete states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    async function loadBankDetails() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('bank_details')
          .select('*')
          .eq('merchant_id', user.id)

        if (error) throw error
        if (data) {
          const formatted = data.map(item => ({
            id: item.id,
            bankName: item.bank_name,
            accountNumber: item.account_number,
            accountName: item.account_name,
            currency: 'UGX',
            status: 'Active'
          }))
          setBankAccounts(formatted)
        }
      } catch (err) {
        console.error('Failed to load bank details:', err)
      } finally {
        setLoading(false)
      }
    }
    loadBankDetails()
  }, [])

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bankName || !accountNumber || !accountName) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: newRow, error } = await supabase
        .from('bank_details')
        .insert({
          merchant_id: user.id,
          bank_name: bankName,
          account_name: accountName,
          account_number: accountNumber
        })
        .select()
        .single()

      if (error) throw error

      const newAcc: BankAccount = {
        id: newRow.id,
        bankName: newRow.bank_name,
        accountNumber: newRow.account_number,
        accountName: newRow.account_name,
        currency: 'UGX',
        status: 'Active'
      }

      setBankAccounts([...bankAccounts, newAcc])
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setShowAddModal(false)
        setBankName('')
        setAccountNumber('')
        setAccountName('')
        if (window.showToast) {
          window.showToast('Bank details added successfully', 'success')
        }
      }, 1500)
    } catch (err: any) {
      if (window.showToast) {
        window.showToast(sanitizeError(err).userMessage, 'error')
      } else {
        alert(sanitizeError(err).userMessage)
      }
    }
  }

  const handleDeleteTrigger = (id: string) => {
    setDeleteId(id)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      const { error } = await supabase
        .from('bank_details')
        .delete()
        .eq('id', deleteId)

      if (error) throw error

      setBankAccounts(prev => prev.filter(acc => acc.id !== deleteId))
      setShowDeleteConfirm(false)
      setDeleteId(null)
      if (window.showToast) {
        window.showToast('Bank details removed successfully', 'success')
      }
    } catch (err: any) {
      if (window.showToast) {
        window.showToast(sanitizeError(err).userMessage, 'error')
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredBanks = supportedBanksList.filter(bank => 
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bank.desc.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* 1. Main Bank Details Card */}
      <div className="card bg-white p-6 border border-neutral-200/80 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Bank Details</h2>
            <p className="text-xs text-neutral-505 mt-1">Manage your bank account details for settlements and withdrawals.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            Add Bank Details
          </button>
        </div>

        {/* Dynamic content */}
        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-400">Loading bank details...</div>
        ) : bankAccounts.length === 0 ? (
          <div className="py-12 flex flex-col justify-center items-center text-center">
            <Landmark size={28} className="text-neutral-400 mb-3" />
            <h3 className="text-sm font-bold text-neutral-700">No Bank Details Added</h3>
            <p className="text-xs text-neutral-400 mt-1 mb-6 max-w-sm">
              Add your bank account details to enable settlements and withdrawals.
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              Add Bank Details
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((acc) => (
              <div key={acc.id} className="border border-neutral-200 rounded-lg p-5 flex justify-between items-start gap-4 bg-neutral-25/45">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0 border border-blue-100 shadow-3xs">
                    <Landmark size={18} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-neutral-805">{acc.bankName}</h4>
                    <div className="text-[10px] text-neutral-400 font-semibold font-mono">A/C: {acc.accountNumber}</div>
                    <div className="text-[10px] text-neutral-500 font-medium pt-1">
                      <div>Holder: {acc.accountName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span>Currency:</span>
                        <span className="font-bold text-neutral-700">{acc.currency}</span>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-bold">
                          {acc.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteTrigger(acc.id)}
                  className="text-red-500 hover:text-red-700 p-1.5 transition cursor-pointer"
                  title="Remove Account"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Supported Banks Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-800 tracking-tight">Supported Banks in Uganda</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Browse through supported banks and financial institutions in Uganda.</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input
            type="text"
            className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="Search banks by name, group, type, or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>

        {/* Supported Banks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanks.slice((currentPage - 1) * 6, currentPage * 6).map((bank, i) => (
            <div key={i} className="card bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3">
                  <h4 className="text-xs font-bold text-neutral-800 tracking-wide truncate max-w-[170px]">{bank.name}</h4>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${
                    bank.badge === 'Commercial' 
                      ? 'bg-blue-50 text-blue-800 border-blue-100' 
                      : 'bg-emerald-50 text-emerald-805 border-emerald-100'
                  }`}>
                    {bank.badge}
                  </span>
                </div>

                <p className="text-[10px] text-neutral-400 font-semibold">{bank.group}</p>

                <div className="flex flex-wrap items-center gap-4 text-[10px] text-neutral-400 py-3">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>Kampala</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{bank.est}</span>
                  </div>
                </div>

                <p className="text-[10px] text-neutral-500 leading-relaxed font-normal min-h-[36px]">{bank.desc}</p>
              </div>

              <div className="border-t border-neutral-100 pt-3 mt-4 flex items-center justify-between">
                <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1" onClick={(e) => { e.preventDefault(); alert(`Viewing details for ${bank.name}`); }}>
                  View Details
                  <ChevronRight size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Pagination */}
        <div className="card bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] text-neutral-505">
            Showing {(currentPage - 1) * 6 + 1} to {Math.min(currentPage * 6, filteredBanks.length)} of {filteredBanks.length} results
          </div>

          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className={`p-1.5 border border-neutral-200 rounded text-xs transition-all cursor-pointer ${
                currentPage === 1 
                  ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed border-neutral-200/65' 
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <ChevronLeft size={14} />
            </button>

            <button 
              onClick={() => setCurrentPage(1)}
              className={`w-7 h-7 rounded text-xs font-semibold transition-all border cursor-pointer ${
                currentPage === 1 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              1
            </button>
            
            <button 
              onClick={() => setCurrentPage(2)}
              className={`w-7 h-7 rounded text-xs font-semibold transition-all border cursor-pointer ${
                currentPage === 2 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              2
            </button>

            <button 
              disabled={currentPage === 2}
              onClick={() => setCurrentPage(2)}
              className={`p-1.5 border border-neutral-200 rounded text-xs transition-all cursor-pointer ${
                currentPage === 2 
                  ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed border-neutral-200/65' 
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Bank Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-neutral-100">
            <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800">Add Bank Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4 text-xs">
              {success ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                  <Check className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-800">Account Saved</h4>
                    <p className="text-2xs text-emerald-600 mt-0.5">Bank account has been added successfully.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="label block font-semibold text-neutral-600 mb-1.5 font-bold">Bank Name *</label>
                    <select 
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="input"
                    >
                      <option value="">Select bank</option>
                      {supportedBanksList.map((b, idx) => (
                        <option key={idx} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label block font-semibold text-neutral-600 mb-1.5 font-bold">Account Number *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter account number" 
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label block font-semibold text-neutral-600 mb-1.5 font-bold">Account Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Account holder name" 
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label block font-semibold text-neutral-600 mb-1.5 font-bold">Currency *</label>
                    <select 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="input bg-white cursor-pointer"
                    >
                      <option value="UGX">UGX</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                    <button 
                      type="button" 
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-neutral-300 rounded-full text-xs font-semibold text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm cursor-pointer"
                    >
                      Save Account
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Remove Bank Account"
        message="Are you sure you want to remove these bank details? This action cannot be undone."
        confirmText="Remove Account"
        cancelText="Keep Account"
        isDestructive={true}
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
export default BankDetails
