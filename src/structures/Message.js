/**
 * Represents a message on Discord
 * @module Message
 * @copyright GhostNet Team 2025-2026
 */

const Constants = require('../util/Constants');
const User = require('./User');

/**
 * Represents a message on Discord
 */
class Message {
  /**
   * @param {Client} client - The client that instantiated this message
   * @param {Object} data - The data for the message
   */
  constructor(client, data) {
    /**
     * The client that instantiated this message
     * @type {Client}
     */
    this.client = client;

    /**
     * The channel that the message was sent in
     * @type {?Channel}
     */
    this.channel = null;
    
    /**
     * The ID of the channel the message was sent in
     * @type {string}
     */
    this.channelId = data.channel_id;
    
    /**
     * The ID of the guild the message was sent in, if any
     * @type {?string}
     */
    this.guildId = data.guild_id;
    
    /**
     * The ID of the message
     * @type {string}
     */
    this.id = data.id;
    
    /**
     * The author of the message
     * @type {User}
     */
    this.author = this.client.users 
      ? this.client.users.get(data.author.id) || new User(this.client, data.author)
      : new User(this.client, data.author);
    
    /**
     * The content of the message
     * @type {string}
     */
    this.content = data.content;
    
    /**
     * The timestamp the message was sent at
     * @type {number}
     */
    this.timestamp = new Date(data.timestamp).getTime();
    
    /**
     * The timestamp the message was last edited at (if it was edited)
     * @type {?number}
     */
    this.editedTimestamp = data.edited_timestamp 
      ? new Date(data.edited_timestamp).getTime() 
      : null;
    
    /**
     * Array of embeds in the message
     * @type {Array<Object>}
     */
    this.embeds = data.embeds || [];
    
    /**
     * Array of attachments in the message
     * @type {Array<Object>}
     */
    this.attachments = data.attachments || [];
    
    /**
     * Whether the message mentions everyone
     * @type {boolean}
     */
    this.mentionEveryone = Boolean(data.mention_everyone);
    
    /**
     * Array of users mentioned in the message
     * @type {Array<Object>}
     */
    this.mentions = data.mentions || [];
    
    /**
     * Array of role IDs mentioned in the message
     * @type {Array<string>}
     */
    this.mentionRoles = data.mention_roles || [];
    
    /**
     * Array of reactions to the message
     * @type {Array<Object>}
     */
    this.reactions = data.reactions || [];

    /**
     * Whether the message is pinned
     * @type {boolean}
     */
    this.pinned = Boolean(data.pinned);
    
    // Get the channel from cache if exists
    if (this.client.channels && this.client.channels.has(this.channelId)) {
      this.channel = this.client.channels.get(this.channelId);
    }
    
    // If this message is also in cache, update the cache
    if (this.client.cache) {
      this.client.cache.addMessage(this.id, this);
    }
  }

  /**
   * Gets the corresponding guild of the message, if any
   * @type {?Guild}
   * @readonly
   */
  get guild() {
    return this.guildId ? this.client.guilds.get(this.guildId) || null : null;
  }

  /**
   * The time the message was sent at
   * @type {Date}
   * @readonly
   */
  get createdAt() {
    return new Date(this.timestamp);
  }

  /**
   * The time the message was last edited at (if applicable)
   * @type {?Date}
   * @readonly
   */
  get editedAt() {
    return this.editedTimestamp ? new Date(this.editedTimestamp) : null;
  }

  /**
   * Whether the message was sent by a webhook
   * @type {boolean}
   * @readonly
   */
  get webhookId() {
    return this.author ? this.author.bot && this.author.discriminator === '0000' : false;
  }

  /**
   * Whether the message is deletable by the client user
   * @type {boolean}
   * @readonly
   */
  get deletable() {
    if (!this.guild) return this.author.id === this.client.user.id;
    
    // Check permissions and ownership
    const permissions = this.channel.permissionsFor(this.client.user);
    if (permissions.has('MANAGE_MESSAGES')) return true;
    return this.author.id === this.client.user.id;
  }

  /**
   * Whether the message is editable by the client user
   * @type {boolean}
   * @readonly
   */
  get editable() {
    return this.author.id === this.client.user.id;
  }

  /**
   * Reply to the message
   * @param {string|Object} content - The content of the message
   * @returns {Promise<Message>}
   */
  async reply(content) {
    if (!this.channel) {
      throw new Error('Cannot reply to a message without a valid channel');
    }
    
    let data;
    
    if (typeof content === 'string') {
      data = { content };
    } else {
      data = content;
    }
    
    data.message_reference = {
      message_id: this.id,
      channel_id: this.channelId,
      guild_id: this.guildId,
    };
    
    data.allowed_mentions = {
      replied_user: data.mention ? true : false,
    };
    
    try {
      return await this.channel.send(data);
    } catch (error) {
      // If channel.send fails, try using the MessageManager
      if (this.client.messages) {
        return await this.client.messages.send(this.channelId, data);
      }
      throw error;
    }
  }

  /**
   * Edit the message
   * @param {string|Object} content - The new content of the message
   * @returns {Promise<Message>}
   */
  edit(content) {
    if (!this.editable) {
      return Promise.reject(new Error('MESSAGE_NOT_EDITABLE'));
    }
    
    let data;
    
    if (typeof content === 'string') {
      data = { content };
    } else {
      data = content;
    }
    
    return this.client.api.channels(this.channelId).messages(this.id).patch({ data })
      .then(response => {
        const newMessage = new Message(this.client, response);
        return newMessage;
      });
  }

  /**
   * Delete the message
   * @param {Object} options - The options to delete the message
   * @param {number} [options.timeout=0] - The timeout in milliseconds
   * @param {string} [options.reason] - The reason for deleting the message
   * @returns {Promise<Message>}
   */
  delete({ timeout = 0, reason } = {}) {
    if (!this.deletable) {
      return Promise.reject(new Error('MESSAGE_NOT_DELETABLE'));
    }
    
    if (timeout > 0) {
      return new Promise(resolve => {
        setTimeout(() => {
          this.delete({ reason }).then(resolve).catch(resolve);
        }, timeout);
      });
    }
    
    return this.client.api.channels(this.channelId).messages(this.id).delete({ reason })
      .then(() => this);
  }

  /**
   * Pin the message to its channel
   * @param {Object} options - The options for pinning the message
   * @param {string} [options.reason] - The reason for pinning the message
   * @returns {Promise<Message>}
   */
  pin({ reason } = {}) {
    return this.client.api.channels(this.channelId).pins(this.id).put({ reason })
      .then(() => this);
  }

  /**
   * Unpin the message from its channel
   * @param {Object} options - The options for unpinning the message
   * @param {string} [options.reason] - The reason for unpinning the message
   * @returns {Promise<Message>}
   */
  unpin({ reason } = {}) {
    return this.client.api.channels(this.channelId).pins(this.id).delete({ reason })
      .then(() => this);
  }

  /**
   * Add a reaction to the message
   * @param {string} emoji - The emoji to react with
   * @returns {Promise<Message>}
   */
  react(emoji) {
    // Handle Unicode emoji
    if (emoji.includes('%')) {
      emoji = decodeURIComponent(emoji);
    }
    
    // Handle custom emoji
    if (emoji.includes(':')) {
      const [name, id] = emoji.split(':');
      emoji = `${name}:${id}`;
    }
    
    return this.client.api.channels(this.channelId).messages(this.id).reactions(emoji, '@me').put()
      .then(() => this);
  }

  /**
   * Creates a message collector for the message
   * @param {Object} options - The options for the collector
   * @returns {MessageCollector}
   */
  createReactionCollector(options = {}) {
    return new ReactionCollector(this, options);
  }
}

module.exports = Message; 