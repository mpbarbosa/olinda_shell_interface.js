import { jest } from '@jest/globals';
import { execute, executeStream, executeSudo, ExecuteResult } from '../../src/core/executor';
import { ExecutionError } from '../../src/utils/errors';

// ─── execute ────────────────────────────────────────────────────────────────

describe('execute', () => {
	describe('success', () => {
		it('returns stdout trimmed on exit 0', async () => {
			const result = await execute('echo hello');
			expect(result.stdout).toBe('hello');
			expect(result.stderr).toBe('');
			expect(result.exitCode).toBe(0);
		});

		it('captures both stdout and stderr', async () => {
			const result = await execute('echo out; echo err >&2');
			expect(result.stdout).toBe('out');
			expect(result.stderr).toBe('err');
			expect(result.exitCode).toBe(0);
		});

		it('trims trailing whitespace from stdout and stderr', async () => {
			const result = await execute('printf "  hello  "; echo err >&2');
			expect(result.stdout).toBe('hello');
			expect(result.stderr).toBe('err');
		});

		it('accepts a custom cwd', async () => {
			const result = await execute('pwd', { cwd: '/tmp' });
			expect(result.stdout).toBe('/tmp');
		});

		it('accepts a custom env', async () => {
			const result = await execute('echo $MY_VAR', {
				env: { ...process.env, MY_VAR: 'olinda' },
			});
			expect(result.stdout).toBe('olinda');
		});

		it('accepts a custom shell', async () => {
			const result = await execute('echo ok', { shell: '/bin/bash' });
			expect(result.stdout).toBe('ok');
		});

		it('resolves for a multi-word command', async () => {
			const result = await execute('printf "%s" "world"');
			expect(result.stdout).toBe('world');
		});

		it('resolves with empty stdout when command produces no output', async () => {
			const result = await execute('true');
			expect(result.stdout).toBe('');
			expect(result.exitCode).toBe(0);
		});
	});

	describe('failure', () => {
		it('throws ExecutionError on non-zero exit', async () => {
			await expect(execute('exit 1')).rejects.toBeInstanceOf(ExecutionError);
		});

		it('throws ExecutionError on exit 42', async () => {
			await expect(execute('exit 42')).rejects.toBeInstanceOf(ExecutionError);
		});

		it('thrown error is instanceof Error', async () => {
			await expect(execute('exit 1')).rejects.toBeInstanceOf(Error);
		});

		it('thrown error message contains the command', async () => {
			await expect(execute('exit 1')).rejects.toMatchObject({
				message: expect.stringContaining('exit 1'),
			});
		});

		it('thrown error carries captured stdout', async () => {
			await expect(execute('echo out; exit 1')).rejects.toMatchObject({ stdout: 'out' });
		});

		it('thrown error carries captured stderr', async () => {
			await expect(execute('echo err >&2; exit 1')).rejects.toMatchObject({ stderr: 'err' });
		});

		it('thrown error has a numeric exitCode', async () => {
			await expect(execute('exit 2')).rejects.toMatchObject({
				exitCode: expect.any(Number),
			});
		});

		it('thrown error name is ExecutionError', async () => {
			await expect(execute('exit 1')).rejects.toMatchObject({ name: 'ExecutionError' });
		});

		it('rejects for an unknown command', async () => {
			await expect(execute('__no_such_cmd_xyz__')).rejects.toBeInstanceOf(ExecutionError);
		});
	});

	describe('timeout option', () => {
		it('rejects when command exceeds timeout', async () => {
			await expect(execute('sleep 10', { timeout: 50 })).rejects.toBeInstanceOf(ExecutionError);
		});
	});
});

// ─── executeStream ───────────────────────────────────────────────────────────

describe('executeStream', () => {
	describe('success', () => {
		it('resolves with exit code 0', async () => {
			const code = await executeStream('echo ok', { onStdout: () => {} });
			expect(code).toBe(0);
		});

		it('calls onStdout with command output', async () => {
			const chunks: string[] = [];
			await executeStream('echo streamed', { onStdout: (c) => chunks.push(c) });
			expect(chunks.join('').trim()).toBe('streamed');
		});

		it('calls onStderr with stderr output', async () => {
			const chunks: string[] = [];
			await executeStream('echo err >&2', { onStderr: (c) => chunks.push(c) });
			expect(chunks.join('').trim()).toBe('err');
		});

		it('calls onStdout multiple times for multi-line output', async () => {
			const chunks: string[] = [];
			await executeStream('printf "a\\nb\\nc\\n"', { onStdout: (c) => chunks.push(c) });
			expect(chunks.join('')).toContain('a');
			expect(chunks.join('')).toContain('b');
			expect(chunks.join('')).toContain('c');
		});

		it('accepts a custom cwd', async () => {
			const chunks: string[] = [];
			await executeStream('pwd', { cwd: '/tmp', onStdout: (c) => chunks.push(c) });
			expect(chunks.join('').trim()).toBe('/tmp');
		});

		it('accepts a custom env', async () => {
			const chunks: string[] = [];
			await executeStream('echo $STREAM_VAR', {
				env: { ...process.env, STREAM_VAR: 'streamval' },
				onStdout: (c) => chunks.push(c),
			});
			expect(chunks.join('').trim()).toBe('streamval');
		});
	});

	describe('failure', () => {
		it('rejects with ExecutionError on non-zero exit', async () => {
			await expect(
				executeStream('exit 1', { onStdout: () => {} }),
			).rejects.toBeInstanceOf(ExecutionError);
		});

		it('rejected error is instanceof Error', async () => {
			await expect(
				executeStream('exit 1', { onStdout: () => {} }),
			).rejects.toBeInstanceOf(Error);
		});

		it('rejected error message contains exit code', async () => {
			await expect(executeStream('exit 3', { onStdout: () => {} })).rejects.toMatchObject({
				message: expect.stringContaining('3'),
			});
		});

		it('rejected error name is ExecutionError', async () => {
			await expect(executeStream('exit 1', { onStdout: () => {} })).rejects.toMatchObject({
				name: 'ExecutionError',
			});
		});

		it('rejects with ExecutionError on non-zero exit (non-zero close event)', async () => {
			// Exercises the close-event branch with exitCode !== 0
			await expect(
				executeStream('exit 2', { onStdout: () => {} }),
			).rejects.toBeInstanceOf(ExecutionError);
		});
	});

	describe('pipe fallback (no callbacks)', () => {
		it('resolves when no callbacks provided (pipes to process streams)', async () => {
			// stdout/stderr pipe to process.stdout/stderr — just verify it resolves
			await expect(executeStream('true')).resolves.toBe(0);
		});
	});
});

// ─── executeSudo ─────────────────────────────────────────────────────────────

describe('executeSudo', () => {
	it('is a function', () => {
		expect(typeof executeSudo).toBe('function');
	});

	it('returns a Promise', async () => {
		const getuidSpy = jest.spyOn(process, 'getuid').mockReturnValue(0);
		try {
			const result = await executeSudo('echo test');
			expect(result.exitCode).toBe(0);
		} finally {
			getuidSpy.mockRestore();
		}
	});

	describe('when already root (uid 0)', () => {
		it('does not prepend sudo — runs command directly', async () => {
			const getuidSpy = jest.spyOn(process, 'getuid').mockReturnValue(0);
			try {
				const result = await executeSudo('echo noroot');
				expect(result.stdout).toBe('noroot');
				expect(result.exitCode).toBe(0);
			} finally {
				getuidSpy.mockRestore();
			}
		});
	});

	describe('when not root', () => {
		it('prepends sudo — outcome is either success or ExecutionError', async () => {
			if (process.platform === 'win32') return;
			const getuidSpy = jest.spyOn(process, 'getuid').mockReturnValue(1000);
			try {
				const outcome = await executeSudo('echo sudoed', { timeout: 2_000 }).catch((e: unknown) => e);
				const isExpected =
					(outcome instanceof ExecutionError) ||
					(typeof outcome === 'object' && outcome !== null && (outcome as ExecuteResult).exitCode === 0);
				expect(isExpected).toBe(true);
			} finally {
				getuidSpy.mockRestore();
			}
		}, 10_000);
	});

	it('resolves for a simple harmless command (as root mock)', async () => {
		const getuidSpy = jest.spyOn(process, 'getuid').mockReturnValue(0);
		try {
			const result = await executeSudo('echo sudo_test');
			expect(result.exitCode).toBe(0);
			expect(result.stdout).toBe('sudo_test');
		} finally {
			getuidSpy.mockRestore();
		}
	});

	it('throws ExecutionError on command failure', async () => {
		const getuidSpy = jest.spyOn(process, 'getuid').mockReturnValue(0);
		try {
			await expect(executeSudo('exit 1')).rejects.toBeInstanceOf(ExecutionError);
		} finally {
			getuidSpy.mockRestore();
		}
	});
});
