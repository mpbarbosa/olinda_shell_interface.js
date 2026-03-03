"use strict";
/**
 * olinda_shell_interface.js — public API
 * @module index
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestVersion = exports.isEqual = exports.isLessThan = exports.isGreaterThan = exports.compareVersions = exports.parseVersion = exports.colorize = exports.supportsColor = exports.colors = exports.SystemError = exports.ExecutionError = exports.ShellError = exports.getSystemInfo = exports.commandExists = exports.detectPackageManager = exports.detectOS = exports.PackageManager = exports.OS = exports.executeSudo = exports.executeStream = exports.execute = void 0;
var executor_js_1 = require("./core/executor.js");
Object.defineProperty(exports, "execute", { enumerable: true, get: function () { return executor_js_1.execute; } });
Object.defineProperty(exports, "executeStream", { enumerable: true, get: function () { return executor_js_1.executeStream; } });
Object.defineProperty(exports, "executeSudo", { enumerable: true, get: function () { return executor_js_1.executeSudo; } });
var system_js_1 = require("./core/system.js");
Object.defineProperty(exports, "OS", { enumerable: true, get: function () { return system_js_1.OS; } });
Object.defineProperty(exports, "PackageManager", { enumerable: true, get: function () { return system_js_1.PackageManager; } });
Object.defineProperty(exports, "detectOS", { enumerable: true, get: function () { return system_js_1.detectOS; } });
Object.defineProperty(exports, "detectPackageManager", { enumerable: true, get: function () { return system_js_1.detectPackageManager; } });
Object.defineProperty(exports, "commandExists", { enumerable: true, get: function () { return system_js_1.commandExists; } });
Object.defineProperty(exports, "getSystemInfo", { enumerable: true, get: function () { return system_js_1.getSystemInfo; } });
var errors_js_1 = require("./utils/errors.js");
Object.defineProperty(exports, "ShellError", { enumerable: true, get: function () { return errors_js_1.ShellError; } });
Object.defineProperty(exports, "ExecutionError", { enumerable: true, get: function () { return errors_js_1.ExecutionError; } });
Object.defineProperty(exports, "SystemError", { enumerable: true, get: function () { return errors_js_1.SystemError; } });
var olinda_utils_js_1 = require("olinda_utils.js");
Object.defineProperty(exports, "colors", { enumerable: true, get: function () { return olinda_utils_js_1.colors; } });
Object.defineProperty(exports, "supportsColor", { enumerable: true, get: function () { return olinda_utils_js_1.supportsColor; } });
Object.defineProperty(exports, "colorize", { enumerable: true, get: function () { return olinda_utils_js_1.colorize; } });
var version_js_1 = require("./core/version.js");
Object.defineProperty(exports, "parseVersion", { enumerable: true, get: function () { return version_js_1.parseVersion; } });
Object.defineProperty(exports, "compareVersions", { enumerable: true, get: function () { return version_js_1.compareVersions; } });
Object.defineProperty(exports, "isGreaterThan", { enumerable: true, get: function () { return version_js_1.isGreaterThan; } });
Object.defineProperty(exports, "isLessThan", { enumerable: true, get: function () { return version_js_1.isLessThan; } });
Object.defineProperty(exports, "isEqual", { enumerable: true, get: function () { return version_js_1.isEqual; } });
Object.defineProperty(exports, "getLatestVersion", { enumerable: true, get: function () { return version_js_1.getLatestVersion; } });
