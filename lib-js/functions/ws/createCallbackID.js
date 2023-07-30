"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCallbackID = void 0;
const oberknecht_utils_1 = require("oberknecht-utils");
function createCallbackID() {
    return (0, oberknecht_utils_1.createID)(10, true);
}
exports.createCallbackID = createCallbackID;
