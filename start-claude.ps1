@"
`$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
`$env:PLAYWRIGHT_BROWSER_EXECUTABLE_PATH='C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe'
npx @anthropic-ai/claude-code
"@ | Out-File -FilePath "start-claude.ps1" -Encoding UTF8