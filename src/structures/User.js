/**
 * Represents a Discord user
 * @module User
 * @copyright GhostNet Team 2025-2026
 */

const Constants = require('../util/Constants');

/**
 * Represents a Discord user
 */
class User {
  /**
   * @param {Client} client - The client that instantiated this user
   * @param {Object} data - The data for the user
   */
  constructor(client, data) {
    /**
     * The client that instantiated this user
     * @type {Client}
     */
    this.client = client;

    this._patch(data);
  }

  /**
   * Patch user data
   * @param {Object} data - The data to patch
   * @private
   */
  _patch(data) {
    /**
     * The ID of the user
     * @type {string}
     */
    this.id = data.id;

    /**
     * The username of the user
     * @type {string}
     */
    this.username = data.username;

    /**
     * The discriminator of the user
     * @type {string}
     */
    this.discriminator = data.discriminator;

    /**
     * The global name (display name) of the user
     * @type {?string}
     */
    this.globalName = data.global_name || null;

    /**
     * The avatar hash of the user
     * @type {?string}
     */
    this.avatar = data.avatar;

    /**
     * Whether the user is a bot
     * @type {boolean}
     */
    this.bot = Boolean(data.bot);

    /**
     * Whether the user is an official Discord system user
     * @type {boolean}
     */
    this.system = Boolean(data.system);

    /**
     * Whether the user has two-factor authentication enabled
     * @type {boolean}
     */
    this.mfaEnabled = Boolean(data.mfa_enabled);

    /**
     * The banner hash of the user
     * @type {?string}
     */
    this.banner = data.banner || null;

    /**
     * The accent color of the user's banner
     * @type {?number}
     */
    this.accentColor = data.accent_color || null;

    /**
     * The locale of the user
     * @type {?string}
     */
    this.locale = data.locale || null;

    /**
     * Whether the user's email has been verified
     * @type {boolean}
     */
    this.verified = Boolean(data.verified);

    /**
     * The email of the user (if the user is the client user)
     * @type {?string}
     */
    this.email = data.email ?? null;

    /**
     * The flags on the user's account
     * @type {number}
     */
    this.flags = data.flags ?? 0;

    /**
     * The premium type of the user
     * @type {number}
     */
    this.premiumType = data.premium_type ?? 0;

    /**
     * The public flags on the user's account
     * @type {number}
     */
    this.publicFlags = data.public_flags ?? 0;
  }

  /**
   * The tag of the user (username#discriminator)
   * @type {string}
   * @readonly
   */
  get tag() {
    return `${this.username}#${this.discriminator}`;
  }

  /**
   * The URL to the user's avatar
   * @param {Object} options - Options for the avatar URL
   * @param {string} [options.format='webp'] - The format of the avatar
   * @param {number} [options.size=128] - The size of the avatar
   * @param {boolean} [options.dynamic=true] - Whether to use a dynamic format
   * @returns {?string}
   */
  avatarURL({ format = 'webp', size = 128, dynamic = true } = {}) {
    if (!this.avatar) return null;
    
    if (dynamic) format = this.avatar.startsWith('a_') ? 'gif' : format;
    
    return `${Constants.API.CDN}/avatars/${this.id}/${this.avatar}.${format}?size=${size}`;
  }

  /**
   * The URL to the user's banner
   * @param {Object} options - Options for the banner URL
   * @param {string} [options.format='webp'] - The format of the banner
   * @param {number} [options.size=512] - The size of the banner
   * @param {boolean} [options.dynamic=true] - Whether to use a dynamic format
   * @returns {?string}
   */
  bannerURL({ format = 'webp', size = 512, dynamic = true } = {}) {
    if (!this.banner) return null;
    
    if (dynamic) format = this.banner.startsWith('a_') ? 'gif' : format;
    
    return `${Constants.API.CDN}/banners/${this.id}/${this.banner}.${format}?size=${size}`;
  }

  /**
   * The URL to the user's default avatar
   * @returns {string}
   */
  defaultAvatarURL() {
    const index = this.discriminator === '0' 
      ? parseInt(this.id) % 6 
      : parseInt(this.discriminator) % 5;
    return `${Constants.API.CDN}/embed/avatars/${index}.png`;
  }

  /**
   * The URL to the user's display avatar (custom avatar or default avatar)
   * @param {Object} options - Options for the avatar URL
   * @returns {string}
   */
  displayAvatarURL(options) {
    return this.avatarURL(options) || this.defaultAvatarURL();
  }

  /**
   * Get the user's presence status color
   * @returns {?number}
   */
  statusColor() {
    if (!this.presence) return null;
    
    switch (this.presence.status) {
      case 'online': return Constants.Colors.GREEN;
      case 'idle': return Constants.Colors.YELLOW;
      case 'dnd': return Constants.Colors.RED;
      default: return Constants.Colors.GREY;
    }
  }

  /**
   * Fetch the user's profile
   * @returns {Promise<Object>}
   */
  fetchProfile() {
    return this.client.api.users(this.id).profile.get();
  }

  /**
   * Send a DM to the user
   * @param {string|Object} content - The content of the message
   * @returns {Promise<Message>}
   */
  send(content) {
    return this.createDM().then(dm => dm.send(content));
  }

  /**
   * Creates a DM channel between the client and the user
   * @returns {Promise<DMChannel>}
   */
  createDM() {
    return this.client.api.users('@me').channels.post({
      data: {
        recipient_id: this.id
      }
    }).then(data => this.client.channels.add(data));
  }

  /**
   * Indicates whether this user is equal to another
   * @param {User} user - The user to compare with
   * @returns {boolean}
   */
  equals(user) {
    return (
      user &&
      this.id === user.id &&
      this.username === user.username &&
      this.discriminator === user.discriminator &&
      this.avatar === user.avatar
    );
  }

  /**
   * Sets the presence for the user (for selfbots, this will only work for the client user)
   * @param {Object} data - The presence data
   * @param {Object|Object[]} [data.activities] - The activities to set
   * @param {string} [data.status] - The status to set (online, idle, dnd, invisible)
   * @returns {Promise<Presence>}
   */
  setPresence(data) {
    if (this.id !== this.client.user.id) {
      return Promise.reject(new Error('You can only update the presence of the client user'));
    }
    
    // Format activities for the gateway
    const activities = data.activities ? 
      (Array.isArray(data.activities) ? data.activities : [data.activities]) : 
      [];
      
    // Format the presence data for the gateway
    const presenceData = {
      op: 3,
      d: {
        since: data.since || null,
        activities: activities,
        status: data.status || 'online',
        afk: Boolean(data.afk)
      }
    };
    
    // Send the presence update through the WebSocket
    if (this.client._ws && this.client.connected) {
      this.client._ws.send(JSON.stringify(presenceData));
      
      // Update local presence data
      this.presence = {
        status: data.status || 'online',
        activities: activities
      };
      
      return Promise.resolve(this.presence);
    } else {
      return Promise.reject(new Error('WebSocket is not connected'));
    }
  }

  /**
   * Returns a string representation of the user
   * @returns {string}
   */
  toString() {
    return `<@${this.id}>`;
  }
}

module.exports = User; 