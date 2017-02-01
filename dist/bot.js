(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var bot = require('bot');
var bot_console = require('./console');
var ui = require('ui');
var storage = require('libraries/storage');
var ajax = require('libraries/ajax');
var api = require('libraries/blockheads');
var world = require('libraries/world');
var hook = require('libraries/hook');

// Array of IDs to autoload at the next launch.
var autoload = [];
var loaded = [];
var STORAGE_ID = 'mb_extensions';

/**
 * Used to create a new extension.
 *
 * @example
 * var test = MessageBotExtension('test');
 * @param {string} namespace - Should be the same as your variable name.
 * @param {Function} [uninstall = undefined] - Optional, specify the uninstall function while creating the extension, instead of later. If specified here, this will be bound to the extension.
 * @return {MessageBotExtension} - The extension variable.
 */
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

    /**
     * Used to change whether or not the extension will be
     * Automatically loaded the next time the bot is launched.
     *
     * @example
     * var test = MessageBotExtension('test');
     * test.setAutoLaunch(true);
     * @param {bool} shouldAutoload
     */
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

/**
 * Tries to load the requested extension by ID.
 *
 * @param {string} id
 */
MessageBotExtension.install = function install(id) {
    if (!loaded.includes(id)) {
        var el = document.createElement('script');
        el.src = '//blockheadsfans.com/messagebot/extension/' + id + '/code/raw';
        el.crossOrigin = 'anonymous';
        document.head.appendChild(el);
    }
};

/**
 * Uninstalls an extension.
 *
 * @param {string} id
 */
MessageBotExtension.uninstall = function uninstall(id) {
    try {
        window[id].uninstall();
    } catch (e) {
        //Not installed, or no uninstall function.
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

/**
 * Used to check if an extension has been loaded.
 *
 * @param {string} id
 * @return {bool}
 */
MessageBotExtension.isLoaded = function isLoaded(id) {
    return loaded.includes(id);
};

// Load extensions that set themselves to autoload last launch.
storage.getObject(STORAGE_ID, [], false).forEach(MessageBotExtension.install);

module.exports = MessageBotExtension;

},{"./console":7,"bot":3,"libraries/ajax":8,"libraries/blockheads":10,"libraries/hook":11,"libraries/storage":12,"libraries/world":13,"ui":28}],2:[function(require,module,exports){
'use strict';

/**
 * @file Depricated. Use world.is[Group] instead.
 */

module.exports = {
    checkGroup: checkGroup
};

var world = require('libraries/world');

/**
 * Function used to check if users are in defined groups.
 *
 * @depricated
 * @example
 * checkGroup('admin', 'SERVER') // true
 * @param {string} group the group to check
 * @param {string} name the name of the user to check
 * @return {bool}
 */
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

},{"libraries/world":13}],3:[function(require,module,exports){
'use strict';

var storage = require('libraries/storage');

var bot = Object.assign(module.exports, require('./send'), require('./checkGroup'));

bot.version = '6.1.0';

/**
 * @depricated since 6.1.0. Use ex.world instead.
 */
bot.world = require('libraries/world');

storage.set('mb_version', bot.version, false);

},{"./checkGroup":2,"./send":5,"libraries/storage":12,"libraries/world":13}],4:[function(require,module,exports){
'use strict';

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

//jshint -W086
//No break statements as we want to execute all updates after matched version unless otherwise noted.
switch (localStorage.getItem('mb_version')) {
    case null:
        break; //Nothing to migrate
    case '5.2.0':
    case '5.2.1':
        //With 6.0, newlines are directly supported in messages by the bot.
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
        break; //Next bugfix only relates to 6.0 bot.
    case '6.0.0a':
    case '6.0.0':
        alert("Due to a bug in the 6.0.0 version of the bot, your join and leave messages may be swapped. Sorry! This cannot be fixed automatically. This message will not be shown again.");
        break; //Next bugfix only relates to 6.0.1 / 6.0.2.
    case '6.0.1':
    case '6.0.2':
        alert("Due to a bug in 6.0.1 / 6.0.2, groups may have been mixed up on Join, Leave, and Trigger messages. Sorry! This cannot be fixed automatically if it occured on your bot. Announcements have also been fixed.");
    case '6.0.3':
    case '6.0.4':
    case '6.0.5':
    case '6.0.6':
    case '6.1.0a':
        //Normalize groups to lower case.
        update(['joinArr', 'leaveArr', 'triggerArr'], function (raw) {
            try {
                var parsed = JSON.parse(raw);
                parsed.forEach(function (msg) {
                    msg.group = msg.group.toLocaleLowerCase();
                    msg.not_group = msg.not_group.toLocaleLowerCase();
                });
                return JSON.stringify(parsed);
            } catch (e) {
                return raw;
            }
        });
}
//jshint +W086

},{}],5:[function(require,module,exports){
'use strict';

var api = require('libraries/blockheads');
var settings = require('settings/bot');

var queue = [];

module.exports = {
    send: send
};

/**
 * Function used to queue a message to be sent.
 *
 * @example
 * send('Hello!');
 * @param {string} message the message to be sent.
 */
function send(message) {
    if (settings.splitMessages) {
        //FIXME: If the backslash before the token is escaped by another backslash the token should still split the message.
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

/**
 * Watches the queue for new messages to send and sends them as soon as possible.
 */
(function checkQueue() {
    if (!queue.length) {
        setTimeout(checkQueue, 500);
        return;
    }

    api.send(queue.shift()).catch(console.error).then(function () {
        setTimeout(checkQueue, 1000);
    });
})();

},{"libraries/blockheads":10,"settings/bot":23}],6:[function(require,module,exports){
'use strict';

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
        contentEl.textContent = ': ' + msg;
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

},{}],7:[function(require,module,exports){
'use strict';

var self = module.exports = require('./exports');

var settings = require('settings/bot');
var hook = require('libraries/hook');
var world = require('libraries/world');
var send = require('bot').send;
var ui = require('ui');

// TODO: Parse these and provide options to show/hide different ones.
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
            //Has to be admin
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

//Message handlers
hook.on('world.join', function handlePlayerJoin(name, ip) {
    self.write(name + ' (' + ip + ') has joined the server', 'SERVER', 'join world admin');
});

hook.on('world.leave', function handlePlayerLeave(name) {
    self.write(name + ' has left the server', 'SERVER', 'leave world admin');
});

var tab = ui.addTab('Console');
tab.innerHTML = '<style>' + "#mb_console{height:calc(100% - 50px)}#mb_console .mod>span:first-child{color:#05f529}#mb_console .admin>span:first-child{color:#2b26bd}#mb_console .chat{margin:1em;max-height:calc(100vh - 3em - 55px);width:calc(100vw - 2em);overflow-y:auto}#mb_console .chat-control{position:fixed;bottom:0;width:100vw}#mb_console .chat-control .control{margin:1em}\n" + '</style>' + "<div id=\"mb_console\">\r\n    <div class=\"chat\">\r\n        <ul></ul>\r\n    </div>\r\n    <div class=\"chat-control\">\r\n        <div class=\"control has-addons\">\r\n            <input type=\"text\" class=\"input is-expanded\"/>\r\n            <button class=\"input button is-primary\">SEND</button>\r\n        </div>\r\n    </div>\r\n</div>\r\n";

// If enabled, show messages for new chat when not on the console page
hook.on('world.chat', function (name, message) {
    if (settings.notify && !tab.classList.contains('visible')) {
        ui.notify(name + ': ' + message, 1.5);
    }
});

// Auto scroll when new messages are added to the page, unless the owner is reading old chat.
new MutationObserver(function showNewChat() {
    var container = tab.querySelector('.chat');
    var lastLine = tab.querySelector('li:last-child');

    if (!container || !lastLine) {
        return;
    }

    if (container.scrollHeight - container.clientHeight - container.scrollTop <= lastLine.clientHeight * 10) {
        lastLine.scrollIntoView(false);
    }
}).observe(tab.querySelector('.chat'), { childList: true, subtree: true });

// Remove old chat to reduce memory usage
new MutationObserver(function removeOldChat() {
    var chat = tab.querySelector('ul');

    while (chat.children.length > 500) {
        chat.children[0].remove();
    }
}).observe(tab.querySelector('.chat'), { childList: true, subtree: true });

// Listen for the user to send messages
function userSend() {
    var input = tab.querySelector('input');
    hook.fire('console.send', input.value);
    send(input.value);
    input.value = '';
    input.focus();
}

tab.querySelector('input').addEventListener('keydown', function (event) {
    if (event.key == "Enter" || event.keyCode == 13) {
        userSend();
    }
});

tab.querySelector('button').addEventListener('click', userSend);

},{"./exports":6,"bot":3,"libraries/hook":11,"libraries/world":13,"settings/bot":23,"ui":28}],8:[function(require,module,exports){
'use strict';

//TODO: Use fetch
/**
 * Function to GET a page. Passes the response of the XHR in the resolve promise.
 *
 * @example
 * //sends a GET request to /some/url.php?a=test
 * get('/some/url.php', {a: 'test'}).then(console.log)
 * @param {string} url
 * @param {object} paramsStr
 * @return {Promise}
 */
function get() {
    var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (Object.keys(params).length) {
        var addition = urlStringify(params);
        if (url.includes('?')) {
            url += '&' + addition;
        } else {
            url += '?' + addition;
        }
    }

    return xhr('GET', url, {});
}

/**
 * Returns a JSON object in the promise resolve method.
 *
 * @param {string} url
 * @param {object} paramObj
 * @return {Promise}
 */
function getJSON() {
    var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
    var paramObj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return get(url, paramObj).then(JSON.parse);
}

/**
 * Function to make a post request
 *
 * @param {string} url
 * @param {object} paramObj
 * @return {Promise}
 */
function post() {
    var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
    var paramObj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return xhr('POST', url, paramObj);
}

/**
 * Function to fetch JSON from a page through post.
 *
 * @param string url
 * @param string paramObj
 * @return Promise
 */
function postJSON() {
    var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '/';
    var paramObj = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    return post(url, paramObj).then(JSON.parse);
}

/**
* Helper function to make XHR requests, if possible use the get and post functions instead.
*
* @depricated since version 6.1
* @param string protocol
* @param string url
* @param object paramObj -- WARNING. Only accepts shallow objects.
* @return Promise
*/
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
        // Handle network errors
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

/**
 * Internal function used to stringify url parameters
 */
function urlStringify(obj) {
    return Object.keys(obj).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]);
    }).join('&');
}

module.exports = { xhr: xhr, get: get, getJSON: getJSON, post: post, postJSON: postJSON };

},{}],9:[function(require,module,exports){
'use strict';

/**
 * @file Contains functions to interact with blockheadsfans.com - cannot be used by extensions.
 */

var hook = require('libraries/hook');
var ajax = require('libraries/ajax');

var API_URLS = {
    STORE: '//blockheadsfans.com/messagebot/api/extension/store',
    NAME: '//blockheadsfans.com/messagebot/api/extension/info',
    ERROR: '//blockheadsfans.com/messagebot/api/error'
};

var cache = {
    info: new Map()
};

/**
 * Used to get public extensions
 *
 * @example
 * getStore().then(store => console.log(store));
 * @param {bool} [refresh=false] whether or not to use the cached response should be cleared.
 * @return {Promise} resolves with the response
 */
function getStore() {
    var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    if (refresh || !cache.getStore) {
        cache.getStore = ajax.getJSON(API_URLS.STORE).then(function (store) {
            //Build the initial names map
            if (store.status != 'ok') {
                return store;
            }

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = store.extensions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var ex = _step.value;

                    cache.info.set(ex.id, ex);
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

            return store;
        });
    }

    return cache.getStore;
}

/**
 * Gets the name of the provided extension ID.
 * If the extension was not found, resolves with the original passed ID.
 *
 * @example
 * getExtensionInfo('test').then(info => console.log(info));
 * @param {string} id the id to search for.
 * @return {Promise} resolves with the extension's name, snippet, and ID.
 */
function getExtensionInfo(id) {
    if (cache.info.has(id)) {
        return Promise.resolve(cache.info.get(id));
    }

    return ajax.getJSON(API_URLS.NAME, { id: id }).then(function (_ref) {
        var id = _ref.id,
            title = _ref.title,
            snippet = _ref.snippet;

        return cache.info.set(id, { id: id, title: title, snippet: snippet }).get(id);
    }, function (err) {
        reportError(err);
        return { name: id, id: id, snippet: 'No description.' };
    });
}

/**
 * Reports an error so that it can be reviewed and fixed by extension or bot developers.
 *
 * @example
 * reportError(Error("Report me"));
 * @param {Error} err the error to report
 */
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
            hook.fire('error_report', 'Error reporting exception: ' + resp.message);
        }
    }).catch(console.error);
}

module.exports = {
    getStore: getStore,
    getExtensionInfo: getExtensionInfo,
    reportError: reportError
};

},{"libraries/ajax":8,"libraries/hook":11}],10:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var ajax = require('./ajax');
var hook = require('./hook');
var bhfansapi = require('./bhfansapi');

var worldId = window.worldId;
var cache = {
    firstId: 0
};

// Used to parse messages more accurately
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

/**
 * Resolves after starting the world if neccessary, rejects if the world takes too long to start or is unavailible
 * Refactoring welcome. This seems overly pyramid like.
 *
 * @example
 * worldStarted().then(() => console.log('started!'));
 * @param {bool} [refresh=false] whether or not to recheck if the world is started.
 * @return {Promise}
 */
function worldStarted() {
    var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    if (refresh || !cache.worldStarted) {
        cache.worldStarted = new Promise(function (resolve, reject) {
            var fails = 0;
            (function check() {
                // Could this be more simplified?
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
                        case 'storing':
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

/**
 * Resolves with an array of the log's lines.
 *
 * @example
 * getLogs().then(lines => console.log(lines[0]));
 * @param {bool} [refresh=false] whether or not to redownload the logs
 * @return {Promise}
 */
function getLogs() {
    var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    if (refresh || !cache.getLogs) {
        cache.getLogs = worldStarted().then(function () {
            return ajax.get('/worlds/logs/' + worldId);
        }).then(function (log) {
            return log.split('\n');
        });
    }

    return cache.getLogs;
}

/**
 * Resolves with a list of admins, mods, staff (admins + mods), whitelist, and blacklist.
 *
 * @example
 * getLists().then(lists => console.log(lists.admin));
 * @param {bool} [refresh=false] whether or not to refetch the lists.
 * @return {Promise}
 */
function getLists() {
    var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    if (refresh || !cache.getLists) {
        cache.getLists = worldStarted().then(function () {
            return ajax.get('/worlds/lists/' + worldId);
        }).then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');

            function getList(name) {
                var list = doc.querySelector('textarea[name=' + name + ']').value.toLocaleUpperCase().split('\n');
                return [].concat(_toConsumableArray(new Set(list))); //Remove duplicates
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

/**
 * Resolves with the homepage of the server.
 *
 * @example
 * getHomepage().then(html => console.log(html.substring(0, 100)));
 * @param {bool} [refresh=false] whether or not to refetch the page.
 * @return {Promise}
 */
function getHomepage() {
    var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    if (refresh || !cache.getHomepage) {
        cache.getHomepage = ajax.get('/worlds/' + worldId).catch(function () {
            return getHomepage(true);
        });
    }

    return cache.getHomepage;
}

/**
 * Resolves with an array of player names.
 * An online list is maintained by the bot, this should generally not be used.
 *
 * @example
 * getOnlinePlayers().then(online => { for (let n of online) { console.log(n, 'is online!')}});
 * @param {bool} [refresh=false] whether or not to refresh the online names.
 * @return {Promise}
 */
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

/**
 * Resolves with the server owner's name.
 *
 * @example
 * getOwnerName().then(name => console.log('World is owned by', name));
 * @return {Promise}
 */
function getOwnerName() {
    return getHomepage().then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.querySelector('.subheader~tr>td:not([class])').textContent.toLocaleUpperCase();
    });
}

/**
 * Resolves with the world's name.
 *
 * @example
 * getWorldName().then(name => console.log('World name:', name));
 * @return {Promise}
 */
function getWorldName() {
    return getHomepage().then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.querySelector('#title').textContent.toLocaleUpperCase();
    });
}

/**
 * Sends a message, returns a promise that resolves when the message has been sent or rejects on failure.
 *
 * @example
 * send('hello!').then(() => console.log('sent')).catch(console.error);
 * @param {string} message the message to send.
 * @return {Promise}
 */
function send(message) {
    return ajax.postJSON('/api', { command: 'send', message: message, worldId: worldId }).then(function (resp) {
        if (resp.status != 'ok') {
            throw new Error(resp.message);
        }
        return resp;
    }).then(function (resp) {
        //Handle hooks
        hook.fire('world.send', message);
        hook.fire('world.servermessage', message);

        //Disallow commands starting with space.
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

/**
 * Internal function to watch chat.
 */
function checkChat() {
    getMessages().then(function (msgs) {
        msgs.forEach(function (message) {
            if (message.startsWith(world.name + ' - Player Connected ')) {
                var _message$match = message.match(/ - Player Connected (.*) \| ([\d.]+) \| ([\w]{32})\s*$/),
                    _message$match2 = _slicedToArray(_message$match, 3),
                    name = _message$match2[1],
                    ip = _message$match2[2];

                handleJoinMessages(name, ip);
            } else if (message.startsWith(world.name + ' - Player Disconnected ')) {
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

/**
 * Internal function to get the latest chat messages.
 *
 * @return {Promise}
 */
function getMessages() {
    return worldStarted().then(function () {
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

/**
 * Internal function to figure out who sent a message.
 *
 * @example
 * var name = getUsername('SERVER: Hi there!');
 * //name == 'SERVER'
 * @param {string} message the message to parse.
 * @return {string} the name of the user who sent the message.
 */
function getUsername(message) {
    for (var i = 18; i > 4; i--) {
        var possibleName = message.substring(0, message.lastIndexOf(': ', i));
        if (world.online.includes(possibleName) || possibleName == 'SERVER') {
            return possibleName;
        }
    }
    // Should ideally never happen.
    return message.substring(0, message.lastIndexOf(': ', 18));
}

/**
 * Internal function to handle player joins.
 *
 * @param {string} name the name of the player joining.
 * @param {string} ip the ip of the player joining.
 */
function handleJoinMessages(name, ip) {
    if (!world.online.includes(name)) {
        world.online.push(name);
    }

    hook.check('world.join', name, ip);
}

/**
 * Internal function to handle player disconnections.
 *
 * @param {string} name the name of the player leaving.
 */
function handleLeaveMessages(name) {
    if (world.online.includes(name)) {
        world.online.splice(world.online.indexOf(name), 1);
        hook.check('world.leave', name);
    }
}

/**
 * Internal function to handle user chat
 *
 * @param {string} name the name of the user.
 * @param {string} message the message sent.
 */
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
        return; //not chat
    }

    hook.check('world.chat', name, message);
}

/**
 * Internal function used to handle messages which are not simply parsed.
 *
 * @param {string} message the message to handle
 */
function handleOtherMessages(message) {
    hook.check('world.other', message);
}

},{"./ajax":8,"./bhfansapi":9,"./hook":11}],11:[function(require,module,exports){
'use strict';

var listeners = {};

/**
 * Function used to begin listening to an event.
 *
 * @example
 * listen('event', console.log);
 * //alternatively
 * on('event', console.log);
 * @param {string} key the event to listen to.
 * @param {Function} callback the event handler
 */
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

/**
 * Function used to stop listening to an event. If the listener was not found, no action will be taken.
 *
 * @example
 * //Earlier attached myFunc to 'event'
 * remove('event', myFunc);
 * @param {string} key the event to stop listening to.
 * @param {Function} callback the callback to remove from the event listeners.
 */
function remove(key, callback) {
    key = key.toLocaleLowerCase();
    if (listeners[key]) {
        if (listeners[key].includes(callback)) {
            listeners[key].splice(listeners[key].indexOf(callback), 1);
        }
    }
}

/**
 * Function used to call events.
 *
 * @example
 * check('test', 1, 2, 3);
 * check('test', true);
 * // alternatively
 * fire('test', 1, 2, 3);
 * fire('test', true);
 * @param {string} key the event to call.
 * @param {mixed} args any arguments to pass to listening functions.
 */
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

/**
 * Function used to update a value based on input from listeners.
 *
 * @depricated since 6.1.0. Instead, update requests should be handled by the extension iteself.
 *
 * @example
 * update('event', true, 1, 2, 3);
 * @param {string} key the event to call
 * @param {mixed} initial the initial value to be passed to listeners.
 * @param {mixed} args any additional arguments to be passed to listeners.
 * @return {mixed}
 */
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

},{}],12:[function(require,module,exports){
'use strict';

module.exports = {
    getString: getString,
    getObject: getObject,
    set: set,
    clearNamespace: clearNamespace
};

//REVIEW: Is there a better way to do this? require('./config') maybe?
var NAMESPACE = window.worldId;

/**
 * Gets a string from the storage if it exists and returns it, otherwise returns fallback.
 *
 * @example
 * var x = getString('stored_prefs', 'nothing');
 * var y = getString('stored_prefs', 'nothing', false);
 *
 * @param {string} key the key to retrieve.
 * @param {mixed} fallback what to return if the key was not found.
 * @param {bool} [local=true] whether or not to use a namespace when checking for the key.
 * @return {mixed}
 */
function getString(key, fallback) {
    var local = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    var result;
    if (local) {
        result = localStorage.getItem('' + key + NAMESPACE);
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
 * @param {string} key the item to retrieve.
 * @param {mixed} fallback what to return if the item does not exist or fails to parse correctly.
 * @param {bool} [local=true] whether or not a namespace should be used.
 * @return {mixed}
 */
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

/**
 * Sets an object in the storage, stringifying it first if neccessary.
 *
 * @example
 * set('some_key', {a: [1, 2, 3], b: 'test'});
 * //returns '{"a":[1,2,3],"b":"test"}'
 * getString('some_key');
 * @param {string} key the item to overwrite or create.
 * @param {mixed} data any stringifyable type.
 * @param {bool} [local=true] whether to save the item with a namespace.
 */
function set(key, data) {
    var local = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    if (local) {
        key = '' + key + NAMESPACE;
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
 * @example
 * set('key_test', 1);
 * set('key_test2', 2);
 * clearNamespace('key_'); //both key_test and key_test2 have been removed.
 *
 * @param {string} namespace the prefix to check for when removing items.
 */
function clearNamespace(namespace) {
    Object.keys(localStorage).forEach(function (key) {
        if (key.startsWith(namespace)) {
            localStorage.removeItem(key);
        }
    });
}

},{}],13:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

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

/**
 * Checks if a player has joined the server.
 *
 * @param {string} name
 * @return {bool}
 */
function isPlayer(name) {
    return world.players.hasOwnProperty(name.toLocaleUpperCase());
}

/**
 * Checks if the player is the server
 *
 * @param {string} name
 * @return {bool}
 */
function isServer(name) {
    return name.toLocaleUpperCase() == 'SERVER';
}

/**
 * Checks if the player is the owner or server.
 *
 * @param {string} name
 * @return {bool}
 */
function isOwner(name) {
    return world.owner == name.toLocaleUpperCase() || isServer(name);
}

/**
 * Checks if the player is an admin
 *
 * @param {string} name
 * @return {bool}
 */
function isAdmin(name) {
    return world.lists.admin.includes(name.toLocaleUpperCase()) || isOwner(name);
}

/**
 * Checks if the player is a mod
 *
 * @param {string} name
 * @return {bool}
 */
function isMod(name) {
    return world.lists.mod.includes(name.toLocaleUpperCase());
}

/**
 * Checks if the player is a staff member.
 *
 * @param {string} name
 * @return {bool}
 */
function isStaff(name) {
    return isAdmin(name) || isMod(name);
}

/**
 * Checks if a player is online
 *
 * @param {string} name
 * @return {bool}
 */
function isOnline(name) {
    return world.online.includes(name.toLocaleUpperCase());
}

/**
 * Gets the number of times the player has joined the server.
 *
 * @param {string} name
 * @return {Number}
 */
function getJoins(name) {
    return isPlayer(name) ? world.players[name.toLocaleUpperCase()].joins : 0;
}

// Keep the online list up to date
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

// Keep players list up to date
hook.on('world.join', checkPlayerJoin);

/**
 * Internal function.
 * Removes admins from the mod list and creates the staff list.
 */
function buildStaffList() {
    world.lists.mod = world.lists.mod.filter(function (name) {
        return !isAdmin(name);
    });
    world.lists.staff = world.lists.admin.concat(world.lists.mod);
}

/**
 * Internal function.
 * Checks if a player has permission to perform a command
 *
 * @param {string} name
 * @param {string} command
 */
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

// Keep lists up to date
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

    if (un && world.lists[group].includes(target)) {
        world.lists[group].splice(world.lists[group].indexOf(target), 1);
        buildStaffList();
    } else if (!un && !world.lists[group].includes(target)) {
        world.lists[group].push(target);
        buildStaffList();
    }
});

/**
 * Internal function. Increments a player's joins.
 *
 * @param {string} name
 * @param {string} ip
 */
function checkPlayerJoin(name, ip) {
    if (world.players.hasOwnProperty(name)) {
        //Returning player
        world.players[name].joins++;
        if (!world.players[name].ips.includes(ip)) {
            world.players[name].ips.push(ip);
        }
    } else {
        //New player
        world.players[name] = { joins: 1, ips: [ip] };
    }
    world.players[name].ip = ip;

    // Otherwise, we will double parse joins
    storage.set(STORAGE.LOG_LOAD, Math.floor(Date.now().valueOf()));
    storage.set(STORAGE.PLAYERS, world.players);
}

// Update lists
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

// Update players since last bot load
Promise.all([api.getLogs(), api.getWorldName()]).then(function (values) {
    var _values2 = _slicedToArray(values, 2),
        lines = _values2[0],
        worldName = _values2[1];

    var last = storage.getObject(STORAGE.LOG_LOAD, 0);
    storage.set(STORAGE.LOG_LOAD, Math.floor(Date.now().valueOf()));

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var line = _step.value;

            var time = new Date(line.substring(0, line.indexOf('b')).replace(' ', 'T').replace(' ', 'Z'));
            var message = line.substring(line.indexOf(']') + 2);

            if (time < last) {
                continue;
            }

            if (message.startsWith(worldName + ' - Player Connected ')) {
                var parts = line.substr(line.indexOf(' - Player Connected ') + 20); //NAME | IP | ID

                var _parts$match = parts.match(/(.*) \| ([\w.]+) \| .{32}\s*/),
                    _parts$match2 = _slicedToArray(_parts$match, 3),
                    name = _parts$match2[1],
                    ip = _parts$match2[2];

                checkPlayerJoin(name, ip);
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

    storage.set(STORAGE.PLAYERS, world.players);
});

},{"./blockheads":10,"./hook":11,"./storage":12}],14:[function(require,module,exports){
'use strict';

var ui = require('ui');
var storage = require('libraries/storage');
var send = require('bot').send;
var preferences = require('settings/bot');

var tab = ui.addTab('Announcements', 'messages');
tab.innerHTML = "<template id=\"aTemplate\">\r\n    <div class=\"column is-full\">\r\n        <div class=\"box\">\r\n            <label>Send:</label>\r\n            <textarea class=\"m\"></textarea>\r\n            <a>Delete</a>\r\n        </div>\r\n        <div>\r\n            Wait X minutes...\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_announcements\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3>These are sent according to a regular schedule.</h3>\r\n        <span>If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span>\r\n    </section>\r\n    <div id=\"aMsgs\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

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

// Announcements collection
var announcements = storage.getObject('announcementArr', []);

// Show saved announcements
announcements.map(function (ann) {
    return ann.message;
}).forEach(addMessage);

// Sends announcements after the specified delay.
function announcementCheck(i) {
    i = i >= announcements.length ? 0 : i;

    var ann = announcements[i];

    if (ann && ann.message) {
        send(ann.message);
    }
    setTimeout(announcementCheck, preferences.announcementDelay * 60000, i + 1);
}

},{"bot":3,"libraries/storage":12,"settings/bot":23,"ui":28}],15:[function(require,module,exports){
'use strict';

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

},{"bot":3,"libraries/world":13}],16:[function(require,module,exports){
'use strict';

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

},{"libraries/world":13}],17:[function(require,module,exports){
'use strict';

Object.assign(module.exports, require('./buildMessage'), require('./checkJoinsAndGroup'), require('./showSummary'));

},{"./buildMessage":15,"./checkJoinsAndGroup":16,"./showSummary":18}],18:[function(require,module,exports){
'use strict';

module.exports = {
    showSummary: showSummary
};

/**
 * Helper function to create and display a summary of the options changed.
 *
 * @param {Node} container the message container which needs an updated summary.
 */
function showSummary(container) {
    var out = container.querySelector('.summary');

    if (!out) {
        return;
    }

    var group = container.querySelector('[data-target="group"]').value;
    var not_group = container.querySelector('[data-target="not_group"]').value;
    var joins_low = container.querySelector('[data-target="joins_low"]').value;
    var joins_high = container.querySelector('[data-target="joins_high"]').value;

    var groupsAltered = group != 'all' || not_group != 'nobody';
    var joinsAltered = joins_low != "0" || joins_high != "9999";

    if (groupsAltered && joinsAltered) {
        out.textContent = group + ' / not ' + not_group + ' and ' + joins_low + ' \u2264 joins \u2264 ' + joins_high;
    } else if (groupsAltered) {
        out.textContent = group + ' / not ' + not_group;
    } else if (joinsAltered) {
        out.textContent = joins_low + ' \u2264 joins \u2264 ' + joins_high;
    } else {
        out.textContent = '';
    }
}

},{}],19:[function(require,module,exports){
'use strict';

var ui = require('ui');

var helpers = require('./helpers');

var el = document.createElement('style');
el.innerHTML = "#mb_join>h3,#mb_leave>h3,#mb_trigger>h3,#mb_announcements>h3{margin:0 0 5px 6em}#mb_join>span,#mb_leave>span,#mb_trigger>span,#mb_announcements>span{margin-left:6em}#mb_join input,#mb_join textarea,#mb_leave input,#mb_leave textarea,#mb_trigger input,#mb_trigger textarea,#mb_announcements input,#mb_announcements textarea{border:2px solid #666;width:100%}#mb_join textarea,#mb_leave textarea,#mb_trigger textarea,#mb_announcements textarea{resize:none;overflow:hidden;padding:1px 0;height:21px;transition:height 0.25s}#mb_join textarea:focus,#mb_leave textarea:focus,#mb_trigger textarea:focus,#mb_announcements textarea:focus{height:5em}#mb_join input[type=\"number\"],#mb_leave input[type=\"number\"],#mb_trigger input[type=\"number\"],#mb_announcements input[type=\"number\"]{width:5em}#jMsgs,#lMsgs,#tMsgs,#aMsgs{border-top:1px solid #000}#jMsgs small,#lMsgs small,#tMsgs small,#aMsgs small{color:#777}\n";
document.head.appendChild(el);

ui.addTabGroup('Messages', 'messages');

[require('./join'), require('./leave'), require('./trigger'), require('./announcements')].forEach(function (_ref) {
    var tab = _ref.tab,
        save = _ref.save,
        addMessage = _ref.addMessage,
        start = _ref.start;

    tab.addEventListener('click', function checkDelete(event) {
        if (event.target.tagName != 'A') {
            return;
        }

        ui.alert('Really delete this message?', [{ text: 'Yes', style: 'is-danger', action: function action() {
                var el = event.target;
                while ((el = el.parentElement) && !el.classList.contains('column')) {}
                el.remove();
                save();
            } }, { text: 'Cancel' }]);
    });

    tab.addEventListener('change', save);

    tab.querySelector('.button.is-primary').addEventListener('click', function () {
        return addMessage();
    });

    // Don't start responding to chat for 10 seconds
    setTimeout(start, 10000);
});

[require('./join'), require('./leave'), require('./trigger')].forEach(function (_ref2) {
    var tab = _ref2.tab;

    tab.addEventListener('change', function (event) {
        var el = event.target;
        while ((el = el.parentElement) && !el.classList.contains('column')) {}

        helpers.showSummary(el);
    });
});

},{"./announcements":14,"./helpers":17,"./join":20,"./leave":21,"./trigger":22,"ui":28}],20:[function(require,module,exports){
'use strict';

var ui = require('ui');

var storage = require('libraries/storage');
var hook = require('libraries/hook');
var helpers = require('messages/helpers');

var STORAGE_ID = 'joinArr';

var tab = ui.addTab('Join', 'messages');
tab.innerHTML = "<template id=\"jTemplate\">\r\n    <div class=\"column is-one-third-desktop is-half-tablet\">\r\n        <div class=\"box\">\r\n            <label> Message: <textarea class=\"m\"></textarea></label>\r\n            <details><summary>More options <small class=\"summary\"></small></summary>\r\n                <label>Player is: <select data-target=\"group\">\r\n                    <option value=\"all\">anyone</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <label>Player is not: <select data-target=\"not_group\">\r\n                    <option value=\"nobody\">nobody</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n                <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n            </details>\r\n            <a>Delete</a>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_join\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3>These are checked when a player joins the server.</h3>\r\n        <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    </section>\r\n    <div id=\"jMsgs\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

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

Array.from(tab.querySelectorAll('#jMsgs > div')).forEach(helpers.showSummary);

/**
 * Function to add a trigger message to the page.
 */
function addMessage() {
    var msg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    ui.buildContentFromTemplate('#jTemplate', '#jMsgs', [{ selector: 'option', remove: ['selected'], multiple: true }, { selector: '.m', text: msg.message || '' }, { selector: '[data-target="joins_low"]', value: msg.joins_low || 0 }, { selector: '[data-target="joins_high"]', value: msg.joins_high || 9999 }, { selector: '[data-target="group"] [value="' + (msg.group || 'all') + '"]', selected: 'selected' }, { selector: '[data-target="not_group"] [value="' + (msg.not_group || 'nobody') + '"]', selected: 'selected' }]);
}

/**
 * Function used to save the user's messages.
 */
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

/**
 * Function used to listen to player joins
 *
 * @param {string} name
 */
function onJoin(name) {
    joinMessages.forEach(function (msg) {
        if (helpers.checkJoinsAndGroup(name, msg)) {
            helpers.buildAndSendMessage(msg.message, name);
        }
    });
}

},{"libraries/hook":11,"libraries/storage":12,"messages/helpers":17,"ui":28}],21:[function(require,module,exports){
'use strict';

var ui = require('ui');

var storage = require('libraries/storage');
var hook = require('libraries/hook');
var helpers = require('messages/helpers');

var STORAGE_ID = 'leaveArr';

var tab = ui.addTab('Leave', 'messages');
tab.innerHTML = "<template id=\"lTemplate\">\r\n    <div class=\"column is-one-third-desktop is-half-tablet\">\r\n        <div class=\"box\">\r\n            <label>Message <textarea class=\"m\"></textarea></label>\r\n            <details><summary>More options <small class=\"summary\"></small></summary>\r\n                <label>Player is: <select data-target=\"group\">\r\n                    <option value=\"all\">anyone</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <label>Player is not: <select data-target=\"not_group\">\r\n                    <option value=\"nobody\">nobody</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n                <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n            </details>\r\n            <a>Delete</a>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_leave\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3>These are checked when a player leaves the server.</h3>\r\n        <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    </section>\r\n    <div id=\"lMsgs\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

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

Array.from(tab.querySelectorAll('#lMsgs > div')).forEach(helpers.showSummary);

/**
 * Adds a leave message to the page.
 */
function addMessage() {
    var msg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    ui.buildContentFromTemplate('#lTemplate', '#lMsgs', [{ selector: 'option', remove: ['selected'], multiple: true }, { selector: '.m', text: msg.message || '' }, { selector: '[data-target="joins_low"]', value: msg.joins_low || 0 }, { selector: '[data-target="joins_high"]', value: msg.joins_high || 9999 }, { selector: '[data-target="group"] [value="' + (msg.group || 'all') + '"]', selected: 'selected' }, { selector: '[data-target="not_group"] [value="' + (msg.not_group || 'nobody') + '"]', selected: 'selected' }]);
}

/**
 * Function used to save the current leave messages
 */
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

/**
 * Function used to listen to player disconnections.
 *
 * @param {string} name the player leaving.
 */
function onLeave(name) {
    leaveMessages.forEach(function (msg) {
        if (helpers.checkJoinsAndGroup(name, msg)) {
            helpers.buildAndSendMessage(msg.message, name);
        }
    });
}

},{"libraries/hook":11,"libraries/storage":12,"messages/helpers":17,"ui":28}],22:[function(require,module,exports){
'use strict';

var ui = require('ui');

var storage = require('libraries/storage');
var hook = require('libraries/hook');
var helpers = require('messages/helpers');
var settings = require('settings/bot');

var STORAGE_ID = 'triggerArr';

var tab = ui.addTab('Trigger', 'messages');
tab.innerHTML = "<template id=\"tTemplate\">\r\n    <div class=\"column is-one-third-desktop is-half-tablet\">\r\n        <div class=\"box\">\r\n            <label>Trigger: <input class=\"t\"></label>\r\n            <label>Message: <textarea class=\"m\"></textarea></label>\r\n            <details><summary>More options <small class=\"summary\"></small></summary>\r\n                <label>Player is: <select data-target=\"group\">\r\n                    <option value=\"all\">anyone</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <label>Player is not: <select data-target=\"not_group\">\r\n                    <option value=\"nobody\">nobody</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n                <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n            </details>\r\n            <a>Delete</a>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_trigger\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3>These are checked whenever someone says something.</h3>\r\n        <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger \"te*st\" will match \"tea stuff\" and \"test\")</span>\r\n    </section>\r\n    <div id=\"tMsgs\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

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
Array.from(tab.querySelectorAll('#tMsgs > div')).forEach(helpers.showSummary);

/**
 * Adds a trigger message to the page.
 */
function addMessage() {
    var msg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    ui.buildContentFromTemplate('#tTemplate', '#tMsgs', [{ selector: 'option', remove: ['selected'], multiple: true }, { selector: '.m', text: msg.message || '' }, { selector: '.t', value: msg.trigger || '' }, { selector: '[data-target="joins_low"]', value: msg.joins_low || 0 }, { selector: '[data-target="joins_high"]', value: msg.joins_high || 9999 }, { selector: '[data-target="group"] [value="' + (msg.group || 'all') + '"]', selected: 'selected' }, { selector: '[data-target="not_group"] [value="' + (msg.not_group || 'nobody') + '"]', selected: 'selected' }]);
}

/**
 * Saves the current trigger messages.
 */
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

/**
 * Checks a trigger against a message to see if it matches.
 *
 * @param {string} trigger the trigger to try to match
 * @param {string} message
 */
function triggerMatch(trigger, message) {
    if (settings.regexTriggers) {
        try {
            return new RegExp(trigger, 'i').test(message);
        } catch (e) {
            ui.notify('Skipping trigger \'' + trigger + '\' as the RegEx is invaild.');
            return false;
        }
    }
    return new RegExp(trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*"), 'i').test(message);
}

/**
 * Function used to check incoming player messages for triggers
 *
 * @param {string} name the player's name
 * @param {string} message
 */
function checkTriggers(name, message) {
    var totalAllowed = settings.maxResponses;
    triggerMessages.forEach(function (msg) {
        if (totalAllowed && helpers.checkJoinsAndGroup(name, msg) && triggerMatch(msg.trigger, message)) {
            helpers.buildAndSendMessage(msg.message, name);
            totalAllowed--;
        }
    });
}

},{"libraries/hook":11,"libraries/storage":12,"messages/helpers":17,"settings/bot":23,"ui":28}],23:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var storage = require('libraries/storage');
var STORAGE_ID = 'mb_preferences';

var prefs = storage.getObject(STORAGE_ID, {}, false);

// Set the default settings
[{ type: 'number', key: 'announcementDelay', default: 10 }, { type: 'number', key: 'maxResponses', default: 2 }, { type: 'boolean', key: 'notify', default: true },
// Advanced
{ type: 'boolean', key: 'disableTrim', default: false }, { type: 'boolean', key: 'regexTriggers', default: false }, { type: 'boolean', key: 'splitMessages', default: false }, { type: 'string', key: 'splitToken', default: '<split>' }].forEach(function (pref) {
    // Set defaults if not set
    if (_typeof(prefs[pref.key]) != pref.type) {
        prefs[pref.key] = pref.default;
    }
});

// Auto save on change
// IE (all) / Safari (< 10) doesn't support proxies
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

},{"libraries/storage":12}],24:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var ui = require('ui');
var prefs = require('settings/bot');

var tab = ui.addTab('Bot', 'settings');
tab.innerHTML = "<div id=\"mb_settings\" class=\"container\">\r\n    <h3 class=\"title\">General Settings</h3>\r\n    <label>Minutes between announcements</label>\r\n    <p class=\"control\">\r\n        <input class=\"input\" data-key=\"announcementDelay\" type=\"number\"><br>\r\n    </p>\r\n    <label>Maximum trigger responses to a message</label>\r\n    <p class=\"control\">\r\n        <input class=\"input\" data-key=\"maxResponses\" type=\"number\">\r\n    </p>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input data-key=\"notify\" type=\"checkbox\">\r\n            New chat notifications\r\n        </label>\r\n    </p>\r\n\r\n    <hr>\r\n\r\n    <h3 class=\"title\">Advanced Settings</h3>\r\n    <div class=\"message is-warning\">\r\n        <div class=\"message-header\">\r\n            <p>Warning</p>\r\n        </div>\r\n        <div class=\"message-body\">\r\n            <p>Changing these options can result in unexpected behavior. <a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/1.-Advanced-Options/\" target=\"_blank\">Read this first</a></p>\r\n        </div>\r\n    </div>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input data-key=\"regexTriggers\" type=\"checkbox\">\r\n            Parse triggers as RegEx\r\n        </label>\r\n    </p>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input data-key=\"disableTrim\" type=\"checkbox\">\r\n            Disable whitespace trimming\r\n        </label>\r\n    </p>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input data-key=\"splitMessages\" type=\"checkbox\">\r\n            Split messages\r\n        </label>\r\n    </p>\r\n    <label class=\"label\">Split token:</label>\r\n    <p class=\"control\">\r\n        <input class=\"input\" data-key=\"splitToken\" type=\"text\">\r\n    </p>\r\n\r\n    <hr>\r\n\r\n    <h3 class=\"title\">Backup / Restore</h3>\r\n    <a class=\"button\" id=\"mb_backup_save\">Get backup code</a>\r\n    <a class=\"button\" id=\"mb_backup_load\">Import backup</a>\r\n</div>\r\n";

// Show prefs
Object.keys(prefs).forEach(function (key) {
    var el = tab.querySelector('[data-key="' + key + '"]');
    switch (_typeof(prefs[key])) {
        case 'boolean':
            el.checked = prefs[key];
            break;
        default:
            el.value = prefs[key];
    }
});

// Watch for changes
tab.addEventListener('change', function save() {
    var getValue = function getValue(key) {
        return tab.querySelector('[data-key="' + key + '"]').value;
    };
    var getInt = function getInt(key) {
        return +getValue(key);
    };
    var getChecked = function getChecked(key) {
        return tab.querySelector('[data-key="' + key + '"]').checked;
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

// Get backup
tab.querySelector('#mb_backup_save').addEventListener('click', function showBackup() {
    var backup = JSON.stringify(localStorage).replace(/</g, '&lt;');
    ui.alert('Copy this to a safe place:<br><textarea class="textarea">' + backup + '</textarea>');
});

// Load backup
tab.querySelector('#mb_backup_load').addEventListener('click', function loadBackup() {
    ui.alert('Enter the backup code:<textarea class="textarea"></textarea>', [{ text: 'Load & refresh page', style: 'is-success', action: function action() {
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

},{"settings/bot":23,"ui":28}],25:[function(require,module,exports){
'use strict';

var bhfansapi = require('libraries/bhfansapi');
var ui = require('ui');
var hook = require('libraries/hook');
var MessageBotExtension = require('MessageBotExtension');

var tab = ui.addTab('Extensions', 'settings');
tab.innerHTML = '<style>' + "@keyframes spinAround{from{transform:rotate(0deg)}to{transform:rotate(359deg)}}#exts{border-top:1px solid #000}@media screen and (min-width: 769px){#exts .card-content{height:105px}}\n" + '</style>' + "<template id=\"extTemplate\">\r\n    <div class=\"column is-one-third-desktop is-half-tablet\">\r\n        <div class=\"card\">\r\n            <header class=\"card-header\">\r\n                <p class=\"card-header-title\"></p>\r\n            </header>\r\n            <div class=\"card-content\">\r\n                <span class=\"content\"></span>\r\n            </div>\r\n            <div class=\"card-footer\">\r\n                <a class=\"card-footer-item\">Install</a>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_extensions\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">Load By ID/URL</span>\r\n        <h3>Extensions can increase the functionality of the bot.</h3>\r\n        <span>Interested in creating one? <a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/2.-Development:-Start-Here\" target=\"_blank\">Start here.</a></span>\r\n    </section>\r\n    <div id=\"exts\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

/**
 * Internal function used to add a card for an extension.
 *
 * extension is expected to contain a title, snippet, and id
 */
function addExtensionCard(extension) {
    if (!tab.querySelector('#mb_extensions [data-id="' + extension.id + '"]')) {
        ui.buildContentFromTemplate('#extTemplate', '#exts', [{ selector: '.card-header-title', text: extension.title }, { selector: '.content', html: extension.snippet }, {
            selector: '.card-footer-item',
            text: MessageBotExtension.isLoaded(extension.id) ? 'Remove' : 'Install',
            'data-id': extension.id
        }]);
    }
}

//Create the extension store page
bhfansapi.getStore().then(function (resp) {
    if (resp.status != 'ok') {
        document.getElementById('exts').innerHTML += resp.message;
        throw new Error(resp.message);
    }
    resp.extensions.forEach(addExtensionCard);
}).catch(bhfansapi.reportError);

// Install / uninstall extensions
tab.querySelector('#exts').addEventListener('click', function extActions(e) {
    var el = e.target;
    var id = el.dataset.id;

    if (!id) {
        return;
    }

    if (el.textContent == 'Install') {
        MessageBotExtension.install(id);
    } else {
        MessageBotExtension.uninstall(id);
    }
});

tab.querySelector('.button').addEventListener('click', function loadExtension() {
    ui.alert('Enter the ID or URL of an extension:<br><input class="input"/>', [{ text: 'Load', style: 'is-success', action: function action() {
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

hook.on('extension.install', function (id) {
    // Show remove to let users remove extensions
    var button = document.querySelector('#mb_extensions [data-id="' + id + '"]');
    if (button) {
        button.textContent = 'Remove';
    } else {
        bhfansapi.getExtensionInfo(id).then(addExtensionCard);
    }
});

hook.on('extension.uninstall', function (id) {
    // Show removed for store install button
    var button = document.querySelector('#mb_extensions [data-id="' + id + '"]');
    if (button) {
        button.textContent = 'Removed';
        button.disabled = true;
        setTimeout(function () {
            button.textContent = 'Install';
            button.disabled = false;
        }, 3000);
    }
});

},{"MessageBotExtension":1,"libraries/bhfansapi":9,"libraries/hook":11,"ui":28}],26:[function(require,module,exports){
'use strict';

var ui = require('ui');
ui.addTabGroup('Settings', 'settings');

require('./bot/page');
require('./extensions');

},{"./bot/page":24,"./extensions":25,"ui":28}],27:[function(require,module,exports){
'use strict';

// Overwrite the pollChat function to kill the default chat function
window.pollChat = function () {};

// Overwrite the old page
document.body.innerHTML = '';
// Style reset
Array.from(document.querySelectorAll('[type="text/css"]')).forEach(function (el) {
    return el.remove();
});

document.querySelector('title').textContent = 'Console - MessageBot';

// Set the icon to the blockhead icon used on the forums
var el = document.createElement('link');
el.rel = 'icon';
el.href = 'https://is.gd/MBvUHF';
document.head.appendChild(el);

require('console-browserify');
require('bot/migration');

var bhfansapi = require('libraries/bhfansapi');
var hook = require('libraries/hook');
var ui = require('ui');
hook.on('error_report', function (msg) {
    ui.notify(msg);
});

// just require(console) doesn't work as console is a browserify module.
require('./console');
// By default no tab is selected, show the console.
document.querySelector('.nav-slider-container span').click();
require('messages');
require('settings');

// Error reporting
window.addEventListener('error', function (err) {
    if (!['Script error.', 'World not running', 'Network Error'].includes(err.message)) {
        bhfansapi.reportError(err);
    }
});

// Expose the extension API
window.MessageBotExtension = require('MessageBotExtension');

},{"./console":7,"MessageBotExtension":1,"bot/migration":4,"console-browserify":37,"libraries/bhfansapi":9,"libraries/hook":11,"messages":19,"settings":26,"ui":28}],28:[function(require,module,exports){
'use strict';

require('./polyfills/details');

// Build the API
Object.assign(module.exports, require('./layout'), require('./template'), require('./notifications'));

// Functions which are no longer contained in this module, but are retained for now for backward compatability.
var write = require('../console/exports').write;
module.exports.addMessageToConsole = function (msg) {
    var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    var nameClass = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

    console.warn('ui.addMessageToConsole has been depricated. Use ex.console.write instead.');
    write(msg, name, nameClass);
};

},{"../console/exports":6,"./layout":29,"./notifications":31,"./polyfills/details":33,"./template":35}],29:[function(require,module,exports){
'use strict';

/**
 * @file Contains functions for managing the page layout
 */

var hook = require('libraries/hook');

// Build page - only case in which body.innerHTML should be used.
document.body.innerHTML += "<header class=\"header is-fixed-top\">\r\n  <nav class=\"nav-inverse nav has-shadow\">\r\n    <div class=\"nav-left\">\r\n      <div class=\"nav-item nav-slider-toggle\">\r\n        <img src=\"https://i.imgsafe.org/80a1129a36.png\">\r\n      </div>\r\n      <a class=\"nav-item is-tab nav-slider-toggle\">\r\n        Menu\r\n      </a>\r\n    </div>\r\n  </nav>\r\n</header>\r\n\r\n<div class=\"nav-slider-container\">\r\n    <nav class=\"nav-slider\" data-tab-group=\"main\"></nav>\r\n    <div class=\"is-overlay\"></div>\r\n</div>\r\n\r\n<div id=\"container\" class=\"has-fixed-nav\"></div>\r\n";
document.head.innerHTML += '<style>' + "html{overflow-y:auto !important}/*! bulma.io v0.3.1 | MIT License | github.com/jgthms/bulma */@keyframes spinAround{from{transform:rotate(0deg)}to{transform:rotate(359deg)}}/*! minireset.css v0.0.2 | MIT License | github.com/jgthms/minireset.css */html,body,p,ol,ul,li,dl,dt,dd,blockquote,figure,fieldset,legend,textarea,pre,iframe,hr,h1,h2,h3,h4,h5,h6{margin:0;padding:0}h1,h2,h3,h4,h5,h6{font-size:100%;font-weight:normal}ul{list-style:none}button,input,select,textarea{margin:0}html{box-sizing:border-box}*{box-sizing:inherit}*:before,*:after{box-sizing:inherit}img,embed,object,audio,video{height:auto;max-width:100%}iframe{border:0}table{border-collapse:collapse;border-spacing:0}td,th{padding:0;text-align:left}html{background-color:#fff;font-size:14px;-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;min-width:300px;overflow-x:hidden;overflow-y:scroll;text-rendering:optimizeLegibility}article,aside,figure,footer,header,hgroup,section{display:block}body,button,input,select,textarea{font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",\"Roboto\",\"Oxygen\",\"Ubuntu\",\"Cantarell\",\"Fira Sans\",\"Droid Sans\",\"Helvetica Neue\",\"Helvetica\",\"Arial\",sans-serif}code,pre{-moz-osx-font-smoothing:auto;-webkit-font-smoothing:auto;font-family:\"Inconsolata\",\"Consolas\",\"Monaco\",monospace}body{color:#4a4a4a;font-size:1rem;font-weight:400;line-height:1.5}a{color:#182b73;cursor:pointer;text-decoration:none;transition:none 86ms ease-out}a:hover{color:#363636}code{background-color:#f5f5f5;color:red;font-size:0.8em;font-weight:normal;padding:0.25em 0.5em 0.25em}hr{background-color:#dbdbdb;border:none;display:block;height:1px;margin:1.5rem 0}img{max-width:100%}input[type=\"checkbox\"],input[type=\"radio\"]{vertical-align:baseline}small{font-size:0.8em}span{font-style:inherit;font-weight:inherit}strong{color:#363636;font-weight:700}pre{background-color:#f5f5f5;color:#4a4a4a;font-size:0.8em;white-space:pre;word-wrap:normal}pre code{background:none;color:inherit;display:block;font-size:1em;overflow-x:auto;padding:1.25rem 1.5rem}table{width:100%}table td,table th{text-align:left;vertical-align:top}table th{color:#363636}.is-block{display:block}@media screen and (max-width: 768px){.is-block-mobile{display:block !important}}@media screen and (min-width: 769px){.is-block-tablet{display:block !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-block-tablet-only{display:block !important}}@media screen and (max-width: 999px){.is-block-touch{display:block !important}}@media screen and (min-width: 1000px){.is-block-desktop{display:block !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-block-desktop-only{display:block !important}}@media screen and (min-width: 1192px){.is-block-widescreen{display:block !important}}.is-flex{display:flex}@media screen and (max-width: 768px){.is-flex-mobile{display:flex !important}}@media screen and (min-width: 769px){.is-flex-tablet{display:flex !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-flex-tablet-only{display:flex !important}}@media screen and (max-width: 999px){.is-flex-touch{display:flex !important}}@media screen and (min-width: 1000px){.is-flex-desktop{display:flex !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-flex-desktop-only{display:flex !important}}@media screen and (min-width: 1192px){.is-flex-widescreen{display:flex !important}}.is-inline{display:inline}@media screen and (max-width: 768px){.is-inline-mobile{display:inline !important}}@media screen and (min-width: 769px){.is-inline-tablet{display:inline !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-tablet-only{display:inline !important}}@media screen and (max-width: 999px){.is-inline-touch{display:inline !important}}@media screen and (min-width: 1000px){.is-inline-desktop{display:inline !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-desktop-only{display:inline !important}}@media screen and (min-width: 1192px){.is-inline-widescreen{display:inline !important}}.is-inline-block{display:inline-block}@media screen and (max-width: 768px){.is-inline-block-mobile{display:inline-block !important}}@media screen and (min-width: 769px){.is-inline-block-tablet{display:inline-block !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-block-tablet-only{display:inline-block !important}}@media screen and (max-width: 999px){.is-inline-block-touch{display:inline-block !important}}@media screen and (min-width: 1000px){.is-inline-block-desktop{display:inline-block !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-block-desktop-only{display:inline-block !important}}@media screen and (min-width: 1192px){.is-inline-block-widescreen{display:inline-block !important}}.is-inline-flex{display:inline-flex}@media screen and (max-width: 768px){.is-inline-flex-mobile{display:inline-flex !important}}@media screen and (min-width: 769px){.is-inline-flex-tablet{display:inline-flex !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-flex-tablet-only{display:inline-flex !important}}@media screen and (max-width: 999px){.is-inline-flex-touch{display:inline-flex !important}}@media screen and (min-width: 1000px){.is-inline-flex-desktop{display:inline-flex !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-flex-desktop-only{display:inline-flex !important}}@media screen and (min-width: 1192px){.is-inline-flex-widescreen{display:inline-flex !important}}.is-clearfix:after{clear:both;content:\" \";display:table}.is-pulled-left{float:left}.is-pulled-right{float:right}.is-clipped{overflow:hidden !important}.is-overlay{bottom:0;left:0;position:absolute;right:0;top:0}.has-text-centered{text-align:center}.has-text-left{text-align:left}.has-text-right{text-align:right}.is-hidden{display:none !important}@media screen and (max-width: 768px){.is-hidden-mobile{display:none !important}}@media screen and (min-width: 769px){.is-hidden-tablet{display:none !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-hidden-tablet-only{display:none !important}}@media screen and (max-width: 999px){.is-hidden-touch{display:none !important}}@media screen and (min-width: 1000px){.is-hidden-desktop{display:none !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-hidden-desktop-only{display:none !important}}@media screen and (min-width: 1192px){.is-hidden-widescreen{display:none !important}}.is-disabled{pointer-events:none}.is-marginless{margin:0 !important}.is-paddingless{padding:0 !important}.is-unselectable{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.box{background-color:#fff;border-radius:5px;box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px rgba(10,10,10,0.1);display:block;padding:1.25rem}.box:not(:last-child){margin-bottom:1.5rem}a.box:hover,a.box:focus{box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px #182b73}a.box:active{box-shadow:inset 0 1px 2px rgba(10,10,10,0.2),0 0 0 1px #182b73}.button{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-color:#fff;border:1px solid #dbdbdb;color:#363636;cursor:pointer;justify-content:center;padding-left:0.75em;padding-right:0.75em;text-align:center;white-space:nowrap}.button:focus,.button.is-focused,.button:active,.button.is-active{outline:none}.button[disabled],.button.is-disabled{pointer-events:none}.button strong{color:inherit}.button .icon:first-child:not(:last-child){margin-left:-.25rem;margin-right:.5rem}.button .icon:last-child:not(:first-child){margin-left:.5rem;margin-right:-.25rem}.button .icon:first-child:last-child{margin-left:calc(-1px + -.25rem);margin-right:calc(-1px + -.25rem)}.button .icon.is-small:first-child:not(:last-child){margin-left:0rem}.button .icon.is-small:last-child:not(:first-child){margin-right:0rem}.button .icon.is-small:first-child:last-child{margin-left:calc(-1px + 0rem);margin-right:calc(-1px + 0rem)}.button .icon.is-medium:first-child:not(:last-child){margin-left:-.5rem}.button .icon.is-medium:last-child:not(:first-child){margin-right:-.5rem}.button .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.5rem);margin-right:calc(-1px + -.5rem)}.button .icon.is-large:first-child:not(:last-child){margin-left:-1rem}.button .icon.is-large:last-child:not(:first-child){margin-right:-1rem}.button .icon.is-large:first-child:last-child{margin-left:calc(-1px + -1rem);margin-right:calc(-1px + -1rem)}.button:hover,.button.is-hovered{border-color:#b5b5b5;color:#363636}.button:focus,.button.is-focused{border-color:#182b73;box-shadow:0 0 0.5em rgba(24,43,115,0.25);color:#363636}.button:active,.button.is-active{border-color:#4a4a4a;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#363636}.button.is-link{background-color:transparent;border-color:transparent;color:#4a4a4a;text-decoration:underline}.button.is-link:hover,.button.is-link.is-hovered,.button.is-link:focus,.button.is-link.is-focused,.button.is-link:active,.button.is-link.is-active{background-color:#f5f5f5;color:#363636}.button.is-white{background-color:#fff;border-color:transparent;color:#0a0a0a}.button.is-white:hover,.button.is-white.is-hovered{background-color:#f9f9f9;border-color:transparent;color:#0a0a0a}.button.is-white:focus,.button.is-white.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,255,255,0.25);color:#0a0a0a}.button.is-white:active,.button.is-white.is-active{background-color:#f2f2f2;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#0a0a0a}.button.is-white.is-inverted{background-color:#0a0a0a;color:#fff}.button.is-white.is-inverted:hover{background-color:#000}.button.is-white.is-loading:after{border-color:transparent transparent #0a0a0a #0a0a0a !important}.button.is-white.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-white.is-outlined:hover,.button.is-white.is-outlined:focus{background-color:#fff;border-color:#fff;color:#0a0a0a}.button.is-white.is-inverted.is-outlined{background-color:transparent;border-color:#0a0a0a;color:#0a0a0a}.button.is-white.is-inverted.is-outlined:hover,.button.is-white.is-inverted.is-outlined:focus{background-color:#0a0a0a;color:#fff}.button.is-black{background-color:#0a0a0a;border-color:transparent;color:#fff}.button.is-black:hover,.button.is-black.is-hovered{background-color:#040404;border-color:transparent;color:#fff}.button.is-black:focus,.button.is-black.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(10,10,10,0.25);color:#fff}.button.is-black:active,.button.is-black.is-active{background-color:#000;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-black.is-inverted{background-color:#fff;color:#0a0a0a}.button.is-black.is-inverted:hover{background-color:#f2f2f2}.button.is-black.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-black.is-outlined{background-color:transparent;border-color:#0a0a0a;color:#0a0a0a}.button.is-black.is-outlined:hover,.button.is-black.is-outlined:focus{background-color:#0a0a0a;border-color:#0a0a0a;color:#fff}.button.is-black.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-black.is-inverted.is-outlined:hover,.button.is-black.is-inverted.is-outlined:focus{background-color:#fff;color:#0a0a0a}.button.is-light{background-color:#f5f5f5;border-color:transparent;color:#363636}.button.is-light:hover,.button.is-light.is-hovered{background-color:#eee;border-color:transparent;color:#363636}.button.is-light:focus,.button.is-light.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(245,245,245,0.25);color:#363636}.button.is-light:active,.button.is-light.is-active{background-color:#e8e8e8;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#363636}.button.is-light.is-inverted{background-color:#363636;color:#f5f5f5}.button.is-light.is-inverted:hover{background-color:#292929}.button.is-light.is-loading:after{border-color:transparent transparent #363636 #363636 !important}.button.is-light.is-outlined{background-color:transparent;border-color:#f5f5f5;color:#f5f5f5}.button.is-light.is-outlined:hover,.button.is-light.is-outlined:focus{background-color:#f5f5f5;border-color:#f5f5f5;color:#363636}.button.is-light.is-inverted.is-outlined{background-color:transparent;border-color:#363636;color:#363636}.button.is-light.is-inverted.is-outlined:hover,.button.is-light.is-inverted.is-outlined:focus{background-color:#363636;color:#f5f5f5}.button.is-dark{background-color:#363636;border-color:transparent;color:#f5f5f5}.button.is-dark:hover,.button.is-dark.is-hovered{background-color:#2f2f2f;border-color:transparent;color:#f5f5f5}.button.is-dark:focus,.button.is-dark.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(54,54,54,0.25);color:#f5f5f5}.button.is-dark:active,.button.is-dark.is-active{background-color:#292929;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#f5f5f5}.button.is-dark.is-inverted{background-color:#f5f5f5;color:#363636}.button.is-dark.is-inverted:hover{background-color:#e8e8e8}.button.is-dark.is-loading:after{border-color:transparent transparent #f5f5f5 #f5f5f5 !important}.button.is-dark.is-outlined{background-color:transparent;border-color:#363636;color:#363636}.button.is-dark.is-outlined:hover,.button.is-dark.is-outlined:focus{background-color:#363636;border-color:#363636;color:#f5f5f5}.button.is-dark.is-inverted.is-outlined{background-color:transparent;border-color:#f5f5f5;color:#f5f5f5}.button.is-dark.is-inverted.is-outlined:hover,.button.is-dark.is-inverted.is-outlined:focus{background-color:#f5f5f5;color:#363636}.button.is-primary{background-color:#182b73;border-color:transparent;color:#fff}.button.is-primary:hover,.button.is-primary.is-hovered{background-color:#162768;border-color:transparent;color:#fff}.button.is-primary:focus,.button.is-primary.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(24,43,115,0.25);color:#fff}.button.is-primary:active,.button.is-primary.is-active{background-color:#14235e;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-primary.is-inverted{background-color:#fff;color:#182b73}.button.is-primary.is-inverted:hover{background-color:#f2f2f2}.button.is-primary.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-primary.is-outlined{background-color:transparent;border-color:#182b73;color:#182b73}.button.is-primary.is-outlined:hover,.button.is-primary.is-outlined:focus{background-color:#182b73;border-color:#182b73;color:#fff}.button.is-primary.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-primary.is-inverted.is-outlined:hover,.button.is-primary.is-inverted.is-outlined:focus{background-color:#fff;color:#182b73}.button.is-info{background-color:#3273dc;border-color:transparent;color:#fff}.button.is-info:hover,.button.is-info.is-hovered{background-color:#276cda;border-color:transparent;color:#fff}.button.is-info:focus,.button.is-info.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(50,115,220,0.25);color:#fff}.button.is-info:active,.button.is-info.is-active{background-color:#2366d1;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-info.is-inverted{background-color:#fff;color:#3273dc}.button.is-info.is-inverted:hover{background-color:#f2f2f2}.button.is-info.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-info.is-outlined{background-color:transparent;border-color:#3273dc;color:#3273dc}.button.is-info.is-outlined:hover,.button.is-info.is-outlined:focus{background-color:#3273dc;border-color:#3273dc;color:#fff}.button.is-info.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-info.is-inverted.is-outlined:hover,.button.is-info.is-inverted.is-outlined:focus{background-color:#fff;color:#3273dc}.button.is-success{background-color:#23d160;border-color:transparent;color:#fff}.button.is-success:hover,.button.is-success.is-hovered{background-color:#22c65b;border-color:transparent;color:#fff}.button.is-success:focus,.button.is-success.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(35,209,96,0.25);color:#fff}.button.is-success:active,.button.is-success.is-active{background-color:#20bc56;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-success.is-inverted{background-color:#fff;color:#23d160}.button.is-success.is-inverted:hover{background-color:#f2f2f2}.button.is-success.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-success.is-outlined{background-color:transparent;border-color:#23d160;color:#23d160}.button.is-success.is-outlined:hover,.button.is-success.is-outlined:focus{background-color:#23d160;border-color:#23d160;color:#fff}.button.is-success.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-success.is-inverted.is-outlined:hover,.button.is-success.is-inverted.is-outlined:focus{background-color:#fff;color:#23d160}.button.is-warning{background-color:#ffdd57;border-color:transparent;color:rgba(0,0,0,0.7)}.button.is-warning:hover,.button.is-warning.is-hovered{background-color:#ffdb4a;border-color:transparent;color:rgba(0,0,0,0.7)}.button.is-warning:focus,.button.is-warning.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,221,87,0.25);color:rgba(0,0,0,0.7)}.button.is-warning:active,.button.is-warning.is-active{background-color:#ffd83d;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted{background-color:rgba(0,0,0,0.7);color:#ffdd57}.button.is-warning.is-inverted:hover{background-color:rgba(0,0,0,0.7)}.button.is-warning.is-loading:after{border-color:transparent transparent rgba(0,0,0,0.7) rgba(0,0,0,0.7) !important}.button.is-warning.is-outlined{background-color:transparent;border-color:#ffdd57;color:#ffdd57}.button.is-warning.is-outlined:hover,.button.is-warning.is-outlined:focus{background-color:#ffdd57;border-color:#ffdd57;color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted.is-outlined{background-color:transparent;border-color:rgba(0,0,0,0.7);color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted.is-outlined:hover,.button.is-warning.is-inverted.is-outlined:focus{background-color:rgba(0,0,0,0.7);color:#ffdd57}.button.is-danger{background-color:red;border-color:transparent;color:#fff}.button.is-danger:hover,.button.is-danger.is-hovered{background-color:#f20000;border-color:transparent;color:#fff}.button.is-danger:focus,.button.is-danger.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,0,0,0.25);color:#fff}.button.is-danger:active,.button.is-danger.is-active{background-color:#e60000;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-danger.is-inverted{background-color:#fff;color:red}.button.is-danger.is-inverted:hover{background-color:#f2f2f2}.button.is-danger.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-danger.is-outlined{background-color:transparent;border-color:red;color:red}.button.is-danger.is-outlined:hover,.button.is-danger.is-outlined:focus{background-color:red;border-color:red;color:#fff}.button.is-danger.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-danger.is-inverted.is-outlined:hover,.button.is-danger.is-inverted.is-outlined:focus{background-color:#fff;color:red}.button.is-small{border-radius:2px;font-size:.75rem}.button.is-small .icon:first-child:not(:last-child){margin-left:-.375rem;margin-right:.375rem}.button.is-small .icon:last-child:not(:first-child){margin-left:.375rem;margin-right:-.375rem}.button.is-small .icon:first-child:last-child{margin-left:calc(-1px + -.375rem);margin-right:calc(-1px + -.375rem)}.button.is-small .icon.is-small:first-child:not(:last-child){margin-left:-.125rem}.button.is-small .icon.is-small:last-child:not(:first-child){margin-right:-.125rem}.button.is-small .icon.is-small:first-child:last-child{margin-left:calc(-1px + -.125rem);margin-right:calc(-1px + -.125rem)}.button.is-small .icon.is-medium:first-child:not(:last-child){margin-left:-.625rem}.button.is-small .icon.is-medium:last-child:not(:first-child){margin-right:-.625rem}.button.is-small .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.625rem);margin-right:calc(-1px + -.625rem)}.button.is-small .icon.is-large:first-child:not(:last-child){margin-left:-1.125rem}.button.is-small .icon.is-large:last-child:not(:first-child){margin-right:-1.125rem}.button.is-small .icon.is-large:first-child:last-child{margin-left:calc(-1px + -1.125rem);margin-right:calc(-1px + -1.125rem)}.button.is-medium{font-size:1.25rem}.button.is-medium .icon:first-child:not(:last-child){margin-left:-.125rem;margin-right:.625rem}.button.is-medium .icon:last-child:not(:first-child){margin-left:.625rem;margin-right:-.125rem}.button.is-medium .icon:first-child:last-child{margin-left:calc(-1px + -.125rem);margin-right:calc(-1px + -.125rem)}.button.is-medium .icon.is-small:first-child:not(:last-child){margin-left:.125rem}.button.is-medium .icon.is-small:last-child:not(:first-child){margin-right:.125rem}.button.is-medium .icon.is-small:first-child:last-child{margin-left:calc(-1px + .125rem);margin-right:calc(-1px + .125rem)}.button.is-medium .icon.is-medium:first-child:not(:last-child){margin-left:-.375rem}.button.is-medium .icon.is-medium:last-child:not(:first-child){margin-right:-.375rem}.button.is-medium .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.375rem);margin-right:calc(-1px + -.375rem)}.button.is-medium .icon.is-large:first-child:not(:last-child){margin-left:-.875rem}.button.is-medium .icon.is-large:last-child:not(:first-child){margin-right:-.875rem}.button.is-medium .icon.is-large:first-child:last-child{margin-left:calc(-1px + -.875rem);margin-right:calc(-1px + -.875rem)}.button.is-large{font-size:1.5rem}.button.is-large .icon:first-child:not(:last-child){margin-left:0rem;margin-right:.75rem}.button.is-large .icon:last-child:not(:first-child){margin-left:.75rem;margin-right:0rem}.button.is-large .icon:first-child:last-child{margin-left:calc(-1px + 0rem);margin-right:calc(-1px + 0rem)}.button.is-large .icon.is-small:first-child:not(:last-child){margin-left:.25rem}.button.is-large .icon.is-small:last-child:not(:first-child){margin-right:.25rem}.button.is-large .icon.is-small:first-child:last-child{margin-left:calc(-1px + .25rem);margin-right:calc(-1px + .25rem)}.button.is-large .icon.is-medium:first-child:not(:last-child){margin-left:-.25rem}.button.is-large .icon.is-medium:last-child:not(:first-child){margin-right:-.25rem}.button.is-large .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.25rem);margin-right:calc(-1px + -.25rem)}.button.is-large .icon.is-large:first-child:not(:last-child){margin-left:-.75rem}.button.is-large .icon.is-large:last-child:not(:first-child){margin-right:-.75rem}.button.is-large .icon.is-large:first-child:last-child{margin-left:calc(-1px + -.75rem);margin-right:calc(-1px + -.75rem)}.button[disabled],.button.is-disabled{opacity:0.5}.button.is-fullwidth{display:flex;width:100%}.button.is-loading{color:transparent !important;pointer-events:none}.button.is-loading:after{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1rem;position:relative;width:1rem;left:50%;margin-left:-8px;margin-top:-8px;position:absolute;top:50%;position:absolute !important}.content{color:#4a4a4a}.content:not(:last-child){margin-bottom:1.5rem}.content li+li{margin-top:0.25em}.content p:not(:last-child),.content ol:not(:last-child),.content ul:not(:last-child),.content blockquote:not(:last-child),.content table:not(:last-child){margin-bottom:1em}.content h1,.content h2,.content h3,.content h4,.content h5,.content h6{color:#363636;font-weight:400;line-height:1.125}.content h1{font-size:2em;margin-bottom:0.5em}.content h1:not(:first-child){margin-top:1em}.content h2{font-size:1.75em;margin-bottom:0.5714em}.content h2:not(:first-child){margin-top:1.1428em}.content h3{font-size:1.5em;margin-bottom:0.6666em}.content h3:not(:first-child){margin-top:1.3333em}.content h4{font-size:1.25em;margin-bottom:0.8em}.content h5{font-size:1.125em;margin-bottom:0.8888em}.content h6{font-size:1em;margin-bottom:1em}.content blockquote{background-color:#f5f5f5;border-left:5px solid #dbdbdb;padding:1.25em 1.5em}.content ol{list-style:decimal outside;margin-left:2em;margin-right:2em;margin-top:1em}.content ul{list-style:disc outside;margin-left:2em;margin-right:2em;margin-top:1em}.content ul ul{list-style-type:circle;margin-top:0.5em}.content ul ul ul{list-style-type:square}.content table{width:100%}.content table td,.content table th{border:1px solid #dbdbdb;border-width:0 0 1px;padding:0.5em 0.75em;vertical-align:top}.content table th{color:#363636;text-align:left}.content table tr:hover{background-color:#f5f5f5}.content table thead td,.content table thead th{border-width:0 0 2px;color:#363636}.content table tfoot td,.content table tfoot th{border-width:2px 0 0;color:#363636}.content table tbody tr:last-child td,.content table tbody tr:last-child th{border-bottom-width:0}.content.is-small{font-size:.75rem}.content.is-medium{font-size:1.25rem}.content.is-large{font-size:1.5rem}.input,.textarea{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;background-color:#fff;border:1px solid #dbdbdb;color:#363636;box-shadow:inset 0 1px 2px rgba(10,10,10,0.1);max-width:100%;width:100%}.input:focus,.input.is-focused,.input:active,.input.is-active,.textarea:focus,.textarea.is-focused,.textarea:active,.textarea.is-active{outline:none}.input[disabled],.input.is-disabled,.textarea[disabled],.textarea.is-disabled{pointer-events:none}.input:hover,.input.is-hovered,.textarea:hover,.textarea.is-hovered{border-color:#b5b5b5}.input:focus,.input.is-focused,.input:active,.input.is-active,.textarea:focus,.textarea.is-focused,.textarea:active,.textarea.is-active{border-color:#182b73}.input[disabled],.input.is-disabled,.textarea[disabled],.textarea.is-disabled{background-color:#f5f5f5;border-color:#f5f5f5;box-shadow:none;color:#7a7a7a}.input[disabled]::-moz-placeholder,.input.is-disabled::-moz-placeholder,.textarea[disabled]::-moz-placeholder,.textarea.is-disabled::-moz-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]::-webkit-input-placeholder,.input.is-disabled::-webkit-input-placeholder,.textarea[disabled]::-webkit-input-placeholder,.textarea.is-disabled::-webkit-input-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]:-moz-placeholder,.input.is-disabled:-moz-placeholder,.textarea[disabled]:-moz-placeholder,.textarea.is-disabled:-moz-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]:-ms-input-placeholder,.input.is-disabled:-ms-input-placeholder,.textarea[disabled]:-ms-input-placeholder,.textarea.is-disabled:-ms-input-placeholder{color:rgba(54,54,54,0.3)}.input[type=\"search\"],.textarea[type=\"search\"]{border-radius:290486px}.input.is-white,.textarea.is-white{border-color:#fff}.input.is-black,.textarea.is-black{border-color:#0a0a0a}.input.is-light,.textarea.is-light{border-color:#f5f5f5}.input.is-dark,.textarea.is-dark{border-color:#363636}.input.is-primary,.textarea.is-primary{border-color:#182b73}.input.is-info,.textarea.is-info{border-color:#3273dc}.input.is-success,.textarea.is-success{border-color:#23d160}.input.is-warning,.textarea.is-warning{border-color:#ffdd57}.input.is-danger,.textarea.is-danger{border-color:red}.input.is-small,.textarea.is-small{border-radius:2px;font-size:.75rem}.input.is-medium,.textarea.is-medium{font-size:1.25rem}.input.is-large,.textarea.is-large{font-size:1.5rem}.input.is-fullwidth,.textarea.is-fullwidth{display:block;width:100%}.input.is-inline,.textarea.is-inline{display:inline;width:auto}.textarea{display:block;line-height:1.25;max-height:600px;max-width:100%;min-height:120px;min-width:100%;padding:10px;resize:vertical}.checkbox,.radio{align-items:center;cursor:pointer;display:inline-flex;flex-wrap:wrap;justify-content:flex-start;position:relative;vertical-align:top}.checkbox input,.radio input{cursor:pointer;margin-right:0.5em}.checkbox:hover,.radio:hover{color:#363636}.checkbox.is-disabled,.radio.is-disabled{color:#7a7a7a;pointer-events:none}.checkbox.is-disabled input,.radio.is-disabled input{pointer-events:none}.radio+.radio{margin-left:0.5em}.select{display:inline-block;height:2.5em;position:relative;vertical-align:top}.select:after{border:1px solid #182b73;border-right:0;border-top:0;content:\" \";display:block;height:0.5em;pointer-events:none;position:absolute;transform:rotate(-45deg);width:0.5em;margin-top:-0.375em;right:1.125em;top:50%;z-index:4}.select select{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;background-color:#fff;border:1px solid #dbdbdb;color:#363636;cursor:pointer;display:block;font-size:1em;outline:none;padding-right:2.5em}.select select:focus,.select select.is-focused,.select select:active,.select select.is-active{outline:none}.select select[disabled],.select select.is-disabled{pointer-events:none}.select select:hover,.select select.is-hovered{border-color:#b5b5b5}.select select:focus,.select select.is-focused,.select select:active,.select select.is-active{border-color:#182b73}.select select[disabled],.select select.is-disabled{background-color:#f5f5f5;border-color:#f5f5f5;box-shadow:none;color:#7a7a7a}.select select[disabled]::-moz-placeholder,.select select.is-disabled::-moz-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]::-webkit-input-placeholder,.select select.is-disabled::-webkit-input-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]:-moz-placeholder,.select select.is-disabled:-moz-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]:-ms-input-placeholder,.select select.is-disabled:-ms-input-placeholder{color:rgba(54,54,54,0.3)}.select select:hover{border-color:#b5b5b5}.select select::ms-expand{display:none}.select:hover:after{border-color:#363636}.select.is-small{border-radius:2px;font-size:.75rem}.select.is-medium{font-size:1.25rem}.select.is-large{font-size:1.5rem}.select.is-fullwidth{width:100%}.select.is-fullwidth select{width:100%}.label{color:#363636;display:block;font-weight:bold}.label:not(:last-child){margin-bottom:0.5em}.help{display:block;font-size:.75rem;margin-top:5px}.help.is-white{color:#fff}.help.is-black{color:#0a0a0a}.help.is-light{color:#f5f5f5}.help.is-dark{color:#363636}.help.is-primary{color:#182b73}.help.is-info{color:#3273dc}.help.is-success{color:#23d160}.help.is-warning{color:#ffdd57}.help.is-danger{color:red}@media screen and (max-width: 768px){.control-label{margin-bottom:0.5em}}@media screen and (min-width: 769px){.control-label{flex-basis:0;flex-grow:1;flex-shrink:0;margin-right:1.5em;padding-top:0.5em;text-align:right}}.control{position:relative;text-align:left}.control:not(:last-child){margin-bottom:0.75rem}.control.has-addons{display:flex;justify-content:flex-start}.control.has-addons .button,.control.has-addons .input,.control.has-addons .select{border-radius:0;margin-right:-1px;width:auto}.control.has-addons .button:hover,.control.has-addons .input:hover,.control.has-addons .select:hover{z-index:2}.control.has-addons .button:focus,.control.has-addons .button:active,.control.has-addons .input:focus,.control.has-addons .input:active,.control.has-addons .select:focus,.control.has-addons .select:active{z-index:3}.control.has-addons .button:first-child,.control.has-addons .input:first-child,.control.has-addons .select:first-child{border-radius:3px 0 0 3px}.control.has-addons .button:first-child select,.control.has-addons .input:first-child select,.control.has-addons .select:first-child select{border-radius:3px 0 0 3px}.control.has-addons .button:last-child,.control.has-addons .input:last-child,.control.has-addons .select:last-child{border-radius:0 3px 3px 0}.control.has-addons .button:last-child select,.control.has-addons .input:last-child select,.control.has-addons .select:last-child select{border-radius:0 3px 3px 0}.control.has-addons .button.is-expanded,.control.has-addons .input.is-expanded,.control.has-addons .select.is-expanded{flex-grow:1;flex-shrink:0}.control.has-addons .select select:hover{z-index:2}.control.has-addons .select select:focus,.control.has-addons .select select:active{z-index:3}.control.has-addons.has-addons-centered{justify-content:center}.control.has-addons.has-addons-right{justify-content:flex-end}.control.has-addons.has-addons-fullwidth .button,.control.has-addons.has-addons-fullwidth .input,.control.has-addons.has-addons-fullwidth .select{flex-grow:1;flex-shrink:0}.control.has-icon .icon{color:#dbdbdb;pointer-events:none;position:absolute;top:1.25rem;z-index:4}.control.has-icon .input:focus+.icon{color:#7a7a7a}.control.has-icon .input.is-small+.icon{top:.9375rem}.control.has-icon .input.is-medium+.icon{top:1.5625rem}.control.has-icon .input.is-large+.icon{top:1.875rem}.control.has-icon:not(.has-icon-right) .icon{left:1.25rem;transform:translateX(-50%) translateY(-50%)}.control.has-icon:not(.has-icon-right) .input{padding-left:2.5em}.control.has-icon:not(.has-icon-right) .input.is-small+.icon{left:.9375rem}.control.has-icon:not(.has-icon-right) .input.is-medium+.icon{left:1.5625rem}.control.has-icon:not(.has-icon-right) .input.is-large+.icon{left:1.875rem}.control.has-icon.has-icon-right .icon{right:1.25rem;transform:translateX(50%) translateY(-50%)}.control.has-icon.has-icon-right .input{padding-right:2.5em}.control.has-icon.has-icon-right .input.is-small+.icon{right:.9375rem}.control.has-icon.has-icon-right .input.is-medium+.icon{right:1.5625rem}.control.has-icon.has-icon-right .input.is-large+.icon{right:1.875rem}.control.is-grouped{display:flex;justify-content:flex-start}.control.is-grouped>.control{flex-basis:0;flex-shrink:0}.control.is-grouped>.control:not(:last-child){margin-bottom:0;margin-right:0.75rem}.control.is-grouped>.control.is-expanded{flex-grow:1;flex-shrink:1}.control.is-grouped.is-grouped-centered{justify-content:center}.control.is-grouped.is-grouped-right{justify-content:flex-end}@media screen and (min-width: 769px){.control.is-horizontal{display:flex}.control.is-horizontal>.control{display:flex;flex-basis:0;flex-grow:5;flex-shrink:1}}.control.is-loading:after{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1rem;position:relative;width:1rem;position:absolute !important;right:0.75em;top:0.75em}.icon{display:inline-block;font-size:21px;height:1.5rem;line-height:1.5rem;text-align:center;vertical-align:top;width:1.5rem}.icon .fa{font-size:inherit;line-height:inherit}.icon.is-small{display:inline-block;font-size:14px;height:1rem;line-height:1rem;text-align:center;vertical-align:top;width:1rem}.icon.is-medium{display:inline-block;font-size:28px;height:2rem;line-height:2rem;text-align:center;vertical-align:top;width:2rem}.icon.is-large{display:inline-block;font-size:42px;height:3rem;line-height:3rem;text-align:center;vertical-align:top;width:3rem}.image{display:block;position:relative}.image img{display:block;height:auto;width:100%}.image.is-square img,.image.is-1by1 img,.image.is-4by3 img,.image.is-3by2 img,.image.is-16by9 img,.image.is-2by1 img{bottom:0;left:0;position:absolute;right:0;top:0;height:100%;width:100%}.image.is-square,.image.is-1by1{padding-top:100%}.image.is-4by3{padding-top:75%}.image.is-3by2{padding-top:66.6666%}.image.is-16by9{padding-top:56.25%}.image.is-2by1{padding-top:50%}.image.is-16x16{height:16px;width:16px}.image.is-24x24{height:24px;width:24px}.image.is-32x32{height:32px;width:32px}.image.is-48x48{height:48px;width:48px}.image.is-64x64{height:64px;width:64px}.image.is-96x96{height:96px;width:96px}.image.is-128x128{height:128px;width:128px}.notification{background-color:#f5f5f5;border-radius:3px;padding:1.25rem 2.5rem 1.25rem 1.5rem;position:relative}.notification:not(:last-child){margin-bottom:1.5rem}.notification code,.notification pre{background:#fff}.notification pre code{background:transparent}.notification .delete{position:absolute;right:0.5em;top:0.5em}.notification .title,.notification .subtitle,.notification .content{color:inherit}.notification.is-white{background-color:#fff;color:#0a0a0a}.notification.is-black{background-color:#0a0a0a;color:#fff}.notification.is-light{background-color:#f5f5f5;color:#363636}.notification.is-dark{background-color:#363636;color:#f5f5f5}.notification.is-primary{background-color:#182b73;color:#fff}.notification.is-info{background-color:#3273dc;color:#fff}.notification.is-success{background-color:#23d160;color:#fff}.notification.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.notification.is-danger{background-color:red;color:#fff}.progress{-moz-appearance:none;-webkit-appearance:none;border:none;border-radius:290486px;display:block;height:1rem;overflow:hidden;padding:0;width:100%}.progress:not(:last-child){margin-bottom:1.5rem}.progress::-webkit-progress-bar{background-color:#dbdbdb}.progress::-webkit-progress-value{background-color:#4a4a4a}.progress::-moz-progress-bar{background-color:#4a4a4a}.progress.is-white::-webkit-progress-value{background-color:#fff}.progress.is-white::-moz-progress-bar{background-color:#fff}.progress.is-black::-webkit-progress-value{background-color:#0a0a0a}.progress.is-black::-moz-progress-bar{background-color:#0a0a0a}.progress.is-light::-webkit-progress-value{background-color:#f5f5f5}.progress.is-light::-moz-progress-bar{background-color:#f5f5f5}.progress.is-dark::-webkit-progress-value{background-color:#363636}.progress.is-dark::-moz-progress-bar{background-color:#363636}.progress.is-primary::-webkit-progress-value{background-color:#182b73}.progress.is-primary::-moz-progress-bar{background-color:#182b73}.progress.is-info::-webkit-progress-value{background-color:#3273dc}.progress.is-info::-moz-progress-bar{background-color:#3273dc}.progress.is-success::-webkit-progress-value{background-color:#23d160}.progress.is-success::-moz-progress-bar{background-color:#23d160}.progress.is-warning::-webkit-progress-value{background-color:#ffdd57}.progress.is-warning::-moz-progress-bar{background-color:#ffdd57}.progress.is-danger::-webkit-progress-value{background-color:red}.progress.is-danger::-moz-progress-bar{background-color:red}.progress.is-small{height:.75rem}.progress.is-medium{height:1.25rem}.progress.is-large{height:1.5rem}.table{background-color:#fff;color:#363636;margin-bottom:1.5rem;width:100%}.table td,.table th{border:1px solid #dbdbdb;border-width:0 0 1px;padding:0.5em 0.75em;vertical-align:top}.table td.is-narrow,.table th.is-narrow{white-space:nowrap;width:1%}.table th{color:#363636;text-align:left}.table tr:hover{background-color:#fafafa}.table thead td,.table thead th{border-width:0 0 2px;color:#7a7a7a}.table tfoot td,.table tfoot th{border-width:2px 0 0;color:#7a7a7a}.table tbody tr:last-child td,.table tbody tr:last-child th{border-bottom-width:0}.table.is-bordered td,.table.is-bordered th{border-width:1px}.table.is-bordered tr:last-child td,.table.is-bordered tr:last-child th{border-bottom-width:1px}.table.is-narrow td,.table.is-narrow th{padding:0.25em 0.5em}.table.is-striped tbody tr:nth-child(even){background-color:#fafafa}.table.is-striped tbody tr:nth-child(even):hover{background-color:#f5f5f5}.tag{align-items:center;background-color:#f5f5f5;border-radius:290486px;color:#4a4a4a;display:inline-flex;font-size:.75rem;height:2em;justify-content:center;line-height:1.5;padding-left:0.875em;padding-right:0.875em;vertical-align:top;white-space:nowrap}.tag .delete{margin-left:0.25em;margin-right:-0.5em}.tag.is-white{background-color:#fff;color:#0a0a0a}.tag.is-black{background-color:#0a0a0a;color:#fff}.tag.is-light{background-color:#f5f5f5;color:#363636}.tag.is-dark{background-color:#363636;color:#f5f5f5}.tag.is-primary{background-color:#182b73;color:#fff}.tag.is-info{background-color:#3273dc;color:#fff}.tag.is-success{background-color:#23d160;color:#fff}.tag.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.tag.is-danger{background-color:red;color:#fff}.tag.is-medium{font-size:1rem}.tag.is-large{font-size:1.25rem}.title,.subtitle{word-break:break-word}.title:not(:last-child),.subtitle:not(:last-child){margin-bottom:1.5rem}.title em,.title span,.subtitle em,.subtitle span{font-weight:300}.title strong,.subtitle strong{font-weight:500}.title .tag,.subtitle .tag{vertical-align:middle}.title{color:#363636;font-size:2rem;font-weight:300;line-height:1.125}.title strong{color:inherit}.title+.highlight{margin-top:-0.75rem}.title+.subtitle{margin-top:-1.25rem}.title.is-1{font-size:3.5rem}.title.is-2{font-size:2.75rem}.title.is-3{font-size:2rem}.title.is-4{font-size:1.5rem}.title.is-5{font-size:1.25rem}.title.is-6{font-size:14px}.subtitle{color:#4a4a4a;font-size:1.25rem;font-weight:300;line-height:1.25}.subtitle strong{color:#363636}.subtitle+.title{margin-top:-1.5rem}.subtitle.is-1{font-size:3.5rem}.subtitle.is-2{font-size:2.75rem}.subtitle.is-3{font-size:2rem}.subtitle.is-4{font-size:1.5rem}.subtitle.is-5{font-size:1.25rem}.subtitle.is-6{font-size:14px}.block:not(:last-child){margin-bottom:1.5rem}.container{position:relative}@media screen and (min-width: 1000px){.container{margin:0 auto;max-width:960px}.container.is-fluid{margin:0 20px;max-width:none}}@media screen and (min-width: 1192px){.container{max-width:1152px}}.delete{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-moz-appearance:none;-webkit-appearance:none;background-color:rgba(10,10,10,0.2);border:none;border-radius:290486px;cursor:pointer;display:inline-block;font-size:1rem;height:20px;outline:none;position:relative;transform:rotate(45deg);transform-origin:center center;vertical-align:top;width:20px}.delete:before,.delete:after{background-color:#fff;content:\"\";display:block;left:50%;position:absolute;top:50%;transform:translateX(-50%) translateY(-50%)}.delete:before{height:2px;width:50%}.delete:after{height:50%;width:2px}.delete:hover,.delete:focus{background-color:rgba(10,10,10,0.3)}.delete:active{background-color:rgba(10,10,10,0.4)}.delete.is-small{height:14px;width:14px}.delete.is-medium{height:26px;width:26px}.delete.is-large{height:30px;width:30px}.fa{font-size:21px;text-align:center;vertical-align:top}.heading{display:block;font-size:11px;letter-spacing:1px;margin-bottom:5px;text-transform:uppercase}.highlight{font-weight:400;max-width:100%;overflow:hidden;padding:0}.highlight:not(:last-child){margin-bottom:1.5rem}.highlight pre{overflow:auto;max-width:100%}.loader{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1rem;position:relative;width:1rem}.number{align-items:center;background-color:#f5f5f5;border-radius:290486px;display:inline-flex;font-size:1.25rem;height:2em;justify-content:center;margin-right:1.5rem;min-width:2.5em;padding:0.25rem 0.5rem;text-align:center;vertical-align:top}.card-header{align-items:stretch;box-shadow:0 1px 2px rgba(10,10,10,0.1);display:flex}.card-header-title{align-items:center;color:#363636;display:flex;flex-grow:1;font-weight:700;padding:0.75rem}.card-header-icon{align-items:center;cursor:pointer;display:flex;justify-content:center;padding:0.75rem}.card-image{display:block;position:relative}.card-content{padding:1.5rem}.card-content .title+.subtitle{margin-top:-1.5rem}.card-footer{border-top:1px solid #dbdbdb;align-items:stretch;display:flex}.card-footer-item{align-items:center;display:flex;flex-basis:0;flex-grow:1;flex-shrink:0;justify-content:center;padding:0.75rem}.card-footer-item:not(:last-child){border-right:1px solid #dbdbdb}.card{background-color:#fff;box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px rgba(10,10,10,0.1);color:#4a4a4a;max-width:100%;position:relative}.card .media:not(:last-child){margin-bottom:0.75rem}.level-item{align-items:center;display:flex;flex-basis:auto;flex-grow:0;flex-shrink:0;justify-content:center}.level-item .title,.level-item .subtitle{margin-bottom:0}@media screen and (max-width: 768px){.level-item:not(:last-child){margin-bottom:0.75rem}}.level-left,.level-right{flex-basis:auto;flex-grow:0;flex-shrink:0}.level-left .level-item:not(:last-child),.level-right .level-item:not(:last-child){margin-right:0.75rem}.level-left .level-item.is-flexible,.level-right .level-item.is-flexible{flex-grow:1}.level-left{align-items:center;justify-content:flex-start}@media screen and (max-width: 768px){.level-left+.level-right{margin-top:1.5rem}}@media screen and (min-width: 769px){.level-left{display:flex}}.level-right{align-items:center;justify-content:flex-end}@media screen and (min-width: 769px){.level-right{display:flex}}.level{align-items:center;justify-content:space-between}.level:not(:last-child){margin-bottom:1.5rem}.level code{border-radius:3px}.level img{display:inline-block;vertical-align:top}.level.is-mobile{display:flex}.level.is-mobile>.level-item:not(:last-child){margin-bottom:0}.level.is-mobile>.level-item:not(.is-narrow){flex-grow:1}@media screen and (min-width: 769px){.level{display:flex}.level>.level-item:not(.is-narrow){flex-grow:1}}.media-left,.media-right{flex-basis:auto;flex-grow:0;flex-shrink:0}.media-left{margin-right:1rem}.media-right{margin-left:1rem}.media-content{flex-basis:auto;flex-grow:1;flex-shrink:1;text-align:left}.media{align-items:flex-start;display:flex;text-align:left}.media .content:not(:last-child){margin-bottom:0.75rem}.media .media{border-top:1px solid rgba(219,219,219,0.5);display:flex;padding-top:0.75rem}.media .media .content:not(:last-child),.media .media .control:not(:last-child){margin-bottom:0.5rem}.media .media .media{padding-top:0.5rem}.media .media .media+.media{margin-top:0.5rem}.media+.media{border-top:1px solid rgba(219,219,219,0.5);margin-top:1rem;padding-top:1rem}.media.is-large+.media{margin-top:1.5rem;padding-top:1.5rem}.menu{font-size:1rem}.menu-list{line-height:1.25}.menu-list a{border-radius:2px;color:#4a4a4a;display:block;padding:0.5em 0.75em}.menu-list a:hover{background-color:#f5f5f5;color:#182b73}.menu-list a.is-active{background-color:#182b73;color:#fff}.menu-list li ul{border-left:1px solid #dbdbdb;margin:0.75em;padding-left:0.75em}.menu-label{color:#7a7a7a;font-size:0.8em;letter-spacing:0.1em;text-transform:uppercase}.menu-label:not(:first-child){margin-top:1em}.menu-label:not(:last-child){margin-bottom:1em}.message{background-color:#f5f5f5;border-radius:3px;font-size:1rem}.message:not(:last-child){margin-bottom:1.5rem}.message.is-white{background-color:#fff}.message.is-white .message-header{background-color:#fff;color:#0a0a0a}.message.is-white .message-body{border-color:#fff;color:#4d4d4d}.message.is-black{background-color:#fafafa}.message.is-black .message-header{background-color:#0a0a0a;color:#fff}.message.is-black .message-body{border-color:#0a0a0a;color:#090909}.message.is-light{background-color:#fafafa}.message.is-light .message-header{background-color:#f5f5f5;color:#363636}.message.is-light .message-body{border-color:#f5f5f5;color:#505050}.message.is-dark{background-color:#fafafa}.message.is-dark .message-header{background-color:#363636;color:#f5f5f5}.message.is-dark .message-body{border-color:#363636;color:#2a2a2a}.message.is-primary{background-color:#f7f8fd}.message.is-primary .message-header{background-color:#182b73;color:#fff}.message.is-primary .message-body{border-color:#182b73;color:#162662}.message.is-info{background-color:#f6f9fe}.message.is-info .message-header{background-color:#3273dc;color:#fff}.message.is-info .message-body{border-color:#3273dc;color:#22509a}.message.is-success{background-color:#f6fef9}.message.is-success .message-header{background-color:#23d160;color:#fff}.message.is-success .message-body{border-color:#23d160;color:#0e301a}.message.is-warning{background-color:#fffdf5}.message.is-warning .message-header{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.message.is-warning .message-body{border-color:#ffdd57;color:#3b3108}.message.is-danger{background-color:#fff5f5}.message.is-danger .message-header{background-color:red;color:#fff}.message.is-danger .message-body{border-color:red;color:#ad0606}.message-header{align-items:center;background-color:#4a4a4a;border-radius:3px 3px 0 0;color:#fff;display:flex;justify-content:space-between;line-height:1.25;padding:0.5em 0.75em;position:relative}.message-header a,.message-header strong{color:inherit}.message-header a{text-decoration:underline}.message-header .delete{flex-grow:0;flex-shrink:0;margin-left:0.75em}.message-header+.message-body{border-top-left-radius:0;border-top-right-radius:0;border-top:none}.message-body{border:1px solid #dbdbdb;border-radius:3px;color:#4a4a4a;padding:1em 1.25em}.message-body a,.message-body strong{color:inherit}.message-body a{text-decoration:underline}.message-body code,.message-body pre{background:#fff}.message-body pre code{background:transparent}.modal-background{bottom:0;left:0;position:absolute;right:0;top:0;background-color:rgba(10,10,10,0.86)}.modal-content,.modal-card{margin:0 20px;max-height:calc(100vh - 160px);overflow:auto;position:relative;width:100%}@media screen and (min-width: 769px){.modal-content,.modal-card{margin:0 auto;max-height:calc(100vh - 40px);width:640px}}.modal-close{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-moz-appearance:none;-webkit-appearance:none;background-color:rgba(10,10,10,0.2);border:none;border-radius:290486px;cursor:pointer;display:inline-block;font-size:1rem;height:20px;outline:none;position:relative;transform:rotate(45deg);transform-origin:center center;vertical-align:top;width:20px;background:none;height:40px;position:fixed;right:20px;top:20px;width:40px}.modal-close:before,.modal-close:after{background-color:#fff;content:\"\";display:block;left:50%;position:absolute;top:50%;transform:translateX(-50%) translateY(-50%)}.modal-close:before{height:2px;width:50%}.modal-close:after{height:50%;width:2px}.modal-close:hover,.modal-close:focus{background-color:rgba(10,10,10,0.3)}.modal-close:active{background-color:rgba(10,10,10,0.4)}.modal-close.is-small{height:14px;width:14px}.modal-close.is-medium{height:26px;width:26px}.modal-close.is-large{height:30px;width:30px}.modal-card{display:flex;flex-direction:column;max-height:calc(100vh - 40px);overflow:hidden}.modal-card-head,.modal-card-foot{align-items:center;background-color:#f5f5f5;display:flex;flex-shrink:0;justify-content:flex-start;padding:20px;position:relative}.modal-card-head{border-bottom:1px solid #dbdbdb;border-top-left-radius:5px;border-top-right-radius:5px}.modal-card-title{color:#363636;flex-grow:1;flex-shrink:0;font-size:1.5rem;line-height:1}.modal-card-foot{border-bottom-left-radius:5px;border-bottom-right-radius:5px;border-top:1px solid #dbdbdb}.modal-card-foot .button:not(:last-child){margin-right:10px}.modal-card-body{-webkit-overflow-scrolling:touch;background-color:#fff;flex-grow:1;flex-shrink:1;overflow:auto;padding:20px}.modal{bottom:0;left:0;position:absolute;right:0;top:0;align-items:center;display:none;justify-content:center;overflow:hidden;position:fixed;z-index:1986}.modal.is-active{display:flex}.nav-toggle{cursor:pointer;display:block;height:3.5rem;position:relative;width:3.5rem}.nav-toggle span{background-color:#4a4a4a;display:block;height:1px;left:50%;margin-left:-7px;position:absolute;top:50%;transition:none 86ms ease-out;transition-property:background, left, opacity, transform;width:15px}.nav-toggle span:nth-child(1){margin-top:-6px}.nav-toggle span:nth-child(2){margin-top:-1px}.nav-toggle span:nth-child(3){margin-top:4px}.nav-toggle:hover{background-color:#f5f5f5}.nav-toggle.is-active span{background-color:#182b73}.nav-toggle.is-active span:nth-child(1){margin-left:-5px;transform:rotate(45deg);transform-origin:left top}.nav-toggle.is-active span:nth-child(2){opacity:0}.nav-toggle.is-active span:nth-child(3){margin-left:-5px;transform:rotate(-45deg);transform-origin:left bottom}@media screen and (min-width: 769px){.nav-toggle{display:none}}.nav-item{align-items:center;display:flex;flex-grow:0;flex-shrink:0;font-size:1rem;justify-content:center;padding:0.5rem 0.75rem}.nav-item a{flex-grow:1;flex-shrink:0}.nav-item img{max-height:1.75rem}.nav-item .button+.button{margin-left:0.75rem}.nav-item .tag:first-child:not(:last-child){margin-right:0.5rem}.nav-item .tag:last-child:not(:first-child){margin-left:0.5rem}@media screen and (max-width: 768px){.nav-item{justify-content:flex-start}}.nav-item a,a.nav-item{color:#7a7a7a}.nav-item a:hover,a.nav-item:hover{color:#363636}.nav-item a.is-active,a.nav-item.is-active{color:#363636}.nav-item a.is-tab,a.nav-item.is-tab{border-bottom:1px solid transparent;border-top:1px solid transparent;padding-bottom:calc(0.5rem - 1px);padding-left:1rem;padding-right:1rem;padding-top:calc(0.5rem - 1px)}.nav-item a.is-tab:hover,a.nav-item.is-tab:hover{border-bottom-color:#182b73;border-top-color:transparent}.nav-item a.is-tab.is-active,a.nav-item.is-tab.is-active{border-bottom:3px solid #182b73;color:#182b73;padding-bottom:calc(0.5rem - 3px)}@media screen and (min-width: 1000px){.nav-item a.is-brand,a.nav-item.is-brand{padding-left:0}}@media screen and (max-width: 768px){.nav-menu{background-color:#fff;box-shadow:0 4px 7px rgba(10,10,10,0.1);left:0;display:none;right:0;top:100%;position:absolute}.nav-menu .nav-item{border-top:1px solid rgba(219,219,219,0.5);padding:0.75rem}.nav-menu.is-active{display:block}}@media screen and (min-width: 769px) and (max-width: 999px){.nav-menu{padding-right:1.5rem}}.nav-left,.nav-right{align-items:stretch;flex-basis:0;flex-grow:1;flex-shrink:0}.nav-left{display:flex;justify-content:flex-start;overflow:hidden;overflow-x:auto;white-space:nowrap}.nav-center{align-items:stretch;display:flex;flex-grow:0;flex-shrink:0;justify-content:center;margin-left:auto;margin-right:auto}.nav-right{justify-content:flex-end}@media screen and (min-width: 769px){.nav-right{display:flex}}.nav{align-items:stretch;background-color:#fff;display:flex;min-height:3.5rem;position:relative;text-align:center;z-index:2}.nav>.container{align-items:stretch;display:flex;min-height:3.5rem;width:100%}.nav.has-shadow{box-shadow:0 2px 3px rgba(10,10,10,0.1)}.pagination,.pagination-list{align-items:center;display:flex;justify-content:center;text-align:center}.pagination-previous,.pagination-next,.pagination-link,.pagination-ellipsis{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;font-size:0.875rem;padding-left:0.5em;padding-right:0.5em;justify-content:center;text-align:center}.pagination-previous:focus,.pagination-previous.is-focused,.pagination-previous:active,.pagination-previous.is-active,.pagination-next:focus,.pagination-next.is-focused,.pagination-next:active,.pagination-next.is-active,.pagination-link:focus,.pagination-link.is-focused,.pagination-link:active,.pagination-link.is-active,.pagination-ellipsis:focus,.pagination-ellipsis.is-focused,.pagination-ellipsis:active,.pagination-ellipsis.is-active{outline:none}.pagination-previous[disabled],.pagination-previous.is-disabled,.pagination-next[disabled],.pagination-next.is-disabled,.pagination-link[disabled],.pagination-link.is-disabled,.pagination-ellipsis[disabled],.pagination-ellipsis.is-disabled{pointer-events:none}.pagination-previous,.pagination-next,.pagination-link{border:1px solid #dbdbdb;min-width:2.5em}.pagination-previous:hover,.pagination-next:hover,.pagination-link:hover{border-color:#b5b5b5;color:#363636}.pagination-previous:focus,.pagination-next:focus,.pagination-link:focus{border-color:#182b73}.pagination-previous:active,.pagination-next:active,.pagination-link:active{box-shadow:inset 0 1px 2px rgba(10,10,10,0.2)}.pagination-previous[disabled],.pagination-previous.is-disabled,.pagination-next[disabled],.pagination-next.is-disabled,.pagination-link[disabled],.pagination-link.is-disabled{background:#dbdbdb;color:#7a7a7a;opacity:0.5;pointer-events:none}.pagination-previous,.pagination-next{padding-left:0.75em;padding-right:0.75em}.pagination-link.is-current{background-color:#182b73;border-color:#182b73;color:#fff}.pagination-ellipsis{color:#b5b5b5;pointer-events:none}.pagination-list li:not(:first-child){margin-left:0.375rem}@media screen and (max-width: 768px){.pagination{flex-wrap:wrap}.pagination-previous,.pagination-next{flex-grow:1;flex-shrink:1;width:calc(50% - 0.375rem)}.pagination-next{margin-left:0.75rem}.pagination-list{margin-top:0.75rem}.pagination-list li{flex-grow:1;flex-shrink:1}}@media screen and (min-width: 769px){.pagination-list{flex-grow:1;flex-shrink:1;justify-content:flex-start;order:1}.pagination-previous,.pagination-next{margin-left:0.75rem}.pagination-previous{order:2}.pagination-next{order:3}.pagination{justify-content:space-between}.pagination.is-centered .pagination-previous{margin-left:0;order:1}.pagination.is-centered .pagination-list{justify-content:center;order:2}.pagination.is-centered .pagination-next{order:3}.pagination.is-right .pagination-previous{margin-left:0;order:1}.pagination.is-right .pagination-next{order:2;margin-right:0.75rem}.pagination.is-right .pagination-list{justify-content:flex-end;order:3}}.panel{font-size:1rem}.panel:not(:last-child){margin-bottom:1.5rem}.panel-heading,.panel-tabs,.panel-block{border-bottom:1px solid #dbdbdb;border-left:1px solid #dbdbdb;border-right:1px solid #dbdbdb}.panel-heading:first-child,.panel-tabs:first-child,.panel-block:first-child{border-top:1px solid #dbdbdb}.panel-heading{background-color:#f5f5f5;border-radius:3px 3px 0 0;color:#363636;font-size:1.25em;font-weight:300;line-height:1.25;padding:0.5em 0.75em}.panel-tabs{align-items:flex-end;display:flex;font-size:0.875em;justify-content:center}.panel-tabs a{border-bottom:1px solid #dbdbdb;margin-bottom:-1px;padding:0.5em}.panel-tabs a.is-active{border-bottom-color:#4a4a4a;color:#363636}.panel-list a{color:#4a4a4a}.panel-list a:hover{color:#182b73}.panel-block{align-items:center;color:#363636;display:flex;justify-content:flex-start;padding:0.5em 0.75em}.panel-block input[type=\"checkbox\"]{margin-right:0.75em}.panel-block>.control{flex-grow:1;flex-shrink:1;width:100%}.panel-block.is-active{border-left-color:#182b73;color:#363636}.panel-block.is-active .panel-icon{color:#182b73}a.panel-block,label.panel-block{cursor:pointer}a.panel-block:hover,label.panel-block:hover{background-color:#f5f5f5}.panel-icon{display:inline-block;font-size:14px;height:1em;line-height:1em;text-align:center;vertical-align:top;width:1em;color:#7a7a7a;margin-right:0.75em}.panel-icon .fa{font-size:inherit;line-height:inherit}.tabs{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;align-items:stretch;display:flex;font-size:1rem;justify-content:space-between;overflow:hidden;overflow-x:auto;white-space:nowrap}.tabs:not(:last-child){margin-bottom:1.5rem}.tabs a{align-items:center;border-bottom:1px solid #dbdbdb;color:#4a4a4a;display:flex;justify-content:center;margin-bottom:-1px;padding:0.5em 1em;vertical-align:top}.tabs a:hover{border-bottom-color:#363636;color:#363636}.tabs li{display:block}.tabs li.is-active a{border-bottom-color:#182b73;color:#182b73}.tabs ul{align-items:center;border-bottom:1px solid #dbdbdb;display:flex;flex-grow:1;flex-shrink:0;justify-content:flex-start}.tabs ul.is-left{padding-right:0.75em}.tabs ul.is-center{flex:none;justify-content:center;padding-left:0.75em;padding-right:0.75em}.tabs ul.is-right{justify-content:flex-end;padding-left:0.75em}.tabs .icon:first-child{margin-right:0.5em}.tabs .icon:last-child{margin-left:0.5em}.tabs.is-centered ul{justify-content:center}.tabs.is-right ul{justify-content:flex-end}.tabs.is-boxed a{border:1px solid transparent;border-radius:3px 3px 0 0}.tabs.is-boxed a:hover{background-color:#f5f5f5;border-bottom-color:#dbdbdb}.tabs.is-boxed li.is-active a{background-color:#fff;border-color:#dbdbdb;border-bottom-color:transparent !important}.tabs.is-fullwidth li{flex-grow:1;flex-shrink:0}.tabs.is-toggle a{border:1px solid #dbdbdb;margin-bottom:0;position:relative}.tabs.is-toggle a:hover{background-color:#f5f5f5;border-color:#b5b5b5;z-index:2}.tabs.is-toggle li+li{margin-left:-1px}.tabs.is-toggle li:first-child a{border-radius:3px 0 0 3px}.tabs.is-toggle li:last-child a{border-radius:0 3px 3px 0}.tabs.is-toggle li.is-active a{background-color:#182b73;border-color:#182b73;color:#fff;z-index:1}.tabs.is-toggle ul{border-bottom:none}.tabs.is-small{font-size:.75rem}.tabs.is-medium{font-size:1.25rem}.tabs.is-large{font-size:1.5rem}.column{display:block;flex-basis:0;flex-grow:1;flex-shrink:1;padding:0.75rem}.columns.is-mobile>.column.is-narrow{flex:none}.columns.is-mobile>.column.is-full{flex:none;width:100%}.columns.is-mobile>.column.is-three-quarters{flex:none;width:75%}.columns.is-mobile>.column.is-two-thirds{flex:none;width:66.6666%}.columns.is-mobile>.column.is-half{flex:none;width:50%}.columns.is-mobile>.column.is-one-third{flex:none;width:33.3333%}.columns.is-mobile>.column.is-one-quarter{flex:none;width:25%}.columns.is-mobile>.column.is-offset-three-quarters{margin-left:75%}.columns.is-mobile>.column.is-offset-two-thirds{margin-left:66.6666%}.columns.is-mobile>.column.is-offset-half{margin-left:50%}.columns.is-mobile>.column.is-offset-one-third{margin-left:33.3333%}.columns.is-mobile>.column.is-offset-one-quarter{margin-left:25%}.columns.is-mobile>.column.is-1{flex:none;width:8.33333%}.columns.is-mobile>.column.is-offset-1{margin-left:8.33333%}.columns.is-mobile>.column.is-2{flex:none;width:16.66667%}.columns.is-mobile>.column.is-offset-2{margin-left:16.66667%}.columns.is-mobile>.column.is-3{flex:none;width:25%}.columns.is-mobile>.column.is-offset-3{margin-left:25%}.columns.is-mobile>.column.is-4{flex:none;width:33.33333%}.columns.is-mobile>.column.is-offset-4{margin-left:33.33333%}.columns.is-mobile>.column.is-5{flex:none;width:41.66667%}.columns.is-mobile>.column.is-offset-5{margin-left:41.66667%}.columns.is-mobile>.column.is-6{flex:none;width:50%}.columns.is-mobile>.column.is-offset-6{margin-left:50%}.columns.is-mobile>.column.is-7{flex:none;width:58.33333%}.columns.is-mobile>.column.is-offset-7{margin-left:58.33333%}.columns.is-mobile>.column.is-8{flex:none;width:66.66667%}.columns.is-mobile>.column.is-offset-8{margin-left:66.66667%}.columns.is-mobile>.column.is-9{flex:none;width:75%}.columns.is-mobile>.column.is-offset-9{margin-left:75%}.columns.is-mobile>.column.is-10{flex:none;width:83.33333%}.columns.is-mobile>.column.is-offset-10{margin-left:83.33333%}.columns.is-mobile>.column.is-11{flex:none;width:91.66667%}.columns.is-mobile>.column.is-offset-11{margin-left:91.66667%}.columns.is-mobile>.column.is-12{flex:none;width:100%}.columns.is-mobile>.column.is-offset-12{margin-left:100%}@media screen and (max-width: 768px){.column.is-narrow-mobile{flex:none}.column.is-full-mobile{flex:none;width:100%}.column.is-three-quarters-mobile{flex:none;width:75%}.column.is-two-thirds-mobile{flex:none;width:66.6666%}.column.is-half-mobile{flex:none;width:50%}.column.is-one-third-mobile{flex:none;width:33.3333%}.column.is-one-quarter-mobile{flex:none;width:25%}.column.is-offset-three-quarters-mobile{margin-left:75%}.column.is-offset-two-thirds-mobile{margin-left:66.6666%}.column.is-offset-half-mobile{margin-left:50%}.column.is-offset-one-third-mobile{margin-left:33.3333%}.column.is-offset-one-quarter-mobile{margin-left:25%}.column.is-1-mobile{flex:none;width:8.33333%}.column.is-offset-1-mobile{margin-left:8.33333%}.column.is-2-mobile{flex:none;width:16.66667%}.column.is-offset-2-mobile{margin-left:16.66667%}.column.is-3-mobile{flex:none;width:25%}.column.is-offset-3-mobile{margin-left:25%}.column.is-4-mobile{flex:none;width:33.33333%}.column.is-offset-4-mobile{margin-left:33.33333%}.column.is-5-mobile{flex:none;width:41.66667%}.column.is-offset-5-mobile{margin-left:41.66667%}.column.is-6-mobile{flex:none;width:50%}.column.is-offset-6-mobile{margin-left:50%}.column.is-7-mobile{flex:none;width:58.33333%}.column.is-offset-7-mobile{margin-left:58.33333%}.column.is-8-mobile{flex:none;width:66.66667%}.column.is-offset-8-mobile{margin-left:66.66667%}.column.is-9-mobile{flex:none;width:75%}.column.is-offset-9-mobile{margin-left:75%}.column.is-10-mobile{flex:none;width:83.33333%}.column.is-offset-10-mobile{margin-left:83.33333%}.column.is-11-mobile{flex:none;width:91.66667%}.column.is-offset-11-mobile{margin-left:91.66667%}.column.is-12-mobile{flex:none;width:100%}.column.is-offset-12-mobile{margin-left:100%}}@media screen and (min-width: 769px){.column.is-narrow,.column.is-narrow-tablet{flex:none}.column.is-full,.column.is-full-tablet{flex:none;width:100%}.column.is-three-quarters,.column.is-three-quarters-tablet{flex:none;width:75%}.column.is-two-thirds,.column.is-two-thirds-tablet{flex:none;width:66.6666%}.column.is-half,.column.is-half-tablet{flex:none;width:50%}.column.is-one-third,.column.is-one-third-tablet{flex:none;width:33.3333%}.column.is-one-quarter,.column.is-one-quarter-tablet{flex:none;width:25%}.column.is-offset-three-quarters,.column.is-offset-three-quarters-tablet{margin-left:75%}.column.is-offset-two-thirds,.column.is-offset-two-thirds-tablet{margin-left:66.6666%}.column.is-offset-half,.column.is-offset-half-tablet{margin-left:50%}.column.is-offset-one-third,.column.is-offset-one-third-tablet{margin-left:33.3333%}.column.is-offset-one-quarter,.column.is-offset-one-quarter-tablet{margin-left:25%}.column.is-1,.column.is-1-tablet{flex:none;width:8.33333%}.column.is-offset-1,.column.is-offset-1-tablet{margin-left:8.33333%}.column.is-2,.column.is-2-tablet{flex:none;width:16.66667%}.column.is-offset-2,.column.is-offset-2-tablet{margin-left:16.66667%}.column.is-3,.column.is-3-tablet{flex:none;width:25%}.column.is-offset-3,.column.is-offset-3-tablet{margin-left:25%}.column.is-4,.column.is-4-tablet{flex:none;width:33.33333%}.column.is-offset-4,.column.is-offset-4-tablet{margin-left:33.33333%}.column.is-5,.column.is-5-tablet{flex:none;width:41.66667%}.column.is-offset-5,.column.is-offset-5-tablet{margin-left:41.66667%}.column.is-6,.column.is-6-tablet{flex:none;width:50%}.column.is-offset-6,.column.is-offset-6-tablet{margin-left:50%}.column.is-7,.column.is-7-tablet{flex:none;width:58.33333%}.column.is-offset-7,.column.is-offset-7-tablet{margin-left:58.33333%}.column.is-8,.column.is-8-tablet{flex:none;width:66.66667%}.column.is-offset-8,.column.is-offset-8-tablet{margin-left:66.66667%}.column.is-9,.column.is-9-tablet{flex:none;width:75%}.column.is-offset-9,.column.is-offset-9-tablet{margin-left:75%}.column.is-10,.column.is-10-tablet{flex:none;width:83.33333%}.column.is-offset-10,.column.is-offset-10-tablet{margin-left:83.33333%}.column.is-11,.column.is-11-tablet{flex:none;width:91.66667%}.column.is-offset-11,.column.is-offset-11-tablet{margin-left:91.66667%}.column.is-12,.column.is-12-tablet{flex:none;width:100%}.column.is-offset-12,.column.is-offset-12-tablet{margin-left:100%}}@media screen and (min-width: 1000px){.column.is-narrow-desktop{flex:none}.column.is-full-desktop{flex:none;width:100%}.column.is-three-quarters-desktop{flex:none;width:75%}.column.is-two-thirds-desktop{flex:none;width:66.6666%}.column.is-half-desktop{flex:none;width:50%}.column.is-one-third-desktop{flex:none;width:33.3333%}.column.is-one-quarter-desktop{flex:none;width:25%}.column.is-offset-three-quarters-desktop{margin-left:75%}.column.is-offset-two-thirds-desktop{margin-left:66.6666%}.column.is-offset-half-desktop{margin-left:50%}.column.is-offset-one-third-desktop{margin-left:33.3333%}.column.is-offset-one-quarter-desktop{margin-left:25%}.column.is-1-desktop{flex:none;width:8.33333%}.column.is-offset-1-desktop{margin-left:8.33333%}.column.is-2-desktop{flex:none;width:16.66667%}.column.is-offset-2-desktop{margin-left:16.66667%}.column.is-3-desktop{flex:none;width:25%}.column.is-offset-3-desktop{margin-left:25%}.column.is-4-desktop{flex:none;width:33.33333%}.column.is-offset-4-desktop{margin-left:33.33333%}.column.is-5-desktop{flex:none;width:41.66667%}.column.is-offset-5-desktop{margin-left:41.66667%}.column.is-6-desktop{flex:none;width:50%}.column.is-offset-6-desktop{margin-left:50%}.column.is-7-desktop{flex:none;width:58.33333%}.column.is-offset-7-desktop{margin-left:58.33333%}.column.is-8-desktop{flex:none;width:66.66667%}.column.is-offset-8-desktop{margin-left:66.66667%}.column.is-9-desktop{flex:none;width:75%}.column.is-offset-9-desktop{margin-left:75%}.column.is-10-desktop{flex:none;width:83.33333%}.column.is-offset-10-desktop{margin-left:83.33333%}.column.is-11-desktop{flex:none;width:91.66667%}.column.is-offset-11-desktop{margin-left:91.66667%}.column.is-12-desktop{flex:none;width:100%}.column.is-offset-12-desktop{margin-left:100%}}@media screen and (min-width: 1192px){.column.is-narrow-widescreen{flex:none}.column.is-full-widescreen{flex:none;width:100%}.column.is-three-quarters-widescreen{flex:none;width:75%}.column.is-two-thirds-widescreen{flex:none;width:66.6666%}.column.is-half-widescreen{flex:none;width:50%}.column.is-one-third-widescreen{flex:none;width:33.3333%}.column.is-one-quarter-widescreen{flex:none;width:25%}.column.is-offset-three-quarters-widescreen{margin-left:75%}.column.is-offset-two-thirds-widescreen{margin-left:66.6666%}.column.is-offset-half-widescreen{margin-left:50%}.column.is-offset-one-third-widescreen{margin-left:33.3333%}.column.is-offset-one-quarter-widescreen{margin-left:25%}.column.is-1-widescreen{flex:none;width:8.33333%}.column.is-offset-1-widescreen{margin-left:8.33333%}.column.is-2-widescreen{flex:none;width:16.66667%}.column.is-offset-2-widescreen{margin-left:16.66667%}.column.is-3-widescreen{flex:none;width:25%}.column.is-offset-3-widescreen{margin-left:25%}.column.is-4-widescreen{flex:none;width:33.33333%}.column.is-offset-4-widescreen{margin-left:33.33333%}.column.is-5-widescreen{flex:none;width:41.66667%}.column.is-offset-5-widescreen{margin-left:41.66667%}.column.is-6-widescreen{flex:none;width:50%}.column.is-offset-6-widescreen{margin-left:50%}.column.is-7-widescreen{flex:none;width:58.33333%}.column.is-offset-7-widescreen{margin-left:58.33333%}.column.is-8-widescreen{flex:none;width:66.66667%}.column.is-offset-8-widescreen{margin-left:66.66667%}.column.is-9-widescreen{flex:none;width:75%}.column.is-offset-9-widescreen{margin-left:75%}.column.is-10-widescreen{flex:none;width:83.33333%}.column.is-offset-10-widescreen{margin-left:83.33333%}.column.is-11-widescreen{flex:none;width:91.66667%}.column.is-offset-11-widescreen{margin-left:91.66667%}.column.is-12-widescreen{flex:none;width:100%}.column.is-offset-12-widescreen{margin-left:100%}}.columns{margin-left:-0.75rem;margin-right:-0.75rem;margin-top:-0.75rem}.columns:last-child{margin-bottom:-0.75rem}.columns:not(:last-child){margin-bottom:0.75rem}.columns.is-centered{justify-content:center}.columns.is-gapless{margin-left:0;margin-right:0;margin-top:0}.columns.is-gapless:last-child{margin-bottom:0}.columns.is-gapless:not(:last-child){margin-bottom:1.5rem}.columns.is-gapless>.column{margin:0;padding:0}@media screen and (min-width: 769px){.columns.is-grid{flex-wrap:wrap}.columns.is-grid>.column{max-width:33.3333%;padding:0.75rem;width:33.3333%}.columns.is-grid>.column+.column{margin-left:0}}.columns.is-mobile{display:flex}.columns.is-multiline{flex-wrap:wrap}.columns.is-vcentered{align-items:center}@media screen and (min-width: 769px){.columns:not(.is-desktop){display:flex}}@media screen and (min-width: 1000px){.columns.is-desktop{display:flex}}.tile{align-items:stretch;display:block;flex-basis:0;flex-grow:1;flex-shrink:1;min-height:min-content}.tile.is-ancestor{margin-left:-0.75rem;margin-right:-0.75rem;margin-top:-0.75rem}.tile.is-ancestor:last-child{margin-bottom:-0.75rem}.tile.is-ancestor:not(:last-child){margin-bottom:0.75rem}.tile.is-child{margin:0 !important}.tile.is-parent{padding:0.75rem}.tile.is-vertical{flex-direction:column}.tile.is-vertical>.tile.is-child:not(:last-child){margin-bottom:1.5rem !important}@media screen and (min-width: 769px){.tile:not(.is-child){display:flex}.tile.is-1{flex:none;width:8.33333%}.tile.is-2{flex:none;width:16.66667%}.tile.is-3{flex:none;width:25%}.tile.is-4{flex:none;width:33.33333%}.tile.is-5{flex:none;width:41.66667%}.tile.is-6{flex:none;width:50%}.tile.is-7{flex:none;width:58.33333%}.tile.is-8{flex:none;width:66.66667%}.tile.is-9{flex:none;width:75%}.tile.is-10{flex:none;width:83.33333%}.tile.is-11{flex:none;width:91.66667%}.tile.is-12{flex:none;width:100%}}.hero-video{bottom:0;left:0;position:absolute;right:0;top:0;overflow:hidden}.hero-video video{left:50%;min-height:100%;min-width:100%;position:absolute;top:50%;transform:translate3d(-50%, -50%, 0)}.hero-video.is-transparent{opacity:0.3}@media screen and (max-width: 768px){.hero-video{display:none}}.hero-buttons{margin-top:1.5rem}@media screen and (max-width: 768px){.hero-buttons .button{display:flex}.hero-buttons .button:not(:last-child){margin-bottom:0.75rem}}@media screen and (min-width: 769px){.hero-buttons{display:flex;justify-content:center}.hero-buttons .button:not(:last-child){margin-right:1.5rem}}.hero-head,.hero-foot{flex-grow:0;flex-shrink:0}.hero-body{flex-grow:1;flex-shrink:0;padding:3rem 1.5rem}@media screen and (min-width: 1192px){.hero-body{padding-left:0;padding-right:0}}.hero{align-items:stretch;background-color:#fff;display:flex;flex-direction:column;justify-content:space-between}.hero .nav{background:none;box-shadow:0 1px 0 rgba(219,219,219,0.3)}.hero .tabs ul{border-bottom:none}.hero.is-white{background-color:#fff;color:#0a0a0a}.hero.is-white a,.hero.is-white strong{color:inherit}.hero.is-white .title{color:#0a0a0a}.hero.is-white .subtitle{color:rgba(10,10,10,0.9)}.hero.is-white .subtitle a,.hero.is-white .subtitle strong{color:#0a0a0a}.hero.is-white .nav{box-shadow:0 1px 0 rgba(10,10,10,0.2)}@media screen and (max-width: 768px){.hero.is-white .nav-menu{background-color:#fff}}.hero.is-white a.nav-item,.hero.is-white .nav-item a:not(.button){color:rgba(10,10,10,0.7)}.hero.is-white a.nav-item:hover,.hero.is-white a.nav-item.is-active,.hero.is-white .nav-item a:not(.button):hover,.hero.is-white .nav-item a:not(.button).is-active{color:#0a0a0a}.hero.is-white .tabs a{color:#0a0a0a;opacity:0.9}.hero.is-white .tabs a:hover{opacity:1}.hero.is-white .tabs li.is-active a{opacity:1}.hero.is-white .tabs.is-boxed a,.hero.is-white .tabs.is-toggle a{color:#0a0a0a}.hero.is-white .tabs.is-boxed a:hover,.hero.is-white .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-white .tabs.is-boxed li.is-active a,.hero.is-white .tabs.is-boxed li.is-active a:hover,.hero.is-white .tabs.is-toggle li.is-active a,.hero.is-white .tabs.is-toggle li.is-active a:hover{background-color:#0a0a0a;border-color:#0a0a0a;color:#fff}.hero.is-white.is-bold{background-image:linear-gradient(141deg, #e6e6e6 0%, #fff 71%, #fff 100%)}@media screen and (max-width: 768px){.hero.is-white .nav-toggle span{background-color:#0a0a0a}.hero.is-white .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-white .nav-toggle.is-active span{background-color:#0a0a0a}.hero.is-white .nav-menu .nav-item{border-top-color:rgba(10,10,10,0.2)}}.hero.is-black{background-color:#0a0a0a;color:#fff}.hero.is-black a,.hero.is-black strong{color:inherit}.hero.is-black .title{color:#fff}.hero.is-black .subtitle{color:rgba(255,255,255,0.9)}.hero.is-black .subtitle a,.hero.is-black .subtitle strong{color:#fff}.hero.is-black .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-black .nav-menu{background-color:#0a0a0a}}.hero.is-black a.nav-item,.hero.is-black .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-black a.nav-item:hover,.hero.is-black a.nav-item.is-active,.hero.is-black .nav-item a:not(.button):hover,.hero.is-black .nav-item a:not(.button).is-active{color:#fff}.hero.is-black .tabs a{color:#fff;opacity:0.9}.hero.is-black .tabs a:hover{opacity:1}.hero.is-black .tabs li.is-active a{opacity:1}.hero.is-black .tabs.is-boxed a,.hero.is-black .tabs.is-toggle a{color:#fff}.hero.is-black .tabs.is-boxed a:hover,.hero.is-black .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-black .tabs.is-boxed li.is-active a,.hero.is-black .tabs.is-boxed li.is-active a:hover,.hero.is-black .tabs.is-toggle li.is-active a,.hero.is-black .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#0a0a0a}.hero.is-black.is-bold{background-image:linear-gradient(141deg, #000 0%, #0a0a0a 71%, #181616 100%)}@media screen and (max-width: 768px){.hero.is-black .nav-toggle span{background-color:#fff}.hero.is-black .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-black .nav-toggle.is-active span{background-color:#fff}.hero.is-black .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-light{background-color:#f5f5f5;color:#363636}.hero.is-light a,.hero.is-light strong{color:inherit}.hero.is-light .title{color:#363636}.hero.is-light .subtitle{color:rgba(54,54,54,0.9)}.hero.is-light .subtitle a,.hero.is-light .subtitle strong{color:#363636}.hero.is-light .nav{box-shadow:0 1px 0 rgba(54,54,54,0.2)}@media screen and (max-width: 768px){.hero.is-light .nav-menu{background-color:#f5f5f5}}.hero.is-light a.nav-item,.hero.is-light .nav-item a:not(.button){color:rgba(54,54,54,0.7)}.hero.is-light a.nav-item:hover,.hero.is-light a.nav-item.is-active,.hero.is-light .nav-item a:not(.button):hover,.hero.is-light .nav-item a:not(.button).is-active{color:#363636}.hero.is-light .tabs a{color:#363636;opacity:0.9}.hero.is-light .tabs a:hover{opacity:1}.hero.is-light .tabs li.is-active a{opacity:1}.hero.is-light .tabs.is-boxed a,.hero.is-light .tabs.is-toggle a{color:#363636}.hero.is-light .tabs.is-boxed a:hover,.hero.is-light .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-light .tabs.is-boxed li.is-active a,.hero.is-light .tabs.is-boxed li.is-active a:hover,.hero.is-light .tabs.is-toggle li.is-active a,.hero.is-light .tabs.is-toggle li.is-active a:hover{background-color:#363636;border-color:#363636;color:#f5f5f5}.hero.is-light.is-bold{background-image:linear-gradient(141deg, #dfd8d8 0%, #f5f5f5 71%, #fff 100%)}@media screen and (max-width: 768px){.hero.is-light .nav-toggle span{background-color:#363636}.hero.is-light .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-light .nav-toggle.is-active span{background-color:#363636}.hero.is-light .nav-menu .nav-item{border-top-color:rgba(54,54,54,0.2)}}.hero.is-dark{background-color:#363636;color:#f5f5f5}.hero.is-dark a,.hero.is-dark strong{color:inherit}.hero.is-dark .title{color:#f5f5f5}.hero.is-dark .subtitle{color:rgba(245,245,245,0.9)}.hero.is-dark .subtitle a,.hero.is-dark .subtitle strong{color:#f5f5f5}.hero.is-dark .nav{box-shadow:0 1px 0 rgba(245,245,245,0.2)}@media screen and (max-width: 768px){.hero.is-dark .nav-menu{background-color:#363636}}.hero.is-dark a.nav-item,.hero.is-dark .nav-item a:not(.button){color:rgba(245,245,245,0.7)}.hero.is-dark a.nav-item:hover,.hero.is-dark a.nav-item.is-active,.hero.is-dark .nav-item a:not(.button):hover,.hero.is-dark .nav-item a:not(.button).is-active{color:#f5f5f5}.hero.is-dark .tabs a{color:#f5f5f5;opacity:0.9}.hero.is-dark .tabs a:hover{opacity:1}.hero.is-dark .tabs li.is-active a{opacity:1}.hero.is-dark .tabs.is-boxed a,.hero.is-dark .tabs.is-toggle a{color:#f5f5f5}.hero.is-dark .tabs.is-boxed a:hover,.hero.is-dark .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-dark .tabs.is-boxed li.is-active a,.hero.is-dark .tabs.is-boxed li.is-active a:hover,.hero.is-dark .tabs.is-toggle li.is-active a,.hero.is-dark .tabs.is-toggle li.is-active a:hover{background-color:#f5f5f5;border-color:#f5f5f5;color:#363636}.hero.is-dark.is-bold{background-image:linear-gradient(141deg, #1f1919 0%, #363636 71%, #463f3f 100%)}@media screen and (max-width: 768px){.hero.is-dark .nav-toggle span{background-color:#f5f5f5}.hero.is-dark .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-dark .nav-toggle.is-active span{background-color:#f5f5f5}.hero.is-dark .nav-menu .nav-item{border-top-color:rgba(245,245,245,0.2)}}.hero.is-primary{background-color:#182b73;color:#fff}.hero.is-primary a,.hero.is-primary strong{color:inherit}.hero.is-primary .title{color:#fff}.hero.is-primary .subtitle{color:rgba(255,255,255,0.9)}.hero.is-primary .subtitle a,.hero.is-primary .subtitle strong{color:#fff}.hero.is-primary .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-primary .nav-menu{background-color:#182b73}}.hero.is-primary a.nav-item,.hero.is-primary .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-primary a.nav-item:hover,.hero.is-primary a.nav-item.is-active,.hero.is-primary .nav-item a:not(.button):hover,.hero.is-primary .nav-item a:not(.button).is-active{color:#fff}.hero.is-primary .tabs a{color:#fff;opacity:0.9}.hero.is-primary .tabs a:hover{opacity:1}.hero.is-primary .tabs li.is-active a{opacity:1}.hero.is-primary .tabs.is-boxed a,.hero.is-primary .tabs.is-toggle a{color:#fff}.hero.is-primary .tabs.is-boxed a:hover,.hero.is-primary .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-primary .tabs.is-boxed li.is-active a,.hero.is-primary .tabs.is-boxed li.is-active a:hover,.hero.is-primary .tabs.is-toggle li.is-active a,.hero.is-primary .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#182b73}.hero.is-primary.is-bold{background-image:linear-gradient(141deg, #0b244d 0%, #182b73 71%, #181d8c 100%)}@media screen and (max-width: 768px){.hero.is-primary .nav-toggle span{background-color:#fff}.hero.is-primary .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-primary .nav-toggle.is-active span{background-color:#fff}.hero.is-primary .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-info{background-color:#3273dc;color:#fff}.hero.is-info a,.hero.is-info strong{color:inherit}.hero.is-info .title{color:#fff}.hero.is-info .subtitle{color:rgba(255,255,255,0.9)}.hero.is-info .subtitle a,.hero.is-info .subtitle strong{color:#fff}.hero.is-info .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-info .nav-menu{background-color:#3273dc}}.hero.is-info a.nav-item,.hero.is-info .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-info a.nav-item:hover,.hero.is-info a.nav-item.is-active,.hero.is-info .nav-item a:not(.button):hover,.hero.is-info .nav-item a:not(.button).is-active{color:#fff}.hero.is-info .tabs a{color:#fff;opacity:0.9}.hero.is-info .tabs a:hover{opacity:1}.hero.is-info .tabs li.is-active a{opacity:1}.hero.is-info .tabs.is-boxed a,.hero.is-info .tabs.is-toggle a{color:#fff}.hero.is-info .tabs.is-boxed a:hover,.hero.is-info .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-info .tabs.is-boxed li.is-active a,.hero.is-info .tabs.is-boxed li.is-active a:hover,.hero.is-info .tabs.is-toggle li.is-active a,.hero.is-info .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#3273dc}.hero.is-info.is-bold{background-image:linear-gradient(141deg, #1577c6 0%, #3273dc 71%, #4366e5 100%)}@media screen and (max-width: 768px){.hero.is-info .nav-toggle span{background-color:#fff}.hero.is-info .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-info .nav-toggle.is-active span{background-color:#fff}.hero.is-info .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-success{background-color:#23d160;color:#fff}.hero.is-success a,.hero.is-success strong{color:inherit}.hero.is-success .title{color:#fff}.hero.is-success .subtitle{color:rgba(255,255,255,0.9)}.hero.is-success .subtitle a,.hero.is-success .subtitle strong{color:#fff}.hero.is-success .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-success .nav-menu{background-color:#23d160}}.hero.is-success a.nav-item,.hero.is-success .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-success a.nav-item:hover,.hero.is-success a.nav-item.is-active,.hero.is-success .nav-item a:not(.button):hover,.hero.is-success .nav-item a:not(.button).is-active{color:#fff}.hero.is-success .tabs a{color:#fff;opacity:0.9}.hero.is-success .tabs a:hover{opacity:1}.hero.is-success .tabs li.is-active a{opacity:1}.hero.is-success .tabs.is-boxed a,.hero.is-success .tabs.is-toggle a{color:#fff}.hero.is-success .tabs.is-boxed a:hover,.hero.is-success .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-success .tabs.is-boxed li.is-active a,.hero.is-success .tabs.is-boxed li.is-active a:hover,.hero.is-success .tabs.is-toggle li.is-active a,.hero.is-success .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#23d160}.hero.is-success.is-bold{background-image:linear-gradient(141deg, #12af2f 0%, #23d160 71%, #2ce28a 100%)}@media screen and (max-width: 768px){.hero.is-success .nav-toggle span{background-color:#fff}.hero.is-success .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-success .nav-toggle.is-active span{background-color:#fff}.hero.is-success .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.hero.is-warning a,.hero.is-warning strong{color:inherit}.hero.is-warning .title{color:rgba(0,0,0,0.7)}.hero.is-warning .subtitle{color:rgba(0,0,0,0.9)}.hero.is-warning .subtitle a,.hero.is-warning .subtitle strong{color:rgba(0,0,0,0.7)}.hero.is-warning .nav{box-shadow:0 1px 0 rgba(0,0,0,0.2)}@media screen and (max-width: 768px){.hero.is-warning .nav-menu{background-color:#ffdd57}}.hero.is-warning a.nav-item,.hero.is-warning .nav-item a:not(.button){color:rgba(0,0,0,0.7)}.hero.is-warning a.nav-item:hover,.hero.is-warning a.nav-item.is-active,.hero.is-warning .nav-item a:not(.button):hover,.hero.is-warning .nav-item a:not(.button).is-active{color:rgba(0,0,0,0.7)}.hero.is-warning .tabs a{color:rgba(0,0,0,0.7);opacity:0.9}.hero.is-warning .tabs a:hover{opacity:1}.hero.is-warning .tabs li.is-active a{opacity:1}.hero.is-warning .tabs.is-boxed a,.hero.is-warning .tabs.is-toggle a{color:rgba(0,0,0,0.7)}.hero.is-warning .tabs.is-boxed a:hover,.hero.is-warning .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-warning .tabs.is-boxed li.is-active a,.hero.is-warning .tabs.is-boxed li.is-active a:hover,.hero.is-warning .tabs.is-toggle li.is-active a,.hero.is-warning .tabs.is-toggle li.is-active a:hover{background-color:rgba(0,0,0,0.7);border-color:rgba(0,0,0,0.7);color:#ffdd57}.hero.is-warning.is-bold{background-image:linear-gradient(141deg, #ffaf24 0%, #ffdd57 71%, #fffa70 100%)}@media screen and (max-width: 768px){.hero.is-warning .nav-toggle span{background-color:rgba(0,0,0,0.7)}.hero.is-warning .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-warning .nav-toggle.is-active span{background-color:rgba(0,0,0,0.7)}.hero.is-warning .nav-menu .nav-item{border-top-color:rgba(0,0,0,0.2)}}.hero.is-danger{background-color:red;color:#fff}.hero.is-danger a,.hero.is-danger strong{color:inherit}.hero.is-danger .title{color:#fff}.hero.is-danger .subtitle{color:rgba(255,255,255,0.9)}.hero.is-danger .subtitle a,.hero.is-danger .subtitle strong{color:#fff}.hero.is-danger .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-danger .nav-menu{background-color:red}}.hero.is-danger a.nav-item,.hero.is-danger .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-danger a.nav-item:hover,.hero.is-danger a.nav-item.is-active,.hero.is-danger .nav-item a:not(.button):hover,.hero.is-danger .nav-item a:not(.button).is-active{color:#fff}.hero.is-danger .tabs a{color:#fff;opacity:0.9}.hero.is-danger .tabs a:hover{opacity:1}.hero.is-danger .tabs li.is-active a{opacity:1}.hero.is-danger .tabs.is-boxed a,.hero.is-danger .tabs.is-toggle a{color:#fff}.hero.is-danger .tabs.is-boxed a:hover,.hero.is-danger .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-danger .tabs.is-boxed li.is-active a,.hero.is-danger .tabs.is-boxed li.is-active a:hover,.hero.is-danger .tabs.is-toggle li.is-active a,.hero.is-danger .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:red}.hero.is-danger.is-bold{background-image:linear-gradient(141deg, #c02 0%, red 71%, #ff401a 100%)}@media screen and (max-width: 768px){.hero.is-danger .nav-toggle span{background-color:#fff}.hero.is-danger .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-danger .nav-toggle.is-active span{background-color:#fff}.hero.is-danger .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}@media screen and (min-width: 769px){.hero.is-medium .hero-body{padding-bottom:9rem;padding-top:9rem}}@media screen and (min-width: 769px){.hero.is-large .hero-body{padding-bottom:18rem;padding-top:18rem}}.hero.is-fullheight{min-height:100vh}.hero.is-fullheight .hero-body{align-items:center;display:flex}.hero.is-fullheight .hero-body>.container{flex-grow:1;flex-shrink:1}.section{background-color:#fff;padding:3rem 1.5rem}@media screen and (min-width: 1000px){.section.is-medium{padding:9rem 1.5rem}.section.is-large{padding:18rem 1.5rem}}.footer{background-color:#f5f5f5;padding:3rem 1.5rem 6rem}.header.is-fixed-top{z-index:1030;position:fixed;top:0;left:0;right:0}.has-fixed-nav{margin-top:50px}.section.is-small{padding:1rem 1.5rem}.nav-inverse{background:#182b73}.nav-inverse a.nav-item{color:#f2f2f2}.nav-inverse a.nav-item:hover{color:#d1d5e3}.nav-inverse a.nav-item.is-active{color:#fff}.nav-inverse a.nav-item.is-tab:hover{border-bottom-color:#fff}.nav-inverse a.nav-item.is-tab.is-active{border-bottom:3px solid #fff;color:#fff}.nav-slider-container .nav-slider{position:fixed;top:0;bottom:0;z-index:1040;overflow-y:auto;text-align:center;background:#182b73;color:#fff;left:-250px;width:250px;transition:left 0.5s}.nav-slider-container .nav-slider.is-active{left:0}.nav-slider-container .nav-slider .nav-item{cursor:pointer;display:block;padding-top:10px;padding-bottom:9px;background:rgba(255,255,255,0.1)}.nav-slider-container .nav-slider .nav-item.is-active{background:linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1) 5%)}.nav-slider-container .nav-slider .nav-item[open]>summary{margin-bottom:9px}.nav-slider-container .nav-slider .nav-item:not(:last-child){border-bottom:1px solid #fff}.nav-slider-container .nav-slider ~ .is-overlay{background:rgba(0,0,0,0.5);z-index:1035;visibility:hidden;position:fixed;opacity:0;transition:opacity 0.75s}.nav-slider-container .nav-slider.is-active ~ .is-overlay{visibility:visible;opacity:1}#container>div:not(.visible){display:none}\n" + '</style>';

// Show the menu when clicking on the menu button
Array.from(document.querySelectorAll('.nav-slider-toggle')).forEach(function (el) {
    return el.addEventListener('click', toggleMenu);
});

// Hide the menu when clicking the overlay
document.querySelector('.nav-slider-container .is-overlay').addEventListener('click', toggleMenu);

// Change tabs
document.querySelector('.nav-slider-container .nav-slider').addEventListener('click', function globalTabChange(event) {
    var tabName = event.target.dataset.tabName;
    var tab = document.querySelector('#container > [data-tab-name=' + tabName + ']');
    if (!tabName || !tab) {
        return;
    }

    //Content
    //We can't just remove the first due to browser lag
    Array.from(document.querySelectorAll('#container > .visible')).forEach(function (el) {
        return el.classList.remove('visible');
    });
    tab.classList.add('visible');

    //Tabs
    Array.from(document.querySelectorAll('.nav-slider-container .nav-slider .is-active')).forEach(function (el) {
        return el.classList.remove('is-active');
    });
    event.target.classList.add('is-active');

    hook.fire('ui.tabShown', tab);
});

/**
 * Function used to show/hide the menu.
 *
 * @example
 * toggleMenu();
 */
function toggleMenu() {
    document.querySelector('.nav-slider-container .nav-slider').classList.toggle('is-active');
}

var tabUID = 0;
/**
 * Used to add a tab to the bot's navigation.
 *
 * @example
 * var tab = ui.addTab('Text');
 * var tab2 = ui.addTab('Custom Messages', 'messages');
 * @param {string} tabText
 * @param {string} [groupName=main] Optional. If provided, the name of the group of tabs to add this tab to.
 * @return {Node} - The div to place tab content in.
 */
function addTab(tabText) {
    var groupName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'main';

    var tabName = 'botTab_' + tabUID++;

    var tab = document.createElement('span');
    tab.textContent = tabText;
    tab.classList.add('nav-item');
    tab.dataset.tabName = tabName;

    var tabContent = document.createElement('div');
    tabContent.dataset.tabName = tabName;

    document.querySelector('.nav-slider-container [data-tab-group=' + groupName + ']').appendChild(tab);
    document.querySelector('#container').appendChild(tabContent);

    return tabContent;
}

/**
 * Removes a global tab.
 *
 * @example
 * var tab = ui.addTab('Tab');
 * ui.removeTab(tab);
 * @param {Node} tabContent The div returned by the addTab function.
 */
function removeTab(tabContent) {
    document.querySelector('.nav-slider-container [data-tab-name=' + tabContent.dataset.tabName + ']').remove();
    tabContent.remove();
}

/**
 * Creates a tab group in which tabs can be placed.
 *
 * @example
 * ui.addTabGroup('Group Text', 'some_group');
 * ui.addTab('Within group', 'some_group');
 * @param {string} text - The text the user will see
 * @param {string} groupName - The name of the group which can be used to add tabs within the group.
 * @param {string} [parent = main] - The name of the parent group.
 */
function addTabGroup(text, groupName) {
    var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'main';

    var details = document.createElement('details');
    details.classList.add('nav-item');
    details.dataset.tabGroup = groupName;

    var summary = document.createElement('summary');
    summary.textContent = text;
    details.appendChild(summary);

    document.querySelector('.nav-slider-container [data-tab-group="' + parent + '"]').appendChild(details);
}

/**
 * Removes a tab group and all tabs contained within the specified group.
 *
 * @example
 * addTabGroup('Group', 'group1');
 * var inner = addTab('Inner', 'group1');
 * removeTabGroup('group1'); // inner has been removed.
 * @param string groupName the name of the group that was used in ui.addTabGroup.
 */
function removeTabGroup(groupName) {
    var group = document.querySelector('.nav-slider-container [data-tab-group="' + groupName + '"]');
    var items = Array.from(group.querySelectorAll('span'));

    items.forEach(function (item) {
        //Tab content
        document.querySelector('#container > [data-tab-name="' + item.dataset.tabName + '"]').remove();
    });

    group.remove();
}

module.exports = {
    toggleMenu: toggleMenu,
    addTab: addTab,
    removeTab: removeTab,
    addTabGroup: addTabGroup,
    removeTabGroup: removeTabGroup
};

},{"libraries/hook":11}],30:[function(require,module,exports){
'use strict';

module.exports = {
    alert: alert
};

var modal = document.querySelector('#alert');

/**
* Function used to require action from the user.
*
* @param {String} html the html to display in the alert
* @param {Array} buttons an array of buttons to add to the alert.
*        Format: [{text: 'Test', style:'is-success', action: function(){}, thisArg: window, dismiss: false}]
*        Note: text is the only required paramater. If no button array is specified
*        then a single OK button will be shown.
*        style can also be an array of classes to add.
*        Defaults: style: '', action: undefined, thisArg: undefined, dismiss: true
*/
function alert(html) {
    var buttons = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [{ text: 'OK' }];

    if (instance.active) {
        instance.queue.push({ html: html, buttons: buttons });
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
    modal.querySelector('.modal-card-body').innerHTML = html;

    modal.classList.add('is-active');
}

/**
 * Holds the current alert and queue of further alerts.
 */
var instance = {
    active: false,
    queue: [],
    buttons: {}
};

/**
 * Internal function used to add button elements to an alert.
 *
 * @param {Object} button
 */
function buildButton(button) {
    var el = document.createElement('a');
    el.innerHTML = button.text;

    el.classList.add('button');
    if (Array.isArray(button.style)) {
        button.style.forEach(function (style) {
            return el.classList.add(style);
        });
    } else if (button.style) {
        el.classList.add(button.style);
    }

    el.id = button.id;
    el.addEventListener('click', buttonHandler);
    modal.querySelector('.modal-card-foot').appendChild(el);
}

/**
 * Internal function to determine the functionality of each button added to an alert.
 *
 * @param {MouseEvent} event
 */
function buttonHandler(event) {
    var button = instance.buttons[event.target.id] || {};
    if (typeof button.action == 'function') {
        button.action.call(button.thisArg);
    }

    //Require that there be an action asociated with no-dismiss buttons.
    if (button.dismiss || typeof button.action != 'function') {
        modal.classList.remove('is-active');
        modal.querySelector('.modal-card-foot').innerHTML = '';
        instance.buttons = {};
        instance.active = false;

        // Are more alerts waiting to be shown?
        if (instance.queue.length) {
            var next = instance.queue.shift();
            alert(next.html, next.buttons);
        }
    }
}

},{}],31:[function(require,module,exports){
'use strict';

var el = document.createElement('div');
el.innerHTML = "<div id=\"alert\" class=\"modal\">\r\n    <div class=\"modal-background\"></div>\r\n    <div class=\"modal-card\">\r\n        <header class=\"modal-card-head\"></header>\r\n        <section class=\"modal-card-body\"></section>\r\n        <footer class=\"modal-card-foot\"></footer>\r\n    </div>\r\n</div>\r\n";
document.body.appendChild(el);

el = document.createElement('style');
el.innerHTML = ".bot-notification{position:fixed;top:0.6em;right:1em;z-index:1035;min-width:200px;border-radius:5px;padding:5px;background:#fff;color:#182b73;opacity:0;transition:opacity 1s}.bot-notification.is-active{opacity:1}\n";
document.head.appendChild(el);

Object.assign(module.exports, require('./alert'), require('./notify'));

},{"./alert":30,"./notify":32}],32:[function(require,module,exports){
'use strict';

module.exports = {
    notify: notify
};

/**
 * Function used to send a non-critical alert to the user.
 * Should be used in place of ui.alert if possible as it is non-blocking.
 *
 * @example
 * //Shows a notfication for 2 seconds
 * ui.notify('Notification');
 * //Shows a notification for 5 seconds
 * ui.notify('Notification', 5);
 * @param {String} text the text to display. Should be kept short to avoid visually blocking the menu on small devices.
 * @param {Number} displayTime the number of seconds to show the notification for.
 */
function notify(text) {
    var displayTime = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;

    var el = document.createElement('div');
    el.classList.add('bot-notification', 'is-active');
    el.textContent = text;
    document.body.appendChild(el);
    var timeouts = [
    // Fade out after displayTime
    setTimeout(function () {
        this.classList.remove('is-active');
    }.bind(el), displayTime * 1000),
    // Remove after fade out
    setTimeout(function () {
        this.remove();
    }.bind(el), displayTime * 1000 + 2100)];

    el.addEventListener('click', function () {
        timeouts.forEach(clearTimeout);
        this.remove();
    });
}

},{}],33:[function(require,module,exports){
'use strict';

//Details polyfill, older firefox, IE
if (!('open' in document.createElement('details'))) {
    var style = document.createElement('style');
    style.textContent += 'details:not([open]) > :not(summary) { display: none !important; } details > summary:before { content: "\u25B6"; display: inline-block; font-size: .8em; width: 1.5em; font-family:"Courier New"; } details[open] > summary:before { transform: rotate(90deg); }';
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

},{}],34:[function(require,module,exports){
'use strict';

// IE Fix

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

},{}],35:[function(require,module,exports){
'use strict';

module.exports = {
    buildContentFromTemplate: buildContentFromTemplate
};

var polyfill = require('ui/polyfills/template');

/**
 * Function used to clone a template after altering the provided rules.
 *
 * @example
 * ui.buildContentFromTemplate('#template', '#target', [{selector: 'input', value: 'Value'}]);
 * ui.buildContentFromTemplate('template', 'div', [{selector: 'a', remove: ['href'], multiple: true}]);
 * @param {String|Node} template
 * @param {String|Node} target
 * @param {Array} rules format: array of objects
 *      each object must have "selector".
 *      each object can have "multiple" set to update all matching elements.
 *      each object can have "remove" - an array of attributes to remove.
 *      each object can have "text" or "html" - further keys will be set as attributes.
 *      if both text and html are set, text will take precendence.
 *      rules will be parsed in the order that they are present in the array.
 */
function buildContentFromTemplate(template, target) {
    var rules = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    if (typeof template == 'string') {
        template = document.querySelector(template);
    }
    if (typeof target == 'string') {
        target = document.querySelector(target);
    }

    polyfill(template);

    var content = template.content;

    rules.forEach(function (rule) {
        return handleRule(content, rule);
    });

    target.appendChild(document.importNode(content, true));
}

/**
 * Internal function to apply rules to the template.
 *
 * @param {Node} content - the content of the template.
 * @param {Object} rule - the rule to apply.
 */
function handleRule(content, rule) {
    if (rule.multiple) {
        var els = content.querySelectorAll(rule.selector);

        Array.from(els).forEach(function (el) {
            return updateElement(el, rule);
        });
    } else {
        var el = content.querySelector(rule.selector);
        if (!el) {
            console.warn('Unable to update ' + rule.selector + '.', rule);
            return;
        }

        updateElement(el, rule);
    }
}

/**
 * Internal function to update an element with a rule.
 *
 * @param {Node} el the element to apply the rules to.
 * @param {Object} rule the rule object.
 */
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

},{"ui/polyfills/template":34}],36:[function(require,module,exports){
(function (global){
'use strict';

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
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

// based on node assert, original notice:

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
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
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
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
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
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
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

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
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

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
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

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


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

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
    // Ignore.  The instanceof check doesn't work for arrow functions.
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

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"util/":42}],37:[function(require,module,exports){
(function (global){
/*global window, global*/
var util = require("util")
var assert = require("assert")
var now = require("date-now")

var slice = Array.prototype.slice
var console
var times = {}

if (typeof global !== "undefined" && global.console) {
    console = global.console
} else if (typeof window !== "undefined" && window.console) {
    console = window.console
} else {
    console = {}
}

var functions = [
    [log, "log"],
    [info, "info"],
    [warn, "warn"],
    [error, "error"],
    [time, "time"],
    [timeEnd, "timeEnd"],
    [trace, "trace"],
    [dir, "dir"],
    [consoleAssert, "assert"]
]

for (var i = 0; i < functions.length; i++) {
    var tuple = functions[i]
    var f = tuple[0]
    var name = tuple[1]

    if (!console[name]) {
        console[name] = f
    }
}

module.exports = console

function log() {}

function info() {
    console.log.apply(console, arguments)
}

function warn() {
    console.log.apply(console, arguments)
}

function error() {
    console.warn.apply(console, arguments)
}

function time(label) {
    times[label] = now()
}

function timeEnd(label) {
    var time = times[label]
    if (!time) {
        throw new Error("No such label: " + label)
    }

    var duration = now() - time
    console.log(label + ": " + duration + "ms")
}

function trace() {
    var err = new Error()
    err.name = "Trace"
    err.message = util.format.apply(null, arguments)
    console.error(err.stack)
}

function dir(object) {
    console.log(util.inspect(object) + "\n")
}

function consoleAssert(expression) {
    if (!expression) {
        var arr = slice.call(arguments, 1)
        assert.ok(false, util.format.apply(null, arr))
    }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"assert":36,"date-now":38,"util":42}],38:[function(require,module,exports){
module.exports = now

function now() {
    return new Date().getTime()
}

},{}],39:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
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
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
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
    while(len) {
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

// v8 likes predictible objects
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
process.version = ''; // empty string to avoid regexp issues
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

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],40:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
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
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],41:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],42:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
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
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
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


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
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
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
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

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
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
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
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
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
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
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
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
  return typeof arg === 'symbol';
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
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
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


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
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

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":41,"_process":39,"inherits":40}]},{},[27])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXZcXE1lc3NhZ2VCb3RFeHRlbnNpb24uanMiLCJkZXZcXGJvdFxcY2hlY2tHcm91cC5qcyIsImRldlxcYm90XFxpbmRleC5qcyIsImRldlxcYm90XFxtaWdyYXRpb24uanMiLCJkZXZcXGJvdFxcc2VuZC5qcyIsImRldlxcY29uc29sZVxcZXhwb3J0cy5qcyIsImRldlxcY29uc29sZVxcaW5kZXguanMiLCJkZXZcXGxpYnJhcmllc1xcYWpheC5qcyIsImRldlxcbGlicmFyaWVzXFxiaGZhbnNhcGkuanMiLCJkZXZcXGxpYnJhcmllc1xcYmxvY2toZWFkcy5qcyIsImRldlxcbGlicmFyaWVzXFxob29rLmpzIiwiZGV2XFxsaWJyYXJpZXNcXHN0b3JhZ2UuanMiLCJkZXZcXGxpYnJhcmllc1xcd29ybGQuanMiLCJkZXZcXG1lc3NhZ2VzXFxhbm5vdW5jZW1lbnRzXFxpbmRleC5qcyIsImRldlxcbWVzc2FnZXNcXGhlbHBlcnNcXGJ1aWxkTWVzc2FnZS5qcyIsImRldlxcbWVzc2FnZXNcXGhlbHBlcnNcXGNoZWNrSm9pbnNBbmRHcm91cC5qcyIsImRldlxcbWVzc2FnZXNcXGhlbHBlcnNcXGluZGV4LmpzIiwiZGV2XFxtZXNzYWdlc1xcaGVscGVyc1xcc2hvd1N1bW1hcnkuanMiLCJkZXZcXG1lc3NhZ2VzXFxpbmRleC5qcyIsImRldlxcbWVzc2FnZXNcXGpvaW5cXGluZGV4LmpzIiwiZGV2XFxtZXNzYWdlc1xcbGVhdmVcXGluZGV4LmpzIiwiZGV2XFxtZXNzYWdlc1xcdHJpZ2dlclxcaW5kZXguanMiLCJkZXZcXHNldHRpbmdzXFxib3RcXGluZGV4LmpzIiwiZGV2XFxzZXR0aW5nc1xcYm90XFxwYWdlLmpzIiwiZGV2XFxzZXR0aW5nc1xcZXh0ZW5zaW9uc1xcaW5kZXguanMiLCJkZXZcXHNldHRpbmdzXFxpbmRleC5qcyIsImRldlxcc3RhcnQuanMiLCJkZXZcXHVpXFxpbmRleC5qcyIsImRldlxcdWlcXGxheW91dFxcaW5kZXguanMiLCJkZXZcXHVpXFxub3RpZmljYXRpb25zXFxhbGVydC5qcyIsImRldlxcdWlcXG5vdGlmaWNhdGlvbnNcXGluZGV4LmpzIiwiZGV2XFx1aVxcbm90aWZpY2F0aW9uc1xcbm90aWZ5LmpzIiwiZGV2XFx1aVxccG9seWZpbGxzXFxkZXRhaWxzLmpzIiwiZGV2XFx1aVxccG9seWZpbGxzXFx0ZW1wbGF0ZS5qcyIsImRldlxcdWlcXHRlbXBsYXRlLmpzIiwibm9kZV9tb2R1bGVzL2Fzc2VydC9hc3NlcnQuanMiLCJub2RlX21vZHVsZXMvY29uc29sZS1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RhdGUtbm93L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLE1BQU0sUUFBUSxLQUFSLENBQVo7QUFDQSxJQUFNLGNBQWMsUUFBUSxXQUFSLENBQXBCO0FBQ0EsSUFBTSxLQUFLLFFBQVEsSUFBUixDQUFYO0FBQ0EsSUFBTSxVQUFVLFFBQVEsbUJBQVIsQ0FBaEI7QUFDQSxJQUFNLE9BQU8sUUFBUSxnQkFBUixDQUFiO0FBQ0EsSUFBTSxNQUFNLFFBQVEsc0JBQVIsQ0FBWjtBQUNBLElBQU0sUUFBUSxRQUFRLGlCQUFSLENBQWQ7QUFDQSxJQUFNLE9BQU8sUUFBUSxnQkFBUixDQUFiOztBQUVBO0FBQ0EsSUFBSSxXQUFXLEVBQWY7QUFDQSxJQUFJLFNBQVMsRUFBYjtBQUNBLElBQU0sYUFBYSxlQUFuQjs7QUFHQTs7Ozs7Ozs7O0FBU0EsU0FBUyxtQkFBVCxDQUE2QixTQUE3QixFQUF3QyxT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Q0FBUDtBQUFBLFNBQXBCO0FBQ0g7QUFDSjs7OztBQ2xGRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBib3QgPSByZXF1aXJlKCdib3QnKTtcclxuY29uc3QgYm90X2NvbnNvbGUgPSByZXF1aXJlKCcuL2NvbnNvbGUnKTtcclxuY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgYWpheCA9IHJlcXVpcmUoJ2xpYnJhcmllcy9hamF4Jyk7XHJcbmNvbnN0IGFwaSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ibG9ja2hlYWRzJyk7XHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5cclxuLy8gQXJyYXkgb2YgSURzIHRvIGF1dG9sb2FkIGF0IHRoZSBuZXh0IGxhdW5jaC5cclxudmFyIGF1dG9sb2FkID0gW107XHJcbnZhciBsb2FkZWQgPSBbXTtcclxuY29uc3QgU1RPUkFHRV9JRCA9ICdtYl9leHRlbnNpb25zJztcclxuXHJcblxyXG4vKipcclxuICogVXNlZCB0byBjcmVhdGUgYSBuZXcgZXh0ZW5zaW9uLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgdGVzdCA9IE1lc3NhZ2VCb3RFeHRlbnNpb24oJ3Rlc3QnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVzcGFjZSAtIFNob3VsZCBiZSB0aGUgc2FtZSBhcyB5b3VyIHZhcmlhYmxlIG5hbWUuXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFt1bmluc3RhbGwgPSB1bmRlZmluZWRdIC0gT3B0aW9uYWwsIHNwZWNpZnkgdGhlIHVuaW5zdGFsbCBmdW5jdGlvbiB3aGlsZSBjcmVhdGluZyB0aGUgZXh0ZW5zaW9uLCBpbnN0ZWFkIG9mIGxhdGVyLiBJZiBzcGVjaWZpZWQgaGVyZSwgdGhpcyB3aWxsIGJlIGJvdW5kIHRvIHRoZSBleHRlbnNpb24uXHJcbiAqIEByZXR1cm4ge01lc3NhZ2VCb3RFeHRlbnNpb259IC0gVGhlIGV4dGVuc2lvbiB2YXJpYWJsZS5cclxuICovXHJcbmZ1bmN0aW9uIE1lc3NhZ2VCb3RFeHRlbnNpb24obmFtZXNwYWNlLCB1bmluc3RhbGwpIHtcclxuICAgIGxvYWRlZC5wdXNoKG5hbWVzcGFjZSk7XHJcbiAgICBob29rLmZpcmUoJ2V4dGVuc2lvbi5pbnN0YWxsJywgbmFtZXNwYWNlKTtcclxuXHJcbiAgICB2YXIgZXh0ZW5zaW9uID0ge1xyXG4gICAgICAgIGlkOiBuYW1lc3BhY2UsXHJcbiAgICAgICAgYm90LFxyXG4gICAgICAgIGNvbnNvbGU6IGJvdF9jb25zb2xlLFxyXG4gICAgICAgIHVpLFxyXG4gICAgICAgIHN0b3JhZ2UsXHJcbiAgICAgICAgYWpheCxcclxuICAgICAgICBhcGksXHJcbiAgICAgICAgd29ybGQsXHJcbiAgICAgICAgaG9vayxcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHR5cGVvZiB1bmluc3RhbGwgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGV4dGVuc2lvbi51bmluc3RhbGwgPSB1bmluc3RhbGwuYmluZChleHRlbnNpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXNlZCB0byBjaGFuZ2Ugd2hldGhlciBvciBub3QgdGhlIGV4dGVuc2lvbiB3aWxsIGJlXHJcbiAgICAgKiBBdXRvbWF0aWNhbGx5IGxvYWRlZCB0aGUgbmV4dCB0aW1lIHRoZSBib3QgaXMgbGF1bmNoZWQuXHJcbiAgICAgKlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHZhciB0ZXN0ID0gTWVzc2FnZUJvdEV4dGVuc2lvbigndGVzdCcpO1xyXG4gICAgICogdGVzdC5zZXRBdXRvTGF1bmNoKHRydWUpO1xyXG4gICAgICogQHBhcmFtIHtib29sfSBzaG91bGRBdXRvbG9hZFxyXG4gICAgICovXHJcbiAgICBleHRlbnNpb24uc2V0QXV0b0xhdW5jaCA9IGZ1bmN0aW9uIHNldEF1dG9MYXVuY2goc2hvdWxkQXV0b2xvYWQpIHtcclxuICAgICAgICBpZiAoIWF1dG9sb2FkLmluY2x1ZGVzKG5hbWVzcGFjZSkgJiYgc2hvdWxkQXV0b2xvYWQpIHtcclxuICAgICAgICAgICAgYXV0b2xvYWQucHVzaChuYW1lc3BhY2UpO1xyXG4gICAgICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBhdXRvbG9hZCwgZmFsc2UpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIXNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgICAgIGlmIChhdXRvbG9hZC5pbmNsdWRlcyhuYW1lc3BhY2UpKSB7XHJcbiAgICAgICAgICAgICAgICBhdXRvbG9hZC5zcGxpY2UoYXV0b2xvYWQuaW5kZXhPZihuYW1lc3BhY2UpLCAxKTtcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGF1dG9sb2FkLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBleHRlbnNpb247XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmllcyB0byBsb2FkIHRoZSByZXF1ZXN0ZWQgZXh0ZW5zaW9uIGJ5IElELlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcclxuICovXHJcbk1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbCA9IGZ1bmN0aW9uIGluc3RhbGwoaWQpIHtcclxuICAgIGlmICghbG9hZGVkLmluY2x1ZGVzKGlkKSkge1xyXG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gICAgICAgIGVsLnNyYyA9IGAvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2V4dGVuc2lvbi8ke2lkfS9jb2RlL3Jhd2A7XHJcbiAgICAgICAgZWwuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcclxuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBVbmluc3RhbGxzIGFuIGV4dGVuc2lvbi5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAqL1xyXG5NZXNzYWdlQm90RXh0ZW5zaW9uLnVuaW5zdGFsbCA9IGZ1bmN0aW9uIHVuaW5zdGFsbChpZCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aW5kb3dbaWRdLnVuaW5zdGFsbCgpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIC8vTm90IGluc3RhbGxlZCwgb3Igbm8gdW5pbnN0YWxsIGZ1bmN0aW9uLlxyXG4gICAgfVxyXG5cclxuICAgIHdpbmRvd1tpZF0gPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgaWYgKGF1dG9sb2FkLmluY2x1ZGVzKGlkKSkge1xyXG4gICAgICAgIGF1dG9sb2FkLnNwbGljZShhdXRvbG9hZC5pbmRleE9mKGlkKSwgMSk7XHJcbiAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgYXV0b2xvYWQsIGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobG9hZGVkLmluY2x1ZGVzKGlkKSkge1xyXG4gICAgICAgIGxvYWRlZC5zcGxpY2UobG9hZGVkLmluZGV4T2YoaWQpLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICBob29rLmZpcmUoJ2V4dGVuc2lvbi51bmluc3RhbGwnLCBpZCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVXNlZCB0byBjaGVjayBpZiBhbiBleHRlbnNpb24gaGFzIGJlZW4gbG9hZGVkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbk1lc3NhZ2VCb3RFeHRlbnNpb24uaXNMb2FkZWQgPSBmdW5jdGlvbiBpc0xvYWRlZChpZCkge1xyXG4gICAgcmV0dXJuIGxvYWRlZC5pbmNsdWRlcyhpZCk7XHJcbn07XHJcblxyXG4vLyBMb2FkIGV4dGVuc2lvbnMgdGhhdCBzZXQgdGhlbXNlbHZlcyB0byBhdXRvbG9hZCBsYXN0IGxhdW5jaC5cclxuc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10sIGZhbHNlKVxyXG4gICAgLmZvckVhY2goTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWVzc2FnZUJvdEV4dGVuc2lvbjtcclxuIiwiLyoqXHJcbiAqIEBmaWxlIERlcHJpY2F0ZWQuIFVzZSB3b3JsZC5pc1tHcm91cF0gaW5zdGVhZC5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNoZWNrR3JvdXBcclxufTtcclxuXHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgaWYgdXNlcnMgYXJlIGluIGRlZmluZWQgZ3JvdXBzLlxyXG4gKlxyXG4gKiBAZGVwcmljYXRlZFxyXG4gKiBAZXhhbXBsZVxyXG4gKiBjaGVja0dyb3VwKCdhZG1pbicsICdTRVJWRVInKSAvLyB0cnVlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBncm91cCB0aGUgZ3JvdXAgdG8gY2hlY2tcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHVzZXIgdG8gY2hlY2tcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrR3JvdXAoZ3JvdXAsIG5hbWUpIHtcclxuICAgIGNvbnNvbGUud2FybignYm90LmNoZWNrR3JvdXAgaXMgZGVwcmljYXRlZC4gVXNlIHdvcmxkLmlzQWRtaW4sIHdvcmxkLmlzTW9kLCBldGMuIGluc3RlYWQnKTtcclxuXHJcbiAgICBuYW1lID0gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgc3dpdGNoIChncm91cC50b0xvY2FsZUxvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgY2FzZSAnYWxsJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzUGxheWVyKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ2FkbWluJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzQWRtaW4obmFtZSk7XHJcbiAgICAgICAgY2FzZSAnbW9kJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzTW9kKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ3N0YWZmJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzU3RhZmYobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnb3duZXInOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNPd25lcihuYW1lKTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuIiwiY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcblxyXG5jb25zdCBib3QgPSBPYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL3NlbmQnKSxcclxuICAgIHJlcXVpcmUoJy4vY2hlY2tHcm91cCcpXHJcbik7XHJcblxyXG5ib3QudmVyc2lvbiA9ICc2LjEuMCc7XHJcblxyXG4vKipcclxuICogQGRlcHJpY2F0ZWQgc2luY2UgNi4xLjAuIFVzZSBleC53b3JsZCBpbnN0ZWFkLlxyXG4gKi9cclxuYm90LndvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5zdG9yYWdlLnNldCgnbWJfdmVyc2lvbicsIGJvdC52ZXJzaW9uLCBmYWxzZSk7XHJcbiIsImZ1bmN0aW9uIHVwZGF0ZShrZXlzLCBvcGVyYXRvcikge1xyXG4gICAgT2JqZWN0LmtleXMobG9jYWxTdG9yYWdlKS5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBvZiBrZXlzKSB7XHJcbiAgICAgICAgICAgIGlmIChpdGVtLnN0YXJ0c1dpdGgoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oaXRlbSwgb3BlcmF0b3IobG9jYWxTdG9yYWdlLmdldEl0ZW0oaXRlbSkpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vanNoaW50IC1XMDg2XHJcbi8vTm8gYnJlYWsgc3RhdGVtZW50cyBhcyB3ZSB3YW50IHRvIGV4ZWN1dGUgYWxsIHVwZGF0ZXMgYWZ0ZXIgbWF0Y2hlZCB2ZXJzaW9uIHVubGVzcyBvdGhlcndpc2Ugbm90ZWQuXHJcbnN3aXRjaCAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ21iX3ZlcnNpb24nKSkge1xyXG4gICAgY2FzZSBudWxsOlxyXG4gICAgICAgIGJyZWFrOyAvL05vdGhpbmcgdG8gbWlncmF0ZVxyXG4gICAgY2FzZSAnNS4yLjAnOlxyXG4gICAgY2FzZSAnNS4yLjEnOlxyXG4gICAgICAgIC8vV2l0aCA2LjAsIG5ld2xpbmVzIGFyZSBkaXJlY3RseSBzdXBwb3J0ZWQgaW4gbWVzc2FnZXMgYnkgdGhlIGJvdC5cclxuICAgICAgICB1cGRhdGUoWydhbm5vdW5jZW1lbnRBcnInLCAnam9pbkFycicsICdsZWF2ZUFycicsICd0cmlnZ2VyQXJyJ10sIGZ1bmN0aW9uKHJhdykge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhcnNlZCA9IEpTT04ucGFyc2UocmF3KTtcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1zZy5tZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1zZy5tZXNzYWdlID0gbXNnLm1lc3NhZ2UucmVwbGFjZSgvXFxcXG4vZywgJ1xcbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHBhcnNlZCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhdztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGJyZWFrOyAvL05leHQgYnVnZml4IG9ubHkgcmVsYXRlcyB0byA2LjAgYm90LlxyXG4gICAgY2FzZSAnNi4wLjBhJzpcclxuICAgIGNhc2UgJzYuMC4wJzpcclxuICAgICAgICBhbGVydChcIkR1ZSB0byBhIGJ1ZyBpbiB0aGUgNi4wLjAgdmVyc2lvbiBvZiB0aGUgYm90LCB5b3VyIGpvaW4gYW5kIGxlYXZlIG1lc3NhZ2VzIG1heSBiZSBzd2FwcGVkLiBTb3JyeSEgVGhpcyBjYW5ub3QgYmUgZml4ZWQgYXV0b21hdGljYWxseS4gVGhpcyBtZXNzYWdlIHdpbGwgbm90IGJlIHNob3duIGFnYWluLlwiKTtcclxuICAgICAgICBicmVhazsgLy9OZXh0IGJ1Z2ZpeCBvbmx5IHJlbGF0ZXMgdG8gNi4wLjEgLyA2LjAuMi5cclxuICAgIGNhc2UgJzYuMC4xJzpcclxuICAgIGNhc2UgJzYuMC4yJzpcclxuICAgICAgICBhbGVydChcIkR1ZSB0byBhIGJ1ZyBpbiA2LjAuMSAvIDYuMC4yLCBncm91cHMgbWF5IGhhdmUgYmVlbiBtaXhlZCB1cCBvbiBKb2luLCBMZWF2ZSwgYW5kIFRyaWdnZXIgbWVzc2FnZXMuIFNvcnJ5ISBUaGlzIGNhbm5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5IGlmIGl0IG9jY3VyZWQgb24geW91ciBib3QuIEFubm91bmNlbWVudHMgaGF2ZSBhbHNvIGJlZW4gZml4ZWQuXCIpO1xyXG4gICAgY2FzZSAnNi4wLjMnOlxyXG4gICAgY2FzZSAnNi4wLjQnOlxyXG4gICAgY2FzZSAnNi4wLjUnOlxyXG4gICAgY2FzZSAnNi4wLjYnOlxyXG4gICAgY2FzZSAnNi4xLjBhJzpcclxuICAgICAgICAvL05vcm1hbGl6ZSBncm91cHMgdG8gbG93ZXIgY2FzZS5cclxuICAgICAgICB1cGRhdGUoWydqb2luQXJyJywgJ2xlYXZlQXJyJywgJ3RyaWdnZXJBcnInXSwgZnVuY3Rpb24ocmF3KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcGFyc2VkID0gSlNPTi5wYXJzZShyYXcpO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBtc2cuZ3JvdXAgPSBtc2cuZ3JvdXAudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBtc2cubm90X2dyb3VwID0gbXNnLm5vdF9ncm91cC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocGFyc2VkKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhdztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG59XHJcbi8vanNoaW50ICtXMDg2XHJcbiIsInZhciBhcGkgPSByZXF1aXJlKCdsaWJyYXJpZXMvYmxvY2toZWFkcycpO1xyXG52YXIgc2V0dGluZ3MgPSByZXF1aXJlKCdzZXR0aW5ncy9ib3QnKTtcclxuXHJcbnZhciBxdWV1ZSA9IFtdO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzZW5kLFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gcXVldWUgYSBtZXNzYWdlIHRvIGJlIHNlbnQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNlbmQoJ0hlbGxvIScpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBiZSBzZW50LlxyXG4gKi9cclxuZnVuY3Rpb24gc2VuZChtZXNzYWdlKSB7XHJcbiAgICBpZiAoc2V0dGluZ3Muc3BsaXRNZXNzYWdlcykge1xyXG4gICAgICAgIC8vRklYTUU6IElmIHRoZSBiYWNrc2xhc2ggYmVmb3JlIHRoZSB0b2tlbiBpcyBlc2NhcGVkIGJ5IGFub3RoZXIgYmFja3NsYXNoIHRoZSB0b2tlbiBzaG91bGQgc3RpbGwgc3BsaXQgdGhlIG1lc3NhZ2UuXHJcbiAgICAgICAgbGV0IHN0ciA9IG1lc3NhZ2Uuc3BsaXQoc2V0dGluZ3Muc3BsaXRUb2tlbik7XHJcbiAgICAgICAgbGV0IHRvU2VuZCA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgY3VyciA9IHN0cltpXTtcclxuICAgICAgICAgICAgaWYgKGN1cnJbY3Vyci5sZW5ndGggLSAxXSA9PSAnXFxcXCcgJiYgaSA8IHN0ci5sZW5ndGggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyICs9IHNldHRpbmdzLnNwbGl0VG9rZW4gKyBzdHJbKytpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0b1NlbmQucHVzaChjdXJyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU2VuZC5mb3JFYWNoKG1zZyA9PiBxdWV1ZS5wdXNoKG1zZykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBxdWV1ZS5wdXNoKG1lc3NhZ2UpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogV2F0Y2hlcyB0aGUgcXVldWUgZm9yIG5ldyBtZXNzYWdlcyB0byBzZW5kIGFuZCBzZW5kcyB0aGVtIGFzIHNvb24gYXMgcG9zc2libGUuXHJcbiAqL1xyXG4oZnVuY3Rpb24gY2hlY2tRdWV1ZSgpIHtcclxuICAgIGlmICghcXVldWUubGVuZ3RoKSB7XHJcbiAgICAgICAgc2V0VGltZW91dChjaGVja1F1ZXVlLCA1MDApO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBhcGkuc2VuZChxdWV1ZS5zaGlmdCgpKVxyXG4gICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChjaGVja1F1ZXVlLCAxMDAwKTtcclxuICAgICAgICB9KTtcclxufSgpKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB3cml0ZSxcclxuICAgIGNsZWFyXHJcbn07XHJcblxyXG5mdW5jdGlvbiB3cml0ZShtc2csIG5hbWUgPSAnJywgbmFtZUNsYXNzID0gJycpIHtcclxuICAgIHZhciBtc2dFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgICBpZiAobmFtZUNsYXNzKSB7XHJcbiAgICAgICAgbXNnRWwuc2V0QXR0cmlidXRlKCdjbGFzcycsIG5hbWVDbGFzcyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIG5hbWVFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIG5hbWVFbC50ZXh0Q29udGVudCA9IG5hbWU7XHJcblxyXG4gICAgdmFyIGNvbnRlbnRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIGlmIChuYW1lKSB7XHJcbiAgICAgICAgY29udGVudEVsLnRleHRDb250ZW50ID0gYDogJHttc2d9YDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29udGVudEVsLnRleHRDb250ZW50ID0gbXNnO1xyXG4gICAgfVxyXG4gICAgbXNnRWwuYXBwZW5kQ2hpbGQobmFtZUVsKTtcclxuICAgIG1zZ0VsLmFwcGVuZENoaWxkKGNvbnRlbnRFbCk7XHJcblxyXG4gICAgdmFyIGNoYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSB1bCcpO1xyXG4gICAgY2hhdC5hcHBlbmRDaGlsZChtc2dFbCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsZWFyKCkge1xyXG4gICAgdmFyIGNoYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSB1bCcpO1xyXG4gICAgY2hhdC5pbm5lckhUTUwgPSAnJztcclxufVxyXG4iLCJjb25zdCBzZWxmID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2V4cG9ydHMnKTtcclxuXHJcbmNvbnN0IHNldHRpbmdzID0gcmVxdWlyZSgnc2V0dGluZ3MvYm90Jyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5jb25zdCBzZW5kID0gcmVxdWlyZSgnYm90Jykuc2VuZDtcclxuY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5cclxuXHJcbi8vIFRPRE86IFBhcnNlIHRoZXNlIGFuZCBwcm92aWRlIG9wdGlvbnMgdG8gc2hvdy9oaWRlIGRpZmZlcmVudCBvbmVzLlxyXG5ob29rLm9uKCd3b3JsZC5vdGhlcicsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgIHNlbGYud3JpdGUobWVzc2FnZSwgdW5kZWZpbmVkLCAnb3RoZXInKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5tZXNzYWdlJywgZnVuY3Rpb24obmFtZSwgbWVzc2FnZSkge1xyXG4gICAgbGV0IG1zZ0NsYXNzID0gJ3BsYXllcic7XHJcbiAgICBpZiAod29ybGQuaXNTdGFmZihuYW1lKSkge1xyXG4gICAgICAgIG1zZ0NsYXNzID0gJ3N0YWZmJztcclxuICAgICAgICBpZiAod29ybGQuaXNNb2QobmFtZSkpIHtcclxuICAgICAgICAgICAgbXNnQ2xhc3MgKz0gJyBtb2QnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vSGFzIHRvIGJlIGFkbWluXHJcbiAgICAgICAgICAgIG1zZ0NsYXNzICs9ICcgYWRtaW4nO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIG1zZ0NsYXNzICs9ICcgY29tbWFuZCc7XHJcbiAgICB9XHJcbiAgICBzZWxmLndyaXRlKG1lc3NhZ2UsIG5hbWUsIG1zZ0NsYXNzKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5zZXJ2ZXJjaGF0JywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgc2VsZi53cml0ZShtZXNzYWdlLCAnU0VSVkVSJywgJ2FkbWluJyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQuc2VuZCcsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIHNlbGYud3JpdGUobWVzc2FnZSwgJ1NFUlZFUicsICdhZG1pbiBjb21tYW5kJyk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy9NZXNzYWdlIGhhbmRsZXJzXHJcbmhvb2sub24oJ3dvcmxkLmpvaW4nLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJKb2luKG5hbWUsIGlwKSB7XHJcbiAgICBzZWxmLndyaXRlKGAke25hbWV9ICgke2lwfSkgaGFzIGpvaW5lZCB0aGUgc2VydmVyYCwgJ1NFUlZFUicsICdqb2luIHdvcmxkIGFkbWluJyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQubGVhdmUnLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJMZWF2ZShuYW1lKSB7XHJcbiAgICBzZWxmLndyaXRlKGAke25hbWV9IGhhcyBsZWZ0IHRoZSBzZXJ2ZXJgLCAnU0VSVkVSJywgYGxlYXZlIHdvcmxkIGFkbWluYCk7XHJcbn0pO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0NvbnNvbGUnKTtcclxudGFiLmlubmVySFRNTCA9ICc8c3R5bGU+JyArXHJcbiAgICBcIiNtYl9jb25zb2xle2hlaWdodDpjYWxjKDEwMCUgLSA1MHB4KX0jbWJfY29uc29sZSAubW9kPnNwYW46Zmlyc3QtY2hpbGR7Y29sb3I6IzA1ZjUyOX0jbWJfY29uc29sZSAuYWRtaW4+c3BhbjpmaXJzdC1jaGlsZHtjb2xvcjojMmIyNmJkfSNtYl9jb25zb2xlIC5jaGF0e21hcmdpbjoxZW07bWF4LWhlaWdodDpjYWxjKDEwMHZoIC0gM2VtIC0gNTVweCk7d2lkdGg6Y2FsYygxMDB2dyAtIDJlbSk7b3ZlcmZsb3cteTphdXRvfSNtYl9jb25zb2xlIC5jaGF0LWNvbnRyb2x7cG9zaXRpb246Zml4ZWQ7Ym90dG9tOjA7d2lkdGg6MTAwdnd9I21iX2NvbnNvbGUgLmNoYXQtY29udHJvbCAuY29udHJvbHttYXJnaW46MWVtfVxcblwiICtcclxuICAgICc8L3N0eWxlPicgK1xyXG4gICAgXCI8ZGl2IGlkPVxcXCJtYl9jb25zb2xlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY2hhdFxcXCI+XFxyXFxuICAgICAgICA8dWw+PC91bD5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNoYXQtY29udHJvbFxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjb250cm9sIGhhcy1hZGRvbnNcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiaW5wdXQgaXMtZXhwYW5kZWRcXFwiLz5cXHJcXG4gICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVxcXCJpbnB1dCBidXR0b24gaXMtcHJpbWFyeVxcXCI+U0VORDwvYnV0dG9uPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxuLy8gSWYgZW5hYmxlZCwgc2hvdyBtZXNzYWdlcyBmb3IgbmV3IGNoYXQgd2hlbiBub3Qgb24gdGhlIGNvbnNvbGUgcGFnZVxyXG5ob29rLm9uKCd3b3JsZC5jaGF0JywgZnVuY3Rpb24obmFtZSwgbWVzc2FnZSkge1xyXG4gICAgaWYgKHNldHRpbmdzLm5vdGlmeSAmJiAhdGFiLmNsYXNzTGlzdC5jb250YWlucygndmlzaWJsZScpKSB7XHJcbiAgICAgICAgdWkubm90aWZ5KGAke25hbWV9OiAke21lc3NhZ2V9YCwgMS41KTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuLy8gQXV0byBzY3JvbGwgd2hlbiBuZXcgbWVzc2FnZXMgYXJlIGFkZGVkIHRvIHRoZSBwYWdlLCB1bmxlc3MgdGhlIG93bmVyIGlzIHJlYWRpbmcgb2xkIGNoYXQuXHJcbihuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiBzaG93TmV3Q2hhdCgpIHtcclxuICAgIGxldCBjb250YWluZXIgPSB0YWIucXVlcnlTZWxlY3RvcignLmNoYXQnKTtcclxuICAgIGxldCBsYXN0TGluZSA9IHRhYi5xdWVyeVNlbGVjdG9yKCdsaTpsYXN0LWNoaWxkJyk7XHJcblxyXG4gICAgaWYgKCFjb250YWluZXIgfHwgIWxhc3RMaW5lKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjb250YWluZXIuc2Nyb2xsSGVpZ2h0IC0gY29udGFpbmVyLmNsaWVudEhlaWdodCAtIGNvbnRhaW5lci5zY3JvbGxUb3AgPD0gbGFzdExpbmUuY2xpZW50SGVpZ2h0ICogMTApIHtcclxuICAgICAgICBsYXN0TGluZS5zY3JvbGxJbnRvVmlldyhmYWxzZSk7XHJcbiAgICB9XHJcbn0pKS5vYnNlcnZlKHRhYi5xdWVyeVNlbGVjdG9yKCcuY2hhdCcpLCB7Y2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlfSk7XHJcblxyXG5cclxuLy8gUmVtb3ZlIG9sZCBjaGF0IHRvIHJlZHVjZSBtZW1vcnkgdXNhZ2VcclxuKG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIHJlbW92ZU9sZENoYXQoKSB7XHJcbiAgICB2YXIgY2hhdCA9IHRhYi5xdWVyeVNlbGVjdG9yKCd1bCcpO1xyXG5cclxuICAgIHdoaWxlIChjaGF0LmNoaWxkcmVuLmxlbmd0aCA+IDUwMCkge1xyXG4gICAgICAgIGNoYXQuY2hpbGRyZW5bMF0ucmVtb3ZlKCk7XHJcbiAgICB9XHJcbn0pKS5vYnNlcnZlKHRhYi5xdWVyeVNlbGVjdG9yKCcuY2hhdCcpLCB7Y2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlfSk7XHJcblxyXG4vLyBMaXN0ZW4gZm9yIHRoZSB1c2VyIHRvIHNlbmQgbWVzc2FnZXNcclxuZnVuY3Rpb24gdXNlclNlbmQoKSB7XHJcbiAgICB2YXIgaW5wdXQgPSB0YWIucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcclxuICAgIGhvb2suZmlyZSgnY29uc29sZS5zZW5kJywgaW5wdXQudmFsdWUpO1xyXG4gICAgc2VuZChpbnB1dC52YWx1ZSk7XHJcbiAgICBpbnB1dC52YWx1ZSA9ICcnO1xyXG4gICAgaW5wdXQuZm9jdXMoKTtcclxufVxyXG5cclxudGFiLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0JykuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICBpZiAoZXZlbnQua2V5ID09IFwiRW50ZXJcIiB8fCBldmVudC5rZXlDb2RlID09IDEzKSB7XHJcbiAgICAgICAgdXNlclNlbmQoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG50YWIucXVlcnlTZWxlY3RvcignYnV0dG9uJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB1c2VyU2VuZCk7XHJcbiIsIi8vVE9ETzogVXNlIGZldGNoXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBHRVQgYSBwYWdlLiBQYXNzZXMgdGhlIHJlc3BvbnNlIG9mIHRoZSBYSFIgaW4gdGhlIHJlc29sdmUgcHJvbWlzZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogLy9zZW5kcyBhIEdFVCByZXF1ZXN0IHRvIC9zb21lL3VybC5waHA/YT10ZXN0XHJcbiAqIGdldCgnL3NvbWUvdXJsLnBocCcsIHthOiAndGVzdCd9KS50aGVuKGNvbnNvbGUubG9nKVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNTdHJcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldCh1cmwgPSAnLycsIHBhcmFtcyA9IHt9KSB7XHJcbiAgICBpZiAoT2JqZWN0LmtleXMocGFyYW1zKS5sZW5ndGgpIHtcclxuICAgICAgICB2YXIgYWRkaXRpb24gPSB1cmxTdHJpbmdpZnkocGFyYW1zKTtcclxuICAgICAgICBpZiAodXJsLmluY2x1ZGVzKCc/JykpIHtcclxuICAgICAgICAgICAgdXJsICs9IGAmJHthZGRpdGlvbn1gO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHVybCArPSBgPyR7YWRkaXRpb259YDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHhocignR0VUJywgdXJsLCB7fSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhIEpTT04gb2JqZWN0IGluIHRoZSBwcm9taXNlIHJlc29sdmUgbWV0aG9kLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbU9ialxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0SlNPTih1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiBnZXQodXJsLCBwYXJhbU9iaikudGhlbihKU09OLnBhcnNlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBtYWtlIGEgcG9zdCByZXF1ZXN0XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtT2JqXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBwb3N0KHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIHhocignUE9TVCcsIHVybCwgcGFyYW1PYmopO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGZldGNoIEpTT04gZnJvbSBhIHBhZ2UgdGhyb3VnaCBwb3N0LlxyXG4gKlxyXG4gKiBAcGFyYW0gc3RyaW5nIHVybFxyXG4gKiBAcGFyYW0gc3RyaW5nIHBhcmFtT2JqXHJcbiAqIEByZXR1cm4gUHJvbWlzZVxyXG4gKi9cclxuZnVuY3Rpb24gcG9zdEpTT04odXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4gcG9zdCh1cmwsIHBhcmFtT2JqKS50aGVuKEpTT04ucGFyc2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiogSGVscGVyIGZ1bmN0aW9uIHRvIG1ha2UgWEhSIHJlcXVlc3RzLCBpZiBwb3NzaWJsZSB1c2UgdGhlIGdldCBhbmQgcG9zdCBmdW5jdGlvbnMgaW5zdGVhZC5cclxuKlxyXG4qIEBkZXByaWNhdGVkIHNpbmNlIHZlcnNpb24gNi4xXHJcbiogQHBhcmFtIHN0cmluZyBwcm90b2NvbFxyXG4qIEBwYXJhbSBzdHJpbmcgdXJsXHJcbiogQHBhcmFtIG9iamVjdCBwYXJhbU9iaiAtLSBXQVJOSU5HLiBPbmx5IGFjY2VwdHMgc2hhbGxvdyBvYmplY3RzLlxyXG4qIEByZXR1cm4gUHJvbWlzZVxyXG4qL1xyXG5mdW5jdGlvbiB4aHIocHJvdG9jb2wsIHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgdmFyIHBhcmFtU3RyID0gdXJsU3RyaW5naWZ5KHBhcmFtT2JqKTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICB2YXIgcmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgcmVxLm9wZW4ocHJvdG9jb2wsIHVybCk7XHJcbiAgICAgICAgcmVxLnNldFJlcXVlc3RIZWFkZXIoJ1gtUmVxdWVzdGVkLVdpdGgnLCAnWE1MSHR0cFJlcXVlc3QnKTtcclxuICAgICAgICBpZiAocHJvdG9jb2wgPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICAgIHJlcS5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXEub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09IDIwMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXEuc3RhdHVzVGV4dCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvLyBIYW5kbGUgbmV0d29yayBlcnJvcnNcclxuICAgICAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZWplY3QoRXJyb3IoXCJOZXR3b3JrIEVycm9yXCIpKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChwYXJhbVN0cikge1xyXG4gICAgICAgICAgICByZXEuc2VuZChwYXJhbVN0cik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVxLnNlbmQoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIHN0cmluZ2lmeSB1cmwgcGFyYW1ldGVyc1xyXG4gKi9cclxuZnVuY3Rpb24gdXJsU3RyaW5naWZ5KG9iaikge1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iailcclxuICAgIC5tYXAoayA9PiBgJHtlbmNvZGVVUklDb21wb25lbnQoayl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KG9ialtrXSl9YClcclxuICAgIC5qb2luKCcmJyk7XHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHt4aHIsIGdldCwgZ2V0SlNPTiwgcG9zdCwgcG9zdEpTT059O1xyXG4iLCIvKipcclxuICogQGZpbGUgQ29udGFpbnMgZnVuY3Rpb25zIHRvIGludGVyYWN0IHdpdGggYmxvY2toZWFkc2ZhbnMuY29tIC0gY2Fubm90IGJlIHVzZWQgYnkgZXh0ZW5zaW9ucy5cclxuICovXHJcblxyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgYWpheCA9IHJlcXVpcmUoJ2xpYnJhcmllcy9hamF4Jyk7XHJcblxyXG5jb25zdCBBUElfVVJMUyA9IHtcclxuICAgIFNUT1JFOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9hcGkvZXh0ZW5zaW9uL3N0b3JlJyxcclxuICAgIE5BTUU6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2FwaS9leHRlbnNpb24vaW5mbycsXHJcbiAgICBFUlJPUjogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvYXBpL2Vycm9yJyxcclxufTtcclxuXHJcbnZhciBjYWNoZSA9IHtcclxuICAgIGluZm86IG5ldyBNYXAoKSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGdldCBwdWJsaWMgZXh0ZW5zaW9uc1xyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRTdG9yZSgpLnRoZW4oc3RvcmUgPT4gY29uc29sZS5sb2coc3RvcmUpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gdXNlIHRoZSBjYWNoZWQgcmVzcG9uc2Ugc2hvdWxkIGJlIGNsZWFyZWQuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9IHJlc29sdmVzIHdpdGggdGhlIHJlc3BvbnNlXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRTdG9yZShyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRTdG9yZSkge1xyXG4gICAgICAgIGNhY2hlLmdldFN0b3JlID0gYWpheC5nZXRKU09OKEFQSV9VUkxTLlNUT1JFKVxyXG4gICAgICAgICAgICAudGhlbihzdG9yZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvL0J1aWxkIHRoZSBpbml0aWFsIG5hbWVzIG1hcFxyXG4gICAgICAgICAgICAgICAgaWYgKHN0b3JlLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGV4IG9mIHN0b3JlLmV4dGVuc2lvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5pbmZvLnNldChleC5pZCwgZXgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0U3RvcmU7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbmFtZSBvZiB0aGUgcHJvdmlkZWQgZXh0ZW5zaW9uIElELlxyXG4gKiBJZiB0aGUgZXh0ZW5zaW9uIHdhcyBub3QgZm91bmQsIHJlc29sdmVzIHdpdGggdGhlIG9yaWdpbmFsIHBhc3NlZCBJRC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0RXh0ZW5zaW9uSW5mbygndGVzdCcpLnRoZW4oaW5mbyA9PiBjb25zb2xlLmxvZyhpbmZvKSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCB0aGUgaWQgdG8gc2VhcmNoIGZvci5cclxuICogQHJldHVybiB7UHJvbWlzZX0gcmVzb2x2ZXMgd2l0aCB0aGUgZXh0ZW5zaW9uJ3MgbmFtZSwgc25pcHBldCwgYW5kIElELlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uSW5mbyhpZCkge1xyXG4gICAgaWYgKGNhY2hlLmluZm8uaGFzKGlkKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGUuaW5mby5nZXQoaWQpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWpheC5nZXRKU09OKEFQSV9VUkxTLk5BTUUsIHtpZH0pLnRoZW4oKHtpZCwgdGl0bGUsIHNuaXBwZXR9KSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmluZm9cclxuICAgICAgICAgICAgLnNldChpZCwge2lkLCB0aXRsZSwgc25pcHBldH0pXHJcbiAgICAgICAgICAgIC5nZXQoaWQpO1xyXG4gICAgfSwgZXJyID0+IHtcclxuICAgICAgICByZXBvcnRFcnJvcihlcnIpO1xyXG4gICAgICAgIHJldHVybiB7bmFtZTogaWQsIGlkOiBpZCwgc25pcHBldDogJ05vIGRlc2NyaXB0aW9uLid9O1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVwb3J0cyBhbiBlcnJvciBzbyB0aGF0IGl0IGNhbiBiZSByZXZpZXdlZCBhbmQgZml4ZWQgYnkgZXh0ZW5zaW9uIG9yIGJvdCBkZXZlbG9wZXJzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiByZXBvcnRFcnJvcihFcnJvcihcIlJlcG9ydCBtZVwiKSk7XHJcbiAqIEBwYXJhbSB7RXJyb3J9IGVyciB0aGUgZXJyb3IgdG8gcmVwb3J0XHJcbiAqL1xyXG5mdW5jdGlvbiByZXBvcnRFcnJvcihlcnIpIHtcclxuICAgIGFqYXgucG9zdEpTT04oQVBJX1VSTFMuRVJST1IsIHtcclxuICAgICAgICAgICAgZXJyb3JfdGV4dDogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgIGVycm9yX2ZpbGU6IGVyci5maWxlbmFtZSxcclxuICAgICAgICAgICAgZXJyb3Jfcm93OiBlcnIubGluZW5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX2NvbHVtbjogZXJyLmNvbG5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX3N0YWNrOiBlcnIuc3RhY2sgfHwgJycsXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigocmVzcCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgaG9vay5maXJlKCdlcnJvcl9yZXBvcnQnLCAnU29tZXRoaW5nIHdlbnQgd3JvbmcsIGl0IGhhcyBiZWVuIHJlcG9ydGVkLicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaG9vay5maXJlKCdlcnJvcl9yZXBvcnQnLCBgRXJyb3IgcmVwb3J0aW5nIGV4Y2VwdGlvbjogJHtyZXNwLm1lc3NhZ2V9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBnZXRTdG9yZSxcclxuICAgIGdldEV4dGVuc2lvbkluZm8sXHJcbiAgICByZXBvcnRFcnJvcixcclxufTtcclxuIiwidmFyIGFqYXggPSByZXF1aXJlKCcuL2FqYXgnKTtcclxudmFyIGhvb2sgPSByZXF1aXJlKCcuL2hvb2snKTtcclxudmFyIGJoZmFuc2FwaSA9IHJlcXVpcmUoJy4vYmhmYW5zYXBpJyk7XHJcblxyXG5jb25zdCB3b3JsZElkID0gd2luZG93LndvcmxkSWQ7XHJcbnZhciBjYWNoZSA9IHtcclxuICAgIGZpcnN0SWQ6IDAsXHJcbn07XHJcblxyXG4vLyBVc2VkIHRvIHBhcnNlIG1lc3NhZ2VzIG1vcmUgYWNjdXJhdGVseVxyXG52YXIgd29ybGQgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW11cclxufTtcclxuZ2V0T25saW5lUGxheWVycygpXHJcbiAgICAudGhlbihwbGF5ZXJzID0+IHdvcmxkLnBsYXllcnMgPSBbLi4ubmV3IFNldChwbGF5ZXJzLmNvbmNhdCh3b3JsZC5wbGF5ZXJzKSldKTtcclxuXHJcbmdldFdvcmxkTmFtZSgpXHJcbiAgICAudGhlbihuYW1lID0+IHdvcmxkLm5hbWUgPSBuYW1lKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHdvcmxkU3RhcnRlZCxcclxuICAgIGdldExvZ3MsXHJcbiAgICBnZXRMaXN0cyxcclxuICAgIGdldEhvbWVwYWdlLFxyXG4gICAgZ2V0T25saW5lUGxheWVycyxcclxuICAgIGdldE93bmVyTmFtZSxcclxuICAgIGdldFdvcmxkTmFtZSxcclxuICAgIHNlbmQsXHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIHRoZSB3b3JsZCBpZiBuZWNjZXNzYXJ5LCByZWplY3RzIGlmIHRoZSB3b3JsZCB0YWtlcyB0b28gbG9uZyB0byBzdGFydCBvciBpcyB1bmF2YWlsaWJsZVxyXG4gKiBSZWZhY3RvcmluZyB3ZWxjb21lLiBUaGlzIHNlZW1zIG92ZXJseSBweXJhbWlkIGxpa2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHdvcmxkU3RhcnRlZCgpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ3N0YXJ0ZWQhJykpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWNoZWNrIGlmIHRoZSB3b3JsZCBpcyBzdGFydGVkLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gd29ybGRTdGFydGVkKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLndvcmxkU3RhcnRlZCkge1xyXG4gICAgICAgIGNhY2hlLndvcmxkU3RhcnRlZCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdmFyIGZhaWxzID0gMDtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uIGNoZWNrKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ291bGQgdGhpcyBiZSBtb3JlIHNpbXBsaWZpZWQ/XHJcbiAgICAgICAgICAgICAgICBhamF4LnBvc3RKU09OKCcvYXBpJywgeyBjb21tYW5kOiAnc3RhdHVzJywgd29ybGRJZCB9KS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlc3BvbnNlLndvcmxkU3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ29ubGluZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdvZmZsaW5lJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFqYXgucG9zdEpTT04oJy9hcGknLCB7IGNvbW1hbmQ6ICdzdGFydCcsIHdvcmxkSWQgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihjaGVjaywgY2hlY2spO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3VuYXZhaWxpYmxlJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdXb3JsZCB1bmF2YWlsaWJsZS4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0YXJ0dXAnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzaHV0ZG93bic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0b3JpbmcnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVjaywgMzAwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKytmYWlscyA+IDEwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ1dvcmxkIHRvb2sgdG9vIGxvbmcgdG8gc3RhcnQuJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignVW5rbm93biByZXNwb25zZS4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKTtcclxuICAgICAgICAgICAgfSgpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUud29ybGRTdGFydGVkO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgdGhlIGxvZydzIGxpbmVzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMb2dzKCkudGhlbihsaW5lcyA9PiBjb25zb2xlLmxvZyhsaW5lc1swXSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWRvd25sb2FkIHRoZSBsb2dzXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMb2dzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldExvZ3MpIHtcclxuICAgICAgICBjYWNoZS5nZXRMb2dzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbG9ncy8ke3dvcmxkSWR9YCkpXHJcbiAgICAgICAgICAgIC50aGVuKGxvZyA9PiBsb2cuc3BsaXQoJ1xcbicpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0TG9ncztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIGEgbGlzdCBvZiBhZG1pbnMsIG1vZHMsIHN0YWZmIChhZG1pbnMgKyBtb2RzKSwgd2hpdGVsaXN0LCBhbmQgYmxhY2tsaXN0LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMaXN0cygpLnRoZW4obGlzdHMgPT4gY29uc29sZS5sb2cobGlzdHMuYWRtaW4pKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmZXRjaCB0aGUgbGlzdHMuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMaXN0cyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRMaXN0cykge1xyXG4gICAgICAgIGNhY2hlLmdldExpc3RzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbGlzdHMvJHt3b3JsZElkfWApKVxyXG4gICAgICAgICAgICAudGhlbihodG1sID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldExpc3QobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gZG9jLnF1ZXJ5U2VsZWN0b3IoYHRleHRhcmVhW25hbWU9JHtuYW1lfV1gKVxyXG4gICAgICAgICAgICAgICAgICAgIC52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIC50b0xvY2FsZVVwcGVyQ2FzZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCdcXG4nKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWy4uLm5ldyBTZXQobGlzdCldOyAvL1JlbW92ZSBkdXBsaWNhdGVzXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGxpc3RzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFkbWluOiBnZXRMaXN0KCdhZG1pbnMnKSxcclxuICAgICAgICAgICAgICAgICAgICBtb2Q6IGdldExpc3QoJ21vZGxpc3QnKSxcclxuICAgICAgICAgICAgICAgICAgICB3aGl0ZTogZ2V0TGlzdCgnd2hpdGVsaXN0JyksXHJcbiAgICAgICAgICAgICAgICAgICAgYmxhY2s6IGdldExpc3QoJ2JsYWNrbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGxpc3RzLm1vZCA9IGxpc3RzLm1vZC5maWx0ZXIobmFtZSA9PiAhbGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgbGlzdHMuc3RhZmYgPSBsaXN0cy5hZG1pbi5jb25jYXQobGlzdHMubW9kKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdHM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRMaXN0cztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSBob21lcGFnZSBvZiB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiBjb25zb2xlLmxvZyhodG1sLnN1YnN0cmluZygwLCAxMDApKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZmV0Y2ggdGhlIHBhZ2UuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRIb21lcGFnZShyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRIb21lcGFnZSkge1xyXG4gICAgICAgIGNhY2hlLmdldEhvbWVwYWdlID0gYWpheC5nZXQoYC93b3JsZHMvJHt3b3JsZElkfWApXHJcbiAgICAgICAgICAgIC5jYXRjaCgoKSA9PiBnZXRIb21lcGFnZSh0cnVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldEhvbWVwYWdlO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgcGxheWVyIG5hbWVzLlxyXG4gKiBBbiBvbmxpbmUgbGlzdCBpcyBtYWludGFpbmVkIGJ5IHRoZSBib3QsIHRoaXMgc2hvdWxkIGdlbmVyYWxseSBub3QgYmUgdXNlZC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T25saW5lUGxheWVycygpLnRoZW4ob25saW5lID0+IHsgZm9yIChsZXQgbiBvZiBvbmxpbmUpIHsgY29uc29sZS5sb2cobiwgJ2lzIG9ubGluZSEnKX19KTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmcmVzaCB0aGUgb25saW5lIG5hbWVzLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T25saW5lUGxheWVycyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0T25saW5lUGxheWVycyA9IGdldEhvbWVwYWdlKHRydWUpXHJcbiAgICAgICAgICAgIC50aGVuKChodG1sKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJFbGVtcyA9IGRvYy5xdWVyeVNlbGVjdG9yKCcubWFuYWdlci5wYWRkZWQ6bnRoLWNoaWxkKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAucXVlcnlTZWxlY3RvckFsbCgndHI6bm90KC5oaXN0b3J5KSA+IHRkLmxlZnQnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgQXJyYXkuZnJvbShwbGF5ZXJFbGVtcykuZm9yRWFjaCgoZWwpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJzLnB1c2goZWwudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGxheWVycztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldE9ubGluZVBsYXllcnM7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgc2VydmVyIG93bmVyJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T3duZXJOYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBpcyBvd25lZCBieScsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE93bmVyTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcuc3ViaGVhZGVyfnRyPnRkOm5vdChbY2xhc3NdKScpLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIHdvcmxkJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0V29ybGROYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBuYW1lOicsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldFdvcmxkTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcjdGl0bGUnKS50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZW5kcyBhIG1lc3NhZ2UsIHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiBzZW50IG9yIHJlamVjdHMgb24gZmFpbHVyZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2VuZCgnaGVsbG8hJykudGhlbigoKSA9PiBjb25zb2xlLmxvZygnc2VudCcpKS5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gc2VuZC5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHNlbmQobWVzc2FnZSkge1xyXG4gICAgcmV0dXJuIGFqYXgucG9zdEpTT04oYC9hcGlgLCB7Y29tbWFuZDogJ3NlbmQnLCBtZXNzYWdlLCB3b3JsZElkfSlcclxuICAgICAgICAudGhlbihyZXNwID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlc3Auc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXNwO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4ocmVzcCA9PiB7XHJcbiAgICAgICAgICAgIC8vSGFuZGxlIGhvb2tzXHJcbiAgICAgICAgICAgIGhvb2suZmlyZSgnd29ybGQuc2VuZCcsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBob29rLmZpcmUoJ3dvcmxkLnNlcnZlcm1lc3NhZ2UnLCBtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgIC8vRGlzYWxsb3cgY29tbWFuZHMgc3RhcnRpbmcgd2l0aCBzcGFjZS5cclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpICYmICFtZXNzYWdlLnN0YXJ0c1dpdGgoJy8gJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFyZ3MgPSAnJztcclxuICAgICAgICAgICAgICAgIGlmIChjb21tYW5kLmluY2x1ZGVzKCcgJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBtZXNzYWdlLnN1YnN0cmluZyhtZXNzYWdlLmluZGV4T2YoJyAnKSArIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsICdTRVJWRVInLCBjb21tYW5kLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3A7XHJcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgaWYgKGVyciA9PSAnV29ybGQgbm90IHJ1bm5pbmcuJykge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuZmlyc3RJZCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIHdhdGNoIGNoYXQuXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja0NoYXQoKSB7XHJcbiAgICBnZXRNZXNzYWdlcygpLnRoZW4oKG1zZ3MpID0+IHtcclxuICAgICAgICBtc2dzLmZvckVhY2goKG1lc3NhZ2UpID0+IHtcclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChgJHt3b3JsZC5uYW1lfSAtIFBsYXllciBDb25uZWN0ZWQgYCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBbLCBuYW1lLCBpcF0gPSBtZXNzYWdlLm1hdGNoKC8gLSBQbGF5ZXIgQ29ubmVjdGVkICguKikgXFx8IChbXFxkLl0rKSBcXHwgKFtcXHddezMyfSlcXHMqJC8pO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlSm9pbk1lc3NhZ2VzKG5hbWUsIGlwKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkLm5hbWV9IC0gUGxheWVyIERpc2Nvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBtZXNzYWdlLnN1YnN0cmluZyh3b3JsZC5uYW1lLmxlbmd0aCArIDIzKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJzogJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gZ2V0VXNlcm5hbWUobWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbXNnID0gbWVzc2FnZS5zdWJzdHJpbmcobmFtZS5sZW5ndGggKyAyKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtc2cpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZU90aGVyTWVzc2FnZXMobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcilcclxuICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQ2hhdCwgNTAwMCk7XHJcbiAgICB9KTtcclxufVxyXG5jaGVja0NoYXQoKTtcclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2V0IHRoZSBsYXRlc3QgY2hhdCBtZXNzYWdlcy5cclxuICpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE1lc3NhZ2VzKCkge1xyXG4gICAgcmV0dXJuIHdvcmxkU3RhcnRlZCgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5wb3N0SlNPTihgL2FwaWAsIHsgY29tbWFuZDogJ2dldGNoYXQnLCB3b3JsZElkLCBmaXJzdElkOiBjYWNoZS5maXJzdElkIH0pKVxyXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT0gJ29rJyAmJiBkYXRhLm5leHRJZCAhPSBjYWNoZS5maXJzdElkKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5maXJzdElkID0gZGF0YS5uZXh0SWQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5sb2c7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5zdGF0dXMgPT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHdobyBzZW50IGEgbWVzc2FnZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIG5hbWUgPSBnZXRVc2VybmFtZSgnU0VSVkVSOiBIaSB0aGVyZSEnKTtcclxuICogLy9uYW1lID09ICdTRVJWRVInXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIHBhcnNlLlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBuYW1lIG9mIHRoZSB1c2VyIHdobyBzZW50IHRoZSBtZXNzYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0VXNlcm5hbWUobWVzc2FnZSkge1xyXG4gICAgZm9yIChsZXQgaSA9IDE4OyBpID4gNDsgaS0tKSB7XHJcbiAgICAgICAgbGV0IHBvc3NpYmxlTmFtZSA9IG1lc3NhZ2Uuc3Vic3RyaW5nKDAsIG1lc3NhZ2UubGFzdEluZGV4T2YoJzogJywgaSkpO1xyXG4gICAgICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMocG9zc2libGVOYW1lKSB8fCBwb3NzaWJsZU5hbWUgPT0gJ1NFUlZFUicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBvc3NpYmxlTmFtZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBTaG91bGQgaWRlYWxseSBuZXZlciBoYXBwZW4uXHJcbiAgICByZXR1cm4gbWVzc2FnZS5zdWJzdHJpbmcoMCwgbWVzc2FnZS5sYXN0SW5kZXhPZignOiAnLCAxOCkpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgam9pbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgam9pbmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IGlwIHRoZSBpcCBvZiB0aGUgcGxheWVyIGpvaW5pbmcuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVKb2luTWVzc2FnZXMobmFtZSwgaXApIHtcclxuICAgIGlmICghd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQuam9pbicsIG5hbWUsIGlwKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgZGlzY29ubmVjdGlvbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgbGVhdmluZy5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSkge1xyXG4gICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5zcGxpY2Uod29ybGQub25saW5lLmluZGV4T2YobmFtZSksIDEpO1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLmxlYXZlJywgbmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHVzZXIgY2hhdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdXNlci5cclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2Ugc2VudC5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICBpZiAobmFtZSA9PSAnU0VSVkVSJykge1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLnNlcnZlcmNoYXQnLCBtZXNzYWdlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQubWVzc2FnZScsIG5hbWUsIG1lc3NhZ2UpO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSAmJiAhbWVzc2FnZS5zdGFydHNXaXRoKCcvICcpKSB7XHJcblxyXG4gICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgIGxldCBhcmdzID0gJyc7XHJcbiAgICAgICAgaWYgKGNvbW1hbmQuaW5jbHVkZXMoJyAnKSkge1xyXG4gICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICBhcmdzID0gbWVzc2FnZS5zdWJzdHJpbmcobWVzc2FnZS5pbmRleE9mKCcgJykgKyAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsIG5hbWUsIGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgICAgIHJldHVybjsgLy9ub3QgY2hhdFxyXG4gICAgfVxyXG5cclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLmNoYXQnLCBuYW1lLCBtZXNzYWdlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIGhhbmRsZSBtZXNzYWdlcyB3aGljaCBhcmUgbm90IHNpbXBseSBwYXJzZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIGhhbmRsZVxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlT3RoZXJNZXNzYWdlcyhtZXNzYWdlKSB7XHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5vdGhlcicsIG1lc3NhZ2UpO1xyXG59XHJcbiIsInZhciBsaXN0ZW5lcnMgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGJlZ2luIGxpc3RlbmluZyB0byBhbiBldmVudC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogbGlzdGVuKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogLy9hbHRlcm5hdGl2ZWx5XHJcbiAqIG9uKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0aGUgZXZlbnQgaGFuZGxlclxyXG4gKi9cclxuZnVuY3Rpb24gbGlzdGVuKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIGxpc3RlbmVyc1trZXldID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XS5pbmNsdWRlcyhjYWxsYmFjaykpIHtcclxuICAgICAgICBsaXN0ZW5lcnNba2V5XS5wdXNoKGNhbGxiYWNrKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHN0b3AgbGlzdGVuaW5nIHRvIGFuIGV2ZW50LiBJZiB0aGUgbGlzdGVuZXIgd2FzIG5vdCBmb3VuZCwgbm8gYWN0aW9uIHdpbGwgYmUgdGFrZW4uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vRWFybGllciBhdHRhY2hlZCBteUZ1bmMgdG8gJ2V2ZW50J1xyXG4gKiByZW1vdmUoJ2V2ZW50JywgbXlGdW5jKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gc3RvcCBsaXN0ZW5pbmcgdG8uXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRoZSBjYWxsYmFjayB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQgbGlzdGVuZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKGxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgaWYgKGxpc3RlbmVyc1trZXldLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICBsaXN0ZW5lcnNba2V5XS5zcGxpY2UobGlzdGVuZXJzW2tleV0uaW5kZXhPZihjYWxsYmFjayksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNhbGwgZXZlbnRzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBjaGVjaygndGVzdCcsIDEsIDIsIDMpO1xyXG4gKiBjaGVjaygndGVzdCcsIHRydWUpO1xyXG4gKiAvLyBhbHRlcm5hdGl2ZWx5XHJcbiAqIGZpcmUoJ3Rlc3QnLCAxLCAyLCAzKTtcclxuICogZmlyZSgndGVzdCcsIHRydWUpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBjYWxsLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhcmd1bWVudHMgdG8gcGFzcyB0byBsaXN0ZW5pbmcgZnVuY3Rpb25zLlxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2soa2V5LCAuLi5hcmdzKSB7XHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGlzdGVuZXJzW2tleV0uZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lcikge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVyKC4uLmFyZ3MpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgdmFsdWUgYmFzZWQgb24gaW5wdXQgZnJvbSBsaXN0ZW5lcnMuXHJcbiAqXHJcbiAqIEBkZXByaWNhdGVkIHNpbmNlIDYuMS4wLiBJbnN0ZWFkLCB1cGRhdGUgcmVxdWVzdHMgc2hvdWxkIGJlIGhhbmRsZWQgYnkgdGhlIGV4dGVuc2lvbiBpdGVzZWxmLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1cGRhdGUoJ2V2ZW50JywgdHJ1ZSwgMSwgMiwgMyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGNhbGxcclxuICogQHBhcmFtIHttaXhlZH0gaW5pdGlhbCB0aGUgaW5pdGlhbCB2YWx1ZSB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIHVwZGF0ZShrZXksIGluaXRpYWwsIC4uLmFyZ3MpIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIHJldHVybiBpbml0aWFsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsaXN0ZW5lcnNba2V5XS5yZWR1Y2UoZnVuY3Rpb24ocHJldmlvdXMsIGN1cnJlbnQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gY3VycmVudChwcmV2aW91cywgLi4uYXJncyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91cztcclxuICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcHJldmlvdXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgaW5pdGlhbCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbGlzdGVuLFxyXG4gICAgb246IGxpc3RlbixcclxuICAgIHJlbW92ZSxcclxuICAgIGNoZWNrLFxyXG4gICAgZmlyZTogY2hlY2ssXHJcbiAgICB1cGRhdGUsXHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZ2V0U3RyaW5nLFxyXG4gICAgZ2V0T2JqZWN0LFxyXG4gICAgc2V0LFxyXG4gICAgY2xlYXJOYW1lc3BhY2UsXHJcbn07XHJcblxyXG4vL1JFVklFVzogSXMgdGhlcmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/IHJlcXVpcmUoJy4vY29uZmlnJykgbWF5YmU/XHJcbmNvbnN0IE5BTUVTUEFDRSA9IHdpbmRvdy53b3JsZElkO1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdHJpbmcgZnJvbSB0aGUgc3RvcmFnZSBpZiBpdCBleGlzdHMgYW5kIHJldHVybnMgaXQsIG90aGVyd2lzZSByZXR1cm5zIGZhbGxiYWNrLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgeCA9IGdldFN0cmluZygnc3RvcmVkX3ByZWZzJywgJ25vdGhpbmcnKTtcclxuICogdmFyIHkgPSBnZXRTdHJpbmcoJ3N0b3JlZF9wcmVmcycsICdub3RoaW5nJywgZmFsc2UpO1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBrZXkgdG8gcmV0cmlldmUuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGZhbGxiYWNrIHdoYXQgdG8gcmV0dXJuIGlmIHRoZSBrZXkgd2FzIG5vdCBmb3VuZC5cclxuICogQHBhcmFtIHtib29sfSBbbG9jYWw9dHJ1ZV0gd2hldGhlciBvciBub3QgdG8gdXNlIGEgbmFtZXNwYWNlIHdoZW4gY2hlY2tpbmcgZm9yIHRoZSBrZXkuXHJcbiAqIEByZXR1cm4ge21peGVkfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0U3RyaW5nKGtleSwgZmFsbGJhY2ssIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmIChsb2NhbCkge1xyXG4gICAgICAgIHJlc3VsdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGAke2tleX0ke05BTUVTUEFDRX1gKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKHJlc3VsdCA9PT0gbnVsbCkgPyBmYWxsYmFjayA6IHJlc3VsdDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdG9yZWQgb2JqZWN0IGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIHJldHVybnMgZmFsbGJhY2suXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB4ID0gZ2V0T2JqZWN0KCdzdG9yZWRfa2V5JywgWzEsIDIsIDNdKTtcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgaXRlbSB0byByZXRyaWV2ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZmFsbGJhY2sgd2hhdCB0byByZXR1cm4gaWYgdGhlIGl0ZW0gZG9lcyBub3QgZXhpc3Qgb3IgZmFpbHMgdG8gcGFyc2UgY29ycmVjdGx5LlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIG9yIG5vdCBhIG5hbWVzcGFjZSBzaG91bGQgYmUgdXNlZC5cclxuICogQHJldHVybiB7bWl4ZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPYmplY3Qoa2V5LCBmYWxsYmFjaywgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gZ2V0U3RyaW5nKGtleSwgZmFsc2UsIGxvY2FsKTtcclxuXHJcbiAgICBpZiAoIXJlc3VsdCkge1xyXG4gICAgICAgIHJldHVybiBmYWxsYmFjaztcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UocmVzdWx0KTtcclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogU2V0cyBhbiBvYmplY3QgaW4gdGhlIHN0b3JhZ2UsIHN0cmluZ2lmeWluZyBpdCBmaXJzdCBpZiBuZWNjZXNzYXJ5LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ3NvbWVfa2V5Jywge2E6IFsxLCAyLCAzXSwgYjogJ3Rlc3QnfSk7XHJcbiAqIC8vcmV0dXJucyAne1wiYVwiOlsxLDIsM10sXCJiXCI6XCJ0ZXN0XCJ9J1xyXG4gKiBnZXRTdHJpbmcoJ3NvbWVfa2V5Jyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGl0ZW0gdG8gb3ZlcndyaXRlIG9yIGNyZWF0ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZGF0YSBhbnkgc3RyaW5naWZ5YWJsZSB0eXBlLlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIHRvIHNhdmUgdGhlIGl0ZW0gd2l0aCBhIG5hbWVzcGFjZS5cclxuICovXHJcbmZ1bmN0aW9uIHNldChrZXksIGRhdGEsIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgaWYgKGxvY2FsKSB7XHJcbiAgICAgICAga2V5ID0gYCR7a2V5fSR7TkFNRVNQQUNFfWA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBkYXRhID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBkYXRhKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCBpdGVtcyBzdGFydGluZyB3aXRoIG5hbWVzcGFjZSBmcm9tIHRoZSBzdG9yYWdlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ2tleV90ZXN0JywgMSk7XHJcbiAqIHNldCgna2V5X3Rlc3QyJywgMik7XHJcbiAqIGNsZWFyTmFtZXNwYWNlKCdrZXlfJyk7IC8vYm90aCBrZXlfdGVzdCBhbmQga2V5X3Rlc3QyIGhhdmUgYmVlbiByZW1vdmVkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZXNwYWNlIHRoZSBwcmVmaXggdG8gY2hlY2sgZm9yIHdoZW4gcmVtb3ZpbmcgaXRlbXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBjbGVhck5hbWVzcGFjZShuYW1lc3BhY2UpIHtcclxuICAgIE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aChuYW1lc3BhY2UpKSB7XHJcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3QgYXBpID0gcmVxdWlyZSgnLi9ibG9ja2hlYWRzJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJy4vaG9vaycpO1xyXG5cclxuY29uc3QgU1RPUkFHRSA9IHtcclxuICAgIFBMQVlFUlM6ICdtYl9wbGF5ZXJzJyxcclxuICAgIExPR19MT0FEOiAnbWJfbGFzdExvZ0xvYWQnLFxyXG59O1xyXG5cclxudmFyIHdvcmxkID0gbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW10sXHJcbiAgICBvd25lcjogJycsXHJcbiAgICBwbGF5ZXJzOiBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFLlBMQVlFUlMsIHt9KSxcclxuICAgIGxpc3RzOiB7YWRtaW46IFtdLCBtb2Q6IFtdLCBzdGFmZjogW10sIGJsYWNrOiBbXSwgd2hpdGU6IFtdfSxcclxuICAgIGlzUGxheWVyLFxyXG4gICAgaXNTZXJ2ZXIsXHJcbiAgICBpc093bmVyLFxyXG4gICAgaXNBZG1pbixcclxuICAgIGlzU3RhZmYsXHJcbiAgICBpc01vZCxcclxuICAgIGlzT25saW5lLFxyXG4gICAgZ2V0Sm9pbnMsXHJcbn07XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGEgcGxheWVyIGhhcyBqb2luZWQgdGhlIHNlcnZlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzUGxheWVyKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5wbGF5ZXJzLmhhc093blByb3BlcnR5KG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyB0aGUgc2VydmVyXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1NlcnZlcihuYW1lKSB7XHJcbiAgICByZXR1cm4gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpID09ICdTRVJWRVInO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgdGhlIG93bmVyIG9yIHNlcnZlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzT3duZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLm93bmVyID09IG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSB8fCBpc1NlcnZlcihuYW1lKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIGFuIGFkbWluXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc0FkbWluKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5saXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpIHx8IGlzT3duZXIobmFtZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyBhIG1vZFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNNb2QobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLmxpc3RzLm1vZC5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgYSBzdGFmZiBtZW1iZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1N0YWZmKG5hbWUpIHtcclxuICAgIHJldHVybiBpc0FkbWluKG5hbWUpIHx8IGlzTW9kKG5hbWUpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGEgcGxheWVyIGlzIG9ubGluZVxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNPbmxpbmUobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbnVtYmVyIG9mIHRpbWVzIHRoZSBwbGF5ZXIgaGFzIGpvaW5lZCB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRKb2lucyhuYW1lKSB7XHJcbiAgICByZXR1cm4gaXNQbGF5ZXIobmFtZSkgPyB3b3JsZC5wbGF5ZXJzW25hbWUudG9Mb2NhbGVVcHBlckNhc2UoKV0uam9pbnMgOiAwO1xyXG59XHJcblxyXG4vLyBLZWVwIHRoZSBvbmxpbmUgbGlzdCB1cCB0byBkYXRlXHJcbmhvb2sub24oJ3dvcmxkLmpvaW4nLCBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBpZiAoIXdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG59KTtcclxuaG9vay5vbignd29ybGQubGVhdmUnLCBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBpZiAod29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnNwbGljZSh3b3JsZC5vbmxpbmUuaW5kZXhPZihuYW1lKSwgMSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gS2VlcCBwbGF5ZXJzIGxpc3QgdXAgdG8gZGF0ZVxyXG5ob29rLm9uKCd3b3JsZC5qb2luJywgY2hlY2tQbGF5ZXJKb2luKTtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbi5cclxuICogUmVtb3ZlcyBhZG1pbnMgZnJvbSB0aGUgbW9kIGxpc3QgYW5kIGNyZWF0ZXMgdGhlIHN0YWZmIGxpc3QuXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZFN0YWZmTGlzdCgpIHtcclxuICAgIHdvcmxkLmxpc3RzLm1vZCA9IHdvcmxkLmxpc3RzLm1vZC5maWx0ZXIobmFtZSA9PiAhaXNBZG1pbihuYW1lKSk7XHJcbiAgICB3b3JsZC5saXN0cy5zdGFmZiA9IHdvcmxkLmxpc3RzLmFkbWluLmNvbmNhdCh3b3JsZC5saXN0cy5tb2QpO1xyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24uXHJcbiAqIENoZWNrcyBpZiBhIHBsYXllciBoYXMgcGVybWlzc2lvbiB0byBwZXJmb3JtIGEgY29tbWFuZFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gY29tbWFuZFxyXG4gKi9cclxuZnVuY3Rpb24gcGVybWlzc2lvbkNoZWNrKG5hbWUsIGNvbW1hbmQpIHtcclxuICAgIGNvbW1hbmQgPSBjb21tYW5kLnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgaWYgKFsnYWRtaW4nLCAndW5hZG1pbicsICdtb2QnLCAndW5tb2QnXS5pbmNsdWRlcyhjb21tYW5kKSkge1xyXG4gICAgICAgIHJldHVybiBpc0FkbWluKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChbJ3doaXRlbGlzdCcsICd1bndoaXRlbGlzdCcsICdiYW4nLCAndW5iYW4nXS5pbmNsdWRlcyhjb21tYW5kKSkge1xyXG4gICAgICAgIHJldHVybiBpc1N0YWZmKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuLy8gS2VlcCBsaXN0cyB1cCB0byBkYXRlXHJcbmhvb2sub24oJ3dvcmxkLmNvbW1hbmQnLCBmdW5jdGlvbihuYW1lLCBjb21tYW5kLCB0YXJnZXQpIHtcclxuICAgIGlmICghcGVybWlzc2lvbkNoZWNrKG5hbWUsIGNvbW1hbmQpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB1biA9IGNvbW1hbmQuc3RhcnRzV2l0aCgndW4nKTtcclxuXHJcbiAgICB2YXIgZ3JvdXAgPSB7XHJcbiAgICAgICAgYWRtaW46ICdhZG1pbicsXHJcbiAgICAgICAgbW9kOiAnbW9kJyxcclxuICAgICAgICB3aGl0ZWxpc3Q6ICd3aGl0ZScsXHJcbiAgICAgICAgYmFuOiAnYmxhY2snLFxyXG4gICAgfVt1biA/IGNvbW1hbmQuc3Vic3RyKDIpIDogY29tbWFuZF07XHJcblxyXG4gICAgaWYgKHVuICYmIHdvcmxkLmxpc3RzW2dyb3VwXS5pbmNsdWRlcyh0YXJnZXQpKSB7XHJcbiAgICAgICAgd29ybGQubGlzdHNbZ3JvdXBdLnNwbGljZSh3b3JsZC5saXN0c1tncm91cF0uaW5kZXhPZih0YXJnZXQpLCAxKTtcclxuICAgICAgICBidWlsZFN0YWZmTGlzdCgpO1xyXG4gICAgfSBlbHNlIGlmICghdW4gJiYgIXdvcmxkLmxpc3RzW2dyb3VwXS5pbmNsdWRlcyh0YXJnZXQpKSB7XHJcbiAgICAgICAgd29ybGQubGlzdHNbZ3JvdXBdLnB1c2godGFyZ2V0KTtcclxuICAgICAgICBidWlsZFN0YWZmTGlzdCgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbi4gSW5jcmVtZW50cyBhIHBsYXllcidzIGpvaW5zLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaXBcclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrUGxheWVySm9pbihuYW1lLCBpcCkge1xyXG4gICAgaWYgKHdvcmxkLnBsYXllcnMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcclxuICAgICAgICAvL1JldHVybmluZyBwbGF5ZXJcclxuICAgICAgICB3b3JsZC5wbGF5ZXJzW25hbWVdLmpvaW5zKys7XHJcbiAgICAgICAgaWYgKCF3b3JsZC5wbGF5ZXJzW25hbWVdLmlwcy5pbmNsdWRlcyhpcCkpIHtcclxuICAgICAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXS5pcHMucHVzaChpcCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvL05ldyBwbGF5ZXJcclxuICAgICAgICB3b3JsZC5wbGF5ZXJzW25hbWVdID0ge2pvaW5zOiAxLCBpcHM6IFtpcF19O1xyXG4gICAgfVxyXG4gICAgd29ybGQucGxheWVyc1tuYW1lXS5pcCA9IGlwO1xyXG5cclxuICAgIC8vIE90aGVyd2lzZSwgd2Ugd2lsbCBkb3VibGUgcGFyc2Ugam9pbnNcclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0UuTE9HX0xPQUQsIE1hdGguZmxvb3IoRGF0ZS5ub3coKS52YWx1ZU9mKCkpKTtcclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0UuUExBWUVSUywgd29ybGQucGxheWVycyk7XHJcbn1cclxuXHJcblxyXG4vLyBVcGRhdGUgbGlzdHNcclxuUHJvbWlzZS5hbGwoW2FwaS5nZXRMaXN0cygpLCBhcGkuZ2V0V29ybGROYW1lKCksIGFwaS5nZXRPd25lck5hbWUoKV0pXHJcbiAgICAudGhlbigodmFsdWVzKSA9PiB7XHJcbiAgICAgICAgdmFyIFthcGlMaXN0cywgd29ybGROYW1lLCBvd25lcl0gPSB2YWx1ZXM7XHJcblxyXG4gICAgICAgIHdvcmxkLmxpc3RzID0gYXBpTGlzdHM7XHJcbiAgICAgICAgYnVpbGRTdGFmZkxpc3QoKTtcclxuICAgICAgICB3b3JsZC5uYW1lID0gd29ybGROYW1lO1xyXG4gICAgICAgIHdvcmxkLm93bmVyID0gb3duZXI7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG5cclxuLy8gVXBkYXRlIHBsYXllcnMgc2luY2UgbGFzdCBib3QgbG9hZFxyXG5Qcm9taXNlLmFsbChbYXBpLmdldExvZ3MoKSwgYXBpLmdldFdvcmxkTmFtZSgpXSlcclxuICAgIC50aGVuKCh2YWx1ZXMpID0+IHtcclxuICAgICAgICB2YXIgW2xpbmVzLCB3b3JsZE5hbWVdID0gdmFsdWVzO1xyXG5cclxuICAgICAgICB2YXIgbGFzdCA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0UuTE9HX0xPQUQsIDApO1xyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0UuTE9HX0xPQUQsIE1hdGguZmxvb3IoRGF0ZS5ub3coKS52YWx1ZU9mKCkpKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbGluZSBvZiBsaW5lcykge1xyXG4gICAgICAgICAgICBsZXQgdGltZSA9IG5ldyBEYXRlKGxpbmUuc3Vic3RyaW5nKDAsIGxpbmUuaW5kZXhPZignYicpKS5yZXBsYWNlKCcgJywgJ1QnKS5yZXBsYWNlKCcgJywgJ1onKSk7XHJcbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gbGluZS5zdWJzdHJpbmcobGluZS5pbmRleE9mKCddJykgKyAyKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aW1lIDwgbGFzdCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoYCR7d29ybGROYW1lfSAtIFBsYXllciBDb25uZWN0ZWQgYCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBwYXJ0cyA9IGxpbmUuc3Vic3RyKGxpbmUuaW5kZXhPZignIC0gUGxheWVyIENvbm5lY3RlZCAnKSArIDIwKTsgLy9OQU1FIHwgSVAgfCBJRFxyXG4gICAgICAgICAgICAgICAgbGV0IFssIG5hbWUsIGlwXSA9IHBhcnRzLm1hdGNoKC8oLiopIFxcfCAoW1xcdy5dKykgXFx8IC57MzJ9XFxzKi8pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNoZWNrUGxheWVySm9pbihuYW1lLCBpcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0UuUExBWUVSUywgd29ybGQucGxheWVycyk7XHJcbiAgICB9KTtcclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3Qgc2VuZCA9IHJlcXVpcmUoJ2JvdCcpLnNlbmQ7XHJcbmNvbnN0IHByZWZlcmVuY2VzID0gcmVxdWlyZSgnc2V0dGluZ3MvYm90Jyk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignQW5ub3VuY2VtZW50cycsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8dGVtcGxhdGUgaWQ9XFxcImFUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNvbHVtbiBpcy1mdWxsXFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPlNlbmQ6PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICA8dGV4dGFyZWEgY2xhc3M9XFxcIm1cXFwiPjwvdGV4dGFyZWE+XFxyXFxuICAgICAgICAgICAgPGE+RGVsZXRlPC9hPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgICAgICA8ZGl2PlxcclxcbiAgICAgICAgICAgIFdhaXQgWCBtaW51dGVzLi4uXFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9hbm5vdW5jZW1lbnRzXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgICAgIDxoMz5UaGVzZSBhcmUgc2VudCBhY2NvcmRpbmcgdG8gYSByZWd1bGFyIHNjaGVkdWxlLjwvaDM+XFxyXFxuICAgICAgICA8c3Bhbj5JZiB5b3UgaGF2ZSBvbmUgYW5ub3VuY2VtZW50LCBpdCBpcyBzZW50IGV2ZXJ5IFggbWludXRlcywgaWYgeW91IGhhdmUgdHdvLCB0aGVuIHRoZSBmaXJzdCBpcyBzZW50IGF0IFggbWludXRlcywgYW5kIHRoZSBzZWNvbmQgaXMgc2VudCBYIG1pbnV0ZXMgYWZ0ZXIgdGhlIGZpcnN0LiBDaGFuZ2UgWCBpbiB0aGUgc2V0dGluZ3MgdGFiLiBPbmNlIHRoZSBib3QgcmVhY2hlcyB0aGUgZW5kIG9mIHRoZSBsaXN0LCBpdCBzdGFydHMgb3ZlciBhdCB0aGUgdG9wLjwvc3Bhbj5cXHJcXG4gICAgPC9zZWN0aW9uPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJhTXNnc1xcXCIgY2xhc3M9XFxcImNvbHVtbnMgaXMtbXVsdGlsaW5lXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbiAgICBzdGFydDogKCkgPT4gYW5ub3VuY2VtZW50Q2hlY2soMCksXHJcbn07XHJcblxyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKHRleHQgPSAnJykge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjYVRlbXBsYXRlJywgJyNhTXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IHRleHR9XHJcbiAgICBdKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIGFubm91bmNlbWVudHMgPSBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcubScpKVxyXG4gICAgICAgIC5tYXAoZWwgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4ge21lc3NhZ2U6IGVsLnZhbHVlfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldCgnYW5ub3VuY2VtZW50QXJyJywgYW5ub3VuY2VtZW50cyk7XHJcbn1cclxuXHJcbi8vIEFubm91bmNlbWVudHMgY29sbGVjdGlvblxyXG52YXIgYW5ub3VuY2VtZW50cyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KCdhbm5vdW5jZW1lbnRBcnInLCBbXSk7XHJcblxyXG4vLyBTaG93IHNhdmVkIGFubm91bmNlbWVudHNcclxuYW5ub3VuY2VtZW50c1xyXG4gICAgLm1hcChhbm4gPT4gYW5uLm1lc3NhZ2UpXHJcbiAgICAuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcblxyXG4vLyBTZW5kcyBhbm5vdW5jZW1lbnRzIGFmdGVyIHRoZSBzcGVjaWZpZWQgZGVsYXkuXHJcbmZ1bmN0aW9uIGFubm91bmNlbWVudENoZWNrKGkpIHtcclxuICAgIGkgPSAoaSA+PSBhbm5vdW5jZW1lbnRzLmxlbmd0aCkgPyAwIDogaTtcclxuXHJcbiAgICB2YXIgYW5uID0gYW5ub3VuY2VtZW50c1tpXTtcclxuXHJcbiAgICBpZiAoYW5uICYmIGFubi5tZXNzYWdlKSB7XHJcbiAgICAgICAgc2VuZChhbm4ubWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgICBzZXRUaW1lb3V0KGFubm91bmNlbWVudENoZWNrLCBwcmVmZXJlbmNlcy5hbm5vdW5jZW1lbnREZWxheSAqIDYwMDAwLCBpICsgMSk7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBidWlsZEFuZFNlbmRNZXNzYWdlLFxyXG4gICAgYnVpbGRNZXNzYWdlLFxyXG59O1xyXG5cclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuY29uc3Qgc2VuZCA9IHJlcXVpcmUoJ2JvdCcpLnNlbmQ7XHJcblxyXG5mdW5jdGlvbiBidWlsZEFuZFNlbmRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpIHtcclxuICAgIHNlbmQoYnVpbGRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpIHtcclxuICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7KFtefV0rKX19L2csIGZ1bmN0aW9uKGZ1bGwsIGtleSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIE5BTUU6IG5hbWUsXHJcbiAgICAgICAgICAgIE5hbWU6IG5hbWVbMF0gKyBuYW1lLnN1YnN0cmluZygxKS50b0xvY2FsZUxvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICBuYW1lOiBuYW1lLnRvTG9jYWxlTG93ZXJDYXNlKClcclxuICAgICAgICB9W2tleV0gfHwgZnVsbDtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7aXB9fS9naSwgd29ybGQucGxheWVycy5nZXRJUChuYW1lKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1lc3NhZ2U7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjaGVja0pvaW5zQW5kR3JvdXAsXHJcbiAgICBjaGVja0pvaW5zLFxyXG4gICAgY2hlY2tHcm91cCxcclxufTtcclxuXHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykge1xyXG4gICAgcmV0dXJuIGNoZWNrSm9pbnMobmFtZSwgbXNnLmpvaW5zX2xvdywgbXNnLmpvaW5zX2hpZ2gpICYmIGNoZWNrR3JvdXAobmFtZSwgbXNnLmdyb3VwLCBtc2cubm90X2dyb3VwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2lucyhuYW1lLCBsb3csIGhpZ2gpIHtcclxuICAgIHJldHVybiB3b3JsZC5nZXRKb2lucyhuYW1lKSA+PSBsb3cgJiYgd29ybGQuZ2V0Sm9pbnMobmFtZSkgPD0gaGlnaDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tHcm91cChuYW1lLCBncm91cCwgbm90X2dyb3VwKSB7XHJcbiAgICByZXR1cm4gaXNJbkdyb3VwKG5hbWUsIGdyb3VwKSAmJiAhaXNJbkdyb3VwKG5hbWUsIG5vdF9ncm91cCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzSW5Hcm91cChuYW1lLCBncm91cCkge1xyXG4gICAgbmFtZSA9IG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIHN3aXRjaCAoZ3JvdXAudG9Mb2NhbGVMb3dlckNhc2UoKSkge1xyXG4gICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1BsYXllcihuYW1lKTtcclxuICAgICAgICBjYXNlICdhZG1pbic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc0FkbWluKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ21vZCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc01vZChuYW1lKTtcclxuICAgICAgICBjYXNlICdzdGFmZic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1N0YWZmKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ293bmVyJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzT3duZXIobmFtZSk7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcbiIsIk9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vYnVpbGRNZXNzYWdlJyksXHJcbiAgICByZXF1aXJlKCcuL2NoZWNrSm9pbnNBbmRHcm91cCcpLFxyXG4gICAgcmVxdWlyZSgnLi9zaG93U3VtbWFyeScpXHJcbik7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2hvd1N1bW1hcnlcclxufTtcclxuXHJcbi8qKlxyXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gY3JlYXRlIGFuZCBkaXNwbGF5IGEgc3VtbWFyeSBvZiB0aGUgb3B0aW9ucyBjaGFuZ2VkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge05vZGV9IGNvbnRhaW5lciB0aGUgbWVzc2FnZSBjb250YWluZXIgd2hpY2ggbmVlZHMgYW4gdXBkYXRlZCBzdW1tYXJ5LlxyXG4gKi9cclxuZnVuY3Rpb24gc2hvd1N1bW1hcnkoY29udGFpbmVyKSB7XHJcbiAgICB2YXIgb3V0ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5zdW1tYXJ5Jyk7XHJcblxyXG4gICAgaWYgKCFvdXQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGdyb3VwID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImdyb3VwXCJdJykudmFsdWU7XHJcbiAgICB2YXIgbm90X2dyb3VwID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXScpLnZhbHVlO1xyXG4gICAgdmFyIGpvaW5zX2xvdyA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZTtcclxuICAgIHZhciBqb2luc19oaWdoID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nKS52YWx1ZTtcclxuXHJcbiAgICB2YXIgZ3JvdXBzQWx0ZXJlZCA9IGdyb3VwICE9ICdhbGwnIHx8IG5vdF9ncm91cCAhPSAnbm9ib2R5JztcclxuICAgIHZhciBqb2luc0FsdGVyZWQgPSBqb2luc19sb3cgIT0gXCIwXCIgfHwgam9pbnNfaGlnaCAhPSBcIjk5OTlcIjtcclxuXHJcbiAgICBpZiAoZ3JvdXBzQWx0ZXJlZCAmJiBqb2luc0FsdGVyZWQpIHtcclxuICAgICAgICBvdXQudGV4dENvbnRlbnQgPSBgJHtncm91cH0gLyBub3QgJHtub3RfZ3JvdXB9IGFuZCAke2pvaW5zX2xvd30g4omkIGpvaW5zIOKJpCAke2pvaW5zX2hpZ2h9YDtcclxuICAgIH0gZWxzZSBpZiAoZ3JvdXBzQWx0ZXJlZCkge1xyXG4gICAgICAgIG91dC50ZXh0Q29udGVudCA9IGAke2dyb3VwfSAvIG5vdCAke25vdF9ncm91cH1gO1xyXG4gICAgfSBlbHNlIGlmIChqb2luc0FsdGVyZWQpIHtcclxuICAgICAgICBvdXQudGV4dENvbnRlbnQgPSBgJHtqb2luc19sb3d9IOKJpCBqb2lucyDiiaQgJHtqb2luc19oaWdofWA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG91dC50ZXh0Q29udGVudCA9ICcnO1xyXG4gICAgfVxyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcclxuXHJcbnZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbmVsLmlubmVySFRNTCA9IFwiI21iX2pvaW4+aDMsI21iX2xlYXZlPmgzLCNtYl90cmlnZ2VyPmgzLCNtYl9hbm5vdW5jZW1lbnRzPmgze21hcmdpbjowIDAgNXB4IDZlbX0jbWJfam9pbj5zcGFuLCNtYl9sZWF2ZT5zcGFuLCNtYl90cmlnZ2VyPnNwYW4sI21iX2Fubm91bmNlbWVudHM+c3BhbnttYXJnaW4tbGVmdDo2ZW19I21iX2pvaW4gaW5wdXQsI21iX2pvaW4gdGV4dGFyZWEsI21iX2xlYXZlIGlucHV0LCNtYl9sZWF2ZSB0ZXh0YXJlYSwjbWJfdHJpZ2dlciBpbnB1dCwjbWJfdHJpZ2dlciB0ZXh0YXJlYSwjbWJfYW5ub3VuY2VtZW50cyBpbnB1dCwjbWJfYW5ub3VuY2VtZW50cyB0ZXh0YXJlYXtib3JkZXI6MnB4IHNvbGlkICM2NjY7d2lkdGg6MTAwJX0jbWJfam9pbiB0ZXh0YXJlYSwjbWJfbGVhdmUgdGV4dGFyZWEsI21iX3RyaWdnZXIgdGV4dGFyZWEsI21iX2Fubm91bmNlbWVudHMgdGV4dGFyZWF7cmVzaXplOm5vbmU7b3ZlcmZsb3c6aGlkZGVuO3BhZGRpbmc6MXB4IDA7aGVpZ2h0OjIxcHg7dHJhbnNpdGlvbjpoZWlnaHQgMC4yNXN9I21iX2pvaW4gdGV4dGFyZWE6Zm9jdXMsI21iX2xlYXZlIHRleHRhcmVhOmZvY3VzLCNtYl90cmlnZ2VyIHRleHRhcmVhOmZvY3VzLCNtYl9hbm5vdW5jZW1lbnRzIHRleHRhcmVhOmZvY3Vze2hlaWdodDo1ZW19I21iX2pvaW4gaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl0sI21iX2xlYXZlIGlucHV0W3R5cGU9XFxcIm51bWJlclxcXCJdLCNtYl90cmlnZ2VyIGlucHV0W3R5cGU9XFxcIm51bWJlclxcXCJdLCNtYl9hbm5vdW5jZW1lbnRzIGlucHV0W3R5cGU9XFxcIm51bWJlclxcXCJde3dpZHRoOjVlbX0jak1zZ3MsI2xNc2dzLCN0TXNncywjYU1zZ3N7Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMH0jak1zZ3Mgc21hbGwsI2xNc2dzIHNtYWxsLCN0TXNncyBzbWFsbCwjYU1zZ3Mgc21hbGx7Y29sb3I6Izc3N31cXG5cIjtcclxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG51aS5hZGRUYWJHcm91cCgnTWVzc2FnZXMnLCAnbWVzc2FnZXMnKTtcclxuXHJcbltcclxuICAgIHJlcXVpcmUoJy4vam9pbicpLFxyXG4gICAgcmVxdWlyZSgnLi9sZWF2ZScpLFxyXG4gICAgcmVxdWlyZSgnLi90cmlnZ2VyJyksXHJcbiAgICByZXF1aXJlKCcuL2Fubm91bmNlbWVudHMnKVxyXG5dLmZvckVhY2goKHt0YWIsIHNhdmUsIGFkZE1lc3NhZ2UsIHN0YXJ0fSkgPT4ge1xyXG4gICAgdGFiLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gY2hlY2tEZWxldGUoZXZlbnQpIHtcclxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LnRhZ05hbWUgIT0gJ0EnKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVpLmFsZXJ0KCdSZWFsbHkgZGVsZXRlIHRoaXMgbWVzc2FnZT8nLCBbXHJcbiAgICAgICAgICAgIHt0ZXh0OiAnWWVzJywgc3R5bGU6ICdpcy1kYW5nZXInLCBhY3Rpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsID0gZXZlbnQudGFyZ2V0O1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKChlbCA9IGVsLnBhcmVudEVsZW1lbnQpICYmICFlbC5jbGFzc0xpc3QuY29udGFpbnMoJ2NvbHVtbicpKVxyXG4gICAgICAgICAgICAgICAgICAgIDtcclxuICAgICAgICAgICAgICAgIGVsLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2F2ZSgpO1xyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAge3RleHQ6ICdDYW5jZWwnfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGFiLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHNhdmUpO1xyXG5cclxuICAgIHRhYi5xdWVyeVNlbGVjdG9yKCcuYnV0dG9uLmlzLXByaW1hcnknKVxyXG4gICAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IGFkZE1lc3NhZ2UoKSk7XHJcblxyXG4gICAgLy8gRG9uJ3Qgc3RhcnQgcmVzcG9uZGluZyB0byBjaGF0IGZvciAxMCBzZWNvbmRzXHJcbiAgICBzZXRUaW1lb3V0KHN0YXJ0LCAxMDAwMCk7XHJcbn0pO1xyXG5cclxuW1xyXG4gICAgcmVxdWlyZSgnLi9qb2luJyksXHJcbiAgICByZXF1aXJlKCcuL2xlYXZlJyksXHJcbiAgICByZXF1aXJlKCcuL3RyaWdnZXInKVxyXG5dLmZvckVhY2goKHt0YWJ9KSA9PiB7XHJcbiAgICB0YWIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICB2YXIgZWwgPSBldmVudC50YXJnZXQ7XHJcbiAgICAgICAgd2hpbGUgKChlbCA9IGVsLnBhcmVudEVsZW1lbnQpICYmICFlbC5jbGFzc0xpc3QuY29udGFpbnMoJ2NvbHVtbicpKVxyXG4gICAgICAgICAgICA7XHJcblxyXG4gICAgICAgIGhlbHBlcnMuc2hvd1N1bW1hcnkoZWwpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcblxyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKCdtZXNzYWdlcy9oZWxwZXJzJyk7XHJcblxyXG5cclxuY29uc3QgU1RPUkFHRV9JRCA9ICdqb2luQXJyJztcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0pvaW4nLCAnbWVzc2FnZXMnKTtcclxudGFiLmlubmVySFRNTCA9IFwiPHRlbXBsYXRlIGlkPVxcXCJqVGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb2x1bW4gaXMtb25lLXRoaXJkLWRlc2t0b3AgaXMtaGFsZi10YWJsZXRcXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYm94XFxcIj5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+IE1lc3NhZ2U6IDx0ZXh0YXJlYSBjbGFzcz1cXFwibVxcXCI+PC90ZXh0YXJlYT48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxkZXRhaWxzPjxzdW1tYXJ5Pk1vcmUgb3B0aW9ucyA8c21hbGwgY2xhc3M9XFxcInN1bW1hcnlcXFwiPjwvc21hbGw+PC9zdW1tYXJ5PlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzOiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJncm91cFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhbGxcXFwiPmFueW9uZTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwic3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJtb2RcXFwiPmEgbW9kPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzIG5vdDogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwibm90X2dyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm5vYm9keVxcXCI+bm9ib2R5PC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCIwXFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfbG93XFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHNwYW4+ICZsZTsgcGxheWVyIGpvaW5zICZsZTsgPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiOTk5OVxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2hpZ2hcXFwiPlxcclxcbiAgICAgICAgICAgIDwvZGV0YWlscz5cXHJcXG4gICAgICAgICAgICA8YT5EZWxldGU8L2E+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9qb2luXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgICAgIDxoMz5UaGVzZSBhcmUgY2hlY2tlZCB3aGVuIGEgcGxheWVyIGpvaW5zIHRoZSBzZXJ2ZXIuPC9oMz5cXHJcXG4gICAgICAgIDxzcGFuPllvdSBjYW4gdXNlIHt7TmFtZX19LCB7e05BTUV9fSwge3tuYW1lfX0sIGFuZCB7e2lwfX0gaW4geW91ciBtZXNzYWdlLjwvc3Bhbj5cXHJcXG4gICAgPC9zZWN0aW9uPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJqTXNnc1xcXCIgY2xhc3M9XFxcImNvbHVtbnMgaXMtbXVsdGlsaW5lXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbiAgICBzdGFydDogKCkgPT4gaG9vay5vbignd29ybGQuam9pbicsIG9uSm9pbiksXHJcbn07XHJcblxyXG52YXIgam9pbk1lc3NhZ2VzID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10pO1xyXG5qb2luTWVzc2FnZXMuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcbkFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJyNqTXNncyA+IGRpdicpKVxyXG4gICAgLmZvckVhY2goaGVscGVycy5zaG93U3VtbWFyeSk7XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gYWRkIGEgdHJpZ2dlciBtZXNzYWdlIHRvIHRoZSBwYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkTWVzc2FnZShtc2cgPSB7fSkge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjalRlbXBsYXRlJywgJyNqTXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICdvcHRpb24nLCByZW1vdmU6IFsnc2VsZWN0ZWQnXSwgbXVsdGlwbGU6IHRydWV9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy5tJywgdGV4dDogbXNnLm1lc3NhZ2UgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScsIHZhbHVlOiBtc2cuam9pbnNfbG93IHx8IDB9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2hpZ2ggfHwgOTk5OX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cuZ3JvdXAgfHwgJ2FsbCd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXSBbdmFsdWU9XCIke21zZy5ub3RfZ3JvdXAgfHwgJ25vYm9keSd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9XHJcbiAgICBdKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2F2ZSB0aGUgdXNlcidzIG1lc3NhZ2VzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIGpvaW5NZXNzYWdlcyA9IFtdO1xyXG4gICAgQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI2pNc2dzID4gZGl2JykpLmZvckVhY2goY29udGFpbmVyID0+IHtcclxuICAgICAgICBpZiAoIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGpvaW5NZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2xvdzogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfaGlnaDogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGdyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgbm90X2dyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBqb2luTWVzc2FnZXMpO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBsaXN0ZW4gdG8gcGxheWVyIGpvaW5zXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqL1xyXG5mdW5jdGlvbiBvbkpvaW4obmFtZSkge1xyXG4gICAgam9pbk1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAoaGVscGVycy5jaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuXHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ2xlYXZlQXJyJztcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0xlYXZlJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjx0ZW1wbGF0ZSBpZD1cXFwibFRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY29sdW1uIGlzLW9uZS10aGlyZC1kZXNrdG9wIGlzLWhhbGYtdGFibGV0XFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPk1lc3NhZ2UgPHRleHRhcmVhIGNsYXNzPVxcXCJtXFxcIj48L3RleHRhcmVhPjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGRldGFpbHM+PHN1bW1hcnk+TW9yZSBvcHRpb25zIDxzbWFsbCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+PC9zbWFsbD48L3N1bW1hcnk+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXM6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcImdyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFsbFxcXCI+YW55b25lPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXMgbm90OiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJub3RfZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibm9ib2R5XFxcIj5ub2JvZHk8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcInN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJvd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjBcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19sb3dcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3Bhbj4gJmxlOyBwbGF5ZXIgam9pbnMgJmxlOyA8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCI5OTk5XFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfaGlnaFxcXCI+XFxyXFxuICAgICAgICAgICAgPC9kZXRhaWxzPlxcclxcbiAgICAgICAgICAgIDxhPkRlbGV0ZTwvYT5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2xlYXZlXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgICAgIDxoMz5UaGVzZSBhcmUgY2hlY2tlZCB3aGVuIGEgcGxheWVyIGxlYXZlcyB0aGUgc2VydmVyLjwvaDM+XFxyXFxuICAgICAgICA8c3Bhbj5Zb3UgY2FuIHVzZSB7e05hbWV9fSwge3tOQU1FfX0sIHt7bmFtZX19LCBhbmQge3tpcH19IGluIHlvdXIgbWVzc2FnZS48L3NwYW4+XFxyXFxuICAgIDwvc2VjdGlvbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwibE1zZ3NcXFwiIGNsYXNzPVxcXCJjb2x1bW5zIGlzLW11bHRpbGluZVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGhvb2sub24oJ3dvcmxkLmxlYXZlJywgb25MZWF2ZSksXHJcbn07XHJcblxyXG52YXIgbGVhdmVNZXNzYWdlcyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdKTtcclxubGVhdmVNZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5cclxuQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI2xNc2dzID4gZGl2JykpXHJcbiAgICAuZm9yRWFjaChoZWxwZXJzLnNob3dTdW1tYXJ5KTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgbGVhdmUgbWVzc2FnZSB0byB0aGUgcGFnZS5cclxuICovXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UobXNnID0ge30pIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2xUZW1wbGF0ZScsICcjbE1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnb3B0aW9uJywgcmVtb3ZlOiBbJ3NlbGVjdGVkJ10sIG11bHRpcGxlOiB0cnVlfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IG1zZy5tZXNzYWdlIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdhbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdub2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhdmUgdGhlIGN1cnJlbnQgbGVhdmUgbWVzc2FnZXNcclxuICovXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICBsZWF2ZU1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjbE1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGVhdmVNZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2xvdzogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfaGlnaDogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGdyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgbm90X2dyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBsZWF2ZU1lc3NhZ2VzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gbGlzdGVuIHRvIHBsYXllciBkaXNjb25uZWN0aW9ucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIHBsYXllciBsZWF2aW5nLlxyXG4gKi9cclxuZnVuY3Rpb24gb25MZWF2ZShuYW1lKSB7XHJcbiAgICBsZWF2ZU1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAoaGVscGVycy5jaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuY29uc3Qgc2V0dGluZ3MgPSByZXF1aXJlKCdzZXR0aW5ncy9ib3QnKTtcclxuXHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ3RyaWdnZXJBcnInO1xyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignVHJpZ2dlcicsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8dGVtcGxhdGUgaWQ9XFxcInRUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNvbHVtbiBpcy1vbmUtdGhpcmQtZGVza3RvcCBpcy1oYWxmLXRhYmxldFxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxsYWJlbD5UcmlnZ2VyOiA8aW5wdXQgY2xhc3M9XFxcInRcXFwiPjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPk1lc3NhZ2U6IDx0ZXh0YXJlYSBjbGFzcz1cXFwibVxcXCI+PC90ZXh0YXJlYT48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxkZXRhaWxzPjxzdW1tYXJ5Pk1vcmUgb3B0aW9ucyA8c21hbGwgY2xhc3M9XFxcInN1bW1hcnlcXFwiPjwvc21hbGw+PC9zdW1tYXJ5PlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzOiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJncm91cFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhbGxcXFwiPmFueW9uZTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwic3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJtb2RcXFwiPmEgbW9kPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzIG5vdDogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwibm90X2dyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm5vYm9keVxcXCI+bm9ib2R5PC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCIwXFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfbG93XFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHNwYW4+ICZsZTsgcGxheWVyIGpvaW5zICZsZTsgPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiOTk5OVxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2hpZ2hcXFwiPlxcclxcbiAgICAgICAgICAgIDwvZGV0YWlscz5cXHJcXG4gICAgICAgICAgICA8YT5EZWxldGU8L2E+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl90cmlnZ2VyXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgICAgIDxoMz5UaGVzZSBhcmUgY2hlY2tlZCB3aGVuZXZlciBzb21lb25lIHNheXMgc29tZXRoaW5nLjwvaDM+XFxyXFxuICAgICAgICA8c3Bhbj5Zb3UgY2FuIHVzZSB7e05hbWV9fSwge3tOQU1FfX0sIHt7bmFtZX19LCBhbmQge3tpcH19IGluIHlvdXIgbWVzc2FnZS4gSWYgeW91IHB1dCBhbiBhc3RlcmlzayAoKikgaW4geW91ciB0cmlnZ2VyLCBpdCB3aWxsIGJlIHRyZWF0ZWQgYXMgYSB3aWxkY2FyZC4gKFRyaWdnZXIgXFxcInRlKnN0XFxcIiB3aWxsIG1hdGNoIFxcXCJ0ZWEgc3R1ZmZcXFwiIGFuZCBcXFwidGVzdFxcXCIpPC9zcGFuPlxcclxcbiAgICA8L3NlY3Rpb24+XFxyXFxuICAgIDxkaXYgaWQ9XFxcInRNc2dzXFxcIiBjbGFzcz1cXFwiY29sdW1ucyBpcy1tdWx0aWxpbmVcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxuICAgIHN0YXJ0OiAoKSA9PiBob29rLm9uKCd3b3JsZC5tZXNzYWdlJywgY2hlY2tUcmlnZ2VycyksXHJcbn07XHJcblxyXG52YXIgdHJpZ2dlck1lc3NhZ2VzID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10pO1xyXG50cmlnZ2VyTWVzc2FnZXMuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI3RNc2dzID4gZGl2JykpXHJcbiAgICAuZm9yRWFjaChoZWxwZXJzLnNob3dTdW1tYXJ5KTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgdHJpZ2dlciBtZXNzYWdlIHRvIHRoZSBwYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkTWVzc2FnZShtc2cgPSB7fSkge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjdFRlbXBsYXRlJywgJyN0TXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICdvcHRpb24nLCByZW1vdmU6IFsnc2VsZWN0ZWQnXSwgbXVsdGlwbGU6IHRydWV9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy5tJywgdGV4dDogbXNnLm1lc3NhZ2UgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy50JywgdmFsdWU6IG1zZy50cmlnZ2VyIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdhbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdub2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTYXZlcyB0aGUgY3VycmVudCB0cmlnZ2VyIG1lc3NhZ2VzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIHRyaWdnZXJNZXNzYWdlcyA9IFtdO1xyXG4gICAgQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI3RNc2dzID4gZGl2JykpLmZvckVhY2goY29udGFpbmVyID0+IHtcclxuICAgICAgICBpZiAoIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlIHx8ICFjb250YWluZXIucXVlcnlTZWxlY3RvcignLnQnKS52YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cmlnZ2VyTWVzc2FnZXMucHVzaCh7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlLFxyXG4gICAgICAgICAgICB0cmlnZ2VyOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignLnQnKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfbG93OiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19oaWdoOiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBub3RfZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIHRyaWdnZXJNZXNzYWdlcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgYSB0cmlnZ2VyIGFnYWluc3QgYSBtZXNzYWdlIHRvIHNlZSBpZiBpdCBtYXRjaGVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdHJpZ2dlciB0aGUgdHJpZ2dlciB0byB0cnkgdG8gbWF0Y2hcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcclxuICovXHJcbmZ1bmN0aW9uIHRyaWdnZXJNYXRjaCh0cmlnZ2VyLCBtZXNzYWdlKSB7XHJcbiAgICBpZiAoc2V0dGluZ3MucmVnZXhUcmlnZ2Vycykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHRyaWdnZXIsICdpJykudGVzdChtZXNzYWdlKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHVpLm5vdGlmeShgU2tpcHBpbmcgdHJpZ2dlciAnJHt0cmlnZ2VyfScgYXMgdGhlIFJlZ0V4IGlzIGludmFpbGQuYCk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IFJlZ0V4cChcclxuICAgICAgICAgICAgdHJpZ2dlclxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhbLis/Xj0hOiR7fSgpfFxcW1xcXVxcL1xcXFxdKS9nLCBcIlxcXFwkMVwiKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKi9nLCBcIi4qXCIpLFxyXG4gICAgICAgICAgICAnaSdcclxuICAgICAgICApLnRlc3QobWVzc2FnZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNoZWNrIGluY29taW5nIHBsYXllciBtZXNzYWdlcyBmb3IgdHJpZ2dlcnNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIHBsYXllcidzIG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrVHJpZ2dlcnMobmFtZSwgbWVzc2FnZSkge1xyXG4gICAgdmFyIHRvdGFsQWxsb3dlZCA9IHNldHRpbmdzLm1heFJlc3BvbnNlcztcclxuICAgIHRyaWdnZXJNZXNzYWdlcy5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgaWYgKHRvdGFsQWxsb3dlZCAmJiBoZWxwZXJzLmNoZWNrSm9pbnNBbmRHcm91cChuYW1lLCBtc2cpICYmIHRyaWdnZXJNYXRjaChtc2cudHJpZ2dlciwgbWVzc2FnZSkpIHtcclxuICAgICAgICAgICAgaGVscGVycy5idWlsZEFuZFNlbmRNZXNzYWdlKG1zZy5tZXNzYWdlLCBuYW1lKTtcclxuICAgICAgICAgICAgdG90YWxBbGxvd2VkLS07XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnbWJfcHJlZmVyZW5jZXMnO1xyXG5cclxudmFyIHByZWZzID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwge30sIGZhbHNlKTtcclxuXHJcbi8vIFNldCB0aGUgZGVmYXVsdCBzZXR0aW5nc1xyXG5bXHJcbiAgICB7dHlwZTogJ251bWJlcicsIGtleTogJ2Fubm91bmNlbWVudERlbGF5JywgZGVmYXVsdDogMTB9LFxyXG4gICAge3R5cGU6ICdudW1iZXInLCBrZXk6ICdtYXhSZXNwb25zZXMnLCBkZWZhdWx0OiAyfSxcclxuICAgIHt0eXBlOiAnYm9vbGVhbicsIGtleTogJ25vdGlmeScsIGRlZmF1bHQ6IHRydWV9LFxyXG4gICAgLy8gQWR2YW5jZWRcclxuICAgIHt0eXBlOiAnYm9vbGVhbicsIGtleTogJ2Rpc2FibGVUcmltJywgZGVmYXVsdDogZmFsc2V9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAncmVnZXhUcmlnZ2VycycsIGRlZmF1bHQ6IGZhbHNlfSxcclxuICAgIHt0eXBlOiAnYm9vbGVhbicsIGtleTogJ3NwbGl0TWVzc2FnZXMnLCBkZWZhdWx0OiBmYWxzZX0sXHJcbiAgICB7dHlwZTogJ3N0cmluZycsIGtleTogJ3NwbGl0VG9rZW4nLCBkZWZhdWx0OiAnPHNwbGl0Pid9LFxyXG5dLmZvckVhY2gocHJlZiA9PiB7XHJcbiAgICAvLyBTZXQgZGVmYXVsdHMgaWYgbm90IHNldFxyXG4gICAgaWYgKHR5cGVvZiBwcmVmc1twcmVmLmtleV0gIT0gIHByZWYudHlwZSkge1xyXG4gICAgICAgIHByZWZzW3ByZWYua2V5XSA9IHByZWYuZGVmYXVsdDtcclxuICAgIH1cclxufSk7XHJcblxyXG4vLyBBdXRvIHNhdmUgb24gY2hhbmdlXHJcbi8vIElFIChhbGwpIC8gU2FmYXJpICg8IDEwKSBkb2Vzbid0IHN1cHBvcnQgcHJveGllc1xyXG5pZiAodHlwZW9mIFByb3h5ID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHByZWZzO1xyXG4gICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgcHJlZnMsIGZhbHNlKTtcclxuICAgIH0sIDMwICogMTAwMCk7XHJcbn0gZWxzZSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG5ldyBQcm94eShwcmVmcywge1xyXG4gICAgICAgIHNldDogZnVuY3Rpb24ob2JqLCBwcm9wLCB2YWwpIHtcclxuICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gdmFsO1xyXG4gICAgICAgICAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgcHJlZnMsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmNvbnN0IHByZWZzID0gcmVxdWlyZSgnc2V0dGluZ3MvYm90Jyk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignQm90JywgJ3NldHRpbmdzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjxkaXYgaWQ9XFxcIm1iX3NldHRpbmdzXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyXFxcIj5cXHJcXG4gICAgPGgzIGNsYXNzPVxcXCJ0aXRsZVxcXCI+R2VuZXJhbCBTZXR0aW5nczwvaDM+XFxyXFxuICAgIDxsYWJlbD5NaW51dGVzIGJldHdlZW4gYW5ub3VuY2VtZW50czwvbGFiZWw+XFxyXFxuICAgIDxwIGNsYXNzPVxcXCJjb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxpbnB1dCBjbGFzcz1cXFwiaW5wdXRcXFwiIGRhdGEta2V5PVxcXCJhbm5vdW5jZW1lbnREZWxheVxcXCIgdHlwZT1cXFwibnVtYmVyXFxcIj48YnI+XFxyXFxuICAgIDwvcD5cXHJcXG4gICAgPGxhYmVsPk1heGltdW0gdHJpZ2dlciByZXNwb25zZXMgdG8gYSBtZXNzYWdlPC9sYWJlbD5cXHJcXG4gICAgPHAgY2xhc3M9XFxcImNvbnRyb2xcXFwiPlxcclxcbiAgICAgICAgPGlucHV0IGNsYXNzPVxcXCJpbnB1dFxcXCIgZGF0YS1rZXk9XFxcIm1heFJlc3BvbnNlc1xcXCIgdHlwZT1cXFwibnVtYmVyXFxcIj5cXHJcXG4gICAgPC9wPlxcclxcbiAgICA8cCBjbGFzcz1cXFwiY29udHJvbFxcXCI+XFxyXFxuICAgICAgICA8bGFiZWwgY2xhc3M9XFxcImNoZWNrYm94XFxcIj5cXHJcXG4gICAgICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcIm5vdGlmeVxcXCIgdHlwZT1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIE5ldyBjaGF0IG5vdGlmaWNhdGlvbnNcXHJcXG4gICAgICAgIDwvbGFiZWw+XFxyXFxuICAgIDwvcD5cXHJcXG5cXHJcXG4gICAgPGhyPlxcclxcblxcclxcbiAgICA8aDMgY2xhc3M9XFxcInRpdGxlXFxcIj5BZHZhbmNlZCBTZXR0aW5nczwvaDM+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcIm1lc3NhZ2UgaXMtd2FybmluZ1xcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJtZXNzYWdlLWhlYWRlclxcXCI+XFxyXFxuICAgICAgICAgICAgPHA+V2FybmluZzwvcD5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwibWVzc2FnZS1ib2R5XFxcIj5cXHJcXG4gICAgICAgICAgICA8cD5DaGFuZ2luZyB0aGVzZSBvcHRpb25zIGNhbiByZXN1bHQgaW4gdW5leHBlY3RlZCBiZWhhdmlvci4gPGEgaHJlZj1cXFwiaHR0cHM6Ly9naXRodWIuY29tL0JpYmxpb2ZpbGUvQmxvY2toZWFkcy1NZXNzYWdlQm90L3dpa2kvMS4tQWR2YW5jZWQtT3B0aW9ucy9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5SZWFkIHRoaXMgZmlyc3Q8L2E+PC9wPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbiAgICA8cCBjbGFzcz1cXFwiY29udHJvbFxcXCI+XFxyXFxuICAgICAgICA8bGFiZWwgY2xhc3M9XFxcImNoZWNrYm94XFxcIj5cXHJcXG4gICAgICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcInJlZ2V4VHJpZ2dlcnNcXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIj5cXHJcXG4gICAgICAgICAgICBQYXJzZSB0cmlnZ2VycyBhcyBSZWdFeFxcclxcbiAgICAgICAgPC9sYWJlbD5cXHJcXG4gICAgPC9wPlxcclxcbiAgICA8cCBjbGFzcz1cXFwiY29udHJvbFxcXCI+XFxyXFxuICAgICAgICA8bGFiZWwgY2xhc3M9XFxcImNoZWNrYm94XFxcIj5cXHJcXG4gICAgICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcImRpc2FibGVUcmltXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgRGlzYWJsZSB3aGl0ZXNwYWNlIHRyaW1taW5nXFxyXFxuICAgICAgICA8L2xhYmVsPlxcclxcbiAgICA8L3A+XFxyXFxuICAgIDxwIGNsYXNzPVxcXCJjb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxsYWJlbCBjbGFzcz1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwic3BsaXRNZXNzYWdlc1xcXCIgdHlwZT1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIFNwbGl0IG1lc3NhZ2VzXFxyXFxuICAgICAgICA8L2xhYmVsPlxcclxcbiAgICA8L3A+XFxyXFxuICAgIDxsYWJlbCBjbGFzcz1cXFwibGFiZWxcXFwiPlNwbGl0IHRva2VuOjwvbGFiZWw+XFxyXFxuICAgIDxwIGNsYXNzPVxcXCJjb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxpbnB1dCBjbGFzcz1cXFwiaW5wdXRcXFwiIGRhdGEta2V5PVxcXCJzcGxpdFRva2VuXFxcIiB0eXBlPVxcXCJ0ZXh0XFxcIj5cXHJcXG4gICAgPC9wPlxcclxcblxcclxcbiAgICA8aHI+XFxyXFxuXFxyXFxuICAgIDxoMyBjbGFzcz1cXFwidGl0bGVcXFwiPkJhY2t1cCAvIFJlc3RvcmU8L2gzPlxcclxcbiAgICA8YSBjbGFzcz1cXFwiYnV0dG9uXFxcIiBpZD1cXFwibWJfYmFja3VwX3NhdmVcXFwiPkdldCBiYWNrdXAgY29kZTwvYT5cXHJcXG4gICAgPGEgY2xhc3M9XFxcImJ1dHRvblxcXCIgaWQ9XFxcIm1iX2JhY2t1cF9sb2FkXFxcIj5JbXBvcnQgYmFja3VwPC9hPlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxuLy8gU2hvdyBwcmVmc1xyXG5PYmplY3Qua2V5cyhwcmVmcykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgdmFyIGVsID0gdGFiLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWtleT1cIiR7a2V5fVwiXWApO1xyXG4gICAgc3dpdGNoICh0eXBlb2YgcHJlZnNba2V5XSkge1xyXG4gICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxyXG4gICAgICAgICAgICBlbC5jaGVja2VkID0gcHJlZnNba2V5XTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgZWwudmFsdWUgPSBwcmVmc1trZXldO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG4vLyBXYXRjaCBmb3IgY2hhbmdlc1xyXG50YWIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIHZhciBnZXRWYWx1ZSA9IChrZXkpID0+IHRhYi5xdWVyeVNlbGVjdG9yKGBbZGF0YS1rZXk9XCIke2tleX1cIl1gKS52YWx1ZTtcclxuICAgIHZhciBnZXRJbnQgPSAoa2V5KSA9PiArZ2V0VmFsdWUoa2V5KTtcclxuICAgIHZhciBnZXRDaGVja2VkID0gKGtleSkgPT4gdGFiLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWtleT1cIiR7a2V5fVwiXWApLmNoZWNrZWQ7XHJcblxyXG4gICAgT2JqZWN0LmtleXMocHJlZnMpLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICB2YXIgZnVuYztcclxuXHJcbiAgICAgICAgc3dpdGNoKHR5cGVvZiBwcmVmc1trZXldKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxyXG4gICAgICAgICAgICAgICAgZnVuYyA9IGdldENoZWNrZWQ7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSBnZXRJbnQ7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSBnZXRWYWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByZWZzW2tleV0gPSBmdW5jKGtleSk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5cclxuLy8gR2V0IGJhY2t1cFxyXG50YWIucXVlcnlTZWxlY3RvcignI21iX2JhY2t1cF9zYXZlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBzaG93QmFja3VwKCkge1xyXG4gICAgdmFyIGJhY2t1cCA9IEpTT04uc3RyaW5naWZ5KGxvY2FsU3RvcmFnZSkucmVwbGFjZSgvPC9nLCAnJmx0OycpO1xyXG4gICAgdWkuYWxlcnQoYENvcHkgdGhpcyB0byBhIHNhZmUgcGxhY2U6PGJyPjx0ZXh0YXJlYSBjbGFzcz1cInRleHRhcmVhXCI+JHtiYWNrdXB9PC90ZXh0YXJlYT5gKTtcclxufSk7XHJcblxyXG5cclxuLy8gTG9hZCBiYWNrdXBcclxudGFiLnF1ZXJ5U2VsZWN0b3IoJyNtYl9iYWNrdXBfbG9hZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gbG9hZEJhY2t1cCgpIHtcclxuICAgIHVpLmFsZXJ0KCdFbnRlciB0aGUgYmFja3VwIGNvZGU6PHRleHRhcmVhIGNsYXNzPVwidGV4dGFyZWFcIj48L3RleHRhcmVhPicsXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgeyB0ZXh0OiAnTG9hZCAmIHJlZnJlc2ggcGFnZScsIHN0eWxlOiAnaXMtc3VjY2VzcycsIGFjdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IHRleHRhcmVhJykudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlID0gSlNPTi5wYXJzZShjb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJhY2t1cCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1aS5ub3RpZnkoJ0ludmFsaWQgYmFja3VwIGNvZGUuIE5vIGFjdGlvbiB0YWtlbi4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLmNsZWFyKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb2RlKS5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgY29kZVtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyB0ZXh0OiAnQ2FuY2VsJyB9XHJcbiAgICAgICAgICAgICAgICBdKTtcclxufSk7XHJcbiIsImNvbnN0IGJoZmFuc2FwaSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9iaGZhbnNhcGknKTtcclxuY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgTWVzc2FnZUJvdEV4dGVuc2lvbiA9IHJlcXVpcmUoJ01lc3NhZ2VCb3RFeHRlbnNpb24nKTtcclxuXHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdFeHRlbnNpb25zJywgJ3NldHRpbmdzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSAnPHN0eWxlPicgK1xyXG4gICAgXCJAa2V5ZnJhbWVzIHNwaW5Bcm91bmR7ZnJvbXt0cmFuc2Zvcm06cm90YXRlKDBkZWcpfXRve3RyYW5zZm9ybTpyb3RhdGUoMzU5ZGVnKX19I2V4dHN7Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMH1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7I2V4dHMgLmNhcmQtY29udGVudHtoZWlnaHQ6MTA1cHh9fVxcblwiICtcclxuICAgICc8L3N0eWxlPicgK1xyXG4gICAgXCI8dGVtcGxhdGUgaWQ9XFxcImV4dFRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY29sdW1uIGlzLW9uZS10aGlyZC1kZXNrdG9wIGlzLWhhbGYtdGFibGV0XFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImNhcmRcXFwiPlxcclxcbiAgICAgICAgICAgIDxoZWFkZXIgY2xhc3M9XFxcImNhcmQtaGVhZGVyXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHAgY2xhc3M9XFxcImNhcmQtaGVhZGVyLXRpdGxlXFxcIj48L3A+XFxyXFxuICAgICAgICAgICAgPC9oZWFkZXI+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiY2FyZC1jb250ZW50XFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcImNvbnRlbnRcXFwiPjwvc3Bhbj5cXHJcXG4gICAgICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjYXJkLWZvb3RlclxcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxhIGNsYXNzPVxcXCJjYXJkLWZvb3Rlci1pdGVtXFxcIj5JbnN0YWxsPC9hPlxcclxcbiAgICAgICAgICAgIDwvZGl2PlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvdGVtcGxhdGU+XFxyXFxuPGRpdiBpZD1cXFwibWJfZXh0ZW5zaW9uc1xcXCIgY2xhc3M9XFxcImNvbnRhaW5lciBpcy1mbHVpZFxcXCI+XFxyXFxuICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJzZWN0aW9uIGlzLXNtYWxsXFxcIj5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJidXR0b24gaXMtcHJpbWFyeSBpcy1wdWxsZWQtcmlnaHRcXFwiPkxvYWQgQnkgSUQvVVJMPC9zcGFuPlxcclxcbiAgICAgICAgPGgzPkV4dGVuc2lvbnMgY2FuIGluY3JlYXNlIHRoZSBmdW5jdGlvbmFsaXR5IG9mIHRoZSBib3QuPC9oMz5cXHJcXG4gICAgICAgIDxzcGFuPkludGVyZXN0ZWQgaW4gY3JlYXRpbmcgb25lPyA8YSBocmVmPVxcXCJodHRwczovL2dpdGh1Yi5jb20vQmlibGlvZmlsZS9CbG9ja2hlYWRzLU1lc3NhZ2VCb3Qvd2lraS8yLi1EZXZlbG9wbWVudDotU3RhcnQtSGVyZVxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlN0YXJ0IGhlcmUuPC9hPjwvc3Bhbj5cXHJcXG4gICAgPC9zZWN0aW9uPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJleHRzXFxcIiBjbGFzcz1cXFwiY29sdW1ucyBpcy1tdWx0aWxpbmVcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gYWRkIGEgY2FyZCBmb3IgYW4gZXh0ZW5zaW9uLlxyXG4gKlxyXG4gKiBleHRlbnNpb24gaXMgZXhwZWN0ZWQgdG8gY29udGFpbiBhIHRpdGxlLCBzbmlwcGV0LCBhbmQgaWRcclxuICovXHJcbmZ1bmN0aW9uIGFkZEV4dGVuc2lvbkNhcmQoZXh0ZW5zaW9uKSB7XHJcbiAgICBpZiAoIXRhYi5xdWVyeVNlbGVjdG9yKGAjbWJfZXh0ZW5zaW9ucyBbZGF0YS1pZD1cIiR7ZXh0ZW5zaW9uLmlkfVwiXWApKSB7XHJcbiAgICAgICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjZXh0VGVtcGxhdGUnLCAnI2V4dHMnLCBbXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJy5jYXJkLWhlYWRlci10aXRsZScsIHRleHQ6IGV4dGVuc2lvbi50aXRsZX0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJy5jb250ZW50JywgaHRtbDogZXh0ZW5zaW9uLnNuaXBwZXR9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogJy5jYXJkLWZvb3Rlci1pdGVtJyxcclxuICAgICAgICAgICAgICAgIHRleHQ6IE1lc3NhZ2VCb3RFeHRlbnNpb24uaXNMb2FkZWQoZXh0ZW5zaW9uLmlkKSA/ICdSZW1vdmUnIDogJ0luc3RhbGwnLFxyXG4gICAgICAgICAgICAgICAgJ2RhdGEtaWQnOiBleHRlbnNpb24uaWRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vL0NyZWF0ZSB0aGUgZXh0ZW5zaW9uIHN0b3JlIHBhZ2VcclxuYmhmYW5zYXBpLmdldFN0b3JlKCkudGhlbihyZXNwID0+IHtcclxuICAgIGlmIChyZXNwLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V4dHMnKS5pbm5lckhUTUwgKz0gcmVzcC5tZXNzYWdlO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gICAgcmVzcC5leHRlbnNpb25zLmZvckVhY2goYWRkRXh0ZW5zaW9uQ2FyZCk7XHJcbn0pLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcik7XHJcblxyXG4vLyBJbnN0YWxsIC8gdW5pbnN0YWxsIGV4dGVuc2lvbnNcclxudGFiLnF1ZXJ5U2VsZWN0b3IoJyNleHRzJylcclxuICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGV4dEFjdGlvbnMoZSkge1xyXG4gICAgICAgIHZhciBlbCA9IGUudGFyZ2V0O1xyXG4gICAgICAgIHZhciBpZCA9IGVsLmRhdGFzZXQuaWQ7XHJcblxyXG4gICAgICAgIGlmICghaWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGVsLnRleHRDb250ZW50ID09ICdJbnN0YWxsJykge1xyXG4gICAgICAgICAgICBNZXNzYWdlQm90RXh0ZW5zaW9uLmluc3RhbGwoaWQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIE1lc3NhZ2VCb3RFeHRlbnNpb24udW5pbnN0YWxsKGlkKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbnRhYi5xdWVyeVNlbGVjdG9yKCcuYnV0dG9uJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBsb2FkRXh0ZW5zaW9uKCkge1xyXG4gICAgdWkuYWxlcnQoJ0VudGVyIHRoZSBJRCBvciBVUkwgb2YgYW4gZXh0ZW5zaW9uOjxicj48aW5wdXQgY2xhc3M9XCJpbnB1dFwiLz4nLFxyXG4gICAgICAgIFtcclxuICAgICAgICAgICAge3RleHQ6ICdMb2FkJywgc3R5bGU6ICdpcy1zdWNjZXNzJywgYWN0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGxldCBleHRSZWYgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQgaW5wdXQnKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmIChleHRSZWYubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4dFJlZi5zdGFydHNXaXRoKCdodHRwJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNyYyA9IGV4dFJlZjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsKGV4dFJlZik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAge3RleHQ6ICdDYW5jZWwnfVxyXG4gICAgICAgIF0pO1xyXG59KTtcclxuXHJcblxyXG5cclxuaG9vay5vbignZXh0ZW5zaW9uLmluc3RhbGwnLCBmdW5jdGlvbihpZCkge1xyXG4gICAgLy8gU2hvdyByZW1vdmUgdG8gbGV0IHVzZXJzIHJlbW92ZSBleHRlbnNpb25zXHJcbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI21iX2V4dGVuc2lvbnMgW2RhdGEtaWQ9XCIke2lkfVwiXWApO1xyXG4gICAgaWYgKGJ1dHRvbikge1xyXG4gICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICdSZW1vdmUnO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBiaGZhbnNhcGkuZ2V0RXh0ZW5zaW9uSW5mbyhpZClcclxuICAgICAgICAgICAgLnRoZW4oYWRkRXh0ZW5zaW9uQ2FyZCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuaG9vay5vbignZXh0ZW5zaW9uLnVuaW5zdGFsbCcsIGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAvLyBTaG93IHJlbW92ZWQgZm9yIHN0b3JlIGluc3RhbGwgYnV0dG9uXHJcbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI21iX2V4dGVuc2lvbnMgW2RhdGEtaWQ9XCIke2lkfVwiXWApO1xyXG4gICAgaWYgKGJ1dHRvbikge1xyXG4gICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICdSZW1vdmVkJztcclxuICAgICAgICBidXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnSW5zdGFsbCc7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIH0sIDMwMDApO1xyXG4gICAgfVxyXG59KTtcclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG51aS5hZGRUYWJHcm91cCgnU2V0dGluZ3MnLCAnc2V0dGluZ3MnKTtcclxuXHJcbnJlcXVpcmUoJy4vYm90L3BhZ2UnKTtcclxucmVxdWlyZSgnLi9leHRlbnNpb25zJyk7XHJcbiIsIi8vIE92ZXJ3cml0ZSB0aGUgcG9sbENoYXQgZnVuY3Rpb24gdG8ga2lsbCB0aGUgZGVmYXVsdCBjaGF0IGZ1bmN0aW9uXHJcbndpbmRvdy5wb2xsQ2hhdCA9IGZ1bmN0aW9uKCkge307XHJcblxyXG4vLyBPdmVyd3JpdGUgdGhlIG9sZCBwYWdlXHJcbmRvY3VtZW50LmJvZHkuaW5uZXJIVE1MID0gJyc7XHJcbi8vIFN0eWxlIHJlc2V0XHJcbkFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW3R5cGU9XCJ0ZXh0L2Nzc1wiXScpKVxyXG4gICAgLmZvckVhY2goZWwgPT4gZWwucmVtb3ZlKCkpO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcigndGl0bGUnKS50ZXh0Q29udGVudCA9ICdDb25zb2xlIC0gTWVzc2FnZUJvdCc7XHJcblxyXG4vLyBTZXQgdGhlIGljb24gdG8gdGhlIGJsb2NraGVhZCBpY29uIHVzZWQgb24gdGhlIGZvcnVtc1xyXG52YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XHJcbmVsLnJlbCA9ICdpY29uJztcclxuZWwuaHJlZiA9ICdodHRwczovL2lzLmdkL01CdlVIRic7XHJcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxucmVxdWlyZSgnY29uc29sZS1icm93c2VyaWZ5Jyk7XHJcbnJlcXVpcmUoJ2JvdC9taWdyYXRpb24nKTtcclxuXHJcbmNvbnN0IGJoZmFuc2FwaSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9iaGZhbnNhcGknKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuaG9vay5vbignZXJyb3JfcmVwb3J0JywgZnVuY3Rpb24obXNnKSB7XHJcbiAgICB1aS5ub3RpZnkobXNnKTtcclxufSk7XHJcblxyXG4vLyBqdXN0IHJlcXVpcmUoY29uc29sZSkgZG9lc24ndCB3b3JrIGFzIGNvbnNvbGUgaXMgYSBicm93c2VyaWZ5IG1vZHVsZS5cclxucmVxdWlyZSgnLi9jb25zb2xlJyk7XHJcbi8vIEJ5IGRlZmF1bHQgbm8gdGFiIGlzIHNlbGVjdGVkLCBzaG93IHRoZSBjb25zb2xlLlxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubmF2LXNsaWRlci1jb250YWluZXIgc3BhbicpLmNsaWNrKCk7XHJcbnJlcXVpcmUoJ21lc3NhZ2VzJyk7XHJcbnJlcXVpcmUoJ3NldHRpbmdzJyk7XHJcblxyXG4vLyBFcnJvciByZXBvcnRpbmdcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgKGVycikgPT4ge1xyXG4gICAgaWYgKCFbJ1NjcmlwdCBlcnJvci4nLCAnV29ybGQgbm90IHJ1bm5pbmcnLCAnTmV0d29yayBFcnJvciddLmluY2x1ZGVzKGVyci5tZXNzYWdlKSkge1xyXG4gICAgICAgIGJoZmFuc2FwaS5yZXBvcnRFcnJvcihlcnIpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vIEV4cG9zZSB0aGUgZXh0ZW5zaW9uIEFQSVxyXG53aW5kb3cuTWVzc2FnZUJvdEV4dGVuc2lvbiA9IHJlcXVpcmUoJ01lc3NhZ2VCb3RFeHRlbnNpb24nKTtcclxuIiwicmVxdWlyZSgnLi9wb2x5ZmlsbHMvZGV0YWlscycpO1xyXG5cclxuLy8gQnVpbGQgdGhlIEFQSVxyXG5PYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2xheW91dCcpLFxyXG4gICAgcmVxdWlyZSgnLi90ZW1wbGF0ZScpLFxyXG4gICAgcmVxdWlyZSgnLi9ub3RpZmljYXRpb25zJylcclxuKTtcclxuXHJcbi8vIEZ1bmN0aW9ucyB3aGljaCBhcmUgbm8gbG9uZ2VyIGNvbnRhaW5lZCBpbiB0aGlzIG1vZHVsZSwgYnV0IGFyZSByZXRhaW5lZCBmb3Igbm93IGZvciBiYWNrd2FyZCBjb21wYXRhYmlsaXR5LlxyXG5jb25zdCB3cml0ZSA9IHJlcXVpcmUoJy4uL2NvbnNvbGUvZXhwb3J0cycpLndyaXRlO1xyXG5tb2R1bGUuZXhwb3J0cy5hZGRNZXNzYWdlVG9Db25zb2xlID0gZnVuY3Rpb24obXNnLCBuYW1lID0gJycsIG5hbWVDbGFzcyA9ICcnKSB7XHJcbiAgICBjb25zb2xlLndhcm4oJ3VpLmFkZE1lc3NhZ2VUb0NvbnNvbGUgaGFzIGJlZW4gZGVwcmljYXRlZC4gVXNlIGV4LmNvbnNvbGUud3JpdGUgaW5zdGVhZC4nKTtcclxuICAgIHdyaXRlKG1zZywgbmFtZSwgbmFtZUNsYXNzKTtcclxufTtcclxuIiwiLyoqXHJcbiAqIEBmaWxlIENvbnRhaW5zIGZ1bmN0aW9ucyBmb3IgbWFuYWdpbmcgdGhlIHBhZ2UgbGF5b3V0XHJcbiAqL1xyXG5cclxuXHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5cclxuLy8gQnVpbGQgcGFnZSAtIG9ubHkgY2FzZSBpbiB3aGljaCBib2R5LmlubmVySFRNTCBzaG91bGQgYmUgdXNlZC5cclxuZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgKz0gXCI8aGVhZGVyIGNsYXNzPVxcXCJoZWFkZXIgaXMtZml4ZWQtdG9wXFxcIj5cXHJcXG4gIDxuYXYgY2xhc3M9XFxcIm5hdi1pbnZlcnNlIG5hdiBoYXMtc2hhZG93XFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwibmF2LWxlZnRcXFwiPlxcclxcbiAgICAgIDxkaXYgY2xhc3M9XFxcIm5hdi1pdGVtIG5hdi1zbGlkZXItdG9nZ2xlXFxcIj5cXHJcXG4gICAgICAgIDxpbWcgc3JjPVxcXCJodHRwczovL2kuaW1nc2FmZS5vcmcvODBhMTEyOWEzNi5wbmdcXFwiPlxcclxcbiAgICAgIDwvZGl2PlxcclxcbiAgICAgIDxhIGNsYXNzPVxcXCJuYXYtaXRlbSBpcy10YWIgbmF2LXNsaWRlci10b2dnbGVcXFwiPlxcclxcbiAgICAgICAgTWVudVxcclxcbiAgICAgIDwvYT5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICA8L25hdj5cXHJcXG48L2hlYWRlcj5cXHJcXG5cXHJcXG48ZGl2IGNsYXNzPVxcXCJuYXYtc2xpZGVyLWNvbnRhaW5lclxcXCI+XFxyXFxuICAgIDxuYXYgY2xhc3M9XFxcIm5hdi1zbGlkZXJcXFwiIGRhdGEtdGFiLWdyb3VwPVxcXCJtYWluXFxcIj48L25hdj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiaXMtb3ZlcmxheVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuPGRpdiBpZD1cXFwiY29udGFpbmVyXFxcIiBjbGFzcz1cXFwiaGFzLWZpeGVkLW5hdlxcXCI+PC9kaXY+XFxyXFxuXCI7XHJcbmRvY3VtZW50LmhlYWQuaW5uZXJIVE1MICs9ICc8c3R5bGU+JyArXHJcbiAgICBcImh0bWx7b3ZlcmZsb3cteTphdXRvICFpbXBvcnRhbnR9LyohIGJ1bG1hLmlvIHYwLjMuMSB8IE1JVCBMaWNlbnNlIHwgZ2l0aHViLmNvbS9qZ3RobXMvYnVsbWEgKi9Aa2V5ZnJhbWVzIHNwaW5Bcm91bmR7ZnJvbXt0cmFuc2Zvcm06cm90YXRlKDBkZWcpfXRve3RyYW5zZm9ybTpyb3RhdGUoMzU5ZGVnKX19LyohIG1pbmlyZXNldC5jc3MgdjAuMC4yIHwgTUlUIExpY2Vuc2UgfCBnaXRodWIuY29tL2pndGhtcy9taW5pcmVzZXQuY3NzICovaHRtbCxib2R5LHAsb2wsdWwsbGksZGwsZHQsZGQsYmxvY2txdW90ZSxmaWd1cmUsZmllbGRzZXQsbGVnZW5kLHRleHRhcmVhLHByZSxpZnJhbWUsaHIsaDEsaDIsaDMsaDQsaDUsaDZ7bWFyZ2luOjA7cGFkZGluZzowfWgxLGgyLGgzLGg0LGg1LGg2e2ZvbnQtc2l6ZToxMDAlO2ZvbnQtd2VpZ2h0Om5vcm1hbH11bHtsaXN0LXN0eWxlOm5vbmV9YnV0dG9uLGlucHV0LHNlbGVjdCx0ZXh0YXJlYXttYXJnaW46MH1odG1se2JveC1zaXppbmc6Ym9yZGVyLWJveH0qe2JveC1zaXppbmc6aW5oZXJpdH0qOmJlZm9yZSwqOmFmdGVye2JveC1zaXppbmc6aW5oZXJpdH1pbWcsZW1iZWQsb2JqZWN0LGF1ZGlvLHZpZGVve2hlaWdodDphdXRvO21heC13aWR0aDoxMDAlfWlmcmFtZXtib3JkZXI6MH10YWJsZXtib3JkZXItY29sbGFwc2U6Y29sbGFwc2U7Ym9yZGVyLXNwYWNpbmc6MH10ZCx0aHtwYWRkaW5nOjA7dGV4dC1hbGlnbjpsZWZ0fWh0bWx7YmFja2dyb3VuZC1jb2xvcjojZmZmO2ZvbnQtc2l6ZToxNHB4Oy1tb3otb3N4LWZvbnQtc21vb3RoaW5nOmdyYXlzY2FsZTstd2Via2l0LWZvbnQtc21vb3RoaW5nOmFudGlhbGlhc2VkO21pbi13aWR0aDozMDBweDtvdmVyZmxvdy14OmhpZGRlbjtvdmVyZmxvdy15OnNjcm9sbDt0ZXh0LXJlbmRlcmluZzpvcHRpbWl6ZUxlZ2liaWxpdHl9YXJ0aWNsZSxhc2lkZSxmaWd1cmUsZm9vdGVyLGhlYWRlcixoZ3JvdXAsc2VjdGlvbntkaXNwbGF5OmJsb2NrfWJvZHksYnV0dG9uLGlucHV0LHNlbGVjdCx0ZXh0YXJlYXtmb250LWZhbWlseTotYXBwbGUtc3lzdGVtLEJsaW5rTWFjU3lzdGVtRm9udCxcXFwiU2Vnb2UgVUlcXFwiLFxcXCJSb2JvdG9cXFwiLFxcXCJPeHlnZW5cXFwiLFxcXCJVYnVudHVcXFwiLFxcXCJDYW50YXJlbGxcXFwiLFxcXCJGaXJhIFNhbnNcXFwiLFxcXCJEcm9pZCBTYW5zXFxcIixcXFwiSGVsdmV0aWNhIE5ldWVcXFwiLFxcXCJIZWx2ZXRpY2FcXFwiLFxcXCJBcmlhbFxcXCIsc2Fucy1zZXJpZn1jb2RlLHByZXstbW96LW9zeC1mb250LXNtb290aGluZzphdXRvOy13ZWJraXQtZm9udC1zbW9vdGhpbmc6YXV0bztmb250LWZhbWlseTpcXFwiSW5jb25zb2xhdGFcXFwiLFxcXCJDb25zb2xhc1xcXCIsXFxcIk1vbmFjb1xcXCIsbW9ub3NwYWNlfWJvZHl7Y29sb3I6IzRhNGE0YTtmb250LXNpemU6MXJlbTtmb250LXdlaWdodDo0MDA7bGluZS1oZWlnaHQ6MS41fWF7Y29sb3I6IzE4MmI3MztjdXJzb3I6cG9pbnRlcjt0ZXh0LWRlY29yYXRpb246bm9uZTt0cmFuc2l0aW9uOm5vbmUgODZtcyBlYXNlLW91dH1hOmhvdmVye2NvbG9yOiMzNjM2MzZ9Y29kZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6cmVkO2ZvbnQtc2l6ZTowLjhlbTtmb250LXdlaWdodDpub3JtYWw7cGFkZGluZzowLjI1ZW0gMC41ZW0gMC4yNWVtfWhye2JhY2tncm91bmQtY29sb3I6I2RiZGJkYjtib3JkZXI6bm9uZTtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcHg7bWFyZ2luOjEuNXJlbSAwfWltZ3ttYXgtd2lkdGg6MTAwJX1pbnB1dFt0eXBlPVxcXCJjaGVja2JveFxcXCJdLGlucHV0W3R5cGU9XFxcInJhZGlvXFxcIl17dmVydGljYWwtYWxpZ246YmFzZWxpbmV9c21hbGx7Zm9udC1zaXplOjAuOGVtfXNwYW57Zm9udC1zdHlsZTppbmhlcml0O2ZvbnQtd2VpZ2h0OmluaGVyaXR9c3Ryb25ne2NvbG9yOiMzNjM2MzY7Zm9udC13ZWlnaHQ6NzAwfXByZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzRhNGE0YTtmb250LXNpemU6MC44ZW07d2hpdGUtc3BhY2U6cHJlO3dvcmQtd3JhcDpub3JtYWx9cHJlIGNvZGV7YmFja2dyb3VuZDpub25lO2NvbG9yOmluaGVyaXQ7ZGlzcGxheTpibG9jaztmb250LXNpemU6MWVtO292ZXJmbG93LXg6YXV0bztwYWRkaW5nOjEuMjVyZW0gMS41cmVtfXRhYmxle3dpZHRoOjEwMCV9dGFibGUgdGQsdGFibGUgdGh7dGV4dC1hbGlnbjpsZWZ0O3ZlcnRpY2FsLWFsaWduOnRvcH10YWJsZSB0aHtjb2xvcjojMzYzNjM2fS5pcy1ibG9ja3tkaXNwbGF5OmJsb2NrfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtYmxvY2stbW9iaWxle2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5pcy1ibG9jay10YWJsZXR7ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtYmxvY2stdGFibGV0LW9ubHl7ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWJsb2NrLXRvdWNoe2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuaXMtYmxvY2stZGVza3RvcHtkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCkgYW5kIChtYXgtd2lkdGg6IDExOTFweCl7LmlzLWJsb2NrLWRlc2t0b3Atb25seXtkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWJsb2NrLXdpZGVzY3JlZW57ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX0uaXMtZmxleHtkaXNwbGF5OmZsZXh9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1mbGV4LW1vYmlsZXtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5pcy1mbGV4LXRhYmxldHtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWZsZXgtdGFibGV0LW9ubHl7ZGlzcGxheTpmbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtZmxleC10b3VjaHtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuaXMtZmxleC1kZXNrdG9we2Rpc3BsYXk6ZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpIGFuZCAobWF4LXdpZHRoOiAxMTkxcHgpey5pcy1mbGV4LWRlc2t0b3Atb25seXtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtZmxleC13aWRlc2NyZWVue2Rpc3BsYXk6ZmxleCAhaW1wb3J0YW50fX0uaXMtaW5saW5le2Rpc3BsYXk6aW5saW5lfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtaW5saW5lLW1vYmlsZXtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmlzLWlubGluZS10YWJsZXR7ZGlzcGxheTppbmxpbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWlubGluZS10YWJsZXQtb25seXtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWlubGluZS10b3VjaHtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5pcy1pbmxpbmUtZGVza3RvcHtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpIGFuZCAobWF4LXdpZHRoOiAxMTkxcHgpey5pcy1pbmxpbmUtZGVza3RvcC1vbmx5e2Rpc3BsYXk6aW5saW5lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWlubGluZS13aWRlc2NyZWVue2Rpc3BsYXk6aW5saW5lICFpbXBvcnRhbnR9fS5pcy1pbmxpbmUtYmxvY2t7ZGlzcGxheTppbmxpbmUtYmxvY2t9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1pbmxpbmUtYmxvY2stbW9iaWxle2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaXMtaW5saW5lLWJsb2NrLXRhYmxldHtkaXNwbGF5OmlubGluZS1ibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaW5saW5lLWJsb2NrLXRhYmxldC1vbmx5e2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaW5saW5lLWJsb2NrLXRvdWNoe2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmlzLWlubGluZS1ibG9jay1kZXNrdG9we2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCkgYW5kIChtYXgtd2lkdGg6IDExOTFweCl7LmlzLWlubGluZS1ibG9jay1kZXNrdG9wLW9ubHl7ZGlzcGxheTppbmxpbmUtYmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtaW5saW5lLWJsb2NrLXdpZGVzY3JlZW57ZGlzcGxheTppbmxpbmUtYmxvY2sgIWltcG9ydGFudH19LmlzLWlubGluZS1mbGV4e2Rpc3BsYXk6aW5saW5lLWZsZXh9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1pbmxpbmUtZmxleC1tb2JpbGV7ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmlzLWlubGluZS1mbGV4LXRhYmxldHtkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1pbmxpbmUtZmxleC10YWJsZXQtb25seXtkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaW5saW5lLWZsZXgtdG91Y2h7ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5pcy1pbmxpbmUtZmxleC1kZXNrdG9we2Rpc3BsYXk6aW5saW5lLWZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KSBhbmQgKG1heC13aWR0aDogMTE5MXB4KXsuaXMtaW5saW5lLWZsZXgtZGVza3RvcC1vbmx5e2Rpc3BsYXk6aW5saW5lLWZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtaW5saW5lLWZsZXgtd2lkZXNjcmVlbntkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fS5pcy1jbGVhcmZpeDphZnRlcntjbGVhcjpib3RoO2NvbnRlbnQ6XFxcIiBcXFwiO2Rpc3BsYXk6dGFibGV9LmlzLXB1bGxlZC1sZWZ0e2Zsb2F0OmxlZnR9LmlzLXB1bGxlZC1yaWdodHtmbG9hdDpyaWdodH0uaXMtY2xpcHBlZHtvdmVyZmxvdzpoaWRkZW4gIWltcG9ydGFudH0uaXMtb3ZlcmxheXtib3R0b206MDtsZWZ0OjA7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDt0b3A6MH0uaGFzLXRleHQtY2VudGVyZWR7dGV4dC1hbGlnbjpjZW50ZXJ9Lmhhcy10ZXh0LWxlZnR7dGV4dC1hbGlnbjpsZWZ0fS5oYXMtdGV4dC1yaWdodHt0ZXh0LWFsaWduOnJpZ2h0fS5pcy1oaWRkZW57ZGlzcGxheTpub25lICFpbXBvcnRhbnR9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1oaWRkZW4tbW9iaWxle2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmlzLWhpZGRlbi10YWJsZXR7ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1oaWRkZW4tdGFibGV0LW9ubHl7ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaGlkZGVuLXRvdWNoe2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5pcy1oaWRkZW4tZGVza3RvcHtkaXNwbGF5Om5vbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KSBhbmQgKG1heC13aWR0aDogMTE5MXB4KXsuaXMtaGlkZGVuLWRlc2t0b3Atb25seXtkaXNwbGF5Om5vbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtaGlkZGVuLXdpZGVzY3JlZW57ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fS5pcy1kaXNhYmxlZHtwb2ludGVyLWV2ZW50czpub25lfS5pcy1tYXJnaW5sZXNze21hcmdpbjowICFpbXBvcnRhbnR9LmlzLXBhZGRpbmdsZXNze3BhZGRpbmc6MCAhaW1wb3J0YW50fS5pcy11bnNlbGVjdGFibGV7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lfS5ib3h7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1yYWRpdXM6NXB4O2JveC1zaGFkb3c6MCAycHggM3B4IHJnYmEoMTAsMTAsMTAsMC4xKSwwIDAgMCAxcHggcmdiYSgxMCwxMCwxMCwwLjEpO2Rpc3BsYXk6YmxvY2s7cGFkZGluZzoxLjI1cmVtfS5ib3g6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX1hLmJveDpob3ZlcixhLmJveDpmb2N1c3tib3gtc2hhZG93OjAgMnB4IDNweCByZ2JhKDEwLDEwLDEwLDAuMSksMCAwIDAgMXB4ICMxODJiNzN9YS5ib3g6YWN0aXZle2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKSwwIDAgMCAxcHggIzE4MmI3M30uYnV0dG9uey1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjNweDtib3gtc2hhZG93Om5vbmU7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MXJlbTtoZWlnaHQ6Mi4yODVlbTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3A7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lO2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7Y29sb3I6IzM2MzYzNjtjdXJzb3I6cG9pbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW07dGV4dC1hbGlnbjpjZW50ZXI7d2hpdGUtc3BhY2U6bm93cmFwfS5idXR0b246Zm9jdXMsLmJ1dHRvbi5pcy1mb2N1c2VkLC5idXR0b246YWN0aXZlLC5idXR0b24uaXMtYWN0aXZle291dGxpbmU6bm9uZX0uYnV0dG9uW2Rpc2FibGVkXSwuYnV0dG9uLmlzLWRpc2FibGVke3BvaW50ZXItZXZlbnRzOm5vbmV9LmJ1dHRvbiBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uYnV0dG9uIC5pY29uOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS4yNXJlbTttYXJnaW4tcmlnaHQ6LjVyZW19LmJ1dHRvbiAuaWNvbjpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi41cmVtO21hcmdpbi1yaWdodDotLjI1cmVtfS5idXR0b24gLmljb246Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS4yNXJlbSl9LmJ1dHRvbiAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0OjByZW19LmJ1dHRvbiAuaWNvbi5pcy1zbWFsbDpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDowcmVtfS5idXR0b24gLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAwcmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgMHJlbSl9LmJ1dHRvbiAuaWNvbi5pcy1tZWRpdW06Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjVyZW19LmJ1dHRvbiAuaWNvbi5pcy1tZWRpdW06bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS41cmVtfS5idXR0b24gLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS41cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS41cmVtKX0uYnV0dG9uIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LTFyZW19LmJ1dHRvbiAuaWNvbi5pcy1sYXJnZTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotMXJlbX0uYnV0dG9uIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLTFyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtMXJlbSl9LmJ1dHRvbjpob3ZlciwuYnV0dG9uLmlzLWhvdmVyZWR7Ym9yZGVyLWNvbG9yOiNiNWI1YjU7Y29sb3I6IzM2MzYzNn0uYnV0dG9uOmZvY3VzLC5idXR0b24uaXMtZm9jdXNlZHtib3JkZXItY29sb3I6IzE4MmI3Mztib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDI0LDQzLDExNSwwLjI1KTtjb2xvcjojMzYzNjM2fS5idXR0b246YWN0aXZlLC5idXR0b24uaXMtYWN0aXZle2JvcmRlci1jb2xvcjojNGE0YTRhO2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlua3tiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojNGE0YTRhO3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmV9LmJ1dHRvbi5pcy1saW5rOmhvdmVyLC5idXR0b24uaXMtbGluay5pcy1ob3ZlcmVkLC5idXR0b24uaXMtbGluazpmb2N1cywuYnV0dG9uLmlzLWxpbmsuaXMtZm9jdXNlZCwuYnV0dG9uLmlzLWxpbms6YWN0aXZlLC5idXR0b24uaXMtbGluay5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy13aGl0ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy13aGl0ZTpob3ZlciwuYnV0dG9uLmlzLXdoaXRlLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojZjlmOWY5O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGU6Zm9jdXMsLmJ1dHRvbi5pcy13aGl0ZS5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDI1NSwyNTUsMjU1LDAuMjUpO2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy13aGl0ZTphY3RpdmUsLmJ1dHRvbi5pcy13aGl0ZS5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojZjJmMmYyO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLXdoaXRlLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojMDAwfS5idXR0b24uaXMtd2hpdGUuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgIzBhMGEwYSAjMGEwYTBhICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy13aGl0ZS5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy13aGl0ZS5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXdoaXRlLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6IzBhMGEwYTtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNre2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNrOmhvdmVyLC5idXR0b24uaXMtYmxhY2suaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiMwNDA0MDQ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjazpmb2N1cywuYnV0dG9uLmlzLWJsYWNrLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMTAsMTAsMTAsMC4yNSk7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNrOmFjdGl2ZSwuYnV0dG9uLmlzLWJsYWNrLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMwMDA7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojZmZmfS5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1ibGFjay5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZmZmICNmZmYgIWltcG9ydGFudH0uYnV0dG9uLmlzLWJsYWNrLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMwYTBhMGE7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLWJsYWNrLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtYmxhY2suaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2JvcmRlci1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtbGlnaHR7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlnaHQ6aG92ZXIsLmJ1dHRvbi5pcy1saWdodC5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6I2VlZTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0OmZvY3VzLC5idXR0b24uaXMtbGlnaHQuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgyNDUsMjQ1LDI0NSwwLjI1KTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlnaHQ6YWN0aXZlLC5idXR0b24uaXMtbGlnaHQuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6I2U4ZThlODtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6IzI5MjkyOX0uYnV0dG9uLmlzLWxpZ2h0LmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICMzNjM2MzYgIzM2MzYzNiAhaW1wb3J0YW50fS5idXR0b24uaXMtbGlnaHQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2Y1ZjVmNTtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtbGlnaHQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1saWdodC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMzNjM2MzY7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1kYXJre2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcms6aG92ZXIsLmJ1dHRvbi5pcy1kYXJrLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojMmYyZjJmO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFyazpmb2N1cywuYnV0dG9uLmlzLWRhcmsuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSg1NCw1NCw1NCwwLjI1KTtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFyazphY3RpdmUsLmJ1dHRvbi5pcy1kYXJrLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMyOTI5Mjk7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZThlOGU4fS5idXR0b24uaXMtZGFyay5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZjVmNWY1ICNmNWY1ZjUgIWltcG9ydGFudH0uYnV0dG9uLmlzLWRhcmsuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6IzM2MzYzNjtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtZGFyay5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWRhcmsuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2JvcmRlci1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtcHJpbWFyeXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5OmhvdmVyLC5idXR0b24uaXMtcHJpbWFyeS5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6IzE2Mjc2ODtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXByaW1hcnk6Zm9jdXMsLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMjQsNDMsMTE1LDAuMjUpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5OmFjdGl2ZSwuYnV0dG9uLmlzLXByaW1hcnkuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6IzE0MjM1ZTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMTgyYjczfS5idXR0b24uaXMtcHJpbWFyeS5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50fS5idXR0b24uaXMtcHJpbWFyeS5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMTgyYjczO2NvbG9yOiMxODJiNzN9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtcHJpbWFyeS5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Ym9yZGVyLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtcHJpbWFyeS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMxODJiNzN9LmJ1dHRvbi5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWluZm86aG92ZXIsLmJ1dHRvbi5pcy1pbmZvLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojMjc2Y2RhO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtaW5mbzpmb2N1cywuYnV0dG9uLmlzLWluZm8uaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSg1MCwxMTUsMjIwLDAuMjUpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1pbmZvOmFjdGl2ZSwuYnV0dG9uLmlzLWluZm8uaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6IzIzNjZkMTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMzI3M2RjfS5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1pbmZvLmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50fS5idXR0b24uaXMtaW5mby5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMzI3M2RjO2NvbG9yOiMzMjczZGN9LmJ1dHRvbi5pcy1pbmZvLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtaW5mby5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Ym9yZGVyLWNvbG9yOiMzMjczZGM7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMzMjczZGN9LmJ1dHRvbi5pcy1zdWNjZXNze2JhY2tncm91bmQtY29sb3I6IzIzZDE2MDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3M6aG92ZXIsLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojMjJjNjViO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtc3VjY2Vzczpmb2N1cywuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgzNSwyMDksOTYsMC4yNSk7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3M6YWN0aXZlLC5idXR0b24uaXMtc3VjY2Vzcy5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojMjBiYzU2O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMyM2QxNjB9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2YyZjJmMn0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZiAjZmZmICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMyM2QxNjA7Y29sb3I6IzIzZDE2MH0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6IzIzZDE2MDtib3JkZXItY29sb3I6IzIzZDE2MDtjb2xvcjojZmZmfS5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzIzZDE2MH0uYnV0dG9uLmlzLXdhcm5pbmd7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9LmJ1dHRvbi5pcy13YXJuaW5nOmhvdmVyLC5idXR0b24uaXMtd2FybmluZy5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6I2ZmZGI0YTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZzpmb2N1cywuYnV0dG9uLmlzLXdhcm5pbmcuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgyNTUsMjIxLDg3LDAuMjUpO2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmc6YWN0aXZlLC5idXR0b24uaXMtd2FybmluZy5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojZmZkODNkO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KTtjb2xvcjojZmZkZDU3fS5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmcuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgcmdiYSgwLDAsMCwwLjcpIHJnYmEoMCwwLDAsMC43KSAhaW1wb3J0YW50fS5idXR0b24uaXMtd2FybmluZy5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZkZDU3O2NvbG9yOiNmZmRkNTd9LmJ1dHRvbi5pcy13YXJuaW5nLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtd2FybmluZy5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTc7Ym9yZGVyLWNvbG9yOiNmZmRkNTc7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjpyZ2JhKDAsMCwwLDAuNyk7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLDAuNyk7Y29sb3I6I2ZmZGQ1N30uYnV0dG9uLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWRhbmdlcjpob3ZlciwuYnV0dG9uLmlzLWRhbmdlci5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6I2YyMDAwMDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWRhbmdlcjpmb2N1cywuYnV0dG9uLmlzLWRhbmdlci5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDI1NSwwLDAsMC4yNSk7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWRhbmdlcjphY3RpdmUsLmJ1dHRvbi5pcy1kYW5nZXIuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6I2U2MDAwMDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOnJlZH0uYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZiAjZmZmICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6cmVkO2NvbG9yOnJlZH0uYnV0dG9uLmlzLWRhbmdlci5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWRhbmdlci5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOnJlZDtib3JkZXItY29sb3I6cmVkO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjpyZWR9LmJ1dHRvbi5pcy1zbWFsbHtib3JkZXItcmFkaXVzOjJweDtmb250LXNpemU6Ljc1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb246Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjM3NXJlbTttYXJnaW4tcmlnaHQ6LjM3NXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LjM3NXJlbTttYXJnaW4tcmlnaHQ6LS4zNzVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbjpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uMzc1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS4zNzVyZW0pfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjEyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLXNtYWxsOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uMTI1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjEyNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMTI1cmVtKX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uNjI1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtbWVkaXVtOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uNjI1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS42MjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjYyNXJlbSl9LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0xLjEyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLWxhcmdlOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0xLjEyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLTEuMTI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLTEuMTI1cmVtKX0uYnV0dG9uLmlzLW1lZGl1bXtmb250LXNpemU6MS4yNXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbjpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uMTI1cmVtO21hcmdpbi1yaWdodDouNjI1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LjYyNXJlbTttYXJnaW4tcmlnaHQ6LS4xMjVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb246Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjEyNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMTI1cmVtKX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi4xMjVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtc21hbGw6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LjEyNXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC4xMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAuMTI1cmVtKX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1tZWRpdW06Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjM3NXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1tZWRpdW06bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS4zNzVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS4zNzVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjM3NXJlbSl9LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjg3NXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1sYXJnZTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotLjg3NXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uODc1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS44NzVyZW0pfS5idXR0b24uaXMtbGFyZ2V7Zm9udC1zaXplOjEuNXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6MHJlbTttYXJnaW4tcmlnaHQ6Ljc1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb246bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tbGVmdDouNzVyZW07bWFyZ2luLXJpZ2h0OjByZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbjpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIDByZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAwcmVtKX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LjI1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtc21hbGw6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LjI1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAuMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAuMjVyZW0pfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS4yNXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLW1lZGl1bTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotLjI1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS4yNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMjVyZW0pfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjc1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbGFyZ2U6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS43NXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS43NXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uNzVyZW0pfS5idXR0b25bZGlzYWJsZWRdLC5idXR0b24uaXMtZGlzYWJsZWR7b3BhY2l0eTowLjV9LmJ1dHRvbi5pcy1mdWxsd2lkdGh7ZGlzcGxheTpmbGV4O3dpZHRoOjEwMCV9LmJ1dHRvbi5pcy1sb2FkaW5ne2NvbG9yOnRyYW5zcGFyZW50ICFpbXBvcnRhbnQ7cG9pbnRlci1ldmVudHM6bm9uZX0uYnV0dG9uLmlzLWxvYWRpbmc6YWZ0ZXJ7YW5pbWF0aW9uOnNwaW5Bcm91bmQgNTAwbXMgaW5maW5pdGUgbGluZWFyO2JvcmRlcjoycHggc29saWQgI2RiZGJkYjtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2JvcmRlci1yaWdodC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItdG9wLWNvbG9yOnRyYW5zcGFyZW50O2NvbnRlbnQ6XFxcIlxcXCI7ZGlzcGxheTpibG9jaztoZWlnaHQ6MXJlbTtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoxcmVtO2xlZnQ6NTAlO21hcmdpbi1sZWZ0Oi04cHg7bWFyZ2luLXRvcDotOHB4O3Bvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7cG9zaXRpb246YWJzb2x1dGUgIWltcG9ydGFudH0uY29udGVudHtjb2xvcjojNGE0YTRhfS5jb250ZW50Om5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LmNvbnRlbnQgbGkrbGl7bWFyZ2luLXRvcDowLjI1ZW19LmNvbnRlbnQgcDpub3QoOmxhc3QtY2hpbGQpLC5jb250ZW50IG9sOm5vdCg6bGFzdC1jaGlsZCksLmNvbnRlbnQgdWw6bm90KDpsYXN0LWNoaWxkKSwuY29udGVudCBibG9ja3F1b3RlOm5vdCg6bGFzdC1jaGlsZCksLmNvbnRlbnQgdGFibGU6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjFlbX0uY29udGVudCBoMSwuY29udGVudCBoMiwuY29udGVudCBoMywuY29udGVudCBoNCwuY29udGVudCBoNSwuY29udGVudCBoNntjb2xvcjojMzYzNjM2O2ZvbnQtd2VpZ2h0OjQwMDtsaW5lLWhlaWdodDoxLjEyNX0uY29udGVudCBoMXtmb250LXNpemU6MmVtO21hcmdpbi1ib3R0b206MC41ZW19LmNvbnRlbnQgaDE6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXRvcDoxZW19LmNvbnRlbnQgaDJ7Zm9udC1zaXplOjEuNzVlbTttYXJnaW4tYm90dG9tOjAuNTcxNGVtfS5jb250ZW50IGgyOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi10b3A6MS4xNDI4ZW19LmNvbnRlbnQgaDN7Zm9udC1zaXplOjEuNWVtO21hcmdpbi1ib3R0b206MC42NjY2ZW19LmNvbnRlbnQgaDM6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXRvcDoxLjMzMzNlbX0uY29udGVudCBoNHtmb250LXNpemU6MS4yNWVtO21hcmdpbi1ib3R0b206MC44ZW19LmNvbnRlbnQgaDV7Zm9udC1zaXplOjEuMTI1ZW07bWFyZ2luLWJvdHRvbTowLjg4ODhlbX0uY29udGVudCBoNntmb250LXNpemU6MWVtO21hcmdpbi1ib3R0b206MWVtfS5jb250ZW50IGJsb2NrcXVvdGV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1sZWZ0OjVweCBzb2xpZCAjZGJkYmRiO3BhZGRpbmc6MS4yNWVtIDEuNWVtfS5jb250ZW50IG9se2xpc3Qtc3R5bGU6ZGVjaW1hbCBvdXRzaWRlO21hcmdpbi1sZWZ0OjJlbTttYXJnaW4tcmlnaHQ6MmVtO21hcmdpbi10b3A6MWVtfS5jb250ZW50IHVse2xpc3Qtc3R5bGU6ZGlzYyBvdXRzaWRlO21hcmdpbi1sZWZ0OjJlbTttYXJnaW4tcmlnaHQ6MmVtO21hcmdpbi10b3A6MWVtfS5jb250ZW50IHVsIHVse2xpc3Qtc3R5bGUtdHlwZTpjaXJjbGU7bWFyZ2luLXRvcDowLjVlbX0uY29udGVudCB1bCB1bCB1bHtsaXN0LXN0eWxlLXR5cGU6c3F1YXJlfS5jb250ZW50IHRhYmxle3dpZHRoOjEwMCV9LmNvbnRlbnQgdGFibGUgdGQsLmNvbnRlbnQgdGFibGUgdGh7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci13aWR0aDowIDAgMXB4O3BhZGRpbmc6MC41ZW0gMC43NWVtO3ZlcnRpY2FsLWFsaWduOnRvcH0uY29udGVudCB0YWJsZSB0aHtjb2xvcjojMzYzNjM2O3RleHQtYWxpZ246bGVmdH0uY29udGVudCB0YWJsZSB0cjpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9LmNvbnRlbnQgdGFibGUgdGhlYWQgdGQsLmNvbnRlbnQgdGFibGUgdGhlYWQgdGh7Ym9yZGVyLXdpZHRoOjAgMCAycHg7Y29sb3I6IzM2MzYzNn0uY29udGVudCB0YWJsZSB0Zm9vdCB0ZCwuY29udGVudCB0YWJsZSB0Zm9vdCB0aHtib3JkZXItd2lkdGg6MnB4IDAgMDtjb2xvcjojMzYzNjM2fS5jb250ZW50IHRhYmxlIHRib2R5IHRyOmxhc3QtY2hpbGQgdGQsLmNvbnRlbnQgdGFibGUgdGJvZHkgdHI6bGFzdC1jaGlsZCB0aHtib3JkZXItYm90dG9tLXdpZHRoOjB9LmNvbnRlbnQuaXMtc21hbGx7Zm9udC1zaXplOi43NXJlbX0uY29udGVudC5pcy1tZWRpdW17Zm9udC1zaXplOjEuMjVyZW19LmNvbnRlbnQuaXMtbGFyZ2V7Zm9udC1zaXplOjEuNXJlbX0uaW5wdXQsLnRleHRhcmVhey1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjNweDtib3gtc2hhZG93Om5vbmU7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MXJlbTtoZWlnaHQ6Mi4yODVlbTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3A7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtjb2xvcjojMzYzNjM2O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4xKTttYXgtd2lkdGg6MTAwJTt3aWR0aDoxMDAlfS5pbnB1dDpmb2N1cywuaW5wdXQuaXMtZm9jdXNlZCwuaW5wdXQ6YWN0aXZlLC5pbnB1dC5pcy1hY3RpdmUsLnRleHRhcmVhOmZvY3VzLC50ZXh0YXJlYS5pcy1mb2N1c2VkLC50ZXh0YXJlYTphY3RpdmUsLnRleHRhcmVhLmlzLWFjdGl2ZXtvdXRsaW5lOm5vbmV9LmlucHV0W2Rpc2FibGVkXSwuaW5wdXQuaXMtZGlzYWJsZWQsLnRleHRhcmVhW2Rpc2FibGVkXSwudGV4dGFyZWEuaXMtZGlzYWJsZWR7cG9pbnRlci1ldmVudHM6bm9uZX0uaW5wdXQ6aG92ZXIsLmlucHV0LmlzLWhvdmVyZWQsLnRleHRhcmVhOmhvdmVyLC50ZXh0YXJlYS5pcy1ob3ZlcmVke2JvcmRlci1jb2xvcjojYjViNWI1fS5pbnB1dDpmb2N1cywuaW5wdXQuaXMtZm9jdXNlZCwuaW5wdXQ6YWN0aXZlLC5pbnB1dC5pcy1hY3RpdmUsLnRleHRhcmVhOmZvY3VzLC50ZXh0YXJlYS5pcy1mb2N1c2VkLC50ZXh0YXJlYTphY3RpdmUsLnRleHRhcmVhLmlzLWFjdGl2ZXtib3JkZXItY29sb3I6IzE4MmI3M30uaW5wdXRbZGlzYWJsZWRdLC5pbnB1dC5pcy1kaXNhYmxlZCwudGV4dGFyZWFbZGlzYWJsZWRdLC50ZXh0YXJlYS5pcy1kaXNhYmxlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Ym94LXNoYWRvdzpub25lO2NvbG9yOiM3YTdhN2F9LmlucHV0W2Rpc2FibGVkXTo6LW1vei1wbGFjZWhvbGRlciwuaW5wdXQuaXMtZGlzYWJsZWQ6Oi1tb3otcGxhY2Vob2xkZXIsLnRleHRhcmVhW2Rpc2FibGVkXTo6LW1vei1wbGFjZWhvbGRlciwudGV4dGFyZWEuaXMtZGlzYWJsZWQ6Oi1tb3otcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5pbnB1dFtkaXNhYmxlZF06Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIsLmlucHV0LmlzLWRpc2FibGVkOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyLC50ZXh0YXJlYVtkaXNhYmxlZF06Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIsLnRleHRhcmVhLmlzLWRpc2FibGVkOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uaW5wdXRbZGlzYWJsZWRdOi1tb3otcGxhY2Vob2xkZXIsLmlucHV0LmlzLWRpc2FibGVkOi1tb3otcGxhY2Vob2xkZXIsLnRleHRhcmVhW2Rpc2FibGVkXTotbW96LXBsYWNlaG9sZGVyLC50ZXh0YXJlYS5pcy1kaXNhYmxlZDotbW96LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uaW5wdXRbZGlzYWJsZWRdOi1tcy1pbnB1dC1wbGFjZWhvbGRlciwuaW5wdXQuaXMtZGlzYWJsZWQ6LW1zLWlucHV0LXBsYWNlaG9sZGVyLC50ZXh0YXJlYVtkaXNhYmxlZF06LW1zLWlucHV0LXBsYWNlaG9sZGVyLC50ZXh0YXJlYS5pcy1kaXNhYmxlZDotbXMtaW5wdXQtcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5pbnB1dFt0eXBlPVxcXCJzZWFyY2hcXFwiXSwudGV4dGFyZWFbdHlwZT1cXFwic2VhcmNoXFxcIl17Ym9yZGVyLXJhZGl1czoyOTA0ODZweH0uaW5wdXQuaXMtd2hpdGUsLnRleHRhcmVhLmlzLXdoaXRle2JvcmRlci1jb2xvcjojZmZmfS5pbnB1dC5pcy1ibGFjaywudGV4dGFyZWEuaXMtYmxhY2t7Ym9yZGVyLWNvbG9yOiMwYTBhMGF9LmlucHV0LmlzLWxpZ2h0LC50ZXh0YXJlYS5pcy1saWdodHtib3JkZXItY29sb3I6I2Y1ZjVmNX0uaW5wdXQuaXMtZGFyaywudGV4dGFyZWEuaXMtZGFya3tib3JkZXItY29sb3I6IzM2MzYzNn0uaW5wdXQuaXMtcHJpbWFyeSwudGV4dGFyZWEuaXMtcHJpbWFyeXtib3JkZXItY29sb3I6IzE4MmI3M30uaW5wdXQuaXMtaW5mbywudGV4dGFyZWEuaXMtaW5mb3tib3JkZXItY29sb3I6IzMyNzNkY30uaW5wdXQuaXMtc3VjY2VzcywudGV4dGFyZWEuaXMtc3VjY2Vzc3tib3JkZXItY29sb3I6IzIzZDE2MH0uaW5wdXQuaXMtd2FybmluZywudGV4dGFyZWEuaXMtd2FybmluZ3tib3JkZXItY29sb3I6I2ZmZGQ1N30uaW5wdXQuaXMtZGFuZ2VyLC50ZXh0YXJlYS5pcy1kYW5nZXJ7Ym9yZGVyLWNvbG9yOnJlZH0uaW5wdXQuaXMtc21hbGwsLnRleHRhcmVhLmlzLXNtYWxse2JvcmRlci1yYWRpdXM6MnB4O2ZvbnQtc2l6ZTouNzVyZW19LmlucHV0LmlzLW1lZGl1bSwudGV4dGFyZWEuaXMtbWVkaXVte2ZvbnQtc2l6ZToxLjI1cmVtfS5pbnB1dC5pcy1sYXJnZSwudGV4dGFyZWEuaXMtbGFyZ2V7Zm9udC1zaXplOjEuNXJlbX0uaW5wdXQuaXMtZnVsbHdpZHRoLC50ZXh0YXJlYS5pcy1mdWxsd2lkdGh7ZGlzcGxheTpibG9jazt3aWR0aDoxMDAlfS5pbnB1dC5pcy1pbmxpbmUsLnRleHRhcmVhLmlzLWlubGluZXtkaXNwbGF5OmlubGluZTt3aWR0aDphdXRvfS50ZXh0YXJlYXtkaXNwbGF5OmJsb2NrO2xpbmUtaGVpZ2h0OjEuMjU7bWF4LWhlaWdodDo2MDBweDttYXgtd2lkdGg6MTAwJTttaW4taGVpZ2h0OjEyMHB4O21pbi13aWR0aDoxMDAlO3BhZGRpbmc6MTBweDtyZXNpemU6dmVydGljYWx9LmNoZWNrYm94LC5yYWRpb3thbGlnbi1pdGVtczpjZW50ZXI7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTppbmxpbmUtZmxleDtmbGV4LXdyYXA6d3JhcDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3B9LmNoZWNrYm94IGlucHV0LC5yYWRpbyBpbnB1dHtjdXJzb3I6cG9pbnRlcjttYXJnaW4tcmlnaHQ6MC41ZW19LmNoZWNrYm94OmhvdmVyLC5yYWRpbzpob3Zlcntjb2xvcjojMzYzNjM2fS5jaGVja2JveC5pcy1kaXNhYmxlZCwucmFkaW8uaXMtZGlzYWJsZWR7Y29sb3I6IzdhN2E3YTtwb2ludGVyLWV2ZW50czpub25lfS5jaGVja2JveC5pcy1kaXNhYmxlZCBpbnB1dCwucmFkaW8uaXMtZGlzYWJsZWQgaW5wdXR7cG9pbnRlci1ldmVudHM6bm9uZX0ucmFkaW8rLnJhZGlve21hcmdpbi1sZWZ0OjAuNWVtfS5zZWxlY3R7ZGlzcGxheTppbmxpbmUtYmxvY2s7aGVpZ2h0OjIuNWVtO3Bvc2l0aW9uOnJlbGF0aXZlO3ZlcnRpY2FsLWFsaWduOnRvcH0uc2VsZWN0OmFmdGVye2JvcmRlcjoxcHggc29saWQgIzE4MmI3Mztib3JkZXItcmlnaHQ6MDtib3JkZXItdG9wOjA7Y29udGVudDpcXFwiIFxcXCI7ZGlzcGxheTpibG9jaztoZWlnaHQ6MC41ZW07cG9pbnRlci1ldmVudHM6bm9uZTtwb3NpdGlvbjphYnNvbHV0ZTt0cmFuc2Zvcm06cm90YXRlKC00NWRlZyk7d2lkdGg6MC41ZW07bWFyZ2luLXRvcDotMC4zNzVlbTtyaWdodDoxLjEyNWVtO3RvcDo1MCU7ei1pbmRleDo0fS5zZWxlY3Qgc2VsZWN0ey1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjNweDtib3gtc2hhZG93Om5vbmU7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MXJlbTtoZWlnaHQ6Mi4yODVlbTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3A7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtjb2xvcjojMzYzNjM2O2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6YmxvY2s7Zm9udC1zaXplOjFlbTtvdXRsaW5lOm5vbmU7cGFkZGluZy1yaWdodDoyLjVlbX0uc2VsZWN0IHNlbGVjdDpmb2N1cywuc2VsZWN0IHNlbGVjdC5pcy1mb2N1c2VkLC5zZWxlY3Qgc2VsZWN0OmFjdGl2ZSwuc2VsZWN0IHNlbGVjdC5pcy1hY3RpdmV7b3V0bGluZTpub25lfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXSwuc2VsZWN0IHNlbGVjdC5pcy1kaXNhYmxlZHtwb2ludGVyLWV2ZW50czpub25lfS5zZWxlY3Qgc2VsZWN0OmhvdmVyLC5zZWxlY3Qgc2VsZWN0LmlzLWhvdmVyZWR7Ym9yZGVyLWNvbG9yOiNiNWI1YjV9LnNlbGVjdCBzZWxlY3Q6Zm9jdXMsLnNlbGVjdCBzZWxlY3QuaXMtZm9jdXNlZCwuc2VsZWN0IHNlbGVjdDphY3RpdmUsLnNlbGVjdCBzZWxlY3QuaXMtYWN0aXZle2JvcmRlci1jb2xvcjojMTgyYjczfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXSwuc2VsZWN0IHNlbGVjdC5pcy1kaXNhYmxlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Ym94LXNoYWRvdzpub25lO2NvbG9yOiM3YTdhN2F9LnNlbGVjdCBzZWxlY3RbZGlzYWJsZWRdOjotbW96LXBsYWNlaG9sZGVyLC5zZWxlY3Qgc2VsZWN0LmlzLWRpc2FibGVkOjotbW96LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF06Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIsLnNlbGVjdCBzZWxlY3QuaXMtZGlzYWJsZWQ6Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXTotbW96LXBsYWNlaG9sZGVyLC5zZWxlY3Qgc2VsZWN0LmlzLWRpc2FibGVkOi1tb3otcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXTotbXMtaW5wdXQtcGxhY2Vob2xkZXIsLnNlbGVjdCBzZWxlY3QuaXMtZGlzYWJsZWQ6LW1zLWlucHV0LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uc2VsZWN0IHNlbGVjdDpob3Zlcntib3JkZXItY29sb3I6I2I1YjViNX0uc2VsZWN0IHNlbGVjdDo6bXMtZXhwYW5ke2Rpc3BsYXk6bm9uZX0uc2VsZWN0OmhvdmVyOmFmdGVye2JvcmRlci1jb2xvcjojMzYzNjM2fS5zZWxlY3QuaXMtc21hbGx7Ym9yZGVyLXJhZGl1czoycHg7Zm9udC1zaXplOi43NXJlbX0uc2VsZWN0LmlzLW1lZGl1bXtmb250LXNpemU6MS4yNXJlbX0uc2VsZWN0LmlzLWxhcmdle2ZvbnQtc2l6ZToxLjVyZW19LnNlbGVjdC5pcy1mdWxsd2lkdGh7d2lkdGg6MTAwJX0uc2VsZWN0LmlzLWZ1bGx3aWR0aCBzZWxlY3R7d2lkdGg6MTAwJX0ubGFiZWx7Y29sb3I6IzM2MzYzNjtkaXNwbGF5OmJsb2NrO2ZvbnQtd2VpZ2h0OmJvbGR9LmxhYmVsOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjVlbX0uaGVscHtkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZTouNzVyZW07bWFyZ2luLXRvcDo1cHh9LmhlbHAuaXMtd2hpdGV7Y29sb3I6I2ZmZn0uaGVscC5pcy1ibGFja3tjb2xvcjojMGEwYTBhfS5oZWxwLmlzLWxpZ2h0e2NvbG9yOiNmNWY1ZjV9LmhlbHAuaXMtZGFya3tjb2xvcjojMzYzNjM2fS5oZWxwLmlzLXByaW1hcnl7Y29sb3I6IzE4MmI3M30uaGVscC5pcy1pbmZve2NvbG9yOiMzMjczZGN9LmhlbHAuaXMtc3VjY2Vzc3tjb2xvcjojMjNkMTYwfS5oZWxwLmlzLXdhcm5pbmd7Y29sb3I6I2ZmZGQ1N30uaGVscC5pcy1kYW5nZXJ7Y29sb3I6cmVkfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuY29udHJvbC1sYWJlbHttYXJnaW4tYm90dG9tOjAuNWVtfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmNvbnRyb2wtbGFiZWx7ZmxleC1iYXNpczowO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjA7bWFyZ2luLXJpZ2h0OjEuNWVtO3BhZGRpbmctdG9wOjAuNWVtO3RleHQtYWxpZ246cmlnaHR9fS5jb250cm9se3Bvc2l0aW9uOnJlbGF0aXZlO3RleHQtYWxpZ246bGVmdH0uY29udHJvbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX0uY29udHJvbC5oYXMtYWRkb25ze2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydH0uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b24sLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0e2JvcmRlci1yYWRpdXM6MDttYXJnaW4tcmlnaHQ6LTFweDt3aWR0aDphdXRvfS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpob3ZlciwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDpob3ZlciwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6aG92ZXJ7ei1pbmRleDoyfS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpmb2N1cywuY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246YWN0aXZlLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0OmZvY3VzLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0OmFjdGl2ZSwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6Zm9jdXMsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0OmFjdGl2ZXt6LWluZGV4OjN9LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uOmZpcnN0LWNoaWxkLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0OmZpcnN0LWNoaWxkLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpmaXJzdC1jaGlsZHtib3JkZXItcmFkaXVzOjNweCAwIDAgM3B4fS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpmaXJzdC1jaGlsZCBzZWxlY3QsLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQ6Zmlyc3QtY2hpbGQgc2VsZWN0LC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpmaXJzdC1jaGlsZCBzZWxlY3R7Ym9yZGVyLXJhZGl1czozcHggMCAwIDNweH0uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246bGFzdC1jaGlsZCwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDpsYXN0LWNoaWxkLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpsYXN0LWNoaWxke2JvcmRlci1yYWRpdXM6MCAzcHggM3B4IDB9LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uOmxhc3QtY2hpbGQgc2VsZWN0LC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0Omxhc3QtY2hpbGQgc2VsZWN0LC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpsYXN0LWNoaWxkIHNlbGVjdHtib3JkZXItcmFkaXVzOjAgM3B4IDNweCAwfS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbi5pcy1leHBhbmRlZCwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dC5pcy1leHBhbmRlZCwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3QuaXMtZXhwYW5kZWR7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0uY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Qgc2VsZWN0OmhvdmVye3otaW5kZXg6Mn0uY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Qgc2VsZWN0OmZvY3VzLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdCBzZWxlY3Q6YWN0aXZle3otaW5kZXg6M30uY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtY2VudGVyZWR7anVzdGlmeS1jb250ZW50OmNlbnRlcn0uY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtcmlnaHR7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfS5jb250cm9sLmhhcy1hZGRvbnMuaGFzLWFkZG9ucy1mdWxsd2lkdGggLmJ1dHRvbiwuY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtZnVsbHdpZHRoIC5pbnB1dCwuY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtZnVsbHdpZHRoIC5zZWxlY3R7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0uY29udHJvbC5oYXMtaWNvbiAuaWNvbntjb2xvcjojZGJkYmRiO3BvaW50ZXItZXZlbnRzOm5vbmU7cG9zaXRpb246YWJzb2x1dGU7dG9wOjEuMjVyZW07ei1pbmRleDo0fS5jb250cm9sLmhhcy1pY29uIC5pbnB1dDpmb2N1cysuaWNvbntjb2xvcjojN2E3YTdhfS5jb250cm9sLmhhcy1pY29uIC5pbnB1dC5pcy1zbWFsbCsuaWNvbnt0b3A6LjkzNzVyZW19LmNvbnRyb2wuaGFzLWljb24gLmlucHV0LmlzLW1lZGl1bSsuaWNvbnt0b3A6MS41NjI1cmVtfS5jb250cm9sLmhhcy1pY29uIC5pbnB1dC5pcy1sYXJnZSsuaWNvbnt0b3A6MS44NzVyZW19LmNvbnRyb2wuaGFzLWljb246bm90KC5oYXMtaWNvbi1yaWdodCkgLmljb257bGVmdDoxLjI1cmVtO3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSl9LmNvbnRyb2wuaGFzLWljb246bm90KC5oYXMtaWNvbi1yaWdodCkgLmlucHV0e3BhZGRpbmctbGVmdDoyLjVlbX0uY29udHJvbC5oYXMtaWNvbjpub3QoLmhhcy1pY29uLXJpZ2h0KSAuaW5wdXQuaXMtc21hbGwrLmljb257bGVmdDouOTM3NXJlbX0uY29udHJvbC5oYXMtaWNvbjpub3QoLmhhcy1pY29uLXJpZ2h0KSAuaW5wdXQuaXMtbWVkaXVtKy5pY29ue2xlZnQ6MS41NjI1cmVtfS5jb250cm9sLmhhcy1pY29uOm5vdCguaGFzLWljb24tcmlnaHQpIC5pbnB1dC5pcy1sYXJnZSsuaWNvbntsZWZ0OjEuODc1cmVtfS5jb250cm9sLmhhcy1pY29uLmhhcy1pY29uLXJpZ2h0IC5pY29ue3JpZ2h0OjEuMjVyZW07dHJhbnNmb3JtOnRyYW5zbGF0ZVgoNTAlKSB0cmFuc2xhdGVZKC01MCUpfS5jb250cm9sLmhhcy1pY29uLmhhcy1pY29uLXJpZ2h0IC5pbnB1dHtwYWRkaW5nLXJpZ2h0OjIuNWVtfS5jb250cm9sLmhhcy1pY29uLmhhcy1pY29uLXJpZ2h0IC5pbnB1dC5pcy1zbWFsbCsuaWNvbntyaWdodDouOTM3NXJlbX0uY29udHJvbC5oYXMtaWNvbi5oYXMtaWNvbi1yaWdodCAuaW5wdXQuaXMtbWVkaXVtKy5pY29ue3JpZ2h0OjEuNTYyNXJlbX0uY29udHJvbC5oYXMtaWNvbi5oYXMtaWNvbi1yaWdodCAuaW5wdXQuaXMtbGFyZ2UrLmljb257cmlnaHQ6MS44NzVyZW19LmNvbnRyb2wuaXMtZ3JvdXBlZHtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9LmNvbnRyb2wuaXMtZ3JvdXBlZD4uY29udHJvbHtmbGV4LWJhc2lzOjA7ZmxleC1zaHJpbms6MH0uY29udHJvbC5pcy1ncm91cGVkPi5jb250cm9sOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowO21hcmdpbi1yaWdodDowLjc1cmVtfS5jb250cm9sLmlzLWdyb3VwZWQ+LmNvbnRyb2wuaXMtZXhwYW5kZWR7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MX0uY29udHJvbC5pcy1ncm91cGVkLmlzLWdyb3VwZWQtY2VudGVyZWR7anVzdGlmeS1jb250ZW50OmNlbnRlcn0uY29udHJvbC5pcy1ncm91cGVkLmlzLWdyb3VwZWQtcmlnaHR7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuY29udHJvbC5pcy1ob3Jpem9udGFse2Rpc3BsYXk6ZmxleH0uY29udHJvbC5pcy1ob3Jpem9udGFsPi5jb250cm9se2Rpc3BsYXk6ZmxleDtmbGV4LWJhc2lzOjA7ZmxleC1ncm93OjU7ZmxleC1zaHJpbms6MX19LmNvbnRyb2wuaXMtbG9hZGluZzphZnRlcnthbmltYXRpb246c3BpbkFyb3VuZCA1MDBtcyBpbmZpbml0ZSBsaW5lYXI7Ym9yZGVyOjJweCBzb2xpZCAjZGJkYmRiO2JvcmRlci1yYWRpdXM6MjkwNDg2cHg7Ym9yZGVyLXJpZ2h0LWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci10b3AtY29sb3I6dHJhbnNwYXJlbnQ7Y29udGVudDpcXFwiXFxcIjtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcmVtO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjFyZW07cG9zaXRpb246YWJzb2x1dGUgIWltcG9ydGFudDtyaWdodDowLjc1ZW07dG9wOjAuNzVlbX0uaWNvbntkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MjFweDtoZWlnaHQ6MS41cmVtO2xpbmUtaGVpZ2h0OjEuNXJlbTt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6MS41cmVtfS5pY29uIC5mYXtmb250LXNpemU6aW5oZXJpdDtsaW5lLWhlaWdodDppbmhlcml0fS5pY29uLmlzLXNtYWxse2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZToxNHB4O2hlaWdodDoxcmVtO2xpbmUtaGVpZ2h0OjFyZW07dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjFyZW19Lmljb24uaXMtbWVkaXVte2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZToyOHB4O2hlaWdodDoycmVtO2xpbmUtaGVpZ2h0OjJyZW07dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjJyZW19Lmljb24uaXMtbGFyZ2V7ZGlzcGxheTppbmxpbmUtYmxvY2s7Zm9udC1zaXplOjQycHg7aGVpZ2h0OjNyZW07bGluZS1oZWlnaHQ6M3JlbTt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6M3JlbX0uaW1hZ2V7ZGlzcGxheTpibG9jaztwb3NpdGlvbjpyZWxhdGl2ZX0uaW1hZ2UgaW1ne2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OmF1dG87d2lkdGg6MTAwJX0uaW1hZ2UuaXMtc3F1YXJlIGltZywuaW1hZ2UuaXMtMWJ5MSBpbWcsLmltYWdlLmlzLTRieTMgaW1nLC5pbWFnZS5pcy0zYnkyIGltZywuaW1hZ2UuaXMtMTZieTkgaW1nLC5pbWFnZS5pcy0yYnkxIGltZ3tib3R0b206MDtsZWZ0OjA7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDt0b3A6MDtoZWlnaHQ6MTAwJTt3aWR0aDoxMDAlfS5pbWFnZS5pcy1zcXVhcmUsLmltYWdlLmlzLTFieTF7cGFkZGluZy10b3A6MTAwJX0uaW1hZ2UuaXMtNGJ5M3twYWRkaW5nLXRvcDo3NSV9LmltYWdlLmlzLTNieTJ7cGFkZGluZy10b3A6NjYuNjY2NiV9LmltYWdlLmlzLTE2Ynk5e3BhZGRpbmctdG9wOjU2LjI1JX0uaW1hZ2UuaXMtMmJ5MXtwYWRkaW5nLXRvcDo1MCV9LmltYWdlLmlzLTE2eDE2e2hlaWdodDoxNnB4O3dpZHRoOjE2cHh9LmltYWdlLmlzLTI0eDI0e2hlaWdodDoyNHB4O3dpZHRoOjI0cHh9LmltYWdlLmlzLTMyeDMye2hlaWdodDozMnB4O3dpZHRoOjMycHh9LmltYWdlLmlzLTQ4eDQ4e2hlaWdodDo0OHB4O3dpZHRoOjQ4cHh9LmltYWdlLmlzLTY0eDY0e2hlaWdodDo2NHB4O3dpZHRoOjY0cHh9LmltYWdlLmlzLTk2eDk2e2hlaWdodDo5NnB4O3dpZHRoOjk2cHh9LmltYWdlLmlzLTEyOHgxMjh7aGVpZ2h0OjEyOHB4O3dpZHRoOjEyOHB4fS5ub3RpZmljYXRpb257YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1yYWRpdXM6M3B4O3BhZGRpbmc6MS4yNXJlbSAyLjVyZW0gMS4yNXJlbSAxLjVyZW07cG9zaXRpb246cmVsYXRpdmV9Lm5vdGlmaWNhdGlvbjpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5ub3RpZmljYXRpb24gY29kZSwubm90aWZpY2F0aW9uIHByZXtiYWNrZ3JvdW5kOiNmZmZ9Lm5vdGlmaWNhdGlvbiBwcmUgY29kZXtiYWNrZ3JvdW5kOnRyYW5zcGFyZW50fS5ub3RpZmljYXRpb24gLmRlbGV0ZXtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowLjVlbTt0b3A6MC41ZW19Lm5vdGlmaWNhdGlvbiAudGl0bGUsLm5vdGlmaWNhdGlvbiAuc3VidGl0bGUsLm5vdGlmaWNhdGlvbiAuY29udGVudHtjb2xvcjppbmhlcml0fS5ub3RpZmljYXRpb24uaXMtd2hpdGV7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9Lm5vdGlmaWNhdGlvbi5pcy1ibGFja3tiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0ubm90aWZpY2F0aW9uLmlzLWxpZ2h0e2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5ub3RpZmljYXRpb24uaXMtZGFya3tiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0ubm90aWZpY2F0aW9uLmlzLXByaW1hcnl7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9Lm5vdGlmaWNhdGlvbi5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztjb2xvcjojZmZmfS5ub3RpZmljYXRpb24uaXMtc3VjY2Vzc3tiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Y29sb3I6I2ZmZn0ubm90aWZpY2F0aW9uLmlzLXdhcm5pbmd7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0ubm90aWZpY2F0aW9uLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtjb2xvcjojZmZmfS5wcm9ncmVzc3stbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjFyZW07b3ZlcmZsb3c6aGlkZGVuO3BhZGRpbmc6MDt3aWR0aDoxMDAlfS5wcm9ncmVzczpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5wcm9ncmVzczo6LXdlYmtpdC1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojZGJkYmRifS5wcm9ncmVzczo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiM0YTRhNGF9LnByb2dyZXNzOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiM0YTRhNGF9LnByb2dyZXNzLmlzLXdoaXRlOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6I2ZmZn0ucHJvZ3Jlc3MuaXMtd2hpdGU6Oi1tb3otcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6I2ZmZn0ucHJvZ3Jlc3MuaXMtYmxhY2s6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhfS5wcm9ncmVzcy5pcy1ibGFjazo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhfS5wcm9ncmVzcy5pcy1saWdodDo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9LnByb2dyZXNzLmlzLWxpZ2h0OjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9LnByb2dyZXNzLmlzLWRhcms6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2fS5wcm9ncmVzcy5pcy1kYXJrOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzZ9LnByb2dyZXNzLmlzLXByaW1hcnk6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczfS5wcm9ncmVzcy5pcy1wcmltYXJ5OjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzN9LnByb2dyZXNzLmlzLWluZm86Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjfS5wcm9ncmVzcy5pcy1pbmZvOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGN9LnByb2dyZXNzLmlzLXN1Y2Nlc3M6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwfS5wcm9ncmVzcy5pcy1zdWNjZXNzOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjB9LnByb2dyZXNzLmlzLXdhcm5pbmc6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3fS5wcm9ncmVzcy5pcy13YXJuaW5nOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTd9LnByb2dyZXNzLmlzLWRhbmdlcjo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOnJlZH0ucHJvZ3Jlc3MuaXMtZGFuZ2VyOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOnJlZH0ucHJvZ3Jlc3MuaXMtc21hbGx7aGVpZ2h0Oi43NXJlbX0ucHJvZ3Jlc3MuaXMtbWVkaXVte2hlaWdodDoxLjI1cmVtfS5wcm9ncmVzcy5pcy1sYXJnZXtoZWlnaHQ6MS41cmVtfS50YWJsZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzM2MzYzNjttYXJnaW4tYm90dG9tOjEuNXJlbTt3aWR0aDoxMDAlfS50YWJsZSB0ZCwudGFibGUgdGh7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci13aWR0aDowIDAgMXB4O3BhZGRpbmc6MC41ZW0gMC43NWVtO3ZlcnRpY2FsLWFsaWduOnRvcH0udGFibGUgdGQuaXMtbmFycm93LC50YWJsZSB0aC5pcy1uYXJyb3d7d2hpdGUtc3BhY2U6bm93cmFwO3dpZHRoOjElfS50YWJsZSB0aHtjb2xvcjojMzYzNjM2O3RleHQtYWxpZ246bGVmdH0udGFibGUgdHI6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmFmYWZhfS50YWJsZSB0aGVhZCB0ZCwudGFibGUgdGhlYWQgdGh7Ym9yZGVyLXdpZHRoOjAgMCAycHg7Y29sb3I6IzdhN2E3YX0udGFibGUgdGZvb3QgdGQsLnRhYmxlIHRmb290IHRoe2JvcmRlci13aWR0aDoycHggMCAwO2NvbG9yOiM3YTdhN2F9LnRhYmxlIHRib2R5IHRyOmxhc3QtY2hpbGQgdGQsLnRhYmxlIHRib2R5IHRyOmxhc3QtY2hpbGQgdGh7Ym9yZGVyLWJvdHRvbS13aWR0aDowfS50YWJsZS5pcy1ib3JkZXJlZCB0ZCwudGFibGUuaXMtYm9yZGVyZWQgdGh7Ym9yZGVyLXdpZHRoOjFweH0udGFibGUuaXMtYm9yZGVyZWQgdHI6bGFzdC1jaGlsZCB0ZCwudGFibGUuaXMtYm9yZGVyZWQgdHI6bGFzdC1jaGlsZCB0aHtib3JkZXItYm90dG9tLXdpZHRoOjFweH0udGFibGUuaXMtbmFycm93IHRkLC50YWJsZS5pcy1uYXJyb3cgdGh7cGFkZGluZzowLjI1ZW0gMC41ZW19LnRhYmxlLmlzLXN0cmlwZWQgdGJvZHkgdHI6bnRoLWNoaWxkKGV2ZW4pe2JhY2tncm91bmQtY29sb3I6I2ZhZmFmYX0udGFibGUuaXMtc3RyaXBlZCB0Ym9keSB0cjpudGgtY2hpbGQoZXZlbik6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS50YWd7YWxpZ24taXRlbXM6Y2VudGVyO2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2NvbG9yOiM0YTRhNGE7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6Ljc1cmVtO2hlaWdodDoyZW07anVzdGlmeS1jb250ZW50OmNlbnRlcjtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuODc1ZW07cGFkZGluZy1yaWdodDowLjg3NWVtO3ZlcnRpY2FsLWFsaWduOnRvcDt3aGl0ZS1zcGFjZTpub3dyYXB9LnRhZyAuZGVsZXRle21hcmdpbi1sZWZ0OjAuMjVlbTttYXJnaW4tcmlnaHQ6LTAuNWVtfS50YWcuaXMtd2hpdGV7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9LnRhZy5pcy1ibGFja3tiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0udGFnLmlzLWxpZ2h0e2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS50YWcuaXMtZGFya3tiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0udGFnLmlzLXByaW1hcnl7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9LnRhZy5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztjb2xvcjojZmZmfS50YWcuaXMtc3VjY2Vzc3tiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Y29sb3I6I2ZmZn0udGFnLmlzLXdhcm5pbmd7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0udGFnLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtjb2xvcjojZmZmfS50YWcuaXMtbWVkaXVte2ZvbnQtc2l6ZToxcmVtfS50YWcuaXMtbGFyZ2V7Zm9udC1zaXplOjEuMjVyZW19LnRpdGxlLC5zdWJ0aXRsZXt3b3JkLWJyZWFrOmJyZWFrLXdvcmR9LnRpdGxlOm5vdCg6bGFzdC1jaGlsZCksLnN1YnRpdGxlOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LnRpdGxlIGVtLC50aXRsZSBzcGFuLC5zdWJ0aXRsZSBlbSwuc3VidGl0bGUgc3Bhbntmb250LXdlaWdodDozMDB9LnRpdGxlIHN0cm9uZywuc3VidGl0bGUgc3Ryb25ne2ZvbnQtd2VpZ2h0OjUwMH0udGl0bGUgLnRhZywuc3VidGl0bGUgLnRhZ3t2ZXJ0aWNhbC1hbGlnbjptaWRkbGV9LnRpdGxle2NvbG9yOiMzNjM2MzY7Zm9udC1zaXplOjJyZW07Zm9udC13ZWlnaHQ6MzAwO2xpbmUtaGVpZ2h0OjEuMTI1fS50aXRsZSBzdHJvbmd7Y29sb3I6aW5oZXJpdH0udGl0bGUrLmhpZ2hsaWdodHttYXJnaW4tdG9wOi0wLjc1cmVtfS50aXRsZSsuc3VidGl0bGV7bWFyZ2luLXRvcDotMS4yNXJlbX0udGl0bGUuaXMtMXtmb250LXNpemU6My41cmVtfS50aXRsZS5pcy0ye2ZvbnQtc2l6ZToyLjc1cmVtfS50aXRsZS5pcy0ze2ZvbnQtc2l6ZToycmVtfS50aXRsZS5pcy00e2ZvbnQtc2l6ZToxLjVyZW19LnRpdGxlLmlzLTV7Zm9udC1zaXplOjEuMjVyZW19LnRpdGxlLmlzLTZ7Zm9udC1zaXplOjE0cHh9LnN1YnRpdGxle2NvbG9yOiM0YTRhNGE7Zm9udC1zaXplOjEuMjVyZW07Zm9udC13ZWlnaHQ6MzAwO2xpbmUtaGVpZ2h0OjEuMjV9LnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojMzYzNjM2fS5zdWJ0aXRsZSsudGl0bGV7bWFyZ2luLXRvcDotMS41cmVtfS5zdWJ0aXRsZS5pcy0xe2ZvbnQtc2l6ZTozLjVyZW19LnN1YnRpdGxlLmlzLTJ7Zm9udC1zaXplOjIuNzVyZW19LnN1YnRpdGxlLmlzLTN7Zm9udC1zaXplOjJyZW19LnN1YnRpdGxlLmlzLTR7Zm9udC1zaXplOjEuNXJlbX0uc3VidGl0bGUuaXMtNXtmb250LXNpemU6MS4yNXJlbX0uc3VidGl0bGUuaXMtNntmb250LXNpemU6MTRweH0uYmxvY2s6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0uY29udGFpbmVye3Bvc2l0aW9uOnJlbGF0aXZlfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmNvbnRhaW5lcnttYXJnaW46MCBhdXRvO21heC13aWR0aDo5NjBweH0uY29udGFpbmVyLmlzLWZsdWlke21hcmdpbjowIDIwcHg7bWF4LXdpZHRoOm5vbmV9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmNvbnRhaW5lcnttYXgtd2lkdGg6MTE1MnB4fX0uZGVsZXRley13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZTstbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4yKTtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZToxcmVtO2hlaWdodDoyMHB4O291dGxpbmU6bm9uZTtwb3NpdGlvbjpyZWxhdGl2ZTt0cmFuc2Zvcm06cm90YXRlKDQ1ZGVnKTt0cmFuc2Zvcm0tb3JpZ2luOmNlbnRlciBjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjIwcHh9LmRlbGV0ZTpiZWZvcmUsLmRlbGV0ZTphZnRlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29udGVudDpcXFwiXFxcIjtkaXNwbGF5OmJsb2NrO2xlZnQ6NTAlO3Bvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKX0uZGVsZXRlOmJlZm9yZXtoZWlnaHQ6MnB4O3dpZHRoOjUwJX0uZGVsZXRlOmFmdGVye2hlaWdodDo1MCU7d2lkdGg6MnB4fS5kZWxldGU6aG92ZXIsLmRlbGV0ZTpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4zKX0uZGVsZXRlOmFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC40KX0uZGVsZXRlLmlzLXNtYWxse2hlaWdodDoxNHB4O3dpZHRoOjE0cHh9LmRlbGV0ZS5pcy1tZWRpdW17aGVpZ2h0OjI2cHg7d2lkdGg6MjZweH0uZGVsZXRlLmlzLWxhcmdle2hlaWdodDozMHB4O3dpZHRoOjMwcHh9LmZhe2ZvbnQtc2l6ZToyMXB4O3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcH0uaGVhZGluZ3tkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZToxMXB4O2xldHRlci1zcGFjaW5nOjFweDttYXJnaW4tYm90dG9tOjVweDt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2V9LmhpZ2hsaWdodHtmb250LXdlaWdodDo0MDA7bWF4LXdpZHRoOjEwMCU7b3ZlcmZsb3c6aGlkZGVuO3BhZGRpbmc6MH0uaGlnaGxpZ2h0Om5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LmhpZ2hsaWdodCBwcmV7b3ZlcmZsb3c6YXV0bzttYXgtd2lkdGg6MTAwJX0ubG9hZGVye2FuaW1hdGlvbjpzcGluQXJvdW5kIDUwMG1zIGluZmluaXRlIGxpbmVhcjtib3JkZXI6MnB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtib3JkZXItcmlnaHQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLXRvcC1jb2xvcjp0cmFuc3BhcmVudDtjb250ZW50OlxcXCJcXFwiO2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjFyZW07cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MXJlbX0ubnVtYmVye2FsaWduLWl0ZW1zOmNlbnRlcjtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtkaXNwbGF5OmlubGluZS1mbGV4O2ZvbnQtc2l6ZToxLjI1cmVtO2hlaWdodDoyZW07anVzdGlmeS1jb250ZW50OmNlbnRlcjttYXJnaW4tcmlnaHQ6MS41cmVtO21pbi13aWR0aDoyLjVlbTtwYWRkaW5nOjAuMjVyZW0gMC41cmVtO3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcH0uY2FyZC1oZWFkZXJ7YWxpZ24taXRlbXM6c3RyZXRjaDtib3gtc2hhZG93OjAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMSk7ZGlzcGxheTpmbGV4fS5jYXJkLWhlYWRlci10aXRsZXthbGlnbi1pdGVtczpjZW50ZXI7Y29sb3I6IzM2MzYzNjtkaXNwbGF5OmZsZXg7ZmxleC1ncm93OjE7Zm9udC13ZWlnaHQ6NzAwO3BhZGRpbmc6MC43NXJlbX0uY2FyZC1oZWFkZXItaWNvbnthbGlnbi1pdGVtczpjZW50ZXI7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZzowLjc1cmVtfS5jYXJkLWltYWdle2Rpc3BsYXk6YmxvY2s7cG9zaXRpb246cmVsYXRpdmV9LmNhcmQtY29udGVudHtwYWRkaW5nOjEuNXJlbX0uY2FyZC1jb250ZW50IC50aXRsZSsuc3VidGl0bGV7bWFyZ2luLXRvcDotMS41cmVtfS5jYXJkLWZvb3Rlcntib3JkZXItdG9wOjFweCBzb2xpZCAjZGJkYmRiO2FsaWduLWl0ZW1zOnN0cmV0Y2g7ZGlzcGxheTpmbGV4fS5jYXJkLWZvb3Rlci1pdGVte2FsaWduLWl0ZW1zOmNlbnRlcjtkaXNwbGF5OmZsZXg7ZmxleC1iYXNpczowO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmNlbnRlcjtwYWRkaW5nOjAuNzVyZW19LmNhcmQtZm9vdGVyLWl0ZW06bm90KDpsYXN0LWNoaWxkKXtib3JkZXItcmlnaHQ6MXB4IHNvbGlkICNkYmRiZGJ9LmNhcmR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JveC1zaGFkb3c6MCAycHggM3B4IHJnYmEoMTAsMTAsMTAsMC4xKSwwIDAgMCAxcHggcmdiYSgxMCwxMCwxMCwwLjEpO2NvbG9yOiM0YTRhNGE7bWF4LXdpZHRoOjEwMCU7cG9zaXRpb246cmVsYXRpdmV9LmNhcmQgLm1lZGlhOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfS5sZXZlbC1pdGVte2FsaWduLWl0ZW1zOmNlbnRlcjtkaXNwbGF5OmZsZXg7ZmxleC1iYXNpczphdXRvO2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmNlbnRlcn0ubGV2ZWwtaXRlbSAudGl0bGUsLmxldmVsLWl0ZW0gLnN1YnRpdGxle21hcmdpbi1ib3R0b206MH1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmxldmVsLWl0ZW06bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNzVyZW19fS5sZXZlbC1sZWZ0LC5sZXZlbC1yaWdodHtmbGV4LWJhc2lzOmF1dG87ZmxleC1ncm93OjA7ZmxleC1zaHJpbms6MH0ubGV2ZWwtbGVmdCAubGV2ZWwtaXRlbTpub3QoOmxhc3QtY2hpbGQpLC5sZXZlbC1yaWdodCAubGV2ZWwtaXRlbTpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1yaWdodDowLjc1cmVtfS5sZXZlbC1sZWZ0IC5sZXZlbC1pdGVtLmlzLWZsZXhpYmxlLC5sZXZlbC1yaWdodCAubGV2ZWwtaXRlbS5pcy1mbGV4aWJsZXtmbGV4LWdyb3c6MX0ubGV2ZWwtbGVmdHthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5sZXZlbC1sZWZ0Ky5sZXZlbC1yaWdodHttYXJnaW4tdG9wOjEuNXJlbX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5sZXZlbC1sZWZ0e2Rpc3BsYXk6ZmxleH19LmxldmVsLXJpZ2h0e2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmR9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5sZXZlbC1yaWdodHtkaXNwbGF5OmZsZXh9fS5sZXZlbHthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW59LmxldmVsOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LmxldmVsIGNvZGV7Ym9yZGVyLXJhZGl1czozcHh9LmxldmVsIGltZ3tkaXNwbGF5OmlubGluZS1ibG9jazt2ZXJ0aWNhbC1hbGlnbjp0b3B9LmxldmVsLmlzLW1vYmlsZXtkaXNwbGF5OmZsZXh9LmxldmVsLmlzLW1vYmlsZT4ubGV2ZWwtaXRlbTpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MH0ubGV2ZWwuaXMtbW9iaWxlPi5sZXZlbC1pdGVtOm5vdCguaXMtbmFycm93KXtmbGV4LWdyb3c6MX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmxldmVse2Rpc3BsYXk6ZmxleH0ubGV2ZWw+LmxldmVsLWl0ZW06bm90KC5pcy1uYXJyb3cpe2ZsZXgtZ3JvdzoxfX0ubWVkaWEtbGVmdCwubWVkaWEtcmlnaHR7ZmxleC1iYXNpczphdXRvO2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjB9Lm1lZGlhLWxlZnR7bWFyZ2luLXJpZ2h0OjFyZW19Lm1lZGlhLXJpZ2h0e21hcmdpbi1sZWZ0OjFyZW19Lm1lZGlhLWNvbnRlbnR7ZmxleC1iYXNpczphdXRvO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7dGV4dC1hbGlnbjpsZWZ0fS5tZWRpYXthbGlnbi1pdGVtczpmbGV4LXN0YXJ0O2Rpc3BsYXk6ZmxleDt0ZXh0LWFsaWduOmxlZnR9Lm1lZGlhIC5jb250ZW50Om5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfS5tZWRpYSAubWVkaWF7Ym9yZGVyLXRvcDoxcHggc29saWQgcmdiYSgyMTksMjE5LDIxOSwwLjUpO2Rpc3BsYXk6ZmxleDtwYWRkaW5nLXRvcDowLjc1cmVtfS5tZWRpYSAubWVkaWEgLmNvbnRlbnQ6bm90KDpsYXN0LWNoaWxkKSwubWVkaWEgLm1lZGlhIC5jb250cm9sOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjVyZW19Lm1lZGlhIC5tZWRpYSAubWVkaWF7cGFkZGluZy10b3A6MC41cmVtfS5tZWRpYSAubWVkaWEgLm1lZGlhKy5tZWRpYXttYXJnaW4tdG9wOjAuNXJlbX0ubWVkaWErLm1lZGlhe2JvcmRlci10b3A6MXB4IHNvbGlkIHJnYmEoMjE5LDIxOSwyMTksMC41KTttYXJnaW4tdG9wOjFyZW07cGFkZGluZy10b3A6MXJlbX0ubWVkaWEuaXMtbGFyZ2UrLm1lZGlhe21hcmdpbi10b3A6MS41cmVtO3BhZGRpbmctdG9wOjEuNXJlbX0ubWVudXtmb250LXNpemU6MXJlbX0ubWVudS1saXN0e2xpbmUtaGVpZ2h0OjEuMjV9Lm1lbnUtbGlzdCBhe2JvcmRlci1yYWRpdXM6MnB4O2NvbG9yOiM0YTRhNGE7ZGlzcGxheTpibG9jaztwYWRkaW5nOjAuNWVtIDAuNzVlbX0ubWVudS1saXN0IGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiMxODJiNzN9Lm1lbnUtbGlzdCBhLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0ubWVudS1saXN0IGxpIHVse2JvcmRlci1sZWZ0OjFweCBzb2xpZCAjZGJkYmRiO21hcmdpbjowLjc1ZW07cGFkZGluZy1sZWZ0OjAuNzVlbX0ubWVudS1sYWJlbHtjb2xvcjojN2E3YTdhO2ZvbnQtc2l6ZTowLjhlbTtsZXR0ZXItc3BhY2luZzowLjFlbTt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2V9Lm1lbnUtbGFiZWw6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXRvcDoxZW19Lm1lbnUtbGFiZWw6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjFlbX0ubWVzc2FnZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLXJhZGl1czozcHg7Zm9udC1zaXplOjFyZW19Lm1lc3NhZ2U6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0ubWVzc2FnZS5pcy13aGl0ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lm1lc3NhZ2UuaXMtd2hpdGUgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5tZXNzYWdlLmlzLXdoaXRlIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6IzRkNGQ0ZH0ubWVzc2FnZS5pcy1ibGFja3tiYWNrZ3JvdW5kLWNvbG9yOiNmYWZhZmF9Lm1lc3NhZ2UuaXMtYmxhY2sgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5tZXNzYWdlLmlzLWJsYWNrIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMwYTBhMGE7Y29sb3I6IzA5MDkwOX0ubWVzc2FnZS5pcy1saWdodHtiYWNrZ3JvdW5kLWNvbG9yOiNmYWZhZmF9Lm1lc3NhZ2UuaXMtbGlnaHQgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5tZXNzYWdlLmlzLWxpZ2h0IC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzUwNTA1MH0ubWVzc2FnZS5pcy1kYXJre2JhY2tncm91bmQtY29sb3I6I2ZhZmFmYX0ubWVzc2FnZS5pcy1kYXJrIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0ubWVzc2FnZS5pcy1kYXJrIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMzNjM2MzY7Y29sb3I6IzJhMmEyYX0ubWVzc2FnZS5pcy1wcmltYXJ5e2JhY2tncm91bmQtY29sb3I6I2Y3ZjhmZH0ubWVzc2FnZS5pcy1wcmltYXJ5IC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0ubWVzc2FnZS5pcy1wcmltYXJ5IC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMxODJiNzM7Y29sb3I6IzE2MjY2Mn0ubWVzc2FnZS5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6I2Y2ZjlmZX0ubWVzc2FnZS5pcy1pbmZvIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Y29sb3I6I2ZmZn0ubWVzc2FnZS5pcy1pbmZvIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMzMjczZGM7Y29sb3I6IzIyNTA5YX0ubWVzc2FnZS5pcy1zdWNjZXNze2JhY2tncm91bmQtY29sb3I6I2Y2ZmVmOX0ubWVzc2FnZS5pcy1zdWNjZXNzIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Y29sb3I6I2ZmZn0ubWVzc2FnZS5pcy1zdWNjZXNzIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMyM2QxNjA7Y29sb3I6IzBlMzAxYX0ubWVzc2FnZS5pcy13YXJuaW5ne2JhY2tncm91bmQtY29sb3I6I2ZmZmRmNX0ubWVzc2FnZS5pcy13YXJuaW5nIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTc7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5tZXNzYWdlLmlzLXdhcm5pbmcgLm1lc3NhZ2UtYm9keXtib3JkZXItY29sb3I6I2ZmZGQ1Nztjb2xvcjojM2IzMTA4fS5tZXNzYWdlLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY1ZjV9Lm1lc3NhZ2UuaXMtZGFuZ2VyIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtjb2xvcjojZmZmfS5tZXNzYWdlLmlzLWRhbmdlciAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjpyZWQ7Y29sb3I6I2FkMDYwNn0ubWVzc2FnZS1oZWFkZXJ7YWxpZ24taXRlbXM6Y2VudGVyO2JhY2tncm91bmQtY29sb3I6IzRhNGE0YTtib3JkZXItcmFkaXVzOjNweCAzcHggMCAwO2NvbG9yOiNmZmY7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2xpbmUtaGVpZ2h0OjEuMjU7cGFkZGluZzowLjVlbSAwLjc1ZW07cG9zaXRpb246cmVsYXRpdmV9Lm1lc3NhZ2UtaGVhZGVyIGEsLm1lc3NhZ2UtaGVhZGVyIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5tZXNzYWdlLWhlYWRlciBhe3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmV9Lm1lc3NhZ2UtaGVhZGVyIC5kZWxldGV7ZmxleC1ncm93OjA7ZmxleC1zaHJpbms6MDttYXJnaW4tbGVmdDowLjc1ZW19Lm1lc3NhZ2UtaGVhZGVyKy5tZXNzYWdlLWJvZHl7Ym9yZGVyLXRvcC1sZWZ0LXJhZGl1czowO2JvcmRlci10b3AtcmlnaHQtcmFkaXVzOjA7Ym9yZGVyLXRvcDpub25lfS5tZXNzYWdlLWJvZHl7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci1yYWRpdXM6M3B4O2NvbG9yOiM0YTRhNGE7cGFkZGluZzoxZW0gMS4yNWVtfS5tZXNzYWdlLWJvZHkgYSwubWVzc2FnZS1ib2R5IHN0cm9uZ3tjb2xvcjppbmhlcml0fS5tZXNzYWdlLWJvZHkgYXt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lfS5tZXNzYWdlLWJvZHkgY29kZSwubWVzc2FnZS1ib2R5IHByZXtiYWNrZ3JvdW5kOiNmZmZ9Lm1lc3NhZ2UtYm9keSBwcmUgY29kZXtiYWNrZ3JvdW5kOnRyYW5zcGFyZW50fS5tb2RhbC1iYWNrZ3JvdW5ke2JvdHRvbTowO2xlZnQ6MDtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO3RvcDowO2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjg2KX0ubW9kYWwtY29udGVudCwubW9kYWwtY2FyZHttYXJnaW46MCAyMHB4O21heC1oZWlnaHQ6Y2FsYygxMDB2aCAtIDE2MHB4KTtvdmVyZmxvdzphdXRvO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjEwMCV9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5tb2RhbC1jb250ZW50LC5tb2RhbC1jYXJke21hcmdpbjowIGF1dG87bWF4LWhlaWdodDpjYWxjKDEwMHZoIC0gNDBweCk7d2lkdGg6NjQwcHh9fS5tb2RhbC1jbG9zZXstd2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lOy1tcy11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmU7LW1vei1hcHBlYXJhbmNlOm5vbmU7LXdlYmtpdC1hcHBlYXJhbmNlOm5vbmU7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMik7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MXJlbTtoZWlnaHQ6MjBweDtvdXRsaW5lOm5vbmU7cG9zaXRpb246cmVsYXRpdmU7dHJhbnNmb3JtOnJvdGF0ZSg0NWRlZyk7dHJhbnNmb3JtLW9yaWdpbjpjZW50ZXIgY2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcDt3aWR0aDoyMHB4O2JhY2tncm91bmQ6bm9uZTtoZWlnaHQ6NDBweDtwb3NpdGlvbjpmaXhlZDtyaWdodDoyMHB4O3RvcDoyMHB4O3dpZHRoOjQwcHh9Lm1vZGFsLWNsb3NlOmJlZm9yZSwubW9kYWwtY2xvc2U6YWZ0ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbnRlbnQ6XFxcIlxcXCI7ZGlzcGxheTpibG9jaztsZWZ0OjUwJTtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSl9Lm1vZGFsLWNsb3NlOmJlZm9yZXtoZWlnaHQ6MnB4O3dpZHRoOjUwJX0ubW9kYWwtY2xvc2U6YWZ0ZXJ7aGVpZ2h0OjUwJTt3aWR0aDoycHh9Lm1vZGFsLWNsb3NlOmhvdmVyLC5tb2RhbC1jbG9zZTpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4zKX0ubW9kYWwtY2xvc2U6YWN0aXZle2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjQpfS5tb2RhbC1jbG9zZS5pcy1zbWFsbHtoZWlnaHQ6MTRweDt3aWR0aDoxNHB4fS5tb2RhbC1jbG9zZS5pcy1tZWRpdW17aGVpZ2h0OjI2cHg7d2lkdGg6MjZweH0ubW9kYWwtY2xvc2UuaXMtbGFyZ2V7aGVpZ2h0OjMwcHg7d2lkdGg6MzBweH0ubW9kYWwtY2FyZHtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO21heC1oZWlnaHQ6Y2FsYygxMDB2aCAtIDQwcHgpO292ZXJmbG93OmhpZGRlbn0ubW9kYWwtY2FyZC1oZWFkLC5tb2RhbC1jYXJkLWZvb3R7YWxpZ24taXRlbXM6Y2VudGVyO2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtkaXNwbGF5OmZsZXg7ZmxleC1zaHJpbms6MDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtwYWRkaW5nOjIwcHg7cG9zaXRpb246cmVsYXRpdmV9Lm1vZGFsLWNhcmQtaGVhZHtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci10b3AtbGVmdC1yYWRpdXM6NXB4O2JvcmRlci10b3AtcmlnaHQtcmFkaXVzOjVweH0ubW9kYWwtY2FyZC10aXRsZXtjb2xvcjojMzYzNjM2O2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjA7Zm9udC1zaXplOjEuNXJlbTtsaW5lLWhlaWdodDoxfS5tb2RhbC1jYXJkLWZvb3R7Ym9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1czo1cHg7Ym9yZGVyLWJvdHRvbS1yaWdodC1yYWRpdXM6NXB4O2JvcmRlci10b3A6MXB4IHNvbGlkICNkYmRiZGJ9Lm1vZGFsLWNhcmQtZm9vdCAuYnV0dG9uOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0OjEwcHh9Lm1vZGFsLWNhcmQtYm9keXstd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzp0b3VjaDtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MTtvdmVyZmxvdzphdXRvO3BhZGRpbmc6MjBweH0ubW9kYWx7Ym90dG9tOjA7bGVmdDowO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjA7YWxpZ24taXRlbXM6Y2VudGVyO2Rpc3BsYXk6bm9uZTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO292ZXJmbG93OmhpZGRlbjtwb3NpdGlvbjpmaXhlZDt6LWluZGV4OjE5ODZ9Lm1vZGFsLmlzLWFjdGl2ZXtkaXNwbGF5OmZsZXh9Lm5hdi10b2dnbGV7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpibG9jaztoZWlnaHQ6My41cmVtO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjMuNXJlbX0ubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzRhNGE0YTtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcHg7bGVmdDo1MCU7bWFyZ2luLWxlZnQ6LTdweDtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3RyYW5zaXRpb246bm9uZSA4Nm1zIGVhc2Utb3V0O3RyYW5zaXRpb24tcHJvcGVydHk6YmFja2dyb3VuZCwgbGVmdCwgb3BhY2l0eSwgdHJhbnNmb3JtO3dpZHRoOjE1cHh9Lm5hdi10b2dnbGUgc3BhbjpudGgtY2hpbGQoMSl7bWFyZ2luLXRvcDotNnB4fS5uYXYtdG9nZ2xlIHNwYW46bnRoLWNoaWxkKDIpe21hcmdpbi10b3A6LTFweH0ubmF2LXRvZ2dsZSBzcGFuOm50aC1jaGlsZCgzKXttYXJnaW4tdG9wOjRweH0ubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9Lm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojMTgyYjczfS5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFuOm50aC1jaGlsZCgxKXttYXJnaW4tbGVmdDotNXB4O3RyYW5zZm9ybTpyb3RhdGUoNDVkZWcpO3RyYW5zZm9ybS1vcmlnaW46bGVmdCB0b3B9Lm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW46bnRoLWNoaWxkKDIpe29wYWNpdHk6MH0ubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbjpudGgtY2hpbGQoMyl7bWFyZ2luLWxlZnQ6LTVweDt0cmFuc2Zvcm06cm90YXRlKC00NWRlZyk7dHJhbnNmb3JtLW9yaWdpbjpsZWZ0IGJvdHRvbX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7Lm5hdi10b2dnbGV7ZGlzcGxheTpub25lfX0ubmF2LWl0ZW17YWxpZ24taXRlbXM6Y2VudGVyO2Rpc3BsYXk6ZmxleDtmbGV4LWdyb3c6MDtmbGV4LXNocmluazowO2ZvbnQtc2l6ZToxcmVtO2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZzowLjVyZW0gMC43NXJlbX0ubmF2LWl0ZW0gYXtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowfS5uYXYtaXRlbSBpbWd7bWF4LWhlaWdodDoxLjc1cmVtfS5uYXYtaXRlbSAuYnV0dG9uKy5idXR0b257bWFyZ2luLWxlZnQ6MC43NXJlbX0ubmF2LWl0ZW0gLnRhZzpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1yaWdodDowLjVyZW19Lm5hdi1pdGVtIC50YWc6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tbGVmdDowLjVyZW19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5uYXYtaXRlbXtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydH19Lm5hdi1pdGVtIGEsYS5uYXYtaXRlbXtjb2xvcjojN2E3YTdhfS5uYXYtaXRlbSBhOmhvdmVyLGEubmF2LWl0ZW06aG92ZXJ7Y29sb3I6IzM2MzYzNn0ubmF2LWl0ZW0gYS5pcy1hY3RpdmUsYS5uYXYtaXRlbS5pcy1hY3RpdmV7Y29sb3I6IzM2MzYzNn0ubmF2LWl0ZW0gYS5pcy10YWIsYS5uYXYtaXRlbS5pcy10YWJ7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdHJhbnNwYXJlbnQ7Ym9yZGVyLXRvcDoxcHggc29saWQgdHJhbnNwYXJlbnQ7cGFkZGluZy1ib3R0b206Y2FsYygwLjVyZW0gLSAxcHgpO3BhZGRpbmctbGVmdDoxcmVtO3BhZGRpbmctcmlnaHQ6MXJlbTtwYWRkaW5nLXRvcDpjYWxjKDAuNXJlbSAtIDFweCl9Lm5hdi1pdGVtIGEuaXMtdGFiOmhvdmVyLGEubmF2LWl0ZW0uaXMtdGFiOmhvdmVye2JvcmRlci1ib3R0b20tY29sb3I6IzE4MmI3Mztib3JkZXItdG9wLWNvbG9yOnRyYW5zcGFyZW50fS5uYXYtaXRlbSBhLmlzLXRhYi5pcy1hY3RpdmUsYS5uYXYtaXRlbS5pcy10YWIuaXMtYWN0aXZle2JvcmRlci1ib3R0b206M3B4IHNvbGlkICMxODJiNzM7Y29sb3I6IzE4MmI3MztwYWRkaW5nLWJvdHRvbTpjYWxjKDAuNXJlbSAtIDNweCl9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsubmF2LWl0ZW0gYS5pcy1icmFuZCxhLm5hdi1pdGVtLmlzLWJyYW5ke3BhZGRpbmctbGVmdDowfX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3gtc2hhZG93OjAgNHB4IDdweCByZ2JhKDEwLDEwLDEwLDAuMSk7bGVmdDowO2Rpc3BsYXk6bm9uZTtyaWdodDowO3RvcDoxMDAlO3Bvc2l0aW9uOmFic29sdXRlfS5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcDoxcHggc29saWQgcmdiYSgyMTksMjE5LDIxOSwwLjUpO3BhZGRpbmc6MC43NXJlbX0ubmF2LW1lbnUuaXMtYWN0aXZle2Rpc3BsYXk6YmxvY2t9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5uYXYtbWVudXtwYWRkaW5nLXJpZ2h0OjEuNXJlbX19Lm5hdi1sZWZ0LC5uYXYtcmlnaHR7YWxpZ24taXRlbXM6c3RyZXRjaDtmbGV4LWJhc2lzOjA7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0ubmF2LWxlZnR7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O292ZXJmbG93OmhpZGRlbjtvdmVyZmxvdy14OmF1dG87d2hpdGUtc3BhY2U6bm93cmFwfS5uYXYtY2VudGVye2FsaWduLWl0ZW1zOnN0cmV0Y2g7ZGlzcGxheTpmbGV4O2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmNlbnRlcjttYXJnaW4tbGVmdDphdXRvO21hcmdpbi1yaWdodDphdXRvfS5uYXYtcmlnaHR7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsubmF2LXJpZ2h0e2Rpc3BsYXk6ZmxleH19Lm5hdnthbGlnbi1pdGVtczpzdHJldGNoO2JhY2tncm91bmQtY29sb3I6I2ZmZjtkaXNwbGF5OmZsZXg7bWluLWhlaWdodDozLjVyZW07cG9zaXRpb246cmVsYXRpdmU7dGV4dC1hbGlnbjpjZW50ZXI7ei1pbmRleDoyfS5uYXY+LmNvbnRhaW5lcnthbGlnbi1pdGVtczpzdHJldGNoO2Rpc3BsYXk6ZmxleDttaW4taGVpZ2h0OjMuNXJlbTt3aWR0aDoxMDAlfS5uYXYuaGFzLXNoYWRvd3tib3gtc2hhZG93OjAgMnB4IDNweCByZ2JhKDEwLDEwLDEwLDAuMSl9LnBhZ2luYXRpb24sLnBhZ2luYXRpb24tbGlzdHthbGlnbi1pdGVtczpjZW50ZXI7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXI7dGV4dC1hbGlnbjpjZW50ZXJ9LnBhZ2luYXRpb24tcHJldmlvdXMsLnBhZ2luYXRpb24tbmV4dCwucGFnaW5hdGlvbi1saW5rLC5wYWdpbmF0aW9uLWVsbGlwc2lzey1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjNweDtib3gtc2hhZG93Om5vbmU7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MXJlbTtoZWlnaHQ6Mi4yODVlbTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3A7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lO2ZvbnQtc2l6ZTowLjg3NXJlbTtwYWRkaW5nLWxlZnQ6MC41ZW07cGFkZGluZy1yaWdodDowLjVlbTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3RleHQtYWxpZ246Y2VudGVyfS5wYWdpbmF0aW9uLXByZXZpb3VzOmZvY3VzLC5wYWdpbmF0aW9uLXByZXZpb3VzLmlzLWZvY3VzZWQsLnBhZ2luYXRpb24tcHJldmlvdXM6YWN0aXZlLC5wYWdpbmF0aW9uLXByZXZpb3VzLmlzLWFjdGl2ZSwucGFnaW5hdGlvbi1uZXh0OmZvY3VzLC5wYWdpbmF0aW9uLW5leHQuaXMtZm9jdXNlZCwucGFnaW5hdGlvbi1uZXh0OmFjdGl2ZSwucGFnaW5hdGlvbi1uZXh0LmlzLWFjdGl2ZSwucGFnaW5hdGlvbi1saW5rOmZvY3VzLC5wYWdpbmF0aW9uLWxpbmsuaXMtZm9jdXNlZCwucGFnaW5hdGlvbi1saW5rOmFjdGl2ZSwucGFnaW5hdGlvbi1saW5rLmlzLWFjdGl2ZSwucGFnaW5hdGlvbi1lbGxpcHNpczpmb2N1cywucGFnaW5hdGlvbi1lbGxpcHNpcy5pcy1mb2N1c2VkLC5wYWdpbmF0aW9uLWVsbGlwc2lzOmFjdGl2ZSwucGFnaW5hdGlvbi1lbGxpcHNpcy5pcy1hY3RpdmV7b3V0bGluZTpub25lfS5wYWdpbmF0aW9uLXByZXZpb3VzW2Rpc2FibGVkXSwucGFnaW5hdGlvbi1wcmV2aW91cy5pcy1kaXNhYmxlZCwucGFnaW5hdGlvbi1uZXh0W2Rpc2FibGVkXSwucGFnaW5hdGlvbi1uZXh0LmlzLWRpc2FibGVkLC5wYWdpbmF0aW9uLWxpbmtbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLWxpbmsuaXMtZGlzYWJsZWQsLnBhZ2luYXRpb24tZWxsaXBzaXNbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLWVsbGlwc2lzLmlzLWRpc2FibGVke3BvaW50ZXItZXZlbnRzOm5vbmV9LnBhZ2luYXRpb24tcHJldmlvdXMsLnBhZ2luYXRpb24tbmV4dCwucGFnaW5hdGlvbi1saW5re2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjttaW4td2lkdGg6Mi41ZW19LnBhZ2luYXRpb24tcHJldmlvdXM6aG92ZXIsLnBhZ2luYXRpb24tbmV4dDpob3ZlciwucGFnaW5hdGlvbi1saW5rOmhvdmVye2JvcmRlci1jb2xvcjojYjViNWI1O2NvbG9yOiMzNjM2MzZ9LnBhZ2luYXRpb24tcHJldmlvdXM6Zm9jdXMsLnBhZ2luYXRpb24tbmV4dDpmb2N1cywucGFnaW5hdGlvbi1saW5rOmZvY3Vze2JvcmRlci1jb2xvcjojMTgyYjczfS5wYWdpbmF0aW9uLXByZXZpb3VzOmFjdGl2ZSwucGFnaW5hdGlvbi1uZXh0OmFjdGl2ZSwucGFnaW5hdGlvbi1saW5rOmFjdGl2ZXtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMil9LnBhZ2luYXRpb24tcHJldmlvdXNbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLXByZXZpb3VzLmlzLWRpc2FibGVkLC5wYWdpbmF0aW9uLW5leHRbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLW5leHQuaXMtZGlzYWJsZWQsLnBhZ2luYXRpb24tbGlua1tkaXNhYmxlZF0sLnBhZ2luYXRpb24tbGluay5pcy1kaXNhYmxlZHtiYWNrZ3JvdW5kOiNkYmRiZGI7Y29sb3I6IzdhN2E3YTtvcGFjaXR5OjAuNTtwb2ludGVyLWV2ZW50czpub25lfS5wYWdpbmF0aW9uLXByZXZpb3VzLC5wYWdpbmF0aW9uLW5leHR7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbX0ucGFnaW5hdGlvbi1saW5rLmlzLWN1cnJlbnR7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2JvcmRlci1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9LnBhZ2luYXRpb24tZWxsaXBzaXN7Y29sb3I6I2I1YjViNTtwb2ludGVyLWV2ZW50czpub25lfS5wYWdpbmF0aW9uLWxpc3QgbGk6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6MC4zNzVyZW19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5wYWdpbmF0aW9ue2ZsZXgtd3JhcDp3cmFwfS5wYWdpbmF0aW9uLXByZXZpb3VzLC5wYWdpbmF0aW9uLW5leHR7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MTt3aWR0aDpjYWxjKDUwJSAtIDAuMzc1cmVtKX0ucGFnaW5hdGlvbi1uZXh0e21hcmdpbi1sZWZ0OjAuNzVyZW19LnBhZ2luYXRpb24tbGlzdHttYXJnaW4tdG9wOjAuNzVyZW19LnBhZ2luYXRpb24tbGlzdCBsaXtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LnBhZ2luYXRpb24tbGlzdHtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O29yZGVyOjF9LnBhZ2luYXRpb24tcHJldmlvdXMsLnBhZ2luYXRpb24tbmV4dHttYXJnaW4tbGVmdDowLjc1cmVtfS5wYWdpbmF0aW9uLXByZXZpb3Vze29yZGVyOjJ9LnBhZ2luYXRpb24tbmV4dHtvcmRlcjozfS5wYWdpbmF0aW9ue2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVufS5wYWdpbmF0aW9uLmlzLWNlbnRlcmVkIC5wYWdpbmF0aW9uLXByZXZpb3Vze21hcmdpbi1sZWZ0OjA7b3JkZXI6MX0ucGFnaW5hdGlvbi5pcy1jZW50ZXJlZCAucGFnaW5hdGlvbi1saXN0e2p1c3RpZnktY29udGVudDpjZW50ZXI7b3JkZXI6Mn0ucGFnaW5hdGlvbi5pcy1jZW50ZXJlZCAucGFnaW5hdGlvbi1uZXh0e29yZGVyOjN9LnBhZ2luYXRpb24uaXMtcmlnaHQgLnBhZ2luYXRpb24tcHJldmlvdXN7bWFyZ2luLWxlZnQ6MDtvcmRlcjoxfS5wYWdpbmF0aW9uLmlzLXJpZ2h0IC5wYWdpbmF0aW9uLW5leHR7b3JkZXI6MjttYXJnaW4tcmlnaHQ6MC43NXJlbX0ucGFnaW5hdGlvbi5pcy1yaWdodCAucGFnaW5hdGlvbi1saXN0e2p1c3RpZnktY29udGVudDpmbGV4LWVuZDtvcmRlcjozfX0ucGFuZWx7Zm9udC1zaXplOjFyZW19LnBhbmVsOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LnBhbmVsLWhlYWRpbmcsLnBhbmVsLXRhYnMsLnBhbmVsLWJsb2Nre2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLWxlZnQ6MXB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXJpZ2h0OjFweCBzb2xpZCAjZGJkYmRifS5wYW5lbC1oZWFkaW5nOmZpcnN0LWNoaWxkLC5wYW5lbC10YWJzOmZpcnN0LWNoaWxkLC5wYW5lbC1ibG9jazpmaXJzdC1jaGlsZHtib3JkZXItdG9wOjFweCBzb2xpZCAjZGJkYmRifS5wYW5lbC1oZWFkaW5ne2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItcmFkaXVzOjNweCAzcHggMCAwO2NvbG9yOiMzNjM2MzY7Zm9udC1zaXplOjEuMjVlbTtmb250LXdlaWdodDozMDA7bGluZS1oZWlnaHQ6MS4yNTtwYWRkaW5nOjAuNWVtIDAuNzVlbX0ucGFuZWwtdGFic3thbGlnbi1pdGVtczpmbGV4LWVuZDtkaXNwbGF5OmZsZXg7Zm9udC1zaXplOjAuODc1ZW07anVzdGlmeS1jb250ZW50OmNlbnRlcn0ucGFuZWwtdGFicyBhe2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNkYmRiZGI7bWFyZ2luLWJvdHRvbTotMXB4O3BhZGRpbmc6MC41ZW19LnBhbmVsLXRhYnMgYS5pcy1hY3RpdmV7Ym9yZGVyLWJvdHRvbS1jb2xvcjojNGE0YTRhO2NvbG9yOiMzNjM2MzZ9LnBhbmVsLWxpc3QgYXtjb2xvcjojNGE0YTRhfS5wYW5lbC1saXN0IGE6aG92ZXJ7Y29sb3I6IzE4MmI3M30ucGFuZWwtYmxvY2t7YWxpZ24taXRlbXM6Y2VudGVyO2NvbG9yOiMzNjM2MzY7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O3BhZGRpbmc6MC41ZW0gMC43NWVtfS5wYW5lbC1ibG9jayBpbnB1dFt0eXBlPVxcXCJjaGVja2JveFxcXCJde21hcmdpbi1yaWdodDowLjc1ZW19LnBhbmVsLWJsb2NrPi5jb250cm9se2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7d2lkdGg6MTAwJX0ucGFuZWwtYmxvY2suaXMtYWN0aXZle2JvcmRlci1sZWZ0LWNvbG9yOiMxODJiNzM7Y29sb3I6IzM2MzYzNn0ucGFuZWwtYmxvY2suaXMtYWN0aXZlIC5wYW5lbC1pY29ue2NvbG9yOiMxODJiNzN9YS5wYW5lbC1ibG9jayxsYWJlbC5wYW5lbC1ibG9ja3tjdXJzb3I6cG9pbnRlcn1hLnBhbmVsLWJsb2NrOmhvdmVyLGxhYmVsLnBhbmVsLWJsb2NrOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX0ucGFuZWwtaWNvbntkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MTRweDtoZWlnaHQ6MWVtO2xpbmUtaGVpZ2h0OjFlbTt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6MWVtO2NvbG9yOiM3YTdhN2E7bWFyZ2luLXJpZ2h0OjAuNzVlbX0ucGFuZWwtaWNvbiAuZmF7Zm9udC1zaXplOmluaGVyaXQ7bGluZS1oZWlnaHQ6aW5oZXJpdH0udGFic3std2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lOy1tcy11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmU7YWxpZ24taXRlbXM6c3RyZXRjaDtkaXNwbGF5OmZsZXg7Zm9udC1zaXplOjFyZW07anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47b3ZlcmZsb3c6aGlkZGVuO292ZXJmbG93LXg6YXV0bzt3aGl0ZS1zcGFjZTpub3dyYXB9LnRhYnM6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0udGFicyBhe2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZGJkYmRiO2NvbG9yOiM0YTRhNGE7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXI7bWFyZ2luLWJvdHRvbTotMXB4O3BhZGRpbmc6MC41ZW0gMWVtO3ZlcnRpY2FsLWFsaWduOnRvcH0udGFicyBhOmhvdmVye2JvcmRlci1ib3R0b20tY29sb3I6IzM2MzYzNjtjb2xvcjojMzYzNjM2fS50YWJzIGxpe2Rpc3BsYXk6YmxvY2t9LnRhYnMgbGkuaXMtYWN0aXZlIGF7Ym9yZGVyLWJvdHRvbS1jb2xvcjojMTgyYjczO2NvbG9yOiMxODJiNzN9LnRhYnMgdWx7YWxpZ24taXRlbXM6Y2VudGVyO2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNkYmRiZGI7ZGlzcGxheTpmbGV4O2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9LnRhYnMgdWwuaXMtbGVmdHtwYWRkaW5nLXJpZ2h0OjAuNzVlbX0udGFicyB1bC5pcy1jZW50ZXJ7ZmxleDpub25lO2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbX0udGFicyB1bC5pcy1yaWdodHtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmQ7cGFkZGluZy1sZWZ0OjAuNzVlbX0udGFicyAuaWNvbjpmaXJzdC1jaGlsZHttYXJnaW4tcmlnaHQ6MC41ZW19LnRhYnMgLmljb246bGFzdC1jaGlsZHttYXJnaW4tbGVmdDowLjVlbX0udGFicy5pcy1jZW50ZXJlZCB1bHtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS50YWJzLmlzLXJpZ2h0IHVse2p1c3RpZnktY29udGVudDpmbGV4LWVuZH0udGFicy5pcy1ib3hlZCBhe2JvcmRlcjoxcHggc29saWQgdHJhbnNwYXJlbnQ7Ym9yZGVyLXJhZGl1czozcHggM3B4IDAgMH0udGFicy5pcy1ib3hlZCBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItYm90dG9tLWNvbG9yOiNkYmRiZGJ9LnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGF7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1jb2xvcjojZGJkYmRiO2JvcmRlci1ib3R0b20tY29sb3I6dHJhbnNwYXJlbnQgIWltcG9ydGFudH0udGFicy5pcy1mdWxsd2lkdGggbGl7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0udGFicy5pcy10b2dnbGUgYXtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7bWFyZ2luLWJvdHRvbTowO3Bvc2l0aW9uOnJlbGF0aXZlfS50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItY29sb3I6I2I1YjViNTt6LWluZGV4OjJ9LnRhYnMuaXMtdG9nZ2xlIGxpK2xpe21hcmdpbi1sZWZ0Oi0xcHh9LnRhYnMuaXMtdG9nZ2xlIGxpOmZpcnN0LWNoaWxkIGF7Ym9yZGVyLXJhZGl1czozcHggMCAwIDNweH0udGFicy5pcy10b2dnbGUgbGk6bGFzdC1jaGlsZCBhe2JvcmRlci1yYWRpdXM6MCAzcHggM3B4IDB9LnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhe2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztib3JkZXItY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmO3otaW5kZXg6MX0udGFicy5pcy10b2dnbGUgdWx7Ym9yZGVyLWJvdHRvbTpub25lfS50YWJzLmlzLXNtYWxse2ZvbnQtc2l6ZTouNzVyZW19LnRhYnMuaXMtbWVkaXVte2ZvbnQtc2l6ZToxLjI1cmVtfS50YWJzLmlzLWxhcmdle2ZvbnQtc2l6ZToxLjVyZW19LmNvbHVtbntkaXNwbGF5OmJsb2NrO2ZsZXgtYmFzaXM6MDtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO3BhZGRpbmc6MC43NXJlbX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1uYXJyb3d7ZmxleDpub25lfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLWZ1bGx7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtdGhyZWUtcXVhcnRlcnN7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy10d28tdGhpcmRze2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1oYWxme2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb25lLXRoaXJke2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vbmUtcXVhcnRlcntmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVyc3ttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LXR3by10aGlyZHN7bWFyZ2luLWxlZnQ6NjYuNjY2NiV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LWhhbGZ7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmR7bWFyZ2luLWxlZnQ6MzMuMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LW9uZS1xdWFydGVye21hcmdpbi1sZWZ0OjI1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0xe2ZsZXg6bm9uZTt3aWR0aDo4LjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtMXttYXJnaW4tbGVmdDo4LjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0ye2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTJ7bWFyZ2luLWxlZnQ6MTYuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTN7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtM3ttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtNHtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC00e21hcmdpbi1sZWZ0OjMzLjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy01e2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTV7bWFyZ2luLWxlZnQ6NDEuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTZ7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtNnttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtN3tmbGV4Om5vbmU7d2lkdGg6NTguMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC03e21hcmdpbi1sZWZ0OjU4LjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy04e2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTh7bWFyZ2luLWxlZnQ6NjYuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTl7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtOXttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtMTB7ZmxleDpub25lO3dpZHRoOjgzLjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtMTB7bWFyZ2luLWxlZnQ6ODMuMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTExe2ZsZXg6bm9uZTt3aWR0aDo5MS42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTExe21hcmdpbi1sZWZ0OjkxLjY2NjY3JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0xMntmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtMTJ7bWFyZ2luLWxlZnQ6MTAwJX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmNvbHVtbi5pcy1uYXJyb3ctbW9iaWxle2ZsZXg6bm9uZX0uY29sdW1uLmlzLWZ1bGwtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtdGhyZWUtcXVhcnRlcnMtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy10d28tdGhpcmRzLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbi5pcy1oYWxmLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb25lLXRoaXJkLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMyV9LmNvbHVtbi5pcy1vbmUtcXVhcnRlci1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycy1tb2JpbGV7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LXR3by10aGlyZHMtbW9iaWxle21hcmdpbi1sZWZ0OjY2LjY2NjYlfS5jb2x1bW4uaXMtb2Zmc2V0LWhhbGYtbW9iaWxle21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmQtbW9iaWxle21hcmdpbi1sZWZ0OjMzLjMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LW9uZS1xdWFydGVyLW1vYmlsZXttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy0xLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMS1tb2JpbGV7bWFyZ2luLWxlZnQ6OC4zMzMzMyV9LmNvbHVtbi5pcy0yLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTItbW9iaWxle21hcmdpbi1sZWZ0OjE2LjY2NjY3JX0uY29sdW1uLmlzLTMtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtMy1tb2JpbGV7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtNC1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC00LW1vYmlsZXttYXJnaW4tbGVmdDozMy4zMzMzMyV9LmNvbHVtbi5pcy01LW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTUtbW9iaWxle21hcmdpbi1sZWZ0OjQxLjY2NjY3JX0uY29sdW1uLmlzLTYtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtNi1tb2JpbGV7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtNy1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC03LW1vYmlsZXttYXJnaW4tbGVmdDo1OC4zMzMzMyV9LmNvbHVtbi5pcy04LW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTgtbW9iaWxle21hcmdpbi1sZWZ0OjY2LjY2NjY3JX0uY29sdW1uLmlzLTktbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtOS1tb2JpbGV7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtMTAtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMTAtbW9iaWxle21hcmdpbi1sZWZ0OjgzLjMzMzMzJX0uY29sdW1uLmlzLTExLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6OTEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTExLW1vYmlsZXttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbi5pcy0xMi1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbi5pcy1vZmZzZXQtMTItbW9iaWxle21hcmdpbi1sZWZ0OjEwMCV9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuY29sdW1uLmlzLW5hcnJvdywuY29sdW1uLmlzLW5hcnJvdy10YWJsZXR7ZmxleDpub25lfS5jb2x1bW4uaXMtZnVsbCwuY29sdW1uLmlzLWZ1bGwtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtdGhyZWUtcXVhcnRlcnMsLmNvbHVtbi5pcy10aHJlZS1xdWFydGVycy10YWJsZXR7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLXR3by10aGlyZHMsLmNvbHVtbi5pcy10d28tdGhpcmRzLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbi5pcy1oYWxmLC5jb2x1bW4uaXMtaGFsZi10YWJsZXR7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9uZS10aGlyZCwuY29sdW1uLmlzLW9uZS10aGlyZC10YWJsZXR7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMlfS5jb2x1bW4uaXMtb25lLXF1YXJ0ZXIsLmNvbHVtbi5pcy1vbmUtcXVhcnRlci10YWJsZXR7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycywuY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycy10YWJsZXR7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LXR3by10aGlyZHMsLmNvbHVtbi5pcy1vZmZzZXQtdHdvLXRoaXJkcy10YWJsZXR7bWFyZ2luLWxlZnQ6NjYuNjY2NiV9LmNvbHVtbi5pcy1vZmZzZXQtaGFsZiwuY29sdW1uLmlzLW9mZnNldC1oYWxmLXRhYmxldHttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXRoaXJkLC5jb2x1bW4uaXMtb2Zmc2V0LW9uZS10aGlyZC10YWJsZXR7bWFyZ2luLWxlZnQ6MzMuMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXF1YXJ0ZXIsLmNvbHVtbi5pcy1vZmZzZXQtb25lLXF1YXJ0ZXItdGFibGV0e21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTEsLmNvbHVtbi5pcy0xLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMSwuY29sdW1uLmlzLW9mZnNldC0xLXRhYmxldHttYXJnaW4tbGVmdDo4LjMzMzMzJX0uY29sdW1uLmlzLTIsLmNvbHVtbi5pcy0yLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTIsLmNvbHVtbi5pcy1vZmZzZXQtMi10YWJsZXR7bWFyZ2luLWxlZnQ6MTYuNjY2NjclfS5jb2x1bW4uaXMtMywuY29sdW1uLmlzLTMtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtMywuY29sdW1uLmlzLW9mZnNldC0zLXRhYmxldHttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy00LC5jb2x1bW4uaXMtNC10YWJsZXR7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC00LC5jb2x1bW4uaXMtb2Zmc2V0LTQtdGFibGV0e21hcmdpbi1sZWZ0OjMzLjMzMzMzJX0uY29sdW1uLmlzLTUsLmNvbHVtbi5pcy01LXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTUsLmNvbHVtbi5pcy1vZmZzZXQtNS10YWJsZXR7bWFyZ2luLWxlZnQ6NDEuNjY2NjclfS5jb2x1bW4uaXMtNiwuY29sdW1uLmlzLTYtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtNiwuY29sdW1uLmlzLW9mZnNldC02LXRhYmxldHttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy03LC5jb2x1bW4uaXMtNy10YWJsZXR7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC03LC5jb2x1bW4uaXMtb2Zmc2V0LTctdGFibGV0e21hcmdpbi1sZWZ0OjU4LjMzMzMzJX0uY29sdW1uLmlzLTgsLmNvbHVtbi5pcy04LXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTgsLmNvbHVtbi5pcy1vZmZzZXQtOC10YWJsZXR7bWFyZ2luLWxlZnQ6NjYuNjY2NjclfS5jb2x1bW4uaXMtOSwuY29sdW1uLmlzLTktdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtOSwuY29sdW1uLmlzLW9mZnNldC05LXRhYmxldHttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy0xMCwuY29sdW1uLmlzLTEwLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6ODMuMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEwLC5jb2x1bW4uaXMtb2Zmc2V0LTEwLXRhYmxldHttYXJnaW4tbGVmdDo4My4zMzMzMyV9LmNvbHVtbi5pcy0xMSwuY29sdW1uLmlzLTExLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6OTEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTExLC5jb2x1bW4uaXMtb2Zmc2V0LTExLXRhYmxldHttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbi5pcy0xMiwuY29sdW1uLmlzLTEyLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLW9mZnNldC0xMiwuY29sdW1uLmlzLW9mZnNldC0xMi10YWJsZXR7bWFyZ2luLWxlZnQ6MTAwJX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuY29sdW1uLmlzLW5hcnJvdy1kZXNrdG9we2ZsZXg6bm9uZX0uY29sdW1uLmlzLWZ1bGwtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLXRocmVlLXF1YXJ0ZXJzLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLXR3by10aGlyZHMtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbi5pcy1oYWxmLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9uZS10aGlyZC1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzJX0uY29sdW1uLmlzLW9uZS1xdWFydGVyLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycy1kZXNrdG9we21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLW9mZnNldC10d28tdGhpcmRzLWRlc2t0b3B7bWFyZ2luLWxlZnQ6NjYuNjY2NiV9LmNvbHVtbi5pcy1vZmZzZXQtaGFsZi1kZXNrdG9we21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmQtZGVza3RvcHttYXJnaW4tbGVmdDozMy4zMzMzJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtcXVhcnRlci1kZXNrdG9we21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTEtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMS1kZXNrdG9we21hcmdpbi1sZWZ0OjguMzMzMzMlfS5jb2x1bW4uaXMtMi1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMi1kZXNrdG9we21hcmdpbi1sZWZ0OjE2LjY2NjY3JX0uY29sdW1uLmlzLTMtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LTMtZGVza3RvcHttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy00LWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC00LWRlc2t0b3B7bWFyZ2luLWxlZnQ6MzMuMzMzMzMlfS5jb2x1bW4uaXMtNS1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtNS1kZXNrdG9we21hcmdpbi1sZWZ0OjQxLjY2NjY3JX0uY29sdW1uLmlzLTYtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LTYtZGVza3RvcHttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy03LWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC03LWRlc2t0b3B7bWFyZ2luLWxlZnQ6NTguMzMzMzMlfS5jb2x1bW4uaXMtOC1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtOC1kZXNrdG9we21hcmdpbi1sZWZ0OjY2LjY2NjY3JX0uY29sdW1uLmlzLTktZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LTktZGVza3RvcHttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy0xMC1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMTAtZGVza3RvcHttYXJnaW4tbGVmdDo4My4zMzMzMyV9LmNvbHVtbi5pcy0xMS1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo5MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMTEtZGVza3RvcHttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbi5pcy0xMi1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtb2Zmc2V0LTEyLWRlc2t0b3B7bWFyZ2luLWxlZnQ6MTAwJX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuY29sdW1uLmlzLW5hcnJvdy13aWRlc2NyZWVue2ZsZXg6bm9uZX0uY29sdW1uLmlzLWZ1bGwtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLXRocmVlLXF1YXJ0ZXJzLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLXR3by10aGlyZHMtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbi5pcy1oYWxmLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9uZS10aGlyZC13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzJX0uY29sdW1uLmlzLW9uZS1xdWFydGVyLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycy13aWRlc2NyZWVue21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLW9mZnNldC10d28tdGhpcmRzLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NjYuNjY2NiV9LmNvbHVtbi5pcy1vZmZzZXQtaGFsZi13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmQtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDozMy4zMzMzJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtcXVhcnRlci13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTEtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMS13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjguMzMzMzMlfS5jb2x1bW4uaXMtMi13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMi13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjE2LjY2NjY3JX0uY29sdW1uLmlzLTMtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LTMtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy00LXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC00LXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6MzMuMzMzMzMlfS5jb2x1bW4uaXMtNS13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtNS13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjQxLjY2NjY3JX0uY29sdW1uLmlzLTYtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LTYtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy03LXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC03LXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NTguMzMzMzMlfS5jb2x1bW4uaXMtOC13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtOC13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjY2LjY2NjY3JX0uY29sdW1uLmlzLTktd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LTktd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy0xMC13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMTAtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo4My4zMzMzMyV9LmNvbHVtbi5pcy0xMS13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo5MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMTEtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbi5pcy0xMi13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtb2Zmc2V0LTEyLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6MTAwJX19LmNvbHVtbnN7bWFyZ2luLWxlZnQ6LTAuNzVyZW07bWFyZ2luLXJpZ2h0Oi0wLjc1cmVtO21hcmdpbi10b3A6LTAuNzVyZW19LmNvbHVtbnM6bGFzdC1jaGlsZHttYXJnaW4tYm90dG9tOi0wLjc1cmVtfS5jb2x1bW5zOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfS5jb2x1bW5zLmlzLWNlbnRlcmVke2p1c3RpZnktY29udGVudDpjZW50ZXJ9LmNvbHVtbnMuaXMtZ2FwbGVzc3ttYXJnaW4tbGVmdDowO21hcmdpbi1yaWdodDowO21hcmdpbi10b3A6MH0uY29sdW1ucy5pcy1nYXBsZXNzOmxhc3QtY2hpbGR7bWFyZ2luLWJvdHRvbTowfS5jb2x1bW5zLmlzLWdhcGxlc3M6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0uY29sdW1ucy5pcy1nYXBsZXNzPi5jb2x1bW57bWFyZ2luOjA7cGFkZGluZzowfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuY29sdW1ucy5pcy1ncmlke2ZsZXgtd3JhcDp3cmFwfS5jb2x1bW5zLmlzLWdyaWQ+LmNvbHVtbnttYXgtd2lkdGg6MzMuMzMzMyU7cGFkZGluZzowLjc1cmVtO3dpZHRoOjMzLjMzMzMlfS5jb2x1bW5zLmlzLWdyaWQ+LmNvbHVtbisuY29sdW1ue21hcmdpbi1sZWZ0OjB9fS5jb2x1bW5zLmlzLW1vYmlsZXtkaXNwbGF5OmZsZXh9LmNvbHVtbnMuaXMtbXVsdGlsaW5le2ZsZXgtd3JhcDp3cmFwfS5jb2x1bW5zLmlzLXZjZW50ZXJlZHthbGlnbi1pdGVtczpjZW50ZXJ9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5jb2x1bW5zOm5vdCguaXMtZGVza3RvcCl7ZGlzcGxheTpmbGV4fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5jb2x1bW5zLmlzLWRlc2t0b3B7ZGlzcGxheTpmbGV4fX0udGlsZXthbGlnbi1pdGVtczpzdHJldGNoO2Rpc3BsYXk6YmxvY2s7ZmxleC1iYXNpczowO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7bWluLWhlaWdodDptaW4tY29udGVudH0udGlsZS5pcy1hbmNlc3RvcnttYXJnaW4tbGVmdDotMC43NXJlbTttYXJnaW4tcmlnaHQ6LTAuNzVyZW07bWFyZ2luLXRvcDotMC43NXJlbX0udGlsZS5pcy1hbmNlc3RvcjpsYXN0LWNoaWxke21hcmdpbi1ib3R0b206LTAuNzVyZW19LnRpbGUuaXMtYW5jZXN0b3I6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNzVyZW19LnRpbGUuaXMtY2hpbGR7bWFyZ2luOjAgIWltcG9ydGFudH0udGlsZS5pcy1wYXJlbnR7cGFkZGluZzowLjc1cmVtfS50aWxlLmlzLXZlcnRpY2Fse2ZsZXgtZGlyZWN0aW9uOmNvbHVtbn0udGlsZS5pcy12ZXJ0aWNhbD4udGlsZS5pcy1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtICFpbXBvcnRhbnR9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey50aWxlOm5vdCguaXMtY2hpbGQpe2Rpc3BsYXk6ZmxleH0udGlsZS5pcy0xe2ZsZXg6bm9uZTt3aWR0aDo4LjMzMzMzJX0udGlsZS5pcy0ye2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LnRpbGUuaXMtM3tmbGV4Om5vbmU7d2lkdGg6MjUlfS50aWxlLmlzLTR7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0udGlsZS5pcy01e2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LnRpbGUuaXMtNntmbGV4Om5vbmU7d2lkdGg6NTAlfS50aWxlLmlzLTd7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0udGlsZS5pcy04e2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LnRpbGUuaXMtOXtmbGV4Om5vbmU7d2lkdGg6NzUlfS50aWxlLmlzLTEwe2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LnRpbGUuaXMtMTF7ZmxleDpub25lO3dpZHRoOjkxLjY2NjY3JX0udGlsZS5pcy0xMntmbGV4Om5vbmU7d2lkdGg6MTAwJX19Lmhlcm8tdmlkZW97Ym90dG9tOjA7bGVmdDowO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjA7b3ZlcmZsb3c6aGlkZGVufS5oZXJvLXZpZGVvIHZpZGVve2xlZnQ6NTAlO21pbi1oZWlnaHQ6MTAwJTttaW4td2lkdGg6MTAwJTtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3RyYW5zZm9ybTp0cmFuc2xhdGUzZCgtNTAlLCAtNTAlLCAwKX0uaGVyby12aWRlby5pcy10cmFuc3BhcmVudHtvcGFjaXR5OjAuM31AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8tdmlkZW97ZGlzcGxheTpub25lfX0uaGVyby1idXR0b25ze21hcmdpbi10b3A6MS41cmVtfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby1idXR0b25zIC5idXR0b257ZGlzcGxheTpmbGV4fS5oZXJvLWJ1dHRvbnMgLmJ1dHRvbjpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5oZXJvLWJ1dHRvbnN7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXJ9Lmhlcm8tYnV0dG9ucyAuYnV0dG9uOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0OjEuNXJlbX19Lmhlcm8taGVhZCwuaGVyby1mb290e2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjB9Lmhlcm8tYm9keXtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowO3BhZGRpbmc6M3JlbSAxLjVyZW19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaGVyby1ib2R5e3BhZGRpbmctbGVmdDowO3BhZGRpbmctcmlnaHQ6MH19Lmhlcm97YWxpZ24taXRlbXM6c3RyZXRjaDtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbn0uaGVybyAubmF2e2JhY2tncm91bmQ6bm9uZTtib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyMTksMjE5LDIxOSwwLjMpfS5oZXJvIC50YWJzIHVse2JvcmRlci1ib3R0b206bm9uZX0uaGVyby5pcy13aGl0ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSBhLC5oZXJvLmlzLXdoaXRlIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLXdoaXRlIC50aXRsZXtjb2xvcjojMGEwYTBhfS5oZXJvLmlzLXdoaXRlIC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDEwLDEwLDEwLDAuOSl9Lmhlcm8uaXMtd2hpdGUgLnN1YnRpdGxlIGEsLmhlcm8uaXMtd2hpdGUgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojMGEwYTBhfS5oZXJvLmlzLXdoaXRlIC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMTAsMTAsMTAsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtd2hpdGUgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6I2ZmZn19Lmhlcm8uaXMtd2hpdGUgYS5uYXYtaXRlbSwuaGVyby5pcy13aGl0ZSAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbil7Y29sb3I6cmdiYSgxMCwxMCwxMCwwLjcpfS5oZXJvLmlzLXdoaXRlIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtd2hpdGUgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtd2hpdGUgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pOmhvdmVyLC5oZXJvLmlzLXdoaXRlIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAudGFicyBhe2NvbG9yOiMwYTBhMGE7b3BhY2l0eTowLjl9Lmhlcm8uaXMtd2hpdGUgLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtd2hpdGUgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtd2hpdGUgLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy13aGl0ZSAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2JvcmRlci1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9Lmhlcm8uaXMtd2hpdGUuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICNlNmU2ZTYgMCUsICNmZmYgNzElLCAjZmZmIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy13aGl0ZSAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy13aGl0ZSAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtd2hpdGUgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4yKX19Lmhlcm8uaXMtYmxhY2t7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgYSwuaGVyby5pcy1ibGFjayBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1ibGFjayAudGl0bGV7Y29sb3I6I2ZmZn0uaGVyby5pcy1ibGFjayAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLWJsYWNrIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLWJsYWNrIC5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6I2ZmZn0uaGVyby5pcy1ibGFjayAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWJsYWNrIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGF9fS5oZXJvLmlzLWJsYWNrIGEubmF2LWl0ZW0sLmhlcm8uaXMtYmxhY2sgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC43KX0uaGVyby5pcy1ibGFjayBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLWJsYWNrIGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLWJsYWNrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1ibGFjayAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLnRhYnMgYXtjb2xvcjojZmZmO29wYWNpdHk6MC45fS5oZXJvLmlzLWJsYWNrIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLWJsYWNrIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1ibGFjayAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1ibGFjayAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1ibGFjayAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1ibGFjayAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1ibGFjayAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5oZXJvLmlzLWJsYWNrLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMDAwIDAlLCAjMGEwYTBhIDcxJSwgIzE4MTYxNiAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtYmxhY2sgLm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtYmxhY2sgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWJsYWNrIC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuMil9fS5oZXJvLmlzLWxpZ2h0e2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IGEsLmhlcm8uaXMtbGlnaHQgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtbGlnaHQgLnRpdGxle2NvbG9yOiMzNjM2MzZ9Lmhlcm8uaXMtbGlnaHQgLnN1YnRpdGxle2NvbG9yOnJnYmEoNTQsNTQsNTQsMC45KX0uaGVyby5pcy1saWdodCAuc3VidGl0bGUgYSwuaGVyby5pcy1saWdodCAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiMzNjM2MzZ9Lmhlcm8uaXMtbGlnaHQgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSg1NCw1NCw1NCwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1saWdodCAubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fX0uaGVyby5pcy1saWdodCBhLm5hdi1pdGVtLC5oZXJvLmlzLWxpZ2h0IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuNyl9Lmhlcm8uaXMtbGlnaHQgYS5uYXYtaXRlbTpob3ZlciwuaGVyby5pcy1saWdodCBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1saWdodCAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtbGlnaHQgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pLmlzLWFjdGl2ZXtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC50YWJzIGF7Y29sb3I6IzM2MzYzNjtvcGFjaXR5OjAuOX0uaGVyby5pcy1saWdodCAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1saWdodCAudGFicyBsaS5pcy1hY3RpdmUgYXtvcGFjaXR5OjF9Lmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1saWdodCAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLWJveGVkIGE6aG92ZXIsLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Ym9yZGVyLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1saWdodC5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgI2RmZDhkOCAwJSwgI2Y1ZjVmNSA3MSUsICNmZmYgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWxpZ2h0IC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWxpZ2h0IC5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzM2MzYzNn0uaGVyby5pcy1saWdodCAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSg1NCw1NCw1NCwwLjIpfX0uaGVyby5pcy1kYXJre2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtjb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgYSwuaGVyby5pcy1kYXJrIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLWRhcmsgLnRpdGxle2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNDUsMjQ1LDI0NSwwLjkpfS5oZXJvLmlzLWRhcmsgLnN1YnRpdGxlIGEsLmhlcm8uaXMtZGFyayAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI0NSwyNDUsMjQ1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWRhcmsgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6IzM2MzYzNn19Lmhlcm8uaXMtZGFyayBhLm5hdi1pdGVtLC5oZXJvLmlzLWRhcmsgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjQ1LDI0NSwyNDUsMC43KX0uaGVyby5pcy1kYXJrIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtZGFyayBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1kYXJrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1kYXJrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1kYXJrIC50YWJzIGF7Y29sb3I6I2Y1ZjVmNTtvcGFjaXR5OjAuOX0uaGVyby5pcy1kYXJrIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLWRhcmsgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1kYXJrIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtZGFyayAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1kYXJrIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWRhcmsuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICMxZjE5MTkgMCUsICMzNjM2MzYgNzElLCAjNDYzZjNmIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1kYXJrIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtZGFyayAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNDUsMjQ1LDI0NSwwLjIpfX0uaGVyby5pcy1wcmltYXJ5e2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgYSwuaGVyby5pcy1wcmltYXJ5IHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLXByaW1hcnkgLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLXByaW1hcnkgLnN1YnRpdGxlIGEsLmhlcm8uaXMtcHJpbWFyeSAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXByaW1hcnkgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6IzE4MmI3M319Lmhlcm8uaXMtcHJpbWFyeSBhLm5hdi1pdGVtLC5oZXJvLmlzLXByaW1hcnkgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC43KX0uaGVyby5pcy1wcmltYXJ5IGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtcHJpbWFyeSBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1wcmltYXJ5IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1wcmltYXJ5IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0uaGVyby5pcy1wcmltYXJ5IC50YWJzIGF7Y29sb3I6I2ZmZjtvcGFjaXR5OjAuOX0uaGVyby5pcy1wcmltYXJ5IC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLXByaW1hcnkgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMTgyYjczfS5oZXJvLmlzLXByaW1hcnkuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICMwYjI0NGQgMCUsICMxODJiNzMgNzElLCAjMTgxZDhjIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1wcmltYXJ5IC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtcHJpbWFyeSAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX0uaGVyby5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztjb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gYSwuaGVyby5pcy1pbmZvIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLWluZm8gLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLWluZm8gLnN1YnRpdGxlIGEsLmhlcm8uaXMtaW5mbyAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWluZm8gLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6IzMyNzNkY319Lmhlcm8uaXMtaW5mbyBhLm5hdi1pdGVtLC5oZXJvLmlzLWluZm8gLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC43KX0uaGVyby5pcy1pbmZvIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtaW5mbyBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1pbmZvIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1pbmZvIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0uaGVyby5pcy1pbmZvIC50YWJzIGF7Y29sb3I6I2ZmZjtvcGFjaXR5OjAuOX0uaGVyby5pcy1pbmZvIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLWluZm8gLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLWluZm8gLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1pbmZvIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtaW5mbyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1pbmZvIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMzI3M2RjfS5oZXJvLmlzLWluZm8uaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICMxNTc3YzYgMCUsICMzMjczZGMgNzElLCAjNDM2NmU1IDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1pbmZvIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtaW5mbyAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX0uaGVyby5pcy1zdWNjZXNze2JhY2tncm91bmQtY29sb3I6IzIzZDE2MDtjb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgYSwuaGVyby5pcy1zdWNjZXNzIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLXN1Y2Nlc3MgLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLXN1Y2Nlc3MgLnN1YnRpdGxlIGEsLmhlcm8uaXMtc3VjY2VzcyAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6IzIzZDE2MH19Lmhlcm8uaXMtc3VjY2VzcyBhLm5hdi1pdGVtLC5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC43KX0uaGVyby5pcy1zdWNjZXNzIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtc3VjY2VzcyBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1zdWNjZXNzIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1zdWNjZXNzIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0uaGVyby5pcy1zdWNjZXNzIC50YWJzIGF7Y29sb3I6I2ZmZjtvcGFjaXR5OjAuOX0uaGVyby5pcy1zdWNjZXNzIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMjNkMTYwfS5oZXJvLmlzLXN1Y2Nlc3MuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICMxMmFmMmYgMCUsICMyM2QxNjAgNzElLCAjMmNlMjhhIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1zdWNjZXNzIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtc3VjY2VzcyAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX0uaGVyby5pcy13YXJuaW5ne2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1Nztjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyBhLC5oZXJvLmlzLXdhcm5pbmcgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtd2FybmluZyAudGl0bGV7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLnN1YnRpdGxle2NvbG9yOnJnYmEoMCwwLDAsMC45KX0uaGVyby5pcy13YXJuaW5nIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLXdhcm5pbmcgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDAsMCwwLDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXdhcm5pbmcgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1N319Lmhlcm8uaXMtd2FybmluZyBhLm5hdi1pdGVtLC5oZXJvLmlzLXdhcm5pbmcgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtd2FybmluZyBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy13YXJuaW5nIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy13YXJuaW5nIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLnRhYnMgYXtjb2xvcjpyZ2JhKDAsMCwwLDAuNyk7b3BhY2l0eTowLjl9Lmhlcm8uaXMtd2FybmluZyAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy13YXJuaW5nIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtd2FybmluZyAudGFicy5pcy10b2dnbGUgYXtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtd2FybmluZyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgwLDAsMCwwLjcpO2JvcmRlci1jb2xvcjpyZ2JhKDAsMCwwLDAuNyk7Y29sb3I6I2ZmZGQ1N30uaGVyby5pcy13YXJuaW5nLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjZmZhZjI0IDAlLCAjZmZkZDU3IDcxJSwgI2ZmZmE3MCAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtd2FybmluZyAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtd2FybmluZyAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDAsMCwwLDAuMil9fS5oZXJvLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtjb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciBhLC5oZXJvLmlzLWRhbmdlciBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1kYW5nZXIgLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtZGFuZ2VyIC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuOSl9Lmhlcm8uaXMtZGFuZ2VyIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLWRhbmdlciAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtZGFuZ2VyIC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtZGFuZ2VyIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOnJlZH19Lmhlcm8uaXMtZGFuZ2VyIGEubmF2LWl0ZW0sLmhlcm8uaXMtZGFuZ2VyIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuNyl9Lmhlcm8uaXMtZGFuZ2VyIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtZGFuZ2VyIGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLWRhbmdlciAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtZGFuZ2VyIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0uaGVyby5pcy1kYW5nZXIgLnRhYnMgYXtjb2xvcjojZmZmO29wYWNpdHk6MC45fS5oZXJvLmlzLWRhbmdlciAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1kYW5nZXIgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLWRhbmdlciAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6cmVkfS5oZXJvLmlzLWRhbmdlci5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgI2MwMiAwJSwgcmVkIDcxJSwgI2ZmNDAxYSAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtZGFuZ2VyIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1kYW5nZXIgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7Lmhlcm8uaXMtbWVkaXVtIC5oZXJvLWJvZHl7cGFkZGluZy1ib3R0b206OXJlbTtwYWRkaW5nLXRvcDo5cmVtfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7Lmhlcm8uaXMtbGFyZ2UgLmhlcm8tYm9keXtwYWRkaW5nLWJvdHRvbToxOHJlbTtwYWRkaW5nLXRvcDoxOHJlbX19Lmhlcm8uaXMtZnVsbGhlaWdodHttaW4taGVpZ2h0OjEwMHZofS5oZXJvLmlzLWZ1bGxoZWlnaHQgLmhlcm8tYm9keXthbGlnbi1pdGVtczpjZW50ZXI7ZGlzcGxheTpmbGV4fS5oZXJvLmlzLWZ1bGxoZWlnaHQgLmhlcm8tYm9keT4uY29udGFpbmVye2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjF9LnNlY3Rpb257YmFja2dyb3VuZC1jb2xvcjojZmZmO3BhZGRpbmc6M3JlbSAxLjVyZW19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuc2VjdGlvbi5pcy1tZWRpdW17cGFkZGluZzo5cmVtIDEuNXJlbX0uc2VjdGlvbi5pcy1sYXJnZXtwYWRkaW5nOjE4cmVtIDEuNXJlbX19LmZvb3RlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7cGFkZGluZzozcmVtIDEuNXJlbSA2cmVtfS5oZWFkZXIuaXMtZml4ZWQtdG9we3otaW5kZXg6MTAzMDtwb3NpdGlvbjpmaXhlZDt0b3A6MDtsZWZ0OjA7cmlnaHQ6MH0uaGFzLWZpeGVkLW5hdnttYXJnaW4tdG9wOjUwcHh9LnNlY3Rpb24uaXMtc21hbGx7cGFkZGluZzoxcmVtIDEuNXJlbX0ubmF2LWludmVyc2V7YmFja2dyb3VuZDojMTgyYjczfS5uYXYtaW52ZXJzZSBhLm5hdi1pdGVte2NvbG9yOiNmMmYyZjJ9Lm5hdi1pbnZlcnNlIGEubmF2LWl0ZW06aG92ZXJ7Y29sb3I6I2QxZDVlM30ubmF2LWludmVyc2UgYS5uYXYtaXRlbS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0ubmF2LWludmVyc2UgYS5uYXYtaXRlbS5pcy10YWI6aG92ZXJ7Ym9yZGVyLWJvdHRvbS1jb2xvcjojZmZmfS5uYXYtaW52ZXJzZSBhLm5hdi1pdGVtLmlzLXRhYi5pcy1hY3RpdmV7Ym9yZGVyLWJvdHRvbTozcHggc29saWQgI2ZmZjtjb2xvcjojZmZmfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlcntwb3NpdGlvbjpmaXhlZDt0b3A6MDtib3R0b206MDt6LWluZGV4OjEwNDA7b3ZlcmZsb3cteTphdXRvO3RleHQtYWxpZ246Y2VudGVyO2JhY2tncm91bmQ6IzE4MmI3Mztjb2xvcjojZmZmO2xlZnQ6LTI1MHB4O3dpZHRoOjI1MHB4O3RyYW5zaXRpb246bGVmdCAwLjVzfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlci5pcy1hY3RpdmV7bGVmdDowfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlciAubmF2LWl0ZW17Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpibG9jaztwYWRkaW5nLXRvcDoxMHB4O3BhZGRpbmctYm90dG9tOjlweDtiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsMC4xKX0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgLm5hdi1pdGVtLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCh0byByaWdodCwgcmdiYSgyNTUsMjU1LDI1NSwwLjQpLCByZ2JhKDI1NSwyNTUsMjU1LDAuMSkgNSUpfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlciAubmF2LWl0ZW1bb3Blbl0+c3VtbWFyeXttYXJnaW4tYm90dG9tOjlweH0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgLm5hdi1pdGVtOm5vdCg6bGFzdC1jaGlsZCl7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2ZmZn0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgfiAuaXMtb3ZlcmxheXtiYWNrZ3JvdW5kOnJnYmEoMCwwLDAsMC41KTt6LWluZGV4OjEwMzU7dmlzaWJpbGl0eTpoaWRkZW47cG9zaXRpb246Zml4ZWQ7b3BhY2l0eTowO3RyYW5zaXRpb246b3BhY2l0eSAwLjc1c30ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIuaXMtYWN0aXZlIH4gLmlzLW92ZXJsYXl7dmlzaWJpbGl0eTp2aXNpYmxlO29wYWNpdHk6MX0jY29udGFpbmVyPmRpdjpub3QoLnZpc2libGUpe2Rpc3BsYXk6bm9uZX1cXG5cIiArXHJcbiAgICAnPC9zdHlsZT4nO1xyXG5cclxuLy8gU2hvdyB0aGUgbWVudSB3aGVuIGNsaWNraW5nIG9uIHRoZSBtZW51IGJ1dHRvblxyXG5BcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5uYXYtc2xpZGVyLXRvZ2dsZScpKVxyXG4gICAgLmZvckVhY2goZWwgPT4gZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0b2dnbGVNZW51KSk7XHJcblxyXG4vLyBIaWRlIHRoZSBtZW51IHdoZW4gY2xpY2tpbmcgdGhlIG92ZXJsYXlcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm5hdi1zbGlkZXItY29udGFpbmVyIC5pcy1vdmVybGF5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0b2dnbGVNZW51KTtcclxuXHJcbi8vIENoYW5nZSB0YWJzXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlcicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gZ2xvYmFsVGFiQ2hhbmdlKGV2ZW50KSB7XHJcbiAgICB2YXIgdGFiTmFtZSA9IGV2ZW50LnRhcmdldC5kYXRhc2V0LnRhYk5hbWU7XHJcbiAgICB2YXIgdGFiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2NvbnRhaW5lciA+IFtkYXRhLXRhYi1uYW1lPSR7dGFiTmFtZX1dYCk7XHJcbiAgICBpZighdGFiTmFtZSB8fCAhdGFiKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQ29udGVudFxyXG4gICAgLy9XZSBjYW4ndCBqdXN0IHJlbW92ZSB0aGUgZmlyc3QgZHVlIHRvIGJyb3dzZXIgbGFnXHJcbiAgICBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNjb250YWluZXIgPiAudmlzaWJsZScpKVxyXG4gICAgICAgIC5mb3JFYWNoKGVsID0+IGVsLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2libGUnKSk7XHJcbiAgICB0YWIuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xyXG5cclxuICAgIC8vVGFic1xyXG4gICAgQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgLmlzLWFjdGl2ZScpKVxyXG4gICAgICAgIC5mb3JFYWNoKGVsID0+IGVsLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLWFjdGl2ZScpKTtcclxuICAgIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuYWRkKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICBob29rLmZpcmUoJ3VpLnRhYlNob3duJywgdGFiKTtcclxufSk7XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzaG93L2hpZGUgdGhlIG1lbnUuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHRvZ2dsZU1lbnUoKTtcclxuICovXHJcbmZ1bmN0aW9uIHRvZ2dsZU1lbnUoKSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXInKS5jbGFzc0xpc3QudG9nZ2xlKCdpcy1hY3RpdmUnKTtcclxufVxyXG5cclxudmFyIHRhYlVJRCA9IDA7XHJcbi8qKlxyXG4gKiBVc2VkIHRvIGFkZCBhIHRhYiB0byB0aGUgYm90J3MgbmF2aWdhdGlvbi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHRhYiA9IHVpLmFkZFRhYignVGV4dCcpO1xyXG4gKiB2YXIgdGFiMiA9IHVpLmFkZFRhYignQ3VzdG9tIE1lc3NhZ2VzJywgJ21lc3NhZ2VzJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWJUZXh0XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZ3JvdXBOYW1lPW1haW5dIE9wdGlvbmFsLiBJZiBwcm92aWRlZCwgdGhlIG5hbWUgb2YgdGhlIGdyb3VwIG9mIHRhYnMgdG8gYWRkIHRoaXMgdGFiIHRvLlxyXG4gKiBAcmV0dXJuIHtOb2RlfSAtIFRoZSBkaXYgdG8gcGxhY2UgdGFiIGNvbnRlbnQgaW4uXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRUYWIodGFiVGV4dCwgZ3JvdXBOYW1lID0gJ21haW4nKSB7XHJcbiAgICB2YXIgdGFiTmFtZSA9ICdib3RUYWJfJyArIHRhYlVJRCsrO1xyXG5cclxuICAgIHZhciB0YWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICB0YWIudGV4dENvbnRlbnQgPSB0YWJUZXh0O1xyXG4gICAgdGFiLmNsYXNzTGlzdC5hZGQoJ25hdi1pdGVtJyk7XHJcbiAgICB0YWIuZGF0YXNldC50YWJOYW1lID0gdGFiTmFtZTtcclxuXHJcbiAgICB2YXIgdGFiQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGFiQ29udGVudC5kYXRhc2V0LnRhYk5hbWUgPSB0YWJOYW1lO1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5uYXYtc2xpZGVyLWNvbnRhaW5lciBbZGF0YS10YWItZ3JvdXA9JHtncm91cE5hbWV9XWApLmFwcGVuZENoaWxkKHRhYik7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY29udGFpbmVyJykuYXBwZW5kQ2hpbGQodGFiQ29udGVudCk7XHJcblxyXG4gICAgcmV0dXJuIHRhYkNvbnRlbnQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIGdsb2JhbCB0YWIuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB0YWIgPSB1aS5hZGRUYWIoJ1RhYicpO1xyXG4gKiB1aS5yZW1vdmVUYWIodGFiKTtcclxuICogQHBhcmFtIHtOb2RlfSB0YWJDb250ZW50IFRoZSBkaXYgcmV0dXJuZWQgYnkgdGhlIGFkZFRhYiBmdW5jdGlvbi5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZVRhYih0YWJDb250ZW50KSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAubmF2LXNsaWRlci1jb250YWluZXIgW2RhdGEtdGFiLW5hbWU9JHt0YWJDb250ZW50LmRhdGFzZXQudGFiTmFtZX1dYCkucmVtb3ZlKCk7XHJcbiAgICB0YWJDb250ZW50LnJlbW92ZSgpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSB0YWIgZ3JvdXAgaW4gd2hpY2ggdGFicyBjYW4gYmUgcGxhY2VkLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1aS5hZGRUYWJHcm91cCgnR3JvdXAgVGV4dCcsICdzb21lX2dyb3VwJyk7XHJcbiAqIHVpLmFkZFRhYignV2l0aGluIGdyb3VwJywgJ3NvbWVfZ3JvdXAnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBUaGUgdGV4dCB0aGUgdXNlciB3aWxsIHNlZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZ3JvdXBOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGdyb3VwIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGFkZCB0YWJzIHdpdGhpbiB0aGUgZ3JvdXAuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyZW50ID0gbWFpbl0gLSBUaGUgbmFtZSBvZiB0aGUgcGFyZW50IGdyb3VwLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkVGFiR3JvdXAodGV4dCwgZ3JvdXBOYW1lLCBwYXJlbnQgPSAnbWFpbicpIHtcclxuICAgIHZhciBkZXRhaWxzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGV0YWlscycpO1xyXG4gICAgZGV0YWlscy5jbGFzc0xpc3QuYWRkKCduYXYtaXRlbScpO1xyXG4gICAgZGV0YWlscy5kYXRhc2V0LnRhYkdyb3VwID0gZ3JvdXBOYW1lO1xyXG5cclxuICAgIHZhciBzdW1tYXJ5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3VtbWFyeScpO1xyXG4gICAgc3VtbWFyeS50ZXh0Q29udGVudCA9IHRleHQ7XHJcbiAgICBkZXRhaWxzLmFwcGVuZENoaWxkKHN1bW1hcnkpO1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5uYXYtc2xpZGVyLWNvbnRhaW5lciBbZGF0YS10YWItZ3JvdXA9XCIke3BhcmVudH1cIl1gKS5hcHBlbmRDaGlsZChkZXRhaWxzKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgdGFiIGdyb3VwIGFuZCBhbGwgdGFicyBjb250YWluZWQgd2l0aGluIHRoZSBzcGVjaWZpZWQgZ3JvdXAuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGFkZFRhYkdyb3VwKCdHcm91cCcsICdncm91cDEnKTtcclxuICogdmFyIGlubmVyID0gYWRkVGFiKCdJbm5lcicsICdncm91cDEnKTtcclxuICogcmVtb3ZlVGFiR3JvdXAoJ2dyb3VwMScpOyAvLyBpbm5lciBoYXMgYmVlbiByZW1vdmVkLlxyXG4gKiBAcGFyYW0gc3RyaW5nIGdyb3VwTmFtZSB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAgdGhhdCB3YXMgdXNlZCBpbiB1aS5hZGRUYWJHcm91cC5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZVRhYkdyb3VwKGdyb3VwTmFtZSkge1xyXG4gICAgdmFyIGdyb3VwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLm5hdi1zbGlkZXItY29udGFpbmVyIFtkYXRhLXRhYi1ncm91cD1cIiR7Z3JvdXBOYW1lfVwiXWApO1xyXG4gICAgdmFyIGl0ZW1zID0gQXJyYXkuZnJvbShncm91cC5xdWVyeVNlbGVjdG9yQWxsKCdzcGFuJykpO1xyXG5cclxuICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgLy9UYWIgY29udGVudFxyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNjb250YWluZXIgPiBbZGF0YS10YWItbmFtZT1cIiR7aXRlbS5kYXRhc2V0LnRhYk5hbWV9XCJdYCkucmVtb3ZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBncm91cC5yZW1vdmUoKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0b2dnbGVNZW51LFxyXG4gICAgYWRkVGFiLFxyXG4gICAgcmVtb3ZlVGFiLFxyXG4gICAgYWRkVGFiR3JvdXAsXHJcbiAgICByZW1vdmVUYWJHcm91cCxcclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBhbGVydFxyXG59O1xyXG5cclxudmFyIG1vZGFsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0Jyk7XHJcblxyXG4vKipcclxuKiBGdW5jdGlvbiB1c2VkIHRvIHJlcXVpcmUgYWN0aW9uIGZyb20gdGhlIHVzZXIuXHJcbipcclxuKiBAcGFyYW0ge1N0cmluZ30gaHRtbCB0aGUgaHRtbCB0byBkaXNwbGF5IGluIHRoZSBhbGVydFxyXG4qIEBwYXJhbSB7QXJyYXl9IGJ1dHRvbnMgYW4gYXJyYXkgb2YgYnV0dG9ucyB0byBhZGQgdG8gdGhlIGFsZXJ0LlxyXG4qICAgICAgICBGb3JtYXQ6IFt7dGV4dDogJ1Rlc3QnLCBzdHlsZTonaXMtc3VjY2VzcycsIGFjdGlvbjogZnVuY3Rpb24oKXt9LCB0aGlzQXJnOiB3aW5kb3csIGRpc21pc3M6IGZhbHNlfV1cclxuKiAgICAgICAgTm90ZTogdGV4dCBpcyB0aGUgb25seSByZXF1aXJlZCBwYXJhbWF0ZXIuIElmIG5vIGJ1dHRvbiBhcnJheSBpcyBzcGVjaWZpZWRcclxuKiAgICAgICAgdGhlbiBhIHNpbmdsZSBPSyBidXR0b24gd2lsbCBiZSBzaG93bi5cclxuKiAgICAgICAgc3R5bGUgY2FuIGFsc28gYmUgYW4gYXJyYXkgb2YgY2xhc3NlcyB0byBhZGQuXHJcbiogICAgICAgIERlZmF1bHRzOiBzdHlsZTogJycsIGFjdGlvbjogdW5kZWZpbmVkLCB0aGlzQXJnOiB1bmRlZmluZWQsIGRpc21pc3M6IHRydWVcclxuKi9cclxuZnVuY3Rpb24gYWxlcnQoaHRtbCwgYnV0dG9ucyA9IFt7dGV4dDogJ09LJ31dKSB7XHJcbiAgICBpZiAoaW5zdGFuY2UuYWN0aXZlKSB7XHJcbiAgICAgICAgaW5zdGFuY2UucXVldWUucHVzaCh7aHRtbCwgYnV0dG9uc30pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGluc3RhbmNlLmFjdGl2ZSA9IHRydWU7XHJcblxyXG4gICAgYnV0dG9ucy5mb3JFYWNoKGZ1bmN0aW9uKGJ1dHRvbiwgaSkge1xyXG4gICAgICAgIGJ1dHRvbi5kaXNtaXNzID0gKGJ1dHRvbi5kaXNtaXNzID09PSBmYWxzZSkgPyBmYWxzZSA6IHRydWU7XHJcbiAgICAgICAgaW5zdGFuY2UuYnV0dG9uc1snYnV0dG9uXycgKyBpXSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiBidXR0b24uYWN0aW9uLFxyXG4gICAgICAgICAgICB0aGlzQXJnOiBidXR0b24udGhpc0FyZyB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIGRpc21pc3M6IHR5cGVvZiBidXR0b24uZGlzbWlzcyA9PSAnYm9vbGVhbicgPyBidXR0b24uZGlzbWlzcyA6IHRydWUsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBidXR0b24uaWQgPSAnYnV0dG9uXycgKyBpO1xyXG4gICAgICAgIGJ1aWxkQnV0dG9uKGJ1dHRvbik7XHJcbiAgICB9KTtcclxuICAgIG1vZGFsLnF1ZXJ5U2VsZWN0b3IoJy5tb2RhbC1jYXJkLWJvZHknKS5pbm5lckhUTUwgPSBodG1sO1xyXG5cclxuICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ2lzLWFjdGl2ZScpO1xyXG59XHJcblxyXG4vKipcclxuICogSG9sZHMgdGhlIGN1cnJlbnQgYWxlcnQgYW5kIHF1ZXVlIG9mIGZ1cnRoZXIgYWxlcnRzLlxyXG4gKi9cclxudmFyIGluc3RhbmNlID0ge1xyXG4gICAgYWN0aXZlOiBmYWxzZSxcclxuICAgIHF1ZXVlOiBbXSxcclxuICAgIGJ1dHRvbnM6IHt9LFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gYWRkIGJ1dHRvbiBlbGVtZW50cyB0byBhbiBhbGVydC5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IGJ1dHRvblxyXG4gKi9cclxuZnVuY3Rpb24gYnVpbGRCdXR0b24oYnV0dG9uKSB7XHJcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICBlbC5pbm5lckhUTUwgPSBidXR0b24udGV4dDtcclxuXHJcbiAgICBlbC5jbGFzc0xpc3QuYWRkKCdidXR0b24nKTtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KGJ1dHRvbi5zdHlsZSkpIHtcclxuICAgICAgICBidXR0b24uc3R5bGUuZm9yRWFjaChzdHlsZSA9PiBlbC5jbGFzc0xpc3QuYWRkKHN0eWxlKSk7XHJcbiAgICB9IGVsc2UgaWYgKGJ1dHRvbi5zdHlsZSkge1xyXG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoYnV0dG9uLnN0eWxlKTtcclxuICAgIH1cclxuXHJcbiAgICBlbC5pZCA9IGJ1dHRvbi5pZDtcclxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYnV0dG9uSGFuZGxlcik7XHJcbiAgICBtb2RhbC5xdWVyeVNlbGVjdG9yKCcubW9kYWwtY2FyZC1mb290JykuYXBwZW5kQ2hpbGQoZWwpO1xyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIHRoZSBmdW5jdGlvbmFsaXR5IG9mIGVhY2ggYnV0dG9uIGFkZGVkIHRvIGFuIGFsZXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50XHJcbiAqL1xyXG5mdW5jdGlvbiBidXR0b25IYW5kbGVyKGV2ZW50KSB7XHJcbiAgICB2YXIgYnV0dG9uID0gaW5zdGFuY2UuYnV0dG9uc1tldmVudC50YXJnZXQuaWRdIHx8IHt9O1xyXG4gICAgaWYgKHR5cGVvZiBidXR0b24uYWN0aW9uID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBidXR0b24uYWN0aW9uLmNhbGwoYnV0dG9uLnRoaXNBcmcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vUmVxdWlyZSB0aGF0IHRoZXJlIGJlIGFuIGFjdGlvbiBhc29jaWF0ZWQgd2l0aCBuby1kaXNtaXNzIGJ1dHRvbnMuXHJcbiAgICBpZiAoYnV0dG9uLmRpc21pc3MgfHwgdHlwZW9mIGJ1dHRvbi5hY3Rpb24gIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIG1vZGFsLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIG1vZGFsLnF1ZXJ5U2VsZWN0b3IoJy5tb2RhbC1jYXJkLWZvb3QnKS5pbm5lckhUTUwgPSAnJztcclxuICAgICAgICBpbnN0YW5jZS5idXR0b25zID0ge307XHJcbiAgICAgICAgaW5zdGFuY2UuYWN0aXZlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIEFyZSBtb3JlIGFsZXJ0cyB3YWl0aW5nIHRvIGJlIHNob3duP1xyXG4gICAgICAgIGlmIChpbnN0YW5jZS5xdWV1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgbGV0IG5leHQgPSBpbnN0YW5jZS5xdWV1ZS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBhbGVydChuZXh0Lmh0bWwsIG5leHQuYnV0dG9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiIsIlxyXG5cclxudmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbmVsLmlubmVySFRNTCA9IFwiPGRpdiBpZD1cXFwiYWxlcnRcXFwiIGNsYXNzPVxcXCJtb2RhbFxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcIm1vZGFsLWJhY2tncm91bmRcXFwiPjwvZGl2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJtb2RhbC1jYXJkXFxcIj5cXHJcXG4gICAgICAgIDxoZWFkZXIgY2xhc3M9XFxcIm1vZGFsLWNhcmQtaGVhZFxcXCI+PC9oZWFkZXI+XFxyXFxuICAgICAgICA8c2VjdGlvbiBjbGFzcz1cXFwibW9kYWwtY2FyZC1ib2R5XFxcIj48L3NlY3Rpb24+XFxyXFxuICAgICAgICA8Zm9vdGVyIGNsYXNzPVxcXCJtb2RhbC1jYXJkLWZvb3RcXFwiPjwvZm9vdGVyPlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbmVsLmlubmVySFRNTCA9IFwiLmJvdC1ub3RpZmljYXRpb257cG9zaXRpb246Zml4ZWQ7dG9wOjAuNmVtO3JpZ2h0OjFlbTt6LWluZGV4OjEwMzU7bWluLXdpZHRoOjIwMHB4O2JvcmRlci1yYWRpdXM6NXB4O3BhZGRpbmc6NXB4O2JhY2tncm91bmQ6I2ZmZjtjb2xvcjojMTgyYjczO29wYWNpdHk6MDt0cmFuc2l0aW9uOm9wYWNpdHkgMXN9LmJvdC1ub3RpZmljYXRpb24uaXMtYWN0aXZle29wYWNpdHk6MX1cXG5cIjtcclxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG5PYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2FsZXJ0JyksXHJcbiAgICByZXF1aXJlKCcuL25vdGlmeScpXHJcbik7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbm90aWZ5LFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2VuZCBhIG5vbi1jcml0aWNhbCBhbGVydCB0byB0aGUgdXNlci5cclxuICogU2hvdWxkIGJlIHVzZWQgaW4gcGxhY2Ugb2YgdWkuYWxlcnQgaWYgcG9zc2libGUgYXMgaXQgaXMgbm9uLWJsb2NraW5nLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL1Nob3dzIGEgbm90ZmljYXRpb24gZm9yIDIgc2Vjb25kc1xyXG4gKiB1aS5ub3RpZnkoJ05vdGlmaWNhdGlvbicpO1xyXG4gKiAvL1Nob3dzIGEgbm90aWZpY2F0aW9uIGZvciA1IHNlY29uZHNcclxuICogdWkubm90aWZ5KCdOb3RpZmljYXRpb24nLCA1KTtcclxuICogQHBhcmFtIHtTdHJpbmd9IHRleHQgdGhlIHRleHQgdG8gZGlzcGxheS4gU2hvdWxkIGJlIGtlcHQgc2hvcnQgdG8gYXZvaWQgdmlzdWFsbHkgYmxvY2tpbmcgdGhlIG1lbnUgb24gc21hbGwgZGV2aWNlcy5cclxuICogQHBhcmFtIHtOdW1iZXJ9IGRpc3BsYXlUaW1lIHRoZSBudW1iZXIgb2Ygc2Vjb25kcyB0byBzaG93IHRoZSBub3RpZmljYXRpb24gZm9yLlxyXG4gKi9cclxuZnVuY3Rpb24gbm90aWZ5KHRleHQsIGRpc3BsYXlUaW1lID0gMikge1xyXG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICBlbC5jbGFzc0xpc3QuYWRkKCdib3Qtbm90aWZpY2F0aW9uJywgJ2lzLWFjdGl2ZScpO1xyXG4gICAgZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XHJcbiAgICB2YXIgdGltZW91dHMgPSBbXHJcbiAgICAgICAgLy8gRmFkZSBvdXQgYWZ0ZXIgZGlzcGxheVRpbWVcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIH0uYmluZChlbCksIGRpc3BsYXlUaW1lICogMTAwMCksXHJcbiAgICAgICAgLy8gUmVtb3ZlIGFmdGVyIGZhZGUgb3V0XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmUoKTtcclxuICAgICAgICB9LmJpbmQoZWwpLCBkaXNwbGF5VGltZSAqIDEwMDAgKyAyMTAwKVxyXG4gICAgXTtcclxuXHJcblxyXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aW1lb3V0cy5mb3JFYWNoKGNsZWFyVGltZW91dCk7XHJcbiAgICAgICAgdGhpcy5yZW1vdmUoKTtcclxuICAgIH0pO1xyXG59XHJcbiIsIi8vRGV0YWlscyBwb2x5ZmlsbCwgb2xkZXIgZmlyZWZveCwgSUVcclxuaWYgKCEoJ29wZW4nIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKSkpIHtcclxuICAgIGxldCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbiAgICBzdHlsZS50ZXh0Q29udGVudCArPSBgZGV0YWlsczpub3QoW29wZW5dKSA+IDpub3Qoc3VtbWFyeSkgeyBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH0gZGV0YWlscyA+IHN1bW1hcnk6YmVmb3JlIHsgY29udGVudDogXCLilrZcIjsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBmb250LXNpemU6IC44ZW07IHdpZHRoOiAxLjVlbTsgZm9udC1mYW1pbHk6XCJDb3VyaWVyIE5ld1wiOyB9IGRldGFpbHNbb3Blbl0gPiBzdW1tYXJ5OmJlZm9yZSB7IHRyYW5zZm9ybTogcm90YXRlKDkwZGVnKTsgfWA7XHJcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcclxuXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC50YXJnZXQudGFnTmFtZSA9PSAnU1VNTUFSWScpIHtcclxuICAgICAgICAgICAgbGV0IGRldGFpbHMgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZGV0YWlscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZGV0YWlscy5nZXRBdHRyaWJ1dGUoJ29wZW4nKSkge1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5vcGVuID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLnJlbW92ZUF0dHJpYnV0ZSgnb3BlbicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5vcGVuID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMuc2V0QXR0cmlidXRlKCdvcGVuJywgJ29wZW4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsIi8vIElFIEZpeFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0ZW1wbGF0ZSkge1xyXG4gICAgaWYgKCEoJ2NvbnRlbnQnIGluIHRlbXBsYXRlKSkge1xyXG4gICAgICAgIGxldCBjb250ZW50ID0gdGVtcGxhdGUuY2hpbGROb2RlcztcclxuICAgICAgICBsZXQgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29udGVudC5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChjb250ZW50W2pdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRlbXBsYXRlLmNvbnRlbnQgPSBmcmFnbWVudDtcclxuICAgIH1cclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBidWlsZENvbnRlbnRGcm9tVGVtcGxhdGUsXHJcbn07XHJcblxyXG52YXIgcG9seWZpbGwgPSByZXF1aXJlKCd1aS9wb2x5ZmlsbHMvdGVtcGxhdGUnKTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNsb25lIGEgdGVtcGxhdGUgYWZ0ZXIgYWx0ZXJpbmcgdGhlIHByb3ZpZGVkIHJ1bGVzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyN0ZW1wbGF0ZScsICcjdGFyZ2V0JywgW3tzZWxlY3RvcjogJ2lucHV0JywgdmFsdWU6ICdWYWx1ZSd9XSk7XHJcbiAqIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgndGVtcGxhdGUnLCAnZGl2JywgW3tzZWxlY3RvcjogJ2EnLCByZW1vdmU6IFsnaHJlZiddLCBtdWx0aXBsZTogdHJ1ZX1dKTtcclxuICogQHBhcmFtIHtTdHJpbmd8Tm9kZX0gdGVtcGxhdGVcclxuICogQHBhcmFtIHtTdHJpbmd8Tm9kZX0gdGFyZ2V0XHJcbiAqIEBwYXJhbSB7QXJyYXl9IHJ1bGVzIGZvcm1hdDogYXJyYXkgb2Ygb2JqZWN0c1xyXG4gKiAgICAgIGVhY2ggb2JqZWN0IG11c3QgaGF2ZSBcInNlbGVjdG9yXCIuXHJcbiAqICAgICAgZWFjaCBvYmplY3QgY2FuIGhhdmUgXCJtdWx0aXBsZVwiIHNldCB0byB1cGRhdGUgYWxsIG1hdGNoaW5nIGVsZW1lbnRzLlxyXG4gKiAgICAgIGVhY2ggb2JqZWN0IGNhbiBoYXZlIFwicmVtb3ZlXCIgLSBhbiBhcnJheSBvZiBhdHRyaWJ1dGVzIHRvIHJlbW92ZS5cclxuICogICAgICBlYWNoIG9iamVjdCBjYW4gaGF2ZSBcInRleHRcIiBvciBcImh0bWxcIiAtIGZ1cnRoZXIga2V5cyB3aWxsIGJlIHNldCBhcyBhdHRyaWJ1dGVzLlxyXG4gKiAgICAgIGlmIGJvdGggdGV4dCBhbmQgaHRtbCBhcmUgc2V0LCB0ZXh0IHdpbGwgdGFrZSBwcmVjZW5kZW5jZS5cclxuICogICAgICBydWxlcyB3aWxsIGJlIHBhcnNlZCBpbiB0aGUgb3JkZXIgdGhhdCB0aGV5IGFyZSBwcmVzZW50IGluIHRoZSBhcnJheS5cclxuICovXHJcbmZ1bmN0aW9uIGJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSh0ZW1wbGF0ZSwgdGFyZ2V0LCBydWxlcyA9IFtdKSB7XHJcbiAgICBpZiAodHlwZW9mIHRlbXBsYXRlID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRlbXBsYXRlKTtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdGFyZ2V0ID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgdGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0YXJnZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHBvbHlmaWxsKHRlbXBsYXRlKTtcclxuXHJcbiAgICB2YXIgY29udGVudCA9IHRlbXBsYXRlLmNvbnRlbnQ7XHJcblxyXG4gICAgcnVsZXMuZm9yRWFjaChydWxlID0+IGhhbmRsZVJ1bGUoY29udGVudCwgcnVsZSkpO1xyXG5cclxuICAgIHRhcmdldC5hcHBlbmRDaGlsZChkb2N1bWVudC5pbXBvcnROb2RlKGNvbnRlbnQsIHRydWUpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGFwcGx5IHJ1bGVzIHRvIHRoZSB0ZW1wbGF0ZS5cclxuICpcclxuICogQHBhcmFtIHtOb2RlfSBjb250ZW50IC0gdGhlIGNvbnRlbnQgb2YgdGhlIHRlbXBsYXRlLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcnVsZSAtIHRoZSBydWxlIHRvIGFwcGx5LlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlUnVsZShjb250ZW50LCBydWxlKSB7XHJcbiAgICBpZiAocnVsZS5tdWx0aXBsZSkge1xyXG4gICAgICAgIGxldCBlbHMgPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3JBbGwocnVsZS5zZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIEFycmF5LmZyb20oZWxzKVxyXG4gICAgICAgICAgICAuZm9yRWFjaChlbCA9PiB1cGRhdGVFbGVtZW50KGVsLCBydWxlKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxldCBlbCA9IGNvbnRlbnQucXVlcnlTZWxlY3RvcihydWxlLnNlbGVjdG9yKTtcclxuICAgICAgICBpZiAoIWVsKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgVW5hYmxlIHRvIHVwZGF0ZSAke3J1bGUuc2VsZWN0b3J9LmAsIHJ1bGUpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGVFbGVtZW50KGVsLCBydWxlKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIHVwZGF0ZSBhbiBlbGVtZW50IHdpdGggYSBydWxlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge05vZGV9IGVsIHRoZSBlbGVtZW50IHRvIGFwcGx5IHRoZSBydWxlcyB0by5cclxuICogQHBhcmFtIHtPYmplY3R9IHJ1bGUgdGhlIHJ1bGUgb2JqZWN0LlxyXG4gKi9cclxuZnVuY3Rpb24gdXBkYXRlRWxlbWVudChlbCwgcnVsZSkge1xyXG4gICAgaWYgKCd0ZXh0JyBpbiBydWxlKSB7XHJcbiAgICAgICAgZWwudGV4dENvbnRlbnQgPSBydWxlLnRleHQ7XHJcbiAgICB9IGVsc2UgaWYgKCdodG1sJyBpbiBydWxlKSB7XHJcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gcnVsZS5odG1sO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5rZXlzKHJ1bGUpXHJcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gIVsnc2VsZWN0b3InLCAndGV4dCcsICdodG1sJywgJ3JlbW92ZScsICdtdWx0aXBsZSddLmluY2x1ZGVzKGtleSkpXHJcbiAgICAgICAgLmZvckVhY2goa2V5ID0+IGVsLnNldEF0dHJpYnV0ZShrZXksIHJ1bGVba2V5XSkpO1xyXG5cclxuICAgIGlmIChBcnJheS5pc0FycmF5KHJ1bGUucmVtb3ZlKSkge1xyXG4gICAgICAgIHJ1bGUucmVtb3ZlLmZvckVhY2goa2V5ID0+IGVsLnJlbW92ZUF0dHJpYnV0ZShrZXkpKTtcclxuICAgIH1cclxufVxyXG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIGNvbXBhcmUgYW5kIGlzQnVmZmVyIHRha2VuIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvYmxvYi82ODBlOWU1ZTQ4OGYyMmFhYzI3NTk5YTU3ZGM4NDRhNjMxNTkyOGRkL2luZGV4LmpzXG4vLyBvcmlnaW5hbCBub3RpY2U6XG5cbi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmUoYSwgYikge1xuICBpZiAoYSA9PT0gYikge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgdmFyIHggPSBhLmxlbmd0aDtcbiAgdmFyIHkgPSBiLmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICB4ID0gYVtpXTtcbiAgICAgIHkgPSBiW2ldO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGlmICh5IDwgeCkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuZnVuY3Rpb24gaXNCdWZmZXIoYikge1xuICBpZiAoZ2xvYmFsLkJ1ZmZlciAmJiB0eXBlb2YgZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBnbG9iYWwuQnVmZmVyLmlzQnVmZmVyKGIpO1xuICB9XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpO1xufVxuXG4vLyBiYXNlZCBvbiBub2RlIGFzc2VydCwgb3JpZ2luYWwgbm90aWNlOlxuXG4vLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGZ1bmN0aW9uc0hhdmVOYW1lcyA9IChmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBmdW5jdGlvbiBmb28oKSB7fS5uYW1lID09PSAnZm9vJztcbn0oKSk7XG5mdW5jdGlvbiBwVG9TdHJpbmcgKG9iaikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaik7XG59XG5mdW5jdGlvbiBpc1ZpZXcoYXJyYnVmKSB7XG4gIGlmIChpc0J1ZmZlcihhcnJidWYpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0eXBlb2YgZ2xvYmFsLkFycmF5QnVmZmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIuaXNWaWV3ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIEFycmF5QnVmZmVyLmlzVmlldyhhcnJidWYpO1xuICB9XG4gIGlmICghYXJyYnVmKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChhcnJidWYgaW5zdGFuY2VvZiBEYXRhVmlldykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmIChhcnJidWYuYnVmZmVyICYmIGFycmJ1Zi5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbnZhciByZWdleCA9IC9cXHMqZnVuY3Rpb25cXHMrKFteXFwoXFxzXSopXFxzKi87XG4vLyBiYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vbGpoYXJiL2Z1bmN0aW9uLnByb3RvdHlwZS5uYW1lL2Jsb2IvYWRlZWVlYzhiZmNjNjA2OGIxODdkN2Q5ZmIzZDViYjFkM2EzMDg5OS9pbXBsZW1lbnRhdGlvbi5qc1xuZnVuY3Rpb24gZ2V0TmFtZShmdW5jKSB7XG4gIGlmICghdXRpbC5pc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChmdW5jdGlvbnNIYXZlTmFtZXMpIHtcbiAgICByZXR1cm4gZnVuYy5uYW1lO1xuICB9XG4gIHZhciBzdHIgPSBmdW5jLnRvU3RyaW5nKCk7XG4gIHZhciBtYXRjaCA9IHN0ci5tYXRjaChyZWdleCk7XG4gIHJldHVybiBtYXRjaCAmJiBtYXRjaFsxXTtcbn1cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBnZXROYW1lKHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh0eXBlb2YgcyA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cbmZ1bmN0aW9uIGluc3BlY3Qoc29tZXRoaW5nKSB7XG4gIGlmIChmdW5jdGlvbnNIYXZlTmFtZXMgfHwgIXV0aWwuaXNGdW5jdGlvbihzb21ldGhpbmcpKSB7XG4gICAgcmV0dXJuIHV0aWwuaW5zcGVjdChzb21ldGhpbmcpO1xuICB9XG4gIHZhciByYXduYW1lID0gZ2V0TmFtZShzb21ldGhpbmcpO1xuICB2YXIgbmFtZSA9IHJhd25hbWUgPyAnOiAnICsgcmF3bmFtZSA6ICcnO1xuICByZXR1cm4gJ1tGdW5jdGlvbicgKyAgbmFtZSArICddJztcbn1cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoaW5zcGVjdChzZWxmLmFjdHVhbCksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShpbnNwZWN0KHNlbGYuZXhwZWN0ZWQpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBmYWxzZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIGRlZXBTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCB0cnVlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBTdHJpY3RFcXVhbCcsIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIHN0cmljdCwgbWVtb3MpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoaXNCdWZmZXIoYWN0dWFsKSAmJiBpc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gY29tcGFyZShhY3R1YWwsIGV4cGVjdGVkKSA9PT0gMDtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoKGFjdHVhbCA9PT0gbnVsbCB8fCB0eXBlb2YgYWN0dWFsICE9PSAnb2JqZWN0JykgJiZcbiAgICAgICAgICAgICAoZXhwZWN0ZWQgPT09IG51bGwgfHwgdHlwZW9mIGV4cGVjdGVkICE9PSAnb2JqZWN0JykpIHtcbiAgICByZXR1cm4gc3RyaWN0ID8gYWN0dWFsID09PSBleHBlY3RlZCA6IGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyBJZiBib3RoIHZhbHVlcyBhcmUgaW5zdGFuY2VzIG9mIHR5cGVkIGFycmF5cywgd3JhcCB0aGVpciB1bmRlcmx5aW5nXG4gIC8vIEFycmF5QnVmZmVycyBpbiBhIEJ1ZmZlciBlYWNoIHRvIGluY3JlYXNlIHBlcmZvcm1hbmNlXG4gIC8vIFRoaXMgb3B0aW1pemF0aW9uIHJlcXVpcmVzIHRoZSBhcnJheXMgdG8gaGF2ZSB0aGUgc2FtZSB0eXBlIGFzIGNoZWNrZWQgYnlcbiAgLy8gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyAoYWthIHBUb1N0cmluZykuIE5ldmVyIHBlcmZvcm0gYmluYXJ5XG4gIC8vIGNvbXBhcmlzb25zIGZvciBGbG9hdCpBcnJheXMsIHRob3VnaCwgc2luY2UgZS5nLiArMCA9PT0gLTAgYnV0IHRoZWlyXG4gIC8vIGJpdCBwYXR0ZXJucyBhcmUgbm90IGlkZW50aWNhbC5cbiAgfSBlbHNlIGlmIChpc1ZpZXcoYWN0dWFsKSAmJiBpc1ZpZXcoZXhwZWN0ZWQpICYmXG4gICAgICAgICAgICAgcFRvU3RyaW5nKGFjdHVhbCkgPT09IHBUb1N0cmluZyhleHBlY3RlZCkgJiZcbiAgICAgICAgICAgICAhKGFjdHVhbCBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fFxuICAgICAgICAgICAgICAgYWN0dWFsIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSkge1xuICAgIHJldHVybiBjb21wYXJlKG5ldyBVaW50OEFycmF5KGFjdHVhbC5idWZmZXIpLFxuICAgICAgICAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KGV4cGVjdGVkLmJ1ZmZlcikpID09PSAwO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSBpZiAoaXNCdWZmZXIoYWN0dWFsKSAhPT0gaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG1lbW9zID0gbWVtb3MgfHwge2FjdHVhbDogW10sIGV4cGVjdGVkOiBbXX07XG5cbiAgICB2YXIgYWN0dWFsSW5kZXggPSBtZW1vcy5hY3R1YWwuaW5kZXhPZihhY3R1YWwpO1xuICAgIGlmIChhY3R1YWxJbmRleCAhPT0gLTEpIHtcbiAgICAgIGlmIChhY3R1YWxJbmRleCA9PT0gbWVtb3MuZXhwZWN0ZWQuaW5kZXhPZihleHBlY3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbWVtb3MuYWN0dWFsLnB1c2goYWN0dWFsKTtcbiAgICBtZW1vcy5leHBlY3RlZC5wdXNoKGV4cGVjdGVkKTtcblxuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkLCBzdHJpY3QsIG1lbW9zKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiLCBzdHJpY3QsIGFjdHVhbFZpc2l0ZWRPYmplY3RzKSB7XG4gIGlmIChhID09PSBudWxsIHx8IGEgPT09IHVuZGVmaW5lZCB8fCBiID09PSBudWxsIHx8IGIgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGlmIG9uZSBpcyBhIHByaW1pdGl2ZSwgdGhlIG90aGVyIG11c3QgYmUgc2FtZVxuICBpZiAodXRpbC5pc1ByaW1pdGl2ZShhKSB8fCB1dGlsLmlzUHJpbWl0aXZlKGIpKVxuICAgIHJldHVybiBhID09PSBiO1xuICBpZiAoc3RyaWN0ICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihhKSAhPT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgdmFyIGFJc0FyZ3MgPSBpc0FyZ3VtZW50cyhhKTtcbiAgdmFyIGJJc0FyZ3MgPSBpc0FyZ3VtZW50cyhiKTtcbiAgaWYgKChhSXNBcmdzICYmICFiSXNBcmdzKSB8fCAoIWFJc0FyZ3MgJiYgYklzQXJncykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYUlzQXJncykge1xuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYiwgc3RyaWN0KTtcbiAgfVxuICB2YXIga2EgPSBvYmplY3RLZXlzKGEpO1xuICB2YXIga2IgPSBvYmplY3RLZXlzKGIpO1xuICB2YXIga2V5LCBpO1xuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9PSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0sIHN0cmljdCwgYWN0dWFsVmlzaXRlZE9iamVjdHMpKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgZmFsc2UpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmFzc2VydC5ub3REZWVwU3RyaWN0RXF1YWwgPSBub3REZWVwU3RyaWN0RXF1YWw7XG5mdW5jdGlvbiBub3REZWVwU3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCB0cnVlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBTdHJpY3RFcXVhbCcsIG5vdERlZXBTdHJpY3RFcXVhbCk7XG4gIH1cbn1cblxuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH1cblxuICB0cnkge1xuICAgIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gSWdub3JlLiAgVGhlIGluc3RhbmNlb2YgY2hlY2sgZG9lc24ndCB3b3JrIGZvciBhcnJvdyBmdW5jdGlvbnMuXG4gIH1cblxuICBpZiAoRXJyb3IuaXNQcm90b3R5cGVPZihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gX3RyeUJsb2NrKGJsb2NrKSB7XG4gIHZhciBlcnJvcjtcbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZXJyb3IgPSBlO1xuICB9XG4gIHJldHVybiBlcnJvcjtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHR5cGVvZiBibG9jayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYmxvY2tcIiBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICdzdHJpbmcnKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIGFjdHVhbCA9IF90cnlCbG9jayhibG9jayk7XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICB2YXIgdXNlclByb3ZpZGVkTWVzc2FnZSA9IHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJztcbiAgdmFyIGlzVW53YW50ZWRFeGNlcHRpb24gPSAhc2hvdWxkVGhyb3cgJiYgdXRpbC5pc0Vycm9yKGFjdHVhbCk7XG4gIHZhciBpc1VuZXhwZWN0ZWRFeGNlcHRpb24gPSAhc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmICFleHBlY3RlZDtcblxuICBpZiAoKGlzVW53YW50ZWRFeGNlcHRpb24gJiZcbiAgICAgIHVzZXJQcm92aWRlZE1lc3NhZ2UgJiZcbiAgICAgIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fFxuICAgICAgaXNVbmV4cGVjdGVkRXhjZXB0aW9uKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzKHRydWUsIGJsb2NrLCBlcnJvciwgbWVzc2FnZSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cyhmYWxzZSwgYmxvY2ssIGVycm9yLCBtZXNzYWdlKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHRocm93IGVycjsgfTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCIvKmdsb2JhbCB3aW5kb3csIGdsb2JhbCovXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJ1dGlsXCIpXG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKVxudmFyIG5vdyA9IHJlcXVpcmUoXCJkYXRlLW5vd1wiKVxuXG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2VcbnZhciBjb25zb2xlXG52YXIgdGltZXMgPSB7fVxuXG5pZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBnbG9iYWwuY29uc29sZSkge1xuICAgIGNvbnNvbGUgPSBnbG9iYWwuY29uc29sZVxufSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdy5jb25zb2xlKSB7XG4gICAgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlXG59IGVsc2Uge1xuICAgIGNvbnNvbGUgPSB7fVxufVxuXG52YXIgZnVuY3Rpb25zID0gW1xuICAgIFtsb2csIFwibG9nXCJdLFxuICAgIFtpbmZvLCBcImluZm9cIl0sXG4gICAgW3dhcm4sIFwid2FyblwiXSxcbiAgICBbZXJyb3IsIFwiZXJyb3JcIl0sXG4gICAgW3RpbWUsIFwidGltZVwiXSxcbiAgICBbdGltZUVuZCwgXCJ0aW1lRW5kXCJdLFxuICAgIFt0cmFjZSwgXCJ0cmFjZVwiXSxcbiAgICBbZGlyLCBcImRpclwiXSxcbiAgICBbY29uc29sZUFzc2VydCwgXCJhc3NlcnRcIl1cbl1cblxuZm9yICh2YXIgaSA9IDA7IGkgPCBmdW5jdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdHVwbGUgPSBmdW5jdGlvbnNbaV1cbiAgICB2YXIgZiA9IHR1cGxlWzBdXG4gICAgdmFyIG5hbWUgPSB0dXBsZVsxXVxuXG4gICAgaWYgKCFjb25zb2xlW25hbWVdKSB7XG4gICAgICAgIGNvbnNvbGVbbmFtZV0gPSBmXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbnNvbGVcblxuZnVuY3Rpb24gbG9nKCkge31cblxuZnVuY3Rpb24gaW5mbygpIHtcbiAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpXG59XG5cbmZ1bmN0aW9uIHdhcm4oKSB7XG4gICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKVxufVxuXG5mdW5jdGlvbiBlcnJvcigpIHtcbiAgICBjb25zb2xlLndhcm4uYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKVxufVxuXG5mdW5jdGlvbiB0aW1lKGxhYmVsKSB7XG4gICAgdGltZXNbbGFiZWxdID0gbm93KClcbn1cblxuZnVuY3Rpb24gdGltZUVuZChsYWJlbCkge1xuICAgIHZhciB0aW1lID0gdGltZXNbbGFiZWxdXG4gICAgaWYgKCF0aW1lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHN1Y2ggbGFiZWw6IFwiICsgbGFiZWwpXG4gICAgfVxuXG4gICAgdmFyIGR1cmF0aW9uID0gbm93KCkgLSB0aW1lXG4gICAgY29uc29sZS5sb2cobGFiZWwgKyBcIjogXCIgKyBkdXJhdGlvbiArIFwibXNcIilcbn1cblxuZnVuY3Rpb24gdHJhY2UoKSB7XG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpXG4gICAgZXJyLm5hbWUgPSBcIlRyYWNlXCJcbiAgICBlcnIubWVzc2FnZSA9IHV0aWwuZm9ybWF0LmFwcGx5KG51bGwsIGFyZ3VtZW50cylcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjaylcbn1cblxuZnVuY3Rpb24gZGlyKG9iamVjdCkge1xuICAgIGNvbnNvbGUubG9nKHV0aWwuaW5zcGVjdChvYmplY3QpICsgXCJcXG5cIilcbn1cblxuZnVuY3Rpb24gY29uc29sZUFzc2VydChleHByZXNzaW9uKSB7XG4gICAgaWYgKCFleHByZXNzaW9uKSB7XG4gICAgICAgIHZhciBhcnIgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcbiAgICAgICAgYXNzZXJ0Lm9rKGZhbHNlLCB1dGlsLmZvcm1hdC5hcHBseShudWxsLCBhcnIpKVxuICAgIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gbm93XG5cbmZ1bmN0aW9uIG5vdygpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKClcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iXX0=
