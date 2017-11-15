import test from 'ava'
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

const tn = ([s]: TemplateStringsArray) => `Storage - ${s}`

test(tn`Should use the original value if no value is returned`, t => {
    let s = new MockStorage()
    let fallback = {someKey: 'val'}
    s.with('key', fallback, () => {})

    t.deepEqual(s.storage.get('key'), fallback)
})

test(tn`Should use the returned value if a value is returned`, t => {
    let s = new MockStorage()
    let fallback = {someKey: 'val'}
    s.with('key', fallback, () => ({someKey: 'other'}))

    t.deepEqual(s.storage.get('key'), {someKey: 'other'})
})
