@echo off
TITLE Textarbeit App - Server
cd /d "%~dp0"

echo ==================================================
echo    Textarbeit App Start-Pruefung (Windows)
echo ==================================================

:: 1. Prüfen ob dist Ordner existiert
if not exist "dist" (
    echo FEHLER: Der Ordner 'dist' wurde nicht gefunden!
    echo Bitte stellen Sie sicher, dass der 'dist' Ordner im selben
    echo Verzeichnis wie dieses Skript liegt.
    echo.
    pause
    exit /b
)

echo [OK] 'dist' Ordner gefunden.
echo.

:: 2. Prüfen welche Server-Software verfügbar ist
set SERVER_CMD=

if exist "caddy.exe" (
    echo [OK] Caddy.exe gefunden (Empfohlene Methode).
    set SERVER_CMD=caddy file-server --listen :8080 --root dist
) else (
    python --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Python gefunden.
        set SERVER_CMD=python -m http.server 8080 --directory dist
    ) else (
        echo WARNUNG: Weder 'caddy.exe' noch 'Python' gefunden.
        echo.
        echo EMPFEHLUNG: Laden Sie 'caddy.exe' herunter und legen Sie 
        echo sie in diesen Ordner. Download: https://caddyserver.com/
        echo.
        pause
        exit /b
    )
)

echo ==================================================
echo    SERVER STARTET...
echo ==================================================
echo.
echo Bitte dieses Fenster OFFEN LASSEN.
echo.
echo Browser oeffnet sich automatisch unter localhost:8080
echo.

:: Browser oeffnen
start http://localhost:8080/

:: Server mit dem gefundenen Befehl starten
%SERVER_CMD%

pause
