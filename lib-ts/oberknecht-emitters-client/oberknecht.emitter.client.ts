import {
  addAppendKeysToObject,
  addKeysToObject,
  getKeyFromObject,
  log,
  returnErr,
} from "oberknecht-utils";
import {
  callbackFunction,
  oberknechtEmitterClientOptions,
} from "../types/oberknecht.emitter.client";
import { i } from "..";
import { WebSocket } from "ws";
import { defaultEmitterServerPort } from "../types/defaults";
import { oberknechtEmitter } from "oberknecht-emitters";
let symNum = 0;

export class oberknechtEmitterClient {
  readonly #symbol = `oberknechtEmitterClient-${symNum++}`;
  get symbol() {
    return this.#symbol;
  }

  get _options(): oberknechtEmitterClientOptions {
    return (
      getKeyFromObject(i.oberknechtEmitterClientData, [
        this.symbol,
        "_options",
      ]) ?? {}
    );
  }

  set _options(options) {
    addKeysToObject(
      i.oberknechtEmitterClientData,
      [this.symbol, "_options"],
      options
    );
  }

  websocket = i.oberknechtEmitterWebsocketClient[this.symbol];

  emitter = new oberknechtEmitter();

  constructor(options: oberknechtEmitterClientOptions) {
    let _options = options ?? {};

    addKeysToObject(
      i.oberknechtEmitterClientData,
      [this.symbol, "_options"],
      _options
    );

    i.oberknechtClientEmitters[this.symbol] = this.emitter;
    if (_options.clientEmitterOptions)
      this.emitter._options = _options.clientEmitterOptions;
  }

  async connect() {
    return new Promise<void>((resolve, reject) => {
      let ws = (i.oberknechtEmitterWebsocketClient[this.symbol] = new WebSocket(
        this._options.serverAddress ??
          `ws://127.0.0.1:${
            this._options.serverPort ?? defaultEmitterServerPort
          }`
      ));

      addKeysToObject(
        i.oberknechtEmitterClientData,
        [this.symbol, "messageSymNum"],
        0
      );

      ws.on("open", () => {
        if (this._options.debug >= 2) log(1, `WS Connection Opened`);

        if (this._options.serverPassword)
          return this.sendWC({
            type: "login",
            params: {
              password: this._options.serverPassword,
            },
          }).then(() => {
            resolve();
          });
        else resolve();
      });

      ws.on("message", (messageRaw_) => {
        // @ts-ignore
        let messageRaw = Buffer.from(messageRaw_).toString("utf-8");

        let message;
        try {
          message = JSON.parse(messageRaw);
        } catch (e) {
          console.error(e);
        }

        this.emitter.emit("ws:message", message);

        if (message.pass)
          this.emitter.emit(`ws:message:${message.pass}`, message);

        if (message.type === "callback")
          this.emitter.emit(
            `ws:message:callback:${message.callbackID}`,
            message
          );
      });

      ws.on("close", (code, reason) => {
        if (this._options.debug > 2)
          log(2, `WS Connection Closed`, code, reason);
      });
    });
  }

  async _sendWC(stuff, status?: number) {
    let stuff_: Record<string, any> = {};

    if (typeof stuff !== "object") stuff_.data = stuff;
    else stuff_ = { ...stuff };
    stuff_.status = status ?? 200;
    if (stuff instanceof Error || stuff.error)
      stuff_.error = returnErr(stuff?.error ?? stuff);

    i.oberknechtEmitterWebsocketClient[this.symbol].send(
      JSON.stringify(stuff_)
    );
  }

  async sendWC(stuff, status?: number) {
    let messageSymNum = getKeyFromObject(i.oberknechtEmitterClientData, [
      this.symbol,
      "messageSymNum",
    ]);

    addAppendKeysToObject(
      i.oberknechtEmitterClientData,
      [this.symbol, "messageSymNum"],
      1
    );

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

  async on(eventName: string | string[], cb: typeof callbackFunction) {
    return new Promise((resolve, reject) => {
      this.sendWC({
        type: "on",
        params: {
          eventName: eventName,
        },
      })
        .then((r: Record<string, any>) => {
          resolve(r);
          const callbackID = r.callbackID;
          this.emitter.on(`ws:message:callback:${callbackID}`, (message) => {
            cb(message.callbackData);
          });
        })
        .catch(reject);
    });
  }

  async emit(eventName: string | string[], data: any) {
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
