import { oberknechtEmitterOptions } from "oberknecht-emitters/lib-ts/types/oberknecht.emitter.options";
export type oberknechtEmitterClientOptions = {
    debug?: number;
    serverAddress?: string;
    serverPort?: number;
    serverPassword?: string;
    clientEmitterOptions?: oberknechtEmitterOptions;
};
export declare function callbackFunction(...data: any): void;
