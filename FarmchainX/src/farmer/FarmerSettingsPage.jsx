import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import LocationMapPicker from '../components/LocationMapPicker';
import { useTranslation } from '../hooks/useTranslation';

function TabButton({ active, children, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`py-3 border-b-2 text-xs font-medium transition-colors focus:outline-none ${
        active ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'
      }`}>
      {children}
    </button>
  );
}

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div className={`mt-4 mx-5 rounded-lg px-4 py-2 text-sm font-medium ${
      type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
    }`}>{message}</div>
  );
}

function SectionActions({ saving, onCancel, t }) {
  return (
    <div className="mt-6 flex gap-3 justify-end">
      <button type="button" onClick={onCancel}
        className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
        {t('common.cancel')}
      </button>
      <button type="submit" disabled={saving}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
        {saving ? t('farmer.saving') : t('farmer.saveChanges')}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="block text-slate-600 mb-1 text-sm">{label}</label>{children}</div>;
}

const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm';

function ProfileSection({ values, onChange, onSubmit, onCancel, saving, onImageChange, t }) {
  return (
    <form onSubmit={onSubmit} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
      <div className="flex items-center gap-4">
        <label className="relative cursor-pointer group" title={t('farmer.profileImage')}>
          <div className="h-16 w-16 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center text-2xl border-2 border-emerald-200 transition-shadow group-hover:shadow-md group-hover:ring-2 group-hover:ring-emerald-200/70">
            {values.profileImageUrl
              ? <img src={values.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
              : <span>🧑‍🌾</span>
            }
          </div>
          <div className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full border border-white/80 bg-white/70 backdrop-blur-sm shadow-sm flex items-center justify-center text-slate-600 transition-all group-hover:bg-white/85 group-hover:text-emerald-700 group-hover:shadow">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
        </label>
        <div>
          <p className="font-semibold text-slate-900">{values.fullName || 'Farmer'}</p>
          <p className="text-xs text-slate-500">{t('farmer.profile')}</p>
        </div>
      </div>
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('farmer.fullName')}><input className={inputCls} value={values.fullName || ''} onChange={(e) => onChange('fullName', e.target.value)} /></Field>
        <Field label={t('farmer.email')}><input className={`${inputCls} bg-slate-50 text-slate-500`} disabled value={values.email || ''} /></Field>
        <Field label={t('farmer.phone')}><input className={inputCls} value={values.phone || ''} onChange={(e) => onChange('phone', e.target.value)} /></Field>
        <Field label={t('farmer.displayName')}><input className={inputCls} value={values.displayName || ''} onChange={(e) => onChange('displayName', e.target.value)} /></Field>
      </div>
      <SectionActions saving={saving} onCancel={onCancel} t={t} />
    </form>
  );
}

function FarmSection({ values, onChange, onSubmit, onCancel, saving, t }) {
  return (
    <form onSubmit={onSubmit} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
      <div><p className="text-sm font-semibold text-slate-900">{t('farmer.farmInformation')}</p><p className="text-xs text-slate-500 mt-1">{t('farmer.shownToCustomers')}</p></div>
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('farmer.farmName')}><input className={inputCls} value={values.farmName || ''} onChange={(e) => onChange('farmName', e.target.value)} /></Field>
        <Field label={t('farmer.location')}><input className={inputCls} value={values.farmLocation || ''} onChange={(e) => onChange('farmLocation', e.target.value)} placeholder="City, State" /></Field>
        <div className="sm:col-span-2">
          <LocationMapPicker
            latitude={values.farmLatitude}
            longitude={values.farmLongitude}
            onChange={(latitude, longitude) => {
              onChange('farmLatitude', latitude);
              onChange('farmLongitude', longitude);
            }}
            title="Pin your farm location on the map"
            subtitle="Click the map to mark the exact farm pickup point. Delivery partners will see this pin in their dashboard."
            height="260px"
          />
        </div>
        <div className="sm:col-span-2">
          <Field label={t('farmer.farmDescription')}>
            <textarea className={`${inputCls} h-20 resize-none`} value={values.farmDescription || ''} onChange={(e) => onChange('farmDescription', e.target.value)} />
          </Field>
        </div>
      </div>
      <SectionActions saving={saving} onCancel={onCancel} t={t} />
    </form>
  );
}

function BankSection({ values, onChange, onSubmit, onCancel, saving, t }) {
  return (
    <form onSubmit={onSubmit} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
      <div><p className="text-sm font-semibold text-slate-900">{t('farmer.bankPayments')}</p><p className="text-xs text-slate-500 mt-1">{t('farmer.usedForWithdrawal')}</p></div>
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('farmer.accountHolderName')}><input className={inputCls} value={values.accountHolderName || ''} onChange={(e) => onChange('accountHolderName', e.target.value)} /></Field>
        <Field label={t('farmer.accountNumber')}><input className={inputCls} value={values.bankAccountNumber || ''} onChange={(e) => onChange('bankAccountNumber', e.target.value)} /></Field>
        <Field label={t('farmer.ifscCode')}><input className={inputCls} value={values.bankIfsc || ''} onChange={(e) => onChange('bankIfsc', e.target.value)} /></Field>
        <Field label={t('farmer.bankName')}><input className={inputCls} value={values.bankName || ''} onChange={(e) => onChange('bankName', e.target.value)} /></Field>
      </div>
      <SectionActions saving={saving} onCancel={onCancel} t={t} />
    </form>
  );
}

function SecuritySection({ values, onChange, onSubmit, onCancel, saving, t }) {
  return (
    <form onSubmit={onSubmit} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
      <div><p className="text-sm font-semibold text-slate-900">{t('settings.security')}</p><p className="text-xs text-slate-500 mt-1">{t('farmer.updatePassword')}</p></div>
      <div className="md:col-span-2 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('farmer.currentPassword')}><input type="password" className={inputCls} value={values.currentPassword} onChange={(e) => onChange('currentPassword', e.target.value)} /></Field>
          <div />
          <Field label={t('farmer.newPassword')}><input type="password" className={inputCls} value={values.newPassword} onChange={(e) => onChange('newPassword', e.target.value)} /></Field>
          <Field label={t('farmer.confirmPassword')}><input type="password" className={inputCls} value={values.confirmPassword} onChange={(e) => onChange('confirmPassword', e.target.value)} /></Field>
        </div>
      </div>
      <SectionActions saving={saving} onCancel={onCancel} t={t} />
    </form>
  );
}

function PreferencesSection({ values, onChange, onSubmit, onCancel, saving, t, changeLanguage }) {
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    onChange('language', newLanguage);
    changeLanguage(newLanguage);
  };

  return (
    <form onSubmit={onSubmit} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
      <div><p className="text-sm font-semibold text-slate-900">{t('settings.preferences')}</p><p className="text-xs text-slate-500 mt-1">Notifications, language and timezone.</p></div>
      <div className="md:col-span-2 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('farmer.language')}>
            <select className={inputCls} value={values.language} onChange={handleLanguageChange}>
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">हिंदी</option>
              <option value="te-IN">తెలుగు</option>
              <option value="ta-IN">தமிழ்</option>
              <option value="ml-IN">മലയാളം</option>
              <option value="kn-IN">ಕನ್ನಡ</option>
            </select>
          </Field>
          <Field label={t('farmer.timezone')}>
            <select className={inputCls} value={values.timeZone} onChange={(e) => onChange('timeZone', e.target.value)}>
              <option value="Asia/Kolkata">IST (GMT+5:30)</option>
              <option value="UTC">UTC</option>
            </select>
          </Field>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">{t('farmer.notifications')}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">{t('farmer.orderUpdates')}</span>
            <input type="checkbox" checked={values.notifyOrderUpdates} onChange={(e) => onChange('notifyOrderUpdates', e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">{t('farmer.riskAlerts')}</span>
            <input type="checkbox" checked={values.notifyRiskAlerts} onChange={(e) => onChange('notifyRiskAlerts', e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          </div>
        </div>
      </div>
      <SectionActions saving={saving} onCancel={onCancel} t={t} />
    </form>
  );
}

const defaultSettings = {
  fullName: '', email: '', phone: '', displayName: '',
  farmName: '', farmLocation: '', farmDescription: '',
  farmLatitude: null, farmLongitude: null,
  accountHolderName: '', bankAccountNumber: '', bankIfsc: '', bankName: '',
  language: 'en-IN', timeZone: 'Asia/Kolkata',
  notifyOrderUpdates: true, notifyRiskAlerts: true,
  profileImageUrl: '',
};

function FarmerSettingsPage() {
  const navigate = useNavigate();
  const { t, changeLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [settings, setSettings] = useState(defaultSettings);
  const [original, setOriginal] = useState(defaultSettings);
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const fetchSettings = () => {
    api.get('/api/farmer/settings').then((res) => {
      const merged = { ...defaultSettings, ...(res.data || {}) };
      setSettings(merged);
      setOriginal(merged);
      // Set the language from backend
      if (merged.language) {
        changeLanguage(merged.language);
      }
      if (merged.profileImageUrl) {
        localStorage.setItem('fcx_profileImage', merged.profileImageUrl);
        window.dispatchEvent(new Event('fcx:profile-updated'));
      }
    }).catch(() => {});
  };

  useEffect(() => { fetchSettings(); }, []);

  const updateField = (field, value) => setSettings((prev) => ({ ...prev, [field]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings((prev) => ({ ...prev, profileImageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    // Ensure coordinates are numbers (BigDecimal in backend)
    const farmLat = settings.farmLatitude !== null && settings.farmLatitude !== undefined ? Number(settings.farmLatitude) : null;
    const farmLng = settings.farmLongitude !== null && settings.farmLongitude !== undefined ? Number(settings.farmLongitude) : null;
    
    api.put('/api/farmer/settings', {
      fullName: settings.fullName, phone: settings.phone, displayName: settings.displayName,
      farmName: settings.farmName, farmLocation: settings.farmLocation, farmDescription: settings.farmDescription,
      farmLatitude: farmLat, farmLongitude: farmLng,
      accountHolderName: settings.accountHolderName, bankAccountNumber: settings.bankAccountNumber,
      bankIfsc: settings.bankIfsc, bankName: settings.bankName,
      language: settings.language, timeZone: settings.timeZone,
      notifyOrderUpdates: settings.notifyOrderUpdates, notifyRiskAlerts: settings.notifyRiskAlerts,
      profileImageUrl: settings.profileImageUrl || null,
    }).then(() => {
      if (settings.fullName) { localStorage.setItem('fcx_fullName', settings.fullName); }
      if (settings.profileImageUrl) { localStorage.setItem('fcx_profileImage', settings.profileImageUrl); }
      window.dispatchEvent(new Event('fcx:profile-updated'));
      setOriginal({ ...settings });
      showToast(t('farmer.settingsSuccessful'), 'success');
    }).catch(() => showToast(t('farmer.settingsFailed'), 'error'))
      .finally(() => setSaving(false));
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!security.currentPassword || !security.newPassword) { showToast(t('farmer.fillRequired'), 'error'); return; }
    if (security.newPassword !== security.confirmPassword) { showToast(t('farmer.passwordMismatch'), 'error'); return; }
    setSaving(true);
    api.put('/api/farmer/settings/password', { currentPassword: security.currentPassword, newPassword: security.newPassword })
      .then(() => { setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' }); showToast(t('farmer.passwordUpdated'), 'success'); })
      .catch((err) => showToast(err?.response?.status === 403 ? t('farmer.fillRequired') : t('farmer.passwordFailed'), 'error'))
      .finally(() => setSaving(false));
  };

  const tabs = [
    { id: 'profile', label: t('settings.profileInformation') },
    { id: 'farm', label: t('settings.farmInformation') },
    { id: 'bank', label: t('settings.bankPayments') },
    { id: 'security', label: t('settings.security') },
    { id: 'preferences', label: t('settings.preferences') },
  ];

  const handleCancel = () => setSettings(original);

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
      .catch((err) => {
        showToast(err?.response?.data?.message || 'Unable to delete account right now.', 'error');
      })
      .finally(() => setDeleting(false));
  };

  let content;
  if (activeTab === 'profile') content = <ProfileSection values={settings} onChange={updateField} onSubmit={handleSave} onCancel={handleCancel} saving={saving} onImageChange={handleImageChange} t={t} />;
  else if (activeTab === 'farm') content = <FarmSection values={settings} onChange={updateField} onSubmit={handleSave} onCancel={handleCancel} saving={saving} t={t} />;
  else if (activeTab === 'bank') content = <BankSection values={settings} onChange={updateField} onSubmit={handleSave} onCancel={handleCancel} saving={saving} t={t} />;
  else if (activeTab === 'security') content = <SecuritySection values={security} onChange={(f, v) => setSecurity((p) => ({ ...p, [f]: v }))} onSubmit={handlePasswordChange} onCancel={() => setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' })} saving={saving} t={t} />;
  else content = <PreferencesSection values={settings} onChange={updateField} onSubmit={handleSave} onCancel={handleCancel} saving={saving} t={t} changeLanguage={changeLanguage} />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-slate-500">{t('common.dashboard')} / {t('common.settings')}</p>
        <h2 className="text-xl font-semibold text-slate-900 mt-1">{t('common.settings')}</h2>
        <p className="text-sm text-slate-500">{t('settings.manageSections')}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-card border border-slate-100">
        <div className="border-b border-slate-100 px-5 pt-4">
          <nav className="flex gap-6">
            {tabs.map((t) => (
              <TabButton key={t.id} active={activeTab === t.id} onClick={() => setActiveTab(t.id)}>{t.label}</TabButton>
            ))}
          </nav>
        </div>
        <Toast message={toast.message} type={toast.type} />
        {content}
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-rose-100 p-5">
        <p className="text-sm font-semibold text-rose-700">{t('farmer.deleteAccount')}</p>
        <p className="mt-1 text-xs text-slate-500">{t('farmer.deleteAccountMessage')}</p>
        <button
          type="button"
          disabled={deleting}
          onClick={() => setShowDeleteConfirm(true)}
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
        >
          {deleting ? t('farmer.deleting', { defaultValue: 'Deleting...' }) : t('farmer.deleteAccount')}
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t('farmer.deleteAccountTitle', { defaultValue: 'Delete farmer account?' })}
        message={t('farmer.deleteAccountConfirmMessage', { defaultValue: 'This action will disable your account and you will be logged out from this device.' })}
        confirmLabel={deleting ? t('farmer.deleting', { defaultValue: 'Deleting...' }) : t('farmer.yesDelete', { defaultValue: 'Yes, delete' })}
        cancelLabel={t('common.cancel')}
        onCancel={() => !deleting && setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}

export default FarmerSettingsPage;

