import {PortalChatWatcher} from './libraries/portal/chatwatcher';
import {PortalApi} from './libraries/portal/api';
import {World} from './libraries/blockheads/world';
import {Storage} from './libraries/storage';

import {MessageBot} from './bot';
(global as any).MessageBot = MessageBot;
import {SimpleEvent} from './libraries/simpleevent';
(global as any).SimpleEvent = SimpleEvent;

declare var worldId: number;

import './extensions/ui';
import './extensions/console/browser';
import './extensions/messages';
import './extensions/messages-ui';
import './extensions/settings-ui';
import './extensions/extensions-ui';

let world = new World({
    api: new PortalApi(worldId),
    chatWatcher: new PortalChatWatcher({
        worldId,
        firstId: (<any>window).firstId - 50 || 0,
    }),
    storage: new Storage(worldId)
});

new MessageBot(world);
