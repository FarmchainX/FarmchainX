import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import farmchainxLogo from '../assets/farmchainx-logo.svg';
import { getPortalRouteByRole } from './roleRedirect';

const API_BASE = 'http://localhost:8080';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('accountDeleted') === '1') {
      setSuccess('Your account was deleted successfully. You can register again anytime.');
      params.delete('accountDeleted');
      const nextQuery = params.toString();
      navigate({ pathname: location.pathname, search: nextQuery ? `?${nextQuery}` : '' }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const completeAuth = ({ token, role, fullName }) => {
    localStorage.setItem('fcx_token', token);
    localStorage.setItem('fcx_role', role);
    if (fullName) {
      localStorage.setItem('fcx_fullName', fullName);
    }
    navigate(getPortalRouteByRole(role));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password,
      });
      completeAuth(res.data);
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setError('Google sign-in was cancelled. Please try again.');
      return;
    }

    setError('');
    setGoogleLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/google`, {
        credential: credentialResponse.credential,
      });
      completeAuth(res.data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('Google sign-in token was rejected. Please verify OAuth client ID and try again.');
      } else if (status === 403) {
        setError('Request blocked by security/CORS. Restart backend and ensure frontend origin is allowed.');
      } else {
        setError(err?.response?.data?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const eyeIcon = showPassword ? (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

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
                Welcome Back
              </h1>
              <p className="text-lg leading-relaxed text-emerald-100">
                Sign in to your account and access your personalized farmer, customer, or delivery partner portal with real-time updates and seamless management.
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
                  <p className="font-semibold text-white">Secure & Fast</p>
                  <p className="text-sm text-emerald-200">Quick role-based access to your portal</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/20">
                  <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">Real-Time Updates</p>
                  <p className="text-sm text-emerald-200">Live notifications and order tracking</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/20">
                  <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">All-in-One Platform</p>
                  <p className="text-sm text-emerald-200">Manage products, orders, and deliveries</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Quote */}
          <div className="border-t border-emerald-400/20 pt-8">
            <p className="italic text-emerald-100">
              "Connecting farmers and consumers through transparent, blockchain-verified agriculture."
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
              <p className="text-xs text-slate-500">Farmer, Driver & Customer login</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_24px_90px_-40px_rgba(15,23,42,0.55)] backdrop-blur-sm">
            <div className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50 via-white to-teal-50 px-7 py-6 sm:px-8">
              <div className="inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700 shadow-sm">
                Sign in
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900">
                Access your account
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Enter your credentials and continue to the correct FarmchainX portal automatically.
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
                  <p className="text-center text-xs text-slate-500">Signing in with Google...</p>
                )}

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">or continue with email</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-400 transition hover:text-emerald-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {eyeIcon}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(5,150,105,0.75)] transition hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  )}
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500">
                New to FarmchainX?{' '}
                <Link to="/register" className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;

