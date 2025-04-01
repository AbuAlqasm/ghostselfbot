/**
 * Represents a guild (server) on Discord
 * @module Guild
 * @copyright GhostNet Team 2025-2026
 */

const Constants = require('../util/Constants');
const GuildMember = require('./GuildMember');

/**
 * Represents a guild (server) on Discord
 */
class Guild {
  /**
   * @param {Client} client - The client that instantiated this guild
   * @param {Object} data - The data for the guild
   */
  constructor(client, data) {
    /**
     * The client that instantiated this guild
     * @type {Client}
     */
    this.client = client;

    /**
     * The members of this guild
     * @type {Map<string, GuildMember>}
     */
    this.members = new Map();

    /**
     * The channels of this guild
     * @type {Map<string, GuildChannel>}
     */
    this.channels = new Map();

    /**
     * The roles of this guild
     * @type {Map<string, Role>}
     */
    this.roles = new Map();

    /**
     * The emojis of this guild
     * @type {Map<string, GuildEmoji>}
     */
    this.emojis = new Map();

    this._patch(data);
  }

  /**
   * Patch guild data
   * @param {Object} data - The data to patch
   * @private
   */
  _patch(data) {
    /**
     * The ID of the guild
     * @type {string}
     */
    this.id = data.id;

    /**
     * The name of the guild
     * @type {string}
     */
    this.name = data.name;

    /**
     * The icon hash of the guild
     * @type {?string}
     */
    this.icon = data.icon || null;

    /**
     * The splash hash of the guild
     * @type {?string}
     */
    this.splash = data.splash || null;

    /**
     * The discovery splash hash of the guild
     * @type {?string}
     */
    this.discoverySplash = data.discovery_splash || null;

    /**
     * The ID of the owner of the guild
     * @type {string}
     */
    this.ownerId = data.owner_id;

    /**
     * The permissions of the client in the guild
     * @type {?string}
     */
    this.permissions = data.permissions ?? null;

    /**
     * The region of the guild
     * @type {string}
     */
    this.region = data.region;

    /**
     * The ID of the AFK channel of the guild
     * @type {?string}
     */
    this.afkChannelId = data.afk_channel_id || null;

    /**
     * The AFK timeout of the guild in seconds
     * @type {number}
     */
    this.afkTimeout = data.afk_timeout;

    /**
     * Whether the guild is a widget enabled guild
     * @type {boolean}
     */
    this.widgetEnabled = Boolean(data.widget_enabled);

    /**
     * The ID of the widget channel of the guild
     * @type {?string}
     */
    this.widgetChannelId = data.widget_channel_id || null;

    /**
     * The verification level of the guild
     * @type {number}
     */
    this.verificationLevel = data.verification_level;

    /**
     * The explicit content filter level of the guild
     * @type {number}
     */
    this.explicitContentFilter = data.explicit_content_filter;

    /**
     * The MFA level of the guild
     * @type {number}
     */
    this.mfaLevel = data.mfa_level;

    /**
     * The ID of the system channel of the guild
     * @type {?string}
     */
    this.systemChannelId = data.system_channel_id || null;

    /**
     * The system channel flags of the guild
     * @type {number}
     */
    this.systemChannelFlags = data.system_channel_flags;

    /**
     * The ID of the rules channel of the guild
     * @type {?string}
     */
    this.rulesChannelId = data.rules_channel_id || null;

    /**
     * The timestamp the client user joined the guild at
     * @type {?number}
     */
    this.joinedAt = data.joined_at ? new Date(data.joined_at).getTime() : null;

    /**
     * Whether the guild is unavailable
     * @type {boolean}
     */
    this.unavailable = data.unavailable || false;

    /**
     * The member count of the guild
     * @type {?number}
     */
    this.memberCount = data.member_count ?? null;

    /**
     * The vanity URL code of the guild
     * @type {?string}
     */
    this.vanityURLCode = data.vanity_url_code || null;

    /**
     * The description of the guild
     * @type {?string}
     */
    this.description = data.description || null;

    /**
     * The banner hash of the guild
     * @type {?string}
     */
    this.banner = data.banner || null;

    /**
     * The premium tier of the guild
     * @type {number}
     */
    this.premiumTier = data.premium_tier;

    /**
     * The premium subscription count of the guild
     * @type {?number}
     */
    this.premiumSubscriptionCount = data.premium_subscription_count ?? null;

    /**
     * The preferred locale of the guild
     * @type {string}
     */
    this.preferredLocale = data.preferred_locale;

    /**
     * The ID of the public updates channel of the guild
     * @type {?string}
     */
    this.publicUpdatesChannelId = data.public_updates_channel_id || null;

    /**
     * The maximum amount of members the guild can have
     * @type {?number}
     */
    this.maxMembers = data.max_members ?? null;

    /**
     * The maximum amount of presences the guild can have
     * @type {?number}
     */
    this.maxPresences = data.max_presences ?? null;

    /**
     * The approximate member count of the guild
     * @type {?number}
     */
    this.approximateMemberCount = data.approximate_member_count ?? null;

    /**
     * The approximate presence count of the guild
     * @type {?number}
     */
    this.approximatePresenceCount = data.approximate_presence_count ?? null;

    // Process roles
    if (data.roles) {
      for (const role of data.roles) {
        this.roles.set(role.id, role);
      }
    }

    // Process members
    if (data.members) {
      for (const member of data.members) {
        this.members.set(member.user.id, new GuildMember(this.client, this, member));
      }
    }
  }

  /**
   * The URL of the guild's icon
   * @param {Object} options - Options for the icon URL
   * @param {string} [options.format='webp'] - The format of the icon
   * @param {number} [options.size=512] - The size of the icon
   * @param {boolean} [options.dynamic=true] - Whether to use a dynamic format
   * @returns {?string}
   */
  iconURL({ format = 'webp', size = 512, dynamic = true } = {}) {
    if (!this.icon) return null;
    
    if (dynamic) format = this.icon.startsWith('a_') ? 'gif' : format;
    
    return `${Constants.API.CDN}/icons/${this.id}/${this.icon}.${format}?size=${size}`;
  }

  /**
   * The URL of the guild's banner
   * @param {Object} options - Options for the banner URL
   * @param {string} [options.format='webp'] - The format of the banner
   * @param {number} [options.size=512] - The size of the banner
   * @returns {?string}
   */
  bannerURL({ format = 'webp', size = 512 } = {}) {
    if (!this.banner) return null;
    return `${Constants.API.CDN}/banners/${this.id}/${this.banner}.${format}?size=${size}`;
  }

  /**
   * The owner of the guild
   * @type {?GuildMember}
   * @readonly
   */
  get owner() {
    return this.members.get(this.ownerId) || null;
  }

  /**
   * The AFK channel of the guild
   * @type {?VoiceChannel}
   * @readonly
   */
  get afkChannel() {
    return this.client.channels.get(this.afkChannelId) || null;
  }

  /**
   * The system channel of the guild
   * @type {?TextChannel}
   * @readonly
   */
  get systemChannel() {
    return this.client.channels.get(this.systemChannelId) || null;
  }

  /**
   * The rules channel of the guild
   * @type {?TextChannel}
   * @readonly
   */
  get rulesChannel() {
    return this.client.channels.get(this.rulesChannelId) || null;
  }

  /**
   * The public updates channel of the guild
   * @type {?TextChannel}
   * @readonly
   */
  get publicUpdatesChannel() {
    return this.client.channels.get(this.publicUpdatesChannelId) || null;
  }

  /**
   * The name acronym of the guild
   * @type {string}
   * @readonly
   */
  get nameAcronym() {
    return this.name.replace(/\w+/g, name => name[0]).replace(/\s/g, '');
  }

  /**
   * Fetch the guild
   * @returns {Promise<Guild>}
   */
  fetch() {
    return this.client.api.guilds(this.id).get()
      .then(data => {
        this._patch(data);
        return this;
      });
  }

  /**
   * Leave the guild
   * @returns {Promise<Guild>}
   */
  leave() {
    return this.client.api.users('@me').guilds(this.id).delete()
      .then(() => this);
  }

  /**
   * Fetch members for the guild
   * @param {Object} options - The fetch options
   * @returns {Promise<Collection<string, GuildMember>>}
   */
  fetchMembers({ query = '', limit = 0 } = {}) {
    return this.client.api.guilds(this.id).members.get({ query, limit })
      .then(data => {
        for (const memberData of data) {
          this.members.set(memberData.user.id, new GuildMember(this.client, this, memberData));
        }
        return this.members;
      });
  }

  /**
   * Fetch a member by ID
   * @param {string} id - The ID of the member
   * @param {boolean} [force=false] - Whether to skip the cache check
   * @returns {Promise<GuildMember>}
   */
  fetchMember(id, force = false) {
    if (!force) {
      const member = this.members.get(id);
      if (member) return Promise.resolve(member);
    }
    
    return this.client.api.guilds(this.id).members(id).get()
      .then(data => {
        const member = new GuildMember(this.client, this, data);
        this.members.set(id, member);
        return member;
      });
  }

  /**
   * Fetch all roles for the guild
   * @returns {Promise<Map<string, Role>>}
   */
  fetchRoles() {
    return this.client.api.guilds(this.id).roles.get()
      .then(data => {
        for (const roleData of data) {
          this.roles.set(roleData.id, roleData);
        }
        return this.roles;
      });
  }

  /**
   * Returns a string representation of the guild
   * @returns {string}
   */
  toString() {
    return this.name;
  }
}

module.exports = Guild; 