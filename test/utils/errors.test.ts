import { ShellError, ExecutionError } from '../../src/utils/errors';

describe('ShellError', () => {
  it('should create a ShellError with the correct name and message', () => {
    const err = new ShellError('ShellError: something went wrong');
    expect(err).toBeInstanceOf(ShellError);
    expect(err).toBeInstanceOf(Error);
    expect(err).toMatchObject({ name: 'ShellError', message: 'ShellError: something went wrong' });
  });

  it('should preserve stack trace', () => {
    const err = new ShellError('Stack trace test');
    expect(err.stack).toContain('Stack trace test');
  });

  it('should allow custom messages including empty string', () => {
    const err = new ShellError('');
    expect(err.message).toBe('');
  });

  it('should set prototype correctly for instanceof checks', () => {
    const err = new ShellError('proto test');
    expect(err instanceof ShellError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});

describe('ExecutionError', () => {
  it('should create an ExecutionError with correct properties', () => {
    const err = new ExecutionError('ExecutionError: command failed', 2, 'output', 'error');
    expect(err).toBeInstanceOf(ExecutionError);
    expect(err).toBeInstanceOf(ShellError);
    expect(err).toBeInstanceOf(Error);
    expect(err).toMatchObject({
      name: 'ExecutionError',
      message: 'ExecutionError: command failed',
      exitCode: 2,
      stdout: 'output',
      stderr: 'error',
    });
  });

  it('should default exitCode, stdout, and stderr if not provided', () => {
    const err = new ExecutionError('Default values');
    expect(err.exitCode).toBe(1);
    expect(err.stdout).toBe('');
    expect(err.stderr).toBe('');
    expect(err.signal).toBeNull();
    expect(err.killed).toBe(false);
  });

  it('should allow empty string for message, stdout, and stderr', () => {
    const err = new ExecutionError('', 0, '', '');
    expect(err.message).toBe('');
    expect(err.exitCode).toBe(0);
    expect(err.stdout).toBe('');
    expect(err.stderr).toBe('');
  });

  it('should set prototype correctly for instanceof checks', () => {
    const err = new ExecutionError('proto test');
    expect(err instanceof ExecutionError).toBe(true);
    expect(err instanceof ShellError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('should handle negative and non-integer exit codes', () => {
    const err = new ExecutionError('Negative exit', -1, '', '');
    expect(err.exitCode).toBe(-1);

    const errFloat = new ExecutionError('Float exit', 2.5, '', '');
    expect(errFloat.exitCode).toBe(2.5);
  });

  it('should store signal and killed when provided', () => {
    const err = new ExecutionError('Killed', 1, '', '', 'SIGTERM', true);
    expect(err.signal).toBe('SIGTERM');
    expect(err.killed).toBe(true);
  });

  it('should default signal to null and killed to false', () => {
    const err = new ExecutionError('Normal exit', 1, 'out', 'err');
    expect(err.signal).toBeNull();
    expect(err.killed).toBe(false);
  });

  it('should preserve stack trace', () => {
    const err = new ExecutionError('Stack trace test', 1, 'out', 'err');
    expect(err.stack).toContain('Stack trace test');
  });
});
