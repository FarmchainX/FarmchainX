import { useLocation } from 'react-router-dom';
import {
  CustomerInfoCard,
  CustomerMetricCard,
  CustomerPageShell,
  CustomerPrimaryButton,
  CustomerSecondaryButton,
} from './CustomerUI';
import { formatInr } from '../utils/currency';

function CustomerOrderPlacedPage() {
  const { state } = useLocation();

  const hasOrderData = Array.isArray(state?.orderIds) && state.orderIds.length > 0;
  const orderCount = state?.orderIds?.length || 0;
  const itemCount = Number(state?.itemCount || 0);
  const totalAmount = Number(state?.totalAmount || 0);
  const placedAt = state?.placedAt ? new Date(state.placedAt) : null;

  return (
    <CustomerPageShell
      eyebrow="Order confirmed"
      title="Your order has been placed successfully"
      description="We have sent your request to the farm partner. You can track delivery updates in your orders page anytime."
      action={<CustomerSecondaryButton to="/customer/shop">Continue shopping</CustomerSecondaryButton>}
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CustomerMetricCard label="Orders created" value={orderCount || '-'} accent="rose" />
        <CustomerMetricCard label="Items placed" value={itemCount || '-'} accent="emerald" />
        <CustomerMetricCard label="Order total" value={totalAmount ? formatInr(totalAmount) : '-'} accent="amber" />
        <CustomerMetricCard label="Payment method" value={state?.paymentMethodLabel || '-'} accent="violet" />
      </div>

      <CustomerInfoCard>
        {!hasOrderData ? (
          <div className="rounded-[26px] border border-amber-200 bg-amber-50 p-6">
            <p className="text-base font-semibold text-amber-800">Order details are not available on this page.</p>
            <p className="mt-2 text-sm text-amber-700">
              Please open your orders page to view latest order status and tracking updates.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <CustomerPrimaryButton to="/customer/orders">Go to My Orders</CustomerPrimaryButton>
              <CustomerSecondaryButton to="/customer/cart">Back to cart</CustomerSecondaryButton>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-6">
              <p className="text-xl font-semibold text-emerald-800">Thank you! Your order is confirmed.</p>
              <p className="mt-2 text-sm text-emerald-700">{state?.message || 'Order placed successfully.'}</p>
              <p className="mt-2 text-xs text-emerald-700/90">
                Placed at {placedAt ? placedAt.toLocaleString() : 'just now'}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-sm font-semibold text-slate-900">Delivery address</p>
                <p className="mt-2 text-sm text-slate-600">{state?.addressLabel || 'Saved address'}</p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-sm font-semibold text-slate-900">Payment method</p>
                <p className="mt-2 text-sm text-slate-600">{state?.paymentMethodLabel || 'Saved method'}</p>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Created order IDs</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {state.orderIds.map((id) => (
                  <span key={id} className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                    #{id}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <CustomerPrimaryButton to="/customer/orders">Track my orders</CustomerPrimaryButton>
              <CustomerSecondaryButton to="/customer/shop">Buy more products</CustomerSecondaryButton>
            </div>
          </div>
        )}
      </CustomerInfoCard>
    </CustomerPageShell>
  );
}

export default CustomerOrderPlacedPage;

