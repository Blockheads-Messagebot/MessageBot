import {MessageBot} from '../../bot';
import {Player} from '../../libraries/blockheads/player';

import { ConsoleExtensionExports } from '../console';

MessageBot.registerExtension('console', function(ex, world) {
    if (ex.isNode || !ex.bot.getExports('ui')) {
        throw new Error("This extension should only be loaded in a browser, and must be loaded after the UI is loaded.");
    }

    let consoleExports: ConsoleExtensionExports = {
        log: (message: string) => console.log(message)
    };
    ex.exports = consoleExports;

    function logJoins(player: Player) {
        let message: string;

        if (ex.settings.get('logJoinIps', true)) {
            message = `${player.getName()} (${player.getIP()}) joined.`;
        } else {
            message = `${player.getName()} joined.`;
        }

        consoleExports.log(message);
    }
    world.onJoin.sub(logJoins);

    function logLeaves(player: Player) {
        consoleExports.log(player.getName() + ' left');
    }
    world.onLeave.sub(logLeaves);

    function logMessages({player, message}: {player: Player, message: string}) {
        consoleExports.log(player.getName() + ' ' + message);
    }
    world.onMessage.sub(logMessages);

    ex.uninstall = function() {
        world.onJoin.unsub(logJoins);
        world.onLeave.unsub(logLeaves);
    };
});
