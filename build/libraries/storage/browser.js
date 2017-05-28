"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @inheritdoc
 */
var Storage = (function () {
    /**
     * Creates a new storage class, should not be used by extensions.
     */
    function Storage(namespace) {
        var _this = this;
        /**
         * @inheritdoc
         */
        this.getString = function (key, fallback, local) {
            if (local === void 0) { local = true; }
            var result;
            if (local) {
                result = localStorage.getItem("" + key + _this.namespace);
            }
            else {
                result = localStorage.getItem(key);
            }
            return (result === null) ? fallback : result;
        };
        /**
         * @inheritdoc
         */
        this.getObject = function (key, fallback, local) {
            var raw = _this.getString(key, '', local);
            if (!raw) {
                return fallback;
            }
            var result;
            try {
                result = JSON.parse(raw);
            }
            catch (e) {
                result = fallback;
            }
            if (!result) {
                result = fallback;
            }
            return result;
        };
        /**
         * @inheritdoc
         */
        this.set = function (key, data, local) {
            if (local === void 0) { local = true; }
            if (local) {
                key = "" + key + _this.namespace;
            }
            if (typeof data == 'string') {
                localStorage.setItem(key, data);
            }
            else {
                localStorage.setItem(key, JSON.stringify(data));
            }
        };
        /**
         * @inheritdoc
         */
        this.clearNamespace = function (namespace) {
            var remove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && key.startsWith(namespace)) {
                    remove.push(key);
                }
            }
            remove.forEach(function (key) { return localStorage.removeItem(key); });
        };
        /**
         * @inheritdoc
         */
        this.migrate = function (key, actor) {
            var keys = [];
            for (var i = 0; i < localStorage.length; i++) {
                var lsKey = localStorage.key(i);
                if (lsKey && lsKey.startsWith(key)) {
                    keys.push(lsKey);
                }
            }
            keys.forEach(function (lsKey) {
                var old = _this.getObject(lsKey, {}, false);
                var updated = actor(old);
                _this.set(lsKey, updated, false);
            });
        };
        this.namespace = String(namespace);
    }
    return Storage;
}());
exports.Storage = Storage;
