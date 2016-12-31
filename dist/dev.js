(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function MessageBot(ajax, hook, storage, bhfansapi, api, ui) { //jshint ignore:line
    //Helps avoid messages that are tacked onto the end of other messages.
    var chatBuffer = [];
    (function checkBuffer() {
        if (chatBuffer.length) {
            api.send(chatBuffer.shift())
                .then(() => setTimeout(checkBuffer, 500));
        } else {
            setTimeout(checkBuffer, 500);
        }
    }());

    setTimeout(function() {
        bhfansapi.listExtensions();
        hook.listen('error', bhfansapi.reportError);
        storage.getObject('mb_extensions', [], false).forEach(bhfansapi.startExtension);
    }, 1000);

    var bot = {
        version: '6.0.6',
        ui: ui,
        api: api,
        hook: hook,
        storage: storage,
        preferences: storage.getObject('mb_preferences', {}, false),
    };
    storage.set('mb_version', bot.version, false);

    bot.send = function send(message) {
        chatBuffer.push(hook.update('bot.send', message));
    };

    var world = {
        name: '',
        online: [],
        owner: '',
        players: storage.getObject('mb_players', {}),
        lists: {admin: [], mod: [], staff: [], black: [], white: []},
    };
    bot.world = world;

    var messages = {
        announcement: storage.getObject('announcementArr', []),
        trigger: storage.getObject('triggerArr', []),
        join: storage.getObject('joinArr', []),
        leave: storage.getObject('leaveArr', []),
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

},{}],2:[function(require,module,exports){
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

"function MessageBot(ajax, hook, storage, bhfansapi, api, ui) { //jshint ignore:line\r\n    //Helps avoid messages that are tacked onto the end of other messages.\r\n    var chatBuffer = [];\r\n    (function checkBuffer() {\r\n        if (chatBuffer.length) {\r\n            api.send(chatBuffer.shift())\r\n                .then(() => setTimeout(checkBuffer, 500));\r\n        } else {\r\n            setTimeout(checkBuffer, 500);\r\n        }\r\n    }());\r\n\r\n    setTimeout(function() {\r\n        bhfansapi.listExtensions();\r\n        hook.listen('error', bhfansapi.reportError);\r\n        storage.getObject('mb_extensions', [], false).forEach(bhfansapi.startExtension);\r\n    }, 1000);\r\n\r\n    var bot = {\r\n        version: '6.0.6',\r\n        ui: ui,\r\n        api: api,\r\n        hook: hook,\r\n        storage: storage,\r\n        preferences: storage.getObject('mb_preferences', {}, false),\r\n    };\r\n    storage.set('mb_version', bot.version, false);\r\n\r\n    bot.send = function send(message) {\r\n        chatBuffer.push(hook.update('bot.send', message));\r\n    };\r\n\r\n    var world = {\r\n        name: '',\r\n        online: [],\r\n        owner: '',\r\n        players: storage.getObject('mb_players', {}),\r\n        lists: {admin: [], mod: [], staff: [], black: [], white: []},\r\n    };\r\n    bot.world = world;\r\n\r\n    var messages = {\r\n        announcement: storage.getObject('announcementArr', []),\r\n        trigger: storage.getObject('triggerArr', []),\r\n        join: storage.getObject('joinArr', []),\r\n        leave: storage.getObject('leaveArr', []),\r\n    };\r\n\r\n    //Update the world object.\r\n    Promise.all([api.getLists(), api.getWorldName(), api.getOwnerName()])\r\n        .then((values) => {\r\n            var [lists, worldName, owner] = values;\r\n\r\n            //Remove the owner & SERVER from the mod lists and add to admin / staff lists.\r\n            [owner, 'SERVER'].forEach(name => {\r\n                if (!lists.admin.includes(name)) {\r\n                    lists.admin.push(name);\r\n                }\r\n                if (!lists.staff.includes(name)) {\r\n                    lists.staff.push(name);\r\n                }\r\n                if (lists.mod.includes(name)) {\r\n                    lists.mod.splice(lists.mod.indexOf(name), 1);\r\n                }\r\n            });\r\n\r\n            world.lists = lists;\r\n            world.name = worldName;\r\n            world.owner = owner;\r\n        })\r\n        .catch(bhfansapi.reportError);\r\n\r\n    //Update the players object\r\n    Promise.all([api.getLogs(), api.getWorldName()])\r\n        .then((values) => {\r\n            var [log, worldName] = values;\r\n            var last = storage.getObject('mb_lastLogLoad', 0);\r\n            storage.set('mb_lastLogLoad', Math.floor(Date.now().valueOf()));\r\n\r\n            log.forEach(line => {\r\n                var time = new Date(line.substring(0, line.indexOf('b')));\r\n                var message = line.substring(line.indexOf(']') + 2);\r\n\r\n                if (time < last) {\r\n                    return;\r\n                }\r\n\r\n                if (message.startsWith(`${worldName} - Player Connected `)) {\r\n                    var parts = line.substr(line.indexOf(' - Player Connected ') + 20); //NAME | IP | ID\r\n                    parts = parts.substr(0, parts.lastIndexOf(' | ')); //NAME | IP\r\n                    var name = parts.substr(0, parts.lastIndexOf(' | '));\r\n                    var ip = parts.substr(name.length + 3);\r\n\r\n                    if (world.players[name]) {\r\n                        world.players[name].joins++;\r\n                        if (!world.players[name].ips.includes(ip)) {\r\n                            world.players[name].ips.push(ip);\r\n                        }\r\n                    } else {\r\n                        world.players[name] = {joins: 1, ips: [ip]};\r\n                    }\r\n                    world.players[name].ip = ip;\r\n                }\r\n            });\r\n        })\r\n        .then(() => storage.set('mb_players', world.players))\r\n        .catch(bhfansapi.reportError);\r\n\r\n    //Handle default / missing preferences\r\n    (function(prefs) {\r\n        function checkPref(type, name, selector, defval) {\r\n            if (typeof prefs[name] != type) {\r\n                prefs[name] = defval;\r\n            }\r\n\r\n            if (type == 'boolean') {\r\n                document.querySelector(selector).checked = prefs[name] ? 'checked' : '';\r\n            } else {\r\n                document.querySelector(selector).value = prefs[name];\r\n            }\r\n\r\n        }\r\n\r\n        checkPref('number', 'announcementDelay', '#mb_ann_delay', 10);\r\n        checkPref('number', 'maxResponses', '#mb_resp_max', 2);\r\n        checkPref('boolean', 'regexTriggers', '#mb_regex_triggers', false);\r\n        checkPref('boolean', 'disableTrim', '#mb_disable_trim', false);\r\n        checkPref('boolean', 'notify', '#mb_notify_message', true);\r\n    }(bot.preferences));\r\n\r\n    //Add the configured messages to the page.\r\n    (function(msgs, ids, tids) {\r\n        msgs.forEach((type, index) => {\r\n            messages[type].forEach((msg) => {\r\n                ui.addMsg(`#${tids[index]}`, `#${ids[index]}`, msg);\r\n            });\r\n        });\r\n    }(\r\n        ['join', 'leave', 'trigger', 'announcement'],\r\n        ['jMsgs', 'lMsgs', 'tMsgs', 'aMsgs'],\r\n        ['jlTemplate', 'jlTemplate', 'tTemplate', 'aTemplate']\r\n    ));\r\n\r\n    // Sends announcements after the specified delay.\r\n    (function announcementCheck(i) {\r\n        i = (i >= messages.announcement.length) ? 0 : i;\r\n\r\n        var ann = messages.announcement[i];\r\n\r\n        if (ann && ann.message) {\r\n            bot.send(ann.message);\r\n        }\r\n        setTimeout(announcementCheck, bot.preferences.announcementDelay * 60000, i + 1);\r\n    })(0);\r\n\r\n    //Add messages to page\r\n    hook.listen('world.other', function(message) {\r\n        ui.addMessageToConsole(message, undefined, 'other');\r\n    });\r\n    hook.listen('world.message', function(name, message) {\r\n        let msgClass = 'player';\r\n        if (bot.checkGroup('staff', name)) {\r\n            msgClass = 'staff';\r\n            if (bot.checkGroup('mod', name)) {\r\n                msgClass += ' mod';\r\n            } else {\r\n                //Has to be admin\r\n                msgClass += ' admin';\r\n            }\r\n        }\r\n        if (message.startsWith('/')) {\r\n            msgClass += ' command';\r\n        }\r\n        ui.addMessageToConsole(message, name, msgClass);\r\n    });\r\n    hook.listen('world.serverchat', function(message) {\r\n        ui.addMessageToConsole(message, 'SERVER', 'admin');\r\n    });\r\n    hook.listen('world.send', function(message) {\r\n        if (message.startsWith('/')) {\r\n            ui.addMessageToConsole(message, 'SERVER', 'admin command');\r\n        }\r\n    });\r\n\r\n    //Message handlers\r\n    hook.listen('world.join', function handlePlayerJoin(name, ip) {\r\n        //Add / update lists\r\n        if (world.players.hasOwnProperty(name)) {\r\n            //Returning player\r\n            world.players[name].joins++;\r\n            if (!world.players[name].ips.includes(ip)) {\r\n                world.players[name].ips.push(ip);\r\n            }\r\n        } else {\r\n            //New player\r\n            world.players[name] = {joins: 1, ips: [ip]};\r\n        }\r\n        world.players[name].ip = ip;\r\n\r\n        storage.set('mb_players', world.players);\r\n\r\n        if (!world.online.includes(name)) {\r\n            world.online.push(name);\r\n        }\r\n\r\n        ui.addMessageToConsole(`${name} (${ip}) has joined the server`, 'SERVER', 'join world admin');\r\n    });\r\n    hook.listen('world.leave', function handlePlayerLeave(name) {\r\n        if (world.online.includes(name)) {\r\n            world.online.splice(world.online.indexOf(name), 1);\r\n        }\r\n\r\n        ui.addMessageToConsole(`${name} has left the server`, 'SERVER', `leave world admin`);\r\n    });\r\n\r\n    //Update the staff lists if needed\r\n    hook.listen('world.command', function(name, command, target) {\r\n        target = target.toLocaleUpperCase();\r\n        command = command.toLocaleLowerCase();\r\n\r\n        if (!bot.checkGroup('admin', name)) {\r\n            return;\r\n        }\r\n\r\n        var lists = world.lists;\r\n        if (['admin', 'unadmin', 'mod', 'unmod'].includes(command)) {\r\n            if (command.startsWith('un')) {\r\n                command = command.substr(2);\r\n                if (lists[command].includes(target)) {\r\n                    lists[command].splice(lists[command].indexOf(target), 1);\r\n                }\r\n            } else {\r\n                if (!lists[command].includes(target)) {\r\n                    lists[command].push(target);\r\n                }\r\n            }\r\n\r\n            //Rebuild the staff lists\r\n            lists.mod = lists.mod.filter((name) => lists.admin.indexOf(name) < 0);\r\n            lists.staff = lists.admin.concat(lists.mod);\r\n        }\r\n\r\n        if (['whitelist', 'unwhitelist'].includes(command)) {\r\n            if (command.startsWith('un')) {\r\n                if (lists.white.includes(target)) {\r\n                    lists.white.splice(lists.white.indexOf(target), 1);\r\n                }\r\n            } else {\r\n                if (!lists.white.includes(target)) {\r\n                    lists.white.push(target);\r\n                }\r\n            }\r\n        }\r\n\r\n        if (['ban', 'unban'].includes(command)) {\r\n            //FIXME: Support needed for device IDs.\r\n            if (command.startsWith('un')) {\r\n                if (lists.black.includes(target)) {\r\n                    lists.black.splice(lists.black.indexOf(target), 1);\r\n                }\r\n            } else {\r\n                if (!lists.black.includes(target)) {\r\n                    lists.black.push(target);\r\n                }\r\n            }\r\n        }\r\n    });\r\n\r\n    //Handle changed messages\r\n    hook.listen('ui.messageChanged', saveConfig);\r\n    hook.listen('ui.messageDeleted', saveConfig);\r\n    function saveConfig() {\r\n        function saveFromWrapper(id, to, key) {\r\n            to.length = 0;\r\n\r\n            var wrappers = document.getElementById(id).children;\r\n            var selects,\r\n                joinCounts,\r\n                tmpMsgObj = {};\r\n            for (var i = 0; i < wrappers.length; i++) {\r\n                tmpMsgObj.message = wrappers[i].querySelector('.m').value;\r\n                if (id != 'aMsgs') {\r\n                    selects = wrappers[i].querySelectorAll('select');\r\n                    joinCounts = wrappers[i].querySelectorAll('input[type=\"number\"]');\r\n                    tmpMsgObj.group = selects[0].value;\r\n                    tmpMsgObj.not_group = selects[1].value;\r\n                    tmpMsgObj.joins_low = joinCounts[0].value;\r\n                    tmpMsgObj.joins_high = joinCounts[1].value;\r\n                }\r\n                if (id == 'tMsgs') {\r\n                    if (bot.preferences.disableTrim) {\r\n                        tmpMsgObj.trigger = wrappers[i].querySelector('.t').value;\r\n                    } else {\r\n                        tmpMsgObj.trigger = wrappers[i].querySelector('.t').value.trim();\r\n                    }\r\n                }\r\n                to.push(tmpMsgObj);\r\n                tmpMsgObj = {};\r\n            }\r\n\r\n            storage.set(key, to);\r\n        }\r\n\r\n        saveFromWrapper('lMsgs', messages.leave, 'leaveArr');\r\n        saveFromWrapper('jMsgs', messages.join, 'joinArr');\r\n        saveFromWrapper('tMsgs', messages.trigger, 'triggerArr');\r\n        saveFromWrapper('aMsgs', messages.announcement, 'announcementArr');\r\n\r\n        storage.set('mb_version', bot.version, false);\r\n    }\r\n\r\n    //Handle user messages\r\n    function userSend(message) {\r\n        var input = document.querySelector('#mb_console input');\r\n        var button = document.querySelector('#mb_console button');\r\n        button.textContent = 'SEND';\r\n        [input, button].forEach((el) => el.disabled = true);\r\n\r\n        message = hook.update('bot.send', message);\r\n\r\n        // Don't add user messages to the buffer.\r\n        api.send(message)\r\n            .then((response) => {\r\n                if (response.status == 'ok') {\r\n                    input.value = '';\r\n\r\n                } else {\r\n                    button.textContent = 'RETRY';\r\n                    throw new Error(JSON.stringify(response));\r\n                }\r\n            })\r\n            .catch(() => { /* Nothing */ })\r\n            .then(() => {\r\n                [input, button].forEach((el) => el.disabled = false);\r\n                if (document.querySelector('#mb_console.visible')) {\r\n                    input.focus();\r\n                }\r\n            });\r\n    }\r\n\r\n    //Listen for user to send message\r\n    document.querySelector('#mb_console input').addEventListener('keydown', function(event) {\r\n        if (event.key == \"Enter\" || event.keyCode == 13) {\r\n            event.preventDefault();\r\n            userSend(event.target.value);\r\n        }\r\n    });\r\n    document.querySelector('#mb_console button').addEventListener('click', function() {\r\n        userSend(document.querySelector('#mb_console input').value);\r\n    });\r\n\r\n    hook.listen('ui.prefChanged', function savePrefs() {\r\n        var getValue = (selector) => document.querySelector(selector).value;\r\n        var getChecked = (selector) => document.querySelector(selector).checked;\r\n\r\n        var prefs = bot.preferences;\r\n        prefs.announcementDelay = +getValue('#mb_ann_delay');\r\n        prefs.maxResponses = +getValue('#mb_resp_max');\r\n        prefs.regexTriggers = getChecked('#mb_regex_triggers');\r\n        prefs.disableTrim = getChecked('#mb_disable_trim');\r\n        prefs.notify = getChecked('#mb_notify_message');\r\n\r\n        storage.set('mb_preferences', prefs, false);\r\n    });\r\n\r\n    //Handle user defined messages.\r\n    (function() {\r\n        var sendOK = false;\r\n        setTimeout(function waitForMessages() {\r\n            //Wait for a while before responding to triggers, avoids massive bot spams\r\n            sendOK = true;\r\n        }, 10000);\r\n\r\n        function checkJoinsAndGroup(message, name) {\r\n            if (!sendOK) {\r\n                return false;\r\n            }\r\n\r\n            if (!world.players.hasOwnProperty(name)) {\r\n                return false;\r\n            }\r\n\r\n            var current = world.players[name].joins;\r\n\r\n            var joinsOK = message.joins_low <= current && message.joins_high >= current;\r\n            var groupOK = bot.checkGroup(message.group, name) && !bot.checkGroup(message.not_group, name);\r\n\r\n            return joinsOK && groupOK;\r\n        }\r\n\r\n        function buildMessage(message, name) {\r\n            message = message.replace(/{{NAME}}/g, name)\r\n                .replace(/{{Name}}/g, name[0] + name.substring(1).toLocaleLowerCase())\r\n                .replace(/{{name}}/g, name.toLocaleLowerCase());\r\n\r\n            if (message.startsWith('/')) {\r\n                message = message.replace(/{{ip}}/gi, world.players[name].ip);\r\n            }\r\n\r\n            return message;\r\n        }\r\n\r\n        hook.listen('world.join', function onJoin(name) {\r\n            messages.join.forEach((msg) => {\r\n                if (checkJoinsAndGroup(msg, name)) {\r\n                    bot.send(buildMessage(msg.message, name));\r\n                }\r\n            });\r\n        });\r\n\r\n        hook.listen('world.leave', function onLeave(name) {\r\n            messages.leave.forEach((msg) => {\r\n                if (checkJoinsAndGroup(msg, name)) {\r\n                    bot.send(buildMessage(msg.message, name));\r\n                }\r\n            });\r\n        });\r\n\r\n        hook.listen('world.message', function onTrigger(name, message) {\r\n            function triggerMatch(trigger, message) {\r\n                if (bot.preferences.regexTriggers) {\r\n                    try {\r\n                        return new RegExp(trigger, 'i').test(message);\r\n                    } catch (e) {\r\n                        ui.notify(`Skipping trigger '${trigger}' as the RegEx is invaild.`);\r\n                        return false;\r\n                    }\r\n                }\r\n                return new RegExp(\r\n                    trigger\r\n                        .replace(/([.+?^=!:${}()|\\[\\]\\/\\\\])/g, \"\\\\$1\")\r\n                        .replace(/\\*/g, \".*\"),\r\n                        'i'\r\n                    ).test(message);\r\n            }\r\n\r\n            var totalAllowed = bot.preferences.maxResponses;\r\n            messages.trigger.forEach((msg) => {\r\n                if (checkJoinsAndGroup(msg, name) && triggerMatch(msg.trigger, message) && totalAllowed) {\r\n                    bot.send(buildMessage(msg.message, name));\r\n                    totalAllowed--;\r\n                }\r\n            });\r\n        });\r\n\r\n        hook.listen('bot.usersend', function handleWhitespace(message) {\r\n            return message.replace(/\\\\n/g, '\\n').replace(/\\\\t/g, '\\t');\r\n        });\r\n\r\n        hook.listen('world.message', function chatNotifications(name, message) {\r\n            if (bot.preferences.notify && document.querySelector('#mb_console.visible') === null) {\r\n                bot.ui.notify(`${name}: ${message}`);\r\n            }\r\n        });\r\n    }());\r\n\r\n    /**\r\n     * Function used to check if users are in defined groups.\r\n     *\r\n     * @param string group the group to check\r\n     * @param string name the name of the user to check\r\n     * @return boolean\r\n     */\r\n    bot.checkGroup = function checkGroup(group, name) {\r\n        name = name.toLocaleUpperCase();\r\n        switch (group.toLocaleLowerCase()) {\r\n            case 'all':\r\n                return true;\r\n            case 'admin':\r\n                return world.lists.admin.includes(name);\r\n            case 'mod':\r\n                return world.lists.mod.includes(name);\r\n            case 'staff':\r\n                return world.lists.staff.includes(name);\r\n            case 'owner':\r\n                return world.owner == name;\r\n            default:\r\n                return false;\r\n        }\r\n    };\r\n\r\n    return bot;\r\n}\r\n";
"var bot = require('./MessageBot');\r\nvar ui = require('./ui');\r\nvar storage = require('./libs/storage');\r\nvar ajax = require('./libs/ajax');\r\nvar api = require('./libs/blockheads');\r\nvar hook = require('./libs/hook');\r\n\r\nconst STORAGE_ID = 'mb_extensions';\r\n\r\n/**\r\n * Used to create a new extension.\r\n *\r\n * @example\r\n * var test = MessageBotExtension('test');\r\n * @param {string} namespace - Should be the same as your variable name.\r\n * @return {MessageBotExtension} - The extension variable.\r\n */\r\nfunction MessageBotExtension(namespace) {\r\n    hook.fire('extension.installed', namespace);\r\n\r\n    var extension = {\r\n        id: namespace,\r\n        bot,\r\n        ui,\r\n        storage,\r\n        ajax,\r\n        api,\r\n        hook,\r\n    };\r\n\r\n    /**\r\n     * Used to change whether or not the extension will be\r\n     * Automatically loaded the next time the bot is launched.\r\n     *\r\n     * @example\r\n     * var test = MessageBotExtension('test');\r\n     * test.setAutoLaunch(true);\r\n     * @param {bool} shouldAutoload\r\n     */\r\n    extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {\r\n        if (!autoload.includes(namespace) && shouldAutoload) {\r\n            autoload.push(namespace);\r\n            storage.set(STORAGE_ID, autoload, false);\r\n        } else if (!shouldAutoload) {\r\n            if (autoload.includes(namespace)) {\r\n                autoload.splice(autoload.indexOf(namespace), 1);\r\n                storage.set(STORAGE_ID, autoload, false);\r\n            }\r\n        }\r\n    };\r\n\r\n    return extension;\r\n}\r\n\r\n/**\r\n * Tries to load the requested extension by ID.\r\n *\r\n * @param {string} id\r\n */\r\nMessageBotExtension.install = function install(id) {\r\n    var el = document.createElement('script');\r\n    el.src = `//blockheadsfans.com/messagebot/extension/${id}/code/raw`;\r\n    el.crossOrigin = 'anonymous';\r\n    document.head.appendChild(el);\r\n};\r\n\r\n/**\r\n * Uninstalls an extension.\r\n *\r\n * @param {string} id\r\n */\r\nMessageBotExtension.uninstall = function uninstall(id) {\r\n    try {\r\n        window[id].uninstall();\r\n    } catch (e) {\r\n        //Not installed, or no uninstall function.\r\n    }\r\n\r\n    window[id] = undefined;\r\n\r\n    if (autoload.includes(id)) {\r\n        autoload.splice(autoload.indexOf(id), 1);\r\n        storage.set(STORAGE_ID, autoload, false);\r\n    }\r\n\r\n    hook.fire('extension.uninstall', id);\r\n};\r\n\r\n// Load extensions that set themselves to autoload last launch.\r\nstorage.getObject(STORAGE_ID, [], false).forEach(MessageBotExtension.install);\r\n\r\n// Array of IDs to autolaod at the next launch.\r\nvar autoload = [];\r\n\r\nmodule.exports = MessageBotExtension;\r\n";


window.addEventListener('error', (err) => {
    if (err.message != 'Script error') {
        window.hook.check('error', err);
    }
});

},{"./libs/migration":7,"./polyfills/console":9,"./ui":13}],12:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvTWVzc2FnZUJvdC5qcyIsImRldi9NZXNzYWdlQm90RXh0ZW5zaW9uLmpzIiwiZGV2L2xpYnMvYWpheC5qcyIsImRldi9saWJzL2JoZmFuc2FwaS5qcyIsImRldi9saWJzL2Jsb2NraGVhZHMuanMiLCJkZXYvbGlicy9ob29rLmpzIiwiZGV2L2xpYnMvbWlncmF0aW9uLmpzIiwiZGV2L2xpYnMvc3RvcmFnZS5qcyIsImRldi9wb2x5ZmlsbHMvY29uc29sZS5qcyIsImRldi9wb2x5ZmlsbHMvZGV0YWlscy5qcyIsImRldi9zdGFydC5qcyIsImRldi91aS9leHBvcnRzL2luZGV4LmpzIiwiZGV2L3VpL2luZGV4LmpzIiwiZGV2L3VpL2xpc3RlbmVycy5qcyIsImRldi91aS9wYWdlL2V4dGVuc2lvbnMuanMiLCJkZXYvdWkvcGFnZS9pbmRleC5qcyIsImRldi91aS9wYWdlL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImZ1bmN0aW9uIE1lc3NhZ2VCb3QoYWpheCwgaG9vaywgc3RvcmFnZSwgYmhmYW5zYXBpLCBhcGksIHVpKSB7IC8vanNoaW50IGlnbm9yZTpsaW5lXHJcbiAgICAvL0hlbHBzIGF2b2lkIG1lc3NhZ2VzIHRoYXQgYXJlIHRhY2tlZCBvbnRvIHRoZSBlbmQgb2Ygb3RoZXIgbWVzc2FnZXMuXHJcbiAgICB2YXIgY2hhdEJ1ZmZlciA9IFtdO1xyXG4gICAgKGZ1bmN0aW9uIGNoZWNrQnVmZmVyKCkge1xyXG4gICAgICAgIGlmIChjaGF0QnVmZmVyLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBhcGkuc2VuZChjaGF0QnVmZmVyLnNoaWZ0KCkpXHJcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiBzZXRUaW1lb3V0KGNoZWNrQnVmZmVyLCA1MDApKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrQnVmZmVyLCA1MDApO1xyXG4gICAgICAgIH1cclxuICAgIH0oKSk7XHJcblxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICBiaGZhbnNhcGkubGlzdEV4dGVuc2lvbnMoKTtcclxuICAgICAgICBob29rLmxpc3RlbignZXJyb3InLCBiaGZhbnNhcGkucmVwb3J0RXJyb3IpO1xyXG4gICAgICAgIHN0b3JhZ2UuZ2V0T2JqZWN0KCdtYl9leHRlbnNpb25zJywgW10sIGZhbHNlKS5mb3JFYWNoKGJoZmFuc2FwaS5zdGFydEV4dGVuc2lvbik7XHJcbiAgICB9LCAxMDAwKTtcclxuXHJcbiAgICB2YXIgYm90ID0ge1xyXG4gICAgICAgIHZlcnNpb246ICc2LjAuNicsXHJcbiAgICAgICAgdWk6IHVpLFxyXG4gICAgICAgIGFwaTogYXBpLFxyXG4gICAgICAgIGhvb2s6IGhvb2ssXHJcbiAgICAgICAgc3RvcmFnZTogc3RvcmFnZSxcclxuICAgICAgICBwcmVmZXJlbmNlczogc3RvcmFnZS5nZXRPYmplY3QoJ21iX3ByZWZlcmVuY2VzJywge30sIGZhbHNlKSxcclxuICAgIH07XHJcbiAgICBzdG9yYWdlLnNldCgnbWJfdmVyc2lvbicsIGJvdC52ZXJzaW9uLCBmYWxzZSk7XHJcblxyXG4gICAgYm90LnNlbmQgPSBmdW5jdGlvbiBzZW5kKG1lc3NhZ2UpIHtcclxuICAgICAgICBjaGF0QnVmZmVyLnB1c2goaG9vay51cGRhdGUoJ2JvdC5zZW5kJywgbWVzc2FnZSkpO1xyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgd29ybGQgPSB7XHJcbiAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgb25saW5lOiBbXSxcclxuICAgICAgICBvd25lcjogJycsXHJcbiAgICAgICAgcGxheWVyczogc3RvcmFnZS5nZXRPYmplY3QoJ21iX3BsYXllcnMnLCB7fSksXHJcbiAgICAgICAgbGlzdHM6IHthZG1pbjogW10sIG1vZDogW10sIHN0YWZmOiBbXSwgYmxhY2s6IFtdLCB3aGl0ZTogW119LFxyXG4gICAgfTtcclxuICAgIGJvdC53b3JsZCA9IHdvcmxkO1xyXG5cclxuICAgIHZhciBtZXNzYWdlcyA9IHtcclxuICAgICAgICBhbm5vdW5jZW1lbnQ6IHN0b3JhZ2UuZ2V0T2JqZWN0KCdhbm5vdW5jZW1lbnRBcnInLCBbXSksXHJcbiAgICAgICAgdHJpZ2dlcjogc3RvcmFnZS5nZXRPYmplY3QoJ3RyaWdnZXJBcnInLCBbXSksXHJcbiAgICAgICAgam9pbjogc3RvcmFnZS5nZXRPYmplY3QoJ2pvaW5BcnInLCBbXSksXHJcbiAgICAgICAgbGVhdmU6IHN0b3JhZ2UuZ2V0T2JqZWN0KCdsZWF2ZUFycicsIFtdKSxcclxuICAgIH07XHJcblxyXG4gICAgLy9VcGRhdGUgdGhlIHdvcmxkIG9iamVjdC5cclxuICAgIFByb21pc2UuYWxsKFthcGkuZ2V0TGlzdHMoKSwgYXBpLmdldFdvcmxkTmFtZSgpLCBhcGkuZ2V0T3duZXJOYW1lKCldKVxyXG4gICAgICAgIC50aGVuKCh2YWx1ZXMpID0+IHtcclxuICAgICAgICAgICAgdmFyIFtsaXN0cywgd29ybGROYW1lLCBvd25lcl0gPSB2YWx1ZXM7XHJcblxyXG4gICAgICAgICAgICAvL1JlbW92ZSB0aGUgb3duZXIgJiBTRVJWRVIgZnJvbSB0aGUgbW9kIGxpc3RzIGFuZCBhZGQgdG8gYWRtaW4gLyBzdGFmZiBsaXN0cy5cclxuICAgICAgICAgICAgW293bmVyLCAnU0VSVkVSJ10uZm9yRWFjaChuYW1lID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghbGlzdHMuYWRtaW4uaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBsaXN0cy5hZG1pbi5wdXNoKG5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCFsaXN0cy5zdGFmZi5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RzLnN0YWZmLnB1c2gobmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobGlzdHMubW9kLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdHMubW9kLnNwbGljZShsaXN0cy5tb2QuaW5kZXhPZihuYW1lKSwgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgd29ybGQubGlzdHMgPSBsaXN0cztcclxuICAgICAgICAgICAgd29ybGQubmFtZSA9IHdvcmxkTmFtZTtcclxuICAgICAgICAgICAgd29ybGQub3duZXIgPSBvd25lcjtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChiaGZhbnNhcGkucmVwb3J0RXJyb3IpO1xyXG5cclxuICAgIC8vVXBkYXRlIHRoZSBwbGF5ZXJzIG9iamVjdFxyXG4gICAgUHJvbWlzZS5hbGwoW2FwaS5nZXRMb2dzKCksIGFwaS5nZXRXb3JsZE5hbWUoKV0pXHJcbiAgICAgICAgLnRoZW4oKHZhbHVlcykgPT4ge1xyXG4gICAgICAgICAgICB2YXIgW2xvZywgd29ybGROYW1lXSA9IHZhbHVlcztcclxuICAgICAgICAgICAgdmFyIGxhc3QgPSBzdG9yYWdlLmdldE9iamVjdCgnbWJfbGFzdExvZ0xvYWQnLCAwKTtcclxuICAgICAgICAgICAgc3RvcmFnZS5zZXQoJ21iX2xhc3RMb2dMb2FkJywgTWF0aC5mbG9vcihEYXRlLm5vdygpLnZhbHVlT2YoKSkpO1xyXG5cclxuICAgICAgICAgICAgbG9nLmZvckVhY2gobGluZSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGltZSA9IG5ldyBEYXRlKGxpbmUuc3Vic3RyaW5nKDAsIGxpbmUuaW5kZXhPZignYicpKSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZSA9IGxpbmUuc3Vic3RyaW5nKGxpbmUuaW5kZXhPZignXScpICsgMik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRpbWUgPCBsYXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoYCR7d29ybGROYW1lfSAtIFBsYXllciBDb25uZWN0ZWQgYCkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFydHMgPSBsaW5lLnN1YnN0cihsaW5lLmluZGV4T2YoJyAtIFBsYXllciBDb25uZWN0ZWQgJykgKyAyMCk7IC8vTkFNRSB8IElQIHwgSURcclxuICAgICAgICAgICAgICAgICAgICBwYXJ0cyA9IHBhcnRzLnN1YnN0cigwLCBwYXJ0cy5sYXN0SW5kZXhPZignIHwgJykpOyAvL05BTUUgfCBJUFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lID0gcGFydHMuc3Vic3RyKDAsIHBhcnRzLmxhc3RJbmRleE9mKCcgfCAnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlwID0gcGFydHMuc3Vic3RyKG5hbWUubGVuZ3RoICsgMyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3b3JsZC5wbGF5ZXJzW25hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uam9pbnMrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF3b3JsZC5wbGF5ZXJzW25hbWVdLmlwcy5pbmNsdWRlcyhpcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uaXBzLnB1c2goaXApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXSA9IHtqb2luczogMSwgaXBzOiBbaXBdfTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgd29ybGQucGxheWVyc1tuYW1lXS5pcCA9IGlwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKCgpID0+IHN0b3JhZ2Uuc2V0KCdtYl9wbGF5ZXJzJywgd29ybGQucGxheWVycykpXHJcbiAgICAgICAgLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcik7XHJcblxyXG4gICAgLy9IYW5kbGUgZGVmYXVsdCAvIG1pc3NpbmcgcHJlZmVyZW5jZXNcclxuICAgIChmdW5jdGlvbihwcmVmcykge1xyXG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrUHJlZih0eXBlLCBuYW1lLCBzZWxlY3RvciwgZGVmdmFsKSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcHJlZnNbbmFtZV0gIT0gdHlwZSkge1xyXG4gICAgICAgICAgICAgICAgcHJlZnNbbmFtZV0gPSBkZWZ2YWw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlID09ICdib29sZWFuJykge1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcikuY2hlY2tlZCA9IHByZWZzW25hbWVdID8gJ2NoZWNrZWQnIDogJyc7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKS52YWx1ZSA9IHByZWZzW25hbWVdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2hlY2tQcmVmKCdudW1iZXInLCAnYW5ub3VuY2VtZW50RGVsYXknLCAnI21iX2Fubl9kZWxheScsIDEwKTtcclxuICAgICAgICBjaGVja1ByZWYoJ251bWJlcicsICdtYXhSZXNwb25zZXMnLCAnI21iX3Jlc3BfbWF4JywgMik7XHJcbiAgICAgICAgY2hlY2tQcmVmKCdib29sZWFuJywgJ3JlZ2V4VHJpZ2dlcnMnLCAnI21iX3JlZ2V4X3RyaWdnZXJzJywgZmFsc2UpO1xyXG4gICAgICAgIGNoZWNrUHJlZignYm9vbGVhbicsICdkaXNhYmxlVHJpbScsICcjbWJfZGlzYWJsZV90cmltJywgZmFsc2UpO1xyXG4gICAgICAgIGNoZWNrUHJlZignYm9vbGVhbicsICdub3RpZnknLCAnI21iX25vdGlmeV9tZXNzYWdlJywgdHJ1ZSk7XHJcbiAgICB9KGJvdC5wcmVmZXJlbmNlcykpO1xyXG5cclxuICAgIC8vQWRkIHRoZSBjb25maWd1cmVkIG1lc3NhZ2VzIHRvIHRoZSBwYWdlLlxyXG4gICAgKGZ1bmN0aW9uKG1zZ3MsIGlkcywgdGlkcykge1xyXG4gICAgICAgIG1zZ3MuZm9yRWFjaCgodHlwZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgbWVzc2FnZXNbdHlwZV0uZm9yRWFjaCgobXNnKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB1aS5hZGRNc2coYCMke3RpZHNbaW5kZXhdfWAsIGAjJHtpZHNbaW5kZXhdfWAsIG1zZyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfShcclxuICAgICAgICBbJ2pvaW4nLCAnbGVhdmUnLCAndHJpZ2dlcicsICdhbm5vdW5jZW1lbnQnXSxcclxuICAgICAgICBbJ2pNc2dzJywgJ2xNc2dzJywgJ3RNc2dzJywgJ2FNc2dzJ10sXHJcbiAgICAgICAgWydqbFRlbXBsYXRlJywgJ2psVGVtcGxhdGUnLCAndFRlbXBsYXRlJywgJ2FUZW1wbGF0ZSddXHJcbiAgICApKTtcclxuXHJcbiAgICAvLyBTZW5kcyBhbm5vdW5jZW1lbnRzIGFmdGVyIHRoZSBzcGVjaWZpZWQgZGVsYXkuXHJcbiAgICAoZnVuY3Rpb24gYW5ub3VuY2VtZW50Q2hlY2soaSkge1xyXG4gICAgICAgIGkgPSAoaSA+PSBtZXNzYWdlcy5hbm5vdW5jZW1lbnQubGVuZ3RoKSA/IDAgOiBpO1xyXG5cclxuICAgICAgICB2YXIgYW5uID0gbWVzc2FnZXMuYW5ub3VuY2VtZW50W2ldO1xyXG5cclxuICAgICAgICBpZiAoYW5uICYmIGFubi5tZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIGJvdC5zZW5kKGFubi5tZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgc2V0VGltZW91dChhbm5vdW5jZW1lbnRDaGVjaywgYm90LnByZWZlcmVuY2VzLmFubm91bmNlbWVudERlbGF5ICogNjAwMDAsIGkgKyAxKTtcclxuICAgIH0pKDApO1xyXG5cclxuICAgIC8vQWRkIG1lc3NhZ2VzIHRvIHBhZ2VcclxuICAgIGhvb2subGlzdGVuKCd3b3JsZC5vdGhlcicsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgICAgICB1aS5hZGRNZXNzYWdlVG9Db25zb2xlKG1lc3NhZ2UsIHVuZGVmaW5lZCwgJ290aGVyJyk7XHJcbiAgICB9KTtcclxuICAgIGhvb2subGlzdGVuKCd3b3JsZC5tZXNzYWdlJywgZnVuY3Rpb24obmFtZSwgbWVzc2FnZSkge1xyXG4gICAgICAgIGxldCBtc2dDbGFzcyA9ICdwbGF5ZXInO1xyXG4gICAgICAgIGlmIChib3QuY2hlY2tHcm91cCgnc3RhZmYnLCBuYW1lKSkge1xyXG4gICAgICAgICAgICBtc2dDbGFzcyA9ICdzdGFmZic7XHJcbiAgICAgICAgICAgIGlmIChib3QuY2hlY2tHcm91cCgnbW9kJywgbmFtZSkpIHtcclxuICAgICAgICAgICAgICAgIG1zZ0NsYXNzICs9ICcgbW9kJztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vSGFzIHRvIGJlIGFkbWluXHJcbiAgICAgICAgICAgICAgICBtc2dDbGFzcyArPSAnIGFkbWluJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykpIHtcclxuICAgICAgICAgICAgbXNnQ2xhc3MgKz0gJyBjb21tYW5kJztcclxuICAgICAgICB9XHJcbiAgICAgICAgdWkuYWRkTWVzc2FnZVRvQ29uc29sZShtZXNzYWdlLCBuYW1lLCBtc2dDbGFzcyk7XHJcbiAgICB9KTtcclxuICAgIGhvb2subGlzdGVuKCd3b3JsZC5zZXJ2ZXJjaGF0JywgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgICAgIHVpLmFkZE1lc3NhZ2VUb0NvbnNvbGUobWVzc2FnZSwgJ1NFUlZFUicsICdhZG1pbicpO1xyXG4gICAgfSk7XHJcbiAgICBob29rLmxpc3Rlbignd29ybGQuc2VuZCcsIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcclxuICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykpIHtcclxuICAgICAgICAgICAgdWkuYWRkTWVzc2FnZVRvQ29uc29sZShtZXNzYWdlLCAnU0VSVkVSJywgJ2FkbWluIGNvbW1hbmQnKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvL01lc3NhZ2UgaGFuZGxlcnNcclxuICAgIGhvb2subGlzdGVuKCd3b3JsZC5qb2luJywgZnVuY3Rpb24gaGFuZGxlUGxheWVySm9pbihuYW1lLCBpcCkge1xyXG4gICAgICAgIC8vQWRkIC8gdXBkYXRlIGxpc3RzXHJcbiAgICAgICAgaWYgKHdvcmxkLnBsYXllcnMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcclxuICAgICAgICAgICAgLy9SZXR1cm5pbmcgcGxheWVyXHJcbiAgICAgICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uam9pbnMrKztcclxuICAgICAgICAgICAgaWYgKCF3b3JsZC5wbGF5ZXJzW25hbWVdLmlwcy5pbmNsdWRlcyhpcCkpIHtcclxuICAgICAgICAgICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uaXBzLnB1c2goaXApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy9OZXcgcGxheWVyXHJcbiAgICAgICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0gPSB7am9pbnM6IDEsIGlwczogW2lwXX07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdvcmxkLnBsYXllcnNbbmFtZV0uaXAgPSBpcDtcclxuXHJcbiAgICAgICAgc3RvcmFnZS5zZXQoJ21iX3BsYXllcnMnLCB3b3JsZC5wbGF5ZXJzKTtcclxuXHJcbiAgICAgICAgaWYgKCF3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICAgICAgd29ybGQub25saW5lLnB1c2gobmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB1aS5hZGRNZXNzYWdlVG9Db25zb2xlKGAke25hbWV9ICgke2lwfSkgaGFzIGpvaW5lZCB0aGUgc2VydmVyYCwgJ1NFUlZFUicsICdqb2luIHdvcmxkIGFkbWluJyk7XHJcbiAgICB9KTtcclxuICAgIGhvb2subGlzdGVuKCd3b3JsZC5sZWF2ZScsIGZ1bmN0aW9uIGhhbmRsZVBsYXllckxlYXZlKG5hbWUpIHtcclxuICAgICAgICBpZiAod29ybGQub25saW5lLmluY2x1ZGVzKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIHdvcmxkLm9ubGluZS5zcGxpY2Uod29ybGQub25saW5lLmluZGV4T2YobmFtZSksIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdWkuYWRkTWVzc2FnZVRvQ29uc29sZShgJHtuYW1lfSBoYXMgbGVmdCB0aGUgc2VydmVyYCwgJ1NFUlZFUicsIGBsZWF2ZSB3b3JsZCBhZG1pbmApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy9VcGRhdGUgdGhlIHN0YWZmIGxpc3RzIGlmIG5lZWRlZFxyXG4gICAgaG9vay5saXN0ZW4oJ3dvcmxkLmNvbW1hbmQnLCBmdW5jdGlvbihuYW1lLCBjb21tYW5kLCB0YXJnZXQpIHtcclxuICAgICAgICB0YXJnZXQgPSB0YXJnZXQudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgICAgICBjb21tYW5kID0gY29tbWFuZC50b0xvY2FsZUxvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICBpZiAoIWJvdC5jaGVja0dyb3VwKCdhZG1pbicsIG5hbWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBsaXN0cyA9IHdvcmxkLmxpc3RzO1xyXG4gICAgICAgIGlmIChbJ2FkbWluJywgJ3VuYWRtaW4nLCAnbW9kJywgJ3VubW9kJ10uaW5jbHVkZXMoY29tbWFuZCkpIHtcclxuICAgICAgICAgICAgaWYgKGNvbW1hbmQuc3RhcnRzV2l0aCgndW4nKSkge1xyXG4gICAgICAgICAgICAgICAgY29tbWFuZCA9IGNvbW1hbmQuc3Vic3RyKDIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpc3RzW2NvbW1hbmRdLmluY2x1ZGVzKHRhcmdldCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBsaXN0c1tjb21tYW5kXS5zcGxpY2UobGlzdHNbY29tbWFuZF0uaW5kZXhPZih0YXJnZXQpLCAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmICghbGlzdHNbY29tbWFuZF0uaW5jbHVkZXModGFyZ2V0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RzW2NvbW1hbmRdLnB1c2godGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9SZWJ1aWxkIHRoZSBzdGFmZiBsaXN0c1xyXG4gICAgICAgICAgICBsaXN0cy5tb2QgPSBsaXN0cy5tb2QuZmlsdGVyKChuYW1lKSA9PiBsaXN0cy5hZG1pbi5pbmRleE9mKG5hbWUpIDwgMCk7XHJcbiAgICAgICAgICAgIGxpc3RzLnN0YWZmID0gbGlzdHMuYWRtaW4uY29uY2F0KGxpc3RzLm1vZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoWyd3aGl0ZWxpc3QnLCAndW53aGl0ZWxpc3QnXS5pbmNsdWRlcyhjb21tYW5kKSkge1xyXG4gICAgICAgICAgICBpZiAoY29tbWFuZC5zdGFydHNXaXRoKCd1bicpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobGlzdHMud2hpdGUuaW5jbHVkZXModGFyZ2V0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RzLndoaXRlLnNwbGljZShsaXN0cy53aGl0ZS5pbmRleE9mKHRhcmdldCksIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFsaXN0cy53aGl0ZS5pbmNsdWRlcyh0YXJnZXQpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGlzdHMud2hpdGUucHVzaCh0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoWydiYW4nLCAndW5iYW4nXS5pbmNsdWRlcyhjb21tYW5kKSkge1xyXG4gICAgICAgICAgICAvL0ZJWE1FOiBTdXBwb3J0IG5lZWRlZCBmb3IgZGV2aWNlIElEcy5cclxuICAgICAgICAgICAgaWYgKGNvbW1hbmQuc3RhcnRzV2l0aCgndW4nKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpc3RzLmJsYWNrLmluY2x1ZGVzKHRhcmdldCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBsaXN0cy5ibGFjay5zcGxpY2UobGlzdHMuYmxhY2suaW5kZXhPZih0YXJnZXQpLCAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmICghbGlzdHMuYmxhY2suaW5jbHVkZXModGFyZ2V0KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpc3RzLmJsYWNrLnB1c2godGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vSGFuZGxlIGNoYW5nZWQgbWVzc2FnZXNcclxuICAgIGhvb2subGlzdGVuKCd1aS5tZXNzYWdlQ2hhbmdlZCcsIHNhdmVDb25maWcpO1xyXG4gICAgaG9vay5saXN0ZW4oJ3VpLm1lc3NhZ2VEZWxldGVkJywgc2F2ZUNvbmZpZyk7XHJcbiAgICBmdW5jdGlvbiBzYXZlQ29uZmlnKCkge1xyXG4gICAgICAgIGZ1bmN0aW9uIHNhdmVGcm9tV3JhcHBlcihpZCwgdG8sIGtleSkge1xyXG4gICAgICAgICAgICB0by5sZW5ndGggPSAwO1xyXG5cclxuICAgICAgICAgICAgdmFyIHdyYXBwZXJzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpLmNoaWxkcmVuO1xyXG4gICAgICAgICAgICB2YXIgc2VsZWN0cyxcclxuICAgICAgICAgICAgICAgIGpvaW5Db3VudHMsXHJcbiAgICAgICAgICAgICAgICB0bXBNc2dPYmogPSB7fTtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3cmFwcGVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdG1wTXNnT2JqLm1lc3NhZ2UgPSB3cmFwcGVyc1tpXS5xdWVyeVNlbGVjdG9yKCcubScpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGlkICE9ICdhTXNncycpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RzID0gd3JhcHBlcnNbaV0ucXVlcnlTZWxlY3RvckFsbCgnc2VsZWN0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgam9pbkNvdW50cyA9IHdyYXBwZXJzW2ldLnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0W3R5cGU9XCJudW1iZXJcIl0nKTtcclxuICAgICAgICAgICAgICAgICAgICB0bXBNc2dPYmouZ3JvdXAgPSBzZWxlY3RzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRtcE1zZ09iai5ub3RfZ3JvdXAgPSBzZWxlY3RzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRtcE1zZ09iai5qb2luc19sb3cgPSBqb2luQ291bnRzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHRtcE1zZ09iai5qb2luc19oaWdoID0gam9pbkNvdW50c1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChpZCA9PSAndE1zZ3MnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJvdC5wcmVmZXJlbmNlcy5kaXNhYmxlVHJpbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0bXBNc2dPYmoudHJpZ2dlciA9IHdyYXBwZXJzW2ldLnF1ZXJ5U2VsZWN0b3IoJy50JykudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG1wTXNnT2JqLnRyaWdnZXIgPSB3cmFwcGVyc1tpXS5xdWVyeVNlbGVjdG9yKCcudCcpLnZhbHVlLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0by5wdXNoKHRtcE1zZ09iaik7XHJcbiAgICAgICAgICAgICAgICB0bXBNc2dPYmogPSB7fTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc3RvcmFnZS5zZXQoa2V5LCB0byk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzYXZlRnJvbVdyYXBwZXIoJ2xNc2dzJywgbWVzc2FnZXMubGVhdmUsICdsZWF2ZUFycicpO1xyXG4gICAgICAgIHNhdmVGcm9tV3JhcHBlcignak1zZ3MnLCBtZXNzYWdlcy5qb2luLCAnam9pbkFycicpO1xyXG4gICAgICAgIHNhdmVGcm9tV3JhcHBlcigndE1zZ3MnLCBtZXNzYWdlcy50cmlnZ2VyLCAndHJpZ2dlckFycicpO1xyXG4gICAgICAgIHNhdmVGcm9tV3JhcHBlcignYU1zZ3MnLCBtZXNzYWdlcy5hbm5vdW5jZW1lbnQsICdhbm5vdW5jZW1lbnRBcnInKTtcclxuXHJcbiAgICAgICAgc3RvcmFnZS5zZXQoJ21iX3ZlcnNpb24nLCBib3QudmVyc2lvbiwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vSGFuZGxlIHVzZXIgbWVzc2FnZXNcclxuICAgIGZ1bmN0aW9uIHVzZXJTZW5kKG1lc3NhZ2UpIHtcclxuICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSBpbnB1dCcpO1xyXG4gICAgICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSBidXR0b24nKTtcclxuICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnU0VORCc7XHJcbiAgICAgICAgW2lucHV0LCBidXR0b25dLmZvckVhY2goKGVsKSA9PiBlbC5kaXNhYmxlZCA9IHRydWUpO1xyXG5cclxuICAgICAgICBtZXNzYWdlID0gaG9vay51cGRhdGUoJ2JvdC5zZW5kJywgbWVzc2FnZSk7XHJcblxyXG4gICAgICAgIC8vIERvbid0IGFkZCB1c2VyIG1lc3NhZ2VzIHRvIHRoZSBidWZmZXIuXHJcbiAgICAgICAgYXBpLnNlbmQobWVzc2FnZSlcclxuICAgICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09ICdvaycpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbnB1dC52YWx1ZSA9ICcnO1xyXG5cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gJ1JFVFJZJztcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmNhdGNoKCgpID0+IHsgLyogTm90aGluZyAqLyB9KVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBbaW5wdXQsIGJ1dHRvbl0uZm9yRWFjaCgoZWwpID0+IGVsLmRpc2FibGVkID0gZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlLnZpc2libGUnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlucHV0LmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vTGlzdGVuIGZvciB1c2VyIHRvIHNlbmQgbWVzc2FnZVxyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2NvbnNvbGUgaW5wdXQnKS5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBpZiAoZXZlbnQua2V5ID09IFwiRW50ZXJcIiB8fCBldmVudC5rZXlDb2RlID09IDEzKSB7XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHVzZXJTZW5kKGV2ZW50LnRhcmdldC52YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSBidXR0b24nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHVzZXJTZW5kKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIGlucHV0JykudmFsdWUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaG9vay5saXN0ZW4oJ3VpLnByZWZDaGFuZ2VkJywgZnVuY3Rpb24gc2F2ZVByZWZzKCkge1xyXG4gICAgICAgIHZhciBnZXRWYWx1ZSA9IChzZWxlY3RvcikgPT4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcikudmFsdWU7XHJcbiAgICAgICAgdmFyIGdldENoZWNrZWQgPSAoc2VsZWN0b3IpID0+IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpLmNoZWNrZWQ7XHJcblxyXG4gICAgICAgIHZhciBwcmVmcyA9IGJvdC5wcmVmZXJlbmNlcztcclxuICAgICAgICBwcmVmcy5hbm5vdW5jZW1lbnREZWxheSA9ICtnZXRWYWx1ZSgnI21iX2Fubl9kZWxheScpO1xyXG4gICAgICAgIHByZWZzLm1heFJlc3BvbnNlcyA9ICtnZXRWYWx1ZSgnI21iX3Jlc3BfbWF4Jyk7XHJcbiAgICAgICAgcHJlZnMucmVnZXhUcmlnZ2VycyA9IGdldENoZWNrZWQoJyNtYl9yZWdleF90cmlnZ2VycycpO1xyXG4gICAgICAgIHByZWZzLmRpc2FibGVUcmltID0gZ2V0Q2hlY2tlZCgnI21iX2Rpc2FibGVfdHJpbScpO1xyXG4gICAgICAgIHByZWZzLm5vdGlmeSA9IGdldENoZWNrZWQoJyNtYl9ub3RpZnlfbWVzc2FnZScpO1xyXG5cclxuICAgICAgICBzdG9yYWdlLnNldCgnbWJfcHJlZmVyZW5jZXMnLCBwcmVmcywgZmFsc2UpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy9IYW5kbGUgdXNlciBkZWZpbmVkIG1lc3NhZ2VzLlxyXG4gICAgKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBzZW5kT0sgPSBmYWxzZTtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uIHdhaXRGb3JNZXNzYWdlcygpIHtcclxuICAgICAgICAgICAgLy9XYWl0IGZvciBhIHdoaWxlIGJlZm9yZSByZXNwb25kaW5nIHRvIHRyaWdnZXJzLCBhdm9pZHMgbWFzc2l2ZSBib3Qgc3BhbXNcclxuICAgICAgICAgICAgc2VuZE9LID0gdHJ1ZTtcclxuICAgICAgICB9LCAxMDAwMCk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGNoZWNrSm9pbnNBbmRHcm91cChtZXNzYWdlLCBuYW1lKSB7XHJcbiAgICAgICAgICAgIGlmICghc2VuZE9LKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghd29ybGQucGxheWVycy5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgY3VycmVudCA9IHdvcmxkLnBsYXllcnNbbmFtZV0uam9pbnM7XHJcblxyXG4gICAgICAgICAgICB2YXIgam9pbnNPSyA9IG1lc3NhZ2Uuam9pbnNfbG93IDw9IGN1cnJlbnQgJiYgbWVzc2FnZS5qb2luc19oaWdoID49IGN1cnJlbnQ7XHJcbiAgICAgICAgICAgIHZhciBncm91cE9LID0gYm90LmNoZWNrR3JvdXAobWVzc2FnZS5ncm91cCwgbmFtZSkgJiYgIWJvdC5jaGVja0dyb3VwKG1lc3NhZ2Uubm90X2dyb3VwLCBuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBqb2luc09LICYmIGdyb3VwT0s7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBidWlsZE1lc3NhZ2UobWVzc2FnZSwgbmFtZSkge1xyXG4gICAgICAgICAgICBtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKC97e05BTUV9fS9nLCBuYW1lKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL3t7TmFtZX19L2csIG5hbWVbMF0gKyBuYW1lLnN1YnN0cmluZygxKS50b0xvY2FsZUxvd2VyQ2FzZSgpKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL3t7bmFtZX19L2csIG5hbWUudG9Mb2NhbGVMb3dlckNhc2UoKSk7XHJcblxyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykpIHtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoL3t7aXB9fS9naSwgd29ybGQucGxheWVyc1tuYW1lXS5pcCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBtZXNzYWdlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaG9vay5saXN0ZW4oJ3dvcmxkLmpvaW4nLCBmdW5jdGlvbiBvbkpvaW4obmFtZSkge1xyXG4gICAgICAgICAgICBtZXNzYWdlcy5qb2luLmZvckVhY2goKG1zZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoZWNrSm9pbnNBbmRHcm91cChtc2csIG5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYm90LnNlbmQoYnVpbGRNZXNzYWdlKG1zZy5tZXNzYWdlLCBuYW1lKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBob29rLmxpc3Rlbignd29ybGQubGVhdmUnLCBmdW5jdGlvbiBvbkxlYXZlKG5hbWUpIHtcclxuICAgICAgICAgICAgbWVzc2FnZXMubGVhdmUuZm9yRWFjaCgobXNnKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY2hlY2tKb2luc0FuZEdyb3VwKG1zZywgbmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBib3Quc2VuZChidWlsZE1lc3NhZ2UobXNnLm1lc3NhZ2UsIG5hbWUpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGhvb2subGlzdGVuKCd3b3JsZC5tZXNzYWdlJywgZnVuY3Rpb24gb25UcmlnZ2VyKG5hbWUsIG1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gdHJpZ2dlck1hdGNoKHRyaWdnZXIsIG1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgIGlmIChib3QucHJlZmVyZW5jZXMucmVnZXhUcmlnZ2Vycykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHRyaWdnZXIsICdpJykudGVzdChtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVpLm5vdGlmeShgU2tpcHBpbmcgdHJpZ2dlciAnJHt0cmlnZ2VyfScgYXMgdGhlIFJlZ0V4IGlzIGludmFpbGQuYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChcclxuICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oWy4rP149IToke30oKXxcXFtcXF1cXC9cXFxcXSkvZywgXCJcXFxcJDFcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKi9nLCBcIi4qXCIpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnaSdcclxuICAgICAgICAgICAgICAgICAgICApLnRlc3QobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciB0b3RhbEFsbG93ZWQgPSBib3QucHJlZmVyZW5jZXMubWF4UmVzcG9uc2VzO1xyXG4gICAgICAgICAgICBtZXNzYWdlcy50cmlnZ2VyLmZvckVhY2goKG1zZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoZWNrSm9pbnNBbmRHcm91cChtc2csIG5hbWUpICYmIHRyaWdnZXJNYXRjaChtc2cudHJpZ2dlciwgbWVzc2FnZSkgJiYgdG90YWxBbGxvd2VkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYm90LnNlbmQoYnVpbGRNZXNzYWdlKG1zZy5tZXNzYWdlLCBuYW1lKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdG90YWxBbGxvd2VkLS07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBob29rLmxpc3RlbignYm90LnVzZXJzZW5kJywgZnVuY3Rpb24gaGFuZGxlV2hpdGVzcGFjZShtZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtZXNzYWdlLnJlcGxhY2UoL1xcXFxuL2csICdcXG4nKS5yZXBsYWNlKC9cXFxcdC9nLCAnXFx0Jyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGhvb2subGlzdGVuKCd3b3JsZC5tZXNzYWdlJywgZnVuY3Rpb24gY2hhdE5vdGlmaWNhdGlvbnMobmFtZSwgbWVzc2FnZSkge1xyXG4gICAgICAgICAgICBpZiAoYm90LnByZWZlcmVuY2VzLm5vdGlmeSAmJiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZS52aXNpYmxlJykgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGJvdC51aS5ub3RpZnkoYCR7bmFtZX06ICR7bWVzc2FnZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSgpKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgaWYgdXNlcnMgYXJlIGluIGRlZmluZWQgZ3JvdXBzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBzdHJpbmcgZ3JvdXAgdGhlIGdyb3VwIHRvIGNoZWNrXHJcbiAgICAgKiBAcGFyYW0gc3RyaW5nIG5hbWUgdGhlIG5hbWUgb2YgdGhlIHVzZXIgdG8gY2hlY2tcclxuICAgICAqIEByZXR1cm4gYm9vbGVhblxyXG4gICAgICovXHJcbiAgICBib3QuY2hlY2tHcm91cCA9IGZ1bmN0aW9uIGNoZWNrR3JvdXAoZ3JvdXAsIG5hbWUpIHtcclxuICAgICAgICBuYW1lID0gbmFtZS50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgICAgIHN3aXRjaCAoZ3JvdXAudG9Mb2NhbGVMb3dlckNhc2UoKSkge1xyXG4gICAgICAgICAgICBjYXNlICdhbGwnOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIGNhc2UgJ2FkbWluJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB3b3JsZC5saXN0cy5hZG1pbi5pbmNsdWRlcyhuYW1lKTtcclxuICAgICAgICAgICAgY2FzZSAnbW9kJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB3b3JsZC5saXN0cy5tb2QuaW5jbHVkZXMobmFtZSk7XHJcbiAgICAgICAgICAgIGNhc2UgJ3N0YWZmJzpcclxuICAgICAgICAgICAgICAgIHJldHVybiB3b3JsZC5saXN0cy5zdGFmZi5pbmNsdWRlcyhuYW1lKTtcclxuICAgICAgICAgICAgY2FzZSAnb3duZXInOlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmxkLm93bmVyID09IG5hbWU7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gYm90O1xyXG59XHJcbiIsInZhciBib3QgPSByZXF1aXJlKCcuL01lc3NhZ2VCb3QnKTtcclxudmFyIHVpID0gcmVxdWlyZSgnLi91aScpO1xyXG52YXIgc3RvcmFnZSA9IHJlcXVpcmUoJy4vbGlicy9zdG9yYWdlJyk7XHJcbnZhciBhamF4ID0gcmVxdWlyZSgnLi9saWJzL2FqYXgnKTtcclxudmFyIGFwaSA9IHJlcXVpcmUoJy4vbGlicy9ibG9ja2hlYWRzJyk7XHJcbnZhciBob29rID0gcmVxdWlyZSgnLi9saWJzL2hvb2snKTtcclxuXHJcbmNvbnN0IFNUT1JBR0VfSUQgPSAnbWJfZXh0ZW5zaW9ucyc7XHJcblxyXG4vKipcclxuICogVXNlZCB0byBjcmVhdGUgYSBuZXcgZXh0ZW5zaW9uLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgdGVzdCA9IE1lc3NhZ2VCb3RFeHRlbnNpb24oJ3Rlc3QnKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVzcGFjZSAtIFNob3VsZCBiZSB0aGUgc2FtZSBhcyB5b3VyIHZhcmlhYmxlIG5hbWUuXHJcbiAqIEByZXR1cm4ge01lc3NhZ2VCb3RFeHRlbnNpb259IC0gVGhlIGV4dGVuc2lvbiB2YXJpYWJsZS5cclxuICovXHJcbmZ1bmN0aW9uIE1lc3NhZ2VCb3RFeHRlbnNpb24obmFtZXNwYWNlKSB7XHJcbiAgICBob29rLmZpcmUoJ2V4dGVuc2lvbi5pbnN0YWxsZWQnLCBuYW1lc3BhY2UpO1xyXG5cclxuICAgIHZhciBleHRlbnNpb24gPSB7XHJcbiAgICAgICAgaWQ6IG5hbWVzcGFjZSxcclxuICAgICAgICBib3QsXHJcbiAgICAgICAgdWksXHJcbiAgICAgICAgc3RvcmFnZSxcclxuICAgICAgICBhamF4LFxyXG4gICAgICAgIGFwaSxcclxuICAgICAgICBob29rLFxyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVzZWQgdG8gY2hhbmdlIHdoZXRoZXIgb3Igbm90IHRoZSBleHRlbnNpb24gd2lsbCBiZVxyXG4gICAgICogQXV0b21hdGljYWxseSBsb2FkZWQgdGhlIG5leHQgdGltZSB0aGUgYm90IGlzIGxhdW5jaGVkLlxyXG4gICAgICpcclxuICAgICAqIEBleGFtcGxlXHJcbiAgICAgKiB2YXIgdGVzdCA9IE1lc3NhZ2VCb3RFeHRlbnNpb24oJ3Rlc3QnKTtcclxuICAgICAqIHRlc3Quc2V0QXV0b0xhdW5jaCh0cnVlKTtcclxuICAgICAqIEBwYXJhbSB7Ym9vbH0gc2hvdWxkQXV0b2xvYWRcclxuICAgICAqL1xyXG4gICAgZXh0ZW5zaW9uLnNldEF1dG9MYXVuY2ggPSBmdW5jdGlvbiBzZXRBdXRvTGF1bmNoKHNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgaWYgKCFhdXRvbG9hZC5pbmNsdWRlcyhuYW1lc3BhY2UpICYmIHNob3VsZEF1dG9sb2FkKSB7XHJcbiAgICAgICAgICAgIGF1dG9sb2FkLnB1c2gobmFtZXNwYWNlKTtcclxuICAgICAgICAgICAgc3RvcmFnZS5zZXQoU1RPUkFHRV9JRCwgYXV0b2xvYWQsIGZhbHNlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKCFzaG91bGRBdXRvbG9hZCkge1xyXG4gICAgICAgICAgICBpZiAoYXV0b2xvYWQuaW5jbHVkZXMobmFtZXNwYWNlKSkge1xyXG4gICAgICAgICAgICAgICAgYXV0b2xvYWQuc3BsaWNlKGF1dG9sb2FkLmluZGV4T2YobmFtZXNwYWNlKSwgMSk7XHJcbiAgICAgICAgICAgICAgICBzdG9yYWdlLnNldChTVE9SQUdFX0lELCBhdXRvbG9hZCwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gZXh0ZW5zaW9uO1xyXG59XHJcblxyXG4vKipcclxuICogVHJpZXMgdG8gbG9hZCB0aGUgcmVxdWVzdGVkIGV4dGVuc2lvbiBieSBJRC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGlkXHJcbiAqL1xyXG5NZXNzYWdlQm90RXh0ZW5zaW9uLmluc3RhbGwgPSBmdW5jdGlvbiBpbnN0YWxsKGlkKSB7XHJcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcclxuICAgIGVsLnNyYyA9IGAvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2V4dGVuc2lvbi8ke2lkfS9jb2RlL3Jhd2A7XHJcbiAgICBlbC5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xyXG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbCk7XHJcbn07XHJcblxyXG4vKipcclxuICogVW5pbnN0YWxscyBhbiBleHRlbnNpb24uXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZFxyXG4gKi9cclxuTWVzc2FnZUJvdEV4dGVuc2lvbi51bmluc3RhbGwgPSBmdW5jdGlvbiB1bmluc3RhbGwoaWQpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2luZG93W2lkXS51bmluc3RhbGwoKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAvL05vdCBpbnN0YWxsZWQsIG9yIG5vIHVuaW5zdGFsbCBmdW5jdGlvbi5cclxuICAgIH1cclxuXHJcbiAgICB3aW5kb3dbaWRdID0gdW5kZWZpbmVkO1xyXG5cclxuICAgIGlmIChhdXRvbG9hZC5pbmNsdWRlcyhpZCkpIHtcclxuICAgICAgICBhdXRvbG9hZC5zcGxpY2UoYXV0b2xvYWQuaW5kZXhPZihpZCksIDEpO1xyXG4gICAgICAgIHN0b3JhZ2Uuc2V0KFNUT1JBR0VfSUQsIGF1dG9sb2FkLCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaG9vay5maXJlKCdleHRlbnNpb24udW5pbnN0YWxsJywgaWQpO1xyXG59O1xyXG5cclxuLy8gTG9hZCBleHRlbnNpb25zIHRoYXQgc2V0IHRoZW1zZWx2ZXMgdG8gYXV0b2xvYWQgbGFzdCBsYXVuY2guXHJcbnN0b3JhZ2UuZ2V0T2JqZWN0KFNUT1JBR0VfSUQsIFtdLCBmYWxzZSkuZm9yRWFjaChNZXNzYWdlQm90RXh0ZW5zaW9uLmluc3RhbGwpO1xyXG5cclxuLy8gQXJyYXkgb2YgSURzIHRvIGF1dG9sYW9kIGF0IHRoZSBuZXh0IGxhdW5jaC5cclxudmFyIGF1dG9sb2FkID0gW107XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lc3NhZ2VCb3RFeHRlbnNpb247XHJcbiIsIi8vVE9ETzogVXNlIGZldGNoXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gR0VUIGEgcGFnZS4gUGFzc2VzIHRoZSByZXNwb25zZSBvZiB0aGUgWEhSIGluIHRoZSByZXNvbHZlIHByb21pc2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIC8vc2VuZHMgYSBHRVQgcmVxdWVzdCB0byAvc29tZS91cmwucGhwP2E9dGVzdFxyXG4gKiBnZXQoJy9zb21lL3VybC5waHAnLCB7YTogJ3Rlc3QnfSkudGhlbihjb25zb2xlLmxvZylcclxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zU3RyXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXQodXJsID0gJy8nLCBwYXJhbXMgPSB7fSkge1xyXG4gICAgaWYgKE9iamVjdC5rZXlzKHBhcmFtcykubGVuZ3RoKSB7XHJcbiAgICAgICAgdmFyIGFkZGl0aW9uID0gdXJsU3RyaW5naWZ5KHBhcmFtcyk7XHJcbiAgICAgICAgaWYgKHVybC5pbmNsdWRlcygnPycpKSB7XHJcbiAgICAgICAgICAgIHVybCArPSBgJiR7YWRkaXRpb259YDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB1cmwgKz0gYD8ke2FkZGl0aW9ufWA7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB4aHIoJ0dFVCcsIHVybCwge30pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgYSBKU09OIG9iamVjdCBpbiB0aGUgcHJvbWlzZSByZXNvbHZlIG1ldGhvZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyYW1PYmpcclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldEpTT04odXJsID0gJy8nLCBwYXJhbU9iaiA9IHt9KSB7XHJcbiAgICByZXR1cm4gZ2V0KHVybCwgcGFyYW1PYmopLnRoZW4oSlNPTi5wYXJzZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdG8gbWFrZSBhIHBvc3QgcmVxdWVzdFxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbU9ialxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gcG9zdCh1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHJldHVybiB4aHIoJ1BPU1QnLCB1cmwsIHBhcmFtT2JqKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB0byBmZXRjaCBKU09OIGZyb20gYSBwYWdlIHRocm91Z2ggcG9zdC5cclxuICpcclxuICogQHBhcmFtIHN0cmluZyB1cmxcclxuICogQHBhcmFtIHN0cmluZyBwYXJhbU9ialxyXG4gKiBAcmV0dXJuIFByb21pc2VcclxuICovXHJcbmZ1bmN0aW9uIHBvc3RKU09OKHVybCA9ICcvJywgcGFyYW1PYmogPSB7fSkge1xyXG4gICAgcmV0dXJuIHBvc3QodXJsLCBwYXJhbU9iaikudGhlbihKU09OLnBhcnNlKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4qIEhlbHBlciBmdW5jdGlvbiB0byBtYWtlIFhIUiByZXF1ZXN0cywgaWYgcG9zc2libGUgdXNlIHRoZSBnZXQgYW5kIHBvc3QgZnVuY3Rpb25zIGluc3RlYWQuXHJcbipcclxuKiBAZGVwcmljYXRlZCBzaW5jZSB2ZXJzaW9uIDYuMVxyXG4qIEBwYXJhbSBzdHJpbmcgcHJvdG9jb2xcclxuKiBAcGFyYW0gc3RyaW5nIHVybFxyXG4qIEBwYXJhbSBvYmplY3QgcGFyYW1PYmogLS0gV0FSTklORy4gT25seSBhY2NlcHRzIHNoYWxsb3cgb2JqZWN0cy5cclxuKiBAcmV0dXJuIFByb21pc2VcclxuKi9cclxuZnVuY3Rpb24geGhyKHByb3RvY29sLCB1cmwgPSAnLycsIHBhcmFtT2JqID0ge30pIHtcclxuICAgIHZhciBwYXJhbVN0ciA9IHVybFN0cmluZ2lmeShwYXJhbU9iaik7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgdmFyIHJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgICAgIHJlcS5vcGVuKHByb3RvY29sLCB1cmwpO1xyXG4gICAgICAgIHJlcS5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0Jyk7XHJcbiAgICAgICAgaWYgKHByb3RvY29sID09ICdQT1NUJykge1xyXG4gICAgICAgICAgICByZXEuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVxLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBpZiAocmVxLnN0YXR1cyA9PSAyMDApIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVxLnJlc3BvbnNlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVxLnN0YXR1c1RleHQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgLy8gSGFuZGxlIG5ldHdvcmsgZXJyb3JzXHJcbiAgICAgICAgcmVxLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmVqZWN0KEVycm9yKFwiTmV0d29yayBFcnJvclwiKSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAocGFyYW1TdHIpIHtcclxuICAgICAgICAgICAgcmVxLnNlbmQocGFyYW1TdHIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlcS5zZW5kKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdXNlZCB0byBzdHJpbmdpZnkgdXJsIHBhcmFtZXRlcnNcclxuICovXHJcbmZ1bmN0aW9uIHVybFN0cmluZ2lmeShvYmopIHtcclxuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopXHJcbiAgICAubWFwKGsgPT4gYCR7ZW5jb2RlVVJJQ29tcG9uZW50KGspfT0ke2VuY29kZVVSSUNvbXBvbmVudChvYmpba10pfWApXHJcbiAgICAuam9pbignJicpO1xyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7eGhyLCBnZXQsIGdldEpTT04sIHBvc3QsIHBvc3RKU09OfTtcclxuIiwiLyoqXHJcbiAqIEBmaWxlIENvbnRhaW5zIGZ1bmN0aW9ucyB0byBpbnRlcmFjdCB3aXRoIGJsb2NraGVhZHNmYW5zLmNvbSAtIGNhbm5vdCBiZSB1c2VkIGJ5IGV4dGVuc2lvbnMuXHJcbiAqL1xyXG5cclxudmFyIHVpID0gcmVxdWlyZSgnLi4vdWknKTtcclxudmFyIGFqYXggPSByZXF1aXJlKCcuL2FqYXgnKTtcclxuXHJcbmNvbnN0IEFQSV9VUkxTID0ge1xyXG4gICAgU1RPUkU6ICcvL2Jsb2NraGVhZHNmYW5zLmNvbS9tZXNzYWdlYm90L2V4dGVuc2lvbi9zdG9yZScsXHJcbiAgICBOQU1FOiAnLy9ibG9ja2hlYWRzZmFucy5jb20vbWVzc2FnZWJvdC9leHRlbnNpb24vbmFtZScsXHJcbiAgICBFUlJPUjogJy8vYmxvY2toZWFkc2ZhbnMuY29tL21lc3NhZ2Vib3QvYm90L2Vycm9yJyxcclxufTtcclxuXHJcbnZhciBjYWNoZSA9IHtcclxuICAgIG5hbWVzOiBuZXcgTWFwKCksXHJcbn07XHJcblxyXG4vL0J1aWxkIHRoZSBpbml0aWFsIG5hbWVzIG1hcFxyXG5nZXRTdG9yZSgpLnRoZW4oc3RvcmUgPT4ge1xyXG4gICAgaWYgKHN0b3JlLnN0YXR1cyAhPSAnb2snKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAobGV0IGV4IG9mIHN0b3JlLmV4dGVuc2lvbnMpIHtcclxuICAgICAgICBjYWNoZS5uYW1lcy5zZXQoZXguaWQsIGV4LnRpdGxlKTtcclxuICAgIH1cclxufSkuY2F0Y2gocmVwb3J0RXJyb3IpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBVc2VkIHRvIGdldCBwdWJsaWMgZXh0ZW5zaW9uc1xyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRTdG9yZSgpLnRoZW4oc3RvcmUgPT4gY29uc29sZS5sb2coc3RvcmUpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gdXNlIHRoZSBjYWNoZWQgcmVzcG9uc2Ugc2hvdWxkIGJlIGNsZWFyZWQuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9IHJlc29sdmVzIHdpdGggdGhlIHJlc3BvbnNlXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRTdG9yZShyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRTdG9yZSkge1xyXG4gICAgICAgIGNhY2hlLmdldFN0b3JlID0gYWpheC5nZXRKU09OKEFQSV9VUkxTLlNUT1JFKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0U3RvcmU7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogR2V0cyB0aGUgbmFtZSBvZiB0aGUgcHJvdmlkZWQgZXh0ZW5zaW9uIElELlxyXG4gKiBJZiB0aGUgZXh0ZW5zaW9uIHdhcyBub3QgZm91bmQsIHJlc29sdmVzIHdpdGggdGhlIG9yaWdpbmFsIHBhc3NlZCBJRC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0RXh0ZW5zaW9uTmFtZSgndGVzdCcpLnRoZW4obmFtZSA9PiBjb25zb2xlLmxvZyhuYW1lKSk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCB0aGUgaWQgdG8gc2VhcmNoIGZvci5cclxuICogQHJldHVybiB7UHJvbWlzZX0gcmVzb2x2ZXMgd2l0aCB0aGUgZXh0ZW5zaW9uIG5hbWUuXHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRFeHRlbnNpb25OYW1lKGlkKSB7XHJcbiAgICBpZiAoY2FjaGUubmFtZXMuaGFzKGlkKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FjaGUubmFtZXMuZ2V0KGlkKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFqYXgucG9zdEpTT04oQVBJX1VSTFMuTkFNRSwge2lkfSkudGhlbihuYW1lID0+IHtcclxuICAgICAgICBjYWNoZS5uYW1lcy5zZXQoaWQsIG5hbWUpO1xyXG4gICAgICAgIHJldHVybiBuYW1lO1xyXG4gICAgfSwgZXJyID0+IHtcclxuICAgICAgICByZXBvcnRFcnJvcihlcnIpO1xyXG4gICAgICAgIHJldHVybiBpZDtcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlcG9ydHMgYW4gZXJyb3Igc28gdGhhdCBpdCBjYW4gYmUgcmV2aWV3ZWQgYW5kIGZpeGVkIGJ5IGV4dGVuc2lvbiBvciBib3QgZGV2ZWxvcGVycy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogcmVwb3J0RXJyb3IoRXJyb3IoXCJSZXBvcnQgbWVcIikpO1xyXG4gKiBAcGFyYW0ge0Vycm9yfSBlcnIgdGhlIGVycm9yIHRvIHJlcG9ydFxyXG4gKi9cclxuZnVuY3Rpb24gcmVwb3J0RXJyb3IoZXJyKSB7XHJcbiAgICBhamF4LnBvc3RKU09OKEFQSV9VUkxTLkVSUk9SLCB7XHJcbiAgICAgICAgICAgIGVycm9yX3RleHQ6IGVyci5tZXNzYWdlLFxyXG4gICAgICAgICAgICBlcnJvcl9maWxlOiBlcnIuZmlsZW5hbWUsXHJcbiAgICAgICAgICAgIGVycm9yX3JvdzogZXJyLmxpbmVubyB8fCAwLFxyXG4gICAgICAgICAgICBlcnJvcl9jb2x1bW46IGVyci5jb2xubyB8fCAwLFxyXG4gICAgICAgICAgICBlcnJvcl9zdGFjazogZXJyLnN0YWNrIHx8ICcnLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oKHJlc3ApID0+IHtcclxuICAgICAgICAgICAgaWYgKHJlc3Auc3RhdHVzID09ICdvaycpIHtcclxuICAgICAgICAgICAgICAgIHVpLm5vdGlmeSgnU29tZXRoaW5nIHdlbnQgd3JvbmcsIGl0IGhhcyBiZWVuIHJlcG9ydGVkLicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdWkubm90aWZ5KGBFcnJvciByZXBvcnRpbmcgZXhjZXB0aW9uOiAke3Jlc3AubWVzc2FnZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGdldFN0b3JlLFxyXG4gICAgZ2V0RXh0ZW5zaW9uTmFtZSxcclxuICAgIHJlcG9ydEVycm9yLFxyXG59O1xyXG4iLCJ2YXIgYWpheCA9IHJlcXVpcmUoJy4vYWpheCcpO1xyXG52YXIgaG9vayA9IHJlcXVpcmUoJy4vaG9vaycpO1xyXG52YXIgYmhmYW5zYXBpID0gcmVxdWlyZSgnLi9iaGZhbnNhcGknKTtcclxuXHJcbmNvbnN0IHdvcmxkSWQgPSB3aW5kb3cud29ybGRJZDtcclxuY2hlY2tDaGF0KCk7XHJcblxyXG4vLyBVc2VkIHRvIHBhcnNlIG1lc3NhZ2VzIG1vcmUgYWNjdXJhdGVseVxyXG52YXIgd29ybGQgPSB7XHJcbiAgICBuYW1lOiAnJyxcclxuICAgIG9ubGluZTogW11cclxufTtcclxuZ2V0T25saW5lUGxheWVycygpXHJcbiAgICAudGhlbihwbGF5ZXJzID0+IHdvcmxkLnBsYXllcnMgPSBbLi4ubmV3IFNldChwbGF5ZXJzLmNvbmNhdCh3b3JsZC5wbGF5ZXJzKSldKTtcclxuXHJcbmdldFdvcmxkTmFtZSgpXHJcbiAgICAudGhlbihuYW1lID0+IHdvcmxkLm5hbWUgPSBuYW1lKTtcclxuXHJcblxyXG52YXIgY2FjaGUgPSB7XHJcbiAgICBmaXJzdElkOiAwLFxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB3b3JsZFN0YXJ0ZWQsXHJcbiAgICBnZXRMb2dzLFxyXG4gICAgZ2V0TGlzdHMsXHJcbiAgICBnZXRIb21lcGFnZSxcclxuICAgIGdldE9ubGluZVBsYXllcnMsXHJcbiAgICBnZXRPd25lck5hbWUsXHJcbiAgICBnZXRXb3JsZE5hbWUsXHJcbiAgICBzZW5kLFxyXG59O1xyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyBhZnRlciBzdGFydGluZyB0aGUgd29ybGQgaWYgbmVjY2Vzc2FyeSwgcmVqZWN0cyBpZiB0aGUgd29ybGQgdGFrZXMgdG9vIGxvbmcgdG8gc3RhcnQgb3IgaXMgdW5hdmFpbGlibGVcclxuICogUmVmYWN0b3Jpbmcgd2VsY29tZS4gVGhpcyBzZWVtcyBvdmVybHkgcHlyYW1pZCBsaWtlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB3b3JsZFN0YXJ0ZWQoKS50aGVuKCgpID0+IGNvbnNvbGUubG9nKCdzdGFydGVkIScpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVjaGVjayBpZiB0aGUgd29ybGQgaXMgc3RhcnRlZC5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIHdvcmxkU3RhcnRlZChyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS53b3JsZFN0YXJ0ZWQpIHtcclxuICAgICAgICBjYWNoZS53b3JsZFN0YXJ0ZWQgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHZhciBmYWlscyA9IDA7XHJcbiAgICAgICAgICAgIChmdW5jdGlvbiBjaGVjaygpIHtcclxuICAgICAgICAgICAgICAgIC8vIENvdWxkIHRoaXMgYmUgbW9yZSBzaW1wbGlmaWVkP1xyXG4gICAgICAgICAgICAgICAgLy9qc2hpbnQgbWF4Y29tcGxleGl0eTogN1xyXG4gICAgICAgICAgICAgICAgYWpheC5wb3N0SlNPTignL2FwaScsIHsgY29tbWFuZDogJ3N0YXR1cycsIHdvcmxkSWQgfSkudGhlbihyZXNwb25zZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChyZXNwb25zZS53b3JsZFN0YXJ0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnb25saW5lJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ29mZmxpbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWpheC5wb3N0SlNPTignL2FwaScsIHsgY29tbWFuZDogJ3N0YXJ0Jywgd29ybGRJZCB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGNoZWNrLCBjaGVjayk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndW5hdmFpbGlibGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdCgnV29ybGQgdW5hdmFpbGlibGUuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0YXJ0dXAnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzaHV0ZG93bic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNoZWNrLCAzMDAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgrK2ZhaWxzID4gMTApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KCdXb3JsZCB0b29rIHRvbyBsb25nIHRvIHN0YXJ0LicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KCdVbmtub3duIHJlc3BvbnNlLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcik7XHJcbiAgICAgICAgICAgIH0oKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLndvcmxkU3RhcnRlZDtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIGFuIGFycmF5IG9mIHRoZSBsb2cncyBsaW5lcy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0TG9ncygpLnRoZW4obGluZXMgPT4gY29uc29sZS5sb2cobGluZXNbMF0pKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVkb3dubG9hZCB0aGUgbG9nc1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0TG9ncyhyZWZyZXNoID0gZmFsc2UpIHtcclxuICAgIGlmIChyZWZyZXNoIHx8ICFjYWNoZS5nZXRMb2dzKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0TG9ncyA9IHdvcmxkU3RhcnRlZCgpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IGFqYXguZ2V0KGAvd29ybGRzL2xvZ3MvJHt3b3JsZElkfWApKVxyXG4gICAgICAgICAgICAudGhlbihsb2cgPT4gbG9nLnNwbGl0KCdcXG4nKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGNhY2hlLmdldExvZ3M7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCBhIGxpc3Qgb2YgYWRtaW5zLCBtb2RzLCBzdGFmZiAoYWRtaW5zICsgbW9kcyksIHdoaXRlbGlzdCwgYW5kIGJsYWNrbGlzdC5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogZ2V0TGlzdHMoKS50aGVuKGxpc3RzID0+IGNvbnNvbGUubG9nKGxpc3RzLmFkbWluKSk7XHJcbiAqIEBwYXJhbSB7Ym9vbH0gW3JlZnJlc2g9ZmFsc2VdIHdoZXRoZXIgb3Igbm90IHRvIHJlZmV0Y2ggdGhlIGxpc3RzLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0TGlzdHMocmVmcmVzaCA9IGZhbHNlKSB7XHJcbiAgICBpZiAocmVmcmVzaCB8fCAhY2FjaGUuZ2V0TGlzdHMpIHtcclxuICAgICAgICBjYWNoZS5nZXRMaXN0cyA9IHdvcmxkU3RhcnRlZCgpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IGFqYXguZ2V0KGAvd29ybGRzL2xpc3RzLyR7d29ybGRJZH1gKSlcclxuICAgICAgICAgICAgLnRoZW4oaHRtbCA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXRMaXN0KG5hbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbGlzdCA9IGRvYy5xdWVyeVNlbGVjdG9yKGB0ZXh0YXJlYVtuYW1lPSR7bmFtZX1dYClcclxuICAgICAgICAgICAgICAgICAgICAudmFsdWVcclxuICAgICAgICAgICAgICAgICAgICAudG9Mb2NhbGVVcHBlckNhc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zcGxpdCgnXFxuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsuLi5uZXcgU2V0KGxpc3QpXTsgLy9SZW1vdmUgZHVwbGljYXRlc1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBsaXN0cyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBhZG1pbjogZ2V0TGlzdCgnYWRtaW5zJyksXHJcbiAgICAgICAgICAgICAgICAgICAgbW9kOiBnZXRMaXN0KCdtb2RsaXN0JyksXHJcbiAgICAgICAgICAgICAgICAgICAgd2hpdGU6IGdldExpc3QoJ3doaXRlbGlzdCcpLFxyXG4gICAgICAgICAgICAgICAgICAgIGJsYWNrOiBnZXRMaXN0KCdibGFja2xpc3QnKSxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBsaXN0cy5tb2QgPSBsaXN0cy5tb2QuZmlsdGVyKG5hbWUgPT4gIWxpc3RzLmFkbWluLmluY2x1ZGVzKG5hbWUpKTtcclxuICAgICAgICAgICAgICAgIGxpc3RzLnN0YWZmID0gbGlzdHMuYWRtaW4uY29uY2F0KGxpc3RzLm1vZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpc3RzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUud29ybGRTdGFydGVkO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmVzIHdpdGggdGhlIGhvbWVwYWdlIG9mIHRoZSBzZXJ2ZXIuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IGNvbnNvbGUubG9nKGh0bWwuc3Vic3RyaW5nKDAsIDEwMCkpKTtcclxuICogQHBhcmFtIHtib29sfSBbcmVmcmVzaD1mYWxzZV0gd2hldGhlciBvciBub3QgdG8gcmVmZXRjaCB0aGUgcGFnZS5cclxuICogQHJldHVybiB7UHJvbWlzZX1cclxuICovXHJcbmZ1bmN0aW9uIGdldEhvbWVwYWdlKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldEhvbWVwYWdlKSB7XHJcbiAgICAgICAgY2FjaGUuZ2V0SG9tZXBhZ2UgPSBhamF4LmdldChgL3dvcmxkcy8ke3dvcmxkSWR9YClcclxuICAgICAgICAgICAgLmNhdGNoKCgpID0+IGdldEhvbWVwYWdlKHRydWUpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0SG9tZXBhZ2U7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCBhbiBhcnJheSBvZiBwbGF5ZXIgbmFtZXMuXHJcbiAqIEFuIG9ubGluZSBsaXN0IGlzIG1haW50YWluZWQgYnkgdGhlIGJvdCwgdGhpcyBzaG91bGQgZ2VuZXJhbGx5IG5vdCBiZSB1c2VkLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRPbmxpbmVQbGF5ZXJzKCkudGhlbihvbmxpbmUgPT4geyBmb3IgKGxldCBuIG9mIG9ubGluZSkgeyBjb25zb2xlLmxvZyhuLCAnaXMgb25saW5lIScpfX0pO1xyXG4gKiBAcGFyYW0ge2Jvb2x9IFtyZWZyZXNoPWZhbHNlXSB3aGV0aGVyIG9yIG5vdCB0byByZWZyZXNoIHRoZSBvbmxpbmUgbmFtZXMuXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRPbmxpbmVQbGF5ZXJzKHJlZnJlc2ggPSBmYWxzZSkge1xyXG4gICAgaWYgKHJlZnJlc2ggfHwgIWNhY2hlLmdldE9ubGluZVBsYXllcnMpIHtcclxuICAgICAgICBjYWNoZS5nZXRPbmxpbmVQbGF5ZXJzID0gZ2V0SG9tZXBhZ2UodHJ1ZSlcclxuICAgICAgICAgICAgLnRoZW4oKGh0bWwpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBkb2MgPSAobmV3IERPTVBhcnNlcigpKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ3RleHQvaHRtbCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBsYXllckVsZW1zID0gZG9jLnF1ZXJ5U2VsZWN0b3IoJy5tYW5hZ2VyLnBhZGRlZDpudGgtY2hpbGQoMSknKVxyXG4gICAgICAgICAgICAgICAgICAgIC5xdWVyeVNlbGVjdG9yQWxsKCd0cjpub3QoLmhpc3RvcnkpID4gdGQubGVmdCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBsYXllcnMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBBcnJheS5mcm9tKHBsYXllckVsZW1zKS5mb3JFYWNoKChlbCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHBsYXllcnMucHVzaChlbC50ZXh0Q29udGVudC50b0xvY2FsZVVwcGVyQ2FzZSgpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBwbGF5ZXJzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gY2FjaGUuZ2V0T25saW5lUGxheWVycztcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlcyB3aXRoIHRoZSBzZXJ2ZXIgb3duZXIncyBuYW1lLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRPd25lck5hbWUoKS50aGVuKG5hbWUgPT4gY29uc29sZS5sb2coJ1dvcmxkIGlzIG93bmVkIGJ5JywgbmFtZSkpO1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T3duZXJOYW1lKCkge1xyXG4gICAgcmV0dXJuIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IHtcclxuICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICByZXR1cm4gZG9jLnF1ZXJ5U2VsZWN0b3IoJy5zdWJoZWFkZXJ+dHI+dGQ6bm90KFtjbGFzc10pJykudGV4dENvbnRlbnQudG9Mb2NhbGVVcHBlckNhc2UoKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogUmVzb2x2ZXMgd2l0aCB0aGUgd29ybGQncyBuYW1lLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBnZXRXb3JsZE5hbWUoKS50aGVuKG5hbWUgPT4gY29uc29sZS5sb2coJ1dvcmxkIG5hbWU6JywgbmFtZSkpO1xyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0V29ybGROYW1lKCkge1xyXG4gICAgcmV0dXJuIGdldEhvbWVwYWdlKCkudGhlbihodG1sID0+IHtcclxuICAgICAgICB2YXIgZG9jID0gKG5ldyBET01QYXJzZXIoKSkucGFyc2VGcm9tU3RyaW5nKGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICByZXR1cm4gZG9jLnF1ZXJ5U2VsZWN0b3IoJyN0aXRsZScpLnRleHRDb250ZW50LnRvTG9jYWxlVXBwZXJDYXNlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlbmRzIGEgbWVzc2FnZSwgcmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBtZXNzYWdlIGhhcyBiZWVuIHNlbnQgb3IgcmVqZWN0cyBvbiBmYWlsdXJlLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBzZW5kKCdoZWxsbyEnKS50aGVuKCgpID0+IGNvbnNvbGUubG9nKCdzZW50JykpLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBzZW5kLlxyXG4gKiBAcmV0dXJuIHtQcm9taXNlfVxyXG4gKi9cclxuZnVuY3Rpb24gc2VuZChtZXNzYWdlKSB7XHJcbiAgICByZXR1cm4gYWpheC5wb3N0SlNPTihgL2FwaWAsIHtjb21tYW5kOiAnc2VuZCcsIG1lc3NhZ2UsIHdvcmxkSWR9KVxyXG4gICAgICAgIC50aGVuKHJlc3AgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcC5zdGF0dXMgIT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3AubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3A7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbihyZXNwID0+IHtcclxuICAgICAgICAgICAgLy9IYW5kbGUgaG9va3NcclxuICAgICAgICAgICAgaG9vay5maXJlKCd3b3JsZC5zZW5kJywgbWVzc2FnZSk7XHJcbiAgICAgICAgICAgIGhvb2suZmlyZSgnd29ybGQuc2VydmVybWVzc2FnZScsIG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgLy9EaXNhbGxvdyBjb21tYW5kcyBzdGFydGluZyB3aXRoIHNwYWNlLlxyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykgJiYgIW1lc3NhZ2Uuc3RhcnRzV2l0aCgnLyAnKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbW1hbmQgPSBtZXNzYWdlLnN1YnN0cigxKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYXJncyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbW1hbmQuaW5jbHVkZXMoJyAnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmQgPSBjb21tYW5kLnN1YnN0cmluZygwLCBjb21tYW5kLmluZGV4T2YoJyAnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IG1lc3NhZ2Uuc3Vic3RyaW5nKG1lc3NhZ2UuaW5kZXhPZignICcpICsgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBob29rLmNoZWNrKCd3b3JsZC5jb21tYW5kJywgJ1NFUlZFUicsIGNvbW1hbmQsIGFyZ3MpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzcDtcclxuICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyID09ICdXb3JsZCBub3QgcnVubmluZy4nKSB7XHJcbiAgICAgICAgICAgICAgICBjYWNoZS5maXJzdElkID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aHJvdyBlcnI7XHJcbiAgICAgICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gd2F0Y2ggY2hhdC5cclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrQ2hhdCgpIHtcclxuICAgIGdldE1lc3NhZ2VzKCkudGhlbigobXNncykgPT4ge1xyXG4gICAgICAgIG1zZ3MuZm9yRWFjaCgobWVzc2FnZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKGAke3dvcmxkLm5hbWV9IC0gUGxheWVyIENvbm5lY3RlZCBgKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IFssIG5hbWUsIGlwXSA9IG1lc3NhZ2UubWF0Y2goLyAtIFBsYXllciBDb25uZWN0ZWQgKC4qKSBcXHwgKFtcXGQuXSspIFxcfCAoW1xcd117MzJ9KVxccyokLyk7XHJcbiAgICAgICAgICAgICAgICBoYW5kbGVKb2luTWVzc2FnZXMobmFtZSwgaXApO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLnN0YXJ0c1dpdGgoYCR7d29ybGQubmFtZX0gLSBQbGF5ZXIgRGlzY29ubmVjdGVkIGApKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmFtZSA9IG1lc3NhZ2Uuc3Vic3RyaW5nKHdvcmxkLm5hbWUubGVuZ3RoICsgMjMpO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlTGVhdmVNZXNzYWdlcyhuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS5pbmNsdWRlcygnOiAnKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5hbWUgPSBnZXRVc2VybmFtZShtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIGxldCBtc2cgPSBtZXNzYWdlLnN1YnN0cmluZyhuYW1lLmxlbmd0aCArIDIpO1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlVXNlck1lc3NhZ2VzKG5hbWUsIG1zZyk7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaGFuZGxlT3RoZXJNZXNzYWdlcyhtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goYmhmYW5zYXBpLnJlcG9ydEVycm9yKVxyXG4gICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIHNldFRpbWVvdXQoY2hlY2tDaGF0LCA1MDAwKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGdldCB0aGUgbGF0ZXN0IGNoYXQgbWVzc2FnZXMuXHJcbiAqXHJcbiAqIEByZXR1cm4ge1Byb21pc2V9XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRNZXNzYWdlcygpIHtcclxuICAgIHJldHVybiB3b3JsZFN0YXJ0ZWQoKVxyXG4gICAgICAgIC50aGVuKCgpID0+IGFqYXgucG9zdEpTT04oYC9hcGlgLCB7IGNvbW1hbmQ6ICdnZXRjaGF0Jywgd29ybGRJZCwgZmlyc3RJZDogY2FjaGUuZmlyc3RJZCB9KSlcclxuICAgICAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgICAgICAgaWYgKGRhdGEuc3RhdHVzID09ICdvaycgJiYgZGF0YS5uZXh0SWQgIT0gY2FjaGUuZmlyc3RJZCkge1xyXG4gICAgICAgICAgICAgICAgY2FjaGUuZmlyc3RJZCA9IGRhdGEubmV4dElkO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEubG9nO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGRhdGEuc3RhdHVzID09ICdlcnJvcicpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihkYXRhLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgfSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdG8gZmlndXJlIG91dCB3aG8gc2VudCBhIG1lc3NhZ2UuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBuYW1lID0gZ2V0VXNlcm5hbWUoJ1NFUlZFUjogSGkgdGhlcmUhJyk7XHJcbiAqIC8vbmFtZSA9PSAnU0VSVkVSJ1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBwYXJzZS5cclxuICogQHJldHVybiB7c3RyaW5nfSB0aGUgbmFtZSBvZiB0aGUgdXNlciB3aG8gc2VudCB0aGUgbWVzc2FnZS5cclxuICovXHJcbmZ1bmN0aW9uIGdldFVzZXJuYW1lKG1lc3NhZ2UpIHtcclxuICAgIGZvciAobGV0IGkgPSAxODsgaSA+IDQ7IGktLSkge1xyXG4gICAgICAgIGxldCBwb3NzaWJsZU5hbWUgPSBtZXNzYWdlLnN1YnN0cmluZygwLCBtZXNzYWdlLmxhc3RJbmRleE9mKCc6ICcsIGkpKTtcclxuICAgICAgICBpZiAod29ybGQub25saW5lLmluY2x1ZGVzKHBvc3NpYmxlTmFtZSkgfHwgcG9zc2libGVOYW1lID09ICdTRVJWRVInKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwb3NzaWJsZU5hbWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gU2hvdWxkIGlkZWFsbHkgbmV2ZXIgaGFwcGVuLlxyXG4gICAgcmV0dXJuIG1lc3NhZ2Uuc3Vic3RyaW5nKDAsIG1lc3NhZ2UubGFzdEluZGV4T2YoJzogJywgMTgpKTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBoYW5kbGUgcGxheWVyIGpvaW5zLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgcGxheWVyIGpvaW5pbmcuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBpcCB0aGUgaXAgb2YgdGhlIHBsYXllciBqb2luaW5nLlxyXG4gKi9cclxuZnVuY3Rpb24gaGFuZGxlSm9pbk1lc3NhZ2VzKG5hbWUsIGlwKSB7XHJcbiAgICBpZiAoIXdvcmxkLm9ubGluZS5pbmNsdWRlcyhuYW1lKSkge1xyXG4gICAgICAgIHdvcmxkLm9ubGluZS5wdXNoKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLmpvaW4nLCBuYW1lLCBpcCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0byBoYW5kbGUgcGxheWVyIGRpc2Nvbm5lY3Rpb25zLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSB0aGUgbmFtZSBvZiB0aGUgcGxheWVyIGxlYXZpbmcuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVMZWF2ZU1lc3NhZ2VzKG5hbWUpIHtcclxuICAgIGlmICh3b3JsZC5vbmxpbmUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgICB3b3JsZC5vbmxpbmUuc3BsaWNlKHdvcmxkLm9ubGluZS5pbmRleE9mKG5hbWUpLCAxKTtcclxuICAgICAgICBob29rLmNoZWNrKCd3b3JsZC5sZWF2ZScsIG5hbWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRvIGhhbmRsZSB1c2VyIGNoYXRcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgdGhlIG5hbWUgb2YgdGhlIHVzZXIuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIHRoZSBtZXNzYWdlIHNlbnQuXHJcbiAqL1xyXG5mdW5jdGlvbiBoYW5kbGVVc2VyTWVzc2FnZXMobmFtZSwgbWVzc2FnZSkge1xyXG4gICAgaWYgKG5hbWUgPT0gJ1NFUlZFUicpIHtcclxuICAgICAgICBob29rLmNoZWNrKCd3b3JsZC5zZXJ2ZXJjaGF0JywgbWVzc2FnZSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGhvb2suY2hlY2soJ3dvcmxkLm1lc3NhZ2UnLCBuYW1lLCBtZXNzYWdlKTtcclxuXHJcbiAgICBpZiAobWVzc2FnZS5zdGFydHNXaXRoKCcvJykgJiYgIW1lc3NhZ2Uuc3RhcnRzV2l0aCgnLyAnKSkge1xyXG5cclxuICAgICAgICBsZXQgY29tbWFuZCA9IG1lc3NhZ2Uuc3Vic3RyKDEpO1xyXG5cclxuICAgICAgICBsZXQgYXJncyA9ICcnO1xyXG4gICAgICAgIGlmIChjb21tYW5kLmluY2x1ZGVzKCcgJykpIHtcclxuICAgICAgICAgICAgY29tbWFuZCA9IGNvbW1hbmQuc3Vic3RyaW5nKDAsIGNvbW1hbmQuaW5kZXhPZignICcpKTtcclxuICAgICAgICAgICAgYXJncyA9IG1lc3NhZ2Uuc3Vic3RyaW5nKG1lc3NhZ2UuaW5kZXhPZignICcpICsgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGhvb2suY2hlY2soJ3dvcmxkLmNvbW1hbmQnLCBuYW1lLCBjb21tYW5kLCBhcmdzKTtcclxuICAgICAgICByZXR1cm47IC8vbm90IGNoYXRcclxuICAgIH1cclxuXHJcbiAgICBob29rLmNoZWNrKCd3b3JsZC5jaGF0JywgbmFtZSwgbWVzc2FnZSk7XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZnVuY3Rpb24gdXNlZCB0byBoYW5kbGUgbWVzc2FnZXMgd2hpY2ggYXJlIG5vdCBzaW1wbHkgcGFyc2VkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSB0aGUgbWVzc2FnZSB0byBoYW5kbGVcclxuICovXHJcbmZ1bmN0aW9uIGhhbmRsZU90aGVyTWVzc2FnZXMobWVzc2FnZSkge1xyXG4gICAgaG9vay5jaGVjaygnd29ybGQub3RoZXInLCBtZXNzYWdlKTtcclxufVxyXG4iLCJ2YXIgbGlzdGVuZXJzID0ge307XHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBiZWdpbiBsaXN0ZW5pbmcgdG8gYW4gZXZlbnQuXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGxpc3RlbignZXZlbnQnLCBjb25zb2xlLmxvZyk7XHJcbiAqIC8vYWx0ZXJuYXRpdmVseVxyXG4gKiBvbignZXZlbnQnLCBjb25zb2xlLmxvZyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIGxpc3RlbiB0by5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdGhlIGV2ZW50IGhhbmRsZXJcclxuICovXHJcbmZ1bmN0aW9uIGxpc3RlbihrZXksIGNhbGxiYWNrKSB7XHJcbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NhbGxiYWNrIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcclxuICAgIH1cclxuXHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICBsaXN0ZW5lcnNba2V5XSA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0uaW5jbHVkZXMoY2FsbGJhY2spKSB7XHJcbiAgICAgICAgbGlzdGVuZXJzW2tleV0ucHVzaChjYWxsYmFjayk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBzdG9wIGxpc3RlbmluZyB0byBhbiBldmVudC4gSWYgdGhlIGxpc3RlbmVyIHdhcyBub3QgZm91bmQsIG5vIGFjdGlvbiB3aWxsIGJlIHRha2VuLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiAvL0VhcmxpZXIgYXR0YWNoZWQgbXlGdW5jIHRvICdldmVudCdcclxuICogcmVtb3ZlKCdldmVudCcsIG15RnVuYyk7XHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGV2ZW50IHRvIHN0b3AgbGlzdGVuaW5nIHRvLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0aGUgY2FsbGJhY2sgdG8gcmVtb3ZlIGZyb20gdGhlIGV2ZW50IGxpc3RlbmVycy5cclxuICovXHJcbmZ1bmN0aW9uIHJlbW92ZShrZXksIGNhbGxiYWNrKSB7XHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmIChsaXN0ZW5lcnNba2V5XSkge1xyXG4gICAgICAgIGlmIChsaXN0ZW5lcnNba2V5XS5pbmNsdWRlcyhjYWxsYmFjaykpIHtcclxuICAgICAgICAgICAgbGlzdGVuZXJzW2tleV0uc3BsaWNlKGxpc3RlbmVyc1trZXldLmluZGV4T2YoY2FsbGJhY2spLCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4vKipcclxuICogRnVuY3Rpb24gdXNlZCB0byBjYWxsIGV2ZW50cy5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogY2hlY2soJ3Rlc3QnLCAxLCAyLCAzKTtcclxuICogY2hlY2soJ3Rlc3QnLCB0cnVlKTtcclxuICogLy8gYWx0ZXJuYXRpdmVseVxyXG4gKiBmaXJlKCd0ZXN0JywgMSwgMiwgMyk7XHJcbiAqIGZpcmUoJ3Rlc3QnLCB0cnVlKTtcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUgZXZlbnQgdG8gY2FsbC5cclxuICogQHBhcmFtIHttaXhlZH0gYXJncyBhbnkgYXJndW1lbnRzIHRvIHBhc3MgdG8gbGlzdGVuaW5nIGZ1bmN0aW9ucy5cclxuICovXHJcbmZ1bmN0aW9uIGNoZWNrKGtleSwgLi4uYXJncykge1xyXG4gICAga2V5ID0ga2V5LnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAoIWxpc3RlbmVyc1trZXldKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGxpc3RlbmVyc1trZXldLmZvckVhY2goZnVuY3Rpb24obGlzdGVuZXIpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsaXN0ZW5lciguLi5hcmdzKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGlmIChrZXkgIT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgY2hlY2soJ2Vycm9yJywgZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHVwZGF0ZSBhIHZhbHVlIGJhc2VkIG9uIGlucHV0IGZyb20gbGlzdGVuZXJzLlxyXG4gKlxyXG4gKiBAZGVwcmljYXRlZCBzaW5jZSA2LjEuMC4gSW5zdGVhZCwgdXBkYXRlIHJlcXVlc3RzIHNob3VsZCBiZSBoYW5kbGVkIGJ5IHRoZSBleHRlbnNpb24gaXRlc2VsZi5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdXBkYXRlKCdldmVudCcsIHRydWUsIDEsIDIsIDMpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBldmVudCB0byBjYWxsXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGluaXRpYWwgdGhlIGluaXRpYWwgdmFsdWUgdG8gYmUgcGFzc2VkIHRvIGxpc3RlbmVycy5cclxuICogQHBhcmFtIHttaXhlZH0gYXJncyBhbnkgYWRkaXRpb25hbCBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGxpc3RlbmVycy5cclxuICogQHJldHVybiB7bWl4ZWR9XHJcbiAqL1xyXG5mdW5jdGlvbiB1cGRhdGUoa2V5LCBpbml0aWFsLCAuLi5hcmdzKSB7XHJcbiAgICBrZXkgPSBrZXkudG9Mb2NhbGVMb3dlckNhc2UoKTtcclxuICAgIGlmICghbGlzdGVuZXJzW2tleV0pIHtcclxuICAgICAgICByZXR1cm4gaW5pdGlhbDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbGlzdGVuZXJzW2tleV0ucmVkdWNlKGZ1bmN0aW9uKHByZXZpb3VzLCBjdXJyZW50KSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGN1cnJlbnQocHJldmlvdXMsIC4uLmFyZ3MpO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHJlc3VsdCAhPSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcHJldmlvdXM7XHJcbiAgICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgICAgIGlmIChrZXkgIT0gJ2Vycm9yJykge1xyXG4gICAgICAgICAgICAgICAgY2hlY2soJ2Vycm9yJywgZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHByZXZpb3VzO1xyXG4gICAgICAgIH1cclxuICAgIH0sIGluaXRpYWwpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGxpc3RlbixcclxuICAgIG9uOiBsaXN0ZW4sXHJcbiAgICByZW1vdmUsXHJcbiAgICBjaGVjayxcclxuICAgIGZpcmU6IGNoZWNrLFxyXG4gICAgdXBkYXRlLFxyXG59O1xyXG4iLCJmdW5jdGlvbiB1cGRhdGUoa2V5cywgb3BlcmF0b3IpIHtcclxuICAgIE9iamVjdC5rZXlzKGxvY2FsU3RvcmFnZSkuZm9yRWFjaChpdGVtID0+IHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgb2Yga2V5cykge1xyXG4gICAgICAgICAgICBpZiAoaXRlbS5zdGFydHNXaXRoKGtleSkpIHtcclxuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGl0ZW0sIG9wZXJhdG9yKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGl0ZW0pKSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG4vL2pzaGludCAtVzA4NlxyXG4vL05vIGJyZWFrIHN0YXRlbWVudHMgYXMgd2Ugd2FudCB0byBleGVjdXRlIGFsbCB1cGRhdGVzIGFmdGVyIG1hdGNoZWQgdmVyc2lvbi5cclxuc3dpdGNoIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnbWJfdmVyc2lvbicpKSB7XHJcbiAgICBjYXNlIG51bGw6XHJcbiAgICAgICAgYnJlYWs7IC8vTm90aGluZyB0byBtaWdyYXRlXHJcbiAgICBjYXNlICc1LjIuMCc6XHJcbiAgICBjYXNlICc1LjIuMSc6XHJcbiAgICAgICAgLy9XaXRoIDYuMCwgbmV3bGluZXMgYXJlIGRpcmVjdGx5IHN1cHBvcnRlZCBpbiBtZXNzYWdlcyBieSB0aGUgYm90LlxyXG4gICAgICAgIHVwZGF0ZShbJ2Fubm91bmNlbWVudEFycicsICdqb2luQXJyJywgJ2xlYXZlQXJyJywgJ3RyaWdnZXJBcnInXSwgZnVuY3Rpb24ocmF3KSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VkID0gSlNPTi5wYXJzZShyYXcpO1xyXG4gICAgICAgICAgICAgICAgcGFyc2VkLmZvckVhY2gobXNnID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAobXNnLm1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbXNnLm1lc3NhZ2UgPSBtc2cubWVzc2FnZS5yZXBsYWNlKC9cXFxcbi9nLCAnXFxuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocGFyc2VkKTtcclxuICAgICAgICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmF3O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgYnJlYWs7IC8vTmV4dCBidWdmaXggb25seSByZWxhdGVzIHRvIDYuMCBib3QuXHJcbiAgICBjYXNlICc2LjAuMGEnOlxyXG4gICAgY2FzZSAnNi4wLjAnOlxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5ib3R1aS5hbGVydChcIkR1ZSB0byBhIGJ1ZyBpbiB0aGUgNi4wLjAgdmVyc2lvbiBvZiB0aGUgYm90LCB5b3VyIGpvaW4gYW5kIGxlYXZlIG1lc3NhZ2VzIG1heSBiZSBzd2FwcGVkLiBTb3JyeSEgVGhpcyBjYW5ub3QgYmUgZml4ZWQgYXV0b21hdGljYWxseS4gVGhpcyBtZXNzYWdlIHdpbGwgbm90IGJlIHNob3duIGFnYWluLlwiKTtcclxuICAgICAgICB9LCAxMDAwKTtcclxuICAgICAgICBicmVhazsgLy9OZXh0IGJ1Z2ZpeCBvbmx5IHJlbGF0ZXMgdG8gNi4wLjEgLyA2LjAuMi5cclxuICAgIGNhc2UgJzYuMC4xJzpcclxuICAgIGNhc2UgJzYuMC4yJzpcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB3aW5kb3cuYm90dWkuYWxlcnQoXCJEdWUgdG8gYSBidWcgaW4gNi4wLjEgLyA2LjAuMiwgZ3JvdXBzIG1heSBoYXZlIGJlZW4gbWl4ZWQgdXAgb24gSm9pbiwgTGVhdmUsIGFuZCBUcmlnZ2VyIG1lc3NhZ2VzLiBTb3JyeSEgVGhpcyBjYW5ub3QgYmUgZml4ZWQgYXV0b21hdGljYWxseSBpZiBpdCBvY2N1cmVkIG9uIHlvdXIgYm90LiBBbm5vdW5jZW1lbnRzIGhhdmUgYWxzbyBiZWVuIGZpeGVkLlwiKTtcclxuICAgICAgICB9LCAxMDAwKTtcclxuICAgIGNhc2UgJzYuMC4zJzpcclxuICAgIGNhc2UgJzYuMC40JzpcclxuICAgIGNhc2UgJzYuMC41JzpcclxufVxyXG4vL2pzaGludCArVzA4NlxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGdldFN0cmluZyxcclxuICAgIGdldE9iamVjdCxcclxuICAgIHNldCxcclxuICAgIGNsZWFyTmFtZXNwYWNlLFxyXG59O1xyXG5cclxuLy9SRVZJRVc6IElzIHRoZXJlIGEgYmV0dGVyIHdheSB0byBkbyB0aGlzPyByZXF1aXJlKCcuL2NvbmZpZycpIG1heWJlP1xyXG5jb25zdCBOQU1FU1BBQ0UgPSB3aW5kb3cud29ybGRJZDtcclxuXHJcbi8qKlxyXG4gKiBHZXRzIGEgc3RyaW5nIGZyb20gdGhlIHN0b3JhZ2UgaWYgaXQgZXhpc3RzIGFuZCByZXR1cm5zIGl0LCBvdGhlcndpc2UgcmV0dXJucyBmYWxsYmFjay5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdmFyIHggPSBnZXRTdHJpbmcoJ3N0b3JlZF9wcmVmcycsICdub3RoaW5nJyk7XHJcbiAqIHZhciB5ID0gZ2V0U3RyaW5nKCdzdG9yZWRfcHJlZnMnLCAnbm90aGluZycsIGZhbHNlKTtcclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IGtleSB0aGUga2V5IHRvIHJldHJpZXZlLlxyXG4gKiBAcGFyYW0ge21peGVkfSBmYWxsYmFjayB3aGF0IHRvIHJldHVybiBpZiB0aGUga2V5IHdhcyBub3QgZm91bmQuXHJcbiAqIEBwYXJhbSB7Ym9vbH0gW2xvY2FsPXRydWVdIHdoZXRoZXIgb3Igbm90IHRvIHVzZSBhIG5hbWVzcGFjZSB3aGVuIGNoZWNraW5nIGZvciB0aGUga2V5LlxyXG4gKiBAcmV0dXJuIHttaXhlZH1cclxuICovXHJcbmZ1bmN0aW9uIGdldFN0cmluZyhrZXksIGZhbGxiYWNrLCBsb2NhbCA9IHRydWUpIHtcclxuICAgIHZhciByZXN1bHQ7XHJcbiAgICBpZiAobG9jYWwpIHtcclxuICAgICAgICByZXN1bHQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShgJHtrZXl9JHtOQU1FU1BBQ0V9YCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJlc3VsdCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIChyZXN1bHQgPT09IG51bGwpID8gZmFsbGJhY2sgOiByZXN1bHQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXRzIGEgc3RvcmVkIG9iamVjdCBpZiBpdCBleGlzdHMsIG90aGVyd2lzZSByZXR1cm5zIGZhbGxiYWNrLlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgeCA9IGdldE9iamVjdCgnc3RvcmVkX2tleScsIFsxLCAyLCAzXSk7XHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgdGhlIGl0ZW0gdG8gcmV0cmlldmUuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGZhbGxiYWNrIHdoYXQgdG8gcmV0dXJuIGlmIHRoZSBpdGVtIGRvZXMgbm90IGV4aXN0IG9yIGZhaWxzIHRvIHBhcnNlIGNvcnJlY3RseS5cclxuICogQHBhcmFtIHtib29sfSBbbG9jYWw9dHJ1ZV0gd2hldGhlciBvciBub3QgYSBuYW1lc3BhY2Ugc2hvdWxkIGJlIHVzZWQuXHJcbiAqIEByZXR1cm4ge21peGVkfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0T2JqZWN0KGtleSwgZmFsbGJhY2ssIGxvY2FsID0gdHJ1ZSkge1xyXG4gICAgdmFyIHJlc3VsdCA9IGdldFN0cmluZyhrZXksIGZhbHNlLCBsb2NhbCk7XHJcblxyXG4gICAgaWYgKCFyZXN1bHQpIHtcclxuICAgICAgICByZXR1cm4gZmFsbGJhY2s7XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICByZXN1bHQgPSBKU09OLnBhcnNlKHJlc3VsdCk7XHJcbiAgICB9IGNhdGNoKGUpIHtcclxuICAgICAgICByZXN1bHQgPSBmYWxsYmFjaztcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSBmYWxsYmFjaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHMgYW4gb2JqZWN0IGluIHRoZSBzdG9yYWdlLCBzdHJpbmdpZnlpbmcgaXQgZmlyc3QgaWYgbmVjY2Vzc2FyeS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2V0KCdzb21lX2tleScsIHthOiBbMSwgMiwgM10sIGI6ICd0ZXN0J30pO1xyXG4gKiAvL3JldHVybnMgJ3tcImFcIjpbMSwyLDNdLFwiYlwiOlwidGVzdFwifSdcclxuICogZ2V0U3RyaW5nKCdzb21lX2tleScpO1xyXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IHRoZSBpdGVtIHRvIG92ZXJ3cml0ZSBvciBjcmVhdGUuXHJcbiAqIEBwYXJhbSB7bWl4ZWR9IGRhdGEgYW55IHN0cmluZ2lmeWFibGUgdHlwZS5cclxuICogQHBhcmFtIHtib29sfSBbbG9jYWw9dHJ1ZV0gd2hldGhlciB0byBzYXZlIHRoZSBpdGVtIHdpdGggYSBuYW1lc3BhY2UuXHJcbiAqL1xyXG5mdW5jdGlvbiBzZXQoa2V5LCBkYXRhLCBsb2NhbCA9IHRydWUpIHtcclxuICAgIGlmIChsb2NhbCkge1xyXG4gICAgICAgIGtleSA9IGAke2tleX0ke05BTUVTUEFDRX1gO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgZGF0YSA9PSAnc3RyaW5nJykge1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgZGF0YSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhbGwgaXRlbXMgc3RhcnRpbmcgd2l0aCBuYW1lc3BhY2UgZnJvbSB0aGUgc3RvcmFnZS5cclxuICpcclxuICogQGV4YW1wbGVcclxuICogc2V0KCdrZXlfdGVzdCcsIDEpO1xyXG4gKiBzZXQoJ2tleV90ZXN0MicsIDIpO1xyXG4gKiBjbGVhck5hbWVzcGFjZSgna2V5XycpOyAvL2JvdGgga2V5X3Rlc3QgYW5kIGtleV90ZXN0MiBoYXZlIGJlZW4gcmVtb3ZlZC5cclxuICpcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVzcGFjZSB0aGUgcHJlZml4IHRvIGNoZWNrIGZvciB3aGVuIHJlbW92aW5nIGl0ZW1zLlxyXG4gKi9cclxuZnVuY3Rpb24gY2xlYXJOYW1lc3BhY2UobmFtZXNwYWNlKSB7XHJcbiAgICBPYmplY3Qua2V5cyhsb2NhbFN0b3JhZ2UpLmZvckVhY2goa2V5ID0+IHtcclxuICAgICAgICBpZiAoa2V5LnN0YXJ0c1dpdGgobmFtZXNwYWNlKSkge1xyXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsIi8vSUUgZG9lc24ndCBsaWtlIGNvbnNvbGUubG9nIHVubGVzcyBkZXYgdG9vbHMgYXJlIG9wZW4uXHJcbmlmICghd2luZG93LmNvbnNvbGUpIHtcclxuICAgIHdpbmRvdy5jb25zb2xlID0ge307XHJcbiAgICB3aW5kb3cubG9nID0gd2luZG93LmxvZyB8fCBbXTtcclxuICAgIGNvbnNvbGUubG9nID0gZnVuY3Rpb24oLi4uYXJncykge1xyXG4gICAgICAgIHdpbmRvdy5sb2cucHVzaChhcmdzKTtcclxuICAgIH07XHJcbn1cclxuWydpbmZvJywgJ2Vycm9yJywgJ3dhcm4nLCAnYXNzZXJ0J10uZm9yRWFjaChtZXRob2QgPT4ge1xyXG4gICAgaWYgKCFjb25zb2xlW21ldGhvZF0pIHtcclxuICAgICAgICBjb25zb2xlW21ldGhvZF0gPSBjb25zb2xlLmxvZztcclxuICAgIH1cclxufSk7XHJcbiIsIi8vRGV0YWlscyBwb2x5ZmlsbCwgb2xkZXIgZmlyZWZveCwgSUVcclxuaWYgKCEoJ29wZW4nIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RldGFpbHMnKSkpIHtcclxuICAgIGxldCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbiAgICBzdHlsZS50ZXh0Q29udGVudCArPSBgZGV0YWlsczpub3QoW29wZW5dKSA+IDpub3Qoc3VtbWFyeSkgeyBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH0gZGV0YWlscyA+IHN1bW1hcnk6YmVmb3JlIHsgY29udGVudDogXCLilrZcIjsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBmb250LXNpemU6IC44ZW07IHdpZHRoOiAxLjVlbTsgZm9udC1mYW1pbHk6XCJDb3VyaWVyIE5ld1wiOyB9IGRldGFpbHNbb3Blbl0gPiBzdW1tYXJ5OmJlZm9yZSB7IHRyYW5zZm9ybTogcm90YXRlKDkwZGVnKTsgfWA7XHJcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcclxuXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIGlmIChldmVudC50YXJnZXQudGFnTmFtZSA9PSAnU1VNTUFSWScpIHtcclxuICAgICAgICAgICAgbGV0IGRldGFpbHMgPSBldmVudC50YXJnZXQucGFyZW50Tm9kZTtcclxuXHJcbiAgICAgICAgICAgIGlmICghZGV0YWlscykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZGV0YWlscy5nZXRBdHRyaWJ1dGUoJ29wZW4nKSkge1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5vcGVuID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzLnJlbW92ZUF0dHJpYnV0ZSgnb3BlbicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZGV0YWlscy5vcGVuID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGRldGFpbHMuc2V0QXR0cmlidXRlKCdvcGVuJywgJ29wZW4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiIsIi8vSW1wb3J0ZWQgdmFycyAvIGZ1bmN0aW9uc1xyXG4vKmdsb2JhbHNcclxuICAgIElOQ0xVREVfRklMRVxyXG4qL1xyXG5cclxuLy9PdmVyd3JpdGUgdGhlIHBvbGxDaGF0IGZ1bmN0aW9uIHRvIGtpbGwgdGhlIGRlZmF1bHQgY2hhdCBmdW5jdGlvblxyXG53aW5kb3cucG9sbENoYXQgPSBmdW5jdGlvbigpIHt9O1xyXG5cclxucmVxdWlyZSgnLi9wb2x5ZmlsbHMvY29uc29sZScpO1xyXG5yZXF1aXJlKCcuL2xpYnMvbWlncmF0aW9uJyk7XHJcblxyXG52YXIgdWkgPSByZXF1aXJlKCcuL3VpJyk7XHJcblxyXG5JTkNMVURFX0ZJTEUoJy9kZXYvTWVzc2FnZUJvdC5qcycpO1xyXG5JTkNMVURFX0ZJTEUoJy9kZXYvTWVzc2FnZUJvdEV4dGVuc2lvbi5qcycpO1xyXG5cclxuXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIChlcnIpID0+IHtcclxuICAgIGlmIChlcnIubWVzc2FnZSAhPSAnU2NyaXB0IGVycm9yJykge1xyXG4gICAgICAgIHdpbmRvdy5ob29rLmNoZWNrKCdlcnJvcicsIGVycik7XHJcbiAgICB9XHJcbn0pO1xyXG4iLCJ2YXIgcGF0aHMgPSBbXHJcbiAgICAnLi9hbGVydCcsXHJcbiAgICAnLi9ub3RpZnknLFxyXG4gICAgJy4vdGVtcGxhdGUnLFxyXG4gICAgJy4vbmF2aWdhdGlvbicsXHJcbiAgICAnLi9jb25zb2xlJ1xyXG5dO1xyXG5cclxucGF0aHMuZm9yRWFjaChwYXRoID0+IHtcclxuICAgIE9iamVjdC5hc3NpZ24obW9kdWxlLmV4cG9ydHMsIHJlcXVpcmUocGF0aCkpO1xyXG59KTtcclxuIiwiLy8gQnVpbGQgdGhlIEFQSVxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZXhwb3J0cycpO1xyXG5cclxuLy8gQnVpbGQgdGhlIHBhZ2VcclxucmVxdWlyZSgnLi9wYWdlJyk7XHJcbnJlcXVpcmUoJy4vbGlzdGVuZXJzJyk7XHJcbiIsIi8vIExpc3RlbmVycyBmb3IgdXNlciBhY3Rpb25zIHdpdGhpbiB0aGUgYm90XHJcblxyXG4vLyAtLSBObyBkZXBlbmRlbmNpZXNcclxuXHJcbi8vIEF1dG8gc2Nyb2xsIHdoZW4gbmV3IG1lc3NhZ2VzIGFyZSBhZGRlZCB0byB0aGUgcGFnZSwgdW5sZXNzIHRoZSBvd25lciBpcyByZWFkaW5nIG9sZCBjaGF0LlxyXG4obmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gc2hvd05ld0NoYXQoKSB7XHJcbiAgICBsZXQgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2NvbnNvbGUgdWwnKTtcclxuICAgIGxldCBsYXN0TGluZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9jb25zb2xlIGxpOmxhc3QtY2hpbGQnKTtcclxuXHJcbiAgICBpZiAoIWNvbnRhaW5lciB8fCAhbGFzdExpbmUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvbnRhaW5lci5zY3JvbGxIZWlnaHQgLSBjb250YWluZXIuY2xpZW50SGVpZ2h0IC0gY29udGFpbmVyLnNjcm9sbFRvcCA8PSBsYXN0TGluZS5jbGllbnRIZWlnaHQgKiAyKSB7XHJcbiAgICAgICAgbGFzdExpbmUuc2Nyb2xsSW50b1ZpZXcoZmFsc2UpO1xyXG4gICAgfVxyXG59KSkub2JzZXJ2ZShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSBjaGF0JyksIHtjaGlsZExpc3Q6IHRydWV9KTtcclxuXHJcblxyXG4vLyBSZW1vdmUgb2xkIGNoYXQgdG8gcmVkdWNlIG1lbW9yeSB1c2FnZVxyXG4obmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gcmVtb3ZlT2xkQ2hhdCgpIHtcclxuICAgIHZhciBjaGF0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2NvbnNvbGUgdWwnKTtcclxuXHJcbiAgICB3aGlsZSAoY2hhdC5jaGlsZHJlbi5sZW5ndGggPiA1MDApIHtcclxuICAgICAgICBjaGF0LmNoaWxkcmVuWzBdLnJlbW92ZSgpO1xyXG4gICAgfVxyXG59KSkub2JzZXJ2ZShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfY29uc29sZSBjaGF0JyksIHtjaGlsZExpc3Q6IHRydWV9KTtcclxuXHJcblxyXG4vLyBDaGFuZ2UgZnVsbHNjcmVlbiB0YWJzXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNsZWZ0TmF2JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiBnbG9iYWxUYWJDaGFuZ2UoZXZlbnQpIHtcclxuICAgICB2YXIgdGFiTmFtZSA9IGV2ZW50LnRhcmdldC5kYXRhc2V0LnRhYk5hbWU7XHJcbiAgICBpZighdGFiTmFtZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvL0NvbnRlbnRcclxuICAgIC8vV2UgY2FuJ3QganVzdCByZW1vdmUgdGhlIGZpcnN0IGR1ZSB0byBicm93c2VyIGxhZ1xyXG4gICAgQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjY29udGFpbmVyID4gLnZpc2libGUnKSlcclxuICAgICAgICAuZm9yRWFjaChlbCA9PiBlbC5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJykpO1xyXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2NvbnRhaW5lciA+IFtkYXRhLXRhYi1uYW1lPSR7dGFiTmFtZX1dYCkuY2xhc3NMaXN0LmFkZCgndmlzaWJsZScpO1xyXG5cclxuICAgIC8vVGFic1xyXG4gICAgQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbGVmdE5hdiAuc2VsZWN0ZWQnKSlcclxuICAgICAgICAuZm9yRWFjaChlbCA9PiBlbC5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY3RlZCcpKTtcclxuICAgIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpO1xyXG59KTtcclxuXHJcblxyXG4vLyAtLSBEZXBlbmRzIG9uIFVJXHJcblxyXG52YXIgdWkgPSByZXF1aXJlKCcuL2V4cG9ydHMnKTtcclxuXHJcblxyXG4vLyBIaWRlIHRoZSBtZW51IHdoZW4gY2xpY2tpbmcgdGhlIG92ZXJsYXlcclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2xlZnROYXYgLm92ZXJsYXknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHVpLnRvZ2dsZU1lbnUpO1xyXG4iLCJ2YXIgYmhmYW5zYXBpID0gcmVxdWlyZSgnLi4vLi4vbGlicy9iaGZhbnNhcGknKTtcclxudmFyIHVpID0gcmVxdWlyZSgnLi4vZXhwb3J0cycpO1xyXG52YXIgaG9vayA9IHJlcXVpcmUoJy4uLy4uL2xpYnMvaG9vaycpO1xyXG52YXIgTWVzc2FnZUJvdEV4dGVuc2lvbiA9IHJlcXVpcmUoJy4uLy4uL01lc3NhZ2VCb3RFeHRlbnNpb24nKTtcclxuXHJcbi8vQ3JlYXRlIHRoZSBleHRlbnNpb24gc3RvcmUgcGFnZVxyXG5iaGZhbnNhcGkuZ2V0U3RvcmUoKS50aGVuKHJlc3AgPT4ge1xyXG4gICAgaWYgKHJlc3Auc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXh0cycpLmlubmVySFRNTCArPSByZXNwLm1lc3NhZ2U7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3AubWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgICByZXNwLmV4dGVuc2lvbnMuZm9yRWFjaChleHRlbnNpb24gPT4ge1xyXG4gICAgICAgIHVpLmJ1aWxkQ29udGVudEZyb21UZW1wbGF0ZSgnI2V4dFRlbXBsYXRlJywgJyNleHRzJywgW1xyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdoNCcsIHRleHQ6IGV4dGVuc2lvbi50aXRsZX0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ3NwYW4nLCBodG1sOiBleHRlbnNpb24uc25pcHBldH0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJy5leHQnLCAnZGF0YS1pZCc6IGV4dGVuc2lvbi5pZH0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ2J1dHRvbicsIHRleHQ6IGJoZmFuc2FwaS5leHRlbnNpb25JbnN0YWxsZWQoZXh0ZW5zaW9uLmlkKSA/ICdSZW1vdmUnIDogJ0luc3RhbGwnfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcbn0pLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcik7XHJcblxyXG4vLyBJbnN0YWxsIC8gdW5pbnN0YWxsIGV4dGVuc2lvbnNcclxuZnVuY3Rpb24gZXh0QWN0aW9ucyh0YWdOYW1lLCBlKSB7XHJcbiAgICBpZiAoZS50YXJnZXQudGFnTmFtZSAhPSB0YWdOYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIGVsID0gZS50YXJnZXQ7XHJcbiAgICB2YXIgaWQgPSBlbC5wYXJlbnRFbGVtZW50LmRhdGFzZXQuaWQ7XHJcblxyXG4gICAgaWYgKGVsLnRleHRDb250ZW50ID09ICdJbnN0YWxsJykge1xyXG4gICAgICAgIE1lc3NhZ2VCb3RFeHRlbnNpb24uaW5zdGFsbChpZCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIE1lc3NhZ2VCb3RFeHRlbnNpb24udW5pbnN0YWxsKGlkKTtcclxuICAgIH1cclxufVxyXG5cclxuZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2V4dHMnKVxyXG4gICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXh0QWN0aW9ucy5iaW5kKG51bGwsICdCVVRUT04nKSk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfZXh0X2xpc3QnKVxyXG4gICAgLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXh0QWN0aW9ucy5iaW5kKG51bGwsICdBJykpO1xyXG5cclxuXHJcbmhvb2sub24oJ2V4dGVuc2lvbi5pbnN0YWxsZWQnLCBmdW5jdGlvbihpZCkge1xyXG4gICAgLy9MaXN0XHJcbiAgICBiaGZhbnNhcGkuZ2V0RXh0ZW5zaW9uTmFtZShpZCkudGhlbihyZXNwID0+IHtcclxuICAgICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI21iX2V4dF9saXN0IHVsJyk7XHJcbiAgICAgICAgaWYgKHJlc3Auc3RhdHVzICE9ICdvaycpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHJlc3AubWVzc2FnZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgICAgIGxldCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xyXG4gICAgICAgIGxldCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG5cclxuICAgICAgICBzcGFuLnRleHRDb250ZW50ID0gYCR7cmVzcC5uYW1lfSAoJHtyZXNwLmlkfSlgO1xyXG4gICAgICAgIGEudGV4dENvbnRlbnQgPSAnUmVtb3ZlJztcclxuICAgICAgICBsaS5kYXRhc2V0LmlkID0gcmVzcC5pZDtcclxuXHJcbiAgICAgICAgbGkuYXBwZW5kQ2hpbGQoc3Bhbik7XHJcbiAgICAgICAgbGkuYXBwZW5kQ2hpbGQoYSk7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGxpKTtcclxuICAgIH0pLmNhdGNoKGJoZmFuc2FwaS5yZXBvcnRFcnJvcik7XHJcblxyXG4gICAgLy9TdG9yZVxyXG4gICAgdmFyIGJ1dHRvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNtYl9leHRlbnNpb25zIFtkYXRhLWlkPVwiJHtpZH1cIl0gYnV0dG9uYCk7XHJcbiAgICBpZiAoYnV0dG9uKSB7XHJcbiAgICAgICAgYnV0dG9uLnRleHRDb250ZW50ID0gJ1JlbW92ZSc7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuaG9vay5vbignZXh0ZW5zaW9uLnVuaW5zdGFsbGVkJywgZnVuY3Rpb24oaWQpIHtcclxuICAgIC8vTGlzdFxyXG4gICAgdmFyIGxpID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI21iX2V4dF9saXN0IFtkYXRhLWlkPVwiJHtpZH1cIl1gKTtcclxuICAgIGlmIChsaSkge1xyXG4gICAgICAgIGxpLnJlbW92ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vU3RvcmVcclxuICAgIHZhciBidXR0b24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbWJfZXh0ZW5zaW9ucyBbZGF0YS1pZD1cIiR7aWR9XCJdIGJ1dHRvbmApO1xyXG4gICAgaWYgKGJ1dHRvbikge1xyXG4gICAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9ICdSZW1vdmVkJztcclxuICAgICAgICBidXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICBidXR0b24udGV4dENvbnRlbnQgPSAnSW5zdGFsbCc7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIH0sIDMwMDApO1xyXG4gICAgfVxyXG59KTtcclxuIiwiLypnbG9iYWxzXHJcbiAgICBJTkNMVURFX0ZJTEVcclxuKi9cclxuXHJcbi8vIEJ1aWxkIHRoZSBwYWdlXHJcblxyXG5kb2N1bWVudC5oZWFkLmlubmVySFRNTCA9IElOQ0xVREVfRklMRSgnL2Rpc3QvdG1waGVhZC5odG1sJyk7XHJcblxyXG52YXIgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XHJcbnMudGV4dENvbnRlbnQgPSBJTkNMVURFX0ZJTEUoJy9kaXN0L3RtcGJvdC5jc3MnKTtcclxuZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzKTtcclxuXHJcbmRvY3VtZW50LmJvZHkuaW5uZXJIVE1MID0gSU5DTFVERV9GSUxFKFwiL2Rpc3QvdG1wYm9keS5odG1sXCIpO1xyXG5cclxucmVxdWlyZSgnLi4vLi4vcG9seWZpbGxzL2RldGFpbHMnKTtcclxuXHJcbnJlcXVpcmUoJy4vZXh0ZW5zaW9ucycpO1xyXG5yZXF1aXJlKCcuL3NldHRpbmdzJyk7XHJcbiIsInZhciB1aSA9IHJlcXVpcmUoJy4uL2V4cG9ydHMnKTtcclxudmFyIE1lc3NhZ2VCb3RFeHRlbnNpb24gPSByZXF1aXJlKCcuLi8uLi9NZXNzYWdlQm90RXh0ZW5zaW9uJyk7XHJcblxyXG5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbWJfYmFja3VwX2xvYWQnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIGxvYWRCYWNrdXAoKSB7XHJcbiAgICB1aS5hbGVydCgnRW50ZXIgdGhlIGJhY2t1cCBjb2RlOjx0ZXh0YXJlYSBzdHlsZT1cIndpZHRoOmNhbGMoMTAwJSAtIDdweCk7aGVpZ2h0OjE2MHB4O1wiPjwvdGV4dGFyZWE+JyxcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICB7IHRleHQ6ICdMb2FkICYgcmVmcmVzaCBwYWdlJywgc3R5bGU6ICdzdWNjZXNzJywgYWN0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQgdGV4dGFyZWEnKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGUgPSBKU09OLnBhcnNlKGNvZGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvZGUgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYmFja3VwJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVpLm5vdGlmeSgnSW52YWxpZCBiYWNrdXAgY29kZS4gTm8gYWN0aW9uIHRha2VuLicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGNvZGUpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBjb2RlW2tleV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICB7IHRleHQ6ICdDYW5jZWwnIH1cclxuICAgICAgICAgICAgICAgIF0pO1xyXG59KTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9sb2FkX21hbicpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gbG9hZEV4dGVuc2lvbigpIHtcclxuICAgIHVpLmFsZXJ0KCdFbnRlciB0aGUgSUQgb3IgVVJMIG9mIGFuIGV4dGVuc2lvbjo8YnI+PGlucHV0IHN0eWxlPVwid2lkdGg6Y2FsYygxMDAlIC0gN3B4KTtcIi8+JyxcclxuICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICB7dGV4dDogJ0FkZCcsIHN0eWxlOiAnc3VjY2VzcycsIGFjdGlvbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBleHRSZWYgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYWxlcnQgaW5wdXQnKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4dFJlZi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHRSZWYuc3RhcnRzV2l0aCgnaHR0cCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwuc3JjID0gZXh0UmVmO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoZWwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNZXNzYWdlQm90RXh0ZW5zaW9uLmluc3RhbGwoZXh0UmVmKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICAgICAgICAgIHt0ZXh0OiAnQ2FuY2VsJ31cclxuICAgICAgICAgICAgICAgIF0pO1xyXG59KTtcclxuXHJcbmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNtYl9iYWNrdXBfc2F2ZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gc2hvd0JhY2t1cCgpIHtcclxuICAgIHZhciBiYWNrdXAgPSBKU09OLnN0cmluZ2lmeShsb2NhbFN0b3JhZ2UpLnJlcGxhY2UoLzwvZywgJyZsdDsnKTtcclxuICAgIHVpLmFsZXJ0KGBDb3B5IHRoaXMgdG8gYSBzYWZlIHBsYWNlOjxicj48dGV4dGFyZWEgc3R5bGU9XCJ3aWR0aDogY2FsYygxMDAlIC0gN3B4KTtoZWlnaHQ6MTYwcHg7XCI+JHtiYWNrdXB9PC90ZXh0YXJlYT5gKTtcclxufSk7XHJcbiJdfQ==
