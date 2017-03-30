import {ChatWatcher} from './chat';
import {Storage} from '../../storage';
import {LogEntry} from './logs';

/**
 * The lists used by the server to check permissions.
 */
export interface WorldLists {
    /**
     * Player names on the adminlist.
     */
    adminlist: string[];
    /**
     * Player names on the modlist.
     */
    modlist: string[];
    /**
     * Player names on the whitelist.
     */
    whitelist: string[];
    /**
     * Player names on the blacklist. Will be stripped of device IDs.
     */
    blacklist: string[];
}

/**
 * The possible sizes that a world can be.
 */
export type WorldSizes = '1/16x' | '1/4x' | '1x' | '4x' | '16x';

/**
 * The possible privacy settings for a world.
 */
export type WorldPrivacy = 'public' | 'searchable' | 'private';

/**
 * General information about a world.
 */
export interface WorldOverview {
    /**
     * The name of the world.
     */
    name: string;

    /**
     * The owner's name.
     */
    owner: string;
    /**
     * When the world was created.
     */
    created: Date;
    /**
     * When the world was last joined.
     */
    last_activity: Date;
    /**
     * The time that the server's credit will expire. Set to year 9999 for mac servers.
     */
    credit_until: Date;
    /**
     * The link to join the server.
     */
    link: string;

    /**
     * Whether or not PVP is enabled.
     */
    pvp: boolean;
    /**
     * The privacy of the world.
     */
    privacy: WorldPrivacy;
    /**
     * Whether or not a password is set for the world.
     */
    password: boolean;
    /**
     * The size of the world.
     */
    size: WorldSizes;
    /**
     * Whether or not the server is whitelisted.
     */
    whitelist: boolean;

    /**
     * The names of players currently online.
     */
    online: string[];
}

/**
 * Options which can be provided when creating a new [[World]].
 */
export interface WorldOptions {
    /**
     * A [[ChatWatcher]] which, if specified, will be used to watch chat for new messages.
     */
    chatWatcher?: ChatWatcher;
    /**
     * A [[WorldApi]] to be used for interacting with the world.
     */
    api: WorldApi;
    /**
     * An instance of the [[Storage]] class for this world.
     */
    storage: Storage;
}

/**
 * The API used to interact with the portal or mac server. For cloud servers, this is implemented by the [[PortalApi]] class.
 */
export interface WorldApi {
    /**
     * Gets the current server lists.
     */
    getLists(): Promise<WorldLists>;
    /**
     * Gets the current world overview and online players
     */
    getOverview(): Promise<WorldOverview>;
    /**
     * Gets the server logs in a parsed format.
     */
    getLogs(): Promise<LogEntry[]>;
    /**
     * Sends a message to the server.
     */
    send(message: string): void;
}
