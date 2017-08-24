import { MessageBotExtension, ExtensionInitializer } from './extension'
import { World } from './world'
import { Player } from './player'
import { IStorage } from './storage'

import { WorldApi, WorldInfo } from 'blockheads-api/api'
import { createSimpleEventDispatcher, ISimpleEvent } from 'strongly-typed-events'

export { MessageBotExtension, World, Player, IStorage, WorldApi }

let extensions = new Map<string, ExtensionInitializer>()
let extensionRegistered = createSimpleEventDispatcher<string>()

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
     * Registers an extension that can be loaded by instances of the bot.
     * @param id the extension ID, will be normalized to lower case.
     * @param initializer the function to be called to set up the extension.
     */
    static registerExtension(id: string, initializer: ExtensionInitializer) {
        id = id.toLocaleLowerCase()
        if (extensions.has(id)) console.warn(`Overwriting registered extension ${id}. This will not overwrite instances.`)
        extensions.set(id, initializer)
        extensionRegistered.dispatch(id)
    }

    /**
     * The world that the bot is loaded on.
     */
    world: World

    /**
     * All loaded extension instances for this bot.
     */
    private extensions = new Map<string, MessageBotExtension>()

    /**
     *
     * @param storage The storage instance to be used by the bot.
     * @param info The world info that is used to create the API to interact with the world.
     */
    constructor(public storage: IStorage, info: WorldInfo) {
        let dependencyError = 'Dependencies must be set before creating this class.'
        if (!MessageBot.dependencies) throw new Error(dependencyError)
        if (!MessageBot.dependencies.Api) throw new Error(dependencyError)
        if (!MessageBot.dependencies.getWorlds) throw new Error(dependencyError)

        this.world = new World(new MessageBot.dependencies.Api(info), storage)

        // Load extensions which were registered before this bot was created
        let load = storage.get<string[]>('extensions', [])
        for (let id of load) {
            if (extensions.has(id)) this.addExtension(id)
        }

        // Load extensions which are registered after this bot has been created
        extensionRegistered.sub(id => {
            if (storage.get<string[]>('extensions', []).includes(id)) this.addExtension(id)
        })
    }

    /**
     * Gets the exports of an extension, returns undefined if the extension is not loaded.
     * @param id the extension id to get exports from
     */
    getExports = (id: string): {[key: string]: any} | undefined => {
        let ex = this.extensions.get(id.toLocaleLowerCase())
        if (ex) return ex.exports
    }

    /**
     * Adds an extension to this bot, can be used directly for development but should not be used
     * by published extensions (unless the extension is an extension manager)
     * @param id the id of the registered extension to add.
     */
    addExtension = (id: string) => {
        id = id.toLocaleLowerCase()
        if (this.extensions.has(id)) throw new Error(`The ${id} extension has already been added.`)

        let creator = extensions.get(id)
        if (!creator) throw new Error(`The ${id} extension has not been registered.`)
        try {
            let ex = new MessageBotExtension(id, this)
            this.extensions.set(id, ex)
            creator.call(ex, ex, this.world)
        } catch (_) {
            console.log(`Error adding the ${id} extension. It may be partially loaded.`)
        }
    }

    /**
     * Removes a currently loaded extension. Should not be used by published extensions unless
     * the extension is an extension manager.
     * @param id the id of the extension to remove
     * @param uninstall whether or not to call the uninstall function.
     */
    removeExtension = (id: string, uninstall = true) => {
        id = id.toLocaleLowerCase()
        let ex = this.extensions.get(id)
        if (!ex) throw new Error(`The ${id} extension is not loaded.`)

        try {
            if (uninstall) ex.uninstall()
        } catch (error) {
            console.log(`Error uninstalling ${id}:`, error)
        } finally {
            this.extensions.delete(id)
        }
    }
}