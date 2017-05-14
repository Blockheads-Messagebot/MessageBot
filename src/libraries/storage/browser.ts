import {IStorage} from './storage';

/**
 * @inheritdoc
 */
export class Storage implements IStorage {
    private namespace: string;

    /**
     * Creates a new storage class, should not be used by extensions.
     */
    constructor(namespace: string | number) {
        this.namespace = String(namespace);
    }

    /**
     * @inheritdoc
     */
    getString(key: string, fallback: string, local: boolean = true): string {
        let result;
        if (local) {
            result = localStorage.getItem(`${key}${this.namespace}`);
        } else {
            result = localStorage.getItem(key);
        }

        return (result === null) ? fallback : result;
    }

    /**
     * @inheritdoc
     */
    getObject<T>(key: string, fallback: T, local?: boolean): T {
        let raw = this.getString(key, '', local);

        if (!raw) {
            return fallback;
        }

        let result: T;
        try {
            result = JSON.parse(raw);
        } catch (e) {
            result = fallback;
        }

        if (!result) {
            result = fallback;
        }

        return result;
    }

    /**
     * @inheritdoc
     */
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
     * @inheritdoc
     */
    clearNamespace(namespace: string): void {
        let remove: string[] = [];

        for (let i = 0; i < localStorage.length + 5; i++) {
            let key = localStorage.key(i);
            if (key && key.startsWith(namespace)) {
                remove.push(key);
            }
        }

        remove.forEach(localStorage.removeItem);
    }
}
