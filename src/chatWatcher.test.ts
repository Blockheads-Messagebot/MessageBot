import * as test from 'tape'

import { ChatWatcher, JoinEventArgs, MessageEventArgs } from './chatWatcher'

// Note: Using delays in tests is not a good idea, however for testing this module it is unavoidable.
const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms))

const tn = ([s]: TemplateStringsArray) => `ChatWatcher - ${s}`

function makeApi(...log: string[]) {
    return {
        getMessages: async () => ({ nextId: log.length, log }),
        length: log.length
    }
}

test(tn`Should correctly report if running`, t => {
    t.plan(3)
    let watcher = new ChatWatcher(makeApi(), [])
    t.is(watcher.running, false)
    watcher.start()
    t.is(watcher.running, true)
    watcher.stop()
    t.is(watcher.running, false)
})

async function joinRace(watcher: ChatWatcher, cb: (info: JoinEventArgs) => void): Promise<void> {
    watcher.onJoin.sub(cb)
    watcher.start()
    await delay()
    watcher.stop()
}

test(tn`Should fire join events`, t => {
    t.plan(1)
    let api = makeApi('WORLD - Player Connected NAME | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345')

    let watcher = new ChatWatcher(api, [])

    joinRace(watcher, () => t.pass())
})

test(tn`Should include the player name in join events`, t => {
    t.plan(1)
    let api = makeApi('WORLD - Player Connected NAME | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345')

    let watcher = new ChatWatcher(api, [])

    joinRace(watcher, ({name}) => t.is(name, 'NAME'))
})

test(tn`Should include the player ip in join events`, t => {
    t.plan(1)
    let api = makeApi('WORLD - Player Connected NAME | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345')

    let watcher = new ChatWatcher(api, [])

    joinRace(watcher, ({ip}) => t.is(ip, '0.0.0.0'))
})

test(tn`Should not fire join events for players already connected`, async t => {
    t.plan(1)
    let api = makeApi(
        'WORLD - Player Connected NAME | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345',
    )

    let watcher = new ChatWatcher(api, ['NAME'])
    watcher.onJoin.sub(() => t.fail())
    watcher.start()
    await delay()
    watcher.stop()
    t.pass()
})

test(tn`Should add connected players to the online array`, async t => {
    t.plan(1)
    let api = makeApi(
        'WORLD - Player Connected NAME | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345',
    )
    let online: string[] = []

    let watcher = new ChatWatcher(api, online)

    joinRace(watcher, () => {
        t.deepEqual(online, ['NAME'])
    })
})

test(tn`Should not fire events for invalid names`, async t => {
    t.plan(1)
    let api = makeApi(
        'WORLD - Player Connected AB | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345',
        'WORLD - Player Connected asdf | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345',
    )

    let watcher = new ChatWatcher(api, [])
    watcher.onJoin.sub(({name}) => t.fail(`A join event should not have been fired for "${name}"`))
    watcher.start()
    await delay()
    watcher.stop()
    t.pass()
})

test(tn`Should not fire events for invalid joins`, async t => {
    t.plan(1)
    let api = makeApi(
        'WORLD - Player Connected ABC | 0.0.0.0 | short',
    )

    let watcher = new ChatWatcher(api, [])
    watcher.onJoin.sub(({name}) => t.fail(`A join event should not have been fired for "${name}"`))
    watcher.start()
    await delay()
    watcher.stop()
    t.pass()
})

test(tn`Should handle names with pipes`, t => {
    t.plan(1)
    let api = makeApi('WORLD - Player Connected NAME | MORE | 0.0.0.0 | abcdefghijklmnopqrstuvwxyz012345')

    let watcher = new ChatWatcher(api, [])

    return joinRace(watcher, ({ name }) => t.is(name, 'NAME | MORE'))
})

async function leaveRace(watcher: ChatWatcher, cb: (name: string) => void): Promise<void> {
    watcher.onLeave.sub(cb)
    watcher.start()
    await delay()
    watcher.stop()
}

test(tn`Should fire leave events`, async t => {
    t.plan(1)
    let api = makeApi(
        'WORLD - Player Disconnected NAME',
    )

    let watcher = new ChatWatcher(api, ['NAME'])

    leaveRace(watcher, () => t.pass())
})

test(tn`Should not fire leave events for offline players`, async t => {
    t.plan(1)
    let api = makeApi(
        'WORLD - Player Disconnected NAME',
    )

    let watcher = new ChatWatcher(api, [])

    watcher.onLeave.sub(() => t.fail())
    watcher.start()
    await delay()
    watcher.stop()
    t.pass()
})

test(tn`Should remove players from the online array`, t => {
    t.plan(1)
    let api = makeApi('WORLD - Player Disconnected NAME')
    let online = ['NAME']

    let watcher = new ChatWatcher(api, online)
    leaveRace(watcher, () => {
        t.deepEqual(online, [])
    })
})

test(tn`Should include the player name in leave events`, t => {
    t.plan(1)
    let api = makeApi('WORLD - Player Disconnected NAME')

    let watcher = new ChatWatcher(api, ['NAME'])
    leaveRace(watcher, name => {
        t.is(name, 'NAME')
    })
})

async function messageRace(watcher: ChatWatcher, cb: (data: MessageEventArgs) => void) {
    watcher.onMessage.sub(cb)
    watcher.start()
    await delay()
    watcher.stop()
}

test(tn`Should fire messages for online players`, t => {
    t.plan(1)
    let api = makeApi('NAME: Hello!')

    let watcher = new ChatWatcher(api, ['NAME'])

    return messageRace(watcher, () => t.pass())
})

test(tn`Should include the player name`, t => {
    t.plan(1)
    let api = makeApi('NAME: Hello!')

    let watcher = new ChatWatcher(api, ['NAME'])

    return messageRace(watcher, ({name}) => t.is(name, 'NAME'))
})

test(tn`Should include the player message`, t => {
    t.plan(1)
    let api = makeApi('NAME: Hello!')

    let watcher = new ChatWatcher(api, ['NAME'])

    return messageRace(watcher, ({message}) => t.is(message, 'Hello!'))
})

test(tn`Should include the player message`, t => {
    t.plan(1)
    let api = makeApi('NAME: Hello!')

    let watcher = new ChatWatcher(api, ['NAME'])

    return messageRace(watcher, ({message}) => t.is(message, 'Hello!'))
})

test(tn`Should handle player names with colons`, t => {
    t.plan(2)
    let api = makeApi('NAME: : Hello!')

    let watcher = new ChatWatcher(api, ['NAME: '])

    return messageRace(watcher, ({name, message}) => {
        t.is(name, 'NAME: ')
        t.is(message, 'Hello!')
    })
})

test(tn`Should default to the longer name if a name is not online`, t => {
    t.plan(2)
    let api = makeApi('NAME: : Hello!')

    let watcher = new ChatWatcher(api, [])

    return messageRace(watcher, ({name, message}) => {
        t.is(name, 'NAME: ')
        t.is(message, 'Hello!')
    })
})

test(tn`Should not fire events for invalid names`, async t => {
    t.plan(1)
    let api = makeApi('AD: test')

    let watcher = new ChatWatcher(api, [])

    watcher.onMessage.sub(() => t.fail())
    watcher.start()
    await delay()
    watcher.stop()
    t.pass()
})

// Partial mitigation for https://forums.theblockheads.net/t/the-message-bot/18040/1027
test(tn`Should not return messages starting with / from SERVER`, async t => {
    t.plan(1)
    let api = makeApi('SERVER: /test')

    let watcher = new ChatWatcher(api, [])

    watcher.onMessage.sub(() => t.fail())
    watcher.start()
    await delay()
    watcher.stop()
    t.pass()
})

test(tn`Should handle colons in messages`, async t => {
    t.plan(2)
    let api = makeApi('NAME: : hi')

    let watcher = new ChatWatcher(api, ['NAME'])

    messageRace(watcher, ({name, message}) => {
        t.is(name, 'NAME')
        t.is(message, ': hi')
    })
})

test(tn`Unparsed messages should be sent to other`, async t => {
    t.plan(3)
    let api = makeApi(
        'using seed:1434298072',
        'SERVER: /test',
        'WORLD - Player Connected abc | 0.0.0.0 | asdf'
    )

    let watcher = new ChatWatcher(api, [])
    watcher.onOther.sub(() => t.pass())
    watcher.start()
    await delay()
    watcher.stop()
})

test(tn`Calling start multiple times should not start multiple listeners`, async t => {
    t.plan(2)
    class MockWatcher extends ChatWatcher {
        stop() {
            t.pass()
            super.stop()
        }
    }

    let api = makeApi()
    let watcher = new MockWatcher(api, [])
    watcher.start()
    watcher.start()
    watcher.stop()
})

test(tn`Calling stop should not throw if the listener is not started`, t => {
    let api = makeApi()
    let watcher = new ChatWatcher(api, [])
    t.doesNotThrow(() => watcher.stop())
    t.end()
})

test(tn`Should schedule chat checks even if the api throws`, async t => {
    t.plan(1)
    let api = {
        getMessages(): Promise<{nextId: number, log: string[]}> { throw Error() }
    }

    class MockWatcher extends ChatWatcher {
        get id() { return this.timeoutId }
    }

    let watcher = new MockWatcher(api, [])
    watcher.start()
    let oldId = watcher.id
    await delay()
    t.not(watcher.id, oldId)
    watcher.stop()
})

test(tn`Should stop even if stop is called while waiting for an api response`, async t => {
    t.plan(1)
    let watcher: ChatWatcher
    let api = {
        getMessages() {
            watcher.stop()
            return Promise.resolve({nextId: 0, log: []})
        }
    }

    watcher = new ChatWatcher(api, [])
    watcher.start()
    await delay()
    t.is(watcher.running, false)
})
