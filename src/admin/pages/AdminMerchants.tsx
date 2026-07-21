import { useState, useEffect } from 'react'
import { Check, X, Eye, FileText, ChevronRight } from 'lucide-react'

interface MerchantKyc {
  id: string
  name: string
  email: string
  type: 'individual' | 'business'
  status: 'Pending KYC' | 'Approved' | 'Rejected'
  submittedAt: string
  docs: Record<string, string>
}

export function AdminMerchants() {
  const [merchants, setMerchants] = useState<MerchantKyc[]>([
    {
      id: 'mer_101',
      name: 'Kampala Logistics Ltd',
      email: 'logistics@kampala.com',
      type: 'business',
      status: 'Pending KYC',
      submittedAt: 'Jun 28, 2026',
      docs: {
        incorporationCert: 'incorporation_certificate.pdf',
        moa: 'memorandum_of_association.pdf',
        shareholderRegister: 'shareholder_register.pdf',
        directorId: 'director_national_id.png',
        proofAddress: 'utility_bill_electric.pdf'
      }
    }
  ])

  const [selectedMerchant, setSelectedMerchant] = useState<MerchantKyc | null>(null)

  useEffect(() => {
    // Check if the custom merchant registered in step 2 has submitted documents
    const savedName = localStorage.getItem('merchant_business_name')
    const savedEmail = localStorage.getItem('merchant_email')
    const savedType = localStorage.getItem('merchant_account_type') as 'individual' | 'business'
    const kycStatus = localStorage.getItem('kyc_status')
    const submittedDocsStr = localStorage.getItem('kyc_submitted_docs')

    if (savedName && savedEmail && kycStatus === 'submitted') {
      const docs = submittedDocsStr ? JSON.parse(submittedDocsStr) : {
        nationalId: 'national_id.pdf',
        proofAddress: 'utility_bill.png'
      }

      const customMerchant: MerchantKyc = {
        id: 'mer_custom',
        name: savedName,
        email: savedEmail,
        type: savedType || 'individual',
        status: 'Pending KYC',
        submittedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        docs: docs
      }

      setMerchants(prev => {
        const exists = prev.some(m => m.id === 'mer_custom')
        if (exists) return prev
        return [...prev, customMerchant]
      })
    }
  }, [])

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    const nextStatus = action === 'approve' ? 'Approved' : 'Rejected'
    
    setMerchants(prev => prev.map(m => m.id === id ? { ...m, status: nextStatus } : m))
    
    if (id === 'mer_custom') {
      localStorage.setItem('kyc_status', action === 'approve' ? 'approved' : 'rejected')
    }

    if (selectedMerchant && selectedMerchant.id === id) {
      setSelectedMerchant(prev => prev ? { ...prev, status: nextStatus } : null)
    }

    if (window.showToast) {
      window.showToast(`Merchant application ${action === 'approve' ? 'approved' : 'rejected'}`, 'success')
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Merchant KYC Pipeline</h2>
        <p className="text-xs text-slate-500 mt-0.5">Review corporate incorporation documents and verify business account status</p>
      </div>

      {/* Main List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100">Verification Queue</h3>
        
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3">Merchant ID</th>
                <th className="p-3">Business Entity</th>
                <th className="p-3">Account Type</th>
                <th className="p-3">Submission Date</th>
                <th className="p-3">KYC Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-650 font-medium">
              {merchants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-450 font-normal">
                    No merchant verification applications pending.
                  </td>
                </tr>
              ) : (
                merchants.map(m => (
                  <tr key={m.id} className="hover:bg-slate-25/50 transition">
                    <td className="p-3 font-mono font-bold text-[10px] text-slate-450">{m.id}</td>
                    <td className="p-3 text-slate-900 font-bold capitalize">
                      <div>
                        <p>{m.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{m.email}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="capitalize font-semibold text-slate-700 bg-slate-100 border border-slate-150 px-2 py-0.5 rounded text-[10px]">
                        {m.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{m.submittedAt}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        m.status === 'Approved' 
                          ? 'bg-emerald-50 text-emerald-705 border-emerald-100'
                          : m.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                            : 'bg-amber-50 text-amber-705 border-amber-100 animate-pulse'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-3 font-bold text-[11px]">
                        <span 
                          onClick={() => setSelectedMerchant(m)}
                          className="text-blue-650 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} /> Review Files
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {selectedMerchant && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full mx-4 shadow-xl space-y-5 text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 capitalize">{selectedMerchant.name}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedMerchant.email} • {selectedMerchant.type} account</p>
              </div>
              <button 
                onClick={() => setSelectedMerchant(null)}
                className="text-slate-400 hover:text-slate-650"
              >
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {/* List of uploaded documents */}
            <div className="space-y-3.5">
              <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Submitted verification documents</span>
              
              <div className="grid gap-3.5 max-h-60 overflow-y-auto pr-1">
                {Object.keys(selectedMerchant.docs).map(key => (
                  <div key={key} className="flex items-center justify-between p-3 border border-slate-250 bg-slate-25/50 rounded-xl">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText size={16} className="text-[#0022a6] shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 capitalize truncate">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-[10px] text-slate-405 truncate mt-0.5">
                          {selectedMerchant.docs[key]}
                        </p>
                      </div>
                    </div>
                    {/* Mock download/view link */}
                    <button 
                      type="button" 
                      onClick={() => alert(`Simulated preview of document: ${selectedMerchant.docs[key]}`)}
                      className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-0.5 shrink-0"
                    >
                      <span>Preview</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
              {selectedMerchant.status === 'Pending KYC' ? (
                <>
                  <button
                    onClick={() => handleAction(selectedMerchant.id, 'reject')}
                    className="flex-1 bg-white hover:bg-rose-50 text-rose-600 font-bold border border-rose-200 py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
                  >
                    <X size={14} />
                    <span>Reject Verification</span>
                  </button>
                  <button
                    onClick={() => handleAction(selectedMerchant.id, 'approve')}
                    className="flex-1 bg-[#001c80] hover:bg-[#001459] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
                  >
                    <Check size={14} />
                    <span>Approve Verification</span>
                  </button>
                </>
              ) : (
                <div className="w-full text-center p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-bold">
                  Application processing completed. Status: <span className="uppercase text-brand-650 ml-1">{selectedMerchant.status}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
export default AdminMerchants
