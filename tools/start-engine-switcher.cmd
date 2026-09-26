@echo off
chcp 65001 >nul
title DSH Search Engine Switcher
cd /d "%~dp0"
echo Starting the DSH search engine switcher...
echo The browser will open http://127.0.0.1:4789 automatically
echo Close this window to stop the server
echo.
start "" "http://127.0.0.1:4789"
node server.mjs
pause
