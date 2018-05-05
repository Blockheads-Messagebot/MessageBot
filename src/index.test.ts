import { MessageBot, Storage, WorldApi, World } from './index'
import * as test from 'tape'
import {
    WorldLists,
    WorldOverview,
    LogEntry,
    WorldPrivacy,
    WorldSizes,
    WorldStatus
} from 'blockheads-api-interface'

const overview: WorldOverview = Object.freeze({
    name: 'WORLD',
    owner: 'OWNER',
    created: new Date(),
    last_activity: new Date(),
    credit_until: new Date(),
    link: 'link',
    pvp: false,
    privacy: 'public' as WorldPrivacy, // Inferring types is broken here
    password: false,
    size: '1x' as WorldSizes, // Ditto
    whitelist: false,
    online: ['ONLINE'],
    status: 'online' as WorldStatus
})

const lists = {
    adminlist: [],
    modlist: [],
    whitelist: [],
    blacklist: []
}

let status: WorldStatus = 'online'

class MockStorage extends Storage {
    get<T>() { return {} as T }
    set() { }
    clear() { }
    prefix() { return this }
    keys(): string[] { throw new Error('Not implemented') }
}

class MockApi implements WorldApi {
    get name() { return 'hi' }
    get id() { return '123' }
    async getLists(): Promise<WorldLists> {
        return lists
    }
    async getStatus(): Promise<WorldStatus> {
        return status
    }
    setLists(_lists: WorldLists): Promise<void> {
        throw new Error('Method not implemented.')
    }
    async getOverview(): Promise<WorldOverview> {
        return overview
    }
    async getLogs(): Promise<LogEntry[]> {
        return []
    }
    send(_message: string): Promise<void> {
        throw new Error('Method not implemented.')
    }
    getMessages(_lastId: number): Promise<{ nextId: number, log: string[] }> {
        throw new Error('Method not implemented.')
    }
    start(): Promise<void> {
        throw new Error('Method not implemented.')
    }
    stop(): Promise<void> {
        throw new Error('Method not implemented.')
    }
    restart(): Promise<void> {
        throw new Error('Method not implemented.')
    }
}

const tn = ([s]: TemplateStringsArray) => `MessageBot - ${s}`

const info = {name: 'NAME', id: 'some_id' }
const makeBot = () => new MessageBot(new MockStorage(), info)

const pass = (t: test.Test) => () => t.pass()
const fail = (t: test.Test) => () => t.fail()

test(tn`Should throw an error if dependencies are not set`, t => {
    t.throws(() => makeBot())
    t.end()
})

test(tn`fetch should return the fetch instance set in the dependencies`, t => {
    let s = Symbol('fetch')
    MessageBot.dependencies = { Api: MockApi, async getWorlds() { return [] }, fetch: s } as any
    let bot = makeBot()
    t.is(bot.fetch, s as any)
    t.end()
})

test(tn`Should not throw if dependencies are set`, t => {
    MessageBot.dependencies = {
        Api: MockApi,
        async getWorlds() { return [] },
        fetch: () => Promise.resolve(new Response())
    }
    t.doesNotThrow(makeBot)
    t.end()
})

test(tn`Should set the world property`, t => {
    let bot = makeBot()
    t.true(bot.world instanceof World)
    t.end()
})

test(tn`extensionRegistered should fire when an extension is registered`, t => {
    MessageBot.extensionRegistered.sub(pass(t))
    MessageBot.registerExtension('empty', () => {})
    MessageBot.deregisterExtension('empty')
    t.end()
})

test(tn`extensionRegistered should fire when an extension is reregistered`, t => {
    MessageBot.registerExtension('empty', () => { })
    MessageBot.extensionRegistered.sub(pass(t))
    MessageBot.registerExtension('empty', () => { })
    MessageBot.deregisterExtension('empty')
    t.end()
})

test(tn`extensionDeregistered should fire when an extension is deregistered`, t => {
    MessageBot.registerExtension('empty', () => { })
    MessageBot.extensionDeregistered.sub(pass(t))
    MessageBot.deregisterExtension('empty')
    t.end()
})

test(tn`extensionDeregistered should not fire when an extension has not been registered`, t => {
    let f = fail(t)
    MessageBot.extensionDeregistered.sub(f)
    MessageBot.deregisterExtension('empty')
    MessageBot.extensionDeregistered.unsub(f)
    t.pass()
    t.end()
})

test(tn`extensions should be an array of currently registered extension ids`, t => {
    t.deepEqual(MessageBot.extensions, [])
    MessageBot.registerExtension('empty', () => {})
    t.deepEqual(MessageBot.extensions, ['empty'])
    MessageBot.deregisterExtension('empty')
    t.end()
})

test(tn`getExports should return the exports property of an extension`, t => {
    let bot = makeBot()
    let id = 'test'
    let exported = { prop: 'value' }
    MessageBot.registerExtension(id, ex => {
        ex.exports = exported
    })
    bot.addExtension(id)
    t.deepEqual(bot.getExports(id), exported)
    // Cleanup
    bot.removeExtension(id, false)
    MessageBot.deregisterExtension(id)
    t.end()
})

test(tn`getExports should return undefined if the extension has not been created`, t => {
    let bot = makeBot()
    t.is(bot.getExports('test'), undefined)
    t.end()
})

test(tn`addExtension should throw if an extension has already been added`, t => {
    let bot = makeBot()
    let id = 'test'
    MessageBot.registerExtension(id, () => {})
    bot.addExtension(id)
    t.throws(() => bot.addExtension(id))
    // Cleanup
    bot.removeExtension(id, false)
    MessageBot.deregisterExtension(id)
    t.end()
})

test(tn`addExtension should throw if an extension has not been registered`, t => {
    let bot = makeBot()
    let id = 'test'
    t.throws(() => bot.addExtension(id))
    t.end()
})

test(tn`removeExtension should throw if an extension has not been loaded`, t => {
    let id = 'test'
    let bot = makeBot()
    t.throws(() => bot.removeExtension(id, false))
    t.end()
})

test(tn`removeExtension should call remove if the extension is not being uninstalled`, t => {
    let id = 'test'
    MessageBot.registerExtension(id, ex => {
        ex.remove = () => t.pass()
    })
    let bot = makeBot()
    bot.addExtension(id)
    bot.removeExtension(id, false)

    MessageBot.deregisterExtension(id)
    t.end()
})

test(tn`removeExtension should call uninstall if the extension is not being uninstalled`, t => {
    let id = 'test'
    MessageBot.registerExtension(id, ex => {
        ex.uninstall = () => t.pass()
    })
    let bot = makeBot()
    bot.addExtension(id)
    bot.removeExtension(id, true)

    MessageBot.deregisterExtension(id)
    t.end()
})

test(tn`send should inject variables`, t => {
    let bot = makeBot()
    bot.world.send = (message: string) => {
        t.is(message, 'Message VAR end.')
        return Promise.resolve()
    }

    bot.send('Message {{key}} end.', {key: 'VAR'})
    t.end()
})

test(tn`send variable expansion should not be recursive`, t => {
    let bot = makeBot()
    bot.world.send = (message: string) => {
        t.is(message, 'Message {{VAR}} end.')
        return Promise.resolve()
    }

    bot.send('Message {{key}} end.', { key: '{{VAR}}', VAR: 'Other' })
    bot.send('Message {{key}} end.', { VAR: 'Other', key: '{{VAR}}' })
    t.end()
})

test(tn`send should allow the usage of 'name'`, t => {
    let bot = makeBot()
    bot.world.send = (message: string) => {
        t.is(message, 'NAME Name name')
        return Promise.resolve()
    }

    bot.send('{{NAME}} {{Name}} {{name}}', { name: 'NaMe' })
    t.end()
})

test(tn`Should allow not passing a params variable`, t => {
    let bot = makeBot()
    bot.world.send = (message: string) => {
        t.is(message, '{{fakeKey}}')
        return Promise.resolve()
    }

    bot.send('{{fakeKey}}')
    t.end()
})

test(tn`send should not care if the send request rejects`, async t => {
    let bot = makeBot()
    bot.world.send = () => Promise.reject(Error('Failed to send'))
    bot.send('Message')
    // If this fails, an unhandled rejection will be thrown
    t.pass()
    t.end()
})

test(tn`extensions should be an array of currently loaded extensions`, t => {
    let bot = makeBot()
    MessageBot.registerExtension('test', () => {})
    bot.addExtension('test')
    t.deepEqual(bot.extensions, ['test'])

    MessageBot.deregisterExtension('test')
    t.end()
})

test(tn`The bot should not be started until bot.start() is called.`, async t => {
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

    t.plan(2)
    const oldDeps = MessageBot.dependencies

    let started = false
    MessageBot.dependencies = {
        ...oldDeps,
        Api: class extends MockApi {
            async getMessages() {
                t.equal(started, true)
                return { nextId: 0, log: [] }
            }
        }
    }
    const bot = makeBot()

    await delay(10)
    started = true
    bot.start()
    await delay(10)
    bot.world.stopWatchingChat()
    MessageBot.dependencies = oldDeps
    t.true(started)
    t.end()
})
