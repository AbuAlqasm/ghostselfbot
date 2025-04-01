/**
 * Client class for handling Discord user account connections
 * @module Client
 * @copyright GhostNet Team 2025-2026
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const axios = require('axios');
const Constants = require('../util/Constants');
const User = require('../structures/User');
const Guild = require('../structures/Guild');
const Channel = require('../structures/Channel');
const Message = require('../structures/Message');
const Util = require('../util/Util');
const RESTManager = require('../rest/RESTManager');

/**
 * The main client for interacting with the Discord API
 * @extends {EventEmitter}
 */
class Client extends EventEmitter {
  /**
   * Create a new Discord client
   * @param {Object} options - Options for the client
   */
  constructor(options = {}) {
    super();
    
    /**
     * The options the client was instantiated with
     * @type {ClientOptions}
     */
    this.options = {
      presence: {},
      ws: {
        large_threshold: 250,
        compress: false,
        properties: {
          $os: process.platform,
          $browser: 'GhostSelfBot',
          $device: 'GhostSelfBot'
        },
        version: 9,
      },
      restRequestTimeout: 15000,
      restTimeOffset: 500,
      restSweepInterval: 60000,
      retryLimit: 1,
      messageCacheMaxSize: 200,
      messageCacheLifetime: 0,
      messageSweepInterval: 0,
      ...options,
    };
    
    /**
     * The WebSocket connection
     * @type {?WebSocket}
     */
    this.ws = {
      ping: 0,
      lastHeartbeatAck: 0,
      lastHeartbeatSent: 0
    };
    
    /**
     * The REST Manager of the client
     * @type {RESTManager}
     */
    this.rest = new RESTManager(this);
    
    /**
     * The cache manager for the client
     * @type {?CacheManager}
     */
    this.cache = null;
    if (this.options.enableCache !== false) {
      const CacheManager = require('../util/CacheManager');
      this.cache = new CacheManager(this.options);
    }
    
    /**
     * API handler for the client
     * @type {Object}
     */
    this.api = null;
    
    /**
     * All guilds that the client is currently handling
     * @type {Map<string, Guild>}
     */
    this.guilds = new Map();
    
    /**
     * All channels that the client is currently handling
     * @type {Map<string, Channel>}
     */
    this.channels = new Map();
    
    /**
     * The user that the client is logged in as
     * @type {?User}
     */
    this.user = null;
    
    /**
     * A manager for the client's messages
     * @type {MessageManager}
     */
    const MessageManager = require('../managers/MessageManager');
    this.messages = new MessageManager(this);
    
    /**
     * The WebSocket connection status
     * @type {boolean}
     */
    this.connected = false;
    
    // Setup API
    const API = require('../rest/API');
    this.api = new API(this);
  }

  /**
   * Connect to Discord with a user token
   * @param {string} token - The user token to use
   * @returns {Promise<string>} A promise that resolves when the client is ready
   */
  login(token) {
    return new Promise((resolve, reject) => {
      if (!token || typeof token !== 'string') {
        throw new Error('TOKEN_INVALID');
      }

      this._token = token;
      
      // Format the token for authentication
      const formattedToken = token.startsWith('Bot ') ? token : token;
      
      // Setup API headers
      this._setupAPIHeaders(formattedToken);
      
      // Initialize REST manager
      this.rest.setToken(formattedToken);
      
      // Connect to the gateway
      this._connectToGateway()
        .then(() => {
          this.emit('debug', 'Logged in successfully');
          resolve(token);
        })
        .catch(err => {
          this.emit('error', err);
          reject(err);
        });
    });
  }

  /**
   * Setup API headers for requests
   * @param {string} token - The formatted token
   * @private
   */
  _setupAPIHeaders(token) {
    // Set up the axios default headers for all requests
    axios.defaults.headers.common['Authorization'] = token;
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    axios.defaults.headers.common['User-Agent'] = `GhostSelfBot (${Constants.LIBRARY_NAME}, ${Constants.VERSION})`;
  }

  /**
   * Connect to the Discord gateway
   * @private
   * @returns {Promise<void>}
   */
  _connectToGateway() {
    return new Promise((resolve, reject) => {
      // Get the WebSocket gateway URL
      axios.get(`${Constants.API.BASE}/gateway`)
        .then(response => {
          const gateway = response.data.url;
          
          // Create WebSocket connection
          this._ws = new WebSocket(`${gateway}/?v=${Constants.GATEWAY_VERSION}&encoding=json`);
          
          // Handle WebSocket events
          this._ws.on('open', this._onOpen.bind(this));
          this._ws.on('message', this._onMessage.bind(this));
          this._ws.on('error', this._onError.bind(this));
          this._ws.on('close', this._onClose.bind(this));
          
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * When the WebSocket opens
   * @private
   */
  _onOpen() {
    this.emit('debug', 'WebSocket connection established');
  }

  /**
   * When a message is received on the WebSocket
   * @param {string} data - The received data
   * @private
   */
  _onMessage(data) {
    let packet;
    try {
      packet = JSON.parse(data);
    } catch (err) {
      this.emit('error', new Error('WEBSOCKET_MESSAGE_PARSE_ERROR'));
      return;
    }

    this._sequence = packet.s ? packet.s : this._sequence;

    switch (packet.op) {
      case Constants.OPCodes.HELLO:
        this._heartbeatInterval = setInterval(() => {
          this._sendHeartbeat();
        }, packet.d.heartbeat_interval);
        this._identify();
        break;

      case Constants.OPCodes.HEARTBEAT_ACK:
        this.ws.lastHeartbeatAck = Date.now();
        this.ws.ping = this.ws.lastHeartbeatAck - this.ws.lastHeartbeatSent;
        this.emit('debug', `Heartbeat acknowledged, ping: ${this.ws.ping}ms`);
        break;

      case Constants.OPCodes.DISPATCH:
        this._handleDispatch(packet);
        break;
    }
  }

  /**
   * Send a heartbeat to the WebSocket
   * @private
   */
  _sendHeartbeat() {
    this._ws.send(JSON.stringify({
      op: Constants.OPCodes.HEARTBEAT,
      d: this._sequence
    }));
    this.ws.lastHeartbeatSent = Date.now();
    this.emit('debug', 'Heartbeat sent');
  }

  /**
   * Identify with the gateway
   * @private
   */
  _identify() {
    const identify = {
      op: Constants.OPCodes.IDENTIFY,
      d: {
        token: this._token,
        properties: {
          $os: process.platform,
          $browser: Constants.LIBRARY_NAME,
          $device: Constants.LIBRARY_NAME
        },
        compress: false,
        presence: this.options.presence
      }
    };

    this._ws.send(JSON.stringify(identify));
    this.emit('debug', 'Identify payload sent');
  }

  /**
   * Handle dispatch events
   * @param {Object} packet - The packet received
   * @private
   */
  _handleDispatch(packet) {
    const { t: event, d: data } = packet;
    
    switch (event) {
      case 'READY':
        this._sessionId = data.session_id;
        this.user = new User(this, data.user);
        this.connected = true;
        
        // Process guilds
        data.guilds.forEach(guild => {
          this.guilds.set(guild.id, new Guild(this, guild));
        });
        
        this.emit('ready');
        break;
      
      case 'MESSAGE_CREATE':
        // Use the MessageManager to build the message instance
        const message = this.messages._buildInstance(data);
        
        this.emit('message', message);
        break;
        
      // Handle other events...
      // You would need to implement handlers for all the events you want to support
    }
  }

  /**
   * Handle WebSocket errors
   * @param {Error} error - The error
   * @private
   */
  _onError(error) {
    this.emit('error', error);
  }

  /**
   * Handle WebSocket close
   * @param {number} code - The close code
   * @param {string} reason - The close reason
   * @private
   */
  _onClose(code, reason) {
    this.emit('debug', `WebSocket closed with code ${code} for reason: ${reason}`);
    
    // Clean up
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
    
    this.connected = false;
    
    // Try to reconnect based on the close code
    if (code === 1000) {
      this.emit('disconnect', {
        code,
        reason: 'Clean disconnect'
      });
    } else {
      // Attempt to reconnect
      setTimeout(() => {
        this.emit('debug', 'Attempting to reconnect...');
        this._connectToGateway().catch(err => {
          this.emit('error', err);
        });
      }, 5000);
    }
  }

  /**
   * Send a message to a channel
   * @param {string} channelId - The ID of the channel to send the message to
   * @param {string|Object} content - The content of the message
   * @returns {Promise<Message>}
   */
  sendMessage(channelId, content) {
    if (!channelId) throw new Error('CHANNEL_ID_REQUIRED');
    
    let data;
    if (typeof content === 'string') {
      data = { content };
    } else {
      data = content;
    }
    
    return axios.post(`${Constants.API.BASE}/channels/${channelId}/messages`, data)
      .then(response => {
        return new Message(this, response.data);
      });
  }

  /**
   * Destroy the client and close all connections
   */
  destroy() {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }
    
    if (this._ws) {
      this._ws.close(1000);
      this._ws = null;
    }
    
    this._token = null;
    this.connected = false;
    this.user = null;
  }
}

module.exports = Client; 