"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bot_1 = require("../../bot");
bot_1.MessageBot.registerExtension('console', function (ex, world) {
    if (ex.isNode || !ex.bot.getExports('ui')) {
        throw new Error("This extension should only be loaded in a browser, and must be loaded after the UI is loaded.");
    }
    var consoleExports = {
        log: function (message) { return console.log(message); }
    };
    ex.exports = consoleExports;
    function logJoins(player) {
        var message;
        if (ex.settings.get('logJoinIps', true)) {
            message = player.getName() + " (" + player.getIP() + ") joined.";
        }
        else {
            message = player.getName() + " joined.";
        }
        consoleExports.log(message);
    }
    world.onJoin.sub(logJoins);
    function logLeaves(player) {
        consoleExports.log(player.getName() + ' left');
    }
    world.onLeave.sub(logLeaves);
    function logMessages(_a) {
        var player = _a.player, message = _a.message;
        consoleExports.log(player.getName() + ' ' + message);
    }
    world.onMessage.sub(logMessages);
    ex.uninstall = function () {
        world.onJoin.unsub(logJoins);
        world.onLeave.unsub(logLeaves);
    };
});
