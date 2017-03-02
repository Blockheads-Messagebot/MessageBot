/**
 * Class to manage saving and getting items from localStorage.
 */
export class Storage {
    namespace: string;

    constructor(namespace: string) {
        this.namespace = namespace;

        this.getString = this.getString.bind(this);
        this.getObject = this.getObject.bind(this);
        this.set = this.set.bind(this);
        this.clearNamespace = this.clearNamespace.bind(this);
    }

    /**
     * Gets a string from the storage if it exists and returns it, otherwise returns fallback.
     *
     * @example
     * var x = getString('stored_prefs', 'nothing');
     * var y = getString('stored_prefs', 'nothing', false);
     *
     * @param {string} key the key to retrieve.
     * @param {string} fallback what to return if the key was not found.
     * @param {bool} [local=true] whether or not to use a namespace when checking for the key.
     * @return {string}
     */
     getString(key: string, fallback: string, local: boolean = true): string {
        var result;
        if (local) {
            result = localStorage.getItem(`${key}${this.namespace}`);
        } else {
            result = localStorage.getItem(key);
        }

        return (result === null) ? fallback : result;
    }

    /**
     * Gets a stored object if it exists, otherwise returns fallback.
     *
     * @example
     * var x = getObject('stored_key', [1, 2, 3]);
     *
     * @param {string} key the item to retrieve.
     * @param {any} fallback what to return if the item does not exist or fails to parse correctly.
     * @param {bool} [local=true] whether or not a namespace should be used.
     * @return {any}
     */
    //tslint:disable-next-line:no-any
    getObject(key: string, fallback: any, local: boolean = true): any {
        var result = this.getString(key, '', local);

        if (!result) {
            return fallback;
        }

        try {
            result = JSON.parse(result);
        } catch(e) {
            result = fallback;
        } finally {
            if (result === null) {
                result = fallback;
            }
        }

        return result;
    }

    /**
     * Sets an object in the storage, stringifying it first if neccessary.
     *
     * @example
     * set('some_key', {a: [1, 2, 3], b: 'test'});
     * //returns '{"a":[1,2,3],"b":"test"}'
     * getString('some_key');
     * @param {string} key the item to overwrite or create.
     * @param {any} data any stringifyable type.
     * @param {boolean} [local=true] whether to save the item with a namespace.
     */
    //tslint:disable-next-line:no-any
    set(key: string, data: any, local: boolean = true): void {
        if (local) {
            key = `${key}${this.namespace}`;
        }

        if (typeof data == 'string') {
            localStorage.setItem(key, data);
        } else {
            localStorage.setItem(key, JSON.stringify(data));
        }
    }

    /**
     * Removes all items starting with namespace from the storage.
     *
     * @example
     * set('key_test', 1);
     * set('key_test2', 2);
     * clearNamespace('key_'); //both key_test and key_test2 have been removed.
     *
     * @param {string} namespace the prefix to check for when removing items.
     */
    clearNamespace(namespace: string): void {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(namespace)) {
                localStorage.removeItem(key);
            }
        });
    }
}
