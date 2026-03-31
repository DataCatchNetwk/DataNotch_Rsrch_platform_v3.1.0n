import { getSupportTicket } from "@/lib/api/support"
import { SupportTicketDetail } from "@/components/support/support-ticket-detail"

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>
}) {
  const { ticketId } = await params
  const ticket = await getSupportTicket(ticketId)

  return (
    <div className="p-6">
      <SupportTicketDetail initialTicket={ticket} />
    </div>
  )
}
