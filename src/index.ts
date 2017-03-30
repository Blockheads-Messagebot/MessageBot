import {PortalChatWatcher} from './libraries/portal/chatwatcher';
import {PortalApi} from './libraries/portal/api';
import {World} from './libraries/blockheads/world';
import {Storage} from './libraries/storage';

declare var worldId: number;

let world = new World({
    api: new PortalApi(worldId),
    chatWatcher: new PortalChatWatcher({
        worldId,
        firstId: (<any>window).firstId - 50 || 0,
    }),
    storage: new Storage(worldId)
});

world.onMessage.sub(({player, message}) => {
    console.log(player.getName(), message);
});

world.onJoin.sub(player => {
    console.log(player.getName(), 'joined');
});

world.onLeave.sub(player => {
    console.log(player.getName(), 'left');
});
