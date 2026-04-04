import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import LocationMapPicker from '../components/LocationMapPicker';
import {
  CustomerEmptyState,
  CustomerInfoCard,
  CustomerMetricCard,
  CustomerPageShell,
  CustomerPrimaryButton,
  CustomerSectionHeader,
} from './CustomerUI';

function CustomerProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    preferredName: '',
    city: '',
    bio: '',
    profileImageUrl: '',
  });
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [addressForm, setAddressForm] = useState({
    label: '', recipientName: '', phone: '', addressLine: '', city: '', state: '', postalCode: '', latitude: null, longitude: null, isDefault: false,
  });
  const [paymentForm, setPaymentForm] = useState({ methodType: 'UPI', provider: '', accountRef: '', isDefault: false });

  const getApiMessage = (error, fallback) => {
    const backendMessage = error?.response?.data?.message;
    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      return backendMessage;
    }
    if (error?.response?.status === 400) {
      return 'Please fill all required details correctly and try again.';
    }
    return fallback;
  };

  const load = () => {
    api.get('/api/customer/profile').then((res) => setProfile(res.data || {})).catch(() => {});
    api.get('/api/customer/addresses').then((res) => setAddresses(res.data || [])).catch(() => {});
    api.get('/api/customer/payments').then((res) => setPayments(res.data || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const updateProfile = (e) => {
    e.preventDefault();
    setMessage('');
    api.put('/api/customer/profile', profile).then(() => {
      localStorage.setItem('fcx_fullName', profile.fullName || 'Customer');
      localStorage.setItem('fcx_customer_profile', profile.profileImageUrl || '');
      window.dispatchEvent(new Event('fcx:customer-profile-updated'));
      setMessage('Profile updated successfully.');
    }).catch((error) => setMessage(getApiMessage(error, 'Unable to update profile right now.')));
  };

  const upload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfile((prev) => ({ ...prev, profileImageUrl: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const changePassword = (e) => {
    e.preventDefault();
    setMessage('');
    api.put('/api/customer/profile/password', passwordForm).then(() => {
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setMessage('Password updated successfully.');
    }).catch((error) => setMessage(getApiMessage(error, 'Unable to update password.')));
  };

  const addAddress = (e) => {
    e.preventDefault();
    setMessage('');
    api.post('/api/customer/addresses', addressForm).then(() => {
      setAddressForm({ label: '', recipientName: '', phone: '', addressLine: '', city: '', state: '', postalCode: '', latitude: null, longitude: null, isDefault: false });
      load();
      setMessage('Address added successfully.');
    }).catch((error) => setMessage(getApiMessage(error, 'Unable to add address.')));
  };

  const addPayment = (e) => {
    e.preventDefault();
    setMessage('');
    api.post('/api/customer/payments', paymentForm).then(() => {
      setPaymentForm({ methodType: 'UPI', provider: '', accountRef: '', isDefault: false });
      load();
      setMessage('Payment method added successfully.');
    }).catch((error) => setMessage(getApiMessage(error, 'Unable to add payment method.')));
  };

  const removeAddress = (id) => {
    setMessage('');
    api.delete(`/api/customer/addresses/${id}`).then(() => {
      load();
      setMessage('Address deleted.');
    }).catch((error) => setMessage(getApiMessage(error, 'Unable to delete address.')));
  };

  const setDefaultAddress = (address) => {
    api.put(`/api/customer/addresses/${address.id}`, {
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      latitude: address.latitude,
      longitude: address.longitude,
      isDefault: true,
    }).then(() => {
      load();
      setMessage('Default address updated.');
    }).catch((error) => setMessage(getApiMessage(error, 'Unable to update default address.')));
  };

  const removePayment = (id) => {
    setMessage('');
    api.delete(`/api/customer/payments/${id}`).then(() => {
      load();
      setMessage('Payment method deleted.');
    }).catch((error) => setMessage(getApiMessage(error, 'Unable to delete payment method.')));
  };

  const setDefaultPayment = (payment) => {
    api.put(`/api/customer/payments/${payment.id}`, {
      methodType: payment.methodType,
      provider: payment.provider,
      accountRef: payment.accountRef,
      isDefault: true,
    }).then(() => {
      load();
      setMessage('Default payment updated.');
    }).catch((error) => setMessage(getApiMessage(error, 'Unable to update default payment method.')));
  };

  const deleteAccount = () => {
    setDeleting(true);
    setMessage('');
    api.delete('/api/account/me')
      .then(() => {
        localStorage.removeItem('fcx_token');
        localStorage.removeItem('fcx_role');
        localStorage.removeItem('fcx_fullName');
        localStorage.removeItem('fcx_customer_profile');
        setShowDeleteConfirm(false);
        navigate('/login?accountDeleted=1');
      })
      .catch((error) => {
        setMessage(getApiMessage(error, 'Unable to delete account right now.'));
      })
      .finally(() => setDeleting(false));
  };

  return (
    <CustomerPageShell
      eyebrow="Profile"
      title="Manage your personal account, addresses and payment methods"
      description="A premium profile experience designed for fast repeat checkouts and organized customer account management."
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CustomerMetricCard label="Saved addresses" value={addresses.length} accent="violet" />
        <CustomerMetricCard label="Payment methods" value={payments.length} accent="emerald" />
        <CustomerMetricCard label="Preferred city" value={profile.city || '—'} accent="rose" />
        <CustomerMetricCard label="Account type" value="Customer" accent="amber" />
      </div>

      {message && (
        <div className={`rounded-[24px] border px-4 py-3 text-sm ${message.toLowerCase().includes('unable') || message.toLowerCase().includes('please') ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-violet-200 bg-violet-50 text-violet-700'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <div className="space-y-6">
          <form onSubmit={updateProfile}>
            <CustomerInfoCard>
            <CustomerSectionHeader title="Personal information" subtitle="Keep your buying identity polished and up to date." />
            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-[linear-gradient(135deg,#f2f0ff_0%,#f9f6ff_100%)] shadow-sm">
                {profile.profileImageUrl ? <img src={profile.profileImageUrl} alt="Profile" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-violet-600">{(profile.fullName || 'C').charAt(0).toUpperCase()}</div>}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold text-slate-950">{profile.fullName || 'Customer Profile'}</p>
                <p className="mt-1 text-sm text-slate-500">{profile.email || 'email@example.com'}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/70 hover:text-violet-700">
                    Upload image
                    <input type="file" accept="image/*" onChange={upload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <input required value={profile.fullName || ''} onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} placeholder="Full name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
              <input required value={profile.phone || ''} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
              <input value={profile.preferredName || ''} onChange={(e) => setProfile((p) => ({ ...p, preferredName: e.target.value }))} placeholder="Preferred name" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
              <input value={profile.city || ''} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} placeholder="City" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
              <input value={profile.email || ''} readOnly className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500" />
              <input value={profile.profileImageUrl || ''} onChange={(e) => setProfile((p) => ({ ...p, profileImageUrl: e.target.value }))} placeholder="Profile image URL" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
            </div>

            <textarea value={profile.bio || ''} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} rows={4} placeholder="Short bio or preferences" className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />

            <div className="mt-5">
              <CustomerPrimaryButton type="submit">Save profile</CustomerPrimaryButton>
            </div>
            </CustomerInfoCard>
          </form>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <form onSubmit={addAddress}>
              <CustomerInfoCard>
                <CustomerSectionHeader title="Address book" subtitle="Save delivery destinations for quicker checkout." />
                <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input required placeholder="Label" value={addressForm.label} onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
                  <input required placeholder="Recipient" value={addressForm.recipientName} onChange={(e) => setAddressForm((p) => ({ ...p, recipientName: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
                  <input required placeholder="Phone" value={addressForm.phone} onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
                  <input required placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
                  <input required placeholder="State" value={addressForm.state} onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
                  <input required placeholder="Postal code" value={addressForm.postalCode} onChange={(e) => setAddressForm((p) => ({ ...p, postalCode: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
                </div>
                <input required placeholder="Address line" value={addressForm.addressLine} onChange={(e) => setAddressForm((p) => ({ ...p, addressLine: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
                <LocationMapPicker
                  latitude={addressForm.latitude}
                  longitude={addressForm.longitude}
                  onChange={(latitude, longitude) => setAddressForm((p) => ({ ...p, latitude, longitude }))}
                  title="Pin this delivery address on the map"
                  subtitle="Click the map to drop a pin for the delivery location. The selected coordinates will be saved with the address."
                  height="260px"
                />
                <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm((p) => ({ ...p, isDefault: e.target.checked }))} /> Set as default</label>
                <CustomerPrimaryButton type="submit">Add address</CustomerPrimaryButton>
                </div>

                <div className="mt-5 space-y-3">
                {addresses.length === 0 ? <CustomerEmptyState title="No addresses saved" description="Add a delivery address to make checkout faster and cleaner." /> : addresses.map((a) => {
                  const isDefault = Boolean(a.default || a.isDefault);
                  return (
                    <div key={a.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{a.label} {isDefault && <span className="text-xs text-emerald-600">(Default)</span>}</p>
                          <p className="mt-1 text-sm text-slate-600">{a.addressLine}</p>
                          <p className="mt-1 text-xs text-slate-500">{a.city}, {a.state} • {a.postalCode}</p>
                          {(a.latitude || a.longitude) && <p className="mt-1 text-[11px] text-slate-400">Pin: {a.latitude || '—'}, {a.longitude || '—'}</p>}
                        </div>
                        <div className="flex gap-3 text-xs font-semibold">
                          {!isDefault && <button type="button" onClick={() => setDefaultAddress(a)} className="text-violet-600 hover:text-violet-700">Set default</button>}
                          <button type="button" onClick={() => removeAddress(a.id)} className="text-rose-600 hover:text-rose-700">Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </CustomerInfoCard>
            </form>

            <form onSubmit={addPayment}>
              <CustomerInfoCard>
                <CustomerSectionHeader title="Payment methods" subtitle="Keep preferred payment options ready for checkout." />
                <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <select value={paymentForm.methodType} onChange={(e) => setPaymentForm((p) => ({ ...p, methodType: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100">
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="COD">Cash on Delivery</option>
                  </select>
                  <input placeholder="Provider" value={paymentForm.provider} onChange={(e) => setPaymentForm((p) => ({ ...p, provider: e.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100" />
                </div>
                <input placeholder="Account Ref" value={paymentForm.accountRef} onChange={(e) => setPaymentForm((p) => ({ ...p, accountRef: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-100" />
                <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={paymentForm.isDefault} onChange={(e) => setPaymentForm((p) => ({ ...p, isDefault: e.target.checked }))} /> Set as default</label>
                <CustomerPrimaryButton type="submit">Add payment method</CustomerPrimaryButton>
                </div>

                <div className="mt-5 space-y-3">
                {payments.length === 0 ? <CustomerEmptyState title="No payment methods saved" description="Add a payment option to create a faster premium checkout experience." /> : payments.map((m) => {
                  const isDefault = Boolean(m.default || m.isDefault);
                  return (
                    <div key={m.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{m.methodType} {m.provider ? `• ${m.provider}` : ''} {isDefault && <span className="text-xs text-emerald-600">(Default)</span>}</p>
                          <p className="mt-1 text-xs text-slate-500">{m.accountRef || 'No account reference provided'}</p>
                        </div>
                        <div className="flex gap-3 text-xs font-semibold">
                          {!isDefault && <button type="button" onClick={() => setDefaultPayment(m)} className="text-indigo-600 hover:text-indigo-700">Set default</button>}
                          <button type="button" onClick={() => removePayment(m.id)} className="text-rose-600 hover:text-rose-700">Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </CustomerInfoCard>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <CustomerInfoCard title="Security" subtitle="Keep your account credentials updated.">
            <form onSubmit={changePassword} className="space-y-4">
              <input required type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} placeholder="Current password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
              <input required minLength={6} type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} placeholder="New password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
              <CustomerPrimaryButton type="submit" className="w-full">Update password</CustomerPrimaryButton>
            </form>
          </CustomerInfoCard>

          <CustomerInfoCard title="Profile summary" subtitle="A quick glance at what’s saved in your account.">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between"><span>Preferred name</span><span className="font-semibold text-slate-900">{profile.preferredName || '—'}</span></div>
              <div className="flex items-center justify-between"><span>Phone</span><span className="font-semibold text-slate-900">{profile.phone || '—'}</span></div>
              <div className="flex items-center justify-between"><span>City</span><span className="font-semibold text-slate-900">{profile.city || '—'}</span></div>
              <div className="flex items-center justify-between"><span>Addresses</span><span className="font-semibold text-slate-900">{addresses.length}</span></div>
              <div className="flex items-center justify-between"><span>Payment methods</span><span className="font-semibold text-slate-900">{payments.length}</span></div>
            </div>
          </CustomerInfoCard>

          <CustomerInfoCard title="Customer experience note" subtitle="Designed for faster repeat purchases.">
            <p className="text-sm leading-7 text-slate-600">
              This profile flow is structured to feel premium and organized, helping customers update identity, manage saved checkout details, and maintain a polished buying experience across the marketplace.
            </p>
          </CustomerInfoCard>

          <CustomerInfoCard title="Delete account" subtitle="Disable your customer account permanently.">
            <p className="text-sm leading-6 text-slate-600">
              Deleting your account will sign you out immediately. You can contact support later for recovery assistance.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="mt-4 inline-flex rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </CustomerInfoCard>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete customer account?"
        message="This action will disable your account and log you out immediately."
        confirmLabel={deleting ? 'Deleting...' : 'Yes, delete'}
        cancelLabel="Cancel"
        onCancel={() => !deleting && setShowDeleteConfirm(false)}
        onConfirm={deleteAccount}
      />
    </CustomerPageShell>
  );
}

export default CustomerProfilePage;

