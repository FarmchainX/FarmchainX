import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { AdminBarChart, AdminEmptyState, AdminPanel, AdminStatCard } from './AdminUI';
import { formatCurrency, formatDateTime, normalizeErrorMessage } from './adminFormatters';

function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/api/admin/dashboard');
        setData(res.data);
      } catch (err) {
        setError(normalizeErrorMessage(err, 'Unable to load admin dashboard.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = data?.stats || {};

  const revenueBars = useMemo(() => (data?.monthlyRevenue || []).map((item) => ({
    label: item.month,
    value: Number(item.revenue || 0),
  })), [data]);

  const userMixBars = useMemo(() => (data?.userMix || []).map((item) => ({
    label: item.role?.replaceAll('_', ' '),
    value: Number(item.total || 0),
  })), [data]);

  if (loading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500">Loading admin insights…</div>;
  }

  if (error) {
    return <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-10 text-sm text-rose-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Farmers" value={stats.totalFarmers || 0} hint="Active farm-side accounts" tone="emerald" />
        <AdminStatCard label="Customers" value={stats.totalCustomers || 0} hint="Marketplace buyers" tone="indigo" />
        <AdminStatCard label="Delivery Partners" value={stats.totalDeliveryPartners || 0} hint="Logistics partners" tone="cyan" />
        <AdminStatCard label="Total Orders" value={stats.totalOrders || 0} hint="Orders processed so far" tone="amber" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Net Revenue" value={formatCurrency(stats.netRevenue)} hint="Gross minus processed refunds" tone="indigo" />
        <AdminStatCard label="Gross Revenue" value={formatCurrency(stats.grossRevenue)} hint="Total order amount" tone="emerald" />
        <AdminStatCard label="Delivery Revenue" value={formatCurrency(stats.deliveryRevenue)} hint="Logistics charges collected" tone="cyan" />
        <AdminStatCard label="Refunded Amount" value={formatCurrency(stats.refundedAmount)} hint="Processed refunds only" tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <AdminPanel
          title="Revenue trend"
          subtitle="Last six months of platform revenue based on current order records."
        >
          {revenueBars.length > 0 ? (
            <AdminBarChart items={revenueBars} valueKey="value" labelKey="label" colorClass="bg-[linear-gradient(90deg,#4f46e5_0%,#7c3aed_100%)]" />
          ) : (
            <AdminEmptyState title="No revenue data yet" message="Revenue bars will appear here when orders are available." />
          )}
        </AdminPanel>

        <AdminPanel
          title="User mix"
          subtitle="Role distribution across the current FarmchainX user base."
        >
          {userMixBars.length > 0 ? (
            <AdminBarChart items={userMixBars} valueKey="value" labelKey="label" colorClass="bg-[linear-gradient(90deg,#06b6d4_0%,#3b82f6_100%)]" />
          ) : (
            <AdminEmptyState title="No user distribution data" message="Create accounts across roles to populate this panel." />
          )}
        </AdminPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <AdminPanel
          title="Recent orders"
          subtitle="A quick view of the latest platform transactions."
        >
          {data?.recentOrders?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="pb-3 font-medium">Order</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-3 pr-4 font-semibold text-slate-900">{order.orderCode || `#${order.id}`}</td>
                      <td className="py-3 pr-4 text-slate-600">{order.customerName || '—'}</td>
                      <td className="py-3 pr-4 text-slate-600">{order.productName || '—'}</td>
                      <td className="py-3 pr-4 text-slate-900">{formatCurrency(order.orderAmount)}</td>
                      <td className="py-3 pr-4 text-slate-600">{order.status || 'Pending'}</td>
                      <td className="py-3 text-slate-500">{formatDateTime(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AdminEmptyState title="No recent orders" message="Orders will appear here as soon as the marketplace starts receiving traffic." />
          )}
        </AdminPanel>

        <AdminPanel
          title="Governance watchlist"
          subtitle="Issues that need attention from the admin team."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Pending approvals</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{stats.pendingApprovals || 0}</p>
              <p className="mt-1 text-sm text-slate-600">Accounts waiting for admin review.</p>
            </div>
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Flagged users</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{stats.flaggedUsers || 0}</p>
              <p className="mt-1 text-sm text-slate-600">Users marked for special attention.</p>
            </div>
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Open disputes</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{stats.pendingDisputes || 0}</p>
              <p className="mt-1 text-sm text-slate-600">Cases waiting for resolution.</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Active batches</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{stats.activeBatches || 0}</p>
              <p className="mt-1 text-sm text-slate-600">Batches currently moving through the system.</p>
            </div>
          </div>
        </AdminPanel>
      </section>
    </div>
  );
}

export default AdminDashboardPage;

