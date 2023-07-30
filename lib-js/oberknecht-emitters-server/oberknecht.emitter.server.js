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
    _options = __1.i.oberknechtEmitterServerData[this.symbol]?._options ?? {};
    emitter = __1.i.oberknechtServerEmitters[this.symbol];
    constructor(options) {
        let _options = options ?? {};
        (0, oberknecht_utils_1.addKeysToObject)(__1.i.oberknechtEmitterServerData, [this.symbol, "_options"], _options);
        __1.i.oberknechtServerEmitters[this.symbol] = new oberknecht_emitters_1.oberknechtEmitter(_options.emitterOptions);
    }
    async connect() {
        return new Promise((resolve, reject) => {
            let server = (__1.i.oberknechtEmitterWebsocketServer[this.symbol] = new ws_1.WebSocketServer({
                //   ...(this._options.server ? {server: this._options.server} : {}),
                port: this._options.serverPort ?? defaults_1.defaultEmitterServerPort,
            }));
            server.on("listening", () => {
                resolve();
            });
            server.on("connection", async (ws) => {
                (0, handleConnection_1.handleConnection)(this.symbol, ws);
            });
        });
    }
}
exports.oberknechtEmitterServer = oberknechtEmitterServer;
