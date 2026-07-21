import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, CheckCircle, Info, X, AlertTriangle } from 'lucide-react'
import { api } from '../../lib/api'
import { isSubscribed } from '../../lib/subscriptions'
import { supabase } from '../../lib/supabase'

interface CollectionService {
  id: string
  key: string
  name: string
  provider: string
  logoClass: string
  logoText: string
  region: string
  currency: string
  status: 'Active' | 'Inactive'
}

export function Collection() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [channel, setChannel] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  
  // Validation state
  const [phoneError, setPhoneError] = useState('')
  const [amountError, setAmountError] = useState('')
  const [channelError, setChannelError] = useState('')
  const [submitError, setSubmitError] = useState('')

  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [kycStatus, setKycStatus] = useState<string | null>(null)

  useEffect(() => {
    async function getKyc() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: merchant } = await supabase
          .from('merchants')
          .select('kyc_status')
          .eq('id', user.id)
          .single()
        if (merchant) {
          setKycStatus(merchant.kyc_status)
        }
      }
    }
    getKyc()
  }, [])

  const activeServices: CollectionService[] = [
    {
      id: 'mtn',
      key: 'collection_mtn',
      name: 'MTN Collection',
      provider: 'MTN',
      logoClass: 'bg-[#ffcc02] text-neutral-900 font-bold border border-amber-200',
      logoText: 'MTN',
      region: 'UG',
      currency: 'UGX',
      status: 'Active'
    },
    {
      id: 'airtel',
      key: 'collection_airtel',
      name: 'Airtel Collection',
      provider: 'Airtel',
      logoClass: 'bg-[#e10000] text-white font-bold',
      logoText: 'Airtel',
      region: 'UG',
      currency: 'UGX',
      status: 'Active'
    },
    {
      id: 'card',
      key: 'card_payments',
      name: 'Card Payments',
      provider: 'Visa/Mastercard',
      logoClass: 'bg-blue-900 text-white font-semibold',
      logoText: 'Visa/MC',
      region: 'UG',
      currency: 'UGX',
      status: 'Active'
    }
  ]

  const handleOpenModal = () => {
    // Check KYC status first
    if (kycStatus !== 'approved') {
      if (window.showToast) {
        window.showToast('Your business KYC must be approved before you can collect payments.', 'warning')
      }
      return
    }
    setIsModalOpen(true)
    setSubmitError('')
    setPhoneError('')
    setAmountError('')
    setChannelError('')
  }

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setPhoneError('')
    setAmountError('')
    setChannelError('')
    setSubmitError('')

    let isValid = true

    if (!channel) {
      setChannelError('Please select a collection channel')
      isValid = false
    }

    // Check subscription for selected channel
    if (channel) {
      const serviceKey = activeServices.find(s => s.name.toLowerCase().includes(channel.toLowerCase().split(' ')[0]))?.key
      if (serviceKey && !isSubscribed(serviceKey)) {
        setChannelError('You need an active subscription to use this service. Please subscribe first.')
        isValid = false
      }
    }

    if (!phone) {
      setPhoneError('Payer phone number or email is required')
      isValid = false
    } else if (channel && channel.includes('UG') && !/^(2567|07|\+2567)\d{8}$/.test(phone.replace(/\s+/g, ''))) {
      setPhoneError('Please enter a valid Ugandan phone number (e.g., +2567XXXXXXXX)')
      isValid = false
    }

    const amtNum = parseFloat(amount)
    if (isNaN(amtNum) || amtNum <= 0) {
      setAmountError('Please enter a valid positive amount')
      isValid = false
    } else if (amtNum < 500) {
      setAmountError('Minimum amount to collect is 500 UGX')
      isValid = false
    }

    if (!isValid) return

    setProcessing(true)

    try {
      const res = await api.initializePayment({
        amount: amtNum,
        payment_method: channel.includes('MTN') ? 'MTN MoMo' : channel.includes('Airtel') ? 'Airtel Money' : 'Visa Card',
        customer_identifier: phone.trim(),
        description: reason.trim() || 'Payment collection request'
      })

      if (res.success) {
        setSuccess(true)
        if (window.showToast) {
          window.showToast('Collection request initialized successfully!', 'success')
        }
        setTimeout(() => {
          setSuccess(false)
          setIsModalOpen(false)
          setPhone('')
          setAmount('')
          setReason('')
          setChannel('')
        }, 2200)
      } else {
        setSubmitError(res.message || 'Failed to initialize collection request.')
      }
    } catch (err: any) {
      setSubmitError(err.userMessage || 'An error occurred while creating the payment request.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Landing View Card */}
      <div className="card bg-white p-6 border border-neutral-200/80 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">Collect Money from your Users</h2>
            <p className="text-xs text-neutral-500 mt-1">Initiate instant collections directly to your merchant wallet.</p>
          </div>
          <button 
            onClick={handleOpenModal}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all flex items-center gap-1"
          >
            <Plus size={14} />
            Collect Now
          </button>
        </div>

        {/* Active collection services list */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Your Active Collection Services</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeServices.map((service) => {
              const subscribed = isSubscribed(service.key)
              return (
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
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          subscribed 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                        }`}>
                          {subscribed ? 'Subscribed' : 'Not Subscribed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
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
              <h3 className="text-sm font-bold text-neutral-800">Collect Money</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCollectionSubmit} className="p-6 space-y-4">
              {success ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                  <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-800">Collection Initiated</h4>
                    <p className="text-2xs text-emerald-600 mt-0.5">
                      Collection request of UGX {parseInt(amount).toLocaleString()} sent successfully.
                    </p>
                  </div>
                </div>
              ) : processing ? (
                <div className="py-8 text-center text-xs text-neutral-500 space-y-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>Initializing payment collection request...</div>
                </div>
              ) : (
                <>
                  {/* Notice Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex gap-2.5 text-xs text-blue-800">
                    <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div>Collection destination: <span className="font-bold">Main Wallet Balance</span></div>
                      <div className="text-[10px] mt-0.5">Funds will be deposited immediately after payer authorizes prompt.</div>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3 bg-red-50 border border-red-150 rounded-xl flex gap-2 text-xs text-red-700">
                      <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Channel selector */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Collection Channel *</label>
                    <select
                      required
                      value={channel}
                      onChange={(e) => {
                        setChannel(e.target.value)
                        setChannelError('')
                      }}
                      className={`w-full px-4.5 py-3 text-xs border ${
                        channelError ? 'border-red-300 bg-red-50/20' : 'border-neutral-200 bg-neutral-50'
                      } rounded-xl text-neutral-900 focus:outline-none focus:border-neutral-350`}
                    >
                      <option value="">Select a provider</option>
                      <option value="Airtel Money UG">Airtel Collection (UG)</option>
                      <option value="MTN MoMo UG">MTN Collection (UG)</option>
                      <option value="Card Payments">Card Payments (UG)</option>
                    </select>
                    {channelError && <p className="text-[10px] text-red-500 mt-1 font-medium">{channelError}</p>}
                  </div>

                  {/* Recipient Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Payer Phone Number / Email *</label>
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
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Amount to Collect (UGX) *</label>
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

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Description / Reference (Optional)</label>
                    <input 
                      type="text"
                      placeholder="Payment details or invoice #"
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
                      Collect Now
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
