export type SupportTicketStatus =
  | "OPEN"
  | "TRIAGED"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "RESOLVED"
  | "CLOSED"
  | "SPAM"

export type SupportTicketPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"

export type SupportTicketCategory =
  | "LOGIN"
  | "BILLING"
  | "TECHNICAL"
  | "DATASET"
  | "ACCESS"
  | "ACCOUNT"
  | "SECURITY"
  | "OTHER"

export type SupportMessageAuthorType = "USER" | "ADMIN" | "AI" | "SYSTEM"

export interface SupportMessage {
  id: string
  authorType: SupportMessageAuthorType
  body: string
  isInternal: boolean
  createdAt: string
  authorUser?: {
    id: string
    name?: string | null
    email?: string | null
  } | null
}

export interface SupportTicket {
  id: string
  ticketNumber: string
  subject: string
  description: string
  requesterEmail: string
  requesterName?: string | null
  category: SupportTicketCategory
  status: SupportTicketStatus
  priority: SupportTicketPriority
  tags: string[]
  aiSummary?: string | null
  aiSuggestedReply?: string | null
  aiTriageReason?: string | null
  sentimentScore?: number | null
  spamScore?: number | null
  urgencyScore?: number | null
  assignedTo?: {
    id: string
    name?: string | null
    email?: string | null
  } | null
  firstResponseAt?: string | null
  resolvedAt?: string | null
  createdAt: string
  updatedAt: string
  messages?: SupportMessage[]
}
