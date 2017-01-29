(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const bot = require('bot');
const bot_console = require('./console');
const ui = require('ui');
const storage = require('libraries/storage');
const ajax = require('libraries/ajax');
const api = require('libraries/blockheads');
const world = require('libraries/world');
const hook = require('libraries/hook');

// Array of IDs to autoload at the next launch.
var autoload = [];
var loaded = [];
const STORAGE_ID = 'mb_extensions';


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
        bot,
        console: bot_console,
        ui,
        storage,
        ajax,
        api,
        world,
        hook,
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
        el.src = `//blockheadsfans.com/messagebot/extension/${id}/code/raw`;
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
storage.getObject(STORAGE_ID, [], false)
    .forEach(MessageBotExtension.install);

module.exports = MessageBotExtension;

},{"./console":7,"bot":3,"libraries/ajax":8,"libraries/blockheads":10,"libraries/hook":11,"libraries/storage":12,"libraries/world":13,"ui":28}],2:[function(require,module,exports){
/**
 * @file Depricated. Use world.is[Group] instead.
 */

module.exports = {
    checkGroup
};

const world = require('libraries/world');


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
const storage = require('libraries/storage');

const bot = Object.assign(
    module.exports,
    require('./send'),
    require('./checkGroup')
);

bot.version = '6.1.0a';

/**
 * @depricated since 6.1.0. Use ex.world instead.
 */
bot.world = require('libraries/world');

storage.set('mb_version', bot.version);

},{"./checkGroup":2,"./send":5,"libraries/storage":12,"libraries/world":13}],4:[function(require,module,exports){
function update(keys, operator) {
    Object.keys(localStorage).forEach(item => {
        for (let key of keys) {
            if (item.startsWith(key)) {
                localStorage.setItem(item, operator(localStorage.getItem(item)));
                break;
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
        update(['announcementArr', 'joinArr', 'leaveArr', 'triggerArr'], function(raw) {
            try {
                var parsed = JSON.parse(raw);
                parsed.forEach(msg => {
                    if (msg.message) {
                        msg.message = msg.message.replace(/\\n/g, '\n');
                    }
                });
                return JSON.stringify(parsed);
            } catch(e) {
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
        update(['joinArr', 'leaveArr', 'triggerArr'], function(raw) {
            try {
                let parsed = JSON.parse(raw);
                parsed.forEach(msg => {
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
var api = require('libraries/blockheads');
var settings = require('settings/bot');

var queue = [];

module.exports = {
    send,
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
        let str = message.split(settings.splitToken);
        let toSend = [];

        for (let i = 0; i < str.length; i++) {
            let curr = str[i];
            if (curr[curr.length - 1] == '\\' && i < str.length + 1) {
                curr += settings.splitToken + str[++i];
            }
            toSend.push(curr);
        }

        toSend.forEach(msg => queue.push(msg));
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

    api.send(queue.shift())
        .catch(console.error)
        .then(() => {
            setTimeout(checkQueue, 1000);
        });
}());

},{"libraries/blockheads":10,"settings/bot":23}],6:[function(require,module,exports){
module.exports = {
    write,
    clear
};

function write(msg, name = '', nameClass = '') {
    var msgEl = document.createElement('li');
    if (nameClass) {
        msgEl.setAttribute('class', nameClass);
    }

    var nameEl = document.createElement('span');
    nameEl.textContent = name;

    var contentEl = document.createElement('span');
    if (name) {
        contentEl.textContent = `: ${msg}`;
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
const self = module.exports = require('./exports');

const hook = require('libraries/hook');
const world = require('libraries/world');
const send = require('bot').send;
const ui = require('ui');



// TODO: Parse these and provide options to show/hide different ones.
hook.on('world.other', function(message) {
    self.write(message, undefined, 'other');
});

hook.on('world.message', function(name, message) {
    let msgClass = 'player';
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

hook.on('world.serverchat', function(message) {
    self.write(message, 'SERVER', 'admin');
});

hook.on('world.send', function(message) {
    if (message.startsWith('/')) {
        self.write(message, 'SERVER', 'admin command');
    }
});

//Message handlers
hook.on('world.join', function handlePlayerJoin(name, ip) {
    self.write(`${name} (${ip}) has joined the server`, 'SERVER', 'join world admin');
});

hook.on('world.leave', function handlePlayerLeave(name) {
    self.write(`${name} has left the server`, 'SERVER', `leave world admin`);
});


var tab = ui.addTab('Console');
// Order is important here.

tab.innerHTML = '<style>' +
    "#mb_console{height:calc(100% - 50px)}#mb_console .mod>span:first-child{color:#05f529}#mb_console .admin>span:first-child{color:#2b26bd}#mb_console .chat{margin:1em;max-height:calc(100vh - 3em - 55px);width:calc(100vw - 2em);overflow-y:auto}#mb_console .chat-control{position:fixed;bottom:0;width:100vw}#mb_console .chat-control .control{margin:1em}\n" +
    '</style>' +
    "<div id=\"mb_console\">\r\n    <div class=\"chat\">\r\n        <ul></ul>\r\n    </div>\r\n    <div class=\"chat-control\">\r\n        <div class=\"control has-addons\">\r\n            <input type=\"text\" class=\"input is-expanded\"/>\r\n            <button class=\"input button is-primary\">SEND</button>\r\n        </div>\r\n    </div>\r\n</div>\r\n";


// Auto scroll when new messages are added to the page, unless the owner is reading old chat.
(new MutationObserver(function showNewChat() {
    let container = tab.querySelector('ul');
    let lastLine = tab.querySelector('li:last-child');

    if (!container || !lastLine) {
        return;
    }

    if (container.scrollHeight - container.clientHeight - container.scrollTop <= lastLine.clientHeight * 2) {
        lastLine.scrollIntoView(false);
    }
})).observe(tab.querySelector('.chat'), {childList: true});


// Remove old chat to reduce memory usage
(new MutationObserver(function removeOldChat() {
    var chat = tab.querySelector('ul');

    while (chat.children.length > 500) {
        chat.children[0].remove();
    }
})).observe(tab.querySelector('.chat'), {childList: true});

// Listen for the user to send messages
function userSend() {
    var input = tab.querySelector('input');
    hook.fire('console.send', input.value);
    send(input.value);
    input.value = '';
    input.focus();
}

tab.querySelector('input').addEventListener('keydown', function(event) {
    if (event.key == "Enter" || event.keyCode == 13) {
        userSend();
    }
});

tab.querySelector('button').addEventListener('click', userSend);

},{"./exports":6,"bot":3,"libraries/hook":11,"libraries/world":13,"ui":28}],8:[function(require,module,exports){
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
function get(url = '/', params = {}) {
    if (Object.keys(params).length) {
        var addition = urlStringify(params);
        if (url.includes('?')) {
            url += `&${addition}`;
        } else {
            url += `?${addition}`;
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
function getJSON(url = '/', paramObj = {}) {
    return get(url, paramObj).then(JSON.parse);
}


/**
 * Function to make a post request
 *
 * @param {string} url
 * @param {object} paramObj
 * @return {Promise}
 */
function post(url = '/', paramObj = {}) {
    return xhr('POST', url, paramObj);
}


/**
 * Function to fetch JSON from a page through post.
 *
 * @param string url
 * @param string paramObj
 * @return Promise
 */
function postJSON(url = '/', paramObj = {}) {
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
function xhr(protocol, url = '/', paramObj = {}) {
    var paramStr = urlStringify(paramObj);
    return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.open(protocol, url);
        req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        if (protocol == 'POST') {
            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }

        req.onload = function() {
            if (req.status == 200) {
                resolve(req.response);
            } else {
                reject(new Error(req.statusText));
            }
        };
        // Handle network errors
        req.onerror = function() {
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
    return Object.keys(obj)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
    .join('&');
}


module.exports = {xhr, get, getJSON, post, postJSON};

},{}],9:[function(require,module,exports){
/**
 * @file Contains functions to interact with blockheadsfans.com - cannot be used by extensions.
 */

const hook = require('libraries/hook');
const ajax = require('libraries/ajax');

const API_URLS = {
    STORE: '//blockheadsfans.com/messagebot/api/extension/store',
    NAME: '//blockheadsfans.com/messagebot/api/extension/name',
    ERROR: '//blockheadsfans.com/messagebot/api/error',
};

var cache = {
    names: new Map(),
};

/**
 * Used to get public extensions
 *
 * @example
 * getStore().then(store => console.log(store));
 * @param {bool} [refresh=false] whether or not to use the cached response should be cleared.
 * @return {Promise} resolves with the response
 */
function getStore(refresh = false) {
    if (refresh || !cache.getStore) {
        cache.getStore = ajax.getJSON(API_URLS.STORE)
            .then(store => {
                //Build the initial names map
                if (store.status != 'ok') {
                    return store;
                }

                for (let ex of store.extensions) {
                    cache.names.set(ex.id, ex.title);
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
 * getExtensionName('test').then(name => console.log(name));
 * @param {string} id the id to search for.
 * @return {Promise} resolves with the extension name.
 */
function getExtensionName(id) {
    if (cache.names.has(id)) {
        return Promise.resolve(cache.names.get(id));
    }

    return ajax.postJSON(API_URLS.NAME, {id}).then(({name}) => {
        cache.names.set(id, name);
        return name;
    }, err => {
        reportError(err);
        return id;
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
            error_stack: err.stack || '',
        })
        .then((resp) => {
            if (resp.status == 'ok') {
                hook.fire('error_report', 'Something went wrong, it has been reported.');
            } else {
                hook.fire('error_report', `Error reporting exception: ${resp.message}`);
            }
        })
        .catch(console.error);
}

module.exports = {
    getStore,
    getExtensionName,
    reportError,
};

},{"libraries/ajax":8,"libraries/hook":11}],10:[function(require,module,exports){
var ajax = require('./ajax');
var hook = require('./hook');
var bhfansapi = require('./bhfansapi');

const worldId = window.worldId;
var cache = {
    firstId: 0,
};

// Used to parse messages more accurately
var world = {
    name: '',
    online: []
};
getOnlinePlayers()
    .then(players => world.players = [...new Set(players.concat(world.players))]);

getWorldName()
    .then(name => world.name = name);


module.exports = {
    worldStarted,
    getLogs,
    getLists,
    getHomepage,
    getOnlinePlayers,
    getOwnerName,
    getWorldName,
    send,
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
function worldStarted(refresh = false) {
    if (refresh || !cache.worldStarted) {
        cache.worldStarted = new Promise(function (resolve, reject) {
            var fails = 0;
            (function check() {
                // Could this be more simplified?
                ajax.postJSON('/api', { command: 'status', worldId }).then(response => {
                    switch (response.worldStatus) {
                        case 'online':
                            return resolve();
                        case 'offline':
                            ajax.postJSON('/api', { command: 'start', worldId })
                                .then(check, check);
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
            }());
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
function getLogs(refresh = false) {
    if (refresh || !cache.getLogs) {
        cache.getLogs = worldStarted()
            .then(() => ajax.get(`/worlds/logs/${worldId}`))
            .then(log => log.split('\n'));
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
function getLists(refresh = false) {
    if (refresh || !cache.getLists) {
        cache.getLists = worldStarted()
            .then(() => ajax.get(`/worlds/lists/${worldId}`))
            .then(html => {
                var doc = (new DOMParser()).parseFromString(html, 'text/html');

                function getList(name) {
                    var list = doc.querySelector(`textarea[name=${name}]`)
                    .value
                    .toLocaleUpperCase()
                    .split('\n');
                    return [...new Set(list)]; //Remove duplicates
                }

                var lists = {
                    admin: getList('admins'),
                    mod: getList('modlist'),
                    white: getList('whitelist'),
                    black: getList('blacklist'),
                };
                lists.mod = lists.mod.filter(name => !lists.admin.includes(name));
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
function getHomepage(refresh = false) {
    if (refresh || !cache.getHomepage) {
        cache.getHomepage = ajax.get(`/worlds/${worldId}`)
            .catch(() => getHomepage(true));
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
function getOnlinePlayers(refresh = false) {
    if (refresh || !cache.getOnlinePlayers) {
        cache.getOnlinePlayers = getHomepage(true)
            .then((html) => {
                var doc = (new DOMParser()).parseFromString(html, 'text/html');
                var playerElems = doc.querySelector('.manager.padded:nth-child(1)')
                    .querySelectorAll('tr:not(.history) > td.left');
                var players = [];

                Array.from(playerElems).forEach((el) => {
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
    return getHomepage().then(html => {
        var doc = (new DOMParser()).parseFromString(html, 'text/html');
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
    return getHomepage().then(html => {
        var doc = (new DOMParser()).parseFromString(html, 'text/html');
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
    return ajax.postJSON(`/api`, {command: 'send', message, worldId})
        .then(resp => {
            if (resp.status != 'ok') {
                throw new Error(resp.message);
            }
            return resp;
        })
        .then(resp => {
            //Handle hooks
            hook.fire('world.send', message);
            hook.fire('world.servermessage', message);

            //Disallow commands starting with space.
            if (message.startsWith('/') && !message.startsWith('/ ')) {
                let command = message.substr(1);

                let args = '';
                if (command.includes(' ')) {
                    command = command.substring(0, command.indexOf(' '));
                    args = message.substring(message.indexOf(' ') + 1);
                }
                hook.check('world.command', 'SERVER', command, args);
            }

            return resp;
        }).catch(err => {
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
    getMessages().then((msgs) => {
        msgs.forEach((message) => {
            if (message.startsWith(`${world.name} - Player Connected `)) {
                let [, name, ip] = message.match(/ - Player Connected (.*) \| ([\d.]+) \| ([\w]{32})\s*$/);
                handleJoinMessages(name, ip);

            } else if (message.startsWith(`${world.name} - Player Disconnected `)) {
                let name = message.substring(world.name.length + 23);
                handleLeaveMessages(name);

            } else if (message.includes(': ')) {
                let name = getUsername(message);
                let msg = message.substring(name.length + 2);
                handleUserMessages(name, msg);

            } else {
                handleOtherMessages(message);

            }
        });
    })
    .catch(bhfansapi.reportError)
    .then(() => {
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
    return worldStarted()
        .then(() => ajax.postJSON(`/api`, { command: 'getchat', worldId, firstId: cache.firstId }))
        .then(data => {
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
    for (let i = 18; i > 4; i--) {
        let possibleName = message.substring(0, message.lastIndexOf(': ', i));
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

        let command = message.substr(1);

        let args = '';
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
function check(key, ...args) {
    key = key.toLocaleLowerCase();
    if (!listeners[key]) {
        return;
    }

    listeners[key].forEach(function(listener) {
        try {
            listener(...args);
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
function update(key, initial, ...args) {
    key = key.toLocaleLowerCase();
    if (!listeners[key]) {
        return initial;
    }

    return listeners[key].reduce(function(previous, current) {
        try {
            var result = current(previous, ...args);
            if (typeof result != 'undefined') {
                return result;
            }
            return previous;
        } catch(e) {
            if (key != 'error') {
                check('error', e);
            }
            return previous;
        }
    }, initial);
}

module.exports = {
    listen,
    on: listen,
    remove,
    check,
    fire: check,
    update,
};

},{}],12:[function(require,module,exports){
module.exports = {
    getString,
    getObject,
    set,
    clearNamespace,
};

//REVIEW: Is there a better way to do this? require('./config') maybe?
const NAMESPACE = window.worldId;

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
function getString(key, fallback, local = true) {
    var result;
    if (local) {
        result = localStorage.getItem(`${key}${NAMESPACE}`);
    } else {
        result = localStorage.getItem(key);
    }

    return (result === null) ? fallback : result;
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
function getObject(key, fallback, local = true) {
    var result = getString(key, false, local);

    if (!result) {
        return fallback;
    }

    try {
        result = JSON.parse(result);
    } catch(e) {
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
function set(key, data, local = true) {
    if (local) {
        key = `${key}${NAMESPACE}`;
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
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(namespace)) {
            localStorage.removeItem(key);
        }
    });
}

},{}],13:[function(require,module,exports){
const api = require('./blockheads');
const storage = require('./storage');
const hook = require('./hook');

const STORAGE = {
    PLAYERS: 'mb_players',
    LOG_LOAD: 'mb_lastLogLoad',
};

var world = module.exports = {
    name: '',
    online: [],
    owner: '',
    players: storage.getObject(STORAGE.PLAYERS, {}),
    lists: {admin: [], mod: [], staff: [], black: [], white: []},
    isPlayer,
    isServer,
    isOwner,
    isAdmin,
    isStaff,
    isMod,
    isOnline,
    getJoins,
};
var lists = world.lists;

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
    return lists.admin.includes(name.toLocaleUpperCase()) || isOwner(name);
}

/**
 * Checks if the player is a mod
 *
 * @param {string} name
 * @return {bool}
 */
function isMod(name) {
    return lists.mod.includes(name.toLocaleUpperCase());
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
hook.on('world.join', function(name) {
    if (!world.online.includes(name)) {
        world.online.push(name);
    }
});
hook.on('world.leave', function(name) {
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
    lists.mod = lists.mod.filter((name) => !lists.admin.includes(name) && name != 'SERVER' && name != world.owner);
    lists.staff = lists.admin.concat(lists.mod);
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
hook.on('world.command', function(name, command, target) {
    if (!permissionCheck(name, command)) {
        return;
    }

    var un = command.startsWith('un');

    var group = {
        admin: 'admin',
        mod: 'mod',
        whitelist: 'white',
        ban: 'black',
    }[un ? command.substr(2) : command];

    if (un && lists[group].includes(target)) {
        lists[group].splice(lists[group].indexOf(target), 1);
        buildStaffList();
    } else if (!un && !lists[group].includes(target)) {
        lists[group].push(target);
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
        world.players[name] = {joins: 1, ips: [ip]};
    }
    world.players[name].ip = ip;

    // Otherwise, we will double parse joins
    storage.set(STORAGE.LOG_LOAD, Math.floor(Date.now().valueOf()));
    storage.set(STORAGE.PLAYERS, world.players);
}


// Update lists
Promise.all([api.getLists(), api.getWorldName(), api.getOwnerName()])
    .then((values) => {
        var [apiLists, worldName, owner] = values;

        world.lists = apiLists;
        buildStaffList();
        world.name = worldName;
        world.owner = owner;
    })
    .catch(console.error);

// Update players since last bot load
Promise.all([api.getLogs(), api.getWorldName()])
    .then((values) => {
        var [lines, worldName] = values;

        var last = storage.getObject(STORAGE.LOG_LOAD, 0);
        storage.set(STORAGE.LOG_LOAD, Math.floor(Date.now().valueOf()));

        for (let line of lines) {
            let time = new Date(line.substring(0, line.indexOf('b')).replace(' ', 'T').replace(' ', 'Z'));
            let message = line.substring(line.indexOf(']') + 2);

            if (time < last) {
                continue;
            }

            if (message.startsWith(`${worldName} - Player Connected `)) {
                let parts = line.substr(line.indexOf(' - Player Connected ') + 20); //NAME | IP | ID
                let [, name, ip] = parts.match(/(.*) \| ([\w.]+) \| .{32}\s*/);

                checkPlayerJoin(name, ip);
            }
        }

        storage.set(STORAGE.PLAYERS, world.players);
    });

},{"./blockheads":10,"./hook":11,"./storage":12}],14:[function(require,module,exports){
const ui = require('ui');
const storage = require('libraries/storage');
const send = require('bot').send;
const preferences = require('settings/bot');


var tab = ui.addTab('Announcements', 'messages');
tab.innerHTML = "<template id=\"aTemplate\">\r\n    <div class=\"column is-full\">\r\n        <div class=\"box\">\r\n            <label>Send:</label>\r\n            <textarea class=\"m\"></textarea>\r\n            <a>Delete</a>\r\n        </div>\r\n        <div>\r\n            Wait X minutes...\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_announcements\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3>These are sent according to a regular schedule.</h3>\r\n        <span>If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span>\r\n    </section>\r\n    <div id=\"aMsgs\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

module.exports = {
    tab,
    save,
    addMessage,
    start: () => announcementCheck(0),
};

function addMessage(text = '') {
    ui.buildContentFromTemplate('#aTemplate', '#aMsgs', [
        {selector: '.m', text: text}
    ]);
}

function save() {
    announcements = Array.from(tab.querySelectorAll('.m'))
        .map(el => {
            return {message: el.value};
        });

    storage.set('announcementArr', announcements);
}

// Announcements collection
var announcements = storage.getObject('announcementArr', []);

// Show saved announcements
announcements
    .map(ann => ann.message)
    .forEach(addMessage);


// Sends announcements after the specified delay.
function announcementCheck(i) {
    i = (i >= announcements.length) ? 0 : i;

    var ann = announcements[i];

    if (ann && ann.message) {
        send(ann.message);
    }
    setTimeout(announcementCheck, preferences.announcementDelay * 60000, i + 1);
}

},{"bot":3,"libraries/storage":12,"settings/bot":23,"ui":28}],15:[function(require,module,exports){
module.exports = {
    buildAndSendMessage,
    buildMessage,
};

const world = require('libraries/world');
const send = require('bot').send;

function buildAndSendMessage(message, name) {
    send(buildMessage(message, name));
}

function buildMessage(message, name) {
    message = message.replace(/{{([^}]+)}}/g, function(full, key) {
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
module.exports = {
    checkJoinsAndGroup,
    checkJoins,
    checkGroup,
};

const world = require('libraries/world');


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
Object.assign(
    module.exports,
    require('./buildMessage'),
    require('./checkJoinsAndGroup'),
    require('./showSummary')
);

},{"./buildMessage":15,"./checkJoinsAndGroup":16,"./showSummary":18}],18:[function(require,module,exports){
module.exports = {
    showSummary
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
        out.textContent = `${group} / not ${not_group} and ${joins_low} ≤ joins ≤ ${joins_high}`;
    } else if (groupsAltered) {
        out.textContent = `${group} / not ${not_group}`;
    } else if (joinsAltered) {
        out.textContent = `${joins_low} ≤ joins ≤ ${joins_high}`;
    } else {
        out.textContent = '';
    }
}

},{}],19:[function(require,module,exports){
const ui = require('ui');

const helpers = require('./helpers');

var el = document.createElement('style');
el.innerHTML = "#mb_join>h3,#mb_leave>h3,#mb_trigger>h3,#mb_announcements>h3{margin:0 0 5px 6em}#mb_join>span,#mb_leave>span,#mb_trigger>span,#mb_announcements>span{margin-left:6em}#mb_join input,#mb_join textarea,#mb_leave input,#mb_leave textarea,#mb_trigger input,#mb_trigger textarea,#mb_announcements input,#mb_announcements textarea{border:2px solid #666;width:100%}#mb_join textarea,#mb_leave textarea,#mb_trigger textarea,#mb_announcements textarea{resize:none;overflow:hidden;padding:1px 0;height:21px;transition:height 0.25s}#mb_join textarea:focus,#mb_leave textarea:focus,#mb_trigger textarea:focus,#mb_announcements textarea:focus{height:5em}#mb_join input[type=\"number\"],#mb_leave input[type=\"number\"],#mb_trigger input[type=\"number\"],#mb_announcements input[type=\"number\"]{width:5em}#jMsgs,#lMsgs,#tMsgs,#aMsgs{border-top:1px solid #000}#jMsgs small,#lMsgs small,#tMsgs small,#aMsgs small{color:#777}\n";
document.head.appendChild(el);

ui.addTabGroup('Messages', 'messages');

[
    require('./join'),
    require('./leave'),
    require('./trigger'),
    require('./announcements')
].forEach(({tab, save, addMessage, start}) => {
    tab.addEventListener('click', function checkDelete(event) {
        if (event.target.tagName != 'A') {
            return;
        }

        ui.alert('Really delete this message?', [
            {text: 'Yes', style: 'danger', action: function() {
                var el = event.target;
                while ((el = el.parentElement) && !el.classList.contains('column'))
                    ;
                el.remove();
                save();
            }},
            {text: 'Cancel'}
        ]);
    });

    tab.addEventListener('change', save);

    tab.querySelector('.button.is-primary')
        .addEventListener('click', () => addMessage());

    // Don't start responding to chat for 10 seconds
    setTimeout(start, 10000);
});

[
    require('./join'),
    require('./leave'),
    require('./trigger')
].forEach(({tab}) => {
    tab.addEventListener('change', function(event) {
        var el = event.target;
        while ((el = el.parentElement) && !el.classList.contains('column'))
            ;

        helpers.showSummary(el);
    });
});

},{"./announcements":14,"./helpers":17,"./join":20,"./leave":21,"./trigger":22,"ui":28}],20:[function(require,module,exports){
const ui = require('ui');

const storage = require('libraries/storage');
const hook = require('libraries/hook');
const helpers = require('messages/helpers');


const STORAGE_ID = 'joinArr';

var tab = ui.addTab('Join', 'messages');
tab.innerHTML = "<template id=\"jTemplate\">\r\n    <div class=\"column is-one-third-desktop is-half-tablet\">\r\n        <div class=\"box\">\r\n            <label> Message: <textarea class=\"m\"></textarea></label>\r\n            <details><summary>More options <small class=\"summary\"></small></summary>\r\n                <label>Player is: <select data-target=\"group\">\r\n                    <option value=\"all\">anyone</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <label>Player is not: <select data-target=\"not_group\">\r\n                    <option value=\"nobody\">nobody</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n                <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n            </details>\r\n            <a>Delete</a>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_join\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3>These are checked when a player joins the server.</h3>\r\n        <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    </section>\r\n    <div id=\"jMsgs\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

module.exports = {
    tab,
    save,
    addMessage,
    start: () => hook.on('world.join', onJoin),
};

var joinMessages = storage.getObject(STORAGE_ID, []);
joinMessages.forEach(addMessage);

Array.from(tab.querySelectorAll('#jMsgs > div'))
    .forEach(helpers.showSummary);

/**
 * Function to add a trigger message to the page.
 */
function addMessage(msg = {}) {
    ui.buildContentFromTemplate('#jTemplate', '#jMsgs', [
        {selector: 'option', remove: ['selected'], multiple: true},
        {selector: '.m', text: msg.message || ''},
        {selector: '[data-target="joins_low"]', value: msg.joins_low || 0},
        {selector: '[data-target="joins_high"]', value: msg.joins_high || 9999},
        {selector: `[data-target="group"] [value="${msg.group || 'all'}"]`, selected: 'selected'},
        {selector: `[data-target="not_group"] [value="${msg.not_group || 'nobody'}"]`, selected: 'selected'}
    ]);
}

/**
 * Function used to save the user's messages.
 */
function save() {
    joinMessages = [];
    Array.from(tab.querySelectorAll('#jMsgs > div')).forEach(container => {
        if (!container.querySelector('.m').value) {
            return;
        }

        joinMessages.push({
            message: container.querySelector('.m').value,
            joins_low: +container.querySelector('[data-target="joins_low"]').value,
            joins_high: +container.querySelector('[data-target="joins_high"]').value,
            group: container.querySelector('[data-target="group"]').value,
            not_group: container.querySelector('[data-target="not_group"]').value,
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
    joinMessages.forEach(msg => {
        if (helpers.checkJoinsAndGroup(name, msg)) {
            helpers.buildAndSendMessage(msg.message, name);
        }
    });
}

},{"libraries/hook":11,"libraries/storage":12,"messages/helpers":17,"ui":28}],21:[function(require,module,exports){
const ui = require('ui');

const storage = require('libraries/storage');
const hook = require('libraries/hook');
const helpers = require('messages/helpers');


const STORAGE_ID = 'leaveArr';

var tab = ui.addTab('Leave', 'messages');
tab.innerHTML = "<template id=\"lTemplate\">\r\n    <div class=\"column is-one-third-desktop is-half-tablet\">\r\n        <div class=\"box\">\r\n            <label>Message <textarea class=\"m\"></textarea></label>\r\n            <details><summary>More options <small class=\"summary\"></small></summary>\r\n                <label>Player is: <select data-target=\"group\">\r\n                    <option value=\"all\">anyone</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <label>Player is not: <select data-target=\"not_group\">\r\n                    <option value=\"nobody\">nobody</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n                <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n            </details>\r\n            <a>Delete</a>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_leave\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3>These are checked when a player leaves the server.</h3>\r\n        <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    </section>\r\n    <div id=\"lMsgs\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

module.exports = {
    tab,
    save,
    addMessage,
    start: () => hook.on('world.leave', onLeave),
};

var leaveMessages = storage.getObject(STORAGE_ID, []);
leaveMessages.forEach(addMessage);

Array.from(tab.querySelectorAll('#lMsgs > div'))
    .forEach(helpers.showSummary);

/**
 * Adds a leave message to the page.
 */
function addMessage(msg = {}) {
    ui.buildContentFromTemplate('#lTemplate', '#lMsgs', [
        {selector: 'option', remove: ['selected'], multiple: true},
        {selector: '.m', text: msg.message || ''},
        {selector: '[data-target="joins_low"]', value: msg.joins_low || 0},
        {selector: '[data-target="joins_high"]', value: msg.joins_high || 9999},
        {selector: `[data-target="group"] [value="${msg.group || 'all'}"]`, selected: 'selected'},
        {selector: `[data-target="not_group"] [value="${msg.not_group || 'nobody'}"]`, selected: 'selected'}
    ]);
}

/**
 * Function used to save the current leave messages
 */
function save() {
    leaveMessages = [];
    Array.from(tab.querySelectorAll('#lMsgs > div')).forEach(container => {
        if (!container.querySelector('.m').value) {
            return;
        }

        leaveMessages.push({
            message: container.querySelector('.m').value,
            joins_low: +container.querySelector('[data-target="joins_low"]').value,
            joins_high: +container.querySelector('[data-target="joins_high"]').value,
            group: container.querySelector('[data-target="group"]').value,
            not_group: container.querySelector('[data-target="not_group"]').value,
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
    leaveMessages.forEach(msg => {
        if (helpers.checkJoinsAndGroup(name, msg)) {
            helpers.buildAndSendMessage(msg.message, name);
        }
    });
}

},{"libraries/hook":11,"libraries/storage":12,"messages/helpers":17,"ui":28}],22:[function(require,module,exports){
const ui = require('ui');

const storage = require('libraries/storage');
const hook = require('libraries/hook');
const helpers = require('messages/helpers');
const settings = require('settings/bot');


const STORAGE_ID = 'triggerArr';

var tab = ui.addTab('Trigger', 'messages');
tab.innerHTML = "<template id=\"tTemplate\">\r\n    <div class=\"column is-one-third-desktop is-half-tablet\">\r\n        <div class=\"box\">\r\n            <label>Trigger: <input class=\"t\"></label>\r\n            <label>Message: <textarea class=\"m\"></textarea></label>\r\n            <details><summary>More options <small class=\"summary\"></small></summary>\r\n                <label>Player is: <select data-target=\"group\">\r\n                    <option value=\"all\">anyone</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <label>Player is not: <select data-target=\"not_group\">\r\n                    <option value=\"nobody\">nobody</option>\r\n                    <option value=\"staff\">a staff member</option>\r\n                    <option value=\"mod\">a mod</option>\r\n                    <option value=\"admin\">an admin</option>\r\n                    <option value=\"owner\">the owner</option>\r\n                </select></label>\r\n                <br>\r\n                <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n                <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n            </details>\r\n            <a>Delete</a>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_trigger\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3>These are checked whenever someone says something.</h3>\r\n        <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger \"te*st\" will match \"tea stuff\" and \"test\")</span>\r\n    </section>\r\n    <div id=\"tMsgs\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

module.exports = {
    tab,
    save,
    addMessage,
    start: () => hook.on('world.message', checkTriggers),
};

var triggerMessages = storage.getObject(STORAGE_ID, []);
triggerMessages.forEach(addMessage);
Array.from(tab.querySelectorAll('#tMsgs > div'))
    .forEach(helpers.showSummary);

/**
 * Adds a trigger message to the page.
 */
function addMessage(msg = {}) {
    ui.buildContentFromTemplate('#tTemplate', '#tMsgs', [
        {selector: 'option', remove: ['selected'], multiple: true},
        {selector: '.m', text: msg.message || ''},
        {selector: '.t', value: msg.trigger || ''},
        {selector: '[data-target="joins_low"]', value: msg.joins_low || 0},
        {selector: '[data-target="joins_high"]', value: msg.joins_high || 9999},
        {selector: `[data-target="group"] [value="${msg.group || 'all'}"]`, selected: 'selected'},
        {selector: `[data-target="not_group"] [value="${msg.not_group || 'nobody'}"]`, selected: 'selected'}
    ]);
}

/**
 * Saves the current trigger messages.
 */
function save() {
    triggerMessages = [];
    Array.from(tab.querySelectorAll('#tMsgs > div')).forEach(container => {
        if (!container.querySelector('.m').value || !container.querySelector('.t').value) {
            return;
        }

        triggerMessages.push({
            message: container.querySelector('.m').value,
            trigger: container.querySelector('.t').value,
            joins_low: +container.querySelector('[data-target="joins_low"]').value,
            joins_high: +container.querySelector('[data-target="joins_high"]').value,
            group: container.querySelector('[data-target="group"]').value,
            not_group: container.querySelector('[data-target="not_group"]').value,
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
            ui.notify(`Skipping trigger '${trigger}' as the RegEx is invaild.`);
            return false;
        }
    }
    return new RegExp(
            trigger
                .replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1")
                .replace(/\*/g, ".*"),
            'i'
        ).test(message);
}

/**
 * Function used to check incoming player messages for triggers
 *
 * @param {string} name the player's name
 * @param {string} message
 */
function checkTriggers(name, message) {
    var totalAllowed = settings.maxResponses;
    triggerMessages.forEach(msg => {
        if (totalAllowed && helpers.checkJoinsAndGroup(name, msg) && triggerMatch(msg.trigger, message)) {
            helpers.buildAndSendMessage(msg.message, name);
            totalAllowed--;
        }
    });
}

},{"libraries/hook":11,"libraries/storage":12,"messages/helpers":17,"settings/bot":23,"ui":28}],23:[function(require,module,exports){
const storage = require('libraries/storage');
const STORAGE_ID = 'mb_preferences';

var prefs = storage.getObject(STORAGE_ID, {}, false);

// Auto save on change
// IE (all) / Safari (< 10) doesn't support proxies
if (typeof Proxy == 'undefined') {
    module.exports = prefs;
    setInterval(function() {
        storage.set(STORAGE_ID, prefs, false);
    }, 30 * 1000);
} else {
    module.exports = prefs = new Proxy(prefs, {
        set: function(obj, prop, val) {
            if (obj.hasOwnProperty(prop)) {
                obj[prop] = val;
                storage.set(STORAGE_ID, prefs, false);
                return true;
            }
            return false;
        }
    });
}

// Set the default settings
[
    {type: 'number', key: 'announcementDelay', default: 10},
    {type: 'number', key: 'maxResponses', default: 2},
    {type: 'boolean', key: 'notify', default: true},
    // Advanced
    {type: 'boolean', key: 'disableTrim', default: false},
    {type: 'boolean', key: 'regexTriggers', default: false},
    {type: 'boolean', key: 'splitMessages', default: false},
    {type: 'text', key: 'splitToken', default: '<split>'},
].forEach(pref => {
    // Set defaults if not set
    if (typeof prefs[pref.key] !=  pref.type) {
        prefs[pref.key] = pref.default;
    }
});

},{"libraries/storage":12}],24:[function(require,module,exports){
const ui = require('ui');
const prefs = require('settings/bot');


var tab = ui.addTab('Bot', 'settings');
tab.innerHTML = "<div id=\"mb_settings\" class=\"container\">\r\n    <h3 class=\"title\">General Settings</h3>\r\n    <label>Minutes between announcements</label>\r\n    <p class=\"control\">\r\n        <input class=\"input\" data-key=\"announcementDelay\" type=\"number\"><br>\r\n    </p>\r\n    <label>Maximum trigger responses to a message</label>\r\n    <p class=\"control\">\r\n        <input class=\"input\" data-key=\"maxResponses\" type=\"number\">\r\n    </p>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input data-key=\"notify\" type=\"checkbox\">\r\n            New chat notifications\r\n        </label>\r\n    </p>\r\n\r\n    <hr>\r\n\r\n    <h3 class=\"title\">Advanced Settings</h3>\r\n    <div class=\"message is-warning\">\r\n        <div class=\"message-header\">\r\n            <p>Warning</p>\r\n        </div>\r\n        <div class=\"message-body\">\r\n            <p>Changing these options can result in unexpected behavior. <a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/1.-Advanced-Options/\" target=\"_blank\">Read this first</a></p>\r\n        </div>\r\n    </div>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input data-key=\"regexTriggers\" type=\"checkbox\">\r\n            Parse triggers as RegEx\r\n        </label>\r\n    </p>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input data-key=\"disableTrim\" type=\"checkbox\">\r\n            Disable whitespace trimming\r\n        </label>\r\n    </p>\r\n    <p class=\"control\">\r\n        <label class=\"checkbox\">\r\n            <input data-key=\"splitMessages\" type=\"checkbox\">\r\n            Split messages\r\n        </label>\r\n    </p>\r\n    <label class=\"label\">Split token:</label>\r\n    <p class=\"control\">\r\n        <input class=\"input\" data-key=\"splitToken\" type=\"text\">\r\n    </p>\r\n\r\n    <hr>\r\n\r\n    <h3 class=\"title\">Backup / Restore</h3>\r\n    <a class=\"button\" id=\"mb_backup_save\">Get backup code</a>\r\n    <a class=\"button\" id=\"mb_backup_load\">Import backup</a>\r\n</div>\r\n";

// Show prefs
Object.keys(prefs).forEach(key => {
    var el = tab.querySelector(`[data-key="${key}"]`);
    switch (typeof prefs[key]) {
        case 'boolean':
            el.checked = prefs[key];
            break;
        default:
            el.value = prefs[key];
    }
});


// Watch for changes
tab.addEventListener('change', function save() {
    var getValue = (key) => tab.querySelector(`[data-key="${key}"]`).value;
    var getInt = (key) => +getValue(key);
    var getChecked = (key) => tab.querySelector(`[data-key="${key}"]`).checked;

    Object.keys(prefs).forEach(key => {
        var func;

        switch(typeof prefs[key]) {
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
    ui.alert(`Copy this to a safe place:<br><textarea class="textarea">${backup}</textarea>`);
});


// Load backup
tab.querySelector('#mb_backup_load').addEventListener('click', function loadBackup() {
    ui.alert('Enter the backup code:<textarea class="textarea"></textarea>',
                [
                    { text: 'Load & refresh page', style: 'success', action: function() {
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

                        Object.keys(code).forEach((key) => {
                            localStorage.setItem(key, code[key]);
                        });

                        location.reload();
                    } },
                    { text: 'Cancel' }
                ]);
});

},{"settings/bot":23,"ui":28}],25:[function(require,module,exports){
const bhfansapi = require('libraries/bhfansapi');
const ui = require('ui');
const hook = require('libraries/hook');
const MessageBotExtension = require('MessageBotExtension');


var tab = ui.addTab('Extensions', 'settings');
tab.innerHTML = '<style>' +
    "@keyframes spinAround{from{transform:rotate(0deg)}to{transform:rotate(359deg)}}#exts{border-top:1px solid #000}@media screen and (min-width: 769px){#exts .card-content{height:105px}}\n" +
    '</style>' +
    "<template id=\"extTemplate\">\r\n    <div class=\"column is-one-third-desktop is-half-tablet\">\r\n        <div class=\"card\">\r\n            <header class=\"card-header\">\r\n                <p class=\"card-header-title\"></p>\r\n            </header>\r\n            <div class=\"card-content\">\r\n                <span class=\"content\"></span>\r\n            </div>\r\n            <div class=\"card-footer\">\r\n                <a class=\"card-footer-item\">Install</a>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div id=\"mb_extensions\" class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">Load By ID/URL</span>\r\n        <h3>Extensions can increase the functionality of the bot.</h3>\r\n        <span>Interested in creating one? <a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/2.-Development:-Start-Here\" target=\"_blank\">Start here.</a></span>\r\n    </section>\r\n    <div id=\"exts\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

//Create the extension store page
bhfansapi.getStore().then(resp => {
    if (resp.status != 'ok') {
        document.getElementById('exts').innerHTML += resp.message;
        throw new Error(resp.message);
    }
    resp.extensions.forEach(extension => {
        ui.buildContentFromTemplate('#extTemplate', '#exts', [
            {selector: '.card-header-title', text: extension.title},
            {selector: '.content', html: extension.snippet},
            {
                selector: '.card-footer-item',
                text: MessageBotExtension.isLoaded(extension.id) ? 'Remove' : 'Install',
                'data-id': extension.id
            }
        ]);
    });
}).catch(bhfansapi.reportError);

// Install / uninstall extensions
document.querySelector('#exts')
    .addEventListener('click', function extActions(e) {
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


hook.on('extension.install', function(id) {
    // Show remove to let users remove extensions
    var button = document.querySelector(`#mb_extensions [data-id="${id}"]`);
    if (button) {
        button.textContent = 'Remove';
    }
});

hook.on('extension.uninstall', function(id) {
    // Show removed for store install button
    var button = document.querySelector(`#mb_extensions [data-id="${id}"]`);
    if (button) {
        button.textContent = 'Removed';
        button.disabled = true;
        setTimeout(() => {
            button.textContent = 'Install';
            button.disabled = false;
        }, 3000);
    }
});

},{"MessageBotExtension":1,"libraries/bhfansapi":9,"libraries/hook":11,"ui":28}],26:[function(require,module,exports){
const ui = require('ui');
ui.addTabGroup('Settings', 'settings');

require('./bot/page');
require('./extensions');

},{"./bot/page":24,"./extensions":25,"ui":28}],27:[function(require,module,exports){
// Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

// Overwrite the old page
document.body.innerHTML = '';
// Style reset
Array.from(document.querySelectorAll('[type="text/css"]'))
    .forEach(el => el.remove());

document.querySelector('title').textContent = 'Console - MessageBot';

// Set the icon to the blockhead icon used on the forums
var el = document.createElement('link');
el.rel = 'icon';
el.href = 'https://is.gd/MBvUHF';
document.head.appendChild(el);

require('console-browserify');
require('bot/migration');

const bhfansapi = require('libraries/bhfansapi');
const hook = require('libraries/hook');
const ui = require('ui');
hook.on('error_report', function(msg) {
    ui.notify(msg);
});

// just require(console) doesn't work as console is a browserify module.
require('./console');
// By default no tab is selected, show the console.
document.querySelector('.nav-slider-container span').click();
require('messages');
require('settings');

// Error reporting
window.addEventListener('error', (err) => {
    if (!['Script error', 'World not running'].includes(err.message)) {
        bhfansapi.reportError(err);
    }
});

// Expose the extension API
window.MessageBotExtension = require('MessageBotExtension');

},{"./console":7,"MessageBotExtension":1,"bot/migration":4,"console-browserify":37,"libraries/bhfansapi":9,"libraries/hook":11,"messages":19,"settings":26,"ui":28}],28:[function(require,module,exports){
require('./polyfills/details');

// Build the API
Object.assign(
    module.exports,
    require('./layout'),
    require('./template'),
    require('./notifications')
);

// Functions which are no longer contained in this module, but are retained for now for backward compatability.
const write = require('../console/exports').write;
module.exports.addMessageToConsole = function(msg, name = '', nameClass = '') {
    console.warn('ui.addMessageToConsole has been depricated. Use ex.console.write instead.');
    write(msg, name, nameClass);
};

},{"../console/exports":6,"./layout":29,"./notifications":31,"./polyfills/details":33,"./template":35}],29:[function(require,module,exports){
/**
 * @file Contains functions for managing the page layout
 */


const hook = require('libraries/hook');

// Build page - only case in which body.innerHTML should be used.
document.body.innerHTML += "<header class=\"header is-fixed-top\">\r\n  <nav class=\"nav-inverse nav has-shadow\">\r\n    <div class=\"nav-left\">\r\n      <div class=\"nav-item nav-slider-toggle\">\r\n        <img src=\"https://i.imgsafe.org/80a1129a36.png\">\r\n      </div>\r\n      <a class=\"nav-item is-tab nav-slider-toggle\">\r\n        Menu\r\n      </a>\r\n    </div>\r\n  </nav>\r\n</header>\r\n\r\n<div class=\"nav-slider-container\">\r\n    <nav class=\"nav-slider\" data-tab-group=\"main\"></nav>\r\n    <div class=\"is-overlay\"></div>\r\n</div>\r\n\r\n<div id=\"container\" class=\"has-fixed-nav\"></div>\r\n";
document.head.innerHTML += '<style>' +
    "html{overflow-y:auto !important}/*! bulma.io v0.3.1 | MIT License | github.com/jgthms/bulma */@keyframes spinAround{from{transform:rotate(0deg)}to{transform:rotate(359deg)}}/*! minireset.css v0.0.2 | MIT License | github.com/jgthms/minireset.css */html,body,p,ol,ul,li,dl,dt,dd,blockquote,figure,fieldset,legend,textarea,pre,iframe,hr,h1,h2,h3,h4,h5,h6{margin:0;padding:0}h1,h2,h3,h4,h5,h6{font-size:100%;font-weight:normal}ul{list-style:none}button,input,select,textarea{margin:0}html{box-sizing:border-box}*{box-sizing:inherit}*:before,*:after{box-sizing:inherit}img,embed,object,audio,video{height:auto;max-width:100%}iframe{border:0}table{border-collapse:collapse;border-spacing:0}td,th{padding:0;text-align:left}html{background-color:#fff;font-size:14px;-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;min-width:300px;overflow-x:hidden;overflow-y:scroll;text-rendering:optimizeLegibility}article,aside,figure,footer,header,hgroup,section{display:block}body,button,input,select,textarea{font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",\"Roboto\",\"Oxygen\",\"Ubuntu\",\"Cantarell\",\"Fira Sans\",\"Droid Sans\",\"Helvetica Neue\",\"Helvetica\",\"Arial\",sans-serif}code,pre{-moz-osx-font-smoothing:auto;-webkit-font-smoothing:auto;font-family:\"Inconsolata\",\"Consolas\",\"Monaco\",monospace}body{color:#4a4a4a;font-size:1rem;font-weight:400;line-height:1.5}a{color:#182b73;cursor:pointer;text-decoration:none;transition:none 86ms ease-out}a:hover{color:#363636}code{background-color:#f5f5f5;color:red;font-size:0.8em;font-weight:normal;padding:0.25em 0.5em 0.25em}hr{background-color:#dbdbdb;border:none;display:block;height:1px;margin:1.5rem 0}img{max-width:100%}input[type=\"checkbox\"],input[type=\"radio\"]{vertical-align:baseline}small{font-size:0.8em}span{font-style:inherit;font-weight:inherit}strong{color:#363636;font-weight:700}pre{background-color:#f5f5f5;color:#4a4a4a;font-size:0.8em;white-space:pre;word-wrap:normal}pre code{background:none;color:inherit;display:block;font-size:1em;overflow-x:auto;padding:1.25rem 1.5rem}table{width:100%}table td,table th{text-align:left;vertical-align:top}table th{color:#363636}.is-block{display:block}@media screen and (max-width: 768px){.is-block-mobile{display:block !important}}@media screen and (min-width: 769px){.is-block-tablet{display:block !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-block-tablet-only{display:block !important}}@media screen and (max-width: 999px){.is-block-touch{display:block !important}}@media screen and (min-width: 1000px){.is-block-desktop{display:block !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-block-desktop-only{display:block !important}}@media screen and (min-width: 1192px){.is-block-widescreen{display:block !important}}.is-flex{display:flex}@media screen and (max-width: 768px){.is-flex-mobile{display:flex !important}}@media screen and (min-width: 769px){.is-flex-tablet{display:flex !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-flex-tablet-only{display:flex !important}}@media screen and (max-width: 999px){.is-flex-touch{display:flex !important}}@media screen and (min-width: 1000px){.is-flex-desktop{display:flex !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-flex-desktop-only{display:flex !important}}@media screen and (min-width: 1192px){.is-flex-widescreen{display:flex !important}}.is-inline{display:inline}@media screen and (max-width: 768px){.is-inline-mobile{display:inline !important}}@media screen and (min-width: 769px){.is-inline-tablet{display:inline !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-tablet-only{display:inline !important}}@media screen and (max-width: 999px){.is-inline-touch{display:inline !important}}@media screen and (min-width: 1000px){.is-inline-desktop{display:inline !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-desktop-only{display:inline !important}}@media screen and (min-width: 1192px){.is-inline-widescreen{display:inline !important}}.is-inline-block{display:inline-block}@media screen and (max-width: 768px){.is-inline-block-mobile{display:inline-block !important}}@media screen and (min-width: 769px){.is-inline-block-tablet{display:inline-block !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-block-tablet-only{display:inline-block !important}}@media screen and (max-width: 999px){.is-inline-block-touch{display:inline-block !important}}@media screen and (min-width: 1000px){.is-inline-block-desktop{display:inline-block !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-block-desktop-only{display:inline-block !important}}@media screen and (min-width: 1192px){.is-inline-block-widescreen{display:inline-block !important}}.is-inline-flex{display:inline-flex}@media screen and (max-width: 768px){.is-inline-flex-mobile{display:inline-flex !important}}@media screen and (min-width: 769px){.is-inline-flex-tablet{display:inline-flex !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-flex-tablet-only{display:inline-flex !important}}@media screen and (max-width: 999px){.is-inline-flex-touch{display:inline-flex !important}}@media screen and (min-width: 1000px){.is-inline-flex-desktop{display:inline-flex !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-flex-desktop-only{display:inline-flex !important}}@media screen and (min-width: 1192px){.is-inline-flex-widescreen{display:inline-flex !important}}.is-clearfix:after{clear:both;content:\" \";display:table}.is-pulled-left{float:left}.is-pulled-right{float:right}.is-clipped{overflow:hidden !important}.is-overlay{bottom:0;left:0;position:absolute;right:0;top:0}.has-text-centered{text-align:center}.has-text-left{text-align:left}.has-text-right{text-align:right}.is-hidden{display:none !important}@media screen and (max-width: 768px){.is-hidden-mobile{display:none !important}}@media screen and (min-width: 769px){.is-hidden-tablet{display:none !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-hidden-tablet-only{display:none !important}}@media screen and (max-width: 999px){.is-hidden-touch{display:none !important}}@media screen and (min-width: 1000px){.is-hidden-desktop{display:none !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-hidden-desktop-only{display:none !important}}@media screen and (min-width: 1192px){.is-hidden-widescreen{display:none !important}}.is-disabled{pointer-events:none}.is-marginless{margin:0 !important}.is-paddingless{padding:0 !important}.is-unselectable{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.box{background-color:#fff;border-radius:5px;box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px rgba(10,10,10,0.1);display:block;padding:1.25rem}.box:not(:last-child){margin-bottom:1.5rem}a.box:hover,a.box:focus{box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px #182b73}a.box:active{box-shadow:inset 0 1px 2px rgba(10,10,10,0.2),0 0 0 1px #182b73}.button{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-color:#fff;border:1px solid #dbdbdb;color:#363636;cursor:pointer;justify-content:center;padding-left:0.75em;padding-right:0.75em;text-align:center;white-space:nowrap}.button:focus,.button.is-focused,.button:active,.button.is-active{outline:none}.button[disabled],.button.is-disabled{pointer-events:none}.button strong{color:inherit}.button .icon:first-child:not(:last-child){margin-left:-.25rem;margin-right:.5rem}.button .icon:last-child:not(:first-child){margin-left:.5rem;margin-right:-.25rem}.button .icon:first-child:last-child{margin-left:calc(-1px + -.25rem);margin-right:calc(-1px + -.25rem)}.button .icon.is-small:first-child:not(:last-child){margin-left:0rem}.button .icon.is-small:last-child:not(:first-child){margin-right:0rem}.button .icon.is-small:first-child:last-child{margin-left:calc(-1px + 0rem);margin-right:calc(-1px + 0rem)}.button .icon.is-medium:first-child:not(:last-child){margin-left:-.5rem}.button .icon.is-medium:last-child:not(:first-child){margin-right:-.5rem}.button .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.5rem);margin-right:calc(-1px + -.5rem)}.button .icon.is-large:first-child:not(:last-child){margin-left:-1rem}.button .icon.is-large:last-child:not(:first-child){margin-right:-1rem}.button .icon.is-large:first-child:last-child{margin-left:calc(-1px + -1rem);margin-right:calc(-1px + -1rem)}.button:hover,.button.is-hovered{border-color:#b5b5b5;color:#363636}.button:focus,.button.is-focused{border-color:#182b73;box-shadow:0 0 0.5em rgba(24,43,115,0.25);color:#363636}.button:active,.button.is-active{border-color:#4a4a4a;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#363636}.button.is-link{background-color:transparent;border-color:transparent;color:#4a4a4a;text-decoration:underline}.button.is-link:hover,.button.is-link.is-hovered,.button.is-link:focus,.button.is-link.is-focused,.button.is-link:active,.button.is-link.is-active{background-color:#f5f5f5;color:#363636}.button.is-white{background-color:#fff;border-color:transparent;color:#0a0a0a}.button.is-white:hover,.button.is-white.is-hovered{background-color:#f9f9f9;border-color:transparent;color:#0a0a0a}.button.is-white:focus,.button.is-white.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,255,255,0.25);color:#0a0a0a}.button.is-white:active,.button.is-white.is-active{background-color:#f2f2f2;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#0a0a0a}.button.is-white.is-inverted{background-color:#0a0a0a;color:#fff}.button.is-white.is-inverted:hover{background-color:#000}.button.is-white.is-loading:after{border-color:transparent transparent #0a0a0a #0a0a0a !important}.button.is-white.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-white.is-outlined:hover,.button.is-white.is-outlined:focus{background-color:#fff;border-color:#fff;color:#0a0a0a}.button.is-white.is-inverted.is-outlined{background-color:transparent;border-color:#0a0a0a;color:#0a0a0a}.button.is-white.is-inverted.is-outlined:hover,.button.is-white.is-inverted.is-outlined:focus{background-color:#0a0a0a;color:#fff}.button.is-black{background-color:#0a0a0a;border-color:transparent;color:#fff}.button.is-black:hover,.button.is-black.is-hovered{background-color:#040404;border-color:transparent;color:#fff}.button.is-black:focus,.button.is-black.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(10,10,10,0.25);color:#fff}.button.is-black:active,.button.is-black.is-active{background-color:#000;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-black.is-inverted{background-color:#fff;color:#0a0a0a}.button.is-black.is-inverted:hover{background-color:#f2f2f2}.button.is-black.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-black.is-outlined{background-color:transparent;border-color:#0a0a0a;color:#0a0a0a}.button.is-black.is-outlined:hover,.button.is-black.is-outlined:focus{background-color:#0a0a0a;border-color:#0a0a0a;color:#fff}.button.is-black.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-black.is-inverted.is-outlined:hover,.button.is-black.is-inverted.is-outlined:focus{background-color:#fff;color:#0a0a0a}.button.is-light{background-color:#f5f5f5;border-color:transparent;color:#363636}.button.is-light:hover,.button.is-light.is-hovered{background-color:#eee;border-color:transparent;color:#363636}.button.is-light:focus,.button.is-light.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(245,245,245,0.25);color:#363636}.button.is-light:active,.button.is-light.is-active{background-color:#e8e8e8;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#363636}.button.is-light.is-inverted{background-color:#363636;color:#f5f5f5}.button.is-light.is-inverted:hover{background-color:#292929}.button.is-light.is-loading:after{border-color:transparent transparent #363636 #363636 !important}.button.is-light.is-outlined{background-color:transparent;border-color:#f5f5f5;color:#f5f5f5}.button.is-light.is-outlined:hover,.button.is-light.is-outlined:focus{background-color:#f5f5f5;border-color:#f5f5f5;color:#363636}.button.is-light.is-inverted.is-outlined{background-color:transparent;border-color:#363636;color:#363636}.button.is-light.is-inverted.is-outlined:hover,.button.is-light.is-inverted.is-outlined:focus{background-color:#363636;color:#f5f5f5}.button.is-dark{background-color:#363636;border-color:transparent;color:#f5f5f5}.button.is-dark:hover,.button.is-dark.is-hovered{background-color:#2f2f2f;border-color:transparent;color:#f5f5f5}.button.is-dark:focus,.button.is-dark.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(54,54,54,0.25);color:#f5f5f5}.button.is-dark:active,.button.is-dark.is-active{background-color:#292929;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#f5f5f5}.button.is-dark.is-inverted{background-color:#f5f5f5;color:#363636}.button.is-dark.is-inverted:hover{background-color:#e8e8e8}.button.is-dark.is-loading:after{border-color:transparent transparent #f5f5f5 #f5f5f5 !important}.button.is-dark.is-outlined{background-color:transparent;border-color:#363636;color:#363636}.button.is-dark.is-outlined:hover,.button.is-dark.is-outlined:focus{background-color:#363636;border-color:#363636;color:#f5f5f5}.button.is-dark.is-inverted.is-outlined{background-color:transparent;border-color:#f5f5f5;color:#f5f5f5}.button.is-dark.is-inverted.is-outlined:hover,.button.is-dark.is-inverted.is-outlined:focus{background-color:#f5f5f5;color:#363636}.button.is-primary{background-color:#182b73;border-color:transparent;color:#fff}.button.is-primary:hover,.button.is-primary.is-hovered{background-color:#162768;border-color:transparent;color:#fff}.button.is-primary:focus,.button.is-primary.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(24,43,115,0.25);color:#fff}.button.is-primary:active,.button.is-primary.is-active{background-color:#14235e;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-primary.is-inverted{background-color:#fff;color:#182b73}.button.is-primary.is-inverted:hover{background-color:#f2f2f2}.button.is-primary.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-primary.is-outlined{background-color:transparent;border-color:#182b73;color:#182b73}.button.is-primary.is-outlined:hover,.button.is-primary.is-outlined:focus{background-color:#182b73;border-color:#182b73;color:#fff}.button.is-primary.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-primary.is-inverted.is-outlined:hover,.button.is-primary.is-inverted.is-outlined:focus{background-color:#fff;color:#182b73}.button.is-info{background-color:#3273dc;border-color:transparent;color:#fff}.button.is-info:hover,.button.is-info.is-hovered{background-color:#276cda;border-color:transparent;color:#fff}.button.is-info:focus,.button.is-info.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(50,115,220,0.25);color:#fff}.button.is-info:active,.button.is-info.is-active{background-color:#2366d1;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-info.is-inverted{background-color:#fff;color:#3273dc}.button.is-info.is-inverted:hover{background-color:#f2f2f2}.button.is-info.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-info.is-outlined{background-color:transparent;border-color:#3273dc;color:#3273dc}.button.is-info.is-outlined:hover,.button.is-info.is-outlined:focus{background-color:#3273dc;border-color:#3273dc;color:#fff}.button.is-info.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-info.is-inverted.is-outlined:hover,.button.is-info.is-inverted.is-outlined:focus{background-color:#fff;color:#3273dc}.button.is-success{background-color:#23d160;border-color:transparent;color:#fff}.button.is-success:hover,.button.is-success.is-hovered{background-color:#22c65b;border-color:transparent;color:#fff}.button.is-success:focus,.button.is-success.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(35,209,96,0.25);color:#fff}.button.is-success:active,.button.is-success.is-active{background-color:#20bc56;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-success.is-inverted{background-color:#fff;color:#23d160}.button.is-success.is-inverted:hover{background-color:#f2f2f2}.button.is-success.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-success.is-outlined{background-color:transparent;border-color:#23d160;color:#23d160}.button.is-success.is-outlined:hover,.button.is-success.is-outlined:focus{background-color:#23d160;border-color:#23d160;color:#fff}.button.is-success.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-success.is-inverted.is-outlined:hover,.button.is-success.is-inverted.is-outlined:focus{background-color:#fff;color:#23d160}.button.is-warning{background-color:#ffdd57;border-color:transparent;color:rgba(0,0,0,0.7)}.button.is-warning:hover,.button.is-warning.is-hovered{background-color:#ffdb4a;border-color:transparent;color:rgba(0,0,0,0.7)}.button.is-warning:focus,.button.is-warning.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,221,87,0.25);color:rgba(0,0,0,0.7)}.button.is-warning:active,.button.is-warning.is-active{background-color:#ffd83d;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted{background-color:rgba(0,0,0,0.7);color:#ffdd57}.button.is-warning.is-inverted:hover{background-color:rgba(0,0,0,0.7)}.button.is-warning.is-loading:after{border-color:transparent transparent rgba(0,0,0,0.7) rgba(0,0,0,0.7) !important}.button.is-warning.is-outlined{background-color:transparent;border-color:#ffdd57;color:#ffdd57}.button.is-warning.is-outlined:hover,.button.is-warning.is-outlined:focus{background-color:#ffdd57;border-color:#ffdd57;color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted.is-outlined{background-color:transparent;border-color:rgba(0,0,0,0.7);color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted.is-outlined:hover,.button.is-warning.is-inverted.is-outlined:focus{background-color:rgba(0,0,0,0.7);color:#ffdd57}.button.is-danger{background-color:red;border-color:transparent;color:#fff}.button.is-danger:hover,.button.is-danger.is-hovered{background-color:#f20000;border-color:transparent;color:#fff}.button.is-danger:focus,.button.is-danger.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,0,0,0.25);color:#fff}.button.is-danger:active,.button.is-danger.is-active{background-color:#e60000;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-danger.is-inverted{background-color:#fff;color:red}.button.is-danger.is-inverted:hover{background-color:#f2f2f2}.button.is-danger.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-danger.is-outlined{background-color:transparent;border-color:red;color:red}.button.is-danger.is-outlined:hover,.button.is-danger.is-outlined:focus{background-color:red;border-color:red;color:#fff}.button.is-danger.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-danger.is-inverted.is-outlined:hover,.button.is-danger.is-inverted.is-outlined:focus{background-color:#fff;color:red}.button.is-small{border-radius:2px;font-size:.75rem}.button.is-small .icon:first-child:not(:last-child){margin-left:-.375rem;margin-right:.375rem}.button.is-small .icon:last-child:not(:first-child){margin-left:.375rem;margin-right:-.375rem}.button.is-small .icon:first-child:last-child{margin-left:calc(-1px + -.375rem);margin-right:calc(-1px + -.375rem)}.button.is-small .icon.is-small:first-child:not(:last-child){margin-left:-.125rem}.button.is-small .icon.is-small:last-child:not(:first-child){margin-right:-.125rem}.button.is-small .icon.is-small:first-child:last-child{margin-left:calc(-1px + -.125rem);margin-right:calc(-1px + -.125rem)}.button.is-small .icon.is-medium:first-child:not(:last-child){margin-left:-.625rem}.button.is-small .icon.is-medium:last-child:not(:first-child){margin-right:-.625rem}.button.is-small .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.625rem);margin-right:calc(-1px + -.625rem)}.button.is-small .icon.is-large:first-child:not(:last-child){margin-left:-1.125rem}.button.is-small .icon.is-large:last-child:not(:first-child){margin-right:-1.125rem}.button.is-small .icon.is-large:first-child:last-child{margin-left:calc(-1px + -1.125rem);margin-right:calc(-1px + -1.125rem)}.button.is-medium{font-size:1.25rem}.button.is-medium .icon:first-child:not(:last-child){margin-left:-.125rem;margin-right:.625rem}.button.is-medium .icon:last-child:not(:first-child){margin-left:.625rem;margin-right:-.125rem}.button.is-medium .icon:first-child:last-child{margin-left:calc(-1px + -.125rem);margin-right:calc(-1px + -.125rem)}.button.is-medium .icon.is-small:first-child:not(:last-child){margin-left:.125rem}.button.is-medium .icon.is-small:last-child:not(:first-child){margin-right:.125rem}.button.is-medium .icon.is-small:first-child:last-child{margin-left:calc(-1px + .125rem);margin-right:calc(-1px + .125rem)}.button.is-medium .icon.is-medium:first-child:not(:last-child){margin-left:-.375rem}.button.is-medium .icon.is-medium:last-child:not(:first-child){margin-right:-.375rem}.button.is-medium .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.375rem);margin-right:calc(-1px + -.375rem)}.button.is-medium .icon.is-large:first-child:not(:last-child){margin-left:-.875rem}.button.is-medium .icon.is-large:last-child:not(:first-child){margin-right:-.875rem}.button.is-medium .icon.is-large:first-child:last-child{margin-left:calc(-1px + -.875rem);margin-right:calc(-1px + -.875rem)}.button.is-large{font-size:1.5rem}.button.is-large .icon:first-child:not(:last-child){margin-left:0rem;margin-right:.75rem}.button.is-large .icon:last-child:not(:first-child){margin-left:.75rem;margin-right:0rem}.button.is-large .icon:first-child:last-child{margin-left:calc(-1px + 0rem);margin-right:calc(-1px + 0rem)}.button.is-large .icon.is-small:first-child:not(:last-child){margin-left:.25rem}.button.is-large .icon.is-small:last-child:not(:first-child){margin-right:.25rem}.button.is-large .icon.is-small:first-child:last-child{margin-left:calc(-1px + .25rem);margin-right:calc(-1px + .25rem)}.button.is-large .icon.is-medium:first-child:not(:last-child){margin-left:-.25rem}.button.is-large .icon.is-medium:last-child:not(:first-child){margin-right:-.25rem}.button.is-large .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.25rem);margin-right:calc(-1px + -.25rem)}.button.is-large .icon.is-large:first-child:not(:last-child){margin-left:-.75rem}.button.is-large .icon.is-large:last-child:not(:first-child){margin-right:-.75rem}.button.is-large .icon.is-large:first-child:last-child{margin-left:calc(-1px + -.75rem);margin-right:calc(-1px + -.75rem)}.button[disabled],.button.is-disabled{opacity:0.5}.button.is-fullwidth{display:flex;width:100%}.button.is-loading{color:transparent !important;pointer-events:none}.button.is-loading:after{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1rem;position:relative;width:1rem;left:50%;margin-left:-8px;margin-top:-8px;position:absolute;top:50%;position:absolute !important}.content{color:#4a4a4a}.content:not(:last-child){margin-bottom:1.5rem}.content li+li{margin-top:0.25em}.content p:not(:last-child),.content ol:not(:last-child),.content ul:not(:last-child),.content blockquote:not(:last-child),.content table:not(:last-child){margin-bottom:1em}.content h1,.content h2,.content h3,.content h4,.content h5,.content h6{color:#363636;font-weight:400;line-height:1.125}.content h1{font-size:2em;margin-bottom:0.5em}.content h1:not(:first-child){margin-top:1em}.content h2{font-size:1.75em;margin-bottom:0.5714em}.content h2:not(:first-child){margin-top:1.1428em}.content h3{font-size:1.5em;margin-bottom:0.6666em}.content h3:not(:first-child){margin-top:1.3333em}.content h4{font-size:1.25em;margin-bottom:0.8em}.content h5{font-size:1.125em;margin-bottom:0.8888em}.content h6{font-size:1em;margin-bottom:1em}.content blockquote{background-color:#f5f5f5;border-left:5px solid #dbdbdb;padding:1.25em 1.5em}.content ol{list-style:decimal outside;margin-left:2em;margin-right:2em;margin-top:1em}.content ul{list-style:disc outside;margin-left:2em;margin-right:2em;margin-top:1em}.content ul ul{list-style-type:circle;margin-top:0.5em}.content ul ul ul{list-style-type:square}.content table{width:100%}.content table td,.content table th{border:1px solid #dbdbdb;border-width:0 0 1px;padding:0.5em 0.75em;vertical-align:top}.content table th{color:#363636;text-align:left}.content table tr:hover{background-color:#f5f5f5}.content table thead td,.content table thead th{border-width:0 0 2px;color:#363636}.content table tfoot td,.content table tfoot th{border-width:2px 0 0;color:#363636}.content table tbody tr:last-child td,.content table tbody tr:last-child th{border-bottom-width:0}.content.is-small{font-size:.75rem}.content.is-medium{font-size:1.25rem}.content.is-large{font-size:1.5rem}.input,.textarea{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;background-color:#fff;border:1px solid #dbdbdb;color:#363636;box-shadow:inset 0 1px 2px rgba(10,10,10,0.1);max-width:100%;width:100%}.input:focus,.input.is-focused,.input:active,.input.is-active,.textarea:focus,.textarea.is-focused,.textarea:active,.textarea.is-active{outline:none}.input[disabled],.input.is-disabled,.textarea[disabled],.textarea.is-disabled{pointer-events:none}.input:hover,.input.is-hovered,.textarea:hover,.textarea.is-hovered{border-color:#b5b5b5}.input:focus,.input.is-focused,.input:active,.input.is-active,.textarea:focus,.textarea.is-focused,.textarea:active,.textarea.is-active{border-color:#182b73}.input[disabled],.input.is-disabled,.textarea[disabled],.textarea.is-disabled{background-color:#f5f5f5;border-color:#f5f5f5;box-shadow:none;color:#7a7a7a}.input[disabled]::-moz-placeholder,.input.is-disabled::-moz-placeholder,.textarea[disabled]::-moz-placeholder,.textarea.is-disabled::-moz-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]::-webkit-input-placeholder,.input.is-disabled::-webkit-input-placeholder,.textarea[disabled]::-webkit-input-placeholder,.textarea.is-disabled::-webkit-input-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]:-moz-placeholder,.input.is-disabled:-moz-placeholder,.textarea[disabled]:-moz-placeholder,.textarea.is-disabled:-moz-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]:-ms-input-placeholder,.input.is-disabled:-ms-input-placeholder,.textarea[disabled]:-ms-input-placeholder,.textarea.is-disabled:-ms-input-placeholder{color:rgba(54,54,54,0.3)}.input[type=\"search\"],.textarea[type=\"search\"]{border-radius:290486px}.input.is-white,.textarea.is-white{border-color:#fff}.input.is-black,.textarea.is-black{border-color:#0a0a0a}.input.is-light,.textarea.is-light{border-color:#f5f5f5}.input.is-dark,.textarea.is-dark{border-color:#363636}.input.is-primary,.textarea.is-primary{border-color:#182b73}.input.is-info,.textarea.is-info{border-color:#3273dc}.input.is-success,.textarea.is-success{border-color:#23d160}.input.is-warning,.textarea.is-warning{border-color:#ffdd57}.input.is-danger,.textarea.is-danger{border-color:red}.input.is-small,.textarea.is-small{border-radius:2px;font-size:.75rem}.input.is-medium,.textarea.is-medium{font-size:1.25rem}.input.is-large,.textarea.is-large{font-size:1.5rem}.input.is-fullwidth,.textarea.is-fullwidth{display:block;width:100%}.input.is-inline,.textarea.is-inline{display:inline;width:auto}.textarea{display:block;line-height:1.25;max-height:600px;max-width:100%;min-height:120px;min-width:100%;padding:10px;resize:vertical}.checkbox,.radio{align-items:center;cursor:pointer;display:inline-flex;flex-wrap:wrap;justify-content:flex-start;position:relative;vertical-align:top}.checkbox input,.radio input{cursor:pointer;margin-right:0.5em}.checkbox:hover,.radio:hover{color:#363636}.checkbox.is-disabled,.radio.is-disabled{color:#7a7a7a;pointer-events:none}.checkbox.is-disabled input,.radio.is-disabled input{pointer-events:none}.radio+.radio{margin-left:0.5em}.select{display:inline-block;height:2.5em;position:relative;vertical-align:top}.select:after{border:1px solid #182b73;border-right:0;border-top:0;content:\" \";display:block;height:0.5em;pointer-events:none;position:absolute;transform:rotate(-45deg);width:0.5em;margin-top:-0.375em;right:1.125em;top:50%;z-index:4}.select select{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;background-color:#fff;border:1px solid #dbdbdb;color:#363636;cursor:pointer;display:block;font-size:1em;outline:none;padding-right:2.5em}.select select:focus,.select select.is-focused,.select select:active,.select select.is-active{outline:none}.select select[disabled],.select select.is-disabled{pointer-events:none}.select select:hover,.select select.is-hovered{border-color:#b5b5b5}.select select:focus,.select select.is-focused,.select select:active,.select select.is-active{border-color:#182b73}.select select[disabled],.select select.is-disabled{background-color:#f5f5f5;border-color:#f5f5f5;box-shadow:none;color:#7a7a7a}.select select[disabled]::-moz-placeholder,.select select.is-disabled::-moz-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]::-webkit-input-placeholder,.select select.is-disabled::-webkit-input-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]:-moz-placeholder,.select select.is-disabled:-moz-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]:-ms-input-placeholder,.select select.is-disabled:-ms-input-placeholder{color:rgba(54,54,54,0.3)}.select select:hover{border-color:#b5b5b5}.select select::ms-expand{display:none}.select:hover:after{border-color:#363636}.select.is-small{border-radius:2px;font-size:.75rem}.select.is-medium{font-size:1.25rem}.select.is-large{font-size:1.5rem}.select.is-fullwidth{width:100%}.select.is-fullwidth select{width:100%}.label{color:#363636;display:block;font-weight:bold}.label:not(:last-child){margin-bottom:0.5em}.help{display:block;font-size:.75rem;margin-top:5px}.help.is-white{color:#fff}.help.is-black{color:#0a0a0a}.help.is-light{color:#f5f5f5}.help.is-dark{color:#363636}.help.is-primary{color:#182b73}.help.is-info{color:#3273dc}.help.is-success{color:#23d160}.help.is-warning{color:#ffdd57}.help.is-danger{color:red}@media screen and (max-width: 768px){.control-label{margin-bottom:0.5em}}@media screen and (min-width: 769px){.control-label{flex-basis:0;flex-grow:1;flex-shrink:0;margin-right:1.5em;padding-top:0.5em;text-align:right}}.control{position:relative;text-align:left}.control:not(:last-child){margin-bottom:0.75rem}.control.has-addons{display:flex;justify-content:flex-start}.control.has-addons .button,.control.has-addons .input,.control.has-addons .select{border-radius:0;margin-right:-1px;width:auto}.control.has-addons .button:hover,.control.has-addons .input:hover,.control.has-addons .select:hover{z-index:2}.control.has-addons .button:focus,.control.has-addons .button:active,.control.has-addons .input:focus,.control.has-addons .input:active,.control.has-addons .select:focus,.control.has-addons .select:active{z-index:3}.control.has-addons .button:first-child,.control.has-addons .input:first-child,.control.has-addons .select:first-child{border-radius:3px 0 0 3px}.control.has-addons .button:first-child select,.control.has-addons .input:first-child select,.control.has-addons .select:first-child select{border-radius:3px 0 0 3px}.control.has-addons .button:last-child,.control.has-addons .input:last-child,.control.has-addons .select:last-child{border-radius:0 3px 3px 0}.control.has-addons .button:last-child select,.control.has-addons .input:last-child select,.control.has-addons .select:last-child select{border-radius:0 3px 3px 0}.control.has-addons .button.is-expanded,.control.has-addons .input.is-expanded,.control.has-addons .select.is-expanded{flex-grow:1;flex-shrink:0}.control.has-addons .select select:hover{z-index:2}.control.has-addons .select select:focus,.control.has-addons .select select:active{z-index:3}.control.has-addons.has-addons-centered{justify-content:center}.control.has-addons.has-addons-right{justify-content:flex-end}.control.has-addons.has-addons-fullwidth .button,.control.has-addons.has-addons-fullwidth .input,.control.has-addons.has-addons-fullwidth .select{flex-grow:1;flex-shrink:0}.control.has-icon .icon{color:#dbdbdb;pointer-events:none;position:absolute;top:1.25rem;z-index:4}.control.has-icon .input:focus+.icon{color:#7a7a7a}.control.has-icon .input.is-small+.icon{top:.9375rem}.control.has-icon .input.is-medium+.icon{top:1.5625rem}.control.has-icon .input.is-large+.icon{top:1.875rem}.control.has-icon:not(.has-icon-right) .icon{left:1.25rem;transform:translateX(-50%) translateY(-50%)}.control.has-icon:not(.has-icon-right) .input{padding-left:2.5em}.control.has-icon:not(.has-icon-right) .input.is-small+.icon{left:.9375rem}.control.has-icon:not(.has-icon-right) .input.is-medium+.icon{left:1.5625rem}.control.has-icon:not(.has-icon-right) .input.is-large+.icon{left:1.875rem}.control.has-icon.has-icon-right .icon{right:1.25rem;transform:translateX(50%) translateY(-50%)}.control.has-icon.has-icon-right .input{padding-right:2.5em}.control.has-icon.has-icon-right .input.is-small+.icon{right:.9375rem}.control.has-icon.has-icon-right .input.is-medium+.icon{right:1.5625rem}.control.has-icon.has-icon-right .input.is-large+.icon{right:1.875rem}.control.is-grouped{display:flex;justify-content:flex-start}.control.is-grouped>.control{flex-basis:0;flex-shrink:0}.control.is-grouped>.control:not(:last-child){margin-bottom:0;margin-right:0.75rem}.control.is-grouped>.control.is-expanded{flex-grow:1;flex-shrink:1}.control.is-grouped.is-grouped-centered{justify-content:center}.control.is-grouped.is-grouped-right{justify-content:flex-end}@media screen and (min-width: 769px){.control.is-horizontal{display:flex}.control.is-horizontal>.control{display:flex;flex-basis:0;flex-grow:5;flex-shrink:1}}.control.is-loading:after{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1rem;position:relative;width:1rem;position:absolute !important;right:0.75em;top:0.75em}.icon{display:inline-block;font-size:21px;height:1.5rem;line-height:1.5rem;text-align:center;vertical-align:top;width:1.5rem}.icon .fa{font-size:inherit;line-height:inherit}.icon.is-small{display:inline-block;font-size:14px;height:1rem;line-height:1rem;text-align:center;vertical-align:top;width:1rem}.icon.is-medium{display:inline-block;font-size:28px;height:2rem;line-height:2rem;text-align:center;vertical-align:top;width:2rem}.icon.is-large{display:inline-block;font-size:42px;height:3rem;line-height:3rem;text-align:center;vertical-align:top;width:3rem}.image{display:block;position:relative}.image img{display:block;height:auto;width:100%}.image.is-square img,.image.is-1by1 img,.image.is-4by3 img,.image.is-3by2 img,.image.is-16by9 img,.image.is-2by1 img{bottom:0;left:0;position:absolute;right:0;top:0;height:100%;width:100%}.image.is-square,.image.is-1by1{padding-top:100%}.image.is-4by3{padding-top:75%}.image.is-3by2{padding-top:66.6666%}.image.is-16by9{padding-top:56.25%}.image.is-2by1{padding-top:50%}.image.is-16x16{height:16px;width:16px}.image.is-24x24{height:24px;width:24px}.image.is-32x32{height:32px;width:32px}.image.is-48x48{height:48px;width:48px}.image.is-64x64{height:64px;width:64px}.image.is-96x96{height:96px;width:96px}.image.is-128x128{height:128px;width:128px}.notification{background-color:#f5f5f5;border-radius:3px;padding:1.25rem 2.5rem 1.25rem 1.5rem;position:relative}.notification:not(:last-child){margin-bottom:1.5rem}.notification code,.notification pre{background:#fff}.notification pre code{background:transparent}.notification .delete{position:absolute;right:0.5em;top:0.5em}.notification .title,.notification .subtitle,.notification .content{color:inherit}.notification.is-white{background-color:#fff;color:#0a0a0a}.notification.is-black{background-color:#0a0a0a;color:#fff}.notification.is-light{background-color:#f5f5f5;color:#363636}.notification.is-dark{background-color:#363636;color:#f5f5f5}.notification.is-primary{background-color:#182b73;color:#fff}.notification.is-info{background-color:#3273dc;color:#fff}.notification.is-success{background-color:#23d160;color:#fff}.notification.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.notification.is-danger{background-color:red;color:#fff}.progress{-moz-appearance:none;-webkit-appearance:none;border:none;border-radius:290486px;display:block;height:1rem;overflow:hidden;padding:0;width:100%}.progress:not(:last-child){margin-bottom:1.5rem}.progress::-webkit-progress-bar{background-color:#dbdbdb}.progress::-webkit-progress-value{background-color:#4a4a4a}.progress::-moz-progress-bar{background-color:#4a4a4a}.progress.is-white::-webkit-progress-value{background-color:#fff}.progress.is-white::-moz-progress-bar{background-color:#fff}.progress.is-black::-webkit-progress-value{background-color:#0a0a0a}.progress.is-black::-moz-progress-bar{background-color:#0a0a0a}.progress.is-light::-webkit-progress-value{background-color:#f5f5f5}.progress.is-light::-moz-progress-bar{background-color:#f5f5f5}.progress.is-dark::-webkit-progress-value{background-color:#363636}.progress.is-dark::-moz-progress-bar{background-color:#363636}.progress.is-primary::-webkit-progress-value{background-color:#182b73}.progress.is-primary::-moz-progress-bar{background-color:#182b73}.progress.is-info::-webkit-progress-value{background-color:#3273dc}.progress.is-info::-moz-progress-bar{background-color:#3273dc}.progress.is-success::-webkit-progress-value{background-color:#23d160}.progress.is-success::-moz-progress-bar{background-color:#23d160}.progress.is-warning::-webkit-progress-value{background-color:#ffdd57}.progress.is-warning::-moz-progress-bar{background-color:#ffdd57}.progress.is-danger::-webkit-progress-value{background-color:red}.progress.is-danger::-moz-progress-bar{background-color:red}.progress.is-small{height:.75rem}.progress.is-medium{height:1.25rem}.progress.is-large{height:1.5rem}.table{background-color:#fff;color:#363636;margin-bottom:1.5rem;width:100%}.table td,.table th{border:1px solid #dbdbdb;border-width:0 0 1px;padding:0.5em 0.75em;vertical-align:top}.table td.is-narrow,.table th.is-narrow{white-space:nowrap;width:1%}.table th{color:#363636;text-align:left}.table tr:hover{background-color:#fafafa}.table thead td,.table thead th{border-width:0 0 2px;color:#7a7a7a}.table tfoot td,.table tfoot th{border-width:2px 0 0;color:#7a7a7a}.table tbody tr:last-child td,.table tbody tr:last-child th{border-bottom-width:0}.table.is-bordered td,.table.is-bordered th{border-width:1px}.table.is-bordered tr:last-child td,.table.is-bordered tr:last-child th{border-bottom-width:1px}.table.is-narrow td,.table.is-narrow th{padding:0.25em 0.5em}.table.is-striped tbody tr:nth-child(even){background-color:#fafafa}.table.is-striped tbody tr:nth-child(even):hover{background-color:#f5f5f5}.tag{align-items:center;background-color:#f5f5f5;border-radius:290486px;color:#4a4a4a;display:inline-flex;font-size:.75rem;height:2em;justify-content:center;line-height:1.5;padding-left:0.875em;padding-right:0.875em;vertical-align:top;white-space:nowrap}.tag .delete{margin-left:0.25em;margin-right:-0.5em}.tag.is-white{background-color:#fff;color:#0a0a0a}.tag.is-black{background-color:#0a0a0a;color:#fff}.tag.is-light{background-color:#f5f5f5;color:#363636}.tag.is-dark{background-color:#363636;color:#f5f5f5}.tag.is-primary{background-color:#182b73;color:#fff}.tag.is-info{background-color:#3273dc;color:#fff}.tag.is-success{background-color:#23d160;color:#fff}.tag.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.tag.is-danger{background-color:red;color:#fff}.tag.is-medium{font-size:1rem}.tag.is-large{font-size:1.25rem}.title,.subtitle{word-break:break-word}.title:not(:last-child),.subtitle:not(:last-child){margin-bottom:1.5rem}.title em,.title span,.subtitle em,.subtitle span{font-weight:300}.title strong,.subtitle strong{font-weight:500}.title .tag,.subtitle .tag{vertical-align:middle}.title{color:#363636;font-size:2rem;font-weight:300;line-height:1.125}.title strong{color:inherit}.title+.highlight{margin-top:-0.75rem}.title+.subtitle{margin-top:-1.25rem}.title.is-1{font-size:3.5rem}.title.is-2{font-size:2.75rem}.title.is-3{font-size:2rem}.title.is-4{font-size:1.5rem}.title.is-5{font-size:1.25rem}.title.is-6{font-size:14px}.subtitle{color:#4a4a4a;font-size:1.25rem;font-weight:300;line-height:1.25}.subtitle strong{color:#363636}.subtitle+.title{margin-top:-1.5rem}.subtitle.is-1{font-size:3.5rem}.subtitle.is-2{font-size:2.75rem}.subtitle.is-3{font-size:2rem}.subtitle.is-4{font-size:1.5rem}.subtitle.is-5{font-size:1.25rem}.subtitle.is-6{font-size:14px}.block:not(:last-child){margin-bottom:1.5rem}.container{position:relative}@media screen and (min-width: 1000px){.container{margin:0 auto;max-width:960px}.container.is-fluid{margin:0 20px;max-width:none}}@media screen and (min-width: 1192px){.container{max-width:1152px}}.delete{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-moz-appearance:none;-webkit-appearance:none;background-color:rgba(10,10,10,0.2);border:none;border-radius:290486px;cursor:pointer;display:inline-block;font-size:1rem;height:20px;outline:none;position:relative;transform:rotate(45deg);transform-origin:center center;vertical-align:top;width:20px}.delete:before,.delete:after{background-color:#fff;content:\"\";display:block;left:50%;position:absolute;top:50%;transform:translateX(-50%) translateY(-50%)}.delete:before{height:2px;width:50%}.delete:after{height:50%;width:2px}.delete:hover,.delete:focus{background-color:rgba(10,10,10,0.3)}.delete:active{background-color:rgba(10,10,10,0.4)}.delete.is-small{height:14px;width:14px}.delete.is-medium{height:26px;width:26px}.delete.is-large{height:30px;width:30px}.fa{font-size:21px;text-align:center;vertical-align:top}.heading{display:block;font-size:11px;letter-spacing:1px;margin-bottom:5px;text-transform:uppercase}.highlight{font-weight:400;max-width:100%;overflow:hidden;padding:0}.highlight:not(:last-child){margin-bottom:1.5rem}.highlight pre{overflow:auto;max-width:100%}.loader{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1rem;position:relative;width:1rem}.number{align-items:center;background-color:#f5f5f5;border-radius:290486px;display:inline-flex;font-size:1.25rem;height:2em;justify-content:center;margin-right:1.5rem;min-width:2.5em;padding:0.25rem 0.5rem;text-align:center;vertical-align:top}.card-header{align-items:stretch;box-shadow:0 1px 2px rgba(10,10,10,0.1);display:flex}.card-header-title{align-items:center;color:#363636;display:flex;flex-grow:1;font-weight:700;padding:0.75rem}.card-header-icon{align-items:center;cursor:pointer;display:flex;justify-content:center;padding:0.75rem}.card-image{display:block;position:relative}.card-content{padding:1.5rem}.card-content .title+.subtitle{margin-top:-1.5rem}.card-footer{border-top:1px solid #dbdbdb;align-items:stretch;display:flex}.card-footer-item{align-items:center;display:flex;flex-basis:0;flex-grow:1;flex-shrink:0;justify-content:center;padding:0.75rem}.card-footer-item:not(:last-child){border-right:1px solid #dbdbdb}.card{background-color:#fff;box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px rgba(10,10,10,0.1);color:#4a4a4a;max-width:100%;position:relative}.card .media:not(:last-child){margin-bottom:0.75rem}.level-item{align-items:center;display:flex;flex-basis:auto;flex-grow:0;flex-shrink:0;justify-content:center}.level-item .title,.level-item .subtitle{margin-bottom:0}@media screen and (max-width: 768px){.level-item:not(:last-child){margin-bottom:0.75rem}}.level-left,.level-right{flex-basis:auto;flex-grow:0;flex-shrink:0}.level-left .level-item:not(:last-child),.level-right .level-item:not(:last-child){margin-right:0.75rem}.level-left .level-item.is-flexible,.level-right .level-item.is-flexible{flex-grow:1}.level-left{align-items:center;justify-content:flex-start}@media screen and (max-width: 768px){.level-left+.level-right{margin-top:1.5rem}}@media screen and (min-width: 769px){.level-left{display:flex}}.level-right{align-items:center;justify-content:flex-end}@media screen and (min-width: 769px){.level-right{display:flex}}.level{align-items:center;justify-content:space-between}.level:not(:last-child){margin-bottom:1.5rem}.level code{border-radius:3px}.level img{display:inline-block;vertical-align:top}.level.is-mobile{display:flex}.level.is-mobile>.level-item:not(:last-child){margin-bottom:0}.level.is-mobile>.level-item:not(.is-narrow){flex-grow:1}@media screen and (min-width: 769px){.level{display:flex}.level>.level-item:not(.is-narrow){flex-grow:1}}.media-left,.media-right{flex-basis:auto;flex-grow:0;flex-shrink:0}.media-left{margin-right:1rem}.media-right{margin-left:1rem}.media-content{flex-basis:auto;flex-grow:1;flex-shrink:1;text-align:left}.media{align-items:flex-start;display:flex;text-align:left}.media .content:not(:last-child){margin-bottom:0.75rem}.media .media{border-top:1px solid rgba(219,219,219,0.5);display:flex;padding-top:0.75rem}.media .media .content:not(:last-child),.media .media .control:not(:last-child){margin-bottom:0.5rem}.media .media .media{padding-top:0.5rem}.media .media .media+.media{margin-top:0.5rem}.media+.media{border-top:1px solid rgba(219,219,219,0.5);margin-top:1rem;padding-top:1rem}.media.is-large+.media{margin-top:1.5rem;padding-top:1.5rem}.menu{font-size:1rem}.menu-list{line-height:1.25}.menu-list a{border-radius:2px;color:#4a4a4a;display:block;padding:0.5em 0.75em}.menu-list a:hover{background-color:#f5f5f5;color:#182b73}.menu-list a.is-active{background-color:#182b73;color:#fff}.menu-list li ul{border-left:1px solid #dbdbdb;margin:0.75em;padding-left:0.75em}.menu-label{color:#7a7a7a;font-size:0.8em;letter-spacing:0.1em;text-transform:uppercase}.menu-label:not(:first-child){margin-top:1em}.menu-label:not(:last-child){margin-bottom:1em}.message{background-color:#f5f5f5;border-radius:3px;font-size:1rem}.message:not(:last-child){margin-bottom:1.5rem}.message.is-white{background-color:#fff}.message.is-white .message-header{background-color:#fff;color:#0a0a0a}.message.is-white .message-body{border-color:#fff;color:#4d4d4d}.message.is-black{background-color:#fafafa}.message.is-black .message-header{background-color:#0a0a0a;color:#fff}.message.is-black .message-body{border-color:#0a0a0a;color:#090909}.message.is-light{background-color:#fafafa}.message.is-light .message-header{background-color:#f5f5f5;color:#363636}.message.is-light .message-body{border-color:#f5f5f5;color:#505050}.message.is-dark{background-color:#fafafa}.message.is-dark .message-header{background-color:#363636;color:#f5f5f5}.message.is-dark .message-body{border-color:#363636;color:#2a2a2a}.message.is-primary{background-color:#f7f8fd}.message.is-primary .message-header{background-color:#182b73;color:#fff}.message.is-primary .message-body{border-color:#182b73;color:#162662}.message.is-info{background-color:#f6f9fe}.message.is-info .message-header{background-color:#3273dc;color:#fff}.message.is-info .message-body{border-color:#3273dc;color:#22509a}.message.is-success{background-color:#f6fef9}.message.is-success .message-header{background-color:#23d160;color:#fff}.message.is-success .message-body{border-color:#23d160;color:#0e301a}.message.is-warning{background-color:#fffdf5}.message.is-warning .message-header{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.message.is-warning .message-body{border-color:#ffdd57;color:#3b3108}.message.is-danger{background-color:#fff5f5}.message.is-danger .message-header{background-color:red;color:#fff}.message.is-danger .message-body{border-color:red;color:#ad0606}.message-header{align-items:center;background-color:#4a4a4a;border-radius:3px 3px 0 0;color:#fff;display:flex;justify-content:space-between;line-height:1.25;padding:0.5em 0.75em;position:relative}.message-header a,.message-header strong{color:inherit}.message-header a{text-decoration:underline}.message-header .delete{flex-grow:0;flex-shrink:0;margin-left:0.75em}.message-header+.message-body{border-top-left-radius:0;border-top-right-radius:0;border-top:none}.message-body{border:1px solid #dbdbdb;border-radius:3px;color:#4a4a4a;padding:1em 1.25em}.message-body a,.message-body strong{color:inherit}.message-body a{text-decoration:underline}.message-body code,.message-body pre{background:#fff}.message-body pre code{background:transparent}.modal-background{bottom:0;left:0;position:absolute;right:0;top:0;background-color:rgba(10,10,10,0.86)}.modal-content,.modal-card{margin:0 20px;max-height:calc(100vh - 160px);overflow:auto;position:relative;width:100%}@media screen and (min-width: 769px){.modal-content,.modal-card{margin:0 auto;max-height:calc(100vh - 40px);width:640px}}.modal-close{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-moz-appearance:none;-webkit-appearance:none;background-color:rgba(10,10,10,0.2);border:none;border-radius:290486px;cursor:pointer;display:inline-block;font-size:1rem;height:20px;outline:none;position:relative;transform:rotate(45deg);transform-origin:center center;vertical-align:top;width:20px;background:none;height:40px;position:fixed;right:20px;top:20px;width:40px}.modal-close:before,.modal-close:after{background-color:#fff;content:\"\";display:block;left:50%;position:absolute;top:50%;transform:translateX(-50%) translateY(-50%)}.modal-close:before{height:2px;width:50%}.modal-close:after{height:50%;width:2px}.modal-close:hover,.modal-close:focus{background-color:rgba(10,10,10,0.3)}.modal-close:active{background-color:rgba(10,10,10,0.4)}.modal-close.is-small{height:14px;width:14px}.modal-close.is-medium{height:26px;width:26px}.modal-close.is-large{height:30px;width:30px}.modal-card{display:flex;flex-direction:column;max-height:calc(100vh - 40px);overflow:hidden}.modal-card-head,.modal-card-foot{align-items:center;background-color:#f5f5f5;display:flex;flex-shrink:0;justify-content:flex-start;padding:20px;position:relative}.modal-card-head{border-bottom:1px solid #dbdbdb;border-top-left-radius:5px;border-top-right-radius:5px}.modal-card-title{color:#363636;flex-grow:1;flex-shrink:0;font-size:1.5rem;line-height:1}.modal-card-foot{border-bottom-left-radius:5px;border-bottom-right-radius:5px;border-top:1px solid #dbdbdb}.modal-card-foot .button:not(:last-child){margin-right:10px}.modal-card-body{-webkit-overflow-scrolling:touch;background-color:#fff;flex-grow:1;flex-shrink:1;overflow:auto;padding:20px}.modal{bottom:0;left:0;position:absolute;right:0;top:0;align-items:center;display:none;justify-content:center;overflow:hidden;position:fixed;z-index:1986}.modal.is-active{display:flex}.nav-toggle{cursor:pointer;display:block;height:3.5rem;position:relative;width:3.5rem}.nav-toggle span{background-color:#4a4a4a;display:block;height:1px;left:50%;margin-left:-7px;position:absolute;top:50%;transition:none 86ms ease-out;transition-property:background, left, opacity, transform;width:15px}.nav-toggle span:nth-child(1){margin-top:-6px}.nav-toggle span:nth-child(2){margin-top:-1px}.nav-toggle span:nth-child(3){margin-top:4px}.nav-toggle:hover{background-color:#f5f5f5}.nav-toggle.is-active span{background-color:#182b73}.nav-toggle.is-active span:nth-child(1){margin-left:-5px;transform:rotate(45deg);transform-origin:left top}.nav-toggle.is-active span:nth-child(2){opacity:0}.nav-toggle.is-active span:nth-child(3){margin-left:-5px;transform:rotate(-45deg);transform-origin:left bottom}@media screen and (min-width: 769px){.nav-toggle{display:none}}.nav-item{align-items:center;display:flex;flex-grow:0;flex-shrink:0;font-size:1rem;justify-content:center;padding:0.5rem 0.75rem}.nav-item a{flex-grow:1;flex-shrink:0}.nav-item img{max-height:1.75rem}.nav-item .button+.button{margin-left:0.75rem}.nav-item .tag:first-child:not(:last-child){margin-right:0.5rem}.nav-item .tag:last-child:not(:first-child){margin-left:0.5rem}@media screen and (max-width: 768px){.nav-item{justify-content:flex-start}}.nav-item a,a.nav-item{color:#7a7a7a}.nav-item a:hover,a.nav-item:hover{color:#363636}.nav-item a.is-active,a.nav-item.is-active{color:#363636}.nav-item a.is-tab,a.nav-item.is-tab{border-bottom:1px solid transparent;border-top:1px solid transparent;padding-bottom:calc(0.5rem - 1px);padding-left:1rem;padding-right:1rem;padding-top:calc(0.5rem - 1px)}.nav-item a.is-tab:hover,a.nav-item.is-tab:hover{border-bottom-color:#182b73;border-top-color:transparent}.nav-item a.is-tab.is-active,a.nav-item.is-tab.is-active{border-bottom:3px solid #182b73;color:#182b73;padding-bottom:calc(0.5rem - 3px)}@media screen and (min-width: 1000px){.nav-item a.is-brand,a.nav-item.is-brand{padding-left:0}}@media screen and (max-width: 768px){.nav-menu{background-color:#fff;box-shadow:0 4px 7px rgba(10,10,10,0.1);left:0;display:none;right:0;top:100%;position:absolute}.nav-menu .nav-item{border-top:1px solid rgba(219,219,219,0.5);padding:0.75rem}.nav-menu.is-active{display:block}}@media screen and (min-width: 769px) and (max-width: 999px){.nav-menu{padding-right:1.5rem}}.nav-left,.nav-right{align-items:stretch;flex-basis:0;flex-grow:1;flex-shrink:0}.nav-left{display:flex;justify-content:flex-start;overflow:hidden;overflow-x:auto;white-space:nowrap}.nav-center{align-items:stretch;display:flex;flex-grow:0;flex-shrink:0;justify-content:center;margin-left:auto;margin-right:auto}.nav-right{justify-content:flex-end}@media screen and (min-width: 769px){.nav-right{display:flex}}.nav{align-items:stretch;background-color:#fff;display:flex;min-height:3.5rem;position:relative;text-align:center;z-index:2}.nav>.container{align-items:stretch;display:flex;min-height:3.5rem;width:100%}.nav.has-shadow{box-shadow:0 2px 3px rgba(10,10,10,0.1)}.pagination,.pagination-list{align-items:center;display:flex;justify-content:center;text-align:center}.pagination-previous,.pagination-next,.pagination-link,.pagination-ellipsis{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;font-size:0.875rem;padding-left:0.5em;padding-right:0.5em;justify-content:center;text-align:center}.pagination-previous:focus,.pagination-previous.is-focused,.pagination-previous:active,.pagination-previous.is-active,.pagination-next:focus,.pagination-next.is-focused,.pagination-next:active,.pagination-next.is-active,.pagination-link:focus,.pagination-link.is-focused,.pagination-link:active,.pagination-link.is-active,.pagination-ellipsis:focus,.pagination-ellipsis.is-focused,.pagination-ellipsis:active,.pagination-ellipsis.is-active{outline:none}.pagination-previous[disabled],.pagination-previous.is-disabled,.pagination-next[disabled],.pagination-next.is-disabled,.pagination-link[disabled],.pagination-link.is-disabled,.pagination-ellipsis[disabled],.pagination-ellipsis.is-disabled{pointer-events:none}.pagination-previous,.pagination-next,.pagination-link{border:1px solid #dbdbdb;min-width:2.5em}.pagination-previous:hover,.pagination-next:hover,.pagination-link:hover{border-color:#b5b5b5;color:#363636}.pagination-previous:focus,.pagination-next:focus,.pagination-link:focus{border-color:#182b73}.pagination-previous:active,.pagination-next:active,.pagination-link:active{box-shadow:inset 0 1px 2px rgba(10,10,10,0.2)}.pagination-previous[disabled],.pagination-previous.is-disabled,.pagination-next[disabled],.pagination-next.is-disabled,.pagination-link[disabled],.pagination-link.is-disabled{background:#dbdbdb;color:#7a7a7a;opacity:0.5;pointer-events:none}.pagination-previous,.pagination-next{padding-left:0.75em;padding-right:0.75em}.pagination-link.is-current{background-color:#182b73;border-color:#182b73;color:#fff}.pagination-ellipsis{color:#b5b5b5;pointer-events:none}.pagination-list li:not(:first-child){margin-left:0.375rem}@media screen and (max-width: 768px){.pagination{flex-wrap:wrap}.pagination-previous,.pagination-next{flex-grow:1;flex-shrink:1;width:calc(50% - 0.375rem)}.pagination-next{margin-left:0.75rem}.pagination-list{margin-top:0.75rem}.pagination-list li{flex-grow:1;flex-shrink:1}}@media screen and (min-width: 769px){.pagination-list{flex-grow:1;flex-shrink:1;justify-content:flex-start;order:1}.pagination-previous,.pagination-next{margin-left:0.75rem}.pagination-previous{order:2}.pagination-next{order:3}.pagination{justify-content:space-between}.pagination.is-centered .pagination-previous{margin-left:0;order:1}.pagination.is-centered .pagination-list{justify-content:center;order:2}.pagination.is-centered .pagination-next{order:3}.pagination.is-right .pagination-previous{margin-left:0;order:1}.pagination.is-right .pagination-next{order:2;margin-right:0.75rem}.pagination.is-right .pagination-list{justify-content:flex-end;order:3}}.panel{font-size:1rem}.panel:not(:last-child){margin-bottom:1.5rem}.panel-heading,.panel-tabs,.panel-block{border-bottom:1px solid #dbdbdb;border-left:1px solid #dbdbdb;border-right:1px solid #dbdbdb}.panel-heading:first-child,.panel-tabs:first-child,.panel-block:first-child{border-top:1px solid #dbdbdb}.panel-heading{background-color:#f5f5f5;border-radius:3px 3px 0 0;color:#363636;font-size:1.25em;font-weight:300;line-height:1.25;padding:0.5em 0.75em}.panel-tabs{align-items:flex-end;display:flex;font-size:0.875em;justify-content:center}.panel-tabs a{border-bottom:1px solid #dbdbdb;margin-bottom:-1px;padding:0.5em}.panel-tabs a.is-active{border-bottom-color:#4a4a4a;color:#363636}.panel-list a{color:#4a4a4a}.panel-list a:hover{color:#182b73}.panel-block{align-items:center;color:#363636;display:flex;justify-content:flex-start;padding:0.5em 0.75em}.panel-block input[type=\"checkbox\"]{margin-right:0.75em}.panel-block>.control{flex-grow:1;flex-shrink:1;width:100%}.panel-block.is-active{border-left-color:#182b73;color:#363636}.panel-block.is-active .panel-icon{color:#182b73}a.panel-block,label.panel-block{cursor:pointer}a.panel-block:hover,label.panel-block:hover{background-color:#f5f5f5}.panel-icon{display:inline-block;font-size:14px;height:1em;line-height:1em;text-align:center;vertical-align:top;width:1em;color:#7a7a7a;margin-right:0.75em}.panel-icon .fa{font-size:inherit;line-height:inherit}.tabs{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;align-items:stretch;display:flex;font-size:1rem;justify-content:space-between;overflow:hidden;overflow-x:auto;white-space:nowrap}.tabs:not(:last-child){margin-bottom:1.5rem}.tabs a{align-items:center;border-bottom:1px solid #dbdbdb;color:#4a4a4a;display:flex;justify-content:center;margin-bottom:-1px;padding:0.5em 1em;vertical-align:top}.tabs a:hover{border-bottom-color:#363636;color:#363636}.tabs li{display:block}.tabs li.is-active a{border-bottom-color:#182b73;color:#182b73}.tabs ul{align-items:center;border-bottom:1px solid #dbdbdb;display:flex;flex-grow:1;flex-shrink:0;justify-content:flex-start}.tabs ul.is-left{padding-right:0.75em}.tabs ul.is-center{flex:none;justify-content:center;padding-left:0.75em;padding-right:0.75em}.tabs ul.is-right{justify-content:flex-end;padding-left:0.75em}.tabs .icon:first-child{margin-right:0.5em}.tabs .icon:last-child{margin-left:0.5em}.tabs.is-centered ul{justify-content:center}.tabs.is-right ul{justify-content:flex-end}.tabs.is-boxed a{border:1px solid transparent;border-radius:3px 3px 0 0}.tabs.is-boxed a:hover{background-color:#f5f5f5;border-bottom-color:#dbdbdb}.tabs.is-boxed li.is-active a{background-color:#fff;border-color:#dbdbdb;border-bottom-color:transparent !important}.tabs.is-fullwidth li{flex-grow:1;flex-shrink:0}.tabs.is-toggle a{border:1px solid #dbdbdb;margin-bottom:0;position:relative}.tabs.is-toggle a:hover{background-color:#f5f5f5;border-color:#b5b5b5;z-index:2}.tabs.is-toggle li+li{margin-left:-1px}.tabs.is-toggle li:first-child a{border-radius:3px 0 0 3px}.tabs.is-toggle li:last-child a{border-radius:0 3px 3px 0}.tabs.is-toggle li.is-active a{background-color:#182b73;border-color:#182b73;color:#fff;z-index:1}.tabs.is-toggle ul{border-bottom:none}.tabs.is-small{font-size:.75rem}.tabs.is-medium{font-size:1.25rem}.tabs.is-large{font-size:1.5rem}.column{display:block;flex-basis:0;flex-grow:1;flex-shrink:1;padding:0.75rem}.columns.is-mobile>.column.is-narrow{flex:none}.columns.is-mobile>.column.is-full{flex:none;width:100%}.columns.is-mobile>.column.is-three-quarters{flex:none;width:75%}.columns.is-mobile>.column.is-two-thirds{flex:none;width:66.6666%}.columns.is-mobile>.column.is-half{flex:none;width:50%}.columns.is-mobile>.column.is-one-third{flex:none;width:33.3333%}.columns.is-mobile>.column.is-one-quarter{flex:none;width:25%}.columns.is-mobile>.column.is-offset-three-quarters{margin-left:75%}.columns.is-mobile>.column.is-offset-two-thirds{margin-left:66.6666%}.columns.is-mobile>.column.is-offset-half{margin-left:50%}.columns.is-mobile>.column.is-offset-one-third{margin-left:33.3333%}.columns.is-mobile>.column.is-offset-one-quarter{margin-left:25%}.columns.is-mobile>.column.is-1{flex:none;width:8.33333%}.columns.is-mobile>.column.is-offset-1{margin-left:8.33333%}.columns.is-mobile>.column.is-2{flex:none;width:16.66667%}.columns.is-mobile>.column.is-offset-2{margin-left:16.66667%}.columns.is-mobile>.column.is-3{flex:none;width:25%}.columns.is-mobile>.column.is-offset-3{margin-left:25%}.columns.is-mobile>.column.is-4{flex:none;width:33.33333%}.columns.is-mobile>.column.is-offset-4{margin-left:33.33333%}.columns.is-mobile>.column.is-5{flex:none;width:41.66667%}.columns.is-mobile>.column.is-offset-5{margin-left:41.66667%}.columns.is-mobile>.column.is-6{flex:none;width:50%}.columns.is-mobile>.column.is-offset-6{margin-left:50%}.columns.is-mobile>.column.is-7{flex:none;width:58.33333%}.columns.is-mobile>.column.is-offset-7{margin-left:58.33333%}.columns.is-mobile>.column.is-8{flex:none;width:66.66667%}.columns.is-mobile>.column.is-offset-8{margin-left:66.66667%}.columns.is-mobile>.column.is-9{flex:none;width:75%}.columns.is-mobile>.column.is-offset-9{margin-left:75%}.columns.is-mobile>.column.is-10{flex:none;width:83.33333%}.columns.is-mobile>.column.is-offset-10{margin-left:83.33333%}.columns.is-mobile>.column.is-11{flex:none;width:91.66667%}.columns.is-mobile>.column.is-offset-11{margin-left:91.66667%}.columns.is-mobile>.column.is-12{flex:none;width:100%}.columns.is-mobile>.column.is-offset-12{margin-left:100%}@media screen and (max-width: 768px){.column.is-narrow-mobile{flex:none}.column.is-full-mobile{flex:none;width:100%}.column.is-three-quarters-mobile{flex:none;width:75%}.column.is-two-thirds-mobile{flex:none;width:66.6666%}.column.is-half-mobile{flex:none;width:50%}.column.is-one-third-mobile{flex:none;width:33.3333%}.column.is-one-quarter-mobile{flex:none;width:25%}.column.is-offset-three-quarters-mobile{margin-left:75%}.column.is-offset-two-thirds-mobile{margin-left:66.6666%}.column.is-offset-half-mobile{margin-left:50%}.column.is-offset-one-third-mobile{margin-left:33.3333%}.column.is-offset-one-quarter-mobile{margin-left:25%}.column.is-1-mobile{flex:none;width:8.33333%}.column.is-offset-1-mobile{margin-left:8.33333%}.column.is-2-mobile{flex:none;width:16.66667%}.column.is-offset-2-mobile{margin-left:16.66667%}.column.is-3-mobile{flex:none;width:25%}.column.is-offset-3-mobile{margin-left:25%}.column.is-4-mobile{flex:none;width:33.33333%}.column.is-offset-4-mobile{margin-left:33.33333%}.column.is-5-mobile{flex:none;width:41.66667%}.column.is-offset-5-mobile{margin-left:41.66667%}.column.is-6-mobile{flex:none;width:50%}.column.is-offset-6-mobile{margin-left:50%}.column.is-7-mobile{flex:none;width:58.33333%}.column.is-offset-7-mobile{margin-left:58.33333%}.column.is-8-mobile{flex:none;width:66.66667%}.column.is-offset-8-mobile{margin-left:66.66667%}.column.is-9-mobile{flex:none;width:75%}.column.is-offset-9-mobile{margin-left:75%}.column.is-10-mobile{flex:none;width:83.33333%}.column.is-offset-10-mobile{margin-left:83.33333%}.column.is-11-mobile{flex:none;width:91.66667%}.column.is-offset-11-mobile{margin-left:91.66667%}.column.is-12-mobile{flex:none;width:100%}.column.is-offset-12-mobile{margin-left:100%}}@media screen and (min-width: 769px){.column.is-narrow,.column.is-narrow-tablet{flex:none}.column.is-full,.column.is-full-tablet{flex:none;width:100%}.column.is-three-quarters,.column.is-three-quarters-tablet{flex:none;width:75%}.column.is-two-thirds,.column.is-two-thirds-tablet{flex:none;width:66.6666%}.column.is-half,.column.is-half-tablet{flex:none;width:50%}.column.is-one-third,.column.is-one-third-tablet{flex:none;width:33.3333%}.column.is-one-quarter,.column.is-one-quarter-tablet{flex:none;width:25%}.column.is-offset-three-quarters,.column.is-offset-three-quarters-tablet{margin-left:75%}.column.is-offset-two-thirds,.column.is-offset-two-thirds-tablet{margin-left:66.6666%}.column.is-offset-half,.column.is-offset-half-tablet{margin-left:50%}.column.is-offset-one-third,.column.is-offset-one-third-tablet{margin-left:33.3333%}.column.is-offset-one-quarter,.column.is-offset-one-quarter-tablet{margin-left:25%}.column.is-1,.column.is-1-tablet{flex:none;width:8.33333%}.column.is-offset-1,.column.is-offset-1-tablet{margin-left:8.33333%}.column.is-2,.column.is-2-tablet{flex:none;width:16.66667%}.column.is-offset-2,.column.is-offset-2-tablet{margin-left:16.66667%}.column.is-3,.column.is-3-tablet{flex:none;width:25%}.column.is-offset-3,.column.is-offset-3-tablet{margin-left:25%}.column.is-4,.column.is-4-tablet{flex:none;width:33.33333%}.column.is-offset-4,.column.is-offset-4-tablet{margin-left:33.33333%}.column.is-5,.column.is-5-tablet{flex:none;width:41.66667%}.column.is-offset-5,.column.is-offset-5-tablet{margin-left:41.66667%}.column.is-6,.column.is-6-tablet{flex:none;width:50%}.column.is-offset-6,.column.is-offset-6-tablet{margin-left:50%}.column.is-7,.column.is-7-tablet{flex:none;width:58.33333%}.column.is-offset-7,.column.is-offset-7-tablet{margin-left:58.33333%}.column.is-8,.column.is-8-tablet{flex:none;width:66.66667%}.column.is-offset-8,.column.is-offset-8-tablet{margin-left:66.66667%}.column.is-9,.column.is-9-tablet{flex:none;width:75%}.column.is-offset-9,.column.is-offset-9-tablet{margin-left:75%}.column.is-10,.column.is-10-tablet{flex:none;width:83.33333%}.column.is-offset-10,.column.is-offset-10-tablet{margin-left:83.33333%}.column.is-11,.column.is-11-tablet{flex:none;width:91.66667%}.column.is-offset-11,.column.is-offset-11-tablet{margin-left:91.66667%}.column.is-12,.column.is-12-tablet{flex:none;width:100%}.column.is-offset-12,.column.is-offset-12-tablet{margin-left:100%}}@media screen and (min-width: 1000px){.column.is-narrow-desktop{flex:none}.column.is-full-desktop{flex:none;width:100%}.column.is-three-quarters-desktop{flex:none;width:75%}.column.is-two-thirds-desktop{flex:none;width:66.6666%}.column.is-half-desktop{flex:none;width:50%}.column.is-one-third-desktop{flex:none;width:33.3333%}.column.is-one-quarter-desktop{flex:none;width:25%}.column.is-offset-three-quarters-desktop{margin-left:75%}.column.is-offset-two-thirds-desktop{margin-left:66.6666%}.column.is-offset-half-desktop{margin-left:50%}.column.is-offset-one-third-desktop{margin-left:33.3333%}.column.is-offset-one-quarter-desktop{margin-left:25%}.column.is-1-desktop{flex:none;width:8.33333%}.column.is-offset-1-desktop{margin-left:8.33333%}.column.is-2-desktop{flex:none;width:16.66667%}.column.is-offset-2-desktop{margin-left:16.66667%}.column.is-3-desktop{flex:none;width:25%}.column.is-offset-3-desktop{margin-left:25%}.column.is-4-desktop{flex:none;width:33.33333%}.column.is-offset-4-desktop{margin-left:33.33333%}.column.is-5-desktop{flex:none;width:41.66667%}.column.is-offset-5-desktop{margin-left:41.66667%}.column.is-6-desktop{flex:none;width:50%}.column.is-offset-6-desktop{margin-left:50%}.column.is-7-desktop{flex:none;width:58.33333%}.column.is-offset-7-desktop{margin-left:58.33333%}.column.is-8-desktop{flex:none;width:66.66667%}.column.is-offset-8-desktop{margin-left:66.66667%}.column.is-9-desktop{flex:none;width:75%}.column.is-offset-9-desktop{margin-left:75%}.column.is-10-desktop{flex:none;width:83.33333%}.column.is-offset-10-desktop{margin-left:83.33333%}.column.is-11-desktop{flex:none;width:91.66667%}.column.is-offset-11-desktop{margin-left:91.66667%}.column.is-12-desktop{flex:none;width:100%}.column.is-offset-12-desktop{margin-left:100%}}@media screen and (min-width: 1192px){.column.is-narrow-widescreen{flex:none}.column.is-full-widescreen{flex:none;width:100%}.column.is-three-quarters-widescreen{flex:none;width:75%}.column.is-two-thirds-widescreen{flex:none;width:66.6666%}.column.is-half-widescreen{flex:none;width:50%}.column.is-one-third-widescreen{flex:none;width:33.3333%}.column.is-one-quarter-widescreen{flex:none;width:25%}.column.is-offset-three-quarters-widescreen{margin-left:75%}.column.is-offset-two-thirds-widescreen{margin-left:66.6666%}.column.is-offset-half-widescreen{margin-left:50%}.column.is-offset-one-third-widescreen{margin-left:33.3333%}.column.is-offset-one-quarter-widescreen{margin-left:25%}.column.is-1-widescreen{flex:none;width:8.33333%}.column.is-offset-1-widescreen{margin-left:8.33333%}.column.is-2-widescreen{flex:none;width:16.66667%}.column.is-offset-2-widescreen{margin-left:16.66667%}.column.is-3-widescreen{flex:none;width:25%}.column.is-offset-3-widescreen{margin-left:25%}.column.is-4-widescreen{flex:none;width:33.33333%}.column.is-offset-4-widescreen{margin-left:33.33333%}.column.is-5-widescreen{flex:none;width:41.66667%}.column.is-offset-5-widescreen{margin-left:41.66667%}.column.is-6-widescreen{flex:none;width:50%}.column.is-offset-6-widescreen{margin-left:50%}.column.is-7-widescreen{flex:none;width:58.33333%}.column.is-offset-7-widescreen{margin-left:58.33333%}.column.is-8-widescreen{flex:none;width:66.66667%}.column.is-offset-8-widescreen{margin-left:66.66667%}.column.is-9-widescreen{flex:none;width:75%}.column.is-offset-9-widescreen{margin-left:75%}.column.is-10-widescreen{flex:none;width:83.33333%}.column.is-offset-10-widescreen{margin-left:83.33333%}.column.is-11-widescreen{flex:none;width:91.66667%}.column.is-offset-11-widescreen{margin-left:91.66667%}.column.is-12-widescreen{flex:none;width:100%}.column.is-offset-12-widescreen{margin-left:100%}}.columns{margin-left:-0.75rem;margin-right:-0.75rem;margin-top:-0.75rem}.columns:last-child{margin-bottom:-0.75rem}.columns:not(:last-child){margin-bottom:0.75rem}.columns.is-centered{justify-content:center}.columns.is-gapless{margin-left:0;margin-right:0;margin-top:0}.columns.is-gapless:last-child{margin-bottom:0}.columns.is-gapless:not(:last-child){margin-bottom:1.5rem}.columns.is-gapless>.column{margin:0;padding:0}@media screen and (min-width: 769px){.columns.is-grid{flex-wrap:wrap}.columns.is-grid>.column{max-width:33.3333%;padding:0.75rem;width:33.3333%}.columns.is-grid>.column+.column{margin-left:0}}.columns.is-mobile{display:flex}.columns.is-multiline{flex-wrap:wrap}.columns.is-vcentered{align-items:center}@media screen and (min-width: 769px){.columns:not(.is-desktop){display:flex}}@media screen and (min-width: 1000px){.columns.is-desktop{display:flex}}.tile{align-items:stretch;display:block;flex-basis:0;flex-grow:1;flex-shrink:1;min-height:min-content}.tile.is-ancestor{margin-left:-0.75rem;margin-right:-0.75rem;margin-top:-0.75rem}.tile.is-ancestor:last-child{margin-bottom:-0.75rem}.tile.is-ancestor:not(:last-child){margin-bottom:0.75rem}.tile.is-child{margin:0 !important}.tile.is-parent{padding:0.75rem}.tile.is-vertical{flex-direction:column}.tile.is-vertical>.tile.is-child:not(:last-child){margin-bottom:1.5rem !important}@media screen and (min-width: 769px){.tile:not(.is-child){display:flex}.tile.is-1{flex:none;width:8.33333%}.tile.is-2{flex:none;width:16.66667%}.tile.is-3{flex:none;width:25%}.tile.is-4{flex:none;width:33.33333%}.tile.is-5{flex:none;width:41.66667%}.tile.is-6{flex:none;width:50%}.tile.is-7{flex:none;width:58.33333%}.tile.is-8{flex:none;width:66.66667%}.tile.is-9{flex:none;width:75%}.tile.is-10{flex:none;width:83.33333%}.tile.is-11{flex:none;width:91.66667%}.tile.is-12{flex:none;width:100%}}.hero-video{bottom:0;left:0;position:absolute;right:0;top:0;overflow:hidden}.hero-video video{left:50%;min-height:100%;min-width:100%;position:absolute;top:50%;transform:translate3d(-50%, -50%, 0)}.hero-video.is-transparent{opacity:0.3}@media screen and (max-width: 768px){.hero-video{display:none}}.hero-buttons{margin-top:1.5rem}@media screen and (max-width: 768px){.hero-buttons .button{display:flex}.hero-buttons .button:not(:last-child){margin-bottom:0.75rem}}@media screen and (min-width: 769px){.hero-buttons{display:flex;justify-content:center}.hero-buttons .button:not(:last-child){margin-right:1.5rem}}.hero-head,.hero-foot{flex-grow:0;flex-shrink:0}.hero-body{flex-grow:1;flex-shrink:0;padding:3rem 1.5rem}@media screen and (min-width: 1192px){.hero-body{padding-left:0;padding-right:0}}.hero{align-items:stretch;background-color:#fff;display:flex;flex-direction:column;justify-content:space-between}.hero .nav{background:none;box-shadow:0 1px 0 rgba(219,219,219,0.3)}.hero .tabs ul{border-bottom:none}.hero.is-white{background-color:#fff;color:#0a0a0a}.hero.is-white a,.hero.is-white strong{color:inherit}.hero.is-white .title{color:#0a0a0a}.hero.is-white .subtitle{color:rgba(10,10,10,0.9)}.hero.is-white .subtitle a,.hero.is-white .subtitle strong{color:#0a0a0a}.hero.is-white .nav{box-shadow:0 1px 0 rgba(10,10,10,0.2)}@media screen and (max-width: 768px){.hero.is-white .nav-menu{background-color:#fff}}.hero.is-white a.nav-item,.hero.is-white .nav-item a:not(.button){color:rgba(10,10,10,0.7)}.hero.is-white a.nav-item:hover,.hero.is-white a.nav-item.is-active,.hero.is-white .nav-item a:not(.button):hover,.hero.is-white .nav-item a:not(.button).is-active{color:#0a0a0a}.hero.is-white .tabs a{color:#0a0a0a;opacity:0.9}.hero.is-white .tabs a:hover{opacity:1}.hero.is-white .tabs li.is-active a{opacity:1}.hero.is-white .tabs.is-boxed a,.hero.is-white .tabs.is-toggle a{color:#0a0a0a}.hero.is-white .tabs.is-boxed a:hover,.hero.is-white .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-white .tabs.is-boxed li.is-active a,.hero.is-white .tabs.is-boxed li.is-active a:hover,.hero.is-white .tabs.is-toggle li.is-active a,.hero.is-white .tabs.is-toggle li.is-active a:hover{background-color:#0a0a0a;border-color:#0a0a0a;color:#fff}.hero.is-white.is-bold{background-image:linear-gradient(141deg, #e6e6e6 0%, #fff 71%, #fff 100%)}@media screen and (max-width: 768px){.hero.is-white .nav-toggle span{background-color:#0a0a0a}.hero.is-white .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-white .nav-toggle.is-active span{background-color:#0a0a0a}.hero.is-white .nav-menu .nav-item{border-top-color:rgba(10,10,10,0.2)}}.hero.is-black{background-color:#0a0a0a;color:#fff}.hero.is-black a,.hero.is-black strong{color:inherit}.hero.is-black .title{color:#fff}.hero.is-black .subtitle{color:rgba(255,255,255,0.9)}.hero.is-black .subtitle a,.hero.is-black .subtitle strong{color:#fff}.hero.is-black .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-black .nav-menu{background-color:#0a0a0a}}.hero.is-black a.nav-item,.hero.is-black .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-black a.nav-item:hover,.hero.is-black a.nav-item.is-active,.hero.is-black .nav-item a:not(.button):hover,.hero.is-black .nav-item a:not(.button).is-active{color:#fff}.hero.is-black .tabs a{color:#fff;opacity:0.9}.hero.is-black .tabs a:hover{opacity:1}.hero.is-black .tabs li.is-active a{opacity:1}.hero.is-black .tabs.is-boxed a,.hero.is-black .tabs.is-toggle a{color:#fff}.hero.is-black .tabs.is-boxed a:hover,.hero.is-black .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-black .tabs.is-boxed li.is-active a,.hero.is-black .tabs.is-boxed li.is-active a:hover,.hero.is-black .tabs.is-toggle li.is-active a,.hero.is-black .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#0a0a0a}.hero.is-black.is-bold{background-image:linear-gradient(141deg, #000 0%, #0a0a0a 71%, #181616 100%)}@media screen and (max-width: 768px){.hero.is-black .nav-toggle span{background-color:#fff}.hero.is-black .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-black .nav-toggle.is-active span{background-color:#fff}.hero.is-black .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-light{background-color:#f5f5f5;color:#363636}.hero.is-light a,.hero.is-light strong{color:inherit}.hero.is-light .title{color:#363636}.hero.is-light .subtitle{color:rgba(54,54,54,0.9)}.hero.is-light .subtitle a,.hero.is-light .subtitle strong{color:#363636}.hero.is-light .nav{box-shadow:0 1px 0 rgba(54,54,54,0.2)}@media screen and (max-width: 768px){.hero.is-light .nav-menu{background-color:#f5f5f5}}.hero.is-light a.nav-item,.hero.is-light .nav-item a:not(.button){color:rgba(54,54,54,0.7)}.hero.is-light a.nav-item:hover,.hero.is-light a.nav-item.is-active,.hero.is-light .nav-item a:not(.button):hover,.hero.is-light .nav-item a:not(.button).is-active{color:#363636}.hero.is-light .tabs a{color:#363636;opacity:0.9}.hero.is-light .tabs a:hover{opacity:1}.hero.is-light .tabs li.is-active a{opacity:1}.hero.is-light .tabs.is-boxed a,.hero.is-light .tabs.is-toggle a{color:#363636}.hero.is-light .tabs.is-boxed a:hover,.hero.is-light .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-light .tabs.is-boxed li.is-active a,.hero.is-light .tabs.is-boxed li.is-active a:hover,.hero.is-light .tabs.is-toggle li.is-active a,.hero.is-light .tabs.is-toggle li.is-active a:hover{background-color:#363636;border-color:#363636;color:#f5f5f5}.hero.is-light.is-bold{background-image:linear-gradient(141deg, #dfd8d8 0%, #f5f5f5 71%, #fff 100%)}@media screen and (max-width: 768px){.hero.is-light .nav-toggle span{background-color:#363636}.hero.is-light .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-light .nav-toggle.is-active span{background-color:#363636}.hero.is-light .nav-menu .nav-item{border-top-color:rgba(54,54,54,0.2)}}.hero.is-dark{background-color:#363636;color:#f5f5f5}.hero.is-dark a,.hero.is-dark strong{color:inherit}.hero.is-dark .title{color:#f5f5f5}.hero.is-dark .subtitle{color:rgba(245,245,245,0.9)}.hero.is-dark .subtitle a,.hero.is-dark .subtitle strong{color:#f5f5f5}.hero.is-dark .nav{box-shadow:0 1px 0 rgba(245,245,245,0.2)}@media screen and (max-width: 768px){.hero.is-dark .nav-menu{background-color:#363636}}.hero.is-dark a.nav-item,.hero.is-dark .nav-item a:not(.button){color:rgba(245,245,245,0.7)}.hero.is-dark a.nav-item:hover,.hero.is-dark a.nav-item.is-active,.hero.is-dark .nav-item a:not(.button):hover,.hero.is-dark .nav-item a:not(.button).is-active{color:#f5f5f5}.hero.is-dark .tabs a{color:#f5f5f5;opacity:0.9}.hero.is-dark .tabs a:hover{opacity:1}.hero.is-dark .tabs li.is-active a{opacity:1}.hero.is-dark .tabs.is-boxed a,.hero.is-dark .tabs.is-toggle a{color:#f5f5f5}.hero.is-dark .tabs.is-boxed a:hover,.hero.is-dark .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-dark .tabs.is-boxed li.is-active a,.hero.is-dark .tabs.is-boxed li.is-active a:hover,.hero.is-dark .tabs.is-toggle li.is-active a,.hero.is-dark .tabs.is-toggle li.is-active a:hover{background-color:#f5f5f5;border-color:#f5f5f5;color:#363636}.hero.is-dark.is-bold{background-image:linear-gradient(141deg, #1f1919 0%, #363636 71%, #463f3f 100%)}@media screen and (max-width: 768px){.hero.is-dark .nav-toggle span{background-color:#f5f5f5}.hero.is-dark .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-dark .nav-toggle.is-active span{background-color:#f5f5f5}.hero.is-dark .nav-menu .nav-item{border-top-color:rgba(245,245,245,0.2)}}.hero.is-primary{background-color:#182b73;color:#fff}.hero.is-primary a,.hero.is-primary strong{color:inherit}.hero.is-primary .title{color:#fff}.hero.is-primary .subtitle{color:rgba(255,255,255,0.9)}.hero.is-primary .subtitle a,.hero.is-primary .subtitle strong{color:#fff}.hero.is-primary .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-primary .nav-menu{background-color:#182b73}}.hero.is-primary a.nav-item,.hero.is-primary .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-primary a.nav-item:hover,.hero.is-primary a.nav-item.is-active,.hero.is-primary .nav-item a:not(.button):hover,.hero.is-primary .nav-item a:not(.button).is-active{color:#fff}.hero.is-primary .tabs a{color:#fff;opacity:0.9}.hero.is-primary .tabs a:hover{opacity:1}.hero.is-primary .tabs li.is-active a{opacity:1}.hero.is-primary .tabs.is-boxed a,.hero.is-primary .tabs.is-toggle a{color:#fff}.hero.is-primary .tabs.is-boxed a:hover,.hero.is-primary .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-primary .tabs.is-boxed li.is-active a,.hero.is-primary .tabs.is-boxed li.is-active a:hover,.hero.is-primary .tabs.is-toggle li.is-active a,.hero.is-primary .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#182b73}.hero.is-primary.is-bold{background-image:linear-gradient(141deg, #0b244d 0%, #182b73 71%, #181d8c 100%)}@media screen and (max-width: 768px){.hero.is-primary .nav-toggle span{background-color:#fff}.hero.is-primary .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-primary .nav-toggle.is-active span{background-color:#fff}.hero.is-primary .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-info{background-color:#3273dc;color:#fff}.hero.is-info a,.hero.is-info strong{color:inherit}.hero.is-info .title{color:#fff}.hero.is-info .subtitle{color:rgba(255,255,255,0.9)}.hero.is-info .subtitle a,.hero.is-info .subtitle strong{color:#fff}.hero.is-info .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-info .nav-menu{background-color:#3273dc}}.hero.is-info a.nav-item,.hero.is-info .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-info a.nav-item:hover,.hero.is-info a.nav-item.is-active,.hero.is-info .nav-item a:not(.button):hover,.hero.is-info .nav-item a:not(.button).is-active{color:#fff}.hero.is-info .tabs a{color:#fff;opacity:0.9}.hero.is-info .tabs a:hover{opacity:1}.hero.is-info .tabs li.is-active a{opacity:1}.hero.is-info .tabs.is-boxed a,.hero.is-info .tabs.is-toggle a{color:#fff}.hero.is-info .tabs.is-boxed a:hover,.hero.is-info .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-info .tabs.is-boxed li.is-active a,.hero.is-info .tabs.is-boxed li.is-active a:hover,.hero.is-info .tabs.is-toggle li.is-active a,.hero.is-info .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#3273dc}.hero.is-info.is-bold{background-image:linear-gradient(141deg, #1577c6 0%, #3273dc 71%, #4366e5 100%)}@media screen and (max-width: 768px){.hero.is-info .nav-toggle span{background-color:#fff}.hero.is-info .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-info .nav-toggle.is-active span{background-color:#fff}.hero.is-info .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-success{background-color:#23d160;color:#fff}.hero.is-success a,.hero.is-success strong{color:inherit}.hero.is-success .title{color:#fff}.hero.is-success .subtitle{color:rgba(255,255,255,0.9)}.hero.is-success .subtitle a,.hero.is-success .subtitle strong{color:#fff}.hero.is-success .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-success .nav-menu{background-color:#23d160}}.hero.is-success a.nav-item,.hero.is-success .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-success a.nav-item:hover,.hero.is-success a.nav-item.is-active,.hero.is-success .nav-item a:not(.button):hover,.hero.is-success .nav-item a:not(.button).is-active{color:#fff}.hero.is-success .tabs a{color:#fff;opacity:0.9}.hero.is-success .tabs a:hover{opacity:1}.hero.is-success .tabs li.is-active a{opacity:1}.hero.is-success .tabs.is-boxed a,.hero.is-success .tabs.is-toggle a{color:#fff}.hero.is-success .tabs.is-boxed a:hover,.hero.is-success .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-success .tabs.is-boxed li.is-active a,.hero.is-success .tabs.is-boxed li.is-active a:hover,.hero.is-success .tabs.is-toggle li.is-active a,.hero.is-success .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#23d160}.hero.is-success.is-bold{background-image:linear-gradient(141deg, #12af2f 0%, #23d160 71%, #2ce28a 100%)}@media screen and (max-width: 768px){.hero.is-success .nav-toggle span{background-color:#fff}.hero.is-success .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-success .nav-toggle.is-active span{background-color:#fff}.hero.is-success .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.hero.is-warning a,.hero.is-warning strong{color:inherit}.hero.is-warning .title{color:rgba(0,0,0,0.7)}.hero.is-warning .subtitle{color:rgba(0,0,0,0.9)}.hero.is-warning .subtitle a,.hero.is-warning .subtitle strong{color:rgba(0,0,0,0.7)}.hero.is-warning .nav{box-shadow:0 1px 0 rgba(0,0,0,0.2)}@media screen and (max-width: 768px){.hero.is-warning .nav-menu{background-color:#ffdd57}}.hero.is-warning a.nav-item,.hero.is-warning .nav-item a:not(.button){color:rgba(0,0,0,0.7)}.hero.is-warning a.nav-item:hover,.hero.is-warning a.nav-item.is-active,.hero.is-warning .nav-item a:not(.button):hover,.hero.is-warning .nav-item a:not(.button).is-active{color:rgba(0,0,0,0.7)}.hero.is-warning .tabs a{color:rgba(0,0,0,0.7);opacity:0.9}.hero.is-warning .tabs a:hover{opacity:1}.hero.is-warning .tabs li.is-active a{opacity:1}.hero.is-warning .tabs.is-boxed a,.hero.is-warning .tabs.is-toggle a{color:rgba(0,0,0,0.7)}.hero.is-warning .tabs.is-boxed a:hover,.hero.is-warning .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-warning .tabs.is-boxed li.is-active a,.hero.is-warning .tabs.is-boxed li.is-active a:hover,.hero.is-warning .tabs.is-toggle li.is-active a,.hero.is-warning .tabs.is-toggle li.is-active a:hover{background-color:rgba(0,0,0,0.7);border-color:rgba(0,0,0,0.7);color:#ffdd57}.hero.is-warning.is-bold{background-image:linear-gradient(141deg, #ffaf24 0%, #ffdd57 71%, #fffa70 100%)}@media screen and (max-width: 768px){.hero.is-warning .nav-toggle span{background-color:rgba(0,0,0,0.7)}.hero.is-warning .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-warning .nav-toggle.is-active span{background-color:rgba(0,0,0,0.7)}.hero.is-warning .nav-menu .nav-item{border-top-color:rgba(0,0,0,0.2)}}.hero.is-danger{background-color:red;color:#fff}.hero.is-danger a,.hero.is-danger strong{color:inherit}.hero.is-danger .title{color:#fff}.hero.is-danger .subtitle{color:rgba(255,255,255,0.9)}.hero.is-danger .subtitle a,.hero.is-danger .subtitle strong{color:#fff}.hero.is-danger .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-danger .nav-menu{background-color:red}}.hero.is-danger a.nav-item,.hero.is-danger .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-danger a.nav-item:hover,.hero.is-danger a.nav-item.is-active,.hero.is-danger .nav-item a:not(.button):hover,.hero.is-danger .nav-item a:not(.button).is-active{color:#fff}.hero.is-danger .tabs a{color:#fff;opacity:0.9}.hero.is-danger .tabs a:hover{opacity:1}.hero.is-danger .tabs li.is-active a{opacity:1}.hero.is-danger .tabs.is-boxed a,.hero.is-danger .tabs.is-toggle a{color:#fff}.hero.is-danger .tabs.is-boxed a:hover,.hero.is-danger .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-danger .tabs.is-boxed li.is-active a,.hero.is-danger .tabs.is-boxed li.is-active a:hover,.hero.is-danger .tabs.is-toggle li.is-active a,.hero.is-danger .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:red}.hero.is-danger.is-bold{background-image:linear-gradient(141deg, #c02 0%, red 71%, #ff401a 100%)}@media screen and (max-width: 768px){.hero.is-danger .nav-toggle span{background-color:#fff}.hero.is-danger .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-danger .nav-toggle.is-active span{background-color:#fff}.hero.is-danger .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}@media screen and (min-width: 769px){.hero.is-medium .hero-body{padding-bottom:9rem;padding-top:9rem}}@media screen and (min-width: 769px){.hero.is-large .hero-body{padding-bottom:18rem;padding-top:18rem}}.hero.is-fullheight{min-height:100vh}.hero.is-fullheight .hero-body{align-items:center;display:flex}.hero.is-fullheight .hero-body>.container{flex-grow:1;flex-shrink:1}.section{background-color:#fff;padding:3rem 1.5rem}@media screen and (min-width: 1000px){.section.is-medium{padding:9rem 1.5rem}.section.is-large{padding:18rem 1.5rem}}.footer{background-color:#f5f5f5;padding:3rem 1.5rem 6rem}.header.is-fixed-top{z-index:1030;position:fixed;top:0;left:0;right:0}.has-fixed-nav{margin-top:50px}.section.is-small{padding:1rem 1.5rem}.nav-inverse{background:#182b73}.nav-inverse a.nav-item{color:#f2f2f2}.nav-inverse a.nav-item:hover{color:#d1d5e3}.nav-inverse a.nav-item.is-active{color:#fff}.nav-inverse a.nav-item.is-tab:hover{border-bottom-color:#fff}.nav-inverse a.nav-item.is-tab.is-active{border-bottom:3px solid #fff;color:#fff}.nav-slider-container .nav-slider{position:fixed;top:0;bottom:0;z-index:1040;overflow-y:auto;text-align:center;background:#182b73;color:#fff;left:-250px;width:250px;transition:left 0.5s}.nav-slider-container .nav-slider.is-active{left:0}.nav-slider-container .nav-slider .nav-item{cursor:pointer;display:block;padding-top:10px;padding-bottom:9px;background:rgba(255,255,255,0.1)}.nav-slider-container .nav-slider .nav-item.is-active{background:linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1) 5%)}.nav-slider-container .nav-slider .nav-item[open]>summary{margin-bottom:9px}.nav-slider-container .nav-slider .nav-item:not(:last-child){border-bottom:1px solid #fff}.nav-slider-container .nav-slider ~ .is-overlay{background:rgba(0,0,0,0.5);z-index:1035;visibility:hidden;position:fixed;opacity:0;transition:opacity 0.75s}.nav-slider-container .nav-slider.is-active ~ .is-overlay{visibility:visible;opacity:1}#container>div:not(.visible){display:none}\n" +
    '</style>';

// Show the menu when clicking on the menu button
Array.from(document.querySelectorAll('.nav-slider-toggle'))
    .forEach(el => el.addEventListener('click', toggleMenu));

// Hide the menu when clicking the overlay
document.querySelector('.nav-slider-container .is-overlay').addEventListener('click', toggleMenu);

// Change tabs
document.querySelector('.nav-slider-container .nav-slider').addEventListener('click', function globalTabChange(event) {
    var tabName = event.target.dataset.tabName;
    var tab = document.querySelector(`#container > [data-tab-name=${tabName}]`);
    if(!tabName || !tab) {
        return;
    }

    //Content
    //We can't just remove the first due to browser lag
    Array.from(document.querySelectorAll('#container > .visible'))
        .forEach(el => el.classList.remove('visible'));
    tab.classList.add('visible');

    //Tabs
    Array.from(document.querySelectorAll('.nav-slider-container .nav-slider .is-active'))
        .forEach(el => el.classList.remove('is-active'));
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
function addTab(tabText, groupName = 'main') {
    var tabName = 'botTab_' + tabUID++;

    var tab = document.createElement('span');
    tab.textContent = tabText;
    tab.classList.add('nav-item');
    tab.dataset.tabName = tabName;

    var tabContent = document.createElement('div');
    tabContent.dataset.tabName = tabName;

    document.querySelector(`.nav-slider-container [data-tab-group=${groupName}]`).appendChild(tab);
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
    document.querySelector(`.nav-slider-container [data-tab-name=${tabContent.dataset.tabName}]`).remove();
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
function addTabGroup(text, groupName, parent = 'main') {
    var details = document.createElement('details');
    details.classList.add('nav-item');
    details.dataset.tabGroup = groupName;

    var summary = document.createElement('summary');
    summary.textContent = text;
    details.appendChild(summary);

    document.querySelector(`.nav-slider-container [data-tab-group="${parent}"]`).appendChild(details);
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
    var group = document.querySelector(`.nav-slider-container [data-tab-group="${groupName}"]`);
    var items = Array.from(group.querySelectorAll('span'));

    items.forEach(item => {
        //Tab content
        document.querySelector(`#container > [data-tab-name="${item.dataset.tabName}"]`).remove();
    });

    group.remove();
}

module.exports = {
    toggleMenu,
    addTab,
    removeTab,
    addTabGroup,
    removeTabGroup,
};

},{"libraries/hook":11}],30:[function(require,module,exports){
module.exports = {
    alert
};

/**
* Function used to require action from the user.
*
* @param {string} text the text to display in the alert
* @param {Array} buttons an array of buttons to add to the alert.
*        Format: [{text: 'Test', style:'success', action: function(){}, thisArg: window, dismiss: false}]
*        Note: text is the only required paramater. If no button array is specified
*        then a single OK button will be shown.
*         Provided styles: success, danger, warning, info
*        Defaults: style: '', action: undefined, thisArg: undefined, dismiss: true
*/
function alert(text, buttons = [{text: 'OK'}]) {
    if (instance.active) {
        instance.queue.push({text, buttons});
        return;
    }
    instance.active = true;

    buttons.forEach(function(button, i) {
        button.dismiss = (button.dismiss === false) ? false : true;
        instance.buttons['button_' + i] = {
            action: button.action,
            thisArg: button.thisArg || undefined,
            dismiss: typeof button.dismiss == 'boolean' ? button.dismiss : true,
        };
        button.id = 'button_' + i;
        buildButton(button);
    });
    document.querySelector('#alertContent').innerHTML = text;

    document.querySelector('#alert ~ .overlay').classList.add('visible');
    document.querySelector('#alert').classList.add('visible');
}

/**
 * Holds the current alert and queue of further alerts.
 */
var instance = {
    active: false,
    queue: [],
    buttons: {},
};

/**
 * Internal function used to add button elements to an alert.
 *
 * @param {Object} button
 */
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
        document.querySelector('#alert').classList.remove('visible');
        document.querySelector('#alert ~ .overlay').classList.remove('visible');
        document.querySelector('#alert .buttons').innerHTML = '';
        instance.buttons = {};
        instance.active = false;

        // Are more alerts waiting to be shown?
        if (instance.queue.length) {
            let next = instance.queue.shift();
            alert(next.text, next.buttons);
        }
    }
}

},{}],31:[function(require,module,exports){


Object.assign(
    module.exports,
    require('./alert'),
    require('./notify')
);

var el = document.createElement('style');
el.innerHTML = "";
document.head.appendChild(el);

el = document.createElement('div');
el.id = 'alertWrapper';
el.innerHTML = "<div id=\"alert\">\r\n    <div id=\"alertContent\"></div>\r\n    <div class=\"buttons\"/></div>\r\n</div>\r\n<div class=\"overlay\"/></div>\r\n";

document.body.appendChild(el);

},{"./alert":30,"./notify":32}],32:[function(require,module,exports){
module.exports = {
    notify,
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
 * @param String text the text to display. Should be kept short to avoid visually blocking the menu on small devices.
 * @param Number displayTime the number of seconds to show the notification for.
 */
function notify(text, displayTime = 2) {
    var el = document.createElement('div');
    el.classList.add('notification');
    el.classList.add('visible');
    el.textContent = text;
    document.body.appendChild(el);

    el.addEventListener('click', function() {
        this.remove();
    });

    setTimeout(function() {
        this.classList.remove('visible');
    }.bind(el), displayTime * 1000);

    setTimeout(function() {
        if (this.parentNode) {
            this.remove();
        }
    }.bind(el), displayTime * 1000 + 2100);
}

},{}],33:[function(require,module,exports){
//Details polyfill, older firefox, IE
if (!('open' in document.createElement('details'))) {
    let style = document.createElement('style');
    style.textContent += `details:not([open]) > :not(summary) { display: none !important; } details > summary:before { content: "▶"; display: inline-block; font-size: .8em; width: 1.5em; font-family:"Courier New"; } details[open] > summary:before { transform: rotate(90deg); }`;
    document.head.appendChild(style);

    window.addEventListener('click', function(event) {
        if (event.target.tagName == 'SUMMARY') {
            let details = event.target.parentNode;

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
// IE Fix

module.exports = function(template) {
    if (!('content' in template)) {
        let content = template.childNodes;
        let fragment = document.createDocumentFragment();

        for (let j = 0; j < content.length; j++) {
            fragment.appendChild(content[j]);
        }

        template.content = fragment;
    }
};

},{}],35:[function(require,module,exports){
module.exports = {
    buildContentFromTemplate,
};

var polyfill = require('ui/polyfills/template');

/**
 * Function used to clone a template after altering the provided rules.
 *
 * @example
 * ui.buildContentFromTemplate('#template', '#target', [{selector: 'input', value: 'Value'}]);
 * ui.buildContentFromTemplate('template', 'div', [{selector: 'a', remove: ['href'], multiple: true}]);
 * @param {string} templateSelector
 * @param {string} targetSelector
 * @param {array} rules format: array of objects
 *      each object must have "selector".
 *      each object can have "multiple" set to update all matching elements.
 *      each object can have "remove" - an array of attributes to remove.
 *      each object can have "text" or "html" - further keys will be set as attributes.
 *      if both text and html are set, text will take precendence.
 *      rules will be parsed in the order that they are present in the array.
 */
function buildContentFromTemplate(templateSelector, targetSelector, rules = []) {
    var template = document.querySelector(templateSelector);

    polyfill(template);

    var content = template.content;

    rules.forEach(rule => handleRule(content, rule));

    document.querySelector(targetSelector).appendChild(document.importNode(content, true));
}

/**
 * Internal function to apply rules to the template.
 *
 * @param {Node} content - the content of the template.
 * @param {Object} rule - the rule to apply.
 */
function handleRule(content, rule) {
    if (rule.multiple) {
        let els = content.querySelectorAll(rule.selector);

        Array.from(els)
            .forEach(el => updateElement(el, rule));
    } else {
        let el = content.querySelector(rule.selector);
        if (!el) {
            console.warn(`Unable to update ${rule.selector}.`, rule);
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

    Object.keys(rule)
        .filter(key => !['selector', 'text', 'html', 'remove', 'multiple'].includes(key))
        .forEach(key => el.setAttribute(key, rule[key]));

    if (Array.isArray(rule.remove)) {
        rule.remove.forEach(key => el.removeAttribute(key));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvTWVzc2FnZUJvdEV4dGVuc2lvbi5qcyIsImRldi9ib3QvY2hlY2tHcm91cC5qcyIsImRldi9ib3QvaW5kZXguanMiLCJkZXYvYm90L21pZ3JhdGlvbi5qcyIsImRldi9ib3Qvc2VuZC5qcyIsImRldi9jb25zb2xlL2V4cG9ydHMuanMiLCJkZXYvY29uc29sZS9pbmRleC5qcyIsImRldi9saWJyYXJpZXMvYWpheC5qcyIsImRldi9saWJyYXJpZXMvYmhmYW5zYXBpLmpzIiwiZGV2L2xpYnJhcmllcy9ibG9ja2hlYWRzLmpzIiwiZGV2L2xpYnJhcmllcy9ob29rLmpzIiwiZGV2L2xpYnJhcmllcy9zdG9yYWdlLmpzIiwiZGV2L2xpYnJhcmllcy93b3JsZC5qcyIsImRldi9tZXNzYWdlcy9hbm5vdW5jZW1lbnRzL2luZGV4LmpzIiwiZGV2L21lc3NhZ2VzL2hlbHBlcnMvYnVpbGRNZXNzYWdlLmpzIiwiZGV2L21lc3NhZ2VzL2hlbHBlcnMvY2hlY2tKb2luc0FuZEdyb3VwLmpzIiwiZGV2L21lc3NhZ2VzL2hlbHBlcnMvaW5kZXguanMiLCJkZXYvbWVzc2FnZXMvaGVscGVycy9zaG93U3VtbWFyeS5qcyIsImRldi9tZXNzYWdlcy9pbmRleC5qcyIsImRldi9tZXNzYWdlcy9qb2luL2luZGV4LmpzIiwiZGV2L21lc3NhZ2VzL2xlYXZlL2luZGV4LmpzIiwiZGV2L21lc3NhZ2VzL3RyaWdnZXIvaW5kZXguanMiLCJkZXYvc2V0dGluZ3MvYm90L2luZGV4LmpzIiwiZGV2L3NldHRpbmdzL2JvdC9wYWdlLmpzIiwiZGV2L3NldHRpbmdzL2V4dGVuc2lvbnMvaW5kZXguanMiLCJkZXYvc2V0dGluZ3MvaW5kZXguanMiLCJkZXYvc3RhcnQuanMiLCJkZXYvdWkvaW5kZXguanMiLCJkZXYvdWkvbGF5b3V0L2luZGV4LmpzIiwiZGV2L3VpL25vdGlmaWNhdGlvbnMvYWxlcnQuanMiLCJkZXYvdWkvbm90aWZpY2F0aW9ucy9pbmRleC5qcyIsImRldi91aS9ub3RpZmljYXRpb25zL25vdGlmeS5qcyIsImRldi91aS9wb2x5ZmlsbHMvZGV0YWlscy5qcyIsImRldi91aS9wb2x5ZmlsbHMvdGVtcGxhdGUuanMiLCJkZXYvdWkvdGVtcGxhdGUuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9jb25zb2xlLWJyb3dzZXJpZnkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZGF0ZS1ub3cvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMWVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IGJvdCA9IHJlcXVpcmUoJ2JvdCcpO1xyXG5jb25zdCBib3RfY29uc29sZSA9IHJlcXVpcmUoJy4vY29uc29sZScpO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBhamF4ID0gcmVxdWlyZSgnbGlicmFyaWVzL2FqYXgnKTtcclxuY29uc3QgYXBpID0gcmVxdWlyZSgnbGlicmFyaWVzL2Jsb2NraGVhZHMnKTtcclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcblxyXG4vLyBBcnJheSBvZiBJRHMgdG8gYXV0b2xvYWQgYXQgdGhlIG5leHQgbGF1bmNoLlxyXG52YXIgYXV0b2xvYWQgPSBbXTtcclxudmFyIGxvYWRlZCA9IFtdO1xyXG5jb25zdCBTVE9SQUdFX0lEID0gJ21iX2V4dGVuc2lvbnMnO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGNyZWF0ZSBhIG5ldyBleHRlbnNpb24uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB0ZXN0ID0gTWVzc2FnZUJvdEV4dGVuc2lvbigndGVzdCcpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZXNwYWNlIC0gU2hvdWxkIGJlIHRoZSBzYW1lIGFzIHlvdXIgdmFyaWFibGUgbmFtZS5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gW3VuaW5zdGFsbCA9IHVuZGVmaW5lZF0gLSBPcHRpb25hbCwgc3BlY2lmeSB0aGUgdW5pbnN0YWxsIGZ1bmN0aW9uIHdoaWxlIGNyZWF0aW5nIHRoZSBleHRlbnNpb24sIGluc3RlYWQgb2YgbGF0ZXIuIElmIHNwZWNpZmllZCBoZXJlLCB0aGlzIHdpbGwgYmUgYm91bmQgdG8gdGhlIGV4dGVuc2lvbi5cclxuICogQHJldHVybiB7TWVzc2FnZUJvdEV4dGVuc2lvbn0gLSBUaGUgZXh0ZW5zaW9uIHZhcmlhYmxlLlxyXG4gKi9cclxuZnVuY3Rpb24gTWVzc2FnZUJvdEV4dGVuc2lvbihuYW1lc3BhY2UsIHVuaW5zdGFsbCkge1xyXG4gICAgbG9hZGVkLnB1c2gobmFtZXNwYWNlKTtcclxuICAgIGhvb2suZmlyZSgnZXh0ZW5zaW9uLmluc3RhbGwnLCBuYW1lc3BhY2UpO1xyXG5cclxuICAgIHZhciBleHRlbnNpb24gPSB7XHJcbiAgICAgICAgaWQ6IG5hbWVzcGFjZSxcclxuICAgICAgICBib3QsXHJcbiAgICAgICAgY29uc29sZTogYm90X2NvbnNvbGUsXHJcbiAgICAgICAgdWksXHJcbiAgICAgICAgc3RvcmFnZSxcclxuICAgICAgICBhamF4LFxyXG4gICAgICAgIGFwaSxcclxuICAgICAgICB3b3JsZCxcclxuICAgICAgICBob29rLFxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAodHlwZW9mIHVuaW5zdGFsbCA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgZXh0ZW5zaW9uLnVuaW5zdGFsbCA9IHVuaW5zdGFsbC5iaW5kKGV4dGVuc2lvbik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVc2VkIHRvIGNoYW5nZSB3aGV0aGVyIG9yIG5vdCB0aGUgZXh0ZW5zaW9uIHdpbGwgYmVcclxuICAgICAqIEF1dG9tYXRpY2FsbHkgbG9hZGVkIHRoZSBuZXh0IHRpbWUgdGhlIGJvdCBpcyBsYXVuY2hlZC5cclxuICAgICAqXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogdmFyIHRlc3QgPSBNZXNzYWdlQm90RXh0ZW5zaW9uKCd0ZXN0Jyk7XHJcbiAgICAgKiB0ZXN0LnNldEF1dG9MYXVuY2godHJ1ZSk7XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2x9IHNob3VsZEF1dG9sb2FkXHJcbiAgICAgKi9cclxuICAgIGV4dGVuc2lvbi5zZXRBdXRvTGF1bmNoID0gZnVuY3Rpb24gc2V0QXV0b0xhdW5jaChzaG91bGRBdXRvbG9hZCkge1xyXG4gICAgICAgIGlmICghYXV0b2xvYWQuaW5jbHVkZXMobmFtZXNwYWNlKSAmJiBzaG91bGRBdXRvbG9hZCkge1xyXG4gICAgICAgICAgICBhdXRvbG9hZC5wdXNoKG5hbWVzcGFjZSk7XHJcbiAgICAgICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGF1dG9sb2FkLCBmYWxzZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmICghc2hvdWxkQXV0b2xvYWQpIHtcclxuICAgICAgICAgICAgaWYgKGF1dG9sb2FkLmluY2x1ZGVzKG5hbWVzcGFjZSkpIHtcclxuICAgICAgICAgICAgICAgIGF1dG9sb2FkLnNwbGljZShhdXRvbG9hZC5pbmRleE9mKG5hbWVzcGFjZSksIDEpO1xyXG4gICAgICAgICAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgYXV0b2xvYWQsIGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIGV4dGVuc2lvbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRyaWVzIHRvIGxvYWQgdGhlIHJlcXVlc3RlZCBleHRlbnNpb24gYnkgSUQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxyXG4gKi9cclxuTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsID0gZnVuY3Rpb24gaW5zdGFsbChpZCkge1xyXG4gICAgaWYgKCFsb2FkZWQuaW5jbHVkZXMoaWQpKSB7XHJcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XHJcbiAgICAgICAgZWwuc3JjID0gYC8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvZXh0ZW5zaW9uLyR7aWR9L2NvZGUvcmF3YDtcclxuICAgICAgICBlbC5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xyXG4gICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVuaW5zdGFsbHMgYW4gZXh0ZW5zaW9uLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcclxuICovXHJcbk1lc3NhZ2VCb3RFeHRlbnNpb24udW5pbnN0YWxsID0gZnVuY3Rpb24gdW5pbnN0YWxsKGlkKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdpbmRvd1tpZF0udW5pbnN0YWxsKCk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgLy9Ob3QgaW5zdGFsbGVkLCBvciBubyB1bmluc3RhbGwgZnVuY3Rpb24uXHJcbiAgICB9XHJcblxyXG4gICAgd2luZG93W2lkXSA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICBpZiAoYXV0b2xvYWQuaW5jbHVkZXMoaWQpKSB7XHJcbiAgICAgICAgYXV0b2xvYWQuc3BsaWNlKGF1dG9sb2FkLmluZGV4T2YoaWQpLCAxKTtcclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBhdXRvbG9hZCwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChsb2FkZWQuaW5jbHVkZXMoaWQpKSB7XHJcbiAgICAgICAgbG9hZGVkLnNwbGljZShsb2FkZWQuaW5kZXhPZihpZCksIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIGhvb2suZmlyZSgnZXh0ZW5zaW9uLnVuaW5zdGFsbCcsIGlkKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGNoZWNrIGlmIGFuIGV4dGVuc2lvbiBoYXMgYmVlbiBsb2FkZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuTWVzc2FnZUJvdEV4dGVuc2lvbi5pc0xvYWRlZCA9IGZ1bmN0aW9uIGlzTG9hZGVkKGlkKSB7XHJcbiAgICByZXR1cm4gbG9hZGVkLmluY2x1ZGVzKGlkKTtcclxufTtcclxuXHJcbi8vIExvYWQgZXh0ZW5zaW9ucyB0aGF0IHNldCB0aGVtc2VsdmVzIHRvIGF1dG9sb2FkIGxhc3QgbGF1bmNoLlxyXG5zdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSwgZmFsc2UpXHJcbiAgICAuZm9yRWFjaChNZXNzYWdlQm90RXh0ZW5zaW9uLmluc3RhbGwpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNZXNzYWdlQm90RXh0ZW5zaW9uO1xyXG4iLCIvKipcclxuICogQGZpbGUgRGVwcmljYXRlZC4gVXNlIHdvcmxkLmlzW0dyb3VwXSBpbnN0ZWFkLlxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgY2hlY2tHcm91cFxyXG59O1xyXG5cclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBjaGVjayBpZiB1c2VycyBhcmUgaW4gZGVmaW5lZCBncm91cHMuXHJcbiAqXHJcbiAqIEBkZXByaWNhdGVkXHJcbiAqIEBleGFtcGxlXHJcbiAqIGNoZWNrR3JvdXAoJ2FkbWluJywgJ1NFUlZFUicpIC8vIHRydWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwIHRoZSBncm91cCB0byBjaGVja1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdXNlciB0byBjaGVja1xyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tHcm91cChncm91cCwgbmFtZSkge1xyXG4gICAgY29uc29sZS53YXJuKCdib3QuY2hlY2tHcm91cCBpcyBkZXByaWNhdGVkLiBVc2Ugd29ybGQuaXNBZG1pbiwgd29ybGQuaXNNb2QsIGV0Yy4gaW5zdGVhZCcpO1xyXG5cclxuICAgIG5hbWUgPSBuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICBzd2l0Y2ggKGdyb3VwLnRvTG9jYWxlTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICBjYXNlICdhbGwnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNQbGF5ZXIobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnYWRtaW4nOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNBZG1pbihuYW1lKTtcclxuICAgICAgICBjYXNlICdtb2QnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNNb2QobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnc3RhZmYnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNTdGFmZihuYW1lKTtcclxuICAgICAgICBjYXNlICdvd25lcic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc093bmVyKG5hbWUpO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG4iLCJjb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuXHJcbmNvbnN0IGJvdCA9IE9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vc2VuZCcpLFxyXG4gICAgcmVxdWlyZSgnLi9jaGVja0dyb3VwJylcclxuKTtcclxuXHJcbmJvdC52ZXJzaW9uID0gJzYuMS4wYSc7XHJcblxyXG4vKipcclxuICogQGRlcHJpY2F0ZWQgc2luY2UgNi4xLjAuIFVzZSBleC53b3JsZCBpbnN0ZWFkLlxyXG4gKi9cclxuYm90LndvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5zdG9yYWdlLnNldCgnbWJfdmVyc2lvbicsIGJvdC52ZXJzaW9uKTtcclxuIiwiZnVuY3Rpb24gdXBkYXRlKGtleXMsIG9wZXJhdG9yKSB7XHJcbiAgICBPYmplY3Qua2V5cyhsb2NhbFN0b3JhZ2UpLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IG9mIGtleXMpIHtcclxuICAgICAgICAgICAgaWYgKGl0ZW0uc3RhcnRzV2l0aChrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShpdGVtLCBvcGVyYXRvcihsb2NhbFN0b3JhZ2UuZ2V0SXRlbShpdGVtKSkpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy9qc2hpbnQgLVcwODZcclxuLy9ObyBicmVhayBzdGF0ZW1lbnRzIGFzIHdlIHdhbnQgdG8gZXhlY3V0ZSBhbGwgdXBkYXRlcyBhZnRlciBtYXRjaGVkIHZlcnNpb24gdW5sZXNzIG90aGVyd2lzZSBub3RlZC5cclxuc3dpdGNoIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnbWJfdmVyc2lvbicpKSB7XHJcbiAgICBjYXNlIG51bGw6XHJcbiAgICAgICAgYnJlYWs7IC8vTm90aGluZyB0byBtaWdyYXRlXHJcbiAgICBjYXNlICc1LjIuMCc6XHJcbiAgICBjYXNlICc1LjIuMSc6XHJcbiAgICAgICAgLy9XaXRoIDYuMCwgbmV3bGluZXMgYXJlIGRpcmVjdGx5IHN1cHBvcnRlZCBpbiBtZXNzYWdlcyBieSB0aGUgYm90LlxyXG4gICAgICAgIHVwZGF0ZShbJ2Fubm91bmNlbWVudEFycicsICdqb2luQXJyJywgJ2xlYXZlQXJyJywgJ3RyaWdnZXJBcnInXSwgZnVuY3Rpb24ocmF3KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VkID0gSlNPTi5wYXJzZShyYXcpO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobXNnLm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbXNnLm1lc3NhZ2UgPSBtc2cubWVzc2FnZS5yZXBsYWNlKC9cXFxcbi9nLCAnXFxuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocGFyc2VkKTtcclxuICAgICAgICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYnJlYWs7IC8vTmV4dCBidWdmaXggb25seSByZWxhdGVzIHRvIDYuMCBib3QuXHJcbiAgICBjYXNlICc2LjAuMGEnOlxyXG4gICAgY2FzZSAnNi4wLjAnOlxyXG4gICAgICAgIGFsZXJ0KFwiRHVlIHRvIGEgYnVnIGluIHRoZSA2LjAuMCB2ZXJzaW9uIG9mIHRoZSBib3QsIHlvdXIgam9pbiBhbmQgbGVhdmUgbWVzc2FnZXMgbWF5IGJlIHN3YXBwZWQuIFNvcnJ5ISBUaGlzIGNhbm5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5LiBUaGlzIG1lc3NhZ2Ugd2lsbCBub3QgYmUgc2hvd24gYWdhaW4uXCIpO1xyXG4gICAgICAgIGJyZWFrOyAvL05leHQgYnVnZml4IG9ubHkgcmVsYXRlcyB0byA2LjAuMSAvIDYuMC4yLlxyXG4gICAgY2FzZSAnNi4wLjEnOlxyXG4gICAgY2FzZSAnNi4wLjInOlxyXG4gICAgICAgIGFsZXJ0KFwiRHVlIHRvIGEgYnVnIGluIDYuMC4xIC8gNi4wLjIsIGdyb3VwcyBtYXkgaGF2ZSBiZWVuIG1peGVkIHVwIG9uIEpvaW4sIExlYXZlLCBhbmQgVHJpZ2dlciBtZXNzYWdlcy4gU29ycnkhIFRoaXMgY2Fubm90IGJlIGZpeGVkIGF1dG9tYXRpY2FsbHkgaWYgaXQgb2NjdXJlZCBvbiB5b3VyIGJvdC4gQW5ub3VuY2VtZW50cyBoYXZlIGFsc28gYmVlbiBmaXhlZC5cIik7XHJcbiAgICBjYXNlICc2LjAuMyc6XHJcbiAgICBjYXNlICc2LjAuNCc6XHJcbiAgICBjYXNlICc2LjAuNSc6XHJcbiAgICBjYXNlICc2LjAuNic6XHJcbiAgICBjYXNlICc2LjEuMGEnOlxyXG4gICAgICAgIC8vTm9ybWFsaXplIGdyb3VwcyB0byBsb3dlciBjYXNlLlxyXG4gICAgICAgIHVwZGF0ZShbJ2pvaW5BcnInLCAnbGVhdmVBcnInLCAndHJpZ2dlckFyciddLCBmdW5jdGlvbihyYXcpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGxldCBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdyk7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIG1zZy5ncm91cCA9IG1zZy5ncm91cC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1zZy5ub3RfZ3JvdXAgPSBtc2cubm90X2dyb3VwLnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXJzZWQpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbn1cclxuLy9qc2hpbnQgK1cwODZcclxuIiwidmFyIGFwaSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ibG9ja2hlYWRzJyk7XHJcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJ3NldHRpbmdzL2JvdCcpO1xyXG5cclxudmFyIHF1ZXVlID0gW107XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNlbmQsXHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBxdWV1ZSBhIG1lc3NhZ2UgdG8gYmUgc2VudC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2VuZCgnSGVsbG8hJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIGJlIHNlbnQuXHJcbiAqL1xyXG5mdW5jdGlvbiBzZW5kKG1lc3NhZ2UpIHtcclxuICAgIGlmIChzZXR0aW5ncy5zcGxpdE1lc3NhZ2VzKSB7XHJcbiAgICAgICAgLy9GSVhNRTogSWYgdGhlIGJhY2tzbGFzaCBiZWZvcmUgdGhlIHRva2VuIGlzIGVzY2FwZWQgYnkgYW5vdGhlciBiYWNrc2xhc2ggdGhlIHRva2VuIHNob3VsZCBzdGlsbCBzcGxpdCB0aGUgbWVzc2FnZS5cclxuICAgICAgICBsZXQgc3RyID0gbWVzc2FnZS5zcGxpdChzZXR0aW5ncy5zcGxpdFRva2VuKTtcclxuICAgICAgICBsZXQgdG9TZW5kID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBjdXJyID0gc3RyW2ldO1xyXG4gICAgICAgICAgICBpZiAoY3VycltjdXJyLmxlbmd0aCAtIDFdID09ICdcXFxcJyAmJiBpIDwgc3RyLmxlbmd0aCArIDEpIHtcclxuICAgICAgICAgICAgICAgIGN1cnIgKz0gc2V0dGluZ3Muc3BsaXRUb2tlbiArIHN0clsrK2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRvU2VuZC5wdXNoKGN1cnIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TZW5kLmZvckVhY2gobXNnID0+IHF1ZXVlLnB1c2gobXNnKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHF1ZXVlLnB1c2gobWVzc2FnZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBXYXRjaGVzIHRoZSBxdWV1ZSBmb3IgbmV3IG1lc3NhZ2VzIHRvIHNlbmQgYW5kIHNlbmRzIHRoZW0gYXMgc29vbiBhcyBwb3NzaWJsZS5cclxuICovXHJcbihmdW5jdGlvbiBjaGVja1F1ZXVlKCkge1xyXG4gICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrUXVldWUsIDUwMCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGFwaS5zZW5kKHF1ZXVlLnNoaWZ0KCkpXHJcbiAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrUXVldWUsIDEwMDApO1xyXG4gICAgICAgIH0pO1xyXG59KCkpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHdyaXRlLFxyXG4gICAgY2xlYXJcclxufTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlKG1zZywgbmFtZSA9ICcnLCBuYW1lQ2xhc3MgPSAnJykge1xyXG4gICAgdmFyIG1zZ0VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgIGlmIChuYW1lQ2xhc3MpIHtcclxuICAgICAgICBtc2dFbC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgbmFtZUNsYXNzKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbmFtZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgbmFtZUVsLnRleHRDb250ZW50ID0gbmFtZTtcclxuXHJcbiAgICB2YXIgY29udGVudEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgaWYgKG5hbWUpIHtcclxuICAgICAgICBjb250ZW50RWwudGV4dENvbnRlbnQgPSBgOiAke21zZ31gO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjb250ZW50RWwudGV4dENvbnRlbnQgPSBtc2c7XHJcbiAgICB9XHJcbiAgICBtc2dFbC5hcHBlbmRDaGlsZChuYW1lRWwpO1xyXG4gICAgbXNnRWwuYXBwZW5kQ2hpbGQoY29udGVudEVsKTtcclxuXHJcbiAgICB2YXIgY2hhdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIHVsJyk7XHJcbiAgICBjaGF0LmFwcGVuZENoaWxkKG1zZ0VsKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xlYXIoKSB7XHJcbiAgICB2YXIgY2hhdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIHVsJyk7XHJcbiAgICBjaGF0LmlubmVySFRNTCA9ICcnO1xyXG59XHJcbiIsImNvbnN0IHNlbGYgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZXhwb3J0cycpO1xyXG5cclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcbmNvbnN0IHNlbmQgPSByZXF1aXJlKCdib3QnKS5zZW5kO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcblxyXG5cclxuXHJcbi8vIFRPRE86IFBhcnNlIHRoZXNlIGFuZCBwcm92aWRlIG9wdGlvbnMgdG8gc2hvdy9oaWRlIGRpZmZlcmVudCBvbmVzLlxyXG5ob29rLm9uKCd3b3JsZC5vdGhlcicsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgIHNlbGYud3JpdGUobWVzc2FnZSwgdW5kZWZpbmVkLCAnb3RoZXInKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5tZXNzYWdlJywgZnVuY3Rpb24obmFtZSwgbWVzc2FnZSkge1xyXG4gICAgbGV0IG1zZ0NsYXNzID0gJ3BsYXllcic7XHJcbiAgICBpZiAod29ybGQuaXNTdGFmZihuYW1lKSkge1xyXG4gICAgICAgIG1zZ0NsYXNzID0gJ3N0YWZmJztcclxuICAgICAgICBpZiAod29ybGQuaXNNb2QobmFtZSkpIHtcclxuICAgICAgICAgICAgbXNnQ2xhc3MgKz0gJyBtb2QnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vSGFzIHRvIGJlIGFkbWluXHJcbiAgICAgICAgICAgIG1zZ0NsYXNzICs9ICcgYWRtaW4nO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIG1zZ0NsYXNzICs9ICcgY29tbWFuZCc7XHJcbiAgICB9XHJcbiAgICBzZWxmLndyaXRlKG1lc3NhZ2UsIG5hbWUsIG1zZ0NsYXNzKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5zZXJ2ZXJjaGF0JywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgc2VsZi53cml0ZShtZXNzYWdlLCAnU0VSVkVSJywgJ2FkbWluJyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQuc2VuZCcsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIHNlbGYud3JpdGUobWVzc2FnZSwgJ1NFUlZFUicsICdhZG1pbiBjb21tYW5kJyk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy9NZXNzYWdlIGhhbmRsZXJzXHJcbmhvb2sub24oJ3dvcmxkLmpvaW4nLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJKb2luKG5hbWUsIGlwKSB7XHJcbiAgICBzZWxmLndyaXRlKGAke25hbWV9ICgke2lwfSkgaGFzIGpvaW5lZCB0aGUgc2VydmVyYCwgJ1NFUlZFUicsICdqb2luIHdvcmxkIGFkbWluJyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQubGVhdmUnLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJMZWF2ZShuYW1lKSB7XHJcbiAgICBzZWxmLndyaXRlKGAke25hbWV9IGhhcyBsZWZ0IHRoZSBzZXJ2ZXJgLCAnU0VSVkVSJywgYGxlYXZlIHdvcmxkIGFkbWluYCk7XHJcbn0pO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0NvbnNvbGUnKTtcclxuLy8gT3JkZXIgaXMgaW1wb3J0YW50IGhlcmUuXHJcblxyXG50YWIuaW5uZXJIVE1MID0gJzxzdHlsZT4nICtcclxuICAgIFwiI21iX2NvbnNvbGV7aGVpZ2h0OmNhbGMoMTAwJSAtIDUwcHgpfSNtYl9jb25zb2xlIC5tb2Q+c3BhbjpmaXJzdC1jaGlsZHtjb2xvcjojMDVmNTI5fSNtYl9jb25zb2xlIC5hZG1pbj5zcGFuOmZpcnN0LWNoaWxke2NvbG9yOiMyYjI2YmR9I21iX2NvbnNvbGUgLmNoYXR7bWFyZ2luOjFlbTttYXgtaGVpZ2h0OmNhbGMoMTAwdmggLSAzZW0gLSA1NXB4KTt3aWR0aDpjYWxjKDEwMHZ3IC0gMmVtKTtvdmVyZmxvdy15OmF1dG99I21iX2NvbnNvbGUgLmNoYXQtY29udHJvbHtwb3NpdGlvbjpmaXhlZDtib3R0b206MDt3aWR0aDoxMDB2d30jbWJfY29uc29sZSAuY2hhdC1jb250cm9sIC5jb250cm9se21hcmdpbjoxZW19XFxuXCIgK1xyXG4gICAgJzwvc3R5bGU+JyArXHJcbiAgICBcIjxkaXYgaWQ9XFxcIm1iX2NvbnNvbGVcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjaGF0XFxcIj5cXHJcXG4gICAgICAgIDx1bD48L3VsPlxcclxcbiAgICA8L2Rpdj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY2hhdC1jb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImNvbnRyb2wgaGFzLWFkZG9uc1xcXCI+XFxyXFxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcInRleHRcXFwiIGNsYXNzPVxcXCJpbnB1dCBpcy1leHBhbmRlZFxcXCIvPlxcclxcbiAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XFxcImlucHV0IGJ1dHRvbiBpcy1wcmltYXJ5XFxcIj5TRU5EPC9idXR0b24+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5cclxuLy8gQXV0byBzY3JvbGwgd2hlbiBuZXcgbWVzc2FnZXMgYXJlIGFkZGVkIHRvIHRoZSBwYWdlLCB1bmxlc3MgdGhlIG93bmVyIGlzIHJlYWRpbmcgb2xkIGNoYXQuXHJcbihuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiBzaG93TmV3Q2hhdCgpIHtcclxuICAgIGxldCBjb250YWluZXIgPSB0YWIucXVlcnlTZWxlY3RvcigndWwnKTtcclxuICAgIGxldCBsYXN0TGluZSA9IHRhYi5xdWVyeVNlbGVjdG9yKCdsaTpsYXN0LWNoaWxkJyk7XHJcblxyXG4gICAgaWYgKCFjb250YWluZXIgfHwgIWxhc3RMaW5lKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjb250YWluZXIuc2Nyb2xsSGVpZ2h0IC0gY29udGFpbmVyLmNsaWVudEhlaWdodCAtIGNvbnRhaW5lci5zY3JvbGxUb3AgPD0gbGFzdExpbmUuY2xpZW50SGVpZ2h0ICogMikge1xyXG4gICAgICAgIGxhc3RMaW5lLnNjcm9sbEludG9WaWV3KGZhbHNlKTtcclxuICAgIH1cclxufSkpLm9ic2VydmUodGFiLnF1ZXJ5U2VsZWN0b3IoJy5jaGF0JyksIHtjaGlsZExpc3Q6IHRydWV9KTtcclxuXHJcblxyXG4vLyBSZW1vdmUgb2xkIGNoYXQgdG8gcmVkdWNlIG1lbW9yeSB1c2FnZVxyXG4obmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gcmVtb3ZlT2xkQ2hhdCgpIHtcclxuICAgIHZhciBjaGF0ID0gdGFiLnF1ZXJ5U2VsZWN0b3IoJ3VsJyk7XHJcblxyXG4gICAgd2hpbGUgKGNoYXQuY2hpbGRyZW4ubGVuZ3RoID4gNTAwKSB7XHJcbiAgICAgICAgY2hhdC5jaGlsZHJlblswXS5yZW1vdmUoKTtcclxuICAgIH1cclxufSkpLm9ic2VydmUodGFiLnF1ZXJ5U2VsZWN0b3IoJy5jaGF0JyksIHtjaGlsZExpc3Q6IHRydWV9KTtcclxuXHJcbi8vIExpc3RlbiBmb3IgdGhlIHVzZXIgdG8gc2VuZCBtZXNzYWdlc1xyXG5mdW5jdGlvbiB1c2VyU2VuZCgpIHtcclxuICAgIHZhciBpbnB1dCA9IHRhYi5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xyXG4gICAgaG9vay5maXJlKCdjb25zb2xlLnNlbmQnLCBpbnB1dC52YWx1ZSk7XHJcbiAgICBzZW5kKGlucHV0LnZhbHVlKTtcclxuICAgIGlucHV0LnZhbHVlID0gJyc7XHJcbiAgICBpbnB1dC5mb2N1cygpO1xyXG59XHJcblxyXG50YWIucXVlcnlTZWxlY3RvcignaW5wdXQnKS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIGlmIChldmVudC5rZXkgPT0gXCJFbnRlclwiIHx8IGV2ZW50LmtleUNvZGUgPT0gMTMpIHtcclxuICAgICAgICB1c2VyU2VuZCgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbnRhYi5xdWVyeVNlbGVjdG9yKCdidXR0b24nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHVzZXJTZW5kKTtcclxuIiwiLy9UT0RPOiBVc2UgZmV0Y2hcclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIEdFVCBhIHBhZ2UuIFBhc3NlcyB0aGUgcmVzcG9uc2Ugb2YgdGhlIFhIUiBpbiB0aGUgcmVzb2x2ZSBwcm9taXNlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL3NlbmRzIGEgR0VUIHJlcXVlc3QgdG8gL3NvbWUvdXJsLnBocD9hPXRlc3RcclxuICogZ2V0KCcvc29tZS91cmwucGhwJywge2E6ICd0ZXN0J30pLnRoZW4oY29uc29sZS5sb2cpXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1N0clxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0KHVybCA9ICcvJywgcGFyYW1zID0ge30pIHtcclxuICAgIGlmIChPYmplY3Qua2V5cyhwYXJhbXMpLmxlbmd0aCkge1xyXG4gICAgICAgIHZhciBhZGRpdGlvbiA9IHVybFN0cmluZ2lmeShwYXJhbXMpO1xyXG4gICAgICAgIGlmICh1cmwuaW5jbHVkZXMoJz8nKSkge1xyXG4gICAgICAgICAgICB1cmwgKz0gYCYke2FkZGl0aW9ufWA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdXJsICs9IGA/JHthZGRpdGlvbn1gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geGhyKCdHRVQnLCB1cmwsIHt9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgSlNPTiBvYmplY3QgaW4gdGhlIHByb21pc2UgcmVzb2x2ZSBtZXRob2QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtT2JqXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRKU09OKHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIGdldCh1cmwsIHBhcmFtT2JqKS50aGVuKEpTT04ucGFyc2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIG1ha2UgYSBwb3N0IHJlcXVlc3RcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW1PYmpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHBvc3QodXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4geGhyKCdQT1NUJywgdXJsLCBwYXJhbU9iaik7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gZmV0Y2ggSlNPTiBmcm9tIGEgcGFnZSB0aHJvdWdoIHBvc3QuXHJcbiAqXHJcbiAqIEBwYXJhbSBzdHJpbmcgdXJsXHJcbiAqIEBwYXJhbSBzdHJpbmcgcGFyYW1PYmpcclxuICogQHJldHVybiBQcm9taXNlXHJcbiAqL1xyXG5mdW5jdGlvbiBwb3N0SlNPTih1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiBwb3N0KHVybCwgcGFyYW1PYmopLnRoZW4oSlNPTi5wYXJzZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuKiBIZWxwZXIgZnVuY3Rpb24gdG8gbWFrZSBYSFIgcmVxdWVzdHMsIGlmIHBvc3NpYmxlIHVzZSB0aGUgZ2V0IGFuZCBwb3N0IGZ1bmN0aW9ucyBpbnN0ZWFkLlxyXG4qXHJcbiogQGRlcHJpY2F0ZWQgc2luY2UgdmVyc2lvbiA2LjFcclxuKiBAcGFyYW0gc3RyaW5nIHByb3RvY29sXHJcbiogQHBhcmFtIHN0cmluZyB1cmxcclxuKiBAcGFyYW0gb2JqZWN0IHBhcmFtT2JqIC0tIFdBUk5JTkcuIE9ubHkgYWNjZXB0cyBzaGFsbG93IG9iamVjdHMuXHJcbiogQHJldHVybiBQcm9taXNlXHJcbiovXHJcbmZ1bmN0aW9uIHhocihwcm90b2NvbCwgdXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICB2YXIgcGFyYW1TdHIgPSB1cmxTdHJpbmdpZnkocGFyYW1PYmopO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIHZhciByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICByZXEub3Blbihwcm90b2NvbCwgdXJsKTtcclxuICAgICAgICByZXEuc2V0UmVxdWVzdEhlYWRlcignWC1SZXF1ZXN0ZWQtV2l0aCcsICdYTUxIdHRwUmVxdWVzdCcpO1xyXG4gICAgICAgIGlmIChwcm90b2NvbCA9PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgcmVxLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlcS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcS5zdGF0dXNUZXh0KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIEhhbmRsZSBuZXR3b3JrIGVycm9yc1xyXG4gICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJlamVjdChFcnJvcihcIk5ldHdvcmsgRXJyb3JcIikpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKHBhcmFtU3RyKSB7XHJcbiAgICAgICAgICAgIHJlcS5zZW5kKHBhcmFtU3RyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXEuc2VuZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gc3RyaW5naWZ5IHVybCBwYXJhbWV0ZXJzXHJcbiAqL1xyXG5mdW5jdGlvbiB1cmxTdHJpbmdpZnkob2JqKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKVxyXG4gICAgLm1hcChrID0+IGAke2VuY29kZVVSSUNvbXBvbmVudChrKX09JHtlbmNvZGVVUklDb21wb25lbnQob2JqW2tdKX1gKVxyXG4gICAgLmpvaW4oJyYnKTtcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge3hociwgZ2V0LCBnZXRKU09OLCBwb3N0LCBwb3N0SlNPTn07XHJcbiIsIi8qKlxyXG4gKiBAZmlsZSBDb250YWlucyBmdW5jdGlvbnMgdG8gaW50ZXJhY3Qgd2l0aCBibG9ja2hlYWRzZmFucy5jb20gLSBjYW5ub3QgYmUgdXNlZCBieSBleHRlbnNpb25zLlxyXG4gKi9cclxuXHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBhamF4ID0gcmVxdWlyZSgnbGlicmFyaWVzL2FqYXgnKTtcclxuXHJcbmNvbnN0IEFQSV9VUkxTID0ge1xyXG4gICAgU1RPUkU6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2FwaS9leHRlbnNpb24vc3RvcmUnLFxyXG4gICAgTkFNRTogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvYXBpL2V4dGVuc2lvbi9uYW1lJyxcclxuICAgIEVSUk9SOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9hcGkvZXJyb3InLFxyXG59O1xyXG5cclxudmFyIGNhY2hlID0ge1xyXG4gICAgbmFtZXM6IG5ldyBNYXAoKSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGdldCBwdWJsaWMgZXh0ZW5zaW9uc1xyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRTdG9yZSgpLnRoZW4oc3RvcmUgPT4gY29uc29sZS5sb2coc3RvcmUpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gdXNlIHRoZSBjYWNoZWQgcmVzcG9uc2Ugc2hvdWxkIGJlIGNsZWFyZWQuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9IHJlc29sdmVzIHdpdGggdGhlIHJlc3BvbnNlXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRTdG9yZShyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRTdG9yZSkge1xyXG4gICAgICAgIGNhY2hlLmdldFN0b3JlID0gYWpheC5nZXRKU09OKEFQSV9VUkxTLlNUT1JFKVxyXG4gICAgICAgICAgICAudGhlbihzdG9yZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvL0J1aWxkIHRoZSBpbml0aWFsIG5hbWVzIG1hcFxyXG4gICAgICAgICAgICAgICAgaWYgKHN0b3JlLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGV4IG9mIHN0b3JlLmV4dGVuc2lvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5uYW1lcy5zZXQoZXguaWQsIGV4LnRpdGxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldFN0b3JlO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIG5hbWUgb2YgdGhlIHByb3ZpZGVkIGV4dGVuc2lvbiBJRC5cclxuICogSWYgdGhlIGV4dGVuc2lvbiB3YXMgbm90IGZvdW5kLCByZXNvbHZlcyB3aXRoIHRoZSBvcmlnaW5hbCBwYXNzZWQgSUQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldEV4dGVuc2lvbk5hbWUoJ3Rlc3QnKS50aGVuKG5hbWUgPT4gY29uc29sZS5sb2cobmFtZSkpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgdGhlIGlkIHRvIHNlYXJjaCBmb3IuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9IHJlc29sdmVzIHdpdGggdGhlIGV4dGVuc2lvbiBuYW1lLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uTmFtZShpZCkge1xyXG4gICAgaWYgKGNhY2hlLm5hbWVzLmhhcyhpZCkpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhY2hlLm5hbWVzLmdldChpZCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhamF4LnBvc3RKU09OKEFQSV9VUkxTLk5BTUUsIHtpZH0pLnRoZW4oKHtuYW1lfSkgPT4ge1xyXG4gICAgICAgIGNhY2hlLm5hbWVzLnNldChpZCwgbmFtZSk7XHJcbiAgICAgICAgcmV0dXJuIG5hbWU7XHJcbiAgICB9LCBlcnIgPT4ge1xyXG4gICAgICAgIHJlcG9ydEVycm9yKGVycik7XHJcbiAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVwb3J0cyBhbiBlcnJvciBzbyB0aGF0IGl0IGNhbiBiZSByZXZpZXdlZCBhbmQgZml4ZWQgYnkgZXh0ZW5zaW9uIG9yIGJvdCBkZXZlbG9wZXJzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiByZXBvcnRFcnJvcihFcnJvcihcIlJlcG9ydCBtZVwiKSk7XHJcbiAqIEBwYXJhbSB7RXJyb3J9IGVyciB0aGUgZXJyb3IgdG8gcmVwb3J0XHJcbiAqL1xyXG5mdW5jdGlvbiByZXBvcnRFcnJvcihlcnIpIHtcclxuICAgIGFqYXgucG9zdEpTT04oQVBJX1VSTFMuRVJST1IsIHtcclxuICAgICAgICAgICAgZXJyb3JfdGV4dDogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgIGVycm9yX2ZpbGU6IGVyci5maWxlbmFtZSxcclxuICAgICAgICAgICAgZXJyb3Jfcm93OiBlcnIubGluZW5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX2NvbHVtbjogZXJyLmNvbG5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX3N0YWNrOiBlcnIuc3RhY2sgfHwgJycsXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigocmVzcCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgaG9vay5maXJlKCdlcnJvcl9yZXBvcnQnLCAnU29tZXRoaW5nIHdlbnQgd3JvbmcsIGl0IGhhcyBiZWVuIHJlcG9ydGVkLicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaG9vay5maXJlKCdlcnJvcl9yZXBvcnQnLCBgRXJyb3IgcmVwb3J0aW5nIGV4Y2VwdGlvbjogJHtyZXNwLm1lc3NhZ2V9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBnZXRTdG9yZSxcclxuICAgIGdldEV4dGVuc2lvbk5hbWUsXHJcbiAgICByZXBvcnRFcnJvcixcclxufTtcclxuIiwidmFyIGFqYXggPSByZXF1aXJlKCcuL2FqYXgnKTtcclxudmFyIGhvb2sgPSByZXF1aXJlKCcuL2hvb2snKTtcclxudmFyIGJoZmFuc2FwaSA9IHJlcXVpcmUoJy4vYmhmYW5zYXBpJyk7XHJcblxyXG5jb25zdCB3b3JsZElkID0gd2luZG93LndvcmxkSWQ7XHJcbnZhciBjYWNoZSA9IHtcclxuICAgIGZpcnN0SWQ6IDAsXHJcbn07XHJcblxyXG4vLyBVc2VkIHRvIHBhcnNlIG1lc3NhZ2VzIG1vcmUgYWNjdXJhdGVseVxyXG52YXIgd29ybGQgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW11cclxufTtcclxuZ2V0T25saW5lUGxheWVycygpXHJcbiAgICAudGhlbihwbGF5ZXJzID0+IHdvcmxkLnBsYXllcnMgPSBbLi4ubmV3IFNldChwbGF5ZXJzLmNvbmNhdCh3b3JsZC5wbGF5ZXJzKSldKTtcclxuXHJcbmdldFdvcmxkTmFtZSgpXHJcbiAgICAudGhlbihuYW1lID0+IHdvcmxkLm5hbWUgPSBuYW1lKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHdvcmxkU3RhcnRlZCxcclxuICAgIGdldExvZ3MsXHJcbiAgICBnZXRMaXN0cyxcclxuICAgIGdldEhvbWVwYWdlLFxyXG4gICAgZ2V0T25saW5lUGxheWVycyxcclxuICAgIGdldE93bmVyTmFtZSxcclxuICAgIGdldFdvcmxkTmFtZSxcclxuICAgIHNlbmQsXHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIHRoZSB3b3JsZCBpZiBuZWNjZXNzYXJ5LCByZWplY3RzIGlmIHRoZSB3b3JsZCB0YWtlcyB0b28gbG9uZyB0byBzdGFydCBvciBpcyB1bmF2YWlsaWJsZVxyXG4gKiBSZWZhY3RvcmluZyB3ZWxjb21lLiBUaGlzIHNlZW1zIG92ZXJseSBweXJhbWlkIGxpa2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHdvcmxkU3RhcnRlZCgpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ3N0YXJ0ZWQhJykpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWNoZWNrIGlmIHRoZSB3b3JsZCBpcyBzdGFydGVkLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gd29ybGRTdGFydGVkKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLndvcmxkU3RhcnRlZCkge1xyXG4gICAgICAgIGNhY2hlLndvcmxkU3RhcnRlZCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdmFyIGZhaWxzID0gMDtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uIGNoZWNrKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ291bGQgdGhpcyBiZSBtb3JlIHNpbXBsaWZpZWQ/XHJcbiAgICAgICAgICAgICAgICBhamF4LnBvc3RKU09OKCcvYXBpJywgeyBjb21tYW5kOiAnc3RhdHVzJywgd29ybGRJZCB9KS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlc3BvbnNlLndvcmxkU3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ29ubGluZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdvZmZsaW5lJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFqYXgucG9zdEpTT04oJy9hcGknLCB7IGNvbW1hbmQ6ICdzdGFydCcsIHdvcmxkSWQgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihjaGVjaywgY2hlY2spO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3VuYXZhaWxpYmxlJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdXb3JsZCB1bmF2YWlsaWJsZS4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0YXJ0dXAnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzaHV0ZG93bic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0b3JpbmcnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVjaywgMzAwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKytmYWlscyA+IDEwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ1dvcmxkIHRvb2sgdG9vIGxvbmcgdG8gc3RhcnQuJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignVW5rbm93biByZXNwb25zZS4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKTtcclxuICAgICAgICAgICAgfSgpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUud29ybGRTdGFydGVkO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgdGhlIGxvZydzIGxpbmVzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMb2dzKCkudGhlbihsaW5lcyA9PiBjb25zb2xlLmxvZyhsaW5lc1swXSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWRvd25sb2FkIHRoZSBsb2dzXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMb2dzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldExvZ3MpIHtcclxuICAgICAgICBjYWNoZS5nZXRMb2dzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbG9ncy8ke3dvcmxkSWR9YCkpXHJcbiAgICAgICAgICAgIC50aGVuKGxvZyA9PiBsb2cuc3BsaXQoJ1xcbicpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0TG9ncztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIGEgbGlzdCBvZiBhZG1pbnMsIG1vZHMsIHN0YWZmIChhZG1pbnMgKyBtb2RzKSwgd2hpdGVsaXN0LCBhbmQgYmxhY2tsaXN0LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMaXN0cygpLnRoZW4obGlzdHMgPT4gY29uc29sZS5sb2cobGlzdHMuYWRtaW4pKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmZXRjaCB0aGUgbGlzdHMuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMaXN0cyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRMaXN0cykge1xyXG4gICAgICAgIGNhY2hlLmdldExpc3RzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbGlzdHMvJHt3b3JsZElkfWApKVxyXG4gICAgICAgICAgICAudGhlbihodG1sID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldExpc3QobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gZG9jLnF1ZXJ5U2VsZWN0b3IoYHRleHRhcmVhW25hbWU9JHtuYW1lfV1gKVxyXG4gICAgICAgICAgICAgICAgICAgIC52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIC50b0xvY2FsZVVwcGVyQ2FzZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCdcXG4nKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWy4uLm5ldyBTZXQobGlzdCldOyAvL1JlbW92ZSBkdXBsaWNhdGVzXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGxpc3RzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFkbWluOiBnZXRMaXN0KCdhZG1pbnMnKSxcclxuICAgICAgICAgICAgICAgICAgICBtb2Q6IGdldExpc3QoJ21vZGxpc3QnKSxcclxuICAgICAgICAgICAgICAgICAgICB3aGl0ZTogZ2V0TGlzdCgnd2hpdGVsaXN0JyksXHJcbiAgICAgICAgICAgICAgICAgICAgYmxhY2s6IGdldExpc3QoJ2JsYWNrbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGxpc3RzLm1vZCA9IGxpc3RzLm1vZC5maWx0ZXIobmFtZSA9PiAhbGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgbGlzdHMuc3RhZmYgPSBsaXN0cy5hZG1pbi5jb25jYXQobGlzdHMubW9kKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdHM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRMaXN0cztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSBob21lcGFnZSBvZiB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiBjb25zb2xlLmxvZyhodG1sLnN1YnN0cmluZygwLCAxMDApKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZmV0Y2ggdGhlIHBhZ2UuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRIb21lcGFnZShyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRIb21lcGFnZSkge1xyXG4gICAgICAgIGNhY2hlLmdldEhvbWVwYWdlID0gYWpheC5nZXQoYC93b3JsZHMvJHt3b3JsZElkfWApXHJcbiAgICAgICAgICAgIC5jYXRjaCgoKSA9PiBnZXRIb21lcGFnZSh0cnVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldEhvbWVwYWdlO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgcGxheWVyIG5hbWVzLlxyXG4gKiBBbiBvbmxpbmUgbGlzdCBpcyBtYWludGFpbmVkIGJ5IHRoZSBib3QsIHRoaXMgc2hvdWxkIGdlbmVyYWxseSBub3QgYmUgdXNlZC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T25saW5lUGxheWVycygpLnRoZW4ob25saW5lID0+IHsgZm9yIChsZXQgbiBvZiBvbmxpbmUpIHsgY29uc29sZS5sb2cobiwgJ2lzIG9ubGluZSEnKX19KTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmcmVzaCB0aGUgb25saW5lIG5hbWVzLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T25saW5lUGxheWVycyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0T25saW5lUGxheWVycyA9IGdldEhvbWVwYWdlKHRydWUpXHJcbiAgICAgICAgICAgIC50aGVuKChodG1sKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJFbGVtcyA9IGRvYy5xdWVyeVNlbGVjdG9yKCcubWFuYWdlci5wYWRkZWQ6bnRoLWNoaWxkKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAucXVlcnlTZWxlY3RvckFsbCgndHI6bm90KC5oaXN0b3J5KSA+IHRkLmxlZnQnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgQXJyYXkuZnJvbShwbGF5ZXJFbGVtcykuZm9yRWFjaCgoZWwpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJzLnB1c2goZWwudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGxheWVycztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldE9ubGluZVBsYXllcnM7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgc2VydmVyIG93bmVyJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T3duZXJOYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBpcyBvd25lZCBieScsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE93bmVyTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcuc3ViaGVhZGVyfnRyPnRkOm5vdChbY2xhc3NdKScpLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIHdvcmxkJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0V29ybGROYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBuYW1lOicsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldFdvcmxkTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcjdGl0bGUnKS50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZW5kcyBhIG1lc3NhZ2UsIHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiBzZW50IG9yIHJlamVjdHMgb24gZmFpbHVyZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2VuZCgnaGVsbG8hJykudGhlbigoKSA9PiBjb25zb2xlLmxvZygnc2VudCcpKS5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gc2VuZC5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHNlbmQobWVzc2FnZSkge1xyXG4gICAgcmV0dXJuIGFqYXgucG9zdEpTT04oYC9hcGlgLCB7Y29tbWFuZDogJ3NlbmQnLCBtZXNzYWdlLCB3b3JsZElkfSlcclxuICAgICAgICAudGhlbihyZXNwID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlc3Auc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXNwO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4ocmVzcCA9PiB7XHJcbiAgICAgICAgICAgIC8vSGFuZGxlIGhvb2tzXHJcbiAgICAgICAgICAgIGhvb2suZmlyZSgnd29ybGQuc2VuZCcsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBob29rLmZpcmUoJ3dvcmxkLnNlcnZlcm1lc3NhZ2UnLCBtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgIC8vRGlzYWxsb3cgY29tbWFuZHMgc3RhcnRpbmcgd2l0aCBzcGFjZS5cclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpICYmICFtZXNzYWdlLnN0YXJ0c1dpdGgoJy8gJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFyZ3MgPSAnJztcclxuICAgICAgICAgICAgICAgIGlmIChjb21tYW5kLmluY2x1ZGVzKCcgJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBtZXNzYWdlLnN1YnN0cmluZyhtZXNzYWdlLmluZGV4T2YoJyAnKSArIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsICdTRVJWRVInLCBjb21tYW5kLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3A7XHJcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgaWYgKGVyciA9PSAnV29ybGQgbm90IHJ1bm5pbmcuJykge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuZmlyc3RJZCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIHdhdGNoIGNoYXQuXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja0NoYXQoKSB7XHJcbiAgICBnZXRNZXNzYWdlcygpLnRoZW4oKG1zZ3MpID0+IHtcclxuICAgICAgICBtc2dzLmZvckVhY2goKG1lc3NhZ2UpID0+IHtcclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChgJHt3b3JsZC5uYW1lfSAtIFBsYXllciBDb25uZWN0ZWQgYCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBbLCBuYW1lLCBpcF0gPSBtZXNzYWdlLm1hdGNoKC8gLSBQbGF5ZXIgQ29ubmVjdGVkICguKikgXFx8IChbXFxkLl0rKSBcXHwgKFtcXHddezMyfSlcXHMqJC8pO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlSm9pbk1lc3NhZ2VzKG5hbWUsIGlwKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkLm5hbWV9IC0gUGxheWVyIERpc2Nvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBtZXNzYWdlLnN1YnN0cmluZyh3b3JsZC5uYW1lLmxlbmd0aCArIDIzKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJzogJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gZ2V0VXNlcm5hbWUobWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbXNnID0gbWVzc2FnZS5zdWJzdHJpbmcobmFtZS5sZW5ndGggKyAyKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtc2cpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZU90aGVyTWVzc2FnZXMobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcilcclxuICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQ2hhdCwgNTAwMCk7XHJcbiAgICB9KTtcclxufVxyXG5jaGVja0NoYXQoKTtcclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2V0IHRoZSBsYXRlc3QgY2hhdCBtZXNzYWdlcy5cclxuICpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE1lc3NhZ2VzKCkge1xyXG4gICAgcmV0dXJuIHdvcmxkU3RhcnRlZCgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5wb3N0SlNPTihgL2FwaWAsIHsgY29tbWFuZDogJ2dldGNoYXQnLCB3b3JsZElkLCBmaXJzdElkOiBjYWNoZS5maXJzdElkIH0pKVxyXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT0gJ29rJyAmJiBkYXRhLm5leHRJZCAhPSBjYWNoZS5maXJzdElkKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5maXJzdElkID0gZGF0YS5uZXh0SWQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5sb2c7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5zdGF0dXMgPT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHdobyBzZW50IGEgbWVzc2FnZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIG5hbWUgPSBnZXRVc2VybmFtZSgnU0VSVkVSOiBIaSB0aGVyZSEnKTtcclxuICogLy9uYW1lID09ICdTRVJWRVInXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIHBhcnNlLlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBuYW1lIG9mIHRoZSB1c2VyIHdobyBzZW50IHRoZSBtZXNzYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0VXNlcm5hbWUobWVzc2FnZSkge1xyXG4gICAgZm9yIChsZXQgaSA9IDE4OyBpID4gNDsgaS0tKSB7XHJcbiAgICAgICAgbGV0IHBvc3NpYmxlTmFtZSA9IG1lc3NhZ2Uuc3Vic3RyaW5nKDAsIG1lc3NhZ2UubGFzdEluZGV4T2YoJzogJywgaSkpO1xyXG4gICAgICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMocG9zc2libGVOYW1lKSB8fCBwb3NzaWJsZU5hbWUgPT0gJ1NFUlZFUicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBvc3NpYmxlTmFtZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBTaG91bGQgaWRlYWxseSBuZXZlciBoYXBwZW4uXHJcbiAgICByZXR1cm4gbWVzc2FnZS5zdWJzdHJpbmcoMCwgbWVzc2FnZS5sYXN0SW5kZXhPZignOiAnLCAxOCkpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgam9pbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgam9pbmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IGlwIHRoZSBpcCBvZiB0aGUgcGxheWVyIGpvaW5pbmcuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVKb2luTWVzc2FnZXMobmFtZSwgaXApIHtcclxuICAgIGlmICghd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQuam9pbicsIG5hbWUsIGlwKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgZGlzY29ubmVjdGlvbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgbGVhdmluZy5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSkge1xyXG4gICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5zcGxpY2Uod29ybGQub25saW5lLmluZGV4T2YobmFtZSksIDEpO1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLmxlYXZlJywgbmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHVzZXIgY2hhdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdXNlci5cclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2Ugc2VudC5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICBpZiAobmFtZSA9PSAnU0VSVkVSJykge1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLnNlcnZlcmNoYXQnLCBtZXNzYWdlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQubWVzc2FnZScsIG5hbWUsIG1lc3NhZ2UpO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSAmJiAhbWVzc2FnZS5zdGFydHNXaXRoKCcvICcpKSB7XHJcblxyXG4gICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgIGxldCBhcmdzID0gJyc7XHJcbiAgICAgICAgaWYgKGNvbW1hbmQuaW5jbHVkZXMoJyAnKSkge1xyXG4gICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICBhcmdzID0gbWVzc2FnZS5zdWJzdHJpbmcobWVzc2FnZS5pbmRleE9mKCcgJykgKyAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsIG5hbWUsIGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgICAgIHJldHVybjsgLy9ub3QgY2hhdFxyXG4gICAgfVxyXG5cclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLmNoYXQnLCBuYW1lLCBtZXNzYWdlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIGhhbmRsZSBtZXNzYWdlcyB3aGljaCBhcmUgbm90IHNpbXBseSBwYXJzZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIGhhbmRsZVxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlT3RoZXJNZXNzYWdlcyhtZXNzYWdlKSB7XHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5vdGhlcicsIG1lc3NhZ2UpO1xyXG59XHJcbiIsInZhciBsaXN0ZW5lcnMgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGJlZ2luIGxpc3RlbmluZyB0byBhbiBldmVudC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogbGlzdGVuKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogLy9hbHRlcm5hdGl2ZWx5XHJcbiAqIG9uKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0aGUgZXZlbnQgaGFuZGxlclxyXG4gKi9cclxuZnVuY3Rpb24gbGlzdGVuKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIGxpc3RlbmVyc1trZXldID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XS5pbmNsdWRlcyhjYWxsYmFjaykpIHtcclxuICAgICAgICBsaXN0ZW5lcnNba2V5XS5wdXNoKGNhbGxiYWNrKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHN0b3AgbGlzdGVuaW5nIHRvIGFuIGV2ZW50LiBJZiB0aGUgbGlzdGVuZXIgd2FzIG5vdCBmb3VuZCwgbm8gYWN0aW9uIHdpbGwgYmUgdGFrZW4uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vRWFybGllciBhdHRhY2hlZCBteUZ1bmMgdG8gJ2V2ZW50J1xyXG4gKiByZW1vdmUoJ2V2ZW50JywgbXlGdW5jKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gc3RvcCBsaXN0ZW5pbmcgdG8uXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRoZSBjYWxsYmFjayB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQgbGlzdGVuZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKGxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgaWYgKGxpc3RlbmVyc1trZXldLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICBsaXN0ZW5lcnNba2V5XS5zcGxpY2UobGlzdGVuZXJzW2tleV0uaW5kZXhPZihjYWxsYmFjayksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNhbGwgZXZlbnRzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBjaGVjaygndGVzdCcsIDEsIDIsIDMpO1xyXG4gKiBjaGVjaygndGVzdCcsIHRydWUpO1xyXG4gKiAvLyBhbHRlcm5hdGl2ZWx5XHJcbiAqIGZpcmUoJ3Rlc3QnLCAxLCAyLCAzKTtcclxuICogZmlyZSgndGVzdCcsIHRydWUpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBjYWxsLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhcmd1bWVudHMgdG8gcGFzcyB0byBsaXN0ZW5pbmcgZnVuY3Rpb25zLlxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2soa2V5LCAuLi5hcmdzKSB7XHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGlzdGVuZXJzW2tleV0uZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lcikge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVyKC4uLmFyZ3MpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgdmFsdWUgYmFzZWQgb24gaW5wdXQgZnJvbSBsaXN0ZW5lcnMuXHJcbiAqXHJcbiAqIEBkZXByaWNhdGVkIHNpbmNlIDYuMS4wLiBJbnN0ZWFkLCB1cGRhdGUgcmVxdWVzdHMgc2hvdWxkIGJlIGhhbmRsZWQgYnkgdGhlIGV4dGVuc2lvbiBpdGVzZWxmLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1cGRhdGUoJ2V2ZW50JywgdHJ1ZSwgMSwgMiwgMyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGNhbGxcclxuICogQHBhcmFtIHttaXhlZH0gaW5pdGlhbCB0aGUgaW5pdGlhbCB2YWx1ZSB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIHVwZGF0ZShrZXksIGluaXRpYWwsIC4uLmFyZ3MpIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIHJldHVybiBpbml0aWFsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsaXN0ZW5lcnNba2V5XS5yZWR1Y2UoZnVuY3Rpb24ocHJldmlvdXMsIGN1cnJlbnQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gY3VycmVudChwcmV2aW91cywgLi4uYXJncyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91cztcclxuICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcHJldmlvdXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgaW5pdGlhbCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbGlzdGVuLFxyXG4gICAgb246IGxpc3RlbixcclxuICAgIHJlbW92ZSxcclxuICAgIGNoZWNrLFxyXG4gICAgZmlyZTogY2hlY2ssXHJcbiAgICB1cGRhdGUsXHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZ2V0U3RyaW5nLFxyXG4gICAgZ2V0T2JqZWN0LFxyXG4gICAgc2V0LFxyXG4gICAgY2xlYXJOYW1lc3BhY2UsXHJcbn07XHJcblxyXG4vL1JFVklFVzogSXMgdGhlcmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/IHJlcXVpcmUoJy4vY29uZmlnJykgbWF5YmU/XHJcbmNvbnN0IE5BTUVTUEFDRSA9IHdpbmRvdy53b3JsZElkO1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdHJpbmcgZnJvbSB0aGUgc3RvcmFnZSBpZiBpdCBleGlzdHMgYW5kIHJldHVybnMgaXQsIG90aGVyd2lzZSByZXR1cm5zIGZhbGxiYWNrLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgeCA9IGdldFN0cmluZygnc3RvcmVkX3ByZWZzJywgJ25vdGhpbmcnKTtcclxuICogdmFyIHkgPSBnZXRTdHJpbmcoJ3N0b3JlZF9wcmVmcycsICdub3RoaW5nJywgZmFsc2UpO1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBrZXkgdG8gcmV0cmlldmUuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGZhbGxiYWNrIHdoYXQgdG8gcmV0dXJuIGlmIHRoZSBrZXkgd2FzIG5vdCBmb3VuZC5cclxuICogQHBhcmFtIHtib29sfSBbbG9jYWw9dHJ1ZV0gd2hldGhlciBvciBub3QgdG8gdXNlIGEgbmFtZXNwYWNlIHdoZW4gY2hlY2tpbmcgZm9yIHRoZSBrZXkuXHJcbiAqIEByZXR1cm4ge21peGVkfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0U3RyaW5nKGtleSwgZmFsbGJhY2ssIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmIChsb2NhbCkge1xyXG4gICAgICAgIHJlc3VsdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGAke2tleX0ke05BTUVTUEFDRX1gKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKHJlc3VsdCA9PT0gbnVsbCkgPyBmYWxsYmFjayA6IHJlc3VsdDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdG9yZWQgb2JqZWN0IGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIHJldHVybnMgZmFsbGJhY2suXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB4ID0gZ2V0T2JqZWN0KCdzdG9yZWRfa2V5JywgWzEsIDIsIDNdKTtcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgaXRlbSB0byByZXRyaWV2ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZmFsbGJhY2sgd2hhdCB0byByZXR1cm4gaWYgdGhlIGl0ZW0gZG9lcyBub3QgZXhpc3Qgb3IgZmFpbHMgdG8gcGFyc2UgY29ycmVjdGx5LlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIG9yIG5vdCBhIG5hbWVzcGFjZSBzaG91bGQgYmUgdXNlZC5cclxuICogQHJldHVybiB7bWl4ZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPYmplY3Qoa2V5LCBmYWxsYmFjaywgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gZ2V0U3RyaW5nKGtleSwgZmFsc2UsIGxvY2FsKTtcclxuXHJcbiAgICBpZiAoIXJlc3VsdCkge1xyXG4gICAgICAgIHJldHVybiBmYWxsYmFjaztcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UocmVzdWx0KTtcclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogU2V0cyBhbiBvYmplY3QgaW4gdGhlIHN0b3JhZ2UsIHN0cmluZ2lmeWluZyBpdCBmaXJzdCBpZiBuZWNjZXNzYXJ5LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ3NvbWVfa2V5Jywge2E6IFsxLCAyLCAzXSwgYjogJ3Rlc3QnfSk7XHJcbiAqIC8vcmV0dXJucyAne1wiYVwiOlsxLDIsM10sXCJiXCI6XCJ0ZXN0XCJ9J1xyXG4gKiBnZXRTdHJpbmcoJ3NvbWVfa2V5Jyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGl0ZW0gdG8gb3ZlcndyaXRlIG9yIGNyZWF0ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZGF0YSBhbnkgc3RyaW5naWZ5YWJsZSB0eXBlLlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIHRvIHNhdmUgdGhlIGl0ZW0gd2l0aCBhIG5hbWVzcGFjZS5cclxuICovXHJcbmZ1bmN0aW9uIHNldChrZXksIGRhdGEsIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgaWYgKGxvY2FsKSB7XHJcbiAgICAgICAga2V5ID0gYCR7a2V5fSR7TkFNRVNQQUNFfWA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBkYXRhID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBkYXRhKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCBpdGVtcyBzdGFydGluZyB3aXRoIG5hbWVzcGFjZSBmcm9tIHRoZSBzdG9yYWdlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ2tleV90ZXN0JywgMSk7XHJcbiAqIHNldCgna2V5X3Rlc3QyJywgMik7XHJcbiAqIGNsZWFyTmFtZXNwYWNlKCdrZXlfJyk7IC8vYm90aCBrZXlfdGVzdCBhbmQga2V5X3Rlc3QyIGhhdmUgYmVlbiByZW1vdmVkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZXNwYWNlIHRoZSBwcmVmaXggdG8gY2hlY2sgZm9yIHdoZW4gcmVtb3ZpbmcgaXRlbXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBjbGVhck5hbWVzcGFjZShuYW1lc3BhY2UpIHtcclxuICAgIE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aChuYW1lc3BhY2UpKSB7XHJcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3QgYXBpID0gcmVxdWlyZSgnLi9ibG9ja2hlYWRzJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJy4vaG9vaycpO1xyXG5cclxuY29uc3QgU1RPUkFHRSA9IHtcclxuICAgIFBMQVlFUlM6ICdtYl9wbGF5ZXJzJyxcclxuICAgIExPR19MT0FEOiAnbWJfbGFzdExvZ0xvYWQnLFxyXG59O1xyXG5cclxudmFyIHdvcmxkID0gbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW10sXHJcbiAgICBvd25lcjogJycsXHJcbiAgICBwbGF5ZXJzOiBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFLlBMQVlFUlMsIHt9KSxcclxuICAgIGxpc3RzOiB7YWRtaW46IFtdLCBtb2Q6IFtdLCBzdGFmZjogW10sIGJsYWNrOiBbXSwgd2hpdGU6IFtdfSxcclxuICAgIGlzUGxheWVyLFxyXG4gICAgaXNTZXJ2ZXIsXHJcbiAgICBpc093bmVyLFxyXG4gICAgaXNBZG1pbixcclxuICAgIGlzU3RhZmYsXHJcbiAgICBpc01vZCxcclxuICAgIGlzT25saW5lLFxyXG4gICAgZ2V0Sm9pbnMsXHJcbn07XHJcbnZhciBsaXN0cyA9IHdvcmxkLmxpc3RzO1xyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhIHBsYXllciBoYXMgam9pbmVkIHRoZSBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1BsYXllcihuYW1lKSB7XHJcbiAgICByZXR1cm4gd29ybGQucGxheWVycy5oYXNPd25Qcm9wZXJ0eShuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgdGhlIHNlcnZlclxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNTZXJ2ZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSA9PSAnU0VSVkVSJztcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIHRoZSBvd25lciBvciBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc093bmVyKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5vd25lciA9PSBuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkgfHwgaXNTZXJ2ZXIobmFtZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyBhbiBhZG1pblxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNBZG1pbihuYW1lKSB7XHJcbiAgICByZXR1cm4gbGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpKSB8fCBpc093bmVyKG5hbWUpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgYSBtb2RcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzTW9kKG5hbWUpIHtcclxuICAgIHJldHVybiBsaXN0cy5tb2QuaW5jbHVkZXMobmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIGEgc3RhZmYgbWVtYmVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNTdGFmZihuYW1lKSB7XHJcbiAgICByZXR1cm4gaXNBZG1pbihuYW1lKSB8fCBpc01vZChuYW1lKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhIHBsYXllciBpcyBvbmxpbmVcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzT25saW5lKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIG51bWJlciBvZiB0aW1lcyB0aGUgcGxheWVyIGhhcyBqb2luZWQgdGhlIHNlcnZlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7TnVtYmVyfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0Sm9pbnMobmFtZSkge1xyXG4gICAgcmV0dXJuIGlzUGxheWVyKG5hbWUpID8gd29ybGQucGxheWVyc1tuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCldLmpvaW5zIDogMDtcclxufVxyXG5cclxuLy8gS2VlcCB0aGUgb25saW5lIGxpc3QgdXAgdG8gZGF0ZVxyXG5ob29rLm9uKCd3b3JsZC5qb2luJywgZnVuY3Rpb24obmFtZSkge1xyXG4gICAgaWYgKCF3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICB3b3JsZC5vbmxpbmUucHVzaChuYW1lKTtcclxuICAgIH1cclxufSk7XHJcbmhvb2sub24oJ3dvcmxkLmxlYXZlJywgZnVuY3Rpb24obmFtZSkge1xyXG4gICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5zcGxpY2Uod29ybGQub25saW5lLmluZGV4T2YobmFtZSksIDEpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vIEtlZXAgcGxheWVycyBsaXN0IHVwIHRvIGRhdGVcclxuaG9vay5vbignd29ybGQuam9pbicsIGNoZWNrUGxheWVySm9pbik7XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24uXHJcbiAqIFJlbW92ZXMgYWRtaW5zIGZyb20gdGhlIG1vZCBsaXN0IGFuZCBjcmVhdGVzIHRoZSBzdGFmZiBsaXN0LlxyXG4gKi9cclxuZnVuY3Rpb24gYnVpbGRTdGFmZkxpc3QoKSB7XHJcbiAgICBsaXN0cy5tb2QgPSBsaXN0cy5tb2QuZmlsdGVyKChuYW1lKSA9PiAhbGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZSkgJiYgbmFtZSAhPSAnU0VSVkVSJyAmJiBuYW1lICE9IHdvcmxkLm93bmVyKTtcclxuICAgIGxpc3RzLnN0YWZmID0gbGlzdHMuYWRtaW4uY29uY2F0KGxpc3RzLm1vZCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbi5cclxuICogQ2hlY2tzIGlmIGEgcGxheWVyIGhhcyBwZXJtaXNzaW9uIHRvIHBlcmZvcm0gYSBjb21tYW5kXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb21tYW5kXHJcbiAqL1xyXG5mdW5jdGlvbiBwZXJtaXNzaW9uQ2hlY2sobmFtZSwgY29tbWFuZCkge1xyXG4gICAgY29tbWFuZCA9IGNvbW1hbmQudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuXHJcbiAgICBpZiAoWydhZG1pbicsICd1bmFkbWluJywgJ21vZCcsICd1bm1vZCddLmluY2x1ZGVzKGNvbW1hbmQpKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzQWRtaW4obmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFsnd2hpdGVsaXN0JywgJ3Vud2hpdGVsaXN0JywgJ2JhbicsICd1bmJhbiddLmluY2x1ZGVzKGNvbW1hbmQpKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzU3RhZmYobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vLyBLZWVwIGxpc3RzIHVwIHRvIGRhdGVcclxuaG9vay5vbignd29ybGQuY29tbWFuZCcsIGZ1bmN0aW9uKG5hbWUsIGNvbW1hbmQsIHRhcmdldCkge1xyXG4gICAgaWYgKCFwZXJtaXNzaW9uQ2hlY2sobmFtZSwgY29tbWFuZCkpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHVuID0gY29tbWFuZC5zdGFydHNXaXRoKCd1bicpO1xyXG5cclxuICAgIHZhciBncm91cCA9IHtcclxuICAgICAgICBhZG1pbjogJ2FkbWluJyxcclxuICAgICAgICBtb2Q6ICdtb2QnLFxyXG4gICAgICAgIHdoaXRlbGlzdDogJ3doaXRlJyxcclxuICAgICAgICBiYW46ICdibGFjaycsXHJcbiAgICB9W3VuID8gY29tbWFuZC5zdWJzdHIoMikgOiBjb21tYW5kXTtcclxuXHJcbiAgICBpZiAodW4gJiYgbGlzdHNbZ3JvdXBdLmluY2x1ZGVzKHRhcmdldCkpIHtcclxuICAgICAgICBsaXN0c1tncm91cF0uc3BsaWNlKGxpc3RzW2dyb3VwXS5pbmRleE9mKHRhcmdldCksIDEpO1xyXG4gICAgICAgIGJ1aWxkU3RhZmZMaXN0KCk7XHJcbiAgICB9IGVsc2UgaWYgKCF1biAmJiAhbGlzdHNbZ3JvdXBdLmluY2x1ZGVzKHRhcmdldCkpIHtcclxuICAgICAgICBsaXN0c1tncm91cF0ucHVzaCh0YXJnZXQpO1xyXG4gICAgICAgIGJ1aWxkU3RhZmZMaXN0KCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uLiBJbmNyZW1lbnRzIGEgcGxheWVyJ3Mgam9pbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpcFxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tQbGF5ZXJKb2luKG5hbWUsIGlwKSB7XHJcbiAgICBpZiAod29ybGQucGxheWVycy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xyXG4gICAgICAgIC8vUmV0dXJuaW5nIHBsYXllclxyXG4gICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uam9pbnMrKztcclxuICAgICAgICBpZiAoIXdvcmxkLnBsYXllcnNbbmFtZV0uaXBzLmluY2x1ZGVzKGlwKSkge1xyXG4gICAgICAgICAgICB3b3JsZC5wbGF5ZXJzW25hbWVdLmlwcy5wdXNoKGlwKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vTmV3IHBsYXllclxyXG4gICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0gPSB7am9pbnM6IDEsIGlwczogW2lwXX07XHJcbiAgICB9XHJcbiAgICB3b3JsZC5wbGF5ZXJzW25hbWVdLmlwID0gaXA7XHJcblxyXG4gICAgLy8gT3RoZXJ3aXNlLCB3ZSB3aWxsIGRvdWJsZSBwYXJzZSBqb2luc1xyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRS5MT0dfTE9BRCwgTWF0aC5mbG9vcihEYXRlLm5vdygpLnZhbHVlT2YoKSkpO1xyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRS5QTEFZRVJTLCB3b3JsZC5wbGF5ZXJzKTtcclxufVxyXG5cclxuXHJcbi8vIFVwZGF0ZSBsaXN0c1xyXG5Qcm9taXNlLmFsbChbYXBpLmdldExpc3RzKCksIGFwaS5nZXRXb3JsZE5hbWUoKSwgYXBpLmdldE93bmVyTmFtZSgpXSlcclxuICAgIC50aGVuKCh2YWx1ZXMpID0+IHtcclxuICAgICAgICB2YXIgW2FwaUxpc3RzLCB3b3JsZE5hbWUsIG93bmVyXSA9IHZhbHVlcztcclxuXHJcbiAgICAgICAgd29ybGQubGlzdHMgPSBhcGlMaXN0cztcclxuICAgICAgICBidWlsZFN0YWZmTGlzdCgpO1xyXG4gICAgICAgIHdvcmxkLm5hbWUgPSB3b3JsZE5hbWU7XHJcbiAgICAgICAgd29ybGQub3duZXIgPSBvd25lcjtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goY29uc29sZS5lcnJvcik7XHJcblxyXG4vLyBVcGRhdGUgcGxheWVycyBzaW5jZSBsYXN0IGJvdCBsb2FkXHJcblByb21pc2UuYWxsKFthcGkuZ2V0TG9ncygpLCBhcGkuZ2V0V29ybGROYW1lKCldKVxyXG4gICAgLnRoZW4oKHZhbHVlcykgPT4ge1xyXG4gICAgICAgIHZhciBbbGluZXMsIHdvcmxkTmFtZV0gPSB2YWx1ZXM7XHJcblxyXG4gICAgICAgIHZhciBsYXN0ID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRS5MT0dfTE9BRCwgMCk7XHJcbiAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRS5MT0dfTE9BRCwgTWF0aC5mbG9vcihEYXRlLm5vdygpLnZhbHVlT2YoKSkpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBsaW5lIG9mIGxpbmVzKSB7XHJcbiAgICAgICAgICAgIGxldCB0aW1lID0gbmV3IERhdGUobGluZS5zdWJzdHJpbmcoMCwgbGluZS5pbmRleE9mKCdiJykpLnJlcGxhY2UoJyAnLCAnVCcpLnJlcGxhY2UoJyAnLCAnWicpKTtcclxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBsaW5lLnN1YnN0cmluZyhsaW5lLmluZGV4T2YoJ10nKSArIDIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRpbWUgPCBsYXN0KSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChgJHt3b3JsZE5hbWV9IC0gUGxheWVyIENvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHBhcnRzID0gbGluZS5zdWJzdHIobGluZS5pbmRleE9mKCcgLSBQbGF5ZXIgQ29ubmVjdGVkICcpICsgMjApOyAvL05BTUUgfCBJUCB8IElEXHJcbiAgICAgICAgICAgICAgICBsZXQgWywgbmFtZSwgaXBdID0gcGFydHMubWF0Y2goLyguKikgXFx8IChbXFx3Ll0rKSBcXHwgLnszMn1cXHMqLyk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2hlY2tQbGF5ZXJKb2luKG5hbWUsIGlwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRS5QTEFZRVJTLCB3b3JsZC5wbGF5ZXJzKTtcclxuICAgIH0pO1xyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBzZW5kID0gcmVxdWlyZSgnYm90Jykuc2VuZDtcclxuY29uc3QgcHJlZmVyZW5jZXMgPSByZXF1aXJlKCdzZXR0aW5ncy9ib3QnKTtcclxuXHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdBbm5vdW5jZW1lbnRzJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjx0ZW1wbGF0ZSBpZD1cXFwiYVRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY29sdW1uIGlzLWZ1bGxcXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYm94XFxcIj5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+U2VuZDo8L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDx0ZXh0YXJlYSBjbGFzcz1cXFwibVxcXCI+PC90ZXh0YXJlYT5cXHJcXG4gICAgICAgICAgICA8YT5EZWxldGU8L2E+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgIDxkaXY+XFxyXFxuICAgICAgICAgICAgV2FpdCBYIG1pbnV0ZXMuLi5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2Fubm91bmNlbWVudHNcXFwiIGNsYXNzPVxcXCJjb250YWluZXIgaXMtZmx1aWRcXFwiPlxcclxcbiAgICA8c2VjdGlvbiBjbGFzcz1cXFwic2VjdGlvbiBpcy1zbWFsbFxcXCI+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYnV0dG9uIGlzLXByaW1hcnkgaXMtcHVsbGVkLXJpZ2h0XFxcIj4rPC9zcGFuPlxcclxcbiAgICAgICAgPGgzPlRoZXNlIGFyZSBzZW50IGFjY29yZGluZyB0byBhIHJlZ3VsYXIgc2NoZWR1bGUuPC9oMz5cXHJcXG4gICAgICAgIDxzcGFuPklmIHlvdSBoYXZlIG9uZSBhbm5vdW5jZW1lbnQsIGl0IGlzIHNlbnQgZXZlcnkgWCBtaW51dGVzLCBpZiB5b3UgaGF2ZSB0d28sIHRoZW4gdGhlIGZpcnN0IGlzIHNlbnQgYXQgWCBtaW51dGVzLCBhbmQgdGhlIHNlY29uZCBpcyBzZW50IFggbWludXRlcyBhZnRlciB0aGUgZmlyc3QuIENoYW5nZSBYIGluIHRoZSBzZXR0aW5ncyB0YWIuIE9uY2UgdGhlIGJvdCByZWFjaGVzIHRoZSBlbmQgb2YgdGhlIGxpc3QsIGl0IHN0YXJ0cyBvdmVyIGF0IHRoZSB0b3AuPC9zcGFuPlxcclxcbiAgICA8L3NlY3Rpb24+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImFNc2dzXFxcIiBjbGFzcz1cXFwiY29sdW1ucyBpcy1tdWx0aWxpbmVcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxuICAgIHN0YXJ0OiAoKSA9PiBhbm5vdW5jZW1lbnRDaGVjaygwKSxcclxufTtcclxuXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UodGV4dCA9ICcnKSB7XHJcbiAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNhVGVtcGxhdGUnLCAnI2FNc2dzJywgW1xyXG4gICAgICAgIHtzZWxlY3RvcjogJy5tJywgdGV4dDogdGV4dH1cclxuICAgIF0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgYW5ub3VuY2VtZW50cyA9IEFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJy5tJykpXHJcbiAgICAgICAgLm1hcChlbCA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiB7bWVzc2FnZTogZWwudmFsdWV9O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIHN0b3JhZ2Uuc2V0KCdhbm5vdW5jZW1lbnRBcnInLCBhbm5vdW5jZW1lbnRzKTtcclxufVxyXG5cclxuLy8gQW5ub3VuY2VtZW50cyBjb2xsZWN0aW9uXHJcbnZhciBhbm5vdW5jZW1lbnRzID0gc3RvcmFnZS5nZXRPYmplY3QoJ2Fubm91bmNlbWVudEFycicsIFtdKTtcclxuXHJcbi8vIFNob3cgc2F2ZWQgYW5ub3VuY2VtZW50c1xyXG5hbm5vdW5jZW1lbnRzXHJcbiAgICAubWFwKGFubiA9PiBhbm4ubWVzc2FnZSlcclxuICAgIC5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5cclxuXHJcbi8vIFNlbmRzIGFubm91bmNlbWVudHMgYWZ0ZXIgdGhlIHNwZWNpZmllZCBkZWxheS5cclxuZnVuY3Rpb24gYW5ub3VuY2VtZW50Q2hlY2soaSkge1xyXG4gICAgaSA9IChpID49IGFubm91bmNlbWVudHMubGVuZ3RoKSA/IDAgOiBpO1xyXG5cclxuICAgIHZhciBhbm4gPSBhbm5vdW5jZW1lbnRzW2ldO1xyXG5cclxuICAgIGlmIChhbm4gJiYgYW5uLm1lc3NhZ2UpIHtcclxuICAgICAgICBzZW5kKGFubi5tZXNzYWdlKTtcclxuICAgIH1cclxuICAgIHNldFRpbWVvdXQoYW5ub3VuY2VtZW50Q2hlY2ssIHByZWZlcmVuY2VzLmFubm91bmNlbWVudERlbGF5ICogNjAwMDAsIGkgKyAxKTtcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGJ1aWxkQW5kU2VuZE1lc3NhZ2UsXHJcbiAgICBidWlsZE1lc3NhZ2UsXHJcbn07XHJcblxyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5jb25zdCBzZW5kID0gcmVxdWlyZSgnYm90Jykuc2VuZDtcclxuXHJcbmZ1bmN0aW9uIGJ1aWxkQW5kU2VuZE1lc3NhZ2UobWVzc2FnZSwgbmFtZSkge1xyXG4gICAgc2VuZChidWlsZE1lc3NhZ2UobWVzc2FnZSwgbmFtZSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBidWlsZE1lc3NhZ2UobWVzc2FnZSwgbmFtZSkge1xyXG4gICAgbWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgve3soW159XSspfX0vZywgZnVuY3Rpb24oZnVsbCwga2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgTkFNRTogbmFtZSxcclxuICAgICAgICAgICAgTmFtZTogbmFtZVswXSArIG5hbWUuc3Vic3RyaW5nKDEpLnRvTG9jYWxlTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUudG9Mb2NhbGVMb3dlckNhc2UoKVxyXG4gICAgICAgIH1ba2V5XSB8fCBmdWxsO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpKSB7XHJcbiAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgve3tpcH19L2dpLCB3b3JsZC5wbGF5ZXJzLmdldElQKG5hbWUpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbWVzc2FnZTtcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNoZWNrSm9pbnNBbmRHcm91cCxcclxuICAgIGNoZWNrSm9pbnMsXHJcbiAgICBjaGVja0dyb3VwLFxyXG59O1xyXG5cclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuXHJcblxyXG5mdW5jdGlvbiBjaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSB7XHJcbiAgICByZXR1cm4gY2hlY2tKb2lucyhuYW1lLCBtc2cuam9pbnNfbG93LCBtc2cuam9pbnNfaGlnaCkgJiYgY2hlY2tHcm91cChuYW1lLCBtc2cuZ3JvdXAsIG1zZy5ub3RfZ3JvdXApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja0pvaW5zKG5hbWUsIGxvdywgaGlnaCkge1xyXG4gICAgcmV0dXJuIHdvcmxkLmdldEpvaW5zKG5hbWUpID49IGxvdyAmJiB3b3JsZC5nZXRKb2lucyhuYW1lKSA8PSBoaWdoO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja0dyb3VwKG5hbWUsIGdyb3VwLCBub3RfZ3JvdXApIHtcclxuICAgIHJldHVybiBpc0luR3JvdXAobmFtZSwgZ3JvdXApICYmICFpc0luR3JvdXAobmFtZSwgbm90X2dyb3VwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNJbkdyb3VwKG5hbWUsIGdyb3VwKSB7XHJcbiAgICBuYW1lID0gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgc3dpdGNoIChncm91cC50b0xvY2FsZUxvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgY2FzZSAnYWxsJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzUGxheWVyKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ2FkbWluJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzQWRtaW4obmFtZSk7XHJcbiAgICAgICAgY2FzZSAnbW9kJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzTW9kKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ3N0YWZmJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzU3RhZmYobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnb3duZXInOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNPd25lcihuYW1lKTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuIiwiT2JqZWN0LmFzc2lnbihcclxuICAgIG1vZHVsZS5leHBvcnRzLFxyXG4gICAgcmVxdWlyZSgnLi9idWlsZE1lc3NhZ2UnKSxcclxuICAgIHJlcXVpcmUoJy4vY2hlY2tKb2luc0FuZEdyb3VwJyksXHJcbiAgICByZXF1aXJlKCcuL3Nob3dTdW1tYXJ5JylcclxuKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzaG93U3VtbWFyeVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBjcmVhdGUgYW5kIGRpc3BsYXkgYSBzdW1tYXJ5IG9mIHRoZSBvcHRpb25zIGNoYW5nZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Tm9kZX0gY29udGFpbmVyIHRoZSBtZXNzYWdlIGNvbnRhaW5lciB3aGljaCBuZWVkcyBhbiB1cGRhdGVkIHN1bW1hcnkuXHJcbiAqL1xyXG5mdW5jdGlvbiBzaG93U3VtbWFyeShjb250YWluZXIpIHtcclxuICAgIHZhciBvdXQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignLnN1bW1hcnknKTtcclxuXHJcbiAgICBpZiAoIW91dCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZ3JvdXAgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZTtcclxuICAgIHZhciBub3RfZ3JvdXAgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWU7XHJcbiAgICB2YXIgam9pbnNfbG93ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScpLnZhbHVlO1xyXG4gICAgdmFyIGpvaW5zX2hpZ2ggPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScpLnZhbHVlO1xyXG5cclxuICAgIHZhciBncm91cHNBbHRlcmVkID0gZ3JvdXAgIT0gJ2FsbCcgfHwgbm90X2dyb3VwICE9ICdub2JvZHknO1xyXG4gICAgdmFyIGpvaW5zQWx0ZXJlZCA9IGpvaW5zX2xvdyAhPSBcIjBcIiB8fCBqb2luc19oaWdoICE9IFwiOTk5OVwiO1xyXG5cclxuICAgIGlmIChncm91cHNBbHRlcmVkICYmIGpvaW5zQWx0ZXJlZCkge1xyXG4gICAgICAgIG91dC50ZXh0Q29udGVudCA9IGAke2dyb3VwfSAvIG5vdCAke25vdF9ncm91cH0gYW5kICR7am9pbnNfbG93fSDiiaQgam9pbnMg4omkICR7am9pbnNfaGlnaH1gO1xyXG4gICAgfSBlbHNlIGlmIChncm91cHNBbHRlcmVkKSB7XHJcbiAgICAgICAgb3V0LnRleHRDb250ZW50ID0gYCR7Z3JvdXB9IC8gbm90ICR7bm90X2dyb3VwfWA7XHJcbiAgICB9IGVsc2UgaWYgKGpvaW5zQWx0ZXJlZCkge1xyXG4gICAgICAgIG91dC50ZXh0Q29udGVudCA9IGAke2pvaW5zX2xvd30g4omkIGpvaW5zIOKJpCAke2pvaW5zX2hpZ2h9YDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgb3V0LnRleHRDb250ZW50ID0gJyc7XHJcbiAgICB9XHJcbn1cclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5cclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycycpO1xyXG5cclxudmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuZWwuaW5uZXJIVE1MID0gXCIjbWJfam9pbj5oMywjbWJfbGVhdmU+aDMsI21iX3RyaWdnZXI+aDMsI21iX2Fubm91bmNlbWVudHM+aDN7bWFyZ2luOjAgMCA1cHggNmVtfSNtYl9qb2luPnNwYW4sI21iX2xlYXZlPnNwYW4sI21iX3RyaWdnZXI+c3BhbiwjbWJfYW5ub3VuY2VtZW50cz5zcGFue21hcmdpbi1sZWZ0OjZlbX0jbWJfam9pbiBpbnB1dCwjbWJfam9pbiB0ZXh0YXJlYSwjbWJfbGVhdmUgaW5wdXQsI21iX2xlYXZlIHRleHRhcmVhLCNtYl90cmlnZ2VyIGlucHV0LCNtYl90cmlnZ2VyIHRleHRhcmVhLCNtYl9hbm5vdW5jZW1lbnRzIGlucHV0LCNtYl9hbm5vdW5jZW1lbnRzIHRleHRhcmVhe2JvcmRlcjoycHggc29saWQgIzY2Njt3aWR0aDoxMDAlfSNtYl9qb2luIHRleHRhcmVhLCNtYl9sZWF2ZSB0ZXh0YXJlYSwjbWJfdHJpZ2dlciB0ZXh0YXJlYSwjbWJfYW5ub3VuY2VtZW50cyB0ZXh0YXJlYXtyZXNpemU6bm9uZTtvdmVyZmxvdzpoaWRkZW47cGFkZGluZzoxcHggMDtoZWlnaHQ6MjFweDt0cmFuc2l0aW9uOmhlaWdodCAwLjI1c30jbWJfam9pbiB0ZXh0YXJlYTpmb2N1cywjbWJfbGVhdmUgdGV4dGFyZWE6Zm9jdXMsI21iX3RyaWdnZXIgdGV4dGFyZWE6Zm9jdXMsI21iX2Fubm91bmNlbWVudHMgdGV4dGFyZWE6Zm9jdXN7aGVpZ2h0OjVlbX0jbWJfam9pbiBpbnB1dFt0eXBlPVxcXCJudW1iZXJcXFwiXSwjbWJfbGVhdmUgaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl0sI21iX3RyaWdnZXIgaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl0sI21iX2Fubm91bmNlbWVudHMgaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl17d2lkdGg6NWVtfSNqTXNncywjbE1zZ3MsI3RNc2dzLCNhTXNnc3tib3JkZXItdG9wOjFweCBzb2xpZCAjMDAwfSNqTXNncyBzbWFsbCwjbE1zZ3Mgc21hbGwsI3RNc2dzIHNtYWxsLCNhTXNncyBzbWFsbHtjb2xvcjojNzc3fVxcblwiO1xyXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbnVpLmFkZFRhYkdyb3VwKCdNZXNzYWdlcycsICdtZXNzYWdlcycpO1xyXG5cclxuW1xyXG4gICAgcmVxdWlyZSgnLi9qb2luJyksXHJcbiAgICByZXF1aXJlKCcuL2xlYXZlJyksXHJcbiAgICByZXF1aXJlKCcuL3RyaWdnZXInKSxcclxuICAgIHJlcXVpcmUoJy4vYW5ub3VuY2VtZW50cycpXHJcbl0uZm9yRWFjaCgoe3RhYiwgc2F2ZSwgYWRkTWVzc2FnZSwgc3RhcnR9KSA9PiB7XHJcbiAgICB0YWIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBjaGVja0RlbGV0ZShldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC50YXJnZXQudGFnTmFtZSAhPSAnQScpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdWkuYWxlcnQoJ1JlYWxseSBkZWxldGUgdGhpcyBtZXNzYWdlPycsIFtcclxuICAgICAgICAgICAge3RleHQ6ICdZZXMnLCBzdHlsZTogJ2RhbmdlcicsIGFjdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZWwgPSBldmVudC50YXJnZXQ7XHJcbiAgICAgICAgICAgICAgICB3aGlsZSAoKGVsID0gZWwucGFyZW50RWxlbWVudCkgJiYgIWVsLmNsYXNzTGlzdC5jb250YWlucygnY29sdW1uJykpXHJcbiAgICAgICAgICAgICAgICAgICAgO1xyXG4gICAgICAgICAgICAgICAgZWwucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzYXZlKCk7XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7dGV4dDogJ0NhbmNlbCd9XHJcbiAgICAgICAgXSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0YWIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgc2F2ZSk7XHJcblxyXG4gICAgdGFiLnF1ZXJ5U2VsZWN0b3IoJy5idXR0b24uaXMtcHJpbWFyeScpXHJcbiAgICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gYWRkTWVzc2FnZSgpKTtcclxuXHJcbiAgICAvLyBEb24ndCBzdGFydCByZXNwb25kaW5nIHRvIGNoYXQgZm9yIDEwIHNlY29uZHNcclxuICAgIHNldFRpbWVvdXQoc3RhcnQsIDEwMDAwKTtcclxufSk7XHJcblxyXG5bXHJcbiAgICByZXF1aXJlKCcuL2pvaW4nKSxcclxuICAgIHJlcXVpcmUoJy4vbGVhdmUnKSxcclxuICAgIHJlcXVpcmUoJy4vdHJpZ2dlcicpXHJcbl0uZm9yRWFjaCgoe3RhYn0pID0+IHtcclxuICAgIHRhYi5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIHZhciBlbCA9IGV2ZW50LnRhcmdldDtcclxuICAgICAgICB3aGlsZSAoKGVsID0gZWwucGFyZW50RWxlbWVudCkgJiYgIWVsLmNsYXNzTGlzdC5jb250YWlucygnY29sdW1uJykpXHJcbiAgICAgICAgICAgIDtcclxuXHJcbiAgICAgICAgaGVscGVycy5zaG93U3VtbWFyeShlbCk7XHJcbiAgICB9KTtcclxufSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuXHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ2pvaW5BcnInO1xyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignSm9pbicsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8dGVtcGxhdGUgaWQ9XFxcImpUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNvbHVtbiBpcy1vbmUtdGhpcmQtZGVza3RvcCBpcy1oYWxmLXRhYmxldFxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxsYWJlbD4gTWVzc2FnZTogPHRleHRhcmVhIGNsYXNzPVxcXCJtXFxcIj48L3RleHRhcmVhPjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGRldGFpbHM+PHN1bW1hcnk+TW9yZSBvcHRpb25zIDxzbWFsbCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+PC9zbWFsbD48L3N1bW1hcnk+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXM6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcImdyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFsbFxcXCI+YW55b25lPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXMgbm90OiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJub3RfZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibm9ib2R5XFxcIj5ub2JvZHk8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcInN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJvd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjBcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19sb3dcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3Bhbj4gJmxlOyBwbGF5ZXIgam9pbnMgJmxlOyA8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCI5OTk5XFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfaGlnaFxcXCI+XFxyXFxuICAgICAgICAgICAgPC9kZXRhaWxzPlxcclxcbiAgICAgICAgICAgIDxhPkRlbGV0ZTwvYT5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2pvaW5cXFwiIGNsYXNzPVxcXCJjb250YWluZXIgaXMtZmx1aWRcXFwiPlxcclxcbiAgICA8c2VjdGlvbiBjbGFzcz1cXFwic2VjdGlvbiBpcy1zbWFsbFxcXCI+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYnV0dG9uIGlzLXByaW1hcnkgaXMtcHVsbGVkLXJpZ2h0XFxcIj4rPC9zcGFuPlxcclxcbiAgICAgICAgPGgzPlRoZXNlIGFyZSBjaGVja2VkIHdoZW4gYSBwbGF5ZXIgam9pbnMgdGhlIHNlcnZlci48L2gzPlxcclxcbiAgICAgICAgPHNwYW4+WW91IGNhbiB1c2Uge3tOYW1lfX0sIHt7TkFNRX19LCB7e25hbWV9fSwgYW5kIHt7aXB9fSBpbiB5b3VyIG1lc3NhZ2UuPC9zcGFuPlxcclxcbiAgICA8L3NlY3Rpb24+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImpNc2dzXFxcIiBjbGFzcz1cXFwiY29sdW1ucyBpcy1tdWx0aWxpbmVcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxuICAgIHN0YXJ0OiAoKSA9PiBob29rLm9uKCd3b3JsZC5qb2luJywgb25Kb2luKSxcclxufTtcclxuXHJcbnZhciBqb2luTWVzc2FnZXMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSk7XHJcbmpvaW5NZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5cclxuQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI2pNc2dzID4gZGl2JykpXHJcbiAgICAuZm9yRWFjaChoZWxwZXJzLnNob3dTdW1tYXJ5KTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBhZGQgYSB0cmlnZ2VyIG1lc3NhZ2UgdG8gdGhlIHBhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKG1zZyA9IHt9KSB7XHJcbiAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNqVGVtcGxhdGUnLCAnI2pNc2dzJywgW1xyXG4gICAgICAgIHtzZWxlY3RvcjogJ29wdGlvbicsIHJlbW92ZTogWydzZWxlY3RlZCddLCBtdWx0aXBsZTogdHJ1ZX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLm0nLCB0ZXh0OiBtc2cubWVzc2FnZSB8fCAnJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJywgdmFsdWU6IG1zZy5qb2luc19sb3cgfHwgMH0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScsIHZhbHVlOiBtc2cuam9pbnNfaGlnaCB8fCA5OTk5fSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJncm91cFwiXSBbdmFsdWU9XCIke21zZy5ncm91cCB8fCAnYWxsJ31cIl1gLCBzZWxlY3RlZDogJ3NlbGVjdGVkJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLm5vdF9ncm91cCB8fCAnbm9ib2R5J31cIl1gLCBzZWxlY3RlZDogJ3NlbGVjdGVkJ31cclxuICAgIF0pO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzYXZlIHRoZSB1c2VyJ3MgbWVzc2FnZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgam9pbk1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjak1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgam9pbk1lc3NhZ2VzLnB1c2goe1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignLm0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfbG93OiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19oaWdoOiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBub3RfZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGpvaW5NZXNzYWdlcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGxpc3RlbiB0byBwbGF5ZXIgam9pbnNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICovXHJcbmZ1bmN0aW9uIG9uSm9pbihuYW1lKSB7XHJcbiAgICBqb2luTWVzc2FnZXMuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgIGlmIChoZWxwZXJzLmNoZWNrSm9pbnNBbmRHcm91cChuYW1lLCBtc2cpKSB7XHJcbiAgICAgICAgICAgIGhlbHBlcnMuYnVpbGRBbmRTZW5kTWVzc2FnZShtc2cubWVzc2FnZSwgbmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5cclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBoZWxwZXJzID0gcmVxdWlyZSgnbWVzc2FnZXMvaGVscGVycycpO1xyXG5cclxuXHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnbGVhdmVBcnInO1xyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignTGVhdmUnLCAnbWVzc2FnZXMnKTtcclxudGFiLmlubmVySFRNTCA9IFwiPHRlbXBsYXRlIGlkPVxcXCJsVGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb2x1bW4gaXMtb25lLXRoaXJkLWRlc2t0b3AgaXMtaGFsZi10YWJsZXRcXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYm94XFxcIj5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+TWVzc2FnZSA8dGV4dGFyZWEgY2xhc3M9XFxcIm1cXFwiPjwvdGV4dGFyZWE+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICA8ZGV0YWlscz48c3VtbWFyeT5Nb3JlIG9wdGlvbnMgPHNtYWxsIGNsYXNzPVxcXCJzdW1tYXJ5XFxcIj48L3NtYWxsPjwvc3VtbWFyeT5cXHJcXG4gICAgICAgICAgICAgICAgPGxhYmVsPlBsYXllciBpczogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwiZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWxsXFxcIj5hbnlvbmU8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcInN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJvd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICAgICAgPGxhYmVsPlBsYXllciBpcyBub3Q6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcIm5vdF9ncm91cFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJub2JvZHlcXFwiPm5vYm9keTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwic3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJtb2RcXFwiPmEgbW9kPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiMFxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2xvd1xcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxzcGFuPiAmbGU7IHBsYXllciBqb2lucyAmbGU7IDwvc3Bhbj5cXHJcXG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjk5OTlcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19oaWdoXFxcIj5cXHJcXG4gICAgICAgICAgICA8L2RldGFpbHM+XFxyXFxuICAgICAgICAgICAgPGE+RGVsZXRlPC9hPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvdGVtcGxhdGU+XFxyXFxuPGRpdiBpZD1cXFwibWJfbGVhdmVcXFwiIGNsYXNzPVxcXCJjb250YWluZXIgaXMtZmx1aWRcXFwiPlxcclxcbiAgICA8c2VjdGlvbiBjbGFzcz1cXFwic2VjdGlvbiBpcy1zbWFsbFxcXCI+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYnV0dG9uIGlzLXByaW1hcnkgaXMtcHVsbGVkLXJpZ2h0XFxcIj4rPC9zcGFuPlxcclxcbiAgICAgICAgPGgzPlRoZXNlIGFyZSBjaGVja2VkIHdoZW4gYSBwbGF5ZXIgbGVhdmVzIHRoZSBzZXJ2ZXIuPC9oMz5cXHJcXG4gICAgICAgIDxzcGFuPllvdSBjYW4gdXNlIHt7TmFtZX19LCB7e05BTUV9fSwge3tuYW1lfX0sIGFuZCB7e2lwfX0gaW4geW91ciBtZXNzYWdlLjwvc3Bhbj5cXHJcXG4gICAgPC9zZWN0aW9uPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJsTXNnc1xcXCIgY2xhc3M9XFxcImNvbHVtbnMgaXMtbXVsdGlsaW5lXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbiAgICBzdGFydDogKCkgPT4gaG9vay5vbignd29ybGQubGVhdmUnLCBvbkxlYXZlKSxcclxufTtcclxuXHJcbnZhciBsZWF2ZU1lc3NhZ2VzID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10pO1xyXG5sZWF2ZU1lc3NhZ2VzLmZvckVhY2goYWRkTWVzc2FnZSk7XHJcblxyXG5BcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjbE1zZ3MgPiBkaXYnKSlcclxuICAgIC5mb3JFYWNoKGhlbHBlcnMuc2hvd1N1bW1hcnkpO1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYSBsZWF2ZSBtZXNzYWdlIHRvIHRoZSBwYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkTWVzc2FnZShtc2cgPSB7fSkge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjbFRlbXBsYXRlJywgJyNsTXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICdvcHRpb24nLCByZW1vdmU6IFsnc2VsZWN0ZWQnXSwgbXVsdGlwbGU6IHRydWV9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy5tJywgdGV4dDogbXNnLm1lc3NhZ2UgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScsIHZhbHVlOiBtc2cuam9pbnNfbG93IHx8IDB9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2hpZ2ggfHwgOTk5OX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cuZ3JvdXAgfHwgJ2FsbCd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXSBbdmFsdWU9XCIke21zZy5ub3RfZ3JvdXAgfHwgJ25vYm9keSd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9XHJcbiAgICBdKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2F2ZSB0aGUgY3VycmVudCBsZWF2ZSBtZXNzYWdlc1xyXG4gKi9cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIGxlYXZlTWVzc2FnZXMgPSBbXTtcclxuICAgIEFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJyNsTXNncyA+IGRpdicpKS5mb3JFYWNoKGNvbnRhaW5lciA9PiB7XHJcbiAgICAgICAgaWYgKCFjb250YWluZXIucXVlcnlTZWxlY3RvcignLm0nKS52YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZWF2ZU1lc3NhZ2VzLnB1c2goe1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignLm0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfbG93OiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19oaWdoOiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBub3RfZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGxlYXZlTWVzc2FnZXMpO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBsaXN0ZW4gdG8gcGxheWVyIGRpc2Nvbm5lY3Rpb25zLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgcGxheWVyIGxlYXZpbmcuXHJcbiAqL1xyXG5mdW5jdGlvbiBvbkxlYXZlKG5hbWUpIHtcclxuICAgIGxlYXZlTWVzc2FnZXMuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgIGlmIChoZWxwZXJzLmNoZWNrSm9pbnNBbmRHcm91cChuYW1lLCBtc2cpKSB7XHJcbiAgICAgICAgICAgIGhlbHBlcnMuYnVpbGRBbmRTZW5kTWVzc2FnZShtc2cubWVzc2FnZSwgbmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5cclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBoZWxwZXJzID0gcmVxdWlyZSgnbWVzc2FnZXMvaGVscGVycycpO1xyXG5jb25zdCBzZXR0aW5ncyA9IHJlcXVpcmUoJ3NldHRpbmdzL2JvdCcpO1xyXG5cclxuXHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAndHJpZ2dlckFycic7XHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdUcmlnZ2VyJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjx0ZW1wbGF0ZSBpZD1cXFwidFRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY29sdW1uIGlzLW9uZS10aGlyZC1kZXNrdG9wIGlzLWhhbGYtdGFibGV0XFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPlRyaWdnZXI6IDxpbnB1dCBjbGFzcz1cXFwidFxcXCI+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+TWVzc2FnZTogPHRleHRhcmVhIGNsYXNzPVxcXCJtXFxcIj48L3RleHRhcmVhPjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGRldGFpbHM+PHN1bW1hcnk+TW9yZSBvcHRpb25zIDxzbWFsbCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+PC9zbWFsbD48L3N1bW1hcnk+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXM6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcImdyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFsbFxcXCI+YW55b25lPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXMgbm90OiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJub3RfZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibm9ib2R5XFxcIj5ub2JvZHk8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcInN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJvd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjBcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19sb3dcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3Bhbj4gJmxlOyBwbGF5ZXIgam9pbnMgJmxlOyA8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCI5OTk5XFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfaGlnaFxcXCI+XFxyXFxuICAgICAgICAgICAgPC9kZXRhaWxzPlxcclxcbiAgICAgICAgICAgIDxhPkRlbGV0ZTwvYT5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX3RyaWdnZXJcXFwiIGNsYXNzPVxcXCJjb250YWluZXIgaXMtZmx1aWRcXFwiPlxcclxcbiAgICA8c2VjdGlvbiBjbGFzcz1cXFwic2VjdGlvbiBpcy1zbWFsbFxcXCI+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYnV0dG9uIGlzLXByaW1hcnkgaXMtcHVsbGVkLXJpZ2h0XFxcIj4rPC9zcGFuPlxcclxcbiAgICAgICAgPGgzPlRoZXNlIGFyZSBjaGVja2VkIHdoZW5ldmVyIHNvbWVvbmUgc2F5cyBzb21ldGhpbmcuPC9oMz5cXHJcXG4gICAgICAgIDxzcGFuPllvdSBjYW4gdXNlIHt7TmFtZX19LCB7e05BTUV9fSwge3tuYW1lfX0sIGFuZCB7e2lwfX0gaW4geW91ciBtZXNzYWdlLiBJZiB5b3UgcHV0IGFuIGFzdGVyaXNrICgqKSBpbiB5b3VyIHRyaWdnZXIsIGl0IHdpbGwgYmUgdHJlYXRlZCBhcyBhIHdpbGRjYXJkLiAoVHJpZ2dlciBcXFwidGUqc3RcXFwiIHdpbGwgbWF0Y2ggXFxcInRlYSBzdHVmZlxcXCIgYW5kIFxcXCJ0ZXN0XFxcIik8L3NwYW4+XFxyXFxuICAgIDwvc2VjdGlvbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwidE1zZ3NcXFwiIGNsYXNzPVxcXCJjb2x1bW5zIGlzLW11bHRpbGluZVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGhvb2sub24oJ3dvcmxkLm1lc3NhZ2UnLCBjaGVja1RyaWdnZXJzKSxcclxufTtcclxuXHJcbnZhciB0cmlnZ2VyTWVzc2FnZXMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSk7XHJcbnRyaWdnZXJNZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5BcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjdE1zZ3MgPiBkaXYnKSlcclxuICAgIC5mb3JFYWNoKGhlbHBlcnMuc2hvd1N1bW1hcnkpO1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYSB0cmlnZ2VyIG1lc3NhZ2UgdG8gdGhlIHBhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKG1zZyA9IHt9KSB7XHJcbiAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyN0VGVtcGxhdGUnLCAnI3RNc2dzJywgW1xyXG4gICAgICAgIHtzZWxlY3RvcjogJ29wdGlvbicsIHJlbW92ZTogWydzZWxlY3RlZCddLCBtdWx0aXBsZTogdHJ1ZX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLm0nLCB0ZXh0OiBtc2cubWVzc2FnZSB8fCAnJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLnQnLCB2YWx1ZTogbXNnLnRyaWdnZXIgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScsIHZhbHVlOiBtc2cuam9pbnNfbG93IHx8IDB9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2hpZ2ggfHwgOTk5OX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cuZ3JvdXAgfHwgJ2FsbCd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXSBbdmFsdWU9XCIke21zZy5ub3RfZ3JvdXAgfHwgJ25vYm9keSd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9XHJcbiAgICBdKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNhdmVzIHRoZSBjdXJyZW50IHRyaWdnZXIgbWVzc2FnZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgdHJpZ2dlck1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjdE1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUgfHwgIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcudCcpLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyaWdnZXJNZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIHRyaWdnZXI6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcudCcpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19sb3c6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2hpZ2g6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImdyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIG5vdF9ncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgdHJpZ2dlck1lc3NhZ2VzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBhIHRyaWdnZXIgYWdhaW5zdCBhIG1lc3NhZ2UgdG8gc2VlIGlmIGl0IG1hdGNoZXMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0cmlnZ2VyIHRoZSB0cmlnZ2VyIHRvIHRyeSB0byBtYXRjaFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxyXG4gKi9cclxuZnVuY3Rpb24gdHJpZ2dlck1hdGNoKHRyaWdnZXIsIG1lc3NhZ2UpIHtcclxuICAgIGlmIChzZXR0aW5ncy5yZWdleFRyaWdnZXJzKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAodHJpZ2dlciwgJ2knKS50ZXN0KG1lc3NhZ2UpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgdWkubm90aWZ5KGBTa2lwcGluZyB0cmlnZ2VyICcke3RyaWdnZXJ9JyBhcyB0aGUgUmVnRXggaXMgaW52YWlsZC5gKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgUmVnRXhwKFxyXG4gICAgICAgICAgICB0cmlnZ2VyXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvKFsuKz9ePSE6JHt9KCl8XFxbXFxdXFwvXFxcXF0pL2csIFwiXFxcXCQxXCIpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwqL2csIFwiLipcIiksXHJcbiAgICAgICAgICAgICdpJ1xyXG4gICAgICAgICkudGVzdChtZXNzYWdlKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgaW5jb21pbmcgcGxheWVyIG1lc3NhZ2VzIGZvciB0cmlnZ2Vyc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgcGxheWVyJ3MgbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tUcmlnZ2VycyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICB2YXIgdG90YWxBbGxvd2VkID0gc2V0dGluZ3MubWF4UmVzcG9uc2VzO1xyXG4gICAgdHJpZ2dlck1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAodG90YWxBbGxvd2VkICYmIGhlbHBlcnMuY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykgJiYgdHJpZ2dlck1hdGNoKG1zZy50cmlnZ2VyLCBtZXNzYWdlKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgICAgICB0b3RhbEFsbG93ZWQtLTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgU1RPUkFHRV9JRCA9ICdtYl9wcmVmZXJlbmNlcyc7XHJcblxyXG52YXIgcHJlZnMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCB7fSwgZmFsc2UpO1xyXG5cclxuLy8gQXV0byBzYXZlIG9uIGNoYW5nZVxyXG4vLyBJRSAoYWxsKSAvIFNhZmFyaSAoPCAxMCkgZG9lc24ndCBzdXBwb3J0IHByb3hpZXNcclxuaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBwcmVmcztcclxuICAgIHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIHByZWZzLCBmYWxzZSk7XHJcbiAgICB9LCAzMCAqIDEwMDApO1xyXG59IGVsc2Uge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBwcmVmcyA9IG5ldyBQcm94eShwcmVmcywge1xyXG4gICAgICAgIHNldDogZnVuY3Rpb24ob2JqLCBwcm9wLCB2YWwpIHtcclxuICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gdmFsO1xyXG4gICAgICAgICAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgcHJlZnMsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy8gU2V0IHRoZSBkZWZhdWx0IHNldHRpbmdzXHJcbltcclxuICAgIHt0eXBlOiAnbnVtYmVyJywga2V5OiAnYW5ub3VuY2VtZW50RGVsYXknLCBkZWZhdWx0OiAxMH0sXHJcbiAgICB7dHlwZTogJ251bWJlcicsIGtleTogJ21heFJlc3BvbnNlcycsIGRlZmF1bHQ6IDJ9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnbm90aWZ5JywgZGVmYXVsdDogdHJ1ZX0sXHJcbiAgICAvLyBBZHZhbmNlZFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnZGlzYWJsZVRyaW0nLCBkZWZhdWx0OiBmYWxzZX0sXHJcbiAgICB7dHlwZTogJ2Jvb2xlYW4nLCBrZXk6ICdyZWdleFRyaWdnZXJzJywgZGVmYXVsdDogZmFsc2V9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnc3BsaXRNZXNzYWdlcycsIGRlZmF1bHQ6IGZhbHNlfSxcclxuICAgIHt0eXBlOiAndGV4dCcsIGtleTogJ3NwbGl0VG9rZW4nLCBkZWZhdWx0OiAnPHNwbGl0Pid9LFxyXG5dLmZvckVhY2gocHJlZiA9PiB7XHJcbiAgICAvLyBTZXQgZGVmYXVsdHMgaWYgbm90IHNldFxyXG4gICAgaWYgKHR5cGVvZiBwcmVmc1twcmVmLmtleV0gIT0gIHByZWYudHlwZSkge1xyXG4gICAgICAgIHByZWZzW3ByZWYua2V5XSA9IHByZWYuZGVmYXVsdDtcclxuICAgIH1cclxufSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3QgcHJlZnMgPSByZXF1aXJlKCdzZXR0aW5ncy9ib3QnKTtcclxuXHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdCb3QnLCAnc2V0dGluZ3MnKTtcclxudGFiLmlubmVySFRNTCA9IFwiPGRpdiBpZD1cXFwibWJfc2V0dGluZ3NcXFwiIGNsYXNzPVxcXCJjb250YWluZXJcXFwiPlxcclxcbiAgICA8aDMgY2xhc3M9XFxcInRpdGxlXFxcIj5HZW5lcmFsIFNldHRpbmdzPC9oMz5cXHJcXG4gICAgPGxhYmVsPk1pbnV0ZXMgYmV0d2VlbiBhbm5vdW5jZW1lbnRzPC9sYWJlbD5cXHJcXG4gICAgPHAgY2xhc3M9XFxcImNvbnRyb2xcXFwiPlxcclxcbiAgICAgICAgPGlucHV0IGNsYXNzPVxcXCJpbnB1dFxcXCIgZGF0YS1rZXk9XFxcImFubm91bmNlbWVudERlbGF5XFxcIiB0eXBlPVxcXCJudW1iZXJcXFwiPjxicj5cXHJcXG4gICAgPC9wPlxcclxcbiAgICA8bGFiZWw+TWF4aW11bSB0cmlnZ2VyIHJlc3BvbnNlcyB0byBhIG1lc3NhZ2U8L2xhYmVsPlxcclxcbiAgICA8cCBjbGFzcz1cXFwiY29udHJvbFxcXCI+XFxyXFxuICAgICAgICA8aW5wdXQgY2xhc3M9XFxcImlucHV0XFxcIiBkYXRhLWtleT1cXFwibWF4UmVzcG9uc2VzXFxcIiB0eXBlPVxcXCJudW1iZXJcXFwiPlxcclxcbiAgICA8L3A+XFxyXFxuICAgIDxwIGNsYXNzPVxcXCJjb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxsYWJlbCBjbGFzcz1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwibm90aWZ5XFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgTmV3IGNoYXQgbm90aWZpY2F0aW9uc1xcclxcbiAgICAgICAgPC9sYWJlbD5cXHJcXG4gICAgPC9wPlxcclxcblxcclxcbiAgICA8aHI+XFxyXFxuXFxyXFxuICAgIDxoMyBjbGFzcz1cXFwidGl0bGVcXFwiPkFkdmFuY2VkIFNldHRpbmdzPC9oMz5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwibWVzc2FnZSBpcy13YXJuaW5nXFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcIm1lc3NhZ2UtaGVhZGVyXFxcIj5cXHJcXG4gICAgICAgICAgICA8cD5XYXJuaW5nPC9wPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJtZXNzYWdlLWJvZHlcXFwiPlxcclxcbiAgICAgICAgICAgIDxwPkNoYW5naW5nIHRoZXNlIG9wdGlvbnMgY2FuIHJlc3VsdCBpbiB1bmV4cGVjdGVkIGJlaGF2aW9yLiA8YSBocmVmPVxcXCJodHRwczovL2dpdGh1Yi5jb20vQmlibGlvZmlsZS9CbG9ja2hlYWRzLU1lc3NhZ2VCb3Qvd2lraS8xLi1BZHZhbmNlZC1PcHRpb25zL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlJlYWQgdGhpcyBmaXJzdDwvYT48L3A+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICAgIDxwIGNsYXNzPVxcXCJjb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxsYWJlbCBjbGFzcz1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwicmVnZXhUcmlnZ2Vyc1xcXCIgdHlwZT1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIFBhcnNlIHRyaWdnZXJzIGFzIFJlZ0V4XFxyXFxuICAgICAgICA8L2xhYmVsPlxcclxcbiAgICA8L3A+XFxyXFxuICAgIDxwIGNsYXNzPVxcXCJjb250cm9sXFxcIj5cXHJcXG4gICAgICAgIDxsYWJlbCBjbGFzcz1cXFwiY2hlY2tib3hcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwiZGlzYWJsZVRyaW1cXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIj5cXHJcXG4gICAgICAgICAgICBEaXNhYmxlIHdoaXRlc3BhY2UgdHJpbW1pbmdcXHJcXG4gICAgICAgIDwvbGFiZWw+XFxyXFxuICAgIDwvcD5cXHJcXG4gICAgPHAgY2xhc3M9XFxcImNvbnRyb2xcXFwiPlxcclxcbiAgICAgICAgPGxhYmVsIGNsYXNzPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJzcGxpdE1lc3NhZ2VzXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+XFxyXFxuICAgICAgICAgICAgU3BsaXQgbWVzc2FnZXNcXHJcXG4gICAgICAgIDwvbGFiZWw+XFxyXFxuICAgIDwvcD5cXHJcXG4gICAgPGxhYmVsIGNsYXNzPVxcXCJsYWJlbFxcXCI+U3BsaXQgdG9rZW46PC9sYWJlbD5cXHJcXG4gICAgPHAgY2xhc3M9XFxcImNvbnRyb2xcXFwiPlxcclxcbiAgICAgICAgPGlucHV0IGNsYXNzPVxcXCJpbnB1dFxcXCIgZGF0YS1rZXk9XFxcInNwbGl0VG9rZW5cXFwiIHR5cGU9XFxcInRleHRcXFwiPlxcclxcbiAgICA8L3A+XFxyXFxuXFxyXFxuICAgIDxocj5cXHJcXG5cXHJcXG4gICAgPGgzIGNsYXNzPVxcXCJ0aXRsZVxcXCI+QmFja3VwIC8gUmVzdG9yZTwvaDM+XFxyXFxuICAgIDxhIGNsYXNzPVxcXCJidXR0b25cXFwiIGlkPVxcXCJtYl9iYWNrdXBfc2F2ZVxcXCI+R2V0IGJhY2t1cCBjb2RlPC9hPlxcclxcbiAgICA8YSBjbGFzcz1cXFwiYnV0dG9uXFxcIiBpZD1cXFwibWJfYmFja3VwX2xvYWRcXFwiPkltcG9ydCBiYWNrdXA8L2E+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG4vLyBTaG93IHByZWZzXHJcbk9iamVjdC5rZXlzKHByZWZzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICB2YXIgZWwgPSB0YWIucXVlcnlTZWxlY3RvcihgW2RhdGEta2V5PVwiJHtrZXl9XCJdYCk7XHJcbiAgICBzd2l0Y2ggKHR5cGVvZiBwcmVmc1trZXldKSB7XHJcbiAgICAgICAgY2FzZSAnYm9vbGVhbic6XHJcbiAgICAgICAgICAgIGVsLmNoZWNrZWQgPSBwcmVmc1trZXldO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBlbC52YWx1ZSA9IHByZWZzW2tleV07XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbi8vIFdhdGNoIGZvciBjaGFuZ2VzXHJcbnRhYi5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgdmFyIGdldFZhbHVlID0gKGtleSkgPT4gdGFiLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWtleT1cIiR7a2V5fVwiXWApLnZhbHVlO1xyXG4gICAgdmFyIGdldEludCA9IChrZXkpID0+ICtnZXRWYWx1ZShrZXkpO1xyXG4gICAgdmFyIGdldENoZWNrZWQgPSAoa2V5KSA9PiB0YWIucXVlcnlTZWxlY3RvcihgW2RhdGEta2V5PVwiJHtrZXl9XCJdYCkuY2hlY2tlZDtcclxuXHJcbiAgICBPYmplY3Qua2V5cyhwcmVmcykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIHZhciBmdW5jO1xyXG5cclxuICAgICAgICBzd2l0Y2godHlwZW9mIHByZWZzW2tleV0pIHtcclxuICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gZ2V0Q2hlY2tlZDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxyXG4gICAgICAgICAgICAgICAgZnVuYyA9IGdldEludDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgZnVuYyA9IGdldFZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJlZnNba2V5XSA9IGZ1bmMoa2V5KTtcclxuICAgIH0pO1xyXG59KTtcclxuXHJcblxyXG4vLyBHZXQgYmFja3VwXHJcbnRhYi5xdWVyeVNlbGVjdG9yKCcjbWJfYmFja3VwX3NhdmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIHNob3dCYWNrdXAoKSB7XHJcbiAgICB2YXIgYmFja3VwID0gSlNPTi5zdHJpbmdpZnkobG9jYWxTdG9yYWdlKS5yZXBsYWNlKC88L2csICcmbHQ7Jyk7XHJcbiAgICB1aS5hbGVydChgQ29weSB0aGlzIHRvIGEgc2FmZSBwbGFjZTo8YnI+PHRleHRhcmVhIGNsYXNzPVwidGV4dGFyZWFcIj4ke2JhY2t1cH08L3RleHRhcmVhPmApO1xyXG59KTtcclxuXHJcblxyXG4vLyBMb2FkIGJhY2t1cFxyXG50YWIucXVlcnlTZWxlY3RvcignI21iX2JhY2t1cF9sb2FkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBsb2FkQmFja3VwKCkge1xyXG4gICAgdWkuYWxlcnQoJ0VudGVyIHRoZSBiYWNrdXAgY29kZTo8dGV4dGFyZWEgY2xhc3M9XCJ0ZXh0YXJlYVwiPjwvdGV4dGFyZWE+JyxcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICB7IHRleHQ6ICdMb2FkICYgcmVmcmVzaCBwYWdlJywgc3R5bGU6ICdzdWNjZXNzJywgYWN0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQgdGV4dGFyZWEnKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUgPSBKU09OLnBhcnNlKGNvZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvZGUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYmFja3VwJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVpLm5vdGlmeSgnSW52YWxpZCBiYWNrdXAgY29kZS4gTm8gYWN0aW9uIHRha2VuLicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvZGUpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBjb2RlW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICB7IHRleHQ6ICdDYW5jZWwnIH1cclxuICAgICAgICAgICAgICAgIF0pO1xyXG59KTtcclxuIiwiY29uc3QgYmhmYW5zYXBpID0gcmVxdWlyZSgnbGlicmFyaWVzL2JoZmFuc2FwaScpO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBNZXNzYWdlQm90RXh0ZW5zaW9uID0gcmVxdWlyZSgnTWVzc2FnZUJvdEV4dGVuc2lvbicpO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0V4dGVuc2lvbnMnLCAnc2V0dGluZ3MnKTtcclxudGFiLmlubmVySFRNTCA9ICc8c3R5bGU+JyArXHJcbiAgICBcIkBrZXlmcmFtZXMgc3BpbkFyb3VuZHtmcm9te3RyYW5zZm9ybTpyb3RhdGUoMGRlZyl9dG97dHJhbnNmb3JtOnJvdGF0ZSgzNTlkZWcpfX0jZXh0c3tib3JkZXItdG9wOjFweCBzb2xpZCAjMDAwfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsjZXh0cyAuY2FyZC1jb250ZW50e2hlaWdodDoxMDVweH19XFxuXCIgK1xyXG4gICAgJzwvc3R5bGU+JyArXHJcbiAgICBcIjx0ZW1wbGF0ZSBpZD1cXFwiZXh0VGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb2x1bW4gaXMtb25lLXRoaXJkLWRlc2t0b3AgaXMtaGFsZi10YWJsZXRcXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiY2FyZFxcXCI+XFxyXFxuICAgICAgICAgICAgPGhlYWRlciBjbGFzcz1cXFwiY2FyZC1oZWFkZXJcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cXFwiY2FyZC1oZWFkZXItdGl0bGVcXFwiPjwvcD5cXHJcXG4gICAgICAgICAgICA8L2hlYWRlcj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjYXJkLWNvbnRlbnRcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwiY29udGVudFxcXCI+PC9zcGFuPlxcclxcbiAgICAgICAgICAgIDwvZGl2PlxcclxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImNhcmQtZm9vdGVyXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPGEgY2xhc3M9XFxcImNhcmQtZm9vdGVyLWl0ZW1cXFwiPkluc3RhbGw8L2E+XFxyXFxuICAgICAgICAgICAgPC9kaXY+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9leHRlbnNpb25zXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+TG9hZCBCeSBJRC9VUkw8L3NwYW4+XFxyXFxuICAgICAgICA8aDM+RXh0ZW5zaW9ucyBjYW4gaW5jcmVhc2UgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIGJvdC48L2gzPlxcclxcbiAgICAgICAgPHNwYW4+SW50ZXJlc3RlZCBpbiBjcmVhdGluZyBvbmU/IDxhIGhyZWY9XFxcImh0dHBzOi8vZ2l0aHViLmNvbS9CaWJsaW9maWxlL0Jsb2NraGVhZHMtTWVzc2FnZUJvdC93aWtpLzIuLURldmVsb3BtZW50Oi1TdGFydC1IZXJlXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+U3RhcnQgaGVyZS48L2E+PC9zcGFuPlxcclxcbiAgICA8L3NlY3Rpb24+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImV4dHNcXFwiIGNsYXNzPVxcXCJjb2x1bW5zIGlzLW11bHRpbGluZVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG4vL0NyZWF0ZSB0aGUgZXh0ZW5zaW9uIHN0b3JlIHBhZ2VcclxuYmhmYW5zYXBpLmdldFN0b3JlKCkudGhlbihyZXNwID0+IHtcclxuICAgIGlmIChyZXNwLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V4dHMnKS5pbm5lckhUTUwgKz0gcmVzcC5tZXNzYWdlO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gICAgcmVzcC5leHRlbnNpb25zLmZvckVhY2goZXh0ZW5zaW9uID0+IHtcclxuICAgICAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNleHRUZW1wbGF0ZScsICcjZXh0cycsIFtcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnLmNhcmQtaGVhZGVyLXRpdGxlJywgdGV4dDogZXh0ZW5zaW9uLnRpdGxlfSxcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnLmNvbnRlbnQnLCBodG1sOiBleHRlbnNpb24uc25pcHBldH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnLmNhcmQtZm9vdGVyLWl0ZW0nLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogTWVzc2FnZUJvdEV4dGVuc2lvbi5pc0xvYWRlZChleHRlbnNpb24uaWQpID8gJ1JlbW92ZScgOiAnSW5zdGFsbCcsXHJcbiAgICAgICAgICAgICAgICAnZGF0YS1pZCc6IGV4dGVuc2lvbi5pZFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSk7XHJcbiAgICB9KTtcclxufSkuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKTtcclxuXHJcbi8vIEluc3RhbGwgLyB1bmluc3RhbGwgZXh0ZW5zaW9uc1xyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZXh0cycpXHJcbiAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBleHRBY3Rpb25zKGUpIHtcclxuICAgICAgICB2YXIgZWwgPSBlLnRhcmdldDtcclxuICAgICAgICB2YXIgaWQgPSBlbC5kYXRhc2V0LmlkO1xyXG5cclxuICAgICAgICBpZiAoIWlkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChlbC50ZXh0Q29udGVudCA9PSAnSW5zdGFsbCcpIHtcclxuICAgICAgICAgICAgTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsKGlkKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBNZXNzYWdlQm90RXh0ZW5zaW9uLnVuaW5zdGFsbChpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG5cclxuaG9vay5vbignZXh0ZW5zaW9uLmluc3RhbGwnLCBmdW5jdGlvbihpZCkge1xyXG4gICAgLy8gU2hvdyByZW1vdmUgdG8gbGV0IHVzZXJzIHJlbW92ZSBleHRlbnNpb25zXHJcbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI21iX2V4dGVuc2lvbnMgW2RhdGEtaWQ9XCIke2lkfVwiXWApO1xyXG4gICAgaWYgKGJ1dHRvbikge1xyXG4gICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICdSZW1vdmUnO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbmhvb2sub24oJ2V4dGVuc2lvbi51bmluc3RhbGwnLCBmdW5jdGlvbihpZCkge1xyXG4gICAgLy8gU2hvdyByZW1vdmVkIGZvciBzdG9yZSBpbnN0YWxsIGJ1dHRvblxyXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNtYl9leHRlbnNpb25zIFtkYXRhLWlkPVwiJHtpZH1cIl1gKTtcclxuICAgIGlmIChidXR0b24pIHtcclxuICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnUmVtb3ZlZCc7XHJcbiAgICAgICAgYnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gJ0luc3RhbGwnO1xyXG4gICAgICAgICAgICBidXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICB9LCAzMDAwKTtcclxuICAgIH1cclxufSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxudWkuYWRkVGFiR3JvdXAoJ1NldHRpbmdzJywgJ3NldHRpbmdzJyk7XHJcblxyXG5yZXF1aXJlKCcuL2JvdC9wYWdlJyk7XHJcbnJlcXVpcmUoJy4vZXh0ZW5zaW9ucycpO1xyXG4iLCIvLyBPdmVyd3JpdGUgdGhlIHBvbGxDaGF0IGZ1bmN0aW9uIHRvIGtpbGwgdGhlIGRlZmF1bHQgY2hhdCBmdW5jdGlvblxyXG53aW5kb3cucG9sbENoYXQgPSBmdW5jdGlvbigpIHt9O1xyXG5cclxuLy8gT3ZlcndyaXRlIHRoZSBvbGQgcGFnZVxyXG5kb2N1bWVudC5ib2R5LmlubmVySFRNTCA9ICcnO1xyXG4vLyBTdHlsZSByZXNldFxyXG5BcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1t0eXBlPVwidGV4dC9jc3NcIl0nKSlcclxuICAgIC5mb3JFYWNoKGVsID0+IGVsLnJlbW92ZSgpKTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3RpdGxlJykudGV4dENvbnRlbnQgPSAnQ29uc29sZSAtIE1lc3NhZ2VCb3QnO1xyXG5cclxuLy8gU2V0IHRoZSBpY29uIHRvIHRoZSBibG9ja2hlYWQgaWNvbiB1c2VkIG9uIHRoZSBmb3J1bXNcclxudmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xyXG5lbC5yZWwgPSAnaWNvbic7XHJcbmVsLmhyZWYgPSAnaHR0cHM6Ly9pcy5nZC9NQnZVSEYnO1xyXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbnJlcXVpcmUoJ2NvbnNvbGUtYnJvd3NlcmlmeScpO1xyXG5yZXF1aXJlKCdib3QvbWlncmF0aW9uJyk7XHJcblxyXG5jb25zdCBiaGZhbnNhcGkgPSByZXF1aXJlKCdsaWJyYXJpZXMvYmhmYW5zYXBpJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmhvb2sub24oJ2Vycm9yX3JlcG9ydCcsIGZ1bmN0aW9uKG1zZykge1xyXG4gICAgdWkubm90aWZ5KG1zZyk7XHJcbn0pO1xyXG5cclxuLy8ganVzdCByZXF1aXJlKGNvbnNvbGUpIGRvZXNuJ3Qgd29yayBhcyBjb25zb2xlIGlzIGEgYnJvd3NlcmlmeSBtb2R1bGUuXHJcbnJlcXVpcmUoJy4vY29uc29sZScpO1xyXG4vLyBCeSBkZWZhdWx0IG5vIHRhYiBpcyBzZWxlY3RlZCwgc2hvdyB0aGUgY29uc29sZS5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm5hdi1zbGlkZXItY29udGFpbmVyIHNwYW4nKS5jbGljaygpO1xyXG5yZXF1aXJlKCdtZXNzYWdlcycpO1xyXG5yZXF1aXJlKCdzZXR0aW5ncycpO1xyXG5cclxuLy8gRXJyb3IgcmVwb3J0aW5nXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIChlcnIpID0+IHtcclxuICAgIGlmICghWydTY3JpcHQgZXJyb3InLCAnV29ybGQgbm90IHJ1bm5pbmcnXS5pbmNsdWRlcyhlcnIubWVzc2FnZSkpIHtcclxuICAgICAgICBiaGZhbnNhcGkucmVwb3J0RXJyb3IoZXJyKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vLyBFeHBvc2UgdGhlIGV4dGVuc2lvbiBBUElcclxud2luZG93Lk1lc3NhZ2VCb3RFeHRlbnNpb24gPSByZXF1aXJlKCdNZXNzYWdlQm90RXh0ZW5zaW9uJyk7XHJcbiIsInJlcXVpcmUoJy4vcG9seWZpbGxzL2RldGFpbHMnKTtcclxuXHJcbi8vIEJ1aWxkIHRoZSBBUElcclxuT2JqZWN0LmFzc2lnbihcclxuICAgIG1vZHVsZS5leHBvcnRzLFxyXG4gICAgcmVxdWlyZSgnLi9sYXlvdXQnKSxcclxuICAgIHJlcXVpcmUoJy4vdGVtcGxhdGUnKSxcclxuICAgIHJlcXVpcmUoJy4vbm90aWZpY2F0aW9ucycpXHJcbik7XHJcblxyXG4vLyBGdW5jdGlvbnMgd2hpY2ggYXJlIG5vIGxvbmdlciBjb250YWluZWQgaW4gdGhpcyBtb2R1bGUsIGJ1dCBhcmUgcmV0YWluZWQgZm9yIG5vdyBmb3IgYmFja3dhcmQgY29tcGF0YWJpbGl0eS5cclxuY29uc3Qgd3JpdGUgPSByZXF1aXJlKCcuLi9jb25zb2xlL2V4cG9ydHMnKS53cml0ZTtcclxubW9kdWxlLmV4cG9ydHMuYWRkTWVzc2FnZVRvQ29uc29sZSA9IGZ1bmN0aW9uKG1zZywgbmFtZSA9ICcnLCBuYW1lQ2xhc3MgPSAnJykge1xyXG4gICAgY29uc29sZS53YXJuKCd1aS5hZGRNZXNzYWdlVG9Db25zb2xlIGhhcyBiZWVuIGRlcHJpY2F0ZWQuIFVzZSBleC5jb25zb2xlLndyaXRlIGluc3RlYWQuJyk7XHJcbiAgICB3cml0ZShtc2csIG5hbWUsIG5hbWVDbGFzcyk7XHJcbn07XHJcbiIsIi8qKlxyXG4gKiBAZmlsZSBDb250YWlucyBmdW5jdGlvbnMgZm9yIG1hbmFnaW5nIHRoZSBwYWdlIGxheW91dFxyXG4gKi9cclxuXHJcblxyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuXHJcbi8vIEJ1aWxkIHBhZ2UgLSBvbmx5IGNhc2UgaW4gd2hpY2ggYm9keS5pbm5lckhUTUwgc2hvdWxkIGJlIHVzZWQuXHJcbmRvY3VtZW50LmJvZHkuaW5uZXJIVE1MICs9IFwiPGhlYWRlciBjbGFzcz1cXFwiaGVhZGVyIGlzLWZpeGVkLXRvcFxcXCI+XFxyXFxuICA8bmF2IGNsYXNzPVxcXCJuYXYtaW52ZXJzZSBuYXYgaGFzLXNoYWRvd1xcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcIm5hdi1sZWZ0XFxcIj5cXHJcXG4gICAgICA8ZGl2IGNsYXNzPVxcXCJuYXYtaXRlbSBuYXYtc2xpZGVyLXRvZ2dsZVxcXCI+XFxyXFxuICAgICAgICA8aW1nIHNyYz1cXFwiaHR0cHM6Ly9pLmltZ3NhZmUub3JnLzgwYTExMjlhMzYucG5nXFxcIj5cXHJcXG4gICAgICA8L2Rpdj5cXHJcXG4gICAgICA8YSBjbGFzcz1cXFwibmF2LWl0ZW0gaXMtdGFiIG5hdi1zbGlkZXItdG9nZ2xlXFxcIj5cXHJcXG4gICAgICAgIE1lbnVcXHJcXG4gICAgICA8L2E+XFxyXFxuICAgIDwvZGl2PlxcclxcbiAgPC9uYXY+XFxyXFxuPC9oZWFkZXI+XFxyXFxuXFxyXFxuPGRpdiBjbGFzcz1cXFwibmF2LXNsaWRlci1jb250YWluZXJcXFwiPlxcclxcbiAgICA8bmF2IGNsYXNzPVxcXCJuYXYtc2xpZGVyXFxcIiBkYXRhLXRhYi1ncm91cD1cXFwibWFpblxcXCI+PC9uYXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImlzLW92ZXJsYXlcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblxcclxcbjxkaXYgaWQ9XFxcImNvbnRhaW5lclxcXCIgY2xhc3M9XFxcImhhcy1maXhlZC1uYXZcXFwiPjwvZGl2PlxcclxcblwiO1xyXG5kb2N1bWVudC5oZWFkLmlubmVySFRNTCArPSAnPHN0eWxlPicgK1xyXG4gICAgXCJodG1se292ZXJmbG93LXk6YXV0byAhaW1wb3J0YW50fS8qISBidWxtYS5pbyB2MC4zLjEgfCBNSVQgTGljZW5zZSB8IGdpdGh1Yi5jb20vamd0aG1zL2J1bG1hICovQGtleWZyYW1lcyBzcGluQXJvdW5ke2Zyb217dHJhbnNmb3JtOnJvdGF0ZSgwZGVnKX10b3t0cmFuc2Zvcm06cm90YXRlKDM1OWRlZyl9fS8qISBtaW5pcmVzZXQuY3NzIHYwLjAuMiB8IE1JVCBMaWNlbnNlIHwgZ2l0aHViLmNvbS9qZ3RobXMvbWluaXJlc2V0LmNzcyAqL2h0bWwsYm9keSxwLG9sLHVsLGxpLGRsLGR0LGRkLGJsb2NrcXVvdGUsZmlndXJlLGZpZWxkc2V0LGxlZ2VuZCx0ZXh0YXJlYSxwcmUsaWZyYW1lLGhyLGgxLGgyLGgzLGg0LGg1LGg2e21hcmdpbjowO3BhZGRpbmc6MH1oMSxoMixoMyxoNCxoNSxoNntmb250LXNpemU6MTAwJTtmb250LXdlaWdodDpub3JtYWx9dWx7bGlzdC1zdHlsZTpub25lfWJ1dHRvbixpbnB1dCxzZWxlY3QsdGV4dGFyZWF7bWFyZ2luOjB9aHRtbHtib3gtc2l6aW5nOmJvcmRlci1ib3h9Kntib3gtc2l6aW5nOmluaGVyaXR9KjpiZWZvcmUsKjphZnRlcntib3gtc2l6aW5nOmluaGVyaXR9aW1nLGVtYmVkLG9iamVjdCxhdWRpbyx2aWRlb3toZWlnaHQ6YXV0bzttYXgtd2lkdGg6MTAwJX1pZnJhbWV7Ym9yZGVyOjB9dGFibGV7Ym9yZGVyLWNvbGxhcHNlOmNvbGxhcHNlO2JvcmRlci1zcGFjaW5nOjB9dGQsdGh7cGFkZGluZzowO3RleHQtYWxpZ246bGVmdH1odG1se2JhY2tncm91bmQtY29sb3I6I2ZmZjtmb250LXNpemU6MTRweDstbW96LW9zeC1mb250LXNtb290aGluZzpncmF5c2NhbGU7LXdlYmtpdC1mb250LXNtb290aGluZzphbnRpYWxpYXNlZDttaW4td2lkdGg6MzAwcHg7b3ZlcmZsb3cteDpoaWRkZW47b3ZlcmZsb3cteTpzY3JvbGw7dGV4dC1yZW5kZXJpbmc6b3B0aW1pemVMZWdpYmlsaXR5fWFydGljbGUsYXNpZGUsZmlndXJlLGZvb3RlcixoZWFkZXIsaGdyb3VwLHNlY3Rpb257ZGlzcGxheTpibG9ja31ib2R5LGJ1dHRvbixpbnB1dCxzZWxlY3QsdGV4dGFyZWF7Zm9udC1mYW1pbHk6LWFwcGxlLXN5c3RlbSxCbGlua01hY1N5c3RlbUZvbnQsXFxcIlNlZ29lIFVJXFxcIixcXFwiUm9ib3RvXFxcIixcXFwiT3h5Z2VuXFxcIixcXFwiVWJ1bnR1XFxcIixcXFwiQ2FudGFyZWxsXFxcIixcXFwiRmlyYSBTYW5zXFxcIixcXFwiRHJvaWQgU2Fuc1xcXCIsXFxcIkhlbHZldGljYSBOZXVlXFxcIixcXFwiSGVsdmV0aWNhXFxcIixcXFwiQXJpYWxcXFwiLHNhbnMtc2VyaWZ9Y29kZSxwcmV7LW1vei1vc3gtZm9udC1zbW9vdGhpbmc6YXV0bzstd2Via2l0LWZvbnQtc21vb3RoaW5nOmF1dG87Zm9udC1mYW1pbHk6XFxcIkluY29uc29sYXRhXFxcIixcXFwiQ29uc29sYXNcXFwiLFxcXCJNb25hY29cXFwiLG1vbm9zcGFjZX1ib2R5e2NvbG9yOiM0YTRhNGE7Zm9udC1zaXplOjFyZW07Zm9udC13ZWlnaHQ6NDAwO2xpbmUtaGVpZ2h0OjEuNX1he2NvbG9yOiMxODJiNzM7Y3Vyc29yOnBvaW50ZXI7dGV4dC1kZWNvcmF0aW9uOm5vbmU7dHJhbnNpdGlvbjpub25lIDg2bXMgZWFzZS1vdXR9YTpob3Zlcntjb2xvcjojMzYzNjM2fWNvZGV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOnJlZDtmb250LXNpemU6MC44ZW07Zm9udC13ZWlnaHQ6bm9ybWFsO3BhZGRpbmc6MC4yNWVtIDAuNWVtIDAuMjVlbX1ocntiYWNrZ3JvdW5kLWNvbG9yOiNkYmRiZGI7Ym9yZGVyOm5vbmU7ZGlzcGxheTpibG9jaztoZWlnaHQ6MXB4O21hcmdpbjoxLjVyZW0gMH1pbWd7bWF4LXdpZHRoOjEwMCV9aW5wdXRbdHlwZT1cXFwiY2hlY2tib3hcXFwiXSxpbnB1dFt0eXBlPVxcXCJyYWRpb1xcXCJde3ZlcnRpY2FsLWFsaWduOmJhc2VsaW5lfXNtYWxse2ZvbnQtc2l6ZTowLjhlbX1zcGFue2ZvbnQtc3R5bGU6aW5oZXJpdDtmb250LXdlaWdodDppbmhlcml0fXN0cm9uZ3tjb2xvcjojMzYzNjM2O2ZvbnQtd2VpZ2h0OjcwMH1wcmV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiM0YTRhNGE7Zm9udC1zaXplOjAuOGVtO3doaXRlLXNwYWNlOnByZTt3b3JkLXdyYXA6bm9ybWFsfXByZSBjb2Rle2JhY2tncm91bmQ6bm9uZTtjb2xvcjppbmhlcml0O2Rpc3BsYXk6YmxvY2s7Zm9udC1zaXplOjFlbTtvdmVyZmxvdy14OmF1dG87cGFkZGluZzoxLjI1cmVtIDEuNXJlbX10YWJsZXt3aWR0aDoxMDAlfXRhYmxlIHRkLHRhYmxlIHRoe3RleHQtYWxpZ246bGVmdDt2ZXJ0aWNhbC1hbGlnbjp0b3B9dGFibGUgdGh7Y29sb3I6IzM2MzYzNn0uaXMtYmxvY2t7ZGlzcGxheTpibG9ja31AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmlzLWJsb2NrLW1vYmlsZXtkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaXMtYmxvY2stdGFibGV0e2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWJsb2NrLXRhYmxldC1vbmx5e2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1ibG9jay10b3VjaHtkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmlzLWJsb2NrLWRlc2t0b3B7ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpIGFuZCAobWF4LXdpZHRoOiAxMTkxcHgpey5pcy1ibG9jay1kZXNrdG9wLW9ubHl7ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMTkycHgpey5pcy1ibG9jay13aWRlc2NyZWVue2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19LmlzLWZsZXh7ZGlzcGxheTpmbGV4fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtZmxleC1tb2JpbGV7ZGlzcGxheTpmbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaXMtZmxleC10YWJsZXR7ZGlzcGxheTpmbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1mbGV4LXRhYmxldC1vbmx5e2Rpc3BsYXk6ZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWZsZXgtdG91Y2h7ZGlzcGxheTpmbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmlzLWZsZXgtZGVza3RvcHtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KSBhbmQgKG1heC13aWR0aDogMTE5MXB4KXsuaXMtZmxleC1kZXNrdG9wLW9ubHl7ZGlzcGxheTpmbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWZsZXgtd2lkZXNjcmVlbntkaXNwbGF5OmZsZXggIWltcG9ydGFudH19LmlzLWlubGluZXtkaXNwbGF5OmlubGluZX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmlzLWlubGluZS1tb2JpbGV7ZGlzcGxheTppbmxpbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5pcy1pbmxpbmUtdGFibGV0e2Rpc3BsYXk6aW5saW5lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1pbmxpbmUtdGFibGV0LW9ubHl7ZGlzcGxheTppbmxpbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1pbmxpbmUtdG91Y2h7ZGlzcGxheTppbmxpbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuaXMtaW5saW5lLWRlc2t0b3B7ZGlzcGxheTppbmxpbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KSBhbmQgKG1heC13aWR0aDogMTE5MXB4KXsuaXMtaW5saW5lLWRlc2t0b3Atb25seXtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMTkycHgpey5pcy1pbmxpbmUtd2lkZXNjcmVlbntkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX0uaXMtaW5saW5lLWJsb2Nre2Rpc3BsYXk6aW5saW5lLWJsb2NrfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtaW5saW5lLWJsb2NrLW1vYmlsZXtkaXNwbGF5OmlubGluZS1ibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmlzLWlubGluZS1ibG9jay10YWJsZXR7ZGlzcGxheTppbmxpbmUtYmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWlubGluZS1ibG9jay10YWJsZXQtb25seXtkaXNwbGF5OmlubGluZS1ibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWlubGluZS1ibG9jay10b3VjaHtkaXNwbGF5OmlubGluZS1ibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5pcy1pbmxpbmUtYmxvY2stZGVza3RvcHtkaXNwbGF5OmlubGluZS1ibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpIGFuZCAobWF4LXdpZHRoOiAxMTkxcHgpey5pcy1pbmxpbmUtYmxvY2stZGVza3RvcC1vbmx5e2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWlubGluZS1ibG9jay13aWRlc2NyZWVue2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fS5pcy1pbmxpbmUtZmxleHtkaXNwbGF5OmlubGluZS1mbGV4fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtaW5saW5lLWZsZXgtbW9iaWxle2Rpc3BsYXk6aW5saW5lLWZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5pcy1pbmxpbmUtZmxleC10YWJsZXR7ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaW5saW5lLWZsZXgtdGFibGV0LW9ubHl7ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWlubGluZS1mbGV4LXRvdWNoe2Rpc3BsYXk6aW5saW5lLWZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuaXMtaW5saW5lLWZsZXgtZGVza3RvcHtkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCkgYW5kIChtYXgtd2lkdGg6IDExOTFweCl7LmlzLWlubGluZS1mbGV4LWRlc2t0b3Atb25seXtkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWlubGluZS1mbGV4LXdpZGVzY3JlZW57ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX0uaXMtY2xlYXJmaXg6YWZ0ZXJ7Y2xlYXI6Ym90aDtjb250ZW50OlxcXCIgXFxcIjtkaXNwbGF5OnRhYmxlfS5pcy1wdWxsZWQtbGVmdHtmbG9hdDpsZWZ0fS5pcy1wdWxsZWQtcmlnaHR7ZmxvYXQ6cmlnaHR9LmlzLWNsaXBwZWR7b3ZlcmZsb3c6aGlkZGVuICFpbXBvcnRhbnR9LmlzLW92ZXJsYXl7Ym90dG9tOjA7bGVmdDowO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjB9Lmhhcy10ZXh0LWNlbnRlcmVke3RleHQtYWxpZ246Y2VudGVyfS5oYXMtdGV4dC1sZWZ0e3RleHQtYWxpZ246bGVmdH0uaGFzLXRleHQtcmlnaHR7dGV4dC1hbGlnbjpyaWdodH0uaXMtaGlkZGVue2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtaGlkZGVuLW1vYmlsZXtkaXNwbGF5Om5vbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5pcy1oaWRkZW4tdGFibGV0e2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaGlkZGVuLXRhYmxldC1vbmx5e2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWhpZGRlbi10b3VjaHtkaXNwbGF5Om5vbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuaXMtaGlkZGVuLWRlc2t0b3B7ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCkgYW5kIChtYXgtd2lkdGg6IDExOTFweCl7LmlzLWhpZGRlbi1kZXNrdG9wLW9ubHl7ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWhpZGRlbi13aWRlc2NyZWVue2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX0uaXMtZGlzYWJsZWR7cG9pbnRlci1ldmVudHM6bm9uZX0uaXMtbWFyZ2lubGVzc3ttYXJnaW46MCAhaW1wb3J0YW50fS5pcy1wYWRkaW5nbGVzc3twYWRkaW5nOjAgIWltcG9ydGFudH0uaXMtdW5zZWxlY3RhYmxley13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZX0uYm94e2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItcmFkaXVzOjVweDtib3gtc2hhZG93OjAgMnB4IDNweCByZ2JhKDEwLDEwLDEwLDAuMSksMCAwIDAgMXB4IHJnYmEoMTAsMTAsMTAsMC4xKTtkaXNwbGF5OmJsb2NrO3BhZGRpbmc6MS4yNXJlbX0uYm94Om5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19YS5ib3g6aG92ZXIsYS5ib3g6Zm9jdXN7Ym94LXNoYWRvdzowIDJweCAzcHggcmdiYSgxMCwxMCwxMCwwLjEpLDAgMCAwIDFweCAjMTgyYjczfWEuYm94OmFjdGl2ZXtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMiksMCAwIDAgMXB4ICMxODJiNzN9LmJ1dHRvbnstbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTthbGlnbi1pdGVtczpjZW50ZXI7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czozcHg7Ym94LXNoYWRvdzpub25lO2Rpc3BsYXk6aW5saW5lLWZsZXg7Zm9udC1zaXplOjFyZW07aGVpZ2h0OjIuMjg1ZW07anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7bGluZS1oZWlnaHQ6MS41O3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW07cG9zaXRpb246cmVsYXRpdmU7dmVydGljYWwtYWxpZ246dG9wOy13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZTtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO2NvbG9yOiMzNjM2MzY7Y3Vyc29yOnBvaW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjtwYWRkaW5nLWxlZnQ6MC43NWVtO3BhZGRpbmctcmlnaHQ6MC43NWVtO3RleHQtYWxpZ246Y2VudGVyO3doaXRlLXNwYWNlOm5vd3JhcH0uYnV0dG9uOmZvY3VzLC5idXR0b24uaXMtZm9jdXNlZCwuYnV0dG9uOmFjdGl2ZSwuYnV0dG9uLmlzLWFjdGl2ZXtvdXRsaW5lOm5vbmV9LmJ1dHRvbltkaXNhYmxlZF0sLmJ1dHRvbi5pcy1kaXNhYmxlZHtwb2ludGVyLWV2ZW50czpub25lfS5idXR0b24gc3Ryb25ne2NvbG9yOmluaGVyaXR9LmJ1dHRvbiAuaWNvbjpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uMjVyZW07bWFyZ2luLXJpZ2h0Oi41cmVtfS5idXR0b24gLmljb246bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tbGVmdDouNXJlbTttYXJnaW4tcmlnaHQ6LS4yNXJlbX0uYnV0dG9uIC5pY29uOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS4yNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMjVyZW0pfS5idXR0b24gLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDowcmVtfS5idXR0b24gLmljb24uaXMtc21hbGw6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6MHJlbX0uYnV0dG9uIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgMHJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIDByZW0pfS5idXR0b24gLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS41cmVtfS5idXR0b24gLmljb24uaXMtbWVkaXVtOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uNXJlbX0uYnV0dG9uIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uNXJlbSl9LmJ1dHRvbiAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0xcmVtfS5idXR0b24gLmljb24uaXMtbGFyZ2U6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LTFyZW19LmJ1dHRvbiAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0xcmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLTFyZW0pfS5idXR0b246aG92ZXIsLmJ1dHRvbi5pcy1ob3ZlcmVke2JvcmRlci1jb2xvcjojYjViNWI1O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbjpmb2N1cywuYnV0dG9uLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOiMxODJiNzM7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgyNCw0MywxMTUsMC4yNSk7Y29sb3I6IzM2MzYzNn0uYnV0dG9uOmFjdGl2ZSwuYnV0dG9uLmlzLWFjdGl2ZXtib3JkZXItY29sb3I6IzRhNGE0YTtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpbmt7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6IzRhNGE0YTt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lfS5idXR0b24uaXMtbGluazpob3ZlciwuYnV0dG9uLmlzLWxpbmsuaXMtaG92ZXJlZCwuYnV0dG9uLmlzLWxpbms6Zm9jdXMsLmJ1dHRvbi5pcy1saW5rLmlzLWZvY3VzZWQsLmJ1dHRvbi5pcy1saW5rOmFjdGl2ZSwuYnV0dG9uLmlzLWxpbmsuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtd2hpdGV7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGU6aG92ZXIsLmJ1dHRvbi5pcy13aGl0ZS5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6I2Y5ZjlmOTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLXdoaXRlOmZvY3VzLC5idXR0b24uaXMtd2hpdGUuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgyNTUsMjU1LDI1NSwwLjI1KTtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGU6YWN0aXZlLC5idXR0b24uaXMtd2hpdGUuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6I2YyZjJmMjtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXdoaXRlLmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6IzAwMH0uYnV0dG9uLmlzLXdoaXRlLmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICMwYTBhMGEgIzBhMGEwYSAhaW1wb3J0YW50fS5idXR0b24uaXMtd2hpdGUuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtd2hpdGUuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy13aGl0ZS5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLXdoaXRlLmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMwYTBhMGE7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLXdoaXRlLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFja3tiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjazpob3ZlciwuYnV0dG9uLmlzLWJsYWNrLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojMDQwNDA0O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtYmxhY2s6Zm9jdXMsLmJ1dHRvbi5pcy1ibGFjay5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDEwLDEwLDEwLDAuMjUpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjazphY3RpdmUsLmJ1dHRvbi5pcy1ibGFjay5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojMDAwO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjJmMmYyfS5idXR0b24uaXMtYmxhY2suaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZiAjZmZmICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy1ibGFjay5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMGEwYTBhO2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy1ibGFjay5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWJsYWNrLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtib3JkZXItY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLWxpZ2h0e2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0OmhvdmVyLC5idXR0b24uaXMtbGlnaHQuaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiNlZWU7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1saWdodDpmb2N1cywuYnV0dG9uLmlzLWxpZ2h0LmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMjQ1LDI0NSwyNDUsMC4yNSk7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0OmFjdGl2ZSwuYnV0dG9uLmlzLWxpZ2h0LmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiNlOGU4ZTg7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiMyOTI5Mjl9LmJ1dHRvbi5pcy1saWdodC5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjMzYzNjM2ICMzNjM2MzYgIWltcG9ydGFudH0uYnV0dG9uLmlzLWxpZ2h0LmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWxpZ2h0LmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtbGlnaHQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1jb2xvcjojZjVmNWY1O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMzYzNjM2O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFya3tiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1kYXJrOmhvdmVyLC5idXR0b24uaXMtZGFyay5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6IzJmMmYyZjtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcms6Zm9jdXMsLmJ1dHRvbi5pcy1kYXJrLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoNTQsNTQsNTQsMC4yNSk7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcms6YWN0aXZlLC5idXR0b24uaXMtZGFyay5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojMjkyOTI5O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2U4ZThlOH0uYnV0dG9uLmlzLWRhcmsuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2Y1ZjVmNSAjZjVmNWY1ICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy1kYXJrLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMzNjM2MzY7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWRhcmsuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1kYXJrLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtib3JkZXItY29sb3I6IzM2MzYzNjtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZjVmNWY1O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLXByaW1hcnl7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtcHJpbWFyeTpob3ZlciwuYnV0dG9uLmlzLXByaW1hcnkuaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiMxNjI3Njg7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5OmZvY3VzLC5idXR0b24uaXMtcHJpbWFyeS5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDI0LDQzLDExNSwwLjI1KTtjb2xvcjojZmZmfS5idXR0b24uaXMtcHJpbWFyeTphY3RpdmUsLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMxNDIzNWU7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojZmZmfS5idXR0b24uaXMtcHJpbWFyeS5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzE4MmI3M30uYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjJmMmYyfS5idXR0b24uaXMtcHJpbWFyeS5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZmZmICNmZmYgIWltcG9ydGFudH0uYnV0dG9uLmlzLXByaW1hcnkuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6IzE4MmI3Mztjb2xvcjojMTgyYjczfS5idXR0b24uaXMtcHJpbWFyeS5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXByaW1hcnkuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2JvcmRlci1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMTgyYjczfS5idXR0b24uaXMtaW5mb3tiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1pbmZvOmhvdmVyLC5idXR0b24uaXMtaW5mby5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6IzI3NmNkYTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWluZm86Zm9jdXMsLmJ1dHRvbi5pcy1pbmZvLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoNTAsMTE1LDIyMCwwLjI1KTtjb2xvcjojZmZmfS5idXR0b24uaXMtaW5mbzphY3RpdmUsLmJ1dHRvbi5pcy1pbmZvLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMyMzY2ZDE7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojZmZmfS5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzMyNzNkY30uYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjJmMmYyfS5idXR0b24uaXMtaW5mby5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZmZmICNmZmYgIWltcG9ydGFudH0uYnV0dG9uLmlzLWluZm8uaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6IzMyNzNkYztjb2xvcjojMzI3M2RjfS5idXR0b24uaXMtaW5mby5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWluZm8uaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjO2JvcmRlci1jb2xvcjojMzI3M2RjO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMzI3M2RjfS5idXR0b24uaXMtc3VjY2Vzc3tiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1zdWNjZXNzOmhvdmVyLC5idXR0b24uaXMtc3VjY2Vzcy5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6IzIyYzY1Yjtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3M6Zm9jdXMsLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMzUsMjA5LDk2LDAuMjUpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1zdWNjZXNzOmFjdGl2ZSwuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6IzIwYmM1Njtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMjNkMTYwfS5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50fS5idXR0b24uaXMtc3VjY2Vzcy5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMjNkMTYwO2NvbG9yOiMyM2QxNjB9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtc3VjY2Vzcy5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Ym9yZGVyLWNvbG9yOiMyM2QxNjA7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMyM2QxNjB9LmJ1dHRvbi5pcy13YXJuaW5ne2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1Nztib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZzpob3ZlciwuYnV0dG9uLmlzLXdhcm5pbmcuaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmZmRiNGE7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmc6Zm9jdXMsLmJ1dHRvbi5pcy13YXJuaW5nLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMjU1LDIyMSw4NywwLjI1KTtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9LmJ1dHRvbi5pcy13YXJuaW5nOmFjdGl2ZSwuYnV0dG9uLmlzLXdhcm5pbmcuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6I2ZmZDgzZDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLDAuNyk7Y29sb3I6I2ZmZGQ1N30uYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLDAuNyl9LmJ1dHRvbi5pcy13YXJuaW5nLmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50IHJnYmEoMCwwLDAsMC43KSByZ2JhKDAsMCwwLDAuNykgIWltcG9ydGFudH0uYnV0dG9uLmlzLXdhcm5pbmcuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZGQ1Nztjb2xvcjojZmZkZDU3fS5idXR0b24uaXMtd2FybmluZy5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXdhcm5pbmcuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2JvcmRlci1jb2xvcjojZmZkZDU3O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6cmdiYSgwLDAsMCwwLjcpO2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy13YXJuaW5nLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6cmdiYSgwLDAsMCwwLjcpO2NvbG9yOiNmZmRkNTd9LmJ1dHRvbi5pcy1kYW5nZXJ7YmFja2dyb3VuZC1jb2xvcjpyZWQ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1kYW5nZXI6aG92ZXIsLmJ1dHRvbi5pcy1kYW5nZXIuaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmMjAwMDA7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1kYW5nZXI6Zm9jdXMsLmJ1dHRvbi5pcy1kYW5nZXIuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgyNTUsMCwwLDAuMjUpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1kYW5nZXI6YWN0aXZlLC5idXR0b24uaXMtZGFuZ2VyLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiNlNjAwMDA7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojZmZmfS5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjpyZWR9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjJmMmYyfS5idXR0b24uaXMtZGFuZ2VyLmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50fS5idXR0b24uaXMtZGFuZ2VyLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOnJlZDtjb2xvcjpyZWR9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1kYW5nZXIuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjpyZWQ7Ym9yZGVyLWNvbG9yOnJlZDtjb2xvcjojZmZmfS5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6cmVkfS5idXR0b24uaXMtc21hbGx7Ym9yZGVyLXJhZGl1czoycHg7Zm9udC1zaXplOi43NXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS4zNzVyZW07bWFyZ2luLXJpZ2h0Oi4zNzVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbjpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi4zNzVyZW07bWFyZ2luLXJpZ2h0Oi0uMzc1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb246Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjM3NXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMzc1cmVtKX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS4xMjVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1zbWFsbDpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotLjEyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS4xMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjEyNXJlbSl9LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1tZWRpdW06Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjYyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLW1lZGl1bTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotLjYyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uNjI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS42MjVyZW0pfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotMS4xMjVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1sYXJnZTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotMS4xMjVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0xLjEyNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0xLjEyNXJlbSl9LmJ1dHRvbi5pcy1tZWRpdW17Zm9udC1zaXplOjEuMjVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb246Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjEyNXJlbTttYXJnaW4tcmlnaHQ6LjYyNXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbjpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi42MjVyZW07bWFyZ2luLXJpZ2h0Oi0uMTI1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS4xMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjEyNXJlbSl9LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDouMTI1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uLmlzLXNtYWxsOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi4xMjVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAuMTI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLjEyNXJlbSl9LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS4zNzVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbWVkaXVtOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uMzc1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uMzc1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS4zNzVyZW0pfS5idXR0b24uaXMtbWVkaXVtIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS44NzVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbGFyZ2U6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS44NzVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjg3NXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uODc1cmVtKX0uYnV0dG9uLmlzLWxhcmdle2ZvbnQtc2l6ZToxLjVyZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbjpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0OjByZW07bWFyZ2luLXJpZ2h0Oi43NXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6Ljc1cmVtO21hcmdpbi1yaWdodDowcmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb246Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAwcmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgMHJlbSl9LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi4yNXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLXNtYWxsOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi4yNXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLjI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLjI1cmVtKX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uMjVyZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbi5pcy1tZWRpdW06bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS4yNXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjI1cmVtKX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS43NXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLWxhcmdlOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uNzVyZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uNzVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjc1cmVtKX0uYnV0dG9uW2Rpc2FibGVkXSwuYnV0dG9uLmlzLWRpc2FibGVke29wYWNpdHk6MC41fS5idXR0b24uaXMtZnVsbHdpZHRoe2Rpc3BsYXk6ZmxleDt3aWR0aDoxMDAlfS5idXR0b24uaXMtbG9hZGluZ3tjb2xvcjp0cmFuc3BhcmVudCAhaW1wb3J0YW50O3BvaW50ZXItZXZlbnRzOm5vbmV9LmJ1dHRvbi5pcy1sb2FkaW5nOmFmdGVye2FuaW1hdGlvbjpzcGluQXJvdW5kIDUwMG1zIGluZmluaXRlIGxpbmVhcjtib3JkZXI6MnB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtib3JkZXItcmlnaHQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLXRvcC1jb2xvcjp0cmFuc3BhcmVudDtjb250ZW50OlxcXCJcXFwiO2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjFyZW07cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MXJlbTtsZWZ0OjUwJTttYXJnaW4tbGVmdDotOHB4O21hcmdpbi10b3A6LThweDtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3Bvc2l0aW9uOmFic29sdXRlICFpbXBvcnRhbnR9LmNvbnRlbnR7Y29sb3I6IzRhNGE0YX0uY29udGVudDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5jb250ZW50IGxpK2xpe21hcmdpbi10b3A6MC4yNWVtfS5jb250ZW50IHA6bm90KDpsYXN0LWNoaWxkKSwuY29udGVudCBvbDpub3QoOmxhc3QtY2hpbGQpLC5jb250ZW50IHVsOm5vdCg6bGFzdC1jaGlsZCksLmNvbnRlbnQgYmxvY2txdW90ZTpub3QoOmxhc3QtY2hpbGQpLC5jb250ZW50IHRhYmxlOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxZW19LmNvbnRlbnQgaDEsLmNvbnRlbnQgaDIsLmNvbnRlbnQgaDMsLmNvbnRlbnQgaDQsLmNvbnRlbnQgaDUsLmNvbnRlbnQgaDZ7Y29sb3I6IzM2MzYzNjtmb250LXdlaWdodDo0MDA7bGluZS1oZWlnaHQ6MS4xMjV9LmNvbnRlbnQgaDF7Zm9udC1zaXplOjJlbTttYXJnaW4tYm90dG9tOjAuNWVtfS5jb250ZW50IGgxOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi10b3A6MWVtfS5jb250ZW50IGgye2ZvbnQtc2l6ZToxLjc1ZW07bWFyZ2luLWJvdHRvbTowLjU3MTRlbX0uY29udGVudCBoMjpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tdG9wOjEuMTQyOGVtfS5jb250ZW50IGgze2ZvbnQtc2l6ZToxLjVlbTttYXJnaW4tYm90dG9tOjAuNjY2NmVtfS5jb250ZW50IGgzOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi10b3A6MS4zMzMzZW19LmNvbnRlbnQgaDR7Zm9udC1zaXplOjEuMjVlbTttYXJnaW4tYm90dG9tOjAuOGVtfS5jb250ZW50IGg1e2ZvbnQtc2l6ZToxLjEyNWVtO21hcmdpbi1ib3R0b206MC44ODg4ZW19LmNvbnRlbnQgaDZ7Zm9udC1zaXplOjFlbTttYXJnaW4tYm90dG9tOjFlbX0uY29udGVudCBibG9ja3F1b3Rle2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItbGVmdDo1cHggc29saWQgI2RiZGJkYjtwYWRkaW5nOjEuMjVlbSAxLjVlbX0uY29udGVudCBvbHtsaXN0LXN0eWxlOmRlY2ltYWwgb3V0c2lkZTttYXJnaW4tbGVmdDoyZW07bWFyZ2luLXJpZ2h0OjJlbTttYXJnaW4tdG9wOjFlbX0uY29udGVudCB1bHtsaXN0LXN0eWxlOmRpc2Mgb3V0c2lkZTttYXJnaW4tbGVmdDoyZW07bWFyZ2luLXJpZ2h0OjJlbTttYXJnaW4tdG9wOjFlbX0uY29udGVudCB1bCB1bHtsaXN0LXN0eWxlLXR5cGU6Y2lyY2xlO21hcmdpbi10b3A6MC41ZW19LmNvbnRlbnQgdWwgdWwgdWx7bGlzdC1zdHlsZS10eXBlOnNxdWFyZX0uY29udGVudCB0YWJsZXt3aWR0aDoxMDAlfS5jb250ZW50IHRhYmxlIHRkLC5jb250ZW50IHRhYmxlIHRoe2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtib3JkZXItd2lkdGg6MCAwIDFweDtwYWRkaW5nOjAuNWVtIDAuNzVlbTt2ZXJ0aWNhbC1hbGlnbjp0b3B9LmNvbnRlbnQgdGFibGUgdGh7Y29sb3I6IzM2MzYzNjt0ZXh0LWFsaWduOmxlZnR9LmNvbnRlbnQgdGFibGUgdHI6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5jb250ZW50IHRhYmxlIHRoZWFkIHRkLC5jb250ZW50IHRhYmxlIHRoZWFkIHRoe2JvcmRlci13aWR0aDowIDAgMnB4O2NvbG9yOiMzNjM2MzZ9LmNvbnRlbnQgdGFibGUgdGZvb3QgdGQsLmNvbnRlbnQgdGFibGUgdGZvb3QgdGh7Ym9yZGVyLXdpZHRoOjJweCAwIDA7Y29sb3I6IzM2MzYzNn0uY29udGVudCB0YWJsZSB0Ym9keSB0cjpsYXN0LWNoaWxkIHRkLC5jb250ZW50IHRhYmxlIHRib2R5IHRyOmxhc3QtY2hpbGQgdGh7Ym9yZGVyLWJvdHRvbS13aWR0aDowfS5jb250ZW50LmlzLXNtYWxse2ZvbnQtc2l6ZTouNzVyZW19LmNvbnRlbnQuaXMtbWVkaXVte2ZvbnQtc2l6ZToxLjI1cmVtfS5jb250ZW50LmlzLWxhcmdle2ZvbnQtc2l6ZToxLjVyZW19LmlucHV0LC50ZXh0YXJlYXstbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTthbGlnbi1pdGVtczpjZW50ZXI7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czozcHg7Ym94LXNoYWRvdzpub25lO2Rpc3BsYXk6aW5saW5lLWZsZXg7Zm9udC1zaXplOjFyZW07aGVpZ2h0OjIuMjg1ZW07anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7bGluZS1oZWlnaHQ6MS41O3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW07cG9zaXRpb246cmVsYXRpdmU7dmVydGljYWwtYWxpZ246dG9wO2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7Y29sb3I6IzM2MzYzNjtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMSk7bWF4LXdpZHRoOjEwMCU7d2lkdGg6MTAwJX0uaW5wdXQ6Zm9jdXMsLmlucHV0LmlzLWZvY3VzZWQsLmlucHV0OmFjdGl2ZSwuaW5wdXQuaXMtYWN0aXZlLC50ZXh0YXJlYTpmb2N1cywudGV4dGFyZWEuaXMtZm9jdXNlZCwudGV4dGFyZWE6YWN0aXZlLC50ZXh0YXJlYS5pcy1hY3RpdmV7b3V0bGluZTpub25lfS5pbnB1dFtkaXNhYmxlZF0sLmlucHV0LmlzLWRpc2FibGVkLC50ZXh0YXJlYVtkaXNhYmxlZF0sLnRleHRhcmVhLmlzLWRpc2FibGVke3BvaW50ZXItZXZlbnRzOm5vbmV9LmlucHV0OmhvdmVyLC5pbnB1dC5pcy1ob3ZlcmVkLC50ZXh0YXJlYTpob3ZlciwudGV4dGFyZWEuaXMtaG92ZXJlZHtib3JkZXItY29sb3I6I2I1YjViNX0uaW5wdXQ6Zm9jdXMsLmlucHV0LmlzLWZvY3VzZWQsLmlucHV0OmFjdGl2ZSwuaW5wdXQuaXMtYWN0aXZlLC50ZXh0YXJlYTpmb2N1cywudGV4dGFyZWEuaXMtZm9jdXNlZCwudGV4dGFyZWE6YWN0aXZlLC50ZXh0YXJlYS5pcy1hY3RpdmV7Ym9yZGVyLWNvbG9yOiMxODJiNzN9LmlucHV0W2Rpc2FibGVkXSwuaW5wdXQuaXMtZGlzYWJsZWQsLnRleHRhcmVhW2Rpc2FibGVkXSwudGV4dGFyZWEuaXMtZGlzYWJsZWR7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1jb2xvcjojZjVmNWY1O2JveC1zaGFkb3c6bm9uZTtjb2xvcjojN2E3YTdhfS5pbnB1dFtkaXNhYmxlZF06Oi1tb3otcGxhY2Vob2xkZXIsLmlucHV0LmlzLWRpc2FibGVkOjotbW96LXBsYWNlaG9sZGVyLC50ZXh0YXJlYVtkaXNhYmxlZF06Oi1tb3otcGxhY2Vob2xkZXIsLnRleHRhcmVhLmlzLWRpc2FibGVkOjotbW96LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uaW5wdXRbZGlzYWJsZWRdOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyLC5pbnB1dC5pcy1kaXNhYmxlZDo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlciwudGV4dGFyZWFbZGlzYWJsZWRdOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyLC50ZXh0YXJlYS5pcy1kaXNhYmxlZDo6LXdlYmtpdC1pbnB1dC1wbGFjZWhvbGRlcntjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuMyl9LmlucHV0W2Rpc2FibGVkXTotbW96LXBsYWNlaG9sZGVyLC5pbnB1dC5pcy1kaXNhYmxlZDotbW96LXBsYWNlaG9sZGVyLC50ZXh0YXJlYVtkaXNhYmxlZF06LW1vei1wbGFjZWhvbGRlciwudGV4dGFyZWEuaXMtZGlzYWJsZWQ6LW1vei1wbGFjZWhvbGRlcntjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuMyl9LmlucHV0W2Rpc2FibGVkXTotbXMtaW5wdXQtcGxhY2Vob2xkZXIsLmlucHV0LmlzLWRpc2FibGVkOi1tcy1pbnB1dC1wbGFjZWhvbGRlciwudGV4dGFyZWFbZGlzYWJsZWRdOi1tcy1pbnB1dC1wbGFjZWhvbGRlciwudGV4dGFyZWEuaXMtZGlzYWJsZWQ6LW1zLWlucHV0LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uaW5wdXRbdHlwZT1cXFwic2VhcmNoXFxcIl0sLnRleHRhcmVhW3R5cGU9XFxcInNlYXJjaFxcXCJde2JvcmRlci1yYWRpdXM6MjkwNDg2cHh9LmlucHV0LmlzLXdoaXRlLC50ZXh0YXJlYS5pcy13aGl0ZXtib3JkZXItY29sb3I6I2ZmZn0uaW5wdXQuaXMtYmxhY2ssLnRleHRhcmVhLmlzLWJsYWNre2JvcmRlci1jb2xvcjojMGEwYTBhfS5pbnB1dC5pcy1saWdodCwudGV4dGFyZWEuaXMtbGlnaHR7Ym9yZGVyLWNvbG9yOiNmNWY1ZjV9LmlucHV0LmlzLWRhcmssLnRleHRhcmVhLmlzLWRhcmt7Ym9yZGVyLWNvbG9yOiMzNjM2MzZ9LmlucHV0LmlzLXByaW1hcnksLnRleHRhcmVhLmlzLXByaW1hcnl7Ym9yZGVyLWNvbG9yOiMxODJiNzN9LmlucHV0LmlzLWluZm8sLnRleHRhcmVhLmlzLWluZm97Ym9yZGVyLWNvbG9yOiMzMjczZGN9LmlucHV0LmlzLXN1Y2Nlc3MsLnRleHRhcmVhLmlzLXN1Y2Nlc3N7Ym9yZGVyLWNvbG9yOiMyM2QxNjB9LmlucHV0LmlzLXdhcm5pbmcsLnRleHRhcmVhLmlzLXdhcm5pbmd7Ym9yZGVyLWNvbG9yOiNmZmRkNTd9LmlucHV0LmlzLWRhbmdlciwudGV4dGFyZWEuaXMtZGFuZ2Vye2JvcmRlci1jb2xvcjpyZWR9LmlucHV0LmlzLXNtYWxsLC50ZXh0YXJlYS5pcy1zbWFsbHtib3JkZXItcmFkaXVzOjJweDtmb250LXNpemU6Ljc1cmVtfS5pbnB1dC5pcy1tZWRpdW0sLnRleHRhcmVhLmlzLW1lZGl1bXtmb250LXNpemU6MS4yNXJlbX0uaW5wdXQuaXMtbGFyZ2UsLnRleHRhcmVhLmlzLWxhcmdle2ZvbnQtc2l6ZToxLjVyZW19LmlucHV0LmlzLWZ1bGx3aWR0aCwudGV4dGFyZWEuaXMtZnVsbHdpZHRoe2Rpc3BsYXk6YmxvY2s7d2lkdGg6MTAwJX0uaW5wdXQuaXMtaW5saW5lLC50ZXh0YXJlYS5pcy1pbmxpbmV7ZGlzcGxheTppbmxpbmU7d2lkdGg6YXV0b30udGV4dGFyZWF7ZGlzcGxheTpibG9jaztsaW5lLWhlaWdodDoxLjI1O21heC1oZWlnaHQ6NjAwcHg7bWF4LXdpZHRoOjEwMCU7bWluLWhlaWdodDoxMjBweDttaW4td2lkdGg6MTAwJTtwYWRkaW5nOjEwcHg7cmVzaXplOnZlcnRpY2FsfS5jaGVja2JveCwucmFkaW97YWxpZ24taXRlbXM6Y2VudGVyO2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6aW5saW5lLWZsZXg7ZmxleC13cmFwOndyYXA7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7cG9zaXRpb246cmVsYXRpdmU7dmVydGljYWwtYWxpZ246dG9wfS5jaGVja2JveCBpbnB1dCwucmFkaW8gaW5wdXR7Y3Vyc29yOnBvaW50ZXI7bWFyZ2luLXJpZ2h0OjAuNWVtfS5jaGVja2JveDpob3ZlciwucmFkaW86aG92ZXJ7Y29sb3I6IzM2MzYzNn0uY2hlY2tib3guaXMtZGlzYWJsZWQsLnJhZGlvLmlzLWRpc2FibGVke2NvbG9yOiM3YTdhN2E7cG9pbnRlci1ldmVudHM6bm9uZX0uY2hlY2tib3guaXMtZGlzYWJsZWQgaW5wdXQsLnJhZGlvLmlzLWRpc2FibGVkIGlucHV0e3BvaW50ZXItZXZlbnRzOm5vbmV9LnJhZGlvKy5yYWRpb3ttYXJnaW4tbGVmdDowLjVlbX0uc2VsZWN0e2Rpc3BsYXk6aW5saW5lLWJsb2NrO2hlaWdodDoyLjVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3B9LnNlbGVjdDphZnRlcntib3JkZXI6MXB4IHNvbGlkICMxODJiNzM7Ym9yZGVyLXJpZ2h0OjA7Ym9yZGVyLXRvcDowO2NvbnRlbnQ6XFxcIiBcXFwiO2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjAuNWVtO3BvaW50ZXItZXZlbnRzOm5vbmU7cG9zaXRpb246YWJzb2x1dGU7dHJhbnNmb3JtOnJvdGF0ZSgtNDVkZWcpO3dpZHRoOjAuNWVtO21hcmdpbi10b3A6LTAuMzc1ZW07cmlnaHQ6MS4xMjVlbTt0b3A6NTAlO3otaW5kZXg6NH0uc2VsZWN0IHNlbGVjdHstbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTthbGlnbi1pdGVtczpjZW50ZXI7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czozcHg7Ym94LXNoYWRvdzpub25lO2Rpc3BsYXk6aW5saW5lLWZsZXg7Zm9udC1zaXplOjFyZW07aGVpZ2h0OjIuMjg1ZW07anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7bGluZS1oZWlnaHQ6MS41O3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW07cG9zaXRpb246cmVsYXRpdmU7dmVydGljYWwtYWxpZ246dG9wO2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7Y29sb3I6IzM2MzYzNjtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZToxZW07b3V0bGluZTpub25lO3BhZGRpbmctcmlnaHQ6Mi41ZW19LnNlbGVjdCBzZWxlY3Q6Zm9jdXMsLnNlbGVjdCBzZWxlY3QuaXMtZm9jdXNlZCwuc2VsZWN0IHNlbGVjdDphY3RpdmUsLnNlbGVjdCBzZWxlY3QuaXMtYWN0aXZle291dGxpbmU6bm9uZX0uc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF0sLnNlbGVjdCBzZWxlY3QuaXMtZGlzYWJsZWR7cG9pbnRlci1ldmVudHM6bm9uZX0uc2VsZWN0IHNlbGVjdDpob3Zlciwuc2VsZWN0IHNlbGVjdC5pcy1ob3ZlcmVke2JvcmRlci1jb2xvcjojYjViNWI1fS5zZWxlY3Qgc2VsZWN0OmZvY3VzLC5zZWxlY3Qgc2VsZWN0LmlzLWZvY3VzZWQsLnNlbGVjdCBzZWxlY3Q6YWN0aXZlLC5zZWxlY3Qgc2VsZWN0LmlzLWFjdGl2ZXtib3JkZXItY29sb3I6IzE4MmI3M30uc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF0sLnNlbGVjdCBzZWxlY3QuaXMtZGlzYWJsZWR7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1jb2xvcjojZjVmNWY1O2JveC1zaGFkb3c6bm9uZTtjb2xvcjojN2E3YTdhfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXTo6LW1vei1wbGFjZWhvbGRlciwuc2VsZWN0IHNlbGVjdC5pcy1kaXNhYmxlZDo6LW1vei1wbGFjZWhvbGRlcntjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuMyl9LnNlbGVjdCBzZWxlY3RbZGlzYWJsZWRdOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyLC5zZWxlY3Qgc2VsZWN0LmlzLWRpc2FibGVkOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF06LW1vei1wbGFjZWhvbGRlciwuc2VsZWN0IHNlbGVjdC5pcy1kaXNhYmxlZDotbW96LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF06LW1zLWlucHV0LXBsYWNlaG9sZGVyLC5zZWxlY3Qgc2VsZWN0LmlzLWRpc2FibGVkOi1tcy1pbnB1dC1wbGFjZWhvbGRlcntjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuMyl9LnNlbGVjdCBzZWxlY3Q6aG92ZXJ7Ym9yZGVyLWNvbG9yOiNiNWI1YjV9LnNlbGVjdCBzZWxlY3Q6Om1zLWV4cGFuZHtkaXNwbGF5Om5vbmV9LnNlbGVjdDpob3ZlcjphZnRlcntib3JkZXItY29sb3I6IzM2MzYzNn0uc2VsZWN0LmlzLXNtYWxse2JvcmRlci1yYWRpdXM6MnB4O2ZvbnQtc2l6ZTouNzVyZW19LnNlbGVjdC5pcy1tZWRpdW17Zm9udC1zaXplOjEuMjVyZW19LnNlbGVjdC5pcy1sYXJnZXtmb250LXNpemU6MS41cmVtfS5zZWxlY3QuaXMtZnVsbHdpZHRoe3dpZHRoOjEwMCV9LnNlbGVjdC5pcy1mdWxsd2lkdGggc2VsZWN0e3dpZHRoOjEwMCV9LmxhYmVse2NvbG9yOiMzNjM2MzY7ZGlzcGxheTpibG9jaztmb250LXdlaWdodDpib2xkfS5sYWJlbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC41ZW19LmhlbHB7ZGlzcGxheTpibG9jaztmb250LXNpemU6Ljc1cmVtO21hcmdpbi10b3A6NXB4fS5oZWxwLmlzLXdoaXRle2NvbG9yOiNmZmZ9LmhlbHAuaXMtYmxhY2t7Y29sb3I6IzBhMGEwYX0uaGVscC5pcy1saWdodHtjb2xvcjojZjVmNWY1fS5oZWxwLmlzLWRhcmt7Y29sb3I6IzM2MzYzNn0uaGVscC5pcy1wcmltYXJ5e2NvbG9yOiMxODJiNzN9LmhlbHAuaXMtaW5mb3tjb2xvcjojMzI3M2RjfS5oZWxwLmlzLXN1Y2Nlc3N7Y29sb3I6IzIzZDE2MH0uaGVscC5pcy13YXJuaW5ne2NvbG9yOiNmZmRkNTd9LmhlbHAuaXMtZGFuZ2Vye2NvbG9yOnJlZH1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmNvbnRyb2wtbGFiZWx7bWFyZ2luLWJvdHRvbTowLjVlbX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5jb250cm9sLWxhYmVse2ZsZXgtYmFzaXM6MDtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowO21hcmdpbi1yaWdodDoxLjVlbTtwYWRkaW5nLXRvcDowLjVlbTt0ZXh0LWFsaWduOnJpZ2h0fX0uY29udHJvbHtwb3NpdGlvbjpyZWxhdGl2ZTt0ZXh0LWFsaWduOmxlZnR9LmNvbnRyb2w6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNzVyZW19LmNvbnRyb2wuaGFzLWFkZG9uc3tkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0LC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdHtib3JkZXItcmFkaXVzOjA7bWFyZ2luLXJpZ2h0Oi0xcHg7d2lkdGg6YXV0b30uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246aG92ZXIsLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQ6aG92ZXIsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0OmhvdmVye3otaW5kZXg6Mn0uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246Zm9jdXMsLmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uOmFjdGl2ZSwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDpmb2N1cywuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDphY3RpdmUsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0OmZvY3VzLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDphY3RpdmV7ei1pbmRleDozfS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpmaXJzdC1jaGlsZCwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDpmaXJzdC1jaGlsZCwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6Zmlyc3QtY2hpbGR7Ym9yZGVyLXJhZGl1czozcHggMCAwIDNweH0uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246Zmlyc3QtY2hpbGQgc2VsZWN0LC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0OmZpcnN0LWNoaWxkIHNlbGVjdCwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6Zmlyc3QtY2hpbGQgc2VsZWN0e2JvcmRlci1yYWRpdXM6M3B4IDAgMCAzcHh9LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uOmxhc3QtY2hpbGQsLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQ6bGFzdC1jaGlsZCwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6bGFzdC1jaGlsZHtib3JkZXItcmFkaXVzOjAgM3B4IDNweCAwfS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpsYXN0LWNoaWxkIHNlbGVjdCwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDpsYXN0LWNoaWxkIHNlbGVjdCwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6bGFzdC1jaGlsZCBzZWxlY3R7Ym9yZGVyLXJhZGl1czowIDNweCAzcHggMH0uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b24uaXMtZXhwYW5kZWQsLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQuaXMtZXhwYW5kZWQsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0LmlzLWV4cGFuZGVke2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjB9LmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0IHNlbGVjdDpob3Zlcnt6LWluZGV4OjJ9LmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0IHNlbGVjdDpmb2N1cywuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Qgc2VsZWN0OmFjdGl2ZXt6LWluZGV4OjN9LmNvbnRyb2wuaGFzLWFkZG9ucy5oYXMtYWRkb25zLWNlbnRlcmVke2p1c3RpZnktY29udGVudDpjZW50ZXJ9LmNvbnRyb2wuaGFzLWFkZG9ucy5oYXMtYWRkb25zLXJpZ2h0e2p1c3RpZnktY29udGVudDpmbGV4LWVuZH0uY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtZnVsbHdpZHRoIC5idXR0b24sLmNvbnRyb2wuaGFzLWFkZG9ucy5oYXMtYWRkb25zLWZ1bGx3aWR0aCAuaW5wdXQsLmNvbnRyb2wuaGFzLWFkZG9ucy5oYXMtYWRkb25zLWZ1bGx3aWR0aCAuc2VsZWN0e2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjB9LmNvbnRyb2wuaGFzLWljb24gLmljb257Y29sb3I6I2RiZGJkYjtwb2ludGVyLWV2ZW50czpub25lO3Bvc2l0aW9uOmFic29sdXRlO3RvcDoxLjI1cmVtO3otaW5kZXg6NH0uY29udHJvbC5oYXMtaWNvbiAuaW5wdXQ6Zm9jdXMrLmljb257Y29sb3I6IzdhN2E3YX0uY29udHJvbC5oYXMtaWNvbiAuaW5wdXQuaXMtc21hbGwrLmljb257dG9wOi45Mzc1cmVtfS5jb250cm9sLmhhcy1pY29uIC5pbnB1dC5pcy1tZWRpdW0rLmljb257dG9wOjEuNTYyNXJlbX0uY29udHJvbC5oYXMtaWNvbiAuaW5wdXQuaXMtbGFyZ2UrLmljb257dG9wOjEuODc1cmVtfS5jb250cm9sLmhhcy1pY29uOm5vdCguaGFzLWljb24tcmlnaHQpIC5pY29ue2xlZnQ6MS4yNXJlbTt0cmFuc2Zvcm06dHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpfS5jb250cm9sLmhhcy1pY29uOm5vdCguaGFzLWljb24tcmlnaHQpIC5pbnB1dHtwYWRkaW5nLWxlZnQ6Mi41ZW19LmNvbnRyb2wuaGFzLWljb246bm90KC5oYXMtaWNvbi1yaWdodCkgLmlucHV0LmlzLXNtYWxsKy5pY29ue2xlZnQ6LjkzNzVyZW19LmNvbnRyb2wuaGFzLWljb246bm90KC5oYXMtaWNvbi1yaWdodCkgLmlucHV0LmlzLW1lZGl1bSsuaWNvbntsZWZ0OjEuNTYyNXJlbX0uY29udHJvbC5oYXMtaWNvbjpub3QoLmhhcy1pY29uLXJpZ2h0KSAuaW5wdXQuaXMtbGFyZ2UrLmljb257bGVmdDoxLjg3NXJlbX0uY29udHJvbC5oYXMtaWNvbi5oYXMtaWNvbi1yaWdodCAuaWNvbntyaWdodDoxLjI1cmVtO3RyYW5zZm9ybTp0cmFuc2xhdGVYKDUwJSkgdHJhbnNsYXRlWSgtNTAlKX0uY29udHJvbC5oYXMtaWNvbi5oYXMtaWNvbi1yaWdodCAuaW5wdXR7cGFkZGluZy1yaWdodDoyLjVlbX0uY29udHJvbC5oYXMtaWNvbi5oYXMtaWNvbi1yaWdodCAuaW5wdXQuaXMtc21hbGwrLmljb257cmlnaHQ6LjkzNzVyZW19LmNvbnRyb2wuaGFzLWljb24uaGFzLWljb24tcmlnaHQgLmlucHV0LmlzLW1lZGl1bSsuaWNvbntyaWdodDoxLjU2MjVyZW19LmNvbnRyb2wuaGFzLWljb24uaGFzLWljb24tcmlnaHQgLmlucHV0LmlzLWxhcmdlKy5pY29ue3JpZ2h0OjEuODc1cmVtfS5jb250cm9sLmlzLWdyb3VwZWR7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0fS5jb250cm9sLmlzLWdyb3VwZWQ+LmNvbnRyb2x7ZmxleC1iYXNpczowO2ZsZXgtc2hyaW5rOjB9LmNvbnRyb2wuaXMtZ3JvdXBlZD4uY29udHJvbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MDttYXJnaW4tcmlnaHQ6MC43NXJlbX0uY29udHJvbC5pcy1ncm91cGVkPi5jb250cm9sLmlzLWV4cGFuZGVke2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjF9LmNvbnRyb2wuaXMtZ3JvdXBlZC5pcy1ncm91cGVkLWNlbnRlcmVke2p1c3RpZnktY29udGVudDpjZW50ZXJ9LmNvbnRyb2wuaXMtZ3JvdXBlZC5pcy1ncm91cGVkLXJpZ2h0e2p1c3RpZnktY29udGVudDpmbGV4LWVuZH1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmNvbnRyb2wuaXMtaG9yaXpvbnRhbHtkaXNwbGF5OmZsZXh9LmNvbnRyb2wuaXMtaG9yaXpvbnRhbD4uY29udHJvbHtkaXNwbGF5OmZsZXg7ZmxleC1iYXNpczowO2ZsZXgtZ3Jvdzo1O2ZsZXgtc2hyaW5rOjF9fS5jb250cm9sLmlzLWxvYWRpbmc6YWZ0ZXJ7YW5pbWF0aW9uOnNwaW5Bcm91bmQgNTAwbXMgaW5maW5pdGUgbGluZWFyO2JvcmRlcjoycHggc29saWQgI2RiZGJkYjtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2JvcmRlci1yaWdodC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItdG9wLWNvbG9yOnRyYW5zcGFyZW50O2NvbnRlbnQ6XFxcIlxcXCI7ZGlzcGxheTpibG9jaztoZWlnaHQ6MXJlbTtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoxcmVtO3Bvc2l0aW9uOmFic29sdXRlICFpbXBvcnRhbnQ7cmlnaHQ6MC43NWVtO3RvcDowLjc1ZW19Lmljb257ZGlzcGxheTppbmxpbmUtYmxvY2s7Zm9udC1zaXplOjIxcHg7aGVpZ2h0OjEuNXJlbTtsaW5lLWhlaWdodDoxLjVyZW07dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjEuNXJlbX0uaWNvbiAuZmF7Zm9udC1zaXplOmluaGVyaXQ7bGluZS1oZWlnaHQ6aW5oZXJpdH0uaWNvbi5pcy1zbWFsbHtkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MTRweDtoZWlnaHQ6MXJlbTtsaW5lLWhlaWdodDoxcmVtO3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcDt3aWR0aDoxcmVtfS5pY29uLmlzLW1lZGl1bXtkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MjhweDtoZWlnaHQ6MnJlbTtsaW5lLWhlaWdodDoycmVtO3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcDt3aWR0aDoycmVtfS5pY29uLmlzLWxhcmdle2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZTo0MnB4O2hlaWdodDozcmVtO2xpbmUtaGVpZ2h0OjNyZW07dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjNyZW19LmltYWdle2Rpc3BsYXk6YmxvY2s7cG9zaXRpb246cmVsYXRpdmV9LmltYWdlIGltZ3tkaXNwbGF5OmJsb2NrO2hlaWdodDphdXRvO3dpZHRoOjEwMCV9LmltYWdlLmlzLXNxdWFyZSBpbWcsLmltYWdlLmlzLTFieTEgaW1nLC5pbWFnZS5pcy00YnkzIGltZywuaW1hZ2UuaXMtM2J5MiBpbWcsLmltYWdlLmlzLTE2Ynk5IGltZywuaW1hZ2UuaXMtMmJ5MSBpbWd7Ym90dG9tOjA7bGVmdDowO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjA7aGVpZ2h0OjEwMCU7d2lkdGg6MTAwJX0uaW1hZ2UuaXMtc3F1YXJlLC5pbWFnZS5pcy0xYnkxe3BhZGRpbmctdG9wOjEwMCV9LmltYWdlLmlzLTRieTN7cGFkZGluZy10b3A6NzUlfS5pbWFnZS5pcy0zYnkye3BhZGRpbmctdG9wOjY2LjY2NjYlfS5pbWFnZS5pcy0xNmJ5OXtwYWRkaW5nLXRvcDo1Ni4yNSV9LmltYWdlLmlzLTJieTF7cGFkZGluZy10b3A6NTAlfS5pbWFnZS5pcy0xNngxNntoZWlnaHQ6MTZweDt3aWR0aDoxNnB4fS5pbWFnZS5pcy0yNHgyNHtoZWlnaHQ6MjRweDt3aWR0aDoyNHB4fS5pbWFnZS5pcy0zMngzMntoZWlnaHQ6MzJweDt3aWR0aDozMnB4fS5pbWFnZS5pcy00OHg0OHtoZWlnaHQ6NDhweDt3aWR0aDo0OHB4fS5pbWFnZS5pcy02NHg2NHtoZWlnaHQ6NjRweDt3aWR0aDo2NHB4fS5pbWFnZS5pcy05Nng5NntoZWlnaHQ6OTZweDt3aWR0aDo5NnB4fS5pbWFnZS5pcy0xMjh4MTI4e2hlaWdodDoxMjhweDt3aWR0aDoxMjhweH0ubm90aWZpY2F0aW9ue2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItcmFkaXVzOjNweDtwYWRkaW5nOjEuMjVyZW0gMi41cmVtIDEuMjVyZW0gMS41cmVtO3Bvc2l0aW9uOnJlbGF0aXZlfS5ub3RpZmljYXRpb246bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0ubm90aWZpY2F0aW9uIGNvZGUsLm5vdGlmaWNhdGlvbiBwcmV7YmFja2dyb3VuZDojZmZmfS5ub3RpZmljYXRpb24gcHJlIGNvZGV7YmFja2dyb3VuZDp0cmFuc3BhcmVudH0ubm90aWZpY2F0aW9uIC5kZWxldGV7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MC41ZW07dG9wOjAuNWVtfS5ub3RpZmljYXRpb24gLnRpdGxlLC5ub3RpZmljYXRpb24gLnN1YnRpdGxlLC5ub3RpZmljYXRpb24gLmNvbnRlbnR7Y29sb3I6aW5oZXJpdH0ubm90aWZpY2F0aW9uLmlzLXdoaXRle2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5ub3RpZmljYXRpb24uaXMtYmxhY2t7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9Lm5vdGlmaWNhdGlvbi5pcy1saWdodHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0ubm90aWZpY2F0aW9uLmlzLWRhcmt7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9Lm5vdGlmaWNhdGlvbi5pcy1wcmltYXJ5e2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmfS5ub3RpZmljYXRpb24uaXMtaW5mb3tiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Y29sb3I6I2ZmZn0ubm90aWZpY2F0aW9uLmlzLXN1Y2Nlc3N7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwO2NvbG9yOiNmZmZ9Lm5vdGlmaWNhdGlvbi5pcy13YXJuaW5ne2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1Nztjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lm5vdGlmaWNhdGlvbi5pcy1kYW5nZXJ7YmFja2dyb3VuZC1jb2xvcjpyZWQ7Y29sb3I6I2ZmZn0ucHJvZ3Jlc3N7LW1vei1hcHBlYXJhbmNlOm5vbmU7LXdlYmtpdC1hcHBlYXJhbmNlOm5vbmU7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcmVtO292ZXJmbG93OmhpZGRlbjtwYWRkaW5nOjA7d2lkdGg6MTAwJX0ucHJvZ3Jlc3M6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0ucHJvZ3Jlc3M6Oi13ZWJraXQtcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6I2RiZGJkYn0ucHJvZ3Jlc3M6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojNGE0YTRhfS5wcm9ncmVzczo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojNGE0YTRhfS5wcm9ncmVzcy5pcy13aGl0ZTo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9LnByb2dyZXNzLmlzLXdoaXRlOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9LnByb2dyZXNzLmlzLWJsYWNrOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6IzBhMGEwYX0ucHJvZ3Jlc3MuaXMtYmxhY2s6Oi1tb3otcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6IzBhMGEwYX0ucHJvZ3Jlc3MuaXMtbGlnaHQ6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5wcm9ncmVzcy5pcy1saWdodDo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5wcm9ncmVzcy5pcy1kYXJrOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6IzM2MzYzNn0ucHJvZ3Jlc3MuaXMtZGFyazo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2fS5wcm9ncmVzcy5pcy1wcmltYXJ5Ojotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6IzE4MmI3M30ucHJvZ3Jlc3MuaXMtcHJpbWFyeTo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczfS5wcm9ncmVzcy5pcy1pbmZvOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6IzMyNzNkY30ucHJvZ3Jlc3MuaXMtaW5mbzo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjfS5wcm9ncmVzcy5pcy1zdWNjZXNzOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6IzIzZDE2MH0ucHJvZ3Jlc3MuaXMtc3VjY2Vzczo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwfS5wcm9ncmVzcy5pcy13YXJuaW5nOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1N30ucHJvZ3Jlc3MuaXMtd2FybmluZzo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3fS5wcm9ncmVzcy5pcy1kYW5nZXI6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjpyZWR9LnByb2dyZXNzLmlzLWRhbmdlcjo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjpyZWR9LnByb2dyZXNzLmlzLXNtYWxse2hlaWdodDouNzVyZW19LnByb2dyZXNzLmlzLW1lZGl1bXtoZWlnaHQ6MS4yNXJlbX0ucHJvZ3Jlc3MuaXMtbGFyZ2V7aGVpZ2h0OjEuNXJlbX0udGFibGV7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMzNjM2MzY7bWFyZ2luLWJvdHRvbToxLjVyZW07d2lkdGg6MTAwJX0udGFibGUgdGQsLnRhYmxlIHRoe2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtib3JkZXItd2lkdGg6MCAwIDFweDtwYWRkaW5nOjAuNWVtIDAuNzVlbTt2ZXJ0aWNhbC1hbGlnbjp0b3B9LnRhYmxlIHRkLmlzLW5hcnJvdywudGFibGUgdGguaXMtbmFycm93e3doaXRlLXNwYWNlOm5vd3JhcDt3aWR0aDoxJX0udGFibGUgdGh7Y29sb3I6IzM2MzYzNjt0ZXh0LWFsaWduOmxlZnR9LnRhYmxlIHRyOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZhZmFmYX0udGFibGUgdGhlYWQgdGQsLnRhYmxlIHRoZWFkIHRoe2JvcmRlci13aWR0aDowIDAgMnB4O2NvbG9yOiM3YTdhN2F9LnRhYmxlIHRmb290IHRkLC50YWJsZSB0Zm9vdCB0aHtib3JkZXItd2lkdGg6MnB4IDAgMDtjb2xvcjojN2E3YTdhfS50YWJsZSB0Ym9keSB0cjpsYXN0LWNoaWxkIHRkLC50YWJsZSB0Ym9keSB0cjpsYXN0LWNoaWxkIHRoe2JvcmRlci1ib3R0b20td2lkdGg6MH0udGFibGUuaXMtYm9yZGVyZWQgdGQsLnRhYmxlLmlzLWJvcmRlcmVkIHRoe2JvcmRlci13aWR0aDoxcHh9LnRhYmxlLmlzLWJvcmRlcmVkIHRyOmxhc3QtY2hpbGQgdGQsLnRhYmxlLmlzLWJvcmRlcmVkIHRyOmxhc3QtY2hpbGQgdGh7Ym9yZGVyLWJvdHRvbS13aWR0aDoxcHh9LnRhYmxlLmlzLW5hcnJvdyB0ZCwudGFibGUuaXMtbmFycm93IHRoe3BhZGRpbmc6MC4yNWVtIDAuNWVtfS50YWJsZS5pcy1zdHJpcGVkIHRib2R5IHRyOm50aC1jaGlsZChldmVuKXtiYWNrZ3JvdW5kLWNvbG9yOiNmYWZhZmF9LnRhYmxlLmlzLXN0cmlwZWQgdGJvZHkgdHI6bnRoLWNoaWxkKGV2ZW4pOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX0udGFne2FsaWduLWl0ZW1zOmNlbnRlcjtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtjb2xvcjojNGE0YTRhO2Rpc3BsYXk6aW5saW5lLWZsZXg7Zm9udC1zaXplOi43NXJlbTtoZWlnaHQ6MmVtO2p1c3RpZnktY29udGVudDpjZW50ZXI7bGluZS1oZWlnaHQ6MS41O3BhZGRpbmctbGVmdDowLjg3NWVtO3BhZGRpbmctcmlnaHQ6MC44NzVlbTt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2hpdGUtc3BhY2U6bm93cmFwfS50YWcgLmRlbGV0ZXttYXJnaW4tbGVmdDowLjI1ZW07bWFyZ2luLXJpZ2h0Oi0wLjVlbX0udGFnLmlzLXdoaXRle2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS50YWcuaXMtYmxhY2t7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9LnRhZy5pcy1saWdodHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0udGFnLmlzLWRhcmt7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9LnRhZy5pcy1wcmltYXJ5e2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmfS50YWcuaXMtaW5mb3tiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Y29sb3I6I2ZmZn0udGFnLmlzLXN1Y2Nlc3N7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwO2NvbG9yOiNmZmZ9LnRhZy5pcy13YXJuaW5ne2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1Nztjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9LnRhZy5pcy1kYW5nZXJ7YmFja2dyb3VuZC1jb2xvcjpyZWQ7Y29sb3I6I2ZmZn0udGFnLmlzLW1lZGl1bXtmb250LXNpemU6MXJlbX0udGFnLmlzLWxhcmdle2ZvbnQtc2l6ZToxLjI1cmVtfS50aXRsZSwuc3VidGl0bGV7d29yZC1icmVhazpicmVhay13b3JkfS50aXRsZTpub3QoOmxhc3QtY2hpbGQpLC5zdWJ0aXRsZTpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS50aXRsZSBlbSwudGl0bGUgc3Bhbiwuc3VidGl0bGUgZW0sLnN1YnRpdGxlIHNwYW57Zm9udC13ZWlnaHQ6MzAwfS50aXRsZSBzdHJvbmcsLnN1YnRpdGxlIHN0cm9uZ3tmb250LXdlaWdodDo1MDB9LnRpdGxlIC50YWcsLnN1YnRpdGxlIC50YWd7dmVydGljYWwtYWxpZ246bWlkZGxlfS50aXRsZXtjb2xvcjojMzYzNjM2O2ZvbnQtc2l6ZToycmVtO2ZvbnQtd2VpZ2h0OjMwMDtsaW5lLWhlaWdodDoxLjEyNX0udGl0bGUgc3Ryb25ne2NvbG9yOmluaGVyaXR9LnRpdGxlKy5oaWdobGlnaHR7bWFyZ2luLXRvcDotMC43NXJlbX0udGl0bGUrLnN1YnRpdGxle21hcmdpbi10b3A6LTEuMjVyZW19LnRpdGxlLmlzLTF7Zm9udC1zaXplOjMuNXJlbX0udGl0bGUuaXMtMntmb250LXNpemU6Mi43NXJlbX0udGl0bGUuaXMtM3tmb250LXNpemU6MnJlbX0udGl0bGUuaXMtNHtmb250LXNpemU6MS41cmVtfS50aXRsZS5pcy01e2ZvbnQtc2l6ZToxLjI1cmVtfS50aXRsZS5pcy02e2ZvbnQtc2l6ZToxNHB4fS5zdWJ0aXRsZXtjb2xvcjojNGE0YTRhO2ZvbnQtc2l6ZToxLjI1cmVtO2ZvbnQtd2VpZ2h0OjMwMDtsaW5lLWhlaWdodDoxLjI1fS5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6IzM2MzYzNn0uc3VidGl0bGUrLnRpdGxle21hcmdpbi10b3A6LTEuNXJlbX0uc3VidGl0bGUuaXMtMXtmb250LXNpemU6My41cmVtfS5zdWJ0aXRsZS5pcy0ye2ZvbnQtc2l6ZToyLjc1cmVtfS5zdWJ0aXRsZS5pcy0ze2ZvbnQtc2l6ZToycmVtfS5zdWJ0aXRsZS5pcy00e2ZvbnQtc2l6ZToxLjVyZW19LnN1YnRpdGxlLmlzLTV7Zm9udC1zaXplOjEuMjVyZW19LnN1YnRpdGxlLmlzLTZ7Zm9udC1zaXplOjE0cHh9LmJsb2NrOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LmNvbnRhaW5lcntwb3NpdGlvbjpyZWxhdGl2ZX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5jb250YWluZXJ7bWFyZ2luOjAgYXV0bzttYXgtd2lkdGg6OTYwcHh9LmNvbnRhaW5lci5pcy1mbHVpZHttYXJnaW46MCAyMHB4O21heC13aWR0aDpub25lfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMTkycHgpey5jb250YWluZXJ7bWF4LXdpZHRoOjExNTJweH19LmRlbGV0ZXstd2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lOy1tcy11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmU7LW1vei1hcHBlYXJhbmNlOm5vbmU7LXdlYmtpdC1hcHBlYXJhbmNlOm5vbmU7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMik7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MXJlbTtoZWlnaHQ6MjBweDtvdXRsaW5lOm5vbmU7cG9zaXRpb246cmVsYXRpdmU7dHJhbnNmb3JtOnJvdGF0ZSg0NWRlZyk7dHJhbnNmb3JtLW9yaWdpbjpjZW50ZXIgY2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcDt3aWR0aDoyMHB4fS5kZWxldGU6YmVmb3JlLC5kZWxldGU6YWZ0ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbnRlbnQ6XFxcIlxcXCI7ZGlzcGxheTpibG9jaztsZWZ0OjUwJTtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSl9LmRlbGV0ZTpiZWZvcmV7aGVpZ2h0OjJweDt3aWR0aDo1MCV9LmRlbGV0ZTphZnRlcntoZWlnaHQ6NTAlO3dpZHRoOjJweH0uZGVsZXRlOmhvdmVyLC5kZWxldGU6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMyl9LmRlbGV0ZTphY3RpdmV7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuNCl9LmRlbGV0ZS5pcy1zbWFsbHtoZWlnaHQ6MTRweDt3aWR0aDoxNHB4fS5kZWxldGUuaXMtbWVkaXVte2hlaWdodDoyNnB4O3dpZHRoOjI2cHh9LmRlbGV0ZS5pcy1sYXJnZXtoZWlnaHQ6MzBweDt3aWR0aDozMHB4fS5mYXtmb250LXNpemU6MjFweDt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3B9LmhlYWRpbmd7ZGlzcGxheTpibG9jaztmb250LXNpemU6MTFweDtsZXR0ZXItc3BhY2luZzoxcHg7bWFyZ2luLWJvdHRvbTo1cHg7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlfS5oaWdobGlnaHR7Zm9udC13ZWlnaHQ6NDAwO21heC13aWR0aDoxMDAlO292ZXJmbG93OmhpZGRlbjtwYWRkaW5nOjB9LmhpZ2hsaWdodDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5oaWdobGlnaHQgcHJle292ZXJmbG93OmF1dG87bWF4LXdpZHRoOjEwMCV9LmxvYWRlcnthbmltYXRpb246c3BpbkFyb3VuZCA1MDBtcyBpbmZpbml0ZSBsaW5lYXI7Ym9yZGVyOjJweCBzb2xpZCAjZGJkYmRiO2JvcmRlci1yYWRpdXM6MjkwNDg2cHg7Ym9yZGVyLXJpZ2h0LWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci10b3AtY29sb3I6dHJhbnNwYXJlbnQ7Y29udGVudDpcXFwiXFxcIjtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcmVtO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjFyZW19Lm51bWJlcnthbGlnbi1pdGVtczpjZW50ZXI7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1yYWRpdXM6MjkwNDg2cHg7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MS4yNXJlbTtoZWlnaHQ6MmVtO2p1c3RpZnktY29udGVudDpjZW50ZXI7bWFyZ2luLXJpZ2h0OjEuNXJlbTttaW4td2lkdGg6Mi41ZW07cGFkZGluZzowLjI1cmVtIDAuNXJlbTt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3B9LmNhcmQtaGVhZGVye2FsaWduLWl0ZW1zOnN0cmV0Y2g7Ym94LXNoYWRvdzowIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjEpO2Rpc3BsYXk6ZmxleH0uY2FyZC1oZWFkZXItdGl0bGV7YWxpZ24taXRlbXM6Y2VudGVyO2NvbG9yOiMzNjM2MzY7ZGlzcGxheTpmbGV4O2ZsZXgtZ3JvdzoxO2ZvbnQtd2VpZ2h0OjcwMDtwYWRkaW5nOjAuNzVyZW19LmNhcmQtaGVhZGVyLWljb257YWxpZ24taXRlbXM6Y2VudGVyO2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmc6MC43NXJlbX0uY2FyZC1pbWFnZXtkaXNwbGF5OmJsb2NrO3Bvc2l0aW9uOnJlbGF0aXZlfS5jYXJkLWNvbnRlbnR7cGFkZGluZzoxLjVyZW19LmNhcmQtY29udGVudCAudGl0bGUrLnN1YnRpdGxle21hcmdpbi10b3A6LTEuNXJlbX0uY2FyZC1mb290ZXJ7Ym9yZGVyLXRvcDoxcHggc29saWQgI2RiZGJkYjthbGlnbi1pdGVtczpzdHJldGNoO2Rpc3BsYXk6ZmxleH0uY2FyZC1mb290ZXItaXRlbXthbGlnbi1pdGVtczpjZW50ZXI7ZGlzcGxheTpmbGV4O2ZsZXgtYmFzaXM6MDtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowO2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZzowLjc1cmVtfS5jYXJkLWZvb3Rlci1pdGVtOm5vdCg6bGFzdC1jaGlsZCl7Ym9yZGVyLXJpZ2h0OjFweCBzb2xpZCAjZGJkYmRifS5jYXJke2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3gtc2hhZG93OjAgMnB4IDNweCByZ2JhKDEwLDEwLDEwLDAuMSksMCAwIDAgMXB4IHJnYmEoMTAsMTAsMTAsMC4xKTtjb2xvcjojNGE0YTRhO21heC13aWR0aDoxMDAlO3Bvc2l0aW9uOnJlbGF0aXZlfS5jYXJkIC5tZWRpYTpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX0ubGV2ZWwtaXRlbXthbGlnbi1pdGVtczpjZW50ZXI7ZGlzcGxheTpmbGV4O2ZsZXgtYmFzaXM6YXV0bztmbGV4LWdyb3c6MDtmbGV4LXNocmluazowO2p1c3RpZnktY29udGVudDpjZW50ZXJ9LmxldmVsLWl0ZW0gLnRpdGxlLC5sZXZlbC1pdGVtIC5zdWJ0aXRsZXttYXJnaW4tYm90dG9tOjB9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5sZXZlbC1pdGVtOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfX0ubGV2ZWwtbGVmdCwubGV2ZWwtcmlnaHR7ZmxleC1iYXNpczphdXRvO2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjB9LmxldmVsLWxlZnQgLmxldmVsLWl0ZW06bm90KDpsYXN0LWNoaWxkKSwubGV2ZWwtcmlnaHQgLmxldmVsLWl0ZW06bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6MC43NXJlbX0ubGV2ZWwtbGVmdCAubGV2ZWwtaXRlbS5pcy1mbGV4aWJsZSwubGV2ZWwtcmlnaHQgLmxldmVsLWl0ZW0uaXMtZmxleGlibGV7ZmxleC1ncm93OjF9LmxldmVsLWxlZnR7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsubGV2ZWwtbGVmdCsubGV2ZWwtcmlnaHR7bWFyZ2luLXRvcDoxLjVyZW19fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsubGV2ZWwtbGVmdHtkaXNwbGF5OmZsZXh9fS5sZXZlbC1yaWdodHthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsubGV2ZWwtcmlnaHR7ZGlzcGxheTpmbGV4fX0ubGV2ZWx7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVufS5sZXZlbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5sZXZlbCBjb2Rle2JvcmRlci1yYWRpdXM6M3B4fS5sZXZlbCBpbWd7ZGlzcGxheTppbmxpbmUtYmxvY2s7dmVydGljYWwtYWxpZ246dG9wfS5sZXZlbC5pcy1tb2JpbGV7ZGlzcGxheTpmbGV4fS5sZXZlbC5pcy1tb2JpbGU+LmxldmVsLWl0ZW06bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjB9LmxldmVsLmlzLW1vYmlsZT4ubGV2ZWwtaXRlbTpub3QoLmlzLW5hcnJvdyl7ZmxleC1ncm93OjF9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5sZXZlbHtkaXNwbGF5OmZsZXh9LmxldmVsPi5sZXZlbC1pdGVtOm5vdCguaXMtbmFycm93KXtmbGV4LWdyb3c6MX19Lm1lZGlhLWxlZnQsLm1lZGlhLXJpZ2h0e2ZsZXgtYmFzaXM6YXV0bztmbGV4LWdyb3c6MDtmbGV4LXNocmluazowfS5tZWRpYS1sZWZ0e21hcmdpbi1yaWdodDoxcmVtfS5tZWRpYS1yaWdodHttYXJnaW4tbGVmdDoxcmVtfS5tZWRpYS1jb250ZW50e2ZsZXgtYmFzaXM6YXV0bztmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO3RleHQtYWxpZ246bGVmdH0ubWVkaWF7YWxpZ24taXRlbXM6ZmxleC1zdGFydDtkaXNwbGF5OmZsZXg7dGV4dC1hbGlnbjpsZWZ0fS5tZWRpYSAuY29udGVudDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX0ubWVkaWEgLm1lZGlhe2JvcmRlci10b3A6MXB4IHNvbGlkIHJnYmEoMjE5LDIxOSwyMTksMC41KTtkaXNwbGF5OmZsZXg7cGFkZGluZy10b3A6MC43NXJlbX0ubWVkaWEgLm1lZGlhIC5jb250ZW50Om5vdCg6bGFzdC1jaGlsZCksLm1lZGlhIC5tZWRpYSAuY29udHJvbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC41cmVtfS5tZWRpYSAubWVkaWEgLm1lZGlhe3BhZGRpbmctdG9wOjAuNXJlbX0ubWVkaWEgLm1lZGlhIC5tZWRpYSsubWVkaWF7bWFyZ2luLXRvcDowLjVyZW19Lm1lZGlhKy5tZWRpYXtib3JkZXItdG9wOjFweCBzb2xpZCByZ2JhKDIxOSwyMTksMjE5LDAuNSk7bWFyZ2luLXRvcDoxcmVtO3BhZGRpbmctdG9wOjFyZW19Lm1lZGlhLmlzLWxhcmdlKy5tZWRpYXttYXJnaW4tdG9wOjEuNXJlbTtwYWRkaW5nLXRvcDoxLjVyZW19Lm1lbnV7Zm9udC1zaXplOjFyZW19Lm1lbnUtbGlzdHtsaW5lLWhlaWdodDoxLjI1fS5tZW51LWxpc3QgYXtib3JkZXItcmFkaXVzOjJweDtjb2xvcjojNGE0YTRhO2Rpc3BsYXk6YmxvY2s7cGFkZGluZzowLjVlbSAwLjc1ZW19Lm1lbnUtbGlzdCBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMTgyYjczfS5tZW51LWxpc3QgYS5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9Lm1lbnUtbGlzdCBsaSB1bHtib3JkZXItbGVmdDoxcHggc29saWQgI2RiZGJkYjttYXJnaW46MC43NWVtO3BhZGRpbmctbGVmdDowLjc1ZW19Lm1lbnUtbGFiZWx7Y29sb3I6IzdhN2E3YTtmb250LXNpemU6MC44ZW07bGV0dGVyLXNwYWNpbmc6MC4xZW07dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlfS5tZW51LWxhYmVsOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi10b3A6MWVtfS5tZW51LWxhYmVsOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxZW19Lm1lc3NhZ2V7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1yYWRpdXM6M3B4O2ZvbnQtc2l6ZToxcmVtfS5tZXNzYWdlOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19Lm1lc3NhZ2UuaXMtd2hpdGV7YmFja2dyb3VuZC1jb2xvcjojZmZmfS5tZXNzYWdlLmlzLXdoaXRlIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0ubWVzc2FnZS5pcy13aGl0ZSAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiM0ZDRkNGR9Lm1lc3NhZ2UuaXMtYmxhY2t7YmFja2dyb3VuZC1jb2xvcjojZmFmYWZhfS5tZXNzYWdlLmlzLWJsYWNrIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0ubWVzc2FnZS5pcy1ibGFjayAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojMGEwYTBhO2NvbG9yOiMwOTA5MDl9Lm1lc3NhZ2UuaXMtbGlnaHR7YmFja2dyb3VuZC1jb2xvcjojZmFmYWZhfS5tZXNzYWdlLmlzLWxpZ2h0IC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0ubWVzc2FnZS5pcy1saWdodCAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojZjVmNWY1O2NvbG9yOiM1MDUwNTB9Lm1lc3NhZ2UuaXMtZGFya3tiYWNrZ3JvdW5kLWNvbG9yOiNmYWZhZmF9Lm1lc3NhZ2UuaXMtZGFyayAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9Lm1lc3NhZ2UuaXMtZGFyayAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojMzYzNjM2O2NvbG9yOiMyYTJhMmF9Lm1lc3NhZ2UuaXMtcHJpbWFyeXtiYWNrZ3JvdW5kLWNvbG9yOiNmN2Y4ZmR9Lm1lc3NhZ2UuaXMtcHJpbWFyeSAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9Lm1lc3NhZ2UuaXMtcHJpbWFyeSAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojMTgyYjczO2NvbG9yOiMxNjI2NjJ9Lm1lc3NhZ2UuaXMtaW5mb3tiYWNrZ3JvdW5kLWNvbG9yOiNmNmY5ZmV9Lm1lc3NhZ2UuaXMtaW5mbyAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjO2NvbG9yOiNmZmZ9Lm1lc3NhZ2UuaXMtaW5mbyAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojMzI3M2RjO2NvbG9yOiMyMjUwOWF9Lm1lc3NhZ2UuaXMtc3VjY2Vzc3tiYWNrZ3JvdW5kLWNvbG9yOiNmNmZlZjl9Lm1lc3NhZ2UuaXMtc3VjY2VzcyAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwO2NvbG9yOiNmZmZ9Lm1lc3NhZ2UuaXMtc3VjY2VzcyAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjojMjNkMTYwO2NvbG9yOiMwZTMwMWF9Lm1lc3NhZ2UuaXMtd2FybmluZ3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmZkZjV9Lm1lc3NhZ2UuaXMtd2FybmluZyAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0ubWVzc2FnZS5pcy13YXJuaW5nIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiNmZmRkNTc7Y29sb3I6IzNiMzEwOH0ubWVzc2FnZS5pcy1kYW5nZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmNWY1fS5tZXNzYWdlLmlzLWRhbmdlciAubWVzc2FnZS1oZWFkZXJ7YmFja2dyb3VuZC1jb2xvcjpyZWQ7Y29sb3I6I2ZmZn0ubWVzc2FnZS5pcy1kYW5nZXIgLm1lc3NhZ2UtYm9keXtib3JkZXItY29sb3I6cmVkO2NvbG9yOiNhZDA2MDZ9Lm1lc3NhZ2UtaGVhZGVye2FsaWduLWl0ZW1zOmNlbnRlcjtiYWNrZ3JvdW5kLWNvbG9yOiM0YTRhNGE7Ym9yZGVyLXJhZGl1czozcHggM3B4IDAgMDtjb2xvcjojZmZmO2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjtsaW5lLWhlaWdodDoxLjI1O3BhZGRpbmc6MC41ZW0gMC43NWVtO3Bvc2l0aW9uOnJlbGF0aXZlfS5tZXNzYWdlLWhlYWRlciBhLC5tZXNzYWdlLWhlYWRlciBzdHJvbmd7Y29sb3I6aW5oZXJpdH0ubWVzc2FnZS1oZWFkZXIgYXt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lfS5tZXNzYWdlLWhlYWRlciAuZGVsZXRle2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjA7bWFyZ2luLWxlZnQ6MC43NWVtfS5tZXNzYWdlLWhlYWRlcisubWVzc2FnZS1ib2R5e2JvcmRlci10b3AtbGVmdC1yYWRpdXM6MDtib3JkZXItdG9wLXJpZ2h0LXJhZGl1czowO2JvcmRlci10b3A6bm9uZX0ubWVzc2FnZS1ib2R5e2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtib3JkZXItcmFkaXVzOjNweDtjb2xvcjojNGE0YTRhO3BhZGRpbmc6MWVtIDEuMjVlbX0ubWVzc2FnZS1ib2R5IGEsLm1lc3NhZ2UtYm9keSBzdHJvbmd7Y29sb3I6aW5oZXJpdH0ubWVzc2FnZS1ib2R5IGF7dGV4dC1kZWNvcmF0aW9uOnVuZGVybGluZX0ubWVzc2FnZS1ib2R5IGNvZGUsLm1lc3NhZ2UtYm9keSBwcmV7YmFja2dyb3VuZDojZmZmfS5tZXNzYWdlLWJvZHkgcHJlIGNvZGV7YmFja2dyb3VuZDp0cmFuc3BhcmVudH0ubW9kYWwtYmFja2dyb3VuZHtib3R0b206MDtsZWZ0OjA7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDt0b3A6MDtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC44Nil9Lm1vZGFsLWNvbnRlbnQsLm1vZGFsLWNhcmR7bWFyZ2luOjAgMjBweDttYXgtaGVpZ2h0OmNhbGMoMTAwdmggLSAxNjBweCk7b3ZlcmZsb3c6YXV0bztwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoxMDAlfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsubW9kYWwtY29udGVudCwubW9kYWwtY2FyZHttYXJnaW46MCBhdXRvO21heC1oZWlnaHQ6Y2FsYygxMDB2aCAtIDQwcHgpO3dpZHRoOjY0MHB4fX0ubW9kYWwtY2xvc2V7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lOy1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjIpO2JvcmRlcjpub25lO2JvcmRlci1yYWRpdXM6MjkwNDg2cHg7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTppbmxpbmUtYmxvY2s7Zm9udC1zaXplOjFyZW07aGVpZ2h0OjIwcHg7b3V0bGluZTpub25lO3Bvc2l0aW9uOnJlbGF0aXZlO3RyYW5zZm9ybTpyb3RhdGUoNDVkZWcpO3RyYW5zZm9ybS1vcmlnaW46Y2VudGVyIGNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6MjBweDtiYWNrZ3JvdW5kOm5vbmU7aGVpZ2h0OjQwcHg7cG9zaXRpb246Zml4ZWQ7cmlnaHQ6MjBweDt0b3A6MjBweDt3aWR0aDo0MHB4fS5tb2RhbC1jbG9zZTpiZWZvcmUsLm1vZGFsLWNsb3NlOmFmdGVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb250ZW50OlxcXCJcXFwiO2Rpc3BsYXk6YmxvY2s7bGVmdDo1MCU7cG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTt0cmFuc2Zvcm06dHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpfS5tb2RhbC1jbG9zZTpiZWZvcmV7aGVpZ2h0OjJweDt3aWR0aDo1MCV9Lm1vZGFsLWNsb3NlOmFmdGVye2hlaWdodDo1MCU7d2lkdGg6MnB4fS5tb2RhbC1jbG9zZTpob3ZlciwubW9kYWwtY2xvc2U6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMyl9Lm1vZGFsLWNsb3NlOmFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC40KX0ubW9kYWwtY2xvc2UuaXMtc21hbGx7aGVpZ2h0OjE0cHg7d2lkdGg6MTRweH0ubW9kYWwtY2xvc2UuaXMtbWVkaXVte2hlaWdodDoyNnB4O3dpZHRoOjI2cHh9Lm1vZGFsLWNsb3NlLmlzLWxhcmdle2hlaWdodDozMHB4O3dpZHRoOjMwcHh9Lm1vZGFsLWNhcmR7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjttYXgtaGVpZ2h0OmNhbGMoMTAwdmggLSA0MHB4KTtvdmVyZmxvdzpoaWRkZW59Lm1vZGFsLWNhcmQtaGVhZCwubW9kYWwtY2FyZC1mb290e2FsaWduLWl0ZW1zOmNlbnRlcjtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7ZGlzcGxheTpmbGV4O2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7cGFkZGluZzoyMHB4O3Bvc2l0aW9uOnJlbGF0aXZlfS5tb2RhbC1jYXJkLWhlYWR7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2RiZGJkYjtib3JkZXItdG9wLWxlZnQtcmFkaXVzOjVweDtib3JkZXItdG9wLXJpZ2h0LXJhZGl1czo1cHh9Lm1vZGFsLWNhcmQtdGl0bGV7Y29sb3I6IzM2MzYzNjtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowO2ZvbnQtc2l6ZToxLjVyZW07bGluZS1oZWlnaHQ6MX0ubW9kYWwtY2FyZC1mb290e2JvcmRlci1ib3R0b20tbGVmdC1yYWRpdXM6NXB4O2JvcmRlci1ib3R0b20tcmlnaHQtcmFkaXVzOjVweDtib3JkZXItdG9wOjFweCBzb2xpZCAjZGJkYmRifS5tb2RhbC1jYXJkLWZvb3QgLmJ1dHRvbjpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1yaWdodDoxMHB4fS5tb2RhbC1jYXJkLWJvZHl7LXdlYmtpdC1vdmVyZmxvdy1zY3JvbGxpbmc6dG91Y2g7YmFja2dyb3VuZC1jb2xvcjojZmZmO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7b3ZlcmZsb3c6YXV0bztwYWRkaW5nOjIwcHh9Lm1vZGFse2JvdHRvbTowO2xlZnQ6MDtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO3RvcDowO2FsaWduLWl0ZW1zOmNlbnRlcjtkaXNwbGF5Om5vbmU7anVzdGlmeS1jb250ZW50OmNlbnRlcjtvdmVyZmxvdzpoaWRkZW47cG9zaXRpb246Zml4ZWQ7ei1pbmRleDoxOTg2fS5tb2RhbC5pcy1hY3RpdmV7ZGlzcGxheTpmbGV4fS5uYXYtdG9nZ2xle2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjMuNXJlbTtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDozLjVyZW19Lm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiM0YTRhNGE7ZGlzcGxheTpibG9jaztoZWlnaHQ6MXB4O2xlZnQ6NTAlO21hcmdpbi1sZWZ0Oi03cHg7cG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTt0cmFuc2l0aW9uOm5vbmUgODZtcyBlYXNlLW91dDt0cmFuc2l0aW9uLXByb3BlcnR5OmJhY2tncm91bmQsIGxlZnQsIG9wYWNpdHksIHRyYW5zZm9ybTt3aWR0aDoxNXB4fS5uYXYtdG9nZ2xlIHNwYW46bnRoLWNoaWxkKDEpe21hcmdpbi10b3A6LTZweH0ubmF2LXRvZ2dsZSBzcGFuOm50aC1jaGlsZCgyKXttYXJnaW4tdG9wOi0xcHh9Lm5hdi10b2dnbGUgc3BhbjpudGgtY2hpbGQoMyl7bWFyZ2luLXRvcDo0cHh9Lm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzE4MmI3M30ubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbjpudGgtY2hpbGQoMSl7bWFyZ2luLWxlZnQ6LTVweDt0cmFuc2Zvcm06cm90YXRlKDQ1ZGVnKTt0cmFuc2Zvcm0tb3JpZ2luOmxlZnQgdG9wfS5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFuOm50aC1jaGlsZCgyKXtvcGFjaXR5OjB9Lm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW46bnRoLWNoaWxkKDMpe21hcmdpbi1sZWZ0Oi01cHg7dHJhbnNmb3JtOnJvdGF0ZSgtNDVkZWcpO3RyYW5zZm9ybS1vcmlnaW46bGVmdCBib3R0b219QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5uYXYtdG9nZ2xle2Rpc3BsYXk6bm9uZX19Lm5hdi1pdGVte2FsaWduLWl0ZW1zOmNlbnRlcjtkaXNwbGF5OmZsZXg7ZmxleC1ncm93OjA7ZmxleC1zaHJpbms6MDtmb250LXNpemU6MXJlbTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmc6MC41cmVtIDAuNzVyZW19Lm5hdi1pdGVtIGF7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0ubmF2LWl0ZW0gaW1ne21heC1oZWlnaHQ6MS43NXJlbX0ubmF2LWl0ZW0gLmJ1dHRvbisuYnV0dG9ue21hcmdpbi1sZWZ0OjAuNzVyZW19Lm5hdi1pdGVtIC50YWc6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6MC41cmVtfS5uYXYtaXRlbSAudGFnOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6MC41cmVtfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsubmF2LWl0ZW17anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9fS5uYXYtaXRlbSBhLGEubmF2LWl0ZW17Y29sb3I6IzdhN2E3YX0ubmF2LWl0ZW0gYTpob3ZlcixhLm5hdi1pdGVtOmhvdmVye2NvbG9yOiMzNjM2MzZ9Lm5hdi1pdGVtIGEuaXMtYWN0aXZlLGEubmF2LWl0ZW0uaXMtYWN0aXZle2NvbG9yOiMzNjM2MzZ9Lm5hdi1pdGVtIGEuaXMtdGFiLGEubmF2LWl0ZW0uaXMtdGFie2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHRyYW5zcGFyZW50O2JvcmRlci10b3A6MXB4IHNvbGlkIHRyYW5zcGFyZW50O3BhZGRpbmctYm90dG9tOmNhbGMoMC41cmVtIC0gMXB4KTtwYWRkaW5nLWxlZnQ6MXJlbTtwYWRkaW5nLXJpZ2h0OjFyZW07cGFkZGluZy10b3A6Y2FsYygwLjVyZW0gLSAxcHgpfS5uYXYtaXRlbSBhLmlzLXRhYjpob3ZlcixhLm5hdi1pdGVtLmlzLXRhYjpob3Zlcntib3JkZXItYm90dG9tLWNvbG9yOiMxODJiNzM7Ym9yZGVyLXRvcC1jb2xvcjp0cmFuc3BhcmVudH0ubmF2LWl0ZW0gYS5pcy10YWIuaXMtYWN0aXZlLGEubmF2LWl0ZW0uaXMtdGFiLmlzLWFjdGl2ZXtib3JkZXItYm90dG9tOjNweCBzb2xpZCAjMTgyYjczO2NvbG9yOiMxODJiNzM7cGFkZGluZy1ib3R0b206Y2FsYygwLjVyZW0gLSAzcHgpfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7Lm5hdi1pdGVtIGEuaXMtYnJhbmQsYS5uYXYtaXRlbS5pcy1icmFuZHtwYWRkaW5nLWxlZnQ6MH19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym94LXNoYWRvdzowIDRweCA3cHggcmdiYSgxMCwxMCwxMCwwLjEpO2xlZnQ6MDtkaXNwbGF5Om5vbmU7cmlnaHQ6MDt0b3A6MTAwJTtwb3NpdGlvbjphYnNvbHV0ZX0ubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3A6MXB4IHNvbGlkIHJnYmEoMjE5LDIxOSwyMTksMC41KTtwYWRkaW5nOjAuNzVyZW19Lm5hdi1tZW51LmlzLWFjdGl2ZXtkaXNwbGF5OmJsb2NrfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsubmF2LW1lbnV7cGFkZGluZy1yaWdodDoxLjVyZW19fS5uYXYtbGVmdCwubmF2LXJpZ2h0e2FsaWduLWl0ZW1zOnN0cmV0Y2g7ZmxleC1iYXNpczowO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjB9Lm5hdi1sZWZ0e2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtvdmVyZmxvdzpoaWRkZW47b3ZlcmZsb3cteDphdXRvO3doaXRlLXNwYWNlOm5vd3JhcH0ubmF2LWNlbnRlcnthbGlnbi1pdGVtczpzdHJldGNoO2Rpc3BsYXk6ZmxleDtmbGV4LWdyb3c6MDtmbGV4LXNocmluazowO2p1c3RpZnktY29udGVudDpjZW50ZXI7bWFyZ2luLWxlZnQ6YXV0bzttYXJnaW4tcmlnaHQ6YXV0b30ubmF2LXJpZ2h0e2p1c3RpZnktY29udGVudDpmbGV4LWVuZH1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7Lm5hdi1yaWdodHtkaXNwbGF5OmZsZXh9fS5uYXZ7YWxpZ24taXRlbXM6c3RyZXRjaDtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7ZGlzcGxheTpmbGV4O21pbi1oZWlnaHQ6My41cmVtO3Bvc2l0aW9uOnJlbGF0aXZlO3RleHQtYWxpZ246Y2VudGVyO3otaW5kZXg6Mn0ubmF2Pi5jb250YWluZXJ7YWxpZ24taXRlbXM6c3RyZXRjaDtkaXNwbGF5OmZsZXg7bWluLWhlaWdodDozLjVyZW07d2lkdGg6MTAwJX0ubmF2Lmhhcy1zaGFkb3d7Ym94LXNoYWRvdzowIDJweCAzcHggcmdiYSgxMCwxMCwxMCwwLjEpfS5wYWdpbmF0aW9uLC5wYWdpbmF0aW9uLWxpc3R7YWxpZ24taXRlbXM6Y2VudGVyO2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3RleHQtYWxpZ246Y2VudGVyfS5wYWdpbmF0aW9uLXByZXZpb3VzLC5wYWdpbmF0aW9uLW5leHQsLnBhZ2luYXRpb24tbGluaywucGFnaW5hdGlvbi1lbGxpcHNpc3stbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTthbGlnbi1pdGVtczpjZW50ZXI7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czozcHg7Ym94LXNoYWRvdzpub25lO2Rpc3BsYXk6aW5saW5lLWZsZXg7Zm9udC1zaXplOjFyZW07aGVpZ2h0OjIuMjg1ZW07anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnQ7bGluZS1oZWlnaHQ6MS41O3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW07cG9zaXRpb246cmVsYXRpdmU7dmVydGljYWwtYWxpZ246dG9wOy13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZTtmb250LXNpemU6MC44NzVyZW07cGFkZGluZy1sZWZ0OjAuNWVtO3BhZGRpbmctcmlnaHQ6MC41ZW07anVzdGlmeS1jb250ZW50OmNlbnRlcjt0ZXh0LWFsaWduOmNlbnRlcn0ucGFnaW5hdGlvbi1wcmV2aW91czpmb2N1cywucGFnaW5hdGlvbi1wcmV2aW91cy5pcy1mb2N1c2VkLC5wYWdpbmF0aW9uLXByZXZpb3VzOmFjdGl2ZSwucGFnaW5hdGlvbi1wcmV2aW91cy5pcy1hY3RpdmUsLnBhZ2luYXRpb24tbmV4dDpmb2N1cywucGFnaW5hdGlvbi1uZXh0LmlzLWZvY3VzZWQsLnBhZ2luYXRpb24tbmV4dDphY3RpdmUsLnBhZ2luYXRpb24tbmV4dC5pcy1hY3RpdmUsLnBhZ2luYXRpb24tbGluazpmb2N1cywucGFnaW5hdGlvbi1saW5rLmlzLWZvY3VzZWQsLnBhZ2luYXRpb24tbGluazphY3RpdmUsLnBhZ2luYXRpb24tbGluay5pcy1hY3RpdmUsLnBhZ2luYXRpb24tZWxsaXBzaXM6Zm9jdXMsLnBhZ2luYXRpb24tZWxsaXBzaXMuaXMtZm9jdXNlZCwucGFnaW5hdGlvbi1lbGxpcHNpczphY3RpdmUsLnBhZ2luYXRpb24tZWxsaXBzaXMuaXMtYWN0aXZle291dGxpbmU6bm9uZX0ucGFnaW5hdGlvbi1wcmV2aW91c1tkaXNhYmxlZF0sLnBhZ2luYXRpb24tcHJldmlvdXMuaXMtZGlzYWJsZWQsLnBhZ2luYXRpb24tbmV4dFtkaXNhYmxlZF0sLnBhZ2luYXRpb24tbmV4dC5pcy1kaXNhYmxlZCwucGFnaW5hdGlvbi1saW5rW2Rpc2FibGVkXSwucGFnaW5hdGlvbi1saW5rLmlzLWRpc2FibGVkLC5wYWdpbmF0aW9uLWVsbGlwc2lzW2Rpc2FibGVkXSwucGFnaW5hdGlvbi1lbGxpcHNpcy5pcy1kaXNhYmxlZHtwb2ludGVyLWV2ZW50czpub25lfS5wYWdpbmF0aW9uLXByZXZpb3VzLC5wYWdpbmF0aW9uLW5leHQsLnBhZ2luYXRpb24tbGlua3tib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7bWluLXdpZHRoOjIuNWVtfS5wYWdpbmF0aW9uLXByZXZpb3VzOmhvdmVyLC5wYWdpbmF0aW9uLW5leHQ6aG92ZXIsLnBhZ2luYXRpb24tbGluazpob3Zlcntib3JkZXItY29sb3I6I2I1YjViNTtjb2xvcjojMzYzNjM2fS5wYWdpbmF0aW9uLXByZXZpb3VzOmZvY3VzLC5wYWdpbmF0aW9uLW5leHQ6Zm9jdXMsLnBhZ2luYXRpb24tbGluazpmb2N1c3tib3JkZXItY29sb3I6IzE4MmI3M30ucGFnaW5hdGlvbi1wcmV2aW91czphY3RpdmUsLnBhZ2luYXRpb24tbmV4dDphY3RpdmUsLnBhZ2luYXRpb24tbGluazphY3RpdmV7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpfS5wYWdpbmF0aW9uLXByZXZpb3VzW2Rpc2FibGVkXSwucGFnaW5hdGlvbi1wcmV2aW91cy5pcy1kaXNhYmxlZCwucGFnaW5hdGlvbi1uZXh0W2Rpc2FibGVkXSwucGFnaW5hdGlvbi1uZXh0LmlzLWRpc2FibGVkLC5wYWdpbmF0aW9uLWxpbmtbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLWxpbmsuaXMtZGlzYWJsZWR7YmFja2dyb3VuZDojZGJkYmRiO2NvbG9yOiM3YTdhN2E7b3BhY2l0eTowLjU7cG9pbnRlci1ldmVudHM6bm9uZX0ucGFnaW5hdGlvbi1wcmV2aW91cywucGFnaW5hdGlvbi1uZXh0e3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW19LnBhZ2luYXRpb24tbGluay5pcy1jdXJyZW50e2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztib3JkZXItY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmfS5wYWdpbmF0aW9uLWVsbGlwc2lze2NvbG9yOiNiNWI1YjU7cG9pbnRlci1ldmVudHM6bm9uZX0ucGFnaW5hdGlvbi1saXN0IGxpOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1sZWZ0OjAuMzc1cmVtfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsucGFnaW5hdGlvbntmbGV4LXdyYXA6d3JhcH0ucGFnaW5hdGlvbi1wcmV2aW91cywucGFnaW5hdGlvbi1uZXh0e2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7d2lkdGg6Y2FsYyg1MCUgLSAwLjM3NXJlbSl9LnBhZ2luYXRpb24tbmV4dHttYXJnaW4tbGVmdDowLjc1cmVtfS5wYWdpbmF0aW9uLWxpc3R7bWFyZ2luLXRvcDowLjc1cmVtfS5wYWdpbmF0aW9uLWxpc3QgbGl7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5wYWdpbmF0aW9uLWxpc3R7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtvcmRlcjoxfS5wYWdpbmF0aW9uLXByZXZpb3VzLC5wYWdpbmF0aW9uLW5leHR7bWFyZ2luLWxlZnQ6MC43NXJlbX0ucGFnaW5hdGlvbi1wcmV2aW91c3tvcmRlcjoyfS5wYWdpbmF0aW9uLW5leHR7b3JkZXI6M30ucGFnaW5hdGlvbntqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbn0ucGFnaW5hdGlvbi5pcy1jZW50ZXJlZCAucGFnaW5hdGlvbi1wcmV2aW91c3ttYXJnaW4tbGVmdDowO29yZGVyOjF9LnBhZ2luYXRpb24uaXMtY2VudGVyZWQgLnBhZ2luYXRpb24tbGlzdHtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO29yZGVyOjJ9LnBhZ2luYXRpb24uaXMtY2VudGVyZWQgLnBhZ2luYXRpb24tbmV4dHtvcmRlcjozfS5wYWdpbmF0aW9uLmlzLXJpZ2h0IC5wYWdpbmF0aW9uLXByZXZpb3Vze21hcmdpbi1sZWZ0OjA7b3JkZXI6MX0ucGFnaW5hdGlvbi5pcy1yaWdodCAucGFnaW5hdGlvbi1uZXh0e29yZGVyOjI7bWFyZ2luLXJpZ2h0OjAuNzVyZW19LnBhZ2luYXRpb24uaXMtcmlnaHQgLnBhZ2luYXRpb24tbGlzdHtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmQ7b3JkZXI6M319LnBhbmVse2ZvbnQtc2l6ZToxcmVtfS5wYW5lbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5wYW5lbC1oZWFkaW5nLC5wYW5lbC10YWJzLC5wYW5lbC1ibG9ja3tib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci1sZWZ0OjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci1yaWdodDoxcHggc29saWQgI2RiZGJkYn0ucGFuZWwtaGVhZGluZzpmaXJzdC1jaGlsZCwucGFuZWwtdGFiczpmaXJzdC1jaGlsZCwucGFuZWwtYmxvY2s6Zmlyc3QtY2hpbGR7Ym9yZGVyLXRvcDoxcHggc29saWQgI2RiZGJkYn0ucGFuZWwtaGVhZGluZ3tiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLXJhZGl1czozcHggM3B4IDAgMDtjb2xvcjojMzYzNjM2O2ZvbnQtc2l6ZToxLjI1ZW07Zm9udC13ZWlnaHQ6MzAwO2xpbmUtaGVpZ2h0OjEuMjU7cGFkZGluZzowLjVlbSAwLjc1ZW19LnBhbmVsLXRhYnN7YWxpZ24taXRlbXM6ZmxleC1lbmQ7ZGlzcGxheTpmbGV4O2ZvbnQtc2l6ZTowLjg3NWVtO2p1c3RpZnktY29udGVudDpjZW50ZXJ9LnBhbmVsLXRhYnMgYXtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZGJkYmRiO21hcmdpbi1ib3R0b206LTFweDtwYWRkaW5nOjAuNWVtfS5wYW5lbC10YWJzIGEuaXMtYWN0aXZle2JvcmRlci1ib3R0b20tY29sb3I6IzRhNGE0YTtjb2xvcjojMzYzNjM2fS5wYW5lbC1saXN0IGF7Y29sb3I6IzRhNGE0YX0ucGFuZWwtbGlzdCBhOmhvdmVye2NvbG9yOiMxODJiNzN9LnBhbmVsLWJsb2Nre2FsaWduLWl0ZW1zOmNlbnRlcjtjb2xvcjojMzYzNjM2O2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtwYWRkaW5nOjAuNWVtIDAuNzVlbX0ucGFuZWwtYmxvY2sgaW5wdXRbdHlwZT1cXFwiY2hlY2tib3hcXFwiXXttYXJnaW4tcmlnaHQ6MC43NWVtfS5wYW5lbC1ibG9jaz4uY29udHJvbHtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO3dpZHRoOjEwMCV9LnBhbmVsLWJsb2NrLmlzLWFjdGl2ZXtib3JkZXItbGVmdC1jb2xvcjojMTgyYjczO2NvbG9yOiMzNjM2MzZ9LnBhbmVsLWJsb2NrLmlzLWFjdGl2ZSAucGFuZWwtaWNvbntjb2xvcjojMTgyYjczfWEucGFuZWwtYmxvY2ssbGFiZWwucGFuZWwtYmxvY2t7Y3Vyc29yOnBvaW50ZXJ9YS5wYW5lbC1ibG9jazpob3ZlcixsYWJlbC5wYW5lbC1ibG9jazpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9LnBhbmVsLWljb257ZGlzcGxheTppbmxpbmUtYmxvY2s7Zm9udC1zaXplOjE0cHg7aGVpZ2h0OjFlbTtsaW5lLWhlaWdodDoxZW07dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjFlbTtjb2xvcjojN2E3YTdhO21hcmdpbi1yaWdodDowLjc1ZW19LnBhbmVsLWljb24gLmZhe2ZvbnQtc2l6ZTppbmhlcml0O2xpbmUtaGVpZ2h0OmluaGVyaXR9LnRhYnN7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lO2FsaWduLWl0ZW1zOnN0cmV0Y2g7ZGlzcGxheTpmbGV4O2ZvbnQtc2l6ZToxcmVtO2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO292ZXJmbG93OmhpZGRlbjtvdmVyZmxvdy14OmF1dG87d2hpdGUtc3BhY2U6bm93cmFwfS50YWJzOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LnRhYnMgYXthbGlnbi1pdGVtczpjZW50ZXI7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2RiZGJkYjtjb2xvcjojNGE0YTRhO2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO21hcmdpbi1ib3R0b206LTFweDtwYWRkaW5nOjAuNWVtIDFlbTt2ZXJ0aWNhbC1hbGlnbjp0b3B9LnRhYnMgYTpob3Zlcntib3JkZXItYm90dG9tLWNvbG9yOiMzNjM2MzY7Y29sb3I6IzM2MzYzNn0udGFicyBsaXtkaXNwbGF5OmJsb2NrfS50YWJzIGxpLmlzLWFjdGl2ZSBhe2JvcmRlci1ib3R0b20tY29sb3I6IzE4MmI3Mztjb2xvcjojMTgyYjczfS50YWJzIHVse2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZGJkYmRiO2Rpc3BsYXk6ZmxleDtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0fS50YWJzIHVsLmlzLWxlZnR7cGFkZGluZy1yaWdodDowLjc1ZW19LnRhYnMgdWwuaXMtY2VudGVye2ZsZXg6bm9uZTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW19LnRhYnMgdWwuaXMtcmlnaHR7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kO3BhZGRpbmctbGVmdDowLjc1ZW19LnRhYnMgLmljb246Zmlyc3QtY2hpbGR7bWFyZ2luLXJpZ2h0OjAuNWVtfS50YWJzIC5pY29uOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6MC41ZW19LnRhYnMuaXMtY2VudGVyZWQgdWx7anVzdGlmeS1jb250ZW50OmNlbnRlcn0udGFicy5pcy1yaWdodCB1bHtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmR9LnRhYnMuaXMtYm94ZWQgYXtib3JkZXI6MXB4IHNvbGlkIHRyYW5zcGFyZW50O2JvcmRlci1yYWRpdXM6M3B4IDNweCAwIDB9LnRhYnMuaXMtYm94ZWQgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWJvdHRvbS1jb2xvcjojZGJkYmRifS50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhe2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2RiZGJkYjtib3JkZXItYm90dG9tLWNvbG9yOnRyYW5zcGFyZW50ICFpbXBvcnRhbnR9LnRhYnMuaXMtZnVsbHdpZHRoIGxpe2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjB9LnRhYnMuaXMtdG9nZ2xlIGF7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO21hcmdpbi1ib3R0b206MDtwb3NpdGlvbjpyZWxhdGl2ZX0udGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOiNiNWI1YjU7ei1pbmRleDoyfS50YWJzLmlzLXRvZ2dsZSBsaStsaXttYXJnaW4tbGVmdDotMXB4fS50YWJzLmlzLXRvZ2dsZSBsaTpmaXJzdC1jaGlsZCBhe2JvcmRlci1yYWRpdXM6M3B4IDAgMCAzcHh9LnRhYnMuaXMtdG9nZ2xlIGxpOmxhc3QtY2hpbGQgYXtib3JkZXItcmFkaXVzOjAgM3B4IDNweCAwfS50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Ym9yZGVyLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZjt6LWluZGV4OjF9LnRhYnMuaXMtdG9nZ2xlIHVse2JvcmRlci1ib3R0b206bm9uZX0udGFicy5pcy1zbWFsbHtmb250LXNpemU6Ljc1cmVtfS50YWJzLmlzLW1lZGl1bXtmb250LXNpemU6MS4yNXJlbX0udGFicy5pcy1sYXJnZXtmb250LXNpemU6MS41cmVtfS5jb2x1bW57ZGlzcGxheTpibG9jaztmbGV4LWJhc2lzOjA7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MTtwYWRkaW5nOjAuNzVyZW19LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtbmFycm93e2ZsZXg6bm9uZX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1mdWxse2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLXRocmVlLXF1YXJ0ZXJze2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtdHdvLXRoaXJkc3tmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtaGFsZntmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9uZS10aGlyZHtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb25lLXF1YXJ0ZXJ7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtdGhyZWUtcXVhcnRlcnN7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC10d28tdGhpcmRze21hcmdpbi1sZWZ0OjY2LjY2NjYlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC1oYWxme21hcmdpbi1sZWZ0OjUwJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtb25lLXRoaXJke21hcmdpbi1sZWZ0OjMzLjMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC1vbmUtcXVhcnRlcnttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtMXtmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTF7bWFyZ2luLWxlZnQ6OC4zMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtMntmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC0ye21hcmdpbi1sZWZ0OjE2LjY2NjY3JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0ze2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTN7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTR7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtNHttYXJnaW4tbGVmdDozMy4zMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtNXtmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC01e21hcmdpbi1sZWZ0OjQxLjY2NjY3JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy02e2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTZ7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTd7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtN3ttYXJnaW4tbGVmdDo1OC4zMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtOHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC04e21hcmdpbi1sZWZ0OjY2LjY2NjY3JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy05e2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTl7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTEwe2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTEwe21hcmdpbi1sZWZ0OjgzLjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0xMXtmbGV4Om5vbmU7d2lkdGg6OTEuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC0xMXttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtMTJ7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTEye21hcmdpbi1sZWZ0OjEwMCV9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5jb2x1bW4uaXMtbmFycm93LW1vYmlsZXtmbGV4Om5vbmV9LmNvbHVtbi5pcy1mdWxsLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLXRocmVlLXF1YXJ0ZXJzLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtdHdvLXRoaXJkcy1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjY2LjY2NjYlfS5jb2x1bW4uaXMtaGFsZi1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9uZS10aGlyZC1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMlfS5jb2x1bW4uaXMtb25lLXF1YXJ0ZXItbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtdGhyZWUtcXVhcnRlcnMtbW9iaWxle21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLW9mZnNldC10d28tdGhpcmRzLW1vYmlsZXttYXJnaW4tbGVmdDo2Ni42NjY2JX0uY29sdW1uLmlzLW9mZnNldC1oYWxmLW1vYmlsZXttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXRoaXJkLW1vYmlsZXttYXJnaW4tbGVmdDozMy4zMzMzJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtcXVhcnRlci1tb2JpbGV7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtMS1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjguMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEtbW9iaWxle21hcmdpbi1sZWZ0OjguMzMzMzMlfS5jb2x1bW4uaXMtMi1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjE2LjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC0yLW1vYmlsZXttYXJnaW4tbGVmdDoxNi42NjY2NyV9LmNvbHVtbi5pcy0zLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LTMtbW9iaWxle21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTQtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNC1tb2JpbGV7bWFyZ2luLWxlZnQ6MzMuMzMzMzMlfS5jb2x1bW4uaXMtNS1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjQxLjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC01LW1vYmlsZXttYXJnaW4tbGVmdDo0MS42NjY2NyV9LmNvbHVtbi5pcy02LW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LTYtbW9iaWxle21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLTctbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo1OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNy1tb2JpbGV7bWFyZ2luLWxlZnQ6NTguMzMzMzMlfS5jb2x1bW4uaXMtOC1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjY2LjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC04LW1vYmlsZXttYXJnaW4tbGVmdDo2Ni42NjY2NyV9LmNvbHVtbi5pcy05LW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LTktbW9iaWxle21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLTEwLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6ODMuMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEwLW1vYmlsZXttYXJnaW4tbGVmdDo4My4zMzMzMyV9LmNvbHVtbi5pcy0xMS1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjkxLjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC0xMS1tb2JpbGV7bWFyZ2luLWxlZnQ6OTEuNjY2NjclfS5jb2x1bW4uaXMtMTItbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtb2Zmc2V0LTEyLW1vYmlsZXttYXJnaW4tbGVmdDoxMDAlfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmNvbHVtbi5pcy1uYXJyb3csLmNvbHVtbi5pcy1uYXJyb3ctdGFibGV0e2ZsZXg6bm9uZX0uY29sdW1uLmlzLWZ1bGwsLmNvbHVtbi5pcy1mdWxsLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLXRocmVlLXF1YXJ0ZXJzLC5jb2x1bW4uaXMtdGhyZWUtcXVhcnRlcnMtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy10d28tdGhpcmRzLC5jb2x1bW4uaXMtdHdvLXRoaXJkcy10YWJsZXR7ZmxleDpub25lO3dpZHRoOjY2LjY2NjYlfS5jb2x1bW4uaXMtaGFsZiwuY29sdW1uLmlzLWhhbGYtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vbmUtdGhpcmQsLmNvbHVtbi5pcy1vbmUtdGhpcmQtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzJX0uY29sdW1uLmlzLW9uZS1xdWFydGVyLC5jb2x1bW4uaXMtb25lLXF1YXJ0ZXItdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtdGhyZWUtcXVhcnRlcnMsLmNvbHVtbi5pcy1vZmZzZXQtdGhyZWUtcXVhcnRlcnMtdGFibGV0e21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLW9mZnNldC10d28tdGhpcmRzLC5jb2x1bW4uaXMtb2Zmc2V0LXR3by10aGlyZHMtdGFibGV0e21hcmdpbi1sZWZ0OjY2LjY2NjYlfS5jb2x1bW4uaXMtb2Zmc2V0LWhhbGYsLmNvbHVtbi5pcy1vZmZzZXQtaGFsZi10YWJsZXR7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LW9uZS10aGlyZCwuY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmQtdGFibGV0e21hcmdpbi1sZWZ0OjMzLjMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LW9uZS1xdWFydGVyLC5jb2x1bW4uaXMtb2Zmc2V0LW9uZS1xdWFydGVyLXRhYmxldHttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy0xLC5jb2x1bW4uaXMtMS10YWJsZXR7ZmxleDpub25lO3dpZHRoOjguMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEsLmNvbHVtbi5pcy1vZmZzZXQtMS10YWJsZXR7bWFyZ2luLWxlZnQ6OC4zMzMzMyV9LmNvbHVtbi5pcy0yLC5jb2x1bW4uaXMtMi10YWJsZXR7ZmxleDpub25lO3dpZHRoOjE2LjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC0yLC5jb2x1bW4uaXMtb2Zmc2V0LTItdGFibGV0e21hcmdpbi1sZWZ0OjE2LjY2NjY3JX0uY29sdW1uLmlzLTMsLmNvbHVtbi5pcy0zLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LTMsLmNvbHVtbi5pcy1vZmZzZXQtMy10YWJsZXR7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtNCwuY29sdW1uLmlzLTQtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNCwuY29sdW1uLmlzLW9mZnNldC00LXRhYmxldHttYXJnaW4tbGVmdDozMy4zMzMzMyV9LmNvbHVtbi5pcy01LC5jb2x1bW4uaXMtNS10YWJsZXR7ZmxleDpub25lO3dpZHRoOjQxLjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC01LC5jb2x1bW4uaXMtb2Zmc2V0LTUtdGFibGV0e21hcmdpbi1sZWZ0OjQxLjY2NjY3JX0uY29sdW1uLmlzLTYsLmNvbHVtbi5pcy02LXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LTYsLmNvbHVtbi5pcy1vZmZzZXQtNi10YWJsZXR7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtNywuY29sdW1uLmlzLTctdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo1OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNywuY29sdW1uLmlzLW9mZnNldC03LXRhYmxldHttYXJnaW4tbGVmdDo1OC4zMzMzMyV9LmNvbHVtbi5pcy04LC5jb2x1bW4uaXMtOC10YWJsZXR7ZmxleDpub25lO3dpZHRoOjY2LjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC04LC5jb2x1bW4uaXMtb2Zmc2V0LTgtdGFibGV0e21hcmdpbi1sZWZ0OjY2LjY2NjY3JX0uY29sdW1uLmlzLTksLmNvbHVtbi5pcy05LXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LTksLmNvbHVtbi5pcy1vZmZzZXQtOS10YWJsZXR7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtMTAsLmNvbHVtbi5pcy0xMC10YWJsZXR7ZmxleDpub25lO3dpZHRoOjgzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC0xMCwuY29sdW1uLmlzLW9mZnNldC0xMC10YWJsZXR7bWFyZ2luLWxlZnQ6ODMuMzMzMzMlfS5jb2x1bW4uaXMtMTEsLmNvbHVtbi5pcy0xMS10YWJsZXR7ZmxleDpub25lO3dpZHRoOjkxLjY2NjY3JX0uY29sdW1uLmlzLW9mZnNldC0xMSwuY29sdW1uLmlzLW9mZnNldC0xMS10YWJsZXR7bWFyZ2luLWxlZnQ6OTEuNjY2NjclfS5jb2x1bW4uaXMtMTIsLmNvbHVtbi5pcy0xMi10YWJsZXR7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbi5pcy1vZmZzZXQtMTIsLmNvbHVtbi5pcy1vZmZzZXQtMTItdGFibGV0e21hcmdpbi1sZWZ0OjEwMCV9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmNvbHVtbi5pcy1uYXJyb3ctZGVza3RvcHtmbGV4Om5vbmV9LmNvbHVtbi5pcy1mdWxsLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbi5pcy10aHJlZS1xdWFydGVycy1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy10d28tdGhpcmRzLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjY2LjY2NjYlfS5jb2x1bW4uaXMtaGFsZi1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vbmUtdGhpcmQtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMyV9LmNvbHVtbi5pcy1vbmUtcXVhcnRlci1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtdGhyZWUtcXVhcnRlcnMtZGVza3RvcHttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtdHdvLXRoaXJkcy1kZXNrdG9we21hcmdpbi1sZWZ0OjY2LjY2NjYlfS5jb2x1bW4uaXMtb2Zmc2V0LWhhbGYtZGVza3RvcHttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXRoaXJkLWRlc2t0b3B7bWFyZ2luLWxlZnQ6MzMuMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXF1YXJ0ZXItZGVza3RvcHttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy0xLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjguMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEtZGVza3RvcHttYXJnaW4tbGVmdDo4LjMzMzMzJX0uY29sdW1uLmlzLTItZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTItZGVza3RvcHttYXJnaW4tbGVmdDoxNi42NjY2NyV9LmNvbHVtbi5pcy0zLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC0zLWRlc2t0b3B7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtNC1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNC1kZXNrdG9we21hcmdpbi1sZWZ0OjMzLjMzMzMzJX0uY29sdW1uLmlzLTUtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTUtZGVza3RvcHttYXJnaW4tbGVmdDo0MS42NjY2NyV9LmNvbHVtbi5pcy02LWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9mZnNldC02LWRlc2t0b3B7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtNy1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo1OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNy1kZXNrdG9we21hcmdpbi1sZWZ0OjU4LjMzMzMzJX0uY29sdW1uLmlzLTgtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTgtZGVza3RvcHttYXJnaW4tbGVmdDo2Ni42NjY2NyV9LmNvbHVtbi5pcy05LWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLW9mZnNldC05LWRlc2t0b3B7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtMTAtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6ODMuMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEwLWRlc2t0b3B7bWFyZ2luLWxlZnQ6ODMuMzMzMzMlfS5jb2x1bW4uaXMtMTEtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6OTEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTExLWRlc2t0b3B7bWFyZ2luLWxlZnQ6OTEuNjY2NjclfS5jb2x1bW4uaXMtMTItZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLW9mZnNldC0xMi1kZXNrdG9we21hcmdpbi1sZWZ0OjEwMCV9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmNvbHVtbi5pcy1uYXJyb3ctd2lkZXNjcmVlbntmbGV4Om5vbmV9LmNvbHVtbi5pcy1mdWxsLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbi5pcy10aHJlZS1xdWFydGVycy13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy10d28tdGhpcmRzLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjY2LjY2NjYlfS5jb2x1bW4uaXMtaGFsZi13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vbmUtdGhpcmQtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMyV9LmNvbHVtbi5pcy1vbmUtcXVhcnRlci13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtdGhyZWUtcXVhcnRlcnMtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtdHdvLXRoaXJkcy13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjY2LjY2NjYlfS5jb2x1bW4uaXMtb2Zmc2V0LWhhbGYtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXRoaXJkLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6MzMuMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXF1YXJ0ZXItd2lkZXNjcmVlbnttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy0xLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjguMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo4LjMzMzMzJX0uY29sdW1uLmlzLTItd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTItd2lkZXNjcmVlbnttYXJnaW4tbGVmdDoxNi42NjY2NyV9LmNvbHVtbi5pcy0zLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC0zLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtNC13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNC13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjMzLjMzMzMzJX0uY29sdW1uLmlzLTUtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTUtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo0MS42NjY2NyV9LmNvbHVtbi5pcy02LXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9mZnNldC02LXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtNy13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo1OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtNy13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjU4LjMzMzMzJX0uY29sdW1uLmlzLTgtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTgtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo2Ni42NjY2NyV9LmNvbHVtbi5pcy05LXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLW9mZnNldC05LXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtMTAtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6ODMuMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEwLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6ODMuMzMzMzMlfS5jb2x1bW4uaXMtMTEtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6OTEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTExLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6OTEuNjY2NjclfS5jb2x1bW4uaXMtMTItd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLW9mZnNldC0xMi13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjEwMCV9fS5jb2x1bW5ze21hcmdpbi1sZWZ0Oi0wLjc1cmVtO21hcmdpbi1yaWdodDotMC43NXJlbTttYXJnaW4tdG9wOi0wLjc1cmVtfS5jb2x1bW5zOmxhc3QtY2hpbGR7bWFyZ2luLWJvdHRvbTotMC43NXJlbX0uY29sdW1uczpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX0uY29sdW1ucy5pcy1jZW50ZXJlZHtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5jb2x1bW5zLmlzLWdhcGxlc3N7bWFyZ2luLWxlZnQ6MDttYXJnaW4tcmlnaHQ6MDttYXJnaW4tdG9wOjB9LmNvbHVtbnMuaXMtZ2FwbGVzczpsYXN0LWNoaWxke21hcmdpbi1ib3R0b206MH0uY29sdW1ucy5pcy1nYXBsZXNzOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LmNvbHVtbnMuaXMtZ2FwbGVzcz4uY29sdW1ue21hcmdpbjowO3BhZGRpbmc6MH1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmNvbHVtbnMuaXMtZ3JpZHtmbGV4LXdyYXA6d3JhcH0uY29sdW1ucy5pcy1ncmlkPi5jb2x1bW57bWF4LXdpZHRoOjMzLjMzMzMlO3BhZGRpbmc6MC43NXJlbTt3aWR0aDozMy4zMzMzJX0uY29sdW1ucy5pcy1ncmlkPi5jb2x1bW4rLmNvbHVtbnttYXJnaW4tbGVmdDowfX0uY29sdW1ucy5pcy1tb2JpbGV7ZGlzcGxheTpmbGV4fS5jb2x1bW5zLmlzLW11bHRpbGluZXtmbGV4LXdyYXA6d3JhcH0uY29sdW1ucy5pcy12Y2VudGVyZWR7YWxpZ24taXRlbXM6Y2VudGVyfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuY29sdW1uczpub3QoLmlzLWRlc2t0b3Ape2Rpc3BsYXk6ZmxleH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuY29sdW1ucy5pcy1kZXNrdG9we2Rpc3BsYXk6ZmxleH19LnRpbGV7YWxpZ24taXRlbXM6c3RyZXRjaDtkaXNwbGF5OmJsb2NrO2ZsZXgtYmFzaXM6MDtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO21pbi1oZWlnaHQ6bWluLWNvbnRlbnR9LnRpbGUuaXMtYW5jZXN0b3J7bWFyZ2luLWxlZnQ6LTAuNzVyZW07bWFyZ2luLXJpZ2h0Oi0wLjc1cmVtO21hcmdpbi10b3A6LTAuNzVyZW19LnRpbGUuaXMtYW5jZXN0b3I6bGFzdC1jaGlsZHttYXJnaW4tYm90dG9tOi0wLjc1cmVtfS50aWxlLmlzLWFuY2VzdG9yOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfS50aWxlLmlzLWNoaWxke21hcmdpbjowICFpbXBvcnRhbnR9LnRpbGUuaXMtcGFyZW50e3BhZGRpbmc6MC43NXJlbX0udGlsZS5pcy12ZXJ0aWNhbHtmbGV4LWRpcmVjdGlvbjpjb2x1bW59LnRpbGUuaXMtdmVydGljYWw+LnRpbGUuaXMtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbSAhaW1wb3J0YW50fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsudGlsZTpub3QoLmlzLWNoaWxkKXtkaXNwbGF5OmZsZXh9LnRpbGUuaXMtMXtmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LnRpbGUuaXMtMntmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS50aWxlLmlzLTN7ZmxleDpub25lO3dpZHRoOjI1JX0udGlsZS5pcy00e2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzMyV9LnRpbGUuaXMtNXtmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS50aWxlLmlzLTZ7ZmxleDpub25lO3dpZHRoOjUwJX0udGlsZS5pcy03e2ZsZXg6bm9uZTt3aWR0aDo1OC4zMzMzMyV9LnRpbGUuaXMtOHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS50aWxlLmlzLTl7ZmxleDpub25lO3dpZHRoOjc1JX0udGlsZS5pcy0xMHtmbGV4Om5vbmU7d2lkdGg6ODMuMzMzMzMlfS50aWxlLmlzLTExe2ZsZXg6bm9uZTt3aWR0aDo5MS42NjY2NyV9LnRpbGUuaXMtMTJ7ZmxleDpub25lO3dpZHRoOjEwMCV9fS5oZXJvLXZpZGVve2JvdHRvbTowO2xlZnQ6MDtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO3RvcDowO292ZXJmbG93OmhpZGRlbn0uaGVyby12aWRlbyB2aWRlb3tsZWZ0OjUwJTttaW4taGVpZ2h0OjEwMCU7bWluLXdpZHRoOjEwMCU7cG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTt0cmFuc2Zvcm06dHJhbnNsYXRlM2QoLTUwJSwgLTUwJSwgMCl9Lmhlcm8tdmlkZW8uaXMtdHJhbnNwYXJlbnR7b3BhY2l0eTowLjN9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLXZpZGVve2Rpc3BsYXk6bm9uZX19Lmhlcm8tYnV0dG9uc3ttYXJnaW4tdG9wOjEuNXJlbX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8tYnV0dG9ucyAuYnV0dG9ue2Rpc3BsYXk6ZmxleH0uaGVyby1idXR0b25zIC5idXR0b246bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNzVyZW19fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaGVyby1idXR0b25ze2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS5oZXJvLWJ1dHRvbnMgLmJ1dHRvbjpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1yaWdodDoxLjVyZW19fS5oZXJvLWhlYWQsLmhlcm8tZm9vdHtmbGV4LWdyb3c6MDtmbGV4LXNocmluazowfS5oZXJvLWJvZHl7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MDtwYWRkaW5nOjNyZW0gMS41cmVtfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7Lmhlcm8tYm9keXtwYWRkaW5nLWxlZnQ6MDtwYWRkaW5nLXJpZ2h0OjB9fS5oZXJve2FsaWduLWl0ZW1zOnN0cmV0Y2g7YmFja2dyb3VuZC1jb2xvcjojZmZmO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW59Lmhlcm8gLm5hdntiYWNrZ3JvdW5kOm5vbmU7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjE5LDIxOSwyMTksMC4zKX0uaGVybyAudGFicyB1bHtib3JkZXItYm90dG9tOm5vbmV9Lmhlcm8uaXMtd2hpdGV7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtd2hpdGUgYSwuaGVyby5pcy13aGl0ZSBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy13aGl0ZSAudGl0bGV7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAuc3VidGl0bGV7Y29sb3I6cmdiYSgxMCwxMCwxMCwwLjkpfS5oZXJvLmlzLXdoaXRlIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLXdoaXRlIC5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDEwLDEwLDEwLDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXdoaXRlIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9fS5oZXJvLmlzLXdoaXRlIGEubmF2LWl0ZW0sLmhlcm8uaXMtd2hpdGUgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMTAsMTAsMTAsMC43KX0uaGVyby5pcy13aGl0ZSBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLXdoaXRlIGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLXdoaXRlIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy13aGl0ZSAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtd2hpdGUgLnRhYnMgYXtjb2xvcjojMGEwYTBhO29wYWNpdHk6MC45fS5oZXJvLmlzLXdoaXRlIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLXdoaXRlIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy13aGl0ZSAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtd2hpdGUgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy13aGl0ZSAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy13aGl0ZSAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy13aGl0ZSAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy13aGl0ZSAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtd2hpdGUgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtib3JkZXItY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5oZXJvLmlzLXdoaXRlLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjZTZlNmU2IDAlLCAjZmZmIDcxJSwgI2ZmZiAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtd2hpdGUgLm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtd2hpdGUgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtd2hpdGUgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhfS5oZXJvLmlzLXdoaXRlIC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMil9fS5oZXJvLmlzLWJsYWNre2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5oZXJvLmlzLWJsYWNrIGEsLmhlcm8uaXMtYmxhY2sgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtYmxhY2sgLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLnN1YnRpdGxle2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC45KX0uaGVyby5pcy1ibGFjayAuc3VidGl0bGUgYSwuaGVyby5pcy1ibGFjayAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1ibGFjayAubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhfX0uaGVyby5pcy1ibGFjayBhLm5hdi1pdGVtLC5oZXJvLmlzLWJsYWNrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuNyl9Lmhlcm8uaXMtYmxhY2sgYS5uYXYtaXRlbTpob3ZlciwuaGVyby5pcy1ibGFjayBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1ibGFjayAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtYmxhY2sgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pLmlzLWFjdGl2ZXtjb2xvcjojZmZmfS5oZXJvLmlzLWJsYWNrIC50YWJzIGF7Y29sb3I6I2ZmZjtvcGFjaXR5OjAuOX0uaGVyby5pcy1ibGFjayAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1ibGFjayAudGFicyBsaS5pcy1hY3RpdmUgYXtvcGFjaXR5OjF9Lmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1ibGFjayAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojZmZmfS5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLWJveGVkIGE6aG92ZXIsLmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsLmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy1ibGFjay5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgIzAwMCAwJSwgIzBhMGEwYSA3MSUsICMxODE2MTYgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWJsYWNrIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWJsYWNrIC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWJsYWNrIC5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1ibGFjayAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX0uaGVyby5pcy1saWdodHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0uaGVyby5pcy1saWdodCBhLC5oZXJvLmlzLWxpZ2h0IHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLWxpZ2h0IC50aXRsZXtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuOSl9Lmhlcm8uaXMtbGlnaHQgLnN1YnRpdGxlIGEsLmhlcm8uaXMtbGlnaHQgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoNTQsNTQsNTQsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtbGlnaHQgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX19Lmhlcm8uaXMtbGlnaHQgYS5uYXYtaXRlbSwuaGVyby5pcy1saWdodCAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbil7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjcpfS5oZXJvLmlzLWxpZ2h0IGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtbGlnaHQgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtbGlnaHQgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pOmhvdmVyLC5oZXJvLmlzLWxpZ2h0IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6IzM2MzYzNn0uaGVyby5pcy1saWdodCAudGFicyBhe2NvbG9yOiMzNjM2MzY7b3BhY2l0eTowLjl9Lmhlcm8uaXMtbGlnaHQgLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtbGlnaHQgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6IzM2MzYzNn0uaGVyby5pcy1saWdodCAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1saWdodCAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2JvcmRlci1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtbGlnaHQuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICNkZmQ4ZDggMCUsICNmNWY1ZjUgNzElLCAjZmZmIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1saWdodCAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzM2MzYzNn0uaGVyby5pcy1saWdodCAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1saWdodCAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzZ9Lmhlcm8uaXMtbGlnaHQgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoNTQsNTQsNTQsMC4yKX19Lmhlcm8uaXMtZGFya3tiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1kYXJrIGEsLmhlcm8uaXMtZGFyayBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1kYXJrIC50aXRsZXtjb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgLnN1YnRpdGxle2NvbG9yOnJnYmEoMjQ1LDI0NSwyNDUsMC45KX0uaGVyby5pcy1kYXJrIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLWRhcmsgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNDUsMjQ1LDI0NSwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1kYXJrIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzZ9fS5oZXJvLmlzLWRhcmsgYS5uYXYtaXRlbSwuaGVyby5pcy1kYXJrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDI0NSwyNDUsMjQ1LDAuNyl9Lmhlcm8uaXMtZGFyayBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLWRhcmsgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtZGFyayAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtZGFyayAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAudGFicyBhe2NvbG9yOiNmNWY1ZjU7b3BhY2l0eTowLjl9Lmhlcm8uaXMtZGFyayAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1kYXJrIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1kYXJrIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtZGFyayAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1kYXJrIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtZGFyayAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1kYXJrIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1kYXJrIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0uaGVyby5pcy1kYXJrLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMWYxOTE5IDAlLCAjMzYzNjM2IDcxJSwgIzQ2M2YzZiAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtZGFyayAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1kYXJrIC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWRhcmsgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMjQ1LDI0NSwyNDUsMC4yKX19Lmhlcm8uaXMtcHJpbWFyeXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0uaGVyby5pcy1wcmltYXJ5IGEsLmhlcm8uaXMtcHJpbWFyeSBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1wcmltYXJ5IC50aXRsZXtjb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgLnN1YnRpdGxle2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC45KX0uaGVyby5pcy1wcmltYXJ5IC5zdWJ0aXRsZSBhLC5oZXJvLmlzLXByaW1hcnkgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1wcmltYXJ5IC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzN9fS5oZXJvLmlzLXByaW1hcnkgYS5uYXYtaXRlbSwuaGVyby5pcy1wcmltYXJ5IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuNyl9Lmhlcm8uaXMtcHJpbWFyeSBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLXByaW1hcnkgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtcHJpbWFyeSAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtcHJpbWFyeSAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAudGFicyBhe2NvbG9yOiNmZmY7b3BhY2l0eTowLjl9Lmhlcm8uaXMtcHJpbWFyeSAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1wcmltYXJ5IC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6IzE4MmI3M30uaGVyby5pcy1wcmltYXJ5LmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMGIyNDRkIDAlLCAjMTgyYjczIDcxJSwgIzE4MWQ4YyAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtcHJpbWFyeSAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1wcmltYXJ5IC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXByaW1hcnkgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC4yKX19Lmhlcm8uaXMtaW5mb3tiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Y29sb3I6I2ZmZn0uaGVyby5pcy1pbmZvIGEsLmhlcm8uaXMtaW5mbyBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1pbmZvIC50aXRsZXtjb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gLnN1YnRpdGxle2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC45KX0uaGVyby5pcy1pbmZvIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLWluZm8gLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1pbmZvIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGN9fS5oZXJvLmlzLWluZm8gYS5uYXYtaXRlbSwuaGVyby5pcy1pbmZvIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuNyl9Lmhlcm8uaXMtaW5mbyBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLWluZm8gYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtaW5mbyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtaW5mbyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAudGFicyBhe2NvbG9yOiNmZmY7b3BhY2l0eTowLjl9Lmhlcm8uaXMtaW5mbyAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1pbmZvIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1pbmZvIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtaW5mbyAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1pbmZvIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWluZm8gLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtaW5mbyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1pbmZvIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1pbmZvIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6IzMyNzNkY30uaGVyby5pcy1pbmZvLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMTU3N2M2IDAlLCAjMzI3M2RjIDcxJSwgIzQzNjZlNSAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtaW5mbyAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1pbmZvIC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWluZm8gLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC4yKX19Lmhlcm8uaXMtc3VjY2Vzc3tiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Y29sb3I6I2ZmZn0uaGVyby5pcy1zdWNjZXNzIGEsLmhlcm8uaXMtc3VjY2VzcyBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1zdWNjZXNzIC50aXRsZXtjb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgLnN1YnRpdGxle2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC45KX0uaGVyby5pcy1zdWNjZXNzIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLXN1Y2Nlc3MgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyNTUsMjU1LDI1NSwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1zdWNjZXNzIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjB9fS5oZXJvLmlzLXN1Y2Nlc3MgYS5uYXYtaXRlbSwuaGVyby5pcy1zdWNjZXNzIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuNyl9Lmhlcm8uaXMtc3VjY2VzcyBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLXN1Y2Nlc3MgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtc3VjY2VzcyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtc3VjY2VzcyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAudGFicyBhe2NvbG9yOiNmZmY7b3BhY2l0eTowLjl9Lmhlcm8uaXMtc3VjY2VzcyAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1zdWNjZXNzIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6IzIzZDE2MH0uaGVyby5pcy1zdWNjZXNzLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMTJhZjJmIDAlLCAjMjNkMTYwIDcxJSwgIzJjZTI4YSAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtc3VjY2VzcyAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1zdWNjZXNzIC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC4yKX19Lmhlcm8uaXMtd2FybmluZ3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTc7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgYSwuaGVyby5pcy13YXJuaW5nIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLXdhcm5pbmcgLnRpdGxle2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDAsMCwwLDAuOSl9Lmhlcm8uaXMtd2FybmluZyAuc3VidGl0bGUgYSwuaGVyby5pcy13YXJuaW5nIC5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgwLDAsMCwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy13YXJuaW5nIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTd9fS5oZXJvLmlzLXdhcm5pbmcgYS5uYXYtaXRlbSwuaGVyby5pcy13YXJuaW5nIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLXdhcm5pbmcgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtd2FybmluZyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtd2FybmluZyAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIC50YWJzIGF7Y29sb3I6cmdiYSgwLDAsMCwwLjcpO29wYWNpdHk6MC45fS5oZXJvLmlzLXdhcm5pbmcgLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtd2FybmluZyAudGFicyBsaS5pcy1hY3RpdmUgYXtvcGFjaXR5OjF9Lmhlcm8uaXMtd2FybmluZyAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtd2FybmluZyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KTtib3JkZXItY29sb3I6cmdiYSgwLDAsMCwwLjcpO2NvbG9yOiNmZmRkNTd9Lmhlcm8uaXMtd2FybmluZy5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgI2ZmYWYyNCAwJSwgI2ZmZGQ1NyA3MSUsICNmZmZhNzAgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXdhcm5pbmcgLm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXdhcm5pbmcgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgwLDAsMCwwLjIpfX0uaGVyby5pcy1kYW5nZXJ7YmFja2dyb3VuZC1jb2xvcjpyZWQ7Y29sb3I6I2ZmZn0uaGVyby5pcy1kYW5nZXIgYSwuaGVyby5pcy1kYW5nZXIgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtZGFuZ2VyIC50aXRsZXtjb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLWRhbmdlciAuc3VidGl0bGUgYSwuaGVyby5pcy1kYW5nZXIgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWRhbmdlciAubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjpyZWR9fS5oZXJvLmlzLWRhbmdlciBhLm5hdi1pdGVtLC5oZXJvLmlzLWRhbmdlciAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbil7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjcpfS5oZXJvLmlzLWRhbmdlciBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLWRhbmdlciBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1kYW5nZXIgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pOmhvdmVyLC5oZXJvLmlzLWRhbmdlciAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtZGFuZ2VyIC50YWJzIGF7Y29sb3I6I2ZmZjtvcGFjaXR5OjAuOX0uaGVyby5pcy1kYW5nZXIgLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtZGFuZ2VyIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6I2ZmZn0uaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOnJlZH0uaGVyby5pcy1kYW5nZXIuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICNjMDIgMCUsIHJlZCA3MSUsICNmZjQwMWEgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWRhbmdlciAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1kYW5nZXIgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtZGFuZ2VyIC5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6I2ZmZn0uaGVyby5pcy1kYW5nZXIgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC4yKX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5oZXJvLmlzLW1lZGl1bSAuaGVyby1ib2R5e3BhZGRpbmctYm90dG9tOjlyZW07cGFkZGluZy10b3A6OXJlbX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5oZXJvLmlzLWxhcmdlIC5oZXJvLWJvZHl7cGFkZGluZy1ib3R0b206MThyZW07cGFkZGluZy10b3A6MThyZW19fS5oZXJvLmlzLWZ1bGxoZWlnaHR7bWluLWhlaWdodDoxMDB2aH0uaGVyby5pcy1mdWxsaGVpZ2h0IC5oZXJvLWJvZHl7YWxpZ24taXRlbXM6Y2VudGVyO2Rpc3BsYXk6ZmxleH0uaGVyby5pcy1mdWxsaGVpZ2h0IC5oZXJvLWJvZHk+LmNvbnRhaW5lcntmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxfS5zZWN0aW9ue2JhY2tncm91bmQtY29sb3I6I2ZmZjtwYWRkaW5nOjNyZW0gMS41cmVtfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LnNlY3Rpb24uaXMtbWVkaXVte3BhZGRpbmc6OXJlbSAxLjVyZW19LnNlY3Rpb24uaXMtbGFyZ2V7cGFkZGluZzoxOHJlbSAxLjVyZW19fS5mb290ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O3BhZGRpbmc6M3JlbSAxLjVyZW0gNnJlbX0uaGVhZGVyLmlzLWZpeGVkLXRvcHt6LWluZGV4OjEwMzA7cG9zaXRpb246Zml4ZWQ7dG9wOjA7bGVmdDowO3JpZ2h0OjB9Lmhhcy1maXhlZC1uYXZ7bWFyZ2luLXRvcDo1MHB4fS5zZWN0aW9uLmlzLXNtYWxse3BhZGRpbmc6MXJlbSAxLjVyZW19Lm5hdi1pbnZlcnNle2JhY2tncm91bmQ6IzE4MmI3M30ubmF2LWludmVyc2UgYS5uYXYtaXRlbXtjb2xvcjojZjJmMmYyfS5uYXYtaW52ZXJzZSBhLm5hdi1pdGVtOmhvdmVye2NvbG9yOiNkMWQ1ZTN9Lm5hdi1pbnZlcnNlIGEubmF2LWl0ZW0uaXMtYWN0aXZle2NvbG9yOiNmZmZ9Lm5hdi1pbnZlcnNlIGEubmF2LWl0ZW0uaXMtdGFiOmhvdmVye2JvcmRlci1ib3R0b20tY29sb3I6I2ZmZn0ubmF2LWludmVyc2UgYS5uYXYtaXRlbS5pcy10YWIuaXMtYWN0aXZle2JvcmRlci1ib3R0b206M3B4IHNvbGlkICNmZmY7Y29sb3I6I2ZmZn0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXJ7cG9zaXRpb246Zml4ZWQ7dG9wOjA7Ym90dG9tOjA7ei1pbmRleDoxMDQwO292ZXJmbG93LXk6YXV0bzt0ZXh0LWFsaWduOmNlbnRlcjtiYWNrZ3JvdW5kOiMxODJiNzM7Y29sb3I6I2ZmZjtsZWZ0Oi0yNTBweDt3aWR0aDoyNTBweDt0cmFuc2l0aW9uOmxlZnQgMC41c30ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIuaXMtYWN0aXZle2xlZnQ6MH0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgLm5hdi1pdGVte2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6YmxvY2s7cGFkZGluZy10b3A6MTBweDtwYWRkaW5nLWJvdHRvbTo5cHg7YmFja2dyb3VuZDpyZ2JhKDI1NSwyNTUsMjU1LDAuMSl9Lm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyIC5uYXYtaXRlbS5pcy1hY3RpdmV7YmFja2dyb3VuZDpsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsIHJnYmEoMjU1LDI1NSwyNTUsMC40KSwgcmdiYSgyNTUsMjU1LDI1NSwwLjEpIDUlKX0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgLm5hdi1pdGVtW29wZW5dPnN1bW1hcnl7bWFyZ2luLWJvdHRvbTo5cHh9Lm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyIC5uYXYtaXRlbTpub3QoOmxhc3QtY2hpbGQpe2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNmZmZ9Lm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyIH4gLmlzLW92ZXJsYXl7YmFja2dyb3VuZDpyZ2JhKDAsMCwwLDAuNSk7ei1pbmRleDoxMDM1O3Zpc2liaWxpdHk6aGlkZGVuO3Bvc2l0aW9uOmZpeGVkO29wYWNpdHk6MDt0cmFuc2l0aW9uOm9wYWNpdHkgMC43NXN9Lm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyLmlzLWFjdGl2ZSB+IC5pcy1vdmVybGF5e3Zpc2liaWxpdHk6dmlzaWJsZTtvcGFjaXR5OjF9I2NvbnRhaW5lcj5kaXY6bm90KC52aXNpYmxlKXtkaXNwbGF5Om5vbmV9XFxuXCIgK1xyXG4gICAgJzwvc3R5bGU+JztcclxuXHJcbi8vIFNob3cgdGhlIG1lbnUgd2hlbiBjbGlja2luZyBvbiB0aGUgbWVudSBidXR0b25cclxuQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubmF2LXNsaWRlci10b2dnbGUnKSlcclxuICAgIC5mb3JFYWNoKGVsID0+IGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdG9nZ2xlTWVudSkpO1xyXG5cclxuLy8gSGlkZSB0aGUgbWVudSB3aGVuIGNsaWNraW5nIHRoZSBvdmVybGF5XHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uYXYtc2xpZGVyLWNvbnRhaW5lciAuaXMtb3ZlcmxheScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdG9nZ2xlTWVudSk7XHJcblxyXG4vLyBDaGFuZ2UgdGFic1xyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXInKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGdsb2JhbFRhYkNoYW5nZShldmVudCkge1xyXG4gICAgdmFyIHRhYk5hbWUgPSBldmVudC50YXJnZXQuZGF0YXNldC50YWJOYW1lO1xyXG4gICAgdmFyIHRhYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNjb250YWluZXIgPiBbZGF0YS10YWItbmFtZT0ke3RhYk5hbWV9XWApO1xyXG4gICAgaWYoIXRhYk5hbWUgfHwgIXRhYikge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvL0NvbnRlbnRcclxuICAgIC8vV2UgY2FuJ3QganVzdCByZW1vdmUgdGhlIGZpcnN0IGR1ZSB0byBicm93c2VyIGxhZ1xyXG4gICAgQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjY29udGFpbmVyID4gLnZpc2libGUnKSlcclxuICAgICAgICAuZm9yRWFjaChlbCA9PiBlbC5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJykpO1xyXG4gICAgdGFiLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcclxuXHJcbiAgICAvL1RhYnNcclxuICAgIEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyIC5pcy1hY3RpdmUnKSlcclxuICAgICAgICAuZm9yRWFjaChlbCA9PiBlbC5jbGFzc0xpc3QucmVtb3ZlKCdpcy1hY3RpdmUnKSk7XHJcbiAgICBldmVudC50YXJnZXQuY2xhc3NMaXN0LmFkZCgnaXMtYWN0aXZlJyk7XHJcblxyXG4gICAgaG9vay5maXJlKCd1aS50YWJTaG93bicsIHRhYik7XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2hvdy9oaWRlIHRoZSBtZW51LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB0b2dnbGVNZW51KCk7XHJcbiAqL1xyXG5mdW5jdGlvbiB0b2dnbGVNZW51KCkge1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm5hdi1zbGlkZXItY29udGFpbmVyIC5uYXYtc2xpZGVyJykuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtYWN0aXZlJyk7XHJcbn1cclxuXHJcbnZhciB0YWJVSUQgPSAwO1xyXG4vKipcclxuICogVXNlZCB0byBhZGQgYSB0YWIgdG8gdGhlIGJvdCdzIG5hdmlnYXRpb24uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB0YWIgPSB1aS5hZGRUYWIoJ1RleHQnKTtcclxuICogdmFyIHRhYjIgPSB1aS5hZGRUYWIoJ0N1c3RvbSBNZXNzYWdlcycsICdtZXNzYWdlcycpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFiVGV4dFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2dyb3VwTmFtZT1tYWluXSBPcHRpb25hbC4gSWYgcHJvdmlkZWQsIHRoZSBuYW1lIG9mIHRoZSBncm91cCBvZiB0YWJzIHRvIGFkZCB0aGlzIHRhYiB0by5cclxuICogQHJldHVybiB7Tm9kZX0gLSBUaGUgZGl2IHRvIHBsYWNlIHRhYiBjb250ZW50IGluLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkVGFiKHRhYlRleHQsIGdyb3VwTmFtZSA9ICdtYWluJykge1xyXG4gICAgdmFyIHRhYk5hbWUgPSAnYm90VGFiXycgKyB0YWJVSUQrKztcclxuXHJcbiAgICB2YXIgdGFiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgdGFiLnRleHRDb250ZW50ID0gdGFiVGV4dDtcclxuICAgIHRhYi5jbGFzc0xpc3QuYWRkKCduYXYtaXRlbScpO1xyXG4gICAgdGFiLmRhdGFzZXQudGFiTmFtZSA9IHRhYk5hbWU7XHJcblxyXG4gICAgdmFyIHRhYkNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRhYkNvbnRlbnQuZGF0YXNldC50YWJOYW1lID0gdGFiTmFtZTtcclxuXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAubmF2LXNsaWRlci1jb250YWluZXIgW2RhdGEtdGFiLWdyb3VwPSR7Z3JvdXBOYW1lfV1gKS5hcHBlbmRDaGlsZCh0YWIpO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NvbnRhaW5lcicpLmFwcGVuZENoaWxkKHRhYkNvbnRlbnQpO1xyXG5cclxuICAgIHJldHVybiB0YWJDb250ZW50O1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYSBnbG9iYWwgdGFiLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgdGFiID0gdWkuYWRkVGFiKCdUYWInKTtcclxuICogdWkucmVtb3ZlVGFiKHRhYik7XHJcbiAqIEBwYXJhbSB7Tm9kZX0gdGFiQ29udGVudCBUaGUgZGl2IHJldHVybmVkIGJ5IHRoZSBhZGRUYWIgZnVuY3Rpb24uXHJcbiAqL1xyXG5mdW5jdGlvbiByZW1vdmVUYWIodGFiQ29udGVudCkge1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLm5hdi1zbGlkZXItY29udGFpbmVyIFtkYXRhLXRhYi1uYW1lPSR7dGFiQ29udGVudC5kYXRhc2V0LnRhYk5hbWV9XWApLnJlbW92ZSgpO1xyXG4gICAgdGFiQ29udGVudC5yZW1vdmUoKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgdGFiIGdyb3VwIGluIHdoaWNoIHRhYnMgY2FuIGJlIHBsYWNlZC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdWkuYWRkVGFiR3JvdXAoJ0dyb3VwIFRleHQnLCAnc29tZV9ncm91cCcpO1xyXG4gKiB1aS5hZGRUYWIoJ1dpdGhpbiBncm91cCcsICdzb21lX2dyb3VwJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGhlIHRleHQgdGhlIHVzZXIgd2lsbCBzZWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBncm91cCB3aGljaCBjYW4gYmUgdXNlZCB0byBhZGQgdGFicyB3aXRoaW4gdGhlIGdyb3VwLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW3BhcmVudCA9IG1haW5dIC0gVGhlIG5hbWUgb2YgdGhlIHBhcmVudCBncm91cC5cclxuICovXHJcbmZ1bmN0aW9uIGFkZFRhYkdyb3VwKHRleHQsIGdyb3VwTmFtZSwgcGFyZW50ID0gJ21haW4nKSB7XHJcbiAgICB2YXIgZGV0YWlscyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKTtcclxuICAgIGRldGFpbHMuY2xhc3NMaXN0LmFkZCgnbmF2LWl0ZW0nKTtcclxuICAgIGRldGFpbHMuZGF0YXNldC50YWJHcm91cCA9IGdyb3VwTmFtZTtcclxuXHJcbiAgICB2YXIgc3VtbWFyeSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N1bW1hcnknKTtcclxuICAgIHN1bW1hcnkudGV4dENvbnRlbnQgPSB0ZXh0O1xyXG4gICAgZGV0YWlscy5hcHBlbmRDaGlsZChzdW1tYXJ5KTtcclxuXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAubmF2LXNsaWRlci1jb250YWluZXIgW2RhdGEtdGFiLWdyb3VwPVwiJHtwYXJlbnR9XCJdYCkuYXBwZW5kQ2hpbGQoZGV0YWlscyk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIHRhYiBncm91cCBhbmQgYWxsIHRhYnMgY29udGFpbmVkIHdpdGhpbiB0aGUgc3BlY2lmaWVkIGdyb3VwLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBhZGRUYWJHcm91cCgnR3JvdXAnLCAnZ3JvdXAxJyk7XHJcbiAqIHZhciBpbm5lciA9IGFkZFRhYignSW5uZXInLCAnZ3JvdXAxJyk7XHJcbiAqIHJlbW92ZVRhYkdyb3VwKCdncm91cDEnKTsgLy8gaW5uZXIgaGFzIGJlZW4gcmVtb3ZlZC5cclxuICogQHBhcmFtIHN0cmluZyBncm91cE5hbWUgdGhlIG5hbWUgb2YgdGhlIGdyb3VwIHRoYXQgd2FzIHVzZWQgaW4gdWkuYWRkVGFiR3JvdXAuXHJcbiAqL1xyXG5mdW5jdGlvbiByZW1vdmVUYWJHcm91cChncm91cE5hbWUpIHtcclxuICAgIHZhciBncm91cCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5uYXYtc2xpZGVyLWNvbnRhaW5lciBbZGF0YS10YWItZ3JvdXA9XCIke2dyb3VwTmFtZX1cIl1gKTtcclxuICAgIHZhciBpdGVtcyA9IEFycmF5LmZyb20oZ3JvdXAucXVlcnlTZWxlY3RvckFsbCgnc3BhbicpKTtcclxuXHJcbiAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIC8vVGFiIGNvbnRlbnRcclxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjY29udGFpbmVyID4gW2RhdGEtdGFiLW5hbWU9XCIke2l0ZW0uZGF0YXNldC50YWJOYW1lfVwiXWApLnJlbW92ZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZ3JvdXAucmVtb3ZlKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdG9nZ2xlTWVudSxcclxuICAgIGFkZFRhYixcclxuICAgIHJlbW92ZVRhYixcclxuICAgIGFkZFRhYkdyb3VwLFxyXG4gICAgcmVtb3ZlVGFiR3JvdXAsXHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYWxlcnRcclxufTtcclxuXHJcbi8qKlxyXG4qIEZ1bmN0aW9uIHVzZWQgdG8gcmVxdWlyZSBhY3Rpb24gZnJvbSB0aGUgdXNlci5cclxuKlxyXG4qIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IHRoZSB0ZXh0IHRvIGRpc3BsYXkgaW4gdGhlIGFsZXJ0XHJcbiogQHBhcmFtIHtBcnJheX0gYnV0dG9ucyBhbiBhcnJheSBvZiBidXR0b25zIHRvIGFkZCB0byB0aGUgYWxlcnQuXHJcbiogICAgICAgIEZvcm1hdDogW3t0ZXh0OiAnVGVzdCcsIHN0eWxlOidzdWNjZXNzJywgYWN0aW9uOiBmdW5jdGlvbigpe30sIHRoaXNBcmc6IHdpbmRvdywgZGlzbWlzczogZmFsc2V9XVxyXG4qICAgICAgICBOb3RlOiB0ZXh0IGlzIHRoZSBvbmx5IHJlcXVpcmVkIHBhcmFtYXRlci4gSWYgbm8gYnV0dG9uIGFycmF5IGlzIHNwZWNpZmllZFxyXG4qICAgICAgICB0aGVuIGEgc2luZ2xlIE9LIGJ1dHRvbiB3aWxsIGJlIHNob3duLlxyXG4qICAgICAgICAgUHJvdmlkZWQgc3R5bGVzOiBzdWNjZXNzLCBkYW5nZXIsIHdhcm5pbmcsIGluZm9cclxuKiAgICAgICAgRGVmYXVsdHM6IHN0eWxlOiAnJywgYWN0aW9uOiB1bmRlZmluZWQsIHRoaXNBcmc6IHVuZGVmaW5lZCwgZGlzbWlzczogdHJ1ZVxyXG4qL1xyXG5mdW5jdGlvbiBhbGVydCh0ZXh0LCBidXR0b25zID0gW3t0ZXh0OiAnT0snfV0pIHtcclxuICAgIGlmIChpbnN0YW5jZS5hY3RpdmUpIHtcclxuICAgICAgICBpbnN0YW5jZS5xdWV1ZS5wdXNoKHt0ZXh0LCBidXR0b25zfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaW5zdGFuY2UuYWN0aXZlID0gdHJ1ZTtcclxuXHJcbiAgICBidXR0b25zLmZvckVhY2goZnVuY3Rpb24oYnV0dG9uLCBpKSB7XHJcbiAgICAgICAgYnV0dG9uLmRpc21pc3MgPSAoYnV0dG9uLmRpc21pc3MgPT09IGZhbHNlKSA/IGZhbHNlIDogdHJ1ZTtcclxuICAgICAgICBpbnN0YW5jZS5idXR0b25zWydidXR0b25fJyArIGldID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246IGJ1dHRvbi5hY3Rpb24sXHJcbiAgICAgICAgICAgIHRoaXNBcmc6IGJ1dHRvbi50aGlzQXJnIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgZGlzbWlzczogdHlwZW9mIGJ1dHRvbi5kaXNtaXNzID09ICdib29sZWFuJyA/IGJ1dHRvbi5kaXNtaXNzIDogdHJ1ZSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGJ1dHRvbi5pZCA9ICdidXR0b25fJyArIGk7XHJcbiAgICAgICAgYnVpbGRCdXR0b24oYnV0dG9uKTtcclxuICAgIH0pO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0Q29udGVudCcpLmlubmVySFRNTCA9IHRleHQ7XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IH4gLm92ZXJsYXknKS5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQnKS5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBIb2xkcyB0aGUgY3VycmVudCBhbGVydCBhbmQgcXVldWUgb2YgZnVydGhlciBhbGVydHMuXHJcbiAqL1xyXG52YXIgaW5zdGFuY2UgPSB7XHJcbiAgICBhY3RpdmU6IGZhbHNlLFxyXG4gICAgcXVldWU6IFtdLFxyXG4gICAgYnV0dG9uczoge30sXHJcbn07XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdXNlZCB0byBhZGQgYnV0dG9uIGVsZW1lbnRzIHRvIGFuIGFsZXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gYnV0dG9uXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZEJ1dHRvbihidXR0b24pIHtcclxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIGVsLmlubmVySFRNTCA9IGJ1dHRvbi50ZXh0O1xyXG4gICAgaWYgKGJ1dHRvbi5zdHlsZSkge1xyXG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoYnV0dG9uLnN0eWxlKTtcclxuICAgIH1cclxuICAgIGVsLmlkID0gYnV0dG9uLmlkO1xyXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBidXR0b25IYW5kbGVyKTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCAuYnV0dG9ucycpLmFwcGVuZENoaWxkKGVsKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGRldGVybWluZSB0aGUgZnVuY3Rpb25hbGl0eSBvZiBlYWNoIGJ1dHRvbiBhZGRlZCB0byBhbiBhbGVydC5cclxuICpcclxuICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudFxyXG4gKi9cclxuZnVuY3Rpb24gYnV0dG9uSGFuZGxlcihldmVudCkge1xyXG4gICAgdmFyIGJ1dHRvbiA9IGluc3RhbmNlLmJ1dHRvbnNbZXZlbnQudGFyZ2V0LmlkXSB8fCB7fTtcclxuICAgIGlmICh0eXBlb2YgYnV0dG9uLmFjdGlvbiA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgYnV0dG9uLmFjdGlvbi5jYWxsKGJ1dHRvbi50aGlzQXJnKTtcclxuICAgIH1cclxuXHJcbiAgICAvL1JlcXVpcmUgdGhhdCB0aGVyZSBiZSBhbiBhY3Rpb24gYXNvY2lhdGVkIHdpdGggbm8tZGlzbWlzcyBidXR0b25zLlxyXG4gICAgaWYgKGJ1dHRvbi5kaXNtaXNzIHx8IHR5cGVvZiBidXR0b24uYWN0aW9uICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQnKS5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IH4gLm92ZXJsYXknKS5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IC5idXR0b25zJykuaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgaW5zdGFuY2UuYnV0dG9ucyA9IHt9O1xyXG4gICAgICAgIGluc3RhbmNlLmFjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBBcmUgbW9yZSBhbGVydHMgd2FpdGluZyB0byBiZSBzaG93bj9cclxuICAgICAgICBpZiAoaW5zdGFuY2UucXVldWUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxldCBuZXh0ID0gaW5zdGFuY2UucXVldWUuc2hpZnQoKTtcclxuICAgICAgICAgICAgYWxlcnQobmV4dC50ZXh0LCBuZXh0LmJ1dHRvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJcclxuXHJcbk9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vYWxlcnQnKSxcclxuICAgIHJlcXVpcmUoJy4vbm90aWZ5JylcclxuKTtcclxuXHJcbnZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbmVsLmlubmVySFRNTCA9IFwiXCI7XHJcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuZWwuaWQgPSAnYWxlcnRXcmFwcGVyJztcclxuZWwuaW5uZXJIVE1MID0gXCI8ZGl2IGlkPVxcXCJhbGVydFxcXCI+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImFsZXJ0Q29udGVudFxcXCI+PC9kaXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImJ1dHRvbnNcXFwiLz48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG48ZGl2IGNsYXNzPVxcXCJvdmVybGF5XFxcIi8+PC9kaXY+XFxyXFxuXCI7XHJcblxyXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBub3RpZnksXHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzZW5kIGEgbm9uLWNyaXRpY2FsIGFsZXJ0IHRvIHRoZSB1c2VyLlxyXG4gKiBTaG91bGQgYmUgdXNlZCBpbiBwbGFjZSBvZiB1aS5hbGVydCBpZiBwb3NzaWJsZSBhcyBpdCBpcyBub24tYmxvY2tpbmcuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vU2hvd3MgYSBub3RmaWNhdGlvbiBmb3IgMiBzZWNvbmRzXHJcbiAqIHVpLm5vdGlmeSgnTm90aWZpY2F0aW9uJyk7XHJcbiAqIC8vU2hvd3MgYSBub3RpZmljYXRpb24gZm9yIDUgc2Vjb25kc1xyXG4gKiB1aS5ub3RpZnkoJ05vdGlmaWNhdGlvbicsIDUpO1xyXG4gKiBAcGFyYW0gU3RyaW5nIHRleHQgdGhlIHRleHQgdG8gZGlzcGxheS4gU2hvdWxkIGJlIGtlcHQgc2hvcnQgdG8gYXZvaWQgdmlzdWFsbHkgYmxvY2tpbmcgdGhlIG1lbnUgb24gc21hbGwgZGV2aWNlcy5cclxuICogQHBhcmFtIE51bWJlciBkaXNwbGF5VGltZSB0aGUgbnVtYmVyIG9mIHNlY29uZHMgdG8gc2hvdyB0aGUgbm90aWZpY2F0aW9uIGZvci5cclxuICovXHJcbmZ1bmN0aW9uIG5vdGlmeSh0ZXh0LCBkaXNwbGF5VGltZSA9IDIpIHtcclxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgZWwuY2xhc3NMaXN0LmFkZCgnbm90aWZpY2F0aW9uJyk7XHJcbiAgICBlbC5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcbiAgICBlbC50ZXh0Q29udGVudCA9IHRleHQ7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMucmVtb3ZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpO1xyXG4gICAgfS5iaW5kKGVsKSwgZGlzcGxheVRpbWUgKiAxMDAwKTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnBhcmVudE5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQoZWwpLCBkaXNwbGF5VGltZSAqIDEwMDAgKyAyMTAwKTtcclxufVxyXG4iLCIvL0RldGFpbHMgcG9seWZpbGwsIG9sZGVyIGZpcmVmb3gsIElFXHJcbmlmICghKCdvcGVuJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkZXRhaWxzJykpKSB7XHJcbiAgICBsZXQgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG4gICAgc3R5bGUudGV4dENvbnRlbnQgKz0gYGRldGFpbHM6bm90KFtvcGVuXSkgPiA6bm90KHN1bW1hcnkpIHsgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50OyB9IGRldGFpbHMgPiBzdW1tYXJ5OmJlZm9yZSB7IGNvbnRlbnQ6IFwi4pa2XCI7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgZm9udC1zaXplOiAuOGVtOyB3aWR0aDogMS41ZW07IGZvbnQtZmFtaWx5OlwiQ291cmllciBOZXdcIjsgfSBkZXRhaWxzW29wZW5dID4gc3VtbWFyeTpiZWZvcmUgeyB0cmFuc2Zvcm06IHJvdGF0ZSg5MGRlZyk7IH1gO1xyXG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XHJcblxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LnRhZ05hbWUgPT0gJ1NVTU1BUlknKSB7XHJcbiAgICAgICAgICAgIGxldCBkZXRhaWxzID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWRldGFpbHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGRldGFpbHMuZ2V0QXR0cmlidXRlKCdvcGVuJykpIHtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMub3BlbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5yZW1vdmVBdHRyaWJ1dGUoJ29wZW4nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMub3BlbiA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLnNldEF0dHJpYnV0ZSgnb3BlbicsICdvcGVuJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCIvLyBJRSBGaXhcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGVtcGxhdGUpIHtcclxuICAgIGlmICghKCdjb250ZW50JyBpbiB0ZW1wbGF0ZSkpIHtcclxuICAgICAgICBsZXQgY29udGVudCA9IHRlbXBsYXRlLmNoaWxkTm9kZXM7XHJcbiAgICAgICAgbGV0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbnRlbnQubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoY29udGVudFtqXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0ZW1wbGF0ZS5jb250ZW50ID0gZnJhZ21lbnQ7XHJcbiAgICB9XHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlLFxyXG59O1xyXG5cclxudmFyIHBvbHlmaWxsID0gcmVxdWlyZSgndWkvcG9seWZpbGxzL3RlbXBsYXRlJyk7XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBjbG9uZSBhIHRlbXBsYXRlIGFmdGVyIGFsdGVyaW5nIHRoZSBwcm92aWRlZCBydWxlcy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjdGVtcGxhdGUnLCAnI3RhcmdldCcsIFt7c2VsZWN0b3I6ICdpbnB1dCcsIHZhbHVlOiAnVmFsdWUnfV0pO1xyXG4gKiB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJ3RlbXBsYXRlJywgJ2RpdicsIFt7c2VsZWN0b3I6ICdhJywgcmVtb3ZlOiBbJ2hyZWYnXSwgbXVsdGlwbGU6IHRydWV9XSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZW1wbGF0ZVNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXRTZWxlY3RvclxyXG4gKiBAcGFyYW0ge2FycmF5fSBydWxlcyBmb3JtYXQ6IGFycmF5IG9mIG9iamVjdHNcclxuICogICAgICBlYWNoIG9iamVjdCBtdXN0IGhhdmUgXCJzZWxlY3RvclwiLlxyXG4gKiAgICAgIGVhY2ggb2JqZWN0IGNhbiBoYXZlIFwibXVsdGlwbGVcIiBzZXQgdG8gdXBkYXRlIGFsbCBtYXRjaGluZyBlbGVtZW50cy5cclxuICogICAgICBlYWNoIG9iamVjdCBjYW4gaGF2ZSBcInJlbW92ZVwiIC0gYW4gYXJyYXkgb2YgYXR0cmlidXRlcyB0byByZW1vdmUuXHJcbiAqICAgICAgZWFjaCBvYmplY3QgY2FuIGhhdmUgXCJ0ZXh0XCIgb3IgXCJodG1sXCIgLSBmdXJ0aGVyIGtleXMgd2lsbCBiZSBzZXQgYXMgYXR0cmlidXRlcy5cclxuICogICAgICBpZiBib3RoIHRleHQgYW5kIGh0bWwgYXJlIHNldCwgdGV4dCB3aWxsIHRha2UgcHJlY2VuZGVuY2UuXHJcbiAqICAgICAgcnVsZXMgd2lsbCBiZSBwYXJzZWQgaW4gdGhlIG9yZGVyIHRoYXQgdGhleSBhcmUgcHJlc2VudCBpbiB0aGUgYXJyYXkuXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZENvbnRlbnRGcm9tVGVtcGxhdGUodGVtcGxhdGVTZWxlY3RvciwgdGFyZ2V0U2VsZWN0b3IsIHJ1bGVzID0gW10pIHtcclxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGVtcGxhdGVTZWxlY3Rvcik7XHJcblxyXG4gICAgcG9seWZpbGwodGVtcGxhdGUpO1xyXG5cclxuICAgIHZhciBjb250ZW50ID0gdGVtcGxhdGUuY29udGVudDtcclxuXHJcbiAgICBydWxlcy5mb3JFYWNoKHJ1bGUgPT4gaGFuZGxlUnVsZShjb250ZW50LCBydWxlKSk7XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0YXJnZXRTZWxlY3RvcikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuaW1wb3J0Tm9kZShjb250ZW50LCB0cnVlKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBhcHBseSBydWxlcyB0byB0aGUgdGVtcGxhdGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Tm9kZX0gY29udGVudCAtIHRoZSBjb250ZW50IG9mIHRoZSB0ZW1wbGF0ZS5cclxuICogQHBhcmFtIHtPYmplY3R9IHJ1bGUgLSB0aGUgcnVsZSB0byBhcHBseS5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZVJ1bGUoY29udGVudCwgcnVsZSkge1xyXG4gICAgaWYgKHJ1bGUubXVsdGlwbGUpIHtcclxuICAgICAgICBsZXQgZWxzID0gY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKHJ1bGUuc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICBBcnJheS5mcm9tKGVscylcclxuICAgICAgICAgICAgLmZvckVhY2goZWwgPT4gdXBkYXRlRWxlbWVudChlbCwgcnVsZSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgZWwgPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3IocnVsZS5zZWxlY3Rvcik7XHJcbiAgICAgICAgaWYgKCFlbCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFVuYWJsZSB0byB1cGRhdGUgJHtydWxlLnNlbGVjdG9yfS5gLCBydWxlKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlRWxlbWVudChlbCwgcnVsZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byB1cGRhdGUgYW4gZWxlbWVudCB3aXRoIGEgcnVsZS5cclxuICpcclxuICogQHBhcmFtIHtOb2RlfSBlbCB0aGUgZWxlbWVudCB0byBhcHBseSB0aGUgcnVsZXMgdG8uXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBydWxlIHRoZSBydWxlIG9iamVjdC5cclxuICovXHJcbmZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQoZWwsIHJ1bGUpIHtcclxuICAgIGlmICgndGV4dCcgaW4gcnVsZSkge1xyXG4gICAgICAgIGVsLnRleHRDb250ZW50ID0gcnVsZS50ZXh0O1xyXG4gICAgfSBlbHNlIGlmICgnaHRtbCcgaW4gcnVsZSkge1xyXG4gICAgICAgIGVsLmlubmVySFRNTCA9IHJ1bGUuaHRtbDtcclxuICAgIH1cclxuXHJcbiAgICBPYmplY3Qua2V5cyhydWxlKVxyXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+ICFbJ3NlbGVjdG9yJywgJ3RleHQnLCAnaHRtbCcsICdyZW1vdmUnLCAnbXVsdGlwbGUnXS5pbmNsdWRlcyhrZXkpKVxyXG4gICAgICAgIC5mb3JFYWNoKGtleSA9PiBlbC5zZXRBdHRyaWJ1dGUoa2V5LCBydWxlW2tleV0pKTtcclxuXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShydWxlLnJlbW92ZSkpIHtcclxuICAgICAgICBydWxlLnJlbW92ZS5mb3JFYWNoKGtleSA9PiBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5KSk7XHJcbiAgICB9XHJcbn1cclxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBjb21wYXJlIGFuZCBpc0J1ZmZlciB0YWtlbiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2Jsb2IvNjgwZTllNWU0ODhmMjJhYWMyNzU5OWE1N2RjODQ0YTYzMTU5MjhkZC9pbmRleC5qc1xuLy8gb3JpZ2luYWwgbm90aWNlOlxuXG4vKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5mdW5jdGlvbiBjb21wYXJlKGEsIGIpIHtcbiAgaWYgKGEgPT09IGIpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIHZhciB4ID0gYS5sZW5ndGg7XG4gIHZhciB5ID0gYi5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV07XG4gICAgICB5ID0gYltpXTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuICBpZiAoeSA8IHgpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGlzQnVmZmVyKGIpIHtcbiAgaWYgKGdsb2JhbC5CdWZmZXIgJiYgdHlwZW9mIGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlcihiKTtcbiAgfVxuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKTtcbn1cblxuLy8gYmFzZWQgb24gbm9kZSBhc3NlcnQsIG9yaWdpbmFsIG5vdGljZTpcblxuLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbC8nKTtcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHBTbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBmdW5jdGlvbnNIYXZlTmFtZXMgPSAoZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZnVuY3Rpb24gZm9vKCkge30ubmFtZSA9PT0gJ2Zvbyc7XG59KCkpO1xuZnVuY3Rpb24gcFRvU3RyaW5nIChvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopO1xufVxuZnVuY3Rpb24gaXNWaWV3KGFycmJ1Zikge1xuICBpZiAoaXNCdWZmZXIoYXJyYnVmKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIGdsb2JhbC5BcnJheUJ1ZmZlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyLmlzVmlldyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBBcnJheUJ1ZmZlci5pc1ZpZXcoYXJyYnVmKTtcbiAgfVxuICBpZiAoIWFycmJ1Zikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoYXJyYnVmIGluc3RhbmNlb2YgRGF0YVZpZXcpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpZiAoYXJyYnVmLmJ1ZmZlciAmJiBhcnJidWYuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4vLyAxLiBUaGUgYXNzZXJ0IG1vZHVsZSBwcm92aWRlcyBmdW5jdGlvbnMgdGhhdCB0aHJvd1xuLy8gQXNzZXJ0aW9uRXJyb3IncyB3aGVuIHBhcnRpY3VsYXIgY29uZGl0aW9ucyBhcmUgbm90IG1ldC4gVGhlXG4vLyBhc3NlcnQgbW9kdWxlIG11c3QgY29uZm9ybSB0byB0aGUgZm9sbG93aW5nIGludGVyZmFjZS5cblxudmFyIGFzc2VydCA9IG1vZHVsZS5leHBvcnRzID0gb2s7XG5cbi8vIDIuIFRoZSBBc3NlcnRpb25FcnJvciBpcyBkZWZpbmVkIGluIGFzc2VydC5cbi8vIG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IoeyBtZXNzYWdlOiBtZXNzYWdlLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZCB9KVxuXG52YXIgcmVnZXggPSAvXFxzKmZ1bmN0aW9uXFxzKyhbXlxcKFxcc10qKVxccyovO1xuLy8gYmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2xqaGFyYi9mdW5jdGlvbi5wcm90b3R5cGUubmFtZS9ibG9iL2FkZWVlZWM4YmZjYzYwNjhiMTg3ZDdkOWZiM2Q1YmIxZDNhMzA4OTkvaW1wbGVtZW50YXRpb24uanNcbmZ1bmN0aW9uIGdldE5hbWUoZnVuYykge1xuICBpZiAoIXV0aWwuaXNGdW5jdGlvbihmdW5jKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoZnVuY3Rpb25zSGF2ZU5hbWVzKSB7XG4gICAgcmV0dXJuIGZ1bmMubmFtZTtcbiAgfVxuICB2YXIgc3RyID0gZnVuYy50b1N0cmluZygpO1xuICB2YXIgbWF0Y2ggPSBzdHIubWF0Y2gocmVnZXgpO1xuICByZXR1cm4gbWF0Y2ggJiYgbWF0Y2hbMV07XG59XG5hc3NlcnQuQXNzZXJ0aW9uRXJyb3IgPSBmdW5jdGlvbiBBc3NlcnRpb25FcnJvcihvcHRpb25zKSB7XG4gIHRoaXMubmFtZSA9ICdBc3NlcnRpb25FcnJvcic7XG4gIHRoaXMuYWN0dWFsID0gb3B0aW9ucy5hY3R1YWw7XG4gIHRoaXMuZXhwZWN0ZWQgPSBvcHRpb25zLmV4cGVjdGVkO1xuICB0aGlzLm9wZXJhdG9yID0gb3B0aW9ucy5vcGVyYXRvcjtcbiAgaWYgKG9wdGlvbnMubWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG9wdGlvbnMubWVzc2FnZTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBnZXRNZXNzYWdlKHRoaXMpO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IHRydWU7XG4gIH1cbiAgdmFyIHN0YWNrU3RhcnRGdW5jdGlvbiA9IG9wdGlvbnMuc3RhY2tTdGFydEZ1bmN0aW9uIHx8IGZhaWw7XG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH0gZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gZ2V0TmFtZShzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICAgICAgdmFyIGlkeCA9IG91dC5pbmRleE9mKCdcXG4nICsgZm5fbmFtZSk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgLy8gb25jZSB3ZSBoYXZlIGxvY2F0ZWQgdGhlIGZ1bmN0aW9uIGZyYW1lXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gc3RyaXAgb3V0IGV2ZXJ5dGhpbmcgYmVmb3JlIGl0IChhbmQgaXRzIGxpbmUpXG4gICAgICAgIHZhciBuZXh0X2xpbmUgPSBvdXQuaW5kZXhPZignXFxuJywgaWR4ICsgMSk7XG4gICAgICAgIG91dCA9IG91dC5zdWJzdHJpbmcobmV4dF9saW5lICsgMSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuc3RhY2sgPSBvdXQ7XG4gICAgfVxuICB9XG59O1xuXG4vLyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3IgaW5zdGFuY2VvZiBFcnJvclxudXRpbC5pbmhlcml0cyhhc3NlcnQuQXNzZXJ0aW9uRXJyb3IsIEVycm9yKTtcblxuZnVuY3Rpb24gdHJ1bmNhdGUocywgbikge1xuICBpZiAodHlwZW9mIHMgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHMubGVuZ3RoIDwgbiA/IHMgOiBzLnNsaWNlKDAsIG4pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5mdW5jdGlvbiBpbnNwZWN0KHNvbWV0aGluZykge1xuICBpZiAoZnVuY3Rpb25zSGF2ZU5hbWVzIHx8ICF1dGlsLmlzRnVuY3Rpb24oc29tZXRoaW5nKSkge1xuICAgIHJldHVybiB1dGlsLmluc3BlY3Qoc29tZXRoaW5nKTtcbiAgfVxuICB2YXIgcmF3bmFtZSA9IGdldE5hbWUoc29tZXRoaW5nKTtcbiAgdmFyIG5hbWUgPSByYXduYW1lID8gJzogJyArIHJhd25hbWUgOiAnJztcbiAgcmV0dXJuICdbRnVuY3Rpb24nICsgIG5hbWUgKyAnXSc7XG59XG5mdW5jdGlvbiBnZXRNZXNzYWdlKHNlbGYpIHtcbiAgcmV0dXJuIHRydW5jYXRlKGluc3BlY3Qoc2VsZi5hY3R1YWwpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoaW5zcGVjdChzZWxmLmV4cGVjdGVkKSwgMTI4KTtcbn1cblxuLy8gQXQgcHJlc2VudCBvbmx5IHRoZSB0aHJlZSBrZXlzIG1lbnRpb25lZCBhYm92ZSBhcmUgdXNlZCBhbmRcbi8vIHVuZGVyc3Rvb2QgYnkgdGhlIHNwZWMuIEltcGxlbWVudGF0aW9ucyBvciBzdWIgbW9kdWxlcyBjYW4gcGFzc1xuLy8gb3RoZXIga2V5cyB0byB0aGUgQXNzZXJ0aW9uRXJyb3IncyBjb25zdHJ1Y3RvciAtIHRoZXkgd2lsbCBiZVxuLy8gaWdub3JlZC5cblxuLy8gMy4gQWxsIG9mIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIG11c3QgdGhyb3cgYW4gQXNzZXJ0aW9uRXJyb3Jcbi8vIHdoZW4gYSBjb3JyZXNwb25kaW5nIGNvbmRpdGlvbiBpcyBub3QgbWV0LCB3aXRoIGEgbWVzc2FnZSB0aGF0XG4vLyBtYXkgYmUgdW5kZWZpbmVkIGlmIG5vdCBwcm92aWRlZC4gIEFsbCBhc3NlcnRpb24gbWV0aG9kcyBwcm92aWRlXG4vLyBib3RoIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlcyB0byB0aGUgYXNzZXJ0aW9uIGVycm9yIGZvclxuLy8gZGlzcGxheSBwdXJwb3Nlcy5cblxuZnVuY3Rpb24gZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCBvcGVyYXRvciwgc3RhY2tTdGFydEZ1bmN0aW9uKSB7XG4gIHRocm93IG5ldyBhc3NlcnQuQXNzZXJ0aW9uRXJyb3Ioe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgYWN0dWFsOiBhY3R1YWwsXG4gICAgZXhwZWN0ZWQ6IGV4cGVjdGVkLFxuICAgIG9wZXJhdG9yOiBvcGVyYXRvcixcbiAgICBzdGFja1N0YXJ0RnVuY3Rpb246IHN0YWNrU3RhcnRGdW5jdGlvblxuICB9KTtcbn1cblxuLy8gRVhURU5TSU9OISBhbGxvd3MgZm9yIHdlbGwgYmVoYXZlZCBlcnJvcnMgZGVmaW5lZCBlbHNld2hlcmUuXG5hc3NlcnQuZmFpbCA9IGZhaWw7XG5cbi8vIDQuIFB1cmUgYXNzZXJ0aW9uIHRlc3RzIHdoZXRoZXIgYSB2YWx1ZSBpcyB0cnV0aHksIGFzIGRldGVybWluZWRcbi8vIGJ5ICEhZ3VhcmQuXG4vLyBhc3NlcnQub2soZ3VhcmQsIG1lc3NhZ2Vfb3B0KTtcbi8vIFRoaXMgc3RhdGVtZW50IGlzIGVxdWl2YWxlbnQgdG8gYXNzZXJ0LmVxdWFsKHRydWUsICEhZ3VhcmQsXG4vLyBtZXNzYWdlX29wdCk7LiBUbyB0ZXN0IHN0cmljdGx5IGZvciB0aGUgdmFsdWUgdHJ1ZSwgdXNlXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwodHJ1ZSwgZ3VhcmQsIG1lc3NhZ2Vfb3B0KTsuXG5cbmZ1bmN0aW9uIG9rKHZhbHVlLCBtZXNzYWdlKSB7XG4gIGlmICghdmFsdWUpIGZhaWwodmFsdWUsIHRydWUsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5vayk7XG59XG5hc3NlcnQub2sgPSBvaztcblxuLy8gNS4gVGhlIGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzaGFsbG93LCBjb2VyY2l2ZSBlcXVhbGl0eSB3aXRoXG4vLyA9PS5cbi8vIGFzc2VydC5lcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5lcXVhbCA9IGZ1bmN0aW9uIGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPSBleHBlY3RlZCkgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQuZXF1YWwpO1xufTtcblxuLy8gNi4gVGhlIG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHdoZXRoZXIgdHdvIG9iamVjdHMgYXJlIG5vdCBlcXVhbFxuLy8gd2l0aCAhPSBhc3NlcnQubm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RXF1YWwgPSBmdW5jdGlvbiBub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPScsIGFzc2VydC5ub3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDcuIFRoZSBlcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgYSBkZWVwIGVxdWFsaXR5IHJlbGF0aW9uLlxuLy8gYXNzZXJ0LmRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5kZWVwRXF1YWwgPSBmdW5jdGlvbiBkZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgZmFsc2UpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcEVxdWFsJywgYXNzZXJ0LmRlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmFzc2VydC5kZWVwU3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBkZWVwU3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoIV9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgdHJ1ZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwU3RyaWN0RXF1YWwnLCBhc3NlcnQuZGVlcFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBzdHJpY3QsIG1lbW9zKSB7XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGlzQnVmZmVyKGFjdHVhbCkgJiYgaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGNvbXBhcmUoYWN0dWFsLCBleHBlY3RlZCkgPT09IDA7XG5cbiAgLy8gNy4yLiBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBEYXRlIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBEYXRlIG9iamVjdCB0aGF0IHJlZmVycyB0byB0aGUgc2FtZSB0aW1lLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNEYXRlKGFjdHVhbCkgJiYgdXRpbC5pc0RhdGUoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5nZXRUaW1lKCkgPT09IGV4cGVjdGVkLmdldFRpbWUoKTtcblxuICAvLyA3LjMgSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgUmVnRXhwIG9iamVjdCwgdGhlIGFjdHVhbCB2YWx1ZSBpc1xuICAvLyBlcXVpdmFsZW50IGlmIGl0IGlzIGFsc28gYSBSZWdFeHAgb2JqZWN0IHdpdGggdGhlIHNhbWUgc291cmNlIGFuZFxuICAvLyBwcm9wZXJ0aWVzIChgZ2xvYmFsYCwgYG11bHRpbGluZWAsIGBsYXN0SW5kZXhgLCBgaWdub3JlQ2FzZWApLlxuICB9IGVsc2UgaWYgKHV0aWwuaXNSZWdFeHAoYWN0dWFsKSAmJiB1dGlsLmlzUmVnRXhwKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuc291cmNlID09PSBleHBlY3RlZC5zb3VyY2UgJiZcbiAgICAgICAgICAgYWN0dWFsLmdsb2JhbCA9PT0gZXhwZWN0ZWQuZ2xvYmFsICYmXG4gICAgICAgICAgIGFjdHVhbC5tdWx0aWxpbmUgPT09IGV4cGVjdGVkLm11bHRpbGluZSAmJlxuICAgICAgICAgICBhY3R1YWwubGFzdEluZGV4ID09PSBleHBlY3RlZC5sYXN0SW5kZXggJiZcbiAgICAgICAgICAgYWN0dWFsLmlnbm9yZUNhc2UgPT09IGV4cGVjdGVkLmlnbm9yZUNhc2U7XG5cbiAgLy8gNy40LiBPdGhlciBwYWlycyB0aGF0IGRvIG5vdCBib3RoIHBhc3MgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnLFxuICAvLyBlcXVpdmFsZW5jZSBpcyBkZXRlcm1pbmVkIGJ5ID09LlxuICB9IGVsc2UgaWYgKChhY3R1YWwgPT09IG51bGwgfHwgdHlwZW9mIGFjdHVhbCAhPT0gJ29iamVjdCcpICYmXG4gICAgICAgICAgICAgKGV4cGVjdGVkID09PSBudWxsIHx8IHR5cGVvZiBleHBlY3RlZCAhPT0gJ29iamVjdCcpKSB7XG4gICAgcmV0dXJuIHN0cmljdCA/IGFjdHVhbCA9PT0gZXhwZWN0ZWQgOiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gSWYgYm90aCB2YWx1ZXMgYXJlIGluc3RhbmNlcyBvZiB0eXBlZCBhcnJheXMsIHdyYXAgdGhlaXIgdW5kZXJseWluZ1xuICAvLyBBcnJheUJ1ZmZlcnMgaW4gYSBCdWZmZXIgZWFjaCB0byBpbmNyZWFzZSBwZXJmb3JtYW5jZVxuICAvLyBUaGlzIG9wdGltaXphdGlvbiByZXF1aXJlcyB0aGUgYXJyYXlzIHRvIGhhdmUgdGhlIHNhbWUgdHlwZSBhcyBjaGVja2VkIGJ5XG4gIC8vIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcgKGFrYSBwVG9TdHJpbmcpLiBOZXZlciBwZXJmb3JtIGJpbmFyeVxuICAvLyBjb21wYXJpc29ucyBmb3IgRmxvYXQqQXJyYXlzLCB0aG91Z2gsIHNpbmNlIGUuZy4gKzAgPT09IC0wIGJ1dCB0aGVpclxuICAvLyBiaXQgcGF0dGVybnMgYXJlIG5vdCBpZGVudGljYWwuXG4gIH0gZWxzZSBpZiAoaXNWaWV3KGFjdHVhbCkgJiYgaXNWaWV3KGV4cGVjdGVkKSAmJlxuICAgICAgICAgICAgIHBUb1N0cmluZyhhY3R1YWwpID09PSBwVG9TdHJpbmcoZXhwZWN0ZWQpICYmXG4gICAgICAgICAgICAgIShhY3R1YWwgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkgfHxcbiAgICAgICAgICAgICAgIGFjdHVhbCBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkpIHtcbiAgICByZXR1cm4gY29tcGFyZShuZXcgVWludDhBcnJheShhY3R1YWwuYnVmZmVyKSxcbiAgICAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheShleHBlY3RlZC5idWZmZXIpKSA9PT0gMDtcblxuICAvLyA3LjUgRm9yIGFsbCBvdGhlciBPYmplY3QgcGFpcnMsIGluY2x1ZGluZyBBcnJheSBvYmplY3RzLCBlcXVpdmFsZW5jZSBpc1xuICAvLyBkZXRlcm1pbmVkIGJ5IGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoYXMgdmVyaWZpZWRcbiAgLy8gd2l0aCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwpLCB0aGUgc2FtZSBzZXQgb2Yga2V5c1xuICAvLyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSwgZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5XG4gIC8vIGNvcnJlc3BvbmRpbmcga2V5LCBhbmQgYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LiBOb3RlOiB0aGlzXG4gIC8vIGFjY291bnRzIGZvciBib3RoIG5hbWVkIGFuZCBpbmRleGVkIHByb3BlcnRpZXMgb24gQXJyYXlzLlxuICB9IGVsc2UgaWYgKGlzQnVmZmVyKGFjdHVhbCkgIT09IGlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBtZW1vcyA9IG1lbW9zIHx8IHthY3R1YWw6IFtdLCBleHBlY3RlZDogW119O1xuXG4gICAgdmFyIGFjdHVhbEluZGV4ID0gbWVtb3MuYWN0dWFsLmluZGV4T2YoYWN0dWFsKTtcbiAgICBpZiAoYWN0dWFsSW5kZXggIT09IC0xKSB7XG4gICAgICBpZiAoYWN0dWFsSW5kZXggPT09IG1lbW9zLmV4cGVjdGVkLmluZGV4T2YoZXhwZWN0ZWQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIG1lbW9zLmFjdHVhbC5wdXNoKGFjdHVhbCk7XG4gICAgbWVtb3MuZXhwZWN0ZWQucHVzaChleHBlY3RlZCk7XG5cbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCwgc3RyaWN0LCBtZW1vcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYiwgc3RyaWN0LCBhY3R1YWxWaXNpdGVkT2JqZWN0cykge1xuICBpZiAoYSA9PT0gbnVsbCB8fCBhID09PSB1bmRlZmluZWQgfHwgYiA9PT0gbnVsbCB8fCBiID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvLyBpZiBvbmUgaXMgYSBwcmltaXRpdmUsIHRoZSBvdGhlciBtdXN0IGJlIHNhbWVcbiAgaWYgKHV0aWwuaXNQcmltaXRpdmUoYSkgfHwgdXRpbC5pc1ByaW1pdGl2ZShiKSlcbiAgICByZXR1cm4gYSA9PT0gYjtcbiAgaWYgKHN0cmljdCAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYSkgIT09IE9iamVjdC5nZXRQcm90b3R5cGVPZihiKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIHZhciBhSXNBcmdzID0gaXNBcmd1bWVudHMoYSk7XG4gIHZhciBiSXNBcmdzID0gaXNBcmd1bWVudHMoYik7XG4gIGlmICgoYUlzQXJncyAmJiAhYklzQXJncykgfHwgKCFhSXNBcmdzICYmIGJJc0FyZ3MpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgaWYgKGFJc0FyZ3MpIHtcbiAgICBhID0gcFNsaWNlLmNhbGwoYSk7XG4gICAgYiA9IHBTbGljZS5jYWxsKGIpO1xuICAgIHJldHVybiBfZGVlcEVxdWFsKGEsIGIsIHN0cmljdCk7XG4gIH1cbiAgdmFyIGthID0gb2JqZWN0S2V5cyhhKTtcbiAgdmFyIGtiID0gb2JqZWN0S2V5cyhiKTtcbiAgdmFyIGtleSwgaTtcbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT09IGtiW2ldKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vZXF1aXZhbGVudCB2YWx1ZXMgZm9yIGV2ZXJ5IGNvcnJlc3BvbmRpbmcga2V5LCBhbmRcbiAgLy9+fn5wb3NzaWJseSBleHBlbnNpdmUgZGVlcCB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAga2V5ID0ga2FbaV07XG4gICAgaWYgKCFfZGVlcEVxdWFsKGFba2V5XSwgYltrZXldLCBzdHJpY3QsIGFjdHVhbFZpc2l0ZWRPYmplY3RzKSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIGZhbHNlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBFcXVhbCcsIGFzc2VydC5ub3REZWVwRXF1YWwpO1xuICB9XG59O1xuXG5hc3NlcnQubm90RGVlcFN0cmljdEVxdWFsID0gbm90RGVlcFN0cmljdEVxdWFsO1xuZnVuY3Rpb24gbm90RGVlcFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgdHJ1ZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwU3RyaWN0RXF1YWwnLCBub3REZWVwU3RyaWN0RXF1YWwpO1xuICB9XG59XG5cblxuLy8gOS4gVGhlIHN0cmljdCBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc3RyaWN0IGVxdWFsaXR5LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbi8vIGFzc2VydC5zdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5zdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIHN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PT0nLCBhc3NlcnQuc3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG4vLyAxMC4gVGhlIHN0cmljdCBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciBzdHJpY3QgaW5lcXVhbGl0eSwgYXNcbi8vIGRldGVybWluZWQgYnkgIT09LiAgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdFN0cmljdEVxdWFsID0gZnVuY3Rpb24gbm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9PScsIGFzc2VydC5ub3RTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgaWYgKCFhY3R1YWwgfHwgIWV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChleHBlY3RlZCkgPT0gJ1tvYmplY3QgUmVnRXhwXScpIHtcbiAgICByZXR1cm4gZXhwZWN0ZWQudGVzdChhY3R1YWwpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBpZiAoYWN0dWFsIGluc3RhbmNlb2YgZXhwZWN0ZWQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIElnbm9yZS4gIFRoZSBpbnN0YW5jZW9mIGNoZWNrIGRvZXNuJ3Qgd29yayBmb3IgYXJyb3cgZnVuY3Rpb25zLlxuICB9XG5cbiAgaWYgKEVycm9yLmlzUHJvdG90eXBlT2YoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWU7XG59XG5cbmZ1bmN0aW9uIF90cnlCbG9jayhibG9jaykge1xuICB2YXIgZXJyb3I7XG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGVycm9yID0gZTtcbiAgfVxuICByZXR1cm4gZXJyb3I7XG59XG5cbmZ1bmN0aW9uIF90aHJvd3Moc2hvdWxkVGhyb3csIGJsb2NrLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICB2YXIgYWN0dWFsO1xuXG4gIGlmICh0eXBlb2YgYmxvY2sgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJsb2NrXCIgYXJndW1lbnQgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gIH1cblxuICBpZiAodHlwZW9mIGV4cGVjdGVkID09PSAnc3RyaW5nJykge1xuICAgIG1lc3NhZ2UgPSBleHBlY3RlZDtcbiAgICBleHBlY3RlZCA9IG51bGw7XG4gIH1cblxuICBhY3R1YWwgPSBfdHJ5QmxvY2soYmxvY2spO1xuXG4gIG1lc3NhZ2UgPSAoZXhwZWN0ZWQgJiYgZXhwZWN0ZWQubmFtZSA/ICcgKCcgKyBleHBlY3RlZC5uYW1lICsgJykuJyA6ICcuJykgK1xuICAgICAgICAgICAgKG1lc3NhZ2UgPyAnICcgKyBtZXNzYWdlIDogJy4nKTtcblxuICBpZiAoc2hvdWxkVGhyb3cgJiYgIWFjdHVhbCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ01pc3NpbmcgZXhwZWN0ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgdmFyIHVzZXJQcm92aWRlZE1lc3NhZ2UgPSB0eXBlb2YgbWVzc2FnZSA9PT0gJ3N0cmluZyc7XG4gIHZhciBpc1Vud2FudGVkRXhjZXB0aW9uID0gIXNob3VsZFRocm93ICYmIHV0aWwuaXNFcnJvcihhY3R1YWwpO1xuICB2YXIgaXNVbmV4cGVjdGVkRXhjZXB0aW9uID0gIXNob3VsZFRocm93ICYmIGFjdHVhbCAmJiAhZXhwZWN0ZWQ7XG5cbiAgaWYgKChpc1Vud2FudGVkRXhjZXB0aW9uICYmXG4gICAgICB1c2VyUHJvdmlkZWRNZXNzYWdlICYmXG4gICAgICBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHxcbiAgICAgIGlzVW5leHBlY3RlZEV4Y2VwdGlvbikge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgJ0dvdCB1bndhbnRlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICBpZiAoKHNob3VsZFRocm93ICYmIGFjdHVhbCAmJiBleHBlY3RlZCAmJlxuICAgICAgIWV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fCAoIXNob3VsZFRocm93ICYmIGFjdHVhbCkpIHtcbiAgICB0aHJvdyBhY3R1YWw7XG4gIH1cbn1cblxuLy8gMTEuIEV4cGVjdGVkIHRvIHRocm93IGFuIGVycm9yOlxuLy8gYXNzZXJ0LnRocm93cyhibG9jaywgRXJyb3Jfb3B0LCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC50aHJvd3MgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cyh0cnVlLCBibG9jaywgZXJyb3IsIG1lc3NhZ2UpO1xufTtcblxuLy8gRVhURU5TSU9OISBUaGlzIGlzIGFubm95aW5nIHRvIHdyaXRlIG91dHNpZGUgdGhpcyBtb2R1bGUuXG5hc3NlcnQuZG9lc05vdFRocm93ID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MoZmFsc2UsIGJsb2NrLCBlcnJvciwgbWVzc2FnZSk7XG59O1xuXG5hc3NlcnQuaWZFcnJvciA9IGZ1bmN0aW9uKGVycikgeyBpZiAoZXJyKSB0aHJvdyBlcnI7IH07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwiLypnbG9iYWwgd2luZG93LCBnbG9iYWwqL1xudmFyIHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKVxudmFyIGFzc2VydCA9IHJlcXVpcmUoXCJhc3NlcnRcIilcbnZhciBub3cgPSByZXF1aXJlKFwiZGF0ZS1ub3dcIilcblxudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlXG52YXIgY29uc29sZVxudmFyIHRpbWVzID0ge31cblxuaWYgKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgJiYgZ2xvYmFsLmNvbnNvbGUpIHtcbiAgICBjb25zb2xlID0gZ2xvYmFsLmNvbnNvbGVcbn0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiAmJiB3aW5kb3cuY29uc29sZSkge1xuICAgIGNvbnNvbGUgPSB3aW5kb3cuY29uc29sZVxufSBlbHNlIHtcbiAgICBjb25zb2xlID0ge31cbn1cblxudmFyIGZ1bmN0aW9ucyA9IFtcbiAgICBbbG9nLCBcImxvZ1wiXSxcbiAgICBbaW5mbywgXCJpbmZvXCJdLFxuICAgIFt3YXJuLCBcIndhcm5cIl0sXG4gICAgW2Vycm9yLCBcImVycm9yXCJdLFxuICAgIFt0aW1lLCBcInRpbWVcIl0sXG4gICAgW3RpbWVFbmQsIFwidGltZUVuZFwiXSxcbiAgICBbdHJhY2UsIFwidHJhY2VcIl0sXG4gICAgW2RpciwgXCJkaXJcIl0sXG4gICAgW2NvbnNvbGVBc3NlcnQsIFwiYXNzZXJ0XCJdXG5dXG5cbmZvciAodmFyIGkgPSAwOyBpIDwgZnVuY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHR1cGxlID0gZnVuY3Rpb25zW2ldXG4gICAgdmFyIGYgPSB0dXBsZVswXVxuICAgIHZhciBuYW1lID0gdHVwbGVbMV1cblxuICAgIGlmICghY29uc29sZVtuYW1lXSkge1xuICAgICAgICBjb25zb2xlW25hbWVdID0gZlxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb25zb2xlXG5cbmZ1bmN0aW9uIGxvZygpIHt9XG5cbmZ1bmN0aW9uIGluZm8oKSB7XG4gICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKVxufVxuXG5mdW5jdGlvbiB3YXJuKCkge1xuICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cylcbn1cblxuZnVuY3Rpb24gZXJyb3IoKSB7XG4gICAgY29uc29sZS53YXJuLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cylcbn1cblxuZnVuY3Rpb24gdGltZShsYWJlbCkge1xuICAgIHRpbWVzW2xhYmVsXSA9IG5vdygpXG59XG5cbmZ1bmN0aW9uIHRpbWVFbmQobGFiZWwpIHtcbiAgICB2YXIgdGltZSA9IHRpbWVzW2xhYmVsXVxuICAgIGlmICghdGltZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBzdWNoIGxhYmVsOiBcIiArIGxhYmVsKVxuICAgIH1cblxuICAgIHZhciBkdXJhdGlvbiA9IG5vdygpIC0gdGltZVxuICAgIGNvbnNvbGUubG9nKGxhYmVsICsgXCI6IFwiICsgZHVyYXRpb24gKyBcIm1zXCIpXG59XG5cbmZ1bmN0aW9uIHRyYWNlKCkge1xuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKVxuICAgIGVyci5uYW1lID0gXCJUcmFjZVwiXG4gICAgZXJyLm1lc3NhZ2UgPSB1dGlsLmZvcm1hdC5hcHBseShudWxsLCBhcmd1bWVudHMpXG4gICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2spXG59XG5cbmZ1bmN0aW9uIGRpcihvYmplY3QpIHtcbiAgICBjb25zb2xlLmxvZyh1dGlsLmluc3BlY3Qob2JqZWN0KSArIFwiXFxuXCIpXG59XG5cbmZ1bmN0aW9uIGNvbnNvbGVBc3NlcnQoZXhwcmVzc2lvbikge1xuICAgIGlmICghZXhwcmVzc2lvbikge1xuICAgICAgICB2YXIgYXJyID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXG4gICAgICAgIGFzc2VydC5vayhmYWxzZSwgdXRpbC5mb3JtYXQuYXBwbHkobnVsbCwgYXJyKSlcbiAgICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IG5vd1xuXG5mdW5jdGlvbiBub3coKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpXG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIl19
