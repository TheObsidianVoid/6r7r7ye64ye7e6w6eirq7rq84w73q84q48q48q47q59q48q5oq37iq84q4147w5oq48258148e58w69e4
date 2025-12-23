// File: api/proxy.js

// Native Node.js fetch (available on Vercel Node 18+)

// Define the handler function for Vercel
module.exports = async (req, res) => {
    // Vercel routes all requests through the function. We only care about /api/proxy.
    const reqUrl = require('url').parse(req.url, true);
    
    // Check if the request is trying to proxy a URL
    if (reqUrl.pathname === '/api/proxy' && reqUrl.query.target) {
        let target = reqUrl.query.target;
        
        // Define the spoofed headers for the target request
        const requestHeaders = {
            // Forwarding the user-agent is important for Vercel functions
            'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };
        
        try {
            // Use native fetch for the external request
            const response = await fetch(target, { 
                method: req.method, // Forward the request method (GET/POST)
                headers: requestHeaders, 
            });

            if (!response.ok) {
                res.statusCode = response.status;
                res.end(`Proxy failed to fetch the target page. Status: ${response.status}`);
                return;
            }

            const contentType = response.headers.get('content-type') || '';

            // 1. HEADER STRIPPING & TRANSFER
            response.headers.forEach((value, name) => {
                const lowerName = name.toLowerCase();
                // Block specific security headers
                if (lowerName !== 'x-frame-options' && lowerName !== 'content-security-policy' && lowerName !== 'x-content-type-options') {
                    res.setHeader(name, value);
                }
            });
            
            // Custom CSP rewrite for frame-ancestors
            let csp = response.headers.get('content-security-policy');
            if (csp) {
                csp = csp.replace(/frame-ancestors\s+[^;]*/gi, ''); 
                res.setHeader('content-security-policy', csp);
            }

            // Set the response status code
            res.statusCode = response.status;


            // 2. CONTENT REWRITING (HTML only)
            if (contentType.includes('text/html')) {
                let body = await response.text();
                const baseUrl = new URL(target).origin;
                
                // Fix 1: Inject the base tag
                const baseTag = `<base href="${baseUrl}/">`;
                body = body.replace(/<head\s*[^>]*>/i, `$&${baseTag}`);
                
                // Fix 2: AGGRESSIVE RELATIVE URL REWRITING (Ensures images/CSS load)
                const regex = /(src|href|url)\s*=\s*['"](\/[^'"])/gi;
                body = body.replace(regex, (match, p1, p2) => {
                    return `${p1}="${baseUrl}${p2}`;
                });

                res.end(body);
                console.log('Successfully proxied and rewrote HTML content.');

            } else {
                // For non-HTML (images, CSS, JS), stream the raw response body directly
                response.body.pipe(res);
            }
            
        } catch (error) {
            console.error('Vercel proxy fetch error:', error);
            // Send 504 Gateway Timeout if the fetch itself failed (often a timeout)
            res.statusCode = 504; 
            res.end('Fucking Vercel proxy fetch failed (Possible Timeout/DNS Error).');
        }

        return;
    }
    
    // Default 404 for API routes
    res.statusCode = 404;
    res.end('404 - API Route Not Found or Missing Target Parameter.');
};
