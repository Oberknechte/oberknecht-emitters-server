import { oberknechtEmitterOptions } from "oberknecht-emitters/lib-ts/types/oberknecht.emitter.options";
import { WebSocketServer } from "ws";

export type oberknechtEmitterServerOptions = {
  serverPort?: number;
  serverPassword?: string;
  maxPingsPending?: number;
  heartbeatInterval?: number;
  emitterOptions?: oberknechtEmitterOptions;
  //   server?: WebSocketServer;
};
