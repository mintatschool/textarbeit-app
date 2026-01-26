export default async (request, context) => {
    const url = new URL(request.url);

    // PWA and static assets must bypass auth for offline support on iOS/Android
    // The Service Worker needs to cache these files without authentication headers
    // Only the main HTML page and API endpoints should require authentication

    const pwaBypassPaths = [
        '/sw.js',
        '/manifest.webmanifest',
    ];

    // Check if this is a static asset that should bypass auth
    const staticAssetExtensions = [
        '.js', '.css', '.woff2', '.woff', '.ttf', '.eot',  // Code and fonts
        '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',  // Images
        '.mp3', '.wav', '.ogg', '.m4a',  // Audio
        '.json',  // Data files
    ];

    const isPwaPath = pwaBypassPaths.some(path => url.pathname === path) ||
        url.pathname.startsWith('/workbox-') ||
        url.pathname.startsWith('/assets/');  // Vite build assets folder

    const isStaticAsset = staticAssetExtensions.some(ext => url.pathname.endsWith(ext));

    // Allow PWA files and static assets without authentication
    if (isPwaPath || isStaticAsset) {
        return context.next();
    }

    // 1. Check for Authorization header
    const authorization = request.headers.get("Authorization");

    // 2. Load Environment Variables from Netlify
    const validUser = Deno.env.get("BASIC_AUTH_USER");
    const validPass = Deno.env.get("BASIC_AUTH_PASSWORD");

    // Safety Check: If configuration is missing, show a helpful error page instead of a silent failure.
    if (!validUser || !validPass) {
        return new Response(
            `<html>
                <body style="font-family:sans-serif; padding:2rem; max-width:600px; margin:0 auto; background-color:#fff1f2; color:#be123c;">
                    <div style="background:white; padding:20px; border-radius:8px; box-shadow:0 4px 6px -1px rgb(0 0 / 0.1);">
                        <h1 style="color:#be123c; margin-top:0;">⚠️ Konfiguration unvollständig</h1>
                        <p>Der Passwortschutz konnte nicht aktiviert werden, da die Umgebungsvariablen auf Netlify fehlen oder falsch benannt sind.</p>
                        <hr style="border:0; border-top:1px solid #e5e7eb; margin: 15px 0;">
                        <p><strong>Status-Diagnose:</strong></p>
                        <ul style="list-style:none; padding:0;">
                            <li style="padding:5px 0;">👤 <strong>BASIC_AUTH_USER</strong>: ${validUser ? "<span style='color:green'>Gefunden ✅</span>" : "<span style='color:red; font-weight:bold;'>FEHLT ❌</span>"}</li>
                            <li style="padding:5px 0;">🔑 <strong>BASIC_AUTH_PASSWORD</strong>: ${validPass ? "<span style='color:green'>Gefunden ✅</span>" : "<span style='color:red; font-weight:bold;'>FEHLT ❌</span>"}</li>
                        </ul>
                        <br>
                        <p><strong>Lösung:</strong></p>
                        <ol>
                            <li>Prüfen Sie in Netlify unter Site configuration > Environment variables die Namen.</li>
                            <li>Starten Sie den Deploy neu (Trigger deploy > Clear cache).</li>
                        </ol>
                    </div>
                </body>
            </html>`,
            {
                status: 500,
                headers: { "Content-Type": "text/html; charset=utf-8" }
            }
        );
    }

    if (authorization) {
        try {
            const [scheme, encoded] = authorization.split(" ");
            if (scheme === "Basic") {
                const decoded = atob(encoded);
                const colonIndex = decoded.indexOf(":");
                let username = decoded;
                let password = "";
                if (colonIndex !== -1) {
                    username = decoded.substring(0, colonIndex);
                    password = decoded.substring(colonIndex + 1);
                }

                // Validate credentials
                if (username === validUser && password === validPass) {
                    return context.next();
                } else {
                    console.log(`Auth failed for user '${username}'`);
                }
            }
        } catch (e) {
            console.error("Auth Parsing Error:", e);
        }
    }

    // Default: Deny and prompt for credentials
    return new Response("Unauthorized", {
        status: 401,
        headers: {
            "WWW-Authenticate": 'Basic realm="Textarbeit Protected"',
        },
    });
};
