import { useEffect, useState } from 'react';
import api from '../api/client';
import {
  DeliveryEmptyState,
  DeliveryPageIntro,
  DeliveryPanel,
  DeliveryPanelBody,
} from './DeliveryUI';
import { formatDateTime, formatMoney } from './formatters';

function DeliveryHistoryPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/api/delivery/orders/history').then((res) => setRows(res.data || [])).catch(() => setRows([]));
  }, []);

  return (
    <div className="space-y-6">
      <DeliveryPageIntro
        icon="🧾"
        title="Delivery History"
        description="Review completed deliveries, payout amounts, and completed timestamps."
      />

      <DeliveryPanel>
        <DeliveryPanelBody className="overflow-x-auto">
        {rows.length === 0 ? (
          <DeliveryEmptyState
            title="No completed deliveries yet"
            description="Completed delivery records will appear here once you finish assigned tasks."
          />
        ) : (
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 text-xs uppercase tracking-[0.18em]">
                <th className="py-2 pr-4 font-medium">Order</th>
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">Delivered At</th>
                <th className="py-2 pr-4 font-medium">Earning</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-50">
                  <td className="py-3 pr-4 font-semibold text-sky-700">{row.orderCode}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.customerName}</td>
                  <td className="py-3 pr-4 text-slate-500">{formatDateTime(row.deliveredAt)}</td>
                  <td className="py-3 pr-4 font-semibold text-slate-900">{formatMoney(row.earning)}</td>
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

export default DeliveryHistoryPage;

