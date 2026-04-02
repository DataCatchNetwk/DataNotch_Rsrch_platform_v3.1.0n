export function formatBytes(bytes?: number | null) {
  if (!bytes) return "—"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let value = bytes
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`
}

export function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat().format(value)
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}
