(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatwatcher_1 = require("./libraries/portal/chatwatcher");
const api_1 = require("./libraries/portal/api");
const world_1 = require("./libraries/blockheads/world");
const storage_1 = require("./libraries/storage");
let world = new world_1.World({
    api: new api_1.PortalApi(worldId),
    chatWatcher: new chatwatcher_1.PortalChatWatcher({
        worldId,
        firstId: window.firstId - 50 || 0,
    }),
    storage: new storage_1.Storage(worldId)
});
world.onMessage.sub(({ player, message }) => {
    console.log(player.getName(), message);
});
world.onJoin.sub(player => {
    console.log(player.getName(), 'joined');
});
world.onLeave.sub(player => {
    console.log(player.getName(), 'left');
});

},{"./libraries/blockheads/world":6,"./libraries/portal/api":7,"./libraries/portal/chatwatcher":9,"./libraries/storage":12}],2:[function(require,module,exports){
// See ajax.ts for documentation.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Ajax {
    static get(url = '/', params = {}) {
        if (Object.keys(params).length) {
            var addition = urlStringify(params);
            if (url.includes('?')) {
                url += `&${addition}`;
            }
            else {
                url += `?${addition}`;
            }
        }
        return xhr('GET', url, {});
    }
    static getJSON(url = '/', params = {}) {
        return Ajax.get(url, params).then(data => {
            try {
                return JSON.parse(data);
            }
            catch (e) {
                return {};
            }
        });
    }
    static post(url = '/', params = {}) {
        return xhr('POST', url, params);
    }
    static postJSON(url = '/', params = {}) {
        return Ajax.post(url, params).then(data => {
            try {
                return JSON.parse(data);
            }
            catch (e) {
                return {};
            }
        });
    }
}
exports.Ajax = Ajax;
/**
 * Helper function to make XHR requests.
 *
 * @hidden
 */
function xhr(protocol, url = '/', params = {}) {
    var paramStr = urlStringify(params);
    return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest();
        req.open(protocol, url);
        req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        if (protocol == 'POST') {
            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        req.onload = function () {
            if (req.status == 200) {
                resolve(req.response);
            }
            else {
                reject(new Error(req.statusText));
            }
        };
        // Handle network errors
        req.onerror = function () {
            reject(new Error("Network Error"));
        };
        if (paramStr) {
            req.send(paramStr);
        }
        else {
            req.send();
        }
    });
}
/**
 * Internal function used to stringify url parameters
 *
 * @hidden
 */
function urlStringify(obj) {
    return Object.keys(obj)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k].toString())}`)
        .join('&');
}

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class to watch chat for commands and update the stored lists as needed. You don't need to know anything about this class. It is only used by the [[World]] class internally to keep lists up to date.
 */
class CommandWatcher {
    /**
     * Creates a new instance of the class.
     *
     * @param lists the lists to keep up to date.
     * @param getPlayer a callback to be used for getting player info. Must return an instance of Player
     */
    constructor(lists, getPlayer) {
        this.lists = lists;
        this.getPlayer = getPlayer;
        this.listener = this.listener.bind(this);
    }
    /**
     * Function called whenever new commands come in.
     *
     * @param sender the world
     * @param player the player doing the command
     * @param command the command used
     * @param args any arguments supplied
     */
    //tslint:disable-next-line:cyclomatic-complexity
    listener({ player, command, args }) {
        let target = this.getPlayer(args);
        switch (command.toLocaleLowerCase()) {
            case 'ban':
            case 'ban-no-device':
                this.ban(player, target);
                break;
            case 'unban':
                this.unban(player, target);
                break;
            case 'whitelist':
                this.whitelist(player, target);
                break;
            case 'unwhitelist':
                this.unwhitelist(player, target);
                break;
            case 'mod':
                this.mod(player, target);
                break;
            case 'unmod':
                this.unmod(player, target);
                break;
            case 'admin':
                this.admin(player, target);
                break;
            case 'unadmin':
                this.unadmin(player, target);
                break;
            case 'clear-blacklist':
            case 'clear-whitelist':
            case 'clear-modlist':
            case 'clear-adminlist':
                this.clear(command.substr(6), player);
                break;
        }
    }
    /**
     * Handles /ban and /ban-no-device commands
     *
     * @hidden
     * @param player the player sending the message
     * @param target the player to ban
     */
    ban(player, target) {
        if (player.isStaff()) {
            if (player.isMod() && target.isStaff()) {
                return;
            }
            else if (target.isOwner()) {
                return;
            }
            this.add('blacklist', target);
            this.remove('adminlist', target);
            this.remove('modlist', target);
            this.remove('whitelist', target);
        }
    }
    /**
     * Handles the /unban command.
     *
     * @hidden
     * @param player the player sending the command
     * @param target the player to unban.
     */
    unban(player, target) {
        if (player.isStaff()) {
            this.remove('blacklist', target);
        }
    }
    /**
     * Handles the /whitelist command.
     *
     * @hidden
     * @param player the player sending the command.
     * @param target the player to whitelist.
     */
    whitelist(player, target) {
        if (player.isStaff()) {
            this.add('whitelist', target);
            this.remove('blacklist', target);
        }
    }
    /**
     * Handles the /unwhitelist command.
     *
     * @hidden
     * @param player the player sending the command.
     * @param target the player to remove from the whitelist.
     */
    unwhitelist(player, target) {
        if (player.isStaff()) {
            this.remove('whitelist', target);
        }
    }
    /**
     * Handles the /mod command.
     *
     * @hidden
     * @param player the player sending the command.
     * @param target the player to mod.
     */
    mod(player, target) {
        if (player.isAdmin()) {
            this.add('modlist', target);
            this.remove('blacklist', target);
        }
    }
    /**
     * Handles the /unmod command.
     *
     * @hidden
     * @param player the player sending the command
     * @param target the player to remove from the modlist.
     */
    unmod(player, target) {
        if (player.isAdmin()) {
            this.remove('modlist', target);
        }
    }
    /**
     * Handles the /admin command.
     *
     * @hidden
     * @param player the player sending the command.
     * @param target the player to admin.
     */
    admin(player, target) {
        if (player.isAdmin()) {
            this.add('adminlist', target);
            this.remove('blacklist', target);
        }
    }
    /**
     * Handles the /unadmin command.
     *
     * @hidden
     * @param player the player sending the command.
     * @param target the player to remove from the adminlist.
     */
    unadmin(player, target) {
        if (player.isAdmin() && !target.isOwner()) {
            this.remove('adminlist', target);
        }
    }
    /**
     * Handles /clear-list commands.
     *
     * @hidden
     * @param list the list to clear.
     * @param player the payer sending the command.
     */
    clear(list, player) {
        if (player.isAdmin()) {
            this.lists[list].length = 0;
        }
    }
    /**
     * Handles adding a player to a list.
     *
     * @hidden
     * @param list the list to add the player to.
     * @param player the player to add to the list.
     */
    add(list, player) {
        if (!~this.lists[list].indexOf(player.getName())) {
            this.lists[list].push(player.getName());
        }
    }
    /**
     * Handles removing players from a list.
     *
     * @hidden
     * @param list the list to remove the player from.
     * @param player the player to remove.
     */
    remove(list, player) {
        if (~this.lists[list].indexOf(player.getName())) {
            this.lists[list].splice(this.lists[list].indexOf(player.getName()), 1);
        }
    }
}
exports.CommandWatcher = CommandWatcher;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Player class which is returned by the [[World.getPlayer]] method. Should not be created by any other method.
 */
class Player {
    /**
     * Creates a new instance of the Player class.
     *
     * @param name - the name of the player.
     * @param info - the player info stored between bot launches.
     */
    constructor(name, info, lists) {
        this.name = name;
        this.info = info;
        this.lists = lists;
    }
    /**
     * Checks if the player has joined the server.
     *
     * @return true if the player has joined before, otherwise false.
     */
    hasJoined() {
        return this.info.joins > 0;
    }
    /**
     * Gets the player's name.
     *
     * @return The name of the player.
     */
    getName() {
        return this.name;
    }
    /**
     * Gets the most recently used IP of the player.
     *
     * @return the player's IP
     */
    getIP() {
        return this.info.ip;
    }
    /**
     * Gets the all IPs used by the player on the world.
     *
     * @return an array of IPs
     */
    getIPs() {
        return this.info.ips.slice(0);
    }
    /**
     * Gets the number of times the player has joined the server.
     *
     * @return how many times the player has joined.
     */
    getJoins() {
        return this.info.joins;
    }
    /**
     * Returns true if the player is the owner of the server or is the server.
     *
     * @return true if the player is the owner.
     */
    isOwner() {
        return !!this.info.owner || this.name == 'SERVER';
    }
    /**
     * Checks if the player is an admin.
     *
     * @return true if the player is an admin.
     */
    isAdmin() {
        return !!~this.lists.adminlist.indexOf(this.name) || this.isOwner();
    }
    /**
     * Checks if the player is a mod without admin permissions.
     *
     * @return true if the player is an admin and not a mod.
     */
    isMod() {
        return !!~this.lists.modlist.indexOf(this.name) && !this.isAdmin();
    }
    /**
     * Checks if the player is an admin or a mod.
     *
     * @return true if the player is an admin or a mod.
     */
    isStaff() {
        return this.isAdmin() || this.isMod();
    }
    /**
     * Checks if the player is whitelisted.
     *
     * @return true if the player can join the server when it is whitelisted.
     */
    isWhitelisted() {
        return !!~this.lists.whitelist.indexOf(this.name) || this.isStaff();
    }
    /**
     * Checks if the player is banned.
     *
     * @return true if the player is on the blacklist.
     */
    isBanned() {
        return !!~this.lists.blacklist.indexOf(this.name);
    }
}
exports.Player = Player;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Enum which indicates the properties included in a [[ChatMessage]].
 */
var ChatType;
(function (ChatType) {
    /**
     * For when a player joins the server.
     */
    ChatType[ChatType["join"] = 0] = "join";
    /**
     * When a player who is currently online leaves the server.
     */
    ChatType[ChatType["leave"] = 1] = "leave";
    /**
     * For all chat, from server and players. Includes messages starting with /
     */
    ChatType[ChatType["message"] = 2] = "message";
    /**
     * For commands from the server and players.
     */
    ChatType[ChatType["command"] = 3] = "command";
    /**
     * For log messages from the world, and messages which fail to parse, including leave messages from players who are not online.
     */
    ChatType[ChatType["other"] = 4] = "other";
})(ChatType = exports.ChatType || (exports.ChatType = {}));

},{}],6:[function(require,module,exports){
"use strict";
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
        if (chatWatcher) {
            this.api.getOverview().then(overview => {
                chatWatcher.setup(overview.name, overview.online);
            });
            chatWatcher.onMessage.subscribe(this.messageWatcher.bind(this));
            this.getLists().then(lists => {
                let watcher = new commandwatcher_1.CommandWatcher(lists, this.getPlayer);
                this.onCommand.subscribe(watcher.listener);
            });
        }
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
                return this.onOther.dispatch({ message: message.message });
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

},{"../simpleevent":11,"./commandwatcher":3,"./player":4,"./types/chat":5}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ajax_1 = require("../ajax");
const logparser_1 = require("./logparser");
/**
 * This class is only used by the [[World]] class. Unless you are creating new instances of the [[World]] class, you probably don't need to know anything about this class.
 *
 */
class PortalApi {
    /**
     * Creates a new instance of the class.
     *
     * @param worldId the worldId to use when communicating with the server.
     */
    constructor(worldId) {
        this.worldId = worldId;
        this.messageQueue = [];
        this.logParser = new logparser_1.PortalLogParser();
        this.postMessage = this.postMessage.bind(this);
        this.postMessage();
    }
    /**
     * @inheritdoc
     */
    getLists() {
        return this.worldOnline()
            .then(() => ajax_1.Ajax.get(`/worlds/lists/${this.worldId}`))
            .then((html) => {
            function getList(name) {
                let list = html.match(new RegExp(`<textarea name="${name}">([\s\S]*?)<\/textarea>`));
                if (list) {
                    let temp = list[0].replace(/(&.*?;)/g, function (match, first) {
                        let map = {
                            '&lt;': '<',
                            '&gt;': '>',
                            '&amp;': '&',
                            '&#39;': '\''
                        }; //It seems these are the only escaped characters.
                        return map[first] || '';
                    });
                    let names = temp.toLocaleUpperCase().split('\n');
                    return [...new Set(names)]; // Remove duplicates
                }
                return []; // World offline, just to be safe.
            }
            let lists = {
                adminlist: getList('admins'),
                modlist: getList('modlist'),
                whitelist: getList('whitelist'),
                blacklist: getList('blacklist'),
            };
            // Remove device IDs
            lists.blacklist = lists.blacklist.map(name => {
                let match = name.match(/(.*)(?:\\.{32})/);
                if (match)
                    return match[1];
                return name;
            });
            // Remove blacklisted staff
            lists.blacklist = lists.blacklist
                .filter(name => lists.adminlist.indexOf(name) == -1 && lists.modlist.indexOf(name) == -1);
            return lists;
        });
    }
    /**
     * @inheritdoc
     */
    getOverview() {
        return ajax_1.Ajax.get(`/worlds/${this.worldId}`)
            .then(html => {
            let firstMatch = (r) => {
                let m = html.match(r);
                return m ? m[1] : '';
            };
            let temp = html.match(/^\$\('#privacy'\).val\('(.*?)'\)/m);
            let privacy;
            if (temp) {
                privacy = temp[1];
            }
            else {
                privacy = 'public';
            }
            // This is very messy, refactoring welcome.
            return {
                name: firstMatch(/^\t<title>(.*?) Manager \| Portal<\/title>$/m),
                owner: firstMatch(/^\t\t<td class="right">Owner:<\/td>\r?\n\t\t<td>(.*?)<\/td>$/m),
                created: new Date(firstMatch(/^\t\t<td>Created:<\/td><td>(.*?)<\/td>$/m) + ' GMT-0000'),
                last_activity: new Date(firstMatch(/^\t\t<td>Last Activity:<\/td><td>(.*?)<\/td>$/m) + ' GMT-0000'),
                credit_until: new Date(firstMatch(/^\t\t<td>Credit Until:<\/td><td>(.*?)<\/td>$/m) + ' GMT-0000'),
                link: firstMatch(/^\t<tr><td>Link:<\/td><td><a href="(.*)">\1<\/a>/m),
                pvp: !!firstMatch(/^\$\('#pvp'\)\./m),
                privacy,
                password: firstMatch(/^\t\t<td>Password:<\/td><td>(Yes|No)<\/td><\/tr>$/m) == 'Yes',
                size: firstMatch(/^\t\t<td>Size:<\/td><td>(.*?)<\/td>$/m),
                whitelist: firstMatch(/<td>Whitelist:<\/td><td>(Yes|No)<\/td>/m) == 'Yes',
                online: [],
            };
        });
    }
    /**
     * @inheritdoc
     */
    getLogs() {
        return this.worldOnline()
            .then(() => ajax_1.Ajax.get(`/worlds/logs/${this.worldId}`))
            .then(logs => logs.split('\n'))
            .then(this.logParser.parse);
    }
    /**
     * @inheritdoc
     */
    send(message) {
        this.messageQueue.push(message);
    }
    /**
     * Waits until the world is online before resolving.
     *
     * @hidden
     */
    worldOnline() {
        return ajax_1.Ajax.postJSON(`/api`, { command: 'status', worldId: this.worldId })
            .then((response) => {
            if (response.status != 'ok') {
                throw new Error('Api error');
            }
            if (response.worldStatus != 'online') {
                ajax_1.Ajax.postJSON(`/api`, { command: 'start', worldId: this.worldId })
                    .catch(console.error);
                throw new Error('World should be online');
            }
        })
            .catch(() => this.worldOnline());
    }
    /**
     * Sends the oldest queued message if possible.
     *
     * @hidden
     */
    postMessage() {
        if (this.messageQueue.length) {
            ajax_1.Ajax.postJSON(`/api`, { command: 'send', worldId: this.worldId, message: this.messageQueue.shift() })
                .then(response => {
                setTimeout(this.postMessage, 500);
            }, () => {
                setTimeout(this.postMessage, 1000);
            });
        }
        else {
            setTimeout(this.postMessage, 500);
        }
    }
}
exports.PortalApi = PortalApi;

},{"../ajax":2,"./logparser":10}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chat_1 = require("../blockheads/types/chat");
/**
 * Parses chat in the format recieved from the portal API.
 *
 * This is only used by the [[PortalChatWatcher]] class.
 */
class PortalChatParser {
    /**
     * Creates a new instance of the ChatParser class.
     *
     * @param name the name of the world
     * @param online currently online players.
     */
    constructor(name, online) {
        this.name = name;
        this.online = online;
        this.parse = this.parse.bind(this);
    }
    /**
     * Parses a string as a chat message and emits an event for the message.
     *
     * @param messages the messages to parse.
     */
    parse(messages) {
        this.messages = [];
        messages.forEach(message => {
            if (message.startsWith(`${this.name} - Player Connected `)) {
                let temp = message.match(/ - Player Connected (.*) \| ([\d.]+) \| ([\w]{32})\s*$/);
                if (temp) {
                    let [, name, ip] = temp;
                    this.handleJoin(name, ip);
                }
                else {
                    this.messages.push({ type: chat_1.ChatType.other, message });
                }
            }
            else if (message.startsWith(`${this.name} - Player Disconnected `)) {
                let name = message.substring(this.name.length + 23);
                this.handleLeave(name);
            }
            else if (message.includes(': ')) {
                let name = this.getUsername(message);
                if (name) {
                    let msg = message.substring(name.length + 2);
                    this.handleChat(name, msg);
                }
                else {
                    this.messages.push({ type: chat_1.ChatType.other, message });
                }
            }
            else {
                this.messages.push({ type: chat_1.ChatType.other, message });
            }
        });
        return this.messages;
    }
    /**
     * Keeps the online list up to date and emits join events.
     *
     * @hidden
     * @param name the name of the player who is joining.
     * @param ip the ip of the player who is joining.
     */
    handleJoin(name, ip) {
        if (this.online.indexOf(name) == -1) {
            this.online.push(name);
        }
        this.messages.push({ type: chat_1.ChatType.join, name, ip });
    }
    /**
     * Keeps the online list up to date and emits leave events.
     *
     * @hidden
     * @param name the name of the player leaving.
     */
    handleLeave(name) {
        if (this.online.indexOf(name) != -1) {
            this.online.splice(this.online.indexOf(name), 1);
            this.messages.push({ type: chat_1.ChatType.leave, name });
        }
    }
    /**
     * Checks the chat type and parses accordingly.
     *
     * @hidden
     * @param name the name of the player chatting.
     * @param message the message sent.
     */
    handleChat(name, message) {
        if (name == 'SERVER') {
            // Handled by the world class
            return;
        }
        this.messages.push({ type: chat_1.ChatType.message, name, message });
        if (message.startsWith('/') && !message.startsWith('/ ')) {
            let command = message.substr(1);
            let args = '';
            if (command.includes(' ')) {
                command = command.substring(0, command.indexOf(' '));
                args = message.substring(message.indexOf(' ') + 1);
            }
            this.messages.push({ type: chat_1.ChatType.command, name, command, args });
        }
    }
    /**
     * Tries to guess a player's name from chat.
     *
     * @hidden
     * @param message the message to extract a username from.
     */
    getUsername(message) {
        for (let i = 18; i > 4; i--) {
            let possibleName = message.substring(0, message.lastIndexOf(': ', i));
            if (~this.online.indexOf(possibleName) || possibleName == 'SERVER') {
                return possibleName;
            }
        }
        // Should ideally never happen.
        return message.substring(0, message.lastIndexOf(': ', 18));
    }
}
exports.PortalChatParser = PortalChatParser;

},{"../blockheads/types/chat":5}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simpleevent_1 = require("../simpleevent");
const chatparser_1 = require("./chatparser");
const ajax_1 = require("../ajax");
/**
 * This class watches a world for new chat and reports any events through the 'message' event.
 *
 * Unless you are creating instances of the World class, you don't need to know anything about this class.
 */
class PortalChatWatcher {
    /**
     * Creates a new instance of the PortalChatWatcher class.
     *
     * @param options the configuration for this chat watcher.
     */
    constructor({ worldId, firstId }) {
        /**
         * Event fired whenever new chat comes in.
         */
        this.onMessage = new simpleevent_1.SimpleEvent();
        this.firstId = firstId;
        this.worldId = worldId;
    }
    /**
     * @inheritdoc
     */
    setup(name, online) {
        this.parser = new chatparser_1.PortalChatParser(name, online);
        this.queueChatCheck();
    }
    /**
     * Continually checks chat for new messages.
     *
     * @hidden
     */
    checkChat() {
        this.getMessages()
            .then(this.parser.parse)
            .then(msgs => msgs.forEach(this.onMessage.dispatch))
            .then(() => this.queueChatCheck());
    }
    /**
     * Queues checking for new chat to parse.
     *
     * @hidden
     */
    queueChatCheck() {
        setTimeout(() => this.checkChat(), 5000);
    }
    /**
     * Gets the unread messages from the server queue.
     *
     * @hidden
     */
    getMessages() {
        return ajax_1.Ajax.postJSON('/api', { command: 'getchat', worldId: this.worldId, firstId: this.firstId })
            .then((data) => {
            if (data.status == 'ok' && data.nextId != this.firstId) {
                this.firstId = data.nextId;
                return data.log;
            }
            // Expected to have error status sometimes, just return an empty array.
            return [];
        }, () => []); // Even if the request fails, this method should not throw.
    }
}
exports.PortalChatWatcher = PortalChatWatcher;

},{"../ajax":2,"../simpleevent":11,"./chatparser":8}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Parses logs from the portal into a standard format. This is only used by the [[PortalAPI]] class.
 */
class PortalLogParser {
    /**
     * Creates a new instance of the PortalLogParser class.
     */
    constructor() {
        this.entries = [];
    }
    /**
     * Parses the logs into a standard format.
     *
     * @param lines {string[]} the raw log lines.
     */
    parse(lines) {
        // Copy the lines array
        lines = lines.splice(0);
        // Assume first line is valid, if it isn't it will be dropped.
        for (let i = lines.length; i > 0; i--) {
            let line = lines[i];
            if (!this.isValidLine(line)) {
                lines[i - 1] += '\n' + lines.splice(i, 1);
                continue;
            }
            this.addLine(line);
        }
        if (this.isValidLine(lines[0])) {
            this.addLine(lines[0]);
        }
        let entries = this.entries.reverse();
        this.entries = [];
        return entries;
    }
    isValidLine(line) {
        return /^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d\.\d\d\d blockheads_server/.test(line);
    }
    addLine(line) {
        let ts = line.substr(0, 24)
            .replace(' ', 'T')
            .replace(' ', 'Z');
        this.entries.push({
            raw: line,
            timestamp: new Date(ts),
            message: line.substr(line.indexOf(']') + 2)
        });
    }
}
exports.PortalLogParser = PortalLogParser;

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Generic class which emits events.
 */
class SimpleEvent {
    /**
     * Creates a new instance of the class.
     */
    constructor() {
        this.listeners = [];
        this.dispatch = this.dispatch.bind(this);
    }
    /**
     * Subscribes to the event, whenever it is fired, the passed callback will be called with the event args.
     *
     * @param callback the handler to add.
     */
    subscribe(callback) {
        if (!this.has(callback)) {
            this.listeners.push({ cb: callback, once: false });
        }
    }
    /**
     * Subscribes to the event, whenever it is fired, the passed callback will be called with the event args.
     * This method is an alias of the subscribe method.
     *
     * @param callback the handler to add.
     */
    sub(callback) {
        this.subscribe(callback);
    }
    /**
     * Registers an event handler that will only be called once.
     *
     * @param callback the handler to add.
     */
    once(callback) {
        if (!this.has(callback)) {
            this.listeners.push({ cb: callback, once: true });
        }
    }
    /**
     * Removes an event handler, if it is attached to the event.
     *
     * @param callback the callback to remove as a handler.
     */
    unsubscribe(callback) {
        for (let i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].cb == callback) {
                this.listeners.splice(i, 1);
                break;
            }
        }
    }
    /**
     * Removes an event handler, if it is attached to the event. This method is an alias of the unsubscribe method.
     *
     * @param callback the callback to remove as a handler.
     */
    unsub(callback) {
        this.unsubscribe(callback);
    }
    /**
     * Fires the event, calling all handlers.
     *
     * @param event the arguments to be passed to the handlers.
     */
    dispatch(event) {
        let len = this.listeners.length;
        for (let i = 0; i < len; i++) {
            if (this.listeners[i].once) {
                try {
                    len--;
                    this.listeners.splice(i--, 1)[0].cb(event);
                }
                catch (e) { }
            }
            else {
                try {
                    this.listeners[i].cb(event);
                }
                catch (e) { }
            }
        }
    }
    /**
     * Checks if the provided callback has been attached as an event handler.
     *
     * @param callback the handler which may be attached to the event.
     */
    has(callback) {
        return this.listeners.some(({ cb }) => cb == callback);
    }
}
exports.SimpleEvent = SimpleEvent;

},{}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Storage class which manages saving and retriving data between bot launches.
 * Extensions can access this class through ex.world.storage.
 */
class Storage {
    constructor(namespace) {
        this.namespace = String(namespace);
    }
    /**
     * Gets a string from the storage if it exists and returns it, otherwise returns fallback.
     *
     * @example
     * var x = getString('stored_prefs', 'nothing');
     * var y = getString('stored_prefs', 'nothing', false);
     *
     * @param key the key to retrieve.
     * @param fallback what to return if the key was not found.
     * @param local whether or not to use a namespace when checking for the key.
     */
    getString(key, fallback, local = true) {
        var result;
        if (local) {
            result = localStorage.getItem(`${key}${this.namespace}`);
        }
        else {
            result = localStorage.getItem(key);
        }
        return (result === null) ? fallback : result;
    }
    /**
     * Gets a stored object if it exists, otherwise returns fallback.
     *
     * @example
     * var x = getObject('stored_key', [1, 2, 3]);
     *
     * @param key the item to retrieve.
     * @param fallback what to return if the item does not exist or fails to parse correctly.
     * @param local whether or not a namespace should be used.
     */
    getObject(key, fallback, local = true) {
        var result = this.getString(key, '', local);
        if (!result) {
            return fallback;
        }
        try {
            result = JSON.parse(result);
        }
        catch (e) {
            result = fallback;
        }
        finally {
            if (!result) {
                result = fallback;
            }
        }
        return result;
    }
    /**
     * Sets an object in the storage, stringifying it first if neccessary.
     *
     * @example
     * set('some_key', {a: [1, 2, 3], b: 'test'});
     * //returns '{"a":[1,2,3],"b":"test"}'
     * getString('some_key');
     * @param key the item to overwrite or create.
     * @param data any stringifyable type.
     * @param local whether to save the item with a namespace.
     */
    set(key, data, local = true) {
        if (local) {
            key = `${key}${this.namespace}`;
        }
        if (typeof data == 'string') {
            localStorage.setItem(key, data);
        }
        else {
            localStorage.setItem(key, JSON.stringify(data));
        }
    }
    /**
     * Removes all items starting with namespace from the storage.
     *
     * Note: Using Object.keys(localStorage) works, but is not covered in the spec.
     *
     * @example
     * set('key+test', 1);
     * set('key+test2', 2);
     * clearNamespace('key+'); //both key+test and key+test2 have been removed.
     *
     * @param namespace the prefix to check for when removing items.
     */
    clearNamespace(namespace) {
        let remove = [];
        for (let i = 0; i < localStorage.length + 5; i++) {
            let key = localStorage.key(i);
            if (key && key.startsWith(namespace)) {
                remove.push(key);
            }
        }
        remove.forEach(key => localStorage.removeItem(key));
    }
}
exports.Storage = Storage;

},{}]},{},[1]);
