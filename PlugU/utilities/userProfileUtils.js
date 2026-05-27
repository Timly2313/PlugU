export function formatCount(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export function memberSince(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    month: 'long', year: 'numeric',
  });
}

export function resolveFirstImage(images) {
  if (!images) return null;
  if (Array.isArray(images))             return images[0] ?? null;
  if (typeof images === 'object')        return Object.values(images)[0] ?? null;
  return null;
}

export function getStatusDotColor(status) {
  switch (status) {
    case 'active':   return '#10B981';
    case 'sold':     return '#6B7280';
    case 'reserved': return '#F59E0B';
    default:         return '#D1D5DB';
  }
}