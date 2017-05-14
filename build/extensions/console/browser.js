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
    tab.querySelector('button').addEventListener('click', userSend);
    // Autoscroll when new chat is added to the page, unless we are scrolled up.
    new MutationObserver(function (events) {
        // Each line adds 24 pixels to the page
        // let totalAdded = events.length * 24;
        console.log(events.length);
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
