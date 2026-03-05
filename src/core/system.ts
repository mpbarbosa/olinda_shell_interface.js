/**
 * System Information Module
 * @module core/system
 * @description OS detection, package manager identification, and system information utilities.
 * @since 0.3.1
 */

import os from 'os';
import { execSync } from 'child_process';
import { SystemError } from '../utils/errors.js';

/** Operating system type constants. */
export const OS = {
	LINUX: 'linux',
	MACOS: 'darwin',
	WINDOWS: 'win32',
	UNKNOWN: 'unknown',
} as const;

export type OsValue = (typeof OS)[keyof typeof OS];

/** Package manager type constants. */
export const PackageManager = {
	APT: 'apt',
	PACMAN: 'pacman',
	DNF: 'dnf',
	ZYPPER: 'zypper',
	BREW: 'brew',
	CHOCOLATEY: 'choco',
	WINGET: 'winget',
	UNKNOWN: 'unknown',
} as const;

export type PackageManagerValue = (typeof PackageManager)[keyof typeof PackageManager];

/** Shape of the object returned by {@link getSystemInfo}. */
export interface SystemInfo {
	platform: string;
	os: OsValue;
	arch: string;
	release: string;
	hostname: string;
	cpus: number;
	memory: { total: number; free: number };
	packageManager: PackageManagerValue;
}

/**
 * Detect the current operating system.
 * @returns OS constant.
 * @since 0.3.1
 * @example
 * const currentOs = detectOS();
 * if (currentOs === OS.LINUX) console.log('Running on Linux');
 */
export function detectOS(): OsValue {
	const platform = os.platform();
	if (platform === 'darwin') return OS.MACOS;
	if (platform === 'win32') return OS.WINDOWS;
	if (platform === 'linux') return OS.LINUX;
	return OS.UNKNOWN;
}

/**
 * Check if a command exists on PATH.
 * @param command - Command name to check.
 * @returns `true` if the command is found on PATH.
 * @since 0.3.1
 * @example
 * if (commandExists('git')) console.log('git is available');
 */
export function commandExists(command: string): boolean {
	try {
		const checkCmd = os.platform() === 'win32' ? `where ${command}` : `command -v ${command}`;
		execSync(checkCmd, { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

function detectLinuxPackageManager(): PackageManagerValue {
	if (commandExists('apt-get')) return PackageManager.APT;
	if (commandExists('pacman')) return PackageManager.PACMAN;
	if (commandExists('dnf')) return PackageManager.DNF;
	if (commandExists('zypper')) return PackageManager.ZYPPER;
	return PackageManager.UNKNOWN;
}

function detectWindowsPackageManager(): PackageManagerValue {
	if (commandExists('winget')) return PackageManager.WINGET;
	if (commandExists('choco')) return PackageManager.CHOCOLATEY;
	return PackageManager.UNKNOWN;
}

/**
 * Detect the system package manager.
 * @returns PackageManager constant.
 * @throws {@link SystemError} if detection fails unexpectedly.
 * @since 0.3.1
 * @example
 * const pm = detectPackageManager();
 * console.log(`Package manager: ${pm}`);
 */
export function detectPackageManager(): PackageManagerValue {
	const osType = detectOS();
	try {
		switch (osType) {
			case OS.LINUX:   return detectLinuxPackageManager();
			case OS.MACOS:   return commandExists('brew') ? PackageManager.BREW : PackageManager.UNKNOWN;
			case OS.WINDOWS: return detectWindowsPackageManager();
			default:         return PackageManager.UNKNOWN;
		}
	} catch (error) {
		const msg = error instanceof Error ? error.message : String(error);
		throw new SystemError(`SystemError: failed to detect package manager — ${msg}`);
	}
}

/**
 * Get comprehensive system information.
 * @returns Object containing platform, os, arch, release, hostname, cpus, memory, packageManager.
 * @since 0.3.1
 * @example
 * const info = getSystemInfo();
 * console.log(`OS: ${info.os}, CPUs: ${info.cpus}`);
 */
export function getSystemInfo(): SystemInfo {
	return {
		platform: os.platform(),
		os: detectOS(),
		arch: os.arch(),
		release: os.release(),
		hostname: os.hostname(),
		cpus: os.cpus().length,
		memory: {
			total: os.totalmem(),
			free: os.freemem(),
		},
		packageManager: detectPackageManager(),
	};
}
