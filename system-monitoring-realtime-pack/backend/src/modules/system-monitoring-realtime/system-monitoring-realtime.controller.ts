
import { Controller, MessageEvent, Sse } from "@nestjs/common";
import { interval, map } from "rxjs";
import { SystemMonitoringRealtimeService } from "./system-monitoring-realtime.service";

@Controller("system-monitoring")
export class SystemMonitoringRealtimeController {
  constructor(private readonly realtime: SystemMonitoringRealtimeService) {}

  @Sse("stream")
  stream() {
    return interval(3000).pipe(
      map((): MessageEvent => ({
        data: this.realtime.buildSnapshot(),
      })),
    );
  }
}
