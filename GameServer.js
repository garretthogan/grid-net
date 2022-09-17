const WebSocket = require('ws');
const ConnectedClient = require('./ConnectedClient');

module.exports = class GameServer {
	constructor() {
		this.connectedClients = [];
		this.wss = new WebSocket.Server({ noServer: true });

		this.handleConnection = this.handleConnection.bind(this);
		this.handleUpgrade = this.handleUpgrade.bind(this);
		this.update = this.update.bind(this);

		this.wss.on('connection', this.handleConnection);

		setInterval(this.update, 100);
	}

	update() {
		this.connectedClients.map((c) => c.update());
	}

	handleConnection(client) {
		const newClient = new ConnectedClient(client, this);
		newClient.establishConnection();

		this.connectedClients.push(newClient);
	}

	handleUpgrade(req, socket, head) {
		this.wss.handleUpgrade(req, socket, head, (ws) => {
			this.wss.emit('connection', ws, req);
		});
	}
};
