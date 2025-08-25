# -------------------------------------------------------------------
# Export-Project.ps1
# Creates a single UTF-8 dump of project files + contents
# Scope:
#   - Root-level files (non-recursive) — includes common configs (tsconfig, vitest, eslint, prettier, etc.)
#   - ./src (recursive)
# Features:
#   - Table of Contents (ASCII tree) of included files (relative to repo root)
#   - Relative paths in file headers
#   - Size cap per file to keep dump small
# Excludes:
#   - node_modules, dist, .git, coverage, .angular, out, build, tmp, .cache
#   - lock files (package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb)
#   - .env* (to avoid secrets)
# -------------------------------------------------------------------

#--- Example usage: ---
# .\Export-Project.ps1 -OutputFile "project-dump-$(Get-Date -Format yyyyMMdd-HHmm).txt"
#----------------------

param(
  [string]$OutputFile = "project-dump.txt",
  [int]$MaxFileSizeMB = 2
)

# Set console/output encoding *after* param
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'

# Determine this script's own path & name
$SelfPath = if ($PSCommandPath) { $PSCommandPath } else { $MyInvocation.MyCommand.Path }
$SelfName = [System.IO.Path]::GetFileName($SelfPath)

# ---- Configuration ----
# Include source/docs/config extensions
$IncludeExtensions = @(
  "*.ts","*.tsx","*.js","*.mjs","*.cjs",
  "*.json","*.md","*.html","*.scss","*.css",
  "*.yml","*.yaml",".editorconfig",".gitignore",".gitattributes"
)

# Include important root config files by name (even if extensionless)
$IncludeRootConfigNames = @(
  "package.json",
  "tsconfig.json","tsconfig.base.json","tsconfig.build.json","tsconfig.app.json","tsconfig.spec.json",
  "vitest.config.ts","vitest.config.mts","vitest.workspace.ts",
  ".eslintrc","eslintrc","eslintrc.json",".eslintrc.json",".eslintrc.cjs",".eslintrc.js","eslint.config.mjs",
  ".prettierrc",".prettierrc.json",".prettierrc.yaml",".prettierrc.yml",".prettierrc.js","prettier.config.js","prettier.config.cjs",
  ".npmrc",".nvmrc",".editorconfig",".gitignore",".gitattributes",
  "README.md","LICENSE","LICENSE.md","CONTRIBUTING.md","TESTING.md"
)

# Also ensure this running script is included at root
if (-not ($IncludeRootConfigNames -contains $SelfName)) {
  $IncludeRootConfigNames += $SelfName
}

# Skip these by filename (noise/locks)
$ExcludeNames = @("package-lock.json","yarn.lock","pnpm-lock.yaml","bun.lockb",".DS_Store")
# Also exclude the current output file name (so we don't ingest our own dump)
$ExcludeNames += [System.IO.Path]::GetFileName($OutputFile)

# Skip sensitive files by regex (e.g., .env, .env.local)
$SensitiveNameRegex = '^(?:\.env(?:\..*)?)$'

# Skip paths that match these segments
$ExcludePathRegex = "\\(node_modules|dist|\.git|coverage|.angular|out|build|tmp|.cache)\\"

# ---- Prep ----
if (Test-Path $OutputFile) { Remove-Item $OutputFile -Force }
$MaxBytes = $MaxFileSizeMB * 1MB
$files = New-Object System.Collections.Generic.List[System.IO.FileInfo]

function Is-ExcludedPath([string]$fullPath) {
  return ($fullPath -match $ExcludePathRegex)
}

function Should-Include([System.IO.FileInfo]$f, [bool]$isRoot) {
  if (Is-ExcludedPath $f.FullName) { return $false }
  if ($ExcludeNames -contains $f.Name) { return $false }
  if ($f.Name -match $SensitiveNameRegex) { return $false }
  if ($f.Length -gt $MaxBytes) { return $false }

  if ($isRoot) {
    # Root: include by extension OR explicit config name allowlist
    $byExt = $IncludeExtensions | ForEach-Object { $_ } | Where-Object { $f.Name -like $_ }
    if ($byExt) { return $true }
    if ($IncludeRootConfigNames -contains $f.Name) { return $true }
    return $false
  } else {
    # In src/: only by extension
    $byExt = $IncludeExtensions | ForEach-Object { $_ } | Where-Object { $f.Name -like $_ }
    return [bool]$byExt
  }
}

# ---- Collect files ----
# 1) Root (non-recursive)
Get-ChildItem -Path . -File -Force |
  Where-Object { Should-Include $_ $true } |
  ForEach-Object { [void]$files.Add($_) }

# 2) ./src (recursive)
if (Test-Path "./src") {
  Get-ChildItem -Path "./src" -Recurse -File -Force |
    Where-Object { Should-Include $_ $false } |
    ForEach-Object { [void]$files.Add($_) }
}

# 3) Ensure this script itself is included
if (Test-Path -LiteralPath $SelfPath) {
  $selfFi = Get-Item -LiteralPath $SelfPath -ErrorAction SilentlyContinue
  if ($selfFi -and (Should-Include $selfFi $true)) {
    [void]$files.Add($selfFi)
  }
}

# Deduplicate & sort by relative path
$repoRoot = (Get-Location).Path
function To-Rel([string]$fullPath) {
  ((Resolve-Path -LiteralPath $fullPath).Path).Replace($repoRoot, "").TrimStart("\","/") -replace "\\","/"
}
$relPaths = $files | Select-Object -ExpandProperty FullName | ForEach-Object { To-Rel $_ } | Sort-Object -Unique

# ---- Build Table of Contents (ASCII tree) ----
class TreeNode {
  [string]$Name
  [bool]$IsFile = $false
  [hashtable]$Children = @{}
  TreeNode([string]$name) { $this.Name = $name }
}
function Add-PathToTree([TreeNode]$root, [string]$relPath) {
  $parts = $relPath -split '/'
  $node = $root
  for ($i=0; $i -lt $parts.Length; $i++) {
    $p = $parts[$i]
    if (-not $node.Children.ContainsKey($p)) {
      $node.Children[$p] = [TreeNode]::new($p)
    }
    $node = $node.Children[$p]
    if ($i -eq $parts.Length - 1) { $node.IsFile = $true }
  }
}
function Render-Tree([TreeNode]$node, [string]$prefix = "") {
  $keys = $node.Children.Keys | Sort-Object
  $count = $keys.Count
  $i = 0
  foreach ($k in $keys) {
    $i++
    $child = $node.Children[$k]
    $isLast = ($i -eq $count)
    $branch = if ($prefix -eq "") { "" } else { $prefix }
    $connector = if ($isLast) { "+-- " } else { "|-- " }
    "$branch$connector$($child.Name)" | Out-File -FilePath $OutputFile -Append -Encoding utf8
    $nextPrefix = if ($isLast) { "$prefix    " } else { "$prefix|   " }
    if ($child.Children.Count -gt 0) {
      Render-Tree -node $child -prefix $nextPrefix
    }
  }
}

# Build tree
$rootNode = [TreeNode]::new("")
foreach ($rp in $relPaths) { Add-PathToTree -root $rootNode -relPath $rp }

# ---- Write Header + TOC ----
"# Project dump for: $repoRoot" | Out-File -FilePath $OutputFile -Encoding utf8
"Generated at: $(Get-Date -Format s)"    | Out-File -FilePath $OutputFile -Append -Encoding utf8
"`r`n===== TABLE OF CONTENTS ====="       | Out-File -FilePath $OutputFile -Append -Encoding utf8
Render-Tree -node $rootNode
"`r`n"                                     | Out-File -FilePath $OutputFile -Append -Encoding utf8

# ---- Emit file contents ----
$filesAdded = 0
$totalBytes = 0

function Add-FileDump([string]$relPath) {
  "===== FILE: $relPath =====`r`n" | Out-File -FilePath $OutputFile -Append -Encoding utf8
  $abs = Join-Path -Path $repoRoot -ChildPath $relPath
  try {
    Get-Content -LiteralPath $abs -Raw -ErrorAction Stop | Out-File -FilePath $OutputFile -Append -Encoding utf8
  } catch {
    # Fallback: line-by-line if -Raw fails for any reason
    Get-Content -LiteralPath $abs -ErrorAction SilentlyContinue | Out-File -FilePath $OutputFile -Append -Encoding utf8
  }
  "`r`n" | Out-File -FilePath $OutputFile -Append -Encoding utf8
}

foreach ($rp in $relPaths) {
  $abs = Join-Path -Path $repoRoot -ChildPath $rp
  $fi = Get-Item -LiteralPath $abs -ErrorAction SilentlyContinue
  if (-not $fi) { continue }
  Add-FileDump $rp
  $filesAdded++
  $totalBytes += $fi.Length
}

# ---- Summary ----
"===== SUMMARY ====="                         | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Files included: $filesAdded"                 | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Total raw bytes: $totalBytes"                | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Max file size per file: ${MaxFileSizeMB}MB"  | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Paths excluded regex: $ExcludePathRegex"     | Out-File -FilePath $OutputFile -Append -Encoding utf8
"Lock files excluded: $($ExcludeNames -join ', ')" | Out-File -FilePath $OutputFile -Append -Encoding utf8

Write-Host "✅ Project dump created: $OutputFile (files: $filesAdded, max per-file: ${MaxFileSizeMB}MB)"
