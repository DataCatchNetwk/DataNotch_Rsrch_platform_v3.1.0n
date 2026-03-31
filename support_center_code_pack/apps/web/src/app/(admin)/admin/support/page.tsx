"use client"

import { useEffect, useState } from "react"
import { listSupportTickets } from "@/lib/api/support"
import type { SupportTicket } from "@/lib/types/support"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SupportCenterHeader } from "@/components/support/support-center-header"
import { SupportTicketTable } from "@/components/support/support-ticket-table"
import { SupportTicketKanban } from "@/components/support/support-ticket-kanban"

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const data = await listSupportTickets({ search })
      setTickets(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <SupportCenterHeader search={search} setSearch={setSearch} onRefresh={load} />

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          {loading ? <div>Loading tickets...</div> : <SupportTicketTable tickets={tickets} />}
        </TabsContent>

        <TabsContent value="board">
          {loading ? <div>Loading board...</div> : <SupportTicketKanban tickets={tickets} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
