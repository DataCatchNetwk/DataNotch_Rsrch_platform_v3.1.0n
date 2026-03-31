import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { SupportService } from "./support.service"
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto"
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto"
import { AddSupportReplyDto } from "./dto/add-support-reply.dto"
import { AssignSupportTicketDto } from "./dto/assign-support-ticket.dto"

@Controller("api/v1/support")
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @UseInterceptors(FileInterceptor("attachment"))
  create(
    @Body() dto: CreateSupportTicketDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.supportService.create(dto, file)
  }

  @Get()
  list(
    @Query("status") status?: string,
    @Query("priority") priority?: string,
    @Query("search") search?: string,
  ) {
    return this.supportService.list({ status, priority, search })
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.supportService.getById(id)
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateSupportTicketDto) {
    return this.supportService.update(id, dto)
  }

  @Post(":id/assign")
  assign(@Param("id") id: string, @Body() dto: AssignSupportTicketDto) {
    return this.supportService.assign(id, dto)
  }

  @Post(":id/reply")
  addReply(@Param("id") id: string, @Body() dto: AddSupportReplyDto) {
    return this.supportService.addReply(id, dto)
  }

  @Post(":id/ai/triage")
  aiTriage(@Param("id") id: string) {
    return this.supportService.aiTriage(id)
  }

  @Post(":id/ai/suggest-reply")
  aiSuggestReply(@Param("id") id: string) {
    return this.supportService.aiSuggestReply(id)
  }
}
