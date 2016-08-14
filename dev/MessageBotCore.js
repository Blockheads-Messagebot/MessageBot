function MessageBotCore() { //jshint ignore:line
    //Defaults
    var core = {
            version: '5.2.1',
            ownerName: '',
            online: ['SERVER'],
            players: {},
            logs: [],
            listening: false,
            checkOnlineWait: 300000,
            sendDelay: 1000,
            joinFuncs: {},
            leaveFuncs: {},
            triggerFuncs: {},
            serverFuncs: {},
            otherFuncs: {},
            addMessageToPageFuncs: {},
            sendChecks: {},
            adminList: [],
            modList: [],
            staffList: [],
            toSend: [],
            chatMsgMaxCount: 500
            };

    core.worldName = document.title.substring(0, document.title.indexOf('Manager | Portal') - 1);

    //In regards to sending chat
    {
        /**
         * Adds a message to the queue to send when possible.
         *
         * @param string message the message to be checked and then sent.
         * @return void
         */
        core.send = function send(message) {
            core.toSend.push(message);
        };

        /**
         * Passes the oldest queued message through checks and sends it if it passes all checks.
         *
         * @return void
         */
        core.postMessage = function postMessage() {
            if (core.toSend.length > 0) {
                var tmpMsg = core.toSend.shift();
                Object.keys(core.sendChecks).forEach((key) => {
                    if (tmpMsg) {
                        try {
                            tmpMsg = core.sendChecks[key].listener(tmpMsg);
                        } catch (e) {
                            console.log(e);
                            core.reportError(e, core.sendChecks[key].owner);
                        }
                    }
                });
                if (tmpMsg) {
                    core.ajax.postJSON(window.apiURL, { command: 'send', worldId: window.worldId, message: tmpMsg });
                }
            }
            setTimeout(core.postMessage.bind(core), core.sendDelay);
        };

        /**
         * Lets users send messages from the console, also ensures that commands are displayed and not eaten
         *
         * @param MessageBotCore core a reference to the core
         * @return void
         */
        core.userSend = function userSend(core) {
            var button = document.querySelector('#mb_console > div:nth-child(2) > button');
            var message = document.querySelector('#mb_console > div:nth-child(2) > input');
            var tmpMsg = message.value;

            Object.keys(core.sendChecks).forEach((key) => {
                if (tmpMsg) {
                    tmpMsg = core.sendChecks[key].listener(tmpMsg);
                }
            });

            if (tmpMsg) {
                button.setAttribute('disabled', '1');
                message.setAttribute('disabled', '1');
                core.ajax.postJSON(window.apiURL, { command: 'send', worldId: window.worldId, message: tmpMsg }).then(function (data) {
                    if (data.status == 'ok') {
                        message.value = '';
                        button.textContent = 'SEND';
                        core.pollChat(core, false);
                    } else {
                        button.textContent = 'RETRY';
                    }

                    button.removeAttribute('disabled');
                    message.removeAttribute('disabled');
                    message.focus();
                }).then(function() {
                    if (tmpMsg.indexOf('/') === 0) {
                        core.addMessageToPage({name: 'SERVER', message: tmpMsg});
                    }
                }).catch(function(error) {
                    core.addMessageToPage(`<span style="color:#f00;">Error sending: ${error}</span>`, true);
                    core.reportError(error, 'bot');
                });
            } else {
                button.textContent = 'CANCELED';
            }
        };

        /**
         * Preserves the enter = send functionality
         *
         * @param EventArgs EventArgs
         * @param MessageBotCore core
         */
        core.enterCheck = function enterCheck(event, core) {
            if (event.keyCode == 13) {
                if (event.preventDefault) {
                    event.preventDefault();
                } else {
                    event.returnValue = false;
                }
                core.userSend(core);
            }
        };
    }

    //Dealing with recieving chat
    {
        /**
         * Internal method. Use startListening and stopListening to control this function.
         *
         * @param MessageBotCore core a reference to the core.
         * @param boolean auto whether or not to keep polling.
         * @return void
         */
        core.pollChat = function pollChat(core, auto = true) {
            core.ajax.postJSON(window.apiURL, { command: 'getchat', worldId: window.worldId, firstId: core.chatId })
            .then((data) => {
                if (data.status == 'ok' && data.nextId != core.chatId) {
                    data.log.forEach((m) => {
                        core.parseMessage(m);
                    });
                    core.chatId = data.nextId;
                } else if (data.status == 'error') {
                    setTimeout(core.pollChat, core.checkOnlineWait, core);
                    throw new Error(data.message);
                }
            })
            .then(() => {
                if (auto) {
                    setTimeout(core.pollChat, 5000, core);
                }
            });
        };

        /**
         * Used to parse messages recieved from the server into objects which can be used. Also calls appropriate listeners.
         */
        core.parseMessage = function parseMessage(message) {
            let getUserName = (message) => {
                for (let i = 18; i > 4; i--) {
                    let possibleName = message.substring(0, message.lastIndexOf(': ', i));
                    if (core.online.indexOf(possibleName) >= 0 || possibleName == 'SERVER') {
                        return { name: possibleName, safe: true };
                    }
                }
                //The user is not in our online list. Use the old substring method without checking that the user is online
                return { name: message.substring(0, message.lastIndexOf(': ', 18)), safe: false };
            };

            if (message.indexOf(core.worldName + ' - Player Connected ') === 0) {
                core.addMessageToPage(message);

                let name = message.substring(core.worldName.length + 20, message.lastIndexOf('|', message.lastIndexOf('|') - 1) - 1);
                let ip = message.substring(message.lastIndexOf(' | ', message.lastIndexOf(' | ') - 1) + 3, message.lastIndexOf(' | '));

                //Update player values
                if (core.players.hasOwnProperty(name)) {
                    //Returning player
                    core.players[name].joins++;
                } else {
                    //New player
                    core.players[name] = {};
                    core.players[name].joins = 1;
                    core.players[name].ips = [];
                }
                core.players[name].ip = ip;
                core.online.push(name);

                Object.keys(core.joinFuncs).forEach((key) => {
                    try {
                        core.joinFuncs[key].listener({name, ip});
                    } catch(e) {
                        console.log('Error', e);
                        core.reportError(e, core.joinFuncs[key].owner);
                    }
                });
            } else if (message.indexOf(core.worldName + ' - Player Disconnected ') === 0) {
                core.addMessageToPage(message);

                let name = message.substring(core.worldName.length + 23);
                let ip = core.getIP(name);
                //Remove the user from the online list.
                var playerIn = core.online.indexOf(name);
                if (playerIn > -1) {
                    core.online.splice(name, 1);
                }

                Object.keys(core.leaveFuncs).forEach((key) => {
                    try {
                        core.leaveFuncs[key].listener({name, ip});
                    } catch (e) {
                        console.log('Error', e);
                        core.reportError(e, core.leaveFuncs[key].owner);
                    }
                });
            } else if (message.indexOf(': ') >= 0) {
                //A chat message - server or player?
                var messageData = getUserName(message);
                messageData.message = message.substring(messageData.name.length + 2);
                core.addMessageToPage(messageData);
                //messageData resembles this:
                //    {name:"ABC123", message:"Hello there!", safe:true}

                if (messageData.name == 'SERVER') {
                    //Server message
                    Object.keys(core.serverFuncs).forEach((key) => {
                        try {
                            core.serverFuncs[key].listener(messageData);
                        } catch (e) {
                            console.log('Error', e);
                            core.reportError(e, core.serverFuncs[key].owner);
                        }
                    });
                } else {
                    //Regular player message
                    Object.keys(core.triggerFuncs).forEach((key) => {
                        try {
                            core.triggerFuncs[key].listener(messageData);
                        } catch (e) {
                            console.log('Error', e);
                            core.reportError(e, core.triggerFuncs[key].owner);
                        }
                    });
                }
            } else {
                core.addMessageToPage(message);
                Object.keys(core.otherFuncs).forEach((key) => {
                    try {
                        core.otherFuncs[key].listener(message);
                    } catch (e) {
                        console.log('Error', e);
                        core.reportError(e, core.otherFuncs[key].owner);
                    }
                });
            }
        };
    }

    //Dealing with the UI
    {
        /**
         * Adds a message to the console, expects this to be assigned to the core
         *
         * @param string|object Either an object with properties name and message, or a string
         * @param bool Whether or not to parse the object as HTML or as text. Default: false (text)
         * @return void
         */
        core.addMessageToPage = function addMessageToPage(msg, html = false) {
            var msgEl = document.createElement('li');

            if (typeof msg == 'object') {
                if (core.staffList.indexOf(msg.name) > -1) {
                    msgEl.setAttribute('class', (core.adminList.indexOf(msg.name) > -1) ? 'admin' : 'mod');
                }
                msgEl.appendChild(document.createElement('span'));
                msgEl.querySelector('span').textContent = msg.name;

                msgEl.appendChild(document.createElement('span'));
                msgEl.querySelector('span:nth-child(2)').textContent = ': ' + msg.message;
            } else {
                if (html) {
                    msgEl.innerHTML = msg;
                } else {
                    msgEl.textContent = msg;
                }
            }

            var chat = document.querySelector('#mb_console ul');
            chat.appendChild(msgEl);

            while (chat.children.length > core.chatMsgMaxCount) {
                chat.removeChild(chat.childNodes[0]);
            }

            Object.keys(core.addMessageToPageFuncs).forEach((key) => {
                try {
                    core.addMessageToPageFuncs[key].listener();
                } catch(e) {
                    core.reportError(e, core.addMessageToPageFuncs[key].owner);
                }
            });
        };
    }

    //Dealing with player data
    {
        /**
         * Gets the most recently used IP for a player by name and returns it
         * @param string name the name of the player
         * @return string|bool the most recently used IP or false on failure
         */
        core.getIP = function getIP(name) {
            if (core.players.hasOwnProperty(name)) {
                return core.players[name].ip;
            }
            return false;
        };

        /**
         * Gets the number of times a player has joined the server
         *
         * @param string name the name of the player
         * @return int|bool the number of joins, or false if the player has not joined the server
         */
        core.getJoins = function getJoins(name) {
            if (core.players.hasOwnProperty(name)) {
                return core.players[name].joins;
            }
            return false;
        };

    }

    //Controlling the core
    {
        /**
         * Method used to tell the bot to start listening to chat
         *
         * @return void
         */
        core.startListening = function startListening() {
            core.chatId = window.chatId || 0;
            core.chatId = (core.chatId < 20) ? 0 : core.chatId - 20;
            core.pollChat(core);
            core.listening = true;
        };
    }

    //Chat listening control
    {
        /**
         * Method used to add a listener
         *
         * @param string uniqueId the unique id of the listener
         * @param function listener the function which will be attatched to join messages
         * @return bool true on success, false if the unique ID has already been used or the listener is not a function
         */
        core.addJoinListener = function addJoinListener(uniqueId, owner, listener) {
            if (!core.joinFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
                core.joinFuncs[uniqueId] = {owner, listener};
                return true;
            } else {
                return false;
            }
        };

        /**
         * Removes the listener on join messages by the id
         *
         * @param string uniqueId the id of the listener
         * @return void
         */
        core.removeJoinListener = function removeJoinListener(uniqueId) {
            delete core.joinFuncs[uniqueId];
        };

        /**
         * Method used to add a listener
         *
         * @param string uniqueId the unique id of the listener
         * @param function listener the function which will be attatched to join messages
         * @return bool true on success, false if the unique ID has already been used
         */
        core.addLeaveListener = function addLeaveListener(uniqueId, owner, listener) {
            if (!core.leaveFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
                core.leaveFuncs[uniqueId] = {owner, listener};
                return true;
            } else {
                return false;
            }
        };

        /**
         * Removes the listener on leave messages by the id
         *
         * @param string uniqueId the id of the listener
         * @return void
         */
        core.removeLeaveListener = function removeLeaveListener(uniqueId) {
            delete core.leaveFuncs[uniqueId];
        };

        /**
         * Method used to add a listener
         *
         * @param string uniqueId the unique id of the listener
         * @param function listener the function which will be attatched to join messages
         * @return bool true on success, false if the unique ID has already been used or the listener is not a function
         */
        core.addTriggerListener = function addTriggerListener(uniqueId, owner, listener) {
            if (!core.triggerFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
                core.triggerFuncs[uniqueId] = {owner, listener};
                return true;
            } else {
                return false;
            }
        };

        /**
         * Removes the listener on trigger messages by the id
         *
         * @param string uniqueId the id of the listener
         * @return void
         */
        core.removeTriggerListener = function removeTriggerListener(uniqueId) {
            delete core.joinFuncs[uniqueId];
        };

        /**
         * Method used to add a listener
         *
         * @param string uniqueId the unique id of the listener
         * @param function listener the function which will be attatched to join messages
         * @return bool true on success, false if the unique ID has already been used or the listener is not a function
         */
        core.addServerListener = function addServerListener(uniqueId, owner, listener) {
            if (!core.serverFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
                core.serverFuncs[uniqueId] = {owner, listener};
                return true;
            } else {
                return false;
            }
        };

        /**
         * Removes the listener on server messages by the id
         *
         * @param string uniqueId the id of the listener
         * @return void
         */
        core.removeServerListener = function removeServerListener(uniqueId) {
            delete core.serverFuncs[uniqueId];
        };

        /**
         * Method used to add a listener
         *
         * @param string uniqueId the unique id of the listener
         * @param function listener the function which will be attatched to join messages
         * @return bool true on success, false if the unique ID has already been used or the listener is not a function
         */
        core.addOtherListener = function addOtherListener(uniqueId, owner, listener) {
            if (!core.otherFuncs.hasOwnProperty(uniqueId) && typeof listener == "function") {
                core.otherFuncs[uniqueId] = {owner, listener};
                return true;
            } else {
                return false;
            }
        };

        /**
         * Removes the listener on trigger messages by the id
         *
         * @param string uniqueId the id of the listener
         * @return void
         */
        core.removeOtherListener = function removeOtherListener(uniqueId) {
            delete core.otherFuncs[uniqueId];
        };

        /**
         * Method used to add a listener
         *
         * @param string uniqueId the unique id of the listener
         * @param function listener the function which will be attatched to join messages
         * @return bool true on success, false if the unique ID has already been used or the listener is not a function
         */
        core.addBeforeSendListener = function addBeforeSendListener(uniqueId, owner, listener) {
            if (!core.sendChecks.hasOwnProperty(uniqueId) && typeof listener == "function") {
                core.sendChecks[uniqueId] = {owner, listener};
                return true;
            } else {
                return false;
            }
        };

        /**
         * Removes the listener on checks before sending by the id
         *
         * @param string uniqueId the id of the listener
         * @return void
         */
        core.removeBeforeSendListener = function removeBeforeSendListener(uniqueId) {
            delete core.sendChecks[uniqueId];
        };
    }

    //Core listeners
    {
        /**
         * Method used to add a listener
         *
         * @param string id the unique id of the listener
         * @param string owner the ID of the owner of the listener. Extension ID or bot.
         * @param function listener the function which will be attatched to join messages
         * @return bool true on success, false if the unique ID has already been used or the listener is not a function
         */
        core.addAddMessageListener = function addAddMessageListener(id, owner, listener) {
            if (!core.addMessageToPageFuncs[id]) {
                core.addMessageToPageFuncs[id] = {owner, listener};
                return true;
            }
            return false;
        };

        /**
         * Removes the listener on join messages by the id, if it exists.
         *
         * @param string id the unique id of the listener
         * @return void
         */
        core.removeAddMessageListener = function removeAddMessageListener(id) {
            delete core.addMessageToPageFuncs[id];
        };
    }

    //For making requests
    core.ajax = window.ajax;

    //For handling errors nicely
    core.reportError = (err, owner) => {
        console.info('Reporting error (core):', err, owner);
        core.ajax.postJSON('//blockheadsfans.com/messagebot/bot/error',
            {
                world_name: core.worldName,
                world_id: window.worldId,
                owner_name: core.ownerName,
                bot_version: core.version,
                error_text: err.message,
                error_file: `http://blockheadsfans.com/messagebot/extension/${owner}/code/raw/`,
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

    //Make sure the world is online.
    (function(core) {
        return new Promise((resolve, reject) => {
            let fails = 0;
            (function waitForWorld(core) {
                core.ajax.postJSON(`/api`, { command: 'status', worldId: window.worldId }).then((world) => {
                    if (world.worldStatus == 'online') {
                        return resolve();
                    } else if (world.worldStatus == 'offline') {
                        core.ajax.postJSON('/api', { command: 'start', worldId: window.worldId }).then(() => {
                            waitForWorld(core);
                        });
                    } else {
                        fails++;
                        if (fails > 10) {
                            return reject();
                        }
                        setTimeout(waitForWorld, 5000, core);
                    }
                });
            }(core));
        });
    }(core))
    .then(() => {
        //The world is now online. Fetch logs, online players, and lists.
        core.ajax.get(`/worlds/logs/${window.worldId}`).then(function(response) {
            core.logs = response.split('\n');
            core.logs.forEach((line) => {
                if (line.indexOf(core.worldName + ' - Player Connected ') > -1) {
                    var player = line.substring(line.indexOf(' - Player Connected ') + 20, line.lastIndexOf('|', line.lastIndexOf('|') - 1) - 1);
                    var ip = line.substring(line.lastIndexOf(' | ', line.lastIndexOf(' | ') - 1) + 3, line.lastIndexOf(' | '));

                    if (core.players.hasOwnProperty(player)) {
                        core.players[player].joins++;
                    } else {
                        core.players[player] = {};
                        core.players[player].ips = [];
                        core.players[player].joins = 1;
                    }
                    core.players[player].ip = ip;
                    if (core.players[player].ips.indexOf(ip) < 0) {
                        core.players[player].ips.push(ip);
                    }
                }
            });
        });

        //Get staff lists
        core.ajax.get(`/worlds/lists/${window.worldId}`).then(function(response) {
            var doc = (new DOMParser()).parseFromString(response, 'text/html');
            core.adminList = doc.querySelector('textarea[name=admins]').value.split('\n');
            core.adminList.push(core.ownerName);
            core.adminList.push('SERVER');
            core.adminList.forEach((admin, index) => {
                core.adminList[index] = admin.toUpperCase();
            });
            var mList = doc.querySelector('textarea[name=modlist]').value.split('\n');
            mList.forEach((mod, index) => {
                mList[index] = mod.toUpperCase();
            });
            core.modList = mList.filter(function (mod) {
                return core.adminList.indexOf(mod) < 0;
            });

            core.staffList = core.adminList.concat(core.modList);
        });

        //Get online players
        core.ajax.get(`/worlds/${window.worldId}`).then(function(response) {
            var doc = (new DOMParser()).parseFromString(response, 'text/html');
            core.ownerName = doc.querySelector('.subheader~tr>td:not([class])').textContent;
            var playerElems = doc.querySelector('.manager.padded:nth-child(1)').querySelectorAll('tr:not(.history)>td.left');
            var playerElemsCount = playerElems.length;
            for (var i = 0; i < playerElemsCount; i++) {
                if (core.online.indexOf(playerElems[i].textContent) < 0) {
                    core.online.push(playerElems[i].textContent);
                }
            }
        });
    })
    .catch(() => {
        core.addMessageToPage(`<span style="color:#f00;">The world took too long to start. The bot will not be able to function correctly.</span>`, true);
    });

    //Start listening for messages to send
    core.postMessage();

    //Start listening for admin / mod changes
    core.staffChangeCheck = function staffChangeCheck(data) {
        let rebuildStaffList = () => {
            core.staffList = core.adminList.concat(core.modList);
        };
        let messageData = (typeof data == 'string') ? {name: 'SERVER', message: data} : data;
        if (core.adminList.indexOf(messageData.name) != -1) {
            var targetName;
            switch (messageData.message.toLocaleUpperCase().substring(0, messageData.message.indexOf(' '))) {
                case '/ADMIN':
                    targetName = messageData.message.toLocaleUpperCase().substring(7);
                    if (core.adminList.indexOf(targetName) < 0) {
                        core.adminList.push(targetName);
                        rebuildStaffList();
                    }
                    break;
                case '/UNADMIN':
                    targetName = messageData.message.toLocaleUpperCase().substring(10);
                    if (core.adminList.indexOf(targetName) != -1) {
                        core.modList.splice(core.adminList.indexOf(targetName), 1);
                        rebuildStaffList();
                    }
                    break;
                case '/MOD':
                    targetName = messageData.message.toLocaleUpperCase().substring(5);
                    if (core.modList.indexOf(targetName) < 0) {
                        core.modList.push(targetName);
                        rebuildStaffList();
                    }
                    break;
                case '/UNMOD':
                    targetName = messageData.message.toLocaleUpperCase().substring(7);
                    if (core.modList.indexOf(targetName) != -1) {
                        core.modList.splice(core.modList.indexOf(targetName), 1);
                        rebuildStaffList();
                    }
            }
        }
        return data;
    };
    core.addServerListener('core_staffChanges', 'bot', core.staffChangeCheck.bind(core));
    core.addTriggerListener('core_staffChanges', 'bot', core.staffChangeCheck.bind(core));

    return core;
}
