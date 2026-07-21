import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { Reveal } from '../../components/Reveal';

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<'individual' | 'business' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otpCode: '',
  });

  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [phoneError, setPhoneError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Password rules checks
  const hasMinLength = form.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(form.password);
  const hasNumber = /[0-9]/.test(form.password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(form.password);

  const getPasswordStrength = () => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;
    return score;
  };

  const strengthScore = getPasswordStrength();

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    // Ensure at least one of each required type
    pass += 'A';
    pass += '1';
    pass += '@';
    for (let i = 0; i < 9; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Shuffle
    pass = pass.split('').sort(() => 0.5 - Math.random()).join('');
    setForm(f => ({ ...f, password: pass, confirmPassword: pass }));
  };

  // Simple resend cooldown so users can't hammer the email-send endpoint
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  const sendVerificationCode = async () => {
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      setFormErrors(e => ({ ...e, email: 'Enter a valid email address first' }));
      return;
    }
    setFormErrors(e => {
      const copy = { ...e };
      delete copy.email;
      return copy;
    });
    setOtpError('');
    setOtpLoading(true);

    // Real email OTP via Supabase Auth (requires the "Magic Link" email
    // template in the Supabase dashboard to include {{ .Token }} so the
    // user receives an actual 6-digit code rather than only a link).
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: { shouldCreateUser: true },
    });

    setOtpLoading(false);

    if (error) {
      setOtpError(error.message || 'Could not send the verification code. Please try again.');
      return;
    }

    setOtpSent(true);
    setOtpCooldown(45);
    setForm(f => ({ ...f, otpCode: '' }));
  };

  const handleEmailVerifyInit = () => {
    void sendVerificationCode();
  };

  const handleResendCode = () => {
    if (otpCooldown > 0 || otpLoading) return;
    void sendVerificationCode();
  };

  const handleOtpConfirm = async () => {
    if (!form.otpCode || form.otpCode.trim().length < 6) {
      setOtpError('Enter the 6-digit code sent to your email.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    const { data, error } = await supabase.auth.verifyOtp({
      email: form.email,
      token: form.otpCode.trim(),
      type: 'email',
    });

    if (error || !data.user) {
      setOtpLoading(false);
      setOtpError(error?.message || 'Invalid or expired code. Please try again.');
      return;
    }

    // Guard against re-registration: if a merchant profile already exists
    // for this (now authenticated) user, this email already has a live
    // account — don't let this flow overwrite it. Send them to sign in.
    const { data: existingMerchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle();

    if (existingMerchant) {
      await supabase.auth.signOut();
      setOtpLoading(false);
      setOtpError('This email already has a LapterPay account. Please sign in instead.');
      setOtpSent(false);
      return;
    }

    setOtpLoading(false);
    setEmailVerified(true);
    setOtpSent(false);
    setOtpError('');
  };

  const handlePhoneChange = (val: string) => {
    setForm(f => ({ ...f, phone: val }));
    if (val === '+256763721005') {
      setPhoneError('The business phone has already been taken.');
    } else {
      setPhoneError('');
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!form.fullName) errs.fullName = 'Full Name is required';
    if (!form.email) errs.email = 'Email Address is required';
    else if (!emailVerified) errs.email = 'Please verify your email address';
    if (!form.phone) errs.phone = 'Phone number is required';
    else if (phoneError) errs.phone = phoneError;
    if (!form.password) errs.password = 'Password is required';
    else if (strengthScore < 4) errs.password = 'Password must meet all strength requirements';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);

    // The user is already authenticated at this point (email OTP verified
    // in step 2 created a real Supabase Auth session). Now lock in the
    // password they chose and attach their profile metadata to that account.
    const { data: userData, error: updateError } = await supabase.auth.updateUser({
      password: form.password,
      data: {
        business_name: form.fullName + ' Enterprises',
        contact_phone: form.phone,
        business_type: accountType,
      },
    });

    if (updateError || !userData.user) {
      setFormErrors({ password: updateError?.message || 'Failed to secure your account. Please try again.' });
      setLoading(false);
      return;
    }

    // Insert the real merchant profile record. A DB trigger auto-generates
    // a unique account number and provisions the sandbox wallet on insert.
    const { data: merchantRow, error: dbError } = await supabase
      .from('merchants')
      .upsert({
        id: userData.user.id,
        business_name: form.fullName + ' Enterprises',
        business_type: accountType,
        contact_phone: form.phone,
        currency: 'UGX',
        kyc_status: 'pending',
      })
      .select()
      .single();

    if (dbError || !merchantRow) {
      setFormErrors({ email: dbError?.message || 'Failed to initialize merchant database profile.' });
      setLoading(false);
      return;
    }

    setLoading(false);

    // Cache the real, database-issued values for pages that read a quick
    // merchant summary from localStorage instead of re-querying Supabase.
    localStorage.setItem('merchant_business_name', merchantRow.business_name);
    localStorage.setItem('merchant_account_number', merchantRow.account_number ?? '');
    localStorage.setItem('merchant_email', form.email);
    localStorage.setItem('merchant_phone', merchantRow.contact_phone ?? '');
    localStorage.setItem('merchant_account_type', merchantRow.business_type || 'individual');
    localStorage.setItem('kyc_status', 'pending_agreement'); // Start KYC onboarding

    // Fire-and-forget: don't block navigation on email delivery. If SMTP
    // isn't configured yet, the backend just logs the attempt instead of
    // failing the request.
    api.sendWelcomeEmail().catch(() => {});

    navigate('/dashboard/business-documents'); // Direct them to document setup wizard!
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
    >
      <div className="bg-orb w-[380px] h-[380px] -top-24 -right-24 bg-red-600/20 animate-orb-drift" />
      <div className="bg-orb w-[300px] h-[300px] -bottom-24 -left-16 bg-red-500/10 animate-orb-drift-slow" />

      <Reveal variant="scale" className="relative z-10 w-full max-w-3xl space-y-6">
        {/* Card Box (Solid White, No Glassmorphism, Logo + Stepper + Form in one container) */}
        <div className="w-full bg-white rounded-3xl border border-neutral-200 shadow-2xl p-8 md:p-10">
          
          {/* Brand logo */}
          <div className="flex justify-center mb-6">
            <Link to="/">
              <img src="/lapterpay.png" alt="Lapter Pay" className="h-10 object-contain" />
            </Link>
          </div>

          {/* Progress Stepper */}
          <div className="w-full flex items-center justify-center mb-8">
            <div className="flex items-center gap-3 bg-neutral-50 px-6 py-2.5 rounded-full border border-neutral-200">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= 1 ? 'bg-[#0022a6] text-white' : 'bg-neutral-200 text-neutral-500'
                }`}>
                  1
                </span>
                <span className={`text-xs font-semibold ${step >= 1 ? 'text-[#0022a6]' : 'text-neutral-500'}`}>
                  Account Type
                </span>
              </div>
              <div className="w-12 h-px bg-neutral-300" />
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= 2 ? 'bg-[#0022a6] text-white' : 'bg-neutral-200 text-neutral-500'
                }`}>
                  2
                </span>
                <span className={`text-xs font-semibold ${step >= 2 ? 'text-[#0022a6]' : 'text-neutral-500'}`}>
                  Your Details
                </span>
              </div>
            </div>
          </div>

          {/* STEP 1: ACCOUNT TYPE */}
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                <h2 className="text-2xl font-normal text-neutral-900">Choose account type</h2>
                <p className="text-sm text-neutral-500 mt-2">Select the type of account you want to create</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Individual Account Card */}
                <div 
                  onClick={() => setAccountType('individual')}
                  className={`border rounded-2xl p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-md relative text-neutral-900 ${
                    accountType === 'individual' 
                      ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-600' 
                      : 'border-neutral-200 hover:bg-neutral-50/50 bg-white'
                  }`}
                >
                  {accountType === 'individual' && (
                    <div className="absolute top-4 right-4 text-blue-600 text-lg">
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        accountType === 'individual' ? 'bg-blue-100 text-blue-600' : 'bg-neutral-100 text-neutral-550'
                      }`}>
                        <i className="fa-solid fa-user text-sm"></i>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-neutral-900">Individual account</h3>
                        <p className="text-xs text-neutral-500">For freelancers and sole proprietors</p>
                      </div>
                    </div>
                    <div className="border-t pt-4 space-y-3 border-neutral-100">
                      <span className="text-xs font-semibold block text-neutral-550">Requirements:</span>
                      <ul className="space-y-2 text-xs text-neutral-600">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-650" />
                          Copy of National ID/Passport
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-650" />
                          Proof of address
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Business Account Card */}
                <div 
                  onClick={() => setAccountType('business')}
                  className={`border rounded-2xl p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-md relative text-neutral-900 ${
                    accountType === 'business' 
                      ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-600' 
                      : 'border-neutral-200 hover:bg-neutral-50/50 bg-white'
                  }`}
                >
                  {accountType === 'business' && (
                    <div className="absolute top-4 right-4 text-blue-600 text-lg">
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        accountType === 'business' ? 'bg-blue-100 text-blue-600' : 'bg-neutral-100 text-neutral-550'
                      }`}>
                        <i className="fa-solid fa-building text-sm"></i>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-neutral-900">Business account</h3>
                        <p className="text-xs text-neutral-500">For companies and organisations</p>
                      </div>
                    </div>
                    <div className="border-t pt-4 space-y-2 border-neutral-100">
                      <span className="text-xs font-semibold block text-neutral-550">Requirements:</span>
                      <ul className="space-y-1 text-xs text-neutral-650">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-650" />
                          Certificate of incorporation
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-650" />
                          Memorandum of association (MoA)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-650" />
                          Shareholding structure / register
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-650" />
                          Proof of address
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

              {/* Continue Button */}
              <div className="pt-6">
                <button
                  type="button"
                  disabled={!accountType}
                  onClick={() => setStep(2)}
                  className={`w-full py-3.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow ${
                    accountType
                      ? 'btn-shimmer bg-red-600 hover:bg-red-700 text-white cursor-pointer active:scale-98 border-0 hover:scale-[1.02]'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed border-0'
                  }`}
                >
                  <span>Continue</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CREATE YOUR ACCOUNT */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h2 className="text-3xl font-medium text-neutral-900">Create your account</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-xs text-neutral-500 capitalize">{accountType} Account</span>
                  <span className="text-neutral-300 text-xs">•</span>
                  <button 
                    type="button"
                    onClick={() => { setStep(1); setEmailVerified(false); setOtpSent(false); }}
                    className="text-xs text-red-600 font-semibold hover:underline bg-transparent border-0 outline-none"
                  >
                    Change
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-5">
                
                {/* Full Name */}
                <div>
                  <label className="block text-sm sm:text-base text-neutral-600 mb-1.5 font-normal">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    className={`w-full px-4 py-3 text-sm sm:text-base border rounded-xl bg-neutral-50 focus:outline-none focus:ring-0 focus:border-neutral-300 transition-none ${
                      formErrors.fullName ? 'border-red-500' : 'border-neutral-300'
                    }`}
                  />
                  {formErrors.fullName && <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>}
                </div>

                {/* Email Address with Verify inside */}
                <div>
                  <label className="block text-sm sm:text-base text-neutral-600 mb-1.5 font-normal">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="name@email.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      disabled={emailVerified}
                      className={`w-full px-4 py-3 pr-20 text-sm sm:text-base border rounded-xl bg-neutral-50 focus:outline-none focus:ring-0 focus:border-neutral-300 transition-none ${
                        formErrors.email ? 'border-red-500' : 'border-neutral-300'
                      } ${emailVerified ? 'bg-emerald-50/30 border-emerald-300 text-emerald-800' : ''}`}
                    />
                    {!emailVerified ? (
                      <button
                        type="button"
                        onClick={handleEmailVerifyInit}
                        disabled={otpLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold py-1.5 px-3 rounded-lg border border-neutral-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {otpLoading && !otpSent ? (
                          <i className="fa-solid fa-spinner animate-spin"></i>
                        ) : (
                          'VERIFY'
                        )}
                      </button>
                    ) : (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-bold flex items-center gap-1">
                        <i className="fa-solid fa-circle-check"></i> Verified
                      </span>
                    )}
                  </div>
                  {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}

                  {/* Real OTP entry, sent via Supabase Auth to the merchant's inbox */}
                  {otpSent && (
                    <div className="mt-3 p-4 border border-brand-100 bg-[#eff6ff] rounded-xl space-y-3 animate-fade-in">
                      <p className="text-xs text-brand-700 font-medium">
                        <i className="fa-regular fa-envelope mr-1.5"></i>
                        We sent a 6-digit verification code to <span className="font-bold">{form.email}</span>. Enter it below.
                      </p>
                      <div className="flex gap-2 flex-wrap items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="6-digit code"
                          value={form.otpCode}
                          onChange={e => setForm(f => ({ ...f, otpCode: e.target.value.replace(/\D/g, '') }))}
                          className="bg-white border border-neutral-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:border-red-650"
                        />
                        <button
                          type="button"
                          onClick={handleOtpConfirm}
                          disabled={otpLoading}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all border-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {otpLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={otpCooldown > 0 || otpLoading}
                          className="text-xs font-semibold text-neutral-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-0 outline-none"
                        >
                          {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend code'}
                        </button>
                      </div>
                      {otpError && <p className="text-xs text-red-500">{otpError}</p>}
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm sm:text-base text-neutral-600 mb-1.5 font-normal">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="+256712345678"
                    value={form.phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    className={`w-full px-4 py-3 text-sm sm:text-base border rounded-xl bg-neutral-50 focus:outline-none focus:ring-0 focus:border-neutral-300 transition-none ${
                      phoneError || formErrors.phone ? 'border-red-500' : 'border-neutral-300'
                    }`}
                  />
                  <p className="text-xs text-neutral-400 mt-1">Uganda: +256 + 9 digits</p>
                  {phoneError && <p className="text-xs text-red-500 mt-1.5 font-semibold">{phoneError}</p>}
                  {!phoneError && formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                </div>

                {/* Passwords */}
                <div className="grid md:grid-cols-2 gap-4">
                  
                  {/* Password */}
                  <div>
                    <label className="block text-sm sm:text-base text-neutral-600 mb-1.5 font-normal">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className={`w-full px-4 py-3 pr-10 text-sm sm:text-base border rounded-xl bg-neutral-50 focus:outline-none focus:ring-0 focus:border-neutral-300 transition-none ${
                          formErrors.password ? 'border-red-500' : 'border-neutral-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-450 hover:text-neutral-600 transition-colors"
                      >
                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm sm:text-base text-neutral-600 mb-1.5 font-normal">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={form.confirmPassword}
                        onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                        className={`w-full px-4 py-3 pr-10 text-sm sm:text-base border rounded-xl bg-neutral-50 focus:outline-none focus:ring-0 focus:border-neutral-300 transition-none ${
                          formErrors.confirmPassword ? 'border-red-500' : 'border-neutral-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-450 hover:text-neutral-600 transition-colors"
                      >
                        <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                      </button>
                    </div>
                    {formErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{formErrors.confirmPassword}</p>}
                  </div>

                </div>

                {/* Password strength details */}
                <div className="space-y-3.5 pt-1.5">
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-xs text-red-650 font-semibold hover:underline flex items-center gap-1.5 cursor-pointer bg-transparent border-0 outline-none"
                  >
                    <i className="fa-solid fa-arrows-rotate text-2xs"></i>
                    <span>Generate strong password</span>
                  </button>

                  {form.password && (
                    <div className="space-y-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl p-4 animate-fade-in">
                      
                      {/* Strength Indicator Bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex gap-1 h-1.5 rounded-full overflow-hidden bg-neutral-200">
                          <div className={`h-full transition-all duration-300 ${
                            strengthScore >= 1 
                              ? strengthScore === 1 ? 'bg-red-500 w-1/4' 
                                : strengthScore === 2 ? 'bg-amber-500 w-2/4'
                                : strengthScore === 3 ? 'bg-yellow-500 w-3/4'
                                : 'bg-emerald-500 w-full'
                              : 'w-0'
                          }`} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          strengthScore === 4 ? 'text-emerald-600' : 'text-neutral-400'
                        }`}>
                          {strengthScore === 4 ? 'Strong' : strengthScore >= 2 ? 'Medium' : 'Weak'}
                        </span>
                      </div>

                      {/* Checkmarks list */}
                      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-semibold">
                        <li className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600' : 'text-neutral-400'}`}>
                          <i className={`fa-solid ${hasMinLength ? 'fa-check text-emerald-500' : 'fa-circle-dot text-neutral-300'} text-[10px]`}></i>
                          <span>At least 8 characters</span>
                        </li>
                        <li className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600' : 'text-neutral-400'}`}>
                          <i className={`fa-solid ${hasUppercase ? 'fa-check text-emerald-500' : 'fa-circle-dot text-neutral-300'} text-[10px]`}></i>
                          <span>Uppercase letter (A-Z)</span>
                        </li>
                        <li className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600' : 'text-neutral-400'}`}>
                          <i className={`fa-solid ${hasNumber ? 'fa-check text-emerald-500' : 'fa-circle-dot text-neutral-300'} text-[10px]`}></i>
                          <span>Number (0-9)</span>
                        </li>
                        <li className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600' : 'text-neutral-400'}`}>
                          <i className={`fa-solid ${hasSpecial ? 'fa-check text-emerald-500' : 'fa-circle-dot text-neutral-300'} text-[10px]`}></i>
                          <span>Special character (!@#$...)</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-neutral-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white hover:bg-neutral-50 text-neutral-700 font-bold border border-neutral-300 py-3.5 rounded-full text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-3.5 rounded-full text-xs transition-all shadow flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed border-0 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin"></i>
                        <span>Registering...</span>
                      </>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>
                </div>

              </form>

              <div className="text-center pt-4 border-t border-neutral-100 text-xs text-neutral-500 font-normal">
                Already have a merchant account?{' '}
                <Link to="/login" className="text-red-600 font-bold hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          )}

        </div>
      </Reveal>
    </div>
  );
}
