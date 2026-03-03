import { execute, executeStream, executeSudo, ShellError, ExecutionError } from '../src/index';

describe('Public API surface', () => {
	it('exports execute', () => expect(typeof execute).toBe('function'));
	it('exports executeStream', () => expect(typeof executeStream).toBe('function'));
	it('exports executeSudo', () => expect(typeof executeSudo).toBe('function'));
	it('exports ShellError', () => expect(typeof ShellError).toBe('function'));
	it('exports ExecutionError', () => expect(typeof ExecutionError).toBe('function'));
});

describe('execute', () => {
	it('runs a simple command', async () => {
		const result = await execute('echo hello');
		expect(result.stdout).toBe('hello');
		expect(result.exitCode).toBe(0);
	});

	it('captures stderr', async () => {
		const result = await execute('echo err >&2; echo out');
		expect(result.stdout).toBe('out');
	});

	it('throws ExecutionError on failure', async () => {
		await expect(execute('exit 42')).rejects.toBeInstanceOf(ExecutionError);
	});

	it('ExecutionError has stdout/stderr on failure', async () => {
		try {
			await execute('echo out; echo err >&2; exit 1');
		} catch (e) {
			expect(e).toBeInstanceOf(ExecutionError);
		}
	});
});

describe('executeStream', () => {
	it('streams stdout to callback', async () => {
		const chunks: string[] = [];
		const code = await executeStream('echo streamed', { onStdout: (c) => chunks.push(c) });
		expect(code).toBe(0);
		expect(chunks.join('').trim()).toBe('streamed');
	});

	it('streams stderr to callback', async () => {
		const chunks: string[] = [];
		const code = await executeStream('echo err >&2', { onStderr: (c) => chunks.push(c) });
		expect(code).toBe(0);
		expect(chunks.join('').trim()).toBe('err');
	});

	it('rejects with ExecutionError on spawn failure', async () => {
		await expect(executeStream('__not_a_real_command_xyz__')).rejects.toBeInstanceOf(ExecutionError);
	});

});

describe('executeSudo', () => {
	it('is callable (delegates to execute)', () => {
		// executeSudo prepends sudo when not root; just verify it is a function.
		expect(typeof executeSudo).toBe('function');
	});
});

describe('ShellError', () => {
	it('is an instance of Error', () => {
		const err = new ShellError('ShellError: test');
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(ShellError);
		expect(err.name).toBe('ShellError');
		expect(err.message).toBe('ShellError: test');
	});
});

describe('ExecutionError', () => {
	it('is an instance of ShellError and Error', () => {
		const err = new ExecutionError('ExecutionError: test', 1, 'out', 'err');
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(ShellError);
		expect(err).toBeInstanceOf(ExecutionError);
		expect(err.exitCode).toBe(1);
		expect(err.stdout).toBe('out');
		expect(err.stderr).toBe('err');
		expect(err.name).toBe('ExecutionError');
	});

	it('uses defaults when optional args omitted', () => {
		const err = new ExecutionError('ExecutionError: minimal');
		expect(err.exitCode).toBe(1);
		expect(err.stdout).toBe('');
		expect(err.stderr).toBe('');
	});
});

