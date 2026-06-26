$configDir = "f:/Microservices Projects/Seika/src/config-service/src/main/resources/configs"
Get-ChildItem -Path $configDir -Filter "*.yaml" | ForEach-Object {
    $content = Get-Content -Path $_.FullName -Raw
    if ($content -match 'include: "health,info"') {
        Write-Host "Updating $($_.Name)"
        $content = $content -replace 'include: "health,info"', 'include: "health,info,prometheus"'
        
        $tracingConfig = @"

management:
  tracing:
    sampling:
      probability: 1.0

logging:
  pattern:
    level: '%5p [`${spring.application.name:},%X{traceId:-},%X{spanId:-}]'
"@
        if ($content -notmatch 'tracing:') {
            $content += $tracingConfig
        }
        Set-Content -Path $_.FullName -Value $content -NoNewline
    }
}
