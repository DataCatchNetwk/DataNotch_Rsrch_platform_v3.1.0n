export function formatRelativeDate(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

export function categoryTone(category: string) {
  switch (category) {
    case "ANALYSIS":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300"
    case "REPORT":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "WORKSPACE":
    case "COLLABORATION":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-300"
    case "SECURITY":
      return "bg-red-500/10 text-red-700 dark:text-red-300"
    default:
      return "bg-muted text-foreground"
  }
}
