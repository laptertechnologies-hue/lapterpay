import { useState, useEffect } from 'react'
import { Info, Smartphone, Wifi, Loader2, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { PermissionGate } from '../../components/PermissionGate'

interface DataBundle {
  id: string
  name: string
  volume: string
  price: number
  validity: string
}

const mtnBundles: DataBundle[] = [
  { id: 'mtn-1', name: 'Mini Daily', volume: '50MB', price: 250, validity: '24 Hours' },
  { id: 'mtn-2', name: 'Super Daily', volume: '1.5GB', price: 2000, validity: '24 Hours' },
  { id: 'mtn-3', name: 'Weekly Giga', volume: '5GB', price: 7500, validity: '7 Days' },
  { id: 'mtn-4', name: 'Monthly Max', volume: '10GB', price: 15000, validity: '30 Days' }
]

const airtelBundles: DataBundle[] = [
  { id: 'art-1', name: 'Daily Basic', volume: '60MB', price: 250, validity: '24 Hours' },
  { id: 'art-2', name: 'Daily Heavy', volume: '2GB', price: 2000, validity: '24 Hours' },
  { id: 'art-3', name: 'Weekly Giga', volume: '6GB', price: 7500, validity: '7 Days' },
  { id: 'art-4', name: 'Monthly Max', volume: '12GB', price: 15000, validity: '30 Days' }
]

export function AirtimeData() {
  const [carrier, setCarrier] = useState<'MTN' | 'Airtel'>('MTN')
  const [serviceType, setServiceType] = useState<'airtime' | 'data'>('airtime')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [balance, setBalance] = useState<number | null>(null)
  const [merchantName, setMerchantName] = useState('My Business')
  const [merchantAccount, setMerchantAccount] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [kycStatus, setKycStatus] = useState<'pending' | 'submitted' | 'approved' | 'rejected' | null>(null)

  // Validation errors
  const [phoneError, setPhoneError] = useState('')
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

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setPhoneError('')
    setAmountError('')

    if (!phoneNumber) {
      setPhoneError('Please enter a target phone number')
      return
    }

    if (!/^(2567|07|\+2567)\d{8}$/.test(phoneNumber.replace(/\s+/g, ''))) {
      setPhoneError('Please enter a valid Ugandan phone number (e.g. +2567XXXXXXXX)')
      return
    }

    if (!userId) return

    let purchaseCost = 0
    let description = ''

    if (serviceType === 'airtime') {
      purchaseCost = parseFloat(amount)
      if (isNaN(purchaseCost) || purchaseCost <= 0) {
        setAmountError('Please enter a valid positive amount')
        return
      } else if (purchaseCost < 500) {
        setAmountError('Minimum airtime purchase amount is 500 UGX')
        return
      }
      description = `${carrier} Airtime purchase to ${phoneNumber}`
    } else {
      const activeBundles = carrier === 'MTN' ? mtnBundles : airtelBundles
      const selectedBundle = activeBundles.find(b => b.id === selectedBundleId)
      if (!selectedBundle) {
        setErrorMsg('Please select a data bundle')
        return
      }
      purchaseCost = selectedBundle.price
      description = `${carrier} Data Bundle (${selectedBundle.volume}) purchase to ${phoneNumber}`
    }

    if (balance !== null && balance < purchaseCost) {
      setErrorMsg('Insufficient balance in your float wallet')
      return
    }

    setLoading(true)

    try {
      // Deduct cost
      const { data: isOk, error: rpcErr } = await supabase.rpc('increment_wallet_balance', {
        p_merchant_id: userId,
        p_environment: 'test',
        p_currency: 'UGX',
        p_amount: -purchaseCost
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
          amount: purchaseCost,
          fee: 0, // airtime and utilities have zero gateway fee
          currency: 'UGX',
          payment_method: carrier === 'MTN' ? 'MTN Airtime' : 'Airtel Airtime',
          customer_identifier: phoneNumber,
          status: 'completed',
          environment: 'test',
          description: description
        })

      if (txErr) {
        setErrorMsg(txErr.message || 'Payment logged but transaction registration failed.')
        setLoading(false)
        return
      }

      setBalance(prev => (prev !== null ? prev - purchaseCost : null))
      
      const successMessage = serviceType === 'airtime' 
        ? `Successfully purchased UGX ${purchaseCost.toLocaleString()} airtime for ${phoneNumber}`
        : `Successfully purchased data bundle for ${phoneNumber}`
      
      if (window.showToast) {
        window.showToast(successMessage, 'success')
      }
      
      // Reset form
      setPhoneNumber('')
      setAmount('')
      setSelectedBundleId(null)
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while buying airtime/data.')
    } finally {
      setLoading(false)
    }
  }

  const bundles = carrier === 'MTN' ? mtnBundles : airtelBundles

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Airtime &amp; Data</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Purchase airtime or data bundles for MTN and Airtel networks instantly.
        </p>
      </div>

      <PermissionGate requires="kyc" kycStatus={kycStatus}>
        {/* Info Bar */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Info className="text-blue-600 shrink-0 mt-0.5" size={16} />
          <div className="text-xs text-blue-800">
            <div className="font-bold">Business: {merchantName}</div>
            <div className="mt-0.5">A/C: {merchantAccount} | Balance: {balance !== null ? 'UGX ' + balance.toLocaleString() : 'Loading...'}</div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1: Select Carrier & Service Type */}
          <div className="md:col-span-1 space-y-6 bg-white p-6 border border-neutral-200/80 rounded-2xl shadow-3xs">
            <div>
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-3">1. Select Network</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCarrier('MTN')
                    setSelectedBundleId(null)
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all hover:shadow-2xs ${
                    carrier === 'MTN'
                      ? 'border-amber-400 bg-amber-50/30 ring-1 ring-amber-400'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <img src="/mtn.jpg" alt="MTN" className="h-10 w-10 rounded-xl object-contain mb-2 shadow-3xs" />
                  <span className="text-xs font-semibold text-neutral-800">MTN Uganda</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCarrier('Airtel')
                    setSelectedBundleId(null)
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all hover:shadow-2xs ${
                    carrier === 'Airtel'
                      ? 'border-red-400 bg-red-50/30 ring-1 ring-red-400'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <img src="/airtel.jpg" alt="Airtel" className="h-10 w-10 rounded-xl object-contain mb-2 shadow-3xs" />
                  <span className="text-xs font-semibold text-neutral-800">Airtel</span>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-3">2. Select Service Type</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setServiceType('airtime')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                    serviceType === 'airtime'
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-350'
                  }`}
                >
                  <Smartphone size={15} />
                  Airtime
                </button>

                <button
                  type="button"
                  onClick={() => setServiceType('data')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                    serviceType === 'data'
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-350'
                  }`}
                >
                  <Wifi size={15} />
                  Data Bundle
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Enter details / select bundle */}
          <div className="md:col-span-2 bg-white p-6 border border-neutral-200/80 rounded-2xl shadow-3xs">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-5">
              3. Enter Purchase Details
            </h3>

            <form onSubmit={handlePurchase} className="space-y-6">
              {/* Phone number target */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Target Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +256771234567"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value)
                    setPhoneError('')
                  }}
                  className={`w-full px-4.5 py-3 text-xs border ${
                    phoneError ? 'border-red-300 bg-red-50/20' : 'border-neutral-200 bg-neutral-50'
                  } rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-350`}
                />
                {phoneError && <p className="text-[10px] text-red-500 mt-1 font-medium">{phoneError}</p>}
              </div>

              {serviceType === 'airtime' ? (
                /* Airtime Amount */
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Airtime Amount (UGX) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
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
              ) : (
                /* Data Bundle List */
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-neutral-600">Select Data Bundle *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bundles.map((bundle) => (
                      <div
                        key={bundle.id}
                        onClick={() => setSelectedBundleId(bundle.id)}
                        className={`border rounded-2xl p-4 cursor-pointer relative transition-all ${
                          selectedBundleId === bundle.id
                            ? 'border-blue-600 bg-blue-50/10'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <p className="text-xs font-bold text-neutral-800">{bundle.name}</p>
                        <p className="text-2xs text-neutral-400 mt-0.5">{bundle.volume} · {bundle.validity}</p>
                        <p className="text-xs font-extrabold text-blue-600 mt-2">UGX {bundle.price.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit purchase */}
              <div className="border-t border-neutral-100 pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#011478] hover:bg-[#1e3a8a] text-white rounded-full text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Processing Purchase...
                    </>
                  ) : (
                    'Buy Airtime / Bundle'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </PermissionGate>
    </div>
  )
}
export default AirtimeData
