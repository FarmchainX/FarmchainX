import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import farmchainxLogo from '../assets/farmchainx-logo.svg';

const API_BASE = 'http://localhost:8080';

function AdminLoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('admin@farmchainx.com');
  const [password, setPassword] = useState('Admin@123');
  const [sessionId, setSessionId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const completeAuth = ({ token, role, fullName }) => {
    localStorage.setItem('fcx_token', token);
    localStorage.setItem('fcx_role', role);
    if (fullName) {
      localStorage.setItem('fcx_fullName', fullName);
    }
    navigate('/admin');
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/auth/admin/request-otp`, {
        email: email.trim().toLowerCase(),
        password,
      });
      const nextOtp = String(res.data.otpPreview || '').replace(/\D/g, '').slice(0, 6);
      setSessionId(res.data.sessionId || '');
      setOtp(nextOtp);
      setStep('otp');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to verify admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!sessionId) {
      setError('OTP session is missing. Please request a new OTP.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/auth/admin/verify-otp`, {
        email: email.trim().toLowerCase(),
        sessionId,
        otp: otp.trim(),
      });
      completeAuth(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || `OTP verification failed${err?.response?.status ? ` (${err.response.status})` : ''}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.16),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(124,58,237,0.14),_transparent_28%),linear-gradient(180deg,#f8faff_0%,#eef3fb_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1460px] overflow-hidden rounded-[36px] border border-white/70 bg-white/70 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.55)] backdrop-blur-xl">
        <aside className="hidden w-[46%] flex-col justify-between bg-[linear-gradient(180deg,#0b1120_0%,#172554_52%,#312e81_100%)] p-10 text-white lg:flex xl:p-14">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <img src={farmchainxLogo} alt="FarmchainX" className="h-10 w-10 rounded-full bg-white/10 p-1.5" />
              <div>
                <p className="text-lg font-semibold tracking-tight">FarmchainX</p>
                <p className="text-[11px] text-slate-300">Admin access only</p>
              </div>
            </div>

            <div className="mt-14 max-w-xl space-y-5">
              <span className="inline-flex rounded-full border border-indigo-300/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-indigo-100">
                Secure admin verification
              </span>
              <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">
                Enter the FarmchainX control room with password + OTP verification.
              </h1>
              <p className="text-sm leading-7 text-slate-200/85 xl:text-base">
                This admin login is separate from farmer, customer, and driver access. Use your admin password first, then verify the one-time code to continue.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-indigo-100/80">User moderation</p>
                <p className="mt-3 text-lg font-semibold">Approve & suspend accounts</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-indigo-100/80">Disputes & refunds</p>
                <p className="mt-3 text-lg font-semibold">Resolve platform issues</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] text-indigo-100/80">Broadcast controls</p>
                <p className="mt-3 text-lg font-semibold">Notify every role instantly</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
              <p className="text-2xl font-semibold">2-step</p>
              <p className="mt-1 text-xs text-slate-300">Credential + OTP</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
              <p className="text-2xl font-semibold">Role locked</p>
              <p className="mt-1 text-xs text-slate-300">Admin-only access</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
              <p className="text-2xl font-semibold">Audit ready</p>
              <p className="mt-1 text-xs text-slate-300">Safer portal entry</p>
            </div>
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <img src={farmchainxLogo} alt="FarmchainX" className="h-10 w-10 rounded-full bg-indigo-100 p-1.5" />
              <div>
                <p className="text-xl font-semibold tracking-tight text-slate-950">FarmchainX</p>
                <p className="text-xs text-slate-500">Admin access only</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_28px_80px_-42px_rgba(15,23,42,0.48)]">
              <div className="border-b border-slate-100 bg-[linear-gradient(90deg,#eef2ff_0%,#ffffff_50%,#f5f3ff_100%)] px-7 py-6 sm:px-8">
                <div className="inline-flex rounded-full border border-indigo-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.23em] text-indigo-700">
                  {step === 'credentials' ? 'Step 1 of 2' : 'Step 2 of 2'}
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                  {step === 'credentials' ? 'Admin sign in' : 'Enter one-time password'}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {step === 'credentials'
                    ? 'Use your admin credentials to request an OTP and continue into the control room.'
                    : 'Verify the OTP to finish the secure admin login flow.'}
                </p>
              </div>

              <div className="px-6 py-7 sm:px-8">
                {step === 'credentials' ? (
                  <form onSubmit={requestOtp} className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Admin email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        placeholder="admin@farmchainx.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        placeholder="Enter admin password"
                        required
                      />
                    </div>

                    {error && <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_100%)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(79,70,229,0.9)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Requesting OTP…' : 'Request OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={verifyOtp} className="space-y-5">
                    <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Admin verification session</p>
                      <p className="mt-2 text-sm text-slate-600">Email: <span className="font-medium text-slate-900">{email}</span></p>
                      <p className="mt-2 text-xs text-slate-500">Use the OTP delivered through your configured admin channel.</p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">One-time password</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-xl tracking-[0.35em] outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        placeholder="000000"
                        inputMode="numeric"
                        required
                      />
                    </div>

                    {error && <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('credentials');
                          setOtp('');
                          setError('');
                        }}
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(79,70,229,0.9)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? 'Verifying…' : 'Verify & continue'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLoginPage;

