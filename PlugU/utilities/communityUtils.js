const VIDEO_EXTS = /\.(mp4|mov|m4v|webm|mkv|avi|m3u8)(\?|$)/i;

export function isVideo(url) {
  if (!url || typeof url !== 'string') return false;
  return VIDEO_EXTS.test(url);
}

export function isValidUrl(v) {
  if (!v || typeof v !== 'string') return false;
  const s = v.trim();
  return s.length > 0 && (s.startsWith('http') || s.startsWith('data:'));
}

export function resolveMediaUrls(raw) {
  if (!raw) return [];
  if (Array.isArray(raw))      return raw.filter(isValidUrl);
  if (typeof raw === 'object') return Object.values(raw).filter(isValidUrl);
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('[') || t.startsWith('{')) {
      try {
        const p = JSON.parse(t);
        if (Array.isArray(p))      return p.filter(isValidUrl);
        if (typeof p === 'object') return Object.values(p).filter(isValidUrl);
      } catch { /* fall through */ }
    }
    return isValidUrl(t) ? [t] : [];
  }
  return [];
}

export function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

export function formatCount(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'K';
  return String(n);
}