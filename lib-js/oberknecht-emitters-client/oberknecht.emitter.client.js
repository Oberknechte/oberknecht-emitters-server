"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oberknechtEmitterClient = void 0;
const oberknecht_utils_1 = require("oberknecht-utils");
const __1 = require("..");
const ws_1 = require("ws");
const defaults_1 = require("../types/defaults");
const oberknecht_emitters_1 = require("oberknecht-emitters");
let symNum = 0;
class oberknechtEmitterClient {
    #symbol = `oberknechtEmitterClient-${symNum++}`;
    get symbol() {
        return this.#symbol;
    }
    _options = __1.i.oberknechtEmitterClientData[this.symbol]?._options ?? {};
    websocket = __1.i.oberknechtEmitterWebsocketClient[this.symbol];
    emitter = new oberknecht_emitters_1.oberknechtEmitter();
    constructor(options) {
        let _options = options ?? {};
        (0, oberknecht_utils_1.addKeysToObject)(__1.i.oberknechtEmitterClientData, [this.symbol, "_options"], _options);
        __1.i.oberknechtClientEmitters[this.symbol] = new oberknecht_emitters_1.oberknechtEmitter();
    }
    async connect() {
        return new Promise((resolve, reject) => {
            let ws = (__1.i.oberknechtEmitterWebsocketClient[this.symbol] = new ws_1.WebSocket(this._options.serverAddress ??
                `ws://127.0.0.1:${this._options.serverPort ?? defaults_1.defaultEmitterServerPort}`));
            (0, oberknecht_utils_1.addKeysToObject)(__1.i.oberknechtEmitterClientData, [this.symbol, "messageSymNum"], 0);
            ws.on("open", () => {
                console.log("ws opened");
                if (this._options.serverPassword)
                    return this.sendWC({
                        type: "login",
                        params: {
                            password: this._options.serverPassword,
                        },
                    }).then(() => {
                        resolve();
                    });
                else
                    resolve();
            });
            ws.on("message", (messageRaw_) => {
                // @ts-ignore
                let messageRaw = Buffer.from(messageRaw_).toString("utf-8");
                let message;
                try {
                    message = JSON.parse(messageRaw);
                }
                catch (e) {
                    console.error(e);
                }
                this.emitter.emit("ws:message", message);
                if (message.pass)
                    this.emitter.emit(`ws:message:${message.pass}`, message);
                if (message.type === "callback")
                    this.emitter.emit(`ws:message:callback:${message.callbackID}`, message);
            });
        });
    }
    async _sendWC(stuff, status) {
        let stuff_ = {};
        if (typeof stuff !== "object")
            stuff_.data = stuff;
        else
            stuff_ = { ...stuff };
        stuff_.status = status ?? 200;
        if (stuff instanceof Error || stuff.error)
            stuff_.error = (0, oberknecht_utils_1.returnErr)(stuff?.error ?? stuff);
        __1.i.oberknechtEmitterWebsocketClient[this.symbol].send(JSON.stringify(stuff_));
    }
    async sendWC(stuff, status) {
        let messageSymNum = (0, oberknecht_utils_1.getKeyFromObject)(__1.i.oberknechtEmitterClientData, [
            this.symbol,
            "messageSymNum",
        ]);
        (0, oberknecht_utils_1.addAppendKeysToObject)(__1.i.oberknechtEmitterClientData, [this.symbol, "messageSymNum"], 1);
        const messageID = `${this.symbol}-${messageSymNum}`;
        return new Promise((resolve, reject) => {
            let _stuff = {
                ...stuff,
                pass: messageID,
            };
            this._sendWC(_stuff, status);
            this.emitter.once(`ws:message:${messageID}`, (message) => {
                resolve(message);
            });
        });
    }
    async on(eventName, cb) {
        return new Promise((resolve, reject) => {
            this.sendWC({
                type: "on",
                params: {
                    eventName: eventName,
                },
            })
                .then((r) => {
                resolve(r);
                const callbackID = r.callbackID;
                this.emitter.on(`ws:message:callback:${callbackID}`, (message) => {
                    cb(message.callbackData);
                });
            })
                .catch(reject);
        });
    }
    async emit(eventName, data) {
        return new Promise((resolve, reject) => {
            this.sendWC({
                type: "emit",
                params: {
                    eventName: eventName,
                    data: data,
                },
            })
                .then(resolve)
                .catch(reject);
        });
    }
}
exports.oberknechtEmitterClient = oberknechtEmitterClient;
