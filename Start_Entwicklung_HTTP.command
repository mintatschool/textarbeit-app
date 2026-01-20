#!/bin/bash
# Bestimmen des Verzeichnisses, in dem das Skript liegt
cd "$(dirname "$0")"

# Pfad zu npm sicherstellen
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

clear
echo "=================================================="
echo "   Textarbeit App - LIVE ENTWICKLUNG (OHNE HTTPS)"
echo "=================================================="
echo ""
echo "💡 Diese Version nutzt KEIN HTTPS."
echo "💡 Ideal fuer Windows-PCs oder iPads im Netzwerk,"
echo "   wenn Zertifikatsfehler auftreten."
echo ""

echo "🚀 Starte Dev-Server mit Live-Reload (HTTP)..."
echo "💡 Diese Version nutzt KEIN HTTPS."
echo "💡 Ideal fuer Windows-PCs im Netzwerk (keine Zertifikatsfehler)."
echo "⚠️  HINWEIS: Die Kamera-Funktion funktioniert hier NICHT."
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

echo "🚀 Starte Dev-Server auf Port 5174..."
echo ""
echo "=================================================="
echo "   ADRESSEN FUER DEINE GERAETE (HTTP):"
echo "=================================================="
echo "💻 Mac:      http://localhost:5174"
echo "📱 iPad:     http://$IP_ADDR:5174"
echo "🪟 Windows:  http://$IP_ADDR:5174"
echo "=================================================="
echo ""
echo "💡 Jede Code-Aenderung aktualisiert ALLE Geraete sofort."
echo "💡 Dieses Fenster bitte offen lassen."
echo ""

# Öffnet den Browser am Mac
(sleep 2 && open "http://localhost:5174") &

# Startet Vite im Dev-Modus mit Host-Freigabe, OHNE HTTPS und auf Port 5174
export VITE_PORT=5174
export VITE_NO_HTTPS=true
npm run dev -- --host --port 5174
