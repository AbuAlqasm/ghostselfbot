/**
 * Message manager for handling Discord messages
 * @module MessageManager
 * @copyright GhostNet Team 2025-2026
 */

const Message = require('../structures/Message');
const Channel = require('../structures/Channel');
const Constants = require('../util/Constants');

/**
 * Manages API methods for Messages and stores their cache
 */
class MessageManager {
  /**
   * @param {Client} client - The client that instantiated this manager
   */
  constructor(client) {
    /**
     * The client that instantiated this manager
     * @type {Client}
     */
    this.client = client;
  }

  /**
   * Build a Message instance from data
   * @param {Object} data - The message data
   * @returns {Message} The constructed Message
   * @private
   */
  _buildInstance(data) {
    // Ensure channel exists before creating message
    if (!this.client.channels.has(data.channel_id)) {
      // Create a channel for this message if it doesn't exist
      const channelData = {
        id: data.channel_id,
        type: data.guild_id ? Constants.ChannelTypes.GUILD_TEXT : Constants.ChannelTypes.DM
      };
      
      if (data.guild_id) {
        channelData.guild_id = data.guild_id;
      }
      
      const channel = new Channel(this.client, channelData);
      this.client.channels.set(data.channel_id, channel);
    }
    
    return new Message(this.client, data);
  }

  /**
   * Fetch a message from the API
   * @param {string} channelId - The channel ID to fetch from
   * @param {string} messageId - The message ID to fetch
   * @returns {Promise<Message>} The fetched message
   */
  async fetch(channelId, messageId) {
    const data = await this.client.api.channels(channelId).messages(messageId).get();
    return this._buildInstance(data);
  }

  /**
   * Send a message to a channel
   * @param {string} channelId - The channel ID to send to
   * @param {string|Object} content - The content of the message
   * @returns {Promise<Message>} The sent message
   */
  async send(channelId, content) {
    let data;
    
    if (typeof content === 'string') {
      data = { content };
    } else {
      data = content;
    }
    
    const messageData = await this.client.api.channels(channelId).messages.post({ data });
    return this._buildInstance(messageData);
  }
}

module.exports = MessageManager; 