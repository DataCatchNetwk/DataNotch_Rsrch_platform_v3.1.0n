import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "@/common/prisma/prisma.service"
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto"
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto"
import { AddSupportReplyDto } from "./dto/add-support-reply.dto"
import { AssignSupportTicketDto } from "./dto/assign-support-ticket.dto"
import { SupportAiService } from "./support-ai.service"

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: SupportAiService,
  ) {}

  private async nextTicketNumber() {
    const count = await this.prisma.supportTicket.count()
    return `SUP-${String(count + 1).padStart(6, "0")}`
  }

  async create(dto: CreateSupportTicketDto, file?: Express.Multer.File) {
    const ticketNumber = await this.nextTicketNumber()
    const analysis = this.ai.analyze(dto as any)

    return this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject: dto.subject,
        description: dto.description,
        requesterEmail: dto.requesterEmail,
        requesterName: dto.requesterName,
        category: dto.category as any,
        source: "LOGIN_PAGE",
        priority: analysis.priority as any,
        status: analysis.status as any,
        tags: analysis.tags,
        spamScore: analysis.spamScore,
        urgencyScore: analysis.urgencyScore,
        sentimentScore: analysis.sentimentScore,
        aiSummary: analysis.summary,
        aiTriageReason: analysis.triageReason,
        aiLastAnalyzedAt: new Date(),
        attachmentName: file?.originalname,
        attachmentUrl: file ? `/uploads/support/${file.filename}` : null,
        activities: {
          create: [
            {
              type: "TICKET_CREATED",
              description: "Ticket created from public support form",
            },
          ],
        },
      },
      include: {
        assignedTo: true,
        messages: true,
      },
    })
  }

  async list(query: {
    status?: string
    priority?: string
    search?: string
  }) {
    return this.prisma.supportTicket.findMany({
      where: {
        ...(query.status ? { status: query.status as any } : {}),
        ...(query.priority ? { priority: query.priority as any } : {}),
        ...(query.search
          ? {
              OR: [
                { ticketNumber: { contains: query.search, mode: "insensitive" } },
                { subject: { contains: query.search, mode: "insensitive" } },
                { requesterEmail: { contains: query.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        assignedTo: true,
      },
      orderBy: { createdAt: "desc" },
    })
  }

  async getById(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        messages: {
          include: {
            authorUser: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!ticket) throw new NotFoundException("Support ticket not found")
    return ticket
  }

  async update(id: string, dto: UpdateSupportTicketDto, actorUserId?: string) {
    await this.getById(id)

    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
        activities: {
          create: {
            actorUserId,
            type: "TICKET_UPDATED",
            description: `Ticket updated: ${JSON.stringify(dto)}`,
          },
        },
      },
      include: {
        assignedTo: true,
        messages: { include: { authorUser: true }, orderBy: { createdAt: "asc" } },
      },
    })
  }

  async assign(id: string, dto: AssignSupportTicketDto, actorUserId?: string) {
    await this.getById(id)

    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        assignedToId: dto.assignedToId,
        status: "IN_PROGRESS",
        activities: {
          create: {
            actorUserId,
            type: "TICKET_ASSIGNED",
            description: `Assigned ticket to ${dto.assignedToId}`,
          },
        },
      },
      include: {
        assignedTo: true,
        messages: { include: { authorUser: true }, orderBy: { createdAt: "asc" } },
      },
    })
  }

  async addReply(id: string, dto: AddSupportReplyDto, actorUserId?: string) {
    await this.getById(id)

    const hasFirstResponse = await this.prisma.supportTicket.findUnique({
      where: { id },
      select: { firstResponseAt: true },
    })

    await this.prisma.supportMessage.create({
      data: {
        ticketId: id,
        body: dto.message,
        isInternal: !!dto.isInternal,
        authorType: dto.isInternal ? "ADMIN" : actorUserId ? "ADMIN" : "USER",
        authorUserId: actorUserId,
      },
    })

    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        ...(hasFirstResponse?.firstResponseAt ? {} : { firstResponseAt: new Date() }),
        ...(dto.isInternal ? {} : { status: "WAITING_FOR_USER" }),
        activities: {
          create: {
            actorUserId,
            type: dto.isInternal ? "INTERNAL_NOTE_ADDED" : "REPLY_SENT",
            description: dto.isInternal ? "Internal note added" : "Reply sent to requester",
          },
        },
      },
      include: {
        assignedTo: true,
        messages: { include: { authorUser: true }, orderBy: { createdAt: "asc" } },
      },
    })
  }

  async aiTriage(id: string) {
    const ticket = await this.getById(id)
    const analysis = this.ai.analyze(ticket)

    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        priority: analysis.priority as any,
        status: analysis.status as any,
        tags: analysis.tags,
        spamScore: analysis.spamScore,
        urgencyScore: analysis.urgencyScore,
        sentimentScore: analysis.sentimentScore,
        aiSummary: analysis.summary,
        aiTriageReason: analysis.triageReason,
        aiLastAnalyzedAt: new Date(),
      },
      include: {
        assignedTo: true,
        messages: { include: { authorUser: true }, orderBy: { createdAt: "asc" } },
      },
    })
  }

  async aiSuggestReply(id: string) {
    const ticket = await this.getById(id)
    const suggestion = this.ai.suggestReply(ticket)
    return { suggestion }
  }
}
