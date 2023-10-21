"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConnection = void 0;
const oberknecht_utils_1 = require("oberknecht-utils");
const __1 = require("../..");
const defaults_1 = require("../../types/defaults");
const createCallbackID_1 = require("./createCallbackID");
async function handleConnection(sym, ws) {
    let emitter = __1.i.oberknechtServerEmitters[sym];
    let wsData = {
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
        if (wsData.heartbeat.pingsPending >=
            (__1.i.oberknechtEmitterServerData[sym]._options.maxPingsPending ??
                defaults_1.defaultServerMaxPingsPending))
            return closeWS();
        ws.ping();
        wsData.heartbeat.lastPing = Date.now();
        wsData.heartbeat.pingsPending++;
    }
    function heartbeatPong() {
        wsData.heartbeat.lastPong = Date.now();
        wsData.heartbeat.pingsPending = 0;
    }
    function _sendWC(stuff, status) {
        let stuff_ = {};
        if (typeof stuff !== "object")
            stuff_.data = stuff;
        else
            stuff_ = { ...stuff };
        stuff_.status = status ?? 200;
        if (stuff instanceof Error || stuff.error)
            stuff_.error = (0, oberknecht_utils_1.returnErr)(stuff?.error ?? stuff);
        ws.send(JSON.stringify(stuff_));
    }
    wsData.heartbeat.heartbeatInterval = setInterval(heartbeatPing, __1.i.oberknechtEmitterServerData[sym]._options.heartbeatInterval ??
        defaults_1.defaultServerHeartbeatInterval);
    ws.on("pong", () => {
        heartbeatPong();
    });
    ws.on("message", (rawMessage_) => {
        // @ts-ignore
        let rawMessage = Buffer.from(rawMessage_).toString("utf-8");
        const messageID = `ws-message:${wsData.messageSymNum++}`;
        let type;
        let pass;
        function sendWC(stuff, status) {
            let stuff_ = {
                ...stuff,
                messageID: messageID,
                ...(type !== undefined ? { type: type } : {}),
                ...(pass !== undefined ? { pass: pass } : {}),
            };
            return _sendWC(stuff_, status);
        }
        let message;
        try {
            if (!oberknecht_utils_1.regex.jsonreg().test(rawMessage))
                return sendWC({
                    error: Error("message does not match json regex"),
                });
            message = JSON.parse(rawMessage);
        }
        catch (e) {
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
        if (!["login"].includes(type) &&
            __1.i.oberknechtEmitterServerData[sym]._options.serverPassword &&
            !wsData.loggedIn)
            return sendWC({ error: Error("Login required") }, 401);
        switch (type) {
            case "login": {
                let password = params.password;
                if (__1.i.oberknechtEmitterServerData[sym]._options.serverPassword &&
                    (!password ||
                        password !==
                            __1.i.oberknechtEmitterServerData[sym]._options.serverPassword))
                    return sendWC({
                        error: Error("password is not defined or does not match server password"),
                    }, 498);
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
                const callbackID = (0, createCallbackID_1.createCallbackID)();
                function cb(...dat) {
                    _sendWC({
                        type: "callback",
                        callbackID: callbackID,
                        callbackData: dat,
                    });
                    (0, oberknecht_utils_1.deleteKeyFromObject)(__1.i.oberknechtEmitterServerData[sym], [
                        "callbacks",
                        callbackID,
                    ]);
                }
                Object.defineProperty(cb, "callbackID", {
                    get() {
                        return callbackID;
                    },
                });
                (0, oberknecht_utils_1.addKeysToObject)(__1.i.oberknechtEmitterServerData[sym], ["callback", callbackID], cb);
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
            case "emitCB": {
                let eventName = params.eventName;
                let emitData = params.data;
                if (!eventName)
                    return sendWC({ error: Error("params.eventName is undefined") });
                function cb(...dat) {
                    return sendWC({
                        type: "callback",
                        callbackData: dat,
                    });
                }
                emitter["emit"](eventName, emitData, cb);
                break;
            }
            case "removeListener": {
                let eventName = params.eventName;
                let callbackID = params.callbackID;
                if (!eventName)
                    return sendWC({ error: Error("params.eventName is undefined") });
                if (!callbackID)
                    return sendWC({ error: Error("params.callbackID is undefined") });
                let cb = (0, oberknecht_utils_1.getKeyFromObject)(__1.i.oberknechtEmitterServerData[sym], [
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
    });
    ws.on("close", () => {
        closeWS();
    });
}
exports.handleConnection = handleConnection;
