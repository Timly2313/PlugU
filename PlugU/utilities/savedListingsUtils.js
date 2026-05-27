export function getStatusColor(status) {
  switch (status) {
    case 'active':    return '#10B981'; // green
    case 'sold':      return '#EF4444'; // red
    case 'pending':   return '#F59E0B'; // amber
    case 'inactive':  return '#6B7280'; // gray
    default:          return '#6B7280';
  }
}

export function getStatusLabel(status) {
  switch (status) {
    case 'active':   return 'Available';
    case 'sold':     return 'Sold';
    case 'pending':  return 'Pending';
    case 'inactive': return 'Inactive';
    default:         return 'Unknown';
  }
}

export function resolveFirstImage(images) {
  if (!images) return null;
  if (Array.isArray(images) && images.length > 0) return images[0];
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch { /* fall through */ }
    return images.startsWith('http') ? images : null;
  }
  return null;
}

export function timeAgoSaved(iso) {
  if (!iso) return '';
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return `${weeks}w ago`;
}