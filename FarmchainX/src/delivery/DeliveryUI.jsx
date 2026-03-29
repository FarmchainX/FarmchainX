import { Link } from 'react-router-dom';

export function DeliveryPageIntro({ eyebrow = 'Delivery Portal', icon = '🚚', title, description, action }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px]">{icon}</span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-600/90">{eyebrow}</p>
        </div>
        <h2 className="mt-2.5 text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function DeliveryPanel({ className = '', children }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500" />
      {children}
    </div>
  );
}

export function DeliveryPanelBody({ className = '', children }) {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function DeliveryStatCard({ label, value, chip, tone = 'emerald', helper }) {
  const toneMap = {
    emerald: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    amber: 'bg-orange-50 text-orange-700 border-orange-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
  };

  return (
    <DeliveryPanel>
      <DeliveryPanelBody>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          {chip ? <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneMap[tone] || toneMap.emerald}`}>{chip}</span> : null}
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        {helper ? <p className="mt-2 text-xs text-slate-400">{helper}</p> : null}
      </DeliveryPanelBody>
    </DeliveryPanel>
  );
}

export function DeliveryStatusPill({ status }) {
  const value = String(status || 'Unknown');
  let style = 'border-slate-200 bg-slate-50 text-slate-600';
  if (value === 'ASSIGNED') style = 'border-orange-100 bg-orange-50 text-orange-700';
  else if (value === 'PICKED_UP') style = 'border-sky-100 bg-sky-50 text-sky-700';
  else if (value === 'IN_TRANSIT') style = 'border-violet-100 bg-violet-50 text-violet-700';
  else if (value === 'DELIVERED') style = 'border-indigo-100 bg-indigo-50 text-indigo-700';
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${style}`}>{value.replaceAll('_', ' ')}</span>;
}

export function DeliverySectionHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 tracking-wide">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function DeliveryEmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M1 3h15v13H1z" />
          <path d="M16 8h4l3 3v5h-7" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function DeliveryPrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_35px_-20px_rgba(37,99,235,0.75)] transition hover:from-indigo-700 hover:to-sky-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function DeliverySecondaryLink({ to, children, className = '' }) {
  return (
    <Link to={to} className={`inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 ${className}`}>
      {children}
    </Link>
  );
}


