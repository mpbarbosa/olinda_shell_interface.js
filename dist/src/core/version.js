"use strict";
/**
 * Semantic Version Module
 * @module core/version
 * @description Semantic version parsing and comparison utilities (semver-compatible).
 * @since 0.4.4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseVersion = parseVersion;
exports.compareVersions = compareVersions;
exports.isGreaterThan = isGreaterThan;
exports.isLessThan = isLessThan;
exports.isEqual = isEqual;
exports.getLatestVersion = getLatestVersion;
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
function parseVersion(version) {
    if (!version) {
        return { major: 0, minor: 0, patch: 0, prerelease: '', build: '' };
    }
    const cleanVersion = version.replace(/^v/, '');
    const match = cleanVersion.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z-.]+))?(?:\+([0-9A-Za-z-.]+))?$/);
    if (!match) {
        throw new Error(`Invalid version format: ${version}`);
    }
    return {
        major: parseInt(match[1] ?? '0', 10),
        minor: parseInt(match[2] ?? '0', 10),
        patch: parseInt(match[3] ?? '0', 10),
        prerelease: match[4] ?? '',
        build: match[5] ?? '',
    };
}
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
function compareVersions(version1, version2) {
    const v1 = parseVersion(version1);
    const v2 = parseVersion(version2);
    if (v1.major !== v2.major)
        return v1.major - v2.major;
    if (v1.minor !== v2.minor)
        return v1.minor - v2.minor;
    if (v1.patch !== v2.patch)
        return v1.patch - v2.patch;
    if (v1.prerelease && !v2.prerelease)
        return -1;
    if (!v1.prerelease && v2.prerelease)
        return 1;
    if (v1.prerelease && v2.prerelease) {
        return v1.prerelease.localeCompare(v2.prerelease);
    }
    return 0;
}
/**
 * Returns `true` when `version1` is strictly greater than `version2`.
 * @param version1 - First version string.
 * @param version2 - Second version string.
 * @returns `true` when `version1 > version2`.
 * @since 0.4.4
 * @example
 * isGreaterThan('2.0.0', '1.9.9'); // true
 */
function isGreaterThan(version1, version2) {
    return compareVersions(version1, version2) > 0;
}
/**
 * Returns `true` when `version1` is strictly less than `version2`.
 * @param version1 - First version string.
 * @param version2 - Second version string.
 * @returns `true` when `version1 < version2`.
 * @since 0.4.4
 * @example
 * isLessThan('1.0.0', '2.0.0'); // true
 */
function isLessThan(version1, version2) {
    return compareVersions(version1, version2) < 0;
}
/**
 * Returns `true` when both versions are semantically equal.
 * @param version1 - First version string.
 * @param version2 - Second version string.
 * @returns `true` when `version1 === version2` semantically.
 * @since 0.4.4
 * @example
 * isEqual('v1.0.0', '1.0.0'); // true
 */
function isEqual(version1, version2) {
    return compareVersions(version1, version2) === 0;
}
/**
 * Return the highest version from an array of version strings.
 * @param versions - Array of version strings (returns `null` for empty array).
 * @returns The latest version string, or `null` when the array is empty.
 */
function getLatestVersion(versions) {
    if (!versions || versions.length === 0) {
        return null;
    }
    return versions.reduce((latest, current) => compareVersions(current, latest) > 0 ? current : latest);
}
exports.default = {
    parseVersion,
    compareVersions,
    isGreaterThan,
    isLessThan,
    isEqual,
    getLatestVersion,
};
