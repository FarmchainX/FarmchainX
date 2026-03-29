const defaultInrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatInr(value) {
  const amount = Number(value || 0);
  return defaultInrFormatter.format(Number.isFinite(amount) ? amount : 0);
}

