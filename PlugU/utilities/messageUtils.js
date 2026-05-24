export function resolveDisplayName(conv) {
  const names = conv.participant_usernames ?? [];
  if (names.length === 0) return 'Unknown';
  if (names.length === 1) return names[0];
  if (names.length === 2) return names.join(', ');
  return `${names[0]}, ${names[1]} +${names.length - 2}`;
}