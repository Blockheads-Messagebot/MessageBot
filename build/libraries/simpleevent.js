"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Generic class which emits events.
 */
var SimpleEvent = (function () {
    /**
     * Creates a new instance of the class.
     */
    function SimpleEvent() {
        this.listeners = [];
        this.dispatch = this.dispatch.bind(this);
    }
    /**
     * Subscribes to the event, whenever it is fired, the passed callback will be called with the event args.
     *
     * @param callback the handler to add.
     */
    SimpleEvent.prototype.subscribe = function (callback) {
        if (!this.has(callback)) {
            this.listeners.push({ cb: callback, once: false });
        }
    };
    /**
     * Subscribes to the event, whenever it is fired, the passed callback will be called with the event args.
     * This method is an alias of the subscribe method.
     *
     * @param callback the handler to add.
     */
    SimpleEvent.prototype.sub = function (callback) {
        this.subscribe(callback);
    };
    /**
     * Registers an event handler that will only be called once.
     *
     * @param callback the handler to add.
     */
    SimpleEvent.prototype.once = function (callback) {
        if (!this.has(callback)) {
            this.listeners.push({ cb: callback, once: true });
        }
    };
    /**
     * Removes an event handler, if it is attached to the event.
     *
     * @param callback the callback to remove as a handler.
     */
    SimpleEvent.prototype.unsubscribe = function (callback) {
        for (var i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].cb == callback) {
                this.listeners.splice(i, 1);
                break;
            }
        }
    };
    /**
     * Removes an event handler, if it is attached to the event. This method is an alias of the unsubscribe method.
     *
     * @param callback the callback to remove as a handler.
     */
    SimpleEvent.prototype.unsub = function (callback) {
        this.unsubscribe(callback);
    };
    /**
     * Fires the event, calling all handlers.
     *
     * @param event the arguments to be passed to the handlers.
     */
    SimpleEvent.prototype.dispatch = function (event) {
        var len = this.listeners.length;
        for (var i = 0; i < len; i++) {
            if (this.listeners[i].once) {
                try {
                    len--;
                    this.listeners.splice(i--, 1)[0].cb(event);
                }
                catch (e) { }
            }
            else {
                try {
                    this.listeners[i].cb(event);
                }
                catch (e) { }
            }
        }
    };
    /**
     * Checks if the provided callback has been attached as an event handler.
     *
     * @param callback the handler which may be attached to the event.
     */
    SimpleEvent.prototype.has = function (callback) {
        return this.listeners.some(function (_a) {
            var cb = _a.cb;
            return cb == callback;
        });
    };
    return SimpleEvent;
}());
exports.SimpleEvent = SimpleEvent;
