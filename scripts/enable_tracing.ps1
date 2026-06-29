$ErrorActionPreference = 'Stop'

# Directory containing the YAML configuration files for each micro‑service
$configDir = Join-Path -Path (Resolve-Path '.') -ChildPath 'src\config-service\src\main\resources\configs'

Get-ChildItem -Path $configDir -Filter *.yaml | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content -Path $file -Raw

    # 1. Ensure spring.application.name exists (use file base name as service name)
    if ($content -match '(?m)^spring:\s*$') {
        if ($content -notmatch '(?m)^\s*application:\s*$') {
            $content = $content -replace '(?m)^(spring:\s*$)', "`$1  application:`n    name: $($_.BaseName)"
        }
    }

    # 2. Ensure management.tracing.enabled: true exists
    if ($content -match '(?m)^management:\s*$') {
        if ($content -notmatch '(?m)^\s*tracing:\s*$') {
            $content = $content -replace '(?m)^(management:\s*$)', "`$1  tracing:`n    enabled: true"
        } else {
            # tracing block exists, make sure enabled is true
            $content = $content -replace '(?m)^(\s*tracing:\s*$\s*\s*enabled:\s*)(false|true)', "`$1true"
        }
    }

    # 3. Add "trace" to actuator endpoints exposure list
    $exposurePattern = '(?m)(include:\s*"[^"]*)"'
    if ($content -match $exposurePattern) {
        $new = $content -replace $exposurePattern, "`$1,trace""
        $content = $new
    }

    # 4. Ensure OTLP tracing endpoint is set to Tempo gRPC address
    if ($content -notmatch '(?m)^\s*otlp:\s*$') {
        # Insert OTLP block under management if missing
        $content = $content -replace '(?m)^(management:\s*$)', "`$1  otlp:`n    tracing:`n      endpoint: \"http://tempo:4317\""
    } else {
        # Replace existing endpoint value
        $content = $content -replace '(?m)(endpoint:\s*)"[^"]+"', '`$1"http://tempo:4317"'
    }

    # 5. Ensure W3C propagation (required for trace context propagation)
    if ($content -notmatch '(?m)^\s*propagation:\s*$') {
        $content = $content -replace '(?m)^(management:\s*$)', "`$1  propagation:`n    type: w3c"
    }

    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "Updated $file"
}
