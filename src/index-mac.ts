// Polyfill localStorage
const {LocalStorage} = require('node-localstorage');
(<any>global).localStorage = new LocalStorage('./localStorage');

import {MacChatWatcher} from './libraries/mac/chatwatcher';
import {MacApi} from './libraries/mac/api';
import {World} from './libraries/blockheads/world';
import {Storage} from './libraries/storage';
import {config} from './bot/config';

(async function main() {
    let world: World;
    try {
        world = new World({
            api: new MacApi(config.path),
            chatWatcher: new MacChatWatcher(config.path),
            storage: new Storage(config.worldId)
        });
    } catch (e) {
        console.error(e);
        return;
    }

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


