<#
  Minimal static web server for previewing the portfolio locally.

  Why this exists: opening index.html straight from the folder runs the page
  on file://, where browsers block fetch(). The portfolio itself survives
  that, but the game builds bundled in games/ do not - their loaders fetch a
  manifest and die. Serving over http makes local previews behave exactly
  like the deployed site.

  No Node, no Python - just Windows PowerShell.
#>
param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot),
  [int]$Port = 8080
)

$mime = @{
  ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"
  ".js"="text/javascript; charset=utf-8"; ".mjs"="text/javascript; charset=utf-8"
  ".json"="application/json"; ".wasm"="application/wasm"
  ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"
  ".gif"="image/gif"; ".webp"="image/webp"; ".svg"="image/svg+xml"; ".ico"="image/x-icon"
  ".pdf"="application/pdf"; ".txt"="text/plain; charset=utf-8"
  ".woff"="font/woff"; ".woff2"="font/woff2"; ".ttf"="font/ttf"; ".otf"="font/otf"
  ".mp3"="audio/mpeg"; ".ogg"="audio/ogg"; ".wav"="audio/wav"; ".m4a"="audio/mp4"
  ".mp4"="video/mp4"; ".bin"="application/octet-stream"
  ".webmanifest"="application/manifest+json"
}

$listener = $null
$bound = $false
foreach ($try in $Port..($Port + 9)) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$try/")
    $l.Start()
    $listener = $l; $Port = $try; $bound = $true
    break
  } catch { }
}

if (-not $bound) {
  Write-Host ""
  Write-Host "  Could not open a port between $Port and $($Port + 9)." -ForegroundColor Red
  Write-Host "  Close whatever is using them, or run:  .\tools\serve.ps1 -Port 9100"
  Write-Host ""
  Read-Host "  Press Enter to close"
  exit 1
}

$url = "http://localhost:$Port/"
Write-Host ""
Write-Host "  Portfolio running at " -NoNewline
Write-Host $url -ForegroundColor Cyan
Write-Host "  Serving $Root"
Write-Host "  Leave this window open. Close it to stop the server."
Write-Host ""

# Open the browser only now that the port is actually accepting connections,
# otherwise it races the listener and lands on "connection refused".
Start-Process $url | Out-Null

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $rel = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "index.html" }

    $path = Join-Path $Root $rel
    # keep requests inside the site root
    $full = [System.IO.Path]::GetFullPath($path)
    $rootFull = [System.IO.Path]::GetFullPath($Root)
    if (-not $full.StartsWith($rootFull)) { $ctx.Response.StatusCode = 403; $ctx.Response.Close(); continue }
    if (Test-Path $full -PathType Container) { $full = Join-Path $full "index.html" }

    if (Test-Path $full -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $ct = $mime[$ext]; if (-not $ct) { $ct = "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ctx.Response.ContentType = $ct
      $ctx.Response.Headers.Add("Cache-Control", "no-store")
      if ($ctx.Request.HttpMethod -ne "HEAD") {
        $ctx.Response.ContentLength64 = $bytes.Length
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } else {
      $ctx.Response.StatusCode = 404
      $b = [System.Text.Encoding]::UTF8.GetBytes("404 not found: $rel")
      $ctx.Response.OutputStream.Write($b, 0, $b.Length)
    }
    $ctx.Response.Close()
  } catch { }
}
