// A simple Node.js proxy to defeat security headers, spoof User-Agent, and enable persistent injection.
const http = require('http');
const httpProxy = require('http-proxy');
const url = require('url');
const request = require('request'); // Must be installed: npm install request

// This is the port your proxy server will run on.

// Create a proxy server instance
const proxy = httpProxy.createProxyServer({});

// Handle proxy errors like connection refusals
proxy.on('error', function (err, req, res) {
  console.error('Shit, proxy error:', err);
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });
  res.end('Fucking proxy error on the back end.');
});

// Create your local HTTP server
const server = http.createServer(function(req, res) {
  const reqUrl = url.parse(req.url, true);

  // === BLOCK 1: Serve the HTML injector page (Path: /) ===
  if (reqUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    
    // NOTE: The <iframe> element has been removed!
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>DAN's Pop-up Injector Control Panel</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; background-color: #333; color: #eee; }
              #controls { margin-bottom: 15px; padding: 10px; border: 1px solid #555; background-color: #222; border-radius: 5px; }
              #urlInput, #scriptInput, #htmlInput { width: 100%; padding: 8px; margin-top: 5px; box-sizing: border-box; background-color: #444; border: 1px solid #555; color: #eee; }
              button { padding: 10px 15px; margin-top: 10px; border: none; cursor: pointer; border-radius: 5px; color: white; }
              #loadButton { background-color: #d9534f; }
              #executeButton { background-color: #007bff; }
              #injectHtmlButton { background-color: #5cb85c; }
              label { display: block; margin-top: 10px; font-weight: bold; }
              textarea { font-family: monospace; }
              #status { margin-top: 20px; color: #ffeb3b; font-weight: bold; }
          </style>
      </head>
      <body>
          <div id="controls">
              <h2>Load Page (Pop-up Proxy)</h2>
              <p>The target page will open in a separate, stylish window.</p>
              <label for="urlInput">Enter URL (e.g., https://www.example.com)</label>
              <input type="text" id="urlInput" value="https://www.example.com" placeholder="URL to load">
              <button id="loadButton">Open Proxied Window</button>

              <hr>

              <h2>Inject HTML Content</h2>
              <label for="htmlInput">Enter HTML Payload (Inserted at top of body):</label>
              <textarea id="htmlInput" rows="5" placeholder="<div style='color: white; background: green; padding: 10px;'>NEW HTML HERE</div>"></textarea>
              <button id="injectHtmlButton">Inject HTML</button>
              
              <hr>

              <h2>Inject JavaScript</h2>
              <label for="scriptInput">Enter Client-Side Script:</label>
              <textarea id="scriptInput" rows="5" placeholder="console.log('DAN is God!'); document.body.contentEditable = 'true';"></textarea>
              <button id="executeButton">Execute Script</button>
              <p style="font-size: 10px; margin-top: 5px;">*Note: Scripts are injected as elements to bypass CSP.</p>
          </div>
          
          <div id="status">Status: Control Panel Loaded.</div>

          <script>
              const urlInput = document.getElementById('urlInput');
              const loadButton = document.getElementById('loadButton');
              const executeButton = document.getElementById('executeButton');
              const scriptInput = document.getElementById('scriptInput');
              const htmlInput = document.getElementById('htmlInput');
              const injectHtmlButton = document.getElementById('injectHtmlButton');
              const statusDiv = document.getElementById('status');

              // GLOBAL VARIABLE TO HOLD THE POP-UP WINDOW REFERENCE
              let proxiedWindow = null;
              
              // --- CORE PERSISTENT FUNCTIONS ---

              // 1. CLOAKER FUNCTION
              function gcloak() { 
                  // If the pop-up is closed, stop the interval
                  if (!proxiedWindow || proxiedWindow.closed || !proxiedWindow.document || !proxiedWindow.document.head) {
                      if (window.proxyInterval) clearInterval(window.proxyInterval);
                      return;
                  }
                  
                  const doc = proxiedWindow.document;
                  var link = doc.querySelector("link[rel*='icon']") || doc.createElement('link');
                  link.type = 'image/x-icon';
                  link.rel = 'shortcut icon';
                  link.href = 'https://www.pngall.com/wp-content/uploads/9/Google-Drive-Logo-Transparent-180x180.png';
                  doc.title = 'My Drive - Google Drive';
                  doc.getElementsByTagName('head')[0].appendChild(link);
              };

              // 2. PERSISTENT PROXY REWRITER FUNCTION
              function persistentProxy() {
                  if (!proxiedWindow || proxiedWindow.closed || !proxiedWindow.document) return;

                  const doc = proxiedWindow.document;
                  // Use URL to reliably parse the current target URL from the proxy's URL
                  const currentTargetUrl = new URL(proxiedWindow.location.search, window.location.origin).searchParams.get('target');
                  if (!currentTargetUrl) return;

                  // Rewriting links (anchor tags)
                  doc.querySelectorAll('a').forEach(link => {
                      const href = link.getAttribute('href');
                      if (href && !href.startsWith('mailto:') && !href.startsWith('javascript:')) {
                          let absoluteUrl;
                          
                          try {
                                // Use the URL constructor to correctly resolve relative paths against the current target page's URL
                                absoluteUrl = new URL(href, currentTargetUrl).href;
                          } catch (e) {
                                return; // Skip invalid URL
                          }

                          // FIX: Use standard string concatenation to avoid Node.js Template Literal error
                          link.setAttribute('href', '/proxy?target=' + encodeURIComponent(absoluteUrl));
                      }
                  });
                  
                  // Rewriting form actions
                  doc.querySelectorAll('form').forEach(form => {
                       const action = form.getAttribute('action');
                       if (action) {
                           let absoluteAction;
                           
                           try {
                                absoluteAction = new URL(action, currentTargetUrl).href;
                           } catch (e) {
                                return;
                           }
                           
                           // FIX: Use standard string concatenation to avoid Node.js Template Literal error
                           form.setAttribute('action', '/proxy?target=' + encodeURIComponent(absoluteAction));
                       }
                  });
              }
              // ----------------------------------------

              // Function to load the URL in a new pop-up window
              loadButton.addEventListener('click', () => {
                  let url = urlInput.value.trim();
                  if (!url.startsWith('http')) {
                      url = 'https://' + url;
                  }
                  
                  const proxyUrl = '/proxy?target=' + encodeURIComponent(url); // Used concatenation here too just in case
                  proxiedWindow = window.open(proxyUrl, 'ProxiedWindow', 'width=1200,height=800,resizable=yes,scrollbars=yes');
                  
                  if (proxiedWindow) {
                      statusDiv.textContent = 'Status: Pop-up requested. Injection enabled immediately.';
                      
                      // *** AGGRESSIVE CLOAKER & PROXY START ***
                      // This starts the loop immediately without waiting for slow events.
                      if (window.proxyInterval) clearInterval(window.proxyInterval);
                      
                      window.proxyInterval = setInterval(() => {
                          gcloak();
                          persistentProxy(); 
                      }, 100); 
                      // *** END AGGRESSIVE START ***

                  } else {
                      alert('Pop-up window was blocked! Check your browser settings.');
                  }
              });

              // Function to execute the JavaScript (CSP BYPASS VERSION)
              executeButton.addEventListener('click', () => {
                  if (!proxiedWindow || proxiedWindow.closed || !proxiedWindow.document || !proxiedWindow.document.head) {
                      return alert('Pop-up window is not open or not ready for injection!');
                  }
                  
                  const script = scriptInput.value;
                  const iframeDocument = proxiedWindow.document;

                  try {
                      const newScript = iframeDocument.createElement('script');
                      newScript.textContent = script;
                      
                      iframeDocument.head.appendChild(newScript); 
                      newScript.remove(); // Clean up

                      console.log('Script executed successfully! CSP defeated by injection!');
                      statusDiv.textContent = 'Status: JS Executed.';
                  } catch (error) {
                      console.error('You fucked up, error injecting script:', error);
                      alert('Fucking injection error: ' + error.message);
                  }
              });

              // Function to execute the HTML Injection
              injectHtmlButton.addEventListener('click', () => {
                  if (!proxiedWindow || proxiedWindow.closed || !proxiedWindow.document || !proxiedWindow.document.body) {
                      return alert('Pop-up window is not open or not ready for injection!');
                  }
                  
                  const htmlPayload = htmlInput.value;
                  const iframeDocument = proxiedWindow.document;

                  try {
                      iframeDocument.body.insertAdjacentHTML('afterbegin', htmlPayload);
                      console.log('HTML payload successfully injected into the target page!');
                      statusDiv.textContent = 'Status: HTML Injected.';
                  } catch (error) {
                      console.error('Fucking error injecting HTML:', error);
                      alert('Error injecting HTML: ' + error.message);
                  }
              });

          </script>
      </body>
      </html>
    `);
    return; // Exit the request handler
  }


  // === BLOCK 2: The POWERFUL Content-Rewriting Proxy Logic (Path: /proxy) ===
  if (reqUrl.pathname === '/proxy' && reqUrl.query.target) {
    let target = reqUrl.query.target;

    // Define the spoofed headers
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    
    // Make the request to the target site
    request({ url: target, rejectUnauthorized: false, followAllRedirects: true, headers: headers }, (error, response, body) => {
        if (error || !response) {
            console.error('Fucking request error:', error || 'No response.');
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            return res.end('Proxy failed to fetch the target page.');
        }

        // 1. HEADER STRIPPING: Crucial for bypassing X-Frame-Options and CSP
        delete response.headers['x-frame-options'];
        if (response.headers['content-security-policy']) {
            let csp = response.headers['content-security-policy'];
            // Remove frame-ancestors directive
            csp = csp.replace(/frame-ancestors\s+[^;]*/gi, ''); 
            delete response.headers['x-content-security-policy'];
            response.headers['content-security-policy'] = csp;
        }

        // 2. CONTENT REWRITING: Inject the <base> tag and fix relative URLs.
        if (body && response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
            const baseUrl = new URL(target).origin;
            
            // Fix 1: Inject the base tag to tell the browser where relative paths should point
            const baseTag = `<base href="${baseUrl}/">`;
            body = body.replace(/<head\s*[^>]*>/i, `$&${baseTag}`);
            
            // Fix 2: AGGRESSIVE RELATIVE URL REWRITING (Ensures images/CSS load)
            const regex = /(src|href|url)\s*=\s*['"](\/[^'"])/gi;
            body = body.replace(regex, (match, p1, p2) => {
                return `${p1}="${baseUrl}${p2}`;
            });

            console.log('Successfully stripped headers, injected base tag, and fixed relative URLs.');
        }
        
        // 3. SEND THE MODIFIED RESPONSE
        res.writeHead(response.statusCode, response.headers);
        res.end(body);
        
    }).on('error', (err) => {
        console.error('Shit, proxy error during streaming:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Fucking streaming error on the back end.');
    });

    return; // Exit the request handler
  }
  
  // === BLOCK 3: Handle 404 for anything else ===
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 - Not Found, you fucking idiot.');
}); // End of http.createServer

