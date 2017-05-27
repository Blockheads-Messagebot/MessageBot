"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chatwatcher_1 = require("./libraries/portal/chatwatcher");
var api_1 = require("./libraries/portal/api");
var world_1 = require("./libraries/blockheads/world");
var storage_1 = require("./libraries/storage");
var bot_1 = require("./bot");
exports.MessageBot = bot_1.MessageBot;
global.MessageBot = bot_1.MessageBot;
var simpleevent_1 = require("./libraries/simpleevent");
exports.SimpleEvent = simpleevent_1.SimpleEvent;
global.SimpleEvent = simpleevent_1.SimpleEvent;
// Alias global to window for browser extensions
global.global = global;
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
