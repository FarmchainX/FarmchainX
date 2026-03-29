import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { AdminBadge, AdminEmptyState, AdminPanel } from './AdminUI';
import { normalizeErrorMessage } from './adminFormatters';

function AdminFarmersPage() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);

  const loadFarmers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/farmers');
      setFarmers(res.data || []);
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to load farmers.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, []);

  const filteredFarmers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return farmers;
    return farmers.filter((farmer) => [
      farmer.fullName,
      farmer.email,
      farmer.farmName,
      farmer.farmLocation,
      farmer.displayName,
    ].some((value) => String(value || '').toLowerCase().includes(query)));
  }, [farmers, search]);

  const moderate = async (userId, payload) => {
    setSavingId(userId);
    setError('');
    try {
      await api.patch(`/api/admin/users/${userId}/moderation`, payload);
      await loadFarmers();
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to update farmer status.'));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPanel
        title="Farmer accounts"
        subtitle="View farm details, listing activity, and moderate farmer accounts from one screen."
        action={(
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farm, farmer, email, location..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 sm:w-80"
          />
        )}
      >
        {error && <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {loading ? (
          <p className="text-sm text-slate-500">Loading farmer accounts…</p>
        ) : filteredFarmers.length === 0 ? (
          <AdminEmptyState title="No farmers found" message="Try adjusting your search or register a farmer account first." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-3 font-medium">Farmer</th>
                  <th className="pb-3 font-medium">Farm</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Listings</th>
                  <th className="pb-3 font-medium">Orders</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFarmers.map((farmer) => {
                  const isSaving = savingId === farmer.userId;
                  return (
                    <tr key={farmer.userId} className="border-b border-slate-100 align-top last:border-b-0">
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-slate-900">{farmer.fullName}</p>
                        <p className="mt-1 text-slate-500">{farmer.email}</p>
                        <p className="mt-1 text-xs text-slate-400">{farmer.phone}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="font-medium text-slate-800">{farmer.farmName || 'Unnamed farm'}</p>
                        <p className="mt-1 text-xs text-slate-500">Display name: {farmer.displayName || '—'}</p>
                      </td>
                      <td className="py-4 pr-4 text-slate-600">{farmer.farmLocation || '—'}</td>
                      <td className="py-4 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <AdminBadge tone="info">Batches {farmer.batchCount || 0}</AdminBadge>
                          <AdminBadge tone="purple">Products {farmer.productCount || 0}</AdminBadge>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-slate-700">{farmer.orderCount || 0}</td>
                      <td className="py-4 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <AdminBadge tone={farmer.enabled ? 'success' : 'danger'}>{farmer.enabled ? 'Active' : 'Suspended'}</AdminBadge>
                          {farmer.flagged ? <AdminBadge tone="warning">Flagged</AdminBadge> : null}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => moderate(farmer.userId, {
                              enabled: !farmer.enabled,
                              flagged: !!farmer.flagged,
                              approvalStatus: farmer.enabled ? 'SUSPENDED' : 'APPROVED',
                              suspensionReason: farmer.enabled ? 'Suspended by admin' : null,
                            })}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                          >
                            {farmer.enabled ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => moderate(farmer.userId, {
                              enabled: farmer.enabled,
                              flagged: !farmer.flagged,
                              approvalStatus: farmer.enabled ? 'APPROVED' : 'SUSPENDED',
                              suspensionReason: farmer.suspensionReason || null,
                            })}
                            className="rounded-xl border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                          >
                            {farmer.flagged ? 'Remove flag' : 'Flag account'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

export default AdminFarmersPage;

