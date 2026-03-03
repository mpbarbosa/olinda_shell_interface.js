# olinda_shell_interface.js

Public JavaScript library to interface Linux shell commands, delivered via
**jsDelivr CDN from GitHub**.

## Scripts

### `cdn-delivery.sh`

Generates all jsDelivr CDN URL variants for the current package version and
saves them to `cdn-urls.txt`. Also tests CDN availability with `curl`.

Run via npm (builds first):

```bash
npm run cdn   # npm run build && bash cdn-delivery.sh
```

Or directly (requires a prior build):

```bash
bash cdn-delivery.sh
```

**Prerequisites:** Node.js (reads `package.json`), Git (reads HEAD commit and branch).

**Output:** Prints URL variants to stdout and writes `cdn-urls.txt`.

---

### `scripts/deploy.sh`

Full deployment pipeline: build TypeScript → commit `dist/` artifacts → create
version tag → push to GitHub → generate CDN URLs.

```bash
bash scripts/deploy.sh
```

**Steps executed:**

1. `npm run build` — compile TypeScript
2. `git add dist/` — stage compiled output
3. `git commit` — commit artifacts
4. `git tag v{version}` — version tag (skipped if tag already exists)
5. `git push --tags` — push to GitHub (jsDelivr picks up the tag)
6. `npm run cdn` — generate `cdn-urls.txt`

**Prerequisites:** Node.js, Git, write access to the remote repository.

**Exit codes:** `0` success; non-zero on build failure, git error, or missing version.

---

### `scripts/colors.sh`

Shared ANSI colour definitions sourced by other shell scripts. Not intended to
be executed directly.

**Usage in other scripts:**

```bash
source "$(dirname "${BASH_SOURCE[0]}")/colors.sh"
echo -e "${GREEN}Success${NC}"
```

**Exported variables:** `RED`, `GREEN`, `YELLOW`, `BLUE`, `NC` (reset).
