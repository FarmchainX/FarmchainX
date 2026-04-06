import { Link } from 'react-router-dom';
import { formatInr } from '../utils/currency';

export function CustomerPageShell({ eyebrow, title, description, action, children }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow && (
              <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">
                {eyebrow}
              </div>
            )}
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-[15px]">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

export function CustomerHeroPanel({ title, description, actions, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-violet-50/40 to-white p-6 shadow-sm lg:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center">
        <div>
          <div className="inline-flex rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-700 backdrop-blur">
            FarmchainX Customer Experience
          </div>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
            {description}
          </p>
          {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function CustomerSectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CustomerMetricCard({ label, value, accent = 'rose' }) {
  const accents = {
    rose: 'bg-violet-50 border-violet-200 text-violet-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    emerald: 'bg-sky-50 border-sky-200 text-sky-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  return (
    <div className={`rounded-xl border p-4 ${accents[accent] || accents.rose}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export function CustomerInfoCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h4 className="text-base font-semibold text-slate-950">{title}</h4>}
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function CustomerStatusBadge({ status }) {
  const normalized = String(status || 'Pending').toUpperCase();
  const tone = normalized.includes('DELIVERED') || normalized.includes('COMPLETED')
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : normalized.includes('TRANSIT') || normalized.includes('ASSIGNED')
      ? 'bg-sky-100 text-sky-700 border-sky-200'
      : normalized.includes('PAID')
        ? 'bg-violet-100 text-violet-700 border-violet-200'
        : 'bg-amber-100 text-amber-700 border-amber-200';

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tone}`}>
      {normalized.replaceAll('_', ' ')}
    </span>
  );
}

export function CustomerEmptyState({ title, description, action }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">✨</div>
      <h4 className="mt-4 text-lg font-semibold text-slate-900">{title}</h4>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function CustomerPrimaryButton({ children, className = '', to, ...props }) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      {...props}
      className={classes}
    >
      {children}
    </button>
  );
}

export function CustomerSecondaryButton({ children, className = '', to, ...props }) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50/70 hover:text-violet-700 ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button {...props} className={classes}>
      {children}
    </button>
  );
}

export function CustomerProductCard({
  product,
  to,
  compact = false,
  showFavorite = false,
  isFavorite = false,
  onToggleFavorite,
}) {
  const aiScore = Math.max(82, Math.min(99, Math.round(Number(product?.avgRating || 4) * 20 + 10)));

  const handleFavoriteClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleFavorite?.(product);
  };

  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {showFavorite && (
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition ${
            isFavorite
              ? 'border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <span className="text-base">{isFavorite ? '❤️' : '🤍'}</span>
        </button>
      )}
      <div className={`${compact ? 'h-44' : 'h-56'} overflow-hidden bg-slate-100`}>
        {product?.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">🥬</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-950">{product?.name}</p>
            <p className="mt-1 truncate text-sm text-slate-500">{product?.farmName || 'Trusted Farm'} • {product?.location || product?.farmLocation || 'Local harvest'}</p>
          </div>
          <span className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
            AI {aiScore}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-violet-700">{formatInr(product?.pricePerUnit)}</p>
            <p className="text-xs text-slate-500">per {product?.unit || 'unit'}</p>
          </div>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
            Verified
          </span>
        </div>
      </div>
    </Link>
  );
}

export function CustomerTimelineStep({ title, caption, active }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={`mt-0.5 h-3.5 w-3.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        <span className={`mt-1 h-full w-px ${active ? 'bg-emerald-200' : 'bg-slate-200'}`} />
      </div>
      <div className="pb-5">
        <p className={`text-sm font-semibold ${active ? 'text-slate-950' : 'text-slate-500'}`}>{title}</p>
        {caption && <p className="mt-1 text-xs leading-5 text-slate-500">{caption}</p>}
      </div>
    </div>
  );
}

export function CustomerQuickLink({ to, title, subtitle }) {
  return (
    <Link to={to} className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:bg-white">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
    </Link>
  );
}

