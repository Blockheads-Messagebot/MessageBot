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
