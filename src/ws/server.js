import { WebSocket, WebSocketServer } from "ws"
import { wsArcjet } from "../arcjet.js";

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


    wss.on('connection', async (socket, req) => {

        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);

                if (decision.isDenied()) {
                    const code = decision.reason.isRateLimit() ? 1013 : 1008;

                    const reason = decision.reason.isRateLimit() ? 'Rate limit exceeded' : 'Access denied';
                    socket.close(code, reason);
                }
            } catch (e) {
                console.log('WS connection error', e);
                socket.close(1011, 'Server security error');
                return;
            }
        }

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