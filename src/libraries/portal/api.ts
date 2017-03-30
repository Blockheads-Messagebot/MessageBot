import {Ajax as ajax} from '../ajax';
import {WorldLists, WorldOverview, WorldPrivacy, WorldSizes, WorldApi} from '../blockheads/types/world';
import {LogEntry} from '../blockheads/types/logs';
import {PortalLogParser as LogParser} from './logparser';


/**
 * This class is only used by the [[World]] class. Unless you are creating new instances of the [[World]] class, you probably don't need to know anything about this class.
 *
 */
export class PortalApi implements WorldApi {
    /** @hidden */
    private worldId: number;
    /** @hidden */
    private messageQueue: string[];
    /** @hidden */
    private logParser: LogParser;

    /**
     * Creates a new instance of the class.
     *
     * @param worldId the worldId to use when communicating with the server.
     */
    constructor(worldId: number) {
        this.worldId = worldId;
        this.messageQueue = [];

        this.logParser = new LogParser();

        this.postMessage = this.postMessage.bind(this);
        this.postMessage();
    }

    /**
     * @inheritdoc
     */
    getLists(): Promise<WorldLists> {
        return this.worldOnline()
            .then(() => ajax.get(`/worlds/lists/${this.worldId}`))
            .then((html: string) => {
                let doc = (new DOMParser()).parseFromString(html, 'text/html');

                function getList(name: string): string[] {
                    let list = (<HTMLTextAreaElement>doc.querySelector(`textarea[name="${name}"]`));
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
                    if (match) return match[1];
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
    getOverview(): Promise<WorldOverview> {
        return ajax.get(`/worlds/${this.worldId}`)
            .then(html => {
                let doc = (new DOMParser()).parseFromString(html, 'text/html');
                let text = (selector: string): string => {
                    let el = doc.querySelector(selector);
                    return el && el.textContent ? el.textContent : '';
                };

                let temp = text('#main > div > script:last-child').match(/\$\('#privacy'\)\.val\('(.*)'\)/);
                let privacy: WorldPrivacy;
                if (temp) {
                    privacy = (<WorldPrivacy>temp[1]);
                } else {
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
                    size: (<WorldSizes>text('tr:nth-of-type(7) > td:nth-of-type(4)')),
                    whitelist: text('tr:nth-of-type(8) > td:nth-of-type(4)') == 'Yes',

                    online: [],
                };
            });
    }

    /**
     * @inheritdoc
     */
    getLogs(): Promise<LogEntry[]> {
        return this.worldOnline()
            .then(() => ajax.get(`/worlds/logs/${this.worldId}`))
            .then(logs => logs.split('\n'))
            .then(this.logParser.parse);
    }

    /**
     * @inheritdoc
     */
    send(message: string): void {
        this.messageQueue.push(message);
    }

    /**
     * Waits until the world is online before resolving.
     *
     * @hidden
     */
    private worldOnline(): Promise<void> {
        return ajax.postJSON(`/api`, {command: 'status', worldId: this.worldId})
            .then((response: {status: string, worldStatus: string}) => {
                if (response.status != 'ok') {
                    throw new Error('Api error');
                }

                if (response.worldStatus != 'online') {
                    ajax.postJSON(`/api`, {command: 'start', worldId: this.worldId})
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
    private postMessage(): void {
        if (this.messageQueue.length) {
            ajax.postJSON(`/api`, {command: 'send', worldId: this.worldId, message: <string>this.messageQueue.shift()})
                .then(response => {
                    setTimeout(this.postMessage, 500);
                }, () => {
                    setTimeout(this.postMessage, 1000);
                });
        } else {
            setTimeout(this.postMessage, 500);
        }
    }
}
