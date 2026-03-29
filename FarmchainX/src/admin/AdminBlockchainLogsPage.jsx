import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { AdminBadge, AdminEmptyState, AdminPanel } from './AdminUI';
import { formatDateTime, normalizeErrorMessage } from './adminFormatters';

function AdminBlockchainLogsPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/api/admin/blockchain-logs');
        setLogs(res.data || []);
      } catch (err) {
        setError(normalizeErrorMessage(err, 'Unable to load blockchain logs.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) => [log.batchCode, log.traceHash, log.cropName, log.farmName, log.farmerName]
      .some((value) => String(value || '').toLowerCase().includes(query)));
  }, [logs, search]);

  return (
    <AdminPanel
      title="Blockchain trace logs"
      subtitle="View recorded batch traces, blockchain hashes, verification state, and related farm context."
      action={(
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search batch, hash, crop, farm..."
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 sm:w-80"
        />
      )}
    >
      {error && <p className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-500">Loading blockchain logs…</p>
      ) : filteredLogs.length === 0 ? (
        <AdminEmptyState title="No blockchain logs found" message="Trace logs will appear here once batches are written to the blockchain record table." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="pb-3 font-medium">Batch</th>
                <th className="pb-3 font-medium">Crop & Farm</th>
                <th className="pb-3 font-medium">Hash</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 align-top last:border-b-0">
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-slate-900">{log.batchCode}</p>
                    <p className="mt-1 text-xs text-slate-500">Record #{log.id}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="font-medium text-slate-800">{log.cropName || '—'}</p>
                    <p className="mt-1 text-slate-500">{log.farmName || '—'} • {log.farmerName || '—'}</p>
                  </td>
                  <td className="py-4 pr-4 text-xs text-slate-600">
                    <div className="max-w-[260px] break-all rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">{log.traceHash || '—'}</div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex flex-wrap gap-2">
                      <AdminBadge tone={log.verified ? 'success' : 'warning'}>{log.verified ? 'Verified' : 'Pending verification'}</AdminBadge>
                      <AdminBadge tone="info">{log.status || 'Recorded'}</AdminBadge>
                    </div>
                  </td>
                  <td className="py-4 text-slate-500">{formatDateTime(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPanel>
  );
}

export default AdminBlockchainLogsPage;

