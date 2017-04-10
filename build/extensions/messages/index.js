"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("../../bot/bot");
const helpers_1 = require("./helpers");
bot_1.MessageBot.registerExtension('messages', function (ex, world) {
    let uninstallFns = [
        joinModule(ex, world),
        leaveModule(ex, world),
        triggerModule(ex, world),
        announcementModule(ex, world),
    ];
    ex.uninstall = function () {
        uninstallFns.forEach(fn => fn());
        ex.settings.removeAll();
    };
});
/** @hidden */
function joinModule(ex, world) {
    let STORAGE_ID = 'joinArr';
    let storage = world.storage;
    function handleJoin(player) {
        let messages = storage.getObject(STORAGE_ID, []);
        for (let msg of messages) {
            if (!helpers_1.checkJoins(player, msg) || !helpers_1.checkGroups(player, msg)) {
                continue;
            }
            ex.bot.send(msg.message, { name: player.getName() });
        }
    }
    world.onJoin.sub(handleJoin);
    return function uninstall() {
        world.onJoin.unsub(handleJoin);
        world.storage.clearNamespace(STORAGE_ID);
    };
}
/** @hidden */
function leaveModule(ex, world) {
    let STORAGE_ID = 'leaveArr';
    let storage = world.storage;
    function handleLeave(player) {
        let messages = storage.getObject(STORAGE_ID, []);
        for (let msg of messages) {
            if (!helpers_1.checkJoins(player, msg) || !helpers_1.checkGroups(player, msg)) {
                continue;
            }
            ex.bot.send(msg.message, { name: player.getName() });
        }
    }
    world.onLeave.sub(handleLeave);
    return function uninstall() {
        world.onLeave.unsub(handleLeave);
        world.storage.clearNamespace(STORAGE_ID);
    };
}
/** @hidden */
function triggerModule(ex, world) {
    let STORAGE_ID = 'triggerArr';
    let storage = world.storage;
    function triggerMatch(message, trigger) {
        if (ex.settings.get('regexTriggers', false)) {
            try {
                return new RegExp(trigger, 'i').test(message);
            }
            catch (e) {
                return false;
            }
        }
        // Escape any regex in the trigger, but allow * as a wildcard.
        trigger = trigger.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").replace(/\*/g, ".*");
        return new RegExp(trigger, 'i').test(message);
    }
    function handleTriggers({ player, message }) {
        let messages = storage.getObject(STORAGE_ID, []);
        if (player.getName() == 'SERVER') {
            return;
        }
        let responses = 0;
        for (let msg of messages) {
            if (!helpers_1.checkJoins(player, msg) || !helpers_1.checkGroups(player, msg)) {
                continue;
            }
            if (triggerMatch(message, msg.trigger) && responses++ < ex.settings.get('maxResponses', 3)) {
                ex.bot.send(msg.message, { name: player.getName() });
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
function announcementModule(ex, world) {
    let STORAGE_ID = 'announcementArr';
    let index = 0;
    let interval = setTimeout(nextAnn, ex.settings.get('announcementDelay', 10) * 60 * 1000);
    function nextAnn() {
        let announcements = world.storage.getObject(STORAGE_ID, []);
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
