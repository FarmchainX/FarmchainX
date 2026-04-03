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
      eyebrow="🎉 Order Confirmed!"
      title="Your payment is complete and order placed"
      description="Thank you for your purchase! We've sent your order to our farm partners. Track delivery updates in your orders."
      action={<CustomerSecondaryButton to="/customer/shop">Continue shopping</CustomerSecondaryButton>}
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CustomerMetricCard label="Orders created" value={orderCount || '-'} accent="rose" />
        <CustomerMetricCard label="Items placed" value={itemCount || '-'} accent="emerald" />
        <CustomerMetricCard label="Order total" value={totalAmount ? formatInr(totalAmount) : '-'} accent="amber" />
        <CustomerMetricCard label="Payment status" value={state?.paymentStatus || '-'} accent="violet" />
      </div>

      <CustomerInfoCard>
        {!hasOrderData ? (
          <div className="rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8">
            <p className="text-xl font-bold text-amber-900">Order details are not available</p>
            <p className="mt-3 text-sm text-amber-800">
              Please open your orders page to view the latest order status and tracking information.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <CustomerPrimaryButton to="/customer/orders">View My Orders</CustomerPrimaryButton>
              <CustomerSecondaryButton to="/customer/cart">Back to cart</CustomerSecondaryButton>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="overflow-hidden rounded-3xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="text-5xl">✅</div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-emerald-900">Your order is confirmed!</p>
                  <p className="mt-2 text-sm text-emerald-800">{state?.message || 'Payment processed successfully and order placed with all farm partners.'}</p>
                  <p className="mt-3 text-xs font-semibold text-emerald-700">
                    📅 Placed at {placedAt ? placedAt.toLocaleString() : 'just now'}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Details Grid */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Delivery Address */}
              <div className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
                <div className="border-b border-violet-100 bg-violet-100/40 px-5 py-3">
                  <p className="text-xs font-bold uppercase text-violet-700">📍 Delivery Address</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm font-semibold text-violet-900">{state?.addressLabel || 'Saved address'}</p>
                  <p className="mt-2 text-xs text-violet-700">Your order will be delivered to this address</p>
                </div>
              </div>

              {/* Payment Details */}
              <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
                <div className="border-b border-emerald-100 bg-emerald-100/40 px-5 py-3">
                  <p className="text-xs font-bold uppercase text-emerald-700">💳 Payment Details</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm font-semibold text-emerald-900">{state?.paymentMethodLabel || 'Saved method'}</p>
                  {state?.paymentTxnId && (
                    <>
                      <p className="mt-2 text-xs text-emerald-700">
                        <span className="font-semibold">Transaction ID:</span>
                        <br />
                        <code className="mt-1 block rounded bg-emerald-100 px-2 py-1 font-mono text-xs text-emerald-800">{state.paymentTxnId}</code>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Order IDs Summary */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                <p className="text-xs font-bold uppercase text-slate-700">📋 Order Confirmation</p>
              </div>
              <div className="px-5 py-5">
                <p className="text-xs text-slate-600">You have successfully placed <span className="font-bold text-slate-900">{orderCount}</span> {orderCount === 1 ? 'order' : 'orders'} with our farm partners.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {state.orderIds.map((id) => (
                    <div key={id} className="flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2">
                      <span className="text-sm">🏷️</span>
                      <code className="font-mono text-xs font-bold text-violet-900">#{id}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="border-b border-amber-100 px-5 py-3">
                <p className="text-xs font-bold uppercase text-amber-700">📦 Order Summary</p>
              </div>
              <div className="space-y-3 px-5 py-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-amber-800">Items ordered</p>
                  <p className="text-lg font-bold text-amber-900">{itemCount}</p>
                </div>
                <div className="border-t border-amber-200 pt-3" />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-amber-800">Total amount paid</p>
                  <p className="text-2xl font-black text-amber-900">{formatInr(totalAmount)}</p>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-900">What happens next?</p>
              <ol className="mt-3 space-y-2 text-xs text-blue-800">
                <li>✓ <span className="font-semibold">Payment Verified:</span> Your payment has been confirmed</li>
                <li>⏳ <span className="font-semibold">Farm Confirmation:</span> Farm partners will confirm availability within 1-2 hours</li>
                <li>📦 <span className="font-semibold">Packing & Dispatch:</span> Your items will be packed and prepared for delivery</li>
                <li>🚚 <span className="font-semibold">Delivery:</span> Track your order status and delivery updates anytime</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <CustomerPrimaryButton to="/customer/orders">📊 Track My Orders</CustomerPrimaryButton>
              <CustomerSecondaryButton to="/customer/shop">🛒 Buy More Products</CustomerSecondaryButton>
            </div>
          </div>
        )}
      </CustomerInfoCard>
    </CustomerPageShell>
  );
}

export default CustomerOrderPlacedPage;

