import { useEffect, useState } from 'react';
import api from '../api/client';
import {
  CustomerEmptyState,
  CustomerInfoCard,
  CustomerMetricCard,
  CustomerPageShell,
  CustomerSectionHeader,
  CustomerStatusBadge,
  CustomerTimelineStep,
} from './CustomerUI';
import { formatInr } from '../utils/currency';

function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/api/customer/orders').then((res) => setOrders(res.data || [])).catch(() => {});
  }, []);

  const loadDetails = (id) => {
    api.get(`/api/customer/orders/${id}`).then((res) => setSelected(res.data)).catch(() => {});
  };

  const deliveredCount = orders.filter((row) => String(row.deliveryStatus || row.status).toUpperCase().includes('DELIVERED') || String(row.status).toUpperCase().includes('COMPLETED')).length;

  return (
    <CustomerPageShell
      eyebrow="My Orders"
      title="Track every order from confirmation to doorstep"
      description="Review recent purchases, inspect delivery status, and open an order detail panel that makes tracking feel clear and premium."
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CustomerMetricCard label="Total orders" value={orders.length} accent="rose" />
        <CustomerMetricCard label="Delivered" value={deliveredCount} accent="emerald" />
        <CustomerMetricCard label="In progress" value={Math.max(orders.length - deliveredCount, 0)} accent="violet" />
        <CustomerMetricCard label="Selected order" value={selected?.orderCode || '—'} accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.25fr)_420px]">
        <CustomerInfoCard>
          <CustomerSectionHeader title="Order history" subtitle="Select any order card to inspect tracking and payment details." />
          <div className="mt-5 space-y-4">
            {orders.length === 0 ? (
              <CustomerEmptyState
                title="No orders yet"
                description="Once you place your first order, the full status journey will be visible here with a clean tracking view."
              />
            ) : orders.map((row) => (
              <button key={row.id} type="button" onClick={() => loadDetails(row.id)} className={`w-full rounded-[26px] border p-4 text-left transition ${selected?.id === row.id ? 'border-emerald-300 bg-emerald-50/70 shadow-sm' : 'border-slate-200 bg-slate-50/60 hover:border-emerald-200 hover:bg-white'}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-950">{row.orderCode}</p>
                      <CustomerStatusBadge status={row.deliveryStatus || row.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{row.productName || 'Product'} • {row.farmName || 'FarmchainX Farm Partner'}</p>
                    <p className="mt-1 text-xs text-slate-400">Placed on {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-lg font-semibold text-emerald-700">{formatInr(row.orderAmount)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Payment {row.paymentStatus || 'Pending'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CustomerInfoCard>

        <CustomerInfoCard title="Order details" subtitle="Open an order to see the full story.">
          {!selected ? (
            <CustomerEmptyState
              title="Select an order"
              description="Tap any order card from the left to view delivery status, payment details and timeline progress."
            />
          ) : (
            <div className="space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-slate-950">{selected.orderCode}</p>
                  <CustomerStatusBadge status={selected.deliveryStatus || selected.status || 'Pending'} />
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">Product:</span> {selected.productName || 'Product'}</p>
                  <p><span className="font-semibold text-slate-900">Farm:</span> {selected.farmName || 'N/A'}</p>
                  <p><span className="font-semibold text-slate-900">Amount:</span> {selected.orderAmount == null ? '—' : formatInr(selected.orderAmount)}</p>
                  <p><span className="font-semibold text-slate-900">Payment:</span> {selected.paymentStatus || 'Pending'}</p>
                  <p><span className="font-semibold text-slate-900">Address:</span> {selected.deliveryAddress || 'N/A'}</p>
                </div>
              </div>

              <div>
                <CustomerSectionHeader title="Delivery timeline" subtitle="Live milestone view of this order." />
                <div className="mt-4">
                  <CustomerTimelineStep title="Order placed" caption={selected.createdAt ? new Date(selected.createdAt).toLocaleString() : 'Waiting'} active={Boolean(selected.createdAt)} />
                  <CustomerTimelineStep title="Partner assigned" caption={selected.assignedAt ? new Date(selected.assignedAt).toLocaleString() : 'Pending assignment'} active={Boolean(selected.assignedAt)} />
                  <CustomerTimelineStep title="Picked up" caption={selected.pickedUpAt ? new Date(selected.pickedUpAt).toLocaleString() : 'Not picked up yet'} active={Boolean(selected.pickedUpAt)} />
                  <CustomerTimelineStep title="In transit" caption={selected.inTransitAt ? new Date(selected.inTransitAt).toLocaleString() : 'Awaiting transit'} active={Boolean(selected.inTransitAt)} />
                  <CustomerTimelineStep title="Delivered" caption={selected.deliveredAt ? new Date(selected.deliveredAt).toLocaleString() : 'Not delivered yet'} active={Boolean(selected.deliveredAt)} />
                </div>
              </div>
            </div>
          )}
        </CustomerInfoCard>
      </div>
    </CustomerPageShell>
  );
}

export default CustomerOrdersPage;

