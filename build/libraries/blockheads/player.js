"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Player class which is returned by the [[World.getPlayer]] method. Should not be created by any other method.
 */
var Player = (function () {
    /**
     * Creates a new instance of the Player class.
     *
     * @param name - the name of the player.
     * @param info - the player info stored between bot launches.
     */
    function Player(name, info, lists) {
        this.name = name;
        this.info = info;
        this.lists = lists;
    }
    /**
     * Checks if the player has joined the server.
     *
     * @return true if the player has joined before, otherwise false.
     */
    Player.prototype.hasJoined = function () {
        return this.info.joins > 0;
    };
    /**
     * Gets the player's name.
     *
     * @return The name of the player.
     */
    Player.prototype.getName = function () {
        return this.name;
    };
    /**
     * Gets the most recently used IP of the player.
     *
     * @return the player's IP
     */
    Player.prototype.getIP = function () {
        return this.info.ip;
    };
    /**
     * Gets the all IPs used by the player on the world.
     *
     * @return an array of IPs
     */
    Player.prototype.getIPs = function () {
        return this.info.ips.slice(0);
    };
    /**
     * Gets the number of times the player has joined the server.
     *
     * @return how many times the player has joined.
     */
    Player.prototype.getJoins = function () {
        return this.info.joins;
    };
    /**
     * Returns true if the player is the owner of the server or is the server.
     *
     * @return true if the player is the owner.
     */
    Player.prototype.isOwner = function () {
        return !!this.info.owner || this.name == 'SERVER';
    };
    /**
     * Checks if the player is an admin.
     *
     * @return true if the player is an admin.
     */
    Player.prototype.isAdmin = function () {
        return this.lists.adminlist.includes(this.name) || this.isOwner();
    };
    /**
     * Checks if the player is a mod without admin permissions.
     *
     * @return true if the player is an admin and not a mod.
     */
    Player.prototype.isMod = function () {
        return this.lists.modlist.includes(this.name) && !this.isAdmin();
    };
    /**
     * Checks if the player is an admin or a mod.
     *
     * @return true if the player is an admin or a mod.
     */
    Player.prototype.isStaff = function () {
        return this.isAdmin() || this.isMod();
    };
    /**
     * Checks if the player is whitelisted.
     *
     * @return true if the player can join the server when it is whitelisted.
     */
    Player.prototype.isWhitelisted = function () {
        return this.lists.whitelist.includes(this.name) || this.isStaff();
    };
    /**
     * Checks if the player is banned.
     *
     * @return true if the player is on the blacklist.
     */
    Player.prototype.isBanned = function () {
        return this.lists.blacklist.includes(this.name);
    };
    return Player;
}());
exports.Player = Player;
