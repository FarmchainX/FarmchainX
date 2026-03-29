import { useEffect, useState } from 'react';
import api from '../api/client';
import {
  DeliveryEmptyState,
  DeliveryPageIntro,
  DeliveryPanel,
  DeliveryPanelBody,
  DeliveryPrimaryButton,
  DeliverySectionHeader,
  DeliverySecondaryLink,
  DeliveryStatCard,
  DeliveryStatusPill,
} from './DeliveryUI';
import { formatMoney } from './formatters';

function DeliveryDashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/delivery/dashboard').then((res) => setStats(res.data)).catch(() => {});
  }, []);

  const toggleOnline = () => {
    const next = !stats?.online;
    api.patch('/api/delivery/dashboard/availability', { online: next })
      .then(() => setStats((prev) => ({ ...prev, online: next })))
      .catch(() => {});
  };

  return (
    <div className="space-y-6">
      <DeliveryPageIntro
        icon="📊"
        title={`Welcome, ${stats?.partnerName || 'Partner'}`}
        description="Track today's load, active tasks, and payout summary from one driver-focused dashboard."
        action={
          <div className="flex items-center gap-2">
            <DeliverySecondaryLink to="/delivery/available">Find Deliveries</DeliverySecondaryLink>
            <DeliveryPrimaryButton onClick={toggleOnline} className={stats?.online ? '' : '!bg-white !bg-none !text-slate-700 !border !border-slate-300 !shadow-none hover:!bg-slate-50'}>
              <span className={`h-2.5 w-2.5 rounded-full ${stats?.online ? 'bg-white/90' : 'bg-sky-500'}`} />
              {stats?.online ? 'Online' : 'Offline'}
            </DeliveryPrimaryButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DeliveryStatCard label="Today's Deliveries" value={stats?.todayDeliveries ?? 0} chip="Completed" tone="sky" helper="Successfully completed today" />
        <DeliveryStatCard label="Pending Pickups" value={stats?.pendingPickups ?? 0} chip="Pickup" tone="amber" helper="Orders waiting at source" />
        <DeliveryStatCard label="In Transit" value={stats?.inTransit ?? 0} chip="On route" tone="sky" helper="Orders currently moving" />
        <DeliveryStatCard label="Earnings Today" value={formatMoney(stats?.earningsToday)} chip="Live" tone="violet" helper="Today's completed payout total" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DeliveryPanel className="lg:col-span-2">
          <DeliveryPanelBody>
            <DeliverySectionHeader title="Tasks List" subtitle="Your active assigned deliveries" />
          {(stats?.tasks || []).length === 0 ? (
            <DeliveryEmptyState
              title="No active tasks right now"
              description="When you accept deliveries, they’ll appear here with route and status information."
            />
          ) : (
            <div className="space-y-3">
              {stats.tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{task.orderCode} • {task.customerName}</p>
                      <p className="mt-1 text-xs text-slate-500">Pickup: {task.pickupLocation || 'TBD'}</p>
                      <p className="text-xs text-slate-500">Drop: {task.deliveryAddress || 'TBD'}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <DeliveryStatusPill status={task.deliveryStatus} />
                      <span className="rounded-full border border-sky-100 bg-white px-2.5 py-1 text-[11px] font-medium text-sky-700">
                        {task.distanceKm || 0} km route
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </DeliveryPanelBody>
        </DeliveryPanel>
        <DeliveryPanel>
          <DeliveryPanelBody>
            <DeliverySectionHeader title="Live Map Preview" subtitle="Route and current location area" />
            <div className="h-72 rounded-2xl border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50 p-4">
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">Pickup</span>
                  <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">Drop</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-sky-300 bg-white text-xl text-sky-600 shadow-sm">📍</div>
                  <p className="text-sm font-medium text-slate-700">{stats?.mapPreview || 'Map preview placeholder'}</p>
                  <p className="mt-1 text-xs text-slate-400">Interactive navigation can be connected later.</p>
                </div>
                <div className="rounded-2xl bg-white/80 px-4 py-3 text-xs text-slate-500 shadow-sm">
                  Current status overview and route visualization area.
                </div>
              </div>
            </div>
          </DeliveryPanelBody>
        </DeliveryPanel>
      </div>
    </div>
  );
}

export default DeliveryDashboardPage;

