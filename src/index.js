/**
 * @file index.js
 * @description Main export file for the GhostSelfBot library.
 * @copyright GhostNet Team 2025-2026
 */

// Client classes
const Client = require('./client/Client');

// Data structure classes
const User = require('./structures/User');
const Message = require('./structures/Message');
const Embed = require('./structures/Embed');
const Channel = require('./structures/Channel');
const Guild = require('./structures/Guild');
const GuildMember = require('./structures/GuildMember');

// Manager classes
const CacheManager = require('./util/CacheManager');
const RESTManager = require('./rest/RESTManager');
const ThrottlingManager = require('./util/ThrottlingManager');
const EventTracker = require('./util/EventTracker');

// Constants and utility
const Constants = require('./util/Constants');
const Util = require('./util/Util');
const version = require('../package.json').version;

/**
 * Library version number.
 * @type {string}
 */
exports.version = version;

// Export all classes
exports.Client = Client;
exports.User = User;
exports.Message = Message;
exports.Embed = Embed;
exports.Channel = Channel;
exports.Guild = Guild;
exports.GuildMember = GuildMember;

// Export managers
exports.CacheManager = CacheManager;
exports.RESTManager = RESTManager;
exports.ThrottlingManager = ThrottlingManager;
exports.EventTracker = EventTracker;

// Export utilities
exports.Constants = Constants;
exports.Util = Util;

// Export a default object
module.exports = {
  version,
  Client,
  User,
  Message,
  Embed,
  Channel,
  Guild,
  GuildMember,
  CacheManager,
  RESTManager,
  ThrottlingManager,
  EventTracker,
  Constants,
  Util
}; 