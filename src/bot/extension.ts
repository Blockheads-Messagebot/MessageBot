import {World} from '../libraries/blockheads/world';
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
     * Any exports which are availible to other extensions.
     */
    public exports: {[key: string]: any};

    /**
     * A convenience class to store extension settings
     */
    public settings: Settings;

    /**
     * Creates a new instance of the class.
     *
     * @param bot the bot to attach this extension to.
     */
    constructor(bot: MessageBot) {
        this.world = bot.world;
        this.bot = bot;
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
    export<T>(key: string, prop: T): T {
        return this.exports[key] = prop;
    }
}
