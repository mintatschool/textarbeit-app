#!/bin/bash
cd "$(dirname "$0")"

clear
echo "=================================================="
echo "   Textarbeit App Start-Pruefung"
echo "=================================================="

# Prüfen ob dist Ordner existiert
if [ ! -d "dist" ]; then
    echo "FEHLER: Der Ordner 'dist' wurde nicht gefunden!"
    echo "Bitte stellen Sie sicher, dass der 'dist' Ordner im selben"
    echo "Verzeichnis wie dieses Skript liegt."
    echo ""
    exit 1
fi

# IP Adresse ermitteln (für iPad Zugriff)
IP_ADDR=$(ipconfig getifaddr en0)
if [ -z "$IP_ADDR" ]; then
    IP_ADDR=$(ipconfig getifaddr en1)
fi

echo "✓ 'dist' Ordner gefunden."
echo "✓ Server gestartet."
echo ""
echo "=================================================="
echo "   SO NUTZEN SIE DIE APP AUF DEM IPAD:"
echo "=================================================="
echo "1. Mac und iPad muessen im selben WLAN sein."
echo "2. Oeffnen Sie Safari auf dem iPad."
echo "3. Geben Sie diese Adresse ein:"
echo ""
echo "   http://$IP_ADDR:8080/"
echo ""
echo "4. Druecken Sie auf dem iPad den 'Teilen'-Button"
echo "   (Quadrat mit Pfeil nach oben)."
echo "5. Waehlen Sie 'Zum Home-Bildschirm'."
echo "=================================================="
echo ""
echo "HINWEIS: Dieses Fenster muss offen bleiben."

# Öffnet den Browser am Mac
(sleep 2 && open "http://localhost:8080/") &

# Startet den Server
python3 -m http.server 8080 --directory dist
