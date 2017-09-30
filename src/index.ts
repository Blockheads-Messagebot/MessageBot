import { MessageBotExtension, ExtensionInitializer } from './extension'
import { World } from './world'
import { Player } from './player'
import { Storage } from './storage'

import { WorldApi, WorldInfo } from 'blockheads-api/api'
import { createSimpleEventDispatcher, ISimpleEvent } from 'strongly-typed-events'

export { MessageBotExtension, World, Player, Storage, WorldApi }

let registeredExtensions = new Map<string, ExtensionInitializer>()
let extensionRegistered = createSimpleEventDispatcher<string>()
let extensionDeregistered = createSimpleEventDispatcher<string>()

export class MessageBot {
    /**
     * External dependencies that must be set before creating any instances of this class.
     */
    static dependencies: {
        Api: new (info: WorldInfo) => WorldApi,
        getWorlds: () => Promise<WorldInfo[]>
    }

    /**
     * An event that fires whenever an extension is registered or re-registered.
     */
    static extensionRegistered: ISimpleEvent<string> = extensionRegistered.asEvent()

    /**
     * An event that fires when an extension is deregistered, if it has been registered. Will not fire when an extension is re-registered.
     */
    static extensionDeregistered: ISimpleEvent<string> = extensionDeregistered.asEvent()

    /**
     * Registers an extension that can be loaded by instances of the bot.
     * Note: If an extension has already been loaded from a previously registered initializer, it will not be overwritten.
     * @param id the extension ID, will be normalized to lower case.
     * @param initializer the function to be called to set up the extension.
     */
    static registerExtension(id: string, initializer: ExtensionInitializer) {
        id = id.toLocaleLowerCase()
        registeredExtensions.set(id, initializer)
        extensionRegistered.dispatch(id)
    }

    /**
     * Removes an extension initializer from the registry, can be used to prevent an extension from being loaded in multiple bots at once (generally a bad idea).
     * @param id the id of the extension to deregister
     */
    static deregisterExtension(id: string) {
        id = id.toLocaleLowerCase()
        if (registeredExtensions.delete(id)) {
            extensionDeregistered.dispatch(id)
        }
    }

    static get extensions() {
        return [...registeredExtensions.keys()]
    }

    /**
     * The world that the bot is loaded on.
     */
    world: World

    /**
     * All loaded extension instances for this bot.
     */
    private _extensions = new Map<string, MessageBotExtension>()

    /**
     *
     * @param storage The storage instance to be used by the bot.
     * @param info The world info that is used to create the API to interact with the world.
     */
    constructor(public storage: Storage, info: WorldInfo) {
        if (!MessageBot.dependencies) throw new Error('Dependencies must be set before creating this class.')

        this.world = new World(new MessageBot.dependencies.Api(info), storage)
    }

    /**
     * Gets the exports of an extension, returns undefined if the extension is not loaded.
     * @param id the extension id to get exports from
     */
    getExports = (id: string): {[key: string]: any} | undefined => {
        let ex = this._extensions.get(id.toLocaleLowerCase())
        if (ex) return ex.exports
    }

    /**
     * Adds an extension to this bot. Calls the init function supplied when registering the extension.
     * @param id the id of the registered extension to add.
     */
    addExtension = (id: string) => {
        id = id.toLocaleLowerCase()
        if (this._extensions.has(id)) throw new Error(`The ${id} extension has already been added.`)

        let creator = registeredExtensions.get(id)
        if (!creator) throw new Error(`The ${id} extension has not been registered.`)

        let ex = new MessageBotExtension(id, this)
        this._extensions.set(id, ex)
        creator.call(ex, ex, this.world)
    }

    /**
     * Removes a currently loaded extension. Should not be used by published extensions unless
     * the extension is an extension manager.
     * @param id the id of the extension to remove
     * @param uninstall whether or not the extension should be completely removed, or just unloaded.
     */
    removeExtension = (id: string, uninstall: boolean) => {
        id = id.toLocaleLowerCase()
        let ex = this._extensions.get(id)
        if (!ex) throw new Error(`The ${id} extension is not registered.`)

        try {
            if (uninstall) {
                ex.uninstall()
            } else {
                ex.remove()
            }
        } finally {
            this._extensions.delete(id)
        }
    }
}