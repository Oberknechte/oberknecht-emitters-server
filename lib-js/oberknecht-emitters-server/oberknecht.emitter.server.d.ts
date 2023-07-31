import { oberknechtEmitter } from "oberknecht-emitters";
import { oberknechtEmitterServerOptions } from "../types/oberknecht.emitter.server";
export declare class oberknechtEmitterServer {
    #private;
    get symbol(): string;
    get _options(): any;
    set _options(options: any);
    oberknechtEmitter: oberknechtEmitter;
    constructor(options: oberknechtEmitterServerOptions);
    connect(): Promise<void>;
}
