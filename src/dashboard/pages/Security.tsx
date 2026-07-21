import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldOff, Copy, Check, KeyRound, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'

export function Security() {
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [enabledAt, setEnabledAt] = useState<string | null>(null)

  // Enrollment flow state
  const [enrolling, setEnrolling] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [enrollCode, setEnrollCode] = useState('')
  const [enrollError, setEnrollError] = useState('')
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)

  // Disable flow state
  const [disabling, setDisabling] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [disableError, setDisableError] = useState('')
  const [disableLoading, setDisableLoading] = useState(false)

  // Password change state
  const [pw, setPw] = useState({ next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const loadStatus = async () => {
    setLoadingStatus(true)
    try {
      const res = await api.twoFactorStatus()
      if (res.success && res.data) {
        setEnabled(res.data.enabled)
        setEnabledAt(res.data.enabledAt)
      }
    } catch {
      // Non-fatal — leave defaults
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const startEnrollment = async () => {
    setEnrolling(true)
    setEnrollError('')
    setBackupCodes(null)
    setEnrollCode('')
    try {
      const res = await api.twoFactorSetup()
      if (res.success && res.data) {
        setQrDataUrl(res.data.qrDataUrl)
        setSecret(res.data.secret)
      }
    } catch (err: any) {
      setEnrollError(err?.message || 'Could not start 2FA setup. Please try again.')
    }
  }

  const confirmEnrollment = async () => {
    if (!/^\d{6}$/.test(enrollCode)) {
      setEnrollError('Enter the 6-digit code shown in your authenticator app.')
      return
    }
    setEnrollLoading(true)
    setEnrollError('')
    try {
      const res = await api.twoFactorVerify(enrollCode)
      if (res.success && res.data) {
        setBackupCodes(res.data.backupCodes)
        setEnabled(true)
        setEnabledAt(new Date().toISOString())
        if (window.showToast) window.showToast('Two-factor authentication enabled', 'success')
      }
    } catch (err: any) {
      setEnrollError(err?.message || 'Invalid code. Please try again.')
    } finally {
      setEnrollLoading(false)
    }
  }

  const finishEnrollment = () => {
    setEnrolling(false)
    setQrDataUrl('')
    setSecret('')
    setEnrollCode('')
    setBackupCodes(null)
  }

  const confirmDisable = async () => {
    if (!disableCode.trim()) {
      setDisableError('Enter a code from your authenticator app or a backup code.')
      return
    }
    setDisableLoading(true)
    setDisableError('')
    try {
      await api.twoFactorDisable(disableCode.trim())
      setEnabled(false)
      setEnabledAt(null)
      setDisabling(false)
      setDisableCode('')
      if (window.showToast) window.showToast('Two-factor authentication disabled', 'success')
    } catch (err: any) {
      setDisableError(err?.message || 'Invalid code. 2FA was not disabled.')
    } finally {
      setDisableLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')

    if (pw.next.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    if (pw.next !== pw.confirm) {
      setPwError('Passwords do not match.')
      return
    }

    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pw.next })
    setPwLoading(false)

    if (error) {
      setPwError(error.message)
      return
    }
    setPwSuccess('Password updated successfully.')
    setPw({ next: '', confirm: '' })
  }

  const copySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 1500)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">Account Security</h1>
        <p className="text-xs text-neutral-500 mt-1">Manage your password and two-factor authentication.</p>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>
              {enabled ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Two-Factor Authentication (2FA)</h2>
              <p className="text-xs text-neutral-500 mt-0.5 max-w-md">
                Require a code from Google Authenticator (or any TOTP app) in addition to your password.
              </p>
            </div>
          </div>
          {loadingStatus ? (
            <Loader2 size={16} className="animate-spin text-neutral-400 shrink-0" />
          ) : (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'}`}>
              {enabled ? 'Enabled' : 'Disabled'}
            </span>
          )}
        </div>

        {!loadingStatus && !enabled && !enrolling && (
          <button
            type="button"
            onClick={startEnrollment}
            className="btn-shimmer bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all border-0"
          >
            Enable 2FA
          </button>
        )}

        {!loadingStatus && enabled && !disabling && (
          <div className="flex items-center gap-3">
            {enabledAt && (
              <span className="text-[11px] text-neutral-400">Enabled {new Date(enabledAt).toLocaleDateString()}</span>
            )}
            <button
              type="button"
              onClick={() => setDisabling(true)}
              className="text-xs font-bold text-red-600 hover:underline bg-transparent border-0"
            >
              Disable 2FA
            </button>
          </div>
        )}

        {/* Disable flow */}
        {disabling && (
          <div className="bg-red-50/50 border border-red-200 rounded-xl p-4 space-y-3 animate-fade-in">
            <p className="text-xs text-red-700 font-medium">Enter a current 6-digit code (or a backup code) to confirm disabling 2FA.</p>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={disableCode}
                onChange={e => setDisableCode(e.target.value)}
                placeholder="123456"
                className="bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:border-red-600"
              />
              <button
                type="button"
                onClick={confirmDisable}
                disabled={disableLoading}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg border-0 disabled:opacity-50"
              >
                {disableLoading ? 'Verifying...' : 'Confirm disable'}
              </button>
              <button
                type="button"
                onClick={() => { setDisabling(false); setDisableCode(''); setDisableError('') }}
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-700 bg-transparent border-0"
              >
                Cancel
              </button>
            </div>
            {disableError && <p className="text-xs text-red-600">{disableError}</p>}
          </div>
        )}

        {/* Enrollment flow */}
        {enrolling && !backupCodes && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-4 animate-fade-in">
            {qrDataUrl ? (
              <>
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <img src={qrDataUrl} alt="2FA QR code" className="w-40 h-40 rounded-lg border border-neutral-200 bg-white p-2 shrink-0" />
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      1. Scan this QR code with Google Authenticator, Authy, or any TOTP app.<br />
                      2. Or enter this setup key manually:
                    </p>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="flex items-center gap-2 bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-mono text-neutral-700 hover:border-red-600 transition-colors"
                    >
                      <KeyRound size={12} className="text-neutral-400 shrink-0" />
                      <span className="truncate">{secret}</span>
                      {copiedSecret ? <Check size={12} className="text-emerald-600 shrink-0" /> : <Copy size={12} className="text-neutral-400 shrink-0" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-neutral-200">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={enrollCode}
                    onChange={e => setEnrollCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    className="bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-sm w-32 mt-3 focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="button"
                    onClick={confirmEnrollment}
                    disabled={enrollLoading}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg border-0 disabled:opacity-50 mt-3"
                  >
                    {enrollLoading ? 'Verifying...' : 'Confirm & enable'}
                  </button>
                  <button
                    type="button"
                    onClick={finishEnrollment}
                    className="text-xs font-semibold text-neutral-500 hover:text-neutral-700 bg-transparent border-0 mt-3"
                  >
                    Cancel
                  </button>
                </div>
                {enrollError && <p className="text-xs text-red-600">{enrollError}</p>}
              </>
            ) : (
              <p className="text-xs text-neutral-500">{enrollError || 'Generating your secret...'}</p>
            )}
          </div>
        )}

        {/* Backup codes shown once after successful enrollment */}
        {backupCodes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3 animate-fade-in">
            <p className="text-xs font-bold text-amber-800">Save your backup codes</p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Each code can be used once to sign in if you lose access to your authenticator app. Store them somewhere safe — they will not be shown again.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {backupCodes.map(code => (
                <span key={code} className="bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-neutral-800 text-center">
                  {code}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={finishEnrollment}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg border-0"
            >
              I've saved these codes
            </button>
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-bold text-neutral-900">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
          <div>
            <label className="block text-xs text-neutral-600 mb-1.5">New password</label>
            <input
              type="password"
              value={pw.next}
              onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl bg-neutral-50 focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-600 mb-1.5">Confirm new password</label>
            <input
              type="password"
              value={pw.confirm}
              onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm border border-neutral-300 rounded-xl bg-neutral-50 focus:outline-none focus:border-red-600"
            />
          </div>
          {pwError && <p className="text-xs text-red-600">{pwError}</p>}
          {pwSuccess && <p className="text-xs text-emerald-600">{pwSuccess}</p>}
          <button
            type="submit"
            disabled={pwLoading}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-full border-0 disabled:opacity-50"
          >
            {pwLoading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Security
