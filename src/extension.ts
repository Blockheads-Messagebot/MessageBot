import { World } from './world'
import { MessageBot } from './index'
import { Storage } from './storage'

/**
 * Function used to create an extension, will be called for each bot that the extension is attached to.
 */
export type ExtensionInitializer = (this: MessageBotExtension, ex: MessageBotExtension, world: World) => void

export class MessageBotExtension {
    /**
     * The prefixed storage reserved for this extension.
     */
    storage: Storage

    /**
     * A shortcut for this.bot.world
     */
    world: World

    /**
     * Any exports that other extensions may call.
     */
    exports: {[key: string]: any} = {}

    /**
     * Creates a new extension.
     * @param id the extension id
     * @param bot the bot that this extension is loaded from
     */
    constructor(id: string, public bot: MessageBot) {
        this.storage = bot.storage.prefix(id)
        this.world = bot.world
    }

    /**
     * Removes the extension, listeners and ui should be removed here. Stored settings should not be removed.
     */
    remove() {}

    /**
     * Removes the extension. All listeners should be removed here.
     */
    uninstall() {
        this.remove()
        this.storage.clear()
    }

}
