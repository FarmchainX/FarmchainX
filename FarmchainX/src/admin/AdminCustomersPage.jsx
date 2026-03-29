import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { AdminBadge, AdminEmptyState, AdminPanel } from './AdminUI';
import { formatCurrency, formatDateTime, normalizeErrorMessage } from './adminFormatters';

function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/customers');
      setCustomers(res.data || []);
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to load customers.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) => [customer.fullName, customer.email, customer.city, customer.preferredName]
      .some((value) => String(value || '').toLowerCase().includes(query)));
  }, [customers, search]);

  const moderate = async (customer, payload) => {
    setError('');
    try {
      await api.patch(`/api/admin/users/${customer.userId}/moderation`, payload);
      await loadCustomers();
      if (selectedCustomer?.userId === customer.userId) {
        setSelectedCustomer((prev) => ({ ...prev, ...payload }));
      }
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to update customer account.'));
    }
  };

  const viewOrders = async (customer) => {
    setSelectedCustomer(customer);
    setOrdersLoading(true);
    setSelectedOrders([]);
    try {
      const res = await api.get(`/api/admin/customers/${customer.userId}/orders`);
      setSelectedOrders(res.data || []);
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to load customer order history.'));
    } finally {
      setOrdersLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <AdminPanel
        title="Customer accounts"
        subtitle="Review customers, their order activity, spending, and account safety status."
        action={(
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, email, city..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 sm:w-72"
          />
        )}
      >
        {error && <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {loading ? (
          <p className="text-sm text-slate-500">Loading customer accounts…</p>
        ) : filteredCustomers.length === 0 ? (
          <AdminEmptyState title="No customers found" message="Try a different search or create a customer account first." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Orders</th>
                  <th className="pb-3 font-medium">Spent</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.userId} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-slate-900">{customer.fullName}</p>
                      <p className="mt-1 text-slate-500">{customer.email}</p>
                      <p className="mt-1 text-xs text-slate-400">Preferred name: {customer.preferredName || '—'}</p>
                    </td>
                    <td className="py-4 pr-4 text-slate-600">{customer.city || '—'}</td>
                    <td className="py-4 pr-4 text-slate-700">{customer.orderCount || 0}</td>
                    <td className="py-4 pr-4 text-slate-900">{formatCurrency(customer.totalSpent)}</td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <AdminBadge tone={customer.enabled ? 'success' : 'danger'}>{customer.enabled ? 'Active' : 'Suspended'}</AdminBadge>
                        {customer.flagged ? <AdminBadge tone="warning">Flagged</AdminBadge> : null}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => viewOrders(customer)}
                          className="rounded-xl border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                        >
                          View orders
                        </button>
                        <button
                          type="button"
                          onClick={() => moderate(customer, {
                            enabled: !customer.enabled,
                            flagged: !!customer.flagged,
                            approvalStatus: customer.enabled ? 'SUSPENDED' : 'APPROVED',
                            suspensionReason: customer.enabled ? 'Suspended by admin' : null,
                          })}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {customer.enabled ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => moderate(customer, {
                            enabled: customer.enabled,
                            flagged: !customer.flagged,
                            approvalStatus: customer.enabled ? 'APPROVED' : 'SUSPENDED',
                          })}
                          className="rounded-xl border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                        >
                          {customer.flagged ? 'Remove flag' : 'Flag'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <AdminPanel
        title={selectedCustomer ? `${selectedCustomer.fullName}'s order history` : 'Order history preview'}
        subtitle={selectedCustomer ? 'Detailed order activity for the selected customer account.' : 'Select a customer to inspect their marketplace order history.'}
      >
        {!selectedCustomer ? (
          <AdminEmptyState title="No customer selected" message="Choose a customer from the table to load their orders here." />
        ) : ordersLoading ? (
          <p className="text-sm text-slate-500">Loading order history…</p>
        ) : selectedOrders.length === 0 ? (
          <AdminEmptyState title="No orders found" message="This customer has not placed any orders yet." />
        ) : (
          <div className="space-y-3">
            {selectedOrders.map((order) => (
              <div key={order.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{order.orderCode || `#${order.id}`}</p>
                    <p className="mt-1 text-sm text-slate-600">{order.productName || 'Product not available'}</p>
                  </div>
                  <AdminBadge tone={order.status === 'Delivered' ? 'success' : 'info'}>{order.status || 'Pending'}</AdminBadge>
                </div>
                <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>Amount: <span className="font-semibold text-slate-900">{formatCurrency(order.orderAmount)}</span></p>
                  <p>Delivery: <span className="font-semibold text-slate-900">{order.deliveryStatus || 'Unassigned'}</span></p>
                  <p>Payment: <span className="font-semibold text-slate-900">{order.paymentStatus || 'Pending'}</span></p>
                  <p>Created: <span className="font-semibold text-slate-900">{formatDateTime(order.createdAt)}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

export default AdminCustomersPage;

