/**
 * A custom event emitter class similar to Node's EventEmitter.
 *
 * @deprecated since 7.0
 */
export class Hook {
    /**
     * @hidden
     */
    private listeners: Map<string, Set<Function>>;
    on: (key: string, callback: Function) => void;
    fire: (key: string, ...args: any[]) => void;

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
    listen(key: string, callback: Function): void {
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
    remove(key: string, callback: Function): void {
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
    check(key: string, ...args: any[]): void {
        this.getFuncs(key).forEach(listener => {
            try {
                listener(...args);
            } catch (e) {
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
    private getFuncs(key: string): Set<Function> {
        key = key.toLocaleLowerCase();
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set<Function>());
        }

        return <Set<Function>>this.listeners.get(key);
    }
}
