# Project Context

Machine-readable metadata for AI workflow tools. Constrains analysis to the actual runtime.

## Runtime

- **Environment**: Node.js (server-side only)
- **Minimum version**: Node.js ≥ 18
- **No browser runtime**: no DOM, no `window`, no `fetch`, no CORS surface area
- **No HTTP client**: all I/O is local shell commands or local file system operations

## Async Surface Area

- `child_process.exec` / `child_process.spawn` (via `util.promisify`)
- `fs/promises` (file system reads/writes)
- No network requests, no WebSockets, no SSE, no XHR

## Inapplicable Analysis Areas

The following concerns do **not** apply to this project and should be skipped in automated
analysis:

- CORS (Cross-Origin Resource Sharing) — browser-only mechanism
- Network retry / fallback proxy logic — no network calls exist
- "Failed to fetch" / HTTP timeout handling — no HTTP client
- Browser event loop / `requestAnimationFrame` / Web Workers

## Applicable Analysis Areas

- `child_process` error handling and signal propagation
- Shell injection via unescaped user input in command strings
- File system race conditions and path traversal
- `async/await` error propagation in `fs/promises` chains
- Process timeout and resource cleanup
