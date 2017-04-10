/**
 * Generic class which emits events.
 */
export class SimpleEvent<TEvent> {
    protected listeners: {cb: (e: TEvent) => void, once: boolean}[];

    /**
     * Creates a new instance of the class.
     */
    constructor() {
        this.listeners = [];

        this.dispatch = this.dispatch.bind(this);
    }

    /**
     * Subscribes to the event, whenever it is fired, the passed callback will be called with the event args.
     *
     * @param callback the handler to add.
     */
    subscribe(callback: (e: TEvent) => void): void {
        if (!this.has(callback)) {
            this.listeners.push({cb: callback, once: false});
        }
    }

    /**
     * Subscribes to the event, whenever it is fired, the passed callback will be called with the event args.
     * This method is an alias of the subscribe method.
     *
     * @param callback the handler to add.
     */
    sub(callback: (e: TEvent) => void): void {
        this.subscribe(callback);
    }

    /**
     * Registers an event handler that will only be called once.
     *
     * @param callback the handler to add.
     */
    once(callback: (e: TEvent) => void): void {
        if (!this.has(callback)) {
            this.listeners.push({cb: callback, once: true});
        }
    }

    /**
     * Removes an event handler, if it is attached to the event.
     *
     * @param callback the callback to remove as a handler.
     */
    unsubscribe(callback: (e: TEvent) => void): void {
        for (let i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].cb == callback) {
                this.listeners.splice(i, 1);
                break;
            }
        }
    }

    /**
     * Removes an event handler, if it is attached to the event. This method is an alias of the unsubscribe method.
     *
     * @param callback the callback to remove as a handler.
     */
    unsub(callback: (e: TEvent) => void): void {
        this.unsubscribe(callback);
    }

    /**
     * Fires the event, calling all handlers.
     *
     * @param event the arguments to be passed to the handlers.
     */
    dispatch(event: TEvent): void {
        let len = this.listeners.length;
        for (let i = 0; i < len; i++) {
            if (this.listeners[i].once) {
                try {
                    len--;
                    this.listeners.splice(i--, 1)[0].cb(event);
                } catch(e) {}
            } else {
                try {
                    this.listeners[i].cb(event);
                } catch(e) {}
            }
        }
    }

    /**
     * Checks if the provided callback has been attached as an event handler.
     *
     * @param callback the handler which may be attached to the event.
     */
    has(callback: (e: TEvent) => void): boolean {
        return this.listeners.some(({cb}) => cb == callback);
    }
}
