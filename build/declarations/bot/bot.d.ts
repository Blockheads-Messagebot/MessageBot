import { ExtensionInitializer } from './extension';
import { Settings } from './settings';
import { World } from '../libraries/blockheads/world';
/**
 * The MessageBot class, this is used to send messages and register extensions.
 */
export declare class MessageBot {
    /**
     * The world that this bot is for.
     */
    world: World;
    /**
     * The settings used by this bot, based off the world used when creating this instance of the class.
     * Extension settings should be stored using ex.settings not ex.bot.settings.
     */
    settings: Settings;
    private extensions;
    /**
     * Creates a new instance of the class.
     *
     * @param world the world to use for sending messages.
     */
    constructor(world: World);
    /**
     * Adds an extension to the bot, this is the entry point for all extensions.
     *
     * @param id the unique name/extension ID for this extension.
     * @param creator the function to call in order to initialize the extension.
     */
    static registerExtension(id: string, creator: ExtensionInitializer): void;
    /**
     * Removes an extension and calls it's uninstall function.
     *
     * @param id the extension to remove.
     */
    static deregisterExtension(id: string): void;
    /**
     * Loads an extension into this bot.
     *
     * @param id the extension to load
     */
    private registerExtension(id);
    /**
     * Removes an extension from this bot
     *
     * @param id the extension to remove.
     */
    private deregisterExtension(id);
    /**
     * Gets an extension's exports, if it has been registered. Otherwise returns undefined.
     *
     * @param extensionId the id of the extension to get the exports for.
     */
    getExports(extensionId: string): {
        [key: string]: any;
    } | undefined;
    /**
     * Sends a message to the world for this bot, should usually be used in place of world.send.
     *
     * @param message the message to send
     * @param params any variables to inject into the message. If `name` is provided, it will be available through {{NAME}}, {{Name}} and {{name}}
     */
    send(message: string, params?: {
        [key: string]: string;
    }): void;
}
