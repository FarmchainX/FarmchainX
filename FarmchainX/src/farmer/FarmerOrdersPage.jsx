import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useTranslation } from '../hooks/useTranslation';

function StatusChip({ status }) {
  let base = 'inline-flex items-center rounded-full text-[11px] px-2 py-1 border ';
  if (status === 'Pending') base += 'bg-amber-50 text-amber-700 border-amber-100';
  else if (status === 'Shipped') base += 'bg-sky-50 text-sky-700 border-sky-100';
  else base += 'bg-emerald-50 text-emerald-700 border-emerald-100';
  return <span className={base}>{status}</span>;
}

function FarmerOrdersPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = () => {
    api.get('/api/farmer/orders').then((res) => {
      const list = res.data || [];
      if (!Array.isArray(list) || list.length === 0) {
        api.post('/api/farmer/orders/demo').then((r) => setRows(r.data || []));
      } else {
        setRows(list);
      }
    }).catch(() => setRows([]));
  };

  useEffect(() => { loadOrders(); }, []);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter;
    const term = search.trim().toLowerCase();
    const matchesSearch = term.length === 0
      || (row.orderCode || '').toLowerCase().includes(term)
      || (row.customerName || '').toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  }), [rows, statusFilter, search]);

  const handleStatusUpdate = (id, newStatus) => {
    setUpdatingId(id);
    api.patch(`/api/farmer/orders/${id}/status`, { status: newStatus })
      .then((res) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, status: res.data.status } : r)))
      .finally(() => setUpdatingId(null));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{t('common.dashboard')} / {t('farmer.orders')}</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-1">{t('farmer.orders')}</h2>
          <p className="text-sm text-slate-500">{t('farmer.trackOrdersSubtitle', { defaultValue: 'Track customer orders, shipping status and payments.' })}</p>
        </div>
        <select
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">{t('farmer.allStatus', { defaultValue: 'All Status' })}</option>
          <option value="Pending">{t('farmer.pending', { defaultValue: 'Pending' })}</option>
          <option value="Shipped">{t('farmer.shipped', { defaultValue: 'Shipped' })}</option>
          <option value="Completed">{t('farmer.completed', { defaultValue: 'Completed' })}</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder={t('farmer.searchOrderCustomer', { defaultValue: 'Search by order ID or customer' })}
          />
        </div>
        <div className="overflow-x-auto">
          {filteredRows.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">{t('farmer.noOrdersFound', { defaultValue: 'No orders found.' })}</p>
          ) : (
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-4 font-medium">{t('farmer.orderId', { defaultValue: 'Order ID' })}</th>
                  <th className="py-2 pr-4 font-medium">{t('farmer.customer', { defaultValue: 'Customer' })}</th>
                  <th className="py-2 pr-4 font-medium">{t('farmer.product', { defaultValue: 'Product' })}</th>
                  <th className="py-2 pr-4 font-medium">{t('farmer.quantity', { defaultValue: 'Quantity' })}</th>
                  <th className="py-2 pr-4 font-medium">{t('farmer.status', { defaultValue: 'Status' })}</th>
                  <th className="py-2 pr-4 font-medium">{t('farmer.payment', { defaultValue: 'Payment' })}</th>
                  <th className="py-2 pr-4 font-medium text-right">{t('farmer.actions', { defaultValue: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50">
                    <td className="py-2 pr-4 text-emerald-700 font-medium">{row.orderCode}</td>
                    <td className="py-2 pr-4 text-slate-700">{row.customerName}</td>
                    <td className="py-2 pr-4 text-slate-700">{row.product ? row.product.name : '—'}</td>
                    <td className="py-2 pr-4 text-slate-700">{row.quantity} {row.quantityUnit}</td>
                    <td className="py-2 pr-4"><StatusChip status={row.status} /></td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] px-2 py-1 border border-emerald-100">
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {row.status === 'Pending' && (
                        <button onClick={() => handleStatusUpdate(row.id, 'Shipped')} disabled={updatingId === row.id}
                          className="text-xs text-sky-700 font-medium mr-2 disabled:opacity-50">
                          {t('farmer.markShipped', { defaultValue: 'Mark Shipped' })}
                        </button>
                      )}
                      {row.status === 'Shipped' && (
                        <button onClick={() => handleStatusUpdate(row.id, 'Completed')} disabled={updatingId === row.id}
                          className="text-xs text-emerald-700 font-medium disabled:opacity-50">
                          {t('farmer.markCompleted', { defaultValue: 'Mark Completed' })}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default FarmerOrdersPage;
