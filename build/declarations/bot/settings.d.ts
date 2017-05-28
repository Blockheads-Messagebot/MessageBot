import { Storage } from '../libraries/storage';
/**
 * Convenience class to make saving settings easier.
 */
export declare class Settings {
    private STORAGE_ID;
    private storage;
    private _prefix;
    /**
     * Creates a new instance of the Settings class. Extensions shouldn't need to use this as it is provided through ex.storage.
     *
     * @param storage the storage instance to save settings in.
     * @param prefix the prefix to save settings with.
     */
    constructor(storage: Storage, prefix?: string);
    /**
     * Gets a setting from storage, returns the fallback if the setting has not been saved.
     *
     * @param key the setting name
     * @param fallback what to return if the key wasn't found or was the wrong type.
     */
    get: <T extends string | number | boolean>(key: string, fallback: T) => T;
    /**
     * Saves a setting for future use.
     *
     * @param key the setting name to save
     * @param pref what to save.
     */
    set: (key: string, pref: string | number | boolean) => void;
    /**
     * Removes a setting key, if it exists.
     *
     * @param key the setting name to remove.
     */
    remove: (key: string) => void;
    /**
     * Removes all settings under a prefix, if set, or all settings.
     */
    removeAll: () => void;
    /**
     * Creates a new instance of the class, with a prefixed name.
     *
     * @param prefix the prefix to save settings with.
     */
    prefix: (prefix: string) => Settings;
}
