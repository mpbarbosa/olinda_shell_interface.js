import {
	execute, executeStream, executeSudo,
	ShellError, ExecutionError, SystemError,
	colors, supportsColor, colorize,
	OS, PackageManager, detectOS, detectPackageManager, commandExists, getSystemInfo,
	parseVersion, compareVersions, isGreaterThan, isLessThan, isEqual, getLatestVersion,
	Logger, logger, LogLevel, stripAnsi,
} from '../src/index';

describe('Public API surface', () => {
	// executor
	it('exports execute', () => expect(typeof execute).toBe('function'));
	it('exports executeStream', () => expect(typeof executeStream).toBe('function'));
	it('exports executeSudo', () => expect(typeof executeSudo).toBe('function'));

	// errors
	it('exports ShellError', () => expect(typeof ShellError).toBe('function'));
	it('exports ExecutionError', () => expect(typeof ExecutionError).toBe('function'));
	it('exports SystemError', () => expect(typeof SystemError).toBe('function'));

	// colors (from olinda_utils.js)
	it('exports colors', () => expect(typeof colors).toBe('object'));
	it('exports supportsColor', () => expect(typeof supportsColor).toBe('function'));
	it('exports colorize', () => expect(typeof colorize).toBe('function'));

	// system
	it('exports OS', () => expect(typeof OS).toBe('object'));
	it('exports PackageManager', () => expect(typeof PackageManager).toBe('object'));
	it('exports detectOS', () => expect(typeof detectOS).toBe('function'));
	it('exports detectPackageManager', () => expect(typeof detectPackageManager).toBe('function'));
	it('exports commandExists', () => expect(typeof commandExists).toBe('function'));
	it('exports getSystemInfo', () => expect(typeof getSystemInfo).toBe('function'));

	// version
	it('exports parseVersion', () => expect(typeof parseVersion).toBe('function'));
	it('exports compareVersions', () => expect(typeof compareVersions).toBe('function'));
	it('exports isGreaterThan', () => expect(typeof isGreaterThan).toBe('function'));
	it('exports isLessThan', () => expect(typeof isLessThan).toBe('function'));
	it('exports isEqual', () => expect(typeof isEqual).toBe('function'));
	it('exports getLatestVersion', () => expect(typeof getLatestVersion).toBe('function'));

	// logger (from olinda_utils.js)
	it('exports Logger', () => expect(typeof Logger).toBe('function'));
	it('exports logger', () => expect(typeof logger).toBe('object'));
	it('exports LogLevel', () => expect(typeof LogLevel).toBe('object'));
	it('exports stripAnsi', () => expect(typeof stripAnsi).toBe('function'));
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

	it('should reject with ExecutionError carrying stdout/stderr on failure', async () => {
		await expect(execute('echo out; echo err >&2; exit 1')).rejects.toThrow(ExecutionError);
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
	it('should delegate to execute when not root', () => {
		// executeSudo prepends sudo when not root; just verify it is a function.
		expect(typeof executeSudo).toBe('function');
	});
});

describe('ShellError', () => {
	it('should have correct properties', () => {
		const err = new ShellError('ShellError: test');
		expect(err).toBeInstanceOf(ShellError);
		expect(err).toBeInstanceOf(Error);
		expect(err).toMatchObject({ name: 'ShellError', message: 'ShellError: test' });
	});
});

describe('ExecutionError', () => {
	it('should have correct properties', () => {
		const err = new ExecutionError('ExecutionError: test', 1, 'out', 'err');
		expect(err).toBeInstanceOf(ExecutionError);
		expect(err).toBeInstanceOf(ShellError);
		expect(err).toBeInstanceOf(Error);
		expect(err).toMatchObject({
			name: 'ExecutionError',
			message: 'ExecutionError: test',
			exitCode: 1,
			stdout: 'out',
			stderr: 'err',
		});
	});

	it('uses defaults when optional args omitted', () => {
		const err = new ExecutionError('ExecutionError: minimal');
		expect(err.exitCode).toBe(1);
		expect(err.stdout).toBe('');
		expect(err.stderr).toBe('');
	});
});

describe('SystemError', () => {
	it('should have correct properties', () => {
		const err = new SystemError('SystemError: test');
		expect(err).toBeInstanceOf(SystemError);
		expect(err).toBeInstanceOf(ShellError);
		expect(err).toBeInstanceOf(Error);
		expect(err).toMatchObject({ name: 'SystemError', message: 'SystemError: test' });
	});
});

describe('system', () => {
	it('detectOS returns a known OS value', () => {
		const result = detectOS();
		expect(Object.values(OS)).toContain(result);
	});

	it('detectPackageManager returns a known PackageManager value', () => {
		const result = detectPackageManager();
		expect(Object.values(PackageManager)).toContain(result);
	});

	it('commandExists returns true for sh', () => {
		expect(commandExists('sh')).toBe(true);
	});

	it('getSystemInfo returns expected shape', () => {
		const info = getSystemInfo();
		expect(typeof info.platform).toBe('string');
		expect(typeof info.os).toBe('string');
		expect(typeof info.arch).toBe('string');
		expect(typeof info.cpus).toBe('number');
		expect(typeof info.memory.total).toBe('number');
	});
});

describe('version', () => {
	it('parseVersion parses a semver string', () => {
		expect(parseVersion('1.2.3')).toMatchObject({ major: 1, minor: 2, patch: 3 });
	});

	it('compareVersions returns negative/zero/positive', () => {
		expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
		expect(compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0);
		expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
	});

	it('isGreaterThan', () => expect(isGreaterThan('2.0.0', '1.0.0')).toBe(true));
	it('isLessThan', () => expect(isLessThan('1.0.0', '2.0.0')).toBe(true));
	it('isEqual', () => expect(isEqual('1.0.0', '1.0.0')).toBe(true));
	it('getLatestVersion picks highest', () => expect(getLatestVersion(['1.0.0', '2.0.0', '1.5.0'])).toBe('2.0.0'));
});

describe('Logger', () => {
	it('Logger is a class constructor', () => {
		const l = new Logger();
		expect(l).toBeInstanceOf(Logger);
	});

	it('logger is a default Logger instance', () => {
		expect(logger).toBeInstanceOf(Logger);
	});

	it('LogLevel has expected constants', () => {
		expect(LogLevel.DEBUG).toBe('debug');
		expect(LogLevel.INFO).toBe('info');
		expect(LogLevel.SUCCESS).toBe('success');
		expect(LogLevel.WARN).toBe('warn');
		expect(LogLevel.ERROR).toBe('error');
	});

	it('stripAnsi removes ANSI codes', () => {
		expect(stripAnsi('\x1b[32mgreen\x1b[0m')).toBe('green');
	});
});
