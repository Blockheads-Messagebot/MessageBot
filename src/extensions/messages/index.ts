import {MessageBot} from '../../bot/bot';
import {MessageBotExtension} from '../../bot/extension';
import {Player} from '../../libraries/blockheads/player';
import {World} from '../../libraries/blockheads/world';

import {checkJoins, checkGroups} from './helpers';

/** @hidden */
export interface MessageConfig {
    message: string;
    joins_low: number;
    join_high: number;
    group: MessageGroupType;
    not_group: MessageGroupType;
}

/** @hidden */
export type MessageGroupType = 'all' | 'staff' | 'mod' | 'admin' | 'owner' | 'nobody';


MessageBot.registerExtension('messages', function(ex, world) {
    let uninstallFns = [
        joinModule(ex, world),
        leaveModule(ex, world),
        triggerModule(ex, world),
        announcementModule(ex, world),
    ];

    ex.uninstall = function() {
        uninstallFns.forEach(fn => fn());
        ex.settings.removeAll();
    };
});


/** @hidden */
type JoinMessageConfig = MessageConfig;

/** @hidden */
function joinModule(ex: MessageBotExtension, world: World) {
    let STORAGE_ID = 'joinArr';
    let storage = world.storage;

    function handleJoin(player: Player) {
        let messages = storage.getObject(STORAGE_ID, [] as JoinMessageConfig[]);

        for (let msg of messages) {
            if (!checkJoins(player, msg) || !checkGroups(player, msg)) {
                continue;
            }

            ex.bot.send(msg.message, {name: player.getName()});
        }
    }
    world.onJoin.sub(handleJoin);

    return function uninstall() {
        world.onJoin.unsub(handleJoin);
        world.storage.clearNamespace(STORAGE_ID);
    };
}


/** @hidden */
type LeaveMessageConfig = MessageConfig;

/** @hidden */
function leaveModule(ex: MessageBotExtension, world: World) {
    let STORAGE_ID = 'leaveArr';
    let storage = world.storage;

    function handleLeave(player: Player) {
        let messages = storage.getObject(STORAGE_ID, [] as LeaveMessageConfig[]);

        for (let msg of messages) {
            if (!checkJoins(player, msg) || !checkGroups(player, msg)) {
                continue;
            }

            ex.bot.send(msg.message, {name: player.getName()});
        }
    }
    world.onLeave.sub(handleLeave);

    return function uninstall() {
        world.onLeave.unsub(handleLeave);
        world.storage.clearNamespace(STORAGE_ID);
    };
}


/** @hidden */
type TriggerMessageConfig = MessageConfig & {
    trigger: string
};

/** @hidden */
function triggerModule(ex: MessageBotExtension, world: World) {
    let STORAGE_ID = 'triggerArr';
    let storage = world.storage;

    function triggerMatch(message: string, trigger: string) {
        if (ex.settings.get('regexTriggers', false)) {
            try {
                return new RegExp(trigger, 'i').test(message);
            } catch (e) {
                return false;
            }
        }
        // Escape any regex in the trigger, but allow * as a wildcard.
        trigger = trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*");
        return new RegExp(trigger, 'i').test(message);
    }

    function handleTriggers({player, message}: {player: Player, message: string}) {
        let messages = storage.getObject(STORAGE_ID, [] as TriggerMessageConfig[]);

        if (player.getName() == 'SERVER') {
            return;
        }

        let responses = 0;
        for (let msg of messages) {
            if (!checkJoins(player, msg) || !checkGroups(player, msg)) {
                continue;
            }

            if (triggerMatch(message, msg.trigger) && responses++ < ex.settings.get('maxResponses', 3)) {
                ex.bot.send(msg.message, {name: player.getName()});
            }
        }
    }
    world.onMessage.sub(handleTriggers);

    return function uninstall() {
        world.onMessage.unsub(handleTriggers);
        world.storage.clearNamespace(STORAGE_ID);
    };
}


/** @hidden */
type AnnouncementMessageConfig = {message: string};

/** @hidden */
function announcementModule(ex: MessageBotExtension, world: World) {
    let STORAGE_ID = 'announcementArr';
    let index = 0;
    let interval = setTimeout(nextAnn, ex.settings.get('announcementDelay', 10) * 60 * 1000);

    function nextAnn() {
        let announcements = world.storage.getObject(STORAGE_ID, [] as AnnouncementMessageConfig[]);
        if (index >= announcements.length) {
            index = 0;
        }

        if (announcements[index]) {
            ex.bot.send(announcements[index++].message);
        }
        interval = setTimeout(nextAnn, ex.settings.get('announcementDelay', 10) * 60 * 1000);
    }

    return function uninstall() {
        clearTimeout(interval);
        world.storage.clearNamespace(STORAGE_ID);
    };
}
