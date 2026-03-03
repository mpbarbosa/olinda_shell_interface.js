/**
 * Shell Command Executor
 * @module core/executor
 * @description Execute Linux shell commands with output capture and streaming support.
 */
/** Options shared by all executor functions. */
export interface ExecuteOptions {
    /** Working directory for the command. Defaults to `process.cwd()`. */
    cwd?: string;
    /** Environment variables. Defaults to `process.env`. */
    env?: NodeJS.ProcessEnv;
    /** Timeout in milliseconds. Defaults to 300 000 (5 min). */
    timeout?: number;
    /** Run the command through the shell (pass a shell path e.g. `'/bin/sh'`). Defaults to `'/bin/sh'`. */
    shell?: string;
}
/** Options for {@link executeStream}. */
export interface StreamOptions extends Omit<ExecuteOptions, 'timeout' | 'shell'> {
    /** Called with each chunk of stdout. If omitted, pipes to `process.stdout`. */
    onStdout?: (chunk: string) => void;
    /** Called with each chunk of stderr. If omitted, pipes to `process.stderr`. */
    onStderr?: (chunk: string) => void;
}
/** Result returned by {@link execute} and {@link executeSudo}. */
export interface ExecuteResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}
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
export declare function execute(command: string, options?: ExecuteOptions): Promise<ExecuteResult>;
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
export declare function executeStream(command: string, options?: StreamOptions): Promise<number>;
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
export declare function executeSudo(command: string, options?: ExecuteOptions): Promise<ExecuteResult>;
