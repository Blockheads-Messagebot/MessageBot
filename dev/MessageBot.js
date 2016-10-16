function MessageBot(ajax, hook, storage, bhfansapi, api, ui) { //jshint ignore:line
    //Helps avoid messages that are tacked onto the end of other messages.
    var chatBuffer = [];
    (function checkBuffer() {
        if (chatBuffer.length) {
            api.send(chatBuffer.shift())
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
        version: '6.0.0',
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
        if (message.startsWith('/')) {
            msgClass += ' command';
        }
        ui.addMessageToConsole(message, name, msgClass);
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
