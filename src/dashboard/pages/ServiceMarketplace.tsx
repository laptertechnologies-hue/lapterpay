import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { getSubscriptions, setSubscribed } from '../../lib/subscriptions'

interface ServiceItem {
  id: string
  key: string
  name: string
  provider: string
  type: string
  region: string
  price: string
  subscribed: boolean
}

const initialServices = [
  { id: '1', key: 'collection_mtn', name: 'MTN Collection', provider: 'MTN Collection', type: 'collection', region: 'UG', price: 'Free' },
  { id: '2', key: 'collection_airtel', name: 'Airtel Collection', provider: 'This is an airtel collection', type: 'collection', region: 'UG', price: 'Free' },
  { id: '3', key: 'disbursement_mtn', name: 'MTN Disbursement', provider: 'Send money to the last mile', type: 'disbursement', region: 'UG', price: 'Free' },
  { id: '4', key: 'disbursement_airtel', name: 'Airtel Disbursement', provider: 'Send money to the last mile using airtel', type: 'disbursement', region: 'UG', price: 'Free' },
  { id: '5', key: 'disbursement_bank', name: 'Bank Transfer Service', provider: 'Bank transfer disbursement service for sending money to bank accounts', type: 'disbursement', region: 'UG', price: 'Free' },
  { id: '6', key: 'float_mgmt', name: 'Float Management Service', provider: 'Service for managing float uploads to business accounts', type: 'collection', region: 'UG', price: 'Free' },
  { id: '7', key: 'phone_verification', name: 'Phone Number Verification', provider: 'Verify phone numbers and retrieve associated user information for Uganda mobile numbers', type: 'verification', region: 'UG', price: 'Free' },
  { id: '8', key: 'sms_service', name: 'SMS Service', provider: 'Message Service enables sending SMS text messages to phone numbers. Supports transactional and promotional messaging for business communications.', type: 'message', region: 'UG', price: '30/= per SMS' },
  { id: '9', key: 'wallet_transfer', name: 'Internal Wallet Transfer', provider: 'Internal wallet transfer service for transferring funds between business wallets', type: 'disbursement', region: 'UG', price: 'Free' },
  { id: '10', key: 'bill_payments', name: 'Bill Payments', provider: 'Pay for Light, NWSC, TV, and so much more, fast, secure and all in one platform', type: 'disbursement', region: 'UG', price: 'Free' },
  { id: '11', key: 'card_payments', name: 'Card Payments', provider: 'Get paid through visa and Mastercard', type: 'collection', region: 'UG', price: 'Free' },
  { id: '12', key: 'merchant_customization', name: 'Merchant Customization', provider: 'Personalize your Tamupay code with a one time fee', type: 'customization', region: 'GLOBAL', price: '50,000/=' }
]

export function ServiceMarketplace() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState<1 | 2>(1)
  const [loadingSub, setLoadingSub] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const subs = getSubscriptions()
    setServices(
      initialServices.map(s => ({
        ...s,
        subscribed: !!subs[s.key]
      }))
    )
  }, [])

  const handleSubscribe = (id: string) => {
    const service = services.find(s => s.id === id)
    if (!service) return
    setLoadingSub(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setSubscribed(service.key, true)
      setServices(prev => prev.map(s => s.id === id ? { ...s, subscribed: true } : s))
      setLoadingSub(prev => ({ ...prev, [id]: false }))
      if (window.showToast) {
        window.showToast(`Successfully subscribed to ${service.name}`, 'success')
      }
    }, 500)
  }

  const handleUnsubscribe = (id: string) => {
    const service = services.find(s => s.id === id)
    if (!service) return
    setLoadingSub(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setSubscribed(service.key, false)
      setServices(prev => prev.map(s => s.id === id ? { ...s, subscribed: false } : s))
      setLoadingSub(prev => ({ ...prev, [id]: false }))
      if (window.showToast) {
        window.showToast(`Successfully unsubscribed from ${service.name}`, 'success')
      }
    }, 500)
  }

  // Filter Logic
  const filtered = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.provider.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'All' || s.type === typeFilter.toLowerCase()
    const matchesProvider = providerFilter === 'All' || 
                            (providerFilter === 'MTN' && s.name.includes('MTN')) ||
                            (providerFilter === 'Airtel' && s.name.includes('Airtel')) ||
                            (providerFilter === 'Bank' && s.name.includes('Bank'))
    return matchesSearch && matchesType && matchesProvider
  })

  const getServiceIcon = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('mtn')) return 'fa-solid fa-mobile-screen text-amber-500'
    if (n.includes('airtel')) return 'fa-solid fa-mobile-screen-button text-red-500'
    if (n.includes('bank')) return 'fa-solid fa-building-columns text-blue-500'
    if (n.includes('float')) return 'fa-solid fa-scale-balanced text-indigo-500'
    if (n.includes('phone')) return 'fa-solid fa-user-check text-purple-500'
    if (n.includes('sms')) return 'fa-solid fa-comment-sms text-sky-500'
    if (n.includes('wallet')) return 'fa-solid fa-arrows-left-right text-indigo-500'
    if (n.includes('bill')) return 'fa-solid fa-file-invoice text-rose-500'
    if (n.includes('card')) return 'fa-solid fa-credit-card text-emerald-500'
    if (n.includes('customization')) return 'fa-solid fa-wand-magic-sparkles text-emerald-500'
    return 'fa-solid fa-cube text-neutral-500'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Service Marketplace</h2>
        <p className="text-xs text-neutral-500 mt-1">Showing services for UG and global services.</p>
      </div>

      {/* Filter Options panel */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="label text-neutral-600 font-semibold mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
              <input 
                className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="Search services..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="label text-neutral-600 font-semibold mb-1">Provider</label>
            <select 
              className="input text-xs py-2 bg-white border border-neutral-300 rounded focus:ring-1 focus:ring-blue-600"
              value={providerFilter}
              onChange={e => setProviderFilter(e.target.value)}
            >
              <option value="All">All Providers</option>
              <option value="MTN">MTN</option>
              <option value="Airtel">Airtel</option>
              <option value="Bank">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label className="label text-neutral-600 font-semibold mb-1">Type</label>
            <select 
              className="input text-xs py-2 bg-white border border-neutral-300 rounded focus:ring-1 focus:ring-blue-600"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Collection">Collection</option>
              <option value="Disbursement">Disbursement</option>
              <option value="Message">Message</option>
              <option value="Verification">Verification</option>
              <option value="Customization">Customization</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button className="btn-primary py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-full flex-1 shadow-2xs">
              Filter
            </button>
            <button 
              className="btn-secondary py-2 text-xs font-semibold bg-slate-700 hover:bg-slate-800 text-white border border-slate-700 rounded-full flex-1 shadow-2xs" 
              onClick={() => {
                setSearch('')
                setProviderFilter('All')
                setTypeFilter('All')
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Info/Warning status bar with "View next page" button */}
      <div className="bg-neutral-100/80 border border-neutral-200/60 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-neutral-600 font-medium">
        <span>13 services available across 2 pages. You are viewing page {currentPage}.</span>
        <button 
          onClick={() => setCurrentPage(currentPage === 1 ? 2 : 1)}
          className="bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold px-3 py-1 rounded-full transition-all shadow-2xs flex items-center gap-1"
        >
          View {currentPage === 1 ? 'Next' : 'Previous'} Page
          {currentPage === 1 ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Grid of services cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((service) => {
          let borderLeftColor = 'border-l-slate-400'
          if (service.type === 'collection') {
            borderLeftColor = 'border-l-emerald-500'
          } else if (service.type === 'disbursement') {
            borderLeftColor = 'border-l-blue-500'
          } else if (service.type === 'verification') {
            borderLeftColor = 'border-l-purple-500'
          } else if (service.type === 'message') {
            borderLeftColor = 'border-l-amber-500'
          } else if (service.type === 'customization') {
            borderLeftColor = 'border-l-rose-500'
          }

          const iconClass = getServiceIcon(service.name)

          return (
            <div 
              key={service.id} 
              className={`bg-white border border-neutral-200/80 border-l-4 ${borderLeftColor} rounded-2xl p-5 shadow-2xs hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-neutral-100/60 mb-3.5">
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-800 tracking-wide">
                      {service.name}
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-medium mt-0.5 capitalize">
                      {service.type} · {service.region}
                    </p>
                  </div>
                  <i className={`${iconClass} text-sm shrink-0 mt-0.5`}></i>
                </div>

                <p className="text-[11px] text-neutral-500 leading-relaxed font-normal min-h-[48px] mb-4">
                  {service.provider}
                </p>

                <div className="text-[10px] text-neutral-400 border-t border-neutral-100/40 pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-neutral-400">Status:</span>
                    <span className={`font-medium ${service.subscribed ? 'text-emerald-600' : 'text-neutral-500'}`}>
                      {service.subscribed ? 'Active' : 'Not Subscribed'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 mt-5 pt-3.5 border-t border-neutral-100/60">
                <span className="text-xs font-bold text-neutral-800">{service.price}</span>
                {service.subscribed ? (
                  <button 
                    disabled={loadingSub[service.id]}
                    onClick={() => handleUnsubscribe(service.id)}
                    className="btn-secondary py-1.5 px-4 text-[10px] font-semibold bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-full shadow-2xs flex items-center gap-1.5 transition-all"
                  >
                    {loadingSub[service.id] ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Unsubscribing...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-minus-circle"></i>
                        <span>Unsubscribe</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    disabled={loadingSub[service.id]}
                    onClick={() => handleSubscribe(service.id)}
                    className="btn-primary py-1.5 px-4 text-[10px] font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-2xs flex items-center gap-1.5 transition-all"
                  >
                    {loadingSub[service.id] ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Subscribing...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-plus-circle"></i>
                        <span>Subscribe</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer Pagination Component Card */}
      <div className="card bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-brand-600">More services available</h4>
          <p className="text-[10px] text-neutral-500 mt-0.5">
            Showing 1-12 of 13 services · Page {currentPage} of 2
          </p>
        </div>

        {/* Pagination buttons matching screenshot */}
        <div className="flex items-center gap-2">
          {/* Previous Page */}
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            className={`px-3 py-1.5 border border-neutral-200 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
              currentPage === 1 
                ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed border-neutral-200/65' 
                : 'bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <ChevronLeft size={12} />
            Previous
          </button>

          {/* Page numbers */}
          <button 
            onClick={() => setCurrentPage(1)}
            className={`w-7 h-7 rounded-full text-[10px] font-bold transition-all border ${
              currentPage === 1 
                ? 'bg-brand-600 text-white border-brand-600' 
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            1
          </button>
          
          <button 
            onClick={() => setCurrentPage(2)}
            className={`w-7 h-7 rounded-full text-[10px] font-bold transition-all border ${
              currentPage === 2 
                ? 'bg-brand-600 text-white border-brand-600' 
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            2
          </button>

          {/* Next Page */}
          <button 
            disabled={currentPage === 2}
            onClick={() => setCurrentPage(2)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all border ${
              currentPage === 2 
                ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed border-neutral-200/65' 
                : 'bg-brand-600 text-white border-brand-600 hover:bg-brand-700'
            }`}
          >
            Next
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
