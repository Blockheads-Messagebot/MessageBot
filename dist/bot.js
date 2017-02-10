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
tab.innerHTML = '<style>' + "#mb_console{height:calc(100% - 3.5em)}#mb_console .mod>span:first-child{color:#05f529}#mb_console .admin>span:first-child{color:#2b26bd}#mb_console .chat{margin:0 1em;max-height:100%;overflow-y:auto}#mb_console .chat-control{position:fixed;bottom:0;width:100vw}#mb_console .chat-control .control{margin:1em}\n" + '</style>' + "<div id=\"mb_console\">\r\n    <div class=\"chat\">\r\n        <ul></ul>\r\n    </div>\r\n    <div class=\"chat-control\">\r\n        <div class=\"control has-addons\">\r\n            <input type=\"text\" class=\"input is-expanded\"/>\r\n            <button class=\"input button is-primary\">SEND</button>\r\n        </div>\r\n    </div>\r\n</div>\r\n";

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
    getJoins: getJoins,
    getIP: getIP
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

/**
 * Gets the latest IP used by a player
 * 
 * @param {String} name
 * @return {String}
 */
function getIP(name) {
    return isPlayer(name) ? world.players[name.toLocaleUpperCase()].ip : '';
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
        message = message.replace(/{{ip}}/gi, world.getIP(name));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXZcXE1lc3NhZ2VCb3RFeHRlbnNpb24uanMiLCJkZXZcXGJvdFxcY2hlY2tHcm91cC5qcyIsImRldlxcYm90XFxpbmRleC5qcyIsImRldlxcYm90XFxtaWdyYXRpb24uanMiLCJkZXZcXGJvdFxcc2VuZC5qcyIsImRldlxcY29uc29sZVxcZXhwb3J0cy5qcyIsImRldlxcY29uc29sZVxcaW5kZXguanMiLCJkZXZcXGxpYnJhcmllc1xcYWpheC5qcyIsImRldlxcbGlicmFyaWVzXFxiaGZhbnNhcGkuanMiLCJkZXZcXGxpYnJhcmllc1xcYmxvY2toZWFkcy5qcyIsImRldlxcbGlicmFyaWVzXFxob29rLmpzIiwiZGV2XFxsaWJyYXJpZXNcXHN0b3JhZ2UuanMiLCJkZXZcXGxpYnJhcmllc1xcd29ybGQuanMiLCJkZXZcXG1lc3NhZ2VzXFxhbm5vdW5jZW1lbnRzXFxpbmRleC5qcyIsImRldlxcbWVzc2FnZXNcXGhlbHBlcnNcXGJ1aWxkTWVzc2FnZS5qcyIsImRldlxcbWVzc2FnZXNcXGhlbHBlcnNcXGNoZWNrSm9pbnNBbmRHcm91cC5qcyIsImRldlxcbWVzc2FnZXNcXGhlbHBlcnNcXGluZGV4LmpzIiwiZGV2XFxtZXNzYWdlc1xcaGVscGVyc1xcc2hvd1N1bW1hcnkuanMiLCJkZXZcXG1lc3NhZ2VzXFxpbmRleC5qcyIsImRldlxcbWVzc2FnZXNcXGpvaW5cXGluZGV4LmpzIiwiZGV2XFxtZXNzYWdlc1xcbGVhdmVcXGluZGV4LmpzIiwiZGV2XFxtZXNzYWdlc1xcdHJpZ2dlclxcaW5kZXguanMiLCJkZXZcXHNldHRpbmdzXFxib3RcXGluZGV4LmpzIiwiZGV2XFxzZXR0aW5nc1xcYm90XFxwYWdlLmpzIiwiZGV2XFxzZXR0aW5nc1xcZXh0ZW5zaW9uc1xcaW5kZXguanMiLCJkZXZcXHNldHRpbmdzXFxpbmRleC5qcyIsImRldlxcc3RhcnQuanMiLCJkZXZcXHVpXFxpbmRleC5qcyIsImRldlxcdWlcXGxheW91dFxcaW5kZXguanMiLCJkZXZcXHVpXFxub3RpZmljYXRpb25zXFxhbGVydC5qcyIsImRldlxcdWlcXG5vdGlmaWNhdGlvbnNcXGluZGV4LmpzIiwiZGV2XFx1aVxcbm90aWZpY2F0aW9uc1xcbm90aWZ5LmpzIiwiZGV2XFx1aVxccG9seWZpbGxzXFxkZXRhaWxzLmpzIiwiZGV2XFx1aVxccG9seWZpbGxzXFx0ZW1wbGF0ZS5qcyIsImRldlxcdWlcXHRlbXBsYXRlLmpzIiwibm9kZV9tb2R1bGVzL2Fzc2VydC9hc3NlcnQuanMiLCJub2RlX21vZHVsZXMvY29uc29sZS1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RhdGUtbm93L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLE1BQU0sUUFBUSxLQUFSLENBQVo7QUFDQSxJQUFNLGNBQWMsUUFBUSxXQUFSLENBQXBCO0FBQ0EsSUFBTSxLQUFLLFFBQVEsSUFBUixDQUFYO0FBQ0EsSUFBTSxVQUFVLFFBQVEsbUJBQVIsQ0FBaEI7QUFDQSxJQUFNLE9BQU8sUUFBUSxnQkFBUixDQUFiO0FBQ0EsSUFBTSxNQUFNLFFBQVEsc0JBQVIsQ0FBWjtBQUNBLElBQU0sUUFBUSxRQUFRLGlCQUFSLENBQWQ7QUFDQSxJQUFNLE9BQU8sUUFBUSxnQkFBUixDQUFiOztBQUVBO0FBQ0EsSUFBSSxXQUFXLEVBQWY7QUFDQSxJQUFJLFNBQVMsRUFBYjtBQUNBLElBQU0sYUFBYSxlQUFuQjs7QUFHQTs7Ozs7Ozs7O0FBU0EsU0FBUyxtQkFBVCxDQUE2QixTQUE3QixFQUF3QyxT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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMxZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgYm90ID0gcmVxdWlyZSgnYm90Jyk7XHJcbmNvbnN0IGJvdF9jb25zb2xlID0gcmVxdWlyZSgnLi9jb25zb2xlJyk7XHJcbmNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IGFqYXggPSByZXF1aXJlKCdsaWJyYXJpZXMvYWpheCcpO1xyXG5jb25zdCBhcGkgPSByZXF1aXJlKCdsaWJyYXJpZXMvYmxvY2toZWFkcycpO1xyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuXHJcbi8vIEFycmF5IG9mIElEcyB0byBhdXRvbG9hZCBhdCB0aGUgbmV4dCBsYXVuY2guXHJcbnZhciBhdXRvbG9hZCA9IFtdO1xyXG52YXIgbG9hZGVkID0gW107XHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnbWJfZXh0ZW5zaW9ucyc7XHJcblxyXG5cclxuLyoqXHJcbiAqIFVzZWQgdG8gY3JlYXRlIGEgbmV3IGV4dGVuc2lvbi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHRlc3QgPSBNZXNzYWdlQm90RXh0ZW5zaW9uKCd0ZXN0Jyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lc3BhY2UgLSBTaG91bGQgYmUgdGhlIHNhbWUgYXMgeW91ciB2YXJpYWJsZSBuYW1lLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbdW5pbnN0YWxsID0gdW5kZWZpbmVkXSAtIE9wdGlvbmFsLCBzcGVjaWZ5IHRoZSB1bmluc3RhbGwgZnVuY3Rpb24gd2hpbGUgY3JlYXRpbmcgdGhlIGV4dGVuc2lvbiwgaW5zdGVhZCBvZiBsYXRlci4gSWYgc3BlY2lmaWVkIGhlcmUsIHRoaXMgd2lsbCBiZSBib3VuZCB0byB0aGUgZXh0ZW5zaW9uLlxyXG4gKiBAcmV0dXJuIHtNZXNzYWdlQm90RXh0ZW5zaW9ufSAtIFRoZSBleHRlbnNpb24gdmFyaWFibGUuXHJcbiAqL1xyXG5mdW5jdGlvbiBNZXNzYWdlQm90RXh0ZW5zaW9uKG5hbWVzcGFjZSwgdW5pbnN0YWxsKSB7XHJcbiAgICBsb2FkZWQucHVzaChuYW1lc3BhY2UpO1xyXG4gICAgaG9vay5maXJlKCdleHRlbnNpb24uaW5zdGFsbCcsIG5hbWVzcGFjZSk7XHJcblxyXG4gICAgdmFyIGV4dGVuc2lvbiA9IHtcclxuICAgICAgICBpZDogbmFtZXNwYWNlLFxyXG4gICAgICAgIGJvdCxcclxuICAgICAgICBjb25zb2xlOiBib3RfY29uc29sZSxcclxuICAgICAgICB1aSxcclxuICAgICAgICBzdG9yYWdlLFxyXG4gICAgICAgIGFqYXgsXHJcbiAgICAgICAgYXBpLFxyXG4gICAgICAgIHdvcmxkLFxyXG4gICAgICAgIGhvb2ssXHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0eXBlb2YgdW5pbnN0YWxsID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBleHRlbnNpb24udW5pbnN0YWxsID0gdW5pbnN0YWxsLmJpbmQoZXh0ZW5zaW9uKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFVzZWQgdG8gY2hhbmdlIHdoZXRoZXIgb3Igbm90IHRoZSBleHRlbnNpb24gd2lsbCBiZVxyXG4gICAgICogQXV0b21hdGljYWxseSBsb2FkZWQgdGhlIG5leHQgdGltZSB0aGUgYm90IGlzIGxhdW5jaGVkLlxyXG4gICAgICpcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiB2YXIgdGVzdCA9IE1lc3NhZ2VCb3RFeHRlbnNpb24oJ3Rlc3QnKTtcclxuICAgICAqIHRlc3Quc2V0QXV0b0xhdW5jaCh0cnVlKTtcclxuICAgICAqIEBwYXJhbSB7Ym9vbH0gc2hvdWxkQXV0b2xvYWRcclxuICAgICAqL1xyXG4gICAgZXh0ZW5zaW9uLnNldEF1dG9MYXVuY2ggPSBmdW5jdGlvbiBzZXRBdXRvTGF1bmNoKHNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgaWYgKCFhdXRvbG9hZC5pbmNsdWRlcyhuYW1lc3BhY2UpICYmIHNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgICAgIGF1dG9sb2FkLnB1c2gobmFtZXNwYWNlKTtcclxuICAgICAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgYXV0b2xvYWQsIGZhbHNlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKCFzaG91bGRBdXRvbG9hZCkge1xyXG4gICAgICAgICAgICBpZiAoYXV0b2xvYWQuaW5jbHVkZXMobmFtZXNwYWNlKSkge1xyXG4gICAgICAgICAgICAgICAgYXV0b2xvYWQuc3BsaWNlKGF1dG9sb2FkLmluZGV4T2YobmFtZXNwYWNlKSwgMSk7XHJcbiAgICAgICAgICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBhdXRvbG9hZCwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZXh0ZW5zaW9uO1xyXG59XHJcblxyXG4vKipcclxuICogVHJpZXMgdG8gbG9hZCB0aGUgcmVxdWVzdGVkIGV4dGVuc2lvbiBieSBJRC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAqL1xyXG5NZXNzYWdlQm90RXh0ZW5zaW9uLmluc3RhbGwgPSBmdW5jdGlvbiBpbnN0YWxsKGlkKSB7XHJcbiAgICBpZiAoIWxvYWRlZC5pbmNsdWRlcyhpZCkpIHtcclxuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcclxuICAgICAgICBlbC5zcmMgPSBgLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9leHRlbnNpb24vJHtpZH0vY29kZS9yYXdgO1xyXG4gICAgICAgIGVsLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XHJcbiAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVW5pbnN0YWxscyBhbiBleHRlbnNpb24uXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxyXG4gKi9cclxuTWVzc2FnZUJvdEV4dGVuc2lvbi51bmluc3RhbGwgPSBmdW5jdGlvbiB1bmluc3RhbGwoaWQpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2luZG93W2lkXS51bmluc3RhbGwoKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAvL05vdCBpbnN0YWxsZWQsIG9yIG5vIHVuaW5zdGFsbCBmdW5jdGlvbi5cclxuICAgIH1cclxuXHJcbiAgICB3aW5kb3dbaWRdID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIGlmIChhdXRvbG9hZC5pbmNsdWRlcyhpZCkpIHtcclxuICAgICAgICBhdXRvbG9hZC5zcGxpY2UoYXV0b2xvYWQuaW5kZXhPZihpZCksIDEpO1xyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGF1dG9sb2FkLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGxvYWRlZC5pbmNsdWRlcyhpZCkpIHtcclxuICAgICAgICBsb2FkZWQuc3BsaWNlKGxvYWRlZC5pbmRleE9mKGlkKSwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5maXJlKCdleHRlbnNpb24udW5pbnN0YWxsJywgaWQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVzZWQgdG8gY2hlY2sgaWYgYW4gZXh0ZW5zaW9uIGhhcyBiZWVuIGxvYWRlZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5NZXNzYWdlQm90RXh0ZW5zaW9uLmlzTG9hZGVkID0gZnVuY3Rpb24gaXNMb2FkZWQoaWQpIHtcclxuICAgIHJldHVybiBsb2FkZWQuaW5jbHVkZXMoaWQpO1xyXG59O1xyXG5cclxuLy8gTG9hZCBleHRlbnNpb25zIHRoYXQgc2V0IHRoZW1zZWx2ZXMgdG8gYXV0b2xvYWQgbGFzdCBsYXVuY2guXHJcbnN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdLCBmYWxzZSlcclxuICAgIC5mb3JFYWNoKE1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lc3NhZ2VCb3RFeHRlbnNpb247XHJcbiIsIi8qKlxyXG4gKiBAZmlsZSBEZXByaWNhdGVkLiBVc2Ugd29ybGQuaXNbR3JvdXBdIGluc3RlYWQuXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjaGVja0dyb3VwXHJcbn07XHJcblxyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNoZWNrIGlmIHVzZXJzIGFyZSBpbiBkZWZpbmVkIGdyb3Vwcy5cclxuICpcclxuICogQGRlcHJpY2F0ZWRcclxuICogQGV4YW1wbGVcclxuICogY2hlY2tHcm91cCgnYWRtaW4nLCAnU0VSVkVSJykgLy8gdHJ1ZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZ3JvdXAgdGhlIGdyb3VwIHRvIGNoZWNrXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSB1c2VyIHRvIGNoZWNrXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja0dyb3VwKGdyb3VwLCBuYW1lKSB7XHJcbiAgICBjb25zb2xlLndhcm4oJ2JvdC5jaGVja0dyb3VwIGlzIGRlcHJpY2F0ZWQuIFVzZSB3b3JsZC5pc0FkbWluLCB3b3JsZC5pc01vZCwgZXRjLiBpbnN0ZWFkJyk7XHJcblxyXG4gICAgbmFtZSA9IG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIHN3aXRjaCAoZ3JvdXAudG9Mb2NhbGVMb3dlckNhc2UoKSkge1xyXG4gICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1BsYXllcihuYW1lKTtcclxuICAgICAgICBjYXNlICdhZG1pbic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc0FkbWluKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ21vZCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc01vZChuYW1lKTtcclxuICAgICAgICBjYXNlICdzdGFmZic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1N0YWZmKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ293bmVyJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzT3duZXIobmFtZSk7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcbiIsImNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5cclxuY29uc3QgYm90ID0gT2JqZWN0LmFzc2lnbihcclxuICAgIG1vZHVsZS5leHBvcnRzLFxyXG4gICAgcmVxdWlyZSgnLi9zZW5kJyksXHJcbiAgICByZXF1aXJlKCcuL2NoZWNrR3JvdXAnKVxyXG4pO1xyXG5cclxuYm90LnZlcnNpb24gPSAnNi4xLjAnO1xyXG5cclxuLyoqXHJcbiAqIEBkZXByaWNhdGVkIHNpbmNlIDYuMS4wLiBVc2UgZXgud29ybGQgaW5zdGVhZC5cclxuICovXHJcbmJvdC53b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5cclxuc3RvcmFnZS5zZXQoJ21iX3ZlcnNpb24nLCBib3QudmVyc2lvbiwgZmFsc2UpO1xyXG4iLCJmdW5jdGlvbiB1cGRhdGUoa2V5cywgb3BlcmF0b3IpIHtcclxuICAgIE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSkuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgb2Yga2V5cykge1xyXG4gICAgICAgICAgICBpZiAoaXRlbS5zdGFydHNXaXRoKGtleSkpIHtcclxuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGl0ZW0sIG9wZXJhdG9yKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGl0ZW0pKSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG4vL2pzaGludCAtVzA4NlxyXG4vL05vIGJyZWFrIHN0YXRlbWVudHMgYXMgd2Ugd2FudCB0byBleGVjdXRlIGFsbCB1cGRhdGVzIGFmdGVyIG1hdGNoZWQgdmVyc2lvbiB1bmxlc3Mgb3RoZXJ3aXNlIG5vdGVkLlxyXG5zd2l0Y2ggKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdtYl92ZXJzaW9uJykpIHtcclxuICAgIGNhc2UgbnVsbDpcclxuICAgICAgICBicmVhazsgLy9Ob3RoaW5nIHRvIG1pZ3JhdGVcclxuICAgIGNhc2UgJzUuMi4wJzpcclxuICAgIGNhc2UgJzUuMi4xJzpcclxuICAgICAgICAvL1dpdGggNi4wLCBuZXdsaW5lcyBhcmUgZGlyZWN0bHkgc3VwcG9ydGVkIGluIG1lc3NhZ2VzIGJ5IHRoZSBib3QuXHJcbiAgICAgICAgdXBkYXRlKFsnYW5ub3VuY2VtZW50QXJyJywgJ2pvaW5BcnInLCAnbGVhdmVBcnInLCAndHJpZ2dlckFyciddLCBmdW5jdGlvbihyYXcpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdyk7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtc2cubWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cubWVzc2FnZSA9IG1zZy5tZXNzYWdlLnJlcGxhY2UoL1xcXFxuL2csICdcXG4nKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXJzZWQpO1xyXG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByYXc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBicmVhazsgLy9OZXh0IGJ1Z2ZpeCBvbmx5IHJlbGF0ZXMgdG8gNi4wIGJvdC5cclxuICAgIGNhc2UgJzYuMC4wYSc6XHJcbiAgICBjYXNlICc2LjAuMCc6XHJcbiAgICAgICAgYWxlcnQoXCJEdWUgdG8gYSBidWcgaW4gdGhlIDYuMC4wIHZlcnNpb24gb2YgdGhlIGJvdCwgeW91ciBqb2luIGFuZCBsZWF2ZSBtZXNzYWdlcyBtYXkgYmUgc3dhcHBlZC4gU29ycnkhIFRoaXMgY2Fubm90IGJlIGZpeGVkIGF1dG9tYXRpY2FsbHkuIFRoaXMgbWVzc2FnZSB3aWxsIG5vdCBiZSBzaG93biBhZ2Fpbi5cIik7XHJcbiAgICAgICAgYnJlYWs7IC8vTmV4dCBidWdmaXggb25seSByZWxhdGVzIHRvIDYuMC4xIC8gNi4wLjIuXHJcbiAgICBjYXNlICc2LjAuMSc6XHJcbiAgICBjYXNlICc2LjAuMic6XHJcbiAgICAgICAgYWxlcnQoXCJEdWUgdG8gYSBidWcgaW4gNi4wLjEgLyA2LjAuMiwgZ3JvdXBzIG1heSBoYXZlIGJlZW4gbWl4ZWQgdXAgb24gSm9pbiwgTGVhdmUsIGFuZCBUcmlnZ2VyIG1lc3NhZ2VzLiBTb3JyeSEgVGhpcyBjYW5ub3QgYmUgZml4ZWQgYXV0b21hdGljYWxseSBpZiBpdCBvY2N1cmVkIG9uIHlvdXIgYm90LiBBbm5vdW5jZW1lbnRzIGhhdmUgYWxzbyBiZWVuIGZpeGVkLlwiKTtcclxuICAgIGNhc2UgJzYuMC4zJzpcclxuICAgIGNhc2UgJzYuMC40JzpcclxuICAgIGNhc2UgJzYuMC41JzpcclxuICAgIGNhc2UgJzYuMC42JzpcclxuICAgIGNhc2UgJzYuMS4wYSc6XHJcbiAgICAgICAgLy9Ob3JtYWxpemUgZ3JvdXBzIHRvIGxvd2VyIGNhc2UuXHJcbiAgICAgICAgdXBkYXRlKFsnam9pbkFycicsICdsZWF2ZUFycicsICd0cmlnZ2VyQXJyJ10sIGZ1bmN0aW9uKHJhdykge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHBhcnNlZCA9IEpTT04ucGFyc2UocmF3KTtcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbXNnLmdyb3VwID0gbXNnLmdyb3VwLnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbXNnLm5vdF9ncm91cCA9IG1zZy5ub3RfZ3JvdXAudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHBhcnNlZCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByYXc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxufVxyXG4vL2pzaGludCArVzA4NlxyXG4iLCJ2YXIgYXBpID0gcmVxdWlyZSgnbGlicmFyaWVzL2Jsb2NraGVhZHMnKTtcclxudmFyIHNldHRpbmdzID0gcmVxdWlyZSgnc2V0dGluZ3MvYm90Jyk7XHJcblxyXG52YXIgcXVldWUgPSBbXTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2VuZCxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHF1ZXVlIGEgbWVzc2FnZSB0byBiZSBzZW50LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZW5kKCdIZWxsbyEnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gYmUgc2VudC5cclxuICovXHJcbmZ1bmN0aW9uIHNlbmQobWVzc2FnZSkge1xyXG4gICAgaWYgKHNldHRpbmdzLnNwbGl0TWVzc2FnZXMpIHtcclxuICAgICAgICAvL0ZJWE1FOiBJZiB0aGUgYmFja3NsYXNoIGJlZm9yZSB0aGUgdG9rZW4gaXMgZXNjYXBlZCBieSBhbm90aGVyIGJhY2tzbGFzaCB0aGUgdG9rZW4gc2hvdWxkIHN0aWxsIHNwbGl0IHRoZSBtZXNzYWdlLlxyXG4gICAgICAgIGxldCBzdHIgPSBtZXNzYWdlLnNwbGl0KHNldHRpbmdzLnNwbGl0VG9rZW4pO1xyXG4gICAgICAgIGxldCB0b1NlbmQgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGN1cnIgPSBzdHJbaV07XHJcbiAgICAgICAgICAgIGlmIChjdXJyW2N1cnIubGVuZ3RoIC0gMV0gPT0gJ1xcXFwnICYmIGkgPCBzdHIubGVuZ3RoICsgMSkge1xyXG4gICAgICAgICAgICAgICAgY3VyciArPSBzZXR0aW5ncy5zcGxpdFRva2VuICsgc3RyWysraV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdG9TZW5kLnB1c2goY3Vycik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1NlbmQuZm9yRWFjaChtc2cgPT4gcXVldWUucHVzaChtc2cpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcXVldWUucHVzaChtZXNzYWdlKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFdhdGNoZXMgdGhlIHF1ZXVlIGZvciBuZXcgbWVzc2FnZXMgdG8gc2VuZCBhbmQgc2VuZHMgdGhlbSBhcyBzb29uIGFzIHBvc3NpYmxlLlxyXG4gKi9cclxuKGZ1bmN0aW9uIGNoZWNrUXVldWUoKSB7XHJcbiAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xyXG4gICAgICAgIHNldFRpbWVvdXQoY2hlY2tRdWV1ZSwgNTAwKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgYXBpLnNlbmQocXVldWUuc2hpZnQoKSlcclxuICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2tRdWV1ZSwgMTAwMCk7XHJcbiAgICAgICAgfSk7XHJcbn0oKSk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgd3JpdGUsXHJcbiAgICBjbGVhclxyXG59O1xyXG5cclxuZnVuY3Rpb24gd3JpdGUobXNnLCBuYW1lID0gJycsIG5hbWVDbGFzcyA9ICcnKSB7XHJcbiAgICB2YXIgbXNnRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgaWYgKG5hbWVDbGFzcykge1xyXG4gICAgICAgIG1zZ0VsLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBuYW1lQ2xhc3MpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBuYW1lRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICBuYW1lRWwudGV4dENvbnRlbnQgPSBuYW1lO1xyXG5cclxuICAgIHZhciBjb250ZW50RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICBpZiAobmFtZSkge1xyXG4gICAgICAgIGNvbnRlbnRFbC50ZXh0Q29udGVudCA9IGA6ICR7bXNnfWA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnRlbnRFbC50ZXh0Q29udGVudCA9IG1zZztcclxuICAgIH1cclxuICAgIG1zZ0VsLmFwcGVuZENoaWxkKG5hbWVFbCk7XHJcbiAgICBtc2dFbC5hcHBlbmRDaGlsZChjb250ZW50RWwpO1xyXG5cclxuICAgIHZhciBjaGF0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2NvbnNvbGUgdWwnKTtcclxuICAgIGNoYXQuYXBwZW5kQ2hpbGQobXNnRWwpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbGVhcigpIHtcclxuICAgIHZhciBjaGF0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2NvbnNvbGUgdWwnKTtcclxuICAgIGNoYXQuaW5uZXJIVE1MID0gJyc7XHJcbn1cclxuIiwiY29uc3Qgc2VsZiA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9leHBvcnRzJyk7XHJcblxyXG5jb25zdCBzZXR0aW5ncyA9IHJlcXVpcmUoJ3NldHRpbmdzL2JvdCcpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuY29uc3Qgc2VuZCA9IHJlcXVpcmUoJ2JvdCcpLnNlbmQ7XHJcbmNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcblxyXG4vLyBUT0RPOiBQYXJzZSB0aGVzZSBhbmQgcHJvdmlkZSBvcHRpb25zIHRvIHNob3cvaGlkZSBkaWZmZXJlbnQgb25lcy5cclxuaG9vay5vbignd29ybGQub3RoZXInLCBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICBzZWxmLndyaXRlKG1lc3NhZ2UsIHVuZGVmaW5lZCwgJ290aGVyJyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQubWVzc2FnZScsIGZ1bmN0aW9uKG5hbWUsIG1lc3NhZ2UpIHtcclxuICAgIGxldCBtc2dDbGFzcyA9ICdwbGF5ZXInO1xyXG4gICAgaWYgKHdvcmxkLmlzU3RhZmYobmFtZSkpIHtcclxuICAgICAgICBtc2dDbGFzcyA9ICdzdGFmZic7XHJcbiAgICAgICAgaWYgKHdvcmxkLmlzTW9kKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIG1zZ0NsYXNzICs9ICcgbW9kJztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvL0hhcyB0byBiZSBhZG1pblxyXG4gICAgICAgICAgICBtc2dDbGFzcyArPSAnIGFkbWluJztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykpIHtcclxuICAgICAgICBtc2dDbGFzcyArPSAnIGNvbW1hbmQnO1xyXG4gICAgfVxyXG4gICAgc2VsZi53cml0ZShtZXNzYWdlLCBuYW1lLCBtc2dDbGFzcyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQuc2VydmVyY2hhdCcsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgIHNlbGYud3JpdGUobWVzc2FnZSwgJ1NFUlZFUicsICdhZG1pbicpO1xyXG59KTtcclxuXHJcbmhvb2sub24oJ3dvcmxkLnNlbmQnLCBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykpIHtcclxuICAgICAgICBzZWxmLndyaXRlKG1lc3NhZ2UsICdTRVJWRVInLCAnYWRtaW4gY29tbWFuZCcpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vTWVzc2FnZSBoYW5kbGVyc1xyXG5ob29rLm9uKCd3b3JsZC5qb2luJywgZnVuY3Rpb24gaGFuZGxlUGxheWVySm9pbihuYW1lLCBpcCkge1xyXG4gICAgc2VsZi53cml0ZShgJHtuYW1lfSAoJHtpcH0pIGhhcyBqb2luZWQgdGhlIHNlcnZlcmAsICdTRVJWRVInLCAnam9pbiB3b3JsZCBhZG1pbicpO1xyXG59KTtcclxuXHJcbmhvb2sub24oJ3dvcmxkLmxlYXZlJywgZnVuY3Rpb24gaGFuZGxlUGxheWVyTGVhdmUobmFtZSkge1xyXG4gICAgc2VsZi53cml0ZShgJHtuYW1lfSBoYXMgbGVmdCB0aGUgc2VydmVyYCwgJ1NFUlZFUicsIGBsZWF2ZSB3b3JsZCBhZG1pbmApO1xyXG59KTtcclxuXHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdDb25zb2xlJyk7XHJcbnRhYi5pbm5lckhUTUwgPSAnPHN0eWxlPicgK1xyXG4gICAgXCIjbWJfY29uc29sZXtoZWlnaHQ6Y2FsYygxMDAlIC0gMy41ZW0pfSNtYl9jb25zb2xlIC5tb2Q+c3BhbjpmaXJzdC1jaGlsZHtjb2xvcjojMDVmNTI5fSNtYl9jb25zb2xlIC5hZG1pbj5zcGFuOmZpcnN0LWNoaWxke2NvbG9yOiMyYjI2YmR9I21iX2NvbnNvbGUgLmNoYXR7bWFyZ2luOjAgMWVtO21heC1oZWlnaHQ6MTAwJTtvdmVyZmxvdy15OmF1dG99I21iX2NvbnNvbGUgLmNoYXQtY29udHJvbHtwb3NpdGlvbjpmaXhlZDtib3R0b206MDt3aWR0aDoxMDB2d30jbWJfY29uc29sZSAuY2hhdC1jb250cm9sIC5jb250cm9se21hcmdpbjoxZW19XFxuXCIgK1xyXG4gICAgJzwvc3R5bGU+JyArXHJcbiAgICBcIjxkaXYgaWQ9XFxcIm1iX2NvbnNvbGVcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjaGF0XFxcIj5cXHJcXG4gICAgICAgIDx1bD48L3VsPlxcclxcbiAgICA8L2Rpdj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY2hhdC1jb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImNvbnRyb2wgaGFzLWFkZG9uc1xcXCI+XFxyXFxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJpbnB1dCBpcy1leHBhbmRlZFxcXCIvPlxcclxcbiAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XFxcImlucHV0IGJ1dHRvbiBpcy1wcmltYXJ5XFxcIj5TRU5EPC9idXR0b24+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG4vLyBJZiBlbmFibGVkLCBzaG93IG1lc3NhZ2VzIGZvciBuZXcgY2hhdCB3aGVuIG5vdCBvbiB0aGUgY29uc29sZSBwYWdlXHJcbmhvb2sub24oJ3dvcmxkLmNoYXQnLCBmdW5jdGlvbihuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICBpZiAoc2V0dGluZ3Mubm90aWZ5ICYmICF0YWIuY2xhc3NMaXN0LmNvbnRhaW5zKCd2aXNpYmxlJykpIHtcclxuICAgICAgICB1aS5ub3RpZnkoYCR7bmFtZX06ICR7bWVzc2FnZX1gLCAxLjUpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG4vLyBBdXRvIHNjcm9sbCB3aGVuIG5ldyBtZXNzYWdlcyBhcmUgYWRkZWQgdG8gdGhlIHBhZ2UsIHVubGVzcyB0aGUgb3duZXIgaXMgcmVhZGluZyBvbGQgY2hhdC5cclxuKG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIHNob3dOZXdDaGF0KCkge1xyXG4gICAgbGV0IGNvbnRhaW5lciA9IHRhYi5xdWVyeVNlbGVjdG9yKCcuY2hhdCcpO1xyXG4gICAgbGV0IGxhc3RMaW5lID0gdGFiLnF1ZXJ5U2VsZWN0b3IoJ2xpOmxhc3QtY2hpbGQnKTtcclxuXHJcbiAgICBpZiAoIWNvbnRhaW5lciB8fCAhbGFzdExpbmUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvbnRhaW5lci5zY3JvbGxIZWlnaHQgLSBjb250YWluZXIuY2xpZW50SGVpZ2h0IC0gY29udGFpbmVyLnNjcm9sbFRvcCA8PSBsYXN0TGluZS5jbGllbnRIZWlnaHQgKiAxMCkge1xyXG4gICAgICAgIGxhc3RMaW5lLnNjcm9sbEludG9WaWV3KGZhbHNlKTtcclxuICAgIH1cclxufSkpLm9ic2VydmUodGFiLnF1ZXJ5U2VsZWN0b3IoJy5jaGF0JyksIHtjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWV9KTtcclxuXHJcblxyXG4vLyBSZW1vdmUgb2xkIGNoYXQgdG8gcmVkdWNlIG1lbW9yeSB1c2FnZVxyXG4obmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gcmVtb3ZlT2xkQ2hhdCgpIHtcclxuICAgIHZhciBjaGF0ID0gdGFiLnF1ZXJ5U2VsZWN0b3IoJ3VsJyk7XHJcblxyXG4gICAgd2hpbGUgKGNoYXQuY2hpbGRyZW4ubGVuZ3RoID4gNTAwKSB7XHJcbiAgICAgICAgY2hhdC5jaGlsZHJlblswXS5yZW1vdmUoKTtcclxuICAgIH1cclxufSkpLm9ic2VydmUodGFiLnF1ZXJ5U2VsZWN0b3IoJy5jaGF0JyksIHtjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWV9KTtcclxuXHJcbi8vIExpc3RlbiBmb3IgdGhlIHVzZXIgdG8gc2VuZCBtZXNzYWdlc1xyXG5mdW5jdGlvbiB1c2VyU2VuZCgpIHtcclxuICAgIHZhciBpbnB1dCA9IHRhYi5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xyXG4gICAgaG9vay5maXJlKCdjb25zb2xlLnNlbmQnLCBpbnB1dC52YWx1ZSk7XHJcbiAgICBzZW5kKGlucHV0LnZhbHVlKTtcclxuICAgIGlucHV0LnZhbHVlID0gJyc7XHJcbiAgICBpbnB1dC5mb2N1cygpO1xyXG59XHJcblxyXG50YWIucXVlcnlTZWxlY3RvcignaW5wdXQnKS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIGlmIChldmVudC5rZXkgPT0gXCJFbnRlclwiIHx8IGV2ZW50LmtleUNvZGUgPT0gMTMpIHtcclxuICAgICAgICB1c2VyU2VuZCgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbnRhYi5xdWVyeVNlbGVjdG9yKCdidXR0b24nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHVzZXJTZW5kKTtcclxuIiwiLy9UT0RPOiBVc2UgZmV0Y2hcclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIEdFVCBhIHBhZ2UuIFBhc3NlcyB0aGUgcmVzcG9uc2Ugb2YgdGhlIFhIUiBpbiB0aGUgcmVzb2x2ZSBwcm9taXNlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL3NlbmRzIGEgR0VUIHJlcXVlc3QgdG8gL3NvbWUvdXJsLnBocD9hPXRlc3RcclxuICogZ2V0KCcvc29tZS91cmwucGhwJywge2E6ICd0ZXN0J30pLnRoZW4oY29uc29sZS5sb2cpXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1N0clxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0KHVybCA9ICcvJywgcGFyYW1zID0ge30pIHtcclxuICAgIGlmIChPYmplY3Qua2V5cyhwYXJhbXMpLmxlbmd0aCkge1xyXG4gICAgICAgIHZhciBhZGRpdGlvbiA9IHVybFN0cmluZ2lmeShwYXJhbXMpO1xyXG4gICAgICAgIGlmICh1cmwuaW5jbHVkZXMoJz8nKSkge1xyXG4gICAgICAgICAgICB1cmwgKz0gYCYke2FkZGl0aW9ufWA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdXJsICs9IGA/JHthZGRpdGlvbn1gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geGhyKCdHRVQnLCB1cmwsIHt9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgSlNPTiBvYmplY3QgaW4gdGhlIHByb21pc2UgcmVzb2x2ZSBtZXRob2QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtT2JqXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRKU09OKHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIGdldCh1cmwsIHBhcmFtT2JqKS50aGVuKEpTT04ucGFyc2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIG1ha2UgYSBwb3N0IHJlcXVlc3RcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW1PYmpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHBvc3QodXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4geGhyKCdQT1NUJywgdXJsLCBwYXJhbU9iaik7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gZmV0Y2ggSlNPTiBmcm9tIGEgcGFnZSB0aHJvdWdoIHBvc3QuXHJcbiAqXHJcbiAqIEBwYXJhbSBzdHJpbmcgdXJsXHJcbiAqIEBwYXJhbSBzdHJpbmcgcGFyYW1PYmpcclxuICogQHJldHVybiBQcm9taXNlXHJcbiAqL1xyXG5mdW5jdGlvbiBwb3N0SlNPTih1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiBwb3N0KHVybCwgcGFyYW1PYmopLnRoZW4oSlNPTi5wYXJzZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuKiBIZWxwZXIgZnVuY3Rpb24gdG8gbWFrZSBYSFIgcmVxdWVzdHMsIGlmIHBvc3NpYmxlIHVzZSB0aGUgZ2V0IGFuZCBwb3N0IGZ1bmN0aW9ucyBpbnN0ZWFkLlxyXG4qXHJcbiogQGRlcHJpY2F0ZWQgc2luY2UgdmVyc2lvbiA2LjFcclxuKiBAcGFyYW0gc3RyaW5nIHByb3RvY29sXHJcbiogQHBhcmFtIHN0cmluZyB1cmxcclxuKiBAcGFyYW0gb2JqZWN0IHBhcmFtT2JqIC0tIFdBUk5JTkcuIE9ubHkgYWNjZXB0cyBzaGFsbG93IG9iamVjdHMuXHJcbiogQHJldHVybiBQcm9taXNlXHJcbiovXHJcbmZ1bmN0aW9uIHhocihwcm90b2NvbCwgdXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICB2YXIgcGFyYW1TdHIgPSB1cmxTdHJpbmdpZnkocGFyYW1PYmopO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIHZhciByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICByZXEub3Blbihwcm90b2NvbCwgdXJsKTtcclxuICAgICAgICByZXEuc2V0UmVxdWVzdEhlYWRlcignWC1SZXF1ZXN0ZWQtV2l0aCcsICdYTUxIdHRwUmVxdWVzdCcpO1xyXG4gICAgICAgIGlmIChwcm90b2NvbCA9PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgcmVxLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlcS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcS5zdGF0dXNUZXh0KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIEhhbmRsZSBuZXR3b3JrIGVycm9yc1xyXG4gICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJlamVjdChFcnJvcihcIk5ldHdvcmsgRXJyb3JcIikpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKHBhcmFtU3RyKSB7XHJcbiAgICAgICAgICAgIHJlcS5zZW5kKHBhcmFtU3RyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXEuc2VuZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gc3RyaW5naWZ5IHVybCBwYXJhbWV0ZXJzXHJcbiAqL1xyXG5mdW5jdGlvbiB1cmxTdHJpbmdpZnkob2JqKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKVxyXG4gICAgLm1hcChrID0+IGAke2VuY29kZVVSSUNvbXBvbmVudChrKX09JHtlbmNvZGVVUklDb21wb25lbnQob2JqW2tdKX1gKVxyXG4gICAgLmpvaW4oJyYnKTtcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge3hociwgZ2V0LCBnZXRKU09OLCBwb3N0LCBwb3N0SlNPTn07XHJcbiIsIi8qKlxyXG4gKiBAZmlsZSBDb250YWlucyBmdW5jdGlvbnMgdG8gaW50ZXJhY3Qgd2l0aCBibG9ja2hlYWRzZmFucy5jb20gLSBjYW5ub3QgYmUgdXNlZCBieSBleHRlbnNpb25zLlxyXG4gKi9cclxuXHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBhamF4ID0gcmVxdWlyZSgnbGlicmFyaWVzL2FqYXgnKTtcclxuXHJcbmNvbnN0IEFQSV9VUkxTID0ge1xyXG4gICAgU1RPUkU6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2FwaS9leHRlbnNpb24vc3RvcmUnLFxyXG4gICAgTkFNRTogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvYXBpL2V4dGVuc2lvbi9pbmZvJyxcclxuICAgIEVSUk9SOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9hcGkvZXJyb3InLFxyXG59O1xyXG5cclxudmFyIGNhY2hlID0ge1xyXG4gICAgaW5mbzogbmV3IE1hcCgpLFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVzZWQgdG8gZ2V0IHB1YmxpYyBleHRlbnNpb25zXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldFN0b3JlKCkudGhlbihzdG9yZSA9PiBjb25zb2xlLmxvZyhzdG9yZSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byB1c2UgdGhlIGNhY2hlZCByZXNwb25zZSBzaG91bGQgYmUgY2xlYXJlZC5cclxuICogQHJldHVybiB7UHJvbWlzZX0gcmVzb2x2ZXMgd2l0aCB0aGUgcmVzcG9uc2VcclxuICovXHJcbmZ1bmN0aW9uIGdldFN0b3JlKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldFN0b3JlKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0U3RvcmUgPSBhamF4LmdldEpTT04oQVBJX1VSTFMuU1RPUkUpXHJcbiAgICAgICAgICAgIC50aGVuKHN0b3JlID0+IHtcclxuICAgICAgICAgICAgICAgIC8vQnVpbGQgdGhlIGluaXRpYWwgbmFtZXMgbWFwXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmUuc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZXggb2Ygc3RvcmUuZXh0ZW5zaW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLmluZm8uc2V0KGV4LmlkLCBleCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRTdG9yZTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBuYW1lIG9mIHRoZSBwcm92aWRlZCBleHRlbnNpb24gSUQuXHJcbiAqIElmIHRoZSBleHRlbnNpb24gd2FzIG5vdCBmb3VuZCwgcmVzb2x2ZXMgd2l0aCB0aGUgb3JpZ2luYWwgcGFzc2VkIElELlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRFeHRlbnNpb25JbmZvKCd0ZXN0JykudGhlbihpbmZvID0+IGNvbnNvbGUubG9nKGluZm8pKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkIHRoZSBpZCB0byBzZWFyY2ggZm9yLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSByZXNvbHZlcyB3aXRoIHRoZSBleHRlbnNpb24ncyBuYW1lLCBzbmlwcGV0LCBhbmQgSUQuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRFeHRlbnNpb25JbmZvKGlkKSB7XHJcbiAgICBpZiAoY2FjaGUuaW5mby5oYXMoaWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjYWNoZS5pbmZvLmdldChpZCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhamF4LmdldEpTT04oQVBJX1VSTFMuTkFNRSwge2lkfSkudGhlbigoe2lkLCB0aXRsZSwgc25pcHBldH0pID0+IHtcclxuICAgICAgICByZXR1cm4gY2FjaGUuaW5mb1xyXG4gICAgICAgICAgICAuc2V0KGlkLCB7aWQsIHRpdGxlLCBzbmlwcGV0fSlcclxuICAgICAgICAgICAgLmdldChpZCk7XHJcbiAgICB9LCBlcnIgPT4ge1xyXG4gICAgICAgIHJlcG9ydEVycm9yKGVycik7XHJcbiAgICAgICAgcmV0dXJuIHtuYW1lOiBpZCwgaWQ6IGlkLCBzbmlwcGV0OiAnTm8gZGVzY3JpcHRpb24uJ307XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXBvcnRzIGFuIGVycm9yIHNvIHRoYXQgaXQgY2FuIGJlIHJldmlld2VkIGFuZCBmaXhlZCBieSBleHRlbnNpb24gb3IgYm90IGRldmVsb3BlcnMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHJlcG9ydEVycm9yKEVycm9yKFwiUmVwb3J0IG1lXCIpKTtcclxuICogQHBhcmFtIHtFcnJvcn0gZXJyIHRoZSBlcnJvciB0byByZXBvcnRcclxuICovXHJcbmZ1bmN0aW9uIHJlcG9ydEVycm9yKGVycikge1xyXG4gICAgYWpheC5wb3N0SlNPTihBUElfVVJMUy5FUlJPUiwge1xyXG4gICAgICAgICAgICBlcnJvcl90ZXh0OiBlcnIubWVzc2FnZSxcclxuICAgICAgICAgICAgZXJyb3JfZmlsZTogZXJyLmZpbGVuYW1lLFxyXG4gICAgICAgICAgICBlcnJvcl9yb3c6IGVyci5saW5lbm8gfHwgMCxcclxuICAgICAgICAgICAgZXJyb3JfY29sdW1uOiBlcnIuY29sbm8gfHwgMCxcclxuICAgICAgICAgICAgZXJyb3Jfc3RhY2s6IGVyci5zdGFjayB8fCAnJyxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKChyZXNwKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyZXNwLnN0YXR1cyA9PSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICBob29rLmZpcmUoJ2Vycm9yX3JlcG9ydCcsICdTb21ldGhpbmcgd2VudCB3cm9uZywgaXQgaGFzIGJlZW4gcmVwb3J0ZWQuJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBob29rLmZpcmUoJ2Vycm9yX3JlcG9ydCcsIGBFcnJvciByZXBvcnRpbmcgZXhjZXB0aW9uOiAke3Jlc3AubWVzc2FnZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGdldFN0b3JlLFxyXG4gICAgZ2V0RXh0ZW5zaW9uSW5mbyxcclxuICAgIHJlcG9ydEVycm9yLFxyXG59O1xyXG4iLCJ2YXIgYWpheCA9IHJlcXVpcmUoJy4vYWpheCcpO1xyXG52YXIgaG9vayA9IHJlcXVpcmUoJy4vaG9vaycpO1xyXG52YXIgYmhmYW5zYXBpID0gcmVxdWlyZSgnLi9iaGZhbnNhcGknKTtcclxuXHJcbmNvbnN0IHdvcmxkSWQgPSB3aW5kb3cud29ybGRJZDtcclxudmFyIGNhY2hlID0ge1xyXG4gICAgZmlyc3RJZDogMCxcclxufTtcclxuXHJcbi8vIFVzZWQgdG8gcGFyc2UgbWVzc2FnZXMgbW9yZSBhY2N1cmF0ZWx5XHJcbnZhciB3b3JsZCA9IHtcclxuICAgIG5hbWU6ICcnLFxyXG4gICAgb25saW5lOiBbXVxyXG59O1xyXG5nZXRPbmxpbmVQbGF5ZXJzKClcclxuICAgIC50aGVuKHBsYXllcnMgPT4gd29ybGQucGxheWVycyA9IFsuLi5uZXcgU2V0KHBsYXllcnMuY29uY2F0KHdvcmxkLnBsYXllcnMpKV0pO1xyXG5cclxuZ2V0V29ybGROYW1lKClcclxuICAgIC50aGVuKG5hbWUgPT4gd29ybGQubmFtZSA9IG5hbWUpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgd29ybGRTdGFydGVkLFxyXG4gICAgZ2V0TG9ncyxcclxuICAgIGdldExpc3RzLFxyXG4gICAgZ2V0SG9tZXBhZ2UsXHJcbiAgICBnZXRPbmxpbmVQbGF5ZXJzLFxyXG4gICAgZ2V0T3duZXJOYW1lLFxyXG4gICAgZ2V0V29ybGROYW1lLFxyXG4gICAgc2VuZCxcclxufTtcclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgdGhlIHdvcmxkIGlmIG5lY2Nlc3NhcnksIHJlamVjdHMgaWYgdGhlIHdvcmxkIHRha2VzIHRvbyBsb25nIHRvIHN0YXJ0IG9yIGlzIHVuYXZhaWxpYmxlXHJcbiAqIFJlZmFjdG9yaW5nIHdlbGNvbWUuIFRoaXMgc2VlbXMgb3Zlcmx5IHB5cmFtaWQgbGlrZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogd29ybGRTdGFydGVkKCkudGhlbigoKSA9PiBjb25zb2xlLmxvZygnc3RhcnRlZCEnKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlY2hlY2sgaWYgdGhlIHdvcmxkIGlzIHN0YXJ0ZWQuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiB3b3JsZFN0YXJ0ZWQocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUud29ybGRTdGFydGVkKSB7XHJcbiAgICAgICAgY2FjaGUud29ybGRTdGFydGVkID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB2YXIgZmFpbHMgPSAwO1xyXG4gICAgICAgICAgICAoZnVuY3Rpb24gY2hlY2soKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDb3VsZCB0aGlzIGJlIG1vcmUgc2ltcGxpZmllZD9cclxuICAgICAgICAgICAgICAgIGFqYXgucG9zdEpTT04oJy9hcGknLCB7IGNvbW1hbmQ6ICdzdGF0dXMnLCB3b3JsZElkIH0pLnRoZW4ocmVzcG9uc2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocmVzcG9uc2Uud29ybGRTdGF0dXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnb25saW5lJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ29mZmxpbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWpheC5wb3N0SlNPTignL2FwaScsIHsgY29tbWFuZDogJ3N0YXJ0Jywgd29ybGRJZCB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGNoZWNrLCBjaGVjayk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndW5hdmFpbGlibGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ1dvcmxkIHVuYXZhaWxpYmxlLicpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RhcnR1cCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3NodXRkb3duJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RvcmluZyc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrLCAzMDAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgrK2ZhaWxzID4gMTApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignV29ybGQgdG9vayB0b28gbG9uZyB0byBzdGFydC4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdVbmtub3duIHJlc3BvbnNlLicpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChiaGZhbnNhcGkucmVwb3J0RXJyb3IpO1xyXG4gICAgICAgICAgICB9KCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS53b3JsZFN0YXJ0ZWQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCBhbiBhcnJheSBvZiB0aGUgbG9nJ3MgbGluZXMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldExvZ3MoKS50aGVuKGxpbmVzID0+IGNvbnNvbGUubG9nKGxpbmVzWzBdKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZG93bmxvYWQgdGhlIGxvZ3NcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldExvZ3MocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0TG9ncykge1xyXG4gICAgICAgIGNhY2hlLmdldExvZ3MgPSB3b3JsZFN0YXJ0ZWQoKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBhamF4LmdldChgL3dvcmxkcy9sb2dzLyR7d29ybGRJZH1gKSlcclxuICAgICAgICAgICAgLnRoZW4obG9nID0+IGxvZy5zcGxpdCgnXFxuJykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRMb2dzO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYSBsaXN0IG9mIGFkbWlucywgbW9kcywgc3RhZmYgKGFkbWlucyArIG1vZHMpLCB3aGl0ZWxpc3QsIGFuZCBibGFja2xpc3QuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldExpc3RzKCkudGhlbihsaXN0cyA9PiBjb25zb2xlLmxvZyhsaXN0cy5hZG1pbikpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWZldGNoIHRoZSBsaXN0cy5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldExpc3RzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldExpc3RzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0TGlzdHMgPSB3b3JsZFN0YXJ0ZWQoKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBhamF4LmdldChgL3dvcmxkcy9saXN0cy8ke3dvcmxkSWR9YCkpXHJcbiAgICAgICAgICAgIC50aGVuKGh0bWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0TGlzdChuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBkb2MucXVlcnlTZWxlY3RvcihgdGV4dGFyZWFbbmFtZT0ke25hbWV9XWApXHJcbiAgICAgICAgICAgICAgICAgICAgLnZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgLnRvTG9jYWxlVXBwZXJDYXNlKClcclxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJ1xcbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbLi4ubmV3IFNldChsaXN0KV07IC8vUmVtb3ZlIGR1cGxpY2F0ZXNcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbGlzdHMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWRtaW46IGdldExpc3QoJ2FkbWlucycpLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZDogZ2V0TGlzdCgnbW9kbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgICAgIHdoaXRlOiBnZXRMaXN0KCd3aGl0ZWxpc3QnKSxcclxuICAgICAgICAgICAgICAgICAgICBibGFjazogZ2V0TGlzdCgnYmxhY2tsaXN0JyksXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgbGlzdHMubW9kID0gbGlzdHMubW9kLmZpbHRlcihuYW1lID0+ICFsaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lKSk7XHJcbiAgICAgICAgICAgICAgICBsaXN0cy5zdGFmZiA9IGxpc3RzLmFkbWluLmNvbmNhdChsaXN0cy5tb2QpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0cztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldExpc3RzO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIGhvbWVwYWdlIG9mIHRoZSBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IGNvbnNvbGUubG9nKGh0bWwuc3Vic3RyaW5nKDAsIDEwMCkpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmZXRjaCB0aGUgcGFnZS5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldEhvbWVwYWdlKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldEhvbWVwYWdlKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0SG9tZXBhZ2UgPSBhamF4LmdldChgL3dvcmxkcy8ke3dvcmxkSWR9YClcclxuICAgICAgICAgICAgLmNhdGNoKCgpID0+IGdldEhvbWVwYWdlKHRydWUpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0SG9tZXBhZ2U7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCBhbiBhcnJheSBvZiBwbGF5ZXIgbmFtZXMuXHJcbiAqIEFuIG9ubGluZSBsaXN0IGlzIG1haW50YWluZWQgYnkgdGhlIGJvdCwgdGhpcyBzaG91bGQgZ2VuZXJhbGx5IG5vdCBiZSB1c2VkLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRPbmxpbmVQbGF5ZXJzKCkudGhlbihvbmxpbmUgPT4geyBmb3IgKGxldCBuIG9mIG9ubGluZSkgeyBjb25zb2xlLmxvZyhuLCAnaXMgb25saW5lIScpfX0pO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWZyZXNoIHRoZSBvbmxpbmUgbmFtZXMuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPbmxpbmVQbGF5ZXJzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldE9ubGluZVBsYXllcnMpIHtcclxuICAgICAgICBjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzID0gZ2V0SG9tZXBhZ2UodHJ1ZSlcclxuICAgICAgICAgICAgLnRoZW4oKGh0bWwpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBsYXllckVsZW1zID0gZG9jLnF1ZXJ5U2VsZWN0b3IoJy5tYW5hZ2VyLnBhZGRlZDpudGgtY2hpbGQoMSknKVxyXG4gICAgICAgICAgICAgICAgICAgIC5xdWVyeVNlbGVjdG9yQWxsKCd0cjpub3QoLmhpc3RvcnkpID4gdGQubGVmdCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBsYXllcnMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBBcnJheS5mcm9tKHBsYXllckVsZW1zKS5mb3JFYWNoKChlbCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHBsYXllcnMucHVzaChlbC50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBwbGF5ZXJzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0T25saW5lUGxheWVycztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSBzZXJ2ZXIgb3duZXIncyBuYW1lLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRPd25lck5hbWUoKS50aGVuKG5hbWUgPT4gY29uc29sZS5sb2coJ1dvcmxkIGlzIG93bmVkIGJ5JywgbmFtZSkpO1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T3duZXJOYW1lKCkge1xyXG4gICAgcmV0dXJuIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IHtcclxuICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICByZXR1cm4gZG9jLnF1ZXJ5U2VsZWN0b3IoJy5zdWJoZWFkZXJ+dHI+dGQ6bm90KFtjbGFzc10pJykudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgd29ybGQncyBuYW1lLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRXb3JsZE5hbWUoKS50aGVuKG5hbWUgPT4gY29uc29sZS5sb2coJ1dvcmxkIG5hbWU6JywgbmFtZSkpO1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0V29ybGROYW1lKCkge1xyXG4gICAgcmV0dXJuIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IHtcclxuICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICByZXR1cm4gZG9jLnF1ZXJ5U2VsZWN0b3IoJyN0aXRsZScpLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlbmRzIGEgbWVzc2FnZSwgcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBtZXNzYWdlIGhhcyBiZWVuIHNlbnQgb3IgcmVqZWN0cyBvbiBmYWlsdXJlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZW5kKCdoZWxsbyEnKS50aGVuKCgpID0+IGNvbnNvbGUubG9nKCdzZW50JykpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBzZW5kLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gc2VuZChtZXNzYWdlKSB7XHJcbiAgICByZXR1cm4gYWpheC5wb3N0SlNPTihgL2FwaWAsIHtjb21tYW5kOiAnc2VuZCcsIG1lc3NhZ2UsIHdvcmxkSWR9KVxyXG4gICAgICAgIC50aGVuKHJlc3AgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgIT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3AubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3A7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbihyZXNwID0+IHtcclxuICAgICAgICAgICAgLy9IYW5kbGUgaG9va3NcclxuICAgICAgICAgICAgaG9vay5maXJlKCd3b3JsZC5zZW5kJywgbWVzc2FnZSk7XHJcbiAgICAgICAgICAgIGhvb2suZmlyZSgnd29ybGQuc2VydmVybWVzc2FnZScsIG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgLy9EaXNhbGxvdyBjb21tYW5kcyBzdGFydGluZyB3aXRoIHNwYWNlLlxyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykgJiYgIW1lc3NhZ2Uuc3RhcnRzV2l0aCgnLyAnKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbW1hbmQgPSBtZXNzYWdlLnN1YnN0cigxKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYXJncyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbW1hbmQuaW5jbHVkZXMoJyAnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnN1YnN0cmluZygwLCBjb21tYW5kLmluZGV4T2YoJyAnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IG1lc3NhZ2Uuc3Vic3RyaW5nKG1lc3NhZ2UuaW5kZXhPZignICcpICsgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBob29rLmNoZWNrKCd3b3JsZC5jb21tYW5kJywgJ1NFUlZFUicsIGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzcDtcclxuICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyID09ICdXb3JsZCBub3QgcnVubmluZy4nKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5maXJzdElkID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gd2F0Y2ggY2hhdC5cclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrQ2hhdCgpIHtcclxuICAgIGdldE1lc3NhZ2VzKCkudGhlbigobXNncykgPT4ge1xyXG4gICAgICAgIG1zZ3MuZm9yRWFjaCgobWVzc2FnZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkLm5hbWV9IC0gUGxheWVyIENvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IFssIG5hbWUsIGlwXSA9IG1lc3NhZ2UubWF0Y2goLyAtIFBsYXllciBDb25uZWN0ZWQgKC4qKSBcXHwgKFtcXGQuXSspIFxcfCAoW1xcd117MzJ9KVxccyokLyk7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVKb2luTWVzc2FnZXMobmFtZSwgaXApO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoYCR7d29ybGQubmFtZX0gLSBQbGF5ZXIgRGlzY29ubmVjdGVkIGApKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmFtZSA9IG1lc3NhZ2Uuc3Vic3RyaW5nKHdvcmxkLm5hbWUubGVuZ3RoICsgMjMpO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlTGVhdmVNZXNzYWdlcyhuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5pbmNsdWRlcygnOiAnKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBnZXRVc2VybmFtZShtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIGxldCBtc2cgPSBtZXNzYWdlLnN1YnN0cmluZyhuYW1lLmxlbmd0aCArIDIpO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlVXNlck1lc3NhZ2VzKG5hbWUsIG1zZyk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlT3RoZXJNZXNzYWdlcyhtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKVxyXG4gICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIHNldFRpbWVvdXQoY2hlY2tDaGF0LCA1MDAwKTtcclxuICAgIH0pO1xyXG59XHJcbmNoZWNrQ2hhdCgpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBnZXQgdGhlIGxhdGVzdCBjaGF0IG1lc3NhZ2VzLlxyXG4gKlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0TWVzc2FnZXMoKSB7XHJcbiAgICByZXR1cm4gd29ybGRTdGFydGVkKClcclxuICAgICAgICAudGhlbigoKSA9PiBhamF4LnBvc3RKU09OKGAvYXBpYCwgeyBjb21tYW5kOiAnZ2V0Y2hhdCcsIHdvcmxkSWQsIGZpcnN0SWQ6IGNhY2hlLmZpcnN0SWQgfSkpXHJcbiAgICAgICAgLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLnN0YXR1cyA9PSAnb2snICYmIGRhdGEubmV4dElkICE9IGNhY2hlLmZpcnN0SWQpIHtcclxuICAgICAgICAgICAgICAgIGNhY2hlLmZpcnN0SWQgPSBkYXRhLm5leHRJZDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmxvZztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLnN0YXR1cyA9PSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZGF0YS5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgd2hvIHNlbnQgYSBtZXNzYWdlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgbmFtZSA9IGdldFVzZXJuYW1lKCdTRVJWRVI6IEhpIHRoZXJlIScpO1xyXG4gKiAvL25hbWUgPT0gJ1NFUlZFUidcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gcGFyc2UuXHJcbiAqIEByZXR1cm4ge3N0cmluZ30gdGhlIG5hbWUgb2YgdGhlIHVzZXIgd2hvIHNlbnQgdGhlIG1lc3NhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRVc2VybmFtZShtZXNzYWdlKSB7XHJcbiAgICBmb3IgKGxldCBpID0gMTg7IGkgPiA0OyBpLS0pIHtcclxuICAgICAgICBsZXQgcG9zc2libGVOYW1lID0gbWVzc2FnZS5zdWJzdHJpbmcoMCwgbWVzc2FnZS5sYXN0SW5kZXhPZignOiAnLCBpKSk7XHJcbiAgICAgICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhwb3NzaWJsZU5hbWUpIHx8IHBvc3NpYmxlTmFtZSA9PSAnU0VSVkVSJykge1xyXG4gICAgICAgICAgICByZXR1cm4gcG9zc2libGVOYW1lO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIFNob3VsZCBpZGVhbGx5IG5ldmVyIGhhcHBlbi5cclxuICAgIHJldHVybiBtZXNzYWdlLnN1YnN0cmluZygwLCBtZXNzYWdlLmxhc3RJbmRleE9mKCc6ICcsIDE4KSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHBsYXllciBqb2lucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHBsYXllciBqb2luaW5nLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaXAgdGhlIGlwIG9mIHRoZSBwbGF5ZXIgam9pbmluZy5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZUpvaW5NZXNzYWdlcyhuYW1lLCBpcCkge1xyXG4gICAgaWYgKCF3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICB3b3JsZC5vbmxpbmUucHVzaChuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5qb2luJywgbmFtZSwgaXApO1xyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHBsYXllciBkaXNjb25uZWN0aW9ucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHBsYXllciBsZWF2aW5nLlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlTGVhdmVNZXNzYWdlcyhuYW1lKSB7XHJcbiAgICBpZiAod29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnNwbGljZSh3b3JsZC5vbmxpbmUuaW5kZXhPZihuYW1lKSwgMSk7XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQubGVhdmUnLCBuYW1lKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBoYW5kbGUgdXNlciBjaGF0XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSB1c2VyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSBzZW50LlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlVXNlck1lc3NhZ2VzKG5hbWUsIG1lc3NhZ2UpIHtcclxuICAgIGlmIChuYW1lID09ICdTRVJWRVInKSB7XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQuc2VydmVyY2hhdCcsIG1lc3NhZ2UpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5tZXNzYWdlJywgbmFtZSwgbWVzc2FnZSk7XHJcblxyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpICYmICFtZXNzYWdlLnN0YXJ0c1dpdGgoJy8gJykpIHtcclxuXHJcbiAgICAgICAgbGV0IGNvbW1hbmQgPSBtZXNzYWdlLnN1YnN0cigxKTtcclxuXHJcbiAgICAgICAgbGV0IGFyZ3MgPSAnJztcclxuICAgICAgICBpZiAoY29tbWFuZC5pbmNsdWRlcygnICcpKSB7XHJcbiAgICAgICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnN1YnN0cmluZygwLCBjb21tYW5kLmluZGV4T2YoJyAnKSk7XHJcbiAgICAgICAgICAgIGFyZ3MgPSBtZXNzYWdlLnN1YnN0cmluZyhtZXNzYWdlLmluZGV4T2YoJyAnKSArIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBob29rLmNoZWNrKCd3b3JsZC5jb21tYW5kJywgbmFtZSwgY29tbWFuZCwgYXJncyk7XHJcbiAgICAgICAgcmV0dXJuOyAvL25vdCBjaGF0XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQuY2hhdCcsIG5hbWUsIG1lc3NhZ2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gaGFuZGxlIG1lc3NhZ2VzIHdoaWNoIGFyZSBub3Qgc2ltcGx5IHBhcnNlZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gaGFuZGxlXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVPdGhlck1lc3NhZ2VzKG1lc3NhZ2UpIHtcclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLm90aGVyJywgbWVzc2FnZSk7XHJcbn1cclxuIiwidmFyIGxpc3RlbmVycyA9IHt9O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gYmVnaW4gbGlzdGVuaW5nIHRvIGFuIGV2ZW50LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBsaXN0ZW4oJ2V2ZW50JywgY29uc29sZS5sb2cpO1xyXG4gKiAvL2FsdGVybmF0aXZlbHlcclxuICogb24oJ2V2ZW50JywgY29uc29sZS5sb2cpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBsaXN0ZW4gdG8uXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRoZSBldmVudCBoYW5kbGVyXHJcbiAqL1xyXG5mdW5jdGlvbiBsaXN0ZW4oa2V5LCBjYWxsYmFjaykge1xyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XHJcbiAgICB9XHJcblxyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgbGlzdGVuZXJzW2tleV0gPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xyXG4gICAgICAgIGxpc3RlbmVyc1trZXldLnB1c2goY2FsbGJhY2spO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc3RvcCBsaXN0ZW5pbmcgdG8gYW4gZXZlbnQuIElmIHRoZSBsaXN0ZW5lciB3YXMgbm90IGZvdW5kLCBubyBhY3Rpb24gd2lsbCBiZSB0YWtlbi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogLy9FYXJsaWVyIGF0dGFjaGVkIG15RnVuYyB0byAnZXZlbnQnXHJcbiAqIHJlbW92ZSgnZXZlbnQnLCBteUZ1bmMpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBzdG9wIGxpc3RlbmluZyB0by5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdGhlIGNhbGxiYWNrIHRvIHJlbW92ZSBmcm9tIHRoZSBldmVudCBsaXN0ZW5lcnMuXHJcbiAqL1xyXG5mdW5jdGlvbiByZW1vdmUoa2V5LCBjYWxsYmFjaykge1xyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAobGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICBpZiAobGlzdGVuZXJzW2tleV0uaW5jbHVkZXMoY2FsbGJhY2spKSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVyc1trZXldLnNwbGljZShsaXN0ZW5lcnNba2V5XS5pbmRleE9mKGNhbGxiYWNrKSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2FsbCBldmVudHMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGNoZWNrKCd0ZXN0JywgMSwgMiwgMyk7XHJcbiAqIGNoZWNrKCd0ZXN0JywgdHJ1ZSk7XHJcbiAqIC8vIGFsdGVybmF0aXZlbHlcclxuICogZmlyZSgndGVzdCcsIDEsIDIsIDMpO1xyXG4gKiBmaXJlKCd0ZXN0JywgdHJ1ZSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGNhbGwuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGFyZ3MgYW55IGFyZ3VtZW50cyB0byBwYXNzIHRvIGxpc3RlbmluZyBmdW5jdGlvbnMuXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVjayhrZXksIC4uLmFyZ3MpIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsaXN0ZW5lcnNba2V5XS5mb3JFYWNoKGZ1bmN0aW9uKGxpc3RlbmVyKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGlzdGVuZXIoLi4uYXJncyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBpZiAoa2V5ICE9ICdlcnJvcicpIHtcclxuICAgICAgICAgICAgICAgIGNoZWNrKCdlcnJvcicsIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byB1cGRhdGUgYSB2YWx1ZSBiYXNlZCBvbiBpbnB1dCBmcm9tIGxpc3RlbmVycy5cclxuICpcclxuICogQGRlcHJpY2F0ZWQgc2luY2UgNi4xLjAuIEluc3RlYWQsIHVwZGF0ZSByZXF1ZXN0cyBzaG91bGQgYmUgaGFuZGxlZCBieSB0aGUgZXh0ZW5zaW9uIGl0ZXNlbGYuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHVwZGF0ZSgnZXZlbnQnLCB0cnVlLCAxLCAyLCAzKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gY2FsbFxyXG4gKiBAcGFyYW0ge21peGVkfSBpbml0aWFsIHRoZSBpbml0aWFsIHZhbHVlIHRvIGJlIHBhc3NlZCB0byBsaXN0ZW5lcnMuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGFyZ3MgYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBsaXN0ZW5lcnMuXHJcbiAqIEByZXR1cm4ge21peGVkfVxyXG4gKi9cclxuZnVuY3Rpb24gdXBkYXRlKGtleSwgaW5pdGlhbCwgLi4uYXJncykge1xyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgcmV0dXJuIGluaXRpYWw7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGxpc3RlbmVyc1trZXldLnJlZHVjZShmdW5jdGlvbihwcmV2aW91cywgY3VycmVudCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBjdXJyZW50KHByZXZpb3VzLCAuLi5hcmdzKTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzO1xyXG4gICAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgICAgICBpZiAoa2V5ICE9ICdlcnJvcicpIHtcclxuICAgICAgICAgICAgICAgIGNoZWNrKCdlcnJvcicsIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91cztcclxuICAgICAgICB9XHJcbiAgICB9LCBpbml0aWFsKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBsaXN0ZW4sXHJcbiAgICBvbjogbGlzdGVuLFxyXG4gICAgcmVtb3ZlLFxyXG4gICAgY2hlY2ssXHJcbiAgICBmaXJlOiBjaGVjayxcclxuICAgIHVwZGF0ZSxcclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBnZXRTdHJpbmcsXHJcbiAgICBnZXRPYmplY3QsXHJcbiAgICBzZXQsXHJcbiAgICBjbGVhck5hbWVzcGFjZSxcclxufTtcclxuXHJcbi8vUkVWSUVXOiBJcyB0aGVyZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpcz8gcmVxdWlyZSgnLi9jb25maWcnKSBtYXliZT9cclxuY29uc3QgTkFNRVNQQUNFID0gd2luZG93LndvcmxkSWQ7XHJcblxyXG4vKipcclxuICogR2V0cyBhIHN0cmluZyBmcm9tIHRoZSBzdG9yYWdlIGlmIGl0IGV4aXN0cyBhbmQgcmV0dXJucyBpdCwgb3RoZXJ3aXNlIHJldHVybnMgZmFsbGJhY2suXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB4ID0gZ2V0U3RyaW5nKCdzdG9yZWRfcHJlZnMnLCAnbm90aGluZycpO1xyXG4gKiB2YXIgeSA9IGdldFN0cmluZygnc3RvcmVkX3ByZWZzJywgJ25vdGhpbmcnLCBmYWxzZSk7XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGtleSB0byByZXRyaWV2ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZmFsbGJhY2sgd2hhdCB0byByZXR1cm4gaWYgdGhlIGtleSB3YXMgbm90IGZvdW5kLlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIG9yIG5vdCB0byB1c2UgYSBuYW1lc3BhY2Ugd2hlbiBjaGVja2luZyBmb3IgdGhlIGtleS5cclxuICogQHJldHVybiB7bWl4ZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRTdHJpbmcoa2V5LCBmYWxsYmFjaywgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYgKGxvY2FsKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oYCR7a2V5fSR7TkFNRVNQQUNFfWApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAocmVzdWx0ID09PSBudWxsKSA/IGZhbGxiYWNrIDogcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyBhIHN0b3JlZCBvYmplY3QgaWYgaXQgZXhpc3RzLCBvdGhlcndpc2UgcmV0dXJucyBmYWxsYmFjay5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHggPSBnZXRPYmplY3QoJ3N0b3JlZF9rZXknLCBbMSwgMiwgM10pO1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBpdGVtIHRvIHJldHJpZXZlLlxyXG4gKiBAcGFyYW0ge21peGVkfSBmYWxsYmFjayB3aGF0IHRvIHJldHVybiBpZiB0aGUgaXRlbSBkb2VzIG5vdCBleGlzdCBvciBmYWlscyB0byBwYXJzZSBjb3JyZWN0bHkuXHJcbiAqIEBwYXJhbSB7Ym9vbH0gW2xvY2FsPXRydWVdIHdoZXRoZXIgb3Igbm90IGEgbmFtZXNwYWNlIHNob3VsZCBiZSB1c2VkLlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIGdldE9iamVjdChrZXksIGZhbGxiYWNrLCBsb2NhbCA9IHRydWUpIHtcclxuICAgIHZhciByZXN1bHQgPSBnZXRTdHJpbmcoa2V5LCBmYWxzZSwgbG9jYWwpO1xyXG5cclxuICAgIGlmICghcmVzdWx0KSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbGxiYWNrO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZShyZXN1bHQpO1xyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2s7XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2s7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXRzIGFuIG9iamVjdCBpbiB0aGUgc3RvcmFnZSwgc3RyaW5naWZ5aW5nIGl0IGZpcnN0IGlmIG5lY2Nlc3NhcnkuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNldCgnc29tZV9rZXknLCB7YTogWzEsIDIsIDNdLCBiOiAndGVzdCd9KTtcclxuICogLy9yZXR1cm5zICd7XCJhXCI6WzEsMiwzXSxcImJcIjpcInRlc3RcIn0nXHJcbiAqIGdldFN0cmluZygnc29tZV9rZXknKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgaXRlbSB0byBvdmVyd3JpdGUgb3IgY3JlYXRlLlxyXG4gKiBAcGFyYW0ge21peGVkfSBkYXRhIGFueSBzdHJpbmdpZnlhYmxlIHR5cGUuXHJcbiAqIEBwYXJhbSB7Ym9vbH0gW2xvY2FsPXRydWVdIHdoZXRoZXIgdG8gc2F2ZSB0aGUgaXRlbSB3aXRoIGEgbmFtZXNwYWNlLlxyXG4gKi9cclxuZnVuY3Rpb24gc2V0KGtleSwgZGF0YSwgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICBpZiAobG9jYWwpIHtcclxuICAgICAgICBrZXkgPSBgJHtrZXl9JHtOQU1FU1BBQ0V9YDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGRhdGEgPT0gJ3N0cmluZycpIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIGRhdGEpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYWxsIGl0ZW1zIHN0YXJ0aW5nIHdpdGggbmFtZXNwYWNlIGZyb20gdGhlIHN0b3JhZ2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNldCgna2V5X3Rlc3QnLCAxKTtcclxuICogc2V0KCdrZXlfdGVzdDInLCAyKTtcclxuICogY2xlYXJOYW1lc3BhY2UoJ2tleV8nKTsgLy9ib3RoIGtleV90ZXN0IGFuZCBrZXlfdGVzdDIgaGF2ZSBiZWVuIHJlbW92ZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lc3BhY2UgdGhlIHByZWZpeCB0byBjaGVjayBmb3Igd2hlbiByZW1vdmluZyBpdGVtcy5cclxuICovXHJcbmZ1bmN0aW9uIGNsZWFyTmFtZXNwYWNlKG5hbWVzcGFjZSkge1xyXG4gICAgT2JqZWN0LmtleXMobG9jYWxTdG9yYWdlKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgaWYgKGtleS5zdGFydHNXaXRoKG5hbWVzcGFjZSkpIHtcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCBhcGkgPSByZXF1aXJlKCcuL2Jsb2NraGVhZHMnKTtcclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnLi9ob29rJyk7XHJcblxyXG5jb25zdCBTVE9SQUdFID0ge1xyXG4gICAgUExBWUVSUzogJ21iX3BsYXllcnMnLFxyXG4gICAgTE9HX0xPQUQ6ICdtYl9sYXN0TG9nTG9hZCcsXHJcbn07XHJcblxyXG52YXIgd29ybGQgPSBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG5hbWU6ICcnLFxyXG4gICAgb25saW5lOiBbXSxcclxuICAgIG93bmVyOiAnJyxcclxuICAgIHBsYXllcnM6IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0UuUExBWUVSUywge30pLFxyXG4gICAgbGlzdHM6IHthZG1pbjogW10sIG1vZDogW10sIHN0YWZmOiBbXSwgYmxhY2s6IFtdLCB3aGl0ZTogW119LFxyXG4gICAgaXNQbGF5ZXIsXHJcbiAgICBpc1NlcnZlcixcclxuICAgIGlzT3duZXIsXHJcbiAgICBpc0FkbWluLFxyXG4gICAgaXNTdGFmZixcclxuICAgIGlzTW9kLFxyXG4gICAgaXNPbmxpbmUsXHJcbiAgICBnZXRKb2lucyxcclxuICAgIGdldElQLFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhIHBsYXllciBoYXMgam9pbmVkIHRoZSBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1BsYXllcihuYW1lKSB7XHJcbiAgICByZXR1cm4gd29ybGQucGxheWVycy5oYXNPd25Qcm9wZXJ0eShuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgdGhlIHNlcnZlclxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNTZXJ2ZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSA9PSAnU0VSVkVSJztcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIHRoZSBvd25lciBvciBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc093bmVyKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5vd25lciA9PSBuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkgfHwgaXNTZXJ2ZXIobmFtZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyBhbiBhZG1pblxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNBZG1pbihuYW1lKSB7XHJcbiAgICByZXR1cm4gd29ybGQubGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpKSB8fCBpc093bmVyKG5hbWUpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgYSBtb2RcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzTW9kKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5saXN0cy5tb2QuaW5jbHVkZXMobmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIGEgc3RhZmYgbWVtYmVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNTdGFmZihuYW1lKSB7XHJcbiAgICByZXR1cm4gaXNBZG1pbihuYW1lKSB8fCBpc01vZChuYW1lKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhIHBsYXllciBpcyBvbmxpbmVcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzT25saW5lKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIG51bWJlciBvZiB0aW1lcyB0aGUgcGxheWVyIGhhcyBqb2luZWQgdGhlIHNlcnZlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7TnVtYmVyfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0Sm9pbnMobmFtZSkge1xyXG4gICAgcmV0dXJuIGlzUGxheWVyKG5hbWUpID8gd29ybGQucGxheWVyc1tuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCldLmpvaW5zIDogMDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIGxhdGVzdCBJUCB1c2VkIGJ5IGEgcGxheWVyXHJcbiAqIFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRJUChuYW1lKSB7XHJcbiAgICByZXR1cm4gaXNQbGF5ZXIobmFtZSkgPyB3b3JsZC5wbGF5ZXJzW25hbWUudG9Mb2NhbGVVcHBlckNhc2UoKV0uaXAgOiAnJztcclxufVxyXG5cclxuLy8gS2VlcCB0aGUgb25saW5lIGxpc3QgdXAgdG8gZGF0ZVxyXG5ob29rLm9uKCd3b3JsZC5qb2luJywgZnVuY3Rpb24obmFtZSkge1xyXG4gICAgaWYgKCF3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICB3b3JsZC5vbmxpbmUucHVzaChuYW1lKTtcclxuICAgIH1cclxufSk7XHJcbmhvb2sub24oJ3dvcmxkLmxlYXZlJywgZnVuY3Rpb24obmFtZSkge1xyXG4gICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5zcGxpY2Uod29ybGQub25saW5lLmluZGV4T2YobmFtZSksIDEpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vIEtlZXAgcGxheWVycyBsaXN0IHVwIHRvIGRhdGVcclxuaG9vay5vbignd29ybGQuam9pbicsIGNoZWNrUGxheWVySm9pbik7XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24uXHJcbiAqIFJlbW92ZXMgYWRtaW5zIGZyb20gdGhlIG1vZCBsaXN0IGFuZCBjcmVhdGVzIHRoZSBzdGFmZiBsaXN0LlxyXG4gKi9cclxuZnVuY3Rpb24gYnVpbGRTdGFmZkxpc3QoKSB7XHJcbiAgICB3b3JsZC5saXN0cy5tb2QgPSB3b3JsZC5saXN0cy5tb2QuZmlsdGVyKG5hbWUgPT4gIWlzQWRtaW4obmFtZSkpO1xyXG4gICAgd29ybGQubGlzdHMuc3RhZmYgPSB3b3JsZC5saXN0cy5hZG1pbi5jb25jYXQod29ybGQubGlzdHMubW9kKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uLlxyXG4gKiBDaGVja3MgaWYgYSBwbGF5ZXIgaGFzIHBlcm1pc3Npb24gdG8gcGVyZm9ybSBhIGNvbW1hbmRcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGNvbW1hbmRcclxuICovXHJcbmZ1bmN0aW9uIHBlcm1pc3Npb25DaGVjayhuYW1lLCBjb21tYW5kKSB7XHJcbiAgICBjb21tYW5kID0gY29tbWFuZC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG5cclxuICAgIGlmIChbJ2FkbWluJywgJ3VuYWRtaW4nLCAnbW9kJywgJ3VubW9kJ10uaW5jbHVkZXMoY29tbWFuZCkpIHtcclxuICAgICAgICByZXR1cm4gaXNBZG1pbihuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoWyd3aGl0ZWxpc3QnLCAndW53aGl0ZWxpc3QnLCAnYmFuJywgJ3VuYmFuJ10uaW5jbHVkZXMoY29tbWFuZCkpIHtcclxuICAgICAgICByZXR1cm4gaXNTdGFmZihuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbi8vIEtlZXAgbGlzdHMgdXAgdG8gZGF0ZVxyXG5ob29rLm9uKCd3b3JsZC5jb21tYW5kJywgZnVuY3Rpb24obmFtZSwgY29tbWFuZCwgdGFyZ2V0KSB7XHJcbiAgICBpZiAoIXBlcm1pc3Npb25DaGVjayhuYW1lLCBjb21tYW5kKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdW4gPSBjb21tYW5kLnN0YXJ0c1dpdGgoJ3VuJyk7XHJcblxyXG4gICAgdmFyIGdyb3VwID0ge1xyXG4gICAgICAgIGFkbWluOiAnYWRtaW4nLFxyXG4gICAgICAgIG1vZDogJ21vZCcsXHJcbiAgICAgICAgd2hpdGVsaXN0OiAnd2hpdGUnLFxyXG4gICAgICAgIGJhbjogJ2JsYWNrJyxcclxuICAgIH1bdW4gPyBjb21tYW5kLnN1YnN0cigyKSA6IGNvbW1hbmRdO1xyXG5cclxuICAgIGlmICh1biAmJiB3b3JsZC5saXN0c1tncm91cF0uaW5jbHVkZXModGFyZ2V0KSkge1xyXG4gICAgICAgIHdvcmxkLmxpc3RzW2dyb3VwXS5zcGxpY2Uod29ybGQubGlzdHNbZ3JvdXBdLmluZGV4T2YodGFyZ2V0KSwgMSk7XHJcbiAgICAgICAgYnVpbGRTdGFmZkxpc3QoKTtcclxuICAgIH0gZWxzZSBpZiAoIXVuICYmICF3b3JsZC5saXN0c1tncm91cF0uaW5jbHVkZXModGFyZ2V0KSkge1xyXG4gICAgICAgIHdvcmxkLmxpc3RzW2dyb3VwXS5wdXNoKHRhcmdldCk7XHJcbiAgICAgICAgYnVpbGRTdGFmZkxpc3QoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24uIEluY3JlbWVudHMgYSBwbGF5ZXIncyBqb2lucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGlwXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja1BsYXllckpvaW4obmFtZSwgaXApIHtcclxuICAgIGlmICh3b3JsZC5wbGF5ZXJzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XHJcbiAgICAgICAgLy9SZXR1cm5pbmcgcGxheWVyXHJcbiAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXS5qb2lucysrO1xyXG4gICAgICAgIGlmICghd29ybGQucGxheWVyc1tuYW1lXS5pcHMuaW5jbHVkZXMoaXApKSB7XHJcbiAgICAgICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uaXBzLnB1c2goaXApO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy9OZXcgcGxheWVyXHJcbiAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXSA9IHtqb2luczogMSwgaXBzOiBbaXBdfTtcclxuICAgIH1cclxuICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uaXAgPSBpcDtcclxuXHJcbiAgICAvLyBPdGhlcndpc2UsIHdlIHdpbGwgZG91YmxlIHBhcnNlIGpvaW5zXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFLkxPR19MT0FELCBNYXRoLmZsb29yKERhdGUubm93KCkudmFsdWVPZigpKSk7XHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFLlBMQVlFUlMsIHdvcmxkLnBsYXllcnMpO1xyXG59XHJcblxyXG5cclxuLy8gVXBkYXRlIGxpc3RzXHJcblByb21pc2UuYWxsKFthcGkuZ2V0TGlzdHMoKSwgYXBpLmdldFdvcmxkTmFtZSgpLCBhcGkuZ2V0T3duZXJOYW1lKCldKVxyXG4gICAgLnRoZW4oKHZhbHVlcykgPT4ge1xyXG4gICAgICAgIHZhciBbYXBpTGlzdHMsIHdvcmxkTmFtZSwgb3duZXJdID0gdmFsdWVzO1xyXG5cclxuICAgICAgICB3b3JsZC5saXN0cyA9IGFwaUxpc3RzO1xyXG4gICAgICAgIGJ1aWxkU3RhZmZMaXN0KCk7XHJcbiAgICAgICAgd29ybGQubmFtZSA9IHdvcmxkTmFtZTtcclxuICAgICAgICB3b3JsZC5vd25lciA9IG93bmVyO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuXHJcbi8vIFVwZGF0ZSBwbGF5ZXJzIHNpbmNlIGxhc3QgYm90IGxvYWRcclxuUHJvbWlzZS5hbGwoW2FwaS5nZXRMb2dzKCksIGFwaS5nZXRXb3JsZE5hbWUoKV0pXHJcbiAgICAudGhlbigodmFsdWVzKSA9PiB7XHJcbiAgICAgICAgdmFyIFtsaW5lcywgd29ybGROYW1lXSA9IHZhbHVlcztcclxuXHJcbiAgICAgICAgdmFyIGxhc3QgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFLkxPR19MT0FELCAwKTtcclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFLkxPR19MT0FELCBNYXRoLmZsb29yKERhdGUubm93KCkudmFsdWVPZigpKSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGxpbmUgb2YgbGluZXMpIHtcclxuICAgICAgICAgICAgbGV0IHRpbWUgPSBuZXcgRGF0ZShsaW5lLnN1YnN0cmluZygwLCBsaW5lLmluZGV4T2YoJ2InKSkucmVwbGFjZSgnICcsICdUJykucmVwbGFjZSgnICcsICdaJykpO1xyXG4gICAgICAgICAgICBsZXQgbWVzc2FnZSA9IGxpbmUuc3Vic3RyaW5nKGxpbmUuaW5kZXhPZignXScpICsgMik7XHJcblxyXG4gICAgICAgICAgICBpZiAodGltZSA8IGxhc3QpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkTmFtZX0gLSBQbGF5ZXIgQ29ubmVjdGVkIGApKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcGFydHMgPSBsaW5lLnN1YnN0cihsaW5lLmluZGV4T2YoJyAtIFBsYXllciBDb25uZWN0ZWQgJykgKyAyMCk7IC8vTkFNRSB8IElQIHwgSURcclxuICAgICAgICAgICAgICAgIGxldCBbLCBuYW1lLCBpcF0gPSBwYXJ0cy5tYXRjaCgvKC4qKSBcXHwgKFtcXHcuXSspIFxcfCAuezMyfVxccyovKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjaGVja1BsYXllckpvaW4obmFtZSwgaXApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFLlBMQVlFUlMsIHdvcmxkLnBsYXllcnMpO1xyXG4gICAgfSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IHNlbmQgPSByZXF1aXJlKCdib3QnKS5zZW5kO1xyXG5jb25zdCBwcmVmZXJlbmNlcyA9IHJlcXVpcmUoJ3NldHRpbmdzL2JvdCcpO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0Fubm91bmNlbWVudHMnLCAnbWVzc2FnZXMnKTtcclxudGFiLmlubmVySFRNTCA9IFwiPHRlbXBsYXRlIGlkPVxcXCJhVGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb2x1bW4gaXMtZnVsbFxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxsYWJlbD5TZW5kOjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPHRleHRhcmVhIGNsYXNzPVxcXCJ0ZXh0YXJlYSBpcy1mbHVpZCBtXFxcIj48L3RleHRhcmVhPlxcclxcbiAgICAgICAgICAgIDxhPkRlbGV0ZTwvYT5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICAgICAgPGRpdj5cXHJcXG4gICAgICAgICAgICBXYWl0IFggbWludXRlcy4uLlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvdGVtcGxhdGU+XFxyXFxuPGRpdiBpZD1cXFwibWJfYW5ub3VuY2VtZW50c1xcXCIgY2xhc3M9XFxcImNvbnRhaW5lciBpcy1mbHVpZFxcXCI+XFxyXFxuICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJzZWN0aW9uIGlzLXNtYWxsXFxcIj5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJidXR0b24gaXMtcHJpbWFyeSBpcy1wdWxsZWQtcmlnaHRcXFwiPis8L3NwYW4+XFxyXFxuICAgICAgICA8aDM+VGhlc2UgYXJlIHNlbnQgYWNjb3JkaW5nIHRvIGEgcmVndWxhciBzY2hlZHVsZS48L2gzPlxcclxcbiAgICAgICAgPHNwYW4+SWYgeW91IGhhdmUgb25lIGFubm91bmNlbWVudCwgaXQgaXMgc2VudCBldmVyeSBYIG1pbnV0ZXMsIGlmIHlvdSBoYXZlIHR3bywgdGhlbiB0aGUgZmlyc3QgaXMgc2VudCBhdCBYIG1pbnV0ZXMsIGFuZCB0aGUgc2Vjb25kIGlzIHNlbnQgWCBtaW51dGVzIGFmdGVyIHRoZSBmaXJzdC4gQ2hhbmdlIFggaW4gdGhlIHNldHRpbmdzIHRhYi4gT25jZSB0aGUgYm90IHJlYWNoZXMgdGhlIGVuZCBvZiB0aGUgbGlzdCwgaXQgc3RhcnRzIG92ZXIgYXQgdGhlIHRvcC48L3NwYW4+XFxyXFxuICAgIDwvc2VjdGlvbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwiYU1zZ3NcXFwiIGNsYXNzPVxcXCJjb2x1bW5zIGlzLW11bHRpbGluZVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGFubm91bmNlbWVudENoZWNrKDApLFxyXG59O1xyXG5cclxuZnVuY3Rpb24gYWRkTWVzc2FnZSh0ZXh0ID0gJycpIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2FUZW1wbGF0ZScsICcjYU1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLm0nLCB0ZXh0OiB0ZXh0fVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICBhbm5vdW5jZW1lbnRzID0gQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnLm0nKSlcclxuICAgICAgICAubWFwKGVsID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHttZXNzYWdlOiBlbC52YWx1ZX07XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgc3RvcmFnZS5zZXQoJ2Fubm91bmNlbWVudEFycicsIGFubm91bmNlbWVudHMpO1xyXG59XHJcblxyXG4vLyBBbm5vdW5jZW1lbnRzIGNvbGxlY3Rpb25cclxudmFyIGFubm91bmNlbWVudHMgPSBzdG9yYWdlLmdldE9iamVjdCgnYW5ub3VuY2VtZW50QXJyJywgW10pO1xyXG5cclxuLy8gU2hvdyBzYXZlZCBhbm5vdW5jZW1lbnRzXHJcbmFubm91bmNlbWVudHNcclxuICAgIC5tYXAoYW5uID0+IGFubi5tZXNzYWdlKVxyXG4gICAgLmZvckVhY2goYWRkTWVzc2FnZSk7XHJcblxyXG5cclxuLy8gU2VuZHMgYW5ub3VuY2VtZW50cyBhZnRlciB0aGUgc3BlY2lmaWVkIGRlbGF5LlxyXG5mdW5jdGlvbiBhbm5vdW5jZW1lbnRDaGVjayhpKSB7XHJcbiAgICBpID0gKGkgPj0gYW5ub3VuY2VtZW50cy5sZW5ndGgpID8gMCA6IGk7XHJcblxyXG4gICAgdmFyIGFubiA9IGFubm91bmNlbWVudHNbaV07XHJcblxyXG4gICAgaWYgKGFubiAmJiBhbm4ubWVzc2FnZSkge1xyXG4gICAgICAgIHNlbmQoYW5uLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gICAgc2V0VGltZW91dChhbm5vdW5jZW1lbnRDaGVjaywgcHJlZmVyZW5jZXMuYW5ub3VuY2VtZW50RGVsYXkgKiA2MDAwMCwgaSArIDEpO1xyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYnVpbGRBbmRTZW5kTWVzc2FnZSxcclxuICAgIGJ1aWxkTWVzc2FnZSxcclxufTtcclxuXHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcbmNvbnN0IHNlbmQgPSByZXF1aXJlKCdib3QnKS5zZW5kO1xyXG5cclxuZnVuY3Rpb24gYnVpbGRBbmRTZW5kTWVzc2FnZShtZXNzYWdlLCBuYW1lKSB7XHJcbiAgICBzZW5kKGJ1aWxkTWVzc2FnZShtZXNzYWdlLCBuYW1lKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ1aWxkTWVzc2FnZShtZXNzYWdlLCBuYW1lKSB7XHJcbiAgICBtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKC97eyhbXn1dKyl9fS9nLCBmdW5jdGlvbihmdWxsLCBrZXkpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBOQU1FOiBuYW1lLFxyXG4gICAgICAgICAgICBOYW1lOiBuYW1lWzBdICsgbmFtZS5zdWJzdHJpbmcoMSkudG9Mb2NhbGVMb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgbmFtZTogbmFtZS50b0xvY2FsZUxvd2VyQ2FzZSgpXHJcbiAgICAgICAgfVtrZXldIHx8IGZ1bGw7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykpIHtcclxuICAgICAgICBtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKC97e2lwfX0vZ2ksIHdvcmxkLmdldElQKG5hbWUpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbWVzc2FnZTtcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNoZWNrSm9pbnNBbmRHcm91cCxcclxuICAgIGNoZWNrSm9pbnMsXHJcbiAgICBjaGVja0dyb3VwLFxyXG59O1xyXG5cclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuXHJcblxyXG5mdW5jdGlvbiBjaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSB7XHJcbiAgICByZXR1cm4gY2hlY2tKb2lucyhuYW1lLCBtc2cuam9pbnNfbG93LCBtc2cuam9pbnNfaGlnaCkgJiYgY2hlY2tHcm91cChuYW1lLCBtc2cuZ3JvdXAsIG1zZy5ub3RfZ3JvdXApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja0pvaW5zKG5hbWUsIGxvdywgaGlnaCkge1xyXG4gICAgcmV0dXJuIHdvcmxkLmdldEpvaW5zKG5hbWUpID49IGxvdyAmJiB3b3JsZC5nZXRKb2lucyhuYW1lKSA8PSBoaWdoO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja0dyb3VwKG5hbWUsIGdyb3VwLCBub3RfZ3JvdXApIHtcclxuICAgIHJldHVybiBpc0luR3JvdXAobmFtZSwgZ3JvdXApICYmICFpc0luR3JvdXAobmFtZSwgbm90X2dyb3VwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNJbkdyb3VwKG5hbWUsIGdyb3VwKSB7XHJcbiAgICBzd2l0Y2ggKGdyb3VwLnRvTG9jYWxlTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICBjYXNlICdhbGwnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNQbGF5ZXIobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnYWRtaW4nOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNBZG1pbihuYW1lKTtcclxuICAgICAgICBjYXNlICdtb2QnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNNb2QobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnc3RhZmYnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNTdGFmZihuYW1lKTtcclxuICAgICAgICBjYXNlICdvd25lcic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc093bmVyKG5hbWUpO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG4iLCJPYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2J1aWxkTWVzc2FnZScpLFxyXG4gICAgcmVxdWlyZSgnLi9jaGVja0pvaW5zQW5kR3JvdXAnKSxcclxuICAgIHJlcXVpcmUoJy4vc2hvd1N1bW1hcnknKVxyXG4pO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNob3dTdW1tYXJ5XHJcbn07XHJcblxyXG4vKipcclxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGNyZWF0ZSBhbmQgZGlzcGxheSBhIHN1bW1hcnkgb2YgdGhlIG9wdGlvbnMgY2hhbmdlZC5cclxuICpcclxuICogQHBhcmFtIHtOb2RlfSBjb250YWluZXIgdGhlIG1lc3NhZ2UgY29udGFpbmVyIHdoaWNoIG5lZWRzIGFuIHVwZGF0ZWQgc3VtbWFyeS5cclxuICovXHJcbmZ1bmN0aW9uIHNob3dTdW1tYXJ5KGNvbnRhaW5lcikge1xyXG4gICAgdmFyIG91dCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcuc3VtbWFyeScpO1xyXG5cclxuICAgIGlmICghb3V0KSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBncm91cCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJncm91cFwiXScpLnZhbHVlO1xyXG4gICAgdmFyIG5vdF9ncm91cCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0nKS52YWx1ZTtcclxuICAgIHZhciBqb2luc19sb3cgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJykudmFsdWU7XHJcbiAgICB2YXIgam9pbnNfaGlnaCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWU7XHJcblxyXG4gICAgdmFyIGdyb3Vwc0FsdGVyZWQgPSBncm91cCAhPSAnYWxsJyB8fCBub3RfZ3JvdXAgIT0gJ25vYm9keSc7XHJcbiAgICB2YXIgam9pbnNBbHRlcmVkID0gam9pbnNfbG93ICE9IFwiMFwiIHx8IGpvaW5zX2hpZ2ggIT0gXCI5OTk5XCI7XHJcblxyXG4gICAgaWYgKGdyb3Vwc0FsdGVyZWQgJiYgam9pbnNBbHRlcmVkKSB7XHJcbiAgICAgICAgb3V0LnRleHRDb250ZW50ID0gYCR7Z3JvdXB9IC8gbm90ICR7bm90X2dyb3VwfSBhbmQgJHtqb2luc19sb3d9IOKJpCBqb2lucyDiiaQgJHtqb2luc19oaWdofWA7XHJcbiAgICB9IGVsc2UgaWYgKGdyb3Vwc0FsdGVyZWQpIHtcclxuICAgICAgICBvdXQudGV4dENvbnRlbnQgPSBgJHtncm91cH0gLyBub3QgJHtub3RfZ3JvdXB9YDtcclxuICAgIH0gZWxzZSBpZiAoam9pbnNBbHRlcmVkKSB7XHJcbiAgICAgICAgb3V0LnRleHRDb250ZW50ID0gYCR7am9pbnNfbG93fSDiiaQgam9pbnMg4omkICR7am9pbnNfaGlnaH1gO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBvdXQudGV4dENvbnRlbnQgPSAnJztcclxuICAgIH1cclxufVxyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcblxyXG5jb25zdCBoZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzJyk7XHJcblxyXG52YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG5lbC5pbm5lckhUTUwgPSBcIiNtYl9qb2luPmgzLCNtYl9sZWF2ZT5oMywjbWJfdHJpZ2dlcj5oMywjbWJfYW5ub3VuY2VtZW50cz5oM3ttYXJnaW46MCAwIDVweCA2ZW19I21iX2pvaW4+c3BhbiwjbWJfbGVhdmU+c3BhbiwjbWJfdHJpZ2dlcj5zcGFuLCNtYl9hbm5vdW5jZW1lbnRzPnNwYW57bWFyZ2luLWxlZnQ6NmVtfSNtYl9qb2luIGlucHV0W3R5cGU9XFxcIm51bWJlclxcXCJdLCNtYl9sZWF2ZSBpbnB1dFt0eXBlPVxcXCJudW1iZXJcXFwiXSwjbWJfdHJpZ2dlciBpbnB1dFt0eXBlPVxcXCJudW1iZXJcXFwiXSwjbWJfYW5ub3VuY2VtZW50cyBpbnB1dFt0eXBlPVxcXCJudW1iZXJcXFwiXXt3aWR0aDo1ZW19I2pNc2dzLCNsTXNncywjdE1zZ3MsI2FNc2dze2JvcmRlci10b3A6MXB4IHNvbGlkICMwMDB9I2pNc2dzIHNtYWxsLCNsTXNncyBzbWFsbCwjdE1zZ3Mgc21hbGwsI2FNc2dzIHNtYWxse2NvbG9yOiM3Nzd9XFxuXCI7XHJcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxudWkuYWRkVGFiR3JvdXAoJ01lc3NhZ2VzJywgJ21lc3NhZ2VzJyk7XHJcblxyXG5bXHJcbiAgICByZXF1aXJlKCcuL2pvaW4nKSxcclxuICAgIHJlcXVpcmUoJy4vbGVhdmUnKSxcclxuICAgIHJlcXVpcmUoJy4vdHJpZ2dlcicpLFxyXG4gICAgcmVxdWlyZSgnLi9hbm5vdW5jZW1lbnRzJylcclxuXS5mb3JFYWNoKCh7dGFiLCBzYXZlLCBhZGRNZXNzYWdlLCBzdGFydH0pID0+IHtcclxuICAgIHRhYi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGNoZWNrRGVsZXRlKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC50YWdOYW1lICE9ICdBJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1aS5hbGVydCgnUmVhbGx5IGRlbGV0ZSB0aGlzIG1lc3NhZ2U/JywgW1xyXG4gICAgICAgICAgICB7dGV4dDogJ1llcycsIHN0eWxlOiAnaXMtZGFuZ2VyJywgYWN0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIHZhciBlbCA9IGV2ZW50LnRhcmdldDtcclxuICAgICAgICAgICAgICAgIHdoaWxlICgoZWwgPSBlbC5wYXJlbnRFbGVtZW50KSAmJiAhZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdjb2x1bW4nKSlcclxuICAgICAgICAgICAgICAgICAgICA7XHJcbiAgICAgICAgICAgICAgICBlbC5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNhdmUoKTtcclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHt0ZXh0OiAnQ2FuY2VsJ31cclxuICAgICAgICBdKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHRhYi5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBzYXZlKTtcclxuXHJcbiAgICB0YWIucXVlcnlTZWxlY3RvcignLmJ1dHRvbi5pcy1wcmltYXJ5JylcclxuICAgICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiBhZGRNZXNzYWdlKCkpO1xyXG5cclxuICAgIC8vIERvbid0IHN0YXJ0IHJlc3BvbmRpbmcgdG8gY2hhdCBmb3IgMTAgc2Vjb25kc1xyXG4gICAgc2V0VGltZW91dChzdGFydCwgMTAwMDApO1xyXG59KTtcclxuXHJcbltcclxuICAgIHJlcXVpcmUoJy4vam9pbicpLFxyXG4gICAgcmVxdWlyZSgnLi9sZWF2ZScpLFxyXG4gICAgcmVxdWlyZSgnLi90cmlnZ2VyJylcclxuXS5mb3JFYWNoKCh7dGFifSkgPT4ge1xyXG4gICAgdGFiLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyIGVsID0gZXZlbnQudGFyZ2V0O1xyXG4gICAgICAgIHdoaWxlICgoZWwgPSBlbC5wYXJlbnRFbGVtZW50KSAmJiAhZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdjb2x1bW4nKSlcclxuICAgICAgICAgICAgO1xyXG5cclxuICAgICAgICBoZWxwZXJzLnNob3dTdW1tYXJ5KGVsKTtcclxuICAgIH0pO1xyXG59KTtcclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5cclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBoZWxwZXJzID0gcmVxdWlyZSgnbWVzc2FnZXMvaGVscGVycycpO1xyXG5cclxuXHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnam9pbkFycic7XHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdKb2luJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjx0ZW1wbGF0ZSBpZD1cXFwialRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY29sdW1uIGlzLTQtZGVza3RvcCBpcy02LXRhYmxldFxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxsYWJlbD4gTWVzc2FnZTogPHRleHRhcmVhIGNsYXNzPVxcXCJ0ZXh0YXJlYSBpcy1mbHVpZCBtXFxcIj48L3RleHRhcmVhPjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGRldGFpbHM+PHN1bW1hcnk+TW9yZSBvcHRpb25zIDxzbWFsbCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+PC9zbWFsbD48L3N1bW1hcnk+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXM6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcImdyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFsbFxcXCI+YW55b25lPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXMgbm90OiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJub3RfZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibm9ib2R5XFxcIj5ub2JvZHk8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcInN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJvd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjBcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19sb3dcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3Bhbj4gJmxlOyBwbGF5ZXIgam9pbnMgJmxlOyA8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCI5OTk5XFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfaGlnaFxcXCI+XFxyXFxuICAgICAgICAgICAgPC9kZXRhaWxzPlxcclxcbiAgICAgICAgICAgIDxhPkRlbGV0ZTwvYT5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2pvaW5cXFwiIGNsYXNzPVxcXCJjb250YWluZXIgaXMtZmx1aWRcXFwiPlxcclxcbiAgICA8c2VjdGlvbiBjbGFzcz1cXFwic2VjdGlvbiBpcy1zbWFsbFxcXCI+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYnV0dG9uIGlzLXByaW1hcnkgaXMtcHVsbGVkLXJpZ2h0XFxcIj4rPC9zcGFuPlxcclxcbiAgICAgICAgPGgzPlRoZXNlIGFyZSBjaGVja2VkIHdoZW4gYSBwbGF5ZXIgam9pbnMgdGhlIHNlcnZlci48L2gzPlxcclxcbiAgICAgICAgPHNwYW4+WW91IGNhbiB1c2Uge3tOYW1lfX0sIHt7TkFNRX19LCB7e25hbWV9fSwgYW5kIHt7aXB9fSBpbiB5b3VyIG1lc3NhZ2UuPC9zcGFuPlxcclxcbiAgICA8L3NlY3Rpb24+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImpNc2dzXFxcIiBjbGFzcz1cXFwiY29sdW1ucyBpcy1tdWx0aWxpbmVcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxuICAgIHN0YXJ0OiAoKSA9PiBob29rLm9uKCd3b3JsZC5qb2luJywgb25Kb2luKSxcclxufTtcclxuXHJcbnZhciBqb2luTWVzc2FnZXMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSk7XHJcbmpvaW5NZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5cclxuQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI2pNc2dzID4gZGl2JykpXHJcbiAgICAuZm9yRWFjaChoZWxwZXJzLnNob3dTdW1tYXJ5KTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBhZGQgYSB0cmlnZ2VyIG1lc3NhZ2UgdG8gdGhlIHBhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKG1zZyA9IHt9KSB7XHJcbiAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNqVGVtcGxhdGUnLCAnI2pNc2dzJywgW1xyXG4gICAgICAgIHtzZWxlY3RvcjogJ29wdGlvbicsIHJlbW92ZTogWydzZWxlY3RlZCddLCBtdWx0aXBsZTogdHJ1ZX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLm0nLCB0ZXh0OiBtc2cubWVzc2FnZSB8fCAnJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJywgdmFsdWU6IG1zZy5qb2luc19sb3cgfHwgMH0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScsIHZhbHVlOiBtc2cuam9pbnNfaGlnaCB8fCA5OTk5fSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJncm91cFwiXSBbdmFsdWU9XCIke21zZy5ncm91cCB8fCAnYWxsJ31cIl1gLCBzZWxlY3RlZDogJ3NlbGVjdGVkJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLm5vdF9ncm91cCB8fCAnbm9ib2R5J31cIl1gLCBzZWxlY3RlZDogJ3NlbGVjdGVkJ31cclxuICAgIF0pO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzYXZlIHRoZSB1c2VyJ3MgbWVzc2FnZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgam9pbk1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjak1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgam9pbk1lc3NhZ2VzLnB1c2goe1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignLm0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfbG93OiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19oaWdoOiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBub3RfZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGpvaW5NZXNzYWdlcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGxpc3RlbiB0byBwbGF5ZXIgam9pbnNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICovXHJcbmZ1bmN0aW9uIG9uSm9pbihuYW1lKSB7XHJcbiAgICBqb2luTWVzc2FnZXMuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgIGlmIChoZWxwZXJzLmNoZWNrSm9pbnNBbmRHcm91cChuYW1lLCBtc2cpKSB7XHJcbiAgICAgICAgICAgIGhlbHBlcnMuYnVpbGRBbmRTZW5kTWVzc2FnZShtc2cubWVzc2FnZSwgbmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5cclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBoZWxwZXJzID0gcmVxdWlyZSgnbWVzc2FnZXMvaGVscGVycycpO1xyXG5cclxuXHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnbGVhdmVBcnInO1xyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignTGVhdmUnLCAnbWVzc2FnZXMnKTtcclxudGFiLmlubmVySFRNTCA9IFwiPHRlbXBsYXRlIGlkPVxcXCJsVGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb2x1bW4gaXMtNC1kZXNrdG9wIGlzLTYtdGFibGV0XFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPk1lc3NhZ2UgPHRleHRhcmVhIGNsYXNzPVxcXCJ0ZXh0YXJlYSBpcy1mbHVpZCBtXFxcIj48L3RleHRhcmVhPjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGRldGFpbHM+PHN1bW1hcnk+TW9yZSBvcHRpb25zIDxzbWFsbCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+PC9zbWFsbD48L3N1bW1hcnk+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXM6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcImdyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFsbFxcXCI+YW55b25lPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXMgbm90OiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJub3RfZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibm9ib2R5XFxcIj5ub2JvZHk8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcInN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJvd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjBcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19sb3dcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3Bhbj4gJmxlOyBwbGF5ZXIgam9pbnMgJmxlOyA8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCI5OTk5XFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfaGlnaFxcXCI+XFxyXFxuICAgICAgICAgICAgPC9kZXRhaWxzPlxcclxcbiAgICAgICAgICAgIDxhPkRlbGV0ZTwvYT5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2xlYXZlXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgICAgIDxoMz5UaGVzZSBhcmUgY2hlY2tlZCB3aGVuIGEgcGxheWVyIGxlYXZlcyB0aGUgc2VydmVyLjwvaDM+XFxyXFxuICAgICAgICA8c3Bhbj5Zb3UgY2FuIHVzZSB7e05hbWV9fSwge3tOQU1FfX0sIHt7bmFtZX19LCBhbmQge3tpcH19IGluIHlvdXIgbWVzc2FnZS48L3NwYW4+XFxyXFxuICAgIDwvc2VjdGlvbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwibE1zZ3NcXFwiIGNsYXNzPVxcXCJjb2x1bW5zIGlzLW11bHRpbGluZVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGhvb2sub24oJ3dvcmxkLmxlYXZlJywgb25MZWF2ZSksXHJcbn07XHJcblxyXG52YXIgbGVhdmVNZXNzYWdlcyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdKTtcclxubGVhdmVNZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5cclxuQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI2xNc2dzID4gZGl2JykpXHJcbiAgICAuZm9yRWFjaChoZWxwZXJzLnNob3dTdW1tYXJ5KTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgbGVhdmUgbWVzc2FnZSB0byB0aGUgcGFnZS5cclxuICovXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UobXNnID0ge30pIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2xUZW1wbGF0ZScsICcjbE1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnb3B0aW9uJywgcmVtb3ZlOiBbJ3NlbGVjdGVkJ10sIG11bHRpcGxlOiB0cnVlfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IG1zZy5tZXNzYWdlIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdhbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdub2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhdmUgdGhlIGN1cnJlbnQgbGVhdmUgbWVzc2FnZXNcclxuICovXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICBsZWF2ZU1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjbE1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGVhdmVNZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2xvdzogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfaGlnaDogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGdyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgbm90X2dyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBsZWF2ZU1lc3NhZ2VzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gbGlzdGVuIHRvIHBsYXllciBkaXNjb25uZWN0aW9ucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIHBsYXllciBsZWF2aW5nLlxyXG4gKi9cclxuZnVuY3Rpb24gb25MZWF2ZShuYW1lKSB7XHJcbiAgICBsZWF2ZU1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAoaGVscGVycy5jaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuY29uc3Qgc2V0dGluZ3MgPSByZXF1aXJlKCdzZXR0aW5ncy9ib3QnKTtcclxuXHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ3RyaWdnZXJBcnInO1xyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignVHJpZ2dlcicsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8dGVtcGxhdGUgaWQ9XFxcInRUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNvbHVtbiBpcy00LWRlc2t0b3AgaXMtNi10YWJsZXRcXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYm94XFxcIj5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+VHJpZ2dlcjogPGlucHV0IGNsYXNzPVxcXCJpbnB1dCB0XFxcIj48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxsYWJlbD5NZXNzYWdlOiA8dGV4dGFyZWEgY2xhc3M9XFxcInRleHRhcmVhIGlzLWZsdWlkIG1cXFwiPjwvdGV4dGFyZWE+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICA8ZGV0YWlscz48c3VtbWFyeT5Nb3JlIG9wdGlvbnMgPHNtYWxsIGNsYXNzPVxcXCJzdW1tYXJ5XFxcIj48L3NtYWxsPjwvc3VtbWFyeT5cXHJcXG4gICAgICAgICAgICAgICAgPGxhYmVsPlBsYXllciBpczogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwiZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWxsXFxcIj5hbnlvbmU8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcInN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJvd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICAgICAgPGxhYmVsPlBsYXllciBpcyBub3Q6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcIm5vdF9ncm91cFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJub2JvZHlcXFwiPm5vYm9keTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwic3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJtb2RcXFwiPmEgbW9kPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiMFxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2xvd1xcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxzcGFuPiAmbGU7IHBsYXllciBqb2lucyAmbGU7IDwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjk5OTlcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19oaWdoXFxcIj5cXHJcXG4gICAgICAgICAgICA8L2RldGFpbHM+XFxyXFxuICAgICAgICAgICAgPGE+RGVsZXRlPC9hPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvdGVtcGxhdGU+XFxyXFxuPGRpdiBpZD1cXFwibWJfdHJpZ2dlclxcXCIgY2xhc3M9XFxcImNvbnRhaW5lciBpcy1mbHVpZFxcXCI+XFxyXFxuICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJzZWN0aW9uIGlzLXNtYWxsXFxcIj5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJidXR0b24gaXMtcHJpbWFyeSBpcy1wdWxsZWQtcmlnaHRcXFwiPis8L3NwYW4+XFxyXFxuICAgICAgICA8aDM+VGhlc2UgYXJlIGNoZWNrZWQgd2hlbmV2ZXIgc29tZW9uZSBzYXlzIHNvbWV0aGluZy48L2gzPlxcclxcbiAgICAgICAgPHNwYW4+WW91IGNhbiB1c2Uge3tOYW1lfX0sIHt7TkFNRX19LCB7e25hbWV9fSwgYW5kIHt7aXB9fSBpbiB5b3VyIG1lc3NhZ2UuIElmIHlvdSBwdXQgYW4gYXN0ZXJpc2sgKCopIGluIHlvdXIgdHJpZ2dlciwgaXQgd2lsbCBiZSB0cmVhdGVkIGFzIGEgd2lsZGNhcmQuIChUcmlnZ2VyIFxcXCJ0ZSpzdFxcXCIgd2lsbCBtYXRjaCBcXFwidGVhIHN0dWZmXFxcIiBhbmQgXFxcInRlc3RcXFwiKTwvc3Bhbj5cXHJcXG4gICAgPC9zZWN0aW9uPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJ0TXNnc1xcXCIgY2xhc3M9XFxcImNvbHVtbnMgaXMtbXVsdGlsaW5lXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbiAgICBzdGFydDogKCkgPT4gaG9vay5vbignd29ybGQubWVzc2FnZScsIGNoZWNrVHJpZ2dlcnMpLFxyXG59O1xyXG5cclxudmFyIHRyaWdnZXJNZXNzYWdlcyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdKTtcclxudHJpZ2dlck1lc3NhZ2VzLmZvckVhY2goYWRkTWVzc2FnZSk7XHJcbkFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJyN0TXNncyA+IGRpdicpKVxyXG4gICAgLmZvckVhY2goaGVscGVycy5zaG93U3VtbWFyeSk7XHJcblxyXG4vKipcclxuICogQWRkcyBhIHRyaWdnZXIgbWVzc2FnZSB0byB0aGUgcGFnZS5cclxuICovXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UobXNnID0ge30pIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI3RUZW1wbGF0ZScsICcjdE1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnb3B0aW9uJywgcmVtb3ZlOiBbJ3NlbGVjdGVkJ10sIG11bHRpcGxlOiB0cnVlfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IG1zZy5tZXNzYWdlIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICcudCcsIHZhbHVlOiBtc2cudHJpZ2dlciB8fCAnJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJywgdmFsdWU6IG1zZy5qb2luc19sb3cgfHwgMH0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScsIHZhbHVlOiBtc2cuam9pbnNfaGlnaCB8fCA5OTk5fSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJncm91cFwiXSBbdmFsdWU9XCIke21zZy5ncm91cCB8fCAnYWxsJ31cIl1gLCBzZWxlY3RlZDogJ3NlbGVjdGVkJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLm5vdF9ncm91cCB8fCAnbm9ib2R5J31cIl1gLCBzZWxlY3RlZDogJ3NlbGVjdGVkJ31cclxuICAgIF0pO1xyXG59XHJcblxyXG4vKipcclxuICogU2F2ZXMgdGhlIGN1cnJlbnQgdHJpZ2dlciBtZXNzYWdlcy5cclxuICovXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICB0cmlnZ2VyTWVzc2FnZXMgPSBbXTtcclxuICAgIEFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJyN0TXNncyA+IGRpdicpKS5mb3JFYWNoKGNvbnRhaW5lciA9PiB7XHJcbiAgICAgICAgaWYgKCFjb250YWluZXIucXVlcnlTZWxlY3RvcignLm0nKS52YWx1ZSB8fCAhY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy50JykudmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJpZ2dlck1lc3NhZ2VzLnB1c2goe1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignLm0nKS52YWx1ZSxcclxuICAgICAgICAgICAgdHJpZ2dlcjogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy50JykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2xvdzogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfaGlnaDogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGdyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgbm90X2dyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCB0cmlnZ2VyTWVzc2FnZXMpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGEgdHJpZ2dlciBhZ2FpbnN0IGEgbWVzc2FnZSB0byBzZWUgaWYgaXQgbWF0Y2hlcy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHRyaWdnZXIgdGhlIHRyaWdnZXIgdG8gdHJ5IHRvIG1hdGNoXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXHJcbiAqL1xyXG5mdW5jdGlvbiB0cmlnZ2VyTWF0Y2godHJpZ2dlciwgbWVzc2FnZSkge1xyXG4gICAgaWYgKHNldHRpbmdzLnJlZ2V4VHJpZ2dlcnMpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cCh0cmlnZ2VyLCAnaScpLnRlc3QobWVzc2FnZSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICB1aS5ub3RpZnkoYFNraXBwaW5nIHRyaWdnZXIgJyR7dHJpZ2dlcn0nIGFzIHRoZSBSZWdFeCBpcyBpbnZhaWxkLmApO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoXHJcbiAgICAgICAgICAgIHRyaWdnZXJcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oWy4rP149IToke30oKXxcXFtcXF1cXC9cXFxcXSkvZywgXCJcXFxcJDFcIilcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXCovZywgXCIuKlwiKSxcclxuICAgICAgICAgICAgJ2knXHJcbiAgICAgICAgKS50ZXN0KG1lc3NhZ2UpO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBjaGVjayBpbmNvbWluZyBwbGF5ZXIgbWVzc2FnZXMgZm9yIHRyaWdnZXJzXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBwbGF5ZXIncyBuYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja1RyaWdnZXJzKG5hbWUsIG1lc3NhZ2UpIHtcclxuICAgIHZhciB0b3RhbEFsbG93ZWQgPSBzZXR0aW5ncy5tYXhSZXNwb25zZXM7XHJcbiAgICB0cmlnZ2VyTWVzc2FnZXMuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgIGlmICh0b3RhbEFsbG93ZWQgJiYgaGVscGVycy5jaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSAmJiB0cmlnZ2VyTWF0Y2gobXNnLnRyaWdnZXIsIG1lc3NhZ2UpKSB7XHJcbiAgICAgICAgICAgIGhlbHBlcnMuYnVpbGRBbmRTZW5kTWVzc2FnZShtc2cubWVzc2FnZSwgbmFtZSk7XHJcbiAgICAgICAgICAgIHRvdGFsQWxsb3dlZC0tO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBTVE9SQUdFX0lEID0gJ21iX3ByZWZlcmVuY2VzJztcclxuXHJcbnZhciBwcmVmcyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIHt9LCBmYWxzZSk7XHJcblxyXG4vLyBTZXQgdGhlIGRlZmF1bHQgc2V0dGluZ3NcclxuW1xyXG4gICAge3R5cGU6ICdudW1iZXInLCBrZXk6ICdhbm5vdW5jZW1lbnREZWxheScsIGRlZmF1bHQ6IDEwfSxcclxuICAgIHt0eXBlOiAnbnVtYmVyJywga2V5OiAnbWF4UmVzcG9uc2VzJywgZGVmYXVsdDogMn0sXHJcbiAgICB7dHlwZTogJ2Jvb2xlYW4nLCBrZXk6ICdub3RpZnknLCBkZWZhdWx0OiB0cnVlfSxcclxuICAgIC8vIEFkdmFuY2VkXHJcbiAgICB7dHlwZTogJ2Jvb2xlYW4nLCBrZXk6ICdkaXNhYmxlVHJpbScsIGRlZmF1bHQ6IGZhbHNlfSxcclxuICAgIHt0eXBlOiAnYm9vbGVhbicsIGtleTogJ3JlZ2V4VHJpZ2dlcnMnLCBkZWZhdWx0OiBmYWxzZX0sXHJcbiAgICB7dHlwZTogJ2Jvb2xlYW4nLCBrZXk6ICdzcGxpdE1lc3NhZ2VzJywgZGVmYXVsdDogZmFsc2V9LFxyXG4gICAge3R5cGU6ICdzdHJpbmcnLCBrZXk6ICdzcGxpdFRva2VuJywgZGVmYXVsdDogJzxzcGxpdD4nfSxcclxuXS5mb3JFYWNoKHByZWYgPT4ge1xyXG4gICAgLy8gU2V0IGRlZmF1bHRzIGlmIG5vdCBzZXRcclxuICAgIGlmICh0eXBlb2YgcHJlZnNbcHJlZi5rZXldICE9ICBwcmVmLnR5cGUpIHtcclxuICAgICAgICBwcmVmc1twcmVmLmtleV0gPSBwcmVmLmRlZmF1bHQ7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gQXV0byBzYXZlIG9uIGNoYW5nZVxyXG4vLyBJRSAoYWxsKSAvIFNhZmFyaSAoPCAxMCkgZG9lc24ndCBzdXBwb3J0IHByb3hpZXNcclxuaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBwcmVmcztcclxuICAgIHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIHByZWZzLCBmYWxzZSk7XHJcbiAgICB9LCAzMCAqIDEwMDApO1xyXG59IGVsc2Uge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBuZXcgUHJveHkocHJlZnMsIHtcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKG9iaiwgcHJvcCwgdmFsKSB7XHJcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIG9ialtwcm9wXSA9IHZhbDtcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIHByZWZzLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5jb25zdCBwcmVmcyA9IHJlcXVpcmUoJ3NldHRpbmdzL2JvdCcpO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0JvdCcsICdzZXR0aW5ncycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8ZGl2IGlkPVxcXCJtYl9zZXR0aW5nc1xcXCIgY2xhc3M9XFxcImNvbnRhaW5lclxcXCI+XFxyXFxuICAgIDxoMyBjbGFzcz1cXFwidGl0bGVcXFwiPkdlbmVyYWwgU2V0dGluZ3M8L2gzPlxcclxcbiAgICA8bGFiZWw+TWludXRlcyBiZXR3ZWVuIGFubm91bmNlbWVudHM8L2xhYmVsPlxcclxcbiAgICA8cCBjbGFzcz1cXFwiY29udHJvbFxcXCI+XFxyXFxuICAgICAgICA8aW5wdXQgY2xhc3M9XFxcImlucHV0XFxcIiBkYXRhLWtleT1cXFwiYW5ub3VuY2VtZW50RGVsYXlcXFwiIHR5cGU9XFxcIm51bWJlclxcXCI+PGJyPlxcclxcbiAgICA8L3A+XFxyXFxuICAgIDxsYWJlbD5NYXhpbXVtIHRyaWdnZXIgcmVzcG9uc2VzIHRvIGEgbWVzc2FnZTwvbGFiZWw+XFxyXFxuICAgIDxwIGNsYXNzPVxcXCJjb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxpbnB1dCBjbGFzcz1cXFwiaW5wdXRcXFwiIGRhdGEta2V5PVxcXCJtYXhSZXNwb25zZXNcXFwiIHR5cGU9XFxcIm51bWJlclxcXCI+XFxyXFxuICAgIDwvcD5cXHJcXG4gICAgPHAgY2xhc3M9XFxcImNvbnRyb2xcXFwiPlxcclxcbiAgICAgICAgPGxhYmVsIGNsYXNzPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJub3RpZnlcXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIj5cXHJcXG4gICAgICAgICAgICBOZXcgY2hhdCBub3RpZmljYXRpb25zXFxyXFxuICAgICAgICA8L2xhYmVsPlxcclxcbiAgICA8L3A+XFxyXFxuXFxyXFxuICAgIDxocj5cXHJcXG5cXHJcXG4gICAgPGgzIGNsYXNzPVxcXCJ0aXRsZVxcXCI+QWR2YW5jZWQgU2V0dGluZ3M8L2gzPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJtZXNzYWdlIGlzLXdhcm5pbmdcXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwibWVzc2FnZS1oZWFkZXJcXFwiPlxcclxcbiAgICAgICAgICAgIDxwPldhcm5pbmc8L3A+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcIm1lc3NhZ2UtYm9keVxcXCI+XFxyXFxuICAgICAgICAgICAgPHA+Q2hhbmdpbmcgdGhlc2Ugb3B0aW9ucyBjYW4gcmVzdWx0IGluIHVuZXhwZWN0ZWQgYmVoYXZpb3IuIDxhIGhyZWY9XFxcImh0dHBzOi8vZ2l0aHViLmNvbS9CaWJsaW9maWxlL0Jsb2NraGVhZHMtTWVzc2FnZUJvdC93aWtpLzEuLUFkdmFuY2VkLU9wdGlvbnMvXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+UmVhZCB0aGlzIGZpcnN0PC9hPjwvcD5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG4gICAgPHAgY2xhc3M9XFxcImNvbnRyb2xcXFwiPlxcclxcbiAgICAgICAgPGxhYmVsIGNsYXNzPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJyZWdleFRyaWdnZXJzXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgUGFyc2UgdHJpZ2dlcnMgYXMgUmVnRXhcXHJcXG4gICAgICAgIDwvbGFiZWw+XFxyXFxuICAgIDwvcD5cXHJcXG4gICAgPHAgY2xhc3M9XFxcImNvbnRyb2xcXFwiPlxcclxcbiAgICAgICAgPGxhYmVsIGNsYXNzPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJkaXNhYmxlVHJpbVxcXCIgdHlwZT1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIERpc2FibGUgd2hpdGVzcGFjZSB0cmltbWluZ1xcclxcbiAgICAgICAgPC9sYWJlbD5cXHJcXG4gICAgPC9wPlxcclxcbiAgICA8cCBjbGFzcz1cXFwiY29udHJvbFxcXCI+XFxyXFxuICAgICAgICA8bGFiZWwgY2xhc3M9XFxcImNoZWNrYm94XFxcIj5cXHJcXG4gICAgICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcInNwbGl0TWVzc2FnZXNcXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIj5cXHJcXG4gICAgICAgICAgICBTcGxpdCBtZXNzYWdlc1xcclxcbiAgICAgICAgPC9sYWJlbD5cXHJcXG4gICAgPC9wPlxcclxcbiAgICA8bGFiZWwgY2xhc3M9XFxcImxhYmVsXFxcIj5TcGxpdCB0b2tlbjo8L2xhYmVsPlxcclxcbiAgICA8cCBjbGFzcz1cXFwiY29udHJvbFxcXCI+XFxyXFxuICAgICAgICA8aW5wdXQgY2xhc3M9XFxcImlucHV0XFxcIiBkYXRhLWtleT1cXFwic3BsaXRUb2tlblxcXCIgdHlwZT1cXFwidGV4dFxcXCI+XFxyXFxuICAgIDwvcD5cXHJcXG5cXHJcXG4gICAgPGhyPlxcclxcblxcclxcbiAgICA8aDMgY2xhc3M9XFxcInRpdGxlXFxcIj5CYWNrdXAgLyBSZXN0b3JlPC9oMz5cXHJcXG4gICAgPGEgY2xhc3M9XFxcImJ1dHRvblxcXCIgaWQ9XFxcIm1iX2JhY2t1cF9zYXZlXFxcIj5HZXQgYmFja3VwIGNvZGU8L2E+XFxyXFxuICAgIDxhIGNsYXNzPVxcXCJidXR0b25cXFwiIGlkPVxcXCJtYl9iYWNrdXBfbG9hZFxcXCI+SW1wb3J0IGJhY2t1cDwvYT5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbi8vIFNob3cgcHJlZnNcclxuT2JqZWN0LmtleXMocHJlZnMpLmZvckVhY2goa2V5ID0+IHtcclxuICAgIHZhciBlbCA9IHRhYi5xdWVyeVNlbGVjdG9yKGBbZGF0YS1rZXk9XCIke2tleX1cIl1gKTtcclxuICAgIHN3aXRjaCAodHlwZW9mIHByZWZzW2tleV0pIHtcclxuICAgICAgICBjYXNlICdib29sZWFuJzpcclxuICAgICAgICAgICAgZWwuY2hlY2tlZCA9IHByZWZzW2tleV07XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGVsLnZhbHVlID0gcHJlZnNba2V5XTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuLy8gV2F0Y2ggZm9yIGNoYW5nZXNcclxudGFiLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICB2YXIgZ2V0VmFsdWUgPSAoa2V5KSA9PiB0YWIucXVlcnlTZWxlY3RvcihgW2RhdGEta2V5PVwiJHtrZXl9XCJdYCkudmFsdWU7XHJcbiAgICB2YXIgZ2V0SW50ID0gKGtleSkgPT4gK2dldFZhbHVlKGtleSk7XHJcbiAgICB2YXIgZ2V0Q2hlY2tlZCA9IChrZXkpID0+IHRhYi5xdWVyeVNlbGVjdG9yKGBbZGF0YS1rZXk9XCIke2tleX1cIl1gKS5jaGVja2VkO1xyXG5cclxuICAgIE9iamVjdC5rZXlzKHByZWZzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgdmFyIGZ1bmM7XHJcblxyXG4gICAgICAgIHN3aXRjaCh0eXBlb2YgcHJlZnNba2V5XSkge1xyXG4gICAgICAgICAgICBjYXNlICdib29sZWFuJzpcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSBnZXRDaGVja2VkO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gZ2V0SW50O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gZ2V0VmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcmVmc1trZXldID0gZnVuYyhrZXkpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuXHJcbi8vIEdldCBiYWNrdXBcclxudGFiLnF1ZXJ5U2VsZWN0b3IoJyNtYl9iYWNrdXBfc2F2ZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gc2hvd0JhY2t1cCgpIHtcclxuICAgIHZhciBiYWNrdXAgPSBKU09OLnN0cmluZ2lmeShsb2NhbFN0b3JhZ2UpLnJlcGxhY2UoLzwvZywgJyZsdDsnKTtcclxuICAgIHVpLmFsZXJ0KGBDb3B5IHRoaXMgdG8gYSBzYWZlIHBsYWNlOjxicj48dGV4dGFyZWEgY2xhc3M9XCJ0ZXh0YXJlYVwiPiR7YmFja3VwfTwvdGV4dGFyZWE+YCk7XHJcbn0pO1xyXG5cclxuXHJcbi8vIExvYWQgYmFja3VwXHJcbnRhYi5xdWVyeVNlbGVjdG9yKCcjbWJfYmFja3VwX2xvYWQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGxvYWRCYWNrdXAoKSB7XHJcbiAgICB1aS5hbGVydCgnRW50ZXIgdGhlIGJhY2t1cCBjb2RlOjx0ZXh0YXJlYSBjbGFzcz1cInRleHRhcmVhXCI+PC90ZXh0YXJlYT4nLFxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgIHsgdGV4dDogJ0xvYWQgJiByZWZyZXNoIHBhZ2UnLCBzdHlsZTogJ2lzLXN1Y2Nlc3MnLCBhY3Rpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCB0ZXh0YXJlYScpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IEpTT04ucGFyc2UoY29kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29kZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBiYWNrdXAnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdWkubm90aWZ5KCdJbnZhbGlkIGJhY2t1cCBjb2RlLiBObyBhY3Rpb24gdGFrZW4uJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY29kZSkuZm9yRWFjaCgoa2V5KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIGNvZGVba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgdGV4dDogJ0NhbmNlbCcgfVxyXG4gICAgICAgICAgICAgICAgXSk7XHJcbn0pO1xyXG4iLCJjb25zdCBiaGZhbnNhcGkgPSByZXF1aXJlKCdsaWJyYXJpZXMvYmhmYW5zYXBpJyk7XHJcbmNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IE1lc3NhZ2VCb3RFeHRlbnNpb24gPSByZXF1aXJlKCdNZXNzYWdlQm90RXh0ZW5zaW9uJyk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignRXh0ZW5zaW9ucycsICdzZXR0aW5ncycpO1xyXG50YWIuaW5uZXJIVE1MID0gJzxzdHlsZT4nICtcclxuICAgIFwiQGtleWZyYW1lcyBzcGluQXJvdW5ke2Zyb217dHJhbnNmb3JtOnJvdGF0ZSgwZGVnKX10b3t0cmFuc2Zvcm06cm90YXRlKDM1OWRlZyl9fSNleHRze2JvcmRlci10b3A6MXB4IHNvbGlkICMwMDB9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpeyNleHRzIC5jYXJkLWNvbnRlbnR7aGVpZ2h0OjEwNXB4fX1cXG5cIiArXHJcbiAgICAnPC9zdHlsZT4nICtcclxuICAgIFwiPHRlbXBsYXRlIGlkPVxcXCJleHRUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNvbHVtbiBpcy1vbmUtdGhpcmQtZGVza3RvcCBpcy1oYWxmLXRhYmxldFxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjYXJkXFxcIj5cXHJcXG4gICAgICAgICAgICA8aGVhZGVyIGNsYXNzPVxcXCJjYXJkLWhlYWRlclxcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxwIGNsYXNzPVxcXCJjYXJkLWhlYWRlci10aXRsZVxcXCI+PC9wPlxcclxcbiAgICAgICAgICAgIDwvaGVhZGVyPlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImNhcmQtY29udGVudFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJjb250ZW50XFxcIj48L3NwYW4+XFxyXFxuICAgICAgICAgICAgPC9kaXY+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiY2FyZC1mb290ZXJcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8YSBjbGFzcz1cXFwiY2FyZC1mb290ZXItaXRlbVxcXCI+SW5zdGFsbDwvYT5cXHJcXG4gICAgICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2V4dGVuc2lvbnNcXFwiIGNsYXNzPVxcXCJjb250YWluZXIgaXMtZmx1aWRcXFwiPlxcclxcbiAgICA8c2VjdGlvbiBjbGFzcz1cXFwic2VjdGlvbiBpcy1zbWFsbFxcXCI+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYnV0dG9uIGlzLXByaW1hcnkgaXMtcHVsbGVkLXJpZ2h0XFxcIj5Mb2FkIEJ5IElEL1VSTDwvc3Bhbj5cXHJcXG4gICAgICAgIDxoMz5FeHRlbnNpb25zIGNhbiBpbmNyZWFzZSB0aGUgZnVuY3Rpb25hbGl0eSBvZiB0aGUgYm90LjwvaDM+XFxyXFxuICAgICAgICA8c3Bhbj5JbnRlcmVzdGVkIGluIGNyZWF0aW5nIG9uZT8gPGEgaHJlZj1cXFwiaHR0cHM6Ly9naXRodWIuY29tL0JpYmxpb2ZpbGUvQmxvY2toZWFkcy1NZXNzYWdlQm90L3dpa2kvMi4tRGV2ZWxvcG1lbnQ6LVN0YXJ0LUhlcmVcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5TdGFydCBoZXJlLjwvYT48L3NwYW4+XFxyXFxuICAgIDwvc2VjdGlvbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwiZXh0c1xcXCIgY2xhc3M9XFxcImNvbHVtbnMgaXMtbXVsdGlsaW5lXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIGFkZCBhIGNhcmQgZm9yIGFuIGV4dGVuc2lvbi5cclxuICpcclxuICogZXh0ZW5zaW9uIGlzIGV4cGVjdGVkIHRvIGNvbnRhaW4gYSB0aXRsZSwgc25pcHBldCwgYW5kIGlkXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRFeHRlbnNpb25DYXJkKGV4dGVuc2lvbikge1xyXG4gICAgaWYgKCF0YWIucXVlcnlTZWxlY3RvcihgI21iX2V4dGVuc2lvbnMgW2RhdGEtaWQ9XCIke2V4dGVuc2lvbi5pZH1cIl1gKSkge1xyXG4gICAgICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2V4dFRlbXBsYXRlJywgJyNleHRzJywgW1xyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICcuY2FyZC1oZWFkZXItdGl0bGUnLCB0ZXh0OiBleHRlbnNpb24udGl0bGV9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICcuY29udGVudCcsIGh0bWw6IGV4dGVuc2lvbi5zbmlwcGV0fSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3I6ICcuY2FyZC1mb290ZXItaXRlbScsXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiBNZXNzYWdlQm90RXh0ZW5zaW9uLmlzTG9hZGVkKGV4dGVuc2lvbi5pZCkgPyAnUmVtb3ZlJyA6ICdJbnN0YWxsJyxcclxuICAgICAgICAgICAgICAgICdkYXRhLWlkJzogZXh0ZW5zaW9uLmlkXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdKTtcclxuICAgIH1cclxufVxyXG5cclxuLy9DcmVhdGUgdGhlIGV4dGVuc2lvbiBzdG9yZSBwYWdlXHJcbmJoZmFuc2FwaS5nZXRTdG9yZSgpLnRoZW4ocmVzcCA9PiB7XHJcbiAgICBpZiAocmVzcC5zdGF0dXMgIT0gJ29rJykge1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdleHRzJykuaW5uZXJIVE1MICs9IHJlc3AubWVzc2FnZTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IocmVzcC5tZXNzYWdlKTtcclxuICAgIH1cclxuICAgIHJlc3AuZXh0ZW5zaW9ucy5mb3JFYWNoKGFkZEV4dGVuc2lvbkNhcmQpO1xyXG59KS5jYXRjaChiaGZhbnNhcGkucmVwb3J0RXJyb3IpO1xyXG5cclxuLy8gSW5zdGFsbCAvIHVuaW5zdGFsbCBleHRlbnNpb25zXHJcbnRhYi5xdWVyeVNlbGVjdG9yKCcjZXh0cycpXHJcbiAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBleHRBY3Rpb25zKGUpIHtcclxuICAgICAgICB2YXIgZWwgPSBlLnRhcmdldDtcclxuICAgICAgICB2YXIgaWQgPSBlbC5kYXRhc2V0LmlkO1xyXG5cclxuICAgICAgICBpZiAoIWlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChlbC50ZXh0Q29udGVudCA9PSAnSW5zdGFsbCcpIHtcclxuICAgICAgICAgICAgTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsKGlkKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBNZXNzYWdlQm90RXh0ZW5zaW9uLnVuaW5zdGFsbChpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG50YWIucXVlcnlTZWxlY3RvcignLmJ1dHRvbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gbG9hZEV4dGVuc2lvbigpIHtcclxuICAgIHVpLmFsZXJ0KCdFbnRlciB0aGUgSUQgb3IgVVJMIG9mIGFuIGV4dGVuc2lvbjo8YnI+PGlucHV0IGNsYXNzPVwiaW5wdXRcIi8+JyxcclxuICAgICAgICBbXHJcbiAgICAgICAgICAgIHt0ZXh0OiAnTG9hZCcsIHN0eWxlOiAnaXMtc3VjY2VzcycsIGFjdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZXh0UmVmID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IGlucHV0JykudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXh0UmVmLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChleHRSZWYuc3RhcnRzV2l0aCgnaHR0cCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zcmMgPSBleHRSZWY7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIE1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbChleHRSZWYpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHt0ZXh0OiAnQ2FuY2VsJ31cclxuICAgICAgICBdKTtcclxufSk7XHJcblxyXG5cclxuXHJcbmhvb2sub24oJ2V4dGVuc2lvbi5pbnN0YWxsJywgZnVuY3Rpb24oaWQpIHtcclxuICAgIC8vIFNob3cgcmVtb3ZlIHRvIGxldCB1c2VycyByZW1vdmUgZXh0ZW5zaW9uc1xyXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNtYl9leHRlbnNpb25zIFtkYXRhLWlkPVwiJHtpZH1cIl1gKTtcclxuICAgIGlmIChidXR0b24pIHtcclxuICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnUmVtb3ZlJztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYmhmYW5zYXBpLmdldEV4dGVuc2lvbkluZm8oaWQpXHJcbiAgICAgICAgICAgIC50aGVuKGFkZEV4dGVuc2lvbkNhcmQpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbmhvb2sub24oJ2V4dGVuc2lvbi51bmluc3RhbGwnLCBmdW5jdGlvbihpZCkge1xyXG4gICAgLy8gU2hvdyByZW1vdmVkIGZvciBzdG9yZSBpbnN0YWxsIGJ1dHRvblxyXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNtYl9leHRlbnNpb25zIFtkYXRhLWlkPVwiJHtpZH1cIl1gKTtcclxuICAgIGlmIChidXR0b24pIHtcclxuICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnUmVtb3ZlZCc7XHJcbiAgICAgICAgYnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gJ0luc3RhbGwnO1xyXG4gICAgICAgICAgICBidXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICB9LCAzMDAwKTtcclxuICAgIH1cclxufSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxudWkuYWRkVGFiR3JvdXAoJ1NldHRpbmdzJywgJ3NldHRpbmdzJyk7XHJcblxyXG5yZXF1aXJlKCcuL2JvdC9wYWdlJyk7XHJcbnJlcXVpcmUoJy4vZXh0ZW5zaW9ucycpO1xyXG4iLCIvLyBPdmVyd3JpdGUgdGhlIHBvbGxDaGF0IGZ1bmN0aW9uIHRvIGtpbGwgdGhlIGRlZmF1bHQgY2hhdCBmdW5jdGlvblxyXG53aW5kb3cucG9sbENoYXQgPSBmdW5jdGlvbigpIHt9O1xyXG5cclxuLy8gT3ZlcndyaXRlIHRoZSBvbGQgcGFnZVxyXG5kb2N1bWVudC5ib2R5LmlubmVySFRNTCA9ICcnO1xyXG4vLyBTdHlsZSByZXNldFxyXG5BcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1t0eXBlPVwidGV4dC9jc3NcIl0nKSlcclxuICAgIC5mb3JFYWNoKGVsID0+IGVsLnJlbW92ZSgpKTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3RpdGxlJykudGV4dENvbnRlbnQgPSAnQ29uc29sZSAtIE1lc3NhZ2VCb3QnO1xyXG5cclxuLy8gU2V0IHRoZSBpY29uIHRvIHRoZSBibG9ja2hlYWQgaWNvbiB1c2VkIG9uIHRoZSBmb3J1bXNcclxudmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xyXG5lbC5yZWwgPSAnaWNvbic7XHJcbmVsLmhyZWYgPSAnaHR0cHM6Ly9pcy5nZC9NQnZVSEYnO1xyXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbnJlcXVpcmUoJ2NvbnNvbGUtYnJvd3NlcmlmeScpO1xyXG5yZXF1aXJlKCdib3QvbWlncmF0aW9uJyk7XHJcblxyXG5jb25zdCBiaGZhbnNhcGkgPSByZXF1aXJlKCdsaWJyYXJpZXMvYmhmYW5zYXBpJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmhvb2sub24oJ2Vycm9yX3JlcG9ydCcsIGZ1bmN0aW9uKG1zZykge1xyXG4gICAgdWkubm90aWZ5KG1zZyk7XHJcbn0pO1xyXG5cclxuLy8ganVzdCByZXF1aXJlKGNvbnNvbGUpIGRvZXNuJ3Qgd29yayBhcyBjb25zb2xlIGlzIGEgYnJvd3NlcmlmeSBtb2R1bGUuXHJcbnJlcXVpcmUoJy4vY29uc29sZScpO1xyXG4vLyBCeSBkZWZhdWx0IG5vIHRhYiBpcyBzZWxlY3RlZCwgc2hvdyB0aGUgY29uc29sZS5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm5hdi1zbGlkZXItY29udGFpbmVyIHNwYW4nKS5jbGljaygpO1xyXG5yZXF1aXJlKCdtZXNzYWdlcycpO1xyXG5yZXF1aXJlKCdzZXR0aW5ncycpO1xyXG5cclxuLy8gRXJyb3IgcmVwb3J0aW5nXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIChlcnIpID0+IHtcclxuICAgIGlmICghWydTY3JpcHQgZXJyb3IuJywgJ1dvcmxkIG5vdCBydW5uaW5nJywgJ05ldHdvcmsgRXJyb3InXS5pbmNsdWRlcyhlcnIubWVzc2FnZSkpIHtcclxuICAgICAgICBiaGZhbnNhcGkucmVwb3J0RXJyb3IoZXJyKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vLyBFeHBvc2UgdGhlIGV4dGVuc2lvbiBBUElcclxud2luZG93Lk1lc3NhZ2VCb3RFeHRlbnNpb24gPSByZXF1aXJlKCdNZXNzYWdlQm90RXh0ZW5zaW9uJyk7XHJcbiIsInJlcXVpcmUoJy4vcG9seWZpbGxzL2RldGFpbHMnKTtcclxuXHJcbi8vIEJ1aWxkIHRoZSBBUElcclxuT2JqZWN0LmFzc2lnbihcclxuICAgIG1vZHVsZS5leHBvcnRzLFxyXG4gICAgcmVxdWlyZSgnLi9sYXlvdXQnKSxcclxuICAgIHJlcXVpcmUoJy4vdGVtcGxhdGUnKSxcclxuICAgIHJlcXVpcmUoJy4vbm90aWZpY2F0aW9ucycpXHJcbik7XHJcblxyXG4vLyBGdW5jdGlvbnMgd2hpY2ggYXJlIG5vIGxvbmdlciBjb250YWluZWQgaW4gdGhpcyBtb2R1bGUsIGJ1dCBhcmUgcmV0YWluZWQgZm9yIG5vdyBmb3IgYmFja3dhcmQgY29tcGF0YWJpbGl0eS5cclxuY29uc3Qgd3JpdGUgPSByZXF1aXJlKCcuLi9jb25zb2xlL2V4cG9ydHMnKS53cml0ZTtcclxubW9kdWxlLmV4cG9ydHMuYWRkTWVzc2FnZVRvQ29uc29sZSA9IGZ1bmN0aW9uKG1zZywgbmFtZSA9ICcnLCBuYW1lQ2xhc3MgPSAnJykge1xyXG4gICAgY29uc29sZS53YXJuKCd1aS5hZGRNZXNzYWdlVG9Db25zb2xlIGhhcyBiZWVuIGRlcHJpY2F0ZWQuIFVzZSBleC5jb25zb2xlLndyaXRlIGluc3RlYWQuJyk7XHJcbiAgICB3cml0ZShtc2csIG5hbWUsIG5hbWVDbGFzcyk7XHJcbn07XHJcbiIsIi8qKlxyXG4gKiBAZmlsZSBDb250YWlucyBmdW5jdGlvbnMgZm9yIG1hbmFnaW5nIHRoZSBwYWdlIGxheW91dFxyXG4gKi9cclxuXHJcblxyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuXHJcbi8vIEJ1aWxkIHBhZ2UgLSBvbmx5IGNhc2UgaW4gd2hpY2ggYm9keS5pbm5lckhUTUwgc2hvdWxkIGJlIHVzZWQuXHJcbmRvY3VtZW50LmJvZHkuaW5uZXJIVE1MICs9IFwiPGhlYWRlciBjbGFzcz1cXFwiaGVhZGVyIGlzLWZpeGVkLXRvcFxcXCI+XFxyXFxuICA8bmF2IGNsYXNzPVxcXCJuYXYtaW52ZXJzZSBuYXYgaGFzLXNoYWRvd1xcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcIm5hdi1sZWZ0XFxcIj5cXHJcXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJuYXYtaXRlbSBuYXYtc2xpZGVyLXRvZ2dsZVxcXCI+XFxyXFxuICAgICAgICA8aW1nIHNyYz1cXFwiaHR0cHM6Ly9pLmltZ3NhZmUub3JnLzgwYTExMjlhMzYucG5nXFxcIj5cXHJcXG4gICAgICA8L2Rpdj5cXHJcXG4gICAgICA8YSBjbGFzcz1cXFwibmF2LWl0ZW0gaXMtdGFiIG5hdi1zbGlkZXItdG9nZ2xlXFxcIj5cXHJcXG4gICAgICAgIE1lbnVcXHJcXG4gICAgICA8L2E+XFxyXFxuICAgIDwvZGl2PlxcclxcbiAgPC9uYXY+XFxyXFxuPC9oZWFkZXI+XFxyXFxuXFxyXFxuPGRpdiBjbGFzcz1cXFwibmF2LXNsaWRlci1jb250YWluZXJcXFwiPlxcclxcbiAgICA8bmF2IGNsYXNzPVxcXCJuYXYtc2xpZGVyXFxcIiBkYXRhLXRhYi1ncm91cD1cXFwibWFpblxcXCI+PC9uYXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImlzLW92ZXJsYXlcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblxcclxcbjxkaXYgaWQ9XFxcImNvbnRhaW5lclxcXCIgY2xhc3M9XFxcImhhcy1maXhlZC1uYXZcXFwiPjwvZGl2PlxcclxcblwiO1xyXG5kb2N1bWVudC5oZWFkLmlubmVySFRNTCArPSAnPHN0eWxlPicgK1xyXG4gICAgXCJodG1se292ZXJmbG93LXk6YXV0byAhaW1wb3J0YW50fS8qISBidWxtYS5pbyB2MC4zLjEgfCBNSVQgTGljZW5zZSB8IGdpdGh1Yi5jb20vamd0aG1zL2J1bG1hICovQGtleWZyYW1lcyBzcGluQXJvdW5ke2Zyb217dHJhbnNmb3JtOnJvdGF0ZSgwZGVnKX10b3t0cmFuc2Zvcm06cm90YXRlKDM1OWRlZyl9fS8qISBtaW5pcmVzZXQuY3NzIHYwLjAuMiB8IE1JVCBMaWNlbnNlIHwgZ2l0aHViLmNvbS9qZ3RobXMvbWluaXJlc2V0LmNzcyAqL2h0bWwsYm9keSxwLG9sLHVsLGxpLGRsLGR0LGRkLGJsb2NrcXVvdGUsZmlndXJlLGZpZWxkc2V0LGxlZ2VuZCx0ZXh0YXJlYSxwcmUsaWZyYW1lLGhyLGgxLGgyLGgzLGg0LGg1LGg2e21hcmdpbjowO3BhZGRpbmc6MH1oMSxoMixoMyxoNCxoNSxoNntmb250LXNpemU6MTAwJTtmb250LXdlaWdodDpub3JtYWx9dWx7bGlzdC1zdHlsZTpub25lfWJ1dHRvbixpbnB1dCxzZWxlY3QsdGV4dGFyZWF7bWFyZ2luOjB9aHRtbHtib3gtc2l6aW5nOmJvcmRlci1ib3h9Kntib3gtc2l6aW5nOmluaGVyaXR9KjpiZWZvcmUsKjphZnRlcntib3gtc2l6aW5nOmluaGVyaXR9aW1nLGVtYmVkLG9iamVjdCxhdWRpbyx2aWRlb3toZWlnaHQ6YXV0bzttYXgtd2lkdGg6MTAwJX1pZnJhbWV7Ym9yZGVyOjB9dGFibGV7Ym9yZGVyLWNvbGxhcHNlOmNvbGxhcHNlO2JvcmRlci1zcGFjaW5nOjB9dGQsdGh7cGFkZGluZzowO3RleHQtYWxpZ246bGVmdH1odG1se2JhY2tncm91bmQtY29sb3I6I2ZmZjtmb250LXNpemU6MTRweDstbW96LW9zeC1mb250LXNtb290aGluZzpncmF5c2NhbGU7LXdlYmtpdC1mb250LXNtb290aGluZzphbnRpYWxpYXNlZDttaW4td2lkdGg6MzAwcHg7b3ZlcmZsb3cteDpoaWRkZW47b3ZlcmZsb3cteTpzY3JvbGw7dGV4dC1yZW5kZXJpbmc6b3B0aW1pemVMZWdpYmlsaXR5fWFydGljbGUsYXNpZGUsZmlndXJlLGZvb3RlcixoZWFkZXIsaGdyb3VwLHNlY3Rpb257ZGlzcGxheTpibG9ja31ib2R5LGJ1dHRvbixpbnB1dCxzZWxlY3QsdGV4dGFyZWF7Zm9udC1mYW1pbHk6LWFwcGxlLXN5c3RlbSxCbGlua01hY1N5c3RlbUZvbnQsXFxcIlNlZ29lIFVJXFxcIixcXFwiUm9ib3RvXFxcIixcXFwiT3h5Z2VuXFxcIixcXFwiVWJ1bnR1XFxcIixcXFwiQ2FudGFyZWxsXFxcIixcXFwiRmlyYSBTYW5zXFxcIixcXFwiRHJvaWQgU2Fuc1xcXCIsXFxcIkhlbHZldGljYSBOZXVlXFxcIixcXFwiSGVsdmV0aWNhXFxcIixcXFwiQXJpYWxcXFwiLHNhbnMtc2VyaWZ9Y29kZSxwcmV7LW1vei1vc3gtZm9udC1zbW9vdGhpbmc6YXV0bzstd2Via2l0LWZvbnQtc21vb3RoaW5nOmF1dG87Zm9udC1mYW1pbHk6XFxcIkluY29uc29sYXRhXFxcIixcXFwiQ29uc29sYXNcXFwiLFxcXCJNb25hY29cXFwiLG1vbm9zcGFjZX1ib2R5e2NvbG9yOiM0YTRhNGE7Zm9udC1zaXplOjFyZW07Zm9udC13ZWlnaHQ6NDAwO2xpbmUtaGVpZ2h0OjEuNX1he2NvbG9yOiMxODJiNzM7Y3Vyc29yOnBvaW50ZXI7dGV4dC1kZWNvcmF0aW9uOm5vbmU7dHJhbnNpdGlvbjpub25lIDg2bXMgZWFzZS1vdXR9YTpob3Zlcntjb2xvcjojMzYzNjM2fWNvZGV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOnJlZDtmb250LXNpemU6MC44ZW07Zm9udC13ZWlnaHQ6bm9ybWFsO3BhZGRpbmc6MC4yNWVtIDAuNWVtIDAuMjVlbX1ocntiYWNrZ3JvdW5kLWNvbG9yOiNkYmRiZGI7Ym9yZGVyOm5vbmU7ZGlzcGxheTpibG9jaztoZWlnaHQ6MXB4O21hcmdpbjoxLjVyZW0gMH1pbWd7bWF4LXdpZHRoOjEwMCV9aW5wdXRbdHlwZT1cXFwiY2hlY2tib3hcXFwiXSxpbnB1dFt0eXBlPVxcXCJyYWRpb1xcXCJde3ZlcnRpY2FsLWFsaWduOmJhc2VsaW5lfXNtYWxse2ZvbnQtc2l6ZTowLjhlbX1zcGFue2ZvbnQtc3R5bGU6aW5oZXJpdDtmb250LXdlaWdodDppbmhlcml0fXN0cm9uZ3tjb2xvcjojMzYzNjM2O2ZvbnQtd2VpZ2h0OjcwMH1wcmV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiM0YTRhNGE7Zm9udC1zaXplOjAuOGVtO3doaXRlLXNwYWNlOnByZTt3b3JkLXdyYXA6bm9ybWFsfXByZSBjb2Rle2JhY2tncm91bmQ6bm9uZTtjb2xvcjppbmhlcml0O2Rpc3BsYXk6YmxvY2s7Zm9udC1zaXplOjFlbTtvdmVyZmxvdy14OmF1dG87cGFkZGluZzoxLjI1cmVtIDEuNXJlbX10YWJsZXt3aWR0aDoxMDAlfXRhYmxlIHRkLHRhYmxlIHRoe3RleHQtYWxpZ246bGVmdDt2ZXJ0aWNhbC1hbGlnbjp0b3B9dGFibGUgdGh7Y29sb3I6IzM2MzYzNn0uaXMtYmxvY2t7ZGlzcGxheTpibG9ja31AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmlzLWJsb2NrLW1vYmlsZXtkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaXMtYmxvY2stdGFibGV0e2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWJsb2NrLXRhYmxldC1vbmx5e2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1ibG9jay10b3VjaHtkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmlzLWJsb2NrLWRlc2t0b3B7ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpIGFuZCAobWF4LXdpZHRoOiAxMTkxcHgpey5pcy1ibG9jay1kZXNrdG9wLW9ubHl7ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMTkycHgpey5pcy1ibG9jay13aWRlc2NyZWVue2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19LmlzLWZsZXh7ZGlzcGxheTpmbGV4fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtZmxleC1tb2JpbGV7ZGlzcGxheTpmbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaXMtZmxleC10YWJsZXR7ZGlzcGxheTpmbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1mbGV4LXRhYmxldC1vbmx5e2Rpc3BsYXk6ZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWZsZXgtdG91Y2h7ZGlzcGxheTpmbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmlzLWZsZXgtZGVza3RvcHtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KSBhbmQgKG1heC13aWR0aDogMTE5MXB4KXsuaXMtZmxleC1kZXNrdG9wLW9ubHl7ZGlzcGxheTpmbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWZsZXgtd2lkZXNjcmVlbntkaXNwbGF5OmZsZXggIWltcG9ydGFudH19LmlzLWlubGluZXtkaXNwbGF5OmlubGluZX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmlzLWlubGluZS1tb2JpbGV7ZGlzcGxheTppbmxpbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5pcy1pbmxpbmUtdGFibGV0e2Rpc3BsYXk6aW5saW5lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1pbmxpbmUtdGFibGV0LW9ubHl7ZGlzcGxheTppbmxpbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1pbmxpbmUtdG91Y2h7ZGlzcGxheTppbmxpbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuaXMtaW5saW5lLWRlc2t0b3B7ZGlzcGxheTppbmxpbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KSBhbmQgKG1heC13aWR0aDogMTE5MXB4KXsuaXMtaW5saW5lLWRlc2t0b3Atb25seXtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMTkycHgpey5pcy1pbmxpbmUtd2lkZXNjcmVlbntkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX0uaXMtaW5saW5lLWJsb2Nre2Rpc3BsYXk6aW5saW5lLWJsb2NrfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtaW5saW5lLWJsb2NrLW1vYmlsZXtkaXNwbGF5OmlubGluZS1ibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmlzLWlubGluZS1ibG9jay10YWJsZXR7ZGlzcGxheTppbmxpbmUtYmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWlubGluZS1ibG9jay10YWJsZXQtb25seXtkaXNwbGF5OmlubGluZS1ibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWlubGluZS1ibG9jay10b3VjaHtkaXNwbGF5OmlubGluZS1ibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5pcy1pbmxpbmUtYmxvY2stZGVza3RvcHtkaXNwbGF5OmlubGluZS1ibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpIGFuZCAobWF4LXdpZHRoOiAxMTkxcHgpey5pcy1pbmxpbmUtYmxvY2stZGVza3RvcC1vbmx5e2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWlubGluZS1ibG9jay13aWRlc2NyZWVue2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fS5pcy1pbmxpbmUtZmxleHtkaXNwbGF5OmlubGluZS1mbGV4fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtaW5saW5lLWZsZXgtbW9iaWxle2Rpc3BsYXk6aW5saW5lLWZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5pcy1pbmxpbmUtZmxleC10YWJsZXR7ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaW5saW5lLWZsZXgtdGFibGV0LW9ubHl7ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWlubGluZS1mbGV4LXRvdWNoe2Rpc3BsYXk6aW5saW5lLWZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuaXMtaW5saW5lLWZsZXgtZGVza3RvcHtkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCkgYW5kIChtYXgtd2lkdGg6IDExOTFweCl7LmlzLWlubGluZS1mbGV4LWRlc2t0b3Atb25seXtkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWlubGluZS1mbGV4LXdpZGVzY3JlZW57ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX0uaXMtY2xlYXJmaXg6YWZ0ZXJ7Y2xlYXI6Ym90aDtjb250ZW50OlxcXCIgXFxcIjtkaXNwbGF5OnRhYmxlfS5pcy1wdWxsZWQtbGVmdHtmbG9hdDpsZWZ0fS5pcy1wdWxsZWQtcmlnaHR7ZmxvYXQ6cmlnaHR9LmlzLWNsaXBwZWR7b3ZlcmZsb3c6aGlkZGVuICFpbXBvcnRhbnR9LmlzLW92ZXJsYXl7Ym90dG9tOjA7bGVmdDowO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjB9Lmhhcy10ZXh0LWNlbnRlcmVke3RleHQtYWxpZ246Y2VudGVyfS5oYXMtdGV4dC1sZWZ0e3RleHQtYWxpZ246bGVmdH0uaGFzLXRleHQtcmlnaHR7dGV4dC1hbGlnbjpyaWdodH0uaXMtaGlkZGVue2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtaGlkZGVuLW1vYmlsZXtkaXNwbGF5Om5vbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5pcy1oaWRkZW4tdGFibGV0e2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaGlkZGVuLXRhYmxldC1vbmx5e2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWhpZGRlbi10b3VjaHtkaXNwbGF5Om5vbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuaXMtaGlkZGVuLWRlc2t0b3B7ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCkgYW5kIChtYXgtd2lkdGg6IDExOTFweCl7LmlzLWhpZGRlbi1kZXNrdG9wLW9ubHl7ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWhpZGRlbi13aWRlc2NyZWVue2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX0uaXMtZGlzYWJsZWR7cG9pbnRlci1ldmVudHM6bm9uZX0uaXMtbWFyZ2lubGVzc3ttYXJnaW46MCAhaW1wb3J0YW50fS5pcy1wYWRkaW5nbGVzc3twYWRkaW5nOjAgIWltcG9ydGFudH0uaXMtdW5zZWxlY3RhYmxley13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZX0uYm94e2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItcmFkaXVzOjVweDtib3gtc2hhZG93OjAgMnB4IDNweCByZ2JhKDEwLDEwLDEwLDAuMSksMCAwIDAgMXB4IHJnYmEoMTAsMTAsMTAsMC4xKTtkaXNwbGF5OmJsb2NrO3BhZGRpbmc6MS4yNXJlbX0uYm94Om5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19YS5ib3g6aG92ZXIsYS5ib3g6Zm9jdXN7Ym94LXNoYWRvdzowIDJweCAzcHggcmdiYSgxMCwxMCwxMCwwLjEpLDAgMCAwIDFweCAjMTgyYjczfWEuYm94OmFjdGl2ZXtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMiksMCAwIDAgMXB4ICMxODJiNzN9LmJ1dHRvbnstbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTthbGlnbi1pdGVtczpjZW50ZXI7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czozcHg7Ym94LXNoYWRvdzpub25lO2Rpc3BsYXk6aW5saW5lLWZsZXg7Zm9udC1zaXplOjFyZW07aGVpZ2h0OjIuMjg1ZW07anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7bGluZS1oZWlnaHQ6MS41O3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW07cG9zaXRpb246cmVsYXRpdmU7dmVydGljYWwtYWxpZ246dG9wOy13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZTtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO2NvbG9yOiMzNjM2MzY7Y3Vyc29yOnBvaW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtwYWRkaW5nLWxlZnQ6MC43NWVtO3BhZGRpbmctcmlnaHQ6MC43NWVtO3RleHQtYWxpZ246Y2VudGVyO3doaXRlLXNwYWNlOm5vd3JhcH0uYnV0dG9uOmZvY3VzLC5idXR0b24uaXMtZm9jdXNlZCwuYnV0dG9uOmFjdGl2ZSwuYnV0dG9uLmlzLWFjdGl2ZXtvdXRsaW5lOm5vbmV9LmJ1dHRvbltkaXNhYmxlZF0sLmJ1dHRvbi5pcy1kaXNhYmxlZHtwb2ludGVyLWV2ZW50czpub25lfS5idXR0b24gc3Ryb25ne2NvbG9yOmluaGVyaXR9LmJ1dHRvbiAuaWNvbjpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uMjVyZW07bWFyZ2luLXJpZ2h0Oi41cmVtfS5idXR0b24gLmljb246bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tbGVmdDouNXJlbTttYXJnaW4tcmlnaHQ6LS4yNXJlbX0uYnV0dG9uIC5pY29uOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS4yNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMjVyZW0pfS5idXR0b24gLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDowcmVtfS5idXR0b24gLmljb24uaXMtc21hbGw6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6MHJlbX0uYnV0dG9uIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgMHJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIDByZW0pfS5idXR0b24gLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS41cmVtfS5idXR0b24gLmljb24uaXMtbWVkaXVtOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uNXJlbX0uYnV0dG9uIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uNXJlbSl9LmJ1dHRvbiAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0xcmVtfS5idXR0b24gLmljb24uaXMtbGFyZ2U6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LTFyZW19LmJ1dHRvbiAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0xcmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLTFyZW0pfS5idXR0b246aG92ZXIsLmJ1dHRvbi5pcy1ob3ZlcmVke2JvcmRlci1jb2xvcjojYjViNWI1O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbjpmb2N1cywuYnV0dG9uLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOiMxODJiNzM7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgyNCw0MywxMTUsMC4yNSk7Y29sb3I6IzM2MzYzNn0uYnV0dG9uOmFjdGl2ZSwuYnV0dG9uLmlzLWFjdGl2ZXtib3JkZXItY29sb3I6IzRhNGE0YTtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpbmt7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6IzRhNGE0YTt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lfS5idXR0b24uaXMtbGluazpob3ZlciwuYnV0dG9uLmlzLWxpbmsuaXMtaG92ZXJlZCwuYnV0dG9uLmlzLWxpbms6Zm9jdXMsLmJ1dHRvbi5pcy1saW5rLmlzLWZvY3VzZWQsLmJ1dHRvbi5pcy1saW5rOmFjdGl2ZSwuYnV0dG9uLmlzLWxpbmsuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtd2hpdGV7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGU6aG92ZXIsLmJ1dHRvbi5pcy13aGl0ZS5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6I2Y5ZjlmOTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLXdoaXRlOmZvY3VzLC5idXR0b24uaXMtd2hpdGUuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgyNTUsMjU1LDI1NSwwLjI1KTtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGU6YWN0aXZlLC5idXR0b24uaXMtd2hpdGUuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6I2YyZjJmMjtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXdoaXRlLmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6IzAwMH0uYnV0dG9uLmlzLXdoaXRlLmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICMwYTBhMGEgIzBhMGEwYSAhaW1wb3J0YW50fS5idXR0b24uaXMtd2hpdGUuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtd2hpdGUuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy13aGl0ZS5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLXdoaXRlLmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMwYTBhMGE7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLXdoaXRlLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFja3tiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjazpob3ZlciwuYnV0dG9uLmlzLWJsYWNrLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojMDQwNDA0O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtYmxhY2s6Zm9jdXMsLmJ1dHRvbi5pcy1ibGFjay5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDEwLDEwLDEwLDAuMjUpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjazphY3RpdmUsLmJ1dHRvbi5pcy1ibGFjay5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojMDAwO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjJmMmYyfS5idXR0b24uaXMtYmxhY2suaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZiAjZmZmICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy1ibGFjay5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMGEwYTBhO2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy1ibGFjay5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWJsYWNrLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtib3JkZXItY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLWxpZ2h0e2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0OmhvdmVyLC5idXR0b24uaXMtbGlnaHQuaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiNlZWU7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1saWdodDpmb2N1cywuYnV0dG9uLmlzLWxpZ2h0LmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMjQ1LDI0NSwyNDUsMC4yNSk7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0OmFjdGl2ZSwuYnV0dG9uLmlzLWxpZ2h0LmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiNlOGU4ZTg7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiMyOTI5Mjl9LmJ1dHRvbi5pcy1saWdodC5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjMzYzNjM2ICMzNjM2MzYgIWltcG9ydGFudH0uYnV0dG9uLmlzLWxpZ2h0LmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWxpZ2h0LmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtbGlnaHQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1jb2xvcjojZjVmNWY1O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMzYzNjM2O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFya3tiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1kYXJrOmhvdmVyLC5idXR0b24uaXMtZGFyay5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6IzJmMmYyZjtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcms6Zm9jdXMsLmJ1dHRvbi5pcy1kYXJrLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoNTQsNTQsNTQsMC4yNSk7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcms6YWN0aXZlLC5idXR0b24uaXMtZGFyay5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojMjkyOTI5O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2U4ZThlOH0uYnV0dG9uLmlzLWRhcmsuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2Y1ZjVmNSAjZjVmNWY1ICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy1kYXJrLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMzNjM2MzY7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWRhcmsuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1kYXJrLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtib3JkZXItY29sb3I6IzM2MzYzNjtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZjVmNWY1O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLXByaW1hcnl7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtcHJpbWFyeTpob3ZlciwuYnV0dG9uLmlzLXByaW1hcnkuaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiMxNjI3Njg7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5OmZvY3VzLC5idXR0b24uaXMtcHJpbWFyeS5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDI0LDQzLDExNSwwLjI1KTtjb2xvcjojZmZmfS5idXR0b24uaXMtcHJpbWFyeTphY3RpdmUsLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMxNDIzNWU7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojZmZmfS5idXR0b24uaXMtcHJpbWFyeS5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzE4MmI3M30uYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjJmMmYyfS5idXR0b24uaXMtcHJpbWFyeS5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZmZmICNmZmYgIWltcG9ydGFudH0uYnV0dG9uLmlzLXByaW1hcnkuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6IzE4MmI3Mztjb2xvcjojMTgyYjczfS5idXR0b24uaXMtcHJpbWFyeS5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXByaW1hcnkuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2JvcmRlci1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMTgyYjczfS5idXR0b24uaXMtaW5mb3tiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1pbmZvOmhvdmVyLC5idXR0b24uaXMtaW5mby5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6IzI3NmNkYTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWluZm86Zm9jdXMsLmJ1dHRvbi5pcy1pbmZvLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoNTAsMTE1LDIyMCwwLjI1KTtjb2xvcjojZmZmfS5idXR0b24uaXMtaW5mbzphY3RpdmUsLmJ1dHRvbi5pcy1pbmZvLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMyMzY2ZDE7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojZmZmfS5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzMyNzNkY30uYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjJmMmYyfS5idXR0b24uaXMtaW5mby5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZmZmICNmZmYgIWltcG9ydGFudH0uYnV0dG9uLmlzLWluZm8uaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6IzMyNzNkYztjb2xvcjojMzI3M2RjfS5idXR0b24uaXMtaW5mby5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWluZm8uaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjO2JvcmRlci1jb2xvcjojMzI3M2RjO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMzI3M2RjfS5idXR0b24uaXMtc3VjY2Vzc3tiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1zdWNjZXNzOmhvdmVyLC5idXR0b24uaXMtc3VjY2Vzcy5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6IzIyYzY1Yjtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3M6Zm9jdXMsLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMzUsMjA5LDk2LDAuMjUpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1zdWNjZXNzOmFjdGl2ZSwuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6IzIwYmM1Njtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMjNkMTYwfS5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50fS5idXR0b24uaXMtc3VjY2Vzcy5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMjNkMTYwO2NvbG9yOiMyM2QxNjB9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtc3VjY2Vzcy5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Ym9yZGVyLWNvbG9yOiMyM2QxNjA7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMyM2QxNjB9LmJ1dHRvbi5pcy13YXJuaW5ne2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1Nztib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZzpob3ZlciwuYnV0dG9uLmlzLXdhcm5pbmcuaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmRiNGE7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmc6Zm9jdXMsLmJ1dHRvbi5pcy13YXJuaW5nLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMjU1LDIyMSw4NywwLjI1KTtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9LmJ1dHRvbi5pcy13YXJuaW5nOmFjdGl2ZSwuYnV0dG9uLmlzLXdhcm5pbmcuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6I2ZmZDgzZDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLDAuNyk7Y29sb3I6I2ZmZGQ1N30uYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLDAuNyl9LmJ1dHRvbi5pcy13YXJuaW5nLmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50IHJnYmEoMCwwLDAsMC43KSByZ2JhKDAsMCwwLDAuNykgIWltcG9ydGFudH0uYnV0dG9uLmlzLXdhcm5pbmcuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZGQ1Nztjb2xvcjojZmZkZDU3fS5idXR0b24uaXMtd2FybmluZy5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXdhcm5pbmcuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2JvcmRlci1jb2xvcjojZmZkZDU3O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6cmdiYSgwLDAsMCwwLjcpO2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy13YXJuaW5nLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6cmdiYSgwLDAsMCwwLjcpO2NvbG9yOiNmZmRkNTd9LmJ1dHRvbi5pcy1kYW5nZXJ7YmFja2dyb3VuZC1jb2xvcjpyZWQ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1kYW5nZXI6aG92ZXIsLmJ1dHRvbi5pcy1kYW5nZXIuaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmMjAwMDA7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1kYW5nZXI6Zm9jdXMsLmJ1dHRvbi5pcy1kYW5nZXIuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgyNTUsMCwwLDAuMjUpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1kYW5nZXI6YWN0aXZlLC5idXR0b24uaXMtZGFuZ2VyLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiNlNjAwMDA7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojZmZmfS5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjpyZWR9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjJmMmYyfS5idXR0b24uaXMtZGFuZ2VyLmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50fS5idXR0b24uaXMtZGFuZ2VyLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOnJlZDtjb2xvcjpyZWR9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1kYW5nZXIuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjpyZWQ7Ym9yZGVyLWNvbG9yOnJlZDtjb2xvcjojZmZmfS5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6cmVkfS5idXR0b24uaXMtc21hbGx7Ym9yZGVyLXJhZGl1czoycHg7Zm9udC1zaXplOi43NXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS4zNzVyZW07bWFyZ2luLXJpZ2h0Oi4zNzVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbjpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi4zNzVyZW07bWFyZ2luLXJpZ2h0Oi0uMzc1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb246Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjM3NXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMzc1cmVtKX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS4xMjVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1zbWFsbDpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotLjEyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS4xMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjEyNXJlbSl9LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1tZWRpdW06Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjYyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLW1lZGl1bTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotLjYyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uNjI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS42MjVyZW0pfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotMS4xMjVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1sYXJnZTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotMS4xMjVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0xLjEyNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0xLjEyNXJlbSl9LmJ1dHRvbi5pcy1tZWRpdW17Zm9udC1zaXplOjEuMjVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb246Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjEyNXJlbTttYXJnaW4tcmlnaHQ6LjYyNXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbjpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi42MjVyZW07bWFyZ2luLXJpZ2h0Oi0uMTI1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS4xMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjEyNXJlbSl9LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDouMTI1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uLmlzLXNtYWxsOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi4xMjVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAuMTI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLjEyNXJlbSl9LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS4zNzVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbWVkaXVtOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uMzc1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uMzc1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS4zNzVyZW0pfS5idXR0b24uaXMtbWVkaXVtIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS44NzVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbGFyZ2U6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS44NzVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjg3NXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uODc1cmVtKX0uYnV0dG9uLmlzLWxhcmdle2ZvbnQtc2l6ZToxLjVyZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbjpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0OjByZW07bWFyZ2luLXJpZ2h0Oi43NXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6Ljc1cmVtO21hcmdpbi1yaWdodDowcmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb246Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAwcmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgMHJlbSl9LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi4yNXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLXNtYWxsOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi4yNXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLjI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLjI1cmVtKX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uMjVyZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbi5pcy1tZWRpdW06bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS4yNXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjI1cmVtKX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS43NXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLWxhcmdlOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uNzVyZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uNzVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjc1cmVtKX0uYnV0dG9uW2Rpc2FibGVkXSwuYnV0dG9uLmlzLWRpc2FibGVke29wYWNpdHk6MC41fS5idXR0b24uaXMtZnVsbHdpZHRoe2Rpc3BsYXk6ZmxleDt3aWR0aDoxMDAlfS5idXR0b24uaXMtbG9hZGluZ3tjb2xvcjp0cmFuc3BhcmVudCAhaW1wb3J0YW50O3BvaW50ZXItZXZlbnRzOm5vbmV9LmJ1dHRvbi5pcy1sb2FkaW5nOmFmdGVye2FuaW1hdGlvbjpzcGluQXJvdW5kIDUwMG1zIGluZmluaXRlIGxpbmVhcjtib3JkZXI6MnB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtib3JkZXItcmlnaHQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLXRvcC1jb2xvcjp0cmFuc3BhcmVudDtjb250ZW50OlxcXCJcXFwiO2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjFyZW07cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MXJlbTtsZWZ0OjUwJTttYXJnaW4tbGVmdDotOHB4O21hcmdpbi10b3A6LThweDtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3Bvc2l0aW9uOmFic29sdXRlICFpbXBvcnRhbnR9LmNvbnRlbnR7Y29sb3I6IzRhNGE0YX0uY29udGVudDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5jb250ZW50IGxpK2xpe21hcmdpbi10b3A6MC4yNWVtfS5jb250ZW50IHA6bm90KDpsYXN0LWNoaWxkKSwuY29udGVudCBvbDpub3QoOmxhc3QtY2hpbGQpLC5jb250ZW50IHVsOm5vdCg6bGFzdC1jaGlsZCksLmNvbnRlbnQgYmxvY2txdW90ZTpub3QoOmxhc3QtY2hpbGQpLC5jb250ZW50IHRhYmxlOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxZW19LmNvbnRlbnQgaDEsLmNvbnRlbnQgaDIsLmNvbnRlbnQgaDMsLmNvbnRlbnQgaDQsLmNvbnRlbnQgaDUsLmNvbnRlbnQgaDZ7Y29sb3I6IzM2MzYzNjtmb250LXdlaWdodDo0MDA7bGluZS1oZWlnaHQ6MS4xMjV9LmNvbnRlbnQgaDF7Zm9udC1zaXplOjJlbTttYXJnaW4tYm90dG9tOjAuNWVtfS5jb250ZW50IGgxOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi10b3A6MWVtfS5jb250ZW50IGgye2ZvbnQtc2l6ZToxLjc1ZW07bWFyZ2luLWJvdHRvbTowLjU3MTRlbX0uY29udGVudCBoMjpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tdG9wOjEuMTQyOGVtfS5jb250ZW50IGgze2ZvbnQtc2l6ZToxLjVlbTttYXJnaW4tYm90dG9tOjAuNjY2NmVtfS5jb250ZW50IGgzOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi10b3A6MS4zMzMzZW19LmNvbnRlbnQgaDR7Zm9udC1zaXplOjEuMjVlbTttYXJnaW4tYm90dG9tOjAuOGVtfS5jb250ZW50IGg1e2ZvbnQtc2l6ZToxLjEyNWVtO21hcmdpbi1ib3R0b206MC44ODg4ZW19LmNvbnRlbnQgaDZ7Zm9udC1zaXplOjFlbTttYXJnaW4tYm90dG9tOjFlbX0uY29udGVudCBibG9ja3F1b3Rle2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItbGVmdDo1cHggc29saWQgI2RiZGJkYjtwYWRkaW5nOjEuMjVlbSAxLjVlbX0uY29udGVudCBvbHtsaXN0LXN0eWxlOmRlY2ltYWwgb3V0c2lkZTttYXJnaW4tbGVmdDoyZW07bWFyZ2luLXJpZ2h0OjJlbTttYXJnaW4tdG9wOjFlbX0uY29udGVudCB1bHtsaXN0LXN0eWxlOmRpc2Mgb3V0c2lkZTttYXJnaW4tbGVmdDoyZW07bWFyZ2luLXJpZ2h0OjJlbTttYXJnaW4tdG9wOjFlbX0uY29udGVudCB1bCB1bHtsaXN0LXN0eWxlLXR5cGU6Y2lyY2xlO21hcmdpbi10b3A6MC41ZW19LmNvbnRlbnQgdWwgdWwgdWx7bGlzdC1zdHlsZS10eXBlOnNxdWFyZX0uY29udGVudCB0YWJsZXt3aWR0aDoxMDAlfS5jb250ZW50IHRhYmxlIHRkLC5jb250ZW50IHRhYmxlIHRoe2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtib3JkZXItd2lkdGg6MCAwIDFweDtwYWRkaW5nOjAuNWVtIDAuNzVlbTt2ZXJ0aWNhbC1hbGlnbjp0b3B9LmNvbnRlbnQgdGFibGUgdGh7Y29sb3I6IzM2MzYzNjt0ZXh0LWFsaWduOmxlZnR9LmNvbnRlbnQgdGFibGUgdHI6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5jb250ZW50IHRhYmxlIHRoZWFkIHRkLC5jb250ZW50IHRhYmxlIHRoZWFkIHRoe2JvcmRlci13aWR0aDowIDAgMnB4O2NvbG9yOiMzNjM2MzZ9LmNvbnRlbnQgdGFibGUgdGZvb3QgdGQsLmNvbnRlbnQgdGFibGUgdGZvb3QgdGh7Ym9yZGVyLXdpZHRoOjJweCAwIDA7Y29sb3I6IzM2MzYzNn0uY29udGVudCB0YWJsZSB0Ym9keSB0cjpsYXN0LWNoaWxkIHRkLC5jb250ZW50IHRhYmxlIHRib2R5IHRyOmxhc3QtY2hpbGQgdGh7Ym9yZGVyLWJvdHRvbS13aWR0aDowfS5jb250ZW50LmlzLXNtYWxse2ZvbnQtc2l6ZTouNzVyZW19LmNvbnRlbnQuaXMtbWVkaXVte2ZvbnQtc2l6ZToxLjI1cmVtfS5jb250ZW50LmlzLWxhcmdle2ZvbnQtc2l6ZToxLjVyZW19LmlucHV0LC50ZXh0YXJlYXstbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTthbGlnbi1pdGVtczpjZW50ZXI7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czozcHg7Ym94LXNoYWRvdzpub25lO2Rpc3BsYXk6aW5saW5lLWZsZXg7Zm9udC1zaXplOjFyZW07aGVpZ2h0OjIuMjg1ZW07anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7bGluZS1oZWlnaHQ6MS41O3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW07cG9zaXRpb246cmVsYXRpdmU7dmVydGljYWwtYWxpZ246dG9wO2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7Y29sb3I6IzM2MzYzNjtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMSk7bWF4LXdpZHRoOjEwMCU7d2lkdGg6MTAwJX0uaW5wdXQ6Zm9jdXMsLmlucHV0LmlzLWZvY3VzZWQsLmlucHV0OmFjdGl2ZSwuaW5wdXQuaXMtYWN0aXZlLC50ZXh0YXJlYTpmb2N1cywudGV4dGFyZWEuaXMtZm9jdXNlZCwudGV4dGFyZWE6YWN0aXZlLC50ZXh0YXJlYS5pcy1hY3RpdmV7b3V0bGluZTpub25lfS5pbnB1dFtkaXNhYmxlZF0sLmlucHV0LmlzLWRpc2FibGVkLC50ZXh0YXJlYVtkaXNhYmxlZF0sLnRleHRhcmVhLmlzLWRpc2FibGVke3BvaW50ZXItZXZlbnRzOm5vbmV9LmlucHV0OmhvdmVyLC5pbnB1dC5pcy1ob3ZlcmVkLC50ZXh0YXJlYTpob3ZlciwudGV4dGFyZWEuaXMtaG92ZXJlZHtib3JkZXItY29sb3I6I2I1YjViNX0uaW5wdXQ6Zm9jdXMsLmlucHV0LmlzLWZvY3VzZWQsLmlucHV0OmFjdGl2ZSwuaW5wdXQuaXMtYWN0aXZlLC50ZXh0YXJlYTpmb2N1cywudGV4dGFyZWEuaXMtZm9jdXNlZCwudGV4dGFyZWE6YWN0aXZlLC50ZXh0YXJlYS5pcy1hY3RpdmV7Ym9yZGVyLWNvbG9yOiMxODJiNzN9LmlucHV0W2Rpc2FibGVkXSwuaW5wdXQuaXMtZGlzYWJsZWQsLnRleHRhcmVhW2Rpc2FibGVkXSwudGV4dGFyZWEuaXMtZGlzYWJsZWR7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1jb2xvcjojZjVmNWY1O2JveC1zaGFkb3c6bm9uZTtjb2xvcjojN2E3YTdhfS5pbnB1dFtkaXNhYmxlZF06Oi1tb3otcGxhY2Vob2xkZXIsLmlucHV0LmlzLWRpc2FibGVkOjotbW96LXBsYWNlaG9sZGVyLC50ZXh0YXJlYVtkaXNhYmxlZF06Oi1tb3otcGxhY2Vob2xkZXIsLnRleHRhcmVhLmlzLWRpc2FibGVkOjotbW96LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uaW5wdXRbZGlzYWJsZWRdOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyLC5pbnB1dC5pcy1kaXNhYmxlZDo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlciwudGV4dGFyZWFbZGlzYWJsZWRdOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyLC50ZXh0YXJlYS5pcy1kaXNhYmxlZDo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlcntjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuMyl9LmlucHV0W2Rpc2FibGVkXTotbW96LXBsYWNlaG9sZGVyLC5pbnB1dC5pcy1kaXNhYmxlZDotbW96LXBsYWNlaG9sZGVyLC50ZXh0YXJlYVtkaXNhYmxlZF06LW1vei1wbGFjZWhvbGRlciwudGV4dGFyZWEuaXMtZGlzYWJsZWQ6LW1vei1wbGFjZWhvbGRlcntjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuMyl9LmlucHV0W2Rpc2FibGVkXTotbXMtaW5wdXQtcGxhY2Vob2xkZXIsLmlucHV0LmlzLWRpc2FibGVkOi1tcy1pbnB1dC1wbGFjZWhvbGRlciwudGV4dGFyZWFbZGlzYWJsZWRdOi1tcy1pbnB1dC1wbGFjZWhvbGRlciwudGV4dGFyZWEuaXMtZGlzYWJsZWQ6LW1zLWlucHV0LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uaW5wdXRbdHlwZT1cXFwic2VhcmNoXFxcIl0sLnRleHRhcmVhW3R5cGU9XFxcInNlYXJjaFxcXCJde2JvcmRlci1yYWRpdXM6MjkwNDg2cHh9LmlucHV0LmlzLXdoaXRlLC50ZXh0YXJlYS5pcy13aGl0ZXtib3JkZXItY29sb3I6I2ZmZn0uaW5wdXQuaXMtYmxhY2ssLnRleHRhcmVhLmlzLWJsYWNre2JvcmRlci1jb2xvcjojMGEwYTBhfS5pbnB1dC5pcy1saWdodCwudGV4dGFyZWEuaXMtbGlnaHR7Ym9yZGVyLWNvbG9yOiNmNWY1ZjV9LmlucHV0LmlzLWRhcmssLnRleHRhcmVhLmlzLWRhcmt7Ym9yZGVyLWNvbG9yOiMzNjM2MzZ9LmlucHV0LmlzLXByaW1hcnksLnRleHRhcmVhLmlzLXByaW1hcnl7Ym9yZGVyLWNvbG9yOiMxODJiNzN9LmlucHV0LmlzLWluZm8sLnRleHRhcmVhLmlzLWluZm97Ym9yZGVyLWNvbG9yOiMzMjczZGN9LmlucHV0LmlzLXN1Y2Nlc3MsLnRleHRhcmVhLmlzLXN1Y2Nlc3N7Ym9yZGVyLWNvbG9yOiMyM2QxNjB9LmlucHV0LmlzLXdhcm5pbmcsLnRleHRhcmVhLmlzLXdhcm5pbmd7Ym9yZGVyLWNvbG9yOiNmZmRkNTd9LmlucHV0LmlzLWRhbmdlciwudGV4dGFyZWEuaXMtZGFuZ2Vye2JvcmRlci1jb2xvcjpyZWR9LmlucHV0LmlzLXNtYWxsLC50ZXh0YXJlYS5pcy1zbWFsbHtib3JkZXItcmFkaXVzOjJweDtmb250LXNpemU6Ljc1cmVtfS5pbnB1dC5pcy1tZWRpdW0sLnRleHRhcmVhLmlzLW1lZGl1bXtmb250LXNpemU6MS4yNXJlbX0uaW5wdXQuaXMtbGFyZ2UsLnRleHRhcmVhLmlzLWxhcmdle2ZvbnQtc2l6ZToxLjVyZW19LmlucHV0LmlzLWZ1bGx3aWR0aCwudGV4dGFyZWEuaXMtZnVsbHdpZHRoe2Rpc3BsYXk6YmxvY2s7d2lkdGg6MTAwJX0uaW5wdXQuaXMtaW5saW5lLC50ZXh0YXJlYS5pcy1pbmxpbmV7ZGlzcGxheTppbmxpbmU7d2lkdGg6YXV0b30udGV4dGFyZWF7ZGlzcGxheTpibG9jaztsaW5lLWhlaWdodDoxLjI1O21heC1oZWlnaHQ6NjAwcHg7bWF4LXdpZHRoOjEwMCU7bWluLWhlaWdodDoxMjBweDttaW4td2lkdGg6MTAwJTtwYWRkaW5nOjEwcHg7cmVzaXplOnZlcnRpY2FsfS5jaGVja2JveCwucmFkaW97YWxpZ24taXRlbXM6Y2VudGVyO2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6aW5saW5lLWZsZXg7ZmxleC13cmFwOndyYXA7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7cG9zaXRpb246cmVsYXRpdmU7dmVydGljYWwtYWxpZ246dG9wfS5jaGVja2JveCBpbnB1dCwucmFkaW8gaW5wdXR7Y3Vyc29yOnBvaW50ZXI7bWFyZ2luLXJpZ2h0OjAuNWVtfS5jaGVja2JveDpob3ZlciwucmFkaW86aG92ZXJ7Y29sb3I6IzM2MzYzNn0uY2hlY2tib3guaXMtZGlzYWJsZWQsLnJhZGlvLmlzLWRpc2FibGVke2NvbG9yOiM3YTdhN2E7cG9pbnRlci1ldmVudHM6bm9uZX0uY2hlY2tib3guaXMtZGlzYWJsZWQgaW5wdXQsLnJhZGlvLmlzLWRpc2FibGVkIGlucHV0e3BvaW50ZXItZXZlbnRzOm5vbmV9LnJhZGlvKy5yYWRpb3ttYXJnaW4tbGVmdDowLjVlbX0uc2VsZWN0e2Rpc3BsYXk6aW5saW5lLWJsb2NrO2hlaWdodDoyLjVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3B9LnNlbGVjdDphZnRlcntib3JkZXI6MXB4IHNvbGlkICMxODJiNzM7Ym9yZGVyLXJpZ2h0OjA7Ym9yZGVyLXRvcDowO2NvbnRlbnQ6XFxcIiBcXFwiO2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjAuNWVtO3BvaW50ZXItZXZlbnRzOm5vbmU7cG9zaXRpb246YWJzb2x1dGU7dHJhbnNmb3JtOnJvdGF0ZSgtNDVkZWcpO3dpZHRoOjAuNWVtO21hcmdpbi10b3A6LTAuMzc1ZW07cmlnaHQ6MS4xMjVlbTt0b3A6NTAlO3otaW5kZXg6NH0uc2VsZWN0IHNlbGVjdHstbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTthbGlnbi1pdGVtczpjZW50ZXI7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czozcHg7Ym94LXNoYWRvdzpub25lO2Rpc3BsYXk6aW5saW5lLWZsZXg7Zm9udC1zaXplOjFyZW07aGVpZ2h0OjIuMjg1ZW07anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7bGluZS1oZWlnaHQ6MS41O3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW07cG9zaXRpb246cmVsYXRpdmU7dmVydGljYWwtYWxpZ246dG9wO2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7Y29sb3I6IzM2MzYzNjtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZToxZW07b3V0bGluZTpub25lO3BhZGRpbmctcmlnaHQ6Mi41ZW19LnNlbGVjdCBzZWxlY3Q6Zm9jdXMsLnNlbGVjdCBzZWxlY3QuaXMtZm9jdXNlZCwuc2VsZWN0IHNlbGVjdDphY3RpdmUsLnNlbGVjdCBzZWxlY3QuaXMtYWN0aXZle291dGxpbmU6bm9uZX0uc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF0sLnNlbGVjdCBzZWxlY3QuaXMtZGlzYWJsZWR7cG9pbnRlci1ldmVudHM6bm9uZX0uc2VsZWN0IHNlbGVjdDpob3Zlciwuc2VsZWN0IHNlbGVjdC5pcy1ob3ZlcmVke2JvcmRlci1jb2xvcjojYjViNWI1fS5zZWxlY3Qgc2VsZWN0OmZvY3VzLC5zZWxlY3Qgc2VsZWN0LmlzLWZvY3VzZWQsLnNlbGVjdCBzZWxlY3Q6YWN0aXZlLC5zZWxlY3Qgc2VsZWN0LmlzLWFjdGl2ZXtib3JkZXItY29sb3I6IzE4MmI3M30uc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF0sLnNlbGVjdCBzZWxlY3QuaXMtZGlzYWJsZWR7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1jb2xvcjojZjVmNWY1O2JveC1zaGFkb3c6bm9uZTtjb2xvcjojN2E3YTdhfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXTo6LW1vei1wbGFjZWhvbGRlciwuc2VsZWN0IHNlbGVjdC5pcy1kaXNhYmxlZDo6LW1vei1wbGFjZWhvbGRlcntjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuMyl9LnNlbGVjdCBzZWxlY3RbZGlzYWJsZWRdOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyLC5zZWxlY3Qgc2VsZWN0LmlzLWRpc2FibGVkOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF06LW1vei1wbGFjZWhvbGRlciwuc2VsZWN0IHNlbGVjdC5pcy1kaXNhYmxlZDotbW96LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF06LW1zLWlucHV0LXBsYWNlaG9sZGVyLC5zZWxlY3Qgc2VsZWN0LmlzLWRpc2FibGVkOi1tcy1pbnB1dC1wbGFjZWhvbGRlcntjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuMyl9LnNlbGVjdCBzZWxlY3Q6aG92ZXJ7Ym9yZGVyLWNvbG9yOiNiNWI1YjV9LnNlbGVjdCBzZWxlY3Q6Om1zLWV4cGFuZHtkaXNwbGF5Om5vbmV9LnNlbGVjdDpob3ZlcjphZnRlcntib3JkZXItY29sb3I6IzM2MzYzNn0uc2VsZWN0LmlzLXNtYWxse2JvcmRlci1yYWRpdXM6MnB4O2ZvbnQtc2l6ZTouNzVyZW19LnNlbGVjdC5pcy1tZWRpdW17Zm9udC1zaXplOjEuMjVyZW19LnNlbGVjdC5pcy1sYXJnZXtmb250LXNpemU6MS41cmVtfS5zZWxlY3QuaXMtZnVsbHdpZHRoe3dpZHRoOjEwMCV9LnNlbGVjdC5pcy1mdWxsd2lkdGggc2VsZWN0e3dpZHRoOjEwMCV9LmxhYmVse2NvbG9yOiMzNjM2MzY7ZGlzcGxheTpibG9jaztmb250LXdlaWdodDpib2xkfS5sYWJlbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC41ZW19LmhlbHB7ZGlzcGxheTpibG9jaztmb250LXNpemU6Ljc1cmVtO21hcmdpbi10b3A6NXB4fS5oZWxwLmlzLXdoaXRle2NvbG9yOiNmZmZ9LmhlbHAuaXMtYmxhY2t7Y29sb3I6IzBhMGEwYX0uaGVscC5pcy1saWdodHtjb2xvcjojZjVmNWY1fS5oZWxwLmlzLWRhcmt7Y29sb3I6IzM2MzYzNn0uaGVscC5pcy1wcmltYXJ5e2NvbG9yOiMxODJiNzN9LmhlbHAuaXMtaW5mb3tjb2xvcjojMzI3M2RjfS5oZWxwLmlzLXN1Y2Nlc3N7Y29sb3I6IzIzZDE2MH0uaGVscC5pcy13YXJuaW5ne2NvbG9yOiNmZmRkNTd9LmhlbHAuaXMtZGFuZ2Vye2NvbG9yOnJlZH1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmNvbnRyb2wtbGFiZWx7bWFyZ2luLWJvdHRvbTowLjVlbX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5jb250cm9sLWxhYmVse2ZsZXgtYmFzaXM6MDtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowO21hcmdpbi1yaWdodDoxLjVlbTtwYWRkaW5nLXRvcDowLjVlbTt0ZXh0LWFsaWduOnJpZ2h0fX0uY29udHJvbHtwb3NpdGlvbjpyZWxhdGl2ZTt0ZXh0LWFsaWduOmxlZnR9LmNvbnRyb2w6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNzVyZW19LmNvbnRyb2wuaGFzLWFkZG9uc3tkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0LC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdHtib3JkZXItcmFkaXVzOjA7bWFyZ2luLXJpZ2h0Oi0xcHg7d2lkdGg6YXV0b30uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246aG92ZXIsLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQ6aG92ZXIsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0OmhvdmVye3otaW5kZXg6Mn0uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246Zm9jdXMsLmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uOmFjdGl2ZSwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDpmb2N1cywuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDphY3RpdmUsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0OmZvY3VzLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDphY3RpdmV7ei1pbmRleDozfS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpmaXJzdC1jaGlsZCwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDpmaXJzdC1jaGlsZCwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6Zmlyc3QtY2hpbGR7Ym9yZGVyLXJhZGl1czozcHggMCAwIDNweH0uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246Zmlyc3QtY2hpbGQgc2VsZWN0LC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0OmZpcnN0LWNoaWxkIHNlbGVjdCwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6Zmlyc3QtY2hpbGQgc2VsZWN0e2JvcmRlci1yYWRpdXM6M3B4IDAgMCAzcHh9LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uOmxhc3QtY2hpbGQsLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQ6bGFzdC1jaGlsZCwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6bGFzdC1jaGlsZHtib3JkZXItcmFkaXVzOjAgM3B4IDNweCAwfS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpsYXN0LWNoaWxkIHNlbGVjdCwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDpsYXN0LWNoaWxkIHNlbGVjdCwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6bGFzdC1jaGlsZCBzZWxlY3R7Ym9yZGVyLXJhZGl1czowIDNweCAzcHggMH0uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b24uaXMtZXhwYW5kZWQsLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQuaXMtZXhwYW5kZWQsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0LmlzLWV4cGFuZGVke2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjB9LmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0IHNlbGVjdDpob3Zlcnt6LWluZGV4OjJ9LmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0IHNlbGVjdDpmb2N1cywuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Qgc2VsZWN0OmFjdGl2ZXt6LWluZGV4OjN9LmNvbnRyb2wuaGFzLWFkZG9ucy5oYXMtYWRkb25zLWNlbnRlcmVke2p1c3RpZnktY29udGVudDpjZW50ZXJ9LmNvbnRyb2wuaGFzLWFkZG9ucy5oYXMtYWRkb25zLXJpZ2h0e2p1c3RpZnktY29udGVudDpmbGV4LWVuZH0uY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtZnVsbHdpZHRoIC5idXR0b24sLmNvbnRyb2wuaGFzLWFkZG9ucy5oYXMtYWRkb25zLWZ1bGx3aWR0aCAuaW5wdXQsLmNvbnRyb2wuaGFzLWFkZG9ucy5oYXMtYWRkb25zLWZ1bGx3aWR0aCAuc2VsZWN0e2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjB9LmNvbnRyb2wuaGFzLWljb24gLmljb257Y29sb3I6I2RiZGJkYjtwb2ludGVyLWV2ZW50czpub25lO3Bvc2l0aW9uOmFic29sdXRlO3RvcDoxLjI1cmVtO3otaW5kZXg6NH0uY29udHJvbC5oYXMtaWNvbiAuaW5wdXQ6Zm9jdXMrLmljb257Y29sb3I6IzdhN2E3YX0uY29udHJvbC5oYXMtaWNvbiAuaW5wdXQuaXMtc21hbGwrLmljb257dG9wOi45Mzc1cmVtfS5jb250cm9sLmhhcy1pY29uIC5pbnB1dC5pcy1tZWRpdW0rLmljb257dG9wOjEuNTYyNXJlbX0uY29udHJvbC5oYXMtaWNvbiAuaW5wdXQuaXMtbGFyZ2UrLmljb257dG9wOjEuODc1cmVtfS5jb250cm9sLmhhcy1pY29uOm5vdCguaGFzLWljb24tcmlnaHQpIC5pY29ue2xlZnQ6MS4yNXJlbTt0cmFuc2Zvcm06dHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpfS5jb250cm9sLmhhcy1pY29uOm5vdCguaGFzLWljb24tcmlnaHQpIC5pbnB1dHtwYWRkaW5nLWxlZnQ6Mi41ZW19LmNvbnRyb2wuaGFzLWljb246bm90KC5oYXMtaWNvbi1yaWdodCkgLmlucHV0LmlzLXNtYWxsKy5pY29ue2xlZnQ6LjkzNzVyZW19LmNvbnRyb2wuaGFzLWljb246bm90KC5oYXMtaWNvbi1yaWdodCkgLmlucHV0LmlzLW1lZGl1bSsuaWNvbntsZWZ0OjEuNTYyNXJlbX0uY29udHJvbC5oYXMtaWNvbjpub3QoLmhhcy1pY29uLXJpZ2h0KSAuaW5wdXQuaXMtbGFyZ2UrLmljb257bGVmdDoxLjg3NXJlbX0uY29udHJvbC5oYXMtaWNvbi5oYXMtaWNvbi1yaWdodCAuaWNvbntyaWdodDoxLjI1cmVtO3RyYW5zZm9ybTp0cmFuc2xhdGVYKDUwJSkgdHJhbnNsYXRlWSgtNTAlKX0uY29udHJvbC5oYXMtaWNvbi5oYXMtaWNvbi1yaWdodCAuaW5wdXR7cGFkZGluZy1yaWdodDoyLjVlbX0uY29udHJvbC5oYXMtaWNvbi5oYXMtaWNvbi1yaWdodCAuaW5wdXQuaXMtc21hbGwrLmljb257cmlnaHQ6LjkzNzVyZW19LmNvbnRyb2wuaGFzLWljb24uaGFzLWljb24tcmlnaHQgLmlucHV0LmlzLW1lZGl1bSsuaWNvbntyaWdodDoxLjU2MjVyZW19LmNvbnRyb2wuaGFzLWljb24uaGFzLWljb24tcmlnaHQgLmlucHV0LmlzLWxhcmdlKy5pY29ue3JpZ2h0OjEuODc1cmVtfS5jb250cm9sLmlzLWdyb3VwZWR7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0fS5jb250cm9sLmlzLWdyb3VwZWQ+LmNvbnRyb2x7ZmxleC1iYXNpczowO2ZsZXgtc2hyaW5rOjB9LmNvbnRyb2wuaXMtZ3JvdXBlZD4uY29udHJvbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MDttYXJnaW4tcmlnaHQ6MC43NXJlbX0uY29udHJvbC5pcy1ncm91cGVkPi5jb250cm9sLmlzLWV4cGFuZGVke2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjF9LmNvbnRyb2wuaXMtZ3JvdXBlZC5pcy1ncm91cGVkLWNlbnRlcmVke2p1c3RpZnktY29udGVudDpjZW50ZXJ9LmNvbnRyb2wuaXMtZ3JvdXBlZC5pcy1ncm91cGVkLXJpZ2h0e2p1c3RpZnktY29udGVudDpmbGV4LWVuZH1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmNvbnRyb2wuaXMtaG9yaXpvbnRhbHtkaXNwbGF5OmZsZXh9LmNvbnRyb2wuaXMtaG9yaXpvbnRhbD4uY29udHJvbHtkaXNwbGF5OmZsZXg7ZmxleC1iYXNpczowO2ZsZXgtZ3Jvdzo1O2ZsZXgtc2hyaW5rOjF9fS5jb250cm9sLmlzLWxvYWRpbmc6YWZ0ZXJ7YW5pbWF0aW9uOnNwaW5Bcm91bmQgNTAwbXMgaW5maW5pdGUgbGluZWFyO2JvcmRlcjoycHggc29saWQgI2RiZGJkYjtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2JvcmRlci1yaWdodC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItdG9wLWNvbG9yOnRyYW5zcGFyZW50O2NvbnRlbnQ6XFxcIlxcXCI7ZGlzcGxheTpibG9jaztoZWlnaHQ6MXJlbTtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoxcmVtO3Bvc2l0aW9uOmFic29sdXRlICFpbXBvcnRhbnQ7cmlnaHQ6MC43NWVtO3RvcDowLjc1ZW19Lmljb257ZGlzcGxheTppbmxpbmUtYmxvY2s7Zm9udC1zaXplOjIxcHg7aGVpZ2h0OjEuNXJlbTtsaW5lLWhlaWdodDoxLjVyZW07dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjEuNXJlbX0uaWNvbiAuZmF7Zm9udC1zaXplOmluaGVyaXQ7bGluZS1oZWlnaHQ6aW5oZXJpdH0uaWNvbi5pcy1zbWFsbHtkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MTRweDtoZWlnaHQ6MXJlbTtsaW5lLWhlaWdodDoxcmVtO3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcDt3aWR0aDoxcmVtfS5pY29uLmlzLW1lZGl1bXtkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MjhweDtoZWlnaHQ6MnJlbTtsaW5lLWhlaWdodDoycmVtO3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcDt3aWR0aDoycmVtfS5pY29uLmlzLWxhcmdle2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZTo0MnB4O2hlaWdodDozcmVtO2xpbmUtaGVpZ2h0OjNyZW07dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjNyZW19LmltYWdle2Rpc3BsYXk6YmxvY2s7cG9zaXRpb246cmVsYXRpdmV9LmltYWdlIGltZ3tkaXNwbGF5OmJsb2NrO2hlaWdodDphdXRvO3dpZHRoOjEwMCV9LmltYWdlLmlzLXNxdWFyZSBpbWcsLmltYWdlLmlzLTFieTEgaW1nLC5pbWFnZS5pcy00YnkzIGltZywuaW1hZ2UuaXMtM2J5MiBpbWcsLmltYWdlLmlzLTE2Ynk5IGltZywuaW1hZ2UuaXMtMmJ5MSBpbWd7Ym90dG9tOjA7bGVmdDowO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjA7aGVpZ2h0OjEwMCU7d2lkdGg6MTAwJX0uaW1hZ2UuaXMtc3F1YXJlLC5pbWFnZS5pcy0xYnkxe3BhZGRpbmctdG9wOjEwMCV9LmltYWdlLmlzLTRieTN7cGFkZGluZy10b3A6NzUlfS5pbWFnZS5pcy0zYnkye3BhZGRpbmctdG9wOjY2LjY2NjYlfS5pbWFnZS5pcy0xNmJ5OXtwYWRkaW5nLXRvcDo1Ni4yNSV9LmltYWdlLmlzLTJieTF7cGFkZGluZy10b3A6NTAlfS5pbWFnZS5pcy0xNngxNntoZWlnaHQ6MTZweDt3aWR0aDoxNnB4fS5pbWFnZS5pcy0yNHgyNHtoZWlnaHQ6MjRweDt3aWR0aDoyNHB4fS5pbWFnZS5pcy0zMngzMntoZWlnaHQ6MzJweDt3aWR0aDozMnB4fS5pbWFnZS5pcy00OHg0OHtoZWlnaHQ6NDhweDt3aWR0aDo0OHB4fS5pbWFnZS5pcy02NHg2NHtoZWlnaHQ6NjRweDt3aWR0aDo2NHB4fS5pbWFnZS5pcy05Nng5NntoZWlnaHQ6OTZweDt3aWR0aDo5NnB4fS5pbWFnZS5pcy0xMjh4MTI4e2hlaWdodDoxMjhweDt3aWR0aDoxMjhweH0ubm90aWZpY2F0aW9ue2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItcmFkaXVzOjNweDtwYWRkaW5nOjEuMjVyZW0gMi41cmVtIDEuMjVyZW0gMS41cmVtO3Bvc2l0aW9uOnJlbGF0aXZlfS5ub3RpZmljYXRpb246bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0ubm90aWZpY2F0aW9uIGNvZGUsLm5vdGlmaWNhdGlvbiBwcmV7YmFja2dyb3VuZDojZmZmfS5ub3RpZmljYXRpb24gcHJlIGNvZGV7YmFja2dyb3VuZDp0cmFuc3BhcmVudH0ubm90aWZpY2F0aW9uIC5kZWxldGV7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MC41ZW07dG9wOjAuNWVtfS5ub3RpZmljYXRpb24gLnRpdGxlLC5ub3RpZmljYXRpb24gLnN1YnRpdGxlLC5ub3RpZmljYXRpb24gLmNvbnRlbnR7Y29sb3I6aW5oZXJpdH0ubm90aWZpY2F0aW9uLmlzLXdoaXRle2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5ub3RpZmljYXRpb24uaXMtYmxhY2t7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9Lm5vdGlmaWNhdGlvbi5pcy1saWdodHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0ubm90aWZpY2F0aW9uLmlzLWRhcmt7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9Lm5vdGlmaWNhdGlvbi5pcy1wcmltYXJ5e2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmfS5ub3RpZmljYXRpb24uaXMtaW5mb3tiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Y29sb3I6I2ZmZn0ubm90aWZpY2F0aW9uLmlzLXN1Y2Nlc3N7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwO2NvbG9yOiNmZmZ9Lm5vdGlmaWNhdGlvbi5pcy13YXJuaW5ne2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1Nztjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lm5vdGlmaWNhdGlvbi5pcy1kYW5nZXJ7YmFja2dyb3VuZC1jb2xvcjpyZWQ7Y29sb3I6I2ZmZn0ucHJvZ3Jlc3N7LW1vei1hcHBlYXJhbmNlOm5vbmU7LXdlYmtpdC1hcHBlYXJhbmNlOm5vbmU7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcmVtO292ZXJmbG93OmhpZGRlbjtwYWRkaW5nOjA7d2lkdGg6MTAwJX0ucHJvZ3Jlc3M6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0ucHJvZ3Jlc3M6Oi13ZWJraXQtcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6I2RiZGJkYn0ucHJvZ3Jlc3M6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojNGE0YTRhfS5wcm9ncmVzczo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojNGE0YTRhfS5wcm9ncmVzcy5pcy13aGl0ZTo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9LnByb2dyZXNzLmlzLXdoaXRlOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9LnByb2dyZXNzLmlzLWJsYWNrOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6IzBhMGEwYX0ucHJvZ3Jlc3MuaXMtYmxhY2s6Oi1tb3otcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6IzBhMGEwYX0ucHJvZ3Jlc3MuaXMtbGlnaHQ6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5wcm9ncmVzcy5pcy1saWdodDo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5wcm9ncmVzcy5pcy1kYXJrOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6IzM2MzYzNn0ucHJvZ3Jlc3MuaXMtZGFyazo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2fS5wcm9ncmVzcy5pcy1wcmltYXJ5Ojotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6IzE4MmI3M30ucHJvZ3Jlc3MuaXMtcHJpbWFyeTo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczfS5wcm9ncmVzcy5pcy1pbmZvOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6IzMyNzNkY30ucHJvZ3Jlc3MuaXMtaW5mbzo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjfS5wcm9ncmVzcy5pcy1zdWNjZXNzOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6IzIzZDE2MH0ucHJvZ3Jlc3MuaXMtc3VjY2Vzczo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwfS5wcm9ncmVzcy5pcy13YXJuaW5nOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1N30ucHJvZ3Jlc3MuaXMtd2FybmluZzo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3fS5wcm9ncmVzcy5pcy1kYW5nZXI6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjpyZWR9LnByb2dyZXNzLmlzLWRhbmdlcjo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjpyZWR9LnByb2dyZXNzLmlzLXNtYWxse2hlaWdodDouNzVyZW19LnByb2dyZXNzLmlzLW1lZGl1bXtoZWlnaHQ6MS4yNXJlbX0ucHJvZ3Jlc3MuaXMtbGFyZ2V7aGVpZ2h0OjEuNXJlbX0udGFibGV7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMzNjM2MzY7bWFyZ2luLWJvdHRvbToxLjVyZW07d2lkdGg6MTAwJX0udGFibGUgdGQsLnRhYmxlIHRoe2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtib3JkZXItd2lkdGg6MCAwIDFweDtwYWRkaW5nOjAuNWVtIDAuNzVlbTt2ZXJ0aWNhbC1hbGlnbjp0b3B9LnRhYmxlIHRkLmlzLW5hcnJvdywudGFibGUgdGguaXMtbmFycm93e3doaXRlLXNwYWNlOm5vd3JhcDt3aWR0aDoxJX0udGFibGUgdGh7Y29sb3I6IzM2MzYzNjt0ZXh0LWFsaWduOmxlZnR9LnRhYmxlIHRyOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZhZmFmYX0udGFibGUgdGhlYWQgdGQsLnRhYmxlIHRoZWFkIHRoe2JvcmRlci13aWR0aDowIDAgMnB4O2NvbG9yOiM3YTdhN2F9LnRhYmxlIHRmb290IHRkLC50YWJsZSB0Zm9vdCB0aHtib3JkZXItd2lkdGg6MnB4IDAgMDtjb2xvcjojN2E3YTdhfS50YWJsZSB0Ym9keSB0cjpsYXN0LWNoaWxkIHRkLC50YWJsZSB0Ym9keSB0cjpsYXN0LWNoaWxkIHRoe2JvcmRlci1ib3R0b20td2lkdGg6MH0udGFibGUuaXMtYm9yZGVyZWQgdGQsLnRhYmxlLmlzLWJvcmRlcmVkIHRoe2JvcmRlci13aWR0aDoxcHh9LnRhYmxlLmlzLWJvcmRlcmVkIHRyOmxhc3QtY2hpbGQgdGQsLnRhYmxlLmlzLWJvcmRlcmVkIHRyOmxhc3QtY2hpbGQgdGh7Ym9yZGVyLWJvdHRvbS13aWR0aDoxcHh9LnRhYmxlLmlzLW5hcnJvdyB0ZCwudGFibGUuaXMtbmFycm93IHRoe3BhZGRpbmc6MC4yNWVtIDAuNWVtfS50YWJsZS5pcy1zdHJpcGVkIHRib2R5IHRyOm50aC1jaGlsZChldmVuKXtiYWNrZ3JvdW5kLWNvbG9yOiNmYWZhZmF9LnRhYmxlLmlzLXN0cmlwZWQgdGJvZHkgdHI6bnRoLWNoaWxkKGV2ZW4pOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX0udGFne2FsaWduLWl0ZW1zOmNlbnRlcjtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtjb2xvcjojNGE0YTRhO2Rpc3BsYXk6aW5saW5lLWZsZXg7Zm9udC1zaXplOi43NXJlbTtoZWlnaHQ6MmVtO2p1c3RpZnktY29udGVudDpjZW50ZXI7bGluZS1oZWlnaHQ6MS41O3BhZGRpbmctbGVmdDowLjg3NWVtO3BhZGRpbmctcmlnaHQ6MC44NzVlbTt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2hpdGUtc3BhY2U6bm93cmFwfS50YWcgLmRlbGV0ZXttYXJnaW4tbGVmdDowLjI1ZW07bWFyZ2luLXJpZ2h0Oi0wLjVlbX0udGFnLmlzLXdoaXRle2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS50YWcuaXMtYmxhY2t7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9LnRhZy5pcy1saWdodHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0udGFnLmlzLWRhcmt7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9LnRhZy5pcy1wcmltYXJ5e2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmfS50YWcuaXMtaW5mb3tiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Y29sb3I6I2ZmZn0udGFnLmlzLXN1Y2Nlc3N7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwO2NvbG9yOiNmZmZ9LnRhZy5pcy13YXJuaW5ne2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1Nztjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9LnRhZy5pcy1kYW5nZXJ7YmFja2dyb3VuZC1jb2xvcjpyZWQ7Y29sb3I6I2ZmZn0udGFnLmlzLW1lZGl1bXtmb250LXNpemU6MXJlbX0udGFnLmlzLWxhcmdle2ZvbnQtc2l6ZToxLjI1cmVtfS50aXRsZSwuc3VidGl0bGV7d29yZC1icmVhazpicmVhay13b3JkfS50aXRsZTpub3QoOmxhc3QtY2hpbGQpLC5zdWJ0aXRsZTpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS50aXRsZSBlbSwudGl0bGUgc3Bhbiwuc3VidGl0bGUgZW0sLnN1YnRpdGxlIHNwYW57Zm9udC13ZWlnaHQ6MzAwfS50aXRsZSBzdHJvbmcsLnN1YnRpdGxlIHN0cm9uZ3tmb250LXdlaWdodDo1MDB9LnRpdGxlIC50YWcsLnN1YnRpdGxlIC50YWd7dmVydGljYWwtYWxpZ246bWlkZGxlfS50aXRsZXtjb2xvcjojMzYzNjM2O2ZvbnQtc2l6ZToycmVtO2ZvbnQtd2VpZ2h0OjMwMDtsaW5lLWhlaWdodDoxLjEyNX0udGl0bGUgc3Ryb25ne2NvbG9yOmluaGVyaXR9LnRpdGxlKy5oaWdobGlnaHR7bWFyZ2luLXRvcDotMC43NXJlbX0udGl0bGUrLnN1YnRpdGxle21hcmdpbi10b3A6LTEuMjVyZW19LnRpdGxlLmlzLTF7Zm9udC1zaXplOjMuNXJlbX0udGl0bGUuaXMtMntmb250LXNpemU6Mi43NXJlbX0udGl0bGUuaXMtM3tmb250LXNpemU6MnJlbX0udGl0bGUuaXMtNHtmb250LXNpemU6MS41cmVtfS50aXRsZS5pcy01e2ZvbnQtc2l6ZToxLjI1cmVtfS50aXRsZS5pcy02e2ZvbnQtc2l6ZToxNHB4fS5zdWJ0aXRsZXtjb2xvcjojNGE0YTRhO2ZvbnQtc2l6ZToxLjI1cmVtO2ZvbnQtd2VpZ2h0OjMwMDtsaW5lLWhlaWdodDoxLjI1fS5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6IzM2MzYzNn0uc3VidGl0bGUrLnRpdGxle21hcmdpbi10b3A6LTEuNXJlbX0uc3VidGl0bGUuaXMtMXtmb250LXNpemU6My41cmVtfS5zdWJ0aXRsZS5pcy0ye2ZvbnQtc2l6ZToyLjc1cmVtfS5zdWJ0aXRsZS5pcy0ze2ZvbnQtc2l6ZToycmVtfS5zdWJ0aXRsZS5pcy00e2ZvbnQtc2l6ZToxLjVyZW19LnN1YnRpdGxlLmlzLTV7Zm9udC1zaXplOjEuMjVyZW19LnN1YnRpdGxlLmlzLTZ7Zm9udC1zaXplOjE0cHh9LmJsb2NrOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LmNvbnRhaW5lcntwb3NpdGlvbjpyZWxhdGl2ZX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5jb250YWluZXJ7bWFyZ2luOjAgYXV0bzttYXgtd2lkdGg6OTYwcHh9LmNvbnRhaW5lci5pcy1mbHVpZHttYXJnaW46MCAyMHB4O21heC13aWR0aDpub25lfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMTkycHgpey5jb250YWluZXJ7bWF4LXdpZHRoOjExNTJweH19LmRlbGV0ZXstd2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lOy1tcy11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmU7LW1vei1hcHBlYXJhbmNlOm5vbmU7LXdlYmtpdC1hcHBlYXJhbmNlOm5vbmU7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMik7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MXJlbTtoZWlnaHQ6MjBweDtvdXRsaW5lOm5vbmU7cG9zaXRpb246cmVsYXRpdmU7dHJhbnNmb3JtOnJvdGF0ZSg0NWRlZyk7dHJhbnNmb3JtLW9yaWdpbjpjZW50ZXIgY2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcDt3aWR0aDoyMHB4fS5kZWxldGU6YmVmb3JlLC5kZWxldGU6YWZ0ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbnRlbnQ6XFxcIlxcXCI7ZGlzcGxheTpibG9jaztsZWZ0OjUwJTtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSl9LmRlbGV0ZTpiZWZvcmV7aGVpZ2h0OjJweDt3aWR0aDo1MCV9LmRlbGV0ZTphZnRlcntoZWlnaHQ6NTAlO3dpZHRoOjJweH0uZGVsZXRlOmhvdmVyLC5kZWxldGU6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMyl9LmRlbGV0ZTphY3RpdmV7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuNCl9LmRlbGV0ZS5pcy1zbWFsbHtoZWlnaHQ6MTRweDt3aWR0aDoxNHB4fS5kZWxldGUuaXMtbWVkaXVte2hlaWdodDoyNnB4O3dpZHRoOjI2cHh9LmRlbGV0ZS5pcy1sYXJnZXtoZWlnaHQ6MzBweDt3aWR0aDozMHB4fS5mYXtmb250LXNpemU6MjFweDt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3B9LmhlYWRpbmd7ZGlzcGxheTpibG9jaztmb250LXNpemU6MTFweDtsZXR0ZXItc3BhY2luZzoxcHg7bWFyZ2luLWJvdHRvbTo1cHg7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlfS5oaWdobGlnaHR7Zm9udC13ZWlnaHQ6NDAwO21heC13aWR0aDoxMDAlO292ZXJmbG93OmhpZGRlbjtwYWRkaW5nOjB9LmhpZ2hsaWdodDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5oaWdobGlnaHQgcHJle292ZXJmbG93OmF1dG87bWF4LXdpZHRoOjEwMCV9LmxvYWRlcnthbmltYXRpb246c3BpbkFyb3VuZCA1MDBtcyBpbmZpbml0ZSBsaW5lYXI7Ym9yZGVyOjJweCBzb2xpZCAjZGJkYmRiO2JvcmRlci1yYWRpdXM6MjkwNDg2cHg7Ym9yZGVyLXJpZ2h0LWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci10b3AtY29sb3I6dHJhbnNwYXJlbnQ7Y29udGVudDpcXFwiXFxcIjtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcmVtO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjFyZW19Lm51bWJlcnthbGlnbi1pdGVtczpjZW50ZXI7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1yYWRpdXM6MjkwNDg2cHg7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MS4yNXJlbTtoZWlnaHQ6MmVtO2p1c3RpZnktY29udGVudDpjZW50ZXI7bWFyZ2luLXJpZ2h0OjEuNXJlbTttaW4td2lkdGg6Mi41ZW07cGFkZGluZzowLjI1cmVtIDAuNXJlbTt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3B9LmNhcmQtaGVhZGVye2FsaWduLWl0ZW1zOnN0cmV0Y2g7Ym94LXNoYWRvdzowIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjEpO2Rpc3BsYXk6ZmxleH0uY2FyZC1oZWFkZXItdGl0bGV7YWxpZ24taXRlbXM6Y2VudGVyO2NvbG9yOiMzNjM2MzY7ZGlzcGxheTpmbGV4O2ZsZXgtZ3JvdzoxO2ZvbnQtd2VpZ2h0OjcwMDtwYWRkaW5nOjAuNzVyZW19LmNhcmQtaGVhZGVyLWljb257YWxpZ24taXRlbXM6Y2VudGVyO2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmc6MC43NXJlbX0uY2FyZC1pbWFnZXtkaXNwbGF5OmJsb2NrO3Bvc2l0aW9uOnJlbGF0aXZlfS5jYXJkLWNvbnRlbnR7cGFkZGluZzoxLjVyZW19LmNhcmQtY29udGVudCAudGl0bGUrLnN1YnRpdGxle21hcmdpbi10b3A6LTEuNXJlbX0uY2FyZC1mb290ZXJ7Ym9yZGVyLXRvcDoxcHggc29saWQgI2RiZGJkYjthbGlnbi1pdGVtczpzdHJldGNoO2Rpc3BsYXk6ZmxleH0uY2FyZC1mb290ZXItaXRlbXthbGlnbi1pdGVtczpjZW50ZXI7ZGlzcGxheTpmbGV4O2ZsZXgtYmFzaXM6MDtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowO2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZzowLjc1cmVtfS5jYXJkLWZvb3Rlci1pdGVtOm5vdCg6bGFzdC1jaGlsZCl7Ym9yZGVyLXJpZ2h0OjFweCBzb2xpZCAjZGJkYmRifS5jYXJke2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3gtc2hhZG93OjAgMnB4IDNweCByZ2JhKDEwLDEwLDEwLDAuMSksMCAwIDAgMXB4IHJnYmEoMTAsMTAsMTAsMC4xKTtjb2xvcjojNGE0YTRhO21heC13aWR0aDoxMDAlO3Bvc2l0aW9uOnJlbGF0aXZlfS5jYXJkIC5tZWRpYTpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX0ubGV2ZWwtaXRlbXthbGlnbi1pdGVtczpjZW50ZXI7ZGlzcGxheTpmbGV4O2ZsZXgtYmFzaXM6YXV0bztmbGV4LWdyb3c6MDtmbGV4LXNocmluazowO2p1c3RpZnktY29udGVudDpjZW50ZXJ9LmxldmVsLWl0ZW0gLnRpdGxlLC5sZXZlbC1pdGVtIC5zdWJ0aXRsZXttYXJnaW4tYm90dG9tOjB9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5sZXZlbC1pdGVtOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfX0ubGV2ZWwtbGVmdCwubGV2ZWwtcmlnaHR7ZmxleC1iYXNpczphdXRvO2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjB9LmxldmVsLWxlZnQgLmxldmVsLWl0ZW06bm90KDpsYXN0LWNoaWxkKSwubGV2ZWwtcmlnaHQgLmxldmVsLWl0ZW06bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6MC43NXJlbX0ubGV2ZWwtbGVmdCAubGV2ZWwtaXRlbS5pcy1mbGV4aWJsZSwubGV2ZWwtcmlnaHQgLmxldmVsLWl0ZW0uaXMtZmxleGlibGV7ZmxleC1ncm93OjF9LmxldmVsLWxlZnR7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsubGV2ZWwtbGVmdCsubGV2ZWwtcmlnaHR7bWFyZ2luLXRvcDoxLjVyZW19fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsubGV2ZWwtbGVmdHtkaXNwbGF5OmZsZXh9fS5sZXZlbC1yaWdodHthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsubGV2ZWwtcmlnaHR7ZGlzcGxheTpmbGV4fX0ubGV2ZWx7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVufS5sZXZlbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5sZXZlbCBjb2Rle2JvcmRlci1yYWRpdXM6M3B4fS5sZXZlbCBpbWd7ZGlzcGxheTppbmxpbmUtYmxvY2s7dmVydGljYWwtYWxpZ246dG9wfS5sZXZlbC5pcy1tb2JpbGV7ZGlzcGxheTpmbGV4fS5sZXZlbC5pcy1tb2JpbGU+LmxldmVsLWl0ZW06bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjB9LmxldmVsLmlzLW1vYmlsZT4ubGV2ZWwtaXRlbTpub3QoLmlzLW5hcnJvdyl7ZmxleC1ncm93OjF9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5sZXZlbHtkaXNwbGF5OmZsZXh9LmxldmVsPi5sZXZlbC1pdGVtOm5vdCguaXMtbmFycm93KXtmbGV4LWdyb3c6MX19Lm1lZGlhLWxlZnQsLm1lZGlhLXJpZ2h0e2ZsZXgtYmFzaXM6YXV0bztmbGV4LWdyb3c6MDtmbGV4LXNocmluazowfS5tZWRpYS1sZWZ0e21hcmdpbi1yaWdodDoxcmVtfS5tZWRpYS1yaWdodHttYXJnaW4tbGVmdDoxcmVtfS5tZWRpYS1jb250ZW50e2ZsZXgtYmFzaXM6YXV0bztmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO3RleHQtYWxpZ246bGVmdH0ubWVkaWF7YWxpZ24taXRlbXM6ZmxleC1zdGFydDtkaXNwbGF5OmZsZXg7dGV4dC1hbGlnbjpsZWZ0fS5tZWRpYSAuY29udGVudDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX0ubWVkaWEgLm1lZGlhe2JvcmRlci10b3A6MXB4IHNvbGlkIHJnYmEoMjE5LDIxOSwyMTksMC41KTtkaXNwbGF5OmZsZXg7cGFkZGluZy10b3A6MC43NXJlbX0ubWVkaWEgLm1lZGlhIC5jb250ZW50Om5vdCg6bGFzdC1jaGlsZCksLm1lZGlhIC5tZWRpYSAuY29udHJvbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC41cmVtfS5tZWRpYSAubWVkaWEgLm1lZGlhe3BhZGRpbmctdG9wOjAuNXJlbX0ubWVkaWEgLm1lZGlhIC5tZWRpYSsubWVkaWF7bWFyZ2luLXRvcDowLjVyZW19Lm1lZGlhKy5tZWRpYXtib3JkZXItdG9wOjFweCBzb2xpZCByZ2JhKDIxOSwyMTksMjE5LDAuNSk7bWFyZ2luLXRvcDoxcmVtO3BhZGRpbmctdG9wOjFyZW19Lm1lZGlhLmlzLWxhcmdlKy5tZWRpYXttYXJnaW4tdG9wOjEuNXJlbTtwYWRkaW5nLXRvcDoxLjVyZW19Lm1lbnV7Zm9udC1zaXplOjFyZW19Lm1lbnUtbGlzdHtsaW5lLWhlaWdodDoxLjI1fS5tZW51LWxpc3QgYXtib3JkZXItcmFkaXVzOjJweDtjb2xvcjojNGE0YTRhO2Rpc3BsYXk6YmxvY2s7cGFkZGluZzowLjVlbSAwLjc1ZW19Lm1lbnUtbGlzdCBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMTgyYjczfS5tZW51LWxpc3QgYS5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9Lm1lbnUtbGlzdCBsaSB1bHtib3JkZXItbGVmdDoxcHggc29saWQgI2RiZGJkYjttYXJnaW46MC43NWVtO3BhZGRpbmctbGVmdDowLjc1ZW19Lm1lbnUtbGFiZWx7Y29sb3I6IzdhN2E3YTtmb250LXNpemU6MC44ZW07bGV0dGVyLXNwYWNpbmc6MC4xZW07dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlfS5tZW51LWxhYmVsOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi10b3A6MWVtfS5tZW51LWxhYmVsOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxZW19Lm1lc3NhZ2V7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1yYWRpdXM6M3B4O2ZvbnQtc2l6ZToxcmVtfS5tZXNzYWdlOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19Lm1lc3NhZ2UuaXMtd2hpdGV7YmFja2dyb3VuZC1jb2xvcjojZmZmfS5tZXNzYWdlLmlzLXdoaXRlIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0ubWVzc2FnZS5pcy13aGl0ZSAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiM0ZDRkNGR9Lm1lc3NhZ2UuaXMtYmxhY2t7YmFja2dyb3VuZC1jb2xvcjojZmFmYWZhfS5tZXNzYWdlLmlzLWJsYWNrIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0ubWVzc2FnZS5pcy1ibGFjayAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojMGEwYTBhO2NvbG9yOiMwOTA5MDl9Lm1lc3NhZ2UuaXMtbGlnaHR7YmFja2dyb3VuZC1jb2xvcjojZmFmYWZhfS5tZXNzYWdlLmlzLWxpZ2h0IC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0ubWVzc2FnZS5pcy1saWdodCAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojZjVmNWY1O2NvbG9yOiM1MDUwNTB9Lm1lc3NhZ2UuaXMtZGFya3tiYWNrZ3JvdW5kLWNvbG9yOiNmYWZhZmF9Lm1lc3NhZ2UuaXMtZGFyayAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9Lm1lc3NhZ2UuaXMtZGFyayAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojMzYzNjM2O2NvbG9yOiMyYTJhMmF9Lm1lc3NhZ2UuaXMtcHJpbWFyeXtiYWNrZ3JvdW5kLWNvbG9yOiNmN2Y4ZmR9Lm1lc3NhZ2UuaXMtcHJpbWFyeSAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9Lm1lc3NhZ2UuaXMtcHJpbWFyeSAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojMTgyYjczO2NvbG9yOiMxNjI2NjJ9Lm1lc3NhZ2UuaXMtaW5mb3tiYWNrZ3JvdW5kLWNvbG9yOiNmNmY5ZmV9Lm1lc3NhZ2UuaXMtaW5mbyAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjO2NvbG9yOiNmZmZ9Lm1lc3NhZ2UuaXMtaW5mbyAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojMzI3M2RjO2NvbG9yOiMyMjUwOWF9Lm1lc3NhZ2UuaXMtc3VjY2Vzc3tiYWNrZ3JvdW5kLWNvbG9yOiNmNmZlZjl9Lm1lc3NhZ2UuaXMtc3VjY2VzcyAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwO2NvbG9yOiNmZmZ9Lm1lc3NhZ2UuaXMtc3VjY2VzcyAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojMjNkMTYwO2NvbG9yOiMwZTMwMWF9Lm1lc3NhZ2UuaXMtd2FybmluZ3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmZkZjV9Lm1lc3NhZ2UuaXMtd2FybmluZyAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0ubWVzc2FnZS5pcy13YXJuaW5nIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiNmZmRkNTc7Y29sb3I6IzNiMzEwOH0ubWVzc2FnZS5pcy1kYW5nZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmNWY1fS5tZXNzYWdlLmlzLWRhbmdlciAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjpyZWQ7Y29sb3I6I2ZmZn0ubWVzc2FnZS5pcy1kYW5nZXIgLm1lc3NhZ2UtYm9keXtib3JkZXItY29sb3I6cmVkO2NvbG9yOiNhZDA2MDZ9Lm1lc3NhZ2UtaGVhZGVye2FsaWduLWl0ZW1zOmNlbnRlcjtiYWNrZ3JvdW5kLWNvbG9yOiM0YTRhNGE7Ym9yZGVyLXJhZGl1czozcHggM3B4IDAgMDtjb2xvcjojZmZmO2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjtsaW5lLWhlaWdodDoxLjI1O3BhZGRpbmc6MC41ZW0gMC43NWVtO3Bvc2l0aW9uOnJlbGF0aXZlfS5tZXNzYWdlLWhlYWRlciBhLC5tZXNzYWdlLWhlYWRlciBzdHJvbmd7Y29sb3I6aW5oZXJpdH0ubWVzc2FnZS1oZWFkZXIgYXt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lfS5tZXNzYWdlLWhlYWRlciAuZGVsZXRle2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjA7bWFyZ2luLWxlZnQ6MC43NWVtfS5tZXNzYWdlLWhlYWRlcisubWVzc2FnZS1ib2R5e2JvcmRlci10b3AtbGVmdC1yYWRpdXM6MDtib3JkZXItdG9wLXJpZ2h0LXJhZGl1czowO2JvcmRlci10b3A6bm9uZX0ubWVzc2FnZS1ib2R5e2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtib3JkZXItcmFkaXVzOjNweDtjb2xvcjojNGE0YTRhO3BhZGRpbmc6MWVtIDEuMjVlbX0ubWVzc2FnZS1ib2R5IGEsLm1lc3NhZ2UtYm9keSBzdHJvbmd7Y29sb3I6aW5oZXJpdH0ubWVzc2FnZS1ib2R5IGF7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZX0ubWVzc2FnZS1ib2R5IGNvZGUsLm1lc3NhZ2UtYm9keSBwcmV7YmFja2dyb3VuZDojZmZmfS5tZXNzYWdlLWJvZHkgcHJlIGNvZGV7YmFja2dyb3VuZDp0cmFuc3BhcmVudH0ubW9kYWwtYmFja2dyb3VuZHtib3R0b206MDtsZWZ0OjA7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDt0b3A6MDtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC44Nil9Lm1vZGFsLWNvbnRlbnQsLm1vZGFsLWNhcmR7bWFyZ2luOjAgMjBweDttYXgtaGVpZ2h0OmNhbGMoMTAwdmggLSAxNjBweCk7b3ZlcmZsb3c6YXV0bztwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoxMDAlfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsubW9kYWwtY29udGVudCwubW9kYWwtY2FyZHttYXJnaW46MCBhdXRvO21heC1oZWlnaHQ6Y2FsYygxMDB2aCAtIDQwcHgpO3dpZHRoOjY0MHB4fX0ubW9kYWwtY2xvc2V7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lOy1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjIpO2JvcmRlcjpub25lO2JvcmRlci1yYWRpdXM6MjkwNDg2cHg7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTppbmxpbmUtYmxvY2s7Zm9udC1zaXplOjFyZW07aGVpZ2h0OjIwcHg7b3V0bGluZTpub25lO3Bvc2l0aW9uOnJlbGF0aXZlO3RyYW5zZm9ybTpyb3RhdGUoNDVkZWcpO3RyYW5zZm9ybS1vcmlnaW46Y2VudGVyIGNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6MjBweDtiYWNrZ3JvdW5kOm5vbmU7aGVpZ2h0OjQwcHg7cG9zaXRpb246Zml4ZWQ7cmlnaHQ6MjBweDt0b3A6MjBweDt3aWR0aDo0MHB4fS5tb2RhbC1jbG9zZTpiZWZvcmUsLm1vZGFsLWNsb3NlOmFmdGVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb250ZW50OlxcXCJcXFwiO2Rpc3BsYXk6YmxvY2s7bGVmdDo1MCU7cG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTt0cmFuc2Zvcm06dHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpfS5tb2RhbC1jbG9zZTpiZWZvcmV7aGVpZ2h0OjJweDt3aWR0aDo1MCV9Lm1vZGFsLWNsb3NlOmFmdGVye2hlaWdodDo1MCU7d2lkdGg6MnB4fS5tb2RhbC1jbG9zZTpob3ZlciwubW9kYWwtY2xvc2U6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMyl9Lm1vZGFsLWNsb3NlOmFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC40KX0ubW9kYWwtY2xvc2UuaXMtc21hbGx7aGVpZ2h0OjE0cHg7d2lkdGg6MTRweH0ubW9kYWwtY2xvc2UuaXMtbWVkaXVte2hlaWdodDoyNnB4O3dpZHRoOjI2cHh9Lm1vZGFsLWNsb3NlLmlzLWxhcmdle2hlaWdodDozMHB4O3dpZHRoOjMwcHh9Lm1vZGFsLWNhcmR7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjttYXgtaGVpZ2h0OmNhbGMoMTAwdmggLSA0MHB4KTtvdmVyZmxvdzpoaWRkZW59Lm1vZGFsLWNhcmQtaGVhZCwubW9kYWwtY2FyZC1mb290e2FsaWduLWl0ZW1zOmNlbnRlcjtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7ZGlzcGxheTpmbGV4O2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7cGFkZGluZzoyMHB4O3Bvc2l0aW9uOnJlbGF0aXZlfS5tb2RhbC1jYXJkLWhlYWR7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2RiZGJkYjtib3JkZXItdG9wLWxlZnQtcmFkaXVzOjVweDtib3JkZXItdG9wLXJpZ2h0LXJhZGl1czo1cHh9Lm1vZGFsLWNhcmQtdGl0bGV7Y29sb3I6IzM2MzYzNjtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowO2ZvbnQtc2l6ZToxLjVyZW07bGluZS1oZWlnaHQ6MX0ubW9kYWwtY2FyZC1mb290e2JvcmRlci1ib3R0b20tbGVmdC1yYWRpdXM6NXB4O2JvcmRlci1ib3R0b20tcmlnaHQtcmFkaXVzOjVweDtib3JkZXItdG9wOjFweCBzb2xpZCAjZGJkYmRifS5tb2RhbC1jYXJkLWZvb3QgLmJ1dHRvbjpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1yaWdodDoxMHB4fS5tb2RhbC1jYXJkLWJvZHl7LXdlYmtpdC1vdmVyZmxvdy1zY3JvbGxpbmc6dG91Y2g7YmFja2dyb3VuZC1jb2xvcjojZmZmO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7b3ZlcmZsb3c6YXV0bztwYWRkaW5nOjIwcHh9Lm1vZGFse2JvdHRvbTowO2xlZnQ6MDtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO3RvcDowO2FsaWduLWl0ZW1zOmNlbnRlcjtkaXNwbGF5Om5vbmU7anVzdGlmeS1jb250ZW50OmNlbnRlcjtvdmVyZmxvdzpoaWRkZW47cG9zaXRpb246Zml4ZWQ7ei1pbmRleDoxOTg2fS5tb2RhbC5pcy1hY3RpdmV7ZGlzcGxheTpmbGV4fS5uYXYtdG9nZ2xle2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjMuNXJlbTtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDozLjVyZW19Lm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiM0YTRhNGE7ZGlzcGxheTpibG9jaztoZWlnaHQ6MXB4O2xlZnQ6NTAlO21hcmdpbi1sZWZ0Oi03cHg7cG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTt0cmFuc2l0aW9uOm5vbmUgODZtcyBlYXNlLW91dDt0cmFuc2l0aW9uLXByb3BlcnR5OmJhY2tncm91bmQsIGxlZnQsIG9wYWNpdHksIHRyYW5zZm9ybTt3aWR0aDoxNXB4fS5uYXYtdG9nZ2xlIHNwYW46bnRoLWNoaWxkKDEpe21hcmdpbi10b3A6LTZweH0ubmF2LXRvZ2dsZSBzcGFuOm50aC1jaGlsZCgyKXttYXJnaW4tdG9wOi0xcHh9Lm5hdi10b2dnbGUgc3BhbjpudGgtY2hpbGQoMyl7bWFyZ2luLXRvcDo0cHh9Lm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzE4MmI3M30ubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbjpudGgtY2hpbGQoMSl7bWFyZ2luLWxlZnQ6LTVweDt0cmFuc2Zvcm06cm90YXRlKDQ1ZGVnKTt0cmFuc2Zvcm0tb3JpZ2luOmxlZnQgdG9wfS5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFuOm50aC1jaGlsZCgyKXtvcGFjaXR5OjB9Lm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW46bnRoLWNoaWxkKDMpe21hcmdpbi1sZWZ0Oi01cHg7dHJhbnNmb3JtOnJvdGF0ZSgtNDVkZWcpO3RyYW5zZm9ybS1vcmlnaW46bGVmdCBib3R0b219QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5uYXYtdG9nZ2xle2Rpc3BsYXk6bm9uZX19Lm5hdi1pdGVte2FsaWduLWl0ZW1zOmNlbnRlcjtkaXNwbGF5OmZsZXg7ZmxleC1ncm93OjA7ZmxleC1zaHJpbms6MDtmb250LXNpemU6MXJlbTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmc6MC41cmVtIDAuNzVyZW19Lm5hdi1pdGVtIGF7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0ubmF2LWl0ZW0gaW1ne21heC1oZWlnaHQ6MS43NXJlbX0ubmF2LWl0ZW0gLmJ1dHRvbisuYnV0dG9ue21hcmdpbi1sZWZ0OjAuNzVyZW19Lm5hdi1pdGVtIC50YWc6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6MC41cmVtfS5uYXYtaXRlbSAudGFnOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6MC41cmVtfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsubmF2LWl0ZW17anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9fS5uYXYtaXRlbSBhLGEubmF2LWl0ZW17Y29sb3I6IzdhN2E3YX0ubmF2LWl0ZW0gYTpob3ZlcixhLm5hdi1pdGVtOmhvdmVye2NvbG9yOiMzNjM2MzZ9Lm5hdi1pdGVtIGEuaXMtYWN0aXZlLGEubmF2LWl0ZW0uaXMtYWN0aXZle2NvbG9yOiMzNjM2MzZ9Lm5hdi1pdGVtIGEuaXMtdGFiLGEubmF2LWl0ZW0uaXMtdGFie2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHRyYW5zcGFyZW50O2JvcmRlci10b3A6MXB4IHNvbGlkIHRyYW5zcGFyZW50O3BhZGRpbmctYm90dG9tOmNhbGMoMC41cmVtIC0gMXB4KTtwYWRkaW5nLWxlZnQ6MXJlbTtwYWRkaW5nLXJpZ2h0OjFyZW07cGFkZGluZy10b3A6Y2FsYygwLjVyZW0gLSAxcHgpfS5uYXYtaXRlbSBhLmlzLXRhYjpob3ZlcixhLm5hdi1pdGVtLmlzLXRhYjpob3Zlcntib3JkZXItYm90dG9tLWNvbG9yOiMxODJiNzM7Ym9yZGVyLXRvcC1jb2xvcjp0cmFuc3BhcmVudH0ubmF2LWl0ZW0gYS5pcy10YWIuaXMtYWN0aXZlLGEubmF2LWl0ZW0uaXMtdGFiLmlzLWFjdGl2ZXtib3JkZXItYm90dG9tOjNweCBzb2xpZCAjMTgyYjczO2NvbG9yOiMxODJiNzM7cGFkZGluZy1ib3R0b206Y2FsYygwLjVyZW0gLSAzcHgpfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7Lm5hdi1pdGVtIGEuaXMtYnJhbmQsYS5uYXYtaXRlbS5pcy1icmFuZHtwYWRkaW5nLWxlZnQ6MH19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym94LXNoYWRvdzowIDRweCA3cHggcmdiYSgxMCwxMCwxMCwwLjEpO2xlZnQ6MDtkaXNwbGF5Om5vbmU7cmlnaHQ6MDt0b3A6MTAwJTtwb3NpdGlvbjphYnNvbHV0ZX0ubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3A6MXB4IHNvbGlkIHJnYmEoMjE5LDIxOSwyMTksMC41KTtwYWRkaW5nOjAuNzVyZW19Lm5hdi1tZW51LmlzLWFjdGl2ZXtkaXNwbGF5OmJsb2NrfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsubmF2LW1lbnV7cGFkZGluZy1yaWdodDoxLjVyZW19fS5uYXYtbGVmdCwubmF2LXJpZ2h0e2FsaWduLWl0ZW1zOnN0cmV0Y2g7ZmxleC1iYXNpczowO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjB9Lm5hdi1sZWZ0e2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtvdmVyZmxvdzpoaWRkZW47b3ZlcmZsb3cteDphdXRvO3doaXRlLXNwYWNlOm5vd3JhcH0ubmF2LWNlbnRlcnthbGlnbi1pdGVtczpzdHJldGNoO2Rpc3BsYXk6ZmxleDtmbGV4LWdyb3c6MDtmbGV4LXNocmluazowO2p1c3RpZnktY29udGVudDpjZW50ZXI7bWFyZ2luLWxlZnQ6YXV0bzttYXJnaW4tcmlnaHQ6YXV0b30ubmF2LXJpZ2h0e2p1c3RpZnktY29udGVudDpmbGV4LWVuZH1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7Lm5hdi1yaWdodHtkaXNwbGF5OmZsZXh9fS5uYXZ7YWxpZ24taXRlbXM6c3RyZXRjaDtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7ZGlzcGxheTpmbGV4O21pbi1oZWlnaHQ6My41cmVtO3Bvc2l0aW9uOnJlbGF0aXZlO3RleHQtYWxpZ246Y2VudGVyO3otaW5kZXg6Mn0ubmF2Pi5jb250YWluZXJ7YWxpZ24taXRlbXM6c3RyZXRjaDtkaXNwbGF5OmZsZXg7bWluLWhlaWdodDozLjVyZW07d2lkdGg6MTAwJX0ubmF2Lmhhcy1zaGFkb3d7Ym94LXNoYWRvdzowIDJweCAzcHggcmdiYSgxMCwxMCwxMCwwLjEpfS5wYWdpbmF0aW9uLC5wYWdpbmF0aW9uLWxpc3R7YWxpZ24taXRlbXM6Y2VudGVyO2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3RleHQtYWxpZ246Y2VudGVyfS5wYWdpbmF0aW9uLXByZXZpb3VzLC5wYWdpbmF0aW9uLW5leHQsLnBhZ2luYXRpb24tbGluaywucGFnaW5hdGlvbi1lbGxpcHNpc3stbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTthbGlnbi1pdGVtczpjZW50ZXI7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czozcHg7Ym94LXNoYWRvdzpub25lO2Rpc3BsYXk6aW5saW5lLWZsZXg7Zm9udC1zaXplOjFyZW07aGVpZ2h0OjIuMjg1ZW07anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7bGluZS1oZWlnaHQ6MS41O3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW07cG9zaXRpb246cmVsYXRpdmU7dmVydGljYWwtYWxpZ246dG9wOy13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZTtmb250LXNpemU6MC44NzVyZW07cGFkZGluZy1sZWZ0OjAuNWVtO3BhZGRpbmctcmlnaHQ6MC41ZW07anVzdGlmeS1jb250ZW50OmNlbnRlcjt0ZXh0LWFsaWduOmNlbnRlcn0ucGFnaW5hdGlvbi1wcmV2aW91czpmb2N1cywucGFnaW5hdGlvbi1wcmV2aW91cy5pcy1mb2N1c2VkLC5wYWdpbmF0aW9uLXByZXZpb3VzOmFjdGl2ZSwucGFnaW5hdGlvbi1wcmV2aW91cy5pcy1hY3RpdmUsLnBhZ2luYXRpb24tbmV4dDpmb2N1cywucGFnaW5hdGlvbi1uZXh0LmlzLWZvY3VzZWQsLnBhZ2luYXRpb24tbmV4dDphY3RpdmUsLnBhZ2luYXRpb24tbmV4dC5pcy1hY3RpdmUsLnBhZ2luYXRpb24tbGluazpmb2N1cywucGFnaW5hdGlvbi1saW5rLmlzLWZvY3VzZWQsLnBhZ2luYXRpb24tbGluazphY3RpdmUsLnBhZ2luYXRpb24tbGluay5pcy1hY3RpdmUsLnBhZ2luYXRpb24tZWxsaXBzaXM6Zm9jdXMsLnBhZ2luYXRpb24tZWxsaXBzaXMuaXMtZm9jdXNlZCwucGFnaW5hdGlvbi1lbGxpcHNpczphY3RpdmUsLnBhZ2luYXRpb24tZWxsaXBzaXMuaXMtYWN0aXZle291dGxpbmU6bm9uZX0ucGFnaW5hdGlvbi1wcmV2aW91c1tkaXNhYmxlZF0sLnBhZ2luYXRpb24tcHJldmlvdXMuaXMtZGlzYWJsZWQsLnBhZ2luYXRpb24tbmV4dFtkaXNhYmxlZF0sLnBhZ2luYXRpb24tbmV4dC5pcy1kaXNhYmxlZCwucGFnaW5hdGlvbi1saW5rW2Rpc2FibGVkXSwucGFnaW5hdGlvbi1saW5rLmlzLWRpc2FibGVkLC5wYWdpbmF0aW9uLWVsbGlwc2lzW2Rpc2FibGVkXSwucGFnaW5hdGlvbi1lbGxpcHNpcy5pcy1kaXNhYmxlZHtwb2ludGVyLWV2ZW50czpub25lfS5wYWdpbmF0aW9uLXByZXZpb3VzLC5wYWdpbmF0aW9uLW5leHQsLnBhZ2luYXRpb24tbGlua3tib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7bWluLXdpZHRoOjIuNWVtfS5wYWdpbmF0aW9uLXByZXZpb3VzOmhvdmVyLC5wYWdpbmF0aW9uLW5leHQ6aG92ZXIsLnBhZ2luYXRpb24tbGluazpob3Zlcntib3JkZXItY29sb3I6I2I1YjViNTtjb2xvcjojMzYzNjM2fS5wYWdpbmF0aW9uLXByZXZpb3VzOmZvY3VzLC5wYWdpbmF0aW9uLW5leHQ6Zm9jdXMsLnBhZ2luYXRpb24tbGluazpmb2N1c3tib3JkZXItY29sb3I6IzE4MmI3M30ucGFnaW5hdGlvbi1wcmV2aW91czphY3RpdmUsLnBhZ2luYXRpb24tbmV4dDphY3RpdmUsLnBhZ2luYXRpb24tbGluazphY3RpdmV7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpfS5wYWdpbmF0aW9uLXByZXZpb3VzW2Rpc2FibGVkXSwucGFnaW5hdGlvbi1wcmV2aW91cy5pcy1kaXNhYmxlZCwucGFnaW5hdGlvbi1uZXh0W2Rpc2FibGVkXSwucGFnaW5hdGlvbi1uZXh0LmlzLWRpc2FibGVkLC5wYWdpbmF0aW9uLWxpbmtbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLWxpbmsuaXMtZGlzYWJsZWR7YmFja2dyb3VuZDojZGJkYmRiO2NvbG9yOiM3YTdhN2E7b3BhY2l0eTowLjU7cG9pbnRlci1ldmVudHM6bm9uZX0ucGFnaW5hdGlvbi1wcmV2aW91cywucGFnaW5hdGlvbi1uZXh0e3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW19LnBhZ2luYXRpb24tbGluay5pcy1jdXJyZW50e2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztib3JkZXItY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmfS5wYWdpbmF0aW9uLWVsbGlwc2lze2NvbG9yOiNiNWI1YjU7cG9pbnRlci1ldmVudHM6bm9uZX0ucGFnaW5hdGlvbi1saXN0IGxpOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1sZWZ0OjAuMzc1cmVtfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsucGFnaW5hdGlvbntmbGV4LXdyYXA6d3JhcH0ucGFnaW5hdGlvbi1wcmV2aW91cywucGFnaW5hdGlvbi1uZXh0e2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7d2lkdGg6Y2FsYyg1MCUgLSAwLjM3NXJlbSl9LnBhZ2luYXRpb24tbmV4dHttYXJnaW4tbGVmdDowLjc1cmVtfS5wYWdpbmF0aW9uLWxpc3R7bWFyZ2luLXRvcDowLjc1cmVtfS5wYWdpbmF0aW9uLWxpc3QgbGl7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5wYWdpbmF0aW9uLWxpc3R7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtvcmRlcjoxfS5wYWdpbmF0aW9uLXByZXZpb3VzLC5wYWdpbmF0aW9uLW5leHR7bWFyZ2luLWxlZnQ6MC43NXJlbX0ucGFnaW5hdGlvbi1wcmV2aW91c3tvcmRlcjoyfS5wYWdpbmF0aW9uLW5leHR7b3JkZXI6M30ucGFnaW5hdGlvbntqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbn0ucGFnaW5hdGlvbi5pcy1jZW50ZXJlZCAucGFnaW5hdGlvbi1wcmV2aW91c3ttYXJnaW4tbGVmdDowO29yZGVyOjF9LnBhZ2luYXRpb24uaXMtY2VudGVyZWQgLnBhZ2luYXRpb24tbGlzdHtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO29yZGVyOjJ9LnBhZ2luYXRpb24uaXMtY2VudGVyZWQgLnBhZ2luYXRpb24tbmV4dHtvcmRlcjozfS5wYWdpbmF0aW9uLmlzLXJpZ2h0IC5wYWdpbmF0aW9uLXByZXZpb3Vze21hcmdpbi1sZWZ0OjA7b3JkZXI6MX0ucGFnaW5hdGlvbi5pcy1yaWdodCAucGFnaW5hdGlvbi1uZXh0e29yZGVyOjI7bWFyZ2luLXJpZ2h0OjAuNzVyZW19LnBhZ2luYXRpb24uaXMtcmlnaHQgLnBhZ2luYXRpb24tbGlzdHtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmQ7b3JkZXI6M319LnBhbmVse2ZvbnQtc2l6ZToxcmVtfS5wYW5lbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5wYW5lbC1oZWFkaW5nLC5wYW5lbC10YWJzLC5wYW5lbC1ibG9ja3tib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci1sZWZ0OjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci1yaWdodDoxcHggc29saWQgI2RiZGJkYn0ucGFuZWwtaGVhZGluZzpmaXJzdC1jaGlsZCwucGFuZWwtdGFiczpmaXJzdC1jaGlsZCwucGFuZWwtYmxvY2s6Zmlyc3QtY2hpbGR7Ym9yZGVyLXRvcDoxcHggc29saWQgI2RiZGJkYn0ucGFuZWwtaGVhZGluZ3tiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLXJhZGl1czozcHggM3B4IDAgMDtjb2xvcjojMzYzNjM2O2ZvbnQtc2l6ZToxLjI1ZW07Zm9udC13ZWlnaHQ6MzAwO2xpbmUtaGVpZ2h0OjEuMjU7cGFkZGluZzowLjVlbSAwLjc1ZW19LnBhbmVsLXRhYnN7YWxpZ24taXRlbXM6ZmxleC1lbmQ7ZGlzcGxheTpmbGV4O2ZvbnQtc2l6ZTowLjg3NWVtO2p1c3RpZnktY29udGVudDpjZW50ZXJ9LnBhbmVsLXRhYnMgYXtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZGJkYmRiO21hcmdpbi1ib3R0b206LTFweDtwYWRkaW5nOjAuNWVtfS5wYW5lbC10YWJzIGEuaXMtYWN0aXZle2JvcmRlci1ib3R0b20tY29sb3I6IzRhNGE0YTtjb2xvcjojMzYzNjM2fS5wYW5lbC1saXN0IGF7Y29sb3I6IzRhNGE0YX0ucGFuZWwtbGlzdCBhOmhvdmVye2NvbG9yOiMxODJiNzN9LnBhbmVsLWJsb2Nre2FsaWduLWl0ZW1zOmNlbnRlcjtjb2xvcjojMzYzNjM2O2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtwYWRkaW5nOjAuNWVtIDAuNzVlbX0ucGFuZWwtYmxvY2sgaW5wdXRbdHlwZT1cXFwiY2hlY2tib3hcXFwiXXttYXJnaW4tcmlnaHQ6MC43NWVtfS5wYW5lbC1ibG9jaz4uY29udHJvbHtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO3dpZHRoOjEwMCV9LnBhbmVsLWJsb2NrLmlzLWFjdGl2ZXtib3JkZXItbGVmdC1jb2xvcjojMTgyYjczO2NvbG9yOiMzNjM2MzZ9LnBhbmVsLWJsb2NrLmlzLWFjdGl2ZSAucGFuZWwtaWNvbntjb2xvcjojMTgyYjczfWEucGFuZWwtYmxvY2ssbGFiZWwucGFuZWwtYmxvY2t7Y3Vyc29yOnBvaW50ZXJ9YS5wYW5lbC1ibG9jazpob3ZlcixsYWJlbC5wYW5lbC1ibG9jazpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9LnBhbmVsLWljb257ZGlzcGxheTppbmxpbmUtYmxvY2s7Zm9udC1zaXplOjE0cHg7aGVpZ2h0OjFlbTtsaW5lLWhlaWdodDoxZW07dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjFlbTtjb2xvcjojN2E3YTdhO21hcmdpbi1yaWdodDowLjc1ZW19LnBhbmVsLWljb24gLmZhe2ZvbnQtc2l6ZTppbmhlcml0O2xpbmUtaGVpZ2h0OmluaGVyaXR9LnRhYnN7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lO2FsaWduLWl0ZW1zOnN0cmV0Y2g7ZGlzcGxheTpmbGV4O2ZvbnQtc2l6ZToxcmVtO2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO292ZXJmbG93OmhpZGRlbjtvdmVyZmxvdy14OmF1dG87d2hpdGUtc3BhY2U6bm93cmFwfS50YWJzOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LnRhYnMgYXthbGlnbi1pdGVtczpjZW50ZXI7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2RiZGJkYjtjb2xvcjojNGE0YTRhO2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO21hcmdpbi1ib3R0b206LTFweDtwYWRkaW5nOjAuNWVtIDFlbTt2ZXJ0aWNhbC1hbGlnbjp0b3B9LnRhYnMgYTpob3Zlcntib3JkZXItYm90dG9tLWNvbG9yOiMzNjM2MzY7Y29sb3I6IzM2MzYzNn0udGFicyBsaXtkaXNwbGF5OmJsb2NrfS50YWJzIGxpLmlzLWFjdGl2ZSBhe2JvcmRlci1ib3R0b20tY29sb3I6IzE4MmI3Mztjb2xvcjojMTgyYjczfS50YWJzIHVse2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZGJkYmRiO2Rpc3BsYXk6ZmxleDtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0fS50YWJzIHVsLmlzLWxlZnR7cGFkZGluZy1yaWdodDowLjc1ZW19LnRhYnMgdWwuaXMtY2VudGVye2ZsZXg6bm9uZTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW19LnRhYnMgdWwuaXMtcmlnaHR7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kO3BhZGRpbmctbGVmdDowLjc1ZW19LnRhYnMgLmljb246Zmlyc3QtY2hpbGR7bWFyZ2luLXJpZ2h0OjAuNWVtfS50YWJzIC5pY29uOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6MC41ZW19LnRhYnMuaXMtY2VudGVyZWQgdWx7anVzdGlmeS1jb250ZW50OmNlbnRlcn0udGFicy5pcy1yaWdodCB1bHtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmR9LnRhYnMuaXMtYm94ZWQgYXtib3JkZXI6MXB4IHNvbGlkIHRyYW5zcGFyZW50O2JvcmRlci1yYWRpdXM6M3B4IDNweCAwIDB9LnRhYnMuaXMtYm94ZWQgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWJvdHRvbS1jb2xvcjojZGJkYmRifS50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhe2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2RiZGJkYjtib3JkZXItYm90dG9tLWNvbG9yOnRyYW5zcGFyZW50ICFpbXBvcnRhbnR9LnRhYnMuaXMtZnVsbHdpZHRoIGxpe2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjB9LnRhYnMuaXMtdG9nZ2xlIGF7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO21hcmdpbi1ib3R0b206MDtwb3NpdGlvbjpyZWxhdGl2ZX0udGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOiNiNWI1YjU7ei1pbmRleDoyfS50YWJzLmlzLXRvZ2dsZSBsaStsaXttYXJnaW4tbGVmdDotMXB4fS50YWJzLmlzLXRvZ2dsZSBsaTpmaXJzdC1jaGlsZCBhe2JvcmRlci1yYWRpdXM6M3B4IDAgMCAzcHh9LnRhYnMuaXMtdG9nZ2xlIGxpOmxhc3QtY2hpbGQgYXtib3JkZXItcmFkaXVzOjAgM3B4IDNweCAwfS50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Ym9yZGVyLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZjt6LWluZGV4OjF9LnRhYnMuaXMtdG9nZ2xlIHVse2JvcmRlci1ib3R0b206bm9uZX0udGFicy5pcy1zbWFsbHtmb250LXNpemU6Ljc1cmVtfS50YWJzLmlzLW1lZGl1bXtmb250LXNpemU6MS4yNXJlbX0udGFicy5pcy1sYXJnZXtmb250LXNpemU6MS41cmVtfS5jb2x1bW57ZGlzcGxheTpibG9jaztmbGV4LWJhc2lzOjA7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MTtwYWRkaW5nOjAuNzVyZW19LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtbmFycm93e2ZsZXg6bm9uZX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1mdWxse2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLXRocmVlLXF1YXJ0ZXJze2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtdHdvLXRoaXJkc3tmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtaGFsZntmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9uZS10aGlyZHtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb25lLXF1YXJ0ZXJ7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtdGhyZWUtcXVhcnRlcnN7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC10d28tdGhpcmRze21hcmdpbi1sZWZ0OjY2LjY2NjYlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC1oYWxme21hcmdpbi1sZWZ0OjUwJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtb25lLXRoaXJke21hcmdpbi1sZWZ0OjMzLjMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC1vbmUtcXVhcnRlcnttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtMXtmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTF7bWFyZ2luLWxlZnQ6OC4zMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtMntmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC0ye21hcmdpbi1sZWZ0OjE2LjY2NjY3JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0ze2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTN7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTR7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtNHttYXJnaW4tbGVmdDozMy4zMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtNXtmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC01e21hcmdpbi1sZWZ0OjQxLjY2NjY3JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy02e2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTZ7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTd7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtN3ttYXJnaW4tbGVmdDo1OC4zMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtOHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC04e21hcmdpbi1sZWZ0OjY2LjY2NjY3JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy05e2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTl7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTEwe2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTEwe21hcmdpbi1sZWZ0OjgzLjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0xMXtmbGV4Om5vbmU7d2lkdGg6OTEuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC0xMXttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtMTJ7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTEye21hcmdpbi1sZWZ0OjEwMCV9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5jb2x1bW4uaXMtbmFycm93LW1vYmlsZXtmbGV4Om5vbmV9LmNvbHVtbi5pcy1mdWxsLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLXRocmVlLXF1YXJ0ZXJzLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtdHdvLXRoaXJkcy1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjY2LjY2NjYlfS5jb2x1bW4uaXMtaGFsZi1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9uZS10aGlyZC1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMlfS5jb2x1bW4uaXMtb25lLXF1YXJ0ZXItbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtdGhyZWUtcXVhcnRlcnMtbW9iaWxle21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLW9mZnNldC10d28tdGhpcmRzLW1vYmlsZXttYXJnaW4tbGVmdDo2Ni42NjY2JX0uY29sdW1uLmlzLW9mZnNldC1oYWxmLW1vYmlsZXttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXRoaXJkLW1vYmlsZXttYXJnaW4tbGVmdDozMy4zMzMzJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtcXVhcnRlci1tb2JpbGV7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtMS1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjguMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEtbW9iaWxle21hcmdpbi1sZWZ0OjguMzMzMzMlfS5jb2x1bW4uaXMtMi1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjE2LjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC0yLW1vYmlsZXttYXJnaW4tbGVmdDoxNi42NjY2NyV9LmNvbHVtbi5pcy0zLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LTMtbW9iaWxle21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTQtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNC1tb2JpbGV7bWFyZ2luLWxlZnQ6MzMuMzMzMzMlfS5jb2x1bW4uaXMtNS1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjQxLjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC01LW1vYmlsZXttYXJnaW4tbGVmdDo0MS42NjY2NyV9LmNvbHVtbi5pcy02LW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LTYtbW9iaWxle21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLTctbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo1OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNy1tb2JpbGV7bWFyZ2luLWxlZnQ6NTguMzMzMzMlfS5jb2x1bW4uaXMtOC1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjY2LjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC04LW1vYmlsZXttYXJnaW4tbGVmdDo2Ni42NjY2NyV9LmNvbHVtbi5pcy05LW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LTktbW9iaWxle21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLTEwLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6ODMuMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEwLW1vYmlsZXttYXJnaW4tbGVmdDo4My4zMzMzMyV9LmNvbHVtbi5pcy0xMS1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjkxLjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC0xMS1tb2JpbGV7bWFyZ2luLWxlZnQ6OTEuNjY2NjclfS5jb2x1bW4uaXMtMTItbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtb2Zmc2V0LTEyLW1vYmlsZXttYXJnaW4tbGVmdDoxMDAlfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmNvbHVtbi5pcy1uYXJyb3csLmNvbHVtbi5pcy1uYXJyb3ctdGFibGV0e2ZsZXg6bm9uZX0uY29sdW1uLmlzLWZ1bGwsLmNvbHVtbi5pcy1mdWxsLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLXRocmVlLXF1YXJ0ZXJzLC5jb2x1bW4uaXMtdGhyZWUtcXVhcnRlcnMtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy10d28tdGhpcmRzLC5jb2x1bW4uaXMtdHdvLXRoaXJkcy10YWJsZXR7ZmxleDpub25lO3dpZHRoOjY2LjY2NjYlfS5jb2x1bW4uaXMtaGFsZiwuY29sdW1uLmlzLWhhbGYtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vbmUtdGhpcmQsLmNvbHVtbi5pcy1vbmUtdGhpcmQtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzJX0uY29sdW1uLmlzLW9uZS1xdWFydGVyLC5jb2x1bW4uaXMtb25lLXF1YXJ0ZXItdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtdGhyZWUtcXVhcnRlcnMsLmNvbHVtbi5pcy1vZmZzZXQtdGhyZWUtcXVhcnRlcnMtdGFibGV0e21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLW9mZnNldC10d28tdGhpcmRzLC5jb2x1bW4uaXMtb2Zmc2V0LXR3by10aGlyZHMtdGFibGV0e21hcmdpbi1sZWZ0OjY2LjY2NjYlfS5jb2x1bW4uaXMtb2Zmc2V0LWhhbGYsLmNvbHVtbi5pcy1vZmZzZXQtaGFsZi10YWJsZXR7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LW9uZS10aGlyZCwuY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmQtdGFibGV0e21hcmdpbi1sZWZ0OjMzLjMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LW9uZS1xdWFydGVyLC5jb2x1bW4uaXMtb2Zmc2V0LW9uZS1xdWFydGVyLXRhYmxldHttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy0xLC5jb2x1bW4uaXMtMS10YWJsZXR7ZmxleDpub25lO3dpZHRoOjguMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEsLmNvbHVtbi5pcy1vZmZzZXQtMS10YWJsZXR7bWFyZ2luLWxlZnQ6OC4zMzMzMyV9LmNvbHVtbi5pcy0yLC5jb2x1bW4uaXMtMi10YWJsZXR7ZmxleDpub25lO3dpZHRoOjE2LjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC0yLC5jb2x1bW4uaXMtb2Zmc2V0LTItdGFibGV0e21hcmdpbi1sZWZ0OjE2LjY2NjY3JX0uY29sdW1uLmlzLTMsLmNvbHVtbi5pcy0zLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LTMsLmNvbHVtbi5pcy1vZmZzZXQtMy10YWJsZXR7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtNCwuY29sdW1uLmlzLTQtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNCwuY29sdW1uLmlzLW9mZnNldC00LXRhYmxldHttYXJnaW4tbGVmdDozMy4zMzMzMyV9LmNvbHVtbi5pcy01LC5jb2x1bW4uaXMtNS10YWJsZXR7ZmxleDpub25lO3dpZHRoOjQxLjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC01LC5jb2x1bW4uaXMtb2Zmc2V0LTUtdGFibGV0e21hcmdpbi1sZWZ0OjQxLjY2NjY3JX0uY29sdW1uLmlzLTYsLmNvbHVtbi5pcy02LXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LTYsLmNvbHVtbi5pcy1vZmZzZXQtNi10YWJsZXR7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtNywuY29sdW1uLmlzLTctdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo1OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNywuY29sdW1uLmlzLW9mZnNldC03LXRhYmxldHttYXJnaW4tbGVmdDo1OC4zMzMzMyV9LmNvbHVtbi5pcy04LC5jb2x1bW4uaXMtOC10YWJsZXR7ZmxleDpub25lO3dpZHRoOjY2LjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC04LC5jb2x1bW4uaXMtb2Zmc2V0LTgtdGFibGV0e21hcmdpbi1sZWZ0OjY2LjY2NjY3JX0uY29sdW1uLmlzLTksLmNvbHVtbi5pcy05LXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LTksLmNvbHVtbi5pcy1vZmZzZXQtOS10YWJsZXR7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtMTAsLmNvbHVtbi5pcy0xMC10YWJsZXR7ZmxleDpub25lO3dpZHRoOjgzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC0xMCwuY29sdW1uLmlzLW9mZnNldC0xMC10YWJsZXR7bWFyZ2luLWxlZnQ6ODMuMzMzMzMlfS5jb2x1bW4uaXMtMTEsLmNvbHVtbi5pcy0xMS10YWJsZXR7ZmxleDpub25lO3dpZHRoOjkxLjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC0xMSwuY29sdW1uLmlzLW9mZnNldC0xMS10YWJsZXR7bWFyZ2luLWxlZnQ6OTEuNjY2NjclfS5jb2x1bW4uaXMtMTIsLmNvbHVtbi5pcy0xMi10YWJsZXR7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbi5pcy1vZmZzZXQtMTIsLmNvbHVtbi5pcy1vZmZzZXQtMTItdGFibGV0e21hcmdpbi1sZWZ0OjEwMCV9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmNvbHVtbi5pcy1uYXJyb3ctZGVza3RvcHtmbGV4Om5vbmV9LmNvbHVtbi5pcy1mdWxsLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbi5pcy10aHJlZS1xdWFydGVycy1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy10d28tdGhpcmRzLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjY2LjY2NjYlfS5jb2x1bW4uaXMtaGFsZi1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vbmUtdGhpcmQtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMyV9LmNvbHVtbi5pcy1vbmUtcXVhcnRlci1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtdGhyZWUtcXVhcnRlcnMtZGVza3RvcHttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtdHdvLXRoaXJkcy1kZXNrdG9we21hcmdpbi1sZWZ0OjY2LjY2NjYlfS5jb2x1bW4uaXMtb2Zmc2V0LWhhbGYtZGVza3RvcHttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXRoaXJkLWRlc2t0b3B7bWFyZ2luLWxlZnQ6MzMuMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXF1YXJ0ZXItZGVza3RvcHttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy0xLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjguMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEtZGVza3RvcHttYXJnaW4tbGVmdDo4LjMzMzMzJX0uY29sdW1uLmlzLTItZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTItZGVza3RvcHttYXJnaW4tbGVmdDoxNi42NjY2NyV9LmNvbHVtbi5pcy0zLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC0zLWRlc2t0b3B7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtNC1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNC1kZXNrdG9we21hcmdpbi1sZWZ0OjMzLjMzMzMzJX0uY29sdW1uLmlzLTUtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTUtZGVza3RvcHttYXJnaW4tbGVmdDo0MS42NjY2NyV9LmNvbHVtbi5pcy02LWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9mZnNldC02LWRlc2t0b3B7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtNy1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo1OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNy1kZXNrdG9we21hcmdpbi1sZWZ0OjU4LjMzMzMzJX0uY29sdW1uLmlzLTgtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTgtZGVza3RvcHttYXJnaW4tbGVmdDo2Ni42NjY2NyV9LmNvbHVtbi5pcy05LWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLW9mZnNldC05LWRlc2t0b3B7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtMTAtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6ODMuMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEwLWRlc2t0b3B7bWFyZ2luLWxlZnQ6ODMuMzMzMzMlfS5jb2x1bW4uaXMtMTEtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6OTEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTExLWRlc2t0b3B7bWFyZ2luLWxlZnQ6OTEuNjY2NjclfS5jb2x1bW4uaXMtMTItZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLW9mZnNldC0xMi1kZXNrdG9we21hcmdpbi1sZWZ0OjEwMCV9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmNvbHVtbi5pcy1uYXJyb3ctd2lkZXNjcmVlbntmbGV4Om5vbmV9LmNvbHVtbi5pcy1mdWxsLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbi5pcy10aHJlZS1xdWFydGVycy13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy10d28tdGhpcmRzLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjY2LjY2NjYlfS5jb2x1bW4uaXMtaGFsZi13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vbmUtdGhpcmQtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMyV9LmNvbHVtbi5pcy1vbmUtcXVhcnRlci13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtdGhyZWUtcXVhcnRlcnMtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtdHdvLXRoaXJkcy13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjY2LjY2NjYlfS5jb2x1bW4uaXMtb2Zmc2V0LWhhbGYtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXRoaXJkLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6MzMuMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXF1YXJ0ZXItd2lkZXNjcmVlbnttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy0xLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjguMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo4LjMzMzMzJX0uY29sdW1uLmlzLTItd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTItd2lkZXNjcmVlbnttYXJnaW4tbGVmdDoxNi42NjY2NyV9LmNvbHVtbi5pcy0zLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC0zLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtNC13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNC13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjMzLjMzMzMzJX0uY29sdW1uLmlzLTUtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTUtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo0MS42NjY2NyV9LmNvbHVtbi5pcy02LXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9mZnNldC02LXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtNy13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo1OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNy13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjU4LjMzMzMzJX0uY29sdW1uLmlzLTgtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTgtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo2Ni42NjY2NyV9LmNvbHVtbi5pcy05LXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLW9mZnNldC05LXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtMTAtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6ODMuMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEwLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6ODMuMzMzMzMlfS5jb2x1bW4uaXMtMTEtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6OTEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTExLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6OTEuNjY2NjclfS5jb2x1bW4uaXMtMTItd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLW9mZnNldC0xMi13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjEwMCV9fS5jb2x1bW5ze21hcmdpbi1sZWZ0Oi0wLjc1cmVtO21hcmdpbi1yaWdodDotMC43NXJlbTttYXJnaW4tdG9wOi0wLjc1cmVtfS5jb2x1bW5zOmxhc3QtY2hpbGR7bWFyZ2luLWJvdHRvbTotMC43NXJlbX0uY29sdW1uczpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX0uY29sdW1ucy5pcy1jZW50ZXJlZHtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5jb2x1bW5zLmlzLWdhcGxlc3N7bWFyZ2luLWxlZnQ6MDttYXJnaW4tcmlnaHQ6MDttYXJnaW4tdG9wOjB9LmNvbHVtbnMuaXMtZ2FwbGVzczpsYXN0LWNoaWxke21hcmdpbi1ib3R0b206MH0uY29sdW1ucy5pcy1nYXBsZXNzOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LmNvbHVtbnMuaXMtZ2FwbGVzcz4uY29sdW1ue21hcmdpbjowO3BhZGRpbmc6MH1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmNvbHVtbnMuaXMtZ3JpZHtmbGV4LXdyYXA6d3JhcH0uY29sdW1ucy5pcy1ncmlkPi5jb2x1bW57bWF4LXdpZHRoOjMzLjMzMzMlO3BhZGRpbmc6MC43NXJlbTt3aWR0aDozMy4zMzMzJX0uY29sdW1ucy5pcy1ncmlkPi5jb2x1bW4rLmNvbHVtbnttYXJnaW4tbGVmdDowfX0uY29sdW1ucy5pcy1tb2JpbGV7ZGlzcGxheTpmbGV4fS5jb2x1bW5zLmlzLW11bHRpbGluZXtmbGV4LXdyYXA6d3JhcH0uY29sdW1ucy5pcy12Y2VudGVyZWR7YWxpZ24taXRlbXM6Y2VudGVyfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuY29sdW1uczpub3QoLmlzLWRlc2t0b3Ape2Rpc3BsYXk6ZmxleH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuY29sdW1ucy5pcy1kZXNrdG9we2Rpc3BsYXk6ZmxleH19LnRpbGV7YWxpZ24taXRlbXM6c3RyZXRjaDtkaXNwbGF5OmJsb2NrO2ZsZXgtYmFzaXM6MDtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO21pbi1oZWlnaHQ6bWluLWNvbnRlbnR9LnRpbGUuaXMtYW5jZXN0b3J7bWFyZ2luLWxlZnQ6LTAuNzVyZW07bWFyZ2luLXJpZ2h0Oi0wLjc1cmVtO21hcmdpbi10b3A6LTAuNzVyZW19LnRpbGUuaXMtYW5jZXN0b3I6bGFzdC1jaGlsZHttYXJnaW4tYm90dG9tOi0wLjc1cmVtfS50aWxlLmlzLWFuY2VzdG9yOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfS50aWxlLmlzLWNoaWxke21hcmdpbjowICFpbXBvcnRhbnR9LnRpbGUuaXMtcGFyZW50e3BhZGRpbmc6MC43NXJlbX0udGlsZS5pcy12ZXJ0aWNhbHtmbGV4LWRpcmVjdGlvbjpjb2x1bW59LnRpbGUuaXMtdmVydGljYWw+LnRpbGUuaXMtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbSAhaW1wb3J0YW50fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsudGlsZTpub3QoLmlzLWNoaWxkKXtkaXNwbGF5OmZsZXh9LnRpbGUuaXMtMXtmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LnRpbGUuaXMtMntmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS50aWxlLmlzLTN7ZmxleDpub25lO3dpZHRoOjI1JX0udGlsZS5pcy00e2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzMyV9LnRpbGUuaXMtNXtmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS50aWxlLmlzLTZ7ZmxleDpub25lO3dpZHRoOjUwJX0udGlsZS5pcy03e2ZsZXg6bm9uZTt3aWR0aDo1OC4zMzMzMyV9LnRpbGUuaXMtOHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS50aWxlLmlzLTl7ZmxleDpub25lO3dpZHRoOjc1JX0udGlsZS5pcy0xMHtmbGV4Om5vbmU7d2lkdGg6ODMuMzMzMzMlfS50aWxlLmlzLTExe2ZsZXg6bm9uZTt3aWR0aDo5MS42NjY2NyV9LnRpbGUuaXMtMTJ7ZmxleDpub25lO3dpZHRoOjEwMCV9fS5oZXJvLXZpZGVve2JvdHRvbTowO2xlZnQ6MDtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO3RvcDowO292ZXJmbG93OmhpZGRlbn0uaGVyby12aWRlbyB2aWRlb3tsZWZ0OjUwJTttaW4taGVpZ2h0OjEwMCU7bWluLXdpZHRoOjEwMCU7cG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTt0cmFuc2Zvcm06dHJhbnNsYXRlM2QoLTUwJSwgLTUwJSwgMCl9Lmhlcm8tdmlkZW8uaXMtdHJhbnNwYXJlbnR7b3BhY2l0eTowLjN9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLXZpZGVve2Rpc3BsYXk6bm9uZX19Lmhlcm8tYnV0dG9uc3ttYXJnaW4tdG9wOjEuNXJlbX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8tYnV0dG9ucyAuYnV0dG9ue2Rpc3BsYXk6ZmxleH0uaGVyby1idXR0b25zIC5idXR0b246bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNzVyZW19fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaGVyby1idXR0b25ze2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5oZXJvLWJ1dHRvbnMgLmJ1dHRvbjpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1yaWdodDoxLjVyZW19fS5oZXJvLWhlYWQsLmhlcm8tZm9vdHtmbGV4LWdyb3c6MDtmbGV4LXNocmluazowfS5oZXJvLWJvZHl7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MDtwYWRkaW5nOjNyZW0gMS41cmVtfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7Lmhlcm8tYm9keXtwYWRkaW5nLWxlZnQ6MDtwYWRkaW5nLXJpZ2h0OjB9fS5oZXJve2FsaWduLWl0ZW1zOnN0cmV0Y2g7YmFja2dyb3VuZC1jb2xvcjojZmZmO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW59Lmhlcm8gLm5hdntiYWNrZ3JvdW5kOm5vbmU7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjE5LDIxOSwyMTksMC4zKX0uaGVybyAudGFicyB1bHtib3JkZXItYm90dG9tOm5vbmV9Lmhlcm8uaXMtd2hpdGV7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtd2hpdGUgYSwuaGVyby5pcy13aGl0ZSBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy13aGl0ZSAudGl0bGV7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAuc3VidGl0bGV7Y29sb3I6cmdiYSgxMCwxMCwxMCwwLjkpfS5oZXJvLmlzLXdoaXRlIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLXdoaXRlIC5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDEwLDEwLDEwLDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXdoaXRlIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9fS5oZXJvLmlzLXdoaXRlIGEubmF2LWl0ZW0sLmhlcm8uaXMtd2hpdGUgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMTAsMTAsMTAsMC43KX0uaGVyby5pcy13aGl0ZSBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLXdoaXRlIGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLXdoaXRlIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy13aGl0ZSAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtd2hpdGUgLnRhYnMgYXtjb2xvcjojMGEwYTBhO29wYWNpdHk6MC45fS5oZXJvLmlzLXdoaXRlIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLXdoaXRlIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy13aGl0ZSAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtd2hpdGUgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy13aGl0ZSAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy13aGl0ZSAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy13aGl0ZSAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy13aGl0ZSAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtd2hpdGUgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtib3JkZXItY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5oZXJvLmlzLXdoaXRlLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjZTZlNmU2IDAlLCAjZmZmIDcxJSwgI2ZmZiAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtd2hpdGUgLm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtd2hpdGUgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtd2hpdGUgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhfS5oZXJvLmlzLXdoaXRlIC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMil9fS5oZXJvLmlzLWJsYWNre2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5oZXJvLmlzLWJsYWNrIGEsLmhlcm8uaXMtYmxhY2sgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtYmxhY2sgLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLnN1YnRpdGxle2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC45KX0uaGVyby5pcy1ibGFjayAuc3VidGl0bGUgYSwuaGVyby5pcy1ibGFjayAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1ibGFjayAubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhfX0uaGVyby5pcy1ibGFjayBhLm5hdi1pdGVtLC5oZXJvLmlzLWJsYWNrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuNyl9Lmhlcm8uaXMtYmxhY2sgYS5uYXYtaXRlbTpob3ZlciwuaGVyby5pcy1ibGFjayBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1ibGFjayAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtYmxhY2sgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pLmlzLWFjdGl2ZXtjb2xvcjojZmZmfS5oZXJvLmlzLWJsYWNrIC50YWJzIGF7Y29sb3I6I2ZmZjtvcGFjaXR5OjAuOX0uaGVyby5pcy1ibGFjayAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1ibGFjayAudGFicyBsaS5pcy1hY3RpdmUgYXtvcGFjaXR5OjF9Lmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1ibGFjayAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojZmZmfS5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLWJveGVkIGE6aG92ZXIsLmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsLmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy1ibGFjay5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgIzAwMCAwJSwgIzBhMGEwYSA3MSUsICMxODE2MTYgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWJsYWNrIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWJsYWNrIC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWJsYWNrIC5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1ibGFjayAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX0uaGVyby5pcy1saWdodHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0uaGVyby5pcy1saWdodCBhLC5oZXJvLmlzLWxpZ2h0IHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLWxpZ2h0IC50aXRsZXtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuOSl9Lmhlcm8uaXMtbGlnaHQgLnN1YnRpdGxlIGEsLmhlcm8uaXMtbGlnaHQgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoNTQsNTQsNTQsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtbGlnaHQgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX19Lmhlcm8uaXMtbGlnaHQgYS5uYXYtaXRlbSwuaGVyby5pcy1saWdodCAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbil7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjcpfS5oZXJvLmlzLWxpZ2h0IGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtbGlnaHQgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtbGlnaHQgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pOmhvdmVyLC5oZXJvLmlzLWxpZ2h0IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6IzM2MzYzNn0uaGVyby5pcy1saWdodCAudGFicyBhe2NvbG9yOiMzNjM2MzY7b3BhY2l0eTowLjl9Lmhlcm8uaXMtbGlnaHQgLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtbGlnaHQgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6IzM2MzYzNn0uaGVyby5pcy1saWdodCAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1saWdodCAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2JvcmRlci1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtbGlnaHQuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICNkZmQ4ZDggMCUsICNmNWY1ZjUgNzElLCAjZmZmIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1saWdodCAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzM2MzYzNn0uaGVyby5pcy1saWdodCAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1saWdodCAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzZ9Lmhlcm8uaXMtbGlnaHQgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoNTQsNTQsNTQsMC4yKX19Lmhlcm8uaXMtZGFya3tiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1kYXJrIGEsLmhlcm8uaXMtZGFyayBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1kYXJrIC50aXRsZXtjb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgLnN1YnRpdGxle2NvbG9yOnJnYmEoMjQ1LDI0NSwyNDUsMC45KX0uaGVyby5pcy1kYXJrIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLWRhcmsgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNDUsMjQ1LDI0NSwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1kYXJrIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzZ9fS5oZXJvLmlzLWRhcmsgYS5uYXYtaXRlbSwuaGVyby5pcy1kYXJrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDI0NSwyNDUsMjQ1LDAuNyl9Lmhlcm8uaXMtZGFyayBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLWRhcmsgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtZGFyayAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtZGFyayAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAudGFicyBhe2NvbG9yOiNmNWY1ZjU7b3BhY2l0eTowLjl9Lmhlcm8uaXMtZGFyayAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1kYXJrIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1kYXJrIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtZGFyayAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1kYXJrIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtZGFyayAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1kYXJrIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1kYXJrIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0uaGVyby5pcy1kYXJrLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMWYxOTE5IDAlLCAjMzYzNjM2IDcxJSwgIzQ2M2YzZiAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtZGFyayAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1kYXJrIC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWRhcmsgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMjQ1LDI0NSwyNDUsMC4yKX19Lmhlcm8uaXMtcHJpbWFyeXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0uaGVyby5pcy1wcmltYXJ5IGEsLmhlcm8uaXMtcHJpbWFyeSBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1wcmltYXJ5IC50aXRsZXtjb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgLnN1YnRpdGxle2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC45KX0uaGVyby5pcy1wcmltYXJ5IC5zdWJ0aXRsZSBhLC5oZXJvLmlzLXByaW1hcnkgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1wcmltYXJ5IC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzN9fS5oZXJvLmlzLXByaW1hcnkgYS5uYXYtaXRlbSwuaGVyby5pcy1wcmltYXJ5IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuNyl9Lmhlcm8uaXMtcHJpbWFyeSBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLXByaW1hcnkgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtcHJpbWFyeSAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtcHJpbWFyeSAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAudGFicyBhe2NvbG9yOiNmZmY7b3BhY2l0eTowLjl9Lmhlcm8uaXMtcHJpbWFyeSAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1wcmltYXJ5IC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6IzE4MmI3M30uaGVyby5pcy1wcmltYXJ5LmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMGIyNDRkIDAlLCAjMTgyYjczIDcxJSwgIzE4MWQ4YyAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtcHJpbWFyeSAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1wcmltYXJ5IC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXByaW1hcnkgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC4yKX19Lmhlcm8uaXMtaW5mb3tiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Y29sb3I6I2ZmZn0uaGVyby5pcy1pbmZvIGEsLmhlcm8uaXMtaW5mbyBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1pbmZvIC50aXRsZXtjb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gLnN1YnRpdGxle2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC45KX0uaGVyby5pcy1pbmZvIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLWluZm8gLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1pbmZvIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGN9fS5oZXJvLmlzLWluZm8gYS5uYXYtaXRlbSwuaGVyby5pcy1pbmZvIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuNyl9Lmhlcm8uaXMtaW5mbyBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLWluZm8gYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtaW5mbyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtaW5mbyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAudGFicyBhe2NvbG9yOiNmZmY7b3BhY2l0eTowLjl9Lmhlcm8uaXMtaW5mbyAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1pbmZvIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1pbmZvIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtaW5mbyAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1pbmZvIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWluZm8gLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtaW5mbyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1pbmZvIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1pbmZvIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6IzMyNzNkY30uaGVyby5pcy1pbmZvLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMTU3N2M2IDAlLCAjMzI3M2RjIDcxJSwgIzQzNjZlNSAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtaW5mbyAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1pbmZvIC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWluZm8gLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC4yKX19Lmhlcm8uaXMtc3VjY2Vzc3tiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Y29sb3I6I2ZmZn0uaGVyby5pcy1zdWNjZXNzIGEsLmhlcm8uaXMtc3VjY2VzcyBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1zdWNjZXNzIC50aXRsZXtjb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgLnN1YnRpdGxle2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC45KX0uaGVyby5pcy1zdWNjZXNzIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLXN1Y2Nlc3MgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1zdWNjZXNzIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjB9fS5oZXJvLmlzLXN1Y2Nlc3MgYS5uYXYtaXRlbSwuaGVyby5pcy1zdWNjZXNzIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuNyl9Lmhlcm8uaXMtc3VjY2VzcyBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLXN1Y2Nlc3MgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtc3VjY2VzcyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtc3VjY2VzcyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAudGFicyBhe2NvbG9yOiNmZmY7b3BhY2l0eTowLjl9Lmhlcm8uaXMtc3VjY2VzcyAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1zdWNjZXNzIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6IzIzZDE2MH0uaGVyby5pcy1zdWNjZXNzLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMTJhZjJmIDAlLCAjMjNkMTYwIDcxJSwgIzJjZTI4YSAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtc3VjY2VzcyAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1zdWNjZXNzIC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC4yKX19Lmhlcm8uaXMtd2FybmluZ3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTc7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgYSwuaGVyby5pcy13YXJuaW5nIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLXdhcm5pbmcgLnRpdGxle2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDAsMCwwLDAuOSl9Lmhlcm8uaXMtd2FybmluZyAuc3VidGl0bGUgYSwuaGVyby5pcy13YXJuaW5nIC5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgwLDAsMCwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy13YXJuaW5nIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTd9fS5oZXJvLmlzLXdhcm5pbmcgYS5uYXYtaXRlbSwuaGVyby5pcy13YXJuaW5nIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLXdhcm5pbmcgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtd2FybmluZyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtd2FybmluZyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIC50YWJzIGF7Y29sb3I6cmdiYSgwLDAsMCwwLjcpO29wYWNpdHk6MC45fS5oZXJvLmlzLXdhcm5pbmcgLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtd2FybmluZyAudGFicyBsaS5pcy1hY3RpdmUgYXtvcGFjaXR5OjF9Lmhlcm8uaXMtd2FybmluZyAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtd2FybmluZyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KTtib3JkZXItY29sb3I6cmdiYSgwLDAsMCwwLjcpO2NvbG9yOiNmZmRkNTd9Lmhlcm8uaXMtd2FybmluZy5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgI2ZmYWYyNCAwJSwgI2ZmZGQ1NyA3MSUsICNmZmZhNzAgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXdhcm5pbmcgLm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXdhcm5pbmcgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgwLDAsMCwwLjIpfX0uaGVyby5pcy1kYW5nZXJ7YmFja2dyb3VuZC1jb2xvcjpyZWQ7Y29sb3I6I2ZmZn0uaGVyby5pcy1kYW5nZXIgYSwuaGVyby5pcy1kYW5nZXIgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtZGFuZ2VyIC50aXRsZXtjb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLWRhbmdlciAuc3VidGl0bGUgYSwuaGVyby5pcy1kYW5nZXIgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWRhbmdlciAubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjpyZWR9fS5oZXJvLmlzLWRhbmdlciBhLm5hdi1pdGVtLC5oZXJvLmlzLWRhbmdlciAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbil7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjcpfS5oZXJvLmlzLWRhbmdlciBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLWRhbmdlciBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1kYW5nZXIgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pOmhvdmVyLC5oZXJvLmlzLWRhbmdlciAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtZGFuZ2VyIC50YWJzIGF7Y29sb3I6I2ZmZjtvcGFjaXR5OjAuOX0uaGVyby5pcy1kYW5nZXIgLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtZGFuZ2VyIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6I2ZmZn0uaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOnJlZH0uaGVyby5pcy1kYW5nZXIuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICNjMDIgMCUsIHJlZCA3MSUsICNmZjQwMWEgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWRhbmdlciAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1kYW5nZXIgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtZGFuZ2VyIC5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1kYW5nZXIgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC4yKX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5oZXJvLmlzLW1lZGl1bSAuaGVyby1ib2R5e3BhZGRpbmctYm90dG9tOjlyZW07cGFkZGluZy10b3A6OXJlbX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5oZXJvLmlzLWxhcmdlIC5oZXJvLWJvZHl7cGFkZGluZy1ib3R0b206MThyZW07cGFkZGluZy10b3A6MThyZW19fS5oZXJvLmlzLWZ1bGxoZWlnaHR7bWluLWhlaWdodDoxMDB2aH0uaGVyby5pcy1mdWxsaGVpZ2h0IC5oZXJvLWJvZHl7YWxpZ24taXRlbXM6Y2VudGVyO2Rpc3BsYXk6ZmxleH0uaGVyby5pcy1mdWxsaGVpZ2h0IC5oZXJvLWJvZHk+LmNvbnRhaW5lcntmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxfS5zZWN0aW9ue2JhY2tncm91bmQtY29sb3I6I2ZmZjtwYWRkaW5nOjNyZW0gMS41cmVtfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LnNlY3Rpb24uaXMtbWVkaXVte3BhZGRpbmc6OXJlbSAxLjVyZW19LnNlY3Rpb24uaXMtbGFyZ2V7cGFkZGluZzoxOHJlbSAxLjVyZW19fS5mb290ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O3BhZGRpbmc6M3JlbSAxLjVyZW0gNnJlbX0uaGVhZGVyLmlzLWZpeGVkLXRvcHt6LWluZGV4OjEwMzA7cG9zaXRpb246Zml4ZWQ7dG9wOjA7bGVmdDowO3JpZ2h0OjB9Lmhhcy1maXhlZC1uYXZ7bWFyZ2luLXRvcDo1MHB4fS5zZWN0aW9uLmlzLXNtYWxse3BhZGRpbmc6MXJlbSAxLjVyZW19LnRleHRhcmVhLmlzLWZsdWlke21pbi1oZWlnaHQ6MWVtO292ZXJmbG93OmhpZGRlbjtyZXNpemU6bm9uZTt0cmFuc2l0aW9uOm1pbi1oZWlnaHQgMC4zc30udGV4dGFyZWEuaXMtZmx1aWQ6Zm9jdXN7bWluLWhlaWdodDo2ZW07b3ZlcmZsb3c6YXV0b30ubmF2LWludmVyc2V7YmFja2dyb3VuZDojMTgyYjczfS5uYXYtaW52ZXJzZSBhLm5hdi1pdGVte2NvbG9yOiNmMmYyZjJ9Lm5hdi1pbnZlcnNlIGEubmF2LWl0ZW06aG92ZXJ7Y29sb3I6I2QxZDVlM30ubmF2LWludmVyc2UgYS5uYXYtaXRlbS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0ubmF2LWludmVyc2UgYS5uYXYtaXRlbS5pcy10YWI6aG92ZXJ7Ym9yZGVyLWJvdHRvbS1jb2xvcjojZmZmfS5uYXYtaW52ZXJzZSBhLm5hdi1pdGVtLmlzLXRhYi5pcy1hY3RpdmV7Ym9yZGVyLWJvdHRvbTozcHggc29saWQgI2ZmZjtjb2xvcjojZmZmfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlcntwb3NpdGlvbjpmaXhlZDt0b3A6MDtib3R0b206MDt6LWluZGV4OjEwNDA7b3ZlcmZsb3cteTphdXRvO3RleHQtYWxpZ246Y2VudGVyO2JhY2tncm91bmQ6IzE4MmI3Mztjb2xvcjojZmZmO2xlZnQ6LTI1MHB4O3dpZHRoOjI1MHB4O3RyYW5zaXRpb246bGVmdCAwLjVzfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlci5pcy1hY3RpdmV7bGVmdDowfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlciAubmF2LWl0ZW17Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpibG9jaztwYWRkaW5nLXRvcDoxMHB4O3BhZGRpbmctYm90dG9tOjlweDtiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsMC4xKX0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgLm5hdi1pdGVtLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCh0byByaWdodCwgcmdiYSgyNTUsMjU1LDI1NSwwLjQpLCByZ2JhKDI1NSwyNTUsMjU1LDAuMSkgNSUpfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlciAubmF2LWl0ZW1bb3Blbl0+c3VtbWFyeXttYXJnaW4tYm90dG9tOjlweH0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgLm5hdi1pdGVtOm5vdCg6bGFzdC1jaGlsZCl7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2ZmZn0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgfiAuaXMtb3ZlcmxheXtiYWNrZ3JvdW5kOnJnYmEoMCwwLDAsMC41KTt6LWluZGV4OjEwMzU7dmlzaWJpbGl0eTpoaWRkZW47cG9zaXRpb246Zml4ZWQ7b3BhY2l0eTowO3RyYW5zaXRpb246b3BhY2l0eSAwLjc1c30ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIuaXMtYWN0aXZlIH4gLmlzLW92ZXJsYXl7dmlzaWJpbGl0eTp2aXNpYmxlO29wYWNpdHk6MX0jY29udGFpbmVyPmRpdjpub3QoLnZpc2libGUpe2Rpc3BsYXk6bm9uZX0jY29udGFpbmVyPmRpdntwb3NpdGlvbjpyZWxhdGl2ZTtoZWlnaHQ6Y2FsYygxMDB2aCAtIDUwcHgpO292ZXJmbG93LXk6YXV0bzstd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzp0b3VjaH1cXG5cIiArXHJcbiAgICAnPC9zdHlsZT4nO1xyXG5cclxuLy8gU2hvdyB0aGUgbWVudSB3aGVuIGNsaWNraW5nIG9uIHRoZSBtZW51IGJ1dHRvblxyXG5BcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5uYXYtc2xpZGVyLXRvZ2dsZScpKVxyXG4gICAgLmZvckVhY2goZWwgPT4gZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0b2dnbGVNZW51KSk7XHJcblxyXG4vLyBIaWRlIHRoZSBtZW51IHdoZW4gY2xpY2tpbmcgdGhlIG92ZXJsYXlcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm5hdi1zbGlkZXItY29udGFpbmVyIC5pcy1vdmVybGF5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0b2dnbGVNZW51KTtcclxuXHJcbi8vIENoYW5nZSB0YWJzXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlcicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gZ2xvYmFsVGFiQ2hhbmdlKGV2ZW50KSB7XHJcbiAgICB2YXIgdGFiTmFtZSA9IGV2ZW50LnRhcmdldC5kYXRhc2V0LnRhYk5hbWU7XHJcbiAgICB2YXIgdGFiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2NvbnRhaW5lciA+IFtkYXRhLXRhYi1uYW1lPSR7dGFiTmFtZX1dYCk7XHJcbiAgICBpZighdGFiTmFtZSB8fCAhdGFiKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQ29udGVudFxyXG4gICAgLy9XZSBjYW4ndCBqdXN0IHJlbW92ZSB0aGUgZmlyc3QgZHVlIHRvIGJyb3dzZXIgbGFnXHJcbiAgICBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNjb250YWluZXIgPiAudmlzaWJsZScpKVxyXG4gICAgICAgIC5mb3JFYWNoKGVsID0+IGVsLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2libGUnKSk7XHJcbiAgICB0YWIuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xyXG5cclxuICAgIC8vVGFic1xyXG4gICAgQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgLmlzLWFjdGl2ZScpKVxyXG4gICAgICAgIC5mb3JFYWNoKGVsID0+IGVsLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLWFjdGl2ZScpKTtcclxuICAgIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuYWRkKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICBob29rLmZpcmUoJ3VpLnRhYlNob3duJywgdGFiKTtcclxufSk7XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzaG93L2hpZGUgdGhlIG1lbnUuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHRvZ2dsZU1lbnUoKTtcclxuICovXHJcbmZ1bmN0aW9uIHRvZ2dsZU1lbnUoKSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXInKS5jbGFzc0xpc3QudG9nZ2xlKCdpcy1hY3RpdmUnKTtcclxufVxyXG5cclxudmFyIHRhYlVJRCA9IDA7XHJcbi8qKlxyXG4gKiBVc2VkIHRvIGFkZCBhIHRhYiB0byB0aGUgYm90J3MgbmF2aWdhdGlvbi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHRhYiA9IHVpLmFkZFRhYignVGV4dCcpO1xyXG4gKiB2YXIgdGFiMiA9IHVpLmFkZFRhYignQ3VzdG9tIE1lc3NhZ2VzJywgJ21lc3NhZ2VzJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWJUZXh0XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZ3JvdXBOYW1lPW1haW5dIE9wdGlvbmFsLiBJZiBwcm92aWRlZCwgdGhlIG5hbWUgb2YgdGhlIGdyb3VwIG9mIHRhYnMgdG8gYWRkIHRoaXMgdGFiIHRvLlxyXG4gKiBAcmV0dXJuIHtOb2RlfSAtIFRoZSBkaXYgdG8gcGxhY2UgdGFiIGNvbnRlbnQgaW4uXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRUYWIodGFiVGV4dCwgZ3JvdXBOYW1lID0gJ21haW4nKSB7XHJcbiAgICB2YXIgdGFiTmFtZSA9ICdib3RUYWJfJyArIHRhYlVJRCsrO1xyXG5cclxuICAgIHZhciB0YWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICB0YWIudGV4dENvbnRlbnQgPSB0YWJUZXh0O1xyXG4gICAgdGFiLmNsYXNzTGlzdC5hZGQoJ25hdi1pdGVtJyk7XHJcbiAgICB0YWIuZGF0YXNldC50YWJOYW1lID0gdGFiTmFtZTtcclxuXHJcbiAgICB2YXIgdGFiQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGFiQ29udGVudC5kYXRhc2V0LnRhYk5hbWUgPSB0YWJOYW1lO1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5uYXYtc2xpZGVyLWNvbnRhaW5lciBbZGF0YS10YWItZ3JvdXA9JHtncm91cE5hbWV9XWApLmFwcGVuZENoaWxkKHRhYik7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY29udGFpbmVyJykuYXBwZW5kQ2hpbGQodGFiQ29udGVudCk7XHJcblxyXG4gICAgcmV0dXJuIHRhYkNvbnRlbnQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIGdsb2JhbCB0YWIuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB0YWIgPSB1aS5hZGRUYWIoJ1RhYicpO1xyXG4gKiB1aS5yZW1vdmVUYWIodGFiKTtcclxuICogQHBhcmFtIHtOb2RlfSB0YWJDb250ZW50IFRoZSBkaXYgcmV0dXJuZWQgYnkgdGhlIGFkZFRhYiBmdW5jdGlvbi5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZVRhYih0YWJDb250ZW50KSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAubmF2LXNsaWRlci1jb250YWluZXIgW2RhdGEtdGFiLW5hbWU9JHt0YWJDb250ZW50LmRhdGFzZXQudGFiTmFtZX1dYCkucmVtb3ZlKCk7XHJcbiAgICB0YWJDb250ZW50LnJlbW92ZSgpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSB0YWIgZ3JvdXAgaW4gd2hpY2ggdGFicyBjYW4gYmUgcGxhY2VkLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1aS5hZGRUYWJHcm91cCgnR3JvdXAgVGV4dCcsICdzb21lX2dyb3VwJyk7XHJcbiAqIHVpLmFkZFRhYignV2l0aGluIGdyb3VwJywgJ3NvbWVfZ3JvdXAnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBUaGUgdGV4dCB0aGUgdXNlciB3aWxsIHNlZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZ3JvdXBOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGdyb3VwIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGFkZCB0YWJzIHdpdGhpbiB0aGUgZ3JvdXAuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyZW50ID0gbWFpbl0gLSBUaGUgbmFtZSBvZiB0aGUgcGFyZW50IGdyb3VwLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkVGFiR3JvdXAodGV4dCwgZ3JvdXBOYW1lLCBwYXJlbnQgPSAnbWFpbicpIHtcclxuICAgIHZhciBkZXRhaWxzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGV0YWlscycpO1xyXG4gICAgZGV0YWlscy5jbGFzc0xpc3QuYWRkKCduYXYtaXRlbScpO1xyXG4gICAgZGV0YWlscy5kYXRhc2V0LnRhYkdyb3VwID0gZ3JvdXBOYW1lO1xyXG5cclxuICAgIHZhciBzdW1tYXJ5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3VtbWFyeScpO1xyXG4gICAgc3VtbWFyeS50ZXh0Q29udGVudCA9IHRleHQ7XHJcbiAgICBkZXRhaWxzLmFwcGVuZENoaWxkKHN1bW1hcnkpO1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5uYXYtc2xpZGVyLWNvbnRhaW5lciBbZGF0YS10YWItZ3JvdXA9XCIke3BhcmVudH1cIl1gKS5hcHBlbmRDaGlsZChkZXRhaWxzKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgdGFiIGdyb3VwIGFuZCBhbGwgdGFicyBjb250YWluZWQgd2l0aGluIHRoZSBzcGVjaWZpZWQgZ3JvdXAuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGFkZFRhYkdyb3VwKCdHcm91cCcsICdncm91cDEnKTtcclxuICogdmFyIGlubmVyID0gYWRkVGFiKCdJbm5lcicsICdncm91cDEnKTtcclxuICogcmVtb3ZlVGFiR3JvdXAoJ2dyb3VwMScpOyAvLyBpbm5lciBoYXMgYmVlbiByZW1vdmVkLlxyXG4gKiBAcGFyYW0gc3RyaW5nIGdyb3VwTmFtZSB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAgdGhhdCB3YXMgdXNlZCBpbiB1aS5hZGRUYWJHcm91cC5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZVRhYkdyb3VwKGdyb3VwTmFtZSkge1xyXG4gICAgdmFyIGdyb3VwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLm5hdi1zbGlkZXItY29udGFpbmVyIFtkYXRhLXRhYi1ncm91cD1cIiR7Z3JvdXBOYW1lfVwiXWApO1xyXG4gICAgdmFyIGl0ZW1zID0gQXJyYXkuZnJvbShncm91cC5xdWVyeVNlbGVjdG9yQWxsKCdzcGFuJykpO1xyXG5cclxuICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgLy9UYWIgY29udGVudFxyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNjb250YWluZXIgPiBbZGF0YS10YWItbmFtZT1cIiR7aXRlbS5kYXRhc2V0LnRhYk5hbWV9XCJdYCkucmVtb3ZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBncm91cC5yZW1vdmUoKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0b2dnbGVNZW51LFxyXG4gICAgYWRkVGFiLFxyXG4gICAgcmVtb3ZlVGFiLFxyXG4gICAgYWRkVGFiR3JvdXAsXHJcbiAgICByZW1vdmVUYWJHcm91cCxcclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBhbGVydFxyXG59O1xyXG5cclxudmFyIG1vZGFsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0Jyk7XHJcblxyXG4vKipcclxuKiBGdW5jdGlvbiB1c2VkIHRvIHJlcXVpcmUgYWN0aW9uIGZyb20gdGhlIHVzZXIuXHJcbipcclxuKiBAcGFyYW0ge1N0cmluZ30gaHRtbCB0aGUgaHRtbCB0byBkaXNwbGF5IGluIHRoZSBhbGVydFxyXG4qIEBwYXJhbSB7QXJyYXl9IGJ1dHRvbnMgYW4gYXJyYXkgb2YgYnV0dG9ucyB0byBhZGQgdG8gdGhlIGFsZXJ0LlxyXG4qICAgICAgICBGb3JtYXQ6IFt7dGV4dDogJ1Rlc3QnLCBzdHlsZTonaXMtc3VjY2VzcycsIGFjdGlvbjogZnVuY3Rpb24oKXt9LCB0aGlzQXJnOiB3aW5kb3csIGRpc21pc3M6IGZhbHNlfV1cclxuKiAgICAgICAgTm90ZTogdGV4dCBpcyB0aGUgb25seSByZXF1aXJlZCBwYXJhbWF0ZXIuIElmIG5vIGJ1dHRvbiBhcnJheSBpcyBzcGVjaWZpZWRcclxuKiAgICAgICAgdGhlbiBhIHNpbmdsZSBPSyBidXR0b24gd2lsbCBiZSBzaG93bi5cclxuKiAgICAgICAgc3R5bGUgY2FuIGFsc28gYmUgYW4gYXJyYXkgb2YgY2xhc3NlcyB0byBhZGQuXHJcbiogICAgICAgIERlZmF1bHRzOiBzdHlsZTogJycsIGFjdGlvbjogdW5kZWZpbmVkLCB0aGlzQXJnOiB1bmRlZmluZWQsIGRpc21pc3M6IHRydWVcclxuKi9cclxuZnVuY3Rpb24gYWxlcnQoaHRtbCwgYnV0dG9ucyA9IFt7dGV4dDogJ09LJ31dKSB7XHJcbiAgICBpZiAoaW5zdGFuY2UuYWN0aXZlKSB7XHJcbiAgICAgICAgaW5zdGFuY2UucXVldWUucHVzaCh7aHRtbCwgYnV0dG9uc30pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGluc3RhbmNlLmFjdGl2ZSA9IHRydWU7XHJcblxyXG4gICAgYnV0dG9ucy5mb3JFYWNoKGZ1bmN0aW9uKGJ1dHRvbiwgaSkge1xyXG4gICAgICAgIGJ1dHRvbi5kaXNtaXNzID0gKGJ1dHRvbi5kaXNtaXNzID09PSBmYWxzZSkgPyBmYWxzZSA6IHRydWU7XHJcbiAgICAgICAgaW5zdGFuY2UuYnV0dG9uc1snYnV0dG9uXycgKyBpXSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiBidXR0b24uYWN0aW9uLFxyXG4gICAgICAgICAgICB0aGlzQXJnOiBidXR0b24udGhpc0FyZyB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIGRpc21pc3M6IHR5cGVvZiBidXR0b24uZGlzbWlzcyA9PSAnYm9vbGVhbicgPyBidXR0b24uZGlzbWlzcyA6IHRydWUsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBidXR0b24uaWQgPSAnYnV0dG9uXycgKyBpO1xyXG4gICAgICAgIGJ1aWxkQnV0dG9uKGJ1dHRvbik7XHJcbiAgICB9KTtcclxuICAgIG1vZGFsLnF1ZXJ5U2VsZWN0b3IoJy5tb2RhbC1jYXJkLWJvZHknKS5pbm5lckhUTUwgPSBodG1sO1xyXG5cclxuICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ2lzLWFjdGl2ZScpO1xyXG59XHJcblxyXG4vKipcclxuICogSG9sZHMgdGhlIGN1cnJlbnQgYWxlcnQgYW5kIHF1ZXVlIG9mIGZ1cnRoZXIgYWxlcnRzLlxyXG4gKi9cclxudmFyIGluc3RhbmNlID0ge1xyXG4gICAgYWN0aXZlOiBmYWxzZSxcclxuICAgIHF1ZXVlOiBbXSxcclxuICAgIGJ1dHRvbnM6IHt9LFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gYWRkIGJ1dHRvbiBlbGVtZW50cyB0byBhbiBhbGVydC5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IGJ1dHRvblxyXG4gKi9cclxuZnVuY3Rpb24gYnVpbGRCdXR0b24oYnV0dG9uKSB7XHJcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICBlbC5pbm5lckhUTUwgPSBidXR0b24udGV4dDtcclxuXHJcbiAgICBlbC5jbGFzc0xpc3QuYWRkKCdidXR0b24nKTtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KGJ1dHRvbi5zdHlsZSkpIHtcclxuICAgICAgICBidXR0b24uc3R5bGUuZm9yRWFjaChzdHlsZSA9PiBlbC5jbGFzc0xpc3QuYWRkKHN0eWxlKSk7XHJcbiAgICB9IGVsc2UgaWYgKGJ1dHRvbi5zdHlsZSkge1xyXG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoYnV0dG9uLnN0eWxlKTtcclxuICAgIH1cclxuXHJcbiAgICBlbC5pZCA9IGJ1dHRvbi5pZDtcclxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYnV0dG9uSGFuZGxlcik7XHJcbiAgICBtb2RhbC5xdWVyeVNlbGVjdG9yKCcubW9kYWwtY2FyZC1mb290JykuYXBwZW5kQ2hpbGQoZWwpO1xyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIHRoZSBmdW5jdGlvbmFsaXR5IG9mIGVhY2ggYnV0dG9uIGFkZGVkIHRvIGFuIGFsZXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50XHJcbiAqL1xyXG5mdW5jdGlvbiBidXR0b25IYW5kbGVyKGV2ZW50KSB7XHJcbiAgICB2YXIgYnV0dG9uID0gaW5zdGFuY2UuYnV0dG9uc1tldmVudC50YXJnZXQuaWRdIHx8IHt9O1xyXG4gICAgaWYgKHR5cGVvZiBidXR0b24uYWN0aW9uID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBidXR0b24uYWN0aW9uLmNhbGwoYnV0dG9uLnRoaXNBcmcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vUmVxdWlyZSB0aGF0IHRoZXJlIGJlIGFuIGFjdGlvbiBhc29jaWF0ZWQgd2l0aCBuby1kaXNtaXNzIGJ1dHRvbnMuXHJcbiAgICBpZiAoYnV0dG9uLmRpc21pc3MgfHwgdHlwZW9mIGJ1dHRvbi5hY3Rpb24gIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIG1vZGFsLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIG1vZGFsLnF1ZXJ5U2VsZWN0b3IoJy5tb2RhbC1jYXJkLWZvb3QnKS5pbm5lckhUTUwgPSAnJztcclxuICAgICAgICBpbnN0YW5jZS5idXR0b25zID0ge307XHJcbiAgICAgICAgaW5zdGFuY2UuYWN0aXZlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIEFyZSBtb3JlIGFsZXJ0cyB3YWl0aW5nIHRvIGJlIHNob3duP1xyXG4gICAgICAgIGlmIChpbnN0YW5jZS5xdWV1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgbGV0IG5leHQgPSBpbnN0YW5jZS5xdWV1ZS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBhbGVydChuZXh0Lmh0bWwsIG5leHQuYnV0dG9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiIsIlxyXG5cclxudmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbmVsLmlubmVySFRNTCA9IFwiPGRpdiBpZD1cXFwiYWxlcnRcXFwiIGNsYXNzPVxcXCJtb2RhbFxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcIm1vZGFsLWJhY2tncm91bmRcXFwiPjwvZGl2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJtb2RhbC1jYXJkXFxcIj5cXHJcXG4gICAgICAgIDxoZWFkZXIgY2xhc3M9XFxcIm1vZGFsLWNhcmQtaGVhZFxcXCI+PC9oZWFkZXI+XFxyXFxuICAgICAgICA8c2VjdGlvbiBjbGFzcz1cXFwibW9kYWwtY2FyZC1ib2R5XFxcIj48L3NlY3Rpb24+XFxyXFxuICAgICAgICA8Zm9vdGVyIGNsYXNzPVxcXCJtb2RhbC1jYXJkLWZvb3RcXFwiPjwvZm9vdGVyPlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbmVsLmlubmVySFRNTCA9IFwiLmJvdC1ub3RpZmljYXRpb257cG9zaXRpb246Zml4ZWQ7dG9wOjAuNmVtO3JpZ2h0OjFlbTt6LWluZGV4OjEwMzU7bWluLXdpZHRoOjIwMHB4O2JvcmRlci1yYWRpdXM6NXB4O3BhZGRpbmc6NXB4O2JhY2tncm91bmQ6I2ZmZjtjb2xvcjojMTgyYjczO29wYWNpdHk6MDt0cmFuc2l0aW9uOm9wYWNpdHkgMXN9LmJvdC1ub3RpZmljYXRpb24uaXMtYWN0aXZle29wYWNpdHk6MX1cXG5cIjtcclxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG5PYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2FsZXJ0JyksXHJcbiAgICByZXF1aXJlKCcuL25vdGlmeScpXHJcbik7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbm90aWZ5LFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2VuZCBhIG5vbi1jcml0aWNhbCBhbGVydCB0byB0aGUgdXNlci5cclxuICogU2hvdWxkIGJlIHVzZWQgaW4gcGxhY2Ugb2YgdWkuYWxlcnQgaWYgcG9zc2libGUgYXMgaXQgaXMgbm9uLWJsb2NraW5nLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL1Nob3dzIGEgbm90ZmljYXRpb24gZm9yIDIgc2Vjb25kc1xyXG4gKiB1aS5ub3RpZnkoJ05vdGlmaWNhdGlvbicpO1xyXG4gKiAvL1Nob3dzIGEgbm90aWZpY2F0aW9uIGZvciA1IHNlY29uZHNcclxuICogdWkubm90aWZ5KCdOb3RpZmljYXRpb24nLCA1KTtcclxuICogQHBhcmFtIHtTdHJpbmd9IHRleHQgdGhlIHRleHQgdG8gZGlzcGxheS4gU2hvdWxkIGJlIGtlcHQgc2hvcnQgdG8gYXZvaWQgdmlzdWFsbHkgYmxvY2tpbmcgdGhlIG1lbnUgb24gc21hbGwgZGV2aWNlcy5cclxuICogQHBhcmFtIHtOdW1iZXJ9IGRpc3BsYXlUaW1lIHRoZSBudW1iZXIgb2Ygc2Vjb25kcyB0byBzaG93IHRoZSBub3RpZmljYXRpb24gZm9yLlxyXG4gKi9cclxuZnVuY3Rpb24gbm90aWZ5KHRleHQsIGRpc3BsYXlUaW1lID0gMikge1xyXG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICBlbC5jbGFzc0xpc3QuYWRkKCdib3Qtbm90aWZpY2F0aW9uJywgJ2lzLWFjdGl2ZScpO1xyXG4gICAgZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XHJcbiAgICB2YXIgdGltZW91dHMgPSBbXHJcbiAgICAgICAgLy8gRmFkZSBvdXQgYWZ0ZXIgZGlzcGxheVRpbWVcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIH0uYmluZChlbCksIGRpc3BsYXlUaW1lICogMTAwMCksXHJcbiAgICAgICAgLy8gUmVtb3ZlIGFmdGVyIGZhZGUgb3V0XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmUoKTtcclxuICAgICAgICB9LmJpbmQoZWwpLCBkaXNwbGF5VGltZSAqIDEwMDAgKyAyMTAwKVxyXG4gICAgXTtcclxuXHJcblxyXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aW1lb3V0cy5mb3JFYWNoKGNsZWFyVGltZW91dCk7XHJcbiAgICAgICAgdGhpcy5yZW1vdmUoKTtcclxuICAgIH0pO1xyXG59XHJcbiIsIi8vRGV0YWlscyBwb2x5ZmlsbCwgb2xkZXIgZmlyZWZveCwgSUVcclxuaWYgKCEoJ29wZW4nIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKSkpIHtcclxuICAgIGxldCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbiAgICBzdHlsZS50ZXh0Q29udGVudCArPSBgZGV0YWlsczpub3QoW29wZW5dKSA+IDpub3Qoc3VtbWFyeSkgeyBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH0gZGV0YWlscyA+IHN1bW1hcnk6YmVmb3JlIHsgY29udGVudDogXCLilrZcIjsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBmb250LXNpemU6IC44ZW07IHdpZHRoOiAxLjVlbTsgZm9udC1mYW1pbHk6XCJDb3VyaWVyIE5ld1wiOyB9IGRldGFpbHNbb3Blbl0gPiBzdW1tYXJ5OmJlZm9yZSB7IHRyYW5zZm9ybTogcm90YXRlKDkwZGVnKTsgfWA7XHJcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcclxuXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC50YXJnZXQudGFnTmFtZSA9PSAnU1VNTUFSWScpIHtcclxuICAgICAgICAgICAgbGV0IGRldGFpbHMgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZGV0YWlscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZGV0YWlscy5nZXRBdHRyaWJ1dGUoJ29wZW4nKSkge1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5vcGVuID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLnJlbW92ZUF0dHJpYnV0ZSgnb3BlbicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5vcGVuID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMuc2V0QXR0cmlidXRlKCdvcGVuJywgJ29wZW4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsIi8vIElFIEZpeFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0ZW1wbGF0ZSkge1xyXG4gICAgaWYgKCEoJ2NvbnRlbnQnIGluIHRlbXBsYXRlKSkge1xyXG4gICAgICAgIGxldCBjb250ZW50ID0gdGVtcGxhdGUuY2hpbGROb2RlcztcclxuICAgICAgICBsZXQgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29udGVudC5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChjb250ZW50W2pdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRlbXBsYXRlLmNvbnRlbnQgPSBmcmFnbWVudDtcclxuICAgIH1cclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBidWlsZENvbnRlbnRGcm9tVGVtcGxhdGUsXHJcbn07XHJcblxyXG52YXIgcG9seWZpbGwgPSByZXF1aXJlKCd1aS9wb2x5ZmlsbHMvdGVtcGxhdGUnKTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNsb25lIGEgdGVtcGxhdGUgYWZ0ZXIgYWx0ZXJpbmcgdGhlIHByb3ZpZGVkIHJ1bGVzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyN0ZW1wbGF0ZScsICcjdGFyZ2V0JywgW3tzZWxlY3RvcjogJ2lucHV0JywgdmFsdWU6ICdWYWx1ZSd9XSk7XHJcbiAqIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgndGVtcGxhdGUnLCAnZGl2JywgW3tzZWxlY3RvcjogJ2EnLCByZW1vdmU6IFsnaHJlZiddLCBtdWx0aXBsZTogdHJ1ZX1dKTtcclxuICogQHBhcmFtIHtTdHJpbmd8Tm9kZX0gdGVtcGxhdGVcclxuICogQHBhcmFtIHtTdHJpbmd8Tm9kZX0gdGFyZ2V0XHJcbiAqIEBwYXJhbSB7QXJyYXl9IHJ1bGVzIGZvcm1hdDogYXJyYXkgb2Ygb2JqZWN0c1xyXG4gKiAgICAgIGVhY2ggb2JqZWN0IG11c3QgaGF2ZSBcInNlbGVjdG9yXCIuXHJcbiAqICAgICAgZWFjaCBvYmplY3QgY2FuIGhhdmUgXCJtdWx0aXBsZVwiIHNldCB0byB1cGRhdGUgYWxsIG1hdGNoaW5nIGVsZW1lbnRzLlxyXG4gKiAgICAgIGVhY2ggb2JqZWN0IGNhbiBoYXZlIFwicmVtb3ZlXCIgLSBhbiBhcnJheSBvZiBhdHRyaWJ1dGVzIHRvIHJlbW92ZS5cclxuICogICAgICBlYWNoIG9iamVjdCBjYW4gaGF2ZSBcInRleHRcIiBvciBcImh0bWxcIiAtIGZ1cnRoZXIga2V5cyB3aWxsIGJlIHNldCBhcyBhdHRyaWJ1dGVzLlxyXG4gKiAgICAgIGlmIGJvdGggdGV4dCBhbmQgaHRtbCBhcmUgc2V0LCB0ZXh0IHdpbGwgdGFrZSBwcmVjZW5kZW5jZS5cclxuICogICAgICBydWxlcyB3aWxsIGJlIHBhcnNlZCBpbiB0aGUgb3JkZXIgdGhhdCB0aGV5IGFyZSBwcmVzZW50IGluIHRoZSBhcnJheS5cclxuICovXHJcbmZ1bmN0aW9uIGJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSh0ZW1wbGF0ZSwgdGFyZ2V0LCBydWxlcyA9IFtdKSB7XHJcbiAgICBpZiAodHlwZW9mIHRlbXBsYXRlID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRlbXBsYXRlKTtcclxuICAgIH1cclxuICAgIGlmICh0eXBlb2YgdGFyZ2V0ID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgdGFyZ2V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0YXJnZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHBvbHlmaWxsKHRlbXBsYXRlKTtcclxuXHJcbiAgICB2YXIgY29udGVudCA9IHRlbXBsYXRlLmNvbnRlbnQ7XHJcblxyXG4gICAgcnVsZXMuZm9yRWFjaChydWxlID0+IGhhbmRsZVJ1bGUoY29udGVudCwgcnVsZSkpO1xyXG5cclxuICAgIHRhcmdldC5hcHBlbmRDaGlsZChkb2N1bWVudC5pbXBvcnROb2RlKGNvbnRlbnQsIHRydWUpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGFwcGx5IHJ1bGVzIHRvIHRoZSB0ZW1wbGF0ZS5cclxuICpcclxuICogQHBhcmFtIHtOb2RlfSBjb250ZW50IC0gdGhlIGNvbnRlbnQgb2YgdGhlIHRlbXBsYXRlLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcnVsZSAtIHRoZSBydWxlIHRvIGFwcGx5LlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlUnVsZShjb250ZW50LCBydWxlKSB7XHJcbiAgICBpZiAocnVsZS5tdWx0aXBsZSkge1xyXG4gICAgICAgIGxldCBlbHMgPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3JBbGwocnVsZS5zZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIEFycmF5LmZyb20oZWxzKVxyXG4gICAgICAgICAgICAuZm9yRWFjaChlbCA9PiB1cGRhdGVFbGVtZW50KGVsLCBydWxlKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxldCBlbCA9IGNvbnRlbnQucXVlcnlTZWxlY3RvcihydWxlLnNlbGVjdG9yKTtcclxuICAgICAgICBpZiAoIWVsKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgVW5hYmxlIHRvIHVwZGF0ZSAke3J1bGUuc2VsZWN0b3J9LmAsIHJ1bGUpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGVFbGVtZW50KGVsLCBydWxlKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIHVwZGF0ZSBhbiBlbGVtZW50IHdpdGggYSBydWxlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge05vZGV9IGVsIHRoZSBlbGVtZW50IHRvIGFwcGx5IHRoZSBydWxlcyB0by5cclxuICogQHBhcmFtIHtPYmplY3R9IHJ1bGUgdGhlIHJ1bGUgb2JqZWN0LlxyXG4gKi9cclxuZnVuY3Rpb24gdXBkYXRlRWxlbWVudChlbCwgcnVsZSkge1xyXG4gICAgaWYgKCd0ZXh0JyBpbiBydWxlKSB7XHJcbiAgICAgICAgZWwudGV4dENvbnRlbnQgPSBydWxlLnRleHQ7XHJcbiAgICB9IGVsc2UgaWYgKCdodG1sJyBpbiBydWxlKSB7XHJcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gcnVsZS5odG1sO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5rZXlzKHJ1bGUpXHJcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gIVsnc2VsZWN0b3InLCAndGV4dCcsICdodG1sJywgJ3JlbW92ZScsICdtdWx0aXBsZSddLmluY2x1ZGVzKGtleSkpXHJcbiAgICAgICAgLmZvckVhY2goa2V5ID0+IGVsLnNldEF0dHJpYnV0ZShrZXksIHJ1bGVba2V5XSkpO1xyXG5cclxuICAgIGlmIChBcnJheS5pc0FycmF5KHJ1bGUucmVtb3ZlKSkge1xyXG4gICAgICAgIHJ1bGUucmVtb3ZlLmZvckVhY2goa2V5ID0+IGVsLnJlbW92ZUF0dHJpYnV0ZShrZXkpKTtcclxuICAgIH1cclxufVxyXG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIGNvbXBhcmUgYW5kIGlzQnVmZmVyIHRha2VuIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvYmxvYi82ODBlOWU1ZTQ4OGYyMmFhYzI3NTk5YTU3ZGM4NDRhNjMxNTkyOGRkL2luZGV4LmpzXG4vLyBvcmlnaW5hbCBub3RpY2U6XG5cbi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmUoYSwgYikge1xuICBpZiAoYSA9PT0gYikge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgdmFyIHggPSBhLmxlbmd0aDtcbiAgdmFyIHkgPSBiLmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICB4ID0gYVtpXTtcbiAgICAgIHkgPSBiW2ldO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGlmICh5IDwgeCkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuZnVuY3Rpb24gaXNCdWZmZXIoYikge1xuICBpZiAoZ2xvYmFsLkJ1ZmZlciAmJiB0eXBlb2YgZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBnbG9iYWwuQnVmZmVyLmlzQnVmZmVyKGIpO1xuICB9XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpO1xufVxuXG4vLyBiYXNlZCBvbiBub2RlIGFzc2VydCwgb3JpZ2luYWwgbm90aWNlOlxuXG4vLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGZ1bmN0aW9uc0hhdmVOYW1lcyA9IChmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBmdW5jdGlvbiBmb28oKSB7fS5uYW1lID09PSAnZm9vJztcbn0oKSk7XG5mdW5jdGlvbiBwVG9TdHJpbmcgKG9iaikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaik7XG59XG5mdW5jdGlvbiBpc1ZpZXcoYXJyYnVmKSB7XG4gIGlmIChpc0J1ZmZlcihhcnJidWYpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0eXBlb2YgZ2xvYmFsLkFycmF5QnVmZmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIuaXNWaWV3ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIEFycmF5QnVmZmVyLmlzVmlldyhhcnJidWYpO1xuICB9XG4gIGlmICghYXJyYnVmKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChhcnJidWYgaW5zdGFuY2VvZiBEYXRhVmlldykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmIChhcnJidWYuYnVmZmVyICYmIGFycmJ1Zi5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbnZhciByZWdleCA9IC9cXHMqZnVuY3Rpb25cXHMrKFteXFwoXFxzXSopXFxzKi87XG4vLyBiYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vbGpoYXJiL2Z1bmN0aW9uLnByb3RvdHlwZS5uYW1lL2Jsb2IvYWRlZWVlYzhiZmNjNjA2OGIxODdkN2Q5ZmIzZDViYjFkM2EzMDg5OS9pbXBsZW1lbnRhdGlvbi5qc1xuZnVuY3Rpb24gZ2V0TmFtZShmdW5jKSB7XG4gIGlmICghdXRpbC5pc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChmdW5jdGlvbnNIYXZlTmFtZXMpIHtcbiAgICByZXR1cm4gZnVuYy5uYW1lO1xuICB9XG4gIHZhciBzdHIgPSBmdW5jLnRvU3RyaW5nKCk7XG4gIHZhciBtYXRjaCA9IHN0ci5tYXRjaChyZWdleCk7XG4gIHJldHVybiBtYXRjaCAmJiBtYXRjaFsxXTtcbn1cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBnZXROYW1lKHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh0eXBlb2YgcyA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cbmZ1bmN0aW9uIGluc3BlY3Qoc29tZXRoaW5nKSB7XG4gIGlmIChmdW5jdGlvbnNIYXZlTmFtZXMgfHwgIXV0aWwuaXNGdW5jdGlvbihzb21ldGhpbmcpKSB7XG4gICAgcmV0dXJuIHV0aWwuaW5zcGVjdChzb21ldGhpbmcpO1xuICB9XG4gIHZhciByYXduYW1lID0gZ2V0TmFtZShzb21ldGhpbmcpO1xuICB2YXIgbmFtZSA9IHJhd25hbWUgPyAnOiAnICsgcmF3bmFtZSA6ICcnO1xuICByZXR1cm4gJ1tGdW5jdGlvbicgKyAgbmFtZSArICddJztcbn1cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoaW5zcGVjdChzZWxmLmFjdHVhbCksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShpbnNwZWN0KHNlbGYuZXhwZWN0ZWQpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBmYWxzZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIGRlZXBTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCB0cnVlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBTdHJpY3RFcXVhbCcsIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIHN0cmljdCwgbWVtb3MpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoaXNCdWZmZXIoYWN0dWFsKSAmJiBpc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gY29tcGFyZShhY3R1YWwsIGV4cGVjdGVkKSA9PT0gMDtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoKGFjdHVhbCA9PT0gbnVsbCB8fCB0eXBlb2YgYWN0dWFsICE9PSAnb2JqZWN0JykgJiZcbiAgICAgICAgICAgICAoZXhwZWN0ZWQgPT09IG51bGwgfHwgdHlwZW9mIGV4cGVjdGVkICE9PSAnb2JqZWN0JykpIHtcbiAgICByZXR1cm4gc3RyaWN0ID8gYWN0dWFsID09PSBleHBlY3RlZCA6IGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyBJZiBib3RoIHZhbHVlcyBhcmUgaW5zdGFuY2VzIG9mIHR5cGVkIGFycmF5cywgd3JhcCB0aGVpciB1bmRlcmx5aW5nXG4gIC8vIEFycmF5QnVmZmVycyBpbiBhIEJ1ZmZlciBlYWNoIHRvIGluY3JlYXNlIHBlcmZvcm1hbmNlXG4gIC8vIFRoaXMgb3B0aW1pemF0aW9uIHJlcXVpcmVzIHRoZSBhcnJheXMgdG8gaGF2ZSB0aGUgc2FtZSB0eXBlIGFzIGNoZWNrZWQgYnlcbiAgLy8gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyAoYWthIHBUb1N0cmluZykuIE5ldmVyIHBlcmZvcm0gYmluYXJ5XG4gIC8vIGNvbXBhcmlzb25zIGZvciBGbG9hdCpBcnJheXMsIHRob3VnaCwgc2luY2UgZS5nLiArMCA9PT0gLTAgYnV0IHRoZWlyXG4gIC8vIGJpdCBwYXR0ZXJucyBhcmUgbm90IGlkZW50aWNhbC5cbiAgfSBlbHNlIGlmIChpc1ZpZXcoYWN0dWFsKSAmJiBpc1ZpZXcoZXhwZWN0ZWQpICYmXG4gICAgICAgICAgICAgcFRvU3RyaW5nKGFjdHVhbCkgPT09IHBUb1N0cmluZyhleHBlY3RlZCkgJiZcbiAgICAgICAgICAgICAhKGFjdHVhbCBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fFxuICAgICAgICAgICAgICAgYWN0dWFsIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSkge1xuICAgIHJldHVybiBjb21wYXJlKG5ldyBVaW50OEFycmF5KGFjdHVhbC5idWZmZXIpLFxuICAgICAgICAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KGV4cGVjdGVkLmJ1ZmZlcikpID09PSAwO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSBpZiAoaXNCdWZmZXIoYWN0dWFsKSAhPT0gaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG1lbW9zID0gbWVtb3MgfHwge2FjdHVhbDogW10sIGV4cGVjdGVkOiBbXX07XG5cbiAgICB2YXIgYWN0dWFsSW5kZXggPSBtZW1vcy5hY3R1YWwuaW5kZXhPZihhY3R1YWwpO1xuICAgIGlmIChhY3R1YWxJbmRleCAhPT0gLTEpIHtcbiAgICAgIGlmIChhY3R1YWxJbmRleCA9PT0gbWVtb3MuZXhwZWN0ZWQuaW5kZXhPZihleHBlY3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbWVtb3MuYWN0dWFsLnB1c2goYWN0dWFsKTtcbiAgICBtZW1vcy5leHBlY3RlZC5wdXNoKGV4cGVjdGVkKTtcblxuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkLCBzdHJpY3QsIG1lbW9zKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiLCBzdHJpY3QsIGFjdHVhbFZpc2l0ZWRPYmplY3RzKSB7XG4gIGlmIChhID09PSBudWxsIHx8IGEgPT09IHVuZGVmaW5lZCB8fCBiID09PSBudWxsIHx8IGIgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGlmIG9uZSBpcyBhIHByaW1pdGl2ZSwgdGhlIG90aGVyIG11c3QgYmUgc2FtZVxuICBpZiAodXRpbC5pc1ByaW1pdGl2ZShhKSB8fCB1dGlsLmlzUHJpbWl0aXZlKGIpKVxuICAgIHJldHVybiBhID09PSBiO1xuICBpZiAoc3RyaWN0ICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihhKSAhPT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgdmFyIGFJc0FyZ3MgPSBpc0FyZ3VtZW50cyhhKTtcbiAgdmFyIGJJc0FyZ3MgPSBpc0FyZ3VtZW50cyhiKTtcbiAgaWYgKChhSXNBcmdzICYmICFiSXNBcmdzKSB8fCAoIWFJc0FyZ3MgJiYgYklzQXJncykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYUlzQXJncykge1xuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYiwgc3RyaWN0KTtcbiAgfVxuICB2YXIga2EgPSBvYmplY3RLZXlzKGEpO1xuICB2YXIga2IgPSBvYmplY3RLZXlzKGIpO1xuICB2YXIga2V5LCBpO1xuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9PSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0sIHN0cmljdCwgYWN0dWFsVmlzaXRlZE9iamVjdHMpKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgZmFsc2UpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmFzc2VydC5ub3REZWVwU3RyaWN0RXF1YWwgPSBub3REZWVwU3RyaWN0RXF1YWw7XG5mdW5jdGlvbiBub3REZWVwU3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCB0cnVlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBTdHJpY3RFcXVhbCcsIG5vdERlZXBTdHJpY3RFcXVhbCk7XG4gIH1cbn1cblxuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH1cblxuICB0cnkge1xuICAgIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gSWdub3JlLiAgVGhlIGluc3RhbmNlb2YgY2hlY2sgZG9lc24ndCB3b3JrIGZvciBhcnJvdyBmdW5jdGlvbnMuXG4gIH1cblxuICBpZiAoRXJyb3IuaXNQcm90b3R5cGVPZihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gX3RyeUJsb2NrKGJsb2NrKSB7XG4gIHZhciBlcnJvcjtcbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZXJyb3IgPSBlO1xuICB9XG4gIHJldHVybiBlcnJvcjtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHR5cGVvZiBibG9jayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYmxvY2tcIiBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICdzdHJpbmcnKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIGFjdHVhbCA9IF90cnlCbG9jayhibG9jayk7XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICB2YXIgdXNlclByb3ZpZGVkTWVzc2FnZSA9IHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJztcbiAgdmFyIGlzVW53YW50ZWRFeGNlcHRpb24gPSAhc2hvdWxkVGhyb3cgJiYgdXRpbC5pc0Vycm9yKGFjdHVhbCk7XG4gIHZhciBpc1VuZXhwZWN0ZWRFeGNlcHRpb24gPSAhc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmICFleHBlY3RlZDtcblxuICBpZiAoKGlzVW53YW50ZWRFeGNlcHRpb24gJiZcbiAgICAgIHVzZXJQcm92aWRlZE1lc3NhZ2UgJiZcbiAgICAgIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fFxuICAgICAgaXNVbmV4cGVjdGVkRXhjZXB0aW9uKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzKHRydWUsIGJsb2NrLCBlcnJvciwgbWVzc2FnZSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cyhmYWxzZSwgYmxvY2ssIGVycm9yLCBtZXNzYWdlKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHRocm93IGVycjsgfTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCIvKmdsb2JhbCB3aW5kb3csIGdsb2JhbCovXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJ1dGlsXCIpXG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKVxudmFyIG5vdyA9IHJlcXVpcmUoXCJkYXRlLW5vd1wiKVxuXG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2VcbnZhciBjb25zb2xlXG52YXIgdGltZXMgPSB7fVxuXG5pZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBnbG9iYWwuY29uc29sZSkge1xuICAgIGNvbnNvbGUgPSBnbG9iYWwuY29uc29sZVxufSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdy5jb25zb2xlKSB7XG4gICAgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlXG59IGVsc2Uge1xuICAgIGNvbnNvbGUgPSB7fVxufVxuXG52YXIgZnVuY3Rpb25zID0gW1xuICAgIFtsb2csIFwibG9nXCJdLFxuICAgIFtpbmZvLCBcImluZm9cIl0sXG4gICAgW3dhcm4sIFwid2FyblwiXSxcbiAgICBbZXJyb3IsIFwiZXJyb3JcIl0sXG4gICAgW3RpbWUsIFwidGltZVwiXSxcbiAgICBbdGltZUVuZCwgXCJ0aW1lRW5kXCJdLFxuICAgIFt0cmFjZSwgXCJ0cmFjZVwiXSxcbiAgICBbZGlyLCBcImRpclwiXSxcbiAgICBbY29uc29sZUFzc2VydCwgXCJhc3NlcnRcIl1cbl1cblxuZm9yICh2YXIgaSA9IDA7IGkgPCBmdW5jdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdHVwbGUgPSBmdW5jdGlvbnNbaV1cbiAgICB2YXIgZiA9IHR1cGxlWzBdXG4gICAgdmFyIG5hbWUgPSB0dXBsZVsxXVxuXG4gICAgaWYgKCFjb25zb2xlW25hbWVdKSB7XG4gICAgICAgIGNvbnNvbGVbbmFtZV0gPSBmXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbnNvbGVcblxuZnVuY3Rpb24gbG9nKCkge31cblxuZnVuY3Rpb24gaW5mbygpIHtcbiAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpXG59XG5cbmZ1bmN0aW9uIHdhcm4oKSB7XG4gICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKVxufVxuXG5mdW5jdGlvbiBlcnJvcigpIHtcbiAgICBjb25zb2xlLndhcm4uYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKVxufVxuXG5mdW5jdGlvbiB0aW1lKGxhYmVsKSB7XG4gICAgdGltZXNbbGFiZWxdID0gbm93KClcbn1cblxuZnVuY3Rpb24gdGltZUVuZChsYWJlbCkge1xuICAgIHZhciB0aW1lID0gdGltZXNbbGFiZWxdXG4gICAgaWYgKCF0aW1lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHN1Y2ggbGFiZWw6IFwiICsgbGFiZWwpXG4gICAgfVxuXG4gICAgdmFyIGR1cmF0aW9uID0gbm93KCkgLSB0aW1lXG4gICAgY29uc29sZS5sb2cobGFiZWwgKyBcIjogXCIgKyBkdXJhdGlvbiArIFwibXNcIilcbn1cblxuZnVuY3Rpb24gdHJhY2UoKSB7XG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpXG4gICAgZXJyLm5hbWUgPSBcIlRyYWNlXCJcbiAgICBlcnIubWVzc2FnZSA9IHV0aWwuZm9ybWF0LmFwcGx5KG51bGwsIGFyZ3VtZW50cylcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjaylcbn1cblxuZnVuY3Rpb24gZGlyKG9iamVjdCkge1xuICAgIGNvbnNvbGUubG9nKHV0aWwuaW5zcGVjdChvYmplY3QpICsgXCJcXG5cIilcbn1cblxuZnVuY3Rpb24gY29uc29sZUFzc2VydChleHByZXNzaW9uKSB7XG4gICAgaWYgKCFleHByZXNzaW9uKSB7XG4gICAgICAgIHZhciBhcnIgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcbiAgICAgICAgYXNzZXJ0Lm9rKGZhbHNlLCB1dGlsLmZvcm1hdC5hcHBseShudWxsLCBhcnIpKVxuICAgIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gbm93XG5cbmZ1bmN0aW9uIG5vdygpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKClcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iXX0=
