"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ajax_1 = require("../ajax");
const logparser_1 = require("./logparser");
/**
 * This class is only used by the [[World]] class. Unless you are creating new instances of the [[World]] class, you probably don't need to know anything about this class.
 *
 */
class PortalApi {
    /**
     * Creates a new instance of the class.
     *
     * @param worldId the worldId to use when communicating with the server.
     */
    constructor(worldId) {
        this.worldId = worldId;
        this.messageQueue = [];
        this.logParser = new logparser_1.PortalLogParser();
        this.postMessage = this.postMessage.bind(this);
        this.postMessage();
    }
    /**
     * @inheritdoc
     */
    getLists() {
        return this.worldOnline()
            .then(() => ajax_1.Ajax.get(`/worlds/lists/${this.worldId}`))
            .then((html) => {
            function getList(name) {
                let list = html.match(new RegExp(`<textarea name="${name}">([\\s\\S]*?)</textarea>`));
                if (list) {
                    let temp = list[1].replace(/(&.*?;)/g, function (_match, first) {
                        let map = {
                            '&lt;': '<',
                            '&gt;': '>',
                            '&amp;': '&',
                            '&#39;': '\''
                        }; //It seems these are the only escaped characters.
                        return map[first] || '';
                    });
                    let names = temp.toLocaleUpperCase().split('\n');
                    return [...new Set(names)]; // Remove duplicates
                }
                return []; // World offline, just to be safe.
            }
            let lists = {
                adminlist: getList('admins'),
                modlist: getList('modlist'),
                whitelist: getList('whitelist'),
                blacklist: getList('blacklist'),
            };
            // Remove device IDs
            lists.blacklist = lists.blacklist.map(name => {
                let match = name.match(/(.*)(?:\\.{32})/);
                if (match)
                    return match[1];
                return name;
            });
            // Remove blacklisted staff
            lists.blacklist = lists.blacklist
                .filter(name => !lists.adminlist.includes(name) && lists.modlist.includes(name));
            return lists;
        });
    }
    /**
     * @inheritdoc
     */
    getOverview() {
        return ajax_1.Ajax.get(`/worlds/${this.worldId}`)
            .then(html => {
            let firstMatch = (r) => {
                let m = html.match(r);
                return m ? m[1] : '';
            };
            let temp = html.match(/^\$\('#privacy'\).val\('(.*?)'\)/m);
            let privacy;
            if (temp) {
                privacy = temp[1];
            }
            else {
                privacy = 'public';
            }
            // This is very messy, refactoring welcome.
            return {
                name: firstMatch(/^\t<title>(.*?) Manager \| Portal<\/title>$/m),
                owner: firstMatch(/^\t\t<td class="right">Owner:<\/td>\r?\n\t\t<td>(.*?)<\/td>$/m),
                created: new Date(firstMatch(/^\t\t<td>Created:<\/td><td>(.*?)<\/td>$/m) + ' GMT-0000'),
                last_activity: new Date(firstMatch(/^\t\t<td>Last Activity:<\/td><td>(.*?)<\/td>$/m) + ' GMT-0000'),
                credit_until: new Date(firstMatch(/^\t\t<td>Credit Until:<\/td><td>(.*?)<\/td>$/m) + ' GMT-0000'),
                link: firstMatch(/^\t<tr><td>Link:<\/td><td><a href="(.*)">\1<\/a>/m),
                pvp: !!firstMatch(/^\$\('#pvp'\)\./m),
                privacy,
                password: firstMatch(/^\t\t<td>Password:<\/td><td>(Yes|No)<\/td><\/tr>$/m) == 'Yes',
                size: firstMatch(/^\t\t<td>Size:<\/td><td>(.*?)<\/td>$/m),
                whitelist: firstMatch(/<td>Whitelist:<\/td><td>(Yes|No)<\/td>/m) == 'Yes',
                online: [],
            };
        });
    }
    /**
     * @inheritdoc
     */
    getLogs() {
        return this.worldOnline()
            .then(() => ajax_1.Ajax.get(`/worlds/logs/${this.worldId}`))
            .then(logs => logs.split('\n'))
            .then(this.logParser.parse);
    }
    /**
     * @inheritdoc
     */
    send(message) {
        this.messageQueue.push(message);
    }
    /**
     * Waits until the world is online before resolving.
     *
     * @hidden
     */
    worldOnline() {
        return ajax_1.Ajax.postJSON(`/api`, { command: 'status', worldId: this.worldId })
            .then((response) => {
            if (response.status != 'ok') {
                throw new Error('Api error');
            }
            if (response.worldStatus != 'online') {
                ajax_1.Ajax.postJSON(`/api`, { command: 'start', worldId: this.worldId })
                    .catch(console.error);
                throw new Error('World should be online');
            }
        })
            .catch(() => this.worldOnline());
    }
    /**
     * Sends the oldest queued message if possible.
     *
     * @hidden
     */
    postMessage() {
        if (this.messageQueue.length) {
            ajax_1.Ajax.postJSON(`/api`, {
                command: 'send',
                worldId: this.worldId,
                message: this.messageQueue.shift()
            })
                .then(() => {
                setTimeout(this.postMessage, 500);
            }, () => {
                setTimeout(this.postMessage, 1000);
            });
        }
        else {
            setTimeout(this.postMessage, 500);
        }
    }
}
exports.PortalApi = PortalApi;
