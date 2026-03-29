import { useState } from 'react';
import api from '../api/client';
import {
  CustomerInfoCard,
  CustomerMetricCard,
  CustomerPageShell,
  CustomerPrimaryButton,
  CustomerSectionHeader,
  CustomerStatusBadge,
} from './CustomerUI';

function CustomerScanQrPage() {
  const [batchId, setBatchId] = useState('');
  const [result, setResult] = useState(null);

  const verify = (e) => {
    e.preventDefault();
    api.get('/api/customer/qr/verify', { params: { batchId } }).then((res) => {
      setResult(res.data);
    }).catch(() => {
      setResult({ verified: false, message: 'Unable to verify batch.' });
    });
  };

  return (
    <CustomerPageShell
      eyebrow="Scan QR"
      title="Verify product authenticity before you buy"
      description="Use the batch ID or uploaded QR image placeholder to validate produce provenance and reinforce the premium trust experience customers expect."
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CustomerMetricCard label="Verification mode" value="Batch ID" accent="violet" />
        <CustomerMetricCard label="Blockchain check" value={result?.verified ? 'Passed' : 'Pending'} accent="emerald" />
        <CustomerMetricCard label="Latest batch" value={result?.batchCode || '—'} accent="rose" />
        <CustomerMetricCard label="Trust layer" value="Traceable" accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <CustomerInfoCard>
          <CustomerSectionHeader title="Scan or enter batch ID" subtitle="A polished verification flow for premium customer confidence." />
          <form onSubmit={verify} className="mt-5 space-y-4">
            <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-violet-200 bg-[linear-gradient(135deg,#f8f6ff_0%,#fff8fb_100%)] px-6 text-center transition hover:border-violet-300">
              <span className="text-4xl">📷</span>
              <span className="mt-3 text-base font-semibold text-slate-900">Upload QR image</span>
              <span className="mt-1 text-sm text-slate-500">UI placeholder for now — you can still verify instantly with manual batch ID.</span>
              <input type="file" accept="image/*" className="hidden" />
            </label>

            <input value={batchId} onChange={(e) => setBatchId(e.target.value)} placeholder="Enter batch ID e.g. BATCH-001" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" required />

            <CustomerPrimaryButton type="submit">Verify authenticity</CustomerPrimaryButton>
          </form>
        </CustomerInfoCard>

        <CustomerInfoCard title="Why this matters" subtitle="Strict verification reinforces trust in every order.">
          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl bg-violet-50 p-4">
              <p className="font-semibold text-violet-800">Authentic sourcing</p>
              <p className="mt-1 leading-6 text-violet-700/85">Batch verification helps customers buy produce with visible origin confidence.</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="font-semibold text-amber-800">Blockchain-backed traceability</p>
              <p className="mt-1 leading-6 text-amber-700/85">Confirmed batches expose a stronger transparency story across the customer portal.</p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-4">
              <p className="font-semibold text-violet-800">Premium customer trust</p>
              <p className="mt-1 leading-6 text-violet-700/85">A polished verification experience makes the portal feel dependable and modern.</p>
            </div>
          </div>
        </CustomerInfoCard>
      </div>

      {result && (
        <CustomerInfoCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <CustomerStatusBadge status={result.verified ? 'Verified' : 'Pending'} />
                <p className={`text-sm font-semibold ${result.verified ? 'text-emerald-700' : 'text-amber-700'}`}>{result.message}</p>
              </div>
              {result.batchCode && (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Batch</p><p className="mt-2 text-sm font-semibold text-slate-900">{result.batchCode}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Farm</p><p className="mt-2 text-sm font-semibold text-slate-900">{result.farmName || 'N/A'}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Crop</p><p className="mt-2 text-sm font-semibold text-slate-900">{result.cropName || 'N/A'}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.18em] text-slate-400">Trace Hash</p><p className="mt-2 truncate text-sm font-semibold text-slate-900">{result.traceHash || 'N/A'}</p></div>
                </div>
              )}
            </div>
          </div>
        </CustomerInfoCard>
      )}
    </CustomerPageShell>
  );
}

export default CustomerScanQrPage;

