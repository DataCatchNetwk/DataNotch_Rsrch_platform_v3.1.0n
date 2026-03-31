import type { SupportTicket } from "@/lib/types/support"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Request failed")
  }
  return res.json()
}

export async function createSupportTicket(formData: FormData) {
  const res = await fetch(`${API_BASE}/api/v1/support`, {
    method: "POST",
    body: formData,
  })
  return jsonOrThrow<SupportTicket>(res)
}

export async function listSupportTickets(params?: {
  status?: string
  priority?: string
  assignedToMe?: boolean
  search?: string
}) {
  const qs = new URLSearchParams()
  if (params?.status) qs.set("status", params.status)
  if (params?.priority) qs.set("priority", params.priority)
  if (params?.assignedToMe) qs.set("assignedToMe", "true")
  if (params?.search) qs.set("search", params.search)

  const res = await fetch(`${API_BASE}/api/v1/support?${qs.toString()}`, {
    credentials: "include",
    cache: "no-store",
  })
  return jsonOrThrow<SupportTicket[]>(res)
}

export async function getSupportTicket(ticketId: string) {
  const res = await fetch(`${API_BASE}/api/v1/support/${ticketId}`, {
    credentials: "include",
    cache: "no-store",
  })
  return jsonOrThrow<SupportTicket>(res)
}

export async function updateSupportTicket(
  ticketId: string,
  body: Record<string, unknown>,
) {
  const res = await fetch(`${API_BASE}/api/v1/support/${ticketId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return jsonOrThrow<SupportTicket>(res)
}

export async function addSupportReply(
  ticketId: string,
  body: { message: string; isInternal?: boolean },
) {
  const res = await fetch(`${API_BASE}/api/v1/support/${ticketId}/reply`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return jsonOrThrow<SupportTicket>(res)
}

export async function assignSupportTicket(ticketId: string, assignedToId: string) {
  const res = await fetch(`${API_BASE}/api/v1/support/${ticketId}/assign`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignedToId }),
  })
  return jsonOrThrow<SupportTicket>(res)
}

export async function runAiTriage(ticketId: string) {
  const res = await fetch(`${API_BASE}/api/v1/support/${ticketId}/ai/triage`, {
    method: "POST",
    credentials: "include",
  })
  return jsonOrThrow<SupportTicket>(res)
}

export async function suggestAiReply(ticketId: string) {
  const res = await fetch(`${API_BASE}/api/v1/support/${ticketId}/ai/suggest-reply`, {
    method: "POST",
    credentials: "include",
  })
  return jsonOrThrow<{ suggestion: string }>(res)
}
