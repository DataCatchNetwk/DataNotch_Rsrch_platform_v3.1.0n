
import { Module } from "@nestjs/common";
import { SystemMonitoringRealtimeController } from "./system-monitoring-realtime.controller";
import { SystemMonitoringRealtimeGateway } from "./system-monitoring-realtime.gateway";
import { SystemMonitoringRealtimeService } from "./system-monitoring-realtime.service";

@Module({
  controllers: [SystemMonitoringRealtimeController],
  providers: [
    SystemMonitoringRealtimeService,
    SystemMonitoringRealtimeGateway,
  ],
  exports: [SystemMonitoringRealtimeService],
})
export class SystemMonitoringRealtimeModule {}
