// Polyfill localStorage
const {LocalStorage} = require('node-localstorage');
(<any>global).localStorage = new LocalStorage('./localStorage');

// Import config.
const config = require('../config/bot') as {path: string, worldId: number | string};
config.path = config.path || '';
if (config.worldId == undefined) {
    console.log("No world ID specified in config/bot.js");
}

import {MacChatWatcher} from './libraries/mac/chatwatcher';
import {MacApi} from './libraries/mac/api';
import {World} from './libraries/blockheads/world';
import {Storage} from './libraries/storage';

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

    require('./extensions/console');
}());


