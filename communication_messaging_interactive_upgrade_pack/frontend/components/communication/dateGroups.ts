export function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export function formatMessageStamp(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDateGroup(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

export function groupByDate<T extends { updatedAt?: string; sentAt?: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const raw = item.updatedAt || item.sentAt || new Date().toISOString();
    const key = formatDateGroup(raw);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});
}
