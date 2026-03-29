import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import farmchainxLogo from '../assets/farmchainx-logo.svg';
import { getPortalRouteByRole } from './roleRedirect';

const API_BASE = 'http://localhost:8080';

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: 'CUSTOMER',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const completeAuth = ({ token, role, fullName }) => {
    localStorage.setItem('fcx_token', token);
    localStorage.setItem('fcx_role', role);
    if (fullName) localStorage.setItem('fcx_fullName', fullName);
    navigate(getPortalRouteByRole(role));
  };

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
    setInfo('');
  };

  const extractApiErrorMessage = (err) => {
    const status = err?.response?.status;
    const payload = err?.response?.data;

    if (!err?.response) {
      return 'Cannot reach backend at http://localhost:8080. Please start/restart backend and try again.';
    }
    if (status === 404) {
      return 'Verification API not found. Restart backend so latest auth endpoints are loaded.';
    }
    if (status === 503) {
      return payload?.message || 'Email service unavailable. For local testing, enable code preview fallback.';
    }
    if (typeof payload === 'string' && payload.trim().length > 0) {
      return payload;
    }
    return payload?.message || 'Failed to send verification code. Please try again.';
  };

  const handleSendVerificationEmail = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    
    // Basic email validation
    if (!form.email || !form.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/auth/send-verification-code`, {
        email: form.email,
      });
      setEmailVerificationSent(true);
      setInfo(response?.data?.message || 'Verification code sent.');
    } catch (err) {
      if (err?.response?.status === 409) {
        setError('An account with this email already exists.');
      } else {
        setError(extractApiErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!verificationCode.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    setVerifyingEmail(true);
    try {
      await axios.post(`${API_BASE}/api/auth/verify-email-code`, {
        email: form.email,
        code: verificationCode,
      });
      setInfo('Email verified successfully. You can now create your account.');
      // Email verified successfully, allow form submission
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const renderEyeIcon = (visible) => (visible ? (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Check if email is verified
    if (!emailVerificationSent) {
      setError('Please verify your email address first.');
      return;
    }

    if (!verificationCode.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        verificationCode: verificationCode,
      });
      completeAuth(res.data);
    } catch (err) {
      if (err?.response?.status === 409) {
        setError('An account with this email already exists.');
      } else {
        setError(err?.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setError('Google sign-up was cancelled. Please try again.');
      return;
    }

    setError('');
    setGoogleLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/google`, {
        credential: credentialResponse.credential,
        role: form.role,
        fullName: form.fullName,
        phone: form.phone,
      });
      completeAuth(res.data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('Google sign-in token was rejected. Please verify OAuth client ID and try again.');
      } else if (status === 403) {
        setError('Request blocked by security/CORS. Restart backend and ensure frontend origin is allowed.');
      } else {
        setError(err?.response?.data?.message || 'Google sign-up failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-teal-50 via-emerald-50 to-green-100">
      <aside className="hidden lg:flex w-[42%] relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(110,231,183,0.08),_transparent_40%)]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
          <div className="space-y-12">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <img
                src={farmchainxLogo}
                alt="Farmchainx Logo"
                className="h-12 w-12 rounded-full bg-emerald-700 object-cover"
              />
              <div>
                <p className="text-2xl font-bold text-white">FarmchainX</p>
                <p className="text-sm text-emerald-200">Farm to Table</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
              <h1 className="text-5xl font-bold leading-tight text-white">
                Join Us Today
              </h1>
              <p className="text-lg leading-relaxed text-emerald-100">
                Create your account as a customer, farmer, or delivery partner and start connecting with our ecosystem. Simple registration, powerful possibilities.
              </p>
            </div>

            {/* Simple Feature List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/20">
                  <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">Quick Setup</p>
                  <p className="text-sm text-emerald-200">Get started in just a few minutes</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/20">
                  <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">Multiple Roles</p>
                  <p className="text-sm text-emerald-200">Choose as customer, farmer, or driver</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/20">
                  <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">Verified & Secure</p>
                  <p className="text-sm text-emerald-200">Your data protected with blockchain</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Quote */}
          <div className="border-t border-emerald-400/20 pt-8">
            <p className="italic text-emerald-100">
              "Be part of the agricultural revolution. Join thousands of farmers, customers, and drivers."
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
        <div className="w-full max-w-xl">
          <div className="mb-6 flex items-center gap-3 sm:mb-8 lg:hidden">
            <img
              src={farmchainxLogo}
              alt="Farmchainx Logo"
              className="h-10 w-10 rounded-full bg-emerald-700 object-cover"
            />
            <div>
              <p className="text-xl font-bold tracking-wide text-emerald-950">FarmchainX</p>
              <p className="text-xs text-slate-500">Farmer, Driver & Customer registration</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_24px_90px_-40px_rgba(15,23,42,0.55)] backdrop-blur-sm">
            <div className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50 via-white to-teal-50 px-7 py-6 sm:px-8">
              <div className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 shadow-sm">
                Sign up
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900">Create your account</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Choose your role and enter your details to access the right FarmchainX portal.
              </p>
            </div>

            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <div className="space-y-4">
                {googleEnabled ? (
                  <div className="w-full rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                    <GoogleLogin
                      theme="outline"
                      text="continue_with"
                      shape="pill"
                      width="100%"
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google popup failed. Check Authorized JavaScript origins in Google Cloud and try again.')}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500"
                  >
                    Continue with Google (setup required)
                  </button>
                )}

                {googleLoading && (
                  <p className="text-center text-xs text-slate-500">Signing up with Google...</p>
                )}

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">or continue with email</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Choose role</label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => updateField('role')({ target: { value: 'CUSTOMER' } })}
                      className={`group rounded-2xl border px-4 py-4 text-left transition-all ${
                        form.role === 'CUSTOMER'
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-white shadow-[0_12px_30px_-20px_rgba(16,185,129,0.7)]'
                          : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Customer</p>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500">Browse, buy products and track orders</p>
                        </div>
                        <span className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                          form.role === 'CUSTOMER'
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300 text-slate-400 group-hover:border-emerald-300 group-hover:text-emerald-500'
                        }`}>
                          ✓
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('role')({ target: { value: 'FARMER' } })}
                      className={`group rounded-2xl border px-4 py-4 text-left transition-all ${
                        form.role === 'FARMER'
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-white shadow-[0_12px_30px_-20px_rgba(16,185,129,0.7)]'
                          : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Farmer</p>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500">List products, manage batches and track orders</p>
                        </div>
                        <span className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                          form.role === 'FARMER'
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300 text-slate-400 group-hover:border-emerald-300 group-hover:text-emerald-500'
                        }`}>
                          ✓
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('role')({ target: { value: 'DELIVERY_PARTNER' } })}
                      className={`group rounded-2xl border px-4 py-4 text-left transition-all ${
                        form.role === 'DELIVERY_PARTNER'
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-white shadow-[0_12px_30px_-20px_rgba(16,185,129,0.7)]'
                          : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Driver</p>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500">Accept deliveries, update status and view earnings</p>
                        </div>
                        <span className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                          form.role === 'DELIVERY_PARTNER'
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300 text-slate-400 group-hover:border-emerald-300 group-hover:text-emerald-500'
                        }`}>
                          ✓
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={updateField('fullName')}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={form.email}
                        onChange={updateField('email')}
                        disabled={emailVerificationSent}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-500"
                        placeholder="you@example.com"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleSendVerificationEmail}
                        disabled={emailVerificationSent || loading}
                        className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed"
                      >
                        {emailVerificationSent ? 'Code Sent' : 'Verify'}
                      </button>
                    </div>
                  </div>

                  {/* Email Verification Code Input */}
                  {emailVerificationSent && (
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Verification Code</label>
                      <p className="mb-2 text-xs text-slate-500">Enter the 6-digit code sent to your email</p>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => {
                          setVerificationCode(e.target.value.toUpperCase());
                          setError('');
                        }}
                        maxLength="6"
                        placeholder="000000"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmail}
                        disabled={verifyingEmail || !verificationCode.trim()}
                        className="mt-2 w-full rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        {verifyingEmail ? 'Verifying...' : 'Verify Code'}
                      </button>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={updateField('phone')}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      placeholder="+91 99999 99999"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={updateField('password')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        placeholder="Min. 6 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 transition hover:text-emerald-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {renderEyeIcon(showPassword)}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={updateField('confirmPassword')}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 transition hover:text-emerald-600"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {renderEyeIcon(showConfirmPassword)}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </p>
                )}

                {info && (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {info}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !emailVerificationSent || !verificationCode.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(5,150,105,0.75)] transition hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  )}
                  {loading ? 'Creating account...' : !emailVerificationSent ? 'Verify email to continue' : `Create ${form.role === 'FARMER' ? 'Farmer' : form.role === 'DELIVERY_PARTNER' ? 'Driver' : 'Customer'} Account`}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;

