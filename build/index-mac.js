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
const chatwatcher_1 = require("./libraries/mac/chatwatcher");
const api_1 = require("./libraries/mac/api");
const world_1 = require("./libraries/blockheads/world");
const storage_1 = require("./libraries/storage");
const config_1 = require("./bot/config");
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let world;
        try {
            world = new world_1.World({
                api: new api_1.MacApi(config_1.config.path),
                chatWatcher: new chatwatcher_1.MacChatWatcher(config_1.config.path),
                storage: new storage_1.Storage(config_1.config.worldId)
            });
        }
        catch (e) {
            console.error(e);
            return;
        }
        world.onMessage.sub(({ player, message }) => {
            console.log(player.getName(), message);
        });
        world.onJoin.sub(player => {
            console.log(player.getName(), 'joined');
        });
        world.onLeave.sub(player => {
            console.log(player.getName(), 'left');
        });
    });
}());