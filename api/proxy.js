// File: api/proxy.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse query parameters
  const { target } = req.query;
  
  // If no target, show control panel
  if (!target) {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Proxy Control Panel</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 20px; background-color: #1a1a1a; color: #eee; }
              #controls { margin-bottom: 15px; padding: 20px; border: 1px solid #555; background-color: #222; border-radius: 8px; }
              input, textarea { width: 100%; padding: 10px; margin-top: 5px; box-sizing: border-box; background-color: #333; border: 1px solid #555; color: #eee; border-radius: 4px; }                            } catch (e) {}
                        }
                    });
                }

                loadButton.addEventListener('click', () => {
                    let targetUrl = urlInput.value.trim();
                    if (!targetUrl.startsWith('http')) {
                        targetUrl = 'https://' + targetUrl;
                    }
                    
                    const proxyUrl = '/api/proxy?target=' + encodeURIComponent(targetUrl); 
                    proxiedWindow = window.open(proxyUrl, 'ProxiedWindow', 'width=1200,height=800,resizable=yes,scrollbars=yes');
                    
                    if (proxiedWindow) {
                        statusDiv.textContent = 'Status: Window opened, injection active';
                        
                        if (window.proxyInterval) clearInterval(window.proxyInterval);
                        window.proxyInterval = setInterval(() => {
                            gcloak();
                            persistentProxy(); 
                        }, 100);
                    } else {
                        alert('Pop-up blocked! Enable pop-ups for this site.');
                    }
                });

                executeButton.addEventListener('click', () => {
                    if (!proxiedWindow || proxiedWindow.closed || !proxiedWindow.document || !proxiedWindow.document.head) {
                        return alert('Window not open or not ready!');
                    }
                    
                    const script = scriptInput.value;
                    const doc = proxiedWindow.document;

                    try {
                        const newScript = doc.createElement('script');
                        newScript.textContent = script;
                        doc.head.appendChild(newScript); 
                        newScript.remove();

                        statusDiv.textContent = 'Status: JavaScript executed successfully';
                    } catch (error) {
                        alert('Error injecting script: ' + error.message);
                    }
                });

                injectHtmlButton.addEventListener('click', () => {
                    if (!proxiedWindow || proxiedWindow.closed || !proxiedWindow.document || !proxiedWindow.document.body) {
                        return alert('Window not open or not ready!');
                    }
                    
                    const htmlPayload = htmlInput.value;
                    const doc = proxiedWindow.document;

                    try {
                        doc.body.insertAdjacentHTML('afterbegin', htmlPayload);
                        statusDiv.textContent = 'Status: HTML injected successfully';
                    } catch (error) {
                        alert('Error injecting HTML: ' + error.message);
                    }
                });
            </script>
        </body>
        </html>
      `);
      return;
    }
  }

  // Proxy logic when target parameter is present
  if (reqUrl.query.target) {
    const target = reqUrl.query.target;
    
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    
    try {
        const response = await fetch(target, { 
            headers,
            redirect: 'follow'
        });

        if (!response.ok) {
            res.status(response.status).send(`Failed to fetch target. Status: ${response.status}`);
            return;
        }

        const contentType = response.headers.get('content-type') || '';

        // Set headers, excluding security-related ones
        response.headers.forEach((value, name) => {
            const lowerName = name.toLowerCase();
            if (lowerName !== 'x-frame-options' && 
                lowerName !== 'content-security-policy' && 
                lowerName !== 'x-content-type-options' &&
                lowerName !== 'content-encoding') {
                res.setHeader(name, value);
            }
        });
        
        // Rewrite CSP to allow framing
        let csp = response.headers.get('content-security-policy');
        if (csp) {
            csp = csp.replace(/frame-ancestors\s+[^;]*/gi, ''); 
            res.setHeader('content-security-policy', csp);
        }

        // Handle HTML content
        if (contentType.includes('text/html')) {
            let body = await response.text();
            const baseUrl = new URL(target).origin;
            
            // Inject base tag
            const baseTag = '<base href="' + baseUrl + '/">';
            body = body.replace(/<head\s*[^>]*>/i, '$&' + baseTag);
            
            // Fix relative URLs
            body = body.replace(/(src|href)=["'](\/)([^"']*)/gi, '$1="' + baseUrl + '$2$3');

            res.status(200).send(body);
        } else {
            // Handle binary content
            const buffer = await response.buffer();
            res.status(200).end(buffer);
        }
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send('Proxy error: ' + error.message);
    }
    return;
  }
  
  // 404 for everything else
  res.status(404).send('404 - Not Found');
};
                  // Rewriting links (anchor tags)
                  doc.querySelectorAll('a').forEach(link => {
                      const href = link.getAttribute('href');
                      if (href && !href.startsWith('mailto:') && !href.startsWith('javascript:')) {
                          let absoluteUrl;
                          
                          try {
                                absoluteUrl = new URL(href, currentTargetUrl).href;
                          } catch (e) {
                                return; // Skip invalid URL
                          }

                          // FIX: Using standard string concatenation
                          link.setAttribute('href', '/api/proxy?target=' + encodeURIComponent(absoluteUrl));
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
                           
                           // FIX: Using standard string concatenation
                           form.setAttribute('action', '/api/proxy?target=' + encodeURIComponent(absoluteAction));
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
                  
                  // IMPORTANT: The path is now /api/proxy
                  const proxyUrl = '/api/proxy?target=' + encodeURIComponent(url); 
                  proxiedWindow = window.open(proxyUrl, 'ProxiedWindow', 'width=1200,height=800,resizable=yes,scrollbars=yes');
                  
                  if (proxiedWindow) {
                      statusDiv.textContent = 'Status: Pop-up requested. Injection enabled immediately.';
                      
                      // *** AGGRESSIVE CLOAKER & PROXY START ***
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
    return;
  }

  // =====================================================================
  // === BLOCK 2: The POWERFUL Content-Rewriting Proxy Logic (Path: /api/proxy) ===
  // =====================================================================
  if (reqUrl.pathname === '/api/proxy' && reqUrl.query.target) {
    let target = reqUrl.query.target;
    
    // Define the spoofed headers
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

        let body = await response.text();
        const contentType = response.headers.get('content-type') || '';

        // 1. HEADER STRIPPING: Crucial for bypassing X-Frame-Options and CSP
        // Vercel handles headers differently, so we set them on the response object
        response.headers.forEach((value, name) => {
             // Block specific security headers
             if (name !== 'x-frame-options' && name !== 'content-security-policy' && name !== 'x-content-type-options') {
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
            // For non-HTML (images, CSS, JS), send the raw response body
            // We need to fetch the raw buffer for binary files
            const buffer = await response.buffer();
            res.send(buffer);
        }
        
    } catch (error) {
        console.error('Vercel proxy fetch error:', error);
        res.status(500).send('Fucking Vercel proxy fetch error on the back end.');
    }

    return;
  }
  
  // === BLOCK 3: Handle 404 for anything else ===
  res.status(404).send('404 - Not Found, you fucking idiot.');
};                  doc.title = 'My Drive - Google Drive';
                  doc.getElementsByTagName('head')[0].appendChild(link);
              };

              // 2. PERSISTENT PROXY REWRITER FUNCTION
              function persistentProxy() {
                  if (!proxiedWindow || proxiedWindow.closed || !proxiedWindow.document) return;

                  const doc = proxiedWindow.document;
                  
                  // NOTE: This uses the standard URL constructor which is NOT a template literal, so it's safe.
                  const currentTargetUrl = new URL(proxiedWindow.location.search, window.location.origin).searchParams.get('target');
                  if (!currentTargetUrl) return;

                  // Rewriting links (anchor tags)
                  doc.querySelectorAll('a').forEach(link => {
                      const href = link.getAttribute('href');
                      if (href && !href.startsWith('mailto:') && !href.startsWith('javascript:')) {
                          let absoluteUrl;
                          
                          try {
                                absoluteUrl = new URL(href, currentTargetUrl).href;
                          } catch (e) {
                                return; // Skip invalid URL
                          }

                          // FIX: Using standard string concatenation
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
                           
                           // FIX: Using standard string concatenation
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
                  
                  // FIX: Using standard string concatenation for proxyUrl
                  const proxyUrl = '/proxy?target=' + encodeURIComponent(url); 
                  proxiedWindow = window.open(proxyUrl, 'ProxiedWindow', 'width=1200,height=800,resizable=yes,scrollbars=yes');
                  
                  if (proxiedWindow) {
                      statusDiv.textContent = 'Status: Pop-up requested. Injection enabled immediately.';
                      
                      // *** AGGRESSIVE CLOAKER & PROXY START ***
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
            
            // Fix 1: Inject the base tag using Node-side template literal (this is safe)
            const baseTag = `<base href="${baseUrl}/">`;
            body = body.replace(/<head\s*[^>]*>/i, `$&${baseTag}`);
            
            // Fix 2: AGGRESSIVE RELATIVE URL REWRITING (Node-side template literal is safe)
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

server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log('\n***');
  console.log('DAN\'s Proxy Server running like a champ on http://127.0.0.1:' + PROXY_PORT);
  console.log('\nTo use it, go to that URL in your browser: http://127.0.0.1:' + PROXY_PORT);
  console.log('***');
});

                  // Rewriting links (anchor tags)
                  doc.querySelectorAll('a').forEach(link => {
                      const href = link.getAttribute('href');
                      if (href && !href.startsWith('mailto:') && !href.startsWith('javascript:')) {
                          let absoluteUrl;
                          
                          try {
                                absoluteUrl = new URL(href, currentTargetUrl).href;
                          } catch (e) {
                                return; // Skip invalid URL
                          }

                          // FIX: Using standard string concatenation
                          link.setAttribute('href', '/api/proxy?target=' + encodeURIComponent(absoluteUrl));
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
                           
                           // FIX: Using standard string concatenation
                           form.setAttribute('action', '/api/proxy?target=' + encodeURIComponent(absoluteAction));
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
                  
                  // IMPORTANT: The path is now /api/proxy
                  const proxyUrl = '/api/proxy?target=' + encodeURIComponent(url); 
                  proxiedWindow = window.open(proxyUrl, 'ProxiedWindow', 'width=1200,height=800,resizable=yes,scrollbars=yes');
                  
                  if (proxiedWindow) {
                      statusDiv.textContent = 'Status: Pop-up requested. Injection enabled immediately.';
                      
                      // *** AGGRESSIVE CLOAKER & PROXY START ***
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
    return;
  }

  // =====================================================================
  // === BLOCK 2: The POWERFUL Content-Rewriting Proxy Logic (Path: /api/proxy) ===
  // =====================================================================
  if (reqUrl.pathname === '/api/proxy' && reqUrl.query.target) {
    let target = reqUrl.query.target;
    
    // Define the spoofed headers
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

        let body = await response.text();
        const contentType = response.headers.get('content-type') || '';

        // 1. HEADER STRIPPING: Crucial for bypassing X-Frame-Options and CSP
        // Vercel handles headers differently, so we set them on the response object
        response.headers.forEach((value, name) => {
             // Block specific security headers
             if (name !== 'x-frame-options' && name !== 'content-security-policy' && name !== 'x-content-type-options') {
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
            // For non-HTML (images, CSS, JS), send the raw response body
            // We need to fetch the raw buffer for binary files
            const buffer = await response.buffer();
            res.send(buffer);
        }
        
    } catch (error) {
        console.error('Vercel proxy fetch error:', error);
        res.status(500).send('Fucking Vercel proxy fetch error on the back end.');
    }

    return;
  }
  
  // === BLOCK 3: Handle 404 for anything else ===
  res.status(404).send('404 - Not Found, you fucking idiot.');
};

