import { useState } from 'react'
import { Copy, Check, Eye, EyeOff, BookOpen, ChevronDown, ChevronUp, Lock, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ApiKeyRow {
  id: string
  name: string
  key_preview: string
  environment: 'live' | 'test'
  created_at: string
  last_used_at: string | null
}

export function ApiKeys() {
  const [isPasswordVerified, setIsPasswordVerified] = useState(false)
  const [password, setPassword] = useState('')
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [isHowToOpen, setIsHowToOpen] = useState(false)
  const [apiActivityEnabled, setApiActivityEnabled] = useState(true)
  const [authError, setAuthError] = useState('')

  // Hashed keys list from DB
  const [keysList, setKeysList] = useState<ApiKeyRow[]>([])
  const [loadingKeys, setLoadingKeys] = useState(false)

  // Newly generated key modal display
  const [generatedKeyDetails, setGeneratedKeyDetails] = useState<{
    secretKey: string
    keyPreview: string
    base64Header: string
  } | null>(null)

  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = (text: string, label: string, fieldId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    if (window.showToast) {
      window.showToast(`${label} copied to clipboard`, 'success')
    }
    setTimeout(() => {
      setCopiedField(null)
    }, 1500)
  }

  const loadKeys = async () => {
    setLoadingKeys(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/v1/keys', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const body = await res.json()
      if (body.success && body.data) {
        setKeysList(body.data)
      }
    } catch (err) {
      console.error('Failed to load API keys:', err)
    } finally {
      setLoadingKeys(false)
    }
  }

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    if (!password) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Verify password by re-authenticating
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: password
      })

      if (error) {
        setAuthError('Authentication failed: Invalid credentials.')
        return
      }

      setIsPasswordVerified(true)
      loadKeys()
    } catch (err) {
      setAuthError('An error occurred during verification.')
    }
  }

  const handleGenerateKey = async () => {
    const keyName = prompt('Enter a label/name for this API Key:', 'Default Key')
    if (!keyName) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: keyName,
          environment: 'test'
        })
      })

      const body = await res.json()
      if (body.success && body.data) {
        const fullSecret = body.data.secretKey
        // Create base64 auth header: base64(preview:secret) or key:secret
        const base64Str = btoa(`${body.data.key_preview}:${fullSecret}`)
        
        setGeneratedKeyDetails({
          secretKey: fullSecret,
          keyPreview: body.data.key_preview,
          base64Header: base64Str
        })

        loadKeys()
        if (window.showToast) {
          window.showToast('New API key generated successfully', 'success')
        }
      } else {
        alert(body.error || 'Failed to generate key.')
      }
    } catch (err) {
      console.error('Error generating key:', err)
    }
  }

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Systems using this key will immediately fail.')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`/api/v1/keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const body = await res.json()
      if (body.success) {
        loadKeys()
        if (window.showToast) {
          window.showToast('API key revoked successfully', 'success')
        }
      }
    } catch (err) {
      console.error('Error revoking key:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Your API Credentials</h2>
        <p className="text-xs text-neutral-500 mt-1">
          Credentials for <span className="font-bold text-neutral-700">UG</span> (UGX wallet) — manage keys and API authentication tokens.
        </p>
      </div>

      {/* How to Use Your API Keys Collapsible */}
      <div className="border border-blue-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <button
          onClick={() => setIsHowToOpen(!isHowToOpen)}
          className="w-full px-5 py-4 bg-blue-50/50 flex items-center justify-between text-xs font-bold text-neutral-800 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 text-blue-700">
            <BookOpen size={16} />
            How to Use Your API Keys
          </span>
          {isHowToOpen ? <ChevronUp size={16} className="text-blue-600" /> : <ChevronDown size={16} className="text-blue-600" />}
        </button>

        {isHowToOpen && (
          <div className="p-5 border-t border-blue-100 bg-white space-y-5 text-xs text-neutral-600 leading-relaxed font-medium">
            <div className="space-y-1.5">
              <span className="font-bold text-neutral-700">Base URL</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://api.tamupay.ug/v1"
                  className="input font-mono text-[11px] bg-neutral-50"
                />
                <button
                  type="button"
                  onClick={() => handleCopy('https://api.tamupay.ug/v1', 'Base URL', 'base_url')}
                  className="p-1.5 bg-transparent border-0 text-neutral-450 hover:text-neutral-600 hover:scale-110 transition-all shrink-0 flex items-center justify-center focus:outline-none cursor-pointer"
                  title="Copy Base URL"
                >
                  {copiedField === 'base_url' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-neutral-700">Authentication</span>
              <p className="text-[11px] text-neutral-500">
                All API requests require Bearer token authorization using your active API Key.
              </p>
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3 font-mono text-[10px] space-y-1 text-neutral-650">
                <div>Header Format:</div>
                <div className="font-bold text-neutral-800">x-api-key: tp_test_yourrandombyteskeyhere</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Activity Control */}
      <div className="card bg-white p-5 border border-neutral-200 rounded-2xl shadow-2xs flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-neutral-800">API Activity Control</h3>
          <p className="text-2xs text-neutral-500 mt-1">
            API activity is currently <span className={`font-bold ${apiActivityEnabled ? 'text-emerald-600' : 'text-red-500'}`}>{apiActivityEnabled ? 'enabled' : 'disabled'}</span>. Your API endpoints are {apiActivityEnabled ? 'accessible' : 'inaccessible'}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setApiActivityEnabled(!apiActivityEnabled)}
          className={`px-4 py-2 rounded-full text-xs font-bold text-white transition-all shadow-2xs cursor-pointer ${
            apiActivityEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {apiActivityEnabled ? 'Disable API Activity' : 'Enable API Activity'}
        </button>
      </div>

      {/* Verification Gate vs API key views */}
      {!isPasswordVerified ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-4 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-red-800 font-bold">
            <Lock className="text-red-500 shrink-0" size={16} />
            <span>API Keys Protected</span>
          </div>
          
          <p className="text-2xs text-red-650 font-medium">
            For security reasons, your API keys are hidden. Enter your password to view them.
          </p>

          {authError && <p className="text-3xs text-red-500 font-bold">{authError}</p>}

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-red-700 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswordInput ? 'text' : 'password'}
                  required
                  placeholder="Enter your current password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input border-red-205 focus:border-red-400 focus:ring-red-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-450 hover:text-neutral-700 cursor-pointer"
                >
                  {showPasswordInput ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              Show API Keys
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Keys List */}
          <div className="border border-neutral-200 rounded-2xl bg-white p-5 shadow-2xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Active Credentials</h3>
              <button
                type="button"
                onClick={handleGenerateKey}
                className="bg-[#0022a6] hover:bg-[#001c80] text-white text-[11px] font-bold px-4 py-2 rounded-full cursor-pointer transition-all"
              >
                Generate API Key
              </button>
            </div>

            {loadingKeys ? (
              <div className="py-8 text-center text-xs text-neutral-400">Loading credentials...</div>
            ) : keysList.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-450">No API keys generated yet. Click above to generate one.</div>
            ) : (
              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden text-xs">
                {keysList.map((key) => (
                  <div key={key.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-800">{key.name}</span>
                        <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded font-bold uppercase border">
                          {key.environment}
                        </span>
                      </div>
                      <div className="font-mono text-neutral-500 font-semibold">{key.key_preview}</div>
                      <div className="text-[10px] text-neutral-400">
                        Created: {new Date(key.created_at).toLocaleDateString()} 
                        {key.last_used_at && ` • Last Used: ${new Date(key.last_used_at).toLocaleDateString()}`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRevokeKey(key.id)}
                      className="p-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-full transition-all cursor-pointer"
                      title="Revoke Key"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generated credentials display modal */}
          {generatedKeyDetails && (
            <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white rounded-3xl border border-neutral-250 shadow-xl w-full max-w-lg overflow-hidden animate-fade-in p-6 space-y-4 text-xs">
                <div className="border-b border-neutral-105 pb-3">
                  <h3 className="text-sm font-bold text-emerald-805">API Key Generated Successfully</h3>
                  <p className="text-[10px] text-neutral-400 mt-1">Copy this secret key now. For security, it will not be displayed again.</p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1.5 uppercase">Secret Key</label>
                    <div className="flex gap-2">
                      <input type="text" readOnly value={generatedKeyDetails.secretKey} className="input font-mono bg-neutral-50" />
                      <button
                        type="button"
                        onClick={() => handleCopy(generatedKeyDetails.secretKey, 'Secret Key', 'generated_secret')}
                        className="p-2 border border-neutral-200 rounded-xl hover:bg-neutral-50 cursor-pointer"
                      >
                        {copiedField === 'generated_secret' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 mb-1.5 uppercase">Header Basic Auth Token</label>
                    <div className="flex gap-2">
                      <input type="text" readOnly value={generatedKeyDetails.base64Header} className="input font-mono bg-neutral-50" />
                      <button
                        type="button"
                        onClick={() => handleCopy(generatedKeyDetails.base64Header, 'Auth Header', 'generated_header')}
                        className="p-2 border border-neutral-200 rounded-xl hover:bg-neutral-50 cursor-pointer"
                      >
                        {copiedField === 'generated_header' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setGeneratedKeyDetails(null)}
                    className="bg-[#0022a6] hover:bg-[#001c80] text-white font-bold px-6 py-2 rounded-xl cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export default ApiKeys
