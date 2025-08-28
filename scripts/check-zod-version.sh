# scripts/check-zod-version.sh
set -euo pipefail

# 1) Enforce zod major version = 4
node -e 'const p=require("./package.json"); const v=p.dependencies?.zod||p.devDependencies?.zod||""; if(!/^\\^?4\\./.test(v)) { console.error(`❌ zod major must be 4.x, found "${v}"`); process.exit(1); }'

# 2) Forbid v3-only artifacts (adjust as needed), skip tests
GREP_PATHS=$(git ls-files 'src/**/*.ts' 'scripts/**/*.ts' | tr '\n' ' ')
FAIL=0

# Example: disallow deep imports or legacy names
grep -RInE 'from\\s+\"zod/(lib|esm)\"' $GREP_PATHS && { echo "❌ deep zod import"; FAIL=1; } || true
grep -RInE '\\bZodSchema\\b' $GREP_PATHS && { echo "❌ ZodSchema type usage (prefer ZodType)"; FAIL=1; } || true

# Exit status
if [ $FAIL -ne 0 ]; then exit 1; fi
echo "✅ Zod v4 checks OK"
