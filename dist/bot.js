"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

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
        function MessageBot(ajax, hook, storage, bhfansapi, api, ui) {
            var chatBuffer = [];
            (function checkBuffer() {
                if (chatBuffer.length) {
                    api.send(chatBuffer.shift()).then(function () {
                        return setTimeout(checkBuffer, 500);
                    });
                } else {
                    setTimeout(checkBuffer, 500);
                }
            })();

            setTimeout(function () {
                bhfansapi.listExtensions();
                hook.listen('error', bhfansapi.reportError);
                storage.getObject('mb_extensions', [], false).forEach(bhfansapi.startExtension);
            }, 1000);

            var bot = {
                version: '6.0.6',
                ui: ui,
                api: api,
                hook: hook,
                storage: storage,
                preferences: storage.getObject('mb_preferences', {}, false)
            };
            storage.set('mb_version', bot.version, false);

            bot.send = function send(message) {
                chatBuffer.push(hook.update('bot.send', message));
            };

            var world = {
                name: '',
                online: [],
                owner: '',
                players: storage.getObject('mb_players', {}),
                lists: { admin: [], mod: [], staff: [], black: [], white: [] }
            };
            bot.world = world;

            var messages = {
                announcement: storage.getObject('announcementArr', []),
                trigger: storage.getObject('triggerArr', []),
                join: storage.getObject('joinArr', []),
                leave: storage.getObject('leaveArr', [])
            };

            Promise.all([api.getLists(), api.getWorldName(), api.getOwnerName()]).then(function (values) {
                var _values = _slicedToArray(values, 3);

                var lists = _values[0];
                var worldName = _values[1];
                var owner = _values[2];


                [owner, 'SERVER'].forEach(function (name) {
                    if (!lists.admin.includes(name)) {
                        lists.admin.push(name);
                    }
                    if (!lists.staff.includes(name)) {
                        lists.staff.push(name);
                    }
                    if (lists.mod.includes(name)) {
                        lists.mod.splice(lists.mod.indexOf(name), 1);
                    }
                });

                world.lists = lists;
                world.name = worldName;
                world.owner = owner;
            }).catch(bhfansapi.reportError);

            Promise.all([api.getLogs(), api.getWorldName()]).then(function (values) {
                var _values2 = _slicedToArray(values, 2);

                var log = _values2[0];
                var worldName = _values2[1];

                var last = storage.getObject('mb_lastLogLoad', 0);
                storage.set('mb_lastLogLoad', Math.floor(Date.now().valueOf()));

                log.forEach(function (line) {
                    var time = new Date(line.substring(0, line.indexOf('b')));
                    var message = line.substring(line.indexOf(']') + 2);

                    if (time < last) {
                        return;
                    }

                    if (message.startsWith(worldName + " - Player Connected ")) {
                        var parts = line.substr(line.indexOf(' - Player Connected ') + 20); 
                        parts = parts.substr(0, parts.lastIndexOf(' | ')); 
                        var name = parts.substr(0, parts.lastIndexOf(' | '));
                        var ip = parts.substr(name.length + 3);

                        if (world.players[name]) {
                            world.players[name].joins++;
                            if (!world.players[name].ips.includes(ip)) {
                                world.players[name].ips.push(ip);
                            }
                        } else {
                            world.players[name] = { joins: 1, ips: [ip] };
                        }
                        world.players[name].ip = ip;
                    }
                });
            }).then(function () {
                return storage.set('mb_players', world.players);
            }).catch(bhfansapi.reportError);

            (function (prefs) {
                function checkPref(type, name, selector, defval) {
                    if (_typeof(prefs[name]) != type) {
                        prefs[name] = defval;
                    }

                    if (type == 'boolean') {
                        document.querySelector(selector).checked = prefs[name] ? 'checked' : '';
                    } else {
                        document.querySelector(selector).value = prefs[name];
                    }
                }

                checkPref('number', 'announcementDelay', '#mb_ann_delay', 10);
                checkPref('number', 'maxResponses', '#mb_resp_max', 2);
                checkPref('boolean', 'regexTriggers', '#mb_regex_triggers', false);
                checkPref('boolean', 'disableTrim', '#mb_disable_trim', false);
                checkPref('boolean', 'notify', '#mb_notify_message', true);
            })(bot.preferences);

            (function (msgs, ids, tids) {
                msgs.forEach(function (type, index) {
                    messages[type].forEach(function (msg) {
                        ui.addMsg("#" + tids[index], "#" + ids[index], msg);
                    });
                });
            })(['join', 'leave', 'trigger', 'announcement'], ['jMsgs', 'lMsgs', 'tMsgs', 'aMsgs'], ['jlTemplate', 'jlTemplate', 'tTemplate', 'aTemplate']);

            (function announcementCheck(i) {
                i = i >= messages.announcement.length ? 0 : i;

                var ann = messages.announcement[i];

                if (ann && ann.message) {
                    bot.send(ann.message);
                }
                setTimeout(announcementCheck, bot.preferences.announcementDelay * 60000, i + 1);
            })(0);

            hook.listen('world.other', function (message) {
                ui.addMessageToConsole(message, undefined, 'other');
            });
            hook.listen('world.message', function (name, message) {
                var msgClass = 'player';
                if (bot.checkGroup('staff', name)) {
                    msgClass = 'staff';
                    if (bot.checkGroup('mod', name)) {
                        msgClass += ' mod';
                    } else {
                        msgClass += ' admin';
                    }
                }
                if (message.startsWith('/')) {
                    msgClass += ' command';
                }
                ui.addMessageToConsole(message, name, msgClass);
            });
            hook.listen('world.serverchat', function (message) {
                ui.addMessageToConsole(message, 'SERVER', 'admin');
            });
            hook.listen('world.send', function (message) {
                if (message.startsWith('/')) {
                    ui.addMessageToConsole(message, 'SERVER', 'admin command');
                }
            });

            hook.listen('world.join', function handlePlayerJoin(name, ip) {
                if (world.players.hasOwnProperty(name)) {
                    world.players[name].joins++;
                    if (!world.players[name].ips.includes(ip)) {
                        world.players[name].ips.push(ip);
                    }
                } else {
                    world.players[name] = { joins: 1, ips: [ip] };
                }
                world.players[name].ip = ip;

                storage.set('mb_players', world.players);

                if (!world.online.includes(name)) {
                    world.online.push(name);
                }

                ui.addMessageToConsole(name + " (" + ip + ") has joined the server", 'SERVER', 'join world admin');
            });
            hook.listen('world.leave', function handlePlayerLeave(name) {
                if (world.online.includes(name)) {
                    world.online.splice(world.online.indexOf(name), 1);
                }

                ui.addMessageToConsole(name + " has left the server", 'SERVER', "leave world admin");
            });

            hook.listen('world.command', function (name, command, target) {
                target = target.toLocaleUpperCase();
                command = command.toLocaleLowerCase();

                if (!bot.checkGroup('admin', name)) {
                    return;
                }

                var lists = world.lists;
                if (['admin', 'unadmin', 'mod', 'unmod'].includes(command)) {
                    if (command.startsWith('un')) {
                        command = command.substr(2);
                        if (lists[command].includes(target)) {
                            lists[command].splice(lists[command].indexOf(target), 1);
                        }
                    } else {
                        if (!lists[command].includes(target)) {
                            lists[command].push(target);
                        }
                    }

                    lists.mod = lists.mod.filter(function (name) {
                        return lists.admin.indexOf(name) < 0;
                    });
                    lists.staff = lists.admin.concat(lists.mod);
                }

                if (['whitelist', 'unwhitelist'].includes(command)) {
                    if (command.startsWith('un')) {
                        if (lists.white.includes(target)) {
                            lists.white.splice(lists.white.indexOf(target), 1);
                        }
                    } else {
                        if (!lists.white.includes(target)) {
                            lists.white.push(target);
                        }
                    }
                }

                if (['ban', 'unban'].includes(command)) {
                    if (command.startsWith('un')) {
                        if (lists.black.includes(target)) {
                            lists.black.splice(lists.black.indexOf(target), 1);
                        }
                    } else {
                        if (!lists.black.includes(target)) {
                            lists.black.push(target);
                        }
                    }
                }
            });

            hook.listen('ui.messageChanged', saveConfig);
            hook.listen('ui.messageDeleted', saveConfig);
            function saveConfig() {
                function saveFromWrapper(id, to, key) {
                    to.length = 0;

                    var wrappers = document.getElementById(id).children;
                    var selects,
                        joinCounts,
                        tmpMsgObj = {};
                    for (var i = 0; i < wrappers.length; i++) {
                        tmpMsgObj.message = wrappers[i].querySelector('.m').value;
                        if (id != 'aMsgs') {
                            selects = wrappers[i].querySelectorAll('select');
                            joinCounts = wrappers[i].querySelectorAll('input[type="number"]');
                            tmpMsgObj.group = selects[0].value;
                            tmpMsgObj.not_group = selects[1].value;
                            tmpMsgObj.joins_low = joinCounts[0].value;
                            tmpMsgObj.joins_high = joinCounts[1].value;
                        }
                        if (id == 'tMsgs') {
                            if (bot.preferences.disableTrim) {
                                tmpMsgObj.trigger = wrappers[i].querySelector('.t').value;
                            } else {
                                tmpMsgObj.trigger = wrappers[i].querySelector('.t').value.trim();
                            }
                        }
                        to.push(tmpMsgObj);
                        tmpMsgObj = {};
                    }

                    storage.set(key, to);
                }

                saveFromWrapper('lMsgs', messages.leave, 'leaveArr');
                saveFromWrapper('jMsgs', messages.join, 'joinArr');
                saveFromWrapper('tMsgs', messages.trigger, 'triggerArr');
                saveFromWrapper('aMsgs', messages.announcement, 'announcementArr');

                storage.set('mb_version', bot.version, false);
            }

            function userSend(message) {
                var input = document.querySelector('#mb_console input');
                var button = document.querySelector('#mb_console button');
                button.textContent = 'SEND';
                [input, button].forEach(function (el) {
                    return el.disabled = true;
                });

                message = hook.update('bot.send', message);

                api.send(message).then(function (response) {
                    if (response.status == 'ok') {
                        input.value = '';
                    } else {
                        button.textContent = 'RETRY';
                        throw new Error(JSON.stringify(response));
                    }
                }).catch(function () {}).then(function () {
                    [input, button].forEach(function (el) {
                        return el.disabled = false;
                    });
                    if (document.querySelector('#mb_console.visible')) {
                        input.focus();
                    }
                });
            }

            document.querySelector('#mb_console input').addEventListener('keydown', function (event) {
                if (event.key == "Enter" || event.keyCode == 13) {
                    event.preventDefault();
                    userSend(event.target.value);
                }
            });
            document.querySelector('#mb_console button').addEventListener('click', function () {
                userSend(document.querySelector('#mb_console input').value);
            });

            hook.listen('ui.prefChanged', function savePrefs() {
                var getValue = function getValue(selector) {
                    return document.querySelector(selector).value;
                };
                var getChecked = function getChecked(selector) {
                    return document.querySelector(selector).checked;
                };

                var prefs = bot.preferences;
                prefs.announcementDelay = +getValue('#mb_ann_delay');
                prefs.maxResponses = +getValue('#mb_resp_max');
                prefs.regexTriggers = getChecked('#mb_regex_triggers');
                prefs.disableTrim = getChecked('#mb_disable_trim');
                prefs.notify = getChecked('#mb_notify_message');

                storage.set('mb_preferences', prefs, false);
            });

            (function () {
                var sendOK = false;
                setTimeout(function waitForMessages() {
                    sendOK = true;
                }, 10000);

                function checkJoinsAndGroup(message, name) {
                    if (!sendOK) {
                        return false;
                    }

                    if (!world.players.hasOwnProperty(name)) {
                        return false;
                    }

                    var current = world.players[name].joins;

                    var joinsOK = message.joins_low <= current && message.joins_high >= current;
                    var groupOK = bot.checkGroup(message.group, name) && !bot.checkGroup(message.not_group, name);

                    return joinsOK && groupOK;
                }

                function buildMessage(message, name) {
                    message = message.replace(/{{NAME}}/g, name).replace(/{{Name}}/g, name[0] + name.substring(1).toLocaleLowerCase()).replace(/{{name}}/g, name.toLocaleLowerCase());

                    if (message.startsWith('/')) {
                        message = message.replace(/{{ip}}/gi, world.players[name].ip);
                    }

                    return message;
                }

                hook.listen('world.join', function onJoin(name) {
                    messages.join.forEach(function (msg) {
                        if (checkJoinsAndGroup(msg, name)) {
                            bot.send(buildMessage(msg.message, name));
                        }
                    });
                });

                hook.listen('world.leave', function onLeave(name) {
                    messages.leave.forEach(function (msg) {
                        if (checkJoinsAndGroup(msg, name)) {
                            bot.send(buildMessage(msg.message, name));
                        }
                    });
                });

                hook.listen('world.message', function onTrigger(name, message) {
                    function triggerMatch(trigger, message) {
                        if (bot.preferences.regexTriggers) {
                            try {
                                return new RegExp(trigger, 'i').test(message);
                            } catch (e) {
                                ui.notify("Skipping trigger '" + trigger + "' as the RegEx is invaild.");
                                return false;
                            }
                        }
                        return new RegExp(trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*"), 'i').test(message);
                    }

                    var totalAllowed = bot.preferences.maxResponses;
                    messages.trigger.forEach(function (msg) {
                        if (checkJoinsAndGroup(msg, name) && triggerMatch(msg.trigger, message) && totalAllowed) {
                            bot.send(buildMessage(msg.message, name));
                            totalAllowed--;
                        }
                    });
                });

                hook.listen('bot.usersend', function handleWhitespace(message) {
                    return message.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
                });

                hook.listen('world.message', function chatNotifications(name, message) {
                    if (bot.preferences.notify && document.querySelector('#mb_console.visible') === null) {
                        bot.ui.notify(name + ": " + message);
                    }
                });
            })();

            bot.checkGroup = function checkGroup(group, name) {
                name = name.toLocaleUpperCase();
                switch (group.toLocaleLowerCase()) {
                    case 'all':
                        return true;
                    case 'admin':
                        return world.lists.admin.includes(name);
                    case 'mod':
                        return world.lists.mod.includes(name);
                    case 'staff':
                        return world.lists.staff.includes(name);
                    case 'owner':
                        return world.owner == name;
                    default:
                        return false;
                }
            };

            return bot;
        }
    }, {}], 2: [function (require, module, exports) {
        var bot = require('./MessageBot');
        var ui = require('./ui');
        var storage = require('./libs/storage');
        var ajax = require('./libs/ajax');
        var api = require('./libs/blockheads');
        var hook = require('./libs/hook');

        var STORAGE_ID = 'mb_extensions';

        function MessageBotExtension(namespace) {
            hook.fire('extension.installed', namespace);

            var extension = {
                id: namespace,
                bot: bot,
                ui: ui,
                storage: storage,
                ajax: ajax,
                api: api,
                hook: hook
            };

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

            hook.fire('extension.uninstall', id);
        };

        storage.getObject(STORAGE_ID, [], false).forEach(MessageBotExtension.install);

        var autoload = [];

        module.exports = MessageBotExtension;
    }, { "./MessageBot": 1, "./libs/ajax": 3, "./libs/blockheads": 5, "./libs/hook": 6, "./libs/storage": 8, "./ui": 13 }], 3: [function (require, module, exports) {

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
    }, {}], 4: [function (require, module, exports) {

        var ui = require('../ui');
        var ajax = require('./ajax');

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
    }, { "../ui": 13, "./ajax": 3 }], 5: [function (require, module, exports) {
        var ajax = require('./ajax');
        var hook = require('./hook');
        var bhfansapi = require('./bhfansapi');

        var worldId = window.worldId;
        checkChat();

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

        var cache = {
            firstId: 0
        };

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
                            switch (response.worldStarted) {
                                case 'online':
                                    return resolve();
                                case 'offline':
                                    ajax.postJSON('/api', { command: 'start', worldId: worldId }).then(check, check);
                                    break;
                                case 'unavailible':
                                    return reject('World unavailible.');
                                case 'startup':
                                case 'shutdown':
                                    setTimeout(check, 3000);
                                    if (++fails > 10) {
                                        return reject('World took too long to start.');
                                    }
                                    break;
                                default:
                                    return reject('Unknown response.');
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
    }, { "./ajax": 3, "./bhfansapi": 4, "./hook": 6 }], 6: [function (require, module, exports) {
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
    }, {}], 7: [function (require, module, exports) {
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
    }, {}], 8: [function (require, module, exports) {
        module.exports = {
            getString: getString,
            getObject: getObject,
            set: set,
            clearNamespace: clearNamespace
        };

        var NAMESPACE = window.worldId;

        function getString(key, fallback) {
            var local = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

            var result;
            if (local) {
                result = localStorage.getItem("" + key + NAMESPACE);
            } else {
                result = localStorage.getItem(key);
            }

            return result === null ? fallback : result;
        }

        function getObject(key, fallback) {
            var local = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

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
            var local = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

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
    }, {}], 9: [function (require, module, exports) {
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
    }, {}], 10: [function (require, module, exports) {
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
    }, {}], 11: [function (require, module, exports) {

        window.pollChat = function () {};

        require('./polyfills/console');
        require('./libs/migration');

        var ui = require('./ui');

        "function MessageBot(ajax, hook, storage, bhfansapi, api, ui) { //jshint ignore:line\r\n    //Helps avoid messages that are tacked onto the end of other messages.\r\n    var chatBuffer = [];\r\n    (function checkBuffer() {\r\n        if (chatBuffer.length) {\r\n            api.send(chatBuffer.shift())\r\n                .then(() => setTimeout(checkBuffer, 500));\r\n        } else {\r\n            setTimeout(checkBuffer, 500);\r\n        }\r\n    }());\r\n\r\n    setTimeout(function() {\r\n        bhfansapi.listExtensions();\r\n        hook.listen('error', bhfansapi.reportError);\r\n        storage.getObject('mb_extensions', [], false).forEach(bhfansapi.startExtension);\r\n    }, 1000);\r\n\r\n    var bot = {\r\n        version: '6.0.6',\r\n        ui: ui,\r\n        api: api,\r\n        hook: hook,\r\n        storage: storage,\r\n        preferences: storage.getObject('mb_preferences', {}, false),\r\n    };\r\n    storage.set('mb_version', bot.version, false);\r\n\r\n    bot.send = function send(message) {\r\n        chatBuffer.push(hook.update('bot.send', message));\r\n    };\r\n\r\n    var world = {\r\n        name: '',\r\n        online: [],\r\n        owner: '',\r\n        players: storage.getObject('mb_players', {}),\r\n        lists: {admin: [], mod: [], staff: [], black: [], white: []},\r\n    };\r\n    bot.world = world;\r\n\r\n    var messages = {\r\n        announcement: storage.getObject('announcementArr', []),\r\n        trigger: storage.getObject('triggerArr', []),\r\n        join: storage.getObject('joinArr', []),\r\n        leave: storage.getObject('leaveArr', []),\r\n    };\r\n\r\n    //Update the world object.\r\n    Promise.all([api.getLists(), api.getWorldName(), api.getOwnerName()])\r\n        .then((values) => {\r\n            var [lists, worldName, owner] = values;\r\n\r\n            //Remove the owner & SERVER from the mod lists and add to admin / staff lists.\r\n            [owner, 'SERVER'].forEach(name => {\r\n                if (!lists.admin.includes(name)) {\r\n                    lists.admin.push(name);\r\n                }\r\n                if (!lists.staff.includes(name)) {\r\n                    lists.staff.push(name);\r\n                }\r\n                if (lists.mod.includes(name)) {\r\n                    lists.mod.splice(lists.mod.indexOf(name), 1);\r\n                }\r\n            });\r\n\r\n            world.lists = lists;\r\n            world.name = worldName;\r\n            world.owner = owner;\r\n        })\r\n        .catch(bhfansapi.reportError);\r\n\r\n    //Update the players object\r\n    Promise.all([api.getLogs(), api.getWorldName()])\r\n        .then((values) => {\r\n            var [log, worldName] = values;\r\n            var last = storage.getObject('mb_lastLogLoad', 0);\r\n            storage.set('mb_lastLogLoad', Math.floor(Date.now().valueOf()));\r\n\r\n            log.forEach(line => {\r\n                var time = new Date(line.substring(0, line.indexOf('b')));\r\n                var message = line.substring(line.indexOf(']') + 2);\r\n\r\n                if (time < last) {\r\n                    return;\r\n                }\r\n\r\n                if (message.startsWith(`${worldName} - Player Connected `)) {\r\n                    var parts = line.substr(line.indexOf(' - Player Connected ') + 20); //NAME | IP | ID\r\n                    parts = parts.substr(0, parts.lastIndexOf(' | ')); //NAME | IP\r\n                    var name = parts.substr(0, parts.lastIndexOf(' | '));\r\n                    var ip = parts.substr(name.length + 3);\r\n\r\n                    if (world.players[name]) {\r\n                        world.players[name].joins++;\r\n                        if (!world.players[name].ips.includes(ip)) {\r\n                            world.players[name].ips.push(ip);\r\n                        }\r\n                    } else {\r\n                        world.players[name] = {joins: 1, ips: [ip]};\r\n                    }\r\n                    world.players[name].ip = ip;\r\n                }\r\n            });\r\n        })\r\n        .then(() => storage.set('mb_players', world.players))\r\n        .catch(bhfansapi.reportError);\r\n\r\n    //Handle default / missing preferences\r\n    (function(prefs) {\r\n        function checkPref(type, name, selector, defval) {\r\n            if (typeof prefs[name] != type) {\r\n                prefs[name] = defval;\r\n            }\r\n\r\n            if (type == 'boolean') {\r\n                document.querySelector(selector).checked = prefs[name] ? 'checked' : '';\r\n            } else {\r\n                document.querySelector(selector).value = prefs[name];\r\n            }\r\n\r\n        }\r\n\r\n        checkPref('number', 'announcementDelay', '#mb_ann_delay', 10);\r\n        checkPref('number', 'maxResponses', '#mb_resp_max', 2);\r\n        checkPref('boolean', 'regexTriggers', '#mb_regex_triggers', false);\r\n        checkPref('boolean', 'disableTrim', '#mb_disable_trim', false);\r\n        checkPref('boolean', 'notify', '#mb_notify_message', true);\r\n    }(bot.preferences));\r\n\r\n    //Add the configured messages to the page.\r\n    (function(msgs, ids, tids) {\r\n        msgs.forEach((type, index) => {\r\n            messages[type].forEach((msg) => {\r\n                ui.addMsg(`#${tids[index]}`, `#${ids[index]}`, msg);\r\n            });\r\n        });\r\n    }(\r\n        ['join', 'leave', 'trigger', 'announcement'],\r\n        ['jMsgs', 'lMsgs', 'tMsgs', 'aMsgs'],\r\n        ['jlTemplate', 'jlTemplate', 'tTemplate', 'aTemplate']\r\n    ));\r\n\r\n    // Sends announcements after the specified delay.\r\n    (function announcementCheck(i) {\r\n        i = (i >= messages.announcement.length) ? 0 : i;\r\n\r\n        var ann = messages.announcement[i];\r\n\r\n        if (ann && ann.message) {\r\n            bot.send(ann.message);\r\n        }\r\n        setTimeout(announcementCheck, bot.preferences.announcementDelay * 60000, i + 1);\r\n    })(0);\r\n\r\n    //Add messages to page\r\n    hook.listen('world.other', function(message) {\r\n        ui.addMessageToConsole(message, undefined, 'other');\r\n    });\r\n    hook.listen('world.message', function(name, message) {\r\n        let msgClass = 'player';\r\n        if (bot.checkGroup('staff', name)) {\r\n            msgClass = 'staff';\r\n            if (bot.checkGroup('mod', name)) {\r\n                msgClass += ' mod';\r\n            } else {\r\n                //Has to be admin\r\n                msgClass += ' admin';\r\n            }\r\n        }\r\n        if (message.startsWith('/')) {\r\n            msgClass += ' command';\r\n        }\r\n        ui.addMessageToConsole(message, name, msgClass);\r\n    });\r\n    hook.listen('world.serverchat', function(message) {\r\n        ui.addMessageToConsole(message, 'SERVER', 'admin');\r\n    });\r\n    hook.listen('world.send', function(message) {\r\n        if (message.startsWith('/')) {\r\n            ui.addMessageToConsole(message, 'SERVER', 'admin command');\r\n        }\r\n    });\r\n\r\n    //Message handlers\r\n    hook.listen('world.join', function handlePlayerJoin(name, ip) {\r\n        //Add / update lists\r\n        if (world.players.hasOwnProperty(name)) {\r\n            //Returning player\r\n            world.players[name].joins++;\r\n            if (!world.players[name].ips.includes(ip)) {\r\n                world.players[name].ips.push(ip);\r\n            }\r\n        } else {\r\n            //New player\r\n            world.players[name] = {joins: 1, ips: [ip]};\r\n        }\r\n        world.players[name].ip = ip;\r\n\r\n        storage.set('mb_players', world.players);\r\n\r\n        if (!world.online.includes(name)) {\r\n            world.online.push(name);\r\n        }\r\n\r\n        ui.addMessageToConsole(`${name} (${ip}) has joined the server`, 'SERVER', 'join world admin');\r\n    });\r\n    hook.listen('world.leave', function handlePlayerLeave(name) {\r\n        if (world.online.includes(name)) {\r\n            world.online.splice(world.online.indexOf(name), 1);\r\n        }\r\n\r\n        ui.addMessageToConsole(`${name} has left the server`, 'SERVER', `leave world admin`);\r\n    });\r\n\r\n    //Update the staff lists if needed\r\n    hook.listen('world.command', function(name, command, target) {\r\n        target = target.toLocaleUpperCase();\r\n        command = command.toLocaleLowerCase();\r\n\r\n        if (!bot.checkGroup('admin', name)) {\r\n            return;\r\n        }\r\n\r\n        var lists = world.lists;\r\n        if (['admin', 'unadmin', 'mod', 'unmod'].includes(command)) {\r\n            if (command.startsWith('un')) {\r\n                command = command.substr(2);\r\n                if (lists[command].includes(target)) {\r\n                    lists[command].splice(lists[command].indexOf(target), 1);\r\n                }\r\n            } else {\r\n                if (!lists[command].includes(target)) {\r\n                    lists[command].push(target);\r\n                }\r\n            }\r\n\r\n            //Rebuild the staff lists\r\n            lists.mod = lists.mod.filter((name) => lists.admin.indexOf(name) < 0);\r\n            lists.staff = lists.admin.concat(lists.mod);\r\n        }\r\n\r\n        if (['whitelist', 'unwhitelist'].includes(command)) {\r\n            if (command.startsWith('un')) {\r\n                if (lists.white.includes(target)) {\r\n                    lists.white.splice(lists.white.indexOf(target), 1);\r\n                }\r\n            } else {\r\n                if (!lists.white.includes(target)) {\r\n                    lists.white.push(target);\r\n                }\r\n            }\r\n        }\r\n\r\n        if (['ban', 'unban'].includes(command)) {\r\n            //FIXME: Support needed for device IDs.\r\n            if (command.startsWith('un')) {\r\n                if (lists.black.includes(target)) {\r\n                    lists.black.splice(lists.black.indexOf(target), 1);\r\n                }\r\n            } else {\r\n                if (!lists.black.includes(target)) {\r\n                    lists.black.push(target);\r\n                }\r\n            }\r\n        }\r\n    });\r\n\r\n    //Handle changed messages\r\n    hook.listen('ui.messageChanged', saveConfig);\r\n    hook.listen('ui.messageDeleted', saveConfig);\r\n    function saveConfig() {\r\n        function saveFromWrapper(id, to, key) {\r\n            to.length = 0;\r\n\r\n            var wrappers = document.getElementById(id).children;\r\n            var selects,\r\n                joinCounts,\r\n                tmpMsgObj = {};\r\n            for (var i = 0; i < wrappers.length; i++) {\r\n                tmpMsgObj.message = wrappers[i].querySelector('.m').value;\r\n                if (id != 'aMsgs') {\r\n                    selects = wrappers[i].querySelectorAll('select');\r\n                    joinCounts = wrappers[i].querySelectorAll('input[type=\"number\"]');\r\n                    tmpMsgObj.group = selects[0].value;\r\n                    tmpMsgObj.not_group = selects[1].value;\r\n                    tmpMsgObj.joins_low = joinCounts[0].value;\r\n                    tmpMsgObj.joins_high = joinCounts[1].value;\r\n                }\r\n                if (id == 'tMsgs') {\r\n                    if (bot.preferences.disableTrim) {\r\n                        tmpMsgObj.trigger = wrappers[i].querySelector('.t').value;\r\n                    } else {\r\n                        tmpMsgObj.trigger = wrappers[i].querySelector('.t').value.trim();\r\n                    }\r\n                }\r\n                to.push(tmpMsgObj);\r\n                tmpMsgObj = {};\r\n            }\r\n\r\n            storage.set(key, to);\r\n        }\r\n\r\n        saveFromWrapper('lMsgs', messages.leave, 'leaveArr');\r\n        saveFromWrapper('jMsgs', messages.join, 'joinArr');\r\n        saveFromWrapper('tMsgs', messages.trigger, 'triggerArr');\r\n        saveFromWrapper('aMsgs', messages.announcement, 'announcementArr');\r\n\r\n        storage.set('mb_version', bot.version, false);\r\n    }\r\n\r\n    //Handle user messages\r\n    function userSend(message) {\r\n        var input = document.querySelector('#mb_console input');\r\n        var button = document.querySelector('#mb_console button');\r\n        button.textContent = 'SEND';\r\n        [input, button].forEach((el) => el.disabled = true);\r\n\r\n        message = hook.update('bot.send', message);\r\n\r\n        // Don't add user messages to the buffer.\r\n        api.send(message)\r\n            .then((response) => {\r\n                if (response.status == 'ok') {\r\n                    input.value = '';\r\n\r\n                } else {\r\n                    button.textContent = 'RETRY';\r\n                    throw new Error(JSON.stringify(response));\r\n                }\r\n            })\r\n            .catch(() => { /* Nothing */ })\r\n            .then(() => {\r\n                [input, button].forEach((el) => el.disabled = false);\r\n                if (document.querySelector('#mb_console.visible')) {\r\n                    input.focus();\r\n                }\r\n            });\r\n    }\r\n\r\n    //Listen for user to send message\r\n    document.querySelector('#mb_console input').addEventListener('keydown', function(event) {\r\n        if (event.key == \"Enter\" || event.keyCode == 13) {\r\n            event.preventDefault();\r\n            userSend(event.target.value);\r\n        }\r\n    });\r\n    document.querySelector('#mb_console button').addEventListener('click', function() {\r\n        userSend(document.querySelector('#mb_console input').value);\r\n    });\r\n\r\n    hook.listen('ui.prefChanged', function savePrefs() {\r\n        var getValue = (selector) => document.querySelector(selector).value;\r\n        var getChecked = (selector) => document.querySelector(selector).checked;\r\n\r\n        var prefs = bot.preferences;\r\n        prefs.announcementDelay = +getValue('#mb_ann_delay');\r\n        prefs.maxResponses = +getValue('#mb_resp_max');\r\n        prefs.regexTriggers = getChecked('#mb_regex_triggers');\r\n        prefs.disableTrim = getChecked('#mb_disable_trim');\r\n        prefs.notify = getChecked('#mb_notify_message');\r\n\r\n        storage.set('mb_preferences', prefs, false);\r\n    });\r\n\r\n    //Handle user defined messages.\r\n    (function() {\r\n        var sendOK = false;\r\n        setTimeout(function waitForMessages() {\r\n            //Wait for a while before responding to triggers, avoids massive bot spams\r\n            sendOK = true;\r\n        }, 10000);\r\n\r\n        function checkJoinsAndGroup(message, name) {\r\n            if (!sendOK) {\r\n                return false;\r\n            }\r\n\r\n            if (!world.players.hasOwnProperty(name)) {\r\n                return false;\r\n            }\r\n\r\n            var current = world.players[name].joins;\r\n\r\n            var joinsOK = message.joins_low <= current && message.joins_high >= current;\r\n            var groupOK = bot.checkGroup(message.group, name) && !bot.checkGroup(message.not_group, name);\r\n\r\n            return joinsOK && groupOK;\r\n        }\r\n\r\n        function buildMessage(message, name) {\r\n            message = message.replace(/{{NAME}}/g, name)\r\n                .replace(/{{Name}}/g, name[0] + name.substring(1).toLocaleLowerCase())\r\n                .replace(/{{name}}/g, name.toLocaleLowerCase());\r\n\r\n            if (message.startsWith('/')) {\r\n                message = message.replace(/{{ip}}/gi, world.players[name].ip);\r\n            }\r\n\r\n            return message;\r\n        }\r\n\r\n        hook.listen('world.join', function onJoin(name) {\r\n            messages.join.forEach((msg) => {\r\n                if (checkJoinsAndGroup(msg, name)) {\r\n                    bot.send(buildMessage(msg.message, name));\r\n                }\r\n            });\r\n        });\r\n\r\n        hook.listen('world.leave', function onLeave(name) {\r\n            messages.leave.forEach((msg) => {\r\n                if (checkJoinsAndGroup(msg, name)) {\r\n                    bot.send(buildMessage(msg.message, name));\r\n                }\r\n            });\r\n        });\r\n\r\n        hook.listen('world.message', function onTrigger(name, message) {\r\n            function triggerMatch(trigger, message) {\r\n                if (bot.preferences.regexTriggers) {\r\n                    try {\r\n                        return new RegExp(trigger, 'i').test(message);\r\n                    } catch (e) {\r\n                        ui.notify(`Skipping trigger '${trigger}' as the RegEx is invaild.`);\r\n                        return false;\r\n                    }\r\n                }\r\n                return new RegExp(\r\n                    trigger\r\n                        .replace(/([.+?^=!:${}()|\\[\\]\\/\\\\])/g, \"\\\\$1\")\r\n                        .replace(/\\*/g, \".*\"),\r\n                        'i'\r\n                    ).test(message);\r\n            }\r\n\r\n            var totalAllowed = bot.preferences.maxResponses;\r\n            messages.trigger.forEach((msg) => {\r\n                if (checkJoinsAndGroup(msg, name) && triggerMatch(msg.trigger, message) && totalAllowed) {\r\n                    bot.send(buildMessage(msg.message, name));\r\n                    totalAllowed--;\r\n                }\r\n            });\r\n        });\r\n\r\n        hook.listen('bot.usersend', function handleWhitespace(message) {\r\n            return message.replace(/\\\\n/g, '\\n').replace(/\\\\t/g, '\\t');\r\n        });\r\n\r\n        hook.listen('world.message', function chatNotifications(name, message) {\r\n            if (bot.preferences.notify && document.querySelector('#mb_console.visible') === null) {\r\n                bot.ui.notify(`${name}: ${message}`);\r\n            }\r\n        });\r\n    }());\r\n\r\n    /**\r\n     * Function used to check if users are in defined groups.\r\n     *\r\n     * @param string group the group to check\r\n     * @param string name the name of the user to check\r\n     * @return boolean\r\n     */\r\n    bot.checkGroup = function checkGroup(group, name) {\r\n        name = name.toLocaleUpperCase();\r\n        switch (group.toLocaleLowerCase()) {\r\n            case 'all':\r\n                return true;\r\n            case 'admin':\r\n                return world.lists.admin.includes(name);\r\n            case 'mod':\r\n                return world.lists.mod.includes(name);\r\n            case 'staff':\r\n                return world.lists.staff.includes(name);\r\n            case 'owner':\r\n                return world.owner == name;\r\n            default:\r\n                return false;\r\n        }\r\n    };\r\n\r\n    return bot;\r\n}\r\n";
        "var bot = require('./MessageBot');\r\nvar ui = require('./ui');\r\nvar storage = require('./libs/storage');\r\nvar ajax = require('./libs/ajax');\r\nvar api = require('./libs/blockheads');\r\nvar hook = require('./libs/hook');\r\n\r\nconst STORAGE_ID = 'mb_extensions';\r\n\r\n/**\r\n * Used to create a new extension.\r\n *\r\n * @example\r\n * var test = MessageBotExtension('test');\r\n * @param {string} namespace - Should be the same as your variable name.\r\n * @return {MessageBotExtension} - The extension variable.\r\n */\r\nfunction MessageBotExtension(namespace) {\r\n    hook.fire('extension.installed', namespace);\r\n\r\n    var extension = {\r\n        id: namespace,\r\n        bot,\r\n        ui,\r\n        storage,\r\n        ajax,\r\n        api,\r\n        hook,\r\n    };\r\n\r\n    /**\r\n     * Used to change whether or not the extension will be\r\n     * Automatically loaded the next time the bot is launched.\r\n     *\r\n     * @example\r\n     * var test = MessageBotExtension('test');\r\n     * test.setAutoLaunch(true);\r\n     * @param {bool} shouldAutoload\r\n     */\r\n    extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {\r\n        if (!autoload.includes(namespace) && shouldAutoload) {\r\n            autoload.push(namespace);\r\n            storage.set(STORAGE_ID, autoload, false);\r\n        } else if (!shouldAutoload) {\r\n            if (autoload.includes(namespace)) {\r\n                autoload.splice(autoload.indexOf(namespace), 1);\r\n                storage.set(STORAGE_ID, autoload, false);\r\n            }\r\n        }\r\n    };\r\n\r\n    return extension;\r\n}\r\n\r\n/**\r\n * Tries to load the requested extension by ID.\r\n *\r\n * @param {string} id\r\n */\r\nMessageBotExtension.install = function install(id) {\r\n    var el = document.createElement('script');\r\n    el.src = `//blockheadsfans.com/messagebot/extension/${id}/code/raw`;\r\n    el.crossOrigin = 'anonymous';\r\n    document.head.appendChild(el);\r\n};\r\n\r\n/**\r\n * Uninstalls an extension.\r\n *\r\n * @param {string} id\r\n */\r\nMessageBotExtension.uninstall = function uninstall(id) {\r\n    try {\r\n        window[id].uninstall();\r\n    } catch (e) {\r\n        //Not installed, or no uninstall function.\r\n    }\r\n\r\n    window[id] = undefined;\r\n\r\n    if (autoload.includes(id)) {\r\n        autoload.splice(autoload.indexOf(id), 1);\r\n        storage.set(STORAGE_ID, autoload, false);\r\n    }\r\n\r\n    hook.fire('extension.uninstall', id);\r\n};\r\n\r\n// Load extensions that set themselves to autoload last launch.\r\nstorage.getObject(STORAGE_ID, [], false).forEach(MessageBotExtension.install);\r\n\r\n// Array of IDs to autolaod at the next launch.\r\nvar autoload = [];\r\n\r\nmodule.exports = MessageBotExtension;\r\n";

        window.addEventListener('error', function (err) {
            if (err.message != 'Script error') {
                window.hook.check('error', err);
            }
        });
    }, { "./libs/migration": 7, "./polyfills/console": 9, "./ui": 13 }], 12: [function (require, module, exports) {
        var paths = ['./alert', './notify', './template', './navigation', './console'];

        paths.forEach(function (path) {
            Object.assign(module.exports, require(path));
        });
    }, {}], 13: [function (require, module, exports) {
        module.exports = require('./exports');

        require('./page');
        require('./listeners');
    }, { "./exports": 12, "./listeners": 14, "./page": 16 }], 14: [function (require, module, exports) {


        new MutationObserver(function showNewChat() {
            var container = document.querySelector('#mb_console ul');
            var lastLine = document.querySelector('#mb_console li:last-child');

            if (!container || !lastLine) {
                return;
            }

            if (container.scrollHeight - container.clientHeight - container.scrollTop <= lastLine.clientHeight * 2) {
                lastLine.scrollIntoView(false);
            }
        }).observe(document.querySelector('#mb_console chat'), { childList: true });

        new MutationObserver(function removeOldChat() {
            var chat = document.querySelector('#mb_console ul');

            while (chat.children.length > 500) {
                chat.children[0].remove();
            }
        }).observe(document.querySelector('#mb_console chat'), { childList: true });

        document.querySelector('#leftNav').addEventListener('click', function globalTabChange(event) {
            var tabName = event.target.dataset.tabName;
            if (!tabName) {
                return;
            }

            Array.from(document.querySelectorAll('#container > .visible')).forEach(function (el) {
                return el.classList.remove('visible');
            });
            document.querySelector("#container > [data-tab-name=" + tabName + "]").classList.add('visible');

            Array.from(document.querySelector('#leftNav .selected')).forEach(function (el) {
                return el.classList.remove('selected');
            });
            event.target.classList.add('selected');
        });


        var ui = require('./exports');

        document.querySelector('#leftNav .overlay').addEventListener('click', ui.toggleMenu);
    }, { "./exports": 12 }], 15: [function (require, module, exports) {
        var bhfansapi = require('../../libs/bhfansapi');
        var ui = require('../exports');
        var hook = require('../../libs/hook');
        var MessageBotExtension = require('../../MessageBotExtension');

        bhfansapi.getStore().then(function (resp) {
            if (resp.status != 'ok') {
                document.getElementById('exts').innerHTML += resp.message;
                throw new Error(resp.message);
            }
            resp.extensions.forEach(function (extension) {
                ui.buildContentFromTemplate('#extTemplate', '#exts', [{ selector: 'h4', text: extension.title }, { selector: 'span', html: extension.snippet }, { selector: '.ext', 'data-id': extension.id }, { selector: 'button', text: bhfansapi.extensionInstalled(extension.id) ? 'Remove' : 'Install' }]);
            });
        }).catch(bhfansapi.reportError);

        function extActions(tagName, e) {
            if (e.target.tagName != tagName) {
                return;
            }
            var el = e.target;
            var id = el.parentElement.dataset.id;

            if (el.textContent == 'Install') {
                MessageBotExtension.install(id);
            } else {
                MessageBotExtension.uninstall(id);
            }
        }

        document.querySelector('#exts').addEventListener('click', extActions.bind(null, 'BUTTON'));

        document.querySelector('#mb_ext_list').addEventListener('click', extActions.bind(null, 'A'));

        hook.on('extension.installed', function (id) {
            bhfansapi.getExtensionName(id).then(function (resp) {
                var container = document.querySelector('#mb_ext_list ul');
                if (resp.status != 'ok') {
                    throw new Error(resp.message);
                }

                var li = document.createElement('li');
                var span = document.createElement('span');
                var a = document.createElement('a');

                span.textContent = resp.name + " (" + resp.id + ")";
                a.textContent = 'Remove';
                li.dataset.id = resp.id;

                li.appendChild(span);
                li.appendChild(a);
                container.appendChild(li);
            }).catch(bhfansapi.reportError);

            var button = document.querySelector("#mb_extensions [data-id=\"" + id + "\"] button");
            if (button) {
                button.textContent = 'Remove';
            }
        });

        hook.on('extension.uninstalled', function (id) {
            var li = document.querySelector("#mb_ext_list [data-id=\"" + id + "\"]");
            if (li) {
                li.remove();
            }

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
    }, { "../../MessageBotExtension": 2, "../../libs/bhfansapi": 4, "../../libs/hook": 6, "../exports": 12 }], 16: [function (require, module, exports) {


        document.head.innerHTML = "<title>Console - MessageBot</title> <link rel=\"icon\" href=\"http://forums.theblockheads.net/uploads/default/original/3X/b/d/bd489ba3dddafb66906af3b377069fe4a3551a3a.png\"> <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"> ";

        var s = document.createElement('style');
        s.textContent = "html,body{min-height:100vh;position:relative;width:100%;margin:0;font-family:\"Lucida Grande\",\"Lucida Sans Unicode\",Verdana,sans-serif;color:#000}textarea,input,button,select{font-family:inherit}a{cursor:pointer;color:#182b73}.overlay{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99;background:rgba(0,0,0,0.7);visibility:hidden;opacity:0;transition:opacity .5s}.overlay.visible{visibility:visible;opacity:1;transition:opacity .5s}#botTemplates{display:none}header{background:#182b73 url(\"http://portal.theblockheads.net/static/images/portalHeader.png\") no-repeat;background-position:80px;height:80px}#jMsgs,#lMsgs,#tMsgs,#aMsgs,#exts{padding-top:8px;margin-top:8px;border-top:1px solid;height:calc(100vh - 185px)}.third-box,#mb_join .msg,#mb_leave .msg,#mb_trigger .msg,#mb_announcements .msg,#mb_extensions .ext{position:relative;float:left;width:calc(33% - 19px);min-width:280px;padding:5px;margin-left:5px;margin-bottom:5px;border:3px solid #999;border-radius:10px}.third-box:nth-child(odd),#mb_join .msg:nth-child(odd),#mb_leave .msg:nth-child(odd),#mb_trigger .msg:nth-child(odd),#mb_announcements .msg:nth-child(odd),#mb_extensions .ext:nth-child(odd){background:#ccc}.top-right-button,#mb_join .add,#mb_leave .add,#mb_trigger .add,#mb_announcements .add,#mb_extensions #mb_load_man{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:10px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}.button,#mb_extensions .ext button,#alert>.buttons>span{display:inline-block;padding:6px 12px;margin:0 5px;text-align:center;white-space:nowrap;cursor:pointer;border:1px solid rgba(0,0,0,0.15);border-radius:6px;background:#fff linear-gradient(to bottom, #fff 0, #e0e0e0 100%)}#leftNav{text-transform:uppercase}#leftNav nav{width:250px;background:#182b73;color:#fff;position:fixed;left:-250px;z-index:100;top:0;bottom:0;transition:left .5s}#leftNav details,#leftNav span{display:block;text-align:center;padding:5px 7px;border-bottom:1px solid white}#leftNav .selected{background:radial-gradient(#9fafeb, #182b73)}#leftNav summary ~ span{background:rgba(159,175,235,0.4)}#leftNav summary+span{border-top-left-radius:20px;border-top-right-radius:20px}#leftNav summary ~ span:last-of-type{border:0;border-bottom-left-radius:20px;border-bottom-right-radius:20px}#leftNav input{display:none}#leftNav label{color:#fff;background:#213b9d;padding:5px;position:fixed;top:5px;z-index:100;left:5px;opacity:1;transition:left .5s,opacity .5s}#leftNav input:checked ~ nav{left:0;transition:left .5s}#leftNav input:checked ~ label{left:255px;opacity:0;transition:left .5s,opacity .5s}#leftNav input:checked ~ .overlay{visibility:visible;opacity:1;transition:opacity .5s}#container>div{height:calc(100vh - 100px);padding:10px;position:absolute;top:80px;left:0;right:0;overflow:auto}#container>div:not(.visible){display:none}#mb_console .chat{height:calc(100vh - 220px)}@media screen and (min-width: 668px){#mb_console .chat{height:calc(100vh - 155px)}}#mb_console ul{height:100%;overflow-y:auto;margin:0;padding:0}#mb_console li{list-style-type:none}#mb_console .controls{display:flex;padding:0 10px}#mb_console input,#mb_console button{margin:5px 0}#mb_console input{font-size:1em;padding:1px;flex:1;border:solid 1px #999}#mb_console button{background:#182b73;font-weight:bold;color:#fff;border:0;height:40px;padding:1px 4px}#mb_console .mod>span:first-child{color:#05f529}#mb_console .admin>span:first-child{color:#2b26bd}#mb_settings h3{border-bottom:1px solid #999}#mb_settings a{text-decoration:underline}#mb_settings a.button{text-decoration:none;font-size:0.9em;padding:1px 5px}#mb_join h3,#mb_leave h3,#mb_trigger h3,#mb_announcements h3{margin:0 0 5px 0}#mb_join input,#mb_join textarea,#mb_leave input,#mb_leave textarea,#mb_trigger input,#mb_trigger textarea,#mb_announcements input,#mb_announcements textarea{border:2px solid #666;width:calc(100% - 10px)}#mb_join textarea,#mb_leave textarea,#mb_trigger textarea,#mb_announcements textarea{resize:none;overflow:hidden;padding:1px 0;height:21px;transition:height .5s}#mb_join textarea:focus,#mb_leave textarea:focus,#mb_trigger textarea:focus,#mb_announcements textarea:focus{height:5em}#mb_join input[type=\"number\"],#mb_leave input[type=\"number\"],#mb_trigger input[type=\"number\"],#mb_announcements input[type=\"number\"]{width:5em}#mb_extensions #mb_load_man{width:inherit;padding:0 7px}#mb_extensions h3{margin:0 0 5px 0}#mb_extensions .ext{height:130px}#mb_extensions .ext h4,#mb_extensions .ext p{margin:0}#mb_extensions .ext button{position:absolute;bottom:7px;padding:5px 8px}#alert{visibility:hidden;position:fixed;top:50px;left:0;right:0;margin:auto;z-index:101;width:50%;min-width:300px;min-height:200px;background:#fff;border-radius:10px;padding:10px 10px 55px 10px}#alert.visible{visibility:visible}#alert>div{webkit-overflow-scrolling:touch;max-height:65vh;overflow-y:auto}#alert>.buttons{position:absolute;bottom:10px;left:5px}#alert>.buttons [class]{color:#fff}#alert>.buttons .success{background:#5cb85c linear-gradient(to bottom, #5cb85c 0, #419641 100%);border-color:#3e8f3e}#alert>.buttons .info{background:#5bc0de linear-gradient(to bottom, #5bc0de 0, #2aabd2 100%);border-color:#28a4c9}#alert>.buttons .danger{background:#d9534f linear-gradient(to bottom, #d9534f 0, #c12e2a 100%);border-color:#b92c28}#alert>.buttons .warning{background:#f0ad4e linear-gradient(to bottom, #f0ad4e 0, #eb9316 100%);border-color:#e38d13}.notification{opacity:0;transition:opacity 1s;position:fixed;top:1em;right:1em;min-width:200px;border-radius:5px;padding:5px;background:#9fafeb}.notification.visible{opacity:1}";
        document.head.appendChild(s);

        document.body.innerHTML = "<div id=\"leftNav\"> <input type=\"checkbox\" id=\"leftToggle\"> <label for=\"leftToggle\">&#9776; Menu</label> <nav data-tab-group=\"main\"> <span class=\"tab selected\" data-tab-name=\"console\">Console</span> <details data-tab-group=\"messages\"> <summary>Messages</summary> <span class=\"tab\" data-tab-name=\"join\">Join</span> <span class=\"tab\" data-tab-name=\"leave\">Leave</span> <span class=\"tab\" data-tab-name=\"trigger\">Trigger</span> <span class=\"tab\" data-tab-name=\"announcements\">Announcements</span> </details> <span class=\"tab\" data-tab-name=\"extensions\">Extensions</span> <span class=\"tab\" data-tab-name=\"settings\">Settings</span> <div class=\"clearfix\"> </nav> <div class=\"overlay\"></div> </div> <div id=\"botTemplates\"> <template id=\"jlTemplate\"> <div class=\"msg\"> <label>When the player is </label> <select data-target=\"group\"> <option value=\"All\">anyone</option> <option value=\"Staff\">a staff member</option> <option value=\"Mod\">a mod</option> <option value=\"Admin\">an admin</option> <option value=\"Owner\">the owner</option> </select> <label> who is not </label> <select data-target=\"not_group\"> <option value=\"Nobody\">nobody</option> <option value=\"Staff\">a staff member</option> <option value=\"Mod\">a mod</option> <option value=\"Admin\">an admin</option> <option value=\"Owner\">the owner</option> </select> <label> then say </label> <textarea class=\"m\"></textarea> <label> in chat if the player has joined between </label> <input type=\"number\" value=\"0\" data-target=\"joins_low\"> <label> and </label> <input type=\"number\" value=\"9999\" data-target=\"joins_high\"> <label> times.</label><br> <a>Delete</a> </div> </template> <template id=\"tTemplate\"> <div class=\"msg\"> <label>When </label> <select data-target=\"group\"> <option value=\"All\">anyone</option> <option value=\"Staff\">a staff member</option> <option value=\"Mod\">a mod</option> <option value=\"Admin\">an admin</option> <option value=\"Owner\">the owner</option> </select> <label> who is not </label> <select data-target=\"not_group\"> <option value=\"Nobody\">nobody</option> <option value=\"Staff\">a staff member</option> <option value=\"Mod\">a mod</option> <option value=\"Admin\">an admin</option> <option value=\"Owner\">the owner</option> </select> <label> says </label> <input class=\"t\"> <label> in chat, say </label> <textarea class=\"m\"></textarea> <label> if the player has joined between </label> <input type=\"number\" value=\"0\" data-target=\"joins_low\"> <label> and </label> <input type=\"number\" value=\"9999\" data-target=\"joins_high\"> <label>times. </label><br> <a>Delete</a> </div> </template> <template id=\"aTemplate\"> <div class=\"ann\"> <label>Send:</label> <textarea class=\"m\"></textarea> <a>Delete</a> <label style=\"display:block;margin-top:5px\">Wait X minutes...</label> </div> </template> <template id=\"extTemplate\"> <div class=\"ext\"> <h4>Title</h4> <span>Description</span><br> <button class=\"button\">Install</button> </div> </template> </div> <div id=\"container\"> <header></header> <div id=\"mb_console\" data-tab-name=\"console\" class=\"visible\"> <div class=\"chat\"> <ul></ul> </div> <div class=\"controls\"> <input type=\"text\"><button>SEND</button> </div> </div> <div id=\"mb_join\" data-tab-name=\"join\"> <h3>These are checked when a player joins the server.</h3> <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class=\"add\">+</span> <div id=\"jMsgs\"></div> </div> <div id=\"mb_leave\" data-tab-name=\"leave\"> <h3>These are checked when a player leaves the server.</h3> <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class=\"add\">+</span> <div id=\"lMsgs\"></div> </div> <div id=\"mb_trigger\" data-tab-name=\"trigger\"> <h3>These are checked whenever someone says something.</h3> <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger \"te*st\" will match \"tea stuff\" and \"test\")</span> <span class=\"add\">+</span> <div id=\"tMsgs\"></div> </div> <div id=\"mb_announcements\" data-tab-name=\"announcements\"> <h3>These are sent according to a regular schedule.</h3> <span>If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span> <span class=\"add\">+</span> <div id=\"aMsgs\"></div> </div> <div id=\"mb_extensions\" data-tab-name=\"extensions\"> <h3>Extensions can increase the functionality of the bot.</h3> <span>Interested in creating one? <a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki\" target=\"_blank\">Click here.</a></span> <span id=\"mb_load_man\">Load By ID/URL</span> <div id=\"exts\"></div> </div> <div id=\"mb_settings\" data-tab-name=\"settings\"> <h3>Settings</h3> <label for=\"mb_ann_delay\">Minutes between announcements: </label><br> <input id=\"mb_ann_delay\" type=\"number\"><br> <label for=\"mb_resp_max\">Maximum trigger responses to a message: </label><br> <input id=\"mb_resp_max\" type=\"number\"><br> <label for=\"mb_notify_message\">New chat notifications: </label> <input id=\"mb_notify_message\" type=\"checkbox\"><br> <h3>Advanced Settings</h3> <a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/Advanced-Options\" target=\"_blank\">Read this first</a><br> <label for=\"mb_disable_trim\">Disable whitespace trimming: </label> <input id=\"mb_disable_trim\" type=\"checkbox\"><br> <label for=\"mb_regex_triggers\">Parse triggers as RegEx: </label> <input id=\"mb_regex_triggers\" type=\"checkbox\"><br> <h3>Extensions</h3> <div id=\"mb_ext_list\"></div> <h3>Backup / Restore</h3> <a id=\"mb_backup_save\">Get backup code</a><br> <a id=\"mb_backup_load\">Load previous backup</a> <div id=\"mb_backup\"></div> </div> </div> <div id=\"alertWrapper\"> <div id=\"alert\"> <div id=\"alertContent\"></div> <div class=\"buttons\"></div> </div> <div class=\"overlay\"> ";

        require('../../polyfills/details');

        require('./extensions');
        require('./settings');
    }, { "../../polyfills/details": 10, "./extensions": 15, "./settings": 17 }], 17: [function (require, module, exports) {
        var ui = require('../exports');
        var MessageBotExtension = require('../../MessageBotExtension');

        document.querySelector('#mb_backup_load').addEventListener('click', function loadBackup() {
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

        document.querySelector('#mb_load_man').addEventListener('click', function loadExtension() {
            ui.alert('Enter the ID or URL of an extension:<br><input style="width:calc(100% - 7px);"/>', [{ text: 'Add', style: 'success', action: function action() {
                    var extRef = document.querySelector('#alert input').value;
                    if (extRef.length) {
                        if (extRef.startsWith('http')) {
                            var el = document.createElement('script');
                            el.src = extRef;
                            document.head.appendChild(el);
                        } else {
                            MessageBotExtension.install(extRef);
                        }
                    }
                } }, { text: 'Cancel' }]);
        });

        document.querySelector('#mb_backup_save').addEventListener('click', function showBackup() {
            var backup = JSON.stringify(localStorage).replace(/</g, '&lt;');
            ui.alert("Copy this to a safe place:<br><textarea style=\"width: calc(100% - 7px);height:160px;\">" + backup + "</textarea>");
        });
    }, { "../../MessageBotExtension": 2, "../exports": 12 }] }, {}, [11]);