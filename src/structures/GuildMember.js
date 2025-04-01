/**
 * Represents a member of a guild on Discord
 * @module GuildMember
 * @copyright GhostNet Team 2025-2026
 */

const User = require('./User');

/**
 * Represents a member of a guild on Discord
 */
class GuildMember {
  /**
   * @param {Client} client - The client that instantiated this guild member
   * @param {Guild} guild - The guild this member is part of
   * @param {Object} data - The data for the guild member
   */
  constructor(client, guild, data) {
    /**
     * The client that instantiated this guild member
     * @type {Client}
     */
    this.client = client;

    /**
     * The guild this member is part of
     * @type {Guild}
     */
    this.guild = guild;

    /**
     * The user this guild member represents
     * @type {User}
     */
    this.user = data.user ? new User(client, data.user) : null;

    this._patch(data);
  }

  /**
   * Patch guild member data
   * @param {Object} data - The data to patch
   * @private
   */
  _patch(data) {
    /**
     * The nickname of this member
     * @type {?string}
     */
    this.nickname = data.nick || null;

    /**
     * The timestamp this member joined the guild at
     * @type {?number}
     */
    this.joinedAt = data.joined_at ? new Date(data.joined_at).getTime() : null;

    /**
     * The timestamp this member started boosting the guild at
     * @type {?number}
     */
    this.premiumSince = data.premium_since ? new Date(data.premium_since).getTime() : null;

    /**
     * Whether the member is deafened in voice channels
     * @type {boolean}
     */
    this.deaf = Boolean(data.deaf);

    /**
     * Whether the member is muted in voice channels
     * @type {boolean}
     */
    this.mute = Boolean(data.mute);

    /**
     * Whether the member is pending verification
     * @type {boolean}
     */
    this.pending = Boolean(data.pending);

    /**
     * The roles of this member
     * @type {string[]}
     */
    this.roles = data.roles || [];
  }

  /**
   * The ID of this guild member
   * @type {string}
   * @readonly
   */
  get id() {
    return this.user.id;
  }

  /**
   * The time this member joined the guild
   * @type {Date}
   * @readonly
   */
  get joinedTimestamp() {
    return this.joinedAt ? new Date(this.joinedAt) : null;
  }

  /**
   * The time this member started boosting the guild
   * @type {Date}
   * @readonly
   */
  get premiumSinceTimestamp() {
    return this.premiumSince ? new Date(this.premiumSince) : null;
  }

  /**
   * The displayed name of this member
   * @type {string}
   * @readonly
   */
  get displayName() {
    return this.nickname || this.user.username;
  }

  /**
   * The displayed avatar URL of this member
   * @param {Object} options - Options for the avatar URL
   * @returns {string}
   */
  displayAvatarURL(options) {
    return this.user.displayAvatarURL(options);
  }

  /**
   * Whether this member is the client user
   * @type {boolean}
   * @readonly
   */
  get me() {
    return this.id === this.client.user.id;
  }

  /**
   * Whether this member is manageable by the client user
   * @type {boolean}
   * @readonly
   */
  get manageable() {
    if (this.id === this.guild.ownerId) return false;
    if (this.id === this.client.user.id) return false;
    
    // Will need to implement logic to check roles and permissions
    return true;
  }

  /**
   * Whether this member is kickable by the client user
   * @type {boolean}
   * @readonly
   */
  get kickable() {
    return this.manageable;
  }

  /**
   * Whether this member is bannable by the client user
   * @type {boolean}
   * @readonly
   */
  get bannable() {
    return this.manageable;
  }

  /**
   * Returns a mention of this guild member
   * @returns {string}
   */
  toString() {
    return `<@${this.nickname ? '!' : ''}${this.id}>`;
  }

  /**
   * Set the nickname of this guild member
   * @param {string} nick - The nickname
   * @param {string} [reason] - The reason for setting the nickname
   * @returns {Promise<GuildMember>}
   */
  setNickname(nick, reason) {
    const endpoint = this.id === this.client.user.id ?
      this.client.api.guilds(this.guild.id).members('@me').nick :
      this.client.api.guilds(this.guild.id).members(this.id);
      
    return endpoint.patch({
      data: { nick },
      reason,
    }).then(() => {
      this.nickname = nick;
      return this;
    });
  }

  /**
   * Add a role to this guild member
   * @param {RoleResolvable} role - The role to add
   * @param {string} [reason] - The reason for adding the role
   * @returns {Promise<GuildMember>}
   */
  addRole(role, reason) {
    const roleId = typeof role === 'string' ? role : role.id;
    
    if (this.roles.includes(roleId)) return Promise.resolve(this);
    
    return this.client.api.guilds(this.guild.id).members(this.id).roles(roleId).put({ reason })
      .then(() => {
        this.roles.push(roleId);
        return this;
      });
  }

  /**
   * Remove a role from this guild member
   * @param {RoleResolvable} role - The role to remove
   * @param {string} [reason] - The reason for removing the role
   * @returns {Promise<GuildMember>}
   */
  removeRole(role, reason) {
    const roleId = typeof role === 'string' ? role : role.id;
    
    if (!this.roles.includes(roleId)) return Promise.resolve(this);
    
    return this.client.api.guilds(this.guild.id).members(this.id).roles(roleId).delete({ reason })
      .then(() => {
        this.roles = this.roles.filter(id => id !== roleId);
        return this;
      });
  }

  /**
   * Kick this guild member
   * @param {string} [reason] - The reason for kicking
   * @returns {Promise<GuildMember>}
   */
  kick(reason) {
    return this.client.api.guilds(this.guild.id).members(this.id).delete({ reason })
      .then(() => this);
  }

  /**
   * Ban this guild member
   * @param {Object} options - The ban options
   * @param {number} [options.days=0] - The number of days of messages to delete
   * @param {string} [options.reason] - The reason for banning
   * @returns {Promise<GuildMember>}
   */
  ban({ days = 0, reason } = {}) {
    return this.client.api.guilds(this.guild.id).bans(this.id).put({
      data: { delete_message_days: days },
      reason,
    }).then(() => this);
  }

  /**
   * Fetch this guild member
   * @returns {Promise<GuildMember>}
   */
  fetch() {
    return this.guild.members.fetch(this.id);
  }

  /**
   * Send a message to this guild member
   * @param {string|Object} content - The content of the message
   * @returns {Promise<Message>}
   */
  send(content) {
    return this.user.send(content);
  }
}

module.exports = GuildMember; 