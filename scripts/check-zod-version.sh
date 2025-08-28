set -euo pipefail
grep -RInE "zod@?3|zod v3|ZodSchema<|refine\(|nonempty\(|object\(\)\.strict\(false\)" src || true
# tune the patterns with real offenders as observed in the repo