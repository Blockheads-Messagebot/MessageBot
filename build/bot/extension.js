"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ajax_1 = require("../libraries/ajax");
/**
 * Extension class, created by the bot with bot.registerExtension. Should not be created directly.
 */
class MessageBotExtension {
    /**
     * Creates a new instance of the class.
     *
     * @param bot the bot to attach this extension to.
     */
    constructor(bot) {
        this.world = bot.world;
        this.bot = bot;
        this.ajax = ajax_1.Ajax;
        this.exports = {};
    }
    /**
     * Removes the extension. All listeners should be removed here.
     */
    uninstall() { }
    /**
     * Convenience method to export a property for other extensions to use.
     *
     * @param key the export name
     * @param prop the property to export
     */
    export(key, prop) {
        return this.exports[key] = prop;
    }
}
exports.MessageBotExtension = MessageBotExtension;
