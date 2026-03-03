import {
	parseVersion,
	compareVersions,
	isGreaterThan,
	isLessThan,
	isEqual,
	getLatestVersion,
} from '../../src/core/version';

// ─── parseVersion ────────────────────────────────────────────────────────────

describe('parseVersion', () => {
	it('parses a standard semver string', () => {
		expect(parseVersion('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3, prerelease: '', build: '' });
	});

	it('strips leading v', () => {
		expect(parseVersion('v2.0.0')).toEqual({ major: 2, minor: 0, patch: 0, prerelease: '', build: '' });
	});

	it('defaults minor and patch to 0 when omitted', () => {
		expect(parseVersion('3')).toMatchObject({ major: 3, minor: 0, patch: 0 });
		expect(parseVersion('3.1')).toMatchObject({ major: 3, minor: 1, patch: 0 });
	});

	it('parses prerelease label', () => {
		const result = parseVersion('1.0.0-alpha.1');
		expect(result.prerelease).toBe('alpha.1');
		expect(result.build).toBe('');
	});

	it('parses build metadata', () => {
		const result = parseVersion('1.0.0+build.123');
		expect(result.build).toBe('build.123');
		expect(result.prerelease).toBe('');
	});

	it('parses prerelease and build together', () => {
		const result = parseVersion('1.2.3-beta+exp.sha.5114f85');
		expect(result.prerelease).toBe('beta');
		expect(result.build).toBe('exp.sha.5114f85');
	});

	it('returns zeros for empty string', () => {
		expect(parseVersion('')).toEqual({ major: 0, minor: 0, patch: 0, prerelease: '', build: '' });
	});

	it('throws for invalid format', () => {
		expect(() => parseVersion('not-a-version')).toThrow('Invalid version format');
	});

	it('throws for version with invalid characters', () => {
		expect(() => parseVersion('1.x.0')).toThrow('Invalid version format');
	});
});

// ─── compareVersions ─────────────────────────────────────────────────────────

describe('compareVersions', () => {
	it('returns 0 for equal versions', () => {
		expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
	});

	it('returns negative when v1 < v2 by major', () => {
		expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
	});

	it('returns positive when v1 > v2 by major', () => {
		expect(compareVersions('3.0.0', '2.0.0')).toBeGreaterThan(0);
	});

	it('compares by minor when major is equal', () => {
		expect(compareVersions('1.1.0', '1.2.0')).toBeLessThan(0);
		expect(compareVersions('1.3.0', '1.2.0')).toBeGreaterThan(0);
	});

	it('compares by patch when major and minor are equal', () => {
		expect(compareVersions('1.0.1', '1.0.2')).toBeLessThan(0);
		expect(compareVersions('1.0.3', '1.0.2')).toBeGreaterThan(0);
	});

	it('prerelease version sorts before release', () => {
		expect(compareVersions('1.0.0-alpha', '1.0.0')).toBeLessThan(0);
		expect(compareVersions('1.0.0', '1.0.0-alpha')).toBeGreaterThan(0);
	});

	it('compares prerelease labels lexicographically', () => {
		expect(compareVersions('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0);
		expect(compareVersions('1.0.0-beta', '1.0.0-alpha')).toBeGreaterThan(0);
	});
});

// ─── isGreaterThan ───────────────────────────────────────────────────────────

describe('isGreaterThan', () => {
	it('returns true when v1 > v2', () => expect(isGreaterThan('2.0.0', '1.0.0')).toBe(true));
	it('returns false when v1 < v2', () => expect(isGreaterThan('1.0.0', '2.0.0')).toBe(false));
	it('returns false when equal', () => expect(isGreaterThan('1.0.0', '1.0.0')).toBe(false));
});

// ─── isLessThan ──────────────────────────────────────────────────────────────

describe('isLessThan', () => {
	it('returns true when v1 < v2', () => expect(isLessThan('1.0.0', '2.0.0')).toBe(true));
	it('returns false when v1 > v2', () => expect(isLessThan('2.0.0', '1.0.0')).toBe(false));
	it('returns false when equal', () => expect(isLessThan('1.0.0', '1.0.0')).toBe(false));
});

// ─── isEqual ─────────────────────────────────────────────────────────────────

describe('isEqual', () => {
	it('returns true for identical versions', () => expect(isEqual('1.2.3', '1.2.3')).toBe(true));
	it('returns false for different versions', () => expect(isEqual('1.0.0', '2.0.0')).toBe(false));
	it('treats v-prefixed and non-prefixed as equal', () => expect(isEqual('v1.0.0', '1.0.0')).toBe(true));
});

// ─── getLatestVersion ────────────────────────────────────────────────────────

describe('getLatestVersion', () => {
	it('returns the highest version', () => {
		expect(getLatestVersion(['1.0.0', '2.0.0', '1.5.0'])).toBe('2.0.0');
	});

	it('returns the single element from a one-element array', () => {
		expect(getLatestVersion(['3.0.0'])).toBe('3.0.0');
	});

	it('returns null for empty array', () => {
		expect(getLatestVersion([])).toBeNull();
	});

	it('handles prerelease ordering correctly', () => {
		expect(getLatestVersion(['1.0.0-alpha', '1.0.0', '0.9.0'])).toBe('1.0.0');
	});

	it('handles v-prefixed versions', () => {
		expect(getLatestVersion(['v1.0.0', 'v2.0.0', 'v1.9.9'])).toBe('v2.0.0');
	});
});
