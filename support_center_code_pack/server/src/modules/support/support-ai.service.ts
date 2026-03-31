import { Injectable } from "@nestjs/common"
import { SupportTicket } from "@prisma/client"

@Injectable()
export class SupportAiService {
  analyze(ticket: Pick<SupportTicket, "subject" | "description" | "category">) {
    const text = `${ticket.subject} ${ticket.description}`.toLowerCase()

    const hasUrgent =
      /urgent|immediately|can't login|cannot login|locked out|breach|security|payment failed|blocked/.test(text)
    const hasAnger = /frustrated|terrible|angry|unacceptable|worst/.test(text)
    const hasSpam = /bitcoin|casino|loan|seo|marketing|click here/.test(text)

    const priority = hasUrgent ? "HIGH" : ticket.category === "SECURITY" ? "CRITICAL" : "MEDIUM"
    const status = hasSpam ? "SPAM" : "TRIAGED"

    const tags: string[] = []
    if (/login|password|signin|sign in|otp|2fa/.test(text)) tags.push("auth")
    if (/billing|card|payment|invoice|charge/.test(text)) tags.push("billing")
    if (/dataset|upload|file|csv|analysis/.test(text)) tags.push("data")
    if (/security|breach|phishing|suspicious/.test(text)) tags.push("security")

    const summary =
      `User reported a ${String(ticket.category).toLowerCase()} issue: ${ticket.subject}. ` +
      `Primary concern extracted from message body has been summarized for fast handling.`

    const triageReason = hasSpam
      ? "Pattern matched likely spam or irrelevant outreach."
      : hasUrgent
        ? "Contains urgency signals and access-blocking indicators."
        : "Standard support request triaged based on category and message content."

    return {
      priority,
      status,
      tags,
      spamScore: hasSpam ? 0.92 : 0.08,
      urgencyScore: hasUrgent ? 0.88 : 0.34,
      sentimentScore: hasAnger ? -0.72 : -0.14,
      summary,
      triageReason,
    }
  }

  suggestReply(ticket: {
    requesterName?: string | null
    category: string
    subject: string
    description: string
  }) {
    const name = ticket.requesterName || "there"

    if (ticket.category === "LOGIN") {
      return `Hi ${name},

Thank you for contacting support. We’re sorry you’re having trouble signing in.

We are reviewing your login issue now. Please reply with any error message you see on screen and confirm whether the issue happens after password entry, during MFA, or after redirect.

If this is urgent and you are locked out of active work, let us know and we will prioritize the request.

Best,
Support Team`
    }

    if (ticket.category === "BILLING") {
      return `Hi ${name},

Thanks for reaching out. We’ve received your billing request and are reviewing the charge details now.

Please reply with the invoice number, billing date, or the last 4 digits of the payment method if available so we can investigate faster.

Best,
Support Team`
    }

    return `Hi ${name},

Thank you for contacting support. We have received your request regarding "${ticket.subject}" and our team is reviewing it now.

We may follow up if additional details are needed. If you have screenshots, exact timestamps, or steps to reproduce the issue, please send them in your reply.

Best,
Support Team`
  }
}
