/**
 * System Information Module
 * @module core/system
 * @description OS detection, package manager identification, and system information utilities.
 * @since 0.3.1
 */
/** Operating system type constants. */
export declare const OS: {
    readonly LINUX: "linux";
    readonly MACOS: "darwin";
    readonly WINDOWS: "win32";
    readonly UNKNOWN: "unknown";
};
export type OsValue = (typeof OS)[keyof typeof OS];
/** Package manager type constants. */
export declare const PackageManager: {
    readonly APT: "apt";
    readonly PACMAN: "pacman";
    readonly DNF: "dnf";
    readonly ZYPPER: "zypper";
    readonly BREW: "brew";
    readonly CHOCOLATEY: "choco";
    readonly WINGET: "winget";
    readonly UNKNOWN: "unknown";
};
export type PackageManagerValue = (typeof PackageManager)[keyof typeof PackageManager];
/** Shape of the object returned by {@link getSystemInfo}. */
export interface SystemInfo {
    platform: string;
    os: OsValue;
    arch: string;
    release: string;
    hostname: string;
    cpus: number;
    memory: {
        total: number;
        free: number;
    };
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
export declare function detectOS(): OsValue;
/**
 * Check if a command exists on PATH.
 * @param command - Command name to check.
 * @returns `true` if the command is found on PATH.
 * @since 0.3.1
 * @example
 * if (commandExists('git')) console.log('git is available');
 */
export declare function commandExists(command: string): boolean;
/**
 * Detect the system package manager.
 * @returns PackageManager constant.
 * @throws {@link SystemError} if detection fails unexpectedly.
 * @since 0.3.1
 * @example
 * const pm = detectPackageManager();
 * console.log(`Package manager: ${pm}`);
 */
export declare function detectPackageManager(): PackageManagerValue;
/**
 * Get comprehensive system information.
 * @returns Object containing platform, os, arch, release, hostname, cpus, memory, packageManager.
 * @since 0.3.1
 * @example
 * const info = getSystemInfo();
 * console.log(`OS: ${info.os}, CPUs: ${info.cpus}`);
 */
export declare function getSystemInfo(): SystemInfo;
