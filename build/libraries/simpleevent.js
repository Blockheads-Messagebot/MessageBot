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
        var _this = this;
        /**
         * Subscribes to the event, whenever it is fired, the passed callback will be called with the event args.
         *
         * @param callback the handler to add.
         */
        this.subscribe = function (callback) {
            if (!_this.has(callback)) {
                _this.listeners.push({ cb: callback, once: false });
            }
        };
        /**
         * Subscribes to the event, whenever it is fired, the passed callback will be called with the event args.
         * This method is an alias of the subscribe method.
         *
         * @param callback the handler to add.
         */
        this.sub = function (callback) {
            _this.subscribe(callback);
        };
        /**
         * Registers an event handler that will only be called once.
         *
         * @param callback the handler to add.
         */
        this.once = function (callback) {
            if (!_this.has(callback)) {
                _this.listeners.push({ cb: callback, once: true });
            }
        };
        /**
         * Removes an event handler, if it is attached to the event.
         *
         * @param callback the callback to remove as a handler.
         */
        this.unsubscribe = function (callback) {
            for (var i = 0; i < _this.listeners.length; i++) {
                if (_this.listeners[i].cb == callback) {
                    _this.listeners.splice(i, 1);
                    break;
                }
            }
        };
        /**
         * Removes an event handler, if it is attached to the event. This method is an alias of the unsubscribe method.
         *
         * @param callback the callback to remove as a handler.
         */
        this.unsub = function (callback) {
            _this.unsubscribe(callback);
        };
        /**
         * Fires the event, calling all handlers.
         *
         * @param event the arguments to be passed to the handlers.
         */
        this.dispatch = function (event) {
            var len = _this.listeners.length;
            for (var i = 0; i < len; i++) {
                if (_this.listeners[i].once) {
                    try {
                        len--;
                        _this.listeners.splice(i--, 1)[0].cb(event);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                else {
                    try {
                        _this.listeners[i].cb(event);
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            }
        };
        /**
         * Checks if the provided callback has been attached as an event handler.
         *
         * @param callback the handler which may be attached to the event.
         */
        this.has = function (callback) {
            return _this.listeners.some(function (_a) {
                var cb = _a.cb;
                return cb == callback;
            });
        };
        this.listeners = [];
    }
    return SimpleEvent;
}());
exports.SimpleEvent = SimpleEvent;
