# Creates SAKHI_VANI_COMPLETE_PROJECT.zip next to the project folder, excluding node_modules, builds and secrets.
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path (Split-Path -Parent $root) 'SAKHI_VANI_COMPLETE_PROJECT.zip'
$staging = Join-Path $env:TEMP ('sakhi-vani-' + [guid]::NewGuid())
robocopy $root (Join-Path $staging 'sakhi-vani') /E /XD node_modules dist build .expo data /XF .env *.zip *.log | Out-Null
Compress-Archive -Path (Join-Path $staging 'sakhi-vani') -DestinationPath $out -Force
Remove-Item -Recurse -Force $staging
Write-Host "Created $out"
