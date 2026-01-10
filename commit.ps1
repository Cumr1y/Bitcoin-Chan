param(
    [string]$message = "Update bot changes"
)

# Ir al directorio del proyecto
Set-Location "c:\Users\Curly\Desktop\BTC"

# Agregar todos los cambios
Write-Host "📝 Agregando cambios..." -ForegroundColor Cyan
git add -A

# Hacer commit con el mensaje
Write-Host "💾 Haciendo commit..." -ForegroundColor Cyan
git commit -m $message

# Hacer push a GitHub
Write-Host "🚀 Subiendo a GitHub..." -ForegroundColor Cyan
git push origin main

Write-Host "✅ ¡Commit completado!" -ForegroundColor Green
