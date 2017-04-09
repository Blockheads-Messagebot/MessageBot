// Mac / Terminal version, for browser version see the console-browser folder.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("../../bot/bot");
const colors = require('colors/safe');
const readline = require("readline");
bot_1.MessageBot.registerExtension('default/console', function (ex, world) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const log = ex.export('log', (message) => {
        var columns = process.stdout.columns;
        // Set cursor to beginning of current line.
        readline.moveCursor(process.stdout, -200, 0);
        // Pad message to avoid long typed messages showing up.
        console.log(message + ' '.repeat(columns - message.length % columns));
        // Re-prompt for input.
        rl.prompt(true);
    });
    function handleInput(message) {
        if (message.startsWith('//eval')) {
            console.log(eval(message.substr(6)));
            return;
        }
        switch (message) {
            case '//quit':
                return process.exit(0);
            default:
                ex.bot.send(message);
        }
        rl.prompt(true);
    }
    rl.on('line', handleInput);
    function logChat({ player, message }) {
        if (player.isAdmin()) {
            log(colors.blue(player.getName()) + ': ' + message);
        }
        else if (player.isMod()) {
            log(colors.green(player.getName()) + ': ' + message);
        }
        else {
            log(player.getName() + ': ' + message);
        }
    }
    world.onMessage.sub(logChat);
    function logJoins(player) {
        console.log(player.getName(), 'joined the server.');
    }
    world.onJoin.sub(logJoins);
    function logLeaves(player) {
        console.log(player.getName(), 'left');
    }
    world.onLeave.sub(logLeaves);
    function logOther(message) {
        console.log(message);
    }
    world.onOther.sub(logOther);
    ex.uninstall = function () {
        world.onMessage.unsub(logChat);
        world.onJoin.unsub(logJoins);
        world.onLeave.unsub(logLeaves);
        world.onOther.unsub(logOther);
        rl.removeListener('line', handleInput);
        rl.close();
    };
});
