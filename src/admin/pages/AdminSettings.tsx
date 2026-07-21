import { useState } from 'react'
import { Check, ShieldAlert, Settings } from 'lucide-react'

export function AdminSettings() {
  const [momoFee, setMomoFee] = useState('3.0')
  const [cardFee, setCardFee] = useState('3.0')
  const [bankFee, setBankFee] = useState('1.5')
  const [smsRate, setSmsRate] = useState('35')
  const [saving, setSaving] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      if (window.showToast) {
        window.showToast('Global transaction commissions updated successfully', 'success')
      }
    }, 1000)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Commission &amp; Fee Configurations</h2>
        <p className="text-xs text-slate-500 mt-0.5">Customize transaction processing charges and bulk communication pricing grids</p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-6">
          <Settings className="text-[#0022a6] w-5 h-5" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Global pricing grids</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* MoMo collection fee */}
            <div className="space-y-2 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <label className="block text-slate-655 font-bold uppercase tracking-wide">MTN &amp; Airtel Collections Fee</label>
              <p className="text-[10px] text-slate-405 leading-normal">Commission charged on successful customer mobile money deposits.</p>
              <div className="relative max-w-[200px] mt-2">
                <input 
                  type="text" 
                  value={momoFee}
                  onChange={e => setMomoFee(e.target.value)}
                  className="input pr-8 font-bold font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Visa/Mastercard fee */}
            <div className="space-y-2 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <label className="block text-slate-655 font-bold uppercase tracking-wide">Card Processing Fee</label>
              <p className="text-[10px] text-slate-405 leading-normal">Commission charged on global Visa and Mastercard collection payments.</p>
              <div className="relative max-w-[200px] mt-2">
                <input 
                  type="text" 
                  value={cardFee}
                  onChange={e => setCardFee(e.target.value)}
                  className="input pr-8 font-bold font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Push to bank fee */}
            <div className="space-y-2 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <label className="block text-slate-655 font-bold uppercase tracking-wide">Push-To-Bank Fee</label>
              <p className="text-[10px] text-slate-405 leading-normal">Commission charged when merchants request settlements to local bank accounts.</p>
              <div className="relative max-w-[200px] mt-2">
                <input 
                  type="text" 
                  value={bankFee}
                  onChange={e => setBankFee(e.target.value)}
                  className="input pr-8 font-bold font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
            </div>

            {/* Transactional SMS rate */}
            <div className="space-y-2 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <label className="block text-slate-655 font-bold uppercase tracking-wide">Transactional SMS Rate</label>
              <p className="text-[10px] text-slate-405 leading-normal">Cost billed per outbound customer transaction confirmation SMS.</p>
              <div className="relative max-w-[200px] mt-2">
                <input 
                  type="text" 
                  value={smsRate}
                  onChange={e => setSmsRate(e.target.value)}
                  className="input pr-12 font-bold font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">UGX</span>
              </div>
            </div>

          </div>

          {/* Warning banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex gap-2.5">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[11px]">Administrative Notice</p>
              <p className="text-[10px] text-slate-600 leading-normal">
                Modifications to global transaction commissions take effect immediately across all newly initialized API triggers. Settled ledgers are not back-calculated.
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#0022a6] hover:bg-[#001c80] text-white font-bold px-6 py-3 rounded-xl shadow transition-all active:scale-98 disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin text-2xs"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}
export default AdminSettings
