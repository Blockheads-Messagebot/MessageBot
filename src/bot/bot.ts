import {MessageBotExtension, ExtensionInitializer} from './extension';
import {Settings} from './settings';
import {World} from '../libraries/blockheads/world';

/**
 * The MessageBot class, this is used to send messages and register extensions.
 */
export class MessageBot {
    /**
     * The world that this bot is for.
     */
    public world: World;

    /**
     * The settings used by this bot, based off the world used when creating this instance of the class.
     * Extension settings should be stored using ex.settings not ex.bot.settings.
     */
    public settings: Settings;

    /** @hidden */
    private botSettings: Settings;
    /** @hidden */
    private extensions: Map<string, MessageBotExtension>;

    /**
     * Creates a new instance of the class.
     *
     * @param world the world to use for sending messages.
     */
    constructor(world: World) {
        this.world = world;
        this.settings = new Settings(world.storage);
        this.botSettings = this.settings.prefix('mb_');

        this.extensions = new Map();
    }

    /**
     * Adds an extension to the bot, this is the entry point for all extensions.
     *
     * @param id the unique name/extension ID for this extension.
     * @param creator the function to call in order to initialize the extension.
     */
    registerExtension(
        id: string,
        creator: ExtensionInitializer,
    ) {
        if (this.extensions.has(id)) {
            console.log(`Extension ${id} was already registered. Abort.`);
            return;
        }

        let ex = new MessageBotExtension(this);
        ex.settings = this.settings.prefix(id);
        this.extensions.set(id, ex);
        creator.call(ex, ex, this.world);
    }

    /**
     * Removes an extension and calls it's uninstall function.
     *
     * @param id the extension to remove.
     */
    deregisterExtension(id: string) {
        let ex = this.extensions.get(id);
        if (!ex) {
            return;
        }

        try {
            ex.uninstall();
        } catch (err) {
            console.log("Uninstall error:", err);
        }

        this.extensions.delete(id);
    }

    /**
     * Gets an extension's exports, if it has been registered. Otherwise returns undefined.
     *
     * @param extensionId the id of the extension to get the exports for.
     */
    getExports(extensionId: string): {[key: string]: any} | undefined {
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
    send(message: string, params: {[key: string]: string} = {}) {
        let messages: string[];
        // Split the message if splitting is enabled.
        if (this.botSettings.get('splitMessages', false)) {
            messages = message.split(this.botSettings.get('splitToken', '<split>'));
        } else {
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
                msg = msg.replace(
                    new RegExp(`{{${safeKey}}}`, 'g'),
                    params[key]
                );
            });

            this.world.send(msg);
        });
    }
}
