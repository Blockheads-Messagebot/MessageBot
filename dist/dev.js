//Imported vars / functions
/*globals
    getAjax,
    getHook,
    BHFansAPI,
    BlockheadsAPI,
    MessageBot,
    MessageBotUI
*/

//Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

// jshint ignore:start
var getAjax = (function() { //jshint ignore:line
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

    return function() {
        return {xhr, get, getJSON, post, postJSON};
    };
}());

var getHook = (function() { //jshint ignore:line
    var listeners = {};

    function listen(key, callback) {
        if (!listeners[key]) {
            listeners[key] = [];
        }
        listeners[key].push(callback);
    }

    function remove(key, callback) {
        if (listeners[key]) {
            var position = listeners[key].indexOf(callback);
            if (~position) {
                listeners[key].splice(position, 1);
            }
        }
    }

    function check(key, initial, ...args) {
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

    return function() {
        return {listen, remove, check};
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

    api.reportError = (err) => {
        console.error(err);
        ajax.postJSON('//blockheadsfans.com/messagebot/bot/error',
            {
                error_text: err.message,
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

function MessageBotUI() { //jshint ignore:line
    document.head.innerHTML = '';
    document.head.innerHTML += '<style><style>';
    document.body.innerHTML = '';

    var mainToggle = document.querySelector('#toggle');

    var ui = {
        alertActive: false,
        alertQueue: [],
        alertButtons: {},
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

    document.querySelector('#navOverlay').addEventListener('click', ui.toggleMenu);
    document.querySelector('#mainNav').addEventListener('click', ui.globalTabChange);

    return ui;
}

function MessageBot(ajax, hook, bhfansapi, api, ui) { //jshint ignore:line
    var bot = {
        version: '6.0.0',
        ui: ui,
        api: api,
        hook: hook,
        uMID: 0,
        extensions: [],
        preferences: {},
        online: [],
    };

    var world = {
        name: document.title.substring(0, document.title.indexOf('Manager | Portal') - 1),
        online: [],
        owner: [],
        players: {},
        lists: undefined,
    };
    bot.world = world;

    function checkChat() {
        function getUsername(message) {
            for (let i = 18; i > 4; i--) {
                let possibleName = message.substring(0, message.lastIndexOf(': ', i));
                if (~bot.online.indexOf(possibleName) || possibleName == 'SERVER') {
                    return possibleName;
                }
            }
            // Should ideally never happen.
            return message.substring(0, message.lastIndexOf(': ', 18));
        }

        api.getMessages().then((msgs) => {
            msgs.forEach((message) => {
                if (message.startsWith(`${world.name} - Player Connected `)) {
                    let name = message.substring(world.name.length + 20, message.lastIndexOf('|', message.lastIndexOf('|') - 1) - 1);
                    let ip = message.substring(message.lastIndexOf(' | ', message.lastIndexOf(' | ') - 1) + 3, message.lastIndexOf(' | '));

                    handlePlayerJoin(name, ip);
                } else if (message.startsWith(`${world.name} - Player Disconnected `)) {
                    let name = message.substring(world.name.length + 23);
                    let ip = world.players[name].ip;

                    handlePlayerLeave(name, ip);
                } else if (message.indexOf(': ')) {
                    let name = getUsername(message);
                    let msg = message.substring(name.length + 2);

                    handleUserMessage(name, msg);
                } else {
                    handleOtherMessage(message);
                }
            });
        })
        .catch((err) => {
            bhfansapi.reportError(err);
        })
        .then(() => {
            setTimeout(checkChat, 5000);
        });
    }

    function handlePlayerJoin(name, ip) {
        if (world.players.hasOwnProperty(name)) {
            //Returning player
            world.players[name].joins++;
        } else {
            //New player
            world.players[name] = {joins: 1, ips: [ip]};
        }
        world.players[name].ip = ip;

        if (!~world.online.indexOf(name)) {
            world.online.push(name);
        }

        //TODO: Add the message to the page
        hook.check('world.join', {name, ip});
    }

    function handlePlayerLeave(name, ip) {
        var position = world.online.indexOf(name);
        if (~position) {
            world.online.splice(position, 1);
        }

        //TODO: Add the message to the page
        hook.check('world.leave', {name, ip});
    }

    function handleUserMessage(name, message) {
        //TODO: Check if this is a command message
        //TODO: Add the message to the page
        hook.check('world.message', {name, message});
    }

    function handleOtherMessage(message) {
        //TODO: Add message to page
        hook.check('world.other', message);
    }

    //Save functions
    {
        /**
         * Used to save the bot's current config.
         * Automatically called whenever the config changes
         *
         * @return void
         */
        bot.saveConfig = function saveConfig() {
            var utilSaveFunc = (wrapper, saveTo) => {
                var wrappers = wrapper.children;
                var selects,
                    joinCounts,
                    tmpMsgObj = {};
                for (var i = 0; i < wrappers.length; i++) {
                    tmpMsgObj.message = wrappers[i].querySelector('.m').value;
                    if (wrapper.id != 'aMsgs') {
                        selects = wrappers[i].querySelectorAll('select');
                        joinCounts = wrappers[i].querySelectorAll('input[type="number"]');
                        tmpMsgObj.group = selects[0].value;
                        tmpMsgObj.not_group = selects[1].value;
                        tmpMsgObj.joins_low = joinCounts[0].value;
                        tmpMsgObj.joins_high = joinCounts[1].value;
                    }
                    if (wrapper.id == 'tMsgs') {
                        if (bot.preferences.disableTrim) {
                            tmpMsgObj.trigger = wrappers[i].querySelector('.t').value;
                        } else {
                            tmpMsgObj.trigger = wrappers[i].querySelector('.t').value.trim();
                        }
                    }
                    saveTo.push(tmpMsgObj);
                    tmpMsgObj = {};
                }
            };

            bot.joinArr = [];
            bot.leaveArr = [];
            bot.triggerArr = [];
            bot.announcementArr = [];
            utilSaveFunc(document.getElementById('lMsgs'), bot.leaveArr);
            utilSaveFunc(document.getElementById('jMsgs'), bot.joinArr);
            utilSaveFunc(document.getElementById('tMsgs'), bot.triggerArr);
            utilSaveFunc(document.getElementById('aMsgs'), bot.announcementArr);

            localStorage.setItem('joinArr' + window.worldId, JSON.stringify(bot.joinArr));
            localStorage.setItem('leaveArr' + window.worldId, JSON.stringify(bot.leaveArr));
            localStorage.setItem('triggerArr' + window.worldId, JSON.stringify(bot.triggerArr));
            localStorage.setItem('announcementArr' + window.worldId, JSON.stringify(bot.announcementArr));
            localStorage.setItem('mb_extensions', JSON.stringify(bot.extensions));
            localStorage.setItem('mb_version', bot.version);
        };

        /**
         * Method used to create a backup for the user.
         */
        bot.generateBackup = function generateBackup() {
            var size = Object.keys(localStorage).reduce((c, l) => c + l).length;
            var backup = bot.stripHTML(JSON.stringify(localStorage));
            bot.ui.alert(`<p>Copy the following code to a safe place.<br>Size: ${size} bytes</p><p>${backup}</p>`);
        };

        /**
         * Method used to load a user's backup if possible.
         */
        bot.loadBackup = function loadBackup() {
            bot.ui.alert('Enter the backup code:<textarea style="width:99%;height:10em;"></textarea>',
                        [
                            { text: 'Load backup & restart bot', style: 'success', action: function() {
                                var code = document.querySelector('#alert textarea').value;
                                try {
                                    code = JSON.parse(code);
                                    if (code === null) {
                                        throw new Error('Invalid backup');
                                    }
                                } catch (e) {
                                    bot.ui.notify('Invalid backup code. No action taken.');
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
        };

        /**
         * Function used to save the bot preferences to the browser.
         */
        bot.savePrefs = function savePrefs() {
            var prefs = {};
            prefs.announcementDelay = parseInt(document.querySelector('#mb_ann_delay').value);
            prefs.maxResponses = parseInt(document.querySelector('#mb_resp_max').value);
            prefs.regexTriggers = document.querySelector('#mb_regex_triggers').checked;
            prefs.disableTrim = document.querySelector('#mb_disable_trim').checked;
            prefs.notify = document.querySelector('#mb_notify_message').checked;
            bot.preferences = prefs;
            localStorage.setItem('mb_preferences', JSON.stringify(prefs));
        };
    }

    //Bot & UI control functions
    {
        /**
         * Method used to start the bot and add event listeners
         *
         * @return void
         */
        bot.start = function start() {
            let ipBanCheck = (message) => {
                let data = (typeof message == 'string') ? {name: 'SERVER', message} : message;
                if (/^\/ban-ip .{3,}/i.test(data.message) && bot.checkGroup('Staff', data.name)) {
                    let ip = bot.core.getIP(/^\/ban-ip (.*)$/.exec(data.message)[1].toLocaleUpperCase());
                    if (ip) {
                        bot.core.send(`/ban ${ip}`);
                        bot.core.send(`${ip} has been added to the blacklist.`);
                    }
                }
            };

            bot.core.addJoinListener('mb_join', 'bot', bot.onJoin);

            bot.core.addLeaveListener('mb_leave', 'bot', bot.onLeave);

            bot.core.addTriggerListener('mb_trigger', 'bot', bot.onTrigger);
            bot.core.addTriggerListener('mb_ip_ban', 'bot', ipBanCheck);
            bot.core.addTriggerListener('mb_notify', 'bot', (data) => {
                if (bot.preferences.notify && document.querySelector('#mb_console.visible') === null) {
                    bot.ui.notify(data.name + ': ' + data.message);
                }
            });

            bot.core.addBeforeSendListener('mb_ip_ban', 'bot', ipBanCheck);
            bot.core.addBeforeSendListener('mb_tweaks', 'bot', (message) => {
                return message.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
            });

            bot.core.addAddMessageListener('scroll_chat', 'bot', bot.showNewChat);

            bot.announcementCheck(0);
            bot.core.startListening();
        };

        /**
         * Scrolls to the bottom of the page, if the user isn't reading old chat
         */
        bot.showNewChat = function showNewChat() {
            let chatContainer = document.querySelector('#mb_console ul');
            let lastLine = document.querySelector('#mb_console li:last-child');

            if (chatContainer.scrollHeight - chatContainer.clientHeight - chatContainer.scrollTop <= lastLine.clientHeight * 2) {
                lastLine.scrollIntoView(false);
            }
        };
    }

    //Interaction functions
    {
        /**
         * Function used to add an empty message
         * Should only be called by the user tapping a + to add messages
         *
         * @param eventArgs e
         * @return void
         */
        bot.addEmptyMsg = function addEmptyMsg(e) {
            var containerElem = e.target.parentElement.querySelector('div');
            var template;
            if (containerElem.id == 'jMsgs' || containerElem.id == 'lMsgs') {
                template = document.getElementById('jlTemplate');
            } else if (containerElem.id == 'tMsgs') {
                template = document.getElementById('tTemplate');
            } else {
                template = document.getElementById('aTemplate');
            }
            bot.addMsg(containerElem, template, {});

            e.stopPropagation();
        };

        /**
         * Method used to delete messages, calls the save config function if needed.
         *
         * @param eventArgs e
         * @return void;
         */
        bot.deleteMsg = function deleteMsg(e) {
            bot.ui.alert('Really delete this message?',
                        [
                            {text: 'Delete', style: 'danger', thisArg: e.target.parentElement, action: function() {
                                this.remove();
                                bot.saveConfig();
                            }},
                            {text: 'Cancel'}
                        ]);
            e.stopPropagation();
        };
    }

    //Store & extension control functions
    {
        /**
         * Method used to add an extension to the bot.
         *
         * @param string extensionId the ID of the extension to load
         * @return void
         */
        bot.addExtension = function addExtension() {
        };

        /**
         * Method used to add an extension manually, by ID or url.
         *
         * @return void
         */
        bot.manuallyAddExtension = function manuallyAddExtension() {
            bot.ui.alert('Enter the ID or URL of an extension:<br><input style="width:calc(100% - 7px);"/>',
                        [
                            {text: 'Add', style: 'success', action: function() {
                                let extRef = document.querySelector('#alert input').value;
                                if (extRef.length) {
                                    if (extRef.indexOf('http') === 0) {
                                        let el = document.createElement('script');
                                        el.src = extRef;
                                        document.head.appendChild(el);
                                    } else {
                                        bot.addExtension(extRef);
                                    }
                                }
                            }},
                            {text: 'Cancel'}
                        ]);
        };

        /**
         * Tries to remove all traces of an extension
         * Calls the uninstall function of the extension if it exists
         * Removes the main tabs and settings tab of the extension
         * Removes the extension from the bot autoloader
         *
         * @param string extensionId the ID of the extension to remove
         * @return void;
         */
        bot.removeExtension = function removeExtension(extensionId) {
            if (typeof window[extensionId] != 'undefined') {
                if (typeof window[extensionId].uninstall == 'function') {
                    window[extensionId].uninstall();
                }

                //To be removed next minor version, extensions should now remove their tabs in an uninstall function.
                bot.ui.removeTab('settings_' + extensionId);
                Object.keys(window[extensionId].mainTabs).forEach((key) => {
                    bot.removeTab('main_' + extensionId + '_' + key);
                });
                //To make it simpler for devs to allow their extension to be added and removed without a page launch.
                window[extensionId] = undefined;
            }
            var extIn = bot.extensions.indexOf(extensionId);
            if (extIn > -1) {
                bot.extensions.splice(extIn, 1);
                bot.saveConfig();

                bot.listExtensions();

                var button = document.querySelector('div[extension-id=' + extensionId + '] > button');
                if (button !== null) {
                    button.textContent = 'Removed';
                    setTimeout((function () {
                        bot.textContent = 'Install';
                    }).bind(button), 3000);
                }
            }
        };

        /**
         * Used to create and display a list of installed extensions that may not appear in the store.
         */
        bot.listExtensions = function listExtensions() {
            let el = document.getElementById('mb_ext_list');
            if (!bot.extensions.length) {
                el.innerHTML = '<p>No extensions installed</p>';
                return;
            }

            // use bhfans api now
            bot.core.ajax.postJSON('//blockheadsfans.com/messagebot/extension/name',
                {extensions: JSON.stringify(bot.extensions)})
                .then((resp) => {
                    console.log('List Extensions: ', resp);
                    if (resp.status == 'ok') {
                        el.innerHTML = resp.extensions.reduce((html, ext) => {
                            return `${html}<li>${bot.stripHTML(ext.name)} (${ext.id}) <a onclick="bot.removeExtension(\'${ext.id}\');" class="button button-sm">Remove</a></li>`;
                            }, '<ul style="margin-left:1.5em;">') + '</ul>';
                    } else {
                        throw new Error(resp.message);
                    }
                }).catch((err) => {
                    console.error(err);
                    bot.core.reportError(err, 'bot');
                    bot.core.addMessageToPage(`<span style="color:#f00;">Fetching extension names failed with error: ${bot.stripHTML(err.message)}</span>`, true);
                    el.innerHTML = 'Error fetching extension names';
                });
        };

        /**
         * Used to choose whether or not an extension will automatically launch the next time the bot loads.
         *
         * @param string exensionId the id of the extension
         * @param boolean autoLaunch whether or not to launch the extension
         * @return void
         */
        bot.setAutoLaunch = function setAutoLaunch(extensionId, autoLaunch) {
            if (bot.extensions.indexOf(extensionId) < 0 && autoLaunch) {
                bot.extensions.push(extensionId);
                bot.listExtensions();
            } else if (!autoLaunch) {
                var extIn = bot.extensions.indexOf(extensionId);
                if (extIn > -1) {
                    bot.extensions.splice(extIn, 1);
                }
            }
            bot.saveConfig();
        };

        /**
         * Function that handles installation / removal requests by the user
         *
         * @param EventArgs e the details of the request
         * @return void
         */
        bot.extActions = function extActions(e) {
            var extId = e.target.parentElement.getAttribute('extension-id');
            var button = document.querySelector('div[extension-id="' + extId + '"] > button');
            //Handle clicks on the div itself, not a child elem
            extId = extId  || e.target.getAttribute('extension-id');
            if (e.target.tagName == 'BUTTON') {
                if (e.target.textContent == 'Install') {
                    bot.addExtension(extId);
                    button.textContent = 'Remove';
                } else {
                    bot.removeExtension(extId);

                    window[extId] = undefined;
                }
            }
        };
    }

    //Core listeners
    {
        /**
         * Function called whenever someone joins the server.
         * Should only be called by the core.
         *
         * @param object data an object containing the name and ip of the player
         */
        bot.onJoin = function onJoin(data) {
            bot.joinArr.forEach((msg) => {
                if (bot.checkGroup(msg.group, data.name) && !bot.checkGroup(msg.not_group, data.name) && bot.checkJoins(msg.joins_low, msg.joins_high, bot.core.getJoins(data.name))) {
                    var toSend = bot.replaceAll(msg.message, '{{NAME}}', data.name);
                    toSend = bot.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
                    toSend = bot.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
                    toSend = bot.replaceAll(toSend, '{{ip}}', data.ip);
                    bot.core.send(toSend);
                }
            });
        };

        /**
         * Function called whenever someone leaves the server.
         * Should only be called by the core.
         *
         * @param object data an object containing the name and ip of the player
         */
        bot.onLeave = function onLeave(data) {
            bot.leaveArr.forEach((msg) => {
                if (bot.checkGroup(msg.group, data.name) && !bot.checkGroup(msg.not_group, data.name) && bot.checkJoins(msg.joins_low, msg.joins_high, bot.core.getJoins(data.name))) {
                    var toSend = bot.replaceAll(msg.message, '{{NAME}}', data.name);
                    toSend = bot.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
                    toSend = bot.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
                    toSend = bot.replaceAll(toSend, '{{ip}}', data.ip);
                    bot.core.send(toSend);
                }
            });
        };

        /**
         * Function called whenever someone says something in chat.
         * Should not be called except by the core
         *
         * @param object data an object containing the message and info on it
         */
        bot.onTrigger = function onTrigger(data) {
            var triggerMatch = (trigger, message) => {
                if (bot.preferences.regexTriggers) {
                    return new RegExp(trigger, 'i').test(message);
                }
                return new RegExp(trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*"), 'i').test(message);
            };
            let sentMessages = 0;

            bot.triggerArr.forEach((msg) => {
                if (triggerMatch(msg.trigger, data.message) && bot.checkGroup(msg.group, data.name) && !bot.checkGroup(msg.not_group, data.name) && bot.checkJoins(msg.joins_low, msg.joins_high, bot.core.getJoins(data.name))) {

                    var toSend = bot.replaceAll(msg.message, '{{NAME}}', data.name);
                    toSend = bot.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
                    toSend = bot.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
                    toSend = bot.replaceAll(toSend, '{{ip}}', bot.core.getIP(data.name));
                    if (sentMessages < bot.preferences.maxResponses) {
                        sentMessages++;
                        bot.core.send(toSend);
                    }
                }
            });
        };

        /**
         * Function called to send the next announcement, should only be called once.
         *
         * @param number ind the index of the announcement to send.
         */
        bot.announcementCheck = function announcementCheck(ind) {
            var i = ind;
            if (ind == bot.announcementArr.length) {
                i = 0;
            }
            if (typeof bot.announcementArr[i] == 'object') {
                bot.core.send(bot.announcementArr[i].message);
            }
            setTimeout(bot.announcementCheck.bind(bot), bot.preferences.announcementDelay * 60000, ++i);
        };
    }

    //Utility functions
    {
        /**
         * Utility function used to strip HTML tags.
         *
         * @param string html the string with html to strip
         * @return string
         */
        bot.stripHTML = function stripHTML(html) {
            return bot.replaceAll(bot.replaceAll(html, '<', '&lt;'), '>', '&gt;');
        };

        /**
         * Utility function used to easily replace all occurances
         * of a string with a string in a string. Case sensitive.
         *
         * @param string string the string which is being searched
         * @param string find the string which is searched for
         * @param string replace the string which all occurances of find is replaced with
         * @return string the string after the replace has occured.
         */
        bot.replaceAll = function replaceAll(string, find, replace) {
            return string.replace(new RegExp(find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g'), replace);
        };

        /**
         * Should be called every time a new <template> element is added to the page
         *
         * @return void
         */
        bot.fixTemplates = function fixTemplates() {
            if (!('content' in document.createElement('template'))) {
                var qPlates = document.getElementsByTagName('template'),
                    plateLen = qPlates.length,
                    elPlate,
                    qContent,
                    contentLen,
                    docContent;

                for (var x = 0; x < plateLen; ++x) {
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
        };

        /**
         * Used to add messages, can be called by extensions.
         *
         * @param object container the div to add the message to - also determines the type
         * @param object template the template to use
         * @param object saveObj any values which should not be default.
         * @return void
         */
        bot.addMsg = function addMsg(container, template, saveObj) {
            var content = template.content;
            content.querySelector('div').id = 'm' + bot.uMID;
            content.querySelector('.m').value = saveObj.message || '';
            if (template.id != 'aTemplate') {
                var numInputs = content.querySelectorAll('input[type="number"]');
                numInputs[0].value = saveObj.joins_low || 0;
                numInputs[1].value = saveObj.joins_high || 9999;
                if (template.id == 'tTemplate') {
                    if (saveObj.trigger) {
                        saveObj.trigger = (bot.preferences.disableTrim) ? saveObj.trigger : saveObj.trigger.trim();
                    }
                    content.querySelector('.t').value = saveObj.trigger || '';
                }
            }
            //Groups done after appending or it doesn't work.
            container.appendChild(document.importNode(content, true));

            if (template.id != 'aTemplate') {
                var selects = document.querySelectorAll('#m' + bot.uMID + ' > select');

                selects[0].value = saveObj.group || 'All';

                selects[1].value = saveObj.not_group || 'Nobody';
            }
            document.querySelector('#m' + bot.uMID + ' > a').addEventListener('click', bot.deleteMsg.bind(bot), false);

            bot.uMID++;
        };

        /**
         * Function used to see if users are in defined groups.
         *
         * @param string group the group to check
         * @param string name the name of the user to check
         * @return boolean
         */
        bot.checkGroup = function checkGroup(group, name) {
            if (group == 'All') {
                return true;
            }
            if (group == 'Admin') {
                return bot.core.adminList.indexOf(name) !== -1;
            }
            if (group == 'Mod') {
                return bot.core.modList.indexOf(name) !== -1;
            }
            if (group == 'Staff') {
                return bot.core.staffList.indexOf(name) !== -1;
            }
            if (group == 'Owner') {
                return bot.core.ownerName == name;
            }
            return false;
        };

        /**
         * Compares the numbers given, used internally for joins.
         *
         * @param number low the lowest number allowed
         * @param number high the highest number allowed
         * @param number actual the number to check
         * @return boolean true if actual falls between low and high, false otherwise.
         */
        bot.checkJoins = function checkJoins(low, high, actual) {
            return low <= actual && actual <= high;
        };

        /**
         * Can be used to check if an extension is compatable as API changes are only made on minor versions
         * Accepts a version string like 5.1.* or >5.1.0 or <5.1.0
         *
         * @param string target the target version pattern
         * @return bool
         */
        bot.versionCheck = function versionCheck(target) {
            var vArr = bot.version.split('.');
            var tArr = target.replace(/[^0-9.*]/g, '').split('.');
            if (/^[0-9.*]+$/.test(target)) {
                return tArr.every(function(el, i) {
                    return (el == vArr[i] || el == '*');
                });
            } else if (/^>[0-9.]+$/.test(target)) {
                for (let i = 0; i < tArr.length; i++) {
                    if (Number(vArr[i]) > Number(tArr[i])) {
                        return true;
                    }
                }
                return false;
            } else if (/^<[0-9.]+$/.test(target)) {
                for (let i = 0; i < tArr.length; i++) {
                    if (Number(vArr[i]) > Number(tArr[i])) {
                        return true;
                    }
                }
                return false;
            }
            return false;
        };
    }

    //Setup function, used to write the config page and attatch event listeners.
    (function(bot) {
        let checkPref = (type, name, defval) => {
            if (typeof bot.preferences[name] != type) {
                bot.preferences[name] = defval;
            }
        };
        let addListener = (selector, type, func, thisVal = undefined) => {
            document.querySelector(selector).addEventListener(type, func.bind(thisVal));
        };

        var str = localStorage.getItem('mb_preferences');
        bot.preferences = str === null ? {} : JSON.parse(str);
        checkPref('number', 'announcementDelay', 10);
        checkPref('number', 'maxResponses', 2);
        checkPref('boolean', 'regexTriggers', false);
        checkPref('boolean', 'disableTrim', false);
        checkPref('boolean', 'notify', true);

        bot.fixTemplates();

        var addMsgElems = document.querySelectorAll('span.add');
        for (let i = 0; i < addMsgElems.length; i++) {
            addMsgElems[i].addEventListener('click', bot.addEmptyMsg.bind(bot), false);
        }

        document.querySelector('#mb_console input').setAttribute('onkeydown', 'bot.core.enterCheck(event, bot.core)');

        addListener('#jMsgs', 'change', bot.saveConfig, bot);
        addListener('#lMsgs', 'change', bot.saveConfig, bot);
        addListener('#tMsgs', 'change', bot.saveConfig, bot);
        addListener('#aMsgs', 'change', bot.saveConfig, bot);

        addListener('#mb_settings', 'change', bot.savePrefs, bot);

        addListener('#mb_backup_save', 'click', bot.generateBackup, bot);
        addListener('#mb_backup_load', 'click', bot.loadBackup, bot);
        addListener('#exts', 'click', bot.extActions, bot);
        addListener('#mb_load_man', 'click', bot.manuallyAddExtension, bot);

        //Handle preferences
        document.querySelector('#mb_ann_delay').value = bot.preferences.announcementDelay;
        document.querySelector('#mb_resp_max').value = bot.preferences.maxResponses;
        document.querySelector('#mb_regex_triggers').checked = ((bot.preferences.regexTriggers) ? 'checked' : '');
        document.querySelector('#mb_disable_trim').checked = ((bot.preferences.disableTrim) ? 'checked' : '');
        document.querySelector('#mb_notify_message').checked = ((bot.preferences.notify) ? 'checked' : '');
    }(bot));

    //Load the saved config, including extensions
    (function(bot) {
        var str;
        str = localStorage.getItem('joinArr' + window.worldId);
        bot.joinArr = str === null ? [] : JSON.parse(str);
        str = localStorage.getItem('leaveArr' + window.worldId);
        bot.leaveArr = str === null ? [] : JSON.parse(str);
        str = localStorage.getItem('triggerArr' + window.worldId);
        bot.triggerArr = str === null ? [] : JSON.parse(str);
        str = localStorage.getItem('announcementArr' + window.worldId);
        bot.announcementArr = str === null ? [] : JSON.parse(str);
        str = localStorage.getItem('mb_extensions');
        bot.extensions = str === null ? [] : JSON.parse(str);

        bot.extensions.forEach((ext) => {
            bot.addExtension(ext);
        });

        bot.joinArr.forEach((msg) => {
            bot.addMsg(document.getElementById('jMsgs'), document.getElementById('jlTemplate'), msg);
        });
        bot.leaveArr.forEach((msg) => {
            bot.addMsg(document.getElementById('lMsgs'), document.getElementById('jlTemplate'), msg);
        });
        bot.triggerArr.forEach((msg) => {
            bot.addMsg(document.getElementById('tMsgs'), document.getElementById('tTemplate'), msg);
        });
        bot.announcementArr.forEach((msg) => {
            bot.addMsg(document.getElementById('aMsgs'), document.getElementById('aTemplate'), msg);
        });

        bot.saveConfig();
    }(bot));

    //Initialize the store page
    bot.core.ajax.getJSON('//blockheadsfans.com/messagebot/extension/store')
        .then((data) => {
            console.log(data);
            let content = document.getElementById('extTemplate').content;

            if (data.status == 'ok') {
                data.extensions.forEach((extension) => {
                    content.querySelector('h4').textContent = extension.title;
                    content.querySelector('span').innerHTML = extension.snippet;
                    content.querySelector('.ext').setAttribute('extension-id', extension.id);
                    content.querySelector('button').textContent = bot.extensions.indexOf(extension.id) < 0 ? 'Install' : 'Remove';

                    document.getElementById('exts').appendChild(document.importNode(content, true));
                });
            } else {
                document.getElementById('exts').innerHTML += data.message;
            }

            bot.listExtensions();
        })
        .catch((err) => {
            console.error(err);
            bot.core.reportError(err, 'bot');
        });

    return bot;
}

function MessageBotExtension(namespace) { //jshint ignore:line
    var extension = {
        id: namespace,
        bot: window.bot,
        core: window.bot.core,
        ui: window.bot.ui,
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
        return this.bot.extensions.indexOf(this.id) > -1;
    };

    /**
     * Used to change whether or not the extension will be
     * Automatically loaded the next time the bot is launched.
     *
     * @param boolean shouldAutoload
     * @return void
     */
    extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {
        this.bot.setAutoLaunch(this.id, shouldAutoload);
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

var bot = MessageBot(
            getAjax(),
            getHook(),
            BHFansAPI(getAjax()),
            BlockheadsAPI(getAjax(), window.worldId),
            MessageBotUI()
        );
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
