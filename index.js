const http = require('http');
const crypto = require('crypto');
const WebSocket = require('ws');

const express = require('express');

const app = express();
const server = http.createServer(app);

app.get('/health', (req, res) => {
	res.sendStatus(200);
});

const wss = new WebSocket.Server({ noServer: true });

const session = new Map();

wss.on('connection', (client) => {
	const uuid = crypto.randomUUID();
	session.set(uuid, client);

	client.send(JSON.stringify({ type: 'handshake', payload: { clientId: uuid } }));
	console.log('client connected', uuid);
});

server.on('upgrade', (req, socket, head) => {
	wss.handleUpgrade(req, socket, head, function done(ws) {
		wss.emit('connection', ws, req);
	});
});

const port = 3000;
server.listen(port, () => {
	console.log(`listening on *:${port}`);
});
