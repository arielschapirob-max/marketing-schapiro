@echo off
setlocal
title PymeLegal - Deteniendo

echo Deteniendo PymeLegal...
docker compose stop
echo.
echo Listo. PymeLegal quedo apagado. Tus organizaciones y diagnosticos quedan
echo guardados: la proxima vez que uses "Iniciar PymeLegal.bat" van a seguir ahi.
echo.
pause
