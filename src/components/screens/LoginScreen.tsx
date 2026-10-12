/**
 * LoginScreen — OTP-based and Google OAuth sign-in.
 * Matches the CareBox design: teal gradient hero, Poppins typography.
 * Falls back to demo-bypass in Phase 1 mode (no Supabase).
 */
import React, { useState, useRef, useEffect } from 'react';
import { Pill, Heart, Mail, ArrowRight, Loader2, Shield, Smartphone } from 'lucide-react';
import { signInWithEmailOTP, verifyEmailOTP, signInWithGoogle } from '../../lib/authService';
import { useAuth } from '../../context/AuthContext';
import { IS_SUPABASE_CONFIGURED } from '../../lib/supabase';
import { sanitizeEmail, globalClientRateLimiter } from '../../lib/security';

type LoginStep = 'entry' | 'otp' | 'loading';

const LoginScreen: React.FC = () => {
  const { setAuthStep, isDemoMode } = useAuth();
  const [loginStep, setLoginStep] = useState<LoginStep>('entry');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Demo bypass
  const handleDemoContinue = () => {
    setAuthStep('consent');
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!globalClientRateLimiter.canExecute('send_otp', 2000)) {
      setError('Please wait a moment before requesting another code.');
      return;
    }

    const { isValid, sanitized } = sanitizeEmail(email);
    if (!isValid) {
      setError('Please enter a valid email address.');
      return;
    }
    const cleanEmail = sanitized;

    if (!IS_SUPABASE_CONFIGURED) {
      // Demo mode: skip to OTP verify screen with fake token
      setLoginStep('otp');
      return;
    }

    setLoginStep('loading');
    const { error: sendError } = await signInWithEmailOTP(cleanEmail);
    if (sendError) {
      setError(sendError);
      setLoginStep('entry');
    } else {
      setLoginStep('otp');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = otpDigits.join('').replace(/\D/g, '').slice(0, 6);
    if (cleanToken.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError(null);
    setLoginStep('loading');

    if (!IS_SUPABASE_CONFIGURED) {
      // Demo mode — skip auth, proceed to consent
      setTimeout(() => setAuthStep('consent'), 800);
      return;
    }

    const { sanitized: cleanEmail } = sanitizeEmail(email);
    const { error: verifyError } = await verifyEmailOTP(cleanEmail, cleanToken);
    if (verifyError) {
      setError(verifyError);
      setLoginStep('otp');
    } else {
      setAuthStep('consent');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) {
      setError(googleError);
      setIsGoogleLoading(false);
    }
    // If no error, Google OAuth redirects the page — loading state persists
  };

  const handleOTPInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const updated = [...otpDigits];
    updated[index] = value.slice(-1); // take last char
    setOtpDigits(updated);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Auto-focus first OTP box
  useEffect(() => {
    if (loginStep === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [loginStep]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-600/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center pt-16 pb-8 px-6">
        <div className="relative mb-4">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
            <Pill className="w-10 h-10 text-amber-400" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
            <Heart className="w-3 h-3 text-white fill-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white font-poppins tracking-tight">CareBox</h1>
        <p className="text-teal-200 text-sm mt-1 font-inter">Family Medicine Companion</p>
      </div>

      {/* Card */}
      <div className="relative z-10 flex-1 flex flex-col justify-start px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm mx-auto w-full">

          {/* Loading State */}
          {loginStep === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
              <p className="text-slate-600 font-inter text-sm">Verifying…</p>
            </div>
          )}

          {/* Email Entry */}
          {loginStep === 'entry' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 font-poppins">Welcome back</h2>
                <p className="text-slate-500 text-sm mt-1 font-inter">
                  {isDemoMode
                    ? 'Try the app in demo mode, no sign-in needed.'
                    : 'Sign in to see how Mom is doing today.'}
                </p>
              </div>

              {isDemoMode ? (
                <button
                  onClick={handleDemoContinue}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl font-semibold text-base font-poppins shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  Continue as Demo User →
                </button>
              ) : (
                <>
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-teal-500" />
                      <input
                        id="email-input"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-inter text-sm placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                      />
                    </div>
                    {error && (
                      <p className="text-amber-600 text-xs font-inter bg-amber-50 px-3 py-2 rounded-lg">{error}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl font-semibold text-base font-poppins shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      Send one-time code <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>

                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-slate-400 text-xs font-inter">or</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full py-3 border border-slate-200 rounded-2xl text-slate-700 font-inter text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-60"
                  >
                    {isGoogleLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    Continue with Google
                  </button>
                </>
              )}

              {/* Trust badges */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400 font-inter">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> No tracking</span>
                <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Status only</span>
              </div>
            </>
          )}

          {/* OTP Verification */}
          {loginStep === 'otp' && (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-teal-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 font-poppins">Check your inbox</h2>
                <p className="text-slate-500 text-sm mt-1 font-inter">
                  {isDemoMode
                    ? 'Enter any 6 digits to continue in demo mode.'
                    : `We sent a 6-digit code to ${email}`}
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="flex gap-2 justify-center">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPInput(i, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(i, e)}
                      className="w-11 h-12 text-center text-xl font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl font-poppins focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                      aria-label={`OTP digit ${i + 1}`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-amber-600 text-xs font-inter bg-amber-50 px-3 py-2 rounded-lg text-center">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl font-semibold text-base font-poppins shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  Verify & Continue
                </button>

                <button
                  type="button"
                  onClick={() => { setLoginStep('entry'); setError(null); setOtpDigits(['', '', '', '', '', '']); }}
                  className="w-full py-2.5 text-slate-500 text-sm font-inter hover:text-teal-600 transition-colors"
                >
                  ← Back to email
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-teal-300/70 text-xs font-inter mt-6 pb-8 px-6">
          By continuing, you agree to CareBox's Terms of Service and Privacy Policy.
          We never share your family's health data with third parties.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
