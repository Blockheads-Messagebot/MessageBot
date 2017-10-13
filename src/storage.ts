/**
 * The storage class used by the [[MessageBot]] class and all [[MessageBotExtension]] instances.
 * It is expected that the
 */
export abstract class Storage {
    /**
     * Gets the specified key from the storage, if the key has not been set, returns the fallback.
     * Note that though this is typed as the type of the fallback being returned, a deep comparison will not be used.
     * You must validate your own objects.
     *
     * @param key the key to get
     * @param fallback if the key was not set, this will be returned.
     * @returns the stored value for the key.
     */
    abstract get<T>(key: string, fallback: T): T

    /**
     * Sets the specified key in the storage, overwriting any current data.
     *
     * @param key the key to set
     * @param value the value to set in the storage.
     */
    abstract set(key: string, value: any): void

    /**
     * Clears all keys using the current prefix, or the current prefix and the additional prefix if supplied.
     *
     * @param prefix the prefix to limit clearing to
     */
    abstract clear(prefix?: string): void

    /**
     * Creates a new instance of this class with the current prefix and the additional prefix supplied.
     */
    abstract prefix(prefix: string): Storage

    /**
     * Utility method to use and automatically save a key
     * @param key the key use when getting and setting the value
     * @param fallback the fallback if the key doesn't exist
     * @param callback the function to be called with the data, must return the value to be saved
     */
    with<T>(key: string, fallback: T, callback: (value: T) => T | void): void {
        let value = this.get(key, fallback)
        let result = callback(value)
        this.set(key, result == null ? value : result)
    }
}