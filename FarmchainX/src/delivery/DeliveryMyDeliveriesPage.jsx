import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const nextAction = {
  ASSIGNED: 'PICKED_UP',
  PICKED_UP: 'IN_TRANSIT',
  IN_TRANSIT: 'DELIVERED',
};

function DeliveryMyDeliveriesPage() {
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    api.get('/api/delivery/orders/assigned').then((res) => setRows(res.data || [])).catch(() => setRows([]));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = (id, status) => {
    setBusyId(id);
    api.patch(`/api/delivery/orders/${id}/status`, { status })
      .then(load)
      .finally(() => setBusyId(null));
  };

  return (
    <div className="space-y-6">
      <DeliveryPageIntro
        icon="🚚"
        title="My Deliveries"
        description="Move tasks through the delivery flow from assignment to successful drop-off."
      />

      <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-white px-4 py-3 text-xs text-sky-700">
        Delivery status flow: <span className="font-semibold">Assigned</span> → <span className="font-semibold">Picked Up</span> → <span className="font-semibold">In Transit</span> → <span className="font-semibold">Delivered</span>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && (
          <DeliveryEmptyState
            title="No assigned deliveries"
            description="Accept an available task to start managing pickup and drop progress here."
            action={<DeliverySecondaryLink to="/delivery/available">Browse Available Deliveries</DeliverySecondaryLink>}
          />
        )}
        {rows.map((row) => {
          const action = nextAction[row.deliveryStatus];
          return (
            <DeliveryPanel key={row.id}>
              <DeliveryPanelBody>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-900">{row.orderCode} • {row.customerName}</p>
                      <DeliveryStatusPill status={row.deliveryStatus} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50/80 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Pickup</p>
                        <p className="mt-1">{row.pickupLocation || 'TBD'}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50/80 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Drop</p>
                        <p className="mt-1">{row.deliveryAddress || 'TBD'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <DeliverySecondaryLink to={`/delivery/details/${row.id}`}>View Details</DeliverySecondaryLink>
                  {action && (
                    <DeliveryPrimaryButton
                      onClick={() => updateStatus(row.id, action)}
                      disabled={busyId === row.id}
                    >
                      {busyId === row.id && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />}
                      {busyId === row.id ? 'Updating...' : `Mark ${action.replace('_', ' ')}`}
                    </DeliveryPrimaryButton>
                  )}
                </div>
                </div>
              </DeliveryPanelBody>
            </DeliveryPanel>
          );
        })}
      </div>
    </div>
  );
}

export default DeliveryMyDeliveriesPage;

