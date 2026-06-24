@echo off
title BootHub - Lancement
set NODE_PATH=C:\Users\HP\node-portable\node-v20.19.2-win-x64
set PATH=%NODE_PATH%;%PATH%

echo.
echo  ===========================================
echo   BootHub - Reseau Social Bootcamp
echo  ===========================================
echo.
echo  Demarrage du backend (API port 3001)...
echo  Demarrage du frontend (Web port 5173)...
echo.
echo  Ouvre ton navigateur sur : http://localhost:5173
echo.

start "BootHub API" cmd /k "set PATH=%NODE_PATH%;%PATH% && cd /d %~dp0backend && node server.js"
timeout /t 2 /nobreak > nul
start "BootHub Web" cmd /k "set PATH=%NODE_PATH%;%PATH% && cd /d %~dp0frontend && npm run dev"

echo  Les deux serveurs sont en cours de demarrage...
echo  Attends 5 secondes puis ouvre : http://localhost:5173
pause
