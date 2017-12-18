import { MessageBot, Storage, WorldApi, World } from './index'
import * as ava from 'ava'
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

interface Context {
    storage: MockStorage
}

ava.test.beforeEach(t => {
    t.context = {...t.context, storage: new MockStorage() }
})
const test: ava.RegisterContextual<Context> = ava.test

// Disable the chat watcher to avoid errors
import {ChatWatcher} from './chatWatcher'
ChatWatcher.prototype.start = () => {}

const tn = ([s]: TemplateStringsArray) => `MessageBot - ${s}`

type tParam = ava.GenericTestContext<ava.Context<Context>>
const info = {name: 'NAME', id: 'some_id' }
const makeBot = (t: tParam) => new MessageBot(t.context.storage, info)

const pass = (t: tParam) => () => t.pass()
const fail = (t: tParam) => () => t.fail()


// Note, this will run before all parallel tests
// https://github.com/avajs/ava/issues/12
test.serial(tn`Should throw an error if dependencies are not set`, t => {
    t.throws(() => makeBot(t))
})

test.serial(tn`fetch should return the fetch instance set in the dependencies`, t => {
    let s = Symbol('fetch')
    MessageBot.dependencies = { Api: MockApi, async getWorlds() { return [] }, fetch: s } as any
    let bot = makeBot(t)
    t.is(bot.fetch, s as any)
})

test.serial(tn`Should not throw if dependencies are set`, t => {
    MessageBot.dependencies = {
        Api: MockApi,
        async getWorlds() { return [] },
        fetch: () => Promise.resolve(new Response())
    }
    t.notThrows(() => makeBot(t))
})

test(tn`Should set the world property`, t => {
    let bot = makeBot(t)
    t.true(bot.world instanceof World)
})

test(tn`extensionRegistered should fire when an extension is registered`, t => {
    MessageBot.extensionRegistered.sub(pass(t))
    MessageBot.registerExtension('empty', () => {})
    MessageBot.deregisterExtension('empty')
})

test(tn`extensionRegistered should fire when an extension is reregistered`, t => {
    MessageBot.registerExtension('empty', () => { })
    MessageBot.extensionRegistered.sub(pass(t))
    MessageBot.registerExtension('empty', () => { })
    MessageBot.deregisterExtension('empty')

})

test(tn`extensionDeregistered should fire when an extension is deregistered`, t => {
    MessageBot.registerExtension('empty', () => { })
    MessageBot.extensionDeregistered.sub(pass(t))
    MessageBot.deregisterExtension('empty')
})

test(tn`extensionDeregistered should not fire when an extension has not been registered`, t => {
    let f = fail(t)
    MessageBot.extensionDeregistered.sub(f)
    MessageBot.deregisterExtension('empty')
    MessageBot.extensionDeregistered.unsub(f)
    t.pass()
})

test(tn`extensions should be an array of currently registered extension ids`, t => {
    t.deepEqual(MessageBot.extensions, [])
    MessageBot.registerExtension('empty', () => {})
    t.deepEqual(MessageBot.extensions, ['empty'])
    MessageBot.deregisterExtension('empty')
})

test(tn`getExports should return the exports property of an extension`, t => {
    let bot = makeBot(t)
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
})

test(tn`getExports should return undefined if the extension has not been created`, t => {
    let bot = makeBot(t)
    t.is(bot.getExports('test'), undefined)
})

test(tn`addExtension should throw if an extension has already been added`, t => {
    let bot = makeBot(t)
    let id = 'test'
    MessageBot.registerExtension(id, () => {})
    bot.addExtension(id)
    t.throws(() => bot.addExtension(id))
    // Cleanup
    bot.removeExtension(id, false)
    MessageBot.deregisterExtension(id)
})

test(tn`addExtension should throw if an extension has not been registered`, t => {
    let bot = makeBot(t)
    let id = 'test'
    t.throws(() => bot.addExtension(id))
})

test(tn`removeExtension should throw if an extension has not been loaded`, t => {
    let id = 'test'
    let bot = makeBot(t)
    t.throws(() => bot.removeExtension(id, false))
})

test(tn`removeExtension should call remove if the extension is not being uninstalled`, t => {
    let id = 'test'
    MessageBot.registerExtension(id, ex => {
        ex.remove = () => t.pass()
    })
    let bot = makeBot(t)
    bot.addExtension(id)
    bot.removeExtension(id, false)

    MessageBot.deregisterExtension(id)
})

test(tn`removeExtension should call uninstall if the extension is not being uninstalled`, t => {
    let id = 'test'
    MessageBot.registerExtension(id, ex => {
        ex.uninstall = () => t.pass()
    })
    let bot = makeBot(t)
    bot.addExtension(id)
    bot.removeExtension(id, true)

    MessageBot.deregisterExtension(id)
})

test(tn`send should inject variables`, t => {
    let bot = makeBot(t)
    bot.world.send = (message: string) => {
        t.is(message, 'Message VAR end.')
        return Promise.resolve()
    }

    bot.send('Message {{key}} end.', {key: 'VAR'})
})

test(tn`send variable expansion should not be recursive`, t => {
    let bot = makeBot(t)
    bot.world.send = (message: string) => {
        t.is(message, 'Message {{VAR}} end.')
        return Promise.resolve()
    }

    bot.send('Message {{key}} end.', { key: '{{VAR}}', VAR: 'Other' })
    bot.send('Message {{key}} end.', { VAR: 'Other', key: '{{VAR}}' })
})

test(tn`send should allow the usage of 'name'`, t => {
    let bot = makeBot(t)
    bot.world.send = (message: string) => {
        t.is(message, 'NAME Name name')
        return Promise.resolve()
    }

    bot.send('{{NAME}} {{Name}} {{name}}', { name: 'NaMe' })
})

test(tn`Should allow not passing a params variable`, t => {
    let bot = makeBot(t)
    bot.world.send = (message: string) => {
        t.is(message, '{{fakeKey}}')
        return Promise.resolve()
    }

    bot.send('{{fakeKey}}')
})

test(tn`send should not care if the send request rejects`, async t => {
    let bot = makeBot(t)
    bot.world.send = () => Promise.reject(Error('Failed to send'))
    bot.send('Message')
    // If this fails, an unhandled rejection will be thrown
    t.pass()
})

test(tn`extensions should be an array of currently loaded extensions`, t => {
    let bot = makeBot(t)
    MessageBot.registerExtension('test', () => {})
    bot.addExtension('test')
    t.deepEqual(bot.extensions, ['test'])

    MessageBot.deregisterExtension('test')
})
