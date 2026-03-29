import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useTranslation } from '../hooks/useTranslation';

function StatusPill({ status }) {
  const verified = status === 'VERIFIED';
  return (
    <span
      className={`inline-flex items-center rounded-full text-[11px] px-2 py-1 border ${
        verified
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
          : 'bg-amber-50 text-amber-700 border-amber-100'
      }`}
    >
      {status || 'PENDING'}
    </span>
  );
}

function FarmerBlockchainPage() {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/farmer/blockchain')
      .then((res) => setRecords(res.data || []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((rec) => {
      const matchesStatus =
        statusFilter === 'ALL' || rec.status === statusFilter;
      const batchCode = rec.batch?.batchCode || '';
      const matchesSearch =
        term.length === 0 ||
        batchCode.toLowerCase().includes(term) ||
        (rec.traceHash || '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [records, statusFilter, search]);

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{t('common.dashboard')} / {t('farmer.blockchainRecords')}</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-1">
            {t('farmer.blockchainRecords')}
          </h2>
          <p className="text-sm text-slate-500">
            {t('farmer.viewImmutableRecords', { defaultValue: 'View immutable traceability records for your crop batches.' })}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <select
            className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-600 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">{t('farmer.allStatus', { defaultValue: 'All Status' })}</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder={t('farmer.searchBatchOrHash', { defaultValue: 'Search by Batch ID or hash' })}
          />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center">{t('farmer.loadingNotifications')}</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {t('farmer.noBlockchainRecords', { defaultValue: 'No blockchain records yet. Create a crop batch to generate one.' })}
            </p>
          ) : (
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-4 font-medium">{t('farmer.batchId', { defaultValue: 'Batch ID' })}</th>
                  <th className="py-2 pr-4 font-medium">{t('farmer.crop', { defaultValue: 'Crop' })}</th>
                  <th className="py-2 pr-4 font-medium">{t('farmer.hash', { defaultValue: 'Hash' })}</th>
                  <th className="py-2 pr-4 font-medium">{t('farmer.timestamp', { defaultValue: 'Timestamp' })}</th>
                  <th className="py-2 pr-4 font-medium">{t('farmer.status', { defaultValue: 'Status' })}</th>
                  <th className="py-2 pr-4 font-medium">{t('farmer.verified', { defaultValue: 'Verified' })}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50">
                    <td className="py-2 pr-4 text-emerald-700 font-medium">
                      {row.batch?.batchCode || '—'}
                    </td>
                    <td className="py-2 pr-4 text-slate-700">
                      {row.batch?.cropName || '—'}
                    </td>
                    <td className="py-2 pr-4 text-slate-700 font-mono text-[10px] max-w-[160px] truncate" title={row.traceHash}>
                      {row.traceHash}
                    </td>
                    <td className="py-2 pr-4 text-slate-700">
                      {formatTimestamp(row.timestamp)}
                    </td>
                    <td className="py-2 pr-4">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="py-2 pr-4 text-slate-700">
                      {row.verified ? `✅ ${t('farmer.yes', { defaultValue: 'Yes' })}` : `❌ ${t('farmer.no', { defaultValue: 'No' })}`}
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

export default FarmerBlockchainPage;
