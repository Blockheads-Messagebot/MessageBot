"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var chatwatcher_1 = require("./libraries/portal/chatwatcher");
var api_1 = require("./libraries/portal/api");
var world_1 = require("./libraries/blockheads/world");
exports.World = world_1.World;
var storage_1 = require("./libraries/storage");
exports.Storage = storage_1.Storage;
var bot_1 = require("./bot");
exports.MessageBot = bot_1.MessageBot;
exports.MessageBotExtension = bot_1.MessageBotExtension;
var simpleevent_1 = require("./libraries/simpleevent");
exports.SimpleEvent = simpleevent_1.SimpleEvent;
// Global exports
[
    ['global', global],
    ['World', world_1.World],
    ['Storage', storage_1.Storage],
    ['MessageBot', bot_1.MessageBot],
    ['SimpleEvent', simpleevent_1.SimpleEvent],
].forEach(function (_a) {
    var _b = __read(_a, 2), key = _b[0], item = _b[1];
    return global[key] = item;
});
// For typings
var ajax_1 = require("./libraries/ajax");
exports.Ajax = ajax_1.Ajax;
var player_1 = require("./libraries/blockheads/player");
exports.Player = player_1.Player;
var bot_2 = require("./bot");
exports.Settings = bot_2.Settings;
require("./extensions/ui");
require("./extensions/console/browser");
require("./extensions/messages");
require("./extensions/messages-ui");
require("./extensions/settings-ui");
require("./extensions/extensions-ui");
var world = new world_1.World({
    api: new api_1.PortalApi(worldId),
    chatWatcher: new chatwatcher_1.PortalChatWatcher({
        worldId: worldId,
        firstId: window.firstId - 50 || 0,
    }),
    storage: new storage_1.Storage(worldId)
});
new bot_1.MessageBot(world);
