"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logparser_1 = require("./logparser");
const plist = require('simple-plist');
const child_process_1 = require("child_process");
const fs = require("fs");
const request = require("request");
/**
 * This class is only used by the [[World]] class. You don't need to know anything about it unless you are creating new instances of the [[World]] class.
 */
class MacApi {
    /**
     * Creates a new instance of the MacApi class.
     *
     * @param path the path to the world save folder.
     */
    constructor(path) {
        // Strip trailing slash if present
        this.path = path.replace(/\/$/, '');
        if ([
            fs.existsSync(path + '/worldv2'),
        ].some(exists => !exists)) {
            throw new Error("Invalid world path, missing worldv2 file.");
        }
        try {
            this.worldv2 = plist.readFileSync(this.path + '/worldv2');
        }
        catch (err) {
            throw new Error("Unable to read worldv2 file. Likely not a world folder.");
        }
        this.parser = new logparser_1.MacLogParser(this.worldv2.worldName);
    }
    /**
     * @inheritdoc
     */
    getLists() {
        return Promise.all([
            this.readText('adminlist'),
            this.readText('modlist'),
            this.readText('blacklist'),
            this.readText('whitelist'),
        ])
            .then((lists) => lists.map(list => list.splice(2))) //remove instructions
            .then(([adminlist, modlist, blacklist, whitelist]) => {
            return { adminlist, modlist, blacklist, whitelist };
        });
    }
    /**
     * @inheritdoc
     */
    getOverview() {
        let translateWorldSize = (size) => {
            switch (size) {
                case 512 * 1 / 16:
                    return '1/16x';
                case 512 * 1 / 4:
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
                        let { ip } = JSON.parse(body);
                        resolve(ip ? ip : '0.0.0.0');
                    }
                    catch (e) {
                        resolve('0.0.0.0');
                    }
                });
            })
        ]).then(([whitelist, ip]) => {
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
    getLogs() {
        return this.readText('logs')
            .then(this.parser.parse);
    }
    /**
     * @inheritdoc
     */
    send(message) {
        child_process_1.spawn("osascript", [
            '-l', 'JavaScript',
            __dirname + '/send.scpt',
            this.worldv2.worldName,
            message
        ]);
    }
    /**
     * Gets the specified list for the world.
     *
     * @param file the file to read
     */
    readText(file) {
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
exports.MacApi = MacApi;
