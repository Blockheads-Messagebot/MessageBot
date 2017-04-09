"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Player class which is returned by the [[World.getPlayer]] method. Should not be created by any other method.
 */
class Player {
    /**
     * Creates a new instance of the Player class.
     *
     * @param name - the name of the player.
     * @param info - the player info stored between bot launches.
     */
    constructor(name, info, lists) {
        this.name = name;
        this.info = info;
        this.lists = lists;
    }
    /**
     * Checks if the player has joined the server.
     *
     * @return true if the player has joined before, otherwise false.
     */
    hasJoined() {
        return this.info.joins > 0;
    }
    /**
     * Gets the player's name.
     *
     * @return The name of the player.
     */
    getName() {
        return this.name;
    }
    /**
     * Gets the most recently used IP of the player.
     *
     * @return the player's IP
     */
    getIP() {
        return this.info.ip;
    }
    /**
     * Gets the all IPs used by the player on the world.
     *
     * @return an array of IPs
     */
    getIPs() {
        return this.info.ips.slice(0);
    }
    /**
     * Gets the number of times the player has joined the server.
     *
     * @return how many times the player has joined.
     */
    getJoins() {
        return this.info.joins;
    }
    /**
     * Returns true if the player is the owner of the server or is the server.
     *
     * @return true if the player is the owner.
     */
    isOwner() {
        return !!this.info.owner || this.name == 'SERVER';
    }
    /**
     * Checks if the player is an admin.
     *
     * @return true if the player is an admin.
     */
    isAdmin() {
        return this.lists.adminlist.includes(this.name) || this.isOwner();
    }
    /**
     * Checks if the player is a mod without admin permissions.
     *
     * @return true if the player is an admin and not a mod.
     */
    isMod() {
        return this.lists.modlist.includes(this.name) && !this.isAdmin();
    }
    /**
     * Checks if the player is an admin or a mod.
     *
     * @return true if the player is an admin or a mod.
     */
    isStaff() {
        return this.isAdmin() || this.isMod();
    }
    /**
     * Checks if the player is whitelisted.
     *
     * @return true if the player can join the server when it is whitelisted.
     */
    isWhitelisted() {
        return this.lists.whitelist.includes(this.name) || this.isStaff();
    }
    /**
     * Checks if the player is banned.
     *
     * @return true if the player is on the blacklist.
     */
    isBanned() {
        return this.lists.blacklist.includes(this.name);
    }
}
exports.Player = Player;
