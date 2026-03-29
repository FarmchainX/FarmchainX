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

  const placeOrder = () => {
    setMessage('');
    if (!addressId || !paymentMethodId) {
      setMessage('Please select both delivery address and payment method.');
      return;
    }
    api.post('/api/customer/orders', {
      addressId: Number(addressId),
      paymentMethodId: Number(paymentMethodId),
      expectedItems: items.length,
    }).then((res) => {
      const orderIds = Array.isArray(res.data?.orderIds) ? res.data.orderIds : [];
      navigate('/customer/order-success', {
        state: {
          orderIds,
          itemCount: items.length,
          totalAmount: total,
          message: res.data?.message || 'Order placed successfully.',
          addressLabel: selectedAddress ? `${selectedAddress.label} - ${selectedAddress.city}` : '',
          paymentMethodLabel: selectedPayment ? `${selectedPayment.methodType}${selectedPayment.provider ? ` - ${selectedPayment.provider}` : ''}` : '',
          placedAt: new Date().toISOString(),
        },
      });
    }).catch((err) => {
      if (err?.response?.status === 403) {
        setMessage('Your account session does not have permission to place orders. Please login again.');
        return;
      }
      setMessage(err?.response?.data?.message || 'Unable to place order right now.');
    });
  };

  const selectedAddress = addresses.find((a) => String(a.id) === addressId);
  const selectedPayment = payments.find((m) => String(m.id) === paymentMethodId);

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
          <CustomerInfoCard title="Checkout" subtitle="Select saved delivery and payment preferences.">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Delivery address</label>
                <select value={addressId} onChange={(e) => setAddressId(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100">
                  <option value="">Select address</option>
                  {addresses.map((a) => <option key={a.id} value={a.id}>{a.label} - {a.city}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Payment method</label>
                <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100">
                  <option value="">Select method</option>
                  {payments.map((m) => <option key={m.id} value={m.id}>{m.methodType} {m.provider ? `- ${m.provider}` : ''}</option>)}
                </select>
              </div>

              {message && (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${message.toLowerCase().includes('unable') || message.toLowerCase().includes('please') ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                  {message}
                </div>
              )}

              <CustomerPrimaryButton type="button" className="w-full" onClick={placeOrder} disabled={items.length === 0}>
                Place Order
              </CustomerPrimaryButton>
            </div>
          </CustomerInfoCard>

          <CustomerInfoCard title="Order summary" subtitle="A clean overview of what will be placed.">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between"><span>Items</span><span className="font-semibold text-slate-900">{items.length}</span></div>
              <div className="flex items-center justify-between"><span>Product total</span><span className="font-semibold text-slate-900">{formatInr(total)}</span></div>
              <div className="flex items-center justify-between"><span>Delivery address</span><span className="max-w-[180px] truncate text-right font-medium text-slate-900">{selectedAddress ? `${selectedAddress.label} • ${selectedAddress.city}` : 'Not selected'}</span></div>
              <div className="flex items-center justify-between"><span>Payment</span><span className="max-w-[180px] truncate text-right font-medium text-slate-900">{selectedPayment ? `${selectedPayment.methodType}${selectedPayment.provider ? ` • ${selectedPayment.provider}` : ''}` : 'Not selected'}</span></div>
            </div>
          </CustomerInfoCard>
        </div>
      </div>
    </CustomerPageShell>
  );
}

export default CustomerCartPage;

