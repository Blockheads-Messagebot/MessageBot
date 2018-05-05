import * as test from 'tape'

import { MessageBotExtension } from './extension'
import { MessageBot, World } from './index'
import { Storage } from './storage'

class MockStorage extends Storage {
    storage = new Map<string, any>()
    constructor(private _prefix: string = '') {
        super()
    }

    get<T>(key: string, fallback: T): T {
        return this.storage.get(this._prefix + key) || fallback
    }
    set(key: string, value: any): void {
        this.storage.set(this._prefix + key, value)
    }
    clear(_prefix?: string | undefined): void {
        throw new Error('Not implemented')
    }
    prefix(_prefix: string): Storage {
        throw new Error('Not implemented')
    }
    keys(): string[] {
        throw new Error('Not implemented')
    }
}

class PrefixedMockStorage extends MockStorage {
    prefix(_str: string) { return this }
}
// The world is only provided for the extension for user code
// the class itself doesn't use it besides assigning it to the instance
const makeWorld = () => ({} as World)

// No need to provide export / adding extension functions
const makeBot = (): MessageBot => ({
    world: makeWorld(),
    storage: new PrefixedMockStorage(),
} as any)


const tn = ([s]: TemplateStringsArray) => `MessageBotExtension - ${s}`

test(tn`Should save the bot instance`, t => {
    let bot = makeBot()
    let ex = new MessageBotExtension('test', bot)
    t.is(ex.bot, bot)
    t.end()
})

test(tn`Should save the world instance`, t => {
    let bot = makeBot()
    let ex = new MessageBotExtension('test', bot)
    t.is(ex.world, bot.world)
    t.end()
})

test(tn`Should save the world instance`, t => {
    let bot = makeBot()
    let ex = new MessageBotExtension('test', bot)
    t.is(ex.world, bot.world)
    t.end()
})

test(tn`Should create a prefixed storage with the extension id`, t => {
    let bot = makeBot()
    bot.storage.prefix = id => {
        t.is(id, 'test')
        return bot.storage
    }
    new MessageBotExtension('test', bot)
    t.end()
})

test(tn`Should clear the extension storage by default when uninstalled`, t => {
    let bot = makeBot()
    bot.storage.prefix = () => bot.storage
    bot.storage.clear = () => t.pass()

    let ex = new MessageBotExtension('test', bot)
    ex.uninstall()
    t.end()
})

test(tn`Should remove the extension when uninstalling by default`, t => {
    let ex = new MessageBotExtension('test', makeBot())
    ex.bot.storage.clear = () => {}
    ex.remove = () => t.pass()
    ex.uninstall()
    t.end()
})
