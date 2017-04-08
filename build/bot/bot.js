"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const extension_1 = require("./extension");
const settings_1 = require("./settings");
/**
 * The MessageBot class, this is used to send messages and register extensions.
 */
class MessageBot {
    /**
     * Creates a new instance of the class.
     *
     * @param world the world to use for sending messages.
     */
    constructor(world) {
        this.world = world;
        this.settings = new settings_1.Settings(world.storage);
        this.botSettings = this.settings.prefix('mb_');
        this.extensions = new Map();
    }
    /**
     * Adds an extension to the bot, this is the entry point for all extensions.
     *
     * @param id the unique name/extension ID for this extension.
     * @param creator the function to call in order to initialize the extension.
     */
    registerExtension(id, creator) {
        if (this.extensions.has(id)) {
            console.log(`Extension ${id} was already registered. Abort.`);
            return;
        }
        let ex = new extension_1.MessageBotExtension(this);
        ex.settings = this.settings.prefix(id);
        this.extensions.set(id, ex);
        creator.call(ex, ex, this.world);
    }
    /**
     * Removes an extension and calls it's uninstall function.
     *
     * @param id the extension to remove.
     */
    deregisterExtension(id) {
        let ex = this.extensions.get(id);
        if (!ex) {
            return;
        }
        try {
            ex.uninstall();
        }
        catch (err) {
            console.log("Uninstall error:", err);
        }
        this.extensions.delete(id);
    }
    /**
     * Gets an extension's exports, if it has been registered. Otherwise returns undefined.
     *
     * @param extensionId the id of the extension to get the exports for.
     */
    getExports(extensionId) {
        let ex = this.extensions.get(extensionId);
        if (ex) {
            return ex.exports;
        }
    }
    /**
     * Sends a message to the world for this bot, should usually be used in place of world.send.
     *
     * @param message the message to send
     * @param params any variables to inject into the message.
     */
    send(message, params = {}) {
        let messages;
        // Split the message if splitting is enabled.
        if (this.botSettings.get('splitMessages', false)) {
            messages = message.split(this.botSettings.get('splitToken', '<split>'));
        }
        else {
            messages = [message];
        }
        // Common enough to be done here, set the name of the player up right.
        if (params['name'] && params['name'].length) {
            let player = params['name'];
            params['name'] = player.toLocaleLowerCase();
            params['Name'] = player[0].toLocaleUpperCase() + player.substr(1).toLocaleLowerCase();
            params['NAME'] = player.toLocaleUpperCase();
        }
        // Loop through messages, replacing varibles, then send the message
        messages.forEach(msg => {
            Object.keys(params).forEach(key => {
                // Escape RegExp special characters in key
                let safeKey = key.replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1');
                msg = msg.replace(new RegExp(`{{${safeKey}}}`, 'g'), params[key]);
            });
            this.world.send(msg);
        });
    }
}
exports.MessageBot = MessageBot;
