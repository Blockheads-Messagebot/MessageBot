import * as test from 'tape'

import { World, PlayerStorage } from './world'
import {
    WorldOverview,
    WorldApi,
    WorldLists,
    LogEntry,
    WorldPrivacy,
    WorldSizes,
    WorldStatus
} from 'blockheads-api-interface'

import { Player } from './player'
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

const lists = { adminlist: [], whitelist: [], blacklist: [], modlist: [] }

const api: WorldApi = {
    get name() { return 'hi' },
    get id() { return '123' },
    async getStatus() { return 'online' as WorldStatus },
    async getLists() { return lists },
    async setLists() { },
    async getOverview() { return overview },
    async getLogs() { return [] },
    async send(_message: string) { },
    async getMessages(_lastId: number) { return { nextId: 0, log: [] } },
    async start() { },
    async stop() { },
    async restart() { }
}

const storage = new MockStorage()

// Helpers
const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

const tn = ([s]: TemplateStringsArray) => `World - ${s}`

test(tn`Should expose events`, t => {
    t.plan(4 * 2)
    let world = new World(api, storage)
    let events: Array<keyof World> = ['onJoin', 'onLeave', 'onMessage', 'onOther']

    for (let event of events) {
        for (let prop of ['sub', 'unsub']) {
            t.not((world[event] as any)[prop], null)
        }
    }
})

test(tn`Should expose online players with the updated information from the overview`, async t => {
    t.plan(1)
    let world = new World(api, storage)

    await delay(100)
    t.deepEqual(world.online, overview.online)
})

test(tn`Should expose all players in storage`, async t => {
    t.plan(2)
    let players = {NAME: {ip: '0.0.0.0', ips: ['0.0.0.0'], joins: 1}}
    let storage = new MockStorage()
    storage.get = <T>(_key: string, _fallback: T): T => {
        return {...players} as any
    }
    let world = new World(api, storage)

    await delay(100)
    // There is one player in the storage
    t.is(world.players.length, 1)
    // The name is NAME
    t.is(world.players[0].name, 'NAME')
})

test(tn`Should get the world status`, async t => {
    t.plan(1)
    let storage = new MockStorage()
    let world = new World(api, storage)

    t.is(overview.status, await world.getStatus())
})

test(tn`Should cache overview api calls`, async t => {
    t.plan(6)
    let storage = new MockStorage()
    let apiChecker = {
        ...api,
        async getOverview() {
            t.pass()
            return overview
        },
        async getLists() {
            t.pass()
            return lists
        },
        async getLogs() {
            t.pass()
            return []
        }
    }

    let world = new World(apiChecker, storage)
    for (let i = 0; i < 3; i++) {
        await world.getOverview(i == 2)
        await world.getLists(i == 2)
        await world.getLogs(i == 2)
    }
})

test(tn`Should expose the overview safely`, async t => {
    t.plan(Object.values(overview).filter((v: any) => typeof v == 'object').length + 1)
    let storage = new MockStorage()
    let world = new World(api, storage)

    let worldOverview = await world.getOverview()
    Object.keys(worldOverview).forEach(k => {
        const key = k as keyof WorldOverview
        if (typeof worldOverview[key] == 'object') {
            t.not(worldOverview[key], overview[key])
        }
    })
    t.not(worldOverview, overview)
})

test(tn`Should update the owner property when calling getOverview`, async t => {
    t.plan(1)
    let storage = new MockStorage()
    storage.set = (_, value) => {
        t.is(value[overview.owner].owner, true)
    }

    new World(api, storage)
    await delay(100)
})

test(tn`Should return lists in a safe manner`, async t => {
    t.plan(4)
    let storage = new MockStorage()
    let world = new World(api, storage)

    let worldLists = await world.getLists()
    t.not(worldLists.adminlist, lists.adminlist)
    t.not(worldLists.modlist, lists.modlist)
    t.not(worldLists.whitelist, lists.whitelist)
    t.not(worldLists.blacklist, lists.blacklist)
})

test(tn`Should set lists using the current lists`, async t => {
    t.plan(2)
    let storage = new MockStorage()
    let testApi = {
        ...api,
        async getLists(): Promise<WorldLists> {
            return {
                ...lists,
                adminlist: ['BLAH']
            }
        },
        async setLists(setLists: WorldLists) {
            t.deepEqual(setLists.adminlist, ['BLAH'])
            t.deepEqual(setLists.modlist, ['HI'])
        }
    }
    let world = new World(testApi, storage)

    await world.setLists({modlist: ['HI']})
})

test(tn`Should cache getLogs calls`, async t => {
    t.plan(1)
    let storage = new MockStorage()
    let testApi = {
        ...api,
        async getLogs() {
            t.pass()
            return []
        }
    }

    let world = new World(testApi, storage)
    await world.getLogs()
    await world.getLogs()
})

test(tn`Should return logs in a safe manner`, async t => {
    t.plan(4)

    let logs: LogEntry[] = [{raw: '', message: '', timestamp: new Date()}]
    let storage = new MockStorage()
    let testApi = {
        ...api,
        async getLogs() {
            return logs
        }
    }

    let world = new World(testApi, storage)
    let worldLogs = await world.getLogs()

    t.not(worldLogs, logs)
    t.not(worldLogs[0], logs[0])
    t.not(worldLogs[0].timestamp, logs[0].timestamp)
    t.deepEqual(worldLogs, logs)
})

test(tn`Should update the players object when fetching logs`, async t => {
    t.plan(1)

    const storage = new MockStorage()
    storage.set('lastPlayersUpdate', 10)
    const world = new World({
        ...api,
        async getLogs() {
            return [
                // Before before last update, won't be used.
                { raw: '', timestamp: new Date(0), message: `${overview.name} - Player Connected PLAYER NAME | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345`},
                // This should be far enough in the future...
                { raw: '', timestamp: new Date(Date.now() - 1000), message: `SERVER: Hi!`},
                { raw: '', timestamp: new Date(Date.now() - 1000), message: `${overview.name} - Player Connected PLAYER NAME | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345` },
                // After now, won't be used
                { raw: '', timestamp: new Date(Date.now() + 1000), message: `${overview.name} - Player Connected PLAYER NAME | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345`}
            ]
        }
    }, storage)

    await world.getLogs()
    t.deepEqual(storage.get<PlayerStorage>('players', {}), {
        'OWNER': { ip: '', ips: [], joins: 0, owner: true },
        'PLAYER NAME': { ip: '0.0.0.0', ips: ['0.0.0.0'], joins: 1 }
    })
})

test(tn`Should return a player object even for names that do not exist`, t => {
    t.plan(1)
    let storage = new MockStorage()
    let world = new World(api, storage)

    t.true(world.getPlayer('Does not exist') instanceof Player)
})

test(tn`Should support adding commands`, async t => {
    t.plan(1)
    let storage = new MockStorage()
    let mockApi = {
        ...api,
        async getMessages() {
            return { status: 'ok', log: ['NAME: /test'], nextId: 0 }
        }
    }
    let world = new World(mockApi, storage)

    world.addCommand('test', () => t.pass())
    world.startWatchingChat()
    await delay(100)
    world.stopWatchingChat()
})

test(tn`Should not report messages not staring with / are commands`, async t => {
    t.plan(1)
    let storage = new MockStorage()
    let mockApi = {
        ...api,
        async getMessages() {
            return { status: 'ok', log: ['NAME: Hi'], nextId: 0 }
        }
    }
    let world = new World(mockApi, storage)

    world.addCommand('hi', () => t.fail())
    world.startWatchingChat()
    await delay(100)
    world.stopWatchingChat()
    t.pass()
})

test(tn`Should throw if a command has already been added`, t => {
    t.plan(1)
    let storage = new MockStorage()
    let world = new World(api, storage)

    world.addCommand('test', () => {})
    try {
        world.addCommand('test', () => {})
        t.fail('Should have thrown')
    } catch (_) {
        t.pass()
    }
})

test(tn`Should support removing a command`, async t => {
    t.plan(1)
    let storage = new MockStorage()
    let mockApi = {
        ...api,
        async getMessages() {
            return { status: 'ok', log: ['NAME: /test'], nextId: 0 }
        }
    }
    let world = new World(mockApi, storage)

    world.addCommand('test', () => t.fail())
    world.removeCommand('test')
    world.startWatchingChat()
    await delay(100)
    world.stopWatchingChat()
    t.pass()
})

test(tn`Should pass other methods through to the api`, async t => {
    t.plan(4)
    let storage = new MockStorage()
    let mockApi = {
        ...api,
        async start() { t.pass() },
        async stop() { t.pass() },
        async restart() { t.pass() },
        async send(msg: string) { t.is(msg, 'Hello') },
    }
    let world = new World(mockApi, storage)

    await world.start()
    await world.stop()
    await world.restart()
    await world.send('Hello')
})

test(tn`Should update the player list when a player joins`, async t => {
    t.plan(1)
    let storage = new MockStorage()
    let mockApi = {
        ...api,
        async getMessages() {
            return { status: 'ok', log: [
                'WORLD - Player Connected TEST | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345',
            ], nextId: 0 }
        }
    }

    let world = new World(mockApi, storage)

    world.startWatchingChat()
    await delay(100)
    world.stopWatchingChat()

    t.deepEqual(storage.get<PlayerStorage>('players', {}), {
        OWNER: { ip: '', ips: [], joins: 0, owner: true },
        TEST: { ip: '0.0.0.0', ips: ['0.0.0.0'], joins: 1 }
    })
})

test(tn`Should add IPs if they are not yet recorded`, async t => {
    t.plan(1)
    let storage = new MockStorage()
    storage.set('players', { TEST: { joins: 1, ip: '0.0.0.0', ips: [] } })
    let mockApi = {
        ...api,
        async getMessages() {
            return {
                status: 'ok', log: [
                    'WORLD - Player Connected TEST | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345',
                ], nextId: 0
            }
        }
    }

    let world = new World(mockApi, storage)

    world.startWatchingChat()
    await delay(100)
    world.stopWatchingChat()

    t.deepEqual(storage.get<PlayerStorage>('players', {}), {
        OWNER: { ip: '', ips: [], joins: 0, owner: true },
        TEST: { ip: '0.0.0.0', ips: ['0.0.0.0'], joins: 2 }
    })
})

test(tn`Should send leave events`, async t => {
    t.plan(1)
    let storage = new MockStorage()
    let mockApi = {
        ...api,
        async getMessages() {
            return {
                status: 'ok', log: [
                    'WORLD - Player Connected TEST | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345',
                    'WORLD - Player Disconnected TEST'
                ], nextId: 0
            }
        }
    }

    let world = new World(mockApi, storage)
    world.onLeave.sub(({name}) => t.is(name, 'TEST'))
    world.startWatchingChat()
    await delay(100)
    world.stopWatchingChat()
})

test(tn`Names with leading colon-space`, async t => {
    t.plan(2)
    let storage = new MockStorage()
    let mockApi = {
        ...api,
        async getMessages() {
            return {
                status: 'ok', log: [
                    'WORLD - Player Connected : TIMOTHY  | 0.0.0.0 | 3d83feb8ddbcf3abc7c6b3c28f5c84d0',
                    'WORLD - Player Disconnected : TIMOTHY '
                ], nextId: 0
            }
        }
    }

    let world = new World(mockApi, storage)
    world.onLeave.sub(({name}) => t.is(name, ': TIMOTHY '))
    world.startWatchingChat()
    await delay(100)
    t.deepEqual(world.online, ['ONLINE'])
    world.stopWatchingChat()
})

test(tn`Should send events when a message starting with / is sent`, t => {
    t.plan(1)
    let storage = new MockStorage()
    let world = new World(api, storage)

    world.onMessage.sub(({ message }) => t.is(message, '/command'))
    world.send('/command')
})

test(tn`addCommand should work with sent messages`, t => {
    t.plan(1)
    let storage = new MockStorage()
    let world = new World(api, storage)

    world.addCommand('test', () => t.pass())
    world.send('/test')
})

test(tn`when a player removes themselves from the admin list, they should not be an admin`, async t => {
    t.plan(3)

    const storage = new MockStorage()
    const mockApi = {
        ...api,
        async getMessages() {
            return {
                status: 'ok', log: [
                    'NAME: /unadmin NAME',
                    'NAME: Hello'
                ], nextId: 0
            }
        },
        async getLists() {
            return {
                ...lists,
                adminlist: ['NAME']
            }
        }
    }

    const world = new World(mockApi, storage)
    world.onMessage.one(({ player }) => {
        t.is(player.name, 'NAME')
        t.true(player.isAdmin) // Admin when doing /unadmin
        world.onMessage.one(({ player }) => t.false(player.isAdmin)) // Not admin after
    })
    world.startWatchingChat()
    await delay(100)
    world.stopWatchingChat()
})

test(tn`Events should not be fired when parsing logs - #57`, async t => {
    t.plan(1)

    const world = new World({
        ...api,
        async getLogs() {
            return [{
                raw: '',
                timestamp: new Date(Date.now() - 1000),
                message: `${overview.name} - Player Connected | NAME | 0.0.0.0 | qwertyuiopasdfghjklzxcvbnm123456`
            }]
        }
    }, new MockStorage())

    world.onJoin.sub(() => t.fail('A join event should not have been fired.'))

    await world.getLogs(true)
    t.pass()
})

test(tn`Messages should be sent in the order the send method was called`, async t => {
    t.plan(4)

    const expected = [
        'First',
        'Second',
        'Third',
        'Fourth'
    ]
    const mockApi = {
        ...api,
        async send (message : string) {
            await delay(Math.random() * 100) //Random delay to check if <World>.send is executing them without order or if it's waiting for each to be sent.
            t.is(message, expected[0])
            expected.shift()
        }
    }
    
    const world = new World(
        mockApi,
        new MockStorage()
    )

    world.send('First')
    world.send('Second')
    world.send('Third')
    world.send('Fourth')

})