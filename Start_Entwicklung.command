#!/bin/bash
# Bestimmen des Verzeichnisses, in dem das Skript liegt
cd "$(dirname "$0")"

# Pfad zu npm sicherstellen
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

clear
echo "=================================================="
echo "   Textarbeit App - LIVE ENTWICKLUNG"
echo "=================================================="
echo ""

# IP Adresse ermitteln (fuer iPad/Windows Zugriff)
IP_ADDR=$(ipconfig getifaddr en0)
if [ -z "$IP_ADDR" ]; then
    IP_ADDR=$(ipconfig getifaddr en1)
fi

if [ -z "$IP_ADDR" ]; then
    echo "⚠️  Keine WLAN-IP gefunden. Lokale Entwicklung funktioniert,"
    echo "   aber iPad/Windows Zugriff eventuell nicht."
    IP_ADDR="[DEINE-IP]"
fi

echo "🚀 Starte Dev-Server mit Live-Reload (HTTPS)..."
echo "💡 Diese Version nutzt HTTPS (notwendig für die Kamera)."
echo ""
echo "=================================================="
echo "   ADRESSEN FUER DEINE GERAETE (HTTPS):"
echo "=================================================="
echo "💻 Mac:      https://localhost:5173"
echo "📱 iPad:     https://$IP_ADDR:5173"
echo "🪟 Windows:  https://$IP_ADDR:5173"
echo "=================================================="
echo ""
echo "💡 Windows-Nutzer: Falls ein Zertifikatsfehler erscheint,"
echo "   klicke auf 'Erweitert' -> 'Weiter zu... (unsicher)'."
echo "💡 Dieses Fenster bitte offen lassen."
echo ""

# Öffnet den Browser am Mac
(sleep 2 && open "https://localhost:5173") &

# Startet Vite im Dev-Modus mit Host-Freigabe, HTTPS und Port 5173
export VITE_PORT=5173
export VITE_NO_HTTPS=false
npm run dev -- --host --port 5173
