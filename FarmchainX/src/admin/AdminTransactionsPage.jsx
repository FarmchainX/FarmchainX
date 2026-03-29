import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { AdminBadge, AdminEmptyState, AdminPanel } from './AdminUI';
import { formatCurrency, formatDateTime, normalizeErrorMessage } from './adminFormatters';

function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/admin/transactions');
      setTransactions(res.data || []);
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to load transactions.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return transactions;
    return transactions.filter((transaction) => [
      transaction.orderCode,
      transaction.customerName,
      transaction.customerEmail,
      transaction.productName,
      transaction.farmerName,
      transaction.paymentMethodType,
    ].some((value) => String(value || '').toLowerCase().includes(query)));
  }, [transactions, search]);

  const submitRefund = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post(`/api/admin/transactions/${selected.orderId}/refund`, {
        amount: refundAmount ? Number(refundAmount) : undefined,
        reason: refundReason,
      });
      setSuccess(res.data?.message || 'Refund processed successfully.');
      setSelected(null);
      setRefundAmount('');
      setRefundReason('');
      await loadTransactions();
    } catch (err) {
      setError(normalizeErrorMessage(err, 'Unable to process refund.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <AdminPanel
        title="Transactions & payments"
        subtitle="Review order transactions, payment methods, delivery fees, and refund history."
        action={(
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, customer, product..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 sm:w-80"
          />
        )}
      >
        {error && <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {success && <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

        {loading ? (
          <p className="text-sm text-slate-500">Loading transactions…</p>
        ) : filteredTransactions.length === 0 ? (
          <AdminEmptyState title="No transactions found" message="Transactions will appear here once orders start flowing through the platform." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Payment</th>
                  <th className="pb-3 font-medium">Refund</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.orderId} className="border-b border-slate-100 last:border-b-0">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-slate-900">{transaction.orderCode || `#${transaction.orderId}`}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(transaction.createdAt)}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-slate-800">{transaction.customerName || '—'}</p>
                      <p className="mt-1 text-slate-500">{transaction.customerEmail || '—'}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="text-slate-800">{transaction.productName || '—'}</p>
                      <p className="mt-1 text-xs text-slate-500">Farmer: {transaction.farmerName || '—'}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-slate-900">{formatCurrency(transaction.orderAmount)}</p>
                      <p className="mt-1 text-xs text-slate-500">Delivery {formatCurrency(transaction.deliveryFee)}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <AdminBadge tone="info">{transaction.paymentMethodType || 'Unknown'}</AdminBadge>
                        <AdminBadge tone={transaction.paymentStatus === 'Refunded' ? 'warning' : 'success'}>{transaction.paymentStatus || 'Pending'}</AdminBadge>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      {transaction.refundStatus ? (
                        <div>
                          <AdminBadge tone="warning">{transaction.refundStatus}</AdminBadge>
                          <p className="mt-1 text-xs text-slate-500">{formatCurrency(transaction.refundAmount)}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No refund</span>
                      )}
                    </td>
                    <td className="py-4">
                      <button
                        type="button"
                        disabled={Boolean(transaction.refundStatus)}
                        onClick={() => {
                          setSelected(transaction);
                          setRefundAmount(transaction.orderAmount || '');
                          setRefundReason('');
                          setSuccess('');
                        }}
                        className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                      >
                        {transaction.refundStatus ? 'Refunded' : 'Refund'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <AdminPanel
        title={selected ? `Refund ${selected.orderCode}` : 'Refund support'}
        subtitle={selected ? 'Process a refund for the selected order transaction.' : 'Select an order from the list to start a refund.'}
      >
        {!selected ? (
          <AdminEmptyState title="No order selected" message="Pick a transaction from the table to open the refund form here." />
        ) : (
          <form onSubmit={submitRefund} className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <p>Customer: <span className="font-semibold text-slate-900">{selected.customerName}</span></p>
              <p className="mt-1">Product: <span className="font-semibold text-slate-900">{selected.productName || '—'}</span></p>
              <p className="mt-1">Current amount: <span className="font-semibold text-slate-900">{formatCurrency(selected.orderAmount)}</span></p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Refund amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                placeholder="State why this refund is being issued..."
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setSelected(null)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={submitting} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(225,29,72,0.8)] disabled:opacity-60">
                {submitting ? 'Processing…' : 'Process refund'}
              </button>
            </div>
          </form>
        )}
      </AdminPanel>
    </div>
  );
}

export default AdminTransactionsPage;

