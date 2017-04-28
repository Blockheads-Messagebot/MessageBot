"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bot_1 = require("../../bot");
bot_1.MessageBot.registerExtension('settings', function (ex) {
    var describe = ex.export('describe', function (settings, descriptions) {
        if (ex.isNode) {
            return; // No way to change settings without a browser.
        }
        descriptions.forEach(function (item) {
            var value = settings.get(item.key, item.default);
            switch (typeof value) {
                case 'string':
                    break;
                case 'number':
                    break;
                case 'boolean':
            }
        });
    });
    describe(ex.bot.settings, []);
});
