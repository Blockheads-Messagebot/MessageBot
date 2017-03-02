// This file could use cleaning up, right now it seems that it is handling too much.
// Sure, it works, but 300 lines is a lot for a class.

//ISSUE: Depends on bot, but bot depends on world.

import * as api from 'libraries/blockheads';
import {storage, hook} from 'bot';

const STORAGE = {
    PLAYERS: 'mb_players',
    LOG_LOAD: 'mb_lastLogLoad',
};

interface Player {
    joins: number;
    ip: string;
    ips: string[];
};

interface PlayerLists {
    admin: string[];
    mod: string[];
    staff: string[];
    white: string[];
    black: string[];
}


/**
 * World
 */
export class World {
    private name: string;
    private online: string[];
    private owner: string;
    private players: {[name: string]: Player};
    private lists: PlayerLists;

    constructor() {
        this.name = '';
        this.online = [];
        this.owner = '';
        this.players = storage.getObject(STORAGE.PLAYERS, {});
        this.lists = {admin: [], mod: [], staff: [], black: [], white: []};

        // Keep the online list up to date
        hook.on('world.join', (name: string) => {
            if (!this.online.includes(name)) {
                this.online.push(name);
            }
        });
        hook.on('world.leave', (name: string) => {
            if (this.online.includes(name)) {
                this.online.splice(this.online.indexOf(name), 1);
            }
        });

        // Keep players list up to date
        hook.on('world.join', this.checkPlayerJoin.bind(this));

        // Keep lists up to date
        hook.on('world.command', this.updateLists.bind(this));

        // Build lists
        Promise.all([api.getLists(), api.getWorldName(), api.getOwnerName()])
            .then(([lists, wname, owner]: [PlayerLists, string, string]) => {
                this.lists = lists;
                this.buildStaffList();
                this.name = wname;
                this.owner = owner;
            })
            .catch(console.error);

        // Update players since last bot load
        Promise.all([api.getLogs(), api.getWorldName()])
            .then(([lines, worldName]: [string[], string]) => {
                let last: number = storage.getObject(STORAGE.LOG_LOAD, 0);
                storage.set(STORAGE.LOG_LOAD, Math.floor(Date.now().valueOf()));

                for (let line of lines) {
                    let time = new Date(line.substring(0, line.indexOf('b')).replace(' ', 'T').replace(' ', 'Z')).valueOf();
                    let message = line.substring(line.indexOf(']') + 2);

                    if (time < last) {
                        continue;
                    }

                    if (message.startsWith(`${worldName} - Player Connected `)) {
                        let parts = line.substr(line.indexOf(' - Player Connected ') + 20); //NAME | IP | ID
                        let [, name, ip] = parts.match(/(.*) \| ([\w.]+) \| .{32}\s*/);

                        this.checkPlayerJoin(name, ip);
                    }
                }

                storage.set(STORAGE.PLAYERS, this.players);
            });

            // Make using the world class pretty much foolproof
            this.isPlayer = this.isPlayer.bind(this);
            this.isServer = this.isServer.bind(this);
            this.isOwner = this.isOwner.bind(this);
            this.isAdmin = this.isAdmin.bind(this);
            this.isMod = this.isMod.bind(this);
            this.isStaff = this.isStaff.bind(this);
            this.isOnline = this.isOnline.bind(this);
            this.getJoins = this.getJoins.bind(this);
            this.getIP = this.getIP.bind(this);
            this.getIPs = this.getIPs.bind(this);
            this.getPlayerNames = this.getPlayerNames.bind(this);
            this.getOnlineNames = this.getOnlineNames.bind(this);
    }

    /**
     * Checks if a player has joined the server
     */
    isPlayer(name: string): boolean {
        return this.players.hasOwnProperty(name.toLocaleUpperCase());
    }

    /**
     * Checks if a player is the server.
     */
    isServer(name: string): boolean {
        return name.toLocaleUpperCase() == 'SERVER';
    }

    /**
     * Checks if the player is the owner or server.
     */
    isOwner(name: string): boolean {
        return this.owner == name.toLocaleUpperCase() || this.isServer(name);
    }

    /**
     * Checks if the player is an admin
     */
    isAdmin(name: string): boolean {
        return this.lists.admin.includes(name.toLocaleUpperCase()) || this.isOwner(name);
    }

    /**
     * Checks if the player is a mod
     */
    isMod(name: string): boolean {
        return this.lists.mod.includes(name.toLocaleUpperCase());
    }

    /**
     * Checks if the player is a staff member.
     */
    isStaff(name: string): boolean {
        return this.isAdmin(name) || this.isMod(name);
    }

    /**
     * Checks if a player is online
     */
    isOnline(name: string): boolean {
        return this.online.includes(name.toLocaleUpperCase());
    }

    /**
     * Gets the number of times the player has joined the server.
     */
    getJoins(name: string): number {
        return this.getPlayer(name).joins;
    }

    /**
     * Gets the latest IP used by a player.
     */
    getIP(name: string): string {
        return this.getPlayer(name).ip;
    }

    /**
     * Gets all IPs used by a player.
     */
    getIPs(name: string): string[] {
        return this.getPlayer(name).ips;
    }

    /**
     * Gets all player names.
     */
    getPlayerNames(): string[] {
        return Object.keys(this.players);
    }

    /**
     * Gets online player names
     */
    getOnlineNames(): string[] {
        return this.online.splice(0);
    }

    /**
     * Gets the player object, if it exists, or returns a dummy player object.
     */
    private getPlayer(name: string): Player {
        return this.isPlayer(name) ? this.players[name.toLocaleUpperCase()] : {joins: 0, ip: '', ips: []};
    }

    /**
     * Creates or updates a player.
     */
    private setPlayer(name: string, player: Player): void {
        this.players[name.toLocaleUpperCase()] = player;
    }

    /**
     * Removes admins from the mod list and creates the staff list.
     */
    private buildStaffList(): void {
        this.lists.mod = this.lists.mod.filter(name => !this.isAdmin(name));
        this.lists.staff = this.lists.admin.concat(this.lists.mod);
    }

    /**
     * Adds new names to the player list, and increments joins.
     */
    private checkPlayerJoin(name: string, ip: string): void {
        let player = this.getPlayer(name);
        if (!player.ips.includes(ip)) {
            player.ips.push(ip);
        }
        player.ip = ip;
        player.joins++;

        this.setPlayer(name, player);

        // Avoid double parsing joins
        storage.set(STORAGE.LOG_LOAD, Math.floor(Date.now().valueOf()));
        storage.set(STORAGE.PLAYERS, this.players);
    }

    /**
     * Checks if a player can execute the given command.
     */
    private permissionCheck(name: string, command: string): boolean {
        command = command.toLocaleLowerCase();

        if (['admin', 'unadmin', 'mod', 'unmod'].includes(command)) {
            return this.isAdmin(name);
        }

        if (['whitelist', 'unwhitelist', 'ban', 'unban'].includes(command)) {
            return this.isStaff(name);
        }

        return false;
    }

    //Would be great to simplify this.
    // tslint:disable-next-line:cyclomatic-complexity
    private updateLists(name: string, command: string, target: string): void {
        if (!this.permissionCheck(name, command)) {
            return;
        }

        target = target.toLocaleUpperCase();

        let un = command.startsWith('un');

        let list: string[] = this.getListByCommand(command);

        if (un && list.includes(target)) {
            list.splice(list.indexOf(target), 1);
            this.buildStaffList();
        } else if (!un && !list.includes(target)) {
            list.push(target);
            this.buildStaffList();
        }
    }

    private getListByCommand(command: string): string[] {
        let base = command.startsWith('un') ? command.substr(2) : command;

        let translator: {[key: string]: keyof PlayerLists} = {
            whitelist: 'white',
            ban: 'black',
            admin: 'admin',
            mod: 'mod',
        };

        let index = translator[base];

        return this.lists[index];
    }
}
