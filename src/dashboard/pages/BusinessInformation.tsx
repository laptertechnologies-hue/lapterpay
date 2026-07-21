import { useState, useEffect } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sanitizeError } from '../../lib/errors'

export function BusinessInformation() {
  const [showPromo, setShowPromo] = useState(true)
  const [showDownloadScreen, setShowDownloadScreen] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')

  // Form states loaded dynamically
  const [email, setEmail] = useState('alvinpunjab@gmail.com')
  const [phoneNumber, setPhoneNumber] = useState('+256761762626')
  const [address, setAddress] = useState('Kampala\nBanda')
  const [businessName, setBusinessName] = useState('Lapter Wifi')
  const [accountNumber, setAccountNumber] = useState('261775810270')
  const [merchantCode, setMerchantCode] = useState('678846')
  const [kycStatus, setKycStatus] = useState('pending')
  const [userId, setUserId] = useState<string | null>(null)

  // Toggle switch states
  const [appLoginEnabled, setAppLoginEnabled] = useState(false)
  const [whatsappEnabled, setWhatsappEnabled] = useState(false)
  const [collectionChargeEnabled, setCollectionChargeEnabled] = useState(false)

  useEffect(() => {
    async function loadMerchantProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        if (user.email) setEmail(user.email)

        // Fetch merchant row
        const { data: merchant } = await supabase
          .from('merchants')
          .select('*')
          .eq('id', user.id)
          .single()

        if (merchant) {
          setBusinessName(merchant.business_name)
          if (merchant.contact_phone) setPhoneNumber(merchant.contact_phone)
          if (merchant.kyc_status) setKycStatus(merchant.kyc_status)
        }

        const savedAcc = localStorage.getItem('merchant_account_number')
        if (savedAcc) setAccountNumber(savedAcc)

        const savedCode = localStorage.getItem('merchant_code') || '678846'
        setMerchantCode(savedCode)
      }
    }
    loadMerchantProfile()
  }, [])

  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = (text: string, label: string, fieldId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldId)
    if (window.showToast) {
      window.showToast(`${label} copied to clipboard`, 'success')
    } else {
      alert(`${label} copied to clipboard!`)
    }
    setTimeout(() => {
      setCopiedField(null)
    }, 1500)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    const { error } = await supabase
      .from('merchants')
      .update({
        contact_phone: phoneNumber
      })
      .eq('id', userId)

    if (error) {
      const friendlyMsg = sanitizeError(error).userMessage
      if (window.showToast) window.showToast(friendlyMsg, 'error')
      else alert(friendlyMsg)
      return
    }

    if (window.showToast) {
      window.showToast('Business information updated successfully', 'success')
    } else {
      alert('Business information updated successfully!')
    }
  }

  if (showDownloadScreen) {
    return (
      <div className="space-y-6">
        {/* Header Panel */}
        <div className="card bg-white p-6 border border-neutral-200/80 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-6 relative min-h-[500px]">
          <button
            onClick={() => setShowDownloadScreen(false)}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none"
          >
            <X size={20} />
          </button>

          {/* Real Lapterpay Logo */}
          <img src="/lapterpay.png" alt="Lapterpay Logo" className="h-10 object-contain drop-shadow-xs" />

          <div className="space-y-2">
            <h2 className="text-lg font-black text-neutral-905">Download Lapterpay</h2>
            <p className="text-xs text-neutral-500 max-w-sm">
              Scan to download on your phone, or tap the store button for your device.
            </p>
          </div>

          {/* QR Code Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg mt-4">
            {/* iOS */}
            <div className="border border-neutral-200 rounded-2xl p-5 flex flex-col items-center gap-4 bg-white shadow-3xs">
              <div className="flex flex-col items-center">
                <i className="fa-brands fa-apple text-2xl text-neutral-800"></i>
                <span className="text-xs font-bold text-neutral-850 mt-1">iPhone & iPad</span>
                <span className="text-[10px] text-neutral-400">Scan to download</span>
              </div>
              <div className="w-32 h-32 border border-neutral-200 rounded-2xl flex items-center justify-center p-2">
                {/* Simulated QR code vector */}
                <div className="w-full h-full bg-neutral-100 flex items-center justify-center relative rounded overflow-hidden">
                  <div className="absolute inset-2 border-2 border-dashed border-neutral-300"></div>
                  <i className="fa-solid fa-qrcode text-5xl text-neutral-450"></i>
                </div>
              </div>
              <a 
                href="https://apps.apple.com" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  if (window.showToast) {
                    window.showToast("Redirecting to App Store...", "success");
                  }
                }}
                className="w-full py-2.5 bg-black hover:bg-neutral-850 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-md transform hover:-translate-y-0.5"
              >
                <i className="fa-brands fa-apple text-lg"></i>
                <div className="text-left leading-tight">
                  <div className="text-[9px] font-normal text-neutral-300">Download on the</div>
                  <div className="text-xs font-bold font-sans">App Store</div>
                </div>
              </a>
            </div>

            {/* Android */}
            <div className="border border-neutral-200 rounded-2xl p-5 flex flex-col items-center gap-4 bg-white shadow-3xs">
              <div className="flex flex-col items-center">
                <i className="fa-brands fa-android text-2xl text-emerald-600"></i>
                <span className="text-xs font-bold text-neutral-850 mt-1">Android</span>
                <span className="text-[10px] text-neutral-400">Scan to download</span>
              </div>
              <div className="w-32 h-32 border border-neutral-200 rounded-2xl flex items-center justify-center p-2">
                <div className="w-full h-full bg-neutral-100 flex items-center justify-center relative rounded overflow-hidden">
                  <div className="absolute inset-2 border-2 border-dashed border-neutral-300"></div>
                  <i className="fa-solid fa-qrcode text-5xl text-neutral-450"></i>
                </div>
              </div>
              <a 
                href="https://play.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  if (window.showToast) {
                    window.showToast("Redirecting to Play Store...", "success");
                  }
                }}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-md transform hover:-translate-y-0.5"
              >
                <i className="fa-brands fa-google-play text-emerald-400 text-base"></i>
                <div className="text-left leading-tight">
                  <div className="text-[9px] font-normal text-neutral-300">GET IT ON</div>
                  <div className="text-xs font-bold font-sans">Google Play</div>
                </div>
              </a>
            </div>
          </div>

          <div className="text-[10px] text-neutral-400 pt-4">
            © 2026 Lapterpay. All rights reserved.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h2 className="text-base font-semibold text-neutral-900">
          Business Information
          <span className="ml-2.5 bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
            KYC: {kycStatus}
          </span>
        </h2>
        <p className="text-xs text-neutral-400 mt-0.5">Manage your business details and settings</p>
      </div>

      {/* Promotional Banner */}
      {showPromo && (
        <div className="p-4 bg-blue-900 text-white rounded-2xl flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/15">
              <i className="fa-solid fa-mobile-screen-button text-sm"></i>
            </div>
            <div>
              <h4 className="text-xs font-bold">Log in on the Lapterpay app</h4>
              <p className="text-[11px] text-blue-200 mt-0.5 max-w-md leading-relaxed">
                Download the app for iPhone or Android and sign in with the same email and password you use on the web.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pr-8">
            <button 
              onClick={() => {
                if (window.showToast) {
                  window.showToast("Redirecting to App Store...", "success");
                }
              }}
              className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-2.5 py-1.5 text-[10px] font-bold flex items-center gap-1.5 transition-all"
            >
              <i className="fa-brands fa-apple"></i> App Store
            </button>
            <button 
              onClick={() => {
                if (window.showToast) {
                  window.showToast("Redirecting to Google Play...", "success");
                }
              }}
              className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-2.5 py-1.5 text-[10px] font-bold flex items-center gap-1.5 transition-all"
            >
              <i className="fa-brands fa-google-play"></i> Google Play
            </button>
            <button 
              onClick={() => setShowDownloadScreen(true)}
              className="bg-white/10 hover:bg-white/20 border border-white/25 rounded-full px-2.5 py-1.5 text-[10px] font-bold transition-all"
            >
              Scan to download
            </button>
          </div>

          <button 
            onClick={() => setShowPromo(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="card bg-white p-6 border border-neutral-200/80 rounded-2xl shadow-sm">
        <form onSubmit={handleUpdate} className="space-y-6">
          
          {/* Logo uploader - Modern Lapter layout */}
          <div className="relative border border-neutral-200/85 rounded-2xl p-6 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-6 shadow-2xs">
            <div className="relative w-20 h-20 rounded-full border-4 border-white bg-white flex items-center justify-center shrink-0 shadow-md overflow-hidden group">
              {logoPreview ? (
                <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-450 font-bold text-xl uppercase select-none">
                  {businessName ? businessName.charAt(0) : 'T'}
                </div>
              )}
              {/* Overlay on hover */}
              <label className="absolute inset-0 bg-black/45 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <i className="fa-solid fa-camera text-white text-xs"></i>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setLogoFile(e.target.files[0])
                      setLogoPreview(URL.createObjectURL(e.target.files[0]))
                      if (window.showToast) {
                        window.showToast('Logo file selected successfully', 'success')
                      }
                    }
                  }}
                />
              </label>
            </div>
            
            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <span className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">Business logo</span>
              <p className="text-[11px] text-neutral-500 max-w-sm leading-relaxed">
                Upload a high-quality logo for your checkout pages. Recommended size: 256x256 px.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1.5">
                <label className="cursor-pointer bg-brand-600 hover:bg-brand-700 text-white rounded-full px-4 py-1.5 text-[10px] font-bold shadow-3xs transition-all hover:scale-102 active:scale-98">
                  Upload Logo
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setLogoFile(e.target.files[0])
                        setLogoPreview(URL.createObjectURL(e.target.files[0]))
                        if (window.showToast) {
                          window.showToast('Logo file selected successfully', 'success')
                        }
                      }
                    }}
                  />
                </label>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null)
                      setLogoPreview('')
                      if (window.showToast) {
                        window.showToast('Logo removed', 'success')
                      }
                    }}
                    className="bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-full px-3 py-1.5 text-[10px] font-bold transition-all hover:scale-102 active:scale-98"
                  >
                    Remove
                  </button>
                )}
                <span className="text-[10px] text-neutral-450 truncate max-w-[150px]" title={logoFile?.name}>
                  {logoFile ? logoFile.name : 'No file chosen'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Business Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-550 mb-1.5">Business Name</label>
              <input 
                type="text"
                disabled
                value={businessName}
                className="input bg-neutral-50 border-neutral-200 text-neutral-450 cursor-not-allowed"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Business name cannot be changed. Contact support if needed.
              </span>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-neutral-550 mb-1.5">Email Address *</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-neutral-550 mb-1.5">Phone Number</label>
              <input 
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="input"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-bold text-neutral-550 mb-1.5">Account Number</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  disabled
                  value={accountNumber}
                  className="input bg-neutral-50 border-neutral-200 text-neutral-600"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(accountNumber, 'Account Number', 'account_number')}
                  className="p-1.5 bg-transparent border-0 text-neutral-400 hover:text-neutral-600 hover:scale-110 transition-all shrink-0 flex items-center justify-center focus:outline-none"
                  title="Copy Account Number"
                >
                  {copiedField === 'account_number' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Merchant Code */}
            <div>
              <label className="block text-xs font-bold text-neutral-550 mb-1.5">Merchant Code</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  disabled
                  value={merchantCode}
                  className="input bg-neutral-50 border-neutral-200 text-neutral-600"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(merchantCode, 'Merchant Code', 'merchant_code')}
                  className="p-1.5 bg-transparent border-0 text-neutral-400 hover:text-neutral-600 hover:scale-110 transition-all shrink-0 flex items-center justify-center focus:outline-none"
                  title="Copy Merchant Code"
                >
                  {copiedField === 'merchant_code' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 block leading-normal">
                WhatsApp pay-merchant requests require this business account number and this merchant code together.
              </span>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-neutral-550 mb-1.5">Address</label>
              <textarea 
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input"
              />
            </div>

            {/* Warning tag info box */}
            <div className="md:col-span-2 p-3 bg-blue-50/50 border border-blue-200 rounded-2xl text-[11px] text-blue-805 flex justify-between items-center gap-3">
              <span className="leading-relaxed">
                Want a custom merchant code? Replace your auto-generated code with a memorable one for your brand. One-time fee of <span className="font-bold">UGX 50,000/=</span>.
              </span>
              <span className="text-blue-650 hover:underline font-bold shrink-0 cursor-pointer">
                Get It →
              </span>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-3 border-b border-neutral-100 pb-5">
            <button 
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-bold shadow-sm transition-all"
            >
              Update Information
            </button>
          </div>
        </form>
        <div className="mt-6 space-y-4">
          
          {/* Toggle 1 */}
          <div className="p-4 border border-blue-100 bg-blue-50/30 rounded-2xl flex items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <h4 className="font-bold text-neutral-800">Lapterpay App Login</h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Allow your team to log in to the Lapterpay mobile app using their existing user accounts.
              </p>
              <p className="text-[10px] text-neutral-400">
                When enabled, users under this business can authenticate with the app. You can revoke access at any time.
              </p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={appLoginEnabled} 
                onChange={(e) => setAppLoginEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-neutral-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2 text-[10px] font-bold text-neutral-505 w-12">{appLoginEnabled ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>

          {/* Toggle 2 */}
          <div className="p-4 border border-emerald-100 bg-emerald-50/30 rounded-2xl flex items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <h4 className="font-bold text-neutral-805 flex items-center gap-1">
                <i className="fa-brands fa-whatsapp text-emerald-600"></i>
                Lapterpay on WhatsApp
              </h4>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Allow your customers to pay you via WhatsApp. Make sure your <span className="text-blue-600 underline cursor-pointer">profile phone number</span> is set. <span className="text-blue-600 underline cursor-pointer">Start a conversation here.</span>
              </p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={whatsappEnabled} 
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-neutral-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2 text-[10px] font-bold text-neutral-505 w-12">{whatsappEnabled ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>

          {/* Toggle 3 */}
          <div className="p-4 border border-blue-100 bg-blue-50/30 rounded-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-neutral-800">Collection Charge Settings</h4>
                <p className="text-[11px] text-neutral-500 leading-relaxed">
                  Control how collection charges are handled. <span className="font-bold text-neutral-750">Changes save instantly!</span>
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={collectionChargeEnabled} 
                  onChange={(e) => setCollectionChargeEnabled(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-neutral-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-[10px] font-bold text-neutral-505 w-12">{collectionChargeEnabled ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>

            <div className="p-3 bg-white border border-neutral-200 rounded-2xl text-[11px] text-neutral-550 leading-relaxed">
              <div>
                Current Setting: <span className="font-bold text-neutral-700">Collection charges are deducted from your business account per transaction (default behavior).</span>
              </div>
              <div className="text-emerald-600 font-semibold mt-1">
                ✓ Click the toggle above - it saves immediately!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
