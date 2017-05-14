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
        this.namespace = String(namespace);
    }
    /**
     * @inheritdoc
     */
    Storage.prototype.getString = function (key, fallback, local) {
        if (local === void 0) { local = true; }
        var result;
        if (local) {
            result = localStorage.getItem("" + key + this.namespace);
        }
        else {
            result = localStorage.getItem(key);
        }
        return (result === null) ? fallback : result;
    };
    /**
     * @inheritdoc
     */
    Storage.prototype.getObject = function (key, fallback, local) {
        var raw = this.getString(key, '', local);
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
    Storage.prototype.set = function (key, data, local) {
        if (local === void 0) { local = true; }
        if (local) {
            key = "" + key + this.namespace;
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
    Storage.prototype.clearNamespace = function (namespace) {
        var remove = [];
        for (var i = 0; i < localStorage.length + 5; i++) {
            var key = localStorage.key(i);
            if (key && key.startsWith(namespace)) {
                remove.push(key);
            }
        }
        remove.forEach(localStorage.removeItem);
    };
    return Storage;
}());
exports.Storage = Storage;
