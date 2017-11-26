import { WorldLists } from 'blockheads-api-interface'

function equalCaseInsensitive(a: string, b: string): boolean {
    return a.localeCompare(b, undefined, { sensitivity: 'base'}) === 0
}

function arrayContainsAny(haystack: string[], ...needles: string[]): boolean {
    return haystack.some(item => needles.some(needle => equalCaseInsensitive(item, needle)))
}

/**
 * Information about the player used by the Player class.
 * @hidden
 */
export interface PlayerInfo {
    ip: string
    ips: string[]
    joins: number
    owner?: boolean
}

/**
 * Player class which is returned by the [[World.getPlayer]] method. Should not be created by any other method.
 */
export class Player {
    private _name: string
    private _info: PlayerInfo
    private _lists: WorldLists

    /**
     * Creates a new instance of the Player class.
     *
     * @param name The name of the player.
     * @param info The player info stored between bot launches.
     */
    constructor(name: string, info: PlayerInfo, lists: WorldLists) {
        this._name = name
        this._info = info
        this._lists = lists
    }

    /**
     * Gets the player's name.
     */
    get name(): string {
        return this._name
    }

    /**
     * Gets the most recently used IP of the player.
     */
    get ip(): string {
        return this._info.ip
    }

    /**
     * Gets the all IPs used by the player on the world.
     */
    get ips(): string[] {
        return [...this._info.ips]
    }

    /**
     * Gets the number of times the player has joined the server.
     */
    get joins(): number {
        return this._info.joins
    }

    /**
     * Checks if the player has joined the server.
     */
    get hasJoined(): boolean {
        return this.joins > 0
    }

    /**
     * Returns true if the player is the owner of the server or is the server.
     */
    get isOwner(): boolean {
        return !!this._info.owner || this._name == 'SERVER'
    }

    /**
     * Checks if the player is an admin or the owner.
     */
    get isAdmin(): boolean {
        // A player is admin if their name or their latest IP is listed on the adminlist, or they are the owner.
        return this.isOwner || arrayContainsAny(this._lists.adminlist, this._name, this._info.ip)
    }

    /**
     * Checks if the player is a mod without admin permissions.
     */
    get isMod(): boolean {
        // A player is mod if their name or their latest IP is on the modlist
        return !this.isAdmin && arrayContainsAny(this._lists.modlist, this._name, this._info.ip)
    }

    /**
     * Checks if the player is an admin or a mod.
     */
    get isStaff(): boolean {
        return this.isAdmin || this.isMod
    }

    /**
     * Checks if the player is whitelisted. Is true if the player can join the server while it is whitelisted.
     */
    get isWhitelisted(): boolean {
        // A player is whitelisted if they are staff or if their name or latest ip is on the whitelist.
        return this.isStaff || arrayContainsAny(this._lists.whitelist, this._name, this._info.ip)
    }

    /**
     * Checks if the player is banned.
     */
    get isBanned(): boolean {
        return !this.isStaff && this._lists.blacklist
            .some(entry => {
                // We don't know the current player's device ID so can't check for that on the blacklist
                // If the player's name is on the blacklist, they are banned.
                // If an IP the player has used is banned, they are *probably* banned, so guess that they are.

                // Remove device ID from blacklist entry, if there is one
                if (entry.includes(' \\')) entry = entry.substr(0, entry.indexOf(' \\'))

                if (equalCaseInsensitive(this._name, entry)) return true
                if (this._info.ips.includes(entry)) return true

                return false
            })
    }
}
