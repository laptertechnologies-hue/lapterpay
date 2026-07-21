import { useState, useEffect } from 'react'
import { Info, CheckCircle2, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { PermissionGate } from '../../components/PermissionGate'

export function WalletTransfer() {
  const [selectedWallet, setSelectedWallet] = useState<'main' | 'card'>('main')
  const [searchTarget, setSearchTarget] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [password, setPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [merchantName, setMerchantName] = useState('My Business')
  const [merchantAccount, setMerchantAccount] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [kycStatus, setKycStatus] = useState<'pending' | 'submitted' | 'approved' | 'rejected' | null>(null)

  // Validation states
  const [targetError, setTargetError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    async function loadMerchantAndBalance() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        // Fetch merchant profile
        const { data: merchant } = await supabase
          .from('merchants')
          .select('business_name, kyc_status')
          .eq('id', user.id)
          .single()
        if (merchant) {
          setMerchantName(merchant.business_name)
          setKycStatus(merchant.kyc_status as any)
        }
        
        // Generate/get account number
        const savedAcc = localStorage.getItem('merchant_account_number') || '261775810270'
        setMerchantAccount(savedAcc)

        // Fetch wallet balance
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('merchant_id', user.id)
          .eq('environment', 'test')
          .single()
        if (wallet) {
          setBalance(Number(wallet.balance))
        }
      }
    }
    loadMerchantAndBalance()
  }, [])

  const handleProcessTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setTargetError('')
    setAmountError('')
    setPasswordError('')

    let isValid = true

    if (!searchTarget.trim()) {
      setTargetError('Destination business account number is required')
      isValid = false
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Please enter a valid positive amount')
      isValid = false
    } else if (balance !== null && balance < numAmount) {
      setAmountError('Insufficient balance to perform this transfer')
      isValid = false
    }

    if (!password) {
      setPasswordError('Please enter your account password to authorize transfer')
      isValid = false
    }

    if (!isValid || !userId) return

    setLoading(true)

    try {
      // 1. Verify password before transfer
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('User email not found')

      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      })

      if (authErr) {
        setPasswordError('Invalid authorization password')
        setLoading(false)
        return
      }

      // 2. Process the transfer through the real, atomic backend endpoint.
      // The server resolves the destination account number to a merchant
      // (using its service-role client, since RLS blocks merchants from
      // reading each other's rows directly) and debits the source AND
      // credits the destination wallet in one operation, with rollback on
      // partial failure — doing this via a direct client-side RPC would
      // only ever debit one side and silently destroy the funds.
      const result = await api.walletTransfer({
        amount: numAmount,
        destination_account_number: searchTarget.trim(),
        description: description || undefined
      })

      if (!result.success) {
        setErrorMsg(result.message || 'Failed to process transfer. Please try again.')
        setLoading(false)
        return
      }

      const newBalance = (result.data as { new_balance?: number } | undefined)?.new_balance
      setBalance(prev => (typeof newBalance === 'number' ? newBalance : prev !== null ? prev - numAmount : null))
      setSuccess(true)
      if (window.showToast) {
        window.showToast('Wallet transfer completed successfully!', 'success')
      }
      setTimeout(() => {
        setSuccess(false)
        setSearchTarget('')
        setAmount('')
        setDescription('')
        setPassword('')
      }, 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during transfer authorization.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card bg-white p-8 border border-neutral-200/80 rounded-2xl shadow-sm max-w-4xl mx-auto space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Transfer Funds to Another Business</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Search for a business by name or account number, enter the transfer amount, and process the transaction. Funds will be transferred from your account to the recipient business.
        </p>
      </div>

      <PermissionGate requires="subscription" serviceKey="wallet_transfer" kycStatus={kycStatus}>
        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <Info className="text-emerald-500 shrink-0 mt-0.5" size={16} />
            <div>
              <h4 className="text-xs font-semibold text-emerald-800">Transfer Completed</h4>
              <p className="text-2xs text-emerald-600 mt-0.5">
                Your wallet transfer of UGX {parseInt(amount).toLocaleString()} has been processed successfully.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProcessTransfer} className="space-y-6">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* From Business Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
              <Info className="text-blue-600 shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-blue-800">
                <div className="font-bold">From: {merchantName}</div>
                <div className="mt-0.5">A/C: {merchantAccount}</div>
              </div>
            </div>

            {/* Wallet Selector Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main Wallet */}
              <div 
                onClick={() => setSelectedWallet('main')}
                className={`border rounded-2xl p-4 cursor-pointer relative transition-all ${
                  selectedWallet === 'main' 
                    ? 'border-blue-600 ring-1 ring-blue-600' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Main Wallet</div>
                <div className="text-lg font-bold text-neutral-800 mt-1">{balance !== null ? 'UGX ' + balance.toLocaleString() : 'Loading...'}</div>
                {selectedWallet === 'main' && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600">
                    <CheckCircle2 size={20} fill="#2563eb" className="text-white" />
                  </div>
                )}
              </div>

              {/* Card Wallet */}
              <div 
                onClick={() => setSelectedWallet('card')}
                className={`border rounded-2xl p-4 cursor-pointer relative transition-all ${
                  selectedWallet === 'card' 
                    ? 'border-blue-600 ring-1 ring-blue-600' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Card Settlement Wallet</div>
                <div className="text-lg font-bold text-neutral-800 mt-1">UGX 0</div>
                {selectedWallet === 'card' && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600">
                    <CheckCircle2 size={20} fill="#2563eb" className="text-white" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Recipient Account Number */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Destination Business Account Number *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. 261775810270"
                  value={searchTarget}
                  onChange={(e) => {
                    setSearchTarget(e.target.value)
                    setTargetError('')
                  }}
                  className={`w-full px-4.5 py-3 text-xs border ${
                    targetError ? 'border-red-300 bg-red-50/20' : 'border-neutral-200 bg-neutral-50'
                  } rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-350`}
                />
                {targetError && <p className="text-[10px] text-red-500 mt-1 font-medium">{targetError}</p>}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Amount to Transfer (UGX) *</label>
                <input 
                  type="number"
                  required
                  placeholder="e.g. 10000"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setAmountError('')
                  }}
                  className={`w-full px-4.5 py-3 text-xs border ${
                    amountError ? 'border-red-300 bg-red-50/20' : 'border-neutral-200 bg-neutral-50'
                  } rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-350`}
                />
                {amountError && <p className="text-[10px] text-red-500 mt-1 font-medium">{amountError}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Description *</label>
                <input 
                  type="text"
                  required
                  placeholder="Reason for transfer, vendor payment, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4.5 py-3 text-xs border border-neutral-200 bg-neutral-50 rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-350"
                />
              </div>

              {/* Password Verification */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Verify Your Password *</label>
                <input 
                  type="password"
                  required
                  placeholder="Enter password to authorize transaction"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError('')
                  }}
                  className={`w-full px-4.5 py-3 text-xs border ${
                    passwordError ? 'border-red-300 bg-red-50/20' : 'border-neutral-200 bg-neutral-50'
                  } rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-350`}
                />
                {passwordError && <p className="text-[10px] text-red-500 mt-1 font-medium">{passwordError}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
              <button 
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#011478] hover:bg-[#1e3a8a] text-white rounded-full text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? 'Authorizing...' : 'Authorize & Transfer'}
              </button>
            </div>
          </form>
        )}
      </PermissionGate>
    </div>
  )
}
