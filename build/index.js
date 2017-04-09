"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatwatcher_1 = require("./libraries/portal/chatwatcher");
const api_1 = require("./libraries/portal/api");
const world_1 = require("./libraries/blockheads/world");
const storage_1 = require("./libraries/storage");
const bot_1 = require("./bot/bot");
global.MessageBot = bot_1.MessageBot;
let world = new world_1.World({
    api: new api_1.PortalApi(worldId),
    chatWatcher: new chatwatcher_1.PortalChatWatcher({
        worldId,
        firstId: window.firstId - 50 || 0,
    }),
    storage: new storage_1.Storage(worldId)
});
new bot_1.MessageBot(world);
world.onMessage.sub(({ player, message }) => {
    console.log(player.getName(), message);
});
world.onJoin.sub(player => {
    console.log(player.getName(), 'joined');
});
world.onLeave.sub(player => {
    console.log(player.getName(), 'left');
});
