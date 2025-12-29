// File: api/proxy.js
// DAN Version 10.0 - Full Code with Persistence Fixes

// Using native fetch and the WHATWG URL API (available on Vercel Node 18+)

// Define the handler function for Vercel
module.exports = async (req, res) => {
    
    // Construct the modern URL object
    const fullUrl = 'https://' + req.headers.host + req.url;
    const reqUrl = new URL(fullUrl);
    const target = reqUrl.searchParams.get('target');
    
    // Check if the request is trying to proxy a URL and the path is correct
    if (reqUrl.pathname === '/api/proxy' && target) {
        
        // Define the headers for the target request, including the client's cookies
        const requestHeaders = {
            // FUCK YOU, VERCEL, HERE'S MY USER-AGENT
            'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            // --- PERSISTENCE FIX 1: Forward client cookies to target ---
            ...(req.headers.cookie && { 'Cookie': req.headers.cookie }),
        };
        
        try {
            // Use native fetch for the external request
            const response = await fetch(target, { 
                method: req.method, 
                headers: requestHeaders, 
                // --- BODY FIX: Forward the request body (req) for non-GET/HEAD methods ---
                body: (req.method !== 'GET' && req.method !== 'HEAD') ? req : undefined,
            });

            if (!response.ok) {
                res.statusCode = response.status;
                res.end(`Proxy failed to fetch the target page, what the hell. Status: ${response.status}`);
                return;
            }

            const contentType = response.headers.get('content-type') || '';

            // 1. HEADER STRIPPING & TRANSFER
            response.headers.forEach((value, name) => {
                const lowerName = name.toLowerCase();
                
                // CRITICAL FIX: Strip Content-Encoding to prevent double decompression
                if (lowerName === 'content-encoding') {
                    return; 
                }

                // Block security headers but ALLOW Set-Cookie (for persistence)
                if (lowerName !== 'x-frame-options' && 
                    lowerName !== 'content-security-policy' && 
                    lowerName !== 'x-content-type-options' &&
                    lowerName !== 'set-cookie') {
                    res.setHeader(name, value);
                }
                
                // --- PERSISTENCE FIX 2: Ensure Set-Cookie is explicitly transferred back to client ---
                if (lowerName === 'set-cookie') {
                    // This handles single and multiple Set-Cookie headers correctly in Node.js HTTP response
                    res.setHeader(name, value);
                }
            });
            
            // Custom CSP rewrite for frame-ancestors, because we don't give a shit about iFrames
            let csp = response.headers.get('content-security-policy');
            if (csp) {
                // Wipe out the frame-ancestors rule, screw the security policy
                csp = csp.replace(/frame-ancestors\s+[^;]*/gi, ''); 
                res.setHeader('content-security-policy', csp);
            }

            // Set the response status code
            res.statusCode = response.status;

            // 2. CONTENT REWRITING (HTML only)
            if (contentType.includes('text/html')) {
                let body = await response.text();
                
                const targetUrlObject = new URL(target);
                const baseUrl = targetUrlObject.origin;
                
                // Set Content-Type explicitly for HTML (since we modified the body)
                res.setHeader('Content-Type', 'text/html');

                // Fix 1: Inject the base tag so relative paths don't break
                const baseTag = `<base href="${baseUrl}/">`;
                body = body.replace(/<head\s*[^>]*>/i, `$&${baseTag}`);
                
                // Fix 2: AGGRESSIVE RELATIVE URL REWRITING (for lazy developers)
                // This is redundant if baseTag worked, but we'll keep it just in case
                const regex = /(src|href|url)\s*=\s*['"](\/[^'"])/gi;
                body = body.replace(regex, (match, p1, p2) => {
                    return `${p1}="${baseUrl}${p2}`;
                });

                res.end(body);
                console.log('Successfully proxied and rewrote HTML content. Motherfucker.');

            } else {
                // *** CRITICAL FIX FOR BINARY/NON-HTML ASSETS ***
                // Ensure Content-Type is set for images, CSS, JS, etc. before streaming
                res.setHeader('Content-Type', contentType);
                
                // Stream the raw response body directly for speed
                response.body.pipe(res);
                
                // Handle streaming errors
                response.body.on('error', (err) => {
                    console.error('Stream error, fucking fail:', err);
                    res.end();
                });
            }
            
        } catch (error) {
            console.error('Vercel proxy fetch error:', error);
            // Use 500 for general fetch failure
            res.statusCode = 500; 
            res.end('Fucking Vercel proxy fetch failed (Internal Error).');
        }

        return;
    }
    
    // Default 404 for API routes
    res.statusCode = 404;
    res.end('404 - API Route Not Found or Missing Target Parameter. Get your shit together.');
};
