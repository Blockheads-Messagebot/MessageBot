(function() {
    var apiLoad = performance.now();

    function logWithTime(...args) {
        console.info(
            ...args,
            'Took',
            ((performance.now() - apiLoad) / 1000).toFixed(3),
            'seconds'
        );
    }

    var api = function(ajax, worldId, hook, bhfansapi) {
        var world = {
            name: '',
            online: []
        };

        var cache = {
            worldStarted: worldStarted(),
            firstId: 0,
        };
        cache.getLogs = getLogs();
        cache.getLists = getLists();
        cache.getHomepage = getHomepage();

        cache.worldStarted.then(() => logWithTime('World online.'));
        cache.getLogs.then(() => logWithTime('Logs fetched.'));
        cache.getHomepage.then(() => logWithTime('Homepage fetched.'));
        cache.getLists.then(() => logWithTime('Lists fetched.'));

        function worldStarted() {
            return new Promise(function (resolve, reject) {
                var fails = 0;
                (function check() {
                    ajax.postJSON(`/api`, { command: 'status', worldId: worldId })
                        .then((world) => {
                            if (world.worldStatus == 'online') {
                                return resolve();
                            } else if (world.worldStatus == 'offline') {
                                ajax.postJSON('/api', { command: 'start', worldId: worldId })
                                    .then(check, check); //Check even if there is an error
                            } else {
                                // World status is either startup, shutdown, or unavailible
                                fails++;
                                if (fails > 10) {
                                    return reject();
                                }
                                setTimeout(check, 3000);
                            }
                        })
                        .catch(bhfansapi.reportError);
                }());
            });
        }

        function getLogs() {
            return api.worldStarted()
                .then(() => {
                    return ajax.get(`/worlds/logs/${worldId}`)
                        .then((log) => log.split('\n'));
                });
        }

        function getLists() {
            return api.worldStarted()
                .then(() => ajax.get(`/worlds/lists/${worldId}`))
                .then((html) => {
                    var doc = (new DOMParser()).parseFromString(html, 'text/html');

                    function getList(name) {
                        var list = doc.querySelector(`textarea[name=${name}]`)
                            .value
                            .toLocaleUpperCase()
                            .split('\n');
                        return [...new Set(list)]; //Remove duplicates
                    }

                    var admin = getList('admins');
                    var mod = getList('modlist');
                    mod = mod.filter((name) => admin.indexOf(name) < 0 );
                    var staff = admin.concat(mod);

                    var white = getList('whitelist');
                    var black = getList('blacklist');

                    return {admin, mod, staff, white, black};
                });
        }

        function getHomepage() {
            return ajax.get(`/worlds/${worldId}`)
                .catch(getHomepage);
        }

        var api = {};

        api.worldStarted = (refresh = false) => {
            if (refresh) {
                cache.worldStarted = worldStarted();
            }
            return cache.worldStarted
                .catch(() => api.worldStarted(true));
        };

        api.getLogs = (refresh = false) => {
            if (refresh) {
                api.worldStarted(true);
                cache.getLogs = getLogs();
            }
            return cache.getLogs
                .catch(() => api.getLogs(true));
        };

        // An online list is maintained by the bot, this should NOT be used to get the online players frequently.
        api.getOnlinePlayers = (refresh = false) => {
            if (refresh) {
                cache.getHomepage = getHomepage();
            }
            return cache.getHomepage
                .then((html) => {
                    var doc = (new DOMParser()).parseFromString(html, 'text/html');
                    var playerElems = doc.querySelector('.manager.padded:nth-child(1)')
                        .querySelectorAll('tr:not(.history)>td.left');
                    var players = [];

                    Array.from(playerElems).forEach((el) => {
                        players.push(el.textContent.toLocaleUpperCase());
                    });

                    return players;
                })
                .catch(() => api.getOnlinePlayers(true));
        };
        api.getOnlinePlayers()
            .then((players) => world.players = [...new Set(players.concat(world.players))]);

        api.getOwnerName = () => {
            return cache.getHomepage.then((html) => {
                var doc = (new DOMParser()).parseFromString(html, 'text/html');
                return doc.querySelector('.subheader~tr>td:not([class])').textContent.toLocaleUpperCase();
            });
        };

        api.getWorldName = () => {
            return cache.getHomepage.then((html) => {
                var doc = (new DOMParser()).parseFromString(html, 'text/html');
                return doc.querySelector('#title').textContent;
            });
        };
        api.getWorldName().then((name) => world.name = name);

        api.send = (message) => {
            return ajax.postJSON(`/api`, { command: 'send', message, worldId })
                .then(function(resp) {
                    hook.check('world.send', message);
                    hook.check('world.servermessage', message);
                    if (message.startsWith('/')) {
                        let command = message.substr(1);

                        //Disallow commands starting with space.
                        if (!command.startsWith(' ')) {
                            let args = '';
                            if (command.includes(' ')) {
                                command = command.substring(0, command.indexOf(' '));
                                args = message.substring(message.indexOf(' ') + 1);
                            }
                            hook.check('world.command', 'SERVER', command, args);
                        }
                    }

                    return resp;
                })
                .catch(() => api.send(message));
        };

        function getMessages() {
            return cache.worldStarted
                .then(() => ajax.postJSON(`/api`, { command: 'getchat', worldId, firstId: cache.firstId }))
                .then((data) => {
                    if (data.status == 'ok' && data.nextId != cache.firstId) {
                        cache.firstId = data.nextId;
                        return data.log;
                    } else if (data.status == 'error') {
                        throw new Error(data.message);
                    }
                    return [];
                });
        }

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

        function checkChat() {
            getMessages().then((msgs) => {
                msgs.forEach((message) => {
                    if (message.startsWith(`${world.name} - Player Connected `)) {
                        let name = message.substring(
                            world.name.length + 20,
                            message.lastIndexOf('|', message.lastIndexOf('|') - 1) - 1
                        );
                        let ip = message.substring(
                            message.lastIndexOf(' | ', message.lastIndexOf(' | ') - 1) + 3,
                            message.lastIndexOf(' | ')
                        );

                        if (!world.online.includes(name)) {
                            world.online.push(name);
                        }
                        hook.check('world.join', name, ip);

                    } else if (message.startsWith(`${world.name} - Player Disconnected `)) {
                        let name = message.substring(world.name.length + 23);

                        if (world.online.includes(name)) {
                            world.online.splice(world.online.indexOf(name), 1);
                        }
                        hook.check('world.leave', name);

                    } else if (message.includes(': ')) {
                        let name = getUsername(message);
                        let msg = message.substring(name.length + 2);

                        if (name == 'SERVER') {
                            hook.check('world.serverchat', msg);
                        } else {
                            hook.check('world.message', name, msg);

                            if (msg.startsWith('/')) {

                                let command = msg.substr(1);

                                //Disallow commands starting with space.
                                if (!command.startsWith(' ')) {
                                    let args = '';
                                    if (command.includes(' ')) {
                                        command = command.substring(0, command.indexOf(' '));
                                        args = msg.substring(msg.indexOf(' ') + 1);
                                    }
                                    hook.check('world.command', name, command, args);
                                    return;
                                }
                            }

                            hook.check('world.chat', name, message);
                        }

                    } else {
                        hook.check('world.other', message);
                    }
                });
            })
            .catch(bhfansapi.reportError)
            .then(() => {
                setTimeout(checkChat, 5000);
            });
        }
        checkChat();

        api.getLists = (refresh = false) => {
            if (refresh) {
                api.worldStarted(true);
                cache.getLists = getLists();
            }

            return cache.getLists;
        };

        return api;
    };

    window.BlockheadsAPI = api;
}());
