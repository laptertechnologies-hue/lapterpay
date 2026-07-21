import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Info, X, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'
import { PermissionGate } from '../../components/PermissionGate'

interface DisbursementCard {
  id: string
  name: string
  provider: string
  logoClass: string
  logoText: string
  region: string
  currency: string
  status: 'Active' | 'Inactive'
}

function getDisbursementCards(curr: string): DisbursementCard[] {
  if (curr === 'KES') {
    return [
      {
        id: 'mpesa',
        name: 'M-Pesa Disbursement',
        provider: 'M-Pesa',
        logoClass: 'bg-[#4caf50] text-white font-bold',
        logoText: 'M-Pesa',
        region: 'KE',
        currency: 'KES',
        status: 'Active'
      },
      {
        id: 'airtel_ke',
        name: 'Airtel Money Kenya',
        provider: 'Airtel',
        logoClass: 'bg-[#e10000] text-white',
        logoText: 'Airtel',
        region: 'KE',
        currency: 'KES',
        status: 'Active'
      },
      {
        id: 'equitel',
        name: 'Equitel Payout',
        provider: 'Equitel',
        logoClass: 'bg-blue-600 text-white font-semibold',
        logoText: 'Equitel',
        region: 'KE',
        currency: 'KES',
        status: 'Active'
      }
    ]
  } else if (curr === 'TZS') {
    return [
      {
        id: 'mpesa_tz',
        name: 'M-Pesa Tanzania',
        provider: 'Vodacom',
        logoClass: 'bg-[#e10000] text-white',
        logoText: 'M-Pesa',
        region: 'TZ',
        currency: 'TZS',
        status: 'Active'
      },
      {
        id: 'tigo_tz',
        name: 'Tigo Pesa Payout',
        provider: 'Tigo',
        logoClass: 'bg-blue-800 text-white font-bold',
        logoText: 'Tigo',
        region: 'TZ',
        currency: 'TZS',
        status: 'Active'
      }
    ]
  } else if (curr === 'RWF') {
    return [
      {
        id: 'mtn_rw',
        name: 'MTN MoMo Rwanda',
        provider: 'MTN',
        logoClass: 'bg-[#ffcc02] text-neutral-900 font-bold',
        logoText: 'MTN',
        region: 'RW',
        currency: 'RWF',
        status: 'Active'
      }
    ]
  }
  
  // Default Uganda (UGX)
  return [
    {
      id: 'airtel',
      name: 'Airtel Disbursement',
      provider: 'Airtel',
      logoClass: 'bg-[#e10000] text-white',
      logoText: 'Airtel',
      region: 'UG',
      currency: 'UGX',
      status: 'Active'
    },
    {
      id: 'mtn',
      name: 'MTN Disbursement',
      provider: 'MTN',
      logoClass: 'bg-[#ffcc02] text-neutral-900 font-bold',
      logoText: 'MTN',
      region: 'UG',
      currency: 'UGX',
      status: 'Active'
    }
  ]
}

export function SendMoney() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [provider, setProvider] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [currency, setCurrency] = useState(localStorage.getItem('user_currency') || 'UGX')
  const [activeServices, setActiveServices] = useState<DisbursementCard[]>(getDisbursementCards(currency))
  const [kycStatus, setKycStatus] = useState<'pending' | 'submitted' | 'approved' | 'rejected' | null>(null)

  // Validation errors
  const [phoneError, setPhoneError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [providerError, setProviderError] = useState('')

  const loadBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      
      const { data: merchant } = await supabase
        .from('merchants')
        .select('kyc_status')
        .eq('id', user.id)
        .single()
      if (merchant) {
        setKycStatus(merchant.kyc_status as any)
      }

      const activeCurr = localStorage.getItem('user_currency') || 'UGX'
      const { data } = await supabase
        .from('wallets')
        .select('balance')
        .eq('merchant_id', user.id)
        .eq('environment', 'test')
        .eq('currency', activeCurr)
        .maybeSingle()
      if (data) {
        setBalance(Number(data.balance))
      } else {
        setBalance(0)
      }
    }
  }

  useEffect(() => {
    loadBalance()

    const handleCurrencyChange = () => {
      const activeCurr = localStorage.getItem('user_currency') || 'UGX'
      setCurrency(activeCurr)
      setActiveServices(getDisbursementCards(activeCurr))
      loadBalance()
    }
    window.addEventListener('currency_changed', handleCurrencyChange)
    return () => {
      window.removeEventListener('currency_changed', handleCurrencyChange)
    }
  }, [])

  const handleOpenModal = () => {
    if (kycStatus !== 'approved') {
      if (window.showToast) {
        window.showToast('KYC approval is required before you can perform disbursements.', 'warning')
      }
      return
    }
    setIsModalOpen(true)
    setErrorMsg('')
    setPhoneError('')
    setAmountError('')
    setProviderError('')
  }

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setPhoneError('')
    setAmountError('')
    setProviderError('')

    let isValid = true

    if (!provider) {
      setProviderError('Please select a disbursement carrier')
      isValid = false
    }

    if (!phone) {
      setPhoneError('Destination phone number is required')
      isValid = false
    } else if (currency === 'UGX' && !/^(2567|07|\+2567)\d{8}$/.test(phone.replace(/\s+/g, ''))) {
      setPhoneError('Please enter a valid Ugandan phone number (e.g. +2567XXXXXXXX)')
      isValid = false
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError('Please enter a valid positive amount')
      isValid = false
    } else if (balance !== null && balance < numAmount) {
      setAmountError('Insufficient balance in your float wallet')
      isValid = false
    }

    if (!isValid || !userId) return

    setProcessing(true)

    try {
      const res = await api.initializePayout({
        amount: numAmount,
        payment_method: provider.includes('MTN') ? 'MTN MoMo Payout' : 'Airtel Money Payout',
        customer_identifier: phone.trim(),
        description: reason.trim() || 'Business disbursement payout'
      })

      if (res.success) {
        setBalance(prev => (prev !== null ? prev - numAmount : null))
        setSuccess(true)
        if (window.showToast) {
          window.showToast('Disbursement initialized successfully!', 'success')
        }
        setTimeout(() => {
          setSuccess(false)
          setIsModalOpen(false)
          setPhone('')
          setAmount('')
          setReason('')
          setProvider('')
        }, 2200)
      } else {
        setErrorMsg(res.message || 'Payout request failed.')
      }
    } catch (err: any) {
      setErrorMsg(err.userMessage || 'An error occurred while creating the disbursement.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      <PermissionGate requires="kyc" kycStatus={kycStatus}>
      {/* Landing View Card */}
      <div className="card bg-white p-6 border border-neutral-200/80 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Send Money / Payouts</h2>
            <p className="text-xs text-neutral-500 mt-1">Disburse payments directly to client mobile money wallets.</p>
          </div>
          <button 
            onClick={handleOpenModal}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Send Money Now</span>
          </button>
        </div>

        {/* Active services list */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Available Payout Channels ({currency})</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeServices.map((service) => (
              <div 
                key={service.id}
                className="border border-neutral-200/80 rounded-lg p-5 flex items-start gap-4 bg-white hover:shadow-2xs transition-all relative overflow-hidden"
              >
                {service.id === 'mtn' || service.id === 'airtel' ? (
                  <img 
                    src={service.id === 'mtn' ? '/mtn.jpg' : '/airtel.jpg'} 
                    alt={service.logoText} 
                    className="h-8 object-contain shrink-0"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm px-1 text-center ${service.logoClass}`}>
                    {service.logoText}
                  </div>
                )}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-neutral-800">{service.name}</h4>
                  <div className="text-[10px] text-neutral-450 font-semibold">{service.provider} • {service.region}</div>
                  <div className="text-[10px] text-neutral-500 pt-1">
                    <div>Currency: {service.currency}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span>Status:</span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded text-[9px] font-bold">
                        {service.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Footer Box */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-neutral-100 pt-6 mt-8">
          <h4 className="text-xs font-bold text-neutral-700">Quick Actions</h4>
          <div className="flex justify-end w-full md:w-auto">
            <Link 
              to="/dashboard/transactions"
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all"
            >
              <i className="fa-solid fa-list-check text-[10px]"></i>
              View All Transactions
            </Link>
          </div>
        </div>
      </div>

      {/* Collect Money Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800">Send Money / Payout</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendSubmit} className="p-6 space-y-4">
              {success ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                  <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-800">Disbursement Initiated</h4>
                    <p className="text-2xs text-emerald-600 mt-0.5">
                      Payout of {currency} {parseInt(amount).toLocaleString()} initiated successfully.
                    </p>
                  </div>
                </div>
              ) : processing ? (
                <div className="py-8 text-center text-xs text-neutral-500 space-y-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>Processing disbursement payout...</div>
                </div>
              ) : (
                <>
                  {/* Notice Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex gap-2.5 text-xs text-blue-800">
                    <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div>Source account: <span className="font-bold">Main Float Wallet</span></div>
                      <div className="text-[10px] mt-0.5">Current Balance: {currency} {balance !== null ? balance.toLocaleString() : 'Loading...'}</div>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-150 rounded-xl flex gap-2 text-xs text-red-700">
                      <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Channel selector */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Payout Provider *</label>
                    <select
                      required
                      value={provider}
                      onChange={(e) => {
                        setProvider(e.target.value)
                        setProviderError('')
                      }}
                      className={`w-full px-4.5 py-3 text-xs border ${
                        providerError ? 'border-red-300 bg-red-50/20' : 'border-neutral-200 bg-neutral-50'
                      } rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-350`}
                    >
                      <option value="">Select a provider</option>
                      {activeServices.map(s => (
                        <option key={s.id} value={s.name}>{s.name} ({s.currency})</option>
                      ))}
                    </select>
                    {providerError && <p className="text-[10px] text-red-500 mt-1 font-medium">{providerError}</p>}
                  </div>

                  {/* Recipient Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Recipient Wallet Phone Number *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. +256771234567"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value)
                        setPhoneError('')
                      }}
                      className={`w-full px-4.5 py-3 text-xs border ${
                        phoneError ? 'border-red-300 bg-red-50/20' : 'border-neutral-200 bg-neutral-50'
                      } rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-350`}
                    />
                    {phoneError && <p className="text-[10px] text-red-500 mt-1 font-medium">{phoneError}</p>}
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Amount to Payout ({currency}) *</label>
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

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Reference / Description (Optional)</label>
                    <input 
                      type="text"
                      placeholder="Disbursement purpose or internal ID"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-4.5 py-3 text-xs border border-neutral-200 bg-neutral-50 rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-350"
                    />
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-neutral-300 rounded-full text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-colors"
                    >
                      Process Payout
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
      </PermissionGate>
    </div>
  )
}
