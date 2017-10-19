interface Subscription<Argument> {
    listener: (arg: Argument) => void
    once: boolean
}

/**
 * An object which enables subscribing and unsubscribing from an event without exposing methods to fire the event.
 */
export interface SafeSimpleEvent<Argument> {
    /**
     * Subscribe to the event.
     * @param listener The listener which will be added.
     */
    sub(listener: (arg: Argument) => void): void
    /**
     * Unsubscribes from the event.
     * @param listener The listener which will be removed.
     */
    unsub(listener: (arg: Argument) => void): void
    /**
     * Subscribes to the event with a listener which will only be called once.
     * @param listener The listener which will be added.
     */
    one(listener: (arg: Argument) => void): void
}

/**
 * An event which can be subscribed to and dispatched
 */
export class SimpleEvent<Argument> {
    private subscribers: Subscription<Argument>[] = []

    constructor() {}

    /**
     * Subscribe to the event.
     * @param listener The listener which will be called when the event is dispatched.
     */
    sub(listener: (arg: Argument) => void): void {
        this.subscribers.push({listener, once: false})
    }

    /**
     * Unsubscribe from the event.
     * @param listener The listener to remove.
     */
    unsub(listener: (arg: Argument) => void): void {
        let index = this.subscribers.findIndex(sub => listener == sub.listener)
        if (index != -1) {
            this.subscribers.splice(index, 1)
        }
    }

    /**
     * Subscribes to the event only once.
     * @param listener The listener which will be called when the event is dispatched.
     */
    one(listener: (arg: Argument) => void): void {
        this.subscribers.push({ listener, once: true })
    }

    /**
     * Dispatches an event, calling all listeners.
     * @param arg the argument to call listeners with.
     */
    dispatch(arg: Argument): void {
        this.subscribers.forEach(({listener, once}) => {
            if (once) this.unsub(listener)
            listener(arg)
        })
    }

    /**
     * A helper to avoid exposing undesirable events.
     */
    asEvent(): SafeSimpleEvent<Argument> {
        let that = this
        return {
            sub(listener: (arg: Argument) => void) {
                return that.sub(listener)
            },
            one(listener: (arg: Argument) => void) {
                return that.one(listener)
            },
            unsub(listener: (arg: Argument) => void) {
                return that.unsub(listener)
            },
        }
    }
}