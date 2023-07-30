import {
  addKeysToObject,
  deleteKeyFromObject,
  getKeyFromObject,
  regex,
  returnErr,
} from "oberknecht-utils";
import { i } from "../..";
import {
  defaultServerHeartbeatInterval,
  defaultServerMaxPingsPending,
} from "../../types/defaults";
import { WebSocket } from "ws";
import { createCallbackID } from "./createCallbackID";

export async function handleConnection(sym: string, ws: WebSocket) {
  let emitter = i.oberknechtServerEmitters[sym];

  let wsData: Record<string, any> = {
    heartbeat: {
      lastPing: -1,
      lastPong: -1,
      pingsPending: 0,
    },
    loggedIn: false,
    messageSymNum: 0,
  };

  function closeWS() {
    ws.close();
    if (wsData.heartbeat.heartbeatInterval)
      clearInterval(wsData.heartbeat.heartbeatInterval);
  }

  function heartbeatPing() {
    if (
      wsData.heartbeat.pingsPending >=
      (i.oberknechtEmitterServerData[sym]._options.maxPingsPending ??
        defaultServerMaxPingsPending)
    )
      return closeWS();

    ws.ping();
    wsData.heartbeat.lastPing = Date.now();
    wsData.heartbeat.pingsPending++;
  }

  function heartbeatPong() {
    wsData.heartbeat.lastPong = Date.now();
    wsData.heartbeat.pingsPending = 0;
  }

  function _sendWC(stuff, status?: number) {
    let stuff_: Record<string, any> = {};

    if (typeof stuff !== "object") stuff_.data = stuff;
    else stuff_ = { ...stuff };
    stuff_.status = status ?? 200;
    if (stuff instanceof Error || stuff.error)
      stuff_.error = returnErr(stuff?.error ?? stuff);

    ws.send(JSON.stringify(stuff_));
  }

  wsData.heartbeat.heartbeatInterval = setInterval(
    heartbeatPing,
    i.oberknechtEmitterServerData[sym]._options.heartbeatInterval ??
      defaultServerHeartbeatInterval
  );

  ws.on("pong", () => {
    heartbeatPong();
  });

  ws.onopen = (ev) => {};

  ws.onmessage = (rawMessage_) => {
    // @ts-ignore
    let rawMessage = Buffer.from(rawMessage_.data).toString("utf-8");
    const messageID = `ws-message:${wsData.messageSymNum++}`;

    let type;
    let pass;

    function sendWC(stuff, status?: number) {
      let stuff_ = {
        ...stuff,
        messageID: messageID,
        ...(type !== undefined ? { type: type } : {}),
        ...(pass !== undefined ? { pass: pass } : {}),
      };

      return _sendWC(stuff_, status);
    }

    let message: Record<string, any>;
    try {
      if (!regex.jsonreg().test(rawMessage))
        return sendWC({
          error: Error("message does not match json regex"),
        });

      message = JSON.parse(rawMessage);
    } catch (e) {
      return sendWC({
        error: Error("Could not parse Raw Message as JSON"),
      });
    }

    emitter.emit(`ws:message`, message);

    type = message.type;
    pass = message.pass;

    let params = message.params ?? {};

    if (!type)
      return sendWC({
        error: Error("message.type is undefined"),
      });

    if (
      !["login"].includes(type) &&
      i.oberknechtEmitterServerData[sym]._options.serverPassword &&
      !wsData.loggedIn
    )
      return sendWC({ error: Error("Login required") }, 401);

    switch (type) {
      case "login": {
        let password = params.password;

        if (
          this._options.serverPassword &&
          (!password ||
            password !==
              i.oberknechtEmitterServerData[sym]._options.serverPassword)
        )
          return sendWC(
            {
              error: Error(
                "password is not defined or does not match server password"
              ),
            },
            498
          );

        wsData.loggedIn = true;

        return sendWC({
          message: "Success",
        });
      }

      case "on":
      case "addListener":
      case "once": {
        let eventName = params.eventName;
        if (!eventName)
          return sendWC({ error: Error("params.eventName is undefined") });

        const callbackID = createCallbackID();

        function cb(...dat) {
          _sendWC({
            type: "callback",
            callbackID: callbackID,
            callbackData: dat,
          });

          deleteKeyFromObject(i.oberknechtEmitterServerData[sym], [
            "callbacks",
            callbackID,
          ]);
        }

        Object.defineProperty(cb, "callbackID", {
          get() {
            return callbackID;
          },
        });

        addKeysToObject(
          i.oberknechtEmitterServerData[sym],
          ["callback", callbackID],
          cb
        );

        emitter[type](eventName, cb);

        return sendWC({
          message: "Success",
          callbackID: callbackID,
        });
      }

      case "emit":
      case "emitError": {
        let eventName = params.eventName;
        let emitData = params.data;
        if (!eventName)
          return sendWC({ error: Error("params.eventName is undefined") });

        emitter[type](eventName, emitData);

        return sendWC({
          message: "Success",
        });
      }

      case "removeListener": {
        let eventName = params.eventName;
        let callbackID = params.callbackID;
        if (!eventName)
          return sendWC({ error: Error("params.eventName is undefined") });
        if (!callbackID)
          return sendWC({ error: Error("params.callbackID is undefined") });

        let cb = getKeyFromObject(i.oberknechtEmitterServerData[sym], [
          "callbacks",
          callbackID,
        ]);

        if (!cb)
          return sendWC({
            error: Error("callback of params.callbackID not found"),
          });

        emitter.removeListener(eventName, cb);

        return sendWC({ message: "Success" });
      }

      case "removeListeners": {
        let eventName = params.eventName;
        if (!eventName)
          return sendWC({ error: Error("params.eventName is undefined") });

        emitter.removeAllListeners(eventName);

        return sendWC({
          message: "Success",
        });
      }

      case "getListeners": {
        let eventName = params.eventName;
        if (!eventName)
          return sendWC({ error: Error("params.eventName is undefined") });

        const listeners = emitter.getListeners(eventName);
        const listenerCallbackIDs = listeners.map((cb) => cb.callbackID);

        return sendWC({
          message: "Success",
          callbackIDs: listenerCallbackIDs,
        });
      }

      default: {
        return sendWC({ error: Error("type not found") }, 404);
      }
    }
  };
}
