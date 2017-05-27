/**
 * Storage class which manages saving and retrieving data between bot launches.
 * Extensions can access this class through ex.world.storage.
 */
export interface IStorage {
    /**
     * Gets a string from the storage if it exists and returns it, otherwise returns fallback.
     *
     * @example
     * var x = getString('stored_prefs', 'nothing');
     * var y = getString('stored_prefs', 'nothing', false);
     *
     * @param key the key to retrieve.
     * @param fallback what to return if the key was not found.
     * @param local whether or not to use a namespace when checking for the key. Defaults to true.
     */
    getString: (key: string, fallback: string, local?: boolean) => string;
    /**
     * Gets a stored object if it exists, otherwise returns fallback.
     *
     * @example
     * var x = getObject('stored_key', [1, 2, 3]);
     *
     * @param key the item to retrieve.
     * @param fallback what to return if the item does not exist or fails to parse correctly.
     * @param local whether or not a namespace should be used. Default: true
     * @return the retrieved object, if it exists and can be parsed into a compatible format.
     */
    getObject: <T>(key: string, fallback: T, local?: boolean) => T;
    /**
     * Sets an object in the storage, stringifying it first if necessary.
     *
     * @example
     * set('some_key', {a: [1, 2, 3], b: 'test'});
     * //returns '{"a":[1,2,3],"b":"test"}'
     * getString('some_key');
     * @param key the item to overwrite or create.
     * @param data any stringifyable type.
     * @param local whether to save the item with a namespace. Defaults to true.
     */
    set: (key: string, data: any, local?: boolean) => void;
    /**
     * Removes all items starting with namespace from the storage.
     *
     * @example
     * set('key+test', 1);
     * set('key+test2', 2);
     * clearNamespace('key+'); //both key+test and key+test2 have been removed.
     *
     * @param namespace the prefix to check for when removing items.
     */
    clearNamespace: (namespace: string) => void;
    /**
     * Runs the migration function on all storage items that match the passed key. getObject will be used to parse the stored data.
     *
     * @param key the key to match
     * @param actor the function to call on all found data.
     */
    migrate: <T>(key: string, actor: (found: T) => T) => void;
}
