import { useState } from 'react'
import { Trash2, Download, Copy, Check } from 'lucide-react'


interface PaymentLink {
  id: string
  title: string
  linkType: string
  isFixedAmount: boolean
  amount: string
  description: string
  redirectUrl: string
  callbackUrl: string
  addExpiry: boolean
  paymentMethod: string
  allowedPayments: {
    mtn: boolean
    airtel: boolean
    card: boolean
  }
  requireCustInfo: boolean
  createdAt: string
  url: string
}

export function PaymentLinks() {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([
    {
      id: 'lnk_1',
      title: 'School Fees Payment',
      linkType: 'one-time',
      isFixedAmount: true,
      amount: '150000',
      description: 'Fees payment link for second term.',
      redirectUrl: 'https://tamupay.ug/success',
      callbackUrl: 'https://tamupay.ug/callback',
      addExpiry: false,
      paymentMethod: 'Mobile Money & Card',
      allowedPayments: { mtn: true, airtel: true, card: true },
      requireCustInfo: true,
      createdAt: 'Jun 12, 2026',
      url: 'https://tamupay.ug/pay/lnk_1'
    },
    {
      id: 'lnk_2',
      title: 'WiFi Subscription',
      linkType: 'subscription',
      isFixedAmount: true,
      amount: '50000',
      description: 'Monthly WiFi access subscription.',
      redirectUrl: 'https://tamupay.ug/wifi-success',
      callbackUrl: 'https://tamupay.ug/wifi-callback',
      addExpiry: false,
      paymentMethod: 'Mobile Money',
      allowedPayments: { mtn: true, airtel: true, card: false },
      requireCustInfo: false,
      createdAt: 'Jun 20, 2026',
      url: 'https://tamupay.ug/pay/lnk_2'
    }
  ])
  const [showCreateModal, setShowCreateModal] = useState(false)
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
        window.showToast('Payment links exported successfully', 'success')
      }
    }, 800)
  }



  // Form states
  const [title, setTitle] = useState('')
  const [linkType, setLinkType] = useState('')
  const [isFixedAmount, setIsFixedAmount] = useState(true)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [redirectUrl, setRedirectUrl] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('')
  const [addExpiry, setAddExpiry] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('Mobile Money & Card')
  const [mtnUg, setMtnUg] = useState(false)
  const [airtelUg, setAirtelUg] = useState(false)
  const [cardUg, setCardUg] = useState(false)
  const [requireCustInfo, setRequireCustInfo] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return
    if (isFixedAmount && !amount) return

    const newId = 'lnk_' + Math.random().toString(36).substring(2, 9)
    const newLink: PaymentLink = {
      id: newId,
      title: title,
      linkType: linkType || 'one-time',
      isFixedAmount: isFixedAmount,
      amount: isFixedAmount ? amount : '0',
      description: description,
      redirectUrl: redirectUrl,
      callbackUrl: callbackUrl,
      addExpiry: addExpiry,
      paymentMethod: paymentMethod,
      allowedPayments: {
        mtn: mtnUg,
        airtel: airtelUg,
        card: cardUg
      },
      requireCustInfo: requireCustInfo,
      createdAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      url: `https://tamupay.ug/pay/${newId}`
    }

    setPaymentLinks(prev => [newLink, ...prev])
    setSuccess(true)

    setTimeout(() => {
      setSuccess(false)
      setShowCreateModal(false)
      setTitle('')
      setLinkType('')
      setIsFixedAmount(true)
      setAmount('')
      setDescription('')
      setRedirectUrl('')
      setCallbackUrl('')
      setAddExpiry(false)
      setMtnUg(false)
      setAirtelUg(false)
      setCardUg(false)
      setRequireCustInfo(false)
      if (window.showToast) {
        window.showToast('Payment link created successfully', 'success')
      }
    }, 500)
  }

  const handleDelete = (id: string) => {
    setSelectedIds([id])
    setShowDeleteConfirm(true)
  }

  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedLinkId(id)
    if (window.showToast) {
      window.showToast('Payment link copied to clipboard', 'success')
    }
    setTimeout(() => {
      setCopiedLinkId(null)
    }, 1500)
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredLinks.map(l => l.id))
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

  const handleDeleteConfirm = () => {
    setIsDeleting(true)
    setTimeout(() => {
      setPaymentLinks(prev => prev.filter(l => !selectedIds.includes(l.id)))
      setSelectedIds([])
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      if (window.showToast) {
        window.showToast('Successfully deleted selected payment links', 'success')
      }
    }, 500)
  }

  const filteredLinks = paymentLinks.filter(link =>
    link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Payment Links</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Create and manage your web payment links</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
        >
          <i className="fa-solid fa-plus text-[10px]"></i>
          <span>Create Payment Link</span>
        </button>
      </div>

      {/* Main content table card */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-brand-50/80 border border-brand-100 rounded-2xl px-5 py-3 mb-4 animate-fade-in">
          <span className="text-xs font-semibold text-brand-900">
            {selectedIds.length} link{selectedIds.length > 1 ? 's' : ''} selected
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

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[11px]"></i>
            <input
              type="text"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-all"
              placeholder="Search links..."
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 bg-white transition-all"
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

        {/* Center Empty State or Table */}
        {filteredLinks.length === 0 ? (
          <div className="py-20 flex flex-col justify-center items-center">
            <i className="fa-solid fa-link-slash text-neutral-400 text-2xl mb-3"></i>
            <h3 className="text-sm font-semibold text-neutral-800">No payment links</h3>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <div className="rounded-2xl border border-neutral-200 overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-[10px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                    <th className="px-4 py-3 text-center w-10">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded-full border-neutral-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                        onChange={handleSelectAll}
                        checked={filteredLinks.length > 0 && selectedIds.length === filteredLinks.length}
                      />
                    </th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Title / Description</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Link Type</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Payment Methods</th>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">Created</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {filteredLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-neutral-25 transition-all">
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded-full border-neutral-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                          checked={selectedIds.includes(link.id)}
                          onChange={(e) => handleSelectRow(link.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-6 py-4">
                          <div className="font-bold text-neutral-800 flex items-center gap-1.5">
                            <i className="fa-solid fa-link text-brand-500 text-2xs"></i>
                            {link.title}
                          </div>
                          {link.description && (
                            <div className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1 max-w-[200px]">
                              {link.description}
                            </div>
                          )}
                        </td>
                      <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            link.linkType === 'subscription' 
                              ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                              : 'bg-brand-50 text-brand-700 border border-brand-100'
                          }`}>
                            {link.linkType === 'subscription' ? 'Subscription' : 'One-time'}
                          </span>
                        </td>
                      <td className="px-6 py-4 font-semibold text-neutral-800">
                          {link.isFixedAmount ? (
                            <span>UGX {parseInt(link.amount).toLocaleString()}</span>
                          ) : (
                            <span className="text-neutral-400 italic text-[10px]">Flexible Amount</span>
                          )}
                        </td>
                      <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {link.allowedPayments.mtn && (
                              <span className="bg-amber-50 text-amber-700 text-[8px] font-extrabold px-1 rounded border border-amber-200">
                                MTN
                              </span>
                            )}
                            {link.allowedPayments.airtel && (
                              <span className="bg-red-50 text-red-700 text-[8px] font-extrabold px-1 rounded border border-red-100">
                                Airtel
                              </span>
                            )}
                            {link.allowedPayments.card && (
                              <span className="bg-brand-50 text-brand-700 text-[8px] font-extrabold px-1 rounded border border-brand-100">
                                Card
                              </span>
                            )}
                            {!link.allowedPayments.mtn && !link.allowedPayments.airtel && !link.allowedPayments.card && (
                              <span className="text-neutral-400 text-[8px] italic">None</span>
                            )}
                          </div>
                        </td>
                      <td className="px-6 py-4 text-neutral-500 text-[11px]">
                          {link.createdAt}
                        </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleCopyLink(link.id, link.url)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:scale-110 transition-all flex items-center justify-center bg-transparent border-0 outline-none focus:outline-none"
                            title="Copy Link"
                          >
                            {copiedLinkId === link.id ? (
                              <Check size={18} className="text-emerald-500" />
                            ) : (
                              <Copy size={18} className="text-neutral-500" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(link.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:scale-110 transition-all flex items-center justify-center bg-transparent border-0 outline-none focus:outline-none"
                            title="Delete Link"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Payment Link Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8 overflow-hidden border border-neutral-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800">Create Payment Link</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {success ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                  <i className="fa-solid fa-circle-check text-emerald-500 shrink-0 mt-0.5 text-base"></i>
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-800">Payment Link Created</h4>
                    <p className="text-2xs text-emerald-600 mt-0.5">
                      Your shareable payment link has been created successfully.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Title</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. School Fees Payment"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input"
                    />
                  </div>

                  {/* Link Type */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Link Type</label>
                    <select
                      value={linkType}
                      onChange={(e) => setLinkType(e.target.value)}
                      className="input bg-white"
                    >
                      <option value="">-- Select Type --</option>
                      <option value="one-time">One-time payment</option>
                      <option value="subscription">Recurring Subscription</option>
                    </select>
                  </div>

                  {/* Is Fixed Amount Checkbox */}
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isFixed"
                      checked={isFixedAmount}
                      onChange={(e) => setIsFixedAmount(e.target.checked)}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
                    />
                    <label htmlFor="isFixed" className="text-xs font-semibold text-neutral-600">
                      Is Fixed Amount?
                    </label>
                  </div>

                  {/* Amount */}
                  {isFixedAmount && (
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Amount</label>
                      <input 
                        type="number"
                        required
                        placeholder="e.g. 500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="input"
                      />
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Description</label>
                    <textarea 
                      rows={3}
                      placeholder="Brief details about the payment link"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="input"
                    />
                  </div>

                  {/* Redirect URL */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Redirect URL (optional)</label>
                    <input 
                      type="text"
                      placeholder="https://example.com/thank-you"
                      value={redirectUrl}
                      onChange={(e) => setRedirectUrl(e.target.value)}
                      className="input"
                    />
                  </div>

                  {/* Callback URL */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Callback URL (optional)</label>
                    <input 
                      type="text"
                      placeholder="https://your-domain.com/webhook/callback"
                      value={callbackUrl}
                      onChange={(e) => setCallbackUrl(e.target.value)}
                      className="input"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">
                      URL to receive payment notifications. If not provided, webhooks will be used.
                    </p>
                  </div>

                  {/* Add Expiry Date checkbox */}
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="addExpiry"
                      checked={addExpiry}
                      onChange={(e) => setAddExpiry(e.target.checked)}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
                    />
                    <label htmlFor="addExpiry" className="text-xs font-semibold text-neutral-600">
                      Add Expiry Date?
                    </label>
                  </div>

                  {/* Payment Method dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="input bg-white"
                    >
                      <option value="Mobile Money & Card">Mobile Money & Card</option>
                      <option value="Mobile Money Only">Mobile Money Only</option>
                      <option value="Card Only">Card Only</option>
                    </select>
                  </div>

                  {/* Collection Methods Checkboxes */}
                  <div className="space-y-2 border-t border-neutral-100 pt-3">
                    <span className="block text-xs font-bold text-neutral-700">Collection Methods</span>
                    <span className="block text-[10px] text-neutral-450">Select which options customers can use to pay:</span>
                    
                    <div className="space-y-2.5 pt-1 pl-1">
                      {/* MTN */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={mtnUg}
                          onChange={(e) => setMtnUg(e.target.checked)}
                          className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
                        />
                        <div className="w-5 h-5 rounded bg-[#ffcc02] flex items-center justify-center shrink-0 border border-amber-300">
                          <span className="text-[7px] font-black text-neutral-900 leading-none">MTN</span>
                        </div>
                        <span className="text-xs font-semibold text-neutral-700">MTN-UG</span>
                      </label>

                      {/* Airtel */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={airtelUg}
                          onChange={(e) => setAirtelUg(e.target.checked)}
                          className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
                        />
                        <div className="w-5 h-5 rounded bg-[#e10000] flex items-center justify-center shrink-0">
                          <span className="text-[7px] font-black text-white leading-none">airtel</span>
                        </div>
                        <span className="text-xs font-semibold text-neutral-700">AIRTEL-UG</span>
                      </label>

                      {/* Card Payments */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={cardUg}
                          onChange={(e) => setCardUg(e.target.checked)}
                          className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
                        />
                        <div className="w-5 h-5 rounded bg-[#1e293b] flex items-center justify-center shrink-0">
                          <span className="text-[6px] font-black text-white leading-none">VISA/MC</span>
                        </div>
                        <span className="text-xs font-semibold text-neutral-700">CARD PAYMENTS-UG</span>
                      </label>
                    </div>

                    <p className="text-[10px] text-neutral-400 pt-1">
                      Select at least one. For "Mobile Money & Card" you can enable MTN, Airtel, and/or Card.
                    </p>
                  </div>

                  {/* Require Customer Info checkbox */}
                  <div className="flex items-center gap-2 border-t border-neutral-100 pt-3">
                    <input 
                      type="checkbox"
                      id="requireCustInfo"
                      checked={requireCustInfo}
                      onChange={(e) => setRequireCustInfo(e.target.checked)}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
                    />
                    <label htmlFor="requireCustInfo" className="text-xs font-semibold text-neutral-600">
                      Require Customer Info?
                    </label>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                    <button 
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-neutral-300 rounded-full text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm"
                    >
                      Create Link
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

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
                Are you sure you want to delete the selected payment links? This action cannot be undone.
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
    </div>
  )
}
