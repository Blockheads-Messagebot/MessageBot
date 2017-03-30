"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A custom event emitter class similar to Node's EventEmitter.
 *
 * @deprecated since 7.0
 */
class Hook {
    /**
     * Creates a new instance of the class, takes no parameters.
     */
    constructor() {
        this.listeners = new Map();
        this.on = this.listen;
        this.fire = this.check;
    }
    /**
     * Function used to begin listening to an event. An alias "on" is also provided.
     *
     * @example
     * listen('event', console.log);
     * //alternatively
     * on('event', console.log);
     * @param key - the event to listen for.
     * @param callback - the subscriber.
     */
    listen(key, callback) {
        this.getFuncs(key).add(callback);
    }
    /**
     * Function used to stop listening to an event. If the listener was not found, no action will be taken.
     *
     * @example
     * //Earlier attached myFunc to 'event'
     * remove('event', myFunc);
     * @param key - the event to remove the listener from.
     * @param callback - the callback to remove.
     */
    remove(key, callback) {
        this.getFuncs(key).delete(callback);
    }
    /**
     * Function used to call events. An alias, "fire" is also provided.
     *
     * @example
     * check('test', 1, 2, 3);
     * check('test', true);
     * // alternatively
     * fire('test', 1, 2, 3);
     * fire('test', true);
     * @param key - the event to call.
     * @param args - any arguments to pass to listeners.
     */
    //tslint:disable-next-line:no-any
    check(key, ...args) {
        this.getFuncs(key).forEach(listener => {
            try {
                listener(...args);
            }
            catch (e) {
                if (key != 'error') {
                    console.error(e);
                    this.check('error', e);
                }
            }
        });
    }
    /**
     * Gets the listeners associated with an event
     *
     * @hidden
     * @param key the listeners to get.
     */
    getFuncs(key) {
        key = key.toLocaleLowerCase();
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        return this.listeners.get(key);
    }
}
exports.Hook = Hook;
