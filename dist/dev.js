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

},{"./console":7,"bot":3,"libraries/ajax":9,"libraries/blockheads":11,"libraries/hook":12,"libraries/storage":13,"libraries/world":14,"ui":26}],2:[function(require,module,exports){
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

},{"libraries/blockheads":11,"settings":23}],6:[function(require,module,exports){
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

},{"./exports":6,"bot":3,"libraries/hook":12,"libraries/world":14,"ui":26}],8:[function(require,module,exports){
const bhfansapi = require('libraries/bhfansapi');
const ui = require('ui');
const hook = require('libraries/hook');
const MessageBotExtension = require('MessageBotExtension');


var tab = ui.addTab('Extensions');
tab.innerHTML = '<style>' +
    "#mb_extensions .top-right-button{width:inherit;padding:0 7px}#mb_extensions h3{margin:0 0 5px 0}#exts{display:flex;flex-flow:row wrap;border-top:1px solid #000}#exts h4,#exts p{margin:0}#exts button{position:absolute;bottom:7px;padding:4px 8px;border-radius:8px;background:#fff}#exts>div{position:relative;height:130px;width:calc(33% - 19px);min-width:280px;padding:5px;margin-left:5px;margin-bottom:5px;border:3px solid #999;border-radius:10px}#exts>div:nth-child(odd){background:#ccc}\n" +
    '</style>' +
    "<template id=\"extTemplate\">\r\n    <div>\r\n        <h4>Title</h4>\r\n        <span>Description</span><br>\r\n        <button class=\"button\">Install</button>\r\n    </div>\r\n</template>\r\n<div id=\"mb_extensions\" data-tab-name=\"extensions\">\r\n    <h3>Extensions can increase the functionality of the bot.</h3>\r\n    <span>Interested in creating one? <a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/2.-Development:-Start-Here\" target=\"_blank\">Start here.</a></span>\r\n    <span class=\"top-right-button\">Load By ID/URL</span>\r\n    <div id=\"exts\"></div>\r\n</div>\r\n";

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

},{"MessageBotExtension":1,"libraries/bhfansapi":10,"libraries/hook":12,"ui":26}],9:[function(require,module,exports){
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
tab.innerHTML = "<template id=\"aTemplate\">\r\n    <div>\r\n        <label>Send:</label>\r\n        <textarea class=\"m\"></textarea>\r\n        <a>Delete</a>\r\n        <label style=\"display:block;margin-top:5px;\">Wait X minutes...</label>\r\n    </div>\r\n</template>\r\n<div id=\"mb_announcements\">\r\n    <h3>These are sent according to a regular schedule.</h3>\r\n    <span>If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"aMsgs\"></div>\r\n</div>\r\n";

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

},{"bot":3,"libraries/storage":13,"settings":23,"ui":26}],16:[function(require,module,exports){
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
    require('./checkJoinsAndGroup')
);

},{"./buildMessage":16,"./checkJoinsAndGroup":17}],19:[function(require,module,exports){
const ui = require('ui');


var el = document.createElement('style');
el.innerHTML = "#mb_join h3,#mb_leave h3,#mb_trigger h3,#mb_announcements h3{margin:0 0 5px 0}#mb_join input,#mb_join textarea,#mb_leave input,#mb_leave textarea,#mb_trigger input,#mb_trigger textarea,#mb_announcements input,#mb_announcements textarea{border:2px solid #666;width:calc(100% - 10px)}#mb_join textarea,#mb_leave textarea,#mb_trigger textarea,#mb_announcements textarea{resize:none;overflow:hidden;padding:1px 0;height:21px;transition:height .5s}#mb_join textarea:focus,#mb_leave textarea:focus,#mb_trigger textarea:focus,#mb_announcements textarea:focus{height:5em}#mb_join input[type=\"number\"],#mb_leave input[type=\"number\"],#mb_trigger input[type=\"number\"],#mb_announcements input[type=\"number\"]{width:5em}#jMsgs,#lMsgs,#tMsgs{position:relative;display:flex;flex-flow:row wrap;border-top:1px solid #000}#jMsgs>div,#lMsgs>div,#tMsgs>div{width:calc(33% - 19px);min-width:280px;padding:5px;margin-left:5px;margin-bottom:5px;border:3px solid #999;border-radius:10px}#jMsgs>div:nth-child(odd),#lMsgs>div:nth-child(odd),#tMsgs>div:nth-child(odd){background:#ccc}\n";
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

},{"./announcements":15,"./join":20,"./leave":21,"./trigger":22,"ui":26}],20:[function(require,module,exports){
const ui = require('ui');

const storage = require('libraries/storage');
const hook = require('libraries/hook');
const helpers = require('messages/helpers');


const STORAGE_ID = 'joinArr';

var tab = ui.addTab('Join', 'messages');
tab.innerHTML = "<template id=\"jTemplate\">\r\n    <div>\r\n        <label> Message: <textarea class=\"m\"></textarea></label>\r\n        <span class=\"summary\"></span>\r\n        <details><summary>More options</summary>\r\n            <label>Player is: <select data-target=\"group\">\r\n                <option value=\"All\">anyone</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <label>Player is not: <select data-target=\"not_group\">\r\n                <option value=\"Nobody\">nobody</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n            <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        </details>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_join\" data-tab-name=\"join\">\r\n    <h3>These are checked when a player joins the server.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"jMsgs\"></div>\r\n</div>\r\n";

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

},{"libraries/hook":12,"libraries/storage":13,"messages/helpers":18,"ui":26}],21:[function(require,module,exports){
const ui = require('ui');

const storage = require('libraries/storage');
const hook = require('libraries/hook');
const helpers = require('messages/helpers');


const STORAGE_ID = 'leaveArr';

var tab = ui.addTab('Leave', 'messages');
tab.innerHTML = "<template id=\"lTemplate\">\r\n    <div>\r\n        <label>Message <textarea class=\"m\"></textarea></label>\r\n        <details><summary>More options</summary>\r\n            <label>Player is: <select data-target=\"group\">\r\n                <option value=\"All\">anyone</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <label>Player is not: <select data-target=\"not_group\">\r\n                <option value=\"Nobody\">nobody</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n            <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        </details>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_leave\">\r\n    <h3>These are checked when a player leaves the server.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"lMsgs\"></div>\r\n</div>\r\n";

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

},{"libraries/hook":12,"libraries/storage":13,"messages/helpers":18,"ui":26}],22:[function(require,module,exports){
const ui = require('ui');

const storage = require('libraries/storage');
const hook = require('libraries/hook');
const helpers = require('messages/helpers');
const settings = require('settings');


const STORAGE_ID = 'triggerArr';

var tab = ui.addTab('Trigger', 'messages');
tab.innerHTML = "<template id=\"tTemplate\">\r\n    <div>\r\n        <label>Trigger: <input class=\"t\"></label>\r\n        <label>Message: <textarea class=\"m\"></textarea></label>\r\n        <span class=\"summary\"></span>\r\n        <details><summary>More options</summary>\r\n            <label>Player is: <select data-target=\"group\">\r\n                <option value=\"All\">anyone</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <label>Player is not: <select data-target=\"not_group\">\r\n                <option value=\"Nobody\">nobody</option>\r\n                <option value=\"Staff\">a staff member</option>\r\n                <option value=\"Mod\">a mod</option>\r\n                <option value=\"Admin\">an admin</option>\r\n                <option value=\"Owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n            <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        </details>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_trigger\">\r\n    <h3>These are checked whenever someone says something.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger \"te*st\" will match \"tea stuff\" and \"test\")</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"tMsgs\"></div>\r\n</div>\r\n";

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

},{"libraries/hook":12,"libraries/storage":13,"messages/helpers":18,"settings":23,"ui":26}],23:[function(require,module,exports){
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

},{"libraries/storage":13}],24:[function(require,module,exports){
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

},{"settings":23,"ui":26}],25:[function(require,module,exports){
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

require('ui/polyfills/console');
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
document.querySelector('#leftNav span').click();
require('messages');
require('extensions');
require('settings/page');

// Error reporting
window.addEventListener('error', (err) => {
    if (err.message != 'Script error') {
        bhfansapi.reportError(err);
    }
});

},{"./console":7,"MessageBotExtension":1,"bot/migration":4,"extensions":8,"libraries/bhfansapi":10,"libraries/hook":12,"messages":19,"settings/page":24,"ui":26,"ui/polyfills/console":31}],26:[function(require,module,exports){
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

},{"../console/exports":6,"./layout":27,"./notifications":29,"./polyfills/details":32,"./template":34}],27:[function(require,module,exports){
/**
 * @file Contains functions for managing the page layout
 */


const hook = require('libraries/hook');

// Build page - only case in which body.innerHTML should be used.
document.body.innerHTML += "<div id=\"leftNav\">\r\n    <input type=\"checkbox\" id=\"leftToggle\">\r\n    <label for=\"leftToggle\">&#9776; Menu</label>\r\n\r\n    <nav data-tab-group=\"main\"></nav>\r\n    <div class=\"overlay\"></div>\r\n</div>\r\n\r\n<div id=\"container\">\r\n    <header></header>\r\n</div>\r\n";
document.head.innerHTML += '<style>' + "html,body{min-height:100vh;position:relative;width:100%;margin:0;font-family:\"Lucida Grande\",\"Lucida Sans Unicode\",Verdana,sans-serif;color:#000}textarea,input,button,select{font-family:inherit}a{cursor:pointer;color:#182b73}#leftNav{text-transform:uppercase}#leftNav nav{width:250px;background:#182b73;color:#fff;position:fixed;left:-250px;z-index:100;top:0;bottom:0;transition:left .5s}#leftNav details,#leftNav span{display:block;text-align:center;padding:5px 7px;border-bottom:1px solid white}#leftNav .selected{background:radial-gradient(#9fafeb, #182b73)}#leftNav summary ~ span{background:rgba(159,175,235,0.4)}#leftNav summary+span{border-top-left-radius:20px;border-top-right-radius:20px}#leftNav summary ~ span:last-of-type{border:0;border-bottom-left-radius:20px;border-bottom-right-radius:20px}#leftNav input{display:none}#leftNav label{color:#fff;background:#213b9d;padding:5px;position:fixed;top:5px;z-index:100;left:5px;opacity:1;transition:left .5s,opacity .5s}#leftNav input:checked ~ nav{left:0;transition:left .5s}#leftNav input:checked ~ label{left:255px;opacity:0;transition:left .5s,opacity .5s}#leftNav input:checked ~ .overlay{visibility:visible;opacity:1;transition:opacity .5s}header{background:#182b73 url(\"http://portal.theblockheads.net/static/images/portalHeader.png\") no-repeat;background-position:80px;height:80px}#container>div{height:calc(100vh - 100px);padding:10px;position:absolute;top:80px;left:0;right:0;overflow:auto}#container>div:not(.visible){display:none}.overlay{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99;background:rgba(0,0,0,0.7);visibility:hidden;opacity:0;transition:opacity .5s}.overlay.visible{visibility:visible;opacity:1;transition:opacity .5s}.top-right-button{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:10px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}\n" + '</style>';

// Hide the menu when clicking the overlay
document.querySelector('#leftNav .overlay').addEventListener('click', toggleMenu);

// Change tabs
document.querySelector('#leftNav').addEventListener('click', function globalTabChange(event) {
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
    Array.from(document.querySelectorAll('#leftNav .selected'))
        .forEach(el => el.classList.remove('selected'));
    event.target.classList.add('selected');

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

},{"libraries/hook":12}],28:[function(require,module,exports){
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

},{"./alert":28,"./notify":30}],30:[function(require,module,exports){
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

},{"ui/polyfills/template":33}]},{},[25])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvTWVzc2FnZUJvdEV4dGVuc2lvbi5qcyIsImRldi9ib3QvY2hlY2tHcm91cC5qcyIsImRldi9ib3QvaW5kZXguanMiLCJkZXYvYm90L21pZ3JhdGlvbi5qcyIsImRldi9ib3Qvc2VuZC5qcyIsImRldi9jb25zb2xlL2V4cG9ydHMuanMiLCJkZXYvY29uc29sZS9pbmRleC5qcyIsImRldi9leHRlbnNpb25zL2luZGV4LmpzIiwiZGV2L2xpYnJhcmllcy9hamF4LmpzIiwiZGV2L2xpYnJhcmllcy9iaGZhbnNhcGkuanMiLCJkZXYvbGlicmFyaWVzL2Jsb2NraGVhZHMuanMiLCJkZXYvbGlicmFyaWVzL2hvb2suanMiLCJkZXYvbGlicmFyaWVzL3N0b3JhZ2UuanMiLCJkZXYvbGlicmFyaWVzL3dvcmxkLmpzIiwiZGV2L21lc3NhZ2VzL2Fubm91bmNlbWVudHMvaW5kZXguanMiLCJkZXYvbWVzc2FnZXMvaGVscGVycy9idWlsZE1lc3NhZ2UuanMiLCJkZXYvbWVzc2FnZXMvaGVscGVycy9jaGVja0pvaW5zQW5kR3JvdXAuanMiLCJkZXYvbWVzc2FnZXMvaGVscGVycy9pbmRleC5qcyIsImRldi9tZXNzYWdlcy9pbmRleC5qcyIsImRldi9tZXNzYWdlcy9qb2luL2luZGV4LmpzIiwiZGV2L21lc3NhZ2VzL2xlYXZlL2luZGV4LmpzIiwiZGV2L21lc3NhZ2VzL3RyaWdnZXIvaW5kZXguanMiLCJkZXYvc2V0dGluZ3MvaW5kZXguanMiLCJkZXYvc2V0dGluZ3MvcGFnZS5qcyIsImRldi9zdGFydC5qcyIsImRldi91aS9pbmRleC5qcyIsImRldi91aS9sYXlvdXQvaW5kZXguanMiLCJkZXYvdWkvbm90aWZpY2F0aW9ucy9hbGVydC5qcyIsImRldi91aS9ub3RpZmljYXRpb25zL2luZGV4LmpzIiwiZGV2L3VpL25vdGlmaWNhdGlvbnMvbm90aWZ5LmpzIiwiZGV2L3VpL3BvbHlmaWxscy9jb25zb2xlLmpzIiwiZGV2L3VpL3BvbHlmaWxscy9kZXRhaWxzLmpzIiwiZGV2L3VpL3BvbHlmaWxscy90ZW1wbGF0ZS5qcyIsImRldi91aS90ZW1wbGF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBib3QgPSByZXF1aXJlKCdib3QnKTtcclxuY29uc3QgYm90X2NvbnNvbGUgPSByZXF1aXJlKCcuL2NvbnNvbGUnKTtcclxuY29uc3QgdWkgPSByZXF1aXJlKCd1aScpO1xyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgYWpheCA9IHJlcXVpcmUoJ2xpYnJhcmllcy9hamF4Jyk7XHJcbmNvbnN0IGFwaSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ibG9ja2hlYWRzJyk7XHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5cclxuLy8gQXJyYXkgb2YgSURzIHRvIGF1dG9sb2FkIGF0IHRoZSBuZXh0IGxhdW5jaC5cclxudmFyIGF1dG9sb2FkID0gW107XHJcbnZhciBsb2FkZWQgPSBbXTtcclxuY29uc3QgU1RPUkFHRV9JRCA9ICdtYl9leHRlbnNpb25zJztcclxuXHJcblxyXG4vKipcclxuICogVXNlZCB0byBjcmVhdGUgYSBuZXcgZXh0ZW5zaW9uLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgdGVzdCA9IE1lc3NhZ2VCb3RFeHRlbnNpb24oJ3Rlc3QnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVzcGFjZSAtIFNob3VsZCBiZSB0aGUgc2FtZSBhcyB5b3VyIHZhcmlhYmxlIG5hbWUuXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IFt1bmluc3RhbGwgPSB1bmRlZmluZWRdIC0gT3B0aW9uYWwsIHNwZWNpZnkgdGhlIHVuaW5zdGFsbCBmdW5jdGlvbiB3aGlsZSBjcmVhdGluZyB0aGUgZXh0ZW5zaW9uLCBpbnN0ZWFkIG9mIGxhdGVyLiBJZiBzcGVjaWZpZWQgaGVyZSwgdGhpcyB3aWxsIGJlIGJvdW5kIHRvIHRoZSBleHRlbnNpb24uXHJcbiAqIEByZXR1cm4ge01lc3NhZ2VCb3RFeHRlbnNpb259IC0gVGhlIGV4dGVuc2lvbiB2YXJpYWJsZS5cclxuICovXHJcbmZ1bmN0aW9uIE1lc3NhZ2VCb3RFeHRlbnNpb24obmFtZXNwYWNlLCB1bmluc3RhbGwpIHtcclxuICAgIGxvYWRlZC5wdXNoKG5hbWVzcGFjZSk7XHJcbiAgICBob29rLmZpcmUoJ2V4dGVuc2lvbi5pbnN0YWxsJywgbmFtZXNwYWNlKTtcclxuXHJcbiAgICB2YXIgZXh0ZW5zaW9uID0ge1xyXG4gICAgICAgIGlkOiBuYW1lc3BhY2UsXHJcbiAgICAgICAgYm90LFxyXG4gICAgICAgIGNvbnNvbGU6IGJvdF9jb25zb2xlLFxyXG4gICAgICAgIHVpLFxyXG4gICAgICAgIHN0b3JhZ2UsXHJcbiAgICAgICAgYWpheCxcclxuICAgICAgICBhcGksXHJcbiAgICAgICAgd29ybGQsXHJcbiAgICAgICAgaG9vayxcclxuICAgIH07XHJcblxyXG4gICAgaWYgKHR5cGVvZiB1bmluc3RhbGwgPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGV4dGVuc2lvbi51bmluc3RhbGwgPSB1bmluc3RhbGwuYmluZChleHRlbnNpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXNlZCB0byBjaGFuZ2Ugd2hldGhlciBvciBub3QgdGhlIGV4dGVuc2lvbiB3aWxsIGJlXHJcbiAgICAgKiBBdXRvbWF0aWNhbGx5IGxvYWRlZCB0aGUgbmV4dCB0aW1lIHRoZSBib3QgaXMgbGF1bmNoZWQuXHJcbiAgICAgKlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHZhciB0ZXN0ID0gTWVzc2FnZUJvdEV4dGVuc2lvbigndGVzdCcpO1xyXG4gICAgICogdGVzdC5zZXRBdXRvTGF1bmNoKHRydWUpO1xyXG4gICAgICogQHBhcmFtIHtib29sfSBzaG91bGRBdXRvbG9hZFxyXG4gICAgICovXHJcbiAgICBleHRlbnNpb24uc2V0QXV0b0xhdW5jaCA9IGZ1bmN0aW9uIHNldEF1dG9MYXVuY2goc2hvdWxkQXV0b2xvYWQpIHtcclxuICAgICAgICBpZiAoIWF1dG9sb2FkLmluY2x1ZGVzKG5hbWVzcGFjZSkgJiYgc2hvdWxkQXV0b2xvYWQpIHtcclxuICAgICAgICAgICAgYXV0b2xvYWQucHVzaChuYW1lc3BhY2UpO1xyXG4gICAgICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBhdXRvbG9hZCwgZmFsc2UpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIXNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgICAgIGlmIChhdXRvbG9hZC5pbmNsdWRlcyhuYW1lc3BhY2UpKSB7XHJcbiAgICAgICAgICAgICAgICBhdXRvbG9hZC5zcGxpY2UoYXV0b2xvYWQuaW5kZXhPZihuYW1lc3BhY2UpLCAxKTtcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGF1dG9sb2FkLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBleHRlbnNpb247XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmllcyB0byBsb2FkIHRoZSByZXF1ZXN0ZWQgZXh0ZW5zaW9uIGJ5IElELlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcclxuICovXHJcbk1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbCA9IGZ1bmN0aW9uIGluc3RhbGwoaWQpIHtcclxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gICAgZWwuc3JjID0gYC8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvZXh0ZW5zaW9uLyR7aWR9L2NvZGUvcmF3YDtcclxuICAgIGVsLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XHJcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVbmluc3RhbGxzIGFuIGV4dGVuc2lvbi5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAqL1xyXG5NZXNzYWdlQm90RXh0ZW5zaW9uLnVuaW5zdGFsbCA9IGZ1bmN0aW9uIHVuaW5zdGFsbChpZCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aW5kb3dbaWRdLnVuaW5zdGFsbCgpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIC8vTm90IGluc3RhbGxlZCwgb3Igbm8gdW5pbnN0YWxsIGZ1bmN0aW9uLlxyXG4gICAgfVxyXG5cclxuICAgIHdpbmRvd1tpZF0gPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgaWYgKGF1dG9sb2FkLmluY2x1ZGVzKGlkKSkge1xyXG4gICAgICAgIGF1dG9sb2FkLnNwbGljZShhdXRvbG9hZC5pbmRleE9mKGlkKSwgMSk7XHJcbiAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgYXV0b2xvYWQsIGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAobG9hZGVkLmluY2x1ZGVzKGlkKSkge1xyXG4gICAgICAgIGxvYWRlZC5zcGxpY2UobG9hZGVkLmluZGV4T2YoaWQpLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICBob29rLmZpcmUoJ2V4dGVuc2lvbi51bmluc3RhbGwnLCBpZCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVXNlZCB0byBjaGVjayBpZiBhbiBleHRlbnNpb24gaGFzIGJlZW4gbG9hZGVkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbk1lc3NhZ2VCb3RFeHRlbnNpb24uaXNMb2FkZWQgPSBmdW5jdGlvbiBpc0xvYWRlZChpZCkge1xyXG4gICAgcmV0dXJuIGxvYWRlZC5pbmNsdWRlcyhpZCk7XHJcbn07XHJcblxyXG4vLyBMb2FkIGV4dGVuc2lvbnMgdGhhdCBzZXQgdGhlbXNlbHZlcyB0byBhdXRvbG9hZCBsYXN0IGxhdW5jaC5cclxuc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10sIGZhbHNlKVxyXG4gICAgLmZvckVhY2goTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWVzc2FnZUJvdEV4dGVuc2lvbjtcclxuIiwiLyoqXHJcbiAqIEBmaWxlIERlcHJpY2F0ZWQuIFVzZSB3b3JsZC5pc1tHcm91cF0gaW5zdGVhZC5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNoZWNrR3JvdXBcclxufTtcclxuXHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgaWYgdXNlcnMgYXJlIGluIGRlZmluZWQgZ3JvdXBzLlxyXG4gKlxyXG4gKiBAZGVwcmljYXRlZFxyXG4gKiBAZXhhbXBsZVxyXG4gKiBjaGVja0dyb3VwKCdhZG1pbicsICdTRVJWRVInKSAvLyB0cnVlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBncm91cCB0aGUgZ3JvdXAgdG8gY2hlY2tcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHVzZXIgdG8gY2hlY2tcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrR3JvdXAoZ3JvdXAsIG5hbWUpIHtcclxuICAgIGNvbnNvbGUud2FybignYm90LmNoZWNrR3JvdXAgaXMgZGVwcmljYXRlZC4gVXNlIHdvcmxkLmlzQWRtaW4sIHdvcmxkLmlzTW9kLCBldGMuIGluc3RlYWQnKTtcclxuXHJcbiAgICBuYW1lID0gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgc3dpdGNoIChncm91cC50b0xvY2FsZUxvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgY2FzZSAnYWxsJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzUGxheWVyKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ2FkbWluJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzQWRtaW4obmFtZSk7XHJcbiAgICAgICAgY2FzZSAnbW9kJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzTW9kKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ3N0YWZmJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzU3RhZmYobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnb3duZXInOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNPd25lcihuYW1lKTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuIiwiY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcblxyXG5jb25zdCBib3QgPSBPYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL3NlbmQnKSxcclxuICAgIHJlcXVpcmUoJy4vY2hlY2tHcm91cCcpXHJcbik7XHJcblxyXG5ib3QudmVyc2lvbiA9ICc2LjEuMGEnO1xyXG5cclxuLyoqXHJcbiAqIEBkZXByaWNhdGVkIHNpbmNlIDYuMS4wLiBVc2UgZXgud29ybGQgaW5zdGVhZC5cclxuICovXHJcbmJvdC53b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5cclxuc3RvcmFnZS5zZXQoJ21iX3ZlcnNpb24nLCBib3QudmVyc2lvbik7XHJcbiIsImZ1bmN0aW9uIHVwZGF0ZShrZXlzLCBvcGVyYXRvcikge1xyXG4gICAgT2JqZWN0LmtleXMobG9jYWxTdG9yYWdlKS5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBvZiBrZXlzKSB7XHJcbiAgICAgICAgICAgIGlmIChpdGVtLnN0YXJ0c1dpdGgoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oaXRlbSwgb3BlcmF0b3IobG9jYWxTdG9yYWdlLmdldEl0ZW0oaXRlbSkpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vanNoaW50IC1XMDg2XHJcbi8vTm8gYnJlYWsgc3RhdGVtZW50cyBhcyB3ZSB3YW50IHRvIGV4ZWN1dGUgYWxsIHVwZGF0ZXMgYWZ0ZXIgbWF0Y2hlZCB2ZXJzaW9uLlxyXG5zd2l0Y2ggKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdtYl92ZXJzaW9uJykpIHtcclxuICAgIGNhc2UgbnVsbDpcclxuICAgICAgICBicmVhazsgLy9Ob3RoaW5nIHRvIG1pZ3JhdGVcclxuICAgIGNhc2UgJzUuMi4wJzpcclxuICAgIGNhc2UgJzUuMi4xJzpcclxuICAgICAgICAvL1dpdGggNi4wLCBuZXdsaW5lcyBhcmUgZGlyZWN0bHkgc3VwcG9ydGVkIGluIG1lc3NhZ2VzIGJ5IHRoZSBib3QuXHJcbiAgICAgICAgdXBkYXRlKFsnYW5ub3VuY2VtZW50QXJyJywgJ2pvaW5BcnInLCAnbGVhdmVBcnInLCAndHJpZ2dlckFyciddLCBmdW5jdGlvbihyYXcpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdyk7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtc2cubWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cubWVzc2FnZSA9IG1zZy5tZXNzYWdlLnJlcGxhY2UoL1xcXFxuL2csICdcXG4nKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXJzZWQpO1xyXG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByYXc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBicmVhazsgLy9OZXh0IGJ1Z2ZpeCBvbmx5IHJlbGF0ZXMgdG8gNi4wIGJvdC5cclxuICAgIGNhc2UgJzYuMC4wYSc6XHJcbiAgICBjYXNlICc2LjAuMCc6XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgd2luZG93LmJvdHVpLmFsZXJ0KFwiRHVlIHRvIGEgYnVnIGluIHRoZSA2LjAuMCB2ZXJzaW9uIG9mIHRoZSBib3QsIHlvdXIgam9pbiBhbmQgbGVhdmUgbWVzc2FnZXMgbWF5IGJlIHN3YXBwZWQuIFNvcnJ5ISBUaGlzIGNhbm5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5LiBUaGlzIG1lc3NhZ2Ugd2lsbCBub3QgYmUgc2hvd24gYWdhaW4uXCIpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgICAgIGJyZWFrOyAvL05leHQgYnVnZml4IG9ubHkgcmVsYXRlcyB0byA2LjAuMSAvIDYuMC4yLlxyXG4gICAgY2FzZSAnNi4wLjEnOlxyXG4gICAgY2FzZSAnNi4wLjInOlxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5ib3R1aS5hbGVydChcIkR1ZSB0byBhIGJ1ZyBpbiA2LjAuMSAvIDYuMC4yLCBncm91cHMgbWF5IGhhdmUgYmVlbiBtaXhlZCB1cCBvbiBKb2luLCBMZWF2ZSwgYW5kIFRyaWdnZXIgbWVzc2FnZXMuIFNvcnJ5ISBUaGlzIGNhbm5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5IGlmIGl0IG9jY3VyZWQgb24geW91ciBib3QuIEFubm91bmNlbWVudHMgaGF2ZSBhbHNvIGJlZW4gZml4ZWQuXCIpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgY2FzZSAnNi4wLjMnOlxyXG4gICAgY2FzZSAnNi4wLjQnOlxyXG4gICAgY2FzZSAnNi4wLjUnOlxyXG59XHJcbi8vanNoaW50ICtXMDg2XHJcbiIsInZhciBhcGkgPSByZXF1aXJlKCdsaWJyYXJpZXMvYmxvY2toZWFkcycpO1xyXG52YXIgc2V0dGluZ3MgPSByZXF1aXJlKCdzZXR0aW5ncycpO1xyXG5cclxudmFyIHF1ZXVlID0gW107XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNlbmQsXHJcbn07XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBxdWV1ZSBhIG1lc3NhZ2UgdG8gYmUgc2VudC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2VuZCgnSGVsbG8hJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIGJlIHNlbnQuXHJcbiAqL1xyXG5mdW5jdGlvbiBzZW5kKG1lc3NhZ2UpIHtcclxuICAgIGlmIChzZXR0aW5ncy5zcGxpdE1lc3NhZ2VzKSB7XHJcbiAgICAgICAgLy9GSVhNRTogSWYgdGhlIGJhY2tzbGFzaCBiZWZvcmUgdGhlIHRva2VuIGlzIGVzY2FwZWQgYnkgYW5vdGhlciBiYWNrc2xhc2ggdGhlIHRva2VuIHNob3VsZCBzdGlsbCBzcGxpdCB0aGUgbWVzc2FnZS5cclxuICAgICAgICBsZXQgc3RyID0gbWVzc2FnZS5zcGxpdChzZXR0aW5ncy5zcGxpdFRva2VuKTtcclxuICAgICAgICBsZXQgdG9TZW5kID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBjdXJyID0gc3RyW2ldO1xyXG4gICAgICAgICAgICBpZiAoY3VycltjdXJyLmxlbmd0aCAtIDFdID09ICdcXFxcJyAmJiBpIDwgc3RyLmxlbmd0aCArIDEpIHtcclxuICAgICAgICAgICAgICAgIGN1cnIgKz0gc2V0dGluZ3Muc3BsaXRUb2tlbiArIHN0clsrK2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRvU2VuZC5wdXNoKGN1cnIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdG9TZW5kLmZvckVhY2gobXNnID0+IHF1ZXVlLnB1c2gobXNnKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHF1ZXVlLnB1c2gobWVzc2FnZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBXYXRjaGVzIHRoZSBxdWV1ZSBmb3IgbmV3IG1lc3NhZ2VzIHRvIHNlbmQgYW5kIHNlbmRzIHRoZW0gYXMgc29vbiBhcyBwb3NzaWJsZS5cclxuICovXHJcbihmdW5jdGlvbiBjaGVja1F1ZXVlKCkge1xyXG4gICAgaWYgKCFxdWV1ZS5sZW5ndGgpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrUXVldWUsIDUwMCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGFwaS5zZW5kKHF1ZXVlLnNoaWZ0KCkpXHJcbiAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrUXVldWUsIDEwMDApO1xyXG4gICAgICAgIH0pO1xyXG59KCkpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHdyaXRlLFxyXG4gICAgY2xlYXJcclxufTtcclxuXHJcbmZ1bmN0aW9uIHdyaXRlKG1zZywgbmFtZSA9ICcnLCBuYW1lQ2xhc3MgPSAnJykge1xyXG4gICAgdmFyIG1zZ0VsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgIGlmIChuYW1lQ2xhc3MpIHtcclxuICAgICAgICBtc2dFbC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgbmFtZUNsYXNzKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbmFtZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgbmFtZUVsLnRleHRDb250ZW50ID0gbmFtZTtcclxuXHJcbiAgICB2YXIgY29udGVudEVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgaWYgKG5hbWUpIHtcclxuICAgICAgICBjb250ZW50RWwudGV4dENvbnRlbnQgPSBgOiAke21zZ31gO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjb250ZW50RWwudGV4dENvbnRlbnQgPSBtc2c7XHJcbiAgICB9XHJcbiAgICBtc2dFbC5hcHBlbmRDaGlsZChuYW1lRWwpO1xyXG4gICAgbXNnRWwuYXBwZW5kQ2hpbGQoY29udGVudEVsKTtcclxuXHJcbiAgICB2YXIgY2hhdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIHVsJyk7XHJcbiAgICBjaGF0LmFwcGVuZENoaWxkKG1zZ0VsKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xlYXIoKSB7XHJcbiAgICB2YXIgY2hhdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIHVsJyk7XHJcbiAgICBjaGF0LmlubmVySFRNTCA9ICcnO1xyXG59XHJcbiIsImNvbnN0IHNlbGYgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZXhwb3J0cycpO1xyXG5cclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcbmNvbnN0IHNlbmQgPSByZXF1aXJlKCdib3QnKS5zZW5kO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcblxyXG5cclxuXHJcbi8vIFRPRE86IFBhcnNlIHRoZXNlIGFuZCBwcm92aWRlIG9wdGlvbnMgdG8gc2hvdy9oaWRlIGRpZmZlcmVudCBvbmVzLlxyXG5ob29rLm9uKCd3b3JsZC5vdGhlcicsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgIHNlbGYud3JpdGUobWVzc2FnZSwgdW5kZWZpbmVkLCAnb3RoZXInKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5tZXNzYWdlJywgZnVuY3Rpb24obmFtZSwgbWVzc2FnZSkge1xyXG4gICAgbGV0IG1zZ0NsYXNzID0gJ3BsYXllcic7XHJcbiAgICBpZiAod29ybGQuaXNTdGFmZihuYW1lKSkge1xyXG4gICAgICAgIG1zZ0NsYXNzID0gJ3N0YWZmJztcclxuICAgICAgICBpZiAod29ybGQuaXNNb2QobmFtZSkpIHtcclxuICAgICAgICAgICAgbXNnQ2xhc3MgKz0gJyBtb2QnO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vSGFzIHRvIGJlIGFkbWluXHJcbiAgICAgICAgICAgIG1zZ0NsYXNzICs9ICcgYWRtaW4nO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIG1zZ0NsYXNzICs9ICcgY29tbWFuZCc7XHJcbiAgICB9XHJcbiAgICBzZWxmLndyaXRlKG1lc3NhZ2UsIG5hbWUsIG1zZ0NsYXNzKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5zZXJ2ZXJjaGF0JywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgc2VsZi53cml0ZShtZXNzYWdlLCAnU0VSVkVSJywgJ2FkbWluJyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQuc2VuZCcsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIHNlbGYud3JpdGUobWVzc2FnZSwgJ1NFUlZFUicsICdhZG1pbiBjb21tYW5kJyk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy9NZXNzYWdlIGhhbmRsZXJzXHJcbmhvb2sub24oJ3dvcmxkLmpvaW4nLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJKb2luKG5hbWUsIGlwKSB7XHJcbiAgICBzZWxmLndyaXRlKGAke25hbWV9ICgke2lwfSkgaGFzIGpvaW5lZCB0aGUgc2VydmVyYCwgJ1NFUlZFUicsICdqb2luIHdvcmxkIGFkbWluJyk7XHJcbn0pO1xyXG5cclxuaG9vay5vbignd29ybGQubGVhdmUnLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJMZWF2ZShuYW1lKSB7XHJcbiAgICBzZWxmLndyaXRlKGAke25hbWV9IGhhcyBsZWZ0IHRoZSBzZXJ2ZXJgLCAnU0VSVkVSJywgYGxlYXZlIHdvcmxkIGFkbWluYCk7XHJcbn0pO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0NvbnNvbGUnKTtcclxuLy8gT3JkZXIgaXMgaW1wb3J0YW50IGhlcmUuXHJcblxyXG50YWIuaW5uZXJIVE1MID0gJzxzdHlsZT4nICtcclxuICAgIFwiI21iX2NvbnNvbGUgLmNoYXR7aGVpZ2h0OmNhbGMoMTAwdmggLSAyMjBweCl9QG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNjY4cHgpeyNtYl9jb25zb2xlIC5jaGF0e2hlaWdodDpjYWxjKDEwMHZoIC0gMTU1cHgpfX0jbWJfY29uc29sZSB1bHtoZWlnaHQ6MTAwJTtvdmVyZmxvdy15OmF1dG87bWFyZ2luOjA7cGFkZGluZzowfSNtYl9jb25zb2xlIGxpe2xpc3Qtc3R5bGUtdHlwZTpub25lfSNtYl9jb25zb2xlIC5jb250cm9sc3tkaXNwbGF5OmZsZXg7cGFkZGluZzowIDEwcHh9I21iX2NvbnNvbGUgaW5wdXQsI21iX2NvbnNvbGUgYnV0dG9ue21hcmdpbjo1cHggMH0jbWJfY29uc29sZSBpbnB1dHtmb250LXNpemU6MWVtO3BhZGRpbmc6MXB4O2ZsZXg6MTtib3JkZXI6c29saWQgMXB4ICM5OTl9I21iX2NvbnNvbGUgYnV0dG9ue2JhY2tncm91bmQ6IzE4MmI3Mztmb250LXdlaWdodDpib2xkO2NvbG9yOiNmZmY7Ym9yZGVyOjA7aGVpZ2h0OjQwcHg7cGFkZGluZzoxcHggNHB4fSNtYl9jb25zb2xlIC5tb2Q+c3BhbjpmaXJzdC1jaGlsZHtjb2xvcjojMDVmNTI5fSNtYl9jb25zb2xlIC5hZG1pbj5zcGFuOmZpcnN0LWNoaWxke2NvbG9yOiMyYjI2YmR9XFxuXCIgK1xyXG4gICAgJzwvc3R5bGU+JyArXHJcbiAgICBcIjxkaXYgaWQ9XFxcIm1iX2NvbnNvbGVcXFwiPlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjaGF0XFxcIj5cXHJcXG4gICAgICAgIDx1bD48L3VsPlxcclxcbiAgICA8L2Rpdj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiY29udHJvbHNcXFwiPlxcclxcbiAgICAgICAgPGlucHV0IHR5cGU9XFxcInRleHRcXFwiLz48YnV0dG9uPlNFTkQ8L2J1dHRvbj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5cclxuLy8gQXV0byBzY3JvbGwgd2hlbiBuZXcgbWVzc2FnZXMgYXJlIGFkZGVkIHRvIHRoZSBwYWdlLCB1bmxlc3MgdGhlIG93bmVyIGlzIHJlYWRpbmcgb2xkIGNoYXQuXHJcbihuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiBzaG93TmV3Q2hhdCgpIHtcclxuICAgIGxldCBjb250YWluZXIgPSB0YWIucXVlcnlTZWxlY3RvcigndWwnKTtcclxuICAgIGxldCBsYXN0TGluZSA9IHRhYi5xdWVyeVNlbGVjdG9yKCdsaTpsYXN0LWNoaWxkJyk7XHJcblxyXG4gICAgaWYgKCFjb250YWluZXIgfHwgIWxhc3RMaW5lKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjb250YWluZXIuc2Nyb2xsSGVpZ2h0IC0gY29udGFpbmVyLmNsaWVudEhlaWdodCAtIGNvbnRhaW5lci5zY3JvbGxUb3AgPD0gbGFzdExpbmUuY2xpZW50SGVpZ2h0ICogMikge1xyXG4gICAgICAgIGxhc3RMaW5lLnNjcm9sbEludG9WaWV3KGZhbHNlKTtcclxuICAgIH1cclxufSkpLm9ic2VydmUodGFiLnF1ZXJ5U2VsZWN0b3IoJy5jaGF0JyksIHtjaGlsZExpc3Q6IHRydWV9KTtcclxuXHJcblxyXG4vLyBSZW1vdmUgb2xkIGNoYXQgdG8gcmVkdWNlIG1lbW9yeSB1c2FnZVxyXG4obmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gcmVtb3ZlT2xkQ2hhdCgpIHtcclxuICAgIHZhciBjaGF0ID0gdGFiLnF1ZXJ5U2VsZWN0b3IoJ3VsJyk7XHJcblxyXG4gICAgd2hpbGUgKGNoYXQuY2hpbGRyZW4ubGVuZ3RoID4gNTAwKSB7XHJcbiAgICAgICAgY2hhdC5jaGlsZHJlblswXS5yZW1vdmUoKTtcclxuICAgIH1cclxufSkpLm9ic2VydmUodGFiLnF1ZXJ5U2VsZWN0b3IoJy5jaGF0JyksIHtjaGlsZExpc3Q6IHRydWV9KTtcclxuXHJcbi8vIExpc3RlbiBmb3IgdGhlIHVzZXIgdG8gc2VuZCBtZXNzYWdlc1xyXG5mdW5jdGlvbiB1c2VyU2VuZCgpIHtcclxuICAgIHZhciBpbnB1dCA9IHRhYi5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xyXG4gICAgaG9vay5maXJlKCdjb25zb2xlLnNlbmQnLCBpbnB1dC52YWx1ZSk7XHJcbiAgICBzZW5kKGlucHV0LnZhbHVlKTtcclxuICAgIGlucHV0LnZhbHVlID0gJyc7XHJcbiAgICBpbnB1dC5mb2N1cygpO1xyXG59XHJcblxyXG50YWIucXVlcnlTZWxlY3RvcignaW5wdXQnKS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgIGlmIChldmVudC5rZXkgPT0gXCJFbnRlclwiIHx8IGV2ZW50LmtleUNvZGUgPT0gMTMpIHtcclxuICAgICAgICB1c2VyU2VuZCgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbnRhYi5xdWVyeVNlbGVjdG9yKCdidXR0b24nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHVzZXJTZW5kKTtcclxuIiwiY29uc3QgYmhmYW5zYXBpID0gcmVxdWlyZSgnbGlicmFyaWVzL2JoZmFuc2FwaScpO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBNZXNzYWdlQm90RXh0ZW5zaW9uID0gcmVxdWlyZSgnTWVzc2FnZUJvdEV4dGVuc2lvbicpO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0V4dGVuc2lvbnMnKTtcclxudGFiLmlubmVySFRNTCA9ICc8c3R5bGU+JyArXHJcbiAgICBcIiNtYl9leHRlbnNpb25zIC50b3AtcmlnaHQtYnV0dG9ue3dpZHRoOmluaGVyaXQ7cGFkZGluZzowIDdweH0jbWJfZXh0ZW5zaW9ucyBoM3ttYXJnaW46MCAwIDVweCAwfSNleHRze2Rpc3BsYXk6ZmxleDtmbGV4LWZsb3c6cm93IHdyYXA7Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMH0jZXh0cyBoNCwjZXh0cyBwe21hcmdpbjowfSNleHRzIGJ1dHRvbntwb3NpdGlvbjphYnNvbHV0ZTtib3R0b206N3B4O3BhZGRpbmc6NHB4IDhweDtib3JkZXItcmFkaXVzOjhweDtiYWNrZ3JvdW5kOiNmZmZ9I2V4dHM+ZGl2e3Bvc2l0aW9uOnJlbGF0aXZlO2hlaWdodDoxMzBweDt3aWR0aDpjYWxjKDMzJSAtIDE5cHgpO21pbi13aWR0aDoyODBweDtwYWRkaW5nOjVweDttYXJnaW4tbGVmdDo1cHg7bWFyZ2luLWJvdHRvbTo1cHg7Ym9yZGVyOjNweCBzb2xpZCAjOTk5O2JvcmRlci1yYWRpdXM6MTBweH0jZXh0cz5kaXY6bnRoLWNoaWxkKG9kZCl7YmFja2dyb3VuZDojY2NjfVxcblwiICtcclxuICAgICc8L3N0eWxlPicgK1xyXG4gICAgXCI8dGVtcGxhdGUgaWQ9XFxcImV4dFRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdj5cXHJcXG4gICAgICAgIDxoND5UaXRsZTwvaDQ+XFxyXFxuICAgICAgICA8c3Bhbj5EZXNjcmlwdGlvbjwvc3Bhbj48YnI+XFxyXFxuICAgICAgICA8YnV0dG9uIGNsYXNzPVxcXCJidXR0b25cXFwiPkluc3RhbGw8L2J1dHRvbj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9leHRlbnNpb25zXFxcIiBkYXRhLXRhYi1uYW1lPVxcXCJleHRlbnNpb25zXFxcIj5cXHJcXG4gICAgPGgzPkV4dGVuc2lvbnMgY2FuIGluY3JlYXNlIHRoZSBmdW5jdGlvbmFsaXR5IG9mIHRoZSBib3QuPC9oMz5cXHJcXG4gICAgPHNwYW4+SW50ZXJlc3RlZCBpbiBjcmVhdGluZyBvbmU/IDxhIGhyZWY9XFxcImh0dHBzOi8vZ2l0aHViLmNvbS9CaWJsaW9maWxlL0Jsb2NraGVhZHMtTWVzc2FnZUJvdC93aWtpLzIuLURldmVsb3BtZW50Oi1TdGFydC1IZXJlXFxcIiB0YXJnZXQ9XFxcIl9ibGFua1xcXCI+U3RhcnQgaGVyZS48L2E+PC9zcGFuPlxcclxcbiAgICA8c3BhbiBjbGFzcz1cXFwidG9wLXJpZ2h0LWJ1dHRvblxcXCI+TG9hZCBCeSBJRC9VUkw8L3NwYW4+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImV4dHNcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxuLy9DcmVhdGUgdGhlIGV4dGVuc2lvbiBzdG9yZSBwYWdlXHJcbmJoZmFuc2FwaS5nZXRTdG9yZSgpLnRoZW4ocmVzcCA9PiB7XHJcbiAgICBpZiAocmVzcC5zdGF0dXMgIT0gJ29rJykge1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdleHRzJykuaW5uZXJIVE1MICs9IHJlc3AubWVzc2FnZTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IocmVzcC5tZXNzYWdlKTtcclxuICAgIH1cclxuICAgIHJlc3AuZXh0ZW5zaW9ucy5mb3JFYWNoKGV4dGVuc2lvbiA9PiB7XHJcbiAgICAgICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjZXh0VGVtcGxhdGUnLCAnI2V4dHMnLCBbXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ2g0JywgdGV4dDogZXh0ZW5zaW9uLnRpdGxlfSxcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnc3BhbicsIGh0bWw6IGV4dGVuc2lvbi5zbmlwcGV0fSxcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnZGl2JywgJ2RhdGEtaWQnOiBleHRlbnNpb24uaWR9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdidXR0b24nLCB0ZXh0OiBNZXNzYWdlQm90RXh0ZW5zaW9uLmlzTG9hZGVkKGV4dGVuc2lvbi5pZCkgPyAnUmVtb3ZlJyA6ICdJbnN0YWxsJ31cclxuICAgICAgICBdKTtcclxuICAgIH0pO1xyXG59KS5jYXRjaChiaGZhbnNhcGkucmVwb3J0RXJyb3IpO1xyXG5cclxuLy8gSW5zdGFsbCAvIHVuaW5zdGFsbCBleHRlbnNpb25zXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNleHRzJylcclxuICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGV4dEFjdGlvbnMoZSkge1xyXG4gICAgICAgIGlmIChlLnRhcmdldC50YWdOYW1lICE9ICdCVVRUT04nKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGVsID0gZS50YXJnZXQ7XHJcbiAgICAgICAgdmFyIGlkID0gZWwucGFyZW50RWxlbWVudC5kYXRhc2V0LmlkO1xyXG5cclxuICAgICAgICBpZiAoZWwudGV4dENvbnRlbnQgPT0gJ0luc3RhbGwnKSB7XHJcbiAgICAgICAgICAgIE1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbChpZCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgTWVzc2FnZUJvdEV4dGVuc2lvbi51bmluc3RhbGwoaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuXHJcbmhvb2sub24oJ2V4dGVuc2lvbi5pbnN0YWxsJywgZnVuY3Rpb24oaWQpIHtcclxuICAgIC8vIFNob3cgcmVtb3ZlIHRvIGxldCB1c2VycyByZW1vdmUgZXh0ZW5zaW9uc1xyXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNtYl9leHRlbnNpb25zIFtkYXRhLWlkPVwiJHtpZH1cIl0gYnV0dG9uYCk7XHJcbiAgICBpZiAoYnV0dG9uKSB7XHJcbiAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gJ1JlbW92ZSc7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuaG9vay5vbignZXh0ZW5zaW9uLnVuaW5zdGFsbCcsIGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAvLyBTaG93IHJlbW92ZWQgZm9yIHN0b3JlIGluc3RhbGwgYnV0dG9uXHJcbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI21iX2V4dGVuc2lvbnMgW2RhdGEtaWQ9XCIke2lkfVwiXSBidXR0b25gKTtcclxuICAgIGlmIChidXR0b24pIHtcclxuICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnUmVtb3ZlZCc7XHJcbiAgICAgICAgYnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gJ0luc3RhbGwnO1xyXG4gICAgICAgICAgICBidXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICB9LCAzMDAwKTtcclxuICAgIH1cclxufSk7XHJcbiIsIi8vVE9ETzogVXNlIGZldGNoXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBHRVQgYSBwYWdlLiBQYXNzZXMgdGhlIHJlc3BvbnNlIG9mIHRoZSBYSFIgaW4gdGhlIHJlc29sdmUgcHJvbWlzZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogLy9zZW5kcyBhIEdFVCByZXF1ZXN0IHRvIC9zb21lL3VybC5waHA/YT10ZXN0XHJcbiAqIGdldCgnL3NvbWUvdXJsLnBocCcsIHthOiAndGVzdCd9KS50aGVuKGNvbnNvbGUubG9nKVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNTdHJcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldCh1cmwgPSAnLycsIHBhcmFtcyA9IHt9KSB7XHJcbiAgICBpZiAoT2JqZWN0LmtleXMocGFyYW1zKS5sZW5ndGgpIHtcclxuICAgICAgICB2YXIgYWRkaXRpb24gPSB1cmxTdHJpbmdpZnkocGFyYW1zKTtcclxuICAgICAgICBpZiAodXJsLmluY2x1ZGVzKCc/JykpIHtcclxuICAgICAgICAgICAgdXJsICs9IGAmJHthZGRpdGlvbn1gO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHVybCArPSBgPyR7YWRkaXRpb259YDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHhocignR0VUJywgdXJsLCB7fSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhIEpTT04gb2JqZWN0IGluIHRoZSBwcm9taXNlIHJlc29sdmUgbWV0aG9kLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbU9ialxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0SlNPTih1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiBnZXQodXJsLCBwYXJhbU9iaikudGhlbihKU09OLnBhcnNlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBtYWtlIGEgcG9zdCByZXF1ZXN0XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtT2JqXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBwb3N0KHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIHhocignUE9TVCcsIHVybCwgcGFyYW1PYmopO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGZldGNoIEpTT04gZnJvbSBhIHBhZ2UgdGhyb3VnaCBwb3N0LlxyXG4gKlxyXG4gKiBAcGFyYW0gc3RyaW5nIHVybFxyXG4gKiBAcGFyYW0gc3RyaW5nIHBhcmFtT2JqXHJcbiAqIEByZXR1cm4gUHJvbWlzZVxyXG4gKi9cclxuZnVuY3Rpb24gcG9zdEpTT04odXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4gcG9zdCh1cmwsIHBhcmFtT2JqKS50aGVuKEpTT04ucGFyc2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiogSGVscGVyIGZ1bmN0aW9uIHRvIG1ha2UgWEhSIHJlcXVlc3RzLCBpZiBwb3NzaWJsZSB1c2UgdGhlIGdldCBhbmQgcG9zdCBmdW5jdGlvbnMgaW5zdGVhZC5cclxuKlxyXG4qIEBkZXByaWNhdGVkIHNpbmNlIHZlcnNpb24gNi4xXHJcbiogQHBhcmFtIHN0cmluZyBwcm90b2NvbFxyXG4qIEBwYXJhbSBzdHJpbmcgdXJsXHJcbiogQHBhcmFtIG9iamVjdCBwYXJhbU9iaiAtLSBXQVJOSU5HLiBPbmx5IGFjY2VwdHMgc2hhbGxvdyBvYmplY3RzLlxyXG4qIEByZXR1cm4gUHJvbWlzZVxyXG4qL1xyXG5mdW5jdGlvbiB4aHIocHJvdG9jb2wsIHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgdmFyIHBhcmFtU3RyID0gdXJsU3RyaW5naWZ5KHBhcmFtT2JqKTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICB2YXIgcmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgcmVxLm9wZW4ocHJvdG9jb2wsIHVybCk7XHJcbiAgICAgICAgcmVxLnNldFJlcXVlc3RIZWFkZXIoJ1gtUmVxdWVzdGVkLVdpdGgnLCAnWE1MSHR0cFJlcXVlc3QnKTtcclxuICAgICAgICBpZiAocHJvdG9jb2wgPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICAgIHJlcS5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXEub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09IDIwMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXEuc3RhdHVzVGV4dCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvLyBIYW5kbGUgbmV0d29yayBlcnJvcnNcclxuICAgICAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZWplY3QoRXJyb3IoXCJOZXR3b3JrIEVycm9yXCIpKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChwYXJhbVN0cikge1xyXG4gICAgICAgICAgICByZXEuc2VuZChwYXJhbVN0cik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVxLnNlbmQoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIHN0cmluZ2lmeSB1cmwgcGFyYW1ldGVyc1xyXG4gKi9cclxuZnVuY3Rpb24gdXJsU3RyaW5naWZ5KG9iaikge1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iailcclxuICAgIC5tYXAoayA9PiBgJHtlbmNvZGVVUklDb21wb25lbnQoayl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KG9ialtrXSl9YClcclxuICAgIC5qb2luKCcmJyk7XHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHt4aHIsIGdldCwgZ2V0SlNPTiwgcG9zdCwgcG9zdEpTT059O1xyXG4iLCIvKipcclxuICogQGZpbGUgQ29udGFpbnMgZnVuY3Rpb25zIHRvIGludGVyYWN0IHdpdGggYmxvY2toZWFkc2ZhbnMuY29tIC0gY2Fubm90IGJlIHVzZWQgYnkgZXh0ZW5zaW9ucy5cclxuICovXHJcblxyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgYWpheCA9IHJlcXVpcmUoJ2xpYnJhcmllcy9hamF4Jyk7XHJcblxyXG5jb25zdCBBUElfVVJMUyA9IHtcclxuICAgIFNUT1JFOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9leHRlbnNpb24vc3RvcmUnLFxyXG4gICAgTkFNRTogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvZXh0ZW5zaW9uL25hbWUnLFxyXG4gICAgRVJST1I6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2JvdC9lcnJvcicsXHJcbn07XHJcblxyXG52YXIgY2FjaGUgPSB7XHJcbiAgICBuYW1lczogbmV3IE1hcCgpLFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVzZWQgdG8gZ2V0IHB1YmxpYyBleHRlbnNpb25zXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldFN0b3JlKCkudGhlbihzdG9yZSA9PiBjb25zb2xlLmxvZyhzdG9yZSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byB1c2UgdGhlIGNhY2hlZCByZXNwb25zZSBzaG91bGQgYmUgY2xlYXJlZC5cclxuICogQHJldHVybiB7UHJvbWlzZX0gcmVzb2x2ZXMgd2l0aCB0aGUgcmVzcG9uc2VcclxuICovXHJcbmZ1bmN0aW9uIGdldFN0b3JlKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldFN0b3JlKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0U3RvcmUgPSBhamF4LmdldEpTT04oQVBJX1VSTFMuU1RPUkUpXHJcbiAgICAgICAgICAgIC50aGVuKHN0b3JlID0+IHtcclxuICAgICAgICAgICAgICAgIC8vQnVpbGQgdGhlIGluaXRpYWwgbmFtZXMgbWFwXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RvcmUuc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZXggb2Ygc3RvcmUuZXh0ZW5zaW9ucykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhY2hlLm5hbWVzLnNldChleC5pZCwgZXgudGl0bGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0U3RvcmU7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbmFtZSBvZiB0aGUgcHJvdmlkZWQgZXh0ZW5zaW9uIElELlxyXG4gKiBJZiB0aGUgZXh0ZW5zaW9uIHdhcyBub3QgZm91bmQsIHJlc29sdmVzIHdpdGggdGhlIG9yaWdpbmFsIHBhc3NlZCBJRC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0RXh0ZW5zaW9uTmFtZSgndGVzdCcpLnRoZW4obmFtZSA9PiBjb25zb2xlLmxvZyhuYW1lKSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCB0aGUgaWQgdG8gc2VhcmNoIGZvci5cclxuICogQHJldHVybiB7UHJvbWlzZX0gcmVzb2x2ZXMgd2l0aCB0aGUgZXh0ZW5zaW9uIG5hbWUuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRFeHRlbnNpb25OYW1lKGlkKSB7XHJcbiAgICBpZiAoY2FjaGUubmFtZXMuaGFzKGlkKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGUubmFtZXMuZ2V0KGlkKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFqYXgucG9zdEpTT04oQVBJX1VSTFMuTkFNRSwge2lkfSkudGhlbihuYW1lID0+IHtcclxuICAgICAgICBjYWNoZS5uYW1lcy5zZXQoaWQsIG5hbWUpO1xyXG4gICAgICAgIHJldHVybiBuYW1lO1xyXG4gICAgfSwgZXJyID0+IHtcclxuICAgICAgICByZXBvcnRFcnJvcihlcnIpO1xyXG4gICAgICAgIHJldHVybiBpZDtcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlcG9ydHMgYW4gZXJyb3Igc28gdGhhdCBpdCBjYW4gYmUgcmV2aWV3ZWQgYW5kIGZpeGVkIGJ5IGV4dGVuc2lvbiBvciBib3QgZGV2ZWxvcGVycy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogcmVwb3J0RXJyb3IoRXJyb3IoXCJSZXBvcnQgbWVcIikpO1xyXG4gKiBAcGFyYW0ge0Vycm9yfSBlcnIgdGhlIGVycm9yIHRvIHJlcG9ydFxyXG4gKi9cclxuZnVuY3Rpb24gcmVwb3J0RXJyb3IoZXJyKSB7XHJcbiAgICBhamF4LnBvc3RKU09OKEFQSV9VUkxTLkVSUk9SLCB7XHJcbiAgICAgICAgICAgIGVycm9yX3RleHQ6IGVyci5tZXNzYWdlLFxyXG4gICAgICAgICAgICBlcnJvcl9maWxlOiBlcnIuZmlsZW5hbWUsXHJcbiAgICAgICAgICAgIGVycm9yX3JvdzogZXJyLmxpbmVubyB8fCAwLFxyXG4gICAgICAgICAgICBlcnJvcl9jb2x1bW46IGVyci5jb2xubyB8fCAwLFxyXG4gICAgICAgICAgICBlcnJvcl9zdGFjazogZXJyLnN0YWNrIHx8ICcnLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oKHJlc3ApID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlc3Auc3RhdHVzID09ICdvaycpIHtcclxuICAgICAgICAgICAgICAgIGhvb2suZmlyZSgnZXJyb3JfcmVwb3J0JywgJ1NvbWV0aGluZyB3ZW50IHdyb25nLCBpdCBoYXMgYmVlbiByZXBvcnRlZC4nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGhvb2suZmlyZSgnZXJyb3JfcmVwb3J0JywgYEVycm9yIHJlcG9ydGluZyBleGNlcHRpb246ICR7cmVzcC5tZXNzYWdlfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcik7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZ2V0U3RvcmUsXHJcbiAgICBnZXRFeHRlbnNpb25OYW1lLFxyXG4gICAgcmVwb3J0RXJyb3IsXHJcbn07XHJcbiIsInZhciBhamF4ID0gcmVxdWlyZSgnLi9hamF4Jyk7XHJcbnZhciBob29rID0gcmVxdWlyZSgnLi9ob29rJyk7XHJcbnZhciBiaGZhbnNhcGkgPSByZXF1aXJlKCcuL2JoZmFuc2FwaScpO1xyXG5cclxuY29uc3Qgd29ybGRJZCA9IHdpbmRvdy53b3JsZElkO1xyXG52YXIgY2FjaGUgPSB7XHJcbiAgICBmaXJzdElkOiAwLFxyXG59O1xyXG5cclxuLy8gVXNlZCB0byBwYXJzZSBtZXNzYWdlcyBtb3JlIGFjY3VyYXRlbHlcclxudmFyIHdvcmxkID0ge1xyXG4gICAgbmFtZTogJycsXHJcbiAgICBvbmxpbmU6IFtdXHJcbn07XHJcbmdldE9ubGluZVBsYXllcnMoKVxyXG4gICAgLnRoZW4ocGxheWVycyA9PiB3b3JsZC5wbGF5ZXJzID0gWy4uLm5ldyBTZXQocGxheWVycy5jb25jYXQod29ybGQucGxheWVycykpXSk7XHJcblxyXG5nZXRXb3JsZE5hbWUoKVxyXG4gICAgLnRoZW4obmFtZSA9PiB3b3JsZC5uYW1lID0gbmFtZSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB3b3JsZFN0YXJ0ZWQsXHJcbiAgICBnZXRMb2dzLFxyXG4gICAgZ2V0TGlzdHMsXHJcbiAgICBnZXRIb21lcGFnZSxcclxuICAgIGdldE9ubGluZVBsYXllcnMsXHJcbiAgICBnZXRPd25lck5hbWUsXHJcbiAgICBnZXRXb3JsZE5hbWUsXHJcbiAgICBzZW5kLFxyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyBhZnRlciBzdGFydGluZyB0aGUgd29ybGQgaWYgbmVjY2Vzc2FyeSwgcmVqZWN0cyBpZiB0aGUgd29ybGQgdGFrZXMgdG9vIGxvbmcgdG8gc3RhcnQgb3IgaXMgdW5hdmFpbGlibGVcclxuICogUmVmYWN0b3Jpbmcgd2VsY29tZS4gVGhpcyBzZWVtcyBvdmVybHkgcHlyYW1pZCBsaWtlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB3b3JsZFN0YXJ0ZWQoKS50aGVuKCgpID0+IGNvbnNvbGUubG9nKCdzdGFydGVkIScpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVjaGVjayBpZiB0aGUgd29ybGQgaXMgc3RhcnRlZC5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHdvcmxkU3RhcnRlZChyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS53b3JsZFN0YXJ0ZWQpIHtcclxuICAgICAgICBjYWNoZS53b3JsZFN0YXJ0ZWQgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHZhciBmYWlscyA9IDA7XHJcbiAgICAgICAgICAgIChmdW5jdGlvbiBjaGVjaygpIHtcclxuICAgICAgICAgICAgICAgIC8vIENvdWxkIHRoaXMgYmUgbW9yZSBzaW1wbGlmaWVkP1xyXG4gICAgICAgICAgICAgICAgYWpheC5wb3N0SlNPTignL2FwaScsIHsgY29tbWFuZDogJ3N0YXR1cycsIHdvcmxkSWQgfSkudGhlbihyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChyZXNwb25zZS53b3JsZFN0YXR1cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdvbmxpbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnb2ZmbGluZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhamF4LnBvc3RKU09OKCcvYXBpJywgeyBjb21tYW5kOiAnc3RhcnQnLCB3b3JsZElkIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oY2hlY2ssIGNoZWNrKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd1bmF2YWlsaWJsZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignV29ybGQgdW5hdmFpbGlibGUuJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzdGFydHVwJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc2h1dGRvd24nOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChjaGVjaywgMzAwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKytmYWlscyA+IDEwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoJ1dvcmxkIHRvb2sgdG9vIGxvbmcgdG8gc3RhcnQuJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignVW5rbm93biByZXNwb25zZS4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKTtcclxuICAgICAgICAgICAgfSgpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUud29ybGRTdGFydGVkO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgdGhlIGxvZydzIGxpbmVzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMb2dzKCkudGhlbihsaW5lcyA9PiBjb25zb2xlLmxvZyhsaW5lc1swXSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWRvd25sb2FkIHRoZSBsb2dzXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMb2dzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldExvZ3MpIHtcclxuICAgICAgICBjYWNoZS5nZXRMb2dzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbG9ncy8ke3dvcmxkSWR9YCkpXHJcbiAgICAgICAgICAgIC50aGVuKGxvZyA9PiBsb2cuc3BsaXQoJ1xcbicpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0TG9ncztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIGEgbGlzdCBvZiBhZG1pbnMsIG1vZHMsIHN0YWZmIChhZG1pbnMgKyBtb2RzKSwgd2hpdGVsaXN0LCBhbmQgYmxhY2tsaXN0LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMaXN0cygpLnRoZW4obGlzdHMgPT4gY29uc29sZS5sb2cobGlzdHMuYWRtaW4pKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmZXRjaCB0aGUgbGlzdHMuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMaXN0cyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRMaXN0cykge1xyXG4gICAgICAgIGNhY2hlLmdldExpc3RzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbGlzdHMvJHt3b3JsZElkfWApKVxyXG4gICAgICAgICAgICAudGhlbihodG1sID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldExpc3QobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gZG9jLnF1ZXJ5U2VsZWN0b3IoYHRleHRhcmVhW25hbWU9JHtuYW1lfV1gKVxyXG4gICAgICAgICAgICAgICAgICAgIC52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIC50b0xvY2FsZVVwcGVyQ2FzZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCdcXG4nKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWy4uLm5ldyBTZXQobGlzdCldOyAvL1JlbW92ZSBkdXBsaWNhdGVzXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGxpc3RzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFkbWluOiBnZXRMaXN0KCdhZG1pbnMnKSxcclxuICAgICAgICAgICAgICAgICAgICBtb2Q6IGdldExpc3QoJ21vZGxpc3QnKSxcclxuICAgICAgICAgICAgICAgICAgICB3aGl0ZTogZ2V0TGlzdCgnd2hpdGVsaXN0JyksXHJcbiAgICAgICAgICAgICAgICAgICAgYmxhY2s6IGdldExpc3QoJ2JsYWNrbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGxpc3RzLm1vZCA9IGxpc3RzLm1vZC5maWx0ZXIobmFtZSA9PiAhbGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgbGlzdHMuc3RhZmYgPSBsaXN0cy5hZG1pbi5jb25jYXQobGlzdHMubW9kKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdHM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRMaXN0cztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSBob21lcGFnZSBvZiB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiBjb25zb2xlLmxvZyhodG1sLnN1YnN0cmluZygwLCAxMDApKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZmV0Y2ggdGhlIHBhZ2UuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRIb21lcGFnZShyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRIb21lcGFnZSkge1xyXG4gICAgICAgIGNhY2hlLmdldEhvbWVwYWdlID0gYWpheC5nZXQoYC93b3JsZHMvJHt3b3JsZElkfWApXHJcbiAgICAgICAgICAgIC5jYXRjaCgoKSA9PiBnZXRIb21lcGFnZSh0cnVlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldEhvbWVwYWdlO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgcGxheWVyIG5hbWVzLlxyXG4gKiBBbiBvbmxpbmUgbGlzdCBpcyBtYWludGFpbmVkIGJ5IHRoZSBib3QsIHRoaXMgc2hvdWxkIGdlbmVyYWxseSBub3QgYmUgdXNlZC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T25saW5lUGxheWVycygpLnRoZW4ob25saW5lID0+IHsgZm9yIChsZXQgbiBvZiBvbmxpbmUpIHsgY29uc29sZS5sb2cobiwgJ2lzIG9ubGluZSEnKX19KTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmcmVzaCB0aGUgb25saW5lIG5hbWVzLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T25saW5lUGxheWVycyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0T25saW5lUGxheWVycyA9IGdldEhvbWVwYWdlKHRydWUpXHJcbiAgICAgICAgICAgIC50aGVuKChodG1sKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJFbGVtcyA9IGRvYy5xdWVyeVNlbGVjdG9yKCcubWFuYWdlci5wYWRkZWQ6bnRoLWNoaWxkKDEpJylcclxuICAgICAgICAgICAgICAgICAgICAucXVlcnlTZWxlY3RvckFsbCgndHI6bm90KC5oaXN0b3J5KSA+IHRkLmxlZnQnKTtcclxuICAgICAgICAgICAgICAgIHZhciBwbGF5ZXJzID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgQXJyYXkuZnJvbShwbGF5ZXJFbGVtcykuZm9yRWFjaCgoZWwpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJzLnB1c2goZWwudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGxheWVycztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldE9ubGluZVBsYXllcnM7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgc2VydmVyIG93bmVyJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0T3duZXJOYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBpcyBvd25lZCBieScsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE93bmVyTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcuc3ViaGVhZGVyfnRyPnRkOm5vdChbY2xhc3NdKScpLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIHdvcmxkJ3MgbmFtZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0V29ybGROYW1lKCkudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKCdXb3JsZCBuYW1lOicsIG5hbWUpKTtcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldFdvcmxkTmFtZSgpIHtcclxuICAgIHJldHVybiBnZXRIb21lcGFnZSgpLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGRvYy5xdWVyeVNlbGVjdG9yKCcjdGl0bGUnKS50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZW5kcyBhIG1lc3NhZ2UsIHJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiBzZW50IG9yIHJlamVjdHMgb24gZmFpbHVyZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2VuZCgnaGVsbG8hJykudGhlbigoKSA9PiBjb25zb2xlLmxvZygnc2VudCcpKS5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gc2VuZC5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHNlbmQobWVzc2FnZSkge1xyXG4gICAgcmV0dXJuIGFqYXgucG9zdEpTT04oYC9hcGlgLCB7Y29tbWFuZDogJ3NlbmQnLCBtZXNzYWdlLCB3b3JsZElkfSlcclxuICAgICAgICAudGhlbihyZXNwID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlc3Auc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXNwO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4ocmVzcCA9PiB7XHJcbiAgICAgICAgICAgIC8vSGFuZGxlIGhvb2tzXHJcbiAgICAgICAgICAgIGhvb2suZmlyZSgnd29ybGQuc2VuZCcsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBob29rLmZpcmUoJ3dvcmxkLnNlcnZlcm1lc3NhZ2UnLCBtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgIC8vRGlzYWxsb3cgY29tbWFuZHMgc3RhcnRpbmcgd2l0aCBzcGFjZS5cclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpICYmICFtZXNzYWdlLnN0YXJ0c1dpdGgoJy8gJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFyZ3MgPSAnJztcclxuICAgICAgICAgICAgICAgIGlmIChjb21tYW5kLmluY2x1ZGVzKCcgJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBtZXNzYWdlLnN1YnN0cmluZyhtZXNzYWdlLmluZGV4T2YoJyAnKSArIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsICdTRVJWRVInLCBjb21tYW5kLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3A7XHJcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgaWYgKGVyciA9PSAnV29ybGQgbm90IHJ1bm5pbmcuJykge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuZmlyc3RJZCA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhyb3cgZXJyO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIHdhdGNoIGNoYXQuXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja0NoYXQoKSB7XHJcbiAgICBnZXRNZXNzYWdlcygpLnRoZW4oKG1zZ3MpID0+IHtcclxuICAgICAgICBtc2dzLmZvckVhY2goKG1lc3NhZ2UpID0+IHtcclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChgJHt3b3JsZC5uYW1lfSAtIFBsYXllciBDb25uZWN0ZWQgYCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBbLCBuYW1lLCBpcF0gPSBtZXNzYWdlLm1hdGNoKC8gLSBQbGF5ZXIgQ29ubmVjdGVkICguKikgXFx8IChbXFxkLl0rKSBcXHwgKFtcXHddezMyfSlcXHMqJC8pO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlSm9pbk1lc3NhZ2VzKG5hbWUsIGlwKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkLm5hbWV9IC0gUGxheWVyIERpc2Nvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBtZXNzYWdlLnN1YnN0cmluZyh3b3JsZC5uYW1lLmxlbmd0aCArIDIzKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJzogJykpIHtcclxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gZ2V0VXNlcm5hbWUobWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbXNnID0gbWVzc2FnZS5zdWJzdHJpbmcobmFtZS5sZW5ndGggKyAyKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtc2cpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGhhbmRsZU90aGVyTWVzc2FnZXMobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcilcclxuICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQ2hhdCwgNTAwMCk7XHJcbiAgICB9KTtcclxufVxyXG5jaGVja0NoYXQoKTtcclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2V0IHRoZSBsYXRlc3QgY2hhdCBtZXNzYWdlcy5cclxuICpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE1lc3NhZ2VzKCkge1xyXG4gICAgcmV0dXJuIHdvcmxkU3RhcnRlZCgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5wb3N0SlNPTihgL2FwaWAsIHsgY29tbWFuZDogJ2dldGNoYXQnLCB3b3JsZElkLCBmaXJzdElkOiBjYWNoZS5maXJzdElkIH0pKVxyXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT0gJ29rJyAmJiBkYXRhLm5leHRJZCAhPSBjYWNoZS5maXJzdElkKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5maXJzdElkID0gZGF0YS5uZXh0SWQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5sb2c7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5zdGF0dXMgPT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHdobyBzZW50IGEgbWVzc2FnZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIG5hbWUgPSBnZXRVc2VybmFtZSgnU0VSVkVSOiBIaSB0aGVyZSEnKTtcclxuICogLy9uYW1lID09ICdTRVJWRVInXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIHBhcnNlLlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBuYW1lIG9mIHRoZSB1c2VyIHdobyBzZW50IHRoZSBtZXNzYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0VXNlcm5hbWUobWVzc2FnZSkge1xyXG4gICAgZm9yIChsZXQgaSA9IDE4OyBpID4gNDsgaS0tKSB7XHJcbiAgICAgICAgbGV0IHBvc3NpYmxlTmFtZSA9IG1lc3NhZ2Uuc3Vic3RyaW5nKDAsIG1lc3NhZ2UubGFzdEluZGV4T2YoJzogJywgaSkpO1xyXG4gICAgICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMocG9zc2libGVOYW1lKSB8fCBwb3NzaWJsZU5hbWUgPT0gJ1NFUlZFUicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBvc3NpYmxlTmFtZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBTaG91bGQgaWRlYWxseSBuZXZlciBoYXBwZW4uXHJcbiAgICByZXR1cm4gbWVzc2FnZS5zdWJzdHJpbmcoMCwgbWVzc2FnZS5sYXN0SW5kZXhPZignOiAnLCAxOCkpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgam9pbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgam9pbmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IGlwIHRoZSBpcCBvZiB0aGUgcGxheWVyIGpvaW5pbmcuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVKb2luTWVzc2FnZXMobmFtZSwgaXApIHtcclxuICAgIGlmICghd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQuam9pbicsIG5hbWUsIGlwKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgZGlzY29ubmVjdGlvbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgbGVhdmluZy5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSkge1xyXG4gICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5zcGxpY2Uod29ybGQub25saW5lLmluZGV4T2YobmFtZSksIDEpO1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLmxlYXZlJywgbmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHVzZXIgY2hhdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdXNlci5cclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2Ugc2VudC5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICBpZiAobmFtZSA9PSAnU0VSVkVSJykge1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLnNlcnZlcmNoYXQnLCBtZXNzYWdlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQubWVzc2FnZScsIG5hbWUsIG1lc3NhZ2UpO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSAmJiAhbWVzc2FnZS5zdGFydHNXaXRoKCcvICcpKSB7XHJcblxyXG4gICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgIGxldCBhcmdzID0gJyc7XHJcbiAgICAgICAgaWYgKGNvbW1hbmQuaW5jbHVkZXMoJyAnKSkge1xyXG4gICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICBhcmdzID0gbWVzc2FnZS5zdWJzdHJpbmcobWVzc2FnZS5pbmRleE9mKCcgJykgKyAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsIG5hbWUsIGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgICAgIHJldHVybjsgLy9ub3QgY2hhdFxyXG4gICAgfVxyXG5cclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLmNoYXQnLCBuYW1lLCBtZXNzYWdlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIGhhbmRsZSBtZXNzYWdlcyB3aGljaCBhcmUgbm90IHNpbXBseSBwYXJzZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIGhhbmRsZVxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlT3RoZXJNZXNzYWdlcyhtZXNzYWdlKSB7XHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5vdGhlcicsIG1lc3NhZ2UpO1xyXG59XHJcbiIsInZhciBsaXN0ZW5lcnMgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGJlZ2luIGxpc3RlbmluZyB0byBhbiBldmVudC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogbGlzdGVuKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogLy9hbHRlcm5hdGl2ZWx5XHJcbiAqIG9uKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0aGUgZXZlbnQgaGFuZGxlclxyXG4gKi9cclxuZnVuY3Rpb24gbGlzdGVuKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIGxpc3RlbmVyc1trZXldID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XS5pbmNsdWRlcyhjYWxsYmFjaykpIHtcclxuICAgICAgICBsaXN0ZW5lcnNba2V5XS5wdXNoKGNhbGxiYWNrKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHN0b3AgbGlzdGVuaW5nIHRvIGFuIGV2ZW50LiBJZiB0aGUgbGlzdGVuZXIgd2FzIG5vdCBmb3VuZCwgbm8gYWN0aW9uIHdpbGwgYmUgdGFrZW4uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vRWFybGllciBhdHRhY2hlZCBteUZ1bmMgdG8gJ2V2ZW50J1xyXG4gKiByZW1vdmUoJ2V2ZW50JywgbXlGdW5jKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gc3RvcCBsaXN0ZW5pbmcgdG8uXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRoZSBjYWxsYmFjayB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQgbGlzdGVuZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKGxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgaWYgKGxpc3RlbmVyc1trZXldLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICBsaXN0ZW5lcnNba2V5XS5zcGxpY2UobGlzdGVuZXJzW2tleV0uaW5kZXhPZihjYWxsYmFjayksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNhbGwgZXZlbnRzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBjaGVjaygndGVzdCcsIDEsIDIsIDMpO1xyXG4gKiBjaGVjaygndGVzdCcsIHRydWUpO1xyXG4gKiAvLyBhbHRlcm5hdGl2ZWx5XHJcbiAqIGZpcmUoJ3Rlc3QnLCAxLCAyLCAzKTtcclxuICogZmlyZSgndGVzdCcsIHRydWUpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBjYWxsLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhcmd1bWVudHMgdG8gcGFzcyB0byBsaXN0ZW5pbmcgZnVuY3Rpb25zLlxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2soa2V5LCAuLi5hcmdzKSB7XHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGlzdGVuZXJzW2tleV0uZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lcikge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVyKC4uLmFyZ3MpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgdmFsdWUgYmFzZWQgb24gaW5wdXQgZnJvbSBsaXN0ZW5lcnMuXHJcbiAqXHJcbiAqIEBkZXByaWNhdGVkIHNpbmNlIDYuMS4wLiBJbnN0ZWFkLCB1cGRhdGUgcmVxdWVzdHMgc2hvdWxkIGJlIGhhbmRsZWQgYnkgdGhlIGV4dGVuc2lvbiBpdGVzZWxmLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1cGRhdGUoJ2V2ZW50JywgdHJ1ZSwgMSwgMiwgMyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGNhbGxcclxuICogQHBhcmFtIHttaXhlZH0gaW5pdGlhbCB0aGUgaW5pdGlhbCB2YWx1ZSB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIHVwZGF0ZShrZXksIGluaXRpYWwsIC4uLmFyZ3MpIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIHJldHVybiBpbml0aWFsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsaXN0ZW5lcnNba2V5XS5yZWR1Y2UoZnVuY3Rpb24ocHJldmlvdXMsIGN1cnJlbnQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gY3VycmVudChwcmV2aW91cywgLi4uYXJncyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91cztcclxuICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcHJldmlvdXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgaW5pdGlhbCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbGlzdGVuLFxyXG4gICAgb246IGxpc3RlbixcclxuICAgIHJlbW92ZSxcclxuICAgIGNoZWNrLFxyXG4gICAgZmlyZTogY2hlY2ssXHJcbiAgICB1cGRhdGUsXHJcbn07XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZ2V0U3RyaW5nLFxyXG4gICAgZ2V0T2JqZWN0LFxyXG4gICAgc2V0LFxyXG4gICAgY2xlYXJOYW1lc3BhY2UsXHJcbn07XHJcblxyXG4vL1JFVklFVzogSXMgdGhlcmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/IHJlcXVpcmUoJy4vY29uZmlnJykgbWF5YmU/XHJcbmNvbnN0IE5BTUVTUEFDRSA9IHdpbmRvdy53b3JsZElkO1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdHJpbmcgZnJvbSB0aGUgc3RvcmFnZSBpZiBpdCBleGlzdHMgYW5kIHJldHVybnMgaXQsIG90aGVyd2lzZSByZXR1cm5zIGZhbGxiYWNrLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgeCA9IGdldFN0cmluZygnc3RvcmVkX3ByZWZzJywgJ25vdGhpbmcnKTtcclxuICogdmFyIHkgPSBnZXRTdHJpbmcoJ3N0b3JlZF9wcmVmcycsICdub3RoaW5nJywgZmFsc2UpO1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBrZXkgdG8gcmV0cmlldmUuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGZhbGxiYWNrIHdoYXQgdG8gcmV0dXJuIGlmIHRoZSBrZXkgd2FzIG5vdCBmb3VuZC5cclxuICogQHBhcmFtIHtib29sfSBbbG9jYWw9dHJ1ZV0gd2hldGhlciBvciBub3QgdG8gdXNlIGEgbmFtZXNwYWNlIHdoZW4gY2hlY2tpbmcgZm9yIHRoZSBrZXkuXHJcbiAqIEByZXR1cm4ge21peGVkfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0U3RyaW5nKGtleSwgZmFsbGJhY2ssIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmIChsb2NhbCkge1xyXG4gICAgICAgIHJlc3VsdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGAke2tleX0ke05BTUVTUEFDRX1gKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKHJlc3VsdCA9PT0gbnVsbCkgPyBmYWxsYmFjayA6IHJlc3VsdDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdG9yZWQgb2JqZWN0IGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIHJldHVybnMgZmFsbGJhY2suXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB4ID0gZ2V0T2JqZWN0KCdzdG9yZWRfa2V5JywgWzEsIDIsIDNdKTtcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgaXRlbSB0byByZXRyaWV2ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZmFsbGJhY2sgd2hhdCB0byByZXR1cm4gaWYgdGhlIGl0ZW0gZG9lcyBub3QgZXhpc3Qgb3IgZmFpbHMgdG8gcGFyc2UgY29ycmVjdGx5LlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIG9yIG5vdCBhIG5hbWVzcGFjZSBzaG91bGQgYmUgdXNlZC5cclxuICogQHJldHVybiB7bWl4ZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPYmplY3Qoa2V5LCBmYWxsYmFjaywgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gZ2V0U3RyaW5nKGtleSwgZmFsc2UsIGxvY2FsKTtcclxuXHJcbiAgICBpZiAoIXJlc3VsdCkge1xyXG4gICAgICAgIHJldHVybiBmYWxsYmFjaztcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UocmVzdWx0KTtcclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogU2V0cyBhbiBvYmplY3QgaW4gdGhlIHN0b3JhZ2UsIHN0cmluZ2lmeWluZyBpdCBmaXJzdCBpZiBuZWNjZXNzYXJ5LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ3NvbWVfa2V5Jywge2E6IFsxLCAyLCAzXSwgYjogJ3Rlc3QnfSk7XHJcbiAqIC8vcmV0dXJucyAne1wiYVwiOlsxLDIsM10sXCJiXCI6XCJ0ZXN0XCJ9J1xyXG4gKiBnZXRTdHJpbmcoJ3NvbWVfa2V5Jyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGl0ZW0gdG8gb3ZlcndyaXRlIG9yIGNyZWF0ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZGF0YSBhbnkgc3RyaW5naWZ5YWJsZSB0eXBlLlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIHRvIHNhdmUgdGhlIGl0ZW0gd2l0aCBhIG5hbWVzcGFjZS5cclxuICovXHJcbmZ1bmN0aW9uIHNldChrZXksIGRhdGEsIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgaWYgKGxvY2FsKSB7XHJcbiAgICAgICAga2V5ID0gYCR7a2V5fSR7TkFNRVNQQUNFfWA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBkYXRhID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBkYXRhKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCBpdGVtcyBzdGFydGluZyB3aXRoIG5hbWVzcGFjZSBmcm9tIHRoZSBzdG9yYWdlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ2tleV90ZXN0JywgMSk7XHJcbiAqIHNldCgna2V5X3Rlc3QyJywgMik7XHJcbiAqIGNsZWFyTmFtZXNwYWNlKCdrZXlfJyk7IC8vYm90aCBrZXlfdGVzdCBhbmQga2V5X3Rlc3QyIGhhdmUgYmVlbiByZW1vdmVkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZXNwYWNlIHRoZSBwcmVmaXggdG8gY2hlY2sgZm9yIHdoZW4gcmVtb3ZpbmcgaXRlbXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBjbGVhck5hbWVzcGFjZShuYW1lc3BhY2UpIHtcclxuICAgIE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aChuYW1lc3BhY2UpKSB7XHJcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3QgYXBpID0gcmVxdWlyZSgnLi9ibG9ja2hlYWRzJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCcuL3N0b3JhZ2UnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJy4vaG9vaycpO1xyXG5cclxuY29uc3QgU1RPUkFHRSA9IHtcclxuICAgIFBMQVlFUlM6ICdtYl9wbGF5ZXJzJyxcclxuICAgIExPR19MT0FEOiAnbWJfbGFzdExvZ0xvYWQnLFxyXG59O1xyXG5cclxudmFyIHdvcmxkID0gbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW10sXHJcbiAgICBvd25lcjogJycsXHJcbiAgICBwbGF5ZXJzOiBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFLlBMQVlFUlMsIHt9KSxcclxuICAgIGxpc3RzOiB7YWRtaW46IFtdLCBtb2Q6IFtdLCBzdGFmZjogW10sIGJsYWNrOiBbXSwgd2hpdGU6IFtdfSxcclxuICAgIGlzUGxheWVyLFxyXG4gICAgaXNTZXJ2ZXIsXHJcbiAgICBpc093bmVyLFxyXG4gICAgaXNBZG1pbixcclxuICAgIGlzU3RhZmYsXHJcbiAgICBpc01vZCxcclxuICAgIGlzT25saW5lLFxyXG4gICAgZ2V0Sm9pbnMsXHJcbn07XHJcbnZhciBsaXN0cyA9IHdvcmxkLmxpc3RzO1xyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhIHBsYXllciBoYXMgam9pbmVkIHRoZSBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1BsYXllcihuYW1lKSB7XHJcbiAgICByZXR1cm4gd29ybGQucGxheWVycy5oYXNPd25Qcm9wZXJ0eShuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgdGhlIHNlcnZlclxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNTZXJ2ZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSA9PSAnU0VSVkVSJztcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIHRoZSBvd25lciBvciBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc093bmVyKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5vd25lciA9PSBuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkgfHwgaXNTZXJ2ZXIobmFtZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyBhbiBhZG1pblxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNBZG1pbihuYW1lKSB7XHJcbiAgICByZXR1cm4gbGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpKSB8fCBpc093bmVyKG5hbWUpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgYSBtb2RcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzTW9kKG5hbWUpIHtcclxuICAgIHJldHVybiBsaXN0cy5tb2QuaW5jbHVkZXMobmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIGEgc3RhZmYgbWVtYmVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNTdGFmZihuYW1lKSB7XHJcbiAgICByZXR1cm4gaXNBZG1pbihuYW1lKSB8fCBpc01vZChuYW1lKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhIHBsYXllciBpcyBvbmxpbmVcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzT25saW5lKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgdGhlIG51bWJlciBvZiB0aW1lcyB0aGUgcGxheWVyIGhhcyBqb2luZWQgdGhlIHNlcnZlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7TnVtYmVyfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0Sm9pbnMobmFtZSkge1xyXG4gICAgcmV0dXJuIGlzUGxheWVyKG5hbWUpID8gd29ybGQucGxheWVyc1tuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCldLmpvaW5zIDogMDtcclxufVxyXG5cclxuLy8gS2VlcCB0aGUgb25saW5lIGxpc3QgdXAgdG8gZGF0ZVxyXG5ob29rLm9uKCd3b3JsZC5qb2luJywgZnVuY3Rpb24obmFtZSkge1xyXG4gICAgaWYgKCF3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICB3b3JsZC5vbmxpbmUucHVzaChuYW1lKTtcclxuICAgIH1cclxufSk7XHJcbmhvb2sub24oJ3dvcmxkLmxlYXZlJywgZnVuY3Rpb24obmFtZSkge1xyXG4gICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5zcGxpY2Uod29ybGQub25saW5lLmluZGV4T2YobmFtZSksIDEpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vIEtlZXAgcGxheWVycyBsaXN0IHVwIHRvIGRhdGVcclxuaG9vay5vbignd29ybGQuam9pbicsIGNoZWNrUGxheWVySm9pbik7XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24uXHJcbiAqIFJlbW92ZXMgYWRtaW5zIGZyb20gdGhlIG1vZCBsaXN0IGFuZCBjcmVhdGVzIHRoZSBzdGFmZiBsaXN0LlxyXG4gKi9cclxuZnVuY3Rpb24gYnVpbGRTdGFmZkxpc3QoKSB7XHJcbiAgICBsaXN0cy5tb2QgPSBsaXN0cy5tb2QuZmlsdGVyKChuYW1lKSA9PiAhbGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZSkgJiYgbmFtZSAhPSAnU0VSVkVSJyAmJiBuYW1lICE9IHdvcmxkLm93bmVyKTtcclxuICAgIGxpc3RzLnN0YWZmID0gbGlzdHMuYWRtaW4uY29uY2F0KGxpc3RzLm1vZCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbi5cclxuICogQ2hlY2tzIGlmIGEgcGxheWVyIGhhcyBwZXJtaXNzaW9uIHRvIHBlcmZvcm0gYSBjb21tYW5kXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb21tYW5kXHJcbiAqL1xyXG5mdW5jdGlvbiBwZXJtaXNzaW9uQ2hlY2sobmFtZSwgY29tbWFuZCkge1xyXG4gICAgY29tbWFuZCA9IGNvbW1hbmQudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuXHJcbiAgICBpZiAoWydhZG1pbicsICd1bmFkbWluJywgJ21vZCcsICd1bm1vZCddLmluY2x1ZGVzKGNvbW1hbmQpKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzQWRtaW4obmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFsnd2hpdGVsaXN0JywgJ3Vud2hpdGVsaXN0JywgJ2JhbicsICd1bmJhbiddLmluY2x1ZGVzKGNvbW1hbmQpKSB7XHJcbiAgICAgICAgcmV0dXJuIGlzU3RhZmYobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vLyBLZWVwIGxpc3RzIHVwIHRvIGRhdGVcclxuaG9vay5vbignd29ybGQuY29tbWFuZCcsIGZ1bmN0aW9uKG5hbWUsIGNvbW1hbmQsIHRhcmdldCkge1xyXG4gICAgaWYgKCFwZXJtaXNzaW9uQ2hlY2sobmFtZSwgY29tbWFuZCkpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHVuID0gY29tbWFuZC5zdGFydHNXaXRoKCd1bicpO1xyXG5cclxuICAgIHZhciBncm91cCA9IHtcclxuICAgICAgICBhZG1pbjogJ2FkbWluJyxcclxuICAgICAgICBtb2Q6ICdtb2QnLFxyXG4gICAgICAgIHdoaXRlbGlzdDogJ3doaXRlJyxcclxuICAgICAgICBiYW46ICdibGFjaycsXHJcbiAgICB9W3VuID8gY29tbWFuZC5zdWJzdHIoMikgOiBjb21tYW5kXTtcclxuXHJcbiAgICBpZiAodW4gJiYgbGlzdHNbZ3JvdXBdLmluY2x1ZGVzKHRhcmdldCkpIHtcclxuICAgICAgICBsaXN0c1tncm91cF0uc3BsaWNlKGxpc3RzW2dyb3VwXS5pbmRleE9mKHRhcmdldCksIDEpO1xyXG4gICAgICAgIGJ1aWxkU3RhZmZMaXN0KCk7XHJcbiAgICB9IGVsc2UgaWYgKCF1biAmJiAhbGlzdHNbZ3JvdXBdLmluY2x1ZGVzKHRhcmdldCkpIHtcclxuICAgICAgICBsaXN0c1tncm91cF0ucHVzaCh0YXJnZXQpO1xyXG4gICAgICAgIGJ1aWxkU3RhZmZMaXN0KCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uLiBJbmNyZW1lbnRzIGEgcGxheWVyJ3Mgam9pbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpcFxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tQbGF5ZXJKb2luKG5hbWUsIGlwKSB7XHJcbiAgICBpZiAod29ybGQucGxheWVycy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xyXG4gICAgICAgIC8vUmV0dXJuaW5nIHBsYXllclxyXG4gICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uam9pbnMrKztcclxuICAgICAgICBpZiAoIXdvcmxkLnBsYXllcnNbbmFtZV0uaXBzLmluY2x1ZGVzKGlwKSkge1xyXG4gICAgICAgICAgICB3b3JsZC5wbGF5ZXJzW25hbWVdLmlwcy5wdXNoKGlwKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vTmV3IHBsYXllclxyXG4gICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0gPSB7am9pbnM6IDEsIGlwczogW2lwXX07XHJcbiAgICB9XHJcbiAgICB3b3JsZC5wbGF5ZXJzW25hbWVdLmlwID0gaXA7XHJcblxyXG4gICAgLy8gT3RoZXJ3aXNlLCB3ZSB3aWxsIGRvdWJsZSBwYXJzZSBqb2luc1xyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRS5MT0dfTE9BRCwgTWF0aC5mbG9vcihEYXRlLm5vdygpLnZhbHVlT2YoKSkpO1xyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRS5QTEFZRVJTLCB3b3JsZC5wbGF5ZXJzKTtcclxufVxyXG5cclxuXHJcbi8vIFVwZGF0ZSBsaXN0c1xyXG5Qcm9taXNlLmFsbChbYXBpLmdldExpc3RzKCksIGFwaS5nZXRXb3JsZE5hbWUoKSwgYXBpLmdldE93bmVyTmFtZSgpXSlcclxuICAgIC50aGVuKCh2YWx1ZXMpID0+IHtcclxuICAgICAgICB2YXIgW2FwaUxpc3RzLCB3b3JsZE5hbWUsIG93bmVyXSA9IHZhbHVlcztcclxuXHJcbiAgICAgICAgd29ybGQubGlzdHMgPSBhcGlMaXN0cztcclxuICAgICAgICBidWlsZFN0YWZmTGlzdCgpO1xyXG4gICAgICAgIHdvcmxkLm5hbWUgPSB3b3JsZE5hbWU7XHJcbiAgICAgICAgd29ybGQub3duZXIgPSBvd25lcjtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goY29uc29sZS5lcnJvcik7XHJcblxyXG4vLyBVcGRhdGUgcGxheWVycyBzaW5jZSBsYXN0IGJvdCBsb2FkXHJcblByb21pc2UuYWxsKFthcGkuZ2V0TG9ncygpLCBhcGkuZ2V0V29ybGROYW1lKCldKVxyXG4gICAgLnRoZW4oKHZhbHVlcykgPT4ge1xyXG4gICAgICAgIHZhciBbbGluZXMsIHdvcmxkTmFtZV0gPSB2YWx1ZXM7XHJcblxyXG4gICAgICAgIHZhciBsYXN0ID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRS5MT0dfTE9BRCwgMCk7XHJcbiAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRS5MT0dfTE9BRCwgTWF0aC5mbG9vcihEYXRlLm5vdygpLnZhbHVlT2YoKSkpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBsaW5lIG9mIGxpbmVzKSB7XHJcbiAgICAgICAgICAgIGxldCB0aW1lID0gbmV3IERhdGUobGluZS5zdWJzdHJpbmcoMCwgbGluZS5pbmRleE9mKCdiJykpLnJlcGxhY2UoJyAnLCAnVCcpLnJlcGxhY2UoJyAnLCAnWicpKTtcclxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBsaW5lLnN1YnN0cmluZyhsaW5lLmluZGV4T2YoJ10nKSArIDIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRpbWUgPCBsYXN0KSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChgJHt3b3JsZE5hbWV9IC0gUGxheWVyIENvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHBhcnRzID0gbGluZS5zdWJzdHIobGluZS5pbmRleE9mKCcgLSBQbGF5ZXIgQ29ubmVjdGVkICcpICsgMjApOyAvL05BTUUgfCBJUCB8IElEXHJcbiAgICAgICAgICAgICAgICBsZXQgWywgbmFtZSwgaXBdID0gcGFydHMubWF0Y2goLyguKikgXFx8IChbXFx3Ll0rKSBcXHwgLnszMn1cXHMqLyk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2hlY2tQbGF5ZXJKb2luKG5hbWUsIGlwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRS5QTEFZRVJTLCB3b3JsZC5wbGF5ZXJzKTtcclxuICAgIH0pO1xyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBzZW5kID0gcmVxdWlyZSgnYm90Jykuc2VuZDtcclxuY29uc3QgcHJlZmVyZW5jZXMgPSByZXF1aXJlKCdzZXR0aW5ncycpO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0Fubm91bmNlbWVudHMnLCAnbWVzc2FnZXMnKTtcclxudGFiLmlubmVySFRNTCA9IFwiPHRlbXBsYXRlIGlkPVxcXCJhVGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2PlxcclxcbiAgICAgICAgPGxhYmVsPlNlbmQ6PC9sYWJlbD5cXHJcXG4gICAgICAgIDx0ZXh0YXJlYSBjbGFzcz1cXFwibVxcXCI+PC90ZXh0YXJlYT5cXHJcXG4gICAgICAgIDxhPkRlbGV0ZTwvYT5cXHJcXG4gICAgICAgIDxsYWJlbCBzdHlsZT1cXFwiZGlzcGxheTpibG9jazttYXJnaW4tdG9wOjVweDtcXFwiPldhaXQgWCBtaW51dGVzLi4uPC9sYWJlbD5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9hbm5vdW5jZW1lbnRzXFxcIj5cXHJcXG4gICAgPGgzPlRoZXNlIGFyZSBzZW50IGFjY29yZGluZyB0byBhIHJlZ3VsYXIgc2NoZWR1bGUuPC9oMz5cXHJcXG4gICAgPHNwYW4+SWYgeW91IGhhdmUgb25lIGFubm91bmNlbWVudCwgaXQgaXMgc2VudCBldmVyeSBYIG1pbnV0ZXMsIGlmIHlvdSBoYXZlIHR3bywgdGhlbiB0aGUgZmlyc3QgaXMgc2VudCBhdCBYIG1pbnV0ZXMsIGFuZCB0aGUgc2Vjb25kIGlzIHNlbnQgWCBtaW51dGVzIGFmdGVyIHRoZSBmaXJzdC4gQ2hhbmdlIFggaW4gdGhlIHNldHRpbmdzIHRhYi4gT25jZSB0aGUgYm90IHJlYWNoZXMgdGhlIGVuZCBvZiB0aGUgbGlzdCwgaXQgc3RhcnRzIG92ZXIgYXQgdGhlIHRvcC48L3NwYW4+XFxyXFxuICAgIDxzcGFuIGNsYXNzPVxcXCJ0b3AtcmlnaHQtYnV0dG9uXFxcIj4rPC9zcGFuPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJhTXNnc1xcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGFubm91bmNlbWVudENoZWNrKDApLFxyXG59O1xyXG5cclxuZnVuY3Rpb24gYWRkTWVzc2FnZSh0ZXh0ID0gJycpIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2FUZW1wbGF0ZScsICcjYU1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnLm0nLCB0ZXh0OiB0ZXh0fVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICBhbm5vdW5jZW1lbnRzID0gQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnLm0nKSlcclxuICAgICAgICAubWFwKGVsID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHttZXNzYWdlOiBlbC52YWx1ZX07XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgc3RvcmFnZS5zZXQoJ2Fubm91bmNlbWVudEFycicsIGFubm91bmNlbWVudHMpO1xyXG59XHJcblxyXG4vLyBBbm5vdW5jZW1lbnRzIGNvbGxlY3Rpb25cclxudmFyIGFubm91bmNlbWVudHMgPSBzdG9yYWdlLmdldE9iamVjdCgnYW5ub3VuY2VtZW50QXJyJywgW10pO1xyXG5cclxuLy8gU2hvdyBzYXZlZCBhbm5vdW5jZW1lbnRzXHJcbmFubm91bmNlbWVudHNcclxuICAgIC5tYXAoYW5uID0+IGFubi5tZXNzYWdlKVxyXG4gICAgLmZvckVhY2goYWRkTWVzc2FnZSk7XHJcblxyXG5cclxuLy8gU2VuZHMgYW5ub3VuY2VtZW50cyBhZnRlciB0aGUgc3BlY2lmaWVkIGRlbGF5LlxyXG5mdW5jdGlvbiBhbm5vdW5jZW1lbnRDaGVjayhpKSB7XHJcbiAgICBpID0gKGkgPj0gYW5ub3VuY2VtZW50cy5sZW5ndGgpID8gMCA6IGk7XHJcblxyXG4gICAgdmFyIGFubiA9IGFubm91bmNlbWVudHNbaV07XHJcblxyXG4gICAgaWYgKGFubiAmJiBhbm4ubWVzc2FnZSkge1xyXG4gICAgICAgIHNlbmQoYW5uLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gICAgc2V0VGltZW91dChhbm5vdW5jZW1lbnRDaGVjaywgcHJlZmVyZW5jZXMuYW5ub3VuY2VtZW50RGVsYXkgKiA2MDAwMCwgaSArIDEpO1xyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYnVpbGRBbmRTZW5kTWVzc2FnZSxcclxuICAgIGJ1aWxkTWVzc2FnZSxcclxufTtcclxuXHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcbmNvbnN0IHNlbmQgPSByZXF1aXJlKCdib3QnKS5zZW5kO1xyXG5cclxuZnVuY3Rpb24gYnVpbGRBbmRTZW5kTWVzc2FnZShtZXNzYWdlLCBuYW1lKSB7XHJcbiAgICBzZW5kKGJ1aWxkTWVzc2FnZShtZXNzYWdlLCBuYW1lKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ1aWxkTWVzc2FnZShtZXNzYWdlLCBuYW1lKSB7XHJcbiAgICBtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKC97eyhbXn1dKyl9fS9nLCBmdW5jdGlvbihmdWxsLCBrZXkpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBOQU1FOiBuYW1lLFxyXG4gICAgICAgICAgICBOYW1lOiBuYW1lWzBdICsgbmFtZS5zdWJzdHJpbmcoMSkudG9Mb2NhbGVMb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgbmFtZTogbmFtZS50b0xvY2FsZUxvd2VyQ2FzZSgpXHJcbiAgICAgICAgfVtrZXldIHx8IGZ1bGw7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykpIHtcclxuICAgICAgICBtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKC97e2lwfX0vZ2ksIHdvcmxkLnBsYXllcnMuZ2V0SVAobmFtZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBtZXNzYWdlO1xyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgY2hlY2tKb2luc0FuZEdyb3VwLFxyXG4gICAgY2hlY2tKb2lucyxcclxuICAgIGNoZWNrR3JvdXAsXHJcbn07XHJcblxyXG5jb25zdCB3b3JsZCA9IHJlcXVpcmUoJ2xpYnJhcmllcy93b3JsZCcpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGNoZWNrSm9pbnNBbmRHcm91cChuYW1lLCBtc2cpIHtcclxuICAgIHJldHVybiBjaGVja0pvaW5zKG5hbWUsIG1zZy5qb2luc19sb3csIG1zZy5qb2luc19oaWdoKSAmJiBjaGVja0dyb3VwKG5hbWUsIG1zZy5ncm91cCwgbXNnLm5vdF9ncm91cCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrSm9pbnMobmFtZSwgbG93LCBoaWdoKSB7XHJcbiAgICByZXR1cm4gd29ybGQuZ2V0Sm9pbnMobmFtZSkgPj0gbG93ICYmIHdvcmxkLmdldEpvaW5zKG5hbWUpIDw9IGhpZ2g7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoZWNrR3JvdXAobmFtZSwgZ3JvdXAsIG5vdF9ncm91cCkge1xyXG4gICAgcmV0dXJuIGlzSW5Hcm91cChuYW1lLCBncm91cCkgJiYgIWlzSW5Hcm91cChuYW1lLCBub3RfZ3JvdXApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0luR3JvdXAobmFtZSwgZ3JvdXApIHtcclxuICAgIG5hbWUgPSBuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICBzd2l0Y2ggKGdyb3VwLnRvTG9jYWxlTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICBjYXNlICdhbGwnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNQbGF5ZXIobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnYWRtaW4nOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNBZG1pbihuYW1lKTtcclxuICAgICAgICBjYXNlICdtb2QnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNNb2QobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnc3RhZmYnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNTdGFmZihuYW1lKTtcclxuICAgICAgICBjYXNlICdvd25lcic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc093bmVyKG5hbWUpO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG4iLCJPYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2J1aWxkTWVzc2FnZScpLFxyXG4gICAgcmVxdWlyZSgnLi9jaGVja0pvaW5zQW5kR3JvdXAnKVxyXG4pO1xyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcblxyXG5cclxudmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuZWwuaW5uZXJIVE1MID0gXCIjbWJfam9pbiBoMywjbWJfbGVhdmUgaDMsI21iX3RyaWdnZXIgaDMsI21iX2Fubm91bmNlbWVudHMgaDN7bWFyZ2luOjAgMCA1cHggMH0jbWJfam9pbiBpbnB1dCwjbWJfam9pbiB0ZXh0YXJlYSwjbWJfbGVhdmUgaW5wdXQsI21iX2xlYXZlIHRleHRhcmVhLCNtYl90cmlnZ2VyIGlucHV0LCNtYl90cmlnZ2VyIHRleHRhcmVhLCNtYl9hbm5vdW5jZW1lbnRzIGlucHV0LCNtYl9hbm5vdW5jZW1lbnRzIHRleHRhcmVhe2JvcmRlcjoycHggc29saWQgIzY2Njt3aWR0aDpjYWxjKDEwMCUgLSAxMHB4KX0jbWJfam9pbiB0ZXh0YXJlYSwjbWJfbGVhdmUgdGV4dGFyZWEsI21iX3RyaWdnZXIgdGV4dGFyZWEsI21iX2Fubm91bmNlbWVudHMgdGV4dGFyZWF7cmVzaXplOm5vbmU7b3ZlcmZsb3c6aGlkZGVuO3BhZGRpbmc6MXB4IDA7aGVpZ2h0OjIxcHg7dHJhbnNpdGlvbjpoZWlnaHQgLjVzfSNtYl9qb2luIHRleHRhcmVhOmZvY3VzLCNtYl9sZWF2ZSB0ZXh0YXJlYTpmb2N1cywjbWJfdHJpZ2dlciB0ZXh0YXJlYTpmb2N1cywjbWJfYW5ub3VuY2VtZW50cyB0ZXh0YXJlYTpmb2N1c3toZWlnaHQ6NWVtfSNtYl9qb2luIGlucHV0W3R5cGU9XFxcIm51bWJlclxcXCJdLCNtYl9sZWF2ZSBpbnB1dFt0eXBlPVxcXCJudW1iZXJcXFwiXSwjbWJfdHJpZ2dlciBpbnB1dFt0eXBlPVxcXCJudW1iZXJcXFwiXSwjbWJfYW5ub3VuY2VtZW50cyBpbnB1dFt0eXBlPVxcXCJudW1iZXJcXFwiXXt3aWR0aDo1ZW19I2pNc2dzLCNsTXNncywjdE1zZ3N7cG9zaXRpb246cmVsYXRpdmU7ZGlzcGxheTpmbGV4O2ZsZXgtZmxvdzpyb3cgd3JhcDtib3JkZXItdG9wOjFweCBzb2xpZCAjMDAwfSNqTXNncz5kaXYsI2xNc2dzPmRpdiwjdE1zZ3M+ZGl2e3dpZHRoOmNhbGMoMzMlIC0gMTlweCk7bWluLXdpZHRoOjI4MHB4O3BhZGRpbmc6NXB4O21hcmdpbi1sZWZ0OjVweDttYXJnaW4tYm90dG9tOjVweDtib3JkZXI6M3B4IHNvbGlkICM5OTk7Ym9yZGVyLXJhZGl1czoxMHB4fSNqTXNncz5kaXY6bnRoLWNoaWxkKG9kZCksI2xNc2dzPmRpdjpudGgtY2hpbGQob2RkKSwjdE1zZ3M+ZGl2Om50aC1jaGlsZChvZGQpe2JhY2tncm91bmQ6I2NjY31cXG5cIjtcclxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG51aS5hZGRUYWJHcm91cCgnTWVzc2FnZXMnLCAnbWVzc2FnZXMnKTtcclxuXHJcbltcclxuICAgIHJlcXVpcmUoJy4vam9pbicpLFxyXG4gICAgcmVxdWlyZSgnLi9sZWF2ZScpLFxyXG4gICAgcmVxdWlyZSgnLi90cmlnZ2VyJyksXHJcbiAgICByZXF1aXJlKCcuL2Fubm91bmNlbWVudHMnKVxyXG5dLmZvckVhY2godHlwZSA9PiB7XHJcbiAgICB0eXBlLnRhYi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGNoZWNrRGVsZXRlKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC50YWdOYW1lICE9ICdBJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1aS5hbGVydCgnUmVhbGx5IGRlbGV0ZSB0aGlzIG1lc3NhZ2U/JywgW1xyXG4gICAgICAgICAgICB7dGV4dDogJ1llcycsIHN0eWxlOiAnZGFuZ2VyJywgYWN0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnRhcmdldC5wYXJlbnROb2RlLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgdHlwZS5zYXZlKCk7XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7dGV4dDogJ0NhbmNlbCd9XHJcbiAgICAgICAgXSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB0eXBlLnRhYi5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0eXBlLnNhdmUpO1xyXG5cclxuICAgIHR5cGUudGFiLnF1ZXJ5U2VsZWN0b3IoJy50b3AtcmlnaHQtYnV0dG9uJylcclxuICAgICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0eXBlLmFkZE1lc3NhZ2UoKSk7XHJcblxyXG4gICAgLy8gRG9uJ3Qgc3RhcnQgcmVzcG9uZGluZyB0byBjaGF0IGZvciAxMCBzZWNvbmRzXHJcbiAgICBzZXRUaW1lb3V0KHR5cGUuc3RhcnQsIDEwMDAwKTtcclxufSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuXHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ2pvaW5BcnInO1xyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignSm9pbicsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8dGVtcGxhdGUgaWQ9XFxcImpUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXY+XFxyXFxuICAgICAgICA8bGFiZWw+IE1lc3NhZ2U6IDx0ZXh0YXJlYSBjbGFzcz1cXFwibVxcXCI+PC90ZXh0YXJlYT48L2xhYmVsPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcInN1bW1hcnlcXFwiPjwvc3Bhbj5cXHJcXG4gICAgICAgIDxkZXRhaWxzPjxzdW1tYXJ5Pk1vcmUgb3B0aW9uczwvc3VtbWFyeT5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzOiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJncm91cFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIkFsbFxcXCI+YW55b25lPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIlN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJNb2RcXFwiPmEgbW9kPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIkFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJPd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgPC9zZWxlY3Q+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPlBsYXllciBpcyBub3Q6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcIm5vdF9ncm91cFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIk5vYm9keVxcXCI+bm9ib2R5PC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIlN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJNb2RcXFwiPmEgbW9kPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIkFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJPd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgPC9zZWxlY3Q+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjBcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19sb3dcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3Bhbj4gJmxlOyBwbGF5ZXIgam9pbnMgJmxlOyA8L3NwYW4+XFxyXFxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjk5OTlcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19oaWdoXFxcIj5cXHJcXG4gICAgICAgIDwvZGV0YWlscz5cXHJcXG4gICAgICAgIDxhPkRlbGV0ZTwvYT5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9qb2luXFxcIiBkYXRhLXRhYi1uYW1lPVxcXCJqb2luXFxcIj5cXHJcXG4gICAgPGgzPlRoZXNlIGFyZSBjaGVja2VkIHdoZW4gYSBwbGF5ZXIgam9pbnMgdGhlIHNlcnZlci48L2gzPlxcclxcbiAgICA8c3Bhbj5Zb3UgY2FuIHVzZSB7e05hbWV9fSwge3tOQU1FfX0sIHt7bmFtZX19LCBhbmQge3tpcH19IGluIHlvdXIgbWVzc2FnZS48L3NwYW4+XFxyXFxuICAgIDxzcGFuIGNsYXNzPVxcXCJ0b3AtcmlnaHQtYnV0dG9uXFxcIj4rPC9zcGFuPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJqTXNnc1xcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGhvb2sub24oJ3dvcmxkLmpvaW4nLCBvbkpvaW4pLFxyXG59O1xyXG5cclxudmFyIGpvaW5NZXNzYWdlcyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdKTtcclxuam9pbk1lc3NhZ2VzLmZvckVhY2goYWRkTWVzc2FnZSk7XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gYWRkIGEgdHJpZ2dlciBtZXNzYWdlIHRvIHRoZSBwYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkTWVzc2FnZShtc2cgPSB7fSkge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjalRlbXBsYXRlJywgJyNqTXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICdvcHRpb24nLCByZW1vdmU6IFsnc2VsZWN0ZWQnXSwgbXVsdGlwbGU6IHRydWV9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy5tJywgdGV4dDogbXNnLm1lc3NhZ2UgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScsIHZhbHVlOiBtc2cuam9pbnNfbG93IHx8IDB9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2hpZ2ggfHwgOTk5OX0sXHJcbiAgICAgICAge3NlbGVjdG9yOiBgW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cuZ3JvdXAgfHwgJ0FsbCd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXSBbdmFsdWU9XCIke21zZy5ub3RfZ3JvdXAgfHwgJ05vYm9keSd9XCJdYCwgc2VsZWN0ZWQ6ICdzZWxlY3RlZCd9XHJcbiAgICBdKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2F2ZSB0aGUgdXNlcidzIG1lc3NhZ2VzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIGpvaW5NZXNzYWdlcyA9IFtdO1xyXG4gICAgQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI2pNc2dzID4gZGl2JykpLmZvckVhY2goY29udGFpbmVyID0+IHtcclxuICAgICAgICBpZiAoIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGpvaW5NZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2xvdzogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfaGlnaDogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGdyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgbm90X2dyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBqb2luTWVzc2FnZXMpO1xyXG59XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBsaXN0ZW4gdG8gcGxheWVyIGpvaW5zXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqL1xyXG5mdW5jdGlvbiBvbkpvaW4obmFtZSkge1xyXG4gICAgam9pbk1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAoaGVscGVycy5jaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuXHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ2xlYXZlQXJyJztcclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ0xlYXZlJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjx0ZW1wbGF0ZSBpZD1cXFwibFRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdj5cXHJcXG4gICAgICAgIDxsYWJlbD5NZXNzYWdlIDx0ZXh0YXJlYSBjbGFzcz1cXFwibVxcXCI+PC90ZXh0YXJlYT48L2xhYmVsPlxcclxcbiAgICAgICAgPGRldGFpbHM+PHN1bW1hcnk+TW9yZSBvcHRpb25zPC9zdW1tYXJ5PlxcclxcbiAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXM6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcImdyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiQWxsXFxcIj5hbnlvbmU8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiU3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIk1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiQWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIk93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzIG5vdDogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwibm90X2dyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiTm9ib2R5XFxcIj5ub2JvZHk8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiU3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIk1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiQWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIk93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiMFxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2xvd1xcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxzcGFuPiAmbGU7IHBsYXllciBqb2lucyAmbGU7IDwvc3Bhbj5cXHJcXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiOTk5OVxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2hpZ2hcXFwiPlxcclxcbiAgICAgICAgPC9kZXRhaWxzPlxcclxcbiAgICAgICAgPGE+RGVsZXRlPC9hPlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2xlYXZlXFxcIj5cXHJcXG4gICAgPGgzPlRoZXNlIGFyZSBjaGVja2VkIHdoZW4gYSBwbGF5ZXIgbGVhdmVzIHRoZSBzZXJ2ZXIuPC9oMz5cXHJcXG4gICAgPHNwYW4+WW91IGNhbiB1c2Uge3tOYW1lfX0sIHt7TkFNRX19LCB7e25hbWV9fSwgYW5kIHt7aXB9fSBpbiB5b3VyIG1lc3NhZ2UuPC9zcGFuPlxcclxcbiAgICA8c3BhbiBjbGFzcz1cXFwidG9wLXJpZ2h0LWJ1dHRvblxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwibE1zZ3NcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxuICAgIHN0YXJ0OiAoKSA9PiBob29rLm9uKCd3b3JsZC5sZWF2ZScsIG9uTGVhdmUpLFxyXG59O1xyXG5cclxudmFyIGxlYXZlTWVzc2FnZXMgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSk7XHJcbmxlYXZlTWVzc2FnZXMuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgbGVhdmUgbWVzc2FnZSB0byB0aGUgcGFnZS5cclxuICovXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UobXNnID0ge30pIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2xUZW1wbGF0ZScsICcjbE1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnb3B0aW9uJywgcmVtb3ZlOiBbJ3NlbGVjdGVkJ10sIG11bHRpcGxlOiB0cnVlfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IG1zZy5tZXNzYWdlIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdBbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdOb2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhdmUgdGhlIGN1cnJlbnQgbGVhdmUgbWVzc2FnZXNcclxuICovXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICBsZWF2ZU1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjbE1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGVhdmVNZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2xvdzogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfaGlnaDogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGdyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgbm90X2dyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBsZWF2ZU1lc3NhZ2VzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gbGlzdGVuIHRvIHBsYXllciBkaXNjb25uZWN0aW9ucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIHBsYXllciBsZWF2aW5nLlxyXG4gKi9cclxuZnVuY3Rpb24gb25MZWF2ZShuYW1lKSB7XHJcbiAgICBsZWF2ZU1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAoaGVscGVycy5jaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuY29uc3Qgc2V0dGluZ3MgPSByZXF1aXJlKCdzZXR0aW5ncycpO1xyXG5cclxuXHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAndHJpZ2dlckFycic7XHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdUcmlnZ2VyJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjx0ZW1wbGF0ZSBpZD1cXFwidFRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdj5cXHJcXG4gICAgICAgIDxsYWJlbD5UcmlnZ2VyOiA8aW5wdXQgY2xhc3M9XFxcInRcXFwiPjwvbGFiZWw+XFxyXFxuICAgICAgICA8bGFiZWw+TWVzc2FnZTogPHRleHRhcmVhIGNsYXNzPVxcXCJtXFxcIj48L3RleHRhcmVhPjwvbGFiZWw+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwic3VtbWFyeVxcXCI+PC9zcGFuPlxcclxcbiAgICAgICAgPGRldGFpbHM+PHN1bW1hcnk+TW9yZSBvcHRpb25zPC9zdW1tYXJ5PlxcclxcbiAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXM6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcImdyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiQWxsXFxcIj5hbnlvbmU8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiU3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIk1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiQWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIk93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzIG5vdDogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwibm90X2dyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiTm9ib2R5XFxcIj5ub2JvZHk8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiU3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIk1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiQWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIk93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiMFxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2xvd1xcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxzcGFuPiAmbGU7IHBsYXllciBqb2lucyAmbGU7IDwvc3Bhbj5cXHJcXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiOTk5OVxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2hpZ2hcXFwiPlxcclxcbiAgICAgICAgPC9kZXRhaWxzPlxcclxcbiAgICAgICAgPGE+RGVsZXRlPC9hPlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX3RyaWdnZXJcXFwiPlxcclxcbiAgICA8aDM+VGhlc2UgYXJlIGNoZWNrZWQgd2hlbmV2ZXIgc29tZW9uZSBzYXlzIHNvbWV0aGluZy48L2gzPlxcclxcbiAgICA8c3Bhbj5Zb3UgY2FuIHVzZSB7e05hbWV9fSwge3tOQU1FfX0sIHt7bmFtZX19LCBhbmQge3tpcH19IGluIHlvdXIgbWVzc2FnZS4gSWYgeW91IHB1dCBhbiBhc3RlcmlzayAoKikgaW4geW91ciB0cmlnZ2VyLCBpdCB3aWxsIGJlIHRyZWF0ZWQgYXMgYSB3aWxkY2FyZC4gKFRyaWdnZXIgXFxcInRlKnN0XFxcIiB3aWxsIG1hdGNoIFxcXCJ0ZWEgc3R1ZmZcXFwiIGFuZCBcXFwidGVzdFxcXCIpPC9zcGFuPlxcclxcbiAgICA8c3BhbiBjbGFzcz1cXFwidG9wLXJpZ2h0LWJ1dHRvblxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwidE1zZ3NcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxuICAgIHN0YXJ0OiAoKSA9PiBob29rLm9uKCd3b3JsZC5tZXNzYWdlJywgY2hlY2tUcmlnZ2VycyksXHJcbn07XHJcblxyXG52YXIgdHJpZ2dlck1lc3NhZ2VzID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10pO1xyXG50cmlnZ2VyTWVzc2FnZXMuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgdHJpZ2dlciBtZXNzYWdlIHRvIHRoZSBwYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkTWVzc2FnZShtc2cgPSB7fSkge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjdFRlbXBsYXRlJywgJyN0TXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICdvcHRpb24nLCByZW1vdmU6IFsnc2VsZWN0ZWQnXSwgbXVsdGlwbGU6IHRydWV9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy5tJywgdGV4dDogbXNnLm1lc3NhZ2UgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy50JywgdmFsdWU6IG1zZy50cmlnZ2VyIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdBbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdOb2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTYXZlcyB0aGUgY3VycmVudCB0cmlnZ2VyIG1lc3NhZ2VzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIHRyaWdnZXJNZXNzYWdlcyA9IFtdO1xyXG4gICAgQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI3RNc2dzID4gZGl2JykpLmZvckVhY2goY29udGFpbmVyID0+IHtcclxuICAgICAgICBpZiAoIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlIHx8ICFjb250YWluZXIucXVlcnlTZWxlY3RvcignLnQnKS52YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cmlnZ2VyTWVzc2FnZXMucHVzaCh7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlLFxyXG4gICAgICAgICAgICB0cmlnZ2VyOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignLnQnKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfbG93OiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19oaWdoOiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBub3RfZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIHRyaWdnZXJNZXNzYWdlcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgYSB0cmlnZ2VyIGFnYWluc3QgYSBtZXNzYWdlIHRvIHNlZSBpZiBpdCBtYXRjaGVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdHJpZ2dlciB0aGUgdHJpZ2dlciB0byB0cnkgdG8gbWF0Y2hcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcclxuICovXHJcbmZ1bmN0aW9uIHRyaWdnZXJNYXRjaCh0cmlnZ2VyLCBtZXNzYWdlKSB7XHJcbiAgICBpZiAoc2V0dGluZ3MucmVnZXhUcmlnZ2Vycykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHRyaWdnZXIsICdpJykudGVzdChtZXNzYWdlKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHVpLm5vdGlmeShgU2tpcHBpbmcgdHJpZ2dlciAnJHt0cmlnZ2VyfScgYXMgdGhlIFJlZ0V4IGlzIGludmFpbGQuYCk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IFJlZ0V4cChcclxuICAgICAgICAgICAgdHJpZ2dlclxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhbLis/Xj0hOiR7fSgpfFxcW1xcXVxcL1xcXFxdKS9nLCBcIlxcXFwkMVwiKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKi9nLCBcIi4qXCIpLFxyXG4gICAgICAgICAgICAnaSdcclxuICAgICAgICApLnRlc3QobWVzc2FnZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNoZWNrIGluY29taW5nIHBsYXllciBtZXNzYWdlcyBmb3IgdHJpZ2dlcnNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIHBsYXllcidzIG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrVHJpZ2dlcnMobmFtZSwgbWVzc2FnZSkge1xyXG4gICAgdmFyIHRvdGFsQWxsb3dlZCA9IHNldHRpbmdzLm1heFJlc3BvbnNlcztcclxuICAgIHRyaWdnZXJNZXNzYWdlcy5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgaWYgKHRvdGFsQWxsb3dlZCAmJiBoZWxwZXJzLmNoZWNrSm9pbnNBbmRHcm91cChuYW1lLCBtc2cpICYmIHRyaWdnZXJNYXRjaChtc2cudHJpZ2dlciwgbWVzc2FnZSkpIHtcclxuICAgICAgICAgICAgaGVscGVycy5idWlsZEFuZFNlbmRNZXNzYWdlKG1zZy5tZXNzYWdlLCBuYW1lKTtcclxuICAgICAgICAgICAgdG90YWxBbGxvd2VkLS07XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnbWJfcHJlZmVyZW5jZXMnO1xyXG5cclxudmFyIHByZWZzID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwge30sIGZhbHNlKTtcclxuXHJcbi8vIEF1dG8gc2F2ZSBvbiBjaGFuZ2VcclxuLy8gSUUgKGFsbCkgLyBTYWZhcmkgKDwgMTApIGRvZXNuJ3Qgc3VwcG9ydCBwcm94aWVzXHJcbmlmICh0eXBlb2YgUHJveHkgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcHJlZnM7XHJcbiAgICBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBwcmVmcywgZmFsc2UpO1xyXG4gICAgfSwgMzAgKiAxMDAwKTtcclxufSBlbHNlIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gbmV3IFByb3h5KHByZWZzLCB7XHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihvYmosIHByb3AsIHZhbCkge1xyXG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICBvYmpbcHJvcF0gPSB2YWw7XHJcbiAgICAgICAgICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBwcmVmcywgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG52YXIgcHJlZnNNYXAgPSBbXHJcbiAgICB7dHlwZTogJ251bWJlcicsIGtleTogJ2Fubm91bmNlbWVudERlbGF5JywgZGVmYXVsdDogMTB9LFxyXG4gICAge3R5cGU6ICdudW1iZXInLCBrZXk6ICdtYXhSZXNwb25zZXMnLCBkZWZhdWx0OiAyfSxcclxuICAgIHt0eXBlOiAnYm9vbGVhbicsIGtleTogJ25vdGlmeScsIGRlZmF1bHQ6IHRydWV9LFxyXG4gICAgLy8gQWR2YW5jZWRcclxuICAgIHt0eXBlOiAnYm9vbGVhbicsIGtleTogJ2Rpc2FibGVUcmltJywgZGVmYXVsdDogZmFsc2V9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAncmVnZXhUcmlnZ2VycycsIGRlZmF1bHQ6IGZhbHNlfSxcclxuICAgIHt0eXBlOiAnYm9vbGVhbicsIGtleTogJ3NwbGl0TWVzc2FnZXMnLCBkZWZhdWx0OiBmYWxzZX0sXHJcbiAgICB7dHlwZTogJ3RleHQnLCBrZXk6ICdzcGxpdFRva2VuJywgZGVmYXVsdDogJzxzcGxpdD4nfSxcclxuXTtcclxuXHJcbnByZWZzTWFwLmZvckVhY2gocHJlZiA9PiB7XHJcbiAgICAvLyBTZXQgZGVmYXVsdHMgaWYgbm90IHNldFxyXG4gICAgaWYgKHR5cGVvZiBwcmVmc1twcmVmLmtleV0gIT0gIHByZWYudHlwZSkge1xyXG4gICAgICAgIHByZWZzW3ByZWYua2V5XSA9IHByZWYuZGVmYXVsdDtcclxuICAgIH1cclxufSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3QgcHJlZnMgPSByZXF1aXJlKCdzZXR0aW5ncycpO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ1NldHRpbmdzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSAnPHN0eWxlPicgK1xyXG4gICAgXCIjbWJfc2V0dGluZ3MgaDN7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgIzk5OX1cXG5cIiArXHJcbiAgICAnPC9zdHlsZT4nICtcclxuICAgIFwiPGRpdiBpZD1cXFwibWJfc2V0dGluZ3NcXFwiPlxcclxcbiAgICA8aDM+U2V0dGluZ3M8L2gzPlxcclxcbiAgICA8bGFiZWw+TWludXRlcyBiZXR3ZWVuIGFubm91bmNlbWVudHM6PC9sYWJlbD48YnI+XFxyXFxuICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcImFubm91bmNlbWVudERlbGF5XFxcIiB0eXBlPVxcXCJudW1iZXJcXFwiPjxicj5cXHJcXG4gICAgPGxhYmVsPk1heGltdW0gdHJpZ2dlciByZXNwb25zZXMgdG8gYSBtZXNzYWdlOjwvbGFiZWw+PGJyPlxcclxcbiAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJtYXhSZXNwb25zZXNcXFwiIHR5cGU9XFxcIm51bWJlclxcXCI+PGJyPlxcclxcbiAgICA8bGFiZWw+TmV3IGNoYXQgbm90aWZpY2F0aW9uczogPC9sYWJlbD5cXHJcXG4gICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwibm90aWZ5XFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+PGJyPlxcclxcblxcclxcbiAgICA8aDM+QWR2YW5jZWQgU2V0dGluZ3MgLSA8c21hbGw+PGEgaHJlZj1cXFwiaHR0cHM6Ly9naXRodWIuY29tL0JpYmxpb2ZpbGUvQmxvY2toZWFkcy1NZXNzYWdlQm90L3dpa2kvMS4tQWR2YW5jZWQtT3B0aW9ucy9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5SZWFkIHRoaXMgZmlyc3Q8L2E+PC9zbWFsbD48L2gzPlxcclxcbiAgICA8bGFiZWw+RGlzYWJsZSB3aGl0ZXNwYWNlIHRyaW1taW5nOiA8L2xhYmVsPlxcclxcbiAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJkaXNhYmxlVHJpbVxcXCIgdHlwZT1cXFwiY2hlY2tib3hcXFwiPjxicj5cXHJcXG4gICAgPGxhYmVsPlBhcnNlIHRyaWdnZXJzIGFzIFJlZ0V4OiA8L2xhYmVsPlxcclxcbiAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJyZWdleFRyaWdnZXJzXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+PGJyPlxcclxcbiAgICA8bGFiZWw+U3BsaXQgbWVzc2FnZXM6IDwvbGFiZWw+XFxyXFxuICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcInNwbGl0TWVzc2FnZXNcXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIj48YnI+XFxyXFxuICAgIDxsYWJlbD5TcGxpdCB0b2tlbjogPC9sYWJlbD48YnI+XFxyXFxuICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcInNwbGl0VG9rZW5cXFwiIHR5cGU9XFxcInRleHRcXFwiPlxcclxcblxcclxcbiAgICA8aDM+QmFja3VwIC8gUmVzdG9yZTwvaDM+XFxyXFxuICAgIDxhIGlkPVxcXCJtYl9iYWNrdXBfc2F2ZVxcXCI+R2V0IGJhY2t1cCBjb2RlPC9hPjxicj5cXHJcXG4gICAgPGEgaWQ9XFxcIm1iX2JhY2t1cF9sb2FkXFxcIj5Mb2FkIHByZXZpb3VzIGJhY2t1cDwvYT5cXHJcXG4gICAgPGRpdiBpZD1cXFwibWJfYmFja3VwXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbi8vIFNob3cgcHJlZnNcclxuT2JqZWN0LmtleXMocHJlZnMpLmZvckVhY2goa2V5ID0+IHtcclxuICAgIHZhciBlbCA9IHRhYi5xdWVyeVNlbGVjdG9yKGBbZGF0YS1rZXk9XCIke2tleX1cIl1gKTtcclxuICAgIHN3aXRjaCAodHlwZW9mIHByZWZzW2tleV0pIHtcclxuICAgICAgICBjYXNlICdib29sZWFuJzpcclxuICAgICAgICAgICAgZWwuY2hlY2tlZCA9IHByZWZzW2tleV07XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGVsLnZhbHVlID0gcHJlZnNba2V5XTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuLy8gV2F0Y2ggZm9yIGNoYW5nZXNcclxudGFiLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICB2YXIgZ2V0VmFsdWUgPSAoa2V5KSA9PiB0YWIucXVlcnlTZWxlY3RvcihgW2RhdGEta2V5PVwiJHtrZXl9XCJdYCkudmFsdWU7XHJcbiAgICB2YXIgZ2V0SW50ID0gKGtleSkgPT4gK2dldFZhbHVlKGtleSk7XHJcbiAgICB2YXIgZ2V0Q2hlY2tlZCA9IChrZXkpID0+IHRhYi5xdWVyeVNlbGVjdG9yKGBbZGF0YS1rZXk9XCIke2tleX1cIl1gKS5jaGVja2VkO1xyXG5cclxuICAgIE9iamVjdC5rZXlzKHByZWZzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgdmFyIGZ1bmM7XHJcblxyXG4gICAgICAgIHN3aXRjaCh0eXBlb2YgcHJlZnNba2V5XSkge1xyXG4gICAgICAgICAgICBjYXNlICdib29sZWFuJzpcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSBnZXRDaGVja2VkO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gZ2V0SW50O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gZ2V0VmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcmVmc1trZXldID0gZnVuYyhrZXkpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuXHJcbi8vIEdldCBiYWNrdXBcclxudGFiLnF1ZXJ5U2VsZWN0b3IoJyNtYl9iYWNrdXBfc2F2ZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gc2hvd0JhY2t1cCgpIHtcclxuICAgIHZhciBiYWNrdXAgPSBKU09OLnN0cmluZ2lmeShsb2NhbFN0b3JhZ2UpLnJlcGxhY2UoLzwvZywgJyZsdDsnKTtcclxuICAgIHVpLmFsZXJ0KGBDb3B5IHRoaXMgdG8gYSBzYWZlIHBsYWNlOjxicj48dGV4dGFyZWEgc3R5bGU9XCJ3aWR0aDogY2FsYygxMDAlIC0gN3B4KTtoZWlnaHQ6MTYwcHg7XCI+JHtiYWNrdXB9PC90ZXh0YXJlYT5gKTtcclxufSk7XHJcblxyXG5cclxuLy8gTG9hZCBiYWNrdXBcclxudGFiLnF1ZXJ5U2VsZWN0b3IoJyNtYl9iYWNrdXBfbG9hZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gbG9hZEJhY2t1cCgpIHtcclxuICAgIHVpLmFsZXJ0KCdFbnRlciB0aGUgYmFja3VwIGNvZGU6PHRleHRhcmVhIHN0eWxlPVwid2lkdGg6Y2FsYygxMDAlIC0gN3B4KTtoZWlnaHQ6MTYwcHg7XCI+PC90ZXh0YXJlYT4nLFxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgIHsgdGV4dDogJ0xvYWQgJiByZWZyZXNoIHBhZ2UnLCBzdHlsZTogJ3N1Y2Nlc3MnLCBhY3Rpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCB0ZXh0YXJlYScpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IEpTT04ucGFyc2UoY29kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29kZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBiYWNrdXAnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdWkubm90aWZ5KCdJbnZhbGlkIGJhY2t1cCBjb2RlLiBObyBhY3Rpb24gdGFrZW4uJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY29kZSkuZm9yRWFjaCgoa2V5KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIGNvZGVba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgdGV4dDogJ0NhbmNlbCcgfVxyXG4gICAgICAgICAgICAgICAgXSk7XHJcbn0pO1xyXG4iLCIvLyBPdmVyd3JpdGUgdGhlIHBvbGxDaGF0IGZ1bmN0aW9uIHRvIGtpbGwgdGhlIGRlZmF1bHQgY2hhdCBmdW5jdGlvblxyXG53aW5kb3cucG9sbENoYXQgPSBmdW5jdGlvbigpIHt9O1xyXG5cclxuLy8gT3ZlcndyaXRlIHRoZSBvbGQgcGFnZVxyXG5kb2N1bWVudC5ib2R5LmlubmVySFRNTCA9ICcnO1xyXG4vLyBTdHlsZSByZXNldFxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbdHlwZT1cInRleHQvY3NzXCJdJylcclxuICAgIC5mb3JFYWNoKGVsID0+IGVsLnJlbW92ZSgpKTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3RpdGxlJykudGV4dENvbnRlbnQgPSAnQ29uc29sZSAtIE1lc3NhZ2VCb3QnO1xyXG5cclxuLy8gU2V0IHRoZSBpY29uIHRvIHRoZSBibG9ja2hlYWQgaWNvbiB1c2VkIG9uIHRoZSBmb3J1bXNcclxudmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xyXG5lbC5yZWwgPSAnaWNvbic7XHJcbmVsLmhyZWYgPSAnaHR0cHM6Ly9pcy5nZC9NQnZVSEYnO1xyXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbnJlcXVpcmUoJ3VpL3BvbHlmaWxscy9jb25zb2xlJyk7XHJcbnJlcXVpcmUoJ2JvdC9taWdyYXRpb24nKTtcclxuXHJcbi8vIEV4cG9zZSB0aGUgZXh0ZW5zaW9uIEFQSVxyXG53aW5kb3cuTWVzc2FnZUJvdEV4dGVuc2lvbiA9IHJlcXVpcmUoJ01lc3NhZ2VCb3RFeHRlbnNpb24nKTtcclxuXHJcbmNvbnN0IGJoZmFuc2FwaSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9iaGZhbnNhcGknKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuaG9vay5vbignZXJyb3JfcmVwb3J0JywgZnVuY3Rpb24obXNnKSB7XHJcbiAgICB1aS5ub3RpZnkobXNnKTtcclxufSk7XHJcblxyXG5cclxucmVxdWlyZSgnLi9jb25zb2xlJyk7XHJcbi8vIEJ5IGRlZmF1bHQgbm8gdGFiIGlzIHNlbGVjdGVkLCBzaG93IHRoZSBjb25zb2xlLlxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGVmdE5hdiBzcGFuJykuY2xpY2soKTtcclxucmVxdWlyZSgnbWVzc2FnZXMnKTtcclxucmVxdWlyZSgnZXh0ZW5zaW9ucycpO1xyXG5yZXF1aXJlKCdzZXR0aW5ncy9wYWdlJyk7XHJcblxyXG4vLyBFcnJvciByZXBvcnRpbmdcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgKGVycikgPT4ge1xyXG4gICAgaWYgKGVyci5tZXNzYWdlICE9ICdTY3JpcHQgZXJyb3InKSB7XHJcbiAgICAgICAgYmhmYW5zYXBpLnJlcG9ydEVycm9yKGVycik7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCJyZXF1aXJlKCcuL3BvbHlmaWxscy9kZXRhaWxzJyk7XHJcblxyXG4vLyBCdWlsZCB0aGUgQVBJXHJcbk9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vbGF5b3V0JyksXHJcbiAgICByZXF1aXJlKCcuL3RlbXBsYXRlJyksXHJcbiAgICByZXF1aXJlKCcuL25vdGlmaWNhdGlvbnMnKVxyXG4pO1xyXG5cclxuLy8gRnVuY3Rpb25zIHdoaWNoIGFyZSBubyBsb25nZXIgY29udGFpbmVkIGluIHRoaXMgbW9kdWxlLCBidXQgYXJlIHJldGFpbmVkIGZvciBub3cgZm9yIGJhY2t3YXJkIGNvbXBhdGFiaWxpdHkuXHJcbmNvbnN0IHdyaXRlID0gcmVxdWlyZSgnLi4vY29uc29sZS9leHBvcnRzJykud3JpdGU7XHJcbm1vZHVsZS5leHBvcnRzLmFkZE1lc3NhZ2VUb0NvbnNvbGUgPSBmdW5jdGlvbihtc2csIG5hbWUgPSAnJywgbmFtZUNsYXNzID0gJycpIHtcclxuICAgIGNvbnNvbGUud2FybigndWkuYWRkTWVzc2FnZVRvQ29uc29sZSBoYXMgYmVlbiBkZXByaWNhdGVkLiBVc2UgZXguY29uc29sZS53cml0ZSBpbnN0ZWFkLicpO1xyXG4gICAgd3JpdGUobXNnLCBuYW1lLCBuYW1lQ2xhc3MpO1xyXG59O1xyXG4iLCIvKipcclxuICogQGZpbGUgQ29udGFpbnMgZnVuY3Rpb25zIGZvciBtYW5hZ2luZyB0aGUgcGFnZSBsYXlvdXRcclxuICovXHJcblxyXG5cclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcblxyXG4vLyBCdWlsZCBwYWdlIC0gb25seSBjYXNlIGluIHdoaWNoIGJvZHkuaW5uZXJIVE1MIHNob3VsZCBiZSB1c2VkLlxyXG5kb2N1bWVudC5ib2R5LmlubmVySFRNTCArPSBcIjxkaXYgaWQ9XFxcImxlZnROYXZcXFwiPlxcclxcbiAgICA8aW5wdXQgdHlwZT1cXFwiY2hlY2tib3hcXFwiIGlkPVxcXCJsZWZ0VG9nZ2xlXFxcIj5cXHJcXG4gICAgPGxhYmVsIGZvcj1cXFwibGVmdFRvZ2dsZVxcXCI+JiM5Nzc2OyBNZW51PC9sYWJlbD5cXHJcXG5cXHJcXG4gICAgPG5hdiBkYXRhLXRhYi1ncm91cD1cXFwibWFpblxcXCI+PC9uYXY+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcIm92ZXJsYXlcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblxcclxcbjxkaXYgaWQ9XFxcImNvbnRhaW5lclxcXCI+XFxyXFxuICAgIDxoZWFkZXI+PC9oZWFkZXI+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcbmRvY3VtZW50LmhlYWQuaW5uZXJIVE1MICs9ICc8c3R5bGU+JyArIFwiaHRtbCxib2R5e21pbi1oZWlnaHQ6MTAwdmg7cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MTAwJTttYXJnaW46MDtmb250LWZhbWlseTpcXFwiTHVjaWRhIEdyYW5kZVxcXCIsXFxcIkx1Y2lkYSBTYW5zIFVuaWNvZGVcXFwiLFZlcmRhbmEsc2Fucy1zZXJpZjtjb2xvcjojMDAwfXRleHRhcmVhLGlucHV0LGJ1dHRvbixzZWxlY3R7Zm9udC1mYW1pbHk6aW5oZXJpdH1he2N1cnNvcjpwb2ludGVyO2NvbG9yOiMxODJiNzN9I2xlZnROYXZ7dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlfSNsZWZ0TmF2IG5hdnt3aWR0aDoyNTBweDtiYWNrZ3JvdW5kOiMxODJiNzM7Y29sb3I6I2ZmZjtwb3NpdGlvbjpmaXhlZDtsZWZ0Oi0yNTBweDt6LWluZGV4OjEwMDt0b3A6MDtib3R0b206MDt0cmFuc2l0aW9uOmxlZnQgLjVzfSNsZWZ0TmF2IGRldGFpbHMsI2xlZnROYXYgc3BhbntkaXNwbGF5OmJsb2NrO3RleHQtYWxpZ246Y2VudGVyO3BhZGRpbmc6NXB4IDdweDtib3JkZXItYm90dG9tOjFweCBzb2xpZCB3aGl0ZX0jbGVmdE5hdiAuc2VsZWN0ZWR7YmFja2dyb3VuZDpyYWRpYWwtZ3JhZGllbnQoIzlmYWZlYiwgIzE4MmI3Myl9I2xlZnROYXYgc3VtbWFyeSB+IHNwYW57YmFja2dyb3VuZDpyZ2JhKDE1OSwxNzUsMjM1LDAuNCl9I2xlZnROYXYgc3VtbWFyeStzcGFue2JvcmRlci10b3AtbGVmdC1yYWRpdXM6MjBweDtib3JkZXItdG9wLXJpZ2h0LXJhZGl1czoyMHB4fSNsZWZ0TmF2IHN1bW1hcnkgfiBzcGFuOmxhc3Qtb2YtdHlwZXtib3JkZXI6MDtib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzOjIwcHg7Ym9yZGVyLWJvdHRvbS1yaWdodC1yYWRpdXM6MjBweH0jbGVmdE5hdiBpbnB1dHtkaXNwbGF5Om5vbmV9I2xlZnROYXYgbGFiZWx7Y29sb3I6I2ZmZjtiYWNrZ3JvdW5kOiMyMTNiOWQ7cGFkZGluZzo1cHg7cG9zaXRpb246Zml4ZWQ7dG9wOjVweDt6LWluZGV4OjEwMDtsZWZ0OjVweDtvcGFjaXR5OjE7dHJhbnNpdGlvbjpsZWZ0IC41cyxvcGFjaXR5IC41c30jbGVmdE5hdiBpbnB1dDpjaGVja2VkIH4gbmF2e2xlZnQ6MDt0cmFuc2l0aW9uOmxlZnQgLjVzfSNsZWZ0TmF2IGlucHV0OmNoZWNrZWQgfiBsYWJlbHtsZWZ0OjI1NXB4O29wYWNpdHk6MDt0cmFuc2l0aW9uOmxlZnQgLjVzLG9wYWNpdHkgLjVzfSNsZWZ0TmF2IGlucHV0OmNoZWNrZWQgfiAub3ZlcmxheXt2aXNpYmlsaXR5OnZpc2libGU7b3BhY2l0eToxO3RyYW5zaXRpb246b3BhY2l0eSAuNXN9aGVhZGVye2JhY2tncm91bmQ6IzE4MmI3MyB1cmwoXFxcImh0dHA6Ly9wb3J0YWwudGhlYmxvY2toZWFkcy5uZXQvc3RhdGljL2ltYWdlcy9wb3J0YWxIZWFkZXIucG5nXFxcIikgbm8tcmVwZWF0O2JhY2tncm91bmQtcG9zaXRpb246ODBweDtoZWlnaHQ6ODBweH0jY29udGFpbmVyPmRpdntoZWlnaHQ6Y2FsYygxMDB2aCAtIDEwMHB4KTtwYWRkaW5nOjEwcHg7cG9zaXRpb246YWJzb2x1dGU7dG9wOjgwcHg7bGVmdDowO3JpZ2h0OjA7b3ZlcmZsb3c6YXV0b30jY29udGFpbmVyPmRpdjpub3QoLnZpc2libGUpe2Rpc3BsYXk6bm9uZX0ub3ZlcmxheXtwb3NpdGlvbjpmaXhlZDt0b3A6MDtsZWZ0OjA7cmlnaHQ6MDtib3R0b206MDt6LWluZGV4Ojk5O2JhY2tncm91bmQ6cmdiYSgwLDAsMCwwLjcpO3Zpc2liaWxpdHk6aGlkZGVuO29wYWNpdHk6MDt0cmFuc2l0aW9uOm9wYWNpdHkgLjVzfS5vdmVybGF5LnZpc2libGV7dmlzaWJpbGl0eTp2aXNpYmxlO29wYWNpdHk6MTt0cmFuc2l0aW9uOm9wYWNpdHkgLjVzfS50b3AtcmlnaHQtYnV0dG9ue3Bvc2l0aW9uOmFic29sdXRlO2Rpc3BsYXk6LXdlYmtpdC1mbGV4O2Rpc3BsYXk6ZmxleDstd2Via2l0LWFsaWduLWl0ZW1zOmNlbnRlcjthbGlnbi1pdGVtczpjZW50ZXI7LXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7dG9wOjEwcHg7cmlnaHQ6MTJweDt3aWR0aDozMHB4O2hlaWdodDozMHB4O2JhY2tncm91bmQ6IzE4MkI3Mztib3JkZXI6MDtjb2xvcjojRkZGfVxcblwiICsgJzwvc3R5bGU+JztcclxuXHJcbi8vIEhpZGUgdGhlIG1lbnUgd2hlbiBjbGlja2luZyB0aGUgb3ZlcmxheVxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGVmdE5hdiAub3ZlcmxheScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdG9nZ2xlTWVudSk7XHJcblxyXG4vLyBDaGFuZ2UgdGFic1xyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGVmdE5hdicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gZ2xvYmFsVGFiQ2hhbmdlKGV2ZW50KSB7XHJcbiAgICB2YXIgdGFiTmFtZSA9IGV2ZW50LnRhcmdldC5kYXRhc2V0LnRhYk5hbWU7XHJcbiAgICB2YXIgdGFiID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2NvbnRhaW5lciA+IFtkYXRhLXRhYi1uYW1lPSR7dGFiTmFtZX1dYCk7XHJcbiAgICBpZighdGFiTmFtZSB8fCAhdGFiKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vQ29udGVudFxyXG4gICAgLy9XZSBjYW4ndCBqdXN0IHJlbW92ZSB0aGUgZmlyc3QgZHVlIHRvIGJyb3dzZXIgbGFnXHJcbiAgICBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNjb250YWluZXIgPiAudmlzaWJsZScpKVxyXG4gICAgICAgIC5mb3JFYWNoKGVsID0+IGVsLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2libGUnKSk7XHJcbiAgICB0YWIuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xyXG5cclxuICAgIC8vVGFic1xyXG4gICAgQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjbGVmdE5hdiAuc2VsZWN0ZWQnKSlcclxuICAgICAgICAuZm9yRWFjaChlbCA9PiBlbC5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY3RlZCcpKTtcclxuICAgIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpO1xyXG5cclxuICAgIGhvb2suZmlyZSgndWkudGFiU2hvd24nLCB0YWIpO1xyXG59KTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRvZ2dsZU1lbnUsXHJcbiAgICBhZGRUYWIsXHJcbiAgICByZW1vdmVUYWIsXHJcbiAgICBhZGRUYWJHcm91cCxcclxuICAgIHJlbW92ZVRhYkdyb3VwLFxyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNob3cvaGlkZSB0aGUgbWVudS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdG9nZ2xlTWVudSgpO1xyXG4gKi9cclxuZnVuY3Rpb24gdG9nZ2xlTWVudSgpIHtcclxuICAgIHZhciBtYWluVG9nZ2xlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xlZnROYXYgaW5wdXQnKTtcclxuICAgIG1haW5Ub2dnbGUuY2hlY2tlZCA9ICFtYWluVG9nZ2xlLmNoZWNrZWQ7XHJcbn1cclxuXHJcbnZhciB0YWJVSUQgPSAwO1xyXG4vKipcclxuICogVXNlZCB0byBhZGQgYSB0YWIgdG8gdGhlIGJvdCdzIG5hdmlnYXRpb24uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB0YWIgPSB1aS5hZGRUYWIoJ1RleHQnKTtcclxuICogdmFyIHRhYjIgPSB1aS5hZGRUYWIoJ0N1c3RvbSBNZXNzYWdlcycsICdtZXNzYWdlcycpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFiVGV4dFxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW2dyb3VwTmFtZT1tYWluXSBPcHRpb25hbC4gSWYgcHJvdmlkZWQsIHRoZSBuYW1lIG9mIHRoZSBncm91cCBvZiB0YWJzIHRvIGFkZCB0aGlzIHRhYiB0by5cclxuICogQHJldHVybiB7Tm9kZX0gLSBUaGUgZGl2IHRvIHBsYWNlIHRhYiBjb250ZW50IGluLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkVGFiKHRhYlRleHQsIGdyb3VwTmFtZSA9ICdtYWluJykge1xyXG4gICAgdmFyIHRhYk5hbWUgPSAnYm90VGFiXycgKyB0YWJVSUQrKztcclxuXHJcbiAgICB2YXIgdGFiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgdGFiLnRleHRDb250ZW50ID0gdGFiVGV4dDtcclxuICAgIHRhYi5jbGFzc0xpc3QuYWRkKCd0YWInKTtcclxuICAgIHRhYi5kYXRhc2V0LnRhYk5hbWUgPSB0YWJOYW1lO1xyXG5cclxuICAgIHZhciB0YWJDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICB0YWJDb250ZW50LmRhdGFzZXQudGFiTmFtZSA9IHRhYk5hbWU7XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2xlZnROYXYgW2RhdGEtdGFiLWdyb3VwPSR7Z3JvdXBOYW1lfV1gKS5hcHBlbmRDaGlsZCh0YWIpO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2NvbnRhaW5lcicpLmFwcGVuZENoaWxkKHRhYkNvbnRlbnQpO1xyXG5cclxuICAgIHJldHVybiB0YWJDb250ZW50O1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYSBnbG9iYWwgdGFiLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgdGFiID0gdWkuYWRkVGFiKCdUYWInKTtcclxuICogdWkucmVtb3ZlVGFiKHRhYik7XHJcbiAqIEBwYXJhbSB7Tm9kZX0gdGFiQ29udGVudCBUaGUgZGl2IHJldHVybmVkIGJ5IHRoZSBhZGRUYWIgZnVuY3Rpb24uXHJcbiAqL1xyXG5mdW5jdGlvbiByZW1vdmVUYWIodGFiQ29udGVudCkge1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2xlZnROYXYgW2RhdGEtdGFiLW5hbWU9JHt0YWJDb250ZW50LmRhdGFzZXQudGFiTmFtZX1dYCkucmVtb3ZlKCk7XHJcbiAgICB0YWJDb250ZW50LnJlbW92ZSgpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSB0YWIgZ3JvdXAgaW4gd2hpY2ggdGFicyBjYW4gYmUgcGxhY2VkLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1aS5hZGRUYWJHcm91cCgnR3JvdXAgVGV4dCcsICdzb21lX2dyb3VwJyk7XHJcbiAqIHVpLmFkZFRhYignV2l0aGluIGdyb3VwJywgJ3NvbWVfZ3JvdXAnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgLSBUaGUgdGV4dCB0aGUgdXNlciB3aWxsIHNlZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gZ3JvdXBOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGdyb3VwIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGFkZCB0YWJzIHdpdGhpbiB0aGUgZ3JvdXAuXHJcbiAqL1xyXG5mdW5jdGlvbiBhZGRUYWJHcm91cCh0ZXh0LCBncm91cE5hbWUpIHtcclxuICAgIHZhciBkZXRhaWxzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGV0YWlscycpO1xyXG4gICAgZGV0YWlscy5kYXRhc2V0LnRhYkdyb3VwID0gZ3JvdXBOYW1lO1xyXG5cclxuICAgIHZhciBzdW1tYXJ5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3VtbWFyeScpO1xyXG4gICAgc3VtbWFyeS50ZXh0Q29udGVudCA9IHRleHQ7XHJcbiAgICBkZXRhaWxzLmFwcGVuZENoaWxkKHN1bW1hcnkpO1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWZ0TmF2IFtkYXRhLXRhYi1ncm91cD1tYWluXScpLmFwcGVuZENoaWxkKGRldGFpbHMpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYSB0YWIgZ3JvdXAgYW5kIGFsbCB0YWJzIGNvbnRhaW5lZCB3aXRoaW4gdGhlIHNwZWNpZmllZCBncm91cC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogYWRkVGFiR3JvdXAoJ0dyb3VwJywgJ2dyb3VwMScpO1xyXG4gKiB2YXIgaW5uZXIgPSBhZGRUYWIoJ0lubmVyJywgJ2dyb3VwMScpO1xyXG4gKiByZW1vdmVUYWJHcm91cCgnZ3JvdXAxJyk7IC8vIGlubmVyIGhhcyBiZWVuIHJlbW92ZWQuXHJcbiAqIEBwYXJhbSBzdHJpbmcgZ3JvdXBOYW1lIHRoZSBuYW1lIG9mIHRoZSBncm91cCB0aGF0IHdhcyB1c2VkIGluIHVpLmFkZFRhYkdyb3VwLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlVGFiR3JvdXAoZ3JvdXBOYW1lKSB7XHJcbiAgICB2YXIgZ3JvdXAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbGVmdE5hdiBbZGF0YS10YWItZ3JvdXA9XCIke2dyb3VwTmFtZX1cIl1gKTtcclxuICAgIHZhciBpdGVtcyA9IEFycmF5LmZyb20oZ3JvdXAucXVlcnlTZWxlY3RvckFsbCgnc3BhbicpKTtcclxuXHJcbiAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIC8vVGFiIGNvbnRlbnRcclxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjY29udGFpbmVyID4gW2RhdGEtdGFiLW5hbWU9XCIke2l0ZW0uZGF0YXNldC50YWJOYW1lfVwiXWApLnJlbW92ZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZ3JvdXAucmVtb3ZlKCk7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBhbGVydFxyXG59O1xyXG5cclxuLyoqXHJcbiogRnVuY3Rpb24gdXNlZCB0byByZXF1aXJlIGFjdGlvbiBmcm9tIHRoZSB1c2VyLlxyXG4qXHJcbiogQHBhcmFtIHtzdHJpbmd9IHRleHQgdGhlIHRleHQgdG8gZGlzcGxheSBpbiB0aGUgYWxlcnRcclxuKiBAcGFyYW0ge0FycmF5fSBidXR0b25zIGFuIGFycmF5IG9mIGJ1dHRvbnMgdG8gYWRkIHRvIHRoZSBhbGVydC5cclxuKiAgICAgICAgRm9ybWF0OiBbe3RleHQ6ICdUZXN0Jywgc3R5bGU6J3N1Y2Nlc3MnLCBhY3Rpb246IGZ1bmN0aW9uKCl7fSwgdGhpc0FyZzogd2luZG93LCBkaXNtaXNzOiBmYWxzZX1dXHJcbiogICAgICAgIE5vdGU6IHRleHQgaXMgdGhlIG9ubHkgcmVxdWlyZWQgcGFyYW1hdGVyLiBJZiBubyBidXR0b24gYXJyYXkgaXMgc3BlY2lmaWVkXHJcbiogICAgICAgIHRoZW4gYSBzaW5nbGUgT0sgYnV0dG9uIHdpbGwgYmUgc2hvd24uXHJcbiogICAgICAgICBQcm92aWRlZCBzdHlsZXM6IHN1Y2Nlc3MsIGRhbmdlciwgd2FybmluZywgaW5mb1xyXG4qICAgICAgICBEZWZhdWx0czogc3R5bGU6ICcnLCBhY3Rpb246IHVuZGVmaW5lZCwgdGhpc0FyZzogdW5kZWZpbmVkLCBkaXNtaXNzOiB0cnVlXHJcbiovXHJcbmZ1bmN0aW9uIGFsZXJ0KHRleHQsIGJ1dHRvbnMgPSBbe3RleHQ6ICdPSyd9XSkge1xyXG4gICAgaWYgKGluc3RhbmNlLmFjdGl2ZSkge1xyXG4gICAgICAgIGluc3RhbmNlLnF1ZXVlLnB1c2goe3RleHQsIGJ1dHRvbnN9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpbnN0YW5jZS5hY3RpdmUgPSB0cnVlO1xyXG5cclxuICAgIGJ1dHRvbnMuZm9yRWFjaChmdW5jdGlvbihidXR0b24sIGkpIHtcclxuICAgICAgICBidXR0b24uZGlzbWlzcyA9IChidXR0b24uZGlzbWlzcyA9PT0gZmFsc2UpID8gZmFsc2UgOiB0cnVlO1xyXG4gICAgICAgIGluc3RhbmNlLmJ1dHRvbnNbJ2J1dHRvbl8nICsgaV0gPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogYnV0dG9uLmFjdGlvbixcclxuICAgICAgICAgICAgdGhpc0FyZzogYnV0dG9uLnRoaXNBcmcgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICBkaXNtaXNzOiB0eXBlb2YgYnV0dG9uLmRpc21pc3MgPT0gJ2Jvb2xlYW4nID8gYnV0dG9uLmRpc21pc3MgOiB0cnVlLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgYnV0dG9uLmlkID0gJ2J1dHRvbl8nICsgaTtcclxuICAgICAgICBidWlsZEJ1dHRvbihidXR0b24pO1xyXG4gICAgfSk7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnRDb250ZW50JykuaW5uZXJIVE1MID0gdGV4dDtcclxuXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQgfiAub3ZlcmxheScpLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCcpLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEhvbGRzIHRoZSBjdXJyZW50IGFsZXJ0IGFuZCBxdWV1ZSBvZiBmdXJ0aGVyIGFsZXJ0cy5cclxuICovXHJcbnZhciBpbnN0YW5jZSA9IHtcclxuICAgIGFjdGl2ZTogZmFsc2UsXHJcbiAgICBxdWV1ZTogW10sXHJcbiAgICBidXR0b25zOiB7fSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIGFkZCBidXR0b24gZWxlbWVudHMgdG8gYW4gYWxlcnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBidXR0b25cclxuICovXHJcbmZ1bmN0aW9uIGJ1aWxkQnV0dG9uKGJ1dHRvbikge1xyXG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgZWwuaW5uZXJIVE1MID0gYnV0dG9uLnRleHQ7XHJcbiAgICBpZiAoYnV0dG9uLnN0eWxlKSB7XHJcbiAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChidXR0b24uc3R5bGUpO1xyXG4gICAgfVxyXG4gICAgZWwuaWQgPSBidXR0b24uaWQ7XHJcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGJ1dHRvbkhhbmRsZXIpO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IC5idXR0b25zJykuYXBwZW5kQ2hpbGQoZWwpO1xyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIHRoZSBmdW5jdGlvbmFsaXR5IG9mIGVhY2ggYnV0dG9uIGFkZGVkIHRvIGFuIGFsZXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge01vdXNlRXZlbnR9IGV2ZW50XHJcbiAqL1xyXG5mdW5jdGlvbiBidXR0b25IYW5kbGVyKGV2ZW50KSB7XHJcbiAgICB2YXIgYnV0dG9uID0gaW5zdGFuY2UuYnV0dG9uc1tldmVudC50YXJnZXQuaWRdIHx8IHt9O1xyXG4gICAgaWYgKHR5cGVvZiBidXR0b24uYWN0aW9uID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBidXR0b24uYWN0aW9uLmNhbGwoYnV0dG9uLnRoaXNBcmcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vUmVxdWlyZSB0aGF0IHRoZXJlIGJlIGFuIGFjdGlvbiBhc29jaWF0ZWQgd2l0aCBuby1kaXNtaXNzIGJ1dHRvbnMuXHJcbiAgICBpZiAoYnV0dG9uLmRpc21pc3MgfHwgdHlwZW9mIGJ1dHRvbi5hY3Rpb24gIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCcpLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2libGUnKTtcclxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQgfiAub3ZlcmxheScpLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2libGUnKTtcclxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQgLmJ1dHRvbnMnKS5pbm5lckhUTUwgPSAnJztcclxuICAgICAgICBpbnN0YW5jZS5idXR0b25zID0ge307XHJcbiAgICAgICAgaW5zdGFuY2UuYWN0aXZlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIEFyZSBtb3JlIGFsZXJ0cyB3YWl0aW5nIHRvIGJlIHNob3duP1xyXG4gICAgICAgIGlmIChpbnN0YW5jZS5xdWV1ZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgbGV0IG5leHQgPSBpbnN0YW5jZS5xdWV1ZS5zaGlmdCgpO1xyXG4gICAgICAgICAgICBhbGVydChuZXh0LnRleHQsIG5leHQuYnV0dG9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiIsIlxyXG5cclxuT2JqZWN0LmFzc2lnbihcclxuICAgIG1vZHVsZS5leHBvcnRzLFxyXG4gICAgcmVxdWlyZSgnLi9hbGVydCcpLFxyXG4gICAgcmVxdWlyZSgnLi9ub3RpZnknKVxyXG4pO1xyXG5cclxudmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuZWwuaW5uZXJIVE1MID0gXCIjYWxlcnR7dmlzaWJpbGl0eTpoaWRkZW47cG9zaXRpb246Zml4ZWQ7dG9wOjUwcHg7bGVmdDowO3JpZ2h0OjA7bWFyZ2luOmF1dG87ei1pbmRleDoxMDE7d2lkdGg6NTAlO21pbi13aWR0aDozMDBweDttaW4taGVpZ2h0OjIwMHB4O2JhY2tncm91bmQ6I2ZmZjtib3JkZXItcmFkaXVzOjEwcHg7cGFkZGluZzoxMHB4IDEwcHggNTVweCAxMHB4fSNhbGVydC52aXNpYmxle3Zpc2liaWxpdHk6dmlzaWJsZX0jYWxlcnQ+ZGl2e3dlYmtpdC1vdmVyZmxvdy1zY3JvbGxpbmc6dG91Y2g7bWF4LWhlaWdodDo2NXZoO292ZXJmbG93LXk6YXV0b30jYWxlcnQ+LmJ1dHRvbnN7cG9zaXRpb246YWJzb2x1dGU7Ym90dG9tOjEwcHg7bGVmdDo1cHh9I2FsZXJ0Pi5idXR0b25zPnNwYW57ZGlzcGxheTppbmxpbmUtYmxvY2s7cGFkZGluZzo2cHggMTJweDttYXJnaW46MCA1cHg7dGV4dC1hbGlnbjpjZW50ZXI7d2hpdGUtc3BhY2U6bm93cmFwO2N1cnNvcjpwb2ludGVyO2JvcmRlcjoxcHggc29saWQgcmdiYSgwLDAsMCwwLjE1KTtib3JkZXItcmFkaXVzOjZweDtiYWNrZ3JvdW5kOiNmZmYgbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgI2ZmZiAwLCAjZTBlMGUwIDEwMCUpfSNhbGVydD4uYnV0dG9ucyBbY2xhc3Nde2NvbG9yOiNmZmZ9I2FsZXJ0Pi5idXR0b25zIC5zdWNjZXNze2JhY2tncm91bmQ6IzVjYjg1YyBsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCAjNWNiODVjIDAsICM0MTk2NDEgMTAwJSk7Ym9yZGVyLWNvbG9yOiMzZThmM2V9I2FsZXJ0Pi5idXR0b25zIC5pbmZve2JhY2tncm91bmQ6IzViYzBkZSBsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCAjNWJjMGRlIDAsICMyYWFiZDIgMTAwJSk7Ym9yZGVyLWNvbG9yOiMyOGE0Yzl9I2FsZXJ0Pi5idXR0b25zIC5kYW5nZXJ7YmFja2dyb3VuZDojZDk1MzRmIGxpbmVhci1ncmFkaWVudCh0byBib3R0b20sICNkOTUzNGYgMCwgI2MxMmUyYSAxMDAlKTtib3JkZXItY29sb3I6I2I5MmMyOH0jYWxlcnQ+LmJ1dHRvbnMgLndhcm5pbmd7YmFja2dyb3VuZDojZjBhZDRlIGxpbmVhci1ncmFkaWVudCh0byBib3R0b20sICNmMGFkNGUgMCwgI2ViOTMxNiAxMDAlKTtib3JkZXItY29sb3I6I2UzOGQxM30ubm90aWZpY2F0aW9ue29wYWNpdHk6MDt0cmFuc2l0aW9uOm9wYWNpdHkgMXM7cG9zaXRpb246Zml4ZWQ7dG9wOjFlbTtyaWdodDoxZW07bWluLXdpZHRoOjIwMHB4O2JvcmRlci1yYWRpdXM6NXB4O3BhZGRpbmc6NXB4O2JhY2tncm91bmQ6IzlmYWZlYn0ubm90aWZpY2F0aW9uLnZpc2libGV7b3BhY2l0eToxfVxcblwiO1xyXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbmVsLmlkID0gJ2FsZXJ0V3JhcHBlcic7XHJcbmVsLmlubmVySFRNTCA9IFwiPGRpdiBpZD1cXFwiYWxlcnRcXFwiPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJhbGVydENvbnRlbnRcXFwiPjwvZGl2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJidXR0b25zXFxcIi8+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuPGRpdiBjbGFzcz1cXFwib3ZlcmxheVxcXCIvPjwvZGl2PlxcclxcblwiO1xyXG5cclxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbm90aWZ5LFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2VuZCBhIG5vbi1jcml0aWNhbCBhbGVydCB0byB0aGUgdXNlci5cclxuICogU2hvdWxkIGJlIHVzZWQgaW4gcGxhY2Ugb2YgdWkuYWxlcnQgaWYgcG9zc2libGUgYXMgaXQgaXMgbm9uLWJsb2NraW5nLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL1Nob3dzIGEgbm90ZmljYXRpb24gZm9yIDIgc2Vjb25kc1xyXG4gKiB1aS5ub3RpZnkoJ05vdGlmaWNhdGlvbicpO1xyXG4gKiAvL1Nob3dzIGEgbm90aWZpY2F0aW9uIGZvciA1IHNlY29uZHNcclxuICogdWkubm90aWZ5KCdOb3RpZmljYXRpb24nLCA1KTtcclxuICogQHBhcmFtIFN0cmluZyB0ZXh0IHRoZSB0ZXh0IHRvIGRpc3BsYXkuIFNob3VsZCBiZSBrZXB0IHNob3J0IHRvIGF2b2lkIHZpc3VhbGx5IGJsb2NraW5nIHRoZSBtZW51IG9uIHNtYWxsIGRldmljZXMuXHJcbiAqIEBwYXJhbSBOdW1iZXIgZGlzcGxheVRpbWUgdGhlIG51bWJlciBvZiBzZWNvbmRzIHRvIHNob3cgdGhlIG5vdGlmaWNhdGlvbiBmb3IuXHJcbiAqL1xyXG5mdW5jdGlvbiBub3RpZnkodGV4dCwgZGlzcGxheVRpbWUgPSAyKSB7XHJcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIGVsLmNsYXNzTGlzdC5hZGQoJ25vdGlmaWNhdGlvbicpO1xyXG4gICAgZWwuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xyXG4gICAgZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnJlbW92ZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5yZW1vdmUoJ3Zpc2libGUnKTtcclxuICAgIH0uYmluZChlbCksIGRpc3BsYXlUaW1lICogMTAwMCk7XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfS5iaW5kKGVsKSwgZGlzcGxheVRpbWUgKiAxMDAwICsgMjEwMCk7XHJcbn1cclxuIiwiLy9JRSBkb2Vzbid0IGxpa2UgY29uc29sZS5sb2cgdW5sZXNzIGRldiB0b29scyBhcmUgb3Blbi5cclxuaWYgKCF3aW5kb3cuY29uc29sZSkge1xyXG4gICAgd2luZG93LmNvbnNvbGUgPSB7fTtcclxuICAgIHdpbmRvdy5sb2cgPSB3aW5kb3cubG9nIHx8IFtdO1xyXG4gICAgY29uc29sZS5sb2cgPSBmdW5jdGlvbiguLi5hcmdzKSB7XHJcbiAgICAgICAgd2luZG93LmxvZy5wdXNoKGFyZ3MpO1xyXG4gICAgfTtcclxufVxyXG5bJ2luZm8nLCAnZXJyb3InLCAnd2FybicsICdhc3NlcnQnXS5mb3JFYWNoKG1ldGhvZCA9PiB7XHJcbiAgICBpZiAoIWNvbnNvbGVbbWV0aG9kXSkge1xyXG4gICAgICAgIGNvbnNvbGVbbWV0aG9kXSA9IGNvbnNvbGUubG9nO1xyXG4gICAgfVxyXG59KTtcclxuIiwiLy9EZXRhaWxzIHBvbHlmaWxsLCBvbGRlciBmaXJlZm94LCBJRVxyXG5pZiAoISgnb3BlbicgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGV0YWlscycpKSkge1xyXG4gICAgbGV0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuICAgIHN0eWxlLnRleHRDb250ZW50ICs9IGBkZXRhaWxzOm5vdChbb3Blbl0pID4gOm5vdChzdW1tYXJ5KSB7IGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfSBkZXRhaWxzID4gc3VtbWFyeTpiZWZvcmUgeyBjb250ZW50OiBcIuKWtlwiOyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGZvbnQtc2l6ZTogLjhlbTsgd2lkdGg6IDEuNWVtOyBmb250LWZhbWlseTpcIkNvdXJpZXIgTmV3XCI7IH0gZGV0YWlsc1tvcGVuXSA+IHN1bW1hcnk6YmVmb3JlIHsgdHJhbnNmb3JtOiByb3RhdGUoOTBkZWcpOyB9YDtcclxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xyXG5cclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC50YWdOYW1lID09ICdTVU1NQVJZJykge1xyXG4gICAgICAgICAgICBsZXQgZGV0YWlscyA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFkZXRhaWxzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChkZXRhaWxzLmdldEF0dHJpYnV0ZSgnb3BlbicpKSB7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLm9wZW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMucmVtb3ZlQXR0cmlidXRlKCdvcGVuJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLm9wZW4gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5zZXRBdHRyaWJ1dGUoJ29wZW4nLCAnb3BlbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiLy8gSUUgRml4XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHRlbXBsYXRlKSB7XHJcbiAgICBpZiAoISgnY29udGVudCcgaW4gdGVtcGxhdGUpKSB7XHJcbiAgICAgICAgbGV0IGNvbnRlbnQgPSB0ZW1wbGF0ZS5jaGlsZE5vZGVzO1xyXG4gICAgICAgIGxldCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb250ZW50Lmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIGZyYWdtZW50LmFwcGVuZENoaWxkKGNvbnRlbnRbal0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGVtcGxhdGUuY29udGVudCA9IGZyYWdtZW50O1xyXG4gICAgfVxyXG59O1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSxcclxufTtcclxuXHJcbnZhciBwb2x5ZmlsbCA9IHJlcXVpcmUoJ3VpL3BvbHlmaWxscy90ZW1wbGF0ZScpO1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2xvbmUgYSB0ZW1wbGF0ZSBhZnRlciBhbHRlcmluZyB0aGUgcHJvdmlkZWQgcnVsZXMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI3RlbXBsYXRlJywgJyN0YXJnZXQnLCBbe3NlbGVjdG9yOiAnaW5wdXQnLCB2YWx1ZTogJ1ZhbHVlJ31dKTtcclxuICogdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCd0ZW1wbGF0ZScsICdkaXYnLCBbe3NlbGVjdG9yOiAnYScsIHJlbW92ZTogWydocmVmJ10sIG11bHRpcGxlOiB0cnVlfV0pO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGVtcGxhdGVTZWxlY3RvclxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFyZ2V0U2VsZWN0b3JcclxuICogQHBhcmFtIHthcnJheX0gcnVsZXMgZm9ybWF0OiBhcnJheSBvZiBvYmplY3RzXHJcbiAqICAgICAgZWFjaCBvYmplY3QgbXVzdCBoYXZlIFwic2VsZWN0b3JcIi5cclxuICogICAgICBlYWNoIG9iamVjdCBjYW4gaGF2ZSBcIm11bHRpcGxlXCIgc2V0IHRvIHVwZGF0ZSBhbGwgbWF0Y2hpbmcgZWxlbWVudHMuXHJcbiAqICAgICAgZWFjaCBvYmplY3QgY2FuIGhhdmUgXCJyZW1vdmVcIiAtIGFuIGFycmF5IG9mIGF0dHJpYnV0ZXMgdG8gcmVtb3ZlLlxyXG4gKiAgICAgIGVhY2ggb2JqZWN0IGNhbiBoYXZlIFwidGV4dFwiIG9yIFwiaHRtbFwiIC0gZnVydGhlciBrZXlzIHdpbGwgYmUgc2V0IGFzIGF0dHJpYnV0ZXMuXHJcbiAqICAgICAgaWYgYm90aCB0ZXh0IGFuZCBodG1sIGFyZSBzZXQsIHRleHQgd2lsbCB0YWtlIHByZWNlbmRlbmNlLlxyXG4gKiAgICAgIHJ1bGVzIHdpbGwgYmUgcGFyc2VkIGluIHRoZSBvcmRlciB0aGF0IHRoZXkgYXJlIHByZXNlbnQgaW4gdGhlIGFycmF5LlxyXG4gKi9cclxuZnVuY3Rpb24gYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKHRlbXBsYXRlU2VsZWN0b3IsIHRhcmdldFNlbGVjdG9yLCBydWxlcyA9IFtdKSB7XHJcbiAgICB2YXIgdGVtcGxhdGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRlbXBsYXRlU2VsZWN0b3IpO1xyXG5cclxuICAgIHBvbHlmaWxsKHRlbXBsYXRlKTtcclxuXHJcbiAgICB2YXIgY29udGVudCA9IHRlbXBsYXRlLmNvbnRlbnQ7XHJcblxyXG4gICAgcnVsZXMuZm9yRWFjaChydWxlID0+IGhhbmRsZVJ1bGUoY29udGVudCwgcnVsZSkpO1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGFyZ2V0U2VsZWN0b3IpLmFwcGVuZENoaWxkKGRvY3VtZW50LmltcG9ydE5vZGUoY29udGVudCwgdHJ1ZSkpO1xyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gYXBwbHkgcnVsZXMgdG8gdGhlIHRlbXBsYXRlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge05vZGV9IGNvbnRlbnQgLSB0aGUgY29udGVudCBvZiB0aGUgdGVtcGxhdGUuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBydWxlIC0gdGhlIHJ1bGUgdG8gYXBwbHkuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVSdWxlKGNvbnRlbnQsIHJ1bGUpIHtcclxuICAgIGlmIChydWxlLm11bHRpcGxlKSB7XHJcbiAgICAgICAgbGV0IGVscyA9IGNvbnRlbnQucXVlcnlTZWxlY3RvckFsbChydWxlLnNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgQXJyYXkuZnJvbShlbHMpXHJcbiAgICAgICAgICAgIC5mb3JFYWNoKGVsID0+IHVwZGF0ZUVsZW1lbnQoZWwsIHJ1bGUpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbGV0IGVsID0gY29udGVudC5xdWVyeVNlbGVjdG9yKHJ1bGUuc2VsZWN0b3IpO1xyXG4gICAgICAgIGlmICghZWwpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKGBVbmFibGUgdG8gdXBkYXRlICR7cnVsZS5zZWxlY3Rvcn0uYCwgcnVsZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVwZGF0ZUVsZW1lbnQoZWwsIHJ1bGUpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gdXBkYXRlIGFuIGVsZW1lbnQgd2l0aCBhIHJ1bGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7Tm9kZX0gZWwgdGhlIGVsZW1lbnQgdG8gYXBwbHkgdGhlIHJ1bGVzIHRvLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcnVsZSB0aGUgcnVsZSBvYmplY3QuXHJcbiAqL1xyXG5mdW5jdGlvbiB1cGRhdGVFbGVtZW50KGVsLCBydWxlKSB7XHJcbiAgICBpZiAoJ3RleHQnIGluIHJ1bGUpIHtcclxuICAgICAgICBlbC50ZXh0Q29udGVudCA9IHJ1bGUudGV4dDtcclxuICAgIH0gZWxzZSBpZiAoJ2h0bWwnIGluIHJ1bGUpIHtcclxuICAgICAgICBlbC5pbm5lckhUTUwgPSBydWxlLmh0bWw7XHJcbiAgICB9XHJcblxyXG4gICAgT2JqZWN0LmtleXMocnVsZSlcclxuICAgICAgICAuZmlsdGVyKGtleSA9PiAhWydzZWxlY3RvcicsICd0ZXh0JywgJ2h0bWwnLCAncmVtb3ZlJywgJ211bHRpcGxlJ10uaW5jbHVkZXMoa2V5KSlcclxuICAgICAgICAuZm9yRWFjaChrZXkgPT4gZWwuc2V0QXR0cmlidXRlKGtleSwgcnVsZVtrZXldKSk7XHJcblxyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkocnVsZS5yZW1vdmUpKSB7XHJcbiAgICAgICAgcnVsZS5yZW1vdmUuZm9yRWFjaChrZXkgPT4gZWwucmVtb3ZlQXR0cmlidXRlKGtleSkpO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==
