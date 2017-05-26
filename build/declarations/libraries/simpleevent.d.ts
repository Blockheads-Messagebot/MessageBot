/**
 * Generic class which emits events.
 */
export declare class SimpleEvent<TEvent> {
    protected listeners: {
        cb: (e: TEvent) => void;
        once: boolean;
    }[];
    /**
     * Creates a new instance of the class.
     */
    constructor();
    /**
     * Subscribes to the event, whenever it is fired, the passed callback will be called with the event args.
     *
     * @param callback the handler to add.
     */
    subscribe(callback: (e: TEvent) => void): void;
    /**
     * Subscribes to the event, whenever it is fired, the passed callback will be called with the event args.
     * This method is an alias of the subscribe method.
     *
     * @param callback the handler to add.
     */
    sub(callback: (e: TEvent) => void): void;
    /**
     * Registers an event handler that will only be called once.
     *
     * @param callback the handler to add.
     */
    once(callback: (e: TEvent) => void): void;
    /**
     * Removes an event handler, if it is attached to the event.
     *
     * @param callback the callback to remove as a handler.
     */
    unsubscribe(callback: (e: TEvent) => void): void;
    /**
     * Removes an event handler, if it is attached to the event. This method is an alias of the unsubscribe method.
     *
     * @param callback the callback to remove as a handler.
     */
    unsub(callback: (e: TEvent) => void): void;
    /**
     * Fires the event, calling all handlers.
     *
     * @param event the arguments to be passed to the handlers.
     */
    dispatch(event: TEvent): void;
    /**
     * Checks if the provided callback has been attached as an event handler.
     *
     * @param callback the handler which may be attached to the event.
     */
    has(callback: (e: TEvent) => void): boolean;
}
