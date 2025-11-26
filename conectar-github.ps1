# Script para conectar el repositorio local con GitHub
# Repositorio: nicofdz/Agrolinkrb

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Conectando repositorio con GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Intentar encontrar Git
$gitPath = $null
$possiblePaths = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
    "git"  # Si está en el PATH
)

foreach ($path in $possiblePaths) {
    if ($path -eq "git") {
        try {
            $result = Get-Command git -ErrorAction Stop
            $gitPath = "git"
            break
        } catch {
            continue
        }
    } else {
        if (Test-Path $path) {
            $gitPath = $path
            break
        }
    }
}

if (-not $gitPath) {
    Write-Host "ERROR: No se encontró Git instalado." -ForegroundColor Red
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor Yellow
    Write-Host "1. Instalar Git desde: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "2. Usar GitHub Desktop: https://desktop.github.com/" -ForegroundColor Yellow
    Write-Host "3. Si Git está instalado, agregarlo al PATH del sistema" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "O ejecuta este script desde Git Bash si lo tienes instalado." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✓ Git encontrado: $gitPath" -ForegroundColor Green
Write-Host ""

# Verificar si ya hay un repositorio Git
if (Test-Path .git) {
    Write-Host "✓ Repositorio Git ya inicializado" -ForegroundColor Green
} else {
    Write-Host "Inicializando repositorio Git..." -ForegroundColor Yellow
    & $gitPath init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: No se pudo inicializar el repositorio" -ForegroundColor Red
        pause
        exit 1
    }
    Write-Host "✓ Repositorio inicializado" -ForegroundColor Green
}

Write-Host ""

# Verificar si ya existe el remote
$remoteExists = & $gitPath remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Remote 'origin' ya existe: $remoteExists" -ForegroundColor Yellow
    Write-Host "¿Deseas actualizarlo? (S/N)" -ForegroundColor Yellow
    $respuesta = Read-Host
    if ($respuesta -eq "S" -or $respuesta -eq "s") {
        & $gitPath remote set-url origin https://github.com/nicofdz/Agrolinkrb.git
        Write-Host "✓ Remote actualizado" -ForegroundColor Green
    }
} else {
    Write-Host "Agregando remote 'origin'..." -ForegroundColor Yellow
    & $gitPath remote add origin https://github.com/nicofdz/Agrolinkrb.git
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: No se pudo agregar el remote" -ForegroundColor Red
        pause
        exit 1
    }
    Write-Host "✓ Remote agregado" -ForegroundColor Green
}

Write-Host ""

# Verificar estado
Write-Host "Estado actual del repositorio:" -ForegroundColor Cyan
& $gitPath status

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Agregar archivos: git add ." -ForegroundColor Yellow
Write-Host "2. Hacer commit: git commit -m 'Mensaje del commit'" -ForegroundColor Yellow
Write-Host "3. Hacer pull primero (si hay cambios en GitHub): git pull origin main --allow-unrelated-histories" -ForegroundColor Yellow
Write-Host "4. Subir cambios: git push -u origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "¿Deseas ejecutar estos pasos ahora? (S/N)" -ForegroundColor Cyan
$continuar = Read-Host

if ($continuar -eq "S" -or $continuar -eq "s") {
    Write-Host ""
    Write-Host "Agregando archivos..." -ForegroundColor Yellow
    & $gitPath add .
    
    Write-Host ""
    Write-Host "Creando commit..." -ForegroundColor Yellow
    $commitMessage = "Mejoras en UI: barra de búsqueda centrada, navbar a ancho completo, catálogo y productores públicos"
    & $gitPath commit -m $commitMessage
    
    Write-Host ""
    Write-Host "Haciendo pull primero (puede requerir merge)..." -ForegroundColor Yellow
    & $gitPath pull origin main --allow-unrelated-histories --no-edit
    
    Write-Host ""
    Write-Host "Subiendo cambios a GitHub..." -ForegroundColor Yellow
    & $gitPath push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "¡Cambios subidos exitosamente!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Vercel debería detectar automáticamente los cambios y desplegar la nueva versión." -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "ERROR: No se pudo subir los cambios. Revisa los mensajes anteriores." -ForegroundColor Red
    }
}

Write-Host ""
pause

