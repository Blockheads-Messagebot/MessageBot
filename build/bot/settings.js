"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Convenience class to make saving settings easier.
 */
class Settings {
    /**
     * Creates a new instance of the Settings class.
     *
     * @param storage the storage instance to save settings in.
     * @param prefix the prefix to save settings with.
     */
    constructor(storage, prefix) {
        /** @hidden */
        this.STORAGE_ID = 'mb_preferences';
        this.storage = storage;
        this._prefix = prefix || '';
    }
    /**
     * Gets a setting from storage, returns the fallback if the setting has not been saved.
     *
     * @param key the setting name
     * @param fallback what to return if the key wasn't found or was the wrong type.
     */
    get(key, fallback) {
        let items = this.storage.getObject(this.STORAGE_ID, {});
        if (typeof fallback == typeof items[this._prefix + key]) {
            return items[key];
        }
        return fallback;
    }
    /**
     * Saves a setting for future use.
     *
     * @param key the setting name to save
     * @param pref what to save.
     */
    set(key, pref) {
        let items = this.storage.getObject(this.STORAGE_ID, {});
        items[this._prefix + key] = pref;
        this.storage.set(this.STORAGE_ID, items);
    }
    /**
     * Removes a setting key, if it exists.
     *
     * @param key the setting name to remove.
     */
    remove(key) {
        let items = this.storage.getObject(this.STORAGE_ID, {});
        delete items[this._prefix + key];
        this.storage.set(this.STORAGE_ID, items);
    }
    /**
     * Removes all settings under a prefix, if set, or all settings.
     */
    removeAll() {
        let items = this.storage.getObject(this.STORAGE_ID, {});
        Object.keys(items).forEach(key => {
            if (key.startsWith(this._prefix)) {
                delete items[key];
            }
        });
        this.storage.set(this.STORAGE_ID, items);
    }
    /**
     * Creates a new instance of the class, with a prefixed name.
     *
     * @param prefix the prefix to save settings with.
     */
    prefix(prefix) {
        return new Settings(this.storage, this._prefix + prefix);
    }
}
exports.Settings = Settings;
