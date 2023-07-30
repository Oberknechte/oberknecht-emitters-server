import { oberknechtEmitter } from "oberknecht-emitters";
import { oberknechtEmitterServerOptions } from "../types/oberknecht.emitter.server";
export declare class oberknechtEmitterServer {
    #private;
    get symbol(): string;
    _options: any;
    emitter: oberknechtEmitter;
    constructor(options: oberknechtEmitterServerOptions);
    connect(): Promise<void>;
}
