import { useEffect, useState } from 'react';
import api from '../api/client';
import {
  DeliveryEmptyState,
  DeliveryPageIntro,
  DeliveryPanel,
  DeliveryPanelBody,
  DeliveryStatCard,
} from './DeliveryUI';
import { formatDateTime, formatMoney } from './formatters';

function DeliveryEarningsPage() {
  const [summary, setSummary] = useState({});
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/api/delivery/earnings/summary').then((res) => setSummary(res.data || {})).catch(() => setSummary({}));
    api.get('/api/delivery/earnings/transactions').then((res) => setRows(res.data || [])).catch(() => setRows([]));
  }, []);

  return (
    <div className="space-y-6">
      <DeliveryPageIntro
        icon="💳"
        title="Earnings"
        description="Track completed-delivery income across today, week, month, and total lifetime payout."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <DeliveryStatCard label="Today" value={formatMoney(summary.today)} chip="Daily" tone="sky" />
        <DeliveryStatCard label="Weekly" value={formatMoney(summary.weekly)} chip="7 days" tone="sky" />
        <DeliveryStatCard label="Monthly" value={formatMoney(summary.monthly)} chip="30 days" tone="amber" />
        <DeliveryStatCard label="Total" value={formatMoney(summary.total)} chip="All time" tone="violet" />
      </div>

      <DeliveryPanel>
        <DeliveryPanelBody className="overflow-x-auto">
        {rows.length === 0 ? <DeliveryEmptyState title="No transactions yet" description="Once deliveries are completed, payout transactions will appear here." /> : (
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 text-xs uppercase tracking-[0.18em]">
                <th className="py-2 pr-4 font-medium">Order</th>
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4 font-semibold text-sky-700">{row.orderCode}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.customerName}</td>
                  <td className="py-3 pr-4 text-slate-500">{formatDateTime(row.deliveredAt)}</td>
                  <td className="py-3 pr-4 font-semibold text-slate-900">{formatMoney(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </DeliveryPanelBody>
      </DeliveryPanel>
    </div>
  );
}

export default DeliveryEarningsPage;

