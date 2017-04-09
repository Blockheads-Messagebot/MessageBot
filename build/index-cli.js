"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Polyfill localStorage
const { LocalStorage } = require('node-localstorage');
global.localStorage = new LocalStorage('./localStorage');
// Import config, making it as hard as possible to fail with a bad error.
const config = require('../config/bot');
config.username = config.username || '';
config.password = config.password || '';
config.worldId = config.worldId || 0;
const chatwatcher_1 = require("./libraries/portal/chatwatcher");
const api_1 = require("./libraries/portal/api");
const auth_1 = require("./libraries/portal/auth");
const world_1 = require("./libraries/blockheads/world");
const storage_1 = require("./libraries/storage");
const bot_1 = require("./bot/bot");
global.MessageBot = bot_1.MessageBot;
require("./extensions/console");
let auth = new auth_1.PortalAuth(config.username, config.password);
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield auth.login();
        }
        catch (err) {
            console.log("Unable to log in. Bad or missing username / password?");
            console.log('Details: ', err);
            return;
        }
        console.log("Logged in!");
        let world = new world_1.World({
            api: new api_1.PortalApi(config.worldId),
            chatWatcher: new chatwatcher_1.PortalChatWatcher({
                worldId: config.worldId,
                firstId: 0,
            }),
            storage: new storage_1.Storage(config.worldId)
        });
        new bot_1.MessageBot(world);
    });
}());
