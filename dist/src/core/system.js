"use strict";
/**
 * System Information Module
 * @module core/system
 * @description OS detection, package manager identification, and system information utilities.
 * @since 0.3.1
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageManager = exports.OS = void 0;
exports.detectOS = detectOS;
exports.commandExists = commandExists;
exports.detectPackageManager = detectPackageManager;
exports.getSystemInfo = getSystemInfo;
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const errors_js_1 = require("../utils/errors.js");
/** Operating system type constants. */
exports.OS = {
    LINUX: 'linux',
    MACOS: 'darwin',
    WINDOWS: 'win32',
    UNKNOWN: 'unknown',
};
/** Package manager type constants. */
exports.PackageManager = {
    APT: 'apt',
    PACMAN: 'pacman',
    DNF: 'dnf',
    ZYPPER: 'zypper',
    BREW: 'brew',
    CHOCOLATEY: 'choco',
    WINGET: 'winget',
    UNKNOWN: 'unknown',
};
/**
 * Detect the current operating system.
 * @returns OS constant.
 * @since 0.3.1
 * @example
 * const currentOs = detectOS();
 * if (currentOs === OS.LINUX) console.log('Running on Linux');
 */
function detectOS() {
    const platform = os_1.default.platform();
    if (platform === 'darwin')
        return exports.OS.MACOS;
    if (platform === 'win32')
        return exports.OS.WINDOWS;
    if (platform === 'linux')
        return exports.OS.LINUX;
    return exports.OS.UNKNOWN;
}
/**
 * Check if a command exists on PATH.
 * @param command - Command name to check.
 * @returns `true` if the command is found on PATH.
 * @since 0.3.1
 * @example
 * if (commandExists('git')) console.log('git is available');
 */
function commandExists(command) {
    try {
        const checkCmd = os_1.default.platform() === 'win32' ? `where ${command}` : `command -v ${command}`;
        (0, child_process_1.execSync)(checkCmd, { stdio: 'ignore' });
        return true;
    }
    catch {
        return false;
    }
}
function detectLinuxPackageManager() {
    if (commandExists('apt-get'))
        return exports.PackageManager.APT;
    if (commandExists('pacman'))
        return exports.PackageManager.PACMAN;
    if (commandExists('dnf'))
        return exports.PackageManager.DNF;
    if (commandExists('zypper'))
        return exports.PackageManager.ZYPPER;
    return exports.PackageManager.UNKNOWN;
}
function detectWindowsPackageManager() {
    if (commandExists('winget'))
        return exports.PackageManager.WINGET;
    if (commandExists('choco'))
        return exports.PackageManager.CHOCOLATEY;
    return exports.PackageManager.UNKNOWN;
}
/**
 * Detect the system package manager.
 * @returns PackageManager constant.
 * @throws {@link SystemError} if detection fails unexpectedly.
 * @since 0.3.1
 * @example
 * const pm = detectPackageManager();
 * console.log(`Package manager: ${pm}`);
 */
function detectPackageManager() {
    const osType = detectOS();
    try {
        switch (osType) {
            case exports.OS.LINUX: return detectLinuxPackageManager();
            case exports.OS.MACOS: return commandExists('brew') ? exports.PackageManager.BREW : exports.PackageManager.UNKNOWN;
            case exports.OS.WINDOWS: return detectWindowsPackageManager();
            default: return exports.PackageManager.UNKNOWN;
        }
    }
    catch (error) {
        throw new errors_js_1.SystemError(`SystemError: failed to detect package manager — ${error.message}`);
    }
}
/**
 * Get comprehensive system information.
 * @returns Object containing platform, os, arch, release, hostname, cpus, memory, packageManager.
 * @since 0.3.1
 * @example
 * const info = getSystemInfo();
 * console.log(`OS: ${info.os}, CPUs: ${info.cpus}`);
 */
function getSystemInfo() {
    return {
        platform: os_1.default.platform(),
        os: detectOS(),
        arch: os_1.default.arch(),
        release: os_1.default.release(),
        hostname: os_1.default.hostname(),
        cpus: os_1.default.cpus().length,
        memory: {
            total: os_1.default.totalmem(),
            free: os_1.default.freemem(),
        },
        packageManager: detectPackageManager(),
    };
}
