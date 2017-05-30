import {IStorage} from './storage';

export { IStorage };

import * as fs from 'fs';
import * as path from 'path';

let fileStorage = new Map<string, string>();

const jsonPath = path.join(__dirname, '..', '..', '..', 'config', 'localStorage.json');

// Import from the config if it exists
if (fs.existsSync(jsonPath)) {

    let parsed: {[key: string]: string};
    try {
        let json = fs.readFileSync(jsonPath, 'utf8');
        parsed = JSON.parse(json);

        if (parsed) { // Could be null
            for (let key of Object.keys(parsed)) {
                fileStorage.set(key, parsed[key]);
            }
        }
    } catch(e) {
        console.error('Error importing localStorage.json', e);
    }
}

let lastSave = Date.now();
let lastChange = 0;

// Write at most every 30 seconds
setInterval(() => {
    if (lastChange > lastSave) {
        lastSave = Date.now();
        let objMap: {[key: string]: string}= {};

        for (let [key, value] of fileStorage.entries()) {
            objMap[key] = value;
        }

        try {
            fs.writeFileSync(jsonPath, JSON.stringify(objMap), 'utf8');
        } catch(e) {
            console.error('Failed to save config', e);
        }
    }
}, 30 * 1000);

/**
 * @inheritdoc
 */
export class Storage implements IStorage {
    private namespace: string;

    /**
     * Creates a new instance of the storage class, should not be used by extensions.
     */
    constructor(namespace: string | number) {
        this.namespace = String(namespace);
    }

    /**
     * @inheritdoc
     */
    getString = (key: string, fallback: string, local: boolean = true): string => {
        let result;
        if (local) {
            result = fileStorage.get(`${key}${this.namespace}`);
        } else {
            result = fileStorage.get(key);
        }

        return (result == null) ? fallback : result;
    }

    /**
     * @inheritdoc
     */
    getObject = <T>(key: string, fallback: T, local?: boolean): T => {
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
    set = (key: string, data: any, local: boolean = true): void => {
        if (local) {
            key = `${key}${this.namespace}`;
        }

        if (typeof data == 'string') {
            fileStorage.set(key, data);
        } else {
            fileStorage.set(key, JSON.stringify(data));
        }
        lastChange = Date.now();
    }

    /**
     * @inheritdoc
     */
    clearNamespace = (namespace: string): void => {
        let toDelete: string[] = [];

        for (let key of fileStorage.keys()) {
            if (key.startsWith(namespace)) {
                toDelete.push(key);
            }
        }

        toDelete.forEach(fileStorage.delete);

        lastChange = Date.now();
    }

    /**
     * @inheritdoc
     */
    migrate = <T>(key: string, actor: (found: T) => T): void => {
        let keys: string[] = [];

        for (let sKey of fileStorage.keys()) {
            if (sKey.startsWith(key)) {
                keys.push(sKey);
            }
        }

        keys.forEach(key => {
            this.set(key, actor(this.getObject(key, {} as T, false)), false);
        });

        lastChange = Date.now();
    }
}
