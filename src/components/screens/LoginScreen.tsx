/**
 * LoginScreen — OTP-based, Password-based, and Google OAuth sign-in.
 * Matches the CareBox design: teal gradient hero, Poppins typography.
 * Includes Demo Mode bypass for instant access without credentials.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Pill, Heart, Mail, ArrowRight, Loader2, Shield, Smartphone, KeyRound, Sparkles } from 'lucide-react';
import {
  signInWithEmailOTP,
  verifyEmailOTP,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword
} from '../../lib/authService';
import { useAuth } from '../../context/AuthContext';
import { IS_SUPABASE_CONFIGURED } from '../../lib/supabase';
import { sanitizeEmail, globalClientRateLimiter } from '../../lib/security';

type LoginStep = 'entry' | 'otp' | 'loading';
type AuthMethod = 'otp' | 'password';

const LoginScreen: React.FC = () => {
  const { isDemoMode, loginAsDemoUser, setAuthStep } = useAuth();
  const [loginStep, setLoginStep] = useState<LoginStep>('entry');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('otp');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Demo bypass: works 100% of the time, even with Supabase configured
  const handleDemoContinue = () => {
    loginAsDemoUser();
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

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
      setLoginStep('otp');
      return;
    }

    setLoginStep('loading');
    const { error: sendError } = await signInWithEmailOTP(cleanEmail);
    if (sendError) {
      setError(sendError);
      setLoginStep('entry');
    } else {
      setSuccessMsg(`We sent a code / magic link to ${cleanEmail}`);
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
      setTimeout(() => loginAsDemoUser(), 800);
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

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const { isValid, sanitized } = sanitizeEmail(email);
    if (!isValid) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoginStep('loading');

    if (isSignUp) {
      const { user, error: signUpError } = await signUpWithPassword(sanitized, password);
      if (signUpError) {
        setError(signUpError);
        setLoginStep('entry');
      } else if (user) {
        setSuccessMsg('Account created successfully! Signing you in...');
        setAuthStep('consent');
      } else {
        setSuccessMsg('Sign-up initiated! If email confirmation is required, please check your inbox.');
        setLoginStep('entry');
      }
    } else {
      const { user, error: signInError } = await signInWithPassword(sanitized, password);
      if (signInError) {
        setError(signInError);
        setLoginStep('entry');
      } else if (user) {
        setAuthStep('consent');
      }
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
  };

  const handleOTPInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otpDigits];
    updated[index] = value.slice(-1);
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
      <div className="relative z-10 flex flex-col items-center pt-12 pb-6 px-6">
        <div className="relative mb-3">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
            <Pill className="w-8 h-8 text-amber-400" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
            <Heart className="w-2.5 h-2.5 text-white fill-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white font-poppins tracking-tight">CareBox</h1>
        <p className="text-teal-200 text-xs mt-0.5 font-inter">Family Medicine Companion</p>
      </div>

      {/* Card */}
      <div className="relative z-10 flex-1 flex flex-col justify-start px-4 pb-8 max-w-sm mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full">

          {/* Loading State */}
          {loginStep === 'loading' && (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-3" />
              <p className="text-slate-600 font-inter text-sm">Connecting to CareBox...</p>
            </div>
          )}

          {/* Main Entry */}
          {loginStep === 'entry' && (
            <>
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 font-poppins">Welcome back</h2>
                <p className="text-slate-500 text-xs mt-1 font-inter">
                  Sign in to see how Mom is doing today.
                </p>
              </div>

              {/* Method Switcher Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-inter font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => { setAuthMethod('otp'); setError(null); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMethod === 'otp' ? 'bg-white text-teal-700 shadow-sm font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('password'); setError(null); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMethod === 'password' ? 'bg-white text-teal-700 shadow-sm font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Password
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-inter leading-relaxed">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-inter leading-relaxed">
                  {successMsg}
                </div>
              )}

              {/* Email OTP Form */}
              {authMethod === 'otp' && (
                <form onSubmit={handleSendOTP} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-teal-500" />
                    <input
                      id="email-input"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-inter text-sm placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm font-poppins shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    Send one-time code <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Password Form */}
              {authMethod === 'password' && (
                <form onSubmit={handlePasswordAuth} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-teal-500" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-inter text-sm placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-teal-500" />
                    <input
                      type="password"
                      placeholder="Password (min 6 chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-inter text-sm placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm font-poppins shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                      className="text-xs text-teal-700 hover:underline font-inter"
                    >
                      {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                  </div>
                </form>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-slate-400 text-[11px] font-inter">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-2.5 border border-slate-200 rounded-xl text-slate-700 font-inter text-xs font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Continue with Google
              </button>

              {/* Instant Demo Access Button — Always available */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDemoContinue}
                  className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-medium text-xs font-inter transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Continue as Demo User (Instant Test) →
                </button>
              </div>

              {/* Trust badges */}
              <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-slate-400 font-inter">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> DPDP Private</span>
                <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Status only</span>
              </div>
            </>
          )}

          {/* OTP Verification */}
          {loginStep === 'otp' && (
            <>
              <div className="text-center mb-5">
                <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-5 h-5 text-teal-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 font-poppins">Check your inbox</h2>
                <p className="text-slate-500 text-xs mt-1 font-inter">
                  {isDemoMode
                    ? 'Enter any 6 digits to continue in demo mode.'
                    : `We sent a code to ${email}`}
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="flex gap-1.5 justify-center">
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
                      className="w-10 h-11 text-center text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl font-poppins focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all"
                      aria-label={`OTP digit ${i + 1}`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-amber-600 text-xs font-inter bg-amber-50 px-3 py-2 rounded-lg text-center leading-relaxed">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold text-sm font-poppins shadow-md hover:shadow-lg transition-all"
                >
                  Verify & Continue
                </button>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setLoginStep('entry'); setError(null); setOtpDigits(['', '', '', '', '', '']); }}
                    className="w-full py-1 text-slate-500 text-xs font-inter hover:text-teal-600 transition-colors"
                  >
                    ← Back to email
                  </button>
                  <button
                    type="button"
                    onClick={handleDemoContinue}
                    className="w-full py-2 bg-slate-50 text-slate-600 text-xs rounded-lg hover:bg-slate-100 font-inter"
                  >
                    Skip and continue as Demo User →
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-teal-300/70 text-[11px] font-inter mt-4 px-4 leading-relaxed">
          By continuing, you agree to CareBox's Terms and Privacy Policy. We never share your family's health data.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
