import { WorldLists } from 'blockheads-api/api'

function arrayContainsAny(haystack: string[], ...needles: string[]): boolean {
    return haystack.some(item => needles.includes(item))
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
     *
     * @return The name of the player.
     */
    get name(): string {
        return this._name
    }

    /**
     * Gets the most recently used IP of the player.
     *
     * @return the player's IP
     */
    get ip(): string {
        return this._info.ip
    }

    /**
     * Gets the all IPs used by the player on the world.
     *
     * @return an array of IPs
     */
    get ips(): string[] {
        return [...this._info.ips]
    }

    /**
     * Gets the number of times the player has joined the server.
     *
     * @return how many times the player has joined.
     */
    get joins(): number {
        return this._info.joins
    }

    /**
     * Checks if the player has joined the server.
     *
     * @return true if the player has joined before, otherwise false.
     */
    hasJoined = (): boolean => {
        return this._info.joins > 0
    }

    /**
     * Returns true if the player is the owner of the server or is the server.
     *
     * @return true if the player is the owner.
     */
    isOwner = (): boolean => {
        return !!this._info.owner || this._name == 'SERVER'
    }

    /**
     * Checks if the player is an admin or the owner.
     *
     * @return true if the player is an admin.
     */
    isAdmin = (): boolean => {
        // A player is admin if their name or their latest IP is listed on the adminlist, or they are the owner.
        return this.isOwner() || arrayContainsAny(this._lists.adminlist, this._name, this._info.ip)
    }

    /**
     * Checks if the player is a mod without admin permissions.
     *
     * @return true if the player is an admin and not a mod.
     */
    isMod = (): boolean => {
        // A player is mod if their name or their latest IP is on the modlist
        return !this.isAdmin() && arrayContainsAny(this._lists.modlist, this._name, this._info.ip)
    }

    /**
     * Checks if the player is an admin or a mod.
     *
     * @return true if the player is an admin or a mod.
     */
    isStaff = (): boolean => {
        return this.isAdmin() || this.isMod()
    }

    /**
     * Checks if the player is whitelisted.
     *
     * @return true if the player can join the server when it is whitelisted.
     */
    isWhitelisted = (): boolean => {
        // A player is whitelisted if they are staff or if their name or latest ip is on the whitelist.
        return this.isStaff() || arrayContainsAny(this._lists.whitelist, this._name, this._info.ip)
    }

    /**
     * Checks if the player is banned.
     *
     * @return true if the player is on the blacklist.
     */
    isBanned = (): boolean => {
        return !this.isStaff() && this._lists.blacklist
            .some(entry => {
                // We don't know the current player's device ID so can't check for that on the blacklist
                // If the player's name is on the blacklist, they are banned.
                // If an IP the player has used is banned, they are *probably* banned, so guess that they are.

                // Remove device ID from blacklist entry, if there is one
                if (entry.includes(' \\')) entry = entry.substr(0, entry.indexOf(' \\'))

                if (entry == this._name) return true
                if (this._info.ips.includes(entry)) return true

                return false
            })
    }
}
