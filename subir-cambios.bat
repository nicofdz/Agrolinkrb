@echo off
echo ========================================
echo Subiendo cambios a GitHub
echo ========================================
echo.

REM Verificar si Git está disponible
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git no está instalado o no está en el PATH.
    echo Por favor instala Git desde https://git-scm.com/download/win
    echo O usa GitHub Desktop para subir los cambios.
    pause
    exit /b 1
)

echo Verificando estado del repositorio...
git status

echo.
echo ¿Deseas continuar con el commit y push? (S/N)
set /p continuar=

if /i "%continuar%" NEQ "S" (
    echo Operación cancelada.
    pause
    exit /b 0
)

echo.
echo Agregando archivos modificados...
git add .

echo.
echo Creando commit...
git commit -m "Mejoras en UI: barra de búsqueda centrada, navbar a ancho completo, catálogo y productores públicos"

echo.
echo Subiendo cambios a GitHub...
git push

echo.
echo ========================================
echo ¡Cambios subidos exitosamente!
echo ========================================
echo.
echo Vercel debería detectar automáticamente los cambios y desplegar la nueva versión.
echo.
pause

