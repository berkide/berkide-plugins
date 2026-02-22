// JSON-RPC 2.0 client for Language Server Protocol communication
// Language Server Protocol iletisimi icin JSON-RPC 2.0 istemcisi
//
// LSP servers communicate via stdin/stdout using JSON-RPC 2.0 with Content-Length headers.
// LSP sunuculari Content-Length basliklariyla JSON-RPC 2.0 kullanarak stdin/stdout uzerinden iletisim kurar.

let nextId = 1;
const pendingRequests = new Map();
const notificationHandlers = new Map();

// Encode a JSON-RPC message with Content-Length header
// Content-Length basligiyla bir JSON-RPC mesajini kodla
export function encode(message) {
    const body = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength?.(body) || body.length}\r\n\r\n`;
    return header + body;
}

// Send a request to the language server (expects a response)
// Dil sunucusuna bir istek gonder (yanit bekler)
export function sendRequest(serverProcess, method, params) {
    const id = nextId++;
    const message = {
        jsonrpc: "2.0",
        id,
        method,
        params: params || {},
    };

    return new Promise((resolve, reject) => {
        pendingRequests.set(id, { resolve, reject, method });
        const encoded = encode(message);
        serverProcess.stdin?.write?.(encoded);
    });
}

// Send a notification to the language server (no response expected)
// Dil sunucusuna bir bildirim gonder (yanit beklenmez)
export function sendNotification(serverProcess, method, params) {
    const message = {
        jsonrpc: "2.0",
        method,
        params: params || {},
    };
    const encoded = encode(message);
    serverProcess.stdin?.write?.(encoded);
}

// Register a handler for server notifications
// Sunucu bildirimleri icin bir isleyici kaydet
export function onNotification(method, handler) {
    notificationHandlers.set(method, handler);
}

// Handle incoming data from language server stdout
// Dil sunucusu stdout'undan gelen veriyi isle
let buffer = "";

export function handleData(data) {
    buffer += data;

    while (true) {
        // Find Content-Length header
        // Content-Length basligini bul
        const headerEnd = buffer.indexOf("\r\n\r\n");
        if (headerEnd === -1) break;

        const header = buffer.substring(0, headerEnd);
        const match = header.match(/Content-Length: (\d+)/);
        if (!match) {
            buffer = buffer.substring(headerEnd + 4);
            continue;
        }

        const contentLength = parseInt(match[1]);
        const bodyStart = headerEnd + 4;
        const bodyEnd = bodyStart + contentLength;

        if (buffer.length < bodyEnd) break; // Not enough data yet

        const body = buffer.substring(bodyStart, bodyEnd);
        buffer = buffer.substring(bodyEnd);

        try {
            const message = JSON.parse(body);
            handleMessage(message);
        } catch (e) {
            console.log("[lsp] JSON parse error: " + e.message);
        }
    }
}

// Route incoming message to the correct handler
// Gelen mesaji dogru isleyiciye yonlendir
function handleMessage(message) {
    // Response to a request
    // Bir istege yanit
    if (message.id !== undefined && (message.result !== undefined || message.error !== undefined)) {
        const pending = pendingRequests.get(message.id);
        if (pending) {
            pendingRequests.delete(message.id);
            if (message.error) {
                pending.reject(message.error);
            } else {
                pending.resolve(message.result);
            }
        }
        return;
    }

    // Server notification
    // Sunucu bildirimi
    if (message.method) {
        const handler = notificationHandlers.get(message.method);
        if (handler) {
            handler(message.params);
        }
        return;
    }
}

// Reset client state
// Istemci durumunu sifirla
export function reset() {
    nextId = 1;
    pendingRequests.clear();
    buffer = "";
}
