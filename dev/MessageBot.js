var api = require('./libs/blockheads');
var storage = require('./libs/storage');

const VERSION = '6.1.0';
storage.set('mb_version', VERSION, false);

// Update the players object


var messages = {
    trigger: storage.getObject('triggerArr', []),
    join: storage.getObject('joinArr', []),
    leave: storage.getObject('leaveArr', []),
};


module.exports = {

};




function MessageBot(ajax, hook, storage, bhfansapi, api, ui) { //jshint ignore:line


    //Add messages to page



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

        saveFromWrapper('lMsgs', messages.leave, 'leaveArr');
        saveFromWrapper('jMsgs', messages.join, 'joinArr');
        saveFromWrapper('tMsgs', messages.trigger, 'triggerArr');

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
            .catch(() => { /* Nothing */ })
            .then(() => {
                [input, button].forEach((el) => el.disabled = false);
                if (document.querySelector('#mb_console.visible')) {
                    input.focus();
                }
            });
    }

    //Listen for user to send message
    document.querySelector('#mb_console input').addEventListener('keydown', function(event) {
        if (event.key == "Enter" || event.keyCode == 13) {
            event.preventDefault();
            userSend(event.target.value);
        }
    });
    document.querySelector('#mb_console button').addEventListener('click', function() {
        userSend(document.querySelector('#mb_console input').value);
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



    return bot;
}
