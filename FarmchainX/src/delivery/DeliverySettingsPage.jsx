import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { DeliveryPageIntro, DeliveryPanel, DeliveryPanelBody } from './DeliveryUI';
import ConfirmDialog from '../components/ConfirmDialog';

function DeliverySettingsPage() {
  const navigate = useNavigate();
  const [online, setOnline] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [sound, setSound] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get('/api/delivery/profile').then((res) => {
      if (typeof res.data?.online === 'boolean') setOnline(res.data.online);
    }).catch(() => {});
  }, []);

  const toggle = () => {
    const next = !online;
    api.patch('/api/delivery/dashboard/availability', { online: next })
      .then(() => setOnline(next))
      .catch(() => {});
  };

  const updatePasswordField = (field) => (e) => {
    setPasswordForm((prev) => ({ ...prev, [field]: e.target.value }));
    setPasswordError('');
    setPasswordMessage('');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setSubmittingPassword(true);
    api.put('/api/delivery/profile/password', {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    }).then(() => {
      setPasswordMessage('Password updated successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }).catch((err) => {
      if (err?.response?.status === 400) {
        setPasswordError('Current password is incorrect.');
      } else {
        setPasswordError('Unable to update password right now.');
      }
    }).finally(() => setSubmittingPassword(false));
  };

  const handleLogout = () => {
    localStorage.removeItem('fcx_token');
    localStorage.removeItem('fcx_role');
    localStorage.removeItem('fcx_fullName');
    localStorage.removeItem('fcx_profileImage');
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    setDeleting(true);
    api.delete('/api/account/me')
      .then(() => {
        localStorage.removeItem('fcx_token');
        localStorage.removeItem('fcx_role');
        localStorage.removeItem('fcx_fullName');
        localStorage.removeItem('fcx_profileImage');
        setShowDeleteConfirm(false);
        navigate('/login?accountDeleted=1');
      })
      .catch(() => {
        setPasswordError('Unable to delete account right now. Please try again.');
      })
      .finally(() => setDeleting(false));
  };

  const renderEyeIcon = (visible) => (visible ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6 0 10 8 10 8a17.6 17.6 0 0 1-4 4.8" />
      <path d="M6.2 6.3A17.7 17.7 0 0 0 2 12s4 8 10 8a10.7 10.7 0 0 0 5.1-1.3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ));

  return (
    <div className="space-y-6">
      <DeliveryPageIntro
        icon="⚙️"
        title="Settings"
        description="Control your availability and alert preferences for a smoother delivery workflow."
      />

      <DeliveryPanel>
        <DeliveryPanelBody className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-900">Availability</p>
          <p className="text-xs text-slate-500">Toggle online/offline to receive new delivery tasks.</p>
        </div>
        <button onClick={toggle} className={`text-xs px-4 py-2 rounded-full border ${online ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-slate-300 text-slate-600'}`}>
          {online ? 'Online' : 'Offline'}
        </button>
        </DeliveryPanelBody>
      </DeliveryPanel>

      <DeliveryPanel>
        <DeliveryPanelBody className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Notification Alerts</p>
            <p className="text-xs text-slate-500">Receive assignment and payment alerts.</p>
          </div>
          <button onClick={() => setAlerts((v) => !v)} className={`text-xs px-3 py-1.5 rounded-full border ${alerts ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-300'}`}>
            {alerts ? 'Enabled' : 'Disabled'}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Notification Sound</p>
            <p className="text-xs text-slate-500">Play a sound when new delivery is assigned.</p>
          </div>
          <button onClick={() => setSound((v) => !v)} className={`text-xs px-3 py-1.5 rounded-full border ${sound ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-300'}`}>
            {sound ? 'On' : 'Off'}
          </button>
        </div>
        </DeliveryPanelBody>
      </DeliveryPanel>

      <DeliveryPanel>
        <DeliveryPanelBody>
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-900">Change Password</p>
            <p className="text-xs text-slate-500">Update your account password for better security.</p>
          </div>
          <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={updatePasswordField('currentPassword')}
                placeholder="Current password"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-400 hover:text-sky-600"
              >
                {renderEyeIcon(showCurrentPassword)}
              </button>
            </div>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={updatePasswordField('newPassword')}
                placeholder="New password"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-400 hover:text-sky-600"
              >
                {renderEyeIcon(showNewPassword)}
              </button>
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={updatePasswordField('confirmPassword')}
                placeholder="Confirm password"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-400 hover:text-sky-600"
              >
                {renderEyeIcon(showConfirmPassword)}
              </button>
            </div>
            <div className="md:col-span-3 flex items-center justify-between gap-3">
              <div>
                {passwordError && <p className="text-xs text-rose-600">{passwordError}</p>}
                {passwordMessage && <p className="text-xs text-sky-700">{passwordMessage}</p>}
              </div>
              <button
                type="submit"
                disabled={submittingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2.5 transition disabled:opacity-60"
              >
                {submittingPassword && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
                Update Password
              </button>
            </div>
          </form>
        </DeliveryPanelBody>
      </DeliveryPanel>

      <DeliveryPanel>
        <DeliveryPanelBody className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900">Logout</p>
            <p className="text-xs text-slate-500">Sign out from your delivery account on this device.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-100"
          >
            Logout
          </button>
        </DeliveryPanelBody>
      </DeliveryPanel>

      <DeliveryPanel>
        <DeliveryPanelBody className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-rose-700">Delete Account</p>
            <p className="text-xs text-slate-500">Disable your delivery account permanently and sign out.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-60"
          >
            {deleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </DeliveryPanelBody>
      </DeliveryPanel>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Logout from delivery account?"
        message="You will be signed out from this device and need to login again to continue."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete delivery account?"
        message="This action disables your account and signs you out immediately."
        confirmLabel={deleting ? 'Deleting...' : 'Yes, delete'}
        cancelLabel="Cancel"
        onCancel={() => !deleting && setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}

export default DeliverySettingsPage;

