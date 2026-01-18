export default async (request, context) => {
    // 1. Check for Authorization header
    const authorization = request.headers.get("Authorization");

    // 2. Load Environment Variables (and check if they exist)
    const validUser = Deno.env.get("BASIC_AUTH_USER");
    const validPass = Deno.env.get("BASIC_AUTH_PASSWORD");

    // Safety Check: If variables are missing on the server, warn clearly (in logs) and return 500 or just deny.
    // Returning 500 helps the user realize they forgot to set them or Redeploy.
    if (!validUser || !validPass) {
        console.error("ERROR: BASIC_AUTH_USER or BASIC_AUTH_PASSWORD not set in Netlify Environment Variables.");
        console.error("Action required: Set variables in Site Settings and Trigger a Redeploy.");
        // We allow the prompt to show, but it will never match. 
        // Or we can show a specific error if we want to be helpful during setup:
        // return new Response("Setup Error: Auth Environment Variables missing. Please check Netlify Logs.", { status: 500 });
    }

    if (authorization) {
        try {
            const [scheme, encoded] = authorization.split(" ");

            if (scheme === "Basic") {
                const decoded = atob(encoded);

                // Robust splitting: handle passwords containing colons
                const colonIndex = decoded.indexOf(":");
                let username, password;

                if (colonIndex !== -1) {
                    username = decoded.substring(0, colonIndex);
                    password = decoded.substring(colonIndex + 1);
                } else {
                    // Fallback for malformed (no password?)
                    username = decoded;
                    password = "";
                }

                // Check credentials
                if (validUser && validPass && username === validUser && password === validPass) {
                    return context.next();
                } else {
                    console.log(`Auth failed for user: '${username}'`);
                }
            }
        } catch (e) {
            console.error("Auth Parsing Error:", e);
        }
    }

    // Default: Deny
    return new Response("Unauthorized", {
        status: 401,
        headers: {
            "WWW-Authenticate": 'Basic realm="Textarbeit Protected"',
        },
    });
};
