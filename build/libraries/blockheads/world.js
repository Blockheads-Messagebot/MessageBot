"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chat_1 = require("./types/chat");
const simpleevent_1 = require("../simpleevent");
const player_1 = require("./player");
const commandwatcher_1 = require("./commandwatcher");
/**
 * Class which contains functions for interacting with a world. Extensions can access this through ex.world.
 */
class World {
    /**
     * Creates an instance of the World class. Note: These parameters are all passed in a single object.
     *
     * @param options the options to use when creating the class.
     */
    constructor({ api, storage, chatWatcher }) {
        /** @hidden */
        this.STORAGE_ID = 'mb_players';
        // Events
        /**
         * Event fired whenever a player joins the server.
         */
        this.onJoin = new simpleevent_1.SimpleEvent();
        /**
         * Event fired whenever a player leaves the server.
         */
        this.onLeave = new simpleevent_1.SimpleEvent();
        /**
         * Event fired for all chat.
         */
        this.onMessage = new simpleevent_1.SimpleEvent();
        /**
         * Event fired for commands by all players.
         */
        this.onCommand = new simpleevent_1.SimpleEvent();
        /**
         * Event fired for all messages which failed to be parsed.
         */
        this.onOther = new simpleevent_1.SimpleEvent();
        this.storage = storage;
        this.api = api;
        this.players = this.storage.getObject(this.STORAGE_ID, {});
        (() => __awaiter(this, void 0, void 0, function* () {
            if (!chatWatcher) {
                return;
            }
            let overview = yield this.getOverview();
            if (this.players[overview.owner]) {
                this.players[overview.owner].owner = true;
            }
            chatWatcher.setup(overview.name, overview.online);
            chatWatcher.onMessage.subscribe(this.messageWatcher.bind(this));
            let lists = yield this.getLists();
            let watcher = new commandwatcher_1.CommandWatcher(lists, this.getPlayer);
            this.onCommand.subscribe(watcher.listener);
        }))();
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
    getLists() {
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
    getLogs(refresh = false) {
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
    getOverview(refresh = false) {
        if (this.overview && !refresh) {
            return Promise.resolve(this.overview);
        }
        let online = this.overview ? this.overview.online : [];
        return this.api.getOverview().then(overview => {
            overview.online.forEach(name => {
                if (!~online.indexOf(name)) {
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
    send(message) {
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
    getPlayerNames() {
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
    getPlayer(name) {
        name = name.toLocaleUpperCase();
        let info = this.players[name] || { ip: '', ips: [], joins: 0 };
        if (this.overview && this.overview.owner == name) {
            this.players[name].owner = true;
        }
        return new player_1.Player(name, info, this.lists || { adminlist: [], modlist: [], whitelist: [], blacklist: [] });
    }
    // Private methods
    /**
     * Continually watches chat for new messages and emits events when new messages come in.
     *
     * @hidden
     * @param message the message to emit events for.
     */
    messageWatcher(message) {
        let player = this.getPlayer(message.name || '');
        switch (message.type) {
            case chat_1.ChatType.join:
                return this.handleJoin(message.name, message.ip);
            case chat_1.ChatType.leave:
                return this.onLeave.dispatch(player);
            case chat_1.ChatType.command:
                return this.onCommand.dispatch({ player, command: message.command, args: message.args });
            case chat_1.ChatType.message:
                return this.onMessage.dispatch({ player, message: message.message });
            case chat_1.ChatType.other:
                return this.onOther.dispatch(message.message);
        }
    }
    /**
     * Increments a player's joins and saves their IP.
     *
     * @hidden
     * @param name the player's name
     * @param ip the player's IP
     */
    handleJoin(name, ip) {
        if (!name || !ip) {
            return;
        }
        let player = this.players[name] = this.players[name] || {
            ip, ips: [ip], joins: 0
        };
        player.joins++;
        player.ip = ip;
        if (!~player.ips.indexOf(ip)) {
            player.ips.push(ip);
        }
        this.storage.set(this.STORAGE_ID, this.players);
        this.onJoin.dispatch(this.getPlayer(name));
    }
}
exports.World = World;
