/**
 * The storage class used by the [[MessageBot]] class and all [[MessageBotExtension]] instances.
 * It is expected that the
 */
export interface IStorage {
    /**
     * Gets the specified key from the storage, if the key has not been set, returns the fallback.
     * Note that though this is typed as the type of the fallback being returned, a deep comparison will not be used.
     * You must validate your own objects.
     *
     * @param key the key to get
     * @param fallback if the key was not set, this will be returned.
     * @returns the stored value for the key.
     */
    get<T>(key: string, fallback: T): T
    /**
     * Sets the specified key in the storage, overwriting any current data.
     *
     * @param key the key to set
     * @param value the value to set in the storage.
     */
    set(key: string, value: any): void
    /**
     * Clears all keys using the current prefix, or the current prefix and the additional prefix if supplied.
     *
     * @param prefix the prefix to limit clearing to
     */
    clear(prefix?: string): void
    /**
     * Creates a new instance of this class with the current prefix and the additional prefix supplied.
     */
    prefix(prefix: string): IStorage
}