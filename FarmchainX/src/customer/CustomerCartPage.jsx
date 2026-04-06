import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  CustomerEmptyState,
  CustomerInfoCard,
  CustomerMetricCard,
  CustomerPageShell,
  CustomerPrimaryButton,
  CustomerSecondaryButton,
  CustomerSectionHeader,
} from './CustomerUI';
import { formatInr } from '../utils/currency';

function CustomerCartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [message, setMessage] = useState('');
  const [checkoutState, setCheckoutState] = useState('idle');

  const load = () => {
    api.get('/api/customer/cart').then((res) => setItems(res.data || [])).catch(() => {});
    api.get('/api/customer/addresses').then((res) => {
      const rows = res.data || [];
      setAddresses(rows);
      const def = rows.find((a) => a.default || a.isDefault) || rows[0];
      if (def) setAddressId(String(def.id));
    }).catch(() => {});
    api.get('/api/customer/payments').then((res) => {
      const rows = res.data || [];
      setPayments(rows);
      const def = rows.find((m) => m.default || m.isDefault) || rows[0];
      if (def) setPaymentMethodId(String(def.id));
    }).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0), [items]);

  const updateQty = (id, qty) => {
    setMessage('');
    api.put(`/api/customer/cart/${id}`, { quantity: Math.max(1, qty) }).then(load).catch(() => {});
  };

  const removeItem = (id) => {
    setMessage('');
    api.delete(`/api/customer/cart/${id}`).then(load).catch(() => {});
  };

  const placeOrder = async () => {
    setMessage('');
    if (!addressId) {
      setMessage('Please select a delivery address.');
      return;
    }

    const resolvedPaymentMethodId = paymentMethodId || String(payments[0]?.id || '');
    if (!resolvedPaymentMethodId) {
      setMessage('No payment method found in your account. Add one in Profile to continue.');
      return;
    }

    setCheckoutState('creating');

    try {
      const checkoutRes = await api.post('/api/customer/orders', {
        addressId: Number(addressId),
        paymentMethodId: Number(resolvedPaymentMethodId),
        expectedItems: items.length,
      });

      const checkout = checkoutRes.data || {};
      const orderIds = Array.isArray(checkout.orderIds) ? checkout.orderIds : [];

      if (orderIds.length) {
        setCheckoutState('idle');
        navigate('/customer/order-success', {
          state: {
            orderIds,
            itemCount: Number(checkout.itemCount || items.length),
            totalAmount: Number(checkout.totalAmount || total),
            message: checkout.message || 'Order placed successfully.',
            paymentStatus: checkout.paymentStatus || 'Pending',
            paymentTxnId: '',
            addressLabel: selectedAddress ? `${selectedAddress.label} - ${selectedAddress.city}` : '',
            paymentMethodLabel: 'Direct order',
            placedAt: new Date().toISOString(),
          },
        });
        return;
      }

      setCheckoutState('idle');
      setMessage(checkout?.message || 'Unable to place order right now.');
    } catch (err) {
      setCheckoutState('idle');
      if (err?.response?.status === 403) {
        setMessage('Your account session does not have permission to place orders. Please login again.');
        return;
      }
      setMessage(err?.response?.data?.message || 'Unable to place order right now.');
    }
  };

  const checkoutBusy = checkoutState !== 'idle';
  const checkoutLabelByState = {
    idle: `Pay ${formatInr(total)} & Place Order`,
    creating: 'Placing order...',
    paying: 'Placing order...',
    verifying: 'Placing order...',
  };

  const selectedAddress = addresses.find((a) => String(a.id) === addressId);

  return (
    <CustomerPageShell
      eyebrow="Cart & Checkout"
      title="Review your selections before placing the order"
      description="The cart flow is designed to feel premium and simple: update quantities, confirm delivery details, and place your order with confidence."
      action={<CustomerSecondaryButton to="/customer/shop">Continue shopping</CustomerSecondaryButton>}
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CustomerMetricCard label="Cart items" value={items.length} accent="rose" />
        <CustomerMetricCard label="Saved addresses" value={addresses.length} accent="violet" />
        <CustomerMetricCard label="Payment methods" value={payments.length} accent="emerald" />
        <CustomerMetricCard label="Estimated total" value={formatInr(total)} accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_420px]">
        <CustomerInfoCard>
          <CustomerSectionHeader title="Cart items" subtitle="Update quantities or remove items before checkout." />
          <div className="mt-5 space-y-4">
            {items.length === 0 ? (
              <CustomerEmptyState
                title="Your cart is empty"
                description="Browse the marketplace and add products you love. Once items are added, checkout details will appear here."
                action={<CustomerPrimaryButton to="/customer/shop">Browse products</CustomerPrimaryButton>}
              />
            ) : items.map((item) => (
              <div key={item.id} className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} className="h-24 w-full rounded-2xl object-cover md:w-24" /> : <div className="h-24 w-full rounded-2xl bg-white md:w-24" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-slate-950">{item.productName}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatInr(item.pricePerUnit)} / {item.unit}</p>
                    <p className="mt-1 text-xs text-slate-400">Stock available: {item.stockQuantity || 0}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                      <button type="button" onClick={() => updateQty(item.id, item.quantity - 1)} className="h-10 w-10 rounded-xl text-lg text-slate-600 hover:bg-slate-50">−</button>
                      <input type="number" min="1" value={item.quantity} onChange={(e) => updateQty(item.id, Number(e.target.value) || 1)} className="w-16 border-none bg-transparent text-center text-sm font-semibold text-slate-900 outline-none" />
                      <button type="button" onClick={() => updateQty(item.id, item.quantity + 1)} className="h-10 w-10 rounded-xl text-lg text-slate-600 hover:bg-slate-50">+</button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatInr(item.lineTotal)}</p>
                      <button type="button" onClick={() => removeItem(item.id)} className="mt-1 text-xs font-semibold text-rose-600 hover:text-rose-700">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CustomerInfoCard>

        <div className="space-y-6">
          {/* Modern Checkout Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-950">Payment Details</h3>
              <p className="mt-1 text-sm text-slate-600">Complete your order securely</p>
            </div>

            <div className="space-y-5 p-6">
              {/* Step 1: Delivery Address */}
              <div className="group rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-violet-300 hover:shadow-md">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-600">📍</div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-600">Step 1: Delivery Address</label>
                </div>
                <select value={addressId} onChange={(e) => setAddressId(e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100">
                  <option value="">Choose an address...</option>
                  {addresses.map((a) => <option key={a.id} value={a.id}>{a.label} • {a.city}</option>)}
                </select>
                {selectedAddress && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-violet-50 p-3">
                    <span className="text-lg">✓</span>
                    <div className="text-xs">
                      <p className="font-semibold text-violet-900">{selectedAddress.label}</p>
                      <p className="text-violet-700">{selectedAddress.city}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Temporary direct order mode */}
              <div className="group rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-md">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-600">💳</div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-600">Step 2: Secure Payment</label>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <p className="font-semibold">Direct Order Placement</p>
                  <p className="mt-1 text-xs text-emerald-700">After clicking Pay, your order will be placed immediately.</p>
                </div>
              </div>

              {/* Alert Messages */}
              {message && (
                <div className={`flex gap-3 rounded-2xl border-l-4 px-5 py-4 ${
                  message.toLowerCase().includes('unable') || message.toLowerCase().includes('please') 
                    ? 'border-l-red-500 bg-red-50 text-red-900' 
                    : 'border-l-emerald-500 bg-emerald-50 text-emerald-900'
                }`}>
                  <span className="text-xl">{message.toLowerCase().includes('unable') || message.toLowerCase().includes('please') ? '⚠️' : '✅'}</span>
                  <div className="text-sm">
                    <p className="font-bold">{message.toLowerCase().includes('unable') || message.toLowerCase().includes('please') ? 'Action Required' : 'Success'}</p>
                    <p className="mt-1 text-xs opacity-90">{message}</p>
                  </div>
                </div>
              )}

              {/* Security & Trust Badge */}
              <div className="flex gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
                <span className="text-2xl">🔐</span>
                <div className="text-xs">
                  <p className="font-bold text-blue-900">Bank-Level Security</p>
                  <p className="text-blue-700">PCI DSS Compliant • Encrypted with 256-bit SSL</p>
                  <p className="mt-1 font-semibold text-blue-800">Gateway mode temporarily disabled</p>
                </div>
              </div>

              {/* CTA Button */}
              <button
                type="button"
                onClick={placeOrder}
                disabled={items.length === 0 || checkoutBusy || !addressId}
                className={`w-full rounded-2xl px-6 py-4 font-bold transition-all duration-300 ${
                  checkoutBusy || items.length === 0 || !addressId
                    ? 'cursor-not-allowed bg-slate-300 text-slate-400 shadow-none'
                    : 'bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 active:scale-95'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  {checkoutBusy && <span className="inline-block animate-spin text-lg">⏳</span>}
                  <span className="text-base">{checkoutLabelByState[checkoutState] || checkoutLabelByState.idle}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Enhanced Order Summary */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
              <h3 className="text-base font-bold text-slate-950">Order Summary</h3>
              <p className="text-xs text-slate-600">Final review before payment</p>
            </div>

            <div className="space-y-4 p-6">
              {/* Items Breakdown */}
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📦</span>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-600">Cart Items</p>
                    <p className="text-sm text-slate-700">{items.length} {items.length === 1 ? 'product' : 'products'}</p>
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900">{items.length}</p>
              </div>

              {/* Total Amount Highlight */}
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-100 to-orange-100 px-5 py-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💰</span>
                  <div>
                    <p className="text-xs font-bold uppercase text-amber-900">Total Amount</p>
                    <p className="text-sm text-amber-800">Subtotal including taxes</p>
                  </div>
                </div>
                <p className="text-3xl font-black text-amber-900">{formatInr(total)}</p>
              </div>

              {/* Delivery Address */}
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚚</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase text-violet-600">Delivery Address</p>
                    {selectedAddress ? (
                      <>
                        <p className="mt-2 text-sm font-semibold text-violet-900">{selectedAddress.label}</p>
                        <p className="text-xs text-violet-700">{selectedAddress.city}</p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-violet-700">No address selected</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💳</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase text-emerald-600">Payment Via</p>
                    <p className="mt-2 text-sm font-semibold text-emerald-900">Direct order mode</p>
                    <p className="text-xs text-emerald-700">Online gateway temporarily disabled</p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-slate-200" />

              {/* Final CTA */}
              <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100 p-5">
                <p className="text-xs font-semibold uppercase text-slate-600">Amount to Pay</p>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-sm text-slate-700">Includes all charges & taxes</p>
                  <p className="text-4xl font-black text-slate-900">{formatInr(total)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerPageShell>
  );
}

export default CustomerCartPage;

