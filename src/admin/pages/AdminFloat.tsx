import { useState } from 'react'
import { FileText } from 'lucide-react'

interface FloatRequest {
  id: string
  merchant: string
  amount: string
  method: string
  referenceId: string
  status: 'Pending Verification' | 'Approved' | 'Rejected'
  date: string
}

export function AdminFloat() {
  const [requests, setRequests] = useState<FloatRequest[]>([
    {
      id: 'FLT-8092',
      merchant: 'Lapter Wifi',
      amount: 'UGX 5,000,000',
      method: 'Bank Transfer (Stanbic)',
      referenceId: 'DEP-80277618BC',
      status: 'Pending Verification',
      date: 'Jun 30, 2026'
    },
    {
      id: 'FLT-8091',
      merchant: 'Kampala Logistics Ltd',
      amount: 'UGX 10,000,000',
      method: 'Bank Transfer (Centenary)',
      referenceId: 'DEP-9817239011',
      status: 'Approved',
      date: 'Jun 28, 2026'
    },
    {
      id: 'FLT-8090',
      merchant: 'Ntinda Cafe',
      amount: 'UGX 2,500,000',
      method: 'Bank Transfer (Stanbic)',
      referenceId: 'DEP-6027761899',
      status: 'Rejected',
      date: 'Jun 25, 2026'
    }
  ])

  const [selectedRequest, setSelectedRequest] = useState<FloatRequest | null>(null)

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    const nextStatus = action === 'approve' ? 'Approved' : 'Rejected'
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: nextStatus } : r))
    
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest(prev => prev ? { ...prev, status: nextStatus } : null)
    }

    if (window.showToast) {
      window.showToast(`Float deposit request ${action === 'approve' ? 'approved' : 'rejected'}`, 'success')
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Float Ledger Operations</h2>
        <p className="text-xs text-slate-500 mt-0.5">Verify and approve merchant bank deposit receipts to credit digital float balances</p>
      </div>

      {/* Main List Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Deposit Slip Queue</h3>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="System synchronizer active"></span>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3">Req ID</th>
                <th className="p-3">Merchant</th>
                <th className="p-3">Requested Amount</th>
                <th className="p-3">Slip Reference</th>
                <th className="p-3">Request Date</th>
                <th className="p-3">Ledger Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-650 font-medium">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-slate-25/50 transition">
                  <td className="p-3 font-mono font-bold text-[10px] text-slate-450">{r.id}</td>
                  <td className="p-3 text-slate-900 font-bold capitalize">{r.merchant}</td>
                  <td className="p-3 font-bold text-slate-800">{r.amount}</td>
                  <td className="p-3 font-mono text-[10px] text-slate-505 select-all">{r.referenceId}</td>
                  <td className="p-3 text-slate-500">{r.date}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      r.status === 'Approved' 
                        ? 'bg-emerald-50 text-emerald-705 border-emerald-100'
                        : r.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-amber-50 text-amber-705 border-amber-100 animate-pulse'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => setSelectedRequest(r)}
                      className="text-blue-650 hover:text-blue-800 font-bold flex items-center gap-1 shrink-0 ml-auto"
                    >
                      Verify Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOAT DETAILS DIALOG */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Float Verification</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Validate physical bank deposit slip details</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-650">
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            <div className="space-y-2.5 text-slate-700">
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-450 font-semibold">Merchant Entity</span>
                <span className="font-bold capitalize text-slate-900">{selectedRequest.merchant}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-450 font-semibold">Credit Amount</span>
                <span className="font-bold text-[#0022a6]">{selectedRequest.amount}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-455 font-semibold">Deposit Mode</span>
                <span>{selectedRequest.method}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-455 font-semibold">Slip Reference ID</span>
                <span className="font-mono font-bold text-slate-800">{selectedRequest.referenceId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-455 font-semibold">Ledger Status</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                  selectedRequest.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : selectedRequest.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>{selectedRequest.status}</span>
              </div>
            </div>

            {/* Slip Mock Attachment Block */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#0022a6]" />
                <div>
                  <p className="font-bold text-[10px] text-slate-805">deposit_bank_receipt.png</p>
                  <p className="text-[9px] text-slate-400">Image file • 1.2MB</p>
                </div>
              </div>
              <button 
                onClick={() => alert(`Showing bank slip: ${selectedRequest.referenceId} for ${selectedRequest.amount}`)}
                className="text-brand-600 hover:text-brand-700 font-bold text-[10px]"
              >
                View Slip
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-3">
              {selectedRequest.status === 'Pending Verification' ? (
                <>
                  <button
                    onClick={() => handleAction(selectedRequest.id, 'reject')}
                    className="flex-1 bg-white hover:bg-rose-50 text-rose-605 border border-rose-200 py-2.5 rounded-xl font-bold transition-all shadow-sm"
                  >
                    Reject Slip
                  </button>
                  <button
                    onClick={() => handleAction(selectedRequest.id, 'approve')}
                    className="flex-1 bg-[#001c80] hover:bg-[#001459] text-white font-bold py-2.5 rounded-xl transition-all shadow-sm"
                  >
                    Approve Credit
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl border border-slate-350 transition-all"
                >
                  Close View
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
export default AdminFloat
