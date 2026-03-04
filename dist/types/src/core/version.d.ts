/**
 * Semantic Version Module
 * @module core/version
 * @description Semantic version parsing and comparison utilities (semver-compatible).
 * @since 0.4.5
 */
/** Parsed components of a semantic version string. */
export interface ParsedVersion {
    major: number;
    minor: number;
    patch: number;
    prerelease: string;
    build: string;
}
/**
 * Parse a version string into its numeric and label components.
 *
 * Accepts an optional leading `v` (e.g. `"v1.2.3-beta+001"`).
 * Minor and patch components default to `0` when omitted.
 *
 * @param version - Version string to parse (e.g. `"1.2.3"`, `"v2.0.0-alpha"`).
 * @returns Object with `major`, `minor`, `patch`, `prerelease`, and `build`.
 * @throws {Error} When `version` does not match the semver pattern.
 */
export declare function parseVersion(version: string): ParsedVersion;
/**
 * Numerically compare two version strings.
 *
 * Versions with a pre-release label sort *before* the equivalent release
 * (e.g. `"1.0.0-alpha" < "1.0.0"`), matching the semver specification.
 *
 * @param version1 - First version string.
 * @param version2 - Second version string.
 * @returns Negative when `version1 < version2`, `0` when equal, positive when `version1 > version2`.
 */
export declare function compareVersions(version1: string, version2: string): number;
/**
 * Returns `true` when `version1` is strictly greater than `version2`.
 * @param version1 - First version string.
 * @param version2 - Second version string.
 * @returns `true` when `version1 > version2`.
 * @since 0.4.5
 * @example
 * isGreaterThan('2.0.0', '1.9.9'); // true
 */
export declare function isGreaterThan(version1: string, version2: string): boolean;
/**
 * Returns `true` when `version1` is strictly less than `version2`.
 * @param version1 - First version string.
 * @param version2 - Second version string.
 * @returns `true` when `version1 < version2`.
 * @since 0.4.5
 * @example
 * isLessThan('1.0.0', '2.0.0'); // true
 */
export declare function isLessThan(version1: string, version2: string): boolean;
/**
 * Returns `true` when both versions are semantically equal.
 * @param version1 - First version string.
 * @param version2 - Second version string.
 * @returns `true` when `version1 === version2` semantically.
 * @since 0.4.5
 * @example
 * isEqual('v1.0.0', '1.0.0'); // true
 */
export declare function isEqual(version1: string, version2: string): boolean;
/**
 * Return the highest version from an array of version strings.
 * @param versions - Array of version strings (returns `null` for empty array).
 * @returns The latest version string, or `null` when the array is empty.
 */
export declare function getLatestVersion(versions: string[]): string | null;
declare const _default: {
    parseVersion: typeof parseVersion;
    compareVersions: typeof compareVersions;
    isGreaterThan: typeof isGreaterThan;
    isLessThan: typeof isLessThan;
    isEqual: typeof isEqual;
    getLatestVersion: typeof getLatestVersion;
};
export default _default;
