/**
 * Utility functions for the library
 * @module Util
 * @copyright GhostNet Team 2025-2026
 */

/**
 * Utility functions
 */
class Util {
  /**
   * Resolves a color to a number
   * @param {string|number} color - The color to resolve
   * @returns {number} The resolved color
   */
  static resolveColor(color) {
    if (typeof color === 'string') {
      if (color === 'RANDOM') return Math.floor(Math.random() * (0xffffff + 1));
      if (color.startsWith('#')) {
        return parseInt(color.replace('#', ''), 16);
      }
      color = Colors[color] || parseInt(color.replace('#', ''), 16);
    }
    
    if (color < 0 || color > 0xffffff) throw new RangeError('COLOR_RANGE');
    if (color && isNaN(color)) throw new TypeError('COLOR_CONVERT');
    
    return color;
  }

  /**
   * Escape markdown characters in a string
   * @param {string} text - The string to escape
   * @param {Object} options - The escape options
   * @returns {string} The escaped string
   */
  static escapeMarkdown(text, {
    codeBlock = true,
    inlineCode = true,
    bold = true,
    italic = true,
    underline = true,
    strikethrough = true,
    spoiler = true,
    codeBlockContent = true,
    inlineCodeContent = true,
  } = {}) {
    if (!text) return '';
    
    let result = text;
    
    if (codeBlockContent) {
      result = result.replace(/```/g, '\\`\\`\\`');
    }
    
    if (inlineCodeContent) {
      result = result.replace(/`/g, '\\`');
    }
    
    if (codeBlock) {
      result = result.replace(/```/g, '\\`\\`\\`');
    }
    
    if (inlineCode) {
      result = result.replace(/`/g, '\\`');
    }
    
    if (bold) {
      result = result.replace(/\*\*/g, '\\*\\*');
    }
    
    if (italic) {
      result = result.replace(/\*/g, '\\*')
        .replace(/_/g, '\\_');
    }
    
    if (underline) {
      result = result.replace(/__/g, '\\_\\_');
    }
    
    if (strikethrough) {
      result = result.replace(/~~/g, '\\~\\~');
    }
    
    if (spoiler) {
      result = result.replace(/\|\|/g, '\\|\\|');
    }
    
    return result;
  }

  /**
   * Split a message into chunks at valid Unicode code points
   * @param {string} text - The text to split
   * @param {Object} options - The split options
   * @returns {string[]} The split message
   */
  static splitMessage(text, { maxLength = 2000, char = '\n', prepend = '', append = '' } = {}) {
    if (text.length <= maxLength) return [text];
    
    const splitText = text.split(char);
    if (splitText.some(chunk => chunk.length > maxLength)) {
      throw new RangeError('SPLIT_MAX_LEN');
    }
    
    const messages = [];
    let msg = '';
    
    for (const chunk of splitText) {
      if (msg && (msg + char + chunk + append).length > maxLength) {
        messages.push(msg + append);
        msg = prepend;
      }
      
      msg += (msg && msg !== prepend ? char : '') + chunk;
    }
    
    if (msg) messages.push(msg + append);
    return messages;
  }

  /**
   * Creates a debounced function
   * @param {Function} fn - The function to debounce
   * @param {number} delay - The delay in milliseconds
   * @param {Object} options - Debounce options
   * @returns {Function} The debounced function
   */
  static debounce(fn, delay, { leading = false } = {}) {
    let timeout;
    return (...args) => {
      if (!timeout && leading) fn(...args);
      
      clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        if (!leading) fn(...args);
        timeout = null;
      }, delay);
    };
  }

  /**
   * Format a date to Discord's style
   * @param {Date|number|string} date - The date to format
   * @returns {string} The formatted date
   */
  static discordTimestamp(date) {
    const timestamp = date instanceof Date ? Math.floor(date.getTime() / 1000) : Math.floor(Number(date) / 1000);
    return `<t:${timestamp}>`;
  }

  /**
   * Flatten an array of arrays
   * @param {Array} arr - The array to flatten
   * @returns {Array} The flattened array
   */
  static flatten(arr) {
    return arr.reduce((acc, val) => acc.concat(val), []);
  }

  /**
   * Check if a value is a plain object
   * @param {*} item - The item to check
   * @returns {boolean} Whether the item is a plain object
   */
  static isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }

  /**
   * Deep merge objects
   * @param {Object} target - The target object
   * @param {Object} source - The source object
   * @returns {Object} The merged object
   */
  static mergeObjects(target, source) {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.mergeObjects(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }
}

module.exports = Util; 