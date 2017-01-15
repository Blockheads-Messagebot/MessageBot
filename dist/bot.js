"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
            }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
                var n = t[o][1][e];return s(n ? n : e);
            }, l, l.exports, e, t, n, r);
        }return n[o].exports;
    }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) {
        s(r[o]);
    }return s;
})({ 1: [function (require, module, exports) {
        var bot = require('bot');
        var bot_console = require('console');
        var ui = require('ui');
        var storage = require('libraries/storage');
        var ajax = require('libraries/ajax');
        var api = require('libraries/blockheads');
        var world = require('libraries/world');
        var hook = require('libraries/hook');

        var autoload = [];
        var loaded = [];
        var STORAGE_ID = 'mb_extensions';

        function MessageBotExtension(namespace, uninstall) {
            loaded.push(namespace);
            hook.fire('extension.install', namespace);

            var extension = {
                id: namespace,
                bot: bot,
                console: bot_console,
                ui: ui,
                storage: storage,
                ajax: ajax,
                api: api,
                world: world,
                hook: hook
            };

            if (typeof uninstall == 'function') {
                extension.uninstall = uninstall.bind(extension);
            }

            extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {
                if (!autoload.includes(namespace) && shouldAutoload) {
                    autoload.push(namespace);
                    storage.set(STORAGE_ID, autoload, false);
                } else if (!shouldAutoload) {
                    if (autoload.includes(namespace)) {
                        autoload.splice(autoload.indexOf(namespace), 1);
                        storage.set(STORAGE_ID, autoload, false);
                    }
                }
            };

            return extension;
        }

        MessageBotExtension.install = function install(id) {
            var el = document.createElement('script');
            el.src = "//blockheadsfans.com/messagebot/extension/" + id + "/code/raw";
            el.crossOrigin = 'anonymous';
            document.head.appendChild(el);
        };

        MessageBotExtension.uninstall = function uninstall(id) {
            try {
                window[id].uninstall();
            } catch (e) {
            }

            window[id] = undefined;

            if (autoload.includes(id)) {
                autoload.splice(autoload.indexOf(id), 1);
                storage.set(STORAGE_ID, autoload, false);
            }

            if (loaded.includes(id)) {
                loaded.splice(loaded.indexOf(id), 1);
            }

            hook.fire('extension.uninstall', id);
        };

        MessageBotExtension.isLoaded = function isLoaded(id) {
            return loaded.includes(id);
        };

        storage.getObject(STORAGE_ID, [], false).forEach(MessageBotExtension.install);

        module.exports = MessageBotExtension;
    }, { "bot": 3, "console": 35, "libraries/ajax": 8, "libraries/blockheads": 10, "libraries/hook": 11, "libraries/storage": 12, "libraries/world": 13, "ui": 25 }], 2: [function (require, module, exports) {

        module.exports = {
            checkGroup: checkGroup
        };

        var world = require('libraries/world');

        function checkGroup(group, name) {
            console.warn('bot.checkGroup is depricated. Use world.isAdmin, world.isMod, etc. instead');

            name = name.toLocaleUpperCase();
            switch (group.toLocaleLowerCase()) {
                case 'all':
                    return world.isPlayer(name);
                case 'admin':
                    return world.isAdmin(name);
                case 'mod':
                    return world.isMod(name);
                case 'staff':
                    return world.isStaff(name);
                case 'owner':
                    return world.isOwner(name);
                default:
                    return false;
            }
        }
    }, { "libraries/world": 13 }], 3: [function (require, module, exports) {
        var storage = require('libraries/storage');

        var bot = Object.assign(module.exports, require('./send'), require('./checkGroup'));

        bot.version = '6.1.0a';

        bot.world = require('libraries/world');

        storage.set('mb_version', bot.version);
    }, { "./checkGroup": 2, "./send": 5, "libraries/storage": 12, "libraries/world": 13 }], 4: [function (require, module, exports) {
        function update(keys, operator) {
            Object.keys(localStorage).forEach(function (item) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var key = _step.value;

                        if (item.startsWith(key)) {
                            localStorage.setItem(item, operator(localStorage.getItem(item)));
                            break;
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            });
        }

        switch (localStorage.getItem('mb_version')) {
            case null:
                break; 
            case '5.2.0':
            case '5.2.1':
                update(['announcementArr', 'joinArr', 'leaveArr', 'triggerArr'], function (raw) {
                    try {
                        var parsed = JSON.parse(raw);
                        parsed.forEach(function (msg) {
                            if (msg.message) {
                                msg.message = msg.message.replace(/\\n/g, '\n');
                            }
                        });
                        return JSON.stringify(parsed);
                    } catch (e) {
                        return raw;
                    }
                });
                break; 
            case '6.0.0a':
            case '6.0.0':
                setTimeout(function () {
                    window.botui.alert("Due to a bug in the 6.0.0 version of the bot, your join and leave messages may be swapped. Sorry! This cannot be fixed automatically. This message will not be shown again.");
                }, 1000);
                break; 
            case '6.0.1':
            case '6.0.2':
                setTimeout(function () {
                    window.botui.alert("Due to a bug in 6.0.1 / 6.0.2, groups may have been mixed up on Join, Leave, and Trigger messages. Sorry! This cannot be fixed automatically if it occured on your bot. Announcements have also been fixed.");
                }, 1000);
            case '6.0.3':
            case '6.0.4':
            case '6.0.5':
        }
    }, {}], 5: [function (require, module, exports) {
        var api = require('libraries/blockheads');
        var settings = require('settings');

        var queue = [];

        module.exports = {
            send: send
        };

        function send(message) {
            if (settings.splitMessages) {
                var str = message.split(settings.splitToken);
                var toSend = [];

                for (var i = 0; i < str.length; i++) {
                    var curr = str[i];
                    if (curr[curr.length - 1] == '\\' && i < str.length + 1) {
                        curr += settings.splitToken + str[++i];
                    }
                    toSend.push(curr);
                }

                toSend.forEach(function (msg) {
                    return queue.push(msg);
                });
            } else {
                queue.push(message);
            }
        }

        (function checkQueue() {
            if (!queue.length) {
                setTimeout(checkQueue, 500);
                return;
            }

            api.send(queue.shift()).catch(console.error).then(function () {
                setTimeout(checkQueue, 1000);
            });
        })();
    }, { "libraries/blockheads": 10, "settings": 22 }], 6: [function (require, module, exports) {
        module.exports = {
            write: write,
            clear: clear
        };

        function write(msg) {
            var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
            var nameClass = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

            var msgEl = document.createElement('li');
            if (nameClass) {
                msgEl.setAttribute('class', nameClass);
            }

            var nameEl = document.createElement('span');
            nameEl.textContent = name;

            var contentEl = document.createElement('span');
            if (name) {
                contentEl.textContent = ": " + msg;
            } else {
                contentEl.textContent = msg;
            }
            msgEl.appendChild(nameEl);
            msgEl.appendChild(contentEl);

            var chat = document.querySelector('#mb_console ul');
            chat.appendChild(msgEl);
        }

        function clear() {
            var chat = document.querySelector('#mb_console ul');
            chat.innerHTML = '';
        }
    }, {}], 7: [function (require, module, exports) {
        var bhfansapi = require('libraries/bhfansapi');
        var ui = require('ui');
        var hook = require('libraries/hook');
        var MessageBotExtension = require('MessageBotExtension');

        var tab = ui.addTab('Extensions');
        tab.innerHTML = '<style>' + "#mb_extensions .top-right-button{width:inherit;padding:0 7px}#mb_extensions h3{margin:0 0 5px 0}#exts{display:flex;flex-flow:row wrap;border-top:1px solid #000}#exts h4,#exts p{margin:0}#exts button{position:absolute;bottom:7px;padding:4px 8px;border-radius:8px;background:#fff}#exts>div{position:relative;height:130px;width:calc(33% - 19px);min-width:280px;padding:5px;margin-left:5px;margin-bottom:5px;border:3px solid #999;border-radius:10px}#exts>div:nth-child(odd){background:#ccc}\n" + '</style>' + "<template id=\"extTemplate\">\r\n    <div>\r\n        <h4>Title</h4>\r\n        <span>Description</span><br>\r\n        <button class=\"button\">Install</button>\r\n    </div>\r\n</template>\r\n<div id=\"mb_extensions\" data-tab-name=\"extensions\">\r\n    <h3>Extensions can increase the functionality of the bot.</h3>\r\n    <span>Interested in creating one? <a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/2.-Development:-Start-Here\" target=\"_blank\">Start here.</a></span>\r\n    <span class=\"top-right-button\">Load By ID/URL</span>\r\n    <div id=\"exts\"></div>\r\n</div>\r\n";

        bhfansapi.getStore().then(function (resp) {
            if (resp.status != 'ok') {
                document.getElementById('exts').innerHTML += resp.message;
                throw new Error(resp.message);
            }
            resp.extensions.forEach(function (extension) {
                ui.buildContentFromTemplate('#extTemplate', '#exts', [{ selector: 'h4', text: extension.title }, { selector: 'span', html: extension.snippet }, { selector: 'div', 'data-id': extension.id }, { selector: 'button', text: MessageBotExtension.isLoaded(extension.id) ? 'Remove' : 'Install' }]);
            });
        }).catch(bhfansapi.reportError);

        document.querySelector('#exts').addEventListener('click', function extActions(e) {
            if (e.target.tagName != 'BUTTON') {
                return;
            }
            var el = e.target;
            var id = el.parentElement.dataset.id;

            if (el.textContent == 'Install') {
                MessageBotExtension.install(id);
            } else {
                MessageBotExtension.uninstall(id);
            }
        });

        hook.on('extension.install', function (id) {
            var button = document.querySelector("#mb_extensions [data-id=\"" + id + "\"] button");
            if (button) {
                button.textContent = 'Remove';
            }
        });

        hook.on('extension.uninstall', function (id) {
            var button = document.querySelector("#mb_extensions [data-id=\"" + id + "\"] button");
            if (button) {
                button.textContent = 'Removed';
                button.disabled = true;
                setTimeout(function () {
                    button.textContent = 'Install';
                    button.disabled = false;
                }, 3000);
            }
        });
    }, { "MessageBotExtension": 1, "libraries/bhfansapi": 9, "libraries/hook": 11, "ui": 25 }], 8: [function (require, module, exports) {
        function get() {
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

        function getJSON() {
            var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
            var paramObj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            return get(url, paramObj).then(JSON.parse);
        }

        function post() {
            var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
            var paramObj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            return xhr('POST', url, paramObj);
        }

        function postJSON() {
            var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
            var paramObj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            return post(url, paramObj).then(JSON.parse);
        }

        function xhr(protocol) {
            var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '/';
            var paramObj = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

            var paramStr = urlStringify(paramObj);
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
                req.onerror = function () {
                    reject(Error("Network Error"));
                };
                if (paramStr) {
                    req.send(paramStr);
                } else {
                    req.send();
                }
            });
        }

        function urlStringify(obj) {
            return Object.keys(obj).map(function (k) {
                return encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]);
            }).join('&');
        }

        module.exports = { xhr: xhr, get: get, getJSON: getJSON, post: post, postJSON: postJSON };
    }, {}], 9: [function (require, module, exports) {

        var hook = require('libraries/hook');
        var ajax = require('libraries/ajax');

        var API_URLS = {
            STORE: '//blockheadsfans.com/messagebot/extension/store',
            NAME: '//blockheadsfans.com/messagebot/extension/name',
            ERROR: '//blockheadsfans.com/messagebot/bot/error'
        };

        var cache = {
            names: new Map()
        };

        function getStore() {
            var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            if (refresh || !cache.getStore) {
                cache.getStore = ajax.getJSON(API_URLS.STORE).then(function (store) {
                    if (store.status != 'ok') {
                        return store;
                    }

                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = store.extensions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var ex = _step2.value;

                            cache.names.set(ex.id, ex.title);
                        }
                    } catch (err) {
                        _didIteratorError2 = true;
                        _iteratorError2 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                _iterator2.return();
                            }
                        } finally {
                            if (_didIteratorError2) {
                                throw _iteratorError2;
                            }
                        }
                    }

                    return store;
                });
            }

            return cache.getStore;
        }

        function getExtensionName(id) {
            if (cache.names.has(id)) {
                return Promise.resolve(cache.names.get(id));
            }

            return ajax.postJSON(API_URLS.NAME, { id: id }).then(function (name) {
                cache.names.set(id, name);
                return name;
            }, function (err) {
                reportError(err);
                return id;
            });
        }

        function reportError(err) {
            ajax.postJSON(API_URLS.ERROR, {
                error_text: err.message,
                error_file: err.filename,
                error_row: err.lineno || 0,
                error_column: err.colno || 0,
                error_stack: err.stack || ''
            }).then(function (resp) {
                if (resp.status == 'ok') {
                    hook.fire('error_report', 'Something went wrong, it has been reported.');
                } else {
                    hook.fire('error_report', "Error reporting exception: " + resp.message);
                }
            }).catch(console.error);
        }

        module.exports = {
            getStore: getStore,
            getExtensionName: getExtensionName,
            reportError: reportError
        };
    }, { "libraries/ajax": 8, "libraries/hook": 11 }], 10: [function (require, module, exports) {
        var ajax = require('./ajax');
        var hook = require('./hook');
        var bhfansapi = require('./bhfansapi');

        var worldId = window.worldId;
        var cache = {
            firstId: 0
        };

        var world = {
            name: '',
            online: []
        };
        getOnlinePlayers().then(function (players) {
            return world.players = [].concat(_toConsumableArray(new Set(players.concat(world.players))));
        });

        getWorldName().then(function (name) {
            return world.name = name;
        });

        module.exports = {
            worldStarted: worldStarted,
            getLogs: getLogs,
            getLists: getLists,
            getHomepage: getHomepage,
            getOnlinePlayers: getOnlinePlayers,
            getOwnerName: getOwnerName,
            getWorldName: getWorldName,
            send: send
        };

        function worldStarted() {
            var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            if (refresh || !cache.worldStarted) {
                cache.worldStarted = new Promise(function (resolve, reject) {
                    var fails = 0;
                    (function check() {
                        ajax.postJSON('/api', { command: 'status', worldId: worldId }).then(function (response) {
                            switch (response.worldStatus) {
                                case 'online':
                                    return resolve();
                                case 'offline':
                                    ajax.postJSON('/api', { command: 'start', worldId: worldId }).then(check, check);
                                    break;
                                case 'unavailible':
                                    return reject(new Error('World unavailible.'));
                                case 'startup':
                                case 'shutdown':
                                    setTimeout(check, 3000);
                                    if (++fails > 10) {
                                        return reject(new Error('World took too long to start.'));
                                    }
                                    break;
                                default:
                                    return reject(new Error('Unknown response.'));
                            }
                        }).catch(bhfansapi.reportError);
                    })();
                });
            }

            return cache.worldStarted;
        }

        function getLogs() {
            var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            if (refresh || !cache.getLogs) {
                cache.getLogs = worldStarted().then(function () {
                    return ajax.get("/worlds/logs/" + worldId);
                }).then(function (log) {
                    return log.split('\n');
                });
            }

            return cache.getLogs;
        }

        function getLists() {
            var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            if (refresh || !cache.getLists) {
                cache.getLists = worldStarted().then(function () {
                    return ajax.get("/worlds/lists/" + worldId);
                }).then(function (html) {
                    var doc = new DOMParser().parseFromString(html, 'text/html');

                    function getList(name) {
                        var list = doc.querySelector("textarea[name=" + name + "]").value.toLocaleUpperCase().split('\n');
                        return [].concat(_toConsumableArray(new Set(list))); 
                    }

                    var lists = {
                        admin: getList('admins'),
                        mod: getList('modlist'),
                        white: getList('whitelist'),
                        black: getList('blacklist')
                    };
                    lists.mod = lists.mod.filter(function (name) {
                        return !lists.admin.includes(name);
                    });
                    lists.staff = lists.admin.concat(lists.mod);

                    return lists;
                });
            }

            return cache.getLists;
        }

        function getHomepage() {
            var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            if (refresh || !cache.getHomepage) {
                cache.getHomepage = ajax.get("/worlds/" + worldId).catch(function () {
                    return getHomepage(true);
                });
            }

            return cache.getHomepage;
        }

        function getOnlinePlayers() {
            var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            if (refresh || !cache.getOnlinePlayers) {
                cache.getOnlinePlayers = getHomepage(true).then(function (html) {
                    var doc = new DOMParser().parseFromString(html, 'text/html');
                    var playerElems = doc.querySelector('.manager.padded:nth-child(1)').querySelectorAll('tr:not(.history) > td.left');
                    var players = [];

                    Array.from(playerElems).forEach(function (el) {
                        players.push(el.textContent.toLocaleUpperCase());
                    });

                    return players;
                });
            }

            return cache.getOnlinePlayers;
        }

        function getOwnerName() {
            return getHomepage().then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                return doc.querySelector('.subheader~tr>td:not([class])').textContent.toLocaleUpperCase();
            });
        }

        function getWorldName() {
            return getHomepage().then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                return doc.querySelector('#title').textContent.toLocaleUpperCase();
            });
        }

        function send(message) {
            return ajax.postJSON("/api", { command: 'send', message: message, worldId: worldId }).then(function (resp) {
                if (resp.status != 'ok') {
                    throw new Error(resp.message);
                }
                return resp;
            }).then(function (resp) {
                hook.fire('world.send', message);
                hook.fire('world.servermessage', message);

                if (message.startsWith('/') && !message.startsWith('/ ')) {
                    var command = message.substr(1);

                    var args = '';
                    if (command.includes(' ')) {
                        command = command.substring(0, command.indexOf(' '));
                        args = message.substring(message.indexOf(' ') + 1);
                    }
                    hook.check('world.command', 'SERVER', command, args);
                }

                return resp;
            }).catch(function (err) {
                if (err == 'World not running.') {
                    cache.firstId = 0;
                }
                throw err;
            });
        }

        function checkChat() {
            getMessages().then(function (msgs) {
                msgs.forEach(function (message) {
                    if (message.startsWith(world.name + " - Player Connected ")) {
                        var _message$match = message.match(/ - Player Connected (.*) \| ([\d.]+) \| ([\w]{32})\s*$/),
                            _message$match2 = _slicedToArray(_message$match, 3),
                            name = _message$match2[1],
                            ip = _message$match2[2];

                        handleJoinMessages(name, ip);
                    } else if (message.startsWith(world.name + " - Player Disconnected ")) {
                        var _name = message.substring(world.name.length + 23);
                        handleLeaveMessages(_name);
                    } else if (message.includes(': ')) {
                        var _name2 = getUsername(message);
                        var msg = message.substring(_name2.length + 2);
                        handleUserMessages(_name2, msg);
                    } else {
                        handleOtherMessages(message);
                    }
                });
            }).catch(bhfansapi.reportError).then(function () {
                setTimeout(checkChat, 5000);
            });
        }
        checkChat();

        function getMessages() {
            return worldStarted().then(function () {
                return ajax.postJSON("/api", { command: 'getchat', worldId: worldId, firstId: cache.firstId });
            }).then(function (data) {
                if (data.status == 'ok' && data.nextId != cache.firstId) {
                    cache.firstId = data.nextId;
                    return data.log;
                } else if (data.status == 'error') {
                    throw new Error(data.message);
                }

                return [];
            });
        }

        function getUsername(message) {
            for (var i = 18; i > 4; i--) {
                var possibleName = message.substring(0, message.lastIndexOf(': ', i));
                if (world.online.includes(possibleName) || possibleName == 'SERVER') {
                    return possibleName;
                }
            }
            return message.substring(0, message.lastIndexOf(': ', 18));
        }

        function handleJoinMessages(name, ip) {
            if (!world.online.includes(name)) {
                world.online.push(name);
            }

            hook.check('world.join', name, ip);
        }

        function handleLeaveMessages(name) {
            if (world.online.includes(name)) {
                world.online.splice(world.online.indexOf(name), 1);
                hook.check('world.leave', name);
            }
        }

        function handleUserMessages(name, message) {
            if (name == 'SERVER') {
                hook.check('world.serverchat', message);
                return;
            }

            hook.check('world.message', name, message);

            if (message.startsWith('/') && !message.startsWith('/ ')) {

                var command = message.substr(1);

                var args = '';
                if (command.includes(' ')) {
                    command = command.substring(0, command.indexOf(' '));
                    args = message.substring(message.indexOf(' ') + 1);
                }
                hook.check('world.command', name, command, args);
                return; 
            }

            hook.check('world.chat', name, message);
        }

        function handleOtherMessages(message) {
            hook.check('world.other', message);
        }
    }, { "./ajax": 8, "./bhfansapi": 9, "./hook": 11 }], 11: [function (require, module, exports) {
        var listeners = {};

        function listen(key, callback) {
            if (typeof callback != 'function') {
                throw new Error('callback must be a function.');
            }

            key = key.toLocaleLowerCase();
            if (!listeners[key]) {
                listeners[key] = [];
            }

            if (!listeners[key].includes(callback)) {
                listeners[key].push(callback);
            }
        }

        function remove(key, callback) {
            key = key.toLocaleLowerCase();
            if (listeners[key]) {
                if (listeners[key].includes(callback)) {
                    listeners[key].splice(listeners[key].indexOf(callback), 1);
                }
            }
        }

        function check(key) {
            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            key = key.toLocaleLowerCase();
            if (!listeners[key]) {
                return;
            }

            listeners[key].forEach(function (listener) {
                try {
                    listener.apply(undefined, args);
                } catch (e) {
                    if (key != 'error') {
                        check('error', e);
                    }
                }
            });
        }

        function update(key, initial) {
            for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
                args[_key2 - 2] = arguments[_key2];
            }

            key = key.toLocaleLowerCase();
            if (!listeners[key]) {
                return initial;
            }

            return listeners[key].reduce(function (previous, current) {
                try {
                    var result = current.apply(undefined, [previous].concat(args));
                    if (typeof result != 'undefined') {
                        return result;
                    }
                    return previous;
                } catch (e) {
                    if (key != 'error') {
                        check('error', e);
                    }
                    return previous;
                }
            }, initial);
        }

        module.exports = {
            listen: listen,
            on: listen,
            remove: remove,
            check: check,
            fire: check,
            update: update
        };
    }, {}], 12: [function (require, module, exports) {
        module.exports = {
            getString: getString,
            getObject: getObject,
            set: set,
            clearNamespace: clearNamespace
        };

        var NAMESPACE = window.worldId;

        function getString(key, fallback) {
            var local = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            var result;
            if (local) {
                result = localStorage.getItem("" + key + NAMESPACE);
            } else {
                result = localStorage.getItem(key);
            }

            return result === null ? fallback : result;
        }

        function getObject(key, fallback) {
            var local = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            var result = getString(key, false, local);

            if (!result) {
                return fallback;
            }

            try {
                result = JSON.parse(result);
            } catch (e) {
                result = fallback;
            } finally {
                if (result === null) {
                    result = fallback;
                }
            }

            return result;
        }

        function set(key, data) {
            var local = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            if (local) {
                key = "" + key + NAMESPACE;
            }

            if (typeof data == 'string') {
                localStorage.setItem(key, data);
            } else {
                localStorage.setItem(key, JSON.stringify(data));
            }
        }

        function clearNamespace(namespace) {
            Object.keys(localStorage).forEach(function (key) {
                if (key.startsWith(namespace)) {
                    localStorage.removeItem(key);
                }
            });
        }
    }, {}], 13: [function (require, module, exports) {
        var api = require('./blockheads');
        var storage = require('./storage');
        var hook = require('./hook');

        var STORAGE = {
            PLAYERS: 'mb_players',
            LOG_LOAD: 'mb_lastLogLoad'
        };

        var world = module.exports = {
            name: '',
            online: [],
            owner: '',
            players: storage.getObject(STORAGE.PLAYERS, {}),
            lists: { admin: [], mod: [], staff: [], black: [], white: [] },
            isPlayer: isPlayer,
            isServer: isServer,
            isOwner: isOwner,
            isAdmin: isAdmin,
            isStaff: isStaff,
            isMod: isMod,
            isOnline: isOnline,
            getJoins: getJoins
        };
        var lists = world.lists;

        function isPlayer(name) {
            return world.players.hasOwnProperty(name.toLocaleUpperCase());
        }

        function isServer(name) {
            return name.toLocaleUpperCase() == 'SERVER';
        }

        function isOwner(name) {
            return world.owner == name.toLocaleUpperCase() || isServer(name);
        }

        function isAdmin(name) {
            return lists.admin.includes(name.toLocaleUpperCase()) || isOwner(name);
        }

        function isMod(name) {
            return lists.mod.includes(name.toLocaleUpperCase());
        }

        function isStaff(name) {
            return isAdmin(name) || isMod(name);
        }

        function isOnline(name) {
            return world.online.includes(name.toLocaleUpperCase());
        }

        function getJoins(name) {
            return isPlayer(name) ? world.players[name.toLocaleUpperCase()].joins : 0;
        }

        hook.on('world.join', function (name) {
            if (!world.online.includes(name)) {
                world.online.push(name);
            }
        });
        hook.on('world.leave', function (name) {
            if (world.online.includes(name)) {
                world.online.splice(world.online.indexOf(name), 1);
            }
        });

        hook.on('world.join', checkPlayerJoin);

        function buildStaffList() {
            lists.mod = lists.mod.filter(function (name) {
                return !lists.admin.includes(name) && name != 'SERVER' && name != world.owner;
            });
            lists.staff = lists.admin.concat(lists.mod);
        }

        function permissionCheck(name, command) {
            command = command.toLocaleLowerCase();

            if (['admin', 'unadmin', 'mod', 'unmod'].includes(command)) {
                return isAdmin(name);
            }

            if (['whitelist', 'unwhitelist', 'ban', 'unban'].includes(command)) {
                return isStaff(name);
            }

            return false;
        }

        hook.on('world.command', function (name, command, target) {
            if (!permissionCheck(name, command)) {
                return;
            }

            var un = command.startsWith('un');

            var group = {
                admin: 'admin',
                mod: 'mod',
                whitelist: 'white',
                ban: 'black'
            }[un ? command.substr(2) : command];

            if (un && lists[group].includes(target)) {
                lists[group].splice(lists[group].indexOf(target), 1);
                buildStaffList();
            } else if (!un && !lists[group].includes(target)) {
                lists[group].push(target);
                buildStaffList();
            }
        });

        function checkPlayerJoin(name, ip) {
            if (world.players.hasOwnProperty(name)) {
                world.players[name].joins++;
                if (!world.players[name].ips.includes(ip)) {
                    world.players[name].ips.push(ip);
                }
            } else {
                world.players[name] = { joins: 1, ips: [ip] };
            }
            world.players[name].ip = ip;

            storage.set(STORAGE.LOG_LOAD, Math.floor(Date.now().valueOf()));
            storage.set(STORAGE.PLAYERS, world.players);
        }

        Promise.all([api.getLists(), api.getWorldName(), api.getOwnerName()]).then(function (values) {
            var _values = _slicedToArray(values, 3),
                apiLists = _values[0],
                worldName = _values[1],
                owner = _values[2];

            world.lists = apiLists;
            buildStaffList();
            world.name = worldName;
            world.owner = owner;
        }).catch(console.error);

        Promise.all([api.getLogs(), api.getWorldName()]).then(function (values) {
            var _values2 = _slicedToArray(values, 2),
                lines = _values2[0],
                worldName = _values2[1];

            var last = storage.getObject(STORAGE.LOG_LOAD, 0);
            storage.set(STORAGE.LOG_LOAD, Math.floor(Date.now().valueOf()));

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = lines[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var line = _step3.value;

                    var time = new Date(line.substring(0, line.indexOf('b')).replace(' ', 'T').replace(' ', 'Z'));
                    var message = line.substring(line.indexOf(']') + 2);

                    if (time < last) {
                        continue;
                    }

                    if (message.startsWith(worldName + " - Player Connected ")) {
                        var parts = line.substr(line.indexOf(' - Player Connected ') + 20); 

                        var _parts$match = parts.match(/(.*) \| ([\w.]+) \| .{32}\s*/),
                            _parts$match2 = _slicedToArray(_parts$match, 3),
                            name = _parts$match2[1],
                            ip = _parts$match2[2];

                        checkPlayerJoin(name, ip);
                    }
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            storage.set(STORAGE.PLAYERS, world.players);
        });
    }, { "./blockheads": 10, "./hook": 11, "./storage": 12 }], 14: [function (require, module, exports) {
        var ui = require('ui');
        var storage = require('libraries/storage');
        var send = require('bot').send;
        var preferences = require('settings');

        var tab = ui.addTab('Announcements', 'messages');
        tab.innerHTML = "<template id=\"aTemplate\">\r\n    <div>\r\n        <label>Send:</label>\r\n        <textarea class=\"m\"></textarea>\r\n        <a>Delete</a>\r\n        <label style=\"display:block;margin-top:5px;\">Wait X minutes...</label>\r\n    </div>\r\n</template>\r\n<div id=\"mb_announcements\">\r\n    <h3>These are sent according to a regular schedule.</h3>\r\n    <span>If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"aMsgs\"></div>\r\n</div>\r\n";

        module.exports = {
            tab: tab,
            save: save,
            addMessage: addMessage,
            start: function start() {
                return announcementCheck(0);
            }
        };

        function addMessage() {
            var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

            ui.buildContentFromTemplate('#aTemplate', '#aMsgs', [{ selector: '.m', text: text }]);
        }

        function save() {
            announcements = Array.from(tab.querySelectorAll('.m')).map(function (el) {
                return { message: el.value };
            });

            storage.set('announcementArr', announcements);
        }

        var announcements = storage.getObject('announcementArr', []);

        announcements.map(function (ann) {
            return ann.message;
        }).forEach(addMessage);

        function announcementCheck(i) {
            i = i >= announcements.length ? 0 : i;

            var ann = announcements[i];

            if (ann && ann.message) {
                send(ann.message);
            }
            setTimeout(announcementCheck, preferences.announcementDelay * 60000, i + 1);
        }
    }, { "bot": 3, "libraries/storage": 12, "settings": 22, "ui": 25 }], 15: [function (require, module, exports) {
        module.exports = {
            buildAndSendMessage: buildAndSendMessage,
            buildMessage: buildMessage
        };

        var world = require('libraries/world');
        var send = require('bot').send;

        function buildAndSendMessage(message, name) {
            send(buildMessage(message, name));
        }

        function buildMessage(message, name) {
            message = message.replace(/{{([^}]+)}}/g, function (full, key) {
                return {
                    NAME: name,
                    Name: name[0] + name.substring(1).toLocaleLowerCase(),
                    name: name.toLocaleLowerCase()
                }[key] || full;
            });

            if (message.startsWith('/')) {
                message = message.replace(/{{ip}}/gi, world.players.getIP(name));
            }

            return message;
        }
    }, { "bot": 3, "libraries/world": 13 }], 16: [function (require, module, exports) {
        module.exports = {
            checkJoinsAndGroup: checkJoinsAndGroup,
            checkJoins: checkJoins,
            checkGroup: checkGroup
        };

        var world = require('libraries/world');

        function checkJoinsAndGroup(name, msg) {
            return checkJoins(name, msg.joins_low, msg.joins_high) && checkGroup(name, msg.group, msg.not_group);
        }

        function checkJoins(name, low, high) {
            return world.getJoins(name) >= low && world.getJoins(name) <= high;
        }

        function checkGroup(name, group, not_group) {
            return isInGroup(name, group) && !isInGroup(name, not_group);
        }

        function isInGroup(name, group) {
            name = name.toLocaleUpperCase();
            switch (group.toLocaleLowerCase()) {
                case 'all':
                    return world.isPlayer(name);
                case 'admin':
                    return world.isAdmin(name);
                case 'mod':
                    return world.isMod(name);
                case 'staff':
                    return world.isStaff(name);
                case 'owner':
                    return world.isOwner(name);
                default:
                    return false;
            }
        }
    }, { "libraries/world": 13 }], 17: [function (require, module, exports) {
        Object.assign(module.exports, require('./buildMessage'), require('./checkJoinsAndGroup'));
    }, { "./buildMessage": 15, "./checkJoinsAndGroup": 16 }], 18: [function (require, module, exports) {
        var ui = require('ui');

        var el = document.createElement('style');
        el.innerHTML = "#mb_join h3,#mb_leave h3,#mb_trigger h3,#mb_announcements h3{margin:0 0 5px 0}#mb_join input,#mb_join textarea,#mb_leave input,#mb_leave textarea,#mb_trigger input,#mb_trigger textarea,#mb_announcements input,#mb_announcements textarea{border:2px solid #666;width:calc(100% - 10px)}#mb_join textarea,#mb_leave textarea,#mb_trigger textarea,#mb_announcements textarea{resize:none;overflow:hidden;padding:1px 0;height:21px;transition:height .5s}#mb_join textarea:focus,#mb_leave textarea:focus,#mb_trigger textarea:focus,#mb_announcements textarea:focus{height:5em}#mb_join input[type=\"number\"],#mb_leave input[type=\"number\"],#mb_trigger input[type=\"number\"],#mb_announcements input[type=\"number\"]{width:5em}#jMsgs,#lMsgs,#tMsgs{position:relative;display:flex;flex-flow:row wrap;border-top:1px solid #000}#jMsgs>div,#lMsgs>div,#tMsgs>div{width:calc(33% - 19px);min-width:280px;padding:5px;margin-left:5px;margin-bottom:5px;border:3px solid #999;border-radius:10px}#jMsgs>div:nth-child(odd),#lMsgs>div:nth-child(odd),#tMsgs>div:nth-child(odd){background:#ccc}\n";
        document.head.appendChild(el);

        ui.addTabGroup('Messages', 'messages');

        [require('./join'), require('./leave'), require('./trigger'), require('./announcements')].forEach(function (type) {
            type.tab.addEventListener('click', function checkDelete(event) {
                if (event.target.tagName != 'A') {
                    return;
                }

                ui.alert('Really delete this message?', [{ text: 'Yes', style: 'danger', action: function action() {
                        event.target.parentNode.remove();
                        type.save();
                    } }, { text: 'Cancel' }]);
            });

            type.tab.addEventListener('change', type.save);

            type.tab.querySelector('.top-right-button').addEventListener('click', function () {
                return type.addMessage();
            });

            setTimeout(type.start, 10000);
        });
    }, { "./announcements": 14, "./join": 19, "./leave": 20, "./trigger": 21, "ui": 25 }], 19: [function (require, module, exports) {
        var ui = require('ui');

        var storage = require('libraries/storage');
        var hook = require('libraries/hook');
        var helpers = require('messages/helpers');

        var STORAGE_ID = 'joinArr';

        var tab = ui.addTab('Join', 'messages');
        tab.innerHTML = "<template id=\"jTemplate\">\r\n    <div>\r\n        <label> Message: <textarea class=\"m\"></textarea></label>\r\n        <span class=\"summary\"></span>\r\n        <details><summary>More options</summary>\r\n            <label>Player is: <select data-target=\"group\">\r\n                <option value=\"All\">anyone</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <label>Player is not: <select data-target=\"not_group\">\r\n                <option value=\"Nobody\">nobody</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n            <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        </details>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_join\" data-tab-name=\"join\">\r\n    <h3>These are checked when a player joins the server.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"jMsgs\"></div>\r\n</div>\r\n";

        module.exports = {
            tab: tab,
            save: save,
            addMessage: addMessage,
            start: function start() {
                return hook.on('world.join', onJoin);
            }
        };

        var joinMessages = storage.getObject(STORAGE_ID, []);
        joinMessages.forEach(addMessage);

        function addMessage() {
            var msg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            ui.buildContentFromTemplate('#jTemplate', '#jMsgs', [{ selector: 'option', remove: ['selected'], multiple: true }, { selector: '.m', text: msg.message || '' }, { selector: '[data-target="joins_low"]', value: msg.joins_low || 0 }, { selector: '[data-target="joins_high"]', value: msg.joins_high || 9999 }, { selector: "[data-target=\"group\"] [value=\"" + (msg.group || 'All') + "\"]", selected: 'selected' }, { selector: "[data-target=\"not_group\"] [value=\"" + (msg.not_group || 'Nobody') + "\"]", selected: 'selected' }]);
        }

        function save() {
            joinMessages = [];
            Array.from(tab.querySelectorAll('#jMsgs > div')).forEach(function (container) {
                if (!container.querySelector('.m').value) {
                    return;
                }

                joinMessages.push({
                    message: container.querySelector('.m').value,
                    joins_low: +container.querySelector('[data-target="joins_low"]').value,
                    joins_high: +container.querySelector('[data-target="joins_high"]').value,
                    group: container.querySelector('[data-target="group"]').value,
                    not_group: container.querySelector('[data-target="not_group"]').value
                });
            });

            storage.set(STORAGE_ID, joinMessages);
        }

        function onJoin(name) {
            joinMessages.forEach(function (msg) {
                if (helpers.checkJoinsAndGroup(name, msg)) {
                    helpers.buildAndSendMessage(msg.message, name);
                }
            });
        }
    }, { "libraries/hook": 11, "libraries/storage": 12, "messages/helpers": 17, "ui": 25 }], 20: [function (require, module, exports) {
        var ui = require('ui');

        var storage = require('libraries/storage');
        var hook = require('libraries/hook');
        var helpers = require('messages/helpers');

        var STORAGE_ID = 'leaveArr';

        var tab = ui.addTab('Leave', 'messages');
        tab.innerHTML = "<template id=\"lTemplate\">\r\n    <div>\r\n        <label>Message <textarea class=\"m\"></textarea></label>\r\n        <details><summary>More options</summary>\r\n            <label>Player is: <select data-target=\"group\">\r\n                <option value=\"All\">anyone</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <label>Player is not: <select data-target=\"not_group\">\r\n                <option value=\"Nobody\">nobody</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n            <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        </details>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_leave\">\r\n    <h3>These are checked when a player leaves the server.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"lMsgs\"></div>\r\n</div>\r\n";

        module.exports = {
            tab: tab,
            save: save,
            addMessage: addMessage,
            start: function start() {
                return hook.on('world.leave', onLeave);
            }
        };

        var leaveMessages = storage.getObject(STORAGE_ID, []);
        leaveMessages.forEach(addMessage);

        function addMessage() {
            var msg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            ui.buildContentFromTemplate('#lTemplate', '#lMsgs', [{ selector: 'option', remove: ['selected'], multiple: true }, { selector: '.m', text: msg.message || '' }, { selector: '[data-target="joins_low"]', value: msg.joins_low || 0 }, { selector: '[data-target="joins_high"]', value: msg.joins_high || 9999 }, { selector: "[data-target=\"group\"] [value=\"" + (msg.group || 'All') + "\"]", selected: 'selected' }, { selector: "[data-target=\"not_group\"] [value=\"" + (msg.not_group || 'Nobody') + "\"]", selected: 'selected' }]);
        }

        function save() {
            leaveMessages = [];
            Array.from(tab.querySelectorAll('#lMsgs > div')).forEach(function (container) {
                if (!container.querySelector('.m').value) {
                    return;
                }

                leaveMessages.push({
                    message: container.querySelector('.m').value,
                    joins_low: +container.querySelector('[data-target="joins_low"]').value,
                    joins_high: +container.querySelector('[data-target="joins_high"]').value,
                    group: container.querySelector('[data-target="group"]').value,
                    not_group: container.querySelector('[data-target="not_group"]').value
                });
            });

            storage.set(STORAGE_ID, leaveMessages);
        }

        function onLeave(name) {
            leaveMessages.forEach(function (msg) {
                if (helpers.checkJoinsAndGroup(name, msg)) {
                    helpers.buildAndSendMessage(msg.message, name);
                }
            });
        }
    }, { "libraries/hook": 11, "libraries/storage": 12, "messages/helpers": 17, "ui": 25 }], 21: [function (require, module, exports) {
        var ui = require('ui');

        var storage = require('libraries/storage');
        var hook = require('libraries/hook');
        var helpers = require('messages/helpers');
        var settings = require('settings');

        var STORAGE_ID = 'triggerArr';

        var tab = ui.addTab('Trigger', 'messages');
        tab.innerHTML = "<template id=\"tTemplate\">\r\n    <div>\r\n        <label>Trigger: <input class=\"t\"></label>\r\n        <label>Message: <textarea class=\"m\"></textarea></label>\r\n        <span class=\"summary\"></span>\r\n        <details><summary>More options</summary>\r\n            <label>Player is: <select data-target=\"group\">\r\n                <option value=\"All\">anyone</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <label>Player is not: <select data-target=\"not_group\">\r\n                <option value=\"Nobody\">nobody</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n            <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        </details>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_trigger\">\r\n    <h3>These are checked whenever someone says something.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger \"te*st\" will match \"tea stuff\" and \"test\")</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"tMsgs\"></div>\r\n</div>\r\n";

        module.exports = {
            tab: tab,
            save: save,
            addMessage: addMessage,
            start: function start() {
                return hook.on('world.message', checkTriggers);
            }
        };

        var triggerMessages = storage.getObject(STORAGE_ID, []);
        triggerMessages.forEach(addMessage);

        function addMessage() {
            var msg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

            ui.buildContentFromTemplate('#tTemplate', '#tMsgs', [{ selector: 'option', remove: ['selected'], multiple: true }, { selector: '.m', text: msg.message || '' }, { selector: '.t', value: msg.trigger || '' }, { selector: '[data-target="joins_low"]', value: msg.joins_low || 0 }, { selector: '[data-target="joins_high"]', value: msg.joins_high || 9999 }, { selector: "[data-target=\"group\"] [value=\"" + (msg.group || 'All') + "\"]", selected: 'selected' }, { selector: "[data-target=\"not_group\"] [value=\"" + (msg.not_group || 'Nobody') + "\"]", selected: 'selected' }]);
        }

        function save() {
            triggerMessages = [];
            Array.from(tab.querySelectorAll('#tMsgs > div')).forEach(function (container) {
                if (!container.querySelector('.m').value || !container.querySelector('.t').value) {
                    return;
                }

                triggerMessages.push({
                    message: container.querySelector('.m').value,
                    trigger: container.querySelector('.t').value,
                    joins_low: +container.querySelector('[data-target="joins_low"]').value,
                    joins_high: +container.querySelector('[data-target="joins_high"]').value,
                    group: container.querySelector('[data-target="group"]').value,
                    not_group: container.querySelector('[data-target="not_group"]').value
                });
            });

            storage.set(STORAGE_ID, triggerMessages);
        }

        function triggerMatch(trigger, message) {
            if (settings.regexTriggers) {
                try {
                    return new RegExp(trigger, 'i').test(message);
                } catch (e) {
                    ui.notify("Skipping trigger '" + trigger + "' as the RegEx is invaild.");
                    return false;
                }
            }
            return new RegExp(trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*"), 'i').test(message);
        }

        function checkTriggers(name, message) {
            var totalAllowed = settings.maxResponses;
            triggerMessages.forEach(function (msg) {
                if (totalAllowed && helpers.checkJoinsAndGroup(name, msg) && triggerMatch(msg.trigger, message)) {
                    helpers.buildAndSendMessage(msg.message, name);
                    totalAllowed--;
                }
            });
        }
    }, { "libraries/hook": 11, "libraries/storage": 12, "messages/helpers": 17, "settings": 22, "ui": 25 }], 22: [function (require, module, exports) {
        var storage = require('libraries/storage');
        var STORAGE_ID = 'mb_preferences';

        var prefs = storage.getObject(STORAGE_ID, {}, false);

        if (typeof Proxy == 'undefined') {
            module.exports = prefs;
            setInterval(function () {
                storage.set(STORAGE_ID, prefs, false);
            }, 30 * 1000);
        } else {
            module.exports = new Proxy(prefs, {
                set: function set(obj, prop, val) {
                    if (obj.hasOwnProperty(prop)) {
                        obj[prop] = val;
                        storage.set(STORAGE_ID, prefs, false);
                        return true;
                    }
                    return false;
                }
            });
        }

        var prefsMap = [{ type: 'number', key: 'announcementDelay', default: 10 }, { type: 'number', key: 'maxResponses', default: 2 }, { type: 'boolean', key: 'notify', default: true },
        { type: 'boolean', key: 'disableTrim', default: false }, { type: 'boolean', key: 'regexTriggers', default: false }, { type: 'boolean', key: 'splitMessages', default: false }, { type: 'text', key: 'splitToken', default: '<split>' }];

        prefsMap.forEach(function (pref) {
            if (_typeof(prefs[pref.key]) != pref.type) {
                prefs[pref.key] = pref.default;
            }
        });
    }, { "libraries/storage": 12 }], 23: [function (require, module, exports) {
        var ui = require('ui');
        var prefs = require('settings');

        var tab = ui.addTab('Settings');
        tab.innerHTML = '<style>' + "#mb_settings h3{border-bottom:1px solid #999}\n" + '</style>' + "<div id=\"mb_settings\">\r\n    <h3>Settings</h3>\r\n    <label>Minutes between announcements:</label><br>\r\n        <input data-key=\"announcementDelay\" type=\"number\"><br>\r\n    <label>Maximum trigger responses to a message:</label><br>\r\n        <input data-key=\"maxResponses\" type=\"number\"><br>\r\n    <label>New chat notifications: </label>\r\n        <input data-key=\"notify\" type=\"checkbox\"><br>\r\n\r\n    <h3>Advanced Settings - <small><a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/1.-Advanced-Options/\" target=\"_blank\">Read this first</a></small></h3>\r\n    <label>Disable whitespace trimming: </label>\r\n        <input data-key=\"disableTrim\" type=\"checkbox\"><br>\r\n    <label>Parse triggers as RegEx: </label>\r\n        <input data-key=\"regexTriggers\" type=\"checkbox\"><br>\r\n    <label>Split messages: </label>\r\n        <input data-key=\"splitMessages\" type=\"checkbox\"><br>\r\n    <label>Split token: </label><br>\r\n        <input data-key=\"splitToken\" type=\"text\">\r\n\r\n    <h3>Backup / Restore</h3>\r\n    <a id=\"mb_backup_save\">Get backup code</a><br>\r\n    <a id=\"mb_backup_load\">Load previous backup</a>\r\n    <div id=\"mb_backup\"></div>\r\n</div>\r\n";

        Object.keys(prefs).forEach(function (key) {
            var el = tab.querySelector("[data-key=\"" + key + "\"]");
            switch (_typeof(prefs[key])) {
                case 'boolean':
                    el.checked = prefs[key];
                    break;
                default:
                    el.value = prefs[key];
            }
        });

        tab.addEventListener('change', function save() {
            var getValue = function getValue(key) {
                return tab.querySelector("[data-key=\"" + key + "\"]").value;
            };
            var getInt = function getInt(key) {
                return +getValue(key);
            };
            var getChecked = function getChecked(key) {
                return tab.querySelector("[data-key=\"" + key + "\"]").checked;
            };

            Object.keys(prefs).forEach(function (key) {
                var func;

                switch (_typeof(prefs[key])) {
                    case 'boolean':
                        func = getChecked;
                        break;
                    case 'number':
                        func = getInt;
                        break;
                    default:
                        func = getValue;
                }

                prefs[key] = func(key);
            });
        });

        tab.querySelector('#mb_backup_save').addEventListener('click', function showBackup() {
            var backup = JSON.stringify(localStorage).replace(/</g, '&lt;');
            ui.alert("Copy this to a safe place:<br><textarea style=\"width: calc(100% - 7px);height:160px;\">" + backup + "</textarea>");
        });

        tab.querySelector('#mb_backup_load').addEventListener('click', function loadBackup() {
            ui.alert('Enter the backup code:<textarea style="width:calc(100% - 7px);height:160px;"></textarea>', [{ text: 'Load & refresh page', style: 'success', action: function action() {
                    var code = document.querySelector('#alert textarea').value;
                    try {
                        code = JSON.parse(code);
                        if (code === null) {
                            throw new Error('Invalid backup');
                        }
                    } catch (e) {
                        ui.notify('Invalid backup code. No action taken.');
                        return;
                    }

                    localStorage.clear();

                    Object.keys(code).forEach(function (key) {
                        localStorage.setItem(key, code[key]);
                    });

                    location.reload();
                } }, { text: 'Cancel' }]);
        });
    }, { "settings": 22, "ui": 25 }], 24: [function (require, module, exports) {
        window.pollChat = function () {};

        document.body.innerHTML = '';
        document.querySelectorAll('[type="text/css"]').forEach(function (el) {
            return el.remove();
        });

        document.querySelector('title').textContent = 'Console - MessageBot';

        var el = document.createElement('link');
        el.rel = 'icon';
        el.href = 'https://is.gd/MBvUHF';
        document.head.appendChild(el);

        require('ui/polyfills/console');
        require('bot/migration');

        window.MessageBotExtension = require('MessageBotExtension');

        var bhfansapi = require('libraries/bhfansapi');
        var hook = require('libraries/hook');
        var ui = require('ui');
        hook.on('error_report', function (msg) {
            ui.notify(msg);
        });

        require('console');
        document.querySelector('#leftNav span').click();
        require('messages');
        require('extensions');
        require('settings/page');

        window.addEventListener('error', function (err) {
            if (err.message != 'Script error') {
                bhfansapi.reportError(err);
            }
        });
    }, { "MessageBotExtension": 1, "bot/migration": 4, "console": 35, "extensions": 7, "libraries/bhfansapi": 9, "libraries/hook": 11, "messages": 18, "settings/page": 23, "ui": 25, "ui/polyfills/console": 30 }], 25: [function (require, module, exports) {
        require('./polyfills/details');

        Object.assign(module.exports, require('./layout'), require('./template'), require('./notifications'));

        var write = require('console/exports').write;
        module.exports.addMessageToConsole = function (msg) {
            var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
            var nameClass = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

            console.warn('ui.addMessageToConsole has been depricated. Use ex.console.write instead.');
            write(msg, name, nameClass);
        };
    }, { "./layout": 26, "./notifications": 28, "./polyfills/details": 31, "./template": 33, "console/exports": 6 }], 26: [function (require, module, exports) {

        var hook = require('libraries/hook');

        document.body.innerHTML += "<div id=\"leftNav\">\r\n    <input type=\"checkbox\" id=\"leftToggle\">\r\n    <label for=\"leftToggle\">&#9776; Menu</label>\r\n\r\n    <nav data-tab-group=\"main\"></nav>\r\n    <div class=\"overlay\"></div>\r\n</div>\r\n\r\n<div id=\"container\">\r\n    <header></header>\r\n</div>\r\n";
        document.head.innerHTML += '<style>' + "html,body{min-height:100vh;position:relative;width:100%;margin:0;font-family:\"Lucida Grande\",\"Lucida Sans Unicode\",Verdana,sans-serif;color:#000}textarea,input,button,select{font-family:inherit}a{cursor:pointer;color:#182b73}#leftNav{text-transform:uppercase}#leftNav nav{width:250px;background:#182b73;color:#fff;position:fixed;left:-250px;z-index:100;top:0;bottom:0;transition:left .5s}#leftNav details,#leftNav span{display:block;text-align:center;padding:5px 7px;border-bottom:1px solid white}#leftNav .selected{background:radial-gradient(#9fafeb, #182b73)}#leftNav summary ~ span{background:rgba(159,175,235,0.4)}#leftNav summary+span{border-top-left-radius:20px;border-top-right-radius:20px}#leftNav summary ~ span:last-of-type{border:0;border-bottom-left-radius:20px;border-bottom-right-radius:20px}#leftNav input{display:none}#leftNav label{color:#fff;background:#213b9d;padding:5px;position:fixed;top:5px;z-index:100;left:5px;opacity:1;transition:left .5s,opacity .5s}#leftNav input:checked ~ nav{left:0;transition:left .5s}#leftNav input:checked ~ label{left:255px;opacity:0;transition:left .5s,opacity .5s}#leftNav input:checked ~ .overlay{visibility:visible;opacity:1;transition:opacity .5s}header{background:#182b73 url(\"http://portal.theblockheads.net/static/images/portalHeader.png\") no-repeat;background-position:80px;height:80px}#container>div{height:calc(100vh - 100px);padding:10px;position:absolute;top:80px;left:0;right:0;overflow:auto}#container>div:not(.visible){display:none}.overlay{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99;background:rgba(0,0,0,0.7);visibility:hidden;opacity:0;transition:opacity .5s}.overlay.visible{visibility:visible;opacity:1;transition:opacity .5s}.top-right-button{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:10px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}\n" + '</style>';

        document.querySelector('#leftNav .overlay').addEventListener('click', toggleMenu);

        document.querySelector('#leftNav').addEventListener('click', function globalTabChange(event) {
            var tabName = event.target.dataset.tabName;
            var tab = document.querySelector("#container > [data-tab-name=" + tabName + "]");
            if (!tabName || !tab) {
                return;
            }

            Array.from(document.querySelectorAll('#container > .visible')).forEach(function (el) {
                return el.classList.remove('visible');
            });
            tab.classList.add('visible');

            Array.from(document.querySelectorAll('#leftNav .selected')).forEach(function (el) {
                return el.classList.remove('selected');
            });
            event.target.classList.add('selected');

            hook.fire('ui.tabShown', tab);
        });

        module.exports = {
            toggleMenu: toggleMenu,
            addTab: addTab,
            removeTab: removeTab,
            addTabGroup: addTabGroup,
            removeTabGroup: removeTabGroup
        };

        function toggleMenu() {
            var mainToggle = document.querySelector('#leftNav input');
            mainToggle.checked = !mainToggle.checked;
        }

        var tabUID = 0;
        function addTab(tabText) {
            var groupName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'main';

            var tabName = 'botTab_' + tabUID++;

            var tab = document.createElement('span');
            tab.textContent = tabText;
            tab.classList.add('tab');
            tab.dataset.tabName = tabName;

            var tabContent = document.createElement('div');
            tabContent.dataset.tabName = tabName;

            document.querySelector("#leftNav [data-tab-group=" + groupName + "]").appendChild(tab);
            document.querySelector('#container').appendChild(tabContent);

            return tabContent;
        }

        function removeTab(tabContent) {
            document.querySelector("#leftNav [data-tab-name=" + tabContent.dataset.tabName + "]").remove();
            tabContent.remove();
        }

        function addTabGroup(text, groupName) {
            var details = document.createElement('details');
            details.dataset.tabGroup = groupName;

            var summary = document.createElement('summary');
            summary.textContent = text;
            details.appendChild(summary);

            document.querySelector('#leftNav [data-tab-group=main]').appendChild(details);
        }

        function removeTabGroup(groupName) {
            var group = document.querySelector("#leftNav [data-tab-group=\"" + groupName + "\"]");
            var items = Array.from(group.querySelectorAll('span'));

            items.forEach(function (item) {
                document.querySelector("#container > [data-tab-name=\"" + item.dataset.tabName + "\"]").remove();
            });

            group.remove();
        }
    }, { "libraries/hook": 11 }], 27: [function (require, module, exports) {
        module.exports = {
            alert: alert
        };

        function alert(text) {
            var buttons = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [{ text: 'OK' }];

            if (instance.active) {
                instance.queue.push({ text: text, buttons: buttons });
                return;
            }
            instance.active = true;

            buttons.forEach(function (button, i) {
                button.dismiss = button.dismiss === false ? false : true;
                instance.buttons['button_' + i] = {
                    action: button.action,
                    thisArg: button.thisArg || undefined,
                    dismiss: typeof button.dismiss == 'boolean' ? button.dismiss : true
                };
                button.id = 'button_' + i;
                buildButton(button);
            });
            document.querySelector('#alertContent').innerHTML = text;

            document.querySelector('#alert ~ .overlay').classList.add('visible');
            document.querySelector('#alert').classList.add('visible');
        }

        var instance = {
            active: false,
            queue: [],
            buttons: {}
        };

        function buildButton(button) {
            var el = document.createElement('span');
            el.innerHTML = button.text;
            if (button.style) {
                el.classList.add(button.style);
            }
            el.id = button.id;
            el.addEventListener('click', buttonHandler);
            document.querySelector('#alert .buttons').appendChild(el);
        }

        function buttonHandler(event) {
            var button = instance.buttons[event.target.id] || {};
            if (typeof button.action == 'function') {
                button.action.call(button.thisArg);
            }

            if (button.dismiss || typeof button.action != 'function') {
                document.querySelector('#alert').classList.remove('visible');
                document.querySelector('#alert ~ .overlay').classList.remove('visible');
                document.querySelector('#alert .buttons').innerHTML = '';
                instance.buttons = {};
                instance.active = false;

                if (instance.queue.length) {
                    var next = instance.queue.shift();
                    alert(next.text, next.buttons);
                }
            }
        }
    }, {}], 28: [function (require, module, exports) {

        Object.assign(module.exports, require('./alert'), require('./notify'));

        var el = document.createElement('style');
        el.innerHTML = "#alert{visibility:hidden;position:fixed;top:50px;left:0;right:0;margin:auto;z-index:101;width:50%;min-width:300px;min-height:200px;background:#fff;border-radius:10px;padding:10px 10px 55px 10px}#alert.visible{visibility:visible}#alert>div{webkit-overflow-scrolling:touch;max-height:65vh;overflow-y:auto}#alert>.buttons{position:absolute;bottom:10px;left:5px}#alert>.buttons>span{display:inline-block;padding:6px 12px;margin:0 5px;text-align:center;white-space:nowrap;cursor:pointer;border:1px solid rgba(0,0,0,0.15);border-radius:6px;background:#fff linear-gradient(to bottom, #fff 0, #e0e0e0 100%)}#alert>.buttons [class]{color:#fff}#alert>.buttons .success{background:#5cb85c linear-gradient(to bottom, #5cb85c 0, #419641 100%);border-color:#3e8f3e}#alert>.buttons .info{background:#5bc0de linear-gradient(to bottom, #5bc0de 0, #2aabd2 100%);border-color:#28a4c9}#alert>.buttons .danger{background:#d9534f linear-gradient(to bottom, #d9534f 0, #c12e2a 100%);border-color:#b92c28}#alert>.buttons .warning{background:#f0ad4e linear-gradient(to bottom, #f0ad4e 0, #eb9316 100%);border-color:#e38d13}.notification{opacity:0;transition:opacity 1s;position:fixed;top:1em;right:1em;min-width:200px;border-radius:5px;padding:5px;background:#9fafeb}.notification.visible{opacity:1}\n";
        document.head.appendChild(el);

        el = document.createElement('div');
        el.id = 'alertWrapper';
        el.innerHTML = "<div id=\"alert\">\r\n    <div id=\"alertContent\"></div>\r\n    <div class=\"buttons\"/></div>\r\n</div>\r\n<div class=\"overlay\"/></div>\r\n";

        document.body.appendChild(el);
    }, { "./alert": 27, "./notify": 29 }], 29: [function (require, module, exports) {
        module.exports = {
            notify: notify
        };

        function notify(text) {
            var displayTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;

            var el = document.createElement('div');
            el.classList.add('notification');
            el.classList.add('visible');
            el.textContent = text;
            document.body.appendChild(el);

            el.addEventListener('click', function () {
                this.remove();
            });

            setTimeout(function () {
                this.classList.remove('visible');
            }.bind(el), displayTime * 1000);

            setTimeout(function () {
                if (this.parentNode) {
                    this.remove();
                }
            }.bind(el), displayTime * 1000 + 2100);
        }
    }, {}], 30: [function (require, module, exports) {
        if (!window.console) {
            window.console = {};
            window.log = window.log || [];
            console.log = function () {
                for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                    args[_key3] = arguments[_key3];
                }

                window.log.push(args);
            };
        }
        ['info', 'error', 'warn', 'assert'].forEach(function (method) {
            if (!console[method]) {
                console[method] = console.log;
            }
        });
    }, {}], 31: [function (require, module, exports) {
        if (!('open' in document.createElement('details'))) {
            var style = document.createElement('style');
            style.textContent += "details:not([open]) > :not(summary) { display: none !important; } details > summary:before { content: \"\u25B6\"; display: inline-block; font-size: .8em; width: 1.5em; font-family:\"Courier New\"; } details[open] > summary:before { transform: rotate(90deg); }";
            document.head.appendChild(style);

            window.addEventListener('click', function (event) {
                if (event.target.tagName == 'SUMMARY') {
                    var details = event.target.parentNode;

                    if (!details) {
                        return;
                    }

                    if (details.getAttribute('open')) {
                        details.open = false;
                        details.removeAttribute('open');
                    } else {
                        details.open = true;
                        details.setAttribute('open', 'open');
                    }
                }
            });
        }
    }, {}], 32: [function (require, module, exports) {

        module.exports = function (template) {
            if (!('content' in template)) {
                var content = template.childNodes;
                var fragment = document.createDocumentFragment();

                for (var j = 0; j < content.length; j++) {
                    fragment.appendChild(content[j]);
                }

                template.content = fragment;
            }
        };
    }, {}], 33: [function (require, module, exports) {
        module.exports = {
            buildContentFromTemplate: buildContentFromTemplate
        };

        var polyfill = require('ui/polyfills/template');

        function buildContentFromTemplate(templateSelector, targetSelector) {
            var rules = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

            var template = document.querySelector(templateSelector);

            polyfill(template);

            var content = template.content;

            rules.forEach(function (rule) {
                return handleRule(content, rule);
            });

            document.querySelector(targetSelector).appendChild(document.importNode(content, true));
        }

        function handleRule(content, rule) {
            if (rule.multiple) {
                var els = content.querySelectorAll(rule.selector);

                Array.from(els).forEach(function (el) {
                    return updateElement(el, rule);
                });
            } else {
                var el = content.querySelector(rule.selector);
                if (!el) {
                    console.warn("Unable to update " + rule.selector + ".", rule);
                    return;
                }

                updateElement(el, rule);
            }
        }

        function updateElement(el, rule) {
            if ('text' in rule) {
                el.textContent = rule.text;
            } else if ('html' in rule) {
                el.innerHTML = rule.html;
            }

            Object.keys(rule).filter(function (key) {
                return !['selector', 'text', 'html', 'remove', 'multiple'].includes(key);
            }).forEach(function (key) {
                return el.setAttribute(key, rule[key]);
            });

            if (Array.isArray(rule.remove)) {
                rule.remove.forEach(function (key) {
                    return el.removeAttribute(key);
                });
            }
        }
    }, { "ui/polyfills/template": 32 }], 34: [function (require, module, exports) {
        (function (global) {
            'use strict';



            function compare(a, b) {
                if (a === b) {
                    return 0;
                }

                var x = a.length;
                var y = b.length;

                for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                    if (a[i] !== b[i]) {
                        x = a[i];
                        y = b[i];
                        break;
                    }
                }

                if (x < y) {
                    return -1;
                }
                if (y < x) {
                    return 1;
                }
                return 0;
            }
            function isBuffer(b) {
                if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
                    return global.Buffer.isBuffer(b);
                }
                return !!(b != null && b._isBuffer);
            }



            var util = require('util/');
            var hasOwn = Object.prototype.hasOwnProperty;
            var pSlice = Array.prototype.slice;
            var functionsHaveNames = function () {
                return function foo() {}.name === 'foo';
            }();
            function pToString(obj) {
                return Object.prototype.toString.call(obj);
            }
            function isView(arrbuf) {
                if (isBuffer(arrbuf)) {
                    return false;
                }
                if (typeof global.ArrayBuffer !== 'function') {
                    return false;
                }
                if (typeof ArrayBuffer.isView === 'function') {
                    return ArrayBuffer.isView(arrbuf);
                }
                if (!arrbuf) {
                    return false;
                }
                if (arrbuf instanceof DataView) {
                    return true;
                }
                if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
                    return true;
                }
                return false;
            }

            var assert = module.exports = ok;


            var regex = /\s*function\s+([^\(\s]*)\s*/;
            function getName(func) {
                if (!util.isFunction(func)) {
                    return;
                }
                if (functionsHaveNames) {
                    return func.name;
                }
                var str = func.toString();
                var match = str.match(regex);
                return match && match[1];
            }
            assert.AssertionError = function AssertionError(options) {
                this.name = 'AssertionError';
                this.actual = options.actual;
                this.expected = options.expected;
                this.operator = options.operator;
                if (options.message) {
                    this.message = options.message;
                    this.generatedMessage = false;
                } else {
                    this.message = getMessage(this);
                    this.generatedMessage = true;
                }
                var stackStartFunction = options.stackStartFunction || fail;
                if (Error.captureStackTrace) {
                    Error.captureStackTrace(this, stackStartFunction);
                } else {
                    var err = new Error();
                    if (err.stack) {
                        var out = err.stack;

                        var fn_name = getName(stackStartFunction);
                        var idx = out.indexOf('\n' + fn_name);
                        if (idx >= 0) {
                            var next_line = out.indexOf('\n', idx + 1);
                            out = out.substring(next_line + 1);
                        }

                        this.stack = out;
                    }
                }
            };

            util.inherits(assert.AssertionError, Error);

            function truncate(s, n) {
                if (typeof s === 'string') {
                    return s.length < n ? s : s.slice(0, n);
                } else {
                    return s;
                }
            }
            function inspect(something) {
                if (functionsHaveNames || !util.isFunction(something)) {
                    return util.inspect(something);
                }
                var rawname = getName(something);
                var name = rawname ? ': ' + rawname : '';
                return '[Function' + name + ']';
            }
            function getMessage(self) {
                return truncate(inspect(self.actual), 128) + ' ' + self.operator + ' ' + truncate(inspect(self.expected), 128);
            }



            function fail(actual, expected, message, operator, stackStartFunction) {
                throw new assert.AssertionError({
                    message: message,
                    actual: actual,
                    expected: expected,
                    operator: operator,
                    stackStartFunction: stackStartFunction
                });
            }

            assert.fail = fail;


            function ok(value, message) {
                if (!value) fail(value, true, message, '==', assert.ok);
            }
            assert.ok = ok;


            assert.equal = function equal(actual, expected, message) {
                if (actual != expected) fail(actual, expected, message, '==', assert.equal);
            };


            assert.notEqual = function notEqual(actual, expected, message) {
                if (actual == expected) {
                    fail(actual, expected, message, '!=', assert.notEqual);
                }
            };


            assert.deepEqual = function deepEqual(actual, expected, message) {
                if (!_deepEqual(actual, expected, false)) {
                    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
                }
            };

            assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
                if (!_deepEqual(actual, expected, true)) {
                    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
                }
            };

            function _deepEqual(actual, expected, strict, memos) {
                if (actual === expected) {
                    return true;
                } else if (isBuffer(actual) && isBuffer(expected)) {
                    return compare(actual, expected) === 0;

                } else if (util.isDate(actual) && util.isDate(expected)) {
                    return actual.getTime() === expected.getTime();

                } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
                    return actual.source === expected.source && actual.global === expected.global && actual.multiline === expected.multiline && actual.lastIndex === expected.lastIndex && actual.ignoreCase === expected.ignoreCase;

                } else if ((actual === null || (typeof actual === "undefined" ? "undefined" : _typeof(actual)) !== 'object') && (expected === null || (typeof expected === "undefined" ? "undefined" : _typeof(expected)) !== 'object')) {
                    return strict ? actual === expected : actual == expected;

                } else if (isView(actual) && isView(expected) && pToString(actual) === pToString(expected) && !(actual instanceof Float32Array || actual instanceof Float64Array)) {
                    return compare(new Uint8Array(actual.buffer), new Uint8Array(expected.buffer)) === 0;

                } else if (isBuffer(actual) !== isBuffer(expected)) {
                    return false;
                } else {
                    memos = memos || { actual: [], expected: [] };

                    var actualIndex = memos.actual.indexOf(actual);
                    if (actualIndex !== -1) {
                        if (actualIndex === memos.expected.indexOf(expected)) {
                            return true;
                        }
                    }

                    memos.actual.push(actual);
                    memos.expected.push(expected);

                    return objEquiv(actual, expected, strict, memos);
                }
            }

            function isArguments(object) {
                return Object.prototype.toString.call(object) == '[object Arguments]';
            }

            function objEquiv(a, b, strict, actualVisitedObjects) {
                if (a === null || a === undefined || b === null || b === undefined) return false;
                if (util.isPrimitive(a) || util.isPrimitive(b)) return a === b;
                if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
                var aIsArgs = isArguments(a);
                var bIsArgs = isArguments(b);
                if (aIsArgs && !bIsArgs || !aIsArgs && bIsArgs) return false;
                if (aIsArgs) {
                    a = pSlice.call(a);
                    b = pSlice.call(b);
                    return _deepEqual(a, b, strict);
                }
                var ka = objectKeys(a);
                var kb = objectKeys(b);
                var key, i;
                if (ka.length !== kb.length) return false;
                ka.sort();
                kb.sort();
                for (i = ka.length - 1; i >= 0; i--) {
                    if (ka[i] !== kb[i]) return false;
                }
                for (i = ka.length - 1; i >= 0; i--) {
                    key = ka[i];
                    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects)) return false;
                }
                return true;
            }


            assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
                if (_deepEqual(actual, expected, false)) {
                    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
                }
            };

            assert.notDeepStrictEqual = notDeepStrictEqual;
            function notDeepStrictEqual(actual, expected, message) {
                if (_deepEqual(actual, expected, true)) {
                    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
                }
            }


            assert.strictEqual = function strictEqual(actual, expected, message) {
                if (actual !== expected) {
                    fail(actual, expected, message, '===', assert.strictEqual);
                }
            };


            assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
                if (actual === expected) {
                    fail(actual, expected, message, '!==', assert.notStrictEqual);
                }
            };

            function expectedException(actual, expected) {
                if (!actual || !expected) {
                    return false;
                }

                if (Object.prototype.toString.call(expected) == '[object RegExp]') {
                    return expected.test(actual);
                }

                try {
                    if (actual instanceof expected) {
                        return true;
                    }
                } catch (e) {
                }

                if (Error.isPrototypeOf(expected)) {
                    return false;
                }

                return expected.call({}, actual) === true;
            }

            function _tryBlock(block) {
                var error;
                try {
                    block();
                } catch (e) {
                    error = e;
                }
                return error;
            }

            function _throws(shouldThrow, block, expected, message) {
                var actual;

                if (typeof block !== 'function') {
                    throw new TypeError('"block" argument must be a function');
                }

                if (typeof expected === 'string') {
                    message = expected;
                    expected = null;
                }

                actual = _tryBlock(block);

                message = (expected && expected.name ? ' (' + expected.name + ').' : '.') + (message ? ' ' + message : '.');

                if (shouldThrow && !actual) {
                    fail(actual, expected, 'Missing expected exception' + message);
                }

                var userProvidedMessage = typeof message === 'string';
                var isUnwantedException = !shouldThrow && util.isError(actual);
                var isUnexpectedException = !shouldThrow && actual && !expected;

                if (isUnwantedException && userProvidedMessage && expectedException(actual, expected) || isUnexpectedException) {
                    fail(actual, expected, 'Got unwanted exception' + message);
                }

                if (shouldThrow && actual && expected && !expectedException(actual, expected) || !shouldThrow && actual) {
                    throw actual;
                }
            }


            assert.throws = function (block, error, message) {
                _throws(true, block, error, message);
            };

            assert.doesNotThrow = function (block, error, message) {
                _throws(false, block, error, message);
            };

            assert.ifError = function (err) {
                if (err) throw err;
            };

            var objectKeys = Object.keys || function (obj) {
                var keys = [];
                for (var key in obj) {
                    if (hasOwn.call(obj, key)) keys.push(key);
                }
                return keys;
            };
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, { "util/": 40 }], 35: [function (require, module, exports) {
        (function (global) {
            var util = require("util");
            var assert = require("assert");
            var now = require("date-now");

            var slice = Array.prototype.slice;
            var console;
            var times = {};

            if (typeof global !== "undefined" && global.console) {
                console = global.console;
            } else if (typeof window !== "undefined" && window.console) {
                console = window.console;
            } else {
                console = {};
            }

            var functions = [[log, "log"], [info, "info"], [warn, "warn"], [error, "error"], [time, "time"], [timeEnd, "timeEnd"], [trace, "trace"], [dir, "dir"], [consoleAssert, "assert"]];

            for (var i = 0; i < functions.length; i++) {
                var tuple = functions[i];
                var f = tuple[0];
                var name = tuple[1];

                if (!console[name]) {
                    console[name] = f;
                }
            }

            module.exports = console;

            function log() {}

            function info() {
                console.log.apply(console, arguments);
            }

            function warn() {
                console.log.apply(console, arguments);
            }

            function error() {
                console.warn.apply(console, arguments);
            }

            function time(label) {
                times[label] = now();
            }

            function timeEnd(label) {
                var time = times[label];
                if (!time) {
                    throw new Error("No such label: " + label);
                }

                var duration = now() - time;
                console.log(label + ": " + duration + "ms");
            }

            function trace() {
                var err = new Error();
                err.name = "Trace";
                err.message = util.format.apply(null, arguments);
                console.error(err.stack);
            }

            function dir(object) {
                console.log(util.inspect(object) + "\n");
            }

            function consoleAssert(expression) {
                if (!expression) {
                    var arr = slice.call(arguments, 1);
                    assert.ok(false, util.format.apply(null, arr));
                }
            }
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, { "assert": 34, "date-now": 36, "util": 40 }], 36: [function (require, module, exports) {
        module.exports = now;

        function now() {
            return new Date().getTime();
        }
    }, {}], 37: [function (require, module, exports) {
        var process = module.exports = {};


        var cachedSetTimeout;
        var cachedClearTimeout;

        function defaultSetTimout() {
            throw new Error('setTimeout has not been defined');
        }
        function defaultClearTimeout() {
            throw new Error('clearTimeout has not been defined');
        }
        (function () {
            try {
                if (typeof setTimeout === 'function') {
                    cachedSetTimeout = setTimeout;
                } else {
                    cachedSetTimeout = defaultSetTimout;
                }
            } catch (e) {
                cachedSetTimeout = defaultSetTimout;
            }
            try {
                if (typeof clearTimeout === 'function') {
                    cachedClearTimeout = clearTimeout;
                } else {
                    cachedClearTimeout = defaultClearTimeout;
                }
            } catch (e) {
                cachedClearTimeout = defaultClearTimeout;
            }
        })();
        function runTimeout(fun) {
            if (cachedSetTimeout === setTimeout) {
                return setTimeout(fun, 0);
            }
            if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
                cachedSetTimeout = setTimeout;
                return setTimeout(fun, 0);
            }
            try {
                return cachedSetTimeout(fun, 0);
            } catch (e) {
                try {
                    return cachedSetTimeout.call(null, fun, 0);
                } catch (e) {
                    return cachedSetTimeout.call(this, fun, 0);
                }
            }
        }
        function runClearTimeout(marker) {
            if (cachedClearTimeout === clearTimeout) {
                return clearTimeout(marker);
            }
            if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
                cachedClearTimeout = clearTimeout;
                return clearTimeout(marker);
            }
            try {
                return cachedClearTimeout(marker);
            } catch (e) {
                try {
                    return cachedClearTimeout.call(null, marker);
                } catch (e) {
                    return cachedClearTimeout.call(this, marker);
                }
            }
        }
        var queue = [];
        var draining = false;
        var currentQueue;
        var queueIndex = -1;

        function cleanUpNextTick() {
            if (!draining || !currentQueue) {
                return;
            }
            draining = false;
            if (currentQueue.length) {
                queue = currentQueue.concat(queue);
            } else {
                queueIndex = -1;
            }
            if (queue.length) {
                drainQueue();
            }
        }

        function drainQueue() {
            if (draining) {
                return;
            }
            var timeout = runTimeout(cleanUpNextTick);
            draining = true;

            var len = queue.length;
            while (len) {
                currentQueue = queue;
                queue = [];
                while (++queueIndex < len) {
                    if (currentQueue) {
                        currentQueue[queueIndex].run();
                    }
                }
                queueIndex = -1;
                len = queue.length;
            }
            currentQueue = null;
            draining = false;
            runClearTimeout(timeout);
        }

        process.nextTick = function (fun) {
            var args = new Array(arguments.length - 1);
            if (arguments.length > 1) {
                for (var i = 1; i < arguments.length; i++) {
                    args[i - 1] = arguments[i];
                }
            }
            queue.push(new Item(fun, args));
            if (queue.length === 1 && !draining) {
                runTimeout(drainQueue);
            }
        };

        function Item(fun, array) {
            this.fun = fun;
            this.array = array;
        }
        Item.prototype.run = function () {
            this.fun.apply(null, this.array);
        };
        process.title = 'browser';
        process.browser = true;
        process.env = {};
        process.argv = [];
        process.version = ''; 
        process.versions = {};

        function noop() {}

        process.on = noop;
        process.addListener = noop;
        process.once = noop;
        process.off = noop;
        process.removeListener = noop;
        process.removeAllListeners = noop;
        process.emit = noop;

        process.binding = function (name) {
            throw new Error('process.binding is not supported');
        };

        process.cwd = function () {
            return '/';
        };
        process.chdir = function (dir) {
            throw new Error('process.chdir is not supported');
        };
        process.umask = function () {
            return 0;
        };
    }, {}], 38: [function (require, module, exports) {
        if (typeof Object.create === 'function') {
            module.exports = function inherits(ctor, superCtor) {
                ctor.super_ = superCtor;
                ctor.prototype = Object.create(superCtor.prototype, {
                    constructor: {
                        value: ctor,
                        enumerable: false,
                        writable: true,
                        configurable: true
                    }
                });
            };
        } else {
            module.exports = function inherits(ctor, superCtor) {
                ctor.super_ = superCtor;
                var TempCtor = function TempCtor() {};
                TempCtor.prototype = superCtor.prototype;
                ctor.prototype = new TempCtor();
                ctor.prototype.constructor = ctor;
            };
        }
    }, {}], 39: [function (require, module, exports) {
        module.exports = function isBuffer(arg) {
            return arg && (typeof arg === "undefined" ? "undefined" : _typeof(arg)) === 'object' && typeof arg.copy === 'function' && typeof arg.fill === 'function' && typeof arg.readUInt8 === 'function';
        };
    }, {}], 40: [function (require, module, exports) {
        (function (process, global) {

            var formatRegExp = /%[sdj%]/g;
            exports.format = function (f) {
                if (!isString(f)) {
                    var objects = [];
                    for (var i = 0; i < arguments.length; i++) {
                        objects.push(inspect(arguments[i]));
                    }
                    return objects.join(' ');
                }

                var i = 1;
                var args = arguments;
                var len = args.length;
                var str = String(f).replace(formatRegExp, function (x) {
                    if (x === '%%') return '%';
                    if (i >= len) return x;
                    switch (x) {
                        case '%s':
                            return String(args[i++]);
                        case '%d':
                            return Number(args[i++]);
                        case '%j':
                            try {
                                return JSON.stringify(args[i++]);
                            } catch (_) {
                                return '[Circular]';
                            }
                        default:
                            return x;
                    }
                });
                for (var x = args[i]; i < len; x = args[++i]) {
                    if (isNull(x) || !isObject(x)) {
                        str += ' ' + x;
                    } else {
                        str += ' ' + inspect(x);
                    }
                }
                return str;
            };

            exports.deprecate = function (fn, msg) {
                if (isUndefined(global.process)) {
                    return function () {
                        return exports.deprecate(fn, msg).apply(this, arguments);
                    };
                }

                if (process.noDeprecation === true) {
                    return fn;
                }

                var warned = false;
                function deprecated() {
                    if (!warned) {
                        if (process.throwDeprecation) {
                            throw new Error(msg);
                        } else if (process.traceDeprecation) {
                            console.trace(msg);
                        } else {
                            console.error(msg);
                        }
                        warned = true;
                    }
                    return fn.apply(this, arguments);
                }

                return deprecated;
            };

            var debugs = {};
            var debugEnviron;
            exports.debuglog = function (set) {
                if (isUndefined(debugEnviron)) debugEnviron = process.env.NODE_DEBUG || '';
                set = set.toUpperCase();
                if (!debugs[set]) {
                    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
                        var pid = process.pid;
                        debugs[set] = function () {
                            var msg = exports.format.apply(exports, arguments);
                            console.error('%s %d: %s', set, pid, msg);
                        };
                    } else {
                        debugs[set] = function () {};
                    }
                }
                return debugs[set];
            };

            function inspect(obj, opts) {
                var ctx = {
                    seen: [],
                    stylize: stylizeNoColor
                };
                if (arguments.length >= 3) ctx.depth = arguments[2];
                if (arguments.length >= 4) ctx.colors = arguments[3];
                if (isBoolean(opts)) {
                    ctx.showHidden = opts;
                } else if (opts) {
                    exports._extend(ctx, opts);
                }
                if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
                if (isUndefined(ctx.depth)) ctx.depth = 2;
                if (isUndefined(ctx.colors)) ctx.colors = false;
                if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
                if (ctx.colors) ctx.stylize = stylizeWithColor;
                return formatValue(ctx, obj, ctx.depth);
            }
            exports.inspect = inspect;

            inspect.colors = {
                'bold': [1, 22],
                'italic': [3, 23],
                'underline': [4, 24],
                'inverse': [7, 27],
                'white': [37, 39],
                'grey': [90, 39],
                'black': [30, 39],
                'blue': [34, 39],
                'cyan': [36, 39],
                'green': [32, 39],
                'magenta': [35, 39],
                'red': [31, 39],
                'yellow': [33, 39]
            };

            inspect.styles = {
                'special': 'cyan',
                'number': 'yellow',
                'boolean': 'yellow',
                'undefined': 'grey',
                'null': 'bold',
                'string': 'green',
                'date': 'magenta',
                'regexp': 'red'
            };

            function stylizeWithColor(str, styleType) {
                var style = inspect.styles[styleType];

                if (style) {
                    return "\x1B[" + inspect.colors[style][0] + 'm' + str + "\x1B[" + inspect.colors[style][1] + 'm';
                } else {
                    return str;
                }
            }

            function stylizeNoColor(str, styleType) {
                return str;
            }

            function arrayToHash(array) {
                var hash = {};

                array.forEach(function (val, idx) {
                    hash[val] = true;
                });

                return hash;
            }

            function formatValue(ctx, value, recurseTimes) {
                if (ctx.customInspect && value && isFunction(value.inspect) &&
                value.inspect !== exports.inspect &&
                !(value.constructor && value.constructor.prototype === value)) {
                    var ret = value.inspect(recurseTimes, ctx);
                    if (!isString(ret)) {
                        ret = formatValue(ctx, ret, recurseTimes);
                    }
                    return ret;
                }

                var primitive = formatPrimitive(ctx, value);
                if (primitive) {
                    return primitive;
                }

                var keys = Object.keys(value);
                var visibleKeys = arrayToHash(keys);

                if (ctx.showHidden) {
                    keys = Object.getOwnPropertyNames(value);
                }

                if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
                    return formatError(value);
                }

                if (keys.length === 0) {
                    if (isFunction(value)) {
                        var name = value.name ? ': ' + value.name : '';
                        return ctx.stylize('[Function' + name + ']', 'special');
                    }
                    if (isRegExp(value)) {
                        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
                    }
                    if (isDate(value)) {
                        return ctx.stylize(Date.prototype.toString.call(value), 'date');
                    }
                    if (isError(value)) {
                        return formatError(value);
                    }
                }

                var base = '',
                    array = false,
                    braces = ['{', '}'];

                if (isArray(value)) {
                    array = true;
                    braces = ['[', ']'];
                }

                if (isFunction(value)) {
                    var n = value.name ? ': ' + value.name : '';
                    base = ' [Function' + n + ']';
                }

                if (isRegExp(value)) {
                    base = ' ' + RegExp.prototype.toString.call(value);
                }

                if (isDate(value)) {
                    base = ' ' + Date.prototype.toUTCString.call(value);
                }

                if (isError(value)) {
                    base = ' ' + formatError(value);
                }

                if (keys.length === 0 && (!array || value.length == 0)) {
                    return braces[0] + base + braces[1];
                }

                if (recurseTimes < 0) {
                    if (isRegExp(value)) {
                        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
                    } else {
                        return ctx.stylize('[Object]', 'special');
                    }
                }

                ctx.seen.push(value);

                var output;
                if (array) {
                    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
                } else {
                    output = keys.map(function (key) {
                        return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
                    });
                }

                ctx.seen.pop();

                return reduceToSingleString(output, base, braces);
            }

            function formatPrimitive(ctx, value) {
                if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');
                if (isString(value)) {
                    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
                    return ctx.stylize(simple, 'string');
                }
                if (isNumber(value)) return ctx.stylize('' + value, 'number');
                if (isBoolean(value)) return ctx.stylize('' + value, 'boolean');
                if (isNull(value)) return ctx.stylize('null', 'null');
            }

            function formatError(value) {
                return '[' + Error.prototype.toString.call(value) + ']';
            }

            function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
                var output = [];
                for (var i = 0, l = value.length; i < l; ++i) {
                    if (hasOwnProperty(value, String(i))) {
                        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
                    } else {
                        output.push('');
                    }
                }
                keys.forEach(function (key) {
                    if (!key.match(/^\d+$/)) {
                        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
                    }
                });
                return output;
            }

            function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
                var name, str, desc;
                desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
                if (desc.get) {
                    if (desc.set) {
                        str = ctx.stylize('[Getter/Setter]', 'special');
                    } else {
                        str = ctx.stylize('[Getter]', 'special');
                    }
                } else {
                    if (desc.set) {
                        str = ctx.stylize('[Setter]', 'special');
                    }
                }
                if (!hasOwnProperty(visibleKeys, key)) {
                    name = '[' + key + ']';
                }
                if (!str) {
                    if (ctx.seen.indexOf(desc.value) < 0) {
                        if (isNull(recurseTimes)) {
                            str = formatValue(ctx, desc.value, null);
                        } else {
                            str = formatValue(ctx, desc.value, recurseTimes - 1);
                        }
                        if (str.indexOf('\n') > -1) {
                            if (array) {
                                str = str.split('\n').map(function (line) {
                                    return '  ' + line;
                                }).join('\n').substr(2);
                            } else {
                                str = '\n' + str.split('\n').map(function (line) {
                                    return '   ' + line;
                                }).join('\n');
                            }
                        }
                    } else {
                        str = ctx.stylize('[Circular]', 'special');
                    }
                }
                if (isUndefined(name)) {
                    if (array && key.match(/^\d+$/)) {
                        return str;
                    }
                    name = JSON.stringify('' + key);
                    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
                        name = name.substr(1, name.length - 2);
                        name = ctx.stylize(name, 'name');
                    } else {
                        name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
                        name = ctx.stylize(name, 'string');
                    }
                }

                return name + ': ' + str;
            }

            function reduceToSingleString(output, base, braces) {
                var numLinesEst = 0;
                var length = output.reduce(function (prev, cur) {
                    numLinesEst++;
                    if (cur.indexOf('\n') >= 0) numLinesEst++;
                    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
                }, 0);

                if (length > 60) {
                    return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
                }

                return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
            }

            function isArray(ar) {
                return Array.isArray(ar);
            }
            exports.isArray = isArray;

            function isBoolean(arg) {
                return typeof arg === 'boolean';
            }
            exports.isBoolean = isBoolean;

            function isNull(arg) {
                return arg === null;
            }
            exports.isNull = isNull;

            function isNullOrUndefined(arg) {
                return arg == null;
            }
            exports.isNullOrUndefined = isNullOrUndefined;

            function isNumber(arg) {
                return typeof arg === 'number';
            }
            exports.isNumber = isNumber;

            function isString(arg) {
                return typeof arg === 'string';
            }
            exports.isString = isString;

            function isSymbol(arg) {
                return (typeof arg === "undefined" ? "undefined" : _typeof(arg)) === 'symbol';
            }
            exports.isSymbol = isSymbol;

            function isUndefined(arg) {
                return arg === void 0;
            }
            exports.isUndefined = isUndefined;

            function isRegExp(re) {
                return isObject(re) && objectToString(re) === '[object RegExp]';
            }
            exports.isRegExp = isRegExp;

            function isObject(arg) {
                return (typeof arg === "undefined" ? "undefined" : _typeof(arg)) === 'object' && arg !== null;
            }
            exports.isObject = isObject;

            function isDate(d) {
                return isObject(d) && objectToString(d) === '[object Date]';
            }
            exports.isDate = isDate;

            function isError(e) {
                return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
            }
            exports.isError = isError;

            function isFunction(arg) {
                return typeof arg === 'function';
            }
            exports.isFunction = isFunction;

            function isPrimitive(arg) {
                return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || (typeof arg === "undefined" ? "undefined" : _typeof(arg)) === 'symbol' || 
                typeof arg === 'undefined';
            }
            exports.isPrimitive = isPrimitive;

            exports.isBuffer = require('./support/isBuffer');

            function objectToString(o) {
                return Object.prototype.toString.call(o);
            }

            function pad(n) {
                return n < 10 ? '0' + n.toString(10) : n.toString(10);
            }

            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            function timestamp() {
                var d = new Date();
                var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
                return [d.getDate(), months[d.getMonth()], time].join(' ');
            }

            exports.log = function () {
                console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
            };

            exports.inherits = require('inherits');

            exports._extend = function (origin, add) {
                if (!add || !isObject(add)) return origin;

                var keys = Object.keys(add);
                var i = keys.length;
                while (i--) {
                    origin[keys[i]] = add[keys[i]];
                }
                return origin;
            };

            function hasOwnProperty(obj, prop) {
                return Object.prototype.hasOwnProperty.call(obj, prop);
            }
        }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
    }, { "./support/isBuffer": 39, "_process": 37, "inherits": 38 }] }, {}, [24]);