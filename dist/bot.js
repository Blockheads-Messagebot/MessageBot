"use strict";

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
        Object.assign(module.exports, require('./send'));
    }, { "./send": 2 }], 2: [function (require, module, exports) {
        var api = require('app/libraries/blockheads');
        var report = require('app/libraries/bhfansapi').reportError;
        var settings = require('app/settings');

        var queue = [];

        module.exports = {
            send: send
        };

        function send(message) {
            if (settings.splitMessages) {
                var str = message.split(settings.splitToken);
                var toSend = [];

                for (var i = 0; i < str.length - 1; i++) {
                    var curr = str[i];
                    if (curr[curr.length - 1] == '\\') {
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

            api.send(queue.shift()).catch(function (err) {
                report(new Error(err));
            }).then(function () {
                setTimeout(checkQueue, 1000);
            });
        })();
    }, { "app/libraries/bhfansapi": 6, "app/libraries/blockheads": 7, "app/settings": 11 }], 3: [function (require, module, exports) {
        module.exports = {
            write: write,
            clear: clear
        };

        function write(msg) {
            var name = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
            var nameClass = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

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
    }, {}], 4: [function (require, module, exports) {
        var self = module.exports = require('./exports');
        var send = require('app/bot').send;

        var hook = require('app/libraries/hook');
        var world = require('app/libraries/world');

        var tab = require('app/ui').addTab('Console');

        tab.innerHTML = '<style>' + "#mb_console .chat{height:calc(100vh - 220px)}@media screen and (min-width: 668px){#mb_console .chat{height:calc(100vh - 155px)}}#mb_console ul{height:100%;overflow-y:auto;margin:0;padding:0}#mb_console li{list-style-type:none}#mb_console .controls{display:flex;padding:0 10px}#mb_console input,#mb_console button{margin:5px 0}#mb_console input{font-size:1em;padding:1px;flex:1;border:solid 1px #999}#mb_console button{background:#182b73;font-weight:bold;color:#fff;border:0;height:40px;padding:1px 4px}#mb_console .mod>span:first-child{color:#05f529}#mb_console .admin>span:first-child{color:#2b26bd}\n" + '</style>' + "<div id=\"mb_console\">\r\n    <div class=\"chat\">\r\n        <ul></ul>\r\n    </div>\r\n    <div class=\"controls\">\r\n        <input type=\"text\"/><button>SEND</button>\r\n    </div>\r\n</div>\r\n";

        hook.on('world.other', function (message) {
            self.write(message, undefined, 'other');
        });

        hook.on('world.message', function (name, message) {
            var msgClass = 'player';
            if (world.isStaff(name)) {
                msgClass = 'staff';
                if (world.isMod(name)) {
                    msgClass += ' mod';
                } else {
                    msgClass += ' admin';
                }
            }
            if (message.startsWith('/')) {
                msgClass += ' command';
            }
            self.write(message, name, msgClass);
        });

        hook.on('world.serverchat', function (message) {
            self.write(message, 'SERVER', 'admin');
        });

        hook.on('world.send', function (message) {
            if (message.startsWith('/')) {
                self.write(message, 'SERVER', 'admin command');
            }
        });

        hook.on('world.join', function handlePlayerJoin(name, ip) {
            self.write(name + " (" + ip + ") has joined the server", 'SERVER', 'join world admin');
        });

        hook.on('world.leave', function handlePlayerLeave(name) {
            self.write(name + " has left the server", 'SERVER', "leave world admin");
        });

        new MutationObserver(function showNewChat() {
            var container = tab.querySelector('ul');
            var lastLine = tab.querySelector('li:last-child');

            if (!container || !lastLine) {
                return;
            }

            if (container.scrollHeight - container.clientHeight - container.scrollTop <= lastLine.clientHeight * 2) {
                lastLine.scrollIntoView(false);
            }
        }).observe(tab.querySelector('.chat'), { childList: true });

        new MutationObserver(function removeOldChat() {
            var chat = tab.querySelector('ul');

            while (chat.children.length > 500) {
                chat.children[0].remove();
            }
        }).observe(tab.querySelector('.chat'), { childList: true });

        function userSend(message) {
            var input = tab.querySelector('input');
            send(message);
            input.value = '';
            input.focus();
        }

        tab.querySelector('input').addEventListener('keydown', function (event) {
            var input = event.target;
            if (event.key == "Enter" || event.keyCode == 13) {
                event.preventDefault();
                userSend(input.value);
            }
        });

        tab.querySelector('button').addEventListener('click', function () {
            userSend(tab.querySelector('input').value);
        });
    }, { "./exports": 3, "app/bot": 1, "app/libraries/hook": 8, "app/libraries/world": 10, "app/ui": 13 }], 5: [function (require, module, exports) {

        function get() {
            var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
            var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

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
            var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
            var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            return get(url, paramObj).then(JSON.parse);
        }

        function post() {
            var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
            var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            return xhr('POST', url, paramObj);
        }

        function postJSON() {
            var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
            var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            return post(url, paramObj).then(JSON.parse);
        }

        function xhr(protocol) {
            var url = arguments.length <= 1 || arguments[1] === undefined ? '/' : arguments[1];
            var paramObj = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

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
    }, {}], 6: [function (require, module, exports) {

        var ui = require('app/ui');
        var ajax = require('app/libraries/ajax');

        var API_URLS = {
            STORE: '//blockheadsfans.com/messagebot/extension/store',
            NAME: '//blockheadsfans.com/messagebot/extension/name',
            ERROR: '//blockheadsfans.com/messagebot/bot/error'
        };

        var cache = {
            names: new Map()
        };

        getStore().then(function (store) {
            if (store.status != 'ok') {
                return;
            }

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = store.extensions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var ex = _step.value;

                    cache.names.set(ex.id, ex.title);
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
        }).catch(reportError);

        function getStore() {
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

            if (refresh || !cache.getStore) {
                cache.getStore = ajax.getJSON(API_URLS.STORE);
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
                    ui.notify('Something went wrong, it has been reported.');
                } else {
                    ui.notify("Error reporting exception: " + resp.message);
                }
            }).catch(console.error);
        }

        module.exports = {
            getStore: getStore,
            getExtensionName: getExtensionName,
            reportError: reportError
        };
    }, { "app/libraries/ajax": 5, "app/ui": 13 }], 7: [function (require, module, exports) {
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
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

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
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

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
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

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

            return cache.worldStarted;
        }

        function getHomepage() {
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

            if (refresh || !cache.getHomepage) {
                cache.getHomepage = ajax.get("/worlds/" + worldId).catch(function () {
                    return getHomepage(true);
                });
            }

            return cache.getHomepage;
        }

        function getOnlinePlayers() {
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

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
                        var _message$match = message.match(/ - Player Connected (.*) \| ([\d.]+) \| ([\w]{32})\s*$/);

                        var _message$match2 = _slicedToArray(_message$match, 3);

                        var name = _message$match2[1];
                        var ip = _message$match2[2];

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
    }, { "./ajax": 5, "./bhfansapi": 6, "./hook": 8 }], 8: [function (require, module, exports) {
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
    }, {}], 9: [function (require, module, exports) {
        function update(keys, operator) {
            Object.keys(localStorage).forEach(function (item) {
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var key = _step2.value;

                        if (item.startsWith(key)) {
                            localStorage.setItem(item, operator(localStorage.getItem(item)));
                            break;
                        }
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
    }, {}], 10: [function (require, module, exports) {

    }, {}], 11: [function (require, module, exports) {
        module.exports = {};
    }, {}], 12: [function (require, module, exports) {
        window.pollChat = function () {};

        document.body.innerHTML = '';
        document.head.innerHTML = '';

        require('app/ui/polyfills/console');
        require('app/libraries/migration');

        var bhfansapi = require('app/libraries/bhfansapi');
        var hook = require('app/libraries/hook');

        hook.on('error', bhfansapi.reportError);

        require('app/console');

        window.addEventListener('error', function (err) {
            if (err.message != 'Script error') {
                window.hook.check('error', err);
            }
        });
    }, { "app/console": 4, "app/libraries/bhfansapi": 6, "app/libraries/hook": 8, "app/libraries/migration": 9, "app/ui/polyfills/console": 18 }], 13: [function (require, module, exports) {
        require('./polyfills/details');

        Object.assign(module.exports, require('./layout'), require('./template'), require('./notifications'));

        var write = require('app/console/exports').write;
        module.exports.addMessageToConsole = function (msg) {
            var name = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
            var nameClass = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];

            console.warn('ui.addMessageToConsole has been depricated. Use ex.console.write instead.');
            write(msg, name, nameClass);
        };
    }, { "./layout": 14, "./notifications": 16, "./polyfills/details": 19, "./template": 21, "app/console/exports": 3 }], 14: [function (require, module, exports) {

        document.body.innerHTML += "<div id=\"leftNav\">\r\n    <input type=\"checkbox\" id=\"leftToggle\">\r\n    <label for=\"leftToggle\">&#9776; Menu</label>\r\n\r\n    <nav data-tab-group=\"main\"></nav>\r\n    <div class=\"overlay\"></div>\r\n</div>\r\n\r\n<div id=\"container\">\r\n    <header></header>\r\n</div>\r\n";
        document.head.innerHTML += '<style>' + "html,body{min-height:100vh;position:relative;width:100%;margin:0;font-family:\"Lucida Grande\",\"Lucida Sans Unicode\",Verdana,sans-serif;color:#000}textarea,input,button,select{font-family:inherit}a{cursor:pointer;color:#182b73}#leftNav{text-transform:uppercase}#leftNav nav{width:250px;background:#182b73;color:#fff;position:fixed;left:-250px;z-index:100;top:0;bottom:0;transition:left .5s}#leftNav details,#leftNav span{display:block;text-align:center;padding:5px 7px;border-bottom:1px solid white}#leftNav .selected{background:radial-gradient(#9fafeb, #182b73)}#leftNav summary ~ span{background:rgba(159,175,235,0.4)}#leftNav summary+span{border-top-left-radius:20px;border-top-right-radius:20px}#leftNav summary ~ span:last-of-type{border:0;border-bottom-left-radius:20px;border-bottom-right-radius:20px}#leftNav input{display:none}#leftNav label{color:#fff;background:#213b9d;padding:5px;position:fixed;top:5px;z-index:100;left:5px;opacity:1;transition:left .5s,opacity .5s}#leftNav input:checked ~ nav{left:0;transition:left .5s}#leftNav input:checked ~ label{left:255px;opacity:0;transition:left .5s,opacity .5s}#leftNav input:checked ~ .overlay{visibility:visible;opacity:1;transition:opacity .5s}header{background:#182b73 url(\"http://portal.theblockheads.net/static/images/portalHeader.png\") no-repeat;background-position:80px;height:80px}#container>div{height:calc(100vh - 100px);padding:10px;position:absolute;top:80px;left:0;right:0;overflow:auto}#container>div:not(.visible){display:none}.overlay{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99;background:rgba(0,0,0,0.7);visibility:hidden;opacity:0;transition:opacity .5s}.overlay.visible{visibility:visible;opacity:1;transition:opacity .5s}.third-box{position:relative;float:left;width:calc(33% - 19px);min-width:280px;padding:5px;margin-left:5px;margin-bottom:5px;border:3px solid #999;border-radius:10px}.third-box:nth-child(odd){background:#ccc}.top-right-button{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:10px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}\n" + '</style>';

        document.querySelector('#leftNav .overlay').addEventListener('click', toggleMenu);

        document.querySelector('#leftNav').addEventListener('click', function globalTabChange(event) {
            var tabName = event.target.dataset.tabName;
            if (!tabName) {
                return;
            }

            Array.from(document.querySelectorAll('#container > .visible')).forEach(function (el) {
                return el.classList.remove('visible');
            });
            document.querySelector("#container > [data-tab-name=" + tabName + "]").classList.add('visible');

            Array.from(document.querySelectorAll('#leftNav .selected')).forEach(function (el) {
                return el.classList.remove('selected');
            });
            event.target.classList.add('selected');
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
            var groupName = arguments.length <= 1 || arguments[1] === undefined ? 'main' : arguments[1];

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
    }, {}], 15: [function (require, module, exports) {
        module.exports = {
            alert: alert
        };

        function alert(text) {
            var buttons = arguments.length <= 1 || arguments[1] === undefined ? [{ text: 'OK' }] : arguments[1];

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
    }, {}], 16: [function (require, module, exports) {
        Object.assign(module.exports, require('./alert'), require('./notify'));

        var el = document.createElement('style');
        el.innerHTML = "#alert{visibility:hidden;position:fixed;top:50px;left:0;right:0;margin:auto;z-index:101;width:50%;min-width:300px;min-height:200px;background:#fff;border-radius:10px;padding:10px 10px 55px 10px}#alert.visible{visibility:visible}#alert>div{webkit-overflow-scrolling:touch;max-height:65vh;overflow-y:auto}#alert>.buttons{position:absolute;bottom:10px;left:5px}#alert>.buttons>span{display:inline-block;padding:6px 12px;margin:0 5px;text-align:center;white-space:nowrap;cursor:pointer;border:1px solid rgba(0,0,0,0.15);border-radius:6px;background:#fff linear-gradient(to bottom, #fff 0, #e0e0e0 100%)}#alert>.buttons [class]{color:#fff}#alert>.buttons .success{background:#5cb85c linear-gradient(to bottom, #5cb85c 0, #419641 100%);border-color:#3e8f3e}#alert>.buttons .info{background:#5bc0de linear-gradient(to bottom, #5bc0de 0, #2aabd2 100%);border-color:#28a4c9}#alert>.buttons .danger{background:#d9534f linear-gradient(to bottom, #d9534f 0, #c12e2a 100%);border-color:#b92c28}#alert>.buttons .warning{background:#f0ad4e linear-gradient(to bottom, #f0ad4e 0, #eb9316 100%);border-color:#e38d13}.notification{opacity:0;transition:opacity 1s;position:fixed;top:1em;right:1em;min-width:200px;border-radius:5px;padding:5px;background:#9fafeb}.notification.visible{opacity:1}\n";
        document.head.appendChild(el);

        el = document.createElement('div');
        el.id = 'alertWrapper';
        el.innerHTML = "<div id=\"alert\">\r\n    <div id=\"alertContent\"></div>\r\n    <div class=\"buttons\"/></div>\r\n</div>\r\n<div class=\"overlay\"/></div>\r\n";

        document.body.appendChild(el);
    }, { "./alert": 15, "./notify": 17 }], 17: [function (require, module, exports) {
        module.exports = {
            notify: notify
        };

        function notify(text) {
            var displayTime = arguments.length <= 1 || arguments[1] === undefined ? 2 : arguments[1];

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
    }, {}], 18: [function (require, module, exports) {
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
    }, {}], 19: [function (require, module, exports) {
        if (!('open' in document.createElement('details'))) {
            var style = document.createElement('style');
            style.textContent += "details:not([open]) > :not(summary) { display: none !important; } details > summary:before { content: \"▶\"; display: inline-block; font-size: .8em; width: 1.5em; font-family:\"Courier New\"; } details[open] > summary:before { transform: rotate(90deg); }";
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
    }, {}], 20: [function (require, module, exports) {

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
    }, {}], 21: [function (require, module, exports) {
        module.exports = {
            buildContentFromTemplate: buildContentFromTemplate
        };

        var polyfill = require('app/ui/polyfills/template');

        function buildContentFromTemplate(templateSelector, targetSelector) {
            var rules = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

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
    }, { "app/ui/polyfills/template": 20 }] }, {}, [12]);