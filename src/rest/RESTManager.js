/**
 * REST API Manager for handling Discord API requests
 * @module RESTManager
 * @copyright GhostNet Team 2025-2026
 */

const axios = require('axios');
const Constants = require('../util/Constants');
const Util = require('../util/Util');

/**
 * Manages REST API interactions with Discord
 */
class RESTManager {
  /**
   * @param {Client} client - The client that instantiated this manager
   * @param {Object} options - Options for the REST manager
   */
  constructor(client, options = {}) {
    /**
     * The client that instantiated this manager
     * @type {Client}
     */
    this.client = client;

    /**
     * The amount of time in milliseconds that should ellapse between requests
     * @type {number}
     */
    this.restTimeOffset = options.restTimeOffset || client.options.restTimeOffset || 500;

    /**
     * The time to wait before considering a request as timed out
     * @type {number}
     */
    this.restRequestTimeout = options.restRequestTimeout || client.options.restRequestTimeout || 15000;

    /**
     * The number of times to retry a request if it fails
     * @type {number}
     */
    this.retryLimit = options.retryLimit || client.options.retryLimit || 3;

    /**
     * The time to wait before retrying a failed request
     * @type {number}
     */
    this.retryAfter = 1000;

    /**
     * The authentication token used for requests
     * @type {?string}
     * @private
     */
    this._token = null;

    /**
     * The API version to use
     * @type {number}
     */
    this.version = options.version || Constants.API.VERSION;

    /**
     * The base API path
     * @type {string}
     */
    this.api = `${Constants.API.BASE}/v${this.version}`;

    /**
     * Active rate limits
     * @type {Map<string, Object>}
     * @private
     */
    this._rateLimits = new Map();

    /**
     * قائمة الطلبات المتزامنة
     * @type {Map<string, Array<Object>>}
     * @private
     */
    this._queues = new Map();

    /**
     * قائمة بأوقات الانتظار للطلبات المعلقة
     * @type {Map<string, NodeJS.Timeout>}
     * @private
     */
    this._timeouts = new Map();

    /**
     * خيارات مدير REST
     * @type {Object}
     */
    this.options = Object.assign({
      userAgentAppendix: '',
    }, options);

    // إعداد محطة axios
    this.api = axios.create({
      baseURL: Constants.API.BASE,
      timeout: this.restRequestTimeout,
      headers: {
        'User-Agent': `${Constants.LIBRARY_NAME}/${Constants.VERSION} ${this.options.userAgentAppendix}`.trim(),
        'Content-Type': 'application/json',
      },
    });

    // إعداد معالجات الطلبات
    this._setupRequestInterceptors();
    this._setupResponseInterceptors();
  }

  /**
   * Set the token to use for API requests
   * @param {string} token - The token to use
   */
  setToken(token) {
    this._token = token;
    this.api.defaults.headers.common['Authorization'] = token;
  }

  /**
   * إعداد معالجات اعتراض الطلبات
   * @private
   */
  _setupRequestInterceptors() {
    this.api.interceptors.request.use(config => {
      return this._handleRateLimit(config);
    }, error => {
      return Promise.reject(error);
    });
  }

  /**
   * إعداد معالجات اعتراض الاستجابات
   * @private
   */
  _setupResponseInterceptors() {
    this.api.interceptors.response.use(response => {
      this._updateRateLimit(response);
      return response;
    }, async error => {
      if (error.response) {
        const { status, headers } = error.response;
        const route = this._getAPIRoute(error.config);

        // معالجة حدود الطلبات
        if (status === 429) {
          const retryAfter = headers['retry-after'] ? Number(headers['retry-after']) * 1000 : this.retryAfter;
          this._updateRateLimit(error.response, retryAfter);
          
          // إعادة المحاولة
          const retryConfig = { ...error.config };
          retryConfig._retryCount = (retryConfig._retryCount || 0) + 1;
          
          if (retryConfig._retryCount <= this.retryLimit) {
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            return this.api(retryConfig);
          }
        }

        // خطأ في التصديق
        if (status === 401) {
          this.client.emit('error', new Error('INVALID_TOKEN'));
        }

        // حظر
        if (status === 403) {
          this.client.emit('error', new Error(`FORBIDDEN: ${error.response.data.message}`));
        }

        // الخادم غير موجود
        if (status === 404) {
          this.client.emit('debug', `Resource not found: ${route}`);
        }

        // خطأ في الخادم
        if (status >= 500) {
          this.client.emit('error', new Error(`API ERROR: ${status} ${error.response.data.message}`));
        }
      }

      // محاولة الإعادة التلقائية
      if (error.config && !error.config._retryCount) {
        error.config._retryCount = 1;
        if (error.config._retryCount <= this.retryLimit) {
          await new Promise(resolve => setTimeout(resolve, this.retryAfter));
          return this.api(error.config);
        }
      }

      return Promise.reject(error);
    });
  }

  /**
   * الحصول على مسار API من تكوين الطلب
   * @param {Object} config - تكوين الطلب
   * @returns {string} مسار API
   * @private
   */
  _getAPIRoute(config) {
    let route = config.url.replace(/\/\d+/g, '/:id');
    if (config.params) {
      const paramKeys = Object.keys(config.params).sort();
      for (const key of paramKeys) {
        if (config.params[key]) {
          route += `&${key}=${config.params[key]}`;
        }
      }
    }
    return `${config.method}:${route}`;
  }

  /**
   * التعامل مع حدود الطلبات قبل إرسال الطلب
   * @param {Object} config - تكوين الطلب
   * @returns {Promise<Object>} تكوين الطلب المحدث
   * @private
   */
  async _handleRateLimit(config) {
    const route = this._getAPIRoute(config);
    const rateLimitInfo = this._rateLimits.get(route);

    // إذا كان API محدود الطلبات
    if (rateLimitInfo && rateLimitInfo.limited) {
      const now = Date.now();
      
      if (now < rateLimitInfo.reset) {
        const waitTime = rateLimitInfo.reset - now + this.restTimeOffset;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    return config;
  }

  /**
   * تحديث معلومات حدود الطلبات من الاستجابة
   * @param {Object} response - استجابة الخادم
   * @param {number} [retryAfter] - وقت إعادة المحاولة (إذا كان متاحًا)
   * @private
   */
  _updateRateLimit(response, retryAfter = 0) {
    const { config, headers } = response;
    const route = this._getAPIRoute(config);

    let rateLimitInfo = this._rateLimits.get(route) || { limited: false, limit: 0, remaining: 0, reset: 0 };
    
    if (headers) {
      const limit = headers['x-ratelimit-limit'];
      const remaining = headers['x-ratelimit-remaining'];
      const reset = headers['x-ratelimit-reset'];
      const resetAfter = headers['x-ratelimit-reset-after'];

      if (limit) rateLimitInfo.limit = Number(limit);
      if (remaining) rateLimitInfo.remaining = Number(remaining);
      
      if (resetAfter) {
        rateLimitInfo.reset = Date.now() + Number(resetAfter) * 1000;
      } else if (reset) {
        rateLimitInfo.reset = Number(reset) * 1000;
      }

      // إذا كان هناك طلب 429 (تجاوز حدود الطلبات)
      if (retryAfter > 0) {
        rateLimitInfo.limited = true;
        rateLimitInfo.reset = Date.now() + retryAfter;
      } else {
        rateLimitInfo.limited = rateLimitInfo.remaining === 0 && rateLimitInfo.reset > Date.now();
      }
    }

    this._rateLimits.set(route, rateLimitInfo);
  }

  /**
   * Make an HTTP request to the Discord API
   * @param {string} method - The HTTP method
   * @param {string} path - The path on the API
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - The response data
   */
  make(method, path, options = {}) {
    const url = path.startsWith('https://') ? path : `${this.api}${path}`;
    const headers = {
      Authorization: this._token,
      'User-Agent': `${Constants.LIBRARY_NAME} (${Constants.VERSION})`,
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const requestOptions = {
      method: method.toUpperCase(),
      url,
      headers,
      data: options.data,
      params: options.query,
      timeout: this.restRequestTimeout,
    };

    return this._request(requestOptions);
  }

  /**
   * Handle API response based on status code
   * @param {Object} response - The API response
   * @param {Object} requestOptions - The options used for the request
   * @param {number} retryCount - The number of times the request has been retried
   * @returns {Promise<Object>} - The processed response data
   * @private
   */
  async _handleResponse(response, requestOptions, retryCount = 0) {
    // Process any rate limit info
    this._processRateLimit(response, requestOptions.url);

    // If we got a response, return the data
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    // Handle 429 - Too Many Requests (Rate Limited)
    if (response.status === 429) {
      const retryAfter = response.headers['retry-after'] 
        ? parseInt(response.headers['retry-after']) * 1000 
        : this.retryAfter;
      
      this.client.emit('debug', `Rate limited on ${requestOptions.url}. Retrying after ${retryAfter}ms`);
      
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      return this._request(requestOptions, retryCount);
    }

    // Handle specific error codes
    switch (response.status) {
      case 401: // Unauthorized
        throw new Error('UNAUTHORIZED');
      case 403: // Forbidden
        throw new Error('FORBIDDEN');
      case 404: // Not Found
        throw new Error('NOT_FOUND');
      case 500: // Internal Server Error
      case 502: // Bad Gateway
      case 503: // Service Unavailable
      case 504: // Gateway Timeout
        if (retryCount < this.retryLimit) {
          const retryAfter = Math.floor(Math.random() * 1000) + 1000;
          this.client.emit('debug', `Server error ${response.status} on ${requestOptions.url}. Retrying after ${retryAfter}ms`);
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          return this._request(requestOptions, retryCount + 1);
        }
        throw new Error('SERVER_ERROR');
      default:
        throw new Error(`UNKNOWN_ERROR: ${response.status}`);
    }
  }

  /**
   * Perform a request with retry logic
   * @param {Object} options - The axios request options
   * @param {number} retryCount - The number of times the request has been retried
   * @returns {Promise<Object>} - The response data
   * @private
   */
  async _request(options, retryCount = 0) {
    try {
      const response = await axios(options);
      return this._handleResponse(response, options, retryCount);
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return this._handleResponse(error.response, options, retryCount);
      } else if (error.request) {
        // The request was made but no response was received
        if (retryCount < this.retryLimit) {
          const retryAfter = Math.floor(Math.random() * 1000) + 1000;
          this.client.emit('debug', `Request timeout on ${options.url}. Retrying after ${retryAfter}ms`);
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          return this._request(options, retryCount + 1);
        }
        throw new Error('REQUEST_TIMEOUT');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw error;
      }
    }
  }

  /**
   * Process the rate limit information from a response
   * @param {Object} response - The API response
   * @param {string} path - The request path
   * @private
   */
  _processRateLimit(response, path) {
    if (!response || !response.headers) return;

    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];
    const limit = response.headers['x-ratelimit-limit'];
    const bucket = response.headers['x-ratelimit-bucket'];
    
    if (bucket && remaining !== undefined && reset !== undefined) {
      this._rateLimits.set(bucket, {
        remaining: parseInt(remaining),
        reset: parseInt(reset) * 1000, // Convert to milliseconds
        limit: parseInt(limit),
        path,
      });
    }
  }

  /**
   * Make a GET request to the Discord API
   * @param {string} path - The path on the API
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - The response data
   */
  get(path, options = {}) {
    return this.make('get', path, options);
  }

  /**
   * Make a POST request to the Discord API
   * @param {string} path - The path on the API
   * @param {Object} data - The data to send
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - The response data
   */
  post(path, data, options = {}) {
    options.data = data;
    return this.make('post', path, options);
  }

  /**
   * Make a PUT request to the Discord API
   * @param {string} path - The path on the API
   * @param {Object} data - The data to send
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - The response data
   */
  put(path, data, options = {}) {
    options.data = data;
    return this.make('put', path, options);
  }

  /**
   * Make a PATCH request to the Discord API
   * @param {string} path - The path on the API
   * @param {Object} data - The data to send
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - The response data
   */
  patch(path, data, options = {}) {
    options.data = data;
    return this.make('patch', path, options);
  }

  /**
   * Make a DELETE request to the Discord API
   * @param {string} path - The path on the API
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - The response data
   */
  delete(path, options = {}) {
    return this.make('delete', path, options);
  }
}

module.exports = RESTManager; 