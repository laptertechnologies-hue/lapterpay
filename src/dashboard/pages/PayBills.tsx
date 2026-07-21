import { useState, useEffect } from 'react'
import { Info, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PermissionGate } from '../../components/PermissionGate'

export function PayBills() {
  const [selectedBillType, setSelectedBillType] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [merchantName, setMerchantName] = useState('My Business')
  const [merchantAccount, setMerchantAccount] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [kycStatus, setKycStatus] = useState<'pending' | 'submitted' | 'approved' | 'rejected' | null>(null)

  // Form states
  const [customerRef, setCustomerRef] = useState('')
  const [amount, setAmount] = useState('')

  // Validation errors
  const [refError, setRefError] = useState('')
  const [amountError, setAmountError] = useState('')

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

  const handlePayBill = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setRefError('')
    setAmountError('')

    if (!selectedBillType) {
      setErrorMsg('Please select a bill type to pay.')
      return
    }

    let isValid = true

    if (!customerRef.trim()) {
      setRefError('Customer reference / account ID is required')
      isValid = false
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Please enter a valid positive amount')
      isValid = false
    } else if (balance !== null && balance < numAmount) {
      setAmountError('Insufficient wallet balance to pay this bill')
      isValid = false
    }

    if (!isValid || !userId) return

    setLoading(true)

    try {
      // Deduct balance
      const { data: isOk, error: rpcErr } = await supabase.rpc('increment_wallet_balance', {
        p_merchant_id: userId,
        p_environment: 'test',
        p_currency: 'UGX',
        p_amount: -numAmount
      })

      if (rpcErr || !isOk) {
        setErrorMsg(rpcErr?.message || 'Failed to update balance. Please try again.')
        setLoading(false)
        return
      }

      // Insert payout transaction record
      const { error: txErr } = await supabase
        .from('transactions')
        .insert({
          id: 'TXN' + Date.now() + Math.floor(Math.random() * 1000),
          merchant_id: userId,
          type: 'payout',
          amount: numAmount,
          fee: numAmount * 0.03, // 3% transaction fee
          currency: 'UGX',
          payment_method: selectedBillType.toUpperCase(),
          customer_identifier: customerRef.trim(),
          status: 'completed',
          environment: 'test',
          description: `Bill Payment to ${selectedBillType.toUpperCase()} for Ref: ${customerRef.trim()}`
        })

      if (txErr) {
        setErrorMsg(txErr.message || 'Payment completed but transaction log failed.')
        setLoading(false)
        return
      }

      setBalance(prev => (prev !== null ? prev - numAmount : null))
      if (window.showToast) {
        window.showToast(`UGX ${numAmount.toLocaleString()} bill paid successfully for ${selectedBillType.toUpperCase()}`, 'success')
      }
      setSelectedBillType(null)
      setCustomerRef('')
      setAmount('')
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while processing the bill payment.')
    } finally {
      setLoading(false)
    }
  }

  const billers = [
    {
      id: 'dstv',
      name: 'DSTV',
      logo: (
        <svg className="w-16 h-8" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="40" rx="4" fill="#0284c7" />
          <text x="50" y="25" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">DStv</text>
        </svg>
      )
    },
    {
      id: 'gotv',
      name: 'GOTV',
      logo: (
        <svg className="w-16 h-8" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="40" rx="4" fill="#16a34a" />
          <text x="50" y="25" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">GOtv</text>
        </svg>
      )
    },
    {
      id: 'uedcl',
      name: 'UEDCL',
      logo: (
        <svg className="w-16 h-8" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="40" rx="4" fill="#dc2626" />
          <text x="50" y="25" fill="#facc15" fontSize="15" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">UEDCL</text>
        </svg>
      )
    },
    {
      id: 'nwsc',
      name: 'NWSC',
      logo: (
        <svg className="w-16 h-8" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="40" rx="4" fill="#1e3a8a" />
          <text x="50" y="25" fill="#38bdf8" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">NWSC</text>
        </svg>
      )
    }
  ]

  return (
    <div className="card bg-white p-8 border border-neutral-200/80 rounded-2xl shadow-sm space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Bill Payments</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Pay utility bills including electricity (UMEME), water (NWSC), TV subscriptions (DSTV/GOTV), and more.
        </p>
      </div>

      <PermissionGate requires="subscription" serviceKey="bill_payments" kycStatus={kycStatus}>
        {/* Blue info bar */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Info className="text-blue-600 shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-blue-800">
            <div className="font-bold">Business: {merchantName}</div>
            <div className="mt-0.5">A/C: {merchantAccount} | Balance: {balance !== null ? 'UGX ' + balance.toLocaleString() : 'Loading...'}</div>
          </div>
        </div>

        {/* Grid of options */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-800">Select Bill Type</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {billers.map((biller) => (
              <button
                key={biller.id}
                onClick={() => setSelectedBillType(biller.id)}
                className={`border rounded-2xl p-6 flex flex-col items-center justify-center gap-4 bg-white transition-all hover:shadow-sm ${
                  selectedBillType === biller.id
                    ? 'border-blue-600 ring-1 ring-blue-600'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="h-16 flex items-center justify-center">
                  {biller.logo}
                </div>
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">{biller.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bill Details Form */}
        {selectedBillType && (
          <form onSubmit={handlePayBill} className="space-y-4 border-t border-neutral-100 pt-6">
            <h3 className="text-sm font-semibold text-neutral-800">Enter Payment Details for {selectedBillType.toUpperCase()}</h3>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Account Reference / Smart Card Number */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                  {selectedBillType === 'dstv' || selectedBillType === 'gotv' 
                    ? 'Smart Card Number *' 
                    : 'Customer Reference / Meter Number *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1092837465"
                  value={customerRef}
                  onChange={(e) => {
                    setCustomerRef(e.target.value)
                    setRefError('')
                  }}
                  className={`w-full px-4.5 py-3 text-xs border ${
                    refError ? 'border-red-300 bg-red-50/20' : 'border-neutral-200 bg-neutral-50'
                  } rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-350`}
                />
                {refError && <p className="text-[10px] text-red-500 mt-1 font-medium">{refError}</p>}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Amount to Pay (UGX) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
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
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setSelectedBillType(null)}
                className="px-4 py-2 border border-neutral-300 rounded-full text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Go Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#011478] hover:bg-[#1e3a8a] text-white rounded-full text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Pay Bill'}
              </button>
            </div>
          </form>
        )}
      </PermissionGate>
    </div>
  )
}
