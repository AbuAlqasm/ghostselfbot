/**
 * Represents a channel on Discord
 * @module Channel
 * @copyright GhostNet Team 2025-2026
 */

const Constants = require('../util/Constants');

/**
 * Represents a channel on Discord
 */
class Channel {
  /**
   * @param {Client} client - The client that instantiated this channel
   * @param {Object} data - The data for the channel
   */
  constructor(client, data) {
    /**
     * The client that instantiated this channel
     * @type {Client}
     */
    this.client = client;

    this._patch(data);
  }

  /**
   * Patch channel data
   * @param {Object} data - The data to patch
   * @private
   */
  _patch(data) {
    /**
     * The ID of the channel
     * @type {string}
     */
    this.id = data.id;

    /**
     * The type of the channel
     * @type {number}
     */
    this.type = data.type;

    /**
     * The ID of the guild the channel is in, if applicable
     * @type {?string}
     */
    this.guildId = data.guild_id || null;

    /**
     * The name of the channel
     * @type {?string}
     */
    this.name = data.name || null;

    /**
     * The position of the channel in the guild, if applicable
     * @type {?number}
     */
    this.position = typeof data.position === 'number' ? data.position : null;

    /**
     * The channel topic, if applicable
     * @type {?string}
     */
    this.topic = data.topic || null;

    /**
     * Whether the channel is NSFW
     * @type {boolean}
     */
    this.nsfw = Boolean(data.nsfw);

    /**
     * The last message ID sent in the channel, if applicable
     * @type {?string}
     */
    this.lastMessageId = data.last_message_id || null;

    /**
     * The bitrate of the channel, if applicable
     * @type {?number}
     */
    this.bitrate = data.bitrate || null;

    /**
     * The user limit of the channel, if applicable
     * @type {?number}
     */
    this.userLimit = data.user_limit || null;

    /**
     * The rate limit per user in the channel, if applicable
     * @type {?number}
     */
    this.rateLimitPerUser = data.rate_limit_per_user || null;

    /**
     * The recipients of the channel, if applicable
     * @type {?Object[]}
     */
    this.recipients = data.recipients ? data.recipients.map(user => this.client.users.add(user)) : null;

    /**
     * The icon hash of the channel, if applicable
     * @type {?string}
     */
    this.icon = data.icon || null;

    /**
     * The ID of the owner of the channel, if applicable
     * @type {?string}
     */
    this.ownerId = data.owner_id || null;

    /**
     * The ID of the application that created the channel, if applicable
     * @type {?string}
     */
    this.applicationId = data.application_id || null;

    /**
     * The ID of the parent channel, if applicable
     * @type {?string}
     */
    this.parentId = data.parent_id || null;

    /**
     * The timestamp the channel was last pinned at, if applicable
     * @type {?number}
     */
    this.lastPinTimestamp = data.last_pin_timestamp ? new Date(data.last_pin_timestamp).getTime() : null;
  }

  /**
   * Gets the guild of the channel, if applicable
   * @type {?Guild}
   * @readonly
   */
  get guild() {
    return this.guildId ? this.client.guilds.get(this.guildId) || null : null;
  }

  /**
   * Gets the parent channel of the channel, if applicable
   * @type {?Channel}
   * @readonly
   */
  get parent() {
    return this.parentId ? this.client.channels.get(this.parentId) || null : null;
  }

  /**
   * Gets the owner of the channel, if applicable
   * @type {?User}
   * @readonly
   */
  get owner() {
    return this.ownerId ? this.client.users.get(this.ownerId) || null : null;
  }

  /**
   * Gets the URL of the channel
   * @type {string}
   * @readonly
   */
  get url() {
    return `https://discord.com/channels/${this.guildId || '@me'}/${this.id}`;
  }

  /**
   * Whether the channel is a text channel
   * @type {boolean}
   * @readonly
   */
  get isText() {
    return this.type === Constants.ChannelTypes.GUILD_TEXT || this.type === Constants.ChannelTypes.DM || this.type === Constants.ChannelTypes.GUILD_NEWS;
  }

  /**
   * Whether the channel is a DM
   * @type {boolean}
   * @readonly
   */
  get isDM() {
    return this.type === Constants.ChannelTypes.DM;
  }

  /**
   * Whether the channel is a voice channel
   * @type {boolean}
   * @readonly
   */
  get isVoice() {
    return this.type === Constants.ChannelTypes.GUILD_VOICE || this.type === Constants.ChannelTypes.GUILD_STAGE_VOICE;
  }

  /**
   * Fetch the channel
   * @returns {Promise<Channel>}
   */
  fetch() {
    return this.client.api.channels(this.id).get()
      .then(data => {
        this._patch(data);
        return this;
      });
  }

  /**
   * Send a message to the channel
   * @param {string|Object} content - The content of the message
   * @returns {Promise<Message>}
   */
  send(content) {
    if (!this.isText) {
      return Promise.reject(new Error('CHANNEL_NOT_TEXT'));
    }
    
    let data;
    if (typeof content === 'string') {
      data = { content };
    } else {
      data = content;
    }
    
    // Use client's sendMessage method if available
    if (typeof this.client.sendMessage === 'function') {
      return this.client.sendMessage(this.id, data);
    }
    
    // Otherwise fallback to direct API request
    const Message = require('./Message');
    return this.client.rest.post(`/channels/${this.id}/messages`, data)
      .then(response => {
        return new Message(this.client, response);
      })
      .catch(error => {
        console.error(`Error sending message to channel ${this.id}:`, error);
        throw error;
      });
  }

  /**
   * Fetch all pinned messages in the channel
   * @returns {Promise<Message[]>}
   */
  fetchPinnedMessages() {
    if (!this.isText) {
      return Promise.reject(new Error('CHANNEL_NOT_TEXT'));
    }
    
    return this.client.api.channels(this.id).pins.get()
      .then(data => data.map(message => this.client.messages.add(message)));
  }

  /**
   * Bulk delete messages in the channel
   * @param {Message[]|string[]} messages - The messages to delete
   * @returns {Promise<Channel>}
   */
  bulkDelete(messages) {
    if (!this.isText) {
      return Promise.reject(new Error('CHANNEL_NOT_TEXT'));
    }
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Promise.reject(new Error('MESSAGES_MISSING'));
    }
    
    const messageIds = messages.map(message => message.id || message);
    
    return this.client.api.channels(this.id).messages['bulk-delete'].post({
      data: {
        messages: messageIds,
      },
    }).then(() => this);
  }

  /**
   * Get permissions for a user or role in the channel
   * @param {UserResolvable|RoleResolvable} userOrRole - The user or role
   * @returns {?Permissions}
   */
  permissionsFor(userOrRole) {
    if (this.isDM) {
      if (userOrRole.id === this.client.user.id) return new Permissions(Permissions.ALL);
      return new Permissions(0);
    }
    
    // Implementation would depend on the Permissions class
    return null;
  }

  /**
   * Returns a string representation of the channel
   * @returns {string}
   */
  toString() {
    return `<#${this.id}>`;
  }
}

module.exports = Channel; 