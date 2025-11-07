# Script para iniciar ngrok automaticamente
# Se ejecuta antes de levantar docker-compose

Write-Host "Iniciando ngrok para CONEXIA Backend..." -ForegroundColor Cyan
Write-Host ""

# Verificar si ngrok esta instalado
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: ngrok no esta instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instalalo con Chocolatey:" -ForegroundColor Yellow
    Write-Host "   choco install ngrok -y" -ForegroundColor White
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "OK: ngrok esta instalado" -ForegroundColor Green
Write-Host ""
Write-Host "Iniciando tunel ngrok en puerto 8080..." -ForegroundColor Green
Write-Host ""
Write-Host "INSTRUCCIONES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copia la URL Forwarding que aparecera abajo" -ForegroundColor White
Write-Host "   Ejemplo: https://abc123.ngrok-free.app" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Actualiza tu archivo .env:" -ForegroundColor White
Write-Host "   FRONTEND_URL=https://tu-url.ngrok-free.app" -ForegroundColor Gray
Write-Host "   API_BASE_URL=https://tu-url.ngrok-free.app" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Guarda el .env y luego levanta el proyecto:" -ForegroundColor White
Write-Host "   docker-compose up --build" -ForegroundColor Gray
Write-Host ""
Write-Host "Dashboard de ngrok: http://localhost:4040" -ForegroundColor Cyan
Write-Host ""

# Iniciar ngrok
& ngrok http 8080
