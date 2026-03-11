import { exec as I, spawn as M, execSync as T } from "child_process";
import { promisify as J } from "util";
import $ from "os";
import { logger as a } from "olinda_utils.js";
import { LogLevel as De, Logger as We, camelCase as je, capitalize as Le, chunk as ke, cleanWhitespace as Ue, colorize as Ie, colors as Me, dedupe as Te, deepClone as Je, deepEqual as _e, deepMerge as Ye, difference as qe, escapeRegex as ze, flatten as Be, getProperty as Ke, groupBy as Ve, hasProperty as Xe, intersection as Ze, isEmpty as Ge, kebabCase as Qe, logger as He, omit as Pe, partition as er, pascalCase as rr, pick as tr, sanitize as nr, setProperty as ir, snakeCase as or, sortBy as sr, stripAnsi as ar, supportsColor as cr, truncate as lr } from "olinda_utils.js";
import g from "fs/promises";
import { minimatch as W } from "minimatch";
import w from "path";
class C extends Error {
  /**
   * @param message - Human-readable error description.
   */
  constructor(e) {
    super(e), this.name = "ShellError", Object.setPrototypeOf(this, new.target.prototype), this.name = "ShellError";
  }
}
class N extends C {
  /**
   * @param message  - Human-readable description.
   * @param exitCode - Process exit code.
   * @param stdout   - Captured standard output.
   * @param stderr   - Captured standard error.
   * @param signal   - OS signal that terminated the process (e.g. `'SIGTERM'`), or `null`.
   * @param killed   - Whether the process was killed by the timeout mechanism.
   */
  constructor(e, r = 1, t = "", i = "", o = null, s = !1) {
    super(e), this.exitCode = r, this.stdout = t, this.stderr = i, this.signal = o, this.killed = s, this.name = "ExecutionError", Object.setPrototypeOf(this, new.target.prototype), this.name = "ExecutionError";
  }
}
class _ extends C {
  /**
   * @param message - Human-readable error description.
   */
  constructor(e) {
    super(e), this.name = "SystemError", Object.setPrototypeOf(this, new.target.prototype), this.name = "SystemError";
  }
}
class d extends C {
  /**
   * @param message - Human-readable description.
   * @param details - Optional structured details about the failure.
   */
  constructor(e, r = {}) {
    super(e), this.name = "FileSystemError", Object.setPrototypeOf(this, new.target.prototype), this.name = "FileSystemError", this.path = r.path ?? null, this.destination = r.destination ?? null, this.originalError = r.originalError ?? null;
  }
}
const Y = J(I);
async function A(n, e = {}) {
  const {
    cwd: r = process.cwd(),
    env: t = process.env,
    timeout: i = 3e5,
    shell: o = "/bin/sh",
    maxBuffer: s = 10 * 1024 * 1024
  } = e, l = o === !0 ? "/bin/sh" : o === !1 ? void 0 : o;
  try {
    const { stdout: c, stderr: u } = await Y(n, {
      cwd: r,
      env: t,
      timeout: i,
      shell: l,
      maxBuffer: s
    });
    return { stdout: c.trim(), stderr: u.trim(), exitCode: 0 };
  } catch (c) {
    const u = typeof c == "object" && c !== null && "code" in c ? c : null, f = typeof u?.code == "number" ? u.code : 1, p = typeof u?.stdout == "string" ? u.stdout.trim() : "", E = typeof u?.stderr == "string" ? u.stderr.trim() : "", x = u?.signal ?? null, m = u?.killed ?? !1;
    throw new N(
      `ExecutionError: ${n}`,
      f,
      p,
      E,
      x,
      m
    );
  }
}
function pe(n, e = {}) {
  return new Promise((r, t) => {
    const {
      cwd: i = process.cwd(),
      env: o = process.env,
      onStdout: s,
      onStderr: l
    } = e, c = M(n, [], {
      cwd: i,
      env: o,
      stdio: ["inherit", "pipe", "pipe"],
      shell: !0
    });
    s ? c.stdout.on("data", (f) => s(f.toString())) : c.stdout.pipe(process.stdout), l ? c.stderr.on("data", (f) => l(f.toString())) : c.stderr.pipe(process.stderr);
    let u = !1;
    c.on("close", (f, p) => {
      if (u) return;
      u = !0;
      const E = f ?? 1;
      f === 0 ? r(E) : t(
        new N(
          p ? `ExecutionError: command killed by signal ${p}` : `ExecutionError: command exited with code ${E}`,
          E,
          "",
          "",
          p
        )
      );
    }), c.on("error", (f) => {
      u || (u = !0, t(
        new N(
          `ExecutionError: failed to spawn — ${f.message}`
        )
      ));
    });
  });
}
async function ge(n, e = {}) {
  const r = process.platform !== "win32" && typeof process.getuid == "function" && process.getuid() !== 0;
  return A(r ? `sudo ${n}` : n, e);
}
const v = {
  LINUX: "linux",
  MACOS: "darwin",
  WINDOWS: "win32",
  UNKNOWN: "unknown"
}, y = {
  APT: "apt",
  PACMAN: "pacman",
  DNF: "dnf",
  ZYPPER: "zypper",
  BREW: "brew",
  CHOCOLATEY: "choco",
  WINGET: "winget",
  UNKNOWN: "unknown"
};
function U() {
  const n = $.platform();
  return n === "darwin" ? v.MACOS : n === "win32" ? v.WINDOWS : n === "linux" ? v.LINUX : v.UNKNOWN;
}
function R(n) {
  try {
    const e = $.platform() === "win32" ? `where ${n}` : `command -v ${n}`;
    return T(e, { stdio: "ignore" }), !0;
  } catch {
    return !1;
  }
}
function q() {
  return R("apt-get") ? y.APT : R("pacman") ? y.PACMAN : R("dnf") ? y.DNF : R("zypper") ? y.ZYPPER : y.UNKNOWN;
}
function z() {
  return R("winget") ? y.WINGET : R("choco") ? y.CHOCOLATEY : y.UNKNOWN;
}
function B() {
  const n = U();
  try {
    switch (n) {
      case v.LINUX:
        return q();
      case v.MACOS:
        return R("brew") ? y.BREW : y.UNKNOWN;
      case v.WINDOWS:
        return z();
      default:
        return y.UNKNOWN;
    }
  } catch (e) {
    const r = e instanceof Error ? e.message : String(e);
    throw new _(
      `SystemError: failed to detect package manager — ${r}`
    );
  }
}
function he() {
  return {
    platform: $.platform(),
    os: U(),
    arch: $.arch(),
    release: $.release(),
    hostname: $.hostname(),
    cpus: $.cpus().length,
    memory: {
      total: $.totalmem(),
      free: $.freemem()
    },
    packageManager: B()
  };
}
function j(n) {
  if (!n)
    return { major: 0, minor: 0, patch: 0, prerelease: "", build: "" };
  const r = n.replace(/^v/, "").match(
    /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z-.]+))?(?:\+([0-9A-Za-z-.]+))?$/
  );
  if (!r)
    throw new Error(`Invalid version format: ${n}`);
  return {
    major: parseInt(r[1] ?? "0", 10),
    minor: parseInt(r[2] ?? "0", 10),
    patch: parseInt(r[3] ?? "0", 10),
    prerelease: r[4] ?? "",
    build: r[5] ?? ""
  };
}
function b(n, e) {
  const r = j(n), t = j(e);
  return r.major !== t.major ? r.major - t.major : r.minor !== t.minor ? r.minor - t.minor : r.patch !== t.patch ? r.patch - t.patch : r.prerelease && !t.prerelease ? -1 : !r.prerelease && t.prerelease ? 1 : r.prerelease && t.prerelease ? r.prerelease.localeCompare(t.prerelease) : 0;
}
function me(n, e) {
  return b(n, e) > 0;
}
function we(n, e) {
  return b(n, e) < 0;
}
function ye(n, e) {
  return b(n, e) === 0;
}
function Ee(n) {
  return !n || n.length === 0 ? null : n.reduce(
    (e, r) => b(r, e) > 0 ? r : e
  );
}
class F extends C {
  /**
   * @param message - Human-readable description.
   * @param code    - Machine-readable error code.
   * @param context - Caller context identifier for debugging.
   */
  constructor(e, r, t) {
    super(e), this.code = r, this.context = t, this.name = "JqExecutionError", Object.setPrototypeOf(this, new.target.prototype), this.name = "JqExecutionError";
  }
}
function $e(n) {
  if (typeof n != "string" || n.trim() === "")
    return !1;
  try {
    return JSON.parse(n), !0;
  } catch {
    return !1;
  }
}
function K(n, e) {
  if (n === "true") return !0;
  if (n === "false") return !1;
  if (n === "null") return null;
  if (n === "") return e;
  const r = Number(n);
  if (!isNaN(r) && isFinite(r)) return r;
  try {
    return JSON.parse(n);
  } catch {
    return e;
  }
}
function ve(n, e = 0) {
  if (n === null) return null;
  if (n === void 0) return e;
  if (typeof n == "boolean") return n;
  if (typeof n == "number")
    return isNaN(n) || !isFinite(n) ? e : n;
  if (typeof n == "string")
    return K(n.trim(), e);
  if (typeof n == "object")
    try {
      return JSON.parse(JSON.stringify(n));
    } catch {
      return e;
    }
  return e;
}
function V(n) {
  const e = [], r = [];
  let t = 0;
  for (; t < n.length; ) {
    const i = n[t];
    if (i === "--argjson") {
      const o = n[t + 1], s = n[t + 2];
      o !== void 0 && s !== void 0 ? (e.push({ name: o, value: s }), t += 3) : (r.push(i), t++);
    } else
      r.push(i), t++;
  }
  return { argjsonPairs: e, otherArgs: r };
}
function X(n) {
  const e = [];
  for (const { name: r, value: t } of n) {
    if (t === "" || t === null || t === void 0) {
      e.push(`--argjson variable "${r}" has empty value`);
      continue;
    }
    const i = String(t).trim();
    /^(-?\d+\.?\d*|".*"|true|false|null|\{.*\}|\[.*\])$/.test(i) || e.push(
      `--argjson variable "${r}" value "${t}" may not be valid JSON`
    );
  }
  return { valid: e.length === 0, errors: e };
}
function Z(n) {
  return `jq ${n.map((r) => {
    let t = typeof r != "string" ? String(r) : r;
    return /[\s'"$`\\]/.test(t) ? `'${t.replace(/'/g, "'\\''")}'` : t;
  }).join(" ")}`;
}
class Re {
  constructor(e = {}) {
    this.debug = e.debug ?? !1, this.callerContext = e.callerContext ?? "unknown";
  }
  /**
   * Execute a jq command with `--argjson` validation.
   * @param args           - jq command arguments.
   * @param options        - Execution options.
   * @returns jq stdout output.
   * @throws {@link JqExecutionError} on validation or execution failure (when `throwOnError` is `true`).
   * @example
   * const result = await wrapper.execute(['-n', '--argjson', 'count', '5', '{count: $count}']);
   */
  async execute(e, r = {}) {
    const t = r.throwOnError !== !1;
    this.debug && (a.debug(`jq_safe called from: ${this.callerContext}`), a.debug(`Arguments: ${e.join(" ")}`));
    const { argjsonPairs: i } = V(e), o = X(i);
    if (!o.valid) {
      const l = `jq_safe validation failed in ${this.callerContext}:
${o.errors.map((c) => `  - ${c}`).join(`
`)}`;
      if (a.error(l), t)
        throw new F(
          l,
          "JQ_VALIDATION_ERROR",
          this.callerContext
        );
      return "";
    }
    const s = Z(e);
    try {
      const { stdout: l } = await A(s);
      return this.debug && a.debug(`jq_safe completed successfully in ${this.callerContext}`), l;
    } catch (l) {
      const c = `jq_safe failed in ${this.callerContext}: ${l instanceof Error ? l.message : String(l)}`;
      if (a.error(c), t)
        throw new F(
          c,
          "JQ_EXECUTION_ERROR",
          this.callerContext
        );
      return "";
    }
  }
  /**
   * Execute a jq command and parse the result as JSON.
   * @param args    - jq command arguments.
   * @param options - Execution options.
   * @returns Parsed JSON result.
   * @throws {@link JqExecutionError} if execution or JSON parsing fails.
   * @example
   * const obj = await wrapper.executeAndParse(['-n', '{foo: "bar"}']);
   * // { foo: 'bar' }
   */
  async executeAndParse(e, r = {}) {
    const t = await this.execute(e, r);
    try {
      return JSON.parse(t);
    } catch (i) {
      const o = `Failed to parse jq output as JSON: ${i instanceof Error ? i.message : String(i)}`;
      throw a.error(o), new F(
        o,
        "JQ_PARSE_ERROR",
        this.callerContext
      );
    }
  }
  /**
   * Validate a JSON string by piping it through jq.
   * @param jsonString - JSON string to validate.
   * @returns `true` if the string is valid JSON, `false` otherwise.
   * @example
   * await wrapper.validateJsonWithJq('{"foo": "bar"}') // true
   * await wrapper.validateJsonWithJq('{invalid}')      // false
   */
  async validateJsonWithJq(e) {
    const r = e.replace(/'/g, "'\\''");
    try {
      return await A(`printf '%s
' '${r}' | jq -e . >/dev/null`), !0;
    } catch {
      return !1;
    }
  }
}
const G = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  ".svn",
  ".hg",
  "__pycache__",
  ".pytest_cache",
  ".tox",
  ".mypy_cache"
]);
function h(n) {
  if (!n || typeof n != "string")
    return { valid: !1, error: "Path must be a non-empty string" };
  if (!w.isAbsolute(n))
    return { valid: !1, error: "Only absolute paths are allowed" };
  const e = w.normalize(n);
  return n.includes("..") || e.includes("..") ? { valid: !1, error: "Directory traversal not allowed" } : { valid: !0 };
}
function L(n, e) {
  if (!Array.isArray(n) || !Array.isArray(e))
    return [];
  const r = e.map(
    (t) => t.startsWith(".") ? t : `.${t}`
  );
  return n.filter(
    (t) => r.includes(w.extname(t))
  );
}
function k(n, e) {
  if (!Array.isArray(n))
    return [];
  const r = e instanceof RegExp ? e : new RegExp(e);
  return n.filter((t) => r.test(t));
}
function Ce(n, e = !0) {
  return Array.isArray(n) ? [...n].sort((t, i) => {
    const o = t.mtime instanceof Date ? t.mtime.getTime() : 0, s = i.mtime instanceof Date ? i.mtime.getTime() : 0;
    return e ? o - s : s - o;
  }) : [];
}
function Q(n, e) {
  return {
    path: n,
    size: e.size,
    isFile: e.isFile(),
    isDirectory: e.isDirectory(),
    isSymbolicLink: e.isSymbolicLink(),
    created: e.birthtime,
    modified: e.mtime,
    accessed: e.atime
  };
}
function be(n, e) {
  return w.relative(n, e);
}
class H {
  constructor(e = {}) {
    this.dryRun = e.dryRun ?? !1, this.verbose = e.verbose ?? !1;
  }
  /**
   * Read file contents.
   * @param filePath - Absolute path to the file.
   * @param encoding - Text encoding. Default: `'utf8'`.
   * @returns File contents as a string.
   * @throws {@link FileSystemError} on invalid path or read failure.
   */
  async readFile(e, r = "utf8") {
    const t = h(e);
    if (!t.valid)
      throw new d(t.error, { path: e });
    try {
      return this.verbose && a.debug(`Reading file: ${e}`), await g.readFile(e, r);
    } catch (i) {
      const o = i instanceof Error ? i.message : String(i);
      throw new d(`Failed to read file: ${o}`, {
        path: e,
        originalError: i instanceof Error ? i : void 0
      });
    }
  }
  /**
   * Write content to a file, creating parent directories as needed.
   * @param filePath - Absolute path to the file.
   * @param content  - Content to write.
   * @param options  - Options forwarded to `fs.writeFile`.
   * @throws {@link FileSystemError} on invalid path or write failure.
   */
  async writeFile(e, r, t = {}) {
    const i = h(e);
    if (!i.valid)
      throw new d(i.error, { path: e });
    if (this.dryRun) {
      a.info(
        `[DRY RUN] Would write to file: ${e} (${r.length} bytes)`
      );
      return;
    }
    try {
      this.verbose && a.debug(`Writing file: ${e}`), await g.mkdir(w.dirname(e), { recursive: !0 }), await g.writeFile(e, r, t), this.verbose && a.success(`File written: ${e}`);
    } catch (o) {
      const s = o instanceof Error ? o.message : String(o);
      throw new d(`Failed to write file: ${s}`, {
        path: e,
        originalError: o instanceof Error ? o : void 0
      });
    }
  }
  /**
   * Check whether a path exists.
   * @param filePath - Absolute path.
   * @returns `true` if the path exists, `false` otherwise.
   */
  async exists(e) {
    if (!h(e).valid) return !1;
    try {
      return await g.access(e), !0;
    } catch {
      return !1;
    }
  }
  /**
   * Get file or directory metadata.
   * @param filePath - Absolute path.
   * @returns {@link FileMetadata} object.
   * @throws {@link FileSystemError} on invalid path or stat failure.
   */
  async stat(e) {
    const r = h(e);
    if (!r.valid)
      throw new d(r.error, { path: e });
    try {
      const t = await g.stat(e);
      return Q(e, t);
    } catch (t) {
      const i = t instanceof Error ? t.message : String(t);
      throw new d(`Failed to get file stats: ${i}`, {
        path: e,
        originalError: t instanceof Error ? t : void 0
      });
    }
  }
  /**
   * List directory contents (non-recursive).
   * @param dirPath - Absolute path to directory.
   * @param options - Filter options.
   * @returns Absolute paths of directory entries.
   * @throws {@link FileSystemError} on invalid path or read failure.
   */
  async listDirectory(e, r = {}) {
    const t = h(e);
    if (!t.valid)
      throw new d(t.error, { path: e });
    try {
      this.verbose && a.debug(`Listing directory: ${e}`);
      let i = (await g.readdir(e)).map(
        (o) => w.join(e, o)
      );
      return r.extensions && (i = L(i, r.extensions)), r.pattern && (i = k(i, r.pattern)), i;
    } catch (i) {
      const o = i instanceof Error ? i.message : String(i);
      throw new d(`Failed to list directory: ${o}`, {
        path: e,
        originalError: i instanceof Error ? i : void 0
      });
    }
  }
  /**
   * List directory contents recursively.
   * @param dirPath - Absolute path to directory.
   * @param options - Traversal and filter options.
   * @returns Absolute paths of all matching files (and optionally directories).
   * @throws {@link FileSystemError} on invalid path or traversal failure.
   */
  async listDirectoryRecursive(e, r = {}) {
    const t = h(e);
    if (!t.valid)
      throw new d(t.error, { path: e });
    const i = [], o = new Set(r.exclude ?? []), s = r.allowAll ? o : /* @__PURE__ */ new Set([...G, ...o]);
    async function l(c) {
      const u = await g.readdir(c, { withFileTypes: !0 });
      for (const f of u) {
        const p = w.join(c, f.name);
        if (f.isDirectory()) {
          if (s.has(f.name)) continue;
          r.includeDirectories && i.push(p), await l(p);
        } else f.isFile() && i.push(p);
      }
    }
    try {
      await l(e);
      let c = i;
      return r.extensions && (c = L(c, r.extensions)), r.pattern && (c = k(c, r.pattern)), c;
    } catch (c) {
      const u = c instanceof Error ? c.message : String(c);
      throw new d(
        `Failed to list directory recursively: ${u}`,
        {
          path: e,
          originalError: c instanceof Error ? c : void 0
        }
      );
    }
  }
  /**
   * Copy a file to a new location, creating destination directories as needed.
   * @param sourcePath - Absolute source path.
   * @param destPath   - Absolute destination path.
   * @throws {@link FileSystemError} on invalid path or copy failure.
   */
  async copyFile(e, r) {
    const t = h(e), i = h(r);
    if (!t.valid) throw new d(t.error, { path: e });
    if (!i.valid) throw new d(i.error, { path: r });
    if (this.dryRun) {
      a.info(`[DRY RUN] Would copy file: ${e} → ${r}`);
      return;
    }
    try {
      this.verbose && a.debug(`Copying file: ${e} → ${r}`), await g.mkdir(w.dirname(r), { recursive: !0 }), await g.copyFile(e, r), this.verbose && a.success(`File copied: ${r}`);
    } catch (o) {
      const s = o instanceof Error ? o.message : String(o);
      throw new d(`Failed to copy file: ${s}`, {
        path: e,
        destination: r,
        originalError: o instanceof Error ? o : void 0
      });
    }
  }
  /**
   * Move (rename) a file, creating destination directories as needed.
   * @param sourcePath - Absolute source path.
   * @param destPath   - Absolute destination path.
   * @throws {@link FileSystemError} on invalid path or move failure.
   */
  async moveFile(e, r) {
    const t = h(e), i = h(r);
    if (!t.valid) throw new d(t.error, { path: e });
    if (!i.valid) throw new d(i.error, { path: r });
    if (this.dryRun) {
      a.info(`[DRY RUN] Would move file: ${e} → ${r}`);
      return;
    }
    try {
      this.verbose && a.debug(`Moving file: ${e} → ${r}`), await g.mkdir(w.dirname(r), { recursive: !0 }), await g.rename(e, r), this.verbose && a.success(`File moved: ${r}`);
    } catch (o) {
      const s = o instanceof Error ? o.message : String(o);
      throw new d(`Failed to move file: ${s}`, {
        path: e,
        destination: r,
        originalError: o instanceof Error ? o : void 0
      });
    }
  }
  /**
   * Delete a file.
   * @param filePath - Absolute path to file.
   * @throws {@link FileSystemError} on invalid path or deletion failure.
   */
  async deleteFile(e) {
    const r = h(e);
    if (!r.valid)
      throw new d(r.error, { path: e });
    if (this.dryRun) {
      a.info(`[DRY RUN] Would delete file: ${e}`);
      return;
    }
    try {
      this.verbose && a.debug(`Deleting file: ${e}`), await g.unlink(e), this.verbose && a.success(`File deleted: ${e}`);
    } catch (t) {
      const i = t instanceof Error ? t.message : String(t);
      throw new d(`Failed to delete file: ${i}`, {
        path: e,
        originalError: t instanceof Error ? t : void 0
      });
    }
  }
  /**
   * Create a directory (recursive by default).
   * @param dirPath - Absolute path to directory.
   * @param options - Options forwarded to `fs.mkdir`. Default: `{ recursive: true }`.
   * @throws {@link FileSystemError} on invalid path or creation failure (EEXIST is silently ignored).
   */
  async createDirectory(e, r = { recursive: !0 }) {
    const t = h(e);
    if (!t.valid)
      throw new d(t.error, { path: e });
    if (this.dryRun) {
      a.info(`[DRY RUN] Would create directory: ${e}`);
      return;
    }
    try {
      this.verbose && a.debug(`Creating directory: ${e}`), await g.mkdir(e, r), this.verbose && a.success(`Directory created: ${e}`);
    } catch (i) {
      if (!(i instanceof Error) || "code" in i && i.code === "EEXIST")
        return;
      throw new d(
        `Failed to create directory: ${i.message}`,
        {
          path: e,
          originalError: i
        }
      );
    }
  }
  /**
   * Delete a directory and all its contents recursively.
   * @param dirPath - Absolute path to directory.
   * @throws {@link FileSystemError} on invalid path or deletion failure.
   */
  async deleteDirectory(e) {
    const r = h(e);
    if (!r.valid)
      throw new d(r.error, { path: e });
    if (this.dryRun) {
      a.info(`[DRY RUN] Would delete directory: ${e}`);
      return;
    }
    try {
      this.verbose && a.debug(`Deleting directory: ${e}`), await g.rm(e, { recursive: !0, force: !0 }), this.verbose && a.success(`Directory deleted: ${e}`);
    } catch (t) {
      const i = t instanceof Error ? t.message : String(t);
      throw new d(`Failed to delete directory: ${i}`, {
        path: e,
        originalError: t instanceof Error ? t : void 0
      });
    }
  }
  /**
   * Find files matching a glob pattern using {@link listDirectoryRecursive} + minimatch.
   * @param pattern - Glob pattern (e.g. `'**\/*.ts'`).
   * @param options - Glob options.
   * @returns Matching file paths (relative or absolute depending on `options.absolute`).
   */
  async glob(e, r = {}) {
    const { cwd: t = process.cwd(), ignore: i = [], absolute: o = !1 } = r;
    return (await this.listDirectoryRecursive(t, { allowAll: !0 })).map((l) => w.relative(t, l)).filter((l) => W(l, e, { dot: !0 })).filter((l) => !i.some((c) => W(l, c, { dot: !0 }))).map((l) => o ? w.join(t, l) : l);
  }
}
function P(n, e) {
  if (typeof n != "string")
    return [];
  const r = e instanceof RegExp ? e : new RegExp(e, "g"), t = [];
  return n.split(`
`).forEach((o, s) => {
    let l;
    const c = new RegExp(r.source, r.flags);
    for (; (l = c.exec(o)) !== null; )
      t.push({
        match: l[0],
        index: l.index,
        line: s + 1,
        lineContent: o
      });
  }), t;
}
function ee(n, e, r) {
  if (typeof n != "string")
    return "";
  const t = e instanceof RegExp ? e : new RegExp(e, "g");
  return n.replace(t, r);
}
function xe(n, e, r) {
  if (typeof n != "string")
    return "";
  const t = e instanceof RegExp ? new RegExp(e.source, e.flags.replace("g", "")) : new RegExp(e);
  return n.replace(t, r);
}
function re(n, e, r, t = "after") {
  if (typeof n != "string" || e < 1)
    return n;
  const i = n.split(`
`), o = e - 1;
  return o < 0 || o > i.length ? n : (t === "before" ? i.splice(o, 0, r) : i.splice(o + 1, 0, r), i.join(`
`));
}
function te(n, e, r = !0) {
  return typeof n != "string" ? e : e ? r && n.length > 0 && !n.endsWith(`
`) ? n + `
` + e : n + e : n;
}
function ne(n, e, r = !0) {
  return typeof n != "string" ? e : e ? n.length === 0 ? e : r && e.length > 0 && !e.endsWith(`
`) ? e + `
` + n : e + n : n;
}
function ie(n, e) {
  if (typeof n != "string")
    return "";
  const r = e instanceof RegExp ? e : new RegExp(e);
  return n.split(`
`).filter((o) => !r.test(o)).join(`
`);
}
function Fe(n, e) {
  if (typeof n != "string")
    return [];
  const r = e instanceof RegExp ? e : new RegExp(e);
  return n.split(`
`).filter((i) => r.test(i));
}
function Oe(n, e, r) {
  if (typeof n != "string" || e < 1)
    return "";
  const t = n.split(`
`), i = e - 1, o = r === -1 ? t.length : r;
  return t.slice(i, o).join(`
`);
}
function oe(n, e, r, t) {
  if (typeof n != "string" || e < 1)
    return n;
  const i = n.split(`
`), o = e - 1, s = r;
  if (o < 0 || o >= i.length)
    return n;
  const l = t.split(`
`);
  return i.splice(o, s - o, ...l), i.join(`
`);
}
function O(n, e, r = {}) {
  const { context: t = 0 } = r, i = n.split(`
`), o = e.split(`
`), s = [], l = Math.max(i.length, o.length);
  for (let u = 0; u < l; u++) {
    const f = i[u] !== void 0 ? i[u] : null, p = o[u] !== void 0 ? o[u] : null;
    f !== p && s.push({
      line: u + 1,
      type: f === null ? "added" : p === null ? "deleted" : "modified",
      oldContent: f,
      newContent: p
    });
  }
  const c = [...s];
  if (t > 0 && s.length > 0) {
    const u = new Set(s.map((p) => p.line - 1)), f = /* @__PURE__ */ new Set();
    for (const p of u) {
      const E = Math.max(0, p - t), x = Math.min(l - 1, p + t);
      for (let m = E; m <= x; m++)
        if (!u.has(m) && !f.has(m)) {
          const D = i[m] !== void 0 ? i[m] : o[m] ?? null;
          c.push({
            line: m + 1,
            type: "context",
            oldContent: D,
            newContent: D
          }), f.add(m);
        }
    }
    c.sort((p, E) => p.line - E.line);
  }
  return {
    totalChanges: s.length,
    linesAdded: s.filter((u) => u.type === "added").length,
    linesDeleted: s.filter((u) => u.type === "deleted").length,
    linesModified: s.filter((u) => u.type === "modified").length,
    changes: c
  };
}
function S(n) {
  if (!n || !n.changes || n.changes.length === 0)
    return "No changes detected.";
  const e = [];
  return e.push(`Total changes: ${n.totalChanges}`), e.push(`  +${n.linesAdded} lines added`), e.push(`  -${n.linesDeleted} lines deleted`), e.push(`  ~${n.linesModified} lines modified`), e.push(""), n.changes.forEach((r) => {
    r.type === "added" ? e.push(`+ Line ${r.line}: ${r.newContent}`) : r.type === "deleted" ? e.push(`- Line ${r.line}: ${r.oldContent}`) : r.type === "modified" ? (e.push(`~ Line ${r.line}:`), e.push(`  - ${r.oldContent}`), e.push(`  + ${r.newContent}`)) : r.type === "context" && e.push(`  Line ${r.line}: ${r.oldContent}`);
  }), e.join(`
`);
}
class Se {
  constructor(e = {}) {
    this.fileOps = e.fileOps ?? new H(e), this.dryRun = e.dryRun ?? !1, this.verbose = e.verbose ?? !1;
  }
  /**
   * Find all matches of a pattern in a file.
   *
   * @param filePath - Absolute path to the file.
   * @param pattern  - Pattern to search for.
   * @returns Array of matches with position information.
   */
  async findInFile(e, r) {
    try {
      const t = await this.fileOps.readFile(e), i = P(t, r);
      return this.verbose && a.info(`Found ${i.length} match(es) in ${e}`), i;
    } catch (t) {
      throw new d(
        `Failed to find in file: ${t.message}`,
        {
          path: e,
          originalError: t
        }
      );
    }
  }
  /**
   * Replace all occurrences of a pattern in a file.
   *
   * @param filePath    - Absolute path to the file.
   * @param pattern     - Pattern to find.
   * @param replacement - Replacement string or function.
   * @returns Object with `changed` flag and `diff`.
   */
  async replaceInFile(e, r, t) {
    try {
      const i = await this.fileOps.readFile(e), o = ee(i, r, t), s = O(i, o);
      return this.dryRun ? (a.info(`[DRY RUN] Would replace in file: ${e}`), this.verbose && a.info(S(s)), { changed: s.totalChanges > 0, diff: s }) : (s.totalChanges > 0 && (await this.fileOps.writeFile(e, o), this.verbose && a.success(
        `Replaced ${s.totalChanges} occurrence(s) in ${e}`
      )), { changed: s.totalChanges > 0, diff: s });
    } catch (i) {
      throw new d(
        `Failed to replace in file: ${i.message}`,
        {
          path: e,
          originalError: i
        }
      );
    }
  }
  /**
   * Insert content at a specific line in a file.
   *
   * @param filePath   - Absolute path to the file.
   * @param lineNumber - Line number (1-based).
   * @param content    - Content to insert.
   * @param position   - `'before'` or `'after'` the target line (default `'after'`).
   */
  async insertAtLine(e, r, t, i = "after") {
    try {
      const o = await this.fileOps.readFile(e), s = re(
        o,
        r,
        t,
        i
      );
      if (this.dryRun) {
        a.info(
          `[DRY RUN] Would insert at line ${r} in ${e}`
        );
        return;
      }
      await this.fileOps.writeFile(e, s), this.verbose && a.success(`Inserted content at line ${r} in ${e}`);
    } catch (o) {
      throw new d(
        `Failed to insert at line: ${o.message}`,
        {
          path: e,
          originalError: o
        }
      );
    }
  }
  /**
   * Append content to a file.
   *
   * @param filePath - Absolute path to the file.
   * @param content  - Content to append.
   */
  async appendToFile(e, r) {
    try {
      const t = await this.fileOps.readFile(e), i = te(t, r);
      if (this.dryRun) {
        a.info(`[DRY RUN] Would append to file: ${e}`);
        return;
      }
      await this.fileOps.writeFile(e, i), this.verbose && a.success(`Appended content to ${e}`);
    } catch (t) {
      throw new d(
        `Failed to append to file: ${t.message}`,
        {
          path: e,
          originalError: t
        }
      );
    }
  }
  /**
   * Prepend content to a file.
   *
   * @param filePath - Absolute path to the file.
   * @param content  - Content to prepend.
   */
  async prependToFile(e, r) {
    try {
      const t = await this.fileOps.readFile(e), i = ne(t, r);
      if (this.dryRun) {
        a.info(`[DRY RUN] Would prepend to file: ${e}`);
        return;
      }
      await this.fileOps.writeFile(e, i), this.verbose && a.success(`Prepended content to ${e}`);
    } catch (t) {
      throw new d(
        `Failed to prepend to file: ${t.message}`,
        {
          path: e,
          originalError: t
        }
      );
    }
  }
  /**
   * Delete lines matching a pattern from a file.
   *
   * @param filePath - Absolute path to the file.
   * @param pattern  - Pattern to match against each line.
   * @returns Object with `deletedLines` count.
   */
  async deleteLines(e, r) {
    try {
      const t = await this.fileOps.readFile(e), i = ie(t, r), o = t.split(`
`).length, s = i.split(`
`).length, l = o - s;
      return this.dryRun ? (a.info(
        `[DRY RUN] Would delete ${l} line(s) from ${e}`
      ), { deletedLines: l }) : (l > 0 && (await this.fileOps.writeFile(e, i), this.verbose && a.success(`Deleted ${l} line(s) from ${e}`)), { deletedLines: l });
    } catch (t) {
      throw new d(
        `Failed to delete lines: ${t.message}`,
        {
          path: e,
          originalError: t
        }
      );
    }
  }
  /**
   * Replace a range of lines in a file.
   *
   * @param filePath    - Absolute path to the file.
   * @param startLine   - Start line (1-based, inclusive).
   * @param endLine     - End line (1-based, inclusive).
   * @param replacement - Replacement text (may contain newlines).
   */
  async replaceLineRange(e, r, t, i) {
    try {
      const o = await this.fileOps.readFile(e), s = oe(
        o,
        r,
        t,
        i
      );
      if (this.dryRun) {
        a.info(
          `[DRY RUN] Would replace lines ${r}-${t} in ${e}`
        );
        return;
      }
      await this.fileOps.writeFile(e, s), this.verbose && a.success(`Replaced lines ${r}-${t} in ${e}`);
    } catch (o) {
      throw new d(
        `Failed to replace line range: ${o.message}`,
        {
          path: e,
          originalError: o
        }
      );
    }
  }
  /**
   * Preview the changes a transform function would make, without writing to disk.
   *
   * @param filePath    - Absolute path to the file.
   * @param transformFn - Function that receives current content and returns new content.
   * @returns Diff, formatted diff string, and `hasChanges` flag.
   */
  async previewChanges(e, r) {
    try {
      const t = await this.fileOps.readFile(e), i = r(t), o = O(t, i), s = S(o);
      return {
        diff: o,
        formatted: s,
        hasChanges: o.totalChanges > 0
      };
    } catch (t) {
      throw new d(
        `Failed to preview changes: ${t.message}`,
        {
          path: e,
          originalError: t
        }
      );
    }
  }
  /**
   * Apply a transformation function to a file.
   *
   * @param filePath    - Absolute path to the file.
   * @param transformFn - Function that receives current content and returns new content.
   * @returns Object with `applied` flag and `diff`.
   */
  async applyTransform(e, r) {
    try {
      const t = await this.fileOps.readFile(e), i = r(t), o = O(t, i);
      return this.dryRun ? (a.info(`[DRY RUN] Would transform file: ${e}`), this.verbose && a.info(S(o)), { applied: !1, diff: o }) : (o.totalChanges > 0 && (await this.fileOps.writeFile(e, i), this.verbose && a.success(`Applied transformation to ${e}`)), { applied: o.totalChanges > 0, diff: o });
    } catch (t) {
      throw new d(
        `Failed to apply transform: ${t.message}`,
        {
          path: e,
          originalError: t
        }
      );
    }
  }
}
export {
  Se as EditOperations,
  N as ExecutionError,
  H as FileOperations,
  d as FileSystemError,
  F as JqExecutionError,
  Re as JqWrapper,
  De as LogLevel,
  We as Logger,
  v as OS,
  y as PackageManager,
  C as ShellError,
  _ as SystemError,
  te as appendText,
  Q as buildFileMetadata,
  Z as buildJqCommand,
  be as calculateRelativePath,
  je as camelCase,
  Le as capitalize,
  ke as chunk,
  Ue as cleanWhitespace,
  Ie as colorize,
  Me as colors,
  R as commandExists,
  b as compareVersions,
  Te as dedupe,
  Je as deepClone,
  _e as deepEqual,
  Ye as deepMerge,
  ie as deleteLines,
  U as detectOS,
  B as detectPackageManager,
  qe as difference,
  ze as escapeRegex,
  A as execute,
  pe as executeStream,
  ge as executeSudo,
  Fe as extractLines,
  L as filterByExtension,
  k as filterByPattern,
  P as findMatches,
  Be as flatten,
  S as formatDiff,
  O as generateDiff,
  Ee as getLatestVersion,
  Oe as getLineRange,
  Ke as getProperty,
  he as getSystemInfo,
  Ve as groupBy,
  Xe as hasProperty,
  re as insertAtLine,
  Ze as intersection,
  Ge as isEmpty,
  ye as isEqual,
  me as isGreaterThan,
  we as isLessThan,
  Qe as kebabCase,
  He as logger,
  Pe as omit,
  V as parseJqArguments,
  j as parseVersion,
  er as partition,
  rr as pascalCase,
  tr as pick,
  ne as prependText,
  ee as replaceAll,
  xe as replaceFirst,
  oe as replaceLineRange,
  nr as sanitize,
  ve as sanitizeArgjsonValue,
  ir as setProperty,
  or as snakeCase,
  sr as sortBy,
  Ce as sortByModificationTime,
  ar as stripAnsi,
  cr as supportsColor,
  lr as truncate,
  X as validateArgjsonPairs,
  $e as validateJson,
  h as validatePath
};
//# sourceMappingURL=index.mjs.map
