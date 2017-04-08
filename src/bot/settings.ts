import {Storage} from '../libraries/storage';

/**
 * Convenience class to make saving settings easier.
 */
export class Settings {
    /** @hidden */
    private STORAGE_ID = 'mb_preferences';

    /** @hidden */
    private storage: Storage;

    /** @hidden */
    private _prefix: string;

    /**
     * Creates a new instance of the Settings class.
     *
     * @param storage the storage instance to save settings in.
     * @param prefix the prefix to save settings with.
     */
    constructor(storage: Storage, prefix?: string) {
        this.storage = storage;
        this._prefix = prefix || '';
    }

    /**
     * Gets a setting from storage, returns the fallback if the setting has not been saved.
     *
     * @param key the setting name
     * @param fallback what to return if the key wasn't found or was the wrong type.
     */
    get<T extends string | number | boolean>(key: string, fallback: T): T {
        let items = this.storage.getObject(this.STORAGE_ID, {}) as {[key: string]: T};

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
    set(key: string, pref: string | number | boolean) {
        let items = this.storage.getObject(this.STORAGE_ID, {}) as {[key: string]: string | number | boolean};

        items[this._prefix + key] = pref;
        this.storage.set(this.STORAGE_ID, items);
    }

    /**
     * Removes a setting key, if it exists.
     *
     * @param key the setting name to remove.
     */
    remove(key: string) {
        let items = this.storage.getObject(this.STORAGE_ID, {}) as {[key: string]: string | number | boolean};

        delete items[this._prefix + key];
        this.storage.set(this.STORAGE_ID, items);
    }

    /**
     * Removes all settings under a prefix, if set, or all settings.
     */
    removeAll() {
        let items = this.storage.getObject(this.STORAGE_ID, {}) as {[key: string]: string | number | boolean};

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
    prefix(prefix: string): Settings {
        return new Settings(this.storage, this._prefix + prefix);
    }
}
