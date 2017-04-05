"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatwatcher_1 = require("./libraries/portal/chatwatcher");
const api_1 = require("./libraries/portal/api");
const world_1 = require("./libraries/blockheads/world");
const storage_1 = require("./libraries/storage");
let world = new world_1.World({
    api: new api_1.PortalApi(worldId),
    chatWatcher: new chatwatcher_1.PortalChatWatcher({
        worldId,
        firstId: window.firstId - 50 || 0,
    }),
    storage: new storage_1.Storage(worldId)
});
world.onMessage.sub(({ player, message }) => {
    console.log(player.getName(), message);
});
world.onJoin.sub(player => {
    console.log(player.getName(), 'joined');
});
world.onLeave.sub(player => {
    console.log(player.getName(), 'left');
});
