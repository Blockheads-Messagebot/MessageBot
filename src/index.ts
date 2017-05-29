import {PortalChatWatcher} from './libraries/portal/chatwatcher';
import {PortalApi} from './libraries/portal/api';

import {World} from './libraries/blockheads/world';
import {Storage} from './libraries/storage';
import {MessageBot, MessageBotExtension} from './bot';
import {SimpleEvent} from './libraries/simpleevent';

// Global exports
[
    ['global', global],
    ['World', World],
    ['Storage', Storage],
    ['MessageBot', MessageBot],
    ['SimpleEvent', SimpleEvent],
].forEach(([key, item]: [string, any]) => (global as any)[key] = item);

// For typings
export {Ajax} from './libraries/ajax';
export {MessageBot, MessageBotExtension};
export {Player} from './libraries/blockheads/player';
export {Settings} from './bot';
export {SimpleEvent};
export {TabManager} from './extensions/ui/tabs';
export {Storage};
export {World};

export {UIExtensionExports} from './extensions/ui';
export {ConsoleExtensionExports} from './extensions/console';

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
