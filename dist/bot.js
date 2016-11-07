'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }


window.pollChat = function () {};

if (!window.console) {
    window.console = {};
    window.log = window.log || [];
    console.log = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        window.log.push(args);
    };
}
['info', 'error', 'warn', 'assert'].forEach(function (method) {
    if (!console[method]) {
        console[method] = console.log;
    }
});

(function (storage) {
    function update(keys, operator) {
        Object.keys(storage).forEach(function (item) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var key = _step.value;

                    if (item.startsWith(key)) {
                        storage.setItem(item, operator(storage.getItem(item)));
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

    if (!storage.length) {
        return; 
    }

    switch (storage.getItem('mb_version')) {
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
    }
})(localStorage);
(function () {
    var ajax = function () {
        function urlStringify(obj) {
            return Object.keys(obj).map(function (k) {
                return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
            }).join('&');
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

        function get() {
            var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
            var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            if (Object.keys(paramObj).length) {
                var addition = urlStringify(paramObj);
                if (!url.includes('?')) {
                    url += '?' + addition;
                } else {
                    url += '&' + addition;
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

        return { xhr: xhr, get: get, getJSON: getJSON, post: post, postJSON: postJSON };
    }();

    window.ajax = ajax;
})();
(function () {
    var hook = function () {
        var listeners = {};

        function listen(key, callback) {
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
            for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
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
            for (var _len3 = arguments.length, args = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
                args[_key3 - 2] = arguments[_key3];
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

        return {
            listen: listen,
            remove: remove,
            check: check,
            update: update
        };
    }();

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = hook;
    } else {
        window.hook = hook;
    }
})();
(function () {
    var storage = function storage(worldId) {
        function getString(key, fallback) {
            var local = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

            var result;
            if (local) {
                result = localStorage.getItem('' + key + worldId);
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
                key = '' + key + worldId;
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

        return { getString: getString, getObject: getObject, set: set, clearNamespace: clearNamespace };
    };

    window.CreateStorage = storage;
})();
window.storage = CreateStorage(window.worldId);

(function () {
    function api(ajax, storage, global) {
        var cache = {
            getStore: getStore()
        };

        var extensions = [];

        function getStore() {
            return ajax.getJSON('//blockheadsfans.com/messagebot/extension/store');
        }

        var api = {};

        api.listExtensions = function () {
            return api.getExtensionNames(extensions).then(function (resp) {
                var target = document.querySelector('#mb_ext_list');
                if (resp.status == 'ok') {
                    Array.from(document.querySelectorAll('#exts button')).forEach(function (btn) {
                        return btn.textContent = 'Install';
                    });

                    resp.extensions.forEach(function (ex) {
                        var button = document.querySelector('#exts [data-id="' + ex.id + '"] button');
                        if (button) {
                            button.textContent = 'Remove';
                        }
                    });

                    if (!resp.extensions.length) {
                        target.innerHTML = '<p>No extensions installed</p>';
                        return;
                    }
                    target.innerHTML = resp.extensions.reduce(function (html, ext) {
                        return html + '<li>' + ext.name.replace(/</g, '&lt;') + ' (' + ext.id + ') <a onclick="bhfansapi.removeExtension(\'' + ext.id + '\');" class="button">Remove</a></li>';
                    }, '<ul style="margin-left:1.5em;">') + '</ul>';
                } else {
                    target.innerHTML = 'Error fetching extension names: ' + resp.message;
                    throw new Error(resp.message);
                }
            }).catch(api.reportError);
        };

        api.getExtensionNames = function (ids) {
            return ajax.postJSON('//blockheadsfans.com/messagebot/extension/name', { extensions: JSON.stringify(ids) });
        };

        api.getStore = function () {
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

            if (refresh) {
                cache.getStore = getStore();
            }
            return cache.getStore;
        };

        api.startExtension = function (id) {
            var el = document.createElement('script');
            el.src = '//blockheadsfans.com/messagebot/extension/' + id + '/code/raw';
            el.crossOrigin = 'anonymous';
            document.head.appendChild(el);
        };

        api.removeExtension = function (id) {
            try {
                global[id].uninstall();
            } catch (e) {
            }
            global[id] = undefined;

            if (extensions.includes(id)) {
                extensions.splice(extensions.indexOf(id), 1);
                storage.set('mb_extensions', extensions, false);

                var button = document.querySelector('#mb_extensions div[data-id=' + id + '] button');
                if (button !== null) {
                    button.textContent = 'Removed';
                    button.disabled = true;
                    setTimeout(function () {
                        button.textContent = 'Install';
                        button.disabled = false;
                    }, 3000);
                }
                api.listExtensions();
            }
        };

        api.extensionInstalled = function (id) {
            return extensions.includes(id) || typeof global[id] != 'undefined';
        };

        api.reportError = function (err) {
            return ajax.postJSON('//blockheadsfans.com/messagebot/bot/error', {
                error_text: err.message,
                error_file: err.filename,
                error_row: err.lineno || 0,
                error_column: err.colno || 0,
                error_stack: err.stack || ''
            }).then(function (resp) {
                if (resp.status == 'ok') {
                    global.bot.ui.notify('Something went wrong, it has been reported.');
                } else {
                    global.bot.ui.notify('Error reporting exception: ' + resp.message);
                }
            }).catch(function (err) {
                void 0;
            });
        };

        api.autoloadExtension = function (id, shouldAutoload) {
            if (!extensions.includes(id) && shouldAutoload) {
                extensions.push(id);
                api.listExtensions();
            } else if (!shouldAutoload) {
                if (extensions.includes(id)) {
                    extensions.splice(extensions.indexOf(id), 1);
                    api.listExtensions();
                }
            }

            storage.set('mb_extensions', extensions, false);
        };

        return api;
    }

    window.CreateBHFansAPI = api;
})();
window.bhfansapi = CreateBHFansAPI(window.ajax, window.storage, window);

(function () {
    var apiLoad = performance.now();

    function logWithTime() {
        var _console;

        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            args[_key4] = arguments[_key4];
        }

        (_console = console).info.apply(_console, args.concat(['Took', ((performance.now() - apiLoad) / 1000).toFixed(3), 'seconds']));
    }

    var api = function api(ajax, worldId, hook, bhfansapi) {
        var world = {
            name: '',
            online: []
        };

        var cache = {
            worldStarted: worldStarted(),
            firstId: 0
        };

        cache.getLogs = getLogs();
        cache.getLists = getLists();
        cache.getHomepage = getHomepage();

        cache.worldStarted.then(function () {
            return logWithTime('World online.');
        });
        cache.getLogs.then(function () {
            return logWithTime('Logs fetched.');
        });
        cache.getHomepage.then(function () {
            return logWithTime('Homepage fetched.');
        });
        cache.getLists.then(function () {
            return logWithTime('Lists fetched.');
        });

        var api = {};

        function worldStarted() {
            return new Promise(function (resolve, reject) {
                var fails = 0;
                (function check() {
                    ajax.postJSON('/api', { command: 'status', worldId: worldId }).then(function (world) {
                        if (world.worldStatus == 'online') {
                            return resolve();
                        } else if (world.worldStatus == 'offline') {
                            ajax.postJSON('/api', { command: 'start', worldId: worldId }).then(check, check); 
                        } else {
                                fails++;
                                if (fails > 10) {
                                    return reject();
                                }
                                setTimeout(check, 3000);
                            }
                    }).catch(bhfansapi.reportError);
                })();
            });
        }

        function getLogs() {
            return cache.worldStarted.then(function () {
                return ajax.get('/worlds/logs/' + worldId).then(function (log) {
                    return log.split('\n');
                });
            });
        }

        function getLists() {
            return cache.worldStarted.then(function () {
                return ajax.get('/worlds/lists/' + worldId);
            }).then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');

                function getList(name) {
                    var list = doc.querySelector('textarea[name=' + name + ']').value.toLocaleUpperCase().split('\n');
                    return [].concat(_toConsumableArray(new Set(list))); 
                }

                var admin = getList('admins');
                var mod = getList('modlist');
                mod = mod.filter(function (name) {
                    return admin.indexOf(name) < 0;
                });
                var staff = admin.concat(mod);

                var white = getList('whitelist');
                var black = getList('blacklist');

                return { admin: admin, mod: mod, staff: staff, white: white, black: black };
            });
        }

        function getHomepage() {
            return ajax.get('/worlds/' + worldId).catch(getHomepage);
        }

        api.worldStarted = function () {
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

            if (refresh) {
                cache.worldStarted = worldStarted();
            }
            return cache.worldStarted.catch(function () {
                return api.worldStarted(true);
            });
        };

        api.getLogs = function () {
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

            if (refresh) {
                api.worldStarted(true);
                cache.getLogs = getLogs();
            }
            return cache.getLogs.catch(function () {
                return api.getLogs(true);
            });
        };

        api.getOnlinePlayers = function () {
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

            if (refresh) {
                cache.getHomepage = getHomepage();
            }
            return cache.getHomepage.then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var playerElems = doc.querySelector('.manager.padded:nth-child(1)').querySelectorAll('tr:not(.history)>td.left');
                var players = [];

                Array.from(playerElems).forEach(function (el) {
                    players.push(el.textContent.toLocaleUpperCase());
                });

                return players;
            }).catch(function () {
                return api.getOnlinePlayers(true);
            });
        };
        api.getOnlinePlayers().then(function (players) {
            return world.players = [].concat(_toConsumableArray(new Set(players.concat(world.players))));
        });

        api.getOwnerName = function () {
            return cache.getHomepage.then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                return doc.querySelector('.subheader~tr>td:not([class])').textContent.toLocaleUpperCase();
            });
        };

        api.getWorldName = function () {
            return cache.getHomepage.then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                return doc.querySelector('#title').textContent;
            });
        };
        api.getWorldName().then(function (name) {
            return world.name = name;
        });

        api.send = function (message) {
            return ajax.postJSON('/api', { command: 'send', message: message, worldId: worldId }).then(function (resp) {
                if (resp.status != 'ok') {
                    throw new Error(resp.message);
                }
                return resp;
            }).then(function (resp) {
                hook.check('world.send', message);
                hook.check('world.servermessage', message);
                if (message.startsWith('/')) {
                    var command = message.substr(1);

                    if (!command.startsWith(' ')) {
                        var _args = '';
                        if (command.includes(' ')) {
                            command = command.substring(0, command.indexOf(' '));
                            _args = message.substring(message.indexOf(' ') + 1);
                        }
                        hook.check('world.command', 'SERVER', command, _args);
                    }
                }

                return resp;
            }).catch(function (err) {
                if (err == 'World not running') {
                    cache.firstID = 0;
                }
            });
        };

        function getMessages() {
            return cache.worldStarted.then(function () {
                return ajax.postJSON('/api', { command: 'getchat', worldId: worldId, firstId: cache.firstId });
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

        function checkChat() {
            getMessages().then(function (msgs) {
                msgs.forEach(function (message) {
                    if (message.startsWith(world.name + ' - Player Connected ')) {
                        var name = message.substring(world.name.length + 20, message.lastIndexOf('|', message.lastIndexOf('|') - 1) - 1);
                        var ip = message.substring(message.lastIndexOf(' | ', message.lastIndexOf(' | ') - 1) + 3, message.lastIndexOf(' | '));

                        if (!world.online.includes(name)) {
                            world.online.push(name);
                        }
                        hook.check('world.join', name, ip);
                    } else if (message.startsWith(world.name + ' - Player Disconnected ')) {
                        var _name = message.substring(world.name.length + 23);

                        if (world.online.includes(_name)) {
                            world.online.splice(world.online.indexOf(_name), 1);
                        }
                        hook.check('world.leave', _name);
                    } else if (message.includes(': ')) {
                        var _name2 = getUsername(message);
                        var msg = message.substring(_name2.length + 2);

                        if (_name2 == 'SERVER') {
                            hook.check('world.serverchat', msg);
                        } else {
                            hook.check('world.message', _name2, msg);

                            if (msg.startsWith('/')) {

                                var command = msg.substr(1);

                                if (!command.startsWith(' ')) {
                                    var _args2 = '';
                                    if (command.includes(' ')) {
                                        command = command.substring(0, command.indexOf(' '));
                                        _args2 = msg.substring(msg.indexOf(' ') + 1);
                                    }
                                    hook.check('world.command', _name2, command, _args2);
                                    return;
                                }
                            }

                            hook.check('world.chat', _name2, message);
                        }
                    } else {
                        hook.check('world.other', message);
                    }
                });
            }).catch(bhfansapi.reportError).then(function () {
                setTimeout(checkChat, 5000);
            });
        }
        checkChat();

        api.getLists = function () {
            var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

            if (refresh) {
                api.worldStarted(true);
                cache.getLists = getLists();
            }

            return cache.getLists;
        };

        return api;
    };

    window.BlockheadsAPI = api;
})();
window.api = BlockheadsAPI(window.ajax, window.worldId, window.hook, window.bhfansapi);

(function () {
    var create = function create(hook, bhfansapi) {
        document.head.innerHTML = '<title>Console - MessageBot</title> <link rel="icon" href="http://forums.theblockheads.net/uploads/default/original/3X/b/d/bd489ba3dddafb66906af3b377069fe4a3551a3a.png"> <meta name="viewport" content="width=device-width,initial-scale=1"> ';
        document.head.innerHTML += '<style>html,body{min-height:100vh;position:relative;width:100%;margin:0;font-family:"Lucida Grande","Lucida Sans Unicode",Verdana,sans-serif;color:#000}textarea,input,button,select{font-family:inherit}a{cursor:pointer;color:#182b73}.overlay{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99;background:rgba(0,0,0,0.7);visibility:hidden;opacity:0;transition:opacity .5s}.overlay.visible{visibility:visible;opacity:1;transition:opacity .5s}#botTemplates{display:none}header{background:#182b73 url("http://portal.theblockheads.net/static/images/portalHeader.png") no-repeat;background-position:80px;height:80px}#jMsgs,#lMsgs,#tMsgs,#aMsgs,#exts{padding-top:8px;margin-top:8px;border-top:1px solid;height:calc(100vh - 185px)}.third-box,#mb_join .msg,#mb_leave .msg,#mb_trigger .msg,#mb_announcements .msg,#mb_extensions .ext{position:relative;float:left;width:calc(33% - 19px);min-width:280px;padding:5px;margin-left:5px;margin-bottom:5px;border:3px solid #999;border-radius:10px}.third-box:nth-child(odd),#mb_join .msg:nth-child(odd),#mb_leave .msg:nth-child(odd),#mb_trigger .msg:nth-child(odd),#mb_announcements .msg:nth-child(odd),#mb_extensions .ext:nth-child(odd){background:#ccc}.top-right-button,#mb_join .add,#mb_leave .add,#mb_trigger .add,#mb_announcements .add,#mb_extensions #mb_load_man{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:10px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}.button,#mb_extensions .ext button,#alert>.buttons>span{display:inline-block;padding:6px 12px;margin:0 5px;text-align:center;white-space:nowrap;cursor:pointer;border:1px solid rgba(0,0,0,0.15);border-radius:6px;background:#fff linear-gradient(to bottom, #fff 0, #e0e0e0 100%)}#leftNav{text-transform:uppercase}#leftNav nav{width:250px;background:#182b73;color:#fff;position:fixed;left:-250px;z-index:100;top:0;bottom:0;transition:left .5s}#leftNav details,#leftNav span{display:block;text-align:center;padding:5px 7px;border-bottom:1px solid white}#leftNav .selected{background:radial-gradient(#9fafeb, #182b73)}#leftNav summary ~ span{background:rgba(159,175,235,0.4)}#leftNav summary+span{border-top-left-radius:20px;border-top-right-radius:20px}#leftNav summary ~ span:last-of-type{border:0;border-bottom-left-radius:20px;border-bottom-right-radius:20px}#leftNav input{display:none}#leftNav label{color:#fff;background:#213b9d;padding:5px;position:fixed;top:5px;z-index:100;left:5px;opacity:1;transition:left .5s,opacity .5s}#leftNav input:checked ~ nav{left:0;transition:left .5s}#leftNav input:checked ~ label{left:255px;opacity:0;transition:left .5s,opacity .5s}#leftNav input:checked ~ .overlay{visibility:visible;opacity:1;transition:opacity .5s}#container>div{height:calc(100vh - 100px);padding:10px;position:absolute;top:80px;left:0;right:0;overflow:auto}#container>div:not(.visible){display:none}#mb_console .chat{height:calc(100vh - 220px)}@media screen and (min-width: 668px){#mb_console .chat{height:calc(100vh - 155px)}}#mb_console ul{height:100%;overflow-y:auto;margin:0;padding:0}#mb_console li{list-style-type:none}#mb_console .controls{display:flex;padding:0 10px}#mb_console input,#mb_console button{margin:5px 0}#mb_console input{font-size:1em;padding:1px;flex:1;border:solid 1px #999}#mb_console button{background:#182b73;font-weight:bold;color:#fff;border:0;height:40px;padding:1px 4px}#mb_console .mod>span:first-child{color:#05f529}#mb_console .admin>span:first-child{color:#2b26bd}#mb_settings h3{border-bottom:1px solid #999}#mb_settings a{text-decoration:underline}#mb_settings a.button{text-decoration:none;font-size:0.9em;padding:1px 5px}#mb_join h3,#mb_leave h3,#mb_trigger h3,#mb_announcements h3{margin:0 0 5px 0}#mb_join input,#mb_join textarea,#mb_leave input,#mb_leave textarea,#mb_trigger input,#mb_trigger textarea,#mb_announcements input,#mb_announcements textarea{border:2px solid #666;width:calc(100% - 10px)}#mb_join textarea,#mb_leave textarea,#mb_trigger textarea,#mb_announcements textarea{resize:none;overflow:hidden;padding:1px 0;height:21px;transition:height .5s}#mb_join textarea:focus,#mb_leave textarea:focus,#mb_trigger textarea:focus,#mb_announcements textarea:focus{height:5em}#mb_join input[type="number"],#mb_leave input[type="number"],#mb_trigger input[type="number"],#mb_announcements input[type="number"]{width:5em}#mb_extensions #mb_load_man{width:inherit;padding:0 7px}#mb_extensions h3{margin:0 0 5px 0}#mb_extensions .ext{height:130px}#mb_extensions .ext h4,#mb_extensions .ext p{margin:0}#mb_extensions .ext button{position:absolute;bottom:7px;padding:5px 8px}#alert{visibility:hidden;position:fixed;top:50px;left:0;right:0;margin:auto;z-index:101;width:50%;min-width:300px;min-height:200px;background:#fff;border-radius:10px;padding:10px 10px 55px 10px}#alert.visible{visibility:visible}#alert>div{webkit-overflow-scrolling:touch;max-height:65vh;overflow-y:auto}#alert>.buttons{position:absolute;bottom:10px;left:5px}#alert>.buttons [class]{color:#fff}#alert>.buttons .success{background:#5cb85c linear-gradient(to bottom, #5cb85c 0, #419641 100%);border-color:#3e8f3e}#alert>.buttons .info{background:#5bc0de linear-gradient(to bottom, #5bc0de 0, #2aabd2 100%);border-color:#28a4c9}#alert>.buttons .danger{background:#d9534f linear-gradient(to bottom, #d9534f 0, #c12e2a 100%);border-color:#b92c28}#alert>.buttons .warning{background:#f0ad4e linear-gradient(to bottom, #f0ad4e 0, #eb9316 100%);border-color:#e38d13}.notification{opacity:0;transition:opacity 1s;position:fixed;top:1em;right:1em;min-width:200px;border-radius:5px;padding:5px;background:#9fafeb}.notification.visible{opacity:1}<style>';
        document.body.innerHTML = '<div id="leftNav"> <input type="checkbox" id="leftToggle"> <label for="leftToggle">&#9776; Menu</label> <nav data-tab-group="main"> <span class="tab selected" data-tab-name="console">Console</span> <details data-tab-group="messages"> <summary>Messages</summary> <span class="tab" data-tab-name="join">Join</span> <span class="tab" data-tab-name="leave">Leave</span> <span class="tab" data-tab-name="trigger">Trigger</span> <span class="tab" data-tab-name="announcements">Announcements</span> </details> <span class="tab" data-tab-name="extensions">Extensions</span> <span class="tab" data-tab-name="settings">Settings</span> <div class="clearfix"> </nav> <div class="overlay"></div> </div> <div id="botTemplates"> <template id="jlTemplate"> <div class="msg"> <label>When the player is </label> <select data-target="group"> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select data-target="not_group"> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> then say </label> <textarea class="m"></textarea> <label> in chat if the player has joined between </label> <input type="number" value="0" data-target="joins_low"> <label> and </label> <input type="number" value="9999" data-target="joins_high"> <label> times.</label><br> <a>Delete</a> </div> </template> <template id="tTemplate"> <div class="msg"> <label>When </label> <select data-target="group"> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select data-target="not_group"> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> says </label> <input class="t"> <label> in chat, say </label> <textarea class="m"></textarea> <label> if the player has joined between </label> <input type="number" value="0" data-target="joins_low"> <label> and </label> <input type="number" value="9999" data-target="joins_high"> <label>times. </label><br> <a>Delete</a> </div> </template> <template id="aTemplate"> <div class="ann"> <label>Send:</label> <textarea class="m"></textarea> <a>Delete</a> <label style="display:block;margin-top:5px">Wait X minutes...</label> </div> </template> <template id="extTemplate"> <div class="ext"> <h4>Title</h4> <span>Description</span><br> <button class="button">Install</button> </div> </template> </div> <div id="container"> <header></header> <div id="mb_console" data-tab-name="console" class="visible"> <div class="chat"> <ul></ul> </div> <div class="controls"> <input type="text"><button>SEND</button> </div> </div> <div id="mb_join" data-tab-name="join"> <h3>These are checked when a player joins the server.</h3> <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="jMsgs"></div> </div> <div id="mb_leave" data-tab-name="leave"> <h3>These are checked when a player leaves the server.</h3> <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="lMsgs"></div> </div> <div id="mb_trigger" data-tab-name="trigger"> <h3>These are checked whenever someone says something.</h3> <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger "te*st" will match "tea stuff" and "test")</span> <span class="add">+</span> <div id="tMsgs"></div> </div> <div id="mb_announcements" data-tab-name="announcements"> <h3>These are sent according to a regular schedule.</h3> <span>If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span> <span class="add">+</span> <div id="aMsgs"></div> </div> <div id="mb_extensions" data-tab-name="extensions"> <h3>Extensions can increase the functionality of the bot.</h3> <span>Interested in creating one? <a href="https://github.com/Bibliofile/Blockheads-MessageBot/wiki" target="_blank">Click here.</a></span> <span id="mb_load_man">Load By ID/URL</span> <div id="exts"></div> </div> <div id="mb_settings" data-tab-name="settings"> <h3>Settings</h3> <label for="mb_ann_delay">Minutes between announcements: </label><br> <input id="mb_ann_delay" type="number"><br> <label for="mb_resp_max">Maximum trigger responses to a message: </label><br> <input id="mb_resp_max" type="number"><br> <label for="mb_notify_message">New chat notifications: </label> <input id="mb_notify_message" type="checkbox"><br> <h3>Advanced Settings</h3> <a href="https://github.com/Bibliofile/Blockheads-MessageBot/wiki/Advanced-Options" target="_blank">Read this first</a><br> <label for="mb_disable_trim">Disable whitespace trimming: </label> <input id="mb_disable_trim" type="checkbox"><br> <label for="mb_regex_triggers">Parse triggers as RegEx: </label> <input id="mb_regex_triggers" type="checkbox"><br> <h3>Extensions</h3> <div id="mb_ext_list"></div> <h3>Backup / Restore</h3> <a id="mb_backup_save">Get backup code</a><br> <a id="mb_backup_load">Load previous backup</a> <div id="mb_backup"></div> </div> </div> <div id="alertWrapper"> <div id="alert"> <div id="alertContent"></div> <div class="buttons"></div> </div> <div class="overlay"> ';

        var mainToggle = document.querySelector('#leftNav input');

        function listenerHook(selector, type, hookname) {
            document.querySelector(selector).addEventListener(type, function () {
                return hook.check('ui.' + hookname);
            });
        }

        ['jMsgs', 'lMsgs', 'tMsgs', 'aMsgs'].forEach(function (id) {
            listenerHook('#' + id, 'change', 'messageChanged');
        });
        listenerHook('#mb_settings', 'change', 'prefChanged');

        hook.listen('ui.addmessagetopage', function showNewChat() {
            var container = document.querySelector('#mb_console ul');
            var lastLine = document.querySelector('#mb_console li:last-child');

            if (!container || !lastLine) {
                return;
            }

            if (container.scrollHeight - container.clientHeight - container.scrollTop <= lastLine.clientHeight * 2) {
                lastLine.scrollIntoView(false);
            }
        });

        hook.listen('ui.addmessagetopage', function removeOldChat() {
            var chat = document.querySelector('#mb_console ul');

            while (chat.children.length > 500) {
                chat.children[0].remove();
            }
        });

        document.querySelector('#exts').addEventListener('click', function extActions(e) {
            if (e.target.tagName != 'BUTTON') {
                return;
            }
            var button = e.target;
            var extId = button.parentElement.dataset.id;

            if (button.textContent == 'Install') {
                bhfansapi.startExtension(extId);
            } else {
                bhfansapi.removeExtension(extId);
            }
        });

        document.querySelector('#leftNav').addEventListener('click', function globalTabChange(event) {
            var tabName = event.target.dataset.tabName;
            if (!tabName) {
                return;
            }

            Array.from(document.querySelectorAll('#container > .visible')).forEach(function (el) {
                return el.classList.remove('visible');
            });
            document.querySelector('#container > [data-tab-name=' + tabName + ']').classList.add('visible');

            document.querySelector('#leftNav .selected').classList.remove('selected');
            event.target.classList.add('selected');
        });

        if (!('open' in document.createElement('details'))) {
            var style = document.createElement('style');
            style.textContent += 'details:not([open]) > :not(summary) { display: none !important; }' + 'details > summary:before { content: "▶"; display: inline-block; font-size: .8em; width: 1.5em; font-family:"Courier New"; }' + 'details[open] > summary:before { transform: rotate(90deg); }';
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

        bhfansapi.getStore().then(function (resp) {
            if (resp.status != 'ok') {
                document.getElementById('exts').innerHTML += resp.message;
                throw new Error(resp.message);
            }
            resp.extensions.forEach(function (extension) {
                ui.buildContentFromTemplate('#extTemplate', '#exts', [{ selector: 'h4', text: extension.title }, { selector: 'span', html: extension.snippet }, { selector: '.ext', 'data-id': extension.id }, { selector: 'button', text: bhfansapi.extensionInstalled(extension.id) ? 'Remove' : 'Install' }]);
            });
        }).catch(bhfansapi.reportError);

        function addEmptyMsg(e) {
            var containerElem = e.target.parentElement.querySelector('div');
            var template;

            switch (containerElem.id) {
                case 'jMsgs':
                case 'lMsgs':
                    template = 'jlTemplate';
                    break;
                case 'tMsgs':
                    template = 'tTemplate';
                    break;
                default:
                    template = 'aTemplate';
            }

            ui.addMsg('#' + template, '#' + containerElem.id, {});

            e.stopPropagation();
        }
        Array.from(document.querySelectorAll('span.add')).forEach(function (el) {
            el.addEventListener('click', addEmptyMsg);
        });

        var ui = {};

        ui.addMsg = function addMsg(templateSelector, containerSelector, saveObj) {
            var rules = [{ selector: '[selected]', multiple: true, remove: ['selected'] }, { selector: '.m', text: saveObj.message || '' }];

            if (templateSelector != '#aTemplate') {
                rules.push({ selector: '[data-target=joins_low]', value: saveObj.joins_low || 0 });
                rules.push({ selector: '[data-target=joins_high]', value: saveObj.joins_high || 9999 });
                rules.push({ selector: '[data-target=group] [value="' + (saveObj.group || 'All') + '"]', selected: 'selected' });
                rules.push({ selector: '[data-target=not_group] [value="' + (saveObj.not_group || 'Nobody') + '"]', selected: 'selected' });
            }

            if (templateSelector == '#tTemplate') {
                rules.push({ selector: '.t', value: saveObj.trigger || '' });
            }

            ui.buildContentFromTemplate(templateSelector, containerSelector, rules);

            document.querySelector(containerSelector + ' > div:last-child a').addEventListener('click', function (e) {
                ui.alert('Really delete this message?', [{ text: 'Yes', style: 'success', action: function action() {
                        this.remove();
                        hook.check('ui.messageDeleted');
                    }, thisArg: e.target.parentElement }, { text: 'Cancel' }]);
            });

            hook.check('ui.messageAdded');
        };

        var alert = {
            active: false,
            queue: [],
            buttons: {}
        };

        function buttonHandler(event) {
            var button = alert.buttons[event.target.id] || {};
            button.thisArg = button.thisArg || undefined;
            button.dismiss = typeof button.dismiss == 'boolean' ? button.dismiss : true;
            if (typeof button.action == 'function') {
                button.action.call(button.thisArg);
            }

            if (button.dismiss || typeof button.action != 'function') {
                document.querySelector('#alert').classList.remove('visible');
                document.querySelector('#alert ~ .overlay').classList.remove('visible');
                document.querySelector('#alert .buttons').innerHTML = '';
                alert.buttons = {};
                alert.active = false;

                if (alert.queue.length) {
                    var _alert = _alert.queue.shift();
                    ui.alert(_alert.text, _alert.buttons);
                }
            }
        }

        ui.alert = function (text) {
            var buttons = arguments.length <= 1 || arguments[1] === undefined ? [{ text: 'OK' }] : arguments[1];

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

            if (alert.active) {
                alert.queue.push({ text: text, buttons: buttons });
                return;
            }
            alert.active = true;

            buttons.forEach(function (button, i) {
                button.dismiss = button.dismiss === false ? false : true; 
                alert.buttons['button_' + i] = { action: button.action, thisArg: button.thisArg, dismiss: button.dismiss };
                button.id = 'button_' + i;
                buildButton(button);
            });
            document.querySelector('#alertContent').innerHTML = text;

            document.querySelector('#alert ~ .overlay').classList.add('visible');
            document.querySelector('#alert').classList.add('visible');
        };

        ui.notify = function (text) {
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
        };

        ui.toggleMenu = function () {
            mainToggle.checked = !mainToggle.checked;
        };

        ui.addTab = function () {
            var tabNameUID = 0;

            return function addTab(tabText) {
                var groupName = arguments.length <= 1 || arguments[1] === undefined ? 'main' : arguments[1];

                var tabName = 'botTab_' + tabNameUID++;

                var tab = document.createElement('span');
                tab.textContent = tabText;
                tab.classList.add('tab');
                tab.dataset.tabName = tabName;

                var tabContent = document.createElement('div');
                tabContent.dataset.tabName = tabName;

                document.querySelector('#leftNav [data-tab-group=' + groupName + ']').appendChild(tab);
                document.querySelector('#container').appendChild(tabContent);

                return tabContent;
            };
        }();

        ui.removeTab = function removeTab(tabContent) {
            document.querySelector('#leftNav [data-tab-name=' + tabContent.dataset.tabName + ']').remove();
            tabContent.remove();
        };

        ui.addTabGroup = function addTabGroup(text, groupName) {
            var details = document.createElement('details');
            details.dataset.tabGroup = groupName;

            var summary = document.createElement('summary');
            summary.textContent = text;
            details.appendChild(summary);

            document.querySelector('#leftNav [data-tab-group=main]').appendChild(details);
        };

        ui.removeTabGroup = function removeTabGroup(groupName) {
            var group = document.querySelector('#leftNav [data-tab-group="' + groupName + '"]');
            var items = Array.from(group.querySelectorAll('span'));

            items.forEach(function (item) {
                document.querySelector('#container [data-tab-name="' + item.dataset.tabName + '"]').remove();
            });

            group.remove();
        };

        ui.addMessageToConsole = function addMessageToConsole(msg) {
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
                contentEl.textContent = ': ' + msg;
            } else {
                contentEl.textContent = msg;
            }
            msgEl.appendChild(nameEl);
            msgEl.appendChild(contentEl);

            var chat = document.querySelector('#mb_console ul');
            chat.appendChild(msgEl);

            hook.check('ui.addmessagetopage');
        };

        ui.buildContentFromTemplate = function (templateSelector, targetSelector) {
            var rules = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

            function updateElement(el, rule) {
                if ('text' in rule) {
                    el.textContent = rule.text;
                } else if ('html' in rule) {
                    el.innerHTML = rule.html;
                }

                Object.keys(rule).filter(function (key) {
                    return !['selector', 'text', 'html', 'remove', 'multiple'].includes(key);
                }).forEach(function (key) {
                    el.setAttribute(key, rule[key]);
                });

                if (Array.isArray(rule.remove)) {
                    rule.remove.forEach(function (key) {
                        el.removeAttribute(key);
                    });
                }
            }

            function handleRule(rule) {
                if (rule.multiple) {
                    var els = content.querySelectorAll(rule.selector);

                    Array.from(els).forEach(function (el) {
                        return updateElement(el, rule);
                    });
                } else {
                    var el = content.querySelector(rule.selector);
                    if (!el) {
                        void 0;
                        return;
                    }

                    updateElement(el, rule);
                }
            }

            var template = document.querySelector(templateSelector);
            if (!('content' in template)) {
                var _content = template.childNodes;
                var fragment = document.createDocumentFragment();

                for (var j = 0; j < _content.length; j++) {
                    fragment.appendChild(_content[j]);
                }

                template.content = fragment;
            }

            var content = template.content;

            rules.filter(function (rule) {
                return rule.remove;
            }).forEach(handleRule);

            rules.filter(function (rule) {
                return !rule.remove;
            }).forEach(handleRule);

            document.querySelector(targetSelector).appendChild(document.importNode(content, true));
        };

        document.querySelector('#leftNav .overlay').addEventListener('click', ui.toggleMenu);

        return ui;
    };

    window.MessageBotUI = create;
})();
window.botui = MessageBotUI(window.hook, window.bhfansapi);

(function (ui, bhfansapi) {
    function onClick(selector, handler) {
        Array.from(document.querySelectorAll(selector)).forEach(function (el) {
            return el.addEventListener('click', handler);
        });
    }

    onClick('#mb_backup_load', function loadBackup() {
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

    onClick('#mb_load_man', function loadExtension() {
        ui.alert('Enter the ID or URL of an extension:<br><input style="width:calc(100% - 7px);"/>', [{ text: 'Add', style: 'success', action: function action() {
                var extRef = document.querySelector('#alert input').value;
                if (extRef.length) {
                    if (extRef.startsWith('http')) {
                        var el = document.createElement('script');
                        el.src = extRef;
                        document.head.appendChild(el);
                    } else {
                        bhfansapi.startExtension(extRef);
                    }
                }
            } }, { text: 'Cancel' }]);
    });

    onClick('#mb_backup_save', function showBackup() {
        var backup = JSON.stringify(localStorage).replace(/</g, '&lt;');
        ui.alert('Copy this to a safe place:<br><textarea style="width: calc(100% - 7px);height:160px;">' + backup + '</textarea>');
    });
})(window.botui, window.bhfansapi);

function MessageBot(ajax, hook, storage, bhfansapi, api, ui) {
    var chatBuffer = [];
    (function checkBuffer() {
        if (chatBuffer.length) {
            api.send(chatBuffer.shift()).then(checkBuffer);
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
        version: '6.0.5',
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

            if (message.startsWith(worldName + ' - Player Connected ')) {
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
                ui.addMsg('#' + tids[index], '#' + ids[index], msg);
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

        ui.addMessageToConsole(name + ' (' + ip + ') has joined the server', 'SERVER', 'join world admin');
    });
    hook.listen('world.leave', function handlePlayerLeave(name) {
        if (world.online.includes(name)) {
            world.online.splice(world.online.indexOf(name), 1);
        }

        ui.addMessageToConsole(name + ' has left the server', 'SERVER', 'leave world admin');
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
                        ui.notify('Skipping trigger \'' + trigger + '\' as the RegEx is invaild.');
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
                bot.ui.notify(name + ': ' + message);
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

function MessageBotExtension(namespace) {
    var extension = {
        id: namespace,
        bot: window.bot,
        ui: window.botui,
        hook: window.hook,
        storage: window.storage,
        ajax: window.ajax,
        api: window.api
    };

    extension.hook.check(extension.id + '.loaded');

    extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {
        window.bhfansapi.autoloadExtension(extension.id, shouldAutoload);
    };

    return extension;
}


var bot = MessageBot( 
window.ajax, window.hook, window.storage, window.bhfansapi, window.api, window.botui);

window.addEventListener('error', function (err) {
    if (err.message != 'Script error') {
        window.hook.check('error', err);
    }
});