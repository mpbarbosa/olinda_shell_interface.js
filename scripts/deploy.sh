#!/usr/bin/env bash
# ==============================================================================
# Deploy Script for olinda_shell_interface.js
# ==============================================================================
# Builds the TypeScript source, commits the compiled artifacts, creates a
# version tag, pushes to GitHub, and generates jsDelivr CDN URLs.
#
# Usage:
#   bash scripts/deploy.sh
#   ai-workflow deploy          # via ai_workflow.js deploy command
# ==============================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
# shellcheck source=scripts/colors.sh
source "$(dirname "${BASH_SOURCE[0]}")/colors.sh"

info()    { echo -e "${BLUE}ℹ  $*${NC}"; }
success() { echo -e "${GREEN}✓  $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $*${NC}"; }
error()   { echo -e "${RED}✗  $*${NC}" >&2; }

# ── Resolve project root ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

# ── Read version from package.json ────────────────────────────────────────────
PACKAGE_VERSION="$(node -p "require('./package.json').version")"
TAG="v${PACKAGE_VERSION}"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  olinda_shell_interface.js  ·  Deploy to CDN   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""
info "Project root : ${PROJECT_ROOT}"
info "Version      : ${PACKAGE_VERSION}"
info "Git tag      : ${TAG}"
echo ""

# ── 1. Build ──────────────────────────────────────────────────────────────────
info "Step 1/4 — Building TypeScript …"
npm run build
npm run build:vite
success "Build complete"
echo ""

# ── 2. Commit build artifacts ─────────────────────────────────────────────────
info "Step 2/4 — Committing build artifacts …"

git add dist/ cdn-delivery.sh 2>/dev/null || true

if git diff --cached --quiet; then
  warn "Nothing to commit — build artifacts are up to date"
else
  git commit -m "chore: build artifacts for ${TAG}

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
  success "Committed build artifacts"
fi
echo ""

# ── 3. Tag & push ─────────────────────────────────────────────────────────────
info "Step 3/4 — Tagging and pushing …"

CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "${CURRENT_BRANCH}" ]]; then
  error "Could not determine current git branch (detached HEAD?)"
  exit 1
fi

git pull --rebase origin "${CURRENT_BRANCH}"

if git rev-parse "${TAG}" >/dev/null 2>&1; then
  warn "Tag ${TAG} already exists — skipping tag creation"
else
  git tag "${TAG}"
  success "Created tag ${TAG}"
fi

git push origin "${CURRENT_BRANCH}" --tags
success "Pushed to origin/${CURRENT_BRANCH}"
echo ""

# ── 4. Generate CDN URLs ──────────────────────────────────────────────────────
info "Step 4/4 — Generating jsDelivr CDN URLs …"
npm run cdn
success "CDN URL list generated"
echo ""

success "Deployment of ${TAG} complete! 🚀"
echo ""
