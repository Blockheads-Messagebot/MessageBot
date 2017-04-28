// Mac / Terminal version, for browser version see the console-browser folder. The exports are the same for both extensions.

export interface ConsoleExtensionExports {
    log: (message: string) => void;
}

import {MessageBot} from '../../bot/bot';

import {Player} from '../../libraries/blockheads/player';
const colors = require('colors/safe') as {
    green: (s: string) => string,
    blue: (s: string) => string,
};
import * as readline from 'readline';

MessageBot.registerExtension('console', function(ex, world) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    let consoleExports: ConsoleExtensionExports = {
        log: (message: string) => {
            var columns = (process.stdout as any).columns as number;

            // Set cursor to beginning of current line.
            readline.moveCursor(process.stdout, -200, 0);

            // Pad message to avoid long typed messages showing up.
            console.log(message + ' '.repeat(columns - message.length % columns));

            // Re-prompt for input.
            rl.prompt(true);
        }
    };


    function handleInput(message: string) {
        if (message.startsWith('//eval')) {
            console.log(eval(message.substr(6)));
            return;
        }

        switch(message) {
            case '//quit':
                return process.exit(0);
            default:
                ex.bot.send(message);
        }

        rl.prompt(true);
    }
    rl.on('line', handleInput);

    function logChat({player, message}: {player: Player, message: string}): void {
        if (player.isAdmin()) {
            consoleExports.log(colors.blue(player.getName()) + ': ' + message);
        } else if (player.isMod()) {
            consoleExports.log(colors.green(player.getName()) + ': ' + message);
        } else {
            consoleExports.log(player.getName() + ': ' + message);
        }
    }
    world.onMessage.sub(logChat);

    function logJoins(player: Player) {
        let message: string;

        if (ex.settings.get('logJoinIps', true)) {
            message = `${player.getName()} (${player.getIP()}) joined the server.`;
        } else {
            message = `${player.getName()} joined the server.`;
        }

        consoleExports.log(message);
    }
    world.onJoin.sub(logJoins);

    function logLeaves(player: Player): void {
        consoleExports.log(player.getName() + ' left');
    }
    world.onLeave.sub(logLeaves);

    function logOther(message: string): void {
        consoleExports.log(message);
    }
    world.onOther.sub(logOther);

    ex.uninstall = function() {
        world.onMessage.unsub(logChat);
        world.onJoin.unsub(logJoins);
        world.onLeave.unsub(logLeaves);
        world.onOther.unsub(logOther);
        rl.removeListener('line', handleInput);
        rl.close();
    };
});
