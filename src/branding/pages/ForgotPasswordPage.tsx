import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    // Trigger Supabase's built-in password reset email directly. We
    // deliberately do NOT pre-check whether the email exists first (the
    // previous version queried a `merchants.email` column that doesn't
    // exist in the schema, so this always errored) — and even if it did
    // exist, revealing "no account found" for unregistered emails is a
    // user-enumeration security hole. Always show the same success state
    // regardless of whether the account exists.
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (resetErr) {
      setError('Failed to send reset email. Please try again in a moment.');
      return;
    }

    setSuccess(true);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
    >
      <div className="bg-orb w-[340px] h-[340px] -top-20 -left-20 bg-red-600/20 animate-orb-drift" />

      <div className="relative z-10 w-full max-w-md">
        <div className="w-full bg-white rounded-3xl border border-neutral-200 shadow-2xl p-8 md:p-10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link to="/">
              <img src="/lapterpay.png" alt="LapterPay" className="h-10 object-contain" />
            </Link>
          </div>

          {success ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto">
                <i className="fa-solid fa-envelope-circle-check text-green-500 text-2xl" />
              </div>
              <h1 className="text-2xl font-normal text-neutral-900">Check your email</h1>
              <p className="text-sm text-neutral-500 leading-relaxed">
                We sent a password reset link to <strong className="text-neutral-700">{email}</strong>.
                Click the link in the email to reset your password.
              </p>
              <p className="text-xs text-neutral-400">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="text-[#0022a6] hover:underline"
                >
                  try again
                </button>.
              </p>
              <Link
                to="/login"
                className="block w-full bg-[#0022a6] hover:bg-[#001c80] text-white text-sm font-normal py-3.5 rounded-xl transition-all text-center mt-2"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-normal text-neutral-900">Forgot your password?</h1>
                <p className="text-sm text-neutral-500 mt-2">
                  Enter your registered email address and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation text-xs" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1.5 font-normal">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="merchant@yourbusiness.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 text-sm border border-neutral-300 rounded-xl bg-neutral-50 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-0 focus:border-neutral-350 transition-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0022a6] hover:bg-[#001c80] active:bg-[#000f40] text-white text-sm font-normal py-3.5 rounded-xl transition-all shadow mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin text-xs" />
                      <span>Checking account...</span>
                    </>
                  ) : (
                    <>
                      <span>Send reset link</span>
                      <i className="fa-solid fa-arrow-right text-xs" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-6 text-sm text-neutral-500 border-t border-neutral-100 pt-4">
                Remember your password?{' '}
                <Link to="/login" className="text-[#0022a6] hover:underline font-normal">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
