// Polyfill localStorage
const {LocalStorage} = require('node-localstorage');
(<any>global).localStorage = new LocalStorage('./localStorage');

import {PortalChatWatcher} from './libraries/portal/chatwatcher';
import {PortalApi} from './libraries/portal/api';
import {PortalAuth} from './libraries/portal/auth';
import {World} from './libraries/blockheads/world';
import {Storage} from './libraries/storage';
import {config} from './bot/config';

let auth = new PortalAuth(config.username, config.password);

(async function main() {
    try {
        await auth.login();
    } catch(err) {
        console.log("Unable to log in. Bad username / password?");

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

    world.onMessage.sub(({player, message}) => {
        console.log(player.getName(), message);
    });

    world.onJoin.sub(player => {
        console.log(player.getName(), 'joined');
    });

    world.onLeave.sub(player => {
        console.log(player.getName(), 'left');
    });
}());


