"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bot_1 = require("../../bot");
var fs = require("fs");
bot_1.MessageBot.registerExtension('console', function (ex, world) {
    if (ex.isNode || !ex.bot.getExports('ui')) {
        throw new Error('This extension should only be loaded in a browser, and must be loaded after the UI is loaded.');
    }
    var ui = ex.bot.getExports('ui');
    // Create the tab.
    var style = document.createElement('style');
    style.textContent = require('./style.scss').css;
    document.head.appendChild(style);
    var tab = ui.addTab('Console');
    tab.innerHTML = fs.readFileSync(__dirname + '/tab.html', 'utf8');
    var chatUl = tab.querySelector('ul');
    var chatContainer = chatUl.parentElement;
    var template = tab.querySelector('template');
    // Handle sending
    var input = tab.querySelector('input');
    function userSend() {
        if (input.value.startsWith('/')) {
            consoleExports.log(input.value);
        }
        world.send(input.value);
        input.value = '';
    }
    input.addEventListener('keyup', function (event) {
        if (event.key == 'Enter') {
            userSend();
        }
    });
    // History module, used to be a separate extension
    (function () {
        var history = [];
        var current = 0;
        function addToHistory(message) {
            history.push(message);
            while (history.length > 100) {
                history.shift();
            }
            current = history.length;
        }
        function addIfNew(message) {
            if (message != history.slice(-1).pop()) {
                addToHistory(message);
            }
            else {
                current = history.length;
            }
        }
        input.addEventListener('keydown', function (event) {
            if (event.key == 'ArrowUp') {
                if (input.value.length && current == history.length) {
                    addToHistory(input.value);
                    current--;
                }
                if (history.length && current) {
                    input.value = history[--current];
                }
            }
            else if (event.key == 'ArrowDown') {
                if (history.length > current + 1) {
                    input.value = history[++current];
                }
                else if (history.length == current + 1) {
                    input.value = '';
                    current = history.length;
                }
            }
            else if (event.key == 'Enter') {
                addIfNew(input.value);
            }
        });
    }());
    tab.querySelector('button').addEventListener('click', userSend);
    // Autoscroll when new chat is added to the page, unless we are scrolled up.
    new MutationObserver(function (events) {
        var total = chatUl.children.length;
        // Determine how many messages have been added
        var addedHeight = 0;
        for (var i = total - events.length; i < total; i++) {
            addedHeight += chatUl.children[i].clientHeight;
        }
        // If we were scrolled down already, stay scrolled down
        if (chatContainer.scrollHeight - chatContainer.clientHeight - chatContainer.scrollTop == addedHeight) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        // Remove old messages if necessary
        while (chatUl.children.length > 500) {
            chatUl.children[0].remove();
        }
    }).observe(chatUl, { childList: true, subtree: true });
    // Add a message to the page
    function addPlayerMessage(player, message) {
        if (!message.length)
            return;
        var messageClass = 'player';
        if (player.isAdmin())
            messageClass = 'admin';
        if (player.isMod())
            messageClass = 'mod';
        ui.buildTemplate(template, chatUl, [
            { selector: 'li', 'class': messageClass },
            { selector: 'span:first-child', text: player.getName() },
            { selector: 'span:last-child', text: ': ' + message }
        ]);
    }
    function addGenericMessage(message) {
        if (!message.length)
            return;
        var li = document.createElement('li');
        li.textContent = message;
        chatUl.appendChild(li);
    }
    // Export required functions
    var consoleExports = {
        log: function (message) { return addPlayerMessage(world.getPlayer('SERVER'), message); }
    };
    ex.exports = consoleExports;
    function logJoins(player) {
        if (ex.settings.get('logJoinIps', true)) {
            consoleExports.log(player.getName() + " (" + player.getIP() + ") joined.");
        }
        else {
            consoleExports.log(player.getName() + " joined.");
        }
    }
    world.onJoin.sub(logJoins);
    function logLeaves(player) {
        consoleExports.log(player.getName() + ' left');
    }
    world.onLeave.sub(logLeaves);
    function logMessages(_a) {
        var player = _a.player, message = _a.message;
        addPlayerMessage(player, message);
    }
    world.onMessage.sub(logMessages);
    function logOther(message) {
        if (ex.settings.get('logUnparsedMessages', true)) {
            addGenericMessage(message);
        }
    }
    world.onOther.sub(logOther);
    ex.uninstall = function () {
        ui.removeTab(tab);
        style.remove();
        world.onJoin.unsub(logJoins);
        world.onLeave.unsub(logLeaves);
        world.onMessage.unsub(logMessages);
        world.onOther.unsub(logOther);
    };
});
