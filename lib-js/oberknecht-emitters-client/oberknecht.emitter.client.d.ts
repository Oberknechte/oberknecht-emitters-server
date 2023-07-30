import { callbackFunction, oberknechtEmitterClientOptions } from "../types/oberknecht.emitter.client";
import { WebSocket } from "ws";
import { oberknechtEmitter } from "oberknecht-emitters";
export declare class oberknechtEmitterClient {
    #private;
    get symbol(): string;
    _options: any;
    websocket: WebSocket;
    emitter: oberknechtEmitter;
    constructor(options: oberknechtEmitterClientOptions);
    connect(): Promise<void>;
    _sendWC(stuff: any, status?: number): Promise<void>;
    sendWC(stuff: any, status?: number): Promise<unknown>;
    on(eventName: string | string[], cb: typeof callbackFunction): Promise<unknown>;
    emit(eventName: string | string[], data: any): Promise<unknown>;
}
