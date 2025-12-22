#!/bin/bash

echo "📦 GitHub Upload für Textarbeit-App"
echo "===================================="
echo ""
echo "Dieser Script führt folgende Schritte aus:"
echo "1. Erstellt einen Personal Access Token (wird benötigt)"
echo "2. Pusht den Code zu GitHub"
echo ""
echo "Bitte folge diesen Schritten:"
echo ""
echo "1️⃣  Öffne https://github.com/settings/tokens/new"
echo ""
echo "2️⃣  Fülle folgendes aus:"
echo "   - Note: 'Textarbeit Upload'"
echo "   - Expiration: '30 days'"
echo "   - Scopes: aktiviere 'repo' (alle Unteroptionen)"
echo ""
echo "3️⃣  Klicke 'Generate token' und KOPIERE den Token"
echo ""
read -sp "4️⃣  Füge den Token hier ein (wird nicht angezeigt): " TOKEN
echo ""
echo ""

# Push mit Token
echo "🚀 Pushe zu GitHub..."
git push https://${TOKEN}@github.com/mintatschool/textarbeit-app.git main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Erfolgreich hochgeladen!"
    echo "🔗 Dein Repository: https://github.com/mintatschool/textarbeit-app"
else
    echo ""
    echo "❌ Fehler beim Upload. Prüfe:"
    echo "   - Ist der Token korrekt?"
    echo "   - Hat der Token 'repo' Berechtigung?"
fi
