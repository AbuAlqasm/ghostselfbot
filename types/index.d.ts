/**
 * Type definitions for GhostSelfBot
 * GhostNet Team © 2025-2026
 */

declare module 'ghostselfbot' {
  export const version: string;

  /** Main client class for interacting with the Discord API */
  export class Client {
    /**
     * Creates a new Discord client
     * @param options - Configuration options for the client
     */
    constructor(options?: ClientOptions);

    /** The client user */
    user: User;

    /** The WebSocket ping in milliseconds */
    readonly ws: { ping: number };

    /** Collection of cached channels */
    channels: Collection<string, Channel>;

    /** Collection of cached guilds */
    guilds: Collection<string, Guild>;

    /** Collection of cached users */
    users: Collection<string, User>;

    /**
     * Adds a listener for an event
     * @param event - The event name
     * @param listener - The callback function
     */
    on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;

    /**
     * Adds a one-time listener for an event
     * @param event - The event name
     * @param listener - The callback function
     */
    once<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;

    /**
     * Removes a listener for an event
     * @param event - The event name
     * @param listener - The callback function
     */
    off<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;

    /**
     * Emits an event
     * @param event - The event name
     * @param args - Arguments to pass to the listeners
     */
    emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): boolean;

    /**
     * Logs in to Discord
     * @param token - The token to log in with
     */
    login(token: string): Promise<string>;

    /**
     * Destroys the client and disconnects from Discord
     */
    destroy(): Promise<void>;
  }

  /** Options for client configuration */
  export interface ClientOptions {
    /** The maximum number of messages to cache per channel */
    messageCacheMaxSize?: number;
    
    /** The time messages should remain in cache before being considered for removal (in ms) */
    messageCacheLifetime?: number;
    
    /** The interval at which to sweep messages from the cache (in ms) */
    messageSweepInterval?: number;
    
    /** Time added to REST request timeouts (in ms) */
    restTimeOffset?: number;
    
    /** Time before a REST request times out (in ms) */
    restRequestTimeout?: number;
    
    /** Number of times to retry a failed request */
    retryLimit?: number;
    
    /** Initial presence data */
    presence?: PresenceData;
  }

  /** Presence data */
  export interface PresenceData {
    /** Status of the client */
    status?: 'online' | 'idle' | 'dnd' | 'invisible';
    
    /** Activity data */
    activities?: ActivityData[];
  }

  /** Activity data */
  export interface ActivityData {
    /** Name of the activity */
    name: string;
    
    /** Type of the activity */
    type: ActivityType;
    
    /** URL for streaming status */
    url?: string;
    
    /** Status for custom status */
    state?: string;
  }

  /** Activity types */
  export enum ActivityType {
    PLAYING = 0,
    STREAMING = 1,
    LISTENING = 2,
    WATCHING = 3,
    CUSTOM = 4,
    COMPETING = 5
  }

  /** User class representing a Discord user */
  export class User {
    /** The user's ID */
    id: string;
    
    /** The user's username */
    username: string;
    
    /** The user's discriminator */
    discriminator: string;
    
    /** The user's global name */
    globalName: string | null;
    
    /** The user's avatar hash */
    avatar: string | null;
    
    /** Whether the user is a bot */
    bot: boolean;
    
    /** The user's flags */
    flags: number;
    
    /** The user's tag (username#discriminator) */
    tag: string;
    
    /** The user's presence */
    presence: Presence;

    /**
     * Creates a DM channel with the user
     */
    createDM(): Promise<DMChannel>;

    /**
     * Fetches the user's profile
     */
    fetchProfile(): Promise<UserProfile>;

    /**
     * Sets the user's presence
     * @param data - The presence data
     */
    setPresence(data: PresenceData): Promise<void>;
  }

  /** Message class representing a Discord message */
  export class Message {
    /** The message ID */
    id: string;
    
    /** The channel the message was sent in */
    channel: Channel;
    
    /** The guild the message was sent in, if applicable */
    guild: Guild | null;
    
    /** The message author */
    author: User;
    
    /** The message content */
    content: string;
    
    /** When the message was sent */
    createdAt: Date;
    
    /** Whether the message was edited */
    edited: boolean;
    
    /** When the message was last edited */
    editedAt: Date | null;
    
    /** The message embeds */
    embeds: Embed[];
    
    /** Users mentioned in the message */
    mentions: {
      users: Collection<string, User>;
      roles: Collection<string, Role>;
      channels: Collection<string, Channel>;
      everyone: boolean;
    };

    /**
     * Sends a reply to the message
     * @param content - The content to send
     */
    reply(content: string | MessageOptions): Promise<Message>;

    /**
     * Edits the message
     * @param content - The new content
     */
    edit(content: string | MessageOptions): Promise<Message>;

    /**
     * Deletes the message
     */
    delete(): Promise<Message>;

    /**
     * Reacts to the message
     * @param emoji - The emoji to react with
     */
    react(emoji: string): Promise<MessageReaction>;
  }

  /** Embed class for creating rich embeds */
  export class Embed {
    /**
     * Sets the title of the embed
     * @param title - The title to set
     */
    setTitle(title: string): this;

    /**
     * Sets the description of the embed
     * @param description - The description to set
     */
    setDescription(description: string): this;

    /**
     * Sets the URL of the embed
     * @param url - The URL to set
     */
    setURL(url: string): this;

    /**
     * Sets the color of the embed
     * @param color - The color to set (hex number)
     */
    setColor(color: number): this;

    /**
     * Sets the timestamp of the embed
     * @param timestamp - The timestamp to set
     */
    setTimestamp(timestamp?: Date | number): this;

    /**
     * Sets the thumbnail of the embed
     * @param url - The URL of the thumbnail
     */
    setThumbnail(url: string): this;

    /**
     * Sets the image of the embed
     * @param url - The URL of the image
     */
    setImage(url: string): this;

    /**
     * Sets the author of the embed
     * @param options - Author options
     */
    setAuthor(options: { name: string; iconURL?: string; url?: string }): this;

    /**
     * Sets the footer of the embed
     * @param options - Footer options
     */
    setFooter(options: { text: string; iconURL?: string }): this;

    /**
     * Adds fields to the embed
     * @param fields - The fields to add
     */
    addFields(...fields: { name: string; value: string; inline?: boolean }[]): this;

    /**
     * Adds a field to the embed
     * @param name - The name of the field
     * @param value - The value of the field
     * @param inline - Whether the field should be inline
     */
    addField(name: string, value: string, inline?: boolean): this;
  }

  /** Channel class representing a Discord channel */
  export class Channel {
    /** The channel ID */
    id: string;
    
    /** The channel type */
    type: ChannelType;
    
    /** The guild the channel belongs to, if applicable */
    guild: Guild | null;
    
    /** The channel name */
    name: string | null;

    /**
     * Sends a message to the channel
     * @param content - The content to send
     */
    send(content: string | MessageOptions): Promise<Message>;

    /**
     * Deletes the channel
     */
    delete(): Promise<Channel>;
  }

  /** Guild class representing a Discord server */
  export class Guild {
    /** The guild ID */
    id: string;
    
    /** The guild name */
    name: string;
    
    /** The guild icon hash */
    icon: string | null;
    
    /** The guild description */
    description: string | null;
    
    /** The collection of channels in the guild */
    channels: Collection<string, Channel>;
    
    /** The collection of members in the guild */
    members: Collection<string, GuildMember>;
    
    /** The collection of roles in the guild */
    roles: Collection<string, Role>;
  }

  /** GuildMember class representing a member of a Discord server */
  export class GuildMember {
    /** The guild the member belongs to */
    guild: Guild;
    
    /** The user object of the member */
    user: User;
    
    /** The member's nickname */
    nickname: string | null;
    
    /** The collection of roles the member has */
    roles: Collection<string, Role>;
  }

  /** Collection class for storing and managing data */
  export class Collection<K, V> extends Map<K, V> {
    /**
     * Finds an item in the collection based on a predicate
     * @param fn - The predicate function
     */
    find(fn: (item: V, key: K, collection: this) => boolean): V | undefined;

    /**
     * Filters the collection based on a predicate
     * @param fn - The predicate function
     */
    filter(fn: (item: V, key: K, collection: this) => boolean): Collection<K, V>;

    /**
     * Maps the collection to an array
     * @param fn - The mapping function
     */
    map<T>(fn: (item: V, key: K, collection: this) => T): T[];

    /**
     * Gets the size of the collection
     */
    get size(): number;
  }

  /** Channel types */
  export enum ChannelType {
    GUILD_TEXT = 0,
    DM = 1,
    GUILD_VOICE = 2,
    GROUP_DM = 3,
    GUILD_CATEGORY = 4,
    GUILD_ANNOUNCEMENT = 5,
    ANNOUNCEMENT_THREAD = 10,
    PUBLIC_THREAD = 11,
    PRIVATE_THREAD = 12,
    GUILD_STAGE_VOICE = 13,
    GUILD_DIRECTORY = 14,
    GUILD_FORUM = 15
  }

  /** Presence class representing a user's presence */
  export interface Presence {
    /** The user's status */
    status: 'online' | 'idle' | 'dnd' | 'offline';
    
    /** The user's activities */
    activities: Activity[];
    
    /** The user's client status */
    clientStatus: {
      desktop?: 'online' | 'idle' | 'dnd' | 'offline';
      mobile?: 'online' | 'idle' | 'dnd' | 'offline';
      web?: 'online' | 'idle' | 'dnd' | 'offline';
    };
  }

  /** Activity class representing a user activity */
  export interface Activity {
    /** The activity name */
    name: string;
    
    /** The activity type */
    type: ActivityType;
    
    /** The activity URL, if applicable */
    url?: string;
    
    /** When the activity started */
    createdAt: Date;
    
    /** Timestamps for the activity */
    timestamps?: {
      start?: Date;
      end?: Date;
    };
    
    /** Application ID associated with the activity */
    applicationId?: string;
    
    /** Activity details */
    details?: string;
    
    /** Activity state */
    state?: string;
    
    /** Activity emoji */
    emoji?: {
      name: string;
      id?: string;
      animated?: boolean;
    };
    
    /** Party information */
    party?: {
      id?: string;
      size?: [current: number, max: number];
    };
    
    /** Assets for the activity */
    assets?: {
      largeText?: string;
      smallText?: string;
      largeImage?: string;
      smallImage?: string;
    };
  }

  /** Client events */
  export interface ClientEvents {
    ready: [];
    message: [message: Message];
    messageUpdate: [oldMessage: Message | null, newMessage: Message];
    messageDelete: [message: Message];
    messageReactionAdd: [reaction: MessageReaction, user: User];
    messageReactionRemove: [reaction: MessageReaction, user: User];
    channelCreate: [channel: Channel];
    channelUpdate: [oldChannel: Channel, newChannel: Channel];
    channelDelete: [channel: Channel];
    guildCreate: [guild: Guild];
    guildUpdate: [oldGuild: Guild, newGuild: Guild];
    guildDelete: [guild: Guild];
    guildMemberAdd: [member: GuildMember];
    guildMemberUpdate: [oldMember: GuildMember, newMember: GuildMember];
    guildMemberRemove: [member: GuildMember];
    presenceUpdate: [oldPresence: Presence | null, newPresence: Presence];
    userUpdate: [oldUser: User, newUser: User];
    error: [error: Error];
    warn: [message: string];
    debug: [message: string];
    rateLimit: [rateLimitData: RateLimitData];
  }

  /** Rate limit data */
  export interface RateLimitData {
    /** The HTTP method used */
    method: string;
    
    /** The path hit by the request */
    path: string;
    
    /** The route hit by the request */
    route: string;
    
    /** The timeout in ms */
    timeout: number;
    
    /** When the route will no longer be rate limited */
    limit: number;
  }

  /** Options for sending a message */
  export interface MessageOptions {
    /** The message content */
    content?: string;
    
    /** The embeds to send */
    embeds?: Embed[];
    
    /** Whether the message should use text-to-speech */
    tts?: boolean;
    
    /** Message components (buttons, select menus, etc.) */
    components?: unknown[];
    
    /** Files to send */
    files?: unknown[];
    
    /** Whether to allow mentions */
    allowedMentions?: {
      parse?: ('users' | 'roles' | 'everyone')[];
      users?: string[];
      roles?: string[];
    };
  }

  /** Message reaction */
  export interface MessageReaction {
    /** The message this reaction is for */
    message: Message;
    
    /** The emoji used */
    emoji: {
      name: string;
      id: string | null;
      animated: boolean;
    };
    
    /** The number of reactions */
    count: number;
    
    /** Whether the current user reacted */
    me: boolean;
  }

  /** Role class representing a Discord role */
  export interface Role {
    /** The role ID */
    id: string;
    
    /** The guild the role belongs to */
    guild: Guild;
    
    /** The role name */
    name: string;
    
    /** The role color */
    color: number;
    
    /** The role's position */
    position: number;
    
    /** The role permissions */
    permissions: bigint;
    
    /** Whether the role is mentionable */
    mentionable: boolean;
    
    /** Whether the role is hoisted (displayed separately) */
    hoist: boolean;
    
    /** Whether the role is managed by an integration */
    managed: boolean;
  }

  /** DM Channel */
  export interface DMChannel extends Channel {
    /** The recipient of the DM */
    recipient: User;
  }

  /** User profile */
  export interface UserProfile {
    /** The user */
    user: User;
    
    /** The user's premium type */
    premiumType: number;
    
    /** The user's connections */
    connections: unknown[];
    
    /** The user's mutual guilds */
    mutualGuilds: Guild[];
  }

  /** Utility functions */
  export const Util: {
    /**
     * Resolves a color to a number
     * @param color - The color to resolve
     */
    resolveColor(color: string | number): number;
    
    /**
     * Escapes markdown characters
     * @param text - The text to escape
     */
    escapeMarkdown(text: string): string;
    
    /**
     * Splits a message into chunks
     * @param text - The text to split
     * @param options - Split options
     */
    splitMessage(text: string, options?: { maxLength?: number; char?: string; prepend?: string; append?: string }): string[];
  };

  /** Constants used throughout the library */
  export const Constants: {
    /** API Endpoints */
    Endpoints: Record<string, string>;
    
    /** HTTP Methods */
    HTTPMethods: Record<string, string>;
    
    /** Status Codes */
    StatusCodes: Record<number, string>;
    
    /** WebSocket Events */
    WSEvents: Record<string, number>;
    
    /** Activity Types */
    ActivityTypes: Record<string, number>;
    
    /** Channel Types */
    ChannelTypes: Record<string, number>;
  };
}

/**
 * @example
 * ```typescript
 * import { Client, Embed } from 'ghostselfbot';
 * 
 * const client = new Client();
 * 
 * client.on('ready', () => {
 *   console.log(`Logged in as ${client.user.tag}!`);
 * });
 * 
 * client.on('message', message => {
 *   if (message.author.id !== client.user.id) return;
 *   
 *   if (message.content === '!ping') {
 *     message.reply(`Pong! API Latency: ${client.ws.ping}ms`);
 *   }
 * });
 * 
 * client.login('YOUR_TOKEN_HERE');
 * ```
 */ 