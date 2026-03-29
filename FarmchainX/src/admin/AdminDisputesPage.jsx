import { useEffect, useState } from 'react';
import api from '../api/client';
import { AdminBadge, AdminEmptyState, AdminPanel } from './AdminUI';
import { formatDateTime, normalizeErrorMessage } from './adminFormatters';

function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [resolutionDrafts, setResolutionDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDisputes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/disputes');
      setDisputes(res.data || []);
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to load disputes.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const resolveDispute = async (disputeId) => {
    const resolutionNotes = resolutionDrafts[disputeId];
    if (!resolutionNotes?.trim()) {
      setError('Please enter resolution notes before resolving the dispute.');
      return;
    }
    setError('');
    try {
      await api.patch(`/api/admin/disputes/${disputeId}/resolve`, { resolutionNotes });
      setSuccess('Dispute resolved successfully.');
      await loadDisputes();
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to resolve dispute.'));
    }
  };

  return (
    <div className="space-y-6">
      <AdminPanel title="Dispute queue" subtitle="Review disputes raised from farmer, customer, and delivery partner portals, then record resolution notes from admin.">
        {error && <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {success && <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

        {loading ? (
          <p className="text-sm text-slate-500">Loading disputes…</p>
        ) : disputes.length === 0 ? (
          <AdminEmptyState title="No disputes yet" message="Disputes raised from the farmer, customer, or delivery partner portals will appear here for admin review." />
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const resolved = dispute.status === 'Resolved';
              return (
                <div key={dispute.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{dispute.subject}</p>
                      <p className="mt-1 text-sm text-slate-500">Created by {dispute.createdByAdminName || 'Admin'} • {formatDateTime(dispute.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <AdminBadge tone={resolved ? 'success' : 'warning'}>{dispute.status}</AdminBadge>
                      <AdminBadge tone={dispute.priority === 'Critical' || dispute.priority === 'High' ? 'danger' : 'info'}>{dispute.priority}</AdminBadge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{dispute.description}</p>
                  <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <p>Order ID: <span className="font-semibold text-slate-900">{dispute.relatedOrderId || '—'}</span></p>
                    <p>Against: <span className="font-semibold text-slate-900">{dispute.raisedAgainstRole || '—'} {dispute.raisedAgainstUserId ? `#${dispute.raisedAgainstUserId}` : ''}</span></p>
                  </div>
                  {resolved ? (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <p className="font-semibold">Resolution</p>
                      <p className="mt-1">{dispute.resolutionNotes || 'Resolved without notes.'}</p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={resolutionDrafts[dispute.id] || ''}
                        onChange={(e) => setResolutionDrafts((prev) => ({ ...prev, [dispute.id]: e.target.value }))}
                        rows={3}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        placeholder="Enter resolution notes..."
                      />
                      <button type="button" onClick={() => resolveDispute(dispute.id)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(5,150,105,0.8)]">
                        Resolve dispute
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

export default AdminDisputesPage;

