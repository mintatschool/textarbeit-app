#!/bin/bash
cd "$(dirname "$0")"
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin

clear
echo "=================================================="
echo "   iPad Tunnel für Textarbeit App"
echo "=================================================="
echo ""
echo "Dieser Befehl erstellt eine öffentliche HTTPS-Adresse,"
echo "damit du die App ohne Zertifikatsfehler auf dem iPad testen kannst."
echo ""
echo "⚠️  WICHTIG: Die App muss bereits laufen (Start_Entwicklung.command)!"
echo ""
echo "Starte Tunnel..."
echo "--------------------------------------------------"
# Wir nutzen npx localtunnel. 
# --port 5173: Der Port deiner App
# --local-https: Weil dein lokaler Server auf HTTPS läuft, müssen wir das angeben (oder dem Tunnel sagen, er soll HTTPS ignorieren/verarbeiten).
# Leider kann localtunnel manchmal zicken, wenn local self-signed https ist. 
# Besser: Wir lassen localtunnel auf http zugreifen, aber vite erzwingt https.
# Vite config erlaubt http Access nicht einfach so wenn https: true.
# Aber localtunnel kann mit --local-https (manchmal flag: -lh) auf https connecten.

# Manchmal fragt localtunnel nach einem Passwort (deine öffentliche IP).
# Wir ermitteln sie hier für dich:
PUBLIC_IP=$(curl -s https://ipv4.icanhazip.com)
echo "🔑 Dein Tunnel-Passwort (falls gefragt): $PUBLIC_IP"
echo ""

echo "🔑 Bei diesen Diensten ist KEIN Passwort notwendig."
echo ""

echo "⏳ Versuche Cloudflare Tunnel... (Schritt 1)"
echo "--------------------------------------------------"

# Versuch 1: Cloudflare Tunnel (via npx)
# Der Name ist 'cloudflared' (ohne @cloudflare)
npx cloudflared tunnel --url http://localhost:5174

# Falls Cloudflare fehlschlägt (z.B. npm Fehler), versuche SSH (Schritt 2)
if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Cloudflare fehlgeschlagen. Versuche Alternative via SSH..."
    echo "--------------------------------------------------"
    echo "💡 Falls du gefragt wirst: Bestätige mit 'yes'."
    echo ""
    ssh -p 443 -R 80:localhost:5174 a.pinggy.io
fi

# Falls alles fehlschlägt
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Fehler beim Starten des Tunnels."
    echo "Stelle sicher, dass 'Start_Entwicklung_HTTP.command' bereits läuft."
fi

echo ""
read -p "Drücke Enter zum Beenden..."
