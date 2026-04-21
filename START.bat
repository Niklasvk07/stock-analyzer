@echo off
echo.
echo  TopMover Aktien-Scanner wird gestartet...
echo  Bitte warten (ca. 20 Sekunden)...
echo.
cd /d "C:\Claude Code\stock-analyzer"
start "" "http://localhost:3000"
npm run dev
