"use strict";
// Note: The messages extension handles responding to messages. The messages-ui extension handles editing messages in a browser.
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bot_1 = require("../../bot/bot");
var helpers_1 = require("./helpers");
bot_1.MessageBot.registerExtension('messages', function (ex, world) {
    var uninstallFns = [];
    // Delay loading to prevent spam
    setTimeout(function () {
        uninstallFns = [
            joinModule(ex, world),
            leaveModule(ex, world),
            triggerModule(ex, world),
            announcementModule(ex, world),
        ];
    }, 2500);
    ex.uninstall = function () {
        uninstallFns.forEach(function (fn) { return fn(); });
        ex.settings.removeAll();
    };
});
function joinModule(ex, world) {
    var STORAGE_ID = 'joinArr';
    var storage = world.storage;
    function handleJoin(player) {
        var messages = storage.getObject(STORAGE_ID, []);
        try {
            for (var messages_1 = __values(messages), messages_1_1 = messages_1.next(); !messages_1_1.done; messages_1_1 = messages_1.next()) {
                var msg = messages_1_1.value;
                if (!helpers_1.checkJoins(player, msg) || !helpers_1.checkGroups(player, msg)) {
                    continue;
                }
                ex.bot.send(msg.message, { name: player.getName() });
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (messages_1_1 && !messages_1_1.done && (_a = messages_1.return)) _a.call(messages_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var e_1, _a;
    }
    world.onJoin.sub(handleJoin);
    return function uninstall() {
        world.onJoin.unsub(handleJoin);
        world.storage.clearNamespace(STORAGE_ID);
    };
}
function leaveModule(ex, world) {
    var STORAGE_ID = 'leaveArr';
    var storage = world.storage;
    function handleLeave(player) {
        var messages = storage.getObject(STORAGE_ID, []);
        try {
            for (var messages_2 = __values(messages), messages_2_1 = messages_2.next(); !messages_2_1.done; messages_2_1 = messages_2.next()) {
                var msg = messages_2_1.value;
                if (!helpers_1.checkJoins(player, msg) || !helpers_1.checkGroups(player, msg)) {
                    continue;
                }
                ex.bot.send(msg.message, { name: player.getName() });
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (messages_2_1 && !messages_2_1.done && (_a = messages_2.return)) _a.call(messages_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var e_2, _a;
    }
    world.onLeave.sub(handleLeave);
    return function uninstall() {
        world.onLeave.unsub(handleLeave);
        world.storage.clearNamespace(STORAGE_ID);
    };
}
function triggerModule(ex, world) {
    var STORAGE_ID = 'triggerArr';
    var storage = world.storage;
    function triggerMatch(message, trigger) {
        if (!ex.settings.get('disableWhitespaceTrimming', false)) {
            trigger = trigger.trim();
        }
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
    function handleTriggers(_a) {
        var player = _a.player, message = _a.message;
        var messages = storage.getObject(STORAGE_ID, []);
        if (player.getName() == 'SERVER') {
            return;
        }
        var responses = 0;
        try {
            for (var messages_3 = __values(messages), messages_3_1 = messages_3.next(); !messages_3_1.done; messages_3_1 = messages_3.next()) {
                var msg = messages_3_1.value;
                if (!helpers_1.checkJoins(player, msg) || !helpers_1.checkGroups(player, msg)) {
                    continue;
                }
                if (triggerMatch(message, msg.trigger) && responses++ < ex.settings.get('maxResponses', 3)) {
                    ex.bot.send(msg.message, { name: player.getName() });
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (messages_3_1 && !messages_3_1.done && (_b = messages_3.return)) _b.call(messages_3);
            }
            finally { if (e_3) throw e_3.error; }
        }
        var e_3, _b;
    }
    world.onMessage.sub(handleTriggers);
    return function uninstall() {
        world.onMessage.unsub(handleTriggers);
        world.storage.clearNamespace(STORAGE_ID);
    };
}
function announcementModule(ex, world) {
    var STORAGE_ID = 'announcementArr';
    var index = 0;
    var interval = setTimeout(nextAnn, ex.settings.get('announcementDelay', 10) * 60 * 1000);
    function nextAnn() {
        var announcements = world.storage.getObject(STORAGE_ID, []);
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
