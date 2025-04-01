/**
 * @file ThrottlingManager.js
 * @description Manager for throttling API requests to avoid rate limits.
 * @copyright GhostNet Team 2025-2026
 */

/**
 * @typedef {Object} ThrottlingOptions
 * @property {number} [maxRequestsPerMinute=50] - Maximum requests allowed per minute
 * @property {number} [retryAfter=2000] - Time in ms to wait before retrying
 * @property {number} [bufferSize=0.9] - Safety factor to limit usage (0-1)
 * @property {boolean} [enableLogging=false] - Enable request activity logging
 */

class ThrottlingManager {
  /**
   * Creates a new throttling manager
   * @param {ThrottlingOptions} options - Configuration options
   */
  constructor(options = {}) {
    /**
     * Maximum requests allowed per minute
     * @type {number}
     * @private
     */
    this._maxRequestsPerMinute = options.maxRequestsPerMinute || 50;

    /**
     * Time in ms to wait before retrying
     * @type {number}
     * @private
     */
    this._retryAfter = options.retryAfter || 2000;

    /**
     * Safety factor to limit usage (0-1)
     * @type {number}
     * @private
     */
    this._bufferSize = options.bufferSize || 0.9;

    /**
     * Enable request activity logging
     * @type {boolean}
     * @private
     */
    this._enableLogging = options.enableLogging || false;

    /**
     * Current request log
     * @type {Map<string, Array<number>>}
     * @private
     */
    this._requestLog = new Map();

    /**
     * Queue for delayed requests
     * @type {Map<string, Array<Function>>}
     * @private
     */
    this._queue = new Map();

    /**
     * Whether there is a current rate limit
     * @type {Map<string, boolean>}
     * @private
     */
    this._rateLimit = new Map();

    /**
     * Rate limit timers
     * @type {Map<string, NodeJS.Timeout>}
     * @private
     */
    this._limitTimers = new Map();

    /**
     * Request statistics
     * @type {Object}
     * @private
     */
    this._stats = {
      totalRequests: 0,
      throttledRequests: 0,
      succeededRequests: 0,
      failedRequests: 0,
      lastRequest: null
    };
  }

  /**
   * Checks if a request would exceed the rate limit
   * @param {string} route - The route being requested
   * @returns {boolean} - Whether the request would exceed the limit
   * @private
   */
  _wouldExceedLimit(route) {
    if (!this._requestLog.has(route)) {
      this._requestLog.set(route, []);
      return false;
    }

    // Calculate number of requests in past minute
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this._requestLog.get(route).filter(time => time > oneMinuteAgo);
    
    // Update request log
    this._requestLog.set(route, recentRequests);
    
    // Check if would exceed limit with safety factor
    return recentRequests.length >= (this._maxRequestsPerMinute * this._bufferSize);
  }

  /**
   * Adds a request to the queue
   * @param {string} route - The route being requested
   * @param {Function} callback - The function to call when processing the request
   * @private
   */
  _enqueue(route, callback) {
    if (!this._queue.has(route)) {
      this._queue.set(route, []);
    }
    
    this._queue.get(route).push(callback);
    this._stats.throttledRequests++;
    
    if (this._enableLogging) {
      console.log(`[Throttling] Request to ${route} was throttled and added to queue.`);
    }
  }

  /**
   * Processes the queue for a given route
   * @param {string} route - The route to process the queue for
   * @private
   */
  _processQueue(route) {
    if (!this._queue.has(route) || this._queue.get(route).length === 0) return;
    
    // Check if we can process the next request
    if (!this._wouldExceedLimit(route) && !this._rateLimit.get(route)) {
      const nextCallback = this._queue.get(route).shift();
      
      if (nextCallback) {
        nextCallback();
        
        if (this._enableLogging) {
          console.log(`[Throttling] Processed queued request to ${route}.`);
        }
        
        // Schedule next processing
        setTimeout(() => this._processQueue(route), 1000);
      }
    } else {
      // Schedule retry later
      setTimeout(() => this._processQueue(route), this._retryAfter);
    }
  }

  /**
   * Logs a new request to a route
   * @param {string} route - The route being requested
   * @private
   */
  _logRequest(route) {
    if (!this._requestLog.has(route)) {
      this._requestLog.set(route, []);
    }
    
    const now = Date.now();
    this._requestLog.get(route).push(now);
    this._stats.lastRequest = now;
    this._stats.totalRequests++;
    this._stats.succeededRequests++;
    
    if (this._enableLogging) {
      console.log(`[Throttling] Request to ${route} was processed.`);
    }
  }

  /**
   * Logs an error for a request
   * @param {string} route - The route being requested
   * @param {Error} error - The error that occurred
   * @private
   */
  _logError(route, error) {
    this._stats.failedRequests++;
    
    if (this._enableLogging) {
      console.error(`[Throttling] Request to ${route} failed:`, error.message);
    }
  }

  /**
   * Process a request according to rate limits
   * @param {string} route - The route being requested
   * @param {Function} callback - The function to call when processing the request
   * @returns {Promise<void>}
   */
  async throttle(route, callback) {
    return new Promise((resolve, reject) => {
      // Format the route
      const formattedRoute = route.replace(/\d+/g, ':id');
      
      // Check for an existing rate limit
      if (this._rateLimit.get(formattedRoute)) {
        this._enqueue(formattedRoute, () => {
          this._executeCallback(formattedRoute, callback, resolve, reject);
        });
        return;
      }
      
      // Check if would exceed limit
      if (this._wouldExceedLimit(formattedRoute)) {
        this._enqueue(formattedRoute, () => {
          this._executeCallback(formattedRoute, callback, resolve, reject);
        });
        
        // Start processing queue if not already
        setTimeout(() => this._processQueue(formattedRoute), this._retryAfter);
        return;
      }
      
      // Execute the request
      this._executeCallback(formattedRoute, callback, resolve, reject);
    });
  }

  /**
   * Execute callback with error handling
   * @param {string} route - The route being requested
   * @param {Function} callback - The callback function
   * @param {Function} resolve - Promise resolve function
   * @param {Function} reject - Promise reject function
   * @private
   */
  async _executeCallback(route, callback, resolve, reject) {
    try {
      this._logRequest(route);
      const result = await callback();
      resolve(result);
    } catch (error) {
      this._logError(route, error);
      
      // Check for rate limit errors
      if (error.status === 429) {
        const retryAfter = error.response?.data?.retry_after || this._retryAfter;
        this._handleRateLimit(route, retryAfter);
        
        // Re-add request to queue
        this._enqueue(route, () => {
          this._executeCallback(route, callback, resolve, reject);
        });
      } else {
        reject(error);
      }
    }
  }

  /**
   * Handle a rate limit situation
   * @param {string} route - The route that was rate limited
   * @param {number} retryAfter - The time to wait in ms
   * @private
   */
  _handleRateLimit(route, retryAfter) {
    // Mark route as rate limited
    this._rateLimit.set(route, true);
    
    if (this._enableLogging) {
      console.warn(`[Throttling] Rate limit hit for ${route}. Waiting ${retryAfter}ms before retry.`);
    }
    
    // Clear any existing timer
    if (this._limitTimers.has(route)) {
      clearTimeout(this._limitTimers.get(route));
    }
    
    // Set up timer to clear rate limit
    const timerId = setTimeout(() => {
      this._rateLimit.set(route, false);
      this._limitTimers.delete(route);
      
      if (this._enableLogging) {
        console.log(`[Throttling] Rate limit for ${route} has reset.`);
      }
      
      // Process queue
      this._processQueue(route);
    }, retryAfter);
    
    this._limitTimers.set(route, timerId);
  }

  /**
   * Get request statistics
   * @returns {Object} Request statistics
   */
  getStats() {
    return {
      ...this._stats,
      activeQueues: [...this._queue.entries()].reduce((acc, [route, queue]) => {
        acc[route] = queue.length;
        return acc;
      }, {}),
      activeLimits: [...this._rateLimit.entries()].filter(([_, limited]) => limited).map(([route]) => route)
    };
  }

  /**
   * Reset all rate limits and queues
   */
  reset() {
    // Clear all timers
    for (const timerId of this._limitTimers.values()) {
      clearTimeout(timerId);
    }
    
    // Reset state
    this._requestLog.clear();
    this._queue.clear();
    this._rateLimit.clear();
    this._limitTimers.clear();
    
    // Reset stats
    this._stats = {
      totalRequests: 0,
      throttledRequests: 0,
      succeededRequests: 0,
      failedRequests: 0,
      lastRequest: null
    };
    
    if (this._enableLogging) {
      console.log('[Throttling] Manager has been reset.');
    }
  }
}

module.exports = ThrottlingManager; 