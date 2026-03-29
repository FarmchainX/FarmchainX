
export function AdminBadge({ children, tone = 'neutral' }) {
  const toneClass = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
    purple: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
    neutral: 'border-slate-200 bg-slate-50 text-slate-600',
  }[tone] || 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}

export function AdminPanel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_60px_-42px_rgba(15,23,42,0.45)] ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            {title && <h2 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export function AdminStatCard({ label, value, hint, tone = 'indigo' }) {
  const accent = {
    indigo: 'from-indigo-600/12 to-violet-600/8 text-indigo-700',
    cyan: 'from-cyan-600/12 to-sky-600/8 text-cyan-700',
    emerald: 'from-emerald-600/12 to-teal-600/8 text-emerald-700',
    rose: 'from-rose-600/12 to-pink-600/8 text-rose-700',
    amber: 'from-amber-500/14 to-orange-500/10 text-amber-700',
  }[tone] || 'from-indigo-600/12 to-violet-600/8 text-indigo-700';

  return (
    <div className={`rounded-[24px] border border-slate-200 bg-gradient-to-br ${accent} p-5`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export function AdminEmptyState({ title, message }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
    </div>
  );
}

export function AdminBarChart({ items, valueKey = 'value', labelKey = 'label', colorClass = 'bg-indigo-500' }) {
  const values = items.map((item) => Number(item?.[valueKey] || 0));
  const max = Math.max(...values, 1);

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const value = Number(item?.[valueKey] || 0);
        const width = Math.max((value / max) * 100, value > 0 ? 8 : 0);
        return (
          <div key={`${item?.[labelKey] || 'bar'}-${index}`}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">{item?.[labelKey] || '—'}</span>
              <span className="text-slate-500">{value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

