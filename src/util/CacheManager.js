/**
 * مدير ذاكرة التخزين المؤقت لتحسين أداء المكتبة
 * @module CacheManager
 * @copyright GhostNet Team 2025-2026
 */

/**
 * مدير ذاكرة التخزين المؤقت القوي
 */
class CacheManager {
  /**
   * إنشاء مدير جديد لذاكرة التخزين المؤقت
   * @param {Object} options - خيارات مدير ذاكرة التخزين المؤقت
   */
  constructor(options = {}) {
    /**
     * خيارات التخزين المؤقت
     * @type {Object}
     */
    this.options = Object.assign({
      messageCacheMaxSize: 200,
      messageCacheLifetime: 0,
      messageSweepInterval: 0,
      userCacheMaxSize: 1000,
      userCacheLifetime: 3600000, // ساعة واحدة
      channelCacheMaxSize: 1000,
      channelCacheLifetime: 3600000, // ساعة واحدة
      guildCacheMaxSize: 100,
      guildCacheLifetime: 3600000, // ساعة واحدة
      memberCacheMaxSize: 2000,
      memberCacheLifetime: 3600000, // ساعة واحدة
      sweepInterval: 300000, // 5 دقائق
    }, options);

    /**
     * ذاكرة التخزين المؤقت للرسائل
     * @type {Map<string, Object>}
     */
    this.messages = new Map();

    /**
     * ذاكرة التخزين المؤقت للمستخدمين
     * @type {Map<string, Object>}
     */
    this.users = new Map();

    /**
     * ذاكرة التخزين المؤقت للقنوات
     * @type {Map<string, Object>}
     */
    this.channels = new Map();

    /**
     * ذاكرة التخزين المؤقت للسيرفرات
     * @type {Map<string, Object>}
     */
    this.guilds = new Map();

    /**
     * ذاكرة التخزين المؤقت للأعضاء
     * @type {Map<string, Object>}
     */
    this.members = new Map();

    /**
     * أوقات انتهاء صلاحية الرسائل
     * @type {Map<string, number>}
     * @private
     */
    this._messageExpires = new Map();

    /**
     * أوقات انتهاء صلاحية المستخدمين
     * @type {Map<string, number>}
     * @private
     */
    this._userExpires = new Map();

    /**
     * أوقات انتهاء صلاحية القنوات
     * @type {Map<string, number>}
     * @private
     */
    this._channelExpires = new Map();

    /**
     * أوقات انتهاء صلاحية السيرفرات
     * @type {Map<string, number>}
     * @private
     */
    this._guildExpires = new Map();

    /**
     * أوقات انتهاء صلاحية الأعضاء
     * @type {Map<string, number>}
     * @private
     */
    this._memberExpires = new Map();

    /**
     * فاصل زمني لتنظيف ذاكرة التخزين المؤقت
     * @type {?NodeJS.Timeout}
     * @private
     */
    this._sweepInterval = null;

    if (this.options.sweepInterval > 0) {
      this._sweepInterval = setInterval(() => this.sweep(), this.options.sweepInterval);
    }
  }

  /**
   * إضافة عنصر إلى ذاكرة تخزين الرسائل المؤقتة
   * @param {string} id - معرّف الرسالة
   * @param {Object} data - بيانات الرسالة
   * @returns {Object} البيانات المخزنة
   */
  addMessage(id, data) {
    if (this.messages.size >= this.options.messageCacheMaxSize) {
      const oldestId = this._getOldestEntry(this.messages, this._messageExpires);
      if (oldestId) this.removeMessage(oldestId);
    }

    this.messages.set(id, data);
    
    if (this.options.messageCacheLifetime > 0) {
      this._messageExpires.set(id, Date.now() + this.options.messageCacheLifetime);
    }
    
    return data;
  }

  /**
   * إضافة عنصر إلى ذاكرة تخزين المستخدمين المؤقتة
   * @param {string} id - معرّف المستخدم
   * @param {Object} data - بيانات المستخدم
   * @returns {Object} البيانات المخزنة
   */
  addUser(id, data) {
    if (this.users.size >= this.options.userCacheMaxSize) {
      const oldestId = this._getOldestEntry(this.users, this._userExpires);
      if (oldestId) this.removeUser(oldestId);
    }

    this.users.set(id, data);
    
    if (this.options.userCacheLifetime > 0) {
      this._userExpires.set(id, Date.now() + this.options.userCacheLifetime);
    }
    
    return data;
  }

  /**
   * إضافة عنصر إلى ذاكرة تخزين القنوات المؤقتة
   * @param {string} id - معرّف القناة
   * @param {Object} data - بيانات القناة
   * @returns {Object} البيانات المخزنة
   */
  addChannel(id, data) {
    if (this.channels.size >= this.options.channelCacheMaxSize) {
      const oldestId = this._getOldestEntry(this.channels, this._channelExpires);
      if (oldestId) this.removeChannel(oldestId);
    }

    this.channels.set(id, data);
    
    if (this.options.channelCacheLifetime > 0) {
      this._channelExpires.set(id, Date.now() + this.options.channelCacheLifetime);
    }
    
    return data;
  }

  /**
   * إضافة عنصر إلى ذاكرة تخزين السيرفرات المؤقتة
   * @param {string} id - معرّف السيرفر
   * @param {Object} data - بيانات السيرفر
   * @returns {Object} البيانات المخزنة
   */
  addGuild(id, data) {
    if (this.guilds.size >= this.options.guildCacheMaxSize) {
      const oldestId = this._getOldestEntry(this.guilds, this._guildExpires);
      if (oldestId) this.removeGuild(oldestId);
    }

    this.guilds.set(id, data);
    
    if (this.options.guildCacheLifetime > 0) {
      this._guildExpires.set(id, Date.now() + this.options.guildCacheLifetime);
    }
    
    return data;
  }

  /**
   * إضافة عنصر إلى ذاكرة تخزين الأعضاء المؤقتة
   * @param {string} id - معرّف العضو (guildId-userId)
   * @param {Object} data - بيانات العضو
   * @returns {Object} البيانات المخزنة
   */
  addMember(id, data) {
    if (this.members.size >= this.options.memberCacheMaxSize) {
      const oldestId = this._getOldestEntry(this.members, this._memberExpires);
      if (oldestId) this.removeMember(oldestId);
    }

    this.members.set(id, data);
    
    if (this.options.memberCacheLifetime > 0) {
      this._memberExpires.set(id, Date.now() + this.options.memberCacheLifetime);
    }
    
    return data;
  }

  /**
   * إزالة عنصر من ذاكرة تخزين الرسائل المؤقتة
   * @param {string} id - معرّف الرسالة
   * @returns {boolean} ما إذا كانت الإزالة ناجحة
   */
  removeMessage(id) {
    this._messageExpires.delete(id);
    return this.messages.delete(id);
  }

  /**
   * إزالة عنصر من ذاكرة تخزين المستخدمين المؤقتة
   * @param {string} id - معرّف المستخدم
   * @returns {boolean} ما إذا كانت الإزالة ناجحة
   */
  removeUser(id) {
    this._userExpires.delete(id);
    return this.users.delete(id);
  }

  /**
   * إزالة عنصر من ذاكرة تخزين القنوات المؤقتة
   * @param {string} id - معرّف القناة
   * @returns {boolean} ما إذا كانت الإزالة ناجحة
   */
  removeChannel(id) {
    this._channelExpires.delete(id);
    return this.channels.delete(id);
  }

  /**
   * إزالة عنصر من ذاكرة تخزين السيرفرات المؤقتة
   * @param {string} id - معرّف السيرفر
   * @returns {boolean} ما إذا كانت الإزالة ناجحة
   */
  removeGuild(id) {
    this._guildExpires.delete(id);
    return this.guilds.delete(id);
  }

  /**
   * إزالة عنصر من ذاكرة تخزين الأعضاء المؤقتة
   * @param {string} id - معرّف العضو
   * @returns {boolean} ما إذا كانت الإزالة ناجحة
   */
  removeMember(id) {
    this._memberExpires.delete(id);
    return this.members.delete(id);
  }

  /**
   * الحصول على عنصر من ذاكرة تخزين الرسائل المؤقتة
   * @param {string} id - معرّف الرسالة
   * @returns {?Object} بيانات الرسالة أو null إذا لم يتم العثور عليها
   */
  getMessage(id) {
    return this.messages.get(id) || null;
  }

  /**
   * الحصول على عنصر من ذاكرة تخزين المستخدمين المؤقتة
   * @param {string} id - معرّف المستخدم
   * @returns {?Object} بيانات المستخدم أو null إذا لم يتم العثور عليه
   */
  getUser(id) {
    return this.users.get(id) || null;
  }

  /**
   * الحصول على عنصر من ذاكرة تخزين القنوات المؤقتة
   * @param {string} id - معرّف القناة
   * @returns {?Object} بيانات القناة أو null إذا لم يتم العثور عليها
   */
  getChannel(id) {
    return this.channels.get(id) || null;
  }

  /**
   * الحصول على عنصر من ذاكرة تخزين السيرفرات المؤقتة
   * @param {string} id - معرّف السيرفر
   * @returns {?Object} بيانات السيرفر أو null إذا لم يتم العثور عليه
   */
  getGuild(id) {
    return this.guilds.get(id) || null;
  }

  /**
   * الحصول على عنصر من ذاكرة تخزين الأعضاء المؤقتة
   * @param {string} id - معرّف العضو
   * @returns {?Object} بيانات العضو أو null إذا لم يتم العثور عليه
   */
  getMember(id) {
    return this.members.get(id) || null;
  }

  /**
   * تنظيف ذاكرة التخزين المؤقت
   * @returns {Object} عدد العناصر التي تمت إزالتها من كل مجموعة
   */
  sweep() {
    const now = Date.now();
    let deletedMessages = 0;
    let deletedUsers = 0;
    let deletedChannels = 0;
    let deletedGuilds = 0;
    let deletedMembers = 0;

    // تنظيف الرسائل المنتهية
    if (this.options.messageCacheLifetime > 0) {
      for (const [id, expireTime] of this._messageExpires.entries()) {
        if (now > expireTime) {
          this.removeMessage(id);
          deletedMessages++;
        }
      }
    }

    // تنظيف المستخدمين المنتهين
    if (this.options.userCacheLifetime > 0) {
      for (const [id, expireTime] of this._userExpires.entries()) {
        if (now > expireTime) {
          this.removeUser(id);
          deletedUsers++;
        }
      }
    }

    // تنظيف القنوات المنتهية
    if (this.options.channelCacheLifetime > 0) {
      for (const [id, expireTime] of this._channelExpires.entries()) {
        if (now > expireTime) {
          this.removeChannel(id);
          deletedChannels++;
        }
      }
    }

    // تنظيف السيرفرات المنتهية
    if (this.options.guildCacheLifetime > 0) {
      for (const [id, expireTime] of this._guildExpires.entries()) {
        if (now > expireTime) {
          this.removeGuild(id);
          deletedGuilds++;
        }
      }
    }

    // تنظيف الأعضاء المنتهين
    if (this.options.memberCacheLifetime > 0) {
      for (const [id, expireTime] of this._memberExpires.entries()) {
        if (now > expireTime) {
          this.removeMember(id);
          deletedMembers++;
        }
      }
    }

    return {
      messages: deletedMessages,
      users: deletedUsers,
      channels: deletedChannels,
      guilds: deletedGuilds,
      members: deletedMembers
    };
  }

  /**
   * الحصول على أقدم عنصر في المجموعة
   * @param {Map<string, Object>} collection - مجموعة البيانات
   * @param {Map<string, number>} expirations - مجموعة أوقات انتهاء الصلاحية
   * @returns {?string} معرّف أقدم عنصر أو null إذا كانت المجموعة فارغة
   * @private
   */
  _getOldestEntry(collection, expirations) {
    if (collection.size === 0) return null;
    
    let oldestId = null;
    let oldestTime = Infinity;
    
    for (const [id, expireTime] of expirations.entries()) {
      if (expireTime < oldestTime) {
        oldestTime = expireTime;
        oldestId = id;
      }
    }
    
    // إذا لم يتم تحديد أوقات انتهاء الصلاحية، قم بإرجاع أول معرّف
    if (!oldestId) {
      oldestId = collection.keys().next().value;
    }
    
    return oldestId;
  }

  /**
   * إيقاف مدير ذاكرة التخزين المؤقت
   */
  destroy() {
    if (this._sweepInterval) {
      clearInterval(this._sweepInterval);
      this._sweepInterval = null;
    }
    
    this.messages.clear();
    this.users.clear();
    this.channels.clear();
    this.guilds.clear();
    this.members.clear();
    
    this._messageExpires.clear();
    this._userExpires.clear();
    this._channelExpires.clear();
    this._guildExpires.clear();
    this._memberExpires.clear();
  }
}

module.exports = CacheManager; 