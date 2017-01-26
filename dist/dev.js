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

},{"./console":7,"bot":3,"libraries/ajax":9,"libraries/blockheads":11,"libraries/hook":12,"libraries/storage":13,"libraries/world":14,"ui":27}],2:[function(require,module,exports){
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

},{"libraries/world":14}],3:[function(require,module,exports){
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

},{"./checkGroup":2,"./send":5,"libraries/storage":13,"libraries/world":14}],4:[function(require,module,exports){
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
var settings = require('settings');

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

},{"libraries/blockheads":11,"settings":24}],6:[function(require,module,exports){
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

},{"./exports":6,"bot":3,"libraries/hook":12,"libraries/world":14,"ui":27}],8:[function(require,module,exports){
const bhfansapi = require('libraries/bhfansapi');
const ui = require('ui');
const hook = require('libraries/hook');
const MessageBotExtension = require('MessageBotExtension');


var tab = ui.addTab('Extensions');
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

},{"MessageBotExtension":1,"libraries/bhfansapi":10,"libraries/hook":12,"ui":27}],9:[function(require,module,exports){
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

},{"libraries/ajax":9,"libraries/hook":12}],11:[function(require,module,exports){
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
const ui = require('ui');
const storage = require('libraries/storage');
const send = require('bot').send;
const preferences = require('settings');


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

},{"bot":3,"libraries/storage":13,"settings":24,"ui":27}],16:[function(require,module,exports){
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

},{"bot":3,"libraries/world":14}],17:[function(require,module,exports){
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

},{"libraries/world":14}],18:[function(require,module,exports){
Object.assign(
    module.exports,
    require('./buildMessage'),
    require('./checkJoinsAndGroup'),
    require('./showSummary')
);

},{"./buildMessage":16,"./checkJoinsAndGroup":17,"./showSummary":19}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

},{"./announcements":15,"./helpers":18,"./join":21,"./leave":22,"./trigger":23,"ui":27}],21:[function(require,module,exports){
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

},{"libraries/hook":12,"libraries/storage":13,"messages/helpers":18,"ui":27}],22:[function(require,module,exports){
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

},{"libraries/hook":12,"libraries/storage":13,"messages/helpers":18,"ui":27}],23:[function(require,module,exports){
const ui = require('ui');

const storage = require('libraries/storage');
const hook = require('libraries/hook');
const helpers = require('messages/helpers');
const settings = require('settings');


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

},{"libraries/hook":12,"libraries/storage":13,"messages/helpers":18,"settings":24,"ui":27}],24:[function(require,module,exports){
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

},{"libraries/storage":13}],25:[function(require,module,exports){
const ui = require('ui');
const prefs = require('settings');


var tab = ui.addTab('Settings');
tab.innerHTML = '<style>' +
    "#mb_settings h3{border-bottom:1px solid #999}\n" +
    '</style>' +
    "<div id=\"mb_settings\">\r\n    <h3>Settings</h3>\r\n    <label>Minutes between announcements:</label><br>\r\n        <input data-key=\"announcementDelay\" type=\"number\"><br>\r\n    <label>Maximum trigger responses to a message:</label><br>\r\n        <input data-key=\"maxResponses\" type=\"number\"><br>\r\n    <label>New chat notifications: </label>\r\n        <input data-key=\"notify\" type=\"checkbox\"><br>\r\n\r\n    <h3>Advanced Settings - <small><a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/1.-Advanced-Options/\" target=\"_blank\">Read this first</a></small></h3>\r\n    <label>Disable whitespace trimming: </label>\r\n        <input data-key=\"disableTrim\" type=\"checkbox\"><br>\r\n    <label>Parse triggers as RegEx: </label>\r\n        <input data-key=\"regexTriggers\" type=\"checkbox\"><br>\r\n    <label>Split messages: </label>\r\n        <input data-key=\"splitMessages\" type=\"checkbox\"><br>\r\n    <label>Split token: </label><br>\r\n        <input data-key=\"splitToken\" type=\"text\">\r\n\r\n    <h3>Backup / Restore</h3>\r\n    <a id=\"mb_backup_save\">Get backup code</a><br>\r\n    <a id=\"mb_backup_load\">Load previous backup</a>\r\n    <div id=\"mb_backup\"></div>\r\n</div>\r\n";

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

},{"settings":24,"ui":27}],26:[function(require,module,exports){
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

require('console-browserify');
require('bot/migration');

// Expose the extension API
window.MessageBotExtension = require('MessageBotExtension');

const bhfansapi = require('libraries/bhfansapi');
const hook = require('libraries/hook');
const ui = require('ui');
hook.on('error_report', function(msg) {
    ui.notify(msg);
});


require('./console');
// By default no tab is selected, show the console.
document.querySelector('.nav-slider-container span').click();
require('messages');
require('extensions');
require('settings/page');

// Error reporting
window.addEventListener('error', (err) => {
    if (['Script error', 'World not running'].includes(err.message)) {
        bhfansapi.reportError(err);
    }
});

},{"./console":7,"MessageBotExtension":1,"bot/migration":4,"console-browserify":36,"extensions":8,"libraries/bhfansapi":10,"libraries/hook":12,"messages":20,"settings/page":25,"ui":27}],27:[function(require,module,exports){
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

},{"../console/exports":6,"./layout":28,"./notifications":30,"./polyfills/details":32,"./template":34}],28:[function(require,module,exports){
/**
 * @file Contains functions for managing the page layout
 */


const hook = require('libraries/hook');

// Build page - only case in which body.innerHTML should be used.
document.body.innerHTML += "<header class=\"header is-fixed-top\">\r\n  <nav class=\"nav-inverse nav has-shadow\">\r\n    <div class=\"nav-left\">\r\n      <div class=\"nav-item nav-slider-toggle\">\r\n        <img src=\"https://i.imgsafe.org/80a1129a36.png\">\r\n      </div>\r\n      <a class=\"nav-item is-tab nav-slider-toggle\">\r\n        Menu\r\n      </a>\r\n    </div>\r\n  </nav>\r\n</header>\r\n\r\n<div class=\"nav-slider-container\">\r\n    <nav class=\"nav-slider\" data-tab-group=\"main\"></nav>\r\n    <div class=\"overlay\"></div>\r\n</div>\r\n\r\n<div id=\"container\" class=\"has-fixed-nav\"></div>\r\n";
document.head.innerHTML += '<style>' +
    "html{overflow-y:auto !important}/*! bulma.io v0.3.1 | MIT License | github.com/jgthms/bulma */@keyframes spinAround{from{transform:rotate(0deg)}to{transform:rotate(359deg)}}/*! minireset.css v0.0.2 | MIT License | github.com/jgthms/minireset.css */html,body,p,ol,ul,li,dl,dt,dd,blockquote,figure,fieldset,legend,textarea,pre,iframe,hr,h1,h2,h3,h4,h5,h6{margin:0;padding:0}h1,h2,h3,h4,h5,h6{font-size:100%;font-weight:normal}ul{list-style:none}button,input,select,textarea{margin:0}html{box-sizing:border-box}*{box-sizing:inherit}*:before,*:after{box-sizing:inherit}img,embed,object,audio,video{height:auto;max-width:100%}iframe{border:0}table{border-collapse:collapse;border-spacing:0}td,th{padding:0;text-align:left}html{background-color:#fff;font-size:14px;-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;min-width:300px;overflow-x:hidden;overflow-y:scroll;text-rendering:optimizeLegibility}article,aside,figure,footer,header,hgroup,section{display:block}body,button,input,select,textarea{font-family:\"Lucida Grande\",\"Lucida Sans Unicode\",Verdana,sans-serif}code,pre{-moz-osx-font-smoothing:auto;-webkit-font-smoothing:auto;font-family:\"Inconsolata\",\"Consolas\",\"Monaco\",monospace}body{color:#4a4a4a;font-size:1rem;font-weight:400;line-height:1.5}a{color:#182b73;cursor:pointer;text-decoration:none;transition:none 86ms ease-out}a:hover{color:#363636}code{background-color:#f5f5f5;color:red;font-size:0.8em;font-weight:normal;padding:0.25em 0.5em 0.25em}hr{background-color:#dbdbdb;border:none;display:block;height:1px;margin:1.5rem 0}img{max-width:100%}input[type=\"checkbox\"],input[type=\"radio\"]{vertical-align:baseline}small{font-size:0.8em}span{font-style:inherit;font-weight:inherit}strong{color:#363636;font-weight:700}pre{background-color:#f5f5f5;color:#4a4a4a;font-size:0.8em;white-space:pre;word-wrap:normal}pre code{background:none;color:inherit;display:block;font-size:1em;overflow-x:auto;padding:1.25rem 1.5rem}table{width:100%}table td,table th{text-align:left;vertical-align:top}table th{color:#363636}.is-block{display:block}@media screen and (max-width: 768px){.is-block-mobile{display:block !important}}@media screen and (min-width: 769px){.is-block-tablet{display:block !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-block-tablet-only{display:block !important}}@media screen and (max-width: 999px){.is-block-touch{display:block !important}}@media screen and (min-width: 1000px){.is-block-desktop{display:block !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-block-desktop-only{display:block !important}}@media screen and (min-width: 1192px){.is-block-widescreen{display:block !important}}.is-flex{display:flex}@media screen and (max-width: 768px){.is-flex-mobile{display:flex !important}}@media screen and (min-width: 769px){.is-flex-tablet{display:flex !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-flex-tablet-only{display:flex !important}}@media screen and (max-width: 999px){.is-flex-touch{display:flex !important}}@media screen and (min-width: 1000px){.is-flex-desktop{display:flex !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-flex-desktop-only{display:flex !important}}@media screen and (min-width: 1192px){.is-flex-widescreen{display:flex !important}}.is-inline{display:inline}@media screen and (max-width: 768px){.is-inline-mobile{display:inline !important}}@media screen and (min-width: 769px){.is-inline-tablet{display:inline !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-tablet-only{display:inline !important}}@media screen and (max-width: 999px){.is-inline-touch{display:inline !important}}@media screen and (min-width: 1000px){.is-inline-desktop{display:inline !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-desktop-only{display:inline !important}}@media screen and (min-width: 1192px){.is-inline-widescreen{display:inline !important}}.is-inline-block{display:inline-block}@media screen and (max-width: 768px){.is-inline-block-mobile{display:inline-block !important}}@media screen and (min-width: 769px){.is-inline-block-tablet{display:inline-block !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-block-tablet-only{display:inline-block !important}}@media screen and (max-width: 999px){.is-inline-block-touch{display:inline-block !important}}@media screen and (min-width: 1000px){.is-inline-block-desktop{display:inline-block !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-block-desktop-only{display:inline-block !important}}@media screen and (min-width: 1192px){.is-inline-block-widescreen{display:inline-block !important}}.is-inline-flex{display:inline-flex}@media screen and (max-width: 768px){.is-inline-flex-mobile{display:inline-flex !important}}@media screen and (min-width: 769px){.is-inline-flex-tablet{display:inline-flex !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-flex-tablet-only{display:inline-flex !important}}@media screen and (max-width: 999px){.is-inline-flex-touch{display:inline-flex !important}}@media screen and (min-width: 1000px){.is-inline-flex-desktop{display:inline-flex !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-flex-desktop-only{display:inline-flex !important}}@media screen and (min-width: 1192px){.is-inline-flex-widescreen{display:inline-flex !important}}.is-clearfix:after{clear:both;content:\" \";display:table}.is-pulled-left{float:left}.is-pulled-right{float:right}.is-clipped{overflow:hidden !important}.is-overlay{bottom:0;left:0;position:absolute;right:0;top:0}.has-text-centered{text-align:center}.has-text-left{text-align:left}.has-text-right{text-align:right}.is-hidden{display:none !important}@media screen and (max-width: 768px){.is-hidden-mobile{display:none !important}}@media screen and (min-width: 769px){.is-hidden-tablet{display:none !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-hidden-tablet-only{display:none !important}}@media screen and (max-width: 999px){.is-hidden-touch{display:none !important}}@media screen and (min-width: 1000px){.is-hidden-desktop{display:none !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-hidden-desktop-only{display:none !important}}@media screen and (min-width: 1192px){.is-hidden-widescreen{display:none !important}}.is-disabled{pointer-events:none}.is-marginless{margin:0 !important}.is-paddingless{padding:0 !important}.is-unselectable{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.box{background-color:#fff;border-radius:5px;box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px rgba(10,10,10,0.1);display:block;padding:1.25rem}.box:not(:last-child){margin-bottom:1.5rem}a.box:hover,a.box:focus{box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px #182b73}a.box:active{box-shadow:inset 0 1px 2px rgba(10,10,10,0.2),0 0 0 1px #182b73}.button{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-color:#fff;border:1px solid #dbdbdb;color:#363636;cursor:pointer;justify-content:center;padding-left:0.75em;padding-right:0.75em;text-align:center;white-space:nowrap}.button:focus,.button.is-focused,.button:active,.button.is-active{outline:none}.button[disabled],.button.is-disabled{pointer-events:none}.button strong{color:inherit}.button .icon:first-child:not(:last-child){margin-left:-.25rem;margin-right:.5rem}.button .icon:last-child:not(:first-child){margin-left:.5rem;margin-right:-.25rem}.button .icon:first-child:last-child{margin-left:calc(-1px + -.25rem);margin-right:calc(-1px + -.25rem)}.button .icon.is-small:first-child:not(:last-child){margin-left:0rem}.button .icon.is-small:last-child:not(:first-child){margin-right:0rem}.button .icon.is-small:first-child:last-child{margin-left:calc(-1px + 0rem);margin-right:calc(-1px + 0rem)}.button .icon.is-medium:first-child:not(:last-child){margin-left:-.5rem}.button .icon.is-medium:last-child:not(:first-child){margin-right:-.5rem}.button .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.5rem);margin-right:calc(-1px + -.5rem)}.button .icon.is-large:first-child:not(:last-child){margin-left:-1rem}.button .icon.is-large:last-child:not(:first-child){margin-right:-1rem}.button .icon.is-large:first-child:last-child{margin-left:calc(-1px + -1rem);margin-right:calc(-1px + -1rem)}.button:hover,.button.is-hovered{border-color:#b5b5b5;color:#363636}.button:focus,.button.is-focused{border-color:#182b73;box-shadow:0 0 0.5em rgba(24,43,115,0.25);color:#363636}.button:active,.button.is-active{border-color:#4a4a4a;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#363636}.button.is-link{background-color:transparent;border-color:transparent;color:#4a4a4a;text-decoration:underline}.button.is-link:hover,.button.is-link.is-hovered,.button.is-link:focus,.button.is-link.is-focused,.button.is-link:active,.button.is-link.is-active{background-color:#f5f5f5;color:#363636}.button.is-white{background-color:#fff;border-color:transparent;color:#0a0a0a}.button.is-white:hover,.button.is-white.is-hovered{background-color:#f9f9f9;border-color:transparent;color:#0a0a0a}.button.is-white:focus,.button.is-white.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,255,255,0.25);color:#0a0a0a}.button.is-white:active,.button.is-white.is-active{background-color:#f2f2f2;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#0a0a0a}.button.is-white.is-inverted{background-color:#0a0a0a;color:#fff}.button.is-white.is-inverted:hover{background-color:#000}.button.is-white.is-loading:after{border-color:transparent transparent #0a0a0a #0a0a0a !important}.button.is-white.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-white.is-outlined:hover,.button.is-white.is-outlined:focus{background-color:#fff;border-color:#fff;color:#0a0a0a}.button.is-white.is-inverted.is-outlined{background-color:transparent;border-color:#0a0a0a;color:#0a0a0a}.button.is-white.is-inverted.is-outlined:hover,.button.is-white.is-inverted.is-outlined:focus{background-color:#0a0a0a;color:#fff}.button.is-black{background-color:#0a0a0a;border-color:transparent;color:#fff}.button.is-black:hover,.button.is-black.is-hovered{background-color:#040404;border-color:transparent;color:#fff}.button.is-black:focus,.button.is-black.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(10,10,10,0.25);color:#fff}.button.is-black:active,.button.is-black.is-active{background-color:#000;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-black.is-inverted{background-color:#fff;color:#0a0a0a}.button.is-black.is-inverted:hover{background-color:#f2f2f2}.button.is-black.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-black.is-outlined{background-color:transparent;border-color:#0a0a0a;color:#0a0a0a}.button.is-black.is-outlined:hover,.button.is-black.is-outlined:focus{background-color:#0a0a0a;border-color:#0a0a0a;color:#fff}.button.is-black.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-black.is-inverted.is-outlined:hover,.button.is-black.is-inverted.is-outlined:focus{background-color:#fff;color:#0a0a0a}.button.is-light{background-color:#f5f5f5;border-color:transparent;color:#363636}.button.is-light:hover,.button.is-light.is-hovered{background-color:#eee;border-color:transparent;color:#363636}.button.is-light:focus,.button.is-light.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(245,245,245,0.25);color:#363636}.button.is-light:active,.button.is-light.is-active{background-color:#e8e8e8;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#363636}.button.is-light.is-inverted{background-color:#363636;color:#f5f5f5}.button.is-light.is-inverted:hover{background-color:#292929}.button.is-light.is-loading:after{border-color:transparent transparent #363636 #363636 !important}.button.is-light.is-outlined{background-color:transparent;border-color:#f5f5f5;color:#f5f5f5}.button.is-light.is-outlined:hover,.button.is-light.is-outlined:focus{background-color:#f5f5f5;border-color:#f5f5f5;color:#363636}.button.is-light.is-inverted.is-outlined{background-color:transparent;border-color:#363636;color:#363636}.button.is-light.is-inverted.is-outlined:hover,.button.is-light.is-inverted.is-outlined:focus{background-color:#363636;color:#f5f5f5}.button.is-dark{background-color:#363636;border-color:transparent;color:#f5f5f5}.button.is-dark:hover,.button.is-dark.is-hovered{background-color:#2f2f2f;border-color:transparent;color:#f5f5f5}.button.is-dark:focus,.button.is-dark.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(54,54,54,0.25);color:#f5f5f5}.button.is-dark:active,.button.is-dark.is-active{background-color:#292929;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#f5f5f5}.button.is-dark.is-inverted{background-color:#f5f5f5;color:#363636}.button.is-dark.is-inverted:hover{background-color:#e8e8e8}.button.is-dark.is-loading:after{border-color:transparent transparent #f5f5f5 #f5f5f5 !important}.button.is-dark.is-outlined{background-color:transparent;border-color:#363636;color:#363636}.button.is-dark.is-outlined:hover,.button.is-dark.is-outlined:focus{background-color:#363636;border-color:#363636;color:#f5f5f5}.button.is-dark.is-inverted.is-outlined{background-color:transparent;border-color:#f5f5f5;color:#f5f5f5}.button.is-dark.is-inverted.is-outlined:hover,.button.is-dark.is-inverted.is-outlined:focus{background-color:#f5f5f5;color:#363636}.button.is-primary{background-color:#182b73;border-color:transparent;color:#fff}.button.is-primary:hover,.button.is-primary.is-hovered{background-color:#162768;border-color:transparent;color:#fff}.button.is-primary:focus,.button.is-primary.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(24,43,115,0.25);color:#fff}.button.is-primary:active,.button.is-primary.is-active{background-color:#14235e;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-primary.is-inverted{background-color:#fff;color:#182b73}.button.is-primary.is-inverted:hover{background-color:#f2f2f2}.button.is-primary.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-primary.is-outlined{background-color:transparent;border-color:#182b73;color:#182b73}.button.is-primary.is-outlined:hover,.button.is-primary.is-outlined:focus{background-color:#182b73;border-color:#182b73;color:#fff}.button.is-primary.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-primary.is-inverted.is-outlined:hover,.button.is-primary.is-inverted.is-outlined:focus{background-color:#fff;color:#182b73}.button.is-info{background-color:#3273dc;border-color:transparent;color:#fff}.button.is-info:hover,.button.is-info.is-hovered{background-color:#276cda;border-color:transparent;color:#fff}.button.is-info:focus,.button.is-info.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(50,115,220,0.25);color:#fff}.button.is-info:active,.button.is-info.is-active{background-color:#2366d1;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-info.is-inverted{background-color:#fff;color:#3273dc}.button.is-info.is-inverted:hover{background-color:#f2f2f2}.button.is-info.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-info.is-outlined{background-color:transparent;border-color:#3273dc;color:#3273dc}.button.is-info.is-outlined:hover,.button.is-info.is-outlined:focus{background-color:#3273dc;border-color:#3273dc;color:#fff}.button.is-info.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-info.is-inverted.is-outlined:hover,.button.is-info.is-inverted.is-outlined:focus{background-color:#fff;color:#3273dc}.button.is-success{background-color:#23d160;border-color:transparent;color:#fff}.button.is-success:hover,.button.is-success.is-hovered{background-color:#22c65b;border-color:transparent;color:#fff}.button.is-success:focus,.button.is-success.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(35,209,96,0.25);color:#fff}.button.is-success:active,.button.is-success.is-active{background-color:#20bc56;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-success.is-inverted{background-color:#fff;color:#23d160}.button.is-success.is-inverted:hover{background-color:#f2f2f2}.button.is-success.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-success.is-outlined{background-color:transparent;border-color:#23d160;color:#23d160}.button.is-success.is-outlined:hover,.button.is-success.is-outlined:focus{background-color:#23d160;border-color:#23d160;color:#fff}.button.is-success.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-success.is-inverted.is-outlined:hover,.button.is-success.is-inverted.is-outlined:focus{background-color:#fff;color:#23d160}.button.is-warning{background-color:#ffdd57;border-color:transparent;color:rgba(0,0,0,0.7)}.button.is-warning:hover,.button.is-warning.is-hovered{background-color:#ffdb4a;border-color:transparent;color:rgba(0,0,0,0.7)}.button.is-warning:focus,.button.is-warning.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,221,87,0.25);color:rgba(0,0,0,0.7)}.button.is-warning:active,.button.is-warning.is-active{background-color:#ffd83d;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted{background-color:rgba(0,0,0,0.7);color:#ffdd57}.button.is-warning.is-inverted:hover{background-color:rgba(0,0,0,0.7)}.button.is-warning.is-loading:after{border-color:transparent transparent rgba(0,0,0,0.7) rgba(0,0,0,0.7) !important}.button.is-warning.is-outlined{background-color:transparent;border-color:#ffdd57;color:#ffdd57}.button.is-warning.is-outlined:hover,.button.is-warning.is-outlined:focus{background-color:#ffdd57;border-color:#ffdd57;color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted.is-outlined{background-color:transparent;border-color:rgba(0,0,0,0.7);color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted.is-outlined:hover,.button.is-warning.is-inverted.is-outlined:focus{background-color:rgba(0,0,0,0.7);color:#ffdd57}.button.is-danger{background-color:red;border-color:transparent;color:#fff}.button.is-danger:hover,.button.is-danger.is-hovered{background-color:#f20000;border-color:transparent;color:#fff}.button.is-danger:focus,.button.is-danger.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,0,0,0.25);color:#fff}.button.is-danger:active,.button.is-danger.is-active{background-color:#e60000;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-danger.is-inverted{background-color:#fff;color:red}.button.is-danger.is-inverted:hover{background-color:#f2f2f2}.button.is-danger.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-danger.is-outlined{background-color:transparent;border-color:red;color:red}.button.is-danger.is-outlined:hover,.button.is-danger.is-outlined:focus{background-color:red;border-color:red;color:#fff}.button.is-danger.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-danger.is-inverted.is-outlined:hover,.button.is-danger.is-inverted.is-outlined:focus{background-color:#fff;color:red}.button.is-small{border-radius:2px;font-size:.75rem}.button.is-small .icon:first-child:not(:last-child){margin-left:-.375rem;margin-right:.375rem}.button.is-small .icon:last-child:not(:first-child){margin-left:.375rem;margin-right:-.375rem}.button.is-small .icon:first-child:last-child{margin-left:calc(-1px + -.375rem);margin-right:calc(-1px + -.375rem)}.button.is-small .icon.is-small:first-child:not(:last-child){margin-left:-.125rem}.button.is-small .icon.is-small:last-child:not(:first-child){margin-right:-.125rem}.button.is-small .icon.is-small:first-child:last-child{margin-left:calc(-1px + -.125rem);margin-right:calc(-1px + -.125rem)}.button.is-small .icon.is-medium:first-child:not(:last-child){margin-left:-.625rem}.button.is-small .icon.is-medium:last-child:not(:first-child){margin-right:-.625rem}.button.is-small .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.625rem);margin-right:calc(-1px + -.625rem)}.button.is-small .icon.is-large:first-child:not(:last-child){margin-left:-1.125rem}.button.is-small .icon.is-large:last-child:not(:first-child){margin-right:-1.125rem}.button.is-small .icon.is-large:first-child:last-child{margin-left:calc(-1px + -1.125rem);margin-right:calc(-1px + -1.125rem)}.button.is-medium{font-size:1.25rem}.button.is-medium .icon:first-child:not(:last-child){margin-left:-.125rem;margin-right:.625rem}.button.is-medium .icon:last-child:not(:first-child){margin-left:.625rem;margin-right:-.125rem}.button.is-medium .icon:first-child:last-child{margin-left:calc(-1px + -.125rem);margin-right:calc(-1px + -.125rem)}.button.is-medium .icon.is-small:first-child:not(:last-child){margin-left:.125rem}.button.is-medium .icon.is-small:last-child:not(:first-child){margin-right:.125rem}.button.is-medium .icon.is-small:first-child:last-child{margin-left:calc(-1px + .125rem);margin-right:calc(-1px + .125rem)}.button.is-medium .icon.is-medium:first-child:not(:last-child){margin-left:-.375rem}.button.is-medium .icon.is-medium:last-child:not(:first-child){margin-right:-.375rem}.button.is-medium .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.375rem);margin-right:calc(-1px + -.375rem)}.button.is-medium .icon.is-large:first-child:not(:last-child){margin-left:-.875rem}.button.is-medium .icon.is-large:last-child:not(:first-child){margin-right:-.875rem}.button.is-medium .icon.is-large:first-child:last-child{margin-left:calc(-1px + -.875rem);margin-right:calc(-1px + -.875rem)}.button.is-large{font-size:1.5rem}.button.is-large .icon:first-child:not(:last-child){margin-left:0rem;margin-right:.75rem}.button.is-large .icon:last-child:not(:first-child){margin-left:.75rem;margin-right:0rem}.button.is-large .icon:first-child:last-child{margin-left:calc(-1px + 0rem);margin-right:calc(-1px + 0rem)}.button.is-large .icon.is-small:first-child:not(:last-child){margin-left:.25rem}.button.is-large .icon.is-small:last-child:not(:first-child){margin-right:.25rem}.button.is-large .icon.is-small:first-child:last-child{margin-left:calc(-1px + .25rem);margin-right:calc(-1px + .25rem)}.button.is-large .icon.is-medium:first-child:not(:last-child){margin-left:-.25rem}.button.is-large .icon.is-medium:last-child:not(:first-child){margin-right:-.25rem}.button.is-large .icon.is-medium:first-child:last-child{margin-left:calc(-1px + -.25rem);margin-right:calc(-1px + -.25rem)}.button.is-large .icon.is-large:first-child:not(:last-child){margin-left:-.75rem}.button.is-large .icon.is-large:last-child:not(:first-child){margin-right:-.75rem}.button.is-large .icon.is-large:first-child:last-child{margin-left:calc(-1px + -.75rem);margin-right:calc(-1px + -.75rem)}.button[disabled],.button.is-disabled{opacity:0.5}.button.is-fullwidth{display:flex;width:100%}.button.is-loading{color:transparent !important;pointer-events:none}.button.is-loading:after{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1rem;position:relative;width:1rem;left:50%;margin-left:-8px;margin-top:-8px;position:absolute;top:50%;position:absolute !important}.content{color:#4a4a4a}.content:not(:last-child){margin-bottom:1.5rem}.content li+li{margin-top:0.25em}.content p:not(:last-child),.content ol:not(:last-child),.content ul:not(:last-child),.content blockquote:not(:last-child),.content table:not(:last-child){margin-bottom:1em}.content h1,.content h2,.content h3,.content h4,.content h5,.content h6{color:#363636;font-weight:400;line-height:1.125}.content h1{font-size:2em;margin-bottom:0.5em}.content h1:not(:first-child){margin-top:1em}.content h2{font-size:1.75em;margin-bottom:0.5714em}.content h2:not(:first-child){margin-top:1.1428em}.content h3{font-size:1.5em;margin-bottom:0.6666em}.content h3:not(:first-child){margin-top:1.3333em}.content h4{font-size:1.25em;margin-bottom:0.8em}.content h5{font-size:1.125em;margin-bottom:0.8888em}.content h6{font-size:1em;margin-bottom:1em}.content blockquote{background-color:#f5f5f5;border-left:5px solid #dbdbdb;padding:1.25em 1.5em}.content ol{list-style:decimal outside;margin-left:2em;margin-right:2em;margin-top:1em}.content ul{list-style:disc outside;margin-left:2em;margin-right:2em;margin-top:1em}.content ul ul{list-style-type:circle;margin-top:0.5em}.content ul ul ul{list-style-type:square}.content table{width:100%}.content table td,.content table th{border:1px solid #dbdbdb;border-width:0 0 1px;padding:0.5em 0.75em;vertical-align:top}.content table th{color:#363636;text-align:left}.content table tr:hover{background-color:#f5f5f5}.content table thead td,.content table thead th{border-width:0 0 2px;color:#363636}.content table tfoot td,.content table tfoot th{border-width:2px 0 0;color:#363636}.content table tbody tr:last-child td,.content table tbody tr:last-child th{border-bottom-width:0}.content.is-small{font-size:.75rem}.content.is-medium{font-size:1.25rem}.content.is-large{font-size:1.5rem}.input,.textarea{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;background-color:#fff;border:1px solid #dbdbdb;color:#363636;box-shadow:inset 0 1px 2px rgba(10,10,10,0.1);max-width:100%;width:100%}.input:focus,.input.is-focused,.input:active,.input.is-active,.textarea:focus,.textarea.is-focused,.textarea:active,.textarea.is-active{outline:none}.input[disabled],.input.is-disabled,.textarea[disabled],.textarea.is-disabled{pointer-events:none}.input:hover,.input.is-hovered,.textarea:hover,.textarea.is-hovered{border-color:#b5b5b5}.input:focus,.input.is-focused,.input:active,.input.is-active,.textarea:focus,.textarea.is-focused,.textarea:active,.textarea.is-active{border-color:#182b73}.input[disabled],.input.is-disabled,.textarea[disabled],.textarea.is-disabled{background-color:#f5f5f5;border-color:#f5f5f5;box-shadow:none;color:#7a7a7a}.input[disabled]::-moz-placeholder,.input.is-disabled::-moz-placeholder,.textarea[disabled]::-moz-placeholder,.textarea.is-disabled::-moz-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]::-webkit-input-placeholder,.input.is-disabled::-webkit-input-placeholder,.textarea[disabled]::-webkit-input-placeholder,.textarea.is-disabled::-webkit-input-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]:-moz-placeholder,.input.is-disabled:-moz-placeholder,.textarea[disabled]:-moz-placeholder,.textarea.is-disabled:-moz-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]:-ms-input-placeholder,.input.is-disabled:-ms-input-placeholder,.textarea[disabled]:-ms-input-placeholder,.textarea.is-disabled:-ms-input-placeholder{color:rgba(54,54,54,0.3)}.input[type=\"search\"],.textarea[type=\"search\"]{border-radius:290486px}.input.is-white,.textarea.is-white{border-color:#fff}.input.is-black,.textarea.is-black{border-color:#0a0a0a}.input.is-light,.textarea.is-light{border-color:#f5f5f5}.input.is-dark,.textarea.is-dark{border-color:#363636}.input.is-primary,.textarea.is-primary{border-color:#182b73}.input.is-info,.textarea.is-info{border-color:#3273dc}.input.is-success,.textarea.is-success{border-color:#23d160}.input.is-warning,.textarea.is-warning{border-color:#ffdd57}.input.is-danger,.textarea.is-danger{border-color:red}.input.is-small,.textarea.is-small{border-radius:2px;font-size:.75rem}.input.is-medium,.textarea.is-medium{font-size:1.25rem}.input.is-large,.textarea.is-large{font-size:1.5rem}.input.is-fullwidth,.textarea.is-fullwidth{display:block;width:100%}.input.is-inline,.textarea.is-inline{display:inline;width:auto}.textarea{display:block;line-height:1.25;max-height:600px;max-width:100%;min-height:120px;min-width:100%;padding:10px;resize:vertical}.checkbox,.radio{align-items:center;cursor:pointer;display:inline-flex;flex-wrap:wrap;justify-content:flex-start;position:relative;vertical-align:top}.checkbox input,.radio input{cursor:pointer;margin-right:0.5em}.checkbox:hover,.radio:hover{color:#363636}.checkbox.is-disabled,.radio.is-disabled{color:#7a7a7a;pointer-events:none}.checkbox.is-disabled input,.radio.is-disabled input{pointer-events:none}.radio+.radio{margin-left:0.5em}.select{display:inline-block;height:2.5em;position:relative;vertical-align:top}.select:after{border:1px solid #182b73;border-right:0;border-top:0;content:\" \";display:block;height:0.5em;pointer-events:none;position:absolute;transform:rotate(-45deg);width:0.5em;margin-top:-0.375em;right:1.125em;top:50%;z-index:4}.select select{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;background-color:#fff;border:1px solid #dbdbdb;color:#363636;cursor:pointer;display:block;font-size:1em;outline:none;padding-right:2.5em}.select select:focus,.select select.is-focused,.select select:active,.select select.is-active{outline:none}.select select[disabled],.select select.is-disabled{pointer-events:none}.select select:hover,.select select.is-hovered{border-color:#b5b5b5}.select select:focus,.select select.is-focused,.select select:active,.select select.is-active{border-color:#182b73}.select select[disabled],.select select.is-disabled{background-color:#f5f5f5;border-color:#f5f5f5;box-shadow:none;color:#7a7a7a}.select select[disabled]::-moz-placeholder,.select select.is-disabled::-moz-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]::-webkit-input-placeholder,.select select.is-disabled::-webkit-input-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]:-moz-placeholder,.select select.is-disabled:-moz-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]:-ms-input-placeholder,.select select.is-disabled:-ms-input-placeholder{color:rgba(54,54,54,0.3)}.select select:hover{border-color:#b5b5b5}.select select::ms-expand{display:none}.select:hover:after{border-color:#363636}.select.is-small{border-radius:2px;font-size:.75rem}.select.is-medium{font-size:1.25rem}.select.is-large{font-size:1.5rem}.select.is-fullwidth{width:100%}.select.is-fullwidth select{width:100%}.label{color:#363636;display:block;font-weight:bold}.label:not(:last-child){margin-bottom:0.5em}.help{display:block;font-size:.75rem;margin-top:5px}.help.is-white{color:#fff}.help.is-black{color:#0a0a0a}.help.is-light{color:#f5f5f5}.help.is-dark{color:#363636}.help.is-primary{color:#182b73}.help.is-info{color:#3273dc}.help.is-success{color:#23d160}.help.is-warning{color:#ffdd57}.help.is-danger{color:red}@media screen and (max-width: 768px){.control-label{margin-bottom:0.5em}}@media screen and (min-width: 769px){.control-label{flex-basis:0;flex-grow:1;flex-shrink:0;margin-right:1.5em;padding-top:0.5em;text-align:right}}.control{position:relative;text-align:left}.control:not(:last-child){margin-bottom:0.75rem}.control.has-addons{display:flex;justify-content:flex-start}.control.has-addons .button,.control.has-addons .input,.control.has-addons .select{border-radius:0;margin-right:-1px;width:auto}.control.has-addons .button:hover,.control.has-addons .input:hover,.control.has-addons .select:hover{z-index:2}.control.has-addons .button:focus,.control.has-addons .button:active,.control.has-addons .input:focus,.control.has-addons .input:active,.control.has-addons .select:focus,.control.has-addons .select:active{z-index:3}.control.has-addons .button:first-child,.control.has-addons .input:first-child,.control.has-addons .select:first-child{border-radius:3px 0 0 3px}.control.has-addons .button:first-child select,.control.has-addons .input:first-child select,.control.has-addons .select:first-child select{border-radius:3px 0 0 3px}.control.has-addons .button:last-child,.control.has-addons .input:last-child,.control.has-addons .select:last-child{border-radius:0 3px 3px 0}.control.has-addons .button:last-child select,.control.has-addons .input:last-child select,.control.has-addons .select:last-child select{border-radius:0 3px 3px 0}.control.has-addons .button.is-expanded,.control.has-addons .input.is-expanded,.control.has-addons .select.is-expanded{flex-grow:1;flex-shrink:0}.control.has-addons .select select:hover{z-index:2}.control.has-addons .select select:focus,.control.has-addons .select select:active{z-index:3}.control.has-addons.has-addons-centered{justify-content:center}.control.has-addons.has-addons-right{justify-content:flex-end}.control.has-addons.has-addons-fullwidth .button,.control.has-addons.has-addons-fullwidth .input,.control.has-addons.has-addons-fullwidth .select{flex-grow:1;flex-shrink:0}.control.has-icon .icon{color:#dbdbdb;pointer-events:none;position:absolute;top:1.25rem;z-index:4}.control.has-icon .input:focus+.icon{color:#7a7a7a}.control.has-icon .input.is-small+.icon{top:.9375rem}.control.has-icon .input.is-medium+.icon{top:1.5625rem}.control.has-icon .input.is-large+.icon{top:1.875rem}.control.has-icon:not(.has-icon-right) .icon{left:1.25rem;transform:translateX(-50%) translateY(-50%)}.control.has-icon:not(.has-icon-right) .input{padding-left:2.5em}.control.has-icon:not(.has-icon-right) .input.is-small+.icon{left:.9375rem}.control.has-icon:not(.has-icon-right) .input.is-medium+.icon{left:1.5625rem}.control.has-icon:not(.has-icon-right) .input.is-large+.icon{left:1.875rem}.control.has-icon.has-icon-right .icon{right:1.25rem;transform:translateX(50%) translateY(-50%)}.control.has-icon.has-icon-right .input{padding-right:2.5em}.control.has-icon.has-icon-right .input.is-small+.icon{right:.9375rem}.control.has-icon.has-icon-right .input.is-medium+.icon{right:1.5625rem}.control.has-icon.has-icon-right .input.is-large+.icon{right:1.875rem}.control.is-grouped{display:flex;justify-content:flex-start}.control.is-grouped>.control{flex-basis:0;flex-shrink:0}.control.is-grouped>.control:not(:last-child){margin-bottom:0;margin-right:0.75rem}.control.is-grouped>.control.is-expanded{flex-grow:1;flex-shrink:1}.control.is-grouped.is-grouped-centered{justify-content:center}.control.is-grouped.is-grouped-right{justify-content:flex-end}@media screen and (min-width: 769px){.control.is-horizontal{display:flex}.control.is-horizontal>.control{display:flex;flex-basis:0;flex-grow:5;flex-shrink:1}}.control.is-loading:after{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1rem;position:relative;width:1rem;position:absolute !important;right:0.75em;top:0.75em}.icon{display:inline-block;font-size:21px;height:1.5rem;line-height:1.5rem;text-align:center;vertical-align:top;width:1.5rem}.icon .fa{font-size:inherit;line-height:inherit}.icon.is-small{display:inline-block;font-size:14px;height:1rem;line-height:1rem;text-align:center;vertical-align:top;width:1rem}.icon.is-medium{display:inline-block;font-size:28px;height:2rem;line-height:2rem;text-align:center;vertical-align:top;width:2rem}.icon.is-large{display:inline-block;font-size:42px;height:3rem;line-height:3rem;text-align:center;vertical-align:top;width:3rem}.image{display:block;position:relative}.image img{display:block;height:auto;width:100%}.image.is-square img,.image.is-1by1 img,.image.is-4by3 img,.image.is-3by2 img,.image.is-16by9 img,.image.is-2by1 img{bottom:0;left:0;position:absolute;right:0;top:0;height:100%;width:100%}.image.is-square,.image.is-1by1{padding-top:100%}.image.is-4by3{padding-top:75%}.image.is-3by2{padding-top:66.6666%}.image.is-16by9{padding-top:56.25%}.image.is-2by1{padding-top:50%}.image.is-16x16{height:16px;width:16px}.image.is-24x24{height:24px;width:24px}.image.is-32x32{height:32px;width:32px}.image.is-48x48{height:48px;width:48px}.image.is-64x64{height:64px;width:64px}.image.is-96x96{height:96px;width:96px}.image.is-128x128{height:128px;width:128px}.notification{background-color:#f5f5f5;border-radius:3px;padding:1.25rem 2.5rem 1.25rem 1.5rem;position:relative}.notification:not(:last-child){margin-bottom:1.5rem}.notification code,.notification pre{background:#fff}.notification pre code{background:transparent}.notification .delete{position:absolute;right:0.5em;top:0.5em}.notification .title,.notification .subtitle,.notification .content{color:inherit}.notification.is-white{background-color:#fff;color:#0a0a0a}.notification.is-black{background-color:#0a0a0a;color:#fff}.notification.is-light{background-color:#f5f5f5;color:#363636}.notification.is-dark{background-color:#363636;color:#f5f5f5}.notification.is-primary{background-color:#182b73;color:#fff}.notification.is-info{background-color:#3273dc;color:#fff}.notification.is-success{background-color:#23d160;color:#fff}.notification.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.notification.is-danger{background-color:red;color:#fff}.progress{-moz-appearance:none;-webkit-appearance:none;border:none;border-radius:290486px;display:block;height:1rem;overflow:hidden;padding:0;width:100%}.progress:not(:last-child){margin-bottom:1.5rem}.progress::-webkit-progress-bar{background-color:#dbdbdb}.progress::-webkit-progress-value{background-color:#4a4a4a}.progress::-moz-progress-bar{background-color:#4a4a4a}.progress.is-white::-webkit-progress-value{background-color:#fff}.progress.is-white::-moz-progress-bar{background-color:#fff}.progress.is-black::-webkit-progress-value{background-color:#0a0a0a}.progress.is-black::-moz-progress-bar{background-color:#0a0a0a}.progress.is-light::-webkit-progress-value{background-color:#f5f5f5}.progress.is-light::-moz-progress-bar{background-color:#f5f5f5}.progress.is-dark::-webkit-progress-value{background-color:#363636}.progress.is-dark::-moz-progress-bar{background-color:#363636}.progress.is-primary::-webkit-progress-value{background-color:#182b73}.progress.is-primary::-moz-progress-bar{background-color:#182b73}.progress.is-info::-webkit-progress-value{background-color:#3273dc}.progress.is-info::-moz-progress-bar{background-color:#3273dc}.progress.is-success::-webkit-progress-value{background-color:#23d160}.progress.is-success::-moz-progress-bar{background-color:#23d160}.progress.is-warning::-webkit-progress-value{background-color:#ffdd57}.progress.is-warning::-moz-progress-bar{background-color:#ffdd57}.progress.is-danger::-webkit-progress-value{background-color:red}.progress.is-danger::-moz-progress-bar{background-color:red}.progress.is-small{height:.75rem}.progress.is-medium{height:1.25rem}.progress.is-large{height:1.5rem}.table{background-color:#fff;color:#363636;margin-bottom:1.5rem;width:100%}.table td,.table th{border:1px solid #dbdbdb;border-width:0 0 1px;padding:0.5em 0.75em;vertical-align:top}.table td.is-narrow,.table th.is-narrow{white-space:nowrap;width:1%}.table th{color:#363636;text-align:left}.table tr:hover{background-color:#fafafa}.table thead td,.table thead th{border-width:0 0 2px;color:#7a7a7a}.table tfoot td,.table tfoot th{border-width:2px 0 0;color:#7a7a7a}.table tbody tr:last-child td,.table tbody tr:last-child th{border-bottom-width:0}.table.is-bordered td,.table.is-bordered th{border-width:1px}.table.is-bordered tr:last-child td,.table.is-bordered tr:last-child th{border-bottom-width:1px}.table.is-narrow td,.table.is-narrow th{padding:0.25em 0.5em}.table.is-striped tbody tr:nth-child(even){background-color:#fafafa}.table.is-striped tbody tr:nth-child(even):hover{background-color:#f5f5f5}.tag{align-items:center;background-color:#f5f5f5;border-radius:290486px;color:#4a4a4a;display:inline-flex;font-size:.75rem;height:2em;justify-content:center;line-height:1.5;padding-left:0.875em;padding-right:0.875em;vertical-align:top;white-space:nowrap}.tag .delete{margin-left:0.25em;margin-right:-0.5em}.tag.is-white{background-color:#fff;color:#0a0a0a}.tag.is-black{background-color:#0a0a0a;color:#fff}.tag.is-light{background-color:#f5f5f5;color:#363636}.tag.is-dark{background-color:#363636;color:#f5f5f5}.tag.is-primary{background-color:#182b73;color:#fff}.tag.is-info{background-color:#3273dc;color:#fff}.tag.is-success{background-color:#23d160;color:#fff}.tag.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.tag.is-danger{background-color:red;color:#fff}.tag.is-medium{font-size:1rem}.tag.is-large{font-size:1.25rem}.title,.subtitle{word-break:break-word}.title:not(:last-child),.subtitle:not(:last-child){margin-bottom:1.5rem}.title em,.title span,.subtitle em,.subtitle span{font-weight:300}.title strong,.subtitle strong{font-weight:500}.title .tag,.subtitle .tag{vertical-align:middle}.title{color:#363636;font-size:2rem;font-weight:300;line-height:1.125}.title strong{color:inherit}.title+.highlight{margin-top:-0.75rem}.title+.subtitle{margin-top:-1.25rem}.title.is-1{font-size:3.5rem}.title.is-2{font-size:2.75rem}.title.is-3{font-size:2rem}.title.is-4{font-size:1.5rem}.title.is-5{font-size:1.25rem}.title.is-6{font-size:14px}.subtitle{color:#4a4a4a;font-size:1.25rem;font-weight:300;line-height:1.25}.subtitle strong{color:#363636}.subtitle+.title{margin-top:-1.5rem}.subtitle.is-1{font-size:3.5rem}.subtitle.is-2{font-size:2.75rem}.subtitle.is-3{font-size:2rem}.subtitle.is-4{font-size:1.5rem}.subtitle.is-5{font-size:1.25rem}.subtitle.is-6{font-size:14px}.block:not(:last-child){margin-bottom:1.5rem}.container{position:relative}@media screen and (min-width: 1000px){.container{margin:0 auto;max-width:960px}.container.is-fluid{margin:0 20px;max-width:none}}@media screen and (min-width: 1192px){.container{max-width:1152px}}.delete{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-moz-appearance:none;-webkit-appearance:none;background-color:rgba(10,10,10,0.2);border:none;border-radius:290486px;cursor:pointer;display:inline-block;font-size:1rem;height:20px;outline:none;position:relative;transform:rotate(45deg);transform-origin:center center;vertical-align:top;width:20px}.delete:before,.delete:after{background-color:#fff;content:\"\";display:block;left:50%;position:absolute;top:50%;transform:translateX(-50%) translateY(-50%)}.delete:before{height:2px;width:50%}.delete:after{height:50%;width:2px}.delete:hover,.delete:focus{background-color:rgba(10,10,10,0.3)}.delete:active{background-color:rgba(10,10,10,0.4)}.delete.is-small{height:14px;width:14px}.delete.is-medium{height:26px;width:26px}.delete.is-large{height:30px;width:30px}.fa{font-size:21px;text-align:center;vertical-align:top}.heading{display:block;font-size:11px;letter-spacing:1px;margin-bottom:5px;text-transform:uppercase}.highlight{font-weight:400;max-width:100%;overflow:hidden;padding:0}.highlight:not(:last-child){margin-bottom:1.5rem}.highlight pre{overflow:auto;max-width:100%}.loader{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1rem;position:relative;width:1rem}.number{align-items:center;background-color:#f5f5f5;border-radius:290486px;display:inline-flex;font-size:1.25rem;height:2em;justify-content:center;margin-right:1.5rem;min-width:2.5em;padding:0.25rem 0.5rem;text-align:center;vertical-align:top}.card-header{align-items:stretch;box-shadow:0 1px 2px rgba(10,10,10,0.1);display:flex}.card-header-title{align-items:center;color:#363636;display:flex;flex-grow:1;font-weight:700;padding:0.75rem}.card-header-icon{align-items:center;cursor:pointer;display:flex;justify-content:center;padding:0.75rem}.card-image{display:block;position:relative}.card-content{padding:1.5rem}.card-content .title+.subtitle{margin-top:-1.5rem}.card-footer{border-top:1px solid #dbdbdb;align-items:stretch;display:flex}.card-footer-item{align-items:center;display:flex;flex-basis:0;flex-grow:1;flex-shrink:0;justify-content:center;padding:0.75rem}.card-footer-item:not(:last-child){border-right:1px solid #dbdbdb}.card{background-color:#fff;box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px rgba(10,10,10,0.1);color:#4a4a4a;max-width:100%;position:relative}.card .media:not(:last-child){margin-bottom:0.75rem}.level-item{align-items:center;display:flex;flex-basis:auto;flex-grow:0;flex-shrink:0;justify-content:center}.level-item .title,.level-item .subtitle{margin-bottom:0}@media screen and (max-width: 768px){.level-item:not(:last-child){margin-bottom:0.75rem}}.level-left,.level-right{flex-basis:auto;flex-grow:0;flex-shrink:0}.level-left .level-item:not(:last-child),.level-right .level-item:not(:last-child){margin-right:0.75rem}.level-left .level-item.is-flexible,.level-right .level-item.is-flexible{flex-grow:1}.level-left{align-items:center;justify-content:flex-start}@media screen and (max-width: 768px){.level-left+.level-right{margin-top:1.5rem}}@media screen and (min-width: 769px){.level-left{display:flex}}.level-right{align-items:center;justify-content:flex-end}@media screen and (min-width: 769px){.level-right{display:flex}}.level{align-items:center;justify-content:space-between}.level:not(:last-child){margin-bottom:1.5rem}.level code{border-radius:3px}.level img{display:inline-block;vertical-align:top}.level.is-mobile{display:flex}.level.is-mobile>.level-item:not(:last-child){margin-bottom:0}.level.is-mobile>.level-item:not(.is-narrow){flex-grow:1}@media screen and (min-width: 769px){.level{display:flex}.level>.level-item:not(.is-narrow){flex-grow:1}}.media-left,.media-right{flex-basis:auto;flex-grow:0;flex-shrink:0}.media-left{margin-right:1rem}.media-right{margin-left:1rem}.media-content{flex-basis:auto;flex-grow:1;flex-shrink:1;text-align:left}.media{align-items:flex-start;display:flex;text-align:left}.media .content:not(:last-child){margin-bottom:0.75rem}.media .media{border-top:1px solid rgba(219,219,219,0.5);display:flex;padding-top:0.75rem}.media .media .content:not(:last-child),.media .media .control:not(:last-child){margin-bottom:0.5rem}.media .media .media{padding-top:0.5rem}.media .media .media+.media{margin-top:0.5rem}.media+.media{border-top:1px solid rgba(219,219,219,0.5);margin-top:1rem;padding-top:1rem}.media.is-large+.media{margin-top:1.5rem;padding-top:1.5rem}.menu{font-size:1rem}.menu-list{line-height:1.25}.menu-list a{border-radius:2px;color:#4a4a4a;display:block;padding:0.5em 0.75em}.menu-list a:hover{background-color:#f5f5f5;color:#182b73}.menu-list a.is-active{background-color:#182b73;color:#fff}.menu-list li ul{border-left:1px solid #dbdbdb;margin:0.75em;padding-left:0.75em}.menu-label{color:#7a7a7a;font-size:0.8em;letter-spacing:0.1em;text-transform:uppercase}.menu-label:not(:first-child){margin-top:1em}.menu-label:not(:last-child){margin-bottom:1em}.message{background-color:#f5f5f5;border-radius:3px;font-size:1rem}.message:not(:last-child){margin-bottom:1.5rem}.message.is-white{background-color:#fff}.message.is-white .message-header{background-color:#fff;color:#0a0a0a}.message.is-white .message-body{border-color:#fff;color:#4d4d4d}.message.is-black{background-color:#fafafa}.message.is-black .message-header{background-color:#0a0a0a;color:#fff}.message.is-black .message-body{border-color:#0a0a0a;color:#090909}.message.is-light{background-color:#fafafa}.message.is-light .message-header{background-color:#f5f5f5;color:#363636}.message.is-light .message-body{border-color:#f5f5f5;color:#505050}.message.is-dark{background-color:#fafafa}.message.is-dark .message-header{background-color:#363636;color:#f5f5f5}.message.is-dark .message-body{border-color:#363636;color:#2a2a2a}.message.is-primary{background-color:#f7f8fd}.message.is-primary .message-header{background-color:#182b73;color:#fff}.message.is-primary .message-body{border-color:#182b73;color:#162662}.message.is-info{background-color:#f6f9fe}.message.is-info .message-header{background-color:#3273dc;color:#fff}.message.is-info .message-body{border-color:#3273dc;color:#22509a}.message.is-success{background-color:#f6fef9}.message.is-success .message-header{background-color:#23d160;color:#fff}.message.is-success .message-body{border-color:#23d160;color:#0e301a}.message.is-warning{background-color:#fffdf5}.message.is-warning .message-header{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.message.is-warning .message-body{border-color:#ffdd57;color:#3b3108}.message.is-danger{background-color:#fff5f5}.message.is-danger .message-header{background-color:red;color:#fff}.message.is-danger .message-body{border-color:red;color:#ad0606}.message-header{align-items:center;background-color:#4a4a4a;border-radius:3px 3px 0 0;color:#fff;display:flex;justify-content:space-between;line-height:1.25;padding:0.5em 0.75em;position:relative}.message-header a,.message-header strong{color:inherit}.message-header a{text-decoration:underline}.message-header .delete{flex-grow:0;flex-shrink:0;margin-left:0.75em}.message-header+.message-body{border-top-left-radius:0;border-top-right-radius:0;border-top:none}.message-body{border:1px solid #dbdbdb;border-radius:3px;color:#4a4a4a;padding:1em 1.25em}.message-body a,.message-body strong{color:inherit}.message-body a{text-decoration:underline}.message-body code,.message-body pre{background:#fff}.message-body pre code{background:transparent}.modal-background{bottom:0;left:0;position:absolute;right:0;top:0;background-color:rgba(10,10,10,0.86)}.modal-content,.modal-card{margin:0 20px;max-height:calc(100vh - 160px);overflow:auto;position:relative;width:100%}@media screen and (min-width: 769px){.modal-content,.modal-card{margin:0 auto;max-height:calc(100vh - 40px);width:640px}}.modal-close{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-moz-appearance:none;-webkit-appearance:none;background-color:rgba(10,10,10,0.2);border:none;border-radius:290486px;cursor:pointer;display:inline-block;font-size:1rem;height:20px;outline:none;position:relative;transform:rotate(45deg);transform-origin:center center;vertical-align:top;width:20px;background:none;height:40px;position:fixed;right:20px;top:20px;width:40px}.modal-close:before,.modal-close:after{background-color:#fff;content:\"\";display:block;left:50%;position:absolute;top:50%;transform:translateX(-50%) translateY(-50%)}.modal-close:before{height:2px;width:50%}.modal-close:after{height:50%;width:2px}.modal-close:hover,.modal-close:focus{background-color:rgba(10,10,10,0.3)}.modal-close:active{background-color:rgba(10,10,10,0.4)}.modal-close.is-small{height:14px;width:14px}.modal-close.is-medium{height:26px;width:26px}.modal-close.is-large{height:30px;width:30px}.modal-card{display:flex;flex-direction:column;max-height:calc(100vh - 40px);overflow:hidden}.modal-card-head,.modal-card-foot{align-items:center;background-color:#f5f5f5;display:flex;flex-shrink:0;justify-content:flex-start;padding:20px;position:relative}.modal-card-head{border-bottom:1px solid #dbdbdb;border-top-left-radius:5px;border-top-right-radius:5px}.modal-card-title{color:#363636;flex-grow:1;flex-shrink:0;font-size:1.5rem;line-height:1}.modal-card-foot{border-bottom-left-radius:5px;border-bottom-right-radius:5px;border-top:1px solid #dbdbdb}.modal-card-foot .button:not(:last-child){margin-right:10px}.modal-card-body{-webkit-overflow-scrolling:touch;background-color:#fff;flex-grow:1;flex-shrink:1;overflow:auto;padding:20px}.modal{bottom:0;left:0;position:absolute;right:0;top:0;align-items:center;display:none;justify-content:center;overflow:hidden;position:fixed;z-index:1986}.modal.is-active{display:flex}.nav-toggle{cursor:pointer;display:block;height:3.5rem;position:relative;width:3.5rem}.nav-toggle span{background-color:#4a4a4a;display:block;height:1px;left:50%;margin-left:-7px;position:absolute;top:50%;transition:none 86ms ease-out;transition-property:background, left, opacity, transform;width:15px}.nav-toggle span:nth-child(1){margin-top:-6px}.nav-toggle span:nth-child(2){margin-top:-1px}.nav-toggle span:nth-child(3){margin-top:4px}.nav-toggle:hover{background-color:#f5f5f5}.nav-toggle.is-active span{background-color:#182b73}.nav-toggle.is-active span:nth-child(1){margin-left:-5px;transform:rotate(45deg);transform-origin:left top}.nav-toggle.is-active span:nth-child(2){opacity:0}.nav-toggle.is-active span:nth-child(3){margin-left:-5px;transform:rotate(-45deg);transform-origin:left bottom}@media screen and (min-width: 769px){.nav-toggle{display:none}}.nav-item{align-items:center;display:flex;flex-grow:0;flex-shrink:0;font-size:1rem;justify-content:center;padding:0.5rem 0.75rem}.nav-item a{flex-grow:1;flex-shrink:0}.nav-item img{max-height:1.75rem}.nav-item .button+.button{margin-left:0.75rem}.nav-item .tag:first-child:not(:last-child){margin-right:0.5rem}.nav-item .tag:last-child:not(:first-child){margin-left:0.5rem}@media screen and (max-width: 768px){.nav-item{justify-content:flex-start}}.nav-item a,a.nav-item{color:#7a7a7a}.nav-item a:hover,a.nav-item:hover{color:#363636}.nav-item a.is-active,a.nav-item.is-active{color:#363636}.nav-item a.is-tab,a.nav-item.is-tab{border-bottom:1px solid transparent;border-top:1px solid transparent;padding-bottom:calc(0.5rem - 1px);padding-left:1rem;padding-right:1rem;padding-top:calc(0.5rem - 1px)}.nav-item a.is-tab:hover,a.nav-item.is-tab:hover{border-bottom-color:#182b73;border-top-color:transparent}.nav-item a.is-tab.is-active,a.nav-item.is-tab.is-active{border-bottom:3px solid #182b73;color:#182b73;padding-bottom:calc(0.5rem - 3px)}@media screen and (min-width: 1000px){.nav-item a.is-brand,a.nav-item.is-brand{padding-left:0}}@media screen and (max-width: 768px){.nav-menu{background-color:#fff;box-shadow:0 4px 7px rgba(10,10,10,0.1);left:0;display:none;right:0;top:100%;position:absolute}.nav-menu .nav-item{border-top:1px solid rgba(219,219,219,0.5);padding:0.75rem}.nav-menu.is-active{display:block}}@media screen and (min-width: 769px) and (max-width: 999px){.nav-menu{padding-right:1.5rem}}.nav-left,.nav-right{align-items:stretch;flex-basis:0;flex-grow:1;flex-shrink:0}.nav-left{display:flex;justify-content:flex-start;overflow:hidden;overflow-x:auto;white-space:nowrap}.nav-center{align-items:stretch;display:flex;flex-grow:0;flex-shrink:0;justify-content:center;margin-left:auto;margin-right:auto}.nav-right{justify-content:flex-end}@media screen and (min-width: 769px){.nav-right{display:flex}}.nav{align-items:stretch;background-color:#fff;display:flex;min-height:3.5rem;position:relative;text-align:center;z-index:2}.nav>.container{align-items:stretch;display:flex;min-height:3.5rem;width:100%}.nav.has-shadow{box-shadow:0 2px 3px rgba(10,10,10,0.1)}.pagination,.pagination-list{align-items:center;display:flex;justify-content:center;text-align:center}.pagination-previous,.pagination-next,.pagination-link,.pagination-ellipsis{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:none;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.285em;justify-content:flex-start;line-height:1.5;padding-left:0.75em;padding-right:0.75em;position:relative;vertical-align:top;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;font-size:0.875rem;padding-left:0.5em;padding-right:0.5em;justify-content:center;text-align:center}.pagination-previous:focus,.pagination-previous.is-focused,.pagination-previous:active,.pagination-previous.is-active,.pagination-next:focus,.pagination-next.is-focused,.pagination-next:active,.pagination-next.is-active,.pagination-link:focus,.pagination-link.is-focused,.pagination-link:active,.pagination-link.is-active,.pagination-ellipsis:focus,.pagination-ellipsis.is-focused,.pagination-ellipsis:active,.pagination-ellipsis.is-active{outline:none}.pagination-previous[disabled],.pagination-previous.is-disabled,.pagination-next[disabled],.pagination-next.is-disabled,.pagination-link[disabled],.pagination-link.is-disabled,.pagination-ellipsis[disabled],.pagination-ellipsis.is-disabled{pointer-events:none}.pagination-previous,.pagination-next,.pagination-link{border:1px solid #dbdbdb;min-width:2.5em}.pagination-previous:hover,.pagination-next:hover,.pagination-link:hover{border-color:#b5b5b5;color:#363636}.pagination-previous:focus,.pagination-next:focus,.pagination-link:focus{border-color:#182b73}.pagination-previous:active,.pagination-next:active,.pagination-link:active{box-shadow:inset 0 1px 2px rgba(10,10,10,0.2)}.pagination-previous[disabled],.pagination-previous.is-disabled,.pagination-next[disabled],.pagination-next.is-disabled,.pagination-link[disabled],.pagination-link.is-disabled{background:#dbdbdb;color:#7a7a7a;opacity:0.5;pointer-events:none}.pagination-previous,.pagination-next{padding-left:0.75em;padding-right:0.75em}.pagination-link.is-current{background-color:#182b73;border-color:#182b73;color:#fff}.pagination-ellipsis{color:#b5b5b5;pointer-events:none}.pagination-list li:not(:first-child){margin-left:0.375rem}@media screen and (max-width: 768px){.pagination{flex-wrap:wrap}.pagination-previous,.pagination-next{flex-grow:1;flex-shrink:1;width:calc(50% - 0.375rem)}.pagination-next{margin-left:0.75rem}.pagination-list{margin-top:0.75rem}.pagination-list li{flex-grow:1;flex-shrink:1}}@media screen and (min-width: 769px){.pagination-list{flex-grow:1;flex-shrink:1;justify-content:flex-start;order:1}.pagination-previous,.pagination-next{margin-left:0.75rem}.pagination-previous{order:2}.pagination-next{order:3}.pagination{justify-content:space-between}.pagination.is-centered .pagination-previous{margin-left:0;order:1}.pagination.is-centered .pagination-list{justify-content:center;order:2}.pagination.is-centered .pagination-next{order:3}.pagination.is-right .pagination-previous{margin-left:0;order:1}.pagination.is-right .pagination-next{order:2;margin-right:0.75rem}.pagination.is-right .pagination-list{justify-content:flex-end;order:3}}.panel{font-size:1rem}.panel:not(:last-child){margin-bottom:1.5rem}.panel-heading,.panel-tabs,.panel-block{border-bottom:1px solid #dbdbdb;border-left:1px solid #dbdbdb;border-right:1px solid #dbdbdb}.panel-heading:first-child,.panel-tabs:first-child,.panel-block:first-child{border-top:1px solid #dbdbdb}.panel-heading{background-color:#f5f5f5;border-radius:3px 3px 0 0;color:#363636;font-size:1.25em;font-weight:300;line-height:1.25;padding:0.5em 0.75em}.panel-tabs{align-items:flex-end;display:flex;font-size:0.875em;justify-content:center}.panel-tabs a{border-bottom:1px solid #dbdbdb;margin-bottom:-1px;padding:0.5em}.panel-tabs a.is-active{border-bottom-color:#4a4a4a;color:#363636}.panel-list a{color:#4a4a4a}.panel-list a:hover{color:#182b73}.panel-block{align-items:center;color:#363636;display:flex;justify-content:flex-start;padding:0.5em 0.75em}.panel-block input[type=\"checkbox\"]{margin-right:0.75em}.panel-block>.control{flex-grow:1;flex-shrink:1;width:100%}.panel-block.is-active{border-left-color:#182b73;color:#363636}.panel-block.is-active .panel-icon{color:#182b73}a.panel-block,label.panel-block{cursor:pointer}a.panel-block:hover,label.panel-block:hover{background-color:#f5f5f5}.panel-icon{display:inline-block;font-size:14px;height:1em;line-height:1em;text-align:center;vertical-align:top;width:1em;color:#7a7a7a;margin-right:0.75em}.panel-icon .fa{font-size:inherit;line-height:inherit}.tabs{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;align-items:stretch;display:flex;font-size:1rem;justify-content:space-between;overflow:hidden;overflow-x:auto;white-space:nowrap}.tabs:not(:last-child){margin-bottom:1.5rem}.tabs a{align-items:center;border-bottom:1px solid #dbdbdb;color:#4a4a4a;display:flex;justify-content:center;margin-bottom:-1px;padding:0.5em 1em;vertical-align:top}.tabs a:hover{border-bottom-color:#363636;color:#363636}.tabs li{display:block}.tabs li.is-active a{border-bottom-color:#182b73;color:#182b73}.tabs ul{align-items:center;border-bottom:1px solid #dbdbdb;display:flex;flex-grow:1;flex-shrink:0;justify-content:flex-start}.tabs ul.is-left{padding-right:0.75em}.tabs ul.is-center{flex:none;justify-content:center;padding-left:0.75em;padding-right:0.75em}.tabs ul.is-right{justify-content:flex-end;padding-left:0.75em}.tabs .icon:first-child{margin-right:0.5em}.tabs .icon:last-child{margin-left:0.5em}.tabs.is-centered ul{justify-content:center}.tabs.is-right ul{justify-content:flex-end}.tabs.is-boxed a{border:1px solid transparent;border-radius:3px 3px 0 0}.tabs.is-boxed a:hover{background-color:#f5f5f5;border-bottom-color:#dbdbdb}.tabs.is-boxed li.is-active a{background-color:#fff;border-color:#dbdbdb;border-bottom-color:transparent !important}.tabs.is-fullwidth li{flex-grow:1;flex-shrink:0}.tabs.is-toggle a{border:1px solid #dbdbdb;margin-bottom:0;position:relative}.tabs.is-toggle a:hover{background-color:#f5f5f5;border-color:#b5b5b5;z-index:2}.tabs.is-toggle li+li{margin-left:-1px}.tabs.is-toggle li:first-child a{border-radius:3px 0 0 3px}.tabs.is-toggle li:last-child a{border-radius:0 3px 3px 0}.tabs.is-toggle li.is-active a{background-color:#182b73;border-color:#182b73;color:#fff;z-index:1}.tabs.is-toggle ul{border-bottom:none}.tabs.is-small{font-size:.75rem}.tabs.is-medium{font-size:1.25rem}.tabs.is-large{font-size:1.5rem}.column{display:block;flex-basis:0;flex-grow:1;flex-shrink:1;padding:0.75rem}.columns.is-mobile>.column.is-narrow{flex:none}.columns.is-mobile>.column.is-full{flex:none;width:100%}.columns.is-mobile>.column.is-three-quarters{flex:none;width:75%}.columns.is-mobile>.column.is-two-thirds{flex:none;width:66.6666%}.columns.is-mobile>.column.is-half{flex:none;width:50%}.columns.is-mobile>.column.is-one-third{flex:none;width:33.3333%}.columns.is-mobile>.column.is-one-quarter{flex:none;width:25%}.columns.is-mobile>.column.is-offset-three-quarters{margin-left:75%}.columns.is-mobile>.column.is-offset-two-thirds{margin-left:66.6666%}.columns.is-mobile>.column.is-offset-half{margin-left:50%}.columns.is-mobile>.column.is-offset-one-third{margin-left:33.3333%}.columns.is-mobile>.column.is-offset-one-quarter{margin-left:25%}.columns.is-mobile>.column.is-1{flex:none;width:8.33333%}.columns.is-mobile>.column.is-offset-1{margin-left:8.33333%}.columns.is-mobile>.column.is-2{flex:none;width:16.66667%}.columns.is-mobile>.column.is-offset-2{margin-left:16.66667%}.columns.is-mobile>.column.is-3{flex:none;width:25%}.columns.is-mobile>.column.is-offset-3{margin-left:25%}.columns.is-mobile>.column.is-4{flex:none;width:33.33333%}.columns.is-mobile>.column.is-offset-4{margin-left:33.33333%}.columns.is-mobile>.column.is-5{flex:none;width:41.66667%}.columns.is-mobile>.column.is-offset-5{margin-left:41.66667%}.columns.is-mobile>.column.is-6{flex:none;width:50%}.columns.is-mobile>.column.is-offset-6{margin-left:50%}.columns.is-mobile>.column.is-7{flex:none;width:58.33333%}.columns.is-mobile>.column.is-offset-7{margin-left:58.33333%}.columns.is-mobile>.column.is-8{flex:none;width:66.66667%}.columns.is-mobile>.column.is-offset-8{margin-left:66.66667%}.columns.is-mobile>.column.is-9{flex:none;width:75%}.columns.is-mobile>.column.is-offset-9{margin-left:75%}.columns.is-mobile>.column.is-10{flex:none;width:83.33333%}.columns.is-mobile>.column.is-offset-10{margin-left:83.33333%}.columns.is-mobile>.column.is-11{flex:none;width:91.66667%}.columns.is-mobile>.column.is-offset-11{margin-left:91.66667%}.columns.is-mobile>.column.is-12{flex:none;width:100%}.columns.is-mobile>.column.is-offset-12{margin-left:100%}@media screen and (max-width: 768px){.column.is-narrow-mobile{flex:none}.column.is-full-mobile{flex:none;width:100%}.column.is-three-quarters-mobile{flex:none;width:75%}.column.is-two-thirds-mobile{flex:none;width:66.6666%}.column.is-half-mobile{flex:none;width:50%}.column.is-one-third-mobile{flex:none;width:33.3333%}.column.is-one-quarter-mobile{flex:none;width:25%}.column.is-offset-three-quarters-mobile{margin-left:75%}.column.is-offset-two-thirds-mobile{margin-left:66.6666%}.column.is-offset-half-mobile{margin-left:50%}.column.is-offset-one-third-mobile{margin-left:33.3333%}.column.is-offset-one-quarter-mobile{margin-left:25%}.column.is-1-mobile{flex:none;width:8.33333%}.column.is-offset-1-mobile{margin-left:8.33333%}.column.is-2-mobile{flex:none;width:16.66667%}.column.is-offset-2-mobile{margin-left:16.66667%}.column.is-3-mobile{flex:none;width:25%}.column.is-offset-3-mobile{margin-left:25%}.column.is-4-mobile{flex:none;width:33.33333%}.column.is-offset-4-mobile{margin-left:33.33333%}.column.is-5-mobile{flex:none;width:41.66667%}.column.is-offset-5-mobile{margin-left:41.66667%}.column.is-6-mobile{flex:none;width:50%}.column.is-offset-6-mobile{margin-left:50%}.column.is-7-mobile{flex:none;width:58.33333%}.column.is-offset-7-mobile{margin-left:58.33333%}.column.is-8-mobile{flex:none;width:66.66667%}.column.is-offset-8-mobile{margin-left:66.66667%}.column.is-9-mobile{flex:none;width:75%}.column.is-offset-9-mobile{margin-left:75%}.column.is-10-mobile{flex:none;width:83.33333%}.column.is-offset-10-mobile{margin-left:83.33333%}.column.is-11-mobile{flex:none;width:91.66667%}.column.is-offset-11-mobile{margin-left:91.66667%}.column.is-12-mobile{flex:none;width:100%}.column.is-offset-12-mobile{margin-left:100%}}@media screen and (min-width: 769px){.column.is-narrow,.column.is-narrow-tablet{flex:none}.column.is-full,.column.is-full-tablet{flex:none;width:100%}.column.is-three-quarters,.column.is-three-quarters-tablet{flex:none;width:75%}.column.is-two-thirds,.column.is-two-thirds-tablet{flex:none;width:66.6666%}.column.is-half,.column.is-half-tablet{flex:none;width:50%}.column.is-one-third,.column.is-one-third-tablet{flex:none;width:33.3333%}.column.is-one-quarter,.column.is-one-quarter-tablet{flex:none;width:25%}.column.is-offset-three-quarters,.column.is-offset-three-quarters-tablet{margin-left:75%}.column.is-offset-two-thirds,.column.is-offset-two-thirds-tablet{margin-left:66.6666%}.column.is-offset-half,.column.is-offset-half-tablet{margin-left:50%}.column.is-offset-one-third,.column.is-offset-one-third-tablet{margin-left:33.3333%}.column.is-offset-one-quarter,.column.is-offset-one-quarter-tablet{margin-left:25%}.column.is-1,.column.is-1-tablet{flex:none;width:8.33333%}.column.is-offset-1,.column.is-offset-1-tablet{margin-left:8.33333%}.column.is-2,.column.is-2-tablet{flex:none;width:16.66667%}.column.is-offset-2,.column.is-offset-2-tablet{margin-left:16.66667%}.column.is-3,.column.is-3-tablet{flex:none;width:25%}.column.is-offset-3,.column.is-offset-3-tablet{margin-left:25%}.column.is-4,.column.is-4-tablet{flex:none;width:33.33333%}.column.is-offset-4,.column.is-offset-4-tablet{margin-left:33.33333%}.column.is-5,.column.is-5-tablet{flex:none;width:41.66667%}.column.is-offset-5,.column.is-offset-5-tablet{margin-left:41.66667%}.column.is-6,.column.is-6-tablet{flex:none;width:50%}.column.is-offset-6,.column.is-offset-6-tablet{margin-left:50%}.column.is-7,.column.is-7-tablet{flex:none;width:58.33333%}.column.is-offset-7,.column.is-offset-7-tablet{margin-left:58.33333%}.column.is-8,.column.is-8-tablet{flex:none;width:66.66667%}.column.is-offset-8,.column.is-offset-8-tablet{margin-left:66.66667%}.column.is-9,.column.is-9-tablet{flex:none;width:75%}.column.is-offset-9,.column.is-offset-9-tablet{margin-left:75%}.column.is-10,.column.is-10-tablet{flex:none;width:83.33333%}.column.is-offset-10,.column.is-offset-10-tablet{margin-left:83.33333%}.column.is-11,.column.is-11-tablet{flex:none;width:91.66667%}.column.is-offset-11,.column.is-offset-11-tablet{margin-left:91.66667%}.column.is-12,.column.is-12-tablet{flex:none;width:100%}.column.is-offset-12,.column.is-offset-12-tablet{margin-left:100%}}@media screen and (min-width: 1000px){.column.is-narrow-desktop{flex:none}.column.is-full-desktop{flex:none;width:100%}.column.is-three-quarters-desktop{flex:none;width:75%}.column.is-two-thirds-desktop{flex:none;width:66.6666%}.column.is-half-desktop{flex:none;width:50%}.column.is-one-third-desktop{flex:none;width:33.3333%}.column.is-one-quarter-desktop{flex:none;width:25%}.column.is-offset-three-quarters-desktop{margin-left:75%}.column.is-offset-two-thirds-desktop{margin-left:66.6666%}.column.is-offset-half-desktop{margin-left:50%}.column.is-offset-one-third-desktop{margin-left:33.3333%}.column.is-offset-one-quarter-desktop{margin-left:25%}.column.is-1-desktop{flex:none;width:8.33333%}.column.is-offset-1-desktop{margin-left:8.33333%}.column.is-2-desktop{flex:none;width:16.66667%}.column.is-offset-2-desktop{margin-left:16.66667%}.column.is-3-desktop{flex:none;width:25%}.column.is-offset-3-desktop{margin-left:25%}.column.is-4-desktop{flex:none;width:33.33333%}.column.is-offset-4-desktop{margin-left:33.33333%}.column.is-5-desktop{flex:none;width:41.66667%}.column.is-offset-5-desktop{margin-left:41.66667%}.column.is-6-desktop{flex:none;width:50%}.column.is-offset-6-desktop{margin-left:50%}.column.is-7-desktop{flex:none;width:58.33333%}.column.is-offset-7-desktop{margin-left:58.33333%}.column.is-8-desktop{flex:none;width:66.66667%}.column.is-offset-8-desktop{margin-left:66.66667%}.column.is-9-desktop{flex:none;width:75%}.column.is-offset-9-desktop{margin-left:75%}.column.is-10-desktop{flex:none;width:83.33333%}.column.is-offset-10-desktop{margin-left:83.33333%}.column.is-11-desktop{flex:none;width:91.66667%}.column.is-offset-11-desktop{margin-left:91.66667%}.column.is-12-desktop{flex:none;width:100%}.column.is-offset-12-desktop{margin-left:100%}}@media screen and (min-width: 1192px){.column.is-narrow-widescreen{flex:none}.column.is-full-widescreen{flex:none;width:100%}.column.is-three-quarters-widescreen{flex:none;width:75%}.column.is-two-thirds-widescreen{flex:none;width:66.6666%}.column.is-half-widescreen{flex:none;width:50%}.column.is-one-third-widescreen{flex:none;width:33.3333%}.column.is-one-quarter-widescreen{flex:none;width:25%}.column.is-offset-three-quarters-widescreen{margin-left:75%}.column.is-offset-two-thirds-widescreen{margin-left:66.6666%}.column.is-offset-half-widescreen{margin-left:50%}.column.is-offset-one-third-widescreen{margin-left:33.3333%}.column.is-offset-one-quarter-widescreen{margin-left:25%}.column.is-1-widescreen{flex:none;width:8.33333%}.column.is-offset-1-widescreen{margin-left:8.33333%}.column.is-2-widescreen{flex:none;width:16.66667%}.column.is-offset-2-widescreen{margin-left:16.66667%}.column.is-3-widescreen{flex:none;width:25%}.column.is-offset-3-widescreen{margin-left:25%}.column.is-4-widescreen{flex:none;width:33.33333%}.column.is-offset-4-widescreen{margin-left:33.33333%}.column.is-5-widescreen{flex:none;width:41.66667%}.column.is-offset-5-widescreen{margin-left:41.66667%}.column.is-6-widescreen{flex:none;width:50%}.column.is-offset-6-widescreen{margin-left:50%}.column.is-7-widescreen{flex:none;width:58.33333%}.column.is-offset-7-widescreen{margin-left:58.33333%}.column.is-8-widescreen{flex:none;width:66.66667%}.column.is-offset-8-widescreen{margin-left:66.66667%}.column.is-9-widescreen{flex:none;width:75%}.column.is-offset-9-widescreen{margin-left:75%}.column.is-10-widescreen{flex:none;width:83.33333%}.column.is-offset-10-widescreen{margin-left:83.33333%}.column.is-11-widescreen{flex:none;width:91.66667%}.column.is-offset-11-widescreen{margin-left:91.66667%}.column.is-12-widescreen{flex:none;width:100%}.column.is-offset-12-widescreen{margin-left:100%}}.columns{margin-left:-0.75rem;margin-right:-0.75rem;margin-top:-0.75rem}.columns:last-child{margin-bottom:-0.75rem}.columns:not(:last-child){margin-bottom:0.75rem}.columns.is-centered{justify-content:center}.columns.is-gapless{margin-left:0;margin-right:0;margin-top:0}.columns.is-gapless:last-child{margin-bottom:0}.columns.is-gapless:not(:last-child){margin-bottom:1.5rem}.columns.is-gapless>.column{margin:0;padding:0}@media screen and (min-width: 769px){.columns.is-grid{flex-wrap:wrap}.columns.is-grid>.column{max-width:33.3333%;padding:0.75rem;width:33.3333%}.columns.is-grid>.column+.column{margin-left:0}}.columns.is-mobile{display:flex}.columns.is-multiline{flex-wrap:wrap}.columns.is-vcentered{align-items:center}@media screen and (min-width: 769px){.columns:not(.is-desktop){display:flex}}@media screen and (min-width: 1000px){.columns.is-desktop{display:flex}}.tile{align-items:stretch;display:block;flex-basis:0;flex-grow:1;flex-shrink:1;min-height:min-content}.tile.is-ancestor{margin-left:-0.75rem;margin-right:-0.75rem;margin-top:-0.75rem}.tile.is-ancestor:last-child{margin-bottom:-0.75rem}.tile.is-ancestor:not(:last-child){margin-bottom:0.75rem}.tile.is-child{margin:0 !important}.tile.is-parent{padding:0.75rem}.tile.is-vertical{flex-direction:column}.tile.is-vertical>.tile.is-child:not(:last-child){margin-bottom:1.5rem !important}@media screen and (min-width: 769px){.tile:not(.is-child){display:flex}.tile.is-1{flex:none;width:8.33333%}.tile.is-2{flex:none;width:16.66667%}.tile.is-3{flex:none;width:25%}.tile.is-4{flex:none;width:33.33333%}.tile.is-5{flex:none;width:41.66667%}.tile.is-6{flex:none;width:50%}.tile.is-7{flex:none;width:58.33333%}.tile.is-8{flex:none;width:66.66667%}.tile.is-9{flex:none;width:75%}.tile.is-10{flex:none;width:83.33333%}.tile.is-11{flex:none;width:91.66667%}.tile.is-12{flex:none;width:100%}}.hero-video{bottom:0;left:0;position:absolute;right:0;top:0;overflow:hidden}.hero-video video{left:50%;min-height:100%;min-width:100%;position:absolute;top:50%;transform:translate3d(-50%, -50%, 0)}.hero-video.is-transparent{opacity:0.3}@media screen and (max-width: 768px){.hero-video{display:none}}.hero-buttons{margin-top:1.5rem}@media screen and (max-width: 768px){.hero-buttons .button{display:flex}.hero-buttons .button:not(:last-child){margin-bottom:0.75rem}}@media screen and (min-width: 769px){.hero-buttons{display:flex;justify-content:center}.hero-buttons .button:not(:last-child){margin-right:1.5rem}}.hero-head,.hero-foot{flex-grow:0;flex-shrink:0}.hero-body{flex-grow:1;flex-shrink:0;padding:3rem 1.5rem}@media screen and (min-width: 1192px){.hero-body{padding-left:0;padding-right:0}}.hero{align-items:stretch;background-color:#fff;display:flex;flex-direction:column;justify-content:space-between}.hero .nav{background:none;box-shadow:0 1px 0 rgba(219,219,219,0.3)}.hero .tabs ul{border-bottom:none}.hero.is-white{background-color:#fff;color:#0a0a0a}.hero.is-white a,.hero.is-white strong{color:inherit}.hero.is-white .title{color:#0a0a0a}.hero.is-white .subtitle{color:rgba(10,10,10,0.9)}.hero.is-white .subtitle a,.hero.is-white .subtitle strong{color:#0a0a0a}.hero.is-white .nav{box-shadow:0 1px 0 rgba(10,10,10,0.2)}@media screen and (max-width: 768px){.hero.is-white .nav-menu{background-color:#fff}}.hero.is-white a.nav-item,.hero.is-white .nav-item a:not(.button){color:rgba(10,10,10,0.7)}.hero.is-white a.nav-item:hover,.hero.is-white a.nav-item.is-active,.hero.is-white .nav-item a:not(.button):hover,.hero.is-white .nav-item a:not(.button).is-active{color:#0a0a0a}.hero.is-white .tabs a{color:#0a0a0a;opacity:0.9}.hero.is-white .tabs a:hover{opacity:1}.hero.is-white .tabs li.is-active a{opacity:1}.hero.is-white .tabs.is-boxed a,.hero.is-white .tabs.is-toggle a{color:#0a0a0a}.hero.is-white .tabs.is-boxed a:hover,.hero.is-white .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-white .tabs.is-boxed li.is-active a,.hero.is-white .tabs.is-boxed li.is-active a:hover,.hero.is-white .tabs.is-toggle li.is-active a,.hero.is-white .tabs.is-toggle li.is-active a:hover{background-color:#0a0a0a;border-color:#0a0a0a;color:#fff}.hero.is-white.is-bold{background-image:linear-gradient(141deg, #e6e6e6 0%, #fff 71%, #fff 100%)}@media screen and (max-width: 768px){.hero.is-white .nav-toggle span{background-color:#0a0a0a}.hero.is-white .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-white .nav-toggle.is-active span{background-color:#0a0a0a}.hero.is-white .nav-menu .nav-item{border-top-color:rgba(10,10,10,0.2)}}.hero.is-black{background-color:#0a0a0a;color:#fff}.hero.is-black a,.hero.is-black strong{color:inherit}.hero.is-black .title{color:#fff}.hero.is-black .subtitle{color:rgba(255,255,255,0.9)}.hero.is-black .subtitle a,.hero.is-black .subtitle strong{color:#fff}.hero.is-black .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-black .nav-menu{background-color:#0a0a0a}}.hero.is-black a.nav-item,.hero.is-black .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-black a.nav-item:hover,.hero.is-black a.nav-item.is-active,.hero.is-black .nav-item a:not(.button):hover,.hero.is-black .nav-item a:not(.button).is-active{color:#fff}.hero.is-black .tabs a{color:#fff;opacity:0.9}.hero.is-black .tabs a:hover{opacity:1}.hero.is-black .tabs li.is-active a{opacity:1}.hero.is-black .tabs.is-boxed a,.hero.is-black .tabs.is-toggle a{color:#fff}.hero.is-black .tabs.is-boxed a:hover,.hero.is-black .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-black .tabs.is-boxed li.is-active a,.hero.is-black .tabs.is-boxed li.is-active a:hover,.hero.is-black .tabs.is-toggle li.is-active a,.hero.is-black .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#0a0a0a}.hero.is-black.is-bold{background-image:linear-gradient(141deg, #000 0%, #0a0a0a 71%, #181616 100%)}@media screen and (max-width: 768px){.hero.is-black .nav-toggle span{background-color:#fff}.hero.is-black .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-black .nav-toggle.is-active span{background-color:#fff}.hero.is-black .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-light{background-color:#f5f5f5;color:#363636}.hero.is-light a,.hero.is-light strong{color:inherit}.hero.is-light .title{color:#363636}.hero.is-light .subtitle{color:rgba(54,54,54,0.9)}.hero.is-light .subtitle a,.hero.is-light .subtitle strong{color:#363636}.hero.is-light .nav{box-shadow:0 1px 0 rgba(54,54,54,0.2)}@media screen and (max-width: 768px){.hero.is-light .nav-menu{background-color:#f5f5f5}}.hero.is-light a.nav-item,.hero.is-light .nav-item a:not(.button){color:rgba(54,54,54,0.7)}.hero.is-light a.nav-item:hover,.hero.is-light a.nav-item.is-active,.hero.is-light .nav-item a:not(.button):hover,.hero.is-light .nav-item a:not(.button).is-active{color:#363636}.hero.is-light .tabs a{color:#363636;opacity:0.9}.hero.is-light .tabs a:hover{opacity:1}.hero.is-light .tabs li.is-active a{opacity:1}.hero.is-light .tabs.is-boxed a,.hero.is-light .tabs.is-toggle a{color:#363636}.hero.is-light .tabs.is-boxed a:hover,.hero.is-light .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-light .tabs.is-boxed li.is-active a,.hero.is-light .tabs.is-boxed li.is-active a:hover,.hero.is-light .tabs.is-toggle li.is-active a,.hero.is-light .tabs.is-toggle li.is-active a:hover{background-color:#363636;border-color:#363636;color:#f5f5f5}.hero.is-light.is-bold{background-image:linear-gradient(141deg, #dfd8d8 0%, #f5f5f5 71%, #fff 100%)}@media screen and (max-width: 768px){.hero.is-light .nav-toggle span{background-color:#363636}.hero.is-light .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-light .nav-toggle.is-active span{background-color:#363636}.hero.is-light .nav-menu .nav-item{border-top-color:rgba(54,54,54,0.2)}}.hero.is-dark{background-color:#363636;color:#f5f5f5}.hero.is-dark a,.hero.is-dark strong{color:inherit}.hero.is-dark .title{color:#f5f5f5}.hero.is-dark .subtitle{color:rgba(245,245,245,0.9)}.hero.is-dark .subtitle a,.hero.is-dark .subtitle strong{color:#f5f5f5}.hero.is-dark .nav{box-shadow:0 1px 0 rgba(245,245,245,0.2)}@media screen and (max-width: 768px){.hero.is-dark .nav-menu{background-color:#363636}}.hero.is-dark a.nav-item,.hero.is-dark .nav-item a:not(.button){color:rgba(245,245,245,0.7)}.hero.is-dark a.nav-item:hover,.hero.is-dark a.nav-item.is-active,.hero.is-dark .nav-item a:not(.button):hover,.hero.is-dark .nav-item a:not(.button).is-active{color:#f5f5f5}.hero.is-dark .tabs a{color:#f5f5f5;opacity:0.9}.hero.is-dark .tabs a:hover{opacity:1}.hero.is-dark .tabs li.is-active a{opacity:1}.hero.is-dark .tabs.is-boxed a,.hero.is-dark .tabs.is-toggle a{color:#f5f5f5}.hero.is-dark .tabs.is-boxed a:hover,.hero.is-dark .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-dark .tabs.is-boxed li.is-active a,.hero.is-dark .tabs.is-boxed li.is-active a:hover,.hero.is-dark .tabs.is-toggle li.is-active a,.hero.is-dark .tabs.is-toggle li.is-active a:hover{background-color:#f5f5f5;border-color:#f5f5f5;color:#363636}.hero.is-dark.is-bold{background-image:linear-gradient(141deg, #1f1919 0%, #363636 71%, #463f3f 100%)}@media screen and (max-width: 768px){.hero.is-dark .nav-toggle span{background-color:#f5f5f5}.hero.is-dark .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-dark .nav-toggle.is-active span{background-color:#f5f5f5}.hero.is-dark .nav-menu .nav-item{border-top-color:rgba(245,245,245,0.2)}}.hero.is-primary{background-color:#182b73;color:#fff}.hero.is-primary a,.hero.is-primary strong{color:inherit}.hero.is-primary .title{color:#fff}.hero.is-primary .subtitle{color:rgba(255,255,255,0.9)}.hero.is-primary .subtitle a,.hero.is-primary .subtitle strong{color:#fff}.hero.is-primary .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-primary .nav-menu{background-color:#182b73}}.hero.is-primary a.nav-item,.hero.is-primary .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-primary a.nav-item:hover,.hero.is-primary a.nav-item.is-active,.hero.is-primary .nav-item a:not(.button):hover,.hero.is-primary .nav-item a:not(.button).is-active{color:#fff}.hero.is-primary .tabs a{color:#fff;opacity:0.9}.hero.is-primary .tabs a:hover{opacity:1}.hero.is-primary .tabs li.is-active a{opacity:1}.hero.is-primary .tabs.is-boxed a,.hero.is-primary .tabs.is-toggle a{color:#fff}.hero.is-primary .tabs.is-boxed a:hover,.hero.is-primary .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-primary .tabs.is-boxed li.is-active a,.hero.is-primary .tabs.is-boxed li.is-active a:hover,.hero.is-primary .tabs.is-toggle li.is-active a,.hero.is-primary .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#182b73}.hero.is-primary.is-bold{background-image:linear-gradient(141deg, #0b244d 0%, #182b73 71%, #181d8c 100%)}@media screen and (max-width: 768px){.hero.is-primary .nav-toggle span{background-color:#fff}.hero.is-primary .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-primary .nav-toggle.is-active span{background-color:#fff}.hero.is-primary .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-info{background-color:#3273dc;color:#fff}.hero.is-info a,.hero.is-info strong{color:inherit}.hero.is-info .title{color:#fff}.hero.is-info .subtitle{color:rgba(255,255,255,0.9)}.hero.is-info .subtitle a,.hero.is-info .subtitle strong{color:#fff}.hero.is-info .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-info .nav-menu{background-color:#3273dc}}.hero.is-info a.nav-item,.hero.is-info .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-info a.nav-item:hover,.hero.is-info a.nav-item.is-active,.hero.is-info .nav-item a:not(.button):hover,.hero.is-info .nav-item a:not(.button).is-active{color:#fff}.hero.is-info .tabs a{color:#fff;opacity:0.9}.hero.is-info .tabs a:hover{opacity:1}.hero.is-info .tabs li.is-active a{opacity:1}.hero.is-info .tabs.is-boxed a,.hero.is-info .tabs.is-toggle a{color:#fff}.hero.is-info .tabs.is-boxed a:hover,.hero.is-info .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-info .tabs.is-boxed li.is-active a,.hero.is-info .tabs.is-boxed li.is-active a:hover,.hero.is-info .tabs.is-toggle li.is-active a,.hero.is-info .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#3273dc}.hero.is-info.is-bold{background-image:linear-gradient(141deg, #1577c6 0%, #3273dc 71%, #4366e5 100%)}@media screen and (max-width: 768px){.hero.is-info .nav-toggle span{background-color:#fff}.hero.is-info .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-info .nav-toggle.is-active span{background-color:#fff}.hero.is-info .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-success{background-color:#23d160;color:#fff}.hero.is-success a,.hero.is-success strong{color:inherit}.hero.is-success .title{color:#fff}.hero.is-success .subtitle{color:rgba(255,255,255,0.9)}.hero.is-success .subtitle a,.hero.is-success .subtitle strong{color:#fff}.hero.is-success .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-success .nav-menu{background-color:#23d160}}.hero.is-success a.nav-item,.hero.is-success .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-success a.nav-item:hover,.hero.is-success a.nav-item.is-active,.hero.is-success .nav-item a:not(.button):hover,.hero.is-success .nav-item a:not(.button).is-active{color:#fff}.hero.is-success .tabs a{color:#fff;opacity:0.9}.hero.is-success .tabs a:hover{opacity:1}.hero.is-success .tabs li.is-active a{opacity:1}.hero.is-success .tabs.is-boxed a,.hero.is-success .tabs.is-toggle a{color:#fff}.hero.is-success .tabs.is-boxed a:hover,.hero.is-success .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-success .tabs.is-boxed li.is-active a,.hero.is-success .tabs.is-boxed li.is-active a:hover,.hero.is-success .tabs.is-toggle li.is-active a,.hero.is-success .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#23d160}.hero.is-success.is-bold{background-image:linear-gradient(141deg, #12af2f 0%, #23d160 71%, #2ce28a 100%)}@media screen and (max-width: 768px){.hero.is-success .nav-toggle span{background-color:#fff}.hero.is-success .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-success .nav-toggle.is-active span{background-color:#fff}.hero.is-success .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.hero.is-warning a,.hero.is-warning strong{color:inherit}.hero.is-warning .title{color:rgba(0,0,0,0.7)}.hero.is-warning .subtitle{color:rgba(0,0,0,0.9)}.hero.is-warning .subtitle a,.hero.is-warning .subtitle strong{color:rgba(0,0,0,0.7)}.hero.is-warning .nav{box-shadow:0 1px 0 rgba(0,0,0,0.2)}@media screen and (max-width: 768px){.hero.is-warning .nav-menu{background-color:#ffdd57}}.hero.is-warning a.nav-item,.hero.is-warning .nav-item a:not(.button){color:rgba(0,0,0,0.7)}.hero.is-warning a.nav-item:hover,.hero.is-warning a.nav-item.is-active,.hero.is-warning .nav-item a:not(.button):hover,.hero.is-warning .nav-item a:not(.button).is-active{color:rgba(0,0,0,0.7)}.hero.is-warning .tabs a{color:rgba(0,0,0,0.7);opacity:0.9}.hero.is-warning .tabs a:hover{opacity:1}.hero.is-warning .tabs li.is-active a{opacity:1}.hero.is-warning .tabs.is-boxed a,.hero.is-warning .tabs.is-toggle a{color:rgba(0,0,0,0.7)}.hero.is-warning .tabs.is-boxed a:hover,.hero.is-warning .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-warning .tabs.is-boxed li.is-active a,.hero.is-warning .tabs.is-boxed li.is-active a:hover,.hero.is-warning .tabs.is-toggle li.is-active a,.hero.is-warning .tabs.is-toggle li.is-active a:hover{background-color:rgba(0,0,0,0.7);border-color:rgba(0,0,0,0.7);color:#ffdd57}.hero.is-warning.is-bold{background-image:linear-gradient(141deg, #ffaf24 0%, #ffdd57 71%, #fffa70 100%)}@media screen and (max-width: 768px){.hero.is-warning .nav-toggle span{background-color:rgba(0,0,0,0.7)}.hero.is-warning .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-warning .nav-toggle.is-active span{background-color:rgba(0,0,0,0.7)}.hero.is-warning .nav-menu .nav-item{border-top-color:rgba(0,0,0,0.2)}}.hero.is-danger{background-color:red;color:#fff}.hero.is-danger a,.hero.is-danger strong{color:inherit}.hero.is-danger .title{color:#fff}.hero.is-danger .subtitle{color:rgba(255,255,255,0.9)}.hero.is-danger .subtitle a,.hero.is-danger .subtitle strong{color:#fff}.hero.is-danger .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-danger .nav-menu{background-color:red}}.hero.is-danger a.nav-item,.hero.is-danger .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-danger a.nav-item:hover,.hero.is-danger a.nav-item.is-active,.hero.is-danger .nav-item a:not(.button):hover,.hero.is-danger .nav-item a:not(.button).is-active{color:#fff}.hero.is-danger .tabs a{color:#fff;opacity:0.9}.hero.is-danger .tabs a:hover{opacity:1}.hero.is-danger .tabs li.is-active a{opacity:1}.hero.is-danger .tabs.is-boxed a,.hero.is-danger .tabs.is-toggle a{color:#fff}.hero.is-danger .tabs.is-boxed a:hover,.hero.is-danger .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-danger .tabs.is-boxed li.is-active a,.hero.is-danger .tabs.is-boxed li.is-active a:hover,.hero.is-danger .tabs.is-toggle li.is-active a,.hero.is-danger .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:red}.hero.is-danger.is-bold{background-image:linear-gradient(141deg, #c02 0%, red 71%, #ff401a 100%)}@media screen and (max-width: 768px){.hero.is-danger .nav-toggle span{background-color:#fff}.hero.is-danger .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-danger .nav-toggle.is-active span{background-color:#fff}.hero.is-danger .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}@media screen and (min-width: 769px){.hero.is-medium .hero-body{padding-bottom:9rem;padding-top:9rem}}@media screen and (min-width: 769px){.hero.is-large .hero-body{padding-bottom:18rem;padding-top:18rem}}.hero.is-fullheight{min-height:100vh}.hero.is-fullheight .hero-body{align-items:center;display:flex}.hero.is-fullheight .hero-body>.container{flex-grow:1;flex-shrink:1}.section{background-color:#fff;padding:3rem 1.5rem}@media screen and (min-width: 1000px){.section.is-medium{padding:9rem 1.5rem}.section.is-large{padding:18rem 1.5rem}}.footer{background-color:#f5f5f5;padding:3rem 1.5rem 6rem}.header.is-fixed-top{z-index:1030;position:fixed;top:0;left:0;right:0}.has-fixed-nav{margin-top:50px}.section.is-small{padding:1rem 1.5rem}.nav-inverse{background:#182b73}.nav-inverse a.nav-item{color:#f2f2f2}.nav-inverse a.nav-item:hover{color:#d1d5e3}.nav-inverse a.nav-item.is-active{color:#fff}.nav-inverse a.nav-item.is-tab:hover{border-bottom-color:#fff}.nav-inverse a.nav-item.is-tab.is-active{border-bottom:3px solid #fff;color:#fff}.nav-slider-container .nav-slider{position:fixed;top:0;bottom:0;z-index:1040;overflow-y:auto;text-align:center;background:#182b73;color:#fff;left:-250px;width:250px;transition:left 0.5s}.nav-slider-container .nav-slider.is-active{left:0}.nav-slider-container .nav-slider .nav-item{cursor:pointer;display:block;padding-top:10px;padding-bottom:9px;background:rgba(255,255,255,0.1)}.nav-slider-container .nav-slider .nav-item.is-active{background:linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1) 5%)}.nav-slider-container .nav-slider .nav-item[open]>summary{margin-bottom:9px}.nav-slider-container .nav-slider .nav-item:not(:last-child){border-bottom:1px solid #fff}.nav-slider-container .nav-slider ~ .overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);visibility:hidden;opacity:0;z-index:1035;transition:opacity 0.75s}.nav-slider-container .nav-slider.is-active ~ .overlay{visibility:visible;opacity:1}#container>div:not(.visible){display:none}\n" +
    '</style>';

// Show the menu when clicking on the menu button
Array.from(document.querySelectorAll('.nav-slider-toggle'))
    .forEach(el => el.addEventListener('click', toggleMenu));

// Hide the menu when clicking the overlay
document.querySelector('.nav-slider-container .overlay').addEventListener('click', toggleMenu);

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

},{"libraries/hook":12}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){


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

},{"./alert":29,"./notify":31}],31:[function(require,module,exports){
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

},{"ui/polyfills/template":33}],35:[function(require,module,exports){
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

},{"util/":41}],36:[function(require,module,exports){
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

},{"assert":35,"date-now":37,"util":41}],37:[function(require,module,exports){
module.exports = now

function now() {
    return new Date().getTime()
}

},{}],38:[function(require,module,exports){
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

},{}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],41:[function(require,module,exports){
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

},{"./support/isBuffer":40,"_process":38,"inherits":39}]},{},[26])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvTWVzc2FnZUJvdEV4dGVuc2lvbi5qcyIsImRldi9ib3QvY2hlY2tHcm91cC5qcyIsImRldi9ib3QvaW5kZXguanMiLCJkZXYvYm90L21pZ3JhdGlvbi5qcyIsImRldi9ib3Qvc2VuZC5qcyIsImRldi9jb25zb2xlL2V4cG9ydHMuanMiLCJkZXYvY29uc29sZS9pbmRleC5qcyIsImRldi9leHRlbnNpb25zL2luZGV4LmpzIiwiZGV2L2xpYnJhcmllcy9hamF4LmpzIiwiZGV2L2xpYnJhcmllcy9iaGZhbnNhcGkuanMiLCJkZXYvbGlicmFyaWVzL2Jsb2NraGVhZHMuanMiLCJkZXYvbGlicmFyaWVzL2hvb2suanMiLCJkZXYvbGlicmFyaWVzL3N0b3JhZ2UuanMiLCJkZXYvbGlicmFyaWVzL3dvcmxkLmpzIiwiZGV2L21lc3NhZ2VzL2Fubm91bmNlbWVudHMvaW5kZXguanMiLCJkZXYvbWVzc2FnZXMvaGVscGVycy9idWlsZE1lc3NhZ2UuanMiLCJkZXYvbWVzc2FnZXMvaGVscGVycy9jaGVja0pvaW5zQW5kR3JvdXAuanMiLCJkZXYvbWVzc2FnZXMvaGVscGVycy9pbmRleC5qcyIsImRldi9tZXNzYWdlcy9oZWxwZXJzL3Nob3dTdW1tYXJ5LmpzIiwiZGV2L21lc3NhZ2VzL2luZGV4LmpzIiwiZGV2L21lc3NhZ2VzL2pvaW4vaW5kZXguanMiLCJkZXYvbWVzc2FnZXMvbGVhdmUvaW5kZXguanMiLCJkZXYvbWVzc2FnZXMvdHJpZ2dlci9pbmRleC5qcyIsImRldi9zZXR0aW5ncy9pbmRleC5qcyIsImRldi9zZXR0aW5ncy9wYWdlLmpzIiwiZGV2L3N0YXJ0LmpzIiwiZGV2L3VpL2luZGV4LmpzIiwiZGV2L3VpL2xheW91dC9pbmRleC5qcyIsImRldi91aS9ub3RpZmljYXRpb25zL2FsZXJ0LmpzIiwiZGV2L3VpL25vdGlmaWNhdGlvbnMvaW5kZXguanMiLCJkZXYvdWkvbm90aWZpY2F0aW9ucy9ub3RpZnkuanMiLCJkZXYvdWkvcG9seWZpbGxzL2RldGFpbHMuanMiLCJkZXYvdWkvcG9seWZpbGxzL3RlbXBsYXRlLmpzIiwiZGV2L3VpL3RlbXBsYXRlLmpzIiwibm9kZV9tb2R1bGVzL2Fzc2VydC9hc3NlcnQuanMiLCJub2RlX21vZHVsZXMvY29uc29sZS1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RhdGUtbm93L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3WUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMxZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiY29uc3QgYm90ID0gcmVxdWlyZSgnYm90Jyk7XHJcbmNvbnN0IGJvdF9jb25zb2xlID0gcmVxdWlyZSgnLi9jb25zb2xlJyk7XHJcbmNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IGFqYXggPSByZXF1aXJlKCdsaWJyYXJpZXMvYWpheCcpO1xyXG5jb25zdCBhcGkgPSByZXF1aXJlKCdsaWJyYXJpZXMvYmxvY2toZWFkcycpO1xyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuXHJcbi8vIEFycmF5IG9mIElEcyB0byBhdXRvbG9hZCBhdCB0aGUgbmV4dCBsYXVuY2guXHJcbnZhciBhdXRvbG9hZCA9IFtdO1xyXG52YXIgbG9hZGVkID0gW107XHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnbWJfZXh0ZW5zaW9ucyc7XHJcblxyXG5cclxuLyoqXHJcbiAqIFVzZWQgdG8gY3JlYXRlIGEgbmV3IGV4dGVuc2lvbi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHRlc3QgPSBNZXNzYWdlQm90RXh0ZW5zaW9uKCd0ZXN0Jyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lc3BhY2UgLSBTaG91bGQgYmUgdGhlIHNhbWUgYXMgeW91ciB2YXJpYWJsZSBuYW1lLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbdW5pbnN0YWxsID0gdW5kZWZpbmVkXSAtIE9wdGlvbmFsLCBzcGVjaWZ5IHRoZSB1bmluc3RhbGwgZnVuY3Rpb24gd2hpbGUgY3JlYXRpbmcgdGhlIGV4dGVuc2lvbiwgaW5zdGVhZCBvZiBsYXRlci4gSWYgc3BlY2lmaWVkIGhlcmUsIHRoaXMgd2lsbCBiZSBib3VuZCB0byB0aGUgZXh0ZW5zaW9uLlxyXG4gKiBAcmV0dXJuIHtNZXNzYWdlQm90RXh0ZW5zaW9ufSAtIFRoZSBleHRlbnNpb24gdmFyaWFibGUuXHJcbiAqL1xyXG5mdW5jdGlvbiBNZXNzYWdlQm90RXh0ZW5zaW9uKG5hbWVzcGFjZSwgdW5pbnN0YWxsKSB7XHJcbiAgICBsb2FkZWQucHVzaChuYW1lc3BhY2UpO1xyXG4gICAgaG9vay5maXJlKCdleHRlbnNpb24uaW5zdGFsbCcsIG5hbWVzcGFjZSk7XHJcblxyXG4gICAgdmFyIGV4dGVuc2lvbiA9IHtcclxuICAgICAgICBpZDogbmFtZXNwYWNlLFxyXG4gICAgICAgIGJvdCxcclxuICAgICAgICBjb25zb2xlOiBib3RfY29uc29sZSxcclxuICAgICAgICB1aSxcclxuICAgICAgICBzdG9yYWdlLFxyXG4gICAgICAgIGFqYXgsXHJcbiAgICAgICAgYXBpLFxyXG4gICAgICAgIHdvcmxkLFxyXG4gICAgICAgIGhvb2ssXHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0eXBlb2YgdW5pbnN0YWxsID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBleHRlbnNpb24udW5pbnN0YWxsID0gdW5pbnN0YWxsLmJpbmQoZXh0ZW5zaW9uKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFVzZWQgdG8gY2hhbmdlIHdoZXRoZXIgb3Igbm90IHRoZSBleHRlbnNpb24gd2lsbCBiZVxyXG4gICAgICogQXV0b21hdGljYWxseSBsb2FkZWQgdGhlIG5leHQgdGltZSB0aGUgYm90IGlzIGxhdW5jaGVkLlxyXG4gICAgICpcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiB2YXIgdGVzdCA9IE1lc3NhZ2VCb3RFeHRlbnNpb24oJ3Rlc3QnKTtcclxuICAgICAqIHRlc3Quc2V0QXV0b0xhdW5jaCh0cnVlKTtcclxuICAgICAqIEBwYXJhbSB7Ym9vbH0gc2hvdWxkQXV0b2xvYWRcclxuICAgICAqL1xyXG4gICAgZXh0ZW5zaW9uLnNldEF1dG9MYXVuY2ggPSBmdW5jdGlvbiBzZXRBdXRvTGF1bmNoKHNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgaWYgKCFhdXRvbG9hZC5pbmNsdWRlcyhuYW1lc3BhY2UpICYmIHNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgICAgIGF1dG9sb2FkLnB1c2gobmFtZXNwYWNlKTtcclxuICAgICAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgYXV0b2xvYWQsIGZhbHNlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKCFzaG91bGRBdXRvbG9hZCkge1xyXG4gICAgICAgICAgICBpZiAoYXV0b2xvYWQuaW5jbHVkZXMobmFtZXNwYWNlKSkge1xyXG4gICAgICAgICAgICAgICAgYXV0b2xvYWQuc3BsaWNlKGF1dG9sb2FkLmluZGV4T2YobmFtZXNwYWNlKSwgMSk7XHJcbiAgICAgICAgICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBhdXRvbG9hZCwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZXh0ZW5zaW9uO1xyXG59XHJcblxyXG4vKipcclxuICogVHJpZXMgdG8gbG9hZCB0aGUgcmVxdWVzdGVkIGV4dGVuc2lvbiBieSBJRC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAqL1xyXG5NZXNzYWdlQm90RXh0ZW5zaW9uLmluc3RhbGwgPSBmdW5jdGlvbiBpbnN0YWxsKGlkKSB7XHJcbiAgICBpZiAoIWxvYWRlZC5pbmNsdWRlcyhpZCkpIHtcclxuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcclxuICAgICAgICBlbC5zcmMgPSBgLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9leHRlbnNpb24vJHtpZH0vY29kZS9yYXdgO1xyXG4gICAgICAgIGVsLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XHJcbiAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVW5pbnN0YWxscyBhbiBleHRlbnNpb24uXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxyXG4gKi9cclxuTWVzc2FnZUJvdEV4dGVuc2lvbi51bmluc3RhbGwgPSBmdW5jdGlvbiB1bmluc3RhbGwoaWQpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2luZG93W2lkXS51bmluc3RhbGwoKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAvL05vdCBpbnN0YWxsZWQsIG9yIG5vIHVuaW5zdGFsbCBmdW5jdGlvbi5cclxuICAgIH1cclxuXHJcbiAgICB3aW5kb3dbaWRdID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIGlmIChhdXRvbG9hZC5pbmNsdWRlcyhpZCkpIHtcclxuICAgICAgICBhdXRvbG9hZC5zcGxpY2UoYXV0b2xvYWQuaW5kZXhPZihpZCksIDEpO1xyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGF1dG9sb2FkLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGxvYWRlZC5pbmNsdWRlcyhpZCkpIHtcclxuICAgICAgICBsb2FkZWQuc3BsaWNlKGxvYWRlZC5pbmRleE9mKGlkKSwgMSk7XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5maXJlKCdleHRlbnNpb24udW5pbnN0YWxsJywgaWQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVzZWQgdG8gY2hlY2sgaWYgYW4gZXh0ZW5zaW9uIGhhcyBiZWVuIGxvYWRlZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5NZXNzYWdlQm90RXh0ZW5zaW9uLmlzTG9hZGVkID0gZnVuY3Rpb24gaXNMb2FkZWQoaWQpIHtcclxuICAgIHJldHVybiBsb2FkZWQuaW5jbHVkZXMoaWQpO1xyXG59O1xyXG5cclxuLy8gTG9hZCBleHRlbnNpb25zIHRoYXQgc2V0IHRoZW1zZWx2ZXMgdG8gYXV0b2xvYWQgbGFzdCBsYXVuY2guXHJcbnN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdLCBmYWxzZSlcclxuICAgIC5mb3JFYWNoKE1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lc3NhZ2VCb3RFeHRlbnNpb247XHJcbiIsIi8qKlxyXG4gKiBAZmlsZSBEZXByaWNhdGVkLiBVc2Ugd29ybGQuaXNbR3JvdXBdIGluc3RlYWQuXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjaGVja0dyb3VwXHJcbn07XHJcblxyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNoZWNrIGlmIHVzZXJzIGFyZSBpbiBkZWZpbmVkIGdyb3Vwcy5cclxuICpcclxuICogQGRlcHJpY2F0ZWRcclxuICogQGV4YW1wbGVcclxuICogY2hlY2tHcm91cCgnYWRtaW4nLCAnU0VSVkVSJykgLy8gdHJ1ZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZ3JvdXAgdGhlIGdyb3VwIHRvIGNoZWNrXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSB1c2VyIHRvIGNoZWNrXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja0dyb3VwKGdyb3VwLCBuYW1lKSB7XHJcbiAgICBjb25zb2xlLndhcm4oJ2JvdC5jaGVja0dyb3VwIGlzIGRlcHJpY2F0ZWQuIFVzZSB3b3JsZC5pc0FkbWluLCB3b3JsZC5pc01vZCwgZXRjLiBpbnN0ZWFkJyk7XHJcblxyXG4gICAgbmFtZSA9IG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIHN3aXRjaCAoZ3JvdXAudG9Mb2NhbGVMb3dlckNhc2UoKSkge1xyXG4gICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1BsYXllcihuYW1lKTtcclxuICAgICAgICBjYXNlICdhZG1pbic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc0FkbWluKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ21vZCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc01vZChuYW1lKTtcclxuICAgICAgICBjYXNlICdzdGFmZic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1N0YWZmKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ293bmVyJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzT3duZXIobmFtZSk7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcbiIsImNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5cclxuY29uc3QgYm90ID0gT2JqZWN0LmFzc2lnbihcclxuICAgIG1vZHVsZS5leHBvcnRzLFxyXG4gICAgcmVxdWlyZSgnLi9zZW5kJyksXHJcbiAgICByZXF1aXJlKCcuL2NoZWNrR3JvdXAnKVxyXG4pO1xyXG5cclxuYm90LnZlcnNpb24gPSAnNi4xLjBhJztcclxuXHJcbi8qKlxyXG4gKiBAZGVwcmljYXRlZCBzaW5jZSA2LjEuMC4gVXNlIGV4LndvcmxkIGluc3RlYWQuXHJcbiAqL1xyXG5ib3Qud29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuXHJcbnN0b3JhZ2Uuc2V0KCdtYl92ZXJzaW9uJywgYm90LnZlcnNpb24pO1xyXG4iLCJmdW5jdGlvbiB1cGRhdGUoa2V5cywgb3BlcmF0b3IpIHtcclxuICAgIE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSkuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgb2Yga2V5cykge1xyXG4gICAgICAgICAgICBpZiAoaXRlbS5zdGFydHNXaXRoKGtleSkpIHtcclxuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGl0ZW0sIG9wZXJhdG9yKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGl0ZW0pKSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG4vL2pzaGludCAtVzA4NlxyXG4vL05vIGJyZWFrIHN0YXRlbWVudHMgYXMgd2Ugd2FudCB0byBleGVjdXRlIGFsbCB1cGRhdGVzIGFmdGVyIG1hdGNoZWQgdmVyc2lvbiB1bmxlc3Mgb3RoZXJ3aXNlIG5vdGVkLlxyXG5zd2l0Y2ggKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdtYl92ZXJzaW9uJykpIHtcclxuICAgIGNhc2UgbnVsbDpcclxuICAgICAgICBicmVhazsgLy9Ob3RoaW5nIHRvIG1pZ3JhdGVcclxuICAgIGNhc2UgJzUuMi4wJzpcclxuICAgIGNhc2UgJzUuMi4xJzpcclxuICAgICAgICAvL1dpdGggNi4wLCBuZXdsaW5lcyBhcmUgZGlyZWN0bHkgc3VwcG9ydGVkIGluIG1lc3NhZ2VzIGJ5IHRoZSBib3QuXHJcbiAgICAgICAgdXBkYXRlKFsnYW5ub3VuY2VtZW50QXJyJywgJ2pvaW5BcnInLCAnbGVhdmVBcnInLCAndHJpZ2dlckFyciddLCBmdW5jdGlvbihyYXcpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdyk7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtc2cubWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cubWVzc2FnZSA9IG1zZy5tZXNzYWdlLnJlcGxhY2UoL1xcXFxuL2csICdcXG4nKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXJzZWQpO1xyXG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByYXc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBicmVhazsgLy9OZXh0IGJ1Z2ZpeCBvbmx5IHJlbGF0ZXMgdG8gNi4wIGJvdC5cclxuICAgIGNhc2UgJzYuMC4wYSc6XHJcbiAgICBjYXNlICc2LjAuMCc6XHJcbiAgICAgICAgYWxlcnQoXCJEdWUgdG8gYSBidWcgaW4gdGhlIDYuMC4wIHZlcnNpb24gb2YgdGhlIGJvdCwgeW91ciBqb2luIGFuZCBsZWF2ZSBtZXNzYWdlcyBtYXkgYmUgc3dhcHBlZC4gU29ycnkhIFRoaXMgY2Fubm90IGJlIGZpeGVkIGF1dG9tYXRpY2FsbHkuIFRoaXMgbWVzc2FnZSB3aWxsIG5vdCBiZSBzaG93biBhZ2Fpbi5cIik7XHJcbiAgICAgICAgYnJlYWs7IC8vTmV4dCBidWdmaXggb25seSByZWxhdGVzIHRvIDYuMC4xIC8gNi4wLjIuXHJcbiAgICBjYXNlICc2LjAuMSc6XHJcbiAgICBjYXNlICc2LjAuMic6XHJcbiAgICAgICAgYWxlcnQoXCJEdWUgdG8gYSBidWcgaW4gNi4wLjEgLyA2LjAuMiwgZ3JvdXBzIG1heSBoYXZlIGJlZW4gbWl4ZWQgdXAgb24gSm9pbiwgTGVhdmUsIGFuZCBUcmlnZ2VyIG1lc3NhZ2VzLiBTb3JyeSEgVGhpcyBjYW5ub3QgYmUgZml4ZWQgYXV0b21hdGljYWxseSBpZiBpdCBvY2N1cmVkIG9uIHlvdXIgYm90LiBBbm5vdW5jZW1lbnRzIGhhdmUgYWxzbyBiZWVuIGZpeGVkLlwiKTtcclxuICAgIGNhc2UgJzYuMC4zJzpcclxuICAgIGNhc2UgJzYuMC40JzpcclxuICAgIGNhc2UgJzYuMC41JzpcclxuICAgIGNhc2UgJzYuMC42JzpcclxuICAgIGNhc2UgJzYuMS4wYSc6XHJcbiAgICAgICAgLy9Ob3JtYWxpemUgZ3JvdXBzIHRvIGxvd2VyIGNhc2UuXHJcbiAgICAgICAgdXBkYXRlKFsnam9pbkFycicsICdsZWF2ZUFycicsICd0cmlnZ2VyQXJyJ10sIGZ1bmN0aW9uKHJhdykge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHBhcnNlZCA9IEpTT04ucGFyc2UocmF3KTtcclxuICAgICAgICAgICAgICAgIHBhcnNlZC5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbXNnLmdyb3VwID0gbXNnLmdyb3VwLnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbXNnLm5vdF9ncm91cCA9IG1zZy5ub3RfZ3JvdXAudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHBhcnNlZCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByYXc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxufVxyXG4vL2pzaGludCArVzA4NlxyXG4iLCJ2YXIgYXBpID0gcmVxdWlyZSgnbGlicmFyaWVzL2Jsb2NraGVhZHMnKTtcclxudmFyIHNldHRpbmdzID0gcmVxdWlyZSgnc2V0dGluZ3MnKTtcclxuXHJcbnZhciBxdWV1ZSA9IFtdO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzZW5kLFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gcXVldWUgYSBtZXNzYWdlIHRvIGJlIHNlbnQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNlbmQoJ0hlbGxvIScpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBiZSBzZW50LlxyXG4gKi9cclxuZnVuY3Rpb24gc2VuZChtZXNzYWdlKSB7XHJcbiAgICBpZiAoc2V0dGluZ3Muc3BsaXRNZXNzYWdlcykge1xyXG4gICAgICAgIC8vRklYTUU6IElmIHRoZSBiYWNrc2xhc2ggYmVmb3JlIHRoZSB0b2tlbiBpcyBlc2NhcGVkIGJ5IGFub3RoZXIgYmFja3NsYXNoIHRoZSB0b2tlbiBzaG91bGQgc3RpbGwgc3BsaXQgdGhlIG1lc3NhZ2UuXHJcbiAgICAgICAgbGV0IHN0ciA9IG1lc3NhZ2Uuc3BsaXQoc2V0dGluZ3Muc3BsaXRUb2tlbik7XHJcbiAgICAgICAgbGV0IHRvU2VuZCA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgY3VyciA9IHN0cltpXTtcclxuICAgICAgICAgICAgaWYgKGN1cnJbY3Vyci5sZW5ndGggLSAxXSA9PSAnXFxcXCcgJiYgaSA8IHN0ci5sZW5ndGggKyAxKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyICs9IHNldHRpbmdzLnNwbGl0VG9rZW4gKyBzdHJbKytpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0b1NlbmQucHVzaChjdXJyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRvU2VuZC5mb3JFYWNoKG1zZyA9PiBxdWV1ZS5wdXNoKG1zZykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBxdWV1ZS5wdXNoKG1lc3NhZ2UpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogV2F0Y2hlcyB0aGUgcXVldWUgZm9yIG5ldyBtZXNzYWdlcyB0byBzZW5kIGFuZCBzZW5kcyB0aGVtIGFzIHNvb24gYXMgcG9zc2libGUuXHJcbiAqL1xyXG4oZnVuY3Rpb24gY2hlY2tRdWV1ZSgpIHtcclxuICAgIGlmICghcXVldWUubGVuZ3RoKSB7XHJcbiAgICAgICAgc2V0VGltZW91dChjaGVja1F1ZXVlLCA1MDApO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBhcGkuc2VuZChxdWV1ZS5zaGlmdCgpKVxyXG4gICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChjaGVja1F1ZXVlLCAxMDAwKTtcclxuICAgICAgICB9KTtcclxufSgpKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB3cml0ZSxcclxuICAgIGNsZWFyXHJcbn07XHJcblxyXG5mdW5jdGlvbiB3cml0ZShtc2csIG5hbWUgPSAnJywgbmFtZUNsYXNzID0gJycpIHtcclxuICAgIHZhciBtc2dFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgICBpZiAobmFtZUNsYXNzKSB7XHJcbiAgICAgICAgbXNnRWwuc2V0QXR0cmlidXRlKCdjbGFzcycsIG5hbWVDbGFzcyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIG5hbWVFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIG5hbWVFbC50ZXh0Q29udGVudCA9IG5hbWU7XHJcblxyXG4gICAgdmFyIGNvbnRlbnRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIGlmIChuYW1lKSB7XHJcbiAgICAgICAgY29udGVudEVsLnRleHRDb250ZW50ID0gYDogJHttc2d9YDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29udGVudEVsLnRleHRDb250ZW50ID0gbXNnO1xyXG4gICAgfVxyXG4gICAgbXNnRWwuYXBwZW5kQ2hpbGQobmFtZUVsKTtcclxuICAgIG1zZ0VsLmFwcGVuZENoaWxkKGNvbnRlbnRFbCk7XHJcblxyXG4gICAgdmFyIGNoYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSB1bCcpO1xyXG4gICAgY2hhdC5hcHBlbmRDaGlsZChtc2dFbCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsZWFyKCkge1xyXG4gICAgdmFyIGNoYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSB1bCcpO1xyXG4gICAgY2hhdC5pbm5lckhUTUwgPSAnJztcclxufVxyXG4iLCJjb25zdCBzZWxmID0gbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2V4cG9ydHMnKTtcclxuXHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5jb25zdCBzZW5kID0gcmVxdWlyZSgnYm90Jykuc2VuZDtcclxuY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5cclxuXHJcblxyXG4vLyBUT0RPOiBQYXJzZSB0aGVzZSBhbmQgcHJvdmlkZSBvcHRpb25zIHRvIHNob3cvaGlkZSBkaWZmZXJlbnQgb25lcy5cclxuaG9vay5vbignd29ybGQub3RoZXInLCBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICBzZWxmLndyaXRlKG1lc3NhZ2UsIHVuZGVmaW5lZCwgJ290aGVyJyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQubWVzc2FnZScsIGZ1bmN0aW9uKG5hbWUsIG1lc3NhZ2UpIHtcclxuICAgIGxldCBtc2dDbGFzcyA9ICdwbGF5ZXInO1xyXG4gICAgaWYgKHdvcmxkLmlzU3RhZmYobmFtZSkpIHtcclxuICAgICAgICBtc2dDbGFzcyA9ICdzdGFmZic7XHJcbiAgICAgICAgaWYgKHdvcmxkLmlzTW9kKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIG1zZ0NsYXNzICs9ICcgbW9kJztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvL0hhcyB0byBiZSBhZG1pblxyXG4gICAgICAgICAgICBtc2dDbGFzcyArPSAnIGFkbWluJztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykpIHtcclxuICAgICAgICBtc2dDbGFzcyArPSAnIGNvbW1hbmQnO1xyXG4gICAgfVxyXG4gICAgc2VsZi53cml0ZShtZXNzYWdlLCBuYW1lLCBtc2dDbGFzcyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQuc2VydmVyY2hhdCcsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgIHNlbGYud3JpdGUobWVzc2FnZSwgJ1NFUlZFUicsICdhZG1pbicpO1xyXG59KTtcclxuXHJcbmhvb2sub24oJ3dvcmxkLnNlbmQnLCBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykpIHtcclxuICAgICAgICBzZWxmLndyaXRlKG1lc3NhZ2UsICdTRVJWRVInLCAnYWRtaW4gY29tbWFuZCcpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vTWVzc2FnZSBoYW5kbGVyc1xyXG5ob29rLm9uKCd3b3JsZC5qb2luJywgZnVuY3Rpb24gaGFuZGxlUGxheWVySm9pbihuYW1lLCBpcCkge1xyXG4gICAgc2VsZi53cml0ZShgJHtuYW1lfSAoJHtpcH0pIGhhcyBqb2luZWQgdGhlIHNlcnZlcmAsICdTRVJWRVInLCAnam9pbiB3b3JsZCBhZG1pbicpO1xyXG59KTtcclxuXHJcbmhvb2sub24oJ3dvcmxkLmxlYXZlJywgZnVuY3Rpb24gaGFuZGxlUGxheWVyTGVhdmUobmFtZSkge1xyXG4gICAgc2VsZi53cml0ZShgJHtuYW1lfSBoYXMgbGVmdCB0aGUgc2VydmVyYCwgJ1NFUlZFUicsIGBsZWF2ZSB3b3JsZCBhZG1pbmApO1xyXG59KTtcclxuXHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdDb25zb2xlJyk7XHJcbi8vIE9yZGVyIGlzIGltcG9ydGFudCBoZXJlLlxyXG5cclxudGFiLmlubmVySFRNTCA9ICc8c3R5bGU+JyArXHJcbiAgICBcIiNtYl9jb25zb2xle2hlaWdodDpjYWxjKDEwMCUgLSA1MHB4KX0jbWJfY29uc29sZSAubW9kPnNwYW46Zmlyc3QtY2hpbGR7Y29sb3I6IzA1ZjUyOX0jbWJfY29uc29sZSAuYWRtaW4+c3BhbjpmaXJzdC1jaGlsZHtjb2xvcjojMmIyNmJkfSNtYl9jb25zb2xlIC5jaGF0e21hcmdpbjoxZW07bWF4LWhlaWdodDpjYWxjKDEwMHZoIC0gM2VtIC0gNTVweCk7d2lkdGg6Y2FsYygxMDB2dyAtIDJlbSk7b3ZlcmZsb3cteTphdXRvfSNtYl9jb25zb2xlIC5jaGF0LWNvbnRyb2x7cG9zaXRpb246Zml4ZWQ7Ym90dG9tOjA7d2lkdGg6MTAwdnd9I21iX2NvbnNvbGUgLmNoYXQtY29udHJvbCAuY29udHJvbHttYXJnaW46MWVtfVxcblwiICtcclxuICAgICc8L3N0eWxlPicgK1xyXG4gICAgXCI8ZGl2IGlkPVxcXCJtYl9jb25zb2xlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY2hhdFxcXCI+XFxyXFxuICAgICAgICA8dWw+PC91bD5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNoYXQtY29udHJvbFxcXCI+XFxyXFxuICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjb250cm9sIGhhcy1hZGRvbnNcXFwiPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJ0ZXh0XFxcIiBjbGFzcz1cXFwiaW5wdXQgaXMtZXhwYW5kZWRcXFwiLz5cXHJcXG4gICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVxcXCJpbnB1dCBidXR0b24gaXMtcHJpbWFyeVxcXCI+U0VORDwvYnV0dG9uPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxuXHJcbi8vIEF1dG8gc2Nyb2xsIHdoZW4gbmV3IG1lc3NhZ2VzIGFyZSBhZGRlZCB0byB0aGUgcGFnZSwgdW5sZXNzIHRoZSBvd25lciBpcyByZWFkaW5nIG9sZCBjaGF0LlxyXG4obmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gc2hvd05ld0NoYXQoKSB7XHJcbiAgICBsZXQgY29udGFpbmVyID0gdGFiLnF1ZXJ5U2VsZWN0b3IoJ3VsJyk7XHJcbiAgICBsZXQgbGFzdExpbmUgPSB0YWIucXVlcnlTZWxlY3RvcignbGk6bGFzdC1jaGlsZCcpO1xyXG5cclxuICAgIGlmICghY29udGFpbmVyIHx8ICFsYXN0TGluZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY29udGFpbmVyLnNjcm9sbEhlaWdodCAtIGNvbnRhaW5lci5jbGllbnRIZWlnaHQgLSBjb250YWluZXIuc2Nyb2xsVG9wIDw9IGxhc3RMaW5lLmNsaWVudEhlaWdodCAqIDIpIHtcclxuICAgICAgICBsYXN0TGluZS5zY3JvbGxJbnRvVmlldyhmYWxzZSk7XHJcbiAgICB9XHJcbn0pKS5vYnNlcnZlKHRhYi5xdWVyeVNlbGVjdG9yKCcuY2hhdCcpLCB7Y2hpbGRMaXN0OiB0cnVlfSk7XHJcblxyXG5cclxuLy8gUmVtb3ZlIG9sZCBjaGF0IHRvIHJlZHVjZSBtZW1vcnkgdXNhZ2VcclxuKG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIHJlbW92ZU9sZENoYXQoKSB7XHJcbiAgICB2YXIgY2hhdCA9IHRhYi5xdWVyeVNlbGVjdG9yKCd1bCcpO1xyXG5cclxuICAgIHdoaWxlIChjaGF0LmNoaWxkcmVuLmxlbmd0aCA+IDUwMCkge1xyXG4gICAgICAgIGNoYXQuY2hpbGRyZW5bMF0ucmVtb3ZlKCk7XHJcbiAgICB9XHJcbn0pKS5vYnNlcnZlKHRhYi5xdWVyeVNlbGVjdG9yKCcuY2hhdCcpLCB7Y2hpbGRMaXN0OiB0cnVlfSk7XHJcblxyXG4vLyBMaXN0ZW4gZm9yIHRoZSB1c2VyIHRvIHNlbmQgbWVzc2FnZXNcclxuZnVuY3Rpb24gdXNlclNlbmQoKSB7XHJcbiAgICB2YXIgaW5wdXQgPSB0YWIucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcclxuICAgIGhvb2suZmlyZSgnY29uc29sZS5zZW5kJywgaW5wdXQudmFsdWUpO1xyXG4gICAgc2VuZChpbnB1dC52YWx1ZSk7XHJcbiAgICBpbnB1dC52YWx1ZSA9ICcnO1xyXG4gICAgaW5wdXQuZm9jdXMoKTtcclxufVxyXG5cclxudGFiLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0JykuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICBpZiAoZXZlbnQua2V5ID09IFwiRW50ZXJcIiB8fCBldmVudC5rZXlDb2RlID09IDEzKSB7XHJcbiAgICAgICAgdXNlclNlbmQoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG50YWIucXVlcnlTZWxlY3RvcignYnV0dG9uJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB1c2VyU2VuZCk7XHJcbiIsImNvbnN0IGJoZmFuc2FwaSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9iaGZhbnNhcGknKTtcclxuY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgTWVzc2FnZUJvdEV4dGVuc2lvbiA9IHJlcXVpcmUoJ01lc3NhZ2VCb3RFeHRlbnNpb24nKTtcclxuXHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdFeHRlbnNpb25zJyk7XHJcbnRhYi5pbm5lckhUTUwgPSAnPHN0eWxlPicgK1xyXG4gICAgXCJAa2V5ZnJhbWVzIHNwaW5Bcm91bmR7ZnJvbXt0cmFuc2Zvcm06cm90YXRlKDBkZWcpfXRve3RyYW5zZm9ybTpyb3RhdGUoMzU5ZGVnKX19I2V4dHN7Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMH1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7I2V4dHMgLmNhcmQtY29udGVudHtoZWlnaHQ6MTA1cHh9fVxcblwiICtcclxuICAgICc8L3N0eWxlPicgK1xyXG4gICAgXCI8dGVtcGxhdGUgaWQ9XFxcImV4dFRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY29sdW1uIGlzLW9uZS10aGlyZC1kZXNrdG9wIGlzLWhhbGYtdGFibGV0XFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImNhcmRcXFwiPlxcclxcbiAgICAgICAgICAgIDxoZWFkZXIgY2xhc3M9XFxcImNhcmQtaGVhZGVyXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHAgY2xhc3M9XFxcImNhcmQtaGVhZGVyLXRpdGxlXFxcIj48L3A+XFxyXFxuICAgICAgICAgICAgPC9oZWFkZXI+XFxyXFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiY2FyZC1jb250ZW50XFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcImNvbnRlbnRcXFwiPjwvc3Bhbj5cXHJcXG4gICAgICAgICAgICA8L2Rpdj5cXHJcXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJjYXJkLWZvb3RlclxcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxhIGNsYXNzPVxcXCJjYXJkLWZvb3Rlci1pdGVtXFxcIj5JbnN0YWxsPC9hPlxcclxcbiAgICAgICAgICAgIDwvZGl2PlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvdGVtcGxhdGU+XFxyXFxuPGRpdiBpZD1cXFwibWJfZXh0ZW5zaW9uc1xcXCIgY2xhc3M9XFxcImNvbnRhaW5lciBpcy1mbHVpZFxcXCI+XFxyXFxuICAgIDxzZWN0aW9uIGNsYXNzPVxcXCJzZWN0aW9uIGlzLXNtYWxsXFxcIj5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJidXR0b24gaXMtcHJpbWFyeSBpcy1wdWxsZWQtcmlnaHRcXFwiPkxvYWQgQnkgSUQvVVJMPC9zcGFuPlxcclxcbiAgICAgICAgPGgzPkV4dGVuc2lvbnMgY2FuIGluY3JlYXNlIHRoZSBmdW5jdGlvbmFsaXR5IG9mIHRoZSBib3QuPC9oMz5cXHJcXG4gICAgICAgIDxzcGFuPkludGVyZXN0ZWQgaW4gY3JlYXRpbmcgb25lPyA8YSBocmVmPVxcXCJodHRwczovL2dpdGh1Yi5jb20vQmlibGlvZmlsZS9CbG9ja2hlYWRzLU1lc3NhZ2VCb3Qvd2lraS8yLi1EZXZlbG9wbWVudDotU3RhcnQtSGVyZVxcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlN0YXJ0IGhlcmUuPC9hPjwvc3Bhbj5cXHJcXG4gICAgPC9zZWN0aW9uPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJleHRzXFxcIiBjbGFzcz1cXFwiY29sdW1ucyBpcy1tdWx0aWxpbmVcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxuLy9DcmVhdGUgdGhlIGV4dGVuc2lvbiBzdG9yZSBwYWdlXHJcbmJoZmFuc2FwaS5nZXRTdG9yZSgpLnRoZW4ocmVzcCA9PiB7XHJcbiAgICBpZiAocmVzcC5zdGF0dXMgIT0gJ29rJykge1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdleHRzJykuaW5uZXJIVE1MICs9IHJlc3AubWVzc2FnZTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IocmVzcC5tZXNzYWdlKTtcclxuICAgIH1cclxuICAgIHJlc3AuZXh0ZW5zaW9ucy5mb3JFYWNoKGV4dGVuc2lvbiA9PiB7XHJcbiAgICAgICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjZXh0VGVtcGxhdGUnLCAnI2V4dHMnLCBbXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJy5jYXJkLWhlYWRlci10aXRsZScsIHRleHQ6IGV4dGVuc2lvbi50aXRsZX0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJy5jb250ZW50JywgaHRtbDogZXh0ZW5zaW9uLnNuaXBwZXR9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogJy5jYXJkLWZvb3Rlci1pdGVtJyxcclxuICAgICAgICAgICAgICAgIHRleHQ6IE1lc3NhZ2VCb3RFeHRlbnNpb24uaXNMb2FkZWQoZXh0ZW5zaW9uLmlkKSA/ICdSZW1vdmUnIDogJ0luc3RhbGwnLFxyXG4gICAgICAgICAgICAgICAgJ2RhdGEtaWQnOiBleHRlbnNpb24uaWRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcbn0pLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcik7XHJcblxyXG4vLyBJbnN0YWxsIC8gdW5pbnN0YWxsIGV4dGVuc2lvbnNcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2V4dHMnKVxyXG4gICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gZXh0QWN0aW9ucyhlKSB7XHJcbiAgICAgICAgdmFyIGVsID0gZS50YXJnZXQ7XHJcbiAgICAgICAgdmFyIGlkID0gZWwuZGF0YXNldC5pZDtcclxuXHJcbiAgICAgICAgaWYgKCFpZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZWwudGV4dENvbnRlbnQgPT0gJ0luc3RhbGwnKSB7XHJcbiAgICAgICAgICAgIE1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbChpZCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgTWVzc2FnZUJvdEV4dGVuc2lvbi51bmluc3RhbGwoaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuXHJcbmhvb2sub24oJ2V4dGVuc2lvbi5pbnN0YWxsJywgZnVuY3Rpb24oaWQpIHtcclxuICAgIC8vIFNob3cgcmVtb3ZlIHRvIGxldCB1c2VycyByZW1vdmUgZXh0ZW5zaW9uc1xyXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNtYl9leHRlbnNpb25zIFtkYXRhLWlkPVwiJHtpZH1cIl1gKTtcclxuICAgIGlmIChidXR0b24pIHtcclxuICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnUmVtb3ZlJztcclxuICAgIH1cclxufSk7XHJcblxyXG5ob29rLm9uKCdleHRlbnNpb24udW5pbnN0YWxsJywgZnVuY3Rpb24oaWQpIHtcclxuICAgIC8vIFNob3cgcmVtb3ZlZCBmb3Igc3RvcmUgaW5zdGFsbCBidXR0b25cclxuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbWJfZXh0ZW5zaW9ucyBbZGF0YS1pZD1cIiR7aWR9XCJdYCk7XHJcbiAgICBpZiAoYnV0dG9uKSB7XHJcbiAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gJ1JlbW92ZWQnO1xyXG4gICAgICAgIGJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICdJbnN0YWxsJztcclxuICAgICAgICAgICAgYnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICAgICAgfSwgMzAwMCk7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCIvL1RPRE86IFVzZSBmZXRjaFxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gR0VUIGEgcGFnZS4gUGFzc2VzIHRoZSByZXNwb25zZSBvZiB0aGUgWEhSIGluIHRoZSByZXNvbHZlIHByb21pc2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vc2VuZHMgYSBHRVQgcmVxdWVzdCB0byAvc29tZS91cmwucGhwP2E9dGVzdFxyXG4gKiBnZXQoJy9zb21lL3VybC5waHAnLCB7YTogJ3Rlc3QnfSkudGhlbihjb25zb2xlLmxvZylcclxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zU3RyXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXQodXJsID0gJy8nLCBwYXJhbXMgPSB7fSkge1xyXG4gICAgaWYgKE9iamVjdC5rZXlzKHBhcmFtcykubGVuZ3RoKSB7XHJcbiAgICAgICAgdmFyIGFkZGl0aW9uID0gdXJsU3RyaW5naWZ5KHBhcmFtcyk7XHJcbiAgICAgICAgaWYgKHVybC5pbmNsdWRlcygnPycpKSB7XHJcbiAgICAgICAgICAgIHVybCArPSBgJiR7YWRkaXRpb259YDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB1cmwgKz0gYD8ke2FkZGl0aW9ufWA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB4aHIoJ0dFVCcsIHVybCwge30pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYSBKU09OIG9iamVjdCBpbiB0aGUgcHJvbWlzZSByZXNvbHZlIG1ldGhvZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW1PYmpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldEpTT04odXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4gZ2V0KHVybCwgcGFyYW1PYmopLnRoZW4oSlNPTi5wYXJzZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gbWFrZSBhIHBvc3QgcmVxdWVzdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbU9ialxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gcG9zdCh1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiB4aHIoJ1BPU1QnLCB1cmwsIHBhcmFtT2JqKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBmZXRjaCBKU09OIGZyb20gYSBwYWdlIHRocm91Z2ggcG9zdC5cclxuICpcclxuICogQHBhcmFtIHN0cmluZyB1cmxcclxuICogQHBhcmFtIHN0cmluZyBwYXJhbU9ialxyXG4gKiBAcmV0dXJuIFByb21pc2VcclxuICovXHJcbmZ1bmN0aW9uIHBvc3RKU09OKHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIHBvc3QodXJsLCBwYXJhbU9iaikudGhlbihKU09OLnBhcnNlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4qIEhlbHBlciBmdW5jdGlvbiB0byBtYWtlIFhIUiByZXF1ZXN0cywgaWYgcG9zc2libGUgdXNlIHRoZSBnZXQgYW5kIHBvc3QgZnVuY3Rpb25zIGluc3RlYWQuXHJcbipcclxuKiBAZGVwcmljYXRlZCBzaW5jZSB2ZXJzaW9uIDYuMVxyXG4qIEBwYXJhbSBzdHJpbmcgcHJvdG9jb2xcclxuKiBAcGFyYW0gc3RyaW5nIHVybFxyXG4qIEBwYXJhbSBvYmplY3QgcGFyYW1PYmogLS0gV0FSTklORy4gT25seSBhY2NlcHRzIHNoYWxsb3cgb2JqZWN0cy5cclxuKiBAcmV0dXJuIFByb21pc2VcclxuKi9cclxuZnVuY3Rpb24geGhyKHByb3RvY29sLCB1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHZhciBwYXJhbVN0ciA9IHVybFN0cmluZ2lmeShwYXJhbU9iaik7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgdmFyIHJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgICAgIHJlcS5vcGVuKHByb3RvY29sLCB1cmwpO1xyXG4gICAgICAgIHJlcS5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0Jyk7XHJcbiAgICAgICAgaWYgKHByb3RvY29sID09ICdQT1NUJykge1xyXG4gICAgICAgICAgICByZXEuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVxLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAocmVxLnN0YXR1cyA9PSAyMDApIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVxLnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVxLnN0YXR1c1RleHQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgLy8gSGFuZGxlIG5ldHdvcmsgZXJyb3JzXHJcbiAgICAgICAgcmVxLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmVqZWN0KEVycm9yKFwiTmV0d29yayBFcnJvclwiKSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAocGFyYW1TdHIpIHtcclxuICAgICAgICAgICAgcmVxLnNlbmQocGFyYW1TdHIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlcS5zZW5kKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdXNlZCB0byBzdHJpbmdpZnkgdXJsIHBhcmFtZXRlcnNcclxuICovXHJcbmZ1bmN0aW9uIHVybFN0cmluZ2lmeShvYmopIHtcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopXHJcbiAgICAubWFwKGsgPT4gYCR7ZW5jb2RlVVJJQ29tcG9uZW50KGspfT0ke2VuY29kZVVSSUNvbXBvbmVudChvYmpba10pfWApXHJcbiAgICAuam9pbignJicpO1xyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7eGhyLCBnZXQsIGdldEpTT04sIHBvc3QsIHBvc3RKU09OfTtcclxuIiwiLyoqXHJcbiAqIEBmaWxlIENvbnRhaW5zIGZ1bmN0aW9ucyB0byBpbnRlcmFjdCB3aXRoIGJsb2NraGVhZHNmYW5zLmNvbSAtIGNhbm5vdCBiZSB1c2VkIGJ5IGV4dGVuc2lvbnMuXHJcbiAqL1xyXG5cclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IGFqYXggPSByZXF1aXJlKCdsaWJyYXJpZXMvYWpheCcpO1xyXG5cclxuY29uc3QgQVBJX1VSTFMgPSB7XHJcbiAgICBTVE9SRTogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvYXBpL2V4dGVuc2lvbi9zdG9yZScsXHJcbiAgICBOQU1FOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9hcGkvZXh0ZW5zaW9uL25hbWUnLFxyXG4gICAgRVJST1I6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2FwaS9lcnJvcicsXHJcbn07XHJcblxyXG52YXIgY2FjaGUgPSB7XHJcbiAgICBuYW1lczogbmV3IE1hcCgpLFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVzZWQgdG8gZ2V0IHB1YmxpYyBleHRlbnNpb25zXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldFN0b3JlKCkudGhlbihzdG9yZSA9PiBjb25zb2xlLmxvZyhzdG9yZSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byB1c2UgdGhlIGNhY2hlZCByZXNwb25zZSBzaG91bGQgYmUgY2xlYXJlZC5cclxuICogQHJldHVybiB7UHJvbWlzZX0gcmVzb2x2ZXMgd2l0aCB0aGUgcmVzcG9uc2VcclxuICovXHJcbmZ1bmN0aW9uIGdldFN0b3JlKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldFN0b3JlKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0U3RvcmUgPSBhamF4LmdldEpTT04oQVBJX1VSTFMuU1RPUkUpXHJcbiAgICAgICAgICAgIC50aGVuKHN0b3JlID0+IHtcclxuICAgICAgICAgICAgICAgIC8vQnVpbGQgdGhlIGluaXRpYWwgbmFtZXMgbWFwXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmUuc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZXggb2Ygc3RvcmUuZXh0ZW5zaW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLm5hbWVzLnNldChleC5pZCwgZXgudGl0bGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0U3RvcmU7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbmFtZSBvZiB0aGUgcHJvdmlkZWQgZXh0ZW5zaW9uIElELlxyXG4gKiBJZiB0aGUgZXh0ZW5zaW9uIHdhcyBub3QgZm91bmQsIHJlc29sdmVzIHdpdGggdGhlIG9yaWdpbmFsIHBhc3NlZCBJRC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0RXh0ZW5zaW9uTmFtZSgndGVzdCcpLnRoZW4obmFtZSA9PiBjb25zb2xlLmxvZyhuYW1lKSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCB0aGUgaWQgdG8gc2VhcmNoIGZvci5cclxuICogQHJldHVybiB7UHJvbWlzZX0gcmVzb2x2ZXMgd2l0aCB0aGUgZXh0ZW5zaW9uIG5hbWUuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRFeHRlbnNpb25OYW1lKGlkKSB7XHJcbiAgICBpZiAoY2FjaGUubmFtZXMuaGFzKGlkKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGUubmFtZXMuZ2V0KGlkKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFqYXgucG9zdEpTT04oQVBJX1VSTFMuTkFNRSwge2lkfSkudGhlbigoe25hbWV9KSA9PiB7XHJcbiAgICAgICAgY2FjaGUubmFtZXMuc2V0KGlkLCBuYW1lKTtcclxuICAgICAgICByZXR1cm4gbmFtZTtcclxuICAgIH0sIGVyciA9PiB7XHJcbiAgICAgICAgcmVwb3J0RXJyb3IoZXJyKTtcclxuICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXBvcnRzIGFuIGVycm9yIHNvIHRoYXQgaXQgY2FuIGJlIHJldmlld2VkIGFuZCBmaXhlZCBieSBleHRlbnNpb24gb3IgYm90IGRldmVsb3BlcnMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHJlcG9ydEVycm9yKEVycm9yKFwiUmVwb3J0IG1lXCIpKTtcclxuICogQHBhcmFtIHtFcnJvcn0gZXJyIHRoZSBlcnJvciB0byByZXBvcnRcclxuICovXHJcbmZ1bmN0aW9uIHJlcG9ydEVycm9yKGVycikge1xyXG4gICAgYWpheC5wb3N0SlNPTihBUElfVVJMUy5FUlJPUiwge1xyXG4gICAgICAgICAgICBlcnJvcl90ZXh0OiBlcnIubWVzc2FnZSxcclxuICAgICAgICAgICAgZXJyb3JfZmlsZTogZXJyLmZpbGVuYW1lLFxyXG4gICAgICAgICAgICBlcnJvcl9yb3c6IGVyci5saW5lbm8gfHwgMCxcclxuICAgICAgICAgICAgZXJyb3JfY29sdW1uOiBlcnIuY29sbm8gfHwgMCxcclxuICAgICAgICAgICAgZXJyb3Jfc3RhY2s6IGVyci5zdGFjayB8fCAnJyxcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKChyZXNwKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyZXNwLnN0YXR1cyA9PSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICBob29rLmZpcmUoJ2Vycm9yX3JlcG9ydCcsICdTb21ldGhpbmcgd2VudCB3cm9uZywgaXQgaGFzIGJlZW4gcmVwb3J0ZWQuJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBob29rLmZpcmUoJ2Vycm9yX3JlcG9ydCcsIGBFcnJvciByZXBvcnRpbmcgZXhjZXB0aW9uOiAke3Jlc3AubWVzc2FnZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGdldFN0b3JlLFxyXG4gICAgZ2V0RXh0ZW5zaW9uTmFtZSxcclxuICAgIHJlcG9ydEVycm9yLFxyXG59O1xyXG4iLCJ2YXIgYWpheCA9IHJlcXVpcmUoJy4vYWpheCcpO1xyXG52YXIgaG9vayA9IHJlcXVpcmUoJy4vaG9vaycpO1xyXG52YXIgYmhmYW5zYXBpID0gcmVxdWlyZSgnLi9iaGZhbnNhcGknKTtcclxuXHJcbmNvbnN0IHdvcmxkSWQgPSB3aW5kb3cud29ybGRJZDtcclxudmFyIGNhY2hlID0ge1xyXG4gICAgZmlyc3RJZDogMCxcclxufTtcclxuXHJcbi8vIFVzZWQgdG8gcGFyc2UgbWVzc2FnZXMgbW9yZSBhY2N1cmF0ZWx5XHJcbnZhciB3b3JsZCA9IHtcclxuICAgIG5hbWU6ICcnLFxyXG4gICAgb25saW5lOiBbXVxyXG59O1xyXG5nZXRPbmxpbmVQbGF5ZXJzKClcclxuICAgIC50aGVuKHBsYXllcnMgPT4gd29ybGQucGxheWVycyA9IFsuLi5uZXcgU2V0KHBsYXllcnMuY29uY2F0KHdvcmxkLnBsYXllcnMpKV0pO1xyXG5cclxuZ2V0V29ybGROYW1lKClcclxuICAgIC50aGVuKG5hbWUgPT4gd29ybGQubmFtZSA9IG5hbWUpO1xyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgd29ybGRTdGFydGVkLFxyXG4gICAgZ2V0TG9ncyxcclxuICAgIGdldExpc3RzLFxyXG4gICAgZ2V0SG9tZXBhZ2UsXHJcbiAgICBnZXRPbmxpbmVQbGF5ZXJzLFxyXG4gICAgZ2V0T3duZXJOYW1lLFxyXG4gICAgZ2V0V29ybGROYW1lLFxyXG4gICAgc2VuZCxcclxufTtcclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgdGhlIHdvcmxkIGlmIG5lY2Nlc3NhcnksIHJlamVjdHMgaWYgdGhlIHdvcmxkIHRha2VzIHRvbyBsb25nIHRvIHN0YXJ0IG9yIGlzIHVuYXZhaWxpYmxlXHJcbiAqIFJlZmFjdG9yaW5nIHdlbGNvbWUuIFRoaXMgc2VlbXMgb3Zlcmx5IHB5cmFtaWQgbGlrZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogd29ybGRTdGFydGVkKCkudGhlbigoKSA9PiBjb25zb2xlLmxvZygnc3RhcnRlZCEnKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlY2hlY2sgaWYgdGhlIHdvcmxkIGlzIHN0YXJ0ZWQuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiB3b3JsZFN0YXJ0ZWQocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUud29ybGRTdGFydGVkKSB7XHJcbiAgICAgICAgY2FjaGUud29ybGRTdGFydGVkID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICB2YXIgZmFpbHMgPSAwO1xyXG4gICAgICAgICAgICAoZnVuY3Rpb24gY2hlY2soKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDb3VsZCB0aGlzIGJlIG1vcmUgc2ltcGxpZmllZD9cclxuICAgICAgICAgICAgICAgIGFqYXgucG9zdEpTT04oJy9hcGknLCB7IGNvbW1hbmQ6ICdzdGF0dXMnLCB3b3JsZElkIH0pLnRoZW4ocmVzcG9uc2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAocmVzcG9uc2Uud29ybGRTdGF0dXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnb25saW5lJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ29mZmxpbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWpheC5wb3N0SlNPTignL2FwaScsIHsgY29tbWFuZDogJ3N0YXJ0Jywgd29ybGRJZCB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGNoZWNrLCBjaGVjayk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndW5hdmFpbGlibGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ1dvcmxkIHVuYXZhaWxpYmxlLicpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RhcnR1cCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3NodXRkb3duJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RvcmluZyc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrLCAzMDAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgrK2ZhaWxzID4gMTApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignV29ybGQgdG9vayB0b28gbG9uZyB0byBzdGFydC4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdVbmtub3duIHJlc3BvbnNlLicpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChiaGZhbnNhcGkucmVwb3J0RXJyb3IpO1xyXG4gICAgICAgICAgICB9KCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS53b3JsZFN0YXJ0ZWQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCBhbiBhcnJheSBvZiB0aGUgbG9nJ3MgbGluZXMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldExvZ3MoKS50aGVuKGxpbmVzID0+IGNvbnNvbGUubG9nKGxpbmVzWzBdKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZG93bmxvYWQgdGhlIGxvZ3NcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldExvZ3MocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0TG9ncykge1xyXG4gICAgICAgIGNhY2hlLmdldExvZ3MgPSB3b3JsZFN0YXJ0ZWQoKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBhamF4LmdldChgL3dvcmxkcy9sb2dzLyR7d29ybGRJZH1gKSlcclxuICAgICAgICAgICAgLnRoZW4obG9nID0+IGxvZy5zcGxpdCgnXFxuJykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRMb2dzO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYSBsaXN0IG9mIGFkbWlucywgbW9kcywgc3RhZmYgKGFkbWlucyArIG1vZHMpLCB3aGl0ZWxpc3QsIGFuZCBibGFja2xpc3QuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldExpc3RzKCkudGhlbihsaXN0cyA9PiBjb25zb2xlLmxvZyhsaXN0cy5hZG1pbikpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWZldGNoIHRoZSBsaXN0cy5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldExpc3RzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldExpc3RzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0TGlzdHMgPSB3b3JsZFN0YXJ0ZWQoKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBhamF4LmdldChgL3dvcmxkcy9saXN0cy8ke3dvcmxkSWR9YCkpXHJcbiAgICAgICAgICAgIC50aGVuKGh0bWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0TGlzdChuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBkb2MucXVlcnlTZWxlY3RvcihgdGV4dGFyZWFbbmFtZT0ke25hbWV9XWApXHJcbiAgICAgICAgICAgICAgICAgICAgLnZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgLnRvTG9jYWxlVXBwZXJDYXNlKClcclxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJ1xcbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbLi4ubmV3IFNldChsaXN0KV07IC8vUmVtb3ZlIGR1cGxpY2F0ZXNcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbGlzdHMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWRtaW46IGdldExpc3QoJ2FkbWlucycpLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZDogZ2V0TGlzdCgnbW9kbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgICAgIHdoaXRlOiBnZXRMaXN0KCd3aGl0ZWxpc3QnKSxcclxuICAgICAgICAgICAgICAgICAgICBibGFjazogZ2V0TGlzdCgnYmxhY2tsaXN0JyksXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgbGlzdHMubW9kID0gbGlzdHMubW9kLmZpbHRlcihuYW1lID0+ICFsaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lKSk7XHJcbiAgICAgICAgICAgICAgICBsaXN0cy5zdGFmZiA9IGxpc3RzLmFkbWluLmNvbmNhdChsaXN0cy5tb2QpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0cztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldExpc3RzO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIGhvbWVwYWdlIG9mIHRoZSBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IGNvbnNvbGUubG9nKGh0bWwuc3Vic3RyaW5nKDAsIDEwMCkpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmZXRjaCB0aGUgcGFnZS5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldEhvbWVwYWdlKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldEhvbWVwYWdlKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0SG9tZXBhZ2UgPSBhamF4LmdldChgL3dvcmxkcy8ke3dvcmxkSWR9YClcclxuICAgICAgICAgICAgLmNhdGNoKCgpID0+IGdldEhvbWVwYWdlKHRydWUpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0SG9tZXBhZ2U7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCBhbiBhcnJheSBvZiBwbGF5ZXIgbmFtZXMuXHJcbiAqIEFuIG9ubGluZSBsaXN0IGlzIG1haW50YWluZWQgYnkgdGhlIGJvdCwgdGhpcyBzaG91bGQgZ2VuZXJhbGx5IG5vdCBiZSB1c2VkLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRPbmxpbmVQbGF5ZXJzKCkudGhlbihvbmxpbmUgPT4geyBmb3IgKGxldCBuIG9mIG9ubGluZSkgeyBjb25zb2xlLmxvZyhuLCAnaXMgb25saW5lIScpfX0pO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWZyZXNoIHRoZSBvbmxpbmUgbmFtZXMuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPbmxpbmVQbGF5ZXJzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldE9ubGluZVBsYXllcnMpIHtcclxuICAgICAgICBjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzID0gZ2V0SG9tZXBhZ2UodHJ1ZSlcclxuICAgICAgICAgICAgLnRoZW4oKGh0bWwpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBsYXllckVsZW1zID0gZG9jLnF1ZXJ5U2VsZWN0b3IoJy5tYW5hZ2VyLnBhZGRlZDpudGgtY2hpbGQoMSknKVxyXG4gICAgICAgICAgICAgICAgICAgIC5xdWVyeVNlbGVjdG9yQWxsKCd0cjpub3QoLmhpc3RvcnkpID4gdGQubGVmdCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBsYXllcnMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBBcnJheS5mcm9tKHBsYXllckVsZW1zKS5mb3JFYWNoKChlbCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHBsYXllcnMucHVzaChlbC50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBwbGF5ZXJzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0T25saW5lUGxheWVycztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSBzZXJ2ZXIgb3duZXIncyBuYW1lLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRPd25lck5hbWUoKS50aGVuKG5hbWUgPT4gY29uc29sZS5sb2coJ1dvcmxkIGlzIG93bmVkIGJ5JywgbmFtZSkpO1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T3duZXJOYW1lKCkge1xyXG4gICAgcmV0dXJuIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IHtcclxuICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICByZXR1cm4gZG9jLnF1ZXJ5U2VsZWN0b3IoJy5zdWJoZWFkZXJ+dHI+dGQ6bm90KFtjbGFzc10pJykudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgd29ybGQncyBuYW1lLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRXb3JsZE5hbWUoKS50aGVuKG5hbWUgPT4gY29uc29sZS5sb2coJ1dvcmxkIG5hbWU6JywgbmFtZSkpO1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0V29ybGROYW1lKCkge1xyXG4gICAgcmV0dXJuIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IHtcclxuICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICByZXR1cm4gZG9jLnF1ZXJ5U2VsZWN0b3IoJyN0aXRsZScpLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlbmRzIGEgbWVzc2FnZSwgcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBtZXNzYWdlIGhhcyBiZWVuIHNlbnQgb3IgcmVqZWN0cyBvbiBmYWlsdXJlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZW5kKCdoZWxsbyEnKS50aGVuKCgpID0+IGNvbnNvbGUubG9nKCdzZW50JykpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBzZW5kLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gc2VuZChtZXNzYWdlKSB7XHJcbiAgICByZXR1cm4gYWpheC5wb3N0SlNPTihgL2FwaWAsIHtjb21tYW5kOiAnc2VuZCcsIG1lc3NhZ2UsIHdvcmxkSWR9KVxyXG4gICAgICAgIC50aGVuKHJlc3AgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgIT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3AubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3A7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbihyZXNwID0+IHtcclxuICAgICAgICAgICAgLy9IYW5kbGUgaG9va3NcclxuICAgICAgICAgICAgaG9vay5maXJlKCd3b3JsZC5zZW5kJywgbWVzc2FnZSk7XHJcbiAgICAgICAgICAgIGhvb2suZmlyZSgnd29ybGQuc2VydmVybWVzc2FnZScsIG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgLy9EaXNhbGxvdyBjb21tYW5kcyBzdGFydGluZyB3aXRoIHNwYWNlLlxyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykgJiYgIW1lc3NhZ2Uuc3RhcnRzV2l0aCgnLyAnKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbW1hbmQgPSBtZXNzYWdlLnN1YnN0cigxKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYXJncyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbW1hbmQuaW5jbHVkZXMoJyAnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnN1YnN0cmluZygwLCBjb21tYW5kLmluZGV4T2YoJyAnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IG1lc3NhZ2Uuc3Vic3RyaW5nKG1lc3NhZ2UuaW5kZXhPZignICcpICsgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBob29rLmNoZWNrKCd3b3JsZC5jb21tYW5kJywgJ1NFUlZFUicsIGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzcDtcclxuICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyID09ICdXb3JsZCBub3QgcnVubmluZy4nKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5maXJzdElkID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gd2F0Y2ggY2hhdC5cclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrQ2hhdCgpIHtcclxuICAgIGdldE1lc3NhZ2VzKCkudGhlbigobXNncykgPT4ge1xyXG4gICAgICAgIG1zZ3MuZm9yRWFjaCgobWVzc2FnZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkLm5hbWV9IC0gUGxheWVyIENvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IFssIG5hbWUsIGlwXSA9IG1lc3NhZ2UubWF0Y2goLyAtIFBsYXllciBDb25uZWN0ZWQgKC4qKSBcXHwgKFtcXGQuXSspIFxcfCAoW1xcd117MzJ9KVxccyokLyk7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVKb2luTWVzc2FnZXMobmFtZSwgaXApO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoYCR7d29ybGQubmFtZX0gLSBQbGF5ZXIgRGlzY29ubmVjdGVkIGApKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmFtZSA9IG1lc3NhZ2Uuc3Vic3RyaW5nKHdvcmxkLm5hbWUubGVuZ3RoICsgMjMpO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlTGVhdmVNZXNzYWdlcyhuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5pbmNsdWRlcygnOiAnKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBnZXRVc2VybmFtZShtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIGxldCBtc2cgPSBtZXNzYWdlLnN1YnN0cmluZyhuYW1lLmxlbmd0aCArIDIpO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlVXNlck1lc3NhZ2VzKG5hbWUsIG1zZyk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlT3RoZXJNZXNzYWdlcyhtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKVxyXG4gICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIHNldFRpbWVvdXQoY2hlY2tDaGF0LCA1MDAwKTtcclxuICAgIH0pO1xyXG59XHJcbmNoZWNrQ2hhdCgpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBnZXQgdGhlIGxhdGVzdCBjaGF0IG1lc3NhZ2VzLlxyXG4gKlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0TWVzc2FnZXMoKSB7XHJcbiAgICByZXR1cm4gd29ybGRTdGFydGVkKClcclxuICAgICAgICAudGhlbigoKSA9PiBhamF4LnBvc3RKU09OKGAvYXBpYCwgeyBjb21tYW5kOiAnZ2V0Y2hhdCcsIHdvcmxkSWQsIGZpcnN0SWQ6IGNhY2hlLmZpcnN0SWQgfSkpXHJcbiAgICAgICAgLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLnN0YXR1cyA9PSAnb2snICYmIGRhdGEubmV4dElkICE9IGNhY2hlLmZpcnN0SWQpIHtcclxuICAgICAgICAgICAgICAgIGNhY2hlLmZpcnN0SWQgPSBkYXRhLm5leHRJZDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmxvZztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLnN0YXR1cyA9PSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZGF0YS5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgd2hvIHNlbnQgYSBtZXNzYWdlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgbmFtZSA9IGdldFVzZXJuYW1lKCdTRVJWRVI6IEhpIHRoZXJlIScpO1xyXG4gKiAvL25hbWUgPT0gJ1NFUlZFUidcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gcGFyc2UuXHJcbiAqIEByZXR1cm4ge3N0cmluZ30gdGhlIG5hbWUgb2YgdGhlIHVzZXIgd2hvIHNlbnQgdGhlIG1lc3NhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRVc2VybmFtZShtZXNzYWdlKSB7XHJcbiAgICBmb3IgKGxldCBpID0gMTg7IGkgPiA0OyBpLS0pIHtcclxuICAgICAgICBsZXQgcG9zc2libGVOYW1lID0gbWVzc2FnZS5zdWJzdHJpbmcoMCwgbWVzc2FnZS5sYXN0SW5kZXhPZignOiAnLCBpKSk7XHJcbiAgICAgICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhwb3NzaWJsZU5hbWUpIHx8IHBvc3NpYmxlTmFtZSA9PSAnU0VSVkVSJykge1xyXG4gICAgICAgICAgICByZXR1cm4gcG9zc2libGVOYW1lO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIFNob3VsZCBpZGVhbGx5IG5ldmVyIGhhcHBlbi5cclxuICAgIHJldHVybiBtZXNzYWdlLnN1YnN0cmluZygwLCBtZXNzYWdlLmxhc3RJbmRleE9mKCc6ICcsIDE4KSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHBsYXllciBqb2lucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHBsYXllciBqb2luaW5nLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaXAgdGhlIGlwIG9mIHRoZSBwbGF5ZXIgam9pbmluZy5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZUpvaW5NZXNzYWdlcyhuYW1lLCBpcCkge1xyXG4gICAgaWYgKCF3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICB3b3JsZC5vbmxpbmUucHVzaChuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5qb2luJywgbmFtZSwgaXApO1xyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHBsYXllciBkaXNjb25uZWN0aW9ucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHBsYXllciBsZWF2aW5nLlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlTGVhdmVNZXNzYWdlcyhuYW1lKSB7XHJcbiAgICBpZiAod29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnNwbGljZSh3b3JsZC5vbmxpbmUuaW5kZXhPZihuYW1lKSwgMSk7XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQubGVhdmUnLCBuYW1lKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBoYW5kbGUgdXNlciBjaGF0XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSB1c2VyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSBzZW50LlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlVXNlck1lc3NhZ2VzKG5hbWUsIG1lc3NhZ2UpIHtcclxuICAgIGlmIChuYW1lID09ICdTRVJWRVInKSB7XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQuc2VydmVyY2hhdCcsIG1lc3NhZ2UpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5tZXNzYWdlJywgbmFtZSwgbWVzc2FnZSk7XHJcblxyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpICYmICFtZXNzYWdlLnN0YXJ0c1dpdGgoJy8gJykpIHtcclxuXHJcbiAgICAgICAgbGV0IGNvbW1hbmQgPSBtZXNzYWdlLnN1YnN0cigxKTtcclxuXHJcbiAgICAgICAgbGV0IGFyZ3MgPSAnJztcclxuICAgICAgICBpZiAoY29tbWFuZC5pbmNsdWRlcygnICcpKSB7XHJcbiAgICAgICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnN1YnN0cmluZygwLCBjb21tYW5kLmluZGV4T2YoJyAnKSk7XHJcbiAgICAgICAgICAgIGFyZ3MgPSBtZXNzYWdlLnN1YnN0cmluZyhtZXNzYWdlLmluZGV4T2YoJyAnKSArIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBob29rLmNoZWNrKCd3b3JsZC5jb21tYW5kJywgbmFtZSwgY29tbWFuZCwgYXJncyk7XHJcbiAgICAgICAgcmV0dXJuOyAvL25vdCBjaGF0XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQuY2hhdCcsIG5hbWUsIG1lc3NhZ2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gaGFuZGxlIG1lc3NhZ2VzIHdoaWNoIGFyZSBub3Qgc2ltcGx5IHBhcnNlZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gaGFuZGxlXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVPdGhlck1lc3NhZ2VzKG1lc3NhZ2UpIHtcclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLm90aGVyJywgbWVzc2FnZSk7XHJcbn1cclxuIiwidmFyIGxpc3RlbmVycyA9IHt9O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gYmVnaW4gbGlzdGVuaW5nIHRvIGFuIGV2ZW50LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBsaXN0ZW4oJ2V2ZW50JywgY29uc29sZS5sb2cpO1xyXG4gKiAvL2FsdGVybmF0aXZlbHlcclxuICogb24oJ2V2ZW50JywgY29uc29sZS5sb2cpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBsaXN0ZW4gdG8uXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRoZSBldmVudCBoYW5kbGVyXHJcbiAqL1xyXG5mdW5jdGlvbiBsaXN0ZW4oa2V5LCBjYWxsYmFjaykge1xyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XHJcbiAgICB9XHJcblxyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgbGlzdGVuZXJzW2tleV0gPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xyXG4gICAgICAgIGxpc3RlbmVyc1trZXldLnB1c2goY2FsbGJhY2spO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc3RvcCBsaXN0ZW5pbmcgdG8gYW4gZXZlbnQuIElmIHRoZSBsaXN0ZW5lciB3YXMgbm90IGZvdW5kLCBubyBhY3Rpb24gd2lsbCBiZSB0YWtlbi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogLy9FYXJsaWVyIGF0dGFjaGVkIG15RnVuYyB0byAnZXZlbnQnXHJcbiAqIHJlbW92ZSgnZXZlbnQnLCBteUZ1bmMpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBzdG9wIGxpc3RlbmluZyB0by5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdGhlIGNhbGxiYWNrIHRvIHJlbW92ZSBmcm9tIHRoZSBldmVudCBsaXN0ZW5lcnMuXHJcbiAqL1xyXG5mdW5jdGlvbiByZW1vdmUoa2V5LCBjYWxsYmFjaykge1xyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAobGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICBpZiAobGlzdGVuZXJzW2tleV0uaW5jbHVkZXMoY2FsbGJhY2spKSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVyc1trZXldLnNwbGljZShsaXN0ZW5lcnNba2V5XS5pbmRleE9mKGNhbGxiYWNrKSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2FsbCBldmVudHMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGNoZWNrKCd0ZXN0JywgMSwgMiwgMyk7XHJcbiAqIGNoZWNrKCd0ZXN0JywgdHJ1ZSk7XHJcbiAqIC8vIGFsdGVybmF0aXZlbHlcclxuICogZmlyZSgndGVzdCcsIDEsIDIsIDMpO1xyXG4gKiBmaXJlKCd0ZXN0JywgdHJ1ZSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGNhbGwuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGFyZ3MgYW55IGFyZ3VtZW50cyB0byBwYXNzIHRvIGxpc3RlbmluZyBmdW5jdGlvbnMuXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVjayhrZXksIC4uLmFyZ3MpIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsaXN0ZW5lcnNba2V5XS5mb3JFYWNoKGZ1bmN0aW9uKGxpc3RlbmVyKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGlzdGVuZXIoLi4uYXJncyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBpZiAoa2V5ICE9ICdlcnJvcicpIHtcclxuICAgICAgICAgICAgICAgIGNoZWNrKCdlcnJvcicsIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byB1cGRhdGUgYSB2YWx1ZSBiYXNlZCBvbiBpbnB1dCBmcm9tIGxpc3RlbmVycy5cclxuICpcclxuICogQGRlcHJpY2F0ZWQgc2luY2UgNi4xLjAuIEluc3RlYWQsIHVwZGF0ZSByZXF1ZXN0cyBzaG91bGQgYmUgaGFuZGxlZCBieSB0aGUgZXh0ZW5zaW9uIGl0ZXNlbGYuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHVwZGF0ZSgnZXZlbnQnLCB0cnVlLCAxLCAyLCAzKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gY2FsbFxyXG4gKiBAcGFyYW0ge21peGVkfSBpbml0aWFsIHRoZSBpbml0aWFsIHZhbHVlIHRvIGJlIHBhc3NlZCB0byBsaXN0ZW5lcnMuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGFyZ3MgYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBsaXN0ZW5lcnMuXHJcbiAqIEByZXR1cm4ge21peGVkfVxyXG4gKi9cclxuZnVuY3Rpb24gdXBkYXRlKGtleSwgaW5pdGlhbCwgLi4uYXJncykge1xyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgcmV0dXJuIGluaXRpYWw7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGxpc3RlbmVyc1trZXldLnJlZHVjZShmdW5jdGlvbihwcmV2aW91cywgY3VycmVudCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBjdXJyZW50KHByZXZpb3VzLCAuLi5hcmdzKTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzO1xyXG4gICAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgICAgICBpZiAoa2V5ICE9ICdlcnJvcicpIHtcclxuICAgICAgICAgICAgICAgIGNoZWNrKCdlcnJvcicsIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91cztcclxuICAgICAgICB9XHJcbiAgICB9LCBpbml0aWFsKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBsaXN0ZW4sXHJcbiAgICBvbjogbGlzdGVuLFxyXG4gICAgcmVtb3ZlLFxyXG4gICAgY2hlY2ssXHJcbiAgICBmaXJlOiBjaGVjayxcclxuICAgIHVwZGF0ZSxcclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBnZXRTdHJpbmcsXHJcbiAgICBnZXRPYmplY3QsXHJcbiAgICBzZXQsXHJcbiAgICBjbGVhck5hbWVzcGFjZSxcclxufTtcclxuXHJcbi8vUkVWSUVXOiBJcyB0aGVyZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpcz8gcmVxdWlyZSgnLi9jb25maWcnKSBtYXliZT9cclxuY29uc3QgTkFNRVNQQUNFID0gd2luZG93LndvcmxkSWQ7XHJcblxyXG4vKipcclxuICogR2V0cyBhIHN0cmluZyBmcm9tIHRoZSBzdG9yYWdlIGlmIGl0IGV4aXN0cyBhbmQgcmV0dXJucyBpdCwgb3RoZXJ3aXNlIHJldHVybnMgZmFsbGJhY2suXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB4ID0gZ2V0U3RyaW5nKCdzdG9yZWRfcHJlZnMnLCAnbm90aGluZycpO1xyXG4gKiB2YXIgeSA9IGdldFN0cmluZygnc3RvcmVkX3ByZWZzJywgJ25vdGhpbmcnLCBmYWxzZSk7XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGtleSB0byByZXRyaWV2ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZmFsbGJhY2sgd2hhdCB0byByZXR1cm4gaWYgdGhlIGtleSB3YXMgbm90IGZvdW5kLlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIG9yIG5vdCB0byB1c2UgYSBuYW1lc3BhY2Ugd2hlbiBjaGVja2luZyBmb3IgdGhlIGtleS5cclxuICogQHJldHVybiB7bWl4ZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRTdHJpbmcoa2V5LCBmYWxsYmFjaywgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYgKGxvY2FsKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oYCR7a2V5fSR7TkFNRVNQQUNFfWApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAocmVzdWx0ID09PSBudWxsKSA/IGZhbGxiYWNrIDogcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyBhIHN0b3JlZCBvYmplY3QgaWYgaXQgZXhpc3RzLCBvdGhlcndpc2UgcmV0dXJucyBmYWxsYmFjay5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHggPSBnZXRPYmplY3QoJ3N0b3JlZF9rZXknLCBbMSwgMiwgM10pO1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBpdGVtIHRvIHJldHJpZXZlLlxyXG4gKiBAcGFyYW0ge21peGVkfSBmYWxsYmFjayB3aGF0IHRvIHJldHVybiBpZiB0aGUgaXRlbSBkb2VzIG5vdCBleGlzdCBvciBmYWlscyB0byBwYXJzZSBjb3JyZWN0bHkuXHJcbiAqIEBwYXJhbSB7Ym9vbH0gW2xvY2FsPXRydWVdIHdoZXRoZXIgb3Igbm90IGEgbmFtZXNwYWNlIHNob3VsZCBiZSB1c2VkLlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIGdldE9iamVjdChrZXksIGZhbGxiYWNrLCBsb2NhbCA9IHRydWUpIHtcclxuICAgIHZhciByZXN1bHQgPSBnZXRTdHJpbmcoa2V5LCBmYWxzZSwgbG9jYWwpO1xyXG5cclxuICAgIGlmICghcmVzdWx0KSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbGxiYWNrO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZShyZXN1bHQpO1xyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2s7XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2s7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXRzIGFuIG9iamVjdCBpbiB0aGUgc3RvcmFnZSwgc3RyaW5naWZ5aW5nIGl0IGZpcnN0IGlmIG5lY2Nlc3NhcnkuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNldCgnc29tZV9rZXknLCB7YTogWzEsIDIsIDNdLCBiOiAndGVzdCd9KTtcclxuICogLy9yZXR1cm5zICd7XCJhXCI6WzEsMiwzXSxcImJcIjpcInRlc3RcIn0nXHJcbiAqIGdldFN0cmluZygnc29tZV9rZXknKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgaXRlbSB0byBvdmVyd3JpdGUgb3IgY3JlYXRlLlxyXG4gKiBAcGFyYW0ge21peGVkfSBkYXRhIGFueSBzdHJpbmdpZnlhYmxlIHR5cGUuXHJcbiAqIEBwYXJhbSB7Ym9vbH0gW2xvY2FsPXRydWVdIHdoZXRoZXIgdG8gc2F2ZSB0aGUgaXRlbSB3aXRoIGEgbmFtZXNwYWNlLlxyXG4gKi9cclxuZnVuY3Rpb24gc2V0KGtleSwgZGF0YSwgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICBpZiAobG9jYWwpIHtcclxuICAgICAgICBrZXkgPSBgJHtrZXl9JHtOQU1FU1BBQ0V9YDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGRhdGEgPT0gJ3N0cmluZycpIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIGRhdGEpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYWxsIGl0ZW1zIHN0YXJ0aW5nIHdpdGggbmFtZXNwYWNlIGZyb20gdGhlIHN0b3JhZ2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNldCgna2V5X3Rlc3QnLCAxKTtcclxuICogc2V0KCdrZXlfdGVzdDInLCAyKTtcclxuICogY2xlYXJOYW1lc3BhY2UoJ2tleV8nKTsgLy9ib3RoIGtleV90ZXN0IGFuZCBrZXlfdGVzdDIgaGF2ZSBiZWVuIHJlbW92ZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lc3BhY2UgdGhlIHByZWZpeCB0byBjaGVjayBmb3Igd2hlbiByZW1vdmluZyBpdGVtcy5cclxuICovXHJcbmZ1bmN0aW9uIGNsZWFyTmFtZXNwYWNlKG5hbWVzcGFjZSkge1xyXG4gICAgT2JqZWN0LmtleXMobG9jYWxTdG9yYWdlKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgaWYgKGtleS5zdGFydHNXaXRoKG5hbWVzcGFjZSkpIHtcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCBhcGkgPSByZXF1aXJlKCcuL2Jsb2NraGVhZHMnKTtcclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnLi9ob29rJyk7XHJcblxyXG5jb25zdCBTVE9SQUdFID0ge1xyXG4gICAgUExBWUVSUzogJ21iX3BsYXllcnMnLFxyXG4gICAgTE9HX0xPQUQ6ICdtYl9sYXN0TG9nTG9hZCcsXHJcbn07XHJcblxyXG52YXIgd29ybGQgPSBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG5hbWU6ICcnLFxyXG4gICAgb25saW5lOiBbXSxcclxuICAgIG93bmVyOiAnJyxcclxuICAgIHBsYXllcnM6IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0UuUExBWUVSUywge30pLFxyXG4gICAgbGlzdHM6IHthZG1pbjogW10sIG1vZDogW10sIHN0YWZmOiBbXSwgYmxhY2s6IFtdLCB3aGl0ZTogW119LFxyXG4gICAgaXNQbGF5ZXIsXHJcbiAgICBpc1NlcnZlcixcclxuICAgIGlzT3duZXIsXHJcbiAgICBpc0FkbWluLFxyXG4gICAgaXNTdGFmZixcclxuICAgIGlzTW9kLFxyXG4gICAgaXNPbmxpbmUsXHJcbiAgICBnZXRKb2lucyxcclxufTtcclxudmFyIGxpc3RzID0gd29ybGQubGlzdHM7XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGEgcGxheWVyIGhhcyBqb2luZWQgdGhlIHNlcnZlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzUGxheWVyKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5wbGF5ZXJzLmhhc093blByb3BlcnR5KG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyB0aGUgc2VydmVyXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1NlcnZlcihuYW1lKSB7XHJcbiAgICByZXR1cm4gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpID09ICdTRVJWRVInO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgdGhlIG93bmVyIG9yIHNlcnZlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzT3duZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLm93bmVyID09IG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSB8fCBpc1NlcnZlcihuYW1lKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIGFuIGFkbWluXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc0FkbWluKG5hbWUpIHtcclxuICAgIHJldHVybiBsaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpIHx8IGlzT3duZXIobmFtZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyBhIG1vZFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNNb2QobmFtZSkge1xyXG4gICAgcmV0dXJuIGxpc3RzLm1vZC5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgYSBzdGFmZiBtZW1iZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1N0YWZmKG5hbWUpIHtcclxuICAgIHJldHVybiBpc0FkbWluKG5hbWUpIHx8IGlzTW9kKG5hbWUpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGEgcGxheWVyIGlzIG9ubGluZVxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNPbmxpbmUobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbnVtYmVyIG9mIHRpbWVzIHRoZSBwbGF5ZXIgaGFzIGpvaW5lZCB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRKb2lucyhuYW1lKSB7XHJcbiAgICByZXR1cm4gaXNQbGF5ZXIobmFtZSkgPyB3b3JsZC5wbGF5ZXJzW25hbWUudG9Mb2NhbGVVcHBlckNhc2UoKV0uam9pbnMgOiAwO1xyXG59XHJcblxyXG4vLyBLZWVwIHRoZSBvbmxpbmUgbGlzdCB1cCB0byBkYXRlXHJcbmhvb2sub24oJ3dvcmxkLmpvaW4nLCBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBpZiAoIXdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG59KTtcclxuaG9vay5vbignd29ybGQubGVhdmUnLCBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBpZiAod29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnNwbGljZSh3b3JsZC5vbmxpbmUuaW5kZXhPZihuYW1lKSwgMSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gS2VlcCBwbGF5ZXJzIGxpc3QgdXAgdG8gZGF0ZVxyXG5ob29rLm9uKCd3b3JsZC5qb2luJywgY2hlY2tQbGF5ZXJKb2luKTtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbi5cclxuICogUmVtb3ZlcyBhZG1pbnMgZnJvbSB0aGUgbW9kIGxpc3QgYW5kIGNyZWF0ZXMgdGhlIHN0YWZmIGxpc3QuXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZFN0YWZmTGlzdCgpIHtcclxuICAgIGxpc3RzLm1vZCA9IGxpc3RzLm1vZC5maWx0ZXIoKG5hbWUpID0+ICFsaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lKSAmJiBuYW1lICE9ICdTRVJWRVInICYmIG5hbWUgIT0gd29ybGQub3duZXIpO1xyXG4gICAgbGlzdHMuc3RhZmYgPSBsaXN0cy5hZG1pbi5jb25jYXQobGlzdHMubW9kKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uLlxyXG4gKiBDaGVja3MgaWYgYSBwbGF5ZXIgaGFzIHBlcm1pc3Npb24gdG8gcGVyZm9ybSBhIGNvbW1hbmRcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGNvbW1hbmRcclxuICovXHJcbmZ1bmN0aW9uIHBlcm1pc3Npb25DaGVjayhuYW1lLCBjb21tYW5kKSB7XHJcbiAgICBjb21tYW5kID0gY29tbWFuZC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG5cclxuICAgIGlmIChbJ2FkbWluJywgJ3VuYWRtaW4nLCAnbW9kJywgJ3VubW9kJ10uaW5jbHVkZXMoY29tbWFuZCkpIHtcclxuICAgICAgICByZXR1cm4gaXNBZG1pbihuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoWyd3aGl0ZWxpc3QnLCAndW53aGl0ZWxpc3QnLCAnYmFuJywgJ3VuYmFuJ10uaW5jbHVkZXMoY29tbWFuZCkpIHtcclxuICAgICAgICByZXR1cm4gaXNTdGFmZihuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbi8vIEtlZXAgbGlzdHMgdXAgdG8gZGF0ZVxyXG5ob29rLm9uKCd3b3JsZC5jb21tYW5kJywgZnVuY3Rpb24obmFtZSwgY29tbWFuZCwgdGFyZ2V0KSB7XHJcbiAgICBpZiAoIXBlcm1pc3Npb25DaGVjayhuYW1lLCBjb21tYW5kKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdW4gPSBjb21tYW5kLnN0YXJ0c1dpdGgoJ3VuJyk7XHJcblxyXG4gICAgdmFyIGdyb3VwID0ge1xyXG4gICAgICAgIGFkbWluOiAnYWRtaW4nLFxyXG4gICAgICAgIG1vZDogJ21vZCcsXHJcbiAgICAgICAgd2hpdGVsaXN0OiAnd2hpdGUnLFxyXG4gICAgICAgIGJhbjogJ2JsYWNrJyxcclxuICAgIH1bdW4gPyBjb21tYW5kLnN1YnN0cigyKSA6IGNvbW1hbmRdO1xyXG5cclxuICAgIGlmICh1biAmJiBsaXN0c1tncm91cF0uaW5jbHVkZXModGFyZ2V0KSkge1xyXG4gICAgICAgIGxpc3RzW2dyb3VwXS5zcGxpY2UobGlzdHNbZ3JvdXBdLmluZGV4T2YodGFyZ2V0KSwgMSk7XHJcbiAgICAgICAgYnVpbGRTdGFmZkxpc3QoKTtcclxuICAgIH0gZWxzZSBpZiAoIXVuICYmICFsaXN0c1tncm91cF0uaW5jbHVkZXModGFyZ2V0KSkge1xyXG4gICAgICAgIGxpc3RzW2dyb3VwXS5wdXNoKHRhcmdldCk7XHJcbiAgICAgICAgYnVpbGRTdGFmZkxpc3QoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24uIEluY3JlbWVudHMgYSBwbGF5ZXIncyBqb2lucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGlwXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja1BsYXllckpvaW4obmFtZSwgaXApIHtcclxuICAgIGlmICh3b3JsZC5wbGF5ZXJzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XHJcbiAgICAgICAgLy9SZXR1cm5pbmcgcGxheWVyXHJcbiAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXS5qb2lucysrO1xyXG4gICAgICAgIGlmICghd29ybGQucGxheWVyc1tuYW1lXS5pcHMuaW5jbHVkZXMoaXApKSB7XHJcbiAgICAgICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uaXBzLnB1c2goaXApO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy9OZXcgcGxheWVyXHJcbiAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXSA9IHtqb2luczogMSwgaXBzOiBbaXBdfTtcclxuICAgIH1cclxuICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uaXAgPSBpcDtcclxuXHJcbiAgICAvLyBPdGhlcndpc2UsIHdlIHdpbGwgZG91YmxlIHBhcnNlIGpvaW5zXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFLkxPR19MT0FELCBNYXRoLmZsb29yKERhdGUubm93KCkudmFsdWVPZigpKSk7XHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFLlBMQVlFUlMsIHdvcmxkLnBsYXllcnMpO1xyXG59XHJcblxyXG5cclxuLy8gVXBkYXRlIGxpc3RzXHJcblByb21pc2UuYWxsKFthcGkuZ2V0TGlzdHMoKSwgYXBpLmdldFdvcmxkTmFtZSgpLCBhcGkuZ2V0T3duZXJOYW1lKCldKVxyXG4gICAgLnRoZW4oKHZhbHVlcykgPT4ge1xyXG4gICAgICAgIHZhciBbYXBpTGlzdHMsIHdvcmxkTmFtZSwgb3duZXJdID0gdmFsdWVzO1xyXG5cclxuICAgICAgICB3b3JsZC5saXN0cyA9IGFwaUxpc3RzO1xyXG4gICAgICAgIGJ1aWxkU3RhZmZMaXN0KCk7XHJcbiAgICAgICAgd29ybGQubmFtZSA9IHdvcmxkTmFtZTtcclxuICAgICAgICB3b3JsZC5vd25lciA9IG93bmVyO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuXHJcbi8vIFVwZGF0ZSBwbGF5ZXJzIHNpbmNlIGxhc3QgYm90IGxvYWRcclxuUHJvbWlzZS5hbGwoW2FwaS5nZXRMb2dzKCksIGFwaS5nZXRXb3JsZE5hbWUoKV0pXHJcbiAgICAudGhlbigodmFsdWVzKSA9PiB7XHJcbiAgICAgICAgdmFyIFtsaW5lcywgd29ybGROYW1lXSA9IHZhbHVlcztcclxuXHJcbiAgICAgICAgdmFyIGxhc3QgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFLkxPR19MT0FELCAwKTtcclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFLkxPR19MT0FELCBNYXRoLmZsb29yKERhdGUubm93KCkudmFsdWVPZigpKSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGxpbmUgb2YgbGluZXMpIHtcclxuICAgICAgICAgICAgbGV0IHRpbWUgPSBuZXcgRGF0ZShsaW5lLnN1YnN0cmluZygwLCBsaW5lLmluZGV4T2YoJ2InKSkucmVwbGFjZSgnICcsICdUJykucmVwbGFjZSgnICcsICdaJykpO1xyXG4gICAgICAgICAgICBsZXQgbWVzc2FnZSA9IGxpbmUuc3Vic3RyaW5nKGxpbmUuaW5kZXhPZignXScpICsgMik7XHJcblxyXG4gICAgICAgICAgICBpZiAodGltZSA8IGxhc3QpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkTmFtZX0gLSBQbGF5ZXIgQ29ubmVjdGVkIGApKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcGFydHMgPSBsaW5lLnN1YnN0cihsaW5lLmluZGV4T2YoJyAtIFBsYXllciBDb25uZWN0ZWQgJykgKyAyMCk7IC8vTkFNRSB8IElQIHwgSURcclxuICAgICAgICAgICAgICAgIGxldCBbLCBuYW1lLCBpcF0gPSBwYXJ0cy5tYXRjaCgvKC4qKSBcXHwgKFtcXHcuXSspIFxcfCAuezMyfVxccyovKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjaGVja1BsYXllckpvaW4obmFtZSwgaXApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFLlBMQVlFUlMsIHdvcmxkLnBsYXllcnMpO1xyXG4gICAgfSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IHNlbmQgPSByZXF1aXJlKCdib3QnKS5zZW5kO1xyXG5jb25zdCBwcmVmZXJlbmNlcyA9IHJlcXVpcmUoJ3NldHRpbmdzJyk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignQW5ub3VuY2VtZW50cycsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8dGVtcGxhdGUgaWQ9XFxcImFUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNvbHVtbiBpcy1mdWxsXFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPlNlbmQ6PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICA8dGV4dGFyZWEgY2xhc3M9XFxcIm1cXFwiPjwvdGV4dGFyZWE+XFxyXFxuICAgICAgICAgICAgPGE+RGVsZXRlPC9hPlxcclxcbiAgICAgICAgPC9kaXY+XFxyXFxuICAgICAgICA8ZGl2PlxcclxcbiAgICAgICAgICAgIFdhaXQgWCBtaW51dGVzLi4uXFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9hbm5vdW5jZW1lbnRzXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgICAgIDxoMz5UaGVzZSBhcmUgc2VudCBhY2NvcmRpbmcgdG8gYSByZWd1bGFyIHNjaGVkdWxlLjwvaDM+XFxyXFxuICAgICAgICA8c3Bhbj5JZiB5b3UgaGF2ZSBvbmUgYW5ub3VuY2VtZW50LCBpdCBpcyBzZW50IGV2ZXJ5IFggbWludXRlcywgaWYgeW91IGhhdmUgdHdvLCB0aGVuIHRoZSBmaXJzdCBpcyBzZW50IGF0IFggbWludXRlcywgYW5kIHRoZSBzZWNvbmQgaXMgc2VudCBYIG1pbnV0ZXMgYWZ0ZXIgdGhlIGZpcnN0LiBDaGFuZ2UgWCBpbiB0aGUgc2V0dGluZ3MgdGFiLiBPbmNlIHRoZSBib3QgcmVhY2hlcyB0aGUgZW5kIG9mIHRoZSBsaXN0LCBpdCBzdGFydHMgb3ZlciBhdCB0aGUgdG9wLjwvc3Bhbj5cXHJcXG4gICAgPC9zZWN0aW9uPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJhTXNnc1xcXCIgY2xhc3M9XFxcImNvbHVtbnMgaXMtbXVsdGlsaW5lXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbiAgICBzdGFydDogKCkgPT4gYW5ub3VuY2VtZW50Q2hlY2soMCksXHJcbn07XHJcblxyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKHRleHQgPSAnJykge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjYVRlbXBsYXRlJywgJyNhTXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IHRleHR9XHJcbiAgICBdKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIGFubm91bmNlbWVudHMgPSBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcubScpKVxyXG4gICAgICAgIC5tYXAoZWwgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4ge21lc3NhZ2U6IGVsLnZhbHVlfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldCgnYW5ub3VuY2VtZW50QXJyJywgYW5ub3VuY2VtZW50cyk7XHJcbn1cclxuXHJcbi8vIEFubm91bmNlbWVudHMgY29sbGVjdGlvblxyXG52YXIgYW5ub3VuY2VtZW50cyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KCdhbm5vdW5jZW1lbnRBcnInLCBbXSk7XHJcblxyXG4vLyBTaG93IHNhdmVkIGFubm91bmNlbWVudHNcclxuYW5ub3VuY2VtZW50c1xyXG4gICAgLm1hcChhbm4gPT4gYW5uLm1lc3NhZ2UpXHJcbiAgICAuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcblxyXG4vLyBTZW5kcyBhbm5vdW5jZW1lbnRzIGFmdGVyIHRoZSBzcGVjaWZpZWQgZGVsYXkuXHJcbmZ1bmN0aW9uIGFubm91bmNlbWVudENoZWNrKGkpIHtcclxuICAgIGkgPSAoaSA+PSBhbm5vdW5jZW1lbnRzLmxlbmd0aCkgPyAwIDogaTtcclxuXHJcbiAgICB2YXIgYW5uID0gYW5ub3VuY2VtZW50c1tpXTtcclxuXHJcbiAgICBpZiAoYW5uICYmIGFubi5tZXNzYWdlKSB7XHJcbiAgICAgICAgc2VuZChhbm4ubWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgICBzZXRUaW1lb3V0KGFubm91bmNlbWVudENoZWNrLCBwcmVmZXJlbmNlcy5hbm5vdW5jZW1lbnREZWxheSAqIDYwMDAwLCBpICsgMSk7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBidWlsZEFuZFNlbmRNZXNzYWdlLFxyXG4gICAgYnVpbGRNZXNzYWdlLFxyXG59O1xyXG5cclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuY29uc3Qgc2VuZCA9IHJlcXVpcmUoJ2JvdCcpLnNlbmQ7XHJcblxyXG5mdW5jdGlvbiBidWlsZEFuZFNlbmRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpIHtcclxuICAgIHNlbmQoYnVpbGRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpIHtcclxuICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7KFtefV0rKX19L2csIGZ1bmN0aW9uKGZ1bGwsIGtleSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIE5BTUU6IG5hbWUsXHJcbiAgICAgICAgICAgIE5hbWU6IG5hbWVbMF0gKyBuYW1lLnN1YnN0cmluZygxKS50b0xvY2FsZUxvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICBuYW1lOiBuYW1lLnRvTG9jYWxlTG93ZXJDYXNlKClcclxuICAgICAgICB9W2tleV0gfHwgZnVsbDtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7aXB9fS9naSwgd29ybGQucGxheWVycy5nZXRJUChuYW1lKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1lc3NhZ2U7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjaGVja0pvaW5zQW5kR3JvdXAsXHJcbiAgICBjaGVja0pvaW5zLFxyXG4gICAgY2hlY2tHcm91cCxcclxufTtcclxuXHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykge1xyXG4gICAgcmV0dXJuIGNoZWNrSm9pbnMobmFtZSwgbXNnLmpvaW5zX2xvdywgbXNnLmpvaW5zX2hpZ2gpICYmIGNoZWNrR3JvdXAobmFtZSwgbXNnLmdyb3VwLCBtc2cubm90X2dyb3VwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2lucyhuYW1lLCBsb3csIGhpZ2gpIHtcclxuICAgIHJldHVybiB3b3JsZC5nZXRKb2lucyhuYW1lKSA+PSBsb3cgJiYgd29ybGQuZ2V0Sm9pbnMobmFtZSkgPD0gaGlnaDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tHcm91cChuYW1lLCBncm91cCwgbm90X2dyb3VwKSB7XHJcbiAgICByZXR1cm4gaXNJbkdyb3VwKG5hbWUsIGdyb3VwKSAmJiAhaXNJbkdyb3VwKG5hbWUsIG5vdF9ncm91cCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzSW5Hcm91cChuYW1lLCBncm91cCkge1xyXG4gICAgbmFtZSA9IG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIHN3aXRjaCAoZ3JvdXAudG9Mb2NhbGVMb3dlckNhc2UoKSkge1xyXG4gICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1BsYXllcihuYW1lKTtcclxuICAgICAgICBjYXNlICdhZG1pbic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc0FkbWluKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ21vZCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc01vZChuYW1lKTtcclxuICAgICAgICBjYXNlICdzdGFmZic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1N0YWZmKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ293bmVyJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzT3duZXIobmFtZSk7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcbiIsIk9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vYnVpbGRNZXNzYWdlJyksXHJcbiAgICByZXF1aXJlKCcuL2NoZWNrSm9pbnNBbmRHcm91cCcpLFxyXG4gICAgcmVxdWlyZSgnLi9zaG93U3VtbWFyeScpXHJcbik7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2hvd1N1bW1hcnlcclxufTtcclxuXHJcbi8qKlxyXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gY3JlYXRlIGFuZCBkaXNwbGF5IGEgc3VtbWFyeSBvZiB0aGUgb3B0aW9ucyBjaGFuZ2VkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge05vZGV9IGNvbnRhaW5lciB0aGUgbWVzc2FnZSBjb250YWluZXIgd2hpY2ggbmVlZHMgYW4gdXBkYXRlZCBzdW1tYXJ5LlxyXG4gKi9cclxuZnVuY3Rpb24gc2hvd1N1bW1hcnkoY29udGFpbmVyKSB7XHJcbiAgICB2YXIgb3V0ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5zdW1tYXJ5Jyk7XHJcblxyXG4gICAgaWYgKCFvdXQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGdyb3VwID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImdyb3VwXCJdJykudmFsdWU7XHJcbiAgICB2YXIgbm90X2dyb3VwID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXScpLnZhbHVlO1xyXG4gICAgdmFyIGpvaW5zX2xvdyA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZTtcclxuICAgIHZhciBqb2luc19oaWdoID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nKS52YWx1ZTtcclxuXHJcbiAgICB2YXIgZ3JvdXBzQWx0ZXJlZCA9IGdyb3VwICE9ICdhbGwnIHx8IG5vdF9ncm91cCAhPSAnbm9ib2R5JztcclxuICAgIHZhciBqb2luc0FsdGVyZWQgPSBqb2luc19sb3cgIT0gXCIwXCIgfHwgam9pbnNfaGlnaCAhPSBcIjk5OTlcIjtcclxuXHJcbiAgICBpZiAoZ3JvdXBzQWx0ZXJlZCAmJiBqb2luc0FsdGVyZWQpIHtcclxuICAgICAgICBvdXQudGV4dENvbnRlbnQgPSBgJHtncm91cH0gLyBub3QgJHtub3RfZ3JvdXB9IGFuZCAke2pvaW5zX2xvd30g4omkIGpvaW5zIOKJpCAke2pvaW5zX2hpZ2h9YDtcclxuICAgIH0gZWxzZSBpZiAoZ3JvdXBzQWx0ZXJlZCkge1xyXG4gICAgICAgIG91dC50ZXh0Q29udGVudCA9IGAke2dyb3VwfSAvIG5vdCAke25vdF9ncm91cH1gO1xyXG4gICAgfSBlbHNlIGlmIChqb2luc0FsdGVyZWQpIHtcclxuICAgICAgICBvdXQudGV4dENvbnRlbnQgPSBgJHtqb2luc19sb3d9IOKJpCBqb2lucyDiiaQgJHtqb2luc19oaWdofWA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG91dC50ZXh0Q29udGVudCA9ICcnO1xyXG4gICAgfVxyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcclxuXHJcbnZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbmVsLmlubmVySFRNTCA9IFwiI21iX2pvaW4+aDMsI21iX2xlYXZlPmgzLCNtYl90cmlnZ2VyPmgzLCNtYl9hbm5vdW5jZW1lbnRzPmgze21hcmdpbjowIDAgNXB4IDZlbX0jbWJfam9pbj5zcGFuLCNtYl9sZWF2ZT5zcGFuLCNtYl90cmlnZ2VyPnNwYW4sI21iX2Fubm91bmNlbWVudHM+c3BhbnttYXJnaW4tbGVmdDo2ZW19I21iX2pvaW4gaW5wdXQsI21iX2pvaW4gdGV4dGFyZWEsI21iX2xlYXZlIGlucHV0LCNtYl9sZWF2ZSB0ZXh0YXJlYSwjbWJfdHJpZ2dlciBpbnB1dCwjbWJfdHJpZ2dlciB0ZXh0YXJlYSwjbWJfYW5ub3VuY2VtZW50cyBpbnB1dCwjbWJfYW5ub3VuY2VtZW50cyB0ZXh0YXJlYXtib3JkZXI6MnB4IHNvbGlkICM2NjY7d2lkdGg6MTAwJX0jbWJfam9pbiB0ZXh0YXJlYSwjbWJfbGVhdmUgdGV4dGFyZWEsI21iX3RyaWdnZXIgdGV4dGFyZWEsI21iX2Fubm91bmNlbWVudHMgdGV4dGFyZWF7cmVzaXplOm5vbmU7b3ZlcmZsb3c6aGlkZGVuO3BhZGRpbmc6MXB4IDA7aGVpZ2h0OjIxcHg7dHJhbnNpdGlvbjpoZWlnaHQgMC4yNXN9I21iX2pvaW4gdGV4dGFyZWE6Zm9jdXMsI21iX2xlYXZlIHRleHRhcmVhOmZvY3VzLCNtYl90cmlnZ2VyIHRleHRhcmVhOmZvY3VzLCNtYl9hbm5vdW5jZW1lbnRzIHRleHRhcmVhOmZvY3Vze2hlaWdodDo1ZW19I21iX2pvaW4gaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl0sI21iX2xlYXZlIGlucHV0W3R5cGU9XFxcIm51bWJlclxcXCJdLCNtYl90cmlnZ2VyIGlucHV0W3R5cGU9XFxcIm51bWJlclxcXCJdLCNtYl9hbm5vdW5jZW1lbnRzIGlucHV0W3R5cGU9XFxcIm51bWJlclxcXCJde3dpZHRoOjVlbX0jak1zZ3MsI2xNc2dzLCN0TXNncywjYU1zZ3N7Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMH0jak1zZ3Mgc21hbGwsI2xNc2dzIHNtYWxsLCN0TXNncyBzbWFsbCwjYU1zZ3Mgc21hbGx7Y29sb3I6Izc3N31cXG5cIjtcclxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG51aS5hZGRUYWJHcm91cCgnTWVzc2FnZXMnLCAnbWVzc2FnZXMnKTtcclxuXHJcbltcclxuICAgIHJlcXVpcmUoJy4vam9pbicpLFxyXG4gICAgcmVxdWlyZSgnLi9sZWF2ZScpLFxyXG4gICAgcmVxdWlyZSgnLi90cmlnZ2VyJyksXHJcbiAgICByZXF1aXJlKCcuL2Fubm91bmNlbWVudHMnKVxyXG5dLmZvckVhY2goKHt0YWIsIHNhdmUsIGFkZE1lc3NhZ2UsIHN0YXJ0fSkgPT4ge1xyXG4gICAgdGFiLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gY2hlY2tEZWxldGUoZXZlbnQpIHtcclxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0LnRhZ05hbWUgIT0gJ0EnKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVpLmFsZXJ0KCdSZWFsbHkgZGVsZXRlIHRoaXMgbWVzc2FnZT8nLCBbXHJcbiAgICAgICAgICAgIHt0ZXh0OiAnWWVzJywgc3R5bGU6ICdkYW5nZXInLCBhY3Rpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGVsID0gZXZlbnQudGFyZ2V0O1xyXG4gICAgICAgICAgICAgICAgd2hpbGUgKChlbCA9IGVsLnBhcmVudEVsZW1lbnQpICYmICFlbC5jbGFzc0xpc3QuY29udGFpbnMoJ2NvbHVtbicpKVxyXG4gICAgICAgICAgICAgICAgICAgIDtcclxuICAgICAgICAgICAgICAgIGVsLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2F2ZSgpO1xyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAge3RleHQ6ICdDYW5jZWwnfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGFiLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHNhdmUpO1xyXG5cclxuICAgIHRhYi5xdWVyeVNlbGVjdG9yKCcuYnV0dG9uLmlzLXByaW1hcnknKVxyXG4gICAgICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IGFkZE1lc3NhZ2UoKSk7XHJcblxyXG4gICAgLy8gRG9uJ3Qgc3RhcnQgcmVzcG9uZGluZyB0byBjaGF0IGZvciAxMCBzZWNvbmRzXHJcbiAgICBzZXRUaW1lb3V0KHN0YXJ0LCAxMDAwMCk7XHJcbn0pO1xyXG5cclxuW1xyXG4gICAgcmVxdWlyZSgnLi9qb2luJyksXHJcbiAgICByZXF1aXJlKCcuL2xlYXZlJyksXHJcbiAgICByZXF1aXJlKCcuL3RyaWdnZXInKVxyXG5dLmZvckVhY2goKHt0YWJ9KSA9PiB7XHJcbiAgICB0YWIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICB2YXIgZWwgPSBldmVudC50YXJnZXQ7XHJcbiAgICAgICAgd2hpbGUgKChlbCA9IGVsLnBhcmVudEVsZW1lbnQpICYmICFlbC5jbGFzc0xpc3QuY29udGFpbnMoJ2NvbHVtbicpKVxyXG4gICAgICAgICAgICA7XHJcblxyXG4gICAgICAgIGhlbHBlcnMuc2hvd1N1bW1hcnkoZWwpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcblxyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKCdtZXNzYWdlcy9oZWxwZXJzJyk7XHJcblxyXG5cclxuY29uc3QgU1RPUkFHRV9JRCA9ICdqb2luQXJyJztcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0pvaW4nLCAnbWVzc2FnZXMnKTtcclxudGFiLmlubmVySFRNTCA9IFwiPHRlbXBsYXRlIGlkPVxcXCJqVGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb2x1bW4gaXMtb25lLXRoaXJkLWRlc2t0b3AgaXMtaGFsZi10YWJsZXRcXFwiPlxcclxcbiAgICAgICAgPGRpdiBjbGFzcz1cXFwiYm94XFxcIj5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+IE1lc3NhZ2U6IDx0ZXh0YXJlYSBjbGFzcz1cXFwibVxcXCI+PC90ZXh0YXJlYT48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxkZXRhaWxzPjxzdW1tYXJ5Pk1vcmUgb3B0aW9ucyA8c21hbGwgY2xhc3M9XFxcInN1bW1hcnlcXFwiPjwvc21hbGw+PC9zdW1tYXJ5PlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzOiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJncm91cFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhbGxcXFwiPmFueW9uZTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwic3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJtb2RcXFwiPmEgbW9kPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPC9zZWxlY3Q+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzIG5vdDogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwibm90X2dyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm5vYm9keVxcXCI+bm9ib2R5PC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCIwXFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfbG93XFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHNwYW4+ICZsZTsgcGxheWVyIGpvaW5zICZsZTsgPC9zcGFuPlxcclxcbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiOTk5OVxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2hpZ2hcXFwiPlxcclxcbiAgICAgICAgICAgIDwvZGV0YWlscz5cXHJcXG4gICAgICAgICAgICA8YT5EZWxldGU8L2E+XFxyXFxuICAgICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9qb2luXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgICAgIDxoMz5UaGVzZSBhcmUgY2hlY2tlZCB3aGVuIGEgcGxheWVyIGpvaW5zIHRoZSBzZXJ2ZXIuPC9oMz5cXHJcXG4gICAgICAgIDxzcGFuPllvdSBjYW4gdXNlIHt7TmFtZX19LCB7e05BTUV9fSwge3tuYW1lfX0sIGFuZCB7e2lwfX0gaW4geW91ciBtZXNzYWdlLjwvc3Bhbj5cXHJcXG4gICAgPC9zZWN0aW9uPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJqTXNnc1xcXCIgY2xhc3M9XFxcImNvbHVtbnMgaXMtbXVsdGlsaW5lXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbiAgICBzdGFydDogKCkgPT4gaG9vay5vbignd29ybGQuam9pbicsIG9uSm9pbiksXHJcbn07XHJcblxyXG52YXIgam9pbk1lc3NhZ2VzID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10pO1xyXG5qb2luTWVzc2FnZXMuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcbkFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJyNqTXNncyA+IGRpdicpKVxyXG4gICAgLmZvckVhY2goaGVscGVycy5zaG93U3VtbWFyeSk7XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gYWRkIGEgdHJpZ2dlciBtZXNzYWdlIHRvIHRoZSBwYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkTWVzc2FnZShtc2cgPSB7fSkge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjalRlbXBsYXRlJywgJyNqTXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICdvcHRpb24nLCByZW1vdmU6IFsnc2VsZWN0ZWQnXSwgbXVsdGlwbGU6IHRydWV9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy5tJywgdGV4dDogbXNnLm1lc3NhZ2UgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScsIHZhbHVlOiBtc2cuam9pbnNfbG93IHx8IDB9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2hpZ2ggfHwgOTk5OX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cuZ3JvdXAgfHwgJ2FsbCd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXSBbdmFsdWU9XCIke21zZy5ub3RfZ3JvdXAgfHwgJ25vYm9keSd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9XHJcbiAgICBdKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2F2ZSB0aGUgdXNlcidzIG1lc3NhZ2VzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIGpvaW5NZXNzYWdlcyA9IFtdO1xyXG4gICAgQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI2pNc2dzID4gZGl2JykpLmZvckVhY2goY29udGFpbmVyID0+IHtcclxuICAgICAgICBpZiAoIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGpvaW5NZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2xvdzogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfaGlnaDogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGdyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgbm90X2dyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBqb2luTWVzc2FnZXMpO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBsaXN0ZW4gdG8gcGxheWVyIGpvaW5zXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqL1xyXG5mdW5jdGlvbiBvbkpvaW4obmFtZSkge1xyXG4gICAgam9pbk1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAoaGVscGVycy5jaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuXHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ2xlYXZlQXJyJztcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0xlYXZlJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjx0ZW1wbGF0ZSBpZD1cXFwibFRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY29sdW1uIGlzLW9uZS10aGlyZC1kZXNrdG9wIGlzLWhhbGYtdGFibGV0XFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPk1lc3NhZ2UgPHRleHRhcmVhIGNsYXNzPVxcXCJtXFxcIj48L3RleHRhcmVhPjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGRldGFpbHM+PHN1bW1hcnk+TW9yZSBvcHRpb25zIDxzbWFsbCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+PC9zbWFsbD48L3N1bW1hcnk+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXM6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcImdyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFsbFxcXCI+YW55b25lPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXMgbm90OiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJub3RfZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibm9ib2R5XFxcIj5ub2JvZHk8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcInN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJvd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjBcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19sb3dcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3Bhbj4gJmxlOyBwbGF5ZXIgam9pbnMgJmxlOyA8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCI5OTk5XFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfaGlnaFxcXCI+XFxyXFxuICAgICAgICAgICAgPC9kZXRhaWxzPlxcclxcbiAgICAgICAgICAgIDxhPkRlbGV0ZTwvYT5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2xlYXZlXFxcIiBjbGFzcz1cXFwiY29udGFpbmVyIGlzLWZsdWlkXFxcIj5cXHJcXG4gICAgPHNlY3Rpb24gY2xhc3M9XFxcInNlY3Rpb24gaXMtc21hbGxcXFwiPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcImJ1dHRvbiBpcy1wcmltYXJ5IGlzLXB1bGxlZC1yaWdodFxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgICAgIDxoMz5UaGVzZSBhcmUgY2hlY2tlZCB3aGVuIGEgcGxheWVyIGxlYXZlcyB0aGUgc2VydmVyLjwvaDM+XFxyXFxuICAgICAgICA8c3Bhbj5Zb3UgY2FuIHVzZSB7e05hbWV9fSwge3tOQU1FfX0sIHt7bmFtZX19LCBhbmQge3tpcH19IGluIHlvdXIgbWVzc2FnZS48L3NwYW4+XFxyXFxuICAgIDwvc2VjdGlvbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwibE1zZ3NcXFwiIGNsYXNzPVxcXCJjb2x1bW5zIGlzLW11bHRpbGluZVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGhvb2sub24oJ3dvcmxkLmxlYXZlJywgb25MZWF2ZSksXHJcbn07XHJcblxyXG52YXIgbGVhdmVNZXNzYWdlcyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdKTtcclxubGVhdmVNZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5cclxuQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI2xNc2dzID4gZGl2JykpXHJcbiAgICAuZm9yRWFjaChoZWxwZXJzLnNob3dTdW1tYXJ5KTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgbGVhdmUgbWVzc2FnZSB0byB0aGUgcGFnZS5cclxuICovXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UobXNnID0ge30pIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2xUZW1wbGF0ZScsICcjbE1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnb3B0aW9uJywgcmVtb3ZlOiBbJ3NlbGVjdGVkJ10sIG11bHRpcGxlOiB0cnVlfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IG1zZy5tZXNzYWdlIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdhbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdub2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhdmUgdGhlIGN1cnJlbnQgbGVhdmUgbWVzc2FnZXNcclxuICovXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICBsZWF2ZU1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjbE1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGVhdmVNZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2xvdzogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfaGlnaDogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGdyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgbm90X2dyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBsZWF2ZU1lc3NhZ2VzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gbGlzdGVuIHRvIHBsYXllciBkaXNjb25uZWN0aW9ucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIHBsYXllciBsZWF2aW5nLlxyXG4gKi9cclxuZnVuY3Rpb24gb25MZWF2ZShuYW1lKSB7XHJcbiAgICBsZWF2ZU1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAoaGVscGVycy5jaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuY29uc3Qgc2V0dGluZ3MgPSByZXF1aXJlKCdzZXR0aW5ncycpO1xyXG5cclxuXHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAndHJpZ2dlckFycic7XHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdUcmlnZ2VyJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjx0ZW1wbGF0ZSBpZD1cXFwidFRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY29sdW1uIGlzLW9uZS10aGlyZC1kZXNrdG9wIGlzLWhhbGYtdGFibGV0XFxcIj5cXHJcXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImJveFxcXCI+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPlRyaWdnZXI6IDxpbnB1dCBjbGFzcz1cXFwidFxcXCI+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+TWVzc2FnZTogPHRleHRhcmVhIGNsYXNzPVxcXCJtXFxcIj48L3RleHRhcmVhPjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGRldGFpbHM+PHN1bW1hcnk+TW9yZSBvcHRpb25zIDxzbWFsbCBjbGFzcz1cXFwic3VtbWFyeVxcXCI+PC9zbWFsbD48L3N1bW1hcnk+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXM6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcImdyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFsbFxcXCI+YW55b25lPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXMgbm90OiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJub3RfZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibm9ib2R5XFxcIj5ub2JvZHk8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcInN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJvd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjBcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19sb3dcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3Bhbj4gJmxlOyBwbGF5ZXIgam9pbnMgJmxlOyA8L3NwYW4+XFxyXFxuICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCI5OTk5XFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfaGlnaFxcXCI+XFxyXFxuICAgICAgICAgICAgPC9kZXRhaWxzPlxcclxcbiAgICAgICAgICAgIDxhPkRlbGV0ZTwvYT5cXHJcXG4gICAgICAgIDwvZGl2PlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX3RyaWdnZXJcXFwiIGNsYXNzPVxcXCJjb250YWluZXIgaXMtZmx1aWRcXFwiPlxcclxcbiAgICA8c2VjdGlvbiBjbGFzcz1cXFwic2VjdGlvbiBpcy1zbWFsbFxcXCI+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwiYnV0dG9uIGlzLXByaW1hcnkgaXMtcHVsbGVkLXJpZ2h0XFxcIj4rPC9zcGFuPlxcclxcbiAgICAgICAgPGgzPlRoZXNlIGFyZSBjaGVja2VkIHdoZW5ldmVyIHNvbWVvbmUgc2F5cyBzb21ldGhpbmcuPC9oMz5cXHJcXG4gICAgICAgIDxzcGFuPllvdSBjYW4gdXNlIHt7TmFtZX19LCB7e05BTUV9fSwge3tuYW1lfX0sIGFuZCB7e2lwfX0gaW4geW91ciBtZXNzYWdlLiBJZiB5b3UgcHV0IGFuIGFzdGVyaXNrICgqKSBpbiB5b3VyIHRyaWdnZXIsIGl0IHdpbGwgYmUgdHJlYXRlZCBhcyBhIHdpbGRjYXJkLiAoVHJpZ2dlciBcXFwidGUqc3RcXFwiIHdpbGwgbWF0Y2ggXFxcInRlYSBzdHVmZlxcXCIgYW5kIFxcXCJ0ZXN0XFxcIik8L3NwYW4+XFxyXFxuICAgIDwvc2VjdGlvbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwidE1zZ3NcXFwiIGNsYXNzPVxcXCJjb2x1bW5zIGlzLW11bHRpbGluZVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGhvb2sub24oJ3dvcmxkLm1lc3NhZ2UnLCBjaGVja1RyaWdnZXJzKSxcclxufTtcclxuXHJcbnZhciB0cmlnZ2VyTWVzc2FnZXMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSk7XHJcbnRyaWdnZXJNZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5BcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjdE1zZ3MgPiBkaXYnKSlcclxuICAgIC5mb3JFYWNoKGhlbHBlcnMuc2hvd1N1bW1hcnkpO1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYSB0cmlnZ2VyIG1lc3NhZ2UgdG8gdGhlIHBhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKG1zZyA9IHt9KSB7XHJcbiAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyN0VGVtcGxhdGUnLCAnI3RNc2dzJywgW1xyXG4gICAgICAgIHtzZWxlY3RvcjogJ29wdGlvbicsIHJlbW92ZTogWydzZWxlY3RlZCddLCBtdWx0aXBsZTogdHJ1ZX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLm0nLCB0ZXh0OiBtc2cubWVzc2FnZSB8fCAnJ30sXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLnQnLCB2YWx1ZTogbXNnLnRyaWdnZXIgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScsIHZhbHVlOiBtc2cuam9pbnNfbG93IHx8IDB9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2hpZ2ggfHwgOTk5OX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cuZ3JvdXAgfHwgJ2FsbCd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXSBbdmFsdWU9XCIke21zZy5ub3RfZ3JvdXAgfHwgJ25vYm9keSd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9XHJcbiAgICBdKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNhdmVzIHRoZSBjdXJyZW50IHRyaWdnZXIgbWVzc2FnZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzYXZlKCkge1xyXG4gICAgdHJpZ2dlck1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjdE1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUgfHwgIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcudCcpLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyaWdnZXJNZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIHRyaWdnZXI6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcudCcpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19sb3c6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2hpZ2g6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImdyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIG5vdF9ncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgdHJpZ2dlck1lc3NhZ2VzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBhIHRyaWdnZXIgYWdhaW5zdCBhIG1lc3NhZ2UgdG8gc2VlIGlmIGl0IG1hdGNoZXMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0cmlnZ2VyIHRoZSB0cmlnZ2VyIHRvIHRyeSB0byBtYXRjaFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxyXG4gKi9cclxuZnVuY3Rpb24gdHJpZ2dlck1hdGNoKHRyaWdnZXIsIG1lc3NhZ2UpIHtcclxuICAgIGlmIChzZXR0aW5ncy5yZWdleFRyaWdnZXJzKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAodHJpZ2dlciwgJ2knKS50ZXN0KG1lc3NhZ2UpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgdWkubm90aWZ5KGBTa2lwcGluZyB0cmlnZ2VyICcke3RyaWdnZXJ9JyBhcyB0aGUgUmVnRXggaXMgaW52YWlsZC5gKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBuZXcgUmVnRXhwKFxyXG4gICAgICAgICAgICB0cmlnZ2VyXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvKFsuKz9ePSE6JHt9KCl8XFxbXFxdXFwvXFxcXF0pL2csIFwiXFxcXCQxXCIpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwqL2csIFwiLipcIiksXHJcbiAgICAgICAgICAgICdpJ1xyXG4gICAgICAgICkudGVzdChtZXNzYWdlKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgaW5jb21pbmcgcGxheWVyIG1lc3NhZ2VzIGZvciB0cmlnZ2Vyc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgcGxheWVyJ3MgbmFtZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tUcmlnZ2VycyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICB2YXIgdG90YWxBbGxvd2VkID0gc2V0dGluZ3MubWF4UmVzcG9uc2VzO1xyXG4gICAgdHJpZ2dlck1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAodG90YWxBbGxvd2VkICYmIGhlbHBlcnMuY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykgJiYgdHJpZ2dlck1hdGNoKG1zZy50cmlnZ2VyLCBtZXNzYWdlKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgICAgICB0b3RhbEFsbG93ZWQtLTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgU1RPUkFHRV9JRCA9ICdtYl9wcmVmZXJlbmNlcyc7XHJcblxyXG52YXIgcHJlZnMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCB7fSwgZmFsc2UpO1xyXG5cclxuLy8gQXV0byBzYXZlIG9uIGNoYW5nZVxyXG4vLyBJRSAoYWxsKSAvIFNhZmFyaSAoPCAxMCkgZG9lc24ndCBzdXBwb3J0IHByb3hpZXNcclxuaWYgKHR5cGVvZiBQcm94eSA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBwcmVmcztcclxuICAgIHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIHByZWZzLCBmYWxzZSk7XHJcbiAgICB9LCAzMCAqIDEwMDApO1xyXG59IGVsc2Uge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBuZXcgUHJveHkocHJlZnMsIHtcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKG9iaiwgcHJvcCwgdmFsKSB7XHJcbiAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkpIHtcclxuICAgICAgICAgICAgICAgIG9ialtwcm9wXSA9IHZhbDtcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIHByZWZzLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnZhciBwcmVmc01hcCA9IFtcclxuICAgIHt0eXBlOiAnbnVtYmVyJywga2V5OiAnYW5ub3VuY2VtZW50RGVsYXknLCBkZWZhdWx0OiAxMH0sXHJcbiAgICB7dHlwZTogJ251bWJlcicsIGtleTogJ21heFJlc3BvbnNlcycsIGRlZmF1bHQ6IDJ9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnbm90aWZ5JywgZGVmYXVsdDogdHJ1ZX0sXHJcbiAgICAvLyBBZHZhbmNlZFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnZGlzYWJsZVRyaW0nLCBkZWZhdWx0OiBmYWxzZX0sXHJcbiAgICB7dHlwZTogJ2Jvb2xlYW4nLCBrZXk6ICdyZWdleFRyaWdnZXJzJywgZGVmYXVsdDogZmFsc2V9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAnc3BsaXRNZXNzYWdlcycsIGRlZmF1bHQ6IGZhbHNlfSxcclxuICAgIHt0eXBlOiAndGV4dCcsIGtleTogJ3NwbGl0VG9rZW4nLCBkZWZhdWx0OiAnPHNwbGl0Pid9LFxyXG5dO1xyXG5cclxucHJlZnNNYXAuZm9yRWFjaChwcmVmID0+IHtcclxuICAgIC8vIFNldCBkZWZhdWx0cyBpZiBub3Qgc2V0XHJcbiAgICBpZiAodHlwZW9mIHByZWZzW3ByZWYua2V5XSAhPSAgcHJlZi50eXBlKSB7XHJcbiAgICAgICAgcHJlZnNbcHJlZi5rZXldID0gcHJlZi5kZWZhdWx0O1xyXG4gICAgfVxyXG59KTtcclxuIiwiY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5jb25zdCBwcmVmcyA9IHJlcXVpcmUoJ3NldHRpbmdzJyk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignU2V0dGluZ3MnKTtcclxudGFiLmlubmVySFRNTCA9ICc8c3R5bGU+JyArXHJcbiAgICBcIiNtYl9zZXR0aW5ncyBoM3tib3JkZXItYm90dG9tOjFweCBzb2xpZCAjOTk5fVxcblwiICtcclxuICAgICc8L3N0eWxlPicgK1xyXG4gICAgXCI8ZGl2IGlkPVxcXCJtYl9zZXR0aW5nc1xcXCI+XFxyXFxuICAgIDxoMz5TZXR0aW5nczwvaDM+XFxyXFxuICAgIDxsYWJlbD5NaW51dGVzIGJldHdlZW4gYW5ub3VuY2VtZW50czo8L2xhYmVsPjxicj5cXHJcXG4gICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwiYW5ub3VuY2VtZW50RGVsYXlcXFwiIHR5cGU9XFxcIm51bWJlclxcXCI+PGJyPlxcclxcbiAgICA8bGFiZWw+TWF4aW11bSB0cmlnZ2VyIHJlc3BvbnNlcyB0byBhIG1lc3NhZ2U6PC9sYWJlbD48YnI+XFxyXFxuICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcIm1heFJlc3BvbnNlc1xcXCIgdHlwZT1cXFwibnVtYmVyXFxcIj48YnI+XFxyXFxuICAgIDxsYWJlbD5OZXcgY2hhdCBub3RpZmljYXRpb25zOiA8L2xhYmVsPlxcclxcbiAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJub3RpZnlcXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIj48YnI+XFxyXFxuXFxyXFxuICAgIDxoMz5BZHZhbmNlZCBTZXR0aW5ncyAtIDxzbWFsbD48YSBocmVmPVxcXCJodHRwczovL2dpdGh1Yi5jb20vQmlibGlvZmlsZS9CbG9ja2hlYWRzLU1lc3NhZ2VCb3Qvd2lraS8xLi1BZHZhbmNlZC1PcHRpb25zL1xcXCIgdGFyZ2V0PVxcXCJfYmxhbmtcXFwiPlJlYWQgdGhpcyBmaXJzdDwvYT48L3NtYWxsPjwvaDM+XFxyXFxuICAgIDxsYWJlbD5EaXNhYmxlIHdoaXRlc3BhY2UgdHJpbW1pbmc6IDwvbGFiZWw+XFxyXFxuICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcImRpc2FibGVUcmltXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+PGJyPlxcclxcbiAgICA8bGFiZWw+UGFyc2UgdHJpZ2dlcnMgYXMgUmVnRXg6IDwvbGFiZWw+XFxyXFxuICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcInJlZ2V4VHJpZ2dlcnNcXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIj48YnI+XFxyXFxuICAgIDxsYWJlbD5TcGxpdCBtZXNzYWdlczogPC9sYWJlbD5cXHJcXG4gICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwic3BsaXRNZXNzYWdlc1xcXCIgdHlwZT1cXFwiY2hlY2tib3hcXFwiPjxicj5cXHJcXG4gICAgPGxhYmVsPlNwbGl0IHRva2VuOiA8L2xhYmVsPjxicj5cXHJcXG4gICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwic3BsaXRUb2tlblxcXCIgdHlwZT1cXFwidGV4dFxcXCI+XFxyXFxuXFxyXFxuICAgIDxoMz5CYWNrdXAgLyBSZXN0b3JlPC9oMz5cXHJcXG4gICAgPGEgaWQ9XFxcIm1iX2JhY2t1cF9zYXZlXFxcIj5HZXQgYmFja3VwIGNvZGU8L2E+PGJyPlxcclxcbiAgICA8YSBpZD1cXFwibWJfYmFja3VwX2xvYWRcXFwiPkxvYWQgcHJldmlvdXMgYmFja3VwPC9hPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJtYl9iYWNrdXBcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxuLy8gU2hvdyBwcmVmc1xyXG5PYmplY3Qua2V5cyhwcmVmcykuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgdmFyIGVsID0gdGFiLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWtleT1cIiR7a2V5fVwiXWApO1xyXG4gICAgc3dpdGNoICh0eXBlb2YgcHJlZnNba2V5XSkge1xyXG4gICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxyXG4gICAgICAgICAgICBlbC5jaGVja2VkID0gcHJlZnNba2V5XTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgZWwudmFsdWUgPSBwcmVmc1trZXldO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG4vLyBXYXRjaCBmb3IgY2hhbmdlc1xyXG50YWIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIHZhciBnZXRWYWx1ZSA9IChrZXkpID0+IHRhYi5xdWVyeVNlbGVjdG9yKGBbZGF0YS1rZXk9XCIke2tleX1cIl1gKS52YWx1ZTtcclxuICAgIHZhciBnZXRJbnQgPSAoa2V5KSA9PiArZ2V0VmFsdWUoa2V5KTtcclxuICAgIHZhciBnZXRDaGVja2VkID0gKGtleSkgPT4gdGFiLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWtleT1cIiR7a2V5fVwiXWApLmNoZWNrZWQ7XHJcblxyXG4gICAgT2JqZWN0LmtleXMocHJlZnMpLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICB2YXIgZnVuYztcclxuXHJcbiAgICAgICAgc3dpdGNoKHR5cGVvZiBwcmVmc1trZXldKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxyXG4gICAgICAgICAgICAgICAgZnVuYyA9IGdldENoZWNrZWQ7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSBnZXRJbnQ7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSBnZXRWYWx1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHByZWZzW2tleV0gPSBmdW5jKGtleSk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5cclxuLy8gR2V0IGJhY2t1cFxyXG50YWIucXVlcnlTZWxlY3RvcignI21iX2JhY2t1cF9zYXZlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBzaG93QmFja3VwKCkge1xyXG4gICAgdmFyIGJhY2t1cCA9IEpTT04uc3RyaW5naWZ5KGxvY2FsU3RvcmFnZSkucmVwbGFjZSgvPC9nLCAnJmx0OycpO1xyXG4gICAgdWkuYWxlcnQoYENvcHkgdGhpcyB0byBhIHNhZmUgcGxhY2U6PGJyPjx0ZXh0YXJlYSBzdHlsZT1cIndpZHRoOiBjYWxjKDEwMCUgLSA3cHgpO2hlaWdodDoxNjBweDtcIj4ke2JhY2t1cH08L3RleHRhcmVhPmApO1xyXG59KTtcclxuXHJcblxyXG4vLyBMb2FkIGJhY2t1cFxyXG50YWIucXVlcnlTZWxlY3RvcignI21iX2JhY2t1cF9sb2FkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBsb2FkQmFja3VwKCkge1xyXG4gICAgdWkuYWxlcnQoJ0VudGVyIHRoZSBiYWNrdXAgY29kZTo8dGV4dGFyZWEgc3R5bGU9XCJ3aWR0aDpjYWxjKDEwMCUgLSA3cHgpO2hlaWdodDoxNjBweDtcIj48L3RleHRhcmVhPicsXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgeyB0ZXh0OiAnTG9hZCAmIHJlZnJlc2ggcGFnZScsIHN0eWxlOiAnc3VjY2VzcycsIGFjdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IHRleHRhcmVhJykudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlID0gSlNPTi5wYXJzZShjb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJhY2t1cCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1aS5ub3RpZnkoJ0ludmFsaWQgYmFja3VwIGNvZGUuIE5vIGFjdGlvbiB0YWtlbi4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLmNsZWFyKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb2RlKS5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgY29kZVtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyB0ZXh0OiAnQ2FuY2VsJyB9XHJcbiAgICAgICAgICAgICAgICBdKTtcclxufSk7XHJcbiIsIi8vIE92ZXJ3cml0ZSB0aGUgcG9sbENoYXQgZnVuY3Rpb24gdG8ga2lsbCB0aGUgZGVmYXVsdCBjaGF0IGZ1bmN0aW9uXHJcbndpbmRvdy5wb2xsQ2hhdCA9IGZ1bmN0aW9uKCkge307XHJcblxyXG4vLyBPdmVyd3JpdGUgdGhlIG9sZCBwYWdlXHJcbmRvY3VtZW50LmJvZHkuaW5uZXJIVE1MID0gJyc7XHJcbi8vIFN0eWxlIHJlc2V0XHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1t0eXBlPVwidGV4dC9jc3NcIl0nKVxyXG4gICAgLmZvckVhY2goZWwgPT4gZWwucmVtb3ZlKCkpO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcigndGl0bGUnKS50ZXh0Q29udGVudCA9ICdDb25zb2xlIC0gTWVzc2FnZUJvdCc7XHJcblxyXG4vLyBTZXQgdGhlIGljb24gdG8gdGhlIGJsb2NraGVhZCBpY29uIHVzZWQgb24gdGhlIGZvcnVtc1xyXG52YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XHJcbmVsLnJlbCA9ICdpY29uJztcclxuZWwuaHJlZiA9ICdodHRwczovL2lzLmdkL01CdlVIRic7XHJcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxucmVxdWlyZSgnY29uc29sZS1icm93c2VyaWZ5Jyk7XHJcbnJlcXVpcmUoJ2JvdC9taWdyYXRpb24nKTtcclxuXHJcbi8vIEV4cG9zZSB0aGUgZXh0ZW5zaW9uIEFQSVxyXG53aW5kb3cuTWVzc2FnZUJvdEV4dGVuc2lvbiA9IHJlcXVpcmUoJ01lc3NhZ2VCb3RFeHRlbnNpb24nKTtcclxuXHJcbmNvbnN0IGJoZmFuc2FwaSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9iaGZhbnNhcGknKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuaG9vay5vbignZXJyb3JfcmVwb3J0JywgZnVuY3Rpb24obXNnKSB7XHJcbiAgICB1aS5ub3RpZnkobXNnKTtcclxufSk7XHJcblxyXG5cclxucmVxdWlyZSgnLi9jb25zb2xlJyk7XHJcbi8vIEJ5IGRlZmF1bHQgbm8gdGFiIGlzIHNlbGVjdGVkLCBzaG93IHRoZSBjb25zb2xlLlxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubmF2LXNsaWRlci1jb250YWluZXIgc3BhbicpLmNsaWNrKCk7XHJcbnJlcXVpcmUoJ21lc3NhZ2VzJyk7XHJcbnJlcXVpcmUoJ2V4dGVuc2lvbnMnKTtcclxucmVxdWlyZSgnc2V0dGluZ3MvcGFnZScpO1xyXG5cclxuLy8gRXJyb3IgcmVwb3J0aW5nXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIChlcnIpID0+IHtcclxuICAgIGlmIChbJ1NjcmlwdCBlcnJvcicsICdXb3JsZCBub3QgcnVubmluZyddLmluY2x1ZGVzKGVyci5tZXNzYWdlKSkge1xyXG4gICAgICAgIGJoZmFuc2FwaS5yZXBvcnRFcnJvcihlcnIpO1xyXG4gICAgfVxyXG59KTtcclxuIiwicmVxdWlyZSgnLi9wb2x5ZmlsbHMvZGV0YWlscycpO1xyXG5cclxuLy8gQnVpbGQgdGhlIEFQSVxyXG5PYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2xheW91dCcpLFxyXG4gICAgcmVxdWlyZSgnLi90ZW1wbGF0ZScpLFxyXG4gICAgcmVxdWlyZSgnLi9ub3RpZmljYXRpb25zJylcclxuKTtcclxuXHJcbi8vIEZ1bmN0aW9ucyB3aGljaCBhcmUgbm8gbG9uZ2VyIGNvbnRhaW5lZCBpbiB0aGlzIG1vZHVsZSwgYnV0IGFyZSByZXRhaW5lZCBmb3Igbm93IGZvciBiYWNrd2FyZCBjb21wYXRhYmlsaXR5LlxyXG5jb25zdCB3cml0ZSA9IHJlcXVpcmUoJy4uL2NvbnNvbGUvZXhwb3J0cycpLndyaXRlO1xyXG5tb2R1bGUuZXhwb3J0cy5hZGRNZXNzYWdlVG9Db25zb2xlID0gZnVuY3Rpb24obXNnLCBuYW1lID0gJycsIG5hbWVDbGFzcyA9ICcnKSB7XHJcbiAgICBjb25zb2xlLndhcm4oJ3VpLmFkZE1lc3NhZ2VUb0NvbnNvbGUgaGFzIGJlZW4gZGVwcmljYXRlZC4gVXNlIGV4LmNvbnNvbGUud3JpdGUgaW5zdGVhZC4nKTtcclxuICAgIHdyaXRlKG1zZywgbmFtZSwgbmFtZUNsYXNzKTtcclxufTtcclxuIiwiLyoqXHJcbiAqIEBmaWxlIENvbnRhaW5zIGZ1bmN0aW9ucyBmb3IgbWFuYWdpbmcgdGhlIHBhZ2UgbGF5b3V0XHJcbiAqL1xyXG5cclxuXHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5cclxuLy8gQnVpbGQgcGFnZSAtIG9ubHkgY2FzZSBpbiB3aGljaCBib2R5LmlubmVySFRNTCBzaG91bGQgYmUgdXNlZC5cclxuZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgKz0gXCI8aGVhZGVyIGNsYXNzPVxcXCJoZWFkZXIgaXMtZml4ZWQtdG9wXFxcIj5cXHJcXG4gIDxuYXYgY2xhc3M9XFxcIm5hdi1pbnZlcnNlIG5hdiBoYXMtc2hhZG93XFxcIj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwibmF2LWxlZnRcXFwiPlxcclxcbiAgICAgIDxkaXYgY2xhc3M9XFxcIm5hdi1pdGVtIG5hdi1zbGlkZXItdG9nZ2xlXFxcIj5cXHJcXG4gICAgICAgIDxpbWcgc3JjPVxcXCJodHRwczovL2kuaW1nc2FmZS5vcmcvODBhMTEyOWEzNi5wbmdcXFwiPlxcclxcbiAgICAgIDwvZGl2PlxcclxcbiAgICAgIDxhIGNsYXNzPVxcXCJuYXYtaXRlbSBpcy10YWIgbmF2LXNsaWRlci10b2dnbGVcXFwiPlxcclxcbiAgICAgICAgTWVudVxcclxcbiAgICAgIDwvYT5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICA8L25hdj5cXHJcXG48L2hlYWRlcj5cXHJcXG5cXHJcXG48ZGl2IGNsYXNzPVxcXCJuYXYtc2xpZGVyLWNvbnRhaW5lclxcXCI+XFxyXFxuICAgIDxuYXYgY2xhc3M9XFxcIm5hdi1zbGlkZXJcXFwiIGRhdGEtdGFiLWdyb3VwPVxcXCJtYWluXFxcIj48L25hdj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwib3ZlcmxheVxcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXFxyXFxuPGRpdiBpZD1cXFwiY29udGFpbmVyXFxcIiBjbGFzcz1cXFwiaGFzLWZpeGVkLW5hdlxcXCI+PC9kaXY+XFxyXFxuXCI7XHJcbmRvY3VtZW50LmhlYWQuaW5uZXJIVE1MICs9ICc8c3R5bGU+JyArXHJcbiAgICBcImh0bWx7b3ZlcmZsb3cteTphdXRvICFpbXBvcnRhbnR9LyohIGJ1bG1hLmlvIHYwLjMuMSB8IE1JVCBMaWNlbnNlIHwgZ2l0aHViLmNvbS9qZ3RobXMvYnVsbWEgKi9Aa2V5ZnJhbWVzIHNwaW5Bcm91bmR7ZnJvbXt0cmFuc2Zvcm06cm90YXRlKDBkZWcpfXRve3RyYW5zZm9ybTpyb3RhdGUoMzU5ZGVnKX19LyohIG1pbmlyZXNldC5jc3MgdjAuMC4yIHwgTUlUIExpY2Vuc2UgfCBnaXRodWIuY29tL2pndGhtcy9taW5pcmVzZXQuY3NzICovaHRtbCxib2R5LHAsb2wsdWwsbGksZGwsZHQsZGQsYmxvY2txdW90ZSxmaWd1cmUsZmllbGRzZXQsbGVnZW5kLHRleHRhcmVhLHByZSxpZnJhbWUsaHIsaDEsaDIsaDMsaDQsaDUsaDZ7bWFyZ2luOjA7cGFkZGluZzowfWgxLGgyLGgzLGg0LGg1LGg2e2ZvbnQtc2l6ZToxMDAlO2ZvbnQtd2VpZ2h0Om5vcm1hbH11bHtsaXN0LXN0eWxlOm5vbmV9YnV0dG9uLGlucHV0LHNlbGVjdCx0ZXh0YXJlYXttYXJnaW46MH1odG1se2JveC1zaXppbmc6Ym9yZGVyLWJveH0qe2JveC1zaXppbmc6aW5oZXJpdH0qOmJlZm9yZSwqOmFmdGVye2JveC1zaXppbmc6aW5oZXJpdH1pbWcsZW1iZWQsb2JqZWN0LGF1ZGlvLHZpZGVve2hlaWdodDphdXRvO21heC13aWR0aDoxMDAlfWlmcmFtZXtib3JkZXI6MH10YWJsZXtib3JkZXItY29sbGFwc2U6Y29sbGFwc2U7Ym9yZGVyLXNwYWNpbmc6MH10ZCx0aHtwYWRkaW5nOjA7dGV4dC1hbGlnbjpsZWZ0fWh0bWx7YmFja2dyb3VuZC1jb2xvcjojZmZmO2ZvbnQtc2l6ZToxNHB4Oy1tb3otb3N4LWZvbnQtc21vb3RoaW5nOmdyYXlzY2FsZTstd2Via2l0LWZvbnQtc21vb3RoaW5nOmFudGlhbGlhc2VkO21pbi13aWR0aDozMDBweDtvdmVyZmxvdy14OmhpZGRlbjtvdmVyZmxvdy15OnNjcm9sbDt0ZXh0LXJlbmRlcmluZzpvcHRpbWl6ZUxlZ2liaWxpdHl9YXJ0aWNsZSxhc2lkZSxmaWd1cmUsZm9vdGVyLGhlYWRlcixoZ3JvdXAsc2VjdGlvbntkaXNwbGF5OmJsb2NrfWJvZHksYnV0dG9uLGlucHV0LHNlbGVjdCx0ZXh0YXJlYXtmb250LWZhbWlseTpcXFwiTHVjaWRhIEdyYW5kZVxcXCIsXFxcIkx1Y2lkYSBTYW5zIFVuaWNvZGVcXFwiLFZlcmRhbmEsc2Fucy1zZXJpZn1jb2RlLHByZXstbW96LW9zeC1mb250LXNtb290aGluZzphdXRvOy13ZWJraXQtZm9udC1zbW9vdGhpbmc6YXV0bztmb250LWZhbWlseTpcXFwiSW5jb25zb2xhdGFcXFwiLFxcXCJDb25zb2xhc1xcXCIsXFxcIk1vbmFjb1xcXCIsbW9ub3NwYWNlfWJvZHl7Y29sb3I6IzRhNGE0YTtmb250LXNpemU6MXJlbTtmb250LXdlaWdodDo0MDA7bGluZS1oZWlnaHQ6MS41fWF7Y29sb3I6IzE4MmI3MztjdXJzb3I6cG9pbnRlcjt0ZXh0LWRlY29yYXRpb246bm9uZTt0cmFuc2l0aW9uOm5vbmUgODZtcyBlYXNlLW91dH1hOmhvdmVye2NvbG9yOiMzNjM2MzZ9Y29kZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6cmVkO2ZvbnQtc2l6ZTowLjhlbTtmb250LXdlaWdodDpub3JtYWw7cGFkZGluZzowLjI1ZW0gMC41ZW0gMC4yNWVtfWhye2JhY2tncm91bmQtY29sb3I6I2RiZGJkYjtib3JkZXI6bm9uZTtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcHg7bWFyZ2luOjEuNXJlbSAwfWltZ3ttYXgtd2lkdGg6MTAwJX1pbnB1dFt0eXBlPVxcXCJjaGVja2JveFxcXCJdLGlucHV0W3R5cGU9XFxcInJhZGlvXFxcIl17dmVydGljYWwtYWxpZ246YmFzZWxpbmV9c21hbGx7Zm9udC1zaXplOjAuOGVtfXNwYW57Zm9udC1zdHlsZTppbmhlcml0O2ZvbnQtd2VpZ2h0OmluaGVyaXR9c3Ryb25ne2NvbG9yOiMzNjM2MzY7Zm9udC13ZWlnaHQ6NzAwfXByZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzRhNGE0YTtmb250LXNpemU6MC44ZW07d2hpdGUtc3BhY2U6cHJlO3dvcmQtd3JhcDpub3JtYWx9cHJlIGNvZGV7YmFja2dyb3VuZDpub25lO2NvbG9yOmluaGVyaXQ7ZGlzcGxheTpibG9jaztmb250LXNpemU6MWVtO292ZXJmbG93LXg6YXV0bztwYWRkaW5nOjEuMjVyZW0gMS41cmVtfXRhYmxle3dpZHRoOjEwMCV9dGFibGUgdGQsdGFibGUgdGh7dGV4dC1hbGlnbjpsZWZ0O3ZlcnRpY2FsLWFsaWduOnRvcH10YWJsZSB0aHtjb2xvcjojMzYzNjM2fS5pcy1ibG9ja3tkaXNwbGF5OmJsb2NrfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtYmxvY2stbW9iaWxle2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5pcy1ibG9jay10YWJsZXR7ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtYmxvY2stdGFibGV0LW9ubHl7ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWJsb2NrLXRvdWNoe2Rpc3BsYXk6YmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuaXMtYmxvY2stZGVza3RvcHtkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCkgYW5kIChtYXgtd2lkdGg6IDExOTFweCl7LmlzLWJsb2NrLWRlc2t0b3Atb25seXtkaXNwbGF5OmJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWJsb2NrLXdpZGVzY3JlZW57ZGlzcGxheTpibG9jayAhaW1wb3J0YW50fX0uaXMtZmxleHtkaXNwbGF5OmZsZXh9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1mbGV4LW1vYmlsZXtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5pcy1mbGV4LXRhYmxldHtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWZsZXgtdGFibGV0LW9ubHl7ZGlzcGxheTpmbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtZmxleC10b3VjaHtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuaXMtZmxleC1kZXNrdG9we2Rpc3BsYXk6ZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpIGFuZCAobWF4LXdpZHRoOiAxMTkxcHgpey5pcy1mbGV4LWRlc2t0b3Atb25seXtkaXNwbGF5OmZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtZmxleC13aWRlc2NyZWVue2Rpc3BsYXk6ZmxleCAhaW1wb3J0YW50fX0uaXMtaW5saW5le2Rpc3BsYXk6aW5saW5lfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaXMtaW5saW5lLW1vYmlsZXtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmlzLWlubGluZS10YWJsZXR7ZGlzcGxheTppbmxpbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWlubGluZS10YWJsZXQtb25seXtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTlweCl7LmlzLWlubGluZS10b3VjaHtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5pcy1pbmxpbmUtZGVza3RvcHtkaXNwbGF5OmlubGluZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpIGFuZCAobWF4LXdpZHRoOiAxMTkxcHgpey5pcy1pbmxpbmUtZGVza3RvcC1vbmx5e2Rpc3BsYXk6aW5saW5lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmlzLWlubGluZS13aWRlc2NyZWVue2Rpc3BsYXk6aW5saW5lICFpbXBvcnRhbnR9fS5pcy1pbmxpbmUtYmxvY2t7ZGlzcGxheTppbmxpbmUtYmxvY2t9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1pbmxpbmUtYmxvY2stbW9iaWxle2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuaXMtaW5saW5lLWJsb2NrLXRhYmxldHtkaXNwbGF5OmlubGluZS1ibG9jayAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCkgYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaW5saW5lLWJsb2NrLXRhYmxldC1vbmx5e2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaW5saW5lLWJsb2NrLXRvdWNoe2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmlzLWlubGluZS1ibG9jay1kZXNrdG9we2Rpc3BsYXk6aW5saW5lLWJsb2NrICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCkgYW5kIChtYXgtd2lkdGg6IDExOTFweCl7LmlzLWlubGluZS1ibG9jay1kZXNrdG9wLW9ubHl7ZGlzcGxheTppbmxpbmUtYmxvY2sgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtaW5saW5lLWJsb2NrLXdpZGVzY3JlZW57ZGlzcGxheTppbmxpbmUtYmxvY2sgIWltcG9ydGFudH19LmlzLWlubGluZS1mbGV4e2Rpc3BsYXk6aW5saW5lLWZsZXh9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1pbmxpbmUtZmxleC1tb2JpbGV7ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmlzLWlubGluZS1mbGV4LXRhYmxldHtkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1pbmxpbmUtZmxleC10YWJsZXQtb25seXtkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaW5saW5lLWZsZXgtdG91Y2h7ZGlzcGxheTppbmxpbmUtZmxleCAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5pcy1pbmxpbmUtZmxleC1kZXNrdG9we2Rpc3BsYXk6aW5saW5lLWZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KSBhbmQgKG1heC13aWR0aDogMTE5MXB4KXsuaXMtaW5saW5lLWZsZXgtZGVza3RvcC1vbmx5e2Rpc3BsYXk6aW5saW5lLWZsZXggIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtaW5saW5lLWZsZXgtd2lkZXNjcmVlbntkaXNwbGF5OmlubGluZS1mbGV4ICFpbXBvcnRhbnR9fS5pcy1jbGVhcmZpeDphZnRlcntjbGVhcjpib3RoO2NvbnRlbnQ6XFxcIiBcXFwiO2Rpc3BsYXk6dGFibGV9LmlzLXB1bGxlZC1sZWZ0e2Zsb2F0OmxlZnR9LmlzLXB1bGxlZC1yaWdodHtmbG9hdDpyaWdodH0uaXMtY2xpcHBlZHtvdmVyZmxvdzpoaWRkZW4gIWltcG9ydGFudH0uaXMtb3ZlcmxheXtib3R0b206MDtsZWZ0OjA7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDt0b3A6MH0uaGFzLXRleHQtY2VudGVyZWR7dGV4dC1hbGlnbjpjZW50ZXJ9Lmhhcy10ZXh0LWxlZnR7dGV4dC1hbGlnbjpsZWZ0fS5oYXMtdGV4dC1yaWdodHt0ZXh0LWFsaWduOnJpZ2h0fS5pcy1oaWRkZW57ZGlzcGxheTpub25lICFpbXBvcnRhbnR9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5pcy1oaWRkZW4tbW9iaWxle2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmlzLWhpZGRlbi10YWJsZXR7ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5pcy1oaWRkZW4tdGFibGV0LW9ubHl7ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5OXB4KXsuaXMtaGlkZGVuLXRvdWNoe2Rpc3BsYXk6bm9uZSAhaW1wb3J0YW50fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5pcy1oaWRkZW4tZGVza3RvcHtkaXNwbGF5Om5vbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KSBhbmQgKG1heC13aWR0aDogMTE5MXB4KXsuaXMtaGlkZGVuLWRlc2t0b3Atb25seXtkaXNwbGF5Om5vbmUgIWltcG9ydGFudH19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaXMtaGlkZGVuLXdpZGVzY3JlZW57ZGlzcGxheTpub25lICFpbXBvcnRhbnR9fS5pcy1kaXNhYmxlZHtwb2ludGVyLWV2ZW50czpub25lfS5pcy1tYXJnaW5sZXNze21hcmdpbjowICFpbXBvcnRhbnR9LmlzLXBhZGRpbmdsZXNze3BhZGRpbmc6MCAhaW1wb3J0YW50fS5pcy11bnNlbGVjdGFibGV7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lfS5ib3h7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1yYWRpdXM6NXB4O2JveC1zaGFkb3c6MCAycHggM3B4IHJnYmEoMTAsMTAsMTAsMC4xKSwwIDAgMCAxcHggcmdiYSgxMCwxMCwxMCwwLjEpO2Rpc3BsYXk6YmxvY2s7cGFkZGluZzoxLjI1cmVtfS5ib3g6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX1hLmJveDpob3ZlcixhLmJveDpmb2N1c3tib3gtc2hhZG93OjAgMnB4IDNweCByZ2JhKDEwLDEwLDEwLDAuMSksMCAwIDAgMXB4ICMxODJiNzN9YS5ib3g6YWN0aXZle2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKSwwIDAgMCAxcHggIzE4MmI3M30uYnV0dG9uey1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjNweDtib3gtc2hhZG93Om5vbmU7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MXJlbTtoZWlnaHQ6Mi4yODVlbTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3A7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lO2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7Y29sb3I6IzM2MzYzNjtjdXJzb3I6cG9pbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3BhZGRpbmctbGVmdDowLjc1ZW07cGFkZGluZy1yaWdodDowLjc1ZW07dGV4dC1hbGlnbjpjZW50ZXI7d2hpdGUtc3BhY2U6bm93cmFwfS5idXR0b246Zm9jdXMsLmJ1dHRvbi5pcy1mb2N1c2VkLC5idXR0b246YWN0aXZlLC5idXR0b24uaXMtYWN0aXZle291dGxpbmU6bm9uZX0uYnV0dG9uW2Rpc2FibGVkXSwuYnV0dG9uLmlzLWRpc2FibGVke3BvaW50ZXItZXZlbnRzOm5vbmV9LmJ1dHRvbiBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uYnV0dG9uIC5pY29uOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS4yNXJlbTttYXJnaW4tcmlnaHQ6LjVyZW19LmJ1dHRvbiAuaWNvbjpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi41cmVtO21hcmdpbi1yaWdodDotLjI1cmVtfS5idXR0b24gLmljb246Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS4yNXJlbSl9LmJ1dHRvbiAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0OjByZW19LmJ1dHRvbiAuaWNvbi5pcy1zbWFsbDpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDowcmVtfS5idXR0b24gLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAwcmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgMHJlbSl9LmJ1dHRvbiAuaWNvbi5pcy1tZWRpdW06Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjVyZW19LmJ1dHRvbiAuaWNvbi5pcy1tZWRpdW06bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS41cmVtfS5idXR0b24gLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS41cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS41cmVtKX0uYnV0dG9uIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LTFyZW19LmJ1dHRvbiAuaWNvbi5pcy1sYXJnZTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotMXJlbX0uYnV0dG9uIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLTFyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtMXJlbSl9LmJ1dHRvbjpob3ZlciwuYnV0dG9uLmlzLWhvdmVyZWR7Ym9yZGVyLWNvbG9yOiNiNWI1YjU7Y29sb3I6IzM2MzYzNn0uYnV0dG9uOmZvY3VzLC5idXR0b24uaXMtZm9jdXNlZHtib3JkZXItY29sb3I6IzE4MmI3Mztib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDI0LDQzLDExNSwwLjI1KTtjb2xvcjojMzYzNjM2fS5idXR0b246YWN0aXZlLC5idXR0b24uaXMtYWN0aXZle2JvcmRlci1jb2xvcjojNGE0YTRhO2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlua3tiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojNGE0YTRhO3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmV9LmJ1dHRvbi5pcy1saW5rOmhvdmVyLC5idXR0b24uaXMtbGluay5pcy1ob3ZlcmVkLC5idXR0b24uaXMtbGluazpmb2N1cywuYnV0dG9uLmlzLWxpbmsuaXMtZm9jdXNlZCwuYnV0dG9uLmlzLWxpbms6YWN0aXZlLC5idXR0b24uaXMtbGluay5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy13aGl0ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy13aGl0ZTpob3ZlciwuYnV0dG9uLmlzLXdoaXRlLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojZjlmOWY5O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGU6Zm9jdXMsLmJ1dHRvbi5pcy13aGl0ZS5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDI1NSwyNTUsMjU1LDAuMjUpO2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy13aGl0ZTphY3RpdmUsLmJ1dHRvbi5pcy13aGl0ZS5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojZjJmMmYyO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLXdoaXRlLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojMDAwfS5idXR0b24uaXMtd2hpdGUuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgIzBhMGEwYSAjMGEwYTBhICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy13aGl0ZS5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy13aGl0ZS5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXdoaXRlLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6IzBhMGEwYTtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtd2hpdGUuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy13aGl0ZS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNre2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNrOmhvdmVyLC5idXR0b24uaXMtYmxhY2suaXMtaG92ZXJlZHtiYWNrZ3JvdW5kLWNvbG9yOiMwNDA0MDQ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjazpmb2N1cywuYnV0dG9uLmlzLWJsYWNrLmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMTAsMTAsMTAsMC4yNSk7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWJsYWNrOmFjdGl2ZSwuYnV0dG9uLmlzLWJsYWNrLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMwMDA7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojZmZmfS5idXR0b24uaXMtYmxhY2suaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9LmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1ibGFjay5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZmZmICNmZmYgIWltcG9ydGFudH0uYnV0dG9uLmlzLWJsYWNrLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMwYTBhMGE7Y29sb3I6IzBhMGEwYX0uYnV0dG9uLmlzLWJsYWNrLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtYmxhY2suaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2JvcmRlci1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1ibGFjay5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWJsYWNrLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5idXR0b24uaXMtbGlnaHR7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlnaHQ6aG92ZXIsLmJ1dHRvbi5pcy1saWdodC5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6I2VlZTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0OmZvY3VzLC5idXR0b24uaXMtbGlnaHQuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgyNDUsMjQ1LDI0NSwwLjI1KTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtbGlnaHQ6YWN0aXZlLC5idXR0b24uaXMtbGlnaHQuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6I2U4ZThlODtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiMzNjM2MzZ9LmJ1dHRvbi5pcy1saWdodC5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6IzI5MjkyOX0uYnV0dG9uLmlzLWxpZ2h0LmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICMzNjM2MzYgIzM2MzYzNiAhaW1wb3J0YW50fS5idXR0b24uaXMtbGlnaHQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2Y1ZjVmNTtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtbGlnaHQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1saWdodC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMzNjM2MzY7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWxpZ2h0LmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtbGlnaHQuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1kYXJre2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcms6aG92ZXIsLmJ1dHRvbi5pcy1kYXJrLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojMmYyZjJmO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFyazpmb2N1cywuYnV0dG9uLmlzLWRhcmsuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSg1NCw1NCw1NCwwLjI1KTtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFyazphY3RpdmUsLmJ1dHRvbi5pcy1kYXJrLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMyOTI5Mjk7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4yKTtjb2xvcjojZjVmNWY1fS5idXR0b24uaXMtZGFyay5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzM2MzYzNn0uYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQ6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZThlOGU4fS5idXR0b24uaXMtZGFyay5pcy1sb2FkaW5nOmFmdGVye2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjZjVmNWY1ICNmNWY1ZjUgIWltcG9ydGFudH0uYnV0dG9uLmlzLWRhcmsuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6IzM2MzYzNjtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtZGFyay5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWRhcmsuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2O2JvcmRlci1jb2xvcjojMzYzNjM2O2NvbG9yOiNmNWY1ZjV9LmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVkLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Y29sb3I6I2Y1ZjVmNX0uYnV0dG9uLmlzLWRhcmsuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1kYXJrLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5idXR0b24uaXMtcHJpbWFyeXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5OmhvdmVyLC5idXR0b24uaXMtcHJpbWFyeS5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6IzE2Mjc2ODtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXByaW1hcnk6Zm9jdXMsLmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWZvY3VzZWR7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50O2JveC1zaGFkb3c6MCAwIDAuNWVtIHJnYmEoMjQsNDMsMTE1LDAuMjUpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5OmFjdGl2ZSwuYnV0dG9uLmlzLXByaW1hcnkuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6IzE0MjM1ZTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMTgyYjczfS5idXR0b24uaXMtcHJpbWFyeS5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50fS5idXR0b24uaXMtcHJpbWFyeS5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMTgyYjczO2NvbG9yOiMxODJiNzN9LmJ1dHRvbi5pcy1wcmltYXJ5LmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtcHJpbWFyeS5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Ym9yZGVyLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtcHJpbWFyeS5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXByaW1hcnkuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMxODJiNzN9LmJ1dHRvbi5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWluZm86aG92ZXIsLmJ1dHRvbi5pcy1pbmZvLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojMjc2Y2RhO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtaW5mbzpmb2N1cywuYnV0dG9uLmlzLWluZm8uaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSg1MCwxMTUsMjIwLDAuMjUpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1pbmZvOmFjdGl2ZSwuYnV0dG9uLmlzLWluZm8uaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6IzIzNjZkMTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1pbmZvLmlzLWludmVydGVke2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMzI3M2RjfS5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1pbmZvLmlzLWxvYWRpbmc6YWZ0ZXJ7Ym9yZGVyLWNvbG9yOnRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNmZmYgI2ZmZiAhaW1wb3J0YW50fS5idXR0b24uaXMtaW5mby5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojMzI3M2RjO2NvbG9yOiMzMjczZGN9LmJ1dHRvbi5pcy1pbmZvLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtaW5mby5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Ym9yZGVyLWNvbG9yOiMzMjczZGM7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtaW5mby5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWluZm8uaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMzMjczZGN9LmJ1dHRvbi5pcy1zdWNjZXNze2JhY2tncm91bmQtY29sb3I6IzIzZDE2MDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3M6aG92ZXIsLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWhvdmVyZWR7YmFja2dyb3VuZC1jb2xvcjojMjJjNjViO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjojZmZmfS5idXR0b24uaXMtc3VjY2Vzczpmb2N1cywuYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgzNSwyMDksOTYsMC4yNSk7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3M6YWN0aXZlLC5idXR0b24uaXMtc3VjY2Vzcy5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojMjBiYzU2O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMyM2QxNjB9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2YyZjJmMn0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZiAjZmZmICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLW91dGxpbmVke2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLWNvbG9yOiMyM2QxNjA7Y29sb3I6IzIzZDE2MH0uYnV0dG9uLmlzLXN1Y2Nlc3MuaXMtb3V0bGluZWQ6aG92ZXIsLmJ1dHRvbi5pcy1zdWNjZXNzLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6IzIzZDE2MDtib3JkZXItY29sb3I6IzIzZDE2MDtjb2xvcjojZmZmfS5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZmO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1zdWNjZXNzLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtc3VjY2Vzcy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzIzZDE2MH0uYnV0dG9uLmlzLXdhcm5pbmd7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9LmJ1dHRvbi5pcy13YXJuaW5nOmhvdmVyLC5idXR0b24uaXMtd2FybmluZy5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6I2ZmZGI0YTtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZzpmb2N1cywuYnV0dG9uLmlzLXdhcm5pbmcuaXMtZm9jdXNlZHtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzowIDAgMC41ZW0gcmdiYSgyNTUsMjIxLDg3LDAuMjUpO2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmc6YWN0aXZlLC5idXR0b24uaXMtd2FybmluZy5pcy1hY3RpdmV7YmFja2dyb3VuZC1jb2xvcjojZmZkODNkO2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMik7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZHtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KTtjb2xvcjojZmZkZDU3fS5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KX0uYnV0dG9uLmlzLXdhcm5pbmcuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgcmdiYSgwLDAsMCwwLjcpIHJnYmEoMCwwLDAsMC43KSAhaW1wb3J0YW50fS5idXR0b24uaXMtd2FybmluZy5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjojZmZkZDU3O2NvbG9yOiNmZmRkNTd9LmJ1dHRvbi5pcy13YXJuaW5nLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtd2FybmluZy5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTc7Ym9yZGVyLWNvbG9yOiNmZmRkNTc7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZHtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci1jb2xvcjpyZ2JhKDAsMCwwLDAuNyk7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5idXR0b24uaXMtd2FybmluZy5pcy1pbnZlcnRlZC5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLXdhcm5pbmcuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWQ6Zm9jdXN7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDAsMCwwLDAuNyk7Y29sb3I6I2ZmZGQ1N30uYnV0dG9uLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWRhbmdlcjpob3ZlciwuYnV0dG9uLmlzLWRhbmdlci5pcy1ob3ZlcmVke2JhY2tncm91bmQtY29sb3I6I2YyMDAwMDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWRhbmdlcjpmb2N1cywuYnV0dG9uLmlzLWRhbmdlci5pcy1mb2N1c2Vke2JvcmRlci1jb2xvcjp0cmFuc3BhcmVudDtib3gtc2hhZG93OjAgMCAwLjVlbSByZ2JhKDI1NSwwLDAsMC4yNSk7Y29sb3I6I2ZmZn0uYnV0dG9uLmlzLWRhbmdlcjphY3RpdmUsLmJ1dHRvbi5pcy1kYW5nZXIuaXMtYWN0aXZle2JhY2tncm91bmQtY29sb3I6I2U2MDAwMDtib3JkZXItY29sb3I6dHJhbnNwYXJlbnQ7Ym94LXNoYWRvdzppbnNldCAwIDFweCAycHggcmdiYSgxMCwxMCwxMCwwLjIpO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtaW52ZXJ0ZWR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOnJlZH0uYnV0dG9uLmlzLWRhbmdlci5pcy1pbnZlcnRlZDpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmMmYyZjJ9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtbG9hZGluZzphZnRlcntib3JkZXItY29sb3I6dHJhbnNwYXJlbnQgdHJhbnNwYXJlbnQgI2ZmZiAjZmZmICFpbXBvcnRhbnR9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6cmVkO2NvbG9yOnJlZH0uYnV0dG9uLmlzLWRhbmdlci5pcy1vdXRsaW5lZDpob3ZlciwuYnV0dG9uLmlzLWRhbmdlci5pcy1vdXRsaW5lZDpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOnJlZDtib3JkZXItY29sb3I6cmVkO2NvbG9yOiNmZmZ9LmJ1dHRvbi5pcy1kYW5nZXIuaXMtaW52ZXJ0ZWQuaXMtb3V0bGluZWR7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojZmZmfS5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmhvdmVyLC5idXR0b24uaXMtZGFuZ2VyLmlzLWludmVydGVkLmlzLW91dGxpbmVkOmZvY3Vze2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjpyZWR9LmJ1dHRvbi5pcy1zbWFsbHtib3JkZXItcmFkaXVzOjJweDtmb250LXNpemU6Ljc1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb246Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjM3NXJlbTttYXJnaW4tcmlnaHQ6LjM3NXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LjM3NXJlbTttYXJnaW4tcmlnaHQ6LS4zNzVyZW19LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbjpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uMzc1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS4zNzVyZW0pfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjEyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLXNtYWxsOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uMTI1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjEyNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMTI1cmVtKX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLW1lZGl1bTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uNjI1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtbWVkaXVtOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0uNjI1cmVtfS5idXR0b24uaXMtc21hbGwgLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS42MjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjYyNXJlbSl9LmJ1dHRvbi5pcy1zbWFsbCAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0xLjEyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLWxhcmdlOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0Oi0xLjEyNXJlbX0uYnV0dG9uLmlzLXNtYWxsIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLTEuMTI1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLTEuMTI1cmVtKX0uYnV0dG9uLmlzLW1lZGl1bXtmb250LXNpemU6MS4yNXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbjpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi0uMTI1cmVtO21hcmdpbi1yaWdodDouNjI1cmVtfS5idXR0b24uaXMtbWVkaXVtIC5pY29uOmxhc3QtY2hpbGQ6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LjYyNXJlbTttYXJnaW4tcmlnaHQ6LS4xMjVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb246Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAtLjEyNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMTI1cmVtKX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1sZWZ0Oi4xMjVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtc21hbGw6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LjEyNXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1zbWFsbDpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC4xMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAuMTI1cmVtKX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1tZWRpdW06Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjM3NXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1tZWRpdW06bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS4zNzVyZW19LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS4zNzVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAtLjM3NXJlbSl9LmJ1dHRvbi5pcy1tZWRpdW0gLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjg3NXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1sYXJnZTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotLjg3NXJlbX0uYnV0dG9uLmlzLW1lZGl1bSAuaWNvbi5pcy1sYXJnZTpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIC0uODc1cmVtKTttYXJnaW4tcmlnaHQ6Y2FsYygtMXB4ICsgLS44NzVyZW0pfS5idXR0b24uaXMtbGFyZ2V7Zm9udC1zaXplOjEuNXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6MHJlbTttYXJnaW4tcmlnaHQ6Ljc1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb246bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tbGVmdDouNzVyZW07bWFyZ2luLXJpZ2h0OjByZW19LmJ1dHRvbi5pcy1sYXJnZSAuaWNvbjpmaXJzdC1jaGlsZDpsYXN0LWNoaWxke21hcmdpbi1sZWZ0OmNhbGMoLTFweCArIDByZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAwcmVtKX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLXNtYWxsOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LjI1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtc21hbGw6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LjI1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtc21hbGw6Zmlyc3QtY2hpbGQ6bGFzdC1jaGlsZHttYXJnaW4tbGVmdDpjYWxjKC0xcHggKyAuMjVyZW0pO21hcmdpbi1yaWdodDpjYWxjKC0xcHggKyAuMjVyZW0pfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6LS4yNXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLW1lZGl1bTpsYXN0LWNoaWxkOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi1yaWdodDotLjI1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbWVkaXVtOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS4yNXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uMjVyZW0pfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbGFyZ2U6Zmlyc3QtY2hpbGQ6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tbGVmdDotLjc1cmVtfS5idXR0b24uaXMtbGFyZ2UgLmljb24uaXMtbGFyZ2U6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tcmlnaHQ6LS43NXJlbX0uYnV0dG9uLmlzLWxhcmdlIC5pY29uLmlzLWxhcmdlOmZpcnN0LWNoaWxkOmxhc3QtY2hpbGR7bWFyZ2luLWxlZnQ6Y2FsYygtMXB4ICsgLS43NXJlbSk7bWFyZ2luLXJpZ2h0OmNhbGMoLTFweCArIC0uNzVyZW0pfS5idXR0b25bZGlzYWJsZWRdLC5idXR0b24uaXMtZGlzYWJsZWR7b3BhY2l0eTowLjV9LmJ1dHRvbi5pcy1mdWxsd2lkdGh7ZGlzcGxheTpmbGV4O3dpZHRoOjEwMCV9LmJ1dHRvbi5pcy1sb2FkaW5ne2NvbG9yOnRyYW5zcGFyZW50ICFpbXBvcnRhbnQ7cG9pbnRlci1ldmVudHM6bm9uZX0uYnV0dG9uLmlzLWxvYWRpbmc6YWZ0ZXJ7YW5pbWF0aW9uOnNwaW5Bcm91bmQgNTAwbXMgaW5maW5pdGUgbGluZWFyO2JvcmRlcjoycHggc29saWQgI2RiZGJkYjtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2JvcmRlci1yaWdodC1jb2xvcjp0cmFuc3BhcmVudDtib3JkZXItdG9wLWNvbG9yOnRyYW5zcGFyZW50O2NvbnRlbnQ6XFxcIlxcXCI7ZGlzcGxheTpibG9jaztoZWlnaHQ6MXJlbTtwb3NpdGlvbjpyZWxhdGl2ZTt3aWR0aDoxcmVtO2xlZnQ6NTAlO21hcmdpbi1sZWZ0Oi04cHg7bWFyZ2luLXRvcDotOHB4O3Bvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7cG9zaXRpb246YWJzb2x1dGUgIWltcG9ydGFudH0uY29udGVudHtjb2xvcjojNGE0YTRhfS5jb250ZW50Om5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LmNvbnRlbnQgbGkrbGl7bWFyZ2luLXRvcDowLjI1ZW19LmNvbnRlbnQgcDpub3QoOmxhc3QtY2hpbGQpLC5jb250ZW50IG9sOm5vdCg6bGFzdC1jaGlsZCksLmNvbnRlbnQgdWw6bm90KDpsYXN0LWNoaWxkKSwuY29udGVudCBibG9ja3F1b3RlOm5vdCg6bGFzdC1jaGlsZCksLmNvbnRlbnQgdGFibGU6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjFlbX0uY29udGVudCBoMSwuY29udGVudCBoMiwuY29udGVudCBoMywuY29udGVudCBoNCwuY29udGVudCBoNSwuY29udGVudCBoNntjb2xvcjojMzYzNjM2O2ZvbnQtd2VpZ2h0OjQwMDtsaW5lLWhlaWdodDoxLjEyNX0uY29udGVudCBoMXtmb250LXNpemU6MmVtO21hcmdpbi1ib3R0b206MC41ZW19LmNvbnRlbnQgaDE6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXRvcDoxZW19LmNvbnRlbnQgaDJ7Zm9udC1zaXplOjEuNzVlbTttYXJnaW4tYm90dG9tOjAuNTcxNGVtfS5jb250ZW50IGgyOm5vdCg6Zmlyc3QtY2hpbGQpe21hcmdpbi10b3A6MS4xNDI4ZW19LmNvbnRlbnQgaDN7Zm9udC1zaXplOjEuNWVtO21hcmdpbi1ib3R0b206MC42NjY2ZW19LmNvbnRlbnQgaDM6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXRvcDoxLjMzMzNlbX0uY29udGVudCBoNHtmb250LXNpemU6MS4yNWVtO21hcmdpbi1ib3R0b206MC44ZW19LmNvbnRlbnQgaDV7Zm9udC1zaXplOjEuMTI1ZW07bWFyZ2luLWJvdHRvbTowLjg4ODhlbX0uY29udGVudCBoNntmb250LXNpemU6MWVtO21hcmdpbi1ib3R0b206MWVtfS5jb250ZW50IGJsb2NrcXVvdGV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1sZWZ0OjVweCBzb2xpZCAjZGJkYmRiO3BhZGRpbmc6MS4yNWVtIDEuNWVtfS5jb250ZW50IG9se2xpc3Qtc3R5bGU6ZGVjaW1hbCBvdXRzaWRlO21hcmdpbi1sZWZ0OjJlbTttYXJnaW4tcmlnaHQ6MmVtO21hcmdpbi10b3A6MWVtfS5jb250ZW50IHVse2xpc3Qtc3R5bGU6ZGlzYyBvdXRzaWRlO21hcmdpbi1sZWZ0OjJlbTttYXJnaW4tcmlnaHQ6MmVtO21hcmdpbi10b3A6MWVtfS5jb250ZW50IHVsIHVse2xpc3Qtc3R5bGUtdHlwZTpjaXJjbGU7bWFyZ2luLXRvcDowLjVlbX0uY29udGVudCB1bCB1bCB1bHtsaXN0LXN0eWxlLXR5cGU6c3F1YXJlfS5jb250ZW50IHRhYmxle3dpZHRoOjEwMCV9LmNvbnRlbnQgdGFibGUgdGQsLmNvbnRlbnQgdGFibGUgdGh7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci13aWR0aDowIDAgMXB4O3BhZGRpbmc6MC41ZW0gMC43NWVtO3ZlcnRpY2FsLWFsaWduOnRvcH0uY29udGVudCB0YWJsZSB0aHtjb2xvcjojMzYzNjM2O3RleHQtYWxpZ246bGVmdH0uY29udGVudCB0YWJsZSB0cjpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9LmNvbnRlbnQgdGFibGUgdGhlYWQgdGQsLmNvbnRlbnQgdGFibGUgdGhlYWQgdGh7Ym9yZGVyLXdpZHRoOjAgMCAycHg7Y29sb3I6IzM2MzYzNn0uY29udGVudCB0YWJsZSB0Zm9vdCB0ZCwuY29udGVudCB0YWJsZSB0Zm9vdCB0aHtib3JkZXItd2lkdGg6MnB4IDAgMDtjb2xvcjojMzYzNjM2fS5jb250ZW50IHRhYmxlIHRib2R5IHRyOmxhc3QtY2hpbGQgdGQsLmNvbnRlbnQgdGFibGUgdGJvZHkgdHI6bGFzdC1jaGlsZCB0aHtib3JkZXItYm90dG9tLXdpZHRoOjB9LmNvbnRlbnQuaXMtc21hbGx7Zm9udC1zaXplOi43NXJlbX0uY29udGVudC5pcy1tZWRpdW17Zm9udC1zaXplOjEuMjVyZW19LmNvbnRlbnQuaXMtbGFyZ2V7Zm9udC1zaXplOjEuNXJlbX0uaW5wdXQsLnRleHRhcmVhey1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjNweDtib3gtc2hhZG93Om5vbmU7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MXJlbTtoZWlnaHQ6Mi4yODVlbTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3A7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtjb2xvcjojMzYzNjM2O2JveC1zaGFkb3c6aW5zZXQgMCAxcHggMnB4IHJnYmEoMTAsMTAsMTAsMC4xKTttYXgtd2lkdGg6MTAwJTt3aWR0aDoxMDAlfS5pbnB1dDpmb2N1cywuaW5wdXQuaXMtZm9jdXNlZCwuaW5wdXQ6YWN0aXZlLC5pbnB1dC5pcy1hY3RpdmUsLnRleHRhcmVhOmZvY3VzLC50ZXh0YXJlYS5pcy1mb2N1c2VkLC50ZXh0YXJlYTphY3RpdmUsLnRleHRhcmVhLmlzLWFjdGl2ZXtvdXRsaW5lOm5vbmV9LmlucHV0W2Rpc2FibGVkXSwuaW5wdXQuaXMtZGlzYWJsZWQsLnRleHRhcmVhW2Rpc2FibGVkXSwudGV4dGFyZWEuaXMtZGlzYWJsZWR7cG9pbnRlci1ldmVudHM6bm9uZX0uaW5wdXQ6aG92ZXIsLmlucHV0LmlzLWhvdmVyZWQsLnRleHRhcmVhOmhvdmVyLC50ZXh0YXJlYS5pcy1ob3ZlcmVke2JvcmRlci1jb2xvcjojYjViNWI1fS5pbnB1dDpmb2N1cywuaW5wdXQuaXMtZm9jdXNlZCwuaW5wdXQ6YWN0aXZlLC5pbnB1dC5pcy1hY3RpdmUsLnRleHRhcmVhOmZvY3VzLC50ZXh0YXJlYS5pcy1mb2N1c2VkLC50ZXh0YXJlYTphY3RpdmUsLnRleHRhcmVhLmlzLWFjdGl2ZXtib3JkZXItY29sb3I6IzE4MmI3M30uaW5wdXRbZGlzYWJsZWRdLC5pbnB1dC5pcy1kaXNhYmxlZCwudGV4dGFyZWFbZGlzYWJsZWRdLC50ZXh0YXJlYS5pcy1kaXNhYmxlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Ym94LXNoYWRvdzpub25lO2NvbG9yOiM3YTdhN2F9LmlucHV0W2Rpc2FibGVkXTo6LW1vei1wbGFjZWhvbGRlciwuaW5wdXQuaXMtZGlzYWJsZWQ6Oi1tb3otcGxhY2Vob2xkZXIsLnRleHRhcmVhW2Rpc2FibGVkXTo6LW1vei1wbGFjZWhvbGRlciwudGV4dGFyZWEuaXMtZGlzYWJsZWQ6Oi1tb3otcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5pbnB1dFtkaXNhYmxlZF06Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIsLmlucHV0LmlzLWRpc2FibGVkOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVyLC50ZXh0YXJlYVtkaXNhYmxlZF06Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIsLnRleHRhcmVhLmlzLWRpc2FibGVkOjotd2Via2l0LWlucHV0LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uaW5wdXRbZGlzYWJsZWRdOi1tb3otcGxhY2Vob2xkZXIsLmlucHV0LmlzLWRpc2FibGVkOi1tb3otcGxhY2Vob2xkZXIsLnRleHRhcmVhW2Rpc2FibGVkXTotbW96LXBsYWNlaG9sZGVyLC50ZXh0YXJlYS5pcy1kaXNhYmxlZDotbW96LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uaW5wdXRbZGlzYWJsZWRdOi1tcy1pbnB1dC1wbGFjZWhvbGRlciwuaW5wdXQuaXMtZGlzYWJsZWQ6LW1zLWlucHV0LXBsYWNlaG9sZGVyLC50ZXh0YXJlYVtkaXNhYmxlZF06LW1zLWlucHV0LXBsYWNlaG9sZGVyLC50ZXh0YXJlYS5pcy1kaXNhYmxlZDotbXMtaW5wdXQtcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5pbnB1dFt0eXBlPVxcXCJzZWFyY2hcXFwiXSwudGV4dGFyZWFbdHlwZT1cXFwic2VhcmNoXFxcIl17Ym9yZGVyLXJhZGl1czoyOTA0ODZweH0uaW5wdXQuaXMtd2hpdGUsLnRleHRhcmVhLmlzLXdoaXRle2JvcmRlci1jb2xvcjojZmZmfS5pbnB1dC5pcy1ibGFjaywudGV4dGFyZWEuaXMtYmxhY2t7Ym9yZGVyLWNvbG9yOiMwYTBhMGF9LmlucHV0LmlzLWxpZ2h0LC50ZXh0YXJlYS5pcy1saWdodHtib3JkZXItY29sb3I6I2Y1ZjVmNX0uaW5wdXQuaXMtZGFyaywudGV4dGFyZWEuaXMtZGFya3tib3JkZXItY29sb3I6IzM2MzYzNn0uaW5wdXQuaXMtcHJpbWFyeSwudGV4dGFyZWEuaXMtcHJpbWFyeXtib3JkZXItY29sb3I6IzE4MmI3M30uaW5wdXQuaXMtaW5mbywudGV4dGFyZWEuaXMtaW5mb3tib3JkZXItY29sb3I6IzMyNzNkY30uaW5wdXQuaXMtc3VjY2VzcywudGV4dGFyZWEuaXMtc3VjY2Vzc3tib3JkZXItY29sb3I6IzIzZDE2MH0uaW5wdXQuaXMtd2FybmluZywudGV4dGFyZWEuaXMtd2FybmluZ3tib3JkZXItY29sb3I6I2ZmZGQ1N30uaW5wdXQuaXMtZGFuZ2VyLC50ZXh0YXJlYS5pcy1kYW5nZXJ7Ym9yZGVyLWNvbG9yOnJlZH0uaW5wdXQuaXMtc21hbGwsLnRleHRhcmVhLmlzLXNtYWxse2JvcmRlci1yYWRpdXM6MnB4O2ZvbnQtc2l6ZTouNzVyZW19LmlucHV0LmlzLW1lZGl1bSwudGV4dGFyZWEuaXMtbWVkaXVte2ZvbnQtc2l6ZToxLjI1cmVtfS5pbnB1dC5pcy1sYXJnZSwudGV4dGFyZWEuaXMtbGFyZ2V7Zm9udC1zaXplOjEuNXJlbX0uaW5wdXQuaXMtZnVsbHdpZHRoLC50ZXh0YXJlYS5pcy1mdWxsd2lkdGh7ZGlzcGxheTpibG9jazt3aWR0aDoxMDAlfS5pbnB1dC5pcy1pbmxpbmUsLnRleHRhcmVhLmlzLWlubGluZXtkaXNwbGF5OmlubGluZTt3aWR0aDphdXRvfS50ZXh0YXJlYXtkaXNwbGF5OmJsb2NrO2xpbmUtaGVpZ2h0OjEuMjU7bWF4LWhlaWdodDo2MDBweDttYXgtd2lkdGg6MTAwJTttaW4taGVpZ2h0OjEyMHB4O21pbi13aWR0aDoxMDAlO3BhZGRpbmc6MTBweDtyZXNpemU6dmVydGljYWx9LmNoZWNrYm94LC5yYWRpb3thbGlnbi1pdGVtczpjZW50ZXI7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTppbmxpbmUtZmxleDtmbGV4LXdyYXA6d3JhcDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3B9LmNoZWNrYm94IGlucHV0LC5yYWRpbyBpbnB1dHtjdXJzb3I6cG9pbnRlcjttYXJnaW4tcmlnaHQ6MC41ZW19LmNoZWNrYm94OmhvdmVyLC5yYWRpbzpob3Zlcntjb2xvcjojMzYzNjM2fS5jaGVja2JveC5pcy1kaXNhYmxlZCwucmFkaW8uaXMtZGlzYWJsZWR7Y29sb3I6IzdhN2E3YTtwb2ludGVyLWV2ZW50czpub25lfS5jaGVja2JveC5pcy1kaXNhYmxlZCBpbnB1dCwucmFkaW8uaXMtZGlzYWJsZWQgaW5wdXR7cG9pbnRlci1ldmVudHM6bm9uZX0ucmFkaW8rLnJhZGlve21hcmdpbi1sZWZ0OjAuNWVtfS5zZWxlY3R7ZGlzcGxheTppbmxpbmUtYmxvY2s7aGVpZ2h0OjIuNWVtO3Bvc2l0aW9uOnJlbGF0aXZlO3ZlcnRpY2FsLWFsaWduOnRvcH0uc2VsZWN0OmFmdGVye2JvcmRlcjoxcHggc29saWQgIzE4MmI3Mztib3JkZXItcmlnaHQ6MDtib3JkZXItdG9wOjA7Y29udGVudDpcXFwiIFxcXCI7ZGlzcGxheTpibG9jaztoZWlnaHQ6MC41ZW07cG9pbnRlci1ldmVudHM6bm9uZTtwb3NpdGlvbjphYnNvbHV0ZTt0cmFuc2Zvcm06cm90YXRlKC00NWRlZyk7d2lkdGg6MC41ZW07bWFyZ2luLXRvcDotMC4zNzVlbTtyaWdodDoxLjEyNWVtO3RvcDo1MCU7ei1pbmRleDo0fS5zZWxlY3Qgc2VsZWN0ey1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjNweDtib3gtc2hhZG93Om5vbmU7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MXJlbTtoZWlnaHQ6Mi4yODVlbTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3A7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjtjb2xvcjojMzYzNjM2O2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6YmxvY2s7Zm9udC1zaXplOjFlbTtvdXRsaW5lOm5vbmU7cGFkZGluZy1yaWdodDoyLjVlbX0uc2VsZWN0IHNlbGVjdDpmb2N1cywuc2VsZWN0IHNlbGVjdC5pcy1mb2N1c2VkLC5zZWxlY3Qgc2VsZWN0OmFjdGl2ZSwuc2VsZWN0IHNlbGVjdC5pcy1hY3RpdmV7b3V0bGluZTpub25lfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXSwuc2VsZWN0IHNlbGVjdC5pcy1kaXNhYmxlZHtwb2ludGVyLWV2ZW50czpub25lfS5zZWxlY3Qgc2VsZWN0OmhvdmVyLC5zZWxlY3Qgc2VsZWN0LmlzLWhvdmVyZWR7Ym9yZGVyLWNvbG9yOiNiNWI1YjV9LnNlbGVjdCBzZWxlY3Q6Zm9jdXMsLnNlbGVjdCBzZWxlY3QuaXMtZm9jdXNlZCwuc2VsZWN0IHNlbGVjdDphY3RpdmUsLnNlbGVjdCBzZWxlY3QuaXMtYWN0aXZle2JvcmRlci1jb2xvcjojMTgyYjczfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXSwuc2VsZWN0IHNlbGVjdC5pcy1kaXNhYmxlZHtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Ym94LXNoYWRvdzpub25lO2NvbG9yOiM3YTdhN2F9LnNlbGVjdCBzZWxlY3RbZGlzYWJsZWRdOjotbW96LXBsYWNlaG9sZGVyLC5zZWxlY3Qgc2VsZWN0LmlzLWRpc2FibGVkOjotbW96LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uc2VsZWN0IHNlbGVjdFtkaXNhYmxlZF06Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXIsLnNlbGVjdCBzZWxlY3QuaXMtZGlzYWJsZWQ6Oi13ZWJraXQtaW5wdXQtcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXTotbW96LXBsYWNlaG9sZGVyLC5zZWxlY3Qgc2VsZWN0LmlzLWRpc2FibGVkOi1tb3otcGxhY2Vob2xkZXJ7Y29sb3I6cmdiYSg1NCw1NCw1NCwwLjMpfS5zZWxlY3Qgc2VsZWN0W2Rpc2FibGVkXTotbXMtaW5wdXQtcGxhY2Vob2xkZXIsLnNlbGVjdCBzZWxlY3QuaXMtZGlzYWJsZWQ6LW1zLWlucHV0LXBsYWNlaG9sZGVye2NvbG9yOnJnYmEoNTQsNTQsNTQsMC4zKX0uc2VsZWN0IHNlbGVjdDpob3Zlcntib3JkZXItY29sb3I6I2I1YjViNX0uc2VsZWN0IHNlbGVjdDo6bXMtZXhwYW5ke2Rpc3BsYXk6bm9uZX0uc2VsZWN0OmhvdmVyOmFmdGVye2JvcmRlci1jb2xvcjojMzYzNjM2fS5zZWxlY3QuaXMtc21hbGx7Ym9yZGVyLXJhZGl1czoycHg7Zm9udC1zaXplOi43NXJlbX0uc2VsZWN0LmlzLW1lZGl1bXtmb250LXNpemU6MS4yNXJlbX0uc2VsZWN0LmlzLWxhcmdle2ZvbnQtc2l6ZToxLjVyZW19LnNlbGVjdC5pcy1mdWxsd2lkdGh7d2lkdGg6MTAwJX0uc2VsZWN0LmlzLWZ1bGx3aWR0aCBzZWxlY3R7d2lkdGg6MTAwJX0ubGFiZWx7Y29sb3I6IzM2MzYzNjtkaXNwbGF5OmJsb2NrO2ZvbnQtd2VpZ2h0OmJvbGR9LmxhYmVsOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjVlbX0uaGVscHtkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZTouNzVyZW07bWFyZ2luLXRvcDo1cHh9LmhlbHAuaXMtd2hpdGV7Y29sb3I6I2ZmZn0uaGVscC5pcy1ibGFja3tjb2xvcjojMGEwYTBhfS5oZWxwLmlzLWxpZ2h0e2NvbG9yOiNmNWY1ZjV9LmhlbHAuaXMtZGFya3tjb2xvcjojMzYzNjM2fS5oZWxwLmlzLXByaW1hcnl7Y29sb3I6IzE4MmI3M30uaGVscC5pcy1pbmZve2NvbG9yOiMzMjczZGN9LmhlbHAuaXMtc3VjY2Vzc3tjb2xvcjojMjNkMTYwfS5oZWxwLmlzLXdhcm5pbmd7Y29sb3I6I2ZmZGQ1N30uaGVscC5pcy1kYW5nZXJ7Y29sb3I6cmVkfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuY29udHJvbC1sYWJlbHttYXJnaW4tYm90dG9tOjAuNWVtfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmNvbnRyb2wtbGFiZWx7ZmxleC1iYXNpczowO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjA7bWFyZ2luLXJpZ2h0OjEuNWVtO3BhZGRpbmctdG9wOjAuNWVtO3RleHQtYWxpZ246cmlnaHR9fS5jb250cm9se3Bvc2l0aW9uOnJlbGF0aXZlO3RleHQtYWxpZ246bGVmdH0uY29udHJvbDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX0uY29udHJvbC5oYXMtYWRkb25ze2Rpc3BsYXk6ZmxleDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydH0uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b24sLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0e2JvcmRlci1yYWRpdXM6MDttYXJnaW4tcmlnaHQ6LTFweDt3aWR0aDphdXRvfS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpob3ZlciwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDpob3ZlciwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6aG92ZXJ7ei1pbmRleDoyfS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpmb2N1cywuY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246YWN0aXZlLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0OmZvY3VzLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0OmFjdGl2ZSwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Q6Zm9jdXMsLmNvbnRyb2wuaGFzLWFkZG9ucyAuc2VsZWN0OmFjdGl2ZXt6LWluZGV4OjN9LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uOmZpcnN0LWNoaWxkLC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0OmZpcnN0LWNoaWxkLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpmaXJzdC1jaGlsZHtib3JkZXItcmFkaXVzOjNweCAwIDAgM3B4fS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbjpmaXJzdC1jaGlsZCBzZWxlY3QsLmNvbnRyb2wuaGFzLWFkZG9ucyAuaW5wdXQ6Zmlyc3QtY2hpbGQgc2VsZWN0LC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpmaXJzdC1jaGlsZCBzZWxlY3R7Ym9yZGVyLXJhZGl1czozcHggMCAwIDNweH0uY29udHJvbC5oYXMtYWRkb25zIC5idXR0b246bGFzdC1jaGlsZCwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dDpsYXN0LWNoaWxkLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpsYXN0LWNoaWxke2JvcmRlci1yYWRpdXM6MCAzcHggM3B4IDB9LmNvbnRyb2wuaGFzLWFkZG9ucyAuYnV0dG9uOmxhc3QtY2hpbGQgc2VsZWN0LC5jb250cm9sLmhhcy1hZGRvbnMgLmlucHV0Omxhc3QtY2hpbGQgc2VsZWN0LC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdDpsYXN0LWNoaWxkIHNlbGVjdHtib3JkZXItcmFkaXVzOjAgM3B4IDNweCAwfS5jb250cm9sLmhhcy1hZGRvbnMgLmJ1dHRvbi5pcy1leHBhbmRlZCwuY29udHJvbC5oYXMtYWRkb25zIC5pbnB1dC5pcy1leHBhbmRlZCwuY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3QuaXMtZXhwYW5kZWR7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0uY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Qgc2VsZWN0OmhvdmVye3otaW5kZXg6Mn0uY29udHJvbC5oYXMtYWRkb25zIC5zZWxlY3Qgc2VsZWN0OmZvY3VzLC5jb250cm9sLmhhcy1hZGRvbnMgLnNlbGVjdCBzZWxlY3Q6YWN0aXZle3otaW5kZXg6M30uY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtY2VudGVyZWR7anVzdGlmeS1jb250ZW50OmNlbnRlcn0uY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtcmlnaHR7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfS5jb250cm9sLmhhcy1hZGRvbnMuaGFzLWFkZG9ucy1mdWxsd2lkdGggLmJ1dHRvbiwuY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtZnVsbHdpZHRoIC5pbnB1dCwuY29udHJvbC5oYXMtYWRkb25zLmhhcy1hZGRvbnMtZnVsbHdpZHRoIC5zZWxlY3R7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0uY29udHJvbC5oYXMtaWNvbiAuaWNvbntjb2xvcjojZGJkYmRiO3BvaW50ZXItZXZlbnRzOm5vbmU7cG9zaXRpb246YWJzb2x1dGU7dG9wOjEuMjVyZW07ei1pbmRleDo0fS5jb250cm9sLmhhcy1pY29uIC5pbnB1dDpmb2N1cysuaWNvbntjb2xvcjojN2E3YTdhfS5jb250cm9sLmhhcy1pY29uIC5pbnB1dC5pcy1zbWFsbCsuaWNvbnt0b3A6LjkzNzVyZW19LmNvbnRyb2wuaGFzLWljb24gLmlucHV0LmlzLW1lZGl1bSsuaWNvbnt0b3A6MS41NjI1cmVtfS5jb250cm9sLmhhcy1pY29uIC5pbnB1dC5pcy1sYXJnZSsuaWNvbnt0b3A6MS44NzVyZW19LmNvbnRyb2wuaGFzLWljb246bm90KC5oYXMtaWNvbi1yaWdodCkgLmljb257bGVmdDoxLjI1cmVtO3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSl9LmNvbnRyb2wuaGFzLWljb246bm90KC5oYXMtaWNvbi1yaWdodCkgLmlucHV0e3BhZGRpbmctbGVmdDoyLjVlbX0uY29udHJvbC5oYXMtaWNvbjpub3QoLmhhcy1pY29uLXJpZ2h0KSAuaW5wdXQuaXMtc21hbGwrLmljb257bGVmdDouOTM3NXJlbX0uY29udHJvbC5oYXMtaWNvbjpub3QoLmhhcy1pY29uLXJpZ2h0KSAuaW5wdXQuaXMtbWVkaXVtKy5pY29ue2xlZnQ6MS41NjI1cmVtfS5jb250cm9sLmhhcy1pY29uOm5vdCguaGFzLWljb24tcmlnaHQpIC5pbnB1dC5pcy1sYXJnZSsuaWNvbntsZWZ0OjEuODc1cmVtfS5jb250cm9sLmhhcy1pY29uLmhhcy1pY29uLXJpZ2h0IC5pY29ue3JpZ2h0OjEuMjVyZW07dHJhbnNmb3JtOnRyYW5zbGF0ZVgoNTAlKSB0cmFuc2xhdGVZKC01MCUpfS5jb250cm9sLmhhcy1pY29uLmhhcy1pY29uLXJpZ2h0IC5pbnB1dHtwYWRkaW5nLXJpZ2h0OjIuNWVtfS5jb250cm9sLmhhcy1pY29uLmhhcy1pY29uLXJpZ2h0IC5pbnB1dC5pcy1zbWFsbCsuaWNvbntyaWdodDouOTM3NXJlbX0uY29udHJvbC5oYXMtaWNvbi5oYXMtaWNvbi1yaWdodCAuaW5wdXQuaXMtbWVkaXVtKy5pY29ue3JpZ2h0OjEuNTYyNXJlbX0uY29udHJvbC5oYXMtaWNvbi5oYXMtaWNvbi1yaWdodCAuaW5wdXQuaXMtbGFyZ2UrLmljb257cmlnaHQ6MS44NzVyZW19LmNvbnRyb2wuaXMtZ3JvdXBlZHtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9LmNvbnRyb2wuaXMtZ3JvdXBlZD4uY29udHJvbHtmbGV4LWJhc2lzOjA7ZmxleC1zaHJpbms6MH0uY29udHJvbC5pcy1ncm91cGVkPi5jb250cm9sOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowO21hcmdpbi1yaWdodDowLjc1cmVtfS5jb250cm9sLmlzLWdyb3VwZWQ+LmNvbnRyb2wuaXMtZXhwYW5kZWR7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MX0uY29udHJvbC5pcy1ncm91cGVkLmlzLWdyb3VwZWQtY2VudGVyZWR7anVzdGlmeS1jb250ZW50OmNlbnRlcn0uY29udHJvbC5pcy1ncm91cGVkLmlzLWdyb3VwZWQtcmlnaHR7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuY29udHJvbC5pcy1ob3Jpem9udGFse2Rpc3BsYXk6ZmxleH0uY29udHJvbC5pcy1ob3Jpem9udGFsPi5jb250cm9se2Rpc3BsYXk6ZmxleDtmbGV4LWJhc2lzOjA7ZmxleC1ncm93OjU7ZmxleC1zaHJpbms6MX19LmNvbnRyb2wuaXMtbG9hZGluZzphZnRlcnthbmltYXRpb246c3BpbkFyb3VuZCA1MDBtcyBpbmZpbml0ZSBsaW5lYXI7Ym9yZGVyOjJweCBzb2xpZCAjZGJkYmRiO2JvcmRlci1yYWRpdXM6MjkwNDg2cHg7Ym9yZGVyLXJpZ2h0LWNvbG9yOnRyYW5zcGFyZW50O2JvcmRlci10b3AtY29sb3I6dHJhbnNwYXJlbnQ7Y29udGVudDpcXFwiXFxcIjtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcmVtO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjFyZW07cG9zaXRpb246YWJzb2x1dGUgIWltcG9ydGFudDtyaWdodDowLjc1ZW07dG9wOjAuNzVlbX0uaWNvbntkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MjFweDtoZWlnaHQ6MS41cmVtO2xpbmUtaGVpZ2h0OjEuNXJlbTt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6MS41cmVtfS5pY29uIC5mYXtmb250LXNpemU6aW5oZXJpdDtsaW5lLWhlaWdodDppbmhlcml0fS5pY29uLmlzLXNtYWxse2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZToxNHB4O2hlaWdodDoxcmVtO2xpbmUtaGVpZ2h0OjFyZW07dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjFyZW19Lmljb24uaXMtbWVkaXVte2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZToyOHB4O2hlaWdodDoycmVtO2xpbmUtaGVpZ2h0OjJyZW07dGV4dC1hbGlnbjpjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjJyZW19Lmljb24uaXMtbGFyZ2V7ZGlzcGxheTppbmxpbmUtYmxvY2s7Zm9udC1zaXplOjQycHg7aGVpZ2h0OjNyZW07bGluZS1oZWlnaHQ6M3JlbTt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6M3JlbX0uaW1hZ2V7ZGlzcGxheTpibG9jaztwb3NpdGlvbjpyZWxhdGl2ZX0uaW1hZ2UgaW1ne2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OmF1dG87d2lkdGg6MTAwJX0uaW1hZ2UuaXMtc3F1YXJlIGltZywuaW1hZ2UuaXMtMWJ5MSBpbWcsLmltYWdlLmlzLTRieTMgaW1nLC5pbWFnZS5pcy0zYnkyIGltZywuaW1hZ2UuaXMtMTZieTkgaW1nLC5pbWFnZS5pcy0yYnkxIGltZ3tib3R0b206MDtsZWZ0OjA7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDt0b3A6MDtoZWlnaHQ6MTAwJTt3aWR0aDoxMDAlfS5pbWFnZS5pcy1zcXVhcmUsLmltYWdlLmlzLTFieTF7cGFkZGluZy10b3A6MTAwJX0uaW1hZ2UuaXMtNGJ5M3twYWRkaW5nLXRvcDo3NSV9LmltYWdlLmlzLTNieTJ7cGFkZGluZy10b3A6NjYuNjY2NiV9LmltYWdlLmlzLTE2Ynk5e3BhZGRpbmctdG9wOjU2LjI1JX0uaW1hZ2UuaXMtMmJ5MXtwYWRkaW5nLXRvcDo1MCV9LmltYWdlLmlzLTE2eDE2e2hlaWdodDoxNnB4O3dpZHRoOjE2cHh9LmltYWdlLmlzLTI0eDI0e2hlaWdodDoyNHB4O3dpZHRoOjI0cHh9LmltYWdlLmlzLTMyeDMye2hlaWdodDozMnB4O3dpZHRoOjMycHh9LmltYWdlLmlzLTQ4eDQ4e2hlaWdodDo0OHB4O3dpZHRoOjQ4cHh9LmltYWdlLmlzLTY0eDY0e2hlaWdodDo2NHB4O3dpZHRoOjY0cHh9LmltYWdlLmlzLTk2eDk2e2hlaWdodDo5NnB4O3dpZHRoOjk2cHh9LmltYWdlLmlzLTEyOHgxMjh7aGVpZ2h0OjEyOHB4O3dpZHRoOjEyOHB4fS5ub3RpZmljYXRpb257YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2JvcmRlci1yYWRpdXM6M3B4O3BhZGRpbmc6MS4yNXJlbSAyLjVyZW0gMS4yNXJlbSAxLjVyZW07cG9zaXRpb246cmVsYXRpdmV9Lm5vdGlmaWNhdGlvbjpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5ub3RpZmljYXRpb24gY29kZSwubm90aWZpY2F0aW9uIHByZXtiYWNrZ3JvdW5kOiNmZmZ9Lm5vdGlmaWNhdGlvbiBwcmUgY29kZXtiYWNrZ3JvdW5kOnRyYW5zcGFyZW50fS5ub3RpZmljYXRpb24gLmRlbGV0ZXtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowLjVlbTt0b3A6MC41ZW19Lm5vdGlmaWNhdGlvbiAudGl0bGUsLm5vdGlmaWNhdGlvbiAuc3VidGl0bGUsLm5vdGlmaWNhdGlvbiAuY29udGVudHtjb2xvcjppbmhlcml0fS5ub3RpZmljYXRpb24uaXMtd2hpdGV7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9Lm5vdGlmaWNhdGlvbi5pcy1ibGFja3tiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0ubm90aWZpY2F0aW9uLmlzLWxpZ2h0e2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5ub3RpZmljYXRpb24uaXMtZGFya3tiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0ubm90aWZpY2F0aW9uLmlzLXByaW1hcnl7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9Lm5vdGlmaWNhdGlvbi5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztjb2xvcjojZmZmfS5ub3RpZmljYXRpb24uaXMtc3VjY2Vzc3tiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Y29sb3I6I2ZmZn0ubm90aWZpY2F0aW9uLmlzLXdhcm5pbmd7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0ubm90aWZpY2F0aW9uLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtjb2xvcjojZmZmfS5wcm9ncmVzc3stbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjFyZW07b3ZlcmZsb3c6aGlkZGVuO3BhZGRpbmc6MDt3aWR0aDoxMDAlfS5wcm9ncmVzczpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtfS5wcm9ncmVzczo6LXdlYmtpdC1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojZGJkYmRifS5wcm9ncmVzczo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiM0YTRhNGF9LnByb2dyZXNzOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiM0YTRhNGF9LnByb2dyZXNzLmlzLXdoaXRlOjotd2Via2l0LXByb2dyZXNzLXZhbHVle2JhY2tncm91bmQtY29sb3I6I2ZmZn0ucHJvZ3Jlc3MuaXMtd2hpdGU6Oi1tb3otcHJvZ3Jlc3MtYmFye2JhY2tncm91bmQtY29sb3I6I2ZmZn0ucHJvZ3Jlc3MuaXMtYmxhY2s6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhfS5wcm9ncmVzcy5pcy1ibGFjazo6LW1vei1wcm9ncmVzcy1iYXJ7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhfS5wcm9ncmVzcy5pcy1saWdodDo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9LnByb2dyZXNzLmlzLWxpZ2h0OjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9LnByb2dyZXNzLmlzLWRhcms6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2fS5wcm9ncmVzcy5pcy1kYXJrOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzZ9LnByb2dyZXNzLmlzLXByaW1hcnk6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczfS5wcm9ncmVzcy5pcy1wcmltYXJ5OjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzN9LnByb2dyZXNzLmlzLWluZm86Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMzI3M2RjfS5wcm9ncmVzcy5pcy1pbmZvOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGN9LnByb2dyZXNzLmlzLXN1Y2Nlc3M6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojMjNkMTYwfS5wcm9ncmVzcy5pcy1zdWNjZXNzOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjB9LnByb2dyZXNzLmlzLXdhcm5pbmc6Oi13ZWJraXQtcHJvZ3Jlc3MtdmFsdWV7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3fS5wcm9ncmVzcy5pcy13YXJuaW5nOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTd9LnByb2dyZXNzLmlzLWRhbmdlcjo6LXdlYmtpdC1wcm9ncmVzcy12YWx1ZXtiYWNrZ3JvdW5kLWNvbG9yOnJlZH0ucHJvZ3Jlc3MuaXMtZGFuZ2VyOjotbW96LXByb2dyZXNzLWJhcntiYWNrZ3JvdW5kLWNvbG9yOnJlZH0ucHJvZ3Jlc3MuaXMtc21hbGx7aGVpZ2h0Oi43NXJlbX0ucHJvZ3Jlc3MuaXMtbWVkaXVte2hlaWdodDoxLjI1cmVtfS5wcm9ncmVzcy5pcy1sYXJnZXtoZWlnaHQ6MS41cmVtfS50YWJsZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzM2MzYzNjttYXJnaW4tYm90dG9tOjEuNXJlbTt3aWR0aDoxMDAlfS50YWJsZSB0ZCwudGFibGUgdGh7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci13aWR0aDowIDAgMXB4O3BhZGRpbmc6MC41ZW0gMC43NWVtO3ZlcnRpY2FsLWFsaWduOnRvcH0udGFibGUgdGQuaXMtbmFycm93LC50YWJsZSB0aC5pcy1uYXJyb3d7d2hpdGUtc3BhY2U6bm93cmFwO3dpZHRoOjElfS50YWJsZSB0aHtjb2xvcjojMzYzNjM2O3RleHQtYWxpZ246bGVmdH0udGFibGUgdHI6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmFmYWZhfS50YWJsZSB0aGVhZCB0ZCwudGFibGUgdGhlYWQgdGh7Ym9yZGVyLXdpZHRoOjAgMCAycHg7Y29sb3I6IzdhN2E3YX0udGFibGUgdGZvb3QgdGQsLnRhYmxlIHRmb290IHRoe2JvcmRlci13aWR0aDoycHggMCAwO2NvbG9yOiM3YTdhN2F9LnRhYmxlIHRib2R5IHRyOmxhc3QtY2hpbGQgdGQsLnRhYmxlIHRib2R5IHRyOmxhc3QtY2hpbGQgdGh7Ym9yZGVyLWJvdHRvbS13aWR0aDowfS50YWJsZS5pcy1ib3JkZXJlZCB0ZCwudGFibGUuaXMtYm9yZGVyZWQgdGh7Ym9yZGVyLXdpZHRoOjFweH0udGFibGUuaXMtYm9yZGVyZWQgdHI6bGFzdC1jaGlsZCB0ZCwudGFibGUuaXMtYm9yZGVyZWQgdHI6bGFzdC1jaGlsZCB0aHtib3JkZXItYm90dG9tLXdpZHRoOjFweH0udGFibGUuaXMtbmFycm93IHRkLC50YWJsZS5pcy1uYXJyb3cgdGh7cGFkZGluZzowLjI1ZW0gMC41ZW19LnRhYmxlLmlzLXN0cmlwZWQgdGJvZHkgdHI6bnRoLWNoaWxkKGV2ZW4pe2JhY2tncm91bmQtY29sb3I6I2ZhZmFmYX0udGFibGUuaXMtc3RyaXBlZCB0Ym9keSB0cjpudGgtY2hpbGQoZXZlbik6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS50YWd7YWxpZ24taXRlbXM6Y2VudGVyO2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2NvbG9yOiM0YTRhNGE7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6Ljc1cmVtO2hlaWdodDoyZW07anVzdGlmeS1jb250ZW50OmNlbnRlcjtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuODc1ZW07cGFkZGluZy1yaWdodDowLjg3NWVtO3ZlcnRpY2FsLWFsaWduOnRvcDt3aGl0ZS1zcGFjZTpub3dyYXB9LnRhZyAuZGVsZXRle21hcmdpbi1sZWZ0OjAuMjVlbTttYXJnaW4tcmlnaHQ6LTAuNWVtfS50YWcuaXMtd2hpdGV7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbG9yOiMwYTBhMGF9LnRhZy5pcy1ibGFja3tiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGE7Y29sb3I6I2ZmZn0udGFnLmlzLWxpZ2h0e2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS50YWcuaXMtZGFya3tiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0udGFnLmlzLXByaW1hcnl7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9LnRhZy5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztjb2xvcjojZmZmfS50YWcuaXMtc3VjY2Vzc3tiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Y29sb3I6I2ZmZn0udGFnLmlzLXdhcm5pbmd7YmFja2dyb3VuZC1jb2xvcjojZmZkZDU3O2NvbG9yOnJnYmEoMCwwLDAsMC43KX0udGFnLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtjb2xvcjojZmZmfS50YWcuaXMtbWVkaXVte2ZvbnQtc2l6ZToxcmVtfS50YWcuaXMtbGFyZ2V7Zm9udC1zaXplOjEuMjVyZW19LnRpdGxlLC5zdWJ0aXRsZXt3b3JkLWJyZWFrOmJyZWFrLXdvcmR9LnRpdGxlOm5vdCg6bGFzdC1jaGlsZCksLnN1YnRpdGxlOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LnRpdGxlIGVtLC50aXRsZSBzcGFuLC5zdWJ0aXRsZSBlbSwuc3VidGl0bGUgc3Bhbntmb250LXdlaWdodDozMDB9LnRpdGxlIHN0cm9uZywuc3VidGl0bGUgc3Ryb25ne2ZvbnQtd2VpZ2h0OjUwMH0udGl0bGUgLnRhZywuc3VidGl0bGUgLnRhZ3t2ZXJ0aWNhbC1hbGlnbjptaWRkbGV9LnRpdGxle2NvbG9yOiMzNjM2MzY7Zm9udC1zaXplOjJyZW07Zm9udC13ZWlnaHQ6MzAwO2xpbmUtaGVpZ2h0OjEuMTI1fS50aXRsZSBzdHJvbmd7Y29sb3I6aW5oZXJpdH0udGl0bGUrLmhpZ2hsaWdodHttYXJnaW4tdG9wOi0wLjc1cmVtfS50aXRsZSsuc3VidGl0bGV7bWFyZ2luLXRvcDotMS4yNXJlbX0udGl0bGUuaXMtMXtmb250LXNpemU6My41cmVtfS50aXRsZS5pcy0ye2ZvbnQtc2l6ZToyLjc1cmVtfS50aXRsZS5pcy0ze2ZvbnQtc2l6ZToycmVtfS50aXRsZS5pcy00e2ZvbnQtc2l6ZToxLjVyZW19LnRpdGxlLmlzLTV7Zm9udC1zaXplOjEuMjVyZW19LnRpdGxlLmlzLTZ7Zm9udC1zaXplOjE0cHh9LnN1YnRpdGxle2NvbG9yOiM0YTRhNGE7Zm9udC1zaXplOjEuMjVyZW07Zm9udC13ZWlnaHQ6MzAwO2xpbmUtaGVpZ2h0OjEuMjV9LnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojMzYzNjM2fS5zdWJ0aXRsZSsudGl0bGV7bWFyZ2luLXRvcDotMS41cmVtfS5zdWJ0aXRsZS5pcy0xe2ZvbnQtc2l6ZTozLjVyZW19LnN1YnRpdGxlLmlzLTJ7Zm9udC1zaXplOjIuNzVyZW19LnN1YnRpdGxlLmlzLTN7Zm9udC1zaXplOjJyZW19LnN1YnRpdGxlLmlzLTR7Zm9udC1zaXplOjEuNXJlbX0uc3VidGl0bGUuaXMtNXtmb250LXNpemU6MS4yNXJlbX0uc3VidGl0bGUuaXMtNntmb250LXNpemU6MTRweH0uYmxvY2s6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0uY29udGFpbmVye3Bvc2l0aW9uOnJlbGF0aXZlfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDEwMDBweCl7LmNvbnRhaW5lcnttYXJnaW46MCBhdXRvO21heC13aWR0aDo5NjBweH0uY29udGFpbmVyLmlzLWZsdWlke21hcmdpbjowIDIwcHg7bWF4LXdpZHRoOm5vbmV9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDExOTJweCl7LmNvbnRhaW5lcnttYXgtd2lkdGg6MTE1MnB4fX0uZGVsZXRley13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7LW1zLXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZTstbW96LWFwcGVhcmFuY2U6bm9uZTstd2Via2l0LWFwcGVhcmFuY2U6bm9uZTtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4yKTtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjI5MDQ4NnB4O2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6aW5saW5lLWJsb2NrO2ZvbnQtc2l6ZToxcmVtO2hlaWdodDoyMHB4O291dGxpbmU6bm9uZTtwb3NpdGlvbjpyZWxhdGl2ZTt0cmFuc2Zvcm06cm90YXRlKDQ1ZGVnKTt0cmFuc2Zvcm0tb3JpZ2luOmNlbnRlciBjZW50ZXI7dmVydGljYWwtYWxpZ246dG9wO3dpZHRoOjIwcHh9LmRlbGV0ZTpiZWZvcmUsLmRlbGV0ZTphZnRlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29udGVudDpcXFwiXFxcIjtkaXNwbGF5OmJsb2NrO2xlZnQ6NTAlO3Bvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKX0uZGVsZXRlOmJlZm9yZXtoZWlnaHQ6MnB4O3dpZHRoOjUwJX0uZGVsZXRlOmFmdGVye2hlaWdodDo1MCU7d2lkdGg6MnB4fS5kZWxldGU6aG92ZXIsLmRlbGV0ZTpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4zKX0uZGVsZXRlOmFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC40KX0uZGVsZXRlLmlzLXNtYWxse2hlaWdodDoxNHB4O3dpZHRoOjE0cHh9LmRlbGV0ZS5pcy1tZWRpdW17aGVpZ2h0OjI2cHg7d2lkdGg6MjZweH0uZGVsZXRlLmlzLWxhcmdle2hlaWdodDozMHB4O3dpZHRoOjMwcHh9LmZhe2ZvbnQtc2l6ZToyMXB4O3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcH0uaGVhZGluZ3tkaXNwbGF5OmJsb2NrO2ZvbnQtc2l6ZToxMXB4O2xldHRlci1zcGFjaW5nOjFweDttYXJnaW4tYm90dG9tOjVweDt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2V9LmhpZ2hsaWdodHtmb250LXdlaWdodDo0MDA7bWF4LXdpZHRoOjEwMCU7b3ZlcmZsb3c6aGlkZGVuO3BhZGRpbmc6MH0uaGlnaGxpZ2h0Om5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LmhpZ2hsaWdodCBwcmV7b3ZlcmZsb3c6YXV0bzttYXgtd2lkdGg6MTAwJX0ubG9hZGVye2FuaW1hdGlvbjpzcGluQXJvdW5kIDUwMG1zIGluZmluaXRlIGxpbmVhcjtib3JkZXI6MnB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtib3JkZXItcmlnaHQtY29sb3I6dHJhbnNwYXJlbnQ7Ym9yZGVyLXRvcC1jb2xvcjp0cmFuc3BhcmVudDtjb250ZW50OlxcXCJcXFwiO2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjFyZW07cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MXJlbX0ubnVtYmVye2FsaWduLWl0ZW1zOmNlbnRlcjtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtkaXNwbGF5OmlubGluZS1mbGV4O2ZvbnQtc2l6ZToxLjI1cmVtO2hlaWdodDoyZW07anVzdGlmeS1jb250ZW50OmNlbnRlcjttYXJnaW4tcmlnaHQ6MS41cmVtO21pbi13aWR0aDoyLjVlbTtwYWRkaW5nOjAuMjVyZW0gMC41cmVtO3RleHQtYWxpZ246Y2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcH0uY2FyZC1oZWFkZXJ7YWxpZ24taXRlbXM6c3RyZXRjaDtib3gtc2hhZG93OjAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMSk7ZGlzcGxheTpmbGV4fS5jYXJkLWhlYWRlci10aXRsZXthbGlnbi1pdGVtczpjZW50ZXI7Y29sb3I6IzM2MzYzNjtkaXNwbGF5OmZsZXg7ZmxleC1ncm93OjE7Zm9udC13ZWlnaHQ6NzAwO3BhZGRpbmc6MC43NXJlbX0uY2FyZC1oZWFkZXItaWNvbnthbGlnbi1pdGVtczpjZW50ZXI7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZzowLjc1cmVtfS5jYXJkLWltYWdle2Rpc3BsYXk6YmxvY2s7cG9zaXRpb246cmVsYXRpdmV9LmNhcmQtY29udGVudHtwYWRkaW5nOjEuNXJlbX0uY2FyZC1jb250ZW50IC50aXRsZSsuc3VidGl0bGV7bWFyZ2luLXRvcDotMS41cmVtfS5jYXJkLWZvb3Rlcntib3JkZXItdG9wOjFweCBzb2xpZCAjZGJkYmRiO2FsaWduLWl0ZW1zOnN0cmV0Y2g7ZGlzcGxheTpmbGV4fS5jYXJkLWZvb3Rlci1pdGVte2FsaWduLWl0ZW1zOmNlbnRlcjtkaXNwbGF5OmZsZXg7ZmxleC1iYXNpczowO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmNlbnRlcjtwYWRkaW5nOjAuNzVyZW19LmNhcmQtZm9vdGVyLWl0ZW06bm90KDpsYXN0LWNoaWxkKXtib3JkZXItcmlnaHQ6MXB4IHNvbGlkICNkYmRiZGJ9LmNhcmR7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JveC1zaGFkb3c6MCAycHggM3B4IHJnYmEoMTAsMTAsMTAsMC4xKSwwIDAgMCAxcHggcmdiYSgxMCwxMCwxMCwwLjEpO2NvbG9yOiM0YTRhNGE7bWF4LXdpZHRoOjEwMCU7cG9zaXRpb246cmVsYXRpdmV9LmNhcmQgLm1lZGlhOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfS5sZXZlbC1pdGVte2FsaWduLWl0ZW1zOmNlbnRlcjtkaXNwbGF5OmZsZXg7ZmxleC1iYXNpczphdXRvO2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmNlbnRlcn0ubGV2ZWwtaXRlbSAudGl0bGUsLmxldmVsLWl0ZW0gLnN1YnRpdGxle21hcmdpbi1ib3R0b206MH1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmxldmVsLWl0ZW06bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNzVyZW19fS5sZXZlbC1sZWZ0LC5sZXZlbC1yaWdodHtmbGV4LWJhc2lzOmF1dG87ZmxleC1ncm93OjA7ZmxleC1zaHJpbms6MH0ubGV2ZWwtbGVmdCAubGV2ZWwtaXRlbTpub3QoOmxhc3QtY2hpbGQpLC5sZXZlbC1yaWdodCAubGV2ZWwtaXRlbTpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1yaWdodDowLjc1cmVtfS5sZXZlbC1sZWZ0IC5sZXZlbC1pdGVtLmlzLWZsZXhpYmxlLC5sZXZlbC1yaWdodCAubGV2ZWwtaXRlbS5pcy1mbGV4aWJsZXtmbGV4LWdyb3c6MX0ubGV2ZWwtbGVmdHthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5sZXZlbC1sZWZ0Ky5sZXZlbC1yaWdodHttYXJnaW4tdG9wOjEuNXJlbX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5sZXZlbC1sZWZ0e2Rpc3BsYXk6ZmxleH19LmxldmVsLXJpZ2h0e2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmR9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5sZXZlbC1yaWdodHtkaXNwbGF5OmZsZXh9fS5sZXZlbHthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW59LmxldmVsOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LmxldmVsIGNvZGV7Ym9yZGVyLXJhZGl1czozcHh9LmxldmVsIGltZ3tkaXNwbGF5OmlubGluZS1ibG9jazt2ZXJ0aWNhbC1hbGlnbjp0b3B9LmxldmVsLmlzLW1vYmlsZXtkaXNwbGF5OmZsZXh9LmxldmVsLmlzLW1vYmlsZT4ubGV2ZWwtaXRlbTpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MH0ubGV2ZWwuaXMtbW9iaWxlPi5sZXZlbC1pdGVtOm5vdCguaXMtbmFycm93KXtmbGV4LWdyb3c6MX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LmxldmVse2Rpc3BsYXk6ZmxleH0ubGV2ZWw+LmxldmVsLWl0ZW06bm90KC5pcy1uYXJyb3cpe2ZsZXgtZ3JvdzoxfX0ubWVkaWEtbGVmdCwubWVkaWEtcmlnaHR7ZmxleC1iYXNpczphdXRvO2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjB9Lm1lZGlhLWxlZnR7bWFyZ2luLXJpZ2h0OjFyZW19Lm1lZGlhLXJpZ2h0e21hcmdpbi1sZWZ0OjFyZW19Lm1lZGlhLWNvbnRlbnR7ZmxleC1iYXNpczphdXRvO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7dGV4dC1hbGlnbjpsZWZ0fS5tZWRpYXthbGlnbi1pdGVtczpmbGV4LXN0YXJ0O2Rpc3BsYXk6ZmxleDt0ZXh0LWFsaWduOmxlZnR9Lm1lZGlhIC5jb250ZW50Om5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfS5tZWRpYSAubWVkaWF7Ym9yZGVyLXRvcDoxcHggc29saWQgcmdiYSgyMTksMjE5LDIxOSwwLjUpO2Rpc3BsYXk6ZmxleDtwYWRkaW5nLXRvcDowLjc1cmVtfS5tZWRpYSAubWVkaWEgLmNvbnRlbnQ6bm90KDpsYXN0LWNoaWxkKSwubWVkaWEgLm1lZGlhIC5jb250cm9sOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjVyZW19Lm1lZGlhIC5tZWRpYSAubWVkaWF7cGFkZGluZy10b3A6MC41cmVtfS5tZWRpYSAubWVkaWEgLm1lZGlhKy5tZWRpYXttYXJnaW4tdG9wOjAuNXJlbX0ubWVkaWErLm1lZGlhe2JvcmRlci10b3A6MXB4IHNvbGlkIHJnYmEoMjE5LDIxOSwyMTksMC41KTttYXJnaW4tdG9wOjFyZW07cGFkZGluZy10b3A6MXJlbX0ubWVkaWEuaXMtbGFyZ2UrLm1lZGlhe21hcmdpbi10b3A6MS41cmVtO3BhZGRpbmctdG9wOjEuNXJlbX0ubWVudXtmb250LXNpemU6MXJlbX0ubWVudS1saXN0e2xpbmUtaGVpZ2h0OjEuMjV9Lm1lbnUtbGlzdCBhe2JvcmRlci1yYWRpdXM6MnB4O2NvbG9yOiM0YTRhNGE7ZGlzcGxheTpibG9jaztwYWRkaW5nOjAuNWVtIDAuNzVlbX0ubWVudS1saXN0IGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1O2NvbG9yOiMxODJiNzN9Lm1lbnUtbGlzdCBhLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0ubWVudS1saXN0IGxpIHVse2JvcmRlci1sZWZ0OjFweCBzb2xpZCAjZGJkYmRiO21hcmdpbjowLjc1ZW07cGFkZGluZy1sZWZ0OjAuNzVlbX0ubWVudS1sYWJlbHtjb2xvcjojN2E3YTdhO2ZvbnQtc2l6ZTowLjhlbTtsZXR0ZXItc3BhY2luZzowLjFlbTt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2V9Lm1lbnUtbGFiZWw6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLXRvcDoxZW19Lm1lbnUtbGFiZWw6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjFlbX0ubWVzc2FnZXtiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7Ym9yZGVyLXJhZGl1czozcHg7Zm9udC1zaXplOjFyZW19Lm1lc3NhZ2U6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0ubWVzc2FnZS5pcy13aGl0ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lm1lc3NhZ2UuaXMtd2hpdGUgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5tZXNzYWdlLmlzLXdoaXRlIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6IzRkNGQ0ZH0ubWVzc2FnZS5pcy1ibGFja3tiYWNrZ3JvdW5kLWNvbG9yOiNmYWZhZmF9Lm1lc3NhZ2UuaXMtYmxhY2sgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6IzBhMGEwYTtjb2xvcjojZmZmfS5tZXNzYWdlLmlzLWJsYWNrIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMwYTBhMGE7Y29sb3I6IzA5MDkwOX0ubWVzc2FnZS5pcy1saWdodHtiYWNrZ3JvdW5kLWNvbG9yOiNmYWZhZmF9Lm1lc3NhZ2UuaXMtbGlnaHQgLm1lc3NhZ2UtaGVhZGVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5tZXNzYWdlLmlzLWxpZ2h0IC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiNmNWY1ZjU7Y29sb3I6IzUwNTA1MH0ubWVzc2FnZS5pcy1kYXJre2JhY2tncm91bmQtY29sb3I6I2ZhZmFmYX0ubWVzc2FnZS5pcy1kYXJrIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0ubWVzc2FnZS5pcy1kYXJrIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMzNjM2MzY7Y29sb3I6IzJhMmEyYX0ubWVzc2FnZS5pcy1wcmltYXJ5e2JhY2tncm91bmQtY29sb3I6I2Y3ZjhmZH0ubWVzc2FnZS5pcy1wcmltYXJ5IC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMxODJiNzM7Y29sb3I6I2ZmZn0ubWVzc2FnZS5pcy1wcmltYXJ5IC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMxODJiNzM7Y29sb3I6IzE2MjY2Mn0ubWVzc2FnZS5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6I2Y2ZjlmZX0ubWVzc2FnZS5pcy1pbmZvIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMzMjczZGM7Y29sb3I6I2ZmZn0ubWVzc2FnZS5pcy1pbmZvIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMzMjczZGM7Y29sb3I6IzIyNTA5YX0ubWVzc2FnZS5pcy1zdWNjZXNze2JhY2tncm91bmQtY29sb3I6I2Y2ZmVmOX0ubWVzc2FnZS5pcy1zdWNjZXNzIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiMyM2QxNjA7Y29sb3I6I2ZmZn0ubWVzc2FnZS5pcy1zdWNjZXNzIC5tZXNzYWdlLWJvZHl7Ym9yZGVyLWNvbG9yOiMyM2QxNjA7Y29sb3I6IzBlMzAxYX0ubWVzc2FnZS5pcy13YXJuaW5ne2JhY2tncm91bmQtY29sb3I6I2ZmZmRmNX0ubWVzc2FnZS5pcy13YXJuaW5nIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmRkNTc7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5tZXNzYWdlLmlzLXdhcm5pbmcgLm1lc3NhZ2UtYm9keXtib3JkZXItY29sb3I6I2ZmZGQ1Nztjb2xvcjojM2IzMTA4fS5tZXNzYWdlLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY1ZjV9Lm1lc3NhZ2UuaXMtZGFuZ2VyIC5tZXNzYWdlLWhlYWRlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtjb2xvcjojZmZmfS5tZXNzYWdlLmlzLWRhbmdlciAubWVzc2FnZS1ib2R5e2JvcmRlci1jb2xvcjpyZWQ7Y29sb3I6I2FkMDYwNn0ubWVzc2FnZS1oZWFkZXJ7YWxpZ24taXRlbXM6Y2VudGVyO2JhY2tncm91bmQtY29sb3I6IzRhNGE0YTtib3JkZXItcmFkaXVzOjNweCAzcHggMCAwO2NvbG9yOiNmZmY7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2xpbmUtaGVpZ2h0OjEuMjU7cGFkZGluZzowLjVlbSAwLjc1ZW07cG9zaXRpb246cmVsYXRpdmV9Lm1lc3NhZ2UtaGVhZGVyIGEsLm1lc3NhZ2UtaGVhZGVyIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5tZXNzYWdlLWhlYWRlciBhe3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmV9Lm1lc3NhZ2UtaGVhZGVyIC5kZWxldGV7ZmxleC1ncm93OjA7ZmxleC1zaHJpbms6MDttYXJnaW4tbGVmdDowLjc1ZW19Lm1lc3NhZ2UtaGVhZGVyKy5tZXNzYWdlLWJvZHl7Ym9yZGVyLXRvcC1sZWZ0LXJhZGl1czowO2JvcmRlci10b3AtcmlnaHQtcmFkaXVzOjA7Ym9yZGVyLXRvcDpub25lfS5tZXNzYWdlLWJvZHl7Ym9yZGVyOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci1yYWRpdXM6M3B4O2NvbG9yOiM0YTRhNGE7cGFkZGluZzoxZW0gMS4yNWVtfS5tZXNzYWdlLWJvZHkgYSwubWVzc2FnZS1ib2R5IHN0cm9uZ3tjb2xvcjppbmhlcml0fS5tZXNzYWdlLWJvZHkgYXt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lfS5tZXNzYWdlLWJvZHkgY29kZSwubWVzc2FnZS1ib2R5IHByZXtiYWNrZ3JvdW5kOiNmZmZ9Lm1lc3NhZ2UtYm9keSBwcmUgY29kZXtiYWNrZ3JvdW5kOnRyYW5zcGFyZW50fS5tb2RhbC1iYWNrZ3JvdW5ke2JvdHRvbTowO2xlZnQ6MDtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO3RvcDowO2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjg2KX0ubW9kYWwtY29udGVudCwubW9kYWwtY2FyZHttYXJnaW46MCAyMHB4O21heC1oZWlnaHQ6Y2FsYygxMDB2aCAtIDE2MHB4KTtvdmVyZmxvdzphdXRvO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjEwMCV9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5tb2RhbC1jb250ZW50LC5tb2RhbC1jYXJke21hcmdpbjowIGF1dG87bWF4LWhlaWdodDpjYWxjKDEwMHZoIC0gNDBweCk7d2lkdGg6NjQwcHh9fS5tb2RhbC1jbG9zZXstd2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lOy1tcy11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmU7LW1vei1hcHBlYXJhbmNlOm5vbmU7LXdlYmtpdC1hcHBlYXJhbmNlOm5vbmU7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMik7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czoyOTA0ODZweDtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MXJlbTtoZWlnaHQ6MjBweDtvdXRsaW5lOm5vbmU7cG9zaXRpb246cmVsYXRpdmU7dHJhbnNmb3JtOnJvdGF0ZSg0NWRlZyk7dHJhbnNmb3JtLW9yaWdpbjpjZW50ZXIgY2VudGVyO3ZlcnRpY2FsLWFsaWduOnRvcDt3aWR0aDoyMHB4O2JhY2tncm91bmQ6bm9uZTtoZWlnaHQ6NDBweDtwb3NpdGlvbjpmaXhlZDtyaWdodDoyMHB4O3RvcDoyMHB4O3dpZHRoOjQwcHh9Lm1vZGFsLWNsb3NlOmJlZm9yZSwubW9kYWwtY2xvc2U6YWZ0ZXJ7YmFja2dyb3VuZC1jb2xvcjojZmZmO2NvbnRlbnQ6XFxcIlxcXCI7ZGlzcGxheTpibG9jaztsZWZ0OjUwJTtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSl9Lm1vZGFsLWNsb3NlOmJlZm9yZXtoZWlnaHQ6MnB4O3dpZHRoOjUwJX0ubW9kYWwtY2xvc2U6YWZ0ZXJ7aGVpZ2h0OjUwJTt3aWR0aDoycHh9Lm1vZGFsLWNsb3NlOmhvdmVyLC5tb2RhbC1jbG9zZTpmb2N1c3tiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4zKX0ubW9kYWwtY2xvc2U6YWN0aXZle2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjQpfS5tb2RhbC1jbG9zZS5pcy1zbWFsbHtoZWlnaHQ6MTRweDt3aWR0aDoxNHB4fS5tb2RhbC1jbG9zZS5pcy1tZWRpdW17aGVpZ2h0OjI2cHg7d2lkdGg6MjZweH0ubW9kYWwtY2xvc2UuaXMtbGFyZ2V7aGVpZ2h0OjMwcHg7d2lkdGg6MzBweH0ubW9kYWwtY2FyZHtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO21heC1oZWlnaHQ6Y2FsYygxMDB2aCAtIDQwcHgpO292ZXJmbG93OmhpZGRlbn0ubW9kYWwtY2FyZC1oZWFkLC5tb2RhbC1jYXJkLWZvb3R7YWxpZ24taXRlbXM6Y2VudGVyO2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtkaXNwbGF5OmZsZXg7ZmxleC1zaHJpbms6MDtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtwYWRkaW5nOjIwcHg7cG9zaXRpb246cmVsYXRpdmV9Lm1vZGFsLWNhcmQtaGVhZHtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZGJkYmRiO2JvcmRlci10b3AtbGVmdC1yYWRpdXM6NXB4O2JvcmRlci10b3AtcmlnaHQtcmFkaXVzOjVweH0ubW9kYWwtY2FyZC10aXRsZXtjb2xvcjojMzYzNjM2O2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjA7Zm9udC1zaXplOjEuNXJlbTtsaW5lLWhlaWdodDoxfS5tb2RhbC1jYXJkLWZvb3R7Ym9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1czo1cHg7Ym9yZGVyLWJvdHRvbS1yaWdodC1yYWRpdXM6NXB4O2JvcmRlci10b3A6MXB4IHNvbGlkICNkYmRiZGJ9Lm1vZGFsLWNhcmQtZm9vdCAuYnV0dG9uOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0OjEwcHh9Lm1vZGFsLWNhcmQtYm9keXstd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzp0b3VjaDtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MTtvdmVyZmxvdzphdXRvO3BhZGRpbmc6MjBweH0ubW9kYWx7Ym90dG9tOjA7bGVmdDowO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjA7YWxpZ24taXRlbXM6Y2VudGVyO2Rpc3BsYXk6bm9uZTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO292ZXJmbG93OmhpZGRlbjtwb3NpdGlvbjpmaXhlZDt6LWluZGV4OjE5ODZ9Lm1vZGFsLmlzLWFjdGl2ZXtkaXNwbGF5OmZsZXh9Lm5hdi10b2dnbGV7Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpibG9jaztoZWlnaHQ6My41cmVtO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjMuNXJlbX0ubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzRhNGE0YTtkaXNwbGF5OmJsb2NrO2hlaWdodDoxcHg7bGVmdDo1MCU7bWFyZ2luLWxlZnQ6LTdweDtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3RyYW5zaXRpb246bm9uZSA4Nm1zIGVhc2Utb3V0O3RyYW5zaXRpb24tcHJvcGVydHk6YmFja2dyb3VuZCwgbGVmdCwgb3BhY2l0eSwgdHJhbnNmb3JtO3dpZHRoOjE1cHh9Lm5hdi10b2dnbGUgc3BhbjpudGgtY2hpbGQoMSl7bWFyZ2luLXRvcDotNnB4fS5uYXYtdG9nZ2xlIHNwYW46bnRoLWNoaWxkKDIpe21hcmdpbi10b3A6LTFweH0ubmF2LXRvZ2dsZSBzcGFuOm50aC1jaGlsZCgzKXttYXJnaW4tdG9wOjRweH0ubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9Lm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojMTgyYjczfS5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFuOm50aC1jaGlsZCgxKXttYXJnaW4tbGVmdDotNXB4O3RyYW5zZm9ybTpyb3RhdGUoNDVkZWcpO3RyYW5zZm9ybS1vcmlnaW46bGVmdCB0b3B9Lm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW46bnRoLWNoaWxkKDIpe29wYWNpdHk6MH0ubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbjpudGgtY2hpbGQoMyl7bWFyZ2luLWxlZnQ6LTVweDt0cmFuc2Zvcm06cm90YXRlKC00NWRlZyk7dHJhbnNmb3JtLW9yaWdpbjpsZWZ0IGJvdHRvbX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7Lm5hdi10b2dnbGV7ZGlzcGxheTpub25lfX0ubmF2LWl0ZW17YWxpZ24taXRlbXM6Y2VudGVyO2Rpc3BsYXk6ZmxleDtmbGV4LWdyb3c6MDtmbGV4LXNocmluazowO2ZvbnQtc2l6ZToxcmVtO2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZzowLjVyZW0gMC43NXJlbX0ubmF2LWl0ZW0gYXtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowfS5uYXYtaXRlbSBpbWd7bWF4LWhlaWdodDoxLjc1cmVtfS5uYXYtaXRlbSAuYnV0dG9uKy5idXR0b257bWFyZ2luLWxlZnQ6MC43NXJlbX0ubmF2LWl0ZW0gLnRhZzpmaXJzdC1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1yaWdodDowLjVyZW19Lm5hdi1pdGVtIC50YWc6bGFzdC1jaGlsZDpub3QoOmZpcnN0LWNoaWxkKXttYXJnaW4tbGVmdDowLjVyZW19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5uYXYtaXRlbXtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydH19Lm5hdi1pdGVtIGEsYS5uYXYtaXRlbXtjb2xvcjojN2E3YTdhfS5uYXYtaXRlbSBhOmhvdmVyLGEubmF2LWl0ZW06aG92ZXJ7Y29sb3I6IzM2MzYzNn0ubmF2LWl0ZW0gYS5pcy1hY3RpdmUsYS5uYXYtaXRlbS5pcy1hY3RpdmV7Y29sb3I6IzM2MzYzNn0ubmF2LWl0ZW0gYS5pcy10YWIsYS5uYXYtaXRlbS5pcy10YWJ7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgdHJhbnNwYXJlbnQ7Ym9yZGVyLXRvcDoxcHggc29saWQgdHJhbnNwYXJlbnQ7cGFkZGluZy1ib3R0b206Y2FsYygwLjVyZW0gLSAxcHgpO3BhZGRpbmctbGVmdDoxcmVtO3BhZGRpbmctcmlnaHQ6MXJlbTtwYWRkaW5nLXRvcDpjYWxjKDAuNXJlbSAtIDFweCl9Lm5hdi1pdGVtIGEuaXMtdGFiOmhvdmVyLGEubmF2LWl0ZW0uaXMtdGFiOmhvdmVye2JvcmRlci1ib3R0b20tY29sb3I6IzE4MmI3Mztib3JkZXItdG9wLWNvbG9yOnRyYW5zcGFyZW50fS5uYXYtaXRlbSBhLmlzLXRhYi5pcy1hY3RpdmUsYS5uYXYtaXRlbS5pcy10YWIuaXMtYWN0aXZle2JvcmRlci1ib3R0b206M3B4IHNvbGlkICMxODJiNzM7Y29sb3I6IzE4MmI3MztwYWRkaW5nLWJvdHRvbTpjYWxjKDAuNXJlbSAtIDNweCl9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsubmF2LWl0ZW0gYS5pcy1icmFuZCxhLm5hdi1pdGVtLmlzLWJyYW5ke3BhZGRpbmctbGVmdDowfX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3gtc2hhZG93OjAgNHB4IDdweCByZ2JhKDEwLDEwLDEwLDAuMSk7bGVmdDowO2Rpc3BsYXk6bm9uZTtyaWdodDowO3RvcDoxMDAlO3Bvc2l0aW9uOmFic29sdXRlfS5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcDoxcHggc29saWQgcmdiYSgyMTksMjE5LDIxOSwwLjUpO3BhZGRpbmc6MC43NXJlbX0ubmF2LW1lbnUuaXMtYWN0aXZle2Rpc3BsYXk6YmxvY2t9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KSBhbmQgKG1heC13aWR0aDogOTk5cHgpey5uYXYtbWVudXtwYWRkaW5nLXJpZ2h0OjEuNXJlbX19Lm5hdi1sZWZ0LC5uYXYtcmlnaHR7YWxpZ24taXRlbXM6c3RyZXRjaDtmbGV4LWJhc2lzOjA7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0ubmF2LWxlZnR7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O292ZXJmbG93OmhpZGRlbjtvdmVyZmxvdy14OmF1dG87d2hpdGUtc3BhY2U6bm93cmFwfS5uYXYtY2VudGVye2FsaWduLWl0ZW1zOnN0cmV0Y2g7ZGlzcGxheTpmbGV4O2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmNlbnRlcjttYXJnaW4tbGVmdDphdXRvO21hcmdpbi1yaWdodDphdXRvfS5uYXYtcmlnaHR7anVzdGlmeS1jb250ZW50OmZsZXgtZW5kfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsubmF2LXJpZ2h0e2Rpc3BsYXk6ZmxleH19Lm5hdnthbGlnbi1pdGVtczpzdHJldGNoO2JhY2tncm91bmQtY29sb3I6I2ZmZjtkaXNwbGF5OmZsZXg7bWluLWhlaWdodDozLjVyZW07cG9zaXRpb246cmVsYXRpdmU7dGV4dC1hbGlnbjpjZW50ZXI7ei1pbmRleDoyfS5uYXY+LmNvbnRhaW5lcnthbGlnbi1pdGVtczpzdHJldGNoO2Rpc3BsYXk6ZmxleDttaW4taGVpZ2h0OjMuNXJlbTt3aWR0aDoxMDAlfS5uYXYuaGFzLXNoYWRvd3tib3gtc2hhZG93OjAgMnB4IDNweCByZ2JhKDEwLDEwLDEwLDAuMSl9LnBhZ2luYXRpb24sLnBhZ2luYXRpb24tbGlzdHthbGlnbi1pdGVtczpjZW50ZXI7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXI7dGV4dC1hbGlnbjpjZW50ZXJ9LnBhZ2luYXRpb24tcHJldmlvdXMsLnBhZ2luYXRpb24tbmV4dCwucGFnaW5hdGlvbi1saW5rLC5wYWdpbmF0aW9uLWVsbGlwc2lzey1tb3otYXBwZWFyYW5jZTpub25lOy13ZWJraXQtYXBwZWFyYW5jZTpub25lO2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXI6bm9uZTtib3JkZXItcmFkaXVzOjNweDtib3gtc2hhZG93Om5vbmU7ZGlzcGxheTppbmxpbmUtZmxleDtmb250LXNpemU6MXJlbTtoZWlnaHQ6Mi4yODVlbTtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1zdGFydDtsaW5lLWhlaWdodDoxLjU7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbTtwb3NpdGlvbjpyZWxhdGl2ZTt2ZXJ0aWNhbC1hbGlnbjp0b3A7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTstbXMtdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lO2ZvbnQtc2l6ZTowLjg3NXJlbTtwYWRkaW5nLWxlZnQ6MC41ZW07cGFkZGluZy1yaWdodDowLjVlbTtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3RleHQtYWxpZ246Y2VudGVyfS5wYWdpbmF0aW9uLXByZXZpb3VzOmZvY3VzLC5wYWdpbmF0aW9uLXByZXZpb3VzLmlzLWZvY3VzZWQsLnBhZ2luYXRpb24tcHJldmlvdXM6YWN0aXZlLC5wYWdpbmF0aW9uLXByZXZpb3VzLmlzLWFjdGl2ZSwucGFnaW5hdGlvbi1uZXh0OmZvY3VzLC5wYWdpbmF0aW9uLW5leHQuaXMtZm9jdXNlZCwucGFnaW5hdGlvbi1uZXh0OmFjdGl2ZSwucGFnaW5hdGlvbi1uZXh0LmlzLWFjdGl2ZSwucGFnaW5hdGlvbi1saW5rOmZvY3VzLC5wYWdpbmF0aW9uLWxpbmsuaXMtZm9jdXNlZCwucGFnaW5hdGlvbi1saW5rOmFjdGl2ZSwucGFnaW5hdGlvbi1saW5rLmlzLWFjdGl2ZSwucGFnaW5hdGlvbi1lbGxpcHNpczpmb2N1cywucGFnaW5hdGlvbi1lbGxpcHNpcy5pcy1mb2N1c2VkLC5wYWdpbmF0aW9uLWVsbGlwc2lzOmFjdGl2ZSwucGFnaW5hdGlvbi1lbGxpcHNpcy5pcy1hY3RpdmV7b3V0bGluZTpub25lfS5wYWdpbmF0aW9uLXByZXZpb3VzW2Rpc2FibGVkXSwucGFnaW5hdGlvbi1wcmV2aW91cy5pcy1kaXNhYmxlZCwucGFnaW5hdGlvbi1uZXh0W2Rpc2FibGVkXSwucGFnaW5hdGlvbi1uZXh0LmlzLWRpc2FibGVkLC5wYWdpbmF0aW9uLWxpbmtbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLWxpbmsuaXMtZGlzYWJsZWQsLnBhZ2luYXRpb24tZWxsaXBzaXNbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLWVsbGlwc2lzLmlzLWRpc2FibGVke3BvaW50ZXItZXZlbnRzOm5vbmV9LnBhZ2luYXRpb24tcHJldmlvdXMsLnBhZ2luYXRpb24tbmV4dCwucGFnaW5hdGlvbi1saW5re2JvcmRlcjoxcHggc29saWQgI2RiZGJkYjttaW4td2lkdGg6Mi41ZW19LnBhZ2luYXRpb24tcHJldmlvdXM6aG92ZXIsLnBhZ2luYXRpb24tbmV4dDpob3ZlciwucGFnaW5hdGlvbi1saW5rOmhvdmVye2JvcmRlci1jb2xvcjojYjViNWI1O2NvbG9yOiMzNjM2MzZ9LnBhZ2luYXRpb24tcHJldmlvdXM6Zm9jdXMsLnBhZ2luYXRpb24tbmV4dDpmb2N1cywucGFnaW5hdGlvbi1saW5rOmZvY3Vze2JvcmRlci1jb2xvcjojMTgyYjczfS5wYWdpbmF0aW9uLXByZXZpb3VzOmFjdGl2ZSwucGFnaW5hdGlvbi1uZXh0OmFjdGl2ZSwucGFnaW5hdGlvbi1saW5rOmFjdGl2ZXtib3gtc2hhZG93Omluc2V0IDAgMXB4IDJweCByZ2JhKDEwLDEwLDEwLDAuMil9LnBhZ2luYXRpb24tcHJldmlvdXNbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLXByZXZpb3VzLmlzLWRpc2FibGVkLC5wYWdpbmF0aW9uLW5leHRbZGlzYWJsZWRdLC5wYWdpbmF0aW9uLW5leHQuaXMtZGlzYWJsZWQsLnBhZ2luYXRpb24tbGlua1tkaXNhYmxlZF0sLnBhZ2luYXRpb24tbGluay5pcy1kaXNhYmxlZHtiYWNrZ3JvdW5kOiNkYmRiZGI7Y29sb3I6IzdhN2E3YTtvcGFjaXR5OjAuNTtwb2ludGVyLWV2ZW50czpub25lfS5wYWdpbmF0aW9uLXByZXZpb3VzLC5wYWdpbmF0aW9uLW5leHR7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbX0ucGFnaW5hdGlvbi1saW5rLmlzLWN1cnJlbnR7YmFja2dyb3VuZC1jb2xvcjojMTgyYjczO2JvcmRlci1jb2xvcjojMTgyYjczO2NvbG9yOiNmZmZ9LnBhZ2luYXRpb24tZWxsaXBzaXN7Y29sb3I6I2I1YjViNTtwb2ludGVyLWV2ZW50czpub25lfS5wYWdpbmF0aW9uLWxpc3QgbGk6bm90KDpmaXJzdC1jaGlsZCl7bWFyZ2luLWxlZnQ6MC4zNzVyZW19QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5wYWdpbmF0aW9ue2ZsZXgtd3JhcDp3cmFwfS5wYWdpbmF0aW9uLXByZXZpb3VzLC5wYWdpbmF0aW9uLW5leHR7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MTt3aWR0aDpjYWxjKDUwJSAtIDAuMzc1cmVtKX0ucGFnaW5hdGlvbi1uZXh0e21hcmdpbi1sZWZ0OjAuNzVyZW19LnBhZ2luYXRpb24tbGlzdHttYXJnaW4tdG9wOjAuNzVyZW19LnBhZ2luYXRpb24tbGlzdCBsaXtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7LnBhZ2luYXRpb24tbGlzdHtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O29yZGVyOjF9LnBhZ2luYXRpb24tcHJldmlvdXMsLnBhZ2luYXRpb24tbmV4dHttYXJnaW4tbGVmdDowLjc1cmVtfS5wYWdpbmF0aW9uLXByZXZpb3Vze29yZGVyOjJ9LnBhZ2luYXRpb24tbmV4dHtvcmRlcjozfS5wYWdpbmF0aW9ue2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVufS5wYWdpbmF0aW9uLmlzLWNlbnRlcmVkIC5wYWdpbmF0aW9uLXByZXZpb3Vze21hcmdpbi1sZWZ0OjA7b3JkZXI6MX0ucGFnaW5hdGlvbi5pcy1jZW50ZXJlZCAucGFnaW5hdGlvbi1saXN0e2p1c3RpZnktY29udGVudDpjZW50ZXI7b3JkZXI6Mn0ucGFnaW5hdGlvbi5pcy1jZW50ZXJlZCAucGFnaW5hdGlvbi1uZXh0e29yZGVyOjN9LnBhZ2luYXRpb24uaXMtcmlnaHQgLnBhZ2luYXRpb24tcHJldmlvdXN7bWFyZ2luLWxlZnQ6MDtvcmRlcjoxfS5wYWdpbmF0aW9uLmlzLXJpZ2h0IC5wYWdpbmF0aW9uLW5leHR7b3JkZXI6MjttYXJnaW4tcmlnaHQ6MC43NXJlbX0ucGFnaW5hdGlvbi5pcy1yaWdodCAucGFnaW5hdGlvbi1saXN0e2p1c3RpZnktY29udGVudDpmbGV4LWVuZDtvcmRlcjozfX0ucGFuZWx7Zm9udC1zaXplOjFyZW19LnBhbmVsOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbToxLjVyZW19LnBhbmVsLWhlYWRpbmcsLnBhbmVsLXRhYnMsLnBhbmVsLWJsb2Nre2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLWxlZnQ6MXB4IHNvbGlkICNkYmRiZGI7Ym9yZGVyLXJpZ2h0OjFweCBzb2xpZCAjZGJkYmRifS5wYW5lbC1oZWFkaW5nOmZpcnN0LWNoaWxkLC5wYW5lbC10YWJzOmZpcnN0LWNoaWxkLC5wYW5lbC1ibG9jazpmaXJzdC1jaGlsZHtib3JkZXItdG9wOjFweCBzb2xpZCAjZGJkYmRifS5wYW5lbC1oZWFkaW5ne2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItcmFkaXVzOjNweCAzcHggMCAwO2NvbG9yOiMzNjM2MzY7Zm9udC1zaXplOjEuMjVlbTtmb250LXdlaWdodDozMDA7bGluZS1oZWlnaHQ6MS4yNTtwYWRkaW5nOjAuNWVtIDAuNzVlbX0ucGFuZWwtdGFic3thbGlnbi1pdGVtczpmbGV4LWVuZDtkaXNwbGF5OmZsZXg7Zm9udC1zaXplOjAuODc1ZW07anVzdGlmeS1jb250ZW50OmNlbnRlcn0ucGFuZWwtdGFicyBhe2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNkYmRiZGI7bWFyZ2luLWJvdHRvbTotMXB4O3BhZGRpbmc6MC41ZW19LnBhbmVsLXRhYnMgYS5pcy1hY3RpdmV7Ym9yZGVyLWJvdHRvbS1jb2xvcjojNGE0YTRhO2NvbG9yOiMzNjM2MzZ9LnBhbmVsLWxpc3QgYXtjb2xvcjojNGE0YTRhfS5wYW5lbC1saXN0IGE6aG92ZXJ7Y29sb3I6IzE4MmI3M30ucGFuZWwtYmxvY2t7YWxpZ24taXRlbXM6Y2VudGVyO2NvbG9yOiMzNjM2MzY7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpmbGV4LXN0YXJ0O3BhZGRpbmc6MC41ZW0gMC43NWVtfS5wYW5lbC1ibG9jayBpbnB1dFt0eXBlPVxcXCJjaGVja2JveFxcXCJde21hcmdpbi1yaWdodDowLjc1ZW19LnBhbmVsLWJsb2NrPi5jb250cm9se2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7d2lkdGg6MTAwJX0ucGFuZWwtYmxvY2suaXMtYWN0aXZle2JvcmRlci1sZWZ0LWNvbG9yOiMxODJiNzM7Y29sb3I6IzM2MzYzNn0ucGFuZWwtYmxvY2suaXMtYWN0aXZlIC5wYW5lbC1pY29ue2NvbG9yOiMxODJiNzN9YS5wYW5lbC1ibG9jayxsYWJlbC5wYW5lbC1ibG9ja3tjdXJzb3I6cG9pbnRlcn1hLnBhbmVsLWJsb2NrOmhvdmVyLGxhYmVsLnBhbmVsLWJsb2NrOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNX0ucGFuZWwtaWNvbntkaXNwbGF5OmlubGluZS1ibG9jaztmb250LXNpemU6MTRweDtoZWlnaHQ6MWVtO2xpbmUtaGVpZ2h0OjFlbTt0ZXh0LWFsaWduOmNlbnRlcjt2ZXJ0aWNhbC1hbGlnbjp0b3A7d2lkdGg6MWVtO2NvbG9yOiM3YTdhN2E7bWFyZ2luLXJpZ2h0OjAuNzVlbX0ucGFuZWwtaWNvbiAuZmF7Zm9udC1zaXplOmluaGVyaXQ7bGluZS1oZWlnaHQ6aW5oZXJpdH0udGFic3std2Via2l0LXRvdWNoLWNhbGxvdXQ6bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lOy1tcy11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmU7YWxpZ24taXRlbXM6c3RyZXRjaDtkaXNwbGF5OmZsZXg7Zm9udC1zaXplOjFyZW07anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47b3ZlcmZsb3c6aGlkZGVuO292ZXJmbG93LXg6YXV0bzt3aGl0ZS1zcGFjZTpub3dyYXB9LnRhYnM6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0udGFicyBhe2FsaWduLWl0ZW1zOmNlbnRlcjtib3JkZXItYm90dG9tOjFweCBzb2xpZCAjZGJkYmRiO2NvbG9yOiM0YTRhNGE7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXI7bWFyZ2luLWJvdHRvbTotMXB4O3BhZGRpbmc6MC41ZW0gMWVtO3ZlcnRpY2FsLWFsaWduOnRvcH0udGFicyBhOmhvdmVye2JvcmRlci1ib3R0b20tY29sb3I6IzM2MzYzNjtjb2xvcjojMzYzNjM2fS50YWJzIGxpe2Rpc3BsYXk6YmxvY2t9LnRhYnMgbGkuaXMtYWN0aXZlIGF7Ym9yZGVyLWJvdHRvbS1jb2xvcjojMTgyYjczO2NvbG9yOiMxODJiNzN9LnRhYnMgdWx7YWxpZ24taXRlbXM6Y2VudGVyO2JvcmRlci1ib3R0b206MXB4IHNvbGlkICNkYmRiZGI7ZGlzcGxheTpmbGV4O2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjA7anVzdGlmeS1jb250ZW50OmZsZXgtc3RhcnR9LnRhYnMgdWwuaXMtbGVmdHtwYWRkaW5nLXJpZ2h0OjAuNzVlbX0udGFicyB1bC5pcy1jZW50ZXJ7ZmxleDpub25lO2p1c3RpZnktY29udGVudDpjZW50ZXI7cGFkZGluZy1sZWZ0OjAuNzVlbTtwYWRkaW5nLXJpZ2h0OjAuNzVlbX0udGFicyB1bC5pcy1yaWdodHtqdXN0aWZ5LWNvbnRlbnQ6ZmxleC1lbmQ7cGFkZGluZy1sZWZ0OjAuNzVlbX0udGFicyAuaWNvbjpmaXJzdC1jaGlsZHttYXJnaW4tcmlnaHQ6MC41ZW19LnRhYnMgLmljb246bGFzdC1jaGlsZHttYXJnaW4tbGVmdDowLjVlbX0udGFicy5pcy1jZW50ZXJlZCB1bHtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyfS50YWJzLmlzLXJpZ2h0IHVse2p1c3RpZnktY29udGVudDpmbGV4LWVuZH0udGFicy5pcy1ib3hlZCBhe2JvcmRlcjoxcHggc29saWQgdHJhbnNwYXJlbnQ7Ym9yZGVyLXJhZGl1czozcHggM3B4IDAgMH0udGFicy5pcy1ib3hlZCBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItYm90dG9tLWNvbG9yOiNkYmRiZGJ9LnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGF7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JvcmRlci1jb2xvcjojZGJkYmRiO2JvcmRlci1ib3R0b20tY29sb3I6dHJhbnNwYXJlbnQgIWltcG9ydGFudH0udGFicy5pcy1mdWxsd2lkdGggbGl7ZmxleC1ncm93OjE7ZmxleC1zaHJpbms6MH0udGFicy5pcy10b2dnbGUgYXtib3JkZXI6MXB4IHNvbGlkICNkYmRiZGI7bWFyZ2luLWJvdHRvbTowO3Bvc2l0aW9uOnJlbGF0aXZlfS50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItY29sb3I6I2I1YjViNTt6LWluZGV4OjJ9LnRhYnMuaXMtdG9nZ2xlIGxpK2xpe21hcmdpbi1sZWZ0Oi0xcHh9LnRhYnMuaXMtdG9nZ2xlIGxpOmZpcnN0LWNoaWxkIGF7Ym9yZGVyLXJhZGl1czozcHggMCAwIDNweH0udGFicy5pcy10b2dnbGUgbGk6bGFzdC1jaGlsZCBhe2JvcmRlci1yYWRpdXM6MCAzcHggM3B4IDB9LnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhe2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztib3JkZXItY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmO3otaW5kZXg6MX0udGFicy5pcy10b2dnbGUgdWx7Ym9yZGVyLWJvdHRvbTpub25lfS50YWJzLmlzLXNtYWxse2ZvbnQtc2l6ZTouNzVyZW19LnRhYnMuaXMtbWVkaXVte2ZvbnQtc2l6ZToxLjI1cmVtfS50YWJzLmlzLWxhcmdle2ZvbnQtc2l6ZToxLjVyZW19LmNvbHVtbntkaXNwbGF5OmJsb2NrO2ZsZXgtYmFzaXM6MDtmbGV4LWdyb3c6MTtmbGV4LXNocmluazoxO3BhZGRpbmc6MC43NXJlbX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1uYXJyb3d7ZmxleDpub25lfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLWZ1bGx7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtdGhyZWUtcXVhcnRlcnN7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy10d28tdGhpcmRze2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1oYWxme2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb25lLXRoaXJke2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vbmUtcXVhcnRlcntmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVyc3ttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LXR3by10aGlyZHN7bWFyZ2luLWxlZnQ6NjYuNjY2NiV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LWhhbGZ7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmR7bWFyZ2luLWxlZnQ6MzMuMzMzMyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LW9uZS1xdWFydGVye21hcmdpbi1sZWZ0OjI1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0xe2ZsZXg6bm9uZTt3aWR0aDo4LjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtMXttYXJnaW4tbGVmdDo4LjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0ye2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTJ7bWFyZ2luLWxlZnQ6MTYuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTN7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtM3ttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtNHtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC00e21hcmdpbi1sZWZ0OjMzLjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy01e2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTV7bWFyZ2luLWxlZnQ6NDEuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTZ7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtNnttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtN3tmbGV4Om5vbmU7d2lkdGg6NTguMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLW9mZnNldC03e21hcmdpbi1sZWZ0OjU4LjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy04e2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTh7bWFyZ2luLWxlZnQ6NjYuNjY2NjclfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTl7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtOXttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtMTB7ZmxleDpub25lO3dpZHRoOjgzLjMzMzMzJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtMTB7bWFyZ2luLWxlZnQ6ODMuMzMzMzMlfS5jb2x1bW5zLmlzLW1vYmlsZT4uY29sdW1uLmlzLTExe2ZsZXg6bm9uZTt3aWR0aDo5MS42NjY2NyV9LmNvbHVtbnMuaXMtbW9iaWxlPi5jb2x1bW4uaXMtb2Zmc2V0LTExe21hcmdpbi1sZWZ0OjkxLjY2NjY3JX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy0xMntmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1ucy5pcy1tb2JpbGU+LmNvbHVtbi5pcy1vZmZzZXQtMTJ7bWFyZ2luLWxlZnQ6MTAwJX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7LmNvbHVtbi5pcy1uYXJyb3ctbW9iaWxle2ZsZXg6bm9uZX0uY29sdW1uLmlzLWZ1bGwtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtdGhyZWUtcXVhcnRlcnMtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy10d28tdGhpcmRzLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbi5pcy1oYWxmLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb25lLXRoaXJkLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6MzMuMzMzMyV9LmNvbHVtbi5pcy1vbmUtcXVhcnRlci1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycy1tb2JpbGV7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LXR3by10aGlyZHMtbW9iaWxle21hcmdpbi1sZWZ0OjY2LjY2NjYlfS5jb2x1bW4uaXMtb2Zmc2V0LWhhbGYtbW9iaWxle21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmQtbW9iaWxle21hcmdpbi1sZWZ0OjMzLjMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LW9uZS1xdWFydGVyLW1vYmlsZXttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy0xLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMS1tb2JpbGV7bWFyZ2luLWxlZnQ6OC4zMzMzMyV9LmNvbHVtbi5pcy0yLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTItbW9iaWxle21hcmdpbi1sZWZ0OjE2LjY2NjY3JX0uY29sdW1uLmlzLTMtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtMy1tb2JpbGV7bWFyZ2luLWxlZnQ6MjUlfS5jb2x1bW4uaXMtNC1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC00LW1vYmlsZXttYXJnaW4tbGVmdDozMy4zMzMzMyV9LmNvbHVtbi5pcy01LW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTUtbW9iaWxle21hcmdpbi1sZWZ0OjQxLjY2NjY3JX0uY29sdW1uLmlzLTYtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtNi1tb2JpbGV7bWFyZ2luLWxlZnQ6NTAlfS5jb2x1bW4uaXMtNy1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC03LW1vYmlsZXttYXJnaW4tbGVmdDo1OC4zMzMzMyV9LmNvbHVtbi5pcy04LW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTgtbW9iaWxle21hcmdpbi1sZWZ0OjY2LjY2NjY3JX0uY29sdW1uLmlzLTktbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtOS1tb2JpbGV7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtMTAtbW9iaWxle2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMTAtbW9iaWxle21hcmdpbi1sZWZ0OjgzLjMzMzMzJX0uY29sdW1uLmlzLTExLW1vYmlsZXtmbGV4Om5vbmU7d2lkdGg6OTEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTExLW1vYmlsZXttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbi5pcy0xMi1tb2JpbGV7ZmxleDpub25lO3dpZHRoOjEwMCV9LmNvbHVtbi5pcy1vZmZzZXQtMTItbW9iaWxle21hcmdpbi1sZWZ0OjEwMCV9fUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuY29sdW1uLmlzLW5hcnJvdywuY29sdW1uLmlzLW5hcnJvdy10YWJsZXR7ZmxleDpub25lfS5jb2x1bW4uaXMtZnVsbCwuY29sdW1uLmlzLWZ1bGwtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtdGhyZWUtcXVhcnRlcnMsLmNvbHVtbi5pcy10aHJlZS1xdWFydGVycy10YWJsZXR7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLXR3by10aGlyZHMsLmNvbHVtbi5pcy10d28tdGhpcmRzLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbi5pcy1oYWxmLC5jb2x1bW4uaXMtaGFsZi10YWJsZXR7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9uZS10aGlyZCwuY29sdW1uLmlzLW9uZS10aGlyZC10YWJsZXR7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMlfS5jb2x1bW4uaXMtb25lLXF1YXJ0ZXIsLmNvbHVtbi5pcy1vbmUtcXVhcnRlci10YWJsZXR7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycywuY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycy10YWJsZXR7bWFyZ2luLWxlZnQ6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LXR3by10aGlyZHMsLmNvbHVtbi5pcy1vZmZzZXQtdHdvLXRoaXJkcy10YWJsZXR7bWFyZ2luLWxlZnQ6NjYuNjY2NiV9LmNvbHVtbi5pcy1vZmZzZXQtaGFsZiwuY29sdW1uLmlzLW9mZnNldC1oYWxmLXRhYmxldHttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXRoaXJkLC5jb2x1bW4uaXMtb2Zmc2V0LW9uZS10aGlyZC10YWJsZXR7bWFyZ2luLWxlZnQ6MzMuMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtb25lLXF1YXJ0ZXIsLmNvbHVtbi5pcy1vZmZzZXQtb25lLXF1YXJ0ZXItdGFibGV0e21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTEsLmNvbHVtbi5pcy0xLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMSwuY29sdW1uLmlzLW9mZnNldC0xLXRhYmxldHttYXJnaW4tbGVmdDo4LjMzMzMzJX0uY29sdW1uLmlzLTIsLmNvbHVtbi5pcy0yLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6MTYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTIsLmNvbHVtbi5pcy1vZmZzZXQtMi10YWJsZXR7bWFyZ2luLWxlZnQ6MTYuNjY2NjclfS5jb2x1bW4uaXMtMywuY29sdW1uLmlzLTMtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDoyNSV9LmNvbHVtbi5pcy1vZmZzZXQtMywuY29sdW1uLmlzLW9mZnNldC0zLXRhYmxldHttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy00LC5jb2x1bW4uaXMtNC10YWJsZXR7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC00LC5jb2x1bW4uaXMtb2Zmc2V0LTQtdGFibGV0e21hcmdpbi1sZWZ0OjMzLjMzMzMzJX0uY29sdW1uLmlzLTUsLmNvbHVtbi5pcy01LXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NDEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTUsLmNvbHVtbi5pcy1vZmZzZXQtNS10YWJsZXR7bWFyZ2luLWxlZnQ6NDEuNjY2NjclfS5jb2x1bW4uaXMtNiwuY29sdW1uLmlzLTYtdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo1MCV9LmNvbHVtbi5pcy1vZmZzZXQtNiwuY29sdW1uLmlzLW9mZnNldC02LXRhYmxldHttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy03LC5jb2x1bW4uaXMtNy10YWJsZXR7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC03LC5jb2x1bW4uaXMtb2Zmc2V0LTctdGFibGV0e21hcmdpbi1sZWZ0OjU4LjMzMzMzJX0uY29sdW1uLmlzLTgsLmNvbHVtbi5pcy04LXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTgsLmNvbHVtbi5pcy1vZmZzZXQtOC10YWJsZXR7bWFyZ2luLWxlZnQ6NjYuNjY2NjclfS5jb2x1bW4uaXMtOSwuY29sdW1uLmlzLTktdGFibGV0e2ZsZXg6bm9uZTt3aWR0aDo3NSV9LmNvbHVtbi5pcy1vZmZzZXQtOSwuY29sdW1uLmlzLW9mZnNldC05LXRhYmxldHttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy0xMCwuY29sdW1uLmlzLTEwLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6ODMuMzMzMzMlfS5jb2x1bW4uaXMtb2Zmc2V0LTEwLC5jb2x1bW4uaXMtb2Zmc2V0LTEwLXRhYmxldHttYXJnaW4tbGVmdDo4My4zMzMzMyV9LmNvbHVtbi5pcy0xMSwuY29sdW1uLmlzLTExLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6OTEuNjY2NjclfS5jb2x1bW4uaXMtb2Zmc2V0LTExLC5jb2x1bW4uaXMtb2Zmc2V0LTExLXRhYmxldHttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbi5pcy0xMiwuY29sdW1uLmlzLTEyLXRhYmxldHtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLW9mZnNldC0xMiwuY29sdW1uLmlzLW9mZnNldC0xMi10YWJsZXR7bWFyZ2luLWxlZnQ6MTAwJX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuY29sdW1uLmlzLW5hcnJvdy1kZXNrdG9we2ZsZXg6bm9uZX0uY29sdW1uLmlzLWZ1bGwtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLXRocmVlLXF1YXJ0ZXJzLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLXR3by10aGlyZHMtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbi5pcy1oYWxmLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9uZS10aGlyZC1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzJX0uY29sdW1uLmlzLW9uZS1xdWFydGVyLWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycy1kZXNrdG9we21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLW9mZnNldC10d28tdGhpcmRzLWRlc2t0b3B7bWFyZ2luLWxlZnQ6NjYuNjY2NiV9LmNvbHVtbi5pcy1vZmZzZXQtaGFsZi1kZXNrdG9we21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmQtZGVza3RvcHttYXJnaW4tbGVmdDozMy4zMzMzJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtcXVhcnRlci1kZXNrdG9we21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTEtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMS1kZXNrdG9we21hcmdpbi1sZWZ0OjguMzMzMzMlfS5jb2x1bW4uaXMtMi1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMi1kZXNrdG9we21hcmdpbi1sZWZ0OjE2LjY2NjY3JX0uY29sdW1uLmlzLTMtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LTMtZGVza3RvcHttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy00LWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC00LWRlc2t0b3B7bWFyZ2luLWxlZnQ6MzMuMzMzMzMlfS5jb2x1bW4uaXMtNS1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtNS1kZXNrdG9we21hcmdpbi1sZWZ0OjQxLjY2NjY3JX0uY29sdW1uLmlzLTYtZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LTYtZGVza3RvcHttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy03LWRlc2t0b3B7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC03LWRlc2t0b3B7bWFyZ2luLWxlZnQ6NTguMzMzMzMlfS5jb2x1bW4uaXMtOC1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtOC1kZXNrdG9we21hcmdpbi1sZWZ0OjY2LjY2NjY3JX0uY29sdW1uLmlzLTktZGVza3RvcHtmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LTktZGVza3RvcHttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy0xMC1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMTAtZGVza3RvcHttYXJnaW4tbGVmdDo4My4zMzMzMyV9LmNvbHVtbi5pcy0xMS1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDo5MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMTEtZGVza3RvcHttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbi5pcy0xMi1kZXNrdG9we2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtb2Zmc2V0LTEyLWRlc2t0b3B7bWFyZ2luLWxlZnQ6MTAwJX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuY29sdW1uLmlzLW5hcnJvdy13aWRlc2NyZWVue2ZsZXg6bm9uZX0uY29sdW1uLmlzLWZ1bGwtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MTAwJX0uY29sdW1uLmlzLXRocmVlLXF1YXJ0ZXJzLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjc1JX0uY29sdW1uLmlzLXR3by10aGlyZHMtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NjYuNjY2NiV9LmNvbHVtbi5pcy1oYWxmLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjUwJX0uY29sdW1uLmlzLW9uZS10aGlyZC13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDozMy4zMzMzJX0uY29sdW1uLmlzLW9uZS1xdWFydGVyLXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjI1JX0uY29sdW1uLmlzLW9mZnNldC10aHJlZS1xdWFydGVycy13aWRlc2NyZWVue21hcmdpbi1sZWZ0Ojc1JX0uY29sdW1uLmlzLW9mZnNldC10d28tdGhpcmRzLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NjYuNjY2NiV9LmNvbHVtbi5pcy1vZmZzZXQtaGFsZi13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjUwJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtdGhpcmQtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDozMy4zMzMzJX0uY29sdW1uLmlzLW9mZnNldC1vbmUtcXVhcnRlci13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjI1JX0uY29sdW1uLmlzLTEtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6OC4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMS13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjguMzMzMzMlfS5jb2x1bW4uaXMtMi13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMi13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjE2LjY2NjY3JX0uY29sdW1uLmlzLTMtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6MjUlfS5jb2x1bW4uaXMtb2Zmc2V0LTMtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDoyNSV9LmNvbHVtbi5pcy00LXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC00LXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6MzMuMzMzMzMlfS5jb2x1bW4uaXMtNS13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtNS13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjQxLjY2NjY3JX0uY29sdW1uLmlzLTYtd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NTAlfS5jb2x1bW4uaXMtb2Zmc2V0LTYtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo1MCV9LmNvbHVtbi5pcy03LXdpZGVzY3JlZW57ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0uY29sdW1uLmlzLW9mZnNldC03LXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6NTguMzMzMzMlfS5jb2x1bW4uaXMtOC13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtOC13aWRlc2NyZWVue21hcmdpbi1sZWZ0OjY2LjY2NjY3JX0uY29sdW1uLmlzLTktd2lkZXNjcmVlbntmbGV4Om5vbmU7d2lkdGg6NzUlfS5jb2x1bW4uaXMtb2Zmc2V0LTktd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo3NSV9LmNvbHVtbi5pcy0xMC13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LmNvbHVtbi5pcy1vZmZzZXQtMTAtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo4My4zMzMzMyV9LmNvbHVtbi5pcy0xMS13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDo5MS42NjY2NyV9LmNvbHVtbi5pcy1vZmZzZXQtMTEtd2lkZXNjcmVlbnttYXJnaW4tbGVmdDo5MS42NjY2NyV9LmNvbHVtbi5pcy0xMi13aWRlc2NyZWVue2ZsZXg6bm9uZTt3aWR0aDoxMDAlfS5jb2x1bW4uaXMtb2Zmc2V0LTEyLXdpZGVzY3JlZW57bWFyZ2luLWxlZnQ6MTAwJX19LmNvbHVtbnN7bWFyZ2luLWxlZnQ6LTAuNzVyZW07bWFyZ2luLXJpZ2h0Oi0wLjc1cmVtO21hcmdpbi10b3A6LTAuNzVyZW19LmNvbHVtbnM6bGFzdC1jaGlsZHttYXJnaW4tYm90dG9tOi0wLjc1cmVtfS5jb2x1bW5zOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLWJvdHRvbTowLjc1cmVtfS5jb2x1bW5zLmlzLWNlbnRlcmVke2p1c3RpZnktY29udGVudDpjZW50ZXJ9LmNvbHVtbnMuaXMtZ2FwbGVzc3ttYXJnaW4tbGVmdDowO21hcmdpbi1yaWdodDowO21hcmdpbi10b3A6MH0uY29sdW1ucy5pcy1nYXBsZXNzOmxhc3QtY2hpbGR7bWFyZ2luLWJvdHRvbTowfS5jb2x1bW5zLmlzLWdhcGxlc3M6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjEuNXJlbX0uY29sdW1ucy5pcy1nYXBsZXNzPi5jb2x1bW57bWFyZ2luOjA7cGFkZGluZzowfUBtZWRpYSBzY3JlZW4gYW5kIChtaW4td2lkdGg6IDc2OXB4KXsuY29sdW1ucy5pcy1ncmlke2ZsZXgtd3JhcDp3cmFwfS5jb2x1bW5zLmlzLWdyaWQ+LmNvbHVtbnttYXgtd2lkdGg6MzMuMzMzMyU7cGFkZGluZzowLjc1cmVtO3dpZHRoOjMzLjMzMzMlfS5jb2x1bW5zLmlzLWdyaWQ+LmNvbHVtbisuY29sdW1ue21hcmdpbi1sZWZ0OjB9fS5jb2x1bW5zLmlzLW1vYmlsZXtkaXNwbGF5OmZsZXh9LmNvbHVtbnMuaXMtbXVsdGlsaW5le2ZsZXgtd3JhcDp3cmFwfS5jb2x1bW5zLmlzLXZjZW50ZXJlZHthbGlnbi1pdGVtczpjZW50ZXJ9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5jb2x1bW5zOm5vdCguaXMtZGVza3RvcCl7ZGlzcGxheTpmbGV4fX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiAxMDAwcHgpey5jb2x1bW5zLmlzLWRlc2t0b3B7ZGlzcGxheTpmbGV4fX0udGlsZXthbGlnbi1pdGVtczpzdHJldGNoO2Rpc3BsYXk6YmxvY2s7ZmxleC1iYXNpczowO2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjE7bWluLWhlaWdodDptaW4tY29udGVudH0udGlsZS5pcy1hbmNlc3RvcnttYXJnaW4tbGVmdDotMC43NXJlbTttYXJnaW4tcmlnaHQ6LTAuNzVyZW07bWFyZ2luLXRvcDotMC43NXJlbX0udGlsZS5pcy1hbmNlc3RvcjpsYXN0LWNoaWxke21hcmdpbi1ib3R0b206LTAuNzVyZW19LnRpbGUuaXMtYW5jZXN0b3I6bm90KDpsYXN0LWNoaWxkKXttYXJnaW4tYm90dG9tOjAuNzVyZW19LnRpbGUuaXMtY2hpbGR7bWFyZ2luOjAgIWltcG9ydGFudH0udGlsZS5pcy1wYXJlbnR7cGFkZGluZzowLjc1cmVtfS50aWxlLmlzLXZlcnRpY2Fse2ZsZXgtZGlyZWN0aW9uOmNvbHVtbn0udGlsZS5pcy12ZXJ0aWNhbD4udGlsZS5pcy1jaGlsZDpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MS41cmVtICFpbXBvcnRhbnR9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey50aWxlOm5vdCguaXMtY2hpbGQpe2Rpc3BsYXk6ZmxleH0udGlsZS5pcy0xe2ZsZXg6bm9uZTt3aWR0aDo4LjMzMzMzJX0udGlsZS5pcy0ye2ZsZXg6bm9uZTt3aWR0aDoxNi42NjY2NyV9LnRpbGUuaXMtM3tmbGV4Om5vbmU7d2lkdGg6MjUlfS50aWxlLmlzLTR7ZmxleDpub25lO3dpZHRoOjMzLjMzMzMzJX0udGlsZS5pcy01e2ZsZXg6bm9uZTt3aWR0aDo0MS42NjY2NyV9LnRpbGUuaXMtNntmbGV4Om5vbmU7d2lkdGg6NTAlfS50aWxlLmlzLTd7ZmxleDpub25lO3dpZHRoOjU4LjMzMzMzJX0udGlsZS5pcy04e2ZsZXg6bm9uZTt3aWR0aDo2Ni42NjY2NyV9LnRpbGUuaXMtOXtmbGV4Om5vbmU7d2lkdGg6NzUlfS50aWxlLmlzLTEwe2ZsZXg6bm9uZTt3aWR0aDo4My4zMzMzMyV9LnRpbGUuaXMtMTF7ZmxleDpub25lO3dpZHRoOjkxLjY2NjY3JX0udGlsZS5pcy0xMntmbGV4Om5vbmU7d2lkdGg6MTAwJX19Lmhlcm8tdmlkZW97Ym90dG9tOjA7bGVmdDowO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjA7b3ZlcmZsb3c6aGlkZGVufS5oZXJvLXZpZGVvIHZpZGVve2xlZnQ6NTAlO21pbi1oZWlnaHQ6MTAwJTttaW4td2lkdGg6MTAwJTtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3RyYW5zZm9ybTp0cmFuc2xhdGUzZCgtNTAlLCAtNTAlLCAwKX0uaGVyby12aWRlby5pcy10cmFuc3BhcmVudHtvcGFjaXR5OjAuM31AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8tdmlkZW97ZGlzcGxheTpub25lfX0uaGVyby1idXR0b25ze21hcmdpbi10b3A6MS41cmVtfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby1idXR0b25zIC5idXR0b257ZGlzcGxheTpmbGV4fS5oZXJvLWJ1dHRvbnMgLmJ1dHRvbjpub3QoOmxhc3QtY2hpbGQpe21hcmdpbi1ib3R0b206MC43NXJlbX19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY5cHgpey5oZXJvLWJ1dHRvbnN7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpjZW50ZXJ9Lmhlcm8tYnV0dG9ucyAuYnV0dG9uOm5vdCg6bGFzdC1jaGlsZCl7bWFyZ2luLXJpZ2h0OjEuNXJlbX19Lmhlcm8taGVhZCwuaGVyby1mb290e2ZsZXgtZ3JvdzowO2ZsZXgtc2hyaW5rOjB9Lmhlcm8tYm9keXtmbGV4LWdyb3c6MTtmbGV4LXNocmluazowO3BhZGRpbmc6M3JlbSAxLjVyZW19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTE5MnB4KXsuaGVyby1ib2R5e3BhZGRpbmctbGVmdDowO3BhZGRpbmctcmlnaHQ6MH19Lmhlcm97YWxpZ24taXRlbXM6c3RyZXRjaDtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2Vlbn0uaGVybyAubmF2e2JhY2tncm91bmQ6bm9uZTtib3gtc2hhZG93OjAgMXB4IDAgcmdiYSgyMTksMjE5LDIxOSwwLjMpfS5oZXJvIC50YWJzIHVse2JvcmRlci1ib3R0b206bm9uZX0uaGVyby5pcy13aGl0ZXtiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSBhLC5oZXJvLmlzLXdoaXRlIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLXdoaXRlIC50aXRsZXtjb2xvcjojMGEwYTBhfS5oZXJvLmlzLXdoaXRlIC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDEwLDEwLDEwLDAuOSl9Lmhlcm8uaXMtd2hpdGUgLnN1YnRpdGxlIGEsLmhlcm8uaXMtd2hpdGUgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjojMGEwYTBhfS5oZXJvLmlzLXdoaXRlIC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMTAsMTAsMTAsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtd2hpdGUgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6I2ZmZn19Lmhlcm8uaXMtd2hpdGUgYS5uYXYtaXRlbSwuaGVyby5pcy13aGl0ZSAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbil7Y29sb3I6cmdiYSgxMCwxMCwxMCwwLjcpfS5oZXJvLmlzLXdoaXRlIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtd2hpdGUgYS5uYXYtaXRlbS5pcy1hY3RpdmUsLmhlcm8uaXMtd2hpdGUgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pOmhvdmVyLC5oZXJvLmlzLXdoaXRlIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAudGFicyBhe2NvbG9yOiMwYTBhMGE7b3BhY2l0eTowLjl9Lmhlcm8uaXMtd2hpdGUgLnRhYnMgYTpob3ZlcntvcGFjaXR5OjF9Lmhlcm8uaXMtd2hpdGUgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtd2hpdGUgLnRhYnMuaXMtdG9nZ2xlIGF7Y29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLXRvZ2dsZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLXdoaXRlIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy13aGl0ZSAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2JvcmRlci1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9Lmhlcm8uaXMtd2hpdGUuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICNlNmU2ZTYgMCUsICNmZmYgNzElLCAjZmZmIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy13aGl0ZSAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzBhMGEwYX0uaGVyby5pcy13aGl0ZSAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy13aGl0ZSAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGF9Lmhlcm8uaXMtd2hpdGUgLm5hdi1tZW51IC5uYXYtaXRlbXtib3JkZXItdG9wLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4yKX19Lmhlcm8uaXMtYmxhY2t7YmFja2dyb3VuZC1jb2xvcjojMGEwYTBhO2NvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgYSwuaGVyby5pcy1ibGFjayBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1ibGFjayAudGl0bGV7Y29sb3I6I2ZmZn0uaGVyby5pcy1ibGFjayAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLWJsYWNrIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLWJsYWNrIC5zdWJ0aXRsZSBzdHJvbmd7Y29sb3I6I2ZmZn0uaGVyby5pcy1ibGFjayAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWJsYWNrIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOiMwYTBhMGF9fS5oZXJvLmlzLWJsYWNrIGEubmF2LWl0ZW0sLmhlcm8uaXMtYmxhY2sgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC43KX0uaGVyby5pcy1ibGFjayBhLm5hdi1pdGVtOmhvdmVyLC5oZXJvLmlzLWJsYWNrIGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLWJsYWNrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1ibGFjayAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbikuaXMtYWN0aXZle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLnRhYnMgYXtjb2xvcjojZmZmO29wYWNpdHk6MC45fS5oZXJvLmlzLWJsYWNrIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLWJsYWNrIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy1ibGFjayAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLWJsYWNrIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtYm94ZWQgYTpob3ZlciwuaGVyby5pcy1ibGFjayAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1ibGFjayAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1ibGFjayAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYTpob3ZlciwuaGVyby5pcy1ibGFjayAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtYmxhY2sgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMGEwYTBhfS5oZXJvLmlzLWJsYWNrLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjMDAwIDAlLCAjMGEwYTBhIDcxJSwgIzE4MTYxNiAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtYmxhY2sgLm5hdi10b2dnbGUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtYmxhY2sgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtYmxhY2sgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWJsYWNrIC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuMil9fS5oZXJvLmlzLWxpZ2h0e2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IGEsLmhlcm8uaXMtbGlnaHQgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtbGlnaHQgLnRpdGxle2NvbG9yOiMzNjM2MzZ9Lmhlcm8uaXMtbGlnaHQgLnN1YnRpdGxle2NvbG9yOnJnYmEoNTQsNTQsNTQsMC45KX0uaGVyby5pcy1saWdodCAuc3VidGl0bGUgYSwuaGVyby5pcy1saWdodCAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiMzNjM2MzZ9Lmhlcm8uaXMtbGlnaHQgLm5hdntib3gtc2hhZG93OjAgMXB4IDAgcmdiYSg1NCw1NCw1NCwwLjIpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1saWdodCAubmF2LW1lbnV7YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fX0uaGVyby5pcy1saWdodCBhLm5hdi1pdGVtLC5oZXJvLmlzLWxpZ2h0IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDU0LDU0LDU0LDAuNyl9Lmhlcm8uaXMtbGlnaHQgYS5uYXYtaXRlbTpob3ZlciwuaGVyby5pcy1saWdodCBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1saWdodCAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtbGlnaHQgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pLmlzLWFjdGl2ZXtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC50YWJzIGF7Y29sb3I6IzM2MzYzNjtvcGFjaXR5OjAuOX0uaGVyby5pcy1saWdodCAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1saWdodCAudGFicyBsaS5pcy1hY3RpdmUgYXtvcGFjaXR5OjF9Lmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1saWdodCAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLWJveGVkIGE6aG92ZXIsLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGE6aG92ZXIsLmhlcm8uaXMtbGlnaHQgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWxpZ2h0IC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiMzNjM2MzY7Ym9yZGVyLWNvbG9yOiMzNjM2MzY7Y29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1saWdodC5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgI2RmZDhkOCAwJSwgI2Y1ZjVmNSA3MSUsICNmZmYgMTAwJSl9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWxpZ2h0IC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojMzYzNjM2fS5oZXJvLmlzLWxpZ2h0IC5uYXYtdG9nZ2xlOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgxMCwxMCwxMCwwLjEpfS5oZXJvLmlzLWxpZ2h0IC5uYXYtdG9nZ2xlLmlzLWFjdGl2ZSBzcGFue2JhY2tncm91bmQtY29sb3I6IzM2MzYzNn0uaGVyby5pcy1saWdodCAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSg1NCw1NCw1NCwwLjIpfX0uaGVyby5pcy1kYXJre2JhY2tncm91bmQtY29sb3I6IzM2MzYzNjtjb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgYSwuaGVyby5pcy1kYXJrIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLWRhcmsgLnRpdGxle2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNDUsMjQ1LDI0NSwwLjkpfS5oZXJvLmlzLWRhcmsgLnN1YnRpdGxlIGEsLmhlcm8uaXMtZGFyayAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI0NSwyNDUsMjQ1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWRhcmsgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6IzM2MzYzNn19Lmhlcm8uaXMtZGFyayBhLm5hdi1pdGVtLC5oZXJvLmlzLWRhcmsgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjQ1LDI0NSwyNDUsMC43KX0uaGVyby5pcy1kYXJrIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtZGFyayBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1kYXJrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1kYXJrIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2Y1ZjVmNX0uaGVyby5pcy1kYXJrIC50YWJzIGF7Y29sb3I6I2Y1ZjVmNTtvcGFjaXR5OjAuOX0uaGVyby5pcy1kYXJrIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLWRhcmsgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1kYXJrIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtZGFyayAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1kYXJrIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWRhcmsgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2Y1ZjVmNTtib3JkZXItY29sb3I6I2Y1ZjVmNTtjb2xvcjojMzYzNjM2fS5oZXJvLmlzLWRhcmsuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICMxZjE5MTkgMCUsICMzNjM2MzYgNzElLCAjNDYzZjNmIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1kYXJrIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZjVmNWY1fS5oZXJvLmlzLWRhcmsgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtZGFyayAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjV9Lmhlcm8uaXMtZGFyayAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNDUsMjQ1LDI0NSwwLjIpfX0uaGVyby5pcy1wcmltYXJ5e2JhY2tncm91bmQtY29sb3I6IzE4MmI3Mztjb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgYSwuaGVyby5pcy1wcmltYXJ5IHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLXByaW1hcnkgLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLXByaW1hcnkgLnN1YnRpdGxlIGEsLmhlcm8uaXMtcHJpbWFyeSAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXByaW1hcnkgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6IzE4MmI3M319Lmhlcm8uaXMtcHJpbWFyeSBhLm5hdi1pdGVtLC5oZXJvLmlzLXByaW1hcnkgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC43KX0uaGVyby5pcy1wcmltYXJ5IGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtcHJpbWFyeSBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1wcmltYXJ5IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1wcmltYXJ5IC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0uaGVyby5pcy1wcmltYXJ5IC50YWJzIGF7Y29sb3I6I2ZmZjtvcGFjaXR5OjAuOX0uaGVyby5pcy1wcmltYXJ5IC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLXByaW1hcnkgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtcHJpbWFyeSAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1wcmltYXJ5IC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXByaW1hcnkgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMTgyYjczfS5oZXJvLmlzLXByaW1hcnkuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICMwYjI0NGQgMCUsICMxODJiNzMgNzElLCAjMTgxZDhjIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1wcmltYXJ5IC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLXByaW1hcnkgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtcHJpbWFyeSAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtcHJpbWFyeSAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX0uaGVyby5pcy1pbmZve2JhY2tncm91bmQtY29sb3I6IzMyNzNkYztjb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gYSwuaGVyby5pcy1pbmZvIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLWluZm8gLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLWluZm8gLnN1YnRpdGxlIGEsLmhlcm8uaXMtaW5mbyAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLWluZm8gLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6IzMyNzNkY319Lmhlcm8uaXMtaW5mbyBhLm5hdi1pdGVtLC5oZXJvLmlzLWluZm8gLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC43KX0uaGVyby5pcy1pbmZvIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtaW5mbyBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1pbmZvIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1pbmZvIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0uaGVyby5pcy1pbmZvIC50YWJzIGF7Y29sb3I6I2ZmZjtvcGFjaXR5OjAuOX0uaGVyby5pcy1pbmZvIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLWluZm8gLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLWluZm8gLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1pbmZvIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtaW5mbyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1pbmZvIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLWluZm8gLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMzI3M2RjfS5oZXJvLmlzLWluZm8uaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICMxNTc3YzYgMCUsICMzMjczZGMgNzElLCAjNDM2NmU1IDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1pbmZvIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWluZm8gLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtaW5mbyAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtaW5mbyAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX0uaGVyby5pcy1zdWNjZXNze2JhY2tncm91bmQtY29sb3I6IzIzZDE2MDtjb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgYSwuaGVyby5pcy1zdWNjZXNzIHN0cm9uZ3tjb2xvcjppbmhlcml0fS5oZXJvLmlzLXN1Y2Nlc3MgLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAuc3VidGl0bGV7Y29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjkpfS5oZXJvLmlzLXN1Y2Nlc3MgLnN1YnRpdGxlIGEsLmhlcm8uaXMtc3VjY2VzcyAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDI1NSwyNTUsMjU1LDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6IzIzZDE2MH19Lmhlcm8uaXMtc3VjY2VzcyBhLm5hdi1pdGVtLC5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMjU1LDI1NSwyNTUsMC43KX0uaGVyby5pcy1zdWNjZXNzIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtc3VjY2VzcyBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy1zdWNjZXNzIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy1zdWNjZXNzIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0uaGVyby5pcy1zdWNjZXNzIC50YWJzIGF7Y29sb3I6I2ZmZjtvcGFjaXR5OjAuOX0uaGVyby5pcy1zdWNjZXNzIC50YWJzIGE6aG92ZXJ7b3BhY2l0eToxfS5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtYm94ZWQgYSwuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLXRvZ2dsZSBhe2NvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtc3VjY2VzcyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy1zdWNjZXNzIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXN1Y2Nlc3MgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6I2ZmZjtib3JkZXItY29sb3I6I2ZmZjtjb2xvcjojMjNkMTYwfS5oZXJvLmlzLXN1Y2Nlc3MuaXMtYm9sZHtiYWNrZ3JvdW5kLWltYWdlOmxpbmVhci1ncmFkaWVudCgxNDFkZWcsICMxMmFmMmYgMCUsICMyM2QxNjAgNzElLCAjMmNlMjhhIDEwMCUpfUBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2OHB4KXsuaGVyby5pcy1zdWNjZXNzIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLXN1Y2Nlc3MgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtc3VjY2VzcyAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOiNmZmZ9Lmhlcm8uaXMtc3VjY2VzcyAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX0uaGVyby5pcy13YXJuaW5ne2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1Nztjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyBhLC5oZXJvLmlzLXdhcm5pbmcgc3Ryb25ne2NvbG9yOmluaGVyaXR9Lmhlcm8uaXMtd2FybmluZyAudGl0bGV7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLnN1YnRpdGxle2NvbG9yOnJnYmEoMCwwLDAsMC45KX0uaGVyby5pcy13YXJuaW5nIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLXdhcm5pbmcgLnN1YnRpdGxlIHN0cm9uZ3tjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyAubmF2e2JveC1zaGFkb3c6MCAxcHggMCByZ2JhKDAsMCwwLDAuMil9QG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNzY4cHgpey5oZXJvLmlzLXdhcm5pbmcgLm5hdi1tZW51e2JhY2tncm91bmQtY29sb3I6I2ZmZGQ1N319Lmhlcm8uaXMtd2FybmluZyBhLm5hdi1pdGVtLC5oZXJvLmlzLXdhcm5pbmcgLm5hdi1pdGVtIGE6bm90KC5idXR0b24pe2NvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtd2FybmluZyBhLm5hdi1pdGVtLmlzLWFjdGl2ZSwuaGVyby5pcy13YXJuaW5nIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKTpob3ZlciwuaGVyby5pcy13YXJuaW5nIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLnRhYnMgYXtjb2xvcjpyZ2JhKDAsMCwwLDAuNyk7b3BhY2l0eTowLjl9Lmhlcm8uaXMtd2FybmluZyAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy13YXJuaW5nIC50YWJzIGxpLmlzLWFjdGl2ZSBhe29wYWNpdHk6MX0uaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLWJveGVkIGEsLmhlcm8uaXMtd2FybmluZyAudGFicy5pcy10b2dnbGUgYXtjb2xvcjpyZ2JhKDAsMCwwLDAuNyl9Lmhlcm8uaXMtd2FybmluZyAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGE6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtd2FybmluZyAudGFicy5pcy1ib3hlZCBsaS5pcy1hY3RpdmUgYSwuaGVyby5pcy13YXJuaW5nIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhLC5oZXJvLmlzLXdhcm5pbmcgLnRhYnMuaXMtdG9nZ2xlIGxpLmlzLWFjdGl2ZSBhOmhvdmVye2JhY2tncm91bmQtY29sb3I6cmdiYSgwLDAsMCwwLjcpO2JvcmRlci1jb2xvcjpyZ2JhKDAsMCwwLDAuNyk7Y29sb3I6I2ZmZGQ1N30uaGVyby5pcy13YXJuaW5nLmlzLWJvbGR7YmFja2dyb3VuZC1pbWFnZTpsaW5lYXItZ3JhZGllbnQoMTQxZGVnLCAjZmZhZjI0IDAlLCAjZmZkZDU3IDcxJSwgI2ZmZmE3MCAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtd2FybmluZyAubmF2LXRvZ2dsZSBzcGFue2JhY2tncm91bmQtY29sb3I6cmdiYSgwLDAsMCwwLjcpfS5oZXJvLmlzLXdhcm5pbmcgLm5hdi10b2dnbGU6aG92ZXJ7YmFja2dyb3VuZC1jb2xvcjpyZ2JhKDEwLDEwLDEwLDAuMSl9Lmhlcm8uaXMtd2FybmluZyAubmF2LXRvZ2dsZS5pcy1hY3RpdmUgc3BhbntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMCwwLDAsMC43KX0uaGVyby5pcy13YXJuaW5nIC5uYXYtbWVudSAubmF2LWl0ZW17Ym9yZGVyLXRvcC1jb2xvcjpyZ2JhKDAsMCwwLDAuMil9fS5oZXJvLmlzLWRhbmdlcntiYWNrZ3JvdW5kLWNvbG9yOnJlZDtjb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciBhLC5oZXJvLmlzLWRhbmdlciBzdHJvbmd7Y29sb3I6aW5oZXJpdH0uaGVyby5pcy1kYW5nZXIgLnRpdGxle2NvbG9yOiNmZmZ9Lmhlcm8uaXMtZGFuZ2VyIC5zdWJ0aXRsZXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuOSl9Lmhlcm8uaXMtZGFuZ2VyIC5zdWJ0aXRsZSBhLC5oZXJvLmlzLWRhbmdlciAuc3VidGl0bGUgc3Ryb25ne2NvbG9yOiNmZmZ9Lmhlcm8uaXMtZGFuZ2VyIC5uYXZ7Ym94LXNoYWRvdzowIDFweCAwIHJnYmEoMjU1LDI1NSwyNTUsMC4yKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtZGFuZ2VyIC5uYXYtbWVudXtiYWNrZ3JvdW5kLWNvbG9yOnJlZH19Lmhlcm8uaXMtZGFuZ2VyIGEubmF2LWl0ZW0sLmhlcm8uaXMtZGFuZ2VyIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKXtjb2xvcjpyZ2JhKDI1NSwyNTUsMjU1LDAuNyl9Lmhlcm8uaXMtZGFuZ2VyIGEubmF2LWl0ZW06aG92ZXIsLmhlcm8uaXMtZGFuZ2VyIGEubmF2LWl0ZW0uaXMtYWN0aXZlLC5oZXJvLmlzLWRhbmdlciAubmF2LWl0ZW0gYTpub3QoLmJ1dHRvbik6aG92ZXIsLmhlcm8uaXMtZGFuZ2VyIC5uYXYtaXRlbSBhOm5vdCguYnV0dG9uKS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0uaGVyby5pcy1kYW5nZXIgLnRhYnMgYXtjb2xvcjojZmZmO29wYWNpdHk6MC45fS5oZXJvLmlzLWRhbmdlciAudGFicyBhOmhvdmVye29wYWNpdHk6MX0uaGVyby5pcy1kYW5nZXIgLnRhYnMgbGkuaXMtYWN0aXZlIGF7b3BhY2l0eToxfS5oZXJvLmlzLWRhbmdlciAudGFicy5pcy1ib3hlZCBhLC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy10b2dnbGUgYXtjb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAudGFicy5pcy1ib3hlZCBhOmhvdmVyLC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy10b2dnbGUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1kYW5nZXIgLnRhYnMuaXMtYm94ZWQgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLWJveGVkIGxpLmlzLWFjdGl2ZSBhOmhvdmVyLC5oZXJvLmlzLWRhbmdlciAudGFicy5pcy10b2dnbGUgbGkuaXMtYWN0aXZlIGEsLmhlcm8uaXMtZGFuZ2VyIC50YWJzLmlzLXRvZ2dsZSBsaS5pcy1hY3RpdmUgYTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOiNmZmY7Ym9yZGVyLWNvbG9yOiNmZmY7Y29sb3I6cmVkfS5oZXJvLmlzLWRhbmdlci5pcy1ib2xke2JhY2tncm91bmQtaW1hZ2U6bGluZWFyLWdyYWRpZW50KDE0MWRlZywgI2MwMiAwJSwgcmVkIDcxJSwgI2ZmNDAxYSAxMDAlKX1AbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA3NjhweCl7Lmhlcm8uaXMtZGFuZ2VyIC5uYXYtdG9nZ2xlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAubmF2LXRvZ2dsZTpob3ZlcntiYWNrZ3JvdW5kLWNvbG9yOnJnYmEoMTAsMTAsMTAsMC4xKX0uaGVyby5pcy1kYW5nZXIgLm5hdi10b2dnbGUuaXMtYWN0aXZlIHNwYW57YmFja2dyb3VuZC1jb2xvcjojZmZmfS5oZXJvLmlzLWRhbmdlciAubmF2LW1lbnUgLm5hdi1pdGVte2JvcmRlci10b3AtY29sb3I6cmdiYSgyNTUsMjU1LDI1NSwwLjIpfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7Lmhlcm8uaXMtbWVkaXVtIC5oZXJvLWJvZHl7cGFkZGluZy1ib3R0b206OXJlbTtwYWRkaW5nLXRvcDo5cmVtfX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjlweCl7Lmhlcm8uaXMtbGFyZ2UgLmhlcm8tYm9keXtwYWRkaW5nLWJvdHRvbToxOHJlbTtwYWRkaW5nLXRvcDoxOHJlbX19Lmhlcm8uaXMtZnVsbGhlaWdodHttaW4taGVpZ2h0OjEwMHZofS5oZXJvLmlzLWZ1bGxoZWlnaHQgLmhlcm8tYm9keXthbGlnbi1pdGVtczpjZW50ZXI7ZGlzcGxheTpmbGV4fS5oZXJvLmlzLWZ1bGxoZWlnaHQgLmhlcm8tYm9keT4uY29udGFpbmVye2ZsZXgtZ3JvdzoxO2ZsZXgtc2hyaW5rOjF9LnNlY3Rpb257YmFja2dyb3VuZC1jb2xvcjojZmZmO3BhZGRpbmc6M3JlbSAxLjVyZW19QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTAwMHB4KXsuc2VjdGlvbi5pcy1tZWRpdW17cGFkZGluZzo5cmVtIDEuNXJlbX0uc2VjdGlvbi5pcy1sYXJnZXtwYWRkaW5nOjE4cmVtIDEuNXJlbX19LmZvb3RlcntiYWNrZ3JvdW5kLWNvbG9yOiNmNWY1ZjU7cGFkZGluZzozcmVtIDEuNXJlbSA2cmVtfS5oZWFkZXIuaXMtZml4ZWQtdG9we3otaW5kZXg6MTAzMDtwb3NpdGlvbjpmaXhlZDt0b3A6MDtsZWZ0OjA7cmlnaHQ6MH0uaGFzLWZpeGVkLW5hdnttYXJnaW4tdG9wOjUwcHh9LnNlY3Rpb24uaXMtc21hbGx7cGFkZGluZzoxcmVtIDEuNXJlbX0ubmF2LWludmVyc2V7YmFja2dyb3VuZDojMTgyYjczfS5uYXYtaW52ZXJzZSBhLm5hdi1pdGVte2NvbG9yOiNmMmYyZjJ9Lm5hdi1pbnZlcnNlIGEubmF2LWl0ZW06aG92ZXJ7Y29sb3I6I2QxZDVlM30ubmF2LWludmVyc2UgYS5uYXYtaXRlbS5pcy1hY3RpdmV7Y29sb3I6I2ZmZn0ubmF2LWludmVyc2UgYS5uYXYtaXRlbS5pcy10YWI6aG92ZXJ7Ym9yZGVyLWJvdHRvbS1jb2xvcjojZmZmfS5uYXYtaW52ZXJzZSBhLm5hdi1pdGVtLmlzLXRhYi5pcy1hY3RpdmV7Ym9yZGVyLWJvdHRvbTozcHggc29saWQgI2ZmZjtjb2xvcjojZmZmfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlcntwb3NpdGlvbjpmaXhlZDt0b3A6MDtib3R0b206MDt6LWluZGV4OjEwNDA7b3ZlcmZsb3cteTphdXRvO3RleHQtYWxpZ246Y2VudGVyO2JhY2tncm91bmQ6IzE4MmI3Mztjb2xvcjojZmZmO2xlZnQ6LTI1MHB4O3dpZHRoOjI1MHB4O3RyYW5zaXRpb246bGVmdCAwLjVzfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlci5pcy1hY3RpdmV7bGVmdDowfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlciAubmF2LWl0ZW17Y3Vyc29yOnBvaW50ZXI7ZGlzcGxheTpibG9jaztwYWRkaW5nLXRvcDoxMHB4O3BhZGRpbmctYm90dG9tOjlweDtiYWNrZ3JvdW5kOnJnYmEoMjU1LDI1NSwyNTUsMC4xKX0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgLm5hdi1pdGVtLmlzLWFjdGl2ZXtiYWNrZ3JvdW5kOmxpbmVhci1ncmFkaWVudCh0byByaWdodCwgcmdiYSgyNTUsMjU1LDI1NSwwLjQpLCByZ2JhKDI1NSwyNTUsMjU1LDAuMSkgNSUpfS5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlciAubmF2LWl0ZW1bb3Blbl0+c3VtbWFyeXttYXJnaW4tYm90dG9tOjlweH0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgLm5hdi1pdGVtOm5vdCg6bGFzdC1jaGlsZCl7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgI2ZmZn0ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgfiAub3ZlcmxheXtwb3NpdGlvbjpmaXhlZDt0b3A6MDtsZWZ0OjA7cmlnaHQ6MDtib3R0b206MDtiYWNrZ3JvdW5kOnJnYmEoMCwwLDAsMC41KTt2aXNpYmlsaXR5OmhpZGRlbjtvcGFjaXR5OjA7ei1pbmRleDoxMDM1O3RyYW5zaXRpb246b3BhY2l0eSAwLjc1c30ubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIuaXMtYWN0aXZlIH4gLm92ZXJsYXl7dmlzaWJpbGl0eTp2aXNpYmxlO29wYWNpdHk6MX0jY29udGFpbmVyPmRpdjpub3QoLnZpc2libGUpe2Rpc3BsYXk6bm9uZX1cXG5cIiArXHJcbiAgICAnPC9zdHlsZT4nO1xyXG5cclxuLy8gU2hvdyB0aGUgbWVudSB3aGVuIGNsaWNraW5nIG9uIHRoZSBtZW51IGJ1dHRvblxyXG5BcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5uYXYtc2xpZGVyLXRvZ2dsZScpKVxyXG4gICAgLmZvckVhY2goZWwgPT4gZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0b2dnbGVNZW51KSk7XHJcblxyXG4vLyBIaWRlIHRoZSBtZW51IHdoZW4gY2xpY2tpbmcgdGhlIG92ZXJsYXlcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm5hdi1zbGlkZXItY29udGFpbmVyIC5vdmVybGF5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0b2dnbGVNZW51KTtcclxuXHJcbi8vIENoYW5nZSB0YWJzXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uYXYtc2xpZGVyLWNvbnRhaW5lciAubmF2LXNsaWRlcicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gZ2xvYmFsVGFiQ2hhbmdlKGV2ZW50KSB7XHJcbiAgICB2YXIgdGFiTmFtZSA9IGV2ZW50LnRhcmdldC5kYXRhc2V0LnRhYk5hbWU7XHJcbiAgICB2YXIgdGFiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2NvbnRhaW5lciA+IFtkYXRhLXRhYi1uYW1lPSR7dGFiTmFtZX1dYCk7XHJcbiAgICBpZighdGFiTmFtZSB8fCAhdGFiKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQ29udGVudFxyXG4gICAgLy9XZSBjYW4ndCBqdXN0IHJlbW92ZSB0aGUgZmlyc3QgZHVlIHRvIGJyb3dzZXIgbGFnXHJcbiAgICBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNjb250YWluZXIgPiAudmlzaWJsZScpKVxyXG4gICAgICAgIC5mb3JFYWNoKGVsID0+IGVsLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2libGUnKSk7XHJcbiAgICB0YWIuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xyXG5cclxuICAgIC8vVGFic1xyXG4gICAgQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXIgLmlzLWFjdGl2ZScpKVxyXG4gICAgICAgIC5mb3JFYWNoKGVsID0+IGVsLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLWFjdGl2ZScpKTtcclxuICAgIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuYWRkKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICBob29rLmZpcmUoJ3VpLnRhYlNob3duJywgdGFiKTtcclxufSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0b2dnbGVNZW51LFxyXG4gICAgYWRkVGFiLFxyXG4gICAgcmVtb3ZlVGFiLFxyXG4gICAgYWRkVGFiR3JvdXAsXHJcbiAgICByZW1vdmVUYWJHcm91cCxcclxufTtcclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzaG93L2hpZGUgdGhlIG1lbnUuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHRvZ2dsZU1lbnUoKTtcclxuICovXHJcbmZ1bmN0aW9uIHRvZ2dsZU1lbnUoKSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubmF2LXNsaWRlci1jb250YWluZXIgLm5hdi1zbGlkZXInKS5jbGFzc0xpc3QudG9nZ2xlKCdpcy1hY3RpdmUnKTtcclxufVxyXG5cclxudmFyIHRhYlVJRCA9IDA7XHJcbi8qKlxyXG4gKiBVc2VkIHRvIGFkZCBhIHRhYiB0byB0aGUgYm90J3MgbmF2aWdhdGlvbi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHRhYiA9IHVpLmFkZFRhYignVGV4dCcpO1xyXG4gKiB2YXIgdGFiMiA9IHVpLmFkZFRhYignQ3VzdG9tIE1lc3NhZ2VzJywgJ21lc3NhZ2VzJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWJUZXh0XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZ3JvdXBOYW1lPW1haW5dIE9wdGlvbmFsLiBJZiBwcm92aWRlZCwgdGhlIG5hbWUgb2YgdGhlIGdyb3VwIG9mIHRhYnMgdG8gYWRkIHRoaXMgdGFiIHRvLlxyXG4gKiBAcmV0dXJuIHtOb2RlfSAtIFRoZSBkaXYgdG8gcGxhY2UgdGFiIGNvbnRlbnQgaW4uXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRUYWIodGFiVGV4dCwgZ3JvdXBOYW1lID0gJ21haW4nKSB7XHJcbiAgICB2YXIgdGFiTmFtZSA9ICdib3RUYWJfJyArIHRhYlVJRCsrO1xyXG5cclxuICAgIHZhciB0YWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICB0YWIudGV4dENvbnRlbnQgPSB0YWJUZXh0O1xyXG4gICAgdGFiLmNsYXNzTGlzdC5hZGQoJ25hdi1pdGVtJyk7XHJcbiAgICB0YWIuZGF0YXNldC50YWJOYW1lID0gdGFiTmFtZTtcclxuXHJcbiAgICB2YXIgdGFiQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGFiQ29udGVudC5kYXRhc2V0LnRhYk5hbWUgPSB0YWJOYW1lO1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5uYXYtc2xpZGVyLWNvbnRhaW5lciBbZGF0YS10YWItZ3JvdXA9JHtncm91cE5hbWV9XWApLmFwcGVuZENoaWxkKHRhYik7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY29udGFpbmVyJykuYXBwZW5kQ2hpbGQodGFiQ29udGVudCk7XHJcblxyXG4gICAgcmV0dXJuIHRhYkNvbnRlbnQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhIGdsb2JhbCB0YWIuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB0YWIgPSB1aS5hZGRUYWIoJ1RhYicpO1xyXG4gKiB1aS5yZW1vdmVUYWIodGFiKTtcclxuICogQHBhcmFtIHtOb2RlfSB0YWJDb250ZW50IFRoZSBkaXYgcmV0dXJuZWQgYnkgdGhlIGFkZFRhYiBmdW5jdGlvbi5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZVRhYih0YWJDb250ZW50KSB7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAubmF2LXNsaWRlci1jb250YWluZXIgW2RhdGEtdGFiLW5hbWU9JHt0YWJDb250ZW50LmRhdGFzZXQudGFiTmFtZX1dYCkucmVtb3ZlKCk7XHJcbiAgICB0YWJDb250ZW50LnJlbW92ZSgpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSB0YWIgZ3JvdXAgaW4gd2hpY2ggdGFicyBjYW4gYmUgcGxhY2VkLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1aS5hZGRUYWJHcm91cCgnR3JvdXAgVGV4dCcsICdzb21lX2dyb3VwJyk7XHJcbiAqIHVpLmFkZFRhYignV2l0aGluIGdyb3VwJywgJ3NvbWVfZ3JvdXAnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBUaGUgdGV4dCB0aGUgdXNlciB3aWxsIHNlZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZ3JvdXBOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGdyb3VwIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGFkZCB0YWJzIHdpdGhpbiB0aGUgZ3JvdXAuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGFyZW50ID0gbWFpbl0gLSBUaGUgbmFtZSBvZiB0aGUgcGFyZW50IGdyb3VwLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkVGFiR3JvdXAodGV4dCwgZ3JvdXBOYW1lLCBwYXJlbnQgPSAnbWFpbicpIHtcclxuICAgIHZhciBkZXRhaWxzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGV0YWlscycpO1xyXG4gICAgZGV0YWlscy5jbGFzc0xpc3QuYWRkKCduYXYtaXRlbScpO1xyXG4gICAgZGV0YWlscy5kYXRhc2V0LnRhYkdyb3VwID0gZ3JvdXBOYW1lO1xyXG5cclxuICAgIHZhciBzdW1tYXJ5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3VtbWFyeScpO1xyXG4gICAgc3VtbWFyeS50ZXh0Q29udGVudCA9IHRleHQ7XHJcbiAgICBkZXRhaWxzLmFwcGVuZENoaWxkKHN1bW1hcnkpO1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5uYXYtc2xpZGVyLWNvbnRhaW5lciBbZGF0YS10YWItZ3JvdXA9XCIke3BhcmVudH1cIl1gKS5hcHBlbmRDaGlsZChkZXRhaWxzKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgdGFiIGdyb3VwIGFuZCBhbGwgdGFicyBjb250YWluZWQgd2l0aGluIHRoZSBzcGVjaWZpZWQgZ3JvdXAuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGFkZFRhYkdyb3VwKCdHcm91cCcsICdncm91cDEnKTtcclxuICogdmFyIGlubmVyID0gYWRkVGFiKCdJbm5lcicsICdncm91cDEnKTtcclxuICogcmVtb3ZlVGFiR3JvdXAoJ2dyb3VwMScpOyAvLyBpbm5lciBoYXMgYmVlbiByZW1vdmVkLlxyXG4gKiBAcGFyYW0gc3RyaW5nIGdyb3VwTmFtZSB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAgdGhhdCB3YXMgdXNlZCBpbiB1aS5hZGRUYWJHcm91cC5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZVRhYkdyb3VwKGdyb3VwTmFtZSkge1xyXG4gICAgdmFyIGdyb3VwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLm5hdi1zbGlkZXItY29udGFpbmVyIFtkYXRhLXRhYi1ncm91cD1cIiR7Z3JvdXBOYW1lfVwiXWApO1xyXG4gICAgdmFyIGl0ZW1zID0gQXJyYXkuZnJvbShncm91cC5xdWVyeVNlbGVjdG9yQWxsKCdzcGFuJykpO1xyXG5cclxuICAgIGl0ZW1zLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgLy9UYWIgY29udGVudFxyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNjb250YWluZXIgPiBbZGF0YS10YWItbmFtZT1cIiR7aXRlbS5kYXRhc2V0LnRhYk5hbWV9XCJdYCkucmVtb3ZlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBncm91cC5yZW1vdmUoKTtcclxufVxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGFsZXJ0XHJcbn07XHJcblxyXG4vKipcclxuKiBGdW5jdGlvbiB1c2VkIHRvIHJlcXVpcmUgYWN0aW9uIGZyb20gdGhlIHVzZXIuXHJcbipcclxuKiBAcGFyYW0ge3N0cmluZ30gdGV4dCB0aGUgdGV4dCB0byBkaXNwbGF5IGluIHRoZSBhbGVydFxyXG4qIEBwYXJhbSB7QXJyYXl9IGJ1dHRvbnMgYW4gYXJyYXkgb2YgYnV0dG9ucyB0byBhZGQgdG8gdGhlIGFsZXJ0LlxyXG4qICAgICAgICBGb3JtYXQ6IFt7dGV4dDogJ1Rlc3QnLCBzdHlsZTonc3VjY2VzcycsIGFjdGlvbjogZnVuY3Rpb24oKXt9LCB0aGlzQXJnOiB3aW5kb3csIGRpc21pc3M6IGZhbHNlfV1cclxuKiAgICAgICAgTm90ZTogdGV4dCBpcyB0aGUgb25seSByZXF1aXJlZCBwYXJhbWF0ZXIuIElmIG5vIGJ1dHRvbiBhcnJheSBpcyBzcGVjaWZpZWRcclxuKiAgICAgICAgdGhlbiBhIHNpbmdsZSBPSyBidXR0b24gd2lsbCBiZSBzaG93bi5cclxuKiAgICAgICAgIFByb3ZpZGVkIHN0eWxlczogc3VjY2VzcywgZGFuZ2VyLCB3YXJuaW5nLCBpbmZvXHJcbiogICAgICAgIERlZmF1bHRzOiBzdHlsZTogJycsIGFjdGlvbjogdW5kZWZpbmVkLCB0aGlzQXJnOiB1bmRlZmluZWQsIGRpc21pc3M6IHRydWVcclxuKi9cclxuZnVuY3Rpb24gYWxlcnQodGV4dCwgYnV0dG9ucyA9IFt7dGV4dDogJ09LJ31dKSB7XHJcbiAgICBpZiAoaW5zdGFuY2UuYWN0aXZlKSB7XHJcbiAgICAgICAgaW5zdGFuY2UucXVldWUucHVzaCh7dGV4dCwgYnV0dG9uc30pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGluc3RhbmNlLmFjdGl2ZSA9IHRydWU7XHJcblxyXG4gICAgYnV0dG9ucy5mb3JFYWNoKGZ1bmN0aW9uKGJ1dHRvbiwgaSkge1xyXG4gICAgICAgIGJ1dHRvbi5kaXNtaXNzID0gKGJ1dHRvbi5kaXNtaXNzID09PSBmYWxzZSkgPyBmYWxzZSA6IHRydWU7XHJcbiAgICAgICAgaW5zdGFuY2UuYnV0dG9uc1snYnV0dG9uXycgKyBpXSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiBidXR0b24uYWN0aW9uLFxyXG4gICAgICAgICAgICB0aGlzQXJnOiBidXR0b24udGhpc0FyZyB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIGRpc21pc3M6IHR5cGVvZiBidXR0b24uZGlzbWlzcyA9PSAnYm9vbGVhbicgPyBidXR0b24uZGlzbWlzcyA6IHRydWUsXHJcbiAgICAgICAgfTtcclxuICAgICAgICBidXR0b24uaWQgPSAnYnV0dG9uXycgKyBpO1xyXG4gICAgICAgIGJ1aWxkQnV0dG9uKGJ1dHRvbik7XHJcbiAgICB9KTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydENvbnRlbnQnKS5pbm5lckhUTUwgPSB0ZXh0O1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCB+IC5vdmVybGF5JykuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0JykuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xyXG59XHJcblxyXG4vKipcclxuICogSG9sZHMgdGhlIGN1cnJlbnQgYWxlcnQgYW5kIHF1ZXVlIG9mIGZ1cnRoZXIgYWxlcnRzLlxyXG4gKi9cclxudmFyIGluc3RhbmNlID0ge1xyXG4gICAgYWN0aXZlOiBmYWxzZSxcclxuICAgIHF1ZXVlOiBbXSxcclxuICAgIGJ1dHRvbnM6IHt9LFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gYWRkIGJ1dHRvbiBlbGVtZW50cyB0byBhbiBhbGVydC5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IGJ1dHRvblxyXG4gKi9cclxuZnVuY3Rpb24gYnVpbGRCdXR0b24oYnV0dG9uKSB7XHJcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICBlbC5pbm5lckhUTUwgPSBidXR0b24udGV4dDtcclxuICAgIGlmIChidXR0b24uc3R5bGUpIHtcclxuICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKGJ1dHRvbi5zdHlsZSk7XHJcbiAgICB9XHJcbiAgICBlbC5pZCA9IGJ1dHRvbi5pZDtcclxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYnV0dG9uSGFuZGxlcik7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQgLmJ1dHRvbnMnKS5hcHBlbmRDaGlsZChlbCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBkZXRlcm1pbmUgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgZWFjaCBidXR0b24gYWRkZWQgdG8gYW4gYWxlcnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnRcclxuICovXHJcbmZ1bmN0aW9uIGJ1dHRvbkhhbmRsZXIoZXZlbnQpIHtcclxuICAgIHZhciBidXR0b24gPSBpbnN0YW5jZS5idXR0b25zW2V2ZW50LnRhcmdldC5pZF0gfHwge307XHJcbiAgICBpZiAodHlwZW9mIGJ1dHRvbi5hY3Rpb24gPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGJ1dHRvbi5hY3Rpb24uY2FsbChidXR0b24udGhpc0FyZyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9SZXF1aXJlIHRoYXQgdGhlcmUgYmUgYW4gYWN0aW9uIGFzb2NpYXRlZCB3aXRoIG5vLWRpc21pc3MgYnV0dG9ucy5cclxuICAgIGlmIChidXR0b24uZGlzbWlzcyB8fCB0eXBlb2YgYnV0dG9uLmFjdGlvbiAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0JykuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpO1xyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCB+IC5vdmVybGF5JykuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpO1xyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCAuYnV0dG9ucycpLmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIGluc3RhbmNlLmJ1dHRvbnMgPSB7fTtcclxuICAgICAgICBpbnN0YW5jZS5hY3RpdmUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gQXJlIG1vcmUgYWxlcnRzIHdhaXRpbmcgdG8gYmUgc2hvd24/XHJcbiAgICAgICAgaWYgKGluc3RhbmNlLnF1ZXVlLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBsZXQgbmV4dCA9IGluc3RhbmNlLnF1ZXVlLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIGFsZXJ0KG5leHQudGV4dCwgbmV4dC5idXR0b25zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwiXHJcblxyXG5PYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2FsZXJ0JyksXHJcbiAgICByZXF1aXJlKCcuL25vdGlmeScpXHJcbik7XHJcblxyXG52YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG5lbC5pbm5lckhUTUwgPSBcIlwiO1xyXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbmVsLmlkID0gJ2FsZXJ0V3JhcHBlcic7XHJcbmVsLmlubmVySFRNTCA9IFwiPGRpdiBpZD1cXFwiYWxlcnRcXFwiPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJhbGVydENvbnRlbnRcXFwiPjwvZGl2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJidXR0b25zXFxcIi8+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwib3ZlcmxheVxcXCIvPjwvZGl2PlxcclxcblwiO1xyXG5cclxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbm90aWZ5LFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2VuZCBhIG5vbi1jcml0aWNhbCBhbGVydCB0byB0aGUgdXNlci5cclxuICogU2hvdWxkIGJlIHVzZWQgaW4gcGxhY2Ugb2YgdWkuYWxlcnQgaWYgcG9zc2libGUgYXMgaXQgaXMgbm9uLWJsb2NraW5nLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL1Nob3dzIGEgbm90ZmljYXRpb24gZm9yIDIgc2Vjb25kc1xyXG4gKiB1aS5ub3RpZnkoJ05vdGlmaWNhdGlvbicpO1xyXG4gKiAvL1Nob3dzIGEgbm90aWZpY2F0aW9uIGZvciA1IHNlY29uZHNcclxuICogdWkubm90aWZ5KCdOb3RpZmljYXRpb24nLCA1KTtcclxuICogQHBhcmFtIFN0cmluZyB0ZXh0IHRoZSB0ZXh0IHRvIGRpc3BsYXkuIFNob3VsZCBiZSBrZXB0IHNob3J0IHRvIGF2b2lkIHZpc3VhbGx5IGJsb2NraW5nIHRoZSBtZW51IG9uIHNtYWxsIGRldmljZXMuXHJcbiAqIEBwYXJhbSBOdW1iZXIgZGlzcGxheVRpbWUgdGhlIG51bWJlciBvZiBzZWNvbmRzIHRvIHNob3cgdGhlIG5vdGlmaWNhdGlvbiBmb3IuXHJcbiAqL1xyXG5mdW5jdGlvbiBub3RpZnkodGV4dCwgZGlzcGxheVRpbWUgPSAyKSB7XHJcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIGVsLmNsYXNzTGlzdC5hZGQoJ25vdGlmaWNhdGlvbicpO1xyXG4gICAgZWwuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xyXG4gICAgZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnJlbW92ZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2libGUnKTtcclxuICAgIH0uYmluZChlbCksIGRpc3BsYXlUaW1lICogMTAwMCk7XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKGVsKSwgZGlzcGxheVRpbWUgKiAxMDAwICsgMjEwMCk7XHJcbn1cclxuIiwiLy9EZXRhaWxzIHBvbHlmaWxsLCBvbGRlciBmaXJlZm94LCBJRVxyXG5pZiAoISgnb3BlbicgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGV0YWlscycpKSkge1xyXG4gICAgbGV0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuICAgIHN0eWxlLnRleHRDb250ZW50ICs9IGBkZXRhaWxzOm5vdChbb3Blbl0pID4gOm5vdChzdW1tYXJ5KSB7IGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfSBkZXRhaWxzID4gc3VtbWFyeTpiZWZvcmUgeyBjb250ZW50OiBcIuKWtlwiOyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGZvbnQtc2l6ZTogLjhlbTsgd2lkdGg6IDEuNWVtOyBmb250LWZhbWlseTpcIkNvdXJpZXIgTmV3XCI7IH0gZGV0YWlsc1tvcGVuXSA+IHN1bW1hcnk6YmVmb3JlIHsgdHJhbnNmb3JtOiByb3RhdGUoOTBkZWcpOyB9YDtcclxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xyXG5cclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC50YWdOYW1lID09ICdTVU1NQVJZJykge1xyXG4gICAgICAgICAgICBsZXQgZGV0YWlscyA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFkZXRhaWxzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChkZXRhaWxzLmdldEF0dHJpYnV0ZSgnb3BlbicpKSB7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLm9wZW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMucmVtb3ZlQXR0cmlidXRlKCdvcGVuJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLm9wZW4gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5zZXRBdHRyaWJ1dGUoJ29wZW4nLCAnb3BlbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiLy8gSUUgRml4XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XHJcbiAgICBpZiAoISgnY29udGVudCcgaW4gdGVtcGxhdGUpKSB7XHJcbiAgICAgICAgbGV0IGNvbnRlbnQgPSB0ZW1wbGF0ZS5jaGlsZE5vZGVzO1xyXG4gICAgICAgIGxldCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb250ZW50Lmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGNvbnRlbnRbal0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGVtcGxhdGUuY29udGVudCA9IGZyYWdtZW50O1xyXG4gICAgfVxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSxcclxufTtcclxuXHJcbnZhciBwb2x5ZmlsbCA9IHJlcXVpcmUoJ3VpL3BvbHlmaWxscy90ZW1wbGF0ZScpO1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2xvbmUgYSB0ZW1wbGF0ZSBhZnRlciBhbHRlcmluZyB0aGUgcHJvdmlkZWQgcnVsZXMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI3RlbXBsYXRlJywgJyN0YXJnZXQnLCBbe3NlbGVjdG9yOiAnaW5wdXQnLCB2YWx1ZTogJ1ZhbHVlJ31dKTtcclxuICogdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCd0ZW1wbGF0ZScsICdkaXYnLCBbe3NlbGVjdG9yOiAnYScsIHJlbW92ZTogWydocmVmJ10sIG11bHRpcGxlOiB0cnVlfV0pO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGVtcGxhdGVTZWxlY3RvclxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFyZ2V0U2VsZWN0b3JcclxuICogQHBhcmFtIHthcnJheX0gcnVsZXMgZm9ybWF0OiBhcnJheSBvZiBvYmplY3RzXHJcbiAqICAgICAgZWFjaCBvYmplY3QgbXVzdCBoYXZlIFwic2VsZWN0b3JcIi5cclxuICogICAgICBlYWNoIG9iamVjdCBjYW4gaGF2ZSBcIm11bHRpcGxlXCIgc2V0IHRvIHVwZGF0ZSBhbGwgbWF0Y2hpbmcgZWxlbWVudHMuXHJcbiAqICAgICAgZWFjaCBvYmplY3QgY2FuIGhhdmUgXCJyZW1vdmVcIiAtIGFuIGFycmF5IG9mIGF0dHJpYnV0ZXMgdG8gcmVtb3ZlLlxyXG4gKiAgICAgIGVhY2ggb2JqZWN0IGNhbiBoYXZlIFwidGV4dFwiIG9yIFwiaHRtbFwiIC0gZnVydGhlciBrZXlzIHdpbGwgYmUgc2V0IGFzIGF0dHJpYnV0ZXMuXHJcbiAqICAgICAgaWYgYm90aCB0ZXh0IGFuZCBodG1sIGFyZSBzZXQsIHRleHQgd2lsbCB0YWtlIHByZWNlbmRlbmNlLlxyXG4gKiAgICAgIHJ1bGVzIHdpbGwgYmUgcGFyc2VkIGluIHRoZSBvcmRlciB0aGF0IHRoZXkgYXJlIHByZXNlbnQgaW4gdGhlIGFycmF5LlxyXG4gKi9cclxuZnVuY3Rpb24gYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKHRlbXBsYXRlU2VsZWN0b3IsIHRhcmdldFNlbGVjdG9yLCBydWxlcyA9IFtdKSB7XHJcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRlbXBsYXRlU2VsZWN0b3IpO1xyXG5cclxuICAgIHBvbHlmaWxsKHRlbXBsYXRlKTtcclxuXHJcbiAgICB2YXIgY29udGVudCA9IHRlbXBsYXRlLmNvbnRlbnQ7XHJcblxyXG4gICAgcnVsZXMuZm9yRWFjaChydWxlID0+IGhhbmRsZVJ1bGUoY29udGVudCwgcnVsZSkpO1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGFyZ2V0U2VsZWN0b3IpLmFwcGVuZENoaWxkKGRvY3VtZW50LmltcG9ydE5vZGUoY29udGVudCwgdHJ1ZSkpO1xyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gYXBwbHkgcnVsZXMgdG8gdGhlIHRlbXBsYXRlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge05vZGV9IGNvbnRlbnQgLSB0aGUgY29udGVudCBvZiB0aGUgdGVtcGxhdGUuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBydWxlIC0gdGhlIHJ1bGUgdG8gYXBwbHkuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVSdWxlKGNvbnRlbnQsIHJ1bGUpIHtcclxuICAgIGlmIChydWxlLm11bHRpcGxlKSB7XHJcbiAgICAgICAgbGV0IGVscyA9IGNvbnRlbnQucXVlcnlTZWxlY3RvckFsbChydWxlLnNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgQXJyYXkuZnJvbShlbHMpXHJcbiAgICAgICAgICAgIC5mb3JFYWNoKGVsID0+IHVwZGF0ZUVsZW1lbnQoZWwsIHJ1bGUpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbGV0IGVsID0gY29udGVudC5xdWVyeVNlbGVjdG9yKHJ1bGUuc2VsZWN0b3IpO1xyXG4gICAgICAgIGlmICghZWwpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBVbmFibGUgdG8gdXBkYXRlICR7cnVsZS5zZWxlY3Rvcn0uYCwgcnVsZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZUVsZW1lbnQoZWwsIHJ1bGUpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gdXBkYXRlIGFuIGVsZW1lbnQgd2l0aCBhIHJ1bGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Tm9kZX0gZWwgdGhlIGVsZW1lbnQgdG8gYXBwbHkgdGhlIHJ1bGVzIHRvLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcnVsZSB0aGUgcnVsZSBvYmplY3QuXHJcbiAqL1xyXG5mdW5jdGlvbiB1cGRhdGVFbGVtZW50KGVsLCBydWxlKSB7XHJcbiAgICBpZiAoJ3RleHQnIGluIHJ1bGUpIHtcclxuICAgICAgICBlbC50ZXh0Q29udGVudCA9IHJ1bGUudGV4dDtcclxuICAgIH0gZWxzZSBpZiAoJ2h0bWwnIGluIHJ1bGUpIHtcclxuICAgICAgICBlbC5pbm5lckhUTUwgPSBydWxlLmh0bWw7XHJcbiAgICB9XHJcblxyXG4gICAgT2JqZWN0LmtleXMocnVsZSlcclxuICAgICAgICAuZmlsdGVyKGtleSA9PiAhWydzZWxlY3RvcicsICd0ZXh0JywgJ2h0bWwnLCAncmVtb3ZlJywgJ211bHRpcGxlJ10uaW5jbHVkZXMoa2V5KSlcclxuICAgICAgICAuZm9yRWFjaChrZXkgPT4gZWwuc2V0QXR0cmlidXRlKGtleSwgcnVsZVtrZXldKSk7XHJcblxyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkocnVsZS5yZW1vdmUpKSB7XHJcbiAgICAgICAgcnVsZS5yZW1vdmUuZm9yRWFjaChrZXkgPT4gZWwucmVtb3ZlQXR0cmlidXRlKGtleSkpO1xyXG4gICAgfVxyXG59XHJcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gY29tcGFyZSBhbmQgaXNCdWZmZXIgdGFrZW4gZnJvbSBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9ibG9iLzY4MGU5ZTVlNDg4ZjIyYWFjMjc1OTlhNTdkYzg0NGE2MzE1OTI4ZGQvaW5kZXguanNcbi8vIG9yaWdpbmFsIG5vdGljZTpcblxuLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuZnVuY3Rpb24gY29tcGFyZShhLCBiKSB7XG4gIGlmIChhID09PSBiKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICB2YXIgeCA9IGEubGVuZ3RoO1xuICB2YXIgeSA9IGIubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldO1xuICAgICAgeSA9IGJbaV07XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaWYgKHkgPCB4KSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBpc0J1ZmZlcihiKSB7XG4gIGlmIChnbG9iYWwuQnVmZmVyICYmIHR5cGVvZiBnbG9iYWwuQnVmZmVyLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIoYik7XG4gIH1cbiAgcmV0dXJuICEhKGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlcik7XG59XG5cbi8vIGJhc2VkIG9uIG5vZGUgYXNzZXJ0LCBvcmlnaW5hbCBub3RpY2U6XG5cbi8vIGh0dHA6Ly93aWtpLmNvbW1vbmpzLm9yZy93aWtpL1VuaXRfVGVzdGluZy8xLjBcbi8vXG4vLyBUSElTIElTIE5PVCBURVNURUQgTk9SIExJS0VMWSBUTyBXT1JLIE9VVFNJREUgVjghXG4vL1xuLy8gT3JpZ2luYWxseSBmcm9tIG5hcndoYWwuanMgKGh0dHA6Ly9uYXJ3aGFsanMub3JnKVxuLy8gQ29weXJpZ2h0IChjKSAyMDA5IFRob21hcyBSb2JpbnNvbiA8Mjgwbm9ydGguY29tPlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlICdTb2Z0d2FyZScpLCB0b1xuLy8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGVcbi8vIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vclxuLy8gc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAnQVMgSVMnLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU5cbi8vIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT05cbi8vIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgZnVuY3Rpb25zSGF2ZU5hbWVzID0gKGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGZvbygpIHt9Lm5hbWUgPT09ICdmb28nO1xufSgpKTtcbmZ1bmN0aW9uIHBUb1N0cmluZyAob2JqKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKTtcbn1cbmZ1bmN0aW9uIGlzVmlldyhhcnJidWYpIHtcbiAgaWYgKGlzQnVmZmVyKGFycmJ1ZikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHR5cGVvZiBnbG9iYWwuQXJyYXlCdWZmZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlci5pc1ZpZXcgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gQXJyYXlCdWZmZXIuaXNWaWV3KGFycmJ1Zik7XG4gIH1cbiAgaWYgKCFhcnJidWYpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGFycmJ1ZiBpbnN0YW5jZW9mIERhdGFWaWV3KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKGFycmJ1Zi5idWZmZXIgJiYgYXJyYnVmLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxudmFyIHJlZ2V4ID0gL1xccypmdW5jdGlvblxccysoW15cXChcXHNdKilcXHMqLztcbi8vIGJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9samhhcmIvZnVuY3Rpb24ucHJvdG90eXBlLm5hbWUvYmxvYi9hZGVlZWVjOGJmY2M2MDY4YjE4N2Q3ZDlmYjNkNWJiMWQzYTMwODk5L2ltcGxlbWVudGF0aW9uLmpzXG5mdW5jdGlvbiBnZXROYW1lKGZ1bmMpIHtcbiAgaWYgKCF1dGlsLmlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGZ1bmN0aW9uc0hhdmVOYW1lcykge1xuICAgIHJldHVybiBmdW5jLm5hbWU7XG4gIH1cbiAgdmFyIHN0ciA9IGZ1bmMudG9TdHJpbmcoKTtcbiAgdmFyIG1hdGNoID0gc3RyLm1hdGNoKHJlZ2V4KTtcbiAgcmV0dXJuIG1hdGNoICYmIG1hdGNoWzFdO1xufVxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICB9IGVsc2Uge1xuICAgIC8vIG5vbiB2OCBicm93c2VycyBzbyB3ZSBjYW4gaGF2ZSBhIHN0YWNrdHJhY2VcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgdmFyIG91dCA9IGVyci5zdGFjaztcblxuICAgICAgLy8gdHJ5IHRvIHN0cmlwIHVzZWxlc3MgZnJhbWVzXG4gICAgICB2YXIgZm5fbmFtZSA9IGdldE5hbWUoc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHR5cGVvZiBzID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuZnVuY3Rpb24gaW5zcGVjdChzb21ldGhpbmcpIHtcbiAgaWYgKGZ1bmN0aW9uc0hhdmVOYW1lcyB8fCAhdXRpbC5pc0Z1bmN0aW9uKHNvbWV0aGluZykpIHtcbiAgICByZXR1cm4gdXRpbC5pbnNwZWN0KHNvbWV0aGluZyk7XG4gIH1cbiAgdmFyIHJhd25hbWUgPSBnZXROYW1lKHNvbWV0aGluZyk7XG4gIHZhciBuYW1lID0gcmF3bmFtZSA/ICc6ICcgKyByYXduYW1lIDogJyc7XG4gIHJldHVybiAnW0Z1bmN0aW9uJyArICBuYW1lICsgJ10nO1xufVxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShpbnNwZWN0KHNlbGYuYWN0dWFsKSwgMTI4KSArICcgJyArXG4gICAgICAgICBzZWxmLm9wZXJhdG9yICsgJyAnICtcbiAgICAgICAgIHRydW5jYXRlKGluc3BlY3Qoc2VsZi5leHBlY3RlZCksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIGZhbHNlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5hc3NlcnQuZGVlcFN0cmljdEVxdWFsID0gZnVuY3Rpb24gZGVlcFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIHRydWUpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcFN0cmljdEVxdWFsJywgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgc3RyaWN0LCBtZW1vcykge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChpc0J1ZmZlcihhY3R1YWwpICYmIGlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBjb21wYXJlKGFjdHVhbCwgZXhwZWN0ZWQpID09PSAwO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICgoYWN0dWFsID09PSBudWxsIHx8IHR5cGVvZiBhY3R1YWwgIT09ICdvYmplY3QnKSAmJlxuICAgICAgICAgICAgIChleHBlY3RlZCA9PT0gbnVsbCB8fCB0eXBlb2YgZXhwZWN0ZWQgIT09ICdvYmplY3QnKSkge1xuICAgIHJldHVybiBzdHJpY3QgPyBhY3R1YWwgPT09IGV4cGVjdGVkIDogYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIElmIGJvdGggdmFsdWVzIGFyZSBpbnN0YW5jZXMgb2YgdHlwZWQgYXJyYXlzLCB3cmFwIHRoZWlyIHVuZGVybHlpbmdcbiAgLy8gQXJyYXlCdWZmZXJzIGluIGEgQnVmZmVyIGVhY2ggdG8gaW5jcmVhc2UgcGVyZm9ybWFuY2VcbiAgLy8gVGhpcyBvcHRpbWl6YXRpb24gcmVxdWlyZXMgdGhlIGFycmF5cyB0byBoYXZlIHRoZSBzYW1lIHR5cGUgYXMgY2hlY2tlZCBieVxuICAvLyBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nIChha2EgcFRvU3RyaW5nKS4gTmV2ZXIgcGVyZm9ybSBiaW5hcnlcbiAgLy8gY29tcGFyaXNvbnMgZm9yIEZsb2F0KkFycmF5cywgdGhvdWdoLCBzaW5jZSBlLmcuICswID09PSAtMCBidXQgdGhlaXJcbiAgLy8gYml0IHBhdHRlcm5zIGFyZSBub3QgaWRlbnRpY2FsLlxuICB9IGVsc2UgaWYgKGlzVmlldyhhY3R1YWwpICYmIGlzVmlldyhleHBlY3RlZCkgJiZcbiAgICAgICAgICAgICBwVG9TdHJpbmcoYWN0dWFsKSA9PT0gcFRvU3RyaW5nKGV4cGVjdGVkKSAmJlxuICAgICAgICAgICAgICEoYWN0dWFsIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5IHx8XG4gICAgICAgICAgICAgICBhY3R1YWwgaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXkpKSB7XG4gICAgcmV0dXJuIGNvbXBhcmUobmV3IFVpbnQ4QXJyYXkoYWN0dWFsLmJ1ZmZlciksXG4gICAgICAgICAgICAgICAgICAgbmV3IFVpbnQ4QXJyYXkoZXhwZWN0ZWQuYnVmZmVyKSkgPT09IDA7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIGlmIChpc0J1ZmZlcihhY3R1YWwpICE9PSBpc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbWVtb3MgPSBtZW1vcyB8fCB7YWN0dWFsOiBbXSwgZXhwZWN0ZWQ6IFtdfTtcblxuICAgIHZhciBhY3R1YWxJbmRleCA9IG1lbW9zLmFjdHVhbC5pbmRleE9mKGFjdHVhbCk7XG4gICAgaWYgKGFjdHVhbEluZGV4ICE9PSAtMSkge1xuICAgICAgaWYgKGFjdHVhbEluZGV4ID09PSBtZW1vcy5leHBlY3RlZC5pbmRleE9mKGV4cGVjdGVkKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBtZW1vcy5hY3R1YWwucHVzaChhY3R1YWwpO1xuICAgIG1lbW9zLmV4cGVjdGVkLnB1c2goZXhwZWN0ZWQpO1xuXG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQsIHN0cmljdCwgbWVtb3MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIsIHN0cmljdCwgYWN0dWFsVmlzaXRlZE9iamVjdHMpIHtcbiAgaWYgKGEgPT09IG51bGwgfHwgYSA9PT0gdW5kZWZpbmVkIHx8IGIgPT09IG51bGwgfHwgYiA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gaWYgb25lIGlzIGEgcHJpbWl0aXZlLCB0aGUgb3RoZXIgbXVzdCBiZSBzYW1lXG4gIGlmICh1dGlsLmlzUHJpbWl0aXZlKGEpIHx8IHV0aWwuaXNQcmltaXRpdmUoYikpXG4gICAgcmV0dXJuIGEgPT09IGI7XG4gIGlmIChzdHJpY3QgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKGEpICE9PSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB2YXIgYUlzQXJncyA9IGlzQXJndW1lbnRzKGEpO1xuICB2YXIgYklzQXJncyA9IGlzQXJndW1lbnRzKGIpO1xuICBpZiAoKGFJc0FyZ3MgJiYgIWJJc0FyZ3MpIHx8ICghYUlzQXJncyAmJiBiSXNBcmdzKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhSXNBcmdzKSB7XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiLCBzdHJpY3QpO1xuICB9XG4gIHZhciBrYSA9IG9iamVjdEtleXMoYSk7XG4gIHZhciBrYiA9IG9iamVjdEtleXMoYik7XG4gIHZhciBrZXksIGk7XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT09IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9PSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSwgc3RyaWN0LCBhY3R1YWxWaXNpdGVkT2JqZWN0cykpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIDguIFRoZSBub24tZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGZvciBhbnkgZGVlcCBpbmVxdWFsaXR5LlxuLy8gYXNzZXJ0Lm5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3REZWVwRXF1YWwgPSBmdW5jdGlvbiBub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBmYWxzZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuYXNzZXJ0Lm5vdERlZXBTdHJpY3RFcXVhbCA9IG5vdERlZXBTdHJpY3RFcXVhbDtcbmZ1bmN0aW9uIG5vdERlZXBTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIHRydWUpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcFN0cmljdEVxdWFsJywgbm90RGVlcFN0cmljdEVxdWFsKTtcbiAgfVxufVxuXG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBJZ25vcmUuICBUaGUgaW5zdGFuY2VvZiBjaGVjayBkb2Vzbid0IHdvcmsgZm9yIGFycm93IGZ1bmN0aW9ucy5cbiAgfVxuXG4gIGlmIChFcnJvci5pc1Byb3RvdHlwZU9mKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBleHBlY3RlZC5jYWxsKHt9LCBhY3R1YWwpID09PSB0cnVlO1xufVxuXG5mdW5jdGlvbiBfdHJ5QmxvY2soYmxvY2spIHtcbiAgdmFyIGVycm9yO1xuICB0cnkge1xuICAgIGJsb2NrKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBlcnJvciA9IGU7XG4gIH1cbiAgcmV0dXJuIGVycm9yO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodHlwZW9mIGJsb2NrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJibG9ja1wiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBleHBlY3RlZCA9PT0gJ3N0cmluZycpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgYWN0dWFsID0gX3RyeUJsb2NrKGJsb2NrKTtcblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIHZhciB1c2VyUHJvdmlkZWRNZXNzYWdlID0gdHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnO1xuICB2YXIgaXNVbndhbnRlZEV4Y2VwdGlvbiA9ICFzaG91bGRUaHJvdyAmJiB1dGlsLmlzRXJyb3IoYWN0dWFsKTtcbiAgdmFyIGlzVW5leHBlY3RlZEV4Y2VwdGlvbiA9ICFzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgIWV4cGVjdGVkO1xuXG4gIGlmICgoaXNVbndhbnRlZEV4Y2VwdGlvbiAmJlxuICAgICAgdXNlclByb3ZpZGVkTWVzc2FnZSAmJlxuICAgICAgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8XG4gICAgICBpc1VuZXhwZWN0ZWRFeGNlcHRpb24pIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3ModHJ1ZSwgYmxvY2ssIGVycm9yLCBtZXNzYWdlKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzKGZhbHNlLCBibG9jaywgZXJyb3IsIG1lc3NhZ2UpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikgdGhyb3cgZXJyOyB9O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcbiIsIi8qZ2xvYmFsIHdpbmRvdywgZ2xvYmFsKi9cbnZhciB1dGlsID0gcmVxdWlyZShcInV0aWxcIilcbnZhciBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpXG52YXIgbm93ID0gcmVxdWlyZShcImRhdGUtbm93XCIpXG5cbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZVxudmFyIGNvbnNvbGVcbnZhciB0aW1lcyA9IHt9XG5cbmlmICh0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiICYmIGdsb2JhbC5jb25zb2xlKSB7XG4gICAgY29uc29sZSA9IGdsb2JhbC5jb25zb2xlXG59IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93LmNvbnNvbGUpIHtcbiAgICBjb25zb2xlID0gd2luZG93LmNvbnNvbGVcbn0gZWxzZSB7XG4gICAgY29uc29sZSA9IHt9XG59XG5cbnZhciBmdW5jdGlvbnMgPSBbXG4gICAgW2xvZywgXCJsb2dcIl0sXG4gICAgW2luZm8sIFwiaW5mb1wiXSxcbiAgICBbd2FybiwgXCJ3YXJuXCJdLFxuICAgIFtlcnJvciwgXCJlcnJvclwiXSxcbiAgICBbdGltZSwgXCJ0aW1lXCJdLFxuICAgIFt0aW1lRW5kLCBcInRpbWVFbmRcIl0sXG4gICAgW3RyYWNlLCBcInRyYWNlXCJdLFxuICAgIFtkaXIsIFwiZGlyXCJdLFxuICAgIFtjb25zb2xlQXNzZXJ0LCBcImFzc2VydFwiXVxuXVxuXG5mb3IgKHZhciBpID0gMDsgaSA8IGZ1bmN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0dXBsZSA9IGZ1bmN0aW9uc1tpXVxuICAgIHZhciBmID0gdHVwbGVbMF1cbiAgICB2YXIgbmFtZSA9IHR1cGxlWzFdXG5cbiAgICBpZiAoIWNvbnNvbGVbbmFtZV0pIHtcbiAgICAgICAgY29uc29sZVtuYW1lXSA9IGZcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29uc29sZVxuXG5mdW5jdGlvbiBsb2coKSB7fVxuXG5mdW5jdGlvbiBpbmZvKCkge1xuICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cylcbn1cblxuZnVuY3Rpb24gd2FybigpIHtcbiAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpXG59XG5cbmZ1bmN0aW9uIGVycm9yKCkge1xuICAgIGNvbnNvbGUud2Fybi5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpXG59XG5cbmZ1bmN0aW9uIHRpbWUobGFiZWwpIHtcbiAgICB0aW1lc1tsYWJlbF0gPSBub3coKVxufVxuXG5mdW5jdGlvbiB0aW1lRW5kKGxhYmVsKSB7XG4gICAgdmFyIHRpbWUgPSB0aW1lc1tsYWJlbF1cbiAgICBpZiAoIXRpbWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gc3VjaCBsYWJlbDogXCIgKyBsYWJlbClcbiAgICB9XG5cbiAgICB2YXIgZHVyYXRpb24gPSBub3coKSAtIHRpbWVcbiAgICBjb25zb2xlLmxvZyhsYWJlbCArIFwiOiBcIiArIGR1cmF0aW9uICsgXCJtc1wiKVxufVxuXG5mdW5jdGlvbiB0cmFjZSgpIHtcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKClcbiAgICBlcnIubmFtZSA9IFwiVHJhY2VcIlxuICAgIGVyci5tZXNzYWdlID0gdXRpbC5mb3JtYXQuYXBwbHkobnVsbCwgYXJndW1lbnRzKVxuICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKVxufVxuXG5mdW5jdGlvbiBkaXIob2JqZWN0KSB7XG4gICAgY29uc29sZS5sb2codXRpbC5pbnNwZWN0KG9iamVjdCkgKyBcIlxcblwiKVxufVxuXG5mdW5jdGlvbiBjb25zb2xlQXNzZXJ0KGV4cHJlc3Npb24pIHtcbiAgICBpZiAoIWV4cHJlc3Npb24pIHtcbiAgICAgICAgdmFyIGFyciA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKVxuICAgICAgICBhc3NlcnQub2soZmFsc2UsIHV0aWwuZm9ybWF0LmFwcGx5KG51bGwsIGFycikpXG4gICAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBub3dcblxuZnVuY3Rpb24gbm93KCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiJdfQ==
