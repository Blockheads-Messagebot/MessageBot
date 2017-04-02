import {WorldApi, WorldLists, WorldOverview, WorldSizes} from '../blockheads/types/world';
import {LogEntry} from '../blockheads/types/logs';

import {MacLogParser as LogParser} from './logparser';

const plist = require('simple-plist') as {
    readFile: (file: string, callback: (err: Error, data: Object) => void) => void,
    readFileSync: (file: string) => Object,
};

import {spawn} from 'child_process';
import * as fs from 'fs';
import * as request from 'request';

/** @hidden */
interface WorldV2 {
    creationDate: Date;
    saveDate: Date;
    worldName: string;
    worldSize: number;
    pvpDisabled: boolean;
    hostPort: string;
}

/**
 * This class is only used by the [[World]] class. You don't need to know anything about it unless you are creating new instances of the [[World]] class.
 */
export class MacApi implements WorldApi {
    /** @hidden */
    private path: string;
    /** @hidden */
    private worldv2: WorldV2;
    /** @hidden */
    private parser: LogParser;

    /**
     * Creates a new instance of the MacApi class.
     *
     * @param path the path to the world save folder.
     */
    constructor(path: string) {
        // Strip trailing slash if present
        this.path = path.replace(/\/$/, '');

        if ([
            fs.existsSync(path + '/worldv2'),
        ].some(exists => !exists)) {
            throw new Error("Invalid world path, missing worldv2 file.");
        }

        try {
            this.worldv2 = <WorldV2>plist.readFileSync(this.path + '/worldv2');
        } catch(err) {
            throw new Error("Unable to read worldv2 file. Likely not a world folder.");
        }

        this.parser = new LogParser(this.worldv2.worldName);
    }

    /**
     * @inheritdoc
     */
    getLists(): Promise<WorldLists> {
        return Promise.all([
            this.readText('adminlist'),
            this.readText('modlist'),
            this.readText('blacklist'),
            this.readText('whitelist'),
        ])
        .then((lists) => lists.map(list => list.splice(2))) //remove instructions
        .then(([adminlist, modlist, blacklist, whitelist]) => {
            return {adminlist, modlist, blacklist, whitelist};
        });
    }

    /**
     * @inheritdoc
     */
    getOverview(): Promise<WorldOverview> {
        let translateWorldSize = (size: number): WorldSizes => {
            switch (size) {
                case 512 * 1/16:
                    return '1/16x';
                case 512 * 1/4:
                    return '1/4x';
                case 512 * 1:
                    return '1x';
                case 512 * 4:
                    return '4x';
                case 512 * 16:
                    return '16x';
                default:
                    return '1x';
            }
        };

        return Promise.all([
            this.readText('whitelist'),
            new Promise(resolve => {
                request.get('https://api.ipify.org?format=json', {}, (_err, _req, body) => {
                    try {
                        let {ip} = JSON.parse(body);
                        resolve(ip ? ip : '0.0.0.0');
                    } catch(e) {
                        resolve('0.0.0.0');
                    }
                });
            })
        ]).then(([whitelist, ip]): WorldOverview => {
                return {
                    name: this.worldv2.worldName,
                    owner: 'SERVER',
                    created: this.worldv2.creationDate,
                    last_activity: this.worldv2.saveDate,
                    credit_until: new Date('12/30/9999'),
                    link: `http://theblockheads.net/join.php?ip=${ip}&port=${this.worldv2.hostPort}&name=${this.worldv2.worldName}`,
                    pvp: !this.worldv2.pvpDisabled,
                    privacy: 'private',
                    size: translateWorldSize(this.worldv2.worldSize),
                    password: false,
                    whitelist: !whitelist.length,
                    online: [],
                };
        });
    }

    /**
     * @inheritdoc
     */
    getLogs(): Promise<LogEntry[]> {
        return this.readText('logs')
            .then(this.parser.parse);
    }
    /**
     * @inheritdoc
     */
    send(message: string): void {
        spawn("osascript", [
            '-l', 'JavaScript',
            __dirname + '/send.scpt',
            this.worldv2.worldName,
            message
        ]);
    }

    /**
     * Gets the specified list for the world.
     *
     * @hidden
     * @param file the file to read
     */
    private readText(file: string): Promise<string[]> {
        return new Promise(resolve => {
            fs.readFile(this.path + `/${file}.txt`, 'utf8', (err, data) => {
                if (err) {
                    resolve([]);
                }

                resolve(data.split('\n'));
            });
        });
    }
}
