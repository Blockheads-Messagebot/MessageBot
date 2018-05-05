import * as test from 'tape'

import { SimpleEvent } from './events'

test(`Should allow subscriptions`, t => {
    t.plan(1)
    let e = new SimpleEvent<string>()
    e.sub(() => t.pass())
    e.dispatch('')
})

test(`Should pass through arguments`, t => {
    t.plan(1)
    let e = new SimpleEvent<string>()
    e.sub(s => t.is(s, 'str'))
    e.dispatch('str')
})

test(`Should allow single subscriptions`, t => {
    t.plan(1)
    let e = new SimpleEvent<string>()
    e.one(() => t.pass())
    e.dispatch('')
    e.dispatch('')
})

test(`Should allow single subscriptions`, t => {
    t.plan(1)
    let e = new SimpleEvent<string>()
    e.one(() => t.pass())
    e.dispatch('')
    e.dispatch('')
})

test(`Removing an already unsubscribed subscriber should have no effect`, t => {
    t.plan(1)
    let e = new SimpleEvent<string>()
    e.sub(() => t.pass())
    function pass() { t.pass() }
    e.unsub(pass)
    e.dispatch('')
})

test(`asEvent should return 'this' safe functions`, t => {
    t.plan(2)
    let e = new SimpleEvent<string>()
    let {sub, one, unsub} = e.asEvent()
    function pass() {
        t.pass()
    }

    sub(pass)
    one(() => t.pass())
    e.dispatch('')
    unsub(pass)
    e.dispatch('')
})
