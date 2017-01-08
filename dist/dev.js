(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const bot = require('app/bot');
const bot_console = require('app/console');
const ui = require('app/ui');
const storage = require('app/libraries/storage');
const ajax = require('app/libraries/ajax');
const api = require('app/libraries/blockheads');
const world = require('app/libraries/world');
const hook = require('app/libraries/hook');

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
 * @return {MessageBotExtension} - The extension variable.
 */
function MessageBotExtension(namespace) {
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
    var el = document.createElement('script');
    el.src = `//blockheadsfans.com/messagebot/extension/${id}/code/raw`;
    el.crossOrigin = 'anonymous';
    document.head.appendChild(el);
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

},{"app/bot":3,"app/console":7,"app/libraries/ajax":9,"app/libraries/blockheads":11,"app/libraries/hook":12,"app/libraries/storage":13,"app/libraries/world":14,"app/ui":26}],2:[function(require,module,exports){
/**
 * @file Depricated. Use world.is[Group] instead.
 */

module.exports = {
    checkGroup
};

const world = require('app/libraries/world');


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

},{"app/libraries/world":14}],3:[function(require,module,exports){
const storage = require('app/libraries/storage');

const bot = Object.assign(
    module.exports,
    require('./send'),
    require('./checkGroup')
);

bot.version = '6.1.0a';

/**
 * @depricated since 6.1.0. Use ex.world instead.
 */
bot.world = require('app/libraries/world');

storage.set('mb_version', bot.version);

},{"./checkGroup":2,"./send":5,"app/libraries/storage":13,"app/libraries/world":14}],4:[function(require,module,exports){
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
//No break statements as we want to execute all updates after matched version.
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
        setTimeout(function() {
            window.botui.alert("Due to a bug in the 6.0.0 version of the bot, your join and leave messages may be swapped. Sorry! This cannot be fixed automatically. This message will not be shown again.");
        }, 1000);
        break; //Next bugfix only relates to 6.0.1 / 6.0.2.
    case '6.0.1':
    case '6.0.2':
        setTimeout(function() {
            window.botui.alert("Due to a bug in 6.0.1 / 6.0.2, groups may have been mixed up on Join, Leave, and Trigger messages. Sorry! This cannot be fixed automatically if it occured on your bot. Announcements have also been fixed.");
        }, 1000);
    case '6.0.3':
    case '6.0.4':
    case '6.0.5':
}
//jshint +W086

},{}],5:[function(require,module,exports){
var api = require('app/libraries/blockheads');
var settings = require('app/settings');

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

},{"app/libraries/blockheads":11,"app/settings":23}],6:[function(require,module,exports){
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
(function (__dirname){
const self = module.exports = require('./exports');

const hook = require('app/libraries/hook');
const world = require('app/libraries/world');
const send = require('app/bot').send;
const ui = require('app/ui');
const fs = require('fs');


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
    fs.readFileSync(__dirname + '/style.css') +
    '</style>' +
    fs.readFileSync(__dirname + '/tab.html');


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

}).call(this,"/node_modules\\app\\console")

},{"./exports":6,"app/bot":3,"app/libraries/hook":12,"app/libraries/world":14,"app/ui":26,"fs":35}],8:[function(require,module,exports){
(function (__dirname){
const bhfansapi = require('app/libraries/bhfansapi');
const ui = require('app/ui');
const hook = require('app/libraries/hook');
const MessageBotExtension = require('app/MessageBotExtension');
const fs = require('fs');

var tab = ui.addTab('Extensions');
tab.innerHTML = '<style>' +
    fs.readFileSync(__dirname + '/style.css') +
    '</style>' +
    fs.readFileSync(__dirname + '/tab.html');

//Create the extension store page
bhfansapi.getStore().then(resp => {
    if (resp.status != 'ok') {
        document.getElementById('exts').innerHTML += resp.message;
        throw new Error(resp.message);
    }
    resp.extensions.forEach(extension => {
        ui.buildContentFromTemplate('#extTemplate', '#exts', [
            {selector: 'h4', text: extension.title},
            {selector: 'span', html: extension.snippet},
            {selector: 'div', 'data-id': extension.id},
            {selector: 'button', text: MessageBotExtension.isLoaded(extension.id) ? 'Remove' : 'Install'}
        ]);
    });
}).catch(bhfansapi.reportError);

// Install / uninstall extensions
document.querySelector('#exts')
    .addEventListener('click', function extActions(e) {
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


hook.on('extension.install', function(id) {
    // Show remove to let users remove extensions
    var button = document.querySelector(`#mb_extensions [data-id="${id}"] button`);
    if (button) {
        button.textContent = 'Remove';
    }
});

hook.on('extension.uninstall', function(id) {
    // Show removed for store install button
    var button = document.querySelector(`#mb_extensions [data-id="${id}"] button`);
    if (button) {
        button.textContent = 'Removed';
        button.disabled = true;
        setTimeout(() => {
            button.textContent = 'Install';
            button.disabled = false;
        }, 3000);
    }
});

}).call(this,"/node_modules\\app\\extensions")

},{"app/MessageBotExtension":1,"app/libraries/bhfansapi":10,"app/libraries/hook":12,"app/ui":26,"fs":35}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
/**
 * @file Contains functions to interact with blockheadsfans.com - cannot be used by extensions.
 */

const hook = require('app/libraries/hook');
const ajax = require('app/libraries/ajax');

const API_URLS = {
    STORE: '//blockheadsfans.com/messagebot/extension/store',
    NAME: '//blockheadsfans.com/messagebot/extension/name',
    ERROR: '//blockheadsfans.com/messagebot/bot/error',
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

    return ajax.postJSON(API_URLS.NAME, {id}).then(name => {
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

},{"app/libraries/ajax":9,"app/libraries/hook":12}],11:[function(require,module,exports){
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

},{"./ajax":9,"./bhfansapi":10,"./hook":12}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"./blockheads":11,"./hook":12,"./storage":13}],15:[function(require,module,exports){
(function (__dirname){
const ui = require('app/ui');
const storage = require('app/libraries/storage');
const send = require('app/bot').send;
const preferences = require('app/settings');
const fs = require('fs');

var tab = ui.addTab('Announcements', 'messages');
tab.innerHTML = fs.readFileSync(__dirname + '/tab.html');

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

}).call(this,"/dev\\messages\\announcements")

},{"app/bot":3,"app/libraries/storage":13,"app/settings":23,"app/ui":26,"fs":35}],16:[function(require,module,exports){
module.exports = {
    buildAndSendMessage,
    buildMessage,
};

const world = require('app/libraries/world');
const send = require('app/bot').send;

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

},{"app/bot":3,"app/libraries/world":14}],17:[function(require,module,exports){
module.exports = {
    checkJoinsAndGroup,
    checkJoins,
    checkGroup,
};

const world = require('app/libraries/world');


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

},{"app/libraries/world":14}],18:[function(require,module,exports){
Object.assign(
    module.exports,
    require('./buildMessage'),
    require('./checkJoinsAndGroup')
);

},{"./buildMessage":16,"./checkJoinsAndGroup":17}],19:[function(require,module,exports){
(function (__dirname){
const ui = require('app/ui');
const fs = require('fs');

var el = document.createElement('style');
el.innerHTML = fs.readFileSync(__dirname + '/style.css');
document.head.appendChild(el);

ui.addTabGroup('Messages', 'messages');

[
    require('./join'),
    require('./leave'),
    require('./trigger'),
    require('./announcements')
].forEach(type => {
    type.tab.addEventListener('click', function checkDelete(event) {
        if (event.target.tagName != 'A') {
            return;
        }

        ui.alert('Really delete this message?', [
            {text: 'Yes', style: 'danger', action: function() {
                event.target.parentNode.remove();
                type.save();
            }},
            {text: 'Cancel'}
        ]);
    });

    type.tab.addEventListener('change', type.save);

    type.tab.querySelector('.top-right-button')
        .addEventListener('click', () => type.addMessage());

    // Don't start responding to chat for 10 seconds
    setTimeout(type.start, 10000);
});

}).call(this,"/node_modules\\app\\messages")

},{"./announcements":15,"./join":20,"./leave":21,"./trigger":22,"app/ui":26,"fs":35}],20:[function(require,module,exports){
(function (__dirname){
const ui = require('app/ui');

const storage = require('app/libraries/storage');
const hook = require('app/libraries/hook');
const helpers = require('app/messages/helpers');
const fs = require('fs');

const STORAGE_ID = 'joinArr';

var tab = ui.addTab('Join', 'messages');
tab.innerHTML = fs.readFileSync(__dirname + '/tab.html');

module.exports = {
    tab,
    save,
    addMessage,
    start: () => hook.on('world.join', onJoin),
};

var joinMessages = storage.getObject(STORAGE_ID, []);
joinMessages.forEach(addMessage);

/**
 * Function to add a trigger message to the page.
 */
function addMessage(msg = {}) {
    ui.buildContentFromTemplate('#jTemplate', '#jMsgs', [
        {selector: 'option', remove: ['selected'], multiple: true},
        {selector: '.m', text: msg.message || ''},
        {selector: '[data-target="joins_low"]', value: msg.joins_low || 0},
        {selector: '[data-target="joins_high"]', value: msg.joins_high || 9999},
        {selector: `[data-target="group"] [value="${msg.group || 'All'}"]`, selected: 'selected'},
        {selector: `[data-target="not_group"] [value="${msg.not_group || 'Nobody'}"]`, selected: 'selected'}
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

}).call(this,"/dev\\messages\\join")

},{"app/libraries/hook":12,"app/libraries/storage":13,"app/messages/helpers":18,"app/ui":26,"fs":35}],21:[function(require,module,exports){
(function (__dirname){
const ui = require('app/ui');

const storage = require('app/libraries/storage');
const hook = require('app/libraries/hook');
const helpers = require('app/messages/helpers');
const fs = require('fs');

const STORAGE_ID = 'leaveArr';

var tab = ui.addTab('Leave', 'messages');
tab.innerHTML = fs.readFileSync(__dirname + '/tab.html');

module.exports = {
    tab,
    save,
    addMessage,
    start: () => hook.on('world.leave', onLeave),
};

var leaveMessages = storage.getObject(STORAGE_ID, []);
leaveMessages.forEach(addMessage);

/**
 * Adds a leave message to the page.
 */
function addMessage(msg = {}) {
    ui.buildContentFromTemplate('#lTemplate', '#lMsgs', [
        {selector: 'option', remove: ['selected'], multiple: true},
        {selector: '.m', text: msg.message || ''},
        {selector: '[data-target="joins_low"]', value: msg.joins_low || 0},
        {selector: '[data-target="joins_high"]', value: msg.joins_high || 9999},
        {selector: `[data-target="group"] [value="${msg.group || 'All'}"]`, selected: 'selected'},
        {selector: `[data-target="not_group"] [value="${msg.not_group || 'Nobody'}"]`, selected: 'selected'}
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

}).call(this,"/dev\\messages\\leave")

},{"app/libraries/hook":12,"app/libraries/storage":13,"app/messages/helpers":18,"app/ui":26,"fs":35}],22:[function(require,module,exports){
(function (__dirname){
const ui = require('app/ui');

const storage = require('app/libraries/storage');
const hook = require('app/libraries/hook');
const helpers = require('app/messages/helpers');
const settings = require('app/settings');
const fs = require('fs');

const STORAGE_ID = 'triggerArr';

var tab = ui.addTab('Trigger', 'messages');
tab.innerHTML = fs.readFileSync(__dirname + '/tab.html');

module.exports = {
    tab,
    save,
    addMessage,
    start: () => hook.on('world.message', checkTriggers),
};

var triggerMessages = storage.getObject(STORAGE_ID, []);
triggerMessages.forEach(addMessage);

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
        {selector: `[data-target="group"] [value="${msg.group || 'All'}"]`, selected: 'selected'},
        {selector: `[data-target="not_group"] [value="${msg.not_group || 'Nobody'}"]`, selected: 'selected'}
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

}).call(this,"/dev\\messages\\trigger")

},{"app/libraries/hook":12,"app/libraries/storage":13,"app/messages/helpers":18,"app/settings":23,"app/ui":26,"fs":35}],23:[function(require,module,exports){
const storage = require('app/libraries/storage');
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
    module.exports = new Proxy(prefs, {
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

var prefsMap = [
    {type: 'number', key: 'announcementDelay', default: 10},
    {type: 'number', key: 'maxResponses', default: 2},
    {type: 'boolean', key: 'notify', default: true},
    // Advanced
    {type: 'boolean', key: 'disableTrim', default: false},
    {type: 'boolean', key: 'regexTriggers', default: false},
    {type: 'boolean', key: 'splitMessages', default: false},
    {type: 'text', key: 'splitToken', default: '<split>'},
];

prefsMap.forEach(pref => {
    // Set defaults if not set
    if (typeof prefs[pref.key] !=  pref.type) {
        prefs[pref.key] = pref.default;
    }
});

},{"app/libraries/storage":13}],24:[function(require,module,exports){
(function (__dirname){
const ui = require('app/ui');
const prefs = require('app/settings');
const fs = require('fs');

var tab = ui.addTab('Settings');
tab.innerHTML = '<style>' +
    fs.readFileSync(__dirname + '/style.css') +
    '</style>' +
    fs.readFileSync(__dirname + '/tab.html');

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
    ui.alert(`Copy this to a safe place:<br><textarea style="width: calc(100% - 7px);height:160px;">${backup}</textarea>`);
});


// Load backup
tab.querySelector('#mb_backup_load').addEventListener('click', function loadBackup() {
    ui.alert('Enter the backup code:<textarea style="width:calc(100% - 7px);height:160px;"></textarea>',
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

}).call(this,"/node_modules\\app\\settings")

},{"app/settings":23,"app/ui":26,"fs":35}],25:[function(require,module,exports){
// Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

// Overwrite the old page
document.body.innerHTML = '';
// Style reset
document.querySelectorAll('[type="text/css"]')
    .forEach(el => el.remove());

document.querySelector('title').textContent = 'Console - MessageBot';

// Set the icon to the blockhead icon used on the forums
var el = document.createElement('link');
el.rel = 'icon';
el.href = 'https://is.gd/MBvUHF';
document.head.appendChild(el);

require('app/ui/polyfills/console');
require('app/bot/migration');

// Expose the extension API
window.MessageBotExtension = require('app/MessageBotExtension');

const bhfansapi = require('app/libraries/bhfansapi');
const hook = require('app/libraries/hook');
const ui = require('app/ui');
hook.on('error_report', function(msg) {
    ui.notify(msg);
});


require('app/console');
// By default no tab is selected, show the console.
document.querySelector('#leftNav span').click();
require('app/messages');
require('app/extensions');
require('app/settings/page');

// Error reporting
window.addEventListener('error', (err) => {
    if (err.message != 'Script error') {
        bhfansapi.reportError(err);
    }
});

},{"app/MessageBotExtension":1,"app/bot/migration":4,"app/console":7,"app/extensions":8,"app/libraries/bhfansapi":10,"app/libraries/hook":12,"app/messages":19,"app/settings/page":24,"app/ui":26,"app/ui/polyfills/console":31}],26:[function(require,module,exports){
require('./polyfills/details');

// Build the API
Object.assign(
    module.exports,
    require('./layout'),
    require('./template'),
    require('./notifications')
);

// Functions which are no longer contained in this module, but are retained for now for backward compatability.
const write = require('app/console/exports').write;
module.exports.addMessageToConsole = function(msg, name = '', nameClass = '') {
    console.warn('ui.addMessageToConsole has been depricated. Use ex.console.write instead.');
    write(msg, name, nameClass);
};

},{"./layout":27,"./notifications":29,"./polyfills/details":32,"./template":34,"app/console/exports":6}],27:[function(require,module,exports){
(function (__dirname){
/**
 * @file Contains functions for managing the page layout
 */

const fs = require('fs');

// Build page - only case in which body.innerHTML should be used.
document.body.innerHTML += fs.readFileSync(__dirname + '/layout.html');
document.head.innerHTML += '<style>' + fs.readFileSync(__dirname + '/style.css') + '</style>';

// Hide the menu when clicking the overlay
document.querySelector('#leftNav .overlay').addEventListener('click', toggleMenu);

// Change tabs
document.querySelector('#leftNav').addEventListener('click', function globalTabChange(event) {
    var tabName = event.target.dataset.tabName;
    if(!tabName) {
        return;
    }

    //Content
    //We can't just remove the first due to browser lag
    Array.from(document.querySelectorAll('#container > .visible'))
        .forEach(el => el.classList.remove('visible'));
    document.querySelector(`#container > [data-tab-name=${tabName}]`).classList.add('visible');

    //Tabs
    Array.from(document.querySelectorAll('#leftNav .selected'))
        .forEach(el => el.classList.remove('selected'));
    event.target.classList.add('selected');
});


module.exports = {
    toggleMenu,
    addTab,
    removeTab,
    addTabGroup,
    removeTabGroup,
};


/**
 * Function used to show/hide the menu.
 *
 * @example
 * toggleMenu();
 */
function toggleMenu() {
    var mainToggle = document.querySelector('#leftNav input');
    mainToggle.checked = !mainToggle.checked;
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
    tab.classList.add('tab');
    tab.dataset.tabName = tabName;

    var tabContent = document.createElement('div');
    tabContent.dataset.tabName = tabName;

    document.querySelector(`#leftNav [data-tab-group=${groupName}]`).appendChild(tab);
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
    document.querySelector(`#leftNav [data-tab-name=${tabContent.dataset.tabName}]`).remove();
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
 */
function addTabGroup(text, groupName) {
    var details = document.createElement('details');
    details.dataset.tabGroup = groupName;

    var summary = document.createElement('summary');
    summary.textContent = text;
    details.appendChild(summary);

    document.querySelector('#leftNav [data-tab-group=main]').appendChild(details);
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
    var group = document.querySelector(`#leftNav [data-tab-group="${groupName}"]`);
    var items = Array.from(group.querySelectorAll('span'));

    items.forEach(item => {
        //Tab content
        document.querySelector(`#container > [data-tab-name="${item.dataset.tabName}"]`).remove();
    });

    group.remove();
}

}).call(this,"/dev\\ui\\layout")

},{"fs":35}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
(function (__dirname){
const fs = require('fs');

Object.assign(
    module.exports,
    require('./alert'),
    require('./notify')
);

var el = document.createElement('style');
el.innerHTML = fs.readFileSync(__dirname + '/style.css');
document.head.appendChild(el);

el = document.createElement('div');
el.id = 'alertWrapper';
el.innerHTML = fs.readFileSync(__dirname + '/notifications.html');

document.body.appendChild(el);

}).call(this,"/dev\\ui\\notifications")

},{"./alert":28,"./notify":30,"fs":35}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
//IE doesn't like console.log unless dev tools are open.
if (!window.console) {
    window.console = {};
    window.log = window.log || [];
    console.log = function(...args) {
        window.log.push(args);
    };
}
['info', 'error', 'warn', 'assert'].forEach(method => {
    if (!console[method]) {
        console[method] = console.log;
    }
});

},{}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){
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

},{}],34:[function(require,module,exports){
module.exports = {
    buildContentFromTemplate,
};

var polyfill = require('app/ui/polyfills/template');

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

},{"app/ui/polyfills/template":33}],35:[function(require,module,exports){

},{}]},{},[25])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvTWVzc2FnZUJvdEV4dGVuc2lvbi5qcyIsImRldi9ib3QvY2hlY2tHcm91cC5qcyIsImRldi9ib3QvaW5kZXguanMiLCJkZXYvYm90L21pZ3JhdGlvbi5qcyIsImRldi9ib3Qvc2VuZC5qcyIsImRldi9jb25zb2xlL2V4cG9ydHMuanMiLCJkZXZcXGNvbnNvbGVcXG5vZGVfbW9kdWxlc1xcYXBwXFxjb25zb2xlXFxpbmRleC5qcyIsImRldlxcZXh0ZW5zaW9uc1xcbm9kZV9tb2R1bGVzXFxhcHBcXGV4dGVuc2lvbnNcXGluZGV4LmpzIiwiZGV2L2xpYnJhcmllcy9hamF4LmpzIiwiZGV2L2xpYnJhcmllcy9iaGZhbnNhcGkuanMiLCJkZXYvbGlicmFyaWVzL2Jsb2NraGVhZHMuanMiLCJkZXYvbGlicmFyaWVzL2hvb2suanMiLCJkZXYvbGlicmFyaWVzL3N0b3JhZ2UuanMiLCJkZXYvbGlicmFyaWVzL3dvcmxkLmpzIiwiZGV2L21lc3NhZ2VzL2Fubm91bmNlbWVudHMvaW5kZXguanMiLCJkZXYvbWVzc2FnZXMvaGVscGVycy9idWlsZE1lc3NhZ2UuanMiLCJkZXYvbWVzc2FnZXMvaGVscGVycy9jaGVja0pvaW5zQW5kR3JvdXAuanMiLCJkZXYvbWVzc2FnZXMvaGVscGVycy9pbmRleC5qcyIsImRldlxcbWVzc2FnZXNcXG5vZGVfbW9kdWxlc1xcYXBwXFxtZXNzYWdlc1xcaW5kZXguanMiLCJkZXYvbWVzc2FnZXMvam9pbi9pbmRleC5qcyIsImRldi9tZXNzYWdlcy9sZWF2ZS9pbmRleC5qcyIsImRldi9tZXNzYWdlcy90cmlnZ2VyL2luZGV4LmpzIiwiZGV2L3NldHRpbmdzL2luZGV4LmpzIiwiZGV2XFxzZXR0aW5nc1xcbm9kZV9tb2R1bGVzXFxhcHBcXHNldHRpbmdzXFxwYWdlLmpzIiwiZGV2L3N0YXJ0LmpzIiwiZGV2L3VpL2luZGV4LmpzIiwiZGV2L3VpL2xheW91dC9pbmRleC5qcyIsImRldi91aS9ub3RpZmljYXRpb25zL2FsZXJ0LmpzIiwiZGV2L3VpL25vdGlmaWNhdGlvbnMvaW5kZXguanMiLCJkZXYvdWkvbm90aWZpY2F0aW9ucy9ub3RpZnkuanMiLCJkZXYvdWkvcG9seWZpbGxzL2NvbnNvbGUuanMiLCJkZXYvdWkvcG9seWZpbGxzL2RldGFpbHMuanMiLCJkZXYvdWkvcG9seWZpbGxzL3RlbXBsYXRlLmpzIiwiZGV2L3VpL3RlbXBsYXRlLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbGliL19lbXB0eS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1WUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgYm90ID0gcmVxdWlyZSgnYXBwL2JvdCcpO1xyXG5jb25zdCBib3RfY29uc29sZSA9IHJlcXVpcmUoJ2FwcC9jb25zb2xlJyk7XHJcbmNvbnN0IHVpID0gcmVxdWlyZSgnYXBwL3VpJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgYWpheCA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvYWpheCcpO1xyXG5jb25zdCBhcGkgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL2Jsb2NraGVhZHMnKTtcclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL3dvcmxkJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL2hvb2snKTtcclxuXHJcbi8vIEFycmF5IG9mIElEcyB0byBhdXRvbG9hZCBhdCB0aGUgbmV4dCBsYXVuY2guXHJcbnZhciBhdXRvbG9hZCA9IFtdO1xyXG52YXIgbG9hZGVkID0gW107XHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnbWJfZXh0ZW5zaW9ucyc7XHJcblxyXG5cclxuLyoqXHJcbiAqIFVzZWQgdG8gY3JlYXRlIGEgbmV3IGV4dGVuc2lvbi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHRlc3QgPSBNZXNzYWdlQm90RXh0ZW5zaW9uKCd0ZXN0Jyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lc3BhY2UgLSBTaG91bGQgYmUgdGhlIHNhbWUgYXMgeW91ciB2YXJpYWJsZSBuYW1lLlxyXG4gKiBAcmV0dXJuIHtNZXNzYWdlQm90RXh0ZW5zaW9ufSAtIFRoZSBleHRlbnNpb24gdmFyaWFibGUuXHJcbiAqL1xyXG5mdW5jdGlvbiBNZXNzYWdlQm90RXh0ZW5zaW9uKG5hbWVzcGFjZSkge1xyXG4gICAgbG9hZGVkLnB1c2gobmFtZXNwYWNlKTtcclxuICAgIGhvb2suZmlyZSgnZXh0ZW5zaW9uLmluc3RhbGwnLCBuYW1lc3BhY2UpO1xyXG5cclxuICAgIHZhciBleHRlbnNpb24gPSB7XHJcbiAgICAgICAgaWQ6IG5hbWVzcGFjZSxcclxuICAgICAgICBib3QsXHJcbiAgICAgICAgY29uc29sZTogYm90X2NvbnNvbGUsXHJcbiAgICAgICAgdWksXHJcbiAgICAgICAgc3RvcmFnZSxcclxuICAgICAgICBhamF4LFxyXG4gICAgICAgIGFwaSxcclxuICAgICAgICB3b3JsZCxcclxuICAgICAgICBob29rLFxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVzZWQgdG8gY2hhbmdlIHdoZXRoZXIgb3Igbm90IHRoZSBleHRlbnNpb24gd2lsbCBiZVxyXG4gICAgICogQXV0b21hdGljYWxseSBsb2FkZWQgdGhlIG5leHQgdGltZSB0aGUgYm90IGlzIGxhdW5jaGVkLlxyXG4gICAgICpcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiB2YXIgdGVzdCA9IE1lc3NhZ2VCb3RFeHRlbnNpb24oJ3Rlc3QnKTtcclxuICAgICAqIHRlc3Quc2V0QXV0b0xhdW5jaCh0cnVlKTtcclxuICAgICAqIEBwYXJhbSB7Ym9vbH0gc2hvdWxkQXV0b2xvYWRcclxuICAgICAqL1xyXG4gICAgZXh0ZW5zaW9uLnNldEF1dG9MYXVuY2ggPSBmdW5jdGlvbiBzZXRBdXRvTGF1bmNoKHNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgaWYgKCFhdXRvbG9hZC5pbmNsdWRlcyhuYW1lc3BhY2UpICYmIHNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgICAgIGF1dG9sb2FkLnB1c2gobmFtZXNwYWNlKTtcclxuICAgICAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgYXV0b2xvYWQsIGZhbHNlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKCFzaG91bGRBdXRvbG9hZCkge1xyXG4gICAgICAgICAgICBpZiAoYXV0b2xvYWQuaW5jbHVkZXMobmFtZXNwYWNlKSkge1xyXG4gICAgICAgICAgICAgICAgYXV0b2xvYWQuc3BsaWNlKGF1dG9sb2FkLmluZGV4T2YobmFtZXNwYWNlKSwgMSk7XHJcbiAgICAgICAgICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBhdXRvbG9hZCwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZXh0ZW5zaW9uO1xyXG59XHJcblxyXG4vKipcclxuICogVHJpZXMgdG8gbG9hZCB0aGUgcmVxdWVzdGVkIGV4dGVuc2lvbiBieSBJRC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAqL1xyXG5NZXNzYWdlQm90RXh0ZW5zaW9uLmluc3RhbGwgPSBmdW5jdGlvbiBpbnN0YWxsKGlkKSB7XHJcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcclxuICAgIGVsLnNyYyA9IGAvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2V4dGVuc2lvbi8ke2lkfS9jb2RlL3Jhd2A7XHJcbiAgICBlbC5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xyXG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVW5pbnN0YWxscyBhbiBleHRlbnNpb24uXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxyXG4gKi9cclxuTWVzc2FnZUJvdEV4dGVuc2lvbi51bmluc3RhbGwgPSBmdW5jdGlvbiB1bmluc3RhbGwoaWQpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2luZG93W2lkXS51bmluc3RhbGwoKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAvL05vdCBpbnN0YWxsZWQsIG9yIG5vIHVuaW5zdGFsbCBmdW5jdGlvbi5cclxuICAgIH1cclxuXHJcbiAgICB3aW5kb3dbaWRdID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIGlmIChhdXRvbG9hZC5pbmNsdWRlcyhpZCkpIHtcclxuICAgICAgICBhdXRvbG9hZC5zcGxpY2UoYXV0b2xvYWQuaW5kZXhPZihpZCksIDEpO1xyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGF1dG9sb2FkLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGxvYWRlZC5pbmNsdWRlcyhpZCkpIHtcclxuICAgICAgICBsb2FkZWQuc3BsaWNlKGxvYWRlZC5pbmRleE9mKGlkKSwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5maXJlKCdleHRlbnNpb24udW5pbnN0YWxsJywgaWQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVzZWQgdG8gY2hlY2sgaWYgYW4gZXh0ZW5zaW9uIGhhcyBiZWVuIGxvYWRlZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5NZXNzYWdlQm90RXh0ZW5zaW9uLmlzTG9hZGVkID0gZnVuY3Rpb24gaXNMb2FkZWQoaWQpIHtcclxuICAgIHJldHVybiBsb2FkZWQuaW5jbHVkZXMoaWQpO1xyXG59O1xyXG5cclxuLy8gTG9hZCBleHRlbnNpb25zIHRoYXQgc2V0IHRoZW1zZWx2ZXMgdG8gYXV0b2xvYWQgbGFzdCBsYXVuY2guXHJcbnN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdLCBmYWxzZSlcclxuICAgIC5mb3JFYWNoKE1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lc3NhZ2VCb3RFeHRlbnNpb247XHJcbiIsIi8qKlxyXG4gKiBAZmlsZSBEZXByaWNhdGVkLiBVc2Ugd29ybGQuaXNbR3JvdXBdIGluc3RlYWQuXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjaGVja0dyb3VwXHJcbn07XHJcblxyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvd29ybGQnKTtcclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBjaGVjayBpZiB1c2VycyBhcmUgaW4gZGVmaW5lZCBncm91cHMuXHJcbiAqXHJcbiAqIEBkZXByaWNhdGVkXHJcbiAqIEBleGFtcGxlXHJcbiAqIGNoZWNrR3JvdXAoJ2FkbWluJywgJ1NFUlZFUicpIC8vIHRydWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwIHRoZSBncm91cCB0byBjaGVja1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdXNlciB0byBjaGVja1xyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tHcm91cChncm91cCwgbmFtZSkge1xyXG4gICAgY29uc29sZS53YXJuKCdib3QuY2hlY2tHcm91cCBpcyBkZXByaWNhdGVkLiBVc2Ugd29ybGQuaXNBZG1pbiwgd29ybGQuaXNNb2QsIGV0Yy4gaW5zdGVhZCcpO1xyXG5cclxuICAgIG5hbWUgPSBuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICBzd2l0Y2ggKGdyb3VwLnRvTG9jYWxlTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICBjYXNlICdhbGwnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNQbGF5ZXIobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnYWRtaW4nOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNBZG1pbihuYW1lKTtcclxuICAgICAgICBjYXNlICdtb2QnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNNb2QobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnc3RhZmYnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNTdGFmZihuYW1lKTtcclxuICAgICAgICBjYXNlICdvd25lcic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc093bmVyKG5hbWUpO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG4iLCJjb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnYXBwL2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcblxyXG5jb25zdCBib3QgPSBPYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL3NlbmQnKSxcclxuICAgIHJlcXVpcmUoJy4vY2hlY2tHcm91cCcpXHJcbik7XHJcblxyXG5ib3QudmVyc2lvbiA9ICc2LjEuMGEnO1xyXG5cclxuLyoqXHJcbiAqIEBkZXByaWNhdGVkIHNpbmNlIDYuMS4wLiBVc2UgZXgud29ybGQgaW5zdGVhZC5cclxuICovXHJcbmJvdC53b3JsZCA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvd29ybGQnKTtcclxuXHJcbnN0b3JhZ2Uuc2V0KCdtYl92ZXJzaW9uJywgYm90LnZlcnNpb24pO1xyXG4iLCJmdW5jdGlvbiB1cGRhdGUoa2V5cywgb3BlcmF0b3IpIHtcclxuICAgIE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSkuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgb2Yga2V5cykge1xyXG4gICAgICAgICAgICBpZiAoaXRlbS5zdGFydHNXaXRoKGtleSkpIHtcclxuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGl0ZW0sIG9wZXJhdG9yKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGl0ZW0pKSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG4vL2pzaGludCAtVzA4NlxyXG4vL05vIGJyZWFrIHN0YXRlbWVudHMgYXMgd2Ugd2FudCB0byBleGVjdXRlIGFsbCB1cGRhdGVzIGFmdGVyIG1hdGNoZWQgdmVyc2lvbi5cclxuc3dpdGNoIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnbWJfdmVyc2lvbicpKSB7XHJcbiAgICBjYXNlIG51bGw6XHJcbiAgICAgICAgYnJlYWs7IC8vTm90aGluZyB0byBtaWdyYXRlXHJcbiAgICBjYXNlICc1LjIuMCc6XHJcbiAgICBjYXNlICc1LjIuMSc6XHJcbiAgICAgICAgLy9XaXRoIDYuMCwgbmV3bGluZXMgYXJlIGRpcmVjdGx5IHN1cHBvcnRlZCBpbiBtZXNzYWdlcyBieSB0aGUgYm90LlxyXG4gICAgICAgIHVwZGF0ZShbJ2Fubm91bmNlbWVudEFycicsICdqb2luQXJyJywgJ2xlYXZlQXJyJywgJ3RyaWdnZXJBcnInXSwgZnVuY3Rpb24ocmF3KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VkID0gSlNPTi5wYXJzZShyYXcpO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobXNnLm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbXNnLm1lc3NhZ2UgPSBtc2cubWVzc2FnZS5yZXBsYWNlKC9cXFxcbi9nLCAnXFxuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocGFyc2VkKTtcclxuICAgICAgICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYnJlYWs7IC8vTmV4dCBidWdmaXggb25seSByZWxhdGVzIHRvIDYuMCBib3QuXHJcbiAgICBjYXNlICc2LjAuMGEnOlxyXG4gICAgY2FzZSAnNi4wLjAnOlxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5ib3R1aS5hbGVydChcIkR1ZSB0byBhIGJ1ZyBpbiB0aGUgNi4wLjAgdmVyc2lvbiBvZiB0aGUgYm90LCB5b3VyIGpvaW4gYW5kIGxlYXZlIG1lc3NhZ2VzIG1heSBiZSBzd2FwcGVkLiBTb3JyeSEgVGhpcyBjYW5ub3QgYmUgZml4ZWQgYXV0b21hdGljYWxseS4gVGhpcyBtZXNzYWdlIHdpbGwgbm90IGJlIHNob3duIGFnYWluLlwiKTtcclxuICAgICAgICB9LCAxMDAwKTtcclxuICAgICAgICBicmVhazsgLy9OZXh0IGJ1Z2ZpeCBvbmx5IHJlbGF0ZXMgdG8gNi4wLjEgLyA2LjAuMi5cclxuICAgIGNhc2UgJzYuMC4xJzpcclxuICAgIGNhc2UgJzYuMC4yJzpcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB3aW5kb3cuYm90dWkuYWxlcnQoXCJEdWUgdG8gYSBidWcgaW4gNi4wLjEgLyA2LjAuMiwgZ3JvdXBzIG1heSBoYXZlIGJlZW4gbWl4ZWQgdXAgb24gSm9pbiwgTGVhdmUsIGFuZCBUcmlnZ2VyIG1lc3NhZ2VzLiBTb3JyeSEgVGhpcyBjYW5ub3QgYmUgZml4ZWQgYXV0b21hdGljYWxseSBpZiBpdCBvY2N1cmVkIG9uIHlvdXIgYm90LiBBbm5vdW5jZW1lbnRzIGhhdmUgYWxzbyBiZWVuIGZpeGVkLlwiKTtcclxuICAgICAgICB9LCAxMDAwKTtcclxuICAgIGNhc2UgJzYuMC4zJzpcclxuICAgIGNhc2UgJzYuMC40JzpcclxuICAgIGNhc2UgJzYuMC41JzpcclxufVxyXG4vL2pzaGludCArVzA4NlxyXG4iLCJ2YXIgYXBpID0gcmVxdWlyZSgnYXBwL2xpYnJhcmllcy9ibG9ja2hlYWRzJyk7XHJcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJ2FwcC9zZXR0aW5ncycpO1xyXG5cclxudmFyIHF1ZXVlID0gW107XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNlbmQsXHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBxdWV1ZSBhIG1lc3NhZ2UgdG8gYmUgc2VudC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2VuZCgnSGVsbG8hJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIGJlIHNlbnQuXHJcbiAqL1xyXG5mdW5jdGlvbiBzZW5kKG1lc3NhZ2UpIHtcclxuICAgIGlmIChzZXR0aW5ncy5zcGxpdE1lc3NhZ2VzKSB7XHJcbiAgICAgICAgLy9GSVhNRTogSWYgdGhlIGJhY2tzbGFzaCBiZWZvcmUgdGhlIHRva2VuIGlzIGVzY2FwZWQgYnkgYW5vdGhlciBiYWNrc2xhc2ggdGhlIHRva2VuIHNob3VsZCBzdGlsbCBzcGxpdCB0aGUgbWVzc2FnZS5cclxuICAgICAgICBsZXQgc3RyID0gbWVzc2FnZS5zcGxpdChzZXR0aW5ncy5zcGxpdFRva2VuKTtcclxuICAgICAgICBsZXQgdG9TZW5kID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBjdXJyID0gc3RyW2ldO1xyXG4gICAgICAgICAgICBpZiAoY3VycltjdXJyLmxlbmd0aCAtIDFdID09ICdcXFxcJyAmJiBpIDwgc3RyLmxlbmd0aCArIDEpIHtcclxuICAgICAgICAgICAgICAgIGN1cnIgKz0gc2V0dGluZ3Muc3BsaXRUb2tlbiArIHN0clsrK2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRvU2VuZC5wdXNoKGN1cnIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TZW5kLmZvckVhY2gobXNnID0+IHF1ZXVlLnB1c2gobXNnKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHF1ZXVlLnB1c2gobWVzc2FnZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBXYXRjaGVzIHRoZSBxdWV1ZSBmb3IgbmV3IG1lc3NhZ2VzIHRvIHNlbmQgYW5kIHNlbmRzIHRoZW0gYXMgc29vbiBhcyBwb3NzaWJsZS5cclxuICovXHJcbihmdW5jdGlvbiBjaGVja1F1ZXVlKCkge1xyXG4gICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrUXVldWUsIDUwMCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGFwaS5zZW5kKHF1ZXVlLnNoaWZ0KCkpXHJcbiAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrUXVldWUsIDEwMDApO1xyXG4gICAgICAgIH0pO1xyXG59KCkpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHdyaXRlLFxyXG4gICAgY2xlYXJcclxufTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlKG1zZywgbmFtZSA9ICcnLCBuYW1lQ2xhc3MgPSAnJykge1xyXG4gICAgdmFyIG1zZ0VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgIGlmIChuYW1lQ2xhc3MpIHtcclxuICAgICAgICBtc2dFbC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgbmFtZUNsYXNzKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbmFtZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgbmFtZUVsLnRleHRDb250ZW50ID0gbmFtZTtcclxuXHJcbiAgICB2YXIgY29udGVudEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgaWYgKG5hbWUpIHtcclxuICAgICAgICBjb250ZW50RWwudGV4dENvbnRlbnQgPSBgOiAke21zZ31gO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjb250ZW50RWwudGV4dENvbnRlbnQgPSBtc2c7XHJcbiAgICB9XHJcbiAgICBtc2dFbC5hcHBlbmRDaGlsZChuYW1lRWwpO1xyXG4gICAgbXNnRWwuYXBwZW5kQ2hpbGQoY29udGVudEVsKTtcclxuXHJcbiAgICB2YXIgY2hhdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIHVsJyk7XHJcbiAgICBjaGF0LmFwcGVuZENoaWxkKG1zZ0VsKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xlYXIoKSB7XHJcbiAgICB2YXIgY2hhdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIHVsJyk7XHJcbiAgICBjaGF0LmlubmVySFRNTCA9ICcnO1xyXG59XHJcbiIsImNvbnN0IHNlbGYgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZXhwb3J0cycpO1xyXG5cclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvd29ybGQnKTtcclxuY29uc3Qgc2VuZCA9IHJlcXVpcmUoJ2FwcC9ib3QnKS5zZW5kO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ2FwcC91aScpO1xyXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcblxyXG5cclxuLy8gVE9ETzogUGFyc2UgdGhlc2UgYW5kIHByb3ZpZGUgb3B0aW9ucyB0byBzaG93L2hpZGUgZGlmZmVyZW50IG9uZXMuXHJcbmhvb2sub24oJ3dvcmxkLm90aGVyJywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgc2VsZi53cml0ZShtZXNzYWdlLCB1bmRlZmluZWQsICdvdGhlcicpO1xyXG59KTtcclxuXHJcbmhvb2sub24oJ3dvcmxkLm1lc3NhZ2UnLCBmdW5jdGlvbihuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICBsZXQgbXNnQ2xhc3MgPSAncGxheWVyJztcclxuICAgIGlmICh3b3JsZC5pc1N0YWZmKG5hbWUpKSB7XHJcbiAgICAgICAgbXNnQ2xhc3MgPSAnc3RhZmYnO1xyXG4gICAgICAgIGlmICh3b3JsZC5pc01vZChuYW1lKSkge1xyXG4gICAgICAgICAgICBtc2dDbGFzcyArPSAnIG1vZCc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy9IYXMgdG8gYmUgYWRtaW5cclxuICAgICAgICAgICAgbXNnQ2xhc3MgKz0gJyBhZG1pbic7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpKSB7XHJcbiAgICAgICAgbXNnQ2xhc3MgKz0gJyBjb21tYW5kJztcclxuICAgIH1cclxuICAgIHNlbGYud3JpdGUobWVzc2FnZSwgbmFtZSwgbXNnQ2xhc3MpO1xyXG59KTtcclxuXHJcbmhvb2sub24oJ3dvcmxkLnNlcnZlcmNoYXQnLCBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICBzZWxmLndyaXRlKG1lc3NhZ2UsICdTRVJWRVInLCAnYWRtaW4nKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5zZW5kJywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpKSB7XHJcbiAgICAgICAgc2VsZi53cml0ZShtZXNzYWdlLCAnU0VSVkVSJywgJ2FkbWluIGNvbW1hbmQnKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vL01lc3NhZ2UgaGFuZGxlcnNcclxuaG9vay5vbignd29ybGQuam9pbicsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckpvaW4obmFtZSwgaXApIHtcclxuICAgIHNlbGYud3JpdGUoYCR7bmFtZX0gKCR7aXB9KSBoYXMgam9pbmVkIHRoZSBzZXJ2ZXJgLCAnU0VSVkVSJywgJ2pvaW4gd29ybGQgYWRtaW4nKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5sZWF2ZScsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckxlYXZlKG5hbWUpIHtcclxuICAgIHNlbGYud3JpdGUoYCR7bmFtZX0gaGFzIGxlZnQgdGhlIHNlcnZlcmAsICdTRVJWRVInLCBgbGVhdmUgd29ybGQgYWRtaW5gKTtcclxufSk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignQ29uc29sZScpO1xyXG4vLyBPcmRlciBpcyBpbXBvcnRhbnQgaGVyZS5cclxuXHJcbnRhYi5pbm5lckhUTUwgPSAnPHN0eWxlPicgK1xyXG4gICAgZnMucmVhZEZpbGVTeW5jKF9fZGlybmFtZSArICcvc3R5bGUuY3NzJykgK1xyXG4gICAgJzwvc3R5bGU+JyArXHJcbiAgICBmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgJy90YWIuaHRtbCcpO1xyXG5cclxuXHJcbi8vIEF1dG8gc2Nyb2xsIHdoZW4gbmV3IG1lc3NhZ2VzIGFyZSBhZGRlZCB0byB0aGUgcGFnZSwgdW5sZXNzIHRoZSBvd25lciBpcyByZWFkaW5nIG9sZCBjaGF0LlxyXG4obmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gc2hvd05ld0NoYXQoKSB7XHJcbiAgICBsZXQgY29udGFpbmVyID0gdGFiLnF1ZXJ5U2VsZWN0b3IoJ3VsJyk7XHJcbiAgICBsZXQgbGFzdExpbmUgPSB0YWIucXVlcnlTZWxlY3RvcignbGk6bGFzdC1jaGlsZCcpO1xyXG5cclxuICAgIGlmICghY29udGFpbmVyIHx8ICFsYXN0TGluZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY29udGFpbmVyLnNjcm9sbEhlaWdodCAtIGNvbnRhaW5lci5jbGllbnRIZWlnaHQgLSBjb250YWluZXIuc2Nyb2xsVG9wIDw9IGxhc3RMaW5lLmNsaWVudEhlaWdodCAqIDIpIHtcclxuICAgICAgICBsYXN0TGluZS5zY3JvbGxJbnRvVmlldyhmYWxzZSk7XHJcbiAgICB9XHJcbn0pKS5vYnNlcnZlKHRhYi5xdWVyeVNlbGVjdG9yKCcuY2hhdCcpLCB7Y2hpbGRMaXN0OiB0cnVlfSk7XHJcblxyXG5cclxuLy8gUmVtb3ZlIG9sZCBjaGF0IHRvIHJlZHVjZSBtZW1vcnkgdXNhZ2VcclxuKG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIHJlbW92ZU9sZENoYXQoKSB7XHJcbiAgICB2YXIgY2hhdCA9IHRhYi5xdWVyeVNlbGVjdG9yKCd1bCcpO1xyXG5cclxuICAgIHdoaWxlIChjaGF0LmNoaWxkcmVuLmxlbmd0aCA+IDUwMCkge1xyXG4gICAgICAgIGNoYXQuY2hpbGRyZW5bMF0ucmVtb3ZlKCk7XHJcbiAgICB9XHJcbn0pKS5vYnNlcnZlKHRhYi5xdWVyeVNlbGVjdG9yKCcuY2hhdCcpLCB7Y2hpbGRMaXN0OiB0cnVlfSk7XHJcblxyXG4vLyBMaXN0ZW4gZm9yIHRoZSB1c2VyIHRvIHNlbmQgbWVzc2FnZXNcclxuZnVuY3Rpb24gdXNlclNlbmQoKSB7XHJcbiAgICB2YXIgaW5wdXQgPSB0YWIucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcclxuICAgIGhvb2suZmlyZSgnY29uc29sZS5zZW5kJywgaW5wdXQudmFsdWUpO1xyXG4gICAgc2VuZChpbnB1dC52YWx1ZSk7XHJcbiAgICBpbnB1dC52YWx1ZSA9ICcnO1xyXG4gICAgaW5wdXQuZm9jdXMoKTtcclxufVxyXG5cclxudGFiLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0JykuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICBpZiAoZXZlbnQua2V5ID09IFwiRW50ZXJcIiB8fCBldmVudC5rZXlDb2RlID09IDEzKSB7XHJcbiAgICAgICAgdXNlclNlbmQoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG50YWIucXVlcnlTZWxlY3RvcignYnV0dG9uJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB1c2VyU2VuZCk7XHJcbiIsImNvbnN0IGJoZmFuc2FwaSA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvYmhmYW5zYXBpJyk7XHJcbmNvbnN0IHVpID0gcmVxdWlyZSgnYXBwL3VpJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgTWVzc2FnZUJvdEV4dGVuc2lvbiA9IHJlcXVpcmUoJ2FwcC9NZXNzYWdlQm90RXh0ZW5zaW9uJyk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0V4dGVuc2lvbnMnKTtcclxudGFiLmlubmVySFRNTCA9ICc8c3R5bGU+JyArXHJcbiAgICBmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgJy9zdHlsZS5jc3MnKSArXHJcbiAgICAnPC9zdHlsZT4nICtcclxuICAgIGZzLnJlYWRGaWxlU3luYyhfX2Rpcm5hbWUgKyAnL3RhYi5odG1sJyk7XHJcblxyXG4vL0NyZWF0ZSB0aGUgZXh0ZW5zaW9uIHN0b3JlIHBhZ2VcclxuYmhmYW5zYXBpLmdldFN0b3JlKCkudGhlbihyZXNwID0+IHtcclxuICAgIGlmIChyZXNwLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V4dHMnKS5pbm5lckhUTUwgKz0gcmVzcC5tZXNzYWdlO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gICAgcmVzcC5leHRlbnNpb25zLmZvckVhY2goZXh0ZW5zaW9uID0+IHtcclxuICAgICAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNleHRUZW1wbGF0ZScsICcjZXh0cycsIFtcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnaDQnLCB0ZXh0OiBleHRlbnNpb24udGl0bGV9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdzcGFuJywgaHRtbDogZXh0ZW5zaW9uLnNuaXBwZXR9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdkaXYnLCAnZGF0YS1pZCc6IGV4dGVuc2lvbi5pZH0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ2J1dHRvbicsIHRleHQ6IE1lc3NhZ2VCb3RFeHRlbnNpb24uaXNMb2FkZWQoZXh0ZW5zaW9uLmlkKSA/ICdSZW1vdmUnIDogJ0luc3RhbGwnfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcbn0pLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcik7XHJcblxyXG4vLyBJbnN0YWxsIC8gdW5pbnN0YWxsIGV4dGVuc2lvbnNcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2V4dHMnKVxyXG4gICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gZXh0QWN0aW9ucyhlKSB7XHJcbiAgICAgICAgaWYgKGUudGFyZ2V0LnRhZ05hbWUgIT0gJ0JVVFRPTicpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZWwgPSBlLnRhcmdldDtcclxuICAgICAgICB2YXIgaWQgPSBlbC5wYXJlbnRFbGVtZW50LmRhdGFzZXQuaWQ7XHJcblxyXG4gICAgICAgIGlmIChlbC50ZXh0Q29udGVudCA9PSAnSW5zdGFsbCcpIHtcclxuICAgICAgICAgICAgTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsKGlkKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBNZXNzYWdlQm90RXh0ZW5zaW9uLnVuaW5zdGFsbChpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG5cclxuaG9vay5vbignZXh0ZW5zaW9uLmluc3RhbGwnLCBmdW5jdGlvbihpZCkge1xyXG4gICAgLy8gU2hvdyByZW1vdmUgdG8gbGV0IHVzZXJzIHJlbW92ZSBleHRlbnNpb25zXHJcbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI21iX2V4dGVuc2lvbnMgW2RhdGEtaWQ9XCIke2lkfVwiXSBidXR0b25gKTtcclxuICAgIGlmIChidXR0b24pIHtcclxuICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnUmVtb3ZlJztcclxuICAgIH1cclxufSk7XHJcblxyXG5ob29rLm9uKCdleHRlbnNpb24udW5pbnN0YWxsJywgZnVuY3Rpb24oaWQpIHtcclxuICAgIC8vIFNob3cgcmVtb3ZlZCBmb3Igc3RvcmUgaW5zdGFsbCBidXR0b25cclxuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbWJfZXh0ZW5zaW9ucyBbZGF0YS1pZD1cIiR7aWR9XCJdIGJ1dHRvbmApO1xyXG4gICAgaWYgKGJ1dHRvbikge1xyXG4gICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICdSZW1vdmVkJztcclxuICAgICAgICBidXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnSW5zdGFsbCc7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIH0sIDMwMDApO1xyXG4gICAgfVxyXG59KTtcclxuIiwiLy9UT0RPOiBVc2UgZmV0Y2hcclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIEdFVCBhIHBhZ2UuIFBhc3NlcyB0aGUgcmVzcG9uc2Ugb2YgdGhlIFhIUiBpbiB0aGUgcmVzb2x2ZSBwcm9taXNlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL3NlbmRzIGEgR0VUIHJlcXVlc3QgdG8gL3NvbWUvdXJsLnBocD9hPXRlc3RcclxuICogZ2V0KCcvc29tZS91cmwucGhwJywge2E6ICd0ZXN0J30pLnRoZW4oY29uc29sZS5sb2cpXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1N0clxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0KHVybCA9ICcvJywgcGFyYW1zID0ge30pIHtcclxuICAgIGlmIChPYmplY3Qua2V5cyhwYXJhbXMpLmxlbmd0aCkge1xyXG4gICAgICAgIHZhciBhZGRpdGlvbiA9IHVybFN0cmluZ2lmeShwYXJhbXMpO1xyXG4gICAgICAgIGlmICh1cmwuaW5jbHVkZXMoJz8nKSkge1xyXG4gICAgICAgICAgICB1cmwgKz0gYCYke2FkZGl0aW9ufWA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdXJsICs9IGA/JHthZGRpdGlvbn1gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geGhyKCdHRVQnLCB1cmwsIHt9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgSlNPTiBvYmplY3QgaW4gdGhlIHByb21pc2UgcmVzb2x2ZSBtZXRob2QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtT2JqXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRKU09OKHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIGdldCh1cmwsIHBhcmFtT2JqKS50aGVuKEpTT04ucGFyc2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIG1ha2UgYSBwb3N0IHJlcXVlc3RcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW1PYmpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHBvc3QodXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4geGhyKCdQT1NUJywgdXJsLCBwYXJhbU9iaik7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gZmV0Y2ggSlNPTiBmcm9tIGEgcGFnZSB0aHJvdWdoIHBvc3QuXHJcbiAqXHJcbiAqIEBwYXJhbSBzdHJpbmcgdXJsXHJcbiAqIEBwYXJhbSBzdHJpbmcgcGFyYW1PYmpcclxuICogQHJldHVybiBQcm9taXNlXHJcbiAqL1xyXG5mdW5jdGlvbiBwb3N0SlNPTih1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiBwb3N0KHVybCwgcGFyYW1PYmopLnRoZW4oSlNPTi5wYXJzZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuKiBIZWxwZXIgZnVuY3Rpb24gdG8gbWFrZSBYSFIgcmVxdWVzdHMsIGlmIHBvc3NpYmxlIHVzZSB0aGUgZ2V0IGFuZCBwb3N0IGZ1bmN0aW9ucyBpbnN0ZWFkLlxyXG4qXHJcbiogQGRlcHJpY2F0ZWQgc2luY2UgdmVyc2lvbiA2LjFcclxuKiBAcGFyYW0gc3RyaW5nIHByb3RvY29sXHJcbiogQHBhcmFtIHN0cmluZyB1cmxcclxuKiBAcGFyYW0gb2JqZWN0IHBhcmFtT2JqIC0tIFdBUk5JTkcuIE9ubHkgYWNjZXB0cyBzaGFsbG93IG9iamVjdHMuXHJcbiogQHJldHVybiBQcm9taXNlXHJcbiovXHJcbmZ1bmN0aW9uIHhocihwcm90b2NvbCwgdXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICB2YXIgcGFyYW1TdHIgPSB1cmxTdHJpbmdpZnkocGFyYW1PYmopO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIHZhciByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICByZXEub3Blbihwcm90b2NvbCwgdXJsKTtcclxuICAgICAgICByZXEuc2V0UmVxdWVzdEhlYWRlcignWC1SZXF1ZXN0ZWQtV2l0aCcsICdYTUxIdHRwUmVxdWVzdCcpO1xyXG4gICAgICAgIGlmIChwcm90b2NvbCA9PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgcmVxLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlcS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcS5zdGF0dXNUZXh0KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIEhhbmRsZSBuZXR3b3JrIGVycm9yc1xyXG4gICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJlamVjdChFcnJvcihcIk5ldHdvcmsgRXJyb3JcIikpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKHBhcmFtU3RyKSB7XHJcbiAgICAgICAgICAgIHJlcS5zZW5kKHBhcmFtU3RyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXEuc2VuZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gc3RyaW5naWZ5IHVybCBwYXJhbWV0ZXJzXHJcbiAqL1xyXG5mdW5jdGlvbiB1cmxTdHJpbmdpZnkob2JqKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKVxyXG4gICAgLm1hcChrID0+IGAke2VuY29kZVVSSUNvbXBvbmVudChrKX09JHtlbmNvZGVVUklDb21wb25lbnQob2JqW2tdKX1gKVxyXG4gICAgLmpvaW4oJyYnKTtcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge3hociwgZ2V0LCBnZXRKU09OLCBwb3N0LCBwb3N0SlNPTn07XHJcbiIsIi8qKlxyXG4gKiBAZmlsZSBDb250YWlucyBmdW5jdGlvbnMgdG8gaW50ZXJhY3Qgd2l0aCBibG9ja2hlYWRzZmFucy5jb20gLSBjYW5ub3QgYmUgdXNlZCBieSBleHRlbnNpb25zLlxyXG4gKi9cclxuXHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgYWpheCA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvYWpheCcpO1xyXG5cclxuY29uc3QgQVBJX1VSTFMgPSB7XHJcbiAgICBTVE9SRTogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvZXh0ZW5zaW9uL3N0b3JlJyxcclxuICAgIE5BTUU6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2V4dGVuc2lvbi9uYW1lJyxcclxuICAgIEVSUk9SOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9ib3QvZXJyb3InLFxyXG59O1xyXG5cclxudmFyIGNhY2hlID0ge1xyXG4gICAgbmFtZXM6IG5ldyBNYXAoKSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGdldCBwdWJsaWMgZXh0ZW5zaW9uc1xyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRTdG9yZSgpLnRoZW4oc3RvcmUgPT4gY29uc29sZS5sb2coc3RvcmUpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gdXNlIHRoZSBjYWNoZWQgcmVzcG9uc2Ugc2hvdWxkIGJlIGNsZWFyZWQuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9IHJlc29sdmVzIHdpdGggdGhlIHJlc3BvbnNlXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRTdG9yZShyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRTdG9yZSkge1xyXG4gICAgICAgIGNhY2hlLmdldFN0b3JlID0gYWpheC5nZXRKU09OKEFQSV9VUkxTLlNUT1JFKVxyXG4gICAgICAgICAgICAudGhlbihzdG9yZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvL0J1aWxkIHRoZSBpbml0aWFsIG5hbWVzIG1hcFxyXG4gICAgICAgICAgICAgICAgaWYgKHN0b3JlLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGV4IG9mIHN0b3JlLmV4dGVuc2lvbnMpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWNoZS5uYW1lcy5zZXQoZXguaWQsIGV4LnRpdGxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldFN0b3JlO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIG5hbWUgb2YgdGhlIHByb3ZpZGVkIGV4dGVuc2lvbiBJRC5cclxuICogSWYgdGhlIGV4dGVuc2lvbiB3YXMgbm90IGZvdW5kLCByZXNvbHZlcyB3aXRoIHRoZSBvcmlnaW5hbCBwYXNzZWQgSUQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldEV4dGVuc2lvbk5hbWUoJ3Rlc3QnKS50aGVuKG5hbWUgPT4gY29uc29sZS5sb2cobmFtZSkpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgdGhlIGlkIHRvIHNlYXJjaCBmb3IuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9IHJlc29sdmVzIHdpdGggdGhlIGV4dGVuc2lvbiBuYW1lLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uTmFtZShpZCkge1xyXG4gICAgaWYgKGNhY2hlLm5hbWVzLmhhcyhpZCkpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhY2hlLm5hbWVzLmdldChpZCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhamF4LnBvc3RKU09OKEFQSV9VUkxTLk5BTUUsIHtpZH0pLnRoZW4obmFtZSA9PiB7XHJcbiAgICAgICAgY2FjaGUubmFtZXMuc2V0KGlkLCBuYW1lKTtcclxuICAgICAgICByZXR1cm4gbmFtZTtcclxuICAgIH0sIGVyciA9PiB7XHJcbiAgICAgICAgcmVwb3J0RXJyb3IoZXJyKTtcclxuICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXBvcnRzIGFuIGVycm9yIHNvIHRoYXQgaXQgY2FuIGJlIHJldmlld2VkIGFuZCBmaXhlZCBieSBleHRlbnNpb24gb3IgYm90IGRldmVsb3BlcnMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHJlcG9ydEVycm9yKEVycm9yKFwiUmVwb3J0IG1lXCIpKTtcclxuICogQHBhcmFtIHtFcnJvcn0gZXJyIHRoZSBlcnJvciB0byByZXBvcnRcclxuICovXHJcbmZ1bmN0aW9uIHJlcG9ydEVycm9yKGVycikge1xyXG4gICAgYWpheC5wb3N0SlNPTihBUElfVVJMUy5FUlJPUiwge1xyXG4gICAgICAgICAgICBlcnJvcl90ZXh0OiBlcnIubWVzc2FnZSxcclxuICAgICAgICAgICAgZXJyb3JfZmlsZTogZXJyLmZpbGVuYW1lLFxyXG4gICAgICAgICAgICBlcnJvcl9yb3c6IGVyci5saW5lbm8gfHwgMCxcclxuICAgICAgICAgICAgZXJyb3JfY29sdW1uOiBlcnIuY29sbm8gfHwgMCxcclxuICAgICAgICAgICAgZXJyb3Jfc3RhY2s6IGVyci5zdGFjayB8fCAnJyxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKChyZXNwKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyZXNwLnN0YXR1cyA9PSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICBob29rLmZpcmUoJ2Vycm9yX3JlcG9ydCcsICdTb21ldGhpbmcgd2VudCB3cm9uZywgaXQgaGFzIGJlZW4gcmVwb3J0ZWQuJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBob29rLmZpcmUoJ2Vycm9yX3JlcG9ydCcsIGBFcnJvciByZXBvcnRpbmcgZXhjZXB0aW9uOiAke3Jlc3AubWVzc2FnZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGdldFN0b3JlLFxyXG4gICAgZ2V0RXh0ZW5zaW9uTmFtZSxcclxuICAgIHJlcG9ydEVycm9yLFxyXG59O1xyXG4iLCJ2YXIgYWpheCA9IHJlcXVpcmUoJy4vYWpheCcpO1xyXG52YXIgaG9vayA9IHJlcXVpcmUoJy4vaG9vaycpO1xyXG52YXIgYmhmYW5zYXBpID0gcmVxdWlyZSgnLi9iaGZhbnNhcGknKTtcclxuXHJcbmNvbnN0IHdvcmxkSWQgPSB3aW5kb3cud29ybGRJZDtcclxudmFyIGNhY2hlID0ge1xyXG4gICAgZmlyc3RJZDogMCxcclxufTtcclxuXHJcbi8vIFVzZWQgdG8gcGFyc2UgbWVzc2FnZXMgbW9yZSBhY2N1cmF0ZWx5XHJcbnZhciB3b3JsZCA9IHtcclxuICAgIG5hbWU6ICcnLFxyXG4gICAgb25saW5lOiBbXVxyXG59O1xyXG5nZXRPbmxpbmVQbGF5ZXJzKClcclxuICAgIC50aGVuKHBsYXllcnMgPT4gd29ybGQucGxheWVycyA9IFsuLi5uZXcgU2V0KHBsYXllcnMuY29uY2F0KHdvcmxkLnBsYXllcnMpKV0pO1xyXG5cclxuZ2V0V29ybGROYW1lKClcclxuICAgIC50aGVuKG5hbWUgPT4gd29ybGQubmFtZSA9IG5hbWUpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgd29ybGRTdGFydGVkLFxyXG4gICAgZ2V0TG9ncyxcclxuICAgIGdldExpc3RzLFxyXG4gICAgZ2V0SG9tZXBhZ2UsXHJcbiAgICBnZXRPbmxpbmVQbGF5ZXJzLFxyXG4gICAgZ2V0T3duZXJOYW1lLFxyXG4gICAgZ2V0V29ybGROYW1lLFxyXG4gICAgc2VuZCxcclxufTtcclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgdGhlIHdvcmxkIGlmIG5lY2Nlc3NhcnksIHJlamVjdHMgaWYgdGhlIHdvcmxkIHRha2VzIHRvbyBsb25nIHRvIHN0YXJ0IG9yIGlzIHVuYXZhaWxpYmxlXHJcbiAqIFJlZmFjdG9yaW5nIHdlbGNvbWUuIFRoaXMgc2VlbXMgb3Zlcmx5IHB5cmFtaWQgbGlrZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogd29ybGRTdGFydGVkKCkudGhlbigoKSA9PiBjb25zb2xlLmxvZygnc3RhcnRlZCEnKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlY2hlY2sgaWYgdGhlIHdvcmxkIGlzIHN0YXJ0ZWQuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiB3b3JsZFN0YXJ0ZWQocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUud29ybGRTdGFydGVkKSB7XHJcbiAgICAgICAgY2FjaGUud29ybGRTdGFydGVkID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB2YXIgZmFpbHMgPSAwO1xyXG4gICAgICAgICAgICAoZnVuY3Rpb24gY2hlY2soKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDb3VsZCB0aGlzIGJlIG1vcmUgc2ltcGxpZmllZD9cclxuICAgICAgICAgICAgICAgIGFqYXgucG9zdEpTT04oJy9hcGknLCB7IGNvbW1hbmQ6ICdzdGF0dXMnLCB3b3JsZElkIH0pLnRoZW4ocmVzcG9uc2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocmVzcG9uc2Uud29ybGRTdGF0dXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnb25saW5lJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ29mZmxpbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWpheC5wb3N0SlNPTignL2FwaScsIHsgY29tbWFuZDogJ3N0YXJ0Jywgd29ybGRJZCB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGNoZWNrLCBjaGVjayk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndW5hdmFpbGlibGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ1dvcmxkIHVuYXZhaWxpYmxlLicpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RhcnR1cCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3NodXRkb3duJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2ssIDMwMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCsrZmFpbHMgPiAxMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdXb3JsZCB0b29rIHRvbyBsb25nIHRvIHN0YXJ0LicpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ1Vua25vd24gcmVzcG9uc2UuJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcik7XHJcbiAgICAgICAgICAgIH0oKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLndvcmxkU3RhcnRlZDtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIGFuIGFycmF5IG9mIHRoZSBsb2cncyBsaW5lcy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0TG9ncygpLnRoZW4obGluZXMgPT4gY29uc29sZS5sb2cobGluZXNbMF0pKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVkb3dubG9hZCB0aGUgbG9nc1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0TG9ncyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRMb2dzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0TG9ncyA9IHdvcmxkU3RhcnRlZCgpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IGFqYXguZ2V0KGAvd29ybGRzL2xvZ3MvJHt3b3JsZElkfWApKVxyXG4gICAgICAgICAgICAudGhlbihsb2cgPT4gbG9nLnNwbGl0KCdcXG4nKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldExvZ3M7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCBhIGxpc3Qgb2YgYWRtaW5zLCBtb2RzLCBzdGFmZiAoYWRtaW5zICsgbW9kcyksIHdoaXRlbGlzdCwgYW5kIGJsYWNrbGlzdC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0TGlzdHMoKS50aGVuKGxpc3RzID0+IGNvbnNvbGUubG9nKGxpc3RzLmFkbWluKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZmV0Y2ggdGhlIGxpc3RzLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0TGlzdHMocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0TGlzdHMpIHtcclxuICAgICAgICBjYWNoZS5nZXRMaXN0cyA9IHdvcmxkU3RhcnRlZCgpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IGFqYXguZ2V0KGAvd29ybGRzL2xpc3RzLyR7d29ybGRJZH1gKSlcclxuICAgICAgICAgICAgLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXRMaXN0KG5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGlzdCA9IGRvYy5xdWVyeVNlbGVjdG9yKGB0ZXh0YXJlYVtuYW1lPSR7bmFtZX1dYClcclxuICAgICAgICAgICAgICAgICAgICAudmFsdWVcclxuICAgICAgICAgICAgICAgICAgICAudG9Mb2NhbGVVcHBlckNhc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnXFxuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsuLi5uZXcgU2V0KGxpc3QpXTsgLy9SZW1vdmUgZHVwbGljYXRlc1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBsaXN0cyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBhZG1pbjogZ2V0TGlzdCgnYWRtaW5zJyksXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kOiBnZXRMaXN0KCdtb2RsaXN0JyksXHJcbiAgICAgICAgICAgICAgICAgICAgd2hpdGU6IGdldExpc3QoJ3doaXRlbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgICAgIGJsYWNrOiBnZXRMaXN0KCdibGFja2xpc3QnKSxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBsaXN0cy5tb2QgPSBsaXN0cy5tb2QuZmlsdGVyKG5hbWUgPT4gIWxpc3RzLmFkbWluLmluY2x1ZGVzKG5hbWUpKTtcclxuICAgICAgICAgICAgICAgIGxpc3RzLnN0YWZmID0gbGlzdHMuYWRtaW4uY29uY2F0KGxpc3RzLm1vZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0TGlzdHM7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgaG9tZXBhZ2Ugb2YgdGhlIHNlcnZlci5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0SG9tZXBhZ2UoKS50aGVuKGh0bWwgPT4gY29uc29sZS5sb2coaHRtbC5zdWJzdHJpbmcoMCwgMTAwKSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWZldGNoIHRoZSBwYWdlLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0SG9tZXBhZ2UocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0SG9tZXBhZ2UpIHtcclxuICAgICAgICBjYWNoZS5nZXRIb21lcGFnZSA9IGFqYXguZ2V0KGAvd29ybGRzLyR7d29ybGRJZH1gKVxyXG4gICAgICAgICAgICAuY2F0Y2goKCkgPT4gZ2V0SG9tZXBhZ2UodHJ1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRIb21lcGFnZTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIGFuIGFycmF5IG9mIHBsYXllciBuYW1lcy5cclxuICogQW4gb25saW5lIGxpc3QgaXMgbWFpbnRhaW5lZCBieSB0aGUgYm90LCB0aGlzIHNob3VsZCBnZW5lcmFsbHkgbm90IGJlIHVzZWQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldE9ubGluZVBsYXllcnMoKS50aGVuKG9ubGluZSA9PiB7IGZvciAobGV0IG4gb2Ygb25saW5lKSB7IGNvbnNvbGUubG9nKG4sICdpcyBvbmxpbmUhJyl9fSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZnJlc2ggdGhlIG9ubGluZSBuYW1lcy5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE9ubGluZVBsYXllcnMocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0T25saW5lUGxheWVycykge1xyXG4gICAgICAgIGNhY2hlLmdldE9ubGluZVBsYXllcnMgPSBnZXRIb21lcGFnZSh0cnVlKVxyXG4gICAgICAgICAgICAudGhlbigoaHRtbCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGxheWVyRWxlbXMgPSBkb2MucXVlcnlTZWxlY3RvcignLm1hbmFnZXIucGFkZGVkOm50aC1jaGlsZCgxKScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnF1ZXJ5U2VsZWN0b3JBbGwoJ3RyOm5vdCguaGlzdG9yeSkgPiB0ZC5sZWZ0Jyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGxheWVycyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIEFycmF5LmZyb20ocGxheWVyRWxlbXMpLmZvckVhY2goKGVsKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGxheWVycy5wdXNoKGVsLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBsYXllcnM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIHNlcnZlciBvd25lcidzIG5hbWUuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldE93bmVyTmFtZSgpLnRoZW4obmFtZSA9PiBjb25zb2xlLmxvZygnV29ybGQgaXMgb3duZWQgYnknLCBuYW1lKSk7XHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPd25lck5hbWUoKSB7XHJcbiAgICByZXR1cm4gZ2V0SG9tZXBhZ2UoKS50aGVuKGh0bWwgPT4ge1xyXG4gICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG4gICAgICAgIHJldHVybiBkb2MucXVlcnlTZWxlY3RvcignLnN1YmhlYWRlcn50cj50ZDpub3QoW2NsYXNzXSknKS50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSB3b3JsZCdzIG5hbWUuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldFdvcmxkTmFtZSgpLnRoZW4obmFtZSA9PiBjb25zb2xlLmxvZygnV29ybGQgbmFtZTonLCBuYW1lKSk7XHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRXb3JsZE5hbWUoKSB7XHJcbiAgICByZXR1cm4gZ2V0SG9tZXBhZ2UoKS50aGVuKGh0bWwgPT4ge1xyXG4gICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG4gICAgICAgIHJldHVybiBkb2MucXVlcnlTZWxlY3RvcignI3RpdGxlJykudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogU2VuZHMgYSBtZXNzYWdlLCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIG1lc3NhZ2UgaGFzIGJlZW4gc2VudCBvciByZWplY3RzIG9uIGZhaWx1cmUuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNlbmQoJ2hlbGxvIScpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ3NlbnQnKSkuY2F0Y2goY29uc29sZS5lcnJvcik7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIHNlbmQuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBzZW5kKG1lc3NhZ2UpIHtcclxuICAgIHJldHVybiBhamF4LnBvc3RKU09OKGAvYXBpYCwge2NvbW1hbmQ6ICdzZW5kJywgbWVzc2FnZSwgd29ybGRJZH0pXHJcbiAgICAgICAgLnRoZW4ocmVzcCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyZXNwLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IocmVzcC5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzcDtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKHJlc3AgPT4ge1xyXG4gICAgICAgICAgICAvL0hhbmRsZSBob29rc1xyXG4gICAgICAgICAgICBob29rLmZpcmUoJ3dvcmxkLnNlbmQnLCBtZXNzYWdlKTtcclxuICAgICAgICAgICAgaG9vay5maXJlKCd3b3JsZC5zZXJ2ZXJtZXNzYWdlJywgbWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICAvL0Rpc2FsbG93IGNvbW1hbmRzIHN0YXJ0aW5nIHdpdGggc3BhY2UuXHJcbiAgICAgICAgICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSAmJiAhbWVzc2FnZS5zdGFydHNXaXRoKCcvICcpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29tbWFuZCA9IG1lc3NhZ2Uuc3Vic3RyKDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBhcmdzID0gJyc7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29tbWFuZC5pbmNsdWRlcygnICcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZCA9IGNvbW1hbmQuc3Vic3RyaW5nKDAsIGNvbW1hbmQuaW5kZXhPZignICcpKTtcclxuICAgICAgICAgICAgICAgICAgICBhcmdzID0gbWVzc2FnZS5zdWJzdHJpbmcobWVzc2FnZS5pbmRleE9mKCcgJykgKyAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLmNvbW1hbmQnLCAnU0VSVkVSJywgY29tbWFuZCwgYXJncyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXNwO1xyXG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnIgPT0gJ1dvcmxkIG5vdCBydW5uaW5nLicpIHtcclxuICAgICAgICAgICAgICAgIGNhY2hlLmZpcnN0SWQgPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRocm93IGVycjtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byB3YXRjaCBjaGF0LlxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tDaGF0KCkge1xyXG4gICAgZ2V0TWVzc2FnZXMoKS50aGVuKChtc2dzKSA9PiB7XHJcbiAgICAgICAgbXNncy5mb3JFYWNoKChtZXNzYWdlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoYCR7d29ybGQubmFtZX0gLSBQbGF5ZXIgQ29ubmVjdGVkIGApKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgWywgbmFtZSwgaXBdID0gbWVzc2FnZS5tYXRjaCgvIC0gUGxheWVyIENvbm5lY3RlZCAoLiopIFxcfCAoW1xcZC5dKykgXFx8IChbXFx3XXszMn0pXFxzKiQvKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZUpvaW5NZXNzYWdlcyhuYW1lLCBpcCk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChgJHt3b3JsZC5uYW1lfSAtIFBsYXllciBEaXNjb25uZWN0ZWQgYCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gbWVzc2FnZS5zdWJzdHJpbmcod29ybGQubmFtZS5sZW5ndGggKyAyMyk7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVMZWF2ZU1lc3NhZ2VzKG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLmluY2x1ZGVzKCc6ICcpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmFtZSA9IGdldFVzZXJuYW1lKG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgbGV0IG1zZyA9IG1lc3NhZ2Uuc3Vic3RyaW5nKG5hbWUubGVuZ3RoICsgMik7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVVc2VyTWVzc2FnZXMobmFtZSwgbXNnKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVPdGhlck1lc3NhZ2VzKG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChiaGZhbnNhcGkucmVwb3J0RXJyb3IpXHJcbiAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgc2V0VGltZW91dChjaGVja0NoYXQsIDUwMDApO1xyXG4gICAgfSk7XHJcbn1cclxuY2hlY2tDaGF0KCk7XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGdldCB0aGUgbGF0ZXN0IGNoYXQgbWVzc2FnZXMuXHJcbiAqXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRNZXNzYWdlcygpIHtcclxuICAgIHJldHVybiB3b3JsZFN0YXJ0ZWQoKVxyXG4gICAgICAgIC50aGVuKCgpID0+IGFqYXgucG9zdEpTT04oYC9hcGlgLCB7IGNvbW1hbmQ6ICdnZXRjaGF0Jywgd29ybGRJZCwgZmlyc3RJZDogY2FjaGUuZmlyc3RJZCB9KSlcclxuICAgICAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgICAgICAgaWYgKGRhdGEuc3RhdHVzID09ICdvaycgJiYgZGF0YS5uZXh0SWQgIT0gY2FjaGUuZmlyc3RJZCkge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuZmlyc3RJZCA9IGRhdGEubmV4dElkO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEubG9nO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEuc3RhdHVzID09ICdlcnJvcicpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihkYXRhLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gZmlndXJlIG91dCB3aG8gc2VudCBhIG1lc3NhZ2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBuYW1lID0gZ2V0VXNlcm5hbWUoJ1NFUlZFUjogSGkgdGhlcmUhJyk7XHJcbiAqIC8vbmFtZSA9PSAnU0VSVkVSJ1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBwYXJzZS5cclxuICogQHJldHVybiB7c3RyaW5nfSB0aGUgbmFtZSBvZiB0aGUgdXNlciB3aG8gc2VudCB0aGUgbWVzc2FnZS5cclxuICovXHJcbmZ1bmN0aW9uIGdldFVzZXJuYW1lKG1lc3NhZ2UpIHtcclxuICAgIGZvciAobGV0IGkgPSAxODsgaSA+IDQ7IGktLSkge1xyXG4gICAgICAgIGxldCBwb3NzaWJsZU5hbWUgPSBtZXNzYWdlLnN1YnN0cmluZygwLCBtZXNzYWdlLmxhc3RJbmRleE9mKCc6ICcsIGkpKTtcclxuICAgICAgICBpZiAod29ybGQub25saW5lLmluY2x1ZGVzKHBvc3NpYmxlTmFtZSkgfHwgcG9zc2libGVOYW1lID09ICdTRVJWRVInKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwb3NzaWJsZU5hbWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gU2hvdWxkIGlkZWFsbHkgbmV2ZXIgaGFwcGVuLlxyXG4gICAgcmV0dXJuIG1lc3NhZ2Uuc3Vic3RyaW5nKDAsIG1lc3NhZ2UubGFzdEluZGV4T2YoJzogJywgMTgpKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBoYW5kbGUgcGxheWVyIGpvaW5zLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgcGxheWVyIGpvaW5pbmcuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpcCB0aGUgaXAgb2YgdGhlIHBsYXllciBqb2luaW5nLlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlSm9pbk1lc3NhZ2VzKG5hbWUsIGlwKSB7XHJcbiAgICBpZiAoIXdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLmpvaW4nLCBuYW1lLCBpcCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBoYW5kbGUgcGxheWVyIGRpc2Nvbm5lY3Rpb25zLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgcGxheWVyIGxlYXZpbmcuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVMZWF2ZU1lc3NhZ2VzKG5hbWUpIHtcclxuICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICB3b3JsZC5vbmxpbmUuc3BsaWNlKHdvcmxkLm9ubGluZS5pbmRleE9mKG5hbWUpLCAxKTtcclxuICAgICAgICBob29rLmNoZWNrKCd3b3JsZC5sZWF2ZScsIG5hbWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSB1c2VyIGNoYXRcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHVzZXIuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHNlbnQuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVVc2VyTWVzc2FnZXMobmFtZSwgbWVzc2FnZSkge1xyXG4gICAgaWYgKG5hbWUgPT0gJ1NFUlZFUicpIHtcclxuICAgICAgICBob29rLmNoZWNrKCd3b3JsZC5zZXJ2ZXJjaGF0JywgbWVzc2FnZSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLm1lc3NhZ2UnLCBuYW1lLCBtZXNzYWdlKTtcclxuXHJcbiAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykgJiYgIW1lc3NhZ2Uuc3RhcnRzV2l0aCgnLyAnKSkge1xyXG5cclxuICAgICAgICBsZXQgY29tbWFuZCA9IG1lc3NhZ2Uuc3Vic3RyKDEpO1xyXG5cclxuICAgICAgICBsZXQgYXJncyA9ICcnO1xyXG4gICAgICAgIGlmIChjb21tYW5kLmluY2x1ZGVzKCcgJykpIHtcclxuICAgICAgICAgICAgY29tbWFuZCA9IGNvbW1hbmQuc3Vic3RyaW5nKDAsIGNvbW1hbmQuaW5kZXhPZignICcpKTtcclxuICAgICAgICAgICAgYXJncyA9IG1lc3NhZ2Uuc3Vic3RyaW5nKG1lc3NhZ2UuaW5kZXhPZignICcpICsgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLmNvbW1hbmQnLCBuYW1lLCBjb21tYW5kLCBhcmdzKTtcclxuICAgICAgICByZXR1cm47IC8vbm90IGNoYXRcclxuICAgIH1cclxuXHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5jaGF0JywgbmFtZSwgbWVzc2FnZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdXNlZCB0byBoYW5kbGUgbWVzc2FnZXMgd2hpY2ggYXJlIG5vdCBzaW1wbHkgcGFyc2VkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBoYW5kbGVcclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZU90aGVyTWVzc2FnZXMobWVzc2FnZSkge1xyXG4gICAgaG9vay5jaGVjaygnd29ybGQub3RoZXInLCBtZXNzYWdlKTtcclxufVxyXG4iLCJ2YXIgbGlzdGVuZXJzID0ge307XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBiZWdpbiBsaXN0ZW5pbmcgdG8gYW4gZXZlbnQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGxpc3RlbignZXZlbnQnLCBjb25zb2xlLmxvZyk7XHJcbiAqIC8vYWx0ZXJuYXRpdmVseVxyXG4gKiBvbignZXZlbnQnLCBjb25zb2xlLmxvZyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGxpc3RlbiB0by5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdGhlIGV2ZW50IGhhbmRsZXJcclxuICovXHJcbmZ1bmN0aW9uIGxpc3RlbihrZXksIGNhbGxiYWNrKSB7XHJcbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcclxuICAgIH1cclxuXHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICBsaXN0ZW5lcnNba2V5XSA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0uaW5jbHVkZXMoY2FsbGJhY2spKSB7XHJcbiAgICAgICAgbGlzdGVuZXJzW2tleV0ucHVzaChjYWxsYmFjayk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzdG9wIGxpc3RlbmluZyB0byBhbiBldmVudC4gSWYgdGhlIGxpc3RlbmVyIHdhcyBub3QgZm91bmQsIG5vIGFjdGlvbiB3aWxsIGJlIHRha2VuLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL0VhcmxpZXIgYXR0YWNoZWQgbXlGdW5jIHRvICdldmVudCdcclxuICogcmVtb3ZlKCdldmVudCcsIG15RnVuYyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIHN0b3AgbGlzdGVuaW5nIHRvLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0aGUgY2FsbGJhY2sgdG8gcmVtb3ZlIGZyb20gdGhlIGV2ZW50IGxpc3RlbmVycy5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZShrZXksIGNhbGxiYWNrKSB7XHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmIChsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIGlmIChsaXN0ZW5lcnNba2V5XS5pbmNsdWRlcyhjYWxsYmFjaykpIHtcclxuICAgICAgICAgICAgbGlzdGVuZXJzW2tleV0uc3BsaWNlKGxpc3RlbmVyc1trZXldLmluZGV4T2YoY2FsbGJhY2spLCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBjYWxsIGV2ZW50cy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogY2hlY2soJ3Rlc3QnLCAxLCAyLCAzKTtcclxuICogY2hlY2soJ3Rlc3QnLCB0cnVlKTtcclxuICogLy8gYWx0ZXJuYXRpdmVseVxyXG4gKiBmaXJlKCd0ZXN0JywgMSwgMiwgMyk7XHJcbiAqIGZpcmUoJ3Rlc3QnLCB0cnVlKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gY2FsbC5cclxuICogQHBhcmFtIHttaXhlZH0gYXJncyBhbnkgYXJndW1lbnRzIHRvIHBhc3MgdG8gbGlzdGVuaW5nIGZ1bmN0aW9ucy5cclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrKGtleSwgLi4uYXJncykge1xyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxpc3RlbmVyc1trZXldLmZvckVhY2goZnVuY3Rpb24obGlzdGVuZXIpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsaXN0ZW5lciguLi5hcmdzKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGlmIChrZXkgIT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgY2hlY2soJ2Vycm9yJywgZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHVwZGF0ZSBhIHZhbHVlIGJhc2VkIG9uIGlucHV0IGZyb20gbGlzdGVuZXJzLlxyXG4gKlxyXG4gKiBAZGVwcmljYXRlZCBzaW5jZSA2LjEuMC4gSW5zdGVhZCwgdXBkYXRlIHJlcXVlc3RzIHNob3VsZCBiZSBoYW5kbGVkIGJ5IHRoZSBleHRlbnNpb24gaXRlc2VsZi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdXBkYXRlKCdldmVudCcsIHRydWUsIDEsIDIsIDMpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBjYWxsXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGluaXRpYWwgdGhlIGluaXRpYWwgdmFsdWUgdG8gYmUgcGFzc2VkIHRvIGxpc3RlbmVycy5cclxuICogQHBhcmFtIHttaXhlZH0gYXJncyBhbnkgYWRkaXRpb25hbCBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGxpc3RlbmVycy5cclxuICogQHJldHVybiB7bWl4ZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiB1cGRhdGUoa2V5LCBpbml0aWFsLCAuLi5hcmdzKSB7XHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICByZXR1cm4gaW5pdGlhbDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbGlzdGVuZXJzW2tleV0ucmVkdWNlKGZ1bmN0aW9uKHByZXZpb3VzLCBjdXJyZW50KSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGN1cnJlbnQocHJldmlvdXMsIC4uLmFyZ3MpO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcHJldmlvdXM7XHJcbiAgICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgICAgIGlmIChrZXkgIT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgY2hlY2soJ2Vycm9yJywgZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzO1xyXG4gICAgICAgIH1cclxuICAgIH0sIGluaXRpYWwpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGxpc3RlbixcclxuICAgIG9uOiBsaXN0ZW4sXHJcbiAgICByZW1vdmUsXHJcbiAgICBjaGVjayxcclxuICAgIGZpcmU6IGNoZWNrLFxyXG4gICAgdXBkYXRlLFxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGdldFN0cmluZyxcclxuICAgIGdldE9iamVjdCxcclxuICAgIHNldCxcclxuICAgIGNsZWFyTmFtZXNwYWNlLFxyXG59O1xyXG5cclxuLy9SRVZJRVc6IElzIHRoZXJlIGEgYmV0dGVyIHdheSB0byBkbyB0aGlzPyByZXF1aXJlKCcuL2NvbmZpZycpIG1heWJlP1xyXG5jb25zdCBOQU1FU1BBQ0UgPSB3aW5kb3cud29ybGRJZDtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGEgc3RyaW5nIGZyb20gdGhlIHN0b3JhZ2UgaWYgaXQgZXhpc3RzIGFuZCByZXR1cm5zIGl0LCBvdGhlcndpc2UgcmV0dXJucyBmYWxsYmFjay5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHggPSBnZXRTdHJpbmcoJ3N0b3JlZF9wcmVmcycsICdub3RoaW5nJyk7XHJcbiAqIHZhciB5ID0gZ2V0U3RyaW5nKCdzdG9yZWRfcHJlZnMnLCAnbm90aGluZycsIGZhbHNlKTtcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUga2V5IHRvIHJldHJpZXZlLlxyXG4gKiBAcGFyYW0ge21peGVkfSBmYWxsYmFjayB3aGF0IHRvIHJldHVybiBpZiB0aGUga2V5IHdhcyBub3QgZm91bmQuXHJcbiAqIEBwYXJhbSB7Ym9vbH0gW2xvY2FsPXRydWVdIHdoZXRoZXIgb3Igbm90IHRvIHVzZSBhIG5hbWVzcGFjZSB3aGVuIGNoZWNraW5nIGZvciB0aGUga2V5LlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIGdldFN0cmluZyhrZXksIGZhbGxiYWNrLCBsb2NhbCA9IHRydWUpIHtcclxuICAgIHZhciByZXN1bHQ7XHJcbiAgICBpZiAobG9jYWwpIHtcclxuICAgICAgICByZXN1bHQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShgJHtrZXl9JHtOQU1FU1BBQ0V9YCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlc3VsdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIChyZXN1bHQgPT09IG51bGwpID8gZmFsbGJhY2sgOiByZXN1bHQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIGEgc3RvcmVkIG9iamVjdCBpZiBpdCBleGlzdHMsIG90aGVyd2lzZSByZXR1cm5zIGZhbGxiYWNrLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgeCA9IGdldE9iamVjdCgnc3RvcmVkX2tleScsIFsxLCAyLCAzXSk7XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGl0ZW0gdG8gcmV0cmlldmUuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGZhbGxiYWNrIHdoYXQgdG8gcmV0dXJuIGlmIHRoZSBpdGVtIGRvZXMgbm90IGV4aXN0IG9yIGZhaWxzIHRvIHBhcnNlIGNvcnJlY3RseS5cclxuICogQHBhcmFtIHtib29sfSBbbG9jYWw9dHJ1ZV0gd2hldGhlciBvciBub3QgYSBuYW1lc3BhY2Ugc2hvdWxkIGJlIHVzZWQuXHJcbiAqIEByZXR1cm4ge21peGVkfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T2JqZWN0KGtleSwgZmFsbGJhY2ssIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IGdldFN0cmluZyhrZXksIGZhbHNlLCBsb2NhbCk7XHJcblxyXG4gICAgaWYgKCFyZXN1bHQpIHtcclxuICAgICAgICByZXR1cm4gZmFsbGJhY2s7XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXN1bHQgPSBKU09OLnBhcnNlKHJlc3VsdCk7XHJcbiAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICByZXN1bHQgPSBmYWxsYmFjaztcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSBmYWxsYmFjaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHMgYW4gb2JqZWN0IGluIHRoZSBzdG9yYWdlLCBzdHJpbmdpZnlpbmcgaXQgZmlyc3QgaWYgbmVjY2Vzc2FyeS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2V0KCdzb21lX2tleScsIHthOiBbMSwgMiwgM10sIGI6ICd0ZXN0J30pO1xyXG4gKiAvL3JldHVybnMgJ3tcImFcIjpbMSwyLDNdLFwiYlwiOlwidGVzdFwifSdcclxuICogZ2V0U3RyaW5nKCdzb21lX2tleScpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBpdGVtIHRvIG92ZXJ3cml0ZSBvciBjcmVhdGUuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGRhdGEgYW55IHN0cmluZ2lmeWFibGUgdHlwZS5cclxuICogQHBhcmFtIHtib29sfSBbbG9jYWw9dHJ1ZV0gd2hldGhlciB0byBzYXZlIHRoZSBpdGVtIHdpdGggYSBuYW1lc3BhY2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBzZXQoa2V5LCBkYXRhLCBsb2NhbCA9IHRydWUpIHtcclxuICAgIGlmIChsb2NhbCkge1xyXG4gICAgICAgIGtleSA9IGAke2tleX0ke05BTUVTUEFDRX1gO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgZGF0YSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgZGF0YSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhbGwgaXRlbXMgc3RhcnRpbmcgd2l0aCBuYW1lc3BhY2UgZnJvbSB0aGUgc3RvcmFnZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2V0KCdrZXlfdGVzdCcsIDEpO1xyXG4gKiBzZXQoJ2tleV90ZXN0MicsIDIpO1xyXG4gKiBjbGVhck5hbWVzcGFjZSgna2V5XycpOyAvL2JvdGgga2V5X3Rlc3QgYW5kIGtleV90ZXN0MiBoYXZlIGJlZW4gcmVtb3ZlZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVzcGFjZSB0aGUgcHJlZml4IHRvIGNoZWNrIGZvciB3aGVuIHJlbW92aW5nIGl0ZW1zLlxyXG4gKi9cclxuZnVuY3Rpb24gY2xlYXJOYW1lc3BhY2UobmFtZXNwYWNlKSB7XHJcbiAgICBPYmplY3Qua2V5cyhsb2NhbFN0b3JhZ2UpLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgobmFtZXNwYWNlKSkge1xyXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IGFwaSA9IHJlcXVpcmUoJy4vYmxvY2toZWFkcycpO1xyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnLi9zdG9yYWdlJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCcuL2hvb2snKTtcclxuXHJcbmNvbnN0IFNUT1JBR0UgPSB7XHJcbiAgICBQTEFZRVJTOiAnbWJfcGxheWVycycsXHJcbiAgICBMT0dfTE9BRDogJ21iX2xhc3RMb2dMb2FkJyxcclxufTtcclxuXHJcbnZhciB3b3JsZCA9IG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbmFtZTogJycsXHJcbiAgICBvbmxpbmU6IFtdLFxyXG4gICAgb3duZXI6ICcnLFxyXG4gICAgcGxheWVyczogc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRS5QTEFZRVJTLCB7fSksXHJcbiAgICBsaXN0czoge2FkbWluOiBbXSwgbW9kOiBbXSwgc3RhZmY6IFtdLCBibGFjazogW10sIHdoaXRlOiBbXX0sXHJcbiAgICBpc1BsYXllcixcclxuICAgIGlzU2VydmVyLFxyXG4gICAgaXNPd25lcixcclxuICAgIGlzQWRtaW4sXHJcbiAgICBpc1N0YWZmLFxyXG4gICAgaXNNb2QsXHJcbiAgICBpc09ubGluZSxcclxuICAgIGdldEpvaW5zLFxyXG59O1xyXG52YXIgbGlzdHMgPSB3b3JsZC5saXN0cztcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgYSBwbGF5ZXIgaGFzIGpvaW5lZCB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNQbGF5ZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLnBsYXllcnMuaGFzT3duUHJvcGVydHkobmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIHRoZSBzZXJ2ZXJcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzU2VydmVyKG5hbWUpIHtcclxuICAgIHJldHVybiBuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkgPT0gJ1NFUlZFUic7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyB0aGUgb3duZXIgb3Igc2VydmVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNPd25lcihuYW1lKSB7XHJcbiAgICByZXR1cm4gd29ybGQub3duZXIgPT0gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpIHx8IGlzU2VydmVyKG5hbWUpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgYW4gYWRtaW5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzQWRtaW4obmFtZSkge1xyXG4gICAgcmV0dXJuIGxpc3RzLmFkbWluLmluY2x1ZGVzKG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSkgfHwgaXNPd25lcihuYW1lKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIGEgbW9kXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc01vZChuYW1lKSB7XHJcbiAgICByZXR1cm4gbGlzdHMubW9kLmluY2x1ZGVzKG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyBhIHN0YWZmIG1lbWJlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzU3RhZmYobmFtZSkge1xyXG4gICAgcmV0dXJuIGlzQWRtaW4obmFtZSkgfHwgaXNNb2QobmFtZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgYSBwbGF5ZXIgaXMgb25saW5lXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc09ubGluZShuYW1lKSB7XHJcbiAgICByZXR1cm4gd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBudW1iZXIgb2YgdGltZXMgdGhlIHBsYXllciBoYXMgam9pbmVkIHRoZSBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge051bWJlcn1cclxuICovXHJcbmZ1bmN0aW9uIGdldEpvaW5zKG5hbWUpIHtcclxuICAgIHJldHVybiBpc1BsYXllcihuYW1lKSA/IHdvcmxkLnBsYXllcnNbbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpXS5qb2lucyA6IDA7XHJcbn1cclxuXHJcbi8vIEtlZXAgdGhlIG9ubGluZSBsaXN0IHVwIHRvIGRhdGVcclxuaG9vay5vbignd29ybGQuam9pbicsIGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIGlmICghd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcbn0pO1xyXG5ob29rLm9uKCd3b3JsZC5sZWF2ZScsIGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICB3b3JsZC5vbmxpbmUuc3BsaWNlKHdvcmxkLm9ubGluZS5pbmRleE9mKG5hbWUpLCAxKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vLyBLZWVwIHBsYXllcnMgbGlzdCB1cCB0byBkYXRlXHJcbmhvb2sub24oJ3dvcmxkLmpvaW4nLCBjaGVja1BsYXllckpvaW4pO1xyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uLlxyXG4gKiBSZW1vdmVzIGFkbWlucyBmcm9tIHRoZSBtb2QgbGlzdCBhbmQgY3JlYXRlcyB0aGUgc3RhZmYgbGlzdC5cclxuICovXHJcbmZ1bmN0aW9uIGJ1aWxkU3RhZmZMaXN0KCkge1xyXG4gICAgbGlzdHMubW9kID0gbGlzdHMubW9kLmZpbHRlcigobmFtZSkgPT4gIWxpc3RzLmFkbWluLmluY2x1ZGVzKG5hbWUpICYmIG5hbWUgIT0gJ1NFUlZFUicgJiYgbmFtZSAhPSB3b3JsZC5vd25lcik7XHJcbiAgICBsaXN0cy5zdGFmZiA9IGxpc3RzLmFkbWluLmNvbmNhdChsaXN0cy5tb2QpO1xyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24uXHJcbiAqIENoZWNrcyBpZiBhIHBsYXllciBoYXMgcGVybWlzc2lvbiB0byBwZXJmb3JtIGEgY29tbWFuZFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gY29tbWFuZFxyXG4gKi9cclxuZnVuY3Rpb24gcGVybWlzc2lvbkNoZWNrKG5hbWUsIGNvbW1hbmQpIHtcclxuICAgIGNvbW1hbmQgPSBjb21tYW5kLnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgaWYgKFsnYWRtaW4nLCAndW5hZG1pbicsICdtb2QnLCAndW5tb2QnXS5pbmNsdWRlcyhjb21tYW5kKSkge1xyXG4gICAgICAgIHJldHVybiBpc0FkbWluKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChbJ3doaXRlbGlzdCcsICd1bndoaXRlbGlzdCcsICdiYW4nLCAndW5iYW4nXS5pbmNsdWRlcyhjb21tYW5kKSkge1xyXG4gICAgICAgIHJldHVybiBpc1N0YWZmKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuLy8gS2VlcCBsaXN0cyB1cCB0byBkYXRlXHJcbmhvb2sub24oJ3dvcmxkLmNvbW1hbmQnLCBmdW5jdGlvbihuYW1lLCBjb21tYW5kLCB0YXJnZXQpIHtcclxuICAgIGlmICghcGVybWlzc2lvbkNoZWNrKG5hbWUsIGNvbW1hbmQpKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB1biA9IGNvbW1hbmQuc3RhcnRzV2l0aCgndW4nKTtcclxuXHJcbiAgICB2YXIgZ3JvdXAgPSB7XHJcbiAgICAgICAgYWRtaW46ICdhZG1pbicsXHJcbiAgICAgICAgbW9kOiAnbW9kJyxcclxuICAgICAgICB3aGl0ZWxpc3Q6ICd3aGl0ZScsXHJcbiAgICAgICAgYmFuOiAnYmxhY2snLFxyXG4gICAgfVt1biA/IGNvbW1hbmQuc3Vic3RyKDIpIDogY29tbWFuZF07XHJcblxyXG4gICAgaWYgKHVuICYmIGxpc3RzW2dyb3VwXS5pbmNsdWRlcyh0YXJnZXQpKSB7XHJcbiAgICAgICAgbGlzdHNbZ3JvdXBdLnNwbGljZShsaXN0c1tncm91cF0uaW5kZXhPZih0YXJnZXQpLCAxKTtcclxuICAgICAgICBidWlsZFN0YWZmTGlzdCgpO1xyXG4gICAgfSBlbHNlIGlmICghdW4gJiYgIWxpc3RzW2dyb3VwXS5pbmNsdWRlcyh0YXJnZXQpKSB7XHJcbiAgICAgICAgbGlzdHNbZ3JvdXBdLnB1c2godGFyZ2V0KTtcclxuICAgICAgICBidWlsZFN0YWZmTGlzdCgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbi4gSW5jcmVtZW50cyBhIHBsYXllcidzIGpvaW5zLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaXBcclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrUGxheWVySm9pbihuYW1lLCBpcCkge1xyXG4gICAgaWYgKHdvcmxkLnBsYXllcnMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcclxuICAgICAgICAvL1JldHVybmluZyBwbGF5ZXJcclxuICAgICAgICB3b3JsZC5wbGF5ZXJzW25hbWVdLmpvaW5zKys7XHJcbiAgICAgICAgaWYgKCF3b3JsZC5wbGF5ZXJzW25hbWVdLmlwcy5pbmNsdWRlcyhpcCkpIHtcclxuICAgICAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXS5pcHMucHVzaChpcCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvL05ldyBwbGF5ZXJcclxuICAgICAgICB3b3JsZC5wbGF5ZXJzW25hbWVdID0ge2pvaW5zOiAxLCBpcHM6IFtpcF19O1xyXG4gICAgfVxyXG4gICAgd29ybGQucGxheWVyc1tuYW1lXS5pcCA9IGlwO1xyXG5cclxuICAgIC8vIE90aGVyd2lzZSwgd2Ugd2lsbCBkb3VibGUgcGFyc2Ugam9pbnNcclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0UuTE9HX0xPQUQsIE1hdGguZmxvb3IoRGF0ZS5ub3coKS52YWx1ZU9mKCkpKTtcclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0UuUExBWUVSUywgd29ybGQucGxheWVycyk7XHJcbn1cclxuXHJcblxyXG4vLyBVcGRhdGUgbGlzdHNcclxuUHJvbWlzZS5hbGwoW2FwaS5nZXRMaXN0cygpLCBhcGkuZ2V0V29ybGROYW1lKCksIGFwaS5nZXRPd25lck5hbWUoKV0pXHJcbiAgICAudGhlbigodmFsdWVzKSA9PiB7XHJcbiAgICAgICAgdmFyIFthcGlMaXN0cywgd29ybGROYW1lLCBvd25lcl0gPSB2YWx1ZXM7XHJcblxyXG4gICAgICAgIHdvcmxkLmxpc3RzID0gYXBpTGlzdHM7XHJcbiAgICAgICAgYnVpbGRTdGFmZkxpc3QoKTtcclxuICAgICAgICB3b3JsZC5uYW1lID0gd29ybGROYW1lO1xyXG4gICAgICAgIHdvcmxkLm93bmVyID0gb3duZXI7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG5cclxuLy8gVXBkYXRlIHBsYXllcnMgc2luY2UgbGFzdCBib3QgbG9hZFxyXG5Qcm9taXNlLmFsbChbYXBpLmdldExvZ3MoKSwgYXBpLmdldFdvcmxkTmFtZSgpXSlcclxuICAgIC50aGVuKCh2YWx1ZXMpID0+IHtcclxuICAgICAgICB2YXIgW2xpbmVzLCB3b3JsZE5hbWVdID0gdmFsdWVzO1xyXG5cclxuICAgICAgICB2YXIgbGFzdCA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0UuTE9HX0xPQUQsIDApO1xyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0UuTE9HX0xPQUQsIE1hdGguZmxvb3IoRGF0ZS5ub3coKS52YWx1ZU9mKCkpKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbGluZSBvZiBsaW5lcykge1xyXG4gICAgICAgICAgICBsZXQgdGltZSA9IG5ldyBEYXRlKGxpbmUuc3Vic3RyaW5nKDAsIGxpbmUuaW5kZXhPZignYicpKS5yZXBsYWNlKCcgJywgJ1QnKS5yZXBsYWNlKCcgJywgJ1onKSk7XHJcbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gbGluZS5zdWJzdHJpbmcobGluZS5pbmRleE9mKCddJykgKyAyKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aW1lIDwgbGFzdCkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoYCR7d29ybGROYW1lfSAtIFBsYXllciBDb25uZWN0ZWQgYCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBwYXJ0cyA9IGxpbmUuc3Vic3RyKGxpbmUuaW5kZXhPZignIC0gUGxheWVyIENvbm5lY3RlZCAnKSArIDIwKTsgLy9OQU1FIHwgSVAgfCBJRFxyXG4gICAgICAgICAgICAgICAgbGV0IFssIG5hbWUsIGlwXSA9IHBhcnRzLm1hdGNoKC8oLiopIFxcfCAoW1xcdy5dKykgXFx8IC57MzJ9XFxzKi8pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNoZWNrUGxheWVySm9pbihuYW1lLCBpcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0UuUExBWUVSUywgd29ybGQucGxheWVycyk7XHJcbiAgICB9KTtcclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCdhcHAvdWknKTtcclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBzZW5kID0gcmVxdWlyZSgnYXBwL2JvdCcpLnNlbmQ7XHJcbmNvbnN0IHByZWZlcmVuY2VzID0gcmVxdWlyZSgnYXBwL3NldHRpbmdzJyk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0Fubm91bmNlbWVudHMnLCAnbWVzc2FnZXMnKTtcclxudGFiLmlubmVySFRNTCA9IGZzLnJlYWRGaWxlU3luYyhfX2Rpcm5hbWUgKyAnL3RhYi5odG1sJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGFubm91bmNlbWVudENoZWNrKDApLFxyXG59O1xyXG5cclxuZnVuY3Rpb24gYWRkTWVzc2FnZSh0ZXh0ID0gJycpIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2FUZW1wbGF0ZScsICcjYU1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLm0nLCB0ZXh0OiB0ZXh0fVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICBhbm5vdW5jZW1lbnRzID0gQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnLm0nKSlcclxuICAgICAgICAubWFwKGVsID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHttZXNzYWdlOiBlbC52YWx1ZX07XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgc3RvcmFnZS5zZXQoJ2Fubm91bmNlbWVudEFycicsIGFubm91bmNlbWVudHMpO1xyXG59XHJcblxyXG4vLyBBbm5vdW5jZW1lbnRzIGNvbGxlY3Rpb25cclxudmFyIGFubm91bmNlbWVudHMgPSBzdG9yYWdlLmdldE9iamVjdCgnYW5ub3VuY2VtZW50QXJyJywgW10pO1xyXG5cclxuLy8gU2hvdyBzYXZlZCBhbm5vdW5jZW1lbnRzXHJcbmFubm91bmNlbWVudHNcclxuICAgIC5tYXAoYW5uID0+IGFubi5tZXNzYWdlKVxyXG4gICAgLmZvckVhY2goYWRkTWVzc2FnZSk7XHJcblxyXG5cclxuLy8gU2VuZHMgYW5ub3VuY2VtZW50cyBhZnRlciB0aGUgc3BlY2lmaWVkIGRlbGF5LlxyXG5mdW5jdGlvbiBhbm5vdW5jZW1lbnRDaGVjayhpKSB7XHJcbiAgICBpID0gKGkgPj0gYW5ub3VuY2VtZW50cy5sZW5ndGgpID8gMCA6IGk7XHJcblxyXG4gICAgdmFyIGFubiA9IGFubm91bmNlbWVudHNbaV07XHJcblxyXG4gICAgaWYgKGFubiAmJiBhbm4ubWVzc2FnZSkge1xyXG4gICAgICAgIHNlbmQoYW5uLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gICAgc2V0VGltZW91dChhbm5vdW5jZW1lbnRDaGVjaywgcHJlZmVyZW5jZXMuYW5ub3VuY2VtZW50RGVsYXkgKiA2MDAwMCwgaSArIDEpO1xyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYnVpbGRBbmRTZW5kTWVzc2FnZSxcclxuICAgIGJ1aWxkTWVzc2FnZSxcclxufTtcclxuXHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnYXBwL2xpYnJhcmllcy93b3JsZCcpO1xyXG5jb25zdCBzZW5kID0gcmVxdWlyZSgnYXBwL2JvdCcpLnNlbmQ7XHJcblxyXG5mdW5jdGlvbiBidWlsZEFuZFNlbmRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpIHtcclxuICAgIHNlbmQoYnVpbGRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpIHtcclxuICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7KFtefV0rKX19L2csIGZ1bmN0aW9uKGZ1bGwsIGtleSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIE5BTUU6IG5hbWUsXHJcbiAgICAgICAgICAgIE5hbWU6IG5hbWVbMF0gKyBuYW1lLnN1YnN0cmluZygxKS50b0xvY2FsZUxvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICBuYW1lOiBuYW1lLnRvTG9jYWxlTG93ZXJDYXNlKClcclxuICAgICAgICB9W2tleV0gfHwgZnVsbDtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7aXB9fS9naSwgd29ybGQucGxheWVycy5nZXRJUChuYW1lKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1lc3NhZ2U7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjaGVja0pvaW5zQW5kR3JvdXAsXHJcbiAgICBjaGVja0pvaW5zLFxyXG4gICAgY2hlY2tHcm91cCxcclxufTtcclxuXHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnYXBwL2xpYnJhcmllcy93b3JsZCcpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGNoZWNrSm9pbnNBbmRHcm91cChuYW1lLCBtc2cpIHtcclxuICAgIHJldHVybiBjaGVja0pvaW5zKG5hbWUsIG1zZy5qb2luc19sb3csIG1zZy5qb2luc19oaWdoKSAmJiBjaGVja0dyb3VwKG5hbWUsIG1zZy5ncm91cCwgbXNnLm5vdF9ncm91cCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrSm9pbnMobmFtZSwgbG93LCBoaWdoKSB7XHJcbiAgICByZXR1cm4gd29ybGQuZ2V0Sm9pbnMobmFtZSkgPj0gbG93ICYmIHdvcmxkLmdldEpvaW5zKG5hbWUpIDw9IGhpZ2g7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrR3JvdXAobmFtZSwgZ3JvdXAsIG5vdF9ncm91cCkge1xyXG4gICAgcmV0dXJuIGlzSW5Hcm91cChuYW1lLCBncm91cCkgJiYgIWlzSW5Hcm91cChuYW1lLCBub3RfZ3JvdXApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0luR3JvdXAobmFtZSwgZ3JvdXApIHtcclxuICAgIG5hbWUgPSBuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICBzd2l0Y2ggKGdyb3VwLnRvTG9jYWxlTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICBjYXNlICdhbGwnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNQbGF5ZXIobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnYWRtaW4nOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNBZG1pbihuYW1lKTtcclxuICAgICAgICBjYXNlICdtb2QnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNNb2QobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnc3RhZmYnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNTdGFmZihuYW1lKTtcclxuICAgICAgICBjYXNlICdvd25lcic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc093bmVyKG5hbWUpO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG4iLCJPYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2J1aWxkTWVzc2FnZScpLFxyXG4gICAgcmVxdWlyZSgnLi9jaGVja0pvaW5zQW5kR3JvdXAnKVxyXG4pO1xyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ2FwcC91aScpO1xyXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcblxyXG52YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG5lbC5pbm5lckhUTUwgPSBmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgJy9zdHlsZS5jc3MnKTtcclxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG51aS5hZGRUYWJHcm91cCgnTWVzc2FnZXMnLCAnbWVzc2FnZXMnKTtcclxuXHJcbltcclxuICAgIHJlcXVpcmUoJy4vam9pbicpLFxyXG4gICAgcmVxdWlyZSgnLi9sZWF2ZScpLFxyXG4gICAgcmVxdWlyZSgnLi90cmlnZ2VyJyksXHJcbiAgICByZXF1aXJlKCcuL2Fubm91bmNlbWVudHMnKVxyXG5dLmZvckVhY2godHlwZSA9PiB7XHJcbiAgICB0eXBlLnRhYi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGNoZWNrRGVsZXRlKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC50YWdOYW1lICE9ICdBJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1aS5hbGVydCgnUmVhbGx5IGRlbGV0ZSB0aGlzIG1lc3NhZ2U/JywgW1xyXG4gICAgICAgICAgICB7dGV4dDogJ1llcycsIHN0eWxlOiAnZGFuZ2VyJywgYWN0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgdHlwZS5zYXZlKCk7XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7dGV4dDogJ0NhbmNlbCd9XHJcbiAgICAgICAgXSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0eXBlLnRhYi5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0eXBlLnNhdmUpO1xyXG5cclxuICAgIHR5cGUudGFiLnF1ZXJ5U2VsZWN0b3IoJy50b3AtcmlnaHQtYnV0dG9uJylcclxuICAgICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0eXBlLmFkZE1lc3NhZ2UoKSk7XHJcblxyXG4gICAgLy8gRG9uJ3Qgc3RhcnQgcmVzcG9uZGluZyB0byBjaGF0IGZvciAxMCBzZWNvbmRzXHJcbiAgICBzZXRUaW1lb3V0KHR5cGUuc3RhcnQsIDEwMDAwKTtcclxufSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgnYXBwL3VpJyk7XHJcblxyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnYXBwL2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ2FwcC9tZXNzYWdlcy9oZWxwZXJzJyk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcclxuXHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnam9pbkFycic7XHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdKb2luJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgJy90YWIuaHRtbCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxuICAgIHN0YXJ0OiAoKSA9PiBob29rLm9uKCd3b3JsZC5qb2luJywgb25Kb2luKSxcclxufTtcclxuXHJcbnZhciBqb2luTWVzc2FnZXMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSk7XHJcbmpvaW5NZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGFkZCBhIHRyaWdnZXIgbWVzc2FnZSB0byB0aGUgcGFnZS5cclxuICovXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UobXNnID0ge30pIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2pUZW1wbGF0ZScsICcjak1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnb3B0aW9uJywgcmVtb3ZlOiBbJ3NlbGVjdGVkJ10sIG11bHRpcGxlOiB0cnVlfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IG1zZy5tZXNzYWdlIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdBbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdOb2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhdmUgdGhlIHVzZXIncyBtZXNzYWdlcy5cclxuICovXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICBqb2luTWVzc2FnZXMgPSBbXTtcclxuICAgIEFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJyNqTXNncyA+IGRpdicpKS5mb3JFYWNoKGNvbnRhaW5lciA9PiB7XHJcbiAgICAgICAgaWYgKCFjb250YWluZXIucXVlcnlTZWxlY3RvcignLm0nKS52YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBqb2luTWVzc2FnZXMucHVzaCh7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19sb3c6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2hpZ2g6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImdyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIG5vdF9ncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgam9pbk1lc3NhZ2VzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gbGlzdGVuIHRvIHBsYXllciBqb2luc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKi9cclxuZnVuY3Rpb24gb25Kb2luKG5hbWUpIHtcclxuICAgIGpvaW5NZXNzYWdlcy5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgaWYgKGhlbHBlcnMuY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykpIHtcclxuICAgICAgICAgICAgaGVscGVycy5idWlsZEFuZFNlbmRNZXNzYWdlKG1zZy5tZXNzYWdlLCBuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ2FwcC91aScpO1xyXG5cclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnYXBwL2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKCdhcHAvbWVzc2FnZXMvaGVscGVycycpO1xyXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ2xlYXZlQXJyJztcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0xlYXZlJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgJy90YWIuaHRtbCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxuICAgIHN0YXJ0OiAoKSA9PiBob29rLm9uKCd3b3JsZC5sZWF2ZScsIG9uTGVhdmUpLFxyXG59O1xyXG5cclxudmFyIGxlYXZlTWVzc2FnZXMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSk7XHJcbmxlYXZlTWVzc2FnZXMuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgbGVhdmUgbWVzc2FnZSB0byB0aGUgcGFnZS5cclxuICovXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UobXNnID0ge30pIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2xUZW1wbGF0ZScsICcjbE1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnb3B0aW9uJywgcmVtb3ZlOiBbJ3NlbGVjdGVkJ10sIG11bHRpcGxlOiB0cnVlfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IG1zZy5tZXNzYWdlIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdBbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdOb2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhdmUgdGhlIGN1cnJlbnQgbGVhdmUgbWVzc2FnZXNcclxuICovXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICBsZWF2ZU1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjbE1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGVhdmVNZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2xvdzogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfaGlnaDogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGdyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgbm90X2dyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBsZWF2ZU1lc3NhZ2VzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gbGlzdGVuIHRvIHBsYXllciBkaXNjb25uZWN0aW9ucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIHBsYXllciBsZWF2aW5nLlxyXG4gKi9cclxuZnVuY3Rpb24gb25MZWF2ZShuYW1lKSB7XHJcbiAgICBsZWF2ZU1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAoaGVscGVycy5jaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgnYXBwL3VpJyk7XHJcblxyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnYXBwL2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ2FwcC9tZXNzYWdlcy9oZWxwZXJzJyk7XHJcbmNvbnN0IHNldHRpbmdzID0gcmVxdWlyZSgnYXBwL3NldHRpbmdzJyk7XHJcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcclxuXHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAndHJpZ2dlckFycic7XHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdUcmlnZ2VyJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgJy90YWIuaHRtbCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxuICAgIHN0YXJ0OiAoKSA9PiBob29rLm9uKCd3b3JsZC5tZXNzYWdlJywgY2hlY2tUcmlnZ2VycyksXHJcbn07XHJcblxyXG52YXIgdHJpZ2dlck1lc3NhZ2VzID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10pO1xyXG50cmlnZ2VyTWVzc2FnZXMuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgdHJpZ2dlciBtZXNzYWdlIHRvIHRoZSBwYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkTWVzc2FnZShtc2cgPSB7fSkge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjdFRlbXBsYXRlJywgJyN0TXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICdvcHRpb24nLCByZW1vdmU6IFsnc2VsZWN0ZWQnXSwgbXVsdGlwbGU6IHRydWV9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy5tJywgdGV4dDogbXNnLm1lc3NhZ2UgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy50JywgdmFsdWU6IG1zZy50cmlnZ2VyIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdBbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdOb2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTYXZlcyB0aGUgY3VycmVudCB0cmlnZ2VyIG1lc3NhZ2VzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIHRyaWdnZXJNZXNzYWdlcyA9IFtdO1xyXG4gICAgQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI3RNc2dzID4gZGl2JykpLmZvckVhY2goY29udGFpbmVyID0+IHtcclxuICAgICAgICBpZiAoIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlIHx8ICFjb250YWluZXIucXVlcnlTZWxlY3RvcignLnQnKS52YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cmlnZ2VyTWVzc2FnZXMucHVzaCh7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlLFxyXG4gICAgICAgICAgICB0cmlnZ2VyOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignLnQnKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfbG93OiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19oaWdoOiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBub3RfZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIHRyaWdnZXJNZXNzYWdlcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgYSB0cmlnZ2VyIGFnYWluc3QgYSBtZXNzYWdlIHRvIHNlZSBpZiBpdCBtYXRjaGVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdHJpZ2dlciB0aGUgdHJpZ2dlciB0byB0cnkgdG8gbWF0Y2hcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcclxuICovXHJcbmZ1bmN0aW9uIHRyaWdnZXJNYXRjaCh0cmlnZ2VyLCBtZXNzYWdlKSB7XHJcbiAgICBpZiAoc2V0dGluZ3MucmVnZXhUcmlnZ2Vycykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHRyaWdnZXIsICdpJykudGVzdChtZXNzYWdlKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHVpLm5vdGlmeShgU2tpcHBpbmcgdHJpZ2dlciAnJHt0cmlnZ2VyfScgYXMgdGhlIFJlZ0V4IGlzIGludmFpbGQuYCk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IFJlZ0V4cChcclxuICAgICAgICAgICAgdHJpZ2dlclxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhbLis/Xj0hOiR7fSgpfFxcW1xcXVxcL1xcXFxdKS9nLCBcIlxcXFwkMVwiKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKi9nLCBcIi4qXCIpLFxyXG4gICAgICAgICAgICAnaSdcclxuICAgICAgICApLnRlc3QobWVzc2FnZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNoZWNrIGluY29taW5nIHBsYXllciBtZXNzYWdlcyBmb3IgdHJpZ2dlcnNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIHBsYXllcidzIG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrVHJpZ2dlcnMobmFtZSwgbWVzc2FnZSkge1xyXG4gICAgdmFyIHRvdGFsQWxsb3dlZCA9IHNldHRpbmdzLm1heFJlc3BvbnNlcztcclxuICAgIHRyaWdnZXJNZXNzYWdlcy5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgaWYgKHRvdGFsQWxsb3dlZCAmJiBoZWxwZXJzLmNoZWNrSm9pbnNBbmRHcm91cChuYW1lLCBtc2cpICYmIHRyaWdnZXJNYXRjaChtc2cudHJpZ2dlciwgbWVzc2FnZSkpIHtcclxuICAgICAgICAgICAgaGVscGVycy5idWlsZEFuZFNlbmRNZXNzYWdlKG1zZy5tZXNzYWdlLCBuYW1lKTtcclxuICAgICAgICAgICAgdG90YWxBbGxvd2VkLS07XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBTVE9SQUdFX0lEID0gJ21iX3ByZWZlcmVuY2VzJztcclxuXHJcbnZhciBwcmVmcyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIHt9LCBmYWxzZSk7XHJcblxyXG4vLyBBdXRvIHNhdmUgb24gY2hhbmdlXHJcbi8vIElFIChhbGwpIC8gU2FmYXJpICg8IDEwKSBkb2Vzbid0IHN1cHBvcnQgcHJveGllc1xyXG5pZiAodHlwZW9mIFByb3h5ID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHByZWZzO1xyXG4gICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgcHJlZnMsIGZhbHNlKTtcclxuICAgIH0sIDMwICogMTAwMCk7XHJcbn0gZWxzZSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG5ldyBQcm94eShwcmVmcywge1xyXG4gICAgICAgIHNldDogZnVuY3Rpb24ob2JqLCBwcm9wLCB2YWwpIHtcclxuICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xyXG4gICAgICAgICAgICAgICAgb2JqW3Byb3BdID0gdmFsO1xyXG4gICAgICAgICAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgcHJlZnMsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxudmFyIHByZWZzTWFwID0gW1xyXG4gICAge3R5cGU6ICdudW1iZXInLCBrZXk6ICdhbm5vdW5jZW1lbnREZWxheScsIGRlZmF1bHQ6IDEwfSxcclxuICAgIHt0eXBlOiAnbnVtYmVyJywga2V5OiAnbWF4UmVzcG9uc2VzJywgZGVmYXVsdDogMn0sXHJcbiAgICB7dHlwZTogJ2Jvb2xlYW4nLCBrZXk6ICdub3RpZnknLCBkZWZhdWx0OiB0cnVlfSxcclxuICAgIC8vIEFkdmFuY2VkXHJcbiAgICB7dHlwZTogJ2Jvb2xlYW4nLCBrZXk6ICdkaXNhYmxlVHJpbScsIGRlZmF1bHQ6IGZhbHNlfSxcclxuICAgIHt0eXBlOiAnYm9vbGVhbicsIGtleTogJ3JlZ2V4VHJpZ2dlcnMnLCBkZWZhdWx0OiBmYWxzZX0sXHJcbiAgICB7dHlwZTogJ2Jvb2xlYW4nLCBrZXk6ICdzcGxpdE1lc3NhZ2VzJywgZGVmYXVsdDogZmFsc2V9LFxyXG4gICAge3R5cGU6ICd0ZXh0Jywga2V5OiAnc3BsaXRUb2tlbicsIGRlZmF1bHQ6ICc8c3BsaXQ+J30sXHJcbl07XHJcblxyXG5wcmVmc01hcC5mb3JFYWNoKHByZWYgPT4ge1xyXG4gICAgLy8gU2V0IGRlZmF1bHRzIGlmIG5vdCBzZXRcclxuICAgIGlmICh0eXBlb2YgcHJlZnNbcHJlZi5rZXldICE9ICBwcmVmLnR5cGUpIHtcclxuICAgICAgICBwcmVmc1twcmVmLmtleV0gPSBwcmVmLmRlZmF1bHQ7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ2FwcC91aScpO1xyXG5jb25zdCBwcmVmcyA9IHJlcXVpcmUoJ2FwcC9zZXR0aW5ncycpO1xyXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdTZXR0aW5ncycpO1xyXG50YWIuaW5uZXJIVE1MID0gJzxzdHlsZT4nICtcclxuICAgIGZzLnJlYWRGaWxlU3luYyhfX2Rpcm5hbWUgKyAnL3N0eWxlLmNzcycpICtcclxuICAgICc8L3N0eWxlPicgK1xyXG4gICAgZnMucmVhZEZpbGVTeW5jKF9fZGlybmFtZSArICcvdGFiLmh0bWwnKTtcclxuXHJcbi8vIFNob3cgcHJlZnNcclxuT2JqZWN0LmtleXMocHJlZnMpLmZvckVhY2goa2V5ID0+IHtcclxuICAgIHZhciBlbCA9IHRhYi5xdWVyeVNlbGVjdG9yKGBbZGF0YS1rZXk9XCIke2tleX1cIl1gKTtcclxuICAgIHN3aXRjaCAodHlwZW9mIHByZWZzW2tleV0pIHtcclxuICAgICAgICBjYXNlICdib29sZWFuJzpcclxuICAgICAgICAgICAgZWwuY2hlY2tlZCA9IHByZWZzW2tleV07XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGVsLnZhbHVlID0gcHJlZnNba2V5XTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuLy8gV2F0Y2ggZm9yIGNoYW5nZXNcclxudGFiLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICB2YXIgZ2V0VmFsdWUgPSAoa2V5KSA9PiB0YWIucXVlcnlTZWxlY3RvcihgW2RhdGEta2V5PVwiJHtrZXl9XCJdYCkudmFsdWU7XHJcbiAgICB2YXIgZ2V0SW50ID0gKGtleSkgPT4gK2dldFZhbHVlKGtleSk7XHJcbiAgICB2YXIgZ2V0Q2hlY2tlZCA9IChrZXkpID0+IHRhYi5xdWVyeVNlbGVjdG9yKGBbZGF0YS1rZXk9XCIke2tleX1cIl1gKS5jaGVja2VkO1xyXG5cclxuICAgIE9iamVjdC5rZXlzKHByZWZzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgdmFyIGZ1bmM7XHJcblxyXG4gICAgICAgIHN3aXRjaCh0eXBlb2YgcHJlZnNba2V5XSkge1xyXG4gICAgICAgICAgICBjYXNlICdib29sZWFuJzpcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSBnZXRDaGVja2VkO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gZ2V0SW50O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gZ2V0VmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcmVmc1trZXldID0gZnVuYyhrZXkpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuXHJcbi8vIEdldCBiYWNrdXBcclxudGFiLnF1ZXJ5U2VsZWN0b3IoJyNtYl9iYWNrdXBfc2F2ZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gc2hvd0JhY2t1cCgpIHtcclxuICAgIHZhciBiYWNrdXAgPSBKU09OLnN0cmluZ2lmeShsb2NhbFN0b3JhZ2UpLnJlcGxhY2UoLzwvZywgJyZsdDsnKTtcclxuICAgIHVpLmFsZXJ0KGBDb3B5IHRoaXMgdG8gYSBzYWZlIHBsYWNlOjxicj48dGV4dGFyZWEgc3R5bGU9XCJ3aWR0aDogY2FsYygxMDAlIC0gN3B4KTtoZWlnaHQ6MTYwcHg7XCI+JHtiYWNrdXB9PC90ZXh0YXJlYT5gKTtcclxufSk7XHJcblxyXG5cclxuLy8gTG9hZCBiYWNrdXBcclxudGFiLnF1ZXJ5U2VsZWN0b3IoJyNtYl9iYWNrdXBfbG9hZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gbG9hZEJhY2t1cCgpIHtcclxuICAgIHVpLmFsZXJ0KCdFbnRlciB0aGUgYmFja3VwIGNvZGU6PHRleHRhcmVhIHN0eWxlPVwid2lkdGg6Y2FsYygxMDAlIC0gN3B4KTtoZWlnaHQ6MTYwcHg7XCI+PC90ZXh0YXJlYT4nLFxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgIHsgdGV4dDogJ0xvYWQgJiByZWZyZXNoIHBhZ2UnLCBzdHlsZTogJ3N1Y2Nlc3MnLCBhY3Rpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCB0ZXh0YXJlYScpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IEpTT04ucGFyc2UoY29kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29kZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBiYWNrdXAnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdWkubm90aWZ5KCdJbnZhbGlkIGJhY2t1cCBjb2RlLiBObyBhY3Rpb24gdGFrZW4uJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY29kZSkuZm9yRWFjaCgoa2V5KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIGNvZGVba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgdGV4dDogJ0NhbmNlbCcgfVxyXG4gICAgICAgICAgICAgICAgXSk7XHJcbn0pO1xyXG4iLCIvLyBPdmVyd3JpdGUgdGhlIHBvbGxDaGF0IGZ1bmN0aW9uIHRvIGtpbGwgdGhlIGRlZmF1bHQgY2hhdCBmdW5jdGlvblxyXG53aW5kb3cucG9sbENoYXQgPSBmdW5jdGlvbigpIHt9O1xyXG5cclxuLy8gT3ZlcndyaXRlIHRoZSBvbGQgcGFnZVxyXG5kb2N1bWVudC5ib2R5LmlubmVySFRNTCA9ICcnO1xyXG4vLyBTdHlsZSByZXNldFxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbdHlwZT1cInRleHQvY3NzXCJdJylcclxuICAgIC5mb3JFYWNoKGVsID0+IGVsLnJlbW92ZSgpKTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3RpdGxlJykudGV4dENvbnRlbnQgPSAnQ29uc29sZSAtIE1lc3NhZ2VCb3QnO1xyXG5cclxuLy8gU2V0IHRoZSBpY29uIHRvIHRoZSBibG9ja2hlYWQgaWNvbiB1c2VkIG9uIHRoZSBmb3J1bXNcclxudmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xyXG5lbC5yZWwgPSAnaWNvbic7XHJcbmVsLmhyZWYgPSAnaHR0cHM6Ly9pcy5nZC9NQnZVSEYnO1xyXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbnJlcXVpcmUoJ2FwcC91aS9wb2x5ZmlsbHMvY29uc29sZScpO1xyXG5yZXF1aXJlKCdhcHAvYm90L21pZ3JhdGlvbicpO1xyXG5cclxuLy8gRXhwb3NlIHRoZSBleHRlbnNpb24gQVBJXHJcbndpbmRvdy5NZXNzYWdlQm90RXh0ZW5zaW9uID0gcmVxdWlyZSgnYXBwL01lc3NhZ2VCb3RFeHRlbnNpb24nKTtcclxuXHJcbmNvbnN0IGJoZmFuc2FwaSA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvYmhmYW5zYXBpJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgdWkgPSByZXF1aXJlKCdhcHAvdWknKTtcclxuaG9vay5vbignZXJyb3JfcmVwb3J0JywgZnVuY3Rpb24obXNnKSB7XHJcbiAgICB1aS5ub3RpZnkobXNnKTtcclxufSk7XHJcblxyXG5cclxucmVxdWlyZSgnYXBwL2NvbnNvbGUnKTtcclxuLy8gQnkgZGVmYXVsdCBubyB0YWIgaXMgc2VsZWN0ZWQsIHNob3cgdGhlIGNvbnNvbGUuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWZ0TmF2IHNwYW4nKS5jbGljaygpO1xyXG5yZXF1aXJlKCdhcHAvbWVzc2FnZXMnKTtcclxucmVxdWlyZSgnYXBwL2V4dGVuc2lvbnMnKTtcclxucmVxdWlyZSgnYXBwL3NldHRpbmdzL3BhZ2UnKTtcclxuXHJcbi8vIEVycm9yIHJlcG9ydGluZ1xyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoZXJyKSA9PiB7XHJcbiAgICBpZiAoZXJyLm1lc3NhZ2UgIT0gJ1NjcmlwdCBlcnJvcicpIHtcclxuICAgICAgICBiaGZhbnNhcGkucmVwb3J0RXJyb3IoZXJyKTtcclxuICAgIH1cclxufSk7XHJcbiIsInJlcXVpcmUoJy4vcG9seWZpbGxzL2RldGFpbHMnKTtcclxuXHJcbi8vIEJ1aWxkIHRoZSBBUElcclxuT2JqZWN0LmFzc2lnbihcclxuICAgIG1vZHVsZS5leHBvcnRzLFxyXG4gICAgcmVxdWlyZSgnLi9sYXlvdXQnKSxcclxuICAgIHJlcXVpcmUoJy4vdGVtcGxhdGUnKSxcclxuICAgIHJlcXVpcmUoJy4vbm90aWZpY2F0aW9ucycpXHJcbik7XHJcblxyXG4vLyBGdW5jdGlvbnMgd2hpY2ggYXJlIG5vIGxvbmdlciBjb250YWluZWQgaW4gdGhpcyBtb2R1bGUsIGJ1dCBhcmUgcmV0YWluZWQgZm9yIG5vdyBmb3IgYmFja3dhcmQgY29tcGF0YWJpbGl0eS5cclxuY29uc3Qgd3JpdGUgPSByZXF1aXJlKCdhcHAvY29uc29sZS9leHBvcnRzJykud3JpdGU7XHJcbm1vZHVsZS5leHBvcnRzLmFkZE1lc3NhZ2VUb0NvbnNvbGUgPSBmdW5jdGlvbihtc2csIG5hbWUgPSAnJywgbmFtZUNsYXNzID0gJycpIHtcclxuICAgIGNvbnNvbGUud2FybigndWkuYWRkTWVzc2FnZVRvQ29uc29sZSBoYXMgYmVlbiBkZXByaWNhdGVkLiBVc2UgZXguY29uc29sZS53cml0ZSBpbnN0ZWFkLicpO1xyXG4gICAgd3JpdGUobXNnLCBuYW1lLCBuYW1lQ2xhc3MpO1xyXG59O1xyXG4iLCIvKipcclxuICogQGZpbGUgQ29udGFpbnMgZnVuY3Rpb25zIGZvciBtYW5hZ2luZyB0aGUgcGFnZSBsYXlvdXRcclxuICovXHJcblxyXG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcblxyXG4vLyBCdWlsZCBwYWdlIC0gb25seSBjYXNlIGluIHdoaWNoIGJvZHkuaW5uZXJIVE1MIHNob3VsZCBiZSB1c2VkLlxyXG5kb2N1bWVudC5ib2R5LmlubmVySFRNTCArPSBmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgJy9sYXlvdXQuaHRtbCcpO1xyXG5kb2N1bWVudC5oZWFkLmlubmVySFRNTCArPSAnPHN0eWxlPicgKyBmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgJy9zdHlsZS5jc3MnKSArICc8L3N0eWxlPic7XHJcblxyXG4vLyBIaWRlIHRoZSBtZW51IHdoZW4gY2xpY2tpbmcgdGhlIG92ZXJsYXlcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xlZnROYXYgLm92ZXJsYXknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZU1lbnUpO1xyXG5cclxuLy8gQ2hhbmdlIHRhYnNcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xlZnROYXYnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGdsb2JhbFRhYkNoYW5nZShldmVudCkge1xyXG4gICAgdmFyIHRhYk5hbWUgPSBldmVudC50YXJnZXQuZGF0YXNldC50YWJOYW1lO1xyXG4gICAgaWYoIXRhYk5hbWUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy9Db250ZW50XHJcbiAgICAvL1dlIGNhbid0IGp1c3QgcmVtb3ZlIHRoZSBmaXJzdCBkdWUgdG8gYnJvd3NlciBsYWdcclxuICAgIEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2NvbnRhaW5lciA+IC52aXNpYmxlJykpXHJcbiAgICAgICAgLmZvckVhY2goZWwgPT4gZWwuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpKTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNjb250YWluZXIgPiBbZGF0YS10YWItbmFtZT0ke3RhYk5hbWV9XWApLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcclxuXHJcbiAgICAvL1RhYnNcclxuICAgIEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xlZnROYXYgLnNlbGVjdGVkJykpXHJcbiAgICAgICAgLmZvckVhY2goZWwgPT4gZWwuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKSk7XHJcbiAgICBldmVudC50YXJnZXQuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKTtcclxufSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0b2dnbGVNZW51LFxyXG4gICAgYWRkVGFiLFxyXG4gICAgcmVtb3ZlVGFiLFxyXG4gICAgYWRkVGFiR3JvdXAsXHJcbiAgICByZW1vdmVUYWJHcm91cCxcclxufTtcclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzaG93L2hpZGUgdGhlIG1lbnUuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHRvZ2dsZU1lbnUoKTtcclxuICovXHJcbmZ1bmN0aW9uIHRvZ2dsZU1lbnUoKSB7XHJcbiAgICB2YXIgbWFpblRvZ2dsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWZ0TmF2IGlucHV0Jyk7XHJcbiAgICBtYWluVG9nZ2xlLmNoZWNrZWQgPSAhbWFpblRvZ2dsZS5jaGVja2VkO1xyXG59XHJcblxyXG52YXIgdGFiVUlEID0gMDtcclxuLyoqXHJcbiAqIFVzZWQgdG8gYWRkIGEgdGFiIHRvIHRoZSBib3QncyBuYXZpZ2F0aW9uLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgdGFiID0gdWkuYWRkVGFiKCdUZXh0Jyk7XHJcbiAqIHZhciB0YWIyID0gdWkuYWRkVGFiKCdDdXN0b20gTWVzc2FnZXMnLCAnbWVzc2FnZXMnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IHRhYlRleHRcclxuICogQHBhcmFtIHtzdHJpbmd9IFtncm91cE5hbWU9bWFpbl0gT3B0aW9uYWwuIElmIHByb3ZpZGVkLCB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAgb2YgdGFicyB0byBhZGQgdGhpcyB0YWIgdG8uXHJcbiAqIEByZXR1cm4ge05vZGV9IC0gVGhlIGRpdiB0byBwbGFjZSB0YWIgY29udGVudCBpbi5cclxuICovXHJcbmZ1bmN0aW9uIGFkZFRhYih0YWJUZXh0LCBncm91cE5hbWUgPSAnbWFpbicpIHtcclxuICAgIHZhciB0YWJOYW1lID0gJ2JvdFRhYl8nICsgdGFiVUlEKys7XHJcblxyXG4gICAgdmFyIHRhYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIHRhYi50ZXh0Q29udGVudCA9IHRhYlRleHQ7XHJcbiAgICB0YWIuY2xhc3NMaXN0LmFkZCgndGFiJyk7XHJcbiAgICB0YWIuZGF0YXNldC50YWJOYW1lID0gdGFiTmFtZTtcclxuXHJcbiAgICB2YXIgdGFiQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGFiQ29udGVudC5kYXRhc2V0LnRhYk5hbWUgPSB0YWJOYW1lO1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNsZWZ0TmF2IFtkYXRhLXRhYi1ncm91cD0ke2dyb3VwTmFtZX1dYCkuYXBwZW5kQ2hpbGQodGFiKTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb250YWluZXInKS5hcHBlbmRDaGlsZCh0YWJDb250ZW50KTtcclxuXHJcbiAgICByZXR1cm4gdGFiQ29udGVudDtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgZ2xvYmFsIHRhYi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHRhYiA9IHVpLmFkZFRhYignVGFiJyk7XHJcbiAqIHVpLnJlbW92ZVRhYih0YWIpO1xyXG4gKiBAcGFyYW0ge05vZGV9IHRhYkNvbnRlbnQgVGhlIGRpdiByZXR1cm5lZCBieSB0aGUgYWRkVGFiIGZ1bmN0aW9uLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlVGFiKHRhYkNvbnRlbnQpIHtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNsZWZ0TmF2IFtkYXRhLXRhYi1uYW1lPSR7dGFiQ29udGVudC5kYXRhc2V0LnRhYk5hbWV9XWApLnJlbW92ZSgpO1xyXG4gICAgdGFiQ29udGVudC5yZW1vdmUoKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgdGFiIGdyb3VwIGluIHdoaWNoIHRhYnMgY2FuIGJlIHBsYWNlZC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdWkuYWRkVGFiR3JvdXAoJ0dyb3VwIFRleHQnLCAnc29tZV9ncm91cCcpO1xyXG4gKiB1aS5hZGRUYWIoJ1dpdGhpbiBncm91cCcsICdzb21lX2dyb3VwJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGhlIHRleHQgdGhlIHVzZXIgd2lsbCBzZWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBncm91cCB3aGljaCBjYW4gYmUgdXNlZCB0byBhZGQgdGFicyB3aXRoaW4gdGhlIGdyb3VwLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkVGFiR3JvdXAodGV4dCwgZ3JvdXBOYW1lKSB7XHJcbiAgICB2YXIgZGV0YWlscyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKTtcclxuICAgIGRldGFpbHMuZGF0YXNldC50YWJHcm91cCA9IGdyb3VwTmFtZTtcclxuXHJcbiAgICB2YXIgc3VtbWFyeSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N1bW1hcnknKTtcclxuICAgIHN1bW1hcnkudGV4dENvbnRlbnQgPSB0ZXh0O1xyXG4gICAgZGV0YWlscy5hcHBlbmRDaGlsZChzdW1tYXJ5KTtcclxuXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGVmdE5hdiBbZGF0YS10YWItZ3JvdXA9bWFpbl0nKS5hcHBlbmRDaGlsZChkZXRhaWxzKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgdGFiIGdyb3VwIGFuZCBhbGwgdGFicyBjb250YWluZWQgd2l0aGluIHRoZSBzcGVjaWZpZWQgZ3JvdXAuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGFkZFRhYkdyb3VwKCdHcm91cCcsICdncm91cDEnKTtcclxuICogdmFyIGlubmVyID0gYWRkVGFiKCdJbm5lcicsICdncm91cDEnKTtcclxuICogcmVtb3ZlVGFiR3JvdXAoJ2dyb3VwMScpOyAvLyBpbm5lciBoYXMgYmVlbiByZW1vdmVkLlxyXG4gKiBAcGFyYW0gc3RyaW5nIGdyb3VwTmFtZSB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAgdGhhdCB3YXMgdXNlZCBpbiB1aS5hZGRUYWJHcm91cC5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZVRhYkdyb3VwKGdyb3VwTmFtZSkge1xyXG4gICAgdmFyIGdyb3VwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2xlZnROYXYgW2RhdGEtdGFiLWdyb3VwPVwiJHtncm91cE5hbWV9XCJdYCk7XHJcbiAgICB2YXIgaXRlbXMgPSBBcnJheS5mcm9tKGdyb3VwLnF1ZXJ5U2VsZWN0b3JBbGwoJ3NwYW4nKSk7XHJcblxyXG4gICAgaXRlbXMuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICAvL1RhYiBjb250ZW50XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2NvbnRhaW5lciA+IFtkYXRhLXRhYi1uYW1lPVwiJHtpdGVtLmRhdGFzZXQudGFiTmFtZX1cIl1gKS5yZW1vdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGdyb3VwLnJlbW92ZSgpO1xyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYWxlcnRcclxufTtcclxuXHJcbi8qKlxyXG4qIEZ1bmN0aW9uIHVzZWQgdG8gcmVxdWlyZSBhY3Rpb24gZnJvbSB0aGUgdXNlci5cclxuKlxyXG4qIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IHRoZSB0ZXh0IHRvIGRpc3BsYXkgaW4gdGhlIGFsZXJ0XHJcbiogQHBhcmFtIHtBcnJheX0gYnV0dG9ucyBhbiBhcnJheSBvZiBidXR0b25zIHRvIGFkZCB0byB0aGUgYWxlcnQuXHJcbiogICAgICAgIEZvcm1hdDogW3t0ZXh0OiAnVGVzdCcsIHN0eWxlOidzdWNjZXNzJywgYWN0aW9uOiBmdW5jdGlvbigpe30sIHRoaXNBcmc6IHdpbmRvdywgZGlzbWlzczogZmFsc2V9XVxyXG4qICAgICAgICBOb3RlOiB0ZXh0IGlzIHRoZSBvbmx5IHJlcXVpcmVkIHBhcmFtYXRlci4gSWYgbm8gYnV0dG9uIGFycmF5IGlzIHNwZWNpZmllZFxyXG4qICAgICAgICB0aGVuIGEgc2luZ2xlIE9LIGJ1dHRvbiB3aWxsIGJlIHNob3duLlxyXG4qICAgICAgICAgUHJvdmlkZWQgc3R5bGVzOiBzdWNjZXNzLCBkYW5nZXIsIHdhcm5pbmcsIGluZm9cclxuKiAgICAgICAgRGVmYXVsdHM6IHN0eWxlOiAnJywgYWN0aW9uOiB1bmRlZmluZWQsIHRoaXNBcmc6IHVuZGVmaW5lZCwgZGlzbWlzczogdHJ1ZVxyXG4qL1xyXG5mdW5jdGlvbiBhbGVydCh0ZXh0LCBidXR0b25zID0gW3t0ZXh0OiAnT0snfV0pIHtcclxuICAgIGlmIChpbnN0YW5jZS5hY3RpdmUpIHtcclxuICAgICAgICBpbnN0YW5jZS5xdWV1ZS5wdXNoKHt0ZXh0LCBidXR0b25zfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaW5zdGFuY2UuYWN0aXZlID0gdHJ1ZTtcclxuXHJcbiAgICBidXR0b25zLmZvckVhY2goZnVuY3Rpb24oYnV0dG9uLCBpKSB7XHJcbiAgICAgICAgYnV0dG9uLmRpc21pc3MgPSAoYnV0dG9uLmRpc21pc3MgPT09IGZhbHNlKSA/IGZhbHNlIDogdHJ1ZTtcclxuICAgICAgICBpbnN0YW5jZS5idXR0b25zWydidXR0b25fJyArIGldID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246IGJ1dHRvbi5hY3Rpb24sXHJcbiAgICAgICAgICAgIHRoaXNBcmc6IGJ1dHRvbi50aGlzQXJnIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgZGlzbWlzczogdHlwZW9mIGJ1dHRvbi5kaXNtaXNzID09ICdib29sZWFuJyA/IGJ1dHRvbi5kaXNtaXNzIDogdHJ1ZSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGJ1dHRvbi5pZCA9ICdidXR0b25fJyArIGk7XHJcbiAgICAgICAgYnVpbGRCdXR0b24oYnV0dG9uKTtcclxuICAgIH0pO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0Q29udGVudCcpLmlubmVySFRNTCA9IHRleHQ7XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IH4gLm92ZXJsYXknKS5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQnKS5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBIb2xkcyB0aGUgY3VycmVudCBhbGVydCBhbmQgcXVldWUgb2YgZnVydGhlciBhbGVydHMuXHJcbiAqL1xyXG52YXIgaW5zdGFuY2UgPSB7XHJcbiAgICBhY3RpdmU6IGZhbHNlLFxyXG4gICAgcXVldWU6IFtdLFxyXG4gICAgYnV0dG9uczoge30sXHJcbn07XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdXNlZCB0byBhZGQgYnV0dG9uIGVsZW1lbnRzIHRvIGFuIGFsZXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gYnV0dG9uXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZEJ1dHRvbihidXR0b24pIHtcclxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIGVsLmlubmVySFRNTCA9IGJ1dHRvbi50ZXh0O1xyXG4gICAgaWYgKGJ1dHRvbi5zdHlsZSkge1xyXG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoYnV0dG9uLnN0eWxlKTtcclxuICAgIH1cclxuICAgIGVsLmlkID0gYnV0dG9uLmlkO1xyXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBidXR0b25IYW5kbGVyKTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCAuYnV0dG9ucycpLmFwcGVuZENoaWxkKGVsKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGRldGVybWluZSB0aGUgZnVuY3Rpb25hbGl0eSBvZiBlYWNoIGJ1dHRvbiBhZGRlZCB0byBhbiBhbGVydC5cclxuICpcclxuICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudFxyXG4gKi9cclxuZnVuY3Rpb24gYnV0dG9uSGFuZGxlcihldmVudCkge1xyXG4gICAgdmFyIGJ1dHRvbiA9IGluc3RhbmNlLmJ1dHRvbnNbZXZlbnQudGFyZ2V0LmlkXSB8fCB7fTtcclxuICAgIGlmICh0eXBlb2YgYnV0dG9uLmFjdGlvbiA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgYnV0dG9uLmFjdGlvbi5jYWxsKGJ1dHRvbi50aGlzQXJnKTtcclxuICAgIH1cclxuXHJcbiAgICAvL1JlcXVpcmUgdGhhdCB0aGVyZSBiZSBhbiBhY3Rpb24gYXNvY2lhdGVkIHdpdGggbm8tZGlzbWlzcyBidXR0b25zLlxyXG4gICAgaWYgKGJ1dHRvbi5kaXNtaXNzIHx8IHR5cGVvZiBidXR0b24uYWN0aW9uICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQnKS5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IH4gLm92ZXJsYXknKS5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IC5idXR0b25zJykuaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgaW5zdGFuY2UuYnV0dG9ucyA9IHt9O1xyXG4gICAgICAgIGluc3RhbmNlLmFjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBBcmUgbW9yZSBhbGVydHMgd2FpdGluZyB0byBiZSBzaG93bj9cclxuICAgICAgICBpZiAoaW5zdGFuY2UucXVldWUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxldCBuZXh0ID0gaW5zdGFuY2UucXVldWUuc2hpZnQoKTtcclxuICAgICAgICAgICAgYWxlcnQobmV4dC50ZXh0LCBuZXh0LmJ1dHRvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcblxyXG5PYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2FsZXJ0JyksXHJcbiAgICByZXF1aXJlKCcuL25vdGlmeScpXHJcbik7XHJcblxyXG52YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG5lbC5pbm5lckhUTUwgPSBmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgJy9zdHlsZS5jc3MnKTtcclxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5lbC5pZCA9ICdhbGVydFdyYXBwZXInO1xyXG5lbC5pbm5lckhUTUwgPSBmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgJy9ub3RpZmljYXRpb25zLmh0bWwnKTtcclxuXHJcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG5vdGlmeSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNlbmQgYSBub24tY3JpdGljYWwgYWxlcnQgdG8gdGhlIHVzZXIuXHJcbiAqIFNob3VsZCBiZSB1c2VkIGluIHBsYWNlIG9mIHVpLmFsZXJ0IGlmIHBvc3NpYmxlIGFzIGl0IGlzIG5vbi1ibG9ja2luZy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogLy9TaG93cyBhIG5vdGZpY2F0aW9uIGZvciAyIHNlY29uZHNcclxuICogdWkubm90aWZ5KCdOb3RpZmljYXRpb24nKTtcclxuICogLy9TaG93cyBhIG5vdGlmaWNhdGlvbiBmb3IgNSBzZWNvbmRzXHJcbiAqIHVpLm5vdGlmeSgnTm90aWZpY2F0aW9uJywgNSk7XHJcbiAqIEBwYXJhbSBTdHJpbmcgdGV4dCB0aGUgdGV4dCB0byBkaXNwbGF5LiBTaG91bGQgYmUga2VwdCBzaG9ydCB0byBhdm9pZCB2aXN1YWxseSBibG9ja2luZyB0aGUgbWVudSBvbiBzbWFsbCBkZXZpY2VzLlxyXG4gKiBAcGFyYW0gTnVtYmVyIGRpc3BsYXlUaW1lIHRoZSBudW1iZXIgb2Ygc2Vjb25kcyB0byBzaG93IHRoZSBub3RpZmljYXRpb24gZm9yLlxyXG4gKi9cclxuZnVuY3Rpb24gbm90aWZ5KHRleHQsIGRpc3BsYXlUaW1lID0gMikge1xyXG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICBlbC5jbGFzc0xpc3QuYWRkKCdub3RpZmljYXRpb24nKTtcclxuICAgIGVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcclxuICAgIGVsLnRleHRDb250ZW50ID0gdGV4dDtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XHJcbiAgICB9LmJpbmQoZWwpLCBkaXNwbGF5VGltZSAqIDEwMDApO1xyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZChlbCksIGRpc3BsYXlUaW1lICogMTAwMCArIDIxMDApO1xyXG59XHJcbiIsIi8vSUUgZG9lc24ndCBsaWtlIGNvbnNvbGUubG9nIHVubGVzcyBkZXYgdG9vbHMgYXJlIG9wZW4uXHJcbmlmICghd2luZG93LmNvbnNvbGUpIHtcclxuICAgIHdpbmRvdy5jb25zb2xlID0ge307XHJcbiAgICB3aW5kb3cubG9nID0gd2luZG93LmxvZyB8fCBbXTtcclxuICAgIGNvbnNvbGUubG9nID0gZnVuY3Rpb24oLi4uYXJncykge1xyXG4gICAgICAgIHdpbmRvdy5sb2cucHVzaChhcmdzKTtcclxuICAgIH07XHJcbn1cclxuWydpbmZvJywgJ2Vycm9yJywgJ3dhcm4nLCAnYXNzZXJ0J10uZm9yRWFjaChtZXRob2QgPT4ge1xyXG4gICAgaWYgKCFjb25zb2xlW21ldGhvZF0pIHtcclxuICAgICAgICBjb25zb2xlW21ldGhvZF0gPSBjb25zb2xlLmxvZztcclxuICAgIH1cclxufSk7XHJcbiIsIi8vRGV0YWlscyBwb2x5ZmlsbCwgb2xkZXIgZmlyZWZveCwgSUVcclxuaWYgKCEoJ29wZW4nIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKSkpIHtcclxuICAgIGxldCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbiAgICBzdHlsZS50ZXh0Q29udGVudCArPSBgZGV0YWlsczpub3QoW29wZW5dKSA+IDpub3Qoc3VtbWFyeSkgeyBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH0gZGV0YWlscyA+IHN1bW1hcnk6YmVmb3JlIHsgY29udGVudDogXCLilrZcIjsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBmb250LXNpemU6IC44ZW07IHdpZHRoOiAxLjVlbTsgZm9udC1mYW1pbHk6XCJDb3VyaWVyIE5ld1wiOyB9IGRldGFpbHNbb3Blbl0gPiBzdW1tYXJ5OmJlZm9yZSB7IHRyYW5zZm9ybTogcm90YXRlKDkwZGVnKTsgfWA7XHJcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcclxuXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC50YXJnZXQudGFnTmFtZSA9PSAnU1VNTUFSWScpIHtcclxuICAgICAgICAgICAgbGV0IGRldGFpbHMgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZGV0YWlscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZGV0YWlscy5nZXRBdHRyaWJ1dGUoJ29wZW4nKSkge1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5vcGVuID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLnJlbW92ZUF0dHJpYnV0ZSgnb3BlbicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5vcGVuID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMuc2V0QXR0cmlidXRlKCdvcGVuJywgJ29wZW4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsIi8vIElFIEZpeFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0ZW1wbGF0ZSkge1xyXG4gICAgaWYgKCEoJ2NvbnRlbnQnIGluIHRlbXBsYXRlKSkge1xyXG4gICAgICAgIGxldCBjb250ZW50ID0gdGVtcGxhdGUuY2hpbGROb2RlcztcclxuICAgICAgICBsZXQgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29udGVudC5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChjb250ZW50W2pdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRlbXBsYXRlLmNvbnRlbnQgPSBmcmFnbWVudDtcclxuICAgIH1cclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBidWlsZENvbnRlbnRGcm9tVGVtcGxhdGUsXHJcbn07XHJcblxyXG52YXIgcG9seWZpbGwgPSByZXF1aXJlKCdhcHAvdWkvcG9seWZpbGxzL3RlbXBsYXRlJyk7XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBjbG9uZSBhIHRlbXBsYXRlIGFmdGVyIGFsdGVyaW5nIHRoZSBwcm92aWRlZCBydWxlcy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjdGVtcGxhdGUnLCAnI3RhcmdldCcsIFt7c2VsZWN0b3I6ICdpbnB1dCcsIHZhbHVlOiAnVmFsdWUnfV0pO1xyXG4gKiB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJ3RlbXBsYXRlJywgJ2RpdicsIFt7c2VsZWN0b3I6ICdhJywgcmVtb3ZlOiBbJ2hyZWYnXSwgbXVsdGlwbGU6IHRydWV9XSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZW1wbGF0ZVNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXRTZWxlY3RvclxyXG4gKiBAcGFyYW0ge2FycmF5fSBydWxlcyBmb3JtYXQ6IGFycmF5IG9mIG9iamVjdHNcclxuICogICAgICBlYWNoIG9iamVjdCBtdXN0IGhhdmUgXCJzZWxlY3RvclwiLlxyXG4gKiAgICAgIGVhY2ggb2JqZWN0IGNhbiBoYXZlIFwibXVsdGlwbGVcIiBzZXQgdG8gdXBkYXRlIGFsbCBtYXRjaGluZyBlbGVtZW50cy5cclxuICogICAgICBlYWNoIG9iamVjdCBjYW4gaGF2ZSBcInJlbW92ZVwiIC0gYW4gYXJyYXkgb2YgYXR0cmlidXRlcyB0byByZW1vdmUuXHJcbiAqICAgICAgZWFjaCBvYmplY3QgY2FuIGhhdmUgXCJ0ZXh0XCIgb3IgXCJodG1sXCIgLSBmdXJ0aGVyIGtleXMgd2lsbCBiZSBzZXQgYXMgYXR0cmlidXRlcy5cclxuICogICAgICBpZiBib3RoIHRleHQgYW5kIGh0bWwgYXJlIHNldCwgdGV4dCB3aWxsIHRha2UgcHJlY2VuZGVuY2UuXHJcbiAqICAgICAgcnVsZXMgd2lsbCBiZSBwYXJzZWQgaW4gdGhlIG9yZGVyIHRoYXQgdGhleSBhcmUgcHJlc2VudCBpbiB0aGUgYXJyYXkuXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZENvbnRlbnRGcm9tVGVtcGxhdGUodGVtcGxhdGVTZWxlY3RvciwgdGFyZ2V0U2VsZWN0b3IsIHJ1bGVzID0gW10pIHtcclxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGVtcGxhdGVTZWxlY3Rvcik7XHJcblxyXG4gICAgcG9seWZpbGwodGVtcGxhdGUpO1xyXG5cclxuICAgIHZhciBjb250ZW50ID0gdGVtcGxhdGUuY29udGVudDtcclxuXHJcbiAgICBydWxlcy5mb3JFYWNoKHJ1bGUgPT4gaGFuZGxlUnVsZShjb250ZW50LCBydWxlKSk7XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0YXJnZXRTZWxlY3RvcikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuaW1wb3J0Tm9kZShjb250ZW50LCB0cnVlKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBhcHBseSBydWxlcyB0byB0aGUgdGVtcGxhdGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Tm9kZX0gY29udGVudCAtIHRoZSBjb250ZW50IG9mIHRoZSB0ZW1wbGF0ZS5cclxuICogQHBhcmFtIHtPYmplY3R9IHJ1bGUgLSB0aGUgcnVsZSB0byBhcHBseS5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZVJ1bGUoY29udGVudCwgcnVsZSkge1xyXG4gICAgaWYgKHJ1bGUubXVsdGlwbGUpIHtcclxuICAgICAgICBsZXQgZWxzID0gY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKHJ1bGUuc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICBBcnJheS5mcm9tKGVscylcclxuICAgICAgICAgICAgLmZvckVhY2goZWwgPT4gdXBkYXRlRWxlbWVudChlbCwgcnVsZSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgZWwgPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3IocnVsZS5zZWxlY3Rvcik7XHJcbiAgICAgICAgaWYgKCFlbCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFVuYWJsZSB0byB1cGRhdGUgJHtydWxlLnNlbGVjdG9yfS5gLCBydWxlKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlRWxlbWVudChlbCwgcnVsZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byB1cGRhdGUgYW4gZWxlbWVudCB3aXRoIGEgcnVsZS5cclxuICpcclxuICogQHBhcmFtIHtOb2RlfSBlbCB0aGUgZWxlbWVudCB0byBhcHBseSB0aGUgcnVsZXMgdG8uXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBydWxlIHRoZSBydWxlIG9iamVjdC5cclxuICovXHJcbmZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQoZWwsIHJ1bGUpIHtcclxuICAgIGlmICgndGV4dCcgaW4gcnVsZSkge1xyXG4gICAgICAgIGVsLnRleHRDb250ZW50ID0gcnVsZS50ZXh0O1xyXG4gICAgfSBlbHNlIGlmICgnaHRtbCcgaW4gcnVsZSkge1xyXG4gICAgICAgIGVsLmlubmVySFRNTCA9IHJ1bGUuaHRtbDtcclxuICAgIH1cclxuXHJcbiAgICBPYmplY3Qua2V5cyhydWxlKVxyXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+ICFbJ3NlbGVjdG9yJywgJ3RleHQnLCAnaHRtbCcsICdyZW1vdmUnLCAnbXVsdGlwbGUnXS5pbmNsdWRlcyhrZXkpKVxyXG4gICAgICAgIC5mb3JFYWNoKGtleSA9PiBlbC5zZXRBdHRyaWJ1dGUoa2V5LCBydWxlW2tleV0pKTtcclxuXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShydWxlLnJlbW92ZSkpIHtcclxuICAgICAgICBydWxlLnJlbW92ZS5mb3JFYWNoKGtleSA9PiBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5KSk7XHJcbiAgICB9XHJcbn1cclxuIiwiIl19
