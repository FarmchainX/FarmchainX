import { useEffect, useState } from 'react';
import api from '../api/client';
import { AdminBarChart, AdminEmptyState, AdminPanel, AdminStatCard } from './AdminUI';
import { formatCurrency, normalizeErrorMessage } from './adminFormatters';

function AdminReportsPage() {
  const [revenueReport, setRevenueReport] = useState(null);
  const [orderReport, setOrderReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [revenueRes, orderRes] = await Promise.all([
          api.get('/api/admin/reports/revenue'),
          api.get('/api/admin/reports/orders'),
        ]);
        setRevenueReport(revenueRes.data);
        setOrderReport(orderRes.data);
      } catch (err) {
        setError(normalizeErrorMessage(err, 'Unable to load reports.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-10 text-sm text-slate-500">Loading reports…</div>;
  }

  if (error) {
    return <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-10 text-sm text-rose-700">{error}</div>;
  }

  const revenueSummary = revenueReport?.summary || {};
  const orderSummary = orderReport?.summary || {};

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Gross Revenue" value={formatCurrency(revenueSummary.grossRevenue)} hint="Total order revenue" tone="emerald" />
        <AdminStatCard label="Delivery Revenue" value={formatCurrency(revenueSummary.deliveryRevenue)} hint="Delivery charges earned" tone="cyan" />
        <AdminStatCard label="Refunds" value={formatCurrency(revenueSummary.refunds)} hint="Processed refund total" tone="rose" />
        <AdminStatCard label="Average Order Value" value={formatCurrency(orderSummary.averageOrderValue)} hint="Average basket size" tone="indigo" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Monthly revenue analytics" subtitle="Revenue and delivery trends aggregated from current order history.">
          {revenueReport?.monthly?.length ? (
            <AdminBarChart
              items={revenueReport.monthly.map((item) => ({ label: item.label, value: Number(item.revenue || 0) }))}
              valueKey="value"
              labelKey="label"
              colorClass="bg-[linear-gradient(90deg,#059669_0%,#0d9488_100%)]"
            />
          ) : (
            <AdminEmptyState title="No revenue report data" message="Revenue analytics will appear here once orders are available." />
          )}
        </AdminPanel>

        <AdminPanel title="Order status distribution" subtitle="Operational health split by order lifecycle status.">
          {orderReport?.statusBreakdown?.length ? (
            <AdminBarChart
              items={orderReport.statusBreakdown.map((item) => ({ label: item.statusLabel, value: Number(item.total || 0) }))}
              valueKey="value"
              labelKey="label"
              colorClass="bg-[linear-gradient(90deg,#4f46e5_0%,#7c3aed_100%)]"
            />
          ) : (
            <AdminEmptyState title="No order status data" message="Order status analytics will appear here after orders are recorded." />
          )}
        </AdminPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Top revenue farmers" subtitle="Highest-performing farms by revenue and order count.">
          {revenueReport?.topFarmers?.length ? (
            <div className="space-y-3">
              {revenueReport.topFarmers.map((farmer, index) => (
                <div key={`${farmer.farmName}-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{farmer.farmName || 'Unnamed farm'}</p>
                      <p className="mt-1 text-sm text-slate-500">{farmer.farmerName || 'Farmer not available'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(farmer.revenue)}</p>
                      <p className="text-xs text-slate-500">{farmer.ordersCount || 0} orders</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState title="No farmer revenue data" message="Top farmer analytics will appear once orders exist." />
          )}
        </AdminPanel>

        <AdminPanel title="Top ordered products" subtitle="Products that currently generate the most order volume.">
          {orderReport?.topProducts?.length ? (
            <div className="space-y-3">
              {orderReport.topProducts.map((product, index) => (
                <div key={`${product.productName}-${index}`} className="rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{product.productName || 'Unknown product'}</p>
                      <p className="mt-1 text-sm text-slate-500">{product.orderCount || 0} orders</p>
                    </div>
                    <p className="font-semibold text-slate-900">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState title="No product order data" message="Top product analytics will appear after marketplace activity begins." />
          )}
        </AdminPanel>
      </section>
    </div>
  );
}

export default AdminReportsPage;

