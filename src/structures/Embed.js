/**
 * Represents an embed in a message
 * @module Embed
 * @copyright GhostNet Team 2025-2026
 */

const Util = require('../util/Util');

/**
 * Represents an embed in a message
 */
class Embed {
  /**
   * @param {Object} data - Data for the embed
   */
  constructor(data = {}) {
    /**
     * The title of this embed
     * @type {?string}
     */
    this.title = data.title ?? null;

    /**
     * The description of this embed
     * @type {?string}
     */
    this.description = data.description ?? null;

    /**
     * The URL of this embed
     * @type {?string}
     */
    this.url = data.url ?? null;

    /**
     * The color of this embed
     * @type {?number}
     */
    this.color = data.color ? Util.resolveColor(data.color) : null;

    /**
     * The timestamp of this embed
     * @type {?number}
     */
    this.timestamp = data.timestamp ? new Date(data.timestamp).getTime() : null;

    /**
     * The fields of this embed
     * @type {Object[]}
     */
    this.fields = data.fields?.map(field => ({ 
      name: field.name, 
      value: field.value, 
      inline: field.inline ?? false 
    })) ?? [];

    /**
     * The thumbnail of this embed
     * @type {?Object}
     */
    this.thumbnail = data.thumbnail ? {
      url: data.thumbnail.url,
      proxyURL: data.thumbnail.proxy_url,
      height: data.thumbnail.height,
      width: data.thumbnail.width,
    } : null;

    /**
     * The image of this embed
     * @type {?Object}
     */
    this.image = data.image ? {
      url: data.image.url,
      proxyURL: data.image.proxy_url,
      height: data.image.height,
      width: data.image.width,
    } : null;

    /**
     * The author of this embed
     * @type {?Object}
     */
    this.author = data.author ? {
      name: data.author.name,
      url: data.author.url,
      iconURL: data.author.icon_url,
      proxyIconURL: data.author.proxy_icon_url,
    } : null;

    /**
     * The footer of this embed
     * @type {?Object}
     */
    this.footer = data.footer ? {
      text: data.footer.text,
      iconURL: data.footer.icon_url,
      proxyIconURL: data.footer.proxy_icon_url,
    } : null;
  }

  /**
   * The date this embed was created at
   * @type {?Date}
   * @readonly
   */
  get createdAt() {
    return this.timestamp ? new Date(this.timestamp) : null;
  }

  /**
   * Sets the title of this embed
   * @param {string} title - The title
   * @returns {Embed}
   */
  setTitle(title) {
    this.title = title;
    return this;
  }

  /**
   * Sets the description of this embed
   * @param {string} description - The description
   * @returns {Embed}
   */
  setDescription(description) {
    this.description = description;
    return this;
  }

  /**
   * Sets the URL of this embed
   * @param {string} url - The URL
   * @returns {Embed}
   */
  setURL(url) {
    this.url = url;
    return this;
  }

  /**
   * Sets the color of this embed
   * @param {ColorResolvable} color - The color
   * @returns {Embed}
   */
  setColor(color) {
    this.color = Util.resolveColor(color);
    return this;
  }

  /**
   * Sets the timestamp of this embed
   * @param {Date|number|null} [timestamp=Date.now()] - The timestamp
   * @returns {Embed}
   */
  setTimestamp(timestamp = Date.now()) {
    this.timestamp = timestamp ? new Date(timestamp).getTime() : null;
    return this;
  }

  /**
   * Adds a field to the embed
   * @param {string} name - The name of the field
   * @param {string} value - The value of the field
   * @param {boolean} [inline=false] - Whether the field should be inline
   * @returns {Embed}
   */
  addField(name, value, inline = false) {
    if (this.fields.length >= 25) throw new RangeError('EMBED_FIELD_COUNT');
    if (!name) throw new RangeError('EMBED_FIELD_NAME');
    if (!value) throw new RangeError('EMBED_FIELD_VALUE');
    
    this.fields.push({ name, value, inline });
    return this;
  }

  /**
   * Sets the thumbnail of this embed
   * @param {string} url - The URL of the thumbnail
   * @returns {Embed}
   */
  setThumbnail(url) {
    this.thumbnail = { url };
    return this;
  }

  /**
   * Sets the image of this embed
   * @param {string} url - The URL of the image
   * @returns {Embed}
   */
  setImage(url) {
    this.image = { url };
    return this;
  }

  /**
   * Sets the author of this embed
   * @param {string} name - The name of the author
   * @param {string} [iconURL] - The icon URL of the author
   * @param {string} [url] - The URL of the author
   * @returns {Embed}
   */
  setAuthor(name, iconURL, url) {
    this.author = { name };
    if (iconURL) this.author.iconURL = iconURL;
    if (url) this.author.url = url;
    return this;
  }

  /**
   * Sets the footer of this embed
   * @param {string} text - The text of the footer
   * @param {string} [iconURL] - The icon URL of the footer
   * @returns {Embed}
   */
  setFooter(text, iconURL) {
    this.footer = { text };
    if (iconURL) this.footer.iconURL = iconURL;
    return this;
  }

  /**
   * Transforms the embed to a plain object that can be used to send a message
   * @returns {Object}
   */
  toJSON() {
    return {
      title: this.title,
      description: this.description,
      url: this.url,
      timestamp: this.timestamp ? new Date(this.timestamp).toISOString() : undefined,
      color: this.color,
      fields: this.fields,
      thumbnail: this.thumbnail ? { 
        url: this.thumbnail.url,
        proxy_url: this.thumbnail.proxyURL,
        height: this.thumbnail.height,
        width: this.thumbnail.width,
      } : undefined,
      image: this.image ? { 
        url: this.image.url,
        proxy_url: this.image.proxyURL,
        height: this.image.height,
        width: this.image.width,
      } : undefined,
      author: this.author ? { 
        name: this.author.name,
        url: this.author.url,
        icon_url: this.author.iconURL,
        proxy_icon_url: this.author.proxyIconURL,
      } : undefined,
      footer: this.footer ? { 
        text: this.footer.text,
        icon_url: this.footer.iconURL,
        proxy_icon_url: this.footer.proxyIconURL,
      } : undefined,
    };
  }
}

module.exports = Embed; 