/**
 * @file EventTracker.js
 * @description Advanced event tracking and performance monitoring system.
 * @copyright GhostNet Team 2025-2026
 */

/**
 * @typedef {Object} EventTrackerOptions
 * @property {boolean} [enabled=true] - Whether event tracking is enabled
 * @property {boolean} [logToConsole=false] - Whether to log events to console
 * @property {number} [maxStoredEvents=1000] - Maximum number of events to store in memory
 * @property {number} [samplingRate=1] - Rate at which to sample events (1 = all, 0.5 = half)
 * @property {string[]} [ignoredEvents=[]] - Events to ignore in tracking
 */

/**
 * @typedef {Object} EventData
 * @property {string} eventName - The name of the event
 * @property {number} timestamp - When the event occurred
 * @property {string} category - The category of the event
 * @property {Object} [metadata] - Additional metadata about the event
 * @property {number} [duration] - Duration in ms (for performance events)
 * @property {Error} [error] - Error object (for error events)
 */

class EventTracker {
  /**
   * Creates a new event tracker
   * @param {EventTrackerOptions} options - Configuration options
   */
  constructor(options = {}) {
    /**
     * Whether tracking is enabled
     * @type {boolean}
     * @private
     */
    this._enabled = options.enabled !== undefined ? options.enabled : true;
    
    /**
     * Whether to log events to console
     * @type {boolean}
     * @private
     */
    this._logToConsole = options.logToConsole || false;
    
    /**
     * Maximum number of events to store
     * @type {number}
     * @private
     */
    this._maxStoredEvents = options.maxStoredEvents || 1000;
    
    /**
     * Sampling rate (1 = all events, 0.5 = half)
     * @type {number}
     * @private
     */
    this._samplingRate = options.samplingRate || 1;
    
    /**
     * Events to ignore in tracking
     * @type {Set<string>}
     * @private
     */
    this._ignoredEvents = new Set(options.ignoredEvents || []);
    
    /**
     * Storage for tracked events
     * @type {EventData[]}
     * @private
     */
    this._events = [];
    
    /**
     * Performance timing markers
     * @type {Map<string, number>}
     * @private
     */
    this._markers = new Map();
    
    /**
     * Event subscription callbacks
     * @type {Map<string, Function[]>}
     * @private
     */
    this._subscribers = new Map();
    
    /**
     * Statistics about tracked events
     * @type {Object}
     * @private
     */
    this._stats = {
      totalEvents: 0,
      eventsByType: new Map(),
      errorEvents: 0,
      averageDuration: new Map(),
      durationSamples: new Map()
    };
  }
  
  /**
   * Track a general event
   * @param {string} eventName - The name of the event
   * @param {string} category - The category of the event (api, cache, websocket, etc.)
   * @param {Object} [metadata={}] - Additional information about the event
   * @returns {EventData} The tracked event data
   */
  trackEvent(eventName, category, metadata = {}) {
    if (!this._shouldTrackEvent(eventName)) return null;
    
    const eventData = {
      eventName,
      category,
      timestamp: Date.now(),
      metadata
    };
    
    return this._recordEvent(eventData);
  }
  
  /**
   * Track an error event
   * @param {string} eventName - The name of the error event
   * @param {Error} error - The error that occurred
   * @param {Object} [metadata={}] - Additional context about the error
   * @returns {EventData} The tracked error event data
   */
  trackError(eventName, error, metadata = {}) {
    if (!this._shouldTrackEvent(eventName)) return null;
    
    const eventData = {
      eventName: `error:${eventName}`,
      category: 'error',
      timestamp: Date.now(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      metadata
    };
    
    this._stats.errorEvents++;
    return this._recordEvent(eventData);
  }
  
  /**
   * Start timing an operation
   * @param {string} markerId - Unique identifier for this operation
   * @returns {number} The start timestamp
   */
  startTimer(markerId) {
    const startTime = performance.now();
    this._markers.set(markerId, startTime);
    return startTime;
  }
  
  /**
   * End timing an operation and track the performance
   * @param {string} markerId - The identifier passed to startTimer
   * @param {string} eventName - Name for the performance event
   * @param {Object} [metadata={}] - Additional context for the event
   * @returns {EventData} The tracked performance event data
   */
  endTimer(markerId, eventName, metadata = {}) {
    if (!this._markers.has(markerId) || !this._shouldTrackEvent(eventName)) {
      return null;
    }
    
    const startTime = this._markers.get(markerId);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Update duration statistics
    if (!this._stats.durationSamples.has(eventName)) {
      this._stats.durationSamples.set(eventName, []);
      this._stats.averageDuration.set(eventName, 0);
    }
    
    const samples = this._stats.durationSamples.get(eventName);
    samples.push(duration);
    
    // Keep only the last 100 samples for memory efficiency
    if (samples.length > 100) {
      samples.shift();
    }
    
    // Recalculate average
    const avg = samples.reduce((sum, val) => sum + val, 0) / samples.length;
    this._stats.averageDuration.set(eventName, avg);
    
    // Remove the marker
    this._markers.delete(markerId);
    
    const eventData = {
      eventName,
      category: 'performance',
      timestamp: Date.now(),
      duration,
      metadata: {
        ...metadata,
        startTime,
        endTime
      }
    };
    
    return this._recordEvent(eventData);
  }
  
  /**
   * Subscribe to events matching a pattern
   * @param {string|RegExp} pattern - Event name or pattern to match
   * @param {Function} callback - Function to call when matching events occur
   * @returns {Function} Unsubscribe function
   */
  subscribe(pattern, callback) {
    const patternKey = pattern instanceof RegExp ? pattern.toString() : pattern;
    
    if (!this._subscribers.has(patternKey)) {
      this._subscribers.set(patternKey, []);
    }
    
    const subscribers = this._subscribers.get(patternKey);
    subscribers.push({
      pattern,
      callback
    });
    
    // Return unsubscribe function
    return () => {
      const index = subscribers.findIndex(sub => sub.callback === callback);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
      
      if (subscribers.length === 0) {
        this._subscribers.delete(patternKey);
      }
    };
  }
  
  /**
   * Get events matching a filter
   * @param {Function} filterFn - Filter function
   * @returns {EventData[]} Filtered events
   */
  getEvents(filterFn = () => true) {
    return this._events.filter(filterFn);
  }
  
  /**
   * Get the most recent events
   * @param {number} count - Number of events to retrieve
   * @returns {EventData[]} Most recent events
   */
  getRecentEvents(count = 10) {
    return this._events.slice(-Math.min(count, this._events.length));
  }
  
  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getPerformanceStats() {
    const performanceStats = {};
    
    this._stats.averageDuration.forEach((avgDuration, eventName) => {
      performanceStats[eventName] = {
        avgDuration,
        sampleCount: this._stats.durationSamples.get(eventName).length
      };
    });
    
    return performanceStats;
  }
  
  /**
   * Get all event statistics
   * @returns {Object} Event statistics
   */
  getStats() {
    const eventCountByType = {};
    this._stats.eventsByType.forEach((count, type) => {
      eventCountByType[type] = count;
    });
    
    return {
      totalEvents: this._stats.totalEvents,
      storedEvents: this._events.length,
      eventCountByType,
      errorCount: this._stats.errorEvents,
      performanceStats: this.getPerformanceStats()
    };
  }
  
  /**
   * Clear all tracked events
   */
  clearEvents() {
    this._events = [];
  }
  
  /**
   * Enable or disable event tracking
   * @param {boolean} enabled - Whether tracking should be enabled
   */
  setEnabled(enabled) {
    this._enabled = enabled;
  }
  
  /**
   * Add events to ignore list
   * @param {...string} eventNames - Event names to ignore
   */
  ignoreEvents(...eventNames) {
    for (const name of eventNames) {
      this._ignoredEvents.add(name);
    }
  }
  
  /**
   * Remove events from ignore list
   * @param {...string} eventNames - Event names to stop ignoring
   */
  unignoreEvents(...eventNames) {
    for (const name of eventNames) {
      this._ignoredEvents.delete(name);
    }
  }
  
  /**
   * Whether an event should be tracked based on settings
   * @param {string} eventName - Name of the event to check
   * @returns {boolean} Whether the event should be tracked
   * @private
   */
  _shouldTrackEvent(eventName) {
    if (!this._enabled) return false;
    if (this._ignoredEvents.has(eventName)) return false;
    if (this._samplingRate < 1 && Math.random() > this._samplingRate) return false;
    
    return true;
  }
  
  /**
   * Record an event in the tracker
   * @param {EventData} eventData - The event data to record
   * @returns {EventData} The recorded event data
   * @private
   */
  _recordEvent(eventData) {
    // Update statistics
    this._stats.totalEvents++;
    
    const eventType = eventData.category;
    if (!this._stats.eventsByType.has(eventType)) {
      this._stats.eventsByType.set(eventType, 0);
    }
    this._stats.eventsByType.set(eventType, this._stats.eventsByType.get(eventType) + 1);
    
    // Store the event
    this._events.push(eventData);
    
    // Trim event storage if needed
    if (this._events.length > this._maxStoredEvents) {
      this._events.shift();
    }
    
    // Log to console if enabled
    if (this._logToConsole) {
      console.log(`[EventTracker] ${eventData.category}:${eventData.eventName}`, 
        eventData.duration ? `(${eventData.duration.toFixed(2)}ms)` : '',
        eventData.error ? `ERROR: ${eventData.error.message}` : '',
        eventData.metadata);
    }
    
    // Notify subscribers
    this._notifySubscribers(eventData);
    
    return eventData;
  }
  
  /**
   * Notify subscribers about a new event
   * @param {EventData} eventData - The event data
   * @private
   */
  _notifySubscribers(eventData) {
    this._subscribers.forEach(subscribers => {
      for (const { pattern, callback } of subscribers) {
        let matches = false;
        
        if (pattern instanceof RegExp) {
          matches = pattern.test(eventData.eventName);
        } else if (typeof pattern === 'string') {
          matches = eventData.eventName === pattern || 
                    eventData.eventName.startsWith(`${pattern}:`);
        }
        
        if (matches) {
          try {
            callback(eventData);
          } catch (err) {
            console.error('Error in event subscriber callback:', err);
          }
        }
      }
    });
  }
}

module.exports = EventTracker; 