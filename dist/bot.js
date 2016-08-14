'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };


window.pollChat = function () {};

function getAjax() {
    function xhr(protocol) {
        var url = arguments.length <= 1 || arguments[1] === undefined ? '/' : arguments[1];
        var paramObj = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

        var paramStr = Object.keys(paramObj).map(function (k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(paramObj[k]);
        }).join('&');
        return new Promise(function (resolve, reject) {
            var req = new XMLHttpRequest();
            req.open(protocol, url);
            req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            if (protocol == 'POST') {
                req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }

            req.onload = function () {
                if (req.status == 200) {
                    resolve(req.response);
                } else {
                    reject(Error(req.statusText));
                }
            };
            req.onerror = function () {
                reject(Error("Network Error"));
            };
            if (paramStr) {
                req.send(paramStr);
            } else {
                req.send();
            }
        });
    }

    function get() {
        var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
        var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        return xhr('GET', url, paramObj);
    }

    function getJSON() {
        var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
        var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        return get(url, paramObj).then(JSON.parse);
    }

    function post() {
        var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
        var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        return xhr('POST', url, paramObj);
    }

    function postJSON() {
        var url = arguments.length <= 0 || arguments[0] === undefined ? '/' : arguments[0];
        var paramObj = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        return post(url, paramObj).then(JSON.parse);
    }

    return { xhr: xhr, get: get, getJSON: getJSON, post: post, postJSON: postJSON };
}

var getHook = function () {
    var listeners = {};

    function listen(key, callback) {
        if (!listeners[key]) {
            listeners[key] = [];
        }
        listeners[key].push(callback);
    }

    function call(key, initial) {
        for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
            args[_key - 2] = arguments[_key];
        }

        if (!listeners[key]) {
            return initial;
        }

        return listeners[key].reduce(function (previous, current) {
            try {
                return current.apply(undefined, [previous].concat(args));
            } catch (e) {
                void 0;
                return previous;
            }
        }, initial);
    }

    return function () {
        return { listen: listen, call: call };
    };
}();

function BHFansAPI(ajax) {
    var cache = {
        getStore: getStore()
    };

    function getStore() {
        return ajax.getJSON('//blockheadsfans.com/messagebot/extension/store');
    }

    var api = {};

    api.getExtensionNames = function (ids) {
        return ajax.postJSON('//blockheadsfans.com/messagebot/extension/name', { extensions: JSON.stringify(ids) });
    };

    api.getStore = function () {
        var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        if (refresh) {
            cache.getStore = getStore();
        }
        return cache.getStore();
    };

    api.startExtension = function (id) {
        var el = document.createElement('script');
        el.src = '//blockheadsfans.com/messagebot/extension/' + id + '/code/raw';
        el.crossOrigin = 'anonymous';
        document.head.appendChild(el);
    };

    return api;
}

function BlockheadsAPI(ajax, worldId) {
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
                ajax.postJSON('/api', { command: 'status', worldId: worldId }).then(function (world) {
                    if (world.worldStatus == 'online') {
                        return resolve();
                    } else if (world.worldStatus == 'offline') {
                        ajax.postJSON('/api', { command: 'start', worldId: worldId }).then(check);
                    } else {
                        fails++;
                        if (fails > 10) {
                            return reject();
                        }
                        setTimeout(check, 3000);
                    }
                });
            })();
        });
    }

    function getLogs() {
        return cache.worldStarted.then(function () {
            return ajax.get('/worlds/logs/' + worldId).then(function (log) {
                return log.split('\n');
            });
        });
    }

    function getLists() {
        return cache.worldStarted.then(function () {
            return ajax.get('/worlds/lists/' + worldId).then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');

                function getList(name) {
                    return doc.querySelector('textarea[name=' + name + ']').value.toLocaleUpperCase().split('\n');
                }

                var admin = getList('admins');
                var mod = getList('modlist');
                mod = mod.filter(function (name) {
                    return admin.indexOf(name) < 0;
                });
                var staff = admin.concat(mod);

                var white = getList('whitelist');
                var black = getList('blacklist');

                return { admin: admin, mod: mod, staff: staff, white: white, black: black };
            });
        });
    }

    function getHomepage() {
        return ajax.get('/worlds/' + window.worldId);
    }

    var api = {};

    api.worldStarted = function () {
        var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        if (refresh) {
            cache.worldStarted = worldStarted();
        }
        return cache.worldStarted();
    };

    api.getLogs = function () {
        var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        if (refresh) {
            cache.getLogs = getLogs();
        }
        return cache.getLogs;
    };

    api.getOnlinePlayers = function () {
        var refresh = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

        if (refresh) {
            cache.getHomepage = getHomepage();
        }
        return cache.getHomepage.then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var playerElems = doc.querySelector('.manager.padded:nth-child(1)').querySelectorAll('tr:not(.history)>td.left');
            var players = [];

            Array.from(playerElems).forEach(function (el) {
                players.push(el.textContent.toLocaleUpperCase());
            });

            return players;
        });
    };

    api.getOwnerName = function () {
        return cache.getHomepage.then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            return doc.querySelector('.subheader~tr>td:not([class])').textContent.toLocaleUpperCase();
        });
    };

    api.sendMessage = function (message) {
        return ajax.postJSON('/api', { command: 'send', message: message, worldId: worldId });
    };

    api.getMessages = function () {
        return ajax.postJSON('/api', { command: 'getchat', worldId: worldId, firstId: cache.firstId }).then(function (data) {
            if (data.status == 'ok' && data.nextId != cache.firstId) {
                cache.firstId = data.nextId;
                return data.log;
            } else if (data.status == 'error') {
                throw new Error(data.message);
            }
        });
    };

    return api;
}

function MessageBotUI() {
    document.head.innerHTML = '';
    document.head.innerHTML += '<style><style>';
    document.body.innerHTML = '';

    var mainToggle = document.querySelector('#toggle');

    var ui = {
        alertActive: false,
        alertQueue: [],
        alertButtons: {}
    };

    ui.alert = function (text) {
        var buttons = arguments.length <= 1 || arguments[1] === undefined ? [{ text: 'OK' }] : arguments[1];

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
            ui.alertQueue.push({ text: text, buttons: buttons });
            return;
        }
        ui.alertActive = true;

        buttons.forEach(function (button, i) {
            button.dismiss = button.dismiss === false ? false : true; 
            ui.alertButtons['button_' + i] = { action: button.action, thisArg: button.thisArg, dismiss: button.dismiss };
            button.id = 'button_' + i;
            buildButton(this, button);
        }.bind(this));
        document.querySelector('#alert > div').innerHTML = text;

        document.querySelector('#alertOverlay').classList.toggle('visible');
        document.querySelector('#alert').classList.toggle('visible');
    };

    ui.notify = function (text) {
        var displayTime = arguments.length <= 1 || arguments[1] === undefined ? 2 : arguments[1];

        var el = document.createElement('div');
        el.classList.add('notification');
        el.classList.add('visible');
        el.textContent = text;
        document.body.appendChild(el);

        el.addEventListener('click', function () {
            this.remove();
        });
        setTimeout(function () {
            this.classList.remove('visible');
        }.bind(el), displayTime * 1000);
        setTimeout(function () {
            if (this.parentNode) {
                this.remove();
            }
        }.bind(el), displayTime * 1000 + 2100);
    };

    ui.buttonHandler = function (event) {
        var alertButton = ui.alertButtons[event.target.id] || {};
        alertButton.thisArg = alertButton.thisArg || undefined;
        alertButton.dismiss = typeof alertButton.dismiss == 'boolean' ? alertButton.dismiss : true;
        if (typeof alertButton.action == 'function') {
            alertButton.action.call(alertButton.thisArg);
        }
        if (alertButton.dismiss || typeof alertButton.action != 'function') {
            document.querySelector('#alert').classList.toggle('visible');
            document.querySelector('#alertOverlay').classList.toggle('visible');
            document.querySelector('#alert > .buttons').innerHTML = '';
            ui.alertButtons = {};
            ui.alertActive = false;
            ui.checkAlertQueue();
        }
    };

    ui.checkAlertQueue = function () {
        if (ui.alertQueue.length) {
            var alert = ui.alertQueue.shift();
            ui.alert(alert.text, alert.buttons);
        }
    };

    ui.globalTabChange = function (event) {
        if (event.target.getAttribute('g-tab-name') !== null) {
            Array.from(document.querySelectorAll('div.visible:not(#header)')).forEach(function (el) {
                return el.classList.remove('visible');
            }); 
            document.querySelector('#mb_' + event.target.getAttribute('g-tab-name')).classList.add('visible');
            document.querySelector('span.tab.selected').classList.remove('selected');
            event.target.classList.add('selected');
        }
    };

    ui.toggleMenu = function () {
        mainToggle.checked = !mainToggle.checked;
    };

    ui.addTab = function addTab(tabText, tabId) {
        var tabGroup = arguments.length <= 2 || arguments[2] === undefined ? '#mainNavContents' : arguments[2];

        if (tabGroup != '#mainNavContents') {
            tabGroup = '#' + tabGroup + '_tabs';
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

    ui.removeTab = function removeTab(tabId) {
        var tab = document.querySelector('[g-tab-name="' + tabId + '"]');
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

    ui.removeInnerTab = function removeInnerTab(tabName) {
        if (document.querySelector('div[tab-name="' + tabName + '"]') !== null) {
            document.querySelector('div[tab-name="' + tabName + '"]').remove();
            document.querySelector('#mb_' + tabName).remove();
            return true;
        }
        return false;
    };

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


function MessageBot() {
    var bot = {
        devMode: false,
        core: MessageBotCore(),
        ui: MessageBotUI(),
        uMID: 0,
        extensions: [],
        preferences: {}
    };
    bot.version = bot.core.version;

    {
        bot.saveConfig = function saveConfig() {
            var utilSaveFunc = function utilSaveFunc(wrapper, saveTo) {
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

        bot.generateBackup = function generateBackup() {
            bot.ui.alert('<p>Copy the following code to a safe place.<br>Size: ' + Object.keys(localStorage).reduce(function (c, l) {
                return c + l;
            }).length + ' bytes</p><p>' + bot.stripHTML(JSON.stringify(localStorage)) + '</p>');
        };

        bot.loadBackup = function loadBackup() {
            bot.ui.alert('Enter the backup code:<textarea style="width:99%;height:10em;"></textarea>', [{ text: 'Load backup & restart bot', style: 'success', action: function action() {
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

                    Object.keys(code).forEach(function (key) {
                        localStorage.setItem(key, code[key]);
                    });

                    location.reload();
                } }, { text: 'Cancel' }]);
        };

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

    {
        bot.start = function start() {
            var ipBanCheck = function ipBanCheck(message) {
                var data = typeof message == 'string' ? { name: 'SERVER', message: message } : message;
                if (/^\/ban-ip .{3,}/i.test(data.message) && bot.checkGroup('Staff', data.name)) {
                    var ip = bot.core.getIP(/^\/ban-ip (.*)$/.exec(data.message)[1].toLocaleUpperCase());
                    if (ip) {
                        bot.core.send('/ban ' + ip);
                        bot.core.send(ip + ' has been added to the blacklist.');
                    }
                }
                return message; 
            };

            bot.core.addJoinListener('mb_join', 'bot', bot.onJoin);

            bot.core.addLeaveListener('mb_leave', 'bot', bot.onLeave);

            bot.core.addTriggerListener('mb_trigger', 'bot', bot.onTrigger);
            bot.core.addTriggerListener('mb_ip_ban', 'bot', ipBanCheck);
            bot.core.addTriggerListener('mb_notify', 'bot', function (data) {
                if (bot.preferences.notify && document.querySelector('#mb_console.visible') === null) {
                    bot.ui.notify(data.name + ': ' + data.message);
                }
            });

            bot.core.addBeforeSendListener('mb_ip_ban', 'bot', ipBanCheck);
            bot.core.addBeforeSendListener('mb_tweaks', 'bot', function (message) {
                return message.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
            });

            bot.core.addAddMessageListener('scroll_chat', 'bot', bot.showNewChat);

            bot.announcementCheck(0);
            bot.core.startListening();
        };

        bot.addTab = function addTab(navID, contentID, tabName, tabText) {
            void 0;
            bot.ui.addInnerTab(navID, contentID, tabName, tabText);
        };

        bot.removeTab = function removeTab(tabName) {
            void 0;
            bot.ui.removeInnerTab(tabName);
        };

        bot.changeTab = function changeTab(e) {
            void 0;
            bot.ui.changeTab(e);
        };

        bot.showNewChat = function showNewChat() {
            var chatContainer = document.querySelector('#mb_console ul');
            var lastLine = document.querySelector('#mb_console li:last-child');

            if (chatContainer.scrollHeight - chatContainer.clientHeight - chatContainer.scrollTop <= lastLine.clientHeight * 2) {
                lastLine.scrollIntoView(false);
            }
        };
    }

    {
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

        bot.deleteMsg = function deleteMsg(e) {
            bot.ui.alert('Really delete this message?', [{ text: 'Delete', style: 'danger', thisArg: e.target.parentElement, action: function action() {
                    this.remove();
                    bot.saveConfig();
                } }, { text: 'Cancel' }]);
            e.stopPropagation();
        };
    }

    {
        bot.addExtension = function addExtension() {};

        bot.manuallyAddExtension = function manuallyAddExtension() {
            bot.ui.alert('Enter the ID or URL of an extension:<br><input style="width:calc(100% - 7px);"/>', [{ text: 'Add', style: 'success', action: function action() {
                    var extRef = document.querySelector('#alert input').value;
                    if (extRef.length) {
                        if (extRef.indexOf('http') === 0) {
                            var el = document.createElement('script');
                            el.src = extRef;
                            document.head.appendChild(el);
                        } else {
                            bot.addExtension(extRef);
                        }
                    }
                } }, { text: 'Cancel' }]);
        };

        bot.removeExtension = function removeExtension(extensionId) {
            if (typeof window[extensionId] != 'undefined') {
                if (typeof window[extensionId].uninstall == 'function') {
                    window[extensionId].uninstall();
                }

                bot.ui.removeTab('settings_' + extensionId);
                Object.keys(window[extensionId].mainTabs).forEach(function (key) {
                    bot.removeTab('main_' + extensionId + '_' + key);
                });
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
                    setTimeout(function () {
                        bot.textContent = 'Install';
                    }.bind(button), 3000);
                }
            }
        };

        bot.listExtensions = function listExtensions() {
            var el = document.getElementById('mb_ext_list');
            if (!bot.extensions.length) {
                el.innerHTML = '<p>No extensions installed</p>';
                return;
            }

            bot.core.ajax.postJSON('//blockheadsfans.com/messagebot/extension/name', { extensions: JSON.stringify(bot.extensions) }).then(function (resp) {
                void 0;
                if (resp.status == 'ok') {
                    el.innerHTML = resp.extensions.reduce(function (html, ext) {
                        return html + '<li>' + bot.stripHTML(ext.name) + ' (' + ext.id + ') <a onclick="bot.removeExtension(\'' + ext.id + '\');" class="button button-sm">Remove</a></li>';
                    }, '<ul style="margin-left:1.5em;">') + '</ul>';
                } else {
                    throw new Error(resp.message);
                }
            }).catch(function (err) {
                void 0;
                bot.core.reportError(err, 'bot');
                bot.core.addMessageToPage('<span style="color:#f00;">Fetching extension names failed with error: ' + bot.stripHTML(err.message) + '</span>', true);
                el.innerHTML = 'Error fetching extension names';
            });
        };

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

        bot.extActions = function extActions(e) {
            var extId = e.target.parentElement.getAttribute('extension-id');
            var button = document.querySelector('div[extension-id="' + extId + '"] > button');
            extId = extId || e.target.getAttribute('extension-id');
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

    {
        bot.onJoin = function onJoin(data) {
            bot.joinArr.forEach(function (msg) {
                if (bot.checkGroup(msg.group, data.name) && !bot.checkGroup(msg.not_group, data.name) && bot.checkJoins(msg.joins_low, msg.joins_high, bot.core.getJoins(data.name))) {
                    var toSend = bot.replaceAll(msg.message, '{{NAME}}', data.name);
                    toSend = bot.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
                    toSend = bot.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
                    toSend = bot.replaceAll(toSend, '{{ip}}', data.ip);
                    bot.core.send(toSend);
                }
            });
        };

        bot.onLeave = function onLeave(data) {
            bot.leaveArr.forEach(function (msg) {
                if (bot.checkGroup(msg.group, data.name) && !bot.checkGroup(msg.not_group, data.name) && bot.checkJoins(msg.joins_low, msg.joins_high, bot.core.getJoins(data.name))) {
                    var toSend = bot.replaceAll(msg.message, '{{NAME}}', data.name);
                    toSend = bot.replaceAll(toSend, '{{name}}', data.name.toLocaleLowerCase());
                    toSend = bot.replaceAll(toSend, '{{Name}}', data.name[0] + data.name.substring(1).toLocaleLowerCase());
                    toSend = bot.replaceAll(toSend, '{{ip}}', data.ip);
                    bot.core.send(toSend);
                }
            });
        };

        bot.onTrigger = function onTrigger(data) {
            var triggerMatch = function triggerMatch(trigger, message) {
                if (bot.preferences.regexTriggers) {
                    return new RegExp(trigger, 'i').test(message);
                }
                return new RegExp(trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*"), 'i').test(message);
            };
            var sentMessages = 0;

            bot.triggerArr.forEach(function (msg) {
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

        bot.announcementCheck = function announcementCheck(ind) {
            var i = ind;
            if (ind == bot.announcementArr.length) {
                i = 0;
            }
            if (_typeof(bot.announcementArr[i]) == 'object') {
                bot.core.send(bot.announcementArr[i].message);
            }
            setTimeout(bot.announcementCheck.bind(bot), bot.preferences.announcementDelay * 60000, ++i);
        };
    }

    {
        bot.stripHTML = function stripHTML(html) {
            return bot.replaceAll(bot.replaceAll(html, '<', '&lt;'), '>', '&gt;');
        };

        bot.replaceAll = function replaceAll(string, find, replace) {
            return string.replace(new RegExp(find.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g'), replace);
        };

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
                        saveObj.trigger = bot.preferences.disableTrim ? saveObj.trigger : saveObj.trigger.trim();
                    }
                    content.querySelector('.t').value = saveObj.trigger || '';
                }
            }
            container.appendChild(document.importNode(content, true));

            if (template.id != 'aTemplate') {
                var selects = document.querySelectorAll('#m' + bot.uMID + ' > select');

                selects[0].value = saveObj.group || 'All';

                selects[1].value = saveObj.not_group || 'Nobody';
            }
            document.querySelector('#m' + bot.uMID + ' > a').addEventListener('click', bot.deleteMsg.bind(bot), false);

            bot.uMID++;
        };

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

        bot.checkJoins = function checkJoins(low, high, actual) {
            return low <= actual && actual <= high;
        };

        bot.versionCheck = function versionCheck(target) {
            var vArr = bot.version.split('.');
            var tArr = target.replace(/[^0-9.*]/g, '').split('.');
            if (/^[0-9.*]+$/.test(target)) {
                return tArr.every(function (el, i) {
                    return el == vArr[i] || el == '*';
                });
            } else if (/^>[0-9.]+$/.test(target)) {
                for (var i = 0; i < tArr.length; i++) {
                    if (Number(vArr[i]) > Number(tArr[i])) {
                        return true;
                    }
                }
                return false;
            } else if (/^<[0-9.]+$/.test(target)) {
                for (var _i = 0; _i < tArr.length; _i++) {
                    if (Number(vArr[_i]) > Number(tArr[_i])) {
                        return true;
                    }
                }
                return false;
            }
            return false;
        };
    }

    (function (bot) {
        var checkPref = function checkPref(type, name, defval) {
            if (_typeof(bot.preferences[name]) != type) {
                bot.preferences[name] = defval;
            }
        };
        var addListener = function addListener(selector, type, func) {
            var thisVal = arguments.length <= 3 || arguments[3] === undefined ? undefined : arguments[3];

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
        for (var i = 0; i < addMsgElems.length; i++) {
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

        document.querySelector('#mb_ann_delay').value = bot.preferences.announcementDelay;
        document.querySelector('#mb_resp_max').value = bot.preferences.maxResponses;
        document.querySelector('#mb_regex_triggers').checked = bot.preferences.regexTriggers ? 'checked' : '';
        document.querySelector('#mb_disable_trim').checked = bot.preferences.disableTrim ? 'checked' : '';
        document.querySelector('#mb_notify_message').checked = bot.preferences.notify ? 'checked' : '';
    })(bot);

    (function (bot) {
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

        bot.extensions.forEach(function (ext) {
            bot.addExtension(ext);
        });

        bot.joinArr.forEach(function (msg) {
            bot.addMsg(document.getElementById('jMsgs'), document.getElementById('jlTemplate'), msg);
        });
        bot.leaveArr.forEach(function (msg) {
            bot.addMsg(document.getElementById('lMsgs'), document.getElementById('jlTemplate'), msg);
        });
        bot.triggerArr.forEach(function (msg) {
            bot.addMsg(document.getElementById('tMsgs'), document.getElementById('tTemplate'), msg);
        });
        bot.announcementArr.forEach(function (msg) {
            bot.addMsg(document.getElementById('aMsgs'), document.getElementById('aTemplate'), msg);
        });

        bot.saveConfig();
    })(bot);

    bot.core.ajax.getJSON('//blockheadsfans.com/messagebot/extension/store').then(function (data) {
        void 0;
        var content = document.getElementById('extTemplate').content;

        if (data.status == 'ok') {
            data.extensions.forEach(function (extension) {
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
    }).catch(function (err) {
        void 0;
        bot.core.reportError(err, 'bot');
    });

    return bot;
}

function MessageBotExtension(namespace) {
    var extension = {
        id: namespace,
        bot: window.bot,
        core: window.bot.core,
        ui: window.bot.ui,
        settingsTab: null,
        mainTabs: {}
    };

    extension.addSettingsTab = function addSettingsTab(tabText) {
        void 0;
        this.ui.addTab(tabText, 'settings_' + this.id);
        this.settingsTab = document.querySelector('#mb_settings_' + this.id);
    };

    extension.addMainTab = function addMainTab(tabId, tabText) {
        void 0;
        this.ui.addTab(tabText, 'main_' + this.id + '_' + tabId, 'msgs');
        this.mainTabs[tabId] = document.querySelector('#mb_main_' + this.id + '_' + tabId);
    };

    extension.addTab = function addTab(tabText, tabId) {
        var tabGroup = arguments.length <= 2 || arguments[2] === undefined ? '#mainNavContents' : arguments[2];

        this.ui.addTab(tabText, this.id + '_' + tabId, tabGroup);
    };

    extension.addTabGroup = function addTabGroup(tabText, tabId) {
        this.ui.addTabGroup(tabText, this.id + '_' + tabId);
    };

    extension.autoLaunch = function autoLaunch() {
        return this.bot.extensions.indexOf(this.id) > -1;
    };

    extension.setAutoLaunch = function setAutoLaunch(shouldAutoload) {
        this.bot.setAutoLaunch(this.id, shouldAutoload);
    };

    extension.addJoinListener = function addJoinListener(uniqueId, listener) {
        return this.core.addJoinListener(this.id + '_' + uniqueId, this.id, listener);
    };

    extension.removeJoinListener = function removeJoinListener(uniqueId) {
        this.core.removeJoinListener(this.id + '_' + uniqueId);
    };

    extension.addLeaveListener = function addLeaveListener(uniqueId, listener) {
        return this.core.addLeaveListener(this.id + '_' + uniqueId, this.id, listener);
    };

    extension.removeLeaveListener = function removeLeaveListener(uniqueId) {
        this.core.removeLeaveListener(this.id + '_' + uniqueId);
    };

    extension.addTriggerListener = function addTriggerListener(uniqueId, listener) {
        return this.core.addTriggerListener(this.id + '_' + uniqueId, this.id, listener);
    };

    extension.removeTriggerListener = function removeTriggerListener(uniqueId) {
        this.core.removeTriggerListener(this.id + '_' + uniqueId);
    };

    extension.addServerListener = function addServerListener(uniqueId, listener) {
        return this.core.addServerListener(this.id + '_' + uniqueId, this.id, listener);
    };

    extension.removeServerListener = function removeServerListener(uniqueId) {
        this.core.removeServerListener(this.id + '_' + uniqueId);
    };

    extension.addOtherListener = function addOtherListener(uniqueId, listener) {
        return this.core.addOtherListener(this.id + '_' + uniqueId, this.id, listener);
    };

    extension.removeOtherListener = function removeOtherListener(uniqueId) {
        this.core.removeOtherListener(this.id + '_' + uniqueId);
    };

    extension.addBeforeSendListener = function addBeforeSendListener(uniqueId, listener) {
        return this.core.addBeforeSendListener(this.id + '_' + uniqueId, this.id, listener);
    };

    extension.removeBeforeSendListener = function removeBeforeSendListener(uniqueId) {
        this.core.removeBeforeSendListener(this.id + '_' + uniqueId);
    };

    return extension;
}

var bot = MessageBot(getAjax(), getHook(), BHFansAPI(), BlockheadsAPI());
bot.start();

window.addEventListener('error', function (err) {
    try {
        if (err.message == 'Script error') {
            return;
        }

        void 0;
        bot.core.ajax.postJSON('//blockheadsfans.com/messagebot/bot/error', {
            world_name: bot.core.worldName,
            world_id: window.worldId,
            owner_name: bot.core.ownerName,
            bot_version: bot.version,
            error_text: err.message,
            error_file: err.filename,
            error_row: err.lineno,
            error_column: err.colno
        }).then(function (resp) {
            if (resp.status == 'ok') {
                bot.ui.notify('Something went wrong, it has been reported.');
            } else {
                throw new Error(resp.message);
            }
        }).catch(function (err) {
            void 0;
            bot.ui.notify('Error reporting exception: ' + err);
        });
    } catch (e) {
        void 0;
    }
});