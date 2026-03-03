"use strict";
/**
 * olinda_shell_interface.js — public API
 * @module index
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionError = exports.ShellError = exports.executeSudo = exports.executeStream = exports.execute = void 0;
var executor_js_1 = require("./core/executor.js");
Object.defineProperty(exports, "execute", { enumerable: true, get: function () { return executor_js_1.execute; } });
Object.defineProperty(exports, "executeStream", { enumerable: true, get: function () { return executor_js_1.executeStream; } });
Object.defineProperty(exports, "executeSudo", { enumerable: true, get: function () { return executor_js_1.executeSudo; } });
var errors_js_1 = require("./utils/errors.js");
Object.defineProperty(exports, "ShellError", { enumerable: true, get: function () { return errors_js_1.ShellError; } });
Object.defineProperty(exports, "ExecutionError", { enumerable: true, get: function () { return errors_js_1.ExecutionError; } });
