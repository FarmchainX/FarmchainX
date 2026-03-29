import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import {
  DeliveryPageIntro,
  DeliveryPanel,
  DeliveryPanelBody,
  DeliveryPrimaryButton,
  DeliverySecondaryLink,
  DeliveryStatusPill,
} from './DeliveryUI';
import { formatMoney } from './formatters';

function DeliveryDetailsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/api/delivery/orders/${id}`).then((res) => setData(res.data)).catch(() => setData(null));
  }, [id]);

  const onStatus = (status) => {
    api.patch(`/api/delivery/orders/${id}/status`, { status })
      .then(() => api.get(`/api/delivery/orders/${id}`))
      .then((res) => setData(res.data))
      .catch(() => {});
  };

  if (!data) {
    return <p className="text-sm text-slate-400">Delivery details not found.</p>;
  }

  return (
    <div className="space-y-6">
      <DeliveryPageIntro
        icon="🗺️"
        title="Delivery Details"
        description={`Track full delivery context for ${data.orderCode}.`}
        action={<DeliveryStatusPill status={data.deliveryStatus} />}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DeliveryPanel className="xl:col-span-2">
          <DeliveryPanelBody className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50/80 p-4 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Farmer Info</p>
                <p className="mt-2 font-semibold text-slate-900">{data.farmerName}</p>
                <p className="text-slate-500">{data.farmerPhone || 'N/A'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50/80 p-4 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Customer Info</p>
                <p className="mt-2 font-semibold text-slate-900">{data.customerName}</p>
                <p className="text-slate-500">{data.customerPhone || 'N/A'}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-5">
              <div className="space-y-4 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">📍</div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Pickup Location</p>
                    <p className="mt-1 font-medium text-slate-900">{data.pickupLocation || 'TBD'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">🏁</div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Delivery Address</p>
                    <p className="mt-1 font-medium text-slate-900">{data.deliveryAddress || 'TBD'}</p>
                  </div>
                </div>
              </div>
            </div>
          </DeliveryPanelBody>
        </DeliveryPanel>

        <DeliveryPanel>
          <DeliveryPanelBody className="space-y-4">
            <div className="rounded-2xl bg-slate-50/80 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Delivery Summary</p>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between"><span>Order</span><span className="font-medium text-slate-900">{data.orderCode}</span></div>
                <div className="flex items-center justify-between"><span>Distance</span><span className="font-medium text-slate-900">{data.distanceKm || 0} km</span></div>
                <div className="flex items-center justify-between"><span>Earning</span><span className="font-medium text-indigo-700">{formatMoney(data.earning)}</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <a href={`tel:${data.farmerPhone || ''}`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Call Farmer</a>
              <a href={`tel:${data.customerPhone || ''}`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Call Customer</a>
              <button className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Navigate</button>
            </div>
          </DeliveryPanelBody>
        </DeliveryPanel>
      </div>

      <div className="flex flex-wrap gap-2">
        {data.deliveryStatus === 'ASSIGNED' && (
          <DeliveryPrimaryButton onClick={() => onStatus('PICKED_UP')}>Mark Picked Up</DeliveryPrimaryButton>
        )}
        {data.deliveryStatus === 'PICKED_UP' && (
          <DeliveryPrimaryButton onClick={() => onStatus('IN_TRANSIT')}>Mark In Transit</DeliveryPrimaryButton>
        )}
        {data.deliveryStatus === 'IN_TRANSIT' && (
          <DeliveryPrimaryButton onClick={() => onStatus('DELIVERED')}>Mark Delivered</DeliveryPrimaryButton>
        )}
        <DeliverySecondaryLink to="/delivery/my-deliveries">Back to My Deliveries</DeliverySecondaryLink>
      </div>
    </div>
  );
}

export default DeliveryDetailsPage;

