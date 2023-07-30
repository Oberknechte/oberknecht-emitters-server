import { oberknechtEmitter } from "oberknecht-emitters";
import { i } from "..";
import { oberknechtEmitterServerOptions } from "../types/oberknecht.emitter.server";
import { WebSocketServer } from "ws";
import { defaultEmitterServerPort } from "../types/defaults";
import { addKeysToObject } from "oberknecht-utils";
import { handleConnection } from "../functions/ws/handleConnection";
let symNum = 0;

export class oberknechtEmitterServer {
  readonly #symbol = `oberknechtEmitterServer-${symNum++}`;
  get symbol() {
    return this.#symbol;
  }

  _options = i.oberknechtEmitterServerData[this.symbol]?._options ?? {};

  emitter = i.oberknechtServerEmitters[this.symbol];

  constructor(options: oberknechtEmitterServerOptions) {
    let _options = options ?? {};
    addKeysToObject(
      i.oberknechtEmitterServerData,
      [this.symbol, "_options"],
      _options
    );

    i.oberknechtServerEmitters[this.symbol] = new oberknechtEmitter(
      _options.emitterOptions
    );
  }

  async connect() {
    return new Promise<void>((resolve, reject) => {
      let server = (i.oberknechtEmitterWebsocketServer[
        this.symbol
      ] = new WebSocketServer({
        //   ...(this._options.server ? {server: this._options.server} : {}),
        port: this._options.serverPort ?? defaultEmitterServerPort,
      }));

      server.on("listening", () => {
        resolve();
      });

      server.on("connection", async (ws) => {
        handleConnection(this.symbol, ws);
      });
    });
  }
}
