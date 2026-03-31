
import { Controller, Get, Post } from "@nestjs/common";
import { SystemMonitoringService } from "./system-monitoring.service";

@Controller("system-monitoring")
export class SystemMonitoringController {
  constructor(private readonly service: SystemMonitoringService) {}

  @Get("overview") overview() { return this.service.overview(); }
  @Get("alerts") alerts() { return this.service.alerts(); }
  @Get("metrics") metrics() { return this.service.metrics(); }
  @Get("services") services() { return this.service.services(); }
  @Get("queue") queue() { return this.service.queue(); }
  @Get("logs") logs() { return this.service.logs(); }
  @Post("actions/refresh") refresh() { return this.service.refresh(); }
  @Post("actions/retry-failed") retryFailed() { return this.service.retryFailed(); }
  @Post("actions/clear-queue") clearQueue() { return this.service.clearQueue(); }
}
