export default async (request, context) => {
    // Get the Authorization header
    const authorization = request.headers.get("Authorization");

    // Check if the header is present
    if (authorization) {
        const [scheme, encoded] = authorization.split(" ");

        // Check if it is Basic Auth
        if (scheme === "Basic") {
            const decoded = atob(encoded);
            const [username, password] = decoded.split(":");

            const validUser = Deno.env.get("BASIC_AUTH_USER");
            const validPass = Deno.env.get("BASIC_AUTH_PASSWORD");

            // Validate credentials
            if (username === validUser && password === validPass) {
                return context.next();
            }
        }
    }

    // If validation fails or no header, return 401
    return new Response("Unauthorized", {
        status: 401,
        headers: {
            "WWW-Authenticate": 'Basic realm="Textarbeit"',
        },
    });
};
