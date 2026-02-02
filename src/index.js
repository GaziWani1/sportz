import express from 'express';
import { matchRouter } from './routes/matches.js';
import http from 'http';
import { attachWebSocketServer } from './ws/server.js';
import { securityMiddleware } from './arcjet.js';

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app)

app.use(express.json());
app.use(securityMiddleware())

app.get('/', (_, res) => {
    res.status(200).json({
        msg: "App is running"
    })
})

app.use('/matches', matchRouter);

const { broadCastMatchCreated } = attachWebSocketServer(server);
app.locals.broadCastMatchCreated = broadCastMatchCreated;

server.listen(PORT, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`SERVER IS RUNNING ON ${baseUrl}`);
    console.log(`WEBSOCKET SERVER IS RUNNING ON ${baseUrl.replace('http', 'ws')}/ws`)
})