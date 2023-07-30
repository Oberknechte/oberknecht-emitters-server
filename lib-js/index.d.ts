import { oberknechtEmitter } from "oberknecht-emitters";
import { WebSocket, WebSocketServer } from "ws";
export declare class i {
    static oberknechtEmitterServerData: {};
    static oberknechtEmitterWebsocketServer: Record<string, WebSocketServer>;
    static oberknechtEmitterClientData: {};
    static oberknechtEmitterWebsocketClient: Record<string, WebSocket>;
    static oberknechtServerEmitters: Record<string, oberknechtEmitter>;
    static oberknechtClientEmitters: Record<string, oberknechtEmitter>;
}
