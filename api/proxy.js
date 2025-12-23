// File: api/proxy.js

// Using node-fetch for serverless compatibility
const fetch = require('node-fetch');
const url = require('url');

// Define the handler function for Vercel
module.exports = async (req, res) => {
    // Vercel routes all requests through the function. We only care about /api/proxy.
    const reqUrl = url.parse(req.url, true);
    
    // Check if the request is trying to proxy a URL
    if (reqUrl.pathname === '/api/proxy' && reqUrl.query.target) {
        let target = reqUrl.query.target;
        
        // Define the spoofed headers for the target request
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };
        
        try {
            // Use node-fetch for the external request
            const response = await fetch(target, { headers });

            if (!response.ok) {
                res.status(response.status).send(`Proxy failed to fetch the target page. Status: ${response.status}`);
                return;
            }

            const contentType = response.headers.get('content-type') || '';

            // 1. HEADER STRIPPING: Crucial for bypassing X-Frame-Options and CSP
            response.headers.forEach((value, name) => {
                // Block specific security headers
                if (name.toLowerCase() !== 'x-frame-options' && name.toLowerCase() !== 'content-security-policy' && name.toLowerCase() !== 'x-content-type-options') {
                    res.setHeader(name, value);
                }
            });
            
            // Custom CSP rewrite for frame-ancestors
            let csp = response.headers.get('content-security-policy');
            if (csp) {
                csp = csp.replace(/frame-ancestors\s+[^;]*/gi, ''); 
                res.setHeader('content-security-policy', csp);
            }

            // 2. CONTENT REWRITING: Inject the <base> tag and fix relative URLs (HTML only).
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

                res.send(body);
                console.log('Successfully proxied and rewrote HTML content.');

            } else {
                // For non-HTML (images, CSS, JS), stream the raw buffer
                const buffer = await response.buffer();
                res.send(buffer);
            }
            
        } catch (error) {
            console.error('Vercel proxy fetch error:', error);
            res.status(500).send('Fucking Vercel proxy fetch error on the back end.');
        }

        return;
    }
    
    // If a request hits the /api/proxy path without a target, 
    // or if a request hits any other API route, send 404.
    res.status(404).send('404 - API Route Not Found or Missing Target Parameter.');
};
