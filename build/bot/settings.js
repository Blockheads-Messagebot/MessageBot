"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Convenience class to make saving settings easier.
 */
var Settings = (function () {
    /**
     * Creates a new instance of the Settings class. Extensions shouldn't need to use this as it is provided through ex.storage.
     *
     * @param storage the storage instance to save settings in.
     * @param prefix the prefix to save settings with.
     */
    function Settings(storage, prefix) {
        var _this = this;
        this.STORAGE_ID = 'mb_preferences';
        /**
         * Gets a setting from storage, returns the fallback if the setting has not been saved.
         *
         * @param key the setting name
         * @param fallback what to return if the key wasn't found or was the wrong type.
         */
        this.get = function (key, fallback) {
            var items = _this.storage.getObject(_this.STORAGE_ID, {});
            if (typeof fallback == typeof items[_this._prefix + key]) {
                return items[key];
            }
            return fallback;
        };
        /**
         * Saves a setting for future use.
         *
         * @param key the setting name to save
         * @param pref what to save.
         */
        this.set = function (key, pref) {
            var items = _this.storage.getObject(_this.STORAGE_ID, {});
            items[_this._prefix + key] = pref;
            _this.storage.set(_this.STORAGE_ID, items);
        };
        /**
         * Removes a setting key, if it exists.
         *
         * @param key the setting name to remove.
         */
        this.remove = function (key) {
            var items = _this.storage.getObject(_this.STORAGE_ID, {});
            delete items[_this._prefix + key];
            _this.storage.set(_this.STORAGE_ID, items);
        };
        /**
         * Removes all settings under a prefix, if set, or all settings.
         */
        this.removeAll = function () {
            var items = _this.storage.getObject(_this.STORAGE_ID, {});
            Object.keys(items).forEach(function (key) {
                if (key.startsWith(_this._prefix)) {
                    delete items[key];
                }
            });
            _this.storage.set(_this.STORAGE_ID, items);
        };
        /**
         * Creates a new instance of the class, with a prefixed name.
         *
         * @param prefix the prefix to save settings with.
         */
        this.prefix = function (prefix) {
            return new Settings(_this.storage, _this._prefix + "/" + prefix);
        };
        this.storage = storage;
        this._prefix = prefix || '';
    }
    return Settings;
}());
exports.Settings = Settings;
