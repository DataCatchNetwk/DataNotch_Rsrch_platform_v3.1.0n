export type SupportTicketCategory =
  | 'LOGIN'
  | 'BILLING'
  | 'TECHNICAL'
  | 'DATASET'
  | 'ACCESS'
  | 'ACCOUNT'
  | 'SECURITY'
  | 'OTHER';

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SupportMessageAuthorType = 'USER' | 'ADMIN' | 'AI' | 'SYSTEM';

export type SupportMessage = {
  id: string;
  body: string;
  isInternal: boolean;
  authorType: SupportMessageAuthorType;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: string;
  authorUser?: {
    id: string;
    firstname?: string | null;
    surname?: string | null;
    email?: string | null;
  } | null;
};

export type SupportActivity = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
};

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  requesterEmail: string;
  requesterName?: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  category: SupportTicketCategory;
  status: SupportTicketStatus | 'TRIAGED' | 'WAITING_FOR_USER' | 'SPAM';
  priority: SupportTicketPriority;
  assignedTo?: {
    id: string;
    firstname?: string | null;
    surname?: string | null;
    email?: string | null;
  } | null;
  createdByUser?: {
    id: string;
    firstname?: string | null;
    surname?: string | null;
    email?: string | null;
  } | null;
  firstResponseAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessage[];
  activities?: SupportActivity[];
};
