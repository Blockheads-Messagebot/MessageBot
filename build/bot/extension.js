"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ajax_1 = require("../libraries/ajax");
/**
 * Extension class, created by the bot with bot.registerExtension. Should not be created directly.
 */
var MessageBotExtension = (function () {
    /**
     * Creates a new instance of the class.
     *
     * @param bot the bot to attach this extension to.
     */
    function MessageBotExtension(bot) {
        /**
         * Used to check if the bot is loaded in a browser or in a node environment.
         */
        this.isNode = !!global.process;
        this.world = bot.world;
        this.bot = bot;
        this.ajax = ajax_1.Ajax;
        this.exports = {};
    }
    /**
     * Removes the extension. All listeners should be removed here.
     */
    MessageBotExtension.prototype.uninstall = function () { };
    /**
     * Convenience method to export a property for other extensions to use.
     *
     * @param key the export name
     * @param prop the property to export
     */
    MessageBotExtension.prototype.export = function (key, prop) {
        return this.exports[key] = prop;
    };
    return MessageBotExtension;
}());
exports.MessageBotExtension = MessageBotExtension;
