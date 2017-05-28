import {World} from '../libraries/blockheads/world';
import {Ajax} from '../libraries/ajax';
import {MessageBot} from './bot';
import {Settings} from './settings';

/**
 * The function passed to the bot's registerExtension method.
 */
export type ExtensionInitializer = (this:MessageBotExtension, ex: MessageBotExtension, world: World) => void;

/**
 * Extension class, created by the bot with bot.registerExtension. Should not be created directly.
 */
export class MessageBotExtension {
    /**
     * The world that this extension is watching.
     */
    public world: World;

    /**
     * The bot which can be used to send messages.
     */
    public bot: MessageBot;

    /**
     * Any exports which are available to other extensions.
     */
    public exports: {[key: string]: any};

    /**
     * A convenience class to store extension settings
     */
    public settings: Settings;

    /**
     * Utility class which can be used to send http requests with a promise based API.
     */
    public ajax: typeof Ajax;

    /**
     * Used to check if the bot is loaded in a browser or in a node environment.
     */
    public isNode: boolean = !!global.process;

    /**
     * Creates a new instance of the class.
     *
     * @param bot the bot to attach this extension to.
     */
    constructor(bot: MessageBot) {
        this.world = bot.world;
        this.bot = bot;
        this.ajax = Ajax;
        this.exports = {};
    }

    /**
     * Removes the extension. All listeners should be removed here.
     */
    uninstall() {}

    /**
     * Convenience method to export a property for other extensions to use.
     *
     * @param key the export name
     * @param prop the property to export
     */
    export = <T>(key: string, prop: T): T => {
        return this.exports[key] = prop;
    }
}
