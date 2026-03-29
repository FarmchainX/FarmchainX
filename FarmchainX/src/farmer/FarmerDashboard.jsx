import { useEffect, useState } from 'react';
import api from '../api/client';
import { useTranslation } from '../hooks/useTranslation';
import { formatInr } from '../utils/currency';

function StatCard({ label, value, chip }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 border border-slate-100 flex flex-col justify-between">
      <div className="text-xs text-slate-500 mb-2">{label}</div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {chip && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2 py-1 border border-emerald-100">
            {chip}
          </span>
        )}
      </div>
    </div>
  );
}

function FarmerDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/farmer/dashboard').then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const recentOrders = stats?.recentOrders || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {t('farmer.welcomeBack')}, {stats?.farmerName || t('farmer.roleFarmer')}
          </h2>
          <p className="text-sm text-slate-500">
            {t('farmer.dashboardOverview')}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <button className="px-3 py-1.5 rounded-full bg-emerald-600 text-white font-medium">{t('farmer.thisMonth')}</button>
          <button className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600">{t('farmer.thisYear')}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('farmer.totalActiveBatches')} value={stats?.activeBatches ?? 0} />
        <StatCard label={t('farmer.productsListed')} value={stats?.productsListed ?? 0} />
        <StatCard label={t('farmer.totalEarnings')} value={formatInr(stats?.totalEarnings)} />
        <StatCard label={t('farmer.aiCropHealthScore')} value={stats?.aiCropHealthScore ?? 86} chip={t('farmer.healthy')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t('aiInsights.aiYieldPrediction')}</h3>
              <p className="text-xs text-slate-500">{t('aiInsights.placeholderChart')}</p>
            </div>
            <div className="flex gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> {t('aiInsights.actual')}
              </span>
              <span className="inline-flex items-center gap-1 text-amber-600">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> {t('aiInsights.predicted')}
              </span>
            </div>
          </div>
          <div className="h-48 rounded-xl bg-gradient-to-br from-emerald-50 via-slate-50 to-amber-50 border border-dashed border-emerald-100 flex items-center justify-center text-xs text-slate-400">
            {t('aiInsights.placeholderChart')}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">{t('aiInsights.marketSalesEarnings')}</h3>
          <p className="text-xs text-slate-500 mb-4">{t('aiInsights.thisMonth')}</p>
          <div className="h-48 rounded-xl bg-gradient-to-br from-emerald-50 via-slate-50 to-emerald-100 border border-dashed border-emerald-100 flex items-center justify-center text-xs text-slate-400">
            {t('aiInsights.barChartPlaceholder')}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900">{t('orders.recentOrders')}</h3>
          <a href="/farmer/orders" className="text-xs text-emerald-700 font-medium">{t('farmer.viewAll')}</a>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">{t('farmer.noOrdersYet')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-4 font-medium">{t('orders.orderId')}</th>
                  <th className="py-2 pr-4 font-medium">{t('orders.customer')}</th>
                  <th className="py-2 pr-4 font-medium">{t('orders.product')}</th>
                  <th className="py-2 pr-4 font-medium">{t('orders.qty')}</th>
                  <th className="py-2 pr-4 font-medium">{t('orders.status')}</th>
                  <th className="py-2 pr-4 font-medium">{t('orders.paymentStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50">
                    <td className="py-2 pr-4 text-emerald-700 font-medium">{row.orderCode}</td>
                    <td className="py-2 pr-4 text-slate-700">{row.customerName}</td>
                    <td className="py-2 pr-4 text-slate-700">{row.productName}</td>
                    <td className="py-2 pr-4 text-slate-700">{row.quantity}</td>
                    <td className="py-2 pr-4">
                      <span className={`inline-flex items-center rounded-full text-[11px] px-2 py-1 border ${
                        row.status === t('orders.pending') ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : row.status === t('orders.shipped') ? 'bg-sky-50 text-sky-700 border-sky-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>{row.status}</span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] px-2 py-1 border border-emerald-100">
                        {row.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmerDashboard;
