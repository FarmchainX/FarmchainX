import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { AdminBadge, AdminEmptyState, AdminPanel } from './AdminUI';
import { normalizeErrorMessage } from './adminFormatters';

function AdminDeliveryPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPartners = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/delivery-partners');
      setPartners(res.data || []);
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to load delivery partners.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const filteredPartners = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return partners;
    return partners.filter((partner) => [partner.fullName, partner.email, partner.vehicleType, partner.vehicleNumber]
      .some((value) => String(value || '').toLowerCase().includes(query)));
  }, [partners, search]);

  const toggleStatus = async (partner) => {
    setError('');
    try {
      await api.patch(`/api/admin/delivery-partners/${partner.userId}/status`, { enabled: !partner.enabled });
      await loadPartners();
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to update delivery partner status.'));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPanel
        title="Delivery partners"
        subtitle="Review delivery partner accounts created from the delivery portal and manage their active status from admin."
        action={(
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partner, email, vehicle..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 sm:w-72"
          />
        )}
      >
        {error && <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {loading ? (
          <p className="text-sm text-slate-500">Loading delivery partners…</p>
        ) : filteredPartners.length === 0 ? (
          <AdminEmptyState title="No delivery partners found" message="Delivery partner profiles will appear here after users register through the delivery partner portal." />
        ) : (
          <div className="space-y-3">
            {filteredPartners.map((partner) => (
              <div key={partner.userId} className="rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{partner.fullName}</p>
                    <p className="mt-1 text-sm text-slate-500">{partner.email}</p>
                    <p className="mt-1 text-xs text-slate-400">{partner.vehicleType || 'Vehicle not set'} • {partner.vehicleNumber || 'No vehicle number'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminBadge tone={partner.enabled ? 'success' : 'danger'}>{partner.enabled ? 'Active' : 'Inactive'}</AdminBadge>
                    <AdminBadge tone={partner.online ? 'info' : 'neutral'}>{partner.online ? 'Online' : 'Offline'}</AdminBadge>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                  <p>Assigned: <span className="font-semibold text-slate-900">{partner.totalAssigned || 0}</span></p>
                  <p>Delivered: <span className="font-semibold text-slate-900">{partner.deliveredCount || 0}</span></p>
                  <p>Active now: <span className="font-semibold text-slate-900">{partner.activeCount || 0}</span></p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => toggleStatus(partner)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    {partner.enabled ? 'Deactivate account' : 'Activate account'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

export default AdminDeliveryPartnersPage;

