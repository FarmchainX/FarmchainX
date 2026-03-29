import { formatInr } from '../utils/currency';

export function formatMoney(value) {
  return formatInr(value);
}

export function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

