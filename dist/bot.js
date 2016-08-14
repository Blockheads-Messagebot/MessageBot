'use strict';


window.pollChat = function () {};

function getAjax() {
    function xhr(protocol) {
        var url = arguments.length <= 1 || arguments[1] === undefined ? '/' : arguments[1];
        var paramObj = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

        var paramStr = Object.keys(paramObj).map(function (k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(paramObj[k]);
        }).join('&');
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
                    reject(Error(req.statusText));
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

        return xhr('GET', url, paramObj);
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
}

var getHook = function () {
    var listeners = {};

    function listen(key, callback) {
        if (!listeners[key]) {
            listeners[key] = [];
        }
        listeners[key].push(callback);
    }

    function call(key, initial) {
        for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
            args[_key - 2] = arguments[_key];
        }

        if (!listeners[key]) {
            return initial;
        }

        return listeners[key].reduce(function (previous, current) {
            try {
                return current.apply(undefined, [previous].concat(args));
            } catch (e) {
                void 0;
                return previous;
            }
        }, initial);
    }

    return function () {
        return { listen: listen, call: call };
    };
}();

function BHFansAPI(ajax) {
    var cache = {
        getStore: getStore()
    };

    function getStore() {
        return ajax.getJSON('//blockheadsfans.com/messagebot/extension/store');
    }

    var api = {};

    api.getExtensionNames = function (ids) {
        return ajax.postJSON('//blockheadsfans.com/messagebot/extension/name', { extensions: JSON.stringify(ids) });
    };

    api.getStore = function () {
        var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        if (refresh) {
            cache.getStore = getStore();
        }
        return cache.getStore();
    };

    api.startExtension = function (id) {
        var el = document.createElement('script');
        el.src = '//blockheadsfans.com/messagebot/extension/' + id + '/code/raw';
        el.crossOrigin = 'anonymous';
        document.head.appendChild(el);
    };

    return api;
}

function BlockheadsAPI(ajax, worldId) {
    var cache = {
        worldStarted: worldStarted(),
        getLogs: getLogs(),
        getLists: getLists(),
        getHomepage: getHomepage(),
        firstId: 0
    };

    function worldStarted() {
        return new Promise(function (resolve, reject) {
            var fails = 0;
            (function check() {
                ajax.postJSON('/api', { command: 'status', worldId: worldId }).then(function (world) {
                    if (world.worldStatus == 'online') {
                        return resolve();
                    } else if (world.worldStatus == 'offline') {
                        ajax.postJSON('/api', { command: 'start', worldId: worldId }).then(check);
                    } else {
                        fails++;
                        if (fails > 10) {
                            return reject();
                        }
                        setTimeout(check, 3000);
                    }
                });
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
            return ajax.get('/worlds/lists/' + worldId).then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');

                function getList(name) {
                    return doc.querySelector('textarea[name=' + name + ']').value.toLocaleUpperCase().split('\n');
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
        });
    }

    function getHomepage() {
        return ajax.get('/worlds/' + window.worldId);
    }

    var api = {};

    api.worldStarted = function () {
        var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        if (refresh) {
            cache.worldStarted = worldStarted();
        }
        return cache.worldStarted();
    };

    api.getLogs = function () {
        var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        if (refresh) {
            cache.getLogs = getLogs();
        }
        return cache.getLogs;
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
        });
    };

    api.getOwnerName = function () {
        return cache.getHomepage.then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            return doc.querySelector('.subheader~tr>td:not([class])').textContent.toLocaleUpperCase();
        });
    };

    api.sendMessage = function (message) {
        return ajax.postJSON('/api', { command: 'send', message: message, worldId: worldId });
    };

    api.getMessages = function () {
        return ajax.postJSON('/api', { command: 'getchat', worldId: worldId, firstId: cache.firstId }).then(function (data) {
            if (data.status == 'ok' && data.nextId != cache.firstId) {
                cache.firstId = data.nextId;
                return data.log;
            } else if (data.status == 'error') {
                throw new Error(data.message);
            }
        });
    };

    return api;
}

var bot = MessageBot();
bot.start();

window.addEventListener('error', function (err) {
    try {
        if (err.message == 'Script error') {
            return;
        }

        void 0;
        bot.core.ajax.postJSON('//blockheadsfans.com/messagebot/bot/error', {
            world_name: bot.core.worldName,
            world_id: window.worldId,
            owner_name: bot.core.ownerName,
            bot_version: bot.version,
            error_text: err.message,
            error_file: err.filename,
            error_row: err.lineno,
            error_column: err.colno
        }).then(function (resp) {
            if (resp.status == 'ok') {
                bot.ui.notify('Something went wrong, it has been reported.');
            } else {
                throw new Error(resp.message);
            }
        }).catch(function (err) {
            void 0;
            bot.ui.notify('Error reporting exception: ' + err);
        });
    } catch (e) {
        void 0;
    }
});