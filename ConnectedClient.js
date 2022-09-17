const crypto = require('crypto');

const redis = require('redis');
const createClient = redis.createClient;

const redisUrl = 'redis://red-cceg4emn6mpt4gqstar0:6379';
const localRedisUrl = 'redis://127.0.0.1:6379';

const CREATE_LOBBY = 'create lobby';
const SERVER_CREATED_LOBBY = 'server created lobby';

const JOIN_LOBBY = 'join lobby';
const SERVER_CLIENT_JOINED = 'server client joined';

const POSITION_UPDATE = 'position update';
const ROTATION_UPDATE = 'rotation update';

const SERVER_POSITION_UPDATE = 'server position update';

module.exports = class ConnectedClient {
	constructor(clientInstance, gameServer) {
		this.redis = createClient({ url: process.env.NODE_ENV === 'prod' ? redisUrl : localRedisUrl });
		// a redis channel just for position
		// a redis channel just for rotation
		// for each lobby
		// two channels
		// maybe a third for game play events
		this.subscriber = null;

		this.clientId = crypto.randomUUID();
		this.lobbyId = null;
		this.instance = clientInstance;
		this.server = gameServer;

		this.createLobby = this.createLobby.bind(this);
		this.onMessage = this.onMessage.bind(this);
		this.handleSubscription = this.handleSubscription.bind(this);
		this.update = this.update.bind(this);
		this.establishConnection = this.establishConnection.bind(this);

		this.instance.on('message', this.onMessage);
	}

	async establishConnection() {
		await this.redis.connect();
		this.subscriber = this.redis.duplicate();
		await this.subscriber.connect();

		this.instance.send(JSON.stringify({ type: 'handshake', payload: this.clientId }));

		console.log('new connection', this.clientId);
	}

	update() {
		console.log('update for', this.clientId);
		if (this.lobbyId) {
			const message = JSON.stringify({
				type: SERVER_POSITION_UPDATE,
				payload: { clientId: this.clientId, position: this.position },
			});
			this.redis.publish(this.lobbyId, message);
		}
	}

	onMessage(message) {
		const event = JSON.parse(message);
		switch (event.type) {
			case CREATE_LOBBY:
				const lobby = this.createLobby(event.payload);
				console.log('just finished creating lobby', lobby.id);
				break;

			case JOIN_LOBBY:
				this.joinLobby(event.payload);
				console.log('joining lobby', event.payload);
				break;

			case POSITION_UPDATE:
				const position = event.payload;
				this.position = position;
				break;
		}
	}

	handleSubscription(message, channel) {
		this.instance.send(message);
	}

	createLobby(name) {
		const key = crypto.randomUUID();
		this.subscriber.subscribe(key, this.handleSubscription);

		const message = JSON.stringify({
			type: SERVER_CREATED_LOBBY,
			payload: { name, lobbyId: key, clientId: this.clientId },
		});

		this.redis.publish(key, message);

		this.lobbyId = key;
		return { id: key, name };
	}

	joinLobby(lobbyId) {
		this.lobbyId = lobbyId;
		this.subscriber.subscribe(lobbyId, this.handleSubscription);

		const message = JSON.stringify({
			type: SERVER_CLIENT_JOINED,
			payload: { clientId: this.clientId, lobbyId: lobbyId },
		});
		this.redis.publish(lobbyId, message);
	}
};
