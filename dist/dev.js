(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
Object.assign(
    module.exports,
    require('./send')
);

},{"./send":2}],2:[function(require,module,exports){
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

        for (let i = 0; i < str.length - 1; i++) {
            let curr = str[i];
            if (curr[curr.length - 1] == '\\') {
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

},{"app/libraries/bhfansapi":6,"app/libraries/blockheads":7,"app/settings":11}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
const self = module.exports = require('./exports');
const send = require('app/bot').send;

const hook = require('app/libraries/hook');
const world = require('app/libraries/world');

var tab = require('app/ui').addTab('Console');

tab.innerHTML = '<style>' +
    "#mb_console .chat{height:calc(100vh - 220px)}@media screen and (min-width: 668px){#mb_console .chat{height:calc(100vh - 155px)}}#mb_console ul{height:100%;overflow-y:auto;margin:0;padding:0}#mb_console li{list-style-type:none}#mb_console .controls{display:flex;padding:0 10px}#mb_console input,#mb_console button{margin:5px 0}#mb_console input{font-size:1em;padding:1px;flex:1;border:solid 1px #999}#mb_console button{background:#182b73;font-weight:bold;color:#fff;border:0;height:40px;padding:1px 4px}#mb_console .mod>span:first-child{color:#05f529}#mb_console .admin>span:first-child{color:#2b26bd}\n" +
    '</style>' +
    "<div id=\"mb_console\">\r\n    <div class=\"chat\">\r\n        <ul></ul>\r\n    </div>\r\n    <div class=\"controls\">\r\n        <input type=\"text\"/><button>SEND</button>\r\n    </div>\r\n</div>\r\n";

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
function userSend(message) {
    var input = tab.querySelector('input');
    send(message);
    input.value = '';
    input.focus();
}

tab.querySelector('input').addEventListener('keydown', function(event) {
    var input = event.target;
    if (event.key == "Enter" || event.keyCode == 13) {
        event.preventDefault();
        userSend(input.value);
    }
});

tab.querySelector('button').addEventListener('click', function() {
    userSend(tab.querySelector('input').value);
});

},{"./exports":3,"app/bot":1,"app/libraries/hook":8,"app/libraries/world":10,"app/ui":13}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{"app/libraries/ajax":5,"app/ui":13}],7:[function(require,module,exports){
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

    return cache.worldStarted;
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

},{"./ajax":5,"./bhfansapi":6,"./hook":8}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
//isStaff isMod isAdmin

},{}],11:[function(require,module,exports){
module.exports = {}

},{}],12:[function(require,module,exports){
// Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

// Overwrite the old page
document.body.innerHTML = '';
document.head.innerHTML = '';

require('app/ui/polyfills/console');
require('app/libraries/migration');

var bhfansapi = require('app/libraries/bhfansapi');
var hook = require('app/libraries/hook');

hook.on('error', bhfansapi.reportError);

require('app/console');


window.addEventListener('error', (err) => {
    if (err.message != 'Script error') {
        window.hook.check('error', err);
    }
});

},{"app/console":4,"app/libraries/bhfansapi":6,"app/libraries/hook":8,"app/libraries/migration":9,"app/ui/polyfills/console":18}],13:[function(require,module,exports){
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

},{"./layout":14,"./notifications":16,"./polyfills/details":19,"./template":21,"app/console/exports":3}],14:[function(require,module,exports){
/**
 * @file Contains functions for managing the page layout
 */

// Build page
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
 * @param {string} groupName Optional. If provided, the name of the group of tabs to add this tab to.
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

},{}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{"./alert":15,"./notify":17}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
module.exports = {
    buildContentFromTemplate,
};

var polyfill = require('app/ui/polyfills/template');

/**
 * Function used to clone a template after altering the provided rules.
 *
 * @example
 * ui.buildContentFromTemplate('#template', '#target', [{selector: 'input', value: 'Value'}]);
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

},{"app/ui/polyfills/template":20}]},{},[12])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvYm90L2luZGV4LmpzIiwiZGV2L2JvdC9zZW5kLmpzIiwiZGV2L2NvbnNvbGUvZXhwb3J0cy5qcyIsImRldi9jb25zb2xlL2luZGV4LmpzIiwiZGV2L2xpYnJhcmllcy9hamF4LmpzIiwiZGV2L2xpYnJhcmllcy9iaGZhbnNhcGkuanMiLCJkZXYvbGlicmFyaWVzL2Jsb2NraGVhZHMuanMiLCJkZXYvbGlicmFyaWVzL2hvb2suanMiLCJkZXYvbGlicmFyaWVzL21pZ3JhdGlvbi5qcyIsImRldi9saWJyYXJpZXMvd29ybGQuanMiLCJkZXYvc2V0dGluZ3MvaW5kZXguanMiLCJkZXYvc3RhcnQuanMiLCJkZXYvdWkvaW5kZXguanMiLCJkZXYvdWkvbGF5b3V0L2luZGV4LmpzIiwiZGV2L3VpL25vdGlmaWNhdGlvbnMvYWxlcnQuanMiLCJkZXYvdWkvbm90aWZpY2F0aW9ucy9pbmRleC5qcyIsImRldi91aS9ub3RpZmljYXRpb25zL25vdGlmeS5qcyIsImRldi91aS9wb2x5ZmlsbHMvY29uc29sZS5qcyIsImRldi91aS9wb2x5ZmlsbHMvZGV0YWlscy5qcyIsImRldi91aS9wb2x5ZmlsbHMvdGVtcGxhdGUuanMiLCJkZXYvdWkvdGVtcGxhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTs7QUNEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIk9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vc2VuZCcpXHJcbik7XHJcbiIsInZhciBhcGkgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL2Jsb2NraGVhZHMnKTtcclxudmFyIHJlcG9ydCA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvYmhmYW5zYXBpJykucmVwb3J0RXJyb3I7XHJcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJ2FwcC9zZXR0aW5ncycpO1xyXG5cclxudmFyIHF1ZXVlID0gW107XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNlbmQsXHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBxdWV1ZSBhIG1lc3NhZ2UgdG8gYmUgc2VudC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2VuZCgnSGVsbG8hJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIGJlIHNlbnQuXHJcbiAqL1xyXG5mdW5jdGlvbiBzZW5kKG1lc3NhZ2UpIHtcclxuICAgIGlmIChzZXR0aW5ncy5zcGxpdE1lc3NhZ2VzKSB7XHJcbiAgICAgICAgLy9GSVhNRTogSWYgdGhlIGJhY2tzbGFzaCBiZWZvcmUgdGhlIHRva2VuIGlzIGVzY2FwZWQgYnkgYW5vdGhlciBiYWNrc2xhc2ggdGhlIHRva2VuIHNob3VsZCBzdGlsbCBzcGxpdCB0aGUgbWVzc2FnZS5cclxuICAgICAgICBsZXQgc3RyID0gbWVzc2FnZS5zcGxpdChzZXR0aW5ncy5zcGxpdFRva2VuKTtcclxuICAgICAgICBsZXQgdG9TZW5kID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aCAtIDE7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgY3VyciA9IHN0cltpXTtcclxuICAgICAgICAgICAgaWYgKGN1cnJbY3Vyci5sZW5ndGggLSAxXSA9PSAnXFxcXCcpIHtcclxuICAgICAgICAgICAgICAgIGN1cnIgKz0gc2V0dGluZ3Muc3BsaXRUb2tlbiArIHN0clsrK2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRvU2VuZC5wdXNoKGN1cnIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TZW5kLmZvckVhY2gobXNnID0+IHF1ZXVlLnB1c2gobXNnKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHF1ZXVlLnB1c2gobWVzc2FnZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBXYXRjaGVzIHRoZSBxdWV1ZSBmb3IgbmV3IG1lc3NhZ2VzIHRvIHNlbmQgYW5kIHNlbmRzIHRoZW0gYXMgc29vbiBhcyBwb3NzaWJsZS5cclxuICovXHJcbihmdW5jdGlvbiBjaGVja1F1ZXVlKCkge1xyXG4gICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrUXVldWUsIDUwMCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGFwaS5zZW5kKHF1ZXVlLnNoaWZ0KCkpXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgIHJlcG9ydChuZXcgRXJyb3IoZXJyKSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2tRdWV1ZSwgMTAwMCk7XHJcbiAgICAgICAgfSk7XHJcbn0oKSk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgd3JpdGUsXHJcbiAgICBjbGVhclxyXG59O1xyXG5cclxuZnVuY3Rpb24gd3JpdGUobXNnLCBuYW1lID0gJycsIG5hbWVDbGFzcyA9ICcnKSB7XHJcbiAgICB2YXIgbXNnRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgaWYgKG5hbWVDbGFzcykge1xyXG4gICAgICAgIG1zZ0VsLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBuYW1lQ2xhc3MpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBuYW1lRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICBuYW1lRWwudGV4dENvbnRlbnQgPSBuYW1lO1xyXG5cclxuICAgIHZhciBjb250ZW50RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICBpZiAobmFtZSkge1xyXG4gICAgICAgIGNvbnRlbnRFbC50ZXh0Q29udGVudCA9IGA6ICR7bXNnfWA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnRlbnRFbC50ZXh0Q29udGVudCA9IG1zZztcclxuICAgIH1cclxuICAgIG1zZ0VsLmFwcGVuZENoaWxkKG5hbWVFbCk7XHJcbiAgICBtc2dFbC5hcHBlbmRDaGlsZChjb250ZW50RWwpO1xyXG5cclxuICAgIHZhciBjaGF0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2NvbnNvbGUgdWwnKTtcclxuICAgIGNoYXQuYXBwZW5kQ2hpbGQobXNnRWwpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbGVhcigpIHtcclxuICAgIHZhciBjaGF0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2NvbnNvbGUgdWwnKTtcclxuICAgIGNoYXQuaW5uZXJIVE1MID0gJyc7XHJcbn1cclxuIiwiY29uc3Qgc2VsZiA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9leHBvcnRzJyk7XHJcbmNvbnN0IHNlbmQgPSByZXF1aXJlKCdhcHAvYm90Jykuc2VuZDtcclxuXHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdhcHAvbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG52YXIgdGFiID0gcmVxdWlyZSgnYXBwL3VpJykuYWRkVGFiKCdDb25zb2xlJyk7XHJcblxyXG50YWIuaW5uZXJIVE1MID0gJzxzdHlsZT4nICtcclxuICAgIElOQ0xVREVfRklMRSgnL2Rldi9jb25zb2xlL3N0eWxlLmNzcycpICtcclxuICAgICc8L3N0eWxlPicgK1xyXG4gICAgSU5DTFVERV9GSUxFKCcvZGV2L2NvbnNvbGUvdGFiLmh0bWwnKTtcclxuXHJcbmhvb2sub24oJ3dvcmxkLm90aGVyJywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgc2VsZi53cml0ZShtZXNzYWdlLCB1bmRlZmluZWQsICdvdGhlcicpO1xyXG59KTtcclxuXHJcbmhvb2sub24oJ3dvcmxkLm1lc3NhZ2UnLCBmdW5jdGlvbihuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICBsZXQgbXNnQ2xhc3MgPSAncGxheWVyJztcclxuICAgIGlmICh3b3JsZC5pc1N0YWZmKG5hbWUpKSB7XHJcbiAgICAgICAgbXNnQ2xhc3MgPSAnc3RhZmYnO1xyXG4gICAgICAgIGlmICh3b3JsZC5pc01vZChuYW1lKSkge1xyXG4gICAgICAgICAgICBtc2dDbGFzcyArPSAnIG1vZCc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy9IYXMgdG8gYmUgYWRtaW5cclxuICAgICAgICAgICAgbXNnQ2xhc3MgKz0gJyBhZG1pbic7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpKSB7XHJcbiAgICAgICAgbXNnQ2xhc3MgKz0gJyBjb21tYW5kJztcclxuICAgIH1cclxuICAgIHNlbGYud3JpdGUobWVzc2FnZSwgbmFtZSwgbXNnQ2xhc3MpO1xyXG59KTtcclxuXHJcbmhvb2sub24oJ3dvcmxkLnNlcnZlcmNoYXQnLCBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICBzZWxmLndyaXRlKG1lc3NhZ2UsICdTRVJWRVInLCAnYWRtaW4nKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5zZW5kJywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpKSB7XHJcbiAgICAgICAgc2VsZi53cml0ZShtZXNzYWdlLCAnU0VSVkVSJywgJ2FkbWluIGNvbW1hbmQnKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vL01lc3NhZ2UgaGFuZGxlcnNcclxuaG9vay5vbignd29ybGQuam9pbicsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckpvaW4obmFtZSwgaXApIHtcclxuICAgIHNlbGYud3JpdGUoYCR7bmFtZX0gKCR7aXB9KSBoYXMgam9pbmVkIHRoZSBzZXJ2ZXJgLCAnU0VSVkVSJywgJ2pvaW4gd29ybGQgYWRtaW4nKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5sZWF2ZScsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckxlYXZlKG5hbWUpIHtcclxuICAgIHNlbGYud3JpdGUoYCR7bmFtZX0gaGFzIGxlZnQgdGhlIHNlcnZlcmAsICdTRVJWRVInLCBgbGVhdmUgd29ybGQgYWRtaW5gKTtcclxufSk7XHJcblxyXG4vLyBBdXRvIHNjcm9sbCB3aGVuIG5ldyBtZXNzYWdlcyBhcmUgYWRkZWQgdG8gdGhlIHBhZ2UsIHVubGVzcyB0aGUgb3duZXIgaXMgcmVhZGluZyBvbGQgY2hhdC5cclxuKG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIHNob3dOZXdDaGF0KCkge1xyXG4gICAgbGV0IGNvbnRhaW5lciA9IHRhYi5xdWVyeVNlbGVjdG9yKCd1bCcpO1xyXG4gICAgbGV0IGxhc3RMaW5lID0gdGFiLnF1ZXJ5U2VsZWN0b3IoJ2xpOmxhc3QtY2hpbGQnKTtcclxuXHJcbiAgICBpZiAoIWNvbnRhaW5lciB8fCAhbGFzdExpbmUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvbnRhaW5lci5zY3JvbGxIZWlnaHQgLSBjb250YWluZXIuY2xpZW50SGVpZ2h0IC0gY29udGFpbmVyLnNjcm9sbFRvcCA8PSBsYXN0TGluZS5jbGllbnRIZWlnaHQgKiAyKSB7XHJcbiAgICAgICAgbGFzdExpbmUuc2Nyb2xsSW50b1ZpZXcoZmFsc2UpO1xyXG4gICAgfVxyXG59KSkub2JzZXJ2ZSh0YWIucXVlcnlTZWxlY3RvcignLmNoYXQnKSwge2NoaWxkTGlzdDogdHJ1ZX0pO1xyXG5cclxuXHJcbi8vIFJlbW92ZSBvbGQgY2hhdCB0byByZWR1Y2UgbWVtb3J5IHVzYWdlXHJcbihuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiByZW1vdmVPbGRDaGF0KCkge1xyXG4gICAgdmFyIGNoYXQgPSB0YWIucXVlcnlTZWxlY3RvcigndWwnKTtcclxuXHJcbiAgICB3aGlsZSAoY2hhdC5jaGlsZHJlbi5sZW5ndGggPiA1MDApIHtcclxuICAgICAgICBjaGF0LmNoaWxkcmVuWzBdLnJlbW92ZSgpO1xyXG4gICAgfVxyXG59KSkub2JzZXJ2ZSh0YWIucXVlcnlTZWxlY3RvcignLmNoYXQnKSwge2NoaWxkTGlzdDogdHJ1ZX0pO1xyXG5cclxuLy8gTGlzdGVuIGZvciB0aGUgdXNlciB0byBzZW5kIG1lc3NhZ2VzXHJcbmZ1bmN0aW9uIHVzZXJTZW5kKG1lc3NhZ2UpIHtcclxuICAgIHZhciBpbnB1dCA9IHRhYi5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xyXG4gICAgc2VuZChtZXNzYWdlKTtcclxuICAgIGlucHV0LnZhbHVlID0gJyc7XHJcbiAgICBpbnB1dC5mb2N1cygpO1xyXG59XHJcblxyXG50YWIucXVlcnlTZWxlY3RvcignaW5wdXQnKS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIHZhciBpbnB1dCA9IGV2ZW50LnRhcmdldDtcclxuICAgIGlmIChldmVudC5rZXkgPT0gXCJFbnRlclwiIHx8IGV2ZW50LmtleUNvZGUgPT0gMTMpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHVzZXJTZW5kKGlucHV0LnZhbHVlKTtcclxuICAgIH1cclxufSk7XHJcblxyXG50YWIucXVlcnlTZWxlY3RvcignYnV0dG9uJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgIHVzZXJTZW5kKHRhYi5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpLnZhbHVlKTtcclxufSk7XHJcbiIsIi8vVE9ETzogVXNlIGZldGNoXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gR0VUIGEgcGFnZS4gUGFzc2VzIHRoZSByZXNwb25zZSBvZiB0aGUgWEhSIGluIHRoZSByZXNvbHZlIHByb21pc2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vc2VuZHMgYSBHRVQgcmVxdWVzdCB0byAvc29tZS91cmwucGhwP2E9dGVzdFxyXG4gKiBnZXQoJy9zb21lL3VybC5waHAnLCB7YTogJ3Rlc3QnfSkudGhlbihjb25zb2xlLmxvZylcclxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zU3RyXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXQodXJsID0gJy8nLCBwYXJhbXMgPSB7fSkge1xyXG4gICAgaWYgKE9iamVjdC5rZXlzKHBhcmFtcykubGVuZ3RoKSB7XHJcbiAgICAgICAgdmFyIGFkZGl0aW9uID0gdXJsU3RyaW5naWZ5KHBhcmFtcyk7XHJcbiAgICAgICAgaWYgKHVybC5pbmNsdWRlcygnPycpKSB7XHJcbiAgICAgICAgICAgIHVybCArPSBgJiR7YWRkaXRpb259YDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB1cmwgKz0gYD8ke2FkZGl0aW9ufWA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB4aHIoJ0dFVCcsIHVybCwge30pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYSBKU09OIG9iamVjdCBpbiB0aGUgcHJvbWlzZSByZXNvbHZlIG1ldGhvZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW1PYmpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldEpTT04odXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4gZ2V0KHVybCwgcGFyYW1PYmopLnRoZW4oSlNPTi5wYXJzZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gbWFrZSBhIHBvc3QgcmVxdWVzdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbU9ialxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gcG9zdCh1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiB4aHIoJ1BPU1QnLCB1cmwsIHBhcmFtT2JqKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBmZXRjaCBKU09OIGZyb20gYSBwYWdlIHRocm91Z2ggcG9zdC5cclxuICpcclxuICogQHBhcmFtIHN0cmluZyB1cmxcclxuICogQHBhcmFtIHN0cmluZyBwYXJhbU9ialxyXG4gKiBAcmV0dXJuIFByb21pc2VcclxuICovXHJcbmZ1bmN0aW9uIHBvc3RKU09OKHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIHBvc3QodXJsLCBwYXJhbU9iaikudGhlbihKU09OLnBhcnNlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4qIEhlbHBlciBmdW5jdGlvbiB0byBtYWtlIFhIUiByZXF1ZXN0cywgaWYgcG9zc2libGUgdXNlIHRoZSBnZXQgYW5kIHBvc3QgZnVuY3Rpb25zIGluc3RlYWQuXHJcbipcclxuKiBAZGVwcmljYXRlZCBzaW5jZSB2ZXJzaW9uIDYuMVxyXG4qIEBwYXJhbSBzdHJpbmcgcHJvdG9jb2xcclxuKiBAcGFyYW0gc3RyaW5nIHVybFxyXG4qIEBwYXJhbSBvYmplY3QgcGFyYW1PYmogLS0gV0FSTklORy4gT25seSBhY2NlcHRzIHNoYWxsb3cgb2JqZWN0cy5cclxuKiBAcmV0dXJuIFByb21pc2VcclxuKi9cclxuZnVuY3Rpb24geGhyKHByb3RvY29sLCB1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHZhciBwYXJhbVN0ciA9IHVybFN0cmluZ2lmeShwYXJhbU9iaik7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgdmFyIHJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgICAgIHJlcS5vcGVuKHByb3RvY29sLCB1cmwpO1xyXG4gICAgICAgIHJlcS5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0Jyk7XHJcbiAgICAgICAgaWYgKHByb3RvY29sID09ICdQT1NUJykge1xyXG4gICAgICAgICAgICByZXEuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVxLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAocmVxLnN0YXR1cyA9PSAyMDApIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVxLnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVxLnN0YXR1c1RleHQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgLy8gSGFuZGxlIG5ldHdvcmsgZXJyb3JzXHJcbiAgICAgICAgcmVxLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmVqZWN0KEVycm9yKFwiTmV0d29yayBFcnJvclwiKSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAocGFyYW1TdHIpIHtcclxuICAgICAgICAgICAgcmVxLnNlbmQocGFyYW1TdHIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlcS5zZW5kKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdXNlZCB0byBzdHJpbmdpZnkgdXJsIHBhcmFtZXRlcnNcclxuICovXHJcbmZ1bmN0aW9uIHVybFN0cmluZ2lmeShvYmopIHtcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopXHJcbiAgICAubWFwKGsgPT4gYCR7ZW5jb2RlVVJJQ29tcG9uZW50KGspfT0ke2VuY29kZVVSSUNvbXBvbmVudChvYmpba10pfWApXHJcbiAgICAuam9pbignJicpO1xyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7eGhyLCBnZXQsIGdldEpTT04sIHBvc3QsIHBvc3RKU09OfTtcclxuIiwiLyoqXHJcbiAqIEBmaWxlIENvbnRhaW5zIGZ1bmN0aW9ucyB0byBpbnRlcmFjdCB3aXRoIGJsb2NraGVhZHNmYW5zLmNvbSAtIGNhbm5vdCBiZSB1c2VkIGJ5IGV4dGVuc2lvbnMuXHJcbiAqL1xyXG5cclxudmFyIHVpID0gcmVxdWlyZSgnYXBwL3VpJyk7XHJcbnZhciBhamF4ID0gcmVxdWlyZSgnYXBwL2xpYnJhcmllcy9hamF4Jyk7XHJcblxyXG5jb25zdCBBUElfVVJMUyA9IHtcclxuICAgIFNUT1JFOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9leHRlbnNpb24vc3RvcmUnLFxyXG4gICAgTkFNRTogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvZXh0ZW5zaW9uL25hbWUnLFxyXG4gICAgRVJST1I6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2JvdC9lcnJvcicsXHJcbn07XHJcblxyXG52YXIgY2FjaGUgPSB7XHJcbiAgICBuYW1lczogbmV3IE1hcCgpLFxyXG59O1xyXG5cclxuLy9CdWlsZCB0aGUgaW5pdGlhbCBuYW1lcyBtYXBcclxuZ2V0U3RvcmUoKS50aGVuKHN0b3JlID0+IHtcclxuICAgIGlmIChzdG9yZS5zdGF0dXMgIT0gJ29rJykge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGxldCBleCBvZiBzdG9yZS5leHRlbnNpb25zKSB7XHJcbiAgICAgICAgY2FjaGUubmFtZXMuc2V0KGV4LmlkLCBleC50aXRsZSk7XHJcbiAgICB9XHJcbn0pLmNhdGNoKHJlcG9ydEVycm9yKTtcclxuXHJcblxyXG4vKipcclxuICogVXNlZCB0byBnZXQgcHVibGljIGV4dGVuc2lvbnNcclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0U3RvcmUoKS50aGVuKHN0b3JlID0+IGNvbnNvbGUubG9nKHN0b3JlKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHVzZSB0aGUgY2FjaGVkIHJlc3BvbnNlIHNob3VsZCBiZSBjbGVhcmVkLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSByZXNvbHZlcyB3aXRoIHRoZSByZXNwb25zZVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0U3RvcmUocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0U3RvcmUpIHtcclxuICAgICAgICBjYWNoZS5nZXRTdG9yZSA9IGFqYXguZ2V0SlNPTihBUElfVVJMUy5TVE9SRSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldFN0b3JlO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIG5hbWUgb2YgdGhlIHByb3ZpZGVkIGV4dGVuc2lvbiBJRC5cclxuICogSWYgdGhlIGV4dGVuc2lvbiB3YXMgbm90IGZvdW5kLCByZXNvbHZlcyB3aXRoIHRoZSBvcmlnaW5hbCBwYXNzZWQgSUQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldEV4dGVuc2lvbk5hbWUoJ3Rlc3QnKS50aGVuKG5hbWUgPT4gY29uc29sZS5sb2cobmFtZSkpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgdGhlIGlkIHRvIHNlYXJjaCBmb3IuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9IHJlc29sdmVzIHdpdGggdGhlIGV4dGVuc2lvbiBuYW1lLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uTmFtZShpZCkge1xyXG4gICAgaWYgKGNhY2hlLm5hbWVzLmhhcyhpZCkpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhY2hlLm5hbWVzLmdldChpZCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhamF4LnBvc3RKU09OKEFQSV9VUkxTLk5BTUUsIHtpZH0pLnRoZW4obmFtZSA9PiB7XHJcbiAgICAgICAgY2FjaGUubmFtZXMuc2V0KGlkLCBuYW1lKTtcclxuICAgICAgICByZXR1cm4gbmFtZTtcclxuICAgIH0sIGVyciA9PiB7XHJcbiAgICAgICAgcmVwb3J0RXJyb3IoZXJyKTtcclxuICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXBvcnRzIGFuIGVycm9yIHNvIHRoYXQgaXQgY2FuIGJlIHJldmlld2VkIGFuZCBmaXhlZCBieSBleHRlbnNpb24gb3IgYm90IGRldmVsb3BlcnMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHJlcG9ydEVycm9yKEVycm9yKFwiUmVwb3J0IG1lXCIpKTtcclxuICogQHBhcmFtIHtFcnJvcn0gZXJyIHRoZSBlcnJvciB0byByZXBvcnRcclxuICovXHJcbmZ1bmN0aW9uIHJlcG9ydEVycm9yKGVycikge1xyXG4gICAgYWpheC5wb3N0SlNPTihBUElfVVJMUy5FUlJPUiwge1xyXG4gICAgICAgICAgICBlcnJvcl90ZXh0OiBlcnIubWVzc2FnZSxcclxuICAgICAgICAgICAgZXJyb3JfZmlsZTogZXJyLmZpbGVuYW1lLFxyXG4gICAgICAgICAgICBlcnJvcl9yb3c6IGVyci5saW5lbm8gfHwgMCxcclxuICAgICAgICAgICAgZXJyb3JfY29sdW1uOiBlcnIuY29sbm8gfHwgMCxcclxuICAgICAgICAgICAgZXJyb3Jfc3RhY2s6IGVyci5zdGFjayB8fCAnJyxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKChyZXNwKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyZXNwLnN0YXR1cyA9PSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICB1aS5ub3RpZnkoJ1NvbWV0aGluZyB3ZW50IHdyb25nLCBpdCBoYXMgYmVlbiByZXBvcnRlZC4nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHVpLm5vdGlmeShgRXJyb3IgcmVwb3J0aW5nIGV4Y2VwdGlvbjogJHtyZXNwLm1lc3NhZ2V9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBnZXRTdG9yZSxcclxuICAgIGdldEV4dGVuc2lvbk5hbWUsXHJcbiAgICByZXBvcnRFcnJvcixcclxufTtcclxuIiwidmFyIGFqYXggPSByZXF1aXJlKCcuL2FqYXgnKTtcclxudmFyIGhvb2sgPSByZXF1aXJlKCcuL2hvb2snKTtcclxudmFyIGJoZmFuc2FwaSA9IHJlcXVpcmUoJy4vYmhmYW5zYXBpJyk7XHJcblxyXG5jb25zdCB3b3JsZElkID0gd2luZG93LndvcmxkSWQ7XHJcbnZhciBjYWNoZSA9IHtcclxuICAgIGZpcnN0SWQ6IDAsXHJcbn07XHJcblxyXG4vLyBVc2VkIHRvIHBhcnNlIG1lc3NhZ2VzIG1vcmUgYWNjdXJhdGVseVxyXG52YXIgd29ybGQgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW11cclxufTtcclxuZ2V0T25saW5lUGxheWVycygpXHJcbiAgICAudGhlbihwbGF5ZXJzID0+IHdvcmxkLnBsYXllcnMgPSBbLi4ubmV3IFNldChwbGF5ZXJzLmNvbmNhdCh3b3JsZC5wbGF5ZXJzKSldKTtcclxuXHJcbmdldFdvcmxkTmFtZSgpXHJcbiAgICAudGhlbihuYW1lID0+IHdvcmxkLm5hbWUgPSBuYW1lKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHdvcmxkU3RhcnRlZCxcclxuICAgIGdldExvZ3MsXHJcbiAgICBnZXRMaXN0cyxcclxuICAgIGdldEhvbWVwYWdlLFxyXG4gICAgZ2V0T25saW5lUGxheWVycyxcclxuICAgIGdldE93bmVyTmFtZSxcclxuICAgIGdldFdvcmxkTmFtZSxcclxuICAgIHNlbmQsXHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIHRoZSB3b3JsZCBpZiBuZWNjZXNzYXJ5LCByZWplY3RzIGlmIHRoZSB3b3JsZCB0YWtlcyB0b28gbG9uZyB0byBzdGFydCBvciBpcyB1bmF2YWlsaWJsZVxyXG4gKiBSZWZhY3RvcmluZyB3ZWxjb21lLiBUaGlzIHNlZW1zIG92ZXJseSBweXJhbWlkIGxpa2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHdvcmxkU3RhcnRlZCgpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ3N0YXJ0ZWQhJykpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWNoZWNrIGlmIHRoZSB3b3JsZCBpcyBzdGFydGVkLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gd29ybGRTdGFydGVkKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLndvcmxkU3RhcnRlZCkge1xyXG4gICAgICAgIGNhY2hlLndvcmxkU3RhcnRlZCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdmFyIGZhaWxzID0gMDtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uIGNoZWNrKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ291bGQgdGhpcyBiZSBtb3JlIHNpbXBsaWZpZWQ/XHJcbiAgICAgICAgICAgICAgICBhamF4LnBvc3RKU09OKCcvYXBpJywgeyBjb21tYW5kOiAnc3RhdHVzJywgd29ybGRJZCB9KS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlc3BvbnNlLndvcmxkU3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ29ubGluZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdvZmZsaW5lJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFqYXgucG9zdEpTT04oJy9hcGknLCB7IGNvbW1hbmQ6ICdzdGFydCcsIHdvcmxkSWQgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihjaGVjaywgY2hlY2spO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3VuYXZhaWxpYmxlJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdXb3JsZCB1bmF2YWlsaWJsZS4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0YXJ0dXAnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzaHV0ZG93bic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrLCAzMDAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgrK2ZhaWxzID4gMTApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignV29ybGQgdG9vayB0b28gbG9uZyB0byBzdGFydC4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdVbmtub3duIHJlc3BvbnNlLicpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChiaGZhbnNhcGkucmVwb3J0RXJyb3IpO1xyXG4gICAgICAgICAgICB9KCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS53b3JsZFN0YXJ0ZWQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCBhbiBhcnJheSBvZiB0aGUgbG9nJ3MgbGluZXMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldExvZ3MoKS50aGVuKGxpbmVzID0+IGNvbnNvbGUubG9nKGxpbmVzWzBdKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZG93bmxvYWQgdGhlIGxvZ3NcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldExvZ3MocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0TG9ncykge1xyXG4gICAgICAgIGNhY2hlLmdldExvZ3MgPSB3b3JsZFN0YXJ0ZWQoKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBhamF4LmdldChgL3dvcmxkcy9sb2dzLyR7d29ybGRJZH1gKSlcclxuICAgICAgICAgICAgLnRoZW4obG9nID0+IGxvZy5zcGxpdCgnXFxuJykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRMb2dzO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYSBsaXN0IG9mIGFkbWlucywgbW9kcywgc3RhZmYgKGFkbWlucyArIG1vZHMpLCB3aGl0ZWxpc3QsIGFuZCBibGFja2xpc3QuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldExpc3RzKCkudGhlbihsaXN0cyA9PiBjb25zb2xlLmxvZyhsaXN0cy5hZG1pbikpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWZldGNoIHRoZSBsaXN0cy5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldExpc3RzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldExpc3RzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0TGlzdHMgPSB3b3JsZFN0YXJ0ZWQoKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBhamF4LmdldChgL3dvcmxkcy9saXN0cy8ke3dvcmxkSWR9YCkpXHJcbiAgICAgICAgICAgIC50aGVuKGh0bWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0TGlzdChuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBkb2MucXVlcnlTZWxlY3RvcihgdGV4dGFyZWFbbmFtZT0ke25hbWV9XWApXHJcbiAgICAgICAgICAgICAgICAgICAgLnZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgLnRvTG9jYWxlVXBwZXJDYXNlKClcclxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJ1xcbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbLi4ubmV3IFNldChsaXN0KV07IC8vUmVtb3ZlIGR1cGxpY2F0ZXNcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbGlzdHMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWRtaW46IGdldExpc3QoJ2FkbWlucycpLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZDogZ2V0TGlzdCgnbW9kbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgICAgIHdoaXRlOiBnZXRMaXN0KCd3aGl0ZWxpc3QnKSxcclxuICAgICAgICAgICAgICAgICAgICBibGFjazogZ2V0TGlzdCgnYmxhY2tsaXN0JyksXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgbGlzdHMubW9kID0gbGlzdHMubW9kLmZpbHRlcihuYW1lID0+ICFsaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lKSk7XHJcbiAgICAgICAgICAgICAgICBsaXN0cy5zdGFmZiA9IGxpc3RzLmFkbWluLmNvbmNhdChsaXN0cy5tb2QpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0cztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLndvcmxkU3RhcnRlZDtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSBob21lcGFnZSBvZiB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiBjb25zb2xlLmxvZyhodG1sLnN1YnN0cmluZygwLCAxMDApKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZmV0Y2ggdGhlIHBhZ2UuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRIb21lcGFnZShyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRIb21lcGFnZSkge1xyXG4gICAgICAgIGNhY2hlLmdldEhvbWVwYWdlID0gYWpheC5nZXQoYC93b3JsZHMvJHt3b3JsZElkfWApXHJcbiAgICAgICAgICAgIC5jYXRjaCgoKSA9PiBnZXRIb21lcGFnZSh0cnVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldEhvbWVwYWdlO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgcGxheWVyIG5hbWVzLlxyXG4gKiBBbiBvbmxpbmUgbGlzdCBpcyBtYWludGFpbmVkIGJ5IHRoZSBib3QsIHRoaXMgc2hvdWxkIGdlbmVyYWxseSBub3QgYmUgdXNlZC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T25saW5lUGxheWVycygpLnRoZW4ob25saW5lID0+IHsgZm9yIChsZXQgbiBvZiBvbmxpbmUpIHsgY29uc29sZS5sb2cobiwgJ2lzIG9ubGluZSEnKX19KTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmcmVzaCB0aGUgb25saW5lIG5hbWVzLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T25saW5lUGxheWVycyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0T25saW5lUGxheWVycyA9IGdldEhvbWVwYWdlKHRydWUpXHJcbiAgICAgICAgICAgIC50aGVuKChodG1sKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJFbGVtcyA9IGRvYy5xdWVyeVNlbGVjdG9yKCcubWFuYWdlci5wYWRkZWQ6bnRoLWNoaWxkKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAucXVlcnlTZWxlY3RvckFsbCgndHI6bm90KC5oaXN0b3J5KSA+IHRkLmxlZnQnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgQXJyYXkuZnJvbShwbGF5ZXJFbGVtcykuZm9yRWFjaCgoZWwpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJzLnB1c2goZWwudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGxheWVycztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldE9ubGluZVBsYXllcnM7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgc2VydmVyIG93bmVyJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T3duZXJOYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBpcyBvd25lZCBieScsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE93bmVyTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcuc3ViaGVhZGVyfnRyPnRkOm5vdChbY2xhc3NdKScpLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIHdvcmxkJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0V29ybGROYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBuYW1lOicsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldFdvcmxkTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcjdGl0bGUnKS50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZW5kcyBhIG1lc3NhZ2UsIHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiBzZW50IG9yIHJlamVjdHMgb24gZmFpbHVyZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2VuZCgnaGVsbG8hJykudGhlbigoKSA9PiBjb25zb2xlLmxvZygnc2VudCcpKS5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gc2VuZC5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHNlbmQobWVzc2FnZSkge1xyXG4gICAgcmV0dXJuIGFqYXgucG9zdEpTT04oYC9hcGlgLCB7Y29tbWFuZDogJ3NlbmQnLCBtZXNzYWdlLCB3b3JsZElkfSlcclxuICAgICAgICAudGhlbihyZXNwID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlc3Auc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXNwO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4ocmVzcCA9PiB7XHJcbiAgICAgICAgICAgIC8vSGFuZGxlIGhvb2tzXHJcbiAgICAgICAgICAgIGhvb2suZmlyZSgnd29ybGQuc2VuZCcsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBob29rLmZpcmUoJ3dvcmxkLnNlcnZlcm1lc3NhZ2UnLCBtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgIC8vRGlzYWxsb3cgY29tbWFuZHMgc3RhcnRpbmcgd2l0aCBzcGFjZS5cclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpICYmICFtZXNzYWdlLnN0YXJ0c1dpdGgoJy8gJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFyZ3MgPSAnJztcclxuICAgICAgICAgICAgICAgIGlmIChjb21tYW5kLmluY2x1ZGVzKCcgJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBtZXNzYWdlLnN1YnN0cmluZyhtZXNzYWdlLmluZGV4T2YoJyAnKSArIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsICdTRVJWRVInLCBjb21tYW5kLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3A7XHJcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgaWYgKGVyciA9PSAnV29ybGQgbm90IHJ1bm5pbmcuJykge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuZmlyc3RJZCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIHdhdGNoIGNoYXQuXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja0NoYXQoKSB7XHJcbiAgICBnZXRNZXNzYWdlcygpLnRoZW4oKG1zZ3MpID0+IHtcclxuICAgICAgICBtc2dzLmZvckVhY2goKG1lc3NhZ2UpID0+IHtcclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChgJHt3b3JsZC5uYW1lfSAtIFBsYXllciBDb25uZWN0ZWQgYCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBbLCBuYW1lLCBpcF0gPSBtZXNzYWdlLm1hdGNoKC8gLSBQbGF5ZXIgQ29ubmVjdGVkICguKikgXFx8IChbXFxkLl0rKSBcXHwgKFtcXHddezMyfSlcXHMqJC8pO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlSm9pbk1lc3NhZ2VzKG5hbWUsIGlwKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkLm5hbWV9IC0gUGxheWVyIERpc2Nvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBtZXNzYWdlLnN1YnN0cmluZyh3b3JsZC5uYW1lLmxlbmd0aCArIDIzKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJzogJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gZ2V0VXNlcm5hbWUobWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbXNnID0gbWVzc2FnZS5zdWJzdHJpbmcobmFtZS5sZW5ndGggKyAyKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtc2cpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZU90aGVyTWVzc2FnZXMobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcilcclxuICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQ2hhdCwgNTAwMCk7XHJcbiAgICB9KTtcclxufVxyXG5jaGVja0NoYXQoKTtcclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2V0IHRoZSBsYXRlc3QgY2hhdCBtZXNzYWdlcy5cclxuICpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE1lc3NhZ2VzKCkge1xyXG4gICAgcmV0dXJuIHdvcmxkU3RhcnRlZCgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5wb3N0SlNPTihgL2FwaWAsIHsgY29tbWFuZDogJ2dldGNoYXQnLCB3b3JsZElkLCBmaXJzdElkOiBjYWNoZS5maXJzdElkIH0pKVxyXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT0gJ29rJyAmJiBkYXRhLm5leHRJZCAhPSBjYWNoZS5maXJzdElkKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5maXJzdElkID0gZGF0YS5uZXh0SWQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5sb2c7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5zdGF0dXMgPT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHdobyBzZW50IGEgbWVzc2FnZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIG5hbWUgPSBnZXRVc2VybmFtZSgnU0VSVkVSOiBIaSB0aGVyZSEnKTtcclxuICogLy9uYW1lID09ICdTRVJWRVInXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIHBhcnNlLlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBuYW1lIG9mIHRoZSB1c2VyIHdobyBzZW50IHRoZSBtZXNzYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0VXNlcm5hbWUobWVzc2FnZSkge1xyXG4gICAgZm9yIChsZXQgaSA9IDE4OyBpID4gNDsgaS0tKSB7XHJcbiAgICAgICAgbGV0IHBvc3NpYmxlTmFtZSA9IG1lc3NhZ2Uuc3Vic3RyaW5nKDAsIG1lc3NhZ2UubGFzdEluZGV4T2YoJzogJywgaSkpO1xyXG4gICAgICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMocG9zc2libGVOYW1lKSB8fCBwb3NzaWJsZU5hbWUgPT0gJ1NFUlZFUicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBvc3NpYmxlTmFtZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBTaG91bGQgaWRlYWxseSBuZXZlciBoYXBwZW4uXHJcbiAgICByZXR1cm4gbWVzc2FnZS5zdWJzdHJpbmcoMCwgbWVzc2FnZS5sYXN0SW5kZXhPZignOiAnLCAxOCkpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgam9pbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgam9pbmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IGlwIHRoZSBpcCBvZiB0aGUgcGxheWVyIGpvaW5pbmcuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVKb2luTWVzc2FnZXMobmFtZSwgaXApIHtcclxuICAgIGlmICghd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQuam9pbicsIG5hbWUsIGlwKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgZGlzY29ubmVjdGlvbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgbGVhdmluZy5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSkge1xyXG4gICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5zcGxpY2Uod29ybGQub25saW5lLmluZGV4T2YobmFtZSksIDEpO1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLmxlYXZlJywgbmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHVzZXIgY2hhdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdXNlci5cclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2Ugc2VudC5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICBpZiAobmFtZSA9PSAnU0VSVkVSJykge1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLnNlcnZlcmNoYXQnLCBtZXNzYWdlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQubWVzc2FnZScsIG5hbWUsIG1lc3NhZ2UpO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSAmJiAhbWVzc2FnZS5zdGFydHNXaXRoKCcvICcpKSB7XHJcblxyXG4gICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgIGxldCBhcmdzID0gJyc7XHJcbiAgICAgICAgaWYgKGNvbW1hbmQuaW5jbHVkZXMoJyAnKSkge1xyXG4gICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICBhcmdzID0gbWVzc2FnZS5zdWJzdHJpbmcobWVzc2FnZS5pbmRleE9mKCcgJykgKyAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsIG5hbWUsIGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgICAgIHJldHVybjsgLy9ub3QgY2hhdFxyXG4gICAgfVxyXG5cclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLmNoYXQnLCBuYW1lLCBtZXNzYWdlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIGhhbmRsZSBtZXNzYWdlcyB3aGljaCBhcmUgbm90IHNpbXBseSBwYXJzZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIGhhbmRsZVxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlT3RoZXJNZXNzYWdlcyhtZXNzYWdlKSB7XHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5vdGhlcicsIG1lc3NhZ2UpO1xyXG59XHJcbiIsInZhciBsaXN0ZW5lcnMgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGJlZ2luIGxpc3RlbmluZyB0byBhbiBldmVudC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogbGlzdGVuKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogLy9hbHRlcm5hdGl2ZWx5XHJcbiAqIG9uKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0aGUgZXZlbnQgaGFuZGxlclxyXG4gKi9cclxuZnVuY3Rpb24gbGlzdGVuKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIGxpc3RlbmVyc1trZXldID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XS5pbmNsdWRlcyhjYWxsYmFjaykpIHtcclxuICAgICAgICBsaXN0ZW5lcnNba2V5XS5wdXNoKGNhbGxiYWNrKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHN0b3AgbGlzdGVuaW5nIHRvIGFuIGV2ZW50LiBJZiB0aGUgbGlzdGVuZXIgd2FzIG5vdCBmb3VuZCwgbm8gYWN0aW9uIHdpbGwgYmUgdGFrZW4uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vRWFybGllciBhdHRhY2hlZCBteUZ1bmMgdG8gJ2V2ZW50J1xyXG4gKiByZW1vdmUoJ2V2ZW50JywgbXlGdW5jKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gc3RvcCBsaXN0ZW5pbmcgdG8uXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRoZSBjYWxsYmFjayB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQgbGlzdGVuZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKGxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgaWYgKGxpc3RlbmVyc1trZXldLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICBsaXN0ZW5lcnNba2V5XS5zcGxpY2UobGlzdGVuZXJzW2tleV0uaW5kZXhPZihjYWxsYmFjayksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNhbGwgZXZlbnRzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBjaGVjaygndGVzdCcsIDEsIDIsIDMpO1xyXG4gKiBjaGVjaygndGVzdCcsIHRydWUpO1xyXG4gKiAvLyBhbHRlcm5hdGl2ZWx5XHJcbiAqIGZpcmUoJ3Rlc3QnLCAxLCAyLCAzKTtcclxuICogZmlyZSgndGVzdCcsIHRydWUpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBjYWxsLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhcmd1bWVudHMgdG8gcGFzcyB0byBsaXN0ZW5pbmcgZnVuY3Rpb25zLlxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2soa2V5LCAuLi5hcmdzKSB7XHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGlzdGVuZXJzW2tleV0uZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lcikge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVyKC4uLmFyZ3MpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgdmFsdWUgYmFzZWQgb24gaW5wdXQgZnJvbSBsaXN0ZW5lcnMuXHJcbiAqXHJcbiAqIEBkZXByaWNhdGVkIHNpbmNlIDYuMS4wLiBJbnN0ZWFkLCB1cGRhdGUgcmVxdWVzdHMgc2hvdWxkIGJlIGhhbmRsZWQgYnkgdGhlIGV4dGVuc2lvbiBpdGVzZWxmLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1cGRhdGUoJ2V2ZW50JywgdHJ1ZSwgMSwgMiwgMyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGNhbGxcclxuICogQHBhcmFtIHttaXhlZH0gaW5pdGlhbCB0aGUgaW5pdGlhbCB2YWx1ZSB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIHVwZGF0ZShrZXksIGluaXRpYWwsIC4uLmFyZ3MpIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIHJldHVybiBpbml0aWFsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsaXN0ZW5lcnNba2V5XS5yZWR1Y2UoZnVuY3Rpb24ocHJldmlvdXMsIGN1cnJlbnQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gY3VycmVudChwcmV2aW91cywgLi4uYXJncyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91cztcclxuICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcHJldmlvdXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgaW5pdGlhbCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbGlzdGVuLFxyXG4gICAgb246IGxpc3RlbixcclxuICAgIHJlbW92ZSxcclxuICAgIGNoZWNrLFxyXG4gICAgZmlyZTogY2hlY2ssXHJcbiAgICB1cGRhdGUsXHJcbn07XHJcbiIsImZ1bmN0aW9uIHVwZGF0ZShrZXlzLCBvcGVyYXRvcikge1xyXG4gICAgT2JqZWN0LmtleXMobG9jYWxTdG9yYWdlKS5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBvZiBrZXlzKSB7XHJcbiAgICAgICAgICAgIGlmIChpdGVtLnN0YXJ0c1dpdGgoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oaXRlbSwgb3BlcmF0b3IobG9jYWxTdG9yYWdlLmdldEl0ZW0oaXRlbSkpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vanNoaW50IC1XMDg2XHJcbi8vTm8gYnJlYWsgc3RhdGVtZW50cyBhcyB3ZSB3YW50IHRvIGV4ZWN1dGUgYWxsIHVwZGF0ZXMgYWZ0ZXIgbWF0Y2hlZCB2ZXJzaW9uLlxyXG5zd2l0Y2ggKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdtYl92ZXJzaW9uJykpIHtcclxuICAgIGNhc2UgbnVsbDpcclxuICAgICAgICBicmVhazsgLy9Ob3RoaW5nIHRvIG1pZ3JhdGVcclxuICAgIGNhc2UgJzUuMi4wJzpcclxuICAgIGNhc2UgJzUuMi4xJzpcclxuICAgICAgICAvL1dpdGggNi4wLCBuZXdsaW5lcyBhcmUgZGlyZWN0bHkgc3VwcG9ydGVkIGluIG1lc3NhZ2VzIGJ5IHRoZSBib3QuXHJcbiAgICAgICAgdXBkYXRlKFsnYW5ub3VuY2VtZW50QXJyJywgJ2pvaW5BcnInLCAnbGVhdmVBcnInLCAndHJpZ2dlckFyciddLCBmdW5jdGlvbihyYXcpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdyk7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtc2cubWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cubWVzc2FnZSA9IG1zZy5tZXNzYWdlLnJlcGxhY2UoL1xcXFxuL2csICdcXG4nKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXJzZWQpO1xyXG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByYXc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBicmVhazsgLy9OZXh0IGJ1Z2ZpeCBvbmx5IHJlbGF0ZXMgdG8gNi4wIGJvdC5cclxuICAgIGNhc2UgJzYuMC4wYSc6XHJcbiAgICBjYXNlICc2LjAuMCc6XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgd2luZG93LmJvdHVpLmFsZXJ0KFwiRHVlIHRvIGEgYnVnIGluIHRoZSA2LjAuMCB2ZXJzaW9uIG9mIHRoZSBib3QsIHlvdXIgam9pbiBhbmQgbGVhdmUgbWVzc2FnZXMgbWF5IGJlIHN3YXBwZWQuIFNvcnJ5ISBUaGlzIGNhbm5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5LiBUaGlzIG1lc3NhZ2Ugd2lsbCBub3QgYmUgc2hvd24gYWdhaW4uXCIpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgICAgIGJyZWFrOyAvL05leHQgYnVnZml4IG9ubHkgcmVsYXRlcyB0byA2LjAuMSAvIDYuMC4yLlxyXG4gICAgY2FzZSAnNi4wLjEnOlxyXG4gICAgY2FzZSAnNi4wLjInOlxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5ib3R1aS5hbGVydChcIkR1ZSB0byBhIGJ1ZyBpbiA2LjAuMSAvIDYuMC4yLCBncm91cHMgbWF5IGhhdmUgYmVlbiBtaXhlZCB1cCBvbiBKb2luLCBMZWF2ZSwgYW5kIFRyaWdnZXIgbWVzc2FnZXMuIFNvcnJ5ISBUaGlzIGNhbm5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5IGlmIGl0IG9jY3VyZWQgb24geW91ciBib3QuIEFubm91bmNlbWVudHMgaGF2ZSBhbHNvIGJlZW4gZml4ZWQuXCIpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgY2FzZSAnNi4wLjMnOlxyXG4gICAgY2FzZSAnNi4wLjQnOlxyXG4gICAgY2FzZSAnNi4wLjUnOlxyXG59XHJcbi8vanNoaW50ICtXMDg2XHJcbiIsIi8vaXNTdGFmZiBpc01vZCBpc0FkbWluXHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge31cclxuIiwiLy8gT3ZlcndyaXRlIHRoZSBwb2xsQ2hhdCBmdW5jdGlvbiB0byBraWxsIHRoZSBkZWZhdWx0IGNoYXQgZnVuY3Rpb25cclxud2luZG93LnBvbGxDaGF0ID0gZnVuY3Rpb24oKSB7fTtcclxuXHJcbi8vIE92ZXJ3cml0ZSB0aGUgb2xkIHBhZ2VcclxuZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSAnJztcclxuZG9jdW1lbnQuaGVhZC5pbm5lckhUTUwgPSAnJztcclxuXHJcbnJlcXVpcmUoJ2FwcC91aS9wb2x5ZmlsbHMvY29uc29sZScpO1xyXG5yZXF1aXJlKCdhcHAvbGlicmFyaWVzL21pZ3JhdGlvbicpO1xyXG5cclxudmFyIGJoZmFuc2FwaSA9IHJlcXVpcmUoJ2FwcC9saWJyYXJpZXMvYmhmYW5zYXBpJyk7XHJcbnZhciBob29rID0gcmVxdWlyZSgnYXBwL2xpYnJhcmllcy9ob29rJyk7XHJcblxyXG5ob29rLm9uKCdlcnJvcicsIGJoZmFuc2FwaS5yZXBvcnRFcnJvcik7XHJcblxyXG5yZXF1aXJlKCdhcHAvY29uc29sZScpO1xyXG5cclxuXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIChlcnIpID0+IHtcclxuICAgIGlmIChlcnIubWVzc2FnZSAhPSAnU2NyaXB0IGVycm9yJykge1xyXG4gICAgICAgIHdpbmRvdy5ob29rLmNoZWNrKCdlcnJvcicsIGVycik7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCJyZXF1aXJlKCcuL3BvbHlmaWxscy9kZXRhaWxzJyk7XHJcblxyXG4vLyBCdWlsZCB0aGUgQVBJXHJcbk9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vbGF5b3V0JyksXHJcbiAgICByZXF1aXJlKCcuL3RlbXBsYXRlJyksXHJcbiAgICByZXF1aXJlKCcuL25vdGlmaWNhdGlvbnMnKVxyXG4pO1xyXG5cclxuLy8gRnVuY3Rpb25zIHdoaWNoIGFyZSBubyBsb25nZXIgY29udGFpbmVkIGluIHRoaXMgbW9kdWxlLCBidXQgYXJlIHJldGFpbmVkIGZvciBub3cgZm9yIGJhY2t3YXJkIGNvbXBhdGFiaWxpdHkuXHJcbmNvbnN0IHdyaXRlID0gcmVxdWlyZSgnYXBwL2NvbnNvbGUvZXhwb3J0cycpLndyaXRlO1xyXG5tb2R1bGUuZXhwb3J0cy5hZGRNZXNzYWdlVG9Db25zb2xlID0gZnVuY3Rpb24obXNnLCBuYW1lID0gJycsIG5hbWVDbGFzcyA9ICcnKSB7XHJcbiAgICBjb25zb2xlLndhcm4oJ3VpLmFkZE1lc3NhZ2VUb0NvbnNvbGUgaGFzIGJlZW4gZGVwcmljYXRlZC4gVXNlIGV4LmNvbnNvbGUud3JpdGUgaW5zdGVhZC4nKTtcclxuICAgIHdyaXRlKG1zZywgbmFtZSwgbmFtZUNsYXNzKTtcclxufTtcclxuIiwiLyoqXHJcbiAqIEBmaWxlIENvbnRhaW5zIGZ1bmN0aW9ucyBmb3IgbWFuYWdpbmcgdGhlIHBhZ2UgbGF5b3V0XHJcbiAqL1xyXG5cclxuLy8gQnVpbGQgcGFnZVxyXG5kb2N1bWVudC5ib2R5LmlubmVySFRNTCArPSBJTkNMVURFX0ZJTEUoJy9kZXYvdWkvbGF5b3V0L2xheW91dC5odG1sJyk7XHJcbmRvY3VtZW50LmhlYWQuaW5uZXJIVE1MICs9ICc8c3R5bGU+JyArIElOQ0xVREVfRklMRSgnL2Rldi91aS9sYXlvdXQvc3R5bGUuY3NzJykgKyAnPC9zdHlsZT4nO1xyXG5cclxuLy8gSGlkZSB0aGUgbWVudSB3aGVuIGNsaWNraW5nIHRoZSBvdmVybGF5XHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWZ0TmF2IC5vdmVybGF5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0b2dnbGVNZW51KTtcclxuXHJcbi8vIENoYW5nZSB0YWJzXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWZ0TmF2JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBnbG9iYWxUYWJDaGFuZ2UoZXZlbnQpIHtcclxuICAgIHZhciB0YWJOYW1lID0gZXZlbnQudGFyZ2V0LmRhdGFzZXQudGFiTmFtZTtcclxuICAgIGlmKCF0YWJOYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQ29udGVudFxyXG4gICAgLy9XZSBjYW4ndCBqdXN0IHJlbW92ZSB0aGUgZmlyc3QgZHVlIHRvIGJyb3dzZXIgbGFnXHJcbiAgICBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNjb250YWluZXIgPiAudmlzaWJsZScpKVxyXG4gICAgICAgIC5mb3JFYWNoKGVsID0+IGVsLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2libGUnKSk7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjY29udGFpbmVyID4gW2RhdGEtdGFiLW5hbWU9JHt0YWJOYW1lfV1gKS5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcblxyXG4gICAgLy9UYWJzXHJcbiAgICBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNsZWZ0TmF2IC5zZWxlY3RlZCcpKVxyXG4gICAgICAgIC5mb3JFYWNoKGVsID0+IGVsLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjdGVkJykpO1xyXG4gICAgZXZlbnQudGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJyk7XHJcbn0pO1xyXG5cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRvZ2dsZU1lbnUsXHJcbiAgICBhZGRUYWIsXHJcbiAgICByZW1vdmVUYWIsXHJcbiAgICBhZGRUYWJHcm91cCxcclxuICAgIHJlbW92ZVRhYkdyb3VwLFxyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNob3cvaGlkZSB0aGUgbWVudS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdG9nZ2xlTWVudSgpO1xyXG4gKi9cclxuZnVuY3Rpb24gdG9nZ2xlTWVudSgpIHtcclxuICAgIHZhciBtYWluVG9nZ2xlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xlZnROYXYgaW5wdXQnKTtcclxuICAgIG1haW5Ub2dnbGUuY2hlY2tlZCA9ICFtYWluVG9nZ2xlLmNoZWNrZWQ7XHJcbn1cclxuXHJcbnZhciB0YWJVSUQgPSAwO1xyXG4vKipcclxuICogVXNlZCB0byBhZGQgYSB0YWIgdG8gdGhlIGJvdCdzIG5hdmlnYXRpb24uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB0YWIgPSB1aS5hZGRUYWIoJ1RleHQnKTtcclxuICogdmFyIHRhYjIgPSB1aS5hZGRUYWIoJ0N1c3RvbSBNZXNzYWdlcycsICdtZXNzYWdlcycpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFiVGV4dFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZ3JvdXBOYW1lIE9wdGlvbmFsLiBJZiBwcm92aWRlZCwgdGhlIG5hbWUgb2YgdGhlIGdyb3VwIG9mIHRhYnMgdG8gYWRkIHRoaXMgdGFiIHRvLlxyXG4gKiBAcmV0dXJuIHtOb2RlfSAtIFRoZSBkaXYgdG8gcGxhY2UgdGFiIGNvbnRlbnQgaW4uXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRUYWIodGFiVGV4dCwgZ3JvdXBOYW1lID0gJ21haW4nKSB7XHJcbiAgICB2YXIgdGFiTmFtZSA9ICdib3RUYWJfJyArIHRhYlVJRCsrO1xyXG5cclxuICAgIHZhciB0YWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICB0YWIudGV4dENvbnRlbnQgPSB0YWJUZXh0O1xyXG4gICAgdGFiLmNsYXNzTGlzdC5hZGQoJ3RhYicpO1xyXG4gICAgdGFiLmRhdGFzZXQudGFiTmFtZSA9IHRhYk5hbWU7XHJcblxyXG4gICAgdmFyIHRhYkNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHRhYkNvbnRlbnQuZGF0YXNldC50YWJOYW1lID0gdGFiTmFtZTtcclxuXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbGVmdE5hdiBbZGF0YS10YWItZ3JvdXA9JHtncm91cE5hbWV9XWApLmFwcGVuZENoaWxkKHRhYik7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY29udGFpbmVyJykuYXBwZW5kQ2hpbGQodGFiQ29udGVudCk7XHJcblxyXG4gICAgcmV0dXJuIHRhYkNvbnRlbnQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIGdsb2JhbCB0YWIuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB0YWIgPSB1aS5hZGRUYWIoJ1RhYicpO1xyXG4gKiB1aS5yZW1vdmVUYWIodGFiKTtcclxuICogQHBhcmFtIHtOb2RlfSB0YWJDb250ZW50IFRoZSBkaXYgcmV0dXJuZWQgYnkgdGhlIGFkZFRhYiBmdW5jdGlvbi5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZVRhYih0YWJDb250ZW50KSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbGVmdE5hdiBbZGF0YS10YWItbmFtZT0ke3RhYkNvbnRlbnQuZGF0YXNldC50YWJOYW1lfV1gKS5yZW1vdmUoKTtcclxuICAgIHRhYkNvbnRlbnQucmVtb3ZlKCk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHRhYiBncm91cCBpbiB3aGljaCB0YWJzIGNhbiBiZSBwbGFjZWQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHVpLmFkZFRhYkdyb3VwKCdHcm91cCBUZXh0JywgJ3NvbWVfZ3JvdXAnKTtcclxuICogdWkuYWRkVGFiKCdXaXRoaW4gZ3JvdXAnLCAnc29tZV9ncm91cCcpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIFRoZSB0ZXh0IHRoZSB1c2VyIHdpbGwgc2VlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBncm91cE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZ3JvdXAgd2hpY2ggY2FuIGJlIHVzZWQgdG8gYWRkIHRhYnMgd2l0aGluIHRoZSBncm91cC5cclxuICovXHJcbmZ1bmN0aW9uIGFkZFRhYkdyb3VwKHRleHQsIGdyb3VwTmFtZSkge1xyXG4gICAgdmFyIGRldGFpbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkZXRhaWxzJyk7XHJcbiAgICBkZXRhaWxzLmRhdGFzZXQudGFiR3JvdXAgPSBncm91cE5hbWU7XHJcblxyXG4gICAgdmFyIHN1bW1hcnkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdW1tYXJ5Jyk7XHJcbiAgICBzdW1tYXJ5LnRleHRDb250ZW50ID0gdGV4dDtcclxuICAgIGRldGFpbHMuYXBwZW5kQ2hpbGQoc3VtbWFyeSk7XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xlZnROYXYgW2RhdGEtdGFiLWdyb3VwPW1haW5dJykuYXBwZW5kQ2hpbGQoZGV0YWlscyk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIHRhYiBncm91cCBhbmQgYWxsIHRhYnMgY29udGFpbmVkIHdpdGhpbiB0aGUgc3BlY2lmaWVkIGdyb3VwLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBhZGRUYWJHcm91cCgnR3JvdXAnLCAnZ3JvdXAxJyk7XHJcbiAqIHZhciBpbm5lciA9IGFkZFRhYignSW5uZXInLCAnZ3JvdXAxJyk7XHJcbiAqIHJlbW92ZVRhYkdyb3VwKCdncm91cDEnKTsgLy8gaW5uZXIgaGFzIGJlZW4gcmVtb3ZlZC5cclxuICogQHBhcmFtIHN0cmluZyBncm91cE5hbWUgdGhlIG5hbWUgb2YgdGhlIGdyb3VwIHRoYXQgd2FzIHVzZWQgaW4gdWkuYWRkVGFiR3JvdXAuXHJcbiAqL1xyXG5mdW5jdGlvbiByZW1vdmVUYWJHcm91cChncm91cE5hbWUpIHtcclxuICAgIHZhciBncm91cCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNsZWZ0TmF2IFtkYXRhLXRhYi1ncm91cD1cIiR7Z3JvdXBOYW1lfVwiXWApO1xyXG4gICAgdmFyIGl0ZW1zID0gQXJyYXkuZnJvbShncm91cC5xdWVyeVNlbGVjdG9yQWxsKCdzcGFuJykpO1xyXG5cclxuICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgLy9UYWIgY29udGVudFxyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNjb250YWluZXIgPiBbZGF0YS10YWItbmFtZT1cIiR7aXRlbS5kYXRhc2V0LnRhYk5hbWV9XCJdYCkucmVtb3ZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBncm91cC5yZW1vdmUoKTtcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGFsZXJ0XHJcbn07XHJcblxyXG4vKipcclxuKiBGdW5jdGlvbiB1c2VkIHRvIHJlcXVpcmUgYWN0aW9uIGZyb20gdGhlIHVzZXIuXHJcbipcclxuKiBAcGFyYW0ge3N0cmluZ30gdGV4dCB0aGUgdGV4dCB0byBkaXNwbGF5IGluIHRoZSBhbGVydFxyXG4qIEBwYXJhbSB7QXJyYXl9IGJ1dHRvbnMgYW4gYXJyYXkgb2YgYnV0dG9ucyB0byBhZGQgdG8gdGhlIGFsZXJ0LlxyXG4qICAgICAgICBGb3JtYXQ6IFt7dGV4dDogJ1Rlc3QnLCBzdHlsZTonc3VjY2VzcycsIGFjdGlvbjogZnVuY3Rpb24oKXt9LCB0aGlzQXJnOiB3aW5kb3csIGRpc21pc3M6IGZhbHNlfV1cclxuKiAgICAgICAgTm90ZTogdGV4dCBpcyB0aGUgb25seSByZXF1aXJlZCBwYXJhbWF0ZXIuIElmIG5vIGJ1dHRvbiBhcnJheSBpcyBzcGVjaWZpZWRcclxuKiAgICAgICAgdGhlbiBhIHNpbmdsZSBPSyBidXR0b24gd2lsbCBiZSBzaG93bi5cclxuKiAgICAgICAgIFByb3ZpZGVkIHN0eWxlczogc3VjY2VzcywgZGFuZ2VyLCB3YXJuaW5nLCBpbmZvXHJcbiogICAgICAgIERlZmF1bHRzOiBzdHlsZTogJycsIGFjdGlvbjogdW5kZWZpbmVkLCB0aGlzQXJnOiB1bmRlZmluZWQsIGRpc21pc3M6IHRydWVcclxuKi9cclxuZnVuY3Rpb24gYWxlcnQodGV4dCwgYnV0dG9ucyA9IFt7dGV4dDogJ09LJ31dKSB7XHJcbiAgICBpZiAoaW5zdGFuY2UuYWN0aXZlKSB7XHJcbiAgICAgICAgaW5zdGFuY2UucXVldWUucHVzaCh7dGV4dCwgYnV0dG9uc30pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGluc3RhbmNlLmFjdGl2ZSA9IHRydWU7XHJcblxyXG4gICAgYnV0dG9ucy5mb3JFYWNoKGZ1bmN0aW9uKGJ1dHRvbiwgaSkge1xyXG4gICAgICAgIGJ1dHRvbi5kaXNtaXNzID0gKGJ1dHRvbi5kaXNtaXNzID09PSBmYWxzZSkgPyBmYWxzZSA6IHRydWU7XHJcbiAgICAgICAgaW5zdGFuY2UuYnV0dG9uc1snYnV0dG9uXycgKyBpXSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiBidXR0b24uYWN0aW9uLFxyXG4gICAgICAgICAgICB0aGlzQXJnOiBidXR0b24udGhpc0FyZyB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIGRpc21pc3M6IHR5cGVvZiBidXR0b24uZGlzbWlzcyA9PSAnYm9vbGVhbicgPyBidXR0b24uZGlzbWlzcyA6IHRydWUsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBidXR0b24uaWQgPSAnYnV0dG9uXycgKyBpO1xyXG4gICAgICAgIGJ1aWxkQnV0dG9uKGJ1dHRvbik7XHJcbiAgICB9KTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydENvbnRlbnQnKS5pbm5lckhUTUwgPSB0ZXh0O1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCB+IC5vdmVybGF5JykuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0JykuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xyXG59XHJcblxyXG4vKipcclxuICogSG9sZHMgdGhlIGN1cnJlbnQgYWxlcnQgYW5kIHF1ZXVlIG9mIGZ1cnRoZXIgYWxlcnRzLlxyXG4gKi9cclxudmFyIGluc3RhbmNlID0ge1xyXG4gICAgYWN0aXZlOiBmYWxzZSxcclxuICAgIHF1ZXVlOiBbXSxcclxuICAgIGJ1dHRvbnM6IHt9LFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gYWRkIGJ1dHRvbiBlbGVtZW50cyB0byBhbiBhbGVydC5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IGJ1dHRvblxyXG4gKi9cclxuZnVuY3Rpb24gYnVpbGRCdXR0b24oYnV0dG9uKSB7XHJcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICBlbC5pbm5lckhUTUwgPSBidXR0b24udGV4dDtcclxuICAgIGlmIChidXR0b24uc3R5bGUpIHtcclxuICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKGJ1dHRvbi5zdHlsZSk7XHJcbiAgICB9XHJcbiAgICBlbC5pZCA9IGJ1dHRvbi5pZDtcclxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYnV0dG9uSGFuZGxlcik7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQgLmJ1dHRvbnMnKS5hcHBlbmRDaGlsZChlbCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBkZXRlcm1pbmUgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgZWFjaCBidXR0b24gYWRkZWQgdG8gYW4gYWxlcnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnRcclxuICovXHJcbmZ1bmN0aW9uIGJ1dHRvbkhhbmRsZXIoZXZlbnQpIHtcclxuICAgIHZhciBidXR0b24gPSBpbnN0YW5jZS5idXR0b25zW2V2ZW50LnRhcmdldC5pZF0gfHwge307XHJcbiAgICBpZiAodHlwZW9mIGJ1dHRvbi5hY3Rpb24gPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGJ1dHRvbi5hY3Rpb24uY2FsbChidXR0b24udGhpc0FyZyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9SZXF1aXJlIHRoYXQgdGhlcmUgYmUgYW4gYWN0aW9uIGFzb2NpYXRlZCB3aXRoIG5vLWRpc21pc3MgYnV0dG9ucy5cclxuICAgIGlmIChidXR0b24uZGlzbWlzcyB8fCB0eXBlb2YgYnV0dG9uLmFjdGlvbiAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0JykuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpO1xyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCB+IC5vdmVybGF5JykuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpO1xyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCAuYnV0dG9ucycpLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIGluc3RhbmNlLmJ1dHRvbnMgPSB7fTtcclxuICAgICAgICBpbnN0YW5jZS5hY3RpdmUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gQXJlIG1vcmUgYWxlcnRzIHdhaXRpbmcgdG8gYmUgc2hvd24/XHJcbiAgICAgICAgaWYgKGluc3RhbmNlLnF1ZXVlLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBsZXQgbmV4dCA9IGluc3RhbmNlLnF1ZXVlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIGFsZXJ0KG5leHQudGV4dCwgbmV4dC5idXR0b25zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwiT2JqZWN0LmFzc2lnbihcclxuICAgIG1vZHVsZS5leHBvcnRzLFxyXG4gICAgcmVxdWlyZSgnLi9hbGVydCcpLFxyXG4gICAgcmVxdWlyZSgnLi9ub3RpZnknKVxyXG4pO1xyXG5cclxudmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuZWwuaW5uZXJIVE1MID0gSU5DTFVERV9GSUxFKCcvZGV2L3VpL25vdGlmaWNhdGlvbnMvc3R5bGUuY3NzJyk7XHJcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxuZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuZWwuaWQgPSAnYWxlcnRXcmFwcGVyJztcclxuZWwuaW5uZXJIVE1MID0gSU5DTFVERV9GSUxFKCcvZGV2L3VpL25vdGlmaWNhdGlvbnMvbm90aWZpY2F0aW9ucy5odG1sJyk7XHJcblxyXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBub3RpZnksXHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzZW5kIGEgbm9uLWNyaXRpY2FsIGFsZXJ0IHRvIHRoZSB1c2VyLlxyXG4gKiBTaG91bGQgYmUgdXNlZCBpbiBwbGFjZSBvZiB1aS5hbGVydCBpZiBwb3NzaWJsZSBhcyBpdCBpcyBub24tYmxvY2tpbmcuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vU2hvd3MgYSBub3RmaWNhdGlvbiBmb3IgMiBzZWNvbmRzXHJcbiAqIHVpLm5vdGlmeSgnTm90aWZpY2F0aW9uJyk7XHJcbiAqIC8vU2hvd3MgYSBub3RpZmljYXRpb24gZm9yIDUgc2Vjb25kc1xyXG4gKiB1aS5ub3RpZnkoJ05vdGlmaWNhdGlvbicsIDUpO1xyXG4gKiBAcGFyYW0gU3RyaW5nIHRleHQgdGhlIHRleHQgdG8gZGlzcGxheS4gU2hvdWxkIGJlIGtlcHQgc2hvcnQgdG8gYXZvaWQgdmlzdWFsbHkgYmxvY2tpbmcgdGhlIG1lbnUgb24gc21hbGwgZGV2aWNlcy5cclxuICogQHBhcmFtIE51bWJlciBkaXNwbGF5VGltZSB0aGUgbnVtYmVyIG9mIHNlY29uZHMgdG8gc2hvdyB0aGUgbm90aWZpY2F0aW9uIGZvci5cclxuICovXHJcbmZ1bmN0aW9uIG5vdGlmeSh0ZXh0LCBkaXNwbGF5VGltZSA9IDIpIHtcclxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgZWwuY2xhc3NMaXN0LmFkZCgnbm90aWZpY2F0aW9uJyk7XHJcbiAgICBlbC5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcbiAgICBlbC50ZXh0Q29udGVudCA9IHRleHQ7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMucmVtb3ZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpO1xyXG4gICAgfS5iaW5kKGVsKSwgZGlzcGxheVRpbWUgKiAxMDAwKTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnBhcmVudE5vZGUpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcbiAgICB9LmJpbmQoZWwpLCBkaXNwbGF5VGltZSAqIDEwMDAgKyAyMTAwKTtcclxufVxyXG4iLCIvL0lFIGRvZXNuJ3QgbGlrZSBjb25zb2xlLmxvZyB1bmxlc3MgZGV2IHRvb2xzIGFyZSBvcGVuLlxyXG5pZiAoIXdpbmRvdy5jb25zb2xlKSB7XHJcbiAgICB3aW5kb3cuY29uc29sZSA9IHt9O1xyXG4gICAgd2luZG93LmxvZyA9IHdpbmRvdy5sb2cgfHwgW107XHJcbiAgICBjb25zb2xlLmxvZyA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcclxuICAgICAgICB3aW5kb3cubG9nLnB1c2goYXJncyk7XHJcbiAgICB9O1xyXG59XHJcblsnaW5mbycsICdlcnJvcicsICd3YXJuJywgJ2Fzc2VydCddLmZvckVhY2gobWV0aG9kID0+IHtcclxuICAgIGlmICghY29uc29sZVttZXRob2RdKSB7XHJcbiAgICAgICAgY29uc29sZVttZXRob2RdID0gY29uc29sZS5sb2c7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCIvL0RldGFpbHMgcG9seWZpbGwsIG9sZGVyIGZpcmVmb3gsIElFXHJcbmlmICghKCdvcGVuJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkZXRhaWxzJykpKSB7XHJcbiAgICBsZXQgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG4gICAgc3R5bGUudGV4dENvbnRlbnQgKz0gYGRldGFpbHM6bm90KFtvcGVuXSkgPiA6bm90KHN1bW1hcnkpIHsgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50OyB9IGRldGFpbHMgPiBzdW1tYXJ5OmJlZm9yZSB7IGNvbnRlbnQ6IFwi4pa2XCI7IGRpc3BsYXk6IGlubGluZS1ibG9jazsgZm9udC1zaXplOiAuOGVtOyB3aWR0aDogMS41ZW07IGZvbnQtZmFtaWx5OlwiQ291cmllciBOZXdcIjsgfSBkZXRhaWxzW29wZW5dID4gc3VtbWFyeTpiZWZvcmUgeyB0cmFuc2Zvcm06IHJvdGF0ZSg5MGRlZyk7IH1gO1xyXG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XHJcblxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LnRhZ05hbWUgPT0gJ1NVTU1BUlknKSB7XHJcbiAgICAgICAgICAgIGxldCBkZXRhaWxzID0gZXZlbnQudGFyZ2V0LnBhcmVudE5vZGU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWRldGFpbHMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGRldGFpbHMuZ2V0QXR0cmlidXRlKCdvcGVuJykpIHtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMub3BlbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5yZW1vdmVBdHRyaWJ1dGUoJ29wZW4nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMub3BlbiA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLnNldEF0dHJpYnV0ZSgnb3BlbicsICdvcGVuJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCIvLyBJRSBGaXhcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGVtcGxhdGUpIHtcclxuICAgIGlmICghKCdjb250ZW50JyBpbiB0ZW1wbGF0ZSkpIHtcclxuICAgICAgICBsZXQgY29udGVudCA9IHRlbXBsYXRlLmNoaWxkTm9kZXM7XHJcbiAgICAgICAgbGV0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbnRlbnQubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoY29udGVudFtqXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0ZW1wbGF0ZS5jb250ZW50ID0gZnJhZ21lbnQ7XHJcbiAgICB9XHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlLFxyXG59O1xyXG5cclxudmFyIHBvbHlmaWxsID0gcmVxdWlyZSgnYXBwL3VpL3BvbHlmaWxscy90ZW1wbGF0ZScpO1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2xvbmUgYSB0ZW1wbGF0ZSBhZnRlciBhbHRlcmluZyB0aGUgcHJvdmlkZWQgcnVsZXMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI3RlbXBsYXRlJywgJyN0YXJnZXQnLCBbe3NlbGVjdG9yOiAnaW5wdXQnLCB2YWx1ZTogJ1ZhbHVlJ31dKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IHRlbXBsYXRlU2VsZWN0b3JcclxuICogQHBhcmFtIHtzdHJpbmd9IHRhcmdldFNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7YXJyYXl9IHJ1bGVzIGZvcm1hdDogYXJyYXkgb2Ygb2JqZWN0c1xyXG4gKiAgICAgIGVhY2ggb2JqZWN0IG11c3QgaGF2ZSBcInNlbGVjdG9yXCIuXHJcbiAqICAgICAgZWFjaCBvYmplY3QgY2FuIGhhdmUgXCJtdWx0aXBsZVwiIHNldCB0byB1cGRhdGUgYWxsIG1hdGNoaW5nIGVsZW1lbnRzLlxyXG4gKiAgICAgIGVhY2ggb2JqZWN0IGNhbiBoYXZlIFwicmVtb3ZlXCIgLSBhbiBhcnJheSBvZiBhdHRyaWJ1dGVzIHRvIHJlbW92ZS5cclxuICogICAgICBlYWNoIG9iamVjdCBjYW4gaGF2ZSBcInRleHRcIiBvciBcImh0bWxcIiAtIGZ1cnRoZXIga2V5cyB3aWxsIGJlIHNldCBhcyBhdHRyaWJ1dGVzLlxyXG4gKiAgICAgIGlmIGJvdGggdGV4dCBhbmQgaHRtbCBhcmUgc2V0LCB0ZXh0IHdpbGwgdGFrZSBwcmVjZW5kZW5jZS5cclxuICogICAgICBydWxlcyB3aWxsIGJlIHBhcnNlZCBpbiB0aGUgb3JkZXIgdGhhdCB0aGV5IGFyZSBwcmVzZW50IGluIHRoZSBhcnJheS5cclxuICovXHJcbmZ1bmN0aW9uIGJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSh0ZW1wbGF0ZVNlbGVjdG9yLCB0YXJnZXRTZWxlY3RvciwgcnVsZXMgPSBbXSkge1xyXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0ZW1wbGF0ZVNlbGVjdG9yKTtcclxuXHJcbiAgICBwb2x5ZmlsbCh0ZW1wbGF0ZSk7XHJcblxyXG4gICAgdmFyIGNvbnRlbnQgPSB0ZW1wbGF0ZS5jb250ZW50O1xyXG5cclxuICAgIHJ1bGVzLmZvckVhY2gocnVsZSA9PiBoYW5kbGVSdWxlKGNvbnRlbnQsIHJ1bGUpKTtcclxuXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRhcmdldFNlbGVjdG9yKS5hcHBlbmRDaGlsZChkb2N1bWVudC5pbXBvcnROb2RlKGNvbnRlbnQsIHRydWUpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGFwcGx5IHJ1bGVzIHRvIHRoZSB0ZW1wbGF0ZS5cclxuICpcclxuICogQHBhcmFtIHtOb2RlfSBjb250ZW50IC0gdGhlIGNvbnRlbnQgb2YgdGhlIHRlbXBsYXRlLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcnVsZSAtIHRoZSBydWxlIHRvIGFwcGx5LlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlUnVsZShjb250ZW50LCBydWxlKSB7XHJcbiAgICBpZiAocnVsZS5tdWx0aXBsZSkge1xyXG4gICAgICAgIGxldCBlbHMgPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3JBbGwocnVsZS5zZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIEFycmF5LmZyb20oZWxzKVxyXG4gICAgICAgICAgICAuZm9yRWFjaChlbCA9PiB1cGRhdGVFbGVtZW50KGVsLCBydWxlKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxldCBlbCA9IGNvbnRlbnQucXVlcnlTZWxlY3RvcihydWxlLnNlbGVjdG9yKTtcclxuICAgICAgICBpZiAoIWVsKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgVW5hYmxlIHRvIHVwZGF0ZSAke3J1bGUuc2VsZWN0b3J9LmAsIHJ1bGUpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGVFbGVtZW50KGVsLCBydWxlKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIHVwZGF0ZSBhbiBlbGVtZW50IHdpdGggYSBydWxlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge05vZGV9IGVsIHRoZSBlbGVtZW50IHRvIGFwcGx5IHRoZSBydWxlcyB0by5cclxuICogQHBhcmFtIHtPYmplY3R9IHJ1bGUgdGhlIHJ1bGUgb2JqZWN0LlxyXG4gKi9cclxuZnVuY3Rpb24gdXBkYXRlRWxlbWVudChlbCwgcnVsZSkge1xyXG4gICAgaWYgKCd0ZXh0JyBpbiBydWxlKSB7XHJcbiAgICAgICAgZWwudGV4dENvbnRlbnQgPSBydWxlLnRleHQ7XHJcbiAgICB9IGVsc2UgaWYgKCdodG1sJyBpbiBydWxlKSB7XHJcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gcnVsZS5odG1sO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5rZXlzKHJ1bGUpXHJcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gIVsnc2VsZWN0b3InLCAndGV4dCcsICdodG1sJywgJ3JlbW92ZScsICdtdWx0aXBsZSddLmluY2x1ZGVzKGtleSkpXHJcbiAgICAgICAgLmZvckVhY2goa2V5ID0+IGVsLnNldEF0dHJpYnV0ZShrZXksIHJ1bGVba2V5XSkpO1xyXG5cclxuICAgIGlmIChBcnJheS5pc0FycmF5KHJ1bGUucmVtb3ZlKSkge1xyXG4gICAgICAgIHJ1bGUucmVtb3ZlLmZvckVhY2goa2V5ID0+IGVsLnJlbW92ZUF0dHJpYnV0ZShrZXkpKTtcclxuICAgIH1cclxufVxyXG4iXX0=
