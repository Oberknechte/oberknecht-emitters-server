import { oberknechtEmitter } from "oberknecht-emitters";
import { i } from "..";
import { oberknechtEmitterServerOptions } from "../types/oberknecht.emitter.server";
import { WebSocketServer } from "ws";
import { defaultEmitterServerPort } from "../types/defaults";
import { addKeysToObject, getKeyFromObject, log } from "oberknecht-utils";
import { handleConnection } from "../functions/ws/handleConnection";
let symNum = 0;

export class oberknechtEmitterServer {
  readonly #symbol = `oberknechtEmitterServer-${symNum++}`;
  get symbol() {
    return this.#symbol;
  }

  get _options() {
    return getKeyFromObject(i.oberknechtEmitterServerData, [
      this.symbol,
      "_options",
    ]);
  }

  set _options(options) {
    addKeysToObject(
      i.oberknechtEmitterServerData,
      [this.symbol, "_options"],
      options
    );
  }

  oberknechtEmitter = new oberknechtEmitter();

  constructor(options: oberknechtEmitterServerOptions) {
    let _options = options ?? {};
    _options.debug = _options.debug ?? 2;
    addKeysToObject(
      i.oberknechtEmitterServerData,
      [this.symbol, "_options"],
      _options
    );

    i.oberknechtServerEmitters[this.symbol] = this.oberknechtEmitter;
    if (_options.emitterOptions)
      this.oberknechtEmitter._options = _options.emitterOptions;
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
        if (this._options.debug > 2)
          log(
            1,
            // @ts-ignore
            `WSServer Listening on ${server.address().address} (${
              // @ts-ignore
              server.address().family
              // @ts-ignore
            }) port ${server.address().port}`
          );

        this.oberknechtEmitter.emit(
          ["wsserver", "wsserver:listening"],
          "Listening"
        );

        resolve();
      });

      server.on("error", (e) => {
        process.emitWarning(e);
        this.oberknechtEmitter.emitError(["wsserver", "wsserver:error"], e);
      });

      server.on("connection", async (ws) => {
        handleConnection(this.symbol, ws);
      });
    });
  }
}
