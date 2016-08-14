function BlockheadsAPI(ajax, worldId) { //jshint ignore:line
    var cache = {
        worldStarted: worldStarted(),
        getLogs: getLogs(),
        getLists: getLists(),
        getHomepage: getHomepage(),
        firstId: 0
    };

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
                                .then(check);
                        } else {
                            // World status is either startup, shutdown, or unavailible
                            fails++;
                            if (fails > 10) {
                                return reject();
                            }
                            setTimeout(check, 3000);
                        }
                    });
            }());
        });
    }

    function getLogs() {
        return cache.worldStarted.then(() => {
            return ajax.get(`/worlds/logs/${worldId}`)
                .then((log) => log.split('\n'));
            }
        );
    }

    function getLists() {
        return cache.worldStarted.then(() => ajax.get(`/worlds/lists/${worldId}`)
            .then((html) => {
                var doc = (new DOMParser()).parseFromString(html, 'text/html');

                function getList(name) {
                    return doc.querySelector(`textarea[name=${name}]`)
                            .value
                            .toLocaleUpperCase()
                            .split('\n');
                }

                var admin = getList('admins');
                var mod = getList('modlist');
                mod = mod.filter((name) => admin.indexOf(name) < 0 );
                var staff = admin.concat(mod);

                var white = getList('whitelist');
                var black = getList('blacklist');

                return {admin, mod, staff, white, black};
            })
        );
    }

    function getHomepage() {
        return ajax.get(`/worlds/${window.worldId}`);
    }

    var api = {};

    api.worldStarted = (refresh = false) => {
        if (refresh) {
            cache.worldStarted = worldStarted();
        }
        return cache.worldStarted();
    };

    api.getLogs = (refresh = false) => {
        if (refresh) {
            cache.getLogs = getLogs();
        }
        return cache.getLogs;
    };

    // An online list is maintained by the bot, this should NOT be used to get the online players frequently.
    api.getOnlinePlayers = (refresh = false) => {
        if (refresh) {
            cache.getHomepage = getHomepage();
        }
        return cache.getHomepage.then((html) => {
            var doc = (new DOMParser()).parseFromString(html, 'text/html');
            var playerElems = doc.querySelector('.manager.padded:nth-child(1)')
                .querySelectorAll('tr:not(.history)>td.left');
            var players = [];

            Array.from(playerElems).forEach((el) => {
                players.push(el.textContent.toLocaleUpperCase());
            });

            return players;
        });
    };

    api.getOwnerName = () => {
        return cache.getHomepage.then((html) => {
            var doc = (new DOMParser()).parseFromString(html, 'text/html');
            return doc.querySelector('.subheader~tr>td:not([class])').textContent.toLocaleUpperCase();
        });
    };

    api.sendMessage = (message) => ajax.postJSON(`/api`, { command: 'send', message, worldId });

    api.getMessages = () => {
        return cache.worldStarted
            .then(() => {
                ajax.postJSON(`/api`, { command: 'getchat', worldId, firstId: cache.firstId })
                    .then((data) => {
                        if (data.status == 'ok' && data.nextId != cache.firstId) {
                            cache.firstId = data.nextId;
                            return data.log;
                        } else if (data.status == 'error') {
                            throw new Error(data.message);
                        }
                    }
                );
            }
        );
    };

    return api;
}
