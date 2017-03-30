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
            let doc = (new DOMParser()).parseFromString(html, 'text/html');
            function getList(name) {
                let list = doc.querySelector(`textarea[name="${name}"]`);
                if (list) {
                    let names = list.value.toLocaleUpperCase().split('\n');
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
                .filter(name => lists.adminlist.indexOf(name) == -1 && lists.modlist.indexOf(name) == -1);
            return lists;
        });
    }
    /**
     * @inheritdoc
     */
    getOverview() {
        return ajax_1.Ajax.get(`/worlds/${this.worldId}`)
            .then(html => {
            let doc = (new DOMParser()).parseFromString(html, 'text/html');
            let text = (selector) => {
                let el = doc.querySelector(selector);
                return el && el.textContent ? el.textContent : '';
            };
            let temp = text('#main > div > script:last-child').match(/\$\('#privacy'\)\.val\('(.*)'\)/);
            let privacy;
            if (temp) {
                privacy = temp[1];
            }
            else {
                privacy = 'public';
            }
            // This is very messy, refactoring welcome.
            return {
                name: text('#title'),
                owner: text('.details.manager > tbody > tr:nth-of-type(3) > td:nth-of-type(2)'),
                created: new Date(text('.details.manager > tbody > tr:nth-of-type(4) > td:nth-of-type(2)') + ' GMT-0000'),
                last_activity: new Date(text('.details.manager > tbody > tr:nth-of-type(6) > td:nth-of-type(2)') + ' GMT-0000'),
                credit_until: new Date(text('.details.manager > tbody > tr:nth-of-type(7) > td:nth-of-type(2)') + ' GMT-0000'),
                link: text('.details.manager > tbody > tr:nth-of-type(8) > td:nth-of-type(2)'),
                pvp: text('#main > div > script:last-child').includes('#pvp'),
                privacy,
                password: text('tr:nth-of-type(6) > td:nth-of-type(4)') == 'Yes',
                size: text('tr:nth-of-type(7) > td:nth-of-type(4)'),
                whitelist: text('tr:nth-of-type(8) > td:nth-of-type(4)') == 'Yes',
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
            ajax_1.Ajax.postJSON(`/api`, { command: 'send', worldId: this.worldId, message: this.messageQueue.shift() })
                .then(response => {
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
