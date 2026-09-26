@echo off
setlocal
title PymeLegal

where docker >nul 2>nul
if errorlevel 1 (
  echo.
  echo No se encontro Docker Desktop instalado en este PC.
  echo Descargalo e instalalo desde: https://www.docker.com/products/docker-desktop/
  echo Luego vuelve a hacer doble clic en este archivo.
  echo.
  pause
  exit /b 1
)

echo.
echo Iniciando PymeLegal...
echo (la primera vez puede demorar varios minutos: se prepara todo lo necesario)
echo Es normal que aparezcan lineas en rojo mencionando "Prisma" durante esta
echo preparacion inicial - ignoralas mientras el proceso siga avanzando.
echo.
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo No se pudo iniciar. Verifica que Docker Desktop este abierto ^(icono de
  echo la ballena en la barra de tareas, esperando que diga "running"^) e
  echo intenta de nuevo haciendo doble clic en este archivo.
  echo.
  pause
  exit /b 1
)

echo Esperando a que la aplicacion quede lista...
powershell -NoProfile -Command "$ok=$false; for ($i=0; $i -lt 150; $i++) { try { $r = Invoke-WebRequest -Uri http://localhost:3000/api/health -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { $ok=$true; break } } catch {} Start-Sleep -Seconds 2 }; if (-not $ok) { exit 1 }"
if errorlevel 1 (
  echo.
  echo La aplicacion esta demorando mas de lo normal en la primera preparacion.
  echo Espera un par de minutos mas y abre manualmente http://localhost:3000 en tu navegador,
  echo o revisa que este pasando con: docker compose logs -f
  echo.
  pause
  exit /b 1
)

start http://localhost:3000
echo.
echo Listo. PymeLegal esta funcionando en http://localhost:3000
echo Puedes cerrar esta ventana. Para apagarla, usa "Detener PymeLegal.bat".
echo.
pause
