(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var api = require('./libs/blockheads');
var storage = require('./libs/storage');

const VERSION = '6.1.0';
storage.set('mb_version', VERSION, false);

//Helps avoid messages that are tacked onto the end of other messages.
var chatBuffer = [];
function checkBuffer() {
    if (chatBuffer.length) {
        api.send(chatBuffer.shift())
            .then(() => setTimeout(checkBuffer, 1000));
    } else {
        setTimeout(checkBuffer, 500);
    }
}
checkBuffer();

function send(message) {
    chatBuffer.push(message);
}

var world = {
    name: '',
    online: [],
    owner: '',
    players: storage.getObject('mb_players', {}),
    lists: {admin: [], mod: [], staff: [], black: [], white: []},
};

//Update the world object.
Promise.all([api.getLists(), api.getWorldName(), api.getOwnerName()])
    .then((values) => {
        var [lists, worldName, owner] = values;

        //Remove the owner & SERVER from the mod lists and add to admin / staff lists.
        [owner, 'SERVER'].forEach(name => {
            if (!lists.admin.includes(name)) {
                lists.admin.push(name);
            }
            if (!lists.staff.includes(name)) {
                lists.staff.push(name);
            }
            if (lists.mod.includes(name)) {
                lists.mod.splice(lists.mod.indexOf(name), 1);
            }
        });

        world.lists = lists;
        world.name = worldName;
        world.owner = owner;
    })
    .catch(bhfansapi.reportError);

function MessageBot(ajax, hook, storage, bhfansapi, api, ui) { //jshint ignore:line

    bot.world = world;

    var messages = {
        announcement: storage.getObject('announcementArr', []),
        trigger: storage.getObject('triggerArr', []),
        join: storage.getObject('joinArr', []),
        leave: storage.getObject('leaveArr', []),
    };



    //Update the players object
    Promise.all([api.getLogs(), api.getWorldName()])
        .then((values) => {
            var [log, worldName] = values;
            var last = storage.getObject('mb_lastLogLoad', 0);
            storage.set('mb_lastLogLoad', Math.floor(Date.now().valueOf()));

            log.forEach(line => {
                var time = new Date(line.substring(0, line.indexOf('b')));
                var message = line.substring(line.indexOf(']') + 2);

                if (time < last) {
                    return;
                }

                if (message.startsWith(`${worldName} - Player Connected `)) {
                    var parts = line.substr(line.indexOf(' - Player Connected ') + 20); //NAME | IP | ID
                    parts = parts.substr(0, parts.lastIndexOf(' | ')); //NAME | IP
                    var name = parts.substr(0, parts.lastIndexOf(' | '));
                    var ip = parts.substr(name.length + 3);

                    if (world.players[name]) {
                        world.players[name].joins++;
                        if (!world.players[name].ips.includes(ip)) {
                            world.players[name].ips.push(ip);
                        }
                    } else {
                        world.players[name] = {joins: 1, ips: [ip]};
                    }
                    world.players[name].ip = ip;
                }
            });
        })
        .then(() => storage.set('mb_players', world.players))
        .catch(bhfansapi.reportError);

    //Handle default / missing preferences
    (function(prefs) {
        function checkPref(type, name, selector, defval) {
            if (typeof prefs[name] != type) {
                prefs[name] = defval;
            }

            if (type == 'boolean') {
                document.querySelector(selector).checked = prefs[name] ? 'checked' : '';
            } else {
                document.querySelector(selector).value = prefs[name];
            }

        }

        checkPref('number', 'announcementDelay', '#mb_ann_delay', 10);
        checkPref('number', 'maxResponses', '#mb_resp_max', 2);
        checkPref('boolean', 'regexTriggers', '#mb_regex_triggers', false);
        checkPref('boolean', 'disableTrim', '#mb_disable_trim', false);
        checkPref('boolean', 'notify', '#mb_notify_message', true);
    }(bot.preferences));

    //Add the configured messages to the page.
    (function(msgs, ids, tids) {
        msgs.forEach((type, index) => {
            messages[type].forEach((msg) => {
                ui.addMsg(`#${tids[index]}`, `#${ids[index]}`, msg);
            });
        });
    }(
        ['join', 'leave', 'trigger', 'announcement'],
        ['jMsgs', 'lMsgs', 'tMsgs', 'aMsgs'],
        ['jlTemplate', 'jlTemplate', 'tTemplate', 'aTemplate']
    ));

    // Sends announcements after the specified delay.
    (function announcementCheck(i) {
        i = (i >= messages.announcement.length) ? 0 : i;

        var ann = messages.announcement[i];

        if (ann && ann.message) {
            bot.send(ann.message);
        }
        setTimeout(announcementCheck, bot.preferences.announcementDelay * 60000, i + 1);
    })(0);

    //Add messages to page
    hook.listen('world.other', function(message) {
        ui.addMessageToConsole(message, undefined, 'other');
    });
    hook.listen('world.message', function(name, message) {
        let msgClass = 'player';
        if (bot.checkGroup('staff', name)) {
            msgClass = 'staff';
            if (bot.checkGroup('mod', name)) {
                msgClass += ' mod';
            } else {
                //Has to be admin
                msgClass += ' admin';
            }
        }
        if (message.startsWith('/')) {
            msgClass += ' command';
        }
        ui.addMessageToConsole(message, name, msgClass);
    });
    hook.listen('world.serverchat', function(message) {
        ui.addMessageToConsole(message, 'SERVER', 'admin');
    });
    hook.listen('world.send', function(message) {
        if (message.startsWith('/')) {
            ui.addMessageToConsole(message, 'SERVER', 'admin command');
        }
    });

    //Message handlers
    hook.listen('world.join', function handlePlayerJoin(name, ip) {
        //Add / update lists
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

        storage.set('mb_players', world.players);

        if (!world.online.includes(name)) {
            world.online.push(name);
        }

        ui.addMessageToConsole(`${name} (${ip}) has joined the server`, 'SERVER', 'join world admin');
    });
    hook.listen('world.leave', function handlePlayerLeave(name) {
        if (world.online.includes(name)) {
            world.online.splice(world.online.indexOf(name), 1);
        }

        ui.addMessageToConsole(`${name} has left the server`, 'SERVER', `leave world admin`);
    });

    //Update the staff lists if needed
    hook.listen('world.command', function(name, command, target) {
        target = target.toLocaleUpperCase();
        command = command.toLocaleLowerCase();

        if (!bot.checkGroup('admin', name)) {
            return;
        }

        var lists = world.lists;
        if (['admin', 'unadmin', 'mod', 'unmod'].includes(command)) {
            if (command.startsWith('un')) {
                command = command.substr(2);
                if (lists[command].includes(target)) {
                    lists[command].splice(lists[command].indexOf(target), 1);
                }
            } else {
                if (!lists[command].includes(target)) {
                    lists[command].push(target);
                }
            }

            //Rebuild the staff lists
            lists.mod = lists.mod.filter((name) => lists.admin.indexOf(name) < 0);
            lists.staff = lists.admin.concat(lists.mod);
        }

        if (['whitelist', 'unwhitelist'].includes(command)) {
            if (command.startsWith('un')) {
                if (lists.white.includes(target)) {
                    lists.white.splice(lists.white.indexOf(target), 1);
                }
            } else {
                if (!lists.white.includes(target)) {
                    lists.white.push(target);
                }
            }
        }

        if (['ban', 'unban'].includes(command)) {
            //FIXME: Support needed for device IDs.
            if (command.startsWith('un')) {
                if (lists.black.includes(target)) {
                    lists.black.splice(lists.black.indexOf(target), 1);
                }
            } else {
                if (!lists.black.includes(target)) {
                    lists.black.push(target);
                }
            }
        }
    });

    //Handle changed messages
    hook.listen('ui.messageChanged', saveConfig);
    hook.listen('ui.messageDeleted', saveConfig);
    function saveConfig() {
        function saveFromWrapper(id, to, key) {
            to.length = 0;

            var wrappers = document.getElementById(id).children;
            var selects,
                joinCounts,
                tmpMsgObj = {};
            for (var i = 0; i < wrappers.length; i++) {
                tmpMsgObj.message = wrappers[i].querySelector('.m').value;
                if (id != 'aMsgs') {
                    selects = wrappers[i].querySelectorAll('select');
                    joinCounts = wrappers[i].querySelectorAll('input[type="number"]');
                    tmpMsgObj.group = selects[0].value;
                    tmpMsgObj.not_group = selects[1].value;
                    tmpMsgObj.joins_low = joinCounts[0].value;
                    tmpMsgObj.joins_high = joinCounts[1].value;
                }
                if (id == 'tMsgs') {
                    if (bot.preferences.disableTrim) {
                        tmpMsgObj.trigger = wrappers[i].querySelector('.t').value;
                    } else {
                        tmpMsgObj.trigger = wrappers[i].querySelector('.t').value.trim();
                    }
                }
                to.push(tmpMsgObj);
                tmpMsgObj = {};
            }

            storage.set(key, to);
        }

        saveFromWrapper('lMsgs', messages.leave, 'leaveArr');
        saveFromWrapper('jMsgs', messages.join, 'joinArr');
        saveFromWrapper('tMsgs', messages.trigger, 'triggerArr');
        saveFromWrapper('aMsgs', messages.announcement, 'announcementArr');

        storage.set('mb_version', bot.version, false);
    }

    //Handle user messages
    function userSend(message) {
        var input = document.querySelector('#mb_console input');
        var button = document.querySelector('#mb_console button');
        button.textContent = 'SEND';
        [input, button].forEach((el) => el.disabled = true);

        message = hook.update('bot.send', message);

        // Don't add user messages to the buffer.
        api.send(message)
            .then((response) => {
                if (response.status == 'ok') {
                    input.value = '';

                } else {
                    button.textContent = 'RETRY';
                    throw new Error(JSON.stringify(response));
                }
            })
            .catch(() => { /* Nothing */ })
            .then(() => {
                [input, button].forEach((el) => el.disabled = false);
                if (document.querySelector('#mb_console.visible')) {
                    input.focus();
                }
            });
    }

    //Listen for user to send message
    document.querySelector('#mb_console input').addEventListener('keydown', function(event) {
        if (event.key == "Enter" || event.keyCode == 13) {
            event.preventDefault();
            userSend(event.target.value);
        }
    });
    document.querySelector('#mb_console button').addEventListener('click', function() {
        userSend(document.querySelector('#mb_console input').value);
    });

    hook.listen('ui.prefChanged', function savePrefs() {
        var getValue = (selector) => document.querySelector(selector).value;
        var getChecked = (selector) => document.querySelector(selector).checked;

        var prefs = bot.preferences;
        prefs.announcementDelay = +getValue('#mb_ann_delay');
        prefs.maxResponses = +getValue('#mb_resp_max');
        prefs.regexTriggers = getChecked('#mb_regex_triggers');
        prefs.disableTrim = getChecked('#mb_disable_trim');
        prefs.notify = getChecked('#mb_notify_message');

        storage.set('mb_preferences', prefs, false);
    });

    //Handle user defined messages.
    (function() {
        var sendOK = false;
        setTimeout(function waitForMessages() {
            //Wait for a while before responding to triggers, avoids massive bot spams
            sendOK = true;
        }, 10000);

        function checkJoinsAndGroup(message, name) {
            if (!sendOK) {
                return false;
            }

            if (!world.players.hasOwnProperty(name)) {
                return false;
            }

            var current = world.players[name].joins;

            var joinsOK = message.joins_low <= current && message.joins_high >= current;
            var groupOK = bot.checkGroup(message.group, name) && !bot.checkGroup(message.not_group, name);

            return joinsOK && groupOK;
        }

        function buildMessage(message, name) {
            message = message.replace(/{{NAME}}/g, name)
                .replace(/{{Name}}/g, name[0] + name.substring(1).toLocaleLowerCase())
                .replace(/{{name}}/g, name.toLocaleLowerCase());

            if (message.startsWith('/')) {
                message = message.replace(/{{ip}}/gi, world.players[name].ip);
            }

            return message;
        }

        hook.listen('world.join', function onJoin(name) {
            messages.join.forEach((msg) => {
                if (checkJoinsAndGroup(msg, name)) {
                    bot.send(buildMessage(msg.message, name));
                }
            });
        });

        hook.listen('world.leave', function onLeave(name) {
            messages.leave.forEach((msg) => {
                if (checkJoinsAndGroup(msg, name)) {
                    bot.send(buildMessage(msg.message, name));
                }
            });
        });

        hook.listen('world.message', function onTrigger(name, message) {
            function triggerMatch(trigger, message) {
                if (bot.preferences.regexTriggers) {
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

            var totalAllowed = bot.preferences.maxResponses;
            messages.trigger.forEach((msg) => {
                if (checkJoinsAndGroup(msg, name) && triggerMatch(msg.trigger, message) && totalAllowed) {
                    bot.send(buildMessage(msg.message, name));
                    totalAllowed--;
                }
            });
        });

        hook.listen('bot.usersend', function handleWhitespace(message) {
            return message.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        });

        hook.listen('world.message', function chatNotifications(name, message) {
            if (bot.preferences.notify && document.querySelector('#mb_console.visible') === null) {
                bot.ui.notify(`${name}: ${message}`);
            }
        });
    }());

    /**
     * Function used to check if users are in defined groups.
     *
     * @param string group the group to check
     * @param string name the name of the user to check
     * @return boolean
     */
    bot.checkGroup = function checkGroup(group, name) {
        name = name.toLocaleUpperCase();
        switch (group.toLocaleLowerCase()) {
            case 'all':
                return true;
            case 'admin':
                return world.lists.admin.includes(name);
            case 'mod':
                return world.lists.mod.includes(name);
            case 'staff':
                return world.lists.staff.includes(name);
            case 'owner':
                return world.owner == name;
            default:
                return false;
        }
    };

    return bot;
}

},{"./libs/blockheads":5,"./libs/storage":8}],2:[function(require,module,exports){
var bot = require('./MessageBot');
var ui = require('./ui');
var storage = require('./libs/storage');
var ajax = require('./libs/ajax');
var api = require('./libs/blockheads');
var hook = require('./libs/hook');

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
    hook.fire('extension.installed', namespace);

    var extension = {
        id: namespace,
        bot,
        ui,
        storage,
        ajax,
        api,
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

    hook.fire('extension.uninstall', id);
};

// Load extensions that set themselves to autoload last launch.
storage.getObject(STORAGE_ID, [], false).forEach(MessageBotExtension.install);

// Array of IDs to autolaod at the next launch.
var autoload = [];

module.exports = MessageBotExtension;

},{"./MessageBot":1,"./libs/ajax":3,"./libs/blockheads":5,"./libs/hook":6,"./libs/storage":8,"./ui":13}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
/**
 * @file Contains functions to interact with blockheadsfans.com - cannot be used by extensions.
 */

var ui = require('../ui');
var ajax = require('./ajax');

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

},{"../ui":13,"./ajax":3}],5:[function(require,module,exports){
var ajax = require('./ajax');
var hook = require('./hook');
var bhfansapi = require('./bhfansapi');

const worldId = window.worldId;
checkChat();

// Used to parse messages more accurately
var world = {
    name: '',
    online: []
};
getOnlinePlayers()
    .then(players => world.players = [...new Set(players.concat(world.players))]);

getWorldName()
    .then(name => world.name = name);


var cache = {
    firstId: 0,
};

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
                //jshint maxcomplexity: 7
                ajax.postJSON('/api', { command: 'status', worldId }).then(response => {
                    switch (response.worldStarted) {
                        case 'online':
                            return resolve();
                        case 'offline':
                            ajax.postJSON('/api', { command: 'start', worldId })
                                .then(check, check);
                            break;
                        case 'unavailible':
                            return reject('World unavailible.');
                        case 'startup':
                        case 'shutdown':
                            setTimeout(check, 3000);
                            if (++fails > 10) {
                                return reject('World took too long to start.');
                            }
                            break;
                        default:
                            return reject('Unknown response.');
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

},{"./ajax":3,"./bhfansapi":4,"./hook":6}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
//Imported vars / functions
/*globals
    INCLUDE_FILE
*/

//Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

require('./polyfills/console');
require('./libs/migration');

var ui = require('./ui');
var bhfansapi = require('./libs/bhfansapi');
var hook = require('./libs/hook');

hook.on('error', bhfansapi.reportError);

"var api = require('./libs/blockheads');\r\nvar storage = require('./libs/storage');\r\n\r\nconst VERSION = '6.1.0';\r\nstorage.set('mb_version', VERSION, false);\r\n\r\n//Helps avoid messages that are tacked onto the end of other messages.\r\nvar chatBuffer = [];\r\nfunction checkBuffer() {\r\n    if (chatBuffer.length) {\r\n        api.send(chatBuffer.shift())\r\n            .then(() => setTimeout(checkBuffer, 1000));\r\n    } else {\r\n        setTimeout(checkBuffer, 500);\r\n    }\r\n}\r\ncheckBuffer();\r\n\r\nfunction send(message) {\r\n    chatBuffer.push(message);\r\n}\r\n\r\nvar world = {\r\n    name: '',\r\n    online: [],\r\n    owner: '',\r\n    players: storage.getObject('mb_players', {}),\r\n    lists: {admin: [], mod: [], staff: [], black: [], white: []},\r\n};\r\n\r\n//Update the world object.\r\nPromise.all([api.getLists(), api.getWorldName(), api.getOwnerName()])\r\n    .then((values) => {\r\n        var [lists, worldName, owner] = values;\r\n\r\n        //Remove the owner & SERVER from the mod lists and add to admin / staff lists.\r\n        [owner, 'SERVER'].forEach(name => {\r\n            if (!lists.admin.includes(name)) {\r\n                lists.admin.push(name);\r\n            }\r\n            if (!lists.staff.includes(name)) {\r\n                lists.staff.push(name);\r\n            }\r\n            if (lists.mod.includes(name)) {\r\n                lists.mod.splice(lists.mod.indexOf(name), 1);\r\n            }\r\n        });\r\n\r\n        world.lists = lists;\r\n        world.name = worldName;\r\n        world.owner = owner;\r\n    })\r\n    .catch(bhfansapi.reportError);\r\n\r\nfunction MessageBot(ajax, hook, storage, bhfansapi, api, ui) { //jshint ignore:line\r\n\r\n    bot.world = world;\r\n\r\n    var messages = {\r\n        announcement: storage.getObject('announcementArr', []),\r\n        trigger: storage.getObject('triggerArr', []),\r\n        join: storage.getObject('joinArr', []),\r\n        leave: storage.getObject('leaveArr', []),\r\n    };\r\n\r\n\r\n\r\n    //Update the players object\r\n    Promise.all([api.getLogs(), api.getWorldName()])\r\n        .then((values) => {\r\n            var [log, worldName] = values;\r\n            var last = storage.getObject('mb_lastLogLoad', 0);\r\n            storage.set('mb_lastLogLoad', Math.floor(Date.now().valueOf()));\r\n\r\n            log.forEach(line => {\r\n                var time = new Date(line.substring(0, line.indexOf('b')));\r\n                var message = line.substring(line.indexOf(']') + 2);\r\n\r\n                if (time < last) {\r\n                    return;\r\n                }\r\n\r\n                if (message.startsWith(`${worldName} - Player Connected `)) {\r\n                    var parts = line.substr(line.indexOf(' - Player Connected ') + 20); //NAME | IP | ID\r\n                    parts = parts.substr(0, parts.lastIndexOf(' | ')); //NAME | IP\r\n                    var name = parts.substr(0, parts.lastIndexOf(' | '));\r\n                    var ip = parts.substr(name.length + 3);\r\n\r\n                    if (world.players[name]) {\r\n                        world.players[name].joins++;\r\n                        if (!world.players[name].ips.includes(ip)) {\r\n                            world.players[name].ips.push(ip);\r\n                        }\r\n                    } else {\r\n                        world.players[name] = {joins: 1, ips: [ip]};\r\n                    }\r\n                    world.players[name].ip = ip;\r\n                }\r\n            });\r\n        })\r\n        .then(() => storage.set('mb_players', world.players))\r\n        .catch(bhfansapi.reportError);\r\n\r\n    //Handle default / missing preferences\r\n    (function(prefs) {\r\n        function checkPref(type, name, selector, defval) {\r\n            if (typeof prefs[name] != type) {\r\n                prefs[name] = defval;\r\n            }\r\n\r\n            if (type == 'boolean') {\r\n                document.querySelector(selector).checked = prefs[name] ? 'checked' : '';\r\n            } else {\r\n                document.querySelector(selector).value = prefs[name];\r\n            }\r\n\r\n        }\r\n\r\n        checkPref('number', 'announcementDelay', '#mb_ann_delay', 10);\r\n        checkPref('number', 'maxResponses', '#mb_resp_max', 2);\r\n        checkPref('boolean', 'regexTriggers', '#mb_regex_triggers', false);\r\n        checkPref('boolean', 'disableTrim', '#mb_disable_trim', false);\r\n        checkPref('boolean', 'notify', '#mb_notify_message', true);\r\n    }(bot.preferences));\r\n\r\n    //Add the configured messages to the page.\r\n    (function(msgs, ids, tids) {\r\n        msgs.forEach((type, index) => {\r\n            messages[type].forEach((msg) => {\r\n                ui.addMsg(`#${tids[index]}`, `#${ids[index]}`, msg);\r\n            });\r\n        });\r\n    }(\r\n        ['join', 'leave', 'trigger', 'announcement'],\r\n        ['jMsgs', 'lMsgs', 'tMsgs', 'aMsgs'],\r\n        ['jlTemplate', 'jlTemplate', 'tTemplate', 'aTemplate']\r\n    ));\r\n\r\n    // Sends announcements after the specified delay.\r\n    (function announcementCheck(i) {\r\n        i = (i >= messages.announcement.length) ? 0 : i;\r\n\r\n        var ann = messages.announcement[i];\r\n\r\n        if (ann && ann.message) {\r\n            bot.send(ann.message);\r\n        }\r\n        setTimeout(announcementCheck, bot.preferences.announcementDelay * 60000, i + 1);\r\n    })(0);\r\n\r\n    //Add messages to page\r\n    hook.listen('world.other', function(message) {\r\n        ui.addMessageToConsole(message, undefined, 'other');\r\n    });\r\n    hook.listen('world.message', function(name, message) {\r\n        let msgClass = 'player';\r\n        if (bot.checkGroup('staff', name)) {\r\n            msgClass = 'staff';\r\n            if (bot.checkGroup('mod', name)) {\r\n                msgClass += ' mod';\r\n            } else {\r\n                //Has to be admin\r\n                msgClass += ' admin';\r\n            }\r\n        }\r\n        if (message.startsWith('/')) {\r\n            msgClass += ' command';\r\n        }\r\n        ui.addMessageToConsole(message, name, msgClass);\r\n    });\r\n    hook.listen('world.serverchat', function(message) {\r\n        ui.addMessageToConsole(message, 'SERVER', 'admin');\r\n    });\r\n    hook.listen('world.send', function(message) {\r\n        if (message.startsWith('/')) {\r\n            ui.addMessageToConsole(message, 'SERVER', 'admin command');\r\n        }\r\n    });\r\n\r\n    //Message handlers\r\n    hook.listen('world.join', function handlePlayerJoin(name, ip) {\r\n        //Add / update lists\r\n        if (world.players.hasOwnProperty(name)) {\r\n            //Returning player\r\n            world.players[name].joins++;\r\n            if (!world.players[name].ips.includes(ip)) {\r\n                world.players[name].ips.push(ip);\r\n            }\r\n        } else {\r\n            //New player\r\n            world.players[name] = {joins: 1, ips: [ip]};\r\n        }\r\n        world.players[name].ip = ip;\r\n\r\n        storage.set('mb_players', world.players);\r\n\r\n        if (!world.online.includes(name)) {\r\n            world.online.push(name);\r\n        }\r\n\r\n        ui.addMessageToConsole(`${name} (${ip}) has joined the server`, 'SERVER', 'join world admin');\r\n    });\r\n    hook.listen('world.leave', function handlePlayerLeave(name) {\r\n        if (world.online.includes(name)) {\r\n            world.online.splice(world.online.indexOf(name), 1);\r\n        }\r\n\r\n        ui.addMessageToConsole(`${name} has left the server`, 'SERVER', `leave world admin`);\r\n    });\r\n\r\n    //Update the staff lists if needed\r\n    hook.listen('world.command', function(name, command, target) {\r\n        target = target.toLocaleUpperCase();\r\n        command = command.toLocaleLowerCase();\r\n\r\n        if (!bot.checkGroup('admin', name)) {\r\n            return;\r\n        }\r\n\r\n        var lists = world.lists;\r\n        if (['admin', 'unadmin', 'mod', 'unmod'].includes(command)) {\r\n            if (command.startsWith('un')) {\r\n                command = command.substr(2);\r\n                if (lists[command].includes(target)) {\r\n                    lists[command].splice(lists[command].indexOf(target), 1);\r\n                }\r\n            } else {\r\n                if (!lists[command].includes(target)) {\r\n                    lists[command].push(target);\r\n                }\r\n            }\r\n\r\n            //Rebuild the staff lists\r\n            lists.mod = lists.mod.filter((name) => lists.admin.indexOf(name) < 0);\r\n            lists.staff = lists.admin.concat(lists.mod);\r\n        }\r\n\r\n        if (['whitelist', 'unwhitelist'].includes(command)) {\r\n            if (command.startsWith('un')) {\r\n                if (lists.white.includes(target)) {\r\n                    lists.white.splice(lists.white.indexOf(target), 1);\r\n                }\r\n            } else {\r\n                if (!lists.white.includes(target)) {\r\n                    lists.white.push(target);\r\n                }\r\n            }\r\n        }\r\n\r\n        if (['ban', 'unban'].includes(command)) {\r\n            //FIXME: Support needed for device IDs.\r\n            if (command.startsWith('un')) {\r\n                if (lists.black.includes(target)) {\r\n                    lists.black.splice(lists.black.indexOf(target), 1);\r\n                }\r\n            } else {\r\n                if (!lists.black.includes(target)) {\r\n                    lists.black.push(target);\r\n                }\r\n            }\r\n        }\r\n    });\r\n\r\n    //Handle changed messages\r\n    hook.listen('ui.messageChanged', saveConfig);\r\n    hook.listen('ui.messageDeleted', saveConfig);\r\n    function saveConfig() {\r\n        function saveFromWrapper(id, to, key) {\r\n            to.length = 0;\r\n\r\n            var wrappers = document.getElementById(id).children;\r\n            var selects,\r\n                joinCounts,\r\n                tmpMsgObj = {};\r\n            for (var i = 0; i < wrappers.length; i++) {\r\n                tmpMsgObj.message = wrappers[i].querySelector('.m').value;\r\n                if (id != 'aMsgs') {\r\n                    selects = wrappers[i].querySelectorAll('select');\r\n                    joinCounts = wrappers[i].querySelectorAll('input[type=\"number\"]');\r\n                    tmpMsgObj.group = selects[0].value;\r\n                    tmpMsgObj.not_group = selects[1].value;\r\n                    tmpMsgObj.joins_low = joinCounts[0].value;\r\n                    tmpMsgObj.joins_high = joinCounts[1].value;\r\n                }\r\n                if (id == 'tMsgs') {\r\n                    if (bot.preferences.disableTrim) {\r\n                        tmpMsgObj.trigger = wrappers[i].querySelector('.t').value;\r\n                    } else {\r\n                        tmpMsgObj.trigger = wrappers[i].querySelector('.t').value.trim();\r\n                    }\r\n                }\r\n                to.push(tmpMsgObj);\r\n                tmpMsgObj = {};\r\n            }\r\n\r\n            storage.set(key, to);\r\n        }\r\n\r\n        saveFromWrapper('lMsgs', messages.leave, 'leaveArr');\r\n        saveFromWrapper('jMsgs', messages.join, 'joinArr');\r\n        saveFromWrapper('tMsgs', messages.trigger, 'triggerArr');\r\n        saveFromWrapper('aMsgs', messages.announcement, 'announcementArr');\r\n\r\n        storage.set('mb_version', bot.version, false);\r\n    }\r\n\r\n    //Handle user messages\r\n    function userSend(message) {\r\n        var input = document.querySelector('#mb_console input');\r\n        var button = document.querySelector('#mb_console button');\r\n        button.textContent = 'SEND';\r\n        [input, button].forEach((el) => el.disabled = true);\r\n\r\n        message = hook.update('bot.send', message);\r\n\r\n        // Don't add user messages to the buffer.\r\n        api.send(message)\r\n            .then((response) => {\r\n                if (response.status == 'ok') {\r\n                    input.value = '';\r\n\r\n                } else {\r\n                    button.textContent = 'RETRY';\r\n                    throw new Error(JSON.stringify(response));\r\n                }\r\n            })\r\n            .catch(() => { /* Nothing */ })\r\n            .then(() => {\r\n                [input, button].forEach((el) => el.disabled = false);\r\n                if (document.querySelector('#mb_console.visible')) {\r\n                    input.focus();\r\n                }\r\n            });\r\n    }\r\n\r\n    //Listen for user to send message\r\n    document.querySelector('#mb_console input').addEventListener('keydown', function(event) {\r\n        if (event.key == \"Enter\" || event.keyCode == 13) {\r\n            event.preventDefault();\r\n            userSend(event.target.value);\r\n        }\r\n    });\r\n    document.querySelector('#mb_console button').addEventListener('click', function() {\r\n        userSend(document.querySelector('#mb_console input').value);\r\n    });\r\n\r\n    hook.listen('ui.prefChanged', function savePrefs() {\r\n        var getValue = (selector) => document.querySelector(selector).value;\r\n        var getChecked = (selector) => document.querySelector(selector).checked;\r\n\r\n        var prefs = bot.preferences;\r\n        prefs.announcementDelay = +getValue('#mb_ann_delay');\r\n        prefs.maxResponses = +getValue('#mb_resp_max');\r\n        prefs.regexTriggers = getChecked('#mb_regex_triggers');\r\n        prefs.disableTrim = getChecked('#mb_disable_trim');\r\n        prefs.notify = getChecked('#mb_notify_message');\r\n\r\n        storage.set('mb_preferences', prefs, false);\r\n    });\r\n\r\n    //Handle user defined messages.\r\n    (function() {\r\n        var sendOK = false;\r\n        setTimeout(function waitForMessages() {\r\n            //Wait for a while before responding to triggers, avoids massive bot spams\r\n            sendOK = true;\r\n        }, 10000);\r\n\r\n        function checkJoinsAndGroup(message, name) {\r\n            if (!sendOK) {\r\n                return false;\r\n            }\r\n\r\n            if (!world.players.hasOwnProperty(name)) {\r\n                return false;\r\n            }\r\n\r\n            var current = world.players[name].joins;\r\n\r\n            var joinsOK = message.joins_low <= current && message.joins_high >= current;\r\n            var groupOK = bot.checkGroup(message.group, name) && !bot.checkGroup(message.not_group, name);\r\n\r\n            return joinsOK && groupOK;\r\n        }\r\n\r\n        function buildMessage(message, name) {\r\n            message = message.replace(/{{NAME}}/g, name)\r\n                .replace(/{{Name}}/g, name[0] + name.substring(1).toLocaleLowerCase())\r\n                .replace(/{{name}}/g, name.toLocaleLowerCase());\r\n\r\n            if (message.startsWith('/')) {\r\n                message = message.replace(/{{ip}}/gi, world.players[name].ip);\r\n            }\r\n\r\n            return message;\r\n        }\r\n\r\n        hook.listen('world.join', function onJoin(name) {\r\n            messages.join.forEach((msg) => {\r\n                if (checkJoinsAndGroup(msg, name)) {\r\n                    bot.send(buildMessage(msg.message, name));\r\n                }\r\n            });\r\n        });\r\n\r\n        hook.listen('world.leave', function onLeave(name) {\r\n            messages.leave.forEach((msg) => {\r\n                if (checkJoinsAndGroup(msg, name)) {\r\n                    bot.send(buildMessage(msg.message, name));\r\n                }\r\n            });\r\n        });\r\n\r\n        hook.listen('world.message', function onTrigger(name, message) {\r\n            function triggerMatch(trigger, message) {\r\n                if (bot.preferences.regexTriggers) {\r\n                    try {\r\n                        return new RegExp(trigger, 'i').test(message);\r\n                    } catch (e) {\r\n                        ui.notify(`Skipping trigger '${trigger}' as the RegEx is invaild.`);\r\n                        return false;\r\n                    }\r\n                }\r\n                return new RegExp(\r\n                    trigger\r\n                        .replace(/([.+?^=!:${}()|\\[\\]\\/\\\\])/g, \"\\\\$1\")\r\n                        .replace(/\\*/g, \".*\"),\r\n                        'i'\r\n                    ).test(message);\r\n            }\r\n\r\n            var totalAllowed = bot.preferences.maxResponses;\r\n            messages.trigger.forEach((msg) => {\r\n                if (checkJoinsAndGroup(msg, name) && triggerMatch(msg.trigger, message) && totalAllowed) {\r\n                    bot.send(buildMessage(msg.message, name));\r\n                    totalAllowed--;\r\n                }\r\n            });\r\n        });\r\n\r\n        hook.listen('bot.usersend', function handleWhitespace(message) {\r\n            return message.replace(/\\\\n/g, '\\n').replace(/\\\\t/g, '\\t');\r\n        });\r\n\r\n        hook.listen('world.message', function chatNotifications(name, message) {\r\n            if (bot.preferences.notify && document.querySelector('#mb_console.visible') === null) {\r\n                bot.ui.notify(`${name}: ${message}`);\r\n            }\r\n        });\r\n    }());\r\n\r\n    /**\r\n     * Function used to check if users are in defined groups.\r\n     *\r\n     * @param string group the group to check\r\n     * @param string name the name of the user to check\r\n     * @return boolean\r\n     */\r\n    bot.checkGroup = function checkGroup(group, name) {\r\n        name = name.toLocaleUpperCase();\r\n        switch (group.toLocaleLowerCase()) {\r\n            case 'all':\r\n                return true;\r\n            case 'admin':\r\n                return world.lists.admin.includes(name);\r\n            case 'mod':\r\n                return world.lists.mod.includes(name);\r\n            case 'staff':\r\n                return world.lists.staff.includes(name);\r\n            case 'owner':\r\n                return world.owner == name;\r\n            default:\r\n                return false;\r\n        }\r\n    };\r\n\r\n    return bot;\r\n}\r\n";
"var bot = require('./MessageBot');\r\nvar ui = require('./ui');\r\nvar storage = require('./libs/storage');\r\nvar ajax = require('./libs/ajax');\r\nvar api = require('./libs/blockheads');\r\nvar hook = require('./libs/hook');\r\n\r\nconst STORAGE_ID = 'mb_extensions';\r\n\r\n/**\r\n * Used to create a new extension.\r\n *\r\n * @example\r\n * var test = MessageBotExtension('test');\r\n * @param {string} namespace - Should be the same as your variable name.\r\n * @return {MessageBotExtension} - The extension variable.\r\n */\r\nfunction MessageBotExtension(namespace) {\r\n    hook.fire('extension.installed', namespace);\r\n\r\n    var extension = {\r\n        id: namespace,\r\n        bot,\r\n        ui,\r\n        storage,\r\n        ajax,\r\n        api,\r\n        hook,\r\n    };\r\n\r\n    /**\r\n     * Used to change whether or not the extension will be\r\n     * Automatically loaded the next time the bot is launched.\r\n     *\r\n     * @example\r\n     * var test = MessageBotExtension('test');\r\n     * test.setAutoLaunch(true);\r\n     * @param {bool} shouldAutoload\r\n     */\r\n    extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {\r\n        if (!autoload.includes(namespace) && shouldAutoload) {\r\n            autoload.push(namespace);\r\n            storage.set(STORAGE_ID, autoload, false);\r\n        } else if (!shouldAutoload) {\r\n            if (autoload.includes(namespace)) {\r\n                autoload.splice(autoload.indexOf(namespace), 1);\r\n                storage.set(STORAGE_ID, autoload, false);\r\n            }\r\n        }\r\n    };\r\n\r\n    return extension;\r\n}\r\n\r\n/**\r\n * Tries to load the requested extension by ID.\r\n *\r\n * @param {string} id\r\n */\r\nMessageBotExtension.install = function install(id) {\r\n    var el = document.createElement('script');\r\n    el.src = `//blockheadsfans.com/messagebot/extension/${id}/code/raw`;\r\n    el.crossOrigin = 'anonymous';\r\n    document.head.appendChild(el);\r\n};\r\n\r\n/**\r\n * Uninstalls an extension.\r\n *\r\n * @param {string} id\r\n */\r\nMessageBotExtension.uninstall = function uninstall(id) {\r\n    try {\r\n        window[id].uninstall();\r\n    } catch (e) {\r\n        //Not installed, or no uninstall function.\r\n    }\r\n\r\n    window[id] = undefined;\r\n\r\n    if (autoload.includes(id)) {\r\n        autoload.splice(autoload.indexOf(id), 1);\r\n        storage.set(STORAGE_ID, autoload, false);\r\n    }\r\n\r\n    hook.fire('extension.uninstall', id);\r\n};\r\n\r\n// Load extensions that set themselves to autoload last launch.\r\nstorage.getObject(STORAGE_ID, [], false).forEach(MessageBotExtension.install);\r\n\r\n// Array of IDs to autolaod at the next launch.\r\nvar autoload = [];\r\n\r\nmodule.exports = MessageBotExtension;\r\n";


window.addEventListener('error', (err) => {
    if (err.message != 'Script error') {
        window.hook.check('error', err);
    }
});

},{"./libs/bhfansapi":4,"./libs/hook":6,"./libs/migration":7,"./polyfills/console":9,"./ui":13}],12:[function(require,module,exports){
var paths = [
    './alert',
    './notify',
    './template',
    './navigation',
    './console'
];

paths.forEach(path => {
    Object.assign(module.exports, require(path));
});

},{}],13:[function(require,module,exports){
// Build the API
module.exports = require('./exports');

// Build the page
require('./page');
require('./listeners');

},{"./exports":12,"./listeners":14,"./page":16}],14:[function(require,module,exports){
// Listeners for user actions within the bot

// -- No dependencies

// Auto scroll when new messages are added to the page, unless the owner is reading old chat.
(new MutationObserver(function showNewChat() {
    let container = document.querySelector('#mb_console ul');
    let lastLine = document.querySelector('#mb_console li:last-child');

    if (!container || !lastLine) {
        return;
    }

    if (container.scrollHeight - container.clientHeight - container.scrollTop <= lastLine.clientHeight * 2) {
        lastLine.scrollIntoView(false);
    }
})).observe(document.querySelector('#mb_console chat'), {childList: true});


// Remove old chat to reduce memory usage
(new MutationObserver(function removeOldChat() {
    var chat = document.querySelector('#mb_console ul');

    while (chat.children.length > 500) {
        chat.children[0].remove();
    }
})).observe(document.querySelector('#mb_console chat'), {childList: true});


// Change fullscreen tabs
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
    Array.from(document.querySelector('#leftNav .selected'))
        .forEach(el => el.classList.remove('selected'));
    event.target.classList.add('selected');
});


// -- Depends on UI

var ui = require('./exports');


// Hide the menu when clicking the overlay
document.querySelector('#leftNav .overlay').addEventListener('click', ui.toggleMenu);

},{"./exports":12}],15:[function(require,module,exports){
var bhfansapi = require('../../libs/bhfansapi');
var ui = require('../exports');
var hook = require('../../libs/hook');
var MessageBotExtension = require('../../MessageBotExtension');

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
            {selector: '.ext', 'data-id': extension.id},
            {selector: 'button', text: bhfansapi.extensionInstalled(extension.id) ? 'Remove' : 'Install'}
        ]);
    });
}).catch(bhfansapi.reportError);

// Install / uninstall extensions
function extActions(tagName, e) {
    if (e.target.tagName != tagName) {
        return;
    }
    var el = e.target;
    var id = el.parentElement.dataset.id;

    if (el.textContent == 'Install') {
        MessageBotExtension.install(id);
    } else {
        MessageBotExtension.uninstall(id);
    }
}

document.querySelector('#exts')
    .addEventListener('click', extActions.bind(null, 'BUTTON'));

document.querySelector('#mb_ext_list')
    .addEventListener('click', extActions.bind(null, 'A'));


hook.on('extension.installed', function(id) {
    //List
    bhfansapi.getExtensionName(id).then(resp => {
        var container = document.querySelector('#mb_ext_list ul');
        if (resp.status != 'ok') {
            throw new Error(resp.message);
        }

        let li = document.createElement('li');
        let span = document.createElement('span');
        let a = document.createElement('a');

        span.textContent = `${resp.name} (${resp.id})`;
        a.textContent = 'Remove';
        li.dataset.id = resp.id;

        li.appendChild(span);
        li.appendChild(a);
        container.appendChild(li);
    }).catch(bhfansapi.reportError);

    //Store
    var button = document.querySelector(`#mb_extensions [data-id="${id}"] button`);
    if (button) {
        button.textContent = 'Remove';
    }
});

hook.on('extension.uninstalled', function(id) {
    //List
    var li = document.querySelector(`#mb_ext_list [data-id="${id}"]`);
    if (li) {
        li.remove();
    }

    //Store
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

},{"../../MessageBotExtension":2,"../../libs/bhfansapi":4,"../../libs/hook":6,"../exports":12}],16:[function(require,module,exports){
/*globals
    INCLUDE_FILE
*/

// Build the page

document.head.innerHTML = "<title>Console - MessageBot</title> <link rel=\"icon\" href=\"http://forums.theblockheads.net/uploads/default/original/3X/b/d/bd489ba3dddafb66906af3b377069fe4a3551a3a.png\"> <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"> ";

var s = document.createElement('style');
s.textContent = "html,body{min-height:100vh;position:relative;width:100%;margin:0;font-family:\"Lucida Grande\",\"Lucida Sans Unicode\",Verdana,sans-serif;color:#000}textarea,input,button,select{font-family:inherit}a{cursor:pointer;color:#182b73}.overlay{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99;background:rgba(0,0,0,0.7);visibility:hidden;opacity:0;transition:opacity .5s}.overlay.visible{visibility:visible;opacity:1;transition:opacity .5s}#botTemplates{display:none}header{background:#182b73 url(\"http://portal.theblockheads.net/static/images/portalHeader.png\") no-repeat;background-position:80px;height:80px}#jMsgs,#lMsgs,#tMsgs,#aMsgs,#exts{padding-top:8px;margin-top:8px;border-top:1px solid;height:calc(100vh - 185px)}.third-box,#mb_join .msg,#mb_leave .msg,#mb_trigger .msg,#mb_announcements .msg,#mb_extensions .ext{position:relative;float:left;width:calc(33% - 19px);min-width:280px;padding:5px;margin-left:5px;margin-bottom:5px;border:3px solid #999;border-radius:10px}.third-box:nth-child(odd),#mb_join .msg:nth-child(odd),#mb_leave .msg:nth-child(odd),#mb_trigger .msg:nth-child(odd),#mb_announcements .msg:nth-child(odd),#mb_extensions .ext:nth-child(odd){background:#ccc}.top-right-button,#mb_join .add,#mb_leave .add,#mb_trigger .add,#mb_announcements .add,#mb_extensions #mb_load_man{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:10px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}.button,#mb_extensions .ext button,#alert>.buttons>span{display:inline-block;padding:6px 12px;margin:0 5px;text-align:center;white-space:nowrap;cursor:pointer;border:1px solid rgba(0,0,0,0.15);border-radius:6px;background:#fff linear-gradient(to bottom, #fff 0, #e0e0e0 100%)}#leftNav{text-transform:uppercase}#leftNav nav{width:250px;background:#182b73;color:#fff;position:fixed;left:-250px;z-index:100;top:0;bottom:0;transition:left .5s}#leftNav details,#leftNav span{display:block;text-align:center;padding:5px 7px;border-bottom:1px solid white}#leftNav .selected{background:radial-gradient(#9fafeb, #182b73)}#leftNav summary ~ span{background:rgba(159,175,235,0.4)}#leftNav summary+span{border-top-left-radius:20px;border-top-right-radius:20px}#leftNav summary ~ span:last-of-type{border:0;border-bottom-left-radius:20px;border-bottom-right-radius:20px}#leftNav input{display:none}#leftNav label{color:#fff;background:#213b9d;padding:5px;position:fixed;top:5px;z-index:100;left:5px;opacity:1;transition:left .5s,opacity .5s}#leftNav input:checked ~ nav{left:0;transition:left .5s}#leftNav input:checked ~ label{left:255px;opacity:0;transition:left .5s,opacity .5s}#leftNav input:checked ~ .overlay{visibility:visible;opacity:1;transition:opacity .5s}#container>div{height:calc(100vh - 100px);padding:10px;position:absolute;top:80px;left:0;right:0;overflow:auto}#container>div:not(.visible){display:none}#mb_console .chat{height:calc(100vh - 220px)}@media screen and (min-width: 668px){#mb_console .chat{height:calc(100vh - 155px)}}#mb_console ul{height:100%;overflow-y:auto;margin:0;padding:0}#mb_console li{list-style-type:none}#mb_console .controls{display:flex;padding:0 10px}#mb_console input,#mb_console button{margin:5px 0}#mb_console input{font-size:1em;padding:1px;flex:1;border:solid 1px #999}#mb_console button{background:#182b73;font-weight:bold;color:#fff;border:0;height:40px;padding:1px 4px}#mb_console .mod>span:first-child{color:#05f529}#mb_console .admin>span:first-child{color:#2b26bd}#mb_settings h3{border-bottom:1px solid #999}#mb_settings a{text-decoration:underline}#mb_settings a.button{text-decoration:none;font-size:0.9em;padding:1px 5px}#mb_join h3,#mb_leave h3,#mb_trigger h3,#mb_announcements h3{margin:0 0 5px 0}#mb_join input,#mb_join textarea,#mb_leave input,#mb_leave textarea,#mb_trigger input,#mb_trigger textarea,#mb_announcements input,#mb_announcements textarea{border:2px solid #666;width:calc(100% - 10px)}#mb_join textarea,#mb_leave textarea,#mb_trigger textarea,#mb_announcements textarea{resize:none;overflow:hidden;padding:1px 0;height:21px;transition:height .5s}#mb_join textarea:focus,#mb_leave textarea:focus,#mb_trigger textarea:focus,#mb_announcements textarea:focus{height:5em}#mb_join input[type=\"number\"],#mb_leave input[type=\"number\"],#mb_trigger input[type=\"number\"],#mb_announcements input[type=\"number\"]{width:5em}#mb_extensions #mb_load_man{width:inherit;padding:0 7px}#mb_extensions h3{margin:0 0 5px 0}#mb_extensions .ext{height:130px}#mb_extensions .ext h4,#mb_extensions .ext p{margin:0}#mb_extensions .ext button{position:absolute;bottom:7px;padding:5px 8px}#alert{visibility:hidden;position:fixed;top:50px;left:0;right:0;margin:auto;z-index:101;width:50%;min-width:300px;min-height:200px;background:#fff;border-radius:10px;padding:10px 10px 55px 10px}#alert.visible{visibility:visible}#alert>div{webkit-overflow-scrolling:touch;max-height:65vh;overflow-y:auto}#alert>.buttons{position:absolute;bottom:10px;left:5px}#alert>.buttons [class]{color:#fff}#alert>.buttons .success{background:#5cb85c linear-gradient(to bottom, #5cb85c 0, #419641 100%);border-color:#3e8f3e}#alert>.buttons .info{background:#5bc0de linear-gradient(to bottom, #5bc0de 0, #2aabd2 100%);border-color:#28a4c9}#alert>.buttons .danger{background:#d9534f linear-gradient(to bottom, #d9534f 0, #c12e2a 100%);border-color:#b92c28}#alert>.buttons .warning{background:#f0ad4e linear-gradient(to bottom, #f0ad4e 0, #eb9316 100%);border-color:#e38d13}.notification{opacity:0;transition:opacity 1s;position:fixed;top:1em;right:1em;min-width:200px;border-radius:5px;padding:5px;background:#9fafeb}.notification.visible{opacity:1}";
document.head.appendChild(s);

document.body.innerHTML = "<div id=\"leftNav\"> <input type=\"checkbox\" id=\"leftToggle\"> <label for=\"leftToggle\">&#9776; Menu</label> <nav data-tab-group=\"main\"> <span class=\"tab selected\" data-tab-name=\"console\">Console</span> <details data-tab-group=\"messages\"> <summary>Messages</summary> <span class=\"tab\" data-tab-name=\"join\">Join</span> <span class=\"tab\" data-tab-name=\"leave\">Leave</span> <span class=\"tab\" data-tab-name=\"trigger\">Trigger</span> <span class=\"tab\" data-tab-name=\"announcements\">Announcements</span> </details> <span class=\"tab\" data-tab-name=\"extensions\">Extensions</span> <span class=\"tab\" data-tab-name=\"settings\">Settings</span> <div class=\"clearfix\"> </nav> <div class=\"overlay\"></div> </div> <div id=\"botTemplates\"> <template id=\"jlTemplate\"> <div class=\"msg\"> <label>When the player is </label> <select data-target=\"group\"> <option value=\"All\">anyone</option> <option value=\"Staff\">a staff member</option> <option value=\"Mod\">a mod</option> <option value=\"Admin\">an admin</option> <option value=\"Owner\">the owner</option> </select> <label> who is not </label> <select data-target=\"not_group\"> <option value=\"Nobody\">nobody</option> <option value=\"Staff\">a staff member</option> <option value=\"Mod\">a mod</option> <option value=\"Admin\">an admin</option> <option value=\"Owner\">the owner</option> </select> <label> then say </label> <textarea class=\"m\"></textarea> <label> in chat if the player has joined between </label> <input type=\"number\" value=\"0\" data-target=\"joins_low\"> <label> and </label> <input type=\"number\" value=\"9999\" data-target=\"joins_high\"> <label> times.</label><br> <a>Delete</a> </div> </template> <template id=\"tTemplate\"> <div class=\"msg\"> <label>When </label> <select data-target=\"group\"> <option value=\"All\">anyone</option> <option value=\"Staff\">a staff member</option> <option value=\"Mod\">a mod</option> <option value=\"Admin\">an admin</option> <option value=\"Owner\">the owner</option> </select> <label> who is not </label> <select data-target=\"not_group\"> <option value=\"Nobody\">nobody</option> <option value=\"Staff\">a staff member</option> <option value=\"Mod\">a mod</option> <option value=\"Admin\">an admin</option> <option value=\"Owner\">the owner</option> </select> <label> says </label> <input class=\"t\"> <label> in chat, say </label> <textarea class=\"m\"></textarea> <label> if the player has joined between </label> <input type=\"number\" value=\"0\" data-target=\"joins_low\"> <label> and </label> <input type=\"number\" value=\"9999\" data-target=\"joins_high\"> <label>times. </label><br> <a>Delete</a> </div> </template> <template id=\"aTemplate\"> <div class=\"ann\"> <label>Send:</label> <textarea class=\"m\"></textarea> <a>Delete</a> <label style=\"display:block;margin-top:5px\">Wait X minutes...</label> </div> </template> <template id=\"extTemplate\"> <div class=\"ext\"> <h4>Title</h4> <span>Description</span><br> <button class=\"button\">Install</button> </div> </template> </div> <div id=\"container\"> <header></header> <div id=\"mb_console\" data-tab-name=\"console\" class=\"visible\"> <div class=\"chat\"> <ul></ul> </div> <div class=\"controls\"> <input type=\"text\"><button>SEND</button> </div> </div> <div id=\"mb_join\" data-tab-name=\"join\"> <h3>These are checked when a player joins the server.</h3> <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class=\"add\">+</span> <div id=\"jMsgs\"></div> </div> <div id=\"mb_leave\" data-tab-name=\"leave\"> <h3>These are checked when a player leaves the server.</h3> <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class=\"add\">+</span> <div id=\"lMsgs\"></div> </div> <div id=\"mb_trigger\" data-tab-name=\"trigger\"> <h3>These are checked whenever someone says something.</h3> <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger \"te*st\" will match \"tea stuff\" and \"test\")</span> <span class=\"add\">+</span> <div id=\"tMsgs\"></div> </div> <div id=\"mb_announcements\" data-tab-name=\"announcements\"> <h3>These are sent according to a regular schedule.</h3> <span>If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span> <span class=\"add\">+</span> <div id=\"aMsgs\"></div> </div> <div id=\"mb_extensions\" data-tab-name=\"extensions\"> <h3>Extensions can increase the functionality of the bot.</h3> <span>Interested in creating one? <a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki\" target=\"_blank\">Click here.</a></span> <span id=\"mb_load_man\">Load By ID/URL</span> <div id=\"exts\"></div> </div> <div id=\"mb_settings\" data-tab-name=\"settings\"> <h3>Settings</h3> <label for=\"mb_ann_delay\">Minutes between announcements: </label><br> <input id=\"mb_ann_delay\" type=\"number\"><br> <label for=\"mb_resp_max\">Maximum trigger responses to a message: </label><br> <input id=\"mb_resp_max\" type=\"number\"><br> <label for=\"mb_notify_message\">New chat notifications: </label> <input id=\"mb_notify_message\" type=\"checkbox\"><br> <h3>Advanced Settings</h3> <a href=\"https://github.com/Bibliofile/Blockheads-MessageBot/wiki/Advanced-Options\" target=\"_blank\">Read this first</a><br> <label for=\"mb_disable_trim\">Disable whitespace trimming: </label> <input id=\"mb_disable_trim\" type=\"checkbox\"><br> <label for=\"mb_regex_triggers\">Parse triggers as RegEx: </label> <input id=\"mb_regex_triggers\" type=\"checkbox\"><br> <h3>Extensions</h3> <div id=\"mb_ext_list\"></div> <h3>Backup / Restore</h3> <a id=\"mb_backup_save\">Get backup code</a><br> <a id=\"mb_backup_load\">Load previous backup</a> <div id=\"mb_backup\"></div> </div> </div> <div id=\"alertWrapper\"> <div id=\"alert\"> <div id=\"alertContent\"></div> <div class=\"buttons\"></div> </div> <div class=\"overlay\"> ";

require('../../polyfills/details');

require('./extensions');
require('./settings');

},{"../../polyfills/details":10,"./extensions":15,"./settings":17}],17:[function(require,module,exports){
var ui = require('../exports');
var MessageBotExtension = require('../../MessageBotExtension');

document.querySelector('#mb_backup_load').addEventListener('click', function loadBackup() {
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

document.querySelector('#mb_load_man').addEventListener('click', function loadExtension() {
    ui.alert('Enter the ID or URL of an extension:<br><input style="width:calc(100% - 7px);"/>',
                [
                    {text: 'Add', style: 'success', action: function() {
                        let extRef = document.querySelector('#alert input').value;
                        if (extRef.length) {
                            if (extRef.startsWith('http')) {
                                let el = document.createElement('script');
                                el.src = extRef;
                                document.head.appendChild(el);
                            } else {
                                MessageBotExtension.install(extRef);
                            }
                        }
                    }},
                    {text: 'Cancel'}
                ]);
});

document.querySelector('#mb_backup_save').addEventListener('click', function showBackup() {
    var backup = JSON.stringify(localStorage).replace(/</g, '&lt;');
    ui.alert(`Copy this to a safe place:<br><textarea style="width: calc(100% - 7px);height:160px;">${backup}</textarea>`);
});

},{"../../MessageBotExtension":2,"../exports":12}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvTWVzc2FnZUJvdC5qcyIsImRldi9NZXNzYWdlQm90RXh0ZW5zaW9uLmpzIiwiZGV2L2xpYnMvYWpheC5qcyIsImRldi9saWJzL2JoZmFuc2FwaS5qcyIsImRldi9saWJzL2Jsb2NraGVhZHMuanMiLCJkZXYvbGlicy9ob29rLmpzIiwiZGV2L2xpYnMvbWlncmF0aW9uLmpzIiwiZGV2L2xpYnMvc3RvcmFnZS5qcyIsImRldi9wb2x5ZmlsbHMvY29uc29sZS5qcyIsImRldi9wb2x5ZmlsbHMvZGV0YWlscy5qcyIsImRldi9zdGFydC5qcyIsImRldi91aS9leHBvcnRzL2luZGV4LmpzIiwiZGV2L3VpL2luZGV4LmpzIiwiZGV2L3VpL2xpc3RlbmVycy5qcyIsImRldi91aS9wYWdlL2V4dGVuc2lvbnMuanMiLCJkZXYvdWkvcGFnZS9pbmRleC5qcyIsImRldi91aS9wYWdlL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5ZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgYXBpID0gcmVxdWlyZSgnLi9saWJzL2Jsb2NraGVhZHMnKTtcclxudmFyIHN0b3JhZ2UgPSByZXF1aXJlKCcuL2xpYnMvc3RvcmFnZScpO1xyXG5cclxuY29uc3QgVkVSU0lPTiA9ICc2LjEuMCc7XHJcbnN0b3JhZ2Uuc2V0KCdtYl92ZXJzaW9uJywgVkVSU0lPTiwgZmFsc2UpO1xyXG5cclxuLy9IZWxwcyBhdm9pZCBtZXNzYWdlcyB0aGF0IGFyZSB0YWNrZWQgb250byB0aGUgZW5kIG9mIG90aGVyIG1lc3NhZ2VzLlxyXG52YXIgY2hhdEJ1ZmZlciA9IFtdO1xyXG5mdW5jdGlvbiBjaGVja0J1ZmZlcigpIHtcclxuICAgIGlmIChjaGF0QnVmZmVyLmxlbmd0aCkge1xyXG4gICAgICAgIGFwaS5zZW5kKGNoYXRCdWZmZXIuc2hpZnQoKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gc2V0VGltZW91dChjaGVja0J1ZmZlciwgMTAwMCkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQnVmZmVyLCA1MDApO1xyXG4gICAgfVxyXG59XHJcbmNoZWNrQnVmZmVyKCk7XHJcblxyXG5mdW5jdGlvbiBzZW5kKG1lc3NhZ2UpIHtcclxuICAgIGNoYXRCdWZmZXIucHVzaChtZXNzYWdlKTtcclxufVxyXG5cclxudmFyIHdvcmxkID0ge1xyXG4gICAgbmFtZTogJycsXHJcbiAgICBvbmxpbmU6IFtdLFxyXG4gICAgb3duZXI6ICcnLFxyXG4gICAgcGxheWVyczogc3RvcmFnZS5nZXRPYmplY3QoJ21iX3BsYXllcnMnLCB7fSksXHJcbiAgICBsaXN0czoge2FkbWluOiBbXSwgbW9kOiBbXSwgc3RhZmY6IFtdLCBibGFjazogW10sIHdoaXRlOiBbXX0sXHJcbn07XHJcblxyXG4vL1VwZGF0ZSB0aGUgd29ybGQgb2JqZWN0LlxyXG5Qcm9taXNlLmFsbChbYXBpLmdldExpc3RzKCksIGFwaS5nZXRXb3JsZE5hbWUoKSwgYXBpLmdldE93bmVyTmFtZSgpXSlcclxuICAgIC50aGVuKCh2YWx1ZXMpID0+IHtcclxuICAgICAgICB2YXIgW2xpc3RzLCB3b3JsZE5hbWUsIG93bmVyXSA9IHZhbHVlcztcclxuXHJcbiAgICAgICAgLy9SZW1vdmUgdGhlIG93bmVyICYgU0VSVkVSIGZyb20gdGhlIG1vZCBsaXN0cyBhbmQgYWRkIHRvIGFkbWluIC8gc3RhZmYgbGlzdHMuXHJcbiAgICAgICAgW293bmVyLCAnU0VSVkVSJ10uZm9yRWFjaChuYW1lID0+IHtcclxuICAgICAgICAgICAgaWYgKCFsaXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgbGlzdHMuYWRtaW4ucHVzaChuYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIWxpc3RzLnN0YWZmLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICBsaXN0cy5zdGFmZi5wdXNoKG5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChsaXN0cy5tb2QuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIGxpc3RzLm1vZC5zcGxpY2UobGlzdHMubW9kLmluZGV4T2YobmFtZSksIDEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHdvcmxkLmxpc3RzID0gbGlzdHM7XHJcbiAgICAgICAgd29ybGQubmFtZSA9IHdvcmxkTmFtZTtcclxuICAgICAgICB3b3JsZC5vd25lciA9IG93bmVyO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChiaGZhbnNhcGkucmVwb3J0RXJyb3IpO1xyXG5cclxuZnVuY3Rpb24gTWVzc2FnZUJvdChhamF4LCBob29rLCBzdG9yYWdlLCBiaGZhbnNhcGksIGFwaSwgdWkpIHsgLy9qc2hpbnQgaWdub3JlOmxpbmVcclxuXHJcbiAgICBib3Qud29ybGQgPSB3b3JsZDtcclxuXHJcbiAgICB2YXIgbWVzc2FnZXMgPSB7XHJcbiAgICAgICAgYW5ub3VuY2VtZW50OiBzdG9yYWdlLmdldE9iamVjdCgnYW5ub3VuY2VtZW50QXJyJywgW10pLFxyXG4gICAgICAgIHRyaWdnZXI6IHN0b3JhZ2UuZ2V0T2JqZWN0KCd0cmlnZ2VyQXJyJywgW10pLFxyXG4gICAgICAgIGpvaW46IHN0b3JhZ2UuZ2V0T2JqZWN0KCdqb2luQXJyJywgW10pLFxyXG4gICAgICAgIGxlYXZlOiBzdG9yYWdlLmdldE9iamVjdCgnbGVhdmVBcnInLCBbXSksXHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgLy9VcGRhdGUgdGhlIHBsYXllcnMgb2JqZWN0XHJcbiAgICBQcm9taXNlLmFsbChbYXBpLmdldExvZ3MoKSwgYXBpLmdldFdvcmxkTmFtZSgpXSlcclxuICAgICAgICAudGhlbigodmFsdWVzKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBbbG9nLCB3b3JsZE5hbWVdID0gdmFsdWVzO1xyXG4gICAgICAgICAgICB2YXIgbGFzdCA9IHN0b3JhZ2UuZ2V0T2JqZWN0KCdtYl9sYXN0TG9nTG9hZCcsIDApO1xyXG4gICAgICAgICAgICBzdG9yYWdlLnNldCgnbWJfbGFzdExvZ0xvYWQnLCBNYXRoLmZsb29yKERhdGUubm93KCkudmFsdWVPZigpKSk7XHJcblxyXG4gICAgICAgICAgICBsb2cuZm9yRWFjaChsaW5lID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciB0aW1lID0gbmV3IERhdGUobGluZS5zdWJzdHJpbmcoMCwgbGluZS5pbmRleE9mKCdiJykpKTtcclxuICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlID0gbGluZS5zdWJzdHJpbmcobGluZS5pbmRleE9mKCddJykgKyAyKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGltZSA8IGxhc3QpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChgJHt3b3JsZE5hbWV9IC0gUGxheWVyIENvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJ0cyA9IGxpbmUuc3Vic3RyKGxpbmUuaW5kZXhPZignIC0gUGxheWVyIENvbm5lY3RlZCAnKSArIDIwKTsgLy9OQU1FIHwgSVAgfCBJRFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcnRzID0gcGFydHMuc3Vic3RyKDAsIHBhcnRzLmxhc3RJbmRleE9mKCcgfCAnKSk7IC8vTkFNRSB8IElQXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBwYXJ0cy5zdWJzdHIoMCwgcGFydHMubGFzdEluZGV4T2YoJyB8ICcpKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaXAgPSBwYXJ0cy5zdWJzdHIobmFtZS5sZW5ndGggKyAzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdvcmxkLnBsYXllcnNbbmFtZV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXS5qb2lucysrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXdvcmxkLnBsYXllcnNbbmFtZV0uaXBzLmluY2x1ZGVzKGlwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXS5pcHMucHVzaChpcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JsZC5wbGF5ZXJzW25hbWVdID0ge2pvaW5zOiAxLCBpcHM6IFtpcF19O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB3b3JsZC5wbGF5ZXJzW25hbWVdLmlwID0gaXA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gc3RvcmFnZS5zZXQoJ21iX3BsYXllcnMnLCB3b3JsZC5wbGF5ZXJzKSlcclxuICAgICAgICAuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKTtcclxuXHJcbiAgICAvL0hhbmRsZSBkZWZhdWx0IC8gbWlzc2luZyBwcmVmZXJlbmNlc1xyXG4gICAgKGZ1bmN0aW9uKHByZWZzKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gY2hlY2tQcmVmKHR5cGUsIG5hbWUsIHNlbGVjdG9yLCBkZWZ2YWwpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwcmVmc1tuYW1lXSAhPSB0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICBwcmVmc1tuYW1lXSA9IGRlZnZhbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGUgPT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKS5jaGVja2VkID0gcHJlZnNbbmFtZV0gPyAnY2hlY2tlZCcgOiAnJztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpLnZhbHVlID0gcHJlZnNbbmFtZV07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjaGVja1ByZWYoJ251bWJlcicsICdhbm5vdW5jZW1lbnREZWxheScsICcjbWJfYW5uX2RlbGF5JywgMTApO1xyXG4gICAgICAgIGNoZWNrUHJlZignbnVtYmVyJywgJ21heFJlc3BvbnNlcycsICcjbWJfcmVzcF9tYXgnLCAyKTtcclxuICAgICAgICBjaGVja1ByZWYoJ2Jvb2xlYW4nLCAncmVnZXhUcmlnZ2VycycsICcjbWJfcmVnZXhfdHJpZ2dlcnMnLCBmYWxzZSk7XHJcbiAgICAgICAgY2hlY2tQcmVmKCdib29sZWFuJywgJ2Rpc2FibGVUcmltJywgJyNtYl9kaXNhYmxlX3RyaW0nLCBmYWxzZSk7XHJcbiAgICAgICAgY2hlY2tQcmVmKCdib29sZWFuJywgJ25vdGlmeScsICcjbWJfbm90aWZ5X21lc3NhZ2UnLCB0cnVlKTtcclxuICAgIH0oYm90LnByZWZlcmVuY2VzKSk7XHJcblxyXG4gICAgLy9BZGQgdGhlIGNvbmZpZ3VyZWQgbWVzc2FnZXMgdG8gdGhlIHBhZ2UuXHJcbiAgICAoZnVuY3Rpb24obXNncywgaWRzLCB0aWRzKSB7XHJcbiAgICAgICAgbXNncy5mb3JFYWNoKCh0eXBlLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICBtZXNzYWdlc1t0eXBlXS5mb3JFYWNoKChtc2cpID0+IHtcclxuICAgICAgICAgICAgICAgIHVpLmFkZE1zZyhgIyR7dGlkc1tpbmRleF19YCwgYCMke2lkc1tpbmRleF19YCwgbXNnKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KFxyXG4gICAgICAgIFsnam9pbicsICdsZWF2ZScsICd0cmlnZ2VyJywgJ2Fubm91bmNlbWVudCddLFxyXG4gICAgICAgIFsnak1zZ3MnLCAnbE1zZ3MnLCAndE1zZ3MnLCAnYU1zZ3MnXSxcclxuICAgICAgICBbJ2psVGVtcGxhdGUnLCAnamxUZW1wbGF0ZScsICd0VGVtcGxhdGUnLCAnYVRlbXBsYXRlJ11cclxuICAgICkpO1xyXG5cclxuICAgIC8vIFNlbmRzIGFubm91bmNlbWVudHMgYWZ0ZXIgdGhlIHNwZWNpZmllZCBkZWxheS5cclxuICAgIChmdW5jdGlvbiBhbm5vdW5jZW1lbnRDaGVjayhpKSB7XHJcbiAgICAgICAgaSA9IChpID49IG1lc3NhZ2VzLmFubm91bmNlbWVudC5sZW5ndGgpID8gMCA6IGk7XHJcblxyXG4gICAgICAgIHZhciBhbm4gPSBtZXNzYWdlcy5hbm5vdW5jZW1lbnRbaV07XHJcblxyXG4gICAgICAgIGlmIChhbm4gJiYgYW5uLm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgYm90LnNlbmQoYW5uLm1lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzZXRUaW1lb3V0KGFubm91bmNlbWVudENoZWNrLCBib3QucHJlZmVyZW5jZXMuYW5ub3VuY2VtZW50RGVsYXkgKiA2MDAwMCwgaSArIDEpO1xyXG4gICAgfSkoMCk7XHJcblxyXG4gICAgLy9BZGQgbWVzc2FnZXMgdG8gcGFnZVxyXG4gICAgaG9vay5saXN0ZW4oJ3dvcmxkLm90aGVyJywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgICAgIHVpLmFkZE1lc3NhZ2VUb0NvbnNvbGUobWVzc2FnZSwgdW5kZWZpbmVkLCAnb3RoZXInKTtcclxuICAgIH0pO1xyXG4gICAgaG9vay5saXN0ZW4oJ3dvcmxkLm1lc3NhZ2UnLCBmdW5jdGlvbihuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICAgICAgbGV0IG1zZ0NsYXNzID0gJ3BsYXllcic7XHJcbiAgICAgICAgaWYgKGJvdC5jaGVja0dyb3VwKCdzdGFmZicsIG5hbWUpKSB7XHJcbiAgICAgICAgICAgIG1zZ0NsYXNzID0gJ3N0YWZmJztcclxuICAgICAgICAgICAgaWYgKGJvdC5jaGVja0dyb3VwKCdtb2QnLCBuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgbXNnQ2xhc3MgKz0gJyBtb2QnO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy9IYXMgdG8gYmUgYWRtaW5cclxuICAgICAgICAgICAgICAgIG1zZ0NsYXNzICs9ICcgYWRtaW4nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgICAgICBtc2dDbGFzcyArPSAnIGNvbW1hbmQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICB1aS5hZGRNZXNzYWdlVG9Db25zb2xlKG1lc3NhZ2UsIG5hbWUsIG1zZ0NsYXNzKTtcclxuICAgIH0pO1xyXG4gICAgaG9vay5saXN0ZW4oJ3dvcmxkLnNlcnZlcmNoYXQnLCBmdW5jdGlvbihtZXNzYWdlKSB7XHJcbiAgICAgICAgdWkuYWRkTWVzc2FnZVRvQ29uc29sZShtZXNzYWdlLCAnU0VSVkVSJywgJ2FkbWluJyk7XHJcbiAgICB9KTtcclxuICAgIGhvb2subGlzdGVuKCd3b3JsZC5zZW5kJywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgICAgICB1aS5hZGRNZXNzYWdlVG9Db25zb2xlKG1lc3NhZ2UsICdTRVJWRVInLCAnYWRtaW4gY29tbWFuZCcpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vTWVzc2FnZSBoYW5kbGVyc1xyXG4gICAgaG9vay5saXN0ZW4oJ3dvcmxkLmpvaW4nLCBmdW5jdGlvbiBoYW5kbGVQbGF5ZXJKb2luKG5hbWUsIGlwKSB7XHJcbiAgICAgICAgLy9BZGQgLyB1cGRhdGUgbGlzdHNcclxuICAgICAgICBpZiAod29ybGQucGxheWVycy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xyXG4gICAgICAgICAgICAvL1JldHVybmluZyBwbGF5ZXJcclxuICAgICAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXS5qb2lucysrO1xyXG4gICAgICAgICAgICBpZiAoIXdvcmxkLnBsYXllcnNbbmFtZV0uaXBzLmluY2x1ZGVzKGlwKSkge1xyXG4gICAgICAgICAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXS5pcHMucHVzaChpcCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvL05ldyBwbGF5ZXJcclxuICAgICAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXSA9IHtqb2luczogMSwgaXBzOiBbaXBdfTtcclxuICAgICAgICB9XHJcbiAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXS5pcCA9IGlwO1xyXG5cclxuICAgICAgICBzdG9yYWdlLnNldCgnbWJfcGxheWVycycsIHdvcmxkLnBsYXllcnMpO1xyXG5cclxuICAgICAgICBpZiAoIXdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgICAgICB3b3JsZC5vbmxpbmUucHVzaChuYW1lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHVpLmFkZE1lc3NhZ2VUb0NvbnNvbGUoYCR7bmFtZX0gKCR7aXB9KSBoYXMgam9pbmVkIHRoZSBzZXJ2ZXJgLCAnU0VSVkVSJywgJ2pvaW4gd29ybGQgYWRtaW4nKTtcclxuICAgIH0pO1xyXG4gICAgaG9vay5saXN0ZW4oJ3dvcmxkLmxlYXZlJywgZnVuY3Rpb24gaGFuZGxlUGxheWVyTGVhdmUobmFtZSkge1xyXG4gICAgICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICAgICAgd29ybGQub25saW5lLnNwbGljZSh3b3JsZC5vbmxpbmUuaW5kZXhPZihuYW1lKSwgMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1aS5hZGRNZXNzYWdlVG9Db25zb2xlKGAke25hbWV9IGhhcyBsZWZ0IHRoZSBzZXJ2ZXJgLCAnU0VSVkVSJywgYGxlYXZlIHdvcmxkIGFkbWluYCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvL1VwZGF0ZSB0aGUgc3RhZmYgbGlzdHMgaWYgbmVlZGVkXHJcbiAgICBob29rLmxpc3Rlbignd29ybGQuY29tbWFuZCcsIGZ1bmN0aW9uKG5hbWUsIGNvbW1hbmQsIHRhcmdldCkge1xyXG4gICAgICAgIHRhcmdldCA9IHRhcmdldC50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIGlmICghYm90LmNoZWNrR3JvdXAoJ2FkbWluJywgbmFtZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGxpc3RzID0gd29ybGQubGlzdHM7XHJcbiAgICAgICAgaWYgKFsnYWRtaW4nLCAndW5hZG1pbicsICdtb2QnLCAndW5tb2QnXS5pbmNsdWRlcyhjb21tYW5kKSkge1xyXG4gICAgICAgICAgICBpZiAoY29tbWFuZC5zdGFydHNXaXRoKCd1bicpKSB7XHJcbiAgICAgICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHIoMik7XHJcbiAgICAgICAgICAgICAgICBpZiAobGlzdHNbY29tbWFuZF0uaW5jbHVkZXModGFyZ2V0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RzW2NvbW1hbmRdLnNwbGljZShsaXN0c1tjb21tYW5kXS5pbmRleE9mKHRhcmdldCksIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFsaXN0c1tjb21tYW5kXS5pbmNsdWRlcyh0YXJnZXQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdHNbY29tbWFuZF0ucHVzaCh0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL1JlYnVpbGQgdGhlIHN0YWZmIGxpc3RzXHJcbiAgICAgICAgICAgIGxpc3RzLm1vZCA9IGxpc3RzLm1vZC5maWx0ZXIoKG5hbWUpID0+IGxpc3RzLmFkbWluLmluZGV4T2YobmFtZSkgPCAwKTtcclxuICAgICAgICAgICAgbGlzdHMuc3RhZmYgPSBsaXN0cy5hZG1pbi5jb25jYXQobGlzdHMubW9kKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChbJ3doaXRlbGlzdCcsICd1bndoaXRlbGlzdCddLmluY2x1ZGVzKGNvbW1hbmQpKSB7XHJcbiAgICAgICAgICAgIGlmIChjb21tYW5kLnN0YXJ0c1dpdGgoJ3VuJykpIHtcclxuICAgICAgICAgICAgICAgIGlmIChsaXN0cy53aGl0ZS5pbmNsdWRlcyh0YXJnZXQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdHMud2hpdGUuc3BsaWNlKGxpc3RzLndoaXRlLmluZGV4T2YodGFyZ2V0KSwgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWxpc3RzLndoaXRlLmluY2x1ZGVzKHRhcmdldCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBsaXN0cy53aGl0ZS5wdXNoKHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChbJ2JhbicsICd1bmJhbiddLmluY2x1ZGVzKGNvbW1hbmQpKSB7XHJcbiAgICAgICAgICAgIC8vRklYTUU6IFN1cHBvcnQgbmVlZGVkIGZvciBkZXZpY2UgSURzLlxyXG4gICAgICAgICAgICBpZiAoY29tbWFuZC5zdGFydHNXaXRoKCd1bicpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobGlzdHMuYmxhY2suaW5jbHVkZXModGFyZ2V0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RzLmJsYWNrLnNwbGljZShsaXN0cy5ibGFjay5pbmRleE9mKHRhcmdldCksIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFsaXN0cy5ibGFjay5pbmNsdWRlcyh0YXJnZXQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdHMuYmxhY2sucHVzaCh0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy9IYW5kbGUgY2hhbmdlZCBtZXNzYWdlc1xyXG4gICAgaG9vay5saXN0ZW4oJ3VpLm1lc3NhZ2VDaGFuZ2VkJywgc2F2ZUNvbmZpZyk7XHJcbiAgICBob29rLmxpc3RlbigndWkubWVzc2FnZURlbGV0ZWQnLCBzYXZlQ29uZmlnKTtcclxuICAgIGZ1bmN0aW9uIHNhdmVDb25maWcoKSB7XHJcbiAgICAgICAgZnVuY3Rpb24gc2F2ZUZyb21XcmFwcGVyKGlkLCB0bywga2V5KSB7XHJcbiAgICAgICAgICAgIHRvLmxlbmd0aCA9IDA7XHJcblxyXG4gICAgICAgICAgICB2YXIgd3JhcHBlcnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkuY2hpbGRyZW47XHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RzLFxyXG4gICAgICAgICAgICAgICAgam9pbkNvdW50cyxcclxuICAgICAgICAgICAgICAgIHRtcE1zZ09iaiA9IHt9O1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdyYXBwZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0bXBNc2dPYmoubWVzc2FnZSA9IHdyYXBwZXJzW2ldLnF1ZXJ5U2VsZWN0b3IoJy5tJykudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoaWQgIT0gJ2FNc2dzJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdHMgPSB3cmFwcGVyc1tpXS5xdWVyeVNlbGVjdG9yQWxsKCdzZWxlY3QnKTtcclxuICAgICAgICAgICAgICAgICAgICBqb2luQ291bnRzID0gd3JhcHBlcnNbaV0ucXVlcnlTZWxlY3RvckFsbCgnaW5wdXRbdHlwZT1cIm51bWJlclwiXScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRtcE1zZ09iai5ncm91cCA9IHNlbGVjdHNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdG1wTXNnT2JqLm5vdF9ncm91cCA9IHNlbGVjdHNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdG1wTXNnT2JqLmpvaW5zX2xvdyA9IGpvaW5Db3VudHNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdG1wTXNnT2JqLmpvaW5zX2hpZ2ggPSBqb2luQ291bnRzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGlkID09ICd0TXNncycpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYm90LnByZWZlcmVuY2VzLmRpc2FibGVUcmltKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRtcE1zZ09iai50cmlnZ2VyID0gd3JhcHBlcnNbaV0ucXVlcnlTZWxlY3RvcignLnQnKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0bXBNc2dPYmoudHJpZ2dlciA9IHdyYXBwZXJzW2ldLnF1ZXJ5U2VsZWN0b3IoJy50JykudmFsdWUudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRvLnB1c2godG1wTXNnT2JqKTtcclxuICAgICAgICAgICAgICAgIHRtcE1zZ09iaiA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzdG9yYWdlLnNldChrZXksIHRvKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNhdmVGcm9tV3JhcHBlcignbE1zZ3MnLCBtZXNzYWdlcy5sZWF2ZSwgJ2xlYXZlQXJyJyk7XHJcbiAgICAgICAgc2F2ZUZyb21XcmFwcGVyKCdqTXNncycsIG1lc3NhZ2VzLmpvaW4sICdqb2luQXJyJyk7XHJcbiAgICAgICAgc2F2ZUZyb21XcmFwcGVyKCd0TXNncycsIG1lc3NhZ2VzLnRyaWdnZXIsICd0cmlnZ2VyQXJyJyk7XHJcbiAgICAgICAgc2F2ZUZyb21XcmFwcGVyKCdhTXNncycsIG1lc3NhZ2VzLmFubm91bmNlbWVudCwgJ2Fubm91bmNlbWVudEFycicpO1xyXG5cclxuICAgICAgICBzdG9yYWdlLnNldCgnbWJfdmVyc2lvbicsIGJvdC52ZXJzaW9uLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9IYW5kbGUgdXNlciBtZXNzYWdlc1xyXG4gICAgZnVuY3Rpb24gdXNlclNlbmQobWVzc2FnZSkge1xyXG4gICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIGlucHV0Jyk7XHJcbiAgICAgICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIGJ1dHRvbicpO1xyXG4gICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICdTRU5EJztcclxuICAgICAgICBbaW5wdXQsIGJ1dHRvbl0uZm9yRWFjaCgoZWwpID0+IGVsLmRpc2FibGVkID0gdHJ1ZSk7XHJcblxyXG4gICAgICAgIG1lc3NhZ2UgPSBob29rLnVwZGF0ZSgnYm90LnNlbmQnLCBtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgLy8gRG9uJ3QgYWRkIHVzZXIgbWVzc2FnZXMgdG8gdGhlIGJ1ZmZlci5cclxuICAgICAgICBhcGkuc2VuZChtZXNzYWdlKVxyXG4gICAgICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlID0gJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnUkVUUlknO1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihKU09OLnN0cmluZ2lmeShyZXNwb25zZSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuY2F0Y2goKCkgPT4geyAvKiBOb3RoaW5nICovIH0pXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIFtpbnB1dCwgYnV0dG9uXS5mb3JFYWNoKChlbCkgPT4gZWwuZGlzYWJsZWQgPSBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2NvbnNvbGUudmlzaWJsZScpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQuZm9jdXMoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9MaXN0ZW4gZm9yIHVzZXIgdG8gc2VuZCBtZXNzYWdlXHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSBpbnB1dCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC5rZXkgPT0gXCJFbnRlclwiIHx8IGV2ZW50LmtleUNvZGUgPT0gMTMpIHtcclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgdXNlclNlbmQoZXZlbnQudGFyZ2V0LnZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIGJ1dHRvbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdXNlclNlbmQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2NvbnNvbGUgaW5wdXQnKS52YWx1ZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBob29rLmxpc3RlbigndWkucHJlZkNoYW5nZWQnLCBmdW5jdGlvbiBzYXZlUHJlZnMoKSB7XHJcbiAgICAgICAgdmFyIGdldFZhbHVlID0gKHNlbGVjdG9yKSA9PiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKS52YWx1ZTtcclxuICAgICAgICB2YXIgZ2V0Q2hlY2tlZCA9IChzZWxlY3RvcikgPT4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcikuY2hlY2tlZDtcclxuXHJcbiAgICAgICAgdmFyIHByZWZzID0gYm90LnByZWZlcmVuY2VzO1xyXG4gICAgICAgIHByZWZzLmFubm91bmNlbWVudERlbGF5ID0gK2dldFZhbHVlKCcjbWJfYW5uX2RlbGF5Jyk7XHJcbiAgICAgICAgcHJlZnMubWF4UmVzcG9uc2VzID0gK2dldFZhbHVlKCcjbWJfcmVzcF9tYXgnKTtcclxuICAgICAgICBwcmVmcy5yZWdleFRyaWdnZXJzID0gZ2V0Q2hlY2tlZCgnI21iX3JlZ2V4X3RyaWdnZXJzJyk7XHJcbiAgICAgICAgcHJlZnMuZGlzYWJsZVRyaW0gPSBnZXRDaGVja2VkKCcjbWJfZGlzYWJsZV90cmltJyk7XHJcbiAgICAgICAgcHJlZnMubm90aWZ5ID0gZ2V0Q2hlY2tlZCgnI21iX25vdGlmeV9tZXNzYWdlJyk7XHJcblxyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KCdtYl9wcmVmZXJlbmNlcycsIHByZWZzLCBmYWxzZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvL0hhbmRsZSB1c2VyIGRlZmluZWQgbWVzc2FnZXMuXHJcbiAgICAoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHNlbmRPSyA9IGZhbHNlO1xyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gd2FpdEZvck1lc3NhZ2VzKCkge1xyXG4gICAgICAgICAgICAvL1dhaXQgZm9yIGEgd2hpbGUgYmVmb3JlIHJlc3BvbmRpbmcgdG8gdHJpZ2dlcnMsIGF2b2lkcyBtYXNzaXZlIGJvdCBzcGFtc1xyXG4gICAgICAgICAgICBzZW5kT0sgPSB0cnVlO1xyXG4gICAgICAgIH0sIDEwMDAwKTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gY2hlY2tKb2luc0FuZEdyb3VwKG1lc3NhZ2UsIG5hbWUpIHtcclxuICAgICAgICAgICAgaWYgKCFzZW5kT0spIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCF3b3JsZC5wbGF5ZXJzLmhhc093blByb3BlcnR5KG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gd29ybGQucGxheWVyc1tuYW1lXS5qb2lucztcclxuXHJcbiAgICAgICAgICAgIHZhciBqb2luc09LID0gbWVzc2FnZS5qb2luc19sb3cgPD0gY3VycmVudCAmJiBtZXNzYWdlLmpvaW5zX2hpZ2ggPj0gY3VycmVudDtcclxuICAgICAgICAgICAgdmFyIGdyb3VwT0sgPSBib3QuY2hlY2tHcm91cChtZXNzYWdlLmdyb3VwLCBuYW1lKSAmJiAhYm90LmNoZWNrR3JvdXAobWVzc2FnZS5ub3RfZ3JvdXAsIG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGpvaW5zT0sgJiYgZ3JvdXBPSztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGJ1aWxkTWVzc2FnZShtZXNzYWdlLCBuYW1lKSB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7TkFNRX19L2csIG5hbWUpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgve3tOYW1lfX0vZywgbmFtZVswXSArIG5hbWUuc3Vic3RyaW5nKDEpLnRvTG9jYWxlTG93ZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgve3tuYW1lfX0vZywgbmFtZS50b0xvY2FsZUxvd2VyQ2FzZSgpKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSkge1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgve3tpcH19L2dpLCB3b3JsZC5wbGF5ZXJzW25hbWVdLmlwKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBob29rLmxpc3Rlbignd29ybGQuam9pbicsIGZ1bmN0aW9uIG9uSm9pbihuYW1lKSB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2VzLmpvaW4uZm9yRWFjaCgobXNnKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2hlY2tKb2luc0FuZEdyb3VwKG1zZywgbmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBib3Quc2VuZChidWlsZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGhvb2subGlzdGVuKCd3b3JsZC5sZWF2ZScsIGZ1bmN0aW9uIG9uTGVhdmUobmFtZSkge1xyXG4gICAgICAgICAgICBtZXNzYWdlcy5sZWF2ZS5mb3JFYWNoKChtc2cpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChjaGVja0pvaW5zQW5kR3JvdXAobXNnLCBuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJvdC5zZW5kKGJ1aWxkTWVzc2FnZShtc2cubWVzc2FnZSwgbmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaG9vay5saXN0ZW4oJ3dvcmxkLm1lc3NhZ2UnLCBmdW5jdGlvbiBvblRyaWdnZXIobmFtZSwgbWVzc2FnZSkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiB0cmlnZ2VyTWF0Y2godHJpZ2dlciwgbWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGJvdC5wcmVmZXJlbmNlcy5yZWdleFRyaWdnZXJzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAodHJpZ2dlciwgJ2knKS50ZXN0KG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdWkubm90aWZ5KGBTa2lwcGluZyB0cmlnZ2VyICcke3RyaWdnZXJ9JyBhcyB0aGUgUmVnRXggaXMgaW52YWlsZC5gKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKFxyXG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhbLis/Xj0hOiR7fSgpfFxcW1xcXVxcL1xcXFxdKS9nLCBcIlxcXFwkMVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwqL2csIFwiLipcIiksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdpJ1xyXG4gICAgICAgICAgICAgICAgICAgICkudGVzdChtZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHRvdGFsQWxsb3dlZCA9IGJvdC5wcmVmZXJlbmNlcy5tYXhSZXNwb25zZXM7XHJcbiAgICAgICAgICAgIG1lc3NhZ2VzLnRyaWdnZXIuZm9yRWFjaCgobXNnKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2hlY2tKb2luc0FuZEdyb3VwKG1zZywgbmFtZSkgJiYgdHJpZ2dlck1hdGNoKG1zZy50cmlnZ2VyLCBtZXNzYWdlKSAmJiB0b3RhbEFsbG93ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBib3Quc2VuZChidWlsZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpKTtcclxuICAgICAgICAgICAgICAgICAgICB0b3RhbEFsbG93ZWQtLTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGhvb2subGlzdGVuKCdib3QudXNlcnNlbmQnLCBmdW5jdGlvbiBoYW5kbGVXaGl0ZXNwYWNlKG1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG1lc3NhZ2UucmVwbGFjZSgvXFxcXG4vZywgJ1xcbicpLnJlcGxhY2UoL1xcXFx0L2csICdcXHQnKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaG9vay5saXN0ZW4oJ3dvcmxkLm1lc3NhZ2UnLCBmdW5jdGlvbiBjaGF0Tm90aWZpY2F0aW9ucyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIGlmIChib3QucHJlZmVyZW5jZXMubm90aWZ5ICYmIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlLnZpc2libGUnKSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgYm90LnVpLm5vdGlmeShgJHtuYW1lfTogJHttZXNzYWdlfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KCkpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRnVuY3Rpb24gdXNlZCB0byBjaGVjayBpZiB1c2VycyBhcmUgaW4gZGVmaW5lZCBncm91cHMuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHN0cmluZyBncm91cCB0aGUgZ3JvdXAgdG8gY2hlY2tcclxuICAgICAqIEBwYXJhbSBzdHJpbmcgbmFtZSB0aGUgbmFtZSBvZiB0aGUgdXNlciB0byBjaGVja1xyXG4gICAgICogQHJldHVybiBib29sZWFuXHJcbiAgICAgKi9cclxuICAgIGJvdC5jaGVja0dyb3VwID0gZnVuY3Rpb24gY2hlY2tHcm91cChncm91cCwgbmFtZSkge1xyXG4gICAgICAgIG5hbWUgPSBuYW1lLnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICAgICAgc3dpdGNoIChncm91cC50b0xvY2FsZUxvd2VyQ2FzZSgpKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgY2FzZSAnYWRtaW4nOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmxpc3RzLmFkbWluLmluY2x1ZGVzKG5hbWUpO1xyXG4gICAgICAgICAgICBjYXNlICdtb2QnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmxpc3RzLm1vZC5pbmNsdWRlcyhuYW1lKTtcclxuICAgICAgICAgICAgY2FzZSAnc3RhZmYnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmxpc3RzLnN0YWZmLmluY2x1ZGVzKG5hbWUpO1xyXG4gICAgICAgICAgICBjYXNlICdvd25lcic6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gd29ybGQub3duZXIgPT0gbmFtZTtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBib3Q7XHJcbn1cclxuIiwidmFyIGJvdCA9IHJlcXVpcmUoJy4vTWVzc2FnZUJvdCcpO1xyXG52YXIgdWkgPSByZXF1aXJlKCcuL3VpJyk7XHJcbnZhciBzdG9yYWdlID0gcmVxdWlyZSgnLi9saWJzL3N0b3JhZ2UnKTtcclxudmFyIGFqYXggPSByZXF1aXJlKCcuL2xpYnMvYWpheCcpO1xyXG52YXIgYXBpID0gcmVxdWlyZSgnLi9saWJzL2Jsb2NraGVhZHMnKTtcclxudmFyIGhvb2sgPSByZXF1aXJlKCcuL2xpYnMvaG9vaycpO1xyXG5cclxuY29uc3QgU1RPUkFHRV9JRCA9ICdtYl9leHRlbnNpb25zJztcclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGNyZWF0ZSBhIG5ldyBleHRlbnNpb24uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB0ZXN0ID0gTWVzc2FnZUJvdEV4dGVuc2lvbigndGVzdCcpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZXNwYWNlIC0gU2hvdWxkIGJlIHRoZSBzYW1lIGFzIHlvdXIgdmFyaWFibGUgbmFtZS5cclxuICogQHJldHVybiB7TWVzc2FnZUJvdEV4dGVuc2lvbn0gLSBUaGUgZXh0ZW5zaW9uIHZhcmlhYmxlLlxyXG4gKi9cclxuZnVuY3Rpb24gTWVzc2FnZUJvdEV4dGVuc2lvbihuYW1lc3BhY2UpIHtcclxuICAgIGhvb2suZmlyZSgnZXh0ZW5zaW9uLmluc3RhbGxlZCcsIG5hbWVzcGFjZSk7XHJcblxyXG4gICAgdmFyIGV4dGVuc2lvbiA9IHtcclxuICAgICAgICBpZDogbmFtZXNwYWNlLFxyXG4gICAgICAgIGJvdCxcclxuICAgICAgICB1aSxcclxuICAgICAgICBzdG9yYWdlLFxyXG4gICAgICAgIGFqYXgsXHJcbiAgICAgICAgYXBpLFxyXG4gICAgICAgIGhvb2ssXHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXNlZCB0byBjaGFuZ2Ugd2hldGhlciBvciBub3QgdGhlIGV4dGVuc2lvbiB3aWxsIGJlXHJcbiAgICAgKiBBdXRvbWF0aWNhbGx5IGxvYWRlZCB0aGUgbmV4dCB0aW1lIHRoZSBib3QgaXMgbGF1bmNoZWQuXHJcbiAgICAgKlxyXG4gICAgICogQGV4YW1wbGVcclxuICAgICAqIHZhciB0ZXN0ID0gTWVzc2FnZUJvdEV4dGVuc2lvbigndGVzdCcpO1xyXG4gICAgICogdGVzdC5zZXRBdXRvTGF1bmNoKHRydWUpO1xyXG4gICAgICogQHBhcmFtIHtib29sfSBzaG91bGRBdXRvbG9hZFxyXG4gICAgICovXHJcbiAgICBleHRlbnNpb24uc2V0QXV0b0xhdW5jaCA9IGZ1bmN0aW9uIHNldEF1dG9MYXVuY2goc2hvdWxkQXV0b2xvYWQpIHtcclxuICAgICAgICBpZiAoIWF1dG9sb2FkLmluY2x1ZGVzKG5hbWVzcGFjZSkgJiYgc2hvdWxkQXV0b2xvYWQpIHtcclxuICAgICAgICAgICAgYXV0b2xvYWQucHVzaChuYW1lc3BhY2UpO1xyXG4gICAgICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBhdXRvbG9hZCwgZmFsc2UpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIXNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgICAgIGlmIChhdXRvbG9hZC5pbmNsdWRlcyhuYW1lc3BhY2UpKSB7XHJcbiAgICAgICAgICAgICAgICBhdXRvbG9hZC5zcGxpY2UoYXV0b2xvYWQuaW5kZXhPZihuYW1lc3BhY2UpLCAxKTtcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGF1dG9sb2FkLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBleHRlbnNpb247XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUcmllcyB0byBsb2FkIHRoZSByZXF1ZXN0ZWQgZXh0ZW5zaW9uIGJ5IElELlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gaWRcclxuICovXHJcbk1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbCA9IGZ1bmN0aW9uIGluc3RhbGwoaWQpIHtcclxuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gICAgZWwuc3JjID0gYC8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvZXh0ZW5zaW9uLyR7aWR9L2NvZGUvcmF3YDtcclxuICAgIGVsLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XHJcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBVbmluc3RhbGxzIGFuIGV4dGVuc2lvbi5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAqL1xyXG5NZXNzYWdlQm90RXh0ZW5zaW9uLnVuaW5zdGFsbCA9IGZ1bmN0aW9uIHVuaW5zdGFsbChpZCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aW5kb3dbaWRdLnVuaW5zdGFsbCgpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIC8vTm90IGluc3RhbGxlZCwgb3Igbm8gdW5pbnN0YWxsIGZ1bmN0aW9uLlxyXG4gICAgfVxyXG5cclxuICAgIHdpbmRvd1tpZF0gPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgaWYgKGF1dG9sb2FkLmluY2x1ZGVzKGlkKSkge1xyXG4gICAgICAgIGF1dG9sb2FkLnNwbGljZShhdXRvbG9hZC5pbmRleE9mKGlkKSwgMSk7XHJcbiAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgYXV0b2xvYWQsIGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICBob29rLmZpcmUoJ2V4dGVuc2lvbi51bmluc3RhbGwnLCBpZCk7XHJcbn07XHJcblxyXG4vLyBMb2FkIGV4dGVuc2lvbnMgdGhhdCBzZXQgdGhlbXNlbHZlcyB0byBhdXRvbG9hZCBsYXN0IGxhdW5jaC5cclxuc3RvcmFnZS5nZXRPYmplY3QoU1RPUkFHRV9JRCwgW10sIGZhbHNlKS5mb3JFYWNoKE1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbCk7XHJcblxyXG4vLyBBcnJheSBvZiBJRHMgdG8gYXV0b2xhb2QgYXQgdGhlIG5leHQgbGF1bmNoLlxyXG52YXIgYXV0b2xvYWQgPSBbXTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWVzc2FnZUJvdEV4dGVuc2lvbjtcclxuIiwiLy9UT0RPOiBVc2UgZmV0Y2hcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBHRVQgYSBwYWdlLiBQYXNzZXMgdGhlIHJlc3BvbnNlIG9mIHRoZSBYSFIgaW4gdGhlIHJlc29sdmUgcHJvbWlzZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogLy9zZW5kcyBhIEdFVCByZXF1ZXN0IHRvIC9zb21lL3VybC5waHA/YT10ZXN0XHJcbiAqIGdldCgnL3NvbWUvdXJsLnBocCcsIHthOiAndGVzdCd9KS50aGVuKGNvbnNvbGUubG9nKVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXNTdHJcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldCh1cmwgPSAnLycsIHBhcmFtcyA9IHt9KSB7XHJcbiAgICBpZiAoT2JqZWN0LmtleXMocGFyYW1zKS5sZW5ndGgpIHtcclxuICAgICAgICB2YXIgYWRkaXRpb24gPSB1cmxTdHJpbmdpZnkocGFyYW1zKTtcclxuICAgICAgICBpZiAodXJsLmluY2x1ZGVzKCc/JykpIHtcclxuICAgICAgICAgICAgdXJsICs9IGAmJHthZGRpdGlvbn1gO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHVybCArPSBgPyR7YWRkaXRpb259YDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHhocignR0VUJywgdXJsLCB7fSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmV0dXJucyBhIEpTT04gb2JqZWN0IGluIHRoZSBwcm9taXNlIHJlc29sdmUgbWV0aG9kLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbU9ialxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0SlNPTih1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiBnZXQodXJsLCBwYXJhbU9iaikudGhlbihKU09OLnBhcnNlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBtYWtlIGEgcG9zdCByZXF1ZXN0XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmFtT2JqXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBwb3N0KHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIHhocignUE9TVCcsIHVybCwgcGFyYW1PYmopO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRvIGZldGNoIEpTT04gZnJvbSBhIHBhZ2UgdGhyb3VnaCBwb3N0LlxyXG4gKlxyXG4gKiBAcGFyYW0gc3RyaW5nIHVybFxyXG4gKiBAcGFyYW0gc3RyaW5nIHBhcmFtT2JqXHJcbiAqIEByZXR1cm4gUHJvbWlzZVxyXG4gKi9cclxuZnVuY3Rpb24gcG9zdEpTT04odXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4gcG9zdCh1cmwsIHBhcmFtT2JqKS50aGVuKEpTT04ucGFyc2UpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiogSGVscGVyIGZ1bmN0aW9uIHRvIG1ha2UgWEhSIHJlcXVlc3RzLCBpZiBwb3NzaWJsZSB1c2UgdGhlIGdldCBhbmQgcG9zdCBmdW5jdGlvbnMgaW5zdGVhZC5cclxuKlxyXG4qIEBkZXByaWNhdGVkIHNpbmNlIHZlcnNpb24gNi4xXHJcbiogQHBhcmFtIHN0cmluZyBwcm90b2NvbFxyXG4qIEBwYXJhbSBzdHJpbmcgdXJsXHJcbiogQHBhcmFtIG9iamVjdCBwYXJhbU9iaiAtLSBXQVJOSU5HLiBPbmx5IGFjY2VwdHMgc2hhbGxvdyBvYmplY3RzLlxyXG4qIEByZXR1cm4gUHJvbWlzZVxyXG4qL1xyXG5mdW5jdGlvbiB4aHIocHJvdG9jb2wsIHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgdmFyIHBhcmFtU3RyID0gdXJsU3RyaW5naWZ5KHBhcmFtT2JqKTtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICB2YXIgcmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgcmVxLm9wZW4ocHJvdG9jb2wsIHVybCk7XHJcbiAgICAgICAgcmVxLnNldFJlcXVlc3RIZWFkZXIoJ1gtUmVxdWVzdGVkLVdpdGgnLCAnWE1MSHR0cFJlcXVlc3QnKTtcclxuICAgICAgICBpZiAocHJvdG9jb2wgPT0gJ1BPU1QnKSB7XHJcbiAgICAgICAgICAgIHJlcS5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXEub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09IDIwMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXEuc3RhdHVzVGV4dCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICAvLyBIYW5kbGUgbmV0d29yayBlcnJvcnNcclxuICAgICAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZWplY3QoRXJyb3IoXCJOZXR3b3JrIEVycm9yXCIpKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChwYXJhbVN0cikge1xyXG4gICAgICAgICAgICByZXEuc2VuZChwYXJhbVN0cik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVxLnNlbmQoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIHN0cmluZ2lmeSB1cmwgcGFyYW1ldGVyc1xyXG4gKi9cclxuZnVuY3Rpb24gdXJsU3RyaW5naWZ5KG9iaikge1xyXG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iailcclxuICAgIC5tYXAoayA9PiBgJHtlbmNvZGVVUklDb21wb25lbnQoayl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KG9ialtrXSl9YClcclxuICAgIC5qb2luKCcmJyk7XHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHt4aHIsIGdldCwgZ2V0SlNPTiwgcG9zdCwgcG9zdEpTT059O1xyXG4iLCIvKipcclxuICogQGZpbGUgQ29udGFpbnMgZnVuY3Rpb25zIHRvIGludGVyYWN0IHdpdGggYmxvY2toZWFkc2ZhbnMuY29tIC0gY2Fubm90IGJlIHVzZWQgYnkgZXh0ZW5zaW9ucy5cclxuICovXHJcblxyXG52YXIgdWkgPSByZXF1aXJlKCcuLi91aScpO1xyXG52YXIgYWpheCA9IHJlcXVpcmUoJy4vYWpheCcpO1xyXG5cclxuY29uc3QgQVBJX1VSTFMgPSB7XHJcbiAgICBTVE9SRTogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvZXh0ZW5zaW9uL3N0b3JlJyxcclxuICAgIE5BTUU6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2V4dGVuc2lvbi9uYW1lJyxcclxuICAgIEVSUk9SOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9ib3QvZXJyb3InLFxyXG59O1xyXG5cclxudmFyIGNhY2hlID0ge1xyXG4gICAgbmFtZXM6IG5ldyBNYXAoKSxcclxufTtcclxuXHJcbi8vQnVpbGQgdGhlIGluaXRpYWwgbmFtZXMgbWFwXHJcbmdldFN0b3JlKCkudGhlbihzdG9yZSA9PiB7XHJcbiAgICBpZiAoc3RvcmUuc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChsZXQgZXggb2Ygc3RvcmUuZXh0ZW5zaW9ucykge1xyXG4gICAgICAgIGNhY2hlLm5hbWVzLnNldChleC5pZCwgZXgudGl0bGUpO1xyXG4gICAgfVxyXG59KS5jYXRjaChyZXBvcnRFcnJvcik7XHJcblxyXG5cclxuLyoqXHJcbiAqIFVzZWQgdG8gZ2V0IHB1YmxpYyBleHRlbnNpb25zXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldFN0b3JlKCkudGhlbihzdG9yZSA9PiBjb25zb2xlLmxvZyhzdG9yZSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byB1c2UgdGhlIGNhY2hlZCByZXNwb25zZSBzaG91bGQgYmUgY2xlYXJlZC5cclxuICogQHJldHVybiB7UHJvbWlzZX0gcmVzb2x2ZXMgd2l0aCB0aGUgcmVzcG9uc2VcclxuICovXHJcbmZ1bmN0aW9uIGdldFN0b3JlKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldFN0b3JlKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0U3RvcmUgPSBhamF4LmdldEpTT04oQVBJX1VSTFMuU1RPUkUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRTdG9yZTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBHZXRzIHRoZSBuYW1lIG9mIHRoZSBwcm92aWRlZCBleHRlbnNpb24gSUQuXHJcbiAqIElmIHRoZSBleHRlbnNpb24gd2FzIG5vdCBmb3VuZCwgcmVzb2x2ZXMgd2l0aCB0aGUgb3JpZ2luYWwgcGFzc2VkIElELlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRFeHRlbnNpb25OYW1lKCd0ZXN0JykudGhlbihuYW1lID0+IGNvbnNvbGUubG9nKG5hbWUpKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkIHRoZSBpZCB0byBzZWFyY2ggZm9yLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfSByZXNvbHZlcyB3aXRoIHRoZSBleHRlbnNpb24gbmFtZS5cclxuICovXHJcbmZ1bmN0aW9uIGdldEV4dGVuc2lvbk5hbWUoaWQpIHtcclxuICAgIGlmIChjYWNoZS5uYW1lcy5oYXMoaWQpKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjYWNoZS5uYW1lcy5nZXQoaWQpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWpheC5wb3N0SlNPTihBUElfVVJMUy5OQU1FLCB7aWR9KS50aGVuKG5hbWUgPT4ge1xyXG4gICAgICAgIGNhY2hlLm5hbWVzLnNldChpZCwgbmFtZSk7XHJcbiAgICAgICAgcmV0dXJuIG5hbWU7XHJcbiAgICB9LCBlcnIgPT4ge1xyXG4gICAgICAgIHJlcG9ydEVycm9yKGVycik7XHJcbiAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVwb3J0cyBhbiBlcnJvciBzbyB0aGF0IGl0IGNhbiBiZSByZXZpZXdlZCBhbmQgZml4ZWQgYnkgZXh0ZW5zaW9uIG9yIGJvdCBkZXZlbG9wZXJzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiByZXBvcnRFcnJvcihFcnJvcihcIlJlcG9ydCBtZVwiKSk7XHJcbiAqIEBwYXJhbSB7RXJyb3J9IGVyciB0aGUgZXJyb3IgdG8gcmVwb3J0XHJcbiAqL1xyXG5mdW5jdGlvbiByZXBvcnRFcnJvcihlcnIpIHtcclxuICAgIGFqYXgucG9zdEpTT04oQVBJX1VSTFMuRVJST1IsIHtcclxuICAgICAgICAgICAgZXJyb3JfdGV4dDogZXJyLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgIGVycm9yX2ZpbGU6IGVyci5maWxlbmFtZSxcclxuICAgICAgICAgICAgZXJyb3Jfcm93OiBlcnIubGluZW5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX2NvbHVtbjogZXJyLmNvbG5vIHx8IDAsXHJcbiAgICAgICAgICAgIGVycm9yX3N0YWNrOiBlcnIuc3RhY2sgfHwgJycsXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigocmVzcCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgdWkubm90aWZ5KCdTb21ldGhpbmcgd2VudCB3cm9uZywgaXQgaGFzIGJlZW4gcmVwb3J0ZWQuJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB1aS5ub3RpZnkoYEVycm9yIHJlcG9ydGluZyBleGNlcHRpb246ICR7cmVzcC5tZXNzYWdlfWApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcik7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZ2V0U3RvcmUsXHJcbiAgICBnZXRFeHRlbnNpb25OYW1lLFxyXG4gICAgcmVwb3J0RXJyb3IsXHJcbn07XHJcbiIsInZhciBhamF4ID0gcmVxdWlyZSgnLi9hamF4Jyk7XHJcbnZhciBob29rID0gcmVxdWlyZSgnLi9ob29rJyk7XHJcbnZhciBiaGZhbnNhcGkgPSByZXF1aXJlKCcuL2JoZmFuc2FwaScpO1xyXG5cclxuY29uc3Qgd29ybGRJZCA9IHdpbmRvdy53b3JsZElkO1xyXG5jaGVja0NoYXQoKTtcclxuXHJcbi8vIFVzZWQgdG8gcGFyc2UgbWVzc2FnZXMgbW9yZSBhY2N1cmF0ZWx5XHJcbnZhciB3b3JsZCA9IHtcclxuICAgIG5hbWU6ICcnLFxyXG4gICAgb25saW5lOiBbXVxyXG59O1xyXG5nZXRPbmxpbmVQbGF5ZXJzKClcclxuICAgIC50aGVuKHBsYXllcnMgPT4gd29ybGQucGxheWVycyA9IFsuLi5uZXcgU2V0KHBsYXllcnMuY29uY2F0KHdvcmxkLnBsYXllcnMpKV0pO1xyXG5cclxuZ2V0V29ybGROYW1lKClcclxuICAgIC50aGVuKG5hbWUgPT4gd29ybGQubmFtZSA9IG5hbWUpO1xyXG5cclxuXHJcbnZhciBjYWNoZSA9IHtcclxuICAgIGZpcnN0SWQ6IDAsXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHdvcmxkU3RhcnRlZCxcclxuICAgIGdldExvZ3MsXHJcbiAgICBnZXRMaXN0cyxcclxuICAgIGdldEhvbWVwYWdlLFxyXG4gICAgZ2V0T25saW5lUGxheWVycyxcclxuICAgIGdldE93bmVyTmFtZSxcclxuICAgIGdldFdvcmxkTmFtZSxcclxuICAgIHNlbmQsXHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIHRoZSB3b3JsZCBpZiBuZWNjZXNzYXJ5LCByZWplY3RzIGlmIHRoZSB3b3JsZCB0YWtlcyB0b28gbG9uZyB0byBzdGFydCBvciBpcyB1bmF2YWlsaWJsZVxyXG4gKiBSZWZhY3RvcmluZyB3ZWxjb21lLiBUaGlzIHNlZW1zIG92ZXJseSBweXJhbWlkIGxpa2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHdvcmxkU3RhcnRlZCgpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ3N0YXJ0ZWQhJykpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWNoZWNrIGlmIHRoZSB3b3JsZCBpcyBzdGFydGVkLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gd29ybGRTdGFydGVkKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLndvcmxkU3RhcnRlZCkge1xyXG4gICAgICAgIGNhY2hlLndvcmxkU3RhcnRlZCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgdmFyIGZhaWxzID0gMDtcclxuICAgICAgICAgICAgKGZ1bmN0aW9uIGNoZWNrKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ291bGQgdGhpcyBiZSBtb3JlIHNpbXBsaWZpZWQ/XHJcbiAgICAgICAgICAgICAgICAvL2pzaGludCBtYXhjb21wbGV4aXR5OiA3XHJcbiAgICAgICAgICAgICAgICBhamF4LnBvc3RKU09OKCcvYXBpJywgeyBjb21tYW5kOiAnc3RhdHVzJywgd29ybGRJZCB9KS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHJlc3BvbnNlLndvcmxkU3RhcnRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdvbmxpbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnb2ZmbGluZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhamF4LnBvc3RKU09OKCcvYXBpJywgeyBjb21tYW5kOiAnc3RhcnQnLCB3b3JsZElkIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oY2hlY2ssIGNoZWNrKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd1bmF2YWlsaWJsZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KCdXb3JsZCB1bmF2YWlsaWJsZS4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc3RhcnR1cCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3NodXRkb3duJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoY2hlY2ssIDMwMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCsrZmFpbHMgPiAxMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoJ1dvcmxkIHRvb2sgdG9vIGxvbmcgdG8gc3RhcnQuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoJ1Vua25vd24gcmVzcG9uc2UuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKTtcclxuICAgICAgICAgICAgfSgpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUud29ybGRTdGFydGVkO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggYW4gYXJyYXkgb2YgdGhlIGxvZydzIGxpbmVzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMb2dzKCkudGhlbihsaW5lcyA9PiBjb25zb2xlLmxvZyhsaW5lc1swXSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWRvd25sb2FkIHRoZSBsb2dzXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMb2dzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldExvZ3MpIHtcclxuICAgICAgICBjYWNoZS5nZXRMb2dzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbG9ncy8ke3dvcmxkSWR9YCkpXHJcbiAgICAgICAgICAgIC50aGVuKGxvZyA9PiBsb2cuc3BsaXQoJ1xcbicpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0TG9ncztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIGEgbGlzdCBvZiBhZG1pbnMsIG1vZHMsIHN0YWZmIChhZG1pbnMgKyBtb2RzKSwgd2hpdGVsaXN0LCBhbmQgYmxhY2tsaXN0LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRMaXN0cygpLnRoZW4obGlzdHMgPT4gY29uc29sZS5sb2cobGlzdHMuYWRtaW4pKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmZXRjaCB0aGUgbGlzdHMuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRMaXN0cyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRMaXN0cykge1xyXG4gICAgICAgIGNhY2hlLmdldExpc3RzID0gd29ybGRTdGFydGVkKClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5nZXQoYC93b3JsZHMvbGlzdHMvJHt3b3JsZElkfWApKVxyXG4gICAgICAgICAgICAudGhlbihodG1sID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldExpc3QobmFtZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsaXN0ID0gZG9jLnF1ZXJ5U2VsZWN0b3IoYHRleHRhcmVhW25hbWU9JHtuYW1lfV1gKVxyXG4gICAgICAgICAgICAgICAgICAgIC52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIC50b0xvY2FsZVVwcGVyQ2FzZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNwbGl0KCdcXG4nKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWy4uLm5ldyBTZXQobGlzdCldOyAvL1JlbW92ZSBkdXBsaWNhdGVzXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGxpc3RzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFkbWluOiBnZXRMaXN0KCdhZG1pbnMnKSxcclxuICAgICAgICAgICAgICAgICAgICBtb2Q6IGdldExpc3QoJ21vZGxpc3QnKSxcclxuICAgICAgICAgICAgICAgICAgICB3aGl0ZTogZ2V0TGlzdCgnd2hpdGVsaXN0JyksXHJcbiAgICAgICAgICAgICAgICAgICAgYmxhY2s6IGdldExpc3QoJ2JsYWNrbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGxpc3RzLm1vZCA9IGxpc3RzLm1vZC5maWx0ZXIobmFtZSA9PiAhbGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgbGlzdHMuc3RhZmYgPSBsaXN0cy5hZG1pbi5jb25jYXQobGlzdHMubW9kKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbGlzdHM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS53b3JsZFN0YXJ0ZWQ7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgaG9tZXBhZ2Ugb2YgdGhlIHNlcnZlci5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0SG9tZXBhZ2UoKS50aGVuKGh0bWwgPT4gY29uc29sZS5sb2coaHRtbC5zdWJzdHJpbmcoMCwgMTAwKSkpO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWZldGNoIHRoZSBwYWdlLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0SG9tZXBhZ2UocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0SG9tZXBhZ2UpIHtcclxuICAgICAgICBjYWNoZS5nZXRIb21lcGFnZSA9IGFqYXguZ2V0KGAvd29ybGRzLyR7d29ybGRJZH1gKVxyXG4gICAgICAgICAgICAuY2F0Y2goKCkgPT4gZ2V0SG9tZXBhZ2UodHJ1ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRIb21lcGFnZTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIGFuIGFycmF5IG9mIHBsYXllciBuYW1lcy5cclxuICogQW4gb25saW5lIGxpc3QgaXMgbWFpbnRhaW5lZCBieSB0aGUgYm90LCB0aGlzIHNob3VsZCBnZW5lcmFsbHkgbm90IGJlIHVzZWQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldE9ubGluZVBsYXllcnMoKS50aGVuKG9ubGluZSA9PiB7IGZvciAobGV0IG4gb2Ygb25saW5lKSB7IGNvbnNvbGUubG9nKG4sICdpcyBvbmxpbmUhJyl9fSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZnJlc2ggdGhlIG9ubGluZSBuYW1lcy5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE9ubGluZVBsYXllcnMocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0T25saW5lUGxheWVycykge1xyXG4gICAgICAgIGNhY2hlLmdldE9ubGluZVBsYXllcnMgPSBnZXRIb21lcGFnZSh0cnVlKVxyXG4gICAgICAgICAgICAudGhlbigoaHRtbCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRvYyA9IChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZyhodG1sLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGxheWVyRWxlbXMgPSBkb2MucXVlcnlTZWxlY3RvcignLm1hbmFnZXIucGFkZGVkOm50aC1jaGlsZCgxKScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnF1ZXJ5U2VsZWN0b3JBbGwoJ3RyOm5vdCguaGlzdG9yeSkgPiB0ZC5sZWZ0Jyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGxheWVycyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIEFycmF5LmZyb20ocGxheWVyRWxlbXMpLmZvckVhY2goKGVsKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGxheWVycy5wdXNoKGVsLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBsYXllcnM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIHNlcnZlciBvd25lcidzIG5hbWUuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldE93bmVyTmFtZSgpLnRoZW4obmFtZSA9PiBjb25zb2xlLmxvZygnV29ybGQgaXMgb3duZWQgYnknLCBuYW1lKSk7XHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPd25lck5hbWUoKSB7XHJcbiAgICByZXR1cm4gZ2V0SG9tZXBhZ2UoKS50aGVuKGh0bWwgPT4ge1xyXG4gICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG4gICAgICAgIHJldHVybiBkb2MucXVlcnlTZWxlY3RvcignLnN1YmhlYWRlcn50cj50ZDpub3QoW2NsYXNzXSknKS50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSB3b3JsZCdzIG5hbWUuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldFdvcmxkTmFtZSgpLnRoZW4obmFtZSA9PiBjb25zb2xlLmxvZygnV29ybGQgbmFtZTonLCBuYW1lKSk7XHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRXb3JsZE5hbWUoKSB7XHJcbiAgICByZXR1cm4gZ2V0SG9tZXBhZ2UoKS50aGVuKGh0bWwgPT4ge1xyXG4gICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG4gICAgICAgIHJldHVybiBkb2MucXVlcnlTZWxlY3RvcignI3RpdGxlJykudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogU2VuZHMgYSBtZXNzYWdlLCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIG1lc3NhZ2UgaGFzIGJlZW4gc2VudCBvciByZWplY3RzIG9uIGZhaWx1cmUuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHNlbmQoJ2hlbGxvIScpLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ3NlbnQnKSkuY2F0Y2goY29uc29sZS5lcnJvcik7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIHNlbmQuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBzZW5kKG1lc3NhZ2UpIHtcclxuICAgIHJldHVybiBhamF4LnBvc3RKU09OKGAvYXBpYCwge2NvbW1hbmQ6ICdzZW5kJywgbWVzc2FnZSwgd29ybGRJZH0pXHJcbiAgICAgICAgLnRoZW4ocmVzcCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyZXNwLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IocmVzcC5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzcDtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKHJlc3AgPT4ge1xyXG4gICAgICAgICAgICAvL0hhbmRsZSBob29rc1xyXG4gICAgICAgICAgICBob29rLmZpcmUoJ3dvcmxkLnNlbmQnLCBtZXNzYWdlKTtcclxuICAgICAgICAgICAgaG9vay5maXJlKCd3b3JsZC5zZXJ2ZXJtZXNzYWdlJywgbWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICAvL0Rpc2FsbG93IGNvbW1hbmRzIHN0YXJ0aW5nIHdpdGggc3BhY2UuXHJcbiAgICAgICAgICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSAmJiAhbWVzc2FnZS5zdGFydHNXaXRoKCcvICcpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29tbWFuZCA9IG1lc3NhZ2Uuc3Vic3RyKDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBhcmdzID0gJyc7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29tbWFuZC5pbmNsdWRlcygnICcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZCA9IGNvbW1hbmQuc3Vic3RyaW5nKDAsIGNvbW1hbmQuaW5kZXhPZignICcpKTtcclxuICAgICAgICAgICAgICAgICAgICBhcmdzID0gbWVzc2FnZS5zdWJzdHJpbmcobWVzc2FnZS5pbmRleE9mKCcgJykgKyAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLmNvbW1hbmQnLCAnU0VSVkVSJywgY29tbWFuZCwgYXJncyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXNwO1xyXG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnIgPT0gJ1dvcmxkIG5vdCBydW5uaW5nLicpIHtcclxuICAgICAgICAgICAgICAgIGNhY2hlLmZpcnN0SWQgPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRocm93IGVycjtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byB3YXRjaCBjaGF0LlxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tDaGF0KCkge1xyXG4gICAgZ2V0TWVzc2FnZXMoKS50aGVuKChtc2dzKSA9PiB7XHJcbiAgICAgICAgbXNncy5mb3JFYWNoKChtZXNzYWdlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoYCR7d29ybGQubmFtZX0gLSBQbGF5ZXIgQ29ubmVjdGVkIGApKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgWywgbmFtZSwgaXBdID0gbWVzc2FnZS5tYXRjaCgvIC0gUGxheWVyIENvbm5lY3RlZCAoLiopIFxcfCAoW1xcZC5dKykgXFx8IChbXFx3XXszMn0pXFxzKiQvKTtcclxuICAgICAgICAgICAgICAgIGhhbmRsZUpvaW5NZXNzYWdlcyhuYW1lLCBpcCk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG1lc3NhZ2Uuc3RhcnRzV2l0aChgJHt3b3JsZC5uYW1lfSAtIFBsYXllciBEaXNjb25uZWN0ZWQgYCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gbWVzc2FnZS5zdWJzdHJpbmcod29ybGQubmFtZS5sZW5ndGggKyAyMyk7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVMZWF2ZU1lc3NhZ2VzKG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLmluY2x1ZGVzKCc6ICcpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmFtZSA9IGdldFVzZXJuYW1lKG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgbGV0IG1zZyA9IG1lc3NhZ2Uuc3Vic3RyaW5nKG5hbWUubGVuZ3RoICsgMik7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVVc2VyTWVzc2FnZXMobmFtZSwgbXNnKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVPdGhlck1lc3NhZ2VzKG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChiaGZhbnNhcGkucmVwb3J0RXJyb3IpXHJcbiAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgc2V0VGltZW91dChjaGVja0NoYXQsIDUwMDApO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gZ2V0IHRoZSBsYXRlc3QgY2hhdCBtZXNzYWdlcy5cclxuICpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldE1lc3NhZ2VzKCkge1xyXG4gICAgcmV0dXJuIHdvcmxkU3RhcnRlZCgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gYWpheC5wb3N0SlNPTihgL2FwaWAsIHsgY29tbWFuZDogJ2dldGNoYXQnLCB3b3JsZElkLCBmaXJzdElkOiBjYWNoZS5maXJzdElkIH0pKVxyXG4gICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT0gJ29rJyAmJiBkYXRhLm5leHRJZCAhPSBjYWNoZS5maXJzdElkKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5maXJzdElkID0gZGF0YS5uZXh0SWQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5sb2c7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5zdGF0dXMgPT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBmaWd1cmUgb3V0IHdobyBzZW50IGEgbWVzc2FnZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIG5hbWUgPSBnZXRVc2VybmFtZSgnU0VSVkVSOiBIaSB0aGVyZSEnKTtcclxuICogLy9uYW1lID09ICdTRVJWRVInXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIHBhcnNlLlxyXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBuYW1lIG9mIHRoZSB1c2VyIHdobyBzZW50IHRoZSBtZXNzYWdlLlxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0VXNlcm5hbWUobWVzc2FnZSkge1xyXG4gICAgZm9yIChsZXQgaSA9IDE4OyBpID4gNDsgaS0tKSB7XHJcbiAgICAgICAgbGV0IHBvc3NpYmxlTmFtZSA9IG1lc3NhZ2Uuc3Vic3RyaW5nKDAsIG1lc3NhZ2UubGFzdEluZGV4T2YoJzogJywgaSkpO1xyXG4gICAgICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMocG9zc2libGVOYW1lKSB8fCBwb3NzaWJsZU5hbWUgPT0gJ1NFUlZFUicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHBvc3NpYmxlTmFtZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBTaG91bGQgaWRlYWxseSBuZXZlciBoYXBwZW4uXHJcbiAgICByZXR1cm4gbWVzc2FnZS5zdWJzdHJpbmcoMCwgbWVzc2FnZS5sYXN0SW5kZXhPZignOiAnLCAxOCkpO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgam9pbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgam9pbmluZy5cclxuICogQHBhcmFtIHtzdHJpbmd9IGlwIHRoZSBpcCBvZiB0aGUgcGxheWVyIGpvaW5pbmcuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVKb2luTWVzc2FnZXMobmFtZSwgaXApIHtcclxuICAgIGlmICghd29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgd29ybGQub25saW5lLnB1c2gobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQuam9pbicsIG5hbWUsIGlwKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSBwbGF5ZXIgZGlzY29ubmVjdGlvbnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBwbGF5ZXIgbGVhdmluZy5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZUxlYXZlTWVzc2FnZXMobmFtZSkge1xyXG4gICAgaWYgKHdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5zcGxpY2Uod29ybGQub25saW5lLmluZGV4T2YobmFtZSksIDEpO1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLmxlYXZlJywgbmFtZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gaGFuZGxlIHVzZXIgY2hhdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgdXNlci5cclxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgdGhlIG1lc3NhZ2Ugc2VudC5cclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZVVzZXJNZXNzYWdlcyhuYW1lLCBtZXNzYWdlKSB7XHJcbiAgICBpZiAobmFtZSA9PSAnU0VSVkVSJykge1xyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLnNlcnZlcmNoYXQnLCBtZXNzYWdlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5jaGVjaygnd29ybGQubWVzc2FnZScsIG5hbWUsIG1lc3NhZ2UpO1xyXG5cclxuICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoJy8nKSAmJiAhbWVzc2FnZS5zdGFydHNXaXRoKCcvICcpKSB7XHJcblxyXG4gICAgICAgIGxldCBjb21tYW5kID0gbWVzc2FnZS5zdWJzdHIoMSk7XHJcblxyXG4gICAgICAgIGxldCBhcmdzID0gJyc7XHJcbiAgICAgICAgaWYgKGNvbW1hbmQuaW5jbHVkZXMoJyAnKSkge1xyXG4gICAgICAgICAgICBjb21tYW5kID0gY29tbWFuZC5zdWJzdHJpbmcoMCwgY29tbWFuZC5pbmRleE9mKCcgJykpO1xyXG4gICAgICAgICAgICBhcmdzID0gbWVzc2FnZS5zdWJzdHJpbmcobWVzc2FnZS5pbmRleE9mKCcgJykgKyAxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaG9vay5jaGVjaygnd29ybGQuY29tbWFuZCcsIG5hbWUsIGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgICAgIHJldHVybjsgLy9ub3QgY2hhdFxyXG4gICAgfVxyXG5cclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLmNoYXQnLCBuYW1lLCBtZXNzYWdlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB1c2VkIHRvIGhhbmRsZSBtZXNzYWdlcyB3aGljaCBhcmUgbm90IHNpbXBseSBwYXJzZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHRvIGhhbmRsZVxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlT3RoZXJNZXNzYWdlcyhtZXNzYWdlKSB7XHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5vdGhlcicsIG1lc3NhZ2UpO1xyXG59XHJcbiIsInZhciBsaXN0ZW5lcnMgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGJlZ2luIGxpc3RlbmluZyB0byBhbiBldmVudC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogbGlzdGVuKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogLy9hbHRlcm5hdGl2ZWx5XHJcbiAqIG9uKCdldmVudCcsIGNvbnNvbGUubG9nKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gbGlzdGVuIHRvLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0aGUgZXZlbnQgaGFuZGxlclxyXG4gKi9cclxuZnVuY3Rpb24gbGlzdGVuKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY2FsbGJhY2sgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xyXG4gICAgfVxyXG5cclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIGxpc3RlbmVyc1trZXldID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XS5pbmNsdWRlcyhjYWxsYmFjaykpIHtcclxuICAgICAgICBsaXN0ZW5lcnNba2V5XS5wdXNoKGNhbGxiYWNrKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHN0b3AgbGlzdGVuaW5nIHRvIGFuIGV2ZW50LiBJZiB0aGUgbGlzdGVuZXIgd2FzIG5vdCBmb3VuZCwgbm8gYWN0aW9uIHdpbGwgYmUgdGFrZW4uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vRWFybGllciBhdHRhY2hlZCBteUZ1bmMgdG8gJ2V2ZW50J1xyXG4gKiByZW1vdmUoJ2V2ZW50JywgbXlGdW5jKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gc3RvcCBsaXN0ZW5pbmcgdG8uXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRoZSBjYWxsYmFjayB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQgbGlzdGVuZXJzLlxyXG4gKi9cclxuZnVuY3Rpb24gcmVtb3ZlKGtleSwgY2FsbGJhY2spIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKGxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgaWYgKGxpc3RlbmVyc1trZXldLmluY2x1ZGVzKGNhbGxiYWNrKSkge1xyXG4gICAgICAgICAgICBsaXN0ZW5lcnNba2V5XS5zcGxpY2UobGlzdGVuZXJzW2tleV0uaW5kZXhPZihjYWxsYmFjayksIDEpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIGNhbGwgZXZlbnRzLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBjaGVjaygndGVzdCcsIDEsIDIsIDMpO1xyXG4gKiBjaGVjaygndGVzdCcsIHRydWUpO1xyXG4gKiAvLyBhbHRlcm5hdGl2ZWx5XHJcbiAqIGZpcmUoJ3Rlc3QnLCAxLCAyLCAzKTtcclxuICogZmlyZSgndGVzdCcsIHRydWUpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBjYWxsLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhcmd1bWVudHMgdG8gcGFzcyB0byBsaXN0ZW5pbmcgZnVuY3Rpb25zLlxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2soa2V5LCAuLi5hcmdzKSB7XHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGlzdGVuZXJzW2tleV0uZm9yRWFjaChmdW5jdGlvbihsaXN0ZW5lcikge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGxpc3RlbmVyKC4uLmFyZ3MpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gdXBkYXRlIGEgdmFsdWUgYmFzZWQgb24gaW5wdXQgZnJvbSBsaXN0ZW5lcnMuXHJcbiAqXHJcbiAqIEBkZXByaWNhdGVkIHNpbmNlIDYuMS4wLiBJbnN0ZWFkLCB1cGRhdGUgcmVxdWVzdHMgc2hvdWxkIGJlIGhhbmRsZWQgYnkgdGhlIGV4dGVuc2lvbiBpdGVzZWxmLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB1cGRhdGUoJ2V2ZW50JywgdHJ1ZSwgMSwgMiwgMyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGNhbGxcclxuICogQHBhcmFtIHttaXhlZH0gaW5pdGlhbCB0aGUgaW5pdGlhbCB2YWx1ZSB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcGFyYW0ge21peGVkfSBhcmdzIGFueSBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gbGlzdGVuZXJzLlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIHVwZGF0ZShrZXksIGluaXRpYWwsIC4uLmFyZ3MpIHtcclxuICAgIGtleSA9IGtleS50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG4gICAgaWYgKCFsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIHJldHVybiBpbml0aWFsO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBsaXN0ZW5lcnNba2V5XS5yZWR1Y2UoZnVuY3Rpb24ocHJldmlvdXMsIGN1cnJlbnQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gY3VycmVudChwcmV2aW91cywgLi4uYXJncyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzdWx0ICE9ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBwcmV2aW91cztcclxuICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgaWYgKGtleSAhPSAnZXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjaygnZXJyb3InLCBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcHJldmlvdXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgaW5pdGlhbCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgbGlzdGVuLFxyXG4gICAgb246IGxpc3RlbixcclxuICAgIHJlbW92ZSxcclxuICAgIGNoZWNrLFxyXG4gICAgZmlyZTogY2hlY2ssXHJcbiAgICB1cGRhdGUsXHJcbn07XHJcbiIsImZ1bmN0aW9uIHVwZGF0ZShrZXlzLCBvcGVyYXRvcikge1xyXG4gICAgT2JqZWN0LmtleXMobG9jYWxTdG9yYWdlKS5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBvZiBrZXlzKSB7XHJcbiAgICAgICAgICAgIGlmIChpdGVtLnN0YXJ0c1dpdGgoa2V5KSkge1xyXG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oaXRlbSwgb3BlcmF0b3IobG9jYWxTdG9yYWdlLmdldEl0ZW0oaXRlbSkpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vanNoaW50IC1XMDg2XHJcbi8vTm8gYnJlYWsgc3RhdGVtZW50cyBhcyB3ZSB3YW50IHRvIGV4ZWN1dGUgYWxsIHVwZGF0ZXMgYWZ0ZXIgbWF0Y2hlZCB2ZXJzaW9uLlxyXG5zd2l0Y2ggKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdtYl92ZXJzaW9uJykpIHtcclxuICAgIGNhc2UgbnVsbDpcclxuICAgICAgICBicmVhazsgLy9Ob3RoaW5nIHRvIG1pZ3JhdGVcclxuICAgIGNhc2UgJzUuMi4wJzpcclxuICAgIGNhc2UgJzUuMi4xJzpcclxuICAgICAgICAvL1dpdGggNi4wLCBuZXdsaW5lcyBhcmUgZGlyZWN0bHkgc3VwcG9ydGVkIGluIG1lc3NhZ2VzIGJ5IHRoZSBib3QuXHJcbiAgICAgICAgdXBkYXRlKFsnYW5ub3VuY2VtZW50QXJyJywgJ2pvaW5BcnInLCAnbGVhdmVBcnInLCAndHJpZ2dlckFyciddLCBmdW5jdGlvbihyYXcpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJzZWQgPSBKU09OLnBhcnNlKHJhdyk7XHJcbiAgICAgICAgICAgICAgICBwYXJzZWQuZm9yRWFjaChtc2cgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtc2cubWVzc2FnZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cubWVzc2FnZSA9IG1zZy5tZXNzYWdlLnJlcGxhY2UoL1xcXFxuL2csICdcXG4nKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXJzZWQpO1xyXG4gICAgICAgICAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiByYXc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBicmVhazsgLy9OZXh0IGJ1Z2ZpeCBvbmx5IHJlbGF0ZXMgdG8gNi4wIGJvdC5cclxuICAgIGNhc2UgJzYuMC4wYSc6XHJcbiAgICBjYXNlICc2LjAuMCc6XHJcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgd2luZG93LmJvdHVpLmFsZXJ0KFwiRHVlIHRvIGEgYnVnIGluIHRoZSA2LjAuMCB2ZXJzaW9uIG9mIHRoZSBib3QsIHlvdXIgam9pbiBhbmQgbGVhdmUgbWVzc2FnZXMgbWF5IGJlIHN3YXBwZWQuIFNvcnJ5ISBUaGlzIGNhbm5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5LiBUaGlzIG1lc3NhZ2Ugd2lsbCBub3QgYmUgc2hvd24gYWdhaW4uXCIpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgICAgIGJyZWFrOyAvL05leHQgYnVnZml4IG9ubHkgcmVsYXRlcyB0byA2LjAuMSAvIDYuMC4yLlxyXG4gICAgY2FzZSAnNi4wLjEnOlxyXG4gICAgY2FzZSAnNi4wLjInOlxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5ib3R1aS5hbGVydChcIkR1ZSB0byBhIGJ1ZyBpbiA2LjAuMSAvIDYuMC4yLCBncm91cHMgbWF5IGhhdmUgYmVlbiBtaXhlZCB1cCBvbiBKb2luLCBMZWF2ZSwgYW5kIFRyaWdnZXIgbWVzc2FnZXMuIFNvcnJ5ISBUaGlzIGNhbm5vdCBiZSBmaXhlZCBhdXRvbWF0aWNhbGx5IGlmIGl0IG9jY3VyZWQgb24geW91ciBib3QuIEFubm91bmNlbWVudHMgaGF2ZSBhbHNvIGJlZW4gZml4ZWQuXCIpO1xyXG4gICAgICAgIH0sIDEwMDApO1xyXG4gICAgY2FzZSAnNi4wLjMnOlxyXG4gICAgY2FzZSAnNi4wLjQnOlxyXG4gICAgY2FzZSAnNi4wLjUnOlxyXG59XHJcbi8vanNoaW50ICtXMDg2XHJcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZ2V0U3RyaW5nLFxyXG4gICAgZ2V0T2JqZWN0LFxyXG4gICAgc2V0LFxyXG4gICAgY2xlYXJOYW1lc3BhY2UsXHJcbn07XHJcblxyXG4vL1JFVklFVzogSXMgdGhlcmUgYSBiZXR0ZXIgd2F5IHRvIGRvIHRoaXM/IHJlcXVpcmUoJy4vY29uZmlnJykgbWF5YmU/XHJcbmNvbnN0IE5BTUVTUEFDRSA9IHdpbmRvdy53b3JsZElkO1xyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdHJpbmcgZnJvbSB0aGUgc3RvcmFnZSBpZiBpdCBleGlzdHMgYW5kIHJldHVybnMgaXQsIG90aGVyd2lzZSByZXR1cm5zIGZhbGxiYWNrLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgeCA9IGdldFN0cmluZygnc3RvcmVkX3ByZWZzJywgJ25vdGhpbmcnKTtcclxuICogdmFyIHkgPSBnZXRTdHJpbmcoJ3N0b3JlZF9wcmVmcycsICdub3RoaW5nJywgZmFsc2UpO1xyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBrZXkgdG8gcmV0cmlldmUuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGZhbGxiYWNrIHdoYXQgdG8gcmV0dXJuIGlmIHRoZSBrZXkgd2FzIG5vdCBmb3VuZC5cclxuICogQHBhcmFtIHtib29sfSBbbG9jYWw9dHJ1ZV0gd2hldGhlciBvciBub3QgdG8gdXNlIGEgbmFtZXNwYWNlIHdoZW4gY2hlY2tpbmcgZm9yIHRoZSBrZXkuXHJcbiAqIEByZXR1cm4ge21peGVkfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0U3RyaW5nKGtleSwgZmFsbGJhY2ssIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgdmFyIHJlc3VsdDtcclxuICAgIGlmIChsb2NhbCkge1xyXG4gICAgICAgIHJlc3VsdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGAke2tleX0ke05BTUVTUEFDRX1gKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmVzdWx0ID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gKHJlc3VsdCA9PT0gbnVsbCkgPyBmYWxsYmFjayA6IHJlc3VsdDtcclxufVxyXG5cclxuLyoqXHJcbiAqIEdldHMgYSBzdG9yZWQgb2JqZWN0IGlmIGl0IGV4aXN0cywgb3RoZXJ3aXNlIHJldHVybnMgZmFsbGJhY2suXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB4ID0gZ2V0T2JqZWN0KCdzdG9yZWRfa2V5JywgWzEsIDIsIDNdKTtcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgaXRlbSB0byByZXRyaWV2ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZmFsbGJhY2sgd2hhdCB0byByZXR1cm4gaWYgdGhlIGl0ZW0gZG9lcyBub3QgZXhpc3Qgb3IgZmFpbHMgdG8gcGFyc2UgY29ycmVjdGx5LlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIG9yIG5vdCBhIG5hbWVzcGFjZSBzaG91bGQgYmUgdXNlZC5cclxuICogQHJldHVybiB7bWl4ZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPYmplY3Qoa2V5LCBmYWxsYmFjaywgbG9jYWwgPSB0cnVlKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gZ2V0U3RyaW5nKGtleSwgZmFsc2UsIGxvY2FsKTtcclxuXHJcbiAgICBpZiAoIXJlc3VsdCkge1xyXG4gICAgICAgIHJldHVybiBmYWxsYmFjaztcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UocmVzdWx0KTtcclxuICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcblxyXG4vKipcclxuICogU2V0cyBhbiBvYmplY3QgaW4gdGhlIHN0b3JhZ2UsIHN0cmluZ2lmeWluZyBpdCBmaXJzdCBpZiBuZWNjZXNzYXJ5LlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ3NvbWVfa2V5Jywge2E6IFsxLCAyLCAzXSwgYjogJ3Rlc3QnfSk7XHJcbiAqIC8vcmV0dXJucyAne1wiYVwiOlsxLDIsM10sXCJiXCI6XCJ0ZXN0XCJ9J1xyXG4gKiBnZXRTdHJpbmcoJ3NvbWVfa2V5Jyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGl0ZW0gdG8gb3ZlcndyaXRlIG9yIGNyZWF0ZS5cclxuICogQHBhcmFtIHttaXhlZH0gZGF0YSBhbnkgc3RyaW5naWZ5YWJsZSB0eXBlLlxyXG4gKiBAcGFyYW0ge2Jvb2x9IFtsb2NhbD10cnVlXSB3aGV0aGVyIHRvIHNhdmUgdGhlIGl0ZW0gd2l0aCBhIG5hbWVzcGFjZS5cclxuICovXHJcbmZ1bmN0aW9uIHNldChrZXksIGRhdGEsIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgaWYgKGxvY2FsKSB7XHJcbiAgICAgICAga2V5ID0gYCR7a2V5fSR7TkFNRVNQQUNFfWA7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHR5cGVvZiBkYXRhID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBkYXRhKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZW1vdmVzIGFsbCBpdGVtcyBzdGFydGluZyB3aXRoIG5hbWVzcGFjZSBmcm9tIHRoZSBzdG9yYWdlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZXQoJ2tleV90ZXN0JywgMSk7XHJcbiAqIHNldCgna2V5X3Rlc3QyJywgMik7XHJcbiAqIGNsZWFyTmFtZXNwYWNlKCdrZXlfJyk7IC8vYm90aCBrZXlfdGVzdCBhbmQga2V5X3Rlc3QyIGhhdmUgYmVlbiByZW1vdmVkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZXNwYWNlIHRoZSBwcmVmaXggdG8gY2hlY2sgZm9yIHdoZW4gcmVtb3ZpbmcgaXRlbXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBjbGVhck5hbWVzcGFjZShuYW1lc3BhY2UpIHtcclxuICAgIE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSkuZm9yRWFjaChrZXkgPT4ge1xyXG4gICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aChuYW1lc3BhY2UpKSB7XHJcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiLy9JRSBkb2Vzbid0IGxpa2UgY29uc29sZS5sb2cgdW5sZXNzIGRldiB0b29scyBhcmUgb3Blbi5cclxuaWYgKCF3aW5kb3cuY29uc29sZSkge1xyXG4gICAgd2luZG93LmNvbnNvbGUgPSB7fTtcclxuICAgIHdpbmRvdy5sb2cgPSB3aW5kb3cubG9nIHx8IFtdO1xyXG4gICAgY29uc29sZS5sb2cgPSBmdW5jdGlvbiguLi5hcmdzKSB7XHJcbiAgICAgICAgd2luZG93LmxvZy5wdXNoKGFyZ3MpO1xyXG4gICAgfTtcclxufVxyXG5bJ2luZm8nLCAnZXJyb3InLCAnd2FybicsICdhc3NlcnQnXS5mb3JFYWNoKG1ldGhvZCA9PiB7XHJcbiAgICBpZiAoIWNvbnNvbGVbbWV0aG9kXSkge1xyXG4gICAgICAgIGNvbnNvbGVbbWV0aG9kXSA9IGNvbnNvbGUubG9nO1xyXG4gICAgfVxyXG59KTtcclxuIiwiLy9EZXRhaWxzIHBvbHlmaWxsLCBvbGRlciBmaXJlZm94LCBJRVxyXG5pZiAoISgnb3BlbicgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGV0YWlscycpKSkge1xyXG4gICAgbGV0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuICAgIHN0eWxlLnRleHRDb250ZW50ICs9IGBkZXRhaWxzOm5vdChbb3Blbl0pID4gOm5vdChzdW1tYXJ5KSB7IGRpc3BsYXk6IG5vbmUgIWltcG9ydGFudDsgfSBkZXRhaWxzID4gc3VtbWFyeTpiZWZvcmUgeyBjb250ZW50OiBcIuKWtlwiOyBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGZvbnQtc2l6ZTogLjhlbTsgd2lkdGg6IDEuNWVtOyBmb250LWZhbWlseTpcIkNvdXJpZXIgTmV3XCI7IH0gZGV0YWlsc1tvcGVuXSA+IHN1bW1hcnk6YmVmb3JlIHsgdHJhbnNmb3JtOiByb3RhdGUoOTBkZWcpOyB9YDtcclxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xyXG5cclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldC50YWdOYW1lID09ICdTVU1NQVJZJykge1xyXG4gICAgICAgICAgICBsZXQgZGV0YWlscyA9IGV2ZW50LnRhcmdldC5wYXJlbnROb2RlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFkZXRhaWxzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChkZXRhaWxzLmdldEF0dHJpYnV0ZSgnb3BlbicpKSB7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLm9wZW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMucmVtb3ZlQXR0cmlidXRlKCdvcGVuJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLm9wZW4gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5zZXRBdHRyaWJ1dGUoJ29wZW4nLCAnb3BlbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiLy9JbXBvcnRlZCB2YXJzIC8gZnVuY3Rpb25zXHJcbi8qZ2xvYmFsc1xyXG4gICAgSU5DTFVERV9GSUxFXHJcbiovXHJcblxyXG4vL092ZXJ3cml0ZSB0aGUgcG9sbENoYXQgZnVuY3Rpb24gdG8ga2lsbCB0aGUgZGVmYXVsdCBjaGF0IGZ1bmN0aW9uXHJcbndpbmRvdy5wb2xsQ2hhdCA9IGZ1bmN0aW9uKCkge307XHJcblxyXG5yZXF1aXJlKCcuL3BvbHlmaWxscy9jb25zb2xlJyk7XHJcbnJlcXVpcmUoJy4vbGlicy9taWdyYXRpb24nKTtcclxuXHJcbnZhciB1aSA9IHJlcXVpcmUoJy4vdWknKTtcclxudmFyIGJoZmFuc2FwaSA9IHJlcXVpcmUoJy4vbGlicy9iaGZhbnNhcGknKTtcclxudmFyIGhvb2sgPSByZXF1aXJlKCcuL2xpYnMvaG9vaycpO1xyXG5cclxuaG9vay5vbignZXJyb3InLCBiaGZhbnNhcGkucmVwb3J0RXJyb3IpO1xyXG5cclxuSU5DTFVERV9GSUxFKCcvZGV2L01lc3NhZ2VCb3QuanMnKTtcclxuSU5DTFVERV9GSUxFKCcvZGV2L01lc3NhZ2VCb3RFeHRlbnNpb24uanMnKTtcclxuXHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoZXJyKSA9PiB7XHJcbiAgICBpZiAoZXJyLm1lc3NhZ2UgIT0gJ1NjcmlwdCBlcnJvcicpIHtcclxuICAgICAgICB3aW5kb3cuaG9vay5jaGVjaygnZXJyb3InLCBlcnIpO1xyXG4gICAgfVxyXG59KTtcclxuIiwidmFyIHBhdGhzID0gW1xyXG4gICAgJy4vYWxlcnQnLFxyXG4gICAgJy4vbm90aWZ5JyxcclxuICAgICcuL3RlbXBsYXRlJyxcclxuICAgICcuL25hdmlnYXRpb24nLFxyXG4gICAgJy4vY29uc29sZSdcclxuXTtcclxuXHJcbnBhdGhzLmZvckVhY2gocGF0aCA9PiB7XHJcbiAgICBPYmplY3QuYXNzaWduKG1vZHVsZS5leHBvcnRzLCByZXF1aXJlKHBhdGgpKTtcclxufSk7XHJcbiIsIi8vIEJ1aWxkIHRoZSBBUElcclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2V4cG9ydHMnKTtcclxuXHJcbi8vIEJ1aWxkIHRoZSBwYWdlXHJcbnJlcXVpcmUoJy4vcGFnZScpO1xyXG5yZXF1aXJlKCcuL2xpc3RlbmVycycpO1xyXG4iLCIvLyBMaXN0ZW5lcnMgZm9yIHVzZXIgYWN0aW9ucyB3aXRoaW4gdGhlIGJvdFxyXG5cclxuLy8gLS0gTm8gZGVwZW5kZW5jaWVzXHJcblxyXG4vLyBBdXRvIHNjcm9sbCB3aGVuIG5ldyBtZXNzYWdlcyBhcmUgYWRkZWQgdG8gdGhlIHBhZ2UsIHVubGVzcyB0aGUgb3duZXIgaXMgcmVhZGluZyBvbGQgY2hhdC5cclxuKG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIHNob3dOZXdDaGF0KCkge1xyXG4gICAgbGV0IGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIHVsJyk7XHJcbiAgICBsZXQgbGFzdExpbmUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSBsaTpsYXN0LWNoaWxkJyk7XHJcblxyXG4gICAgaWYgKCFjb250YWluZXIgfHwgIWxhc3RMaW5lKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjb250YWluZXIuc2Nyb2xsSGVpZ2h0IC0gY29udGFpbmVyLmNsaWVudEhlaWdodCAtIGNvbnRhaW5lci5zY3JvbGxUb3AgPD0gbGFzdExpbmUuY2xpZW50SGVpZ2h0ICogMikge1xyXG4gICAgICAgIGxhc3RMaW5lLnNjcm9sbEludG9WaWV3KGZhbHNlKTtcclxuICAgIH1cclxufSkpLm9ic2VydmUoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2NvbnNvbGUgY2hhdCcpLCB7Y2hpbGRMaXN0OiB0cnVlfSk7XHJcblxyXG5cclxuLy8gUmVtb3ZlIG9sZCBjaGF0IHRvIHJlZHVjZSBtZW1vcnkgdXNhZ2VcclxuKG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uIHJlbW92ZU9sZENoYXQoKSB7XHJcbiAgICB2YXIgY2hhdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIHVsJyk7XHJcblxyXG4gICAgd2hpbGUgKGNoYXQuY2hpbGRyZW4ubGVuZ3RoID4gNTAwKSB7XHJcbiAgICAgICAgY2hhdC5jaGlsZHJlblswXS5yZW1vdmUoKTtcclxuICAgIH1cclxufSkpLm9ic2VydmUoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2NvbnNvbGUgY2hhdCcpLCB7Y2hpbGRMaXN0OiB0cnVlfSk7XHJcblxyXG5cclxuLy8gQ2hhbmdlIGZ1bGxzY3JlZW4gdGFic1xyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGVmdE5hdicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gZ2xvYmFsVGFiQ2hhbmdlKGV2ZW50KSB7XHJcbiAgICAgdmFyIHRhYk5hbWUgPSBldmVudC50YXJnZXQuZGF0YXNldC50YWJOYW1lO1xyXG4gICAgaWYoIXRhYk5hbWUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy9Db250ZW50XHJcbiAgICAvL1dlIGNhbid0IGp1c3QgcmVtb3ZlIHRoZSBmaXJzdCBkdWUgdG8gYnJvd3NlciBsYWdcclxuICAgIEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnI2NvbnRhaW5lciA+IC52aXNpYmxlJykpXHJcbiAgICAgICAgLmZvckVhY2goZWwgPT4gZWwuY2xhc3NMaXN0LnJlbW92ZSgndmlzaWJsZScpKTtcclxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNjb250YWluZXIgPiBbZGF0YS10YWItbmFtZT0ke3RhYk5hbWV9XWApLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcclxuXHJcbiAgICAvL1RhYnNcclxuICAgIEFycmF5LmZyb20oZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xlZnROYXYgLnNlbGVjdGVkJykpXHJcbiAgICAgICAgLmZvckVhY2goZWwgPT4gZWwuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKSk7XHJcbiAgICBldmVudC50YXJnZXQuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKTtcclxufSk7XHJcblxyXG5cclxuLy8gLS0gRGVwZW5kcyBvbiBVSVxyXG5cclxudmFyIHVpID0gcmVxdWlyZSgnLi9leHBvcnRzJyk7XHJcblxyXG5cclxuLy8gSGlkZSB0aGUgbWVudSB3aGVuIGNsaWNraW5nIHRoZSBvdmVybGF5XHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWZ0TmF2IC5vdmVybGF5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB1aS50b2dnbGVNZW51KTtcclxuIiwidmFyIGJoZmFuc2FwaSA9IHJlcXVpcmUoJy4uLy4uL2xpYnMvYmhmYW5zYXBpJyk7XHJcbnZhciB1aSA9IHJlcXVpcmUoJy4uL2V4cG9ydHMnKTtcclxudmFyIGhvb2sgPSByZXF1aXJlKCcuLi8uLi9saWJzL2hvb2snKTtcclxudmFyIE1lc3NhZ2VCb3RFeHRlbnNpb24gPSByZXF1aXJlKCcuLi8uLi9NZXNzYWdlQm90RXh0ZW5zaW9uJyk7XHJcblxyXG4vL0NyZWF0ZSB0aGUgZXh0ZW5zaW9uIHN0b3JlIHBhZ2VcclxuYmhmYW5zYXBpLmdldFN0b3JlKCkudGhlbihyZXNwID0+IHtcclxuICAgIGlmIChyZXNwLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2V4dHMnKS5pbm5lckhUTUwgKz0gcmVzcC5tZXNzYWdlO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG4gICAgcmVzcC5leHRlbnNpb25zLmZvckVhY2goZXh0ZW5zaW9uID0+IHtcclxuICAgICAgICB1aS5idWlsZENvbnRlbnRGcm9tVGVtcGxhdGUoJyNleHRUZW1wbGF0ZScsICcjZXh0cycsIFtcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnaDQnLCB0ZXh0OiBleHRlbnNpb24udGl0bGV9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdzcGFuJywgaHRtbDogZXh0ZW5zaW9uLnNuaXBwZXR9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICcuZXh0JywgJ2RhdGEtaWQnOiBleHRlbnNpb24uaWR9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdidXR0b24nLCB0ZXh0OiBiaGZhbnNhcGkuZXh0ZW5zaW9uSW5zdGFsbGVkKGV4dGVuc2lvbi5pZCkgPyAnUmVtb3ZlJyA6ICdJbnN0YWxsJ31cclxuICAgICAgICBdKTtcclxuICAgIH0pO1xyXG59KS5jYXRjaChiaGZhbnNhcGkucmVwb3J0RXJyb3IpO1xyXG5cclxuLy8gSW5zdGFsbCAvIHVuaW5zdGFsbCBleHRlbnNpb25zXHJcbmZ1bmN0aW9uIGV4dEFjdGlvbnModGFnTmFtZSwgZSkge1xyXG4gICAgaWYgKGUudGFyZ2V0LnRhZ05hbWUgIT0gdGFnTmFtZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBlbCA9IGUudGFyZ2V0O1xyXG4gICAgdmFyIGlkID0gZWwucGFyZW50RWxlbWVudC5kYXRhc2V0LmlkO1xyXG5cclxuICAgIGlmIChlbC50ZXh0Q29udGVudCA9PSAnSW5zdGFsbCcpIHtcclxuICAgICAgICBNZXNzYWdlQm90RXh0ZW5zaW9uLmluc3RhbGwoaWQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBNZXNzYWdlQm90RXh0ZW5zaW9uLnVuaW5zdGFsbChpZCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNleHRzJylcclxuICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV4dEFjdGlvbnMuYmluZChudWxsLCAnQlVUVE9OJykpO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2V4dF9saXN0JylcclxuICAgIC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV4dEFjdGlvbnMuYmluZChudWxsLCAnQScpKTtcclxuXHJcblxyXG5ob29rLm9uKCdleHRlbnNpb24uaW5zdGFsbGVkJywgZnVuY3Rpb24oaWQpIHtcclxuICAgIC8vTGlzdFxyXG4gICAgYmhmYW5zYXBpLmdldEV4dGVuc2lvbk5hbWUoaWQpLnRoZW4ocmVzcCA9PiB7XHJcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9leHRfbGlzdCB1bCcpO1xyXG4gICAgICAgIGlmIChyZXNwLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihyZXNwLm1lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgICAgICBsZXQgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcclxuICAgICAgICBsZXQgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuXHJcbiAgICAgICAgc3Bhbi50ZXh0Q29udGVudCA9IGAke3Jlc3AubmFtZX0gKCR7cmVzcC5pZH0pYDtcclxuICAgICAgICBhLnRleHRDb250ZW50ID0gJ1JlbW92ZSc7XHJcbiAgICAgICAgbGkuZGF0YXNldC5pZCA9IHJlc3AuaWQ7XHJcblxyXG4gICAgICAgIGxpLmFwcGVuZENoaWxkKHNwYW4pO1xyXG4gICAgICAgIGxpLmFwcGVuZENoaWxkKGEpO1xyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChsaSk7XHJcbiAgICB9KS5jYXRjaChiaGZhbnNhcGkucmVwb3J0RXJyb3IpO1xyXG5cclxuICAgIC8vU3RvcmVcclxuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbWJfZXh0ZW5zaW9ucyBbZGF0YS1pZD1cIiR7aWR9XCJdIGJ1dHRvbmApO1xyXG4gICAgaWYgKGJ1dHRvbikge1xyXG4gICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICdSZW1vdmUnO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbmhvb2sub24oJ2V4dGVuc2lvbi51bmluc3RhbGxlZCcsIGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAvL0xpc3RcclxuICAgIHZhciBsaSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNtYl9leHRfbGlzdCBbZGF0YS1pZD1cIiR7aWR9XCJdYCk7XHJcbiAgICBpZiAobGkpIHtcclxuICAgICAgICBsaS5yZW1vdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvL1N0b3JlXHJcbiAgICB2YXIgYnV0dG9uID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI21iX2V4dGVuc2lvbnMgW2RhdGEtaWQ9XCIke2lkfVwiXSBidXR0b25gKTtcclxuICAgIGlmIChidXR0b24pIHtcclxuICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnUmVtb3ZlZCc7XHJcbiAgICAgICAgYnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gJ0luc3RhbGwnO1xyXG4gICAgICAgICAgICBidXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICB9LCAzMDAwKTtcclxuICAgIH1cclxufSk7XHJcbiIsIi8qZ2xvYmFsc1xyXG4gICAgSU5DTFVERV9GSUxFXHJcbiovXHJcblxyXG4vLyBCdWlsZCB0aGUgcGFnZVxyXG5cclxuZG9jdW1lbnQuaGVhZC5pbm5lckhUTUwgPSBJTkNMVURFX0ZJTEUoJy9kaXN0L3RtcGhlYWQuaHRtbCcpO1xyXG5cclxudmFyIHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG5zLnRleHRDb250ZW50ID0gSU5DTFVERV9GSUxFKCcvZGlzdC90bXBib3QuY3NzJyk7XHJcbmRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQocyk7XHJcblxyXG5kb2N1bWVudC5ib2R5LmlubmVySFRNTCA9IElOQ0xVREVfRklMRShcIi9kaXN0L3RtcGJvZHkuaHRtbFwiKTtcclxuXHJcbnJlcXVpcmUoJy4uLy4uL3BvbHlmaWxscy9kZXRhaWxzJyk7XHJcblxyXG5yZXF1aXJlKCcuL2V4dGVuc2lvbnMnKTtcclxucmVxdWlyZSgnLi9zZXR0aW5ncycpO1xyXG4iLCJ2YXIgdWkgPSByZXF1aXJlKCcuLi9leHBvcnRzJyk7XHJcbnZhciBNZXNzYWdlQm90RXh0ZW5zaW9uID0gcmVxdWlyZSgnLi4vLi4vTWVzc2FnZUJvdEV4dGVuc2lvbicpO1xyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2JhY2t1cF9sb2FkJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBsb2FkQmFja3VwKCkge1xyXG4gICAgdWkuYWxlcnQoJ0VudGVyIHRoZSBiYWNrdXAgY29kZTo8dGV4dGFyZWEgc3R5bGU9XCJ3aWR0aDpjYWxjKDEwMCUgLSA3cHgpO2hlaWdodDoxNjBweDtcIj48L3RleHRhcmVhPicsXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAgeyB0ZXh0OiAnTG9hZCAmIHJlZnJlc2ggcGFnZScsIHN0eWxlOiAnc3VjY2VzcycsIGFjdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2RlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IHRleHRhcmVhJykudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlID0gSlNPTi5wYXJzZShjb2RlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2RlID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGJhY2t1cCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1aS5ub3RpZnkoJ0ludmFsaWQgYmFja3VwIGNvZGUuIE5vIGFjdGlvbiB0YWtlbi4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLmNsZWFyKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhjb2RlKS5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgY29kZVtrZXldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyB0ZXh0OiAnQ2FuY2VsJyB9XHJcbiAgICAgICAgICAgICAgICBdKTtcclxufSk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfbG9hZF9tYW4nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGxvYWRFeHRlbnNpb24oKSB7XHJcbiAgICB1aS5hbGVydCgnRW50ZXIgdGhlIElEIG9yIFVSTCBvZiBhbiBleHRlbnNpb246PGJyPjxpbnB1dCBzdHlsZT1cIndpZHRoOmNhbGMoMTAwJSAtIDdweCk7XCIvPicsXHJcbiAgICAgICAgICAgICAgICBbXHJcbiAgICAgICAgICAgICAgICAgICAge3RleHQ6ICdBZGQnLCBzdHlsZTogJ3N1Y2Nlc3MnLCBhY3Rpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZXh0UmVmID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2FsZXJ0IGlucHV0JykudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHRSZWYubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXh0UmVmLnN0YXJ0c1dpdGgoJ2h0dHAnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLnNyYyA9IGV4dFJlZjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWVzc2FnZUJvdEV4dGVuc2lvbi5pbnN0YWxsKGV4dFJlZik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAgICAgICAgICB7dGV4dDogJ0NhbmNlbCd9XHJcbiAgICAgICAgICAgICAgICBdKTtcclxufSk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfYmFja3VwX3NhdmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIHNob3dCYWNrdXAoKSB7XHJcbiAgICB2YXIgYmFja3VwID0gSlNPTi5zdHJpbmdpZnkobG9jYWxTdG9yYWdlKS5yZXBsYWNlKC88L2csICcmbHQ7Jyk7XHJcbiAgICB1aS5hbGVydChgQ29weSB0aGlzIHRvIGEgc2FmZSBwbGFjZTo8YnI+PHRleHRhcmVhIHN0eWxlPVwid2lkdGg6IGNhbGMoMTAwJSAtIDdweCk7aGVpZ2h0OjE2MHB4O1wiPiR7YmFja3VwfTwvdGV4dGFyZWE+YCk7XHJcbn0pO1xyXG4iXX0=
