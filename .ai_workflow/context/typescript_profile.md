# TypeScript Codebase Profile — olinda_shell_interface.js

Verified facts about this codebase. The AI workflow TypeScript reviewer must treat
every item in this document as authoritative ground truth and **must NOT flag any of
these items as issues**.

## Compiler Configuration (tsconfig.json — verified)

- `"strict": true` — full strict mode is enabled
- `"noUnusedLocals": true` — no unused local variables allowed
- `"noUnusedParameters": true` — no unused parameters allowed
- `"target": "ES2020"` — compilation target is ES2020
- `"module": "commonjs"` — CJS output for Node.js compatibility
- A separate `tsconfig.esm.json` produces ESM output to `dist/esm/`

## Type Import Syntax (verified)

- Inline `type` modifier is the intentional pattern for type-only imports.
  Example: `import { exec, spawn, type ExecException } from "child_process";`
- `export type { ... }` is used in `src/index.ts` for all re-exported type symbols.
- These patterns are correct TypeScript 4.5+ syntax — do NOT flag as missing `import type`.

## Runtime Environment (verified)

- This is a **Node.js-only** library for Linux shell command execution.
- There is **no browser runtime**, no DOM, no `window`, no `fetch`, no CORS.
- Runtime validation uses custom `*Error` subclass constructors (not Zod or io-ts).
  Zod/io-ts are inapplicable for this library — do NOT recommend adding them.
- Input contracts are enforced by constructors throwing typed errors; this is the
  intentional validation pattern for a shell interface library.

## Error Handling Pattern (verified)

- All custom errors extend `Error` with `Object.setPrototypeOf(this, new.target.prototype)`
  and `this.name = 'ClassName'` — this is correct and intentional.
- `catch` blocks use `unknown` type (`catch (err: unknown)`) — no `any` in catch clauses.
- Error message format: `"ClassName: human-readable description"` — intentional.

## Code Quality (verified)

- No `any` type annotations in production source (only in tests where unavoidable).
- No `@ts-ignore` or `@ts-nocheck` directives.
- All exported functions have explicit return type annotations.
- All catch blocks use `unknown` and narrow with `instanceof`.
