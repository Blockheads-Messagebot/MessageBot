import { WorldLists, WorldOverview, WorldOptions } from './types/world';
import { LogEntry } from './types/logs';
import { SimpleEvent } from '../simpleevent';
import { Player } from './player';
import { Storage } from '../storage';
/**
 * Class which contains functions for interacting with a world. Extensions can access this through ex.world.
 */
export declare class World {
    private readonly STORAGE_ID;
    private logs?;
    private players;
    private lists?;
    private overview?;
    /**
     * For interacting with the world.
     */
    private api;
    /**
     * Event fired whenever a player joins the server.
     */
    onJoin: SimpleEvent<Player>;
    /**
     * Event fired whenever a player leaves the server.
     */
    onLeave: SimpleEvent<Player>;
    /**
     * Event fired for all chat.
     */
    onMessage: SimpleEvent<{
        player: Player;
        message: string;
    }>;
    /**
     * Event fired for commands by all players.
     */
    onCommand: SimpleEvent<{
        player: Player;
        command: string;
        args: string;
    }>;
    /**
     * Event fired for all messages which failed to be parsed.
     */
    onOther: SimpleEvent<string>;
    /**
     * Storage class for this world.
     */
    storage: Storage;
    /**
     * Creates an instance of the World class. Note: These parameters are all passed in a single object.
     *
     * @param options the options to use when creating the class.
     */
    constructor({api, storage, chatWatcher}: WorldOptions);
    /**
     * Gets the current admin, mod, white, and black lists. The returned object should not be mutated.
     *
     * @return the current server lists.
     * @example
     * getLists().then(lists => {
     *   console.log(Object.keys(lists));
     * });
     */
    getLists: () => Promise<WorldLists>;
    /**
     * Gets the server logs and resolves with an array of the lines. The returned array should not be mutated.
     *
     * @param refresh whether or not the logs should be downloaded again.
     * @return the server logs.
     * @example
     * getLogs().then(lines => {
     *   lines.forEach(line => {
     *     //something
     *   });
     * });
     */
    getLogs: (refresh?: boolean) => Promise<LogEntry[]>;
    /**
     * Gets an overview of the server info, the returned object should not be mutated.
     *
     * @param refresh whether or not to re-fetch the page.
     * @return the world info.
     * @example
     * getOverview().then(console.log);
     */
    getOverview: (refresh?: boolean) => Promise<WorldOverview>;
    /**
     * Adds a message into the queue of messages to send.
     *
     * @param message the message to send.
     * @example
     * send('Hello!');
     */
    send: (message: string) => void;
    /**
     * Gets the names of all players which have joined the server.
     *
     * @return an array of names.
     * @example
     * world.getPlayerNames().forEach(name => {
     *   if (world.getPlayer(name).isAdmin()) {
     *     console.log(name);
     *   }
     * });
     */
    getPlayerNames: () => string[];
    /**
     * Gets an instance of the Player class for the specified name.
     *
     * @param name the player name to get.
     * @return the player, or a dummy player if they do not exist.
     * @example
     * let player = getPlayer('someone');
     * if (player.hasJoined()) { ... }
     */
    getPlayer: (name: string) => Player;
    /**
     * Continually watches chat for new messages and emits events when new messages come in.
     *
     * @param message the message to emit events for.
     */
    private messageWatcher;
    /**
     * Increments a player's joins and saves their IP.
     *
     * @param name the player's name
     * @param ip the player's IP
     */
    private handleJoin;
}
