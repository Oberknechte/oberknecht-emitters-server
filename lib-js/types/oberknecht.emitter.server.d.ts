import { oberknechtEmitterOptions } from "oberknecht-emitters/lib-ts/types/oberknecht.emitter.options";
export type oberknechtEmitterServerOptions = {
    serverPort?: number;
    serverPassword?: string;
    maxPingsPending?: number;
    heartbeatInterval?: number;
    emitterOptions?: oberknechtEmitterOptions;
};
