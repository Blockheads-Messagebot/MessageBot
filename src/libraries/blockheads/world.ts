import {WorldLists, WorldOverview, WorldApi, WorldOptions} from './types/world';
import {LogEntry} from './types/logs';
import {ChatType, ChatMessage} from './types/chat';

import {SimpleEvent} from '../simpleevent';
import {Player} from './player';
import {Storage} from '../storage';

import {CommandWatcher} from './commandwatcher';

/**
 * Class which contains functions for interacting with a world. Extensions can access this through ex.world.
 */
export class World {
    private readonly STORAGE_ID = 'mb_players';

    // Caches
    private logs?: LogEntry[];
    private players: {[key: string]: {ip: string, ips: string[], joins: number, owner?: boolean}};
    private lists?: WorldLists;
    private overview?: WorldOverview;

    /**
     * For interacting with the world.
     */
    private api: WorldApi;

    // Events

    /**
     * Event fired whenever a player joins the server.
     */
    public onJoin = new SimpleEvent<Player>();

    /**
     * Event fired whenever a player leaves the server.
     */
    public onLeave = new SimpleEvent<Player>();

    /**
     * Event fired for all chat.
     */
    public onMessage = new SimpleEvent<{player: Player, message: string}>();

    /**
     * Event fired for commands by all players.
     */
    public onCommand = new SimpleEvent<{player: Player, command: string, args: string}>();

    /**
     * Event fired for all messages which failed to be parsed.
     */
    public onOther = new SimpleEvent<string>();

    /**
     * Storage class for this world.
     */
    public storage: Storage;

    /**
     * Creates an instance of the World class. Note: These parameters are all passed in a single object.
     *
     * @param options the options to use when creating the class.
     */
    constructor({api, storage, chatWatcher}: WorldOptions) {
        this.storage = storage;
        this.api = api;

        this.players = this.storage.getObject(this.STORAGE_ID, {});

        (async () => {
            if (!chatWatcher) {
                return;
            }

            let overview = await this.getOverview();
            if (this.players[overview.owner]) {
                this.players[overview.owner].owner = true;
            }

            chatWatcher.setup(overview.name, overview.online);
            chatWatcher.onMessage.subscribe(this.messageWatcher.bind(this));

            let lists = await this.getLists();
            let watcher = new CommandWatcher(lists, this.getPlayer.bind(this));
            this.onCommand.subscribe(watcher.listener);
        })();
    }

    //Methods

    /**
     * Gets the current admin, mod, white, and black lists. The returned object should not be mutated.
     *
     * @return the current server lists.
     * @example
     * getLists().then(lists => {
     *   console.log(Object.keys(lists));
     * });
     */
    getLists = (): Promise<WorldLists> => {
        if (this.lists) {
            return Promise.resolve(this.lists);
        }

        return this.api.getLists()
            .then(lists => this.lists = lists);
    }

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
    getLogs = (refresh = false): Promise<LogEntry[]> => {
        if (this.logs && !refresh) {
            return Promise.resolve(this.logs);
        }

        return this.api.getLogs()
            .then(logs => this.logs = logs);
    }

    /**
     * Gets an overview of the server info, the returned object should not be mutated.
     *
     * @param refresh whether or not to re-fetch the page.
     * @return the world info.
     * @example
     * getOverview().then(console.log);
     */
    getOverview = (refresh = false): Promise<WorldOverview> => {
        if (this.overview && !refresh) {
            return Promise.resolve(this.overview);
        }

        let online = this.overview ? this.overview.online : [];

        return this.api.getOverview().then(overview => {
            overview.online.forEach(name => {
                if (!online.includes(name)) {
                    online.push(name);
                }
            });

            overview.online = online;

            return this.overview = overview;
        });
    }

    /**
     * Adds a message into the queue of messages to send.
     *
     * @param message the message to send.
     * @example
     * send('Hello!');
     */
    send = (message: string): void => {
        this.api.send(message);
    }

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
    getPlayerNames = (): string[] => {
        return Object.keys(this.players);
    }

    /**
     * Gets an instance of the Player class for the specified name.
     *
     * @param name the player name to get.
     * @return the player, or a dummy player if they do not exist.
     * @example
     * let player = getPlayer('someone');
     * if (player.hasJoined()) { ... }
     */
    getPlayer = (name: string): Player => {
        name = name.toLocaleUpperCase();
        let info = this.players[name] || {ip: '', ips: [], joins: 0};

        if (this.overview && this.overview.owner == name) {
            info.owner = true;
        }

        return new Player(name, info, this.lists || {adminlist: [], modlist: [], whitelist: [], blacklist: []});
    }

    // Private methods

    /**
     * Continually watches chat for new messages and emits events when new messages come in.
     *
     * @param message the message to emit events for.
     */
    private messageWatcher = (message: ChatMessage) => {
        let player = this.getPlayer(message.name || '');
        switch (message.type) {
            case ChatType.join:
                return this.handleJoin(message.name, message.ip);
            case ChatType.leave:
                return this.onLeave.dispatch(player);
            case ChatType.command:
                return this.onCommand.dispatch({player, command: <string>message.command, args: <string>message.args});
            case ChatType.message:
                return this.onMessage.dispatch({player, message: <string>message.message});
            case ChatType.other:
                return this.onOther.dispatch(<string>message.message);
        }
    }

    /**
     * Increments a player's joins and saves their IP.
     *
     * @param name the player's name
     * @param ip the player's IP
     */
    private handleJoin = (name: string | undefined, ip: string | undefined) => {
        if (!name || !ip) {
            return;
        }

        let player = this.players[name] = this.players[name] || {
            ip, ips: [ip], joins: 0
        };

        player.joins++;
        player.ip = ip;
        if (!player.ips.includes(ip)) {
            player.ips.push(ip);
        }

        this.storage.set(this.STORAGE_ID, this.players);

        this.onJoin.dispatch(this.getPlayer(name));
    }
}
