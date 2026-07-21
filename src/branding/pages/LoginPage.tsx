import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Reveal } from '../../components/Reveal';

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    
    // 1. Sign in via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    });

    if (authError || !authData.user) {
      setError(authError?.message || 'Invalid email or password.');
      setLoading(false);
      return;
    }

    // 2. Fetch merchant record details
    const { data: merchantData } = await supabase
      .from('merchants')
      .select('business_name, kyc_status, contact_phone')
      .eq('id', authData.user.id)
      .single();

    setLoading(false);
    
    localStorage.setItem('merchant_business_name', merchantData?.business_name || 'My Business');
    localStorage.setItem('merchant_account_number', 'A/C: 201' + Math.floor(10000000 + Math.random() * 90000000));
    localStorage.setItem('merchant_email', form.email);
    localStorage.setItem('merchant_phone', merchantData?.contact_phone || '');
    localStorage.setItem('kyc_status', merchantData?.kyc_status || 'pending');
    
    navigate('/dashboard');
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
    >
      <div className="bg-orb w-[380px] h-[380px] -top-24 -left-24 bg-red-600/20 animate-orb-drift" />
      <div className="bg-orb w-[300px] h-[300px] -bottom-24 -right-16 bg-red-500/10 animate-orb-drift-slow" />

      <Reveal variant="scale" className="relative z-10 w-full max-w-md space-y-6">
        {/* Card Box (Solid White, No Glassmorphism, Logo + Form in one container) */}
        <div className="w-full bg-white rounded-3xl border border-neutral-200 shadow-2xl p-8 md:p-10">
          {/* Brand logo */}
          <div className="flex justify-center mb-6">
            <Link to="/">
              <img src="/tamu.png" alt="Tamu Pay" className="h-10 object-contain" />
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-normal text-neutral-900">Welcome back</h1>
            <p className="text-sm text-neutral-500 mt-2">Sign in to your merchant dashboard</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation text-xs"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Form fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm sm:text-base text-neutral-600 mb-1.5 font-normal">
                Email address
              </label>
              <input
                className="w-full px-4 py-3 text-sm sm:text-base border border-neutral-300 rounded-xl bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-0 focus:border-neutral-300 transition-none"
                type="email"
                placeholder="merchant@yourbusiness.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base text-neutral-600 mb-1.5 font-normal">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 text-sm sm:text-base border border-neutral-300 rounded-xl bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-0 focus:border-neutral-300 pr-10 transition-none"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-650 transition-colors"
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm sm:text-base pt-1">
              <label className="flex items-center gap-2 text-neutral-600 cursor-pointer font-normal">
                <input type="checkbox" className="rounded border-neutral-300 text-[#0022a6] focus:ring-0 font-normal" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-[#0022a6] hover:underline font-normal">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-shimmer w-full bg-[#0022a6] hover:bg-[#001c80] active:bg-[#000f40] text-white text-sm sm:text-base font-normal py-3.5 rounded-full transition-all shadow mt-2 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <i className="fa-solid fa-arrow-right text-2xs"></i>
                </>
              )}
            </button>
          </form>

          {/* Redirect link */}
          <div className="text-center mt-6 text-sm text-neutral-500 border-t border-neutral-100 pt-4 font-normal">
            New to Tamu Pay?{' '}
            <Link to="/register" className="text-[#0022a6] font-normal hover:underline">
              Create a free account
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
