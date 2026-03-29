import { useEffect, useState } from 'react';
import api from '../api/client';
import {
  DeliveryEmptyState,
  DeliveryPageIntro,
  DeliveryPanel,
  DeliveryPanelBody,
  DeliveryPrimaryButton,
  DeliverySecondaryLink,
  DeliveryStatusPill,
} from './DeliveryUI';
import { formatMoney } from './formatters';

function DeliveryAvailablePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get('/api/delivery/orders/available').then((res) => setRows(res.data || [])).catch(() => setRows([]));
  };

  useEffect(() => {
    load();
  }, []);

  const seedDemo = () => {
    setLoading(true);
    api.post('/api/delivery/orders/demo').then(load).finally(() => setLoading(false));
  };

  const accept = (id) => {
    api.post(`/api/delivery/orders/${id}/accept`).then(load).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <DeliveryPageIntro
        icon="🧭"
        title="Available Deliveries"
        description="Review open delivery tasks near you, compare distance and estimated earnings, and accept the best fit."
        action={
          <DeliveryPrimaryButton onClick={seedDemo} disabled={loading}>
            {loading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
            {loading ? 'Loading...' : 'Load Demo Deliveries'}
          </DeliveryPrimaryButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.length === 0 && (
          <div className="md:col-span-2">
            <DeliveryEmptyState
              title="No delivery requests available"
              description="Use the demo loader or wait for new orders to become available for assignment."
            />
          </div>
        )}
        {rows.map((row) => (
          <DeliveryPanel key={row.id}>
            <DeliveryPanelBody className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">{row.orderCode}</p>
                  <p className="mt-1 text-xs text-slate-500">Open delivery request</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">{row.distanceKm || 0} km</span>
                  <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">{formatMoney(row.earning)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-2xl bg-slate-50/80 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Farmer</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{row.farmName || 'Farm'}</p>
                  <p className="text-xs text-slate-500">{row.farmerPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Customer</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{row.customerName}</p>
                  <p className="text-xs text-slate-500">{row.customerPhone || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">📍</span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Pickup</p>
                    <p>{row.pickupLocation || 'TBD'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">🏁</span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Drop</p>
                    <p>{row.deliveryAddress || 'TBD'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <DeliveryStatusPill status="ASSIGNED" />
                <div className="flex items-center gap-2">
                  <DeliverySecondaryLink to={`/delivery/details/${row.id}`}>Details</DeliverySecondaryLink>
                  <DeliveryPrimaryButton onClick={() => accept(row.id)}>Accept</DeliveryPrimaryButton>
                </div>
              </div>
            </DeliveryPanelBody>
          </DeliveryPanel>
        ))}
      </div>
    </div>
  );
}

export default DeliveryAvailablePage;

