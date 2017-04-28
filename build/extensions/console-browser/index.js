"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bot_1 = require("../../bot");
bot_1.MessageBot.registerExtension('console', function (ex, world) {
    if (ex.isNode || !ex.bot.getExports('ui')) {
        throw new Error("This extension should only be loaded in a browser, and must be loaded after the UI is loaded.");
    }
    var log = ex.export('log', function (message) {
        console.log(message);
    });
    function logJoins(player) {
        var message;
        if (ex.settings.get('logJoinIps', true)) {
            message = player.getName() + " (" + player.getIP() + ") joined.";
        }
        else {
            message = player.getName() + " joined.";
        }
        log(message);
    }
    world.onJoin.sub(logJoins);
    function logLeaves(player) {
        log(player.getName() + ' left');
    }
    world.onLeave.sub(logLeaves);
    function logMessages(_a) {
        var player = _a.player, message = _a.message;
        log(player.getName() + ' ' + message);
    }
    world.onMessage.sub(logMessages);
    ex.uninstall = function () {
        world.onJoin.unsub(logJoins);
        world.onLeave.unsub(logLeaves);
    };
});
