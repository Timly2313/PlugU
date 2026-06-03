export function formatCount(n) {
  if (!n && n !== 0) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export function resolveFirstImage(images) {
  if (!images) return null;
  if (Array.isArray(images))      return images[0] ?? null;
  if (typeof images === 'object') return Object.values(images)[0] ?? null;
  return null;
}

export const STATUS_CONFIG = {
  active:       { label: 'Active',       color: '#10B981', bg: '#ECFDF5' },
  sold:         { label: 'Sold',         color: '#6B7280', bg: '#F3F4F6' },
  reserved:     { label: 'Reserved',     color: '#F59E0B', bg: '#FFFBEB' },
  hidden:       { label: 'Hidden',       color: '#EF4444', bg: '#FEF2F2' },
  under_review: { label: 'Under Review', color: '#8B5CF6', bg: '#F5F3FF' },
};