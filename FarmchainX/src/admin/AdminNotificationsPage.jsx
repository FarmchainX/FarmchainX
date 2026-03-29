import { useEffect, useState } from 'react';
import api from '../api/client';
import { AdminBadge, AdminEmptyState, AdminPanel } from './AdminUI';
import { formatDateTime, normalizeErrorMessage } from './adminFormatters';

const initialForm = {
  targetRole: 'FARMER',
  title: '',
  message: '',
};

function AdminNotificationsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/notifications');
      setItems(res.data || []);
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to load notifications.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const updateField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const sendNotification = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/api/admin/notifications', form);
      setSuccess(res.data?.message || 'Broadcast notification sent.');
      setForm(initialForm);
      await loadNotifications();
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to send broadcast notification.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <AdminPanel title="Send broadcast notification" subtitle="Deliver a platform-wide message to one role segment at a time.">
        {error && <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {success && <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
        <form onSubmit={sendNotification} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Target role</label>
            <select value={form.targetRole} onChange={updateField('targetRole')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100">
              <option value="FARMER">Farmers</option>
              <option value="CUSTOMER">Customers</option>
              <option value="DELIVERY_PARTNER">Delivery Partners</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Title</label>
            <input value={form.title} onChange={updateField('title')} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Message</label>
            <textarea value={form.message} onChange={updateField('message')} rows={6} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" required />
          </div>
          <button type="submit" disabled={submitting} className="rounded-2xl bg-[linear-gradient(135deg,#4f46e5_0%,#7c3aed_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(79,70,229,0.85)] disabled:opacity-60">
            {submitting ? 'Sending…' : 'Send notification'}
          </button>
        </form>
      </AdminPanel>

      <AdminPanel title="Notification history" subtitle="Review recent admin broadcasts and their intended audience.">
        {loading ? (
          <p className="text-sm text-slate-500">Loading notifications…</p>
        ) : items.length === 0 ? (
          <AdminEmptyState title="No broadcasts yet" message="Send your first admin announcement and it will appear here." />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">By {item.createdByAdminName || 'Admin'} • {formatDateTime(item.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <AdminBadge tone="info">{item.targetRole?.replaceAll('_', ' ')}</AdminBadge>
                    <AdminBadge tone="success">{item.status || 'Sent'}</AdminBadge>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

export default AdminNotificationsPage;

