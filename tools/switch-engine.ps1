# dsh-free-search engine switcher
# Usage: right-click "Run with PowerShell", or double-click it (check your execution policy first)

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("ddg", "ddg-lite", "bing", "mojeek", "exa", "perplexity", "deepseek-official")]
    [string]$Engine
)

$patchFile = "$env:USERPROFILE\.dsh\profiles\web\cordis.patch.yml"
if (-not (Test-Path $patchFile)) {
    Write-Host "ERROR: config file not found: $patchFile" -ForegroundColor Red
    exit 1
}

# Read the file (UTF-8)
$content = Get-Content $patchFile -Raw -Encoding UTF8

# Replace the searchProvider line (supports the "- id: web / config: / searchProvider: xxx" structure)
if ($content -match '(?m)^(\s*- id: web\r?\n\s*config:\r?\n\s*searchProvider: )[^\r\n]*') {
    $content = $content -replace '(?m)^(\s*- id: web\r?\n\s*config:\r?\n\s*searchProvider: )[^\r\n]*', "`${1}$Engine"
    Write-Host "Search engine switched: $Engine" -ForegroundColor Green
} else {
    # No web entry found: append one
    $append = @"

# ============================================================
# search engine provider (written by the dsh-free-search switcher)
# ============================================================
- id: web
  config:
    searchProvider: $Engine
"@
    $content += $append
    Write-Host "Search engine config appended: $Engine" -ForegroundColor Green
}

# Write back (UTF-8 without BOM)
[System.IO.File]::WriteAllText($patchFile, $content, (New-Object System.Text.UTF8Encoding $false))

Write-Host ""
Write-Host "Configuration updated. Restart dsh web to apply:" -ForegroundColor Yellow
Write-Host "  1. Close the current dsh web window"
Write-Host "  2. Run: dsh web"
Write-Host ""
