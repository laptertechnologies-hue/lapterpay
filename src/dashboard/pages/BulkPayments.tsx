import { useState, useEffect } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function BulkPayments() {
  const [showNewModal, setShowNewModal] = useState(false)
  const [uploadStep, setUploadStep] = useState<'step1' | 'step2'>('step1')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilterBadge, setShowFilterBadge] = useState(true)
  
  // New batch form states
  const [fileName, setFileName] = useState('')
  const [success, setSuccess] = useState(false)

  const [balance, setBalance] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadBalance() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
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
    loadBalance()
  }, [])

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!fileName || !userId) return

    // Simulate bulk file containing 3 disbursements of 5,000 UGX each (total 15,000 UGX)
    const simulatedTotal = 15000
    if (balance !== null && balance < simulatedTotal) {
      setErrorMsg('Insufficient wallet balance to disburse this bulk file (Required: UGX 15,000)')
      return
    }

    setLoading(true)

    // Deduct cost
    const { data: isOk, error: rpcErr } = await supabase.rpc('increment_wallet_balance', {
      p_merchant_id: userId,
      p_environment: 'test',
      p_currency: 'UGX',
      p_amount: -simulatedTotal
    })

    if (rpcErr || !isOk) {
      setErrorMsg(rpcErr?.message || 'Failed to update balance. Please try again.')
      setLoading(false)
      return
    }

    const recipients = [
      { phone: '+256771000001', name: 'Alvin Okello' },
      { phone: '+256771000002', name: 'Mercy Nakato' },
      { phone: '+256771000003', name: 'Kato John' }
    ]

    // Insert transaction records for the bulk batch
    for (const r of recipients) {
      await supabase
        .from('transactions')
        .insert({
          id: 'TXN' + Date.now() + Math.floor(Math.random() * 10000),
          merchant_id: userId,
          type: 'payout',
          amount: 5000,
          fee: 5000 * 0.03, // 3% fee
          currency: 'UGX',
          payment_method: 'Bulk MTN MoMo',
          customer_identifier: r.phone,
          status: 'completed',
          environment: 'test',
          description: `Bulk Payment batch payout to ${r.name}`
        })
    }

    setLoading(false)
    setBalance(prev => prev !== null ? prev - simulatedTotal : null)
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setShowNewModal(false)
      setUploadStep('step1')
      setFileName('')
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Bulk Payments</h2>
        </div>
        <button 
          onClick={() => {
            setUploadStep('step1')
            setShowNewModal(true)
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all"
        >
          <i className="fa-solid fa-plus text-[10px]"></i>
          New Bulk Payment
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Bulk Payment Batches</h3>

        {/* Search & Actions Panel */}
        <div className="card bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xs">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[11px]"></i>
              <input
                type="text"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-all"
                placeholder="Search bulk payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              {/* Filter */}
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 bg-white transition-all">
                <i className="fa-solid fa-sliders text-[10px]"></i>
                <span>Filters</span>
                {showFilterBadge && (
                  <span className="bg-brand-100 text-brand-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">1</span>
                )}
              </button>
            </div>
          </div>

          {/* Active Filters row */}
          {showFilterBadge && (
            <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-neutral-600">Active filters</span>
                <div className="bg-amber-100/70 text-amber-800 px-2 py-0.5 rounded flex items-center gap-1.5 font-medium border border-amber-200/60">
                  <span>Date Filter: Today</span>
                  <button onClick={() => setShowFilterBadge(false)} className="hover:text-amber-955">
                    <X size={12} />
                  </button>
                </div>
              </div>
              <button onClick={() => setShowFilterBadge(false)} className="text-neutral-450 hover:text-neutral-600">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Empty state body */}
          <div className="py-20 flex flex-col justify-center items-center text-center">
            <X size={24} className="text-neutral-400 mb-3" />
            <h4 className="text-sm font-semibold text-neutral-800">No bulk payment batches</h4>
          </div>

          {/* Per Page pagination footer */}
          <div className="p-4 border-t border-neutral-100 flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span>Per page</span>
              <select className="border border-neutral-200 rounded px-2 py-1 bg-white text-xs font-semibold focus:outline-none">
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* New Bulk Payment Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden border border-neutral-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-850">Bulk Payment Upload</h3>
              <button 
                onClick={() => setShowNewModal(false)} 
                className="text-neutral-500 hover:text-neutral-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {success ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-800">File Uploaded Successfully</h4>
                    <p className="text-2xs text-emerald-600 mt-0.5">
                      Your batch payment template has been uploaded and validation is running.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {uploadStep === 'step1' ? (
                    /* Step 1: Download Template */
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-blue-800">Step 1: Download Template</h4>
                          <p className="text-[10px] text-blue-600 mt-1">
                            Download the Excel template, fill it with payment details, then upload it in step 2.
                          </p>
                        </div>
                        
                        <ul className="list-disc list-inside text-[10px] text-blue-700/90 space-y-1.5 pl-1">
                          <li>Phone numbers must start with 256</li>
                          <li>Maximum 1000 rows per batch</li>
                          <li>Minimum amount per payment is UGX 1,000</li>
                          <li>Name column is optional</li>
                        </ul>

                        <button 
                          type="button"
                          onClick={() => alert('Downloading Excel template...')}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-bold transition-all shadow-3xs"
                        >
                          Download Template
                        </button>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setUploadStep('step2')}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-bold shadow-sm transition-all"
                        >
                          Next: Upload File
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Step 2: Upload Filled Template */
                    <div className="space-y-6">
                      <div className="bg-emerald-50 border border-emerald-150 rounded-lg p-5">
                        <h4 className="text-xs font-bold text-emerald-800">Step 2: Upload Filled Template</h4>
                        <p className="text-[10px] text-emerald-600 mt-1">
                          Upload your filled Excel file. We'll validate it and show you a summary.
                        </p>
                      </div>

                      <form onSubmit={handleUploadSubmit} className="space-y-5">
                        {errorMsg && (
                          <div className="p-3 bg-red-50 border border-red-200 text-red-655 rounded-xl text-xs flex items-center gap-2">
                            <i className="fa-solid fa-circle-exclamation text-xs"></i>
                            <span>{errorMsg}</span>
                          </div>
                        )}

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
                          Available Wallet Balance: <span className="font-bold font-mono">{balance !== null ? 'UGX ' + balance.toLocaleString() : 'Loading...'}</span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-neutral-600 mb-2">Upload Excel File</label>
                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer bg-brand-600 hover:bg-brand-700 text-white rounded-full px-4 py-1.5 text-xs font-semibold transition-colors">
                              Choose File
                              <input 
                                type="file" 
                                required
                                accept=".xlsx, .xls, .csv"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setFileName(e.target.files[0].name)
                                  }
                                }}
                              />
                            </label>
                            <span className="text-xs text-neutral-500">
                              {fileName ? fileName : 'No file chosen'}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-2">
                            Required columns: <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[9px]">phone_number</span>, <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[9px]">amount</span> (minimum UGX 1,000), <span className="font-mono bg-neutral-100 px-1 py-0.5 rounded text-[9px]">name</span> (optional)
                          </p>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-neutral-100">
                          <button
                            type="button"
                            onClick={() => setUploadStep('step1')}
                            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-full text-xs font-semibold transition-all"
                          >
                            Back
                          </button>
                          
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowNewModal(false)}
                              className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-full text-xs font-semibold transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                            >
                              {loading && <i className="fa-solid fa-spinner animate-spin text-[10px]"></i>}
                              <span>Upload & Validate</span>
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
