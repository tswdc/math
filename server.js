const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

require('dotenv').config();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY || '';
const ROOT_DIR = __dirname;

// Validate API key is loaded
if (!API_KEY) {
    console.error('❌ Error: API key not loaded from .env');
    console.error('Please create a .env file with: GEMINI_API_KEY=your_key');
    console.error('You can copy from .env.example and add your Gemini API key');
    process.exit(1);
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.json': 'application/json; charset=utf-8'
};

function sendJson(res, statusCode, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Access-Control-Allow-Origin': '*'
    });
    res.end(body);
}

function serveStaticFile(req, res) {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(requestUrl.pathname);

    const safePath = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.join(ROOT_DIR, safePath);

    if(!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (error, data) => {
        if(error) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
            'Content-Type': contentType
        });
        res.end(data);
    });
}

async function handleGeminiProxy(req, res) {
    if(req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    if(req.method !== 'POST') {
        sendJson(res, 405, { error: 'Method not allowed' });
        return;
    }

    if(!API_KEY) {
        sendJson(res, 500, { error: 'Missing GEMINI_API_KEY' });
        return;
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
        if(body.length > 1_000_000) {
            req.destroy();
        }
    });

    req.on('end', async () => {
        try {
            const parsed = JSON.parse(body || '{}');
            const model = parsed.model || 'gemini-flash-lite-latest';
            const prompt = parsed.prompt;

            if(!prompt) {
                sendJson(res, 400, { error: 'Missing prompt' });
                return;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.6,
                        maxOutputTokens: 5000
                    }
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if(!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API error:', errorText);
                sendJson(res, response.status, { error: errorText || 'Gemini request failed' });
                return;
            }

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if(!text) {
                sendJson(res, 502, { error: 'No text returned from Gemini' });
                return;
            }
            console.log("Request Prompt:", prompt);
            console.log('Gemini API response:', text);
            sendJson(res, 200, { text });
        } catch (error) {
            if(error.name === 'AbortError') {
                sendJson(res, 504, { error: 'Request timeout' });
            } else {
                sendJson(res, 500, { error: 'Proxy error' });
            }
        }
    });
    
    req.on('error', () => {
        sendJson(res, 400, { error: 'Bad request' });
    });
}

const server = http.createServer((req, res) => {
    if(req.url && req.url.startsWith('/api/gemini')) {
        handleGeminiProxy(req, res);
        return;
    }

    serveStaticFile(req, res);
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
