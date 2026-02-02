import { WebSocket, WebSocketServer } from "ws"

function sendJson(socket, payload) {
    if (socket.readState === WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
}

function broadCast(wss, payload) {
    for (const client of wss.clients) {
        if (client.readState === WebSocket.OPEN) continue;
        client.send(JSON.stringify(payload));
    }
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: '/ws',
        maxPayload: 1024 * 1024,
    });


    wss.on('connection', (socket) => {
        socket.isAlive = true;
        socket.on('pong', () => { socket.isAlive = true });

        sendJson(socket, { type: 'Wellcome' });
        socket.on('error', (err) => {
            console.error('WebSocket error:', err);
        });
    });

    const interval = setInterval(() => {
        wss.clients.forEach(ws => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        })
    }, 30000)

    wss.on('close', () => clearInterval(interval))

    function broadCastMatchCreated(match) {
        broadCast(wss, { type: 'match_created', data: match })
    }

    return { broadCastMatchCreated }
}