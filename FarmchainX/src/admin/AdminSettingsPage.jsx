import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { AdminPanel } from './AdminUI';
import { normalizeErrorMessage } from './adminFormatters';

function AdminSettingsPage() {
  const navigate = useNavigate();
  const { setAdminName } = useOutletContext() || {};
  const [profile, setProfile] = useState({ fullName: '', phone: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/api/admin/settings');
        setProfile({
          fullName: res.data?.fullName || '',
          phone: res.data?.phone || '',
          email: res.data?.email || '',
        });
        if (setAdminName && res.data?.fullName) {
          setAdminName(res.data.fullName);
        }
      } catch (err) {
        setError(normalizeErrorMessage(err, 'Unable to load admin settings.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setAdminName]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/api/admin/settings', {
        fullName: profile.fullName,
        phone: profile.phone,
      });
      localStorage.setItem('fcx_fullName', profile.fullName);
      if (setAdminName) setAdminName(profile.fullName);
      setSuccess('Admin profile updated successfully.');
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to update admin profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/api/admin/settings/password', passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setSuccess('Admin password updated successfully.');
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to update admin password.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('fcx_token');
    localStorage.removeItem('fcx_role');
    localStorage.removeItem('fcx_fullName');
    setShowLogoutConfirm(false);
    navigate('/admin/login');
  };

  if (loading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500">Loading admin settings…</div>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <AdminPanel title="Admin profile" subtitle="Update the visible admin identity used across the control room.">
        {error && <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {success && <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
            <input value={profile.fullName} onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input value={profile.email} readOnly className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
            <input value={profile.phone} onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" required />
          </div>
          <button type="submit" disabled={savingProfile} className="rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(79,70,229,0.85)] disabled:opacity-60">
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </AdminPanel>

      <div className="space-y-6">
        <AdminPanel title="Change password" subtitle="Rotate the admin password and keep the control room secure.">
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Current password</label>
              <input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
              <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" required />
            </div>
            <button type="submit" disabled={savingPassword} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.85)] disabled:opacity-60">
              {savingPassword ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </AdminPanel>

        <AdminPanel title="Session controls" subtitle="Sign out from the admin portal securely when you finish platform operations.">
          <button type="button" onClick={() => setShowLogoutConfirm(true)} className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(225,29,72,0.8)]">
            Logout from admin portal
          </button>
        </AdminPanel>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Logout from admin portal?"
        message="You will need to complete the OTP admin login flow again to re-enter the control room."
        confirmLabel="Logout"
        cancelLabel="Stay Logged In"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
      />
    </div>
  );
}

export default AdminSettingsPage;

