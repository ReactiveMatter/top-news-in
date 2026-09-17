const routes = new Map();


/**
 * Get the current hash URL information.
 *
 * Returns:
 * {
 *     path: "/article/123",
 *     query: URLSearchParams
 * }
 */
export function getURL() {
    const hash =
        window.location.hash.slice(1) || "/";

    const url =
        new URL(
            hash,
            window.location.origin
        );

    return {
        path: url.pathname,
        query: url.searchParams
    };
}


/**
 * Extract parameters from a path.
 */
function getPathParams(pattern, path) {

    const patternParts =
        pattern.split("/").filter(Boolean);

    const pathParts =
        path.split("/").filter(Boolean);

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {

        const patternPart =
            patternParts[i];

        // Last parameter captures the entire remainder
        if (
            patternPart.startsWith(":") &&
            i === patternParts.length - 1
        ) {

            const name =
                patternPart.slice(1);

            const prefix =
                "/" +
                patternParts
                    .slice(0, i)
                    .join("/");

            params[name] =
                decodeURIComponent(
                    path.slice(prefix.length + 1)
                );

            return params;
        }

        if (i >= pathParts.length) {
            return null;
        }

        const pathPart =
            pathParts[i];

        if (patternPart.startsWith(":")) {

            const name =
                patternPart.slice(1);

            params[name] =
                decodeURIComponent(pathPart);

        } else if (patternPart !== pathPart) {

            return null;
        }
    }

    if (pathParts.length !== patternParts.length) {
        return null;
    }

    return params;
}


/**
 * Register a path and callback.
 */
export function route(pattern, callback) {
    routes.set(pattern, callback);
}

/**
 * Find and execute the route matching the current URL.
 */
export function resolve() {
    const {
        path,
        query
    } = getURL();


    const callback = routes.get(path);

    if (callback) {
        callback({
            params: {},
            query
        });

        return true;
    }

    // Try dynamic routes
    for (const [pattern, callback] of routes) {

        if (!pattern.includes(":")) {
            continue;
        }

        const params =
            getPathParams(
                pattern,
                path
            );

        if (params === null) {
            continue;
        }

        callback({
            params,
            query
        });


        return true;
    }

  
    return false;
}



/**
 * Navigate to a hash URL.
 *
 * Examples:
 *
 * navigate("/");
 * navigate("/article/123");
 * navigate("/?filter=editorial");
 */
export function navigate(path) {

    if (path === "/") {
        history.pushState({}, "", "/");
        resolve();
    }
    else 
    {
        window.location.hash = path;
    }
    
}


/**
 * Handle browser back/forward.
 */
window.addEventListener(
    "hashchange",
    resolve
);