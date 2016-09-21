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

// jshint ignore:start
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

            if (!extensions.length) {
                target.innerHTML = '<p>No extensions installed</p>';
                return;
            }

            api.getExtensionNames(extensions).then((resp) => {
                if (resp.status == 'ok') {
                    target.innerHTML = resp.extensions
                    .reduce((html, ext) => {
                        return `${html}<li>${ext.name.replace(/</g, '&lt;')} (${ext.id}) <a onclick="BHFansAPI().removeExtension(\'${ext.id}\');" class="button button-sm">Remove</a></li>`;
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

            extensions.push(id);
            listExtensions();
            storage.set('mb_extensions', extensions, false);
        };
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

                var button = document.querySelector(`div[extension-id=${id}] > button`);
                if (button !== null) {
                    button.textContent = 'Removed';
                    button.disabled = true;
                    setTimeout((function () {
                        button.textContent = 'Install';
                        button.disabled = false;
                    }), 3000);
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
        };

        return api;
    }

    window.CreateBHFansAPI = api;
}());
 //Depends: ajax, storage
window.bhfansapi = CreateBHFansAPI(window.ajax, window.storage);
(function() {
    var ui = function(hook, bhfansapi) { //jshint ignore:line
        var uniqueMessageID = 0;

        function listenerHook(selector, type, hookname) {
            document.querySelector(selector)
                .addEventListener(type, () => hook.check(`ui.${hookname}`));
        }

        document.head.innerHTML = '<title>Console</title> <meta name="viewport" content="width=device-width,initial-scale=1"> ';
        document.head.innerHTML += '<style>.button,a{cursor:pointer}body,html{min-height:100vh;position:relative;width:100%;margin:0;font-family:"Lucida Grande","Lucida Sans Unicode",Verdana,sans-serif}a{color:#182b73}#container>div:not(#header){display:none;padding:10px}#container>div.visible:not(#header),#mainNav{display:block}.overlay{position:fixed;top:0;left:0;bottom:0;right:0;opacity:0;visibility:hidden;z-index:8999;background:rgba(0,0,0,.6);transition:opacity .5s}#mainNav,#mainToggle{color:#fff;position:fixed;z-index:9999}#header{height:80px;width:100%;background:url(http://portal.theblockheads.net/static/images/portalHeader.png) 50px 0 no-repeat #051465}#mainNav{background:#182b73;padding-bottom:50px;width:250px;top:0;left:-250px;bottom:0;transition:left .5s;overflow:auto;-webkit-overflow-scrolling:touch}#toggle{display:none}#mainToggle{background:#374384;padding:5px;top:5px;left:5px;opacity:1;transition:left .5s,opacity .5s}.tab,.tab-header{display:block;padding:10px 0;text-align:center}.tab,.tab-group{border-bottom:1px solid rgba(255,255,255,.2)}.tab-body>.tab{border-bottom:1px solid #182B73}.tab.selected{background:radial-gradient(#7D88B3,#182B73)}.tab-body>.tab.selected{background:radial-gradient(#182B73,#7D88B3)}.tab-header-toggle{display:none}.tab-header{padding:10px 0 5px;display:block;text-align:center}.tab-body{background:rgba(255,255,255,.2);border-radius:10px;width:80%;margin-left:10%}.tab-header-toggle~.tab-body{overflow:hidden;max-height:0;margin-bottom:5px;transition:.5s cubic-bezier(0,1,.5,1)}.tab-header-toggle~.tab-header:after{font-size:50%;content:"▼";position:relative;top:-.25em;left:.5em}.tab-header-toggle:checked~.tab-body{display:block;transition:.5s ease-in;max-height:1000px;overflow:hidden}.tab-header-toggle:checked~.tab-header:after{content:"▲"}#mb_console>div:nth-child(1){height:calc(100vh - 220px)}@media screen and (min-width:668px){#mb_console>div:nth-child(1){height:calc(100vh - 150px)}}#mb_console>div>ul{height:100%;overflow-y:auto;width:100%;margin:0;padding:0}.mod>span:first-child{color:#05f529}.admin>span:first-child{color:#2b26bd}#mb_console>div:nth-child(2){display:flex}#mb_console button,#mb_console input{padding:5px;font-size:1em;margin:5px 0}#mb_console input{flex:1;border:1px solid #999}#mb_console button{background-color:#182b73;font-weight:700;color:#fff;border:0;height:40px}#toggle:checked~#mainToggle{left:255px;opacity:0;transition:left .5s,opacity .5s}#toggle:checked~#navOverlay{visibility:visible;opacity:1}#toggle:checked~#mainNav{left:0;transition:left .5s}#alert{visibility:hidden;position:fixed;left:0;right:0;top:50px;margin:auto;background:#fff;width:50%;border-radius:10px;padding:10px 10px 55px;min-width:300px;min-height:200px;z-index:8000}#alert>div{webkit-overflow-scrolling:touch;max-height:65vh;overflow-y:auto}#alert>.buttons{position:absolute;bottom:10px;left:5px}.button{color:#000;display:inline-block;padding:6px 12px;margin:0 5px;font-size:14px;line-height:1.428571429;text-align:center;white-space:nowrap;vertical-align:middle;border:1px solid rgba(0,0,0,.15);border-radius:4px;background:linear-gradient(to bottom,#fff 0,#e0e0e0 100%) #fff}.button-sm{padding:1px 5px;font-size:12px;line-height:1.5;border-radius:3px}.danger,.info,.success,.warning{color:#fff}.success{background:linear-gradient(to bottom,#5cb85c 0,#419641 100%) #5cb85c;border-color:#3e8f3e}.info{background:linear-gradient(to bottom,#5bc0de 0,#2aabd2 100%) #5bc0de;border-color:#28a4c9}.danger{background:linear-gradient(to bottom,#d9534f 0,#c12e2a 100%) #d9534f;border-color:#b92c28}.warning{background:linear-gradient(to bottom,#f0ad4e 0,#eb9316 100%) #f0ad4e;border-color:#e38d13}#alertOverlay{z-index:7999}#alert.visible,#alertOverlay.visible{visibility:visible;opacity:1}.notification{color:#fff;position:fixed;top:1em;right:1em;opacity:0;min-width:200px;border-radius:5px;background:#051465;padding:5px;transition:opacity 2s}.notification.visible{opacity:1}.ext,.msg{position:relative;width:calc(33% - 19px);min-width:280px;margin-left:5px;margin-bottom:5px;border:3px solid #878787;border-radius:10px;float:left;padding:5px}.ext p{margin:0}.ext:nth-child(odd),.msg:nth-child(odd){background:#C6C6C6}.msg>input{width:calc(100% - 10px);border:2px solid #666}.msg>input[type=number]{width:5em}.descgen{margin:0 0 5px}#mb_load_man,.add{position:absolute;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;top:90px;right:12px;width:30px;height:30px;background:#182B73;border:0;color:#FFF}#mb_load_man{width:inherit;padding:0 7px}#aMsgs,#exts,#jMsgs,#lMsgs,#tMsgs{padding-top:8px;margin-top:8px;border-top:1px solid;height:calc(100vh - 165px)}.ext{height:120px}.ext>h4{margin:0}.ext>button{position:absolute;bottom:7px;padding:3px 8px}.tabContainer>div{display:none;min-height:calc(100vh - 175px)}.tabContainer>div.visible{display:block}.botTabs{width:100%;display:-webkit-box;display:-webkit-flex;display:flex;-webkit-flex-flow:row wrap;flex-flow:row wrap}.botTabs>div{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;-webkit-flex-grow:1;flex-grow:1;height:40px;margin-top:5px;margin-right:5px;min-width:120px;background:#182B73;color:#FFF;font-family:"Lucida Grande","Lucida Sans Unicode",sans-serif}.botTabs>div:last-child{margin-right:0}.botTabs>div.selected{color:#000;background:#E7E7E7}<style>';
        document.body.innerHTML = '<input type="checkbox" name="menu" id="toggle"> <label for="toggle" id="mainToggle">&#9776; Menu</label> <nav id="mainNav"> <div id="mainNavContents"> <span class="tab selected" g-tab-name="console">CONSOLE</span> <div class="tab-group"> <input type="checkbox" name="group_msgs" id="group_msgs" class="tab-header-toggle"> <label class="tab-header" for="group_msgs">MESSAGES</label> <div class="tab-body" id="msgs_tabs"> <span class="tab" g-tab-name="join">JOIN</span> <span class="tab" g-tab-name="leave">LEAVE</span> <span class="tab" g-tab-name="trigger">TRIGGER</span> <span class="tab" g-tab-name="announcements">ANNOUNCEMENTS</span> </div> </div> <span class="tab" g-tab-name="extensions">EXTENSIONS</span> <span class="tab" g-tab-name="settings">SETTINGS</span> </div> <div class="clearfix"></div> </nav> <div id="botTemplates"> <template id="jlTemplate"> <div class="msg"> <label>When the player is </label> <select> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> then say </label> <input class="m"> <label> in chat if the player has joined between </label> <input type="number" value="0"> <label> and </label> <input type="number" value="9999"> <label> times.</label><br> <a>Delete</a> </div> </template> <template id="tTemplate"> <div class="msg"> <label>When </label> <select> <option value="All">anyone</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> who is not </label> <select> <option value="Nobody">nobody</option> <option value="Staff">a staff member</option> <option value="Mod">a mod</option> <option value="Admin">an admin</option> <option value="Owner">the owner</option> </select> <label> says </label> <input class="t"> <label> in chat, say </label> <input class="m"> <label> if the player has joined between </label> <input type="number" value="0"> <label> and </label> <input type="number" value="9999"> <label>times. </label><br> <a>Delete</a> </div> </template> <template id="aTemplate"> <div class="ann"> <label>Say:</label> <input class="m"> <a>Delete</a> <label style="display:block;margin-top:5px">Wait X minutes...</label> </div> </template> <template id="extTemplate"> <div class="ext"> <h4>Title</h4> <span>Description</span><br> <button class="button">Install</button> </div> </template> </div> <div id="navOverlay" class="overlay"></div> <div id="container"> <div id="header" class="visible"></div> <div id="mb_console" class="visible"> <div><ul></ul></div> <div><input type="text" disabled="disabled"><button disabled="disabled">SEND</button></div> </div> <div id="mb_join"> <h3 class="descgen">These are checked when a player joins the server.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="jMsgs"></div> </div> <div id="mb_leave"> <h3 class="descgen">These are checked when a player leaves the server.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message.</span> <span class="add">+</span> <div id="lMsgs"></div> </div> <div id="mb_trigger"> <h3 class="descgen">These are checked whenever someone says something.</h3> <span class="descdet">You can use {{Name}}, {{NAME}}, {{name}}, and {{ip}} in your message. If you put an asterisk (*) in your trigger, it will be treated as a wildcard. (Trigger "te*st" will match "tea stuff" and "test")</span> <span class="add">+</span> <div id="tMsgs"></div> </div> <div id="mb_announcements"> <h3 class="descgen">These are sent according to a regular schedule.</h3> <span class="descdet">If you have one announcement, it is sent every X minutes, if you have two, then the first is sent at X minutes, and the second is sent X minutes after the first. Change X in the settings tab. Once the bot reaches the end of the list, it starts over at the top.</span> <span class="add">+</span> <div id="aMsgs"></div> </div> <div id="mb_extensions"> <h3 class="descgen">Extensions can increase the functionality of the bot.</h3> <span class="descdet">Interested in creating one? <a href="https://github.com/Bibliofile/Blockheads-MessageBot/wiki" target="_blank">Click here.</a></span> <span id="mb_load_man">Load By ID/URL</span> <div id="exts"></div> </div> <div id="mb_settings"> <h3>Settings</h3> <label for="mb_ann_delay">Delay between announcements (minutes): </label> <input id="mb_ann_delay" type="number"><br> <label for="mb_resp_max">Maximum trigger responses to a message: </label> <input id="mb_resp_max" type="number"><br> <label for="mb_notify_message">Notification on new chat when not on console page: </label> <input id="mb_notify_message" type="checkbox"><br> <h3>Advanced Settings</h3> <a href="https://github.com/Bibliofile/Blockheads-MessageBot/wiki/Advanced-Options" target="_blank">Read this first</a> <label for="mb_regex_triggers">Parse triggers as RegEx: </label> <input id="mb_regex_triggers" type="checkbox"><br> <label for="mb_disable_trim">Disable whitespace trimming: </label> <input id="mb_disable_trim" type="checkbox"><br> <h3>Extensions</h3> <div id="mb_ext_list"></div> <h3>Backup / Restore</h3> <a id="mb_backup_save">Get backup code</a><br> <a id="mb_backup_load">Load previous backup</a> <div id="mb_backup"></div> </div> </div> <div id="alert"> <div></div> <div class="buttons"> </div> </div> <div id="alertOverlay" class="overlay"> </div>';

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

        document.querySelector('#exts').addEventListener('click', function extActions(e) {
            var extId = e.target.parentElement.getAttribute('extension-id');
            //Handle clicks on the div itself, not a child elem
            extId = extId  || e.target.getAttribute('extension-id');
            var button = document.querySelector('div[extension-id="' + extId + '"] > button');
            if (e.target.tagName == 'BUTTON') {
                if (e.target.textContent == 'Install') {
                    bhfansapi.startExtension(extId);
                    button.textContent = 'Remove';
                } else {
                    bhfansapi.removeExtension(extId);

                    window[extId] = undefined;
                }
            }
        });

        if (!('content' in document.createElement('template'))) {
            let qPlates = document.getElementsByTagName('template'),
                plateLen = qPlates.length,
                elPlate,
                qContent,
                contentLen,
                docContent;

            for (let x = 0; x < plateLen; ++x) {
                elPlate = qPlates[x];
                qContent = elPlate.childNodes;
                contentLen = qContent.length;
                docContent = document.createDocumentFragment();

                while (qContent[0]) {
                    docContent.appendChild(qContent[0]);
                }

                elPlate.content = docContent;
            }
        }

        bhfansapi.getStore().then(resp => {
            if (resp.status != 'ok') {
                bhfansapi.reportError(resp.message);
                document.getElementById('exts').innerHTML += resp.message;
                return;
            }
            resp.extensions.forEach(extension => {
                ui.buildContentFromTemplate('#extTemplate', '#exts', [
                    {selector: 'h4', text: extension.title},
                    {selector: 'span', html: extension.snippet},
                    {selector: '.ext', 'extension-id': extension.id},
                    {selector: 'button', text: bhfansapi.extensionInstalled(extension.id) ? 'Remove' : 'Install'}
                ]);
            });
        });


        var mainToggle = document.querySelector('#toggle');

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

        var ui = {
            alertActive: false,
            alertQueue: [],
            alertButtons: {},
        };

        /**
         * Adds a message to the specified container using the specified template and saved properties.
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
            function buildButton(ui, button) {
                var el = document.createElement('span');
                el.innerHTML = button.text;
                el.classList.add('button');
                if (button.style) {
                    el.classList.add(button.style);
                }
                el.id = button.id;
                el.addEventListener('click', ui.buttonHandler.bind(ui));
                document.querySelector('#alert > .buttons').appendChild(el);
            }

            if (ui.alertActive) {
                ui.alertQueue.push({text, buttons});
                return;
            }
            ui.alertActive = true;

            buttons.forEach(function(button, i) {
                button.dismiss = (button.dismiss === false) ? false : true; //Require that dismiss be set to false, otherwise true
                ui.alertButtons['button_' + i] = {action: button.action, thisArg: button.thisArg, dismiss: button.dismiss};
                button.id = 'button_' + i;
                buildButton(this, button);
            }.bind(this));
            document.querySelector('#alert > div').innerHTML = text;

            document.querySelector('#alertOverlay').classList.toggle('visible');
            document.querySelector('#alert').classList.toggle('visible');
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
        * Internal function used to call button actions when ui.alert() is called.
        * Note: this is bound to the UI.
        *
        * @param EventArgs event
        * @return void
        */
        ui.buttonHandler = function(event) {
            var alertButton = ui.alertButtons[event.target.id] || {};
            alertButton.thisArg = alertButton.thisArg || undefined;
            alertButton.dismiss = typeof alertButton.dismiss == 'boolean' ? alertButton.dismiss : true;
            if (typeof alertButton.action == 'function') {
                alertButton.action.call(alertButton.thisArg);
            }
            //Require that there be an action asociated with no-dismiss buttons.
            if (alertButton.dismiss || typeof alertButton.action != 'function') {
                document.querySelector('#alert').classList.toggle('visible');
                document.querySelector('#alertOverlay').classList.toggle('visible');
                document.querySelector('#alert > .buttons').innerHTML = '';
                ui.alertButtons = {};
                ui.alertActive = false;
                ui.checkAlertQueue();
            }
        };

        /**
        * Internal function used to check for more alerts that need to be shown.
        *
        * @return void
        */
        ui.checkAlertQueue = function() {
            if (ui.alertQueue.length) {
                let alert = ui.alertQueue.shift();
                ui.alert(alert.text, alert.buttons);
            }
        };

        /**
         * Internal method used to change the page displayed to the user.
         *
         * @param EventArgs event
         * @return void
         */
        ui.globalTabChange = function(event) {
            if(event.target.getAttribute('g-tab-name') !== null) {
                //Content
                Array.from(document.querySelectorAll('div.visible:not(#header)'))
                    .forEach((el) => el.classList.remove('visible')); //We can't just remove the first due to browser lag
                document.querySelector('#mb_' + event.target.getAttribute('g-tab-name')).classList.add('visible');
                //Tabs
                document.querySelector('span.tab.selected').classList.remove('selected');
                event.target.classList.add('selected');
            }
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
         * @param string tabId
         * @param string tabGroup the base of the ID of the group ID. Optional.
         * @return void
         */
        ui.addTab = function addTab(tabText, tabId, tabGroup = '#mainNavContents') {
            if (tabGroup != '#mainNavContents') {
                tabGroup = `#${tabGroup}_tabs`;
            }
            var tab = document.createElement('span');
            tab.textContent = tabText.toLocaleUpperCase();
            tab.classList.add('tab');
            tab.setAttribute('g-tab-name', tabId);
            document.querySelector(tabGroup).appendChild(tab);
            var tabContent = document.createElement('div');
            tabContent.id = 'mb_' + tabId;
            document.querySelector('#container').appendChild(tabContent);
        };

        /**
         * Removes a global tab by it's id.
         */
        ui.removeTab = function removeTab(tabId) {
            let tab = document.querySelector('[g-tab-name="' + tabId + '"]');
            if (tab) {
                tab.remove();
                document.querySelector('#mb_' + tabId).remove();
            }
        };

        ui.addTabGroup = function addTabGroup(text, groupId) {
            var container = document.createElement('div');
            container.classList.add('tab-group');

            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'group_' + groupId;
            checkbox.id = 'group_' + groupId;
            checkbox.classList.add('tab-header-toggle');
            container.appendChild(checkbox);

            var label = document.createElement('label');
            label.classList.add('tab-header');
            label.setAttribute('for', 'group_' + groupId);
            label.textContent = text;
            container.appendChild(label);

            var innerContainer = document.createElement('div');
            innerContainer.id = groupId + '_tabs';
            innerContainer.classList.add('tab-body');
            container.appendChild(innerContainer);
            document.querySelector('#mainNavContents').appendChild(container);
        };

        /**
         * Function to add a tab anywhere on the page
         *
         * @param string navID the id to the div which holds the tab navigation.
         * @param string contentID the id to the div which holds the divs of the tab contents.
         * @param string tabName the name of the tab to add.
         * @param string tabText the text to display on the tab.
         * @return mixed false on failure, the content div on success.
         */
        ui.addInnerTab = function addInnerTab(navID, contentID, tabName, tabText) {
            if (document.querySelector('#' + navID + ' > div[tab-name="' + tabName + '"]') === null) {
                var tabNav = document.createElement('div');
                tabNav.setAttribute('tab-name', tabName);
                tabNav.textContent = this.stripHTML(tabText);
                document.getElementById(navID).appendChild(tabNav);

                var tabContent = document.createElement('div');
                tabContent.setAttribute('id', 'mb_' + tabName);
                document.getElementById(contentID).appendChild(tabContent);

                return tabContent;
            }
            return document.querySelector('#mb_' + tabName);
        };

        /**
         * Removes a tab by its name.
         *
         * @param string tabName the name of the tab to be removed.
         * @return bool true on success, false on failure.
         */
        ui.removeInnerTab = function removeInnerTab(tabName) {
            if (document.querySelector('div[tab-name="' + tabName + '"]') !== null) {
                document.querySelector('div[tab-name="' + tabName + '"]').remove();
                document.querySelector('#mb_' + tabName).remove();
                return true;
            }
            return false;
        };


        /**
         * Event handler that should be attatched to the div
         * holding the navigation for a tab set.
         *
         * @param eventArgs e
         * @return void
         */
        ui.changeTab = function changeTab(e) {
            if (e.target !== e.currentTarget) {
                var i;
                var tabs = e.currentTarget.children;
                var tabContents = document.getElementById(e.currentTarget.getAttribute('tab-contents')).children;
                for (i = 0; i < tabs.length; i++) {
                    tabs[i].removeAttribute('class');
                    tabContents[i].removeAttribute('class');
                }
                e.target.className = 'selected';
                if (e.target.getAttribute('tab-name') !== null) {
                    document.getElementById('mb_' + e.target.getAttribute('tab-name')).className = 'visible';
                }
            }
            e.stopPropagation();
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

        //rules format: array of objects
        // each object must have "selector"
        // each object can have "text" or "html" - any further attributes will be considered attributes.
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

        document.querySelector('#navOverlay').addEventListener('click', ui.toggleMenu);
        document.querySelector('#mainNav').addEventListener('click', ui.globalTabChange);

        return ui;
    };

    window.MessageBotUI = ui;
}());
 //Depends: hook, BHFansAPI
window.botui = MessageBotUI(window.hook, window.bhfansapi);
(function(ui, bhfansapi) {
    function onClick(selector, handler) {
        Array.from(document.querySelectorAll(selector))
            .forEach((el) => el.addEventListener('click', handler));
    }

    onClick('#mb_backup_load', function loadBackup() {
        ui.alert('Enter the backup code:<textarea style="width:99%;height:10em;"></textarea>',
                    [
                        { text: 'Load backup & restart bot', style: 'success', action: function() {
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
        core: window.bot.core,
        ui: window.bot.ui,
        hook: window.hook,
        settingsTab: null,
        mainTabs: {}
    };

    /**
     * DEPRICATED. Will be removed next minor version. Use addTab instead.
     *
     * @param string tabText the text to display on the tab
     * @return void
     */
    extension.addSettingsTab = function addSettingsTab(tabText) {
        console.warn('addSettingsTab has been depricated. Use addTab(tabText, tabId) instead.');
        this.ui.addTab(tabText, 'settings_' + this.id);
        this.settingsTab = document.querySelector('#mb_settings_' + this.id);
    };

    /**
     * DEPRICATED. Will be removed next minor version. Use addTab instead.
     *
     * @param string tabId the ID of the tab to add
     * @param string tabText the text which to place on the tab
     * @return void
     */
    extension.addMainTab = function addMainTab(tabId, tabText) {
        console.warn('addMainTab has been depricated. Use addTab(tabText, tabId, "msgs_tabs") instead.');
        this.ui.addTab(tabText, 'main_' + this.id + '_' + tabId, 'msgs');
        this.mainTabs[tabId] = document.querySelector('#mb_main_' + this.id + '_' + tabId);
    };

    /**
     * Used to add a tab to the bot's navigation.
     *
     * @param string tabText
     * @param string tabId
     * @param string tabGroup optional CSS selector that the tab should be added to.
     * @return void
     */
    extension.addTab = function addTab(tabText, tabId, tabGroup = '#mainNavContents') {
        this.ui.addTab(tabText, this.id + '_' + tabId, tabGroup);
    };

    /**
     * Used to add a tab group to the bot's navigation.
     *
     * @param string text
     * @param string groupId - Auto prefixed with the extension ID to avoid conflicts
     * @return void
     */
    extension.addTabGroup = function addTabGroup(tabText, tabId) {
        this.ui.addTabGroup(tabText, this.id + '_' + tabId);
    };

    /**
     * Used to check if the this extension is set to automatically launch, can be used to create 'run once by default' extensions.
     *
     * @return boolean true if the extension auto launches.
     */
    extension.autoLaunch = function autoLaunch() {
        return this.bot.extensions.includes(this.id);
    };

    /**
     * Used to change whether or not the extension will be
     * Automatically loaded the next time the bot is launched.
     *
     * @param boolean shouldAutoload
     * @return void
     */

     //TODO: Save config here.
    extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {
        window.bhfansapi.autoloadExtension(this.id, shouldAutoload);
        extension.hook.check('extension.added', this.id);
    };

    /**
     * Used to add a listener to for join messages
     *
     * @param string uniqueId the id of the listener
     * @param function the function called whenever a join message arrives
     * @return boolean true on success, false otherwise
     */
    extension.addJoinListener = function addJoinListener(uniqueId, listener) {
        return this.core.addJoinListener(this.id + '_' + uniqueId, this.id, listener);
    };

    /**
     * Used to remove listeners on join messages.
     *
     * @param string uniqueId the id of the listener to remove
     * @return void
     */
    extension.removeJoinListener = function removeJoinListener(uniqueId) {
        this.core.removeJoinListener(this.id + '_' + uniqueId);
    };

    /**
     * Used to add a listener to for leave messages
     *
     * @param string uniqueId the id of the listener
     * @param function the function called whenever a leave message arrives
     * @return boolean true on success, false otherwise
     */
    extension.addLeaveListener = function addLeaveListener(uniqueId, listener) {
        return this.core.addLeaveListener(this.id + '_' + uniqueId, this.id, listener);
    };

    /**
     * Used to remove listeners on leave messages.
     *
     * @param string uniqueId the id of the listener to remove
     * @return void
     */
    extension.removeLeaveListener = function removeLeaveListener(uniqueId) {
        this.core.removeLeaveListener(this.id + '_' + uniqueId);
    };

    /**
     * Used to add a listener to for trigger messages
     *
     * @param string uniqueId the id of the listener
     * @param function the function called whenever a trigger message arrives
     * @return boolean true on success, false otherwise
     */
    extension.addTriggerListener = function addTriggerListener(uniqueId, listener) {
        return this.core.addTriggerListener(this.id + '_' + uniqueId, this.id, listener);
    };

    /**
     * Used to remove listeners on trigger messages.
     *
     * @param string uniqueId the id of the listener to remove
     * @return void
     */
    extension.removeTriggerListener = function removeTriggerListener(uniqueId) {
        this.core.removeTriggerListener(this.id + '_' + uniqueId);
    };

    /**
     * Used to add a listener to for server messages
     *
     * @param string uniqueId the id of the listener
     * @param function the function called whenever a server message arrives
     * @return boolean true on success, false otherwise
     */
    extension.addServerListener = function addServerListener(uniqueId, listener) {
        return this.core.addServerListener(this.id + '_' + uniqueId, this.id, listener);
    };

    /**
     * Used to remove listeners on server messages.
     *
     * @param string uniqueId the id of the listener to remove
     * @return void
     */
    extension.removeServerListener = function removeServerListener(uniqueId) {
        this.core.removeServerListener(this.id + '_' + uniqueId);
    };

    /**
     * Used to add a listener to for other messages
     *
     * @param string uniqueId the id of the listener
     * @param function the function called whenever an other message arrives
     * @return boolean true on success, false otherwise
     */
    extension.addOtherListener = function addOtherListener(uniqueId, listener) {
        return this.core.addOtherListener(this.id + '_' + uniqueId, this.id, listener);
    };

    /**
     * Used to remove listeners on other messages.
     *
     * @param string uniqueId the id of the listener to remove
     * @return void
     */
    extension.removeOtherListener = function removeOtherListener(uniqueId) {
        this.core.removeOtherListener(this.id + '_' + uniqueId);
    };

    /**
     * Used to add a listener to the send function
     * which is called by every message before being sent.
     *
     * @param string uniqueId the id of the listener
     * @param function the function called whenever a message is sent
     * @return boolean true on success, false otherwise
     */
    extension.addBeforeSendListener = function addBeforeSendListener(uniqueId, listener) {
        return this.core.addBeforeSendListener(this.id + '_' + uniqueId, this.id, listener);
    };

    /**
     * Used to remove listeners on the send function
     *
     * @param string uniqueId the id of the listener to remove
     * @return void
     */
    extension.removeBeforeSendListener = function removeBeforeSendListener(uniqueId) {
        this.core.removeBeforeSendListener(this.id + '_' + uniqueId);
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
