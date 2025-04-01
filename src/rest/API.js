/**
 * API routing handler for Discord REST API
 * @module API
 * @copyright GhostNet Team 2025-2026
 */

const Constants = require('../util/Constants');

/**
 * API Router for handling Discord REST API requests
 */
class API {
  /**
   * @param {Client} client - The client that instantiated this API handler
   */
  constructor(client) {
    /**
     * The client that instantiated this handler
     * @type {Client}
     */
    this.client = client;

    /**
     * The base API path
     * @type {string}
     */
    this.basePath = Constants.API.BASE;
  }

  /**
   * Create a route handler for a channels endpoint
   * @param {string} channelId - The channel ID
   * @returns {Object} The route handler
   */
  channels(channelId) {
    const route = this._createRoute(`/channels/${channelId}`);
    
    // Add specific channel route methods
    route.messages = (messageId) => {
      if (messageId) {
        const msgRoute = this._createRoute(`/channels/${channelId}/messages/${messageId}`);
        
        // Add reactions endpoints
        msgRoute.reactions = (emoji, userId = '@me') => {
          const reactionRoute = this._createRoute(`/channels/${channelId}/messages/${messageId}/reactions/${emoji}/${userId}`);
          return reactionRoute;
        };
        
        return msgRoute;
      }
      
      return this._createRoute(`/channels/${channelId}/messages`);
    };
    
    route.pins = (messageId) => {
      if (messageId) {
        return this._createRoute(`/channels/${channelId}/pins/${messageId}`);
      }
      return this._createRoute(`/channels/${channelId}/pins`);
    };
    
    return route;
  }

  /**
   * Create a route handler for a guilds endpoint
   * @param {string} guildId - The guild ID
   * @returns {Object} The route handler
   */
  guilds(guildId) {
    const route = this._createRoute(`/guilds/${guildId}`);
    
    // Add specific guild route methods
    route.members = (userId) => {
      if (userId) {
        return this._createRoute(`/guilds/${guildId}/members/${userId}`);
      }
      return this._createRoute(`/guilds/${guildId}/members`);
    };
    
    route.channels = () => this._createRoute(`/guilds/${guildId}/channels`);
    route.roles = (roleId) => {
      if (roleId) {
        return this._createRoute(`/guilds/${guildId}/roles/${roleId}`);
      }
      return this._createRoute(`/guilds/${guildId}/roles`);
    };
    
    return route;
  }

  /**
   * Create a route handler for a users endpoint
   * @param {string} userId - The user ID
   * @returns {Object} The route handler
   */
  users(userId = '@me') {
    const route = this._createRoute(`/users/${userId}`);
    
    // Add specific user route methods
    if (userId === '@me') {
      route.guilds = () => this._createRoute('/users/@me/guilds');
      route.settings = () => this._createRoute('/users/@me/settings');
    }
    
    return route;
  }

  /**
   * Create a route object with HTTP methods
   * @param {string} path - The API path
   * @returns {Object} The route handler with HTTP methods
   * @private
   */
  _createRoute(path) {
    const route = {};
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    
    for (const method of methods) {
      route[method] = (options = {}) => {
        return this.client.rest.make(method, path, options);
      };
    }
    
    return route;
  }
}

module.exports = API; 