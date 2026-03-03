/**
 * Shell Command Executor
 * @module core/executor
 * @description Execute Linux shell commands with output capture and streaming support.
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { ExecutionError } from '../utils/errors.js';

const execAsync = promisify(exec);

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
 * @since 0.2.0
 * @example
 * const { stdout } = await execute('ls -la');
 */
export async function execute(command: string, options: ExecuteOptions = {}): Promise<ExecuteResult> {
	const {
		cwd = process.cwd(),
		env = process.env,
		timeout = 300_000,
		shell = '/bin/sh',
	} = options;

	try {
		const { stdout, stderr } = await execAsync(command, {
			cwd,
			env,
			timeout,
			shell,
			maxBuffer: 10 * 1024 * 1024,
		});

		return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
	} catch (err: unknown) {
		const error = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
		const exitCode = (error.code && typeof error.code === 'number') ? error.code : 1;
		const stdout = error.stdout ? error.stdout.toString().trim() : '';
		const stderr = error.stderr ? error.stderr.toString().trim() : '';
		throw new ExecutionError(`ExecutionError: ${command}`, exitCode, stdout, stderr);
	}
}

/**
 * Execute a command and stream its output line by line.
 * @param command - The shell command to run.
 * @param options - Stream options including optional stdout/stderr callbacks.
 * @returns Resolves with the exit code when the process ends.
 * @throws {@link ExecutionError} when the process exits with a non-zero code or fails to spawn.
 * @since 0.2.0
 * @example
 * await executeStream('ping -c 3 localhost', { onStdout: console.log });
 */
export function executeStream(command: string, options: StreamOptions = {}): Promise<number> {
	return new Promise((resolve, reject) => {
		const { cwd = process.cwd(), env = process.env, onStdout, onStderr } = options;

		const [cmd, ...args] = command.split(' ');
		const child = spawn(cmd, args, { cwd, env, stdio: ['inherit', 'pipe', 'pipe'], shell: true });

		if (onStdout) {
			child.stdout.on('data', (data: Buffer) => onStdout(data.toString()));
		} else {
			child.stdout.pipe(process.stdout);
		}

		if (onStderr) {
			child.stderr.on('data', (data: Buffer) => onStderr(data.toString()));
		} else {
			child.stderr.pipe(process.stderr);
		}

		child.on('close', (code: number | null) => {
			const exitCode = code ?? 1;
			if (exitCode === 0) {
				resolve(exitCode);
			} else {
				reject(new ExecutionError(`ExecutionError: command exited with code ${exitCode}`, exitCode));
			}
		});

		child.on('error', (error: Error) => {
			reject(new ExecutionError(`ExecutionError: failed to spawn — ${error.message}`));
		});
	});
}

/**
 * Execute a command, prepending `sudo` when not already running as root.
 * @param command - The shell command to run.
 * @param options - Execution options.
 * @returns Resolved with stdout, stderr and exitCode on success.
 * @throws {@link ExecutionError} when the command exits with a non-zero code.
 * @since 0.2.0
 * @example
 * const result = await executeSudo('systemctl restart nginx');
 */
export async function executeSudo(command: string, options: ExecuteOptions = {}): Promise<ExecuteResult> {
	const needsSudo =
		process.platform !== 'win32' &&
		typeof process.getuid === 'function' &&
		process.getuid() !== 0;
	return execute(needsSudo ? `sudo ${command}` : command, options);
}
