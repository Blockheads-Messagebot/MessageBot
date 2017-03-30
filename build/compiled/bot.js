(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var chatwatcher_1 = require("./libraries/portal/chatwatcher");
var api_1 = require("./libraries/portal/api");
var world_1 = require("./libraries/blockheads/world");
var storage_1 = require("./libraries/storage");
var world = new world_1.World({
    api: new api_1.PortalApi(worldId),
    chatWatcher: new chatwatcher_1.PortalChatWatcher({
        worldId: worldId,
        firstId: window.firstId - 50 || 0
    }),
    storage: new storage_1.Storage(worldId)
});
world.onMessage.sub(function (_ref) {
    var player = _ref.player,
        message = _ref.message;

    console.log(player.getName(), message);
});
world.onJoin.sub(function (player) {
    console.log(player.getName(), 'joined');
});
world.onLeave.sub(function (player) {
    console.log(player.getName(), 'left');
});

},{"./libraries/blockheads/world":6,"./libraries/portal/api":7,"./libraries/portal/chatwatcher":9,"./libraries/storage":12}],2:[function(require,module,exports){
// See ajax.ts for documentation.
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });

var Ajax = function () {
    function Ajax() {
        _classCallCheck(this, Ajax);
    }

    _createClass(Ajax, null, [{
        key: "get",
        value: function get() {
            var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
            var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            if (Object.keys(params).length) {
                var addition = urlStringify(params);
                if (url.includes('?')) {
                    url += "&" + addition;
                } else {
                    url += "?" + addition;
                }
            }
            return xhr('GET', url, {});
        }
    }, {
        key: "getJSON",
        value: function getJSON() {
            var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
            var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            return Ajax.get(url, params).then(function (data) {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    return {};
                }
            });
        }
    }, {
        key: "post",
        value: function post() {
            var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
            var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            return xhr('POST', url, params);
        }
    }, {
        key: "postJSON",
        value: function postJSON() {
            var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
            var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            return Ajax.post(url, params).then(function (data) {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    return {};
                }
            });
        }
    }]);

    return Ajax;
}();

exports.Ajax = Ajax;
/**
 * Helper function to make XHR requests.
 *
 * @hidden
 */
function xhr(protocol) {
    var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '/';
    var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

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
            } else {
                reject(new Error(req.statusText));
            }
        };
        // Handle network errors
        req.onerror = function () {
            reject(new Error("Network Error"));
        };
        if (paramStr) {
            req.send(paramStr);
        } else {
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
    return Object.keys(obj).map(function (k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(obj[k].toString());
    }).join('&');
}

},{}],3:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class to watch chat for commands and update the stored lists as needed. You don't need to know anything about this class. It is only used by the [[World]] class internally to keep lists up to date.
 */

var CommandWatcher = function () {
    /**
     * Creates a new instance of the class.
     *
     * @param lists the lists to keep up to date.
     * @param getPlayer a callback to be used for getting player info. Must return an instance of Player
     */
    function CommandWatcher(lists, getPlayer) {
        _classCallCheck(this, CommandWatcher);

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


    _createClass(CommandWatcher, [{
        key: "listener",
        value: function listener(_ref) {
            var player = _ref.player,
                command = _ref.command,
                args = _ref.args;

            var target = this.getPlayer(args);
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

    }, {
        key: "ban",
        value: function ban(player, target) {
            if (player.isStaff()) {
                if (player.isMod() && target.isStaff()) {
                    return;
                } else if (target.isOwner()) {
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

    }, {
        key: "unban",
        value: function unban(player, target) {
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

    }, {
        key: "whitelist",
        value: function whitelist(player, target) {
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

    }, {
        key: "unwhitelist",
        value: function unwhitelist(player, target) {
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

    }, {
        key: "mod",
        value: function mod(player, target) {
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

    }, {
        key: "unmod",
        value: function unmod(player, target) {
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

    }, {
        key: "admin",
        value: function admin(player, target) {
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

    }, {
        key: "unadmin",
        value: function unadmin(player, target) {
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

    }, {
        key: "clear",
        value: function clear(list, player) {
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

    }, {
        key: "add",
        value: function add(list, player) {
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

    }, {
        key: "remove",
        value: function remove(list, player) {
            if (~this.lists[list].indexOf(player.getName())) {
                this.lists[list].splice(this.lists[list].indexOf(player.getName()), 1);
            }
        }
    }]);

    return CommandWatcher;
}();

exports.CommandWatcher = CommandWatcher;

},{}],4:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Player class which is returned by the [[World.getPlayer]] method. Should not be created by any other method.
 */

var Player = function () {
  /**
   * Creates a new instance of the Player class.
   *
   * @param name - the name of the player.
   * @param info - the player info stored between bot launches.
   */
  function Player(name, info, lists) {
    _classCallCheck(this, Player);

    this.name = name;
    this.info = info;
    this.lists = lists;
  }
  /**
   * Checks if the player has joined the server.
   *
   * @return true if the player has joined before, otherwise false.
   */


  _createClass(Player, [{
    key: "hasJoined",
    value: function hasJoined() {
      return this.info.joins > 0;
    }
    /**
     * Gets the player's name.
     *
     * @return The name of the player.
     */

  }, {
    key: "getName",
    value: function getName() {
      return this.name;
    }
    /**
     * Gets the most recently used IP of the player.
     *
     * @return the player's IP
     */

  }, {
    key: "getIP",
    value: function getIP() {
      return this.info.ip;
    }
    /**
     * Gets the all IPs used by the player on the world.
     *
     * @return an array of IPs
     */

  }, {
    key: "getIPs",
    value: function getIPs() {
      return this.info.ips.slice(0);
    }
    /**
     * Gets the number of times the player has joined the server.
     *
     * @return how many times the player has joined.
     */

  }, {
    key: "getJoins",
    value: function getJoins() {
      return this.info.joins;
    }
    /**
     * Returns true if the player is the owner of the server or is the server.
     *
     * @return true if the player is the owner.
     */

  }, {
    key: "isOwner",
    value: function isOwner() {
      return !!this.info.owner || this.name == 'SERVER';
    }
    /**
     * Checks if the player is an admin.
     *
     * @return true if the player is an admin.
     */

  }, {
    key: "isAdmin",
    value: function isAdmin() {
      return !!~this.lists.adminlist.indexOf(this.name) || this.isOwner();
    }
    /**
     * Checks if the player is a mod without admin permissions.
     *
     * @return true if the player is an admin and not a mod.
     */

  }, {
    key: "isMod",
    value: function isMod() {
      return !!~this.lists.modlist.indexOf(this.name) && !this.isAdmin();
    }
    /**
     * Checks if the player is an admin or a mod.
     *
     * @return true if the player is an admin or a mod.
     */

  }, {
    key: "isStaff",
    value: function isStaff() {
      return this.isAdmin() || this.isMod();
    }
    /**
     * Checks if the player is whitelisted.
     *
     * @return true if the player can join the server when it is whitelisted.
     */

  }, {
    key: "isWhitelisted",
    value: function isWhitelisted() {
      return !!~this.lists.whitelist.indexOf(this.name) || this.isStaff();
    }
    /**
     * Checks if the player is banned.
     *
     * @return true if the player is on the blacklist.
     */

  }, {
    key: "isBanned",
    value: function isBanned() {
      return !!~this.lists.blacklist.indexOf(this.name);
    }
  }]);

  return Player;
}();

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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var chat_1 = require("./types/chat");
var simpleevent_1 = require("../simpleevent");
var player_1 = require("./player");
var commandwatcher_1 = require("./commandwatcher");
/**
 * Class which contains functions for interacting with a world. Extensions can access this through ex.world.
 */

var World = function () {
    /**
     * Creates an instance of the World class. Note: These parameters are all passed in a single object.
     *
     * @param options the options to use when creating the class.
     */
    function World(_ref) {
        var _this = this;

        var api = _ref.api,
            storage = _ref.storage,
            chatWatcher = _ref.chatWatcher;

        _classCallCheck(this, World);

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
            this.api.getOverview().then(function (overview) {
                chatWatcher.setup(overview.name, overview.online);
            });
            chatWatcher.onMessage.subscribe(this.messageWatcher.bind(this));
            this.getLists().then(function (lists) {
                var watcher = new commandwatcher_1.CommandWatcher(lists, _this.getPlayer);
                _this.onCommand.subscribe(watcher.listener);
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


    _createClass(World, [{
        key: "getLists",
        value: function getLists() {
            var _this2 = this;

            if (this.lists) {
                return Promise.resolve(this.lists);
            }
            return this.api.getLists().then(function (lists) {
                return _this2.lists = lists;
            });
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

    }, {
        key: "getLogs",
        value: function getLogs() {
            var _this3 = this;

            var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            if (this.logs && !refresh) {
                return Promise.resolve(this.logs);
            }
            return this.api.getLogs().then(function (logs) {
                return _this3.logs = logs;
            });
        }
        /**
         * Gets an overview of the server info, the returned object should not be mutated.
         *
         * @param refresh whether or not to re-fetch the page.
         * @return the world info.
         * @example
         * getOverview().then(console.log);
         */

    }, {
        key: "getOverview",
        value: function getOverview() {
            var _this4 = this;

            var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            if (this.overview && !refresh) {
                return Promise.resolve(this.overview);
            }
            var online = this.overview ? this.overview.online : [];
            return this.api.getOverview().then(function (overview) {
                overview.online.forEach(function (name) {
                    if (!~online.indexOf(name)) {
                        online.push(name);
                    }
                });
                overview.online = online;
                return _this4.overview = overview;
            });
        }
        /**
         * Adds a message into the queue of messages to send.
         *
         * @param message the message to send.
         * @example
         * send('Hello!');
         */

    }, {
        key: "send",
        value: function send(message) {
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

    }, {
        key: "getPlayerNames",
        value: function getPlayerNames() {
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

    }, {
        key: "getPlayer",
        value: function getPlayer(name) {
            name = name.toLocaleUpperCase();
            var info = this.players[name] || { ip: '', ips: [], joins: 0 };
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

    }, {
        key: "messageWatcher",
        value: function messageWatcher(message) {
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

    }, {
        key: "handleJoin",
        value: function handleJoin(name, ip) {
            if (!name || !ip) {
                return;
            }
            var player = this.players[name] = this.players[name] || {
                ip: ip, ips: [ip], joins: 0
            };
            player.joins++;
            player.ip = ip;
            if (!~player.ips.indexOf(ip)) {
                player.ips.push(ip);
            }
            this.storage.set(this.STORAGE_ID, this.players);
            this.onJoin.dispatch(this.getPlayer(name));
        }
    }]);

    return World;
}();

exports.World = World;

},{"../simpleevent":11,"./commandwatcher":3,"./player":4,"./types/chat":5}],7:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var ajax_1 = require("../ajax");
var logparser_1 = require("./logparser");
/**
 * This class is only used by the [[World]] class. Unless you are creating new instances of the [[World]] class, you probably don't need to know anything about this class.
 *
 */

var PortalApi = function () {
    /**
     * Creates a new instance of the class.
     *
     * @param worldId the worldId to use when communicating with the server.
     */
    function PortalApi(worldId) {
        _classCallCheck(this, PortalApi);

        this.worldId = worldId;
        this.messageQueue = [];
        this.logParser = new logparser_1.PortalLogParser();
        this.postMessage = this.postMessage.bind(this);
        this.postMessage();
    }
    /**
     * @inheritdoc
     */


    _createClass(PortalApi, [{
        key: "getLists",
        value: function getLists() {
            var _this = this;

            return this.worldOnline().then(function () {
                return ajax_1.Ajax.get("/worlds/lists/" + _this.worldId);
            }).then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                function getList(name) {
                    var list = doc.querySelector("textarea[name=\"" + name + "\"]");
                    if (list) {
                        var names = list.value.toLocaleUpperCase().split('\n');
                        return [].concat(_toConsumableArray(new Set(names))); // Remove duplicates
                    }
                    return []; // World offline, just to be safe.
                }
                var lists = {
                    adminlist: getList('admins'),
                    modlist: getList('modlist'),
                    whitelist: getList('whitelist'),
                    blacklist: getList('blacklist')
                };
                // Remove device IDs
                lists.blacklist = lists.blacklist.map(function (name) {
                    var match = name.match(/(.*)(?:\\.{32})/);
                    if (match) return match[1];
                    return name;
                });
                // Remove blacklisted staff
                lists.blacklist = lists.blacklist.filter(function (name) {
                    return lists.adminlist.indexOf(name) == -1 && lists.modlist.indexOf(name) == -1;
                });
                return lists;
            });
        }
        /**
         * @inheritdoc
         */

    }, {
        key: "getOverview",
        value: function getOverview() {
            return ajax_1.Ajax.get("/worlds/" + this.worldId).then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var text = function text(selector) {
                    var el = doc.querySelector(selector);
                    return el && el.textContent ? el.textContent : '';
                };
                var temp = text('#main > div > script:last-child').match(/\$\('#privacy'\)\.val\('(.*)'\)/);
                var privacy = void 0;
                if (temp) {
                    privacy = temp[1];
                } else {
                    privacy = 'public';
                }
                // This is very messy, refactoring welcome.
                return {
                    name: text('#title'),
                    owner: text('.details.manager > tbody > tr:nth-of-type(3) > td:nth-of-type(2)'),
                    created: new Date(text('.details.manager > tbody > tr:nth-of-type(4) > td:nth-of-type(2)') + ' GMT-0000'),
                    last_activity: new Date(text('.details.manager > tbody > tr:nth-of-type(6) > td:nth-of-type(2)') + ' GMT-0000'),
                    credit_until: new Date(text('.details.manager > tbody > tr:nth-of-type(7) > td:nth-of-type(2)') + ' GMT-0000'),
                    link: text('.details.manager > tbody > tr:nth-of-type(8) > td:nth-of-type(2)'),
                    pvp: text('#main > div > script:last-child').includes('#pvp'),
                    privacy: privacy,
                    password: text('tr:nth-of-type(6) > td:nth-of-type(4)') == 'Yes',
                    size: text('tr:nth-of-type(7) > td:nth-of-type(4)'),
                    whitelist: text('tr:nth-of-type(8) > td:nth-of-type(4)') == 'Yes',
                    online: []
                };
            });
        }
        /**
         * @inheritdoc
         */

    }, {
        key: "getLogs",
        value: function getLogs() {
            var _this2 = this;

            return this.worldOnline().then(function () {
                return ajax_1.Ajax.get("/worlds/logs/" + _this2.worldId);
            }).then(function (logs) {
                return logs.split('\n');
            }).then(this.logParser.parse);
        }
        /**
         * @inheritdoc
         */

    }, {
        key: "send",
        value: function send(message) {
            this.messageQueue.push(message);
        }
        /**
         * Waits until the world is online before resolving.
         *
         * @hidden
         */

    }, {
        key: "worldOnline",
        value: function worldOnline() {
            var _this3 = this;

            return ajax_1.Ajax.postJSON("/api", { command: 'status', worldId: this.worldId }).then(function (response) {
                if (response.status != 'ok') {
                    throw new Error('Api error');
                }
                if (response.worldStatus != 'online') {
                    ajax_1.Ajax.postJSON("/api", { command: 'start', worldId: _this3.worldId }).catch(console.error);
                    throw new Error('World should be online');
                }
            }).catch(function () {
                return _this3.worldOnline();
            });
        }
        /**
         * Sends the oldest queued message if possible.
         *
         * @hidden
         */

    }, {
        key: "postMessage",
        value: function postMessage() {
            var _this4 = this;

            if (this.messageQueue.length) {
                ajax_1.Ajax.postJSON("/api", { command: 'send', worldId: this.worldId, message: this.messageQueue.shift() }).then(function (response) {
                    setTimeout(_this4.postMessage, 500);
                }, function () {
                    setTimeout(_this4.postMessage, 1000);
                });
            } else {
                setTimeout(this.postMessage, 500);
            }
        }
    }]);

    return PortalApi;
}();

exports.PortalApi = PortalApi;

},{"../ajax":2,"./logparser":10}],8:[function(require,module,exports){
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var chat_1 = require("../blockheads/types/chat");
/**
 * Parses chat in the format recieved from the portal API.
 *
 * This is only used by the [[PortalChatWatcher]] class.
 */

var PortalChatParser = function () {
    /**
     * Creates a new instance of the ChatParser class.
     *
     * @param name the name of the world
     * @param online currently online players.
     */
    function PortalChatParser(name, online) {
        _classCallCheck(this, PortalChatParser);

        this.name = name;
        this.online = online;
        this.parse = this.parse.bind(this);
    }
    /**
     * Parses a string as a chat message and emits an event for the message.
     *
     * @param messages the messages to parse.
     */


    _createClass(PortalChatParser, [{
        key: "parse",
        value: function parse(messages) {
            var _this = this;

            this.messages = [];
            messages.forEach(function (message) {
                if (message.startsWith(_this.name + " - Player Connected ")) {
                    var temp = message.match(/ - Player Connected (.*) \| ([\d.]+) \| ([\w]{32})\s*$/);
                    if (temp) {
                        var _temp = _slicedToArray(temp, 3),
                            name = _temp[1],
                            ip = _temp[2];

                        _this.handleJoin(name, ip);
                    } else {
                        _this.messages.push({ type: chat_1.ChatType.other, message: message });
                    }
                } else if (message.startsWith(_this.name + " - Player Disconnected ")) {
                    var _name = message.substring(_this.name.length + 23);
                    _this.handleLeave(_name);
                } else if (message.includes(': ')) {
                    var _name2 = _this.getUsername(message);
                    if (_name2) {
                        var msg = message.substring(_name2.length + 2);
                        _this.handleChat(_name2, msg);
                    } else {
                        _this.messages.push({ type: chat_1.ChatType.other, message: message });
                    }
                } else {
                    _this.messages.push({ type: chat_1.ChatType.other, message: message });
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

    }, {
        key: "handleJoin",
        value: function handleJoin(name, ip) {
            if (this.online.indexOf(name) == -1) {
                this.online.push(name);
            }
            this.messages.push({ type: chat_1.ChatType.join, name: name, ip: ip });
        }
        /**
         * Keeps the online list up to date and emits leave events.
         *
         * @hidden
         * @param name the name of the player leaving.
         */

    }, {
        key: "handleLeave",
        value: function handleLeave(name) {
            if (this.online.indexOf(name) != -1) {
                this.online.splice(this.online.indexOf(name), 1);
                this.messages.push({ type: chat_1.ChatType.leave, name: name });
            }
        }
        /**
         * Checks the chat type and parses accordingly.
         *
         * @hidden
         * @param name the name of the player chatting.
         * @param message the message sent.
         */

    }, {
        key: "handleChat",
        value: function handleChat(name, message) {
            if (name == 'SERVER') {
                // Handled by the world class
                return;
            }
            this.messages.push({ type: chat_1.ChatType.message, name: name, message: message });
            if (message.startsWith('/') && !message.startsWith('/ ')) {
                var command = message.substr(1);
                var args = '';
                if (command.includes(' ')) {
                    command = command.substring(0, command.indexOf(' '));
                    args = message.substring(message.indexOf(' ') + 1);
                }
                this.messages.push({ type: chat_1.ChatType.command, name: name, command: command, args: args });
            }
        }
        /**
         * Tries to guess a player's name from chat.
         *
         * @hidden
         * @param message the message to extract a username from.
         */

    }, {
        key: "getUsername",
        value: function getUsername(message) {
            for (var i = 18; i > 4; i--) {
                var possibleName = message.substring(0, message.lastIndexOf(': ', i));
                if (~this.online.indexOf(possibleName) || possibleName == 'SERVER') {
                    return possibleName;
                }
            }
            // Should ideally never happen.
            return message.substring(0, message.lastIndexOf(': ', 18));
        }
    }]);

    return PortalChatParser;
}();

exports.PortalChatParser = PortalChatParser;

},{"../blockheads/types/chat":5}],9:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var simpleevent_1 = require("../simpleevent");
var chatparser_1 = require("./chatparser");
var ajax_1 = require("../ajax");
/**
 * This class watches a world for new chat and reports any events through the 'message' event.
 *
 * Unless you are creating instances of the World class, you don't need to know anything about this class.
 */

var PortalChatWatcher = function () {
    /**
     * Creates a new instance of the PortalChatWatcher class.
     *
     * @param options the configuration for this chat watcher.
     */
    function PortalChatWatcher(_ref) {
        var worldId = _ref.worldId,
            firstId = _ref.firstId;

        _classCallCheck(this, PortalChatWatcher);

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


    _createClass(PortalChatWatcher, [{
        key: "setup",
        value: function setup(name, online) {
            this.parser = new chatparser_1.PortalChatParser(name, online);
            this.queueChatCheck();
        }
        /**
         * Continually checks chat for new messages.
         *
         * @hidden
         */

    }, {
        key: "checkChat",
        value: function checkChat() {
            var _this = this;

            this.getMessages().then(this.parser.parse).then(function (msgs) {
                return msgs.forEach(_this.onMessage.dispatch);
            }).then(function () {
                return _this.queueChatCheck();
            });
        }
        /**
         * Queues checking for new chat to parse.
         *
         * @hidden
         */

    }, {
        key: "queueChatCheck",
        value: function queueChatCheck() {
            var _this2 = this;

            setTimeout(function () {
                return _this2.checkChat();
            }, 5000);
        }
        /**
         * Gets the unread messages from the server queue.
         *
         * @hidden
         */

    }, {
        key: "getMessages",
        value: function getMessages() {
            var _this3 = this;

            return ajax_1.Ajax.postJSON('/api', { command: 'getchat', worldId: this.worldId, firstId: this.firstId }).then(function (data) {
                if (data.status == 'ok' && data.nextId != _this3.firstId) {
                    _this3.firstId = data.nextId;
                    return data.log;
                }
                // Expected to have error status sometimes, just return an empty array.
                return [];
            }, function () {
                return [];
            }); // Even if the request fails, this method should not throw.
        }
    }]);

    return PortalChatWatcher;
}();

exports.PortalChatWatcher = PortalChatWatcher;

},{"../ajax":2,"../simpleevent":11,"./chatparser":8}],10:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Parses logs from the portal into a standard format. This is only used by the [[PortalAPI]] class.
 */

var PortalLogParser = function () {
    /**
     * Creates a new instance of the PortalLogParser class.
     */
    function PortalLogParser() {
        _classCallCheck(this, PortalLogParser);

        this.entries = [];
    }
    /**
     * Parses the logs into a standard format.
     *
     * @param lines {string[]} the raw log lines.
     */


    _createClass(PortalLogParser, [{
        key: "parse",
        value: function parse(lines) {
            // Copy the lines array
            lines = lines.splice(0);
            // Assume first line is valid, if it isn't it will be dropped.
            for (var i = lines.length; i > 0; i--) {
                var line = lines[i];
                if (!this.isValidLine(line)) {
                    lines[i - 1] += '\n' + lines.splice(i, 1);
                    continue;
                }
                this.addLine(line);
            }
            if (this.isValidLine(lines[0])) {
                this.addLine(lines[0]);
            }
            var entries = this.entries.reverse();
            this.entries = [];
            return entries;
        }
    }, {
        key: "isValidLine",
        value: function isValidLine(line) {
            return (/^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d\.\d\d\d blockheads_server/.test(line)
            );
        }
    }, {
        key: "addLine",
        value: function addLine(line) {
            var ts = line.substr(0, 24).replace(' ', 'T').replace(' ', 'Z');
            this.entries.push({
                raw: line,
                timestamp: new Date(ts),
                message: line.substr(line.indexOf(']') + 2)
            });
        }
    }]);

    return PortalLogParser;
}();

exports.PortalLogParser = PortalLogParser;

},{}],11:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Generic class which emits events.
 */

var SimpleEvent = function () {
    /**
     * Creates a new instance of the class.
     */
    function SimpleEvent() {
        _classCallCheck(this, SimpleEvent);

        this.listeners = [];
        this.dispatch = this.dispatch.bind(this);
    }
    /**
     * Subscribes to the event, whenever it is fired, the passed callback will be called with the event args.
     *
     * @param callback the handler to add.
     */


    _createClass(SimpleEvent, [{
        key: "subscribe",
        value: function subscribe(callback) {
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

    }, {
        key: "sub",
        value: function sub(callback) {
            this.subscribe(callback);
        }
        /**
         * Registers an event handler that will only be called once.
         *
         * @param callback the handler to add.
         */

    }, {
        key: "once",
        value: function once(callback) {
            if (!this.has(callback)) {
                this.listeners.push({ cb: callback, once: true });
            }
        }
        /**
         * Removes an event handler, if it is attached to the event.
         *
         * @param callback the callback to remove as a handler.
         */

    }, {
        key: "unsubscribe",
        value: function unsubscribe(callback) {
            for (var i = 0; i < this.listeners.length; i++) {
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

    }, {
        key: "unsub",
        value: function unsub(callback) {
            this.unsubscribe(callback);
        }
        /**
         * Fires the event, calling all handlers.
         *
         * @param event the arguments to be passed to the handlers.
         */

    }, {
        key: "dispatch",
        value: function dispatch(event) {
            var len = this.listeners.length;
            for (var i = 0; i < len; i++) {
                if (this.listeners[i].once) {
                    try {
                        len--;
                        this.listeners.splice(i--, 1)[0].cb(event);
                    } catch (e) {}
                } else {
                    try {
                        this.listeners[i].cb(event);
                    } catch (e) {}
                }
            }
        }
        /**
         * Checks if the provided callback has been attached as an event handler.
         *
         * @param callback the handler which may be attached to the event.
         */

    }, {
        key: "has",
        value: function has(callback) {
            return this.listeners.some(function (_ref) {
                var cb = _ref.cb;
                return cb == callback;
            });
        }
    }]);

    return SimpleEvent;
}();

exports.SimpleEvent = SimpleEvent;

},{}],12:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Storage class which manages saving and retriving data between bot launches.
 * Extensions can access this class through ex.world.storage.
 */

var Storage = function () {
    function Storage(namespace) {
        _classCallCheck(this, Storage);

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


    _createClass(Storage, [{
        key: "getString",
        value: function getString(key, fallback) {
            var local = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            var result;
            if (local) {
                result = localStorage.getItem("" + key + this.namespace);
            } else {
                result = localStorage.getItem(key);
            }
            return result === null ? fallback : result;
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

    }, {
        key: "getObject",
        value: function getObject(key, fallback) {
            var local = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            var result = this.getString(key, '', local);
            if (!result) {
                return fallback;
            }
            try {
                result = JSON.parse(result);
            } catch (e) {
                result = fallback;
            } finally {
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

    }, {
        key: "set",
        value: function set(key, data) {
            var local = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            if (local) {
                key = "" + key + this.namespace;
            }
            if (typeof data == 'string') {
                localStorage.setItem(key, data);
            } else {
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

    }, {
        key: "clearNamespace",
        value: function clearNamespace(namespace) {
            var remove = [];
            for (var i = 0; i < localStorage.length + 5; i++) {
                var key = localStorage.key(i);
                if (key && key.startsWith(namespace)) {
                    remove.push(key);
                }
            }
            remove.forEach(function (key) {
                return localStorage.removeItem(key);
            });
        }
    }]);

    return Storage;
}();

exports.Storage = Storage;

},{}]},{},[1]);
