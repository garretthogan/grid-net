const http = require('http');
const express = require('express');

const GameServer = require('./GameServer');
const gameServer = new GameServer();

const app = express();
app.get('/health', (req, res) => {
	res.sendStatus(200);
});

app.get('/', (req, res) => {
	res.sendStatus(200);
});

const server = http.createServer(app);
server.on('upgrade', gameServer.handleUpgrade);

const port = process.env.PORT || 3000;
server.listen(port, async () => {
	console.log(`listening on *:${port}`);
});
