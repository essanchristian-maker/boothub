@echo off
title BootHub - Partage en ligne
set NODE_PATH=C:\Users\HP\node-portable\node-v20.19.2-win-x64
set PATH=%NODE_PATH%;%PATH%

echo.
echo  ==========================================
echo   BootHub - Lancement + URL Publique
echo  ==========================================
echo.

echo  [1/2] Demarrage du serveur BootHub...
start "BootHub Serveur" cmd /k "set PATH=%NODE_PATH%;%PATH% && cd /d %~dp0backend && node server.js"
timeout /t 3 /nobreak > nul

echo  [2/2] Creation du tunnel public (localtunnel)...
echo.
echo  *** L'URL publique va apparaitre ci-dessous ***
echo  *** Partage-la avec tes camarades !         ***
echo.
lt --port 3001 --subdomain boothub-classe

pause
