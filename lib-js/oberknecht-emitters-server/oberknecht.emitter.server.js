"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oberknechtEmitterServer = void 0;
const oberknecht_emitters_1 = require("oberknecht-emitters");
const __1 = require("..");
const ws_1 = require("ws");
const defaults_1 = require("../types/defaults");
const oberknecht_utils_1 = require("oberknecht-utils");
const handleConnection_1 = require("../functions/ws/handleConnection");
let symNum = 0;
class oberknechtEmitterServer {
    #symbol = `oberknechtEmitterServer-${symNum++}`;
    get symbol() {
        return this.#symbol;
    }
    get _options() {
        return (0, oberknecht_utils_1.getKeyFromObject)(__1.i.oberknechtEmitterServerData, [
            this.symbol,
            "_options",
        ]);
    }
    set _options(options) {
        (0, oberknecht_utils_1.addKeysToObject)(__1.i.oberknechtEmitterServerData, [this.symbol, "_options"], options);
    }
    oberknechtEmitter = new oberknecht_emitters_1.oberknechtEmitter();
    constructor(options) {
        let _options = options ?? {};
        _options.debug = _options.debug ?? 2;
        (0, oberknecht_utils_1.addKeysToObject)(__1.i.oberknechtEmitterServerData, [this.symbol, "_options"], _options);
        __1.i.oberknechtServerEmitters[this.symbol] = this.oberknechtEmitter;
        if (_options.emitterOptions)
            this.oberknechtEmitter._options = _options.emitterOptions;
    }
    async connect() {
        return new Promise((resolve, reject) => {
            let server = (__1.i.oberknechtEmitterWebsocketServer[this.symbol] = new ws_1.WebSocketServer({
                //   ...(this._options.server ? {server: this._options.server} : {}),
                port: this._options.serverPort ?? defaults_1.defaultEmitterServerPort,
            }));
            server.on("listening", () => {
                if (this._options.debug > 2)
                    (0, oberknecht_utils_1.log)(1, 
                    // @ts-ignore
                    `WSServer Listening on ${server.address().address} (${
                    // @ts-ignore
                    server.address().family
                    // @ts-ignore
                    }) port ${server.address().port}`);
                this.oberknechtEmitter.emit(["wsserver", "wsserver:listening"], "Listening");
                resolve();
            });
            server.on("error", (e) => {
                process.emitWarning(e);
                this.oberknechtEmitter.emitError(["wsserver", "wsserver:error"], e);
            });
            server.on("connection", async (ws) => {
                (0, handleConnection_1.handleConnection)(this.symbol, ws);
            });
        });
    }
}
exports.oberknechtEmitterServer = oberknechtEmitterServer;
