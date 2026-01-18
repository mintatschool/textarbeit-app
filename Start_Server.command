#!/bin/bash
# Bestimmen des Verzeichnisses, in dem das Skript liegt
cd "$(dirname "$0")"

# Pfad zu npm sicherstellen (versucht common locations)
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

echo "=================================================="
echo "   Textarbeit App Server wird gestartet..."
echo "=================================================="
echo ""
echo "Dieses Fenster bitte offen lassen, solange die App genutzt wird."
echo ""
echo "Die App wird gleich im Browser geöffnet."
echo "Für iPads im Netzwerk, nutzen Sie die unten angezeigt 'Network' Adresse."
echo ""

# Startet den Browser nach kurzer Wartezeit
(sleep 2 && open "http://localhost:4173/textarbeit-app/") &

# Startet den Server
npm run preview
