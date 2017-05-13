// Polyfill localStorage
const {LocalStorage} = require('node-localstorage');
(global as any).localStorage = new LocalStorage('./localStorage');

// Import config, making it as hard as possible to fail with a bad error.
const config = require('../config/bot') as {username: string, password: string, worldId: number};
config.username = config.username || '';
config.password = config.password || '';
config.worldId = config.worldId || 0;


import {PortalChatWatcher} from './libraries/portal/chatwatcher';
import {PortalApi} from './libraries/portal/api';
import {PortalAuth} from './libraries/portal/auth';
import {World} from './libraries/blockheads/world';
import {Storage} from './libraries/storage';
import {MessageBot} from './bot/bot';
(global as any).MessageBot = MessageBot;

import './extensions/console';
import './extensions/messages';

let auth = new PortalAuth(config.username, config.password);

(async function main() {
    try {
        await auth.login();
    } catch(err) {
        console.log("Unable to log in. Bad or missing username / password?");
        console.log('Details: ', err);

        return;
    }

    console.log("Logged in!");


    let world = new World({
        api: new PortalApi(config.worldId),
        chatWatcher: new PortalChatWatcher({
            worldId: config.worldId,
            firstId: 0,
        }),
        storage: new Storage(config.worldId)
    });

    new MessageBot(world);
}());


