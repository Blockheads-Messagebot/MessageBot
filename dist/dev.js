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

},{"./exports":6,"bot":3,"libraries/hook":12,"libraries/world":14,"ui":27}],8:[function(require,module,exports){
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

    type.tab.addEventListener('change', function() {
        helpers.showSummary(event.target.parentNode);
    });

    type.tab.querySelector('.top-right-button')
        .addEventListener('click', () => type.addMessage());

    // Don't start responding to chat for 10 seconds
    setTimeout(type.start, 10000);
});

},{"./announcements":15,"./helpers":18,"./join":21,"./leave":22,"./trigger":23,"ui":27}],21:[function(require,module,exports){
const ui = require('ui');

const storage = require('libraries/storage');
const hook = require('libraries/hook');
const helpers = require('messages/helpers');


const STORAGE_ID = 'joinArr';

var tab = ui.addTab('Join', 'messages');
tab.innerHTML = "<template id=\"jTemplate\">\r\n    <div>\r\n        <label> Message: <textarea class=\"m\"></textarea></label>\r\n        <span class=\"summary\"></span>\r\n        <details><summary>More options</summary>\r\n            <label>Player is: <select data-target=\"group\">\r\n                <option value=\"all\">anyone</option>\r\n                <option value=\"staff\">a staff member</option>\r\n                <option value=\"mod\">a mod</option>\r\n                <option value=\"admin\">an admin</option>\r\n                <option value=\"owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <label>Player is not: <select data-target=\"not_group\">\r\n                <option value=\"nobody\">nobody</option>\r\n                <option value=\"staff\">a staff member</option>\r\n                <option value=\"mod\">a mod</option>\r\n                <option value=\"admin\">an admin</option>\r\n                <option value=\"owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n            <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        </details>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_join\" data-tab-name=\"join\">\r\n    <h3>These are checked when a player joins the server.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"jMsgs\"></div>\r\n</div>\r\n";

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
tab.innerHTML = "<template id=\"lTemplate\">\r\n    <div>\r\n        <label>Message <textarea class=\"m\"></textarea></label>\r\n        <span class=\"summary\"></span>\r\n        <details><summary>More options</summary>\r\n            <label>Player is: <select data-target=\"group\">\r\n                <option value=\"all\">anyone</option>\r\n                <option value=\"staff\">a staff member</option>\r\n                <option value=\"mod\">a mod</option>\r\n                <option value=\"admin\">an admin</option>\r\n                <option value=\"owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <label>Player is not: <select data-target=\"not_group\">\r\n                <option value=\"nobody\">nobody</option>\r\n                <option value=\"staff\">a staff member</option>\r\n                <option value=\"mod\">a mod</option>\r\n                <option value=\"admin\">an admin</option>\r\n                <option value=\"owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n            <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        </details>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_leave\">\r\n    <h3>These are checked when a player leaves the server.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"lMsgs\"></div>\r\n</div>\r\n";

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
tab.innerHTML = "<template id=\"tTemplate\">\r\n    <div>\r\n        <label>Trigger: <input class=\"t\"></label>\r\n        <label>Message: <textarea class=\"m\"></textarea></label>\r\n        <span class=\"summary\"></span>\r\n        <details><summary>More options</summary>\r\n            <label>Player is: <select data-target=\"group\">\r\n                <option value=\"all\">anyone</option>\r\n                <option value=\"staff\">a staff member</option>\r\n                <option value=\"mod\">a mod</option>\r\n                <option value=\"admin\">an admin</option>\r\n                <option value=\"owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <label>Player is not: <select data-target=\"not_group\">\r\n                <option value=\"nobody\">nobody</option>\r\n                <option value=\"staff\">a staff member</option>\r\n                <option value=\"mod\">a mod</option>\r\n                <option value=\"admin\">an admin</option>\r\n                <option value=\"owner\">the owner</option>\r\n            </select></label>\r\n            <br>\r\n            <input type=\"number\" value=\"0\" data-target=\"joins_low\">\r\n                <span> &le; player joins &le; </span>\r\n            <input type=\"number\" value=\"9999\" data-target=\"joins_high\">\r\n        </details>\r\n        <a>Delete</a>\r\n    </div>\r\n</template>\r\n<div id=\"mb_trigger\">\r\n    <h3>These are checked whenever someone says something.</h3>\r\n    <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger \"te*st\" will match \"tea stuff\" and \"test\")</span>\r\n    <span class=\"top-right-button\">+</span>\r\n    <div id=\"tMsgs\"></div>\r\n</div>\r\n";

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
el.innerHTML = "#alert{visibility:hidden;position:fixed;top:50px;left:0;right:0;margin:auto;z-index:101;width:50%;min-width:300px;min-height:200px;background:#fff;border-radius:10px;padding:10px 10px 55px 10px}#alert.visible{visibility:visible}#alert>div{webkit-overflow-scrolling:touch;max-height:65vh;overflow-y:auto}#alert>.buttons{position:absolute;bottom:10px;left:5px}#alert>.buttons>span{display:inline-block;padding:6px 12px;margin:0 5px;text-align:center;white-space:nowrap;cursor:pointer;border:1px solid rgba(0,0,0,0.15);border-radius:6px;background:#fff linear-gradient(to bottom, #fff 0, #e0e0e0 100%)}#alert>.buttons [class]{color:#fff}#alert>.buttons .success{background:#5cb85c linear-gradient(to bottom, #5cb85c 0, #419641 100%);border-color:#3e8f3e}#alert>.buttons .info{background:#5bc0de linear-gradient(to bottom, #5bc0de 0, #2aabd2 100%);border-color:#28a4c9}#alert>.buttons .danger{background:#d9534f linear-gradient(to bottom, #d9534f 0, #c12e2a 100%);border-color:#b92c28}#alert>.buttons .warning{background:#f0ad4e linear-gradient(to bottom, #f0ad4e 0, #eb9316 100%);border-color:#e38d13}.notification{opacity:0;transition:opacity 1s;position:fixed;top:1em;right:1em;min-width:200px;border-radius:5px;padding:5px;background:#9fafeb}.notification.visible{opacity:1}\n";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvTWVzc2FnZUJvdEV4dGVuc2lvbi5qcyIsImRldi9ib3QvY2hlY2tHcm91cC5qcyIsImRldi9ib3QvaW5kZXguanMiLCJkZXYvYm90L21pZ3JhdGlvbi5qcyIsImRldi9ib3Qvc2VuZC5qcyIsImRldi9jb25zb2xlL2V4cG9ydHMuanMiLCJkZXYvY29uc29sZS9pbmRleC5qcyIsImRldi9leHRlbnNpb25zL2luZGV4LmpzIiwiZGV2L2xpYnJhcmllcy9hamF4LmpzIiwiZGV2L2xpYnJhcmllcy9iaGZhbnNhcGkuanMiLCJkZXYvbGlicmFyaWVzL2Jsb2NraGVhZHMuanMiLCJkZXYvbGlicmFyaWVzL2hvb2suanMiLCJkZXYvbGlicmFyaWVzL3N0b3JhZ2UuanMiLCJkZXYvbGlicmFyaWVzL3dvcmxkLmpzIiwiZGV2L21lc3NhZ2VzL2Fubm91bmNlbWVudHMvaW5kZXguanMiLCJkZXYvbWVzc2FnZXMvaGVscGVycy9idWlsZE1lc3NhZ2UuanMiLCJkZXYvbWVzc2FnZXMvaGVscGVycy9jaGVja0pvaW5zQW5kR3JvdXAuanMiLCJkZXYvbWVzc2FnZXMvaGVscGVycy9pbmRleC5qcyIsImRldi9tZXNzYWdlcy9oZWxwZXJzL3Nob3dTdW1tYXJ5LmpzIiwiZGV2L21lc3NhZ2VzL2luZGV4LmpzIiwiZGV2L21lc3NhZ2VzL2pvaW4vaW5kZXguanMiLCJkZXYvbWVzc2FnZXMvbGVhdmUvaW5kZXguanMiLCJkZXYvbWVzc2FnZXMvdHJpZ2dlci9pbmRleC5qcyIsImRldi9zZXR0aW5ncy9pbmRleC5qcyIsImRldi9zZXR0aW5ncy9wYWdlLmpzIiwiZGV2L3N0YXJ0LmpzIiwiZGV2L3VpL2luZGV4LmpzIiwiZGV2L3VpL2xheW91dC9pbmRleC5qcyIsImRldi91aS9ub3RpZmljYXRpb25zL2FsZXJ0LmpzIiwiZGV2L3VpL25vdGlmaWNhdGlvbnMvaW5kZXguanMiLCJkZXYvdWkvbm90aWZpY2F0aW9ucy9ub3RpZnkuanMiLCJkZXYvdWkvcG9seWZpbGxzL2RldGFpbHMuanMiLCJkZXYvdWkvcG9seWZpbGxzL3RlbXBsYXRlLmpzIiwiZGV2L3VpL3RlbXBsYXRlLmpzIiwibm9kZV9tb2R1bGVzL2Fzc2VydC9hc3NlcnQuanMiLCJub2RlX21vZHVsZXMvY29uc29sZS1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RhdGUtbm93L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy91dGlsL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMWVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImNvbnN0IGJvdCA9IHJlcXVpcmUoJ2JvdCcpO1xyXG5jb25zdCBib3RfY29uc29sZSA9IHJlcXVpcmUoJy4vY29uc29sZScpO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBhamF4ID0gcmVxdWlyZSgnbGlicmFyaWVzL2FqYXgnKTtcclxuY29uc3QgYXBpID0gcmVxdWlyZSgnbGlicmFyaWVzL2Jsb2NraGVhZHMnKTtcclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcblxyXG4vLyBBcnJheSBvZiBJRHMgdG8gYXV0b2xvYWQgYXQgdGhlIG5leHQgbGF1bmNoLlxyXG52YXIgYXV0b2xvYWQgPSBbXTtcclxudmFyIGxvYWRlZCA9IFtdO1xyXG5jb25zdCBTVE9SQUdFX0lEID0gJ21iX2V4dGVuc2lvbnMnO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGNyZWF0ZSBhIG5ldyBleHRlbnNpb24uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB0ZXN0ID0gTWVzc2FnZUJvdEV4dGVuc2lvbigndGVzdCcpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZXNwYWNlIC0gU2hvdWxkIGJlIHRoZSBzYW1lIGFzIHlvdXIgdmFyaWFibGUgbmFtZS5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gW3VuaW5zdGFsbCA9IHVuZGVmaW5lZF0gLSBPcHRpb25hbCwgc3BlY2lmeSB0aGUgdW5pbnN0YWxsIGZ1bmN0aW9uIHdoaWxlIGNyZWF0aW5nIHRoZSBleHRlbnNpb24sIGluc3RlYWQgb2YgbGF0ZXIuIElmIHNwZWNpZmllZCBoZXJlLCB0aGlzIHdpbGwgYmUgYm91bmQgdG8gdGhlIGV4dGVuc2lvbi5cclxuICogQHJldHVybiB7TWVzc2FnZUJvdEV4dGVuc2lvbn0gLSBUaGUgZXh0ZW5zaW9uIHZhcmlhYmxlLlxyXG4gKi9cclxuZnVuY3Rpb24gTWVzc2FnZUJvdEV4dGVuc2lvbihuYW1lc3BhY2UsIHVuaW5zdGFsbCkge1xyXG4gICAgbG9hZGVkLnB1c2gobmFtZXNwYWNlKTtcclxuICAgIGhvb2suZmlyZSgnZXh0ZW5zaW9uLmluc3RhbGwnLCBuYW1lc3BhY2UpO1xyXG5cclxuICAgIHZhciBleHRlbnNpb24gPSB7XHJcbiAgICAgICAgaWQ6IG5hbWVzcGFjZSxcclxuICAgICAgICBib3QsXHJcbiAgICAgICAgY29uc29sZTogYm90X2NvbnNvbGUsXHJcbiAgICAgICAgdWksXHJcbiAgICAgICAgc3RvcmFnZSxcclxuICAgICAgICBhamF4LFxyXG4gICAgICAgIGFwaSxcclxuICAgICAgICB3b3JsZCxcclxuICAgICAgICBob29rLFxyXG4gICAgfTtcclxuXHJcbiAgICBpZiAodHlwZW9mIHVuaW5zdGFsbCA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgZXh0ZW5zaW9uLnVuaW5zdGFsbCA9IHVuaW5zdGFsbC5iaW5kKGV4dGVuc2lvbik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBVc2VkIHRvIGNoYW5nZSB3aGV0aGVyIG9yIG5vdCB0aGUgZXh0ZW5zaW9uIHdpbGwgYmVcclxuICAgICAqIEF1dG9tYXRpY2FsbHkgbG9hZGVkIHRoZSBuZXh0IHRpbWUgdGhlIGJvdCBpcyBsYXVuY2hlZC5cclxuICAgICAqXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogdmFyIHRlc3QgPSBNZXNzYWdlQm90RXh0ZW5zaW9uKCd0ZXN0Jyk7XHJcbiAgICAgKiB0ZXN0LnNldEF1dG9MYXVuY2godHJ1ZSk7XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2x9IHNob3VsZEF1dG9sb2FkXHJcbiAgICAgKi9cclxuICAgIGV4dGVuc2lvbi5zZXRBdXRvTGF1bmNoID0gZnVuY3Rpb24gc2V0QXV0b0xhdW5jaChzaG91bGRBdXRvbG9hZCkge1xyXG4gICAgICAgIGlmICghYXV0b2xvYWQuaW5jbHVkZXMobmFtZXNwYWNlKSAmJiBzaG91bGRBdXRvbG9hZCkge1xyXG4gICAgICAgICAgICBhdXRvbG9hZC5wdXNoKG5hbWVzcGFjZSk7XHJcbiAgICAgICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGF1dG9sb2FkLCBmYWxzZSk7XHJcbiAgICAgICAgfSBlbHNlIGlmICghc2hvdWxkQXV0b2xvYWQpIHtcclxuICAgICAgICAgICAgaWYgKGF1dG9sb2FkLmluY2x1ZGVzKG5hbWVzcGFjZSkpIHtcclxuICAgICAgICAgICAgICAgIGF1dG9sb2FkLnNwbGljZShhdXRvbG9hZC5pbmRleE9mKG5hbWVzcGFjZSksIDEpO1xyXG4gICAgICAgICAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgYXV0b2xvYWQsIGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIGV4dGVuc2lvbjtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRyaWVzIHRvIGxvYWQgdGhlIHJlcXVlc3RlZCBleHRlbnNpb24gYnkgSUQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxyXG4gKi9cclxuTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsID0gZnVuY3Rpb24gaW5zdGFsbChpZCkge1xyXG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XHJcbiAgICBlbC5zcmMgPSBgLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9leHRlbnNpb24vJHtpZH0vY29kZS9yYXdgO1xyXG4gICAgZWwuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcclxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVuaW5zdGFsbHMgYW4gZXh0ZW5zaW9uLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcclxuICovXHJcbk1lc3NhZ2VCb3RFeHRlbnNpb24udW5pbnN0YWxsID0gZnVuY3Rpb24gdW5pbnN0YWxsKGlkKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHdpbmRvd1tpZF0udW5pbnN0YWxsKCk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgLy9Ob3QgaW5zdGFsbGVkLCBvciBubyB1bmluc3RhbGwgZnVuY3Rpb24uXHJcbiAgICB9XHJcblxyXG4gICAgd2luZG93W2lkXSA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICBpZiAoYXV0b2xvYWQuaW5jbHVkZXMoaWQpKSB7XHJcbiAgICAgICAgYXV0b2xvYWQuc3BsaWNlKGF1dG9sb2FkLmluZGV4T2YoaWQpLCAxKTtcclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBhdXRvbG9hZCwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChsb2FkZWQuaW5jbHVkZXMoaWQpKSB7XHJcbiAgICAgICAgbG9hZGVkLnNwbGljZShsb2FkZWQuaW5kZXhPZihpZCksIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIGhvb2suZmlyZSgnZXh0ZW5zaW9uLnVuaW5zdGFsbCcsIGlkKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGNoZWNrIGlmIGFuIGV4dGVuc2lvbiBoYXMgYmVlbiBsb2FkZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuTWVzc2FnZUJvdEV4dGVuc2lvbi5pc0xvYWRlZCA9IGZ1bmN0aW9uIGlzTG9hZGVkKGlkKSB7XHJcbiAgICByZXR1cm4gbG9hZGVkLmluY2x1ZGVzKGlkKTtcclxufTtcclxuXHJcbi8vIExvYWQgZXh0ZW5zaW9ucyB0aGF0IHNldCB0aGVtc2VsdmVzIHRvIGF1dG9sb2FkIGxhc3QgbGF1bmNoLlxyXG5zdG9yYWdlLmdldE9iamVjdChTVE9SQUdFX0lELCBbXSwgZmFsc2UpXHJcbiAgICAuZm9yRWFjaChNZXNzYWdlQm90RXh0ZW5zaW9uLmluc3RhbGwpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNZXNzYWdlQm90RXh0ZW5zaW9uO1xyXG4iLCIvKipcclxuICogQGZpbGUgRGVwcmljYXRlZC4gVXNlIHdvcmxkLmlzW0dyb3VwXSBpbnN0ZWFkLlxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgY2hlY2tHcm91cFxyXG59O1xyXG5cclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBjaGVjayBpZiB1c2VycyBhcmUgaW4gZGVmaW5lZCBncm91cHMuXHJcbiAqXHJcbiAqIEBkZXByaWNhdGVkXHJcbiAqIEBleGFtcGxlXHJcbiAqIGNoZWNrR3JvdXAoJ2FkbWluJywgJ1NFUlZFUicpIC8vIHRydWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwIHRoZSBncm91cCB0byBjaGVja1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdXNlciB0byBjaGVja1xyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tHcm91cChncm91cCwgbmFtZSkge1xyXG4gICAgY29uc29sZS53YXJuKCdib3QuY2hlY2tHcm91cCBpcyBkZXByaWNhdGVkLiBVc2Ugd29ybGQuaXNBZG1pbiwgd29ybGQuaXNNb2QsIGV0Yy4gaW5zdGVhZCcpO1xyXG5cclxuICAgIG5hbWUgPSBuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICBzd2l0Y2ggKGdyb3VwLnRvTG9jYWxlTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICBjYXNlICdhbGwnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNQbGF5ZXIobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnYWRtaW4nOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNBZG1pbihuYW1lKTtcclxuICAgICAgICBjYXNlICdtb2QnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNNb2QobmFtZSk7XHJcbiAgICAgICAgY2FzZSAnc3RhZmYnOlxyXG4gICAgICAgICAgICByZXR1cm4gd29ybGQuaXNTdGFmZihuYW1lKTtcclxuICAgICAgICBjYXNlICdvd25lcic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc093bmVyKG5hbWUpO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG4iLCJjb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuXHJcbmNvbnN0IGJvdCA9IE9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vc2VuZCcpLFxyXG4gICAgcmVxdWlyZSgnLi9jaGVja0dyb3VwJylcclxuKTtcclxuXHJcbmJvdC52ZXJzaW9uID0gJzYuMS4wYSc7XHJcblxyXG4vKipcclxuICogQGRlcHJpY2F0ZWQgc2luY2UgNi4xLjAuIFVzZSBleC53b3JsZCBpbnN0ZWFkLlxyXG4gKi9cclxuYm90LndvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5zdG9yYWdlLnNldCgnbWJfdmVyc2lvbicsIGJvdC52ZXJzaW9uKTtcclxuIiwiZnVuY3Rpb24gdXBkYXRlKGtleXMsIG9wZXJhdG9yKSB7XHJcbiAgICBPYmplY3Qua2V5cyhsb2NhbFN0b3JhZ2UpLmZvckVhY2goaXRlbSA9PiB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IG9mIGtleXMpIHtcclxuICAgICAgICAgICAgaWYgKGl0ZW0uc3RhcnRzV2l0aChrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShpdGVtLCBvcGVyYXRvcihsb2NhbFN0b3JhZ2UuZ2V0SXRlbShpdGVtKSkpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy9qc2hpbnQgLVcwODZcclxuLy9ObyBicmVhayBzdGF0ZW1lbnRzIGFzIHdlIHdhbnQgdG8gZXhlY3V0ZSBhbGwgdXBkYXRlcyBhZnRlciBtYXRjaGVkIHZlcnNpb24gdW5sZXNzIG90aGVyd2lzZSBub3RlZC5cclxuc3dpdGNoIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnbWJfdmVyc2lvbicpKSB7XHJcbiAgICBjYXNlIG51bGw6XHJcbiAgICAgICAgYnJlYWs7IC8vTm90aGluZyB0byBtaWdyYXRlXHJcbiAgICBjYXNlICc1LjIuMCc6XHJcbiAgICBjYXNlICc1LjIuMSc6XHJcbiAgICAgICAgLy9XaXRoIDYuMCwgbmV3bGluZXMgYXJlIGRpcmVjdGx5IHN1cHBvcnRlZCBpbiBtZXNzYWdlcyBieSB0aGUgYm90LlxyXG4gICAgICAgIHVwZGF0ZShbJ2Fubm91bmNlbWVudEFycicsICdqb2luQXJyJywgJ2xlYXZlQXJyJywgJ3RyaWdnZXJBcnInXSwgZnVuY3Rpb24ocmF3KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VkID0gSlNPTi5wYXJzZShyYXcpO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobXNnLm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbXNnLm1lc3NhZ2UgPSBtc2cubWVzc2FnZS5yZXBsYWNlKC9cXFxcbi9nLCAnXFxuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocGFyc2VkKTtcclxuICAgICAgICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYnJlYWs7IC8vTmV4dCBidWdmaXggb25seSByZWxhdGVzIHRvIDYuMCBib3QuXHJcbiAgICBjYXNlICc2LjAuMGEnOlxyXG4gICAgY2FzZSAnNi4wLjAnOlxyXG4gICAgICAgIGFsZXJ0KFwiRHVlIHRvIGEgYnVnIGluIHRoZSA2LjAuMCB2ZXJzaW9uIG9mIHRoZSBib3QsIHlvdXIgam9pbiBhbmQgbGVhdmUgbWVzc2FnZXMgbWF5IGJlIHN3YXBwZWQuIFNvcnJ5ISBUaGlzIGNhbm5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5LiBUaGlzIG1lc3NhZ2Ugd2lsbCBub3QgYmUgc2hvd24gYWdhaW4uXCIpO1xyXG4gICAgICAgIGJyZWFrOyAvL05leHQgYnVnZml4IG9ubHkgcmVsYXRlcyB0byA2LjAuMSAvIDYuMC4yLlxyXG4gICAgY2FzZSAnNi4wLjEnOlxyXG4gICAgY2FzZSAnNi4wLjInOlxyXG4gICAgICAgIGFsZXJ0KFwiRHVlIHRvIGEgYnVnIGluIDYuMC4xIC8gNi4wLjIsIGdyb3VwcyBtYXkgaGF2ZSBiZWVuIG1peGVkIHVwIG9uIEpvaW4sIExlYXZlLCBhbmQgVHJpZ2dlciBtZXNzYWdlcy4gU29ycnkhIFRoaXMgY2Fubm90IGJlIGZpeGVkIGF1dG9tYXRpY2FsbHkgaWYgaXQgb2NjdXJlZCBvbiB5b3VyIGJvdC4gQW5ub3VuY2VtZW50cyBoYXZlIGFsc28gYmVlbiBmaXhlZC5cIik7XHJcbiAgICBjYXNlICc2LjAuMyc6XHJcbiAgICBjYXNlICc2LjAuNCc6XHJcbiAgICBjYXNlICc2LjAuNSc6XHJcbiAgICBjYXNlICc2LjEuMGEnOlxyXG4gICAgICAgIC8vTm9ybWFsaXplIGdyb3VwcyB0byBsb3dlciBjYXNlLlxyXG4gICAgICAgIHVwZGF0ZShbJ2pvaW5BcnInLCAnbGVhdmVBcnInLCAndHJpZ2dlckFyciddLCBmdW5jdGlvbihyYXcpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGxldCBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdyk7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIG1zZy5ncm91cCA9IG1zZy5ncm91cC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1zZy5ub3RfZ3JvdXAgPSBtc2cubm90X2dyb3VwLnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXJzZWQpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbn1cclxuLy9qc2hpbnQgK1cwODZcclxuIiwidmFyIGFwaSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ibG9ja2hlYWRzJyk7XHJcbnZhciBzZXR0aW5ncyA9IHJlcXVpcmUoJ3NldHRpbmdzJyk7XHJcblxyXG52YXIgcXVldWUgPSBbXTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2VuZCxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHF1ZXVlIGEgbWVzc2FnZSB0byBiZSBzZW50LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZW5kKCdIZWxsbyEnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gYmUgc2VudC5cclxuICovXHJcbmZ1bmN0aW9uIHNlbmQobWVzc2FnZSkge1xyXG4gICAgaWYgKHNldHRpbmdzLnNwbGl0TWVzc2FnZXMpIHtcclxuICAgICAgICAvL0ZJWE1FOiBJZiB0aGUgYmFja3NsYXNoIGJlZm9yZSB0aGUgdG9rZW4gaXMgZXNjYXBlZCBieSBhbm90aGVyIGJhY2tzbGFzaCB0aGUgdG9rZW4gc2hvdWxkIHN0aWxsIHNwbGl0IHRoZSBtZXNzYWdlLlxyXG4gICAgICAgIGxldCBzdHIgPSBtZXNzYWdlLnNwbGl0KHNldHRpbmdzLnNwbGl0VG9rZW4pO1xyXG4gICAgICAgIGxldCB0b1NlbmQgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGN1cnIgPSBzdHJbaV07XHJcbiAgICAgICAgICAgIGlmIChjdXJyW2N1cnIubGVuZ3RoIC0gMV0gPT0gJ1xcXFwnICYmIGkgPCBzdHIubGVuZ3RoICsgMSkge1xyXG4gICAgICAgICAgICAgICAgY3VyciArPSBzZXR0aW5ncy5zcGxpdFRva2VuICsgc3RyWysraV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdG9TZW5kLnB1c2goY3Vycik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b1NlbmQuZm9yRWFjaChtc2cgPT4gcXVldWUucHVzaChtc2cpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcXVldWUucHVzaChtZXNzYWdlKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFdhdGNoZXMgdGhlIHF1ZXVlIGZvciBuZXcgbWVzc2FnZXMgdG8gc2VuZCBhbmQgc2VuZHMgdGhlbSBhcyBzb29uIGFzIHBvc3NpYmxlLlxyXG4gKi9cclxuKGZ1bmN0aW9uIGNoZWNrUXVldWUoKSB7XHJcbiAgICBpZiAoIXF1ZXVlLmxlbmd0aCkge1xyXG4gICAgICAgIHNldFRpbWVvdXQoY2hlY2tRdWV1ZSwgNTAwKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgYXBpLnNlbmQocXVldWUuc2hpZnQoKSlcclxuICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcilcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2tRdWV1ZSwgMTAwMCk7XHJcbiAgICAgICAgfSk7XHJcbn0oKSk7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgd3JpdGUsXHJcbiAgICBjbGVhclxyXG59O1xyXG5cclxuZnVuY3Rpb24gd3JpdGUobXNnLCBuYW1lID0gJycsIG5hbWVDbGFzcyA9ICcnKSB7XHJcbiAgICB2YXIgbXNnRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgaWYgKG5hbWVDbGFzcykge1xyXG4gICAgICAgIG1zZ0VsLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBuYW1lQ2xhc3MpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBuYW1lRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICBuYW1lRWwudGV4dENvbnRlbnQgPSBuYW1lO1xyXG5cclxuICAgIHZhciBjb250ZW50RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XHJcbiAgICBpZiAobmFtZSkge1xyXG4gICAgICAgIGNvbnRlbnRFbC50ZXh0Q29udGVudCA9IGA6ICR7bXNnfWA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnRlbnRFbC50ZXh0Q29udGVudCA9IG1zZztcclxuICAgIH1cclxuICAgIG1zZ0VsLmFwcGVuZENoaWxkKG5hbWVFbCk7XHJcbiAgICBtc2dFbC5hcHBlbmRDaGlsZChjb250ZW50RWwpO1xyXG5cclxuICAgIHZhciBjaGF0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2NvbnNvbGUgdWwnKTtcclxuICAgIGNoYXQuYXBwZW5kQ2hpbGQobXNnRWwpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbGVhcigpIHtcclxuICAgIHZhciBjaGF0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2NvbnNvbGUgdWwnKTtcclxuICAgIGNoYXQuaW5uZXJIVE1MID0gJyc7XHJcbn1cclxuIiwiY29uc3Qgc2VsZiA9IG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9leHBvcnRzJyk7XHJcblxyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuY29uc3Qgc2VuZCA9IHJlcXVpcmUoJ2JvdCcpLnNlbmQ7XHJcbmNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcblxyXG5cclxuLy8gVE9ETzogUGFyc2UgdGhlc2UgYW5kIHByb3ZpZGUgb3B0aW9ucyB0byBzaG93L2hpZGUgZGlmZmVyZW50IG9uZXMuXHJcbmhvb2sub24oJ3dvcmxkLm90aGVyJywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgc2VsZi53cml0ZShtZXNzYWdlLCB1bmRlZmluZWQsICdvdGhlcicpO1xyXG59KTtcclxuXHJcbmhvb2sub24oJ3dvcmxkLm1lc3NhZ2UnLCBmdW5jdGlvbihuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICBsZXQgbXNnQ2xhc3MgPSAncGxheWVyJztcclxuICAgIGlmICh3b3JsZC5pc1N0YWZmKG5hbWUpKSB7XHJcbiAgICAgICAgbXNnQ2xhc3MgPSAnc3RhZmYnO1xyXG4gICAgICAgIGlmICh3b3JsZC5pc01vZChuYW1lKSkge1xyXG4gICAgICAgICAgICBtc2dDbGFzcyArPSAnIG1vZCc7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy9IYXMgdG8gYmUgYWRtaW5cclxuICAgICAgICAgICAgbXNnQ2xhc3MgKz0gJyBhZG1pbic7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpKSB7XHJcbiAgICAgICAgbXNnQ2xhc3MgKz0gJyBjb21tYW5kJztcclxuICAgIH1cclxuICAgIHNlbGYud3JpdGUobWVzc2FnZSwgbmFtZSwgbXNnQ2xhc3MpO1xyXG59KTtcclxuXHJcbmhvb2sub24oJ3dvcmxkLnNlcnZlcmNoYXQnLCBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICBzZWxmLndyaXRlKG1lc3NhZ2UsICdTRVJWRVInLCAnYWRtaW4nKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5zZW5kJywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpKSB7XHJcbiAgICAgICAgc2VsZi53cml0ZShtZXNzYWdlLCAnU0VSVkVSJywgJ2FkbWluIGNvbW1hbmQnKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vL01lc3NhZ2UgaGFuZGxlcnNcclxuaG9vay5vbignd29ybGQuam9pbicsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckpvaW4obmFtZSwgaXApIHtcclxuICAgIHNlbGYud3JpdGUoYCR7bmFtZX0gKCR7aXB9KSBoYXMgam9pbmVkIHRoZSBzZXJ2ZXJgLCAnU0VSVkVSJywgJ2pvaW4gd29ybGQgYWRtaW4nKTtcclxufSk7XHJcblxyXG5ob29rLm9uKCd3b3JsZC5sZWF2ZScsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckxlYXZlKG5hbWUpIHtcclxuICAgIHNlbGYud3JpdGUoYCR7bmFtZX0gaGFzIGxlZnQgdGhlIHNlcnZlcmAsICdTRVJWRVInLCBgbGVhdmUgd29ybGQgYWRtaW5gKTtcclxufSk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignQ29uc29sZScpO1xyXG4vLyBPcmRlciBpcyBpbXBvcnRhbnQgaGVyZS5cclxuXHJcbnRhYi5pbm5lckhUTUwgPSAnPHN0eWxlPicgK1xyXG4gICAgXCIjbWJfY29uc29sZSAuY2hhdHtoZWlnaHQ6Y2FsYygxMDB2aCAtIDIyMHB4KX1AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA2NjhweCl7I21iX2NvbnNvbGUgLmNoYXR7aGVpZ2h0OmNhbGMoMTAwdmggLSAxNTVweCl9fSNtYl9jb25zb2xlIHVse2hlaWdodDoxMDAlO292ZXJmbG93LXk6YXV0bzttYXJnaW46MDtwYWRkaW5nOjB9I21iX2NvbnNvbGUgbGl7bGlzdC1zdHlsZS10eXBlOm5vbmV9I21iX2NvbnNvbGUgLmNvbnRyb2xze2Rpc3BsYXk6ZmxleDtwYWRkaW5nOjAgMTBweH0jbWJfY29uc29sZSBpbnB1dCwjbWJfY29uc29sZSBidXR0b257bWFyZ2luOjVweCAwfSNtYl9jb25zb2xlIGlucHV0e2ZvbnQtc2l6ZToxZW07cGFkZGluZzoxcHg7ZmxleDoxO2JvcmRlcjpzb2xpZCAxcHggIzk5OX0jbWJfY29uc29sZSBidXR0b257YmFja2dyb3VuZDojMTgyYjczO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6I2ZmZjtib3JkZXI6MDtoZWlnaHQ6NDBweDtwYWRkaW5nOjFweCA0cHh9I21iX2NvbnNvbGUgLm1vZD5zcGFuOmZpcnN0LWNoaWxke2NvbG9yOiMwNWY1Mjl9I21iX2NvbnNvbGUgLmFkbWluPnNwYW46Zmlyc3QtY2hpbGR7Y29sb3I6IzJiMjZiZH1cXG5cIiArXHJcbiAgICAnPC9zdHlsZT4nICtcclxuICAgIFwiPGRpdiBpZD1cXFwibWJfY29uc29sZVxcXCI+XFxyXFxuICAgIDxkaXYgY2xhc3M9XFxcImNoYXRcXFwiPlxcclxcbiAgICAgICAgPHVsPjwvdWw+XFxyXFxuICAgIDwvZGl2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJjb250cm9sc1xcXCI+XFxyXFxuICAgICAgICA8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIvPjxidXR0b24+U0VORDwvYnV0dG9uPlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcblxyXG4vLyBBdXRvIHNjcm9sbCB3aGVuIG5ldyBtZXNzYWdlcyBhcmUgYWRkZWQgdG8gdGhlIHBhZ2UsIHVubGVzcyB0aGUgb3duZXIgaXMgcmVhZGluZyBvbGQgY2hhdC5cclxuKG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIHNob3dOZXdDaGF0KCkge1xyXG4gICAgbGV0IGNvbnRhaW5lciA9IHRhYi5xdWVyeVNlbGVjdG9yKCd1bCcpO1xyXG4gICAgbGV0IGxhc3RMaW5lID0gdGFiLnF1ZXJ5U2VsZWN0b3IoJ2xpOmxhc3QtY2hpbGQnKTtcclxuXHJcbiAgICBpZiAoIWNvbnRhaW5lciB8fCAhbGFzdExpbmUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvbnRhaW5lci5zY3JvbGxIZWlnaHQgLSBjb250YWluZXIuY2xpZW50SGVpZ2h0IC0gY29udGFpbmVyLnNjcm9sbFRvcCA8PSBsYXN0TGluZS5jbGllbnRIZWlnaHQgKiAyKSB7XHJcbiAgICAgICAgbGFzdExpbmUuc2Nyb2xsSW50b1ZpZXcoZmFsc2UpO1xyXG4gICAgfVxyXG59KSkub2JzZXJ2ZSh0YWIucXVlcnlTZWxlY3RvcignLmNoYXQnKSwge2NoaWxkTGlzdDogdHJ1ZX0pO1xyXG5cclxuXHJcbi8vIFJlbW92ZSBvbGQgY2hhdCB0byByZWR1Y2UgbWVtb3J5IHVzYWdlXHJcbihuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiByZW1vdmVPbGRDaGF0KCkge1xyXG4gICAgdmFyIGNoYXQgPSB0YWIucXVlcnlTZWxlY3RvcigndWwnKTtcclxuXHJcbiAgICB3aGlsZSAoY2hhdC5jaGlsZHJlbi5sZW5ndGggPiA1MDApIHtcclxuICAgICAgICBjaGF0LmNoaWxkcmVuWzBdLnJlbW92ZSgpO1xyXG4gICAgfVxyXG59KSkub2JzZXJ2ZSh0YWIucXVlcnlTZWxlY3RvcignLmNoYXQnKSwge2NoaWxkTGlzdDogdHJ1ZX0pO1xyXG5cclxuLy8gTGlzdGVuIGZvciB0aGUgdXNlciB0byBzZW5kIG1lc3NhZ2VzXHJcbmZ1bmN0aW9uIHVzZXJTZW5kKCkge1xyXG4gICAgdmFyIGlucHV0ID0gdGFiLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XHJcbiAgICBob29rLmZpcmUoJ2NvbnNvbGUuc2VuZCcsIGlucHV0LnZhbHVlKTtcclxuICAgIHNlbmQoaW5wdXQudmFsdWUpO1xyXG4gICAgaW5wdXQudmFsdWUgPSAnJztcclxuICAgIGlucHV0LmZvY3VzKCk7XHJcbn1cclxuXHJcbnRhYi5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgaWYgKGV2ZW50LmtleSA9PSBcIkVudGVyXCIgfHwgZXZlbnQua2V5Q29kZSA9PSAxMykge1xyXG4gICAgICAgIHVzZXJTZW5kKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxudGFiLnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdXNlclNlbmQpO1xyXG4iLCJjb25zdCBiaGZhbnNhcGkgPSByZXF1aXJlKCdsaWJyYXJpZXMvYmhmYW5zYXBpJyk7XHJcbmNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IE1lc3NhZ2VCb3RFeHRlbnNpb24gPSByZXF1aXJlKCdNZXNzYWdlQm90RXh0ZW5zaW9uJyk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignRXh0ZW5zaW9ucycpO1xyXG50YWIuaW5uZXJIVE1MID0gJzxzdHlsZT4nICtcclxuICAgIFwiI21iX2V4dGVuc2lvbnMgLnRvcC1yaWdodC1idXR0b257d2lkdGg6aW5oZXJpdDtwYWRkaW5nOjAgN3B4fSNtYl9leHRlbnNpb25zIGgze21hcmdpbjowIDAgNXB4IDB9I2V4dHN7ZGlzcGxheTpmbGV4O2ZsZXgtZmxvdzpyb3cgd3JhcDtib3JkZXItdG9wOjFweCBzb2xpZCAjMDAwfSNleHRzIGg0LCNleHRzIHB7bWFyZ2luOjB9I2V4dHMgYnV0dG9ue3Bvc2l0aW9uOmFic29sdXRlO2JvdHRvbTo3cHg7cGFkZGluZzo0cHggOHB4O2JvcmRlci1yYWRpdXM6OHB4O2JhY2tncm91bmQ6I2ZmZn0jZXh0cz5kaXZ7cG9zaXRpb246cmVsYXRpdmU7aGVpZ2h0OjEzMHB4O3dpZHRoOmNhbGMoMzMlIC0gMTlweCk7bWluLXdpZHRoOjI4MHB4O3BhZGRpbmc6NXB4O21hcmdpbi1sZWZ0OjVweDttYXJnaW4tYm90dG9tOjVweDtib3JkZXI6M3B4IHNvbGlkICM5OTk7Ym9yZGVyLXJhZGl1czoxMHB4fSNleHRzPmRpdjpudGgtY2hpbGQob2RkKXtiYWNrZ3JvdW5kOiNjY2N9XFxuXCIgK1xyXG4gICAgJzwvc3R5bGU+JyArXHJcbiAgICBcIjx0ZW1wbGF0ZSBpZD1cXFwiZXh0VGVtcGxhdGVcXFwiPlxcclxcbiAgICA8ZGl2PlxcclxcbiAgICAgICAgPGg0PlRpdGxlPC9oND5cXHJcXG4gICAgICAgIDxzcGFuPkRlc2NyaXB0aW9uPC9zcGFuPjxicj5cXHJcXG4gICAgICAgIDxidXR0b24gY2xhc3M9XFxcImJ1dHRvblxcXCI+SW5zdGFsbDwvYnV0dG9uPlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2V4dGVuc2lvbnNcXFwiIGRhdGEtdGFiLW5hbWU9XFxcImV4dGVuc2lvbnNcXFwiPlxcclxcbiAgICA8aDM+RXh0ZW5zaW9ucyBjYW4gaW5jcmVhc2UgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgdGhlIGJvdC48L2gzPlxcclxcbiAgICA8c3Bhbj5JbnRlcmVzdGVkIGluIGNyZWF0aW5nIG9uZT8gPGEgaHJlZj1cXFwiaHR0cHM6Ly9naXRodWIuY29tL0JpYmxpb2ZpbGUvQmxvY2toZWFkcy1NZXNzYWdlQm90L3dpa2kvMi4tRGV2ZWxvcG1lbnQ6LVN0YXJ0LUhlcmVcXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5TdGFydCBoZXJlLjwvYT48L3NwYW4+XFxyXFxuICAgIDxzcGFuIGNsYXNzPVxcXCJ0b3AtcmlnaHQtYnV0dG9uXFxcIj5Mb2FkIEJ5IElEL1VSTDwvc3Bhbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwiZXh0c1xcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG4vL0NyZWF0ZSB0aGUgZXh0ZW5zaW9uIHN0b3JlIHBhZ2VcclxuYmhmYW5zYXBpLmdldFN0b3JlKCkudGhlbihyZXNwID0+IHtcclxuICAgIGlmIChyZXNwLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V4dHMnKS5pbm5lckhUTUwgKz0gcmVzcC5tZXNzYWdlO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gICAgcmVzcC5leHRlbnNpb25zLmZvckVhY2goZXh0ZW5zaW9uID0+IHtcclxuICAgICAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNleHRUZW1wbGF0ZScsICcjZXh0cycsIFtcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnaDQnLCB0ZXh0OiBleHRlbnNpb24udGl0bGV9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdzcGFuJywgaHRtbDogZXh0ZW5zaW9uLnNuaXBwZXR9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdkaXYnLCAnZGF0YS1pZCc6IGV4dGVuc2lvbi5pZH0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ2J1dHRvbicsIHRleHQ6IE1lc3NhZ2VCb3RFeHRlbnNpb24uaXNMb2FkZWQoZXh0ZW5zaW9uLmlkKSA/ICdSZW1vdmUnIDogJ0luc3RhbGwnfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcbn0pLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcik7XHJcblxyXG4vLyBJbnN0YWxsIC8gdW5pbnN0YWxsIGV4dGVuc2lvbnNcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2V4dHMnKVxyXG4gICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gZXh0QWN0aW9ucyhlKSB7XHJcbiAgICAgICAgaWYgKGUudGFyZ2V0LnRhZ05hbWUgIT0gJ0JVVFRPTicpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZWwgPSBlLnRhcmdldDtcclxuICAgICAgICB2YXIgaWQgPSBlbC5wYXJlbnRFbGVtZW50LmRhdGFzZXQuaWQ7XHJcblxyXG4gICAgICAgIGlmIChlbC50ZXh0Q29udGVudCA9PSAnSW5zdGFsbCcpIHtcclxuICAgICAgICAgICAgTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsKGlkKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBNZXNzYWdlQm90RXh0ZW5zaW9uLnVuaW5zdGFsbChpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG5cclxuaG9vay5vbignZXh0ZW5zaW9uLmluc3RhbGwnLCBmdW5jdGlvbihpZCkge1xyXG4gICAgLy8gU2hvdyByZW1vdmUgdG8gbGV0IHVzZXJzIHJlbW92ZSBleHRlbnNpb25zXHJcbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI21iX2V4dGVuc2lvbnMgW2RhdGEtaWQ9XCIke2lkfVwiXSBidXR0b25gKTtcclxuICAgIGlmIChidXR0b24pIHtcclxuICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnUmVtb3ZlJztcclxuICAgIH1cclxufSk7XHJcblxyXG5ob29rLm9uKCdleHRlbnNpb24udW5pbnN0YWxsJywgZnVuY3Rpb24oaWQpIHtcclxuICAgIC8vIFNob3cgcmVtb3ZlZCBmb3Igc3RvcmUgaW5zdGFsbCBidXR0b25cclxuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbWJfZXh0ZW5zaW9ucyBbZGF0YS1pZD1cIiR7aWR9XCJdIGJ1dHRvbmApO1xyXG4gICAgaWYgKGJ1dHRvbikge1xyXG4gICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICdSZW1vdmVkJztcclxuICAgICAgICBidXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnSW5zdGFsbCc7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIH0sIDMwMDApO1xyXG4gICAgfVxyXG59KTtcclxuIiwiLy9UT0RPOiBVc2UgZmV0Y2hcclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIEdFVCBhIHBhZ2UuIFBhc3NlcyB0aGUgcmVzcG9uc2Ugb2YgdGhlIFhIUiBpbiB0aGUgcmVzb2x2ZSBwcm9taXNlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL3NlbmRzIGEgR0VUIHJlcXVlc3QgdG8gL3NvbWUvdXJsLnBocD9hPXRlc3RcclxuICogZ2V0KCcvc29tZS91cmwucGhwJywge2E6ICd0ZXN0J30pLnRoZW4oY29uc29sZS5sb2cpXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtc1N0clxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0KHVybCA9ICcvJywgcGFyYW1zID0ge30pIHtcclxuICAgIGlmIChPYmplY3Qua2V5cyhwYXJhbXMpLmxlbmd0aCkge1xyXG4gICAgICAgIHZhciBhZGRpdGlvbiA9IHVybFN0cmluZ2lmeShwYXJhbXMpO1xyXG4gICAgICAgIGlmICh1cmwuaW5jbHVkZXMoJz8nKSkge1xyXG4gICAgICAgICAgICB1cmwgKz0gYCYke2FkZGl0aW9ufWA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdXJsICs9IGA/JHthZGRpdGlvbn1gO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geGhyKCdHRVQnLCB1cmwsIHt9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIGEgSlNPTiBvYmplY3QgaW4gdGhlIHByb21pc2UgcmVzb2x2ZSBtZXRob2QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtT2JqXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRKU09OKHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIGdldCh1cmwsIHBhcmFtT2JqKS50aGVuKEpTT04ucGFyc2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIG1ha2UgYSBwb3N0IHJlcXVlc3RcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW1PYmpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHBvc3QodXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4geGhyKCdQT1NUJywgdXJsLCBwYXJhbU9iaik7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gZmV0Y2ggSlNPTiBmcm9tIGEgcGFnZSB0aHJvdWdoIHBvc3QuXHJcbiAqXHJcbiAqIEBwYXJhbSBzdHJpbmcgdXJsXHJcbiAqIEBwYXJhbSBzdHJpbmcgcGFyYW1PYmpcclxuICogQHJldHVybiBQcm9taXNlXHJcbiAqL1xyXG5mdW5jdGlvbiBwb3N0SlNPTih1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiBwb3N0KHVybCwgcGFyYW1PYmopLnRoZW4oSlNPTi5wYXJzZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuKiBIZWxwZXIgZnVuY3Rpb24gdG8gbWFrZSBYSFIgcmVxdWVzdHMsIGlmIHBvc3NpYmxlIHVzZSB0aGUgZ2V0IGFuZCBwb3N0IGZ1bmN0aW9ucyBpbnN0ZWFkLlxyXG4qXHJcbiogQGRlcHJpY2F0ZWQgc2luY2UgdmVyc2lvbiA2LjFcclxuKiBAcGFyYW0gc3RyaW5nIHByb3RvY29sXHJcbiogQHBhcmFtIHN0cmluZyB1cmxcclxuKiBAcGFyYW0gb2JqZWN0IHBhcmFtT2JqIC0tIFdBUk5JTkcuIE9ubHkgYWNjZXB0cyBzaGFsbG93IG9iamVjdHMuXHJcbiogQHJldHVybiBQcm9taXNlXHJcbiovXHJcbmZ1bmN0aW9uIHhocihwcm90b2NvbCwgdXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICB2YXIgcGFyYW1TdHIgPSB1cmxTdHJpbmdpZnkocGFyYW1PYmopO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgIHZhciByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICByZXEub3Blbihwcm90b2NvbCwgdXJsKTtcclxuICAgICAgICByZXEuc2V0UmVxdWVzdEhlYWRlcignWC1SZXF1ZXN0ZWQtV2l0aCcsICdYTUxIdHRwUmVxdWVzdCcpO1xyXG4gICAgICAgIGlmIChwcm90b2NvbCA9PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgcmVxLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlcS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcS5zdGF0dXNUZXh0KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIEhhbmRsZSBuZXR3b3JrIGVycm9yc1xyXG4gICAgICAgIHJlcS5vbmVycm9yID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJlamVjdChFcnJvcihcIk5ldHdvcmsgRXJyb3JcIikpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKHBhcmFtU3RyKSB7XHJcbiAgICAgICAgICAgIHJlcS5zZW5kKHBhcmFtU3RyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXEuc2VuZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gc3RyaW5naWZ5IHVybCBwYXJhbWV0ZXJzXHJcbiAqL1xyXG5mdW5jdGlvbiB1cmxTdHJpbmdpZnkob2JqKSB7XHJcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKVxyXG4gICAgLm1hcChrID0+IGAke2VuY29kZVVSSUNvbXBvbmVudChrKX09JHtlbmNvZGVVUklDb21wb25lbnQob2JqW2tdKX1gKVxyXG4gICAgLmpvaW4oJyYnKTtcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge3hociwgZ2V0LCBnZXRKU09OLCBwb3N0LCBwb3N0SlNPTn07XHJcbiIsIi8qKlxyXG4gKiBAZmlsZSBDb250YWlucyBmdW5jdGlvbnMgdG8gaW50ZXJhY3Qgd2l0aCBibG9ja2hlYWRzZmFucy5jb20gLSBjYW5ub3QgYmUgdXNlZCBieSBleHRlbnNpb25zLlxyXG4gKi9cclxuXHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCBhamF4ID0gcmVxdWlyZSgnbGlicmFyaWVzL2FqYXgnKTtcclxuXHJcbmNvbnN0IEFQSV9VUkxTID0ge1xyXG4gICAgU1RPUkU6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2V4dGVuc2lvbi9zdG9yZScsXHJcbiAgICBOQU1FOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9leHRlbnNpb24vbmFtZScsXHJcbiAgICBFUlJPUjogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvYm90L2Vycm9yJyxcclxufTtcclxuXHJcbnZhciBjYWNoZSA9IHtcclxuICAgIG5hbWVzOiBuZXcgTWFwKCksXHJcbn07XHJcblxyXG4vKipcclxuICogVXNlZCB0byBnZXQgcHVibGljIGV4dGVuc2lvbnNcclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0U3RvcmUoKS50aGVuKHN0b3JlID0+IGNvbnNvbGUubG9nKHN0b3JlKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHVzZSB0aGUgY2FjaGVkIHJlc3BvbnNlIHNob3VsZCBiZSBjbGVhcmVkLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSByZXNvbHZlcyB3aXRoIHRoZSByZXNwb25zZVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0U3RvcmUocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0U3RvcmUpIHtcclxuICAgICAgICBjYWNoZS5nZXRTdG9yZSA9IGFqYXguZ2V0SlNPTihBUElfVVJMUy5TVE9SRSlcclxuICAgICAgICAgICAgLnRoZW4oc3RvcmUgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy9CdWlsZCB0aGUgaW5pdGlhbCBuYW1lcyBtYXBcclxuICAgICAgICAgICAgICAgIGlmIChzdG9yZS5zdGF0dXMgIT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBleCBvZiBzdG9yZS5leHRlbnNpb25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FjaGUubmFtZXMuc2V0KGV4LmlkLCBleC50aXRsZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRTdG9yZTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBuYW1lIG9mIHRoZSBwcm92aWRlZCBleHRlbnNpb24gSUQuXHJcbiAqIElmIHRoZSBleHRlbnNpb24gd2FzIG5vdCBmb3VuZCwgcmVzb2x2ZXMgd2l0aCB0aGUgb3JpZ2luYWwgcGFzc2VkIElELlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRFeHRlbnNpb25OYW1lKCd0ZXN0JykudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKG5hbWUpKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkIHRoZSBpZCB0byBzZWFyY2ggZm9yLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSByZXNvbHZlcyB3aXRoIHRoZSBleHRlbnNpb24gbmFtZS5cclxuICovXHJcbmZ1bmN0aW9uIGdldEV4dGVuc2lvbk5hbWUoaWQpIHtcclxuICAgIGlmIChjYWNoZS5uYW1lcy5oYXMoaWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjYWNoZS5uYW1lcy5nZXQoaWQpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWpheC5wb3N0SlNPTihBUElfVVJMUy5OQU1FLCB7aWR9KS50aGVuKG5hbWUgPT4ge1xyXG4gICAgICAgIGNhY2hlLm5hbWVzLnNldChpZCwgbmFtZSk7XHJcbiAgICAgICAgcmV0dXJuIG5hbWU7XHJcbiAgICB9LCBlcnIgPT4ge1xyXG4gICAgICAgIHJlcG9ydEVycm9yKGVycik7XHJcbiAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVwb3J0cyBhbiBlcnJvciBzbyB0aGF0IGl0IGNhbiBiZSByZXZpZXdlZCBhbmQgZml4ZWQgYnkgZXh0ZW5zaW9uIG9yIGJvdCBkZXZlbG9wZXJzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiByZXBvcnRFcnJvcihFcnJvcihcIlJlcG9ydCBtZVwiKSk7XHJcbiAqIEBwYXJhbSB7RXJyb3J9IGVyciB0aGUgZXJyb3IgdG8gcmVwb3J0XHJcbiAqL1xyXG5mdW5jdGlvbiByZXBvcnRFcnJvcihlcnIpIHtcclxuICAgIGFqYXgucG9zdEpTT04oQVBJX1VSTFMuRVJST1IsIHtcclxuICAgICAgICAgICAgZXJyb3JfdGV4dDogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgIGVycm9yX2ZpbGU6IGVyci5maWxlbmFtZSxcclxuICAgICAgICAgICAgZXJyb3Jfcm93OiBlcnIubGluZW5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX2NvbHVtbjogZXJyLmNvbG5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX3N0YWNrOiBlcnIuc3RhY2sgfHwgJycsXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigocmVzcCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgaG9vay5maXJlKCdlcnJvcl9yZXBvcnQnLCAnU29tZXRoaW5nIHdlbnQgd3JvbmcsIGl0IGhhcyBiZWVuIHJlcG9ydGVkLicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaG9vay5maXJlKCdlcnJvcl9yZXBvcnQnLCBgRXJyb3IgcmVwb3J0aW5nIGV4Y2VwdGlvbjogJHtyZXNwLm1lc3NhZ2V9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBnZXRTdG9yZSxcclxuICAgIGdldEV4dGVuc2lvbk5hbWUsXHJcbiAgICByZXBvcnRFcnJvcixcclxufTtcclxuIiwidmFyIGFqYXggPSByZXF1aXJlKCcuL2FqYXgnKTtcclxudmFyIGhvb2sgPSByZXF1aXJlKCcuL2hvb2snKTtcclxudmFyIGJoZmFuc2FwaSA9IHJlcXVpcmUoJy4vYmhmYW5zYXBpJyk7XHJcblxyXG5jb25zdCB3b3JsZElkID0gd2luZG93LndvcmxkSWQ7XHJcbnZhciBjYWNoZSA9IHtcclxuICAgIGZpcnN0SWQ6IDAsXHJcbn07XHJcblxyXG4vLyBVc2VkIHRvIHBhcnNlIG1lc3NhZ2VzIG1vcmUgYWNjdXJhdGVseVxyXG52YXIgd29ybGQgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW11cclxufTtcclxuZ2V0T25saW5lUGxheWVycygpXHJcbiAgICAudGhlbihwbGF5ZXJzID0+IHdvcmxkLnBsYXllcnMgPSBbLi4ubmV3IFNldChwbGF5ZXJzLmNvbmNhdCh3b3JsZC5wbGF5ZXJzKSldKTtcclxuXHJcbmdldFdvcmxkTmFtZSgpXHJcbiAgICAudGhlbihuYW1lID0+IHdvcmxkLm5hbWUgPSBuYW1lKTtcclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHdvcmxkU3RhcnRlZCxcclxuICAgIGdldExvZ3MsXHJcbiAgICBnZXRMaXN0cyxcclxuICAgIGdldEhvbWVwYWdlLFxyXG4gICAgZ2V0T25saW5lUGxheWVycyxcclxuICAgIGdldE93bmVyTmFtZSxcclxuICAgIGdldFdvcmxkTmFtZSxcclxuICAgIHNlbmQsXHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIHRoZSB3b3JsZCBpZiBuZWNjZXNzYXJ5LCByZWplY3RzIGlmIHRoZSB3b3JsZCB0YWtlcyB0b28gbG9uZyB0byBzdGFydCBvciBpcyB1bmF2YWlsaWJsZVxyXG4gKiBSZWZhY3RvcmluZyB3ZWxjb21lLiBUaGlzIHNlZW1zIG92ZXJseSBweXJhbWlkIGxpa2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHdvcmxkU3RhcnRlZCgpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ3N0YXJ0ZWQhJykpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWNoZWNrIGlmIHRoZSB3b3JsZCBpcyBzdGFydGVkLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gd29ybGRTdGFydGVkKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLndvcmxkU3RhcnRlZCkge1xyXG4gICAgICAgIGNhY2hlLndvcmxkU3RhcnRlZCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdmFyIGZhaWxzID0gMDtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uIGNoZWNrKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ291bGQgdGhpcyBiZSBtb3JlIHNpbXBsaWZpZWQ/XHJcbiAgICAgICAgICAgICAgICBhamF4LnBvc3RKU09OKCcvYXBpJywgeyBjb21tYW5kOiAnc3RhdHVzJywgd29ybGRJZCB9KS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlc3BvbnNlLndvcmxkU3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ29ubGluZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdvZmZsaW5lJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFqYXgucG9zdEpTT04oJy9hcGknLCB7IGNvbW1hbmQ6ICdzdGFydCcsIHdvcmxkSWQgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGhlbihjaGVjaywgY2hlY2spO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3VuYXZhaWxpYmxlJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdXb3JsZCB1bmF2YWlsaWJsZS4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0YXJ0dXAnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzaHV0ZG93bic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrLCAzMDAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgrK2ZhaWxzID4gMTApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignV29ybGQgdG9vayB0b28gbG9uZyB0byBzdGFydC4nKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKCdVbmtub3duIHJlc3BvbnNlLicpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChiaGZhbnNhcGkucmVwb3J0RXJyb3IpO1xyXG4gICAgICAgICAgICB9KCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS53b3JsZFN0YXJ0ZWQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCBhbiBhcnJheSBvZiB0aGUgbG9nJ3MgbGluZXMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldExvZ3MoKS50aGVuKGxpbmVzID0+IGNvbnNvbGUubG9nKGxpbmVzWzBdKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZG93bmxvYWQgdGhlIGxvZ3NcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldExvZ3MocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0TG9ncykge1xyXG4gICAgICAgIGNhY2hlLmdldExvZ3MgPSB3b3JsZFN0YXJ0ZWQoKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBhamF4LmdldChgL3dvcmxkcy9sb2dzLyR7d29ybGRJZH1gKSlcclxuICAgICAgICAgICAgLnRoZW4obG9nID0+IGxvZy5zcGxpdCgnXFxuJykpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRMb2dzO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYSBsaXN0IG9mIGFkbWlucywgbW9kcywgc3RhZmYgKGFkbWlucyArIG1vZHMpLCB3aGl0ZWxpc3QsIGFuZCBibGFja2xpc3QuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldExpc3RzKCkudGhlbihsaXN0cyA9PiBjb25zb2xlLmxvZyhsaXN0cy5hZG1pbikpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWZldGNoIHRoZSBsaXN0cy5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldExpc3RzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldExpc3RzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0TGlzdHMgPSB3b3JsZFN0YXJ0ZWQoKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBhamF4LmdldChgL3dvcmxkcy9saXN0cy8ke3dvcmxkSWR9YCkpXHJcbiAgICAgICAgICAgIC50aGVuKGh0bWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0TGlzdChuYW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxpc3QgPSBkb2MucXVlcnlTZWxlY3RvcihgdGV4dGFyZWFbbmFtZT0ke25hbWV9XWApXHJcbiAgICAgICAgICAgICAgICAgICAgLnZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgLnRvTG9jYWxlVXBwZXJDYXNlKClcclxuICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJ1xcbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbLi4ubmV3IFNldChsaXN0KV07IC8vUmVtb3ZlIGR1cGxpY2F0ZXNcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbGlzdHMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWRtaW46IGdldExpc3QoJ2FkbWlucycpLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vZDogZ2V0TGlzdCgnbW9kbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgICAgIHdoaXRlOiBnZXRMaXN0KCd3aGl0ZWxpc3QnKSxcclxuICAgICAgICAgICAgICAgICAgICBibGFjazogZ2V0TGlzdCgnYmxhY2tsaXN0JyksXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgbGlzdHMubW9kID0gbGlzdHMubW9kLmZpbHRlcihuYW1lID0+ICFsaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lKSk7XHJcbiAgICAgICAgICAgICAgICBsaXN0cy5zdGFmZiA9IGxpc3RzLmFkbWluLmNvbmNhdChsaXN0cy5tb2QpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBsaXN0cztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldExpc3RzO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIGhvbWVwYWdlIG9mIHRoZSBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IGNvbnNvbGUubG9nKGh0bWwuc3Vic3RyaW5nKDAsIDEwMCkpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmZXRjaCB0aGUgcGFnZS5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldEhvbWVwYWdlKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldEhvbWVwYWdlKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0SG9tZXBhZ2UgPSBhamF4LmdldChgL3dvcmxkcy8ke3dvcmxkSWR9YClcclxuICAgICAgICAgICAgLmNhdGNoKCgpID0+IGdldEhvbWVwYWdlKHRydWUpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0SG9tZXBhZ2U7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCBhbiBhcnJheSBvZiBwbGF5ZXIgbmFtZXMuXHJcbiAqIEFuIG9ubGluZSBsaXN0IGlzIG1haW50YWluZWQgYnkgdGhlIGJvdCwgdGhpcyBzaG91bGQgZ2VuZXJhbGx5IG5vdCBiZSB1c2VkLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRPbmxpbmVQbGF5ZXJzKCkudGhlbihvbmxpbmUgPT4geyBmb3IgKGxldCBuIG9mIG9ubGluZSkgeyBjb25zb2xlLmxvZyhuLCAnaXMgb25saW5lIScpfX0pO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWZyZXNoIHRoZSBvbmxpbmUgbmFtZXMuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPbmxpbmVQbGF5ZXJzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldE9ubGluZVBsYXllcnMpIHtcclxuICAgICAgICBjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzID0gZ2V0SG9tZXBhZ2UodHJ1ZSlcclxuICAgICAgICAgICAgLnRoZW4oKGh0bWwpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBsYXllckVsZW1zID0gZG9jLnF1ZXJ5U2VsZWN0b3IoJy5tYW5hZ2VyLnBhZGRlZDpudGgtY2hpbGQoMSknKVxyXG4gICAgICAgICAgICAgICAgICAgIC5xdWVyeVNlbGVjdG9yQWxsKCd0cjpub3QoLmhpc3RvcnkpID4gdGQubGVmdCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBsYXllcnMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBBcnJheS5mcm9tKHBsYXllckVsZW1zKS5mb3JFYWNoKChlbCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHBsYXllcnMucHVzaChlbC50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBwbGF5ZXJzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0T25saW5lUGxheWVycztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSBzZXJ2ZXIgb3duZXIncyBuYW1lLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRPd25lck5hbWUoKS50aGVuKG5hbWUgPT4gY29uc29sZS5sb2coJ1dvcmxkIGlzIG93bmVkIGJ5JywgbmFtZSkpO1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T3duZXJOYW1lKCkge1xyXG4gICAgcmV0dXJuIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IHtcclxuICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICByZXR1cm4gZG9jLnF1ZXJ5U2VsZWN0b3IoJy5zdWJoZWFkZXJ+dHI+dGQ6bm90KFtjbGFzc10pJykudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgd29ybGQncyBuYW1lLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRXb3JsZE5hbWUoKS50aGVuKG5hbWUgPT4gY29uc29sZS5sb2coJ1dvcmxkIG5hbWU6JywgbmFtZSkpO1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0V29ybGROYW1lKCkge1xyXG4gICAgcmV0dXJuIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IHtcclxuICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICByZXR1cm4gZG9jLnF1ZXJ5U2VsZWN0b3IoJyN0aXRsZScpLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlbmRzIGEgbWVzc2FnZSwgcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBtZXNzYWdlIGhhcyBiZWVuIHNlbnQgb3IgcmVqZWN0cyBvbiBmYWlsdXJlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZW5kKCdoZWxsbyEnKS50aGVuKCgpID0+IGNvbnNvbGUubG9nKCdzZW50JykpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBzZW5kLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gc2VuZChtZXNzYWdlKSB7XHJcbiAgICByZXR1cm4gYWpheC5wb3N0SlNPTihgL2FwaWAsIHtjb21tYW5kOiAnc2VuZCcsIG1lc3NhZ2UsIHdvcmxkSWR9KVxyXG4gICAgICAgIC50aGVuKHJlc3AgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgIT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3AubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3A7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbihyZXNwID0+IHtcclxuICAgICAgICAgICAgLy9IYW5kbGUgaG9va3NcclxuICAgICAgICAgICAgaG9vay5maXJlKCd3b3JsZC5zZW5kJywgbWVzc2FnZSk7XHJcbiAgICAgICAgICAgIGhvb2suZmlyZSgnd29ybGQuc2VydmVybWVzc2FnZScsIG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgLy9EaXNhbGxvdyBjb21tYW5kcyBzdGFydGluZyB3aXRoIHNwYWNlLlxyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykgJiYgIW1lc3NhZ2Uuc3RhcnRzV2l0aCgnLyAnKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbW1hbmQgPSBtZXNzYWdlLnN1YnN0cigxKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYXJncyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbW1hbmQuaW5jbHVkZXMoJyAnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnN1YnN0cmluZygwLCBjb21tYW5kLmluZGV4T2YoJyAnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IG1lc3NhZ2Uuc3Vic3RyaW5nKG1lc3NhZ2UuaW5kZXhPZignICcpICsgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBob29rLmNoZWNrKCd3b3JsZC5jb21tYW5kJywgJ1NFUlZFUicsIGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzcDtcclxuICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyID09ICdXb3JsZCBub3QgcnVubmluZy4nKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5maXJzdElkID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gd2F0Y2ggY2hhdC5cclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrQ2hhdCgpIHtcclxuICAgIGdldE1lc3NhZ2VzKCkudGhlbigobXNncykgPT4ge1xyXG4gICAgICAgIG1zZ3MuZm9yRWFjaCgobWVzc2FnZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkLm5hbWV9IC0gUGxheWVyIENvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IFssIG5hbWUsIGlwXSA9IG1lc3NhZ2UubWF0Y2goLyAtIFBsYXllciBDb25uZWN0ZWQgKC4qKSBcXHwgKFtcXGQuXSspIFxcfCAoW1xcd117MzJ9KVxccyokLyk7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVKb2luTWVzc2FnZXMobmFtZSwgaXApO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoYCR7d29ybGQubmFtZX0gLSBQbGF5ZXIgRGlzY29ubmVjdGVkIGApKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmFtZSA9IG1lc3NhZ2Uuc3Vic3RyaW5nKHdvcmxkLm5hbWUubGVuZ3RoICsgMjMpO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlTGVhdmVNZXNzYWdlcyhuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5pbmNsdWRlcygnOiAnKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBnZXRVc2VybmFtZShtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIGxldCBtc2cgPSBtZXNzYWdlLnN1YnN0cmluZyhuYW1lLmxlbmd0aCArIDIpO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlVXNlck1lc3NhZ2VzKG5hbWUsIG1zZyk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlT3RoZXJNZXNzYWdlcyhtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKVxyXG4gICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIHNldFRpbWVvdXQoY2hlY2tDaGF0LCA1MDAwKTtcclxuICAgIH0pO1xyXG59XHJcbmNoZWNrQ2hhdCgpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBnZXQgdGhlIGxhdGVzdCBjaGF0IG1lc3NhZ2VzLlxyXG4gKlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0TWVzc2FnZXMoKSB7XHJcbiAgICByZXR1cm4gd29ybGRTdGFydGVkKClcclxuICAgICAgICAudGhlbigoKSA9PiBhamF4LnBvc3RKU09OKGAvYXBpYCwgeyBjb21tYW5kOiAnZ2V0Y2hhdCcsIHdvcmxkSWQsIGZpcnN0SWQ6IGNhY2hlLmZpcnN0SWQgfSkpXHJcbiAgICAgICAgLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLnN0YXR1cyA9PSAnb2snICYmIGRhdGEubmV4dElkICE9IGNhY2hlLmZpcnN0SWQpIHtcclxuICAgICAgICAgICAgICAgIGNhY2hlLmZpcnN0SWQgPSBkYXRhLm5leHRJZDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmxvZztcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChkYXRhLnN0YXR1cyA9PSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZGF0YS5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGZpZ3VyZSBvdXQgd2hvIHNlbnQgYSBtZXNzYWdlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgbmFtZSA9IGdldFVzZXJuYW1lKCdTRVJWRVI6IEhpIHRoZXJlIScpO1xyXG4gKiAvL25hbWUgPT0gJ1NFUlZFUidcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gcGFyc2UuXHJcbiAqIEByZXR1cm4ge3N0cmluZ30gdGhlIG5hbWUgb2YgdGhlIHVzZXIgd2hvIHNlbnQgdGhlIG1lc3NhZ2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRVc2VybmFtZShtZXNzYWdlKSB7XHJcbiAgICBmb3IgKGxldCBpID0gMTg7IGkgPiA0OyBpLS0pIHtcclxuICAgICAgICBsZXQgcG9zc2libGVOYW1lID0gbWVzc2FnZS5zdWJzdHJpbmcoMCwgbWVzc2FnZS5sYXN0SW5kZXhPZignOiAnLCBpKSk7XHJcbiAgICAgICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhwb3NzaWJsZU5hbWUpIHx8IHBvc3NpYmxlTmFtZSA9PSAnU0VSVkVSJykge1xyXG4gICAgICAgICAgICByZXR1cm4gcG9zc2libGVOYW1lO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIFNob3VsZCBpZGVhbGx5IG5ldmVyIGhhcHBlbi5cclxuICAgIHJldHVybiBtZXNzYWdlLnN1YnN0cmluZygwLCBtZXNzYWdlLmxhc3RJbmRleE9mKCc6ICcsIDE4KSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHBsYXllciBqb2lucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHBsYXllciBqb2luaW5nLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaXAgdGhlIGlwIG9mIHRoZSBwbGF5ZXIgam9pbmluZy5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZUpvaW5NZXNzYWdlcyhuYW1lLCBpcCkge1xyXG4gICAgaWYgKCF3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICB3b3JsZC5vbmxpbmUucHVzaChuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5qb2luJywgbmFtZSwgaXApO1xyXG59XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHBsYXllciBkaXNjb25uZWN0aW9ucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHBsYXllciBsZWF2aW5nLlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlTGVhdmVNZXNzYWdlcyhuYW1lKSB7XHJcbiAgICBpZiAod29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnNwbGljZSh3b3JsZC5vbmxpbmUuaW5kZXhPZihuYW1lKSwgMSk7XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQubGVhdmUnLCBuYW1lKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBoYW5kbGUgdXNlciBjaGF0XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSB1c2VyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSBzZW50LlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlVXNlck1lc3NhZ2VzKG5hbWUsIG1lc3NhZ2UpIHtcclxuICAgIGlmIChuYW1lID09ICdTRVJWRVInKSB7XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQuc2VydmVyY2hhdCcsIG1lc3NhZ2UpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5tZXNzYWdlJywgbmFtZSwgbWVzc2FnZSk7XHJcblxyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aCgnLycpICYmICFtZXNzYWdlLnN0YXJ0c1dpdGgoJy8gJykpIHtcclxuXHJcbiAgICAgICAgbGV0IGNvbW1hbmQgPSBtZXNzYWdlLnN1YnN0cigxKTtcclxuXHJcbiAgICAgICAgbGV0IGFyZ3MgPSAnJztcclxuICAgICAgICBpZiAoY29tbWFuZC5pbmNsdWRlcygnICcpKSB7XHJcbiAgICAgICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnN1YnN0cmluZygwLCBjb21tYW5kLmluZGV4T2YoJyAnKSk7XHJcbiAgICAgICAgICAgIGFyZ3MgPSBtZXNzYWdlLnN1YnN0cmluZyhtZXNzYWdlLmluZGV4T2YoJyAnKSArIDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBob29rLmNoZWNrKCd3b3JsZC5jb21tYW5kJywgbmFtZSwgY29tbWFuZCwgYXJncyk7XHJcbiAgICAgICAgcmV0dXJuOyAvL25vdCBjaGF0XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQuY2hhdCcsIG5hbWUsIG1lc3NhZ2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHVzZWQgdG8gaGFuZGxlIG1lc3NhZ2VzIHdoaWNoIGFyZSBub3Qgc2ltcGx5IHBhcnNlZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgdG8gaGFuZGxlXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVPdGhlck1lc3NhZ2VzKG1lc3NhZ2UpIHtcclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLm90aGVyJywgbWVzc2FnZSk7XHJcbn1cclxuIiwidmFyIGxpc3RlbmVycyA9IHt9O1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gYmVnaW4gbGlzdGVuaW5nIHRvIGFuIGV2ZW50LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBsaXN0ZW4oJ2V2ZW50JywgY29uc29sZS5sb2cpO1xyXG4gKiAvL2FsdGVybmF0aXZlbHlcclxuICogb24oJ2V2ZW50JywgY29uc29sZS5sb2cpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBsaXN0ZW4gdG8uXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRoZSBldmVudCBoYW5kbGVyXHJcbiAqL1xyXG5mdW5jdGlvbiBsaXN0ZW4oa2V5LCBjYWxsYmFjaykge1xyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYWxsYmFjayBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XHJcbiAgICB9XHJcblxyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgbGlzdGVuZXJzW2tleV0gPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xyXG4gICAgICAgIGxpc3RlbmVyc1trZXldLnB1c2goY2FsbGJhY2spO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc3RvcCBsaXN0ZW5pbmcgdG8gYW4gZXZlbnQuIElmIHRoZSBsaXN0ZW5lciB3YXMgbm90IGZvdW5kLCBubyBhY3Rpb24gd2lsbCBiZSB0YWtlbi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogLy9FYXJsaWVyIGF0dGFjaGVkIG15RnVuYyB0byAnZXZlbnQnXHJcbiAqIHJlbW92ZSgnZXZlbnQnLCBteUZ1bmMpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBzdG9wIGxpc3RlbmluZyB0by5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdGhlIGNhbGxiYWNrIHRvIHJlbW92ZSBmcm9tIHRoZSBldmVudCBsaXN0ZW5lcnMuXHJcbiAqL1xyXG5mdW5jdGlvbiByZW1vdmUoa2V5LCBjYWxsYmFjaykge1xyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAobGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICBpZiAobGlzdGVuZXJzW2tleV0uaW5jbHVkZXMoY2FsbGJhY2spKSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVyc1trZXldLnNwbGljZShsaXN0ZW5lcnNba2V5XS5pbmRleE9mKGNhbGxiYWNrKSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gY2FsbCBldmVudHMuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGNoZWNrKCd0ZXN0JywgMSwgMiwgMyk7XHJcbiAqIGNoZWNrKCd0ZXN0JywgdHJ1ZSk7XHJcbiAqIC8vIGFsdGVybmF0aXZlbHlcclxuICogZmlyZSgndGVzdCcsIDEsIDIsIDMpO1xyXG4gKiBmaXJlKCd0ZXN0JywgdHJ1ZSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGNhbGwuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGFyZ3MgYW55IGFyZ3VtZW50cyB0byBwYXNzIHRvIGxpc3RlbmluZyBmdW5jdGlvbnMuXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVjayhrZXksIC4uLmFyZ3MpIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBsaXN0ZW5lcnNba2V5XS5mb3JFYWNoKGZ1bmN0aW9uKGxpc3RlbmVyKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGlzdGVuZXIoLi4uYXJncyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBpZiAoa2V5ICE9ICdlcnJvcicpIHtcclxuICAgICAgICAgICAgICAgIGNoZWNrKCdlcnJvcicsIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byB1cGRhdGUgYSB2YWx1ZSBiYXNlZCBvbiBpbnB1dCBmcm9tIGxpc3RlbmVycy5cclxuICpcclxuICogQGRlcHJpY2F0ZWQgc2luY2UgNi4xLjAuIEluc3RlYWQsIHVwZGF0ZSByZXF1ZXN0cyBzaG91bGQgYmUgaGFuZGxlZCBieSB0aGUgZXh0ZW5zaW9uIGl0ZXNlbGYuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHVwZGF0ZSgnZXZlbnQnLCB0cnVlLCAxLCAyLCAzKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gY2FsbFxyXG4gKiBAcGFyYW0ge21peGVkfSBpbml0aWFsIHRoZSBpbml0aWFsIHZhbHVlIHRvIGJlIHBhc3NlZCB0byBsaXN0ZW5lcnMuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGFyZ3MgYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBsaXN0ZW5lcnMuXHJcbiAqIEByZXR1cm4ge21peGVkfVxyXG4gKi9cclxuZnVuY3Rpb24gdXBkYXRlKGtleSwgaW5pdGlhbCwgLi4uYXJncykge1xyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgcmV0dXJuIGluaXRpYWw7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGxpc3RlbmVyc1trZXldLnJlZHVjZShmdW5jdGlvbihwcmV2aW91cywgY3VycmVudCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBjdXJyZW50KHByZXZpb3VzLCAuLi5hcmdzKTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgIT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzO1xyXG4gICAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgICAgICBpZiAoa2V5ICE9ICdlcnJvcicpIHtcclxuICAgICAgICAgICAgICAgIGNoZWNrKCdlcnJvcicsIGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91cztcclxuICAgICAgICB9XHJcbiAgICB9LCBpbml0aWFsKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBsaXN0ZW4sXHJcbiAgICBvbjogbGlzdGVuLFxyXG4gICAgcmVtb3ZlLFxyXG4gICAgY2hlY2ssXHJcbiAgICBmaXJlOiBjaGVjayxcclxuICAgIHVwZGF0ZSxcclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBnZXRTdHJpbmcsXHJcbiAgICBnZXRPYmplY3QsXHJcbiAgICBzZXQsXHJcbiAgICBjbGVhck5hbWVzcGFjZSxcclxufTtcclxuXHJcbi8vUkVWSUVXOiBJcyB0aGVyZSBhIGJldHRlciB3YXkgdG8gZG8gdGhpcz8gcmVxdWlyZSgnLi9jb25maWcnKSBtYXliZT9cclxuY29uc3QgTkFNRVNQQUNFID0gd2luZG93LndvcmxkSWQ7XHJcblxyXG4vKipcclxuICogR2V0cyBhIHN0cmluZyBmcm9tIHRoZSBzdG9yYWdlIGlmIGl0IGV4aXN0cyBhbmQgcmV0dXJucyBpdCwgb3RoZXJ3aXNlIHJldHVybnMgZmFsbGJhY2suXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB4ID0gZ2V0U3RyaW5nKCdzdG9yZWRfcHJlZnMnLCAnbm90aGluZycpO1xyXG4gKiB2YXIgeSA9IGdldFN0cmluZygnc3RvcmVkX3ByZWZzJywgJ25vdGhpbmcnLCBmYWxzZSk7XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGtleSB0byByZXRyaWV2ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZmFsbGJhY2sgd2hhdCB0byByZXR1cm4gaWYgdGhlIGtleSB3YXMgbm90IGZvdW5kLlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIG9yIG5vdCB0byB1c2UgYSBuYW1lc3BhY2Ugd2hlbiBjaGVja2luZyBmb3IgdGhlIGtleS5cclxuICogQHJldHVybiB7bWl4ZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRTdHJpbmcoa2V5LCBmYWxsYmFjaywgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICB2YXIgcmVzdWx0O1xyXG4gICAgaWYgKGxvY2FsKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oYCR7a2V5fSR7TkFNRVNQQUNFfWApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiAocmVzdWx0ID09PSBudWxsKSA/IGZhbGxiYWNrIDogcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyBhIHN0b3JlZCBvYmplY3QgaWYgaXQgZXhpc3RzLCBvdGhlcndpc2UgcmV0dXJucyBmYWxsYmFjay5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHggPSBnZXRPYmplY3QoJ3N0b3JlZF9rZXknLCBbMSwgMiwgM10pO1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBpdGVtIHRvIHJldHJpZXZlLlxyXG4gKiBAcGFyYW0ge21peGVkfSBmYWxsYmFjayB3aGF0IHRvIHJldHVybiBpZiB0aGUgaXRlbSBkb2VzIG5vdCBleGlzdCBvciBmYWlscyB0byBwYXJzZSBjb3JyZWN0bHkuXHJcbiAqIEBwYXJhbSB7Ym9vbH0gW2xvY2FsPXRydWVdIHdoZXRoZXIgb3Igbm90IGEgbmFtZXNwYWNlIHNob3VsZCBiZSB1c2VkLlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIGdldE9iamVjdChrZXksIGZhbGxiYWNrLCBsb2NhbCA9IHRydWUpIHtcclxuICAgIHZhciByZXN1bHQgPSBnZXRTdHJpbmcoa2V5LCBmYWxzZSwgbG9jYWwpO1xyXG5cclxuICAgIGlmICghcmVzdWx0KSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbGxiYWNrO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZShyZXN1bHQpO1xyXG4gICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2s7XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2s7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXRzIGFuIG9iamVjdCBpbiB0aGUgc3RvcmFnZSwgc3RyaW5naWZ5aW5nIGl0IGZpcnN0IGlmIG5lY2Nlc3NhcnkuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNldCgnc29tZV9rZXknLCB7YTogWzEsIDIsIDNdLCBiOiAndGVzdCd9KTtcclxuICogLy9yZXR1cm5zICd7XCJhXCI6WzEsMiwzXSxcImJcIjpcInRlc3RcIn0nXHJcbiAqIGdldFN0cmluZygnc29tZV9rZXknKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgaXRlbSB0byBvdmVyd3JpdGUgb3IgY3JlYXRlLlxyXG4gKiBAcGFyYW0ge21peGVkfSBkYXRhIGFueSBzdHJpbmdpZnlhYmxlIHR5cGUuXHJcbiAqIEBwYXJhbSB7Ym9vbH0gW2xvY2FsPXRydWVdIHdoZXRoZXIgdG8gc2F2ZSB0aGUgaXRlbSB3aXRoIGEgbmFtZXNwYWNlLlxyXG4gKi9cclxuZnVuY3Rpb24gc2V0KGtleSwgZGF0YSwgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICBpZiAobG9jYWwpIHtcclxuICAgICAgICBrZXkgPSBgJHtrZXl9JHtOQU1FU1BBQ0V9YDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGRhdGEgPT0gJ3N0cmluZycpIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIGRhdGEpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYWxsIGl0ZW1zIHN0YXJ0aW5nIHdpdGggbmFtZXNwYWNlIGZyb20gdGhlIHN0b3JhZ2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNldCgna2V5X3Rlc3QnLCAxKTtcclxuICogc2V0KCdrZXlfdGVzdDInLCAyKTtcclxuICogY2xlYXJOYW1lc3BhY2UoJ2tleV8nKTsgLy9ib3RoIGtleV90ZXN0IGFuZCBrZXlfdGVzdDIgaGF2ZSBiZWVuIHJlbW92ZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lc3BhY2UgdGhlIHByZWZpeCB0byBjaGVjayBmb3Igd2hlbiByZW1vdmluZyBpdGVtcy5cclxuICovXHJcbmZ1bmN0aW9uIGNsZWFyTmFtZXNwYWNlKG5hbWVzcGFjZSkge1xyXG4gICAgT2JqZWN0LmtleXMobG9jYWxTdG9yYWdlKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgaWYgKGtleS5zdGFydHNXaXRoKG5hbWVzcGFjZSkpIHtcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCBhcGkgPSByZXF1aXJlKCcuL2Jsb2NraGVhZHMnKTtcclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJy4vc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnLi9ob29rJyk7XHJcblxyXG5jb25zdCBTVE9SQUdFID0ge1xyXG4gICAgUExBWUVSUzogJ21iX3BsYXllcnMnLFxyXG4gICAgTE9HX0xPQUQ6ICdtYl9sYXN0TG9nTG9hZCcsXHJcbn07XHJcblxyXG52YXIgd29ybGQgPSBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG5hbWU6ICcnLFxyXG4gICAgb25saW5lOiBbXSxcclxuICAgIG93bmVyOiAnJyxcclxuICAgIHBsYXllcnM6IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0UuUExBWUVSUywge30pLFxyXG4gICAgbGlzdHM6IHthZG1pbjogW10sIG1vZDogW10sIHN0YWZmOiBbXSwgYmxhY2s6IFtdLCB3aGl0ZTogW119LFxyXG4gICAgaXNQbGF5ZXIsXHJcbiAgICBpc1NlcnZlcixcclxuICAgIGlzT3duZXIsXHJcbiAgICBpc0FkbWluLFxyXG4gICAgaXNTdGFmZixcclxuICAgIGlzTW9kLFxyXG4gICAgaXNPbmxpbmUsXHJcbiAgICBnZXRKb2lucyxcclxufTtcclxudmFyIGxpc3RzID0gd29ybGQubGlzdHM7XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGEgcGxheWVyIGhhcyBqb2luZWQgdGhlIHNlcnZlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzUGxheWVyKG5hbWUpIHtcclxuICAgIHJldHVybiB3b3JsZC5wbGF5ZXJzLmhhc093blByb3BlcnR5KG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyB0aGUgc2VydmVyXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1NlcnZlcihuYW1lKSB7XHJcbiAgICByZXR1cm4gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpID09ICdTRVJWRVInO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgdGhlIG93bmVyIG9yIHNlcnZlci5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybiB7Ym9vbH1cclxuICovXHJcbmZ1bmN0aW9uIGlzT3duZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLm93bmVyID09IG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKSB8fCBpc1NlcnZlcihuYW1lKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGxheWVyIGlzIGFuIGFkbWluXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc0FkbWluKG5hbWUpIHtcclxuICAgIHJldHVybiBsaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpIHx8IGlzT3duZXIobmFtZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgaWYgdGhlIHBsYXllciBpcyBhIG1vZFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNNb2QobmFtZSkge1xyXG4gICAgcmV0dXJuIGxpc3RzLm1vZC5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIHRoZSBwbGF5ZXIgaXMgYSBzdGFmZiBtZW1iZXIuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge2Jvb2x9XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1N0YWZmKG5hbWUpIHtcclxuICAgIHJldHVybiBpc0FkbWluKG5hbWUpIHx8IGlzTW9kKG5hbWUpO1xyXG59XHJcblxyXG4vKipcclxuICogQ2hlY2tzIGlmIGEgcGxheWVyIGlzIG9ubGluZVxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtib29sfVxyXG4gKi9cclxuZnVuY3Rpb24gaXNPbmxpbmUobmFtZSkge1xyXG4gICAgcmV0dXJuIHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbnVtYmVyIG9mIHRpbWVzIHRoZSBwbGF5ZXIgaGFzIGpvaW5lZCB0aGUgc2VydmVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRKb2lucyhuYW1lKSB7XHJcbiAgICByZXR1cm4gaXNQbGF5ZXIobmFtZSkgPyB3b3JsZC5wbGF5ZXJzW25hbWUudG9Mb2NhbGVVcHBlckNhc2UoKV0uam9pbnMgOiAwO1xyXG59XHJcblxyXG4vLyBLZWVwIHRoZSBvbmxpbmUgbGlzdCB1cCB0byBkYXRlXHJcbmhvb2sub24oJ3dvcmxkLmpvaW4nLCBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBpZiAoIXdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG59KTtcclxuaG9vay5vbignd29ybGQubGVhdmUnLCBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICBpZiAod29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnNwbGljZSh3b3JsZC5vbmxpbmUuaW5kZXhPZihuYW1lKSwgMSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gS2VlcCBwbGF5ZXJzIGxpc3QgdXAgdG8gZGF0ZVxyXG5ob29rLm9uKCd3b3JsZC5qb2luJywgY2hlY2tQbGF5ZXJKb2luKTtcclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbi5cclxuICogUmVtb3ZlcyBhZG1pbnMgZnJvbSB0aGUgbW9kIGxpc3QgYW5kIGNyZWF0ZXMgdGhlIHN0YWZmIGxpc3QuXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZFN0YWZmTGlzdCgpIHtcclxuICAgIGxpc3RzLm1vZCA9IGxpc3RzLm1vZC5maWx0ZXIoKG5hbWUpID0+ICFsaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lKSAmJiBuYW1lICE9ICdTRVJWRVInICYmIG5hbWUgIT0gd29ybGQub3duZXIpO1xyXG4gICAgbGlzdHMuc3RhZmYgPSBsaXN0cy5hZG1pbi5jb25jYXQobGlzdHMubW9kKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uLlxyXG4gKiBDaGVja3MgaWYgYSBwbGF5ZXIgaGFzIHBlcm1pc3Npb24gdG8gcGVyZm9ybSBhIGNvbW1hbmRcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGNvbW1hbmRcclxuICovXHJcbmZ1bmN0aW9uIHBlcm1pc3Npb25DaGVjayhuYW1lLCBjb21tYW5kKSB7XHJcbiAgICBjb21tYW5kID0gY29tbWFuZC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG5cclxuICAgIGlmIChbJ2FkbWluJywgJ3VuYWRtaW4nLCAnbW9kJywgJ3VubW9kJ10uaW5jbHVkZXMoY29tbWFuZCkpIHtcclxuICAgICAgICByZXR1cm4gaXNBZG1pbihuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoWyd3aGl0ZWxpc3QnLCAndW53aGl0ZWxpc3QnLCAnYmFuJywgJ3VuYmFuJ10uaW5jbHVkZXMoY29tbWFuZCkpIHtcclxuICAgICAgICByZXR1cm4gaXNTdGFmZihuYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbi8vIEtlZXAgbGlzdHMgdXAgdG8gZGF0ZVxyXG5ob29rLm9uKCd3b3JsZC5jb21tYW5kJywgZnVuY3Rpb24obmFtZSwgY29tbWFuZCwgdGFyZ2V0KSB7XHJcbiAgICBpZiAoIXBlcm1pc3Npb25DaGVjayhuYW1lLCBjb21tYW5kKSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgdW4gPSBjb21tYW5kLnN0YXJ0c1dpdGgoJ3VuJyk7XHJcblxyXG4gICAgdmFyIGdyb3VwID0ge1xyXG4gICAgICAgIGFkbWluOiAnYWRtaW4nLFxyXG4gICAgICAgIG1vZDogJ21vZCcsXHJcbiAgICAgICAgd2hpdGVsaXN0OiAnd2hpdGUnLFxyXG4gICAgICAgIGJhbjogJ2JsYWNrJyxcclxuICAgIH1bdW4gPyBjb21tYW5kLnN1YnN0cigyKSA6IGNvbW1hbmRdO1xyXG5cclxuICAgIGlmICh1biAmJiBsaXN0c1tncm91cF0uaW5jbHVkZXModGFyZ2V0KSkge1xyXG4gICAgICAgIGxpc3RzW2dyb3VwXS5zcGxpY2UobGlzdHNbZ3JvdXBdLmluZGV4T2YodGFyZ2V0KSwgMSk7XHJcbiAgICAgICAgYnVpbGRTdGFmZkxpc3QoKTtcclxuICAgIH0gZWxzZSBpZiAoIXVuICYmICFsaXN0c1tncm91cF0uaW5jbHVkZXModGFyZ2V0KSkge1xyXG4gICAgICAgIGxpc3RzW2dyb3VwXS5wdXNoKHRhcmdldCk7XHJcbiAgICAgICAgYnVpbGRTdGFmZkxpc3QoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24uIEluY3JlbWVudHMgYSBwbGF5ZXIncyBqb2lucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGlwXHJcbiAqL1xyXG5mdW5jdGlvbiBjaGVja1BsYXllckpvaW4obmFtZSwgaXApIHtcclxuICAgIGlmICh3b3JsZC5wbGF5ZXJzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XHJcbiAgICAgICAgLy9SZXR1cm5pbmcgcGxheWVyXHJcbiAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXS5qb2lucysrO1xyXG4gICAgICAgIGlmICghd29ybGQucGxheWVyc1tuYW1lXS5pcHMuaW5jbHVkZXMoaXApKSB7XHJcbiAgICAgICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uaXBzLnB1c2goaXApO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy9OZXcgcGxheWVyXHJcbiAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXSA9IHtqb2luczogMSwgaXBzOiBbaXBdfTtcclxuICAgIH1cclxuICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uaXAgPSBpcDtcclxuXHJcbiAgICAvLyBPdGhlcndpc2UsIHdlIHdpbGwgZG91YmxlIHBhcnNlIGpvaW5zXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFLkxPR19MT0FELCBNYXRoLmZsb29yKERhdGUubm93KCkudmFsdWVPZigpKSk7XHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFLlBMQVlFUlMsIHdvcmxkLnBsYXllcnMpO1xyXG59XHJcblxyXG5cclxuLy8gVXBkYXRlIGxpc3RzXHJcblByb21pc2UuYWxsKFthcGkuZ2V0TGlzdHMoKSwgYXBpLmdldFdvcmxkTmFtZSgpLCBhcGkuZ2V0T3duZXJOYW1lKCldKVxyXG4gICAgLnRoZW4oKHZhbHVlcykgPT4ge1xyXG4gICAgICAgIHZhciBbYXBpTGlzdHMsIHdvcmxkTmFtZSwgb3duZXJdID0gdmFsdWVzO1xyXG5cclxuICAgICAgICB3b3JsZC5saXN0cyA9IGFwaUxpc3RzO1xyXG4gICAgICAgIGJ1aWxkU3RhZmZMaXN0KCk7XHJcbiAgICAgICAgd29ybGQubmFtZSA9IHdvcmxkTmFtZTtcclxuICAgICAgICB3b3JsZC5vd25lciA9IG93bmVyO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuXHJcbi8vIFVwZGF0ZSBwbGF5ZXJzIHNpbmNlIGxhc3QgYm90IGxvYWRcclxuUHJvbWlzZS5hbGwoW2FwaS5nZXRMb2dzKCksIGFwaS5nZXRXb3JsZE5hbWUoKV0pXHJcbiAgICAudGhlbigodmFsdWVzKSA9PiB7XHJcbiAgICAgICAgdmFyIFtsaW5lcywgd29ybGROYW1lXSA9IHZhbHVlcztcclxuXHJcbiAgICAgICAgdmFyIGxhc3QgPSBzdG9yYWdlLmdldE9iamVjdChTVE9SQUdFLkxPR19MT0FELCAwKTtcclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFLkxPR19MT0FELCBNYXRoLmZsb29yKERhdGUubm93KCkudmFsdWVPZigpKSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGxpbmUgb2YgbGluZXMpIHtcclxuICAgICAgICAgICAgbGV0IHRpbWUgPSBuZXcgRGF0ZShsaW5lLnN1YnN0cmluZygwLCBsaW5lLmluZGV4T2YoJ2InKSkucmVwbGFjZSgnICcsICdUJykucmVwbGFjZSgnICcsICdaJykpO1xyXG4gICAgICAgICAgICBsZXQgbWVzc2FnZSA9IGxpbmUuc3Vic3RyaW5nKGxpbmUuaW5kZXhPZignXScpICsgMik7XHJcblxyXG4gICAgICAgICAgICBpZiAodGltZSA8IGxhc3QpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkTmFtZX0gLSBQbGF5ZXIgQ29ubmVjdGVkIGApKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcGFydHMgPSBsaW5lLnN1YnN0cihsaW5lLmluZGV4T2YoJyAtIFBsYXllciBDb25uZWN0ZWQgJykgKyAyMCk7IC8vTkFNRSB8IElQIHwgSURcclxuICAgICAgICAgICAgICAgIGxldCBbLCBuYW1lLCBpcF0gPSBwYXJ0cy5tYXRjaCgvKC4qKSBcXHwgKFtcXHcuXSspIFxcfCAuezMyfVxccyovKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjaGVja1BsYXllckpvaW4obmFtZSwgaXApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFLlBMQVlFUlMsIHdvcmxkLnBsYXllcnMpO1xyXG4gICAgfSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IHNlbmQgPSByZXF1aXJlKCdib3QnKS5zZW5kO1xyXG5jb25zdCBwcmVmZXJlbmNlcyA9IHJlcXVpcmUoJ3NldHRpbmdzJyk7XHJcblxyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignQW5ub3VuY2VtZW50cycsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8dGVtcGxhdGUgaWQ9XFxcImFUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXY+XFxyXFxuICAgICAgICA8bGFiZWw+U2VuZDo8L2xhYmVsPlxcclxcbiAgICAgICAgPHRleHRhcmVhIGNsYXNzPVxcXCJtXFxcIj48L3RleHRhcmVhPlxcclxcbiAgICAgICAgPGE+RGVsZXRlPC9hPlxcclxcbiAgICAgICAgPGxhYmVsIHN0eWxlPVxcXCJkaXNwbGF5OmJsb2NrO21hcmdpbi10b3A6NXB4O1xcXCI+V2FpdCBYIG1pbnV0ZXMuLi48L2xhYmVsPlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX2Fubm91bmNlbWVudHNcXFwiPlxcclxcbiAgICA8aDM+VGhlc2UgYXJlIHNlbnQgYWNjb3JkaW5nIHRvIGEgcmVndWxhciBzY2hlZHVsZS48L2gzPlxcclxcbiAgICA8c3Bhbj5JZiB5b3UgaGF2ZSBvbmUgYW5ub3VuY2VtZW50LCBpdCBpcyBzZW50IGV2ZXJ5IFggbWludXRlcywgaWYgeW91IGhhdmUgdHdvLCB0aGVuIHRoZSBmaXJzdCBpcyBzZW50IGF0IFggbWludXRlcywgYW5kIHRoZSBzZWNvbmQgaXMgc2VudCBYIG1pbnV0ZXMgYWZ0ZXIgdGhlIGZpcnN0LiBDaGFuZ2UgWCBpbiB0aGUgc2V0dGluZ3MgdGFiLiBPbmNlIHRoZSBib3QgcmVhY2hlcyB0aGUgZW5kIG9mIHRoZSBsaXN0LCBpdCBzdGFydHMgb3ZlciBhdCB0aGUgdG9wLjwvc3Bhbj5cXHJcXG4gICAgPHNwYW4gY2xhc3M9XFxcInRvcC1yaWdodC1idXR0b25cXFwiPis8L3NwYW4+XFxyXFxuICAgIDxkaXYgaWQ9XFxcImFNc2dzXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdGFiLFxyXG4gICAgc2F2ZSxcclxuICAgIGFkZE1lc3NhZ2UsXHJcbiAgICBzdGFydDogKCkgPT4gYW5ub3VuY2VtZW50Q2hlY2soMCksXHJcbn07XHJcblxyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKHRleHQgPSAnJykge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjYVRlbXBsYXRlJywgJyNhTXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IHRleHR9XHJcbiAgICBdKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIGFubm91bmNlbWVudHMgPSBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcubScpKVxyXG4gICAgICAgIC5tYXAoZWwgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4ge21lc3NhZ2U6IGVsLnZhbHVlfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldCgnYW5ub3VuY2VtZW50QXJyJywgYW5ub3VuY2VtZW50cyk7XHJcbn1cclxuXHJcbi8vIEFubm91bmNlbWVudHMgY29sbGVjdGlvblxyXG52YXIgYW5ub3VuY2VtZW50cyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KCdhbm5vdW5jZW1lbnRBcnInLCBbXSk7XHJcblxyXG4vLyBTaG93IHNhdmVkIGFubm91bmNlbWVudHNcclxuYW5ub3VuY2VtZW50c1xyXG4gICAgLm1hcChhbm4gPT4gYW5uLm1lc3NhZ2UpXHJcbiAgICAuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuXHJcblxyXG4vLyBTZW5kcyBhbm5vdW5jZW1lbnRzIGFmdGVyIHRoZSBzcGVjaWZpZWQgZGVsYXkuXHJcbmZ1bmN0aW9uIGFubm91bmNlbWVudENoZWNrKGkpIHtcclxuICAgIGkgPSAoaSA+PSBhbm5vdW5jZW1lbnRzLmxlbmd0aCkgPyAwIDogaTtcclxuXHJcbiAgICB2YXIgYW5uID0gYW5ub3VuY2VtZW50c1tpXTtcclxuXHJcbiAgICBpZiAoYW5uICYmIGFubi5tZXNzYWdlKSB7XHJcbiAgICAgICAgc2VuZChhbm4ubWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgICBzZXRUaW1lb3V0KGFubm91bmNlbWVudENoZWNrLCBwcmVmZXJlbmNlcy5hbm5vdW5jZW1lbnREZWxheSAqIDYwMDAwLCBpICsgMSk7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBidWlsZEFuZFNlbmRNZXNzYWdlLFxyXG4gICAgYnVpbGRNZXNzYWdlLFxyXG59O1xyXG5cclxuY29uc3Qgd29ybGQgPSByZXF1aXJlKCdsaWJyYXJpZXMvd29ybGQnKTtcclxuY29uc3Qgc2VuZCA9IHJlcXVpcmUoJ2JvdCcpLnNlbmQ7XHJcblxyXG5mdW5jdGlvbiBidWlsZEFuZFNlbmRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpIHtcclxuICAgIHNlbmQoYnVpbGRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRNZXNzYWdlKG1lc3NhZ2UsIG5hbWUpIHtcclxuICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7KFtefV0rKX19L2csIGZ1bmN0aW9uKGZ1bGwsIGtleSkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIE5BTUU6IG5hbWUsXHJcbiAgICAgICAgICAgIE5hbWU6IG5hbWVbMF0gKyBuYW1lLnN1YnN0cmluZygxKS50b0xvY2FsZUxvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICBuYW1lOiBuYW1lLnRvTG9jYWxlTG93ZXJDYXNlKClcclxuICAgICAgICB9W2tleV0gfHwgZnVsbDtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7aXB9fS9naSwgd29ybGQucGxheWVycy5nZXRJUChuYW1lKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG1lc3NhZ2U7XHJcbn1cclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjaGVja0pvaW5zQW5kR3JvdXAsXHJcbiAgICBjaGVja0pvaW5zLFxyXG4gICAgY2hlY2tHcm91cCxcclxufTtcclxuXHJcbmNvbnN0IHdvcmxkID0gcmVxdWlyZSgnbGlicmFyaWVzL3dvcmxkJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykge1xyXG4gICAgcmV0dXJuIGNoZWNrSm9pbnMobmFtZSwgbXNnLmpvaW5zX2xvdywgbXNnLmpvaW5zX2hpZ2gpICYmIGNoZWNrR3JvdXAobmFtZSwgbXNnLmdyb3VwLCBtc2cubm90X2dyb3VwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tKb2lucyhuYW1lLCBsb3csIGhpZ2gpIHtcclxuICAgIHJldHVybiB3b3JsZC5nZXRKb2lucyhuYW1lKSA+PSBsb3cgJiYgd29ybGQuZ2V0Sm9pbnMobmFtZSkgPD0gaGlnaDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hlY2tHcm91cChuYW1lLCBncm91cCwgbm90X2dyb3VwKSB7XHJcbiAgICByZXR1cm4gaXNJbkdyb3VwKG5hbWUsIGdyb3VwKSAmJiAhaXNJbkdyb3VwKG5hbWUsIG5vdF9ncm91cCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzSW5Hcm91cChuYW1lLCBncm91cCkge1xyXG4gICAgbmFtZSA9IG5hbWUudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIHN3aXRjaCAoZ3JvdXAudG9Mb2NhbGVMb3dlckNhc2UoKSkge1xyXG4gICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1BsYXllcihuYW1lKTtcclxuICAgICAgICBjYXNlICdhZG1pbic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc0FkbWluKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ21vZCc6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc01vZChuYW1lKTtcclxuICAgICAgICBjYXNlICdzdGFmZic6XHJcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5pc1N0YWZmKG5hbWUpO1xyXG4gICAgICAgIGNhc2UgJ293bmVyJzpcclxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmlzT3duZXIobmFtZSk7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcbiIsIk9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vYnVpbGRNZXNzYWdlJyksXHJcbiAgICByZXF1aXJlKCcuL2NoZWNrSm9pbnNBbmRHcm91cCcpLFxyXG4gICAgcmVxdWlyZSgnLi9zaG93U3VtbWFyeScpXHJcbik7XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2hvd1N1bW1hcnlcclxufTtcclxuXHJcbi8qKlxyXG4gKiBIZWxwZXIgZnVuY3Rpb24gdG8gY3JlYXRlIGFuZCBkaXNwbGF5IGEgc3VtbWFyeSBvZiB0aGUgb3B0aW9ucyBjaGFuZ2VkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge05vZGV9IGNvbnRhaW5lciB0aGUgbWVzc2FnZSBjb250YWluZXIgd2hpY2ggbmVlZHMgYW4gdXBkYXRlZCBzdW1tYXJ5LlxyXG4gKi9cclxuZnVuY3Rpb24gc2hvd1N1bW1hcnkoY29udGFpbmVyKSB7XHJcbiAgICB2YXIgb3V0ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5zdW1tYXJ5Jyk7XHJcblxyXG4gICAgaWYgKCFvdXQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGdyb3VwID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImdyb3VwXCJdJykudmFsdWU7XHJcbiAgICB2YXIgbm90X2dyb3VwID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXScpLnZhbHVlO1xyXG4gICAgdmFyIGpvaW5zX2xvdyA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZTtcclxuICAgIHZhciBqb2luc19oaWdoID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nKS52YWx1ZTtcclxuXHJcbiAgICB2YXIgZ3JvdXBzQWx0ZXJlZCA9IGdyb3VwICE9ICdhbGwnIHx8IG5vdF9ncm91cCAhPSAnbm9ib2R5JztcclxuICAgIHZhciBqb2luc0FsdGVyZWQgPSBqb2luc19sb3cgIT0gXCIwXCIgfHwgam9pbnNfaGlnaCAhPSBcIjk5OTlcIjtcclxuXHJcbiAgICBpZiAoZ3JvdXBzQWx0ZXJlZCAmJiBqb2luc0FsdGVyZWQpIHtcclxuICAgICAgICBvdXQudGV4dENvbnRlbnQgPSBgJHtncm91cH0gLyBub3QgJHtub3RfZ3JvdXB9IGFuZCAke2pvaW5zX2xvd30g4omkIGpvaW5zIOKJpCAke2pvaW5zX2hpZ2h9YDtcclxuICAgIH0gZWxzZSBpZiAoZ3JvdXBzQWx0ZXJlZCkge1xyXG4gICAgICAgIG91dC50ZXh0Q29udGVudCA9IGAke2dyb3VwfSAvIG5vdCAke25vdF9ncm91cH1gO1xyXG4gICAgfSBlbHNlIGlmIChqb2luc0FsdGVyZWQpIHtcclxuICAgICAgICBvdXQudGV4dENvbnRlbnQgPSBgJHtqb2luc19sb3d9IOKJpCBqb2lucyDiiaQgJHtqb2luc19oaWdofWA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG91dC50ZXh0Q29udGVudCA9ICcnO1xyXG4gICAgfVxyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcclxuXHJcbnZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbmVsLmlubmVySFRNTCA9IFwiI21iX2pvaW4gaDMsI21iX2xlYXZlIGgzLCNtYl90cmlnZ2VyIGgzLCNtYl9hbm5vdW5jZW1lbnRzIGgze21hcmdpbjowIDAgNXB4IDB9I21iX2pvaW4gaW5wdXQsI21iX2pvaW4gdGV4dGFyZWEsI21iX2xlYXZlIGlucHV0LCNtYl9sZWF2ZSB0ZXh0YXJlYSwjbWJfdHJpZ2dlciBpbnB1dCwjbWJfdHJpZ2dlciB0ZXh0YXJlYSwjbWJfYW5ub3VuY2VtZW50cyBpbnB1dCwjbWJfYW5ub3VuY2VtZW50cyB0ZXh0YXJlYXtib3JkZXI6MnB4IHNvbGlkICM2NjY7d2lkdGg6Y2FsYygxMDAlIC0gMTBweCl9I21iX2pvaW4gdGV4dGFyZWEsI21iX2xlYXZlIHRleHRhcmVhLCNtYl90cmlnZ2VyIHRleHRhcmVhLCNtYl9hbm5vdW5jZW1lbnRzIHRleHRhcmVhe3Jlc2l6ZTpub25lO292ZXJmbG93OmhpZGRlbjtwYWRkaW5nOjFweCAwO2hlaWdodDoyMXB4O3RyYW5zaXRpb246aGVpZ2h0IC41c30jbWJfam9pbiB0ZXh0YXJlYTpmb2N1cywjbWJfbGVhdmUgdGV4dGFyZWE6Zm9jdXMsI21iX3RyaWdnZXIgdGV4dGFyZWE6Zm9jdXMsI21iX2Fubm91bmNlbWVudHMgdGV4dGFyZWE6Zm9jdXN7aGVpZ2h0OjVlbX0jbWJfam9pbiBpbnB1dFt0eXBlPVxcXCJudW1iZXJcXFwiXSwjbWJfbGVhdmUgaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl0sI21iX3RyaWdnZXIgaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl0sI21iX2Fubm91bmNlbWVudHMgaW5wdXRbdHlwZT1cXFwibnVtYmVyXFxcIl17d2lkdGg6NWVtfSNqTXNncywjbE1zZ3MsI3RNc2dze3Bvc2l0aW9uOnJlbGF0aXZlO2Rpc3BsYXk6ZmxleDtmbGV4LWZsb3c6cm93IHdyYXA7Ym9yZGVyLXRvcDoxcHggc29saWQgIzAwMH0jak1zZ3M+ZGl2LCNsTXNncz5kaXYsI3RNc2dzPmRpdnt3aWR0aDpjYWxjKDMzJSAtIDE5cHgpO21pbi13aWR0aDoyODBweDtwYWRkaW5nOjVweDttYXJnaW4tbGVmdDo1cHg7bWFyZ2luLWJvdHRvbTo1cHg7Ym9yZGVyOjNweCBzb2xpZCAjOTk5O2JvcmRlci1yYWRpdXM6MTBweH0jak1zZ3M+ZGl2Om50aC1jaGlsZChvZGQpLCNsTXNncz5kaXY6bnRoLWNoaWxkKG9kZCksI3RNc2dzPmRpdjpudGgtY2hpbGQob2RkKXtiYWNrZ3JvdW5kOiNjY2N9XFxuXCI7XHJcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxudWkuYWRkVGFiR3JvdXAoJ01lc3NhZ2VzJywgJ21lc3NhZ2VzJyk7XHJcblxyXG5bXHJcbiAgICByZXF1aXJlKCcuL2pvaW4nKSxcclxuICAgIHJlcXVpcmUoJy4vbGVhdmUnKSxcclxuICAgIHJlcXVpcmUoJy4vdHJpZ2dlcicpLFxyXG4gICAgcmVxdWlyZSgnLi9hbm5vdW5jZW1lbnRzJylcclxuXS5mb3JFYWNoKHR5cGUgPT4ge1xyXG4gICAgdHlwZS50YWIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBjaGVja0RlbGV0ZShldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC50YXJnZXQudGFnTmFtZSAhPSAnQScpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdWkuYWxlcnQoJ1JlYWxseSBkZWxldGUgdGhpcyBtZXNzYWdlPycsIFtcclxuICAgICAgICAgICAge3RleHQ6ICdZZXMnLCBzdHlsZTogJ2RhbmdlcicsIGFjdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC50YXJnZXQucGFyZW50Tm9kZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHR5cGUuc2F2ZSgpO1xyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAge3RleHQ6ICdDYW5jZWwnfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdHlwZS50YWIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgdHlwZS5zYXZlKTtcclxuXHJcbiAgICB0eXBlLnRhYi5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBoZWxwZXJzLnNob3dTdW1tYXJ5KGV2ZW50LnRhcmdldC5wYXJlbnROb2RlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHR5cGUudGFiLnF1ZXJ5U2VsZWN0b3IoJy50b3AtcmlnaHQtYnV0dG9uJylcclxuICAgICAgICAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0eXBlLmFkZE1lc3NhZ2UoKSk7XHJcblxyXG4gICAgLy8gRG9uJ3Qgc3RhcnQgcmVzcG9uZGluZyB0byBjaGF0IGZvciAxMCBzZWNvbmRzXHJcbiAgICBzZXRUaW1lb3V0KHR5cGUuc3RhcnQsIDEwMDAwKTtcclxufSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuXHJcblxyXG5jb25zdCBTVE9SQUdFX0lEID0gJ2pvaW5BcnInO1xyXG5cclxudmFyIHRhYiA9IHVpLmFkZFRhYignSm9pbicsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8dGVtcGxhdGUgaWQ9XFxcImpUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXY+XFxyXFxuICAgICAgICA8bGFiZWw+IE1lc3NhZ2U6IDx0ZXh0YXJlYSBjbGFzcz1cXFwibVxcXCI+PC90ZXh0YXJlYT48L2xhYmVsPlxcclxcbiAgICAgICAgPHNwYW4gY2xhc3M9XFxcInN1bW1hcnlcXFwiPjwvc3Bhbj5cXHJcXG4gICAgICAgIDxkZXRhaWxzPjxzdW1tYXJ5Pk1vcmUgb3B0aW9uczwvc3VtbWFyeT5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzOiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJncm91cFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFsbFxcXCI+YW55b25lPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcInN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJtb2RcXFwiPmEgbW9kPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJvd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgPC9zZWxlY3Q+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPlBsYXllciBpcyBub3Q6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcIm5vdF9ncm91cFxcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm5vYm9keVxcXCI+bm9ib2R5PC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcInN0YWZmXFxcIj5hIHN0YWZmIG1lbWJlcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJtb2RcXFwiPmEgbW9kPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcImFkbWluXFxcIj5hbiBhZG1pbjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJvd25lclxcXCI+dGhlIG93bmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgPC9zZWxlY3Q+PC9sYWJlbD5cXHJcXG4gICAgICAgICAgICA8YnI+XFxyXFxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjBcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19sb3dcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8c3Bhbj4gJmxlOyBwbGF5ZXIgam9pbnMgJmxlOyA8L3NwYW4+XFxyXFxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XFxcIm51bWJlclxcXCIgdmFsdWU9XFxcIjk5OTlcXFwiIGRhdGEtdGFyZ2V0PVxcXCJqb2luc19oaWdoXFxcIj5cXHJcXG4gICAgICAgIDwvZGV0YWlscz5cXHJcXG4gICAgICAgIDxhPkRlbGV0ZTwvYT5cXHJcXG4gICAgPC9kaXY+XFxyXFxuPC90ZW1wbGF0ZT5cXHJcXG48ZGl2IGlkPVxcXCJtYl9qb2luXFxcIiBkYXRhLXRhYi1uYW1lPVxcXCJqb2luXFxcIj5cXHJcXG4gICAgPGgzPlRoZXNlIGFyZSBjaGVja2VkIHdoZW4gYSBwbGF5ZXIgam9pbnMgdGhlIHNlcnZlci48L2gzPlxcclxcbiAgICA8c3Bhbj5Zb3UgY2FuIHVzZSB7e05hbWV9fSwge3tOQU1FfX0sIHt7bmFtZX19LCBhbmQge3tpcH19IGluIHlvdXIgbWVzc2FnZS48L3NwYW4+XFxyXFxuICAgIDxzcGFuIGNsYXNzPVxcXCJ0b3AtcmlnaHQtYnV0dG9uXFxcIj4rPC9zcGFuPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJqTXNnc1xcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGhvb2sub24oJ3dvcmxkLmpvaW4nLCBvbkpvaW4pLFxyXG59O1xyXG5cclxudmFyIGpvaW5NZXNzYWdlcyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdKTtcclxuam9pbk1lc3NhZ2VzLmZvckVhY2goYWRkTWVzc2FnZSk7XHJcblxyXG5BcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjak1zZ3MgPiBkaXYnKSlcclxuICAgIC5mb3JFYWNoKGhlbHBlcnMuc2hvd1N1bW1hcnkpO1xyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGFkZCBhIHRyaWdnZXIgbWVzc2FnZSB0byB0aGUgcGFnZS5cclxuICovXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UobXNnID0ge30pIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2pUZW1wbGF0ZScsICcjak1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnb3B0aW9uJywgcmVtb3ZlOiBbJ3NlbGVjdGVkJ10sIG11bHRpcGxlOiB0cnVlfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IG1zZy5tZXNzYWdlIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdhbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdub2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhdmUgdGhlIHVzZXIncyBtZXNzYWdlcy5cclxuICovXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICBqb2luTWVzc2FnZXMgPSBbXTtcclxuICAgIEFycmF5LmZyb20odGFiLnF1ZXJ5U2VsZWN0b3JBbGwoJyNqTXNncyA+IGRpdicpKS5mb3JFYWNoKGNvbnRhaW5lciA9PiB7XHJcbiAgICAgICAgaWYgKCFjb250YWluZXIucXVlcnlTZWxlY3RvcignLm0nKS52YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBqb2luTWVzc2FnZXMucHVzaCh7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19sb3c6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfbG93XCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2hpZ2g6ICtjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiam9pbnNfaGlnaFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImdyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIG5vdF9ncm91cDogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cIm5vdF9ncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgam9pbk1lc3NhZ2VzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gbGlzdGVuIHRvIHBsYXllciBqb2luc1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxyXG4gKi9cclxuZnVuY3Rpb24gb25Kb2luKG5hbWUpIHtcclxuICAgIGpvaW5NZXNzYWdlcy5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgaWYgKGhlbHBlcnMuY2hlY2tKb2luc0FuZEdyb3VwKG5hbWUsIG1zZykpIHtcclxuICAgICAgICAgICAgaGVscGVycy5idWlsZEFuZFNlbmRNZXNzYWdlKG1zZy5tZXNzYWdlLCBuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCJjb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcblxyXG5jb25zdCBzdG9yYWdlID0gcmVxdWlyZSgnbGlicmFyaWVzL3N0b3JhZ2UnKTtcclxuY29uc3QgaG9vayA9IHJlcXVpcmUoJ2xpYnJhcmllcy9ob29rJyk7XHJcbmNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKCdtZXNzYWdlcy9oZWxwZXJzJyk7XHJcblxyXG5cclxuY29uc3QgU1RPUkFHRV9JRCA9ICdsZWF2ZUFycic7XHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdMZWF2ZScsICdtZXNzYWdlcycpO1xyXG50YWIuaW5uZXJIVE1MID0gXCI8dGVtcGxhdGUgaWQ9XFxcImxUZW1wbGF0ZVxcXCI+XFxyXFxuICAgIDxkaXY+XFxyXFxuICAgICAgICA8bGFiZWw+TWVzc2FnZSA8dGV4dGFyZWEgY2xhc3M9XFxcIm1cXFwiPjwvdGV4dGFyZWE+PC9sYWJlbD5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzPVxcXCJzdW1tYXJ5XFxcIj48L3NwYW4+XFxyXFxuICAgICAgICA8ZGV0YWlscz48c3VtbWFyeT5Nb3JlIG9wdGlvbnM8L3N1bW1hcnk+XFxyXFxuICAgICAgICAgICAgPGxhYmVsPlBsYXllciBpczogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwiZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhbGxcXFwiPmFueW9uZTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXMgbm90OiA8c2VsZWN0IGRhdGEtdGFyZ2V0PVxcXCJub3RfZ3JvdXBcXFwiPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJub2JvZHlcXFwiPm5vYm9keTwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJzdGFmZlxcXCI+YSBzdGFmZiBtZW1iZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibW9kXFxcIj5hIG1vZDwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVxcXCJhZG1pblxcXCI+YW4gYWRtaW48L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwib3duZXJcXFwiPnRoZSBvd25lcjwvb3B0aW9uPlxcclxcbiAgICAgICAgICAgIDwvc2VsZWN0PjwvbGFiZWw+XFxyXFxuICAgICAgICAgICAgPGJyPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCIwXFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfbG93XFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPHNwYW4+ICZsZTsgcGxheWVyIGpvaW5zICZsZTsgPC9zcGFuPlxcclxcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHZhbHVlPVxcXCI5OTk5XFxcIiBkYXRhLXRhcmdldD1cXFwiam9pbnNfaGlnaFxcXCI+XFxyXFxuICAgICAgICA8L2RldGFpbHM+XFxyXFxuICAgICAgICA8YT5EZWxldGU8L2E+XFxyXFxuICAgIDwvZGl2PlxcclxcbjwvdGVtcGxhdGU+XFxyXFxuPGRpdiBpZD1cXFwibWJfbGVhdmVcXFwiPlxcclxcbiAgICA8aDM+VGhlc2UgYXJlIGNoZWNrZWQgd2hlbiBhIHBsYXllciBsZWF2ZXMgdGhlIHNlcnZlci48L2gzPlxcclxcbiAgICA8c3Bhbj5Zb3UgY2FuIHVzZSB7e05hbWV9fSwge3tOQU1FfX0sIHt7bmFtZX19LCBhbmQge3tpcH19IGluIHlvdXIgbWVzc2FnZS48L3NwYW4+XFxyXFxuICAgIDxzcGFuIGNsYXNzPVxcXCJ0b3AtcmlnaHQtYnV0dG9uXFxcIj4rPC9zcGFuPlxcclxcbiAgICA8ZGl2IGlkPVxcXCJsTXNnc1xcXCI+PC9kaXY+XFxyXFxuPC9kaXY+XFxyXFxuXCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHRhYixcclxuICAgIHNhdmUsXHJcbiAgICBhZGRNZXNzYWdlLFxyXG4gICAgc3RhcnQ6ICgpID0+IGhvb2sub24oJ3dvcmxkLmxlYXZlJywgb25MZWF2ZSksXHJcbn07XHJcblxyXG52YXIgbGVhdmVNZXNzYWdlcyA9IHN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdKTtcclxubGVhdmVNZXNzYWdlcy5mb3JFYWNoKGFkZE1lc3NhZ2UpO1xyXG5cclxuQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI2xNc2dzID4gZGl2JykpXHJcbiAgICAuZm9yRWFjaChoZWxwZXJzLnNob3dTdW1tYXJ5KTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgbGVhdmUgbWVzc2FnZSB0byB0aGUgcGFnZS5cclxuICovXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UobXNnID0ge30pIHtcclxuICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2xUZW1wbGF0ZScsICcjbE1zZ3MnLCBbXHJcbiAgICAgICAge3NlbGVjdG9yOiAnb3B0aW9uJywgcmVtb3ZlOiBbJ3NlbGVjdGVkJ10sIG11bHRpcGxlOiB0cnVlfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICcubScsIHRleHQ6IG1zZy5tZXNzYWdlIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdhbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdub2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhdmUgdGhlIGN1cnJlbnQgbGVhdmUgbWVzc2FnZXNcclxuICovXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICBsZWF2ZU1lc3NhZ2VzID0gW107XHJcbiAgICBBcnJheS5mcm9tKHRhYi5xdWVyeVNlbGVjdG9yQWxsKCcjbE1zZ3MgPiBkaXYnKSkuZm9yRWFjaChjb250YWluZXIgPT4ge1xyXG4gICAgICAgIGlmICghY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGVhdmVNZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZTogY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWUsXHJcbiAgICAgICAgICAgIGpvaW5zX2xvdzogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfaGlnaDogK2NvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJykudmFsdWUsXHJcbiAgICAgICAgICAgIGdyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwiZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgbm90X2dyb3VwOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignW2RhdGEtdGFyZ2V0PVwibm90X2dyb3VwXCJdJykudmFsdWUsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBsZWF2ZU1lc3NhZ2VzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gbGlzdGVuIHRvIHBsYXllciBkaXNjb25uZWN0aW9ucy5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIHBsYXllciBsZWF2aW5nLlxyXG4gKi9cclxuZnVuY3Rpb24gb25MZWF2ZShuYW1lKSB7XHJcbiAgICBsZWF2ZU1lc3NhZ2VzLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICBpZiAoaGVscGVycy5jaGVja0pvaW5zQW5kR3JvdXAobmFtZSwgbXNnKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJzLmJ1aWxkQW5kU2VuZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuXHJcbmNvbnN0IHN0b3JhZ2UgPSByZXF1aXJlKCdsaWJyYXJpZXMvc3RvcmFnZScpO1xyXG5jb25zdCBob29rID0gcmVxdWlyZSgnbGlicmFyaWVzL2hvb2snKTtcclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJ21lc3NhZ2VzL2hlbHBlcnMnKTtcclxuY29uc3Qgc2V0dGluZ3MgPSByZXF1aXJlKCdzZXR0aW5ncycpO1xyXG5cclxuXHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAndHJpZ2dlckFycic7XHJcblxyXG52YXIgdGFiID0gdWkuYWRkVGFiKCdUcmlnZ2VyJywgJ21lc3NhZ2VzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSBcIjx0ZW1wbGF0ZSBpZD1cXFwidFRlbXBsYXRlXFxcIj5cXHJcXG4gICAgPGRpdj5cXHJcXG4gICAgICAgIDxsYWJlbD5UcmlnZ2VyOiA8aW5wdXQgY2xhc3M9XFxcInRcXFwiPjwvbGFiZWw+XFxyXFxuICAgICAgICA8bGFiZWw+TWVzc2FnZTogPHRleHRhcmVhIGNsYXNzPVxcXCJtXFxcIj48L3RleHRhcmVhPjwvbGFiZWw+XFxyXFxuICAgICAgICA8c3BhbiBjbGFzcz1cXFwic3VtbWFyeVxcXCI+PC9zcGFuPlxcclxcbiAgICAgICAgPGRldGFpbHM+PHN1bW1hcnk+TW9yZSBvcHRpb25zPC9zdW1tYXJ5PlxcclxcbiAgICAgICAgICAgIDxsYWJlbD5QbGF5ZXIgaXM6IDxzZWxlY3QgZGF0YS10YXJnZXQ9XFxcImdyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWxsXFxcIj5hbnlvbmU8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwic3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICA8bGFiZWw+UGxheWVyIGlzIG5vdDogPHNlbGVjdCBkYXRhLXRhcmdldD1cXFwibm90X2dyb3VwXFxcIj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwibm9ib2R5XFxcIj5ub2JvZHk8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwic3RhZmZcXFwiPmEgc3RhZmYgbWVtYmVyPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm1vZFxcXCI+YSBtb2Q8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cXFwiYWRtaW5cXFwiPmFuIGFkbWluPC9vcHRpb24+XFxyXFxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XFxcIm93bmVyXFxcIj50aGUgb3duZXI8L29wdGlvbj5cXHJcXG4gICAgICAgICAgICA8L3NlbGVjdD48L2xhYmVsPlxcclxcbiAgICAgICAgICAgIDxicj5cXHJcXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiMFxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2xvd1xcXCI+XFxyXFxuICAgICAgICAgICAgICAgIDxzcGFuPiAmbGU7IHBsYXllciBqb2lucyAmbGU7IDwvc3Bhbj5cXHJcXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cXFwibnVtYmVyXFxcIiB2YWx1ZT1cXFwiOTk5OVxcXCIgZGF0YS10YXJnZXQ9XFxcImpvaW5zX2hpZ2hcXFwiPlxcclxcbiAgICAgICAgPC9kZXRhaWxzPlxcclxcbiAgICAgICAgPGE+RGVsZXRlPC9hPlxcclxcbiAgICA8L2Rpdj5cXHJcXG48L3RlbXBsYXRlPlxcclxcbjxkaXYgaWQ9XFxcIm1iX3RyaWdnZXJcXFwiPlxcclxcbiAgICA8aDM+VGhlc2UgYXJlIGNoZWNrZWQgd2hlbmV2ZXIgc29tZW9uZSBzYXlzIHNvbWV0aGluZy48L2gzPlxcclxcbiAgICA8c3Bhbj5Zb3UgY2FuIHVzZSB7e05hbWV9fSwge3tOQU1FfX0sIHt7bmFtZX19LCBhbmQge3tpcH19IGluIHlvdXIgbWVzc2FnZS4gSWYgeW91IHB1dCBhbiBhc3RlcmlzayAoKikgaW4geW91ciB0cmlnZ2VyLCBpdCB3aWxsIGJlIHRyZWF0ZWQgYXMgYSB3aWxkY2FyZC4gKFRyaWdnZXIgXFxcInRlKnN0XFxcIiB3aWxsIG1hdGNoIFxcXCJ0ZWEgc3R1ZmZcXFwiIGFuZCBcXFwidGVzdFxcXCIpPC9zcGFuPlxcclxcbiAgICA8c3BhbiBjbGFzcz1cXFwidG9wLXJpZ2h0LWJ1dHRvblxcXCI+Kzwvc3Bhbj5cXHJcXG4gICAgPGRpdiBpZD1cXFwidE1zZ3NcXFwiPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0YWIsXHJcbiAgICBzYXZlLFxyXG4gICAgYWRkTWVzc2FnZSxcclxuICAgIHN0YXJ0OiAoKSA9PiBob29rLm9uKCd3b3JsZC5tZXNzYWdlJywgY2hlY2tUcmlnZ2VycyksXHJcbn07XHJcblxyXG52YXIgdHJpZ2dlck1lc3NhZ2VzID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10pO1xyXG50cmlnZ2VyTWVzc2FnZXMuZm9yRWFjaChhZGRNZXNzYWdlKTtcclxuQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI3RNc2dzID4gZGl2JykpXHJcbiAgICAuZm9yRWFjaChoZWxwZXJzLnNob3dTdW1tYXJ5KTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGEgdHJpZ2dlciBtZXNzYWdlIHRvIHRoZSBwYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkTWVzc2FnZShtc2cgPSB7fSkge1xyXG4gICAgdWkuYnVpbGRDb250ZW50RnJvbVRlbXBsYXRlKCcjdFRlbXBsYXRlJywgJyN0TXNncycsIFtcclxuICAgICAgICB7c2VsZWN0b3I6ICdvcHRpb24nLCByZW1vdmU6IFsnc2VsZWN0ZWQnXSwgbXVsdGlwbGU6IHRydWV9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy5tJywgdGV4dDogbXNnLm1lc3NhZ2UgfHwgJyd9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogJy50JywgdmFsdWU6IG1zZy50cmlnZ2VyIHx8ICcnfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19sb3dcIl0nLCB2YWx1ZTogbXNnLmpvaW5zX2xvdyB8fCAwfSxcclxuICAgICAgICB7c2VsZWN0b3I6ICdbZGF0YS10YXJnZXQ9XCJqb2luc19oaWdoXCJdJywgdmFsdWU6IG1zZy5qb2luc19oaWdoIHx8IDk5OTl9LFxyXG4gICAgICAgIHtzZWxlY3RvcjogYFtkYXRhLXRhcmdldD1cImdyb3VwXCJdIFt2YWx1ZT1cIiR7bXNnLmdyb3VwIHx8ICdhbGwnfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfSxcclxuICAgICAgICB7c2VsZWN0b3I6IGBbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0gW3ZhbHVlPVwiJHttc2cubm90X2dyb3VwIHx8ICdub2JvZHknfVwiXWAsIHNlbGVjdGVkOiAnc2VsZWN0ZWQnfVxyXG4gICAgXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTYXZlcyB0aGUgY3VycmVudCB0cmlnZ2VyIG1lc3NhZ2VzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2F2ZSgpIHtcclxuICAgIHRyaWdnZXJNZXNzYWdlcyA9IFtdO1xyXG4gICAgQXJyYXkuZnJvbSh0YWIucXVlcnlTZWxlY3RvckFsbCgnI3RNc2dzID4gZGl2JykpLmZvckVhY2goY29udGFpbmVyID0+IHtcclxuICAgICAgICBpZiAoIWNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlIHx8ICFjb250YWluZXIucXVlcnlTZWxlY3RvcignLnQnKS52YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cmlnZ2VyTWVzc2FnZXMucHVzaCh7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlLFxyXG4gICAgICAgICAgICB0cmlnZ2VyOiBjb250YWluZXIucXVlcnlTZWxlY3RvcignLnQnKS52YWx1ZSxcclxuICAgICAgICAgICAgam9pbnNfbG93OiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2xvd1wiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBqb2luc19oaWdoOiArY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXRhcmdldD1cImpvaW5zX2hpZ2hcIl0nKS52YWx1ZSxcclxuICAgICAgICAgICAgZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJncm91cFwiXScpLnZhbHVlLFxyXG4gICAgICAgICAgICBub3RfZ3JvdXA6IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdbZGF0YS10YXJnZXQ9XCJub3RfZ3JvdXBcIl0nKS52YWx1ZSxcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIHRyaWdnZXJNZXNzYWdlcyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgYSB0cmlnZ2VyIGFnYWluc3QgYSBtZXNzYWdlIHRvIHNlZSBpZiBpdCBtYXRjaGVzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdHJpZ2dlciB0aGUgdHJpZ2dlciB0byB0cnkgdG8gbWF0Y2hcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcclxuICovXHJcbmZ1bmN0aW9uIHRyaWdnZXJNYXRjaCh0cmlnZ2VyLCBtZXNzYWdlKSB7XHJcbiAgICBpZiAoc2V0dGluZ3MucmVnZXhUcmlnZ2Vycykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHRyaWdnZXIsICdpJykudGVzdChtZXNzYWdlKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHVpLm5vdGlmeShgU2tpcHBpbmcgdHJpZ2dlciAnJHt0cmlnZ2VyfScgYXMgdGhlIFJlZ0V4IGlzIGludmFpbGQuYCk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IFJlZ0V4cChcclxuICAgICAgICAgICAgdHJpZ2dlclxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhbLis/Xj0hOiR7fSgpfFxcW1xcXVxcL1xcXFxdKS9nLCBcIlxcXFwkMVwiKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKi9nLCBcIi4qXCIpLFxyXG4gICAgICAgICAgICAnaSdcclxuICAgICAgICApLnRlc3QobWVzc2FnZSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNoZWNrIGluY29taW5nIHBsYXllciBtZXNzYWdlcyBmb3IgdHJpZ2dlcnNcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIHBsYXllcidzIG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrVHJpZ2dlcnMobmFtZSwgbWVzc2FnZSkge1xyXG4gICAgdmFyIHRvdGFsQWxsb3dlZCA9IHNldHRpbmdzLm1heFJlc3BvbnNlcztcclxuICAgIHRyaWdnZXJNZXNzYWdlcy5mb3JFYWNoKG1zZyA9PiB7XHJcbiAgICAgICAgaWYgKHRvdGFsQWxsb3dlZCAmJiBoZWxwZXJzLmNoZWNrSm9pbnNBbmRHcm91cChuYW1lLCBtc2cpICYmIHRyaWdnZXJNYXRjaChtc2cudHJpZ2dlciwgbWVzc2FnZSkpIHtcclxuICAgICAgICAgICAgaGVscGVycy5idWlsZEFuZFNlbmRNZXNzYWdlKG1zZy5tZXNzYWdlLCBuYW1lKTtcclxuICAgICAgICAgICAgdG90YWxBbGxvd2VkLS07XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiY29uc3Qgc3RvcmFnZSA9IHJlcXVpcmUoJ2xpYnJhcmllcy9zdG9yYWdlJyk7XHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnbWJfcHJlZmVyZW5jZXMnO1xyXG5cclxudmFyIHByZWZzID0gc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwge30sIGZhbHNlKTtcclxuXHJcbi8vIEF1dG8gc2F2ZSBvbiBjaGFuZ2VcclxuLy8gSUUgKGFsbCkgLyBTYWZhcmkgKDwgMTApIGRvZXNuJ3Qgc3VwcG9ydCBwcm94aWVzXHJcbmlmICh0eXBlb2YgUHJveHkgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcHJlZnM7XHJcbiAgICBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcclxuICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBwcmVmcywgZmFsc2UpO1xyXG4gICAgfSwgMzAgKiAxMDAwKTtcclxufSBlbHNlIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gbmV3IFByb3h5KHByZWZzLCB7XHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbihvYmosIHByb3AsIHZhbCkge1xyXG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHByb3ApKSB7XHJcbiAgICAgICAgICAgICAgICBvYmpbcHJvcF0gPSB2YWw7XHJcbiAgICAgICAgICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBwcmVmcywgZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG52YXIgcHJlZnNNYXAgPSBbXHJcbiAgICB7dHlwZTogJ251bWJlcicsIGtleTogJ2Fubm91bmNlbWVudERlbGF5JywgZGVmYXVsdDogMTB9LFxyXG4gICAge3R5cGU6ICdudW1iZXInLCBrZXk6ICdtYXhSZXNwb25zZXMnLCBkZWZhdWx0OiAyfSxcclxuICAgIHt0eXBlOiAnYm9vbGVhbicsIGtleTogJ25vdGlmeScsIGRlZmF1bHQ6IHRydWV9LFxyXG4gICAgLy8gQWR2YW5jZWRcclxuICAgIHt0eXBlOiAnYm9vbGVhbicsIGtleTogJ2Rpc2FibGVUcmltJywgZGVmYXVsdDogZmFsc2V9LFxyXG4gICAge3R5cGU6ICdib29sZWFuJywga2V5OiAncmVnZXhUcmlnZ2VycycsIGRlZmF1bHQ6IGZhbHNlfSxcclxuICAgIHt0eXBlOiAnYm9vbGVhbicsIGtleTogJ3NwbGl0TWVzc2FnZXMnLCBkZWZhdWx0OiBmYWxzZX0sXHJcbiAgICB7dHlwZTogJ3RleHQnLCBrZXk6ICdzcGxpdFRva2VuJywgZGVmYXVsdDogJzxzcGxpdD4nfSxcclxuXTtcclxuXHJcbnByZWZzTWFwLmZvckVhY2gocHJlZiA9PiB7XHJcbiAgICAvLyBTZXQgZGVmYXVsdHMgaWYgbm90IHNldFxyXG4gICAgaWYgKHR5cGVvZiBwcmVmc1twcmVmLmtleV0gIT0gIHByZWYudHlwZSkge1xyXG4gICAgICAgIHByZWZzW3ByZWYua2V5XSA9IHByZWYuZGVmYXVsdDtcclxuICAgIH1cclxufSk7XHJcbiIsImNvbnN0IHVpID0gcmVxdWlyZSgndWknKTtcclxuY29uc3QgcHJlZnMgPSByZXF1aXJlKCdzZXR0aW5ncycpO1xyXG5cclxuXHJcbnZhciB0YWIgPSB1aS5hZGRUYWIoJ1NldHRpbmdzJyk7XHJcbnRhYi5pbm5lckhUTUwgPSAnPHN0eWxlPicgK1xyXG4gICAgXCIjbWJfc2V0dGluZ3MgaDN7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgIzk5OX1cXG5cIiArXHJcbiAgICAnPC9zdHlsZT4nICtcclxuICAgIFwiPGRpdiBpZD1cXFwibWJfc2V0dGluZ3NcXFwiPlxcclxcbiAgICA8aDM+U2V0dGluZ3M8L2gzPlxcclxcbiAgICA8bGFiZWw+TWludXRlcyBiZXR3ZWVuIGFubm91bmNlbWVudHM6PC9sYWJlbD48YnI+XFxyXFxuICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcImFubm91bmNlbWVudERlbGF5XFxcIiB0eXBlPVxcXCJudW1iZXJcXFwiPjxicj5cXHJcXG4gICAgPGxhYmVsPk1heGltdW0gdHJpZ2dlciByZXNwb25zZXMgdG8gYSBtZXNzYWdlOjwvbGFiZWw+PGJyPlxcclxcbiAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJtYXhSZXNwb25zZXNcXFwiIHR5cGU9XFxcIm51bWJlclxcXCI+PGJyPlxcclxcbiAgICA8bGFiZWw+TmV3IGNoYXQgbm90aWZpY2F0aW9uczogPC9sYWJlbD5cXHJcXG4gICAgICAgIDxpbnB1dCBkYXRhLWtleT1cXFwibm90aWZ5XFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+PGJyPlxcclxcblxcclxcbiAgICA8aDM+QWR2YW5jZWQgU2V0dGluZ3MgLSA8c21hbGw+PGEgaHJlZj1cXFwiaHR0cHM6Ly9naXRodWIuY29tL0JpYmxpb2ZpbGUvQmxvY2toZWFkcy1NZXNzYWdlQm90L3dpa2kvMS4tQWR2YW5jZWQtT3B0aW9ucy9cXFwiIHRhcmdldD1cXFwiX2JsYW5rXFxcIj5SZWFkIHRoaXMgZmlyc3Q8L2E+PC9zbWFsbD48L2gzPlxcclxcbiAgICA8bGFiZWw+RGlzYWJsZSB3aGl0ZXNwYWNlIHRyaW1taW5nOiA8L2xhYmVsPlxcclxcbiAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJkaXNhYmxlVHJpbVxcXCIgdHlwZT1cXFwiY2hlY2tib3hcXFwiPjxicj5cXHJcXG4gICAgPGxhYmVsPlBhcnNlIHRyaWdnZXJzIGFzIFJlZ0V4OiA8L2xhYmVsPlxcclxcbiAgICAgICAgPGlucHV0IGRhdGEta2V5PVxcXCJyZWdleFRyaWdnZXJzXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+PGJyPlxcclxcbiAgICA8bGFiZWw+U3BsaXQgbWVzc2FnZXM6IDwvbGFiZWw+XFxyXFxuICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcInNwbGl0TWVzc2FnZXNcXFwiIHR5cGU9XFxcImNoZWNrYm94XFxcIj48YnI+XFxyXFxuICAgIDxsYWJlbD5TcGxpdCB0b2tlbjogPC9sYWJlbD48YnI+XFxyXFxuICAgICAgICA8aW5wdXQgZGF0YS1rZXk9XFxcInNwbGl0VG9rZW5cXFwiIHR5cGU9XFxcInRleHRcXFwiPlxcclxcblxcclxcbiAgICA8aDM+QmFja3VwIC8gUmVzdG9yZTwvaDM+XFxyXFxuICAgIDxhIGlkPVxcXCJtYl9iYWNrdXBfc2F2ZVxcXCI+R2V0IGJhY2t1cCBjb2RlPC9hPjxicj5cXHJcXG4gICAgPGEgaWQ9XFxcIm1iX2JhY2t1cF9sb2FkXFxcIj5Mb2FkIHByZXZpb3VzIGJhY2t1cDwvYT5cXHJcXG4gICAgPGRpdiBpZD1cXFwibWJfYmFja3VwXFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbi8vIFNob3cgcHJlZnNcclxuT2JqZWN0LmtleXMocHJlZnMpLmZvckVhY2goa2V5ID0+IHtcclxuICAgIHZhciBlbCA9IHRhYi5xdWVyeVNlbGVjdG9yKGBbZGF0YS1rZXk9XCIke2tleX1cIl1gKTtcclxuICAgIHN3aXRjaCAodHlwZW9mIHByZWZzW2tleV0pIHtcclxuICAgICAgICBjYXNlICdib29sZWFuJzpcclxuICAgICAgICAgICAgZWwuY2hlY2tlZCA9IHByZWZzW2tleV07XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGVsLnZhbHVlID0gcHJlZnNba2V5XTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuLy8gV2F0Y2ggZm9yIGNoYW5nZXNcclxudGFiLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICB2YXIgZ2V0VmFsdWUgPSAoa2V5KSA9PiB0YWIucXVlcnlTZWxlY3RvcihgW2RhdGEta2V5PVwiJHtrZXl9XCJdYCkudmFsdWU7XHJcbiAgICB2YXIgZ2V0SW50ID0gKGtleSkgPT4gK2dldFZhbHVlKGtleSk7XHJcbiAgICB2YXIgZ2V0Q2hlY2tlZCA9IChrZXkpID0+IHRhYi5xdWVyeVNlbGVjdG9yKGBbZGF0YS1rZXk9XCIke2tleX1cIl1gKS5jaGVja2VkO1xyXG5cclxuICAgIE9iamVjdC5rZXlzKHByZWZzKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgdmFyIGZ1bmM7XHJcblxyXG4gICAgICAgIHN3aXRjaCh0eXBlb2YgcHJlZnNba2V5XSkge1xyXG4gICAgICAgICAgICBjYXNlICdib29sZWFuJzpcclxuICAgICAgICAgICAgICAgIGZ1bmMgPSBnZXRDaGVja2VkO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gZ2V0SW50O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBmdW5jID0gZ2V0VmFsdWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwcmVmc1trZXldID0gZnVuYyhrZXkpO1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuXHJcbi8vIEdldCBiYWNrdXBcclxudGFiLnF1ZXJ5U2VsZWN0b3IoJyNtYl9iYWNrdXBfc2F2ZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gc2hvd0JhY2t1cCgpIHtcclxuICAgIHZhciBiYWNrdXAgPSBKU09OLnN0cmluZ2lmeShsb2NhbFN0b3JhZ2UpLnJlcGxhY2UoLzwvZywgJyZsdDsnKTtcclxuICAgIHVpLmFsZXJ0KGBDb3B5IHRoaXMgdG8gYSBzYWZlIHBsYWNlOjxicj48dGV4dGFyZWEgc3R5bGU9XCJ3aWR0aDogY2FsYygxMDAlIC0gN3B4KTtoZWlnaHQ6MTYwcHg7XCI+JHtiYWNrdXB9PC90ZXh0YXJlYT5gKTtcclxufSk7XHJcblxyXG5cclxuLy8gTG9hZCBiYWNrdXBcclxudGFiLnF1ZXJ5U2VsZWN0b3IoJyNtYl9iYWNrdXBfbG9hZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gbG9hZEJhY2t1cCgpIHtcclxuICAgIHVpLmFsZXJ0KCdFbnRlciB0aGUgYmFja3VwIGNvZGU6PHRleHRhcmVhIHN0eWxlPVwid2lkdGg6Y2FsYygxMDAlIC0gN3B4KTtoZWlnaHQ6MTYwcHg7XCI+PC90ZXh0YXJlYT4nLFxyXG4gICAgICAgICAgICAgICAgW1xyXG4gICAgICAgICAgICAgICAgICAgIHsgdGV4dDogJ0xvYWQgJiByZWZyZXNoIHBhZ2UnLCBzdHlsZTogJ3N1Y2Nlc3MnLCBhY3Rpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCB0ZXh0YXJlYScpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29kZSA9IEpTT04ucGFyc2UoY29kZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29kZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBiYWNrdXAnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdWkubm90aWZ5KCdJbnZhbGlkIGJhY2t1cCBjb2RlLiBObyBhY3Rpb24gdGFrZW4uJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY29kZSkuZm9yRWFjaCgoa2V5KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIGNvZGVba2V5XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgdGV4dDogJ0NhbmNlbCcgfVxyXG4gICAgICAgICAgICAgICAgXSk7XHJcbn0pO1xyXG4iLCIvLyBPdmVyd3JpdGUgdGhlIHBvbGxDaGF0IGZ1bmN0aW9uIHRvIGtpbGwgdGhlIGRlZmF1bHQgY2hhdCBmdW5jdGlvblxyXG53aW5kb3cucG9sbENoYXQgPSBmdW5jdGlvbigpIHt9O1xyXG5cclxuLy8gT3ZlcndyaXRlIHRoZSBvbGQgcGFnZVxyXG5kb2N1bWVudC5ib2R5LmlubmVySFRNTCA9ICcnO1xyXG4vLyBTdHlsZSByZXNldFxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbdHlwZT1cInRleHQvY3NzXCJdJylcclxuICAgIC5mb3JFYWNoKGVsID0+IGVsLnJlbW92ZSgpKTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3RpdGxlJykudGV4dENvbnRlbnQgPSAnQ29uc29sZSAtIE1lc3NhZ2VCb3QnO1xyXG5cclxuLy8gU2V0IHRoZSBpY29uIHRvIHRoZSBibG9ja2hlYWQgaWNvbiB1c2VkIG9uIHRoZSBmb3J1bXNcclxudmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xyXG5lbC5yZWwgPSAnaWNvbic7XHJcbmVsLmhyZWYgPSAnaHR0cHM6Ly9pcy5nZC9NQnZVSEYnO1xyXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuXHJcbnJlcXVpcmUoJ2NvbnNvbGUtYnJvd3NlcmlmeScpO1xyXG5yZXF1aXJlKCdib3QvbWlncmF0aW9uJyk7XHJcblxyXG4vLyBFeHBvc2UgdGhlIGV4dGVuc2lvbiBBUElcclxud2luZG93Lk1lc3NhZ2VCb3RFeHRlbnNpb24gPSByZXF1aXJlKCdNZXNzYWdlQm90RXh0ZW5zaW9uJyk7XHJcblxyXG5jb25zdCBiaGZhbnNhcGkgPSByZXF1aXJlKCdsaWJyYXJpZXMvYmhmYW5zYXBpJyk7XHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5jb25zdCB1aSA9IHJlcXVpcmUoJ3VpJyk7XHJcbmhvb2sub24oJ2Vycm9yX3JlcG9ydCcsIGZ1bmN0aW9uKG1zZykge1xyXG4gICAgdWkubm90aWZ5KG1zZyk7XHJcbn0pO1xyXG5cclxuXHJcbnJlcXVpcmUoJy4vY29uc29sZScpO1xyXG4vLyBCeSBkZWZhdWx0IG5vIHRhYiBpcyBzZWxlY3RlZCwgc2hvdyB0aGUgY29uc29sZS5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xlZnROYXYgc3BhbicpLmNsaWNrKCk7XHJcbnJlcXVpcmUoJ21lc3NhZ2VzJyk7XHJcbnJlcXVpcmUoJ2V4dGVuc2lvbnMnKTtcclxucmVxdWlyZSgnc2V0dGluZ3MvcGFnZScpO1xyXG5cclxuLy8gRXJyb3IgcmVwb3J0aW5nXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIChlcnIpID0+IHtcclxuICAgIGlmIChlcnIubWVzc2FnZSAhPSAnU2NyaXB0IGVycm9yJykge1xyXG4gICAgICAgIGJoZmFuc2FwaS5yZXBvcnRFcnJvcihlcnIpO1xyXG4gICAgfVxyXG59KTtcclxuIiwicmVxdWlyZSgnLi9wb2x5ZmlsbHMvZGV0YWlscycpO1xyXG5cclxuLy8gQnVpbGQgdGhlIEFQSVxyXG5PYmplY3QuYXNzaWduKFxyXG4gICAgbW9kdWxlLmV4cG9ydHMsXHJcbiAgICByZXF1aXJlKCcuL2xheW91dCcpLFxyXG4gICAgcmVxdWlyZSgnLi90ZW1wbGF0ZScpLFxyXG4gICAgcmVxdWlyZSgnLi9ub3RpZmljYXRpb25zJylcclxuKTtcclxuXHJcbi8vIEZ1bmN0aW9ucyB3aGljaCBhcmUgbm8gbG9uZ2VyIGNvbnRhaW5lZCBpbiB0aGlzIG1vZHVsZSwgYnV0IGFyZSByZXRhaW5lZCBmb3Igbm93IGZvciBiYWNrd2FyZCBjb21wYXRhYmlsaXR5LlxyXG5jb25zdCB3cml0ZSA9IHJlcXVpcmUoJy4uL2NvbnNvbGUvZXhwb3J0cycpLndyaXRlO1xyXG5tb2R1bGUuZXhwb3J0cy5hZGRNZXNzYWdlVG9Db25zb2xlID0gZnVuY3Rpb24obXNnLCBuYW1lID0gJycsIG5hbWVDbGFzcyA9ICcnKSB7XHJcbiAgICBjb25zb2xlLndhcm4oJ3VpLmFkZE1lc3NhZ2VUb0NvbnNvbGUgaGFzIGJlZW4gZGVwcmljYXRlZC4gVXNlIGV4LmNvbnNvbGUud3JpdGUgaW5zdGVhZC4nKTtcclxuICAgIHdyaXRlKG1zZywgbmFtZSwgbmFtZUNsYXNzKTtcclxufTtcclxuIiwiLyoqXHJcbiAqIEBmaWxlIENvbnRhaW5zIGZ1bmN0aW9ucyBmb3IgbWFuYWdpbmcgdGhlIHBhZ2UgbGF5b3V0XHJcbiAqL1xyXG5cclxuXHJcbmNvbnN0IGhvb2sgPSByZXF1aXJlKCdsaWJyYXJpZXMvaG9vaycpO1xyXG5cclxuLy8gQnVpbGQgcGFnZSAtIG9ubHkgY2FzZSBpbiB3aGljaCBib2R5LmlubmVySFRNTCBzaG91bGQgYmUgdXNlZC5cclxuZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgKz0gXCI8ZGl2IGlkPVxcXCJsZWZ0TmF2XFxcIj5cXHJcXG4gICAgPGlucHV0IHR5cGU9XFxcImNoZWNrYm94XFxcIiBpZD1cXFwibGVmdFRvZ2dsZVxcXCI+XFxyXFxuICAgIDxsYWJlbCBmb3I9XFxcImxlZnRUb2dnbGVcXFwiPiYjOTc3NjsgTWVudTwvbGFiZWw+XFxyXFxuXFxyXFxuICAgIDxuYXYgZGF0YS10YWItZ3JvdXA9XFxcIm1haW5cXFwiPjwvbmF2PlxcclxcbiAgICA8ZGl2IGNsYXNzPVxcXCJvdmVybGF5XFxcIj48L2Rpdj5cXHJcXG48L2Rpdj5cXHJcXG5cXHJcXG48ZGl2IGlkPVxcXCJjb250YWluZXJcXFwiPlxcclxcbiAgICA8aGVhZGVyPjwvaGVhZGVyPlxcclxcbjwvZGl2PlxcclxcblwiO1xyXG5kb2N1bWVudC5oZWFkLmlubmVySFRNTCArPSAnPHN0eWxlPicgKyBcImh0bWwsYm9keXttaW4taGVpZ2h0OjEwMHZoO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjEwMCU7bWFyZ2luOjA7Zm9udC1mYW1pbHk6XFxcIkx1Y2lkYSBHcmFuZGVcXFwiLFxcXCJMdWNpZGEgU2FucyBVbmljb2RlXFxcIixWZXJkYW5hLHNhbnMtc2VyaWY7Y29sb3I6IzAwMH10ZXh0YXJlYSxpbnB1dCxidXR0b24sc2VsZWN0e2ZvbnQtZmFtaWx5OmluaGVyaXR9YXtjdXJzb3I6cG9pbnRlcjtjb2xvcjojMTgyYjczfSNsZWZ0TmF2e3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZX0jbGVmdE5hdiBuYXZ7d2lkdGg6MjUwcHg7YmFja2dyb3VuZDojMTgyYjczO2NvbG9yOiNmZmY7cG9zaXRpb246Zml4ZWQ7bGVmdDotMjUwcHg7ei1pbmRleDoxMDA7dG9wOjA7Ym90dG9tOjA7dHJhbnNpdGlvbjpsZWZ0IC41c30jbGVmdE5hdiBkZXRhaWxzLCNsZWZ0TmF2IHNwYW57ZGlzcGxheTpibG9jazt0ZXh0LWFsaWduOmNlbnRlcjtwYWRkaW5nOjVweCA3cHg7Ym9yZGVyLWJvdHRvbToxcHggc29saWQgd2hpdGV9I2xlZnROYXYgLnNlbGVjdGVke2JhY2tncm91bmQ6cmFkaWFsLWdyYWRpZW50KCM5ZmFmZWIsICMxODJiNzMpfSNsZWZ0TmF2IHN1bW1hcnkgfiBzcGFue2JhY2tncm91bmQ6cmdiYSgxNTksMTc1LDIzNSwwLjQpfSNsZWZ0TmF2IHN1bW1hcnkrc3Bhbntib3JkZXItdG9wLWxlZnQtcmFkaXVzOjIwcHg7Ym9yZGVyLXRvcC1yaWdodC1yYWRpdXM6MjBweH0jbGVmdE5hdiBzdW1tYXJ5IH4gc3BhbjpsYXN0LW9mLXR5cGV7Ym9yZGVyOjA7Ym9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1czoyMHB4O2JvcmRlci1ib3R0b20tcmlnaHQtcmFkaXVzOjIwcHh9I2xlZnROYXYgaW5wdXR7ZGlzcGxheTpub25lfSNsZWZ0TmF2IGxhYmVse2NvbG9yOiNmZmY7YmFja2dyb3VuZDojMjEzYjlkO3BhZGRpbmc6NXB4O3Bvc2l0aW9uOmZpeGVkO3RvcDo1cHg7ei1pbmRleDoxMDA7bGVmdDo1cHg7b3BhY2l0eToxO3RyYW5zaXRpb246bGVmdCAuNXMsb3BhY2l0eSAuNXN9I2xlZnROYXYgaW5wdXQ6Y2hlY2tlZCB+IG5hdntsZWZ0OjA7dHJhbnNpdGlvbjpsZWZ0IC41c30jbGVmdE5hdiBpbnB1dDpjaGVja2VkIH4gbGFiZWx7bGVmdDoyNTVweDtvcGFjaXR5OjA7dHJhbnNpdGlvbjpsZWZ0IC41cyxvcGFjaXR5IC41c30jbGVmdE5hdiBpbnB1dDpjaGVja2VkIH4gLm92ZXJsYXl7dmlzaWJpbGl0eTp2aXNpYmxlO29wYWNpdHk6MTt0cmFuc2l0aW9uOm9wYWNpdHkgLjVzfWhlYWRlcntiYWNrZ3JvdW5kOiMxODJiNzMgdXJsKFxcXCJodHRwOi8vcG9ydGFsLnRoZWJsb2NraGVhZHMubmV0L3N0YXRpYy9pbWFnZXMvcG9ydGFsSGVhZGVyLnBuZ1xcXCIpIG5vLXJlcGVhdDtiYWNrZ3JvdW5kLXBvc2l0aW9uOjgwcHg7aGVpZ2h0OjgwcHh9I2NvbnRhaW5lcj5kaXZ7aGVpZ2h0OmNhbGMoMTAwdmggLSAxMDBweCk7cGFkZGluZzoxMHB4O3Bvc2l0aW9uOmFic29sdXRlO3RvcDo4MHB4O2xlZnQ6MDtyaWdodDowO292ZXJmbG93OmF1dG99I2NvbnRhaW5lcj5kaXY6bm90KC52aXNpYmxlKXtkaXNwbGF5Om5vbmV9Lm92ZXJsYXl7cG9zaXRpb246Zml4ZWQ7dG9wOjA7bGVmdDowO3JpZ2h0OjA7Ym90dG9tOjA7ei1pbmRleDo5OTtiYWNrZ3JvdW5kOnJnYmEoMCwwLDAsMC43KTt2aXNpYmlsaXR5OmhpZGRlbjtvcGFjaXR5OjA7dHJhbnNpdGlvbjpvcGFjaXR5IC41c30ub3ZlcmxheS52aXNpYmxle3Zpc2liaWxpdHk6dmlzaWJsZTtvcGFjaXR5OjE7dHJhbnNpdGlvbjpvcGFjaXR5IC41c30udG9wLXJpZ2h0LWJ1dHRvbntwb3NpdGlvbjphYnNvbHV0ZTtkaXNwbGF5Oi13ZWJraXQtZmxleDtkaXNwbGF5OmZsZXg7LXdlYmtpdC1hbGlnbi1pdGVtczpjZW50ZXI7YWxpZ24taXRlbXM6Y2VudGVyOy13ZWJraXQtanVzdGlmeS1jb250ZW50OmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6Y2VudGVyO3RvcDoxMHB4O3JpZ2h0OjEycHg7d2lkdGg6MzBweDtoZWlnaHQ6MzBweDtiYWNrZ3JvdW5kOiMxODJCNzM7Ym9yZGVyOjA7Y29sb3I6I0ZGRn1cXG5cIiArICc8L3N0eWxlPic7XHJcblxyXG4vLyBIaWRlIHRoZSBtZW51IHdoZW4gY2xpY2tpbmcgdGhlIG92ZXJsYXlcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xlZnROYXYgLm92ZXJsYXknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRvZ2dsZU1lbnUpO1xyXG5cclxuLy8gQ2hhbmdlIHRhYnNcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xlZnROYXYnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGdsb2JhbFRhYkNoYW5nZShldmVudCkge1xyXG4gICAgdmFyIHRhYk5hbWUgPSBldmVudC50YXJnZXQuZGF0YXNldC50YWJOYW1lO1xyXG4gICAgdmFyIHRhYiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNjb250YWluZXIgPiBbZGF0YS10YWItbmFtZT0ke3RhYk5hbWV9XWApO1xyXG4gICAgaWYoIXRhYk5hbWUgfHwgIXRhYikge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvL0NvbnRlbnRcclxuICAgIC8vV2UgY2FuJ3QganVzdCByZW1vdmUgdGhlIGZpcnN0IGR1ZSB0byBicm93c2VyIGxhZ1xyXG4gICAgQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjY29udGFpbmVyID4gLnZpc2libGUnKSlcclxuICAgICAgICAuZm9yRWFjaChlbCA9PiBlbC5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJykpO1xyXG4gICAgdGFiLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcclxuXHJcbiAgICAvL1RhYnNcclxuICAgIEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2xlZnROYXYgLnNlbGVjdGVkJykpXHJcbiAgICAgICAgLmZvckVhY2goZWwgPT4gZWwuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKSk7XHJcbiAgICBldmVudC50YXJnZXQuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKTtcclxuXHJcbiAgICBob29rLmZpcmUoJ3VpLnRhYlNob3duJywgdGFiKTtcclxufSk7XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB0b2dnbGVNZW51LFxyXG4gICAgYWRkVGFiLFxyXG4gICAgcmVtb3ZlVGFiLFxyXG4gICAgYWRkVGFiR3JvdXAsXHJcbiAgICByZW1vdmVUYWJHcm91cCxcclxufTtcclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzaG93L2hpZGUgdGhlIG1lbnUuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHRvZ2dsZU1lbnUoKTtcclxuICovXHJcbmZ1bmN0aW9uIHRvZ2dsZU1lbnUoKSB7XHJcbiAgICB2YXIgbWFpblRvZ2dsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWZ0TmF2IGlucHV0Jyk7XHJcbiAgICBtYWluVG9nZ2xlLmNoZWNrZWQgPSAhbWFpblRvZ2dsZS5jaGVja2VkO1xyXG59XHJcblxyXG52YXIgdGFiVUlEID0gMDtcclxuLyoqXHJcbiAqIFVzZWQgdG8gYWRkIGEgdGFiIHRvIHRoZSBib3QncyBuYXZpZ2F0aW9uLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgdGFiID0gdWkuYWRkVGFiKCdUZXh0Jyk7XHJcbiAqIHZhciB0YWIyID0gdWkuYWRkVGFiKCdDdXN0b20gTWVzc2FnZXMnLCAnbWVzc2FnZXMnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IHRhYlRleHRcclxuICogQHBhcmFtIHtzdHJpbmd9IFtncm91cE5hbWU9bWFpbl0gT3B0aW9uYWwuIElmIHByb3ZpZGVkLCB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAgb2YgdGFicyB0byBhZGQgdGhpcyB0YWIgdG8uXHJcbiAqIEByZXR1cm4ge05vZGV9IC0gVGhlIGRpdiB0byBwbGFjZSB0YWIgY29udGVudCBpbi5cclxuICovXHJcbmZ1bmN0aW9uIGFkZFRhYih0YWJUZXh0LCBncm91cE5hbWUgPSAnbWFpbicpIHtcclxuICAgIHZhciB0YWJOYW1lID0gJ2JvdFRhYl8nICsgdGFiVUlEKys7XHJcblxyXG4gICAgdmFyIHRhYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIHRhYi50ZXh0Q29udGVudCA9IHRhYlRleHQ7XHJcbiAgICB0YWIuY2xhc3NMaXN0LmFkZCgndGFiJyk7XHJcbiAgICB0YWIuZGF0YXNldC50YWJOYW1lID0gdGFiTmFtZTtcclxuXHJcbiAgICB2YXIgdGFiQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgdGFiQ29udGVudC5kYXRhc2V0LnRhYk5hbWUgPSB0YWJOYW1lO1xyXG5cclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNsZWZ0TmF2IFtkYXRhLXRhYi1ncm91cD0ke2dyb3VwTmFtZX1dYCkuYXBwZW5kQ2hpbGQodGFiKTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb250YWluZXInKS5hcHBlbmRDaGlsZCh0YWJDb250ZW50KTtcclxuXHJcbiAgICByZXR1cm4gdGFiQ29udGVudDtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgZ2xvYmFsIHRhYi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHRhYiA9IHVpLmFkZFRhYignVGFiJyk7XHJcbiAqIHVpLnJlbW92ZVRhYih0YWIpO1xyXG4gKiBAcGFyYW0ge05vZGV9IHRhYkNvbnRlbnQgVGhlIGRpdiByZXR1cm5lZCBieSB0aGUgYWRkVGFiIGZ1bmN0aW9uLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlVGFiKHRhYkNvbnRlbnQpIHtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNsZWZ0TmF2IFtkYXRhLXRhYi1uYW1lPSR7dGFiQ29udGVudC5kYXRhc2V0LnRhYk5hbWV9XWApLnJlbW92ZSgpO1xyXG4gICAgdGFiQ29udGVudC5yZW1vdmUoKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgdGFiIGdyb3VwIGluIHdoaWNoIHRhYnMgY2FuIGJlIHBsYWNlZC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdWkuYWRkVGFiR3JvdXAoJ0dyb3VwIFRleHQnLCAnc29tZV9ncm91cCcpO1xyXG4gKiB1aS5hZGRUYWIoJ1dpdGhpbiBncm91cCcsICdzb21lX2dyb3VwJyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGhlIHRleHQgdGhlIHVzZXIgd2lsbCBzZWVcclxuICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBncm91cCB3aGljaCBjYW4gYmUgdXNlZCB0byBhZGQgdGFicyB3aXRoaW4gdGhlIGdyb3VwLlxyXG4gKi9cclxuZnVuY3Rpb24gYWRkVGFiR3JvdXAodGV4dCwgZ3JvdXBOYW1lKSB7XHJcbiAgICB2YXIgZGV0YWlscyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKTtcclxuICAgIGRldGFpbHMuZGF0YXNldC50YWJHcm91cCA9IGdyb3VwTmFtZTtcclxuXHJcbiAgICB2YXIgc3VtbWFyeSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N1bW1hcnknKTtcclxuICAgIHN1bW1hcnkudGV4dENvbnRlbnQgPSB0ZXh0O1xyXG4gICAgZGV0YWlscy5hcHBlbmRDaGlsZChzdW1tYXJ5KTtcclxuXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGVmdE5hdiBbZGF0YS10YWItZ3JvdXA9bWFpbl0nKS5hcHBlbmRDaGlsZChkZXRhaWxzKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGEgdGFiIGdyb3VwIGFuZCBhbGwgdGFicyBjb250YWluZWQgd2l0aGluIHRoZSBzcGVjaWZpZWQgZ3JvdXAuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGFkZFRhYkdyb3VwKCdHcm91cCcsICdncm91cDEnKTtcclxuICogdmFyIGlubmVyID0gYWRkVGFiKCdJbm5lcicsICdncm91cDEnKTtcclxuICogcmVtb3ZlVGFiR3JvdXAoJ2dyb3VwMScpOyAvLyBpbm5lciBoYXMgYmVlbiByZW1vdmVkLlxyXG4gKiBAcGFyYW0gc3RyaW5nIGdyb3VwTmFtZSB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAgdGhhdCB3YXMgdXNlZCBpbiB1aS5hZGRUYWJHcm91cC5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZVRhYkdyb3VwKGdyb3VwTmFtZSkge1xyXG4gICAgdmFyIGdyb3VwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2xlZnROYXYgW2RhdGEtdGFiLWdyb3VwPVwiJHtncm91cE5hbWV9XCJdYCk7XHJcbiAgICB2YXIgaXRlbXMgPSBBcnJheS5mcm9tKGdyb3VwLnF1ZXJ5U2VsZWN0b3JBbGwoJ3NwYW4nKSk7XHJcblxyXG4gICAgaXRlbXMuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICAvL1RhYiBjb250ZW50XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2NvbnRhaW5lciA+IFtkYXRhLXRhYi1uYW1lPVwiJHtpdGVtLmRhdGFzZXQudGFiTmFtZX1cIl1gKS5yZW1vdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGdyb3VwLnJlbW92ZSgpO1xyXG59XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgYWxlcnRcclxufTtcclxuXHJcbi8qKlxyXG4qIEZ1bmN0aW9uIHVzZWQgdG8gcmVxdWlyZSBhY3Rpb24gZnJvbSB0aGUgdXNlci5cclxuKlxyXG4qIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IHRoZSB0ZXh0IHRvIGRpc3BsYXkgaW4gdGhlIGFsZXJ0XHJcbiogQHBhcmFtIHtBcnJheX0gYnV0dG9ucyBhbiBhcnJheSBvZiBidXR0b25zIHRvIGFkZCB0byB0aGUgYWxlcnQuXHJcbiogICAgICAgIEZvcm1hdDogW3t0ZXh0OiAnVGVzdCcsIHN0eWxlOidzdWNjZXNzJywgYWN0aW9uOiBmdW5jdGlvbigpe30sIHRoaXNBcmc6IHdpbmRvdywgZGlzbWlzczogZmFsc2V9XVxyXG4qICAgICAgICBOb3RlOiB0ZXh0IGlzIHRoZSBvbmx5IHJlcXVpcmVkIHBhcmFtYXRlci4gSWYgbm8gYnV0dG9uIGFycmF5IGlzIHNwZWNpZmllZFxyXG4qICAgICAgICB0aGVuIGEgc2luZ2xlIE9LIGJ1dHRvbiB3aWxsIGJlIHNob3duLlxyXG4qICAgICAgICAgUHJvdmlkZWQgc3R5bGVzOiBzdWNjZXNzLCBkYW5nZXIsIHdhcm5pbmcsIGluZm9cclxuKiAgICAgICAgRGVmYXVsdHM6IHN0eWxlOiAnJywgYWN0aW9uOiB1bmRlZmluZWQsIHRoaXNBcmc6IHVuZGVmaW5lZCwgZGlzbWlzczogdHJ1ZVxyXG4qL1xyXG5mdW5jdGlvbiBhbGVydCh0ZXh0LCBidXR0b25zID0gW3t0ZXh0OiAnT0snfV0pIHtcclxuICAgIGlmIChpbnN0YW5jZS5hY3RpdmUpIHtcclxuICAgICAgICBpbnN0YW5jZS5xdWV1ZS5wdXNoKHt0ZXh0LCBidXR0b25zfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaW5zdGFuY2UuYWN0aXZlID0gdHJ1ZTtcclxuXHJcbiAgICBidXR0b25zLmZvckVhY2goZnVuY3Rpb24oYnV0dG9uLCBpKSB7XHJcbiAgICAgICAgYnV0dG9uLmRpc21pc3MgPSAoYnV0dG9uLmRpc21pc3MgPT09IGZhbHNlKSA/IGZhbHNlIDogdHJ1ZTtcclxuICAgICAgICBpbnN0YW5jZS5idXR0b25zWydidXR0b25fJyArIGldID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246IGJ1dHRvbi5hY3Rpb24sXHJcbiAgICAgICAgICAgIHRoaXNBcmc6IGJ1dHRvbi50aGlzQXJnIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgZGlzbWlzczogdHlwZW9mIGJ1dHRvbi5kaXNtaXNzID09ICdib29sZWFuJyA/IGJ1dHRvbi5kaXNtaXNzIDogdHJ1ZSxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGJ1dHRvbi5pZCA9ICdidXR0b25fJyArIGk7XHJcbiAgICAgICAgYnVpbGRCdXR0b24oYnV0dG9uKTtcclxuICAgIH0pO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0Q29udGVudCcpLmlubmVySFRNTCA9IHRleHQ7XHJcblxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IH4gLm92ZXJsYXknKS5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQnKS5jbGFzc0xpc3QuYWRkKCd2aXNpYmxlJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBIb2xkcyB0aGUgY3VycmVudCBhbGVydCBhbmQgcXVldWUgb2YgZnVydGhlciBhbGVydHMuXHJcbiAqL1xyXG52YXIgaW5zdGFuY2UgPSB7XHJcbiAgICBhY3RpdmU6IGZhbHNlLFxyXG4gICAgcXVldWU6IFtdLFxyXG4gICAgYnV0dG9uczoge30sXHJcbn07XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdXNlZCB0byBhZGQgYnV0dG9uIGVsZW1lbnRzIHRvIGFuIGFsZXJ0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gYnV0dG9uXHJcbiAqL1xyXG5mdW5jdGlvbiBidWlsZEJ1dHRvbihidXR0b24pIHtcclxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgIGVsLmlubmVySFRNTCA9IGJ1dHRvbi50ZXh0O1xyXG4gICAgaWYgKGJ1dHRvbi5zdHlsZSkge1xyXG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoYnV0dG9uLnN0eWxlKTtcclxuICAgIH1cclxuICAgIGVsLmlkID0gYnV0dG9uLmlkO1xyXG4gICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBidXR0b25IYW5kbGVyKTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNhbGVydCAuYnV0dG9ucycpLmFwcGVuZENoaWxkKGVsKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGRldGVybWluZSB0aGUgZnVuY3Rpb25hbGl0eSBvZiBlYWNoIGJ1dHRvbiBhZGRlZCB0byBhbiBhbGVydC5cclxuICpcclxuICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudFxyXG4gKi9cclxuZnVuY3Rpb24gYnV0dG9uSGFuZGxlcihldmVudCkge1xyXG4gICAgdmFyIGJ1dHRvbiA9IGluc3RhbmNlLmJ1dHRvbnNbZXZlbnQudGFyZ2V0LmlkXSB8fCB7fTtcclxuICAgIGlmICh0eXBlb2YgYnV0dG9uLmFjdGlvbiA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgYnV0dG9uLmFjdGlvbi5jYWxsKGJ1dHRvbi50aGlzQXJnKTtcclxuICAgIH1cclxuXHJcbiAgICAvL1JlcXVpcmUgdGhhdCB0aGVyZSBiZSBhbiBhY3Rpb24gYXNvY2lhdGVkIHdpdGggbm8tZGlzbWlzcyBidXR0b25zLlxyXG4gICAgaWYgKGJ1dHRvbi5kaXNtaXNzIHx8IHR5cGVvZiBidXR0b24uYWN0aW9uICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQnKS5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IH4gLm92ZXJsYXknKS5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IC5idXR0b25zJykuaW5uZXJIVE1MID0gJyc7XHJcbiAgICAgICAgaW5zdGFuY2UuYnV0dG9ucyA9IHt9O1xyXG4gICAgICAgIGluc3RhbmNlLmFjdGl2ZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBBcmUgbW9yZSBhbGVydHMgd2FpdGluZyB0byBiZSBzaG93bj9cclxuICAgICAgICBpZiAoaW5zdGFuY2UucXVldWUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGxldCBuZXh0ID0gaW5zdGFuY2UucXVldWUuc2hpZnQoKTtcclxuICAgICAgICAgICAgYWxlcnQobmV4dC50ZXh0LCBuZXh0LmJ1dHRvbnMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJcclxuXHJcbk9iamVjdC5hc3NpZ24oXHJcbiAgICBtb2R1bGUuZXhwb3J0cyxcclxuICAgIHJlcXVpcmUoJy4vYWxlcnQnKSxcclxuICAgIHJlcXVpcmUoJy4vbm90aWZ5JylcclxuKTtcclxuXHJcbnZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbmVsLmlubmVySFRNTCA9IFwiI2FsZXJ0e3Zpc2liaWxpdHk6aGlkZGVuO3Bvc2l0aW9uOmZpeGVkO3RvcDo1MHB4O2xlZnQ6MDtyaWdodDowO21hcmdpbjphdXRvO3otaW5kZXg6MTAxO3dpZHRoOjUwJTttaW4td2lkdGg6MzAwcHg7bWluLWhlaWdodDoyMDBweDtiYWNrZ3JvdW5kOiNmZmY7Ym9yZGVyLXJhZGl1czoxMHB4O3BhZGRpbmc6MTBweCAxMHB4IDU1cHggMTBweH0jYWxlcnQudmlzaWJsZXt2aXNpYmlsaXR5OnZpc2libGV9I2FsZXJ0PmRpdnt3ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOnRvdWNoO21heC1oZWlnaHQ6NjV2aDtvdmVyZmxvdy15OmF1dG99I2FsZXJ0Pi5idXR0b25ze3Bvc2l0aW9uOmFic29sdXRlO2JvdHRvbToxMHB4O2xlZnQ6NXB4fSNhbGVydD4uYnV0dG9ucz5zcGFue2Rpc3BsYXk6aW5saW5lLWJsb2NrO3BhZGRpbmc6NnB4IDEycHg7bWFyZ2luOjAgNXB4O3RleHQtYWxpZ246Y2VudGVyO3doaXRlLXNwYWNlOm5vd3JhcDtjdXJzb3I6cG9pbnRlcjtib3JkZXI6MXB4IHNvbGlkIHJnYmEoMCwwLDAsMC4xNSk7Ym9yZGVyLXJhZGl1czo2cHg7YmFja2dyb3VuZDojZmZmIGxpbmVhci1ncmFkaWVudCh0byBib3R0b20sICNmZmYgMCwgI2UwZTBlMCAxMDAlKX0jYWxlcnQ+LmJ1dHRvbnMgW2NsYXNzXXtjb2xvcjojZmZmfSNhbGVydD4uYnV0dG9ucyAuc3VjY2Vzc3tiYWNrZ3JvdW5kOiM1Y2I4NWMgbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgIzVjYjg1YyAwLCAjNDE5NjQxIDEwMCUpO2JvcmRlci1jb2xvcjojM2U4ZjNlfSNhbGVydD4uYnV0dG9ucyAuaW5mb3tiYWNrZ3JvdW5kOiM1YmMwZGUgbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgIzViYzBkZSAwLCAjMmFhYmQyIDEwMCUpO2JvcmRlci1jb2xvcjojMjhhNGM5fSNhbGVydD4uYnV0dG9ucyAuZGFuZ2Vye2JhY2tncm91bmQ6I2Q5NTM0ZiBsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCAjZDk1MzRmIDAsICNjMTJlMmEgMTAwJSk7Ym9yZGVyLWNvbG9yOiNiOTJjMjh9I2FsZXJ0Pi5idXR0b25zIC53YXJuaW5ne2JhY2tncm91bmQ6I2YwYWQ0ZSBsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCAjZjBhZDRlIDAsICNlYjkzMTYgMTAwJSk7Ym9yZGVyLWNvbG9yOiNlMzhkMTN9Lm5vdGlmaWNhdGlvbntvcGFjaXR5OjA7dHJhbnNpdGlvbjpvcGFjaXR5IDFzO3Bvc2l0aW9uOmZpeGVkO3RvcDoxZW07cmlnaHQ6MWVtO21pbi13aWR0aDoyMDBweDtib3JkZXItcmFkaXVzOjVweDtwYWRkaW5nOjVweDtiYWNrZ3JvdW5kOiM5ZmFmZWJ9Lm5vdGlmaWNhdGlvbi52aXNpYmxle29wYWNpdHk6MX1cXG5cIjtcclxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcblxyXG5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5lbC5pZCA9ICdhbGVydFdyYXBwZXInO1xyXG5lbC5pbm5lckhUTUwgPSBcIjxkaXYgaWQ9XFxcImFsZXJ0XFxcIj5cXHJcXG4gICAgPGRpdiBpZD1cXFwiYWxlcnRDb250ZW50XFxcIj48L2Rpdj5cXHJcXG4gICAgPGRpdiBjbGFzcz1cXFwiYnV0dG9uc1xcXCIvPjwvZGl2PlxcclxcbjwvZGl2PlxcclxcbjxkaXYgY2xhc3M9XFxcIm92ZXJsYXlcXFwiLz48L2Rpdj5cXHJcXG5cIjtcclxuXHJcbmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG5vdGlmeSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNlbmQgYSBub24tY3JpdGljYWwgYWxlcnQgdG8gdGhlIHVzZXIuXHJcbiAqIFNob3VsZCBiZSB1c2VkIGluIHBsYWNlIG9mIHVpLmFsZXJ0IGlmIHBvc3NpYmxlIGFzIGl0IGlzIG5vbi1ibG9ja2luZy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogLy9TaG93cyBhIG5vdGZpY2F0aW9uIGZvciAyIHNlY29uZHNcclxuICogdWkubm90aWZ5KCdOb3RpZmljYXRpb24nKTtcclxuICogLy9TaG93cyBhIG5vdGlmaWNhdGlvbiBmb3IgNSBzZWNvbmRzXHJcbiAqIHVpLm5vdGlmeSgnTm90aWZpY2F0aW9uJywgNSk7XHJcbiAqIEBwYXJhbSBTdHJpbmcgdGV4dCB0aGUgdGV4dCB0byBkaXNwbGF5LiBTaG91bGQgYmUga2VwdCBzaG9ydCB0byBhdm9pZCB2aXN1YWxseSBibG9ja2luZyB0aGUgbWVudSBvbiBzbWFsbCBkZXZpY2VzLlxyXG4gKiBAcGFyYW0gTnVtYmVyIGRpc3BsYXlUaW1lIHRoZSBudW1iZXIgb2Ygc2Vjb25kcyB0byBzaG93IHRoZSBub3RpZmljYXRpb24gZm9yLlxyXG4gKi9cclxuZnVuY3Rpb24gbm90aWZ5KHRleHQsIGRpc3BsYXlUaW1lID0gMikge1xyXG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICBlbC5jbGFzc0xpc3QuYWRkKCdub3RpZmljYXRpb24nKTtcclxuICAgIGVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcclxuICAgIGVsLnRleHRDb250ZW50ID0gdGV4dDtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWwpO1xyXG5cclxuICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5yZW1vdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XHJcbiAgICB9LmJpbmQoZWwpLCBkaXNwbGF5VGltZSAqIDEwMDApO1xyXG5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0uYmluZChlbCksIGRpc3BsYXlUaW1lICogMTAwMCArIDIxMDApO1xyXG59XHJcbiIsIi8vRGV0YWlscyBwb2x5ZmlsbCwgb2xkZXIgZmlyZWZveCwgSUVcclxuaWYgKCEoJ29wZW4nIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKSkpIHtcclxuICAgIGxldCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbiAgICBzdHlsZS50ZXh0Q29udGVudCArPSBgZGV0YWlsczpub3QoW29wZW5dKSA+IDpub3Qoc3VtbWFyeSkgeyBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH0gZGV0YWlscyA+IHN1bW1hcnk6YmVmb3JlIHsgY29udGVudDogXCLilrZcIjsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBmb250LXNpemU6IC44ZW07IHdpZHRoOiAxLjVlbTsgZm9udC1mYW1pbHk6XCJDb3VyaWVyIE5ld1wiOyB9IGRldGFpbHNbb3Blbl0gPiBzdW1tYXJ5OmJlZm9yZSB7IHRyYW5zZm9ybTogcm90YXRlKDkwZGVnKTsgfWA7XHJcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcclxuXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC50YXJnZXQudGFnTmFtZSA9PSAnU1VNTUFSWScpIHtcclxuICAgICAgICAgICAgbGV0IGRldGFpbHMgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZGV0YWlscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZGV0YWlscy5nZXRBdHRyaWJ1dGUoJ29wZW4nKSkge1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5vcGVuID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLnJlbW92ZUF0dHJpYnV0ZSgnb3BlbicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5vcGVuID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMuc2V0QXR0cmlidXRlKCdvcGVuJywgJ29wZW4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsIi8vIElFIEZpeFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0ZW1wbGF0ZSkge1xyXG4gICAgaWYgKCEoJ2NvbnRlbnQnIGluIHRlbXBsYXRlKSkge1xyXG4gICAgICAgIGxldCBjb250ZW50ID0gdGVtcGxhdGUuY2hpbGROb2RlcztcclxuICAgICAgICBsZXQgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY29udGVudC5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChjb250ZW50W2pdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRlbXBsYXRlLmNvbnRlbnQgPSBmcmFnbWVudDtcclxuICAgIH1cclxufTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBidWlsZENvbnRlbnRGcm9tVGVtcGxhdGUsXHJcbn07XHJcblxyXG52YXIgcG9seWZpbGwgPSByZXF1aXJlKCd1aS9wb2x5ZmlsbHMvdGVtcGxhdGUnKTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNsb25lIGEgdGVtcGxhdGUgYWZ0ZXIgYWx0ZXJpbmcgdGhlIHByb3ZpZGVkIHJ1bGVzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyN0ZW1wbGF0ZScsICcjdGFyZ2V0JywgW3tzZWxlY3RvcjogJ2lucHV0JywgdmFsdWU6ICdWYWx1ZSd9XSk7XHJcbiAqIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgndGVtcGxhdGUnLCAnZGl2JywgW3tzZWxlY3RvcjogJ2EnLCByZW1vdmU6IFsnaHJlZiddLCBtdWx0aXBsZTogdHJ1ZX1dKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IHRlbXBsYXRlU2VsZWN0b3JcclxuICogQHBhcmFtIHtzdHJpbmd9IHRhcmdldFNlbGVjdG9yXHJcbiAqIEBwYXJhbSB7YXJyYXl9IHJ1bGVzIGZvcm1hdDogYXJyYXkgb2Ygb2JqZWN0c1xyXG4gKiAgICAgIGVhY2ggb2JqZWN0IG11c3QgaGF2ZSBcInNlbGVjdG9yXCIuXHJcbiAqICAgICAgZWFjaCBvYmplY3QgY2FuIGhhdmUgXCJtdWx0aXBsZVwiIHNldCB0byB1cGRhdGUgYWxsIG1hdGNoaW5nIGVsZW1lbnRzLlxyXG4gKiAgICAgIGVhY2ggb2JqZWN0IGNhbiBoYXZlIFwicmVtb3ZlXCIgLSBhbiBhcnJheSBvZiBhdHRyaWJ1dGVzIHRvIHJlbW92ZS5cclxuICogICAgICBlYWNoIG9iamVjdCBjYW4gaGF2ZSBcInRleHRcIiBvciBcImh0bWxcIiAtIGZ1cnRoZXIga2V5cyB3aWxsIGJlIHNldCBhcyBhdHRyaWJ1dGVzLlxyXG4gKiAgICAgIGlmIGJvdGggdGV4dCBhbmQgaHRtbCBhcmUgc2V0LCB0ZXh0IHdpbGwgdGFrZSBwcmVjZW5kZW5jZS5cclxuICogICAgICBydWxlcyB3aWxsIGJlIHBhcnNlZCBpbiB0aGUgb3JkZXIgdGhhdCB0aGV5IGFyZSBwcmVzZW50IGluIHRoZSBhcnJheS5cclxuICovXHJcbmZ1bmN0aW9uIGJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSh0ZW1wbGF0ZVNlbGVjdG9yLCB0YXJnZXRTZWxlY3RvciwgcnVsZXMgPSBbXSkge1xyXG4gICAgdmFyIHRlbXBsYXRlID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0ZW1wbGF0ZVNlbGVjdG9yKTtcclxuXHJcbiAgICBwb2x5ZmlsbCh0ZW1wbGF0ZSk7XHJcblxyXG4gICAgdmFyIGNvbnRlbnQgPSB0ZW1wbGF0ZS5jb250ZW50O1xyXG5cclxuICAgIHJ1bGVzLmZvckVhY2gocnVsZSA9PiBoYW5kbGVSdWxlKGNvbnRlbnQsIHJ1bGUpKTtcclxuXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHRhcmdldFNlbGVjdG9yKS5hcHBlbmRDaGlsZChkb2N1bWVudC5pbXBvcnROb2RlKGNvbnRlbnQsIHRydWUpKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGFwcGx5IHJ1bGVzIHRvIHRoZSB0ZW1wbGF0ZS5cclxuICpcclxuICogQHBhcmFtIHtOb2RlfSBjb250ZW50IC0gdGhlIGNvbnRlbnQgb2YgdGhlIHRlbXBsYXRlLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcnVsZSAtIHRoZSBydWxlIHRvIGFwcGx5LlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlUnVsZShjb250ZW50LCBydWxlKSB7XHJcbiAgICBpZiAocnVsZS5tdWx0aXBsZSkge1xyXG4gICAgICAgIGxldCBlbHMgPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3JBbGwocnVsZS5zZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIEFycmF5LmZyb20oZWxzKVxyXG4gICAgICAgICAgICAuZm9yRWFjaChlbCA9PiB1cGRhdGVFbGVtZW50KGVsLCBydWxlKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxldCBlbCA9IGNvbnRlbnQucXVlcnlTZWxlY3RvcihydWxlLnNlbGVjdG9yKTtcclxuICAgICAgICBpZiAoIWVsKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgVW5hYmxlIHRvIHVwZGF0ZSAke3J1bGUuc2VsZWN0b3J9LmAsIHJ1bGUpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1cGRhdGVFbGVtZW50KGVsLCBydWxlKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIHVwZGF0ZSBhbiBlbGVtZW50IHdpdGggYSBydWxlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge05vZGV9IGVsIHRoZSBlbGVtZW50IHRvIGFwcGx5IHRoZSBydWxlcyB0by5cclxuICogQHBhcmFtIHtPYmplY3R9IHJ1bGUgdGhlIHJ1bGUgb2JqZWN0LlxyXG4gKi9cclxuZnVuY3Rpb24gdXBkYXRlRWxlbWVudChlbCwgcnVsZSkge1xyXG4gICAgaWYgKCd0ZXh0JyBpbiBydWxlKSB7XHJcbiAgICAgICAgZWwudGV4dENvbnRlbnQgPSBydWxlLnRleHQ7XHJcbiAgICB9IGVsc2UgaWYgKCdodG1sJyBpbiBydWxlKSB7XHJcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gcnVsZS5odG1sO1xyXG4gICAgfVxyXG5cclxuICAgIE9iamVjdC5rZXlzKHJ1bGUpXHJcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gIVsnc2VsZWN0b3InLCAndGV4dCcsICdodG1sJywgJ3JlbW92ZScsICdtdWx0aXBsZSddLmluY2x1ZGVzKGtleSkpXHJcbiAgICAgICAgLmZvckVhY2goa2V5ID0+IGVsLnNldEF0dHJpYnV0ZShrZXksIHJ1bGVba2V5XSkpO1xyXG5cclxuICAgIGlmIChBcnJheS5pc0FycmF5KHJ1bGUucmVtb3ZlKSkge1xyXG4gICAgICAgIHJ1bGUucmVtb3ZlLmZvckVhY2goa2V5ID0+IGVsLnJlbW92ZUF0dHJpYnV0ZShrZXkpKTtcclxuICAgIH1cclxufVxyXG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIGNvbXBhcmUgYW5kIGlzQnVmZmVyIHRha2VuIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvYmxvYi82ODBlOWU1ZTQ4OGYyMmFhYzI3NTk5YTU3ZGM4NDRhNjMxNTkyOGRkL2luZGV4LmpzXG4vLyBvcmlnaW5hbCBub3RpY2U6XG5cbi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmUoYSwgYikge1xuICBpZiAoYSA9PT0gYikge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgdmFyIHggPSBhLmxlbmd0aDtcbiAgdmFyIHkgPSBiLmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICB4ID0gYVtpXTtcbiAgICAgIHkgPSBiW2ldO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGlmICh5IDwgeCkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuZnVuY3Rpb24gaXNCdWZmZXIoYikge1xuICBpZiAoZ2xvYmFsLkJ1ZmZlciAmJiB0eXBlb2YgZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBnbG9iYWwuQnVmZmVyLmlzQnVmZmVyKGIpO1xuICB9XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpO1xufVxuXG4vLyBiYXNlZCBvbiBub2RlIGFzc2VydCwgb3JpZ2luYWwgbm90aWNlOlxuXG4vLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGZ1bmN0aW9uc0hhdmVOYW1lcyA9IChmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBmdW5jdGlvbiBmb28oKSB7fS5uYW1lID09PSAnZm9vJztcbn0oKSk7XG5mdW5jdGlvbiBwVG9TdHJpbmcgKG9iaikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaik7XG59XG5mdW5jdGlvbiBpc1ZpZXcoYXJyYnVmKSB7XG4gIGlmIChpc0J1ZmZlcihhcnJidWYpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0eXBlb2YgZ2xvYmFsLkFycmF5QnVmZmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIuaXNWaWV3ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIEFycmF5QnVmZmVyLmlzVmlldyhhcnJidWYpO1xuICB9XG4gIGlmICghYXJyYnVmKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChhcnJidWYgaW5zdGFuY2VvZiBEYXRhVmlldykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmIChhcnJidWYuYnVmZmVyICYmIGFycmJ1Zi5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbnZhciByZWdleCA9IC9cXHMqZnVuY3Rpb25cXHMrKFteXFwoXFxzXSopXFxzKi87XG4vLyBiYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vbGpoYXJiL2Z1bmN0aW9uLnByb3RvdHlwZS5uYW1lL2Jsb2IvYWRlZWVlYzhiZmNjNjA2OGIxODdkN2Q5ZmIzZDViYjFkM2EzMDg5OS9pbXBsZW1lbnRhdGlvbi5qc1xuZnVuY3Rpb24gZ2V0TmFtZShmdW5jKSB7XG4gIGlmICghdXRpbC5pc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChmdW5jdGlvbnNIYXZlTmFtZXMpIHtcbiAgICByZXR1cm4gZnVuYy5uYW1lO1xuICB9XG4gIHZhciBzdHIgPSBmdW5jLnRvU3RyaW5nKCk7XG4gIHZhciBtYXRjaCA9IHN0ci5tYXRjaChyZWdleCk7XG4gIHJldHVybiBtYXRjaCAmJiBtYXRjaFsxXTtcbn1cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBnZXROYW1lKHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh0eXBlb2YgcyA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cbmZ1bmN0aW9uIGluc3BlY3Qoc29tZXRoaW5nKSB7XG4gIGlmIChmdW5jdGlvbnNIYXZlTmFtZXMgfHwgIXV0aWwuaXNGdW5jdGlvbihzb21ldGhpbmcpKSB7XG4gICAgcmV0dXJuIHV0aWwuaW5zcGVjdChzb21ldGhpbmcpO1xuICB9XG4gIHZhciByYXduYW1lID0gZ2V0TmFtZShzb21ldGhpbmcpO1xuICB2YXIgbmFtZSA9IHJhd25hbWUgPyAnOiAnICsgcmF3bmFtZSA6ICcnO1xuICByZXR1cm4gJ1tGdW5jdGlvbicgKyAgbmFtZSArICddJztcbn1cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoaW5zcGVjdChzZWxmLmFjdHVhbCksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShpbnNwZWN0KHNlbGYuZXhwZWN0ZWQpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBmYWxzZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIGRlZXBTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCB0cnVlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBTdHJpY3RFcXVhbCcsIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIHN0cmljdCwgbWVtb3MpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoaXNCdWZmZXIoYWN0dWFsKSAmJiBpc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gY29tcGFyZShhY3R1YWwsIGV4cGVjdGVkKSA9PT0gMDtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoKGFjdHVhbCA9PT0gbnVsbCB8fCB0eXBlb2YgYWN0dWFsICE9PSAnb2JqZWN0JykgJiZcbiAgICAgICAgICAgICAoZXhwZWN0ZWQgPT09IG51bGwgfHwgdHlwZW9mIGV4cGVjdGVkICE9PSAnb2JqZWN0JykpIHtcbiAgICByZXR1cm4gc3RyaWN0ID8gYWN0dWFsID09PSBleHBlY3RlZCA6IGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyBJZiBib3RoIHZhbHVlcyBhcmUgaW5zdGFuY2VzIG9mIHR5cGVkIGFycmF5cywgd3JhcCB0aGVpciB1bmRlcmx5aW5nXG4gIC8vIEFycmF5QnVmZmVycyBpbiBhIEJ1ZmZlciBlYWNoIHRvIGluY3JlYXNlIHBlcmZvcm1hbmNlXG4gIC8vIFRoaXMgb3B0aW1pemF0aW9uIHJlcXVpcmVzIHRoZSBhcnJheXMgdG8gaGF2ZSB0aGUgc2FtZSB0eXBlIGFzIGNoZWNrZWQgYnlcbiAgLy8gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyAoYWthIHBUb1N0cmluZykuIE5ldmVyIHBlcmZvcm0gYmluYXJ5XG4gIC8vIGNvbXBhcmlzb25zIGZvciBGbG9hdCpBcnJheXMsIHRob3VnaCwgc2luY2UgZS5nLiArMCA9PT0gLTAgYnV0IHRoZWlyXG4gIC8vIGJpdCBwYXR0ZXJucyBhcmUgbm90IGlkZW50aWNhbC5cbiAgfSBlbHNlIGlmIChpc1ZpZXcoYWN0dWFsKSAmJiBpc1ZpZXcoZXhwZWN0ZWQpICYmXG4gICAgICAgICAgICAgcFRvU3RyaW5nKGFjdHVhbCkgPT09IHBUb1N0cmluZyhleHBlY3RlZCkgJiZcbiAgICAgICAgICAgICAhKGFjdHVhbCBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fFxuICAgICAgICAgICAgICAgYWN0dWFsIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSkge1xuICAgIHJldHVybiBjb21wYXJlKG5ldyBVaW50OEFycmF5KGFjdHVhbC5idWZmZXIpLFxuICAgICAgICAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KGV4cGVjdGVkLmJ1ZmZlcikpID09PSAwO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSBpZiAoaXNCdWZmZXIoYWN0dWFsKSAhPT0gaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG1lbW9zID0gbWVtb3MgfHwge2FjdHVhbDogW10sIGV4cGVjdGVkOiBbXX07XG5cbiAgICB2YXIgYWN0dWFsSW5kZXggPSBtZW1vcy5hY3R1YWwuaW5kZXhPZihhY3R1YWwpO1xuICAgIGlmIChhY3R1YWxJbmRleCAhPT0gLTEpIHtcbiAgICAgIGlmIChhY3R1YWxJbmRleCA9PT0gbWVtb3MuZXhwZWN0ZWQuaW5kZXhPZihleHBlY3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbWVtb3MuYWN0dWFsLnB1c2goYWN0dWFsKTtcbiAgICBtZW1vcy5leHBlY3RlZC5wdXNoKGV4cGVjdGVkKTtcblxuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkLCBzdHJpY3QsIG1lbW9zKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiLCBzdHJpY3QsIGFjdHVhbFZpc2l0ZWRPYmplY3RzKSB7XG4gIGlmIChhID09PSBudWxsIHx8IGEgPT09IHVuZGVmaW5lZCB8fCBiID09PSBudWxsIHx8IGIgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGlmIG9uZSBpcyBhIHByaW1pdGl2ZSwgdGhlIG90aGVyIG11c3QgYmUgc2FtZVxuICBpZiAodXRpbC5pc1ByaW1pdGl2ZShhKSB8fCB1dGlsLmlzUHJpbWl0aXZlKGIpKVxuICAgIHJldHVybiBhID09PSBiO1xuICBpZiAoc3RyaWN0ICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihhKSAhPT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgdmFyIGFJc0FyZ3MgPSBpc0FyZ3VtZW50cyhhKTtcbiAgdmFyIGJJc0FyZ3MgPSBpc0FyZ3VtZW50cyhiKTtcbiAgaWYgKChhSXNBcmdzICYmICFiSXNBcmdzKSB8fCAoIWFJc0FyZ3MgJiYgYklzQXJncykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYUlzQXJncykge1xuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYiwgc3RyaWN0KTtcbiAgfVxuICB2YXIga2EgPSBvYmplY3RLZXlzKGEpO1xuICB2YXIga2IgPSBvYmplY3RLZXlzKGIpO1xuICB2YXIga2V5LCBpO1xuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9PSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0sIHN0cmljdCwgYWN0dWFsVmlzaXRlZE9iamVjdHMpKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgZmFsc2UpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmFzc2VydC5ub3REZWVwU3RyaWN0RXF1YWwgPSBub3REZWVwU3RyaWN0RXF1YWw7XG5mdW5jdGlvbiBub3REZWVwU3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCB0cnVlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBTdHJpY3RFcXVhbCcsIG5vdERlZXBTdHJpY3RFcXVhbCk7XG4gIH1cbn1cblxuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH1cblxuICB0cnkge1xuICAgIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gSWdub3JlLiAgVGhlIGluc3RhbmNlb2YgY2hlY2sgZG9lc24ndCB3b3JrIGZvciBhcnJvdyBmdW5jdGlvbnMuXG4gIH1cblxuICBpZiAoRXJyb3IuaXNQcm90b3R5cGVPZihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gX3RyeUJsb2NrKGJsb2NrKSB7XG4gIHZhciBlcnJvcjtcbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZXJyb3IgPSBlO1xuICB9XG4gIHJldHVybiBlcnJvcjtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHR5cGVvZiBibG9jayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYmxvY2tcIiBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICdzdHJpbmcnKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIGFjdHVhbCA9IF90cnlCbG9jayhibG9jayk7XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICB2YXIgdXNlclByb3ZpZGVkTWVzc2FnZSA9IHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJztcbiAgdmFyIGlzVW53YW50ZWRFeGNlcHRpb24gPSAhc2hvdWxkVGhyb3cgJiYgdXRpbC5pc0Vycm9yKGFjdHVhbCk7XG4gIHZhciBpc1VuZXhwZWN0ZWRFeGNlcHRpb24gPSAhc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmICFleHBlY3RlZDtcblxuICBpZiAoKGlzVW53YW50ZWRFeGNlcHRpb24gJiZcbiAgICAgIHVzZXJQcm92aWRlZE1lc3NhZ2UgJiZcbiAgICAgIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fFxuICAgICAgaXNVbmV4cGVjdGVkRXhjZXB0aW9uKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzKHRydWUsIGJsb2NrLCBlcnJvciwgbWVzc2FnZSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cyhmYWxzZSwgYmxvY2ssIGVycm9yLCBtZXNzYWdlKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHRocm93IGVycjsgfTtcblxudmFyIG9iamVjdEtleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoaGFzT3duLmNhbGwob2JqLCBrZXkpKSBrZXlzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4ga2V5cztcbn07XG4iLCIvKmdsb2JhbCB3aW5kb3csIGdsb2JhbCovXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJ1dGlsXCIpXG52YXIgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKVxudmFyIG5vdyA9IHJlcXVpcmUoXCJkYXRlLW5vd1wiKVxuXG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2VcbnZhciBjb25zb2xlXG52YXIgdGltZXMgPSB7fVxuXG5pZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiAmJiBnbG9iYWwuY29uc29sZSkge1xuICAgIGNvbnNvbGUgPSBnbG9iYWwuY29uc29sZVxufSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdy5jb25zb2xlKSB7XG4gICAgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlXG59IGVsc2Uge1xuICAgIGNvbnNvbGUgPSB7fVxufVxuXG52YXIgZnVuY3Rpb25zID0gW1xuICAgIFtsb2csIFwibG9nXCJdLFxuICAgIFtpbmZvLCBcImluZm9cIl0sXG4gICAgW3dhcm4sIFwid2FyblwiXSxcbiAgICBbZXJyb3IsIFwiZXJyb3JcIl0sXG4gICAgW3RpbWUsIFwidGltZVwiXSxcbiAgICBbdGltZUVuZCwgXCJ0aW1lRW5kXCJdLFxuICAgIFt0cmFjZSwgXCJ0cmFjZVwiXSxcbiAgICBbZGlyLCBcImRpclwiXSxcbiAgICBbY29uc29sZUFzc2VydCwgXCJhc3NlcnRcIl1cbl1cblxuZm9yICh2YXIgaSA9IDA7IGkgPCBmdW5jdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdHVwbGUgPSBmdW5jdGlvbnNbaV1cbiAgICB2YXIgZiA9IHR1cGxlWzBdXG4gICAgdmFyIG5hbWUgPSB0dXBsZVsxXVxuXG4gICAgaWYgKCFjb25zb2xlW25hbWVdKSB7XG4gICAgICAgIGNvbnNvbGVbbmFtZV0gPSBmXG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbnNvbGVcblxuZnVuY3Rpb24gbG9nKCkge31cblxuZnVuY3Rpb24gaW5mbygpIHtcbiAgICBjb25zb2xlLmxvZy5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpXG59XG5cbmZ1bmN0aW9uIHdhcm4oKSB7XG4gICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKVxufVxuXG5mdW5jdGlvbiBlcnJvcigpIHtcbiAgICBjb25zb2xlLndhcm4uYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKVxufVxuXG5mdW5jdGlvbiB0aW1lKGxhYmVsKSB7XG4gICAgdGltZXNbbGFiZWxdID0gbm93KClcbn1cblxuZnVuY3Rpb24gdGltZUVuZChsYWJlbCkge1xuICAgIHZhciB0aW1lID0gdGltZXNbbGFiZWxdXG4gICAgaWYgKCF0aW1lKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIHN1Y2ggbGFiZWw6IFwiICsgbGFiZWwpXG4gICAgfVxuXG4gICAgdmFyIGR1cmF0aW9uID0gbm93KCkgLSB0aW1lXG4gICAgY29uc29sZS5sb2cobGFiZWwgKyBcIjogXCIgKyBkdXJhdGlvbiArIFwibXNcIilcbn1cblxuZnVuY3Rpb24gdHJhY2UoKSB7XG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpXG4gICAgZXJyLm5hbWUgPSBcIlRyYWNlXCJcbiAgICBlcnIubWVzc2FnZSA9IHV0aWwuZm9ybWF0LmFwcGx5KG51bGwsIGFyZ3VtZW50cylcbiAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjaylcbn1cblxuZnVuY3Rpb24gZGlyKG9iamVjdCkge1xuICAgIGNvbnNvbGUubG9nKHV0aWwuaW5zcGVjdChvYmplY3QpICsgXCJcXG5cIilcbn1cblxuZnVuY3Rpb24gY29uc29sZUFzc2VydChleHByZXNzaW9uKSB7XG4gICAgaWYgKCFleHByZXNzaW9uKSB7XG4gICAgICAgIHZhciBhcnIgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcbiAgICAgICAgYXNzZXJ0Lm9rKGZhbHNlLCB1dGlsLmZvcm1hdC5hcHBseShudWxsLCBhcnIpKVxuICAgIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gbm93XG5cbmZ1bmN0aW9uIG5vdygpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKClcbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iXX0=
