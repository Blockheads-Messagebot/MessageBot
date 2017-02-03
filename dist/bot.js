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
tab.innerHTML = "<template id=\"aTemplate\">\r\n    <div class=\"column is-full\">\r\n        <div class=\"box\">\r\n            <label>Send:</label>\r\n            <textarea class=\"textarea is-fluid m\"></textarea>\r\n            <a>Delete</a>\r\n        </div>\r\n        <div>\r\n            Wait X minutes...\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_announcements\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3>These are sent according to a regular schedule.</h3>\r\n        <span>If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span>\r\n    </section>\r\n    <div id=\"aMsgs\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

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
el.innerHTML = "#mb_join>h3,#mb_leave>h3,#mb_trigger>h3,#mb_announcements>h3{margin:0 0 5px 6em}#mb_join>span,#mb_leave>span,#mb_trigger>span,#mb_announcements>span{margin-left:6em}#mb_join input[type=\"number\"],#mb_leave input[type=\"number\"],#mb_trigger input[type=\"number\"],#mb_announcements input[type=\"number\"]{width:5em}#jMsgs,#lMsgs,#tMsgs,#aMsgs{border-top:1px solid #000}#jMsgs small,#lMsgs small,#tMsgs small,#aMsgs small{color:#777}\n";
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
tab.innerHTML = "<template id=\"jTemplate\">\r\n    <div class=\"column is-4-desktop is-6-tablet\">\r\n        <div class=\"box\">\r\n            <label> Message: <textarea class=\"textarea is-fluid m\"></textarea></label>\r\n            <details><summary>More options <small class=\"summary\"></small></summary>\r\n                <label>Player is: <select data-target=\"group\">\r\n                    <option value=\"all\">anyone</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <label>Player is not: <select data-target=\"not_group\">\r\n                    <option value=\"nobody\">nobody</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n                <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n            </details>\r\n            <a>Delete</a>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_join\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3>These are checked when a player joins the server.</h3>\r\n        <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    </section>\r\n    <div id=\"jMsgs\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

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
tab.innerHTML = "<template id=\"lTemplate\">\r\n    <div class=\"column is-4-desktop is-6-tablet\">\r\n        <div class=\"box\">\r\n            <label>Message <textarea class=\"textarea is-fluid m\"></textarea></label>\r\n            <details><summary>More options <small class=\"summary\"></small></summary>\r\n                <label>Player is: <select data-target=\"group\">\r\n                    <option value=\"all\">anyone</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <label>Player is not: <select data-target=\"not_group\">\r\n                    <option value=\"nobody\">nobody</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n                <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n            </details>\r\n            <a>Delete</a>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_leave\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3>These are checked when a player leaves the server.</h3>\r\n        <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    </section>\r\n    <div id=\"lMsgs\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

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
tab.innerHTML = "<template id=\"tTemplate\">\r\n    <div class=\"column is-4-desktop is-6-tablet\">\r\n        <div class=\"box\">\r\n            <label>Trigger: <input class=\"input t\"></label>\r\n            <label>Message: <textarea class=\"textarea is-fluid m\"></textarea></label>\r\n            <details><summary>More options <small class=\"summary\"></small></summary>\r\n                <label>Player is: <select data-target=\"group\">\r\n                    <option value=\"all\">anyone</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <label>Player is not: <select data-target=\"not_group\">\r\n                    <option value=\"nobody\">nobody</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n                <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n            </details>\r\n            <a>Delete</a>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_trigger\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3>These are checked whenever someone says something.</h3>\r\n        <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger \"te*st\" will match \"tea stuff\" and \"test\")</span>\r\n    </section>\r\n    <div id=\"tMsgs\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

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
document.head.innerHTML += '<style>' + "html{overflow-y:auto !important}/*! bulma.io v0.3.1 | MIT License | github.com/jgthms/bulma */@keyframes spinAround{from{transform:rotate(0deg)}to{transform:rotate(359deg)}}/*! minireset.css v0.0.2 | MIT License | github.com/jgthms/minireset.css */html,body,p,ol,ul,li,dl,dt,dd,blockquote,figure,fieldset,legend,textarea,pre,iframe,hr,h1,h2,h3,h4,h5,h6{margin:0;padding:0}h1,h2,h3,h4,h5,h6{font-size:100%;font-weight:normal}ul{list-style:none}button,input,select,textarea{margin:0}html{box-sizing:border-box}*{box-sizing:inherit}*:before,*:after{box-sizing:inherit}img,embed,object,audio,video{height:auto;max-width:100%}iframe{border:0}table{border-collapse:collapse;border-spacing:0}td,th{padding:0;text-align:left}html{background-color:#fff;font-size:14px;-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;min-width:300px;overflow-x:hidden;overflow-y:scroll;text-rendering:optimizeLegibility}article,aside,figure,footer,header,hgroup,section{display:block}body,button,input,select,textarea{font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",\"Roboto\",\"Oxygen\",\"Ubuntu\",\"Cantarell\",\"Fira Sans\",\"Droid Sans\",\"Helvetica Neue\",\"Helvetica\",\"Arial\",sans-serif}code,pre{-moz-osx-font-smoothing:auto;-webkit-font-smoothing:auto;font-family:\"Inconsolata\",\"Consolas\",\"Monaco\",monospace}body{color:#4a4a4a;font-size:1rem;font-weight:400;line-height:1.5}a{color:#182b73;cursor:pointer;text-decoration:none;transition:none 86ms ease-out}a:hover{color:#363636}code{background-color:#f5f5f5;color:red;font-size:0.8em;font-weight:normal;padding:0.25em 0.5em 0.25em}hr{background-color:#dbdbdb;border:none;display:block;height:1px;margin:1.5rem 0}img{max-width:100%}input[type=\"checkbox\"],input[type=\"radio\"]{vertical-align:baseline}small{font-size:0.8em}span{font-style:inherit;font-weight:inherit}strong{color:#363636;font-weight:700}pre{background-color:#f5f5f5;color:#4a4a4a;font-size:0.8em;white-space:pre;word-wrap:normal}pre code{background:none;color:inherit;display:block;font-size:1em;overflow-x:auto;padding:1.25rem 1.5rem}table{width:100%}table td,table th{text-align:left;vertical-align:top}table th{color:#363636}.is-block{display:block}@media screen and (max-width: 768px){.is-block-mobile{display:block !important}}@media screen and (min-width: 769px){.is-block-tablet{display:block !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-block-tablet-only{display:block !important}}@media screen and (max-width: 999px){.is-block-touch{display:block !important}}@media screen and (min-width: 1000px){.is-block-desktop{display:block !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-block-desktop-only{display:block !important}}@media screen and (min-width: 1192px){.is-block-widescreen{display:block !important}}.is-flex{display:flex}@media screen and (max-width: 768px){.is-flex-mobile{display:flex !important}}@media screen and (min-width: 769px){.is-flex-tablet{display:flex !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-flex-tablet-only{display:flex !important}}@media screen and (max-width: 999px){.is-flex-touch{display:flex !important}}@media screen and (min-width: 1000px){.is-flex-desktop{display:flex !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-flex-desktop-only{display:flex !important}}@media screen and (min-width: 1192px){.is-flex-widescreen{display:flex !important}}.is-inline{display:inline}@media screen and (max-width: 768px){.is-inline-mobile{display:inline !important}}@media screen and (min-width: 769px){.is-inline-tablet{display:inline !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-tablet-only{display:inline !important}}@media screen and (max-width: 999px){.is-inline-touch{display:inline !important}}@media screen and (min-width: 1000px){.is-inline-desktop{display:inline !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-desktop-only{display:inline !important}}@media screen and (min-width: 1192px){.is-inline-widescreen{display:inline !important}}.is-inline-block{display:inline-block}@media screen and (max-width: 768px){.is-inline-block-mobile{display:inline-block !important}}@media screen and (min-width: 769px){.is-inline-block-tablet{display:inline-block !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-block-tablet-only{display:inline-block !important}}@media screen and (max-width: 999px){.is-inline-block-touch{display:inline-block !important}}@media screen and (min-width: 1000px){.is-inline-block-desktop{display:inline-block !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-block-desktop-only{display:inline-block !important}}@media screen and (min-width: 1192px){.is-inline-block-widescreen{display:inline-block !important}}.is-inline-flex{display:inline-flex}@media screen and (max-width: 768px){.is-inline-flex-mobile{display:inline-flex !important}}@media screen and (min-width: 769px){.is-inline-flex-tablet{display:inline-flex !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-flex-tablet-only{display:inline-flex !important}}@media screen and (max-width: 999px){.is-inline-flex-touch{display:inline-flex !important}}@media screen and (min-width: 1000px){.is-inline-flex-desktop{display:inline-flex !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-flex-desktop-only{display:inline-flex !important}}@media screen and (min-width: 1192px){.is-inline-flex-widescreen{display:inline-flex !important}}.is-clearfix:after{clear:both;content:\" \";display:table}.is-pulled-left{float:left}.is-pulled-right{float:right}.is-clipped{overflow:hidden !important}.is-overlay{bottom:0;left:0;position:absolute;right:0;top:0}.has-text-centered{text-align:center}.has-text-left{text-align:left}.has-text-right{text-align:right}.is-hidden{display:none !important}@media screen and (max-width: 768px){.is-hidden-mobile{display:none !important}}@media screen and (min-width: 769px){.is-hidden-tablet{display:none !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-hidden-tablet-only{display:none !important}}@media screen and (max-width: 999px){.is-hidden-touch{display:none !important}}@media screen and (min-width: 1000px){.is-hidden-desktop{display:none !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-hidden-desktop-only{display:none !important}}@media screen and (min-width: 1192px){.is-hidden-widescreen{display:none !important}}.is-disabled{pointer-events:none}.is-marginless{margin:0 !important}.is-paddingless{padding:0 !important}.is-unselectable{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.box{background-color:#fff;border-radius:5px;box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px rgba(10,10,10,0.1);display:block;padding:1.25rem}.box:not(:last-child){margin-bottom:1.5rem}a.box:hover,a.box:focus{box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px #182b73}a.box:active{box-shadow:inset 0 1px 2px rgba(10,10,10,0.2),0 0 0 1px #182b73}.button{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-color:#fff;border:1px solid #dbdbdb;color:#363636;cursor:pointer;justify-content:center;padding-left:0.75em;padding-right:0.75em;text-align:center;white-space:nowrap}.button:focus,.button.is-focused,.button:active,.button.is-active{outline:none}.button[disabled],.button.is-disabled{pointer-events:none}.button strong{color:inherit}.button .icon:first-child:not(:last-child){margin-left:-.25rem;margin-right:.5rem}.button .icon:last-child:not(:first-child){margin-left:.5rem;margin-right:-.25rem}.button .icon:first-child:last-child{margin-left:calc(-1px + -.25rem);margin-right:calc(-1px + -.25rem)}.button .icon.is-small:first-child:not(:last-child){margin-left:0rem}.button .icon.is-small:last-child:not(:first-child){margin-right:0rem}.button .icon.is-small:first-child:last-child{margin-left:calc(-1px + 0rem);margin-right:calc(-1px + 0rem)}.button .icon.is-medium:first-child:not(:last-child){margin-left:-.5rem}.button .icon.is-medium:last-child:not(:first-child){margin-right:-.5rem}.button .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.5rem);margin-right:calc(-1px + -.5rem)}.button .icon.is-large:first-child:not(:last-child){margin-left:-1rem}.button .icon.is-large:last-child:not(:first-child){margin-right:-1rem}.button .icon.is-large:first-child:last-child{margin-left:calc(-1px + -1rem);margin-right:calc(-1px + -1rem)}.button:hover,.button.is-hovered{border-color:#b5b5b5;color:#363636}.button:focus,.button.is-focused{border-color:#182b73;box-shadow:0 0 0.5em rgba(24,43,115,0.25);color:#363636}.button:active,.button.is-active{border-color:#4a4a4a;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#363636}.button.is-link{background-color:transparent;border-color:transparent;color:#4a4a4a;text-decoration:underline}.button.is-link:hover,.button.is-link.is-hovered,.button.is-link:focus,.button.is-link.is-focused,.button.is-link:active,.button.is-link.is-active{background-color:#f5f5f5;color:#363636}.button.is-white{background-color:#fff;border-color:transparent;color:#0a0a0a}.button.is-white:hover,.button.is-white.is-hovered{background-color:#f9f9f9;border-color:transparent;color:#0a0a0a}.button.is-white:focus,.button.is-white.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,255,255,0.25);color:#0a0a0a}.button.is-white:active,.button.is-white.is-active{background-color:#f2f2f2;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#0a0a0a}.button.is-white.is-inverted{background-color:#0a0a0a;color:#fff}.button.is-white.is-inverted:hover{background-color:#000}.button.is-white.is-loading:after{border-color:transparent transparent #0a0a0a #0a0a0a !important}.button.is-white.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-white.is-outlined:hover,.button.is-white.is-outlined:focus{background-color:#fff;border-color:#fff;color:#0a0a0a}.button.is-white.is-inverted.is-outlined{background-color:transparent;border-color:#0a0a0a;color:#0a0a0a}.button.is-white.is-inverted.is-outlined:hover,.button.is-white.is-inverted.is-outlined:focus{background-color:#0a0a0a;color:#fff}.button.is-black{background-color:#0a0a0a;border-color:transparent;color:#fff}.button.is-black:hover,.button.is-black.is-hovered{background-color:#040404;border-color:transparent;color:#fff}.button.is-black:focus,.button.is-black.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(10,10,10,0.25);color:#fff}.button.is-black:active,.button.is-black.is-active{background-color:#000;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-black.is-inverted{background-color:#fff;color:#0a0a0a}.button.is-black.is-inverted:hover{background-color:#f2f2f2}.button.is-black.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-black.is-outlined{background-color:transparent;border-color:#0a0a0a;color:#0a0a0a}.button.is-black.is-outlined:hover,.button.is-black.is-outlined:focus{background-color:#0a0a0a;border-color:#0a0a0a;color:#fff}.button.is-black.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-black.is-inverted.is-outlined:hover,.button.is-black.is-inverted.is-outlined:focus{background-color:#fff;color:#0a0a0a}.button.is-light{background-color:#f5f5f5;border-color:transparent;color:#363636}.button.is-light:hover,.button.is-light.is-hovered{background-color:#eee;border-color:transparent;color:#363636}.button.is-light:focus,.button.is-light.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(245,245,245,0.25);color:#363636}.button.is-light:active,.button.is-light.is-active{background-color:#e8e8e8;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#363636}.button.is-light.is-inverted{background-color:#363636;color:#f5f5f5}.button.is-light.is-inverted:hover{background-color:#292929}.button.is-light.is-loading:after{border-color:transparent transparent #363636 #363636 !important}.button.is-light.is-outlined{background-color:transparent;border-color:#f5f5f5;color:#f5f5f5}.button.is-light.is-outlined:hover,.button.is-light.is-outlined:focus{background-color:#f5f5f5;border-color:#f5f5f5;color:#363636}.button.is-light.is-inverted.is-outlined{background-color:transparent;border-color:#363636;color:#363636}.button.is-light.is-inverted.is-outlined:hover,.button.is-light.is-inverted.is-outlined:focus{background-color:#363636;color:#f5f5f5}.button.is-dark{background-color:#363636;border-color:transparent;color:#f5f5f5}.button.is-dark:hover,.button.is-dark.is-hovered{background-color:#2f2f2f;border-color:transparent;color:#f5f5f5}.button.is-dark:focus,.button.is-dark.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(54,54,54,0.25);color:#f5f5f5}.button.is-dark:active,.button.is-dark.is-active{background-color:#292929;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#f5f5f5}.button.is-dark.is-inverted{background-color:#f5f5f5;color:#363636}.button.is-dark.is-inverted:hover{background-color:#e8e8e8}.button.is-dark.is-loading:after{border-color:transparent transparent #f5f5f5 #f5f5f5 !important}.button.is-dark.is-outlined{background-color:transparent;border-color:#363636;color:#363636}.button.is-dark.is-outlined:hover,.button.is-dark.is-outlined:focus{background-color:#363636;border-color:#363636;color:#f5f5f5}.button.is-dark.is-inverted.is-outlined{background-color:transparent;border-color:#f5f5f5;color:#f5f5f5}.button.is-dark.is-inverted.is-outlined:hover,.button.is-dark.is-inverted.is-outlined:focus{background-color:#f5f5f5;color:#363636}.button.is-primary{background-color:#182b73;border-color:transparent;color:#fff}.button.is-primary:hover,.button.is-primary.is-hovered{background-color:#162768;border-color:transparent;color:#fff}.button.is-primary:focus,.button.is-primary.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(24,43,115,0.25);color:#fff}.button.is-primary:active,.button.is-primary.is-active{background-color:#14235e;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-primary.is-inverted{background-color:#fff;color:#182b73}.button.is-primary.is-inverted:hover{background-color:#f2f2f2}.button.is-primary.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-primary.is-outlined{background-color:transparent;border-color:#182b73;color:#182b73}.button.is-primary.is-outlined:hover,.button.is-primary.is-outlined:focus{background-color:#182b73;border-color:#182b73;color:#fff}.button.is-primary.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-primary.is-inverted.is-outlined:hover,.button.is-primary.is-inverted.is-outlined:focus{background-color:#fff;color:#182b73}.button.is-info{background-color:#3273dc;border-color:transparent;color:#fff}.button.is-info:hover,.button.is-info.is-hovered{background-color:#276cda;border-color:transparent;color:#fff}.button.is-info:focus,.button.is-info.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(50,115,220,0.25);color:#fff}.button.is-info:active,.button.is-info.is-active{background-color:#2366d1;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-info.is-inverted{background-color:#fff;color:#3273dc}.button.is-info.is-inverted:hover{background-color:#f2f2f2}.button.is-info.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-info.is-outlined{background-color:transparent;border-color:#3273dc;color:#3273dc}.button.is-info.is-outlined:hover,.button.is-info.is-outlined:focus{background-color:#3273dc;border-color:#3273dc;color:#fff}.button.is-info.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-info.is-inverted.is-outlined:hover,.button.is-info.is-inverted.is-outlined:focus{background-color:#fff;color:#3273dc}.button.is-success{background-color:#23d160;border-color:transparent;color:#fff}.button.is-success:hover,.button.is-success.is-hovered{background-color:#22c65b;border-color:transparent;color:#fff}.button.is-success:focus,.button.is-success.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(35,209,96,0.25);color:#fff}.button.is-success:active,.button.is-success.is-active{background-color:#20bc56;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-success.is-inverted{background-color:#fff;color:#23d160}.button.is-success.is-inverted:hover{background-color:#f2f2f2}.button.is-success.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-success.is-outlined{background-color:transparent;border-color:#23d160;color:#23d160}.button.is-success.is-outlined:hover,.button.is-success.is-outlined:focus{background-color:#23d160;border-color:#23d160;color:#fff}.button.is-success.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-success.is-inverted.is-outlined:hover,.button.is-success.is-inverted.is-outlined:focus{background-color:#fff;color:#23d160}.button.is-warning{background-color:#ffdd57;border-color:transparent;color:rgba(0,0,0,0.7)}.button.is-warning:hover,.button.is-warning.is-hovered{background-color:#ffdb4a;border-color:transparent;color:rgba(0,0,0,0.7)}.button.is-warning:focus,.button.is-warning.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,221,87,0.25);color:rgba(0,0,0,0.7)}.button.is-warning:active,.button.is-warning.is-active{background-color:#ffd83d;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted{background-color:rgba(0,0,0,0.7);color:#ffdd57}.button.is-warning.is-inverted:hover{background-color:rgba(0,0,0,0.7)}.button.is-warning.is-loading:after{border-color:transparent transparent rgba(0,0,0,0.7) rgba(0,0,0,0.7) !important}.button.is-warning.is-outlined{background-color:transparent;border-color:#ffdd57;color:#ffdd57}.button.is-warning.is-outlined:hover,.button.is-warning.is-outlined:focus{background-color:#ffdd57;border-color:#ffdd57;color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted.is-outlined{background-color:transparent;border-color:rgba(0,0,0,0.7);color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted.is-outlined:hover,.button.is-warning.is-inverted.is-outlined:focus{background-color:rgba(0,0,0,0.7);color:#ffdd57}.button.is-danger{background-color:red;border-color:transparent;color:#fff}.button.is-danger:hover,.button.is-danger.is-hovered{background-color:#f20000;border-color:transparent;color:#fff}.button.is-danger:focus,.button.is-danger.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,0,0,0.25);color:#fff}.button.is-danger:active,.button.is-danger.is-active{background-color:#e60000;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-danger.is-inverted{background-color:#fff;color:red}.button.is-danger.is-inverted:hover{background-color:#f2f2f2}.button.is-danger.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-danger.is-outlined{background-color:transparent;border-color:red;color:red}.button.is-danger.is-outlined:hover,.button.is-danger.is-outlined:focus{background-color:red;border-color:red;color:#fff}.button.is-danger.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-danger.is-inverted.is-outlined:hover,.button.is-danger.is-inverted.is-outlined:focus{background-color:#fff;color:red}.button.is-small{border-radius:2px;font-size:.75rem}.button.is-small .icon:first-child:not(:last-child){margin-left:-.375rem;margin-right:.375rem}.button.is-small .icon:last-child:not(:first-child){margin-left:.375rem;margin-right:-.375rem}.button.is-small .icon:first-child:last-child{margin-left:calc(-1px + -.375rem);margin-right:calc(-1px + -.375rem)}.button.is-small .icon.is-small:first-child:not(:last-child){margin-left:-.125rem}.button.is-small .icon.is-small:last-child:not(:first-child){margin-right:-.125rem}.button.is-small .icon.is-small:first-child:last-child{margin-left:calc(-1px + -.125rem);margin-right:calc(-1px + -.125rem)}.button.is-small .icon.is-medium:first-child:not(:last-child){margin-left:-.625rem}.button.is-small .icon.is-medium:last-child:not(:first-child){margin-right:-.625rem}.button.is-small .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.625rem);margin-right:calc(-1px + -.625rem)}.button.is-small .icon.is-large:first-child:not(:last-child){margin-left:-1.125rem}.button.is-small .icon.is-large:last-child:not(:first-child){margin-right:-1.125rem}.button.is-small .icon.is-large:first-child:last-child{margin-left:calc(-1px + -1.125rem);margin-right:calc(-1px + -1.125rem)}.button.is-medium{font-size:1.25rem}.button.is-medium .icon:first-child:not(:last-child){margin-left:-.125rem;margin-right:.625rem}.button.is-medium .icon:last-child:not(:first-child){margin-left:.625rem;margin-right:-.125rem}.button.is-medium .icon:first-child:last-child{margin-left:calc(-1px + -.125rem);margin-right:calc(-1px + -.125rem)}.button.is-medium .icon.is-small:first-child:not(:last-child){margin-left:.125rem}.button.is-medium .icon.is-small:last-child:not(:first-child){margin-right:.125rem}.button.is-medium .icon.is-small:first-child:last-child{margin-left:calc(-1px + .125rem);margin-right:calc(-1px + .125rem)}.button.is-medium .icon.is-medium:first-child:not(:last-child){margin-left:-.375rem}.button.is-medium .icon.is-medium:last-child:not(:first-child){margin-right:-.375rem}.button.is-medium .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.375rem);margin-right:calc(-1px + -.375rem)}.button.is-medium .icon.is-large:first-child:not(:last-child){margin-left:-.875rem}.button.is-medium .icon.is-large:last-child:not(:first-child){margin-right:-.875rem}.button.is-medium .icon.is-large:first-child:last-child{margin-left:calc(-1px + -.875rem);margin-right:calc(-1px + -.875rem)}.button.is-large{font-size:1.5rem}.button.is-large .icon:first-child:not(:last-child){margin-left:0rem;margin-right:.75rem}.button.is-large .icon:last-child:not(:first-child){margin-left:.75rem;margin-right:0rem}.button.is-large .icon:first-child:last-child{margin-left:calc(-1px + 0rem);margin-right:calc(-1px + 0rem)}.button.is-large .icon.is-small:first-child:not(:last-child){margin-left:.25rem}.button.is-large .icon.is-small:last-child:not(:first-child){margin-right:.25rem}.button.is-large .icon.is-small:first-child:last-child{margin-left:calc(-1px + .25rem);margin-right:calc(-1px + .25rem)}.button.is-large .icon.is-medium:first-child:not(:last-child){margin-left:-.25rem}.button.is-large .icon.is-medium:last-child:not(:first-child){margin-right:-.25rem}.button.is-large .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.25rem);margin-right:calc(-1px + -.25rem)}.button.is-large .icon.is-large:first-child:not(:last-child){margin-left:-.75rem}.button.is-large .icon.is-large:last-child:not(:first-child){margin-right:-.75rem}.button.is-large .icon.is-large:first-child:last-child{margin-left:calc(-1px + -.75rem);margin-right:calc(-1px + -.75rem)}.button[disabled],.button.is-disabled{opacity:0.5}.button.is-fullwidth{display:flex;width:100%}.button.is-loading{color:transparent !important;pointer-events:none}.button.is-loading:after{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1rem;position:relative;width:1rem;left:50%;margin-left:-8px;margin-top:-8px;position:absolute;top:50%;position:absolute !important}.content{color:#4a4a4a}.content:not(:last-child){margin-bottom:1.5rem}.content li+li{margin-top:0.25em}.content p:not(:last-child),.content ol:not(:last-child),.content ul:not(:last-child),.content blockquote:not(:last-child),.content table:not(:last-child){margin-bottom:1em}.content h1,.content h2,.content h3,.content h4,.content h5,.content h6{color:#363636;font-weight:400;line-height:1.125}.content h1{font-size:2em;margin-bottom:0.5em}.content h1:not(:first-child){margin-top:1em}.content h2{font-size:1.75em;margin-bottom:0.5714em}.content h2:not(:first-child){margin-top:1.1428em}.content h3{font-size:1.5em;margin-bottom:0.6666em}.content h3:not(:first-child){margin-top:1.3333em}.content h4{font-size:1.25em;margin-bottom:0.8em}.content h5{font-size:1.125em;margin-bottom:0.8888em}.content h6{font-size:1em;margin-bottom:1em}.content blockquote{background-color:#f5f5f5;border-left:5px solid #dbdbdb;padding:1.25em 1.5em}.content ol{list-style:decimal outside;margin-left:2em;margin-right:2em;margin-top:1em}.content ul{list-style:disc outside;margin-left:2em;margin-right:2em;margin-top:1em}.content ul ul{list-style-type:circle;margin-top:0.5em}.content ul ul ul{list-style-type:square}.content table{width:100%}.content table td,.content table th{border:1px solid #dbdbdb;border-width:0 0 1px;padding:0.5em 0.75em;vertical-align:top}.content table th{color:#363636;text-align:left}.content table tr:hover{background-color:#f5f5f5}.content table thead td,.content table thead th{border-width:0 0 2px;color:#363636}.content table tfoot td,.content table tfoot th{border-width:2px 0 0;color:#363636}.content table tbody tr:last-child td,.content table tbody tr:last-child th{border-bottom-width:0}.content.is-small{font-size:.75rem}.content.is-medium{font-size:1.25rem}.content.is-large{font-size:1.5rem}.input,.textarea{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;background-color:#fff;border:1px solid #dbdbdb;color:#363636;box-shadow:inset 0 1px 2px rgba(10,10,10,0.1);max-width:100%;width:100%}.input:focus,.input.is-focused,.input:active,.input.is-active,.textarea:focus,.textarea.is-focused,.textarea:active,.textarea.is-active{outline:none}.input[disabled],.input.is-disabled,.textarea[disabled],.textarea.is-disabled{pointer-events:none}.input:hover,.input.is-hovered,.textarea:hover,.textarea.is-hovered{border-color:#b5b5b5}.input:focus,.input.is-focused,.input:active,.input.is-active,.textarea:focus,.textarea.is-focused,.textarea:active,.textarea.is-active{border-color:#182b73}.input[disabled],.input.is-disabled,.textarea[disabled],.textarea.is-disabled{background-color:#f5f5f5;border-color:#f5f5f5;box-shadow:none;color:#7a7a7a}.input[disabled]::-moz-placeholder,.input.is-disabled::-moz-placeholder,.textarea[disabled]::-moz-placeholder,.textarea.is-disabled::-moz-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]::-webkit-input-placeholder,.input.is-disabled::-webkit-input-placeholder,.textarea[disabled]::-webkit-input-placeholder,.textarea.is-disabled::-webkit-input-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]:-moz-placeholder,.input.is-disabled:-moz-placeholder,.textarea[disabled]:-moz-placeholder,.textarea.is-disabled:-moz-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]:-ms-input-placeholder,.input.is-disabled:-ms-input-placeholder,.textarea[disabled]:-ms-input-placeholder,.textarea.is-disabled:-ms-input-placeholder{color:rgba(54,54,54,0.3)}.input[type=\"search\"],.textarea[type=\"search\"]{border-radius:290486px}.input.is-white,.textarea.is-white{border-color:#fff}.input.is-black,.textarea.is-black{border-color:#0a0a0a}.input.is-light,.textarea.is-light{border-color:#f5f5f5}.input.is-dark,.textarea.is-dark{border-color:#363636}.input.is-primary,.textarea.is-primary{border-color:#182b73}.input.is-info,.textarea.is-info{border-color:#3273dc}.input.is-success,.textarea.is-success{border-color:#23d160}.input.is-warning,.textarea.is-warning{border-color:#ffdd57}.input.is-danger,.textarea.is-danger{border-color:red}.input.is-small,.textarea.is-small{border-radius:2px;font-size:.75rem}.input.is-medium,.textarea.is-medium{font-size:1.25rem}.input.is-large,.textarea.is-large{font-size:1.5rem}.input.is-fullwidth,.textarea.is-fullwidth{display:block;width:100%}.input.is-inline,.textarea.is-inline{display:inline;width:auto}.textarea{display:block;line-height:1.25;max-height:600px;max-width:100%;min-height:120px;min-width:100%;padding:10px;resize:vertical}.checkbox,.radio{align-items:center;cursor:pointer;display:inline-flex;flex-wrap:wrap;justify-content:flex-start;position:relative;vertical-align:top}.checkbox input,.radio input{cursor:pointer;margin-right:0.5em}.checkbox:hover,.radio:hover{color:#363636}.checkbox.is-disabled,.radio.is-disabled{color:#7a7a7a;pointer-events:none}.checkbox.is-disabled input,.radio.is-disabled input{pointer-events:none}.radio+.radio{margin-left:0.5em}.select{display:inline-block;height:2.5em;position:relative;vertical-align:top}.select:after{border:1px solid #182b73;border-right:0;border-top:0;content:\" \";display:block;height:0.5em;pointer-events:none;position:absolute;transform:rotate(-45deg);width:0.5em;margin-top:-0.375em;right:1.125em;top:50%;z-index:4}.select select{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;background-color:#fff;border:1px solid #dbdbdb;color:#363636;cursor:pointer;display:block;font-size:1em;outline:none;padding-right:2.5em}.select select:focus,.select select.is-focused,.select select:active,.select select.is-active{outline:none}.select select[disabled],.select select.is-disabled{pointer-events:none}.select select:hover,.select select.is-hovered{border-color:#b5b5b5}.select select:focus,.select select.is-focused,.select select:active,.select select.is-active{border-color:#182b73}.select select[disabled],.select select.is-disabled{background-color:#f5f5f5;border-color:#f5f5f5;box-shadow:none;color:#7a7a7a}.select select[disabled]::-moz-placeholder,.select select.is-disabled::-moz-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]::-webkit-input-placeholder,.select select.is-disabled::-webkit-input-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]:-moz-placeholder,.select select.is-disabled:-moz-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]:-ms-input-placeholder,.select select.is-disabled:-ms-input-placeholder{color:rgba(54,54,54,0.3)}.select select:hover{border-color:#b5b5b5}.select select::ms-expand{display:none}.select:hover:after{border-color:#363636}.select.is-small{border-radius:2px;font-size:.75rem}.select.is-medium{font-size:1.25rem}.select.is-large{font-size:1.5rem}.select.is-fullwidth{width:100%}.select.is-fullwidth select{width:100%}.label{color:#363636;display:block;font-weight:bold}.label:not(:last-child){margin-bottom:0.5em}.help{display:block;font-size:.75rem;margin-top:5px}.help.is-white{color:#fff}.help.is-black{color:#0a0a0a}.help.is-light{color:#f5f5f5}.help.is-dark{color:#363636}.help.is-primary{color:#182b73}.help.is-info{color:#3273dc}.help.is-success{color:#23d160}.help.is-warning{color:#ffdd57}.help.is-danger{color:red}@media screen and (max-width: 768px){.control-label{margin-bottom:0.5em}}@media screen and (min-width: 769px){.control-label{flex-basis:0;flex-grow:1;flex-shrink:0;margin-right:1.5em;padding-top:0.5em;text-align:right}}.control{position:relative;text-align:left}.control:not(:last-child){margin-bottom:0.75rem}.control.has-addons{display:flex;justify-content:flex-start}.control.has-addons .button,.control.has-addons .input,.control.has-addons .select{border-radius:0;margin-right:-1px;width:auto}.control.has-addons .button:hover,.control.has-addons .input:hover,.control.has-addons .select:hover{z-index:2}.control.has-addons .button:focus,.control.has-addons .button:active,.control.has-addons .input:focus,.control.has-addons .input:active,.control.has-addons .select:focus,.control.has-addons .select:active{z-index:3}.control.has-addons .button:first-child,.control.has-addons .input:first-child,.control.has-addons .select:first-child{border-radius:3px 0 0 3px}.control.has-addons .button:first-child select,.control.has-addons .input:first-child select,.control.has-addons .select:first-child select{border-radius:3px 0 0 3px}.control.has-addons .button:last-child,.control.has-addons .input:last-child,.control.has-addons .select:last-child{border-radius:0 3px 3px 0}.control.has-addons .button:last-child select,.control.has-addons .input:last-child select,.control.has-addons .select:last-child select{border-radius:0 3px 3px 0}.control.has-addons .button.is-expanded,.control.has-addons .input.is-expanded,.control.has-addons .select.is-expanded{flex-grow:1;flex-shrink:0}.control.has-addons .select select:hover{z-index:2}.control.has-addons .select select:focus,.control.has-addons .select select:active{z-index:3}.control.has-addons.has-addons-centered{justify-content:center}.control.has-addons.has-addons-right{justify-content:flex-end}.control.has-addons.has-addons-fullwidth .button,.control.has-addons.has-addons-fullwidth .input,.control.has-addons.has-addons-fullwidth .select{flex-grow:1;flex-shrink:0}.control.has-icon .icon{color:#dbdbdb;pointer-events:none;position:absolute;top:1.25rem;z-index:4}.control.has-icon .input:focus+.icon{color:#7a7a7a}.control.has-icon .input.is-small+.icon{top:.9375rem}.control.has-icon .input.is-medium+.icon{top:1.5625rem}.control.has-icon .input.is-large+.icon{top:1.875rem}.control.has-icon:not(.has-icon-right) .icon{left:1.25rem;transform:translateX(-50%) translateY(-50%)}.control.has-icon:not(.has-icon-right) .input{padding-left:2.5em}.control.has-icon:not(.has-icon-right) .input.is-small+.icon{left:.9375rem}.control.has-icon:not(.has-icon-right) .input.is-medium+.icon{left:1.5625rem}.control.has-icon:not(.has-icon-right) .input.is-large+.icon{left:1.875rem}.control.has-icon.has-icon-right .icon{right:1.25rem;transform:translateX(50%) translateY(-50%)}.control.has-icon.has-icon-right .input{padding-right:2.5em}.control.has-icon.has-icon-right .input.is-small+.icon{right:.9375rem}.control.has-icon.has-icon-right .input.is-medium+.icon{right:1.5625rem}.control.has-icon.has-icon-right .input.is-large+.icon{right:1.875rem}.control.is-grouped{display:flex;justify-content:flex-start}.control.is-grouped>.control{flex-basis:0;flex-shrink:0}.control.is-grouped>.control:not(:last-child){margin-bottom:0;margin-right:0.75rem}.control.is-grouped>.control.is-expanded{flex-grow:1;flex-shrink:1}.control.is-grouped.is-grouped-centered{justify-content:center}.control.is-grouped.is-grouped-right{justify-content:flex-end}@media screen and (min-width: 769px){.control.is-horizontal{display:flex}.control.is-horizontal>.control{display:flex;flex-basis:0;flex-grow:5;flex-shrink:1}}.control.is-loading:after{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1rem;position:relative;width:1rem;position:absolute !important;right:0.75em;top:0.75em}.icon{display:inline-block;font-size:21px;height:1.5rem;line-height:1.5rem;text-align:center;vertical-align:top;width:1.5rem}.icon .fa{font-size:inherit;line-height:inherit}.icon.is-small{display:inline-block;font-size:14px;height:1rem;line-height:1rem;text-align:center;vertical-align:top;width:1rem}.icon.is-medium{display:inline-block;font-size:28px;height:2rem;line-height:2rem;text-align:center;vertical-align:top;width:2rem}.icon.is-large{display:inline-block;font-size:42px;height:3rem;line-height:3rem;text-align:center;vertical-align:top;width:3rem}.image{display:block;position:relative}.image img{display:block;height:auto;width:100%}.image.is-square img,.image.is-1by1 img,.image.is-4by3 img,.image.is-3by2 img,.image.is-16by9 img,.image.is-2by1 img{bottom:0;left:0;position:absolute;right:0;top:0;height:100%;width:100%}.image.is-square,.image.is-1by1{padding-top:100%}.image.is-4by3{padding-top:75%}.image.is-3by2{padding-top:66.6666%}.image.is-16by9{padding-top:56.25%}.image.is-2by1{padding-top:50%}.image.is-16x16{height:16px;width:16px}.image.is-24x24{height:24px;width:24px}.image.is-32x32{height:32px;width:32px}.image.is-48x48{height:48px;width:48px}.image.is-64x64{height:64px;width:64px}.image.is-96x96{height:96px;width:96px}.image.is-128x128{height:128px;width:128px}.notification{background-color:#f5f5f5;border-radius:3px;padding:1.25rem 2.5rem 1.25rem 1.5rem;position:relative}.notification:not(:last-child){margin-bottom:1.5rem}.notification code,.notification pre{background:#fff}.notification pre code{background:transparent}.notification .delete{position:absolute;right:0.5em;top:0.5em}.notification .title,.notification .subtitle,.notification .content{color:inherit}.notification.is-white{background-color:#fff;color:#0a0a0a}.notification.is-black{background-color:#0a0a0a;color:#fff}.notification.is-light{background-color:#f5f5f5;color:#363636}.notification.is-dark{background-color:#363636;color:#f5f5f5}.notification.is-primary{background-color:#182b73;color:#fff}.notification.is-info{background-color:#3273dc;color:#fff}.notification.is-success{background-color:#23d160;color:#fff}.notification.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.notification.is-danger{background-color:red;color:#fff}.progress{-moz-appearance:none;-webkit-appearance:none;border:none;border-radius:290486px;display:block;height:1rem;overflow:hidden;padding:0;width:100%}.progress:not(:last-child){margin-bottom:1.5rem}.progress::-webkit-progress-bar{background-color:#dbdbdb}.progress::-webkit-progress-value{background-color:#4a4a4a}.progress::-moz-progress-bar{background-color:#4a4a4a}.progress.is-white::-webkit-progress-value{background-color:#fff}.progress.is-white::-moz-progress-bar{background-color:#fff}.progress.is-black::-webkit-progress-value{background-color:#0a0a0a}.progress.is-black::-moz-progress-bar{background-color:#0a0a0a}.progress.is-light::-webkit-progress-value{background-color:#f5f5f5}.progress.is-light::-moz-progress-bar{background-color:#f5f5f5}.progress.is-dark::-webkit-progress-value{background-color:#363636}.progress.is-dark::-moz-progress-bar{background-color:#363636}.progress.is-primary::-webkit-progress-value{background-color:#182b73}.progress.is-primary::-moz-progress-bar{background-color:#182b73}.progress.is-info::-webkit-progress-value{background-color:#3273dc}.progress.is-info::-moz-progress-bar{background-color:#3273dc}.progress.is-success::-webkit-progress-value{background-color:#23d160}.progress.is-success::-moz-progress-bar{background-color:#23d160}.progress.is-warning::-webkit-progress-value{background-color:#ffdd57}.progress.is-warning::-moz-progress-bar{background-color:#ffdd57}.progress.is-danger::-webkit-progress-value{background-color:red}.progress.is-danger::-moz-progress-bar{background-color:red}.progress.is-small{height:.75rem}.progress.is-medium{height:1.25rem}.progress.is-large{height:1.5rem}.table{background-color:#fff;color:#363636;margin-bottom:1.5rem;width:100%}.table td,.table th{border:1px solid #dbdbdb;border-width:0 0 1px;padding:0.5em 0.75em;vertical-align:top}.table td.is-narrow,.table th.is-narrow{white-space:nowrap;width:1%}.table th{color:#363636;text-align:left}.table tr:hover{background-color:#fafafa}.table thead td,.table thead th{border-width:0 0 2px;color:#7a7a7a}.table tfoot td,.table tfoot th{border-width:2px 0 0;color:#7a7a7a}.table tbody tr:last-child td,.table tbody tr:last-child th{border-bottom-width:0}.table.is-bordered td,.table.is-bordered th{border-width:1px}.table.is-bordered tr:last-child td,.table.is-bordered tr:last-child th{border-bottom-width:1px}.table.is-narrow td,.table.is-narrow th{padding:0.25em 0.5em}.table.is-striped tbody tr:nth-child(even){background-color:#fafafa}.table.is-striped tbody tr:nth-child(even):hover{background-color:#f5f5f5}.tag{align-items:center;background-color:#f5f5f5;border-radius:290486px;color:#4a4a4a;display:inline-flex;font-size:.75rem;height:2em;justify-content:center;line-height:1.5;padding-left:0.875em;padding-right:0.875em;vertical-align:top;white-space:nowrap}.tag .delete{margin-left:0.25em;margin-right:-0.5em}.tag.is-white{background-color:#fff;color:#0a0a0a}.tag.is-black{background-color:#0a0a0a;color:#fff}.tag.is-light{background-color:#f5f5f5;color:#363636}.tag.is-dark{background-color:#363636;color:#f5f5f5}.tag.is-primary{background-color:#182b73;color:#fff}.tag.is-info{background-color:#3273dc;color:#fff}.tag.is-success{background-color:#23d160;color:#fff}.tag.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.tag.is-danger{background-color:red;color:#fff}.tag.is-medium{font-size:1rem}.tag.is-large{font-size:1.25rem}.title,.subtitle{word-break:break-word}.title:not(:last-child),.subtitle:not(:last-child){margin-bottom:1.5rem}.title em,.title span,.subtitle em,.subtitle span{font-weight:300}.title strong,.subtitle strong{font-weight:500}.title .tag,.subtitle .tag{vertical-align:middle}.title{color:#363636;font-size:2rem;font-weight:300;line-height:1.125}.title strong{color:inherit}.title+.highlight{margin-top:-0.75rem}.title+.subtitle{margin-top:-1.25rem}.title.is-1{font-size:3.5rem}.title.is-2{font-size:2.75rem}.title.is-3{font-size:2rem}.title.is-4{font-size:1.5rem}.title.is-5{font-size:1.25rem}.title.is-6{font-size:14px}.subtitle{color:#4a4a4a;font-size:1.25rem;font-weight:300;line-height:1.25}.subtitle strong{color:#363636}.subtitle+.title{margin-top:-1.5rem}.subtitle.is-1{font-size:3.5rem}.subtitle.is-2{font-size:2.75rem}.subtitle.is-3{font-size:2rem}.subtitle.is-4{font-size:1.5rem}.subtitle.is-5{font-size:1.25rem}.subtitle.is-6{font-size:14px}.block:not(:last-child){margin-bottom:1.5rem}.container{position:relative}@media screen and (min-width: 1000px){.container{margin:0 auto;max-width:960px}.container.is-fluid{margin:0 20px;max-width:none}}@media screen and (min-width: 1192px){.container{max-width:1152px}}.delete{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-moz-appearance:none;-webkit-appearance:none;background-color:rgba(10,10,10,0.2);border:none;border-radius:290486px;cursor:pointer;display:inline-block;font-size:1rem;height:20px;outline:none;position:relative;transform:rotate(45deg);transform-origin:center center;vertical-align:top;width:20px}.delete:before,.delete:after{background-color:#fff;content:\"\";display:block;left:50%;position:absolute;top:50%;transform:translateX(-50%) translateY(-50%)}.delete:before{height:2px;width:50%}.delete:after{height:50%;width:2px}.delete:hover,.delete:focus{background-color:rgba(10,10,10,0.3)}.delete:active{background-color:rgba(10,10,10,0.4)}.delete.is-small{height:14px;width:14px}.delete.is-medium{height:26px;width:26px}.delete.is-large{height:30px;width:30px}.fa{font-size:21px;text-align:center;vertical-align:top}.heading{display:block;font-size:11px;letter-spacing:1px;margin-bottom:5px;text-transform:uppercase}.highlight{font-weight:400;max-width:100%;overflow:hidden;padding:0}.highlight:not(:last-child){margin-bottom:1.5rem}.highlight pre{overflow:auto;max-width:100%}.loader{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1rem;position:relative;width:1rem}.number{align-items:center;background-color:#f5f5f5;border-radius:290486px;display:inline-flex;font-size:1.25rem;height:2em;justify-content:center;margin-right:1.5rem;min-width:2.5em;padding:0.25rem 0.5rem;text-align:center;vertical-align:top}.card-header{align-items:stretch;box-shadow:0 1px 2px rgba(10,10,10,0.1);display:flex}.card-header-title{align-items:center;color:#363636;display:flex;flex-grow:1;font-weight:700;padding:0.75rem}.card-header-icon{align-items:center;cursor:pointer;display:flex;justify-content:center;padding:0.75rem}.card-image{display:block;position:relative}.card-content{padding:1.5rem}.card-content .title+.subtitle{margin-top:-1.5rem}.card-footer{border-top:1px solid #dbdbdb;align-items:stretch;display:flex}.card-footer-item{align-items:center;display:flex;flex-basis:0;flex-grow:1;flex-shrink:0;justify-content:center;padding:0.75rem}.card-footer-item:not(:last-child){border-right:1px solid #dbdbdb}.card{background-color:#fff;box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px rgba(10,10,10,0.1);color:#4a4a4a;max-width:100%;position:relative}.card .media:not(:last-child){margin-bottom:0.75rem}.level-item{align-items:center;display:flex;flex-basis:auto;flex-grow:0;flex-shrink:0;justify-content:center}.level-item .title,.level-item .subtitle{margin-bottom:0}@media screen and (max-width: 768px){.level-item:not(:last-child){margin-bottom:0.75rem}}.level-left,.level-right{flex-basis:auto;flex-grow:0;flex-shrink:0}.level-left .level-item:not(:last-child),.level-right .level-item:not(:last-child){margin-right:0.75rem}.level-left .level-item.is-flexible,.level-right .level-item.is-flexible{flex-grow:1}.level-left{align-items:center;justify-content:flex-start}@media screen and (max-width: 768px){.level-left+.level-right{margin-top:1.5rem}}@media screen and (min-width: 769px){.level-left{display:flex}}.level-right{align-items:center;justify-content:flex-end}@media screen and (min-width: 769px){.level-right{display:flex}}.level{align-items:center;justify-content:space-between}.level:not(:last-child){margin-bottom:1.5rem}.level code{border-radius:3px}.level img{display:inline-block;vertical-align:top}.level.is-mobile{display:flex}.level.is-mobile>.level-item:not(:last-child){margin-bottom:0}.level.is-mobile>.level-item:not(.is-narrow){flex-grow:1}@media screen and (min-width: 769px){.level{display:flex}.level>.level-item:not(.is-narrow){flex-grow:1}}.media-left,.media-right{flex-basis:auto;flex-grow:0;flex-shrink:0}.media-left{margin-right:1rem}.media-right{margin-left:1rem}.media-content{flex-basis:auto;flex-grow:1;flex-shrink:1;text-align:left}.media{align-items:flex-start;display:flex;text-align:left}.media .content:not(:last-child){margin-bottom:0.75rem}.media .media{border-top:1px solid rgba(219,219,219,0.5);display:flex;padding-top:0.75rem}.media .media .content:not(:last-child),.media .media .control:not(:last-child){margin-bottom:0.5rem}.media .media .media{padding-top:0.5rem}.media .media .media+.media{margin-top:0.5rem}.media+.media{border-top:1px solid rgba(219,219,219,0.5);margin-top:1rem;padding-top:1rem}.media.is-large+.media{margin-top:1.5rem;padding-top:1.5rem}.menu{font-size:1rem}.menu-list{line-height:1.25}.menu-list a{border-radius:2px;color:#4a4a4a;display:block;padding:0.5em 0.75em}.menu-list a:hover{background-color:#f5f5f5;color:#182b73}.menu-list a.is-active{background-color:#182b73;color:#fff}.menu-list li ul{border-left:1px solid #dbdbdb;margin:0.75em;padding-left:0.75em}.menu-label{color:#7a7a7a;font-size:0.8em;letter-spacing:0.1em;text-transform:uppercase}.menu-label:not(:first-child){margin-top:1em}.menu-label:not(:last-child){margin-bottom:1em}.message{background-color:#f5f5f5;border-radius:3px;font-size:1rem}.message:not(:last-child){margin-bottom:1.5rem}.message.is-white{background-color:#fff}.message.is-white .message-header{background-color:#fff;color:#0a0a0a}.message.is-white .message-body{border-color:#fff;color:#4d4d4d}.message.is-black{background-color:#fafafa}.message.is-black .message-header{background-color:#0a0a0a;color:#fff}.message.is-black .message-body{border-color:#0a0a0a;color:#090909}.message.is-light{background-color:#fafafa}.message.is-light .message-header{background-color:#f5f5f5;color:#363636}.message.is-light .message-body{border-color:#f5f5f5;color:#505050}.message.is-dark{background-color:#fafafa}.message.is-dark .message-header{background-color:#363636;color:#f5f5f5}.message.is-dark .message-body{border-color:#363636;color:#2a2a2a}.message.is-primary{background-color:#f7f8fd}.message.is-primary .message-header{background-color:#182b73;color:#fff}.message.is-primary .message-body{border-color:#182b73;color:#162662}.message.is-info{background-color:#f6f9fe}.message.is-info .message-header{background-color:#3273dc;color:#fff}.message.is-info .message-body{border-color:#3273dc;color:#22509a}.message.is-success{background-color:#f6fef9}.message.is-success .message-header{background-color:#23d160;color:#fff}.message.is-success .message-body{border-color:#23d160;color:#0e301a}.message.is-warning{background-color:#fffdf5}.message.is-warning .message-header{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.message.is-warning .message-body{border-color:#ffdd57;color:#3b3108}.message.is-danger{background-color:#fff5f5}.message.is-danger .message-header{background-color:red;color:#fff}.message.is-danger .message-body{border-color:red;color:#ad0606}.message-header{align-items:center;background-color:#4a4a4a;border-radius:3px 3px 0 0;color:#fff;display:flex;justify-content:space-between;line-height:1.25;padding:0.5em 0.75em;position:relative}.message-header a,.message-header strong{color:inherit}.message-header a{text-decoration:underline}.message-header .delete{flex-grow:0;flex-shrink:0;margin-left:0.75em}.message-header+.message-body{border-top-left-radius:0;border-top-right-radius:0;border-top:none}.message-body{border:1px solid #dbdbdb;border-radius:3px;color:#4a4a4a;padding:1em 1.25em}.message-body a,.message-body strong{color:inherit}.message-body a{text-decoration:underline}.message-body code,.message-body pre{background:#fff}.message-body pre code{background:transparent}.modal-background{bottom:0;left:0;position:absolute;right:0;top:0;background-color:rgba(10,10,10,0.86)}.modal-content,.modal-card{margin:0 20px;max-height:calc(100vh - 160px);overflow:auto;position:relative;width:100%}@media screen and (min-width: 769px){.modal-content,.modal-card{margin:0 auto;max-height:calc(100vh - 40px);width:640px}}.modal-close{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-moz-appearance:none;-webkit-appearance:none;background-color:rgba(10,10,10,0.2);border:none;border-radius:290486px;cursor:pointer;display:inline-block;font-size:1rem;height:20px;outline:none;position:relative;transform:rotate(45deg);transform-origin:center center;vertical-align:top;width:20px;background:none;height:40px;position:fixed;right:20px;top:20px;width:40px}.modal-close:before,.modal-close:after{background-color:#fff;content:\"\";display:block;left:50%;position:absolute;top:50%;transform:translateX(-50%) translateY(-50%)}.modal-close:before{height:2px;width:50%}.modal-close:after{height:50%;width:2px}.modal-close:hover,.modal-close:focus{background-color:rgba(10,10,10,0.3)}.modal-close:active{background-color:rgba(10,10,10,0.4)}.modal-close.is-small{height:14px;width:14px}.modal-close.is-medium{height:26px;width:26px}.modal-close.is-large{height:30px;width:30px}.modal-card{display:flex;flex-direction:column;max-height:calc(100vh - 40px);overflow:hidden}.modal-card-head,.modal-card-foot{align-items:center;background-color:#f5f5f5;display:flex;flex-shrink:0;justify-content:flex-start;padding:20px;position:relative}.modal-card-head{border-bottom:1px solid #dbdbdb;border-top-left-radius:5px;border-top-right-radius:5px}.modal-card-title{color:#363636;flex-grow:1;flex-shrink:0;font-size:1.5rem;line-height:1}.modal-card-foot{border-bottom-left-radius:5px;border-bottom-right-radius:5px;border-top:1px solid #dbdbdb}.modal-card-foot .button:not(:last-child){margin-right:10px}.modal-card-body{-webkit-overflow-scrolling:touch;background-color:#fff;flex-grow:1;flex-shrink:1;overflow:auto;padding:20px}.modal{bottom:0;left:0;position:absolute;right:0;top:0;align-items:center;display:none;justify-content:center;overflow:hidden;position:fixed;z-index:1986}.modal.is-active{display:flex}.nav-toggle{cursor:pointer;display:block;height:3.5rem;position:relative;width:3.5rem}.nav-toggle span{background-color:#4a4a4a;display:block;height:1px;left:50%;margin-left:-7px;position:absolute;top:50%;transition:none 86ms ease-out;transition-property:background, left, opacity, transform;width:15px}.nav-toggle span:nth-child(1){margin-top:-6px}.nav-toggle span:nth-child(2){margin-top:-1px}.nav-toggle span:nth-child(3){margin-top:4px}.nav-toggle:hover{background-color:#f5f5f5}.nav-toggle.is-active span{background-color:#182b73}.nav-toggle.is-active span:nth-child(1){margin-left:-5px;transform:rotate(45deg);transform-origin:left top}.nav-toggle.is-active span:nth-child(2){opacity:0}.nav-toggle.is-active span:nth-child(3){margin-left:-5px;transform:rotate(-45deg);transform-origin:left bottom}@media screen and (min-width: 769px){.nav-toggle{display:none}}.nav-item{align-items:center;display:flex;flex-grow:0;flex-shrink:0;font-size:1rem;justify-content:center;padding:0.5rem 0.75rem}.nav-item a{flex-grow:1;flex-shrink:0}.nav-item img{max-height:1.75rem}.nav-item .button+.button{margin-left:0.75rem}.nav-item .tag:first-child:not(:last-child){margin-right:0.5rem}.nav-item .tag:last-child:not(:first-child){margin-left:0.5rem}@media screen and (max-width: 768px){.nav-item{justify-content:flex-start}}.nav-item a,a.nav-item{color:#7a7a7a}.nav-item a:hover,a.nav-item:hover{color:#363636}.nav-item a.is-active,a.nav-item.is-active{color:#363636}.nav-item a.is-tab,a.nav-item.is-tab{border-bottom:1px solid transparent;border-top:1px solid transparent;padding-bottom:calc(0.5rem - 1px);padding-left:1rem;padding-right:1rem;padding-top:calc(0.5rem - 1px)}.nav-item a.is-tab:hover,a.nav-item.is-tab:hover{border-bottom-color:#182b73;border-top-color:transparent}.nav-item a.is-tab.is-active,a.nav-item.is-tab.is-active{border-bottom:3px solid #182b73;color:#182b73;padding-bottom:calc(0.5rem - 3px)}@media screen and (min-width: 1000px){.nav-item a.is-brand,a.nav-item.is-brand{padding-left:0}}@media screen and (max-width: 768px){.nav-menu{background-color:#fff;box-shadow:0 4px 7px rgba(10,10,10,0.1);left:0;display:none;right:0;top:100%;position:absolute}.nav-menu .nav-item{border-top:1px solid rgba(219,219,219,0.5);padding:0.75rem}.nav-menu.is-active{display:block}}@media screen and (min-width: 769px) and (max-width: 999px){.nav-menu{padding-right:1.5rem}}.nav-left,.nav-right{align-items:stretch;flex-basis:0;flex-grow:1;flex-shrink:0}.nav-left{display:flex;justify-content:flex-start;overflow:hidden;overflow-x:auto;white-space:nowrap}.nav-center{align-items:stretch;display:flex;flex-grow:0;flex-shrink:0;justify-content:center;margin-left:auto;margin-right:auto}.nav-right{justify-content:flex-end}@media screen and (min-width: 769px){.nav-right{display:flex}}.nav{align-items:stretch;background-color:#fff;display:flex;min-height:3.5rem;position:relative;text-align:center;z-index:2}.nav>.container{align-items:stretch;display:flex;min-height:3.5rem;width:100%}.nav.has-shadow{box-shadow:0 2px 3px rgba(10,10,10,0.1)}.pagination,.pagination-list{align-items:center;display:flex;justify-content:center;text-align:center}.pagination-previous,.pagination-next,.pagination-link,.pagination-ellipsis{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;font-size:0.875rem;padding-left:0.5em;padding-right:0.5em;justify-content:center;text-align:center}.pagination-previous:focus,.pagination-previous.is-focused,.pagination-previous:active,.pagination-previous.is-active,.pagination-next:focus,.pagination-next.is-focused,.pagination-next:active,.pagination-next.is-active,.pagination-link:focus,.pagination-link.is-focused,.pagination-link:active,.pagination-link.is-active,.pagination-ellipsis:focus,.pagination-ellipsis.is-focused,.pagination-ellipsis:active,.pagination-ellipsis.is-active{outline:none}.pagination-previous[disabled],.pagination-previous.is-disabled,.pagination-next[disabled],.pagination-next.is-disabled,.pagination-link[disabled],.pagination-link.is-disabled,.pagination-ellipsis[disabled],.pagination-ellipsis.is-disabled{pointer-events:none}.pagination-previous,.pagination-next,.pagination-link{border:1px solid #dbdbdb;min-width:2.5em}.pagination-previous:hover,.pagination-next:hover,.pagination-link:hover{border-color:#b5b5b5;color:#363636}.pagination-previous:focus,.pagination-next:focus,.pagination-link:focus{border-color:#182b73}.pagination-previous:active,.pagination-next:active,.pagination-link:active{box-shadow:inset 0 1px 2px rgba(10,10,10,0.2)}.pagination-previous[disabled],.pagination-previous.is-disabled,.pagination-next[disabled],.pagination-next.is-disabled,.pagination-link[disabled],.pagination-link.is-disabled{background:#dbdbdb;color:#7a7a7a;opacity:0.5;pointer-events:none}.pagination-previous,.pagination-next{padding-left:0.75em;padding-right:0.75em}.pagination-link.is-current{background-color:#182b73;border-color:#182b73;color:#fff}.pagination-ellipsis{color:#b5b5b5;pointer-events:none}.pagination-list li:not(:first-child){margin-left:0.375rem}@media screen and (max-width: 768px){.pagination{flex-wrap:wrap}.pagination-previous,.pagination-next{flex-grow:1;flex-shrink:1;width:calc(50% - 0.375rem)}.pagination-next{margin-left:0.75rem}.pagination-list{margin-top:0.75rem}.pagination-list li{flex-grow:1;flex-shrink:1}}@media screen and (min-width: 769px){.pagination-list{flex-grow:1;flex-shrink:1;justify-content:flex-start;order:1}.pagination-previous,.pagination-next{margin-left:0.75rem}.pagination-previous{order:2}.pagination-next{order:3}.pagination{justify-content:space-between}.pagination.is-centered .pagination-previous{margin-left:0;order:1}.pagination.is-centered .pagination-list{justify-content:center;order:2}.pagination.is-centered .pagination-next{order:3}.pagination.is-right .pagination-previous{margin-left:0;order:1}.pagination.is-right .pagination-next{order:2;margin-right:0.75rem}.pagination.is-right .pagination-list{justify-content:flex-end;order:3}}.panel{font-size:1rem}.panel:not(:last-child){margin-bottom:1.5rem}.panel-heading,.panel-tabs,.panel-block{border-bottom:1px solid #dbdbdb;border-left:1px solid #dbdbdb;border-right:1px solid #dbdbdb}.panel-heading:first-child,.panel-tabs:first-child,.panel-block:first-child{border-top:1px solid #dbdbdb}.panel-heading{background-color:#f5f5f5;border-radius:3px 3px 0 0;color:#363636;font-size:1.25em;font-weight:300;line-height:1.25;padding:0.5em 0.75em}.panel-tabs{align-items:flex-end;display:flex;font-size:0.875em;justify-content:center}.panel-tabs a{border-bottom:1px solid #dbdbdb;margin-bottom:-1px;padding:0.5em}.panel-tabs a.is-active{border-bottom-color:#4a4a4a;color:#363636}.panel-list a{color:#4a4a4a}.panel-list a:hover{color:#182b73}.panel-block{align-items:center;color:#363636;display:flex;justify-content:flex-start;padding:0.5em 0.75em}.panel-block input[type=\"checkbox\"]{margin-right:0.75em}.panel-block>.control{flex-grow:1;flex-shrink:1;width:100%}.panel-block.is-active{border-left-color:#182b73;color:#363636}.panel-block.is-active .panel-icon{color:#182b73}a.panel-block,label.panel-block{cursor:pointer}a.panel-block:hover,label.panel-block:hover{background-color:#f5f5f5}.panel-icon{display:inline-block;font-size:14px;height:1em;line-height:1em;text-align:center;vertical-align:top;width:1em;color:#7a7a7a;margin-right:0.75em}.panel-icon .fa{font-size:inherit;line-height:inherit}.tabs{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;align-items:stretch;display:flex;font-size:1rem;justify-content:space-between;overflow:hidden;overflow-x:auto;white-space:nowrap}.tabs:not(:last-child){margin-bottom:1.5rem}.tabs a{align-items:center;border-bottom:1px solid #dbdbdb;color:#4a4a4a;display:flex;justify-content:center;margin-bottom:-1px;padding:0.5em 1em;vertical-align:top}.tabs a:hover{border-bottom-color:#363636;color:#363636}.tabs li{display:block}.tabs li.is-active a{border-bottom-color:#182b73;color:#182b73}.tabs ul{align-items:center;border-bottom:1px solid #dbdbdb;display:flex;flex-grow:1;flex-shrink:0;justify-content:flex-start}.tabs ul.is-left{padding-right:0.75em}.tabs ul.is-center{flex:none;justify-content:center;padding-left:0.75em;padding-right:0.75em}.tabs ul.is-right{justify-content:flex-end;padding-left:0.75em}.tabs .icon:first-child{margin-right:0.5em}.tabs .icon:last-child{margin-left:0.5em}.tabs.is-centered ul{justify-content:center}.tabs.is-right ul{justify-content:flex-end}.tabs.is-boxed a{border:1px solid transparent;border-radius:3px 3px 0 0}.tabs.is-boxed a:hover{background-color:#f5f5f5;border-bottom-color:#dbdbdb}.tabs.is-boxed li.is-active a{background-color:#fff;border-color:#dbdbdb;border-bottom-color:transparent !important}.tabs.is-fullwidth li{flex-grow:1;flex-shrink:0}.tabs.is-toggle a{border:1px solid #dbdbdb;margin-bottom:0;position:relative}.tabs.is-toggle a:hover{background-color:#f5f5f5;border-color:#b5b5b5;z-index:2}.tabs.is-toggle li+li{margin-left:-1px}.tabs.is-toggle li:first-child a{border-radius:3px 0 0 3px}.tabs.is-toggle li:last-child a{border-radius:0 3px 3px 0}.tabs.is-toggle li.is-active a{background-color:#182b73;border-color:#182b73;color:#fff;z-index:1}.tabs.is-toggle ul{border-bottom:none}.tabs.is-small{font-size:.75rem}.tabs.is-medium{font-size:1.25rem}.tabs.is-large{font-size:1.5rem}.column{display:block;flex-basis:0;flex-grow:1;flex-shrink:1;padding:0.75rem}.columns.is-mobile>.column.is-narrow{flex:none}.columns.is-mobile>.column.is-full{flex:none;width:100%}.columns.is-mobile>.column.is-three-quarters{flex:none;width:75%}.columns.is-mobile>.column.is-two-thirds{flex:none;width:66.6666%}.columns.is-mobile>.column.is-half{flex:none;width:50%}.columns.is-mobile>.column.is-one-third{flex:none;width:33.3333%}.columns.is-mobile>.column.is-one-quarter{flex:none;width:25%}.columns.is-mobile>.column.is-offset-three-quarters{margin-left:75%}.columns.is-mobile>.column.is-offset-two-thirds{margin-left:66.6666%}.columns.is-mobile>.column.is-offset-half{margin-left:50%}.columns.is-mobile>.column.is-offset-one-third{margin-left:33.3333%}.columns.is-mobile>.column.is-offset-one-quarter{margin-left:25%}.columns.is-mobile>.column.is-1{flex:none;width:8.33333%}.columns.is-mobile>.column.is-offset-1{margin-left:8.33333%}.columns.is-mobile>.column.is-2{flex:none;width:16.66667%}.columns.is-mobile>.column.is-offset-2{margin-left:16.66667%}.columns.is-mobile>.column.is-3{flex:none;width:25%}.columns.is-mobile>.column.is-offset-3{margin-left:25%}.columns.is-mobile>.column.is-4{flex:none;width:33.33333%}.columns.is-mobile>.column.is-offset-4{margin-left:33.33333%}.columns.is-mobile>.column.is-5{flex:none;width:41.66667%}.columns.is-mobile>.column.is-offset-5{margin-left:41.66667%}.columns.is-mobile>.column.is-6{flex:none;width:50%}.columns.is-mobile>.column.is-offset-6{margin-left:50%}.columns.is-mobile>.column.is-7{flex:none;width:58.33333%}.columns.is-mobile>.column.is-offset-7{margin-left:58.33333%}.columns.is-mobile>.column.is-8{flex:none;width:66.66667%}.columns.is-mobile>.column.is-offset-8{margin-left:66.66667%}.columns.is-mobile>.column.is-9{flex:none;width:75%}.columns.is-mobile>.column.is-offset-9{margin-left:75%}.columns.is-mobile>.column.is-10{flex:none;width:83.33333%}.columns.is-mobile>.column.is-offset-10{margin-left:83.33333%}.columns.is-mobile>.column.is-11{flex:none;width:91.66667%}.columns.is-mobile>.column.is-offset-11{margin-left:91.66667%}.columns.is-mobile>.column.is-12{flex:none;width:100%}.columns.is-mobile>.column.is-offset-12{margin-left:100%}@media screen and (max-width: 768px){.column.is-narrow-mobile{flex:none}.column.is-full-mobile{flex:none;width:100%}.column.is-three-quarters-mobile{flex:none;width:75%}.column.is-two-thirds-mobile{flex:none;width:66.6666%}.column.is-half-mobile{flex:none;width:50%}.column.is-one-third-mobile{flex:none;width:33.3333%}.column.is-one-quarter-mobile{flex:none;width:25%}.column.is-offset-three-quarters-mobile{margin-left:75%}.column.is-offset-two-thirds-mobile{margin-left:66.6666%}.column.is-offset-half-mobile{margin-left:50%}.column.is-offset-one-third-mobile{margin-left:33.3333%}.column.is-offset-one-quarter-mobile{margin-left:25%}.column.is-1-mobile{flex:none;width:8.33333%}.column.is-offset-1-mobile{margin-left:8.33333%}.column.is-2-mobile{flex:none;width:16.66667%}.column.is-offset-2-mobile{margin-left:16.66667%}.column.is-3-mobile{flex:none;width:25%}.column.is-offset-3-mobile{margin-left:25%}.column.is-4-mobile{flex:none;width:33.33333%}.column.is-offset-4-mobile{margin-left:33.33333%}.column.is-5-mobile{flex:none;width:41.66667%}.column.is-offset-5-mobile{margin-left:41.66667%}.column.is-6-mobile{flex:none;width:50%}.column.is-offset-6-mobile{margin-left:50%}.column.is-7-mobile{flex:none;width:58.33333%}.column.is-offset-7-mobile{margin-left:58.33333%}.column.is-8-mobile{flex:none;width:66.66667%}.column.is-offset-8-mobile{margin-left:66.66667%}.column.is-9-mobile{flex:none;width:75%}.column.is-offset-9-mobile{margin-left:75%}.column.is-10-mobile{flex:none;width:83.33333%}.column.is-offset-10-mobile{margin-left:83.33333%}.column.is-11-mobile{flex:none;width:91.66667%}.column.is-offset-11-mobile{margin-left:91.66667%}.column.is-12-mobile{flex:none;width:100%}.column.is-offset-12-mobile{margin-left:100%}}@media screen and (min-width: 769px){.column.is-narrow,.column.is-narrow-tablet{flex:none}.column.is-full,.column.is-full-tablet{flex:none;width:100%}.column.is-three-quarters,.column.is-three-quarters-tablet{flex:none;width:75%}.column.is-two-thirds,.column.is-two-thirds-tablet{flex:none;width:66.6666%}.column.is-half,.column.is-half-tablet{flex:none;width:50%}.column.is-one-third,.column.is-one-third-tablet{flex:none;width:33.3333%}.column.is-one-quarter,.column.is-one-quarter-tablet{flex:none;width:25%}.column.is-offset-three-quarters,.column.is-offset-three-quarters-tablet{margin-left:75%}.column.is-offset-two-thirds,.column.is-offset-two-thirds-tablet{margin-left:66.6666%}.column.is-offset-half,.column.is-offset-half-tablet{margin-left:50%}.column.is-offset-one-third,.column.is-offset-one-third-tablet{margin-left:33.3333%}.column.is-offset-one-quarter,.column.is-offset-one-quarter-tablet{margin-left:25%}.column.is-1,.column.is-1-tablet{flex:none;width:8.33333%}.column.is-offset-1,.column.is-offset-1-tablet{margin-left:8.33333%}.column.is-2,.column.is-2-tablet{flex:none;width:16.66667%}.column.is-offset-2,.column.is-offset-2-tablet{margin-left:16.66667%}.column.is-3,.column.is-3-tablet{flex:none;width:25%}.column.is-offset-3,.column.is-offset-3-tablet{margin-left:25%}.column.is-4,.column.is-4-tablet{flex:none;width:33.33333%}.column.is-offset-4,.column.is-offset-4-tablet{margin-left:33.33333%}.column.is-5,.column.is-5-tablet{flex:none;width:41.66667%}.column.is-offset-5,.column.is-offset-5-tablet{margin-left:41.66667%}.column.is-6,.column.is-6-tablet{flex:none;width:50%}.column.is-offset-6,.column.is-offset-6-tablet{margin-left:50%}.column.is-7,.column.is-7-tablet{flex:none;width:58.33333%}.column.is-offset-7,.column.is-offset-7-tablet{margin-left:58.33333%}.column.is-8,.column.is-8-tablet{flex:none;width:66.66667%}.column.is-offset-8,.column.is-offset-8-tablet{margin-left:66.66667%}.column.is-9,.column.is-9-tablet{flex:none;width:75%}.column.is-offset-9,.column.is-offset-9-tablet{margin-left:75%}.column.is-10,.column.is-10-tablet{flex:none;width:83.33333%}.column.is-offset-10,.column.is-offset-10-tablet{margin-left:83.33333%}.column.is-11,.column.is-11-tablet{flex:none;width:91.66667%}.column.is-offset-11,.column.is-offset-11-tablet{margin-left:91.66667%}.column.is-12,.column.is-12-tablet{flex:none;width:100%}.column.is-offset-12,.column.is-offset-12-tablet{margin-left:100%}}@media screen and (min-width: 1000px){.column.is-narrow-desktop{flex:none}.column.is-full-desktop{flex:none;width:100%}.column.is-three-quarters-desktop{flex:none;width:75%}.column.is-two-thirds-desktop{flex:none;width:66.6666%}.column.is-half-desktop{flex:none;width:50%}.column.is-one-third-desktop{flex:none;width:33.3333%}.column.is-one-quarter-desktop{flex:none;width:25%}.column.is-offset-three-quarters-desktop{margin-left:75%}.column.is-offset-two-thirds-desktop{margin-left:66.6666%}.column.is-offset-half-desktop{margin-left:50%}.column.is-offset-one-third-desktop{margin-left:33.3333%}.column.is-offset-one-quarter-desktop{margin-left:25%}.column.is-1-desktop{flex:none;width:8.33333%}.column.is-offset-1-desktop{margin-left:8.33333%}.column.is-2-desktop{flex:none;width:16.66667%}.column.is-offset-2-desktop{margin-left:16.66667%}.column.is-3-desktop{flex:none;width:25%}.column.is-offset-3-desktop{margin-left:25%}.column.is-4-desktop{flex:none;width:33.33333%}.column.is-offset-4-desktop{margin-left:33.33333%}.column.is-5-desktop{flex:none;width:41.66667%}.column.is-offset-5-desktop{margin-left:41.66667%}.column.is-6-desktop{flex:none;width:50%}.column.is-offset-6-desktop{margin-left:50%}.column.is-7-desktop{flex:none;width:58.33333%}.column.is-offset-7-desktop{margin-left:58.33333%}.column.is-8-desktop{flex:none;width:66.66667%}.column.is-offset-8-desktop{margin-left:66.66667%}.column.is-9-desktop{flex:none;width:75%}.column.is-offset-9-desktop{margin-left:75%}.column.is-10-desktop{flex:none;width:83.33333%}.column.is-offset-10-desktop{margin-left:83.33333%}.column.is-11-desktop{flex:none;width:91.66667%}.column.is-offset-11-desktop{margin-left:91.66667%}.column.is-12-desktop{flex:none;width:100%}.column.is-offset-12-desktop{margin-left:100%}}@media screen and (min-width: 1192px){.column.is-narrow-widescreen{flex:none}.column.is-full-widescreen{flex:none;width:100%}.column.is-three-quarters-widescreen{flex:none;width:75%}.column.is-two-thirds-widescreen{flex:none;width:66.6666%}.column.is-half-widescreen{flex:none;width:50%}.column.is-one-third-widescreen{flex:none;width:33.3333%}.column.is-one-quarter-widescreen{flex:none;width:25%}.column.is-offset-three-quarters-widescreen{margin-left:75%}.column.is-offset-two-thirds-widescreen{margin-left:66.6666%}.column.is-offset-half-widescreen{margin-left:50%}.column.is-offset-one-third-widescreen{margin-left:33.3333%}.column.is-offset-one-quarter-widescreen{margin-left:25%}.column.is-1-widescreen{flex:none;width:8.33333%}.column.is-offset-1-widescreen{margin-left:8.33333%}.column.is-2-widescreen{flex:none;width:16.66667%}.column.is-offset-2-widescreen{margin-left:16.66667%}.column.is-3-widescreen{flex:none;width:25%}.column.is-offset-3-widescreen{margin-left:25%}.column.is-4-widescreen{flex:none;width:33.33333%}.column.is-offset-4-widescreen{margin-left:33.33333%}.column.is-5-widescreen{flex:none;width:41.66667%}.column.is-offset-5-widescreen{margin-left:41.66667%}.column.is-6-widescreen{flex:none;width:50%}.column.is-offset-6-widescreen{margin-left:50%}.column.is-7-widescreen{flex:none;width:58.33333%}.column.is-offset-7-widescreen{margin-left:58.33333%}.column.is-8-widescreen{flex:none;width:66.66667%}.column.is-offset-8-widescreen{margin-left:66.66667%}.column.is-9-widescreen{flex:none;width:75%}.column.is-offset-9-widescreen{margin-left:75%}.column.is-10-widescreen{flex:none;width:83.33333%}.column.is-offset-10-widescreen{margin-left:83.33333%}.column.is-11-widescreen{flex:none;width:91.66667%}.column.is-offset-11-widescreen{margin-left:91.66667%}.column.is-12-widescreen{flex:none;width:100%}.column.is-offset-12-widescreen{margin-left:100%}}.columns{margin-left:-0.75rem;margin-right:-0.75rem;margin-top:-0.75rem}.columns:last-child{margin-bottom:-0.75rem}.columns:not(:last-child){margin-bottom:0.75rem}.columns.is-centered{justify-content:center}.columns.is-gapless{margin-left:0;margin-right:0;margin-top:0}.columns.is-gapless:last-child{margin-bottom:0}.columns.is-gapless:not(:last-child){margin-bottom:1.5rem}.columns.is-gapless>.column{margin:0;padding:0}@media screen and (min-width: 769px){.columns.is-grid{flex-wrap:wrap}.columns.is-grid>.column{max-width:33.3333%;padding:0.75rem;width:33.3333%}.columns.is-grid>.column+.column{margin-left:0}}.columns.is-mobile{display:flex}.columns.is-multiline{flex-wrap:wrap}.columns.is-vcentered{align-items:center}@media screen and (min-width: 769px){.columns:not(.is-desktop){display:flex}}@media screen and (min-width: 1000px){.columns.is-desktop{display:flex}}.tile{align-items:stretch;display:block;flex-basis:0;flex-grow:1;flex-shrink:1;min-height:min-content}.tile.is-ancestor{margin-left:-0.75rem;margin-right:-0.75rem;margin-top:-0.75rem}.tile.is-ancestor:last-child{margin-bottom:-0.75rem}.tile.is-ancestor:not(:last-child){margin-bottom:0.75rem}.tile.is-child{margin:0 !important}.tile.is-parent{padding:0.75rem}.tile.is-vertical{flex-direction:column}.tile.is-vertical>.tile.is-child:not(:last-child){margin-bottom:1.5rem !important}@media screen and (min-width: 769px){.tile:not(.is-child){display:flex}.tile.is-1{flex:none;width:8.33333%}.tile.is-2{flex:none;width:16.66667%}.tile.is-3{flex:none;width:25%}.tile.is-4{flex:none;width:33.33333%}.tile.is-5{flex:none;width:41.66667%}.tile.is-6{flex:none;width:50%}.tile.is-7{flex:none;width:58.33333%}.tile.is-8{flex:none;width:66.66667%}.tile.is-9{flex:none;width:75%}.tile.is-10{flex:none;width:83.33333%}.tile.is-11{flex:none;width:91.66667%}.tile.is-12{flex:none;width:100%}}.hero-video{bottom:0;left:0;position:absolute;right:0;top:0;overflow:hidden}.hero-video video{left:50%;min-height:100%;min-width:100%;position:absolute;top:50%;transform:translate3d(-50%, -50%, 0)}.hero-video.is-transparent{opacity:0.3}@media screen and (max-width: 768px){.hero-video{display:none}}.hero-buttons{margin-top:1.5rem}@media screen and (max-width: 768px){.hero-buttons .button{display:flex}.hero-buttons .button:not(:last-child){margin-bottom:0.75rem}}@media screen and (min-width: 769px){.hero-buttons{display:flex;justify-content:center}.hero-buttons .button:not(:last-child){margin-right:1.5rem}}.hero-head,.hero-foot{flex-grow:0;flex-shrink:0}.hero-body{flex-grow:1;flex-shrink:0;padding:3rem 1.5rem}@media screen and (min-width: 1192px){.hero-body{padding-left:0;padding-right:0}}.hero{align-items:stretch;background-color:#fff;display:flex;flex-direction:column;justify-content:space-between}.hero .nav{background:none;box-shadow:0 1px 0 rgba(219,219,219,0.3)}.hero .tabs ul{border-bottom:none}.hero.is-white{background-color:#fff;color:#0a0a0a}.hero.is-white a,.hero.is-white strong{color:inherit}.hero.is-white .title{color:#0a0a0a}.hero.is-white .subtitle{color:rgba(10,10,10,0.9)}.hero.is-white .subtitle a,.hero.is-white .subtitle strong{color:#0a0a0a}.hero.is-white .nav{box-shadow:0 1px 0 rgba(10,10,10,0.2)}@media screen and (max-width: 768px){.hero.is-white .nav-menu{background-color:#fff}}.hero.is-white a.nav-item,.hero.is-white .nav-item a:not(.button){color:rgba(10,10,10,0.7)}.hero.is-white a.nav-item:hover,.hero.is-white a.nav-item.is-active,.hero.is-white .nav-item a:not(.button):hover,.hero.is-white .nav-item a:not(.button).is-active{color:#0a0a0a}.hero.is-white .tabs a{color:#0a0a0a;opacity:0.9}.hero.is-white .tabs a:hover{opacity:1}.hero.is-white .tabs li.is-active a{opacity:1}.hero.is-white .tabs.is-boxed a,.hero.is-white .tabs.is-toggle a{color:#0a0a0a}.hero.is-white .tabs.is-boxed a:hover,.hero.is-white .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-white .tabs.is-boxed li.is-active a,.hero.is-white .tabs.is-boxed li.is-active a:hover,.hero.is-white .tabs.is-toggle li.is-active a,.hero.is-white .tabs.is-toggle li.is-active a:hover{background-color:#0a0a0a;border-color:#0a0a0a;color:#fff}.hero.is-white.is-bold{background-image:linear-gradient(141deg, #e6e6e6 0%, #fff 71%, #fff 100%)}@media screen and (max-width: 768px){.hero.is-white .nav-toggle span{background-color:#0a0a0a}.hero.is-white .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-white .nav-toggle.is-active span{background-color:#0a0a0a}.hero.is-white .nav-menu .nav-item{border-top-color:rgba(10,10,10,0.2)}}.hero.is-black{background-color:#0a0a0a;color:#fff}.hero.is-black a,.hero.is-black strong{color:inherit}.hero.is-black .title{color:#fff}.hero.is-black .subtitle{color:rgba(255,255,255,0.9)}.hero.is-black .subtitle a,.hero.is-black .subtitle strong{color:#fff}.hero.is-black .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-black .nav-menu{background-color:#0a0a0a}}.hero.is-black a.nav-item,.hero.is-black .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-black a.nav-item:hover,.hero.is-black a.nav-item.is-active,.hero.is-black .nav-item a:not(.button):hover,.hero.is-black .nav-item a:not(.button).is-active{color:#fff}.hero.is-black .tabs a{color:#fff;opacity:0.9}.hero.is-black .tabs a:hover{opacity:1}.hero.is-black .tabs li.is-active a{opacity:1}.hero.is-black .tabs.is-boxed a,.hero.is-black .tabs.is-toggle a{color:#fff}.hero.is-black .tabs.is-boxed a:hover,.hero.is-black .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-black .tabs.is-boxed li.is-active a,.hero.is-black .tabs.is-boxed li.is-active a:hover,.hero.is-black .tabs.is-toggle li.is-active a,.hero.is-black .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#0a0a0a}.hero.is-black.is-bold{background-image:linear-gradient(141deg, #000 0%, #0a0a0a 71%, #181616 100%)}@media screen and (max-width: 768px){.hero.is-black .nav-toggle span{background-color:#fff}.hero.is-black .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-black .nav-toggle.is-active span{background-color:#fff}.hero.is-black .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-light{background-color:#f5f5f5;color:#363636}.hero.is-light a,.hero.is-light strong{color:inherit}.hero.is-light .title{color:#363636}.hero.is-light .subtitle{color:rgba(54,54,54,0.9)}.hero.is-light .subtitle a,.hero.is-light .subtitle strong{color:#363636}.hero.is-light .nav{box-shadow:0 1px 0 rgba(54,54,54,0.2)}@media screen and (max-width: 768px){.hero.is-light .nav-menu{background-color:#f5f5f5}}.hero.is-light a.nav-item,.hero.is-light .nav-item a:not(.button){color:rgba(54,54,54,0.7)}.hero.is-light a.nav-item:hover,.hero.is-light a.nav-item.is-active,.hero.is-light .nav-item a:not(.button):hover,.hero.is-light .nav-item a:not(.button).is-active{color:#363636}.hero.is-light .tabs a{color:#363636;opacity:0.9}.hero.is-light .tabs a:hover{opacity:1}.hero.is-light .tabs li.is-active a{opacity:1}.hero.is-light .tabs.is-boxed a,.hero.is-light .tabs.is-toggle a{color:#363636}.hero.is-light .tabs.is-boxed a:hover,.hero.is-light .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-light .tabs.is-boxed li.is-active a,.hero.is-light .tabs.is-boxed li.is-active a:hover,.hero.is-light .tabs.is-toggle li.is-active a,.hero.is-light .tabs.is-toggle li.is-active a:hover{background-color:#363636;border-color:#363636;color:#f5f5f5}.hero.is-light.is-bold{background-image:linear-gradient(141deg, #dfd8d8 0%, #f5f5f5 71%, #fff 100%)}@media screen and (max-width: 768px){.hero.is-light .nav-toggle span{background-color:#363636}.hero.is-light .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-light .nav-toggle.is-active span{background-color:#363636}.hero.is-light .nav-menu .nav-item{border-top-color:rgba(54,54,54,0.2)}}.hero.is-dark{background-color:#363636;color:#f5f5f5}.hero.is-dark a,.hero.is-dark strong{color:inherit}.hero.is-dark .title{color:#f5f5f5}.hero.is-dark .subtitle{color:rgba(245,245,245,0.9)}.hero.is-dark .subtitle a,.hero.is-dark .subtitle strong{color:#f5f5f5}.hero.is-dark .nav{box-shadow:0 1px 0 rgba(245,245,245,0.2)}@media screen and (max-width: 768px){.hero.is-dark .nav-menu{background-color:#363636}}.hero.is-dark a.nav-item,.hero.is-dark .nav-item a:not(.button){color:rgba(245,245,245,0.7)}.hero.is-dark a.nav-item:hover,.hero.is-dark a.nav-item.is-active,.hero.is-dark .nav-item a:not(.button):hover,.hero.is-dark .nav-item a:not(.button).is-active{color:#f5f5f5}.hero.is-dark .tabs a{color:#f5f5f5;opacity:0.9}.hero.is-dark .tabs a:hover{opacity:1}.hero.is-dark .tabs li.is-active a{opacity:1}.hero.is-dark .tabs.is-boxed a,.hero.is-dark .tabs.is-toggle a{color:#f5f5f5}.hero.is-dark .tabs.is-boxed a:hover,.hero.is-dark .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-dark .tabs.is-boxed li.is-active a,.hero.is-dark .tabs.is-boxed li.is-active a:hover,.hero.is-dark .tabs.is-toggle li.is-active a,.hero.is-dark .tabs.is-toggle li.is-active a:hover{background-color:#f5f5f5;border-color:#f5f5f5;color:#363636}.hero.is-dark.is-bold{background-image:linear-gradient(141deg, #1f1919 0%, #363636 71%, #463f3f 100%)}@media screen and (max-width: 768px){.hero.is-dark .nav-toggle span{background-color:#f5f5f5}.hero.is-dark .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-dark .nav-toggle.is-active span{background-color:#f5f5f5}.hero.is-dark .nav-menu .nav-item{border-top-color:rgba(245,245,245,0.2)}}.hero.is-primary{background-color:#182b73;color:#fff}.hero.is-primary a,.hero.is-primary strong{color:inherit}.hero.is-primary .title{color:#fff}.hero.is-primary .subtitle{color:rgba(255,255,255,0.9)}.hero.is-primary .subtitle a,.hero.is-primary .subtitle strong{color:#fff}.hero.is-primary .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-primary .nav-menu{background-color:#182b73}}.hero.is-primary a.nav-item,.hero.is-primary .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-primary a.nav-item:hover,.hero.is-primary a.nav-item.is-active,.hero.is-primary .nav-item a:not(.button):hover,.hero.is-primary .nav-item a:not(.button).is-active{color:#fff}.hero.is-primary .tabs a{color:#fff;opacity:0.9}.hero.is-primary .tabs a:hover{opacity:1}.hero.is-primary .tabs li.is-active a{opacity:1}.hero.is-primary .tabs.is-boxed a,.hero.is-primary .tabs.is-toggle a{color:#fff}.hero.is-primary .tabs.is-boxed a:hover,.hero.is-primary .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-primary .tabs.is-boxed li.is-active a,.hero.is-primary .tabs.is-boxed li.is-active a:hover,.hero.is-primary .tabs.is-toggle li.is-active a,.hero.is-primary .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#182b73}.hero.is-primary.is-bold{background-image:linear-gradient(141deg, #0b244d 0%, #182b73 71%, #181d8c 100%)}@media screen and (max-width: 768px){.hero.is-primary .nav-toggle span{background-color:#fff}.hero.is-primary .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-primary .nav-toggle.is-active span{background-color:#fff}.hero.is-primary .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-info{background-color:#3273dc;color:#fff}.hero.is-info a,.hero.is-info strong{color:inherit}.hero.is-info .title{color:#fff}.hero.is-info .subtitle{color:rgba(255,255,255,0.9)}.hero.is-info .subtitle a,.hero.is-info .subtitle strong{color:#fff}.hero.is-info .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-info .nav-menu{background-color:#3273dc}}.hero.is-info a.nav-item,.hero.is-info .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-info a.nav-item:hover,.hero.is-info a.nav-item.is-active,.hero.is-info .nav-item a:not(.button):hover,.hero.is-info .nav-item a:not(.button).is-active{color:#fff}.hero.is-info .tabs a{color:#fff;opacity:0.9}.hero.is-info .tabs a:hover{opacity:1}.hero.is-info .tabs li.is-active a{opacity:1}.hero.is-info .tabs.is-boxed a,.hero.is-info .tabs.is-toggle a{color:#fff}.hero.is-info .tabs.is-boxed a:hover,.hero.is-info .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-info .tabs.is-boxed li.is-active a,.hero.is-info .tabs.is-boxed li.is-active a:hover,.hero.is-info .tabs.is-toggle li.is-active a,.hero.is-info .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#3273dc}.hero.is-info.is-bold{background-image:linear-gradient(141deg, #1577c6 0%, #3273dc 71%, #4366e5 100%)}@media screen and (max-width: 768px){.hero.is-info .nav-toggle span{background-color:#fff}.hero.is-info .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-info .nav-toggle.is-active span{background-color:#fff}.hero.is-info .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-success{background-color:#23d160;color:#fff}.hero.is-success a,.hero.is-success strong{color:inherit}.hero.is-success .title{color:#fff}.hero.is-success .subtitle{color:rgba(255,255,255,0.9)}.hero.is-success .subtitle a,.hero.is-success .subtitle strong{color:#fff}.hero.is-success .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-success .nav-menu{background-color:#23d160}}.hero.is-success a.nav-item,.hero.is-success .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-success a.nav-item:hover,.hero.is-success a.nav-item.is-active,.hero.is-success .nav-item a:not(.button):hover,.hero.is-success .nav-item a:not(.button).is-active{color:#fff}.hero.is-success .tabs a{color:#fff;opacity:0.9}.hero.is-success .tabs a:hover{opacity:1}.hero.is-success .tabs li.is-active a{opacity:1}.hero.is-success .tabs.is-boxed a,.hero.is-success .tabs.is-toggle a{color:#fff}.hero.is-success .tabs.is-boxed a:hover,.hero.is-success .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-success .tabs.is-boxed li.is-active a,.hero.is-success .tabs.is-boxed li.is-active a:hover,.hero.is-success .tabs.is-toggle li.is-active a,.hero.is-success .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#23d160}.hero.is-success.is-bold{background-image:linear-gradient(141deg, #12af2f 0%, #23d160 71%, #2ce28a 100%)}@media screen and (max-width: 768px){.hero.is-success .nav-toggle span{background-color:#fff}.hero.is-success .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-success .nav-toggle.is-active span{background-color:#fff}.hero.is-success .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.hero.is-warning a,.hero.is-warning strong{color:inherit}.hero.is-warning .title{color:rgba(0,0,0,0.7)}.hero.is-warning .subtitle{color:rgba(0,0,0,0.9)}.hero.is-warning .subtitle a,.hero.is-warning .subtitle strong{color:rgba(0,0,0,0.7)}.hero.is-warning .nav{box-shadow:0 1px 0 rgba(0,0,0,0.2)}@media screen and (max-width: 768px){.hero.is-warning .nav-menu{background-color:#ffdd57}}.hero.is-warning a.nav-item,.hero.is-warning .nav-item a:not(.button){color:rgba(0,0,0,0.7)}.hero.is-warning a.nav-item:hover,.hero.is-warning a.nav-item.is-active,.hero.is-warning .nav-item a:not(.button):hover,.hero.is-warning .nav-item a:not(.button).is-active{color:rgba(0,0,0,0.7)}.hero.is-warning .tabs a{color:rgba(0,0,0,0.7);opacity:0.9}.hero.is-warning .tabs a:hover{opacity:1}.hero.is-warning .tabs li.is-active a{opacity:1}.hero.is-warning .tabs.is-boxed a,.hero.is-warning .tabs.is-toggle a{color:rgba(0,0,0,0.7)}.hero.is-warning .tabs.is-boxed a:hover,.hero.is-warning .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-warning .tabs.is-boxed li.is-active a,.hero.is-warning .tabs.is-boxed li.is-active a:hover,.hero.is-warning .tabs.is-toggle li.is-active a,.hero.is-warning .tabs.is-toggle li.is-active a:hover{background-color:rgba(0,0,0,0.7);border-color:rgba(0,0,0,0.7);color:#ffdd57}.hero.is-warning.is-bold{background-image:linear-gradient(141deg, #ffaf24 0%, #ffdd57 71%, #fffa70 100%)}@media screen and (max-width: 768px){.hero.is-warning .nav-toggle span{background-color:rgba(0,0,0,0.7)}.hero.is-warning .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-warning .nav-toggle.is-active span{background-color:rgba(0,0,0,0.7)}.hero.is-warning .nav-menu .nav-item{border-top-color:rgba(0,0,0,0.2)}}.hero.is-danger{background-color:red;color:#fff}.hero.is-danger a,.hero.is-danger strong{color:inherit}.hero.is-danger .title{color:#fff}.hero.is-danger .subtitle{color:rgba(255,255,255,0.9)}.hero.is-danger .subtitle a,.hero.is-danger .subtitle strong{color:#fff}.hero.is-danger .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-danger .nav-menu{background-color:red}}.hero.is-danger a.nav-item,.hero.is-danger .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-danger a.nav-item:hover,.hero.is-danger a.nav-item.is-active,.hero.is-danger .nav-item a:not(.button):hover,.hero.is-danger .nav-item a:not(.button).is-active{color:#fff}.hero.is-danger .tabs a{color:#fff;opacity:0.9}.hero.is-danger .tabs a:hover{opacity:1}.hero.is-danger .tabs li.is-active a{opacity:1}.hero.is-danger .tabs.is-boxed a,.hero.is-danger .tabs.is-toggle a{color:#fff}.hero.is-danger .tabs.is-boxed a:hover,.hero.is-danger .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-danger .tabs.is-boxed li.is-active a,.hero.is-danger .tabs.is-boxed li.is-active a:hover,.hero.is-danger .tabs.is-toggle li.is-active a,.hero.is-danger .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:red}.hero.is-danger.is-bold{background-image:linear-gradient(141deg, #c02 0%, red 71%, #ff401a 100%)}@media screen and (max-width: 768px){.hero.is-danger .nav-toggle span{background-color:#fff}.hero.is-danger .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-danger .nav-toggle.is-active span{background-color:#fff}.hero.is-danger .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}@media screen and (min-width: 769px){.hero.is-medium .hero-body{padding-bottom:9rem;padding-top:9rem}}@media screen and (min-width: 769px){.hero.is-large .hero-body{padding-bottom:18rem;padding-top:18rem}}.hero.is-fullheight{min-height:100vh}.hero.is-fullheight .hero-body{align-items:center;display:flex}.hero.is-fullheight .hero-body>.container{flex-grow:1;flex-shrink:1}.section{background-color:#fff;padding:3rem 1.5rem}@media screen and (min-width: 1000px){.section.is-medium{padding:9rem 1.5rem}.section.is-large{padding:18rem 1.5rem}}.footer{background-color:#f5f5f5;padding:3rem 1.5rem 6rem}.header.is-fixed-top{z-index:1030;position:fixed;top:0;left:0;right:0}.has-fixed-nav{margin-top:50px}.section.is-small{padding:1rem 1.5rem}.textarea.is-fluid{min-height:1em;overflow:hidden;resize:none;transition:min-height 0.3s}.textarea.is-fluid:focus{min-height:6em;overflow:auto}.nav-inverse{background:#182b73}.nav-inverse a.nav-item{color:#f2f2f2}.nav-inverse a.nav-item:hover{color:#d1d5e3}.nav-inverse a.nav-item.is-active{color:#fff}.nav-inverse a.nav-item.is-tab:hover{border-bottom-color:#fff}.nav-inverse a.nav-item.is-tab.is-active{border-bottom:3px solid #fff;color:#fff}.nav-slider-container .nav-slider{position:fixed;top:0;bottom:0;z-index:1040;overflow-y:auto;text-align:center;background:#182b73;color:#fff;left:-250px;width:250px;transition:left 0.5s}.nav-slider-container .nav-slider.is-active{left:0}.nav-slider-container .nav-slider .nav-item{cursor:pointer;display:block;padding-top:10px;padding-bottom:9px;background:rgba(255,255,255,0.1)}.nav-slider-container .nav-slider .nav-item.is-active{background:linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1) 5%)}.nav-slider-container .nav-slider .nav-item[open]>summary{margin-bottom:9px}.nav-slider-container .nav-slider .nav-item:not(:last-child){border-bottom:1px solid #fff}.nav-slider-container .nav-slider ~ .is-overlay{background:rgba(0,0,0,0.5);z-index:1035;visibility:hidden;position:fixed;opacity:0;transition:opacity 0.75s}.nav-slider-container .nav-slider.is-active ~ .is-overlay{visibility:visible;opacity:1}#container>div:not(.visible){display:none}#container>div{position:relative;height:calc(100vh - 50px);overflow-y:auto;-webkit-overflow-scrolling:touch}\n" + '</style>';

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXZcXE1lc3NhZ2VCb3RFeHRlbnNpb24uanMiLCJkZXZcXGJvdFxcY2hlY2tHcm91cC5qcyIsImRldlxcYm90XFxpbmRleC5qcyIsImRldlxcYm90XFxtaWdyYXRpb24uanMiLCJkZXZcXGJvdFxcc2VuZC5qcyIsImRldlxcY29uc29sZVxcZXhwb3J0cy5qcyIsImRldlxcY29uc29sZVxcaW5kZXguanMiLCJkZXZcXGxpYnJhcmllc1xcYWpheC5qcyIsImRldlxcbGlicmFyaWVzXFxiaGZhbnNhcGkuanMiLCJkZXZcXGxpYnJhcmllc1xcYmxvY2toZWFkcy5qcyIsImRldlxcbGlicmFyaWVzXFxob29rLmpzIiwiZGV2XFxsaWJyYXJpZXNcXHN0b3JhZ2UuanMiLCJkZXZcXGxpYnJhcmllc1xcd29ybGQuanMiLCJkZXZcXG1lc3NhZ2VzXFxhbm5vdW5jZW1lbnRzXFxpbmRleC5qcyIsImRldlxcbWVzc2FnZXNcXGhlbHBlcnNcXGJ1aWxkTWVzc2FnZS5qcyIsImRldlxcbWVzc2FnZXNcXGhlbHBlcnNcXGNoZWNrSm9pbnNBbmRHcm91cC5qcyIsImRldlxcbWVzc2FnZXNcXGhlbHBlcnNcXGluZGV4LmpzIiwiZGV2XFxtZXNzYWdlc1xcaGVscGVyc1xcc2hvd1N1bW1hcnkuanMiLCJkZXZcXG1lc3NhZ2VzXFxpbmRleC5qcyIsImRldlxcbWVzc2FnZXNcXGpvaW5cXGluZGV4LmpzIiwiZGV2XFxtZXNzYWdlc1xcbGVhdmVcXGluZGV4LmpzIiwiZGV2XFxtZXNzYWdlc1xcdHJpZ2dlclxcaW5kZXguanMiLCJkZXZcXHNldHRpbmdzXFxib3RcXGluZGV4LmpzIiwiZGV2XFxzZXR0aW5nc1xcYm90XFxwYWdlLmpzIiwiZGV2XFxzZXR0aW5nc1xcZXh0ZW5zaW9uc1xcaW5kZXguanMiLCJkZXZcXHNldHRpbmdzXFxpbmRleC5qcyIsImRldlxcc3RhcnQuanMiLCJkZXZcXHVpXFxpbmRleC5qcyIsImRldlxcdWlcXGxheW91dFxcaW5kZXguanMiLCJkZXZcXHVpXFxub3RpZmljYXRpb25zXFxhbGVydC5qcyIsImRldlxcdWlcXG5vdGlmaWNhdGlvbnNcXGluZGV4LmpzIiwiZGV2XFx1aVxcbm90aWZpY2F0aW9uc1xcbm90aWZ5LmpzIiwiZGV2XFx1aVxccG9seWZpbGxzXFxkZXRhaWxzLmpzIiwiZGV2XFx1aVxccG9seWZpbGxzXFx0ZW1wbGF0ZS5qcyIsImRldlxcdWlcXHRlbXBsYXRlLmpzIiwibm9kZV9tb2R1bGVzL2Fzc2VydC9hc3NlcnQuanMiLCJub2RlX21vZHVsZXMvY29uc29sZS1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RhdGUtbm93L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLE1BQU0sUUFBUSxLQUFSLENBQVo7QUFDQSxJQUFNLGNBQWMsUUFBUSxXQUFSLENBQXBCO0FBQ0EsSUFBTSxLQUFLLFFBQVEsSUFBUixDQUFYO0FBQ0EsSUFBTSxVQUFVLFFBQVEsbUJBQVIsQ0FBaEI7QUFDQSxJQUFNLE9BQU8sUUFBUSxnQkFBUixDQUFiO0FBQ0EsSUFBTSxNQUFNLFFBQVEsc0JBQVIsQ0FBWjtBQUNBLElBQU0sUUFBUSxRQUFRLGlCQUFSLENBQWQ7QUFDQSxJQUFNLE9BQU8sUUFBUSxnQkFBUixDQUFiOztBQUVBO0FBQ0EsSUFBSSxXQUFXLEVBQWY7QUFDQSxJQUFJLFNBQVMsRUFBYjtBQUNBLElBQU0sYUFBYSxlQUFuQjs7QUFHQTs7Ozs7Ozs7O0FBU0EsU0FBUyxtQkFBVCxDQUE2QixTQUE3QixFQUF3QyxT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OztBQ2xGRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBib3QgPSByZXF1aXJlKCdib3QnKTtcclxuY29uc3QgYm90X2NvbnNvbGUgPSByZXF1aXJlKCcuL2NvbnNvbGUnKTtcclxuY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgYWpheCA9IHJlcXVpcmUoJ2xpYnJhcmllcy9hamF4Jyk7XHJcbmNvbnN0IGFwaSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ibG9ja2hlYWRzJyk7XHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5cclxuLy8gQXJyYXkgb2YgSURzIHRvIGF1dG9sb2FkIGF0IHRoZSBuZXh0IGxhdW5jaC5cclxudmFyIGF1dG9sb2FkID0gW107XHJcbnZhciBsb2FkZWQgPSBbXTtcclxuY29uc3QgU1RPUkFHRV9JRCA9ICdtYl9leHRlbnNpb25zJztcclxuXHJcblxyXG4vKipcclxuICogVXNlZCB0byBjcmVhdGUgYSBuZXcgZXh0ZW5zaW9uLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgdGVzdCA9IE1lc3NhZ2VCb3RFeHRlbnNpb24oJ3Rlc3QnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVzcGFjZSAtIFNob3VsZCBiZSB0aGUgc2FtZSBhcyB5b3VyIHZhcmlhYmxlIG5hbWUuXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFt1bmluc3RhbGwgPSB1bmRlZmluZWRdIC0gT3B0aW9uYWwsIHNwZWNpZnkgdGhlIHVuaW5zdGFsbCBmdW5jdGlvbiB3aGlsZSBjcmVhdGluZyB0aGUgZXh0ZW5zaW9uLCBpbnN0ZWFkIG9mIGxhdGVyLiBJZiBzcGVjaWZpZWQgaGVyZSwgdGhpcyB3aWxsIGJlIGJvdW5kIHRvIHRoZSBleHRlbnNpb24uXHJcbiAqIEByZXR1cm4ge01lc3NhZ2VCb3RFeHRlbnNpb259IC0gVGhlIGV4dGVuc2lvbiB2YXJpYWJsZS5cclxuICovXHJcbmZ1bmN0aW9uIE1lc3NhZ2VCb3RFeHRlbnNpb24obmFtZXNwYWNlLCB1bmluc3RhbGwpIHtcclxuICAgIGxvYWRlZC5wdXNoKG5hbWVzcGFjZSk7XHJcbiAgICBob29rLmZpcmUoJ2V4dGVuc2lvbi5pbnN0YWxsJywgbmFtZXNwYWNlKTtcclxuXHJcbiAgICB2YXIgZXh0ZW5zaW9uID0ge1xyXG4gICAgICAgIGlkOiBuYW1lc3BhY2UsXHJcbiAgICAgICAgYm90LFxyXG4gICAgICAgIGNvbnNvbGU6IGJvdF9jb25zb2xlLFxyXG4gICAgICAgIHVpLFxyXG4gICAgICAgIHN0b3JhZ2UsXHJcbiAgICAgICAgYWpheCxcclxuICAgICAgICBhcGksXHJcbiAgICAgICAgd29ybGQsXHJcbiAgICAgICAgaG9vayxcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHR5cGVvZiB1bmluc3RhbGwgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGV4dGVuc2lvbi51bmluc3RhbGwgPSB1bmluc3RhbGwuYmluZChleHRlbnNpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXNlZCB0byBjaGFuZ2Ugd2hldGhlciBvciBub3QgdGhlIGV4dGVuc2lvbiB3aWxsIGJlXHJcbiAgICAgKiBBdXRvbWF0aWNhbGx5IGxvYWRlZCB0aGUgbmV4dCB0aW1lIHRoZSBib3QgaXMgbGF1bmNoZWQuXHJcbiAgICAgKlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHZhciB0ZXN0ID0gTWVzc2FnZUJvdEV4dGVuc2lvbigndGVzdCcpO1xyXG4gICAgICogdGVzdC5zZXRBdXRvTGF1bmNoKHRydWUpO1xyXG4gICAgICogQHBhcmFtIHtib29sfSBzaG91bGRBdXRvbG9hZFxyXG4gICAgICovXHJcbiAgICBleHRlbnNpb24uc2V0QXV0b0xhdW5jaCA9IGZ1bmN0aW9uIHNldEF1dG9MYXVuY2goc2hvdWxkQXV0b2xvYWQpIHtcclxuICAgICAgICBpZiAoIWF1dG9sb2FkLmluY2x1ZGVzKG5hbWVzcGFjZSkgJiYgc2hvdWxkQXV0b2xvYWQpIHtcclxuICAgICAgICAgICAgYXV0b2xvYWQucHVzaChuYW1lc3BhY2UpO1xyXG4gICAgICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBhdXRvbG9hZCwgZmFsc2UpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIXNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgICAgIGlmIChhdXRvbG9hZC5pbmNsdWRlcyhuYW1lc3BhY2UpKSB7XHJcbiAgICAgICAgICAgICAgICBhdXRvbG9hZC5zcGxpY2UoYXV0b2xvYWQuaW5kZXhPZihuYW1lc3BhY2UpLCAxKTtcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGF1dG9sb2FkLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBleHRlbnNpb247XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmllcyB0byBsb2FkIHRoZSByZXF1ZXN0ZWQgZXh0ZW5zaW9uIGJ5IElELlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcclxuICovXHJcbk1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbCA9IGZ1bmN0aW9uIGluc3RhbGwoaWQpIHtcclxuICAgIGlmICghbG9hZGVkLmluY2x1ZGVzKGlkKSkge1xyXG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gICAgICAgIGVsLnNyYyA9IGAvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2V4dGVuc2lvbi8ke2lkfS9jb2RlL3Jhd2A7XHJcbiAgICAgICAgZWwuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcclxuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBVbmluc3RhbGxzIGFuIGV4dGVuc2lvbi5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAqL1xyXG5NZXNzYWdlQm90RXh0ZW5zaW9uLnVuaW5zdGFsbCA9IGZ1bmN0aW9uIHVuaW5zdGFsbChpZCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aW5kb3dbaWRdLnVuaW5zdGFsbCgpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIC8vTm90IGluc3RhbGxlZCwgb3Igbm8gdW5pbnN0YWxsIGZ1bmN0aW9uLlxyXG4gICAgfVxyXG5cclxuICAgIHdpbmRvd1tpZF0gPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgaWYgKGF1dG9sb2FkLmluY2x1ZGVzKGlkKSkge1xyXG4gICAgICAgIGF1dG9sb2FkLnNwbGljZShhdXRvbG9hZC5pbmRleE9mKGlkKSwgMSk7XHJcbiAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgYXV0b2xvYWQsIGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobG9hZGVkLmluY2x1ZGVzKGlkKSkge1xyXG4gICAgICAgIGxvYWRlZC5zcGxpY2UobG9hZGVkLmluZGV4T2YoaWQpLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICBob29rLmZpcmUoJ2V4dGVuc2lvbi51bmluc3RhbGwnLCBpZCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVXNlZCB0byBjaGVjayBpZiBhbiBleHRlbnNpb24gaGFzIGJlZW4gbG9hZGVkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbk1lc3NhZ2VCb3RFeHRlbnNpb24uaXNMb2FkZWQgPSBmdW5jdGlvbiBpc0xvYWRlZChpZCkge1xyXG4gICAgcmV0dXJuIGxvYWRlZC5pbmNsdWRlcyhpZCk7XHJcbn07XHJcblxyXG4vLyBMb2FkIGV4dGVuc2lvbnMgdGhhdCBzZXQgdGhlbXNlbHZlcyB0byBhdXRvbG9hZCBsYXN0IGxhdW5jaC5cclxuc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10sIGZhbHNlKVxyXG4gICAgLmZvckVhY2goTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWVzc2FnZUJvdEV4dGVuc2lvbjtcclxuIiwiLyoqXHJcbiAqIEBmaWxlIERlcHJpY2F0ZWQuIFVzZSB3b3JsZC5pc1tHcm91cF0gaW5zdGVhZC5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNoZWNrR3JvdXBcclxufTtcclxuXHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgaWYgdXNlcnMgYXJlIGluIGRlZmluZWQgZ3JvdXBzLlxyXG4gKlxyXG4gKiBAZGVwcmljYXRlZFxyXG4gKiBAZXhhbXBsZVxyXG4gKiBjaGVja0dyb3VwKCdhZG1pbicsICdTRVJWRVInKSAvLyB0cnVlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBncm91cCB0aGUgZ3JvdXAgdG8gY2hlY2tcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHVzZXIgdG8gY2hlY2tcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrR3JvdXAoZ3JvdXAsIG5hbWUpIHtcclxuICAgIGNvbnNvbGUud2FybignYm90LmNoZWNrR3JvdXAgaXMgZGVwcmljYXRlZC4gVXNlIHdvcmxkLmlzQWRtaW4sIHdvcmxkLmlzTW9kLCBldGMuIGluc3RlYWQnKTtcclxuXHJcbiAgICBuYW1lID0gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgc3dpdGNoIChncm91cC50b0xvY2FsZUxvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgY2FzZSAnYWxsJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzUGxheWVyKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ2FkbWluJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzQWRtaW4obmFtZSk7XHJcbiAgICAgICAgY2FzZSAnbW9kJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzTW9kKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ3N0YWZmJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzU3RhZmYobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnb3duZXInOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNPd25lcihuYW1lKTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuIiwiY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcblxyXG5jb25zdCBib3QgPSBPYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL3NlbmQnKSxcclxuICAgIHJlcXVpcmUoJy4vY2hlY2tHcm91cCcpXHJcbik7XHJcblxyXG5ib3QudmVyc2lvbiA9ICc2LjEuMCc7XHJcblxyXG4vKipcclxuICogQGRlcHJpY2F0ZWQgc2luY2UgNi4xLjAuIFVzZSBleC53b3JsZCBpbnN0ZWFkLlxyXG4gKi9cclxuYm90LndvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5zdG9yYWdlLnNldCgnbWJfdmVyc2lvbicsIGJvdC52ZXJzaW9uLCBmYWxzZSk7XHJcbiIsImZ1bmN0aW9uIHVwZGF0ZShrZXlzLCBvcGVyYXRvcikge1xyXG4gICAgT2JqZWN0LmtleXMobG9jYWxTdG9yYWdlKS5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBvZiBrZXlzKSB7XHJcbiAgICAgICAgICAgIGlmIChpdGVtLnN0YXJ0c1dpdGgoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oaXRlbSwgb3BlcmF0b3IobG9jYWxTdG9yYWdlLmdldEl0ZW0oaXRlbSkpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vanNoaW50IC1XMDg2XHJcbi8vTm8gYnJlYWsgc3RhdGVtZW50cyBhcyB3ZSB3YW50IHRvIGV4ZWN1dGUgYWxsIHVwZGF0ZXMgYWZ0ZXIgbWF0Y2hlZCB2ZXJzaW9uIHVubGVzcyBvdGhlcndpc2Ugbm90ZWQuXHJcbnN3aXRjaCAobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ21iX3ZlcnNpb24nKSkge1xyXG4gICAgY2FzZSBudWxsOlxyXG4gICAgICAgIGJyZWFrOyAvL05vdGhpbmcgdG8gbWlncmF0ZVxyXG4gICAgY2FzZSAnNS4yLjAnOlxyXG4gICAgY2FzZSAnNS4yLjEnOlxyXG4gICAgICAgIC8vV2l0aCA2LjAsIG5ld2xpbmVzIGFyZSBkaXJlY3RseSBzdXBwb3J0ZWQgaW4gbWVzc2FnZXMgYnkgdGhlIGJvdC5cclxuICAgICAgICB1cGRhdGUoWydhbm5vdW5jZW1lbnRBcnInLCAnam9pbkFycicsICdsZWF2ZUFycicsICd0cmlnZ2VyQXJyJ10sIGZ1bmN0aW9uKHJhdykge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhcnNlZCA9IEpTT04ucGFyc2UocmF3KTtcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1zZy5tZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1zZy5tZXNzYWdlID0gbXNnLm1lc3NhZ2UucmVwbGFjZSgvXFxcXG4vZywgJ1xcbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHBhcnNlZCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhdztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGJyZWFrOyAvL05leHQgYnVnZml4IG9ubHkgcmVsYXRlcyB0byA2LjAgYm90LlxyXG4gICAgY2FzZSAnNi4wLjBhJzpcclxuICAgIGNhc2UgJzYuMC4wJzpcclxuICAgICAgICBhbGVydChcIkR1ZSB0byBhIGJ1ZyBpbiB0aGUgNi4wLjAgdmVyc2lvbiBvZiB0aGUgYm90LCB5b3VyIGpvaW4gYW5kIGxlYXZlIG1lc3NhZ2VzIG1heSBiZSBzd2FwcGVkLiBTb3JyeSEgVGhpcyBjYW5ub3QgYmUgZml4ZWQgYXV0b21hdGljYWxseS4gVGhpcyBtZXNzYWdlIHdpbGwgbm90IGJlIHNob3duIGFnYWluLlwiKTtcclxuICAgICAgICBicmVhazsgLy9OZXh0IGJ1Z2ZpeCBvbmx5IHJlbGF0ZXMgdG8gNi4wLjEgLyA2LjAuMi5cclxuICAgIGNhc2UgJzYuMC4xJzpcclxuICAgIGNhc2UgJzYuMC4yJzpcclxuICAgICAgICBhbGVydChcIkR1ZSB0byBhIGJ1ZyBpbiA2LjAuMSAvIDYuMC4yLCBncm91cHMgbWF5IGhhdmUgYmVlbiBtaXhlZCB1cCBvbiBKb2luLCBMZWF2ZSwgYW5kIFRyaWdnZXIgbWVzc2FnZXMuIFNvcnJ5ISBUaGlzIGNhbm5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5IGlmIGl0IG9jY3VyZWQgb24geW91ciBib3QuIEFubm91bmNlbWVudHMgaGF2ZSBhbHNvIGJlZW4gZml4ZWQuXCIpO1xyXG4gICAgY2FzZSAnNi4wLjMnOlxyXG4gICAgY2FzZSAnNi4wLjQnOlxyXG4gICAgY2FzZSAnNi4wLjUnOlxyXG4gICAgY2FzZSAnNi4wLjYnOlxyXG4gICAgY2FzZSAnNi4xLjBhJzpcclxuICAgICAgICAvL05vcm1hbGl6ZSBncm91cHMgdG8gbG93ZXIgY2FzZS5cclxuICAgICAgICB1cGRhdGUoWydqb2luQXJyJywgJ2xlYXZlQXJyJywgJ3RyaWdnZXJBcnInXSwgZnVuY3Rpb24ocmF3KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcGFyc2VkID0gSlNPTi5wYXJzZShyYXcpO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBtc2cuZ3JvdXAgPSBtc2cuZ3JvdXAudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBtc2cubm90X2dyb3VwID0gbXNnLm5vdF9ncm91cC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocGFyc2VkKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJhdztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG59XHJcbi8vanNoaW50ICtXMDg2XHJcbiIsInZhciBhcGkgPSByZXF1aXJlKCdsaWJyYXJpZXMvYmxvY2toZWFkcycpO1xyXG52YXIgc2V0dGluZ3MgPSByZXF1aXJlKCdzZXR0aW5ncy9ib3QnKTtcclxuXHJcbnZhciBxdWV1ZSA9IFtdO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzZW5kLFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gcXVldWUgYSBtZXNzYWdlIHRvIGJlIHNlbnQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNlbmQoJ0hlbGxvIScpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBiZSBzZW50LlxyXG4gKi9cclxuZnVuY3Rpb24gc2VuZChtZXNzYWdlKSB7XHJcbiAgICBpZiAoc2V0dGluZ3Muc3BsaXRNZXNzYWdlcykge1xyXG4gICAgICAgIC8vRklYTUU6IElmIHRoZSBiYWNrc2xhc2ggYmVmb3JlIHRoZSB0b2tlbiBpcyBlc2NhcGVkIGJ5IGFub3RoZXIgYmFja3NsYXNoIHRoZSB0b2tlbiBzaG91bGQgc3RpbGwgc3BsaXQgdGhlIG1lc3NhZ2UuXHJcbiAgICAgICAgbGV0IHN0ciA9IG1lc3NhZ2Uuc3BsaXQoc2V0dGluZ3Muc3BsaXRUb2tlbik7XHJcbiAgICAgICAgbGV0IHRvU2VuZCA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgY3VyciA9IHN0cltpXTtcclxuICAgICAgICAgICAgaWYgKGN1cnJbY3Vyci5sZW5ndGggLSAxXSA9PSAnXFxcXCcgJiYgaSA8IHN0ci5sZW5ndGggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyICs9IHNldHRpbmdzLnNwbGl0VG9rZW4gKyBzdHJbKytpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0b1NlbmQucHVzaChjdXJyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU2VuZC5mb3JFYWNoKG1zZyA9PiBxdWV1ZS5wdXNoKG1zZykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBxdWV1ZS5wdXNoKG1lc3NhZ2UpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogV2F0Y2hlcyB0aGUgcXVldWUgZm9yIG5ldyBtZXNzYWdlcyB0byBzZW5kIGFuZCBzZW5kcyB0aGVtIGFzIHNvb24gYXMgcG9zc2libGUuXHJcbiAqL1xyXG4oZnVuY3Rpb24gY2hlY2tRdWV1ZSgpIHtcclxuICAgIGlmICghcXVldWUubGVuZ3RoKSB7XHJcbiAgICAgICAgc2V0VGltZW91dChjaGVja1F1ZXVlLCA1MDApO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBhcGkuc2VuZChxdWV1ZS5zaGlmdCgpKVxyXG4gICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChjaGVja1F1ZXVlLCAxMDAwKTtcclxuICAgICAgICB9KTtcclxufSgpKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB3cml0ZSxcclxuICAgIGNsZWFyXHJcbn07XHJcblxyXG5mdW5jdGlvbiB3cml0ZShtc2csIG5hbWUgPSAnJywgbmFtZUNsYXNzID0gJycpIHtcclxuICAgIHZhciBtc2dFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgICBpZiAobmFtZUNsYXNzKSB7XHJcbiAgICAgICAgbXNnRWwuc2V0QXR0cmlidXRlKCdjbGFzcycsIG5hbWVDbGFzcyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIG5hbWVFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIG5hbWVFbC50ZXh0Q29udGVudCA9IG5hbWU7XHJcblxyXG4gICAgdmFyIGNvbnRlbnRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIGlmIChuYW1lKSB7XHJcbiAgICAgICAgY29udGVudEVsLnRleHRDb250ZW50ID0gYDogJHttc2d9YDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29udGVudEVsLnRleHRDb250ZW50ID0gbXNnO1xyXG4gICAgfVxyXG4gICAgbXNnRWwuYXBwZW5kQ2hpbGQobmFtZUVsKTtcclxuICAgIG1zZ0VsLmFwcGVuZENoaWxkKGNvbnRlbnRFbCk7XHJcblxyXG4gICAgdmFyIGNoYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSB1bCcpO1xyXG4gICAgY2hhdC5hcHBlbmRDaGlsZChtc2dFbCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsZWFyKCkge1xyXG4gICAgdmFyIGNoYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSB1bCcpO1xyXG4gICAgY2hhdC5pbm5lckhUTUwgPSAnJztcclxufVxyXG4iLCJjb25zdCBzZWxmID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2V4cG9ydHMnKTtcclxuXHJcbmNvbnN0IHNldHRpbmdzID0gcmVxdWlyZSgnc2V0dGluZ3MvYm90Jyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5jb25zdCBzZW5kID0gcmVxdWlyZSgnYm90Jykuc2VuZDtcclxuY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5cclxuXHJcbi8vIFRPRE86IFBhcnNlIHRoZXNlIGFuZCBwcm92aWRlIG9wdGlvbnMgdG8gc2hvdy9oaWRlIGRpZmZlcmVudCBvbmVzLlxyXG5ob29rLm9uKCd3b3JsZC5vdGhlcicsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgIHNlbGYud3JpdGUobWVzc2FnZSwgdW5kZWZpbmVkLCAnb3RoZXInKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5tZXNzYWdlJywgZnVuY3Rpb24obmFtZSwgbWVzc2FnZSkge1xyXG4gICAgbGV0IG1zZ0NsYXNzID0gJ3BsYXllcic7XHJcbiAgICBpZiAod29ybGQuaXNTdGFmZihuYW1lKSkge1xyXG4gICAgICAgIG1zZ0NsYXNzID0gJ3N0YWZmJztcclxuICAgICAgICBpZiAod29ybGQuaXNNb2QobmFtZSkpIHtcclxuICAgICAgICAgICAgbXNnQ2xhc3MgKz0gJyBtb2QnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vSGFzIHRvIGJlIGFkbWluXHJcbiAgICAgICAgICAgIG1zZ0NsYXNzICs9ICcgYWRtaW4nO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIG1zZ0NsYXNzICs9ICcgY29tbWFuZCc7XHJcbiAgICB9XHJcbiAgICBzZWxmLndyaXRlKG1lc3NhZ2UsIG5hbWUsIG1zZ0NsYXNzKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5zZXJ2ZXJjaGF0JywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgc2VsZi53cml0ZShtZXNzYWdlLCAnU0VSVkVSJywgJ2FkbWluJyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQuc2VuZCcsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIHNlbGYud3JpdGUobWVzc2FnZSwgJ1NFUlZFUicsICdhZG1pbiBjb21tYW5kJyk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy9NZXNzYWdlIGhhbmRsZXJzXHJcbmhvb2sub24oJ3dvcmxkLmpvaW4nLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJKb2luKG5hbWUsIGlwKSB7XHJcbiAgICBzZWxmLndyaXRlKGAke25hbWV9ICgke2lwfSkgaGFzIGpvaW5lZCB0aGUgc2VydmVyYCwgJ1NFUlZFUicsICdqb2luIHdvcmxkIGFkbWluJyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQubGVhdmUnLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJMZWF2ZShuYW1lKSB7XHJcbiAgICBzZWxmLndyaXRlKGAke25hbWV9IGhhcyBsZWZ0IHRoZSBzZXJ2ZXJgLCAnU0VSVkVSJywgYGxlYXZlIHdvcmxkIGFkbWluYCk7XHJcbn0pO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0NvbnNvbGUnKTtcclxudGFiLmlubmVySFRNTCA9ICc8c3R5bGU+JyArXHJcbiAgICBcIiNtYl9jb25zb2xle2hlaWdodDpjYWxjKDEwMCUgLSA1MHB4KX0jbWJfY29uc29sZSAubW9kPnNwYW46Zmlyc3QtY2hpbGR7Y29sb3I6IzA1ZjUyOX0jbWJfY29uc29sZSAuYWRtaW4+c3BhbjpmaXJzdC1jaGlsZHtjb2xvcjojMmIyNmJkfSNtYl9jb25zb2xlIC5jaGF0e21hcmdpbjoxZW07bWF4LWhlaWdodDpjYWxjKDEwMHZoIC0gM2VtIC0gNTVweCk7d2lkdGg6Y2FsYygxMDB2dyAtIDJlbSk7b3ZlcmZsb3cteTphdXRvfSNtYl9jb25zb2xlIC5jaGF0LWNvbnRyb2x7cG9zaXRpb246Zml4ZWQ7Ym90dG9tOjA7d2lkdGg6MTAwdnd9I21iX2NvbnNvbGUgLmNoYXQtY29udHJvbCAuY29udHJvbHttYXJnaW46MWVtfVxcblwiICtcclxuICAgICc8L3N0eWxlPicgK1xyXG4gICAgXCI8ZGl2IGlkPVxcXCJtYl9jb25zb2xlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY2hhdFxcXCI+XFxyXFxuICAgICAgICA8dWw+PC91bD5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNoYXQtY29udHJvbFxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjb250cm9sIGhhcy1hZGRvbnNcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiaW5wdXQgaXMtZXhwYW5kZWRcXFwiLz5cXHJcXG4gICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVxcXCJpbnB1dCBidXR0b24gaXMtcHJpbWFyeVxcXCI+U0VORDwvYnV0dG9uPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxuLy8gSWYgZW5hYmxlZCwgc2hvdyBtZXNzYWdlcyBmb3IgbmV3IGNoYXQgd2hlbiBub3Qgb24gdGhlIGNvbnNvbGUgcGFnZVxyXG5ob29rLm9uKCd3b3JsZC5jaGF0JywgZnVuY3Rpb24obmFtZSwgbWVzc2FnZSkge1xyXG4gICAgaWYgKHNldHRpbmdzLm5vdGlmeSAmJiAhdGFiLmNsYXNzTGlzdC5jb250YWlucygndmlzaWJsZScpKSB7XHJcbiAgICAgICAgdWkubm90aWZ5KGAke25hbWV9OiAke21lc3NhZ2V9YCwgMS41KTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuLy8gQXV0byBzY3JvbGwgd2hlbiBuZXcgbWVzc2FnZXMgYXJlIGFkZGVkIHRvIHRoZSBwYWdlLCB1bmxlc3MgdGhlIG93bmVyIGlzIHJlYWRpbmcgb2xkIGNoYXQuXHJcbihuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiBzaG93TmV3Q2hhdCgpIHtcclxuICAgIGxldCBjb250YWluZXIgPSB0YWIucXVlcnlTZWxlY3RvcignLmNoYXQnKTtcclxuICAgIGxldCBsYXN0TGluZSA9IHRhYi5xdWVyeVNlbGVjdG9yKCdsaTpsYXN0LWNoaWxkJyk7XHJcblxyXG4gICAgaWYgKCFjb250YWluZXIgfHwgIWxhc3RMaW5lKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjb250YWluZXIuc2Nyb2xsSGVpZ2h0IC0gY29udGFpbmVyLmNsaWVudEhlaWdodCAtIGNvbnRhaW5lci5zY3JvbGxUb3AgPD0gbGFzdExpbmUuY2xpZW50SGVpZ2h0ICogMTApIHtcclxuICAgICAgICBsYXN0TGluZS5zY3JvbGxJbnRvVmlldyhmYWxzZSk7XHJcbiAgICB9XHJcbn0pKS5vYnNlcnZlKHRhYi5xdWVyeVNlbGVjdG9yKCcuY2hhdCcpLCB7Y2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlfSk7XHJcblxyXG5cclxuLy8gUmVtb3ZlIG9sZCBjaGF0IHRvIHJlZHVjZSBtZW1vcnkgdXNhZ2VcclxuKG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIHJlbW92ZU9sZENoYXQoKSB7XHJcbiAgICB2YXIgY2hhdCA9IHRhYi5xdWVyeVNlbGVjdG9yKCd1bCcpO1xyXG5cclxuICAgIHdoaWxlIChjaGF0LmNoaWxkcmVuLmxlbmd0aCA+IDUwMCkge1xyXG4gICAgICAgIGNoYXQuY2hpbGRyZW5bMF0ucmVtb3ZlKCk7XHJcbiAgICB9XHJcbn0pKS5vYnNlcnZlKHRhYi5xdWVyeVNlbGVjdG9yKCcuY2hhdCcpLCB7Y2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlfSk7XHJcblxyXG4vLyBMaXN0ZW4gZm9yIHRoZSB1c2VyIHRvIHNlbmQgbWVzc2FnZXNcclxuZnVuY3Rpb24gdXNlclNlbmQoKSB7XHJcbiAgICB2YXIgaW5wdXQgPSB0YWIucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcclxuICAgIGhvb2suZmlyZSgnY29uc29sZS5zZW5kJywgaW5wdXQudmFsdWUpO1xyXG4gICAgc2VuZChpbnB1dC52YWx1ZSk7XHJcbiAgICBpbnB1dC52YWx1ZSA9ICcnO1xyXG4gICAgaW5wdXQuZm9jdXMoKTtcclxufVxyXG5cclxudGFiLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0JykuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICBpZiAoZXZlbnQua2V5ID09IFwiRW50ZXJcIiB8fCBldmVudC5rZXlDb2RlID09IDEzKSB7XHJcbiAgICAgICAgdXNlclNlbmQoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG50YWIucXVlcnlTZWxlY3RvcignYnV0dG9uJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB1c2VyU2VuZCk7XHJcbiIsIi8vVE9ETzogVXNlIGZldGNoXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBHRVQgYSBwYWdlLiBQYXNzZXMgdGhlIHJlc3BvbnNlIG9mIHRoZSBYSFIgaW4gdGhlIHJlc29sdmUgcHJvbWlzZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogLy9zZW5kcyBhIEdFVCByZXF1ZXN0IHRvIC9zb21lL3VybC5waHA/YT10ZXN0XHJcbiAqIGdldCgnL3NvbWUvdXJsLnBocCcsIHthOiAndGVzdCd9KS50aGVuKGNvbnNvbGUubG9nKVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNTdHJcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldCh1cmwgPSAnLycsIHBhcmFtcyA9IHt9KSB7XHJcbiAgICBpZiAoT2JqZWN0LmtleXMocGFyYW1zKS5sZW5ndGgpIHtcclxuICAgICAgICB2YXIgYWRkaXRpb24gPSB1cmxTdHJpbmdpZnkocGFyYW1zKTtcclxuICAgICAgICBpZiAodXJsLmluY2x1ZGVzKCc/JykpIHtcclxuICAgICAgICAgICAgdXJsICs9IGAmJHthZGRpdGlvbn1gO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHVybCArPSBgPyR7YWRkaXRpb259YDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHhocignR0VUJywgdXJsLCB7fSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhIEpTT04gb2JqZWN0IGluIHRoZSBwcm9taXNlIHJlc29sdmUgbWV0aG9kLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbU9ialxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0SlNPTih1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiBnZXQodXJsLCBwYXJhbU9iaikudGhlbihKU09OLnBhcnNlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBtYWtlIGEgcG9zdCByZXF1ZXN0XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtT2JqXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBwb3N0KHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIHhocignUE9TVCcsIHVybCwgcGFyYW1PYmopO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGZldGNoIEpTT04gZnJvbSBhIHBhZ2UgdGhyb3VnaCBwb3N0LlxyXG4gKlxyXG4gKiBAcGFyYW0gc3RyaW5nIHVybFxyXG4gKiBAcGFyYW0gc3RyaW5nIHBhcmFtT2JqXHJcbiAqIEByZXR1cm4gUHJvbWlzZVxyXG4gKi9cclxuZnVuY3Rpb24gcG9zdEpTT04odXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4gcG9zdCh1cmwsIHBhcmFtT2JqKS50aGVuKEpTT04ucGFyc2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiogSGVscGVyIGZ1bmN0aW9uIHRvIG1ha2UgWEhSIHJlcXVlc3RzLCBpZiBwb3NzaWJsZSB1c2UgdGhlIGdldCBhbmQgcG9zdCBmdW5jdGlvbnMgaW5zdGVhZC5cclxuKlxyXG4qIEBkZXByaWNhdGVkIHNpbmNlIHZlcnNpb24gNi4xXHJcbiogQHBhcmFtIHN0cmluZyBwcm90b2NvbFxyXG4qIEBwYXJhbSBzdHJpbmcgdXJsXHJcbiogQHBhcmFtIG9iamVjdCBwYXJhbU9iaiAtLSBXQVJOSU5HLiBPbmx5IGFjY2VwdHMgc2hhbGxvdyBvYmplY3RzLlxyXG4qIEByZXR1cm4gUHJvbWlzZVxyXG4qL1xyXG5mdW5jdGlvbiB4aHIocHJvdG9jb2wsIHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgdmFyIHBhcmFtU3RyID0gdXJsU3RyaW5naWZ5KHBhcmFtT2JqKTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICB2YXIgcmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgcmVxLm9wZW4ocHJvdG9jb2wsIHVybCk7XHJcbiAgICAgICAgcmVxLnNldFJlcXVlc3RIZWFkZXIoJ1gtUmVxdWVzdGVkLVdpdGgnLCAnWE1MSHR0cFJlcXVlc3QnKTtcclxuICAgICAgICBpZiAocHJvdG9jb2wgPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICAgIHJlcS5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXEub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09IDIwMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXEuc3RhdHVzVGV4dCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvLyBIYW5kbGUgbmV0d29yayBlcnJvcnNcclxuICAgICAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZWplY3QoRXJyb3IoXCJOZXR3b3JrIEVycm9yXCIpKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChwYXJhbVN0cikge1xyXG4gICAgICAgICAgICByZXEuc2VuZChwYXJhbVN0cik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVxLnNlbmQoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIHN0cmluZ2lmeSB1cmwgcGFyYW1ldGVyc1xyXG4gKi9cclxuZnVuY3Rpb24gdXJsU3RyaW5naWZ5KG9iaikge1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iailcclxuICAgIC5tYXAoayA9PiBgJHtlbmNvZGVVUklDb21wb25lbnQoayl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KG9ialtrXSl9YClcclxuICAgIC5qb2luKCcmJyk7XHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHt4aHIsIGdldCwgZ2V0SlNPTiwgcG9zdCwgcG9zdEpTT059O1xyXG4iLCIvKipcclxuICogQGZpbGUgQ29udGFpbnMgZnVuY3Rpb25zIHRvIGludGVyYWN0IHdpdGggYmxvY2toZWFkc2ZhbnMuY29tIC0gY2Fubm90IGJlIHVzZWQgYnkgZXh0ZW5zaW9ucy5cclxuICovXHJcblxyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgYWpheCA9IHJlcXVpcmUoJ2xpYnJhcmllcy9hamF4Jyk7XHJcblxyXG5jb25zdCBBUElfVVJMUyA9IHtcclxuICAgIFNUT1JFOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9hcGkvZXh0ZW5zaW9uL3N0b3JlJyxcclxuICAgIE5BTUU6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2FwaS9leHRlbnNpb24vaW5mbycsXHJcbiAgICBFUlJPUjogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvYXBpL2Vycm9yJyxcclxufTtcclxuXHJcbnZhciBjYWNoZSA9IHtcclxuICAgIGluZm86IG5ldyBNYXAoKSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGdldCBwdWJsaWMgZXh0ZW5zaW9uc1xyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRTdG9yZSgpLnRoZW4oc3RvcmUgPT4gY29uc29sZS5sb2coc3RvcmUpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gdXNlIHRoZSBjYWNoZWQgcmVzcG9uc2Ugc2hvdWxkIGJlIGNsZWFyZWQuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9IHJlc29sdmVzIHdpdGggdGhlIHJlc3BvbnNlXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRTdG9yZShyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRTdG9yZSkge1xyXG4gICAgICAgIGNhY2hlLmdldFN0b3JlID0gYWpheC5nZXRKU09OKEFQSV9VUkxTLlNUT1JFKVxyXG4gICAgICAgICAgICAudGhlbihzdG9yZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvL0J1aWxkIHRoZSBpbml0aWFsIG5hbWVzIG1hcFxyXG4gICAgICAgICAgICAgICAgaWYgKHN0b3JlLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGV4IG9mIHN0b3JlLmV4dGVuc2lvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5pbmZvLnNldChleC5pZCwgZXgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0U3RvcmU7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbmFtZSBvZiB0aGUgcHJvdmlkZWQgZXh0ZW5zaW9uIElELlxyXG4gKiBJZiB0aGUgZXh0ZW5zaW9uIHdhcyBub3QgZm91bmQsIHJlc29sdmVzIHdpdGggdGhlIG9yaWdpbmFsIHBhc3NlZCBJRC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0RXh0ZW5zaW9uSW5mbygndGVzdCcpLnRoZW4oaW5mbyA9PiBjb25zb2xlLmxvZyhpbmZvKSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCB0aGUgaWQgdG8gc2VhcmNoIGZvci5cclxuICogQHJldHVybiB7UHJvbWlzZX0gcmVzb2x2ZXMgd2l0aCB0aGUgZXh0ZW5zaW9uJ3MgbmFtZSwgc25pcHBldCwgYW5kIElELlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uSW5mbyhpZCkge1xyXG4gICAgaWYgKGNhY2hlLmluZm8uaGFzKGlkKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGUuaW5mby5nZXQoaWQpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWpheC5nZXRKU09OKEFQSV9VUkxTLk5BTUUsIHtpZH0pLnRoZW4oKHtpZCwgdGl0bGUsIHNuaXBwZXR9KSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmluZm9cclxuICAgICAgICAgICAgLnNldChpZCwge2lkLCB0aXRsZSwgc25pcHBldH0pXHJcbiAgICAgICAgICAgIC5nZXQoaWQpO1xyXG4gICAgfSwgZXJyID0+IHtcclxuICAgICAgICByZXBvcnRFcnJvcihlcnIpO1xyXG4gICAgICAgIHJldHVybiB7bmFtZTogaWQsIGlkOiBpZCwgc25pcHBldDogJ05vIGRlc2NyaXB0aW9uLid9O1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVwb3J0cyBhbiBlcnJvciBzbyB0aGF0IGl0IGNhbiBiZSByZXZpZXdlZCBhbmQgZml4ZWQgYnkgZXh0ZW5zaW9uIG9yIGJvdCBkZXZlbG9wZXJzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiByZXBvcnRFcnJvcihFcnJvcihcIlJlcG9ydCBtZVwiKSk7XHJcbiAqIEBwYXJhbSB7RXJyb3J9IGVyciB0aGUgZXJyb3IgdG8gcmVwb3J0XHJcbiAqL1xyXG5mdW5jdGlvbiByZXBvcnRFcnJvcihlcnIpIHtcclxuICAgIGFqYXgucG9zdEpTT04oQVBJX1VSTFMuRVJST1IsIHtcclxuICAgICAgICAgICAgZXJyb3JfdGV4dDogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgIGVycm9yX2ZpbGU6IGVyci5maWxlbmFtZSxcclxuICAgICAgICAgICAgZXJyb3Jfcm93OiBlcnIubGluZW5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX2NvbHVtbjogZXJyLmNvbG5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX3N0YWNrOiBlcnIuc3RhY2sgfHwgJycsXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigocmVzcCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgaG9vay5maXJlKCdlcnJvcl9yZXBvcnQnLCAnU29tZXRoaW5nIHdlbnQgd3JvbmcsIGl0IGhhcyBiZWVuIHJlcG9ydGVkLicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaG9vay5maXJlKCdlcnJvcl9yZXBvcnQnLCBgRXJyb3IgcmVwb3J0aW5nIGV4Y2VwdGlvbjogJHtyZXNwLm1lc3NhZ2V9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBnZXRTdG9yZSxcclxuICAgIGdldEV4dGVuc2lvbkluZm8sXHJcbiAgICByZXBvcnRFcnJvcixcclxufTtcclxuIiwidmFyIGFqYXggPSByZXF1aXJlKCcuL2FqYXgnKTtcclxudmFyIGhvb2sgPSByZXF1aXJlKCcuL2hvb2snKTtcclxudmFyIGJoZmFuc2FwaSA9IHJlcXVpcmUoJy4vYmhmYW5zYXBpJyk7XHJcblxyXG5jb25zdCB3b3JsZElkID0gd2luZG93LndvcmxkSWQ7XHJcbnZhciBjYWNoZSA9IHtcclxuICAgIGZpcnN0SWQ6IDAsXHJcbn07XHJcblxyXG4vLyBVc2VkIHRvIHBhcnNlIG1lc3NhZ2VzIG1vcmUgYWNjdXJhdGVseVxyXG52YXIgd29ybGQgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW11cclxufTtcclxuZ2V0T25saW5lUGxheWVycygpXHJcbiAgICAudGhlbihwbGF5ZXJzID0+IHdvcmxkLnBsYXllcnMgPSBbLi4ubmV3IFNldChwbGF5ZXJzLmNvbmNhdCh3b3JsZC5wbGF5ZXJzKSldKTtcclxuXHJcbmdldFdvcmxkTmFtZSgpXHJcbiAgICAudGhlbihuYW1lID0+IHdvcmxkLm5hbWUgPSBuYW1lKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHdvcmxkU3RhcnRlZCxcclxuICAgIGdldExvZ3MsXHJcbiAgICBnZXRMaXN0cyxcclxuICAgIGdldEhvbWVwYWdlLFxyXG4gICAgZ2V0T25saW5lUGxheWVycyxcclxuICAgIGdldE93bmVyTmFtZSxcclxuICAgIGdldFdvcmxkTmFtZSxcclxuICAgIHNlbmQsXHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIHRoZSB3b3JsZCBpZiBuZWNjZXNzYXJ5LCByZWplY3RzIGlmIHRoZSB3b3JsZCB0YWtlcyB0b28gbG9uZyB0byBzdGFydCBvciBpcyB1bmF2YWlsaWJsZVxyXG4gKiBSZWZhY3RvcmluZyB3ZWxjb21lLiBUaGlzIHNlZW1zIG92ZXJseSBweXJhbWlkIGxpa2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHdvcmxkU3RhcnRlZCgpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ3N0YXJ0ZWQhJykpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWNoZWNrIGlmIHRoZSB3b3JsZCBpcyBzdGFydGVkLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gd29ybGRTdGFydGVkKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLndvcmxkU3RhcnRlZCkge1xyXG4gICAgICAgIGNhY2hlLndvcmxkU3RhcnRlZCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdmFyIGZhaWxzID0gMDtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uIGNoZWNrKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ291bGQgdGhpcyBiZSBtb3JlIHNpbXBsaWZpZWQ/XHJcbiAgICAgICAgICAgICAgICBhamF4LnBvc3RKU09OKCcvYXBpJywgeyBjb21tYW5kOiAnc3RhdHVzJywgd29ybGRJZCB9KS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlc3BvbnNlLndvcmxkU3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ29ubGluZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdvZmZsaW5lJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFqYXgucG9zdEpTT04oJy9hcGknLCB7IGNvbW1hbmQ6ICdzdGFydCcsIHdvcmxkSWQgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihjaGVjaywgY2hlY2spO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3VuYXZhaWxpYmxlJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdXb3JsZCB1bmF2YWlsaWJsZS4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0YXJ0dXAnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzaHV0ZG93bic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0b3JpbmcnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVjaywgMzAwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKytmYWlscyA+IDEwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ1dvcmxkIHRvb2sgdG9vIGxvbmcgdG8gc3RhcnQuJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignVW5rbm93biByZXNwb25zZS4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKTtcclxuICAgICAgICAgICAgfSgpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUud29ybGRTdGFydGVkO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgdGhlIGxvZydzIGxpbmVzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMb2dzKCkudGhlbihsaW5lcyA9PiBjb25zb2xlLmxvZyhsaW5lc1swXSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWRvd25sb2FkIHRoZSBsb2dzXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMb2dzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldExvZ3MpIHtcclxuICAgICAgICBjYWNoZS5nZXRMb2dzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbG9ncy8ke3dvcmxkSWR9YCkpXHJcbiAgICAgICAgICAgIC50aGVuKGxvZyA9PiBsb2cuc3BsaXQoJ1xcbicpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0TG9ncztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIGEgbGlzdCBvZiBhZG1pbnMsIG1vZHMsIHN0YWZmIChhZG1pbnMgKyBtb2RzKSwgd2hpdGVsaXN0LCBhbmQgYmxhY2tsaXN0LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMaXN0cygpLnRoZW4obGlzdHMgPT4gY29uc29sZS5sb2cobGlzdHMuYWRtaW4pKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmZXRjaCB0aGUgbGlzdHMuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMaXN0cyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRMaXN0cykge1xyXG4gICAgICAgIGNhY2hlLmdldExpc3RzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbGlzdHMvJHt3b3JsZElkfWApKVxyXG4gICAgICAgICAgICAudGhlbihodG1sID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldExpc3QobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gZG9jLnF1ZXJ5U2VsZWN0b3IoYHRleHRhcmVhW25hbWU9JHtuYW1lfV1gKVxyXG4gICAgICAgICAgICAgICAgICAgIC52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIC50b0xvY2FsZVVwcGVyQ2FzZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCdcXG4nKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWy4uLm5ldyBTZXQobGlzdCldOyAvL1JlbW92ZSBkdXBsaWNhdGVzXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGxpc3RzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFkbWluOiBnZXRMaXN0KCdhZG1pbnMnKSxcclxuICAgICAgICAgICAgICAgICAgICBtb2Q6IGdldExpc3QoJ21vZGxpc3QnKSxcclxuICAgICAgICAgICAgICAgICAgICB3aGl0ZTogZ2V0TGlzdCgnd2hpdGVsaXN0JyksXHJcbiAgICAgICAgICAgICAgICAgICAgYmxhY2s6IGdldExpc3QoJ2JsYWNrbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGxpc3RzLm1vZCA9IGxpc3RzLm1vZC5maWx0ZXIobmFtZSA9PiAhbGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgbGlzdHMuc3RhZmYgPSBsaXN0cy5hZG1pbi5jb25jYXQobGlzdHMubW9kKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdHM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRMaXN0cztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSBob21lcGFnZSBvZiB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiBjb25zb2xlLmxvZyhodG1sLnN1YnN0cmluZygwLCAxMDApKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZmV0Y2ggdGhlIHBhZ2UuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRIb21lcGFnZShyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRIb21lcGFnZSkge1xyXG4gICAgICAgIGNhY2hlLmdldEhvbWVwYWdlID0gYWpheC5nZXQoYC93b3JsZHMvJHt3b3JsZElkfWApXHJcbiAgICAgICAgICAgIC5jYXRjaCgoKSA9PiBnZXRIb21lcGFnZSh0cnVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldEhvbWVwYWdlO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgcGxheWVyIG5hbWVzLlxyXG4gKiBBbiBvbmxpbmUgbGlzdCBpcyBtYWludGFpbmVkIGJ5IHRoZSBib3QsIHRoaXMgc2hvdWxkIGdlbmVyYWxseSBub3QgYmUgdXNlZC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T25saW5lUGxheWVycygpLnRoZW4ob25saW5lID0+IHsgZm9yIChsZXQgbiBvZiBvbmxpbmUpIHsgY29uc29sZS5sb2cobiwgJ2lzIG9ubGluZSEnKX19KTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmcmVzaCB0aGUgb25saW5lIG5hbWVzLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T25saW5lUGxheWVycyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0T25saW5lUGxheWVycyA9IGdldEhvbWVwYWdlKHRydWUpXHJcbiAgICAgICAgICAgIC50aGVuKChodG1sKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJFbGVtcyA9IGRvYy5xdWVyeVNlbGVjdG9yKCcubWFuYWdlci5wYWRkZWQ6bnRoLWNoaWxkKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAucXVlcnlTZWxlY3RvckFsbCgndHI6bm90KC5oaXN0b3J5KSA+IHRkLmxlZnQnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgQXJyYXkuZnJvbShwbGF5ZXJFbGVtcykuZm9yRWFjaCgoZWwpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJzLnB1c2goZWwudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGxheWVycztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldE9ubGluZVBsYXllcnM7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgc2VydmVyIG93bmVyJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T3duZXJOYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBpcyBvd25lZCBieScsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE93bmVyTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcuc3ViaGVhZGVyfnRyPnRkOm5vdChbY2xhc3NdKScpLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIHdvcmxkJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0V29ybGROYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBuYW1lOicsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldFdvcmxkTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcjdGl0bGUnKS50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZW5kcyBhIG1lc3NhZ2UsIHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiBzZW50IG9yIHJlamVjdHMgb24gZmFpbHVyZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2VuZCgnaGVsbG8hJykudGhlbigoKSA9PiBjb25zb2xlLmxvZygnc2VudCcpKS5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gc2VuZC5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHNlbmQobWVzc2FnZSkge1xyXG4gICAgcmV0dXJuIGFqYXgucG9zdEpTT04oYC9hcGlgLCB7Y29tbWFuZDogJ3NlbmQnLCBtZXNzYWdlLCB3b3JsZElkfSlcclxuICAgICAgICAudGhlbihyZXNwID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlc3Auc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXNwO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4ocmVzcCA9PiB7XHJcbiAgICAgICAgICAgIC8vSGFuZGxlIGhvb2tzXHJcbiAgICAgICAgICAgIGhvb2suZmlyZSgnd29ybGQuc2VuZCcsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBob29rLmZpcmUoJ3dvcmxkLnNlcnZlcm1lc3NhZ2UnLCBtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgIC8vRGlzYWxsb3cgY29tbWFuZHMgc3RhcnRpbmcgd2l0aCBzcGFjZS5cclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpICYmICFtZXNzYWdlLnN0YXJ0c1dpdGgoJy8gJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFyZ3MgPSAnJztcclxuICAgICAgICAgICAgICAgIGlmIChjb21tYW5kLmluY2x1ZGVzKCcgJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBtZXNzYWdlLnN1YnN0cmluZyhtZXNzYWdlLmluZGV4T2YoJyAnKSArIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsICdTRVJWRVInLCBjb21tYW5kLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3A7XHJcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgaWYgKGVyciA9PSAnV29ybGQgbm90IHJ1bm5pbmcuJykge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuZmlyc3RJZCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIHdhdGNoIGNoYXQuXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja0NoYXQoKSB7XHJcbiAgICBnZXRNZXNzYWdlcygpLnRoZW4oKG1zZ3MpID0+IHtcclxuICAgICAgICBtc2dzLmZvckVhY2goKG1lc3NhZ2UpID0+IHtcclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChgJHt3b3JsZC5uYW1lfSAtIFBsYXllciBDb25uZWN0ZWQgYCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBbLCBuYW1lLCBpcF0gPSBtZXNzYWdlLm1hdGNoKC8gLSBQbGF5ZXIgQ29ubmVjdGVkICguKikgXFx8IChbXFxkLl0rKSBcXHwgKFtcXHddezMyfSlcXHMqJC8pO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlSm9pbk1lc3NhZ2VzKG5hbWUsIGlwKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkLm5hbWV9IC0gUGxheWVyIERpc2Nvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBtZXNzYWdlLnN1YnN0cmluZyh3b3JsZC5uYW1lLmxlbmd0aCArIDIzKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJzogJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gZ2V0VXNlcm5hbWUobWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbXNnID0gbWVzc2FnZS5zdWJzdHJpbmcobmFtZS5sZW5ndGggKyAyKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtc2cpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZU90aGVyTWVzc2FnZXMobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcilcclxuICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQ2hhdCwgNTAwMCk7XHJcbiAgICB9KTtcclxufVxyXG5jaGVja0NoYXQoKTtcclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2V0IHRoZSBsYXRlc3QgY2hhdCBtZXNzYWdlcy5cclxuICpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE1lc3NhZ2VzKCkge1xyXG4gICAgcmV0dXJuIHdvcmxkU3RhcnRlZCgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5wb3N0SlNPTihgL2FwaWAsIHsgY29tbWFuZDogJ2dldGNoYXQnLCB3b3JsZElkLCBmaXJzdElkOiBjYWNoZS5maXJzdElkIH0pKVxyXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT0gJ29rJyAmJiBkYXRhLm5leHRJZCAhPSBjYWNoZS5maXJzdElkKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5maXJzdElkID0gZGF0YS5uZXh0SWQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5sb2c7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5zdGF0dXMgPT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHdobyBzZW50IGEgbWVzc2FnZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIG5hbWUgPSBnZXRVc2VybmFtZSgnU0VSVkVSOiBIaSB0aGVyZSEnKTtcclxuICogLy9uYW1lID09ICdTRVJWRVInXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIHBhcnNlLlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBuYW1lIG9mIHRoZSB1c2VyIHdobyBzZW50IHRoZSBtZXNzYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0VXNlcm5hbWUobWVzc2FnZSkge1xyXG4gICAgZm9yIChsZXQgaSA9IDE4OyBpID4gNDsgaS0tKSB7XHJcbiAgICAgICAgbGV0IHBvc3NpYmxlTmFtZSA9IG1lc3NhZ2Uuc3Vic3RyaW5nKDAsIG1lc3NhZ2UubGFzdEluZGV4T2YoJzogJywgaSkpO1xyXG4gICAgICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMocG9zc2libGVOYW1lKSB8fCBwb3NzaWJsZU5hbWUgPT0gJ1NFUlZFUicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBvc3NpYmxlTmFtZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBTaG91bGQgaWRlYWxseSBuZXZlciBoYXBwZW4uXHJcbiAgICByZXR1cm4gbWVzc2FnZS5zdWJzdHJpbmcoMCwgbWVzc2FnZS5sYXN0SW5kZXhPZignOiAnLCAxOCkpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgam9pbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgam9pbmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IGlwIHRoZSBpcCBvZiB0aGUgcGxheWVyIGpvaW5pbmcuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVKb2luTWVzc2FnZXMobmFtZSwgaXApIHtcclxuICAgIGlmICghd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQuam9pbicsIG5hbWUsIGlwKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgZGlzY29ubmVjdGlvbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgbGVhdmluZy5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSkge1xyXG4gICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5zcGxpY2Uod29ybGQub25saW5lLmluZGV4T2YobmFtZSksIDEpO1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLmxlYXZlJywgbmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHVzZXIgY2hhdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdXNlci5cclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2Ugc2VudC5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICBpZiAobmFtZSA9PSAnU0VSVkVSJykge1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLnNlcnZlcmNoYXQnLCBtZXNzYWdlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQubWVzc2FnZScsIG5hbWUsIG1lc3NhZ2UpO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSAmJiAhbWVzc2FnZS5zdGFydHNXaXRoKCcvICcpKSB7XHJcblxyXG4gICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgIGxldCBhcmdzID0gJyc7XHJcbiAgICAgICAgaWYgKGNvbW1hbmQuaW5jbHVkZXMoJyAnKSkge1xyXG4gICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICBhcmdzID0gbWVzc2FnZS5zdWJzdHJpbmcobWVzc2FnZS5pbmRleE9mKCcgJykgKyAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsIG5hbWUsIGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgICAgIHJldHVybjsgLy9ub3QgY2hhdFxyXG4gICAgfVxyXG5cclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLmNoYXQnLCBuYW1lLCBtZXNzYWdlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIGhhbmRsZSBtZXNzYWdlcyB3aGljaCBhcmUgbm90IHNpbXBseSBwYXJzZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIGhhbmRsZVxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlT3RoZXJNZXNzYWdlcyhtZXNzYWdlKSB7XHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5vdGhlcicsIG1lc3NhZ2UpO1xyXG59XHJcbiIsInZhciBsaXN0ZW5lcnMgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGJlZ2luIGxpc3RlbmluZyB0byBhbiBldmVudC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogbGlzdGVuKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogLy9hbHRlcm5hdGl2ZWx5XHJcbiAqIG9uKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0aGUgZXZlbnQgaGFuZGxlclxyXG4gKi9cclxuZnVuY3Rpb24gbGlzdGVuKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIGxpc3RlbmVyc1trZXldID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XS5pbmNsdWRlcyhjYWxsYmFjaykpIHtcclxuICAgICAgICBsaXN0ZW5lcnNba2V5XS5wdXNoKGNhbGxiYWNrKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHN0b3AgbGlzdGVuaW5nIHRvIGFuIGV2ZW50LiBJZiB0aGUgbGlzdGVuZXIgd2FzIG5vdCBmb3VuZCwgbm8gYWN0aW9uIHdpbGwgYmUgdGFrZW4uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vRWFybGllciBhdHRhY2hlZCBteUZ1bmMgdG8gJ2V2ZW50J1xyXG4gKiByZW1vdmUoJ2V2ZW50JywgbXlGdW5jKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gc3RvcCBsaXN0ZW5pbmcgdG8uXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRoZSBjYWxsYmFjayB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQgbGlzdGVuZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKGxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgaWYgKGxpc3RlbmVyc1trZXldLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICBsaXN0ZW5lcnNba2V5XS5zcGxpY2UobGlzdGVuZXJzW2tleV0uaW5kZXhPZihjYWxsYmFjayksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNhbGwgZXZlbnRzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBjaGVjaygndGVzdCcsIDEsIDIsIDMpO1xyXG4gKiBjaGVjaygndGVzdCcsIHRydWUpO1xyXG4gKiAvLyBhbHRlcm5hdGl2ZWx5XHJcbiAqIGZpcmUoJ3Rlc3QnLCAxLCAyLCAzKTtcclxuICogZmlyZSgndGVzdCcsIHRydWUpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBjYWxsLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhcmd1bWVudHMgdG8gcGFzcyB0byBsaXN0ZW5pbmcgZnVuY3Rpb25zLlxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2soa2V5LCAuLi5hcmdzKSB7XHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGlzdGVuZXJzW2tleV0uZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lcikge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVyKC4uLmFyZ3MpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgdmFsdWUgYmFzZWQgb24gaW5wdXQgZnJvbSBsaXN0ZW5lcnMuXHJcbiAqXHJcbiAqIEBkZXByaWNhdGVkIHNpbmNlIDYuMS4wLiBJbnN0ZWFkLCB1cGRhdGUgcmVxdWVzdHMgc2hvdWxkIGJlIGhhbmRsZWQgYnkgdGhlIGV4dGVuc2lvbiBpdGVzZWxmLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1cGRhdGUoJ2V2ZW50JywgdHJ1ZSwgMSwgMiwgMyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGNhbGxcclxuICogQHBhcmFtIHttaXhlZH0gaW5pdGlhbCB0aGUgaW5pdGlhbCB2YWx1ZSB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIHVwZGF0ZShrZXksIGluaXRpYWwsIC4uLmFyZ3MpIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIHJldHVybiBpbml0aWFsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsaXN0ZW5lcnNba2V5XS5yZWR1Y2UoZnVuY3Rpb24ocHJldmlvdXMsIGN1cnJlbnQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gY3VycmVudChwcmV2aW91cywgLi4uYXJncyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91cztcclxuICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcHJldmlvdXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgaW5pdGlhbCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbGlzdGVuLFxyXG4gICAgb246IGxpc3RlbixcclxuICAgIHJlbW92ZSxcclxuICAgIGNoZWNrLFxyXG4gICAgZmlyZTogY2hlY2ssXHJcbiAgICB1cGRhdGUsXHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZ2V0U3RyaW5nLFxyXG4gICAgZ2V0T2JqZWN0LFxyXG4gICAgc2V0LFxyXG4gICAgY2xlYXJOYW1lc3BhY2UsXHJcbn07XHJcblxyXG4vL1JFVklFVzogSXMgdGhlcmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/IHJlcXVpcmUoJy4vY29uZmlnJykgbWF5YmU/XHJcbmNvbnN0IE5BTUVTUEFDRSA9IHdpbmRvdy53b3JsZElkO1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdHJpbmcgZnJvbSB0aGUgc3RvcmFnZSBpZiBpdCBleGlzdHMgYW5kIHJldHVybnMgaXQsIG90aGVyd2lzZSByZXR1cm5zIGZhbGxiYWNrLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgeCA9IGdldFN0cmluZygnc3RvcmVkX3ByZWZzJywgJ25vdGhpbmcnKTtcclxuICogdmFyIHkgPSBnZXRTdHJpbmcoJ3N0b3JlZF9wcmVmcycsICdub3RoaW5nJywgZmFsc2UpO1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBrZXkgdG8gcmV0cmlldmUuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGZhbGxiYWNrIHdoYXQgdG8gcmV0dXJuIGlmIHRoZSBrZXkgd2FzIG5vdCBmb3VuZC5cclxuICogQHBhcmFtIHtib29sfSBbbG9jYWw9dHJ1ZV0gd2hldGhlciBvciBub3QgdG8gdXNlIGEgbmFtZXNwYWNlIHdoZW4gY2hlY2tpbmcgZm9yIHRoZSBrZXkuXHJcbiAqIEByZXR1cm4ge21peGVkfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0U3RyaW5nKGtleSwgZmFsbGJhY2ssIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmIChsb2NhbCkge1xyXG4gICAgICAgIHJlc3VsdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGAke2tleX0ke05BTUVTUEFDRX1gKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKHJlc3VsdCA9PT0gbnVsbCkgPyBmYWxsYmFjayA6IHJlc3VsdDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdG9yZWQgb2JqZWN0IGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIHJldHVybnMgZmFsbGJhY2suXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB4ID0gZ2V0T2JqZWN0KCdzdG9yZWRfa2V5JywgWzEsIDIsIDNdKTtcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgaXRlbSB0byByZXRyaWV2ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZmFsbGJhY2sgd2hhdCB0byByZXR1cm4gaWYgdGhlIGl0ZW0gZG9lcyBub3QgZXhpc3Qgb3IgZmFpbHMgdG8gcGFyc2UgY29ycmVjdGx5LlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIG9yIG5vdCBhIG5hbWVzcGFjZSBzaG91bGQgYmUgdXNlZC5cclxuICogQHJldHVybiB7bWl4ZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPYmplY3Qoa2V5LCBmYWxsYmFjaywgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gZ2V0U3RyaW5nKGtleSwgZmFsc2UsIGxvY2FsKTtcclxuXHJcbiAgICBpZiAoIXJlc3VsdCkge1xyXG4gICAgICAgIHJldHVybiBmYWxsYmFjaztcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UocmVzdWx0KTtcclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogU2V0cyBhbiBvYmplY3QgaW4gdGhlIHN0b3JhZ2UsIHN0cmluZ2lmeWluZyBpdCBmaXJzdCBpZiBuZWNjZXNzYXJ5LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ3NvbWVfa2V5Jywge2E6IFsxLCAyLCAzXSwgYjogJ3Rlc3QnfSk7XHJcbiAqIC8vcmV0dXJucyAne1wiYVwiOlsxLDIsM10sXCJiXCI6XCJ0ZXN0XCJ9J1xyXG4gKiBnZXRTdHJpbmcoJ3NvbWVfa2V5Jyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGl0ZW0gdG8gb3ZlcndyaXRlIG9yIGNyZWF0ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZGF0YSBhbnkgc3RyaW5naWZ5YWJsZSB0eXBlLlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIHRvIHNhdmUgdGhlIGl0ZW0gd2l0aCBhIG5hbWVzcGFjZS5cclxuICovXHJcbmZ1bmN0aW9uIHNldChrZXksIGRhdGEsIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgaWYgKGxvY2FsKSB7XHJcbiAgICAgICAga2V5ID0gYCR7a2V5fSR7TkFNRVNQQUNFfWA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBkYXRhID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBkYXRhKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCBpdGVtcyBzdGFydGluZyB3aXRoIG5hbWVzcGFjZSBmcm9tIHRoZSBzdG9yYWdlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ2tleV90ZXN0JywgMSk7XHJcbiAqIHNldCgna2V5X3Rlc3QyJywgMik7XHJcbiAqIGNsZWFyTmFtZXNwYWNlKCdrZXlfJyk7IC8vYm90aCBrZXlfdGVzdCBhbmQga2V5X3Rlc3QyIGhhdmUgYmVlbiByZW1vdmVkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZXNwYWNlIHRoZSBwcmVmaXggdG8gY2hlY2sgZm9yIHdoZW4gcmVtb3ZpbmcgaXRlbXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBjbGVhck5hbWVzcGFjZShuYW1lc3BhY2UpIHtcclxuICAgIE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aChuYW1lc3BhY2UpKSB7XHJcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3QgYXBpID0gcmVxdWlyZSgnLi9ibG9ja2hlYWRzJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJy4vaG9vaycpO1xyXG5cclxuY29uc3QgU1RPUkFHRSA9IHtcclxuICAgIFBMQVlFUlM6ICdtYl9wbGF5ZXJzJyxcclxuICAgIExPR19MT0FEOiAnbWJfbGFzdExvZ0xvYWQnLFxyXG59O1xyXG5cclxudmFyIHdvcmxkID0gbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW10sXHJcbiAgICBvd25lcjogJycsXHJcbiAgICBwbGF5ZXJzOiBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFLlBMQVlFUlMsIHt9KSxcclxuICAgIGxpc3RzOiB7YWRtaW46IFtdLCBtb2Q6IFtdLCBzdGFmZjogW10sIGJsYWNrOiBbXSwgd2hpdGU6IFtdfSxcclxuICAgIGlzUGxheWVyLFxyXG4gICAgaXNTZXJ2ZXIsXHJcbiAgICBpc093bmVyLFxyXG4gICAgaXNBZG1pbixcclxuICAgIGlzU3RhZmYsXHJcbiAgICBpc01vZCxcclxuICAgIGlzT25saW5lLFxyXG4gICAgZ2V0Sm9pbnMsXHJcbn07XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGEgcGxheWVyIGhhcyBqb2luZWQgdGhlIHNlcnZlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzUGxheWVyKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5wbGF5ZXJzLmhhc093blByb3BlcnR5KG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyB0aGUgc2VydmVyXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1NlcnZlcihuYW1lKSB7XHJcbiAgICByZXR1cm4gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpID09ICdTRVJWRVInO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgdGhlIG93bmVyIG9yIHNlcnZlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzT3duZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLm93bmVyID09IG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSB8fCBpc1NlcnZlcihuYW1lKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIGFuIGFkbWluXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc0FkbWluKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5saXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpIHx8IGlzT3duZXIobmFtZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyBhIG1vZFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNNb2QobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLmxpc3RzLm1vZC5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgYSBzdGFmZiBtZW1iZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1N0YWZmKG5hbWUpIHtcclxuICAgIHJldHVybiBpc0FkbWluKG5hbWUpIHx8IGlzTW9kKG5hbWUpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGEgcGxheWVyIGlzIG9ubGluZVxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNPbmxpbmUobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbnVtYmVyIG9mIHRpbWVzIHRoZSBwbGF5ZXIgaGFzIGpvaW5lZCB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRKb2lucyhuYW1lKSB7XHJcbiAgICByZXR1cm4gaXNQbGF5ZXIobmFtZSkgPyB3b3JsZC5wbGF5ZXJzW25hbWUudG9Mb2NhbGVVcHBlckNhc2UoKV0uam9pbnMgOiAwO1xyXG59XHJcblxyXG4vLyBLZWVwIHRoZSBvbmxpbmUgbGlzdCB1cCB0byBkYXRlXHJcbmhvb2sub24oJ3dvcmxkLmpvaW4nLCBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBpZiAoIXdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG59KTtcclxuaG9vay5vbignd29ybGQubGVhdmUnLCBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBpZiAod29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnNwbGljZSh3b3JsZC5vbmxpbmUuaW5kZXhPZihuYW1lKSwgMSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gS2VlcCBwbGF5ZXJzIGxpc3QgdXAgdG8gZGF0ZVxyXG5ob29rLm9uKCd3b3JsZC5qb2luJywgY2hlY2tQbGF5ZXJKb2luKTtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbi5cclxuICogUmVtb3ZlcyBhZG1pbnMgZnJvbSB0aGUgbW9kIGxpc3QgYW5kIGNyZWF0ZXMgdGhlIHN0YWZmIGxpc3QuXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZFN0YWZmTGlzdCgpIHtcclxuICAgIHdvcmxkLmxpc3RzLm1vZCA9IHdvcmxkLmxpc3RzLm1vZC5maWx0ZXIobmFtZSA9PiAhaXNBZG1pbihuYW1lKSk7XHJcbiAgICB3b3JsZC5saXN0cy5zdGFmZiA9IHdvcmxkLmxpc3RzLmFkbWluLmNvbmNhdCh3b3JsZC5saXN0cy5tb2QpO1xyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24uXHJcbiAqIENoZWNrcyBpZiBhIHBsYXllciBoYXMgcGVybWlzc2lvbiB0byBwZXJmb3JtIGEgY29tbWFuZFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gY29tbWFuZFxyXG4gKi9cclxuZnVuY3Rpb24gcGVybWlzc2lvbkNoZWNrKG5hbWUsIGNvbW1hbmQpIHtcclxuICAgIGNvbW1hbmQgPSBjb21tYW5kLnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgaWYgKFsnYWRtaW4nLCAndW5hZG1pbicsICdtb2QnLCAndW5tb2QnXS5pbmNsdWRlcyhjb21tYW5kKSkge1xyXG4gICAgICAgIHJldHVybiBpc0FkbWluKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChbJ3doaXRlbGlzdCcsICd1bndoaXRlbGlzdCcsICdiYW4nLCAndW5iYW4nXS5pbmNsdWRlcyhjb21tYW5kKSkge1xyXG4gICAgICAgIHJldHVybiBpc1N0YWZmKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuLy8gS2VlcCBsaXN0cyB1cCB0byBkYXRlXHJcbmhvb2sub24oJ3dvcmxkLmNvbW1hbmQnLCBmdW5jdGlvbihuYW1lLCBjb21tYW5kLCB0YXJnZXQpIHtcclxuICAgIGlmICghcGVybWlzc2lvbkNoZWNrKG5hbWUsIGNvbW1hbmQpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB1biA9IGNvbW1hbmQuc3RhcnRzV2l0aCgndW4nKTtcclxuXHJcbiAgICB2YXIgZ3JvdXAgPSB7XHJcbiAgICAgICAgYWRtaW46ICdhZG1pbicsXHJcbiAgICAgICAgbW9kOiAnbW9kJyxcclxuICAgICAgICB3aGl0ZWxpc3Q6ICd3aGl0ZScsXHJcbiAgICAgICAgYmFuOiAnYmxhY2snLFxyXG4gICAgfVt1biA/IGNvbW1hbmQuc3Vic3RyKDIpIDogY29tbWFuZF07XHJcblxyXG4gICAgaWYgKHVuICYmIHdvcmxkLmxpc3RzW2dyb3VwXS5pbmNsdWRlcyh0YXJnZXQpKSB7XHJcbiAgICAgICAgd29ybGQubGlzdHNbZ3JvdXBdLnNwbGljZSh3b3JsZC5saXN0c1tncm91cF0uaW5kZXhPZih0YXJnZXQpLCAxKTtcclxuICAgICAgICBidWlsZFN0YWZmTGlzdCgpO1xyXG4gICAgfSBlbHNlIGlmICghdW4gJiYgIXdvcmxkLmxpc3RzW2dyb3VwXS5pbmNsdWRlcyh0YXJnZXQpKSB7XHJcbiAgICAgICAgd29ybGQubGlzdHNbZ3JvdXBdLnB1c2godGFyZ2V0KTtcclxuICAgICAgICBidWlsZFN0YWZmTGlzdCgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbi4gSW5jcmVtZW50cyBhIHBsYXllcidzIGpvaW5zLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaXBcclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrUGxheWVySm9pbihuYW1lLCBpcCkge1xyXG4gICAgaWYgKHdvcmxkLnBsYXllcnMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcclxuICAgICAgICAvL1JldHVybmluZyBwbGF5ZXJcclxuICAgICAgICB3b3JsZC5wbGF5ZXJzW25hbWVdLmpvaW5zKys7XHJcbiAgICAgICAgaWYgKCF3b3JsZC5wbGF5ZXJzW25hbWVdLmlwcy5pbmNsdWRlcyhpcCkpIHtcclxuICAgICAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXS5pcHMucHVzaChpcCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvL05ldyBwbGF5ZXJcclxuICAgICAgICB3b3JsZC5wbGF5ZXJzW25hbWVdID0ge2pvaW5zOiAxLCBpcHM6IFtpcF19O1xyXG4gICAgfVxyXG4gICAgd29ybGQucGxheWVyc1tuYW1lXS5pcCA9IGlwO1xyXG5cclxuICAgIC8vIE90aGVyd2lzZSwgd2Ugd2lsbCBkb3VibGUgcGFyc2Ugam9pbnNcclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0UuTE9HX0xPQUQsIE1hdGguZmxvb3IoRGF0ZS5ub3coKS52YWx1ZU9mKCkpKTtcclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0UuUExBWUVSUywgd29ybGQucGxheWVycyk7XHJcbn1cclxuXHJcblxyXG4vLyBVcGRhdGUgbGlzdHNcclxuUHJvbWlzZS5hbGwoW2FwaS5nZXRMaXN0cygpLCBhcGkuZ2V0V29ybGROYW1lKCksIGFwaS5nZXRPd25lck5hbWUoKV0pXHJcbiAgICAudGhlbigodmFsdWVzKSA9PiB7XHJcbiAgICAgICAgdmFyIFthcGlMaXN0cywgd29ybGROYW1lLCBvd25lcl0gPSB2YWx1ZXM7XHJcblxyXG4gICAgICAgIHdvcmxkLmxpc3RzID0gYXBpTGlzdHM7XHJcbiAgICAgICAgYnVpbGRTdGFmZkxpc3QoKTtcclxuICAgICAgICB3b3JsZC5uYW1lID0gd29ybGROYW1lO1xyXG4gICAgICAgIHdvcmxkLm93bmVyID0gb3duZXI7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG5cclxuLy8gVXBkYXRlIHBsYXllcnMgc2luY2UgbGFzdCBib3QgbG9hZFxyXG5Qcm9taXNlLmFsbChbYXBpLmdldExvZ3MoKSwgYXBpLmdldFdvcmxkTmFtZSgpXSlcclxuICAgIC50aGVuKCh2YWx1ZXMpID0+IHtcclxuICAgICAgICB2YXIgW2xpbmVzLCB3b3JsZE5hbWVdID0gdmFsdWVzO1xyXG5cclxuICAgICAgICB2YXIgbGFzdCA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0UuTE9HX0xPQUQsIDApO1xyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0UuTE9HX0xPQUQsIE1hdGguZmxvb3IoRGF0ZS5ub3coKS52YWx1ZU9mKCkpKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbGluZSBvZiBsaW5lcykge1xyXG4gICAgICAgICAgICBsZXQgdGltZSA9IG5ldyBEYXRlKGxpbmUuc3Vic3RyaW5nKDAsIGxpbmUuaW5kZXhPZignYicpKS5yZXBsYWNlKCcgJywgJ1QnKS5yZXBsYWNlKCcgJywgJ1onKSk7XHJcbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gbGluZS5zdWJzdHJpbmcobGluZS5pbmRleE9mKCddJykgKyAyKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aW1lIDwgbGFzdCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoYCR7d29ybGROYW1lfSAtIFBsYXllciBDb25uZWN0ZWQgYCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBwYXJ0cyA9IGxpbmUuc3Vic3RyKGxpbmUuaW5kZXhPZignIC0gUGxheWVyIENvbm5lY3RlZCAnKSArIDIwKTsgLy9OQU1FIHwgSVAgfCBJRFxyXG4gICAgICAgICAgICAgICAgbGV0IFssIG5hbWUsIGlwXSA9IHBhcnRzLm1hdGNoKC8oLiopIFxcfCAoW1xcdy5dKykgXFx8IC57MzJ9XFxzKi8pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNoZWNrUGxheWVySm9pbihuYW1lLCBpcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0UuUExBWUVSUywgd29ybGQucGxheWVycyk7XHJcbiAgICB9KTtcclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3Qgc2VuZCA9IHJlcXVpcmUoJ2JvdCcpLnNlbmQ7XHJcbmNvbnN0IHByZWZlcmVuY2VzID0gcmVxdWlyZSgnc2V0dGluZ3MvYm90Jyk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignQW5ub3VuY2VtZW50cycsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8dGVtcGxhdGUgaWQ9XFxcImFUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNvbHVtbiBpcy1mdWxsXFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPlNlbmQ6PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICA8dGV4dGFyZWEgY2xhc3M9XFxcInRleHRhcmVhIGlzLWZsdWlkIG1cXFwiPjwvdGV4dGFyZWE+XFxyXFxuICAgICAgICAgICAgPGE+RGVsZXRlPC9hPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgICAgICA8ZGl2PlxcclxcbiAgICAgICAgICAgIFdhaXQgWCBtaW51dGVzLi4uXFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9hbm5vdW5jZW1lbnRzXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgICAgIDxoMz5UaGVzZSBhcmUgc2VudCBhY2NvcmRpbmcgdG8gYSByZWd1bGFyIHNjaGVkdWxlLjwvaDM+XFxyXFxuICAgICAgICA8c3Bhbj5JZiB5b3UgaGF2ZSBvbmUgYW5ub3VuY2VtZW50LCBpdCBpcyBzZW50IGV2ZXJ5IFggbWludXRlcywgaWYgeW91IGhhdmUgdHdvLCB0aGVuIHRoZSBmaXJzdCBpcyBzZW50IGF0IFggbWludXRlcywgYW5kIHRoZSBzZWNvbmQgaXMgc2VudCBYIG1pbnV0ZXMgYWZ0ZXIgdGhlIGZpcnN0LiBDaGFuZ2UgWCBpbiB0aGUgc2V0dGluZ3MgdGFiLiBPbmNlIHRoZSBib3QgcmVhY2hlcyB0aGUgZW5kIG9mIHRoZSBsaXN0LCBpdCBzdGFydHMgb3ZlciBhdCB0aGUgdG9wLjwvc3Bhbj5cXHJcXG4gICAgPC9zZWN0aW9uPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJhTXNnc1xcXCIgY2xhc3M9XFxcImNvbHVtbnMgaXMtbXVsdGlsaW5lXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbiAgICBzdGFydDogKCkgPT4gYW5ub3VuY2VtZW50Q2hlY2soMCksXHJcbn07XHJcblxyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKHRleHQgPSAnJykge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjYVRlbXBsYXRlJywgJyNhTXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IHRleHR9XHJcbiAgICBdKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIGFubm91bmNlbWVudHMgPSBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcubScpKVxyXG4gICAgICAgIC5tYXAoZWwgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4ge21lc3NhZ2U6IGVsLnZhbHVlfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldCgnYW5ub3VuY2VtZW50QXJyJywgYW5ub3VuY2VtZW50cyk7XHJcbn1cclxuXHJcbi8vIEFubm91bmNlbWVudHMgY29sbGVjdGlvblxyXG52YXIgYW5ub3VuY2VtZW50cyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KCdhbm5vdW5jZW1lbnRBcnInLCBbXSk7XHJcblxyXG4vLyBTaG93IHNhdmVkIGFubm91bmNlbWVudHNcclxuYW5ub3VuY2VtZW50c1xyXG4gICAgLm1hcChhbm4gPT4gYW5uLm1lc3NhZ2UpXHJcbiAgICAuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcblxyXG4vLyBTZW5kcyBhbm5vdW5jZW1lbnRzIGFmdGVyIHRoZSBzcGVjaWZpZWQgZGVsYXkuXHJcbmZ1bmN0aW9uIGFubm91bmNlbWVudENoZWNrKGkpIHtcclxuICAgIGkgPSAoaSA+PSBhbm5vdW5jZW1lbnRzLmxlbmd0aCkgPyAwIDogaTtcclxuXHJcbiAgICB2YXIgYW5uID0gYW5ub3VuY2VtZW50c1tpXTtcclxuXHJcbiAgICBpZiAoYW5uICYmIGFubi5tZXNzYWdlKSB7XHJcbiAgICAgICAgc2VuZChhbm4ubWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgICBzZXRUaW1lb3V0KGFubm91bmNlbWVudENoZWNrLCBwcmVmZXJlbmNlcy5hbm5vdW5jZW1lbnREZWxheSAqIDYwMDAwLCBpICsgMSk7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBidWlsZEFuZFNlbmRNZXNzYWdlLFxyXG4gICAgYnVpbGRNZXNzYWdlLFxyXG59O1xyXG5cclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuY29uc3Qgc2VuZCA9IHJlcXVpcmUoJ2JvdCcpLnNlbmQ7XHJcblxyXG5mdW5jdGlvbiBidWlsZEFuZFNlbmRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpIHtcclxuICAgIHNlbmQoYnVpbGRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpIHtcclxuICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7KFtefV0rKX19L2csIGZ1bmN0aW9uKGZ1bGwsIGtleSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIE5BTUU6IG5hbWUsXHJcbiAgICAgICAgICAgIE5hbWU6IG5hbWVbMF0gKyBuYW1lLnN1YnN0cmluZygxKS50b0xvY2FsZUxvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICBuYW1lOiBuYW1lLnRvTG9jYWxlTG93ZXJDYXNlKClcclxuICAgICAgICB9W2tleV0gfHwgZnVsbDtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7aXB9fS9naSwgd29ybGQucGxheWVycy5nZXRJUChuYW1lKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1lc3NhZ2U7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjaGVja0pvaW5zQW5kR3JvdXAsXHJcbiAgICBjaGVja0pvaW5zLFxyXG4gICAgY2hlY2tHcm91cCxcclxufTtcclxuXHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykge1xyXG4gICAgcmV0dXJuIGNoZWNrSm9pbnMobmFtZSwgbXNnLmpvaW5zX2xvdywgbXNnLmpvaW5zX2hpZ2gpICYmIGNoZWNrR3JvdXAobmFtZSwgbXNnLmdyb3VwLCBtc2cubm90X2dyb3VwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2lucyhuYW1lLCBsb3csIGhpZ2gpIHtcclxuICAgIHJldHVybiB3b3JsZC5nZXRKb2lucyhuYW1lKSA+PSBsb3cgJiYgd29ybGQuZ2V0Sm9pbnMobmFtZSkgPD0gaGlnaDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tHcm91cChuYW1lLCBncm91cCwgbm90X2dyb3VwKSB7XHJcbiAgICByZXR1cm4gaXNJbkdyb3VwKG5hbWUsIGdyb3VwKSAmJiAhaXNJbkdyb3VwKG5hbWUsIG5vdF9ncm91cCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzSW5Hcm91cChuYW1lLCBncm91cCkge1xyXG4gICAgc3dpdGNoIChncm91cC50b0xvY2FsZUxvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgY2FzZSAnYWxsJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzUGxheWVyKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ2FkbWluJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzQWRtaW4obmFtZSk7XHJcbiAgICAgICAgY2FzZSAnbW9kJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzTW9kKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ3N0YWZmJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzU3RhZmYobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnb3duZXInOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNPd25lcihuYW1lKTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuIiwiT2JqZWN0LmFzc2lnbihcclxuICAgIG1vZHVsZS5leHBvcnRzLFxyXG4gICAgcmVxdWlyZSgnLi9idWlsZE1lc3NhZ2UnKSxcclxuICAgIHJlcXVpcmUoJy4vY2hlY2tKb2luc0FuZEdyb3VwJyksXHJcbiAgICByZXF1aXJlKCcuL3Nob3dTdW1tYXJ5JylcclxuKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzaG93U3VtbWFyeVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgYW5kIGRpc3BsYXkgYSBzdW1tYXJ5IG9mIHRoZSBvcHRpb25zIGNoYW5nZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Tm9kZX0gY29udGFpbmVyIHRoZSBtZXNzYWdlIGNvbnRhaW5lciB3aGljaCBuZWVkcyBhbiB1cGRhdGVkIHN1bW1hcnkuXHJcbiAqL1xyXG5mdW5jdGlvbiBzaG93U3VtbWFyeShjb250YWluZXIpIHtcclxuICAgIHZhciBvdXQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignLnN1bW1hcnknKTtcclxuXHJcbiAgICBpZiAoIW91dCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZ3JvdXAgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZTtcclxuICAgIHZhciBub3RfZ3JvdXAgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWU7XHJcbiAgICB2YXIgam9pbnNfbG93ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScpLnZhbHVlO1xyXG4gICAgdmFyIGpvaW5zX2hpZ2ggPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScpLnZhbHVlO1xyXG5cclxuICAgIHZhciBncm91cHNBbHRlcmVkID0gZ3JvdXAgIT0gJ2FsbCcgfHwgbm90X2dyb3VwICE9ICdub2JvZHknO1xyXG4gICAgdmFyIGpvaW5zQWx0ZXJlZCA9IGpvaW5zX2xvdyAhPSBcIjBcIiB8fCBqb2luc19oaWdoICE9IFwiOTk5OVwiO1xyXG5cclxuICAgIGlmIChncm91cHNBbHRlcmVkICYmIGpvaW5zQWx0ZXJlZCkge1xyXG4gICAgICAgIG91dC50ZXh0Q29udGVudCA9IGAke2dyb3VwfSAvIG5vdCAke25vdF9ncm91cH0gYW5kICR7am9pbnNfbG93fSDiiaQgam9pbnMg4omkICR7am9pbnNfaGlnaH1gO1xyXG4gICAgfSBlbHNlIGlmIChncm91cHNBbHRlcmVkKSB7XHJcbiAgICAgICAgb3V0LnRleHRDb250ZW50ID0gYCR7Z3JvdXB9IC8gbm90ICR7bm90X2dyb3VwfWA7XHJcbiAgICB9IGVsc2UgaWYgKGpvaW5zQWx0ZXJlZCkge1xyXG4gICAgICAgIG91dC50ZXh0Q29udGVudCA9IGAke2pvaW5zX2xvd30g4omkIGpvaW5zIOKJpCAke2pvaW5zX2hpZ2h9YDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgb3V0LnRleHRDb250ZW50ID0gJyc7XHJcbiAgICB9XHJcbn1cclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5cclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xyXG5cclxudmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuZWwuaW5uZXJIVE1MID0gXCIjbWJfam9pbj5oMywjbWJfbGVhdmU+aDMsI21iX3RyaWdnZXI+aDMsI21iX2Fubm91bmNlbWVudHM+aDN7bWFyZ2luOjAgMCA1cHggNmVtfSNtYl9qb2luPnNwYW4sI21iX2xlYXZlPnNwYW4sI21iX3RyaWdnZXI+c3BhbiwjbWJfYW5ub3VuY2VtZW50cz5zcGFue21hcmdpbi1sZWZ0OjZlbX0jbWJfam9pbiBpbnB1dFt0eXBlPVxcXCJudW1iZXJcXFwiXSwjbWJfbGVhdmUgaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl0sI21iX3RyaWdnZXIgaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl0sI21iX2Fubm91bmNlbWVudHMgaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl17d2lkdGg6NWVtfSNqTXNncywjbE1zZ3MsI3RNc2dzLCNhTXNnc3tib3JkZXItdG9wOjFweCBzb2xpZCAjMDAwfSNqTXNncyBzbWFsbCwjbE1zZ3Mgc21hbGwsI3RNc2dzIHNtYWxsLCNhTXNncyBzbWFsbHtjb2xvcjojNzc3fVxcblwiO1xyXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbnVpLmFkZFRhYkdyb3VwKCdNZXNzYWdlcycsICdtZXNzYWdlcycpO1xyXG5cclxuW1xyXG4gICAgcmVxdWlyZSgnLi9qb2luJyksXHJcbiAgICByZXF1aXJlKCcuL2xlYXZlJyksXHJcbiAgICByZXF1aXJlKCcuL3RyaWdnZXInKSxcclxuICAgIHJlcXVpcmUoJy4vYW5ub3VuY2VtZW50cycpXHJcbl0uZm9yRWFjaCgoe3RhYiwgc2F2ZSwgYWRkTWVzc2FnZSwgc3RhcnR9KSA9PiB7XHJcbiAgICB0YWIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBjaGVja0RlbGV0ZShldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC50YXJnZXQudGFnTmFtZSAhPSAnQScpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdWkuYWxlcnQoJ1JlYWxseSBkZWxldGUgdGhpcyBtZXNzYWdlPycsIFtcclxuICAgICAgICAgICAge3RleHQ6ICdZZXMnLCBzdHlsZTogJ2lzLWRhbmdlcicsIGFjdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWwgPSBldmVudC50YXJnZXQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoKGVsID0gZWwucGFyZW50RWxlbWVudCkgJiYgIWVsLmNsYXNzTGlzdC5jb250YWlucygnY29sdW1uJykpXHJcbiAgICAgICAgICAgICAgICAgICAgO1xyXG4gICAgICAgICAgICAgICAgZWwucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzYXZlKCk7XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7dGV4dDogJ0NhbmNlbCd9XHJcbiAgICAgICAgXSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0YWIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgc2F2ZSk7XHJcblxyXG4gICAgdGFiLnF1ZXJ5U2VsZWN0b3IoJy5idXR0b24uaXMtcHJpbWFyeScpXHJcbiAgICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gYWRkTWVzc2FnZSgpKTtcclxuXHJcbiAgICAvLyBEb24ndCBzdGFydCByZXNwb25kaW5nIHRvIGNoYXQgZm9yIDEwIHNlY29uZHNcclxuICAgIHNldFRpbWVvdXQoc3RhcnQsIDEwMDAwKTtcclxufSk7XHJcblxyXG5bXHJcbiAgICByZXF1aXJlKCcuL2pvaW4nKSxcclxuICAgIHJlcXVpcmUoJy4vbGVhdmUnKSxcclxuICAgIHJlcXVpcmUoJy4vdHJpZ2dlcicpXHJcbl0uZm9yRWFjaCgoe3RhYn0pID0+IHtcclxuICAgIHRhYi5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIHZhciBlbCA9IGV2ZW50LnRhcmdldDtcclxuICAgICAgICB3aGlsZSAoKGVsID0gZWwucGFyZW50RWxlbWVudCkgJiYgIWVsLmNsYXNzTGlzdC5jb250YWlucygnY29sdW1uJykpXHJcbiAgICAgICAgICAgIDtcclxuXHJcbiAgICAgICAgaGVscGVycy5zaG93U3VtbWFyeShlbCk7XHJcbiAgICB9KTtcclxufSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuXHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ2pvaW5BcnInO1xyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignSm9pbicsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8dGVtcGxhdGUgaWQ9XFxcImpUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNvbHVtbiBpcy00LWRlc2t0b3AgaXMtNi10YWJsZXRcXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYm94XFxcIj5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+IE1lc3NhZ2U6IDx0ZXh0YXJlYSBjbGFzcz1cXFwidGV4dGFyZWEgaXMtZmx1aWQgbVxcXCI+PC90ZXh0YXJlYT48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxkZXRhaWxzPjxzdW1tYXJ5Pk1vcmUgb3B0aW9ucyA8c21hbGwgY2xhc3M9XFxcInN1bW1hcnlcXFwiPjwvc21hbGw+PC9zdW1tYXJ5PlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzOiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJncm91cFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhbGxcXFwiPmFueW9uZTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwic3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJtb2RcXFwiPmEgbW9kPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzIG5vdDogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwibm90X2dyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm5vYm9keVxcXCI+bm9ib2R5PC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCIwXFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfbG93XFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHNwYW4+ICZsZTsgcGxheWVyIGpvaW5zICZsZTsgPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiOTk5OVxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2hpZ2hcXFwiPlxcclxcbiAgICAgICAgICAgIDwvZGV0YWlscz5cXHJcXG4gICAgICAgICAgICA8YT5EZWxldGU8L2E+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9qb2luXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgICAgIDxoMz5UaGVzZSBhcmUgY2hlY2tlZCB3aGVuIGEgcGxheWVyIGpvaW5zIHRoZSBzZXJ2ZXIuPC9oMz5cXHJcXG4gICAgICAgIDxzcGFuPllvdSBjYW4gdXNlIHt7TmFtZX19LCB7e05BTUV9fSwge3tuYW1lfX0sIGFuZCB7e2lwfX0gaW4geW91ciBtZXNzYWdlLjwvc3Bhbj5cXHJcXG4gICAgPC9zZWN0aW9uPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJqTXNnc1xcXCIgY2xhc3M9XFxcImNvbHVtbnMgaXMtbXVsdGlsaW5lXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbiAgICBzdGFydDogKCkgPT4gaG9vay5vbignd29ybGQuam9pbicsIG9uSm9pbiksXHJcbn07XHJcblxyXG52YXIgam9pbk1lc3NhZ2VzID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10pO1xyXG5qb2luTWVzc2FnZXMuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcbkFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJyNqTXNncyA+IGRpdicpKVxyXG4gICAgLmZvckVhY2goaGVscGVycy5zaG93U3VtbWFyeSk7XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gYWRkIGEgdHJpZ2dlciBtZXNzYWdlIHRvIHRoZSBwYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkTWVzc2FnZShtc2cgPSB7fSkge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjalRlbXBsYXRlJywgJyNqTXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICdvcHRpb24nLCByZW1vdmU6IFsnc2VsZWN0ZWQnXSwgbXVsdGlwbGU6IHRydWV9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy5tJywgdGV4dDogbXNnLm1lc3NhZ2UgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScsIHZhbHVlOiBtc2cuam9pbnNfbG93IHx8IDB9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2hpZ2ggfHwgOTk5OX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cuZ3JvdXAgfHwgJ2FsbCd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXSBbdmFsdWU9XCIke21zZy5ub3RfZ3JvdXAgfHwgJ25vYm9keSd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9XHJcbiAgICBdKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2F2ZSB0aGUgdXNlcidzIG1lc3NhZ2VzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIGpvaW5NZXNzYWdlcyA9IFtdO1xyXG4gICAgQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI2pNc2dzID4gZGl2JykpLmZvckVhY2goY29udGFpbmVyID0+IHtcclxuICAgICAgICBpZiAoIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGpvaW5NZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2xvdzogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfaGlnaDogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGdyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgbm90X2dyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBqb2luTWVzc2FnZXMpO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBsaXN0ZW4gdG8gcGxheWVyIGpvaW5zXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqL1xyXG5mdW5jdGlvbiBvbkpvaW4obmFtZSkge1xyXG4gICAgam9pbk1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAoaGVscGVycy5jaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuXHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ2xlYXZlQXJyJztcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0xlYXZlJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjx0ZW1wbGF0ZSBpZD1cXFwibFRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY29sdW1uIGlzLTQtZGVza3RvcCBpcy02LXRhYmxldFxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxsYWJlbD5NZXNzYWdlIDx0ZXh0YXJlYSBjbGFzcz1cXFwidGV4dGFyZWEgaXMtZmx1aWQgbVxcXCI+PC90ZXh0YXJlYT48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxkZXRhaWxzPjxzdW1tYXJ5Pk1vcmUgb3B0aW9ucyA8c21hbGwgY2xhc3M9XFxcInN1bW1hcnlcXFwiPjwvc21hbGw+PC9zdW1tYXJ5PlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzOiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJncm91cFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhbGxcXFwiPmFueW9uZTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwic3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJtb2RcXFwiPmEgbW9kPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzIG5vdDogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwibm90X2dyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm5vYm9keVxcXCI+bm9ib2R5PC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCIwXFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfbG93XFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHNwYW4+ICZsZTsgcGxheWVyIGpvaW5zICZsZTsgPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiOTk5OVxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2hpZ2hcXFwiPlxcclxcbiAgICAgICAgICAgIDwvZGV0YWlscz5cXHJcXG4gICAgICAgICAgICA8YT5EZWxldGU8L2E+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9sZWF2ZVxcXCIgY2xhc3M9XFxcImNvbnRhaW5lciBpcy1mbHVpZFxcXCI+XFxyXFxuICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJzZWN0aW9uIGlzLXNtYWxsXFxcIj5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJidXR0b24gaXMtcHJpbWFyeSBpcy1wdWxsZWQtcmlnaHRcXFwiPis8L3NwYW4+XFxyXFxuICAgICAgICA8aDM+VGhlc2UgYXJlIGNoZWNrZWQgd2hlbiBhIHBsYXllciBsZWF2ZXMgdGhlIHNlcnZlci48L2gzPlxcclxcbiAgICAgICAgPHNwYW4+WW91IGNhbiB1c2Uge3tOYW1lfX0sIHt7TkFNRX19LCB7e25hbWV9fSwgYW5kIHt7aXB9fSBpbiB5b3VyIG1lc3NhZ2UuPC9zcGFuPlxcclxcbiAgICA8L3NlY3Rpb24+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImxNc2dzXFxcIiBjbGFzcz1cXFwiY29sdW1ucyBpcy1tdWx0aWxpbmVcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxuICAgIHN0YXJ0OiAoKSA9PiBob29rLm9uKCd3b3JsZC5sZWF2ZScsIG9uTGVhdmUpLFxyXG59O1xyXG5cclxudmFyIGxlYXZlTWVzc2FnZXMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSk7XHJcbmxlYXZlTWVzc2FnZXMuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcbkFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJyNsTXNncyA+IGRpdicpKVxyXG4gICAgLmZvckVhY2goaGVscGVycy5zaG93U3VtbWFyeSk7XHJcblxyXG4vKipcclxuICogQWRkcyBhIGxlYXZlIG1lc3NhZ2UgdG8gdGhlIHBhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKG1zZyA9IHt9KSB7XHJcbiAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNsVGVtcGxhdGUnLCAnI2xNc2dzJywgW1xyXG4gICAgICAgIHtzZWxlY3RvcjogJ29wdGlvbicsIHJlbW92ZTogWydzZWxlY3RlZCddLCBtdWx0aXBsZTogdHJ1ZX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLm0nLCB0ZXh0OiBtc2cubWVzc2FnZSB8fCAnJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJywgdmFsdWU6IG1zZy5qb2luc19sb3cgfHwgMH0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScsIHZhbHVlOiBtc2cuam9pbnNfaGlnaCB8fCA5OTk5fSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJncm91cFwiXSBbdmFsdWU9XCIke21zZy5ncm91cCB8fCAnYWxsJ31cIl1gLCBzZWxlY3RlZDogJ3NlbGVjdGVkJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLm5vdF9ncm91cCB8fCAnbm9ib2R5J31cIl1gLCBzZWxlY3RlZDogJ3NlbGVjdGVkJ31cclxuICAgIF0pO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzYXZlIHRoZSBjdXJyZW50IGxlYXZlIG1lc3NhZ2VzXHJcbiAqL1xyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgbGVhdmVNZXNzYWdlcyA9IFtdO1xyXG4gICAgQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI2xNc2dzID4gZGl2JykpLmZvckVhY2goY29udGFpbmVyID0+IHtcclxuICAgICAgICBpZiAoIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxlYXZlTWVzc2FnZXMucHVzaCh7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19sb3c6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2hpZ2g6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImdyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIG5vdF9ncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgbGVhdmVNZXNzYWdlcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGxpc3RlbiB0byBwbGF5ZXIgZGlzY29ubmVjdGlvbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBwbGF5ZXIgbGVhdmluZy5cclxuICovXHJcbmZ1bmN0aW9uIG9uTGVhdmUobmFtZSkge1xyXG4gICAgbGVhdmVNZXNzYWdlcy5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgaWYgKGhlbHBlcnMuY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykpIHtcclxuICAgICAgICAgICAgaGVscGVycy5idWlsZEFuZFNlbmRNZXNzYWdlKG1zZy5tZXNzYWdlLCBuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcblxyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKCdtZXNzYWdlcy9oZWxwZXJzJyk7XHJcbmNvbnN0IHNldHRpbmdzID0gcmVxdWlyZSgnc2V0dGluZ3MvYm90Jyk7XHJcblxyXG5cclxuY29uc3QgU1RPUkFHRV9JRCA9ICd0cmlnZ2VyQXJyJztcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ1RyaWdnZXInLCAnbWVzc2FnZXMnKTtcclxudGFiLmlubmVySFRNTCA9IFwiPHRlbXBsYXRlIGlkPVxcXCJ0VGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb2x1bW4gaXMtNC1kZXNrdG9wIGlzLTYtdGFibGV0XFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPlRyaWdnZXI6IDxpbnB1dCBjbGFzcz1cXFwiaW5wdXQgdFxcXCI+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+TWVzc2FnZTogPHRleHRhcmVhIGNsYXNzPVxcXCJ0ZXh0YXJlYSBpcy1mbHVpZCBtXFxcIj48L3RleHRhcmVhPjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGRldGFpbHM+PHN1bW1hcnk+TW9yZSBvcHRpb25zIDxzbWFsbCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+PC9zbWFsbD48L3N1bW1hcnk+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXM6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcImdyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFsbFxcXCI+YW55b25lPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXMgbm90OiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJub3RfZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibm9ib2R5XFxcIj5ub2JvZHk8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcInN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJvd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjBcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19sb3dcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3Bhbj4gJmxlOyBwbGF5ZXIgam9pbnMgJmxlOyA8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCI5OTk5XFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfaGlnaFxcXCI+XFxyXFxuICAgICAgICAgICAgPC9kZXRhaWxzPlxcclxcbiAgICAgICAgICAgIDxhPkRlbGV0ZTwvYT5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX3RyaWdnZXJcXFwiIGNsYXNzPVxcXCJjb250YWluZXIgaXMtZmx1aWRcXFwiPlxcclxcbiAgICA8c2VjdGlvbiBjbGFzcz1cXFwic2VjdGlvbiBpcy1zbWFsbFxcXCI+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYnV0dG9uIGlzLXByaW1hcnkgaXMtcHVsbGVkLXJpZ2h0XFxcIj4rPC9zcGFuPlxcclxcbiAgICAgICAgPGgzPlRoZXNlIGFyZSBjaGVja2VkIHdoZW5ldmVyIHNvbWVvbmUgc2F5cyBzb21ldGhpbmcuPC9oMz5cXHJcXG4gICAgICAgIDxzcGFuPllvdSBjYW4gdXNlIHt7TmFtZX19LCB7e05BTUV9fSwge3tuYW1lfX0sIGFuZCB7e2lwfX0gaW4geW91ciBtZXNzYWdlLiBJZiB5b3UgcHV0IGFuIGFzdGVyaXNrICgqKSBpbiB5b3VyIHRyaWdnZXIsIGl0IHdpbGwgYmUgdHJlYXRlZCBhcyBhIHdpbGRjYXJkLiAoVHJpZ2dlciBcXFwidGUqc3RcXFwiIHdpbGwgbWF0Y2ggXFxcInRlYSBzdHVmZlxcXCIgYW5kIFxcXCJ0ZXN0XFxcIik8L3NwYW4+XFxyXFxuICAgIDwvc2VjdGlvbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwidE1zZ3NcXFwiIGNsYXNzPVxcXCJjb2x1bW5zIGlzLW11bHRpbGluZVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGhvb2sub24oJ3dvcmxkLm1lc3NhZ2UnLCBjaGVja1RyaWdnZXJzKSxcclxufTtcclxuXHJcbnZhciB0cmlnZ2VyTWVzc2FnZXMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSk7XHJcbnRyaWdnZXJNZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5BcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjdE1zZ3MgPiBkaXYnKSlcclxuICAgIC5mb3JFYWNoKGhlbHBlcnMuc2hvd1N1bW1hcnkpO1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYSB0cmlnZ2VyIG1lc3NhZ2UgdG8gdGhlIHBhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKG1zZyA9IHt9KSB7XHJcbiAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyN0VGVtcGxhdGUnLCAnI3RNc2dzJywgW1xyXG4gICAgICAgIHtzZWxlY3RvcjogJ29wdGlvbicsIHJlbW92ZTogWydzZWxlY3RlZCddLCBtdWx0aXBsZTogdHJ1ZX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLm0nLCB0ZXh0OiBtc2cubWVzc2FnZSB8fCAnJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLnQnLCB2YWx1ZTogbXNnLnRyaWdnZXIgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScsIHZhbHVlOiBtc2cuam9pbnNfbG93IHx8IDB9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2hpZ2ggfHwgOTk5OX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cuZ3JvdXAgfHwgJ2FsbCd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXSBbdmFsdWU9XCIke21zZy5ub3RfZ3JvdXAgfHwgJ25vYm9keSd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9XHJcbiAgICBdKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNhdmVzIHRoZSBjdXJyZW50IHRyaWdnZXIgbWVzc2FnZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgdHJpZ2dlck1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjdE1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUgfHwgIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcudCcpLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyaWdnZXJNZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIHRyaWdnZXI6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcudCcpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19sb3c6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2hpZ2g6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImdyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIG5vdF9ncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgdHJpZ2dlck1lc3NhZ2VzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBhIHRyaWdnZXIgYWdhaW5zdCBhIG1lc3NhZ2UgdG8gc2VlIGlmIGl0IG1hdGNoZXMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0cmlnZ2VyIHRoZSB0cmlnZ2VyIHRvIHRyeSB0byBtYXRjaFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxyXG4gKi9cclxuZnVuY3Rpb24gdHJpZ2dlck1hdGNoKHRyaWdnZXIsIG1lc3NhZ2UpIHtcclxuICAgIGlmIChzZXR0aW5ncy5yZWdleFRyaWdnZXJzKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAodHJpZ2dlciwgJ2knKS50ZXN0KG1lc3NhZ2UpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgdWkubm90aWZ5KGBTa2lwcGluZyB0cmlnZ2VyICcke3RyaWdnZXJ9JyBhcyB0aGUgUmVnRXggaXMgaW52YWlsZC5gKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgUmVnRXhwKFxyXG4gICAgICAgICAgICB0cmlnZ2VyXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvKFsuKz9ePSE6JHt9KCl8XFxbXFxdXFwvXFxcXF0pL2csIFwiXFxcXCQxXCIpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwqL2csIFwiLipcIiksXHJcbiAgICAgICAgICAgICdpJ1xyXG4gICAgICAgICkudGVzdChtZXNzYWdlKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgaW5jb21pbmcgcGxheWVyIG1lc3NhZ2VzIGZvciB0cmlnZ2Vyc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgcGxheWVyJ3MgbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tUcmlnZ2VycyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICB2YXIgdG90YWxBbGxvd2VkID0gc2V0dGluZ3MubWF4UmVzcG9uc2VzO1xyXG4gICAgdHJpZ2dlck1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAodG90YWxBbGxvd2VkICYmIGhlbHBlcnMuY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykgJiYgdHJpZ2dlck1hdGNoKG1zZy50cmlnZ2VyLCBtZXNzYWdlKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgICAgICB0b3RhbEFsbG93ZWQtLTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgU1RPUkFHRV9JRCA9ICdtYl9wcmVmZXJlbmNlcyc7XHJcblxyXG52YXIgcHJlZnMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCB7fSwgZmFsc2UpO1xyXG5cclxuLy8gU2V0IHRoZSBkZWZhdWx0IHNldHRpbmdzXHJcbltcclxuICAgIHt0eXBlOiAnbnVtYmVyJywga2V5OiAnYW5ub3VuY2VtZW50RGVsYXknLCBkZWZhdWx0OiAxMH0sXHJcbiAgICB7dHlwZTogJ251bWJlcicsIGtleTogJ21heFJlc3BvbnNlcycsIGRlZmF1bHQ6IDJ9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnbm90aWZ5JywgZGVmYXVsdDogdHJ1ZX0sXHJcbiAgICAvLyBBZHZhbmNlZFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnZGlzYWJsZVRyaW0nLCBkZWZhdWx0OiBmYWxzZX0sXHJcbiAgICB7dHlwZTogJ2Jvb2xlYW4nLCBrZXk6ICdyZWdleFRyaWdnZXJzJywgZGVmYXVsdDogZmFsc2V9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnc3BsaXRNZXNzYWdlcycsIGRlZmF1bHQ6IGZhbHNlfSxcclxuICAgIHt0eXBlOiAnc3RyaW5nJywga2V5OiAnc3BsaXRUb2tlbicsIGRlZmF1bHQ6ICc8c3BsaXQ+J30sXHJcbl0uZm9yRWFjaChwcmVmID0+IHtcclxuICAgIC8vIFNldCBkZWZhdWx0cyBpZiBub3Qgc2V0XHJcbiAgICBpZiAodHlwZW9mIHByZWZzW3ByZWYua2V5XSAhPSAgcHJlZi50eXBlKSB7XHJcbiAgICAgICAgcHJlZnNbcHJlZi5rZXldID0gcHJlZi5kZWZhdWx0O1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vIEF1dG8gc2F2ZSBvbiBjaGFuZ2VcclxuLy8gSUUgKGFsbCkgLyBTYWZhcmkgKDwgMTApIGRvZXNuJ3Qgc3VwcG9ydCBwcm94aWVzXHJcbmlmICh0eXBlb2YgUHJveHkgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcHJlZnM7XHJcbiAgICBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBwcmVmcywgZmFsc2UpO1xyXG4gICAgfSwgMzAgKiAxMDAwKTtcclxufSBlbHNlIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gbmV3IFByb3h5KHByZWZzLCB7XHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihvYmosIHByb3AsIHZhbCkge1xyXG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICBvYmpbcHJvcF0gPSB2YWw7XHJcbiAgICAgICAgICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBwcmVmcywgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3QgcHJlZnMgPSByZXF1aXJlKCdzZXR0aW5ncy9ib3QnKTtcclxuXHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdCb3QnLCAnc2V0dGluZ3MnKTtcclxudGFiLmlubmVySFRNTCA9IFwiPGRpdiBpZD1cXFwibWJfc2V0dGluZ3NcXFwiIGNsYXNzPVxcXCJjb250YWluZXJcXFwiPlxcclxcbiAgICA8aDMgY2xhc3M9XFxcInRpdGxlXFxcIj5HZW5lcmFsIFNldHRpbmdzPC9oMz5cXHJcXG4gICAgPGxhYmVsPk1pbnV0ZXMgYmV0d2VlbiBhbm5vdW5jZW1lbnRzPC9sYWJlbD5cXHJcXG4gICAgPHAgY2xhc3M9XFxcImNvbnRyb2xcXFwiPlxcclxcbiAgICAgICAgPGlucHV0IGNsYXNzPVxcXCJpbnB1dFxcXCIgZGF0YS1rZXk9XFxcImFubm91bmNlbWVudERlbGF5XFxcIiB0eXBlPVxcXCJudW1iZXJcXFwiPjxicj5cXHJcXG4gICAgPC9wPlxcclxcbiAgICA8bGFiZWw+TWF4aW11bSB0cmlnZ2VyIHJlc3BvbnNlcyB0byBhIG1lc3NhZ2U8L2xhYmVsPlxcclxcbiAgICA8cCBjbGFzcz1cXFwiY29udHJvbFxcXCI+XFxyXFxuICAgICAgICA8aW5wdXQgY2xhc3M9XFxcImlucHV0XFxcIiBkYXRhLWtleT1cXFwibWF4UmVzcG9uc2VzXFxcIiB0eXBlPVxcXCJudW1iZXJcXFwiPlxcclxcbiAgICA8L3A+XFxyXFxuICAgIDxwIGNsYXNzPVxcXCJjb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxsYWJlbCBjbGFzcz1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwibm90aWZ5XFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgTmV3IGNoYXQgbm90aWZpY2F0aW9uc1xcclxcbiAgICAgICAgPC9sYWJlbD5cXHJcXG4gICAgPC9wPlxcclxcblxcclxcbiAgICA8aHI+XFxyXFxuXFxyXFxuICAgIDxoMyBjbGFzcz1cXFwidGl0bGVcXFwiPkFkdmFuY2VkIFNldHRpbmdzPC9oMz5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwibWVzc2FnZSBpcy13YXJuaW5nXFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcIm1lc3NhZ2UtaGVhZGVyXFxcIj5cXHJcXG4gICAgICAgICAgICA8cD5XYXJuaW5nPC9wPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJtZXNzYWdlLWJvZHlcXFwiPlxcclxcbiAgICAgICAgICAgIDxwPkNoYW5naW5nIHRoZXNlIG9wdGlvbnMgY2FuIHJlc3VsdCBpbiB1bmV4cGVjdGVkIGJlaGF2aW9yLiA8YSBocmVmPVxcXCJodHRwczovL2dpdGh1Yi5jb20vQmlibGlvZmlsZS9CbG9ja2hlYWRzLU1lc3NhZ2VCb3Qvd2lraS8xLi1BZHZhbmNlZC1PcHRpb25zL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlJlYWQgdGhpcyBmaXJzdDwvYT48L3A+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICAgIDxwIGNsYXNzPVxcXCJjb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxsYWJlbCBjbGFzcz1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwicmVnZXhUcmlnZ2Vyc1xcXCIgdHlwZT1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIFBhcnNlIHRyaWdnZXJzIGFzIFJlZ0V4XFxyXFxuICAgICAgICA8L2xhYmVsPlxcclxcbiAgICA8L3A+XFxyXFxuICAgIDxwIGNsYXNzPVxcXCJjb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxsYWJlbCBjbGFzcz1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwiZGlzYWJsZVRyaW1cXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIj5cXHJcXG4gICAgICAgICAgICBEaXNhYmxlIHdoaXRlc3BhY2UgdHJpbW1pbmdcXHJcXG4gICAgICAgIDwvbGFiZWw+XFxyXFxuICAgIDwvcD5cXHJcXG4gICAgPHAgY2xhc3M9XFxcImNvbnRyb2xcXFwiPlxcclxcbiAgICAgICAgPGxhYmVsIGNsYXNzPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJzcGxpdE1lc3NhZ2VzXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgU3BsaXQgbWVzc2FnZXNcXHJcXG4gICAgICAgIDwvbGFiZWw+XFxyXFxuICAgIDwvcD5cXHJcXG4gICAgPGxhYmVsIGNsYXNzPVxcXCJsYWJlbFxcXCI+U3BsaXQgdG9rZW46PC9sYWJlbD5cXHJcXG4gICAgPHAgY2xhc3M9XFxcImNvbnRyb2xcXFwiPlxcclxcbiAgICAgICAgPGlucHV0IGNsYXNzPVxcXCJpbnB1dFxcXCIgZGF0YS1rZXk9XFxcInNwbGl0VG9rZW5cXFwiIHR5cGU9XFxcInRleHRcXFwiPlxcclxcbiAgICA8L3A+XFxyXFxuXFxyXFxuICAgIDxocj5cXHJcXG5cXHJcXG4gICAgPGgzIGNsYXNzPVxcXCJ0aXRsZVxcXCI+QmFja3VwIC8gUmVzdG9yZTwvaDM+XFxyXFxuICAgIDxhIGNsYXNzPVxcXCJidXR0b25cXFwiIGlkPVxcXCJtYl9iYWNrdXBfc2F2ZVxcXCI+R2V0IGJhY2t1cCBjb2RlPC9hPlxcclxcbiAgICA8YSBjbGFzcz1cXFwiYnV0dG9uXFxcIiBpZD1cXFwibWJfYmFja3VwX2xvYWRcXFwiPkltcG9ydCBiYWNrdXA8L2E+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG4vLyBTaG93IHByZWZzXHJcbk9iamVjdC5rZXlzKHByZWZzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICB2YXIgZWwgPSB0YWIucXVlcnlTZWxlY3RvcihgW2RhdGEta2V5PVwiJHtrZXl9XCJdYCk7XHJcbiAgICBzd2l0Y2ggKHR5cGVvZiBwcmVmc1trZXldKSB7XHJcbiAgICAgICAgY2FzZSAnYm9vbGVhbic6XHJcbiAgICAgICAgICAgIGVsLmNoZWNrZWQgPSBwcmVmc1trZXldO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBlbC52YWx1ZSA9IHByZWZzW2tleV07XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbi8vIFdhdGNoIGZvciBjaGFuZ2VzXHJcbnRhYi5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgdmFyIGdldFZhbHVlID0gKGtleSkgPT4gdGFiLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWtleT1cIiR7a2V5fVwiXWApLnZhbHVlO1xyXG4gICAgdmFyIGdldEludCA9IChrZXkpID0+ICtnZXRWYWx1ZShrZXkpO1xyXG4gICAgdmFyIGdldENoZWNrZWQgPSAoa2V5KSA9PiB0YWIucXVlcnlTZWxlY3RvcihgW2RhdGEta2V5PVwiJHtrZXl9XCJdYCkuY2hlY2tlZDtcclxuXHJcbiAgICBPYmplY3Qua2V5cyhwcmVmcykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIHZhciBmdW5jO1xyXG5cclxuICAgICAgICBzd2l0Y2godHlwZW9mIHByZWZzW2tleV0pIHtcclxuICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gZ2V0Q2hlY2tlZDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxyXG4gICAgICAgICAgICAgICAgZnVuYyA9IGdldEludDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgZnVuYyA9IGdldFZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJlZnNba2V5XSA9IGZ1bmMoa2V5KTtcclxuICAgIH0pO1xyXG59KTtcclxuXHJcblxyXG4vLyBHZXQgYmFja3VwXHJcbnRhYi5xdWVyeVNlbGVjdG9yKCcjbWJfYmFja3VwX3NhdmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIHNob3dCYWNrdXAoKSB7XHJcbiAgICB2YXIgYmFja3VwID0gSlNPTi5zdHJpbmdpZnkobG9jYWxTdG9yYWdlKS5yZXBsYWNlKC88L2csICcmbHQ7Jyk7XHJcbiAgICB1aS5hbGVydChgQ29weSB0aGlzIHRvIGEgc2FmZSBwbGFjZTo8YnI+PHRleHRhcmVhIGNsYXNzPVwidGV4dGFyZWFcIj4ke2JhY2t1cH08L3RleHRhcmVhPmApO1xyXG59KTtcclxuXHJcblxyXG4vLyBMb2FkIGJhY2t1cFxyXG50YWIucXVlcnlTZWxlY3RvcignI21iX2JhY2t1cF9sb2FkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBsb2FkQmFja3VwKCkge1xyXG4gICAgdWkuYWxlcnQoJ0VudGVyIHRoZSBiYWNrdXAgY29kZTo8dGV4dGFyZWEgY2xhc3M9XCJ0ZXh0YXJlYVwiPjwvdGV4dGFyZWE+JyxcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICB7IHRleHQ6ICdMb2FkICYgcmVmcmVzaCBwYWdlJywgc3R5bGU6ICdpcy1zdWNjZXNzJywgYWN0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQgdGV4dGFyZWEnKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUgPSBKU09OLnBhcnNlKGNvZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvZGUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYmFja3VwJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVpLm5vdGlmeSgnSW52YWxpZCBiYWNrdXAgY29kZS4gTm8gYWN0aW9uIHRha2VuLicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvZGUpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBjb2RlW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICB7IHRleHQ6ICdDYW5jZWwnIH1cclxuICAgICAgICAgICAgICAgIF0pO1xyXG59KTtcclxuIiwiY29uc3QgYmhmYW5zYXBpID0gcmVxdWlyZSgnbGlicmFyaWVzL2JoZmFuc2FwaScpO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBNZXNzYWdlQm90RXh0ZW5zaW9uID0gcmVxdWlyZSgnTWVzc2FnZUJvdEV4dGVuc2lvbicpO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0V4dGVuc2lvbnMnLCAnc2V0dGluZ3MnKTtcclxudGFiLmlubmVySFRNTCA9ICc8c3R5bGU+JyArXHJcbiAgICBcIkBrZXlmcmFtZXMgc3BpbkFyb3VuZHtmcm9te3RyYW5zZm9ybTpyb3RhdGUoMGRlZyl9dG97dHJhbnNmb3JtOnJvdGF0ZSgzNTlkZWcpfX0jZXh0c3tib3JkZXItdG9wOjFweCBzb2xpZCAjMDAwfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsjZXh0cyAuY2FyZC1jb250ZW50e2hlaWdodDoxMDVweH19XFxuXCIgK1xyXG4gICAgJzwvc3R5bGU+JyArXHJcbiAgICBcIjx0ZW1wbGF0ZSBpZD1cXFwiZXh0VGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb2x1bW4gaXMtb25lLXRoaXJkLWRlc2t0b3AgaXMtaGFsZi10YWJsZXRcXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiY2FyZFxcXCI+XFxyXFxuICAgICAgICAgICAgPGhlYWRlciBjbGFzcz1cXFwiY2FyZC1oZWFkZXJcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cXFwiY2FyZC1oZWFkZXItdGl0bGVcXFwiPjwvcD5cXHJcXG4gICAgICAgICAgICA8L2hlYWRlcj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjYXJkLWNvbnRlbnRcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiY29udGVudFxcXCI+PC9zcGFuPlxcclxcbiAgICAgICAgICAgIDwvZGl2PlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImNhcmQtZm9vdGVyXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPGEgY2xhc3M9XFxcImNhcmQtZm9vdGVyLWl0ZW1cXFwiPkluc3RhbGw8L2E+XFxyXFxuICAgICAgICAgICAgPC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9leHRlbnNpb25zXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+TG9hZCBCeSBJRC9VUkw8L3NwYW4+XFxyXFxuICAgICAgICA8aDM+RXh0ZW5zaW9ucyBjYW4gaW5jcmVhc2UgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIGJvdC48L2gzPlxcclxcbiAgICAgICAgPHNwYW4+SW50ZXJlc3RlZCBpbiBjcmVhdGluZyBvbmU/IDxhIGhyZWY9XFxcImh0dHBzOi8vZ2l0aHViLmNvbS9CaWJsaW9maWxlL0Jsb2NraGVhZHMtTWVzc2FnZUJvdC93aWtpLzIuLURldmVsb3BtZW50Oi1TdGFydC1IZXJlXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+U3RhcnQgaGVyZS48L2E+PC9zcGFuPlxcclxcbiAgICA8L3NlY3Rpb24+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImV4dHNcXFwiIGNsYXNzPVxcXCJjb2x1bW5zIGlzLW11bHRpbGluZVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdXNlZCB0byBhZGQgYSBjYXJkIGZvciBhbiBleHRlbnNpb24uXHJcbiAqXHJcbiAqIGV4dGVuc2lvbiBpcyBleHBlY3RlZCB0byBjb250YWluIGEgdGl0bGUsIHNuaXBwZXQsIGFuZCBpZFxyXG4gKi9cclxuZnVuY3Rpb24gYWRkRXh0ZW5zaW9uQ2FyZChleHRlbnNpb24pIHtcclxuICAgIGlmICghdGFiLnF1ZXJ5U2VsZWN0b3IoYCNtYl9leHRlbnNpb25zIFtkYXRhLWlkPVwiJHtleHRlbnNpb24uaWR9XCJdYCkpIHtcclxuICAgICAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNleHRUZW1wbGF0ZScsICcjZXh0cycsIFtcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnLmNhcmQtaGVhZGVyLXRpdGxlJywgdGV4dDogZXh0ZW5zaW9uLnRpdGxlfSxcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnLmNvbnRlbnQnLCBodG1sOiBleHRlbnNpb24uc25pcHBldH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnLmNhcmQtZm9vdGVyLWl0ZW0nLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogTWVzc2FnZUJvdEV4dGVuc2lvbi5pc0xvYWRlZChleHRlbnNpb24uaWQpID8gJ1JlbW92ZScgOiAnSW5zdGFsbCcsXHJcbiAgICAgICAgICAgICAgICAnZGF0YS1pZCc6IGV4dGVuc2lvbi5pZFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vQ3JlYXRlIHRoZSBleHRlbnNpb24gc3RvcmUgcGFnZVxyXG5iaGZhbnNhcGkuZ2V0U3RvcmUoKS50aGVuKHJlc3AgPT4ge1xyXG4gICAgaWYgKHJlc3Auc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXh0cycpLmlubmVySFRNTCArPSByZXNwLm1lc3NhZ2U7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3AubWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgICByZXNwLmV4dGVuc2lvbnMuZm9yRWFjaChhZGRFeHRlbnNpb25DYXJkKTtcclxufSkuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKTtcclxuXHJcbi8vIEluc3RhbGwgLyB1bmluc3RhbGwgZXh0ZW5zaW9uc1xyXG50YWIucXVlcnlTZWxlY3RvcignI2V4dHMnKVxyXG4gICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gZXh0QWN0aW9ucyhlKSB7XHJcbiAgICAgICAgdmFyIGVsID0gZS50YXJnZXQ7XHJcbiAgICAgICAgdmFyIGlkID0gZWwuZGF0YXNldC5pZDtcclxuXHJcbiAgICAgICAgaWYgKCFpZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZWwudGV4dENvbnRlbnQgPT0gJ0luc3RhbGwnKSB7XHJcbiAgICAgICAgICAgIE1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbChpZCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgTWVzc2FnZUJvdEV4dGVuc2lvbi51bmluc3RhbGwoaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxudGFiLnF1ZXJ5U2VsZWN0b3IoJy5idXR0b24nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGxvYWRFeHRlbnNpb24oKSB7XHJcbiAgICB1aS5hbGVydCgnRW50ZXIgdGhlIElEIG9yIFVSTCBvZiBhbiBleHRlbnNpb246PGJyPjxpbnB1dCBjbGFzcz1cImlucHV0XCIvPicsXHJcbiAgICAgICAgW1xyXG4gICAgICAgICAgICB7dGV4dDogJ0xvYWQnLCBzdHlsZTogJ2lzLXN1Y2Nlc3MnLCBhY3Rpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGV4dFJlZiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCBpbnB1dCcpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGV4dFJlZi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXh0UmVmLnN0YXJ0c1dpdGgoJ2h0dHAnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc3JjID0gZXh0UmVmO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBNZXNzYWdlQm90RXh0ZW5zaW9uLmluc3RhbGwoZXh0UmVmKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7dGV4dDogJ0NhbmNlbCd9XHJcbiAgICAgICAgXSk7XHJcbn0pO1xyXG5cclxuXHJcblxyXG5ob29rLm9uKCdleHRlbnNpb24uaW5zdGFsbCcsIGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAvLyBTaG93IHJlbW92ZSB0byBsZXQgdXNlcnMgcmVtb3ZlIGV4dGVuc2lvbnNcclxuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbWJfZXh0ZW5zaW9ucyBbZGF0YS1pZD1cIiR7aWR9XCJdYCk7XHJcbiAgICBpZiAoYnV0dG9uKSB7XHJcbiAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gJ1JlbW92ZSc7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGJoZmFuc2FwaS5nZXRFeHRlbnNpb25JbmZvKGlkKVxyXG4gICAgICAgICAgICAudGhlbihhZGRFeHRlbnNpb25DYXJkKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5ob29rLm9uKCdleHRlbnNpb24udW5pbnN0YWxsJywgZnVuY3Rpb24oaWQpIHtcclxuICAgIC8vIFNob3cgcmVtb3ZlZCBmb3Igc3RvcmUgaW5zdGFsbCBidXR0b25cclxuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbWJfZXh0ZW5zaW9ucyBbZGF0YS1pZD1cIiR7aWR9XCJdYCk7XHJcbiAgICBpZiAoYnV0dG9uKSB7XHJcbiAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gJ1JlbW92ZWQnO1xyXG4gICAgICAgIGJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICdJbnN0YWxsJztcclxuICAgICAgICAgICAgYnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgICAgfSwgMzAwMCk7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbnVpLmFkZFRhYkdyb3VwKCdTZXR0aW5ncycsICdzZXR0aW5ncycpO1xyXG5cclxucmVxdWlyZSgnLi9ib3QvcGFnZScpO1xyXG5yZXF1aXJlKCcuL2V4dGVuc2lvbnMnKTtcclxuIiwiLy8gT3ZlcndyaXRlIHRoZSBwb2xsQ2hhdCBmdW5jdGlvbiB0byBraWxsIHRoZSBkZWZhdWx0IGNoYXQgZnVuY3Rpb25cclxud2luZG93LnBvbGxDaGF0ID0gZnVuY3Rpb24oKSB7fTtcclxuXHJcbi8vIE92ZXJ3cml0ZSB0aGUgb2xkIHBhZ2VcclxuZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSAnJztcclxuLy8gU3R5bGUgcmVzZXRcclxuQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbdHlwZT1cInRleHQvY3NzXCJdJykpXHJcbiAgICAuZm9yRWFjaChlbCA9PiBlbC5yZW1vdmUoKSk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCd0aXRsZScpLnRleHRDb250ZW50ID0gJ0NvbnNvbGUgLSBNZXNzYWdlQm90JztcclxuXHJcbi8vIFNldCB0aGUgaWNvbiB0byB0aGUgYmxvY2toZWFkIGljb24gdXNlZCBvbiB0aGUgZm9ydW1zXHJcbnZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcclxuZWwucmVsID0gJ2ljb24nO1xyXG5lbC5ocmVmID0gJ2h0dHBzOi8vaXMuZ2QvTUJ2VUhGJztcclxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG5yZXF1aXJlKCdjb25zb2xlLWJyb3dzZXJpZnknKTtcclxucmVxdWlyZSgnYm90L21pZ3JhdGlvbicpO1xyXG5cclxuY29uc3QgYmhmYW5zYXBpID0gcmVxdWlyZSgnbGlicmFyaWVzL2JoZmFuc2FwaScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5ob29rLm9uKCdlcnJvcl9yZXBvcnQnLCBmdW5jdGlvbihtc2cpIHtcclxuICAgIHVpLm5vdGlmeShtc2cpO1xyXG59KTtcclxuXHJcbi8vIGp1c3QgcmVxdWlyZShjb25zb2xlKSBkb2Vzbid0IHdvcmsgYXMgY29uc29sZSBpcyBhIGJyb3dzZXJpZnkgbW9kdWxlLlxyXG5yZXF1aXJlKCcuL2NvbnNvbGUnKTtcclxuLy8gQnkgZGVmYXVsdCBubyB0YWIgaXMgc2VsZWN0ZWQsIHNob3cgdGhlIGNvbnNvbGUuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uYXYtc2xpZGVyLWNvbnRhaW5lciBzcGFuJykuY2xpY2soKTtcclxucmVxdWlyZSgnbWVzc2FnZXMnKTtcclxucmVxdWlyZSgnc2V0dGluZ3MnKTtcclxuXHJcbi8vIEVycm9yIHJlcG9ydGluZ1xyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoZXJyKSA9PiB7XHJcbiAgICBpZiAoIVsnU2NyaXB0IGVycm9yLicsICdXb3JsZCBub3QgcnVubmluZycsICdOZXR3b3JrIEVycm9yJ10uaW5jbHVkZXMoZXJyLm1lc3NhZ2UpKSB7XHJcbiAgICAgICAgYmhmYW5zYXBpLnJlcG9ydEVycm9yKGVycik7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gRXhwb3NlIHRoZSBleHRlbnNpb24gQVBJXHJcbndpbmRvdy5NZXNzYWdlQm90RXh0ZW5zaW9uID0gcmVxdWlyZSgnTWVzc2FnZUJvdEV4dGVuc2lvbicpO1xyXG4iLCJyZXF1aXJlKCcuL3BvbHlmaWxscy9kZXRhaWxzJyk7XHJcblxyXG4vLyBCdWlsZCB0aGUgQVBJXHJcbk9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vbGF5b3V0JyksXHJcbiAgICByZXF1aXJlKCcuL3RlbXBsYXRlJyksXHJcbiAgICByZXF1aXJlKCcuL25vdGlmaWNhdGlvbnMnKVxyXG4pO1xyXG5cclxuLy8gRnVuY3Rpb25zIHdoaWNoIGFyZSBubyBsb25nZXIgY29udGFpbmVkIGluIHRoaXMgbW9kdWxlLCBidXQgYXJlIHJldGFpbmVkIGZvciBub3cgZm9yIGJhY2t3YXJkIGNvbXBhdGFiaWxpdHkuXHJcbmNvbnN0IHdyaXRlID0gcmVxdWlyZSgnLi4vY29uc29sZS9leHBvcnRzJykud3JpdGU7XHJcbm1vZHVsZS5leHBvcnRzLmFkZE1lc3NhZ2VUb0NvbnNvbGUgPSBmdW5jdGlvbihtc2csIG5hbWUgPSAnJywgbmFtZUNsYXNzID0gJycpIHtcclxuICAgIGNvbnNvbGUud2FybigndWkuYWRkTWVzc2FnZVRvQ29uc29sZSBoYXMgYmVlbiBkZXByaWNhdGVkLiBVc2UgZXguY29uc29sZS53cml0ZSBpbnN0ZWFkLicpO1xyXG4gICAgd3JpdGUobXNnLCBuYW1lLCBuYW1lQ2xhc3MpO1xyXG59O1xyXG4iLCIvKipcclxuICogQGZpbGUgQ29udGFpbnMgZnVuY3Rpb25zIGZvciBtYW5hZ2luZyB0aGUgcGFnZSBsYXlvdXRcclxuICovXHJcblxyXG5cclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcblxyXG4vLyBCdWlsZCBwYWdlIC0gb25seSBjYXNlIGluIHdoaWNoIGJvZHkuaW5uZXJIVE1MIHNob3VsZCBiZSB1c2VkLlxyXG5kb2N1bWVudC5ib2R5LmlubmVySFRNTCArPSBcIjxoZWFkZXIgY2xhc3M9XFxcImhlYWRlciBpcy1maXhlZC10b3BcXFwiPlxcclxcbiAgPG5hdiBjbGFzcz1cXFwibmF2LWludmVyc2UgbmF2IGhhcy1zaGFkb3dcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJuYXYtbGVmdFxcXCI+XFxyXFxuICAgICAgPGRpdiBjbGFzcz1cXFwibmF2LWl0ZW0gbmF2LXNsaWRlci10b2dnbGVcXFwiPlxcclxcbiAgICAgICAgPGltZyBzcmM9XFxcImh0dHBzOi8vaS5pbWdzYWZlLm9yZy84MGExMTI5YTM2LnBuZ1xcXCI+XFxyXFxuICAgICAgPC9kaXY+XFxyXFxuICAgICAgPGEgY2xhc3M9XFxcIm5hdi1pdGVtIGlzLXRhYiBuYXYtc2xpZGVyLXRvZ2dsZVxcXCI+XFxyXFxuICAgICAgICBNZW51XFxyXFxuICAgICAgPC9hPlxcclxcbiAgICA8L2Rpdj5cXHJcXG4gIDwvbmF2PlxcclxcbjwvaGVhZGVyPlxcclxcblxcclxcbjxkaXYgY2xhc3M9XFxcIm5hdi1zbGlkZXItY29udGFpbmVyXFxcIj5cXHJcXG4gICAgPG5hdiBjbGFzcz1cXFwibmF2LXNsaWRlclxcXCIgZGF0YS10YWItZ3JvdXA9XFxcIm1haW5cXFwiPjwvbmF2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJpcy1vdmVybGF5XFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG48ZGl2IGlkPVxcXCJjb250YWluZXJcXFwiIGNsYXNzPVxcXCJoYXMtZml4ZWQtbmF2XFxcIj48L2Rpdj5cXHJcXG5cIjtcclxuZG9jdW1lbnQuaGVhZC5pbm5lckhUTUwgKz0gJzxzdHlsZT4nICtcclxuICAgIFwiaHRtbHtvdmVyZmxvdy15OmF1dG8gIWltcG9ydGFudH0vKiEgYnVsbWEuaW8gdjAuMy4xIHwgTUlUIExpY2Vuc2UgfCBnaXRodWIuY29tL2pndGhtcy9idWxtYSAqL0BrZXlmcmFtZXMgc3BpbkFyb3VuZHtmcm9te3RyYW5zZm9ybTpyb3RhdGUoMGRlZyl9dG97dHJhbnNmb3JtOnJvdGF0ZSgzNTlkZWcpfX0vKiEgbWluaXJlc2V0LmNzcyB2MC4wLjIgfCBNSVQgTGljZW5zZSB8IGdpdGh1Yi5jb20vamd0aG1zL21pbmlyZXNldC5jc3MgKi9odG1sLGJvZHkscCxvbCx1bCxsaSxkbCxkdCxkZCxibG9ja3F1b3RlLGZpZ3VyZSxmaWVsZHNldCxsZWdlbmQsdGV4dGFyZWEscHJlLGlmcmFtZSxocixoMSxoMixoMyxoNCxoNSxoNnttYXJnaW46MDtwYWRkaW5nOjB9aDEsaDIsaDMsaDQsaDUsaDZ7Zm9udC1zaXplOjEwMCU7Zm9udC13ZWlnaHQ6bm9ybWFsfXVse2xpc3Qtc3R5bGU6bm9uZX1idXR0b24saW5wdXQsc2VsZWN0LHRleHRhcmVhe21hcmdpbjowfWh0bWx7Ym94LXNpemluZzpib3JkZXItYm94fSp7Ym94LXNpemluZzppbmhlcml0fSo6YmVmb3JlLCo6YWZ0ZXJ7Ym94LXNpemluZzppbmhlcml0fWltZyxlbWJlZCxvYmplY3QsYXVkaW8sdmlkZW97aGVpZ2h0OmF1dG87bWF4LXdpZHRoOjEwMCV9aWZyYW1le2JvcmRlcjowfXRhYmxle2JvcmRlci1jb2xsYXBzZTpjb2xsYXBzZTtib3JkZXItc3BhY2luZzowfXRkLHRoe3BhZGRpbmc6MDt0ZXh0LWFsaWduOmxlZnR9aHRtbHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Zm9udC1zaXplOjE0cHg7LW1vei1vc3gtZm9udC1zbW9vdGhpbmc6Z3JheXNjYWxlOy13ZWJraXQtZm9udC1zbW9vdGhpbmc6YW50aWFsaWFzZWQ7bWluLXdpZHRoOjMwMHB4O292ZXJmbG93LXg6aGlkZGVuO292ZXJmbG93LXk6c2Nyb2xsO3RleHQtcmVuZGVyaW5nOm9wdGltaXplTGVnaWJpbGl0eX1hcnRpY2xlLGFzaWRlLGZpZ3VyZSxmb290ZXIsaGVhZGVyLGhncm91cCxzZWN0aW9ue2Rpc3BsYXk6YmxvY2t9Ym9keSxidXR0b24saW5wdXQsc2VsZWN0LHRleHRhcmVhe2ZvbnQtZmFtaWx5Oi1hcHBsZS1zeXN0ZW0sQmxpbmtNYWNTeXN0ZW1Gb250LFxcXCJTZWdvZSBVSVxcXCIsXFxcIlJvYm90b1xcXCIsXFxcIk94eWdlblxcXCIsXFxcIlVidW50dVxcXCIsXFxcIkNhbnRhcmVsbFxcXCIsXFxcIkZpcmEgU2Fuc1xcXCIsXFxcIkRyb2lkIFNhbnNcXFwiLFxcXCJIZWx2ZXRpY2EgTmV1ZVxcXCIsXFxcIkhlbHZldGljYVxcXCIsXFxcIkFyaWFsXFxcIixzYW5zLXNlcmlmfWNvZGUscHJley1tb3otb3N4LWZvbnQtc21vb3RoaW5nOmF1dG87LXdlYmtpdC1mb250LXNtb290aGluZzphdXRvO2ZvbnQtZmFtaWx5OlxcXCJJbmNvbnNvbGF0YVxcXCIsXFxcIkNvbnNvbGFzXFxcIixcXFwiTW9uYWNvXFxcIixtb25vc3BhY2V9Ym9keXtjb2xvcjojNGE0YTRhO2ZvbnQtc2l6ZToxcmVtO2ZvbnQtd2VpZ2h0OjQwMDtsaW5lLWhlaWdodDoxLjV9YXtjb2xvcjojMTgyYjczO2N1cnNvcjpwb2ludGVyO3RleHQtZGVjb3JhdGlvbjpub25lO3RyYW5zaXRpb246bm9uZSA4Nm1zIGVhc2Utb3V0fWE6aG92ZXJ7Y29sb3I6IzM2MzYzNn1jb2Rle2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjpyZWQ7Zm9udC1zaXplOjAuOGVtO2ZvbnQtd2VpZ2h0Om5vcm1hbDtwYWRkaW5nOjAuMjVlbSAwLjVlbSAwLjI1ZW19aHJ7YmFja2dyb3VuZC1jb2xvcjojZGJkYmRiO2JvcmRlcjpub25lO2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjFweDttYXJnaW46MS41cmVtIDB9aW1ne21heC13aWR0aDoxMDAlfWlucHV0W3R5cGU9XFxcImNoZWNrYm94XFxcIl0saW5wdXRbdHlwZT1cXFwicmFkaW9cXFwiXXt2ZXJ0aWNhbC1hbGlnbjpiYXNlbGluZX1zbWFsbHtmb250LXNpemU6MC44ZW19c3Bhbntmb250LXN0eWxlOmluaGVyaXQ7Zm9udC13ZWlnaHQ6aW5oZXJpdH1zdHJvbmd7Y29sb3I6IzM2MzYzNjtmb250LXdlaWdodDo3MDB9cHJle2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojNGE0YTRhO2ZvbnQtc2l6ZTowLjhlbTt3aGl0ZS1zcGFjZTpwcmU7d29yZC13cmFwOm5vcm1hbH1wcmUgY29kZXtiYWNrZ3JvdW5kOm5vbmU7Y29sb3I6aW5oZXJpdDtkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZToxZW07b3ZlcmZsb3cteDphdXRvO3BhZGRpbmc6MS4yNXJlbSAxLjVyZW19dGFibGV7d2lkdGg6MTAwJX10YWJsZSB0ZCx0YWJsZSB0aHt0ZXh0LWFsaWduOmxlZnQ7dmVydGljYWwtYWxpZ246dG9wfXRhYmxlIHRoe2NvbG9yOiMzNjM2MzZ9LmlzLWJsb2Nre2Rpc3BsYXk6YmxvY2t9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1ibG9jay1tb2JpbGV7ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmlzLWJsb2NrLXRhYmxldHtkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1ibG9jay10YWJsZXQtb25seXtkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtYmxvY2stdG91Y2h7ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5pcy1ibG9jay1kZXNrdG9we2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KSBhbmQgKG1heC13aWR0aDogMTE5MXB4KXsuaXMtYmxvY2stZGVza3RvcC1vbmx5e2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtYmxvY2std2lkZXNjcmVlbntkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnR9fS5pcy1mbGV4e2Rpc3BsYXk6ZmxleH1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmlzLWZsZXgtbW9iaWxle2Rpc3BsYXk6ZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmlzLWZsZXgtdGFibGV0e2Rpc3BsYXk6ZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtZmxleC10YWJsZXQtb25seXtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1mbGV4LXRvdWNoe2Rpc3BsYXk6ZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5pcy1mbGV4LWRlc2t0b3B7ZGlzcGxheTpmbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCkgYW5kIChtYXgtd2lkdGg6IDExOTFweCl7LmlzLWZsZXgtZGVza3RvcC1vbmx5e2Rpc3BsYXk6ZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMTkycHgpey5pcy1mbGV4LXdpZGVzY3JlZW57ZGlzcGxheTpmbGV4ICFpbXBvcnRhbnR9fS5pcy1pbmxpbmV7ZGlzcGxheTppbmxpbmV9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1pbmxpbmUtbW9iaWxle2Rpc3BsYXk6aW5saW5lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaXMtaW5saW5lLXRhYmxldHtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaW5saW5lLXRhYmxldC1vbmx5e2Rpc3BsYXk6aW5saW5lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaW5saW5lLXRvdWNoe2Rpc3BsYXk6aW5saW5lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmlzLWlubGluZS1kZXNrdG9we2Rpc3BsYXk6aW5saW5lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCkgYW5kIChtYXgtd2lkdGg6IDExOTFweCl7LmlzLWlubGluZS1kZXNrdG9wLW9ubHl7ZGlzcGxheTppbmxpbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtaW5saW5lLXdpZGVzY3JlZW57ZGlzcGxheTppbmxpbmUgIWltcG9ydGFudH19LmlzLWlubGluZS1ibG9ja3tkaXNwbGF5OmlubGluZS1ibG9ja31AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmlzLWlubGluZS1ibG9jay1tb2JpbGV7ZGlzcGxheTppbmxpbmUtYmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5pcy1pbmxpbmUtYmxvY2stdGFibGV0e2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1pbmxpbmUtYmxvY2stdGFibGV0LW9ubHl7ZGlzcGxheTppbmxpbmUtYmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1pbmxpbmUtYmxvY2stdG91Y2h7ZGlzcGxheTppbmxpbmUtYmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuaXMtaW5saW5lLWJsb2NrLWRlc2t0b3B7ZGlzcGxheTppbmxpbmUtYmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KSBhbmQgKG1heC13aWR0aDogMTE5MXB4KXsuaXMtaW5saW5lLWJsb2NrLWRlc2t0b3Atb25seXtkaXNwbGF5OmlubGluZS1ibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMTkycHgpey5pcy1pbmxpbmUtYmxvY2std2lkZXNjcmVlbntkaXNwbGF5OmlubGluZS1ibG9jayAhaW1wb3J0YW50fX0uaXMtaW5saW5lLWZsZXh7ZGlzcGxheTppbmxpbmUtZmxleH1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmlzLWlubGluZS1mbGV4LW1vYmlsZXtkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaXMtaW5saW5lLWZsZXgtdGFibGV0e2Rpc3BsYXk6aW5saW5lLWZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWlubGluZS1mbGV4LXRhYmxldC1vbmx5e2Rpc3BsYXk6aW5saW5lLWZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1pbmxpbmUtZmxleC10b3VjaHtkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmlzLWlubGluZS1mbGV4LWRlc2t0b3B7ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpIGFuZCAobWF4LXdpZHRoOiAxMTkxcHgpey5pcy1pbmxpbmUtZmxleC1kZXNrdG9wLW9ubHl7ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMTkycHgpey5pcy1pbmxpbmUtZmxleC13aWRlc2NyZWVue2Rpc3BsYXk6aW5saW5lLWZsZXggIWltcG9ydGFudH19LmlzLWNsZWFyZml4OmFmdGVye2NsZWFyOmJvdGg7Y29udGVudDpcXFwiIFxcXCI7ZGlzcGxheTp0YWJsZX0uaXMtcHVsbGVkLWxlZnR7ZmxvYXQ6bGVmdH0uaXMtcHVsbGVkLXJpZ2h0e2Zsb2F0OnJpZ2h0fS5pcy1jbGlwcGVke292ZXJmbG93OmhpZGRlbiAhaW1wb3J0YW50fS5pcy1vdmVybGF5e2JvdHRvbTowO2xlZnQ6MDtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO3RvcDowfS5oYXMtdGV4dC1jZW50ZXJlZHt0ZXh0LWFsaWduOmNlbnRlcn0uaGFzLXRleHQtbGVmdHt0ZXh0LWFsaWduOmxlZnR9Lmhhcy10ZXh0LXJpZ2h0e3RleHQtYWxpZ246cmlnaHR9LmlzLWhpZGRlbntkaXNwbGF5Om5vbmUgIWltcG9ydGFudH1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmlzLWhpZGRlbi1tb2JpbGV7ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaXMtaGlkZGVuLXRhYmxldHtkaXNwbGF5Om5vbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWhpZGRlbi10YWJsZXQtb25seXtkaXNwbGF5Om5vbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1oaWRkZW4tdG91Y2h7ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmlzLWhpZGRlbi1kZXNrdG9we2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpIGFuZCAobWF4LXdpZHRoOiAxMTkxcHgpey5pcy1oaWRkZW4tZGVza3RvcC1vbmx5e2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMTkycHgpey5pcy1oaWRkZW4td2lkZXNjcmVlbntkaXNwbGF5Om5vbmUgIWltcG9ydGFudH19LmlzLWRpc2FibGVke3BvaW50ZXItZXZlbnRzOm5vbmV9LmlzLW1hcmdpbmxlc3N7bWFyZ2luOjAgIWltcG9ydGFudH0uaXMtcGFkZGluZ2xlc3N7cGFkZGluZzowICFpbXBvcnRhbnR9LmlzLXVuc2VsZWN0YWJsZXstd2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lOy1tcy11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmV9LmJveHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLXJhZGl1czo1cHg7Ym94LXNoYWRvdzowIDJweCAzcHggcmdiYSgxMCwxMCwxMCwwLjEpLDAgMCAwIDFweCByZ2JhKDEwLDEwLDEwLDAuMSk7ZGlzcGxheTpibG9jaztwYWRkaW5nOjEuMjVyZW19LmJveDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfWEuYm94OmhvdmVyLGEuYm94OmZvY3Vze2JveC1zaGFkb3c6MCAycHggM3B4IHJnYmEoMTAsMTAsMTAsMC4xKSwwIDAgMCAxcHggIzE4MmI3M31hLmJveDphY3RpdmV7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpLDAgMCAwIDFweCAjMTgyYjczfS5idXR0b257LW1vei1hcHBlYXJhbmNlOm5vbmU7LXdlYmtpdC1hcHBlYXJhbmNlOm5vbmU7YWxpZ24taXRlbXM6Y2VudGVyO2JvcmRlcjpub25lO2JvcmRlci1yYWRpdXM6M3B4O2JveC1zaGFkb3c6bm9uZTtkaXNwbGF5OmlubGluZS1mbGV4O2ZvbnQtc2l6ZToxcmVtO2hlaWdodDoyLjI4NWVtO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O2xpbmUtaGVpZ2h0OjEuNTtwYWRkaW5nLWxlZnQ6MC43NWVtO3BhZGRpbmctcmlnaHQ6MC43NWVtO3Bvc2l0aW9uOnJlbGF0aXZlO3ZlcnRpY2FsLWFsaWduOnRvcDstd2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lOy1tcy11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmU7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtjb2xvcjojMzYzNjM2O2N1cnNvcjpwb2ludGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbTt0ZXh0LWFsaWduOmNlbnRlcjt3aGl0ZS1zcGFjZTpub3dyYXB9LmJ1dHRvbjpmb2N1cywuYnV0dG9uLmlzLWZvY3VzZWQsLmJ1dHRvbjphY3RpdmUsLmJ1dHRvbi5pcy1hY3RpdmV7b3V0bGluZTpub25lfS5idXR0b25bZGlzYWJsZWRdLC5idXR0b24uaXMtZGlzYWJsZWR7cG9pbnRlci1ldmVudHM6bm9uZX0uYnV0dG9uIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5idXR0b24gLmljb246Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjI1cmVtO21hcmdpbi1yaWdodDouNXJlbX0uYnV0dG9uIC5pY29uOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LjVyZW07bWFyZ2luLXJpZ2h0Oi0uMjVyZW19LmJ1dHRvbiAuaWNvbjpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjI1cmVtKX0uYnV0dG9uIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6MHJlbX0uYnV0dG9uIC5pY29uLmlzLXNtYWxsOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0OjByZW19LmJ1dHRvbiAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIDByZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAwcmVtKX0uYnV0dG9uIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uNXJlbX0uYnV0dG9uIC5pY29uLmlzLW1lZGl1bTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotLjVyZW19LmJ1dHRvbiAuaWNvbi5pcy1tZWRpdW06Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjVyZW0pfS5idXR0b24gLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotMXJlbX0uYnV0dG9uIC5pY29uLmlzLWxhcmdlOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0xcmVtfS5idXR0b24gLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtMXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0xcmVtKX0uYnV0dG9uOmhvdmVyLC5idXR0b24uaXMtaG92ZXJlZHtib3JkZXItY29sb3I6I2I1YjViNTtjb2xvcjojMzYzNjM2fS5idXR0b246Zm9jdXMsLmJ1dHRvbi5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjojMTgyYjczO2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMjQsNDMsMTE1LDAuMjUpO2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbjphY3RpdmUsLmJ1dHRvbi5pcy1hY3RpdmV7Ym9yZGVyLWNvbG9yOiM0YTRhNGE7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1saW5re2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiM0YTRhNGE7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZX0uYnV0dG9uLmlzLWxpbms6aG92ZXIsLmJ1dHRvbi5pcy1saW5rLmlzLWhvdmVyZWQsLmJ1dHRvbi5pcy1saW5rOmZvY3VzLC5idXR0b24uaXMtbGluay5pcy1mb2N1c2VkLC5idXR0b24uaXMtbGluazphY3RpdmUsLmJ1dHRvbi5pcy1saW5rLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLXdoaXRle2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLXdoaXRlOmhvdmVyLC5idXR0b24uaXMtd2hpdGUuaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmOWY5Zjk7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy13aGl0ZTpmb2N1cywuYnV0dG9uLmlzLXdoaXRlLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMjU1LDI1NSwyNTUsMC4yNSk7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLXdoaXRlOmFjdGl2ZSwuYnV0dG9uLmlzLXdoaXRlLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjI7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiMwMDB9LmJ1dHRvbi5pcy13aGl0ZS5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjMGEwYTBhICMwYTBhMGEgIWltcG9ydGFudH0uYnV0dG9uLmlzLXdoaXRlLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXdoaXRlLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtd2hpdGUuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMGEwYTBhO2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXdoaXRlLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5idXR0b24uaXMtYmxhY2t7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtYmxhY2s6aG92ZXIsLmJ1dHRvbi5pcy1ibGFjay5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6IzA0MDQwNDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNrOmZvY3VzLC5idXR0b24uaXMtYmxhY2suaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgxMCwxMCwxMCwwLjI1KTtjb2xvcjojZmZmfS5idXR0b24uaXMtYmxhY2s6YWN0aXZlLC5idXR0b24uaXMtYmxhY2suaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6IzAwMDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2YyZjJmMn0uYnV0dG9uLmlzLWJsYWNrLmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50fS5idXR0b24uaXMtYmxhY2suaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6IzBhMGEwYTtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtYmxhY2suaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1ibGFjay5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Ym9yZGVyLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy1saWdodHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1saWdodDpob3ZlciwuYnV0dG9uLmlzLWxpZ2h0LmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojZWVlO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlnaHQ6Zm9jdXMsLmJ1dHRvbi5pcy1saWdodC5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDI0NSwyNDUsMjQ1LDAuMjUpO2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1saWdodDphY3RpdmUsLmJ1dHRvbi5pcy1saWdodC5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojZThlOGU4O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojMjkyOTI5fS5idXR0b24uaXMtbGlnaHQuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgIzM2MzYzNiAjMzYzNjM2ICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy1saWdodC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZjVmNWY1O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1saWdodC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWxpZ2h0LmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6IzM2MzYzNjtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcmt7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFyazpob3ZlciwuYnV0dG9uLmlzLWRhcmsuaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiMyZjJmMmY7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1kYXJrOmZvY3VzLC5idXR0b24uaXMtZGFyay5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDU0LDU0LDU0LDAuMjUpO2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1kYXJrOmFjdGl2ZSwuYnV0dG9uLmlzLWRhcmsuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6IzI5MjkyOTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNlOGU4ZTh9LmJ1dHRvbi5pcy1kYXJrLmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmNWY1ZjUgI2Y1ZjVmNSAhaW1wb3J0YW50fS5idXR0b24uaXMtZGFyay5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMzYzNjM2O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1kYXJrLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtZGFyay5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Ym9yZGVyLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2Y1ZjVmNTtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1wcmltYXJ5e2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXByaW1hcnk6aG92ZXIsLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojMTYyNzY4O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtcHJpbWFyeTpmb2N1cywuYnV0dG9uLmlzLXByaW1hcnkuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgyNCw0MywxMTUsMC4yNSk7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXByaW1hcnk6YWN0aXZlLC5idXR0b24uaXMtcHJpbWFyeS5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojMTQyMzVlO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMxODJiNzN9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2YyZjJmMn0uYnV0dG9uLmlzLXByaW1hcnkuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZiAjZmZmICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMxODJiNzM7Y29sb3I6IzE4MmI3M30uYnV0dG9uLmlzLXByaW1hcnkuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztib3JkZXItY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmfS5idXR0b24uaXMtcHJpbWFyeS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtcHJpbWFyeS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzE4MmI3M30uYnV0dG9uLmlzLWluZm97YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtaW5mbzpob3ZlciwuYnV0dG9uLmlzLWluZm8uaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiMyNzZjZGE7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1pbmZvOmZvY3VzLC5idXR0b24uaXMtaW5mby5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDUwLDExNSwyMjAsMC4yNSk7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWluZm86YWN0aXZlLC5idXR0b24uaXMtaW5mby5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojMjM2NmQxO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMzMjczZGN9LmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2YyZjJmMn0uYnV0dG9uLmlzLWluZm8uaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZiAjZmZmICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy1pbmZvLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMzMjczZGM7Y29sb3I6IzMyNzNkY30uYnV0dG9uLmlzLWluZm8uaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1pbmZvLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztib3JkZXItY29sb3I6IzMyNzNkYztjb2xvcjojZmZmfS5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzMyNzNkY30uYnV0dG9uLmlzLXN1Y2Nlc3N7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtc3VjY2Vzczpob3ZlciwuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiMyMmM2NWI7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1zdWNjZXNzOmZvY3VzLC5idXR0b24uaXMtc3VjY2Vzcy5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDM1LDIwOSw5NiwwLjI1KTtjb2xvcjojZmZmfS5idXR0b24uaXMtc3VjY2VzczphY3RpdmUsLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMyMGJjNTY7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojZmZmfS5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzIzZDE2MH0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjJmMmYyfS5idXR0b24uaXMtc3VjY2Vzcy5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZmZmICNmZmYgIWltcG9ydGFudH0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6IzIzZDE2MDtjb2xvcjojMjNkMTYwfS5idXR0b24uaXMtc3VjY2Vzcy5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwO2JvcmRlci1jb2xvcjojMjNkMTYwO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMjNkMTYwfS5idXR0b24uaXMtd2FybmluZ3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTc7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmc6aG92ZXIsLmJ1dHRvbi5pcy13YXJuaW5nLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojZmZkYjRhO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9LmJ1dHRvbi5pcy13YXJuaW5nOmZvY3VzLC5idXR0b24uaXMtd2FybmluZy5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDI1NSwyMjEsODcsMC4yNSk7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZzphY3RpdmUsLmJ1dHRvbi5pcy13YXJuaW5nLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmQ4M2Q7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9LmJ1dHRvbi5pcy13YXJuaW5nLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6cmdiYSgwLDAsMCwwLjcpO2NvbG9yOiNmZmRkNTd9LmJ1dHRvbi5pcy13YXJuaW5nLmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZy5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCByZ2JhKDAsMCwwLDAuNykgcmdiYSgwLDAsMCwwLjcpICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy13YXJuaW5nLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmZmRkNTc7Y29sb3I6I2ZmZGQ1N30uYnV0dG9uLmlzLXdhcm5pbmcuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy13YXJuaW5nLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1Nztib3JkZXItY29sb3I6I2ZmZGQ1Nztjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9LmJ1dHRvbi5pcy13YXJuaW5nLmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOnJnYmEoMCwwLDAsMC43KTtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9LmJ1dHRvbi5pcy13YXJuaW5nLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KTtjb2xvcjojZmZkZDU3fS5idXR0b24uaXMtZGFuZ2Vye2JhY2tncm91bmQtY29sb3I6cmVkO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtZGFuZ2VyOmhvdmVyLC5idXR0b24uaXMtZGFuZ2VyLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojZjIwMDAwO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtZGFuZ2VyOmZvY3VzLC5idXR0b24uaXMtZGFuZ2VyLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMjU1LDAsMCwwLjI1KTtjb2xvcjojZmZmfS5idXR0b24uaXMtZGFuZ2VyOmFjdGl2ZSwuYnV0dG9uLmlzLWRhbmdlci5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojZTYwMDAwO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6cmVkfS5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2YyZjJmMn0uYnV0dG9uLmlzLWRhbmdlci5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZmZmICNmZmYgIWltcG9ydGFudH0uYnV0dG9uLmlzLWRhbmdlci5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjpyZWQ7Y29sb3I6cmVkfS5idXR0b24uaXMtZGFuZ2VyLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtZGFuZ2VyLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6cmVkO2JvcmRlci1jb2xvcjpyZWQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1kYW5nZXIuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOnJlZH0uYnV0dG9uLmlzLXNtYWxse2JvcmRlci1yYWRpdXM6MnB4O2ZvbnQtc2l6ZTouNzVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbjpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uMzc1cmVtO21hcmdpbi1yaWdodDouMzc1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb246bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tbGVmdDouMzc1cmVtO21hcmdpbi1yaWdodDotLjM3NXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS4zNzVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjM3NXJlbSl9LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uMTI1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtc21hbGw6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS4xMjVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uMTI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS4xMjVyZW0pfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS42MjVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1tZWRpdW06bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS42MjVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1tZWRpdW06Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjYyNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uNjI1cmVtKX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LTEuMTI1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtbGFyZ2U6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LTEuMTI1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtMS4xMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtMS4xMjVyZW0pfS5idXR0b24uaXMtbWVkaXVte2ZvbnQtc2l6ZToxLjI1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS4xMjVyZW07bWFyZ2luLXJpZ2h0Oi42MjVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb246bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tbGVmdDouNjI1cmVtO21hcmdpbi1yaWdodDotLjEyNXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbjpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uMTI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS4xMjVyZW0pfS5idXR0b24uaXMtbWVkaXVtIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LjEyNXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1zbWFsbDpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDouMTI1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLjEyNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC4xMjVyZW0pfS5idXR0b24uaXMtbWVkaXVtIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uMzc1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uLmlzLW1lZGl1bTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotLjM3NXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1tZWRpdW06Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjM3NXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMzc1cmVtKX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uODc1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uLmlzLWxhcmdlOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uODc1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS44NzVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjg3NXJlbSl9LmJ1dHRvbi5pcy1sYXJnZXtmb250LXNpemU6MS41cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb246Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDowcmVtO21hcmdpbi1yaWdodDouNzVyZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbjpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi43NXJlbTttYXJnaW4tcmlnaHQ6MHJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgMHJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIDByZW0pfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDouMjVyZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbi5pcy1zbWFsbDpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDouMjVyZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC4yNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC4yNXJlbSl9LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbi5pcy1tZWRpdW06Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjI1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbWVkaXVtOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uMjVyZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbi5pcy1tZWRpdW06Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS4yNXJlbSl9LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uNzVyZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbi5pcy1sYXJnZTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotLjc1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjc1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS43NXJlbSl9LmJ1dHRvbltkaXNhYmxlZF0sLmJ1dHRvbi5pcy1kaXNhYmxlZHtvcGFjaXR5OjAuNX0uYnV0dG9uLmlzLWZ1bGx3aWR0aHtkaXNwbGF5OmZsZXg7d2lkdGg6MTAwJX0uYnV0dG9uLmlzLWxvYWRpbmd7Y29sb3I6dHJhbnNwYXJlbnQgIWltcG9ydGFudDtwb2ludGVyLWV2ZW50czpub25lfS5idXR0b24uaXMtbG9hZGluZzphZnRlcnthbmltYXRpb246c3BpbkFyb3VuZCA1MDBtcyBpbmZpbml0ZSBsaW5lYXI7Ym9yZGVyOjJweCBzb2xpZCAjZGJkYmRiO2JvcmRlci1yYWRpdXM6MjkwNDg2cHg7Ym9yZGVyLXJpZ2h0LWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci10b3AtY29sb3I6dHJhbnNwYXJlbnQ7Y29udGVudDpcXFwiXFxcIjtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcmVtO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjFyZW07bGVmdDo1MCU7bWFyZ2luLWxlZnQ6LThweDttYXJnaW4tdG9wOi04cHg7cG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtwb3NpdGlvbjphYnNvbHV0ZSAhaW1wb3J0YW50fS5jb250ZW50e2NvbG9yOiM0YTRhNGF9LmNvbnRlbnQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0uY29udGVudCBsaStsaXttYXJnaW4tdG9wOjAuMjVlbX0uY29udGVudCBwOm5vdCg6bGFzdC1jaGlsZCksLmNvbnRlbnQgb2w6bm90KDpsYXN0LWNoaWxkKSwuY29udGVudCB1bDpub3QoOmxhc3QtY2hpbGQpLC5jb250ZW50IGJsb2NrcXVvdGU6bm90KDpsYXN0LWNoaWxkKSwuY29udGVudCB0YWJsZTpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MWVtfS5jb250ZW50IGgxLC5jb250ZW50IGgyLC5jb250ZW50IGgzLC5jb250ZW50IGg0LC5jb250ZW50IGg1LC5jb250ZW50IGg2e2NvbG9yOiMzNjM2MzY7Zm9udC13ZWlnaHQ6NDAwO2xpbmUtaGVpZ2h0OjEuMTI1fS5jb250ZW50IGgxe2ZvbnQtc2l6ZToyZW07bWFyZ2luLWJvdHRvbTowLjVlbX0uY29udGVudCBoMTpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tdG9wOjFlbX0uY29udGVudCBoMntmb250LXNpemU6MS43NWVtO21hcmdpbi1ib3R0b206MC41NzE0ZW19LmNvbnRlbnQgaDI6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXRvcDoxLjE0MjhlbX0uY29udGVudCBoM3tmb250LXNpemU6MS41ZW07bWFyZ2luLWJvdHRvbTowLjY2NjZlbX0uY29udGVudCBoMzpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tdG9wOjEuMzMzM2VtfS5jb250ZW50IGg0e2ZvbnQtc2l6ZToxLjI1ZW07bWFyZ2luLWJvdHRvbTowLjhlbX0uY29udGVudCBoNXtmb250LXNpemU6MS4xMjVlbTttYXJnaW4tYm90dG9tOjAuODg4OGVtfS5jb250ZW50IGg2e2ZvbnQtc2l6ZToxZW07bWFyZ2luLWJvdHRvbToxZW19LmNvbnRlbnQgYmxvY2txdW90ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWxlZnQ6NXB4IHNvbGlkICNkYmRiZGI7cGFkZGluZzoxLjI1ZW0gMS41ZW19LmNvbnRlbnQgb2x7bGlzdC1zdHlsZTpkZWNpbWFsIG91dHNpZGU7bWFyZ2luLWxlZnQ6MmVtO21hcmdpbi1yaWdodDoyZW07bWFyZ2luLXRvcDoxZW19LmNvbnRlbnQgdWx7bGlzdC1zdHlsZTpkaXNjIG91dHNpZGU7bWFyZ2luLWxlZnQ6MmVtO21hcmdpbi1yaWdodDoyZW07bWFyZ2luLXRvcDoxZW19LmNvbnRlbnQgdWwgdWx7bGlzdC1zdHlsZS10eXBlOmNpcmNsZTttYXJnaW4tdG9wOjAuNWVtfS5jb250ZW50IHVsIHVsIHVse2xpc3Qtc3R5bGUtdHlwZTpzcXVhcmV9LmNvbnRlbnQgdGFibGV7d2lkdGg6MTAwJX0uY29udGVudCB0YWJsZSB0ZCwuY29udGVudCB0YWJsZSB0aHtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXdpZHRoOjAgMCAxcHg7cGFkZGluZzowLjVlbSAwLjc1ZW07dmVydGljYWwtYWxpZ246dG9wfS5jb250ZW50IHRhYmxlIHRoe2NvbG9yOiMzNjM2MzY7dGV4dC1hbGlnbjpsZWZ0fS5jb250ZW50IHRhYmxlIHRyOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX0uY29udGVudCB0YWJsZSB0aGVhZCB0ZCwuY29udGVudCB0YWJsZSB0aGVhZCB0aHtib3JkZXItd2lkdGg6MCAwIDJweDtjb2xvcjojMzYzNjM2fS5jb250ZW50IHRhYmxlIHRmb290IHRkLC5jb250ZW50IHRhYmxlIHRmb290IHRoe2JvcmRlci13aWR0aDoycHggMCAwO2NvbG9yOiMzNjM2MzZ9LmNvbnRlbnQgdGFibGUgdGJvZHkgdHI6bGFzdC1jaGlsZCB0ZCwuY29udGVudCB0YWJsZSB0Ym9keSB0cjpsYXN0LWNoaWxkIHRoe2JvcmRlci1ib3R0b20td2lkdGg6MH0uY29udGVudC5pcy1zbWFsbHtmb250LXNpemU6Ljc1cmVtfS5jb250ZW50LmlzLW1lZGl1bXtmb250LXNpemU6MS4yNXJlbX0uY29udGVudC5pcy1sYXJnZXtmb250LXNpemU6MS41cmVtfS5pbnB1dCwudGV4dGFyZWF7LW1vei1hcHBlYXJhbmNlOm5vbmU7LXdlYmtpdC1hcHBlYXJhbmNlOm5vbmU7YWxpZ24taXRlbXM6Y2VudGVyO2JvcmRlcjpub25lO2JvcmRlci1yYWRpdXM6M3B4O2JveC1zaGFkb3c6bm9uZTtkaXNwbGF5OmlubGluZS1mbGV4O2ZvbnQtc2l6ZToxcmVtO2hlaWdodDoyLjI4NWVtO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O2xpbmUtaGVpZ2h0OjEuNTtwYWRkaW5nLWxlZnQ6MC43NWVtO3BhZGRpbmctcmlnaHQ6MC43NWVtO3Bvc2l0aW9uOnJlbGF0aXZlO3ZlcnRpY2FsLWFsaWduOnRvcDtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO2NvbG9yOiMzNjM2MzY7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjEpO21heC13aWR0aDoxMDAlO3dpZHRoOjEwMCV9LmlucHV0OmZvY3VzLC5pbnB1dC5pcy1mb2N1c2VkLC5pbnB1dDphY3RpdmUsLmlucHV0LmlzLWFjdGl2ZSwudGV4dGFyZWE6Zm9jdXMsLnRleHRhcmVhLmlzLWZvY3VzZWQsLnRleHRhcmVhOmFjdGl2ZSwudGV4dGFyZWEuaXMtYWN0aXZle291dGxpbmU6bm9uZX0uaW5wdXRbZGlzYWJsZWRdLC5pbnB1dC5pcy1kaXNhYmxlZCwudGV4dGFyZWFbZGlzYWJsZWRdLC50ZXh0YXJlYS5pcy1kaXNhYmxlZHtwb2ludGVyLWV2ZW50czpub25lfS5pbnB1dDpob3ZlciwuaW5wdXQuaXMtaG92ZXJlZCwudGV4dGFyZWE6aG92ZXIsLnRleHRhcmVhLmlzLWhvdmVyZWR7Ym9yZGVyLWNvbG9yOiNiNWI1YjV9LmlucHV0OmZvY3VzLC5pbnB1dC5pcy1mb2N1c2VkLC5pbnB1dDphY3RpdmUsLmlucHV0LmlzLWFjdGl2ZSwudGV4dGFyZWE6Zm9jdXMsLnRleHRhcmVhLmlzLWZvY3VzZWQsLnRleHRhcmVhOmFjdGl2ZSwudGV4dGFyZWEuaXMtYWN0aXZle2JvcmRlci1jb2xvcjojMTgyYjczfS5pbnB1dFtkaXNhYmxlZF0sLmlucHV0LmlzLWRpc2FibGVkLC50ZXh0YXJlYVtkaXNhYmxlZF0sLnRleHRhcmVhLmlzLWRpc2FibGVke2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItY29sb3I6I2Y1ZjVmNTtib3gtc2hhZG93Om5vbmU7Y29sb3I6IzdhN2E3YX0uaW5wdXRbZGlzYWJsZWRdOjotbW96LXBsYWNlaG9sZGVyLC5pbnB1dC5pcy1kaXNhYmxlZDo6LW1vei1wbGFjZWhvbGRlciwudGV4dGFyZWFbZGlzYWJsZWRdOjotbW96LXBsYWNlaG9sZGVyLC50ZXh0YXJlYS5pcy1kaXNhYmxlZDo6LW1vei1wbGFjZWhvbGRlcntjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuMyl9LmlucHV0W2Rpc2FibGVkXTo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlciwuaW5wdXQuaXMtZGlzYWJsZWQ6Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIsLnRleHRhcmVhW2Rpc2FibGVkXTo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlciwudGV4dGFyZWEuaXMtZGlzYWJsZWQ6Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5pbnB1dFtkaXNhYmxlZF06LW1vei1wbGFjZWhvbGRlciwuaW5wdXQuaXMtZGlzYWJsZWQ6LW1vei1wbGFjZWhvbGRlciwudGV4dGFyZWFbZGlzYWJsZWRdOi1tb3otcGxhY2Vob2xkZXIsLnRleHRhcmVhLmlzLWRpc2FibGVkOi1tb3otcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5pbnB1dFtkaXNhYmxlZF06LW1zLWlucHV0LXBsYWNlaG9sZGVyLC5pbnB1dC5pcy1kaXNhYmxlZDotbXMtaW5wdXQtcGxhY2Vob2xkZXIsLnRleHRhcmVhW2Rpc2FibGVkXTotbXMtaW5wdXQtcGxhY2Vob2xkZXIsLnRleHRhcmVhLmlzLWRpc2FibGVkOi1tcy1pbnB1dC1wbGFjZWhvbGRlcntjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuMyl9LmlucHV0W3R5cGU9XFxcInNlYXJjaFxcXCJdLC50ZXh0YXJlYVt0eXBlPVxcXCJzZWFyY2hcXFwiXXtib3JkZXItcmFkaXVzOjI5MDQ4NnB4fS5pbnB1dC5pcy13aGl0ZSwudGV4dGFyZWEuaXMtd2hpdGV7Ym9yZGVyLWNvbG9yOiNmZmZ9LmlucHV0LmlzLWJsYWNrLC50ZXh0YXJlYS5pcy1ibGFja3tib3JkZXItY29sb3I6IzBhMGEwYX0uaW5wdXQuaXMtbGlnaHQsLnRleHRhcmVhLmlzLWxpZ2h0e2JvcmRlci1jb2xvcjojZjVmNWY1fS5pbnB1dC5pcy1kYXJrLC50ZXh0YXJlYS5pcy1kYXJre2JvcmRlci1jb2xvcjojMzYzNjM2fS5pbnB1dC5pcy1wcmltYXJ5LC50ZXh0YXJlYS5pcy1wcmltYXJ5e2JvcmRlci1jb2xvcjojMTgyYjczfS5pbnB1dC5pcy1pbmZvLC50ZXh0YXJlYS5pcy1pbmZve2JvcmRlci1jb2xvcjojMzI3M2RjfS5pbnB1dC5pcy1zdWNjZXNzLC50ZXh0YXJlYS5pcy1zdWNjZXNze2JvcmRlci1jb2xvcjojMjNkMTYwfS5pbnB1dC5pcy13YXJuaW5nLC50ZXh0YXJlYS5pcy13YXJuaW5ne2JvcmRlci1jb2xvcjojZmZkZDU3fS5pbnB1dC5pcy1kYW5nZXIsLnRleHRhcmVhLmlzLWRhbmdlcntib3JkZXItY29sb3I6cmVkfS5pbnB1dC5pcy1zbWFsbCwudGV4dGFyZWEuaXMtc21hbGx7Ym9yZGVyLXJhZGl1czoycHg7Zm9udC1zaXplOi43NXJlbX0uaW5wdXQuaXMtbWVkaXVtLC50ZXh0YXJlYS5pcy1tZWRpdW17Zm9udC1zaXplOjEuMjVyZW19LmlucHV0LmlzLWxhcmdlLC50ZXh0YXJlYS5pcy1sYXJnZXtmb250LXNpemU6MS41cmVtfS5pbnB1dC5pcy1mdWxsd2lkdGgsLnRleHRhcmVhLmlzLWZ1bGx3aWR0aHtkaXNwbGF5OmJsb2NrO3dpZHRoOjEwMCV9LmlucHV0LmlzLWlubGluZSwudGV4dGFyZWEuaXMtaW5saW5le2Rpc3BsYXk6aW5saW5lO3dpZHRoOmF1dG99LnRleHRhcmVhe2Rpc3BsYXk6YmxvY2s7bGluZS1oZWlnaHQ6MS4yNTttYXgtaGVpZ2h0OjYwMHB4O21heC13aWR0aDoxMDAlO21pbi1oZWlnaHQ6MTIwcHg7bWluLXdpZHRoOjEwMCU7cGFkZGluZzoxMHB4O3Jlc2l6ZTp2ZXJ0aWNhbH0uY2hlY2tib3gsLnJhZGlve2FsaWduLWl0ZW1zOmNlbnRlcjtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmlubGluZS1mbGV4O2ZsZXgtd3JhcDp3cmFwO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O3Bvc2l0aW9uOnJlbGF0aXZlO3ZlcnRpY2FsLWFsaWduOnRvcH0uY2hlY2tib3ggaW5wdXQsLnJhZGlvIGlucHV0e2N1cnNvcjpwb2ludGVyO21hcmdpbi1yaWdodDowLjVlbX0uY2hlY2tib3g6aG92ZXIsLnJhZGlvOmhvdmVye2NvbG9yOiMzNjM2MzZ9LmNoZWNrYm94LmlzLWRpc2FibGVkLC5yYWRpby5pcy1kaXNhYmxlZHtjb2xvcjojN2E3YTdhO3BvaW50ZXItZXZlbnRzOm5vbmV9LmNoZWNrYm94LmlzLWRpc2FibGVkIGlucHV0LC5yYWRpby5pcy1kaXNhYmxlZCBpbnB1dHtwb2ludGVyLWV2ZW50czpub25lfS5yYWRpbysucmFkaW97bWFyZ2luLWxlZnQ6MC41ZW19LnNlbGVjdHtkaXNwbGF5OmlubGluZS1ibG9jaztoZWlnaHQ6Mi41ZW07cG9zaXRpb246cmVsYXRpdmU7dmVydGljYWwtYWxpZ246dG9wfS5zZWxlY3Q6YWZ0ZXJ7Ym9yZGVyOjFweCBzb2xpZCAjMTgyYjczO2JvcmRlci1yaWdodDowO2JvcmRlci10b3A6MDtjb250ZW50OlxcXCIgXFxcIjtkaXNwbGF5OmJsb2NrO2hlaWdodDowLjVlbTtwb2ludGVyLWV2ZW50czpub25lO3Bvc2l0aW9uOmFic29sdXRlO3RyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTt3aWR0aDowLjVlbTttYXJnaW4tdG9wOi0wLjM3NWVtO3JpZ2h0OjEuMTI1ZW07dG9wOjUwJTt6LWluZGV4OjR9LnNlbGVjdCBzZWxlY3R7LW1vei1hcHBlYXJhbmNlOm5vbmU7LXdlYmtpdC1hcHBlYXJhbmNlOm5vbmU7YWxpZ24taXRlbXM6Y2VudGVyO2JvcmRlcjpub25lO2JvcmRlci1yYWRpdXM6M3B4O2JveC1zaGFkb3c6bm9uZTtkaXNwbGF5OmlubGluZS1mbGV4O2ZvbnQtc2l6ZToxcmVtO2hlaWdodDoyLjI4NWVtO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O2xpbmUtaGVpZ2h0OjEuNTtwYWRkaW5nLWxlZnQ6MC43NWVtO3BhZGRpbmctcmlnaHQ6MC43NWVtO3Bvc2l0aW9uOnJlbGF0aXZlO3ZlcnRpY2FsLWFsaWduOnRvcDtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO2NvbG9yOiMzNjM2MzY7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpibG9jaztmb250LXNpemU6MWVtO291dGxpbmU6bm9uZTtwYWRkaW5nLXJpZ2h0OjIuNWVtfS5zZWxlY3Qgc2VsZWN0OmZvY3VzLC5zZWxlY3Qgc2VsZWN0LmlzLWZvY3VzZWQsLnNlbGVjdCBzZWxlY3Q6YWN0aXZlLC5zZWxlY3Qgc2VsZWN0LmlzLWFjdGl2ZXtvdXRsaW5lOm5vbmV9LnNlbGVjdCBzZWxlY3RbZGlzYWJsZWRdLC5zZWxlY3Qgc2VsZWN0LmlzLWRpc2FibGVke3BvaW50ZXItZXZlbnRzOm5vbmV9LnNlbGVjdCBzZWxlY3Q6aG92ZXIsLnNlbGVjdCBzZWxlY3QuaXMtaG92ZXJlZHtib3JkZXItY29sb3I6I2I1YjViNX0uc2VsZWN0IHNlbGVjdDpmb2N1cywuc2VsZWN0IHNlbGVjdC5pcy1mb2N1c2VkLC5zZWxlY3Qgc2VsZWN0OmFjdGl2ZSwuc2VsZWN0IHNlbGVjdC5pcy1hY3RpdmV7Ym9yZGVyLWNvbG9yOiMxODJiNzN9LnNlbGVjdCBzZWxlY3RbZGlzYWJsZWRdLC5zZWxlY3Qgc2VsZWN0LmlzLWRpc2FibGVke2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItY29sb3I6I2Y1ZjVmNTtib3gtc2hhZG93Om5vbmU7Y29sb3I6IzdhN2E3YX0uc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF06Oi1tb3otcGxhY2Vob2xkZXIsLnNlbGVjdCBzZWxlY3QuaXMtZGlzYWJsZWQ6Oi1tb3otcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXTo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlciwuc2VsZWN0IHNlbGVjdC5pcy1kaXNhYmxlZDo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlcntjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuMyl9LnNlbGVjdCBzZWxlY3RbZGlzYWJsZWRdOi1tb3otcGxhY2Vob2xkZXIsLnNlbGVjdCBzZWxlY3QuaXMtZGlzYWJsZWQ6LW1vei1wbGFjZWhvbGRlcntjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuMyl9LnNlbGVjdCBzZWxlY3RbZGlzYWJsZWRdOi1tcy1pbnB1dC1wbGFjZWhvbGRlciwuc2VsZWN0IHNlbGVjdC5pcy1kaXNhYmxlZDotbXMtaW5wdXQtcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5zZWxlY3Qgc2VsZWN0OmhvdmVye2JvcmRlci1jb2xvcjojYjViNWI1fS5zZWxlY3Qgc2VsZWN0Ojptcy1leHBhbmR7ZGlzcGxheTpub25lfS5zZWxlY3Q6aG92ZXI6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOiMzNjM2MzZ9LnNlbGVjdC5pcy1zbWFsbHtib3JkZXItcmFkaXVzOjJweDtmb250LXNpemU6Ljc1cmVtfS5zZWxlY3QuaXMtbWVkaXVte2ZvbnQtc2l6ZToxLjI1cmVtfS5zZWxlY3QuaXMtbGFyZ2V7Zm9udC1zaXplOjEuNXJlbX0uc2VsZWN0LmlzLWZ1bGx3aWR0aHt3aWR0aDoxMDAlfS5zZWxlY3QuaXMtZnVsbHdpZHRoIHNlbGVjdHt3aWR0aDoxMDAlfS5sYWJlbHtjb2xvcjojMzYzNjM2O2Rpc3BsYXk6YmxvY2s7Zm9udC13ZWlnaHQ6Ym9sZH0ubGFiZWw6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNWVtfS5oZWxwe2Rpc3BsYXk6YmxvY2s7Zm9udC1zaXplOi43NXJlbTttYXJnaW4tdG9wOjVweH0uaGVscC5pcy13aGl0ZXtjb2xvcjojZmZmfS5oZWxwLmlzLWJsYWNre2NvbG9yOiMwYTBhMGF9LmhlbHAuaXMtbGlnaHR7Y29sb3I6I2Y1ZjVmNX0uaGVscC5pcy1kYXJre2NvbG9yOiMzNjM2MzZ9LmhlbHAuaXMtcHJpbWFyeXtjb2xvcjojMTgyYjczfS5oZWxwLmlzLWluZm97Y29sb3I6IzMyNzNkY30uaGVscC5pcy1zdWNjZXNze2NvbG9yOiMyM2QxNjB9LmhlbHAuaXMtd2FybmluZ3tjb2xvcjojZmZkZDU3fS5oZWxwLmlzLWRhbmdlcntjb2xvcjpyZWR9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5jb250cm9sLWxhYmVse21hcmdpbi1ib3R0b206MC41ZW19fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuY29udHJvbC1sYWJlbHtmbGV4LWJhc2lzOjA7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MDttYXJnaW4tcmlnaHQ6MS41ZW07cGFkZGluZy10b3A6MC41ZW07dGV4dC1hbGlnbjpyaWdodH19LmNvbnRyb2x7cG9zaXRpb246cmVsYXRpdmU7dGV4dC1hbGlnbjpsZWZ0fS5jb250cm9sOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfS5jb250cm9sLmhhcy1hZGRvbnN7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0fS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbiwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dCwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3R7Ym9yZGVyLXJhZGl1czowO21hcmdpbi1yaWdodDotMXB4O3dpZHRoOmF1dG99LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uOmhvdmVyLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0OmhvdmVyLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpob3Zlcnt6LWluZGV4OjJ9LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uOmZvY3VzLC5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjphY3RpdmUsLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQ6Zm9jdXMsLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQ6YWN0aXZlLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpmb2N1cywuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6YWN0aXZle3otaW5kZXg6M30uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246Zmlyc3QtY2hpbGQsLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQ6Zmlyc3QtY2hpbGQsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0OmZpcnN0LWNoaWxke2JvcmRlci1yYWRpdXM6M3B4IDAgMCAzcHh9LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uOmZpcnN0LWNoaWxkIHNlbGVjdCwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDpmaXJzdC1jaGlsZCBzZWxlY3QsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0OmZpcnN0LWNoaWxkIHNlbGVjdHtib3JkZXItcmFkaXVzOjNweCAwIDAgM3B4fS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpsYXN0LWNoaWxkLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0Omxhc3QtY2hpbGQsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0Omxhc3QtY2hpbGR7Ym9yZGVyLXJhZGl1czowIDNweCAzcHggMH0uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246bGFzdC1jaGlsZCBzZWxlY3QsLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQ6bGFzdC1jaGlsZCBzZWxlY3QsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0Omxhc3QtY2hpbGQgc2VsZWN0e2JvcmRlci1yYWRpdXM6MCAzcHggM3B4IDB9LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uLmlzLWV4cGFuZGVkLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0LmlzLWV4cGFuZGVkLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdC5pcy1leHBhbmRlZHtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowfS5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdCBzZWxlY3Q6aG92ZXJ7ei1pbmRleDoyfS5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdCBzZWxlY3Q6Zm9jdXMsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0IHNlbGVjdDphY3RpdmV7ei1pbmRleDozfS5jb250cm9sLmhhcy1hZGRvbnMuaGFzLWFkZG9ucy1jZW50ZXJlZHtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5jb250cm9sLmhhcy1hZGRvbnMuaGFzLWFkZG9ucy1yaWdodHtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmR9LmNvbnRyb2wuaGFzLWFkZG9ucy5oYXMtYWRkb25zLWZ1bGx3aWR0aCAuYnV0dG9uLC5jb250cm9sLmhhcy1hZGRvbnMuaGFzLWFkZG9ucy1mdWxsd2lkdGggLmlucHV0LC5jb250cm9sLmhhcy1hZGRvbnMuaGFzLWFkZG9ucy1mdWxsd2lkdGggLnNlbGVjdHtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowfS5jb250cm9sLmhhcy1pY29uIC5pY29ue2NvbG9yOiNkYmRiZGI7cG9pbnRlci1ldmVudHM6bm9uZTtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6MS4yNXJlbTt6LWluZGV4OjR9LmNvbnRyb2wuaGFzLWljb24gLmlucHV0OmZvY3VzKy5pY29ue2NvbG9yOiM3YTdhN2F9LmNvbnRyb2wuaGFzLWljb24gLmlucHV0LmlzLXNtYWxsKy5pY29ue3RvcDouOTM3NXJlbX0uY29udHJvbC5oYXMtaWNvbiAuaW5wdXQuaXMtbWVkaXVtKy5pY29ue3RvcDoxLjU2MjVyZW19LmNvbnRyb2wuaGFzLWljb24gLmlucHV0LmlzLWxhcmdlKy5pY29ue3RvcDoxLjg3NXJlbX0uY29udHJvbC5oYXMtaWNvbjpub3QoLmhhcy1pY29uLXJpZ2h0KSAuaWNvbntsZWZ0OjEuMjVyZW07dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKX0uY29udHJvbC5oYXMtaWNvbjpub3QoLmhhcy1pY29uLXJpZ2h0KSAuaW5wdXR7cGFkZGluZy1sZWZ0OjIuNWVtfS5jb250cm9sLmhhcy1pY29uOm5vdCguaGFzLWljb24tcmlnaHQpIC5pbnB1dC5pcy1zbWFsbCsuaWNvbntsZWZ0Oi45Mzc1cmVtfS5jb250cm9sLmhhcy1pY29uOm5vdCguaGFzLWljb24tcmlnaHQpIC5pbnB1dC5pcy1tZWRpdW0rLmljb257bGVmdDoxLjU2MjVyZW19LmNvbnRyb2wuaGFzLWljb246bm90KC5oYXMtaWNvbi1yaWdodCkgLmlucHV0LmlzLWxhcmdlKy5pY29ue2xlZnQ6MS44NzVyZW19LmNvbnRyb2wuaGFzLWljb24uaGFzLWljb24tcmlnaHQgLmljb257cmlnaHQ6MS4yNXJlbTt0cmFuc2Zvcm06dHJhbnNsYXRlWCg1MCUpIHRyYW5zbGF0ZVkoLTUwJSl9LmNvbnRyb2wuaGFzLWljb24uaGFzLWljb24tcmlnaHQgLmlucHV0e3BhZGRpbmctcmlnaHQ6Mi41ZW19LmNvbnRyb2wuaGFzLWljb24uaGFzLWljb24tcmlnaHQgLmlucHV0LmlzLXNtYWxsKy5pY29ue3JpZ2h0Oi45Mzc1cmVtfS5jb250cm9sLmhhcy1pY29uLmhhcy1pY29uLXJpZ2h0IC5pbnB1dC5pcy1tZWRpdW0rLmljb257cmlnaHQ6MS41NjI1cmVtfS5jb250cm9sLmhhcy1pY29uLmhhcy1pY29uLXJpZ2h0IC5pbnB1dC5pcy1sYXJnZSsuaWNvbntyaWdodDoxLjg3NXJlbX0uY29udHJvbC5pcy1ncm91cGVke2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydH0uY29udHJvbC5pcy1ncm91cGVkPi5jb250cm9se2ZsZXgtYmFzaXM6MDtmbGV4LXNocmluazowfS5jb250cm9sLmlzLWdyb3VwZWQ+LmNvbnRyb2w6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjA7bWFyZ2luLXJpZ2h0OjAuNzVyZW19LmNvbnRyb2wuaXMtZ3JvdXBlZD4uY29udHJvbC5pcy1leHBhbmRlZHtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxfS5jb250cm9sLmlzLWdyb3VwZWQuaXMtZ3JvdXBlZC1jZW50ZXJlZHtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5jb250cm9sLmlzLWdyb3VwZWQuaXMtZ3JvdXBlZC1yaWdodHtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmR9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5jb250cm9sLmlzLWhvcml6b250YWx7ZGlzcGxheTpmbGV4fS5jb250cm9sLmlzLWhvcml6b250YWw+LmNvbnRyb2x7ZGlzcGxheTpmbGV4O2ZsZXgtYmFzaXM6MDtmbGV4LWdyb3c6NTtmbGV4LXNocmluazoxfX0uY29udHJvbC5pcy1sb2FkaW5nOmFmdGVye2FuaW1hdGlvbjpzcGluQXJvdW5kIDUwMG1zIGluZmluaXRlIGxpbmVhcjtib3JkZXI6MnB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtib3JkZXItcmlnaHQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLXRvcC1jb2xvcjp0cmFuc3BhcmVudDtjb250ZW50OlxcXCJcXFwiO2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjFyZW07cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MXJlbTtwb3NpdGlvbjphYnNvbHV0ZSAhaW1wb3J0YW50O3JpZ2h0OjAuNzVlbTt0b3A6MC43NWVtfS5pY29ue2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZToyMXB4O2hlaWdodDoxLjVyZW07bGluZS1oZWlnaHQ6MS41cmVtO3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcDt3aWR0aDoxLjVyZW19Lmljb24gLmZhe2ZvbnQtc2l6ZTppbmhlcml0O2xpbmUtaGVpZ2h0OmluaGVyaXR9Lmljb24uaXMtc21hbGx7ZGlzcGxheTppbmxpbmUtYmxvY2s7Zm9udC1zaXplOjE0cHg7aGVpZ2h0OjFyZW07bGluZS1oZWlnaHQ6MXJlbTt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6MXJlbX0uaWNvbi5pcy1tZWRpdW17ZGlzcGxheTppbmxpbmUtYmxvY2s7Zm9udC1zaXplOjI4cHg7aGVpZ2h0OjJyZW07bGluZS1oZWlnaHQ6MnJlbTt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6MnJlbX0uaWNvbi5pcy1sYXJnZXtkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6NDJweDtoZWlnaHQ6M3JlbTtsaW5lLWhlaWdodDozcmVtO3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcDt3aWR0aDozcmVtfS5pbWFnZXtkaXNwbGF5OmJsb2NrO3Bvc2l0aW9uOnJlbGF0aXZlfS5pbWFnZSBpbWd7ZGlzcGxheTpibG9jaztoZWlnaHQ6YXV0bzt3aWR0aDoxMDAlfS5pbWFnZS5pcy1zcXVhcmUgaW1nLC5pbWFnZS5pcy0xYnkxIGltZywuaW1hZ2UuaXMtNGJ5MyBpbWcsLmltYWdlLmlzLTNieTIgaW1nLC5pbWFnZS5pcy0xNmJ5OSBpbWcsLmltYWdlLmlzLTJieTEgaW1ne2JvdHRvbTowO2xlZnQ6MDtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO3RvcDowO2hlaWdodDoxMDAlO3dpZHRoOjEwMCV9LmltYWdlLmlzLXNxdWFyZSwuaW1hZ2UuaXMtMWJ5MXtwYWRkaW5nLXRvcDoxMDAlfS5pbWFnZS5pcy00Ynkze3BhZGRpbmctdG9wOjc1JX0uaW1hZ2UuaXMtM2J5MntwYWRkaW5nLXRvcDo2Ni42NjY2JX0uaW1hZ2UuaXMtMTZieTl7cGFkZGluZy10b3A6NTYuMjUlfS5pbWFnZS5pcy0yYnkxe3BhZGRpbmctdG9wOjUwJX0uaW1hZ2UuaXMtMTZ4MTZ7aGVpZ2h0OjE2cHg7d2lkdGg6MTZweH0uaW1hZ2UuaXMtMjR4MjR7aGVpZ2h0OjI0cHg7d2lkdGg6MjRweH0uaW1hZ2UuaXMtMzJ4MzJ7aGVpZ2h0OjMycHg7d2lkdGg6MzJweH0uaW1hZ2UuaXMtNDh4NDh7aGVpZ2h0OjQ4cHg7d2lkdGg6NDhweH0uaW1hZ2UuaXMtNjR4NjR7aGVpZ2h0OjY0cHg7d2lkdGg6NjRweH0uaW1hZ2UuaXMtOTZ4OTZ7aGVpZ2h0Ojk2cHg7d2lkdGg6OTZweH0uaW1hZ2UuaXMtMTI4eDEyOHtoZWlnaHQ6MTI4cHg7d2lkdGg6MTI4cHh9Lm5vdGlmaWNhdGlvbntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLXJhZGl1czozcHg7cGFkZGluZzoxLjI1cmVtIDIuNXJlbSAxLjI1cmVtIDEuNXJlbTtwb3NpdGlvbjpyZWxhdGl2ZX0ubm90aWZpY2F0aW9uOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19Lm5vdGlmaWNhdGlvbiBjb2RlLC5ub3RpZmljYXRpb24gcHJle2JhY2tncm91bmQ6I2ZmZn0ubm90aWZpY2F0aW9uIHByZSBjb2Rle2JhY2tncm91bmQ6dHJhbnNwYXJlbnR9Lm5vdGlmaWNhdGlvbiAuZGVsZXRle3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjAuNWVtO3RvcDowLjVlbX0ubm90aWZpY2F0aW9uIC50aXRsZSwubm90aWZpY2F0aW9uIC5zdWJ0aXRsZSwubm90aWZpY2F0aW9uIC5jb250ZW50e2NvbG9yOmluaGVyaXR9Lm5vdGlmaWNhdGlvbi5pcy13aGl0ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0ubm90aWZpY2F0aW9uLmlzLWJsYWNre2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5ub3RpZmljYXRpb24uaXMtbGlnaHR7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiMzNjM2MzZ9Lm5vdGlmaWNhdGlvbi5pcy1kYXJre2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtjb2xvcjojZjVmNWY1fS5ub3RpZmljYXRpb24uaXMtcHJpbWFyeXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0ubm90aWZpY2F0aW9uLmlzLWluZm97YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjO2NvbG9yOiNmZmZ9Lm5vdGlmaWNhdGlvbi5pcy1zdWNjZXNze2JhY2tncm91bmQtY29sb3I6IzIzZDE2MDtjb2xvcjojZmZmfS5ub3RpZmljYXRpb24uaXMtd2FybmluZ3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTc7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5ub3RpZmljYXRpb24uaXMtZGFuZ2Vye2JhY2tncm91bmQtY29sb3I6cmVkO2NvbG9yOiNmZmZ9LnByb2dyZXNzey1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2JvcmRlcjpub25lO2JvcmRlci1yYWRpdXM6MjkwNDg2cHg7ZGlzcGxheTpibG9jaztoZWlnaHQ6MXJlbTtvdmVyZmxvdzpoaWRkZW47cGFkZGluZzowO3dpZHRoOjEwMCV9LnByb2dyZXNzOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LnByb2dyZXNzOjotd2Via2l0LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNkYmRiZGJ9LnByb2dyZXNzOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6IzRhNGE0YX0ucHJvZ3Jlc3M6Oi1tb3otcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6IzRhNGE0YX0ucHJvZ3Jlc3MuaXMtd2hpdGU6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojZmZmfS5wcm9ncmVzcy5pcy13aGl0ZTo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmfS5wcm9ncmVzcy5pcy1ibGFjazo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGF9LnByb2dyZXNzLmlzLWJsYWNrOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGF9LnByb2dyZXNzLmlzLWxpZ2h0Ojotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX0ucHJvZ3Jlc3MuaXMtbGlnaHQ6Oi1tb3otcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX0ucHJvZ3Jlc3MuaXMtZGFyazo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzZ9LnByb2dyZXNzLmlzLWRhcms6Oi1tb3otcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6IzM2MzYzNn0ucHJvZ3Jlc3MuaXMtcHJpbWFyeTo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzN9LnByb2dyZXNzLmlzLXByaW1hcnk6Oi1tb3otcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6IzE4MmI3M30ucHJvZ3Jlc3MuaXMtaW5mbzo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGN9LnByb2dyZXNzLmlzLWluZm86Oi1tb3otcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6IzMyNzNkY30ucHJvZ3Jlc3MuaXMtc3VjY2Vzczo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjB9LnByb2dyZXNzLmlzLXN1Y2Nlc3M6Oi1tb3otcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6IzIzZDE2MH0ucHJvZ3Jlc3MuaXMtd2FybmluZzo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTd9LnByb2dyZXNzLmlzLXdhcm5pbmc6Oi1tb3otcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1N30ucHJvZ3Jlc3MuaXMtZGFuZ2VyOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6cmVkfS5wcm9ncmVzcy5pcy1kYW5nZXI6Oi1tb3otcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6cmVkfS5wcm9ncmVzcy5pcy1zbWFsbHtoZWlnaHQ6Ljc1cmVtfS5wcm9ncmVzcy5pcy1tZWRpdW17aGVpZ2h0OjEuMjVyZW19LnByb2dyZXNzLmlzLWxhcmdle2hlaWdodDoxLjVyZW19LnRhYmxle2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMzYzNjM2O21hcmdpbi1ib3R0b206MS41cmVtO3dpZHRoOjEwMCV9LnRhYmxlIHRkLC50YWJsZSB0aHtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXdpZHRoOjAgMCAxcHg7cGFkZGluZzowLjVlbSAwLjc1ZW07dmVydGljYWwtYWxpZ246dG9wfS50YWJsZSB0ZC5pcy1uYXJyb3csLnRhYmxlIHRoLmlzLW5hcnJvd3t3aGl0ZS1zcGFjZTpub3dyYXA7d2lkdGg6MSV9LnRhYmxlIHRoe2NvbG9yOiMzNjM2MzY7dGV4dC1hbGlnbjpsZWZ0fS50YWJsZSB0cjpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmYWZhZmF9LnRhYmxlIHRoZWFkIHRkLC50YWJsZSB0aGVhZCB0aHtib3JkZXItd2lkdGg6MCAwIDJweDtjb2xvcjojN2E3YTdhfS50YWJsZSB0Zm9vdCB0ZCwudGFibGUgdGZvb3QgdGh7Ym9yZGVyLXdpZHRoOjJweCAwIDA7Y29sb3I6IzdhN2E3YX0udGFibGUgdGJvZHkgdHI6bGFzdC1jaGlsZCB0ZCwudGFibGUgdGJvZHkgdHI6bGFzdC1jaGlsZCB0aHtib3JkZXItYm90dG9tLXdpZHRoOjB9LnRhYmxlLmlzLWJvcmRlcmVkIHRkLC50YWJsZS5pcy1ib3JkZXJlZCB0aHtib3JkZXItd2lkdGg6MXB4fS50YWJsZS5pcy1ib3JkZXJlZCB0cjpsYXN0LWNoaWxkIHRkLC50YWJsZS5pcy1ib3JkZXJlZCB0cjpsYXN0LWNoaWxkIHRoe2JvcmRlci1ib3R0b20td2lkdGg6MXB4fS50YWJsZS5pcy1uYXJyb3cgdGQsLnRhYmxlLmlzLW5hcnJvdyB0aHtwYWRkaW5nOjAuMjVlbSAwLjVlbX0udGFibGUuaXMtc3RyaXBlZCB0Ym9keSB0cjpudGgtY2hpbGQoZXZlbil7YmFja2dyb3VuZC1jb2xvcjojZmFmYWZhfS50YWJsZS5pcy1zdHJpcGVkIHRib2R5IHRyOm50aC1jaGlsZChldmVuKTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9LnRhZ3thbGlnbi1pdGVtczpjZW50ZXI7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1yYWRpdXM6MjkwNDg2cHg7Y29sb3I6IzRhNGE0YTtkaXNwbGF5OmlubGluZS1mbGV4O2ZvbnQtc2l6ZTouNzVyZW07aGVpZ2h0OjJlbTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2xpbmUtaGVpZ2h0OjEuNTtwYWRkaW5nLWxlZnQ6MC44NzVlbTtwYWRkaW5nLXJpZ2h0OjAuODc1ZW07dmVydGljYWwtYWxpZ246dG9wO3doaXRlLXNwYWNlOm5vd3JhcH0udGFnIC5kZWxldGV7bWFyZ2luLWxlZnQ6MC4yNWVtO21hcmdpbi1yaWdodDotMC41ZW19LnRhZy5pcy13aGl0ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0udGFnLmlzLWJsYWNre2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS50YWcuaXMtbGlnaHR7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiMzNjM2MzZ9LnRhZy5pcy1kYXJre2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtjb2xvcjojZjVmNWY1fS50YWcuaXMtcHJpbWFyeXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0udGFnLmlzLWluZm97YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjO2NvbG9yOiNmZmZ9LnRhZy5pcy1zdWNjZXNze2JhY2tncm91bmQtY29sb3I6IzIzZDE2MDtjb2xvcjojZmZmfS50YWcuaXMtd2FybmluZ3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTc7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS50YWcuaXMtZGFuZ2Vye2JhY2tncm91bmQtY29sb3I6cmVkO2NvbG9yOiNmZmZ9LnRhZy5pcy1tZWRpdW17Zm9udC1zaXplOjFyZW19LnRhZy5pcy1sYXJnZXtmb250LXNpemU6MS4yNXJlbX0udGl0bGUsLnN1YnRpdGxle3dvcmQtYnJlYWs6YnJlYWstd29yZH0udGl0bGU6bm90KDpsYXN0LWNoaWxkKSwuc3VidGl0bGU6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0udGl0bGUgZW0sLnRpdGxlIHNwYW4sLnN1YnRpdGxlIGVtLC5zdWJ0aXRsZSBzcGFue2ZvbnQtd2VpZ2h0OjMwMH0udGl0bGUgc3Ryb25nLC5zdWJ0aXRsZSBzdHJvbmd7Zm9udC13ZWlnaHQ6NTAwfS50aXRsZSAudGFnLC5zdWJ0aXRsZSAudGFne3ZlcnRpY2FsLWFsaWduOm1pZGRsZX0udGl0bGV7Y29sb3I6IzM2MzYzNjtmb250LXNpemU6MnJlbTtmb250LXdlaWdodDozMDA7bGluZS1oZWlnaHQ6MS4xMjV9LnRpdGxlIHN0cm9uZ3tjb2xvcjppbmhlcml0fS50aXRsZSsuaGlnaGxpZ2h0e21hcmdpbi10b3A6LTAuNzVyZW19LnRpdGxlKy5zdWJ0aXRsZXttYXJnaW4tdG9wOi0xLjI1cmVtfS50aXRsZS5pcy0xe2ZvbnQtc2l6ZTozLjVyZW19LnRpdGxlLmlzLTJ7Zm9udC1zaXplOjIuNzVyZW19LnRpdGxlLmlzLTN7Zm9udC1zaXplOjJyZW19LnRpdGxlLmlzLTR7Zm9udC1zaXplOjEuNXJlbX0udGl0bGUuaXMtNXtmb250LXNpemU6MS4yNXJlbX0udGl0bGUuaXMtNntmb250LXNpemU6MTRweH0uc3VidGl0bGV7Y29sb3I6IzRhNGE0YTtmb250LXNpemU6MS4yNXJlbTtmb250LXdlaWdodDozMDA7bGluZS1oZWlnaHQ6MS4yNX0uc3VidGl0bGUgc3Ryb25ne2NvbG9yOiMzNjM2MzZ9LnN1YnRpdGxlKy50aXRsZXttYXJnaW4tdG9wOi0xLjVyZW19LnN1YnRpdGxlLmlzLTF7Zm9udC1zaXplOjMuNXJlbX0uc3VidGl0bGUuaXMtMntmb250LXNpemU6Mi43NXJlbX0uc3VidGl0bGUuaXMtM3tmb250LXNpemU6MnJlbX0uc3VidGl0bGUuaXMtNHtmb250LXNpemU6MS41cmVtfS5zdWJ0aXRsZS5pcy01e2ZvbnQtc2l6ZToxLjI1cmVtfS5zdWJ0aXRsZS5pcy02e2ZvbnQtc2l6ZToxNHB4fS5ibG9jazpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5jb250YWluZXJ7cG9zaXRpb246cmVsYXRpdmV9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuY29udGFpbmVye21hcmdpbjowIGF1dG87bWF4LXdpZHRoOjk2MHB4fS5jb250YWluZXIuaXMtZmx1aWR7bWFyZ2luOjAgMjBweDttYXgtd2lkdGg6bm9uZX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuY29udGFpbmVye21heC13aWR0aDoxMTUycHh9fS5kZWxldGV7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lOy1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjIpO2JvcmRlcjpub25lO2JvcmRlci1yYWRpdXM6MjkwNDg2cHg7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTppbmxpbmUtYmxvY2s7Zm9udC1zaXplOjFyZW07aGVpZ2h0OjIwcHg7b3V0bGluZTpub25lO3Bvc2l0aW9uOnJlbGF0aXZlO3RyYW5zZm9ybTpyb3RhdGUoNDVkZWcpO3RyYW5zZm9ybS1vcmlnaW46Y2VudGVyIGNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6MjBweH0uZGVsZXRlOmJlZm9yZSwuZGVsZXRlOmFmdGVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb250ZW50OlxcXCJcXFwiO2Rpc3BsYXk6YmxvY2s7bGVmdDo1MCU7cG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTt0cmFuc2Zvcm06dHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpfS5kZWxldGU6YmVmb3Jle2hlaWdodDoycHg7d2lkdGg6NTAlfS5kZWxldGU6YWZ0ZXJ7aGVpZ2h0OjUwJTt3aWR0aDoycHh9LmRlbGV0ZTpob3ZlciwuZGVsZXRlOmZvY3Vze2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjMpfS5kZWxldGU6YWN0aXZle2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjQpfS5kZWxldGUuaXMtc21hbGx7aGVpZ2h0OjE0cHg7d2lkdGg6MTRweH0uZGVsZXRlLmlzLW1lZGl1bXtoZWlnaHQ6MjZweDt3aWR0aDoyNnB4fS5kZWxldGUuaXMtbGFyZ2V7aGVpZ2h0OjMwcHg7d2lkdGg6MzBweH0uZmF7Zm9udC1zaXplOjIxcHg7dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wfS5oZWFkaW5ne2Rpc3BsYXk6YmxvY2s7Zm9udC1zaXplOjExcHg7bGV0dGVyLXNwYWNpbmc6MXB4O21hcmdpbi1ib3R0b206NXB4O3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZX0uaGlnaGxpZ2h0e2ZvbnQtd2VpZ2h0OjQwMDttYXgtd2lkdGg6MTAwJTtvdmVyZmxvdzpoaWRkZW47cGFkZGluZzowfS5oaWdobGlnaHQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0uaGlnaGxpZ2h0IHByZXtvdmVyZmxvdzphdXRvO21heC13aWR0aDoxMDAlfS5sb2FkZXJ7YW5pbWF0aW9uOnNwaW5Bcm91bmQgNTAwbXMgaW5maW5pdGUgbGluZWFyO2JvcmRlcjoycHggc29saWQgI2RiZGJkYjtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2JvcmRlci1yaWdodC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItdG9wLWNvbG9yOnRyYW5zcGFyZW50O2NvbnRlbnQ6XFxcIlxcXCI7ZGlzcGxheTpibG9jaztoZWlnaHQ6MXJlbTtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoxcmVtfS5udW1iZXJ7YWxpZ24taXRlbXM6Y2VudGVyO2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2Rpc3BsYXk6aW5saW5lLWZsZXg7Zm9udC1zaXplOjEuMjVyZW07aGVpZ2h0OjJlbTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO21hcmdpbi1yaWdodDoxLjVyZW07bWluLXdpZHRoOjIuNWVtO3BhZGRpbmc6MC4yNXJlbSAwLjVyZW07dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wfS5jYXJkLWhlYWRlcnthbGlnbi1pdGVtczpzdHJldGNoO2JveC1zaGFkb3c6MCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4xKTtkaXNwbGF5OmZsZXh9LmNhcmQtaGVhZGVyLXRpdGxle2FsaWduLWl0ZW1zOmNlbnRlcjtjb2xvcjojMzYzNjM2O2Rpc3BsYXk6ZmxleDtmbGV4LWdyb3c6MTtmb250LXdlaWdodDo3MDA7cGFkZGluZzowLjc1cmVtfS5jYXJkLWhlYWRlci1pY29ue2FsaWduLWl0ZW1zOmNlbnRlcjtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmNlbnRlcjtwYWRkaW5nOjAuNzVyZW19LmNhcmQtaW1hZ2V7ZGlzcGxheTpibG9jaztwb3NpdGlvbjpyZWxhdGl2ZX0uY2FyZC1jb250ZW50e3BhZGRpbmc6MS41cmVtfS5jYXJkLWNvbnRlbnQgLnRpdGxlKy5zdWJ0aXRsZXttYXJnaW4tdG9wOi0xLjVyZW19LmNhcmQtZm9vdGVye2JvcmRlci10b3A6MXB4IHNvbGlkICNkYmRiZGI7YWxpZ24taXRlbXM6c3RyZXRjaDtkaXNwbGF5OmZsZXh9LmNhcmQtZm9vdGVyLWl0ZW17YWxpZ24taXRlbXM6Y2VudGVyO2Rpc3BsYXk6ZmxleDtmbGV4LWJhc2lzOjA7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmc6MC43NXJlbX0uY2FyZC1mb290ZXItaXRlbTpub3QoOmxhc3QtY2hpbGQpe2JvcmRlci1yaWdodDoxcHggc29saWQgI2RiZGJkYn0uY2FyZHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym94LXNoYWRvdzowIDJweCAzcHggcmdiYSgxMCwxMCwxMCwwLjEpLDAgMCAwIDFweCByZ2JhKDEwLDEwLDEwLDAuMSk7Y29sb3I6IzRhNGE0YTttYXgtd2lkdGg6MTAwJTtwb3NpdGlvbjpyZWxhdGl2ZX0uY2FyZCAubWVkaWE6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNzVyZW19LmxldmVsLWl0ZW17YWxpZ24taXRlbXM6Y2VudGVyO2Rpc3BsYXk6ZmxleDtmbGV4LWJhc2lzOmF1dG87ZmxleC1ncm93OjA7ZmxleC1zaHJpbms6MDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5sZXZlbC1pdGVtIC50aXRsZSwubGV2ZWwtaXRlbSAuc3VidGl0bGV7bWFyZ2luLWJvdHRvbTowfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsubGV2ZWwtaXRlbTpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX19LmxldmVsLWxlZnQsLmxldmVsLXJpZ2h0e2ZsZXgtYmFzaXM6YXV0bztmbGV4LWdyb3c6MDtmbGV4LXNocmluazowfS5sZXZlbC1sZWZ0IC5sZXZlbC1pdGVtOm5vdCg6bGFzdC1jaGlsZCksLmxldmVsLXJpZ2h0IC5sZXZlbC1pdGVtOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0OjAuNzVyZW19LmxldmVsLWxlZnQgLmxldmVsLWl0ZW0uaXMtZmxleGlibGUsLmxldmVsLXJpZ2h0IC5sZXZlbC1pdGVtLmlzLWZsZXhpYmxle2ZsZXgtZ3JvdzoxfS5sZXZlbC1sZWZ0e2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydH1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmxldmVsLWxlZnQrLmxldmVsLXJpZ2h0e21hcmdpbi10b3A6MS41cmVtfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmxldmVsLWxlZnR7ZGlzcGxheTpmbGV4fX0ubGV2ZWwtcmlnaHR7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpmbGV4LWVuZH1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmxldmVsLXJpZ2h0e2Rpc3BsYXk6ZmxleH19LmxldmVse2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbn0ubGV2ZWw6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0ubGV2ZWwgY29kZXtib3JkZXItcmFkaXVzOjNweH0ubGV2ZWwgaW1ne2Rpc3BsYXk6aW5saW5lLWJsb2NrO3ZlcnRpY2FsLWFsaWduOnRvcH0ubGV2ZWwuaXMtbW9iaWxle2Rpc3BsYXk6ZmxleH0ubGV2ZWwuaXMtbW9iaWxlPi5sZXZlbC1pdGVtOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowfS5sZXZlbC5pcy1tb2JpbGU+LmxldmVsLWl0ZW06bm90KC5pcy1uYXJyb3cpe2ZsZXgtZ3JvdzoxfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsubGV2ZWx7ZGlzcGxheTpmbGV4fS5sZXZlbD4ubGV2ZWwtaXRlbTpub3QoLmlzLW5hcnJvdyl7ZmxleC1ncm93OjF9fS5tZWRpYS1sZWZ0LC5tZWRpYS1yaWdodHtmbGV4LWJhc2lzOmF1dG87ZmxleC1ncm93OjA7ZmxleC1zaHJpbms6MH0ubWVkaWEtbGVmdHttYXJnaW4tcmlnaHQ6MXJlbX0ubWVkaWEtcmlnaHR7bWFyZ2luLWxlZnQ6MXJlbX0ubWVkaWEtY29udGVudHtmbGV4LWJhc2lzOmF1dG87ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MTt0ZXh0LWFsaWduOmxlZnR9Lm1lZGlhe2FsaWduLWl0ZW1zOmZsZXgtc3RhcnQ7ZGlzcGxheTpmbGV4O3RleHQtYWxpZ246bGVmdH0ubWVkaWEgLmNvbnRlbnQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNzVyZW19Lm1lZGlhIC5tZWRpYXtib3JkZXItdG9wOjFweCBzb2xpZCByZ2JhKDIxOSwyMTksMjE5LDAuNSk7ZGlzcGxheTpmbGV4O3BhZGRpbmctdG9wOjAuNzVyZW19Lm1lZGlhIC5tZWRpYSAuY29udGVudDpub3QoOmxhc3QtY2hpbGQpLC5tZWRpYSAubWVkaWEgLmNvbnRyb2w6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNXJlbX0ubWVkaWEgLm1lZGlhIC5tZWRpYXtwYWRkaW5nLXRvcDowLjVyZW19Lm1lZGlhIC5tZWRpYSAubWVkaWErLm1lZGlhe21hcmdpbi10b3A6MC41cmVtfS5tZWRpYSsubWVkaWF7Ym9yZGVyLXRvcDoxcHggc29saWQgcmdiYSgyMTksMjE5LDIxOSwwLjUpO21hcmdpbi10b3A6MXJlbTtwYWRkaW5nLXRvcDoxcmVtfS5tZWRpYS5pcy1sYXJnZSsubWVkaWF7bWFyZ2luLXRvcDoxLjVyZW07cGFkZGluZy10b3A6MS41cmVtfS5tZW51e2ZvbnQtc2l6ZToxcmVtfS5tZW51LWxpc3R7bGluZS1oZWlnaHQ6MS4yNX0ubWVudS1saXN0IGF7Ym9yZGVyLXJhZGl1czoycHg7Y29sb3I6IzRhNGE0YTtkaXNwbGF5OmJsb2NrO3BhZGRpbmc6MC41ZW0gMC43NWVtfS5tZW51LWxpc3QgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzE4MmI3M30ubWVudS1saXN0IGEuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmfS5tZW51LWxpc3QgbGkgdWx7Ym9yZGVyLWxlZnQ6MXB4IHNvbGlkICNkYmRiZGI7bWFyZ2luOjAuNzVlbTtwYWRkaW5nLWxlZnQ6MC43NWVtfS5tZW51LWxhYmVse2NvbG9yOiM3YTdhN2E7Zm9udC1zaXplOjAuOGVtO2xldHRlci1zcGFjaW5nOjAuMWVtO3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZX0ubWVudS1sYWJlbDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tdG9wOjFlbX0ubWVudS1sYWJlbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MWVtfS5tZXNzYWdle2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItcmFkaXVzOjNweDtmb250LXNpemU6MXJlbX0ubWVzc2FnZTpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5tZXNzYWdlLmlzLXdoaXRle2JhY2tncm91bmQtY29sb3I6I2ZmZn0ubWVzc2FnZS5pcy13aGl0ZSAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9Lm1lc3NhZ2UuaXMtd2hpdGUgLm1lc3NhZ2UtYm9keXtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojNGQ0ZDRkfS5tZXNzYWdlLmlzLWJsYWNre2JhY2tncm91bmQtY29sb3I6I2ZhZmFmYX0ubWVzc2FnZS5pcy1ibGFjayAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9Lm1lc3NhZ2UuaXMtYmxhY2sgLm1lc3NhZ2UtYm9keXtib3JkZXItY29sb3I6IzBhMGEwYTtjb2xvcjojMDkwOTA5fS5tZXNzYWdlLmlzLWxpZ2h0e2JhY2tncm91bmQtY29sb3I6I2ZhZmFmYX0ubWVzc2FnZS5pcy1saWdodCAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiMzNjM2MzZ9Lm1lc3NhZ2UuaXMtbGlnaHQgLm1lc3NhZ2UtYm9keXtib3JkZXItY29sb3I6I2Y1ZjVmNTtjb2xvcjojNTA1MDUwfS5tZXNzYWdlLmlzLWRhcmt7YmFja2dyb3VuZC1jb2xvcjojZmFmYWZhfS5tZXNzYWdlLmlzLWRhcmsgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtjb2xvcjojZjVmNWY1fS5tZXNzYWdlLmlzLWRhcmsgLm1lc3NhZ2UtYm9keXtib3JkZXItY29sb3I6IzM2MzYzNjtjb2xvcjojMmEyYTJhfS5tZXNzYWdlLmlzLXByaW1hcnl7YmFja2dyb3VuZC1jb2xvcjojZjdmOGZkfS5tZXNzYWdlLmlzLXByaW1hcnkgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmfS5tZXNzYWdlLmlzLXByaW1hcnkgLm1lc3NhZ2UtYm9keXtib3JkZXItY29sb3I6IzE4MmI3Mztjb2xvcjojMTYyNjYyfS5tZXNzYWdlLmlzLWluZm97YmFja2dyb3VuZC1jb2xvcjojZjZmOWZlfS5tZXNzYWdlLmlzLWluZm8gLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztjb2xvcjojZmZmfS5tZXNzYWdlLmlzLWluZm8gLm1lc3NhZ2UtYm9keXtib3JkZXItY29sb3I6IzMyNzNkYztjb2xvcjojMjI1MDlhfS5tZXNzYWdlLmlzLXN1Y2Nlc3N7YmFja2dyb3VuZC1jb2xvcjojZjZmZWY5fS5tZXNzYWdlLmlzLXN1Y2Nlc3MgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6IzIzZDE2MDtjb2xvcjojZmZmfS5tZXNzYWdlLmlzLXN1Y2Nlc3MgLm1lc3NhZ2UtYm9keXtib3JkZXItY29sb3I6IzIzZDE2MDtjb2xvcjojMGUzMDFhfS5tZXNzYWdlLmlzLXdhcm5pbmd7YmFja2dyb3VuZC1jb2xvcjojZmZmZGY1fS5tZXNzYWdlLmlzLXdhcm5pbmcgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1Nztjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lm1lc3NhZ2UuaXMtd2FybmluZyAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojZmZkZDU3O2NvbG9yOiMzYjMxMDh9Lm1lc3NhZ2UuaXMtZGFuZ2Vye2JhY2tncm91bmQtY29sb3I6I2ZmZjVmNX0ubWVzc2FnZS5pcy1kYW5nZXIgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6cmVkO2NvbG9yOiNmZmZ9Lm1lc3NhZ2UuaXMtZGFuZ2VyIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOnJlZDtjb2xvcjojYWQwNjA2fS5tZXNzYWdlLWhlYWRlcnthbGlnbi1pdGVtczpjZW50ZXI7YmFja2dyb3VuZC1jb2xvcjojNGE0YTRhO2JvcmRlci1yYWRpdXM6M3B4IDNweCAwIDA7Y29sb3I6I2ZmZjtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47bGluZS1oZWlnaHQ6MS4yNTtwYWRkaW5nOjAuNWVtIDAuNzVlbTtwb3NpdGlvbjpyZWxhdGl2ZX0ubWVzc2FnZS1oZWFkZXIgYSwubWVzc2FnZS1oZWFkZXIgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lm1lc3NhZ2UtaGVhZGVyIGF7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZX0ubWVzc2FnZS1oZWFkZXIgLmRlbGV0ZXtmbGV4LWdyb3c6MDtmbGV4LXNocmluazowO21hcmdpbi1sZWZ0OjAuNzVlbX0ubWVzc2FnZS1oZWFkZXIrLm1lc3NhZ2UtYm9keXtib3JkZXItdG9wLWxlZnQtcmFkaXVzOjA7Ym9yZGVyLXRvcC1yaWdodC1yYWRpdXM6MDtib3JkZXItdG9wOm5vbmV9Lm1lc3NhZ2UtYm9keXtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXJhZGl1czozcHg7Y29sb3I6IzRhNGE0YTtwYWRkaW5nOjFlbSAxLjI1ZW19Lm1lc3NhZ2UtYm9keSBhLC5tZXNzYWdlLWJvZHkgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lm1lc3NhZ2UtYm9keSBhe3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmV9Lm1lc3NhZ2UtYm9keSBjb2RlLC5tZXNzYWdlLWJvZHkgcHJle2JhY2tncm91bmQ6I2ZmZn0ubWVzc2FnZS1ib2R5IHByZSBjb2Rle2JhY2tncm91bmQ6dHJhbnNwYXJlbnR9Lm1vZGFsLWJhY2tncm91bmR7Ym90dG9tOjA7bGVmdDowO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjA7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuODYpfS5tb2RhbC1jb250ZW50LC5tb2RhbC1jYXJke21hcmdpbjowIDIwcHg7bWF4LWhlaWdodDpjYWxjKDEwMHZoIC0gMTYwcHgpO292ZXJmbG93OmF1dG87cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MTAwJX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7Lm1vZGFsLWNvbnRlbnQsLm1vZGFsLWNhcmR7bWFyZ2luOjAgYXV0bzttYXgtaGVpZ2h0OmNhbGMoMTAwdmggLSA0MHB4KTt3aWR0aDo2NDBweH19Lm1vZGFsLWNsb3Nley13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZTstbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4yKTtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZToxcmVtO2hlaWdodDoyMHB4O291dGxpbmU6bm9uZTtwb3NpdGlvbjpyZWxhdGl2ZTt0cmFuc2Zvcm06cm90YXRlKDQ1ZGVnKTt0cmFuc2Zvcm0tb3JpZ2luOmNlbnRlciBjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjIwcHg7YmFja2dyb3VuZDpub25lO2hlaWdodDo0MHB4O3Bvc2l0aW9uOmZpeGVkO3JpZ2h0OjIwcHg7dG9wOjIwcHg7d2lkdGg6NDBweH0ubW9kYWwtY2xvc2U6YmVmb3JlLC5tb2RhbC1jbG9zZTphZnRlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29udGVudDpcXFwiXFxcIjtkaXNwbGF5OmJsb2NrO2xlZnQ6NTAlO3Bvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKX0ubW9kYWwtY2xvc2U6YmVmb3Jle2hlaWdodDoycHg7d2lkdGg6NTAlfS5tb2RhbC1jbG9zZTphZnRlcntoZWlnaHQ6NTAlO3dpZHRoOjJweH0ubW9kYWwtY2xvc2U6aG92ZXIsLm1vZGFsLWNsb3NlOmZvY3Vze2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjMpfS5tb2RhbC1jbG9zZTphY3RpdmV7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuNCl9Lm1vZGFsLWNsb3NlLmlzLXNtYWxse2hlaWdodDoxNHB4O3dpZHRoOjE0cHh9Lm1vZGFsLWNsb3NlLmlzLW1lZGl1bXtoZWlnaHQ6MjZweDt3aWR0aDoyNnB4fS5tb2RhbC1jbG9zZS5pcy1sYXJnZXtoZWlnaHQ6MzBweDt3aWR0aDozMHB4fS5tb2RhbC1jYXJke2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47bWF4LWhlaWdodDpjYWxjKDEwMHZoIC0gNDBweCk7b3ZlcmZsb3c6aGlkZGVufS5tb2RhbC1jYXJkLWhlYWQsLm1vZGFsLWNhcmQtZm9vdHthbGlnbi1pdGVtczpjZW50ZXI7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2Rpc3BsYXk6ZmxleDtmbGV4LXNocmluazowO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O3BhZGRpbmc6MjBweDtwb3NpdGlvbjpyZWxhdGl2ZX0ubW9kYWwtY2FyZC1oZWFke2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXRvcC1sZWZ0LXJhZGl1czo1cHg7Ym9yZGVyLXRvcC1yaWdodC1yYWRpdXM6NXB4fS5tb2RhbC1jYXJkLXRpdGxle2NvbG9yOiMzNjM2MzY7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MDtmb250LXNpemU6MS41cmVtO2xpbmUtaGVpZ2h0OjF9Lm1vZGFsLWNhcmQtZm9vdHtib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzOjVweDtib3JkZXItYm90dG9tLXJpZ2h0LXJhZGl1czo1cHg7Ym9yZGVyLXRvcDoxcHggc29saWQgI2RiZGJkYn0ubW9kYWwtY2FyZC1mb290IC5idXR0b246bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6MTBweH0ubW9kYWwtY2FyZC1ib2R5ey13ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOnRvdWNoO2JhY2tncm91bmQtY29sb3I6I2ZmZjtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO292ZXJmbG93OmF1dG87cGFkZGluZzoyMHB4fS5tb2RhbHtib3R0b206MDtsZWZ0OjA7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDt0b3A6MDthbGlnbi1pdGVtczpjZW50ZXI7ZGlzcGxheTpub25lO2p1c3RpZnktY29udGVudDpjZW50ZXI7b3ZlcmZsb3c6aGlkZGVuO3Bvc2l0aW9uOmZpeGVkO3otaW5kZXg6MTk4Nn0ubW9kYWwuaXMtYWN0aXZle2Rpc3BsYXk6ZmxleH0ubmF2LXRvZ2dsZXtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmJsb2NrO2hlaWdodDozLjVyZW07cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6My41cmVtfS5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojNGE0YTRhO2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjFweDtsZWZ0OjUwJTttYXJnaW4tbGVmdDotN3B4O3Bvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7dHJhbnNpdGlvbjpub25lIDg2bXMgZWFzZS1vdXQ7dHJhbnNpdGlvbi1wcm9wZXJ0eTpiYWNrZ3JvdW5kLCBsZWZ0LCBvcGFjaXR5LCB0cmFuc2Zvcm07d2lkdGg6MTVweH0ubmF2LXRvZ2dsZSBzcGFuOm50aC1jaGlsZCgxKXttYXJnaW4tdG9wOi02cHh9Lm5hdi10b2dnbGUgc3BhbjpudGgtY2hpbGQoMil7bWFyZ2luLXRvcDotMXB4fS5uYXYtdG9nZ2xlIHNwYW46bnRoLWNoaWxkKDMpe21hcmdpbi10b3A6NHB4fS5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX0ubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzN9Lm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW46bnRoLWNoaWxkKDEpe21hcmdpbi1sZWZ0Oi01cHg7dHJhbnNmb3JtOnJvdGF0ZSg0NWRlZyk7dHJhbnNmb3JtLW9yaWdpbjpsZWZ0IHRvcH0ubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbjpudGgtY2hpbGQoMil7b3BhY2l0eTowfS5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFuOm50aC1jaGlsZCgzKXttYXJnaW4tbGVmdDotNXB4O3RyYW5zZm9ybTpyb3RhdGUoLTQ1ZGVnKTt0cmFuc2Zvcm0tb3JpZ2luOmxlZnQgYm90dG9tfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsubmF2LXRvZ2dsZXtkaXNwbGF5Om5vbmV9fS5uYXYtaXRlbXthbGlnbi1pdGVtczpjZW50ZXI7ZGlzcGxheTpmbGV4O2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjA7Zm9udC1zaXplOjFyZW07anVzdGlmeS1jb250ZW50OmNlbnRlcjtwYWRkaW5nOjAuNXJlbSAwLjc1cmVtfS5uYXYtaXRlbSBhe2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjB9Lm5hdi1pdGVtIGltZ3ttYXgtaGVpZ2h0OjEuNzVyZW19Lm5hdi1pdGVtIC5idXR0b24rLmJ1dHRvbnttYXJnaW4tbGVmdDowLjc1cmVtfS5uYXYtaXRlbSAudGFnOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0OjAuNXJlbX0ubmF2LWl0ZW0gLnRhZzpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1sZWZ0OjAuNXJlbX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lm5hdi1pdGVte2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0fX0ubmF2LWl0ZW0gYSxhLm5hdi1pdGVte2NvbG9yOiM3YTdhN2F9Lm5hdi1pdGVtIGE6aG92ZXIsYS5uYXYtaXRlbTpob3Zlcntjb2xvcjojMzYzNjM2fS5uYXYtaXRlbSBhLmlzLWFjdGl2ZSxhLm5hdi1pdGVtLmlzLWFjdGl2ZXtjb2xvcjojMzYzNjM2fS5uYXYtaXRlbSBhLmlzLXRhYixhLm5hdi1pdGVtLmlzLXRhYntib3JkZXItYm90dG9tOjFweCBzb2xpZCB0cmFuc3BhcmVudDtib3JkZXItdG9wOjFweCBzb2xpZCB0cmFuc3BhcmVudDtwYWRkaW5nLWJvdHRvbTpjYWxjKDAuNXJlbSAtIDFweCk7cGFkZGluZy1sZWZ0OjFyZW07cGFkZGluZy1yaWdodDoxcmVtO3BhZGRpbmctdG9wOmNhbGMoMC41cmVtIC0gMXB4KX0ubmF2LWl0ZW0gYS5pcy10YWI6aG92ZXIsYS5uYXYtaXRlbS5pcy10YWI6aG92ZXJ7Ym9yZGVyLWJvdHRvbS1jb2xvcjojMTgyYjczO2JvcmRlci10b3AtY29sb3I6dHJhbnNwYXJlbnR9Lm5hdi1pdGVtIGEuaXMtdGFiLmlzLWFjdGl2ZSxhLm5hdi1pdGVtLmlzLXRhYi5pcy1hY3RpdmV7Ym9yZGVyLWJvdHRvbTozcHggc29saWQgIzE4MmI3Mztjb2xvcjojMTgyYjczO3BhZGRpbmctYm90dG9tOmNhbGMoMC41cmVtIC0gM3B4KX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5uYXYtaXRlbSBhLmlzLWJyYW5kLGEubmF2LWl0ZW0uaXMtYnJhbmR7cGFkZGluZy1sZWZ0OjB9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JveC1zaGFkb3c6MCA0cHggN3B4IHJnYmEoMTAsMTAsMTAsMC4xKTtsZWZ0OjA7ZGlzcGxheTpub25lO3JpZ2h0OjA7dG9wOjEwMCU7cG9zaXRpb246YWJzb2x1dGV9Lm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wOjFweCBzb2xpZCByZ2JhKDIxOSwyMTksMjE5LDAuNSk7cGFkZGluZzowLjc1cmVtfS5uYXYtbWVudS5pcy1hY3RpdmV7ZGlzcGxheTpibG9ja319QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7Lm5hdi1tZW51e3BhZGRpbmctcmlnaHQ6MS41cmVtfX0ubmF2LWxlZnQsLm5hdi1yaWdodHthbGlnbi1pdGVtczpzdHJldGNoO2ZsZXgtYmFzaXM6MDtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowfS5uYXYtbGVmdHtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7b3ZlcmZsb3c6aGlkZGVuO292ZXJmbG93LXg6YXV0bzt3aGl0ZS1zcGFjZTpub3dyYXB9Lm5hdi1jZW50ZXJ7YWxpZ24taXRlbXM6c3RyZXRjaDtkaXNwbGF5OmZsZXg7ZmxleC1ncm93OjA7ZmxleC1zaHJpbms6MDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO21hcmdpbi1sZWZ0OmF1dG87bWFyZ2luLXJpZ2h0OmF1dG99Lm5hdi1yaWdodHtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmR9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5uYXYtcmlnaHR7ZGlzcGxheTpmbGV4fX0ubmF2e2FsaWduLWl0ZW1zOnN0cmV0Y2g7YmFja2dyb3VuZC1jb2xvcjojZmZmO2Rpc3BsYXk6ZmxleDttaW4taGVpZ2h0OjMuNXJlbTtwb3NpdGlvbjpyZWxhdGl2ZTt0ZXh0LWFsaWduOmNlbnRlcjt6LWluZGV4OjJ9Lm5hdj4uY29udGFpbmVye2FsaWduLWl0ZW1zOnN0cmV0Y2g7ZGlzcGxheTpmbGV4O21pbi1oZWlnaHQ6My41cmVtO3dpZHRoOjEwMCV9Lm5hdi5oYXMtc2hhZG93e2JveC1zaGFkb3c6MCAycHggM3B4IHJnYmEoMTAsMTAsMTAsMC4xKX0ucGFnaW5hdGlvbiwucGFnaW5hdGlvbi1saXN0e2FsaWduLWl0ZW1zOmNlbnRlcjtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmNlbnRlcjt0ZXh0LWFsaWduOmNlbnRlcn0ucGFnaW5hdGlvbi1wcmV2aW91cywucGFnaW5hdGlvbi1uZXh0LC5wYWdpbmF0aW9uLWxpbmssLnBhZ2luYXRpb24tZWxsaXBzaXN7LW1vei1hcHBlYXJhbmNlOm5vbmU7LXdlYmtpdC1hcHBlYXJhbmNlOm5vbmU7YWxpZ24taXRlbXM6Y2VudGVyO2JvcmRlcjpub25lO2JvcmRlci1yYWRpdXM6M3B4O2JveC1zaGFkb3c6bm9uZTtkaXNwbGF5OmlubGluZS1mbGV4O2ZvbnQtc2l6ZToxcmVtO2hlaWdodDoyLjI4NWVtO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O2xpbmUtaGVpZ2h0OjEuNTtwYWRkaW5nLWxlZnQ6MC43NWVtO3BhZGRpbmctcmlnaHQ6MC43NWVtO3Bvc2l0aW9uOnJlbGF0aXZlO3ZlcnRpY2FsLWFsaWduOnRvcDstd2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lOy1tcy11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmU7Zm9udC1zaXplOjAuODc1cmVtO3BhZGRpbmctbGVmdDowLjVlbTtwYWRkaW5nLXJpZ2h0OjAuNWVtO2p1c3RpZnktY29udGVudDpjZW50ZXI7dGV4dC1hbGlnbjpjZW50ZXJ9LnBhZ2luYXRpb24tcHJldmlvdXM6Zm9jdXMsLnBhZ2luYXRpb24tcHJldmlvdXMuaXMtZm9jdXNlZCwucGFnaW5hdGlvbi1wcmV2aW91czphY3RpdmUsLnBhZ2luYXRpb24tcHJldmlvdXMuaXMtYWN0aXZlLC5wYWdpbmF0aW9uLW5leHQ6Zm9jdXMsLnBhZ2luYXRpb24tbmV4dC5pcy1mb2N1c2VkLC5wYWdpbmF0aW9uLW5leHQ6YWN0aXZlLC5wYWdpbmF0aW9uLW5leHQuaXMtYWN0aXZlLC5wYWdpbmF0aW9uLWxpbms6Zm9jdXMsLnBhZ2luYXRpb24tbGluay5pcy1mb2N1c2VkLC5wYWdpbmF0aW9uLWxpbms6YWN0aXZlLC5wYWdpbmF0aW9uLWxpbmsuaXMtYWN0aXZlLC5wYWdpbmF0aW9uLWVsbGlwc2lzOmZvY3VzLC5wYWdpbmF0aW9uLWVsbGlwc2lzLmlzLWZvY3VzZWQsLnBhZ2luYXRpb24tZWxsaXBzaXM6YWN0aXZlLC5wYWdpbmF0aW9uLWVsbGlwc2lzLmlzLWFjdGl2ZXtvdXRsaW5lOm5vbmV9LnBhZ2luYXRpb24tcHJldmlvdXNbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLXByZXZpb3VzLmlzLWRpc2FibGVkLC5wYWdpbmF0aW9uLW5leHRbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLW5leHQuaXMtZGlzYWJsZWQsLnBhZ2luYXRpb24tbGlua1tkaXNhYmxlZF0sLnBhZ2luYXRpb24tbGluay5pcy1kaXNhYmxlZCwucGFnaW5hdGlvbi1lbGxpcHNpc1tkaXNhYmxlZF0sLnBhZ2luYXRpb24tZWxsaXBzaXMuaXMtZGlzYWJsZWR7cG9pbnRlci1ldmVudHM6bm9uZX0ucGFnaW5hdGlvbi1wcmV2aW91cywucGFnaW5hdGlvbi1uZXh0LC5wYWdpbmF0aW9uLWxpbmt7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO21pbi13aWR0aDoyLjVlbX0ucGFnaW5hdGlvbi1wcmV2aW91czpob3ZlciwucGFnaW5hdGlvbi1uZXh0OmhvdmVyLC5wYWdpbmF0aW9uLWxpbms6aG92ZXJ7Ym9yZGVyLWNvbG9yOiNiNWI1YjU7Y29sb3I6IzM2MzYzNn0ucGFnaW5hdGlvbi1wcmV2aW91czpmb2N1cywucGFnaW5hdGlvbi1uZXh0OmZvY3VzLC5wYWdpbmF0aW9uLWxpbms6Zm9jdXN7Ym9yZGVyLWNvbG9yOiMxODJiNzN9LnBhZ2luYXRpb24tcHJldmlvdXM6YWN0aXZlLC5wYWdpbmF0aW9uLW5leHQ6YWN0aXZlLC5wYWdpbmF0aW9uLWxpbms6YWN0aXZle2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKX0ucGFnaW5hdGlvbi1wcmV2aW91c1tkaXNhYmxlZF0sLnBhZ2luYXRpb24tcHJldmlvdXMuaXMtZGlzYWJsZWQsLnBhZ2luYXRpb24tbmV4dFtkaXNhYmxlZF0sLnBhZ2luYXRpb24tbmV4dC5pcy1kaXNhYmxlZCwucGFnaW5hdGlvbi1saW5rW2Rpc2FibGVkXSwucGFnaW5hdGlvbi1saW5rLmlzLWRpc2FibGVke2JhY2tncm91bmQ6I2RiZGJkYjtjb2xvcjojN2E3YTdhO29wYWNpdHk6MC41O3BvaW50ZXItZXZlbnRzOm5vbmV9LnBhZ2luYXRpb24tcHJldmlvdXMsLnBhZ2luYXRpb24tbmV4dHtwYWRkaW5nLWxlZnQ6MC43NWVtO3BhZGRpbmctcmlnaHQ6MC43NWVtfS5wYWdpbmF0aW9uLWxpbmsuaXMtY3VycmVudHtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Ym9yZGVyLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0ucGFnaW5hdGlvbi1lbGxpcHNpc3tjb2xvcjojYjViNWI1O3BvaW50ZXItZXZlbnRzOm5vbmV9LnBhZ2luYXRpb24tbGlzdCBsaTpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tbGVmdDowLjM3NXJlbX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LnBhZ2luYXRpb257ZmxleC13cmFwOndyYXB9LnBhZ2luYXRpb24tcHJldmlvdXMsLnBhZ2luYXRpb24tbmV4dHtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO3dpZHRoOmNhbGMoNTAlIC0gMC4zNzVyZW0pfS5wYWdpbmF0aW9uLW5leHR7bWFyZ2luLWxlZnQ6MC43NXJlbX0ucGFnaW5hdGlvbi1saXN0e21hcmdpbi10b3A6MC43NXJlbX0ucGFnaW5hdGlvbi1saXN0IGxpe2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjF9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsucGFnaW5hdGlvbi1saXN0e2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7b3JkZXI6MX0ucGFnaW5hdGlvbi1wcmV2aW91cywucGFnaW5hdGlvbi1uZXh0e21hcmdpbi1sZWZ0OjAuNzVyZW19LnBhZ2luYXRpb24tcHJldmlvdXN7b3JkZXI6Mn0ucGFnaW5hdGlvbi1uZXh0e29yZGVyOjN9LnBhZ2luYXRpb257anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW59LnBhZ2luYXRpb24uaXMtY2VudGVyZWQgLnBhZ2luYXRpb24tcHJldmlvdXN7bWFyZ2luLWxlZnQ6MDtvcmRlcjoxfS5wYWdpbmF0aW9uLmlzLWNlbnRlcmVkIC5wYWdpbmF0aW9uLWxpc3R7anVzdGlmeS1jb250ZW50OmNlbnRlcjtvcmRlcjoyfS5wYWdpbmF0aW9uLmlzLWNlbnRlcmVkIC5wYWdpbmF0aW9uLW5leHR7b3JkZXI6M30ucGFnaW5hdGlvbi5pcy1yaWdodCAucGFnaW5hdGlvbi1wcmV2aW91c3ttYXJnaW4tbGVmdDowO29yZGVyOjF9LnBhZ2luYXRpb24uaXMtcmlnaHQgLnBhZ2luYXRpb24tbmV4dHtvcmRlcjoyO21hcmdpbi1yaWdodDowLjc1cmVtfS5wYWdpbmF0aW9uLmlzLXJpZ2h0IC5wYWdpbmF0aW9uLWxpc3R7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kO29yZGVyOjN9fS5wYW5lbHtmb250LXNpemU6MXJlbX0ucGFuZWw6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0ucGFuZWwtaGVhZGluZywucGFuZWwtdGFicywucGFuZWwtYmxvY2t7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2RiZGJkYjtib3JkZXItbGVmdDoxcHggc29saWQgI2RiZGJkYjtib3JkZXItcmlnaHQ6MXB4IHNvbGlkICNkYmRiZGJ9LnBhbmVsLWhlYWRpbmc6Zmlyc3QtY2hpbGQsLnBhbmVsLXRhYnM6Zmlyc3QtY2hpbGQsLnBhbmVsLWJsb2NrOmZpcnN0LWNoaWxke2JvcmRlci10b3A6MXB4IHNvbGlkICNkYmRiZGJ9LnBhbmVsLWhlYWRpbmd7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1yYWRpdXM6M3B4IDNweCAwIDA7Y29sb3I6IzM2MzYzNjtmb250LXNpemU6MS4yNWVtO2ZvbnQtd2VpZ2h0OjMwMDtsaW5lLWhlaWdodDoxLjI1O3BhZGRpbmc6MC41ZW0gMC43NWVtfS5wYW5lbC10YWJze2FsaWduLWl0ZW1zOmZsZXgtZW5kO2Rpc3BsYXk6ZmxleDtmb250LXNpemU6MC44NzVlbTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5wYW5lbC10YWJzIGF7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2RiZGJkYjttYXJnaW4tYm90dG9tOi0xcHg7cGFkZGluZzowLjVlbX0ucGFuZWwtdGFicyBhLmlzLWFjdGl2ZXtib3JkZXItYm90dG9tLWNvbG9yOiM0YTRhNGE7Y29sb3I6IzM2MzYzNn0ucGFuZWwtbGlzdCBhe2NvbG9yOiM0YTRhNGF9LnBhbmVsLWxpc3QgYTpob3Zlcntjb2xvcjojMTgyYjczfS5wYW5lbC1ibG9ja3thbGlnbi1pdGVtczpjZW50ZXI7Y29sb3I6IzM2MzYzNjtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7cGFkZGluZzowLjVlbSAwLjc1ZW19LnBhbmVsLWJsb2NrIGlucHV0W3R5cGU9XFxcImNoZWNrYm94XFxcIl17bWFyZ2luLXJpZ2h0OjAuNzVlbX0ucGFuZWwtYmxvY2s+LmNvbnRyb2x7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MTt3aWR0aDoxMDAlfS5wYW5lbC1ibG9jay5pcy1hY3RpdmV7Ym9yZGVyLWxlZnQtY29sb3I6IzE4MmI3Mztjb2xvcjojMzYzNjM2fS5wYW5lbC1ibG9jay5pcy1hY3RpdmUgLnBhbmVsLWljb257Y29sb3I6IzE4MmI3M31hLnBhbmVsLWJsb2NrLGxhYmVsLnBhbmVsLWJsb2Nre2N1cnNvcjpwb2ludGVyfWEucGFuZWwtYmxvY2s6aG92ZXIsbGFiZWwucGFuZWwtYmxvY2s6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5wYW5lbC1pY29ue2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZToxNHB4O2hlaWdodDoxZW07bGluZS1oZWlnaHQ6MWVtO3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcDt3aWR0aDoxZW07Y29sb3I6IzdhN2E3YTttYXJnaW4tcmlnaHQ6MC43NWVtfS5wYW5lbC1pY29uIC5mYXtmb250LXNpemU6aW5oZXJpdDtsaW5lLWhlaWdodDppbmhlcml0fS50YWJzey13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZTthbGlnbi1pdGVtczpzdHJldGNoO2Rpc3BsYXk6ZmxleDtmb250LXNpemU6MXJlbTtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjtvdmVyZmxvdzpoaWRkZW47b3ZlcmZsb3cteDphdXRvO3doaXRlLXNwYWNlOm5vd3JhcH0udGFiczpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS50YWJzIGF7YWxpZ24taXRlbXM6Y2VudGVyO2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNkYmRiZGI7Y29sb3I6IzRhNGE0YTtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmNlbnRlcjttYXJnaW4tYm90dG9tOi0xcHg7cGFkZGluZzowLjVlbSAxZW07dmVydGljYWwtYWxpZ246dG9wfS50YWJzIGE6aG92ZXJ7Ym9yZGVyLWJvdHRvbS1jb2xvcjojMzYzNjM2O2NvbG9yOiMzNjM2MzZ9LnRhYnMgbGl7ZGlzcGxheTpibG9ja30udGFicyBsaS5pcy1hY3RpdmUgYXtib3JkZXItYm90dG9tLWNvbG9yOiMxODJiNzM7Y29sb3I6IzE4MmI3M30udGFicyB1bHthbGlnbi1pdGVtczpjZW50ZXI7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2RiZGJkYjtkaXNwbGF5OmZsZXg7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydH0udGFicyB1bC5pcy1sZWZ0e3BhZGRpbmctcmlnaHQ6MC43NWVtfS50YWJzIHVsLmlzLWNlbnRlcntmbGV4Om5vbmU7anVzdGlmeS1jb250ZW50OmNlbnRlcjtwYWRkaW5nLWxlZnQ6MC43NWVtO3BhZGRpbmctcmlnaHQ6MC43NWVtfS50YWJzIHVsLmlzLXJpZ2h0e2p1c3RpZnktY29udGVudDpmbGV4LWVuZDtwYWRkaW5nLWxlZnQ6MC43NWVtfS50YWJzIC5pY29uOmZpcnN0LWNoaWxke21hcmdpbi1yaWdodDowLjVlbX0udGFicyAuaWNvbjpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OjAuNWVtfS50YWJzLmlzLWNlbnRlcmVkIHVse2p1c3RpZnktY29udGVudDpjZW50ZXJ9LnRhYnMuaXMtcmlnaHQgdWx7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfS50YWJzLmlzLWJveGVkIGF7Ym9yZGVyOjFweCBzb2xpZCB0cmFuc3BhcmVudDtib3JkZXItcmFkaXVzOjNweCAzcHggMCAwfS50YWJzLmlzLWJveGVkIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1ib3R0b20tY29sb3I6I2RiZGJkYn0udGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNkYmRiZGI7Ym9yZGVyLWJvdHRvbS1jb2xvcjp0cmFuc3BhcmVudCAhaW1wb3J0YW50fS50YWJzLmlzLWZ1bGx3aWR0aCBsaXtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowfS50YWJzLmlzLXRvZ2dsZSBhe2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjttYXJnaW4tYm90dG9tOjA7cG9zaXRpb246cmVsYXRpdmV9LnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1jb2xvcjojYjViNWI1O3otaW5kZXg6Mn0udGFicy5pcy10b2dnbGUgbGkrbGl7bWFyZ2luLWxlZnQ6LTFweH0udGFicy5pcy10b2dnbGUgbGk6Zmlyc3QtY2hpbGQgYXtib3JkZXItcmFkaXVzOjNweCAwIDAgM3B4fS50YWJzLmlzLXRvZ2dsZSBsaTpsYXN0LWNoaWxkIGF7Ym9yZGVyLXJhZGl1czowIDNweCAzcHggMH0udGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGF7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2JvcmRlci1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmY7ei1pbmRleDoxfS50YWJzLmlzLXRvZ2dsZSB1bHtib3JkZXItYm90dG9tOm5vbmV9LnRhYnMuaXMtc21hbGx7Zm9udC1zaXplOi43NXJlbX0udGFicy5pcy1tZWRpdW17Zm9udC1zaXplOjEuMjVyZW19LnRhYnMuaXMtbGFyZ2V7Zm9udC1zaXplOjEuNXJlbX0uY29sdW1ue2Rpc3BsYXk6YmxvY2s7ZmxleC1iYXNpczowO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7cGFkZGluZzowLjc1cmVtfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW5hcnJvd3tmbGV4Om5vbmV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtZnVsbHtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy10aHJlZS1xdWFydGVyc3tmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLXR3by10aGlyZHN7ZmxleDpub25lO3dpZHRoOjY2LjY2NjYlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLWhhbGZ7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vbmUtdGhpcmR7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9uZS1xdWFydGVye2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LXRocmVlLXF1YXJ0ZXJze21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtdHdvLXRoaXJkc3ttYXJnaW4tbGVmdDo2Ni42NjY2JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtaGFsZnttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LW9uZS10aGlyZHttYXJnaW4tbGVmdDozMy4zMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtb25lLXF1YXJ0ZXJ7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTF7ZmxleDpub25lO3dpZHRoOjguMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC0xe21hcmdpbi1sZWZ0OjguMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTJ7ZmxleDpub25lO3dpZHRoOjE2LjY2NjY3JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtMnttYXJnaW4tbGVmdDoxNi42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtM3tmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC0ze21hcmdpbi1sZWZ0OjI1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy00e2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTR7bWFyZ2luLWxlZnQ6MzMuMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTV7ZmxleDpub25lO3dpZHRoOjQxLjY2NjY3JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtNXttYXJnaW4tbGVmdDo0MS42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtNntmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC02e21hcmdpbi1sZWZ0OjUwJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy03e2ZsZXg6bm9uZTt3aWR0aDo1OC4zMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTd7bWFyZ2luLWxlZnQ6NTguMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTh7ZmxleDpub25lO3dpZHRoOjY2LjY2NjY3JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtOHttYXJnaW4tbGVmdDo2Ni42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtOXtmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC05e21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0xMHtmbGV4Om5vbmU7d2lkdGg6ODMuMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC0xMHttYXJnaW4tbGVmdDo4My4zMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtMTF7ZmxleDpub25lO3dpZHRoOjkxLjY2NjY3JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtMTF7bWFyZ2luLWxlZnQ6OTEuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTEye2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC0xMnttYXJnaW4tbGVmdDoxMDAlfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuY29sdW1uLmlzLW5hcnJvdy1tb2JpbGV7ZmxleDpub25lfS5jb2x1bW4uaXMtZnVsbC1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbi5pcy10aHJlZS1xdWFydGVycy1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLXR3by10aGlyZHMtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2JX0uY29sdW1uLmlzLWhhbGYtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vbmUtdGhpcmQtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzJX0uY29sdW1uLmlzLW9uZS1xdWFydGVyLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LXRocmVlLXF1YXJ0ZXJzLW1vYmlsZXttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtdHdvLXRoaXJkcy1tb2JpbGV7bWFyZ2luLWxlZnQ6NjYuNjY2NiV9LmNvbHVtbi5pcy1vZmZzZXQtaGFsZi1tb2JpbGV7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LW9uZS10aGlyZC1tb2JpbGV7bWFyZ2luLWxlZnQ6MzMuMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXF1YXJ0ZXItbW9iaWxle21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTEtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC0xLW1vYmlsZXttYXJnaW4tbGVmdDo4LjMzMzMzJX0uY29sdW1uLmlzLTItbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMi1tb2JpbGV7bWFyZ2luLWxlZnQ6MTYuNjY2NjclfS5jb2x1bW4uaXMtMy1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC0zLW1vYmlsZXttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy00LW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTQtbW9iaWxle21hcmdpbi1sZWZ0OjMzLjMzMzMzJX0uY29sdW1uLmlzLTUtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtNS1tb2JpbGV7bWFyZ2luLWxlZnQ6NDEuNjY2NjclfS5jb2x1bW4uaXMtNi1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9mZnNldC02LW1vYmlsZXttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy03LW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NTguMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTctbW9iaWxle21hcmdpbi1sZWZ0OjU4LjMzMzMzJX0uY29sdW1uLmlzLTgtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtOC1tb2JpbGV7bWFyZ2luLWxlZnQ6NjYuNjY2NjclfS5jb2x1bW4uaXMtOS1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLW9mZnNldC05LW1vYmlsZXttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy0xMC1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjgzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC0xMC1tb2JpbGV7bWFyZ2luLWxlZnQ6ODMuMzMzMzMlfS5jb2x1bW4uaXMtMTEtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo5MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMTEtbW9iaWxle21hcmdpbi1sZWZ0OjkxLjY2NjY3JX0uY29sdW1uLmlzLTEyLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLW9mZnNldC0xMi1tb2JpbGV7bWFyZ2luLWxlZnQ6MTAwJX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5jb2x1bW4uaXMtbmFycm93LC5jb2x1bW4uaXMtbmFycm93LXRhYmxldHtmbGV4Om5vbmV9LmNvbHVtbi5pcy1mdWxsLC5jb2x1bW4uaXMtZnVsbC10YWJsZXR7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbi5pcy10aHJlZS1xdWFydGVycywuY29sdW1uLmlzLXRocmVlLXF1YXJ0ZXJzLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtdHdvLXRoaXJkcywuY29sdW1uLmlzLXR3by10aGlyZHMtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2JX0uY29sdW1uLmlzLWhhbGYsLmNvbHVtbi5pcy1oYWxmLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb25lLXRoaXJkLC5jb2x1bW4uaXMtb25lLXRoaXJkLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMyV9LmNvbHVtbi5pcy1vbmUtcXVhcnRlciwuY29sdW1uLmlzLW9uZS1xdWFydGVyLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LXRocmVlLXF1YXJ0ZXJzLC5jb2x1bW4uaXMtb2Zmc2V0LXRocmVlLXF1YXJ0ZXJzLXRhYmxldHttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtdHdvLXRoaXJkcywuY29sdW1uLmlzLW9mZnNldC10d28tdGhpcmRzLXRhYmxldHttYXJnaW4tbGVmdDo2Ni42NjY2JX0uY29sdW1uLmlzLW9mZnNldC1oYWxmLC5jb2x1bW4uaXMtb2Zmc2V0LWhhbGYtdGFibGV0e21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmQsLmNvbHVtbi5pcy1vZmZzZXQtb25lLXRoaXJkLXRhYmxldHttYXJnaW4tbGVmdDozMy4zMzMzJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtcXVhcnRlciwuY29sdW1uLmlzLW9mZnNldC1vbmUtcXVhcnRlci10YWJsZXR7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtMSwuY29sdW1uLmlzLTEtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC0xLC5jb2x1bW4uaXMtb2Zmc2V0LTEtdGFibGV0e21hcmdpbi1sZWZ0OjguMzMzMzMlfS5jb2x1bW4uaXMtMiwuY29sdW1uLmlzLTItdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMiwuY29sdW1uLmlzLW9mZnNldC0yLXRhYmxldHttYXJnaW4tbGVmdDoxNi42NjY2NyV9LmNvbHVtbi5pcy0zLC5jb2x1bW4uaXMtMy10YWJsZXR7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC0zLC5jb2x1bW4uaXMtb2Zmc2V0LTMtdGFibGV0e21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTQsLmNvbHVtbi5pcy00LXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTQsLmNvbHVtbi5pcy1vZmZzZXQtNC10YWJsZXR7bWFyZ2luLWxlZnQ6MzMuMzMzMzMlfS5jb2x1bW4uaXMtNSwuY29sdW1uLmlzLTUtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtNSwuY29sdW1uLmlzLW9mZnNldC01LXRhYmxldHttYXJnaW4tbGVmdDo0MS42NjY2NyV9LmNvbHVtbi5pcy02LC5jb2x1bW4uaXMtNi10YWJsZXR7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9mZnNldC02LC5jb2x1bW4uaXMtb2Zmc2V0LTYtdGFibGV0e21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLTcsLmNvbHVtbi5pcy03LXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NTguMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTcsLmNvbHVtbi5pcy1vZmZzZXQtNy10YWJsZXR7bWFyZ2luLWxlZnQ6NTguMzMzMzMlfS5jb2x1bW4uaXMtOCwuY29sdW1uLmlzLTgtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtOCwuY29sdW1uLmlzLW9mZnNldC04LXRhYmxldHttYXJnaW4tbGVmdDo2Ni42NjY2NyV9LmNvbHVtbi5pcy05LC5jb2x1bW4uaXMtOS10YWJsZXR7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLW9mZnNldC05LC5jb2x1bW4uaXMtb2Zmc2V0LTktdGFibGV0e21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLTEwLC5jb2x1bW4uaXMtMTAtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMTAsLmNvbHVtbi5pcy1vZmZzZXQtMTAtdGFibGV0e21hcmdpbi1sZWZ0OjgzLjMzMzMzJX0uY29sdW1uLmlzLTExLC5jb2x1bW4uaXMtMTEtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo5MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMTEsLmNvbHVtbi5pcy1vZmZzZXQtMTEtdGFibGV0e21hcmdpbi1sZWZ0OjkxLjY2NjY3JX0uY29sdW1uLmlzLTEyLC5jb2x1bW4uaXMtMTItdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtb2Zmc2V0LTEyLC5jb2x1bW4uaXMtb2Zmc2V0LTEyLXRhYmxldHttYXJnaW4tbGVmdDoxMDAlfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5jb2x1bW4uaXMtbmFycm93LWRlc2t0b3B7ZmxleDpub25lfS5jb2x1bW4uaXMtZnVsbC1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtdGhyZWUtcXVhcnRlcnMtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtdHdvLXRoaXJkcy1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2JX0uY29sdW1uLmlzLWhhbGYtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb25lLXRoaXJkLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMlfS5jb2x1bW4uaXMtb25lLXF1YXJ0ZXItZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LXRocmVlLXF1YXJ0ZXJzLWRlc2t0b3B7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LXR3by10aGlyZHMtZGVza3RvcHttYXJnaW4tbGVmdDo2Ni42NjY2JX0uY29sdW1uLmlzLW9mZnNldC1oYWxmLWRlc2t0b3B7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LW9uZS10aGlyZC1kZXNrdG9we21hcmdpbi1sZWZ0OjMzLjMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LW9uZS1xdWFydGVyLWRlc2t0b3B7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtMS1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC0xLWRlc2t0b3B7bWFyZ2luLWxlZnQ6OC4zMzMzMyV9LmNvbHVtbi5pcy0yLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjE2LjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC0yLWRlc2t0b3B7bWFyZ2luLWxlZnQ6MTYuNjY2NjclfS5jb2x1bW4uaXMtMy1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtMy1kZXNrdG9we21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTQtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTQtZGVza3RvcHttYXJnaW4tbGVmdDozMy4zMzMzMyV9LmNvbHVtbi5pcy01LWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjQxLjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC01LWRlc2t0b3B7bWFyZ2luLWxlZnQ6NDEuNjY2NjclfS5jb2x1bW4uaXMtNi1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtNi1kZXNrdG9we21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLTctZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NTguMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTctZGVza3RvcHttYXJnaW4tbGVmdDo1OC4zMzMzMyV9LmNvbHVtbi5pcy04LWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjY2LjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC04LWRlc2t0b3B7bWFyZ2luLWxlZnQ6NjYuNjY2NjclfS5jb2x1bW4uaXMtOS1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtOS1kZXNrdG9we21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLTEwLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjgzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC0xMC1kZXNrdG9we21hcmdpbi1sZWZ0OjgzLjMzMzMzJX0uY29sdW1uLmlzLTExLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjkxLjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC0xMS1kZXNrdG9we21hcmdpbi1sZWZ0OjkxLjY2NjY3JX0uY29sdW1uLmlzLTEyLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbi5pcy1vZmZzZXQtMTItZGVza3RvcHttYXJnaW4tbGVmdDoxMDAlfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMTkycHgpey5jb2x1bW4uaXMtbmFycm93LXdpZGVzY3JlZW57ZmxleDpub25lfS5jb2x1bW4uaXMtZnVsbC13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtdGhyZWUtcXVhcnRlcnMtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtdHdvLXRoaXJkcy13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2JX0uY29sdW1uLmlzLWhhbGYtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb25lLXRoaXJkLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjMzLjMzMzMlfS5jb2x1bW4uaXMtb25lLXF1YXJ0ZXItd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LXRocmVlLXF1YXJ0ZXJzLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LXR3by10aGlyZHMtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo2Ni42NjY2JX0uY29sdW1uLmlzLW9mZnNldC1oYWxmLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LW9uZS10aGlyZC13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjMzLjMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LW9uZS1xdWFydGVyLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtMS13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC0xLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6OC4zMzMzMyV9LmNvbHVtbi5pcy0yLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjE2LjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC0yLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6MTYuNjY2NjclfS5jb2x1bW4uaXMtMy13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtMy13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTQtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTQtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDozMy4zMzMzMyV9LmNvbHVtbi5pcy01LXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjQxLjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC01LXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NDEuNjY2NjclfS5jb2x1bW4uaXMtNi13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtNi13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLTctd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NTguMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTctd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo1OC4zMzMzMyV9LmNvbHVtbi5pcy04LXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjY2LjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC04LXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NjYuNjY2NjclfS5jb2x1bW4uaXMtOS13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtOS13aWRlc2NyZWVue21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLTEwLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjgzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC0xMC13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjgzLjMzMzMzJX0uY29sdW1uLmlzLTExLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjkxLjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC0xMS13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjkxLjY2NjY3JX0uY29sdW1uLmlzLTEyLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbi5pcy1vZmZzZXQtMTItd2lkZXNjcmVlbnttYXJnaW4tbGVmdDoxMDAlfX0uY29sdW1uc3ttYXJnaW4tbGVmdDotMC43NXJlbTttYXJnaW4tcmlnaHQ6LTAuNzVyZW07bWFyZ2luLXRvcDotMC43NXJlbX0uY29sdW1uczpsYXN0LWNoaWxke21hcmdpbi1ib3R0b206LTAuNzVyZW19LmNvbHVtbnM6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNzVyZW19LmNvbHVtbnMuaXMtY2VudGVyZWR7anVzdGlmeS1jb250ZW50OmNlbnRlcn0uY29sdW1ucy5pcy1nYXBsZXNze21hcmdpbi1sZWZ0OjA7bWFyZ2luLXJpZ2h0OjA7bWFyZ2luLXRvcDowfS5jb2x1bW5zLmlzLWdhcGxlc3M6bGFzdC1jaGlsZHttYXJnaW4tYm90dG9tOjB9LmNvbHVtbnMuaXMtZ2FwbGVzczpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5jb2x1bW5zLmlzLWdhcGxlc3M+LmNvbHVtbnttYXJnaW46MDtwYWRkaW5nOjB9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5jb2x1bW5zLmlzLWdyaWR7ZmxleC13cmFwOndyYXB9LmNvbHVtbnMuaXMtZ3JpZD4uY29sdW1ue21heC13aWR0aDozMy4zMzMzJTtwYWRkaW5nOjAuNzVyZW07d2lkdGg6MzMuMzMzMyV9LmNvbHVtbnMuaXMtZ3JpZD4uY29sdW1uKy5jb2x1bW57bWFyZ2luLWxlZnQ6MH19LmNvbHVtbnMuaXMtbW9iaWxle2Rpc3BsYXk6ZmxleH0uY29sdW1ucy5pcy1tdWx0aWxpbmV7ZmxleC13cmFwOndyYXB9LmNvbHVtbnMuaXMtdmNlbnRlcmVke2FsaWduLWl0ZW1zOmNlbnRlcn1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmNvbHVtbnM6bm90KC5pcy1kZXNrdG9wKXtkaXNwbGF5OmZsZXh9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmNvbHVtbnMuaXMtZGVza3RvcHtkaXNwbGF5OmZsZXh9fS50aWxle2FsaWduLWl0ZW1zOnN0cmV0Y2g7ZGlzcGxheTpibG9jaztmbGV4LWJhc2lzOjA7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MTttaW4taGVpZ2h0Om1pbi1jb250ZW50fS50aWxlLmlzLWFuY2VzdG9ye21hcmdpbi1sZWZ0Oi0wLjc1cmVtO21hcmdpbi1yaWdodDotMC43NXJlbTttYXJnaW4tdG9wOi0wLjc1cmVtfS50aWxlLmlzLWFuY2VzdG9yOmxhc3QtY2hpbGR7bWFyZ2luLWJvdHRvbTotMC43NXJlbX0udGlsZS5pcy1hbmNlc3Rvcjpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX0udGlsZS5pcy1jaGlsZHttYXJnaW46MCAhaW1wb3J0YW50fS50aWxlLmlzLXBhcmVudHtwYWRkaW5nOjAuNzVyZW19LnRpbGUuaXMtdmVydGljYWx7ZmxleC1kaXJlY3Rpb246Y29sdW1ufS50aWxlLmlzLXZlcnRpY2FsPi50aWxlLmlzLWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW0gIWltcG9ydGFudH1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LnRpbGU6bm90KC5pcy1jaGlsZCl7ZGlzcGxheTpmbGV4fS50aWxlLmlzLTF7ZmxleDpub25lO3dpZHRoOjguMzMzMzMlfS50aWxlLmlzLTJ7ZmxleDpub25lO3dpZHRoOjE2LjY2NjY3JX0udGlsZS5pcy0ze2ZsZXg6bm9uZTt3aWR0aDoyNSV9LnRpbGUuaXMtNHtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMzMlfS50aWxlLmlzLTV7ZmxleDpub25lO3dpZHRoOjQxLjY2NjY3JX0udGlsZS5pcy02e2ZsZXg6bm9uZTt3aWR0aDo1MCV9LnRpbGUuaXMtN3tmbGV4Om5vbmU7d2lkdGg6NTguMzMzMzMlfS50aWxlLmlzLTh7ZmxleDpub25lO3dpZHRoOjY2LjY2NjY3JX0udGlsZS5pcy05e2ZsZXg6bm9uZTt3aWR0aDo3NSV9LnRpbGUuaXMtMTB7ZmxleDpub25lO3dpZHRoOjgzLjMzMzMzJX0udGlsZS5pcy0xMXtmbGV4Om5vbmU7d2lkdGg6OTEuNjY2NjclfS50aWxlLmlzLTEye2ZsZXg6bm9uZTt3aWR0aDoxMDAlfX0uaGVyby12aWRlb3tib3R0b206MDtsZWZ0OjA7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDt0b3A6MDtvdmVyZmxvdzpoaWRkZW59Lmhlcm8tdmlkZW8gdmlkZW97bGVmdDo1MCU7bWluLWhlaWdodDoxMDAlO21pbi13aWR0aDoxMDAlO3Bvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7dHJhbnNmb3JtOnRyYW5zbGF0ZTNkKC01MCUsIC01MCUsIDApfS5oZXJvLXZpZGVvLmlzLXRyYW5zcGFyZW50e29wYWNpdHk6MC4zfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby12aWRlb3tkaXNwbGF5Om5vbmV9fS5oZXJvLWJ1dHRvbnN7bWFyZ2luLXRvcDoxLjVyZW19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLWJ1dHRvbnMgLmJ1dHRvbntkaXNwbGF5OmZsZXh9Lmhlcm8tYnV0dG9ucyAuYnV0dG9uOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7Lmhlcm8tYnV0dG9uc3tkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmNlbnRlcn0uaGVyby1idXR0b25zIC5idXR0b246bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6MS41cmVtfX0uaGVyby1oZWFkLC5oZXJvLWZvb3R7ZmxleC1ncm93OjA7ZmxleC1zaHJpbms6MH0uaGVyby1ib2R5e2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjA7cGFkZGluZzozcmVtIDEuNXJlbX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMTkycHgpey5oZXJvLWJvZHl7cGFkZGluZy1sZWZ0OjA7cGFkZGluZy1yaWdodDowfX0uaGVyb3thbGlnbi1pdGVtczpzdHJldGNoO2JhY2tncm91bmQtY29sb3I6I2ZmZjtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVufS5oZXJvIC5uYXZ7YmFja2dyb3VuZDpub25lO2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDIxOSwyMTksMjE5LDAuMyl9Lmhlcm8gLnRhYnMgdWx7Ym9yZGVyLWJvdHRvbTpub25lfS5oZXJvLmlzLXdoaXRle2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5oZXJvLmlzLXdoaXRlIGEsLmhlcm8uaXMtd2hpdGUgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtd2hpdGUgLnRpdGxle2NvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtd2hpdGUgLnN1YnRpdGxle2NvbG9yOnJnYmEoMTAsMTAsMTAsMC45KX0uaGVyby5pcy13aGl0ZSAuc3VidGl0bGUgYSwuaGVyby5pcy13aGl0ZSAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtd2hpdGUgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgxMCwxMCwxMCwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy13aGl0ZSAubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjojZmZmfX0uaGVyby5pcy13aGl0ZSBhLm5hdi1pdGVtLC5oZXJvLmlzLXdoaXRlIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDEwLDEwLDEwLDAuNyl9Lmhlcm8uaXMtd2hpdGUgYS5uYXYtaXRlbTpob3ZlciwuaGVyby5pcy13aGl0ZSBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy13aGl0ZSAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtd2hpdGUgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pLmlzLWFjdGl2ZXtjb2xvcjojMGEwYTBhfS5oZXJvLmlzLXdoaXRlIC50YWJzIGF7Y29sb3I6IzBhMGEwYTtvcGFjaXR5OjAuOX0uaGVyby5pcy13aGl0ZSAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy13aGl0ZSAudGFicyBsaS5pcy1hY3RpdmUgYXtvcGFjaXR5OjF9Lmhlcm8uaXMtd2hpdGUgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy13aGl0ZSAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojMGEwYTBhfS5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLWJveGVkIGE6aG92ZXIsLmhlcm8uaXMtd2hpdGUgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtd2hpdGUgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtd2hpdGUgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsLmhlcm8uaXMtd2hpdGUgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Ym9yZGVyLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0uaGVyby5pcy13aGl0ZS5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgI2U2ZTZlNiAwJSwgI2ZmZiA3MSUsICNmZmYgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXdoaXRlIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhfS5oZXJvLmlzLXdoaXRlIC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXdoaXRlIC5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjIpfX0uaGVyby5pcy1ibGFja3tiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0uaGVyby5pcy1ibGFjayBhLC5oZXJvLmlzLWJsYWNrIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLWJsYWNrIC50aXRsZXtjb2xvcjojZmZmfS5oZXJvLmlzLWJsYWNrIC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuOSl9Lmhlcm8uaXMtYmxhY2sgLnN1YnRpdGxlIGEsLmhlcm8uaXMtYmxhY2sgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojZmZmfS5oZXJvLmlzLWJsYWNrIC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtYmxhY2sgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6IzBhMGEwYX19Lmhlcm8uaXMtYmxhY2sgYS5uYXYtaXRlbSwuaGVyby5pcy1ibGFjayAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbil7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjcpfS5oZXJvLmlzLWJsYWNrIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtYmxhY2sgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtYmxhY2sgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pOmhvdmVyLC5oZXJvLmlzLWJsYWNrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0uaGVyby5pcy1ibGFjayAudGFicyBhe2NvbG9yOiNmZmY7b3BhY2l0eTowLjl9Lmhlcm8uaXMtYmxhY2sgLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtYmxhY2sgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6I2ZmZn0uaGVyby5pcy1ibGFjayAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1ibGFjayAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtYmxhY2suaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICMwMDAgMCUsICMwYTBhMGEgNzElLCAjMTgxNjE2IDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1ibGFjayAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1ibGFjayAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1ibGFjayAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC4yKX19Lmhlcm8uaXMtbGlnaHR7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiMzNjM2MzZ9Lmhlcm8uaXMtbGlnaHQgYSwuaGVyby5pcy1saWdodCBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1saWdodCAudGl0bGV7Y29sb3I6IzM2MzYzNn0uaGVyby5pcy1saWdodCAuc3VidGl0bGV7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjkpfS5oZXJvLmlzLWxpZ2h0IC5zdWJ0aXRsZSBhLC5oZXJvLmlzLWxpZ2h0IC5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6IzM2MzYzNn0uaGVyby5pcy1saWdodCAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDU0LDU0LDU0LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWxpZ2h0IC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9fS5oZXJvLmlzLWxpZ2h0IGEubmF2LWl0ZW0sLmhlcm8uaXMtbGlnaHQgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoNTQsNTQsNTQsMC43KX0uaGVyby5pcy1saWdodCBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLWxpZ2h0IGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLWxpZ2h0IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1saWdodCAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiMzNjM2MzZ9Lmhlcm8uaXMtbGlnaHQgLnRhYnMgYXtjb2xvcjojMzYzNjM2O29wYWNpdHk6MC45fS5oZXJvLmlzLWxpZ2h0IC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLWxpZ2h0IC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1saWdodCAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiMzNjM2MzZ9Lmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1saWdodCAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1saWdodCAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1saWdodCAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1saWdodCAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtib3JkZXItY29sb3I6IzM2MzYzNjtjb2xvcjojZjVmNWY1fS5oZXJvLmlzLWxpZ2h0LmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjZGZkOGQ4IDAlLCAjZjVmNWY1IDcxJSwgI2ZmZiAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtbGlnaHQgLm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzZ9Lmhlcm8uaXMtbGlnaHQgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtbGlnaHQgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDU0LDU0LDU0LDAuMil9fS5oZXJvLmlzLWRhcmt7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayBhLC5oZXJvLmlzLWRhcmsgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtZGFyayAudGl0bGV7Y29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1kYXJrIC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDI0NSwyNDUsMjQ1LDAuOSl9Lmhlcm8uaXMtZGFyayAuc3VidGl0bGUgYSwuaGVyby5pcy1kYXJrIC5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1kYXJrIC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjQ1LDI0NSwyNDUsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtZGFyayAubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2fX0uaGVyby5pcy1kYXJrIGEubmF2LWl0ZW0sLmhlcm8uaXMtZGFyayAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbil7Y29sb3I6cmdiYSgyNDUsMjQ1LDI0NSwwLjcpfS5oZXJvLmlzLWRhcmsgYS5uYXYtaXRlbTpob3ZlciwuaGVyby5pcy1kYXJrIGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLWRhcmsgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pOmhvdmVyLC5oZXJvLmlzLWRhcmsgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pLmlzLWFjdGl2ZXtjb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgLnRhYnMgYXtjb2xvcjojZjVmNWY1O29wYWNpdHk6MC45fS5oZXJvLmlzLWRhcmsgLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtZGFyayAudGFicyBsaS5pcy1hY3RpdmUgYXtvcGFjaXR5OjF9Lmhlcm8uaXMtZGFyayAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1kYXJrIC50YWJzLmlzLWJveGVkIGE6aG92ZXIsLmhlcm8uaXMtZGFyayAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1kYXJrIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsLmhlcm8uaXMtZGFyayAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtZGFyayAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1jb2xvcjojZjVmNWY1O2NvbG9yOiMzNjM2MzZ9Lmhlcm8uaXMtZGFyay5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgIzFmMTkxOSAwJSwgIzM2MzYzNiA3MSUsICM0NjNmM2YgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWRhcmsgLm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1kYXJrIC5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1kYXJrIC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDI0NSwyNDUsMjQ1LDAuMil9fS5oZXJvLmlzLXByaW1hcnl7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSBhLC5oZXJvLmlzLXByaW1hcnkgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtcHJpbWFyeSAudGl0bGV7Y29sb3I6I2ZmZn0uaGVyby5pcy1wcmltYXJ5IC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuOSl9Lmhlcm8uaXMtcHJpbWFyeSAuc3VidGl0bGUgYSwuaGVyby5pcy1wcmltYXJ5IC5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6I2ZmZn0uaGVyby5pcy1wcmltYXJ5IC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtcHJpbWFyeSAubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczfX0uaGVyby5pcy1wcmltYXJ5IGEubmF2LWl0ZW0sLmhlcm8uaXMtcHJpbWFyeSAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbil7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjcpfS5oZXJvLmlzLXByaW1hcnkgYS5uYXYtaXRlbTpob3ZlciwuaGVyby5pcy1wcmltYXJ5IGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLXByaW1hcnkgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pOmhvdmVyLC5oZXJvLmlzLXByaW1hcnkgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pLmlzLWFjdGl2ZXtjb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgLnRhYnMgYXtjb2xvcjojZmZmO29wYWNpdHk6MC45fS5oZXJvLmlzLXByaW1hcnkgLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtcHJpbWFyeSAudGFicyBsaS5pcy1hY3RpdmUgYXtvcGFjaXR5OjF9Lmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6I2ZmZn0uaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLWJveGVkIGE6aG92ZXIsLmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsLmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiMxODJiNzN9Lmhlcm8uaXMtcHJpbWFyeS5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgIzBiMjQ0ZCAwJSwgIzE4MmI3MyA3MSUsICMxODFkOGMgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXByaW1hcnkgLm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1wcmltYXJ5IC5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1wcmltYXJ5IC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuMil9fS5oZXJvLmlzLWluZm97YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjO2NvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyBhLC5oZXJvLmlzLWluZm8gc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtaW5mbyAudGl0bGV7Y29sb3I6I2ZmZn0uaGVyby5pcy1pbmZvIC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuOSl9Lmhlcm8uaXMtaW5mbyAuc3VidGl0bGUgYSwuaGVyby5pcy1pbmZvIC5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6I2ZmZn0uaGVyby5pcy1pbmZvIC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtaW5mbyAubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjfX0uaGVyby5pcy1pbmZvIGEubmF2LWl0ZW0sLmhlcm8uaXMtaW5mbyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbil7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjcpfS5oZXJvLmlzLWluZm8gYS5uYXYtaXRlbTpob3ZlciwuaGVyby5pcy1pbmZvIGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLWluZm8gLm5hdi1pdGVtIGE6bm90KC5idXR0b24pOmhvdmVyLC5oZXJvLmlzLWluZm8gLm5hdi1pdGVtIGE6bm90KC5idXR0b24pLmlzLWFjdGl2ZXtjb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gLnRhYnMgYXtjb2xvcjojZmZmO29wYWNpdHk6MC45fS5oZXJvLmlzLWluZm8gLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtaW5mbyAudGFicyBsaS5pcy1hY3RpdmUgYXtvcGFjaXR5OjF9Lmhlcm8uaXMtaW5mbyAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6I2ZmZn0uaGVyby5pcy1pbmZvIC50YWJzLmlzLWJveGVkIGE6aG92ZXIsLmhlcm8uaXMtaW5mbyAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1pbmZvIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsLmhlcm8uaXMtaW5mbyAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtaW5mbyAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiMzMjczZGN9Lmhlcm8uaXMtaW5mby5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgIzE1NzdjNiAwJSwgIzMyNzNkYyA3MSUsICM0MzY2ZTUgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWluZm8gLm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1pbmZvIC5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1pbmZvIC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuMil9fS5oZXJvLmlzLXN1Y2Nlc3N7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwO2NvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyBhLC5oZXJvLmlzLXN1Y2Nlc3Mgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtc3VjY2VzcyAudGl0bGV7Y29sb3I6I2ZmZn0uaGVyby5pcy1zdWNjZXNzIC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuOSl9Lmhlcm8uaXMtc3VjY2VzcyAuc3VidGl0bGUgYSwuaGVyby5pcy1zdWNjZXNzIC5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6I2ZmZn0uaGVyby5pcy1zdWNjZXNzIC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtc3VjY2VzcyAubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwfX0uaGVyby5pcy1zdWNjZXNzIGEubmF2LWl0ZW0sLmhlcm8uaXMtc3VjY2VzcyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbil7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjcpfS5oZXJvLmlzLXN1Y2Nlc3MgYS5uYXYtaXRlbTpob3ZlciwuaGVyby5pcy1zdWNjZXNzIGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pOmhvdmVyLC5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pLmlzLWFjdGl2ZXtjb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMgYXtjb2xvcjojZmZmO29wYWNpdHk6MC45fS5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtc3VjY2VzcyAudGFicyBsaS5pcy1hY3RpdmUgYXtvcGFjaXR5OjF9Lmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6I2ZmZn0uaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLWJveGVkIGE6aG92ZXIsLmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsLmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiMyM2QxNjB9Lmhlcm8uaXMtc3VjY2Vzcy5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgIzEyYWYyZiAwJSwgIzIzZDE2MCA3MSUsICMyY2UyOGEgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1zdWNjZXNzIC5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1zdWNjZXNzIC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuMil9fS5oZXJvLmlzLXdhcm5pbmd7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIGEsLmhlcm8uaXMtd2FybmluZyBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy13YXJuaW5nIC50aXRsZXtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyAuc3VidGl0bGV7Y29sb3I6cmdiYSgwLDAsMCwwLjkpfS5oZXJvLmlzLXdhcm5pbmcgLnN1YnRpdGxlIGEsLmhlcm8uaXMtd2FybmluZyAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMCwwLDAsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtd2FybmluZyAubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3fX0uaGVyby5pcy13YXJuaW5nIGEubmF2LWl0ZW0sLmhlcm8uaXMtd2FybmluZyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbil7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgYS5uYXYtaXRlbTpob3ZlciwuaGVyby5pcy13YXJuaW5nIGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLXdhcm5pbmcgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pOmhvdmVyLC5oZXJvLmlzLXdhcm5pbmcgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pLmlzLWFjdGl2ZXtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyAudGFicyBhe2NvbG9yOnJnYmEoMCwwLDAsMC43KTtvcGFjaXR5OjAuOX0uaGVyby5pcy13YXJuaW5nIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLXdhcm5pbmcgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLWJveGVkIGE6aG92ZXIsLmhlcm8uaXMtd2FybmluZyAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsLmhlcm8uaXMtd2FybmluZyAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtd2FybmluZyAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLDAuNyk7Ym9yZGVyLWNvbG9yOnJnYmEoMCwwLDAsMC43KTtjb2xvcjojZmZkZDU3fS5oZXJvLmlzLXdhcm5pbmcuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICNmZmFmMjQgMCUsICNmZmRkNTcgNzElLCAjZmZmYTcwIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy13YXJuaW5nIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy13YXJuaW5nIC5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMCwwLDAsMC4yKX19Lmhlcm8uaXMtZGFuZ2Vye2JhY2tncm91bmQtY29sb3I6cmVkO2NvbG9yOiNmZmZ9Lmhlcm8uaXMtZGFuZ2VyIGEsLmhlcm8uaXMtZGFuZ2VyIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLWRhbmdlciAudGl0bGV7Y29sb3I6I2ZmZn0uaGVyby5pcy1kYW5nZXIgLnN1YnRpdGxle2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC45KX0uaGVyby5pcy1kYW5nZXIgLnN1YnRpdGxlIGEsLmhlcm8uaXMtZGFuZ2VyIC5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6I2ZmZn0uaGVyby5pcy1kYW5nZXIgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1kYW5nZXIgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6cmVkfX0uaGVyby5pcy1kYW5nZXIgYS5uYXYtaXRlbSwuaGVyby5pcy1kYW5nZXIgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC43KX0uaGVyby5pcy1kYW5nZXIgYS5uYXYtaXRlbTpob3ZlciwuaGVyby5pcy1kYW5nZXIgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtZGFuZ2VyIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1kYW5nZXIgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pLmlzLWFjdGl2ZXtjb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAudGFicyBhe2NvbG9yOiNmZmY7b3BhY2l0eTowLjl9Lmhlcm8uaXMtZGFuZ2VyIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLWRhbmdlciAudGFicyBsaS5pcy1hY3RpdmUgYXtvcGFjaXR5OjF9Lmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmZmZ9Lmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLWJveGVkIGE6aG92ZXIsLmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWRhbmdlciAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsLmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjpyZWR9Lmhlcm8uaXMtZGFuZ2VyLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjYzAyIDAlLCByZWQgNzElLCAjZmY0MDFhIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1kYW5nZXIgLm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtZGFuZ2VyIC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWRhbmdlciAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtZGFuZ2VyIC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuMil9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaGVyby5pcy1tZWRpdW0gLmhlcm8tYm9keXtwYWRkaW5nLWJvdHRvbTo5cmVtO3BhZGRpbmctdG9wOjlyZW19fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaGVyby5pcy1sYXJnZSAuaGVyby1ib2R5e3BhZGRpbmctYm90dG9tOjE4cmVtO3BhZGRpbmctdG9wOjE4cmVtfX0uaGVyby5pcy1mdWxsaGVpZ2h0e21pbi1oZWlnaHQ6MTAwdmh9Lmhlcm8uaXMtZnVsbGhlaWdodCAuaGVyby1ib2R5e2FsaWduLWl0ZW1zOmNlbnRlcjtkaXNwbGF5OmZsZXh9Lmhlcm8uaXMtZnVsbGhlaWdodCAuaGVyby1ib2R5Pi5jb250YWluZXJ7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MX0uc2VjdGlvbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7cGFkZGluZzozcmVtIDEuNXJlbX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5zZWN0aW9uLmlzLW1lZGl1bXtwYWRkaW5nOjlyZW0gMS41cmVtfS5zZWN0aW9uLmlzLWxhcmdle3BhZGRpbmc6MThyZW0gMS41cmVtfX0uZm9vdGVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtwYWRkaW5nOjNyZW0gMS41cmVtIDZyZW19LmhlYWRlci5pcy1maXhlZC10b3B7ei1pbmRleDoxMDMwO3Bvc2l0aW9uOmZpeGVkO3RvcDowO2xlZnQ6MDtyaWdodDowfS5oYXMtZml4ZWQtbmF2e21hcmdpbi10b3A6NTBweH0uc2VjdGlvbi5pcy1zbWFsbHtwYWRkaW5nOjFyZW0gMS41cmVtfS50ZXh0YXJlYS5pcy1mbHVpZHttaW4taGVpZ2h0OjFlbTtvdmVyZmxvdzpoaWRkZW47cmVzaXplOm5vbmU7dHJhbnNpdGlvbjptaW4taGVpZ2h0IDAuM3N9LnRleHRhcmVhLmlzLWZsdWlkOmZvY3Vze21pbi1oZWlnaHQ6NmVtO292ZXJmbG93OmF1dG99Lm5hdi1pbnZlcnNle2JhY2tncm91bmQ6IzE4MmI3M30ubmF2LWludmVyc2UgYS5uYXYtaXRlbXtjb2xvcjojZjJmMmYyfS5uYXYtaW52ZXJzZSBhLm5hdi1pdGVtOmhvdmVye2NvbG9yOiNkMWQ1ZTN9Lm5hdi1pbnZlcnNlIGEubmF2LWl0ZW0uaXMtYWN0aXZle2NvbG9yOiNmZmZ9Lm5hdi1pbnZlcnNlIGEubmF2LWl0ZW0uaXMtdGFiOmhvdmVye2JvcmRlci1ib3R0b20tY29sb3I6I2ZmZn0ubmF2LWludmVyc2UgYS5uYXYtaXRlbS5pcy10YWIuaXMtYWN0aXZle2JvcmRlci1ib3R0b206M3B4IHNvbGlkICNmZmY7Y29sb3I6I2ZmZn0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXJ7cG9zaXRpb246Zml4ZWQ7dG9wOjA7Ym90dG9tOjA7ei1pbmRleDoxMDQwO292ZXJmbG93LXk6YXV0bzt0ZXh0LWFsaWduOmNlbnRlcjtiYWNrZ3JvdW5kOiMxODJiNzM7Y29sb3I6I2ZmZjtsZWZ0Oi0yNTBweDt3aWR0aDoyNTBweDt0cmFuc2l0aW9uOmxlZnQgMC41c30ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIuaXMtYWN0aXZle2xlZnQ6MH0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgLm5hdi1pdGVte2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6YmxvY2s7cGFkZGluZy10b3A6MTBweDtwYWRkaW5nLWJvdHRvbTo5cHg7YmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LDAuMSl9Lm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyIC5uYXYtaXRlbS5pcy1hY3RpdmV7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsIHJnYmEoMjU1LDI1NSwyNTUsMC40KSwgcmdiYSgyNTUsMjU1LDI1NSwwLjEpIDUlKX0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgLm5hdi1pdGVtW29wZW5dPnN1bW1hcnl7bWFyZ2luLWJvdHRvbTo5cHh9Lm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyIC5uYXYtaXRlbTpub3QoOmxhc3QtY2hpbGQpe2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNmZmZ9Lm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyIH4gLmlzLW92ZXJsYXl7YmFja2dyb3VuZDpyZ2JhKDAsMCwwLDAuNSk7ei1pbmRleDoxMDM1O3Zpc2liaWxpdHk6aGlkZGVuO3Bvc2l0aW9uOmZpeGVkO29wYWNpdHk6MDt0cmFuc2l0aW9uOm9wYWNpdHkgMC43NXN9Lm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyLmlzLWFjdGl2ZSB+IC5pcy1vdmVybGF5e3Zpc2liaWxpdHk6dmlzaWJsZTtvcGFjaXR5OjF9I2NvbnRhaW5lcj5kaXY6bm90KC52aXNpYmxlKXtkaXNwbGF5Om5vbmV9I2NvbnRhaW5lcj5kaXZ7cG9zaXRpb246cmVsYXRpdmU7aGVpZ2h0OmNhbGMoMTAwdmggLSA1MHB4KTtvdmVyZmxvdy15OmF1dG87LXdlYmtpdC1vdmVyZmxvdy1zY3JvbGxpbmc6dG91Y2h9XFxuXCIgK1xyXG4gICAgJzwvc3R5bGU+JztcclxuXHJcbi8vIFNob3cgdGhlIG1lbnUgd2hlbiBjbGlja2luZyBvbiB0aGUgbWVudSBidXR0b25cclxuQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubmF2LXNsaWRlci10b2dnbGUnKSlcclxuICAgIC5mb3JFYWNoKGVsID0+IGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdG9nZ2xlTWVudSkpO1xyXG5cclxuLy8gSGlkZSB0aGUgbWVudSB3aGVuIGNsaWNraW5nIHRoZSBvdmVybGF5XHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uYXYtc2xpZGVyLWNvbnRhaW5lciAuaXMtb3ZlcmxheScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdG9nZ2xlTWVudSk7XHJcblxyXG4vLyBDaGFuZ2UgdGFic1xyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGdsb2JhbFRhYkNoYW5nZShldmVudCkge1xyXG4gICAgdmFyIHRhYk5hbWUgPSBldmVudC50YXJnZXQuZGF0YXNldC50YWJOYW1lO1xyXG4gICAgdmFyIHRhYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNjb250YWluZXIgPiBbZGF0YS10YWItbmFtZT0ke3RhYk5hbWV9XWApO1xyXG4gICAgaWYoIXRhYk5hbWUgfHwgIXRhYikge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvL0NvbnRlbnRcclxuICAgIC8vV2UgY2FuJ3QganVzdCByZW1vdmUgdGhlIGZpcnN0IGR1ZSB0byBicm93c2VyIGxhZ1xyXG4gICAgQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjY29udGFpbmVyID4gLnZpc2libGUnKSlcclxuICAgICAgICAuZm9yRWFjaChlbCA9PiBlbC5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJykpO1xyXG4gICAgdGFiLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcclxuXHJcbiAgICAvL1RhYnNcclxuICAgIEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyIC5pcy1hY3RpdmUnKSlcclxuICAgICAgICAuZm9yRWFjaChlbCA9PiBlbC5jbGFzc0xpc3QucmVtb3ZlKCdpcy1hY3RpdmUnKSk7XHJcbiAgICBldmVudC50YXJnZXQuY2xhc3NMaXN0LmFkZCgnaXMtYWN0aXZlJyk7XHJcblxyXG4gICAgaG9vay5maXJlKCd1aS50YWJTaG93bicsIHRhYik7XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2hvdy9oaWRlIHRoZSBtZW51LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB0b2dnbGVNZW51KCk7XHJcbiAqL1xyXG5mdW5jdGlvbiB0b2dnbGVNZW51KCkge1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyJykuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtYWN0aXZlJyk7XHJcbn1cclxuXHJcbnZhciB0YWJVSUQgPSAwO1xyXG4vKipcclxuICogVXNlZCB0byBhZGQgYSB0YWIgdG8gdGhlIGJvdCdzIG5hdmlnYXRpb24uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB0YWIgPSB1aS5hZGRUYWIoJ1RleHQnKTtcclxuICogdmFyIHRhYjIgPSB1aS5hZGRUYWIoJ0N1c3RvbSBNZXNzYWdlcycsICdtZXNzYWdlcycpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFiVGV4dFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2dyb3VwTmFtZT1tYWluXSBPcHRpb25hbC4gSWYgcHJvdmlkZWQsIHRoZSBuYW1lIG9mIHRoZSBncm91cCBvZiB0YWJzIHRvIGFkZCB0aGlzIHRhYiB0by5cclxuICogQHJldHVybiB7Tm9kZX0gLSBUaGUgZGl2IHRvIHBsYWNlIHRhYiBjb250ZW50IGluLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkVGFiKHRhYlRleHQsIGdyb3VwTmFtZSA9ICdtYWluJykge1xyXG4gICAgdmFyIHRhYk5hbWUgPSAnYm90VGFiXycgKyB0YWJVSUQrKztcclxuXHJcbiAgICB2YXIgdGFiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgdGFiLnRleHRDb250ZW50ID0gdGFiVGV4dDtcclxuICAgIHRhYi5jbGFzc0xpc3QuYWRkKCduYXYtaXRlbScpO1xyXG4gICAgdGFiLmRhdGFzZXQudGFiTmFtZSA9IHRhYk5hbWU7XHJcblxyXG4gICAgdmFyIHRhYkNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRhYkNvbnRlbnQuZGF0YXNldC50YWJOYW1lID0gdGFiTmFtZTtcclxuXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAubmF2LXNsaWRlci1jb250YWluZXIgW2RhdGEtdGFiLWdyb3VwPSR7Z3JvdXBOYW1lfV1gKS5hcHBlbmRDaGlsZCh0YWIpO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NvbnRhaW5lcicpLmFwcGVuZENoaWxkKHRhYkNvbnRlbnQpO1xyXG5cclxuICAgIHJldHVybiB0YWJDb250ZW50O1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYSBnbG9iYWwgdGFiLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgdGFiID0gdWkuYWRkVGFiKCdUYWInKTtcclxuICogdWkucmVtb3ZlVGFiKHRhYik7XHJcbiAqIEBwYXJhbSB7Tm9kZX0gdGFiQ29udGVudCBUaGUgZGl2IHJldHVybmVkIGJ5IHRoZSBhZGRUYWIgZnVuY3Rpb24uXHJcbiAqL1xyXG5mdW5jdGlvbiByZW1vdmVUYWIodGFiQ29udGVudCkge1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLm5hdi1zbGlkZXItY29udGFpbmVyIFtkYXRhLXRhYi1uYW1lPSR7dGFiQ29udGVudC5kYXRhc2V0LnRhYk5hbWV9XWApLnJlbW92ZSgpO1xyXG4gICAgdGFiQ29udGVudC5yZW1vdmUoKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgdGFiIGdyb3VwIGluIHdoaWNoIHRhYnMgY2FuIGJlIHBsYWNlZC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdWkuYWRkVGFiR3JvdXAoJ0dyb3VwIFRleHQnLCAnc29tZV9ncm91cCcpO1xyXG4gKiB1aS5hZGRUYWIoJ1dpdGhpbiBncm91cCcsICdzb21lX2dyb3VwJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGhlIHRleHQgdGhlIHVzZXIgd2lsbCBzZWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBncm91cCB3aGljaCBjYW4gYmUgdXNlZCB0byBhZGQgdGFicyB3aXRoaW4gdGhlIGdyb3VwLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudCA9IG1haW5dIC0gVGhlIG5hbWUgb2YgdGhlIHBhcmVudCBncm91cC5cclxuICovXHJcbmZ1bmN0aW9uIGFkZFRhYkdyb3VwKHRleHQsIGdyb3VwTmFtZSwgcGFyZW50ID0gJ21haW4nKSB7XHJcbiAgICB2YXIgZGV0YWlscyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKTtcclxuICAgIGRldGFpbHMuY2xhc3NMaXN0LmFkZCgnbmF2LWl0ZW0nKTtcclxuICAgIGRldGFpbHMuZGF0YXNldC50YWJHcm91cCA9IGdyb3VwTmFtZTtcclxuXHJcbiAgICB2YXIgc3VtbWFyeSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N1bW1hcnknKTtcclxuICAgIHN1bW1hcnkudGV4dENvbnRlbnQgPSB0ZXh0O1xyXG4gICAgZGV0YWlscy5hcHBlbmRDaGlsZChzdW1tYXJ5KTtcclxuXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAubmF2LXNsaWRlci1jb250YWluZXIgW2RhdGEtdGFiLWdyb3VwPVwiJHtwYXJlbnR9XCJdYCkuYXBwZW5kQ2hpbGQoZGV0YWlscyk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIHRhYiBncm91cCBhbmQgYWxsIHRhYnMgY29udGFpbmVkIHdpdGhpbiB0aGUgc3BlY2lmaWVkIGdyb3VwLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBhZGRUYWJHcm91cCgnR3JvdXAnLCAnZ3JvdXAxJyk7XHJcbiAqIHZhciBpbm5lciA9IGFkZFRhYignSW5uZXInLCAnZ3JvdXAxJyk7XHJcbiAqIHJlbW92ZVRhYkdyb3VwKCdncm91cDEnKTsgLy8gaW5uZXIgaGFzIGJlZW4gcmVtb3ZlZC5cclxuICogQHBhcmFtIHN0cmluZyBncm91cE5hbWUgdGhlIG5hbWUgb2YgdGhlIGdyb3VwIHRoYXQgd2FzIHVzZWQgaW4gdWkuYWRkVGFiR3JvdXAuXHJcbiAqL1xyXG5mdW5jdGlvbiByZW1vdmVUYWJHcm91cChncm91cE5hbWUpIHtcclxuICAgIHZhciBncm91cCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5uYXYtc2xpZGVyLWNvbnRhaW5lciBbZGF0YS10YWItZ3JvdXA9XCIke2dyb3VwTmFtZX1cIl1gKTtcclxuICAgIHZhciBpdGVtcyA9IEFycmF5LmZyb20oZ3JvdXAucXVlcnlTZWxlY3RvckFsbCgnc3BhbicpKTtcclxuXHJcbiAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIC8vVGFiIGNvbnRlbnRcclxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjY29udGFpbmVyID4gW2RhdGEtdGFiLW5hbWU9XCIke2l0ZW0uZGF0YXNldC50YWJOYW1lfVwiXWApLnJlbW92ZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZ3JvdXAucmVtb3ZlKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdG9nZ2xlTWVudSxcclxuICAgIGFkZFRhYixcclxuICAgIHJlbW92ZVRhYixcclxuICAgIGFkZFRhYkdyb3VwLFxyXG4gICAgcmVtb3ZlVGFiR3JvdXAsXHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYWxlcnRcclxufTtcclxuXHJcbnZhciBtb2RhbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCcpO1xyXG5cclxuLyoqXHJcbiogRnVuY3Rpb24gdXNlZCB0byByZXF1aXJlIGFjdGlvbiBmcm9tIHRoZSB1c2VyLlxyXG4qXHJcbiogQHBhcmFtIHtTdHJpbmd9IGh0bWwgdGhlIGh0bWwgdG8gZGlzcGxheSBpbiB0aGUgYWxlcnRcclxuKiBAcGFyYW0ge0FycmF5fSBidXR0b25zIGFuIGFycmF5IG9mIGJ1dHRvbnMgdG8gYWRkIHRvIHRoZSBhbGVydC5cclxuKiAgICAgICAgRm9ybWF0OiBbe3RleHQ6ICdUZXN0Jywgc3R5bGU6J2lzLXN1Y2Nlc3MnLCBhY3Rpb246IGZ1bmN0aW9uKCl7fSwgdGhpc0FyZzogd2luZG93LCBkaXNtaXNzOiBmYWxzZX1dXHJcbiogICAgICAgIE5vdGU6IHRleHQgaXMgdGhlIG9ubHkgcmVxdWlyZWQgcGFyYW1hdGVyLiBJZiBubyBidXR0b24gYXJyYXkgaXMgc3BlY2lmaWVkXHJcbiogICAgICAgIHRoZW4gYSBzaW5nbGUgT0sgYnV0dG9uIHdpbGwgYmUgc2hvd24uXHJcbiogICAgICAgIHN0eWxlIGNhbiBhbHNvIGJlIGFuIGFycmF5IG9mIGNsYXNzZXMgdG8gYWRkLlxyXG4qICAgICAgICBEZWZhdWx0czogc3R5bGU6ICcnLCBhY3Rpb246IHVuZGVmaW5lZCwgdGhpc0FyZzogdW5kZWZpbmVkLCBkaXNtaXNzOiB0cnVlXHJcbiovXHJcbmZ1bmN0aW9uIGFsZXJ0KGh0bWwsIGJ1dHRvbnMgPSBbe3RleHQ6ICdPSyd9XSkge1xyXG4gICAgaWYgKGluc3RhbmNlLmFjdGl2ZSkge1xyXG4gICAgICAgIGluc3RhbmNlLnF1ZXVlLnB1c2goe2h0bWwsIGJ1dHRvbnN9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpbnN0YW5jZS5hY3RpdmUgPSB0cnVlO1xyXG5cclxuICAgIGJ1dHRvbnMuZm9yRWFjaChmdW5jdGlvbihidXR0b24sIGkpIHtcclxuICAgICAgICBidXR0b24uZGlzbWlzcyA9IChidXR0b24uZGlzbWlzcyA9PT0gZmFsc2UpID8gZmFsc2UgOiB0cnVlO1xyXG4gICAgICAgIGluc3RhbmNlLmJ1dHRvbnNbJ2J1dHRvbl8nICsgaV0gPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogYnV0dG9uLmFjdGlvbixcclxuICAgICAgICAgICAgdGhpc0FyZzogYnV0dG9uLnRoaXNBcmcgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBkaXNtaXNzOiB0eXBlb2YgYnV0dG9uLmRpc21pc3MgPT0gJ2Jvb2xlYW4nID8gYnV0dG9uLmRpc21pc3MgOiB0cnVlLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgYnV0dG9uLmlkID0gJ2J1dHRvbl8nICsgaTtcclxuICAgICAgICBidWlsZEJ1dHRvbihidXR0b24pO1xyXG4gICAgfSk7XHJcbiAgICBtb2RhbC5xdWVyeVNlbGVjdG9yKCcubW9kYWwtY2FyZC1ib2R5JykuaW5uZXJIVE1MID0gaHRtbDtcclxuXHJcbiAgICBtb2RhbC5jbGFzc0xpc3QuYWRkKCdpcy1hY3RpdmUnKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEhvbGRzIHRoZSBjdXJyZW50IGFsZXJ0IGFuZCBxdWV1ZSBvZiBmdXJ0aGVyIGFsZXJ0cy5cclxuICovXHJcbnZhciBpbnN0YW5jZSA9IHtcclxuICAgIGFjdGl2ZTogZmFsc2UsXHJcbiAgICBxdWV1ZTogW10sXHJcbiAgICBidXR0b25zOiB7fSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIGFkZCBidXR0b24gZWxlbWVudHMgdG8gYW4gYWxlcnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBidXR0b25cclxuICovXHJcbmZ1bmN0aW9uIGJ1aWxkQnV0dG9uKGJ1dHRvbikge1xyXG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgZWwuaW5uZXJIVE1MID0gYnV0dG9uLnRleHQ7XHJcblxyXG4gICAgZWwuY2xhc3NMaXN0LmFkZCgnYnV0dG9uJyk7XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShidXR0b24uc3R5bGUpKSB7XHJcbiAgICAgICAgYnV0dG9uLnN0eWxlLmZvckVhY2goc3R5bGUgPT4gZWwuY2xhc3NMaXN0LmFkZChzdHlsZSkpO1xyXG4gICAgfSBlbHNlIGlmIChidXR0b24uc3R5bGUpIHtcclxuICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKGJ1dHRvbi5zdHlsZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZWwuaWQgPSBidXR0b24uaWQ7XHJcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGJ1dHRvbkhhbmRsZXIpO1xyXG4gICAgbW9kYWwucXVlcnlTZWxlY3RvcignLm1vZGFsLWNhcmQtZm9vdCcpLmFwcGVuZENoaWxkKGVsKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGRldGVybWluZSB0aGUgZnVuY3Rpb25hbGl0eSBvZiBlYWNoIGJ1dHRvbiBhZGRlZCB0byBhbiBhbGVydC5cclxuICpcclxuICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudFxyXG4gKi9cclxuZnVuY3Rpb24gYnV0dG9uSGFuZGxlcihldmVudCkge1xyXG4gICAgdmFyIGJ1dHRvbiA9IGluc3RhbmNlLmJ1dHRvbnNbZXZlbnQudGFyZ2V0LmlkXSB8fCB7fTtcclxuICAgIGlmICh0eXBlb2YgYnV0dG9uLmFjdGlvbiA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgYnV0dG9uLmFjdGlvbi5jYWxsKGJ1dHRvbi50aGlzQXJnKTtcclxuICAgIH1cclxuXHJcbiAgICAvL1JlcXVpcmUgdGhhdCB0aGVyZSBiZSBhbiBhY3Rpb24gYXNvY2lhdGVkIHdpdGggbm8tZGlzbWlzcyBidXR0b25zLlxyXG4gICAgaWYgKGJ1dHRvbi5kaXNtaXNzIHx8IHR5cGVvZiBidXR0b24uYWN0aW9uICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBtb2RhbC5jbGFzc0xpc3QucmVtb3ZlKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICBtb2RhbC5xdWVyeVNlbGVjdG9yKCcubW9kYWwtY2FyZC1mb290JykuaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgaW5zdGFuY2UuYnV0dG9ucyA9IHt9O1xyXG4gICAgICAgIGluc3RhbmNlLmFjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBBcmUgbW9yZSBhbGVydHMgd2FpdGluZyB0byBiZSBzaG93bj9cclxuICAgICAgICBpZiAoaW5zdGFuY2UucXVldWUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxldCBuZXh0ID0gaW5zdGFuY2UucXVldWUuc2hpZnQoKTtcclxuICAgICAgICAgICAgYWxlcnQobmV4dC5odG1sLCBuZXh0LmJ1dHRvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJcclxuXHJcbnZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5lbC5pbm5lckhUTUwgPSBcIjxkaXYgaWQ9XFxcImFsZXJ0XFxcIiBjbGFzcz1cXFwibW9kYWxcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJtb2RhbC1iYWNrZ3JvdW5kXFxcIj48L2Rpdj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwibW9kYWwtY2FyZFxcXCI+XFxyXFxuICAgICAgICA8aGVhZGVyIGNsYXNzPVxcXCJtb2RhbC1jYXJkLWhlYWRcXFwiPjwvaGVhZGVyPlxcclxcbiAgICAgICAgPHNlY3Rpb24gY2xhc3M9XFxcIm1vZGFsLWNhcmQtYm9keVxcXCI+PC9zZWN0aW9uPlxcclxcbiAgICAgICAgPGZvb3RlciBjbGFzcz1cXFwibW9kYWwtY2FyZC1mb290XFxcIj48L2Zvb3Rlcj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG5lbC5pbm5lckhUTUwgPSBcIi5ib3Qtbm90aWZpY2F0aW9ue3Bvc2l0aW9uOmZpeGVkO3RvcDowLjZlbTtyaWdodDoxZW07ei1pbmRleDoxMDM1O21pbi13aWR0aDoyMDBweDtib3JkZXItcmFkaXVzOjVweDtwYWRkaW5nOjVweDtiYWNrZ3JvdW5kOiNmZmY7Y29sb3I6IzE4MmI3MztvcGFjaXR5OjA7dHJhbnNpdGlvbjpvcGFjaXR5IDFzfS5ib3Qtbm90aWZpY2F0aW9uLmlzLWFjdGl2ZXtvcGFjaXR5OjF9XFxuXCI7XHJcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxuT2JqZWN0LmFzc2lnbihcclxuICAgIG1vZHVsZS5leHBvcnRzLFxyXG4gICAgcmVxdWlyZSgnLi9hbGVydCcpLFxyXG4gICAgcmVxdWlyZSgnLi9ub3RpZnknKVxyXG4pO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG5vdGlmeSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNlbmQgYSBub24tY3JpdGljYWwgYWxlcnQgdG8gdGhlIHVzZXIuXHJcbiAqIFNob3VsZCBiZSB1c2VkIGluIHBsYWNlIG9mIHVpLmFsZXJ0IGlmIHBvc3NpYmxlIGFzIGl0IGlzIG5vbi1ibG9ja2luZy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogLy9TaG93cyBhIG5vdGZpY2F0aW9uIGZvciAyIHNlY29uZHNcclxuICogdWkubm90aWZ5KCdOb3RpZmljYXRpb24nKTtcclxuICogLy9TaG93cyBhIG5vdGlmaWNhdGlvbiBmb3IgNSBzZWNvbmRzXHJcbiAqIHVpLm5vdGlmeSgnTm90aWZpY2F0aW9uJywgNSk7XHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IHRoZSB0ZXh0IHRvIGRpc3BsYXkuIFNob3VsZCBiZSBrZXB0IHNob3J0IHRvIGF2b2lkIHZpc3VhbGx5IGJsb2NraW5nIHRoZSBtZW51IG9uIHNtYWxsIGRldmljZXMuXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBkaXNwbGF5VGltZSB0aGUgbnVtYmVyIG9mIHNlY29uZHMgdG8gc2hvdyB0aGUgbm90aWZpY2F0aW9uIGZvci5cclxuICovXHJcbmZ1bmN0aW9uIG5vdGlmeSh0ZXh0LCBkaXNwbGF5VGltZSA9IDIpIHtcclxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgZWwuY2xhc3NMaXN0LmFkZCgnYm90LW5vdGlmaWNhdGlvbicsICdpcy1hY3RpdmUnKTtcclxuICAgIGVsLnRleHRDb250ZW50ID0gdGV4dDtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgdmFyIHRpbWVvdXRzID0gW1xyXG4gICAgICAgIC8vIEZhZGUgb3V0IGFmdGVyIGRpc3BsYXlUaW1lXHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QucmVtb3ZlKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB9LmJpbmQoZWwpLCBkaXNwbGF5VGltZSAqIDEwMDApLFxyXG4gICAgICAgIC8vIFJlbW92ZSBhZnRlciBmYWRlIG91dFxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKCk7XHJcbiAgICAgICAgfS5iaW5kKGVsKSwgZGlzcGxheVRpbWUgKiAxMDAwICsgMjEwMClcclxuICAgIF07XHJcblxyXG5cclxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGltZW91dHMuZm9yRWFjaChjbGVhclRpbWVvdXQpO1xyXG4gICAgICAgIHRoaXMucmVtb3ZlKCk7XHJcbiAgICB9KTtcclxufVxyXG4iLCIvL0RldGFpbHMgcG9seWZpbGwsIG9sZGVyIGZpcmVmb3gsIElFXHJcbmlmICghKCdvcGVuJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkZXRhaWxzJykpKSB7XHJcbiAgICBsZXQgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG4gICAgc3R5bGUudGV4dENvbnRlbnQgKz0gYGRldGFpbHM6bm90KFtvcGVuXSkgPiA6bm90KHN1bW1hcnkpIHsgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50OyB9IGRldGFpbHMgPiBzdW1tYXJ5OmJlZm9yZSB7IGNvbnRlbnQ6IFwi4pa2XCI7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgZm9udC1zaXplOiAuOGVtOyB3aWR0aDogMS41ZW07IGZvbnQtZmFtaWx5OlwiQ291cmllciBOZXdcIjsgfSBkZXRhaWxzW29wZW5dID4gc3VtbWFyeTpiZWZvcmUgeyB0cmFuc2Zvcm06IHJvdGF0ZSg5MGRlZyk7IH1gO1xyXG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XHJcblxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LnRhZ05hbWUgPT0gJ1NVTU1BUlknKSB7XHJcbiAgICAgICAgICAgIGxldCBkZXRhaWxzID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWRldGFpbHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGRldGFpbHMuZ2V0QXR0cmlidXRlKCdvcGVuJykpIHtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMub3BlbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5yZW1vdmVBdHRyaWJ1dGUoJ29wZW4nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMub3BlbiA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLnNldEF0dHJpYnV0ZSgnb3BlbicsICdvcGVuJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCIvLyBJRSBGaXhcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGVtcGxhdGUpIHtcclxuICAgIGlmICghKCdjb250ZW50JyBpbiB0ZW1wbGF0ZSkpIHtcclxuICAgICAgICBsZXQgY29udGVudCA9IHRlbXBsYXRlLmNoaWxkTm9kZXM7XHJcbiAgICAgICAgbGV0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbnRlbnQubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoY29udGVudFtqXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0ZW1wbGF0ZS5jb250ZW50ID0gZnJhZ21lbnQ7XHJcbiAgICB9XHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlLFxyXG59O1xyXG5cclxudmFyIHBvbHlmaWxsID0gcmVxdWlyZSgndWkvcG9seWZpbGxzL3RlbXBsYXRlJyk7XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBjbG9uZSBhIHRlbXBsYXRlIGFmdGVyIGFsdGVyaW5nIHRoZSBwcm92aWRlZCBydWxlcy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjdGVtcGxhdGUnLCAnI3RhcmdldCcsIFt7c2VsZWN0b3I6ICdpbnB1dCcsIHZhbHVlOiAnVmFsdWUnfV0pO1xyXG4gKiB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJ3RlbXBsYXRlJywgJ2RpdicsIFt7c2VsZWN0b3I6ICdhJywgcmVtb3ZlOiBbJ2hyZWYnXSwgbXVsdGlwbGU6IHRydWV9XSk7XHJcbiAqIEBwYXJhbSB7U3RyaW5nfE5vZGV9IHRlbXBsYXRlXHJcbiAqIEBwYXJhbSB7U3RyaW5nfE5vZGV9IHRhcmdldFxyXG4gKiBAcGFyYW0ge0FycmF5fSBydWxlcyBmb3JtYXQ6IGFycmF5IG9mIG9iamVjdHNcclxuICogICAgICBlYWNoIG9iamVjdCBtdXN0IGhhdmUgXCJzZWxlY3RvclwiLlxyXG4gKiAgICAgIGVhY2ggb2JqZWN0IGNhbiBoYXZlIFwibXVsdGlwbGVcIiBzZXQgdG8gdXBkYXRlIGFsbCBtYXRjaGluZyBlbGVtZW50cy5cclxuICogICAgICBlYWNoIG9iamVjdCBjYW4gaGF2ZSBcInJlbW92ZVwiIC0gYW4gYXJyYXkgb2YgYXR0cmlidXRlcyB0byByZW1vdmUuXHJcbiAqICAgICAgZWFjaCBvYmplY3QgY2FuIGhhdmUgXCJ0ZXh0XCIgb3IgXCJodG1sXCIgLSBmdXJ0aGVyIGtleXMgd2lsbCBiZSBzZXQgYXMgYXR0cmlidXRlcy5cclxuICogICAgICBpZiBib3RoIHRleHQgYW5kIGh0bWwgYXJlIHNldCwgdGV4dCB3aWxsIHRha2UgcHJlY2VuZGVuY2UuXHJcbiAqICAgICAgcnVsZXMgd2lsbCBiZSBwYXJzZWQgaW4gdGhlIG9yZGVyIHRoYXQgdGhleSBhcmUgcHJlc2VudCBpbiB0aGUgYXJyYXkuXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZENvbnRlbnRGcm9tVGVtcGxhdGUodGVtcGxhdGUsIHRhcmdldCwgcnVsZXMgPSBbXSkge1xyXG4gICAgaWYgKHR5cGVvZiB0ZW1wbGF0ZSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0ZW1wbGF0ZSk7XHJcbiAgICB9XHJcbiAgICBpZiAodHlwZW9mIHRhcmdldCA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHRhcmdldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGFyZ2V0KTtcclxuICAgIH1cclxuXHJcbiAgICBwb2x5ZmlsbCh0ZW1wbGF0ZSk7XHJcblxyXG4gICAgdmFyIGNvbnRlbnQgPSB0ZW1wbGF0ZS5jb250ZW50O1xyXG5cclxuICAgIHJ1bGVzLmZvckVhY2gocnVsZSA9PiBoYW5kbGVSdWxlKGNvbnRlbnQsIHJ1bGUpKTtcclxuXHJcbiAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuaW1wb3J0Tm9kZShjb250ZW50LCB0cnVlKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBhcHBseSBydWxlcyB0byB0aGUgdGVtcGxhdGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Tm9kZX0gY29udGVudCAtIHRoZSBjb250ZW50IG9mIHRoZSB0ZW1wbGF0ZS5cclxuICogQHBhcmFtIHtPYmplY3R9IHJ1bGUgLSB0aGUgcnVsZSB0byBhcHBseS5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZVJ1bGUoY29udGVudCwgcnVsZSkge1xyXG4gICAgaWYgKHJ1bGUubXVsdGlwbGUpIHtcclxuICAgICAgICBsZXQgZWxzID0gY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKHJ1bGUuc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICBBcnJheS5mcm9tKGVscylcclxuICAgICAgICAgICAgLmZvckVhY2goZWwgPT4gdXBkYXRlRWxlbWVudChlbCwgcnVsZSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgZWwgPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3IocnVsZS5zZWxlY3Rvcik7XHJcbiAgICAgICAgaWYgKCFlbCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFVuYWJsZSB0byB1cGRhdGUgJHtydWxlLnNlbGVjdG9yfS5gLCBydWxlKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlRWxlbWVudChlbCwgcnVsZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byB1cGRhdGUgYW4gZWxlbWVudCB3aXRoIGEgcnVsZS5cclxuICpcclxuICogQHBhcmFtIHtOb2RlfSBlbCB0aGUgZWxlbWVudCB0byBhcHBseSB0aGUgcnVsZXMgdG8uXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBydWxlIHRoZSBydWxlIG9iamVjdC5cclxuICovXHJcbmZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQoZWwsIHJ1bGUpIHtcclxuICAgIGlmICgndGV4dCcgaW4gcnVsZSkge1xyXG4gICAgICAgIGVsLnRleHRDb250ZW50ID0gcnVsZS50ZXh0O1xyXG4gICAgfSBlbHNlIGlmICgnaHRtbCcgaW4gcnVsZSkge1xyXG4gICAgICAgIGVsLmlubmVySFRNTCA9IHJ1bGUuaHRtbDtcclxuICAgIH1cclxuXHJcbiAgICBPYmplY3Qua2V5cyhydWxlKVxyXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+ICFbJ3NlbGVjdG9yJywgJ3RleHQnLCAnaHRtbCcsICdyZW1vdmUnLCAnbXVsdGlwbGUnXS5pbmNsdWRlcyhrZXkpKVxyXG4gICAgICAgIC5mb3JFYWNoKGtleSA9PiBlbC5zZXRBdHRyaWJ1dGUoa2V5LCBydWxlW2tleV0pKTtcclxuXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShydWxlLnJlbW92ZSkpIHtcclxuICAgICAgICBydWxlLnJlbW92ZS5mb3JFYWNoKGtleSA9PiBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5KSk7XHJcbiAgICB9XHJcbn1cclxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBjb21wYXJlIGFuZCBpc0J1ZmZlciB0YWtlbiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2Jsb2IvNjgwZTllNWU0ODhmMjJhYWMyNzU5OWE1N2RjODQ0YTYzMTU5MjhkZC9pbmRleC5qc1xuLy8gb3JpZ2luYWwgbm90aWNlOlxuXG4vKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5mdW5jdGlvbiBjb21wYXJlKGEsIGIpIHtcbiAgaWYgKGEgPT09IGIpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIHZhciB4ID0gYS5sZW5ndGg7XG4gIHZhciB5ID0gYi5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV07XG4gICAgICB5ID0gYltpXTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuICBpZiAoeSA8IHgpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGlzQnVmZmVyKGIpIHtcbiAgaWYgKGdsb2JhbC5CdWZmZXIgJiYgdHlwZW9mIGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlcihiKTtcbiAgfVxuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKTtcbn1cblxuLy8gYmFzZWQgb24gbm9kZSBhc3NlcnQsIG9yaWdpbmFsIG5vdGljZTpcblxuLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBmdW5jdGlvbnNIYXZlTmFtZXMgPSAoZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZnVuY3Rpb24gZm9vKCkge30ubmFtZSA9PT0gJ2Zvbyc7XG59KCkpO1xuZnVuY3Rpb24gcFRvU3RyaW5nIChvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopO1xufVxuZnVuY3Rpb24gaXNWaWV3KGFycmJ1Zikge1xuICBpZiAoaXNCdWZmZXIoYXJyYnVmKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIGdsb2JhbC5BcnJheUJ1ZmZlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyLmlzVmlldyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBBcnJheUJ1ZmZlci5pc1ZpZXcoYXJyYnVmKTtcbiAgfVxuICBpZiAoIWFycmJ1Zikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoYXJyYnVmIGluc3RhbmNlb2YgRGF0YVZpZXcpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoYXJyYnVmLmJ1ZmZlciAmJiBhcnJidWYuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG52YXIgcmVnZXggPSAvXFxzKmZ1bmN0aW9uXFxzKyhbXlxcKFxcc10qKVxccyovO1xuLy8gYmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2xqaGFyYi9mdW5jdGlvbi5wcm90b3R5cGUubmFtZS9ibG9iL2FkZWVlZWM4YmZjYzYwNjhiMTg3ZDdkOWZiM2Q1YmIxZDNhMzA4OTkvaW1wbGVtZW50YXRpb24uanNcbmZ1bmN0aW9uIGdldE5hbWUoZnVuYykge1xuICBpZiAoIXV0aWwuaXNGdW5jdGlvbihmdW5jKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoZnVuY3Rpb25zSGF2ZU5hbWVzKSB7XG4gICAgcmV0dXJuIGZ1bmMubmFtZTtcbiAgfVxuICB2YXIgc3RyID0gZnVuYy50b1N0cmluZygpO1xuICB2YXIgbWF0Y2ggPSBzdHIubWF0Y2gocmVnZXgpO1xuICByZXR1cm4gbWF0Y2ggJiYgbWF0Y2hbMV07XG59XG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH0gZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gZ2V0TmFtZShzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodHlwZW9mIHMgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5mdW5jdGlvbiBpbnNwZWN0KHNvbWV0aGluZykge1xuICBpZiAoZnVuY3Rpb25zSGF2ZU5hbWVzIHx8ICF1dGlsLmlzRnVuY3Rpb24oc29tZXRoaW5nKSkge1xuICAgIHJldHVybiB1dGlsLmluc3BlY3Qoc29tZXRoaW5nKTtcbiAgfVxuICB2YXIgcmF3bmFtZSA9IGdldE5hbWUoc29tZXRoaW5nKTtcbiAgdmFyIG5hbWUgPSByYXduYW1lID8gJzogJyArIHJhd25hbWUgOiAnJztcbiAgcmV0dXJuICdbRnVuY3Rpb24nICsgIG5hbWUgKyAnXSc7XG59XG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKGluc3BlY3Qoc2VsZi5hY3R1YWwpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoaW5zcGVjdChzZWxmLmV4cGVjdGVkKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgZmFsc2UpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmFzc2VydC5kZWVwU3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBkZWVwU3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgdHJ1ZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwU3RyaWN0RXF1YWwnLCBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBzdHJpY3QsIG1lbW9zKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGlzQnVmZmVyKGFjdHVhbCkgJiYgaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGNvbXBhcmUoYWN0dWFsLCBleHBlY3RlZCkgPT09IDA7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKChhY3R1YWwgPT09IG51bGwgfHwgdHlwZW9mIGFjdHVhbCAhPT0gJ29iamVjdCcpICYmXG4gICAgICAgICAgICAgKGV4cGVjdGVkID09PSBudWxsIHx8IHR5cGVvZiBleHBlY3RlZCAhPT0gJ29iamVjdCcpKSB7XG4gICAgcmV0dXJuIHN0cmljdCA/IGFjdHVhbCA9PT0gZXhwZWN0ZWQgOiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gSWYgYm90aCB2YWx1ZXMgYXJlIGluc3RhbmNlcyBvZiB0eXBlZCBhcnJheXMsIHdyYXAgdGhlaXIgdW5kZXJseWluZ1xuICAvLyBBcnJheUJ1ZmZlcnMgaW4gYSBCdWZmZXIgZWFjaCB0byBpbmNyZWFzZSBwZXJmb3JtYW5jZVxuICAvLyBUaGlzIG9wdGltaXphdGlvbiByZXF1aXJlcyB0aGUgYXJyYXlzIHRvIGhhdmUgdGhlIHNhbWUgdHlwZSBhcyBjaGVja2VkIGJ5XG4gIC8vIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcgKGFrYSBwVG9TdHJpbmcpLiBOZXZlciBwZXJmb3JtIGJpbmFyeVxuICAvLyBjb21wYXJpc29ucyBmb3IgRmxvYXQqQXJyYXlzLCB0aG91Z2gsIHNpbmNlIGUuZy4gKzAgPT09IC0wIGJ1dCB0aGVpclxuICAvLyBiaXQgcGF0dGVybnMgYXJlIG5vdCBpZGVudGljYWwuXG4gIH0gZWxzZSBpZiAoaXNWaWV3KGFjdHVhbCkgJiYgaXNWaWV3KGV4cGVjdGVkKSAmJlxuICAgICAgICAgICAgIHBUb1N0cmluZyhhY3R1YWwpID09PSBwVG9TdHJpbmcoZXhwZWN0ZWQpICYmXG4gICAgICAgICAgICAgIShhY3R1YWwgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHxcbiAgICAgICAgICAgICAgIGFjdHVhbCBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkpIHtcbiAgICByZXR1cm4gY29tcGFyZShuZXcgVWludDhBcnJheShhY3R1YWwuYnVmZmVyKSxcbiAgICAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheShleHBlY3RlZC5idWZmZXIpKSA9PT0gMDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2UgaWYgKGlzQnVmZmVyKGFjdHVhbCkgIT09IGlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBtZW1vcyA9IG1lbW9zIHx8IHthY3R1YWw6IFtdLCBleHBlY3RlZDogW119O1xuXG4gICAgdmFyIGFjdHVhbEluZGV4ID0gbWVtb3MuYWN0dWFsLmluZGV4T2YoYWN0dWFsKTtcbiAgICBpZiAoYWN0dWFsSW5kZXggIT09IC0xKSB7XG4gICAgICBpZiAoYWN0dWFsSW5kZXggPT09IG1lbW9zLmV4cGVjdGVkLmluZGV4T2YoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1lbW9zLmFjdHVhbC5wdXNoKGFjdHVhbCk7XG4gICAgbWVtb3MuZXhwZWN0ZWQucHVzaChleHBlY3RlZCk7XG5cbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCwgc3RyaWN0LCBtZW1vcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYiwgc3RyaWN0LCBhY3R1YWxWaXNpdGVkT2JqZWN0cykge1xuICBpZiAoYSA9PT0gbnVsbCB8fCBhID09PSB1bmRlZmluZWQgfHwgYiA9PT0gbnVsbCB8fCBiID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBpZiBvbmUgaXMgYSBwcmltaXRpdmUsIHRoZSBvdGhlciBtdXN0IGJlIHNhbWVcbiAgaWYgKHV0aWwuaXNQcmltaXRpdmUoYSkgfHwgdXRpbC5pc1ByaW1pdGl2ZShiKSlcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgaWYgKHN0cmljdCAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYSkgIT09IE9iamVjdC5nZXRQcm90b3R5cGVPZihiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIHZhciBhSXNBcmdzID0gaXNBcmd1bWVudHMoYSk7XG4gIHZhciBiSXNBcmdzID0gaXNBcmd1bWVudHMoYik7XG4gIGlmICgoYUlzQXJncyAmJiAhYklzQXJncykgfHwgKCFhSXNBcmdzICYmIGJJc0FyZ3MpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGFJc0FyZ3MpIHtcbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIsIHN0cmljdCk7XG4gIH1cbiAgdmFyIGthID0gb2JqZWN0S2V5cyhhKTtcbiAgdmFyIGtiID0gb2JqZWN0S2V5cyhiKTtcbiAgdmFyIGtleSwgaTtcbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT09IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldLCBzdHJpY3QsIGFjdHVhbFZpc2l0ZWRPYmplY3RzKSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIGZhbHNlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG5hc3NlcnQubm90RGVlcFN0cmljdEVxdWFsID0gbm90RGVlcFN0cmljdEVxdWFsO1xuZnVuY3Rpb24gbm90RGVlcFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgdHJ1ZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwU3RyaWN0RXF1YWwnLCBub3REZWVwU3RyaWN0RXF1YWwpO1xuICB9XG59XG5cblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIElnbm9yZS4gIFRoZSBpbnN0YW5jZW9mIGNoZWNrIGRvZXNuJ3Qgd29yayBmb3IgYXJyb3cgZnVuY3Rpb25zLlxuICB9XG5cbiAgaWYgKEVycm9yLmlzUHJvdG90eXBlT2YoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWU7XG59XG5cbmZ1bmN0aW9uIF90cnlCbG9jayhibG9jaykge1xuICB2YXIgZXJyb3I7XG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGVycm9yID0gZTtcbiAgfVxuICByZXR1cm4gZXJyb3I7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh0eXBlb2YgYmxvY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJsb2NrXCIgYXJndW1lbnQgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnc3RyaW5nJykge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICBhY3R1YWwgPSBfdHJ5QmxvY2soYmxvY2spO1xuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgdmFyIHVzZXJQcm92aWRlZE1lc3NhZ2UgPSB0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZyc7XG4gIHZhciBpc1Vud2FudGVkRXhjZXB0aW9uID0gIXNob3VsZFRocm93ICYmIHV0aWwuaXNFcnJvcihhY3R1YWwpO1xuICB2YXIgaXNVbmV4cGVjdGVkRXhjZXB0aW9uID0gIXNob3VsZFRocm93ICYmIGFjdHVhbCAmJiAhZXhwZWN0ZWQ7XG5cbiAgaWYgKChpc1Vud2FudGVkRXhjZXB0aW9uICYmXG4gICAgICB1c2VyUHJvdmlkZWRNZXNzYWdlICYmXG4gICAgICBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHxcbiAgICAgIGlzVW5leHBlY3RlZEV4Y2VwdGlvbikge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cyh0cnVlLCBibG9jaywgZXJyb3IsIG1lc3NhZ2UpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MoZmFsc2UsIGJsb2NrLCBlcnJvciwgbWVzc2FnZSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB0aHJvdyBlcnI7IH07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwiLypnbG9iYWwgd2luZG93LCBnbG9iYWwqL1xudmFyIHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKVxudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIilcbnZhciBub3cgPSByZXF1aXJlKFwiZGF0ZS1ub3dcIilcblxudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlXG52YXIgY29uc29sZVxudmFyIHRpbWVzID0ge31cblxuaWYgKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgJiYgZ2xvYmFsLmNvbnNvbGUpIHtcbiAgICBjb25zb2xlID0gZ2xvYmFsLmNvbnNvbGVcbn0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cuY29uc29sZSkge1xuICAgIGNvbnNvbGUgPSB3aW5kb3cuY29uc29sZVxufSBlbHNlIHtcbiAgICBjb25zb2xlID0ge31cbn1cblxudmFyIGZ1bmN0aW9ucyA9IFtcbiAgICBbbG9nLCBcImxvZ1wiXSxcbiAgICBbaW5mbywgXCJpbmZvXCJdLFxuICAgIFt3YXJuLCBcIndhcm5cIl0sXG4gICAgW2Vycm9yLCBcImVycm9yXCJdLFxuICAgIFt0aW1lLCBcInRpbWVcIl0sXG4gICAgW3RpbWVFbmQsIFwidGltZUVuZFwiXSxcbiAgICBbdHJhY2UsIFwidHJhY2VcIl0sXG4gICAgW2RpciwgXCJkaXJcIl0sXG4gICAgW2NvbnNvbGVBc3NlcnQsIFwiYXNzZXJ0XCJdXG5dXG5cbmZvciAodmFyIGkgPSAwOyBpIDwgZnVuY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHR1cGxlID0gZnVuY3Rpb25zW2ldXG4gICAgdmFyIGYgPSB0dXBsZVswXVxuICAgIHZhciBuYW1lID0gdHVwbGVbMV1cblxuICAgIGlmICghY29uc29sZVtuYW1lXSkge1xuICAgICAgICBjb25zb2xlW25hbWVdID0gZlxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb25zb2xlXG5cbmZ1bmN0aW9uIGxvZygpIHt9XG5cbmZ1bmN0aW9uIGluZm8oKSB7XG4gICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKVxufVxuXG5mdW5jdGlvbiB3YXJuKCkge1xuICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cylcbn1cblxuZnVuY3Rpb24gZXJyb3IoKSB7XG4gICAgY29uc29sZS53YXJuLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cylcbn1cblxuZnVuY3Rpb24gdGltZShsYWJlbCkge1xuICAgIHRpbWVzW2xhYmVsXSA9IG5vdygpXG59XG5cbmZ1bmN0aW9uIHRpbWVFbmQobGFiZWwpIHtcbiAgICB2YXIgdGltZSA9IHRpbWVzW2xhYmVsXVxuICAgIGlmICghdGltZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBzdWNoIGxhYmVsOiBcIiArIGxhYmVsKVxuICAgIH1cblxuICAgIHZhciBkdXJhdGlvbiA9IG5vdygpIC0gdGltZVxuICAgIGNvbnNvbGUubG9nKGxhYmVsICsgXCI6IFwiICsgZHVyYXRpb24gKyBcIm1zXCIpXG59XG5cbmZ1bmN0aW9uIHRyYWNlKCkge1xuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKVxuICAgIGVyci5uYW1lID0gXCJUcmFjZVwiXG4gICAgZXJyLm1lc3NhZ2UgPSB1dGlsLmZvcm1hdC5hcHBseShudWxsLCBhcmd1bWVudHMpXG4gICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2spXG59XG5cbmZ1bmN0aW9uIGRpcihvYmplY3QpIHtcbiAgICBjb25zb2xlLmxvZyh1dGlsLmluc3BlY3Qob2JqZWN0KSArIFwiXFxuXCIpXG59XG5cbmZ1bmN0aW9uIGNvbnNvbGVBc3NlcnQoZXhwcmVzc2lvbikge1xuICAgIGlmICghZXhwcmVzc2lvbikge1xuICAgICAgICB2YXIgYXJyID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXG4gICAgICAgIGFzc2VydC5vayhmYWxzZSwgdXRpbC5mb3JtYXQuYXBwbHkobnVsbCwgYXJyKSlcbiAgICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IG5vd1xuXG5mdW5jdGlvbiBub3coKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpXG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIl19
