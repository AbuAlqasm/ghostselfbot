# 🎭 GhostSelfBot X - Your Ultimate Discord Companion

<div align="center">

![Version](https://img.shields.io/badge/version-0.0.1-blue.svg?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg?style=for-the-badge)
![Discord](https://img.shields.io/badge/discord-compatible-738ADB.svg?style=for-the-badge)

**The most powerful, feature-rich selfbot library for Discord with advanced auto-response capabilities**

</div>

---

## 🚀 Features

GhostSelfBot X offers an impressive array of features designed to enhance your Discord experience:

- **✅ Advanced Auto-Response System**
  - Reply automatically when you're away
  - Customize your away message
  - Set DM-only mode for privacy
  - Receive notifications when auto-replies are sent

- **✅ Keyword-Based Auto-Responder**
  - Set up automatic responses to specific keywords
  - Create custom responses for different triggers
  - Exclude specific channels or servers

- **✅ Message Management**
  - Powerful message handling with automatic caching
  - Enhanced message reply functionality
  - Support for rich embeds and formatting

- **✅ Robust Infrastructure**
  - WebSocket connection monitoring
  - Advanced error handling
  - Detailed debugging options

- **✅ Security-Focused**
  - Token security protection
  - No sensitive information in logs
  - Rate limit handling to avoid flags

## ⚠️ Disclaimer

**IMPORTANT: Using selfbots is against Discord's Terms of Service and may result in account termination. Use at your own risk.**

This software is provided for educational purposes only. The developers take no responsibility for any consequences resulting from the use of this software.

## 📦 Installation

Install GhostSelfBot X using npm:

```bash
npm install ghostselfbotx
```

## 🔧 Quick Setup

```javascript
// Import the library
const { Client } = require('ghostselfbotx');

// Create a new client
const client = new Client({
  messageCacheMaxSize: 100 // Number of messages to cache
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

// Login with your token (use environment variables in production)
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('Login successful!'))
  .catch(err => console.error('Login failed:', err));
```

## 🤖 Auto-Response Systems

### Away Mode

Set up an automatic response system for when you're away:

```javascript
// Set up variables
let isAway = false;
let awayMessage = "I'm currently away and will respond when I return.";
const respondedUsers = new Map();

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
    try {
      const embed = {
        title: 'Automatic Response',
        description: awayMessage,
        color: 0x00AAFF,
        timestamp: new Date()
      };

      await message.channel.send({ content: '⚠️ Auto-Response', embeds: [embed] });
    } catch (error) {
      console.error('Error sending auto-response:', error);
    }
  }
});
```

### Keyword Responder

Set up automatic responses to specific keywords:

```javascript
// Configuration
let keywordResponderEnabled = true;
const keywordResponses = new Map();

// Add some default keywords
keywordResponses.set('help', 'Need assistance? Try using !commands.');
keywordResponses.set('hello', 'Hello there! How can I help you today?');

// Monitor messages for keywords
client.on('message', async message => {
  if (message.author.id === client.user.id || !keywordResponderEnabled) return;
  
  const content = message.content.toLowerCase();
  for (const [keyword, response] of keywordResponses.entries()) {
    if (content.includes(keyword)) {
      try {
        // Add a natural delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        await message.channel.send(response);
        break; // Only respond once per message
      } catch (error) {
        console.error('Error sending keyword response:', error);
      }
    }
  }
});
```

## 🔍 Advanced Usage

Check out our [detailed developer guide](./LIBRARY_GUIDE.md) for more advanced usage examples including:

- Custom embeds and rich content
- Presence management
- Command handling
- Custom event management
- Advanced security practices
- Debugging and troubleshooting

## 🔒 Security Best Practices

1. **Never hard-code your token** - Use environment variables:
   ```javascript
   require('dotenv').config();
   client.login(process.env.DISCORD_TOKEN);
   ```

2. **Sanitize error outputs** to avoid leaking your token:
   ```javascript
   function sanitizeErrorMessage(error) {
     if (!error) return 'Unknown error';
     
     let errorMessage = error.toString();
     return errorMessage.replace(/([A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27})/g, '[HIDDEN_TOKEN]');
   }
   ```

3. **Respect rate limits** to avoid detection and account flags

## 🆘 Need Help?

- Check the [detailed documentation](./LIBRARY_GUIDE.md)
- Review the [examples](./examples/) directory
- Open an issue on [GitHub](https://github.com/AbuAlqasm/ghostselfbot/issues)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**GhostNet Team © 2025-2026**

*Made with ❤️ for the Discord community*

</div> 