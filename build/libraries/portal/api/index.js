"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ajax_1 = require("../../ajax");
var logparser_1 = require("../logparser");
/**
 * This class is only used by the [[World]] class. Unless you are creating new instances of the [[World]] class, you probably don't need to know anything about this class.
 *
 */
var PortalApi = (function () {
    /**
     * Creates a new instance of the class.
     *
     * @param worldId the worldId to use when communicating with the server.
     */
    function PortalApi(worldId) {
        var _this = this;
        /**
         * @inheritdoc
         */
        this.getLists = function () {
            return _this.worldOnline()
                .then(function () { return ajax_1.Ajax.get("/worlds/lists/" + _this.worldId); })
                .then(function (html) {
                function getList(name) {
                    var list = html.match(new RegExp("<textarea name=\"" + name + "\">([\\s\\S]*?)</textarea>"));
                    if (list) {
                        var temp = list[1].replace(/(&.*?;)/g, function (_match, first) {
                            var map = {
                                '&lt;': '<',
                                '&gt;': '>',
                                '&amp;': '&',
                                '&#39;': '\''
                            }; //It seems these are the only escaped characters.
                            return map[first] || '';
                        });
                        var names = temp.toLocaleUpperCase().split('\n');
                        return __spread(new Set(names)).filter(Boolean); // Remove duplicates
                    }
                    return []; // World offline, just to be safe.
                }
                var lists = {
                    adminlist: getList('admins'),
                    modlist: getList('modlist'),
                    whitelist: getList('whitelist'),
                    blacklist: getList('blacklist'),
                };
                // Remove device IDs
                lists.blacklist = lists.blacklist.map(function (name) {
                    var match = name.match(/(.*)(?:\\.{32})/);
                    if (match)
                        return match[1];
                    return name;
                });
                // Remove blacklisted staff
                lists.blacklist = lists.blacklist
                    .filter(function (name) { return !lists.adminlist.includes(name) && !lists.modlist.includes(name); });
                return lists;
            });
        };
        /**
         * @inheritdoc
         */
        this.getOverview = function () {
            return ajax_1.Ajax.get("/worlds/" + _this.worldId)
                .then(function (html) {
                var firstMatch = function (r) {
                    var m = html.match(r);
                    return m ? m[1] : '';
                };
                var temp = html.match(/^\$\('#privacy'\).val\('(.*?)'\)/m);
                var privacy;
                if (temp) {
                    privacy = temp[1];
                }
                else {
                    privacy = 'public';
                }
                var online = [];
                var match = html.match(/^\t<tr><td class="left">(.*?)(?=<\/td>)/gm);
                if (match) {
                    online = online.concat(match.map(function (s) { return s.substr(22); }));
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
                    privacy: privacy,
                    password: firstMatch(/^\t\t<td>Password:<\/td><td>(Yes|No)<\/td><\/tr>$/m) == 'Yes',
                    size: firstMatch(/^\t\t<td>Size:<\/td><td>(.*?)<\/td>$/m),
                    whitelist: firstMatch(/<td>Whitelist:<\/td><td>(Yes|No)<\/td>/m) == 'Yes',
                    online: online,
                };
            });
        };
        /**
         * @inheritdoc
         */
        this.getLogs = function () {
            return _this.worldOnline()
                .then(function () { return ajax_1.Ajax.get("/worlds/logs/" + _this.worldId); })
                .then(function (logs) { return logs.split('\n'); })
                .then(_this.logParser.parse);
        };
        /**
         * @inheritdoc
         */
        this.send = function (message) {
            _this.messageQueue.push(message);
        };
        /**
         * Waits until the world is online before resolving.
         */
        this.worldOnline = function () {
            return ajax_1.Ajax.postJSON("/api", { command: 'status', worldId: _this.worldId })
                .then(function (response) {
                if (response.status != 'ok') {
                    throw new Error('Api error');
                }
                if (response.worldStatus != 'online') {
                    ajax_1.Ajax.postJSON("/api", { command: 'start', worldId: _this.worldId })
                        .catch(console.error);
                    throw new Error('World should be online');
                }
            })
                .catch(function () { return _this.worldOnline(); });
        };
        /**
         * Sends the oldest queued message if possible.
         */
        this.postMessage = function () {
            if (_this.messageQueue.length) {
                ajax_1.Ajax.postJSON("/api", {
                    command: 'send',
                    worldId: _this.worldId,
                    message: _this.messageQueue.shift()
                })
                    .then(function () {
                    setTimeout(_this.postMessage, 500);
                }, function () {
                    setTimeout(_this.postMessage, 1000);
                });
            }
            else {
                setTimeout(_this.postMessage, 500);
            }
        };
        this.worldId = worldId;
        this.messageQueue = [];
        this.logParser = new logparser_1.PortalLogParser();
        this.postMessage = this.postMessage.bind(this);
        this.postMessage();
    }
    return PortalApi;
}());
exports.PortalApi = PortalApi;
