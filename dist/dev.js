(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"app/libraries/world":12}],2:[function(require,module,exports){
Object.assign(
    module.exports,
    require('./send'),
    require('./checkGroup')
);

},{"./checkGroup":1,"./send":3}],3:[function(require,module,exports){
var api = require('app/libraries/blockheads');
var report = require('app/libraries/bhfansapi').reportError;
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
        .catch(err => {
            report(new Error(err));
        })
        .then(() => {
            setTimeout(checkQueue, 1000);
        });
}());

},{"app/libraries/bhfansapi":7,"app/libraries/blockheads":8,"app/settings":20}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
const self = module.exports = require('./exports');

const hook = require('app/libraries/hook');
const world = require('app/libraries/world');
const send = require('app/bot').send;
const ui = require('app/ui');


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
    "#mb_console .chat{height:calc(100vh - 220px)}@media screen and (min-width: 668px){#mb_console .chat{height:calc(100vh - 155px)}}#mb_console ul{height:100%;overflow-y:auto;margin:0;padding:0}#mb_console li{list-style-type:none}#mb_console .controls{display:flex;padding:0 10px}#mb_console input,#mb_console button{margin:5px 0}#mb_console input{font-size:1em;padding:1px;flex:1;border:solid 1px #999}#mb_console button{background:#182b73;font-weight:bold;color:#fff;border:0;height:40px;padding:1px 4px}#mb_console .mod>span:first-child{color:#05f529}#mb_console .admin>span:first-child{color:#2b26bd}\n" +
    '</style>' +
    "<div id=\"mb_console\">\r\n    <div class=\"chat\">\r\n        <ul></ul>\r\n    </div>\r\n    <div class=\"controls\">\r\n        <input type=\"text\"/><button>SEND</button>\r\n    </div>\r\n</div>\r\n";


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
    send(input.value);
    input.value = '';
    input.focus();
}

tab.querySelector('input').addEventListener('keydown', function(event) {
    if (event.key == "Enter" || event.keyCode == 13) {
        event.preventDefault();
        userSend();
    }
});

tab.querySelector('button').addEventListener('click', userSend);

},{"./exports":4,"app/bot":2,"app/libraries/hook":9,"app/libraries/world":12,"app/ui":23}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
/**
 * @file Contains functions to interact with blockheadsfans.com - cannot be used by extensions.
 */

var ui = require('app/ui');
var ajax = require('app/libraries/ajax');

const API_URLS = {
    STORE: '//blockheadsfans.com/messagebot/extension/store',
    NAME: '//blockheadsfans.com/messagebot/extension/name',
    ERROR: '//blockheadsfans.com/messagebot/bot/error',
};

var cache = {
    names: new Map(),
};

//Build the initial names map
getStore().then(store => {
    if (store.status != 'ok') {
        return;
    }

    for (let ex of store.extensions) {
        cache.names.set(ex.id, ex.title);
    }
}).catch(reportError);


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
        cache.getStore = ajax.getJSON(API_URLS.STORE);
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
                ui.notify('Something went wrong, it has been reported.');
            } else {
                ui.notify(`Error reporting exception: ${resp.message}`);
            }
        })
        .catch(console.error);
}

module.exports = {
    getStore,
    getExtensionName,
    reportError,
};

},{"app/libraries/ajax":6,"app/ui":23}],8:[function(require,module,exports){
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

},{"./ajax":6,"./bhfansapi":7,"./hook":9}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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
    isAdmin,
    isMod,
    isStaff,
    isOwner,
    isOnline,
    getJoins,
};
var lists = world.lists;

function isPlayer(name) {
    return world.players.hasOwnProperty(name.toLocaleUpperCase());
}

function isAdmin(name) {
    return lists.admin.includes(name.toLocaleUpperCase());
}

function isMod(name) {
    return lists.mod.includes(name.toLocaleUpperCase());
}

function isStaff(name) {
    return isAdmin(name) || isMod(name);
}

function isOwner(name) {
    return world.owner == name.toLocaleUpperCase();
}

function isOnline(name) {
    return world.online.includes(name.toLocaleUpperCase());
}

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

function buildStaffList() {
    lists.mod = lists.mod.filter((name) => !lists.admin.includes(name));
    lists.staff = lists.admin.concat(lists.mod);
}

function permissionCheck(name, command) {
    command = command.toLocaleLowerCase();

    if (['admin', 'unadmin', 'mod', 'unmod'].includes(command)) {
        return lists.admin.includes(name);
    }

    if (['whitelist', 'unwhitelist', 'ban', 'unban'].includes(command)) {
        return lists.staff.includes(name);
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

// Add a player join
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

    storage.set(STORAGE.PLAYERS, world.players);
}


// Update lists
Promise.all([api.getLists(), api.getWorldName(), api.getOwnerName()])
    .then((values) => {
        var [apiLists, worldName, owner] = values;

        //Remove the owner & SERVER from the mod lists and add to admin / staff lists.
        [owner, 'SERVER'].forEach(name => {
            if (!apiLists.admin.includes(name)) {
                apiLists.admin.push(name);
            }
        });

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

},{"./blockheads":8,"./hook":9,"./storage":11}],13:[function(require,module,exports){
const ui = require('app/ui');
const storage = require('app/libraries/storage');
const send = require('app/bot').send;
const preferences = require('app/settings');

var tab = ui.addTab('Announcements', 'messages');
tab.innerHTML = "<template id=\"aTemplate\">\r\n    <div>\r\n        <label>Send:</label>\r\n        <textarea class=\"m\"></textarea>\r\n        <a>Delete</a>\r\n        <label style=\"display:block;margin-top:5px;\">Wait X minutes...</label>\r\n    </div>\r\n</template>\r\n<div id=\"mb_announcements\">\r\n    <h3>These are sent according to a regular schedule.</h3>\r\n    <span>If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"aMsgs\"></div>\r\n</div>\r\n";

module.exports = {
    tab,
    save,
    addMessage,
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
(function announcementCheck(i) {
    i = (i >= announcements.length) ? 0 : i;

    var ann = announcements[i];

    if (ann && ann.message) {
        send(ann.message);
    }
    setTimeout(announcementCheck, preferences.announcementDelay * 60000, i + 1);
})(0);

},{"app/bot":2,"app/libraries/storage":11,"app/settings":20,"app/ui":23}],14:[function(require,module,exports){
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

},{"app/bot":2,"app/libraries/world":12}],15:[function(require,module,exports){
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

},{"app/libraries/world":12}],16:[function(require,module,exports){
Object.assign(
    module.exports,
    require('./buildMessage'),
    require('./checkJoinsAndGroup')
);

},{"./buildMessage":14,"./checkJoinsAndGroup":15}],17:[function(require,module,exports){
const ui = require('app/ui');

var el = document.createElement('style');
el.innerHTML = "#mb_join h3,#mb_leave h3,#mb_trigger h3,#mb_announcements h3{margin:0 0 5px 0}#mb_join>div,#mb_leave>div,#mb_trigger>div,#mb_announcements>div{border-top:1px solid #000}#mb_join input,#mb_join textarea,#mb_leave input,#mb_leave textarea,#mb_trigger input,#mb_trigger textarea,#mb_announcements input,#mb_announcements textarea{border:2px solid #666;width:calc(100% - 10px)}#mb_join textarea,#mb_leave textarea,#mb_trigger textarea,#mb_announcements textarea{resize:none;overflow:hidden;padding:1px 0;height:21px;transition:height .5s}#mb_join textarea:focus,#mb_leave textarea:focus,#mb_trigger textarea:focus,#mb_announcements textarea:focus{height:5em}#mb_join input[type=\"number\"],#mb_leave input[type=\"number\"],#mb_trigger input[type=\"number\"],#mb_announcements input[type=\"number\"]{width:5em}\n";
document.head.appendChild(el);

ui.addTabGroup('Messages', 'messages');

[
    require('./join'),
    require('./leave'),
    // require('./trigger'),
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
});

},{"./announcements":13,"./join":18,"./leave":19,"app/ui":23}],18:[function(require,module,exports){
const ui = require('app/ui');

const storage = require('app/libraries/storage');
const hook = require('app/libraries/hook');
const helpers = require('app/messages/helpers');

const STORAGE_ID = 'joinArr';

var tab = ui.addTab('Join', 'messages');
tab.innerHTML = "<template id=\"jTemplate\">\r\n    <div class=\"third-box\">\r\n        <label>When a player who is </label>\r\n        <select data-target=\"group\">\r\n            <option value=\"All\">anyone</option>\r\n            <option value=\"Staff\">a staff member</option>\r\n            <option value=\"Mod\">a mod</option>\r\n            <option value=\"Admin\">an admin</option>\r\n            <option value=\"Owner\">the owner</option>\r\n        </select>\r\n        <label> and not </label>\r\n        <select data-target=\"not_group\">\r\n            <option value=\"Nobody\">nobody</option>\r\n            <option value=\"Staff\">a staff member</option>\r\n            <option value=\"Mod\">a mod</option>\r\n            <option value=\"Admin\">an admin</option>\r\n            <option value=\"Owner\">the owner</option>\r\n        </select>\r\n        <label> joins, then say </label>\r\n        <textarea class=\"m\"></textarea>\r\n        <label> in chat if the player has joined between </label>\r\n        <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n        <label> and </label>\r\n        <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        <label> times.</label><br>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_join\" data-tab-name=\"join\">\r\n    <h3>These are checked when a player joins the server.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"jMsgs\"></div>\r\n</div>\r\n";

module.exports = {
    tab,
    save,
    addMessage,
};

var joinMessages = storage.getObject(STORAGE_ID, []);
joinMessages.forEach(addMessage);


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


function save() {
    joinMessages = [];
    Array.from(tab.querySelectorAll('.third-box')).forEach(container => {
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

// Listen to player joins and check messages
hook.on('world.join', function onJoin(name) {
    joinMessages.forEach(msg => {
        if (helpers.checkJoinsAndGroup(name, msg)) {
            helpers.buildAndSendMessage(msg.message, name);
        }
    });
});

},{"app/libraries/hook":9,"app/libraries/storage":11,"app/messages/helpers":16,"app/ui":23}],19:[function(require,module,exports){
const ui = require('app/ui');

const storage = require('app/libraries/storage');
const hook = require('app/libraries/hook');
const helpers = require('app/messages/helpers');

const STORAGE_ID = 'leaveArr';

var tab = ui.addTab('Leave', 'messages');
tab.innerHTML = "<template id=\"lTemplate\">\r\n    <div class=\"third-box\">\r\n        <label>When the player leaving is </label>\r\n        <select data-target=\"group\">\r\n            <option value=\"All\">anyone</option>\r\n            <option value=\"Staff\">a staff member</option>\r\n            <option value=\"Mod\">a mod</option>\r\n            <option value=\"Admin\">an admin</option>\r\n            <option value=\"Owner\">the owner</option>\r\n        </select>\r\n        <label> and not </label>\r\n        <select data-target=\"not_group\">\r\n            <option value=\"Nobody\">nobody</option>\r\n            <option value=\"Staff\">a staff member</option>\r\n            <option value=\"Mod\">a mod</option>\r\n            <option value=\"Admin\">an admin</option>\r\n            <option value=\"Owner\">the owner</option>\r\n        </select>\r\n        <label> then say </label>\r\n        <textarea class=\"m\"></textarea>\r\n        <label> in chat if the player has joined between </label>\r\n        <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n        <label> and </label>\r\n        <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        <label> times.</label><br>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_leave\">\r\n    <h3>These are checked when a player leaves the server.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"lMsgs\"></div>\r\n</div>\r\n";

module.exports = {
    tab,
    save,
    addMessage,
};

var leaveMessages = storage.getObject(STORAGE_ID, []);
leaveMessages.forEach(addMessage);


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


function save() {
    leaveMessages = [];
    Array.from(tab.querySelectorAll('.third-box')).forEach(container => {
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

// Listen to player joins and check messages
hook.on('world.leave', function onLeave(name) {
    leaveMessages.forEach(msg => {
        if (helpers.checkJoinsAndGroup(name, msg)) {
            helpers.buildAndSendMessage(msg.message, name);
        }
    });
});

},{"app/libraries/hook":9,"app/libraries/storage":11,"app/messages/helpers":16,"app/ui":23}],20:[function(require,module,exports){
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

},{"app/libraries/storage":11}],21:[function(require,module,exports){
const ui = require('app/ui');
const prefs = require('app/settings');

var tab = ui.addTab('Settings');
tab.innerHTML = '<style>' +
    "#mb_settings h3{border-bottom:1px solid #999}\n" +
    '</style>' +
    "<div id=\"mb_settings\">\r\n    <h3>Settings</h3>\r\n    <label>Minutes between announcements:</label><br>\r\n        <input data-key=\"announcementDelay\" type=\"number\"><br>\r\n    <label>Maximum trigger responses to a message:</label><br>\r\n        <input data-key=\"maxResponses\" type=\"number\"><br>\r\n    <label>New chat notifications: </label>\r\n        <input data-key=\"notify\" type=\"checkbox\"><br>\r\n\r\n    <h3>Advanced Settings - <a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/1.-Advanced-Options/\" target=\"_blank\">Read this first</a></h3>\r\n    <label>Disable whitespace trimming: </label>\r\n        <input data-key=\"disableTrim\" type=\"checkbox\"><br>\r\n    <label>Parse triggers as RegEx: </label>\r\n        <input data-key=\"regexTriggers\" type=\"checkbox\"><br>\r\n    <label>Split messages: </label>\r\n        <input data-key=\"splitMessages\" type=\"checkbox\"><br>\r\n    <label>Split token: </label><br>\r\n        <input data-key=\"splitToken\" type=\"text\">\r\n\r\n    <h3>Extensions</h3>\r\n    <div id=\"mb_ext_list\"></div>\r\n\r\n    <h3>Backup / Restore</h3>\r\n    <a id=\"mb_backup_save\">Get backup code</a><br>\r\n    <a id=\"mb_backup_load\">Load previous backup</a>\r\n    <div id=\"mb_backup\"></div>\r\n</div>\r\n";

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

},{"app/settings":20,"app/ui":23}],22:[function(require,module,exports){
// Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

// Overwrite the old page
document.body.innerHTML = '';
document.head.innerHTML = '';

require('app/ui/polyfills/console');
require('app/libraries/migration');

const bhfansapi = require('app/libraries/bhfansapi');

require('app/console');
require('app/messages');
require('app/settings/page');

// Error reporting
window.addEventListener('error', (err) => {
    if (err.message != 'Script error') {
        bhfansapi.reportError(err);
    }
});

},{"app/console":5,"app/libraries/bhfansapi":7,"app/libraries/migration":10,"app/messages":17,"app/settings/page":21,"app/ui/polyfills/console":28}],23:[function(require,module,exports){
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

},{"./layout":24,"./notifications":26,"./polyfills/details":29,"./template":31,"app/console/exports":4}],24:[function(require,module,exports){
/**
 * @file Contains functions for managing the page layout
 */

// Build page - only case in which body.innerHTML should be used.
document.body.innerHTML += "<div id=\"leftNav\">\r\n    <input type=\"checkbox\" id=\"leftToggle\">\r\n    <label for=\"leftToggle\">&#9776; Menu</label>\r\n\r\n    <nav data-tab-group=\"main\"></nav>\r\n    <div class=\"overlay\"></div>\r\n</div>\r\n\r\n<div id=\"container\">\r\n    <header></header>\r\n</div>\r\n";
document.head.innerHTML += '<style>' + "html,body{min-height:100vh;position:relative;width:100%;margin:0;font-family:\"Lucida Grande\",\"Lucida Sans Unicode\",Verdana,sans-serif;color:#000}textarea,input,button,select{font-family:inherit}a{cursor:pointer;color:#182b73}#leftNav{text-transform:uppercase}#leftNav nav{width:250px;background:#182b73;color:#fff;position:fixed;left:-250px;z-index:100;top:0;bottom:0;transition:left .5s}#leftNav details,#leftNav span{display:block;text-align:center;padding:5px 7px;border-bottom:1px solid white}#leftNav .selected{background:radial-gradient(#9fafeb, #182b73)}#leftNav summary ~ span{background:rgba(159,175,235,0.4)}#leftNav summary+span{border-top-left-radius:20px;border-top-right-radius:20px}#leftNav summary ~ span:last-of-type{border:0;border-bottom-left-radius:20px;border-bottom-right-radius:20px}#leftNav input{display:none}#leftNav label{color:#fff;background:#213b9d;padding:5px;position:fixed;top:5px;z-index:100;left:5px;opacity:1;transition:left .5s,opacity .5s}#leftNav input:checked ~ nav{left:0;transition:left .5s}#leftNav input:checked ~ label{left:255px;opacity:0;transition:left .5s,opacity .5s}#leftNav input:checked ~ .overlay{visibility:visible;opacity:1;transition:opacity .5s}header{background:#182b73 url(\"http://portal.theblockheads.net/static/images/portalHeader.png\") no-repeat;background-position:80px;height:80px}#container>div{height:calc(100vh - 100px);padding:10px;position:absolute;top:80px;left:0;right:0;overflow:auto}#container>div:not(.visible){display:none}.overlay{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99;background:rgba(0,0,0,0.7);visibility:hidden;opacity:0;transition:opacity .5s}.overlay.visible{visibility:visible;opacity:1;transition:opacity .5s}.third-box{position:relative;float:left;width:calc(33% - 19px);min-width:280px;padding:5px;margin-left:5px;margin-bottom:5px;border:3px solid #999;border-radius:10px}.third-box:nth-child(odd){background:#ccc}.top-right-button{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:10px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}\n" + '</style>';

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

},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
Object.assign(
    module.exports,
    require('./alert'),
    require('./notify')
);

var el = document.createElement('style');
el.innerHTML = "#alert{visibility:hidden;position:fixed;top:50px;left:0;right:0;margin:auto;z-index:101;width:50%;min-width:300px;min-height:200px;background:#fff;border-radius:10px;padding:10px 10px 55px 10px}#alert.visible{visibility:visible}#alert>div{webkit-overflow-scrolling:touch;max-height:65vh;overflow-y:auto}#alert>.buttons{position:absolute;bottom:10px;left:5px}#alert>.buttons>span{display:inline-block;padding:6px 12px;margin:0 5px;text-align:center;white-space:nowrap;cursor:pointer;border:1px solid rgba(0,0,0,0.15);border-radius:6px;background:#fff linear-gradient(to bottom, #fff 0, #e0e0e0 100%)}#alert>.buttons [class]{color:#fff}#alert>.buttons .success{background:#5cb85c linear-gradient(to bottom, #5cb85c 0, #419641 100%);border-color:#3e8f3e}#alert>.buttons .info{background:#5bc0de linear-gradient(to bottom, #5bc0de 0, #2aabd2 100%);border-color:#28a4c9}#alert>.buttons .danger{background:#d9534f linear-gradient(to bottom, #d9534f 0, #c12e2a 100%);border-color:#b92c28}#alert>.buttons .warning{background:#f0ad4e linear-gradient(to bottom, #f0ad4e 0, #eb9316 100%);border-color:#e38d13}.notification{opacity:0;transition:opacity 1s;position:fixed;top:1em;right:1em;min-width:200px;border-radius:5px;padding:5px;background:#9fafeb}.notification.visible{opacity:1}\n";
document.head.appendChild(el);

el = document.createElement('div');
el.id = 'alertWrapper';
el.innerHTML = "<div id=\"alert\">\r\n    <div id=\"alertContent\"></div>\r\n    <div class=\"buttons\"/></div>\r\n</div>\r\n<div class=\"overlay\"/></div>\r\n";

document.body.appendChild(el);

},{"./alert":25,"./notify":27}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
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

},{"app/ui/polyfills/template":30}]},{},[22])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvYm90L2NoZWNrR3JvdXAuanMiLCJkZXYvYm90L2luZGV4LmpzIiwiZGV2L2JvdC9zZW5kLmpzIiwiZGV2L2NvbnNvbGUvZXhwb3J0cy5qcyIsImRldi9jb25zb2xlL2luZGV4LmpzIiwiZGV2L2xpYnJhcmllcy9hamF4LmpzIiwiZGV2L2xpYnJhcmllcy9iaGZhbnNhcGkuanMiLCJkZXYvbGlicmFyaWVzL2Jsb2NraGVhZHMuanMiLCJkZXYvbGlicmFyaWVzL2hvb2suanMiLCJkZXYvbGlicmFyaWVzL21pZ3JhdGlvbi5qcyIsImRldi9saWJyYXJpZXMvc3RvcmFnZS5qcyIsImRldi9saWJyYXJpZXMvd29ybGQuanMiLCJkZXYvbWVzc2FnZXMvYW5ub3VuY2VtZW50cy9pbmRleC5qcyIsImRldi9tZXNzYWdlcy9oZWxwZXJzL2J1aWxkTWVzc2FnZS5qcyIsImRldi9tZXNzYWdlcy9oZWxwZXJzL2NoZWNrSm9pbnNBbmRHcm91cC5qcyIsImRldi9tZXNzYWdlcy9oZWxwZXJzL2luZGV4LmpzIiwiZGV2L21lc3NhZ2VzL2luZGV4LmpzIiwiZGV2L21lc3NhZ2VzL2pvaW4vaW5kZXguanMiLCJkZXYvbWVzc2FnZXMvbGVhdmUvaW5kZXguanMiLCJkZXYvc2V0dGluZ3MvaW5kZXguanMiLCJkZXYvc2V0dGluZ3MvcGFnZS5qcyIsImRldi9zdGFydC5qcyIsImRldi91aS9pbmRleC5qcyIsImRldi91aS9sYXlvdXQvaW5kZXguanMiLCJkZXYvdWkvbm90aWZpY2F0aW9ucy9hbGVydC5qcyIsImRldi91aS9ub3RpZmljYXRpb25zL2luZGV4LmpzIiwiZGV2L3VpL25vdGlmaWNhdGlvbnMvbm90aWZ5LmpzIiwiZGV2L3VpL3BvbHlmaWxscy9jb25zb2xlLmpzIiwiZGV2L3VpL3BvbHlmaWxscy9kZXRhaWxzLmpzIiwiZGV2L3VpL3BvbHlmaWxscy90ZW1wbGF0ZS5qcyIsImRldi91aS90ZW1wbGF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcclxuICogQGZpbGUgRGVwcmljYXRlZC4gVXNlIHdvcmxkLmlzW0dyb3VwXSBpbnN0ZWFkLlxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgY2hlY2tHcm91cFxyXG59O1xyXG5cclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgaWYgdXNlcnMgYXJlIGluIGRlZmluZWQgZ3JvdXBzLlxyXG4gKlxyXG4gKiBAZGVwcmljYXRlZFxyXG4gKiBAZXhhbXBsZVxyXG4gKiBjaGVja0dyb3VwKCdhZG1pbicsICdTRVJWRVInKSAvLyB0cnVlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBncm91cCB0aGUgZ3JvdXAgdG8gY2hlY2tcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHVzZXIgdG8gY2hlY2tcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrR3JvdXAoZ3JvdXAsIG5hbWUpIHtcclxuICAgIGNvbnNvbGUud2FybignYm90LmNoZWNrR3JvdXAgaXMgZGVwcmljYXRlZC4gVXNlIHdvcmxkLmlzQWRtaW4sIHdvcmxkLmlzTW9kLCBldGMuIGluc3RlYWQnKTtcclxuXHJcbiAgICBuYW1lID0gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgc3dpdGNoIChncm91cC50b0xvY2FsZUxvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgY2FzZSAnYWxsJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzUGxheWVyKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ2FkbWluJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzQWRtaW4obmFtZSk7XHJcbiAgICAgICAgY2FzZSAnbW9kJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzTW9kKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ3N0YWZmJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzU3RhZmYobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnb3duZXInOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNPd25lcihuYW1lKTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuIiwiT2JqZWN0LmFzc2lnbihcclxuICAgIG1vZHVsZS5leHBvcnRzLFxyXG4gICAgcmVxdWlyZSgnLi9zZW5kJyksXHJcbiAgICByZXF1aXJlKCcuL2NoZWNrR3JvdXAnKVxyXG4pO1xyXG4iLCJ2YXIgYXBpID0gcmVxdWlyZSgnYXBwL2xpYnJhcmllcy9ibG9ja2hlYWRzJyk7XHJcbnZhciByZXBvcnQgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL2JoZmFuc2FwaScpLnJlcG9ydEVycm9yO1xyXG52YXIgc2V0dGluZ3MgPSByZXF1aXJlKCdhcHAvc2V0dGluZ3MnKTtcclxuXHJcbnZhciBxdWV1ZSA9IFtdO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzZW5kLFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gcXVldWUgYSBtZXNzYWdlIHRvIGJlIHNlbnQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNlbmQoJ0hlbGxvIScpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBiZSBzZW50LlxyXG4gKi9cclxuZnVuY3Rpb24gc2VuZChtZXNzYWdlKSB7XHJcbiAgICBpZiAoc2V0dGluZ3Muc3BsaXRNZXNzYWdlcykge1xyXG4gICAgICAgIC8vRklYTUU6IElmIHRoZSBiYWNrc2xhc2ggYmVmb3JlIHRoZSB0b2tlbiBpcyBlc2NhcGVkIGJ5IGFub3RoZXIgYmFja3NsYXNoIHRoZSB0b2tlbiBzaG91bGQgc3RpbGwgc3BsaXQgdGhlIG1lc3NhZ2UuXHJcbiAgICAgICAgbGV0IHN0ciA9IG1lc3NhZ2Uuc3BsaXQoc2V0dGluZ3Muc3BsaXRUb2tlbik7XHJcbiAgICAgICAgbGV0IHRvU2VuZCA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgY3VyciA9IHN0cltpXTtcclxuICAgICAgICAgICAgaWYgKGN1cnJbY3Vyci5sZW5ndGggLSAxXSA9PSAnXFxcXCcgJiYgaSA8IHN0ci5sZW5ndGggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyICs9IHNldHRpbmdzLnNwbGl0VG9rZW4gKyBzdHJbKytpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0b1NlbmQucHVzaChjdXJyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU2VuZC5mb3JFYWNoKG1zZyA9PiBxdWV1ZS5wdXNoKG1zZykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBxdWV1ZS5wdXNoKG1lc3NhZ2UpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogV2F0Y2hlcyB0aGUgcXVldWUgZm9yIG5ldyBtZXNzYWdlcyB0byBzZW5kIGFuZCBzZW5kcyB0aGVtIGFzIHNvb24gYXMgcG9zc2libGUuXHJcbiAqL1xyXG4oZnVuY3Rpb24gY2hlY2tRdWV1ZSgpIHtcclxuICAgIGlmICghcXVldWUubGVuZ3RoKSB7XHJcbiAgICAgICAgc2V0VGltZW91dChjaGVja1F1ZXVlLCA1MDApO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBhcGkuc2VuZChxdWV1ZS5zaGlmdCgpKVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICByZXBvcnQobmV3IEVycm9yKGVycikpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrUXVldWUsIDEwMDApO1xyXG4gICAgICAgIH0pO1xyXG59KCkpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHdyaXRlLFxyXG4gICAgY2xlYXJcclxufTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlKG1zZywgbmFtZSA9ICcnLCBuYW1lQ2xhc3MgPSAnJykge1xyXG4gICAgdmFyIG1zZ0VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgIGlmIChuYW1lQ2xhc3MpIHtcclxuICAgICAgICBtc2dFbC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgbmFtZUNsYXNzKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbmFtZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgbmFtZUVsLnRleHRDb250ZW50ID0gbmFtZTtcclxuXHJcbiAgICB2YXIgY29udGVudEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgaWYgKG5hbWUpIHtcclxuICAgICAgICBjb250ZW50RWwudGV4dENvbnRlbnQgPSBgOiAke21zZ31gO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjb250ZW50RWwudGV4dENvbnRlbnQgPSBtc2c7XHJcbiAgICB9XHJcbiAgICBtc2dFbC5hcHBlbmRDaGlsZChuYW1lRWwpO1xyXG4gICAgbXNnRWwuYXBwZW5kQ2hpbGQoY29udGVudEVsKTtcclxuXHJcbiAgICB2YXIgY2hhdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIHVsJyk7XHJcbiAgICBjaGF0LmFwcGVuZENoaWxkKG1zZ0VsKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xlYXIoKSB7XHJcbiAgICB2YXIgY2hhdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIHVsJyk7XHJcbiAgICBjaGF0LmlubmVySFRNTCA9ICcnO1xyXG59XHJcbiIsImNvbnN0IHNlbGYgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZXhwb3J0cycpO1xyXG5cclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvd29ybGQnKTtcclxuY29uc3Qgc2VuZCA9IHJlcXVpcmUoJ2FwcC9ib3QnKS5zZW5kO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ2FwcC91aScpO1xyXG5cclxuXHJcbi8vIFRPRE86IFBhcnNlIHRoZXNlIGFuZCBwcm92aWRlIG9wdGlvbnMgdG8gc2hvdy9oaWRlIGRpZmZlcmVudCBvbmVzLlxyXG5ob29rLm9uKCd3b3JsZC5vdGhlcicsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgIHNlbGYud3JpdGUobWVzc2FnZSwgdW5kZWZpbmVkLCAnb3RoZXInKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5tZXNzYWdlJywgZnVuY3Rpb24obmFtZSwgbWVzc2FnZSkge1xyXG4gICAgbGV0IG1zZ0NsYXNzID0gJ3BsYXllcic7XHJcbiAgICBpZiAod29ybGQuaXNTdGFmZihuYW1lKSkge1xyXG4gICAgICAgIG1zZ0NsYXNzID0gJ3N0YWZmJztcclxuICAgICAgICBpZiAod29ybGQuaXNNb2QobmFtZSkpIHtcclxuICAgICAgICAgICAgbXNnQ2xhc3MgKz0gJyBtb2QnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vSGFzIHRvIGJlIGFkbWluXHJcbiAgICAgICAgICAgIG1zZ0NsYXNzICs9ICcgYWRtaW4nO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIG1zZ0NsYXNzICs9ICcgY29tbWFuZCc7XHJcbiAgICB9XHJcbiAgICBzZWxmLndyaXRlKG1lc3NhZ2UsIG5hbWUsIG1zZ0NsYXNzKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5zZXJ2ZXJjaGF0JywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgc2VsZi53cml0ZShtZXNzYWdlLCAnU0VSVkVSJywgJ2FkbWluJyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQuc2VuZCcsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIHNlbGYud3JpdGUobWVzc2FnZSwgJ1NFUlZFUicsICdhZG1pbiBjb21tYW5kJyk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy9NZXNzYWdlIGhhbmRsZXJzXHJcbmhvb2sub24oJ3dvcmxkLmpvaW4nLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJKb2luKG5hbWUsIGlwKSB7XHJcbiAgICBzZWxmLndyaXRlKGAke25hbWV9ICgke2lwfSkgaGFzIGpvaW5lZCB0aGUgc2VydmVyYCwgJ1NFUlZFUicsICdqb2luIHdvcmxkIGFkbWluJyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQubGVhdmUnLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJMZWF2ZShuYW1lKSB7XHJcbiAgICBzZWxmLndyaXRlKGAke25hbWV9IGhhcyBsZWZ0IHRoZSBzZXJ2ZXJgLCAnU0VSVkVSJywgYGxlYXZlIHdvcmxkIGFkbWluYCk7XHJcbn0pO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0NvbnNvbGUnKTtcclxuLy8gT3JkZXIgaXMgaW1wb3J0YW50IGhlcmUuXHJcblxyXG50YWIuaW5uZXJIVE1MID0gJzxzdHlsZT4nICtcclxuICAgIElOQ0xVREVfRklMRSgnL2Rldi9jb25zb2xlL3N0eWxlLmNzcycpICtcclxuICAgICc8L3N0eWxlPicgK1xyXG4gICAgSU5DTFVERV9GSUxFKCcvZGV2L2NvbnNvbGUvdGFiLmh0bWwnKTtcclxuXHJcblxyXG4vLyBBdXRvIHNjcm9sbCB3aGVuIG5ldyBtZXNzYWdlcyBhcmUgYWRkZWQgdG8gdGhlIHBhZ2UsIHVubGVzcyB0aGUgb3duZXIgaXMgcmVhZGluZyBvbGQgY2hhdC5cclxuKG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIHNob3dOZXdDaGF0KCkge1xyXG4gICAgbGV0IGNvbnRhaW5lciA9IHRhYi5xdWVyeVNlbGVjdG9yKCd1bCcpO1xyXG4gICAgbGV0IGxhc3RMaW5lID0gdGFiLnF1ZXJ5U2VsZWN0b3IoJ2xpOmxhc3QtY2hpbGQnKTtcclxuXHJcbiAgICBpZiAoIWNvbnRhaW5lciB8fCAhbGFzdExpbmUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvbnRhaW5lci5zY3JvbGxIZWlnaHQgLSBjb250YWluZXIuY2xpZW50SGVpZ2h0IC0gY29udGFpbmVyLnNjcm9sbFRvcCA8PSBsYXN0TGluZS5jbGllbnRIZWlnaHQgKiAyKSB7XHJcbiAgICAgICAgbGFzdExpbmUuc2Nyb2xsSW50b1ZpZXcoZmFsc2UpO1xyXG4gICAgfVxyXG59KSkub2JzZXJ2ZSh0YWIucXVlcnlTZWxlY3RvcignLmNoYXQnKSwge2NoaWxkTGlzdDogdHJ1ZX0pO1xyXG5cclxuXHJcbi8vIFJlbW92ZSBvbGQgY2hhdCB0byByZWR1Y2UgbWVtb3J5IHVzYWdlXHJcbihuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiByZW1vdmVPbGRDaGF0KCkge1xyXG4gICAgdmFyIGNoYXQgPSB0YWIucXVlcnlTZWxlY3RvcigndWwnKTtcclxuXHJcbiAgICB3aGlsZSAoY2hhdC5jaGlsZHJlbi5sZW5ndGggPiA1MDApIHtcclxuICAgICAgICBjaGF0LmNoaWxkcmVuWzBdLnJlbW92ZSgpO1xyXG4gICAgfVxyXG59KSkub2JzZXJ2ZSh0YWIucXVlcnlTZWxlY3RvcignLmNoYXQnKSwge2NoaWxkTGlzdDogdHJ1ZX0pO1xyXG5cclxuLy8gTGlzdGVuIGZvciB0aGUgdXNlciB0byBzZW5kIG1lc3NhZ2VzXHJcbmZ1bmN0aW9uIHVzZXJTZW5kKCkge1xyXG4gICAgdmFyIGlucHV0ID0gdGFiLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XHJcbiAgICBzZW5kKGlucHV0LnZhbHVlKTtcclxuICAgIGlucHV0LnZhbHVlID0gJyc7XHJcbiAgICBpbnB1dC5mb2N1cygpO1xyXG59XHJcblxyXG50YWIucXVlcnlTZWxlY3RvcignaW5wdXQnKS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIGlmIChldmVudC5rZXkgPT0gXCJFbnRlclwiIHx8IGV2ZW50LmtleUNvZGUgPT0gMTMpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHVzZXJTZW5kKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxudGFiLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdXNlclNlbmQpO1xyXG4iLCIvL1RPRE86IFVzZSBmZXRjaFxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIEdFVCBhIHBhZ2UuIFBhc3NlcyB0aGUgcmVzcG9uc2Ugb2YgdGhlIFhIUiBpbiB0aGUgcmVzb2x2ZSBwcm9taXNlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL3NlbmRzIGEgR0VUIHJlcXVlc3QgdG8gL3NvbWUvdXJsLnBocD9hPXRlc3RcclxuICogZ2V0KCcvc29tZS91cmwucGhwJywge2E6ICd0ZXN0J30pLnRoZW4oY29uc29sZS5sb2cpXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1N0clxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0KHVybCA9ICcvJywgcGFyYW1zID0ge30pIHtcclxuICAgIGlmIChPYmplY3Qua2V5cyhwYXJhbXMpLmxlbmd0aCkge1xyXG4gICAgICAgIHZhciBhZGRpdGlvbiA9IHVybFN0cmluZ2lmeShwYXJhbXMpO1xyXG4gICAgICAgIGlmICh1cmwuaW5jbHVkZXMoJz8nKSkge1xyXG4gICAgICAgICAgICB1cmwgKz0gYCYke2FkZGl0aW9ufWA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdXJsICs9IGA/JHthZGRpdGlvbn1gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geGhyKCdHRVQnLCB1cmwsIHt9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgSlNPTiBvYmplY3QgaW4gdGhlIHByb21pc2UgcmVzb2x2ZSBtZXRob2QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtT2JqXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRKU09OKHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIGdldCh1cmwsIHBhcmFtT2JqKS50aGVuKEpTT04ucGFyc2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIG1ha2UgYSBwb3N0IHJlcXVlc3RcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW1PYmpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHBvc3QodXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4geGhyKCdQT1NUJywgdXJsLCBwYXJhbU9iaik7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gZmV0Y2ggSlNPTiBmcm9tIGEgcGFnZSB0aHJvdWdoIHBvc3QuXHJcbiAqXHJcbiAqIEBwYXJhbSBzdHJpbmcgdXJsXHJcbiAqIEBwYXJhbSBzdHJpbmcgcGFyYW1PYmpcclxuICogQHJldHVybiBQcm9taXNlXHJcbiAqL1xyXG5mdW5jdGlvbiBwb3N0SlNPTih1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiBwb3N0KHVybCwgcGFyYW1PYmopLnRoZW4oSlNPTi5wYXJzZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuKiBIZWxwZXIgZnVuY3Rpb24gdG8gbWFrZSBYSFIgcmVxdWVzdHMsIGlmIHBvc3NpYmxlIHVzZSB0aGUgZ2V0IGFuZCBwb3N0IGZ1bmN0aW9ucyBpbnN0ZWFkLlxyXG4qXHJcbiogQGRlcHJpY2F0ZWQgc2luY2UgdmVyc2lvbiA2LjFcclxuKiBAcGFyYW0gc3RyaW5nIHByb3RvY29sXHJcbiogQHBhcmFtIHN0cmluZyB1cmxcclxuKiBAcGFyYW0gb2JqZWN0IHBhcmFtT2JqIC0tIFdBUk5JTkcuIE9ubHkgYWNjZXB0cyBzaGFsbG93IG9iamVjdHMuXHJcbiogQHJldHVybiBQcm9taXNlXHJcbiovXHJcbmZ1bmN0aW9uIHhocihwcm90b2NvbCwgdXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICB2YXIgcGFyYW1TdHIgPSB1cmxTdHJpbmdpZnkocGFyYW1PYmopO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIHZhciByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICByZXEub3Blbihwcm90b2NvbCwgdXJsKTtcclxuICAgICAgICByZXEuc2V0UmVxdWVzdEhlYWRlcignWC1SZXF1ZXN0ZWQtV2l0aCcsICdYTUxIdHRwUmVxdWVzdCcpO1xyXG4gICAgICAgIGlmIChwcm90b2NvbCA9PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgcmVxLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlcS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcS5zdGF0dXNUZXh0KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIEhhbmRsZSBuZXR3b3JrIGVycm9yc1xyXG4gICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJlamVjdChFcnJvcihcIk5ldHdvcmsgRXJyb3JcIikpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKHBhcmFtU3RyKSB7XHJcbiAgICAgICAgICAgIHJlcS5zZW5kKHBhcmFtU3RyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXEuc2VuZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gc3RyaW5naWZ5IHVybCBwYXJhbWV0ZXJzXHJcbiAqL1xyXG5mdW5jdGlvbiB1cmxTdHJpbmdpZnkob2JqKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKVxyXG4gICAgLm1hcChrID0+IGAke2VuY29kZVVSSUNvbXBvbmVudChrKX09JHtlbmNvZGVVUklDb21wb25lbnQob2JqW2tdKX1gKVxyXG4gICAgLmpvaW4oJyYnKTtcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge3hociwgZ2V0LCBnZXRKU09OLCBwb3N0LCBwb3N0SlNPTn07XHJcbiIsIi8qKlxyXG4gKiBAZmlsZSBDb250YWlucyBmdW5jdGlvbnMgdG8gaW50ZXJhY3Qgd2l0aCBibG9ja2hlYWRzZmFucy5jb20gLSBjYW5ub3QgYmUgdXNlZCBieSBleHRlbnNpb25zLlxyXG4gKi9cclxuXHJcbnZhciB1aSA9IHJlcXVpcmUoJ2FwcC91aScpO1xyXG52YXIgYWpheCA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvYWpheCcpO1xyXG5cclxuY29uc3QgQVBJX1VSTFMgPSB7XHJcbiAgICBTVE9SRTogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvZXh0ZW5zaW9uL3N0b3JlJyxcclxuICAgIE5BTUU6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2V4dGVuc2lvbi9uYW1lJyxcclxuICAgIEVSUk9SOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9ib3QvZXJyb3InLFxyXG59O1xyXG5cclxudmFyIGNhY2hlID0ge1xyXG4gICAgbmFtZXM6IG5ldyBNYXAoKSxcclxufTtcclxuXHJcbi8vQnVpbGQgdGhlIGluaXRpYWwgbmFtZXMgbWFwXHJcbmdldFN0b3JlKCkudGhlbihzdG9yZSA9PiB7XHJcbiAgICBpZiAoc3RvcmUuc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChsZXQgZXggb2Ygc3RvcmUuZXh0ZW5zaW9ucykge1xyXG4gICAgICAgIGNhY2hlLm5hbWVzLnNldChleC5pZCwgZXgudGl0bGUpO1xyXG4gICAgfVxyXG59KS5jYXRjaChyZXBvcnRFcnJvcik7XHJcblxyXG5cclxuLyoqXHJcbiAqIFVzZWQgdG8gZ2V0IHB1YmxpYyBleHRlbnNpb25zXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldFN0b3JlKCkudGhlbihzdG9yZSA9PiBjb25zb2xlLmxvZyhzdG9yZSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byB1c2UgdGhlIGNhY2hlZCByZXNwb25zZSBzaG91bGQgYmUgY2xlYXJlZC5cclxuICogQHJldHVybiB7UHJvbWlzZX0gcmVzb2x2ZXMgd2l0aCB0aGUgcmVzcG9uc2VcclxuICovXHJcbmZ1bmN0aW9uIGdldFN0b3JlKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldFN0b3JlKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0U3RvcmUgPSBhamF4LmdldEpTT04oQVBJX1VSTFMuU1RPUkUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRTdG9yZTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBuYW1lIG9mIHRoZSBwcm92aWRlZCBleHRlbnNpb24gSUQuXHJcbiAqIElmIHRoZSBleHRlbnNpb24gd2FzIG5vdCBmb3VuZCwgcmVzb2x2ZXMgd2l0aCB0aGUgb3JpZ2luYWwgcGFzc2VkIElELlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRFeHRlbnNpb25OYW1lKCd0ZXN0JykudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKG5hbWUpKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkIHRoZSBpZCB0byBzZWFyY2ggZm9yLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSByZXNvbHZlcyB3aXRoIHRoZSBleHRlbnNpb24gbmFtZS5cclxuICovXHJcbmZ1bmN0aW9uIGdldEV4dGVuc2lvbk5hbWUoaWQpIHtcclxuICAgIGlmIChjYWNoZS5uYW1lcy5oYXMoaWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjYWNoZS5uYW1lcy5nZXQoaWQpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWpheC5wb3N0SlNPTihBUElfVVJMUy5OQU1FLCB7aWR9KS50aGVuKG5hbWUgPT4ge1xyXG4gICAgICAgIGNhY2hlLm5hbWVzLnNldChpZCwgbmFtZSk7XHJcbiAgICAgICAgcmV0dXJuIG5hbWU7XHJcbiAgICB9LCBlcnIgPT4ge1xyXG4gICAgICAgIHJlcG9ydEVycm9yKGVycik7XHJcbiAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVwb3J0cyBhbiBlcnJvciBzbyB0aGF0IGl0IGNhbiBiZSByZXZpZXdlZCBhbmQgZml4ZWQgYnkgZXh0ZW5zaW9uIG9yIGJvdCBkZXZlbG9wZXJzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiByZXBvcnRFcnJvcihFcnJvcihcIlJlcG9ydCBtZVwiKSk7XHJcbiAqIEBwYXJhbSB7RXJyb3J9IGVyciB0aGUgZXJyb3IgdG8gcmVwb3J0XHJcbiAqL1xyXG5mdW5jdGlvbiByZXBvcnRFcnJvcihlcnIpIHtcclxuICAgIGFqYXgucG9zdEpTT04oQVBJX1VSTFMuRVJST1IsIHtcclxuICAgICAgICAgICAgZXJyb3JfdGV4dDogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgIGVycm9yX2ZpbGU6IGVyci5maWxlbmFtZSxcclxuICAgICAgICAgICAgZXJyb3Jfcm93OiBlcnIubGluZW5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX2NvbHVtbjogZXJyLmNvbG5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX3N0YWNrOiBlcnIuc3RhY2sgfHwgJycsXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigocmVzcCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgdWkubm90aWZ5KCdTb21ldGhpbmcgd2VudCB3cm9uZywgaXQgaGFzIGJlZW4gcmVwb3J0ZWQuJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB1aS5ub3RpZnkoYEVycm9yIHJlcG9ydGluZyBleGNlcHRpb246ICR7cmVzcC5tZXNzYWdlfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcik7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZ2V0U3RvcmUsXHJcbiAgICBnZXRFeHRlbnNpb25OYW1lLFxyXG4gICAgcmVwb3J0RXJyb3IsXHJcbn07XHJcbiIsInZhciBhamF4ID0gcmVxdWlyZSgnLi9hamF4Jyk7XHJcbnZhciBob29rID0gcmVxdWlyZSgnLi9ob29rJyk7XHJcbnZhciBiaGZhbnNhcGkgPSByZXF1aXJlKCcuL2JoZmFuc2FwaScpO1xyXG5cclxuY29uc3Qgd29ybGRJZCA9IHdpbmRvdy53b3JsZElkO1xyXG52YXIgY2FjaGUgPSB7XHJcbiAgICBmaXJzdElkOiAwLFxyXG59O1xyXG5cclxuLy8gVXNlZCB0byBwYXJzZSBtZXNzYWdlcyBtb3JlIGFjY3VyYXRlbHlcclxudmFyIHdvcmxkID0ge1xyXG4gICAgbmFtZTogJycsXHJcbiAgICBvbmxpbmU6IFtdXHJcbn07XHJcbmdldE9ubGluZVBsYXllcnMoKVxyXG4gICAgLnRoZW4ocGxheWVycyA9PiB3b3JsZC5wbGF5ZXJzID0gWy4uLm5ldyBTZXQocGxheWVycy5jb25jYXQod29ybGQucGxheWVycykpXSk7XHJcblxyXG5nZXRXb3JsZE5hbWUoKVxyXG4gICAgLnRoZW4obmFtZSA9PiB3b3JsZC5uYW1lID0gbmFtZSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB3b3JsZFN0YXJ0ZWQsXHJcbiAgICBnZXRMb2dzLFxyXG4gICAgZ2V0TGlzdHMsXHJcbiAgICBnZXRIb21lcGFnZSxcclxuICAgIGdldE9ubGluZVBsYXllcnMsXHJcbiAgICBnZXRPd25lck5hbWUsXHJcbiAgICBnZXRXb3JsZE5hbWUsXHJcbiAgICBzZW5kLFxyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyBhZnRlciBzdGFydGluZyB0aGUgd29ybGQgaWYgbmVjY2Vzc2FyeSwgcmVqZWN0cyBpZiB0aGUgd29ybGQgdGFrZXMgdG9vIGxvbmcgdG8gc3RhcnQgb3IgaXMgdW5hdmFpbGlibGVcclxuICogUmVmYWN0b3Jpbmcgd2VsY29tZS4gVGhpcyBzZWVtcyBvdmVybHkgcHlyYW1pZCBsaWtlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB3b3JsZFN0YXJ0ZWQoKS50aGVuKCgpID0+IGNvbnNvbGUubG9nKCdzdGFydGVkIScpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVjaGVjayBpZiB0aGUgd29ybGQgaXMgc3RhcnRlZC5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHdvcmxkU3RhcnRlZChyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS53b3JsZFN0YXJ0ZWQpIHtcclxuICAgICAgICBjYWNoZS53b3JsZFN0YXJ0ZWQgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHZhciBmYWlscyA9IDA7XHJcbiAgICAgICAgICAgIChmdW5jdGlvbiBjaGVjaygpIHtcclxuICAgICAgICAgICAgICAgIC8vIENvdWxkIHRoaXMgYmUgbW9yZSBzaW1wbGlmaWVkP1xyXG4gICAgICAgICAgICAgICAgYWpheC5wb3N0SlNPTignL2FwaScsIHsgY29tbWFuZDogJ3N0YXR1cycsIHdvcmxkSWQgfSkudGhlbihyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChyZXNwb25zZS53b3JsZFN0YXR1cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdvbmxpbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnb2ZmbGluZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhamF4LnBvc3RKU09OKCcvYXBpJywgeyBjb21tYW5kOiAnc3RhcnQnLCB3b3JsZElkIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oY2hlY2ssIGNoZWNrKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd1bmF2YWlsaWJsZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignV29ybGQgdW5hdmFpbGlibGUuJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzdGFydHVwJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc2h1dGRvd24nOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVjaywgMzAwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKytmYWlscyA+IDEwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ1dvcmxkIHRvb2sgdG9vIGxvbmcgdG8gc3RhcnQuJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignVW5rbm93biByZXNwb25zZS4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKTtcclxuICAgICAgICAgICAgfSgpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUud29ybGRTdGFydGVkO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgdGhlIGxvZydzIGxpbmVzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMb2dzKCkudGhlbihsaW5lcyA9PiBjb25zb2xlLmxvZyhsaW5lc1swXSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWRvd25sb2FkIHRoZSBsb2dzXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMb2dzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldExvZ3MpIHtcclxuICAgICAgICBjYWNoZS5nZXRMb2dzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbG9ncy8ke3dvcmxkSWR9YCkpXHJcbiAgICAgICAgICAgIC50aGVuKGxvZyA9PiBsb2cuc3BsaXQoJ1xcbicpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0TG9ncztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIGEgbGlzdCBvZiBhZG1pbnMsIG1vZHMsIHN0YWZmIChhZG1pbnMgKyBtb2RzKSwgd2hpdGVsaXN0LCBhbmQgYmxhY2tsaXN0LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMaXN0cygpLnRoZW4obGlzdHMgPT4gY29uc29sZS5sb2cobGlzdHMuYWRtaW4pKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmZXRjaCB0aGUgbGlzdHMuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMaXN0cyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRMaXN0cykge1xyXG4gICAgICAgIGNhY2hlLmdldExpc3RzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbGlzdHMvJHt3b3JsZElkfWApKVxyXG4gICAgICAgICAgICAudGhlbihodG1sID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldExpc3QobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gZG9jLnF1ZXJ5U2VsZWN0b3IoYHRleHRhcmVhW25hbWU9JHtuYW1lfV1gKVxyXG4gICAgICAgICAgICAgICAgICAgIC52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIC50b0xvY2FsZVVwcGVyQ2FzZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCdcXG4nKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWy4uLm5ldyBTZXQobGlzdCldOyAvL1JlbW92ZSBkdXBsaWNhdGVzXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGxpc3RzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFkbWluOiBnZXRMaXN0KCdhZG1pbnMnKSxcclxuICAgICAgICAgICAgICAgICAgICBtb2Q6IGdldExpc3QoJ21vZGxpc3QnKSxcclxuICAgICAgICAgICAgICAgICAgICB3aGl0ZTogZ2V0TGlzdCgnd2hpdGVsaXN0JyksXHJcbiAgICAgICAgICAgICAgICAgICAgYmxhY2s6IGdldExpc3QoJ2JsYWNrbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGxpc3RzLm1vZCA9IGxpc3RzLm1vZC5maWx0ZXIobmFtZSA9PiAhbGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgbGlzdHMuc3RhZmYgPSBsaXN0cy5hZG1pbi5jb25jYXQobGlzdHMubW9kKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdHM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRMaXN0cztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSBob21lcGFnZSBvZiB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiBjb25zb2xlLmxvZyhodG1sLnN1YnN0cmluZygwLCAxMDApKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZmV0Y2ggdGhlIHBhZ2UuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRIb21lcGFnZShyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRIb21lcGFnZSkge1xyXG4gICAgICAgIGNhY2hlLmdldEhvbWVwYWdlID0gYWpheC5nZXQoYC93b3JsZHMvJHt3b3JsZElkfWApXHJcbiAgICAgICAgICAgIC5jYXRjaCgoKSA9PiBnZXRIb21lcGFnZSh0cnVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldEhvbWVwYWdlO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgcGxheWVyIG5hbWVzLlxyXG4gKiBBbiBvbmxpbmUgbGlzdCBpcyBtYWludGFpbmVkIGJ5IHRoZSBib3QsIHRoaXMgc2hvdWxkIGdlbmVyYWxseSBub3QgYmUgdXNlZC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T25saW5lUGxheWVycygpLnRoZW4ob25saW5lID0+IHsgZm9yIChsZXQgbiBvZiBvbmxpbmUpIHsgY29uc29sZS5sb2cobiwgJ2lzIG9ubGluZSEnKX19KTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmcmVzaCB0aGUgb25saW5lIG5hbWVzLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T25saW5lUGxheWVycyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0T25saW5lUGxheWVycyA9IGdldEhvbWVwYWdlKHRydWUpXHJcbiAgICAgICAgICAgIC50aGVuKChodG1sKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJFbGVtcyA9IGRvYy5xdWVyeVNlbGVjdG9yKCcubWFuYWdlci5wYWRkZWQ6bnRoLWNoaWxkKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAucXVlcnlTZWxlY3RvckFsbCgndHI6bm90KC5oaXN0b3J5KSA+IHRkLmxlZnQnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgQXJyYXkuZnJvbShwbGF5ZXJFbGVtcykuZm9yRWFjaCgoZWwpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJzLnB1c2goZWwudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGxheWVycztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldE9ubGluZVBsYXllcnM7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgc2VydmVyIG93bmVyJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T3duZXJOYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBpcyBvd25lZCBieScsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE93bmVyTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcuc3ViaGVhZGVyfnRyPnRkOm5vdChbY2xhc3NdKScpLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIHdvcmxkJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0V29ybGROYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBuYW1lOicsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldFdvcmxkTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcjdGl0bGUnKS50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZW5kcyBhIG1lc3NhZ2UsIHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiBzZW50IG9yIHJlamVjdHMgb24gZmFpbHVyZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2VuZCgnaGVsbG8hJykudGhlbigoKSA9PiBjb25zb2xlLmxvZygnc2VudCcpKS5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gc2VuZC5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHNlbmQobWVzc2FnZSkge1xyXG4gICAgcmV0dXJuIGFqYXgucG9zdEpTT04oYC9hcGlgLCB7Y29tbWFuZDogJ3NlbmQnLCBtZXNzYWdlLCB3b3JsZElkfSlcclxuICAgICAgICAudGhlbihyZXNwID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlc3Auc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXNwO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4ocmVzcCA9PiB7XHJcbiAgICAgICAgICAgIC8vSGFuZGxlIGhvb2tzXHJcbiAgICAgICAgICAgIGhvb2suZmlyZSgnd29ybGQuc2VuZCcsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBob29rLmZpcmUoJ3dvcmxkLnNlcnZlcm1lc3NhZ2UnLCBtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgIC8vRGlzYWxsb3cgY29tbWFuZHMgc3RhcnRpbmcgd2l0aCBzcGFjZS5cclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpICYmICFtZXNzYWdlLnN0YXJ0c1dpdGgoJy8gJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFyZ3MgPSAnJztcclxuICAgICAgICAgICAgICAgIGlmIChjb21tYW5kLmluY2x1ZGVzKCcgJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBtZXNzYWdlLnN1YnN0cmluZyhtZXNzYWdlLmluZGV4T2YoJyAnKSArIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsICdTRVJWRVInLCBjb21tYW5kLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3A7XHJcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgaWYgKGVyciA9PSAnV29ybGQgbm90IHJ1bm5pbmcuJykge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuZmlyc3RJZCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIHdhdGNoIGNoYXQuXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja0NoYXQoKSB7XHJcbiAgICBnZXRNZXNzYWdlcygpLnRoZW4oKG1zZ3MpID0+IHtcclxuICAgICAgICBtc2dzLmZvckVhY2goKG1lc3NhZ2UpID0+IHtcclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChgJHt3b3JsZC5uYW1lfSAtIFBsYXllciBDb25uZWN0ZWQgYCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBbLCBuYW1lLCBpcF0gPSBtZXNzYWdlLm1hdGNoKC8gLSBQbGF5ZXIgQ29ubmVjdGVkICguKikgXFx8IChbXFxkLl0rKSBcXHwgKFtcXHddezMyfSlcXHMqJC8pO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlSm9pbk1lc3NhZ2VzKG5hbWUsIGlwKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkLm5hbWV9IC0gUGxheWVyIERpc2Nvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBtZXNzYWdlLnN1YnN0cmluZyh3b3JsZC5uYW1lLmxlbmd0aCArIDIzKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJzogJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gZ2V0VXNlcm5hbWUobWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbXNnID0gbWVzc2FnZS5zdWJzdHJpbmcobmFtZS5sZW5ndGggKyAyKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtc2cpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZU90aGVyTWVzc2FnZXMobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcilcclxuICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQ2hhdCwgNTAwMCk7XHJcbiAgICB9KTtcclxufVxyXG5jaGVja0NoYXQoKTtcclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2V0IHRoZSBsYXRlc3QgY2hhdCBtZXNzYWdlcy5cclxuICpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE1lc3NhZ2VzKCkge1xyXG4gICAgcmV0dXJuIHdvcmxkU3RhcnRlZCgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5wb3N0SlNPTihgL2FwaWAsIHsgY29tbWFuZDogJ2dldGNoYXQnLCB3b3JsZElkLCBmaXJzdElkOiBjYWNoZS5maXJzdElkIH0pKVxyXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT0gJ29rJyAmJiBkYXRhLm5leHRJZCAhPSBjYWNoZS5maXJzdElkKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5maXJzdElkID0gZGF0YS5uZXh0SWQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5sb2c7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5zdGF0dXMgPT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHdobyBzZW50IGEgbWVzc2FnZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIG5hbWUgPSBnZXRVc2VybmFtZSgnU0VSVkVSOiBIaSB0aGVyZSEnKTtcclxuICogLy9uYW1lID09ICdTRVJWRVInXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIHBhcnNlLlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBuYW1lIG9mIHRoZSB1c2VyIHdobyBzZW50IHRoZSBtZXNzYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0VXNlcm5hbWUobWVzc2FnZSkge1xyXG4gICAgZm9yIChsZXQgaSA9IDE4OyBpID4gNDsgaS0tKSB7XHJcbiAgICAgICAgbGV0IHBvc3NpYmxlTmFtZSA9IG1lc3NhZ2Uuc3Vic3RyaW5nKDAsIG1lc3NhZ2UubGFzdEluZGV4T2YoJzogJywgaSkpO1xyXG4gICAgICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMocG9zc2libGVOYW1lKSB8fCBwb3NzaWJsZU5hbWUgPT0gJ1NFUlZFUicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBvc3NpYmxlTmFtZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBTaG91bGQgaWRlYWxseSBuZXZlciBoYXBwZW4uXHJcbiAgICByZXR1cm4gbWVzc2FnZS5zdWJzdHJpbmcoMCwgbWVzc2FnZS5sYXN0SW5kZXhPZignOiAnLCAxOCkpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgam9pbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgam9pbmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IGlwIHRoZSBpcCBvZiB0aGUgcGxheWVyIGpvaW5pbmcuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVKb2luTWVzc2FnZXMobmFtZSwgaXApIHtcclxuICAgIGlmICghd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQuam9pbicsIG5hbWUsIGlwKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgZGlzY29ubmVjdGlvbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgbGVhdmluZy5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSkge1xyXG4gICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5zcGxpY2Uod29ybGQub25saW5lLmluZGV4T2YobmFtZSksIDEpO1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLmxlYXZlJywgbmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHVzZXIgY2hhdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdXNlci5cclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2Ugc2VudC5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICBpZiAobmFtZSA9PSAnU0VSVkVSJykge1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLnNlcnZlcmNoYXQnLCBtZXNzYWdlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQubWVzc2FnZScsIG5hbWUsIG1lc3NhZ2UpO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSAmJiAhbWVzc2FnZS5zdGFydHNXaXRoKCcvICcpKSB7XHJcblxyXG4gICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgIGxldCBhcmdzID0gJyc7XHJcbiAgICAgICAgaWYgKGNvbW1hbmQuaW5jbHVkZXMoJyAnKSkge1xyXG4gICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICBhcmdzID0gbWVzc2FnZS5zdWJzdHJpbmcobWVzc2FnZS5pbmRleE9mKCcgJykgKyAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsIG5hbWUsIGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgICAgIHJldHVybjsgLy9ub3QgY2hhdFxyXG4gICAgfVxyXG5cclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLmNoYXQnLCBuYW1lLCBtZXNzYWdlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIGhhbmRsZSBtZXNzYWdlcyB3aGljaCBhcmUgbm90IHNpbXBseSBwYXJzZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIGhhbmRsZVxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlT3RoZXJNZXNzYWdlcyhtZXNzYWdlKSB7XHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5vdGhlcicsIG1lc3NhZ2UpO1xyXG59XHJcbiIsInZhciBsaXN0ZW5lcnMgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGJlZ2luIGxpc3RlbmluZyB0byBhbiBldmVudC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogbGlzdGVuKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogLy9hbHRlcm5hdGl2ZWx5XHJcbiAqIG9uKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0aGUgZXZlbnQgaGFuZGxlclxyXG4gKi9cclxuZnVuY3Rpb24gbGlzdGVuKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIGxpc3RlbmVyc1trZXldID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XS5pbmNsdWRlcyhjYWxsYmFjaykpIHtcclxuICAgICAgICBsaXN0ZW5lcnNba2V5XS5wdXNoKGNhbGxiYWNrKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHN0b3AgbGlzdGVuaW5nIHRvIGFuIGV2ZW50LiBJZiB0aGUgbGlzdGVuZXIgd2FzIG5vdCBmb3VuZCwgbm8gYWN0aW9uIHdpbGwgYmUgdGFrZW4uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vRWFybGllciBhdHRhY2hlZCBteUZ1bmMgdG8gJ2V2ZW50J1xyXG4gKiByZW1vdmUoJ2V2ZW50JywgbXlGdW5jKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gc3RvcCBsaXN0ZW5pbmcgdG8uXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRoZSBjYWxsYmFjayB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQgbGlzdGVuZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKGxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgaWYgKGxpc3RlbmVyc1trZXldLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICBsaXN0ZW5lcnNba2V5XS5zcGxpY2UobGlzdGVuZXJzW2tleV0uaW5kZXhPZihjYWxsYmFjayksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNhbGwgZXZlbnRzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBjaGVjaygndGVzdCcsIDEsIDIsIDMpO1xyXG4gKiBjaGVjaygndGVzdCcsIHRydWUpO1xyXG4gKiAvLyBhbHRlcm5hdGl2ZWx5XHJcbiAqIGZpcmUoJ3Rlc3QnLCAxLCAyLCAzKTtcclxuICogZmlyZSgndGVzdCcsIHRydWUpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBjYWxsLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhcmd1bWVudHMgdG8gcGFzcyB0byBsaXN0ZW5pbmcgZnVuY3Rpb25zLlxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2soa2V5LCAuLi5hcmdzKSB7XHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGlzdGVuZXJzW2tleV0uZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lcikge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVyKC4uLmFyZ3MpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgdmFsdWUgYmFzZWQgb24gaW5wdXQgZnJvbSBsaXN0ZW5lcnMuXHJcbiAqXHJcbiAqIEBkZXByaWNhdGVkIHNpbmNlIDYuMS4wLiBJbnN0ZWFkLCB1cGRhdGUgcmVxdWVzdHMgc2hvdWxkIGJlIGhhbmRsZWQgYnkgdGhlIGV4dGVuc2lvbiBpdGVzZWxmLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1cGRhdGUoJ2V2ZW50JywgdHJ1ZSwgMSwgMiwgMyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGNhbGxcclxuICogQHBhcmFtIHttaXhlZH0gaW5pdGlhbCB0aGUgaW5pdGlhbCB2YWx1ZSB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIHVwZGF0ZShrZXksIGluaXRpYWwsIC4uLmFyZ3MpIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIHJldHVybiBpbml0aWFsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsaXN0ZW5lcnNba2V5XS5yZWR1Y2UoZnVuY3Rpb24ocHJldmlvdXMsIGN1cnJlbnQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gY3VycmVudChwcmV2aW91cywgLi4uYXJncyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91cztcclxuICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcHJldmlvdXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgaW5pdGlhbCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbGlzdGVuLFxyXG4gICAgb246IGxpc3RlbixcclxuICAgIHJlbW92ZSxcclxuICAgIGNoZWNrLFxyXG4gICAgZmlyZTogY2hlY2ssXHJcbiAgICB1cGRhdGUsXHJcbn07XHJcbiIsImZ1bmN0aW9uIHVwZGF0ZShrZXlzLCBvcGVyYXRvcikge1xyXG4gICAgT2JqZWN0LmtleXMobG9jYWxTdG9yYWdlKS5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBvZiBrZXlzKSB7XHJcbiAgICAgICAgICAgIGlmIChpdGVtLnN0YXJ0c1dpdGgoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oaXRlbSwgb3BlcmF0b3IobG9jYWxTdG9yYWdlLmdldEl0ZW0oaXRlbSkpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vanNoaW50IC1XMDg2XHJcbi8vTm8gYnJlYWsgc3RhdGVtZW50cyBhcyB3ZSB3YW50IHRvIGV4ZWN1dGUgYWxsIHVwZGF0ZXMgYWZ0ZXIgbWF0Y2hlZCB2ZXJzaW9uLlxyXG5zd2l0Y2ggKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdtYl92ZXJzaW9uJykpIHtcclxuICAgIGNhc2UgbnVsbDpcclxuICAgICAgICBicmVhazsgLy9Ob3RoaW5nIHRvIG1pZ3JhdGVcclxuICAgIGNhc2UgJzUuMi4wJzpcclxuICAgIGNhc2UgJzUuMi4xJzpcclxuICAgICAgICAvL1dpdGggNi4wLCBuZXdsaW5lcyBhcmUgZGlyZWN0bHkgc3VwcG9ydGVkIGluIG1lc3NhZ2VzIGJ5IHRoZSBib3QuXHJcbiAgICAgICAgdXBkYXRlKFsnYW5ub3VuY2VtZW50QXJyJywgJ2pvaW5BcnInLCAnbGVhdmVBcnInLCAndHJpZ2dlckFyciddLCBmdW5jdGlvbihyYXcpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdyk7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtc2cubWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cubWVzc2FnZSA9IG1zZy5tZXNzYWdlLnJlcGxhY2UoL1xcXFxuL2csICdcXG4nKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXJzZWQpO1xyXG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByYXc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBicmVhazsgLy9OZXh0IGJ1Z2ZpeCBvbmx5IHJlbGF0ZXMgdG8gNi4wIGJvdC5cclxuICAgIGNhc2UgJzYuMC4wYSc6XHJcbiAgICBjYXNlICc2LjAuMCc6XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgd2luZG93LmJvdHVpLmFsZXJ0KFwiRHVlIHRvIGEgYnVnIGluIHRoZSA2LjAuMCB2ZXJzaW9uIG9mIHRoZSBib3QsIHlvdXIgam9pbiBhbmQgbGVhdmUgbWVzc2FnZXMgbWF5IGJlIHN3YXBwZWQuIFNvcnJ5ISBUaGlzIGNhbm5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5LiBUaGlzIG1lc3NhZ2Ugd2lsbCBub3QgYmUgc2hvd24gYWdhaW4uXCIpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgICAgIGJyZWFrOyAvL05leHQgYnVnZml4IG9ubHkgcmVsYXRlcyB0byA2LjAuMSAvIDYuMC4yLlxyXG4gICAgY2FzZSAnNi4wLjEnOlxyXG4gICAgY2FzZSAnNi4wLjInOlxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5ib3R1aS5hbGVydChcIkR1ZSB0byBhIGJ1ZyBpbiA2LjAuMSAvIDYuMC4yLCBncm91cHMgbWF5IGhhdmUgYmVlbiBtaXhlZCB1cCBvbiBKb2luLCBMZWF2ZSwgYW5kIFRyaWdnZXIgbWVzc2FnZXMuIFNvcnJ5ISBUaGlzIGNhbm5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5IGlmIGl0IG9jY3VyZWQgb24geW91ciBib3QuIEFubm91bmNlbWVudHMgaGF2ZSBhbHNvIGJlZW4gZml4ZWQuXCIpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgY2FzZSAnNi4wLjMnOlxyXG4gICAgY2FzZSAnNi4wLjQnOlxyXG4gICAgY2FzZSAnNi4wLjUnOlxyXG59XHJcbi8vanNoaW50ICtXMDg2XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZ2V0U3RyaW5nLFxyXG4gICAgZ2V0T2JqZWN0LFxyXG4gICAgc2V0LFxyXG4gICAgY2xlYXJOYW1lc3BhY2UsXHJcbn07XHJcblxyXG4vL1JFVklFVzogSXMgdGhlcmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/IHJlcXVpcmUoJy4vY29uZmlnJykgbWF5YmU/XHJcbmNvbnN0IE5BTUVTUEFDRSA9IHdpbmRvdy53b3JsZElkO1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdHJpbmcgZnJvbSB0aGUgc3RvcmFnZSBpZiBpdCBleGlzdHMgYW5kIHJldHVybnMgaXQsIG90aGVyd2lzZSByZXR1cm5zIGZhbGxiYWNrLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgeCA9IGdldFN0cmluZygnc3RvcmVkX3ByZWZzJywgJ25vdGhpbmcnKTtcclxuICogdmFyIHkgPSBnZXRTdHJpbmcoJ3N0b3JlZF9wcmVmcycsICdub3RoaW5nJywgZmFsc2UpO1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBrZXkgdG8gcmV0cmlldmUuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGZhbGxiYWNrIHdoYXQgdG8gcmV0dXJuIGlmIHRoZSBrZXkgd2FzIG5vdCBmb3VuZC5cclxuICogQHBhcmFtIHtib29sfSBbbG9jYWw9dHJ1ZV0gd2hldGhlciBvciBub3QgdG8gdXNlIGEgbmFtZXNwYWNlIHdoZW4gY2hlY2tpbmcgZm9yIHRoZSBrZXkuXHJcbiAqIEByZXR1cm4ge21peGVkfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0U3RyaW5nKGtleSwgZmFsbGJhY2ssIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmIChsb2NhbCkge1xyXG4gICAgICAgIHJlc3VsdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGAke2tleX0ke05BTUVTUEFDRX1gKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKHJlc3VsdCA9PT0gbnVsbCkgPyBmYWxsYmFjayA6IHJlc3VsdDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdG9yZWQgb2JqZWN0IGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIHJldHVybnMgZmFsbGJhY2suXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB4ID0gZ2V0T2JqZWN0KCdzdG9yZWRfa2V5JywgWzEsIDIsIDNdKTtcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgaXRlbSB0byByZXRyaWV2ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZmFsbGJhY2sgd2hhdCB0byByZXR1cm4gaWYgdGhlIGl0ZW0gZG9lcyBub3QgZXhpc3Qgb3IgZmFpbHMgdG8gcGFyc2UgY29ycmVjdGx5LlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIG9yIG5vdCBhIG5hbWVzcGFjZSBzaG91bGQgYmUgdXNlZC5cclxuICogQHJldHVybiB7bWl4ZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPYmplY3Qoa2V5LCBmYWxsYmFjaywgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gZ2V0U3RyaW5nKGtleSwgZmFsc2UsIGxvY2FsKTtcclxuXHJcbiAgICBpZiAoIXJlc3VsdCkge1xyXG4gICAgICAgIHJldHVybiBmYWxsYmFjaztcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UocmVzdWx0KTtcclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogU2V0cyBhbiBvYmplY3QgaW4gdGhlIHN0b3JhZ2UsIHN0cmluZ2lmeWluZyBpdCBmaXJzdCBpZiBuZWNjZXNzYXJ5LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ3NvbWVfa2V5Jywge2E6IFsxLCAyLCAzXSwgYjogJ3Rlc3QnfSk7XHJcbiAqIC8vcmV0dXJucyAne1wiYVwiOlsxLDIsM10sXCJiXCI6XCJ0ZXN0XCJ9J1xyXG4gKiBnZXRTdHJpbmcoJ3NvbWVfa2V5Jyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGl0ZW0gdG8gb3ZlcndyaXRlIG9yIGNyZWF0ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZGF0YSBhbnkgc3RyaW5naWZ5YWJsZSB0eXBlLlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIHRvIHNhdmUgdGhlIGl0ZW0gd2l0aCBhIG5hbWVzcGFjZS5cclxuICovXHJcbmZ1bmN0aW9uIHNldChrZXksIGRhdGEsIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgaWYgKGxvY2FsKSB7XHJcbiAgICAgICAga2V5ID0gYCR7a2V5fSR7TkFNRVNQQUNFfWA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBkYXRhID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBkYXRhKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCBpdGVtcyBzdGFydGluZyB3aXRoIG5hbWVzcGFjZSBmcm9tIHRoZSBzdG9yYWdlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ2tleV90ZXN0JywgMSk7XHJcbiAqIHNldCgna2V5X3Rlc3QyJywgMik7XHJcbiAqIGNsZWFyTmFtZXNwYWNlKCdrZXlfJyk7IC8vYm90aCBrZXlfdGVzdCBhbmQga2V5X3Rlc3QyIGhhdmUgYmVlbiByZW1vdmVkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZXNwYWNlIHRoZSBwcmVmaXggdG8gY2hlY2sgZm9yIHdoZW4gcmVtb3ZpbmcgaXRlbXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBjbGVhck5hbWVzcGFjZShuYW1lc3BhY2UpIHtcclxuICAgIE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aChuYW1lc3BhY2UpKSB7XHJcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3QgYXBpID0gcmVxdWlyZSgnLi9ibG9ja2hlYWRzJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJy4vaG9vaycpO1xyXG5cclxuY29uc3QgU1RPUkFHRSA9IHtcclxuICAgIFBMQVlFUlM6ICdtYl9wbGF5ZXJzJyxcclxuICAgIExPR19MT0FEOiAnbWJfbGFzdExvZ0xvYWQnLFxyXG59O1xyXG5cclxudmFyIHdvcmxkID0gbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW10sXHJcbiAgICBvd25lcjogJycsXHJcbiAgICBwbGF5ZXJzOiBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFLlBMQVlFUlMsIHt9KSxcclxuICAgIGxpc3RzOiB7YWRtaW46IFtdLCBtb2Q6IFtdLCBzdGFmZjogW10sIGJsYWNrOiBbXSwgd2hpdGU6IFtdfSxcclxuICAgIGlzUGxheWVyLFxyXG4gICAgaXNBZG1pbixcclxuICAgIGlzTW9kLFxyXG4gICAgaXNTdGFmZixcclxuICAgIGlzT3duZXIsXHJcbiAgICBpc09ubGluZSxcclxuICAgIGdldEpvaW5zLFxyXG59O1xyXG52YXIgbGlzdHMgPSB3b3JsZC5saXN0cztcclxuXHJcbmZ1bmN0aW9uIGlzUGxheWVyKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5wbGF5ZXJzLmhhc093blByb3BlcnR5KG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzQWRtaW4obmFtZSkge1xyXG4gICAgcmV0dXJuIGxpc3RzLmFkbWluLmluY2x1ZGVzKG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzTW9kKG5hbWUpIHtcclxuICAgIHJldHVybiBsaXN0cy5tb2QuaW5jbHVkZXMobmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNTdGFmZihuYW1lKSB7XHJcbiAgICByZXR1cm4gaXNBZG1pbihuYW1lKSB8fCBpc01vZChuYW1lKTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNPd25lcihuYW1lKSB7XHJcbiAgICByZXR1cm4gd29ybGQub3duZXIgPT0gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc09ubGluZShuYW1lKSB7XHJcbiAgICByZXR1cm4gd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEpvaW5zKG5hbWUpIHtcclxuICAgIHJldHVybiBpc1BsYXllcihuYW1lKSA/IHdvcmxkLnBsYXllcnNbbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpXS5qb2lucyA6IDA7XHJcbn1cclxuXHJcbi8vIEtlZXAgdGhlIG9ubGluZSBsaXN0IHVwIHRvIGRhdGVcclxuaG9vay5vbignd29ybGQuam9pbicsIGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIGlmICghd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcbn0pO1xyXG5ob29rLm9uKCd3b3JsZC5sZWF2ZScsIGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICB3b3JsZC5vbmxpbmUuc3BsaWNlKHdvcmxkLm9ubGluZS5pbmRleE9mKG5hbWUpLCAxKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vLyBLZWVwIHBsYXllcnMgbGlzdCB1cCB0byBkYXRlXHJcbmhvb2sub24oJ3dvcmxkLmpvaW4nLCBjaGVja1BsYXllckpvaW4pO1xyXG5cclxuZnVuY3Rpb24gYnVpbGRTdGFmZkxpc3QoKSB7XHJcbiAgICBsaXN0cy5tb2QgPSBsaXN0cy5tb2QuZmlsdGVyKChuYW1lKSA9PiAhbGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZSkpO1xyXG4gICAgbGlzdHMuc3RhZmYgPSBsaXN0cy5hZG1pbi5jb25jYXQobGlzdHMubW9kKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGVybWlzc2lvbkNoZWNrKG5hbWUsIGNvbW1hbmQpIHtcclxuICAgIGNvbW1hbmQgPSBjb21tYW5kLnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgaWYgKFsnYWRtaW4nLCAndW5hZG1pbicsICdtb2QnLCAndW5tb2QnXS5pbmNsdWRlcyhjb21tYW5kKSkge1xyXG4gICAgICAgIHJldHVybiBsaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoWyd3aGl0ZWxpc3QnLCAndW53aGl0ZWxpc3QnLCAnYmFuJywgJ3VuYmFuJ10uaW5jbHVkZXMoY29tbWFuZCkpIHtcclxuICAgICAgICByZXR1cm4gbGlzdHMuc3RhZmYuaW5jbHVkZXMobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vLyBLZWVwIGxpc3RzIHVwIHRvIGRhdGVcclxuaG9vay5vbignd29ybGQuY29tbWFuZCcsIGZ1bmN0aW9uKG5hbWUsIGNvbW1hbmQsIHRhcmdldCkge1xyXG4gICAgaWYgKCFwZXJtaXNzaW9uQ2hlY2sobmFtZSwgY29tbWFuZCkpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHVuID0gY29tbWFuZC5zdGFydHNXaXRoKCd1bicpO1xyXG5cclxuICAgIHZhciBncm91cCA9IHtcclxuICAgICAgICBhZG1pbjogJ2FkbWluJyxcclxuICAgICAgICBtb2Q6ICdtb2QnLFxyXG4gICAgICAgIHdoaXRlbGlzdDogJ3doaXRlJyxcclxuICAgICAgICBiYW46ICdibGFjaycsXHJcbiAgICB9W3VuID8gY29tbWFuZC5zdWJzdHIoMikgOiBjb21tYW5kXTtcclxuXHJcbiAgICBpZiAodW4gJiYgbGlzdHNbZ3JvdXBdLmluY2x1ZGVzKHRhcmdldCkpIHtcclxuICAgICAgICBsaXN0c1tncm91cF0uc3BsaWNlKGxpc3RzW2dyb3VwXS5pbmRleE9mKHRhcmdldCksIDEpO1xyXG4gICAgICAgIGJ1aWxkU3RhZmZMaXN0KCk7XHJcbiAgICB9IGVsc2UgaWYgKCF1biAmJiAhbGlzdHNbZ3JvdXBdLmluY2x1ZGVzKHRhcmdldCkpIHtcclxuICAgICAgICBsaXN0c1tncm91cF0ucHVzaCh0YXJnZXQpO1xyXG4gICAgICAgIGJ1aWxkU3RhZmZMaXN0KCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gQWRkIGEgcGxheWVyIGpvaW5cclxuZnVuY3Rpb24gY2hlY2tQbGF5ZXJKb2luKG5hbWUsIGlwKSB7XHJcbiAgICBpZiAod29ybGQucGxheWVycy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xyXG4gICAgICAgIC8vUmV0dXJuaW5nIHBsYXllclxyXG4gICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uam9pbnMrKztcclxuICAgICAgICBpZiAoIXdvcmxkLnBsYXllcnNbbmFtZV0uaXBzLmluY2x1ZGVzKGlwKSkge1xyXG4gICAgICAgICAgICB3b3JsZC5wbGF5ZXJzW25hbWVdLmlwcy5wdXNoKGlwKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vTmV3IHBsYXllclxyXG4gICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0gPSB7am9pbnM6IDEsIGlwczogW2lwXX07XHJcbiAgICB9XHJcbiAgICB3b3JsZC5wbGF5ZXJzW25hbWVdLmlwID0gaXA7XHJcblxyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRS5QTEFZRVJTLCB3b3JsZC5wbGF5ZXJzKTtcclxufVxyXG5cclxuXHJcbi8vIFVwZGF0ZSBsaXN0c1xyXG5Qcm9taXNlLmFsbChbYXBpLmdldExpc3RzKCksIGFwaS5nZXRXb3JsZE5hbWUoKSwgYXBpLmdldE93bmVyTmFtZSgpXSlcclxuICAgIC50aGVuKCh2YWx1ZXMpID0+IHtcclxuICAgICAgICB2YXIgW2FwaUxpc3RzLCB3b3JsZE5hbWUsIG93bmVyXSA9IHZhbHVlcztcclxuXHJcbiAgICAgICAgLy9SZW1vdmUgdGhlIG93bmVyICYgU0VSVkVSIGZyb20gdGhlIG1vZCBsaXN0cyBhbmQgYWRkIHRvIGFkbWluIC8gc3RhZmYgbGlzdHMuXHJcbiAgICAgICAgW293bmVyLCAnU0VSVkVSJ10uZm9yRWFjaChuYW1lID0+IHtcclxuICAgICAgICAgICAgaWYgKCFhcGlMaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgYXBpTGlzdHMuYWRtaW4ucHVzaChuYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB3b3JsZC5saXN0cyA9IGFwaUxpc3RzO1xyXG4gICAgICAgIGJ1aWxkU3RhZmZMaXN0KCk7XHJcbiAgICAgICAgd29ybGQubmFtZSA9IHdvcmxkTmFtZTtcclxuICAgICAgICB3b3JsZC5vd25lciA9IG93bmVyO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuXHJcbi8vIFVwZGF0ZSBwbGF5ZXJzIHNpbmNlIGxhc3QgYm90IGxvYWRcclxuUHJvbWlzZS5hbGwoW2FwaS5nZXRMb2dzKCksIGFwaS5nZXRXb3JsZE5hbWUoKV0pXHJcbiAgICAudGhlbigodmFsdWVzKSA9PiB7XHJcbiAgICAgICAgdmFyIFtsaW5lcywgd29ybGROYW1lXSA9IHZhbHVlcztcclxuXHJcbiAgICAgICAgdmFyIGxhc3QgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFLkxPR19MT0FELCAwKTtcclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFLkxPR19MT0FELCBNYXRoLmZsb29yKERhdGUubm93KCkudmFsdWVPZigpKSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGxpbmUgb2YgbGluZXMpIHtcclxuICAgICAgICAgICAgbGV0IHRpbWUgPSBuZXcgRGF0ZShsaW5lLnN1YnN0cmluZygwLCBsaW5lLmluZGV4T2YoJ2InKSkucmVwbGFjZSgnICcsICdUJykucmVwbGFjZSgnICcsICdaJykpO1xyXG4gICAgICAgICAgICBsZXQgbWVzc2FnZSA9IGxpbmUuc3Vic3RyaW5nKGxpbmUuaW5kZXhPZignXScpICsgMik7XHJcblxyXG4gICAgICAgICAgICBpZiAodGltZSA8IGxhc3QpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkTmFtZX0gLSBQbGF5ZXIgQ29ubmVjdGVkIGApKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcGFydHMgPSBsaW5lLnN1YnN0cihsaW5lLmluZGV4T2YoJyAtIFBsYXllciBDb25uZWN0ZWQgJykgKyAyMCk7IC8vTkFNRSB8IElQIHwgSURcclxuICAgICAgICAgICAgICAgIGxldCBbLCBuYW1lLCBpcF0gPSBwYXJ0cy5tYXRjaCgvKC4qKSBcXHwgKFtcXHcuXSspIFxcfCAuezMyfVxccyovKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjaGVja1BsYXllckpvaW4obmFtZSwgaXApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFLlBMQVlFUlMsIHdvcmxkLnBsYXllcnMpO1xyXG4gICAgfSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgnYXBwL3VpJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3Qgc2VuZCA9IHJlcXVpcmUoJ2FwcC9ib3QnKS5zZW5kO1xyXG5jb25zdCBwcmVmZXJlbmNlcyA9IHJlcXVpcmUoJ2FwcC9zZXR0aW5ncycpO1xyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignQW5ub3VuY2VtZW50cycsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gSU5DTFVERV9GSUxFKCcvZGV2L21lc3NhZ2VzL2Fubm91bmNlbWVudHMvdGFiLmh0bWwnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbn07XHJcblxyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKHRleHQgPSAnJykge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjYVRlbXBsYXRlJywgJyNhTXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IHRleHR9XHJcbiAgICBdKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIGFubm91bmNlbWVudHMgPSBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcubScpKVxyXG4gICAgICAgIC5tYXAoZWwgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4ge21lc3NhZ2U6IGVsLnZhbHVlfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldCgnYW5ub3VuY2VtZW50QXJyJywgYW5ub3VuY2VtZW50cyk7XHJcbn1cclxuXHJcbi8vIEFubm91bmNlbWVudHMgY29sbGVjdGlvblxyXG52YXIgYW5ub3VuY2VtZW50cyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KCdhbm5vdW5jZW1lbnRBcnInLCBbXSk7XHJcblxyXG4vLyBTaG93IHNhdmVkIGFubm91bmNlbWVudHNcclxuYW5ub3VuY2VtZW50c1xyXG4gICAgLm1hcChhbm4gPT4gYW5uLm1lc3NhZ2UpXHJcbiAgICAuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcblxyXG4vLyBTZW5kcyBhbm5vdW5jZW1lbnRzIGFmdGVyIHRoZSBzcGVjaWZpZWQgZGVsYXkuXHJcbihmdW5jdGlvbiBhbm5vdW5jZW1lbnRDaGVjayhpKSB7XHJcbiAgICBpID0gKGkgPj0gYW5ub3VuY2VtZW50cy5sZW5ndGgpID8gMCA6IGk7XHJcblxyXG4gICAgdmFyIGFubiA9IGFubm91bmNlbWVudHNbaV07XHJcblxyXG4gICAgaWYgKGFubiAmJiBhbm4ubWVzc2FnZSkge1xyXG4gICAgICAgIHNlbmQoYW5uLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gICAgc2V0VGltZW91dChhbm5vdW5jZW1lbnRDaGVjaywgcHJlZmVyZW5jZXMuYW5ub3VuY2VtZW50RGVsYXkgKiA2MDAwMCwgaSArIDEpO1xyXG59KSgwKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBidWlsZEFuZFNlbmRNZXNzYWdlLFxyXG4gICAgYnVpbGRNZXNzYWdlLFxyXG59O1xyXG5cclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL3dvcmxkJyk7XHJcbmNvbnN0IHNlbmQgPSByZXF1aXJlKCdhcHAvYm90Jykuc2VuZDtcclxuXHJcbmZ1bmN0aW9uIGJ1aWxkQW5kU2VuZE1lc3NhZ2UobWVzc2FnZSwgbmFtZSkge1xyXG4gICAgc2VuZChidWlsZE1lc3NhZ2UobWVzc2FnZSwgbmFtZSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBidWlsZE1lc3NhZ2UobWVzc2FnZSwgbmFtZSkge1xyXG4gICAgbWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgve3soW159XSspfX0vZywgZnVuY3Rpb24oZnVsbCwga2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgTkFNRTogbmFtZSxcclxuICAgICAgICAgICAgTmFtZTogbmFtZVswXSArIG5hbWUuc3Vic3RyaW5nKDEpLnRvTG9jYWxlTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgIG5hbWU6IG5hbWUudG9Mb2NhbGVMb3dlckNhc2UoKVxyXG4gICAgICAgIH1ba2V5XSB8fCBmdWxsO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpKSB7XHJcbiAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgve3tpcH19L2dpLCB3b3JsZC5wbGF5ZXJzLmdldElQKG5hbWUpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbWVzc2FnZTtcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNoZWNrSm9pbnNBbmRHcm91cCxcclxuICAgIGNoZWNrSm9pbnMsXHJcbiAgICBjaGVja0dyb3VwLFxyXG59O1xyXG5cclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykge1xyXG4gICAgcmV0dXJuIGNoZWNrSm9pbnMobmFtZSwgbXNnLmpvaW5zX2xvdywgbXNnLmpvaW5zX2hpZ2gpICYmIGNoZWNrR3JvdXAobmFtZSwgbXNnLmdyb3VwLCBtc2cubm90X2dyb3VwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2lucyhuYW1lLCBsb3csIGhpZ2gpIHtcclxuICAgIHJldHVybiB3b3JsZC5nZXRKb2lucyhuYW1lKSA+PSBsb3cgJiYgd29ybGQuZ2V0Sm9pbnMobmFtZSkgPD0gaGlnaDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tHcm91cChuYW1lLCBncm91cCwgbm90X2dyb3VwKSB7XHJcbiAgICByZXR1cm4gaXNJbkdyb3VwKG5hbWUsIGdyb3VwKSAmJiAhaXNJbkdyb3VwKG5hbWUsIG5vdF9ncm91cCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzSW5Hcm91cChuYW1lLCBncm91cCkge1xyXG4gICAgbmFtZSA9IG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIHN3aXRjaCAoZ3JvdXAudG9Mb2NhbGVMb3dlckNhc2UoKSkge1xyXG4gICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1BsYXllcihuYW1lKTtcclxuICAgICAgICBjYXNlICdhZG1pbic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc0FkbWluKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ21vZCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc01vZChuYW1lKTtcclxuICAgICAgICBjYXNlICdzdGFmZic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1N0YWZmKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ293bmVyJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzT3duZXIobmFtZSk7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcbiIsIk9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vYnVpbGRNZXNzYWdlJyksXHJcbiAgICByZXF1aXJlKCcuL2NoZWNrSm9pbnNBbmRHcm91cCcpXHJcbik7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgnYXBwL3VpJyk7XHJcblxyXG52YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG5lbC5pbm5lckhUTUwgPSBJTkNMVURFX0ZJTEUoJy9kZXYvbWVzc2FnZXMvc3R5bGUuY3NzJyk7XHJcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxudWkuYWRkVGFiR3JvdXAoJ01lc3NhZ2VzJywgJ21lc3NhZ2VzJyk7XHJcblxyXG5bXHJcbiAgICByZXF1aXJlKCcuL2pvaW4nKSxcclxuICAgIHJlcXVpcmUoJy4vbGVhdmUnKSxcclxuICAgIC8vIHJlcXVpcmUoJy4vdHJpZ2dlcicpLFxyXG4gICAgcmVxdWlyZSgnLi9hbm5vdW5jZW1lbnRzJylcclxuXS5mb3JFYWNoKHR5cGUgPT4ge1xyXG4gICAgdHlwZS50YWIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBjaGVja0RlbGV0ZShldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC50YXJnZXQudGFnTmFtZSAhPSAnQScpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdWkuYWxlcnQoJ1JlYWxseSBkZWxldGUgdGhpcyBtZXNzYWdlPycsIFtcclxuICAgICAgICAgICAge3RleHQ6ICdZZXMnLCBzdHlsZTogJ2RhbmdlcicsIGFjdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC50YXJnZXQucGFyZW50Tm9kZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHR5cGUuc2F2ZSgpO1xyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAge3RleHQ6ICdDYW5jZWwnfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdHlwZS50YWIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdHlwZS5zYXZlKTtcclxuXHJcbiAgICB0eXBlLnRhYi5xdWVyeVNlbGVjdG9yKCcudG9wLXJpZ2h0LWJ1dHRvbicpXHJcbiAgICAgICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdHlwZS5hZGRNZXNzYWdlKCkpO1xyXG59KTtcclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCdhcHAvdWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBoZWxwZXJzID0gcmVxdWlyZSgnYXBwL21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuXHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnam9pbkFycic7XHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdKb2luJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBJTkNMVURFX0ZJTEUoJy9kZXYvbWVzc2FnZXMvam9pbi90YWIuaHRtbCcpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxufTtcclxuXHJcbnZhciBqb2luTWVzc2FnZXMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSk7XHJcbmpvaW5NZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UobXNnID0ge30pIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2pUZW1wbGF0ZScsICcjak1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnb3B0aW9uJywgcmVtb3ZlOiBbJ3NlbGVjdGVkJ10sIG11bHRpcGxlOiB0cnVlfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IG1zZy5tZXNzYWdlIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdBbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdOb2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgam9pbk1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcudGhpcmQtYm94JykpLmZvckVhY2goY29udGFpbmVyID0+IHtcclxuICAgICAgICBpZiAoIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGpvaW5NZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2xvdzogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfaGlnaDogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGdyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgbm90X2dyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBqb2luTWVzc2FnZXMpO1xyXG59XHJcblxyXG4vLyBMaXN0ZW4gdG8gcGxheWVyIGpvaW5zIGFuZCBjaGVjayBtZXNzYWdlc1xyXG5ob29rLm9uKCd3b3JsZC5qb2luJywgZnVuY3Rpb24gb25Kb2luKG5hbWUpIHtcclxuICAgIGpvaW5NZXNzYWdlcy5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgaWYgKGhlbHBlcnMuY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykpIHtcclxuICAgICAgICAgICAgaGVscGVycy5idWlsZEFuZFNlbmRNZXNzYWdlKG1zZy5tZXNzYWdlLCBuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgnYXBwL3VpJyk7XHJcblxyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnYXBwL2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ2FwcC9tZXNzYWdlcy9oZWxwZXJzJyk7XHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ2xlYXZlQXJyJztcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0xlYXZlJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBJTkNMVURFX0ZJTEUoJy9kZXYvbWVzc2FnZXMvbGVhdmUvdGFiLmh0bWwnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbn07XHJcblxyXG52YXIgbGVhdmVNZXNzYWdlcyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdKTtcclxubGVhdmVNZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UobXNnID0ge30pIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2xUZW1wbGF0ZScsICcjbE1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnb3B0aW9uJywgcmVtb3ZlOiBbJ3NlbGVjdGVkJ10sIG11bHRpcGxlOiB0cnVlfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IG1zZy5tZXNzYWdlIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdBbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdOb2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgbGVhdmVNZXNzYWdlcyA9IFtdO1xyXG4gICAgQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnLnRoaXJkLWJveCcpKS5mb3JFYWNoKGNvbnRhaW5lciA9PiB7XHJcbiAgICAgICAgaWYgKCFjb250YWluZXIucXVlcnlTZWxlY3RvcignLm0nKS52YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZWF2ZU1lc3NhZ2VzLnB1c2goe1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignLm0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfbG93OiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19oaWdoOiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBub3RfZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGxlYXZlTWVzc2FnZXMpO1xyXG59XHJcblxyXG4vLyBMaXN0ZW4gdG8gcGxheWVyIGpvaW5zIGFuZCBjaGVjayBtZXNzYWdlc1xyXG5ob29rLm9uKCd3b3JsZC5sZWF2ZScsIGZ1bmN0aW9uIG9uTGVhdmUobmFtZSkge1xyXG4gICAgbGVhdmVNZXNzYWdlcy5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgaWYgKGhlbHBlcnMuY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykpIHtcclxuICAgICAgICAgICAgaGVscGVycy5idWlsZEFuZFNlbmRNZXNzYWdlKG1zZy5tZXNzYWdlLCBuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufSk7XHJcbiIsImNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgU1RPUkFHRV9JRCA9ICdtYl9wcmVmZXJlbmNlcyc7XHJcblxyXG52YXIgcHJlZnMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCB7fSwgZmFsc2UpO1xyXG5cclxuLy8gQXV0byBzYXZlIG9uIGNoYW5nZVxyXG4vLyBJRSAoYWxsKSAvIFNhZmFyaSAoPCAxMCkgZG9lc24ndCBzdXBwb3J0IHByb3hpZXNcclxuaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBwcmVmcztcclxuICAgIHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIHByZWZzLCBmYWxzZSk7XHJcbiAgICB9LCAzMCAqIDEwMDApO1xyXG59IGVsc2Uge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBuZXcgUHJveHkocHJlZnMsIHtcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKG9iaiwgcHJvcCwgdmFsKSB7XHJcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIG9ialtwcm9wXSA9IHZhbDtcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIHByZWZzLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnZhciBwcmVmc01hcCA9IFtcclxuICAgIHt0eXBlOiAnbnVtYmVyJywga2V5OiAnYW5ub3VuY2VtZW50RGVsYXknLCBkZWZhdWx0OiAxMH0sXHJcbiAgICB7dHlwZTogJ251bWJlcicsIGtleTogJ21heFJlc3BvbnNlcycsIGRlZmF1bHQ6IDJ9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnbm90aWZ5JywgZGVmYXVsdDogdHJ1ZX0sXHJcbiAgICAvLyBBZHZhbmNlZFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnZGlzYWJsZVRyaW0nLCBkZWZhdWx0OiBmYWxzZX0sXHJcbiAgICB7dHlwZTogJ2Jvb2xlYW4nLCBrZXk6ICdyZWdleFRyaWdnZXJzJywgZGVmYXVsdDogZmFsc2V9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnc3BsaXRNZXNzYWdlcycsIGRlZmF1bHQ6IGZhbHNlfSxcclxuICAgIHt0eXBlOiAndGV4dCcsIGtleTogJ3NwbGl0VG9rZW4nLCBkZWZhdWx0OiAnPHNwbGl0Pid9LFxyXG5dO1xyXG5cclxucHJlZnNNYXAuZm9yRWFjaChwcmVmID0+IHtcclxuICAgIC8vIFNldCBkZWZhdWx0cyBpZiBub3Qgc2V0XHJcbiAgICBpZiAodHlwZW9mIHByZWZzW3ByZWYua2V5XSAhPSAgcHJlZi50eXBlKSB7XHJcbiAgICAgICAgcHJlZnNbcHJlZi5rZXldID0gcHJlZi5kZWZhdWx0O1xyXG4gICAgfVxyXG59KTtcclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCdhcHAvdWknKTtcclxuY29uc3QgcHJlZnMgPSByZXF1aXJlKCdhcHAvc2V0dGluZ3MnKTtcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ1NldHRpbmdzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSAnPHN0eWxlPicgK1xyXG4gICAgSU5DTFVERV9GSUxFKCcvZGV2L3NldHRpbmdzL3N0eWxlLmNzcycpICtcclxuICAgICc8L3N0eWxlPicgK1xyXG4gICAgSU5DTFVERV9GSUxFKCcvZGV2L3NldHRpbmdzL3RhYi5odG1sJyk7XHJcblxyXG4vLyBTaG93IHByZWZzXHJcbk9iamVjdC5rZXlzKHByZWZzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICB2YXIgZWwgPSB0YWIucXVlcnlTZWxlY3RvcihgW2RhdGEta2V5PVwiJHtrZXl9XCJdYCk7XHJcbiAgICBzd2l0Y2ggKHR5cGVvZiBwcmVmc1trZXldKSB7XHJcbiAgICAgICAgY2FzZSAnYm9vbGVhbic6XHJcbiAgICAgICAgICAgIGVsLmNoZWNrZWQgPSBwcmVmc1trZXldO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBlbC52YWx1ZSA9IHByZWZzW2tleV07XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbi8vIFdhdGNoIGZvciBjaGFuZ2VzXHJcbnRhYi5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgdmFyIGdldFZhbHVlID0gKGtleSkgPT4gdGFiLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWtleT1cIiR7a2V5fVwiXWApLnZhbHVlO1xyXG4gICAgdmFyIGdldEludCA9IChrZXkpID0+ICtnZXRWYWx1ZShrZXkpO1xyXG4gICAgdmFyIGdldENoZWNrZWQgPSAoa2V5KSA9PiB0YWIucXVlcnlTZWxlY3RvcihgW2RhdGEta2V5PVwiJHtrZXl9XCJdYCkuY2hlY2tlZDtcclxuXHJcbiAgICBPYmplY3Qua2V5cyhwcmVmcykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIHZhciBmdW5jO1xyXG5cclxuICAgICAgICBzd2l0Y2godHlwZW9mIHByZWZzW2tleV0pIHtcclxuICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gZ2V0Q2hlY2tlZDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxyXG4gICAgICAgICAgICAgICAgZnVuYyA9IGdldEludDtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgZnVuYyA9IGdldFZhbHVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcHJlZnNba2V5XSA9IGZ1bmMoa2V5KTtcclxuICAgIH0pO1xyXG59KTtcclxuXHJcblxyXG4vLyBHZXQgYmFja3VwXHJcbnRhYi5xdWVyeVNlbGVjdG9yKCcjbWJfYmFja3VwX3NhdmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIHNob3dCYWNrdXAoKSB7XHJcbiAgICB2YXIgYmFja3VwID0gSlNPTi5zdHJpbmdpZnkobG9jYWxTdG9yYWdlKS5yZXBsYWNlKC88L2csICcmbHQ7Jyk7XHJcbiAgICB1aS5hbGVydChgQ29weSB0aGlzIHRvIGEgc2FmZSBwbGFjZTo8YnI+PHRleHRhcmVhIHN0eWxlPVwid2lkdGg6IGNhbGMoMTAwJSAtIDdweCk7aGVpZ2h0OjE2MHB4O1wiPiR7YmFja3VwfTwvdGV4dGFyZWE+YCk7XHJcbn0pO1xyXG5cclxuXHJcbi8vIExvYWQgYmFja3VwXHJcbnRhYi5xdWVyeVNlbGVjdG9yKCcjbWJfYmFja3VwX2xvYWQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGxvYWRCYWNrdXAoKSB7XHJcbiAgICB1aS5hbGVydCgnRW50ZXIgdGhlIGJhY2t1cCBjb2RlOjx0ZXh0YXJlYSBzdHlsZT1cIndpZHRoOmNhbGMoMTAwJSAtIDdweCk7aGVpZ2h0OjE2MHB4O1wiPjwvdGV4dGFyZWE+JyxcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICB7IHRleHQ6ICdMb2FkICYgcmVmcmVzaCBwYWdlJywgc3R5bGU6ICdzdWNjZXNzJywgYWN0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQgdGV4dGFyZWEnKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUgPSBKU09OLnBhcnNlKGNvZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvZGUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYmFja3VwJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVpLm5vdGlmeSgnSW52YWxpZCBiYWNrdXAgY29kZS4gTm8gYWN0aW9uIHRha2VuLicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvZGUpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBjb2RlW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICB7IHRleHQ6ICdDYW5jZWwnIH1cclxuICAgICAgICAgICAgICAgIF0pO1xyXG59KTtcclxuIiwiLy8gT3ZlcndyaXRlIHRoZSBwb2xsQ2hhdCBmdW5jdGlvbiB0byBraWxsIHRoZSBkZWZhdWx0IGNoYXQgZnVuY3Rpb25cclxud2luZG93LnBvbGxDaGF0ID0gZnVuY3Rpb24oKSB7fTtcclxuXHJcbi8vIE92ZXJ3cml0ZSB0aGUgb2xkIHBhZ2VcclxuZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSAnJztcclxuZG9jdW1lbnQuaGVhZC5pbm5lckhUTUwgPSAnJztcclxuXHJcbnJlcXVpcmUoJ2FwcC91aS9wb2x5ZmlsbHMvY29uc29sZScpO1xyXG5yZXF1aXJlKCdhcHAvbGlicmFyaWVzL21pZ3JhdGlvbicpO1xyXG5cclxuY29uc3QgYmhmYW5zYXBpID0gcmVxdWlyZSgnYXBwL2xpYnJhcmllcy9iaGZhbnNhcGknKTtcclxuXHJcbnJlcXVpcmUoJ2FwcC9jb25zb2xlJyk7XHJcbnJlcXVpcmUoJ2FwcC9tZXNzYWdlcycpO1xyXG5yZXF1aXJlKCdhcHAvc2V0dGluZ3MvcGFnZScpO1xyXG5cclxuLy8gRXJyb3IgcmVwb3J0aW5nXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIChlcnIpID0+IHtcclxuICAgIGlmIChlcnIubWVzc2FnZSAhPSAnU2NyaXB0IGVycm9yJykge1xyXG4gICAgICAgIGJoZmFuc2FwaS5yZXBvcnRFcnJvcihlcnIpO1xyXG4gICAgfVxyXG59KTtcclxuIiwicmVxdWlyZSgnLi9wb2x5ZmlsbHMvZGV0YWlscycpO1xyXG5cclxuLy8gQnVpbGQgdGhlIEFQSVxyXG5PYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2xheW91dCcpLFxyXG4gICAgcmVxdWlyZSgnLi90ZW1wbGF0ZScpLFxyXG4gICAgcmVxdWlyZSgnLi9ub3RpZmljYXRpb25zJylcclxuKTtcclxuXHJcbi8vIEZ1bmN0aW9ucyB3aGljaCBhcmUgbm8gbG9uZ2VyIGNvbnRhaW5lZCBpbiB0aGlzIG1vZHVsZSwgYnV0IGFyZSByZXRhaW5lZCBmb3Igbm93IGZvciBiYWNrd2FyZCBjb21wYXRhYmlsaXR5LlxyXG5jb25zdCB3cml0ZSA9IHJlcXVpcmUoJ2FwcC9jb25zb2xlL2V4cG9ydHMnKS53cml0ZTtcclxubW9kdWxlLmV4cG9ydHMuYWRkTWVzc2FnZVRvQ29uc29sZSA9IGZ1bmN0aW9uKG1zZywgbmFtZSA9ICcnLCBuYW1lQ2xhc3MgPSAnJykge1xyXG4gICAgY29uc29sZS53YXJuKCd1aS5hZGRNZXNzYWdlVG9Db25zb2xlIGhhcyBiZWVuIGRlcHJpY2F0ZWQuIFVzZSBleC5jb25zb2xlLndyaXRlIGluc3RlYWQuJyk7XHJcbiAgICB3cml0ZShtc2csIG5hbWUsIG5hbWVDbGFzcyk7XHJcbn07XHJcbiIsIi8qKlxyXG4gKiBAZmlsZSBDb250YWlucyBmdW5jdGlvbnMgZm9yIG1hbmFnaW5nIHRoZSBwYWdlIGxheW91dFxyXG4gKi9cclxuXHJcbi8vIEJ1aWxkIHBhZ2UgLSBvbmx5IGNhc2UgaW4gd2hpY2ggYm9keS5pbm5lckhUTUwgc2hvdWxkIGJlIHVzZWQuXHJcbmRvY3VtZW50LmJvZHkuaW5uZXJIVE1MICs9IElOQ0xVREVfRklMRSgnL2Rldi91aS9sYXlvdXQvbGF5b3V0Lmh0bWwnKTtcclxuZG9jdW1lbnQuaGVhZC5pbm5lckhUTUwgKz0gJzxzdHlsZT4nICsgSU5DTFVERV9GSUxFKCcvZGV2L3VpL2xheW91dC9zdHlsZS5jc3MnKSArICc8L3N0eWxlPic7XHJcblxyXG4vLyBIaWRlIHRoZSBtZW51IHdoZW4gY2xpY2tpbmcgdGhlIG92ZXJsYXlcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xlZnROYXYgLm92ZXJsYXknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZU1lbnUpO1xyXG5cclxuLy8gQ2hhbmdlIHRhYnNcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xlZnROYXYnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGdsb2JhbFRhYkNoYW5nZShldmVudCkge1xyXG4gICAgdmFyIHRhYk5hbWUgPSBldmVudC50YXJnZXQuZGF0YXNldC50YWJOYW1lO1xyXG4gICAgaWYoIXRhYk5hbWUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy9Db250ZW50XHJcbiAgICAvL1dlIGNhbid0IGp1c3QgcmVtb3ZlIHRoZSBmaXJzdCBkdWUgdG8gYnJvd3NlciBsYWdcclxuICAgIEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2NvbnRhaW5lciA+IC52aXNpYmxlJykpXHJcbiAgICAgICAgLmZvckVhY2goZWwgPT4gZWwuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpKTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNjb250YWluZXIgPiBbZGF0YS10YWItbmFtZT0ke3RhYk5hbWV9XWApLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcclxuXHJcbiAgICAvL1RhYnNcclxuICAgIEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xlZnROYXYgLnNlbGVjdGVkJykpXHJcbiAgICAgICAgLmZvckVhY2goZWwgPT4gZWwuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKSk7XHJcbiAgICBldmVudC50YXJnZXQuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKTtcclxufSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0b2dnbGVNZW51LFxyXG4gICAgYWRkVGFiLFxyXG4gICAgcmVtb3ZlVGFiLFxyXG4gICAgYWRkVGFiR3JvdXAsXHJcbiAgICByZW1vdmVUYWJHcm91cCxcclxufTtcclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzaG93L2hpZGUgdGhlIG1lbnUuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHRvZ2dsZU1lbnUoKTtcclxuICovXHJcbmZ1bmN0aW9uIHRvZ2dsZU1lbnUoKSB7XHJcbiAgICB2YXIgbWFpblRvZ2dsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWZ0TmF2IGlucHV0Jyk7XHJcbiAgICBtYWluVG9nZ2xlLmNoZWNrZWQgPSAhbWFpblRvZ2dsZS5jaGVja2VkO1xyXG59XHJcblxyXG52YXIgdGFiVUlEID0gMDtcclxuLyoqXHJcbiAqIFVzZWQgdG8gYWRkIGEgdGFiIHRvIHRoZSBib3QncyBuYXZpZ2F0aW9uLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgdGFiID0gdWkuYWRkVGFiKCdUZXh0Jyk7XHJcbiAqIHZhciB0YWIyID0gdWkuYWRkVGFiKCdDdXN0b20gTWVzc2FnZXMnLCAnbWVzc2FnZXMnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IHRhYlRleHRcclxuICogQHBhcmFtIHtzdHJpbmd9IFtncm91cE5hbWU9bWFpbl0gT3B0aW9uYWwuIElmIHByb3ZpZGVkLCB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAgb2YgdGFicyB0byBhZGQgdGhpcyB0YWIgdG8uXHJcbiAqIEByZXR1cm4ge05vZGV9IC0gVGhlIGRpdiB0byBwbGFjZSB0YWIgY29udGVudCBpbi5cclxuICovXHJcbmZ1bmN0aW9uIGFkZFRhYih0YWJUZXh0LCBncm91cE5hbWUgPSAnbWFpbicpIHtcclxuICAgIHZhciB0YWJOYW1lID0gJ2JvdFRhYl8nICsgdGFiVUlEKys7XHJcblxyXG4gICAgdmFyIHRhYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIHRhYi50ZXh0Q29udGVudCA9IHRhYlRleHQ7XHJcbiAgICB0YWIuY2xhc3NMaXN0LmFkZCgndGFiJyk7XHJcbiAgICB0YWIuZGF0YXNldC50YWJOYW1lID0gdGFiTmFtZTtcclxuXHJcbiAgICB2YXIgdGFiQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGFiQ29udGVudC5kYXRhc2V0LnRhYk5hbWUgPSB0YWJOYW1lO1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNsZWZ0TmF2IFtkYXRhLXRhYi1ncm91cD0ke2dyb3VwTmFtZX1dYCkuYXBwZW5kQ2hpbGQodGFiKTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb250YWluZXInKS5hcHBlbmRDaGlsZCh0YWJDb250ZW50KTtcclxuXHJcbiAgICByZXR1cm4gdGFiQ29udGVudDtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgZ2xvYmFsIHRhYi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHRhYiA9IHVpLmFkZFRhYignVGFiJyk7XHJcbiAqIHVpLnJlbW92ZVRhYih0YWIpO1xyXG4gKiBAcGFyYW0ge05vZGV9IHRhYkNvbnRlbnQgVGhlIGRpdiByZXR1cm5lZCBieSB0aGUgYWRkVGFiIGZ1bmN0aW9uLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlVGFiKHRhYkNvbnRlbnQpIHtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNsZWZ0TmF2IFtkYXRhLXRhYi1uYW1lPSR7dGFiQ29udGVudC5kYXRhc2V0LnRhYk5hbWV9XWApLnJlbW92ZSgpO1xyXG4gICAgdGFiQ29udGVudC5yZW1vdmUoKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgdGFiIGdyb3VwIGluIHdoaWNoIHRhYnMgY2FuIGJlIHBsYWNlZC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdWkuYWRkVGFiR3JvdXAoJ0dyb3VwIFRleHQnLCAnc29tZV9ncm91cCcpO1xyXG4gKiB1aS5hZGRUYWIoJ1dpdGhpbiBncm91cCcsICdzb21lX2dyb3VwJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGhlIHRleHQgdGhlIHVzZXIgd2lsbCBzZWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBncm91cCB3aGljaCBjYW4gYmUgdXNlZCB0byBhZGQgdGFicyB3aXRoaW4gdGhlIGdyb3VwLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkVGFiR3JvdXAodGV4dCwgZ3JvdXBOYW1lKSB7XHJcbiAgICB2YXIgZGV0YWlscyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKTtcclxuICAgIGRldGFpbHMuZGF0YXNldC50YWJHcm91cCA9IGdyb3VwTmFtZTtcclxuXHJcbiAgICB2YXIgc3VtbWFyeSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N1bW1hcnknKTtcclxuICAgIHN1bW1hcnkudGV4dENvbnRlbnQgPSB0ZXh0O1xyXG4gICAgZGV0YWlscy5hcHBlbmRDaGlsZChzdW1tYXJ5KTtcclxuXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGVmdE5hdiBbZGF0YS10YWItZ3JvdXA9bWFpbl0nKS5hcHBlbmRDaGlsZChkZXRhaWxzKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgdGFiIGdyb3VwIGFuZCBhbGwgdGFicyBjb250YWluZWQgd2l0aGluIHRoZSBzcGVjaWZpZWQgZ3JvdXAuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGFkZFRhYkdyb3VwKCdHcm91cCcsICdncm91cDEnKTtcclxuICogdmFyIGlubmVyID0gYWRkVGFiKCdJbm5lcicsICdncm91cDEnKTtcclxuICogcmVtb3ZlVGFiR3JvdXAoJ2dyb3VwMScpOyAvLyBpbm5lciBoYXMgYmVlbiByZW1vdmVkLlxyXG4gKiBAcGFyYW0gc3RyaW5nIGdyb3VwTmFtZSB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAgdGhhdCB3YXMgdXNlZCBpbiB1aS5hZGRUYWJHcm91cC5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZVRhYkdyb3VwKGdyb3VwTmFtZSkge1xyXG4gICAgdmFyIGdyb3VwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2xlZnROYXYgW2RhdGEtdGFiLWdyb3VwPVwiJHtncm91cE5hbWV9XCJdYCk7XHJcbiAgICB2YXIgaXRlbXMgPSBBcnJheS5mcm9tKGdyb3VwLnF1ZXJ5U2VsZWN0b3JBbGwoJ3NwYW4nKSk7XHJcblxyXG4gICAgaXRlbXMuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICAvL1RhYiBjb250ZW50XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2NvbnRhaW5lciA+IFtkYXRhLXRhYi1uYW1lPVwiJHtpdGVtLmRhdGFzZXQudGFiTmFtZX1cIl1gKS5yZW1vdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGdyb3VwLnJlbW92ZSgpO1xyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYWxlcnRcclxufTtcclxuXHJcbi8qKlxyXG4qIEZ1bmN0aW9uIHVzZWQgdG8gcmVxdWlyZSBhY3Rpb24gZnJvbSB0aGUgdXNlci5cclxuKlxyXG4qIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IHRoZSB0ZXh0IHRvIGRpc3BsYXkgaW4gdGhlIGFsZXJ0XHJcbiogQHBhcmFtIHtBcnJheX0gYnV0dG9ucyBhbiBhcnJheSBvZiBidXR0b25zIHRvIGFkZCB0byB0aGUgYWxlcnQuXHJcbiogICAgICAgIEZvcm1hdDogW3t0ZXh0OiAnVGVzdCcsIHN0eWxlOidzdWNjZXNzJywgYWN0aW9uOiBmdW5jdGlvbigpe30sIHRoaXNBcmc6IHdpbmRvdywgZGlzbWlzczogZmFsc2V9XVxyXG4qICAgICAgICBOb3RlOiB0ZXh0IGlzIHRoZSBvbmx5IHJlcXVpcmVkIHBhcmFtYXRlci4gSWYgbm8gYnV0dG9uIGFycmF5IGlzIHNwZWNpZmllZFxyXG4qICAgICAgICB0aGVuIGEgc2luZ2xlIE9LIGJ1dHRvbiB3aWxsIGJlIHNob3duLlxyXG4qICAgICAgICAgUHJvdmlkZWQgc3R5bGVzOiBzdWNjZXNzLCBkYW5nZXIsIHdhcm5pbmcsIGluZm9cclxuKiAgICAgICAgRGVmYXVsdHM6IHN0eWxlOiAnJywgYWN0aW9uOiB1bmRlZmluZWQsIHRoaXNBcmc6IHVuZGVmaW5lZCwgZGlzbWlzczogdHJ1ZVxyXG4qL1xyXG5mdW5jdGlvbiBhbGVydCh0ZXh0LCBidXR0b25zID0gW3t0ZXh0OiAnT0snfV0pIHtcclxuICAgIGlmIChpbnN0YW5jZS5hY3RpdmUpIHtcclxuICAgICAgICBpbnN0YW5jZS5xdWV1ZS5wdXNoKHt0ZXh0LCBidXR0b25zfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaW5zdGFuY2UuYWN0aXZlID0gdHJ1ZTtcclxuXHJcbiAgICBidXR0b25zLmZvckVhY2goZnVuY3Rpb24oYnV0dG9uLCBpKSB7XHJcbiAgICAgICAgYnV0dG9uLmRpc21pc3MgPSAoYnV0dG9uLmRpc21pc3MgPT09IGZhbHNlKSA/IGZhbHNlIDogdHJ1ZTtcclxuICAgICAgICBpbnN0YW5jZS5idXR0b25zWydidXR0b25fJyArIGldID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246IGJ1dHRvbi5hY3Rpb24sXHJcbiAgICAgICAgICAgIHRoaXNBcmc6IGJ1dHRvbi50aGlzQXJnIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgZGlzbWlzczogdHlwZW9mIGJ1dHRvbi5kaXNtaXNzID09ICdib29sZWFuJyA/IGJ1dHRvbi5kaXNtaXNzIDogdHJ1ZSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGJ1dHRvbi5pZCA9ICdidXR0b25fJyArIGk7XHJcbiAgICAgICAgYnVpbGRCdXR0b24oYnV0dG9uKTtcclxuICAgIH0pO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0Q29udGVudCcpLmlubmVySFRNTCA9IHRleHQ7XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IH4gLm92ZXJsYXknKS5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQnKS5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBIb2xkcyB0aGUgY3VycmVudCBhbGVydCBhbmQgcXVldWUgb2YgZnVydGhlciBhbGVydHMuXHJcbiAqL1xyXG52YXIgaW5zdGFuY2UgPSB7XHJcbiAgICBhY3RpdmU6IGZhbHNlLFxyXG4gICAgcXVldWU6IFtdLFxyXG4gICAgYnV0dG9uczoge30sXHJcbn07XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdXNlZCB0byBhZGQgYnV0dG9uIGVsZW1lbnRzIHRvIGFuIGFsZXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gYnV0dG9uXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZEJ1dHRvbihidXR0b24pIHtcclxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIGVsLmlubmVySFRNTCA9IGJ1dHRvbi50ZXh0O1xyXG4gICAgaWYgKGJ1dHRvbi5zdHlsZSkge1xyXG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoYnV0dG9uLnN0eWxlKTtcclxuICAgIH1cclxuICAgIGVsLmlkID0gYnV0dG9uLmlkO1xyXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBidXR0b25IYW5kbGVyKTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCAuYnV0dG9ucycpLmFwcGVuZENoaWxkKGVsKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGRldGVybWluZSB0aGUgZnVuY3Rpb25hbGl0eSBvZiBlYWNoIGJ1dHRvbiBhZGRlZCB0byBhbiBhbGVydC5cclxuICpcclxuICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudFxyXG4gKi9cclxuZnVuY3Rpb24gYnV0dG9uSGFuZGxlcihldmVudCkge1xyXG4gICAgdmFyIGJ1dHRvbiA9IGluc3RhbmNlLmJ1dHRvbnNbZXZlbnQudGFyZ2V0LmlkXSB8fCB7fTtcclxuICAgIGlmICh0eXBlb2YgYnV0dG9uLmFjdGlvbiA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgYnV0dG9uLmFjdGlvbi5jYWxsKGJ1dHRvbi50aGlzQXJnKTtcclxuICAgIH1cclxuXHJcbiAgICAvL1JlcXVpcmUgdGhhdCB0aGVyZSBiZSBhbiBhY3Rpb24gYXNvY2lhdGVkIHdpdGggbm8tZGlzbWlzcyBidXR0b25zLlxyXG4gICAgaWYgKGJ1dHRvbi5kaXNtaXNzIHx8IHR5cGVvZiBidXR0b24uYWN0aW9uICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQnKS5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IH4gLm92ZXJsYXknKS5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IC5idXR0b25zJykuaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgaW5zdGFuY2UuYnV0dG9ucyA9IHt9O1xyXG4gICAgICAgIGluc3RhbmNlLmFjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBBcmUgbW9yZSBhbGVydHMgd2FpdGluZyB0byBiZSBzaG93bj9cclxuICAgICAgICBpZiAoaW5zdGFuY2UucXVldWUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxldCBuZXh0ID0gaW5zdGFuY2UucXVldWUuc2hpZnQoKTtcclxuICAgICAgICAgICAgYWxlcnQobmV4dC50ZXh0LCBuZXh0LmJ1dHRvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJPYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2FsZXJ0JyksXHJcbiAgICByZXF1aXJlKCcuL25vdGlmeScpXHJcbik7XHJcblxyXG52YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG5lbC5pbm5lckhUTUwgPSBJTkNMVURFX0ZJTEUoJy9kZXYvdWkvbm90aWZpY2F0aW9ucy9zdHlsZS5jc3MnKTtcclxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5lbC5pZCA9ICdhbGVydFdyYXBwZXInO1xyXG5lbC5pbm5lckhUTUwgPSBJTkNMVURFX0ZJTEUoJy9kZXYvdWkvbm90aWZpY2F0aW9ucy9ub3RpZmljYXRpb25zLmh0bWwnKTtcclxuXHJcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG5vdGlmeSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNlbmQgYSBub24tY3JpdGljYWwgYWxlcnQgdG8gdGhlIHVzZXIuXHJcbiAqIFNob3VsZCBiZSB1c2VkIGluIHBsYWNlIG9mIHVpLmFsZXJ0IGlmIHBvc3NpYmxlIGFzIGl0IGlzIG5vbi1ibG9ja2luZy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogLy9TaG93cyBhIG5vdGZpY2F0aW9uIGZvciAyIHNlY29uZHNcclxuICogdWkubm90aWZ5KCdOb3RpZmljYXRpb24nKTtcclxuICogLy9TaG93cyBhIG5vdGlmaWNhdGlvbiBmb3IgNSBzZWNvbmRzXHJcbiAqIHVpLm5vdGlmeSgnTm90aWZpY2F0aW9uJywgNSk7XHJcbiAqIEBwYXJhbSBTdHJpbmcgdGV4dCB0aGUgdGV4dCB0byBkaXNwbGF5LiBTaG91bGQgYmUga2VwdCBzaG9ydCB0byBhdm9pZCB2aXN1YWxseSBibG9ja2luZyB0aGUgbWVudSBvbiBzbWFsbCBkZXZpY2VzLlxyXG4gKiBAcGFyYW0gTnVtYmVyIGRpc3BsYXlUaW1lIHRoZSBudW1iZXIgb2Ygc2Vjb25kcyB0byBzaG93IHRoZSBub3RpZmljYXRpb24gZm9yLlxyXG4gKi9cclxuZnVuY3Rpb24gbm90aWZ5KHRleHQsIGRpc3BsYXlUaW1lID0gMikge1xyXG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICBlbC5jbGFzc0xpc3QuYWRkKCdub3RpZmljYXRpb24nKTtcclxuICAgIGVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcclxuICAgIGVsLnRleHRDb250ZW50ID0gdGV4dDtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XHJcbiAgICB9LmJpbmQoZWwpLCBkaXNwbGF5VGltZSAqIDEwMDApO1xyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZChlbCksIGRpc3BsYXlUaW1lICogMTAwMCArIDIxMDApO1xyXG59XHJcbiIsIi8vSUUgZG9lc24ndCBsaWtlIGNvbnNvbGUubG9nIHVubGVzcyBkZXYgdG9vbHMgYXJlIG9wZW4uXHJcbmlmICghd2luZG93LmNvbnNvbGUpIHtcclxuICAgIHdpbmRvdy5jb25zb2xlID0ge307XHJcbiAgICB3aW5kb3cubG9nID0gd2luZG93LmxvZyB8fCBbXTtcclxuICAgIGNvbnNvbGUubG9nID0gZnVuY3Rpb24oLi4uYXJncykge1xyXG4gICAgICAgIHdpbmRvdy5sb2cucHVzaChhcmdzKTtcclxuICAgIH07XHJcbn1cclxuWydpbmZvJywgJ2Vycm9yJywgJ3dhcm4nLCAnYXNzZXJ0J10uZm9yRWFjaChtZXRob2QgPT4ge1xyXG4gICAgaWYgKCFjb25zb2xlW21ldGhvZF0pIHtcclxuICAgICAgICBjb25zb2xlW21ldGhvZF0gPSBjb25zb2xlLmxvZztcclxuICAgIH1cclxufSk7XHJcbiIsIi8vRGV0YWlscyBwb2x5ZmlsbCwgb2xkZXIgZmlyZWZveCwgSUVcclxuaWYgKCEoJ29wZW4nIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKSkpIHtcclxuICAgIGxldCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbiAgICBzdHlsZS50ZXh0Q29udGVudCArPSBgZGV0YWlsczpub3QoW29wZW5dKSA+IDpub3Qoc3VtbWFyeSkgeyBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH0gZGV0YWlscyA+IHN1bW1hcnk6YmVmb3JlIHsgY29udGVudDogXCLilrZcIjsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBmb250LXNpemU6IC44ZW07IHdpZHRoOiAxLjVlbTsgZm9udC1mYW1pbHk6XCJDb3VyaWVyIE5ld1wiOyB9IGRldGFpbHNbb3Blbl0gPiBzdW1tYXJ5OmJlZm9yZSB7IHRyYW5zZm9ybTogcm90YXRlKDkwZGVnKTsgfWA7XHJcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcclxuXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC50YXJnZXQudGFnTmFtZSA9PSAnU1VNTUFSWScpIHtcclxuICAgICAgICAgICAgbGV0IGRldGFpbHMgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZGV0YWlscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZGV0YWlscy5nZXRBdHRyaWJ1dGUoJ29wZW4nKSkge1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5vcGVuID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLnJlbW92ZUF0dHJpYnV0ZSgnb3BlbicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5vcGVuID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMuc2V0QXR0cmlidXRlKCdvcGVuJywgJ29wZW4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsIi8vIElFIEZpeFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0ZW1wbGF0ZSkge1xyXG4gICAgaWYgKCEoJ2NvbnRlbnQnIGluIHRlbXBsYXRlKSkge1xyXG4gICAgICAgIGxldCBjb250ZW50ID0gdGVtcGxhdGUuY2hpbGROb2RlcztcclxuICAgICAgICBsZXQgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29udGVudC5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChjb250ZW50W2pdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRlbXBsYXRlLmNvbnRlbnQgPSBmcmFnbWVudDtcclxuICAgIH1cclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBidWlsZENvbnRlbnRGcm9tVGVtcGxhdGUsXHJcbn07XHJcblxyXG52YXIgcG9seWZpbGwgPSByZXF1aXJlKCdhcHAvdWkvcG9seWZpbGxzL3RlbXBsYXRlJyk7XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBjbG9uZSBhIHRlbXBsYXRlIGFmdGVyIGFsdGVyaW5nIHRoZSBwcm92aWRlZCBydWxlcy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjdGVtcGxhdGUnLCAnI3RhcmdldCcsIFt7c2VsZWN0b3I6ICdpbnB1dCcsIHZhbHVlOiAnVmFsdWUnfV0pO1xyXG4gKiB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJ3RlbXBsYXRlJywgJ2RpdicsIFt7c2VsZWN0b3I6ICdhJywgcmVtb3ZlOiBbJ2hyZWYnXSwgbXVsdGlwbGU6IHRydWV9XSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZW1wbGF0ZVNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXRTZWxlY3RvclxyXG4gKiBAcGFyYW0ge2FycmF5fSBydWxlcyBmb3JtYXQ6IGFycmF5IG9mIG9iamVjdHNcclxuICogICAgICBlYWNoIG9iamVjdCBtdXN0IGhhdmUgXCJzZWxlY3RvclwiLlxyXG4gKiAgICAgIGVhY2ggb2JqZWN0IGNhbiBoYXZlIFwibXVsdGlwbGVcIiBzZXQgdG8gdXBkYXRlIGFsbCBtYXRjaGluZyBlbGVtZW50cy5cclxuICogICAgICBlYWNoIG9iamVjdCBjYW4gaGF2ZSBcInJlbW92ZVwiIC0gYW4gYXJyYXkgb2YgYXR0cmlidXRlcyB0byByZW1vdmUuXHJcbiAqICAgICAgZWFjaCBvYmplY3QgY2FuIGhhdmUgXCJ0ZXh0XCIgb3IgXCJodG1sXCIgLSBmdXJ0aGVyIGtleXMgd2lsbCBiZSBzZXQgYXMgYXR0cmlidXRlcy5cclxuICogICAgICBpZiBib3RoIHRleHQgYW5kIGh0bWwgYXJlIHNldCwgdGV4dCB3aWxsIHRha2UgcHJlY2VuZGVuY2UuXHJcbiAqICAgICAgcnVsZXMgd2lsbCBiZSBwYXJzZWQgaW4gdGhlIG9yZGVyIHRoYXQgdGhleSBhcmUgcHJlc2VudCBpbiB0aGUgYXJyYXkuXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZENvbnRlbnRGcm9tVGVtcGxhdGUodGVtcGxhdGVTZWxlY3RvciwgdGFyZ2V0U2VsZWN0b3IsIHJ1bGVzID0gW10pIHtcclxuICAgIHZhciB0ZW1wbGF0ZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGVtcGxhdGVTZWxlY3Rvcik7XHJcblxyXG4gICAgcG9seWZpbGwodGVtcGxhdGUpO1xyXG5cclxuICAgIHZhciBjb250ZW50ID0gdGVtcGxhdGUuY29udGVudDtcclxuXHJcbiAgICBydWxlcy5mb3JFYWNoKHJ1bGUgPT4gaGFuZGxlUnVsZShjb250ZW50LCBydWxlKSk7XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0YXJnZXRTZWxlY3RvcikuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuaW1wb3J0Tm9kZShjb250ZW50LCB0cnVlKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBhcHBseSBydWxlcyB0byB0aGUgdGVtcGxhdGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Tm9kZX0gY29udGVudCAtIHRoZSBjb250ZW50IG9mIHRoZSB0ZW1wbGF0ZS5cclxuICogQHBhcmFtIHtPYmplY3R9IHJ1bGUgLSB0aGUgcnVsZSB0byBhcHBseS5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZVJ1bGUoY29udGVudCwgcnVsZSkge1xyXG4gICAgaWYgKHJ1bGUubXVsdGlwbGUpIHtcclxuICAgICAgICBsZXQgZWxzID0gY29udGVudC5xdWVyeVNlbGVjdG9yQWxsKHJ1bGUuc2VsZWN0b3IpO1xyXG5cclxuICAgICAgICBBcnJheS5mcm9tKGVscylcclxuICAgICAgICAgICAgLmZvckVhY2goZWwgPT4gdXBkYXRlRWxlbWVudChlbCwgcnVsZSkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBsZXQgZWwgPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3IocnVsZS5zZWxlY3Rvcik7XHJcbiAgICAgICAgaWYgKCFlbCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFVuYWJsZSB0byB1cGRhdGUgJHtydWxlLnNlbGVjdG9yfS5gLCBydWxlKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdXBkYXRlRWxlbWVudChlbCwgcnVsZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byB1cGRhdGUgYW4gZWxlbWVudCB3aXRoIGEgcnVsZS5cclxuICpcclxuICogQHBhcmFtIHtOb2RlfSBlbCB0aGUgZWxlbWVudCB0byBhcHBseSB0aGUgcnVsZXMgdG8uXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBydWxlIHRoZSBydWxlIG9iamVjdC5cclxuICovXHJcbmZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQoZWwsIHJ1bGUpIHtcclxuICAgIGlmICgndGV4dCcgaW4gcnVsZSkge1xyXG4gICAgICAgIGVsLnRleHRDb250ZW50ID0gcnVsZS50ZXh0O1xyXG4gICAgfSBlbHNlIGlmICgnaHRtbCcgaW4gcnVsZSkge1xyXG4gICAgICAgIGVsLmlubmVySFRNTCA9IHJ1bGUuaHRtbDtcclxuICAgIH1cclxuXHJcbiAgICBPYmplY3Qua2V5cyhydWxlKVxyXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+ICFbJ3NlbGVjdG9yJywgJ3RleHQnLCAnaHRtbCcsICdyZW1vdmUnLCAnbXVsdGlwbGUnXS5pbmNsdWRlcyhrZXkpKVxyXG4gICAgICAgIC5mb3JFYWNoKGtleSA9PiBlbC5zZXRBdHRyaWJ1dGUoa2V5LCBydWxlW2tleV0pKTtcclxuXHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShydWxlLnJlbW92ZSkpIHtcclxuICAgICAgICBydWxlLnJlbW92ZS5mb3JFYWNoKGtleSA9PiBlbC5yZW1vdmVBdHRyaWJ1dGUoa2V5KSk7XHJcbiAgICB9XHJcbn1cclxuIl19
