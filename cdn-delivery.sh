#!/usr/bin/env bash
# ==============================================================================
# jsDelivr CDN Delivery Script for olinda_shell_interface.js
# ==============================================================================
# Generates jsDelivr CDN URLs for delivering olinda_shell_interface.js from
# GitHub. Reference: https://www.jsdelivr.com/?docs=gh
# ==============================================================================

set -euo pipefail

# shellcheck source=scripts/colors.sh
source "$(dirname "${BASH_SOURCE[0]}")/scripts/colors.sh"

GITHUB_USER="mpbarbosa"
GITHUB_REPO="olinda_shell_interface.js"
PACKAGE_VERSION=$(node -p "require('./package.json').version")
[[ -n "${PACKAGE_VERSION}" ]] || { echo "Error: could not determine package version from package.json" >&2; exit 1; }
MAIN_FILE="dist/src/index.js"

section() { echo -e "${YELLOW}${1}${NC}"; echo ""; }

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    jsDelivr CDN URLs for olinda_shell_interface.js         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Repository:${NC} ${GITHUB_USER}/${GITHUB_REPO}"
echo -e "${GREEN}Version:${NC} ${PACKAGE_VERSION}"
echo ""

# ==============================================================================
# 1. Load specific version
# ==============================================================================
section "📦 Version-Specific URLs:"
echo "Load a specific version (recommended for production):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}"
echo ""
echo "Load entire dist/src directory (specific version):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/dist/src/"
echo ""

# ==============================================================================
# 2. Load from specific commit
# ==============================================================================
LATEST_COMMIT=$(git rev-parse HEAD)
[[ -n "${LATEST_COMMIT}" ]] || { echo "Error: could not determine current git commit" >&2; exit 1; }
section "🔖 Commit-Specific URL:"
echo "Load from specific commit (${LATEST_COMMIT:0:7}):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${LATEST_COMMIT}/${MAIN_FILE}"
echo ""

# ==============================================================================
# 3. Load latest from branch
# ==============================================================================
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
[[ -n "${CURRENT_BRANCH}" ]] || { echo "Error: could not determine current git branch" >&2; exit 1; }
section "🌿 Branch URLs:"
echo "Load latest from ${CURRENT_BRANCH} branch (auto-updates):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${CURRENT_BRANCH}/${MAIN_FILE}"
echo ""
echo "Load latest from main branch (if main exists):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@main/${MAIN_FILE}"
echo ""

# ==============================================================================
# 4. Load with version ranges
# ==============================================================================
section "🎯 Version Range URLs (SemVer):"
echo "Load latest v0.1.x (patch updates):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@0.1/${MAIN_FILE}"
echo ""
echo "Load latest v0.x.x (minor updates):"
echo "https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@0/${MAIN_FILE}"
echo ""

# ==============================================================================
# 5. HTML Usage Examples
# ==============================================================================
section "🌐 HTML Usage Examples:"
echo "<!-- Load specific version -->"
echo "<script src=\"https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}\"></script>"
echo ""
echo "<!-- ES Module import -->"
echo "<script type=\"module\">"
echo "  import { execute, ExecutionError } from 'https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}';"
echo "</script>"
echo ""

# ==============================================================================
# 6. Save URLs to file
# ==============================================================================
OUTPUT_FILE="cdn-urls.txt"
echo -e "${GREEN}💾 Saving URLs to ${OUTPUT_FILE}...${NC}"

cat > "${OUTPUT_FILE}" << EOF
jsDelivr CDN URLs for ${GITHUB_USER}/${GITHUB_REPO} v${PACKAGE_VERSION}
Generated: $(date)
=============================================================================

PRODUCTION (Recommended - Specific Version):
https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}

DEVELOPMENT (Latest from branch):
https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${CURRENT_BRANCH}/${MAIN_FILE}

VERSION RANGE (Auto-update patches):
https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@0.1/${MAIN_FILE}

HTML USAGE:
<script src="https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}"></script>

ES MODULE:
<script type="module">
  import { execute, ExecutionError } from 'https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/${MAIN_FILE}';
</script>

PACKAGE INFO API:
https://data.jsdelivr.com/v1/package/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}

=============================================================================
EOF

echo ""
echo -e "${GREEN}✅ URLs saved to ${OUTPUT_FILE}${NC}"
echo ""

# ==============================================================================
# 7. Test CDN availability
# ==============================================================================
if command -v curl &> /dev/null; then
    echo -e "${YELLOW}🧪 Testing CDN availability...${NC}"
    TEST_URL="https://cdn.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${PACKAGE_VERSION}/package.json"

    if curl -s -f -o /dev/null "$TEST_URL"; then
        echo -e "${GREEN}✅ CDN is serving your package!${NC}"
        echo -e "   Test URL: ${TEST_URL}"
    else
        echo -e "${RED}⚠️  Package not yet available on CDN${NC}"
        echo -e "   Make sure you have:"
        echo -e "   1. Pushed your code to GitHub"
        echo -e "   2. Created a git tag: git tag v${PACKAGE_VERSION}"
        echo -e "   3. Pushed the tag: git push origin v${PACKAGE_VERSION}"
        echo -e ""
        echo -e "   Or wait a few minutes for jsDelivr to sync from GitHub"
    fi
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  For more information visit: https://www.jsdelivr.com/    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
