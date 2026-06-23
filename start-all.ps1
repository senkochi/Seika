# Seika Microservices Orchestration Startup Pipeline
# This script starts all backend microservices in the correct order:
# Docker DBs -> Eureka -> Config Service -> API Gateway & Business Services
 
# Set JAVA_HOME to JDK 25 for maven wrapper compatibility
$env:JAVA_HOME = "C:\Program Files\Java\jdk-25"
 
# Port Check Function
function Wait-ForPort {
    param (
        [string]$HostName = "localhost",
        [int]$Port,
        [int]$TimeoutSeconds = 60
    )
    Write-Host "Waiting for ${HostName}:${Port} to be active..." -ForegroundColor Cyan
    $start = Get-Date
    while ($true) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $connection = $tcp.ConnectAsync($HostName, $Port)
            Start-Sleep -Milliseconds 500
            if ($tcp.Connected) {
                $tcp.Close()
                Write-Host "✅ Port $Port is active!" -ForegroundColor Green
                return $true
            }
        } catch {
            # Ignore connection errors
        }
        if (((Get-Date) - $start).TotalSeconds -ge $TimeoutSeconds) {
            Write-Warning "❌ Timeout waiting for ${HostName}:${Port}"
            return $false
        }
        Start-Sleep -Seconds 1
    }
}
 
# Clear console and print header
Clear-Host
Write-Host "==========================================" -ForegroundColor Green
Write-Host "   Starting Seika Microservices Pipeline   " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
 
# 1. Start MongoDB via Docker Compose
Write-Host "`n[1/4] Starting local database containers..." -ForegroundColor Yellow
docker-compose up -d
 
# 2. Start Eureka Server (Service Discovery)
Write-Host "`n[2/4] Starting Service Discovery (Eureka Server)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src/eureka; `$env:JAVA_HOME='C:\Program Files\Java\jdk-25'; ./mvnw spring-boot:run"
if (-not (Wait-ForPort -Port 8761 -TimeoutSeconds 90)) {
    Write-Error "❌ Service Discovery (Eureka) failed to start. Aborting startup."
    exit 1
}
 
# 3. Start Spring Cloud Config Service
Write-Host "`n[3/4] Starting Spring Cloud Config Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src/config-service; `$env:JAVA_HOME='C:\Program Files\Java\jdk-25'; ./mvnw spring-boot:run"
if (-not (Wait-ForPort -Port 8888 -TimeoutSeconds 90)) {
    Write-Error "❌ Config Service failed to start. Aborting startup."
    exit 1
}
 
# 4. Start API Gateway and business microservices in parallel
Write-Host "`n[4/4] Starting API Gateway and business microservices in parallel..." -ForegroundColor Yellow
 
# API Gateway (Port 8080)
Write-Host "-> Launching API Gateway..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src/api-gateway; `$env:JAVA_HOME='C:\Program Files\Java\jdk-25'; ./mvnw spring-boot:run"
 
# Identity Service (Port 8081)
Write-Host "-> Launching Identity Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src/services/identity-service; `$env:JAVA_HOME='C:\Program Files\Java\jdk-25'; ./mvnw spring-boot:run"
 
# Profile Service (Port 8082)
Write-Host "-> Launching Profile Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src/services/profile-service; `$env:JAVA_HOME='C:\Program Files\Java\jdk-25'; ./mvnw spring-boot:run"
 
# Notification Service (Port 8083)
Write-Host "-> Launching Notification Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src/services/notification-service; `$env:JAVA_HOME='C:\Program Files\Java\jdk-25'; ./mvnw spring-boot:run"
 
# Wallet Service (Port 8084)
Write-Host "-> Launching Wallet Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src/services/wallet-service; `$env:JAVA_HOME='C:\Program Files\Java\jdk-25'; ./mvnw spring-boot:run"
 
# Flashcard Service (Port 8085)
Write-Host "-> Launching Flashcard Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src/services/flashcard_service; `$env:JAVA_HOME='C:\Program Files\Java\jdk-25'; ./mvnw spring-boot:run"
 
# Quiz Service (Port 8086 - overridden to prevent conflict with API Gateway)
Write-Host "-> Launching Quiz Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src/services/quiz-service; `$env:JAVA_HOME='C:\Program Files\Java\jdk-25'; ./mvnw spring-boot:run -Dspring-boot.run.arguments='--server.port=8086'"
 
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   Pipeline complete! All service windows launched.       " -ForegroundColor Green
Write-Host "   Check registration at: http://localhost:8761/         " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
