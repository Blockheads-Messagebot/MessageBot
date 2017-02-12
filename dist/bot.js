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
        el.classList.add('is-loading');
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
        button.classList.remove('is-loading');
    } else {
        bhfansapi.getExtensionInfo(id).then(addExtensionCard);
    }
});

hook.on('extension.uninstall', function (id) {
    // Show removed for store install button
    var button = document.querySelector('#mb_extensions [data-id="' + id + '"]');
    if (button) {
        button.textContent = 'Removed';
        button.classList.add('is-disabled');
        setTimeout(function () {
            button.textContent = 'Install';
            button.classList.remove('is-disabled');
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

// First time the bot has been loaded?
var firstLoad = localStorage.length == 0;

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
if (firstLoad) {
    window.MessageBotExtension.install('tutorial');
}

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXZcXE1lc3NhZ2VCb3RFeHRlbnNpb24uanMiLCJkZXZcXGJvdFxcY2hlY2tHcm91cC5qcyIsImRldlxcYm90XFxpbmRleC5qcyIsImRldlxcYm90XFxtaWdyYXRpb24uanMiLCJkZXZcXGJvdFxcc2VuZC5qcyIsImRldlxcY29uc29sZVxcZXhwb3J0cy5qcyIsImRldlxcY29uc29sZVxcaW5kZXguanMiLCJkZXZcXGxpYnJhcmllc1xcYWpheC5qcyIsImRldlxcbGlicmFyaWVzXFxiaGZhbnNhcGkuanMiLCJkZXZcXGxpYnJhcmllc1xcYmxvY2toZWFkcy5qcyIsImRldlxcbGlicmFyaWVzXFxob29rLmpzIiwiZGV2XFxsaWJyYXJpZXNcXHN0b3JhZ2UuanMiLCJkZXZcXGxpYnJhcmllc1xcd29ybGQuanMiLCJkZXZcXG1lc3NhZ2VzXFxhbm5vdW5jZW1lbnRzXFxpbmRleC5qcyIsImRldlxcbWVzc2FnZXNcXGhlbHBlcnNcXGJ1aWxkTWVzc2FnZS5qcyIsImRldlxcbWVzc2FnZXNcXGhlbHBlcnNcXGNoZWNrSm9pbnNBbmRHcm91cC5qcyIsImRldlxcbWVzc2FnZXNcXGhlbHBlcnNcXGluZGV4LmpzIiwiZGV2XFxtZXNzYWdlc1xcaGVscGVyc1xcc2hvd1N1bW1hcnkuanMiLCJkZXZcXG1lc3NhZ2VzXFxpbmRleC5qcyIsImRldlxcbWVzc2FnZXNcXGpvaW5cXGluZGV4LmpzIiwiZGV2XFxtZXNzYWdlc1xcbGVhdmVcXGluZGV4LmpzIiwiZGV2XFxtZXNzYWdlc1xcdHJpZ2dlclxcaW5kZXguanMiLCJkZXZcXHNldHRpbmdzXFxib3RcXGluZGV4LmpzIiwiZGV2XFxzZXR0aW5nc1xcYm90XFxwYWdlLmpzIiwiZGV2XFxzZXR0aW5nc1xcZXh0ZW5zaW9uc1xcaW5kZXguanMiLCJkZXZcXHNldHRpbmdzXFxpbmRleC5qcyIsImRldlxcc3RhcnQuanMiLCJkZXZcXHVpXFxpbmRleC5qcyIsImRldlxcdWlcXGxheW91dFxcaW5kZXguanMiLCJkZXZcXHVpXFxub3RpZmljYXRpb25zXFxhbGVydC5qcyIsImRldlxcdWlcXG5vdGlmaWNhdGlvbnNcXGluZGV4LmpzIiwiZGV2XFx1aVxcbm90aWZpY2F0aW9uc1xcbm90aWZ5LmpzIiwiZGV2XFx1aVxccG9seWZpbGxzXFxkZXRhaWxzLmpzIiwiZGV2XFx1aVxccG9seWZpbGxzXFx0ZW1wbGF0ZS5qcyIsImRldlxcdWlcXHRlbXBsYXRlLmpzIiwibm9kZV9tb2R1bGVzL2Fzc2VydC9hc3NlcnQuanMiLCJub2RlX21vZHVsZXMvY29uc29sZS1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RhdGUtbm93L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLE1BQU0sUUFBUSxLQUFSLENBQVo7QUFDQSxJQUFNLGNBQWMsUUFBUSxXQUFSLENBQXBCO0FBQ0EsSUFBTSxLQUFLLFFBQVEsSUFBUixDQUFYO0FBQ0EsSUFBTSxVQUFVLFFBQVEsbUJBQVIsQ0FBaEI7QUFDQSxJQUFNLE9BQU8sUUFBUSxnQkFBUixDQUFiO0FBQ0EsSUFBTSxNQUFNLFFBQVEsc0JBQVIsQ0FBWjtBQUNBLElBQU0sUUFBUSxRQUFRLGlCQUFSLENBQWQ7QUFDQSxJQUFNLE9BQU8sUUFBUSxnQkFBUixDQUFiOztBQUVBO0FBQ0EsSUFBSSxXQUFXLEVBQWY7QUFDQSxJQUFJLFNBQVMsRUFBYjtBQUNBLElBQU0sYUFBYSxlQUFuQjs7QUFHQTs7Ozs7Ozs7O0FBU0EsU0FBUyxtQkFBVCxDQUE2QixTQUE3QixFQUF3QyxT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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMWVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IGJvdCA9IHJlcXVpcmUoJ2JvdCcpO1xyXG5jb25zdCBib3RfY29uc29sZSA9IHJlcXVpcmUoJy4vY29uc29sZScpO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBhamF4ID0gcmVxdWlyZSgnbGlicmFyaWVzL2FqYXgnKTtcclxuY29uc3QgYXBpID0gcmVxdWlyZSgnbGlicmFyaWVzL2Jsb2NraGVhZHMnKTtcclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcblxyXG4vLyBBcnJheSBvZiBJRHMgdG8gYXV0b2xvYWQgYXQgdGhlIG5leHQgbGF1bmNoLlxyXG52YXIgYXV0b2xvYWQgPSBbXTtcclxudmFyIGxvYWRlZCA9IFtdO1xyXG5jb25zdCBTVE9SQUdFX0lEID0gJ21iX2V4dGVuc2lvbnMnO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGNyZWF0ZSBhIG5ldyBleHRlbnNpb24uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB0ZXN0ID0gTWVzc2FnZUJvdEV4dGVuc2lvbigndGVzdCcpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZXNwYWNlIC0gU2hvdWxkIGJlIHRoZSBzYW1lIGFzIHlvdXIgdmFyaWFibGUgbmFtZS5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gW3VuaW5zdGFsbCA9IHVuZGVmaW5lZF0gLSBPcHRpb25hbCwgc3BlY2lmeSB0aGUgdW5pbnN0YWxsIGZ1bmN0aW9uIHdoaWxlIGNyZWF0aW5nIHRoZSBleHRlbnNpb24sIGluc3RlYWQgb2YgbGF0ZXIuIElmIHNwZWNpZmllZCBoZXJlLCB0aGlzIHdpbGwgYmUgYm91bmQgdG8gdGhlIGV4dGVuc2lvbi5cclxuICogQHJldHVybiB7TWVzc2FnZUJvdEV4dGVuc2lvbn0gLSBUaGUgZXh0ZW5zaW9uIHZhcmlhYmxlLlxyXG4gKi9cclxuZnVuY3Rpb24gTWVzc2FnZUJvdEV4dGVuc2lvbihuYW1lc3BhY2UsIHVuaW5zdGFsbCkge1xyXG4gICAgbG9hZGVkLnB1c2gobmFtZXNwYWNlKTtcclxuICAgIGhvb2suZmlyZSgnZXh0ZW5zaW9uLmluc3RhbGwnLCBuYW1lc3BhY2UpO1xyXG5cclxuICAgIHZhciBleHRlbnNpb24gPSB7XHJcbiAgICAgICAgaWQ6IG5hbWVzcGFjZSxcclxuICAgICAgICBib3QsXHJcbiAgICAgICAgY29uc29sZTogYm90X2NvbnNvbGUsXHJcbiAgICAgICAgdWksXHJcbiAgICAgICAgc3RvcmFnZSxcclxuICAgICAgICBhamF4LFxyXG4gICAgICAgIGFwaSxcclxuICAgICAgICB3b3JsZCxcclxuICAgICAgICBob29rLFxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAodHlwZW9mIHVuaW5zdGFsbCA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgZXh0ZW5zaW9uLnVuaW5zdGFsbCA9IHVuaW5zdGFsbC5iaW5kKGV4dGVuc2lvbik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVc2VkIHRvIGNoYW5nZSB3aGV0aGVyIG9yIG5vdCB0aGUgZXh0ZW5zaW9uIHdpbGwgYmVcclxuICAgICAqIEF1dG9tYXRpY2FsbHkgbG9hZGVkIHRoZSBuZXh0IHRpbWUgdGhlIGJvdCBpcyBsYXVuY2hlZC5cclxuICAgICAqXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogdmFyIHRlc3QgPSBNZXNzYWdlQm90RXh0ZW5zaW9uKCd0ZXN0Jyk7XHJcbiAgICAgKiB0ZXN0LnNldEF1dG9MYXVuY2godHJ1ZSk7XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2x9IHNob3VsZEF1dG9sb2FkXHJcbiAgICAgKi9cclxuICAgIGV4dGVuc2lvbi5zZXRBdXRvTGF1bmNoID0gZnVuY3Rpb24gc2V0QXV0b0xhdW5jaChzaG91bGRBdXRvbG9hZCkge1xyXG4gICAgICAgIGlmICghYXV0b2xvYWQuaW5jbHVkZXMobmFtZXNwYWNlKSAmJiBzaG91bGRBdXRvbG9hZCkge1xyXG4gICAgICAgICAgICBhdXRvbG9hZC5wdXNoKG5hbWVzcGFjZSk7XHJcbiAgICAgICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGF1dG9sb2FkLCBmYWxzZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmICghc2hvdWxkQXV0b2xvYWQpIHtcclxuICAgICAgICAgICAgaWYgKGF1dG9sb2FkLmluY2x1ZGVzKG5hbWVzcGFjZSkpIHtcclxuICAgICAgICAgICAgICAgIGF1dG9sb2FkLnNwbGljZShhdXRvbG9hZC5pbmRleE9mKG5hbWVzcGFjZSksIDEpO1xyXG4gICAgICAgICAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgYXV0b2xvYWQsIGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIGV4dGVuc2lvbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRyaWVzIHRvIGxvYWQgdGhlIHJlcXVlc3RlZCBleHRlbnNpb24gYnkgSUQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxyXG4gKi9cclxuTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsID0gZnVuY3Rpb24gaW5zdGFsbChpZCkge1xyXG4gICAgaWYgKCFsb2FkZWQuaW5jbHVkZXMoaWQpKSB7XHJcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XHJcbiAgICAgICAgZWwuc3JjID0gYC8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvZXh0ZW5zaW9uLyR7aWR9L2NvZGUvcmF3YDtcclxuICAgICAgICBlbC5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xyXG4gICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVuaW5zdGFsbHMgYW4gZXh0ZW5zaW9uLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcclxuICovXHJcbk1lc3NhZ2VCb3RFeHRlbnNpb24udW5pbnN0YWxsID0gZnVuY3Rpb24gdW5pbnN0YWxsKGlkKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdpbmRvd1tpZF0udW5pbnN0YWxsKCk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgLy9Ob3QgaW5zdGFsbGVkLCBvciBubyB1bmluc3RhbGwgZnVuY3Rpb24uXHJcbiAgICB9XHJcblxyXG4gICAgd2luZG93W2lkXSA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICBpZiAoYXV0b2xvYWQuaW5jbHVkZXMoaWQpKSB7XHJcbiAgICAgICAgYXV0b2xvYWQuc3BsaWNlKGF1dG9sb2FkLmluZGV4T2YoaWQpLCAxKTtcclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBhdXRvbG9hZCwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChsb2FkZWQuaW5jbHVkZXMoaWQpKSB7XHJcbiAgICAgICAgbG9hZGVkLnNwbGljZShsb2FkZWQuaW5kZXhPZihpZCksIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIGhvb2suZmlyZSgnZXh0ZW5zaW9uLnVuaW5zdGFsbCcsIGlkKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGNoZWNrIGlmIGFuIGV4dGVuc2lvbiBoYXMgYmVlbiBsb2FkZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuTWVzc2FnZUJvdEV4dGVuc2lvbi5pc0xvYWRlZCA9IGZ1bmN0aW9uIGlzTG9hZGVkKGlkKSB7XHJcbiAgICByZXR1cm4gbG9hZGVkLmluY2x1ZGVzKGlkKTtcclxufTtcclxuXHJcbi8vIExvYWQgZXh0ZW5zaW9ucyB0aGF0IHNldCB0aGVtc2VsdmVzIHRvIGF1dG9sb2FkIGxhc3QgbGF1bmNoLlxyXG5zdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSwgZmFsc2UpXHJcbiAgICAuZm9yRWFjaChNZXNzYWdlQm90RXh0ZW5zaW9uLmluc3RhbGwpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNZXNzYWdlQm90RXh0ZW5zaW9uO1xyXG4iLCIvKipcclxuICogQGZpbGUgRGVwcmljYXRlZC4gVXNlIHdvcmxkLmlzW0dyb3VwXSBpbnN0ZWFkLlxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgY2hlY2tHcm91cFxyXG59O1xyXG5cclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBjaGVjayBpZiB1c2VycyBhcmUgaW4gZGVmaW5lZCBncm91cHMuXHJcbiAqXHJcbiAqIEBkZXByaWNhdGVkXHJcbiAqIEBleGFtcGxlXHJcbiAqIGNoZWNrR3JvdXAoJ2FkbWluJywgJ1NFUlZFUicpIC8vIHRydWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwIHRoZSBncm91cCB0byBjaGVja1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdXNlciB0byBjaGVja1xyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tHcm91cChncm91cCwgbmFtZSkge1xyXG4gICAgY29uc29sZS53YXJuKCdib3QuY2hlY2tHcm91cCBpcyBkZXByaWNhdGVkLiBVc2Ugd29ybGQuaXNBZG1pbiwgd29ybGQuaXNNb2QsIGV0Yy4gaW5zdGVhZCcpO1xyXG5cclxuICAgIG5hbWUgPSBuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICBzd2l0Y2ggKGdyb3VwLnRvTG9jYWxlTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICBjYXNlICdhbGwnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNQbGF5ZXIobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnYWRtaW4nOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNBZG1pbihuYW1lKTtcclxuICAgICAgICBjYXNlICdtb2QnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNNb2QobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnc3RhZmYnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNTdGFmZihuYW1lKTtcclxuICAgICAgICBjYXNlICdvd25lcic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc093bmVyKG5hbWUpO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG4iLCJjb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuXHJcbmNvbnN0IGJvdCA9IE9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vc2VuZCcpLFxyXG4gICAgcmVxdWlyZSgnLi9jaGVja0dyb3VwJylcclxuKTtcclxuXHJcbmJvdC52ZXJzaW9uID0gJzYuMS4wJztcclxuXHJcbi8qKlxyXG4gKiBAZGVwcmljYXRlZCBzaW5jZSA2LjEuMC4gVXNlIGV4LndvcmxkIGluc3RlYWQuXHJcbiAqL1xyXG5ib3Qud29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuXHJcbnN0b3JhZ2Uuc2V0KCdtYl92ZXJzaW9uJywgYm90LnZlcnNpb24sIGZhbHNlKTtcclxuIiwiZnVuY3Rpb24gdXBkYXRlKGtleXMsIG9wZXJhdG9yKSB7XHJcbiAgICBPYmplY3Qua2V5cyhsb2NhbFN0b3JhZ2UpLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IG9mIGtleXMpIHtcclxuICAgICAgICAgICAgaWYgKGl0ZW0uc3RhcnRzV2l0aChrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShpdGVtLCBvcGVyYXRvcihsb2NhbFN0b3JhZ2UuZ2V0SXRlbShpdGVtKSkpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy9qc2hpbnQgLVcwODZcclxuLy9ObyBicmVhayBzdGF0ZW1lbnRzIGFzIHdlIHdhbnQgdG8gZXhlY3V0ZSBhbGwgdXBkYXRlcyBhZnRlciBtYXRjaGVkIHZlcnNpb24gdW5sZXNzIG90aGVyd2lzZSBub3RlZC5cclxuc3dpdGNoIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnbWJfdmVyc2lvbicpKSB7XHJcbiAgICBjYXNlIG51bGw6XHJcbiAgICAgICAgYnJlYWs7IC8vTm90aGluZyB0byBtaWdyYXRlXHJcbiAgICBjYXNlICc1LjIuMCc6XHJcbiAgICBjYXNlICc1LjIuMSc6XHJcbiAgICAgICAgLy9XaXRoIDYuMCwgbmV3bGluZXMgYXJlIGRpcmVjdGx5IHN1cHBvcnRlZCBpbiBtZXNzYWdlcyBieSB0aGUgYm90LlxyXG4gICAgICAgIHVwZGF0ZShbJ2Fubm91bmNlbWVudEFycicsICdqb2luQXJyJywgJ2xlYXZlQXJyJywgJ3RyaWdnZXJBcnInXSwgZnVuY3Rpb24ocmF3KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VkID0gSlNPTi5wYXJzZShyYXcpO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobXNnLm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbXNnLm1lc3NhZ2UgPSBtc2cubWVzc2FnZS5yZXBsYWNlKC9cXFxcbi9nLCAnXFxuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocGFyc2VkKTtcclxuICAgICAgICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYnJlYWs7IC8vTmV4dCBidWdmaXggb25seSByZWxhdGVzIHRvIDYuMCBib3QuXHJcbiAgICBjYXNlICc2LjAuMGEnOlxyXG4gICAgY2FzZSAnNi4wLjAnOlxyXG4gICAgICAgIGFsZXJ0KFwiRHVlIHRvIGEgYnVnIGluIHRoZSA2LjAuMCB2ZXJzaW9uIG9mIHRoZSBib3QsIHlvdXIgam9pbiBhbmQgbGVhdmUgbWVzc2FnZXMgbWF5IGJlIHN3YXBwZWQuIFNvcnJ5ISBUaGlzIGNhbm5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5LiBUaGlzIG1lc3NhZ2Ugd2lsbCBub3QgYmUgc2hvd24gYWdhaW4uXCIpO1xyXG4gICAgICAgIGJyZWFrOyAvL05leHQgYnVnZml4IG9ubHkgcmVsYXRlcyB0byA2LjAuMSAvIDYuMC4yLlxyXG4gICAgY2FzZSAnNi4wLjEnOlxyXG4gICAgY2FzZSAnNi4wLjInOlxyXG4gICAgICAgIGFsZXJ0KFwiRHVlIHRvIGEgYnVnIGluIDYuMC4xIC8gNi4wLjIsIGdyb3VwcyBtYXkgaGF2ZSBiZWVuIG1peGVkIHVwIG9uIEpvaW4sIExlYXZlLCBhbmQgVHJpZ2dlciBtZXNzYWdlcy4gU29ycnkhIFRoaXMgY2Fubm90IGJlIGZpeGVkIGF1dG9tYXRpY2FsbHkgaWYgaXQgb2NjdXJlZCBvbiB5b3VyIGJvdC4gQW5ub3VuY2VtZW50cyBoYXZlIGFsc28gYmVlbiBmaXhlZC5cIik7XHJcbiAgICBjYXNlICc2LjAuMyc6XHJcbiAgICBjYXNlICc2LjAuNCc6XHJcbiAgICBjYXNlICc2LjAuNSc6XHJcbiAgICBjYXNlICc2LjAuNic6XHJcbiAgICBjYXNlICc2LjEuMGEnOlxyXG4gICAgICAgIC8vTm9ybWFsaXplIGdyb3VwcyB0byBsb3dlciBjYXNlLlxyXG4gICAgICAgIHVwZGF0ZShbJ2pvaW5BcnInLCAnbGVhdmVBcnInLCAndHJpZ2dlckFyciddLCBmdW5jdGlvbihyYXcpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGxldCBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdyk7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIG1zZy5ncm91cCA9IG1zZy5ncm91cC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1zZy5ub3RfZ3JvdXAgPSBtc2cubm90X2dyb3VwLnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXJzZWQpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbn1cclxuLy9qc2hpbnQgK1cwODZcclxuIiwidmFyIGFwaSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ibG9ja2hlYWRzJyk7XHJcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJ3NldHRpbmdzL2JvdCcpO1xyXG5cclxudmFyIHF1ZXVlID0gW107XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNlbmQsXHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBxdWV1ZSBhIG1lc3NhZ2UgdG8gYmUgc2VudC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2VuZCgnSGVsbG8hJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIGJlIHNlbnQuXHJcbiAqL1xyXG5mdW5jdGlvbiBzZW5kKG1lc3NhZ2UpIHtcclxuICAgIGlmIChzZXR0aW5ncy5zcGxpdE1lc3NhZ2VzKSB7XHJcbiAgICAgICAgLy9GSVhNRTogSWYgdGhlIGJhY2tzbGFzaCBiZWZvcmUgdGhlIHRva2VuIGlzIGVzY2FwZWQgYnkgYW5vdGhlciBiYWNrc2xhc2ggdGhlIHRva2VuIHNob3VsZCBzdGlsbCBzcGxpdCB0aGUgbWVzc2FnZS5cclxuICAgICAgICBsZXQgc3RyID0gbWVzc2FnZS5zcGxpdChzZXR0aW5ncy5zcGxpdFRva2VuKTtcclxuICAgICAgICBsZXQgdG9TZW5kID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBjdXJyID0gc3RyW2ldO1xyXG4gICAgICAgICAgICBpZiAoY3VycltjdXJyLmxlbmd0aCAtIDFdID09ICdcXFxcJyAmJiBpIDwgc3RyLmxlbmd0aCArIDEpIHtcclxuICAgICAgICAgICAgICAgIGN1cnIgKz0gc2V0dGluZ3Muc3BsaXRUb2tlbiArIHN0clsrK2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRvU2VuZC5wdXNoKGN1cnIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TZW5kLmZvckVhY2gobXNnID0+IHF1ZXVlLnB1c2gobXNnKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHF1ZXVlLnB1c2gobWVzc2FnZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBXYXRjaGVzIHRoZSBxdWV1ZSBmb3IgbmV3IG1lc3NhZ2VzIHRvIHNlbmQgYW5kIHNlbmRzIHRoZW0gYXMgc29vbiBhcyBwb3NzaWJsZS5cclxuICovXHJcbihmdW5jdGlvbiBjaGVja1F1ZXVlKCkge1xyXG4gICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrUXVldWUsIDUwMCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGFwaS5zZW5kKHF1ZXVlLnNoaWZ0KCkpXHJcbiAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrUXVldWUsIDEwMDApO1xyXG4gICAgICAgIH0pO1xyXG59KCkpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHdyaXRlLFxyXG4gICAgY2xlYXJcclxufTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlKG1zZywgbmFtZSA9ICcnLCBuYW1lQ2xhc3MgPSAnJykge1xyXG4gICAgdmFyIG1zZ0VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgIGlmIChuYW1lQ2xhc3MpIHtcclxuICAgICAgICBtc2dFbC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgbmFtZUNsYXNzKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbmFtZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgbmFtZUVsLnRleHRDb250ZW50ID0gbmFtZTtcclxuXHJcbiAgICB2YXIgY29udGVudEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgaWYgKG5hbWUpIHtcclxuICAgICAgICBjb250ZW50RWwudGV4dENvbnRlbnQgPSBgOiAke21zZ31gO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjb250ZW50RWwudGV4dENvbnRlbnQgPSBtc2c7XHJcbiAgICB9XHJcbiAgICBtc2dFbC5hcHBlbmRDaGlsZChuYW1lRWwpO1xyXG4gICAgbXNnRWwuYXBwZW5kQ2hpbGQoY29udGVudEVsKTtcclxuXHJcbiAgICB2YXIgY2hhdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIHVsJyk7XHJcbiAgICBjaGF0LmFwcGVuZENoaWxkKG1zZ0VsKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xlYXIoKSB7XHJcbiAgICB2YXIgY2hhdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIHVsJyk7XHJcbiAgICBjaGF0LmlubmVySFRNTCA9ICcnO1xyXG59XHJcbiIsImNvbnN0IHNlbGYgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZXhwb3J0cycpO1xyXG5cclxuY29uc3Qgc2V0dGluZ3MgPSByZXF1aXJlKCdzZXR0aW5ncy9ib3QnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcbmNvbnN0IHNlbmQgPSByZXF1aXJlKCdib3QnKS5zZW5kO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcblxyXG5cclxuLy8gVE9ETzogUGFyc2UgdGhlc2UgYW5kIHByb3ZpZGUgb3B0aW9ucyB0byBzaG93L2hpZGUgZGlmZmVyZW50IG9uZXMuXHJcbmhvb2sub24oJ3dvcmxkLm90aGVyJywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgc2VsZi53cml0ZShtZXNzYWdlLCB1bmRlZmluZWQsICdvdGhlcicpO1xyXG59KTtcclxuXHJcbmhvb2sub24oJ3dvcmxkLm1lc3NhZ2UnLCBmdW5jdGlvbihuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICBsZXQgbXNnQ2xhc3MgPSAncGxheWVyJztcclxuICAgIGlmICh3b3JsZC5pc1N0YWZmKG5hbWUpKSB7XHJcbiAgICAgICAgbXNnQ2xhc3MgPSAnc3RhZmYnO1xyXG4gICAgICAgIGlmICh3b3JsZC5pc01vZChuYW1lKSkge1xyXG4gICAgICAgICAgICBtc2dDbGFzcyArPSAnIG1vZCc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy9IYXMgdG8gYmUgYWRtaW5cclxuICAgICAgICAgICAgbXNnQ2xhc3MgKz0gJyBhZG1pbic7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpKSB7XHJcbiAgICAgICAgbXNnQ2xhc3MgKz0gJyBjb21tYW5kJztcclxuICAgIH1cclxuICAgIHNlbGYud3JpdGUobWVzc2FnZSwgbmFtZSwgbXNnQ2xhc3MpO1xyXG59KTtcclxuXHJcbmhvb2sub24oJ3dvcmxkLnNlcnZlcmNoYXQnLCBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICBzZWxmLndyaXRlKG1lc3NhZ2UsICdTRVJWRVInLCAnYWRtaW4nKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5zZW5kJywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpKSB7XHJcbiAgICAgICAgc2VsZi53cml0ZShtZXNzYWdlLCAnU0VSVkVSJywgJ2FkbWluIGNvbW1hbmQnKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vL01lc3NhZ2UgaGFuZGxlcnNcclxuaG9vay5vbignd29ybGQuam9pbicsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckpvaW4obmFtZSwgaXApIHtcclxuICAgIHNlbGYud3JpdGUoYCR7bmFtZX0gKCR7aXB9KSBoYXMgam9pbmVkIHRoZSBzZXJ2ZXJgLCAnU0VSVkVSJywgJ2pvaW4gd29ybGQgYWRtaW4nKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5sZWF2ZScsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckxlYXZlKG5hbWUpIHtcclxuICAgIHNlbGYud3JpdGUoYCR7bmFtZX0gaGFzIGxlZnQgdGhlIHNlcnZlcmAsICdTRVJWRVInLCBgbGVhdmUgd29ybGQgYWRtaW5gKTtcclxufSk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignQ29uc29sZScpO1xyXG50YWIuaW5uZXJIVE1MID0gJzxzdHlsZT4nICtcclxuICAgIFwiI21iX2NvbnNvbGV7aGVpZ2h0OmNhbGMoMTAwJSAtIDMuNWVtKX0jbWJfY29uc29sZSAubW9kPnNwYW46Zmlyc3QtY2hpbGR7Y29sb3I6IzA1ZjUyOX0jbWJfY29uc29sZSAuYWRtaW4+c3BhbjpmaXJzdC1jaGlsZHtjb2xvcjojMmIyNmJkfSNtYl9jb25zb2xlIC5jaGF0e21hcmdpbjowIDFlbTttYXgtaGVpZ2h0OjEwMCU7b3ZlcmZsb3cteTphdXRvfSNtYl9jb25zb2xlIC5jaGF0LWNvbnRyb2x7cG9zaXRpb246Zml4ZWQ7Ym90dG9tOjA7d2lkdGg6MTAwdnd9I21iX2NvbnNvbGUgLmNoYXQtY29udHJvbCAuY29udHJvbHttYXJnaW46MWVtfVxcblwiICtcclxuICAgICc8L3N0eWxlPicgK1xyXG4gICAgXCI8ZGl2IGlkPVxcXCJtYl9jb25zb2xlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY2hhdFxcXCI+XFxyXFxuICAgICAgICA8dWw+PC91bD5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNoYXQtY29udHJvbFxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjb250cm9sIGhhcy1hZGRvbnNcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiaW5wdXQgaXMtZXhwYW5kZWRcXFwiLz5cXHJcXG4gICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVxcXCJpbnB1dCBidXR0b24gaXMtcHJpbWFyeVxcXCI+U0VORDwvYnV0dG9uPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxuLy8gSWYgZW5hYmxlZCwgc2hvdyBtZXNzYWdlcyBmb3IgbmV3IGNoYXQgd2hlbiBub3Qgb24gdGhlIGNvbnNvbGUgcGFnZVxyXG5ob29rLm9uKCd3b3JsZC5jaGF0JywgZnVuY3Rpb24obmFtZSwgbWVzc2FnZSkge1xyXG4gICAgaWYgKHNldHRpbmdzLm5vdGlmeSAmJiAhdGFiLmNsYXNzTGlzdC5jb250YWlucygndmlzaWJsZScpKSB7XHJcbiAgICAgICAgdWkubm90aWZ5KGAke25hbWV9OiAke21lc3NhZ2V9YCwgMS41KTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuLy8gQXV0byBzY3JvbGwgd2hlbiBuZXcgbWVzc2FnZXMgYXJlIGFkZGVkIHRvIHRoZSBwYWdlLCB1bmxlc3MgdGhlIG93bmVyIGlzIHJlYWRpbmcgb2xkIGNoYXQuXHJcbihuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiBzaG93TmV3Q2hhdCgpIHtcclxuICAgIGxldCBjb250YWluZXIgPSB0YWIucXVlcnlTZWxlY3RvcignLmNoYXQnKTtcclxuICAgIGxldCBsYXN0TGluZSA9IHRhYi5xdWVyeVNlbGVjdG9yKCdsaTpsYXN0LWNoaWxkJyk7XHJcblxyXG4gICAgaWYgKCFjb250YWluZXIgfHwgIWxhc3RMaW5lKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjb250YWluZXIuc2Nyb2xsSGVpZ2h0IC0gY29udGFpbmVyLmNsaWVudEhlaWdodCAtIGNvbnRhaW5lci5zY3JvbGxUb3AgPD0gbGFzdExpbmUuY2xpZW50SGVpZ2h0ICogMTApIHtcclxuICAgICAgICBsYXN0TGluZS5zY3JvbGxJbnRvVmlldyhmYWxzZSk7XHJcbiAgICB9XHJcbn0pKS5vYnNlcnZlKHRhYi5xdWVyeVNlbGVjdG9yKCcuY2hhdCcpLCB7Y2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlfSk7XHJcblxyXG5cclxuLy8gUmVtb3ZlIG9sZCBjaGF0IHRvIHJlZHVjZSBtZW1vcnkgdXNhZ2VcclxuKG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIHJlbW92ZU9sZENoYXQoKSB7XHJcbiAgICB2YXIgY2hhdCA9IHRhYi5xdWVyeVNlbGVjdG9yKCd1bCcpO1xyXG5cclxuICAgIHdoaWxlIChjaGF0LmNoaWxkcmVuLmxlbmd0aCA+IDUwMCkge1xyXG4gICAgICAgIGNoYXQuY2hpbGRyZW5bMF0ucmVtb3ZlKCk7XHJcbiAgICB9XHJcbn0pKS5vYnNlcnZlKHRhYi5xdWVyeVNlbGVjdG9yKCcuY2hhdCcpLCB7Y2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlfSk7XHJcblxyXG4vLyBMaXN0ZW4gZm9yIHRoZSB1c2VyIHRvIHNlbmQgbWVzc2FnZXNcclxuZnVuY3Rpb24gdXNlclNlbmQoKSB7XHJcbiAgICB2YXIgaW5wdXQgPSB0YWIucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcclxuICAgIGhvb2suZmlyZSgnY29uc29sZS5zZW5kJywgaW5wdXQudmFsdWUpO1xyXG4gICAgc2VuZChpbnB1dC52YWx1ZSk7XHJcbiAgICBpbnB1dC52YWx1ZSA9ICcnO1xyXG4gICAgaW5wdXQuZm9jdXMoKTtcclxufVxyXG5cclxudGFiLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0JykuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICBpZiAoZXZlbnQua2V5ID09IFwiRW50ZXJcIiB8fCBldmVudC5rZXlDb2RlID09IDEzKSB7XHJcbiAgICAgICAgdXNlclNlbmQoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG50YWIucXVlcnlTZWxlY3RvcignYnV0dG9uJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB1c2VyU2VuZCk7XHJcbiIsIi8vVE9ETzogVXNlIGZldGNoXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBHRVQgYSBwYWdlLiBQYXNzZXMgdGhlIHJlc3BvbnNlIG9mIHRoZSBYSFIgaW4gdGhlIHJlc29sdmUgcHJvbWlzZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogLy9zZW5kcyBhIEdFVCByZXF1ZXN0IHRvIC9zb21lL3VybC5waHA/YT10ZXN0XHJcbiAqIGdldCgnL3NvbWUvdXJsLnBocCcsIHthOiAndGVzdCd9KS50aGVuKGNvbnNvbGUubG9nKVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNTdHJcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldCh1cmwgPSAnLycsIHBhcmFtcyA9IHt9KSB7XHJcbiAgICBpZiAoT2JqZWN0LmtleXMocGFyYW1zKS5sZW5ndGgpIHtcclxuICAgICAgICB2YXIgYWRkaXRpb24gPSB1cmxTdHJpbmdpZnkocGFyYW1zKTtcclxuICAgICAgICBpZiAodXJsLmluY2x1ZGVzKCc/JykpIHtcclxuICAgICAgICAgICAgdXJsICs9IGAmJHthZGRpdGlvbn1gO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHVybCArPSBgPyR7YWRkaXRpb259YDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHhocignR0VUJywgdXJsLCB7fSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhIEpTT04gb2JqZWN0IGluIHRoZSBwcm9taXNlIHJlc29sdmUgbWV0aG9kLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbU9ialxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0SlNPTih1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiBnZXQodXJsLCBwYXJhbU9iaikudGhlbihKU09OLnBhcnNlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBtYWtlIGEgcG9zdCByZXF1ZXN0XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtT2JqXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBwb3N0KHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIHhocignUE9TVCcsIHVybCwgcGFyYW1PYmopO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGZldGNoIEpTT04gZnJvbSBhIHBhZ2UgdGhyb3VnaCBwb3N0LlxyXG4gKlxyXG4gKiBAcGFyYW0gc3RyaW5nIHVybFxyXG4gKiBAcGFyYW0gc3RyaW5nIHBhcmFtT2JqXHJcbiAqIEByZXR1cm4gUHJvbWlzZVxyXG4gKi9cclxuZnVuY3Rpb24gcG9zdEpTT04odXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4gcG9zdCh1cmwsIHBhcmFtT2JqKS50aGVuKEpTT04ucGFyc2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiogSGVscGVyIGZ1bmN0aW9uIHRvIG1ha2UgWEhSIHJlcXVlc3RzLCBpZiBwb3NzaWJsZSB1c2UgdGhlIGdldCBhbmQgcG9zdCBmdW5jdGlvbnMgaW5zdGVhZC5cclxuKlxyXG4qIEBkZXByaWNhdGVkIHNpbmNlIHZlcnNpb24gNi4xXHJcbiogQHBhcmFtIHN0cmluZyBwcm90b2NvbFxyXG4qIEBwYXJhbSBzdHJpbmcgdXJsXHJcbiogQHBhcmFtIG9iamVjdCBwYXJhbU9iaiAtLSBXQVJOSU5HLiBPbmx5IGFjY2VwdHMgc2hhbGxvdyBvYmplY3RzLlxyXG4qIEByZXR1cm4gUHJvbWlzZVxyXG4qL1xyXG5mdW5jdGlvbiB4aHIocHJvdG9jb2wsIHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgdmFyIHBhcmFtU3RyID0gdXJsU3RyaW5naWZ5KHBhcmFtT2JqKTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICB2YXIgcmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgcmVxLm9wZW4ocHJvdG9jb2wsIHVybCk7XHJcbiAgICAgICAgcmVxLnNldFJlcXVlc3RIZWFkZXIoJ1gtUmVxdWVzdGVkLVdpdGgnLCAnWE1MSHR0cFJlcXVlc3QnKTtcclxuICAgICAgICBpZiAocHJvdG9jb2wgPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICAgIHJlcS5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXEub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09IDIwMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXEuc3RhdHVzVGV4dCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvLyBIYW5kbGUgbmV0d29yayBlcnJvcnNcclxuICAgICAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZWplY3QoRXJyb3IoXCJOZXR3b3JrIEVycm9yXCIpKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChwYXJhbVN0cikge1xyXG4gICAgICAgICAgICByZXEuc2VuZChwYXJhbVN0cik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVxLnNlbmQoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIHN0cmluZ2lmeSB1cmwgcGFyYW1ldGVyc1xyXG4gKi9cclxuZnVuY3Rpb24gdXJsU3RyaW5naWZ5KG9iaikge1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iailcclxuICAgIC5tYXAoayA9PiBgJHtlbmNvZGVVUklDb21wb25lbnQoayl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KG9ialtrXSl9YClcclxuICAgIC5qb2luKCcmJyk7XHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHt4aHIsIGdldCwgZ2V0SlNPTiwgcG9zdCwgcG9zdEpTT059O1xyXG4iLCIvKipcclxuICogQGZpbGUgQ29udGFpbnMgZnVuY3Rpb25zIHRvIGludGVyYWN0IHdpdGggYmxvY2toZWFkc2ZhbnMuY29tIC0gY2Fubm90IGJlIHVzZWQgYnkgZXh0ZW5zaW9ucy5cclxuICovXHJcblxyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgYWpheCA9IHJlcXVpcmUoJ2xpYnJhcmllcy9hamF4Jyk7XHJcblxyXG5jb25zdCBBUElfVVJMUyA9IHtcclxuICAgIFNUT1JFOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9hcGkvZXh0ZW5zaW9uL3N0b3JlJyxcclxuICAgIE5BTUU6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2FwaS9leHRlbnNpb24vaW5mbycsXHJcbiAgICBFUlJPUjogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvYXBpL2Vycm9yJyxcclxufTtcclxuXHJcbnZhciBjYWNoZSA9IHtcclxuICAgIGluZm86IG5ldyBNYXAoKSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGdldCBwdWJsaWMgZXh0ZW5zaW9uc1xyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRTdG9yZSgpLnRoZW4oc3RvcmUgPT4gY29uc29sZS5sb2coc3RvcmUpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gdXNlIHRoZSBjYWNoZWQgcmVzcG9uc2Ugc2hvdWxkIGJlIGNsZWFyZWQuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9IHJlc29sdmVzIHdpdGggdGhlIHJlc3BvbnNlXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRTdG9yZShyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRTdG9yZSkge1xyXG4gICAgICAgIGNhY2hlLmdldFN0b3JlID0gYWpheC5nZXRKU09OKEFQSV9VUkxTLlNUT1JFKVxyXG4gICAgICAgICAgICAudGhlbihzdG9yZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvL0J1aWxkIHRoZSBpbml0aWFsIG5hbWVzIG1hcFxyXG4gICAgICAgICAgICAgICAgaWYgKHN0b3JlLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGV4IG9mIHN0b3JlLmV4dGVuc2lvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5pbmZvLnNldChleC5pZCwgZXgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0U3RvcmU7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbmFtZSBvZiB0aGUgcHJvdmlkZWQgZXh0ZW5zaW9uIElELlxyXG4gKiBJZiB0aGUgZXh0ZW5zaW9uIHdhcyBub3QgZm91bmQsIHJlc29sdmVzIHdpdGggdGhlIG9yaWdpbmFsIHBhc3NlZCBJRC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0RXh0ZW5zaW9uSW5mbygndGVzdCcpLnRoZW4oaW5mbyA9PiBjb25zb2xlLmxvZyhpbmZvKSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCB0aGUgaWQgdG8gc2VhcmNoIGZvci5cclxuICogQHJldHVybiB7UHJvbWlzZX0gcmVzb2x2ZXMgd2l0aCB0aGUgZXh0ZW5zaW9uJ3MgbmFtZSwgc25pcHBldCwgYW5kIElELlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uSW5mbyhpZCkge1xyXG4gICAgaWYgKGNhY2hlLmluZm8uaGFzKGlkKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGUuaW5mby5nZXQoaWQpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWpheC5nZXRKU09OKEFQSV9VUkxTLk5BTUUsIHtpZH0pLnRoZW4oKHtpZCwgdGl0bGUsIHNuaXBwZXR9KSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlLmluZm9cclxuICAgICAgICAgICAgLnNldChpZCwge2lkLCB0aXRsZSwgc25pcHBldH0pXHJcbiAgICAgICAgICAgIC5nZXQoaWQpO1xyXG4gICAgfSwgZXJyID0+IHtcclxuICAgICAgICByZXBvcnRFcnJvcihlcnIpO1xyXG4gICAgICAgIHJldHVybiB7bmFtZTogaWQsIGlkOiBpZCwgc25pcHBldDogJ05vIGRlc2NyaXB0aW9uLid9O1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVwb3J0cyBhbiBlcnJvciBzbyB0aGF0IGl0IGNhbiBiZSByZXZpZXdlZCBhbmQgZml4ZWQgYnkgZXh0ZW5zaW9uIG9yIGJvdCBkZXZlbG9wZXJzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiByZXBvcnRFcnJvcihFcnJvcihcIlJlcG9ydCBtZVwiKSk7XHJcbiAqIEBwYXJhbSB7RXJyb3J9IGVyciB0aGUgZXJyb3IgdG8gcmVwb3J0XHJcbiAqL1xyXG5mdW5jdGlvbiByZXBvcnRFcnJvcihlcnIpIHtcclxuICAgIGFqYXgucG9zdEpTT04oQVBJX1VSTFMuRVJST1IsIHtcclxuICAgICAgICAgICAgZXJyb3JfdGV4dDogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgIGVycm9yX2ZpbGU6IGVyci5maWxlbmFtZSxcclxuICAgICAgICAgICAgZXJyb3Jfcm93OiBlcnIubGluZW5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX2NvbHVtbjogZXJyLmNvbG5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX3N0YWNrOiBlcnIuc3RhY2sgfHwgJycsXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigocmVzcCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgaG9vay5maXJlKCdlcnJvcl9yZXBvcnQnLCAnU29tZXRoaW5nIHdlbnQgd3JvbmcsIGl0IGhhcyBiZWVuIHJlcG9ydGVkLicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaG9vay5maXJlKCdlcnJvcl9yZXBvcnQnLCBgRXJyb3IgcmVwb3J0aW5nIGV4Y2VwdGlvbjogJHtyZXNwLm1lc3NhZ2V9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBnZXRTdG9yZSxcclxuICAgIGdldEV4dGVuc2lvbkluZm8sXHJcbiAgICByZXBvcnRFcnJvcixcclxufTtcclxuIiwidmFyIGFqYXggPSByZXF1aXJlKCcuL2FqYXgnKTtcclxudmFyIGhvb2sgPSByZXF1aXJlKCcuL2hvb2snKTtcclxudmFyIGJoZmFuc2FwaSA9IHJlcXVpcmUoJy4vYmhmYW5zYXBpJyk7XHJcblxyXG5jb25zdCB3b3JsZElkID0gd2luZG93LndvcmxkSWQ7XHJcbnZhciBjYWNoZSA9IHtcclxuICAgIGZpcnN0SWQ6IDAsXHJcbn07XHJcblxyXG4vLyBVc2VkIHRvIHBhcnNlIG1lc3NhZ2VzIG1vcmUgYWNjdXJhdGVseVxyXG52YXIgd29ybGQgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW11cclxufTtcclxuZ2V0T25saW5lUGxheWVycygpXHJcbiAgICAudGhlbihwbGF5ZXJzID0+IHdvcmxkLnBsYXllcnMgPSBbLi4ubmV3IFNldChwbGF5ZXJzLmNvbmNhdCh3b3JsZC5wbGF5ZXJzKSldKTtcclxuXHJcbmdldFdvcmxkTmFtZSgpXHJcbiAgICAudGhlbihuYW1lID0+IHdvcmxkLm5hbWUgPSBuYW1lKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHdvcmxkU3RhcnRlZCxcclxuICAgIGdldExvZ3MsXHJcbiAgICBnZXRMaXN0cyxcclxuICAgIGdldEhvbWVwYWdlLFxyXG4gICAgZ2V0T25saW5lUGxheWVycyxcclxuICAgIGdldE93bmVyTmFtZSxcclxuICAgIGdldFdvcmxkTmFtZSxcclxuICAgIHNlbmQsXHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIHRoZSB3b3JsZCBpZiBuZWNjZXNzYXJ5LCByZWplY3RzIGlmIHRoZSB3b3JsZCB0YWtlcyB0b28gbG9uZyB0byBzdGFydCBvciBpcyB1bmF2YWlsaWJsZVxyXG4gKiBSZWZhY3RvcmluZyB3ZWxjb21lLiBUaGlzIHNlZW1zIG92ZXJseSBweXJhbWlkIGxpa2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHdvcmxkU3RhcnRlZCgpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ3N0YXJ0ZWQhJykpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWNoZWNrIGlmIHRoZSB3b3JsZCBpcyBzdGFydGVkLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gd29ybGRTdGFydGVkKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLndvcmxkU3RhcnRlZCkge1xyXG4gICAgICAgIGNhY2hlLndvcmxkU3RhcnRlZCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdmFyIGZhaWxzID0gMDtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uIGNoZWNrKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ291bGQgdGhpcyBiZSBtb3JlIHNpbXBsaWZpZWQ/XHJcbiAgICAgICAgICAgICAgICBhamF4LnBvc3RKU09OKCcvYXBpJywgeyBjb21tYW5kOiAnc3RhdHVzJywgd29ybGRJZCB9KS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlc3BvbnNlLndvcmxkU3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ29ubGluZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdvZmZsaW5lJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFqYXgucG9zdEpTT04oJy9hcGknLCB7IGNvbW1hbmQ6ICdzdGFydCcsIHdvcmxkSWQgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihjaGVjaywgY2hlY2spO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3VuYXZhaWxpYmxlJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdXb3JsZCB1bmF2YWlsaWJsZS4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0YXJ0dXAnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzaHV0ZG93bic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0b3JpbmcnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVjaywgMzAwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKytmYWlscyA+IDEwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ1dvcmxkIHRvb2sgdG9vIGxvbmcgdG8gc3RhcnQuJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignVW5rbm93biByZXNwb25zZS4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKTtcclxuICAgICAgICAgICAgfSgpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUud29ybGRTdGFydGVkO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgdGhlIGxvZydzIGxpbmVzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMb2dzKCkudGhlbihsaW5lcyA9PiBjb25zb2xlLmxvZyhsaW5lc1swXSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWRvd25sb2FkIHRoZSBsb2dzXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMb2dzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldExvZ3MpIHtcclxuICAgICAgICBjYWNoZS5nZXRMb2dzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbG9ncy8ke3dvcmxkSWR9YCkpXHJcbiAgICAgICAgICAgIC50aGVuKGxvZyA9PiBsb2cuc3BsaXQoJ1xcbicpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0TG9ncztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIGEgbGlzdCBvZiBhZG1pbnMsIG1vZHMsIHN0YWZmIChhZG1pbnMgKyBtb2RzKSwgd2hpdGVsaXN0LCBhbmQgYmxhY2tsaXN0LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMaXN0cygpLnRoZW4obGlzdHMgPT4gY29uc29sZS5sb2cobGlzdHMuYWRtaW4pKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmZXRjaCB0aGUgbGlzdHMuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMaXN0cyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRMaXN0cykge1xyXG4gICAgICAgIGNhY2hlLmdldExpc3RzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbGlzdHMvJHt3b3JsZElkfWApKVxyXG4gICAgICAgICAgICAudGhlbihodG1sID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldExpc3QobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gZG9jLnF1ZXJ5U2VsZWN0b3IoYHRleHRhcmVhW25hbWU9JHtuYW1lfV1gKVxyXG4gICAgICAgICAgICAgICAgICAgIC52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIC50b0xvY2FsZVVwcGVyQ2FzZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCdcXG4nKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWy4uLm5ldyBTZXQobGlzdCldOyAvL1JlbW92ZSBkdXBsaWNhdGVzXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGxpc3RzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFkbWluOiBnZXRMaXN0KCdhZG1pbnMnKSxcclxuICAgICAgICAgICAgICAgICAgICBtb2Q6IGdldExpc3QoJ21vZGxpc3QnKSxcclxuICAgICAgICAgICAgICAgICAgICB3aGl0ZTogZ2V0TGlzdCgnd2hpdGVsaXN0JyksXHJcbiAgICAgICAgICAgICAgICAgICAgYmxhY2s6IGdldExpc3QoJ2JsYWNrbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGxpc3RzLm1vZCA9IGxpc3RzLm1vZC5maWx0ZXIobmFtZSA9PiAhbGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgbGlzdHMuc3RhZmYgPSBsaXN0cy5hZG1pbi5jb25jYXQobGlzdHMubW9kKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdHM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRMaXN0cztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSBob21lcGFnZSBvZiB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiBjb25zb2xlLmxvZyhodG1sLnN1YnN0cmluZygwLCAxMDApKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZmV0Y2ggdGhlIHBhZ2UuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRIb21lcGFnZShyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRIb21lcGFnZSkge1xyXG4gICAgICAgIGNhY2hlLmdldEhvbWVwYWdlID0gYWpheC5nZXQoYC93b3JsZHMvJHt3b3JsZElkfWApXHJcbiAgICAgICAgICAgIC5jYXRjaCgoKSA9PiBnZXRIb21lcGFnZSh0cnVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldEhvbWVwYWdlO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgcGxheWVyIG5hbWVzLlxyXG4gKiBBbiBvbmxpbmUgbGlzdCBpcyBtYWludGFpbmVkIGJ5IHRoZSBib3QsIHRoaXMgc2hvdWxkIGdlbmVyYWxseSBub3QgYmUgdXNlZC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T25saW5lUGxheWVycygpLnRoZW4ob25saW5lID0+IHsgZm9yIChsZXQgbiBvZiBvbmxpbmUpIHsgY29uc29sZS5sb2cobiwgJ2lzIG9ubGluZSEnKX19KTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmcmVzaCB0aGUgb25saW5lIG5hbWVzLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T25saW5lUGxheWVycyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0T25saW5lUGxheWVycyA9IGdldEhvbWVwYWdlKHRydWUpXHJcbiAgICAgICAgICAgIC50aGVuKChodG1sKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJFbGVtcyA9IGRvYy5xdWVyeVNlbGVjdG9yKCcubWFuYWdlci5wYWRkZWQ6bnRoLWNoaWxkKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAucXVlcnlTZWxlY3RvckFsbCgndHI6bm90KC5oaXN0b3J5KSA+IHRkLmxlZnQnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgQXJyYXkuZnJvbShwbGF5ZXJFbGVtcykuZm9yRWFjaCgoZWwpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJzLnB1c2goZWwudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGxheWVycztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldE9ubGluZVBsYXllcnM7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgc2VydmVyIG93bmVyJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T3duZXJOYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBpcyBvd25lZCBieScsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE93bmVyTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcuc3ViaGVhZGVyfnRyPnRkOm5vdChbY2xhc3NdKScpLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIHdvcmxkJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0V29ybGROYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBuYW1lOicsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldFdvcmxkTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcjdGl0bGUnKS50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZW5kcyBhIG1lc3NhZ2UsIHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiBzZW50IG9yIHJlamVjdHMgb24gZmFpbHVyZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2VuZCgnaGVsbG8hJykudGhlbigoKSA9PiBjb25zb2xlLmxvZygnc2VudCcpKS5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gc2VuZC5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHNlbmQobWVzc2FnZSkge1xyXG4gICAgcmV0dXJuIGFqYXgucG9zdEpTT04oYC9hcGlgLCB7Y29tbWFuZDogJ3NlbmQnLCBtZXNzYWdlLCB3b3JsZElkfSlcclxuICAgICAgICAudGhlbihyZXNwID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlc3Auc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXNwO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4ocmVzcCA9PiB7XHJcbiAgICAgICAgICAgIC8vSGFuZGxlIGhvb2tzXHJcbiAgICAgICAgICAgIGhvb2suZmlyZSgnd29ybGQuc2VuZCcsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBob29rLmZpcmUoJ3dvcmxkLnNlcnZlcm1lc3NhZ2UnLCBtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgIC8vRGlzYWxsb3cgY29tbWFuZHMgc3RhcnRpbmcgd2l0aCBzcGFjZS5cclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpICYmICFtZXNzYWdlLnN0YXJ0c1dpdGgoJy8gJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFyZ3MgPSAnJztcclxuICAgICAgICAgICAgICAgIGlmIChjb21tYW5kLmluY2x1ZGVzKCcgJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBtZXNzYWdlLnN1YnN0cmluZyhtZXNzYWdlLmluZGV4T2YoJyAnKSArIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsICdTRVJWRVInLCBjb21tYW5kLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3A7XHJcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgaWYgKGVyciA9PSAnV29ybGQgbm90IHJ1bm5pbmcuJykge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuZmlyc3RJZCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIHdhdGNoIGNoYXQuXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja0NoYXQoKSB7XHJcbiAgICBnZXRNZXNzYWdlcygpLnRoZW4oKG1zZ3MpID0+IHtcclxuICAgICAgICBtc2dzLmZvckVhY2goKG1lc3NhZ2UpID0+IHtcclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChgJHt3b3JsZC5uYW1lfSAtIFBsYXllciBDb25uZWN0ZWQgYCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBbLCBuYW1lLCBpcF0gPSBtZXNzYWdlLm1hdGNoKC8gLSBQbGF5ZXIgQ29ubmVjdGVkICguKikgXFx8IChbXFxkLl0rKSBcXHwgKFtcXHddezMyfSlcXHMqJC8pO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlSm9pbk1lc3NhZ2VzKG5hbWUsIGlwKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkLm5hbWV9IC0gUGxheWVyIERpc2Nvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBtZXNzYWdlLnN1YnN0cmluZyh3b3JsZC5uYW1lLmxlbmd0aCArIDIzKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJzogJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gZ2V0VXNlcm5hbWUobWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbXNnID0gbWVzc2FnZS5zdWJzdHJpbmcobmFtZS5sZW5ndGggKyAyKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtc2cpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZU90aGVyTWVzc2FnZXMobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcilcclxuICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQ2hhdCwgNTAwMCk7XHJcbiAgICB9KTtcclxufVxyXG5jaGVja0NoYXQoKTtcclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2V0IHRoZSBsYXRlc3QgY2hhdCBtZXNzYWdlcy5cclxuICpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE1lc3NhZ2VzKCkge1xyXG4gICAgcmV0dXJuIHdvcmxkU3RhcnRlZCgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5wb3N0SlNPTihgL2FwaWAsIHsgY29tbWFuZDogJ2dldGNoYXQnLCB3b3JsZElkLCBmaXJzdElkOiBjYWNoZS5maXJzdElkIH0pKVxyXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT0gJ29rJyAmJiBkYXRhLm5leHRJZCAhPSBjYWNoZS5maXJzdElkKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5maXJzdElkID0gZGF0YS5uZXh0SWQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5sb2c7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5zdGF0dXMgPT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHdobyBzZW50IGEgbWVzc2FnZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIG5hbWUgPSBnZXRVc2VybmFtZSgnU0VSVkVSOiBIaSB0aGVyZSEnKTtcclxuICogLy9uYW1lID09ICdTRVJWRVInXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIHBhcnNlLlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBuYW1lIG9mIHRoZSB1c2VyIHdobyBzZW50IHRoZSBtZXNzYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0VXNlcm5hbWUobWVzc2FnZSkge1xyXG4gICAgZm9yIChsZXQgaSA9IDE4OyBpID4gNDsgaS0tKSB7XHJcbiAgICAgICAgbGV0IHBvc3NpYmxlTmFtZSA9IG1lc3NhZ2Uuc3Vic3RyaW5nKDAsIG1lc3NhZ2UubGFzdEluZGV4T2YoJzogJywgaSkpO1xyXG4gICAgICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMocG9zc2libGVOYW1lKSB8fCBwb3NzaWJsZU5hbWUgPT0gJ1NFUlZFUicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBvc3NpYmxlTmFtZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBTaG91bGQgaWRlYWxseSBuZXZlciBoYXBwZW4uXHJcbiAgICByZXR1cm4gbWVzc2FnZS5zdWJzdHJpbmcoMCwgbWVzc2FnZS5sYXN0SW5kZXhPZignOiAnLCAxOCkpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgam9pbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgam9pbmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IGlwIHRoZSBpcCBvZiB0aGUgcGxheWVyIGpvaW5pbmcuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVKb2luTWVzc2FnZXMobmFtZSwgaXApIHtcclxuICAgIGlmICghd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQuam9pbicsIG5hbWUsIGlwKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgZGlzY29ubmVjdGlvbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgbGVhdmluZy5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSkge1xyXG4gICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5zcGxpY2Uod29ybGQub25saW5lLmluZGV4T2YobmFtZSksIDEpO1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLmxlYXZlJywgbmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHVzZXIgY2hhdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdXNlci5cclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2Ugc2VudC5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICBpZiAobmFtZSA9PSAnU0VSVkVSJykge1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLnNlcnZlcmNoYXQnLCBtZXNzYWdlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQubWVzc2FnZScsIG5hbWUsIG1lc3NhZ2UpO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSAmJiAhbWVzc2FnZS5zdGFydHNXaXRoKCcvICcpKSB7XHJcblxyXG4gICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgIGxldCBhcmdzID0gJyc7XHJcbiAgICAgICAgaWYgKGNvbW1hbmQuaW5jbHVkZXMoJyAnKSkge1xyXG4gICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICBhcmdzID0gbWVzc2FnZS5zdWJzdHJpbmcobWVzc2FnZS5pbmRleE9mKCcgJykgKyAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsIG5hbWUsIGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgICAgIHJldHVybjsgLy9ub3QgY2hhdFxyXG4gICAgfVxyXG5cclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLmNoYXQnLCBuYW1lLCBtZXNzYWdlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIGhhbmRsZSBtZXNzYWdlcyB3aGljaCBhcmUgbm90IHNpbXBseSBwYXJzZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIGhhbmRsZVxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlT3RoZXJNZXNzYWdlcyhtZXNzYWdlKSB7XHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5vdGhlcicsIG1lc3NhZ2UpO1xyXG59XHJcbiIsInZhciBsaXN0ZW5lcnMgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGJlZ2luIGxpc3RlbmluZyB0byBhbiBldmVudC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogbGlzdGVuKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogLy9hbHRlcm5hdGl2ZWx5XHJcbiAqIG9uKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0aGUgZXZlbnQgaGFuZGxlclxyXG4gKi9cclxuZnVuY3Rpb24gbGlzdGVuKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIGxpc3RlbmVyc1trZXldID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XS5pbmNsdWRlcyhjYWxsYmFjaykpIHtcclxuICAgICAgICBsaXN0ZW5lcnNba2V5XS5wdXNoKGNhbGxiYWNrKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHN0b3AgbGlzdGVuaW5nIHRvIGFuIGV2ZW50LiBJZiB0aGUgbGlzdGVuZXIgd2FzIG5vdCBmb3VuZCwgbm8gYWN0aW9uIHdpbGwgYmUgdGFrZW4uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vRWFybGllciBhdHRhY2hlZCBteUZ1bmMgdG8gJ2V2ZW50J1xyXG4gKiByZW1vdmUoJ2V2ZW50JywgbXlGdW5jKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gc3RvcCBsaXN0ZW5pbmcgdG8uXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRoZSBjYWxsYmFjayB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQgbGlzdGVuZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKGxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgaWYgKGxpc3RlbmVyc1trZXldLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICBsaXN0ZW5lcnNba2V5XS5zcGxpY2UobGlzdGVuZXJzW2tleV0uaW5kZXhPZihjYWxsYmFjayksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNhbGwgZXZlbnRzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBjaGVjaygndGVzdCcsIDEsIDIsIDMpO1xyXG4gKiBjaGVjaygndGVzdCcsIHRydWUpO1xyXG4gKiAvLyBhbHRlcm5hdGl2ZWx5XHJcbiAqIGZpcmUoJ3Rlc3QnLCAxLCAyLCAzKTtcclxuICogZmlyZSgndGVzdCcsIHRydWUpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBjYWxsLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhcmd1bWVudHMgdG8gcGFzcyB0byBsaXN0ZW5pbmcgZnVuY3Rpb25zLlxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2soa2V5LCAuLi5hcmdzKSB7XHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGlzdGVuZXJzW2tleV0uZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lcikge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVyKC4uLmFyZ3MpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgdmFsdWUgYmFzZWQgb24gaW5wdXQgZnJvbSBsaXN0ZW5lcnMuXHJcbiAqXHJcbiAqIEBkZXByaWNhdGVkIHNpbmNlIDYuMS4wLiBJbnN0ZWFkLCB1cGRhdGUgcmVxdWVzdHMgc2hvdWxkIGJlIGhhbmRsZWQgYnkgdGhlIGV4dGVuc2lvbiBpdGVzZWxmLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1cGRhdGUoJ2V2ZW50JywgdHJ1ZSwgMSwgMiwgMyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGNhbGxcclxuICogQHBhcmFtIHttaXhlZH0gaW5pdGlhbCB0aGUgaW5pdGlhbCB2YWx1ZSB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIHVwZGF0ZShrZXksIGluaXRpYWwsIC4uLmFyZ3MpIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIHJldHVybiBpbml0aWFsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsaXN0ZW5lcnNba2V5XS5yZWR1Y2UoZnVuY3Rpb24ocHJldmlvdXMsIGN1cnJlbnQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gY3VycmVudChwcmV2aW91cywgLi4uYXJncyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91cztcclxuICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcHJldmlvdXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgaW5pdGlhbCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbGlzdGVuLFxyXG4gICAgb246IGxpc3RlbixcclxuICAgIHJlbW92ZSxcclxuICAgIGNoZWNrLFxyXG4gICAgZmlyZTogY2hlY2ssXHJcbiAgICB1cGRhdGUsXHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZ2V0U3RyaW5nLFxyXG4gICAgZ2V0T2JqZWN0LFxyXG4gICAgc2V0LFxyXG4gICAgY2xlYXJOYW1lc3BhY2UsXHJcbn07XHJcblxyXG4vL1JFVklFVzogSXMgdGhlcmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/IHJlcXVpcmUoJy4vY29uZmlnJykgbWF5YmU/XHJcbmNvbnN0IE5BTUVTUEFDRSA9IHdpbmRvdy53b3JsZElkO1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdHJpbmcgZnJvbSB0aGUgc3RvcmFnZSBpZiBpdCBleGlzdHMgYW5kIHJldHVybnMgaXQsIG90aGVyd2lzZSByZXR1cm5zIGZhbGxiYWNrLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgeCA9IGdldFN0cmluZygnc3RvcmVkX3ByZWZzJywgJ25vdGhpbmcnKTtcclxuICogdmFyIHkgPSBnZXRTdHJpbmcoJ3N0b3JlZF9wcmVmcycsICdub3RoaW5nJywgZmFsc2UpO1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBrZXkgdG8gcmV0cmlldmUuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGZhbGxiYWNrIHdoYXQgdG8gcmV0dXJuIGlmIHRoZSBrZXkgd2FzIG5vdCBmb3VuZC5cclxuICogQHBhcmFtIHtib29sfSBbbG9jYWw9dHJ1ZV0gd2hldGhlciBvciBub3QgdG8gdXNlIGEgbmFtZXNwYWNlIHdoZW4gY2hlY2tpbmcgZm9yIHRoZSBrZXkuXHJcbiAqIEByZXR1cm4ge21peGVkfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0U3RyaW5nKGtleSwgZmFsbGJhY2ssIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmIChsb2NhbCkge1xyXG4gICAgICAgIHJlc3VsdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGAke2tleX0ke05BTUVTUEFDRX1gKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKHJlc3VsdCA9PT0gbnVsbCkgPyBmYWxsYmFjayA6IHJlc3VsdDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdG9yZWQgb2JqZWN0IGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIHJldHVybnMgZmFsbGJhY2suXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB4ID0gZ2V0T2JqZWN0KCdzdG9yZWRfa2V5JywgWzEsIDIsIDNdKTtcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgaXRlbSB0byByZXRyaWV2ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZmFsbGJhY2sgd2hhdCB0byByZXR1cm4gaWYgdGhlIGl0ZW0gZG9lcyBub3QgZXhpc3Qgb3IgZmFpbHMgdG8gcGFyc2UgY29ycmVjdGx5LlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIG9yIG5vdCBhIG5hbWVzcGFjZSBzaG91bGQgYmUgdXNlZC5cclxuICogQHJldHVybiB7bWl4ZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPYmplY3Qoa2V5LCBmYWxsYmFjaywgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gZ2V0U3RyaW5nKGtleSwgZmFsc2UsIGxvY2FsKTtcclxuXHJcbiAgICBpZiAoIXJlc3VsdCkge1xyXG4gICAgICAgIHJldHVybiBmYWxsYmFjaztcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UocmVzdWx0KTtcclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogU2V0cyBhbiBvYmplY3QgaW4gdGhlIHN0b3JhZ2UsIHN0cmluZ2lmeWluZyBpdCBmaXJzdCBpZiBuZWNjZXNzYXJ5LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ3NvbWVfa2V5Jywge2E6IFsxLCAyLCAzXSwgYjogJ3Rlc3QnfSk7XHJcbiAqIC8vcmV0dXJucyAne1wiYVwiOlsxLDIsM10sXCJiXCI6XCJ0ZXN0XCJ9J1xyXG4gKiBnZXRTdHJpbmcoJ3NvbWVfa2V5Jyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGl0ZW0gdG8gb3ZlcndyaXRlIG9yIGNyZWF0ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZGF0YSBhbnkgc3RyaW5naWZ5YWJsZSB0eXBlLlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIHRvIHNhdmUgdGhlIGl0ZW0gd2l0aCBhIG5hbWVzcGFjZS5cclxuICovXHJcbmZ1bmN0aW9uIHNldChrZXksIGRhdGEsIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgaWYgKGxvY2FsKSB7XHJcbiAgICAgICAga2V5ID0gYCR7a2V5fSR7TkFNRVNQQUNFfWA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBkYXRhID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBkYXRhKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCBpdGVtcyBzdGFydGluZyB3aXRoIG5hbWVzcGFjZSBmcm9tIHRoZSBzdG9yYWdlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ2tleV90ZXN0JywgMSk7XHJcbiAqIHNldCgna2V5X3Rlc3QyJywgMik7XHJcbiAqIGNsZWFyTmFtZXNwYWNlKCdrZXlfJyk7IC8vYm90aCBrZXlfdGVzdCBhbmQga2V5X3Rlc3QyIGhhdmUgYmVlbiByZW1vdmVkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZXNwYWNlIHRoZSBwcmVmaXggdG8gY2hlY2sgZm9yIHdoZW4gcmVtb3ZpbmcgaXRlbXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBjbGVhck5hbWVzcGFjZShuYW1lc3BhY2UpIHtcclxuICAgIE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aChuYW1lc3BhY2UpKSB7XHJcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3QgYXBpID0gcmVxdWlyZSgnLi9ibG9ja2hlYWRzJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJy4vaG9vaycpO1xyXG5cclxuY29uc3QgU1RPUkFHRSA9IHtcclxuICAgIFBMQVlFUlM6ICdtYl9wbGF5ZXJzJyxcclxuICAgIExPR19MT0FEOiAnbWJfbGFzdExvZ0xvYWQnLFxyXG59O1xyXG5cclxudmFyIHdvcmxkID0gbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW10sXHJcbiAgICBvd25lcjogJycsXHJcbiAgICBwbGF5ZXJzOiBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFLlBMQVlFUlMsIHt9KSxcclxuICAgIGxpc3RzOiB7YWRtaW46IFtdLCBtb2Q6IFtdLCBzdGFmZjogW10sIGJsYWNrOiBbXSwgd2hpdGU6IFtdfSxcclxuICAgIGlzUGxheWVyLFxyXG4gICAgaXNTZXJ2ZXIsXHJcbiAgICBpc093bmVyLFxyXG4gICAgaXNBZG1pbixcclxuICAgIGlzU3RhZmYsXHJcbiAgICBpc01vZCxcclxuICAgIGlzT25saW5lLFxyXG4gICAgZ2V0Sm9pbnMsXHJcbiAgICBnZXRJUCxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgYSBwbGF5ZXIgaGFzIGpvaW5lZCB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNQbGF5ZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLnBsYXllcnMuaGFzT3duUHJvcGVydHkobmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIHRoZSBzZXJ2ZXJcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzU2VydmVyKG5hbWUpIHtcclxuICAgIHJldHVybiBuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkgPT0gJ1NFUlZFUic7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyB0aGUgb3duZXIgb3Igc2VydmVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNPd25lcihuYW1lKSB7XHJcbiAgICByZXR1cm4gd29ybGQub3duZXIgPT0gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpIHx8IGlzU2VydmVyKG5hbWUpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgYW4gYWRtaW5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzQWRtaW4obmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLmxpc3RzLmFkbWluLmluY2x1ZGVzKG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSkgfHwgaXNPd25lcihuYW1lKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIGEgbW9kXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc01vZChuYW1lKSB7XHJcbiAgICByZXR1cm4gd29ybGQubGlzdHMubW9kLmluY2x1ZGVzKG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyBhIHN0YWZmIG1lbWJlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzU3RhZmYobmFtZSkge1xyXG4gICAgcmV0dXJuIGlzQWRtaW4obmFtZSkgfHwgaXNNb2QobmFtZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgYSBwbGF5ZXIgaXMgb25saW5lXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc09ubGluZShuYW1lKSB7XHJcbiAgICByZXR1cm4gd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBudW1iZXIgb2YgdGltZXMgdGhlIHBsYXllciBoYXMgam9pbmVkIHRoZSBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge051bWJlcn1cclxuICovXHJcbmZ1bmN0aW9uIGdldEpvaW5zKG5hbWUpIHtcclxuICAgIHJldHVybiBpc1BsYXllcihuYW1lKSA/IHdvcmxkLnBsYXllcnNbbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpXS5qb2lucyA6IDA7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBsYXRlc3QgSVAgdXNlZCBieSBhIHBsYXllclxyXG4gKiBcclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7U3RyaW5nfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0SVAobmFtZSkge1xyXG4gICAgcmV0dXJuIGlzUGxheWVyKG5hbWUpID8gd29ybGQucGxheWVyc1tuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCldLmlwIDogJyc7XHJcbn1cclxuXHJcbi8vIEtlZXAgdGhlIG9ubGluZSBsaXN0IHVwIHRvIGRhdGVcclxuaG9vay5vbignd29ybGQuam9pbicsIGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIGlmICghd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcbn0pO1xyXG5ob29rLm9uKCd3b3JsZC5sZWF2ZScsIGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICB3b3JsZC5vbmxpbmUuc3BsaWNlKHdvcmxkLm9ubGluZS5pbmRleE9mKG5hbWUpLCAxKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vLyBLZWVwIHBsYXllcnMgbGlzdCB1cCB0byBkYXRlXHJcbmhvb2sub24oJ3dvcmxkLmpvaW4nLCBjaGVja1BsYXllckpvaW4pO1xyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uLlxyXG4gKiBSZW1vdmVzIGFkbWlucyBmcm9tIHRoZSBtb2QgbGlzdCBhbmQgY3JlYXRlcyB0aGUgc3RhZmYgbGlzdC5cclxuICovXHJcbmZ1bmN0aW9uIGJ1aWxkU3RhZmZMaXN0KCkge1xyXG4gICAgd29ybGQubGlzdHMubW9kID0gd29ybGQubGlzdHMubW9kLmZpbHRlcihuYW1lID0+ICFpc0FkbWluKG5hbWUpKTtcclxuICAgIHdvcmxkLmxpc3RzLnN0YWZmID0gd29ybGQubGlzdHMuYWRtaW4uY29uY2F0KHdvcmxkLmxpc3RzLm1vZCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbi5cclxuICogQ2hlY2tzIGlmIGEgcGxheWVyIGhhcyBwZXJtaXNzaW9uIHRvIHBlcmZvcm0gYSBjb21tYW5kXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb21tYW5kXHJcbiAqL1xyXG5mdW5jdGlvbiBwZXJtaXNzaW9uQ2hlY2sobmFtZSwgY29tbWFuZCkge1xyXG4gICAgY29tbWFuZCA9IGNvbW1hbmQudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuXHJcbiAgICBpZiAoWydhZG1pbicsICd1bmFkbWluJywgJ21vZCcsICd1bm1vZCddLmluY2x1ZGVzKGNvbW1hbmQpKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzQWRtaW4obmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFsnd2hpdGVsaXN0JywgJ3Vud2hpdGVsaXN0JywgJ2JhbicsICd1bmJhbiddLmluY2x1ZGVzKGNvbW1hbmQpKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzU3RhZmYobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vLyBLZWVwIGxpc3RzIHVwIHRvIGRhdGVcclxuaG9vay5vbignd29ybGQuY29tbWFuZCcsIGZ1bmN0aW9uKG5hbWUsIGNvbW1hbmQsIHRhcmdldCkge1xyXG4gICAgaWYgKCFwZXJtaXNzaW9uQ2hlY2sobmFtZSwgY29tbWFuZCkpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHVuID0gY29tbWFuZC5zdGFydHNXaXRoKCd1bicpO1xyXG5cclxuICAgIHZhciBncm91cCA9IHtcclxuICAgICAgICBhZG1pbjogJ2FkbWluJyxcclxuICAgICAgICBtb2Q6ICdtb2QnLFxyXG4gICAgICAgIHdoaXRlbGlzdDogJ3doaXRlJyxcclxuICAgICAgICBiYW46ICdibGFjaycsXHJcbiAgICB9W3VuID8gY29tbWFuZC5zdWJzdHIoMikgOiBjb21tYW5kXTtcclxuXHJcbiAgICBpZiAodW4gJiYgd29ybGQubGlzdHNbZ3JvdXBdLmluY2x1ZGVzKHRhcmdldCkpIHtcclxuICAgICAgICB3b3JsZC5saXN0c1tncm91cF0uc3BsaWNlKHdvcmxkLmxpc3RzW2dyb3VwXS5pbmRleE9mKHRhcmdldCksIDEpO1xyXG4gICAgICAgIGJ1aWxkU3RhZmZMaXN0KCk7XHJcbiAgICB9IGVsc2UgaWYgKCF1biAmJiAhd29ybGQubGlzdHNbZ3JvdXBdLmluY2x1ZGVzKHRhcmdldCkpIHtcclxuICAgICAgICB3b3JsZC5saXN0c1tncm91cF0ucHVzaCh0YXJnZXQpO1xyXG4gICAgICAgIGJ1aWxkU3RhZmZMaXN0KCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uLiBJbmNyZW1lbnRzIGEgcGxheWVyJ3Mgam9pbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpcFxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tQbGF5ZXJKb2luKG5hbWUsIGlwKSB7XHJcbiAgICBpZiAod29ybGQucGxheWVycy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xyXG4gICAgICAgIC8vUmV0dXJuaW5nIHBsYXllclxyXG4gICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uam9pbnMrKztcclxuICAgICAgICBpZiAoIXdvcmxkLnBsYXllcnNbbmFtZV0uaXBzLmluY2x1ZGVzKGlwKSkge1xyXG4gICAgICAgICAgICB3b3JsZC5wbGF5ZXJzW25hbWVdLmlwcy5wdXNoKGlwKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vTmV3IHBsYXllclxyXG4gICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0gPSB7am9pbnM6IDEsIGlwczogW2lwXX07XHJcbiAgICB9XHJcbiAgICB3b3JsZC5wbGF5ZXJzW25hbWVdLmlwID0gaXA7XHJcblxyXG4gICAgLy8gT3RoZXJ3aXNlLCB3ZSB3aWxsIGRvdWJsZSBwYXJzZSBqb2luc1xyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRS5MT0dfTE9BRCwgTWF0aC5mbG9vcihEYXRlLm5vdygpLnZhbHVlT2YoKSkpO1xyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRS5QTEFZRVJTLCB3b3JsZC5wbGF5ZXJzKTtcclxufVxyXG5cclxuXHJcbi8vIFVwZGF0ZSBsaXN0c1xyXG5Qcm9taXNlLmFsbChbYXBpLmdldExpc3RzKCksIGFwaS5nZXRXb3JsZE5hbWUoKSwgYXBpLmdldE93bmVyTmFtZSgpXSlcclxuICAgIC50aGVuKCh2YWx1ZXMpID0+IHtcclxuICAgICAgICB2YXIgW2FwaUxpc3RzLCB3b3JsZE5hbWUsIG93bmVyXSA9IHZhbHVlcztcclxuXHJcbiAgICAgICAgd29ybGQubGlzdHMgPSBhcGlMaXN0cztcclxuICAgICAgICBidWlsZFN0YWZmTGlzdCgpO1xyXG4gICAgICAgIHdvcmxkLm5hbWUgPSB3b3JsZE5hbWU7XHJcbiAgICAgICAgd29ybGQub3duZXIgPSBvd25lcjtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goY29uc29sZS5lcnJvcik7XHJcblxyXG4vLyBVcGRhdGUgcGxheWVycyBzaW5jZSBsYXN0IGJvdCBsb2FkXHJcblByb21pc2UuYWxsKFthcGkuZ2V0TG9ncygpLCBhcGkuZ2V0V29ybGROYW1lKCldKVxyXG4gICAgLnRoZW4oKHZhbHVlcykgPT4ge1xyXG4gICAgICAgIHZhciBbbGluZXMsIHdvcmxkTmFtZV0gPSB2YWx1ZXM7XHJcblxyXG4gICAgICAgIHZhciBsYXN0ID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRS5MT0dfTE9BRCwgMCk7XHJcbiAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRS5MT0dfTE9BRCwgTWF0aC5mbG9vcihEYXRlLm5vdygpLnZhbHVlT2YoKSkpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBsaW5lIG9mIGxpbmVzKSB7XHJcbiAgICAgICAgICAgIGxldCB0aW1lID0gbmV3IERhdGUobGluZS5zdWJzdHJpbmcoMCwgbGluZS5pbmRleE9mKCdiJykpLnJlcGxhY2UoJyAnLCAnVCcpLnJlcGxhY2UoJyAnLCAnWicpKTtcclxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBsaW5lLnN1YnN0cmluZyhsaW5lLmluZGV4T2YoJ10nKSArIDIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRpbWUgPCBsYXN0KSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChgJHt3b3JsZE5hbWV9IC0gUGxheWVyIENvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHBhcnRzID0gbGluZS5zdWJzdHIobGluZS5pbmRleE9mKCcgLSBQbGF5ZXIgQ29ubmVjdGVkICcpICsgMjApOyAvL05BTUUgfCBJUCB8IElEXHJcbiAgICAgICAgICAgICAgICBsZXQgWywgbmFtZSwgaXBdID0gcGFydHMubWF0Y2goLyguKikgXFx8IChbXFx3Ll0rKSBcXHwgLnszMn1cXHMqLyk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2hlY2tQbGF5ZXJKb2luKG5hbWUsIGlwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRS5QTEFZRVJTLCB3b3JsZC5wbGF5ZXJzKTtcclxuICAgIH0pO1xyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBzZW5kID0gcmVxdWlyZSgnYm90Jykuc2VuZDtcclxuY29uc3QgcHJlZmVyZW5jZXMgPSByZXF1aXJlKCdzZXR0aW5ncy9ib3QnKTtcclxuXHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdBbm5vdW5jZW1lbnRzJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjx0ZW1wbGF0ZSBpZD1cXFwiYVRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY29sdW1uIGlzLWZ1bGxcXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYm94XFxcIj5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+U2VuZDo8L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDx0ZXh0YXJlYSBjbGFzcz1cXFwidGV4dGFyZWEgaXMtZmx1aWQgbVxcXCI+PC90ZXh0YXJlYT5cXHJcXG4gICAgICAgICAgICA8YT5EZWxldGU8L2E+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDxkaXY+XFxyXFxuICAgICAgICAgICAgV2FpdCBYIG1pbnV0ZXMuLi5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2Fubm91bmNlbWVudHNcXFwiIGNsYXNzPVxcXCJjb250YWluZXIgaXMtZmx1aWRcXFwiPlxcclxcbiAgICA8c2VjdGlvbiBjbGFzcz1cXFwic2VjdGlvbiBpcy1zbWFsbFxcXCI+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYnV0dG9uIGlzLXByaW1hcnkgaXMtcHVsbGVkLXJpZ2h0XFxcIj4rPC9zcGFuPlxcclxcbiAgICAgICAgPGgzPlRoZXNlIGFyZSBzZW50IGFjY29yZGluZyB0byBhIHJlZ3VsYXIgc2NoZWR1bGUuPC9oMz5cXHJcXG4gICAgICAgIDxzcGFuPklmIHlvdSBoYXZlIG9uZSBhbm5vdW5jZW1lbnQsIGl0IGlzIHNlbnQgZXZlcnkgWCBtaW51dGVzLCBpZiB5b3UgaGF2ZSB0d28sIHRoZW4gdGhlIGZpcnN0IGlzIHNlbnQgYXQgWCBtaW51dGVzLCBhbmQgdGhlIHNlY29uZCBpcyBzZW50IFggbWludXRlcyBhZnRlciB0aGUgZmlyc3QuIENoYW5nZSBYIGluIHRoZSBzZXR0aW5ncyB0YWIuIE9uY2UgdGhlIGJvdCByZWFjaGVzIHRoZSBlbmQgb2YgdGhlIGxpc3QsIGl0IHN0YXJ0cyBvdmVyIGF0IHRoZSB0b3AuPC9zcGFuPlxcclxcbiAgICA8L3NlY3Rpb24+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImFNc2dzXFxcIiBjbGFzcz1cXFwiY29sdW1ucyBpcy1tdWx0aWxpbmVcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxuICAgIHN0YXJ0OiAoKSA9PiBhbm5vdW5jZW1lbnRDaGVjaygwKSxcclxufTtcclxuXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UodGV4dCA9ICcnKSB7XHJcbiAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNhVGVtcGxhdGUnLCAnI2FNc2dzJywgW1xyXG4gICAgICAgIHtzZWxlY3RvcjogJy5tJywgdGV4dDogdGV4dH1cclxuICAgIF0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgYW5ub3VuY2VtZW50cyA9IEFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJy5tJykpXHJcbiAgICAgICAgLm1hcChlbCA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB7bWVzc2FnZTogZWwudmFsdWV9O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIHN0b3JhZ2Uuc2V0KCdhbm5vdW5jZW1lbnRBcnInLCBhbm5vdW5jZW1lbnRzKTtcclxufVxyXG5cclxuLy8gQW5ub3VuY2VtZW50cyBjb2xsZWN0aW9uXHJcbnZhciBhbm5vdW5jZW1lbnRzID0gc3RvcmFnZS5nZXRPYmplY3QoJ2Fubm91bmNlbWVudEFycicsIFtdKTtcclxuXHJcbi8vIFNob3cgc2F2ZWQgYW5ub3VuY2VtZW50c1xyXG5hbm5vdW5jZW1lbnRzXHJcbiAgICAubWFwKGFubiA9PiBhbm4ubWVzc2FnZSlcclxuICAgIC5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5cclxuXHJcbi8vIFNlbmRzIGFubm91bmNlbWVudHMgYWZ0ZXIgdGhlIHNwZWNpZmllZCBkZWxheS5cclxuZnVuY3Rpb24gYW5ub3VuY2VtZW50Q2hlY2soaSkge1xyXG4gICAgaSA9IChpID49IGFubm91bmNlbWVudHMubGVuZ3RoKSA/IDAgOiBpO1xyXG5cclxuICAgIHZhciBhbm4gPSBhbm5vdW5jZW1lbnRzW2ldO1xyXG5cclxuICAgIGlmIChhbm4gJiYgYW5uLm1lc3NhZ2UpIHtcclxuICAgICAgICBzZW5kKGFubi5tZXNzYWdlKTtcclxuICAgIH1cclxuICAgIHNldFRpbWVvdXQoYW5ub3VuY2VtZW50Q2hlY2ssIHByZWZlcmVuY2VzLmFubm91bmNlbWVudERlbGF5ICogNjAwMDAsIGkgKyAxKTtcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGJ1aWxkQW5kU2VuZE1lc3NhZ2UsXHJcbiAgICBidWlsZE1lc3NhZ2UsXHJcbn07XHJcblxyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5jb25zdCBzZW5kID0gcmVxdWlyZSgnYm90Jykuc2VuZDtcclxuXHJcbmZ1bmN0aW9uIGJ1aWxkQW5kU2VuZE1lc3NhZ2UobWVzc2FnZSwgbmFtZSkge1xyXG4gICAgc2VuZChidWlsZE1lc3NhZ2UobWVzc2FnZSwgbmFtZSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBidWlsZE1lc3NhZ2UobWVzc2FnZSwgbmFtZSkge1xyXG4gICAgbWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgve3soW159XSspfX0vZywgZnVuY3Rpb24oZnVsbCwga2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgTkFNRTogbmFtZSxcclxuICAgICAgICAgICAgTmFtZTogbmFtZVswXSArIG5hbWUuc3Vic3RyaW5nKDEpLnRvTG9jYWxlTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUudG9Mb2NhbGVMb3dlckNhc2UoKVxyXG4gICAgICAgIH1ba2V5XSB8fCBmdWxsO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpKSB7XHJcbiAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgve3tpcH19L2dpLCB3b3JsZC5nZXRJUChuYW1lKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1lc3NhZ2U7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjaGVja0pvaW5zQW5kR3JvdXAsXHJcbiAgICBjaGVja0pvaW5zLFxyXG4gICAgY2hlY2tHcm91cCxcclxufTtcclxuXHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykge1xyXG4gICAgcmV0dXJuIGNoZWNrSm9pbnMobmFtZSwgbXNnLmpvaW5zX2xvdywgbXNnLmpvaW5zX2hpZ2gpICYmIGNoZWNrR3JvdXAobmFtZSwgbXNnLmdyb3VwLCBtc2cubm90X2dyb3VwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2lucyhuYW1lLCBsb3csIGhpZ2gpIHtcclxuICAgIHJldHVybiB3b3JsZC5nZXRKb2lucyhuYW1lKSA+PSBsb3cgJiYgd29ybGQuZ2V0Sm9pbnMobmFtZSkgPD0gaGlnaDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tHcm91cChuYW1lLCBncm91cCwgbm90X2dyb3VwKSB7XHJcbiAgICByZXR1cm4gaXNJbkdyb3VwKG5hbWUsIGdyb3VwKSAmJiAhaXNJbkdyb3VwKG5hbWUsIG5vdF9ncm91cCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzSW5Hcm91cChuYW1lLCBncm91cCkge1xyXG4gICAgc3dpdGNoIChncm91cC50b0xvY2FsZUxvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgY2FzZSAnYWxsJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzUGxheWVyKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ2FkbWluJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzQWRtaW4obmFtZSk7XHJcbiAgICAgICAgY2FzZSAnbW9kJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzTW9kKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ3N0YWZmJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzU3RhZmYobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnb3duZXInOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNPd25lcihuYW1lKTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuIiwiT2JqZWN0LmFzc2lnbihcclxuICAgIG1vZHVsZS5leHBvcnRzLFxyXG4gICAgcmVxdWlyZSgnLi9idWlsZE1lc3NhZ2UnKSxcclxuICAgIHJlcXVpcmUoJy4vY2hlY2tKb2luc0FuZEdyb3VwJyksXHJcbiAgICByZXF1aXJlKCcuL3Nob3dTdW1tYXJ5JylcclxuKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzaG93U3VtbWFyeVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgYW5kIGRpc3BsYXkgYSBzdW1tYXJ5IG9mIHRoZSBvcHRpb25zIGNoYW5nZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Tm9kZX0gY29udGFpbmVyIHRoZSBtZXNzYWdlIGNvbnRhaW5lciB3aGljaCBuZWVkcyBhbiB1cGRhdGVkIHN1bW1hcnkuXHJcbiAqL1xyXG5mdW5jdGlvbiBzaG93U3VtbWFyeShjb250YWluZXIpIHtcclxuICAgIHZhciBvdXQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignLnN1bW1hcnknKTtcclxuXHJcbiAgICBpZiAoIW91dCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZ3JvdXAgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZTtcclxuICAgIHZhciBub3RfZ3JvdXAgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWU7XHJcbiAgICB2YXIgam9pbnNfbG93ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScpLnZhbHVlO1xyXG4gICAgdmFyIGpvaW5zX2hpZ2ggPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScpLnZhbHVlO1xyXG5cclxuICAgIHZhciBncm91cHNBbHRlcmVkID0gZ3JvdXAgIT0gJ2FsbCcgfHwgbm90X2dyb3VwICE9ICdub2JvZHknO1xyXG4gICAgdmFyIGpvaW5zQWx0ZXJlZCA9IGpvaW5zX2xvdyAhPSBcIjBcIiB8fCBqb2luc19oaWdoICE9IFwiOTk5OVwiO1xyXG5cclxuICAgIGlmIChncm91cHNBbHRlcmVkICYmIGpvaW5zQWx0ZXJlZCkge1xyXG4gICAgICAgIG91dC50ZXh0Q29udGVudCA9IGAke2dyb3VwfSAvIG5vdCAke25vdF9ncm91cH0gYW5kICR7am9pbnNfbG93fSDiiaQgam9pbnMg4omkICR7am9pbnNfaGlnaH1gO1xyXG4gICAgfSBlbHNlIGlmIChncm91cHNBbHRlcmVkKSB7XHJcbiAgICAgICAgb3V0LnRleHRDb250ZW50ID0gYCR7Z3JvdXB9IC8gbm90ICR7bm90X2dyb3VwfWA7XHJcbiAgICB9IGVsc2UgaWYgKGpvaW5zQWx0ZXJlZCkge1xyXG4gICAgICAgIG91dC50ZXh0Q29udGVudCA9IGAke2pvaW5zX2xvd30g4omkIGpvaW5zIOKJpCAke2pvaW5zX2hpZ2h9YDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgb3V0LnRleHRDb250ZW50ID0gJyc7XHJcbiAgICB9XHJcbn1cclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5cclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xyXG5cclxudmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuZWwuaW5uZXJIVE1MID0gXCIjbWJfam9pbj5oMywjbWJfbGVhdmU+aDMsI21iX3RyaWdnZXI+aDMsI21iX2Fubm91bmNlbWVudHM+aDN7bWFyZ2luOjAgMCA1cHggNmVtfSNtYl9qb2luPnNwYW4sI21iX2xlYXZlPnNwYW4sI21iX3RyaWdnZXI+c3BhbiwjbWJfYW5ub3VuY2VtZW50cz5zcGFue21hcmdpbi1sZWZ0OjZlbX0jbWJfam9pbiBpbnB1dFt0eXBlPVxcXCJudW1iZXJcXFwiXSwjbWJfbGVhdmUgaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl0sI21iX3RyaWdnZXIgaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl0sI21iX2Fubm91bmNlbWVudHMgaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl17d2lkdGg6NWVtfSNqTXNncywjbE1zZ3MsI3RNc2dzLCNhTXNnc3tib3JkZXItdG9wOjFweCBzb2xpZCAjMDAwfSNqTXNncyBzbWFsbCwjbE1zZ3Mgc21hbGwsI3RNc2dzIHNtYWxsLCNhTXNncyBzbWFsbHtjb2xvcjojNzc3fVxcblwiO1xyXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbnVpLmFkZFRhYkdyb3VwKCdNZXNzYWdlcycsICdtZXNzYWdlcycpO1xyXG5cclxuW1xyXG4gICAgcmVxdWlyZSgnLi9qb2luJyksXHJcbiAgICByZXF1aXJlKCcuL2xlYXZlJyksXHJcbiAgICByZXF1aXJlKCcuL3RyaWdnZXInKSxcclxuICAgIHJlcXVpcmUoJy4vYW5ub3VuY2VtZW50cycpXHJcbl0uZm9yRWFjaCgoe3RhYiwgc2F2ZSwgYWRkTWVzc2FnZSwgc3RhcnR9KSA9PiB7XHJcbiAgICB0YWIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBjaGVja0RlbGV0ZShldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC50YXJnZXQudGFnTmFtZSAhPSAnQScpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdWkuYWxlcnQoJ1JlYWxseSBkZWxldGUgdGhpcyBtZXNzYWdlPycsIFtcclxuICAgICAgICAgICAge3RleHQ6ICdZZXMnLCBzdHlsZTogJ2lzLWRhbmdlcicsIGFjdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWwgPSBldmVudC50YXJnZXQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoKGVsID0gZWwucGFyZW50RWxlbWVudCkgJiYgIWVsLmNsYXNzTGlzdC5jb250YWlucygnY29sdW1uJykpXHJcbiAgICAgICAgICAgICAgICAgICAgO1xyXG4gICAgICAgICAgICAgICAgZWwucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzYXZlKCk7XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7dGV4dDogJ0NhbmNlbCd9XHJcbiAgICAgICAgXSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0YWIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgc2F2ZSk7XHJcblxyXG4gICAgdGFiLnF1ZXJ5U2VsZWN0b3IoJy5idXR0b24uaXMtcHJpbWFyeScpXHJcbiAgICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gYWRkTWVzc2FnZSgpKTtcclxuXHJcbiAgICAvLyBEb24ndCBzdGFydCByZXNwb25kaW5nIHRvIGNoYXQgZm9yIDEwIHNlY29uZHNcclxuICAgIHNldFRpbWVvdXQoc3RhcnQsIDEwMDAwKTtcclxufSk7XHJcblxyXG5bXHJcbiAgICByZXF1aXJlKCcuL2pvaW4nKSxcclxuICAgIHJlcXVpcmUoJy4vbGVhdmUnKSxcclxuICAgIHJlcXVpcmUoJy4vdHJpZ2dlcicpXHJcbl0uZm9yRWFjaCgoe3RhYn0pID0+IHtcclxuICAgIHRhYi5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIHZhciBlbCA9IGV2ZW50LnRhcmdldDtcclxuICAgICAgICB3aGlsZSAoKGVsID0gZWwucGFyZW50RWxlbWVudCkgJiYgIWVsLmNsYXNzTGlzdC5jb250YWlucygnY29sdW1uJykpXHJcbiAgICAgICAgICAgIDtcclxuXHJcbiAgICAgICAgaGVscGVycy5zaG93U3VtbWFyeShlbCk7XHJcbiAgICB9KTtcclxufSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuXHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ2pvaW5BcnInO1xyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignSm9pbicsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8dGVtcGxhdGUgaWQ9XFxcImpUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNvbHVtbiBpcy00LWRlc2t0b3AgaXMtNi10YWJsZXRcXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYm94XFxcIj5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+IE1lc3NhZ2U6IDx0ZXh0YXJlYSBjbGFzcz1cXFwidGV4dGFyZWEgaXMtZmx1aWQgbVxcXCI+PC90ZXh0YXJlYT48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxkZXRhaWxzPjxzdW1tYXJ5Pk1vcmUgb3B0aW9ucyA8c21hbGwgY2xhc3M9XFxcInN1bW1hcnlcXFwiPjwvc21hbGw+PC9zdW1tYXJ5PlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzOiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJncm91cFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhbGxcXFwiPmFueW9uZTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwic3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJtb2RcXFwiPmEgbW9kPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzIG5vdDogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwibm90X2dyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm5vYm9keVxcXCI+bm9ib2R5PC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCIwXFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfbG93XFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHNwYW4+ICZsZTsgcGxheWVyIGpvaW5zICZsZTsgPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiOTk5OVxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2hpZ2hcXFwiPlxcclxcbiAgICAgICAgICAgIDwvZGV0YWlscz5cXHJcXG4gICAgICAgICAgICA8YT5EZWxldGU8L2E+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9qb2luXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgICAgIDxoMz5UaGVzZSBhcmUgY2hlY2tlZCB3aGVuIGEgcGxheWVyIGpvaW5zIHRoZSBzZXJ2ZXIuPC9oMz5cXHJcXG4gICAgICAgIDxzcGFuPllvdSBjYW4gdXNlIHt7TmFtZX19LCB7e05BTUV9fSwge3tuYW1lfX0sIGFuZCB7e2lwfX0gaW4geW91ciBtZXNzYWdlLjwvc3Bhbj5cXHJcXG4gICAgPC9zZWN0aW9uPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJqTXNnc1xcXCIgY2xhc3M9XFxcImNvbHVtbnMgaXMtbXVsdGlsaW5lXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbiAgICBzdGFydDogKCkgPT4gaG9vay5vbignd29ybGQuam9pbicsIG9uSm9pbiksXHJcbn07XHJcblxyXG52YXIgam9pbk1lc3NhZ2VzID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10pO1xyXG5qb2luTWVzc2FnZXMuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcbkFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJyNqTXNncyA+IGRpdicpKVxyXG4gICAgLmZvckVhY2goaGVscGVycy5zaG93U3VtbWFyeSk7XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gYWRkIGEgdHJpZ2dlciBtZXNzYWdlIHRvIHRoZSBwYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkTWVzc2FnZShtc2cgPSB7fSkge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjalRlbXBsYXRlJywgJyNqTXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICdvcHRpb24nLCByZW1vdmU6IFsnc2VsZWN0ZWQnXSwgbXVsdGlwbGU6IHRydWV9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy5tJywgdGV4dDogbXNnLm1lc3NhZ2UgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScsIHZhbHVlOiBtc2cuam9pbnNfbG93IHx8IDB9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2hpZ2ggfHwgOTk5OX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cuZ3JvdXAgfHwgJ2FsbCd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXSBbdmFsdWU9XCIke21zZy5ub3RfZ3JvdXAgfHwgJ25vYm9keSd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9XHJcbiAgICBdKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2F2ZSB0aGUgdXNlcidzIG1lc3NhZ2VzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIGpvaW5NZXNzYWdlcyA9IFtdO1xyXG4gICAgQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI2pNc2dzID4gZGl2JykpLmZvckVhY2goY29udGFpbmVyID0+IHtcclxuICAgICAgICBpZiAoIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGpvaW5NZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2xvdzogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfaGlnaDogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGdyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgbm90X2dyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBqb2luTWVzc2FnZXMpO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBsaXN0ZW4gdG8gcGxheWVyIGpvaW5zXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqL1xyXG5mdW5jdGlvbiBvbkpvaW4obmFtZSkge1xyXG4gICAgam9pbk1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAoaGVscGVycy5jaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuXHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ2xlYXZlQXJyJztcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0xlYXZlJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjx0ZW1wbGF0ZSBpZD1cXFwibFRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY29sdW1uIGlzLTQtZGVza3RvcCBpcy02LXRhYmxldFxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxsYWJlbD5NZXNzYWdlIDx0ZXh0YXJlYSBjbGFzcz1cXFwidGV4dGFyZWEgaXMtZmx1aWQgbVxcXCI+PC90ZXh0YXJlYT48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxkZXRhaWxzPjxzdW1tYXJ5Pk1vcmUgb3B0aW9ucyA8c21hbGwgY2xhc3M9XFxcInN1bW1hcnlcXFwiPjwvc21hbGw+PC9zdW1tYXJ5PlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzOiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJncm91cFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhbGxcXFwiPmFueW9uZTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwic3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJtb2RcXFwiPmEgbW9kPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzIG5vdDogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwibm90X2dyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm5vYm9keVxcXCI+bm9ib2R5PC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCIwXFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfbG93XFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHNwYW4+ICZsZTsgcGxheWVyIGpvaW5zICZsZTsgPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiOTk5OVxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2hpZ2hcXFwiPlxcclxcbiAgICAgICAgICAgIDwvZGV0YWlscz5cXHJcXG4gICAgICAgICAgICA8YT5EZWxldGU8L2E+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9sZWF2ZVxcXCIgY2xhc3M9XFxcImNvbnRhaW5lciBpcy1mbHVpZFxcXCI+XFxyXFxuICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJzZWN0aW9uIGlzLXNtYWxsXFxcIj5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJidXR0b24gaXMtcHJpbWFyeSBpcy1wdWxsZWQtcmlnaHRcXFwiPis8L3NwYW4+XFxyXFxuICAgICAgICA8aDM+VGhlc2UgYXJlIGNoZWNrZWQgd2hlbiBhIHBsYXllciBsZWF2ZXMgdGhlIHNlcnZlci48L2gzPlxcclxcbiAgICAgICAgPHNwYW4+WW91IGNhbiB1c2Uge3tOYW1lfX0sIHt7TkFNRX19LCB7e25hbWV9fSwgYW5kIHt7aXB9fSBpbiB5b3VyIG1lc3NhZ2UuPC9zcGFuPlxcclxcbiAgICA8L3NlY3Rpb24+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImxNc2dzXFxcIiBjbGFzcz1cXFwiY29sdW1ucyBpcy1tdWx0aWxpbmVcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxuICAgIHN0YXJ0OiAoKSA9PiBob29rLm9uKCd3b3JsZC5sZWF2ZScsIG9uTGVhdmUpLFxyXG59O1xyXG5cclxudmFyIGxlYXZlTWVzc2FnZXMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSk7XHJcbmxlYXZlTWVzc2FnZXMuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcbkFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJyNsTXNncyA+IGRpdicpKVxyXG4gICAgLmZvckVhY2goaGVscGVycy5zaG93U3VtbWFyeSk7XHJcblxyXG4vKipcclxuICogQWRkcyBhIGxlYXZlIG1lc3NhZ2UgdG8gdGhlIHBhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKG1zZyA9IHt9KSB7XHJcbiAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNsVGVtcGxhdGUnLCAnI2xNc2dzJywgW1xyXG4gICAgICAgIHtzZWxlY3RvcjogJ29wdGlvbicsIHJlbW92ZTogWydzZWxlY3RlZCddLCBtdWx0aXBsZTogdHJ1ZX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLm0nLCB0ZXh0OiBtc2cubWVzc2FnZSB8fCAnJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJywgdmFsdWU6IG1zZy5qb2luc19sb3cgfHwgMH0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScsIHZhbHVlOiBtc2cuam9pbnNfaGlnaCB8fCA5OTk5fSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJncm91cFwiXSBbdmFsdWU9XCIke21zZy5ncm91cCB8fCAnYWxsJ31cIl1gLCBzZWxlY3RlZDogJ3NlbGVjdGVkJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLm5vdF9ncm91cCB8fCAnbm9ib2R5J31cIl1gLCBzZWxlY3RlZDogJ3NlbGVjdGVkJ31cclxuICAgIF0pO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzYXZlIHRoZSBjdXJyZW50IGxlYXZlIG1lc3NhZ2VzXHJcbiAqL1xyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgbGVhdmVNZXNzYWdlcyA9IFtdO1xyXG4gICAgQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI2xNc2dzID4gZGl2JykpLmZvckVhY2goY29udGFpbmVyID0+IHtcclxuICAgICAgICBpZiAoIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxlYXZlTWVzc2FnZXMucHVzaCh7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19sb3c6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2hpZ2g6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImdyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIG5vdF9ncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgbGVhdmVNZXNzYWdlcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGxpc3RlbiB0byBwbGF5ZXIgZGlzY29ubmVjdGlvbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBwbGF5ZXIgbGVhdmluZy5cclxuICovXHJcbmZ1bmN0aW9uIG9uTGVhdmUobmFtZSkge1xyXG4gICAgbGVhdmVNZXNzYWdlcy5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgaWYgKGhlbHBlcnMuY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykpIHtcclxuICAgICAgICAgICAgaGVscGVycy5idWlsZEFuZFNlbmRNZXNzYWdlKG1zZy5tZXNzYWdlLCBuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcblxyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKCdtZXNzYWdlcy9oZWxwZXJzJyk7XHJcbmNvbnN0IHNldHRpbmdzID0gcmVxdWlyZSgnc2V0dGluZ3MvYm90Jyk7XHJcblxyXG5cclxuY29uc3QgU1RPUkFHRV9JRCA9ICd0cmlnZ2VyQXJyJztcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ1RyaWdnZXInLCAnbWVzc2FnZXMnKTtcclxudGFiLmlubmVySFRNTCA9IFwiPHRlbXBsYXRlIGlkPVxcXCJ0VGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb2x1bW4gaXMtNC1kZXNrdG9wIGlzLTYtdGFibGV0XFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPlRyaWdnZXI6IDxpbnB1dCBjbGFzcz1cXFwiaW5wdXQgdFxcXCI+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+TWVzc2FnZTogPHRleHRhcmVhIGNsYXNzPVxcXCJ0ZXh0YXJlYSBpcy1mbHVpZCBtXFxcIj48L3RleHRhcmVhPjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGRldGFpbHM+PHN1bW1hcnk+TW9yZSBvcHRpb25zIDxzbWFsbCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+PC9zbWFsbD48L3N1bW1hcnk+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXM6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcImdyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFsbFxcXCI+YW55b25lPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXMgbm90OiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJub3RfZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibm9ib2R5XFxcIj5ub2JvZHk8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcInN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJvd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjBcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19sb3dcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3Bhbj4gJmxlOyBwbGF5ZXIgam9pbnMgJmxlOyA8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCI5OTk5XFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfaGlnaFxcXCI+XFxyXFxuICAgICAgICAgICAgPC9kZXRhaWxzPlxcclxcbiAgICAgICAgICAgIDxhPkRlbGV0ZTwvYT5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX3RyaWdnZXJcXFwiIGNsYXNzPVxcXCJjb250YWluZXIgaXMtZmx1aWRcXFwiPlxcclxcbiAgICA8c2VjdGlvbiBjbGFzcz1cXFwic2VjdGlvbiBpcy1zbWFsbFxcXCI+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYnV0dG9uIGlzLXByaW1hcnkgaXMtcHVsbGVkLXJpZ2h0XFxcIj4rPC9zcGFuPlxcclxcbiAgICAgICAgPGgzPlRoZXNlIGFyZSBjaGVja2VkIHdoZW5ldmVyIHNvbWVvbmUgc2F5cyBzb21ldGhpbmcuPC9oMz5cXHJcXG4gICAgICAgIDxzcGFuPllvdSBjYW4gdXNlIHt7TmFtZX19LCB7e05BTUV9fSwge3tuYW1lfX0sIGFuZCB7e2lwfX0gaW4geW91ciBtZXNzYWdlLiBJZiB5b3UgcHV0IGFuIGFzdGVyaXNrICgqKSBpbiB5b3VyIHRyaWdnZXIsIGl0IHdpbGwgYmUgdHJlYXRlZCBhcyBhIHdpbGRjYXJkLiAoVHJpZ2dlciBcXFwidGUqc3RcXFwiIHdpbGwgbWF0Y2ggXFxcInRlYSBzdHVmZlxcXCIgYW5kIFxcXCJ0ZXN0XFxcIik8L3NwYW4+XFxyXFxuICAgIDwvc2VjdGlvbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwidE1zZ3NcXFwiIGNsYXNzPVxcXCJjb2x1bW5zIGlzLW11bHRpbGluZVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGhvb2sub24oJ3dvcmxkLm1lc3NhZ2UnLCBjaGVja1RyaWdnZXJzKSxcclxufTtcclxuXHJcbnZhciB0cmlnZ2VyTWVzc2FnZXMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSk7XHJcbnRyaWdnZXJNZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5BcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjdE1zZ3MgPiBkaXYnKSlcclxuICAgIC5mb3JFYWNoKGhlbHBlcnMuc2hvd1N1bW1hcnkpO1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYSB0cmlnZ2VyIG1lc3NhZ2UgdG8gdGhlIHBhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKG1zZyA9IHt9KSB7XHJcbiAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyN0VGVtcGxhdGUnLCAnI3RNc2dzJywgW1xyXG4gICAgICAgIHtzZWxlY3RvcjogJ29wdGlvbicsIHJlbW92ZTogWydzZWxlY3RlZCddLCBtdWx0aXBsZTogdHJ1ZX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLm0nLCB0ZXh0OiBtc2cubWVzc2FnZSB8fCAnJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLnQnLCB2YWx1ZTogbXNnLnRyaWdnZXIgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScsIHZhbHVlOiBtc2cuam9pbnNfbG93IHx8IDB9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2hpZ2ggfHwgOTk5OX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cuZ3JvdXAgfHwgJ2FsbCd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXSBbdmFsdWU9XCIke21zZy5ub3RfZ3JvdXAgfHwgJ25vYm9keSd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9XHJcbiAgICBdKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNhdmVzIHRoZSBjdXJyZW50IHRyaWdnZXIgbWVzc2FnZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgdHJpZ2dlck1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjdE1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUgfHwgIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcudCcpLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyaWdnZXJNZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIHRyaWdnZXI6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcudCcpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19sb3c6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2hpZ2g6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImdyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIG5vdF9ncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgdHJpZ2dlck1lc3NhZ2VzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBhIHRyaWdnZXIgYWdhaW5zdCBhIG1lc3NhZ2UgdG8gc2VlIGlmIGl0IG1hdGNoZXMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0cmlnZ2VyIHRoZSB0cmlnZ2VyIHRvIHRyeSB0byBtYXRjaFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxyXG4gKi9cclxuZnVuY3Rpb24gdHJpZ2dlck1hdGNoKHRyaWdnZXIsIG1lc3NhZ2UpIHtcclxuICAgIGlmIChzZXR0aW5ncy5yZWdleFRyaWdnZXJzKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAodHJpZ2dlciwgJ2knKS50ZXN0KG1lc3NhZ2UpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgdWkubm90aWZ5KGBTa2lwcGluZyB0cmlnZ2VyICcke3RyaWdnZXJ9JyBhcyB0aGUgUmVnRXggaXMgaW52YWlsZC5gKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgUmVnRXhwKFxyXG4gICAgICAgICAgICB0cmlnZ2VyXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvKFsuKz9ePSE6JHt9KCl8XFxbXFxdXFwvXFxcXF0pL2csIFwiXFxcXCQxXCIpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwqL2csIFwiLipcIiksXHJcbiAgICAgICAgICAgICdpJ1xyXG4gICAgICAgICkudGVzdChtZXNzYWdlKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgaW5jb21pbmcgcGxheWVyIG1lc3NhZ2VzIGZvciB0cmlnZ2Vyc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgcGxheWVyJ3MgbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tUcmlnZ2VycyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICB2YXIgdG90YWxBbGxvd2VkID0gc2V0dGluZ3MubWF4UmVzcG9uc2VzO1xyXG4gICAgdHJpZ2dlck1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAodG90YWxBbGxvd2VkICYmIGhlbHBlcnMuY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykgJiYgdHJpZ2dlck1hdGNoKG1zZy50cmlnZ2VyLCBtZXNzYWdlKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgICAgICB0b3RhbEFsbG93ZWQtLTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgU1RPUkFHRV9JRCA9ICdtYl9wcmVmZXJlbmNlcyc7XHJcblxyXG52YXIgcHJlZnMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCB7fSwgZmFsc2UpO1xyXG5cclxuLy8gU2V0IHRoZSBkZWZhdWx0IHNldHRpbmdzXHJcbltcclxuICAgIHt0eXBlOiAnbnVtYmVyJywga2V5OiAnYW5ub3VuY2VtZW50RGVsYXknLCBkZWZhdWx0OiAxMH0sXHJcbiAgICB7dHlwZTogJ251bWJlcicsIGtleTogJ21heFJlc3BvbnNlcycsIGRlZmF1bHQ6IDJ9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnbm90aWZ5JywgZGVmYXVsdDogdHJ1ZX0sXHJcbiAgICAvLyBBZHZhbmNlZFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnZGlzYWJsZVRyaW0nLCBkZWZhdWx0OiBmYWxzZX0sXHJcbiAgICB7dHlwZTogJ2Jvb2xlYW4nLCBrZXk6ICdyZWdleFRyaWdnZXJzJywgZGVmYXVsdDogZmFsc2V9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnc3BsaXRNZXNzYWdlcycsIGRlZmF1bHQ6IGZhbHNlfSxcclxuICAgIHt0eXBlOiAnc3RyaW5nJywga2V5OiAnc3BsaXRUb2tlbicsIGRlZmF1bHQ6ICc8c3BsaXQ+J30sXHJcbl0uZm9yRWFjaChwcmVmID0+IHtcclxuICAgIC8vIFNldCBkZWZhdWx0cyBpZiBub3Qgc2V0XHJcbiAgICBpZiAodHlwZW9mIHByZWZzW3ByZWYua2V5XSAhPSAgcHJlZi50eXBlKSB7XHJcbiAgICAgICAgcHJlZnNbcHJlZi5rZXldID0gcHJlZi5kZWZhdWx0O1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vIEF1dG8gc2F2ZSBvbiBjaGFuZ2VcclxuLy8gSUUgKGFsbCkgLyBTYWZhcmkgKDwgMTApIGRvZXNuJ3Qgc3VwcG9ydCBwcm94aWVzXHJcbmlmICh0eXBlb2YgUHJveHkgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcHJlZnM7XHJcbiAgICBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBwcmVmcywgZmFsc2UpO1xyXG4gICAgfSwgMzAgKiAxMDAwKTtcclxufSBlbHNlIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gbmV3IFByb3h5KHByZWZzLCB7XHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihvYmosIHByb3AsIHZhbCkge1xyXG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICBvYmpbcHJvcF0gPSB2YWw7XHJcbiAgICAgICAgICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBwcmVmcywgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3QgcHJlZnMgPSByZXF1aXJlKCdzZXR0aW5ncy9ib3QnKTtcclxuXHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdCb3QnLCAnc2V0dGluZ3MnKTtcclxudGFiLmlubmVySFRNTCA9IFwiPGRpdiBpZD1cXFwibWJfc2V0dGluZ3NcXFwiIGNsYXNzPVxcXCJjb250YWluZXJcXFwiPlxcclxcbiAgICA8aDMgY2xhc3M9XFxcInRpdGxlXFxcIj5HZW5lcmFsIFNldHRpbmdzPC9oMz5cXHJcXG4gICAgPGxhYmVsPk1pbnV0ZXMgYmV0d2VlbiBhbm5vdW5jZW1lbnRzPC9sYWJlbD5cXHJcXG4gICAgPHAgY2xhc3M9XFxcImNvbnRyb2xcXFwiPlxcclxcbiAgICAgICAgPGlucHV0IGNsYXNzPVxcXCJpbnB1dFxcXCIgZGF0YS1rZXk9XFxcImFubm91bmNlbWVudERlbGF5XFxcIiB0eXBlPVxcXCJudW1iZXJcXFwiPjxicj5cXHJcXG4gICAgPC9wPlxcclxcbiAgICA8bGFiZWw+TWF4aW11bSB0cmlnZ2VyIHJlc3BvbnNlcyB0byBhIG1lc3NhZ2U8L2xhYmVsPlxcclxcbiAgICA8cCBjbGFzcz1cXFwiY29udHJvbFxcXCI+XFxyXFxuICAgICAgICA8aW5wdXQgY2xhc3M9XFxcImlucHV0XFxcIiBkYXRhLWtleT1cXFwibWF4UmVzcG9uc2VzXFxcIiB0eXBlPVxcXCJudW1iZXJcXFwiPlxcclxcbiAgICA8L3A+XFxyXFxuICAgIDxwIGNsYXNzPVxcXCJjb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxsYWJlbCBjbGFzcz1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwibm90aWZ5XFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgTmV3IGNoYXQgbm90aWZpY2F0aW9uc1xcclxcbiAgICAgICAgPC9sYWJlbD5cXHJcXG4gICAgPC9wPlxcclxcblxcclxcbiAgICA8aHI+XFxyXFxuXFxyXFxuICAgIDxoMyBjbGFzcz1cXFwidGl0bGVcXFwiPkFkdmFuY2VkIFNldHRpbmdzPC9oMz5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwibWVzc2FnZSBpcy13YXJuaW5nXFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcIm1lc3NhZ2UtaGVhZGVyXFxcIj5cXHJcXG4gICAgICAgICAgICA8cD5XYXJuaW5nPC9wPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJtZXNzYWdlLWJvZHlcXFwiPlxcclxcbiAgICAgICAgICAgIDxwPkNoYW5naW5nIHRoZXNlIG9wdGlvbnMgY2FuIHJlc3VsdCBpbiB1bmV4cGVjdGVkIGJlaGF2aW9yLiA8YSBocmVmPVxcXCJodHRwczovL2dpdGh1Yi5jb20vQmlibGlvZmlsZS9CbG9ja2hlYWRzLU1lc3NhZ2VCb3Qvd2lraS8xLi1BZHZhbmNlZC1PcHRpb25zL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlJlYWQgdGhpcyBmaXJzdDwvYT48L3A+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICAgIDxwIGNsYXNzPVxcXCJjb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxsYWJlbCBjbGFzcz1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwicmVnZXhUcmlnZ2Vyc1xcXCIgdHlwZT1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIFBhcnNlIHRyaWdnZXJzIGFzIFJlZ0V4XFxyXFxuICAgICAgICA8L2xhYmVsPlxcclxcbiAgICA8L3A+XFxyXFxuICAgIDxwIGNsYXNzPVxcXCJjb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxsYWJlbCBjbGFzcz1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwiZGlzYWJsZVRyaW1cXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIj5cXHJcXG4gICAgICAgICAgICBEaXNhYmxlIHdoaXRlc3BhY2UgdHJpbW1pbmdcXHJcXG4gICAgICAgIDwvbGFiZWw+XFxyXFxuICAgIDwvcD5cXHJcXG4gICAgPHAgY2xhc3M9XFxcImNvbnRyb2xcXFwiPlxcclxcbiAgICAgICAgPGxhYmVsIGNsYXNzPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJzcGxpdE1lc3NhZ2VzXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgU3BsaXQgbWVzc2FnZXNcXHJcXG4gICAgICAgIDwvbGFiZWw+XFxyXFxuICAgIDwvcD5cXHJcXG4gICAgPGxhYmVsIGNsYXNzPVxcXCJsYWJlbFxcXCI+U3BsaXQgdG9rZW46PC9sYWJlbD5cXHJcXG4gICAgPHAgY2xhc3M9XFxcImNvbnRyb2xcXFwiPlxcclxcbiAgICAgICAgPGlucHV0IGNsYXNzPVxcXCJpbnB1dFxcXCIgZGF0YS1rZXk9XFxcInNwbGl0VG9rZW5cXFwiIHR5cGU9XFxcInRleHRcXFwiPlxcclxcbiAgICA8L3A+XFxyXFxuXFxyXFxuICAgIDxocj5cXHJcXG5cXHJcXG4gICAgPGgzIGNsYXNzPVxcXCJ0aXRsZVxcXCI+QmFja3VwIC8gUmVzdG9yZTwvaDM+XFxyXFxuICAgIDxhIGNsYXNzPVxcXCJidXR0b25cXFwiIGlkPVxcXCJtYl9iYWNrdXBfc2F2ZVxcXCI+R2V0IGJhY2t1cCBjb2RlPC9hPlxcclxcbiAgICA8YSBjbGFzcz1cXFwiYnV0dG9uXFxcIiBpZD1cXFwibWJfYmFja3VwX2xvYWRcXFwiPkltcG9ydCBiYWNrdXA8L2E+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG4vLyBTaG93IHByZWZzXHJcbk9iamVjdC5rZXlzKHByZWZzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICB2YXIgZWwgPSB0YWIucXVlcnlTZWxlY3RvcihgW2RhdGEta2V5PVwiJHtrZXl9XCJdYCk7XHJcbiAgICBzd2l0Y2ggKHR5cGVvZiBwcmVmc1trZXldKSB7XHJcbiAgICAgICAgY2FzZSAnYm9vbGVhbic6XHJcbiAgICAgICAgICAgIGVsLmNoZWNrZWQgPSBwcmVmc1trZXldO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBlbC52YWx1ZSA9IHByZWZzW2tleV07XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbi8vIFdhdGNoIGZvciBjaGFuZ2VzXHJcbnRhYi5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgdmFyIGdldFZhbHVlID0gKGtleSkgPT4gdGFiLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWtleT1cIiR7a2V5fVwiXWApLnZhbHVlO1xyXG4gICAgdmFyIGdldEludCA9IChrZXkpID0+ICtnZXRWYWx1ZShrZXkpO1xyXG4gICAgdmFyIGdldENoZWNrZWQgPSAoa2V5KSA9PiB0YWIucXVlcnlTZWxlY3RvcihgW2RhdGEta2V5PVwiJHtrZXl9XCJdYCkuY2hlY2tlZDtcclxuXHJcbiAgICBPYmplY3Qua2V5cyhwcmVmcykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIHZhciBmdW5jO1xyXG5cclxuICAgICAgICBzd2l0Y2godHlwZW9mIHByZWZzW2tleV0pIHtcclxuICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gZ2V0Q2hlY2tlZDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxyXG4gICAgICAgICAgICAgICAgZnVuYyA9IGdldEludDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgZnVuYyA9IGdldFZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJlZnNba2V5XSA9IGZ1bmMoa2V5KTtcclxuICAgIH0pO1xyXG59KTtcclxuXHJcblxyXG4vLyBHZXQgYmFja3VwXHJcbnRhYi5xdWVyeVNlbGVjdG9yKCcjbWJfYmFja3VwX3NhdmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIHNob3dCYWNrdXAoKSB7XHJcbiAgICB2YXIgYmFja3VwID0gSlNPTi5zdHJpbmdpZnkobG9jYWxTdG9yYWdlKS5yZXBsYWNlKC88L2csICcmbHQ7Jyk7XHJcbiAgICB1aS5hbGVydChgQ29weSB0aGlzIHRvIGEgc2FmZSBwbGFjZTo8YnI+PHRleHRhcmVhIGNsYXNzPVwidGV4dGFyZWFcIj4ke2JhY2t1cH08L3RleHRhcmVhPmApO1xyXG59KTtcclxuXHJcblxyXG4vLyBMb2FkIGJhY2t1cFxyXG50YWIucXVlcnlTZWxlY3RvcignI21iX2JhY2t1cF9sb2FkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBsb2FkQmFja3VwKCkge1xyXG4gICAgdWkuYWxlcnQoJ0VudGVyIHRoZSBiYWNrdXAgY29kZTo8dGV4dGFyZWEgY2xhc3M9XCJ0ZXh0YXJlYVwiPjwvdGV4dGFyZWE+JyxcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICB7IHRleHQ6ICdMb2FkICYgcmVmcmVzaCBwYWdlJywgc3R5bGU6ICdpcy1zdWNjZXNzJywgYWN0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQgdGV4dGFyZWEnKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUgPSBKU09OLnBhcnNlKGNvZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvZGUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYmFja3VwJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVpLm5vdGlmeSgnSW52YWxpZCBiYWNrdXAgY29kZS4gTm8gYWN0aW9uIHRha2VuLicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvZGUpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBjb2RlW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICB7IHRleHQ6ICdDYW5jZWwnIH1cclxuICAgICAgICAgICAgICAgIF0pO1xyXG59KTtcclxuIiwiY29uc3QgYmhmYW5zYXBpID0gcmVxdWlyZSgnbGlicmFyaWVzL2JoZmFuc2FwaScpO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBNZXNzYWdlQm90RXh0ZW5zaW9uID0gcmVxdWlyZSgnTWVzc2FnZUJvdEV4dGVuc2lvbicpO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0V4dGVuc2lvbnMnLCAnc2V0dGluZ3MnKTtcclxudGFiLmlubmVySFRNTCA9ICc8c3R5bGU+JyArXHJcbiAgICBcIkBrZXlmcmFtZXMgc3BpbkFyb3VuZHtmcm9te3RyYW5zZm9ybTpyb3RhdGUoMGRlZyl9dG97dHJhbnNmb3JtOnJvdGF0ZSgzNTlkZWcpfX0jZXh0c3tib3JkZXItdG9wOjFweCBzb2xpZCAjMDAwfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsjZXh0cyAuY2FyZC1jb250ZW50e2hlaWdodDoxMDVweH19XFxuXCIgK1xyXG4gICAgJzwvc3R5bGU+JyArXHJcbiAgICBcIjx0ZW1wbGF0ZSBpZD1cXFwiZXh0VGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb2x1bW4gaXMtb25lLXRoaXJkLWRlc2t0b3AgaXMtaGFsZi10YWJsZXRcXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiY2FyZFxcXCI+XFxyXFxuICAgICAgICAgICAgPGhlYWRlciBjbGFzcz1cXFwiY2FyZC1oZWFkZXJcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cXFwiY2FyZC1oZWFkZXItdGl0bGVcXFwiPjwvcD5cXHJcXG4gICAgICAgICAgICA8L2hlYWRlcj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjYXJkLWNvbnRlbnRcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiY29udGVudFxcXCI+PC9zcGFuPlxcclxcbiAgICAgICAgICAgIDwvZGl2PlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImNhcmQtZm9vdGVyXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPGEgY2xhc3M9XFxcImNhcmQtZm9vdGVyLWl0ZW1cXFwiPkluc3RhbGw8L2E+XFxyXFxuICAgICAgICAgICAgPC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9leHRlbnNpb25zXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+TG9hZCBCeSBJRC9VUkw8L3NwYW4+XFxyXFxuICAgICAgICA8aDM+RXh0ZW5zaW9ucyBjYW4gaW5jcmVhc2UgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIGJvdC48L2gzPlxcclxcbiAgICAgICAgPHNwYW4+SW50ZXJlc3RlZCBpbiBjcmVhdGluZyBvbmU/IDxhIGhyZWY9XFxcImh0dHBzOi8vZ2l0aHViLmNvbS9CaWJsaW9maWxlL0Jsb2NraGVhZHMtTWVzc2FnZUJvdC93aWtpLzIuLURldmVsb3BtZW50Oi1TdGFydC1IZXJlXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+U3RhcnQgaGVyZS48L2E+PC9zcGFuPlxcclxcbiAgICA8L3NlY3Rpb24+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImV4dHNcXFwiIGNsYXNzPVxcXCJjb2x1bW5zIGlzLW11bHRpbGluZVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdXNlZCB0byBhZGQgYSBjYXJkIGZvciBhbiBleHRlbnNpb24uXHJcbiAqXHJcbiAqIGV4dGVuc2lvbiBpcyBleHBlY3RlZCB0byBjb250YWluIGEgdGl0bGUsIHNuaXBwZXQsIGFuZCBpZFxyXG4gKi9cclxuZnVuY3Rpb24gYWRkRXh0ZW5zaW9uQ2FyZChleHRlbnNpb24pIHtcclxuICAgIGlmICghdGFiLnF1ZXJ5U2VsZWN0b3IoYCNtYl9leHRlbnNpb25zIFtkYXRhLWlkPVwiJHtleHRlbnNpb24uaWR9XCJdYCkpIHtcclxuICAgICAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNleHRUZW1wbGF0ZScsICcjZXh0cycsIFtcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnLmNhcmQtaGVhZGVyLXRpdGxlJywgdGV4dDogZXh0ZW5zaW9uLnRpdGxlfSxcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnLmNvbnRlbnQnLCBodG1sOiBleHRlbnNpb24uc25pcHBldH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnLmNhcmQtZm9vdGVyLWl0ZW0nLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogTWVzc2FnZUJvdEV4dGVuc2lvbi5pc0xvYWRlZChleHRlbnNpb24uaWQpID8gJ1JlbW92ZScgOiAnSW5zdGFsbCcsXHJcbiAgICAgICAgICAgICAgICAnZGF0YS1pZCc6IGV4dGVuc2lvbi5pZFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vQ3JlYXRlIHRoZSBleHRlbnNpb24gc3RvcmUgcGFnZVxyXG5iaGZhbnNhcGkuZ2V0U3RvcmUoKS50aGVuKHJlc3AgPT4ge1xyXG4gICAgaWYgKHJlc3Auc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXh0cycpLmlubmVySFRNTCArPSByZXNwLm1lc3NhZ2U7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3AubWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgICByZXNwLmV4dGVuc2lvbnMuZm9yRWFjaChhZGRFeHRlbnNpb25DYXJkKTtcclxufSkuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKTtcclxuXHJcbi8vIEluc3RhbGwgLyB1bmluc3RhbGwgZXh0ZW5zaW9uc1xyXG50YWIucXVlcnlTZWxlY3RvcignI2V4dHMnKVxyXG4gICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gZXh0QWN0aW9ucyhlKSB7XHJcbiAgICAgICAgdmFyIGVsID0gZS50YXJnZXQ7XHJcbiAgICAgICAgdmFyIGlkID0gZWwuZGF0YXNldC5pZDtcclxuXHJcbiAgICAgICAgaWYgKCFpZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZWwudGV4dENvbnRlbnQgPT0gJ0luc3RhbGwnKSB7XHJcbiAgICAgICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2lzLWxvYWRpbmcnKTtcclxuICAgICAgICAgICAgTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsKGlkKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBNZXNzYWdlQm90RXh0ZW5zaW9uLnVuaW5zdGFsbChpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG50YWIucXVlcnlTZWxlY3RvcignLmJ1dHRvbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gbG9hZEV4dGVuc2lvbigpIHtcclxuICAgIHVpLmFsZXJ0KCdFbnRlciB0aGUgSUQgb3IgVVJMIG9mIGFuIGV4dGVuc2lvbjo8YnI+PGlucHV0IGNsYXNzPVwiaW5wdXRcIi8+JyxcclxuICAgICAgICBbXHJcbiAgICAgICAgICAgIHt0ZXh0OiAnTG9hZCcsIHN0eWxlOiAnaXMtc3VjY2VzcycsIGFjdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZXh0UmVmID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IGlucHV0JykudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXh0UmVmLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChleHRSZWYuc3RhcnRzV2l0aCgnaHR0cCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zcmMgPSBleHRSZWY7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIE1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbChleHRSZWYpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHt0ZXh0OiAnQ2FuY2VsJ31cclxuICAgICAgICBdKTtcclxufSk7XHJcblxyXG5cclxuXHJcbmhvb2sub24oJ2V4dGVuc2lvbi5pbnN0YWxsJywgZnVuY3Rpb24oaWQpIHtcclxuICAgIC8vIFNob3cgcmVtb3ZlIHRvIGxldCB1c2VycyByZW1vdmUgZXh0ZW5zaW9uc1xyXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNtYl9leHRlbnNpb25zIFtkYXRhLWlkPVwiJHtpZH1cIl1gKTtcclxuICAgIGlmIChidXR0b24pIHtcclxuICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnUmVtb3ZlJztcclxuICAgICAgICBidXR0b24uY2xhc3NMaXN0LnJlbW92ZSgnaXMtbG9hZGluZycpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBiaGZhbnNhcGkuZ2V0RXh0ZW5zaW9uSW5mbyhpZClcclxuICAgICAgICAgICAgLnRoZW4oYWRkRXh0ZW5zaW9uQ2FyZCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuaG9vay5vbignZXh0ZW5zaW9uLnVuaW5zdGFsbCcsIGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAvLyBTaG93IHJlbW92ZWQgZm9yIHN0b3JlIGluc3RhbGwgYnV0dG9uXHJcbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI21iX2V4dGVuc2lvbnMgW2RhdGEtaWQ9XCIke2lkfVwiXWApO1xyXG4gICAgaWYgKGJ1dHRvbikge1xyXG4gICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICdSZW1vdmVkJztcclxuICAgICAgICBidXR0b24uY2xhc3NMaXN0LmFkZCgnaXMtZGlzYWJsZWQnKTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gJ0luc3RhbGwnO1xyXG4gICAgICAgICAgICBidXR0b24uY2xhc3NMaXN0LnJlbW92ZSgnaXMtZGlzYWJsZWQnKTtcclxuICAgICAgICB9LCAzMDAwKTtcclxuICAgIH1cclxufSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxudWkuYWRkVGFiR3JvdXAoJ1NldHRpbmdzJywgJ3NldHRpbmdzJyk7XHJcblxyXG5yZXF1aXJlKCcuL2JvdC9wYWdlJyk7XHJcbnJlcXVpcmUoJy4vZXh0ZW5zaW9ucycpO1xyXG4iLCIvLyBPdmVyd3JpdGUgdGhlIHBvbGxDaGF0IGZ1bmN0aW9uIHRvIGtpbGwgdGhlIGRlZmF1bHQgY2hhdCBmdW5jdGlvblxyXG53aW5kb3cucG9sbENoYXQgPSBmdW5jdGlvbigpIHt9O1xyXG5cclxuLy8gRmlyc3QgdGltZSB0aGUgYm90IGhhcyBiZWVuIGxvYWRlZD9cclxudmFyIGZpcnN0TG9hZCA9IGxvY2FsU3RvcmFnZS5sZW5ndGggPT0gMDtcclxuXHJcbi8vIE92ZXJ3cml0ZSB0aGUgb2xkIHBhZ2VcclxuZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSAnJztcclxuLy8gU3R5bGUgcmVzZXRcclxuQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbdHlwZT1cInRleHQvY3NzXCJdJykpXHJcbiAgICAuZm9yRWFjaChlbCA9PiBlbC5yZW1vdmUoKSk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCd0aXRsZScpLnRleHRDb250ZW50ID0gJ0NvbnNvbGUgLSBNZXNzYWdlQm90JztcclxuXHJcbi8vIFNldCB0aGUgaWNvbiB0byB0aGUgYmxvY2toZWFkIGljb24gdXNlZCBvbiB0aGUgZm9ydW1zXHJcbnZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcclxuZWwucmVsID0gJ2ljb24nO1xyXG5lbC5ocmVmID0gJ2h0dHBzOi8vaXMuZ2QvTUJ2VUhGJztcclxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG5yZXF1aXJlKCdjb25zb2xlLWJyb3dzZXJpZnknKTtcclxucmVxdWlyZSgnYm90L21pZ3JhdGlvbicpO1xyXG5cclxuY29uc3QgYmhmYW5zYXBpID0gcmVxdWlyZSgnbGlicmFyaWVzL2JoZmFuc2FwaScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5ob29rLm9uKCdlcnJvcl9yZXBvcnQnLCBmdW5jdGlvbihtc2cpIHtcclxuICAgIHVpLm5vdGlmeShtc2cpO1xyXG59KTtcclxuXHJcbi8vIGp1c3QgcmVxdWlyZShjb25zb2xlKSBkb2Vzbid0IHdvcmsgYXMgY29uc29sZSBpcyBhIGJyb3dzZXJpZnkgbW9kdWxlLlxyXG5yZXF1aXJlKCcuL2NvbnNvbGUnKTtcclxuLy8gQnkgZGVmYXVsdCBubyB0YWIgaXMgc2VsZWN0ZWQsIHNob3cgdGhlIGNvbnNvbGUuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uYXYtc2xpZGVyLWNvbnRhaW5lciBzcGFuJykuY2xpY2soKTtcclxucmVxdWlyZSgnbWVzc2FnZXMnKTtcclxucmVxdWlyZSgnc2V0dGluZ3MnKTtcclxuXHJcbi8vIEVycm9yIHJlcG9ydGluZ1xyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoZXJyKSA9PiB7XHJcbiAgICBpZiAoIVsnU2NyaXB0IGVycm9yLicsICdXb3JsZCBub3QgcnVubmluZycsICdOZXR3b3JrIEVycm9yJ10uaW5jbHVkZXMoZXJyLm1lc3NhZ2UpKSB7XHJcbiAgICAgICAgYmhmYW5zYXBpLnJlcG9ydEVycm9yKGVycik7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gRXhwb3NlIHRoZSBleHRlbnNpb24gQVBJXHJcbndpbmRvdy5NZXNzYWdlQm90RXh0ZW5zaW9uID0gcmVxdWlyZSgnTWVzc2FnZUJvdEV4dGVuc2lvbicpO1xyXG5pZiAoZmlyc3RMb2FkKSB7XHJcbiAgICB3aW5kb3cuTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsKCd0dXRvcmlhbCcpO1xyXG59IiwicmVxdWlyZSgnLi9wb2x5ZmlsbHMvZGV0YWlscycpO1xyXG5cclxuLy8gQnVpbGQgdGhlIEFQSVxyXG5PYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2xheW91dCcpLFxyXG4gICAgcmVxdWlyZSgnLi90ZW1wbGF0ZScpLFxyXG4gICAgcmVxdWlyZSgnLi9ub3RpZmljYXRpb25zJylcclxuKTtcclxuXHJcbi8vIEZ1bmN0aW9ucyB3aGljaCBhcmUgbm8gbG9uZ2VyIGNvbnRhaW5lZCBpbiB0aGlzIG1vZHVsZSwgYnV0IGFyZSByZXRhaW5lZCBmb3Igbm93IGZvciBiYWNrd2FyZCBjb21wYXRhYmlsaXR5LlxyXG5jb25zdCB3cml0ZSA9IHJlcXVpcmUoJy4uL2NvbnNvbGUvZXhwb3J0cycpLndyaXRlO1xyXG5tb2R1bGUuZXhwb3J0cy5hZGRNZXNzYWdlVG9Db25zb2xlID0gZnVuY3Rpb24obXNnLCBuYW1lID0gJycsIG5hbWVDbGFzcyA9ICcnKSB7XHJcbiAgICBjb25zb2xlLndhcm4oJ3VpLmFkZE1lc3NhZ2VUb0NvbnNvbGUgaGFzIGJlZW4gZGVwcmljYXRlZC4gVXNlIGV4LmNvbnNvbGUud3JpdGUgaW5zdGVhZC4nKTtcclxuICAgIHdyaXRlKG1zZywgbmFtZSwgbmFtZUNsYXNzKTtcclxufTtcclxuIiwiLyoqXHJcbiAqIEBmaWxlIENvbnRhaW5zIGZ1bmN0aW9ucyBmb3IgbWFuYWdpbmcgdGhlIHBhZ2UgbGF5b3V0XHJcbiAqL1xyXG5cclxuXHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5cclxuLy8gQnVpbGQgcGFnZSAtIG9ubHkgY2FzZSBpbiB3aGljaCBib2R5LmlubmVySFRNTCBzaG91bGQgYmUgdXNlZC5cclxuZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgKz0gXCI8aGVhZGVyIGNsYXNzPVxcXCJoZWFkZXIgaXMtZml4ZWQtdG9wXFxcIj5cXHJcXG4gIDxuYXYgY2xhc3M9XFxcIm5hdi1pbnZlcnNlIG5hdiBoYXMtc2hhZG93XFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwibmF2LWxlZnRcXFwiPlxcclxcbiAgICAgIDxkaXYgY2xhc3M9XFxcIm5hdi1pdGVtIG5hdi1zbGlkZXItdG9nZ2xlXFxcIj5cXHJcXG4gICAgICAgIDxpbWcgc3JjPVxcXCJodHRwczovL2kuaW1nc2FmZS5vcmcvODBhMTEyOWEzNi5wbmdcXFwiPlxcclxcbiAgICAgIDwvZGl2PlxcclxcbiAgICAgIDxhIGNsYXNzPVxcXCJuYXYtaXRlbSBpcy10YWIgbmF2LXNsaWRlci10b2dnbGVcXFwiPlxcclxcbiAgICAgICAgTWVudVxcclxcbiAgICAgIDwvYT5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICA8L25hdj5cXHJcXG48L2hlYWRlcj5cXHJcXG5cXHJcXG48ZGl2IGNsYXNzPVxcXCJuYXYtc2xpZGVyLWNvbnRhaW5lclxcXCI+XFxyXFxuICAgIDxuYXYgY2xhc3M9XFxcIm5hdi1zbGlkZXJcXFwiIGRhdGEtdGFiLWdyb3VwPVxcXCJtYWluXFxcIj48L25hdj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiaXMtb3ZlcmxheVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuPGRpdiBpZD1cXFwiY29udGFpbmVyXFxcIiBjbGFzcz1cXFwiaGFzLWZpeGVkLW5hdlxcXCI+PC9kaXY+XFxyXFxuXCI7XHJcbmRvY3VtZW50LmhlYWQuaW5uZXJIVE1MICs9ICc8c3R5bGU+JyArXHJcbiAgICBcImh0bWx7b3ZlcmZsb3cteTphdXRvICFpbXBvcnRhbnR9LyohIGJ1bG1hLmlvIHYwLjMuMSB8IE1JVCBMaWNlbnNlIHwgZ2l0aHViLmNvbS9qZ3RobXMvYnVsbWEgKi9Aa2V5ZnJhbWVzIHNwaW5Bcm91bmR7ZnJvbXt0cmFuc2Zvcm06cm90YXRlKDBkZWcpfXRve3RyYW5zZm9ybTpyb3RhdGUoMzU5ZGVnKX19LyohIG1pbmlyZXNldC5jc3MgdjAuMC4yIHwgTUlUIExpY2Vuc2UgfCBnaXRodWIuY29tL2pndGhtcy9taW5pcmVzZXQuY3NzICovaHRtbCxib2R5LHAsb2wsdWwsbGksZGwsZHQsZGQsYmxvY2txdW90ZSxmaWd1cmUsZmllbGRzZXQsbGVnZW5kLHRleHRhcmVhLHByZSxpZnJhbWUsaHIsaDEsaDIsaDMsaDQsaDUsaDZ7bWFyZ2luOjA7cGFkZGluZzowfWgxLGgyLGgzLGg0LGg1LGg2e2ZvbnQtc2l6ZToxMDAlO2ZvbnQtd2VpZ2h0Om5vcm1hbH11bHtsaXN0LXN0eWxlOm5vbmV9YnV0dG9uLGlucHV0LHNlbGVjdCx0ZXh0YXJlYXttYXJnaW46MH1odG1se2JveC1zaXppbmc6Ym9yZGVyLWJveH0qe2JveC1zaXppbmc6aW5oZXJpdH0qOmJlZm9yZSwqOmFmdGVye2JveC1zaXppbmc6aW5oZXJpdH1pbWcsZW1iZWQsb2JqZWN0LGF1ZGlvLHZpZGVve2hlaWdodDphdXRvO21heC13aWR0aDoxMDAlfWlmcmFtZXtib3JkZXI6MH10YWJsZXtib3JkZXItY29sbGFwc2U6Y29sbGFwc2U7Ym9yZGVyLXNwYWNpbmc6MH10ZCx0aHtwYWRkaW5nOjA7dGV4dC1hbGlnbjpsZWZ0fWh0bWx7YmFja2dyb3VuZC1jb2xvcjojZmZmO2ZvbnQtc2l6ZToxNHB4Oy1tb3otb3N4LWZvbnQtc21vb3RoaW5nOmdyYXlzY2FsZTstd2Via2l0LWZvbnQtc21vb3RoaW5nOmFudGlhbGlhc2VkO21pbi13aWR0aDozMDBweDtvdmVyZmxvdy14OmhpZGRlbjtvdmVyZmxvdy15OnNjcm9sbDt0ZXh0LXJlbmRlcmluZzpvcHRpbWl6ZUxlZ2liaWxpdHl9YXJ0aWNsZSxhc2lkZSxmaWd1cmUsZm9vdGVyLGhlYWRlcixoZ3JvdXAsc2VjdGlvbntkaXNwbGF5OmJsb2NrfWJvZHksYnV0dG9uLGlucHV0LHNlbGVjdCx0ZXh0YXJlYXtmb250LWZhbWlseTotYXBwbGUtc3lzdGVtLEJsaW5rTWFjU3lzdGVtRm9udCxcXFwiU2Vnb2UgVUlcXFwiLFxcXCJSb2JvdG9cXFwiLFxcXCJPeHlnZW5cXFwiLFxcXCJVYnVudHVcXFwiLFxcXCJDYW50YXJlbGxcXFwiLFxcXCJGaXJhIFNhbnNcXFwiLFxcXCJEcm9pZCBTYW5zXFxcIixcXFwiSGVsdmV0aWNhIE5ldWVcXFwiLFxcXCJIZWx2ZXRpY2FcXFwiLFxcXCJBcmlhbFxcXCIsc2Fucy1zZXJpZn1jb2RlLHByZXstbW96LW9zeC1mb250LXNtb290aGluZzphdXRvOy13ZWJraXQtZm9udC1zbW9vdGhpbmc6YXV0bztmb250LWZhbWlseTpcXFwiSW5jb25zb2xhdGFcXFwiLFxcXCJDb25zb2xhc1xcXCIsXFxcIk1vbmFjb1xcXCIsbW9ub3NwYWNlfWJvZHl7Y29sb3I6IzRhNGE0YTtmb250LXNpemU6MXJlbTtmb250LXdlaWdodDo0MDA7bGluZS1oZWlnaHQ6MS41fWF7Y29sb3I6IzE4MmI3MztjdXJzb3I6cG9pbnRlcjt0ZXh0LWRlY29yYXRpb246bm9uZTt0cmFuc2l0aW9uOm5vbmUgODZtcyBlYXNlLW91dH1hOmhvdmVye2NvbG9yOiMzNjM2MzZ9Y29kZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6cmVkO2ZvbnQtc2l6ZTowLjhlbTtmb250LXdlaWdodDpub3JtYWw7cGFkZGluZzowLjI1ZW0gMC41ZW0gMC4yNWVtfWhye2JhY2tncm91bmQtY29sb3I6I2RiZGJkYjtib3JkZXI6bm9uZTtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcHg7bWFyZ2luOjEuNXJlbSAwfWltZ3ttYXgtd2lkdGg6MTAwJX1pbnB1dFt0eXBlPVxcXCJjaGVja2JveFxcXCJdLGlucHV0W3R5cGU9XFxcInJhZGlvXFxcIl17dmVydGljYWwtYWxpZ246YmFzZWxpbmV9c21hbGx7Zm9udC1zaXplOjAuOGVtfXNwYW57Zm9udC1zdHlsZTppbmhlcml0O2ZvbnQtd2VpZ2h0OmluaGVyaXR9c3Ryb25ne2NvbG9yOiMzNjM2MzY7Zm9udC13ZWlnaHQ6NzAwfXByZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzRhNGE0YTtmb250LXNpemU6MC44ZW07d2hpdGUtc3BhY2U6cHJlO3dvcmQtd3JhcDpub3JtYWx9cHJlIGNvZGV7YmFja2dyb3VuZDpub25lO2NvbG9yOmluaGVyaXQ7ZGlzcGxheTpibG9jaztmb250LXNpemU6MWVtO292ZXJmbG93LXg6YXV0bztwYWRkaW5nOjEuMjVyZW0gMS41cmVtfXRhYmxle3dpZHRoOjEwMCV9dGFibGUgdGQsdGFibGUgdGh7dGV4dC1hbGlnbjpsZWZ0O3ZlcnRpY2FsLWFsaWduOnRvcH10YWJsZSB0aHtjb2xvcjojMzYzNjM2fS5pcy1ibG9ja3tkaXNwbGF5OmJsb2NrfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtYmxvY2stbW9iaWxle2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5pcy1ibG9jay10YWJsZXR7ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtYmxvY2stdGFibGV0LW9ubHl7ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWJsb2NrLXRvdWNoe2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuaXMtYmxvY2stZGVza3RvcHtkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCkgYW5kIChtYXgtd2lkdGg6IDExOTFweCl7LmlzLWJsb2NrLWRlc2t0b3Atb25seXtkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWJsb2NrLXdpZGVzY3JlZW57ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX0uaXMtZmxleHtkaXNwbGF5OmZsZXh9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1mbGV4LW1vYmlsZXtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5pcy1mbGV4LXRhYmxldHtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWZsZXgtdGFibGV0LW9ubHl7ZGlzcGxheTpmbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtZmxleC10b3VjaHtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuaXMtZmxleC1kZXNrdG9we2Rpc3BsYXk6ZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpIGFuZCAobWF4LXdpZHRoOiAxMTkxcHgpey5pcy1mbGV4LWRlc2t0b3Atb25seXtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtZmxleC13aWRlc2NyZWVue2Rpc3BsYXk6ZmxleCAhaW1wb3J0YW50fX0uaXMtaW5saW5le2Rpc3BsYXk6aW5saW5lfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtaW5saW5lLW1vYmlsZXtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmlzLWlubGluZS10YWJsZXR7ZGlzcGxheTppbmxpbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWlubGluZS10YWJsZXQtb25seXtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWlubGluZS10b3VjaHtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5pcy1pbmxpbmUtZGVza3RvcHtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpIGFuZCAobWF4LXdpZHRoOiAxMTkxcHgpey5pcy1pbmxpbmUtZGVza3RvcC1vbmx5e2Rpc3BsYXk6aW5saW5lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWlubGluZS13aWRlc2NyZWVue2Rpc3BsYXk6aW5saW5lICFpbXBvcnRhbnR9fS5pcy1pbmxpbmUtYmxvY2t7ZGlzcGxheTppbmxpbmUtYmxvY2t9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1pbmxpbmUtYmxvY2stbW9iaWxle2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaXMtaW5saW5lLWJsb2NrLXRhYmxldHtkaXNwbGF5OmlubGluZS1ibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaW5saW5lLWJsb2NrLXRhYmxldC1vbmx5e2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaW5saW5lLWJsb2NrLXRvdWNoe2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmlzLWlubGluZS1ibG9jay1kZXNrdG9we2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCkgYW5kIChtYXgtd2lkdGg6IDExOTFweCl7LmlzLWlubGluZS1ibG9jay1kZXNrdG9wLW9ubHl7ZGlzcGxheTppbmxpbmUtYmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtaW5saW5lLWJsb2NrLXdpZGVzY3JlZW57ZGlzcGxheTppbmxpbmUtYmxvY2sgIWltcG9ydGFudH19LmlzLWlubGluZS1mbGV4e2Rpc3BsYXk6aW5saW5lLWZsZXh9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1pbmxpbmUtZmxleC1tb2JpbGV7ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmlzLWlubGluZS1mbGV4LXRhYmxldHtkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1pbmxpbmUtZmxleC10YWJsZXQtb25seXtkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaW5saW5lLWZsZXgtdG91Y2h7ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5pcy1pbmxpbmUtZmxleC1kZXNrdG9we2Rpc3BsYXk6aW5saW5lLWZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KSBhbmQgKG1heC13aWR0aDogMTE5MXB4KXsuaXMtaW5saW5lLWZsZXgtZGVza3RvcC1vbmx5e2Rpc3BsYXk6aW5saW5lLWZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtaW5saW5lLWZsZXgtd2lkZXNjcmVlbntkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fS5pcy1jbGVhcmZpeDphZnRlcntjbGVhcjpib3RoO2NvbnRlbnQ6XFxcIiBcXFwiO2Rpc3BsYXk6dGFibGV9LmlzLXB1bGxlZC1sZWZ0e2Zsb2F0OmxlZnR9LmlzLXB1bGxlZC1yaWdodHtmbG9hdDpyaWdodH0uaXMtY2xpcHBlZHtvdmVyZmxvdzpoaWRkZW4gIWltcG9ydGFudH0uaXMtb3ZlcmxheXtib3R0b206MDtsZWZ0OjA7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDt0b3A6MH0uaGFzLXRleHQtY2VudGVyZWR7dGV4dC1hbGlnbjpjZW50ZXJ9Lmhhcy10ZXh0LWxlZnR7dGV4dC1hbGlnbjpsZWZ0fS5oYXMtdGV4dC1yaWdodHt0ZXh0LWFsaWduOnJpZ2h0fS5pcy1oaWRkZW57ZGlzcGxheTpub25lICFpbXBvcnRhbnR9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1oaWRkZW4tbW9iaWxle2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmlzLWhpZGRlbi10YWJsZXR7ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1oaWRkZW4tdGFibGV0LW9ubHl7ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaGlkZGVuLXRvdWNoe2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5pcy1oaWRkZW4tZGVza3RvcHtkaXNwbGF5Om5vbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KSBhbmQgKG1heC13aWR0aDogMTE5MXB4KXsuaXMtaGlkZGVuLWRlc2t0b3Atb25seXtkaXNwbGF5Om5vbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtaGlkZGVuLXdpZGVzY3JlZW57ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fS5pcy1kaXNhYmxlZHtwb2ludGVyLWV2ZW50czpub25lfS5pcy1tYXJnaW5sZXNze21hcmdpbjowICFpbXBvcnRhbnR9LmlzLXBhZGRpbmdsZXNze3BhZGRpbmc6MCAhaW1wb3J0YW50fS5pcy11bnNlbGVjdGFibGV7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lfS5ib3h7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1yYWRpdXM6NXB4O2JveC1zaGFkb3c6MCAycHggM3B4IHJnYmEoMTAsMTAsMTAsMC4xKSwwIDAgMCAxcHggcmdiYSgxMCwxMCwxMCwwLjEpO2Rpc3BsYXk6YmxvY2s7cGFkZGluZzoxLjI1cmVtfS5ib3g6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX1hLmJveDpob3ZlcixhLmJveDpmb2N1c3tib3gtc2hhZG93OjAgMnB4IDNweCByZ2JhKDEwLDEwLDEwLDAuMSksMCAwIDAgMXB4ICMxODJiNzN9YS5ib3g6YWN0aXZle2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKSwwIDAgMCAxcHggIzE4MmI3M30uYnV0dG9uey1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjNweDtib3gtc2hhZG93Om5vbmU7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MXJlbTtoZWlnaHQ6Mi4yODVlbTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3A7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lO2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7Y29sb3I6IzM2MzYzNjtjdXJzb3I6cG9pbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW07dGV4dC1hbGlnbjpjZW50ZXI7d2hpdGUtc3BhY2U6bm93cmFwfS5idXR0b246Zm9jdXMsLmJ1dHRvbi5pcy1mb2N1c2VkLC5idXR0b246YWN0aXZlLC5idXR0b24uaXMtYWN0aXZle291dGxpbmU6bm9uZX0uYnV0dG9uW2Rpc2FibGVkXSwuYnV0dG9uLmlzLWRpc2FibGVke3BvaW50ZXItZXZlbnRzOm5vbmV9LmJ1dHRvbiBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uYnV0dG9uIC5pY29uOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS4yNXJlbTttYXJnaW4tcmlnaHQ6LjVyZW19LmJ1dHRvbiAuaWNvbjpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi41cmVtO21hcmdpbi1yaWdodDotLjI1cmVtfS5idXR0b24gLmljb246Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS4yNXJlbSl9LmJ1dHRvbiAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0OjByZW19LmJ1dHRvbiAuaWNvbi5pcy1zbWFsbDpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDowcmVtfS5idXR0b24gLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAwcmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgMHJlbSl9LmJ1dHRvbiAuaWNvbi5pcy1tZWRpdW06Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjVyZW19LmJ1dHRvbiAuaWNvbi5pcy1tZWRpdW06bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS41cmVtfS5idXR0b24gLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS41cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS41cmVtKX0uYnV0dG9uIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LTFyZW19LmJ1dHRvbiAuaWNvbi5pcy1sYXJnZTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotMXJlbX0uYnV0dG9uIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLTFyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtMXJlbSl9LmJ1dHRvbjpob3ZlciwuYnV0dG9uLmlzLWhvdmVyZWR7Ym9yZGVyLWNvbG9yOiNiNWI1YjU7Y29sb3I6IzM2MzYzNn0uYnV0dG9uOmZvY3VzLC5idXR0b24uaXMtZm9jdXNlZHtib3JkZXItY29sb3I6IzE4MmI3Mztib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDI0LDQzLDExNSwwLjI1KTtjb2xvcjojMzYzNjM2fS5idXR0b246YWN0aXZlLC5idXR0b24uaXMtYWN0aXZle2JvcmRlci1jb2xvcjojNGE0YTRhO2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlua3tiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojNGE0YTRhO3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmV9LmJ1dHRvbi5pcy1saW5rOmhvdmVyLC5idXR0b24uaXMtbGluay5pcy1ob3ZlcmVkLC5idXR0b24uaXMtbGluazpmb2N1cywuYnV0dG9uLmlzLWxpbmsuaXMtZm9jdXNlZCwuYnV0dG9uLmlzLWxpbms6YWN0aXZlLC5idXR0b24uaXMtbGluay5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy13aGl0ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy13aGl0ZTpob3ZlciwuYnV0dG9uLmlzLXdoaXRlLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojZjlmOWY5O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGU6Zm9jdXMsLmJ1dHRvbi5pcy13aGl0ZS5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDI1NSwyNTUsMjU1LDAuMjUpO2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy13aGl0ZTphY3RpdmUsLmJ1dHRvbi5pcy13aGl0ZS5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojZjJmMmYyO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLXdoaXRlLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojMDAwfS5idXR0b24uaXMtd2hpdGUuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgIzBhMGEwYSAjMGEwYTBhICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy13aGl0ZS5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy13aGl0ZS5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXdoaXRlLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6IzBhMGEwYTtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNre2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNrOmhvdmVyLC5idXR0b24uaXMtYmxhY2suaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiMwNDA0MDQ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjazpmb2N1cywuYnV0dG9uLmlzLWJsYWNrLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMTAsMTAsMTAsMC4yNSk7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNrOmFjdGl2ZSwuYnV0dG9uLmlzLWJsYWNrLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMwMDA7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojZmZmfS5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1ibGFjay5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZmZmICNmZmYgIWltcG9ydGFudH0uYnV0dG9uLmlzLWJsYWNrLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMwYTBhMGE7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLWJsYWNrLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtYmxhY2suaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2JvcmRlci1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtbGlnaHR7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlnaHQ6aG92ZXIsLmJ1dHRvbi5pcy1saWdodC5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6I2VlZTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0OmZvY3VzLC5idXR0b24uaXMtbGlnaHQuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgyNDUsMjQ1LDI0NSwwLjI1KTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlnaHQ6YWN0aXZlLC5idXR0b24uaXMtbGlnaHQuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6I2U4ZThlODtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6IzI5MjkyOX0uYnV0dG9uLmlzLWxpZ2h0LmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICMzNjM2MzYgIzM2MzYzNiAhaW1wb3J0YW50fS5idXR0b24uaXMtbGlnaHQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2Y1ZjVmNTtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtbGlnaHQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1saWdodC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMzNjM2MzY7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1kYXJre2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcms6aG92ZXIsLmJ1dHRvbi5pcy1kYXJrLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojMmYyZjJmO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFyazpmb2N1cywuYnV0dG9uLmlzLWRhcmsuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSg1NCw1NCw1NCwwLjI1KTtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFyazphY3RpdmUsLmJ1dHRvbi5pcy1kYXJrLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMyOTI5Mjk7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZThlOGU4fS5idXR0b24uaXMtZGFyay5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZjVmNWY1ICNmNWY1ZjUgIWltcG9ydGFudH0uYnV0dG9uLmlzLWRhcmsuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6IzM2MzYzNjtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtZGFyay5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWRhcmsuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2JvcmRlci1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtcHJpbWFyeXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5OmhvdmVyLC5idXR0b24uaXMtcHJpbWFyeS5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6IzE2Mjc2ODtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXByaW1hcnk6Zm9jdXMsLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMjQsNDMsMTE1LDAuMjUpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5OmFjdGl2ZSwuYnV0dG9uLmlzLXByaW1hcnkuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6IzE0MjM1ZTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMTgyYjczfS5idXR0b24uaXMtcHJpbWFyeS5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50fS5idXR0b24uaXMtcHJpbWFyeS5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMTgyYjczO2NvbG9yOiMxODJiNzN9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtcHJpbWFyeS5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Ym9yZGVyLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtcHJpbWFyeS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMxODJiNzN9LmJ1dHRvbi5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWluZm86aG92ZXIsLmJ1dHRvbi5pcy1pbmZvLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojMjc2Y2RhO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtaW5mbzpmb2N1cywuYnV0dG9uLmlzLWluZm8uaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSg1MCwxMTUsMjIwLDAuMjUpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1pbmZvOmFjdGl2ZSwuYnV0dG9uLmlzLWluZm8uaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6IzIzNjZkMTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMzI3M2RjfS5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1pbmZvLmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50fS5idXR0b24uaXMtaW5mby5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMzI3M2RjO2NvbG9yOiMzMjczZGN9LmJ1dHRvbi5pcy1pbmZvLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtaW5mby5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Ym9yZGVyLWNvbG9yOiMzMjczZGM7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMzMjczZGN9LmJ1dHRvbi5pcy1zdWNjZXNze2JhY2tncm91bmQtY29sb3I6IzIzZDE2MDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3M6aG92ZXIsLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojMjJjNjViO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtc3VjY2Vzczpmb2N1cywuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgzNSwyMDksOTYsMC4yNSk7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3M6YWN0aXZlLC5idXR0b24uaXMtc3VjY2Vzcy5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojMjBiYzU2O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMyM2QxNjB9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2YyZjJmMn0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZiAjZmZmICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMyM2QxNjA7Y29sb3I6IzIzZDE2MH0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6IzIzZDE2MDtib3JkZXItY29sb3I6IzIzZDE2MDtjb2xvcjojZmZmfS5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzIzZDE2MH0uYnV0dG9uLmlzLXdhcm5pbmd7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9LmJ1dHRvbi5pcy13YXJuaW5nOmhvdmVyLC5idXR0b24uaXMtd2FybmluZy5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6I2ZmZGI0YTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZzpmb2N1cywuYnV0dG9uLmlzLXdhcm5pbmcuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgyNTUsMjIxLDg3LDAuMjUpO2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmc6YWN0aXZlLC5idXR0b24uaXMtd2FybmluZy5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojZmZkODNkO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KTtjb2xvcjojZmZkZDU3fS5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmcuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgcmdiYSgwLDAsMCwwLjcpIHJnYmEoMCwwLDAsMC43KSAhaW1wb3J0YW50fS5idXR0b24uaXMtd2FybmluZy5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZkZDU3O2NvbG9yOiNmZmRkNTd9LmJ1dHRvbi5pcy13YXJuaW5nLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtd2FybmluZy5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTc7Ym9yZGVyLWNvbG9yOiNmZmRkNTc7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjpyZ2JhKDAsMCwwLDAuNyk7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLDAuNyk7Y29sb3I6I2ZmZGQ1N30uYnV0dG9uLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWRhbmdlcjpob3ZlciwuYnV0dG9uLmlzLWRhbmdlci5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6I2YyMDAwMDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWRhbmdlcjpmb2N1cywuYnV0dG9uLmlzLWRhbmdlci5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDI1NSwwLDAsMC4yNSk7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWRhbmdlcjphY3RpdmUsLmJ1dHRvbi5pcy1kYW5nZXIuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6I2U2MDAwMDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOnJlZH0uYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZiAjZmZmICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6cmVkO2NvbG9yOnJlZH0uYnV0dG9uLmlzLWRhbmdlci5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWRhbmdlci5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOnJlZDtib3JkZXItY29sb3I6cmVkO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjpyZWR9LmJ1dHRvbi5pcy1zbWFsbHtib3JkZXItcmFkaXVzOjJweDtmb250LXNpemU6Ljc1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb246Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjM3NXJlbTttYXJnaW4tcmlnaHQ6LjM3NXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LjM3NXJlbTttYXJnaW4tcmlnaHQ6LS4zNzVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbjpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uMzc1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS4zNzVyZW0pfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjEyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLXNtYWxsOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uMTI1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjEyNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMTI1cmVtKX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uNjI1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtbWVkaXVtOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uNjI1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS42MjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjYyNXJlbSl9LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0xLjEyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLWxhcmdlOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0xLjEyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLTEuMTI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLTEuMTI1cmVtKX0uYnV0dG9uLmlzLW1lZGl1bXtmb250LXNpemU6MS4yNXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbjpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uMTI1cmVtO21hcmdpbi1yaWdodDouNjI1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LjYyNXJlbTttYXJnaW4tcmlnaHQ6LS4xMjVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb246Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjEyNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMTI1cmVtKX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi4xMjVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtc21hbGw6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LjEyNXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC4xMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAuMTI1cmVtKX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1tZWRpdW06Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjM3NXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1tZWRpdW06bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS4zNzVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS4zNzVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjM3NXJlbSl9LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjg3NXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1sYXJnZTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotLjg3NXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uODc1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS44NzVyZW0pfS5idXR0b24uaXMtbGFyZ2V7Zm9udC1zaXplOjEuNXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6MHJlbTttYXJnaW4tcmlnaHQ6Ljc1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb246bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tbGVmdDouNzVyZW07bWFyZ2luLXJpZ2h0OjByZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbjpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIDByZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAwcmVtKX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LjI1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtc21hbGw6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LjI1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAuMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAuMjVyZW0pfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS4yNXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLW1lZGl1bTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotLjI1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS4yNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMjVyZW0pfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjc1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbGFyZ2U6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS43NXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS43NXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uNzVyZW0pfS5idXR0b25bZGlzYWJsZWRdLC5idXR0b24uaXMtZGlzYWJsZWR7b3BhY2l0eTowLjV9LmJ1dHRvbi5pcy1mdWxsd2lkdGh7ZGlzcGxheTpmbGV4O3dpZHRoOjEwMCV9LmJ1dHRvbi5pcy1sb2FkaW5ne2NvbG9yOnRyYW5zcGFyZW50ICFpbXBvcnRhbnQ7cG9pbnRlci1ldmVudHM6bm9uZX0uYnV0dG9uLmlzLWxvYWRpbmc6YWZ0ZXJ7YW5pbWF0aW9uOnNwaW5Bcm91bmQgNTAwbXMgaW5maW5pdGUgbGluZWFyO2JvcmRlcjoycHggc29saWQgI2RiZGJkYjtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2JvcmRlci1yaWdodC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItdG9wLWNvbG9yOnRyYW5zcGFyZW50O2NvbnRlbnQ6XFxcIlxcXCI7ZGlzcGxheTpibG9jaztoZWlnaHQ6MXJlbTtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoxcmVtO2xlZnQ6NTAlO21hcmdpbi1sZWZ0Oi04cHg7bWFyZ2luLXRvcDotOHB4O3Bvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7cG9zaXRpb246YWJzb2x1dGUgIWltcG9ydGFudH0uY29udGVudHtjb2xvcjojNGE0YTRhfS5jb250ZW50Om5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LmNvbnRlbnQgbGkrbGl7bWFyZ2luLXRvcDowLjI1ZW19LmNvbnRlbnQgcDpub3QoOmxhc3QtY2hpbGQpLC5jb250ZW50IG9sOm5vdCg6bGFzdC1jaGlsZCksLmNvbnRlbnQgdWw6bm90KDpsYXN0LWNoaWxkKSwuY29udGVudCBibG9ja3F1b3RlOm5vdCg6bGFzdC1jaGlsZCksLmNvbnRlbnQgdGFibGU6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjFlbX0uY29udGVudCBoMSwuY29udGVudCBoMiwuY29udGVudCBoMywuY29udGVudCBoNCwuY29udGVudCBoNSwuY29udGVudCBoNntjb2xvcjojMzYzNjM2O2ZvbnQtd2VpZ2h0OjQwMDtsaW5lLWhlaWdodDoxLjEyNX0uY29udGVudCBoMXtmb250LXNpemU6MmVtO21hcmdpbi1ib3R0b206MC41ZW19LmNvbnRlbnQgaDE6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXRvcDoxZW19LmNvbnRlbnQgaDJ7Zm9udC1zaXplOjEuNzVlbTttYXJnaW4tYm90dG9tOjAuNTcxNGVtfS5jb250ZW50IGgyOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi10b3A6MS4xNDI4ZW19LmNvbnRlbnQgaDN7Zm9udC1zaXplOjEuNWVtO21hcmdpbi1ib3R0b206MC42NjY2ZW19LmNvbnRlbnQgaDM6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXRvcDoxLjMzMzNlbX0uY29udGVudCBoNHtmb250LXNpemU6MS4yNWVtO21hcmdpbi1ib3R0b206MC44ZW19LmNvbnRlbnQgaDV7Zm9udC1zaXplOjEuMTI1ZW07bWFyZ2luLWJvdHRvbTowLjg4ODhlbX0uY29udGVudCBoNntmb250LXNpemU6MWVtO21hcmdpbi1ib3R0b206MWVtfS5jb250ZW50IGJsb2NrcXVvdGV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1sZWZ0OjVweCBzb2xpZCAjZGJkYmRiO3BhZGRpbmc6MS4yNWVtIDEuNWVtfS5jb250ZW50IG9se2xpc3Qtc3R5bGU6ZGVjaW1hbCBvdXRzaWRlO21hcmdpbi1sZWZ0OjJlbTttYXJnaW4tcmlnaHQ6MmVtO21hcmdpbi10b3A6MWVtfS5jb250ZW50IHVse2xpc3Qtc3R5bGU6ZGlzYyBvdXRzaWRlO21hcmdpbi1sZWZ0OjJlbTttYXJnaW4tcmlnaHQ6MmVtO21hcmdpbi10b3A6MWVtfS5jb250ZW50IHVsIHVse2xpc3Qtc3R5bGUtdHlwZTpjaXJjbGU7bWFyZ2luLXRvcDowLjVlbX0uY29udGVudCB1bCB1bCB1bHtsaXN0LXN0eWxlLXR5cGU6c3F1YXJlfS5jb250ZW50IHRhYmxle3dpZHRoOjEwMCV9LmNvbnRlbnQgdGFibGUgdGQsLmNvbnRlbnQgdGFibGUgdGh7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci13aWR0aDowIDAgMXB4O3BhZGRpbmc6MC41ZW0gMC43NWVtO3ZlcnRpY2FsLWFsaWduOnRvcH0uY29udGVudCB0YWJsZSB0aHtjb2xvcjojMzYzNjM2O3RleHQtYWxpZ246bGVmdH0uY29udGVudCB0YWJsZSB0cjpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9LmNvbnRlbnQgdGFibGUgdGhlYWQgdGQsLmNvbnRlbnQgdGFibGUgdGhlYWQgdGh7Ym9yZGVyLXdpZHRoOjAgMCAycHg7Y29sb3I6IzM2MzYzNn0uY29udGVudCB0YWJsZSB0Zm9vdCB0ZCwuY29udGVudCB0YWJsZSB0Zm9vdCB0aHtib3JkZXItd2lkdGg6MnB4IDAgMDtjb2xvcjojMzYzNjM2fS5jb250ZW50IHRhYmxlIHRib2R5IHRyOmxhc3QtY2hpbGQgdGQsLmNvbnRlbnQgdGFibGUgdGJvZHkgdHI6bGFzdC1jaGlsZCB0aHtib3JkZXItYm90dG9tLXdpZHRoOjB9LmNvbnRlbnQuaXMtc21hbGx7Zm9udC1zaXplOi43NXJlbX0uY29udGVudC5pcy1tZWRpdW17Zm9udC1zaXplOjEuMjVyZW19LmNvbnRlbnQuaXMtbGFyZ2V7Zm9udC1zaXplOjEuNXJlbX0uaW5wdXQsLnRleHRhcmVhey1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjNweDtib3gtc2hhZG93Om5vbmU7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MXJlbTtoZWlnaHQ6Mi4yODVlbTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3A7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtjb2xvcjojMzYzNjM2O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4xKTttYXgtd2lkdGg6MTAwJTt3aWR0aDoxMDAlfS5pbnB1dDpmb2N1cywuaW5wdXQuaXMtZm9jdXNlZCwuaW5wdXQ6YWN0aXZlLC5pbnB1dC5pcy1hY3RpdmUsLnRleHRhcmVhOmZvY3VzLC50ZXh0YXJlYS5pcy1mb2N1c2VkLC50ZXh0YXJlYTphY3RpdmUsLnRleHRhcmVhLmlzLWFjdGl2ZXtvdXRsaW5lOm5vbmV9LmlucHV0W2Rpc2FibGVkXSwuaW5wdXQuaXMtZGlzYWJsZWQsLnRleHRhcmVhW2Rpc2FibGVkXSwudGV4dGFyZWEuaXMtZGlzYWJsZWR7cG9pbnRlci1ldmVudHM6bm9uZX0uaW5wdXQ6aG92ZXIsLmlucHV0LmlzLWhvdmVyZWQsLnRleHRhcmVhOmhvdmVyLC50ZXh0YXJlYS5pcy1ob3ZlcmVke2JvcmRlci1jb2xvcjojYjViNWI1fS5pbnB1dDpmb2N1cywuaW5wdXQuaXMtZm9jdXNlZCwuaW5wdXQ6YWN0aXZlLC5pbnB1dC5pcy1hY3RpdmUsLnRleHRhcmVhOmZvY3VzLC50ZXh0YXJlYS5pcy1mb2N1c2VkLC50ZXh0YXJlYTphY3RpdmUsLnRleHRhcmVhLmlzLWFjdGl2ZXtib3JkZXItY29sb3I6IzE4MmI3M30uaW5wdXRbZGlzYWJsZWRdLC5pbnB1dC5pcy1kaXNhYmxlZCwudGV4dGFyZWFbZGlzYWJsZWRdLC50ZXh0YXJlYS5pcy1kaXNhYmxlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Ym94LXNoYWRvdzpub25lO2NvbG9yOiM3YTdhN2F9LmlucHV0W2Rpc2FibGVkXTo6LW1vei1wbGFjZWhvbGRlciwuaW5wdXQuaXMtZGlzYWJsZWQ6Oi1tb3otcGxhY2Vob2xkZXIsLnRleHRhcmVhW2Rpc2FibGVkXTo6LW1vei1wbGFjZWhvbGRlciwudGV4dGFyZWEuaXMtZGlzYWJsZWQ6Oi1tb3otcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5pbnB1dFtkaXNhYmxlZF06Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIsLmlucHV0LmlzLWRpc2FibGVkOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyLC50ZXh0YXJlYVtkaXNhYmxlZF06Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIsLnRleHRhcmVhLmlzLWRpc2FibGVkOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uaW5wdXRbZGlzYWJsZWRdOi1tb3otcGxhY2Vob2xkZXIsLmlucHV0LmlzLWRpc2FibGVkOi1tb3otcGxhY2Vob2xkZXIsLnRleHRhcmVhW2Rpc2FibGVkXTotbW96LXBsYWNlaG9sZGVyLC50ZXh0YXJlYS5pcy1kaXNhYmxlZDotbW96LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uaW5wdXRbZGlzYWJsZWRdOi1tcy1pbnB1dC1wbGFjZWhvbGRlciwuaW5wdXQuaXMtZGlzYWJsZWQ6LW1zLWlucHV0LXBsYWNlaG9sZGVyLC50ZXh0YXJlYVtkaXNhYmxlZF06LW1zLWlucHV0LXBsYWNlaG9sZGVyLC50ZXh0YXJlYS5pcy1kaXNhYmxlZDotbXMtaW5wdXQtcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5pbnB1dFt0eXBlPVxcXCJzZWFyY2hcXFwiXSwudGV4dGFyZWFbdHlwZT1cXFwic2VhcmNoXFxcIl17Ym9yZGVyLXJhZGl1czoyOTA0ODZweH0uaW5wdXQuaXMtd2hpdGUsLnRleHRhcmVhLmlzLXdoaXRle2JvcmRlci1jb2xvcjojZmZmfS5pbnB1dC5pcy1ibGFjaywudGV4dGFyZWEuaXMtYmxhY2t7Ym9yZGVyLWNvbG9yOiMwYTBhMGF9LmlucHV0LmlzLWxpZ2h0LC50ZXh0YXJlYS5pcy1saWdodHtib3JkZXItY29sb3I6I2Y1ZjVmNX0uaW5wdXQuaXMtZGFyaywudGV4dGFyZWEuaXMtZGFya3tib3JkZXItY29sb3I6IzM2MzYzNn0uaW5wdXQuaXMtcHJpbWFyeSwudGV4dGFyZWEuaXMtcHJpbWFyeXtib3JkZXItY29sb3I6IzE4MmI3M30uaW5wdXQuaXMtaW5mbywudGV4dGFyZWEuaXMtaW5mb3tib3JkZXItY29sb3I6IzMyNzNkY30uaW5wdXQuaXMtc3VjY2VzcywudGV4dGFyZWEuaXMtc3VjY2Vzc3tib3JkZXItY29sb3I6IzIzZDE2MH0uaW5wdXQuaXMtd2FybmluZywudGV4dGFyZWEuaXMtd2FybmluZ3tib3JkZXItY29sb3I6I2ZmZGQ1N30uaW5wdXQuaXMtZGFuZ2VyLC50ZXh0YXJlYS5pcy1kYW5nZXJ7Ym9yZGVyLWNvbG9yOnJlZH0uaW5wdXQuaXMtc21hbGwsLnRleHRhcmVhLmlzLXNtYWxse2JvcmRlci1yYWRpdXM6MnB4O2ZvbnQtc2l6ZTouNzVyZW19LmlucHV0LmlzLW1lZGl1bSwudGV4dGFyZWEuaXMtbWVkaXVte2ZvbnQtc2l6ZToxLjI1cmVtfS5pbnB1dC5pcy1sYXJnZSwudGV4dGFyZWEuaXMtbGFyZ2V7Zm9udC1zaXplOjEuNXJlbX0uaW5wdXQuaXMtZnVsbHdpZHRoLC50ZXh0YXJlYS5pcy1mdWxsd2lkdGh7ZGlzcGxheTpibG9jazt3aWR0aDoxMDAlfS5pbnB1dC5pcy1pbmxpbmUsLnRleHRhcmVhLmlzLWlubGluZXtkaXNwbGF5OmlubGluZTt3aWR0aDphdXRvfS50ZXh0YXJlYXtkaXNwbGF5OmJsb2NrO2xpbmUtaGVpZ2h0OjEuMjU7bWF4LWhlaWdodDo2MDBweDttYXgtd2lkdGg6MTAwJTttaW4taGVpZ2h0OjEyMHB4O21pbi13aWR0aDoxMDAlO3BhZGRpbmc6MTBweDtyZXNpemU6dmVydGljYWx9LmNoZWNrYm94LC5yYWRpb3thbGlnbi1pdGVtczpjZW50ZXI7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTppbmxpbmUtZmxleDtmbGV4LXdyYXA6d3JhcDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3B9LmNoZWNrYm94IGlucHV0LC5yYWRpbyBpbnB1dHtjdXJzb3I6cG9pbnRlcjttYXJnaW4tcmlnaHQ6MC41ZW19LmNoZWNrYm94OmhvdmVyLC5yYWRpbzpob3Zlcntjb2xvcjojMzYzNjM2fS5jaGVja2JveC5pcy1kaXNhYmxlZCwucmFkaW8uaXMtZGlzYWJsZWR7Y29sb3I6IzdhN2E3YTtwb2ludGVyLWV2ZW50czpub25lfS5jaGVja2JveC5pcy1kaXNhYmxlZCBpbnB1dCwucmFkaW8uaXMtZGlzYWJsZWQgaW5wdXR7cG9pbnRlci1ldmVudHM6bm9uZX0ucmFkaW8rLnJhZGlve21hcmdpbi1sZWZ0OjAuNWVtfS5zZWxlY3R7ZGlzcGxheTppbmxpbmUtYmxvY2s7aGVpZ2h0OjIuNWVtO3Bvc2l0aW9uOnJlbGF0aXZlO3ZlcnRpY2FsLWFsaWduOnRvcH0uc2VsZWN0OmFmdGVye2JvcmRlcjoxcHggc29saWQgIzE4MmI3Mztib3JkZXItcmlnaHQ6MDtib3JkZXItdG9wOjA7Y29udGVudDpcXFwiIFxcXCI7ZGlzcGxheTpibG9jaztoZWlnaHQ6MC41ZW07cG9pbnRlci1ldmVudHM6bm9uZTtwb3NpdGlvbjphYnNvbHV0ZTt0cmFuc2Zvcm06cm90YXRlKC00NWRlZyk7d2lkdGg6MC41ZW07bWFyZ2luLXRvcDotMC4zNzVlbTtyaWdodDoxLjEyNWVtO3RvcDo1MCU7ei1pbmRleDo0fS5zZWxlY3Qgc2VsZWN0ey1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjNweDtib3gtc2hhZG93Om5vbmU7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MXJlbTtoZWlnaHQ6Mi4yODVlbTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3A7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtjb2xvcjojMzYzNjM2O2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6YmxvY2s7Zm9udC1zaXplOjFlbTtvdXRsaW5lOm5vbmU7cGFkZGluZy1yaWdodDoyLjVlbX0uc2VsZWN0IHNlbGVjdDpmb2N1cywuc2VsZWN0IHNlbGVjdC5pcy1mb2N1c2VkLC5zZWxlY3Qgc2VsZWN0OmFjdGl2ZSwuc2VsZWN0IHNlbGVjdC5pcy1hY3RpdmV7b3V0bGluZTpub25lfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXSwuc2VsZWN0IHNlbGVjdC5pcy1kaXNhYmxlZHtwb2ludGVyLWV2ZW50czpub25lfS5zZWxlY3Qgc2VsZWN0OmhvdmVyLC5zZWxlY3Qgc2VsZWN0LmlzLWhvdmVyZWR7Ym9yZGVyLWNvbG9yOiNiNWI1YjV9LnNlbGVjdCBzZWxlY3Q6Zm9jdXMsLnNlbGVjdCBzZWxlY3QuaXMtZm9jdXNlZCwuc2VsZWN0IHNlbGVjdDphY3RpdmUsLnNlbGVjdCBzZWxlY3QuaXMtYWN0aXZle2JvcmRlci1jb2xvcjojMTgyYjczfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXSwuc2VsZWN0IHNlbGVjdC5pcy1kaXNhYmxlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Ym94LXNoYWRvdzpub25lO2NvbG9yOiM3YTdhN2F9LnNlbGVjdCBzZWxlY3RbZGlzYWJsZWRdOjotbW96LXBsYWNlaG9sZGVyLC5zZWxlY3Qgc2VsZWN0LmlzLWRpc2FibGVkOjotbW96LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF06Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIsLnNlbGVjdCBzZWxlY3QuaXMtZGlzYWJsZWQ6Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXTotbW96LXBsYWNlaG9sZGVyLC5zZWxlY3Qgc2VsZWN0LmlzLWRpc2FibGVkOi1tb3otcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXTotbXMtaW5wdXQtcGxhY2Vob2xkZXIsLnNlbGVjdCBzZWxlY3QuaXMtZGlzYWJsZWQ6LW1zLWlucHV0LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uc2VsZWN0IHNlbGVjdDpob3Zlcntib3JkZXItY29sb3I6I2I1YjViNX0uc2VsZWN0IHNlbGVjdDo6bXMtZXhwYW5ke2Rpc3BsYXk6bm9uZX0uc2VsZWN0OmhvdmVyOmFmdGVye2JvcmRlci1jb2xvcjojMzYzNjM2fS5zZWxlY3QuaXMtc21hbGx7Ym9yZGVyLXJhZGl1czoycHg7Zm9udC1zaXplOi43NXJlbX0uc2VsZWN0LmlzLW1lZGl1bXtmb250LXNpemU6MS4yNXJlbX0uc2VsZWN0LmlzLWxhcmdle2ZvbnQtc2l6ZToxLjVyZW19LnNlbGVjdC5pcy1mdWxsd2lkdGh7d2lkdGg6MTAwJX0uc2VsZWN0LmlzLWZ1bGx3aWR0aCBzZWxlY3R7d2lkdGg6MTAwJX0ubGFiZWx7Y29sb3I6IzM2MzYzNjtkaXNwbGF5OmJsb2NrO2ZvbnQtd2VpZ2h0OmJvbGR9LmxhYmVsOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjVlbX0uaGVscHtkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZTouNzVyZW07bWFyZ2luLXRvcDo1cHh9LmhlbHAuaXMtd2hpdGV7Y29sb3I6I2ZmZn0uaGVscC5pcy1ibGFja3tjb2xvcjojMGEwYTBhfS5oZWxwLmlzLWxpZ2h0e2NvbG9yOiNmNWY1ZjV9LmhlbHAuaXMtZGFya3tjb2xvcjojMzYzNjM2fS5oZWxwLmlzLXByaW1hcnl7Y29sb3I6IzE4MmI3M30uaGVscC5pcy1pbmZve2NvbG9yOiMzMjczZGN9LmhlbHAuaXMtc3VjY2Vzc3tjb2xvcjojMjNkMTYwfS5oZWxwLmlzLXdhcm5pbmd7Y29sb3I6I2ZmZGQ1N30uaGVscC5pcy1kYW5nZXJ7Y29sb3I6cmVkfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuY29udHJvbC1sYWJlbHttYXJnaW4tYm90dG9tOjAuNWVtfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmNvbnRyb2wtbGFiZWx7ZmxleC1iYXNpczowO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjA7bWFyZ2luLXJpZ2h0OjEuNWVtO3BhZGRpbmctdG9wOjAuNWVtO3RleHQtYWxpZ246cmlnaHR9fS5jb250cm9se3Bvc2l0aW9uOnJlbGF0aXZlO3RleHQtYWxpZ246bGVmdH0uY29udHJvbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX0uY29udHJvbC5oYXMtYWRkb25ze2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydH0uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b24sLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0e2JvcmRlci1yYWRpdXM6MDttYXJnaW4tcmlnaHQ6LTFweDt3aWR0aDphdXRvfS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpob3ZlciwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDpob3ZlciwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6aG92ZXJ7ei1pbmRleDoyfS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpmb2N1cywuY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246YWN0aXZlLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0OmZvY3VzLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0OmFjdGl2ZSwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6Zm9jdXMsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0OmFjdGl2ZXt6LWluZGV4OjN9LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uOmZpcnN0LWNoaWxkLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0OmZpcnN0LWNoaWxkLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpmaXJzdC1jaGlsZHtib3JkZXItcmFkaXVzOjNweCAwIDAgM3B4fS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpmaXJzdC1jaGlsZCBzZWxlY3QsLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQ6Zmlyc3QtY2hpbGQgc2VsZWN0LC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpmaXJzdC1jaGlsZCBzZWxlY3R7Ym9yZGVyLXJhZGl1czozcHggMCAwIDNweH0uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246bGFzdC1jaGlsZCwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDpsYXN0LWNoaWxkLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpsYXN0LWNoaWxke2JvcmRlci1yYWRpdXM6MCAzcHggM3B4IDB9LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uOmxhc3QtY2hpbGQgc2VsZWN0LC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0Omxhc3QtY2hpbGQgc2VsZWN0LC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpsYXN0LWNoaWxkIHNlbGVjdHtib3JkZXItcmFkaXVzOjAgM3B4IDNweCAwfS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbi5pcy1leHBhbmRlZCwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dC5pcy1leHBhbmRlZCwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3QuaXMtZXhwYW5kZWR7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0uY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Qgc2VsZWN0OmhvdmVye3otaW5kZXg6Mn0uY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Qgc2VsZWN0OmZvY3VzLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdCBzZWxlY3Q6YWN0aXZle3otaW5kZXg6M30uY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtY2VudGVyZWR7anVzdGlmeS1jb250ZW50OmNlbnRlcn0uY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtcmlnaHR7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfS5jb250cm9sLmhhcy1hZGRvbnMuaGFzLWFkZG9ucy1mdWxsd2lkdGggLmJ1dHRvbiwuY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtZnVsbHdpZHRoIC5pbnB1dCwuY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtZnVsbHdpZHRoIC5zZWxlY3R7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0uY29udHJvbC5oYXMtaWNvbiAuaWNvbntjb2xvcjojZGJkYmRiO3BvaW50ZXItZXZlbnRzOm5vbmU7cG9zaXRpb246YWJzb2x1dGU7dG9wOjEuMjVyZW07ei1pbmRleDo0fS5jb250cm9sLmhhcy1pY29uIC5pbnB1dDpmb2N1cysuaWNvbntjb2xvcjojN2E3YTdhfS5jb250cm9sLmhhcy1pY29uIC5pbnB1dC5pcy1zbWFsbCsuaWNvbnt0b3A6LjkzNzVyZW19LmNvbnRyb2wuaGFzLWljb24gLmlucHV0LmlzLW1lZGl1bSsuaWNvbnt0b3A6MS41NjI1cmVtfS5jb250cm9sLmhhcy1pY29uIC5pbnB1dC5pcy1sYXJnZSsuaWNvbnt0b3A6MS44NzVyZW19LmNvbnRyb2wuaGFzLWljb246bm90KC5oYXMtaWNvbi1yaWdodCkgLmljb257bGVmdDoxLjI1cmVtO3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSl9LmNvbnRyb2wuaGFzLWljb246bm90KC5oYXMtaWNvbi1yaWdodCkgLmlucHV0e3BhZGRpbmctbGVmdDoyLjVlbX0uY29udHJvbC5oYXMtaWNvbjpub3QoLmhhcy1pY29uLXJpZ2h0KSAuaW5wdXQuaXMtc21hbGwrLmljb257bGVmdDouOTM3NXJlbX0uY29udHJvbC5oYXMtaWNvbjpub3QoLmhhcy1pY29uLXJpZ2h0KSAuaW5wdXQuaXMtbWVkaXVtKy5pY29ue2xlZnQ6MS41NjI1cmVtfS5jb250cm9sLmhhcy1pY29uOm5vdCguaGFzLWljb24tcmlnaHQpIC5pbnB1dC5pcy1sYXJnZSsuaWNvbntsZWZ0OjEuODc1cmVtfS5jb250cm9sLmhhcy1pY29uLmhhcy1pY29uLXJpZ2h0IC5pY29ue3JpZ2h0OjEuMjVyZW07dHJhbnNmb3JtOnRyYW5zbGF0ZVgoNTAlKSB0cmFuc2xhdGVZKC01MCUpfS5jb250cm9sLmhhcy1pY29uLmhhcy1pY29uLXJpZ2h0IC5pbnB1dHtwYWRkaW5nLXJpZ2h0OjIuNWVtfS5jb250cm9sLmhhcy1pY29uLmhhcy1pY29uLXJpZ2h0IC5pbnB1dC5pcy1zbWFsbCsuaWNvbntyaWdodDouOTM3NXJlbX0uY29udHJvbC5oYXMtaWNvbi5oYXMtaWNvbi1yaWdodCAuaW5wdXQuaXMtbWVkaXVtKy5pY29ue3JpZ2h0OjEuNTYyNXJlbX0uY29udHJvbC5oYXMtaWNvbi5oYXMtaWNvbi1yaWdodCAuaW5wdXQuaXMtbGFyZ2UrLmljb257cmlnaHQ6MS44NzVyZW19LmNvbnRyb2wuaXMtZ3JvdXBlZHtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9LmNvbnRyb2wuaXMtZ3JvdXBlZD4uY29udHJvbHtmbGV4LWJhc2lzOjA7ZmxleC1zaHJpbms6MH0uY29udHJvbC5pcy1ncm91cGVkPi5jb250cm9sOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowO21hcmdpbi1yaWdodDowLjc1cmVtfS5jb250cm9sLmlzLWdyb3VwZWQ+LmNvbnRyb2wuaXMtZXhwYW5kZWR7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MX0uY29udHJvbC5pcy1ncm91cGVkLmlzLWdyb3VwZWQtY2VudGVyZWR7anVzdGlmeS1jb250ZW50OmNlbnRlcn0uY29udHJvbC5pcy1ncm91cGVkLmlzLWdyb3VwZWQtcmlnaHR7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuY29udHJvbC5pcy1ob3Jpem9udGFse2Rpc3BsYXk6ZmxleH0uY29udHJvbC5pcy1ob3Jpem9udGFsPi5jb250cm9se2Rpc3BsYXk6ZmxleDtmbGV4LWJhc2lzOjA7ZmxleC1ncm93OjU7ZmxleC1zaHJpbms6MX19LmNvbnRyb2wuaXMtbG9hZGluZzphZnRlcnthbmltYXRpb246c3BpbkFyb3VuZCA1MDBtcyBpbmZpbml0ZSBsaW5lYXI7Ym9yZGVyOjJweCBzb2xpZCAjZGJkYmRiO2JvcmRlci1yYWRpdXM6MjkwNDg2cHg7Ym9yZGVyLXJpZ2h0LWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci10b3AtY29sb3I6dHJhbnNwYXJlbnQ7Y29udGVudDpcXFwiXFxcIjtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcmVtO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjFyZW07cG9zaXRpb246YWJzb2x1dGUgIWltcG9ydGFudDtyaWdodDowLjc1ZW07dG9wOjAuNzVlbX0uaWNvbntkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MjFweDtoZWlnaHQ6MS41cmVtO2xpbmUtaGVpZ2h0OjEuNXJlbTt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6MS41cmVtfS5pY29uIC5mYXtmb250LXNpemU6aW5oZXJpdDtsaW5lLWhlaWdodDppbmhlcml0fS5pY29uLmlzLXNtYWxse2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZToxNHB4O2hlaWdodDoxcmVtO2xpbmUtaGVpZ2h0OjFyZW07dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjFyZW19Lmljb24uaXMtbWVkaXVte2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZToyOHB4O2hlaWdodDoycmVtO2xpbmUtaGVpZ2h0OjJyZW07dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjJyZW19Lmljb24uaXMtbGFyZ2V7ZGlzcGxheTppbmxpbmUtYmxvY2s7Zm9udC1zaXplOjQycHg7aGVpZ2h0OjNyZW07bGluZS1oZWlnaHQ6M3JlbTt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6M3JlbX0uaW1hZ2V7ZGlzcGxheTpibG9jaztwb3NpdGlvbjpyZWxhdGl2ZX0uaW1hZ2UgaW1ne2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OmF1dG87d2lkdGg6MTAwJX0uaW1hZ2UuaXMtc3F1YXJlIGltZywuaW1hZ2UuaXMtMWJ5MSBpbWcsLmltYWdlLmlzLTRieTMgaW1nLC5pbWFnZS5pcy0zYnkyIGltZywuaW1hZ2UuaXMtMTZieTkgaW1nLC5pbWFnZS5pcy0yYnkxIGltZ3tib3R0b206MDtsZWZ0OjA7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDt0b3A6MDtoZWlnaHQ6MTAwJTt3aWR0aDoxMDAlfS5pbWFnZS5pcy1zcXVhcmUsLmltYWdlLmlzLTFieTF7cGFkZGluZy10b3A6MTAwJX0uaW1hZ2UuaXMtNGJ5M3twYWRkaW5nLXRvcDo3NSV9LmltYWdlLmlzLTNieTJ7cGFkZGluZy10b3A6NjYuNjY2NiV9LmltYWdlLmlzLTE2Ynk5e3BhZGRpbmctdG9wOjU2LjI1JX0uaW1hZ2UuaXMtMmJ5MXtwYWRkaW5nLXRvcDo1MCV9LmltYWdlLmlzLTE2eDE2e2hlaWdodDoxNnB4O3dpZHRoOjE2cHh9LmltYWdlLmlzLTI0eDI0e2hlaWdodDoyNHB4O3dpZHRoOjI0cHh9LmltYWdlLmlzLTMyeDMye2hlaWdodDozMnB4O3dpZHRoOjMycHh9LmltYWdlLmlzLTQ4eDQ4e2hlaWdodDo0OHB4O3dpZHRoOjQ4cHh9LmltYWdlLmlzLTY0eDY0e2hlaWdodDo2NHB4O3dpZHRoOjY0cHh9LmltYWdlLmlzLTk2eDk2e2hlaWdodDo5NnB4O3dpZHRoOjk2cHh9LmltYWdlLmlzLTEyOHgxMjh7aGVpZ2h0OjEyOHB4O3dpZHRoOjEyOHB4fS5ub3RpZmljYXRpb257YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1yYWRpdXM6M3B4O3BhZGRpbmc6MS4yNXJlbSAyLjVyZW0gMS4yNXJlbSAxLjVyZW07cG9zaXRpb246cmVsYXRpdmV9Lm5vdGlmaWNhdGlvbjpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5ub3RpZmljYXRpb24gY29kZSwubm90aWZpY2F0aW9uIHByZXtiYWNrZ3JvdW5kOiNmZmZ9Lm5vdGlmaWNhdGlvbiBwcmUgY29kZXtiYWNrZ3JvdW5kOnRyYW5zcGFyZW50fS5ub3RpZmljYXRpb24gLmRlbGV0ZXtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowLjVlbTt0b3A6MC41ZW19Lm5vdGlmaWNhdGlvbiAudGl0bGUsLm5vdGlmaWNhdGlvbiAuc3VidGl0bGUsLm5vdGlmaWNhdGlvbiAuY29udGVudHtjb2xvcjppbmhlcml0fS5ub3RpZmljYXRpb24uaXMtd2hpdGV7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9Lm5vdGlmaWNhdGlvbi5pcy1ibGFja3tiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0ubm90aWZpY2F0aW9uLmlzLWxpZ2h0e2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5ub3RpZmljYXRpb24uaXMtZGFya3tiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0ubm90aWZpY2F0aW9uLmlzLXByaW1hcnl7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9Lm5vdGlmaWNhdGlvbi5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztjb2xvcjojZmZmfS5ub3RpZmljYXRpb24uaXMtc3VjY2Vzc3tiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Y29sb3I6I2ZmZn0ubm90aWZpY2F0aW9uLmlzLXdhcm5pbmd7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0ubm90aWZpY2F0aW9uLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtjb2xvcjojZmZmfS5wcm9ncmVzc3stbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjFyZW07b3ZlcmZsb3c6aGlkZGVuO3BhZGRpbmc6MDt3aWR0aDoxMDAlfS5wcm9ncmVzczpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5wcm9ncmVzczo6LXdlYmtpdC1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojZGJkYmRifS5wcm9ncmVzczo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiM0YTRhNGF9LnByb2dyZXNzOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiM0YTRhNGF9LnByb2dyZXNzLmlzLXdoaXRlOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6I2ZmZn0ucHJvZ3Jlc3MuaXMtd2hpdGU6Oi1tb3otcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6I2ZmZn0ucHJvZ3Jlc3MuaXMtYmxhY2s6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhfS5wcm9ncmVzcy5pcy1ibGFjazo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhfS5wcm9ncmVzcy5pcy1saWdodDo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9LnByb2dyZXNzLmlzLWxpZ2h0OjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9LnByb2dyZXNzLmlzLWRhcms6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2fS5wcm9ncmVzcy5pcy1kYXJrOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzZ9LnByb2dyZXNzLmlzLXByaW1hcnk6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczfS5wcm9ncmVzcy5pcy1wcmltYXJ5OjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzN9LnByb2dyZXNzLmlzLWluZm86Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjfS5wcm9ncmVzcy5pcy1pbmZvOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGN9LnByb2dyZXNzLmlzLXN1Y2Nlc3M6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwfS5wcm9ncmVzcy5pcy1zdWNjZXNzOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjB9LnByb2dyZXNzLmlzLXdhcm5pbmc6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3fS5wcm9ncmVzcy5pcy13YXJuaW5nOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTd9LnByb2dyZXNzLmlzLWRhbmdlcjo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOnJlZH0ucHJvZ3Jlc3MuaXMtZGFuZ2VyOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOnJlZH0ucHJvZ3Jlc3MuaXMtc21hbGx7aGVpZ2h0Oi43NXJlbX0ucHJvZ3Jlc3MuaXMtbWVkaXVte2hlaWdodDoxLjI1cmVtfS5wcm9ncmVzcy5pcy1sYXJnZXtoZWlnaHQ6MS41cmVtfS50YWJsZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzM2MzYzNjttYXJnaW4tYm90dG9tOjEuNXJlbTt3aWR0aDoxMDAlfS50YWJsZSB0ZCwudGFibGUgdGh7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci13aWR0aDowIDAgMXB4O3BhZGRpbmc6MC41ZW0gMC43NWVtO3ZlcnRpY2FsLWFsaWduOnRvcH0udGFibGUgdGQuaXMtbmFycm93LC50YWJsZSB0aC5pcy1uYXJyb3d7d2hpdGUtc3BhY2U6bm93cmFwO3dpZHRoOjElfS50YWJsZSB0aHtjb2xvcjojMzYzNjM2O3RleHQtYWxpZ246bGVmdH0udGFibGUgdHI6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmFmYWZhfS50YWJsZSB0aGVhZCB0ZCwudGFibGUgdGhlYWQgdGh7Ym9yZGVyLXdpZHRoOjAgMCAycHg7Y29sb3I6IzdhN2E3YX0udGFibGUgdGZvb3QgdGQsLnRhYmxlIHRmb290IHRoe2JvcmRlci13aWR0aDoycHggMCAwO2NvbG9yOiM3YTdhN2F9LnRhYmxlIHRib2R5IHRyOmxhc3QtY2hpbGQgdGQsLnRhYmxlIHRib2R5IHRyOmxhc3QtY2hpbGQgdGh7Ym9yZGVyLWJvdHRvbS13aWR0aDowfS50YWJsZS5pcy1ib3JkZXJlZCB0ZCwudGFibGUuaXMtYm9yZGVyZWQgdGh7Ym9yZGVyLXdpZHRoOjFweH0udGFibGUuaXMtYm9yZGVyZWQgdHI6bGFzdC1jaGlsZCB0ZCwudGFibGUuaXMtYm9yZGVyZWQgdHI6bGFzdC1jaGlsZCB0aHtib3JkZXItYm90dG9tLXdpZHRoOjFweH0udGFibGUuaXMtbmFycm93IHRkLC50YWJsZS5pcy1uYXJyb3cgdGh7cGFkZGluZzowLjI1ZW0gMC41ZW19LnRhYmxlLmlzLXN0cmlwZWQgdGJvZHkgdHI6bnRoLWNoaWxkKGV2ZW4pe2JhY2tncm91bmQtY29sb3I6I2ZhZmFmYX0udGFibGUuaXMtc3RyaXBlZCB0Ym9keSB0cjpudGgtY2hpbGQoZXZlbik6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS50YWd7YWxpZ24taXRlbXM6Y2VudGVyO2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2NvbG9yOiM0YTRhNGE7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6Ljc1cmVtO2hlaWdodDoyZW07anVzdGlmeS1jb250ZW50OmNlbnRlcjtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuODc1ZW07cGFkZGluZy1yaWdodDowLjg3NWVtO3ZlcnRpY2FsLWFsaWduOnRvcDt3aGl0ZS1zcGFjZTpub3dyYXB9LnRhZyAuZGVsZXRle21hcmdpbi1sZWZ0OjAuMjVlbTttYXJnaW4tcmlnaHQ6LTAuNWVtfS50YWcuaXMtd2hpdGV7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9LnRhZy5pcy1ibGFja3tiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0udGFnLmlzLWxpZ2h0e2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS50YWcuaXMtZGFya3tiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0udGFnLmlzLXByaW1hcnl7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9LnRhZy5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztjb2xvcjojZmZmfS50YWcuaXMtc3VjY2Vzc3tiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Y29sb3I6I2ZmZn0udGFnLmlzLXdhcm5pbmd7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0udGFnLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtjb2xvcjojZmZmfS50YWcuaXMtbWVkaXVte2ZvbnQtc2l6ZToxcmVtfS50YWcuaXMtbGFyZ2V7Zm9udC1zaXplOjEuMjVyZW19LnRpdGxlLC5zdWJ0aXRsZXt3b3JkLWJyZWFrOmJyZWFrLXdvcmR9LnRpdGxlOm5vdCg6bGFzdC1jaGlsZCksLnN1YnRpdGxlOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LnRpdGxlIGVtLC50aXRsZSBzcGFuLC5zdWJ0aXRsZSBlbSwuc3VidGl0bGUgc3Bhbntmb250LXdlaWdodDozMDB9LnRpdGxlIHN0cm9uZywuc3VidGl0bGUgc3Ryb25ne2ZvbnQtd2VpZ2h0OjUwMH0udGl0bGUgLnRhZywuc3VidGl0bGUgLnRhZ3t2ZXJ0aWNhbC1hbGlnbjptaWRkbGV9LnRpdGxle2NvbG9yOiMzNjM2MzY7Zm9udC1zaXplOjJyZW07Zm9udC13ZWlnaHQ6MzAwO2xpbmUtaGVpZ2h0OjEuMTI1fS50aXRsZSBzdHJvbmd7Y29sb3I6aW5oZXJpdH0udGl0bGUrLmhpZ2hsaWdodHttYXJnaW4tdG9wOi0wLjc1cmVtfS50aXRsZSsuc3VidGl0bGV7bWFyZ2luLXRvcDotMS4yNXJlbX0udGl0bGUuaXMtMXtmb250LXNpemU6My41cmVtfS50aXRsZS5pcy0ye2ZvbnQtc2l6ZToyLjc1cmVtfS50aXRsZS5pcy0ze2ZvbnQtc2l6ZToycmVtfS50aXRsZS5pcy00e2ZvbnQtc2l6ZToxLjVyZW19LnRpdGxlLmlzLTV7Zm9udC1zaXplOjEuMjVyZW19LnRpdGxlLmlzLTZ7Zm9udC1zaXplOjE0cHh9LnN1YnRpdGxle2NvbG9yOiM0YTRhNGE7Zm9udC1zaXplOjEuMjVyZW07Zm9udC13ZWlnaHQ6MzAwO2xpbmUtaGVpZ2h0OjEuMjV9LnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojMzYzNjM2fS5zdWJ0aXRsZSsudGl0bGV7bWFyZ2luLXRvcDotMS41cmVtfS5zdWJ0aXRsZS5pcy0xe2ZvbnQtc2l6ZTozLjVyZW19LnN1YnRpdGxlLmlzLTJ7Zm9udC1zaXplOjIuNzVyZW19LnN1YnRpdGxlLmlzLTN7Zm9udC1zaXplOjJyZW19LnN1YnRpdGxlLmlzLTR7Zm9udC1zaXplOjEuNXJlbX0uc3VidGl0bGUuaXMtNXtmb250LXNpemU6MS4yNXJlbX0uc3VidGl0bGUuaXMtNntmb250LXNpemU6MTRweH0uYmxvY2s6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0uY29udGFpbmVye3Bvc2l0aW9uOnJlbGF0aXZlfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmNvbnRhaW5lcnttYXJnaW46MCBhdXRvO21heC13aWR0aDo5NjBweH0uY29udGFpbmVyLmlzLWZsdWlke21hcmdpbjowIDIwcHg7bWF4LXdpZHRoOm5vbmV9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmNvbnRhaW5lcnttYXgtd2lkdGg6MTE1MnB4fX0uZGVsZXRley13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZTstbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4yKTtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZToxcmVtO2hlaWdodDoyMHB4O291dGxpbmU6bm9uZTtwb3NpdGlvbjpyZWxhdGl2ZTt0cmFuc2Zvcm06cm90YXRlKDQ1ZGVnKTt0cmFuc2Zvcm0tb3JpZ2luOmNlbnRlciBjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjIwcHh9LmRlbGV0ZTpiZWZvcmUsLmRlbGV0ZTphZnRlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29udGVudDpcXFwiXFxcIjtkaXNwbGF5OmJsb2NrO2xlZnQ6NTAlO3Bvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKX0uZGVsZXRlOmJlZm9yZXtoZWlnaHQ6MnB4O3dpZHRoOjUwJX0uZGVsZXRlOmFmdGVye2hlaWdodDo1MCU7d2lkdGg6MnB4fS5kZWxldGU6aG92ZXIsLmRlbGV0ZTpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4zKX0uZGVsZXRlOmFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC40KX0uZGVsZXRlLmlzLXNtYWxse2hlaWdodDoxNHB4O3dpZHRoOjE0cHh9LmRlbGV0ZS5pcy1tZWRpdW17aGVpZ2h0OjI2cHg7d2lkdGg6MjZweH0uZGVsZXRlLmlzLWxhcmdle2hlaWdodDozMHB4O3dpZHRoOjMwcHh9LmZhe2ZvbnQtc2l6ZToyMXB4O3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcH0uaGVhZGluZ3tkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZToxMXB4O2xldHRlci1zcGFjaW5nOjFweDttYXJnaW4tYm90dG9tOjVweDt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2V9LmhpZ2hsaWdodHtmb250LXdlaWdodDo0MDA7bWF4LXdpZHRoOjEwMCU7b3ZlcmZsb3c6aGlkZGVuO3BhZGRpbmc6MH0uaGlnaGxpZ2h0Om5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LmhpZ2hsaWdodCBwcmV7b3ZlcmZsb3c6YXV0bzttYXgtd2lkdGg6MTAwJX0ubG9hZGVye2FuaW1hdGlvbjpzcGluQXJvdW5kIDUwMG1zIGluZmluaXRlIGxpbmVhcjtib3JkZXI6MnB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtib3JkZXItcmlnaHQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLXRvcC1jb2xvcjp0cmFuc3BhcmVudDtjb250ZW50OlxcXCJcXFwiO2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjFyZW07cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MXJlbX0ubnVtYmVye2FsaWduLWl0ZW1zOmNlbnRlcjtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtkaXNwbGF5OmlubGluZS1mbGV4O2ZvbnQtc2l6ZToxLjI1cmVtO2hlaWdodDoyZW07anVzdGlmeS1jb250ZW50OmNlbnRlcjttYXJnaW4tcmlnaHQ6MS41cmVtO21pbi13aWR0aDoyLjVlbTtwYWRkaW5nOjAuMjVyZW0gMC41cmVtO3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcH0uY2FyZC1oZWFkZXJ7YWxpZ24taXRlbXM6c3RyZXRjaDtib3gtc2hhZG93OjAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMSk7ZGlzcGxheTpmbGV4fS5jYXJkLWhlYWRlci10aXRsZXthbGlnbi1pdGVtczpjZW50ZXI7Y29sb3I6IzM2MzYzNjtkaXNwbGF5OmZsZXg7ZmxleC1ncm93OjE7Zm9udC13ZWlnaHQ6NzAwO3BhZGRpbmc6MC43NXJlbX0uY2FyZC1oZWFkZXItaWNvbnthbGlnbi1pdGVtczpjZW50ZXI7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZzowLjc1cmVtfS5jYXJkLWltYWdle2Rpc3BsYXk6YmxvY2s7cG9zaXRpb246cmVsYXRpdmV9LmNhcmQtY29udGVudHtwYWRkaW5nOjEuNXJlbX0uY2FyZC1jb250ZW50IC50aXRsZSsuc3VidGl0bGV7bWFyZ2luLXRvcDotMS41cmVtfS5jYXJkLWZvb3Rlcntib3JkZXItdG9wOjFweCBzb2xpZCAjZGJkYmRiO2FsaWduLWl0ZW1zOnN0cmV0Y2g7ZGlzcGxheTpmbGV4fS5jYXJkLWZvb3Rlci1pdGVte2FsaWduLWl0ZW1zOmNlbnRlcjtkaXNwbGF5OmZsZXg7ZmxleC1iYXNpczowO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmNlbnRlcjtwYWRkaW5nOjAuNzVyZW19LmNhcmQtZm9vdGVyLWl0ZW06bm90KDpsYXN0LWNoaWxkKXtib3JkZXItcmlnaHQ6MXB4IHNvbGlkICNkYmRiZGJ9LmNhcmR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JveC1zaGFkb3c6MCAycHggM3B4IHJnYmEoMTAsMTAsMTAsMC4xKSwwIDAgMCAxcHggcmdiYSgxMCwxMCwxMCwwLjEpO2NvbG9yOiM0YTRhNGE7bWF4LXdpZHRoOjEwMCU7cG9zaXRpb246cmVsYXRpdmV9LmNhcmQgLm1lZGlhOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfS5sZXZlbC1pdGVte2FsaWduLWl0ZW1zOmNlbnRlcjtkaXNwbGF5OmZsZXg7ZmxleC1iYXNpczphdXRvO2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmNlbnRlcn0ubGV2ZWwtaXRlbSAudGl0bGUsLmxldmVsLWl0ZW0gLnN1YnRpdGxle21hcmdpbi1ib3R0b206MH1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmxldmVsLWl0ZW06bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNzVyZW19fS5sZXZlbC1sZWZ0LC5sZXZlbC1yaWdodHtmbGV4LWJhc2lzOmF1dG87ZmxleC1ncm93OjA7ZmxleC1zaHJpbms6MH0ubGV2ZWwtbGVmdCAubGV2ZWwtaXRlbTpub3QoOmxhc3QtY2hpbGQpLC5sZXZlbC1yaWdodCAubGV2ZWwtaXRlbTpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1yaWdodDowLjc1cmVtfS5sZXZlbC1sZWZ0IC5sZXZlbC1pdGVtLmlzLWZsZXhpYmxlLC5sZXZlbC1yaWdodCAubGV2ZWwtaXRlbS5pcy1mbGV4aWJsZXtmbGV4LWdyb3c6MX0ubGV2ZWwtbGVmdHthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5sZXZlbC1sZWZ0Ky5sZXZlbC1yaWdodHttYXJnaW4tdG9wOjEuNXJlbX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5sZXZlbC1sZWZ0e2Rpc3BsYXk6ZmxleH19LmxldmVsLXJpZ2h0e2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmR9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5sZXZlbC1yaWdodHtkaXNwbGF5OmZsZXh9fS5sZXZlbHthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW59LmxldmVsOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LmxldmVsIGNvZGV7Ym9yZGVyLXJhZGl1czozcHh9LmxldmVsIGltZ3tkaXNwbGF5OmlubGluZS1ibG9jazt2ZXJ0aWNhbC1hbGlnbjp0b3B9LmxldmVsLmlzLW1vYmlsZXtkaXNwbGF5OmZsZXh9LmxldmVsLmlzLW1vYmlsZT4ubGV2ZWwtaXRlbTpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MH0ubGV2ZWwuaXMtbW9iaWxlPi5sZXZlbC1pdGVtOm5vdCguaXMtbmFycm93KXtmbGV4LWdyb3c6MX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmxldmVse2Rpc3BsYXk6ZmxleH0ubGV2ZWw+LmxldmVsLWl0ZW06bm90KC5pcy1uYXJyb3cpe2ZsZXgtZ3JvdzoxfX0ubWVkaWEtbGVmdCwubWVkaWEtcmlnaHR7ZmxleC1iYXNpczphdXRvO2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjB9Lm1lZGlhLWxlZnR7bWFyZ2luLXJpZ2h0OjFyZW19Lm1lZGlhLXJpZ2h0e21hcmdpbi1sZWZ0OjFyZW19Lm1lZGlhLWNvbnRlbnR7ZmxleC1iYXNpczphdXRvO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7dGV4dC1hbGlnbjpsZWZ0fS5tZWRpYXthbGlnbi1pdGVtczpmbGV4LXN0YXJ0O2Rpc3BsYXk6ZmxleDt0ZXh0LWFsaWduOmxlZnR9Lm1lZGlhIC5jb250ZW50Om5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfS5tZWRpYSAubWVkaWF7Ym9yZGVyLXRvcDoxcHggc29saWQgcmdiYSgyMTksMjE5LDIxOSwwLjUpO2Rpc3BsYXk6ZmxleDtwYWRkaW5nLXRvcDowLjc1cmVtfS5tZWRpYSAubWVkaWEgLmNvbnRlbnQ6bm90KDpsYXN0LWNoaWxkKSwubWVkaWEgLm1lZGlhIC5jb250cm9sOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjVyZW19Lm1lZGlhIC5tZWRpYSAubWVkaWF7cGFkZGluZy10b3A6MC41cmVtfS5tZWRpYSAubWVkaWEgLm1lZGlhKy5tZWRpYXttYXJnaW4tdG9wOjAuNXJlbX0ubWVkaWErLm1lZGlhe2JvcmRlci10b3A6MXB4IHNvbGlkIHJnYmEoMjE5LDIxOSwyMTksMC41KTttYXJnaW4tdG9wOjFyZW07cGFkZGluZy10b3A6MXJlbX0ubWVkaWEuaXMtbGFyZ2UrLm1lZGlhe21hcmdpbi10b3A6MS41cmVtO3BhZGRpbmctdG9wOjEuNXJlbX0ubWVudXtmb250LXNpemU6MXJlbX0ubWVudS1saXN0e2xpbmUtaGVpZ2h0OjEuMjV9Lm1lbnUtbGlzdCBhe2JvcmRlci1yYWRpdXM6MnB4O2NvbG9yOiM0YTRhNGE7ZGlzcGxheTpibG9jaztwYWRkaW5nOjAuNWVtIDAuNzVlbX0ubWVudS1saXN0IGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiMxODJiNzN9Lm1lbnUtbGlzdCBhLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0ubWVudS1saXN0IGxpIHVse2JvcmRlci1sZWZ0OjFweCBzb2xpZCAjZGJkYmRiO21hcmdpbjowLjc1ZW07cGFkZGluZy1sZWZ0OjAuNzVlbX0ubWVudS1sYWJlbHtjb2xvcjojN2E3YTdhO2ZvbnQtc2l6ZTowLjhlbTtsZXR0ZXItc3BhY2luZzowLjFlbTt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2V9Lm1lbnUtbGFiZWw6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXRvcDoxZW19Lm1lbnUtbGFiZWw6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjFlbX0ubWVzc2FnZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLXJhZGl1czozcHg7Zm9udC1zaXplOjFyZW19Lm1lc3NhZ2U6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0ubWVzc2FnZS5pcy13aGl0ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lm1lc3NhZ2UuaXMtd2hpdGUgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5tZXNzYWdlLmlzLXdoaXRlIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6IzRkNGQ0ZH0ubWVzc2FnZS5pcy1ibGFja3tiYWNrZ3JvdW5kLWNvbG9yOiNmYWZhZmF9Lm1lc3NhZ2UuaXMtYmxhY2sgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5tZXNzYWdlLmlzLWJsYWNrIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMwYTBhMGE7Y29sb3I6IzA5MDkwOX0ubWVzc2FnZS5pcy1saWdodHtiYWNrZ3JvdW5kLWNvbG9yOiNmYWZhZmF9Lm1lc3NhZ2UuaXMtbGlnaHQgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5tZXNzYWdlLmlzLWxpZ2h0IC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzUwNTA1MH0ubWVzc2FnZS5pcy1kYXJre2JhY2tncm91bmQtY29sb3I6I2ZhZmFmYX0ubWVzc2FnZS5pcy1kYXJrIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0ubWVzc2FnZS5pcy1kYXJrIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMzNjM2MzY7Y29sb3I6IzJhMmEyYX0ubWVzc2FnZS5pcy1wcmltYXJ5e2JhY2tncm91bmQtY29sb3I6I2Y3ZjhmZH0ubWVzc2FnZS5pcy1wcmltYXJ5IC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0ubWVzc2FnZS5pcy1wcmltYXJ5IC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMxODJiNzM7Y29sb3I6IzE2MjY2Mn0ubWVzc2FnZS5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6I2Y2ZjlmZX0ubWVzc2FnZS5pcy1pbmZvIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Y29sb3I6I2ZmZn0ubWVzc2FnZS5pcy1pbmZvIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMzMjczZGM7Y29sb3I6IzIyNTA5YX0ubWVzc2FnZS5pcy1zdWNjZXNze2JhY2tncm91bmQtY29sb3I6I2Y2ZmVmOX0ubWVzc2FnZS5pcy1zdWNjZXNzIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Y29sb3I6I2ZmZn0ubWVzc2FnZS5pcy1zdWNjZXNzIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMyM2QxNjA7Y29sb3I6IzBlMzAxYX0ubWVzc2FnZS5pcy13YXJuaW5ne2JhY2tncm91bmQtY29sb3I6I2ZmZmRmNX0ubWVzc2FnZS5pcy13YXJuaW5nIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTc7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5tZXNzYWdlLmlzLXdhcm5pbmcgLm1lc3NhZ2UtYm9keXtib3JkZXItY29sb3I6I2ZmZGQ1Nztjb2xvcjojM2IzMTA4fS5tZXNzYWdlLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY1ZjV9Lm1lc3NhZ2UuaXMtZGFuZ2VyIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtjb2xvcjojZmZmfS5tZXNzYWdlLmlzLWRhbmdlciAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjpyZWQ7Y29sb3I6I2FkMDYwNn0ubWVzc2FnZS1oZWFkZXJ7YWxpZ24taXRlbXM6Y2VudGVyO2JhY2tncm91bmQtY29sb3I6IzRhNGE0YTtib3JkZXItcmFkaXVzOjNweCAzcHggMCAwO2NvbG9yOiNmZmY7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2xpbmUtaGVpZ2h0OjEuMjU7cGFkZGluZzowLjVlbSAwLjc1ZW07cG9zaXRpb246cmVsYXRpdmV9Lm1lc3NhZ2UtaGVhZGVyIGEsLm1lc3NhZ2UtaGVhZGVyIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5tZXNzYWdlLWhlYWRlciBhe3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmV9Lm1lc3NhZ2UtaGVhZGVyIC5kZWxldGV7ZmxleC1ncm93OjA7ZmxleC1zaHJpbms6MDttYXJnaW4tbGVmdDowLjc1ZW19Lm1lc3NhZ2UtaGVhZGVyKy5tZXNzYWdlLWJvZHl7Ym9yZGVyLXRvcC1sZWZ0LXJhZGl1czowO2JvcmRlci10b3AtcmlnaHQtcmFkaXVzOjA7Ym9yZGVyLXRvcDpub25lfS5tZXNzYWdlLWJvZHl7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci1yYWRpdXM6M3B4O2NvbG9yOiM0YTRhNGE7cGFkZGluZzoxZW0gMS4yNWVtfS5tZXNzYWdlLWJvZHkgYSwubWVzc2FnZS1ib2R5IHN0cm9uZ3tjb2xvcjppbmhlcml0fS5tZXNzYWdlLWJvZHkgYXt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lfS5tZXNzYWdlLWJvZHkgY29kZSwubWVzc2FnZS1ib2R5IHByZXtiYWNrZ3JvdW5kOiNmZmZ9Lm1lc3NhZ2UtYm9keSBwcmUgY29kZXtiYWNrZ3JvdW5kOnRyYW5zcGFyZW50fS5tb2RhbC1iYWNrZ3JvdW5ke2JvdHRvbTowO2xlZnQ6MDtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO3RvcDowO2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjg2KX0ubW9kYWwtY29udGVudCwubW9kYWwtY2FyZHttYXJnaW46MCAyMHB4O21heC1oZWlnaHQ6Y2FsYygxMDB2aCAtIDE2MHB4KTtvdmVyZmxvdzphdXRvO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjEwMCV9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5tb2RhbC1jb250ZW50LC5tb2RhbC1jYXJke21hcmdpbjowIGF1dG87bWF4LWhlaWdodDpjYWxjKDEwMHZoIC0gNDBweCk7d2lkdGg6NjQwcHh9fS5tb2RhbC1jbG9zZXstd2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lOy1tcy11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmU7LW1vei1hcHBlYXJhbmNlOm5vbmU7LXdlYmtpdC1hcHBlYXJhbmNlOm5vbmU7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMik7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MXJlbTtoZWlnaHQ6MjBweDtvdXRsaW5lOm5vbmU7cG9zaXRpb246cmVsYXRpdmU7dHJhbnNmb3JtOnJvdGF0ZSg0NWRlZyk7dHJhbnNmb3JtLW9yaWdpbjpjZW50ZXIgY2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcDt3aWR0aDoyMHB4O2JhY2tncm91bmQ6bm9uZTtoZWlnaHQ6NDBweDtwb3NpdGlvbjpmaXhlZDtyaWdodDoyMHB4O3RvcDoyMHB4O3dpZHRoOjQwcHh9Lm1vZGFsLWNsb3NlOmJlZm9yZSwubW9kYWwtY2xvc2U6YWZ0ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbnRlbnQ6XFxcIlxcXCI7ZGlzcGxheTpibG9jaztsZWZ0OjUwJTtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSl9Lm1vZGFsLWNsb3NlOmJlZm9yZXtoZWlnaHQ6MnB4O3dpZHRoOjUwJX0ubW9kYWwtY2xvc2U6YWZ0ZXJ7aGVpZ2h0OjUwJTt3aWR0aDoycHh9Lm1vZGFsLWNsb3NlOmhvdmVyLC5tb2RhbC1jbG9zZTpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4zKX0ubW9kYWwtY2xvc2U6YWN0aXZle2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjQpfS5tb2RhbC1jbG9zZS5pcy1zbWFsbHtoZWlnaHQ6MTRweDt3aWR0aDoxNHB4fS5tb2RhbC1jbG9zZS5pcy1tZWRpdW17aGVpZ2h0OjI2cHg7d2lkdGg6MjZweH0ubW9kYWwtY2xvc2UuaXMtbGFyZ2V7aGVpZ2h0OjMwcHg7d2lkdGg6MzBweH0ubW9kYWwtY2FyZHtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO21heC1oZWlnaHQ6Y2FsYygxMDB2aCAtIDQwcHgpO292ZXJmbG93OmhpZGRlbn0ubW9kYWwtY2FyZC1oZWFkLC5tb2RhbC1jYXJkLWZvb3R7YWxpZ24taXRlbXM6Y2VudGVyO2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtkaXNwbGF5OmZsZXg7ZmxleC1zaHJpbms6MDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtwYWRkaW5nOjIwcHg7cG9zaXRpb246cmVsYXRpdmV9Lm1vZGFsLWNhcmQtaGVhZHtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci10b3AtbGVmdC1yYWRpdXM6NXB4O2JvcmRlci10b3AtcmlnaHQtcmFkaXVzOjVweH0ubW9kYWwtY2FyZC10aXRsZXtjb2xvcjojMzYzNjM2O2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjA7Zm9udC1zaXplOjEuNXJlbTtsaW5lLWhlaWdodDoxfS5tb2RhbC1jYXJkLWZvb3R7Ym9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1czo1cHg7Ym9yZGVyLWJvdHRvbS1yaWdodC1yYWRpdXM6NXB4O2JvcmRlci10b3A6MXB4IHNvbGlkICNkYmRiZGJ9Lm1vZGFsLWNhcmQtZm9vdCAuYnV0dG9uOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0OjEwcHh9Lm1vZGFsLWNhcmQtYm9keXstd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzp0b3VjaDtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MTtvdmVyZmxvdzphdXRvO3BhZGRpbmc6MjBweH0ubW9kYWx7Ym90dG9tOjA7bGVmdDowO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjA7YWxpZ24taXRlbXM6Y2VudGVyO2Rpc3BsYXk6bm9uZTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO292ZXJmbG93OmhpZGRlbjtwb3NpdGlvbjpmaXhlZDt6LWluZGV4OjE5ODZ9Lm1vZGFsLmlzLWFjdGl2ZXtkaXNwbGF5OmZsZXh9Lm5hdi10b2dnbGV7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpibG9jaztoZWlnaHQ6My41cmVtO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjMuNXJlbX0ubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzRhNGE0YTtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcHg7bGVmdDo1MCU7bWFyZ2luLWxlZnQ6LTdweDtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3RyYW5zaXRpb246bm9uZSA4Nm1zIGVhc2Utb3V0O3RyYW5zaXRpb24tcHJvcGVydHk6YmFja2dyb3VuZCwgbGVmdCwgb3BhY2l0eSwgdHJhbnNmb3JtO3dpZHRoOjE1cHh9Lm5hdi10b2dnbGUgc3BhbjpudGgtY2hpbGQoMSl7bWFyZ2luLXRvcDotNnB4fS5uYXYtdG9nZ2xlIHNwYW46bnRoLWNoaWxkKDIpe21hcmdpbi10b3A6LTFweH0ubmF2LXRvZ2dsZSBzcGFuOm50aC1jaGlsZCgzKXttYXJnaW4tdG9wOjRweH0ubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9Lm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojMTgyYjczfS5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFuOm50aC1jaGlsZCgxKXttYXJnaW4tbGVmdDotNXB4O3RyYW5zZm9ybTpyb3RhdGUoNDVkZWcpO3RyYW5zZm9ybS1vcmlnaW46bGVmdCB0b3B9Lm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW46bnRoLWNoaWxkKDIpe29wYWNpdHk6MH0ubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbjpudGgtY2hpbGQoMyl7bWFyZ2luLWxlZnQ6LTVweDt0cmFuc2Zvcm06cm90YXRlKC00NWRlZyk7dHJhbnNmb3JtLW9yaWdpbjpsZWZ0IGJvdHRvbX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7Lm5hdi10b2dnbGV7ZGlzcGxheTpub25lfX0ubmF2LWl0ZW17YWxpZ24taXRlbXM6Y2VudGVyO2Rpc3BsYXk6ZmxleDtmbGV4LWdyb3c6MDtmbGV4LXNocmluazowO2ZvbnQtc2l6ZToxcmVtO2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZzowLjVyZW0gMC43NXJlbX0ubmF2LWl0ZW0gYXtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowfS5uYXYtaXRlbSBpbWd7bWF4LWhlaWdodDoxLjc1cmVtfS5uYXYtaXRlbSAuYnV0dG9uKy5idXR0b257bWFyZ2luLWxlZnQ6MC43NXJlbX0ubmF2LWl0ZW0gLnRhZzpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1yaWdodDowLjVyZW19Lm5hdi1pdGVtIC50YWc6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tbGVmdDowLjVyZW19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5uYXYtaXRlbXtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydH19Lm5hdi1pdGVtIGEsYS5uYXYtaXRlbXtjb2xvcjojN2E3YTdhfS5uYXYtaXRlbSBhOmhvdmVyLGEubmF2LWl0ZW06aG92ZXJ7Y29sb3I6IzM2MzYzNn0ubmF2LWl0ZW0gYS5pcy1hY3RpdmUsYS5uYXYtaXRlbS5pcy1hY3RpdmV7Y29sb3I6IzM2MzYzNn0ubmF2LWl0ZW0gYS5pcy10YWIsYS5uYXYtaXRlbS5pcy10YWJ7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdHJhbnNwYXJlbnQ7Ym9yZGVyLXRvcDoxcHggc29saWQgdHJhbnNwYXJlbnQ7cGFkZGluZy1ib3R0b206Y2FsYygwLjVyZW0gLSAxcHgpO3BhZGRpbmctbGVmdDoxcmVtO3BhZGRpbmctcmlnaHQ6MXJlbTtwYWRkaW5nLXRvcDpjYWxjKDAuNXJlbSAtIDFweCl9Lm5hdi1pdGVtIGEuaXMtdGFiOmhvdmVyLGEubmF2LWl0ZW0uaXMtdGFiOmhvdmVye2JvcmRlci1ib3R0b20tY29sb3I6IzE4MmI3Mztib3JkZXItdG9wLWNvbG9yOnRyYW5zcGFyZW50fS5uYXYtaXRlbSBhLmlzLXRhYi5pcy1hY3RpdmUsYS5uYXYtaXRlbS5pcy10YWIuaXMtYWN0aXZle2JvcmRlci1ib3R0b206M3B4IHNvbGlkICMxODJiNzM7Y29sb3I6IzE4MmI3MztwYWRkaW5nLWJvdHRvbTpjYWxjKDAuNXJlbSAtIDNweCl9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsubmF2LWl0ZW0gYS5pcy1icmFuZCxhLm5hdi1pdGVtLmlzLWJyYW5ke3BhZGRpbmctbGVmdDowfX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3gtc2hhZG93OjAgNHB4IDdweCByZ2JhKDEwLDEwLDEwLDAuMSk7bGVmdDowO2Rpc3BsYXk6bm9uZTtyaWdodDowO3RvcDoxMDAlO3Bvc2l0aW9uOmFic29sdXRlfS5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcDoxcHggc29saWQgcmdiYSgyMTksMjE5LDIxOSwwLjUpO3BhZGRpbmc6MC43NXJlbX0ubmF2LW1lbnUuaXMtYWN0aXZle2Rpc3BsYXk6YmxvY2t9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5uYXYtbWVudXtwYWRkaW5nLXJpZ2h0OjEuNXJlbX19Lm5hdi1sZWZ0LC5uYXYtcmlnaHR7YWxpZ24taXRlbXM6c3RyZXRjaDtmbGV4LWJhc2lzOjA7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0ubmF2LWxlZnR7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O292ZXJmbG93OmhpZGRlbjtvdmVyZmxvdy14OmF1dG87d2hpdGUtc3BhY2U6bm93cmFwfS5uYXYtY2VudGVye2FsaWduLWl0ZW1zOnN0cmV0Y2g7ZGlzcGxheTpmbGV4O2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmNlbnRlcjttYXJnaW4tbGVmdDphdXRvO21hcmdpbi1yaWdodDphdXRvfS5uYXYtcmlnaHR7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsubmF2LXJpZ2h0e2Rpc3BsYXk6ZmxleH19Lm5hdnthbGlnbi1pdGVtczpzdHJldGNoO2JhY2tncm91bmQtY29sb3I6I2ZmZjtkaXNwbGF5OmZsZXg7bWluLWhlaWdodDozLjVyZW07cG9zaXRpb246cmVsYXRpdmU7dGV4dC1hbGlnbjpjZW50ZXI7ei1pbmRleDoyfS5uYXY+LmNvbnRhaW5lcnthbGlnbi1pdGVtczpzdHJldGNoO2Rpc3BsYXk6ZmxleDttaW4taGVpZ2h0OjMuNXJlbTt3aWR0aDoxMDAlfS5uYXYuaGFzLXNoYWRvd3tib3gtc2hhZG93OjAgMnB4IDNweCByZ2JhKDEwLDEwLDEwLDAuMSl9LnBhZ2luYXRpb24sLnBhZ2luYXRpb24tbGlzdHthbGlnbi1pdGVtczpjZW50ZXI7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXI7dGV4dC1hbGlnbjpjZW50ZXJ9LnBhZ2luYXRpb24tcHJldmlvdXMsLnBhZ2luYXRpb24tbmV4dCwucGFnaW5hdGlvbi1saW5rLC5wYWdpbmF0aW9uLWVsbGlwc2lzey1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjNweDtib3gtc2hhZG93Om5vbmU7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MXJlbTtoZWlnaHQ6Mi4yODVlbTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3A7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lO2ZvbnQtc2l6ZTowLjg3NXJlbTtwYWRkaW5nLWxlZnQ6MC41ZW07cGFkZGluZy1yaWdodDowLjVlbTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3RleHQtYWxpZ246Y2VudGVyfS5wYWdpbmF0aW9uLXByZXZpb3VzOmZvY3VzLC5wYWdpbmF0aW9uLXByZXZpb3VzLmlzLWZvY3VzZWQsLnBhZ2luYXRpb24tcHJldmlvdXM6YWN0aXZlLC5wYWdpbmF0aW9uLXByZXZpb3VzLmlzLWFjdGl2ZSwucGFnaW5hdGlvbi1uZXh0OmZvY3VzLC5wYWdpbmF0aW9uLW5leHQuaXMtZm9jdXNlZCwucGFnaW5hdGlvbi1uZXh0OmFjdGl2ZSwucGFnaW5hdGlvbi1uZXh0LmlzLWFjdGl2ZSwucGFnaW5hdGlvbi1saW5rOmZvY3VzLC5wYWdpbmF0aW9uLWxpbmsuaXMtZm9jdXNlZCwucGFnaW5hdGlvbi1saW5rOmFjdGl2ZSwucGFnaW5hdGlvbi1saW5rLmlzLWFjdGl2ZSwucGFnaW5hdGlvbi1lbGxpcHNpczpmb2N1cywucGFnaW5hdGlvbi1lbGxpcHNpcy5pcy1mb2N1c2VkLC5wYWdpbmF0aW9uLWVsbGlwc2lzOmFjdGl2ZSwucGFnaW5hdGlvbi1lbGxpcHNpcy5pcy1hY3RpdmV7b3V0bGluZTpub25lfS5wYWdpbmF0aW9uLXByZXZpb3VzW2Rpc2FibGVkXSwucGFnaW5hdGlvbi1wcmV2aW91cy5pcy1kaXNhYmxlZCwucGFnaW5hdGlvbi1uZXh0W2Rpc2FibGVkXSwucGFnaW5hdGlvbi1uZXh0LmlzLWRpc2FibGVkLC5wYWdpbmF0aW9uLWxpbmtbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLWxpbmsuaXMtZGlzYWJsZWQsLnBhZ2luYXRpb24tZWxsaXBzaXNbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLWVsbGlwc2lzLmlzLWRpc2FibGVke3BvaW50ZXItZXZlbnRzOm5vbmV9LnBhZ2luYXRpb24tcHJldmlvdXMsLnBhZ2luYXRpb24tbmV4dCwucGFnaW5hdGlvbi1saW5re2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjttaW4td2lkdGg6Mi41ZW19LnBhZ2luYXRpb24tcHJldmlvdXM6aG92ZXIsLnBhZ2luYXRpb24tbmV4dDpob3ZlciwucGFnaW5hdGlvbi1saW5rOmhvdmVye2JvcmRlci1jb2xvcjojYjViNWI1O2NvbG9yOiMzNjM2MzZ9LnBhZ2luYXRpb24tcHJldmlvdXM6Zm9jdXMsLnBhZ2luYXRpb24tbmV4dDpmb2N1cywucGFnaW5hdGlvbi1saW5rOmZvY3Vze2JvcmRlci1jb2xvcjojMTgyYjczfS5wYWdpbmF0aW9uLXByZXZpb3VzOmFjdGl2ZSwucGFnaW5hdGlvbi1uZXh0OmFjdGl2ZSwucGFnaW5hdGlvbi1saW5rOmFjdGl2ZXtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMil9LnBhZ2luYXRpb24tcHJldmlvdXNbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLXByZXZpb3VzLmlzLWRpc2FibGVkLC5wYWdpbmF0aW9uLW5leHRbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLW5leHQuaXMtZGlzYWJsZWQsLnBhZ2luYXRpb24tbGlua1tkaXNhYmxlZF0sLnBhZ2luYXRpb24tbGluay5pcy1kaXNhYmxlZHtiYWNrZ3JvdW5kOiNkYmRiZGI7Y29sb3I6IzdhN2E3YTtvcGFjaXR5OjAuNTtwb2ludGVyLWV2ZW50czpub25lfS5wYWdpbmF0aW9uLXByZXZpb3VzLC5wYWdpbmF0aW9uLW5leHR7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbX0ucGFnaW5hdGlvbi1saW5rLmlzLWN1cnJlbnR7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2JvcmRlci1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9LnBhZ2luYXRpb24tZWxsaXBzaXN7Y29sb3I6I2I1YjViNTtwb2ludGVyLWV2ZW50czpub25lfS5wYWdpbmF0aW9uLWxpc3QgbGk6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6MC4zNzVyZW19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5wYWdpbmF0aW9ue2ZsZXgtd3JhcDp3cmFwfS5wYWdpbmF0aW9uLXByZXZpb3VzLC5wYWdpbmF0aW9uLW5leHR7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MTt3aWR0aDpjYWxjKDUwJSAtIDAuMzc1cmVtKX0ucGFnaW5hdGlvbi1uZXh0e21hcmdpbi1sZWZ0OjAuNzVyZW19LnBhZ2luYXRpb24tbGlzdHttYXJnaW4tdG9wOjAuNzVyZW19LnBhZ2luYXRpb24tbGlzdCBsaXtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LnBhZ2luYXRpb24tbGlzdHtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O29yZGVyOjF9LnBhZ2luYXRpb24tcHJldmlvdXMsLnBhZ2luYXRpb24tbmV4dHttYXJnaW4tbGVmdDowLjc1cmVtfS5wYWdpbmF0aW9uLXByZXZpb3Vze29yZGVyOjJ9LnBhZ2luYXRpb24tbmV4dHtvcmRlcjozfS5wYWdpbmF0aW9ue2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVufS5wYWdpbmF0aW9uLmlzLWNlbnRlcmVkIC5wYWdpbmF0aW9uLXByZXZpb3Vze21hcmdpbi1sZWZ0OjA7b3JkZXI6MX0ucGFnaW5hdGlvbi5pcy1jZW50ZXJlZCAucGFnaW5hdGlvbi1saXN0e2p1c3RpZnktY29udGVudDpjZW50ZXI7b3JkZXI6Mn0ucGFnaW5hdGlvbi5pcy1jZW50ZXJlZCAucGFnaW5hdGlvbi1uZXh0e29yZGVyOjN9LnBhZ2luYXRpb24uaXMtcmlnaHQgLnBhZ2luYXRpb24tcHJldmlvdXN7bWFyZ2luLWxlZnQ6MDtvcmRlcjoxfS5wYWdpbmF0aW9uLmlzLXJpZ2h0IC5wYWdpbmF0aW9uLW5leHR7b3JkZXI6MjttYXJnaW4tcmlnaHQ6MC43NXJlbX0ucGFnaW5hdGlvbi5pcy1yaWdodCAucGFnaW5hdGlvbi1saXN0e2p1c3RpZnktY29udGVudDpmbGV4LWVuZDtvcmRlcjozfX0ucGFuZWx7Zm9udC1zaXplOjFyZW19LnBhbmVsOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LnBhbmVsLWhlYWRpbmcsLnBhbmVsLXRhYnMsLnBhbmVsLWJsb2Nre2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLWxlZnQ6MXB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXJpZ2h0OjFweCBzb2xpZCAjZGJkYmRifS5wYW5lbC1oZWFkaW5nOmZpcnN0LWNoaWxkLC5wYW5lbC10YWJzOmZpcnN0LWNoaWxkLC5wYW5lbC1ibG9jazpmaXJzdC1jaGlsZHtib3JkZXItdG9wOjFweCBzb2xpZCAjZGJkYmRifS5wYW5lbC1oZWFkaW5ne2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItcmFkaXVzOjNweCAzcHggMCAwO2NvbG9yOiMzNjM2MzY7Zm9udC1zaXplOjEuMjVlbTtmb250LXdlaWdodDozMDA7bGluZS1oZWlnaHQ6MS4yNTtwYWRkaW5nOjAuNWVtIDAuNzVlbX0ucGFuZWwtdGFic3thbGlnbi1pdGVtczpmbGV4LWVuZDtkaXNwbGF5OmZsZXg7Zm9udC1zaXplOjAuODc1ZW07anVzdGlmeS1jb250ZW50OmNlbnRlcn0ucGFuZWwtdGFicyBhe2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNkYmRiZGI7bWFyZ2luLWJvdHRvbTotMXB4O3BhZGRpbmc6MC41ZW19LnBhbmVsLXRhYnMgYS5pcy1hY3RpdmV7Ym9yZGVyLWJvdHRvbS1jb2xvcjojNGE0YTRhO2NvbG9yOiMzNjM2MzZ9LnBhbmVsLWxpc3QgYXtjb2xvcjojNGE0YTRhfS5wYW5lbC1saXN0IGE6aG92ZXJ7Y29sb3I6IzE4MmI3M30ucGFuZWwtYmxvY2t7YWxpZ24taXRlbXM6Y2VudGVyO2NvbG9yOiMzNjM2MzY7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O3BhZGRpbmc6MC41ZW0gMC43NWVtfS5wYW5lbC1ibG9jayBpbnB1dFt0eXBlPVxcXCJjaGVja2JveFxcXCJde21hcmdpbi1yaWdodDowLjc1ZW19LnBhbmVsLWJsb2NrPi5jb250cm9se2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7d2lkdGg6MTAwJX0ucGFuZWwtYmxvY2suaXMtYWN0aXZle2JvcmRlci1sZWZ0LWNvbG9yOiMxODJiNzM7Y29sb3I6IzM2MzYzNn0ucGFuZWwtYmxvY2suaXMtYWN0aXZlIC5wYW5lbC1pY29ue2NvbG9yOiMxODJiNzN9YS5wYW5lbC1ibG9jayxsYWJlbC5wYW5lbC1ibG9ja3tjdXJzb3I6cG9pbnRlcn1hLnBhbmVsLWJsb2NrOmhvdmVyLGxhYmVsLnBhbmVsLWJsb2NrOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX0ucGFuZWwtaWNvbntkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MTRweDtoZWlnaHQ6MWVtO2xpbmUtaGVpZ2h0OjFlbTt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6MWVtO2NvbG9yOiM3YTdhN2E7bWFyZ2luLXJpZ2h0OjAuNzVlbX0ucGFuZWwtaWNvbiAuZmF7Zm9udC1zaXplOmluaGVyaXQ7bGluZS1oZWlnaHQ6aW5oZXJpdH0udGFic3std2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lOy1tcy11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmU7YWxpZ24taXRlbXM6c3RyZXRjaDtkaXNwbGF5OmZsZXg7Zm9udC1zaXplOjFyZW07anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47b3ZlcmZsb3c6aGlkZGVuO292ZXJmbG93LXg6YXV0bzt3aGl0ZS1zcGFjZTpub3dyYXB9LnRhYnM6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0udGFicyBhe2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZGJkYmRiO2NvbG9yOiM0YTRhNGE7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXI7bWFyZ2luLWJvdHRvbTotMXB4O3BhZGRpbmc6MC41ZW0gMWVtO3ZlcnRpY2FsLWFsaWduOnRvcH0udGFicyBhOmhvdmVye2JvcmRlci1ib3R0b20tY29sb3I6IzM2MzYzNjtjb2xvcjojMzYzNjM2fS50YWJzIGxpe2Rpc3BsYXk6YmxvY2t9LnRhYnMgbGkuaXMtYWN0aXZlIGF7Ym9yZGVyLWJvdHRvbS1jb2xvcjojMTgyYjczO2NvbG9yOiMxODJiNzN9LnRhYnMgdWx7YWxpZ24taXRlbXM6Y2VudGVyO2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNkYmRiZGI7ZGlzcGxheTpmbGV4O2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9LnRhYnMgdWwuaXMtbGVmdHtwYWRkaW5nLXJpZ2h0OjAuNzVlbX0udGFicyB1bC5pcy1jZW50ZXJ7ZmxleDpub25lO2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbX0udGFicyB1bC5pcy1yaWdodHtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmQ7cGFkZGluZy1sZWZ0OjAuNzVlbX0udGFicyAuaWNvbjpmaXJzdC1jaGlsZHttYXJnaW4tcmlnaHQ6MC41ZW19LnRhYnMgLmljb246bGFzdC1jaGlsZHttYXJnaW4tbGVmdDowLjVlbX0udGFicy5pcy1jZW50ZXJlZCB1bHtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS50YWJzLmlzLXJpZ2h0IHVse2p1c3RpZnktY29udGVudDpmbGV4LWVuZH0udGFicy5pcy1ib3hlZCBhe2JvcmRlcjoxcHggc29saWQgdHJhbnNwYXJlbnQ7Ym9yZGVyLXJhZGl1czozcHggM3B4IDAgMH0udGFicy5pcy1ib3hlZCBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItYm90dG9tLWNvbG9yOiNkYmRiZGJ9LnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGF7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1jb2xvcjojZGJkYmRiO2JvcmRlci1ib3R0b20tY29sb3I6dHJhbnNwYXJlbnQgIWltcG9ydGFudH0udGFicy5pcy1mdWxsd2lkdGggbGl7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0udGFicy5pcy10b2dnbGUgYXtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7bWFyZ2luLWJvdHRvbTowO3Bvc2l0aW9uOnJlbGF0aXZlfS50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItY29sb3I6I2I1YjViNTt6LWluZGV4OjJ9LnRhYnMuaXMtdG9nZ2xlIGxpK2xpe21hcmdpbi1sZWZ0Oi0xcHh9LnRhYnMuaXMtdG9nZ2xlIGxpOmZpcnN0LWNoaWxkIGF7Ym9yZGVyLXJhZGl1czozcHggMCAwIDNweH0udGFicy5pcy10b2dnbGUgbGk6bGFzdC1jaGlsZCBhe2JvcmRlci1yYWRpdXM6MCAzcHggM3B4IDB9LnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhe2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztib3JkZXItY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmO3otaW5kZXg6MX0udGFicy5pcy10b2dnbGUgdWx7Ym9yZGVyLWJvdHRvbTpub25lfS50YWJzLmlzLXNtYWxse2ZvbnQtc2l6ZTouNzVyZW19LnRhYnMuaXMtbWVkaXVte2ZvbnQtc2l6ZToxLjI1cmVtfS50YWJzLmlzLWxhcmdle2ZvbnQtc2l6ZToxLjVyZW19LmNvbHVtbntkaXNwbGF5OmJsb2NrO2ZsZXgtYmFzaXM6MDtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO3BhZGRpbmc6MC43NXJlbX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1uYXJyb3d7ZmxleDpub25lfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLWZ1bGx7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtdGhyZWUtcXVhcnRlcnN7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy10d28tdGhpcmRze2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1oYWxme2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb25lLXRoaXJke2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vbmUtcXVhcnRlcntmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVyc3ttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LXR3by10aGlyZHN7bWFyZ2luLWxlZnQ6NjYuNjY2NiV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LWhhbGZ7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmR7bWFyZ2luLWxlZnQ6MzMuMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LW9uZS1xdWFydGVye21hcmdpbi1sZWZ0OjI1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0xe2ZsZXg6bm9uZTt3aWR0aDo4LjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtMXttYXJnaW4tbGVmdDo4LjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0ye2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTJ7bWFyZ2luLWxlZnQ6MTYuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTN7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtM3ttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtNHtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC00e21hcmdpbi1sZWZ0OjMzLjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy01e2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTV7bWFyZ2luLWxlZnQ6NDEuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTZ7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtNnttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtN3tmbGV4Om5vbmU7d2lkdGg6NTguMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC03e21hcmdpbi1sZWZ0OjU4LjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy04e2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTh7bWFyZ2luLWxlZnQ6NjYuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTl7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtOXttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtMTB7ZmxleDpub25lO3dpZHRoOjgzLjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtMTB7bWFyZ2luLWxlZnQ6ODMuMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTExe2ZsZXg6bm9uZTt3aWR0aDo5MS42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTExe21hcmdpbi1sZWZ0OjkxLjY2NjY3JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0xMntmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtMTJ7bWFyZ2luLWxlZnQ6MTAwJX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmNvbHVtbi5pcy1uYXJyb3ctbW9iaWxle2ZsZXg6bm9uZX0uY29sdW1uLmlzLWZ1bGwtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtdGhyZWUtcXVhcnRlcnMtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy10d28tdGhpcmRzLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbi5pcy1oYWxmLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb25lLXRoaXJkLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMyV9LmNvbHVtbi5pcy1vbmUtcXVhcnRlci1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycy1tb2JpbGV7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LXR3by10aGlyZHMtbW9iaWxle21hcmdpbi1sZWZ0OjY2LjY2NjYlfS5jb2x1bW4uaXMtb2Zmc2V0LWhhbGYtbW9iaWxle21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmQtbW9iaWxle21hcmdpbi1sZWZ0OjMzLjMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LW9uZS1xdWFydGVyLW1vYmlsZXttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy0xLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMS1tb2JpbGV7bWFyZ2luLWxlZnQ6OC4zMzMzMyV9LmNvbHVtbi5pcy0yLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTItbW9iaWxle21hcmdpbi1sZWZ0OjE2LjY2NjY3JX0uY29sdW1uLmlzLTMtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtMy1tb2JpbGV7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtNC1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC00LW1vYmlsZXttYXJnaW4tbGVmdDozMy4zMzMzMyV9LmNvbHVtbi5pcy01LW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTUtbW9iaWxle21hcmdpbi1sZWZ0OjQxLjY2NjY3JX0uY29sdW1uLmlzLTYtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtNi1tb2JpbGV7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtNy1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC03LW1vYmlsZXttYXJnaW4tbGVmdDo1OC4zMzMzMyV9LmNvbHVtbi5pcy04LW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTgtbW9iaWxle21hcmdpbi1sZWZ0OjY2LjY2NjY3JX0uY29sdW1uLmlzLTktbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtOS1tb2JpbGV7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtMTAtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMTAtbW9iaWxle21hcmdpbi1sZWZ0OjgzLjMzMzMzJX0uY29sdW1uLmlzLTExLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6OTEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTExLW1vYmlsZXttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbi5pcy0xMi1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbi5pcy1vZmZzZXQtMTItbW9iaWxle21hcmdpbi1sZWZ0OjEwMCV9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuY29sdW1uLmlzLW5hcnJvdywuY29sdW1uLmlzLW5hcnJvdy10YWJsZXR7ZmxleDpub25lfS5jb2x1bW4uaXMtZnVsbCwuY29sdW1uLmlzLWZ1bGwtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtdGhyZWUtcXVhcnRlcnMsLmNvbHVtbi5pcy10aHJlZS1xdWFydGVycy10YWJsZXR7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLXR3by10aGlyZHMsLmNvbHVtbi5pcy10d28tdGhpcmRzLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbi5pcy1oYWxmLC5jb2x1bW4uaXMtaGFsZi10YWJsZXR7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9uZS10aGlyZCwuY29sdW1uLmlzLW9uZS10aGlyZC10YWJsZXR7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMlfS5jb2x1bW4uaXMtb25lLXF1YXJ0ZXIsLmNvbHVtbi5pcy1vbmUtcXVhcnRlci10YWJsZXR7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycywuY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycy10YWJsZXR7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LXR3by10aGlyZHMsLmNvbHVtbi5pcy1vZmZzZXQtdHdvLXRoaXJkcy10YWJsZXR7bWFyZ2luLWxlZnQ6NjYuNjY2NiV9LmNvbHVtbi5pcy1vZmZzZXQtaGFsZiwuY29sdW1uLmlzLW9mZnNldC1oYWxmLXRhYmxldHttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXRoaXJkLC5jb2x1bW4uaXMtb2Zmc2V0LW9uZS10aGlyZC10YWJsZXR7bWFyZ2luLWxlZnQ6MzMuMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXF1YXJ0ZXIsLmNvbHVtbi5pcy1vZmZzZXQtb25lLXF1YXJ0ZXItdGFibGV0e21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTEsLmNvbHVtbi5pcy0xLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMSwuY29sdW1uLmlzLW9mZnNldC0xLXRhYmxldHttYXJnaW4tbGVmdDo4LjMzMzMzJX0uY29sdW1uLmlzLTIsLmNvbHVtbi5pcy0yLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTIsLmNvbHVtbi5pcy1vZmZzZXQtMi10YWJsZXR7bWFyZ2luLWxlZnQ6MTYuNjY2NjclfS5jb2x1bW4uaXMtMywuY29sdW1uLmlzLTMtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtMywuY29sdW1uLmlzLW9mZnNldC0zLXRhYmxldHttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy00LC5jb2x1bW4uaXMtNC10YWJsZXR7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC00LC5jb2x1bW4uaXMtb2Zmc2V0LTQtdGFibGV0e21hcmdpbi1sZWZ0OjMzLjMzMzMzJX0uY29sdW1uLmlzLTUsLmNvbHVtbi5pcy01LXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTUsLmNvbHVtbi5pcy1vZmZzZXQtNS10YWJsZXR7bWFyZ2luLWxlZnQ6NDEuNjY2NjclfS5jb2x1bW4uaXMtNiwuY29sdW1uLmlzLTYtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtNiwuY29sdW1uLmlzLW9mZnNldC02LXRhYmxldHttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy03LC5jb2x1bW4uaXMtNy10YWJsZXR7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC03LC5jb2x1bW4uaXMtb2Zmc2V0LTctdGFibGV0e21hcmdpbi1sZWZ0OjU4LjMzMzMzJX0uY29sdW1uLmlzLTgsLmNvbHVtbi5pcy04LXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTgsLmNvbHVtbi5pcy1vZmZzZXQtOC10YWJsZXR7bWFyZ2luLWxlZnQ6NjYuNjY2NjclfS5jb2x1bW4uaXMtOSwuY29sdW1uLmlzLTktdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtOSwuY29sdW1uLmlzLW9mZnNldC05LXRhYmxldHttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy0xMCwuY29sdW1uLmlzLTEwLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6ODMuMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEwLC5jb2x1bW4uaXMtb2Zmc2V0LTEwLXRhYmxldHttYXJnaW4tbGVmdDo4My4zMzMzMyV9LmNvbHVtbi5pcy0xMSwuY29sdW1uLmlzLTExLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6OTEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTExLC5jb2x1bW4uaXMtb2Zmc2V0LTExLXRhYmxldHttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbi5pcy0xMiwuY29sdW1uLmlzLTEyLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLW9mZnNldC0xMiwuY29sdW1uLmlzLW9mZnNldC0xMi10YWJsZXR7bWFyZ2luLWxlZnQ6MTAwJX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuY29sdW1uLmlzLW5hcnJvdy1kZXNrdG9we2ZsZXg6bm9uZX0uY29sdW1uLmlzLWZ1bGwtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLXRocmVlLXF1YXJ0ZXJzLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLXR3by10aGlyZHMtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbi5pcy1oYWxmLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9uZS10aGlyZC1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzJX0uY29sdW1uLmlzLW9uZS1xdWFydGVyLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycy1kZXNrdG9we21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLW9mZnNldC10d28tdGhpcmRzLWRlc2t0b3B7bWFyZ2luLWxlZnQ6NjYuNjY2NiV9LmNvbHVtbi5pcy1vZmZzZXQtaGFsZi1kZXNrdG9we21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmQtZGVza3RvcHttYXJnaW4tbGVmdDozMy4zMzMzJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtcXVhcnRlci1kZXNrdG9we21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTEtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMS1kZXNrdG9we21hcmdpbi1sZWZ0OjguMzMzMzMlfS5jb2x1bW4uaXMtMi1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMi1kZXNrdG9we21hcmdpbi1sZWZ0OjE2LjY2NjY3JX0uY29sdW1uLmlzLTMtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LTMtZGVza3RvcHttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy00LWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC00LWRlc2t0b3B7bWFyZ2luLWxlZnQ6MzMuMzMzMzMlfS5jb2x1bW4uaXMtNS1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtNS1kZXNrdG9we21hcmdpbi1sZWZ0OjQxLjY2NjY3JX0uY29sdW1uLmlzLTYtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LTYtZGVza3RvcHttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy03LWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC03LWRlc2t0b3B7bWFyZ2luLWxlZnQ6NTguMzMzMzMlfS5jb2x1bW4uaXMtOC1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtOC1kZXNrdG9we21hcmdpbi1sZWZ0OjY2LjY2NjY3JX0uY29sdW1uLmlzLTktZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LTktZGVza3RvcHttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy0xMC1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMTAtZGVza3RvcHttYXJnaW4tbGVmdDo4My4zMzMzMyV9LmNvbHVtbi5pcy0xMS1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo5MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMTEtZGVza3RvcHttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbi5pcy0xMi1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtb2Zmc2V0LTEyLWRlc2t0b3B7bWFyZ2luLWxlZnQ6MTAwJX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuY29sdW1uLmlzLW5hcnJvdy13aWRlc2NyZWVue2ZsZXg6bm9uZX0uY29sdW1uLmlzLWZ1bGwtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLXRocmVlLXF1YXJ0ZXJzLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLXR3by10aGlyZHMtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbi5pcy1oYWxmLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9uZS10aGlyZC13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzJX0uY29sdW1uLmlzLW9uZS1xdWFydGVyLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycy13aWRlc2NyZWVue21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLW9mZnNldC10d28tdGhpcmRzLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NjYuNjY2NiV9LmNvbHVtbi5pcy1vZmZzZXQtaGFsZi13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmQtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDozMy4zMzMzJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtcXVhcnRlci13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTEtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMS13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjguMzMzMzMlfS5jb2x1bW4uaXMtMi13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMi13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjE2LjY2NjY3JX0uY29sdW1uLmlzLTMtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LTMtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy00LXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC00LXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6MzMuMzMzMzMlfS5jb2x1bW4uaXMtNS13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtNS13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjQxLjY2NjY3JX0uY29sdW1uLmlzLTYtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LTYtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy03LXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC03LXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NTguMzMzMzMlfS5jb2x1bW4uaXMtOC13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtOC13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjY2LjY2NjY3JX0uY29sdW1uLmlzLTktd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LTktd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy0xMC13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMTAtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo4My4zMzMzMyV9LmNvbHVtbi5pcy0xMS13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo5MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMTEtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbi5pcy0xMi13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtb2Zmc2V0LTEyLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6MTAwJX19LmNvbHVtbnN7bWFyZ2luLWxlZnQ6LTAuNzVyZW07bWFyZ2luLXJpZ2h0Oi0wLjc1cmVtO21hcmdpbi10b3A6LTAuNzVyZW19LmNvbHVtbnM6bGFzdC1jaGlsZHttYXJnaW4tYm90dG9tOi0wLjc1cmVtfS5jb2x1bW5zOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfS5jb2x1bW5zLmlzLWNlbnRlcmVke2p1c3RpZnktY29udGVudDpjZW50ZXJ9LmNvbHVtbnMuaXMtZ2FwbGVzc3ttYXJnaW4tbGVmdDowO21hcmdpbi1yaWdodDowO21hcmdpbi10b3A6MH0uY29sdW1ucy5pcy1nYXBsZXNzOmxhc3QtY2hpbGR7bWFyZ2luLWJvdHRvbTowfS5jb2x1bW5zLmlzLWdhcGxlc3M6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0uY29sdW1ucy5pcy1nYXBsZXNzPi5jb2x1bW57bWFyZ2luOjA7cGFkZGluZzowfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuY29sdW1ucy5pcy1ncmlke2ZsZXgtd3JhcDp3cmFwfS5jb2x1bW5zLmlzLWdyaWQ+LmNvbHVtbnttYXgtd2lkdGg6MzMuMzMzMyU7cGFkZGluZzowLjc1cmVtO3dpZHRoOjMzLjMzMzMlfS5jb2x1bW5zLmlzLWdyaWQ+LmNvbHVtbisuY29sdW1ue21hcmdpbi1sZWZ0OjB9fS5jb2x1bW5zLmlzLW1vYmlsZXtkaXNwbGF5OmZsZXh9LmNvbHVtbnMuaXMtbXVsdGlsaW5le2ZsZXgtd3JhcDp3cmFwfS5jb2x1bW5zLmlzLXZjZW50ZXJlZHthbGlnbi1pdGVtczpjZW50ZXJ9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5jb2x1bW5zOm5vdCguaXMtZGVza3RvcCl7ZGlzcGxheTpmbGV4fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5jb2x1bW5zLmlzLWRlc2t0b3B7ZGlzcGxheTpmbGV4fX0udGlsZXthbGlnbi1pdGVtczpzdHJldGNoO2Rpc3BsYXk6YmxvY2s7ZmxleC1iYXNpczowO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7bWluLWhlaWdodDptaW4tY29udGVudH0udGlsZS5pcy1hbmNlc3RvcnttYXJnaW4tbGVmdDotMC43NXJlbTttYXJnaW4tcmlnaHQ6LTAuNzVyZW07bWFyZ2luLXRvcDotMC43NXJlbX0udGlsZS5pcy1hbmNlc3RvcjpsYXN0LWNoaWxke21hcmdpbi1ib3R0b206LTAuNzVyZW19LnRpbGUuaXMtYW5jZXN0b3I6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNzVyZW19LnRpbGUuaXMtY2hpbGR7bWFyZ2luOjAgIWltcG9ydGFudH0udGlsZS5pcy1wYXJlbnR7cGFkZGluZzowLjc1cmVtfS50aWxlLmlzLXZlcnRpY2Fse2ZsZXgtZGlyZWN0aW9uOmNvbHVtbn0udGlsZS5pcy12ZXJ0aWNhbD4udGlsZS5pcy1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtICFpbXBvcnRhbnR9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey50aWxlOm5vdCguaXMtY2hpbGQpe2Rpc3BsYXk6ZmxleH0udGlsZS5pcy0xe2ZsZXg6bm9uZTt3aWR0aDo4LjMzMzMzJX0udGlsZS5pcy0ye2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LnRpbGUuaXMtM3tmbGV4Om5vbmU7d2lkdGg6MjUlfS50aWxlLmlzLTR7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0udGlsZS5pcy01e2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LnRpbGUuaXMtNntmbGV4Om5vbmU7d2lkdGg6NTAlfS50aWxlLmlzLTd7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0udGlsZS5pcy04e2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LnRpbGUuaXMtOXtmbGV4Om5vbmU7d2lkdGg6NzUlfS50aWxlLmlzLTEwe2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LnRpbGUuaXMtMTF7ZmxleDpub25lO3dpZHRoOjkxLjY2NjY3JX0udGlsZS5pcy0xMntmbGV4Om5vbmU7d2lkdGg6MTAwJX19Lmhlcm8tdmlkZW97Ym90dG9tOjA7bGVmdDowO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjA7b3ZlcmZsb3c6aGlkZGVufS5oZXJvLXZpZGVvIHZpZGVve2xlZnQ6NTAlO21pbi1oZWlnaHQ6MTAwJTttaW4td2lkdGg6MTAwJTtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3RyYW5zZm9ybTp0cmFuc2xhdGUzZCgtNTAlLCAtNTAlLCAwKX0uaGVyby12aWRlby5pcy10cmFuc3BhcmVudHtvcGFjaXR5OjAuM31AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8tdmlkZW97ZGlzcGxheTpub25lfX0uaGVyby1idXR0b25ze21hcmdpbi10b3A6MS41cmVtfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby1idXR0b25zIC5idXR0b257ZGlzcGxheTpmbGV4fS5oZXJvLWJ1dHRvbnMgLmJ1dHRvbjpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5oZXJvLWJ1dHRvbnN7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXJ9Lmhlcm8tYnV0dG9ucyAuYnV0dG9uOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0OjEuNXJlbX19Lmhlcm8taGVhZCwuaGVyby1mb290e2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjB9Lmhlcm8tYm9keXtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowO3BhZGRpbmc6M3JlbSAxLjVyZW19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaGVyby1ib2R5e3BhZGRpbmctbGVmdDowO3BhZGRpbmctcmlnaHQ6MH19Lmhlcm97YWxpZ24taXRlbXM6c3RyZXRjaDtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbn0uaGVybyAubmF2e2JhY2tncm91bmQ6bm9uZTtib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyMTksMjE5LDIxOSwwLjMpfS5oZXJvIC50YWJzIHVse2JvcmRlci1ib3R0b206bm9uZX0uaGVyby5pcy13aGl0ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSBhLC5oZXJvLmlzLXdoaXRlIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLXdoaXRlIC50aXRsZXtjb2xvcjojMGEwYTBhfS5oZXJvLmlzLXdoaXRlIC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDEwLDEwLDEwLDAuOSl9Lmhlcm8uaXMtd2hpdGUgLnN1YnRpdGxlIGEsLmhlcm8uaXMtd2hpdGUgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojMGEwYTBhfS5oZXJvLmlzLXdoaXRlIC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMTAsMTAsMTAsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtd2hpdGUgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6I2ZmZn19Lmhlcm8uaXMtd2hpdGUgYS5uYXYtaXRlbSwuaGVyby5pcy13aGl0ZSAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbil7Y29sb3I6cmdiYSgxMCwxMCwxMCwwLjcpfS5oZXJvLmlzLXdoaXRlIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtd2hpdGUgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtd2hpdGUgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pOmhvdmVyLC5oZXJvLmlzLXdoaXRlIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAudGFicyBhe2NvbG9yOiMwYTBhMGE7b3BhY2l0eTowLjl9Lmhlcm8uaXMtd2hpdGUgLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtd2hpdGUgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtd2hpdGUgLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy13aGl0ZSAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2JvcmRlci1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9Lmhlcm8uaXMtd2hpdGUuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICNlNmU2ZTYgMCUsICNmZmYgNzElLCAjZmZmIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy13aGl0ZSAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy13aGl0ZSAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtd2hpdGUgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4yKX19Lmhlcm8uaXMtYmxhY2t7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgYSwuaGVyby5pcy1ibGFjayBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1ibGFjayAudGl0bGV7Y29sb3I6I2ZmZn0uaGVyby5pcy1ibGFjayAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLWJsYWNrIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLWJsYWNrIC5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6I2ZmZn0uaGVyby5pcy1ibGFjayAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWJsYWNrIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGF9fS5oZXJvLmlzLWJsYWNrIGEubmF2LWl0ZW0sLmhlcm8uaXMtYmxhY2sgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC43KX0uaGVyby5pcy1ibGFjayBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLWJsYWNrIGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLWJsYWNrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1ibGFjayAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLnRhYnMgYXtjb2xvcjojZmZmO29wYWNpdHk6MC45fS5oZXJvLmlzLWJsYWNrIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLWJsYWNrIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1ibGFjayAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1ibGFjayAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1ibGFjayAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1ibGFjayAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1ibGFjayAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5oZXJvLmlzLWJsYWNrLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMDAwIDAlLCAjMGEwYTBhIDcxJSwgIzE4MTYxNiAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtYmxhY2sgLm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtYmxhY2sgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWJsYWNrIC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuMil9fS5oZXJvLmlzLWxpZ2h0e2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IGEsLmhlcm8uaXMtbGlnaHQgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtbGlnaHQgLnRpdGxle2NvbG9yOiMzNjM2MzZ9Lmhlcm8uaXMtbGlnaHQgLnN1YnRpdGxle2NvbG9yOnJnYmEoNTQsNTQsNTQsMC45KX0uaGVyby5pcy1saWdodCAuc3VidGl0bGUgYSwuaGVyby5pcy1saWdodCAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiMzNjM2MzZ9Lmhlcm8uaXMtbGlnaHQgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSg1NCw1NCw1NCwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1saWdodCAubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fX0uaGVyby5pcy1saWdodCBhLm5hdi1pdGVtLC5oZXJvLmlzLWxpZ2h0IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuNyl9Lmhlcm8uaXMtbGlnaHQgYS5uYXYtaXRlbTpob3ZlciwuaGVyby5pcy1saWdodCBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1saWdodCAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtbGlnaHQgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pLmlzLWFjdGl2ZXtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC50YWJzIGF7Y29sb3I6IzM2MzYzNjtvcGFjaXR5OjAuOX0uaGVyby5pcy1saWdodCAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1saWdodCAudGFicyBsaS5pcy1hY3RpdmUgYXtvcGFjaXR5OjF9Lmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1saWdodCAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLWJveGVkIGE6aG92ZXIsLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Ym9yZGVyLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1saWdodC5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgI2RmZDhkOCAwJSwgI2Y1ZjVmNSA3MSUsICNmZmYgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWxpZ2h0IC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWxpZ2h0IC5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzM2MzYzNn0uaGVyby5pcy1saWdodCAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSg1NCw1NCw1NCwwLjIpfX0uaGVyby5pcy1kYXJre2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtjb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgYSwuaGVyby5pcy1kYXJrIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLWRhcmsgLnRpdGxle2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNDUsMjQ1LDI0NSwwLjkpfS5oZXJvLmlzLWRhcmsgLnN1YnRpdGxlIGEsLmhlcm8uaXMtZGFyayAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI0NSwyNDUsMjQ1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWRhcmsgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6IzM2MzYzNn19Lmhlcm8uaXMtZGFyayBhLm5hdi1pdGVtLC5oZXJvLmlzLWRhcmsgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjQ1LDI0NSwyNDUsMC43KX0uaGVyby5pcy1kYXJrIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtZGFyayBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1kYXJrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1kYXJrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1kYXJrIC50YWJzIGF7Y29sb3I6I2Y1ZjVmNTtvcGFjaXR5OjAuOX0uaGVyby5pcy1kYXJrIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLWRhcmsgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1kYXJrIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtZGFyayAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1kYXJrIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWRhcmsuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICMxZjE5MTkgMCUsICMzNjM2MzYgNzElLCAjNDYzZjNmIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1kYXJrIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtZGFyayAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNDUsMjQ1LDI0NSwwLjIpfX0uaGVyby5pcy1wcmltYXJ5e2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgYSwuaGVyby5pcy1wcmltYXJ5IHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLXByaW1hcnkgLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLXByaW1hcnkgLnN1YnRpdGxlIGEsLmhlcm8uaXMtcHJpbWFyeSAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXByaW1hcnkgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6IzE4MmI3M319Lmhlcm8uaXMtcHJpbWFyeSBhLm5hdi1pdGVtLC5oZXJvLmlzLXByaW1hcnkgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC43KX0uaGVyby5pcy1wcmltYXJ5IGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtcHJpbWFyeSBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1wcmltYXJ5IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1wcmltYXJ5IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0uaGVyby5pcy1wcmltYXJ5IC50YWJzIGF7Y29sb3I6I2ZmZjtvcGFjaXR5OjAuOX0uaGVyby5pcy1wcmltYXJ5IC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLXByaW1hcnkgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMTgyYjczfS5oZXJvLmlzLXByaW1hcnkuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICMwYjI0NGQgMCUsICMxODJiNzMgNzElLCAjMTgxZDhjIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1wcmltYXJ5IC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtcHJpbWFyeSAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX0uaGVyby5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztjb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gYSwuaGVyby5pcy1pbmZvIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLWluZm8gLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLWluZm8gLnN1YnRpdGxlIGEsLmhlcm8uaXMtaW5mbyAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWluZm8gLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6IzMyNzNkY319Lmhlcm8uaXMtaW5mbyBhLm5hdi1pdGVtLC5oZXJvLmlzLWluZm8gLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC43KX0uaGVyby5pcy1pbmZvIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtaW5mbyBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1pbmZvIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1pbmZvIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0uaGVyby5pcy1pbmZvIC50YWJzIGF7Y29sb3I6I2ZmZjtvcGFjaXR5OjAuOX0uaGVyby5pcy1pbmZvIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLWluZm8gLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLWluZm8gLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1pbmZvIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtaW5mbyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1pbmZvIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMzI3M2RjfS5oZXJvLmlzLWluZm8uaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICMxNTc3YzYgMCUsICMzMjczZGMgNzElLCAjNDM2NmU1IDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1pbmZvIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtaW5mbyAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX0uaGVyby5pcy1zdWNjZXNze2JhY2tncm91bmQtY29sb3I6IzIzZDE2MDtjb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgYSwuaGVyby5pcy1zdWNjZXNzIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLXN1Y2Nlc3MgLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLXN1Y2Nlc3MgLnN1YnRpdGxlIGEsLmhlcm8uaXMtc3VjY2VzcyAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6IzIzZDE2MH19Lmhlcm8uaXMtc3VjY2VzcyBhLm5hdi1pdGVtLC5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC43KX0uaGVyby5pcy1zdWNjZXNzIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtc3VjY2VzcyBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1zdWNjZXNzIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1zdWNjZXNzIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0uaGVyby5pcy1zdWNjZXNzIC50YWJzIGF7Y29sb3I6I2ZmZjtvcGFjaXR5OjAuOX0uaGVyby5pcy1zdWNjZXNzIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMjNkMTYwfS5oZXJvLmlzLXN1Y2Nlc3MuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICMxMmFmMmYgMCUsICMyM2QxNjAgNzElLCAjMmNlMjhhIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1zdWNjZXNzIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtc3VjY2VzcyAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX0uaGVyby5pcy13YXJuaW5ne2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1Nztjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyBhLC5oZXJvLmlzLXdhcm5pbmcgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtd2FybmluZyAudGl0bGV7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLnN1YnRpdGxle2NvbG9yOnJnYmEoMCwwLDAsMC45KX0uaGVyby5pcy13YXJuaW5nIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLXdhcm5pbmcgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDAsMCwwLDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXdhcm5pbmcgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1N319Lmhlcm8uaXMtd2FybmluZyBhLm5hdi1pdGVtLC5oZXJvLmlzLXdhcm5pbmcgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtd2FybmluZyBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy13YXJuaW5nIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy13YXJuaW5nIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLnRhYnMgYXtjb2xvcjpyZ2JhKDAsMCwwLDAuNyk7b3BhY2l0eTowLjl9Lmhlcm8uaXMtd2FybmluZyAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy13YXJuaW5nIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtd2FybmluZyAudGFicy5pcy10b2dnbGUgYXtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtd2FybmluZyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgwLDAsMCwwLjcpO2JvcmRlci1jb2xvcjpyZ2JhKDAsMCwwLDAuNyk7Y29sb3I6I2ZmZGQ1N30uaGVyby5pcy13YXJuaW5nLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjZmZhZjI0IDAlLCAjZmZkZDU3IDcxJSwgI2ZmZmE3MCAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtd2FybmluZyAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtd2FybmluZyAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDAsMCwwLDAuMil9fS5oZXJvLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtjb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciBhLC5oZXJvLmlzLWRhbmdlciBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1kYW5nZXIgLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtZGFuZ2VyIC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuOSl9Lmhlcm8uaXMtZGFuZ2VyIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLWRhbmdlciAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtZGFuZ2VyIC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtZGFuZ2VyIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOnJlZH19Lmhlcm8uaXMtZGFuZ2VyIGEubmF2LWl0ZW0sLmhlcm8uaXMtZGFuZ2VyIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuNyl9Lmhlcm8uaXMtZGFuZ2VyIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtZGFuZ2VyIGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLWRhbmdlciAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtZGFuZ2VyIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0uaGVyby5pcy1kYW5nZXIgLnRhYnMgYXtjb2xvcjojZmZmO29wYWNpdHk6MC45fS5oZXJvLmlzLWRhbmdlciAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1kYW5nZXIgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLWRhbmdlciAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6cmVkfS5oZXJvLmlzLWRhbmdlci5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgI2MwMiAwJSwgcmVkIDcxJSwgI2ZmNDAxYSAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtZGFuZ2VyIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1kYW5nZXIgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7Lmhlcm8uaXMtbWVkaXVtIC5oZXJvLWJvZHl7cGFkZGluZy1ib3R0b206OXJlbTtwYWRkaW5nLXRvcDo5cmVtfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7Lmhlcm8uaXMtbGFyZ2UgLmhlcm8tYm9keXtwYWRkaW5nLWJvdHRvbToxOHJlbTtwYWRkaW5nLXRvcDoxOHJlbX19Lmhlcm8uaXMtZnVsbGhlaWdodHttaW4taGVpZ2h0OjEwMHZofS5oZXJvLmlzLWZ1bGxoZWlnaHQgLmhlcm8tYm9keXthbGlnbi1pdGVtczpjZW50ZXI7ZGlzcGxheTpmbGV4fS5oZXJvLmlzLWZ1bGxoZWlnaHQgLmhlcm8tYm9keT4uY29udGFpbmVye2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjF9LnNlY3Rpb257YmFja2dyb3VuZC1jb2xvcjojZmZmO3BhZGRpbmc6M3JlbSAxLjVyZW19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuc2VjdGlvbi5pcy1tZWRpdW17cGFkZGluZzo5cmVtIDEuNXJlbX0uc2VjdGlvbi5pcy1sYXJnZXtwYWRkaW5nOjE4cmVtIDEuNXJlbX19LmZvb3RlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7cGFkZGluZzozcmVtIDEuNXJlbSA2cmVtfS5oZWFkZXIuaXMtZml4ZWQtdG9we3otaW5kZXg6MTAzMDtwb3NpdGlvbjpmaXhlZDt0b3A6MDtsZWZ0OjA7cmlnaHQ6MH0uaGFzLWZpeGVkLW5hdnttYXJnaW4tdG9wOjUwcHh9LnNlY3Rpb24uaXMtc21hbGx7cGFkZGluZzoxcmVtIDEuNXJlbX0udGV4dGFyZWEuaXMtZmx1aWR7bWluLWhlaWdodDoxZW07b3ZlcmZsb3c6aGlkZGVuO3Jlc2l6ZTpub25lO3RyYW5zaXRpb246bWluLWhlaWdodCAwLjNzfS50ZXh0YXJlYS5pcy1mbHVpZDpmb2N1c3ttaW4taGVpZ2h0OjZlbTtvdmVyZmxvdzphdXRvfS5uYXYtaW52ZXJzZXtiYWNrZ3JvdW5kOiMxODJiNzN9Lm5hdi1pbnZlcnNlIGEubmF2LWl0ZW17Y29sb3I6I2YyZjJmMn0ubmF2LWludmVyc2UgYS5uYXYtaXRlbTpob3Zlcntjb2xvcjojZDFkNWUzfS5uYXYtaW52ZXJzZSBhLm5hdi1pdGVtLmlzLWFjdGl2ZXtjb2xvcjojZmZmfS5uYXYtaW52ZXJzZSBhLm5hdi1pdGVtLmlzLXRhYjpob3Zlcntib3JkZXItYm90dG9tLWNvbG9yOiNmZmZ9Lm5hdi1pbnZlcnNlIGEubmF2LWl0ZW0uaXMtdGFiLmlzLWFjdGl2ZXtib3JkZXItYm90dG9tOjNweCBzb2xpZCAjZmZmO2NvbG9yOiNmZmZ9Lm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVye3Bvc2l0aW9uOmZpeGVkO3RvcDowO2JvdHRvbTowO3otaW5kZXg6MTA0MDtvdmVyZmxvdy15OmF1dG87dGV4dC1hbGlnbjpjZW50ZXI7YmFja2dyb3VuZDojMTgyYjczO2NvbG9yOiNmZmY7bGVmdDotMjUwcHg7d2lkdGg6MjUwcHg7dHJhbnNpdGlvbjpsZWZ0IDAuNXN9Lm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyLmlzLWFjdGl2ZXtsZWZ0OjB9Lm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyIC5uYXYtaXRlbXtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmJsb2NrO3BhZGRpbmctdG9wOjEwcHg7cGFkZGluZy1ib3R0b206OXB4O2JhY2tncm91bmQ6cmdiYSgyNTUsMjU1LDI1NSwwLjEpfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlciAubmF2LWl0ZW0uaXMtYWN0aXZle2JhY2tncm91bmQ6bGluZWFyLWdyYWRpZW50KHRvIHJpZ2h0LCByZ2JhKDI1NSwyNTUsMjU1LDAuNCksIHJnYmEoMjU1LDI1NSwyNTUsMC4xKSA1JSl9Lm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyIC5uYXYtaXRlbVtvcGVuXT5zdW1tYXJ5e21hcmdpbi1ib3R0b206OXB4fS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlciAubmF2LWl0ZW06bm90KDpsYXN0LWNoaWxkKXtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZmZmfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlciB+IC5pcy1vdmVybGF5e2JhY2tncm91bmQ6cmdiYSgwLDAsMCwwLjUpO3otaW5kZXg6MTAzNTt2aXNpYmlsaXR5OmhpZGRlbjtwb3NpdGlvbjpmaXhlZDtvcGFjaXR5OjA7dHJhbnNpdGlvbjpvcGFjaXR5IDAuNzVzfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlci5pcy1hY3RpdmUgfiAuaXMtb3ZlcmxheXt2aXNpYmlsaXR5OnZpc2libGU7b3BhY2l0eToxfSNjb250YWluZXI+ZGl2Om5vdCgudmlzaWJsZSl7ZGlzcGxheTpub25lfSNjb250YWluZXI+ZGl2e3Bvc2l0aW9uOnJlbGF0aXZlO2hlaWdodDpjYWxjKDEwMHZoIC0gNTBweCk7b3ZlcmZsb3cteTphdXRvOy13ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOnRvdWNofVxcblwiICtcclxuICAgICc8L3N0eWxlPic7XHJcblxyXG4vLyBTaG93IHRoZSBtZW51IHdoZW4gY2xpY2tpbmcgb24gdGhlIG1lbnUgYnV0dG9uXHJcbkFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm5hdi1zbGlkZXItdG9nZ2xlJykpXHJcbiAgICAuZm9yRWFjaChlbCA9PiBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZU1lbnUpKTtcclxuXHJcbi8vIEhpZGUgdGhlIG1lbnUgd2hlbiBjbGlja2luZyB0aGUgb3ZlcmxheVxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubmF2LXNsaWRlci1jb250YWluZXIgLmlzLW92ZXJsYXknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZU1lbnUpO1xyXG5cclxuLy8gQ2hhbmdlIHRhYnNcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBnbG9iYWxUYWJDaGFuZ2UoZXZlbnQpIHtcclxuICAgIHZhciB0YWJOYW1lID0gZXZlbnQudGFyZ2V0LmRhdGFzZXQudGFiTmFtZTtcclxuICAgIHZhciB0YWIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjY29udGFpbmVyID4gW2RhdGEtdGFiLW5hbWU9JHt0YWJOYW1lfV1gKTtcclxuICAgIGlmKCF0YWJOYW1lIHx8ICF0YWIpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy9Db250ZW50XHJcbiAgICAvL1dlIGNhbid0IGp1c3QgcmVtb3ZlIHRoZSBmaXJzdCBkdWUgdG8gYnJvd3NlciBsYWdcclxuICAgIEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2NvbnRhaW5lciA+IC52aXNpYmxlJykpXHJcbiAgICAgICAgLmZvckVhY2goZWwgPT4gZWwuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpKTtcclxuICAgIHRhYi5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcblxyXG4gICAgLy9UYWJzXHJcbiAgICBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlciAuaXMtYWN0aXZlJykpXHJcbiAgICAgICAgLmZvckVhY2goZWwgPT4gZWwuY2xhc3NMaXN0LnJlbW92ZSgnaXMtYWN0aXZlJykpO1xyXG4gICAgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ2lzLWFjdGl2ZScpO1xyXG5cclxuICAgIGhvb2suZmlyZSgndWkudGFiU2hvd24nLCB0YWIpO1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNob3cvaGlkZSB0aGUgbWVudS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdG9nZ2xlTWVudSgpO1xyXG4gKi9cclxuZnVuY3Rpb24gdG9nZ2xlTWVudSgpIHtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlcicpLmNsYXNzTGlzdC50b2dnbGUoJ2lzLWFjdGl2ZScpO1xyXG59XHJcblxyXG52YXIgdGFiVUlEID0gMDtcclxuLyoqXHJcbiAqIFVzZWQgdG8gYWRkIGEgdGFiIHRvIHRoZSBib3QncyBuYXZpZ2F0aW9uLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgdGFiID0gdWkuYWRkVGFiKCdUZXh0Jyk7XHJcbiAqIHZhciB0YWIyID0gdWkuYWRkVGFiKCdDdXN0b20gTWVzc2FnZXMnLCAnbWVzc2FnZXMnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IHRhYlRleHRcclxuICogQHBhcmFtIHtzdHJpbmd9IFtncm91cE5hbWU9bWFpbl0gT3B0aW9uYWwuIElmIHByb3ZpZGVkLCB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAgb2YgdGFicyB0byBhZGQgdGhpcyB0YWIgdG8uXHJcbiAqIEByZXR1cm4ge05vZGV9IC0gVGhlIGRpdiB0byBwbGFjZSB0YWIgY29udGVudCBpbi5cclxuICovXHJcbmZ1bmN0aW9uIGFkZFRhYih0YWJUZXh0LCBncm91cE5hbWUgPSAnbWFpbicpIHtcclxuICAgIHZhciB0YWJOYW1lID0gJ2JvdFRhYl8nICsgdGFiVUlEKys7XHJcblxyXG4gICAgdmFyIHRhYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIHRhYi50ZXh0Q29udGVudCA9IHRhYlRleHQ7XHJcbiAgICB0YWIuY2xhc3NMaXN0LmFkZCgnbmF2LWl0ZW0nKTtcclxuICAgIHRhYi5kYXRhc2V0LnRhYk5hbWUgPSB0YWJOYW1lO1xyXG5cclxuICAgIHZhciB0YWJDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0YWJDb250ZW50LmRhdGFzZXQudGFiTmFtZSA9IHRhYk5hbWU7XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLm5hdi1zbGlkZXItY29udGFpbmVyIFtkYXRhLXRhYi1ncm91cD0ke2dyb3VwTmFtZX1dYCkuYXBwZW5kQ2hpbGQodGFiKTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb250YWluZXInKS5hcHBlbmRDaGlsZCh0YWJDb250ZW50KTtcclxuXHJcbiAgICByZXR1cm4gdGFiQ29udGVudDtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgZ2xvYmFsIHRhYi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHRhYiA9IHVpLmFkZFRhYignVGFiJyk7XHJcbiAqIHVpLnJlbW92ZVRhYih0YWIpO1xyXG4gKiBAcGFyYW0ge05vZGV9IHRhYkNvbnRlbnQgVGhlIGRpdiByZXR1cm5lZCBieSB0aGUgYWRkVGFiIGZ1bmN0aW9uLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlVGFiKHRhYkNvbnRlbnQpIHtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5uYXYtc2xpZGVyLWNvbnRhaW5lciBbZGF0YS10YWItbmFtZT0ke3RhYkNvbnRlbnQuZGF0YXNldC50YWJOYW1lfV1gKS5yZW1vdmUoKTtcclxuICAgIHRhYkNvbnRlbnQucmVtb3ZlKCk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHRhYiBncm91cCBpbiB3aGljaCB0YWJzIGNhbiBiZSBwbGFjZWQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHVpLmFkZFRhYkdyb3VwKCdHcm91cCBUZXh0JywgJ3NvbWVfZ3JvdXAnKTtcclxuICogdWkuYWRkVGFiKCdXaXRoaW4gZ3JvdXAnLCAnc29tZV9ncm91cCcpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIFRoZSB0ZXh0IHRoZSB1c2VyIHdpbGwgc2VlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBncm91cE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZ3JvdXAgd2hpY2ggY2FuIGJlIHVzZWQgdG8gYWRkIHRhYnMgd2l0aGluIHRoZSBncm91cC5cclxuICogQHBhcmFtIHtzdHJpbmd9IFtwYXJlbnQgPSBtYWluXSAtIFRoZSBuYW1lIG9mIHRoZSBwYXJlbnQgZ3JvdXAuXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRUYWJHcm91cCh0ZXh0LCBncm91cE5hbWUsIHBhcmVudCA9ICdtYWluJykge1xyXG4gICAgdmFyIGRldGFpbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkZXRhaWxzJyk7XHJcbiAgICBkZXRhaWxzLmNsYXNzTGlzdC5hZGQoJ25hdi1pdGVtJyk7XHJcbiAgICBkZXRhaWxzLmRhdGFzZXQudGFiR3JvdXAgPSBncm91cE5hbWU7XHJcblxyXG4gICAgdmFyIHN1bW1hcnkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdW1tYXJ5Jyk7XHJcbiAgICBzdW1tYXJ5LnRleHRDb250ZW50ID0gdGV4dDtcclxuICAgIGRldGFpbHMuYXBwZW5kQ2hpbGQoc3VtbWFyeSk7XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLm5hdi1zbGlkZXItY29udGFpbmVyIFtkYXRhLXRhYi1ncm91cD1cIiR7cGFyZW50fVwiXWApLmFwcGVuZENoaWxkKGRldGFpbHMpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYSB0YWIgZ3JvdXAgYW5kIGFsbCB0YWJzIGNvbnRhaW5lZCB3aXRoaW4gdGhlIHNwZWNpZmllZCBncm91cC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogYWRkVGFiR3JvdXAoJ0dyb3VwJywgJ2dyb3VwMScpO1xyXG4gKiB2YXIgaW5uZXIgPSBhZGRUYWIoJ0lubmVyJywgJ2dyb3VwMScpO1xyXG4gKiByZW1vdmVUYWJHcm91cCgnZ3JvdXAxJyk7IC8vIGlubmVyIGhhcyBiZWVuIHJlbW92ZWQuXHJcbiAqIEBwYXJhbSBzdHJpbmcgZ3JvdXBOYW1lIHRoZSBuYW1lIG9mIHRoZSBncm91cCB0aGF0IHdhcyB1c2VkIGluIHVpLmFkZFRhYkdyb3VwLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlVGFiR3JvdXAoZ3JvdXBOYW1lKSB7XHJcbiAgICB2YXIgZ3JvdXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAubmF2LXNsaWRlci1jb250YWluZXIgW2RhdGEtdGFiLWdyb3VwPVwiJHtncm91cE5hbWV9XCJdYCk7XHJcbiAgICB2YXIgaXRlbXMgPSBBcnJheS5mcm9tKGdyb3VwLnF1ZXJ5U2VsZWN0b3JBbGwoJ3NwYW4nKSk7XHJcblxyXG4gICAgaXRlbXMuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICAvL1RhYiBjb250ZW50XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2NvbnRhaW5lciA+IFtkYXRhLXRhYi1uYW1lPVwiJHtpdGVtLmRhdGFzZXQudGFiTmFtZX1cIl1gKS5yZW1vdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGdyb3VwLnJlbW92ZSgpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRvZ2dsZU1lbnUsXHJcbiAgICBhZGRUYWIsXHJcbiAgICByZW1vdmVUYWIsXHJcbiAgICBhZGRUYWJHcm91cCxcclxuICAgIHJlbW92ZVRhYkdyb3VwLFxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGFsZXJ0XHJcbn07XHJcblxyXG52YXIgbW9kYWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQnKTtcclxuXHJcbi8qKlxyXG4qIEZ1bmN0aW9uIHVzZWQgdG8gcmVxdWlyZSBhY3Rpb24gZnJvbSB0aGUgdXNlci5cclxuKlxyXG4qIEBwYXJhbSB7U3RyaW5nfSBodG1sIHRoZSBodG1sIHRvIGRpc3BsYXkgaW4gdGhlIGFsZXJ0XHJcbiogQHBhcmFtIHtBcnJheX0gYnV0dG9ucyBhbiBhcnJheSBvZiBidXR0b25zIHRvIGFkZCB0byB0aGUgYWxlcnQuXHJcbiogICAgICAgIEZvcm1hdDogW3t0ZXh0OiAnVGVzdCcsIHN0eWxlOidpcy1zdWNjZXNzJywgYWN0aW9uOiBmdW5jdGlvbigpe30sIHRoaXNBcmc6IHdpbmRvdywgZGlzbWlzczogZmFsc2V9XVxyXG4qICAgICAgICBOb3RlOiB0ZXh0IGlzIHRoZSBvbmx5IHJlcXVpcmVkIHBhcmFtYXRlci4gSWYgbm8gYnV0dG9uIGFycmF5IGlzIHNwZWNpZmllZFxyXG4qICAgICAgICB0aGVuIGEgc2luZ2xlIE9LIGJ1dHRvbiB3aWxsIGJlIHNob3duLlxyXG4qICAgICAgICBzdHlsZSBjYW4gYWxzbyBiZSBhbiBhcnJheSBvZiBjbGFzc2VzIHRvIGFkZC5cclxuKiAgICAgICAgRGVmYXVsdHM6IHN0eWxlOiAnJywgYWN0aW9uOiB1bmRlZmluZWQsIHRoaXNBcmc6IHVuZGVmaW5lZCwgZGlzbWlzczogdHJ1ZVxyXG4qL1xyXG5mdW5jdGlvbiBhbGVydChodG1sLCBidXR0b25zID0gW3t0ZXh0OiAnT0snfV0pIHtcclxuICAgIGlmIChpbnN0YW5jZS5hY3RpdmUpIHtcclxuICAgICAgICBpbnN0YW5jZS5xdWV1ZS5wdXNoKHtodG1sLCBidXR0b25zfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaW5zdGFuY2UuYWN0aXZlID0gdHJ1ZTtcclxuXHJcbiAgICBidXR0b25zLmZvckVhY2goZnVuY3Rpb24oYnV0dG9uLCBpKSB7XHJcbiAgICAgICAgYnV0dG9uLmRpc21pc3MgPSAoYnV0dG9uLmRpc21pc3MgPT09IGZhbHNlKSA/IGZhbHNlIDogdHJ1ZTtcclxuICAgICAgICBpbnN0YW5jZS5idXR0b25zWydidXR0b25fJyArIGldID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246IGJ1dHRvbi5hY3Rpb24sXHJcbiAgICAgICAgICAgIHRoaXNBcmc6IGJ1dHRvbi50aGlzQXJnIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgZGlzbWlzczogdHlwZW9mIGJ1dHRvbi5kaXNtaXNzID09ICdib29sZWFuJyA/IGJ1dHRvbi5kaXNtaXNzIDogdHJ1ZSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGJ1dHRvbi5pZCA9ICdidXR0b25fJyArIGk7XHJcbiAgICAgICAgYnVpbGRCdXR0b24oYnV0dG9uKTtcclxuICAgIH0pO1xyXG4gICAgbW9kYWwucXVlcnlTZWxlY3RvcignLm1vZGFsLWNhcmQtYm9keScpLmlubmVySFRNTCA9IGh0bWw7XHJcblxyXG4gICAgbW9kYWwuY2xhc3NMaXN0LmFkZCgnaXMtYWN0aXZlJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBIb2xkcyB0aGUgY3VycmVudCBhbGVydCBhbmQgcXVldWUgb2YgZnVydGhlciBhbGVydHMuXHJcbiAqL1xyXG52YXIgaW5zdGFuY2UgPSB7XHJcbiAgICBhY3RpdmU6IGZhbHNlLFxyXG4gICAgcXVldWU6IFtdLFxyXG4gICAgYnV0dG9uczoge30sXHJcbn07XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdXNlZCB0byBhZGQgYnV0dG9uIGVsZW1lbnRzIHRvIGFuIGFsZXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gYnV0dG9uXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZEJ1dHRvbihidXR0b24pIHtcclxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgIGVsLmlubmVySFRNTCA9IGJ1dHRvbi50ZXh0O1xyXG5cclxuICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2J1dHRvbicpO1xyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYnV0dG9uLnN0eWxlKSkge1xyXG4gICAgICAgIGJ1dHRvbi5zdHlsZS5mb3JFYWNoKHN0eWxlID0+IGVsLmNsYXNzTGlzdC5hZGQoc3R5bGUpKTtcclxuICAgIH0gZWxzZSBpZiAoYnV0dG9uLnN0eWxlKSB7XHJcbiAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChidXR0b24uc3R5bGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGVsLmlkID0gYnV0dG9uLmlkO1xyXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBidXR0b25IYW5kbGVyKTtcclxuICAgIG1vZGFsLnF1ZXJ5U2VsZWN0b3IoJy5tb2RhbC1jYXJkLWZvb3QnKS5hcHBlbmRDaGlsZChlbCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBkZXRlcm1pbmUgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgZWFjaCBidXR0b24gYWRkZWQgdG8gYW4gYWxlcnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnRcclxuICovXHJcbmZ1bmN0aW9uIGJ1dHRvbkhhbmRsZXIoZXZlbnQpIHtcclxuICAgIHZhciBidXR0b24gPSBpbnN0YW5jZS5idXR0b25zW2V2ZW50LnRhcmdldC5pZF0gfHwge307XHJcbiAgICBpZiAodHlwZW9mIGJ1dHRvbi5hY3Rpb24gPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGJ1dHRvbi5hY3Rpb24uY2FsbChidXR0b24udGhpc0FyZyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9SZXF1aXJlIHRoYXQgdGhlcmUgYmUgYW4gYWN0aW9uIGFzb2NpYXRlZCB3aXRoIG5vLWRpc21pc3MgYnV0dG9ucy5cclxuICAgIGlmIChidXR0b24uZGlzbWlzcyB8fCB0eXBlb2YgYnV0dG9uLmFjdGlvbiAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgbW9kYWwuY2xhc3NMaXN0LnJlbW92ZSgnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgbW9kYWwucXVlcnlTZWxlY3RvcignLm1vZGFsLWNhcmQtZm9vdCcpLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIGluc3RhbmNlLmJ1dHRvbnMgPSB7fTtcclxuICAgICAgICBpbnN0YW5jZS5hY3RpdmUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gQXJlIG1vcmUgYWxlcnRzIHdhaXRpbmcgdG8gYmUgc2hvd24/XHJcbiAgICAgICAgaWYgKGluc3RhbmNlLnF1ZXVlLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBsZXQgbmV4dCA9IGluc3RhbmNlLnF1ZXVlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIGFsZXJ0KG5leHQuaHRtbCwgbmV4dC5idXR0b25zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwiXHJcblxyXG52YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuZWwuaW5uZXJIVE1MID0gXCI8ZGl2IGlkPVxcXCJhbGVydFxcXCIgY2xhc3M9XFxcIm1vZGFsXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwibW9kYWwtYmFja2dyb3VuZFxcXCI+PC9kaXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcIm1vZGFsLWNhcmRcXFwiPlxcclxcbiAgICAgICAgPGhlYWRlciBjbGFzcz1cXFwibW9kYWwtY2FyZC1oZWFkXFxcIj48L2hlYWRlcj5cXHJcXG4gICAgICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJtb2RhbC1jYXJkLWJvZHlcXFwiPjwvc2VjdGlvbj5cXHJcXG4gICAgICAgIDxmb290ZXIgY2xhc3M9XFxcIm1vZGFsLWNhcmQtZm9vdFxcXCI+PC9mb290ZXI+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuZWwuaW5uZXJIVE1MID0gXCIuYm90LW5vdGlmaWNhdGlvbntwb3NpdGlvbjpmaXhlZDt0b3A6MC42ZW07cmlnaHQ6MWVtO3otaW5kZXg6MTAzNTttaW4td2lkdGg6MjAwcHg7Ym9yZGVyLXJhZGl1czo1cHg7cGFkZGluZzo1cHg7YmFja2dyb3VuZDojZmZmO2NvbG9yOiMxODJiNzM7b3BhY2l0eTowO3RyYW5zaXRpb246b3BhY2l0eSAxc30uYm90LW5vdGlmaWNhdGlvbi5pcy1hY3RpdmV7b3BhY2l0eToxfVxcblwiO1xyXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbk9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vYWxlcnQnKSxcclxuICAgIHJlcXVpcmUoJy4vbm90aWZ5JylcclxuKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBub3RpZnksXHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzZW5kIGEgbm9uLWNyaXRpY2FsIGFsZXJ0IHRvIHRoZSB1c2VyLlxyXG4gKiBTaG91bGQgYmUgdXNlZCBpbiBwbGFjZSBvZiB1aS5hbGVydCBpZiBwb3NzaWJsZSBhcyBpdCBpcyBub24tYmxvY2tpbmcuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vU2hvd3MgYSBub3RmaWNhdGlvbiBmb3IgMiBzZWNvbmRzXHJcbiAqIHVpLm5vdGlmeSgnTm90aWZpY2F0aW9uJyk7XHJcbiAqIC8vU2hvd3MgYSBub3RpZmljYXRpb24gZm9yIDUgc2Vjb25kc1xyXG4gKiB1aS5ub3RpZnkoJ05vdGlmaWNhdGlvbicsIDUpO1xyXG4gKiBAcGFyYW0ge1N0cmluZ30gdGV4dCB0aGUgdGV4dCB0byBkaXNwbGF5LiBTaG91bGQgYmUga2VwdCBzaG9ydCB0byBhdm9pZCB2aXN1YWxseSBibG9ja2luZyB0aGUgbWVudSBvbiBzbWFsbCBkZXZpY2VzLlxyXG4gKiBAcGFyYW0ge051bWJlcn0gZGlzcGxheVRpbWUgdGhlIG51bWJlciBvZiBzZWNvbmRzIHRvIHNob3cgdGhlIG5vdGlmaWNhdGlvbiBmb3IuXHJcbiAqL1xyXG5mdW5jdGlvbiBub3RpZnkodGV4dCwgZGlzcGxheVRpbWUgPSAyKSB7XHJcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIGVsLmNsYXNzTGlzdC5hZGQoJ2JvdC1ub3RpZmljYXRpb24nLCAnaXMtYWN0aXZlJyk7XHJcbiAgICBlbC50ZXh0Q29udGVudCA9IHRleHQ7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTtcclxuICAgIHZhciB0aW1lb3V0cyA9IFtcclxuICAgICAgICAvLyBGYWRlIG91dCBhZnRlciBkaXNwbGF5VGltZVxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZSgnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgfS5iaW5kKGVsKSwgZGlzcGxheVRpbWUgKiAxMDAwKSxcclxuICAgICAgICAvLyBSZW1vdmUgYWZ0ZXIgZmFkZSBvdXRcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xyXG4gICAgICAgIH0uYmluZChlbCksIGRpc3BsYXlUaW1lICogMTAwMCArIDIxMDApXHJcbiAgICBdO1xyXG5cclxuXHJcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRpbWVvdXRzLmZvckVhY2goY2xlYXJUaW1lb3V0KTtcclxuICAgICAgICB0aGlzLnJlbW92ZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuIiwiLy9EZXRhaWxzIHBvbHlmaWxsLCBvbGRlciBmaXJlZm94LCBJRVxyXG5pZiAoISgnb3BlbicgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGV0YWlscycpKSkge1xyXG4gICAgbGV0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuICAgIHN0eWxlLnRleHRDb250ZW50ICs9IGBkZXRhaWxzOm5vdChbb3Blbl0pID4gOm5vdChzdW1tYXJ5KSB7IGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfSBkZXRhaWxzID4gc3VtbWFyeTpiZWZvcmUgeyBjb250ZW50OiBcIuKWtlwiOyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGZvbnQtc2l6ZTogLjhlbTsgd2lkdGg6IDEuNWVtOyBmb250LWZhbWlseTpcIkNvdXJpZXIgTmV3XCI7IH0gZGV0YWlsc1tvcGVuXSA+IHN1bW1hcnk6YmVmb3JlIHsgdHJhbnNmb3JtOiByb3RhdGUoOTBkZWcpOyB9YDtcclxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xyXG5cclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC50YWdOYW1lID09ICdTVU1NQVJZJykge1xyXG4gICAgICAgICAgICBsZXQgZGV0YWlscyA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFkZXRhaWxzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChkZXRhaWxzLmdldEF0dHJpYnV0ZSgnb3BlbicpKSB7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLm9wZW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMucmVtb3ZlQXR0cmlidXRlKCdvcGVuJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLm9wZW4gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5zZXRBdHRyaWJ1dGUoJ29wZW4nLCAnb3BlbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiLy8gSUUgRml4XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XHJcbiAgICBpZiAoISgnY29udGVudCcgaW4gdGVtcGxhdGUpKSB7XHJcbiAgICAgICAgbGV0IGNvbnRlbnQgPSB0ZW1wbGF0ZS5jaGlsZE5vZGVzO1xyXG4gICAgICAgIGxldCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb250ZW50Lmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGNvbnRlbnRbal0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGVtcGxhdGUuY29udGVudCA9IGZyYWdtZW50O1xyXG4gICAgfVxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSxcclxufTtcclxuXHJcbnZhciBwb2x5ZmlsbCA9IHJlcXVpcmUoJ3VpL3BvbHlmaWxscy90ZW1wbGF0ZScpO1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2xvbmUgYSB0ZW1wbGF0ZSBhZnRlciBhbHRlcmluZyB0aGUgcHJvdmlkZWQgcnVsZXMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI3RlbXBsYXRlJywgJyN0YXJnZXQnLCBbe3NlbGVjdG9yOiAnaW5wdXQnLCB2YWx1ZTogJ1ZhbHVlJ31dKTtcclxuICogdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCd0ZW1wbGF0ZScsICdkaXYnLCBbe3NlbGVjdG9yOiAnYScsIHJlbW92ZTogWydocmVmJ10sIG11bHRpcGxlOiB0cnVlfV0pO1xyXG4gKiBAcGFyYW0ge1N0cmluZ3xOb2RlfSB0ZW1wbGF0ZVxyXG4gKiBAcGFyYW0ge1N0cmluZ3xOb2RlfSB0YXJnZXRcclxuICogQHBhcmFtIHtBcnJheX0gcnVsZXMgZm9ybWF0OiBhcnJheSBvZiBvYmplY3RzXHJcbiAqICAgICAgZWFjaCBvYmplY3QgbXVzdCBoYXZlIFwic2VsZWN0b3JcIi5cclxuICogICAgICBlYWNoIG9iamVjdCBjYW4gaGF2ZSBcIm11bHRpcGxlXCIgc2V0IHRvIHVwZGF0ZSBhbGwgbWF0Y2hpbmcgZWxlbWVudHMuXHJcbiAqICAgICAgZWFjaCBvYmplY3QgY2FuIGhhdmUgXCJyZW1vdmVcIiAtIGFuIGFycmF5IG9mIGF0dHJpYnV0ZXMgdG8gcmVtb3ZlLlxyXG4gKiAgICAgIGVhY2ggb2JqZWN0IGNhbiBoYXZlIFwidGV4dFwiIG9yIFwiaHRtbFwiIC0gZnVydGhlciBrZXlzIHdpbGwgYmUgc2V0IGFzIGF0dHJpYnV0ZXMuXHJcbiAqICAgICAgaWYgYm90aCB0ZXh0IGFuZCBodG1sIGFyZSBzZXQsIHRleHQgd2lsbCB0YWtlIHByZWNlbmRlbmNlLlxyXG4gKiAgICAgIHJ1bGVzIHdpbGwgYmUgcGFyc2VkIGluIHRoZSBvcmRlciB0aGF0IHRoZXkgYXJlIHByZXNlbnQgaW4gdGhlIGFycmF5LlxyXG4gKi9cclxuZnVuY3Rpb24gYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKHRlbXBsYXRlLCB0YXJnZXQsIHJ1bGVzID0gW10pIHtcclxuICAgIGlmICh0eXBlb2YgdGVtcGxhdGUgPT0gJ3N0cmluZycpIHtcclxuICAgICAgICB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGVtcGxhdGUpO1xyXG4gICAgfVxyXG4gICAgaWYgKHR5cGVvZiB0YXJnZXQgPT0gJ3N0cmluZycpIHtcclxuICAgICAgICB0YXJnZXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRhcmdldCk7XHJcbiAgICB9XHJcblxyXG4gICAgcG9seWZpbGwodGVtcGxhdGUpO1xyXG5cclxuICAgIHZhciBjb250ZW50ID0gdGVtcGxhdGUuY29udGVudDtcclxuXHJcbiAgICBydWxlcy5mb3JFYWNoKHJ1bGUgPT4gaGFuZGxlUnVsZShjb250ZW50LCBydWxlKSk7XHJcblxyXG4gICAgdGFyZ2V0LmFwcGVuZENoaWxkKGRvY3VtZW50LmltcG9ydE5vZGUoY29udGVudCwgdHJ1ZSkpO1xyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gYXBwbHkgcnVsZXMgdG8gdGhlIHRlbXBsYXRlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge05vZGV9IGNvbnRlbnQgLSB0aGUgY29udGVudCBvZiB0aGUgdGVtcGxhdGUuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBydWxlIC0gdGhlIHJ1bGUgdG8gYXBwbHkuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVSdWxlKGNvbnRlbnQsIHJ1bGUpIHtcclxuICAgIGlmIChydWxlLm11bHRpcGxlKSB7XHJcbiAgICAgICAgbGV0IGVscyA9IGNvbnRlbnQucXVlcnlTZWxlY3RvckFsbChydWxlLnNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgQXJyYXkuZnJvbShlbHMpXHJcbiAgICAgICAgICAgIC5mb3JFYWNoKGVsID0+IHVwZGF0ZUVsZW1lbnQoZWwsIHJ1bGUpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbGV0IGVsID0gY29udGVudC5xdWVyeVNlbGVjdG9yKHJ1bGUuc2VsZWN0b3IpO1xyXG4gICAgICAgIGlmICghZWwpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBVbmFibGUgdG8gdXBkYXRlICR7cnVsZS5zZWxlY3Rvcn0uYCwgcnVsZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZUVsZW1lbnQoZWwsIHJ1bGUpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gdXBkYXRlIGFuIGVsZW1lbnQgd2l0aCBhIHJ1bGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Tm9kZX0gZWwgdGhlIGVsZW1lbnQgdG8gYXBwbHkgdGhlIHJ1bGVzIHRvLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcnVsZSB0aGUgcnVsZSBvYmplY3QuXHJcbiAqL1xyXG5mdW5jdGlvbiB1cGRhdGVFbGVtZW50KGVsLCBydWxlKSB7XHJcbiAgICBpZiAoJ3RleHQnIGluIHJ1bGUpIHtcclxuICAgICAgICBlbC50ZXh0Q29udGVudCA9IHJ1bGUudGV4dDtcclxuICAgIH0gZWxzZSBpZiAoJ2h0bWwnIGluIHJ1bGUpIHtcclxuICAgICAgICBlbC5pbm5lckhUTUwgPSBydWxlLmh0bWw7XHJcbiAgICB9XHJcblxyXG4gICAgT2JqZWN0LmtleXMocnVsZSlcclxuICAgICAgICAuZmlsdGVyKGtleSA9PiAhWydzZWxlY3RvcicsICd0ZXh0JywgJ2h0bWwnLCAncmVtb3ZlJywgJ211bHRpcGxlJ10uaW5jbHVkZXMoa2V5KSlcclxuICAgICAgICAuZm9yRWFjaChrZXkgPT4gZWwuc2V0QXR0cmlidXRlKGtleSwgcnVsZVtrZXldKSk7XHJcblxyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkocnVsZS5yZW1vdmUpKSB7XHJcbiAgICAgICAgcnVsZS5yZW1vdmUuZm9yRWFjaChrZXkgPT4gZWwucmVtb3ZlQXR0cmlidXRlKGtleSkpO1xyXG4gICAgfVxyXG59XHJcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gY29tcGFyZSBhbmQgaXNCdWZmZXIgdGFrZW4gZnJvbSBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9ibG9iLzY4MGU5ZTVlNDg4ZjIyYWFjMjc1OTlhNTdkYzg0NGE2MzE1OTI4ZGQvaW5kZXguanNcbi8vIG9yaWdpbmFsIG5vdGljZTpcblxuLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuZnVuY3Rpb24gY29tcGFyZShhLCBiKSB7XG4gIGlmIChhID09PSBiKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICB2YXIgeCA9IGEubGVuZ3RoO1xuICB2YXIgeSA9IGIubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldO1xuICAgICAgeSA9IGJbaV07XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaWYgKHkgPCB4KSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBpc0J1ZmZlcihiKSB7XG4gIGlmIChnbG9iYWwuQnVmZmVyICYmIHR5cGVvZiBnbG9iYWwuQnVmZmVyLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIoYik7XG4gIH1cbiAgcmV0dXJuICEhKGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlcik7XG59XG5cbi8vIGJhc2VkIG9uIG5vZGUgYXNzZXJ0LCBvcmlnaW5hbCBub3RpY2U6XG5cbi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgZnVuY3Rpb25zSGF2ZU5hbWVzID0gKGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGZvbygpIHt9Lm5hbWUgPT09ICdmb28nO1xufSgpKTtcbmZ1bmN0aW9uIHBUb1N0cmluZyAob2JqKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKTtcbn1cbmZ1bmN0aW9uIGlzVmlldyhhcnJidWYpIHtcbiAgaWYgKGlzQnVmZmVyKGFycmJ1ZikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHR5cGVvZiBnbG9iYWwuQXJyYXlCdWZmZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlci5pc1ZpZXcgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gQXJyYXlCdWZmZXIuaXNWaWV3KGFycmJ1Zik7XG4gIH1cbiAgaWYgKCFhcnJidWYpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGFycmJ1ZiBpbnN0YW5jZW9mIERhdGFWaWV3KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKGFycmJ1Zi5idWZmZXIgJiYgYXJyYnVmLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxudmFyIHJlZ2V4ID0gL1xccypmdW5jdGlvblxccysoW15cXChcXHNdKilcXHMqLztcbi8vIGJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9samhhcmIvZnVuY3Rpb24ucHJvdG90eXBlLm5hbWUvYmxvYi9hZGVlZWVjOGJmY2M2MDY4YjE4N2Q3ZDlmYjNkNWJiMWQzYTMwODk5L2ltcGxlbWVudGF0aW9uLmpzXG5mdW5jdGlvbiBnZXROYW1lKGZ1bmMpIHtcbiAgaWYgKCF1dGlsLmlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGZ1bmN0aW9uc0hhdmVOYW1lcykge1xuICAgIHJldHVybiBmdW5jLm5hbWU7XG4gIH1cbiAgdmFyIHN0ciA9IGZ1bmMudG9TdHJpbmcoKTtcbiAgdmFyIG1hdGNoID0gc3RyLm1hdGNoKHJlZ2V4KTtcbiAgcmV0dXJuIG1hdGNoICYmIG1hdGNoWzFdO1xufVxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICB9IGVsc2Uge1xuICAgIC8vIG5vbiB2OCBicm93c2VycyBzbyB3ZSBjYW4gaGF2ZSBhIHN0YWNrdHJhY2VcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgdmFyIG91dCA9IGVyci5zdGFjaztcblxuICAgICAgLy8gdHJ5IHRvIHN0cmlwIHVzZWxlc3MgZnJhbWVzXG4gICAgICB2YXIgZm5fbmFtZSA9IGdldE5hbWUoc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHR5cGVvZiBzID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuZnVuY3Rpb24gaW5zcGVjdChzb21ldGhpbmcpIHtcbiAgaWYgKGZ1bmN0aW9uc0hhdmVOYW1lcyB8fCAhdXRpbC5pc0Z1bmN0aW9uKHNvbWV0aGluZykpIHtcbiAgICByZXR1cm4gdXRpbC5pbnNwZWN0KHNvbWV0aGluZyk7XG4gIH1cbiAgdmFyIHJhd25hbWUgPSBnZXROYW1lKHNvbWV0aGluZyk7XG4gIHZhciBuYW1lID0gcmF3bmFtZSA/ICc6ICcgKyByYXduYW1lIDogJyc7XG4gIHJldHVybiAnW0Z1bmN0aW9uJyArICBuYW1lICsgJ10nO1xufVxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShpbnNwZWN0KHNlbGYuYWN0dWFsKSwgMTI4KSArICcgJyArXG4gICAgICAgICBzZWxmLm9wZXJhdG9yICsgJyAnICtcbiAgICAgICAgIHRydW5jYXRlKGluc3BlY3Qoc2VsZi5leHBlY3RlZCksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIGZhbHNlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5hc3NlcnQuZGVlcFN0cmljdEVxdWFsID0gZnVuY3Rpb24gZGVlcFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIHRydWUpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcFN0cmljdEVxdWFsJywgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgc3RyaWN0LCBtZW1vcykge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChpc0J1ZmZlcihhY3R1YWwpICYmIGlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBjb21wYXJlKGFjdHVhbCwgZXhwZWN0ZWQpID09PSAwO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICgoYWN0dWFsID09PSBudWxsIHx8IHR5cGVvZiBhY3R1YWwgIT09ICdvYmplY3QnKSAmJlxuICAgICAgICAgICAgIChleHBlY3RlZCA9PT0gbnVsbCB8fCB0eXBlb2YgZXhwZWN0ZWQgIT09ICdvYmplY3QnKSkge1xuICAgIHJldHVybiBzdHJpY3QgPyBhY3R1YWwgPT09IGV4cGVjdGVkIDogYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIElmIGJvdGggdmFsdWVzIGFyZSBpbnN0YW5jZXMgb2YgdHlwZWQgYXJyYXlzLCB3cmFwIHRoZWlyIHVuZGVybHlpbmdcbiAgLy8gQXJyYXlCdWZmZXJzIGluIGEgQnVmZmVyIGVhY2ggdG8gaW5jcmVhc2UgcGVyZm9ybWFuY2VcbiAgLy8gVGhpcyBvcHRpbWl6YXRpb24gcmVxdWlyZXMgdGhlIGFycmF5cyB0byBoYXZlIHRoZSBzYW1lIHR5cGUgYXMgY2hlY2tlZCBieVxuICAvLyBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nIChha2EgcFRvU3RyaW5nKS4gTmV2ZXIgcGVyZm9ybSBiaW5hcnlcbiAgLy8gY29tcGFyaXNvbnMgZm9yIEZsb2F0KkFycmF5cywgdGhvdWdoLCBzaW5jZSBlLmcuICswID09PSAtMCBidXQgdGhlaXJcbiAgLy8gYml0IHBhdHRlcm5zIGFyZSBub3QgaWRlbnRpY2FsLlxuICB9IGVsc2UgaWYgKGlzVmlldyhhY3R1YWwpICYmIGlzVmlldyhleHBlY3RlZCkgJiZcbiAgICAgICAgICAgICBwVG9TdHJpbmcoYWN0dWFsKSA9PT0gcFRvU3RyaW5nKGV4cGVjdGVkKSAmJlxuICAgICAgICAgICAgICEoYWN0dWFsIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5IHx8XG4gICAgICAgICAgICAgICBhY3R1YWwgaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXkpKSB7XG4gICAgcmV0dXJuIGNvbXBhcmUobmV3IFVpbnQ4QXJyYXkoYWN0dWFsLmJ1ZmZlciksXG4gICAgICAgICAgICAgICAgICAgbmV3IFVpbnQ4QXJyYXkoZXhwZWN0ZWQuYnVmZmVyKSkgPT09IDA7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIGlmIChpc0J1ZmZlcihhY3R1YWwpICE9PSBpc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbWVtb3MgPSBtZW1vcyB8fCB7YWN0dWFsOiBbXSwgZXhwZWN0ZWQ6IFtdfTtcblxuICAgIHZhciBhY3R1YWxJbmRleCA9IG1lbW9zLmFjdHVhbC5pbmRleE9mKGFjdHVhbCk7XG4gICAgaWYgKGFjdHVhbEluZGV4ICE9PSAtMSkge1xuICAgICAgaWYgKGFjdHVhbEluZGV4ID09PSBtZW1vcy5leHBlY3RlZC5pbmRleE9mKGV4cGVjdGVkKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBtZW1vcy5hY3R1YWwucHVzaChhY3R1YWwpO1xuICAgIG1lbW9zLmV4cGVjdGVkLnB1c2goZXhwZWN0ZWQpO1xuXG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQsIHN0cmljdCwgbWVtb3MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIsIHN0cmljdCwgYWN0dWFsVmlzaXRlZE9iamVjdHMpIHtcbiAgaWYgKGEgPT09IG51bGwgfHwgYSA9PT0gdW5kZWZpbmVkIHx8IGIgPT09IG51bGwgfHwgYiA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gaWYgb25lIGlzIGEgcHJpbWl0aXZlLCB0aGUgb3RoZXIgbXVzdCBiZSBzYW1lXG4gIGlmICh1dGlsLmlzUHJpbWl0aXZlKGEpIHx8IHV0aWwuaXNQcmltaXRpdmUoYikpXG4gICAgcmV0dXJuIGEgPT09IGI7XG4gIGlmIChzdHJpY3QgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKGEpICE9PSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB2YXIgYUlzQXJncyA9IGlzQXJndW1lbnRzKGEpO1xuICB2YXIgYklzQXJncyA9IGlzQXJndW1lbnRzKGIpO1xuICBpZiAoKGFJc0FyZ3MgJiYgIWJJc0FyZ3MpIHx8ICghYUlzQXJncyAmJiBiSXNBcmdzKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhSXNBcmdzKSB7XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiLCBzdHJpY3QpO1xuICB9XG4gIHZhciBrYSA9IG9iamVjdEtleXMoYSk7XG4gIHZhciBrYiA9IG9iamVjdEtleXMoYik7XG4gIHZhciBrZXksIGk7XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT09IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9PSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSwgc3RyaWN0LCBhY3R1YWxWaXNpdGVkT2JqZWN0cykpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIDguIFRoZSBub24tZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGZvciBhbnkgZGVlcCBpbmVxdWFsaXR5LlxuLy8gYXNzZXJ0Lm5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3REZWVwRXF1YWwgPSBmdW5jdGlvbiBub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBmYWxzZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuYXNzZXJ0Lm5vdERlZXBTdHJpY3RFcXVhbCA9IG5vdERlZXBTdHJpY3RFcXVhbDtcbmZ1bmN0aW9uIG5vdERlZXBTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIHRydWUpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcFN0cmljdEVxdWFsJywgbm90RGVlcFN0cmljdEVxdWFsKTtcbiAgfVxufVxuXG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBJZ25vcmUuICBUaGUgaW5zdGFuY2VvZiBjaGVjayBkb2Vzbid0IHdvcmsgZm9yIGFycm93IGZ1bmN0aW9ucy5cbiAgfVxuXG4gIGlmIChFcnJvci5pc1Byb3RvdHlwZU9mKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBleHBlY3RlZC5jYWxsKHt9LCBhY3R1YWwpID09PSB0cnVlO1xufVxuXG5mdW5jdGlvbiBfdHJ5QmxvY2soYmxvY2spIHtcbiAgdmFyIGVycm9yO1xuICB0cnkge1xuICAgIGJsb2NrKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBlcnJvciA9IGU7XG4gIH1cbiAgcmV0dXJuIGVycm9yO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodHlwZW9mIGJsb2NrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJibG9ja1wiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBleHBlY3RlZCA9PT0gJ3N0cmluZycpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgYWN0dWFsID0gX3RyeUJsb2NrKGJsb2NrKTtcblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIHZhciB1c2VyUHJvdmlkZWRNZXNzYWdlID0gdHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnO1xuICB2YXIgaXNVbndhbnRlZEV4Y2VwdGlvbiA9ICFzaG91bGRUaHJvdyAmJiB1dGlsLmlzRXJyb3IoYWN0dWFsKTtcbiAgdmFyIGlzVW5leHBlY3RlZEV4Y2VwdGlvbiA9ICFzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgIWV4cGVjdGVkO1xuXG4gIGlmICgoaXNVbndhbnRlZEV4Y2VwdGlvbiAmJlxuICAgICAgdXNlclByb3ZpZGVkTWVzc2FnZSAmJlxuICAgICAgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8XG4gICAgICBpc1VuZXhwZWN0ZWRFeGNlcHRpb24pIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3ModHJ1ZSwgYmxvY2ssIGVycm9yLCBtZXNzYWdlKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzKGZhbHNlLCBibG9jaywgZXJyb3IsIG1lc3NhZ2UpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikgdGhyb3cgZXJyOyB9O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcbiIsIi8qZ2xvYmFsIHdpbmRvdywgZ2xvYmFsKi9cbnZhciB1dGlsID0gcmVxdWlyZShcInV0aWxcIilcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpXG52YXIgbm93ID0gcmVxdWlyZShcImRhdGUtbm93XCIpXG5cbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZVxudmFyIGNvbnNvbGVcbnZhciB0aW1lcyA9IHt9XG5cbmlmICh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiICYmIGdsb2JhbC5jb25zb2xlKSB7XG4gICAgY29uc29sZSA9IGdsb2JhbC5jb25zb2xlXG59IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93LmNvbnNvbGUpIHtcbiAgICBjb25zb2xlID0gd2luZG93LmNvbnNvbGVcbn0gZWxzZSB7XG4gICAgY29uc29sZSA9IHt9XG59XG5cbnZhciBmdW5jdGlvbnMgPSBbXG4gICAgW2xvZywgXCJsb2dcIl0sXG4gICAgW2luZm8sIFwiaW5mb1wiXSxcbiAgICBbd2FybiwgXCJ3YXJuXCJdLFxuICAgIFtlcnJvciwgXCJlcnJvclwiXSxcbiAgICBbdGltZSwgXCJ0aW1lXCJdLFxuICAgIFt0aW1lRW5kLCBcInRpbWVFbmRcIl0sXG4gICAgW3RyYWNlLCBcInRyYWNlXCJdLFxuICAgIFtkaXIsIFwiZGlyXCJdLFxuICAgIFtjb25zb2xlQXNzZXJ0LCBcImFzc2VydFwiXVxuXVxuXG5mb3IgKHZhciBpID0gMDsgaSA8IGZ1bmN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0dXBsZSA9IGZ1bmN0aW9uc1tpXVxuICAgIHZhciBmID0gdHVwbGVbMF1cbiAgICB2YXIgbmFtZSA9IHR1cGxlWzFdXG5cbiAgICBpZiAoIWNvbnNvbGVbbmFtZV0pIHtcbiAgICAgICAgY29uc29sZVtuYW1lXSA9IGZcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29uc29sZVxuXG5mdW5jdGlvbiBsb2coKSB7fVxuXG5mdW5jdGlvbiBpbmZvKCkge1xuICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cylcbn1cblxuZnVuY3Rpb24gd2FybigpIHtcbiAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpXG59XG5cbmZ1bmN0aW9uIGVycm9yKCkge1xuICAgIGNvbnNvbGUud2Fybi5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpXG59XG5cbmZ1bmN0aW9uIHRpbWUobGFiZWwpIHtcbiAgICB0aW1lc1tsYWJlbF0gPSBub3coKVxufVxuXG5mdW5jdGlvbiB0aW1lRW5kKGxhYmVsKSB7XG4gICAgdmFyIHRpbWUgPSB0aW1lc1tsYWJlbF1cbiAgICBpZiAoIXRpbWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gc3VjaCBsYWJlbDogXCIgKyBsYWJlbClcbiAgICB9XG5cbiAgICB2YXIgZHVyYXRpb24gPSBub3coKSAtIHRpbWVcbiAgICBjb25zb2xlLmxvZyhsYWJlbCArIFwiOiBcIiArIGR1cmF0aW9uICsgXCJtc1wiKVxufVxuXG5mdW5jdGlvbiB0cmFjZSgpIHtcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKClcbiAgICBlcnIubmFtZSA9IFwiVHJhY2VcIlxuICAgIGVyci5tZXNzYWdlID0gdXRpbC5mb3JtYXQuYXBwbHkobnVsbCwgYXJndW1lbnRzKVxuICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKVxufVxuXG5mdW5jdGlvbiBkaXIob2JqZWN0KSB7XG4gICAgY29uc29sZS5sb2codXRpbC5pbnNwZWN0KG9iamVjdCkgKyBcIlxcblwiKVxufVxuXG5mdW5jdGlvbiBjb25zb2xlQXNzZXJ0KGV4cHJlc3Npb24pIHtcbiAgICBpZiAoIWV4cHJlc3Npb24pIHtcbiAgICAgICAgdmFyIGFyciA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuICAgICAgICBhc3NlcnQub2soZmFsc2UsIHV0aWwuZm9ybWF0LmFwcGx5KG51bGwsIGFycikpXG4gICAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBub3dcblxuZnVuY3Rpb24gbm93KCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiJdfQ==
