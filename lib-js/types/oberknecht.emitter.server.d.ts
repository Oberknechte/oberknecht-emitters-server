import { oberknechtEmitterOptions } from "oberknecht-emitters/lib-ts/types/oberknecht.emitter.options";
export type oberknechtEmitterServerOptions = {
    debug?: number;
    serverPort?: number;
    serverPassword?: string;
    maxPingsPending?: number;
    heartbeatInterval?: number;
    emitterOptions?: oberknechtEmitterOptions;
};
