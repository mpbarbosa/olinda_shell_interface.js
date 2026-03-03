"use strict";
/**
 * Shell Command Executor
 * @module core/executor
 * @description Execute Linux shell commands with output capture and streaming support.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = execute;
exports.executeStream = executeStream;
exports.executeSudo = executeSudo;
const child_process_1 = require("child_process");
const util_1 = require("util");
const errors_js_1 = require("../utils/errors.js");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Execute a shell command and return captured output.
 * @param command - The shell command to run.
 * @param options - Execution options.
 * @returns Resolved with stdout, stderr and exitCode on success.
 * @throws {@link ExecutionError} when the command exits with a non-zero code.
 * @since 0.1.0
 * @example
 * const { stdout } = await execute('ls -la');
 */
async function execute(command, options = {}) {
    const { cwd = process.cwd(), env = process.env, timeout = 300000, shell = '/bin/sh', } = options;
    try {
        const { stdout, stderr } = await execAsync(command, {
            cwd,
            env,
            timeout,
            shell,
            maxBuffer: 10 * 1024 * 1024,
        });
        return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
    }
    catch (err) {
        const error = err;
        const exitCode = (error.code && typeof error.code === 'number') ? error.code : 1;
        const stdout = error.stdout ? error.stdout.toString().trim() : '';
        const stderr = error.stderr ? error.stderr.toString().trim() : '';
        throw new errors_js_1.ExecutionError(`ExecutionError: ${command}`, exitCode, stdout, stderr);
    }
}
/**
 * Execute a command and stream its output line by line.
 * @param command - The shell command to run.
 * @param options - Stream options including optional stdout/stderr callbacks.
 * @returns Resolves with the exit code when the process ends.
 * @throws {@link ExecutionError} when the process exits with a non-zero code or fails to spawn.
 * @since 0.1.0
 * @example
 * await executeStream('ping -c 3 localhost', { onStdout: console.log });
 */
function executeStream(command, options = {}) {
    return new Promise((resolve, reject) => {
        const { cwd = process.cwd(), env = process.env, onStdout, onStderr } = options;
        const [cmd, ...args] = command.split(' ');
        const child = (0, child_process_1.spawn)(cmd, args, { cwd, env, stdio: ['inherit', 'pipe', 'pipe'], shell: true });
        if (onStdout) {
            child.stdout.on('data', (data) => onStdout(data.toString()));
        }
        else {
            child.stdout.pipe(process.stdout);
        }
        if (onStderr) {
            child.stderr.on('data', (data) => onStderr(data.toString()));
        }
        else {
            child.stderr.pipe(process.stderr);
        }
        child.on('close', (code) => {
            const exitCode = code ?? 1;
            if (exitCode === 0) {
                resolve(exitCode);
            }
            else {
                reject(new errors_js_1.ExecutionError(`ExecutionError: command exited with code ${exitCode}`, exitCode));
            }
        });
        child.on('error', (error) => {
            reject(new errors_js_1.ExecutionError(`ExecutionError: failed to spawn — ${error.message}`));
        });
    });
}
/**
 * Execute a command, prepending `sudo` when not already running as root.
 * @param command - The shell command to run.
 * @param options - Execution options.
 * @returns Resolved with stdout, stderr and exitCode on success.
 * @throws {@link ExecutionError} when the command exits with a non-zero code.
 * @since 0.1.0
 * @example
 * const result = await executeSudo('systemctl restart nginx');
 */
async function executeSudo(command, options = {}) {
    const needsSudo = process.platform !== 'win32' &&
        typeof process.getuid === 'function' &&
        process.getuid() !== 0;
    return execute(needsSudo ? `sudo ${command}` : command, options);
}
