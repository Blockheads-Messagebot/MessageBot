//Imported vars / functions
/*globals
    getAjax,
    getHook,
    getStorage,
    BHFansAPI,
    BlockheadsAPI,
    MessageBot,
    MessageBotUI
*/

//Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

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

// jshint ignore:start
(function(storage) {
    function update(keys, operator) {
        Object.keys(storage).forEach(item => {
            for (let key of keys) {
                if (item.startsWith(key)) {
                    storage.setItem(item, operator(storage.getItem(item)));
                    break;
                }
            }
        });
    }

    if (!storage.length) {
        return; //New install, nothing to migrate.
    }

    //jshint -W086
    //No break statements as we want to execute all updates after matched version.
    switch (storage.getItem('mb_version')) {
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
    }
    //jshint +W086
}(localStorage));
 //Update localStorage entries with old data
(function() {
    var ajax = (function() { //jshint ignore:line
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
    }());

    window.ajax = ajax;
}());
 //Browser
(function() {
    var hook = (function() {
        var listeners = {};

        function listen(key, callback) {
            key = key.toLocaleLowerCase();
            if (!listeners[key]) {
                listeners[key] = [];
            }
            listeners[key].push(callback);
        }

        function remove(key, callback) {
            key = key.toLocaleLowerCase();
            if (listeners[key]) {
                if (listeners[key].includes(callback)) {
                    listeners[key].splice(listeners[key].indexOf(callback), 1);
                }
            }
        }

        function check(key, ...args) {
            key = key.toLocaleLowerCase();
            if (!listeners[key]) {
                return;
            }

            listeners[key].forEach(function(listener) {
                try {
                    listener(...args);
                } catch (e) {
                    console.error(e);
                }
            });
        }

        function update(key, initial, ...args) {
            key = key.toLocaleLowerCase();
            if (!listeners[key]) {
                return initial;
            }

            return listeners[key].reduce(function(previous, current) {
                // Just a precaution...
                try {
                    var result = current(previous, ...args);
                    if (typeof result != 'undefined') {
                        return result;
                    }
                    return previous;
                } catch(e) {
                    console.log(e);
                    return previous;
                }
            }, initial);
        }

        return {
            listen,
            remove,
            check,
            update,
        };
    }());

    //Node & Browser
    //jshint -W117
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = hook;
    } else {
        window.hook = hook;
    }
}());
 //Node + Browser
(function() {
    var apiLoad = performance.now();

    function logWithTime(...args) {
        console.info.call(
            null,
            ...args,
            'Took',
            ((performance.now() - apiLoad) / 1000).toFixed(3),
            'seconds'
        );
    }

    var api = function(ajax, worldId, hook) {
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
                });
        }

        function getLists() {
            return cache.worldStarted
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
            return ajax.get(`/worlds/${worldId}`);
        }

        var api = {};

        api.worldStarted = (refresh = false) => {
            if (refresh) {
                cache.worldStarted = worldStarted();
            }
            return cache.worldStarted;
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
            hook.check('world.send', message);
            return ajax.postJSON(`/api`, { command: 'send', message, worldId });
        };

        function getMessages() {
            return cache.worldStarted.then(() => {
                    return ajax.postJSON(`/api`, { command: 'getchat', worldId, firstId: cache.firstId })
                    .then((data) => {
                        if (data.status == 'ok' && data.nextId != cache.firstId) {
                            cache.firstId = data.nextId;
                            return data.log;
                        } else if (data.status == 'error') {
                            throw new Error(data.message);
                        }
                        return [];
                    }
                );
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
                            hook.check('world.servermessage', msg);
                        } else {
                            hook.check('world.message', name, msg);

                            if (msg.startsWith('/')) {
                                //Command message, those from server not caught here
                                var command = message.substring(1, message.indexOf(' '));
                                var args = message.substring(command.length + 2);

                                hook.check('world.command', name, command, args);
                                return;
                            }

                            hook.check('world.chat', name, message);
                        }

                    } else {
                        hook.check('world.other', message);
                    }
                });
            })
            .then(() => {
                setTimeout(checkChat, 5000);
            });
        }
        checkChat();

        api.getLists = (refresh = false) => {
            if (refresh) {
                cache.getLists = getLists();
            }

            return cache.getLists;
        };

        return api;
    };

    window.BlockheadsAPI = api;
}());
 //Browser -- Depends: ajax, worldId, hook
window.api = BlockheadsAPI(window.ajax, window.worldId, window.hook);
(function() {
    var storage = function(worldId) {
        function getString(key, fallback, local = true) {
            var result;
            if (local) {
                result = localStorage.getItem(`${key}${worldId}`);
            } else {
                result = localStorage.getItem(key);
            }

            return (result === null) ? fallback : result;
        }

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

        function set(key, data, local = true) {
            if (local) {
                key = `${key}${worldId}`;
            }

            if (typeof data == 'string') {
                localStorage.setItem(key, data);
            } else {
                localStorage.setItem(key, JSON.stringify(data));
            }
        }

        function clearNamespace(namespace) {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(namespace)) {
                    localStorage.removeItem(key);
                }
            });
        }

        return {getString, getObject, set, clearNamespace};
    };

    //Node doesn't have localStorage.
    window.CreateStorage = storage;
}());
 //Browser -- Depends: worldId
window.storage = CreateStorage(window.worldId);
(function() {
    function api(ajax, storage) {
        var cache = {
            getStore: getStore(),
        };

        var extensions = [];

        function getStore() {
            return ajax.getJSON('//blockheadsfans.com/messagebot/extension/store');
        }

        function listExtensions() {
            var target = document.querySelector('#mb_ext_list');

            api.getExtensionNames(extensions).then((resp) => {
                if (resp.status == 'ok') {
                    if (!resp.extensions.length) {
                        target.innerHTML = '<p>No extensions installed</p>';
                        return;
                    }
                    target.innerHTML = resp.extensions
                        .reduce((html, ext) => {
                            return `${html}<li>${ext.name.replace(/</g, '&lt;')} (${ext.id}) <a onclick="bhfansapi.removeExtension(\'${ext.id}\');" class="button">Remove</a></li>`;
                        }, '<ul style="margin-left:1.5em;">') + '</ul>';
                } else {
                    target.innerHTML = `Error fetching extension names: ${resp.message}`;
                    throw new Error(resp.message);
                }
            })
            .catch(api.reportError);
        }


        var api = {};

        // ids is an array of extension ids
        api.getExtensionNames = (ids) => ajax.postJSON('//blockheadsfans.com/messagebot/extension/name', {extensions: JSON.stringify(ids)});

        api.getStore = (refresh = false) => {
            if (refresh) {
                cache.getStore = getStore();
            }
            return cache.getStore;
        };

        // Loads the specified extension from BHFans
        api.startExtension = (id) => {
            var el = document.createElement('script');
            el.src = `//blockheadsfans.com/messagebot/extension/${id}/code/raw`;
            el.crossOrigin = 'anonymous';
            document.head.appendChild(el);

            listExtensions();
        };
        //Delay starting extensions - avoids some odd bugs
        setTimeout(function() {
            storage.getObject('mb_extensions', [], false).forEach(api.startExtension);
        }, 1000);


        api.removeExtension = (id) => {
            //Try to call the uninstall function
            try {
                window[id].uninstall();
            } catch(e) {
                // Normal if an uninstall function was not defined.
            }
            window[id] = undefined;

            if (extensions.includes(id)) {
                extensions.splice(extensions.indexOf(id), 1);
                storage.set('mb_extensions', extensions, false);

                var button = document.querySelector(`#mb_extensions div[data-id=${id}] button`);
                if (button !== null) {
                    button.textContent = 'Removed';
                    button.disabled = true;
                    setTimeout(() => {
                        button.textContent = 'Install';
                        button.disabled = false;
                    }, 3000);
                }
                listExtensions();
            }
        };

        api.extensionInstalled = (id) => {
            return extensions.includes(id);
        };

        //FIXME: Avoid relying on window.bot.ui
        api.reportError = (err) => {
            console.error(err);
            ajax.postJSON('//blockheadsfans.com/messagebot/bot/error',
            {
                error_text: err.message,
                error_file: err.filename,
                error_row: err.lineno || 0,
                error_column: err.colno || 0,
            })
            .then((resp) => {
                if (resp.status == 'ok') {
                    window.bot.ui.notify('Something went wrong, it has been reported.');
                } else {
                    throw new Error(resp.message);
                }
            })
            .catch((err) => {
                console.error(err);
                window.bot.ui.notify(`Error reporting exception: ${err}`);
            });
        };

        api.autoloadExtension = (id, shouldAutoload) => {
            if (!api.extensionInstalled(id) && shouldAutoload) {
                extensions.push(id);
                listExtensions();
            } else if (!shouldAutoload) {
                if (api.extensionInstalled(id)) {
                    extensions.splice(extensions.indexOf(id), 1);
                }
            }

            storage.set('mb_extensions', extensions, false);
        };

        setTimeout(listExtensions, 500);
        return api;
    }

    window.CreateBHFansAPI = api;
}());
 //Depends: ajax, storage
window.bhfansapi = CreateBHFansAPI(window.ajax, window.storage);
(function() {
    var create = function(hook, bhfansapi) { //jshint ignore:line
        var uniqueMessageID = 0;

        document.head.innerHTML = '<title>Console</title> <meta name="viewport" content="width=device-width,initial-scale=1"> ';
        document.head.innerHTML += '<style>html,body{min-height:100vh;position:relative;width:100%;margin:0;font-family:"Lucida Grande","Lucida Sans Unicode",Verdana,sans-serif;color:#000}textarea,input,button,select{font-family:inherit}a{cursor:pointer;color:#182b73}.overlay{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99;background:rgba(0,0,0,0.7);visibility:hidden;opacity:0;transition:opacity .5s}.overlay.visible{visibility:visible;opacity:1;transition:opacity .5s}#botTemplates{display:none}header{background:#182b73 url("http://portal.theblockheads.net/static/images/portalHeader.png") no-repeat;background-position:80px;height:80px}#jMsgs,#lMsgs,#tMsgs,#aMsgs,#exts{padding-top:8px;margin-top:8px;border-top:1px solid;height:calc(100vh - 165px)}.third-box,#mb_join .msg,#mb_leave .msg,#mb_trigger .msg,#mb_announcements .msg,#mb_extensions .ext{position:relative;float:left;width:calc(33% - 19px);min-width:280px;padding:5px;margin-left:5px;margin-bottom:5px;border:3px solid #999;border-radius:10px}.third-box:nth-child(odd),#mb_join .msg:nth-child(odd),#mb_leave .msg:nth-child(odd),#mb_trigger .msg:nth-child(odd),#mb_announcements .msg:nth-child(odd),#mb_extensions .ext:nth-child(odd){background:#ccc}.top-right-button,#mb_join .add,#mb_leave .add,#mb_trigger .add,#mb_announcements .add,#mb_extensions #mb_load_man{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:10px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}.button,#mb_extensions .ext button,#alert>.buttons>span{display:inline-block;padding:6px 12px;margin:0 5px;text-align:center;white-space:nowrap;cursor:pointer;border:1px solid rgba(0,0,0,0.15);border-radius:6px;background:#fff linear-gradient(to bottom, #fff 0, #e0e0e0 100%)}#leftNav{text-transform:uppercase}#leftNav nav{width:250px;background:#182b73;color:#fff;position:fixed;left:-250px;z-index:100;top:0;bottom:0;transition:left .5s}#leftNav details,#leftNav span{display:block;text-align:center;padding:5px 7px;border-bottom:1px solid white}#leftNav .selected{background:radial-gradient(#9fafeb, #182b73)}#leftNav summary ~ span{background:rgba(159,175,235,0.4)}#leftNav summary+span{border-top-left-radius:20px;border-top-right-radius:20px}#leftNav summary ~ span:last-of-type{border:0;border-bottom-left-radius:20px;border-bottom-right-radius:20px}#leftNav input{display:none}#leftNav label{color:#fff;background:#213b9d;padding:5px;position:fixed;top:5px;z-index:100;left:5px;opacity:1;transition:left .5s,opacity .5s}#leftNav input:checked ~ nav{left:0;transition:left .5s}#leftNav input:checked ~ label{left:255px;opacity:0;transition:left .5s,opacity .5s}#leftNav input:checked ~ .overlay{visibility:visible;opacity:1;transition:opacity .5s}#container>div{height:calc(100vh - 100px);padding:10px;position:absolute;top:80px;left:0;right:0;overflow:auto}#container>div:not(.visible){display:none}#mb_console .chat{height:calc(100vh - 220px)}@media screen and (min-width: 668px){#mb_console .chat{height:calc(100vh - 155px)}}#mb_console ul{height:100%;overflow-y:auto;margin:0;padding:0}#mb_console li{list-style-type:none}#mb_console .controls{display:flex;padding:0 10px}#mb_console input,#mb_console button{margin:5px 0}#mb_console input{font-size:1em;padding:1px;flex:1;border:solid 1px #999}#mb_console button{background:#182b73;font-weight:bold;color:#fff;border:0;height:40px;padding:1px 4px}#mb_console .mod>span:first-child{color:#05f529}#mb_console .admin>span:first-child{color:#2b26bd}#mb_settings h3{border-bottom:1px solid #999}#mb_settings a{text-decoration:underline}#mb_settings a.button{text-decoration:none;font-size:0.9em;padding:1px 5px}#mb_join h3,#mb_leave h3,#mb_trigger h3,#mb_announcements h3{margin:0 0 5px 0}#mb_join input,#mb_join textarea,#mb_leave input,#mb_leave textarea,#mb_trigger input,#mb_trigger textarea,#mb_announcements input,#mb_announcements textarea{border:2px solid #666;width:calc(100% - 10px)}#mb_join textarea,#mb_leave textarea,#mb_trigger textarea,#mb_announcements textarea{resize:none;overflow:hidden;padding:1px 0;height:21px;transition:height .5s}#mb_join textarea:focus,#mb_leave textarea:focus,#mb_trigger textarea:focus,#mb_announcements textarea:focus{height:5em}#mb_join input[type="number"],#mb_leave input[type="number"],#mb_trigger input[type="number"],#mb_announcements input[type="number"]{width:5em}#mb_extensions #mb_load_man{width:inherit;padding:0 7px}#mb_extensions h3{margin:0 0 5px 0}#mb_extensions .ext{height:130px}#mb_extensions .ext h4,#mb_extensions .ext p{margin:0}#mb_extensions .ext button{position:absolute;bottom:7px;padding:5px 8px}#alert{visibility:hidden;position:fixed;top:50px;left:0;right:0;margin:auto;z-index:101;width:50%;min-width:300px;min-height:200px;background:#fff;border-radius:10px;padding:10px 10px 55px 10px}#alert.visible{visibility:visible}#alert>div{webkit-overflow-scrolling:touch;max-height:65vh;overflow-y:auto}#alert>.buttons{position:absolute;bottom:10px;left:5px}#alert>.buttons [class]{color:#fff}#alert>.buttons .success{background:#5cb85c linear-gradient(to bottom, #5cb85c 0, #419641 100%);border-color:#3e8f3e}#alert>.buttons .info{background:#5bc0de linear-gradient(to bottom, #5bc0de 0, #2aabd2 100%);border-color:#28a4c9}#alert>.buttons .danger{background:#d9534f linear-gradient(to bottom, #d9534f 0, #c12e2a 100%);border-color:#b92c28}#alert>.buttons .warning{background:#f0ad4e linear-gradient(to bottom, #f0ad4e 0, #eb9316 100%);border-color:#e38d13}.notification{opacity:0;transition:opacity 1s;position:fixed;top:1em;right:1em;min-width:200px;border-radius:5px;padding:5px;background:#9fafeb}.notification.visible{opacity:1}<style>';
        document.body.innerHTML = '<div id="leftNav"> <input type="checkbox" id="leftToggle"> <label for="leftToggle">&#9776; Menu</label> <nav data-tab-group="main"> <span class="tab selected" data-tab-name="console">Console</span> <details data-tab-group="messages"> <summary>Messages</summary> <span class="tab" data-tab-name="join">Join</span> <span class="tab" data-tab-name="leave">Leave</span> <span class="tab" data-tab-name="trigger">Trigger</span> <span class="tab" data-tab-name="announcements">Announcements</span> </details> <span class="tab" data-tab-name="extensions">Extensions</span> <span class="tab" data-tab-name="settings">Settings</span> <div class="clearfix"> </nav> <div class="overlay"></div> </div> <div id="botTemplates"> <template id="jlTemplate"> <div class="msg"> <label>When the player is </label> <select> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> joins, then say </label> <textarea class="m"></textarea> <label> in chat if the player has joined between </label> <input type="number" value="0"> <label> and </label> <input type="number" value="9999"> <label> times.</label><br> <a>Delete</a> </div> </template> <template id="tTemplate"> <div class="msg"> <label>When </label> <select> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> says </label> <input class="t"> <label> in chat, say </label> <textarea class="m"></textarea> <label> if the player has joined between </label> <input type="number" value="0"> <label> and </label> <input type="number" value="9999"> <label>times. </label><br> <a>Delete</a> </div> </template> <template id="aTemplate"> <div class="ann"> <label>Send:</label> <textarea class="m"></textarea> <a>Delete</a> <label style="display:block;margin-top:5px">Wait X minutes...</label> </div> </template> <template id="extTemplate"> <div class="ext"> <h4>Title</h4> <span>Description</span><br> <button class="button">Install</button> </div> </template> </div> <div id="container"> <header></header> <div id="mb_console" data-tab-name="console" class="visible"> <div class="chat"> <ul></ul> </div> <div class="controls"> <input type="text" disabled="disabled"><button disabled="disabled">SEND</button> </div> </div> <div id="mb_join" data-tab-name="join"> <h3>These are checked when a player joins the server.</h3> <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="jMsgs"></div> </div> <div id="mb_leave" data-tab-name="leave"> <h3>These are checked when a player leaves the server.</h3> <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="lMsgs"></div> </div> <div id="mb_trigger" data-tab-name="trigger"> <h3>These are checked whenever someone says something.</h3> <span>You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger "te*st" will match "tea stuff" and "test")</span> <span class="add">+</span> <div id="tMsgs"></div> </div> <div id="mb_announcements" data-tab-name="announcements"> <h3>These are sent according to a regular schedule.</h3> <span>If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span> <span class="add">+</span> <div id="aMsgs"></div> </div> <div id="mb_extensions" data-tab-name="extensions"> <h3>Extensions can increase the functionality of the bot.</h3> <span>Interested in creating one? <a href="https://github.com/Bibliofile/Blockheads-MessageBot/wiki" target="_blank">Click here.</a></span> <span id="mb_load_man">Load By ID/URL</span> <div id="exts"></div> </div> <div id="mb_settings" data-tab-name="settings"> <h3>Settings</h3> <label for="mb_ann_delay">Minutes between announcements: </label><br> <input id="mb_ann_delay" type="number"><br> <label for="mb_resp_max">Maximum trigger responses to a message: </label><br> <input id="mb_resp_max" type="number"><br> <label for="mb_notify_message">New chat notifications: </label> <input id="mb_notify_message" type="checkbox"><br> <h3>Advanced Settings</h3> <a href="https://github.com/Bibliofile/Blockheads-MessageBot/wiki/Advanced-Options" target="_blank">Read this first</a><br> <label for="mb_disable_trim">Disable whitespace trimming: </label> <input id="mb_disable_trim" type="checkbox"><br> <label for="mb_regex_triggers">Parse triggers as RegEx: </label> <input id="mb_regex_triggers" type="checkbox"><br> <h3>Extensions</h3> <div id="mb_ext_list"></div> <h3>Backup / Restore</h3> <a id="mb_backup_save">Get backup code</a><br> <a id="mb_backup_load">Load previous backup</a> <div id="mb_backup"></div> </div> </div> <div id="alertWrapper"> <div id="alert"> <div id="alertContent"></div> <div class="buttons"></div> </div> <div class="overlay"> ';

        var mainToggle = document.querySelector('#leftNav input');

        function listenerHook(selector, type, hookname) {
            document.querySelector(selector)
                .addEventListener(type, () => hook.check(`ui.${hookname}`));
        }

        ['jMsgs', 'lMsgs', 'tMsgs', 'aMsgs'].forEach((id) => {
            listenerHook(`#${id}`, 'change', 'messageChanged');
        });
        listenerHook('#mb_settings', 'change', 'prefChanged');

        //Auto scrolls to the latest chat message, if the owner isn't reading old chat.
        hook.listen('ui.addmessagetopage', function showNewChat() {
            let container = document.querySelector('#mb_console ul');
            let lastLine = document.querySelector('#mb_console li:last-child');

            if (container.scrollHeight - container.clientHeight - container.scrollTop <= lastLine.clientHeight * 2) {
                lastLine.scrollIntoView(false);
            }
        });

        //Avoids the size of the page growing unboundedly
        hook.listen('ui.addmessagetopage', function removeOldChat() {
            var chat = document.querySelector('#mb_console ul');

            while (chat.children.length > 500) {
                chat.children[0].remove();
            }
        });

        //Install / uninstall extensions
        document.querySelector('#exts').addEventListener('click', function extActions(e) {
            if (e.target.tagName != 'BUTTON') {
                return;
            }
            var button = e.target;
            var extId = button.parentElement.dataset.id;

            if (button.textContent == 'Install') {
                bhfansapi.startExtension(extId);
                button.textContent = 'Remove';
            } else {
                bhfansapi.removeExtension(extId);
            }
        });

        //Change screen tabs
        document.querySelector('#leftNav').addEventListener('click', function globalTabChange(event) {
            var tabName = event.target.dataset.tabName;
            if(!tabName) {
                return;
            }

            //Content
            //We can't just remove the first due to browser lag
            Array.from(document.querySelectorAll('#container > .visible'))
                .forEach((el) => el.classList.remove('visible'));
            document.querySelector(`#container [data-tab-name=${tabName}]`).classList.add('visible');

            //Tabs
            document.querySelector('#leftNav .selected').classList.remove('selected');
            event.target.classList.add('selected');
        });

        //Template polyfill, IE
        if (!('content' in document.createElement('template'))) {
            let templates = document.getElementsByTagName('template');

            for (let i = 0; i < templates.length; i++) {
                let template = templates[i];
                let content = template.childNodes;
                let fragment = document.createDocumentFragment();

                for (let j = 0; j < content.length; j++) {
                    fragment.appendChild(content[j]);
                }

                template.content = fragment;
            }
        }

        //Details polyfill, older firefox, IE
        if (!('open' in document.createElement('details'))) {
            let style = document.createElement('style');
            style.textContent += 'details:not([open]) > :not(summary) { display: none !important; }' +
                'details > summary:before { content: "▶"; display: inline-block; font-size: .8em; width: 1.5em; font-family:"Courier New"; }' +
                'details[open] > summary:before { transform: rotate(90deg); }';
            document.head.appendChild(style);

            window.addEventListener('click', function(event) {
                if (event.target.tagName == 'SUMMARY') {
                    var details = event.target.parentNode;

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

        //Create the store page
        bhfansapi.getStore().then(resp => {
            if (resp.status != 'ok') {
                bhfansapi.reportError(new Error(resp.message));
                document.getElementById('exts').innerHTML += resp.message;
                return;
            }
            resp.extensions.forEach(extension => {
                ui.buildContentFromTemplate('#extTemplate', '#exts', [
                    {selector: 'h4', text: extension.title},
                    {selector: 'span', html: extension.snippet},
                    {selector: '.ext', 'data-id': extension.id},
                    {selector: 'button', text: bhfansapi.extensionInstalled(extension.id) ? 'Remove' : 'Install'}
                ]);
            });
        });

        // Used by the user to add new messages
        function addEmptyMsg(e) {
            var containerElem = e.target.parentElement.querySelector('div');
            var template;

            switch (containerElem.id) {
                case 'jMsgs':
                case 'lMsgs':
                    template = document.getElementById('jlTemplate');
                    break;
                case 'tMsgs':
                    template = document.getElementById('tTemplate');
                    break;
                default:
                    template = document.getElementById('aTemplate');
            }

            ui.addMsg(containerElem, template, {});

            e.stopPropagation();
        }
        Array.from(document.querySelectorAll('span.add')).forEach((el) => {
            el.addEventListener('click', addEmptyMsg);
        });

        var ui = {};

        /**
         * Adds a message to the specified container using the specified template and saved properties.
         * It is not encouraged for extension developers to call this function.
         *
         * @param element container
         * @param element template
         * @param object saveObj
         */
        ui.addMsg = function addMsg(container, template, saveObj) {
            var content = template.content;
            content.querySelector('div').id = 'm' + uniqueMessageID;
            content.querySelector('.m').value = saveObj.message || '';

            if (template.id != 'aTemplate') {
                var numInputs = content.querySelectorAll('input[type="number"]');
                numInputs[0].value = saveObj.joins_low || 0;
                numInputs[1].value = saveObj.joins_high || 9999;
                if (template.id == 'tTemplate') {
                    content.querySelector('.t').value = saveObj.trigger || '';
                }
            }
            container.appendChild(document.importNode(content, true));

            //Groups done after appending or it doesn't work.
            if (template.id != 'aTemplate') {
                var selects = document.querySelectorAll('#m' + uniqueMessageID + ' > select');

                selects[0].value = saveObj.group || 'All';

                selects[1].value = saveObj.not_group || 'Nobody';
            }

            document.querySelector('#m' + uniqueMessageID + ' > a')
                .addEventListener('click', function(e) {
                    ui.alert('Really delete this message?', [
                        {text: 'Yes', style: 'success', action: function() {
                            this.remove();
                            hook.check('ui.messageDeleted');
                        }, thisArg: e.target.parentElement},
                        {text: 'Cancel'}
                    ]);
                }, false);

            uniqueMessageID++;
            hook.check('ui.messageAdded');
        };


        var alert = {
            active: false,
            queue: [],
            buttons: {},
        };

        function buttonHandler(event) {
            var button = alert.buttons[event.target.id] || {};
            button.thisArg = button.thisArg || undefined;
            button.dismiss = typeof button.dismiss == 'boolean' ? button.dismiss : true;
            if (typeof button.action == 'function') {
                button.action.call(button.thisArg);
            }

            //Require that there be an action asociated with no-dismiss buttons.
            if (button.dismiss || typeof button.action != 'function') {
                document.querySelector('#alert').classList.remove('visible');
                document.querySelector('#alert ~ .overlay').classList.remove('visible');
                document.querySelector('#alert .buttons').innerHTML = '';
                alert.buttons = {};
                alert.active = false;

                // Are more alerts waiting to be shown?
                if (alert.queue.length) {
                    let alert = alert.queue.shift();
                    ui.alert(alert.text, alert.buttons);
                }
            }
        }

        /**
        * Function used to require action from the user.
        *
        * @param string text the text to display in the alert
        * @param Array buttons an array of buttons to add to the alert.
        *        Format: [{text: 'Test', style:'success', action: function(){}, thisArg: window, dismiss: false}]
        *        Note: text is the only required paramater. If no button array is specified
        *        then a single OK button will be shown.
        *         Provided styles: success, danger, warning, info
        *        Defaults: style: '', action: undefined, thisArg: undefined, dismiss: true
        * @return void
        */
        ui.alert = function(text, buttons = [{text: 'OK'}]) {
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

            if (alert.active) {
                alert.queue.push({text, buttons});
                return;
            }
            alert.active = true;

            buttons.forEach(function(button, i) {
                button.dismiss = (button.dismiss === false) ? false : true; //Require that dismiss be set to false, otherwise true
                alert.buttons['button_' + i] = {action: button.action, thisArg: button.thisArg, dismiss: button.dismiss};
                button.id = 'button_' + i;
                buildButton(button);
            });
            document.querySelector('#alertContent').innerHTML = text;

            document.querySelector('#alert ~ .overlay').classList.add('visible');
            document.querySelector('#alert').classList.add('visible');
        };

        /**
        * Function used to send a non-critical alert to the user.
        * Should be used in place of ui.alert if possible as it is non-blocking.
        *
        * @param String text the text to display. Should be kept short to avoid visually blocking the menu on small devices.
        * @param Number displayTime the number of seconds to show the notification for.
        */
        ui.notify = function(text, displayTime = 2) {
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
        };

        /**
         * Hides / shows the menu
         *
         * @return void
         */
        ui.toggleMenu = function() {
            mainToggle.checked = !mainToggle.checked;
        };

        /**
         * Used to add a tab to the bot's navigation.
         *
         * @param string tabText
         * @param string groupName Optional. If provided, the name of the group of tabs to add this tab to.
         * @return div - The div to place tab content in
         */
        ui.addTab = (function () {
            var tabNameUID = 0;

            return function addTab(tabText, groupName = 'main') {
                var tabName = 'botTab_' + tabNameUID++;

                var tab = document.createElement('span');
                tab.textContent = tabText;
                tab.classList.add('tab');
                tab.dataset.tabName = tabName;

                var tabContent = document.createElement('div');
                tabContent.dataset.tabName = tabName;

                document.querySelector(`#leftNav [data-tab-group=${groupName}]`).appendChild(tab);
                document.querySelector('#container').appendChild(tabContent);

                return tabContent;
            };
        }());

        /**
         * Removes a global tab by it's id.
         *
         * @param div tabContent The div returned by the addTab function.
         */
        ui.removeTab = function removeTab(tabContent) {
            document.querySelector(`#leftNav [data-tab-name=${tabContent.dataset.tabName}]`).remove();
            tabContent.remove();
        };

        /**
         * Creates a tab group in which tabs can be placed.
         *
         * @param string text - The text the user will see
         * @param string groupName - The name of the group which can be used to add tabs within the group.
         * @return void
         */
        ui.addTabGroup = function addTabGroup(text, groupName) {
            var details = document.createElement('details');
            details.dataset.tabGroup = groupName;

            var summary = document.createElement('summary');
            summary.textContent = text;
            details.appendChild(summary);

            document.querySelector('#leftNav [data-tab-group=main]').appendChild(details);
        };

        ui.addMessageToConsole = function addMessageToConsole(msg, name='', nameClass = '') {
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

            hook.check('ui.addmessagetopage');
        };

        // rules format: array of objects
        // each object must have "selector"
        // each object can have "text" or "html" - any further keys will set as attributes.
        ui.buildContentFromTemplate = function(templateSelector, targetSelector, rules = []) {
            var content = document.querySelector(templateSelector).content;

            rules.forEach((rule) => {
                var el = content.querySelector(rule.selector);
                if (rule.text) {
                    el.textContent = rule.text;
                } else if (rule.html) {
                    el.innerHTML = rule.html;
                }

                Object.keys(rule)
                    .filter((key) => !['selector', 'text', 'html'].includes(key))
                    .forEach((key) => {
                        el.setAttribute(key, rule[key]);
                    });
            });

            document.querySelector(targetSelector).appendChild(document.importNode(content, true));
        };

        document.querySelector('#leftNav .overlay').addEventListener('click', ui.toggleMenu);

        return ui;
    };

    window.MessageBotUI = create;
}());
 //Depends: hook, BHFansAPI
window.botui = MessageBotUI(window.hook, window.bhfansapi);
(function(ui, bhfansapi) {
    function onClick(selector, handler) {
        Array.from(document.querySelectorAll(selector))
            .forEach((el) => el.addEventListener('click', handler));
    }

    onClick('#mb_backup_load', function loadBackup() {
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

    onClick('#mb_load_man', function loadExtension() {
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
                                    bhfansapi.startExtension(extRef);
                                }
                            }
                        }},
                        {text: 'Cancel'}
                    ]);
    });

    onClick('#mb_backup_save', function showBackup() {
        var backup = JSON.stringify(localStorage).replace(/</g, '&lt;');
        ui.alert(`Copy this to a safe place:<br><textarea style="width: calc(100% - 7px);height:160px;">${backup}</textarea>`);
    });
}(window.botui, window.bhfansapi));
 //Depends: botui, bhfansapi
function MessageBot(ajax, hook, storage, bhfansapi, api, ui) { //jshint ignore:line
    //Helps avoid messages that are tacked onto the end of other messages.
    var chatBuffer = [];
    (function checkBuffer() {
        if (chatBuffer.length) {
            hook.check('bot.send');
            var message = chatBuffer.shift();
            if (message.startsWith('/')) {
                ui.addMessageToConsole(message, 'SERVER', 'admin admin-command');
            }
            api.send(message)
                .then(setTimeout(checkBuffer, 1000));
        } else {
            setTimeout(checkBuffer, 500);
        }
    }());

    //Enable sending messages once the server is online
    api.worldStarted()
        .then(() => {
            ['#mb_console input', '#mb_console button'].forEach((selector) => {
                document.querySelector(selector).disabled = false;
            });
        });

    var bot = {
        version: '6.0.0a',
        ui: ui,
        api: api,
        hook: hook,
        storage: storage,
        preferences: storage.getObject('mb_preferences', {}, false),
    };

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
        });

    //Update the players object
    Promise.all([api.getLogs(), api.getWorldName()])
        .then((values) => {
            var [log, worldName] = values;
            var last = storage.getObject('mb_lastLogLoad', 0, false);
            storage.set('mb_lastLogLoad', Math.floor(Date.now().valueOf()), false);

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
        .then(() => storage.set('mb_players', world.players));

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
            var container = document.getElementById(ids[index]);
            var template = document.getElementById(tids[index]);

            messages[type].forEach((msg) => {
                ui.addMsg(container, template, msg);
            });
        });
    }(
        ['join', 'leave', 'trigger', 'announcement'],
        ['jMsgs', 'lMsgs', 'tMsgs', 'aMsgs'],
        ['jlTemplate', 'jlTemplate', 'tTemplate', 'aTemplate']
    ));

    // Sends announcements after the specified delay.
    (function announcementCheck(i) {
        i = (messages.announcement.length >= i) ? 0 : i;

        if (typeof messages.announcement[i] == 'string') {
            bot.send(messages.announcement[i]);
        }
        setTimeout(announcementCheck, bot.preferences.announcementDelay * 60000, ++i);
    }(0));

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
        ui.addMessageToConsole(message, name, msgClass);
    });
    hook.listen('world.servermessage', function(message) {
        ui.addMessageToConsole(message, 'SERVER', 'admin');
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

        saveFromWrapper('lMsgs', messages.leave, 'joinArr');
        saveFromWrapper('jMsgs', messages.join, 'leaveArr');
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

                    if (message.startsWith('/')) {
                        ui.addMessageToConsole(message, 'SERVER', 'admin admin-command');
                    }

                } else {
                    button.textContent = 'RETRY';
                    throw new Error(JSON.stringify(response));
                }
            })
            .catch((e) => bhfansapi.reportError(e))
            .then(() => {
                [input, button].forEach((el) => el.disabled = false);
                if (document.querySelector('#mb_console.visible')) {
                    input.focus();
                }
            });
    }

    //Listen for user to send message
    document.querySelector('#mb_console input').addEventListener('keydown', function(event) {
        if (event.key == "Enter") {
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

function MessageBotExtension(namespace) { //jshint ignore:line
    var extension = {
        id: namespace,
        bot: window.bot,
        ui: window.botui,
        hook: window.hook,
        storage: window.storage,
        ajax: window.ajax,
        api: window.api,
    };

    extension.hook.check(`${extension.id}.loaded`);

    /**
     * Used to change whether or not the extension will be
     * Automatically loaded the next time the bot is launched.
     *
     * @param boolean shouldAutoload
     * @return void
     */
    extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {
        window.bhfansapi.autoloadExtension(extension.id, shouldAutoload);
    };

    return extension;
}

// jshint ignore:end

var bot = MessageBot( //jshint unused:false
            window.ajax,
            window.hook,
            window.storage,
            window.bhfansapi,
            window.api,
            window.botui
        );

window.addEventListener('error', (err) => {
    //Wrap everything here in a try catch so that errors with our error reporting don't generate more errors to be reported... infinite loop.
    try {
        if (err.message == 'Script error') {
            return;
        }

        window.bhfansapi.reportError(err);
    } catch (e) {
        console.error(e);
    }
});
