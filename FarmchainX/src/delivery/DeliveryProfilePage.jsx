import { useEffect, useState } from 'react';
import api from '../api/client';
import { DeliveryPageIntro, DeliveryPanel, DeliveryPanelBody, DeliveryPrimaryButton } from './DeliveryUI';

function DeliveryProfilePage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
    emergencyContact: '',
    profileImageUrl: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/delivery/profile').then((res) => setForm((prev) => ({ ...prev, ...res.data }))).catch(() => {});
  }, []);

  const onChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, profileImageUrl: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const save = (e) => {
    e.preventDefault();
    setSaving(true);
    api.put('/api/delivery/profile', form).then(() => {
      if (form.fullName) localStorage.setItem('fcx_fullName', form.fullName);
      if (form.profileImageUrl) localStorage.setItem('fcx_delivery_profile', form.profileImageUrl);
    }).finally(() => setSaving(false));
  };

  return (
    <div className="space-y-6">
      <DeliveryPageIntro
        icon="👤"
        title="Profile"
        description="Manage personal details, vehicle information, license data, and bank account information."
      />

      <DeliveryPanel>
        <DeliveryPanelBody>
      <form onSubmit={save} className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
            {form.profileImageUrl ? (
              <img src={form.profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xl font-semibold text-slate-500">
                {(form.fullName || 'D').charAt(0).toUpperCase()}
              </div>
            )}
            <label className="absolute right-1 bottom-1 h-6 w-6 rounded-full bg-black/50 text-white text-[11px] flex items-center justify-center cursor-pointer">
              ✎
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Delivery Partner Photo</p>
            <p className="text-xs text-slate-500">Use the pencil icon to upload or replace image.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1.5 text-sm text-slate-700"><span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Full Name</span><input value={form.fullName || ''} onChange={onChange('fullName')} placeholder="Full name" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" /></label>
          <label className="space-y-1.5 text-sm text-slate-700"><span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Phone</span><input value={form.phone || ''} onChange={onChange('phone')} placeholder="Phone" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" /></label>
          <label className="space-y-1.5 text-sm text-slate-700"><span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Vehicle Type</span><input value={form.vehicleType || ''} onChange={onChange('vehicleType')} placeholder="Vehicle type" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" /></label>
          <label className="space-y-1.5 text-sm text-slate-700"><span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Vehicle Number</span><input value={form.vehicleNumber || ''} onChange={onChange('vehicleNumber')} placeholder="Vehicle number" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" /></label>
          <label className="space-y-1.5 text-sm text-slate-700"><span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">License Number</span><input value={form.licenseNumber || ''} onChange={onChange('licenseNumber')} placeholder="License number" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" /></label>
          <label className="space-y-1.5 text-sm text-slate-700"><span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Emergency Contact</span><input value={form.emergencyContact || ''} onChange={onChange('emergencyContact')} placeholder="Emergency contact" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" /></label>
          <label className="space-y-1.5 text-sm text-slate-700"><span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Bank Account</span><input value={form.bankAccountNumber || ''} onChange={onChange('bankAccountNumber')} placeholder="Bank account" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" /></label>
          <label className="space-y-1.5 text-sm text-slate-700"><span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">IFSC</span><input value={form.bankIfsc || ''} onChange={onChange('bankIfsc')} placeholder="IFSC" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" /></label>
          <label className="space-y-1.5 text-sm text-slate-700"><span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Bank Name</span><input value={form.bankName || ''} onChange={onChange('bankName')} placeholder="Bank name" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100" /></label>
          <label className="space-y-1.5 text-sm text-slate-700"><span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Email</span><input value={form.email || ''} readOnly placeholder="Email" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500" /></label>
        </div>

        <div className="flex justify-end">
          <DeliveryPrimaryButton disabled={saving} type="submit">
            {saving && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
            {saving ? 'Saving...' : 'Save Profile'}
          </DeliveryPrimaryButton>
        </div>
      </form>
        </DeliveryPanelBody>
      </DeliveryPanel>
    </div>
  );
}

export default DeliveryProfilePage;

