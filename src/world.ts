import { WorldApi, LogEntry, WorldOverview, WorldLists } from 'blockheads-api-interface'

import { Player, PlayerInfo } from './player'
import { ChatWatcher } from './chatWatcher'
import { Storage } from './storage'
import { SimpleEvent, SafeSimpleEvent } from './events'

const cloneDate = (d: Date) => new Date(d.getTime())

const PLAYERS_KEY = 'mb_players'
type PlayerStorage = {[name: string]: PlayerInfo}

export class World {
    protected _api: WorldApi
    protected _storage: Storage
    protected _chatWatcher: ChatWatcher

    private _cache: {
        logs?: Promise<LogEntry[]>
        overview?: Promise<WorldOverview>
        lists?: Promise<WorldLists>
    } = {}

    private _events = {
        onJoin: new SimpleEvent<Player>(),
        onLeave: new SimpleEvent<Player>(),
        onMessage: new SimpleEvent<{player: Player, message: string}>(),
    }

    protected _online: string[] = []
    protected _lists: WorldLists = {adminlist: [], modlist: [], whitelist: [], blacklist: []}
    protected _commands: Map<string, (player: Player, args: string) => void> = new Map()

    constructor(api: WorldApi, storage: Storage) {
        this._api = api
        this._storage = storage

        this._createWatcher()
        this.getOverview() // Sets the owner, gets initial online players
        this.getLists() // Loads the current server lists
    }

    /**
     * Fires whenever a player joins the server
     */
    get onJoin(): SafeSimpleEvent<Player> {
        return this._events.onJoin.asEvent()
    }

    /**
     * Fires whenever a player leaves the server.
     */
    get onLeave(): SafeSimpleEvent<Player> {
        return this._events.onLeave.asEvent()
    }

    /**
     * Fires whenever a player or the server sends a message in chat.
     * Includes messages starting with /
     */
    get onMessage(): SafeSimpleEvent<{player: Player, message: string}> {
        return this._events.onMessage.asEvent()
    }

    /**
     * Fires whenever a message that cannot be parsed is encountered.
     */
    get onOther(): SafeSimpleEvent<string> {
        // This class doesn't do anything with the onOther events, so just pass it through.
        return this._chatWatcher.onOther
    }

    /**
     * Gets the currently online players
     */
    get online(): string[] {
        return [...this._online]
    }

    /**
     * Gets all players who have joined the server
     */
    get players(): Player[] {
        let players = this._storage.get<PlayerStorage>(PLAYERS_KEY, {})
        return Object.keys(players).map(this.getPlayer)
    }

    /**
     * Gets an overview of the server info
     */
    getOverview = async (refresh = false): Promise<WorldOverview> => {
        if (!this._cache.overview || refresh) {
            let overview = await (this._cache.overview = this._api.getOverview())
            // Add online players to the online list if they aren't already online
            overview.online.forEach(name => this._online.includes(name) || this._online.push(name))

            // Make sure the owner has the owner flag set to true
            this._storage.with<PlayerStorage>(PLAYERS_KEY, {}, players => {
                players[overview.owner] = players[overview.owner] || { ip: '', ips: [], joins: 0 }
                players[overview.owner].owner = true
            })
        }

        let overview = await this._cache.overview
        return {
            ...overview,
            created: cloneDate(overview.created),
            last_activity: cloneDate(overview.last_activity),
            credit_until: cloneDate(overview.credit_until),
            online: this.online
        }
    }

    /**
     * Returns the current world status, will always make a request to the server.
     */
    getStatus = () => this._api.getStatus()

    /**
     * Gets the server's lists
     */
    getLists = (refresh = false): Promise<WorldLists> => {
        if (!this._cache.lists || refresh) {
            this._cache.lists = this._api.getLists().then(lists => this._lists = lists)
        }

        return this._cache.lists
            .then(lists => ({
                adminlist: [...lists.adminlist],
                modlist: [...lists.modlist],
                whitelist: [...lists.whitelist],
                blacklist: [...lists.blacklist]
            }))
    }

    /**
     * Sets the server's lists and reloads the world lists if required.
     *
     * @param lists WorldLists one or more list to update. If a list is not provided it will not be changed.
     * @return a promise which will resolve when the lists have been updated, or throw if an error occurred.
     */
    setLists = async (lists: Partial<WorldLists>): Promise<void> => {
        let currentLists = await this.getLists()
        await this._api.setLists({...currentLists, ...lists})
        await this.getLists(true)
    }

    /**
     * Gets the server logs
     *
     * @param refresh if true, will get the latest logs, otherwise will returned the cached version.
     */
    getLogs = async (refresh = false): Promise<LogEntry[]> => {
        if (!this._cache.logs || refresh) this._cache.logs = this._api.getLogs()
        let lines = await this._cache.logs
        return lines.slice().map(line => ({
            ...line,
            timestamp: cloneDate(line.timestamp)
        }))
    }


    /**
     * Sends the specified message, returns a promise that will reject if the send fails and resolve otherwise.
     *
     * @param message the message to send
     */
    send = (message: string): Promise<void> => {
        if (message.startsWith('/')) this._events.onMessage.dispatch({ player: this.getPlayer('SERVER'), message})
        return this._api.send(message)
    }
    /**
     * Gets a specific player by name
     */
    getPlayer = (name: string): Player => {
        name = name.toLocaleUpperCase()
        let players = this._storage.get<PlayerStorage>(PLAYERS_KEY, {})
        return new Player(name, players[name] || {ip: '', ips: [], joins: 0}, this._lists)
    }

    /**
     * Adds a listener for a single command, can be used when a command can be statically matched.
     *
     * @param command the command that the listener should be called for, case insensitive
     * @param listener the function which should be called whenever the command is used
     * @example
     * world.addCommand('marco', () => { ex.bot.send('Polo!'); });
     */
    addCommand = (command: string, listener: (player: Player, args: string) => void): void => {
        command = command.toLocaleUpperCase()
        if (this._commands.has(command)) {
            throw new Error(`The command "${command}" has already been added.`)
        }
        this._commands.set(command, listener)
    }

    /**
     * Removes a listener for a command, if it exists.
     *
     * @param command the command for which the listener should be removed.
     */
    removeCommand = (command: string): void => {
        this._commands.delete(command.toLocaleUpperCase())
    }

    /**
     * Starts the world, if it is not already started. Will not reject.
     */
    start = () => this._api.start()

    /**
     * Stops the world if it is running. Will not throw.
     */
    stop = () => this._api.stop()

    /**
     * Sends a restart request, if the world is offline no actions will be taken.
     */
    restart = () => this._api.restart()

    /**
     * Internal init function
     */
    protected _createWatcher(): void {
        let watcher = this._chatWatcher = new ChatWatcher(this._api, this._online)

        watcher.onJoin.sub(({ name, ip }) => {
            name = name.toLocaleUpperCase()
            this._storage.with<PlayerStorage>(PLAYERS_KEY, {}, players => {
                let player = players[name] = players[name] || { ip, ips: [ip], joins: 0 }
                player.joins++
                player.ip = ip
                if (!player.ips.includes(ip)) player.ips.push(ip)
            })
            this._events.onJoin.dispatch(this.getPlayer(name))
        })

        watcher.onLeave.sub(name => this._events.onLeave.dispatch(this.getPlayer(name)))

        watcher.onMessage.sub(({ name, message }) => {
            this._events.onMessage.dispatch({ player: this.getPlayer(name), message })
        })

        this.onMessage.sub(({player, message}) => {
            if (/^\/[^ ]/.test(message)) {
                let [, command, args] = message.match(/^\/([^ ]+) ?(.*)$/) as RegExpMatchArray
                let handler = this._commands.get(command.toLocaleUpperCase())
                if (handler) handler(player, args)
            }
        })

        watcher.start()
    }
}
