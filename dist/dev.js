//Imported vars / functions
/*global
    getAjax
    getHook
    BHFansAPI
    BlockheadsAPI
*/

//Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

// jshint ignore:start
function getAjax() { //jshint ignore:line
    /**
     * Helper function to make XHR requests.
     *
     * @param string protocol
     * @param string url
     * @param object paramObj -- WARNING. Only accepts shallow objects.
     * @return Promise
     */
    function xhr(protocol, url = '/', paramObj = {}) {
        var paramStr = Object.keys(paramObj)
                            .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(paramObj[k])}`)
                            .join('&');
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
                    reject(Error(req.statusText));
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
     * Function to GET a page. Passes the response of the XHR in the resolve promise.
     *
     * @param string url
     * @param string paramStr
     * @return Promise
     */
    function get(url = '/', paramObj = {}) {
        return xhr('GET', url, paramObj);
    }

    /**
     * Returns a JSON object in the promise resolve method.
      *
     * @param string url
     * @param object paramObj
     * @return Promise
     */
    function getJSON(url = '/', paramObj = {}) {
        return get(url, paramObj).then(JSON.parse);
    }

    /**
     * Function to make a post request
     *
     * @param string url
     * @param object paramObj
     * @return Promise
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

    return {xhr, get, getJSON, post, postJSON};
}

var getHook = (function() { //jshint ignore:line
    var listeners = {};

    function listen(key, callback) {
        if (!listeners[key]) {
            listeners[key] = [];
        }
        listeners[key].push(callback);
    }

    function call(key, initial, ...args) {
        if (!listeners[key]) {
            return initial;
        }

        return listeners[key].reduce(function(previous, current) {
            try {
                return current(previous, ...args);
            } catch(e) {
                console.log(e);
                return previous;
            }
        }, initial);
    }

    return function() {
        return {listen, call};
    };
}());

function BHFansAPI(ajax) { //jshint ignore:line
    var cache = {
        getStore: getStore(),
    };

    function getStore() {
        return ajax.getJSON('//blockheadsfans.com/messagebot/extension/store');
    }

    var api = {};

    // ids is an array of extension ids
    api.getExtensionNames = (ids) => ajax.postJSON('//blockheadsfans.com/messagebot/extension/name', {extensions: JSON.stringify(ids)});

    api.getStore = (refresh = false) => {
        if (refresh) {
            cache.getStore = getStore();
        }
        return cache.getStore();
    };

    // Loads the specified extension from BHFans
    api.startExtension = (id) => {
        var el = document.createElement('script');
        el.src = `//blockheadsfans.com/messagebot/extension/${id}/code/raw`;
        el.crossOrigin = 'anonymous';
        document.head.appendChild(el);
    };

    return api;
}

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
        return ajax.postJSON(`/api`, { command: 'getchat', worldId, firstId: cache.firstId })
            .then((data) => {
                if (data.status == 'ok' && data.nextId != cache.firstId) {
                    cache.firstId = data.nextId;
                    return data.log;
                } else if (data.status == 'error') {
                    throw new Error(data.message);
                }
            }
        );
    };

    return api;
}

// jshint ignore:end
var bot = MessageBot();
bot.start();

window.addEventListener('error', (err) => {
    //Wrap everything here in a try catch so that errors with our error reporting don't generate more errors to be reported... infinite loop.
    try {
        if (err.message == 'Script error') {
            return;
        }

        console.info('Reporting error:', err);
        bot.core.ajax.postJSON('//blockheadsfans.com/messagebot/bot/error',
            {
                world_name: bot.core.worldName,
                world_id: window.worldId,
                owner_name: bot.core.ownerName,
                bot_version: bot.version,
                error_text: err.message,
                error_file: err.filename,
                error_row: err.lineno,
                error_column: err.colno,
            })
            .then((resp) => {
                if (resp.status == 'ok') {
                    bot.ui.notify('Something went wrong, it has been reported.');
                } else {
                    throw new Error(resp.message);
                }
            })
            .catch((err) => {
                console.error(err);
                bot.ui.notify(`Error reporting exception: ${err}`);
            });
    } catch (e) {
        console.error(e);
    }
});
