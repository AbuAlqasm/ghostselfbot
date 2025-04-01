# 📚 GhostSelfBot Library - Developer's Guide

Welcome to the comprehensive developer's guide for the GhostSelfBot library. This guide will help you understand how to integrate, customize, and extend our library to create powerful Discord self-bots.

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Auto-Response Systems](#auto-response-systems)
- [Advanced Usage](#advanced-usage)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Installation

Install GhostSelfBot from npm:

```bash
npm install ghostselfbot
```

## Getting Started

### Basic Setup

Create a new JavaScript file (e.g., `bot.js`) and add the following code:

```javascript
// Import the library
const { Client } = require('ghostselfbot');

// Create a new client
const client = new Client({
  messageCacheMaxSize: 100, // Number of messages to cache
  messageCacheLifetime: 3600000 // Cache lifetime in milliseconds (1 hour)
});

// Set up event listeners
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Handle incoming messages
client.on('message', message => {
  // Don't respond to messages from other users if you only want to process your own commands
  if (message.author.id !== client.user.id) return;
  
  if (message.content === '!ping') {
    message.reply(`Pong! API Latency: ${client.ws.ping}ms`);
  }
});

// Login with your token
client.login('YOUR_TOKEN_HERE')
  .then(() => console.log('Login successful!'))
  .catch(err => console.error('Login failed:', err));
```

## Core Concepts

### Client

The `Client` class is the main interface for interacting with Discord. It manages the WebSocket connection, events, and API requests.

```javascript
const client = new Client({
  // Configuration options
  messageCacheMaxSize: 200,
  restTimeOffset: 500,
  restRequestTimeout: 15000,
  retryLimit: 3
});
```

### Events

The library uses event-based programming to respond to Discord events. Here are some key events:

```javascript
// Fired when the client is ready
client.on('ready', () => {
  console.log('Bot is ready!');
});

// Fired when a message is received
client.on('message', message => {
  console.log(`Received message: ${message.content}`);
});

// Fired when a message reaction is added
client.on('messageReactionAdd', (reaction, user) => {
  console.log(`${user.tag} reacted with ${reaction.emoji.name}`);
});

// Error handling
client.on('error', error => {
  console.error('Client error:', error);
});

// Debug information
client.on('debug', info => {
  console.log('Debug:', info);
});
```

### Messages

The `Message` class provides methods to work with Discord messages:

```javascript
// Reply to a message
message.reply('This is a reply!');

// Send a message to a channel
message.channel.send('Hello, world!');

// Send an embed
const { Embed } = require('ghostselfbot');
const embed = new Embed()
  .setTitle('Hello')
  .setDescription('This is an embed message')
  .setColor(0x00FFFF);

message.channel.send({ embeds: [embed] });

// Delete a message
message.delete().then(() => console.log('Message deleted!'));
```

## API Reference

### Client Options

When initializing a new `Client`, you can specify several configuration options:

```javascript
const client = new Client({
  // Cache settings
  messageCacheMaxSize: 200, // Maximum number of messages to store in cache
  messageCacheLifetime: 0, // How long a message should stay in cache (0 = forever)
  messageSweepInterval: 0, // How frequently to remove old messages (0 = never)
  
  // REST API settings
  restTimeOffset: 500, // Extra time in ms to wait before making requests
  restRequestTimeout: 15000, // Time to wait before a request times out
  retryLimit: 3, // Number of times to retry a failed request
  
  // Presence settings
  presence: {
    status: 'online', // Status: online, idle, dnd, invisible
    activities: [{
      name: 'with GhostSelfBot',
      type: 0 // 0: Playing, 1: Streaming, 2: Listening, 3: Watching, 5: Competing
    }]
  }
});
```

### User Management

Work with Discord users:

```javascript
// Get the current user
console.log(`Logged in as ${client.user.tag}`);

// Get a user by ID
const user = client.users.get('USER_ID');
console.log(`Username: ${user.username}`);

// Get user presence
console.log(`Status: ${user.presence.status}`);
```

### Guild (Server) Operations

Work with Discord servers:

```javascript
// Get a list of all guilds the client is in
console.log(`In ${client.guilds.size} guilds`);

// Get a specific guild
const guild = client.guilds.get('GUILD_ID');
console.log(`Guild name: ${guild.name}`);

// Get a list of members in a guild
console.log(`Guild has ${guild.members.size} members`);

// Get a member from a guild
const member = guild.members.get('USER_ID');
console.log(`Member roles: ${member.roles.map(r => r.name).join(', ')}`);
```

### Channel Operations

Work with Discord channels:

```javascript
// Get a channel by ID
const channel = client.channels.get('CHANNEL_ID');

// Send a message to a channel
channel.send('Hello, world!');

// Get channel type
console.log(`Channel type: ${channel.type}`);

// Get a DM channel with a user
const user = client.users.get('USER_ID');
const dmChannel = await user.createDM();
dmChannel.send('This is a direct message!');
```

## Auto-Response Systems

GhostSelfBot provides powerful auto-response capabilities. Here's how to implement them:

### Away Mode Auto-Responder

The away mode auto-responder automatically replies to direct messages and mentions when you're not available:

```javascript
const { Client } = require('ghostselfbot');
const client = new Client();

// Set up variables
let isAway = false;
let awayMessage = "I'm currently away and will respond when I return.";
const respondedUsers = new Map();
const responseExpiry = 3600000; // 1 hour in milliseconds

// Listen for commands to toggle away mode
client.on('message', message => {
  if (message.author.id !== client.user.id) return;

  if (message.content === '!away on') {
    isAway = true;
    message.reply('Away mode is now **enabled**.');
  } else if (message.content === '!away off') {
    isAway = false;
    message.reply('Away mode is now **disabled**.');
  } else if (message.content.startsWith('!away message ')) {
    awayMessage = message.content.slice('!away message '.length);
    message.reply(`Away message set to: ${awayMessage}`);
  }
});

// Auto-respond to messages
client.on('message', async message => {
  // Ignore own messages and check if away mode is enabled
  if (message.author.id === client.user.id || !isAway) return;

  // Check if it's a DM or a mention
  const isDM = message.channel.type === 'DM';
  const isMention = message.mentions.users.has(client.user.id);

  if (isDM || isMention) {
    // Check if we've already responded to this user recently
    if (respondedUsers.has(message.author.id)) {
      const lastResponseTime = respondedUsers.get(message.author.id);
      if (Date.now() - lastResponseTime < responseExpiry) return;
    }

    // Record response time
    respondedUsers.set(message.author.id, Date.now());

    // Create embed for auto-response
    const embed = {
      title: 'Automatic Response',
      description: awayMessage,
      color: 0x00AAFF,
      timestamp: new Date()
    };

    // Send the response
    try {
      await message.channel.send({ content: '⚠️ Auto-Response', embeds: [embed] });
      console.log(`Auto-responded to ${message.author.tag} in ${isDM ? 'DM' : 'server'}`);
    } catch (error) {
      console.error('Error sending auto-response:', error);
    }
  }
});

client.login('YOUR_TOKEN_HERE');
```

### Keyword-Based Auto-Responder

Set up automatic responses to specific keywords:

```javascript
const { Client } = require('ghostselfbot');
const client = new Client();

// Configuration
let keywordResponderEnabled = true;
const keywordResponses = new Map();
const excludedChannels = new Set();

// Add some default keywords
keywordResponses.set('help', 'Need assistance? Try using !commands to see available commands.');
keywordResponses.set('hello', 'Hello there! How can I help you today?');

// Command handling
client.on('message', message => {
  if (message.author.id !== client.user.id) return;

  if (message.content === '!keyword on') {
    keywordResponderEnabled = true;
    message.reply('Keyword responder is now **enabled**.');
  } else if (message.content === '!keyword off') {
    keywordResponderEnabled = false;
    message.reply('Keyword responder is now **disabled**.');
  } else if (message.content.startsWith('!keyword add ')) {
    const args = message.content.slice('!keyword add '.length).split(' ');
    const keyword = args.shift().toLowerCase();
    const response = args.join(' ');
    
    keywordResponses.set(keyword, response);
    message.reply(`Added keyword: **${keyword}** with response: ${response}`);
  } else if (message.content.startsWith('!keyword remove ')) {
    const keyword = message.content.slice('!keyword remove '.length).toLowerCase();
    
    if (keywordResponses.has(keyword)) {
      keywordResponses.delete(keyword);
      message.reply(`Removed keyword: **${keyword}**`);
    } else {
      message.reply(`Keyword **${keyword}** not found.`);
    }
  } else if (message.content === '!keyword list') {
    let list = 'Keyword responses:\n';
    keywordResponses.forEach((response, keyword) => {
      list += `- **${keyword}**: ${response}\n`;
    });
    message.channel.send(list);
  } else if (message.content.startsWith('!keyword exclude ')) {
    const channelId = message.content.slice('!keyword exclude '.length);
    excludedChannels.add(channelId);
    message.reply(`Channel <#${channelId}> excluded from keyword responses.`);
  }
});

// Keyword response logic
client.on('message', async message => {
  // Skip messages from self, or if responder is disabled
  if (message.author.id === client.user.id || !keywordResponderEnabled) return;
  
  // Skip excluded channels
  if (excludedChannels.has(message.channel.id)) return;
  
  // Check message content for keywords
  const content = message.content.toLowerCase();
  for (const [keyword, response] of keywordResponses.entries()) {
    if (content.includes(keyword)) {
      try {
        // Add a natural delay (between 1-3 seconds)
        const delay = 1000 + Math.random() * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Send the response
        await message.channel.send(response);
        console.log(`Keyword response triggered for "${keyword}" to ${message.author.tag}`);
        break; // Only respond once per message
      } catch (error) {
        console.error('Error sending keyword response:', error);
      }
    }
  }
});

client.login('YOUR_TOKEN_HERE');
```

## Advanced Usage

### Creating Custom Embeds

Create rich embed messages:

```javascript
const { Embed } = require('ghostselfbot');

// Create a new embed
const embed = new Embed()
  .setTitle('Welcome to GhostSelfBot!')
  .setDescription('This is a custom embed message.')
  .setColor(0xFF5733) // Hex color code
  .setThumbnail('https://example.com/thumbnail.png')
  .setImage('https://example.com/image.png')
  .setAuthor({
    name: 'GhostNet Team',
    iconURL: 'https://example.com/icon.png',
    url: 'https://github.com/ghostnetteam'
  })
  .addFields(
    { name: 'Field 1', value: 'Value 1', inline: true },
    { name: 'Field 2', value: 'Value 2', inline: true }
  )
  .setFooter({
    text: 'Powered by GhostSelfBot',
    iconURL: 'https://example.com/footer-icon.png'
  })
  .setTimestamp();

// Send the embed
message.channel.send({ embeds: [embed] });
```

### Managing Presence

Update your Discord presence:

```javascript
// Set a custom status
client.user.setPresence({
  status: 'dnd', // online, idle, dnd, invisible
  activities: [
    {
      name: 'GhostSelfBot',
      type: 0 // 0: Playing, 1: Streaming, 2: Listening, 3: Watching, 5: Competing
    }
  ]
});

// Set a custom status message
client.user.setPresence({
  status: 'online',
  activities: [
    {
      type: 4, // Custom Status
      name: 'Custom Status',
      state: 'Working on something cool'
    }
  ]
});

// Clear all activities
client.user.setPresence({
  status: 'online',
  activities: []
});
```

### Handling Events

Create robust event handlers:

```javascript
// Using a dictionary of handlers for cleaner code
const handlers = {
  ready: () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Currently in ${client.guilds.size} servers`);
  },
  
  message: (message) => {
    // Handle messages
    if (message.content === '!help') {
      // ...
    }
  },
  
  error: (error) => {
    console.error('Client error:', error);
  }
};

// Register all handlers
Object.entries(handlers).forEach(([event, handler]) => {
  client.on(event, handler);
});

// Make sure to handle promise rejections
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});
```

### Creating a Command Handler

Implement a flexible command system:

```javascript
const prefix = '!';
const commands = new Map();

// Register commands
commands.set('ping', {
  execute: (message, args) => {
    message.reply(`Pong! API Latency: ${client.ws.ping}ms`);
  },
  description: 'Check the bot latency'
});

commands.set('stats', {
  execute: (message, args) => {
    message.reply(`Currently in ${client.guilds.size} servers with ${client.users.size} users.`);
  },
  description: 'Show bot statistics'
});

commands.set('help', {
  execute: (message, args) => {
    let helpText = 'Available commands:\n';
    commands.forEach((cmd, name) => {
      helpText += `- **${prefix}${name}**: ${cmd.description}\n`;
    });
    message.channel.send(helpText);
  },
  description: 'Show this help message'
});

// Message handler
client.on('message', message => {
  // Ignore messages from other users or without the prefix
  if (message.author.id !== client.user.id || !message.content.startsWith(prefix)) return;
  
  // Parse command and arguments
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  // Check if command exists
  if (!commands.has(commandName)) return;
  
  try {
    // Execute the command
    commands.get(commandName).execute(message, args);
  } catch (error) {
    console.error(`Error executing command "${commandName}":`, error);
    message.reply('An error occurred while executing that command.');
  }
});
```

## Best Practices

### Security

1. **Protect your token**:
   - Store tokens in environment variables or a `.env` file
   - Use dotenv: `require('dotenv').config()`
   - Never commit tokens to version control

2. **Secure error handling**:
   ```javascript
   function sanitizeErrorMessage(error) {
     if (!error) return 'Unknown error';
     
     let errorMessage = error.toString();
     
     // Hide token if present in error message
     if (typeof errorMessage === 'string') {
       errorMessage = errorMessage.replace(/([A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27})/g, '[HIDDEN_TOKEN]');
     }
     
     return errorMessage;
   }
   
   client.on('error', error => {
     console.error('Error:', sanitizeErrorMessage(error));
   });
   ```

3. **Rate limiting awareness**:
   - Avoid making too many requests in a short period
   - Implement backoff strategies for retries

### Performance Optimization

1. **Efficient caching**:
   ```javascript
   const client = new Client({
     messageCacheMaxSize: 200, // Adjust based on your needs
     messageCacheLifetime: 3600, // Messages expire after 1 hour
     messageSweepInterval: 600 // Clean cache every 10 minutes
   });
   ```

2. **Avoid memory leaks**:
   - Clean up event listeners when no longer needed
   - Use WeakMap/WeakSet for references when appropriate

3. **Batch operations**:
   - Group similar API requests when possible
   - Process data in batches rather than one by one

### Debugging

1. **Enable debug mode**:
   ```javascript
   const client = new Client();
   
   // Set debug flag
   let debugMode = true;
   
   // Debug logging function
   function debugLog(...args) {
     if (debugMode) {
       console.log('[DEBUG]', ...args);
     }
   }
   
   client.on('debug', info => {
     debugLog(info);
   });
   ```

2. **Log important events**:
   ```javascript
   client.on('ready', () => debugLog('Client ready'));
   client.on('disconnect', (event) => debugLog('Disconnected from gateway', event));
   client.on('reconnecting', () => debugLog('Attempting to reconnect'));
   client.on('error', error => debugLog('Client error', sanitizeErrorMessage(error)));
   ```

## Troubleshooting

### Common Issues

1. **"Cannot send an empty message" Error**

   This happens when sending embeds without text content:

   ```javascript
   // Incorrect:
   message.channel.send({ embeds: [embed] });
   
   // Correct:
   message.channel.send({ content: '⚠️ Notice', embeds: [embed] });
   ```

2. **Token Issues**

   If you're experiencing authentication problems:

   - Ensure your token is correct and hasn't been reset
   - Check that you're using a user token, not a bot token
   - Verify your account hasn't been flagged by Discord

3. **Rate Limits**

   If you're hitting rate limits:

   ```javascript
   client.on('rateLimit', (info) => {
     console.warn(`Rate limit hit: ${info.method} ${info.path}`);
     console.warn(`Retry after: ${info.timeout}ms`);
   });
   ```

   Implement exponential backoff for retries:

   ```javascript
   async function makeRequestWithRetry(requestFn, maxRetries = 3) {
     let retries = 0;
     
     while (retries < maxRetries) {
       try {
         return await requestFn();
       } catch (error) {
         if (error.status === 429) { // Rate limit error
           const retryAfter = error.response?.data?.retry_after || 1;
           console.warn(`Rate limited. Retrying after ${retryAfter}s`);
           await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
           retries++;
         } else {
           throw error; // Not a rate limit error, rethrow
         }
       }
     }
     
     throw new Error(`Failed after ${maxRetries} retries`);
   }
   ```

### Getting Help

If you encounter issues not covered here:

1. **Check Documentation**: Review the [README](README.md) and [examples](examples/).
2. **GitHub Issues**: Check existing issues or create a new one on our [GitHub repository](https://github.com/ghostnetteam/ghostselfbot/issues).
3. **Debug Logs**: Enable debug mode and analyze the output for clues.

---

## Final Notes

Remember that using self-bots is against Discord's Terms of Service. This library is provided for educational purposes only, and we take no responsibility for how it is used.

For updates and more information, visit our [GitHub repository](https://github.com/ghostnetteam/ghostselfbot).

---

**GhostNet Team © 2025-2026**

*Made with ❤️ for the Discord community* 