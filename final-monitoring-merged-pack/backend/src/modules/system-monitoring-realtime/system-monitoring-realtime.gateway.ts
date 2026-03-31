
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "ws";
import { SystemMonitoringRealtimeService } from "./system-monitoring-realtime.service";

@WebSocketGateway({
  path: "/system-monitoring",
  cors: {
    origin: true,
    credentials: true,
  },
})
export class SystemMonitoringRealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private timer?: NodeJS.Timeout;

  constructor(private readonly realtime: SystemMonitoringRealtimeService) {}

  handleConnection() {
    if (!this.timer) {
      this.timer = setInterval(() => {
        const payload = JSON.stringify(this.realtime.buildSnapshot());
        this.server.clients.forEach((client: any) => {
          if (client.readyState === 1) {
            client.send(payload);
          }
        });
      }, 3000);
    }
  }

  handleDisconnect() {
    if (this.server.clients.size === 0 && this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
