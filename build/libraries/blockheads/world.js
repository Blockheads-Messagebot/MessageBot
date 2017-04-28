"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var chat_1 = require("./types/chat");
var simpleevent_1 = require("../simpleevent");
var player_1 = require("./player");
var commandwatcher_1 = require("./commandwatcher");
/**
 * Class which contains functions for interacting with a world. Extensions can access this through ex.world.
 */
var World = (function () {
    /**
     * Creates an instance of the World class. Note: These parameters are all passed in a single object.
     *
     * @param options the options to use when creating the class.
     */
    function World(_a) {
        var api = _a.api, storage = _a.storage, chatWatcher = _a.chatWatcher;
        var _this = this;
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
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var overview, lists, watcher;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!chatWatcher) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.getOverview()];
                    case 1:
                        overview = _a.sent();
                        if (this.players[overview.owner]) {
                            this.players[overview.owner].owner = true;
                        }
                        chatWatcher.setup(overview.name, overview.online);
                        chatWatcher.onMessage.subscribe(this.messageWatcher.bind(this));
                        return [4 /*yield*/, this.getLists()];
                    case 2:
                        lists = _a.sent();
                        watcher = new commandwatcher_1.CommandWatcher(lists, this.getPlayer);
                        this.onCommand.subscribe(watcher.listener);
                        return [2 /*return*/];
                }
            });
        }); })();
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
    World.prototype.getLists = function () {
        var _this = this;
        if (this.lists) {
            return Promise.resolve(this.lists);
        }
        return this.api.getLists()
            .then(function (lists) { return _this.lists = lists; });
    };
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
    World.prototype.getLogs = function (refresh) {
        var _this = this;
        if (refresh === void 0) { refresh = false; }
        if (this.logs && !refresh) {
            return Promise.resolve(this.logs);
        }
        return this.api.getLogs()
            .then(function (logs) { return _this.logs = logs; });
    };
    /**
     * Gets an overview of the server info, the returned object should not be mutated.
     *
     * @param refresh whether or not to re-fetch the page.
     * @return the world info.
     * @example
     * getOverview().then(console.log);
     */
    World.prototype.getOverview = function (refresh) {
        var _this = this;
        if (refresh === void 0) { refresh = false; }
        if (this.overview && !refresh) {
            return Promise.resolve(this.overview);
        }
        var online = this.overview ? this.overview.online : [];
        return this.api.getOverview().then(function (overview) {
            overview.online.forEach(function (name) {
                if (!online.includes(name)) {
                    online.push(name);
                }
            });
            overview.online = online;
            return _this.overview = overview;
        });
    };
    /**
     * Adds a message into the queue of messages to send.
     *
     * @param message the message to send.
     * @example
     * send('Hello!');
     */
    World.prototype.send = function (message) {
        this.api.send(message);
    };
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
    World.prototype.getPlayerNames = function () {
        return Object.keys(this.players);
    };
    /**
     * Gets an instance of the Player class for the specified name.
     *
     * @param name the player name to get.
     * @return the player, or a dummy player if they do not exist.
     * @example
     * let player = getPlayer('someone');
     * if (player.hasJoined()) { ... }
     */
    World.prototype.getPlayer = function (name) {
        name = name.toLocaleUpperCase();
        var info = this.players[name] || { ip: '', ips: [], joins: 0 };
        if (this.overview && this.overview.owner == name) {
            this.players[name].owner = true;
        }
        return new player_1.Player(name, info, this.lists || { adminlist: [], modlist: [], whitelist: [], blacklist: [] });
    };
    // Private methods
    /**
     * Continually watches chat for new messages and emits events when new messages come in.
     *
     * @param message the message to emit events for.
     */
    World.prototype.messageWatcher = function (message) {
        var player = this.getPlayer(message.name || '');
        switch (message.type) {
            case chat_1.ChatType.join:
                return this.handleJoin(message.name, message.ip);
            case chat_1.ChatType.leave:
                return this.onLeave.dispatch(player);
            case chat_1.ChatType.command:
                return this.onCommand.dispatch({ player: player, command: message.command, args: message.args });
            case chat_1.ChatType.message:
                return this.onMessage.dispatch({ player: player, message: message.message });
            case chat_1.ChatType.other:
                return this.onOther.dispatch(message.message);
        }
    };
    /**
     * Increments a player's joins and saves their IP.
     *
     * @param name the player's name
     * @param ip the player's IP
     */
    World.prototype.handleJoin = function (name, ip) {
        if (!name || !ip) {
            return;
        }
        var player = this.players[name] = this.players[name] || {
            ip: ip, ips: [ip], joins: 0
        };
        player.joins++;
        player.ip = ip;
        if (!player.ips.includes(ip)) {
            player.ips.push(ip);
        }
        this.storage.set(this.STORAGE_ID, this.players);
        this.onJoin.dispatch(this.getPlayer(name));
    };
    return World;
}());
exports.World = World;
