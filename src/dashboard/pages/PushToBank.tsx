import { useState } from 'react'
import { Building2, CheckCircle, AlertCircle, Loader } from 'lucide-react'

const banks = [
  { id: 'stanbic', name: 'Stanbic Bank', account: '****9032' },
  { id: 'equity', name: 'Equity Bank', account: '****1045' },
  { id: 'crdb', name: 'CRDB Bank', account: '****0150' },
]

type Step = 'form' | 'processing' | 'success' | 'failed'

export function PushToBank() {
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({
    bank: '',
    amount: '',
    reference: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.bank) e.bank = 'Select a bank account'
    if (!form.amount || Number(form.amount) < 10000) e.amount = 'Minimum withdrawal is UGX 10,000'
    if (!form.reference) e.reference = 'Reference is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    setStep('processing')
    setTimeout(() => {
      Math.random() > 0.15 ? setStep('success') : setStep('failed')
    }, 3000)
  }

  const handleReset = () => {
    setStep('form')
    setForm({ bank: '', amount: '', reference: '' })
    setErrors({})
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h2 className="page-header">Push to Bank</h2>
        <p className="page-sub">Transfer funds to your linked bank account.</p>
      </div>

      {step === 'form' && (
        <div className="card p-6 space-y-4 rounded-2xl shadow-sm">
          <div>
            <label className="label">Destination Bank Account</label>
            <div className="grid gap-2">
              {banks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setForm(f => ({ ...f, bank: b.id }))}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    form.bank === b.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <Building2 size={16} className="text-neutral-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{b.name}</div>
                    <div className="text-xs text-neutral-500">Account: {b.account}</div>
                  </div>
                  {form.bank === b.id && (
                    <CheckCircle size={16} className="text-brand-600" />
                  )}
                </button>
              ))}
            </div>
            {errors.bank && <p className="text-xs text-error-600 mt-2">{errors.bank}</p>}
          </div>

          <div>
            <label className="label">Amount (UGX)</label>
            <input
              className={`input text-lg ${errors.amount ? 'border-error-500' : ''}`}
              type="number"
              placeholder="Minimum UGX 10,000"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            />
            {errors.amount && <p className="text-xs text-error-600 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="label">Reference</label>
            <input
              className={`input ${errors.reference ? 'border-error-500' : ''}`}
              placeholder="e.g. Settlement June 2024"
              value={form.reference}
              onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
            />
            {errors.reference && <p className="text-xs text-error-600 mt-1">{errors.reference}</p>}
          </div>

          <div className="p-3 bg-neutral-50 rounded-2xl text-xs text-neutral-500">
            Settlement will be reflected in your bank account within 1-2 business days.
          </div>

          <button onClick={handleSubmit} className="btn-primary w-full justify-center py-3">
            Push to Bank
          </button>
        </div>
      )}

      {step === 'processing' && (
        <div className="card p-8 text-center rounded-2xl shadow-sm">
          <Loader size={24} className="text-brand-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg mb-2">Processing settlement...</h3>
          <p className="text-sm text-neutral-500">Transferring funds to your bank account.</p>
        </div>
      )}

      {step === 'success' && (
        <div className="card p-8 text-center rounded-2xl shadow-sm">
          <CheckCircle size={24} className="text-success-600 mx-auto mb-4" />
          <h3 className="text-lg mb-2">Settlement Initiated</h3>
          <p className="text-sm text-neutral-500 mb-4">
            UGX {Number(form.amount).toLocaleString()} will arrive in 1-2 business days.
          </p>
          <div className="p-4 bg-neutral-50 rounded-2xl text-left mb-6">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-neutral-400">Reference</span>
              <span className="text-neutral-600">{form.reference}</span>
            </div>
          </div>
          <button onClick={handleReset} className="btn-primary w-full justify-center">
            New Settlement
          </button>
        </div>
      )}

      {step === 'failed' && (
        <div className="card p-8 text-center rounded-2xl shadow-sm">
          <AlertCircle size={24} className="text-error-600 mx-auto mb-4" />
          <h3 className="text-lg mb-2">Settlement Failed</h3>
          <p className="text-sm text-neutral-500 mb-4">Unable to process. Please try again.</p>
          <div className="flex gap-3">
            <button onClick={handleReset} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={() => setStep('form')} className="btn-primary flex-1 justify-center">Retry</button>
          </div>
        </div>
      )}
    </div>
  )
}
