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
        var _this = this;
        /**
         * Checks if the player has joined the server.
         *
         * @return true if the player has joined before, otherwise false.
         */
        this.hasJoined = function () {
            return _this.info.joins > 0;
        };
        /**
         * Gets the player's name.
         *
         * @return The name of the player.
         */
        this.getName = function () {
            return _this.name;
        };
        /**
         * Gets the most recently used IP of the player.
         *
         * @return the player's IP
         */
        this.getIP = function () {
            return _this.info.ip;
        };
        /**
         * Gets the all IPs used by the player on the world.
         *
         * @return an array of IPs
         */
        this.getIPs = function () {
            return _this.info.ips.slice(0);
        };
        /**
         * Gets the number of times the player has joined the server.
         *
         * @return how many times the player has joined.
         */
        this.getJoins = function () {
            return _this.info.joins;
        };
        /**
         * Returns true if the player is the owner of the server or is the server.
         *
         * @return true if the player is the owner.
         */
        this.isOwner = function () {
            return !!_this.info.owner || _this.name == 'SERVER';
        };
        /**
         * Checks if the player is an admin.
         *
         * @return true if the player is an admin.
         */
        this.isAdmin = function () {
            return _this.lists.adminlist.includes(_this.name) || _this.isOwner();
        };
        /**
         * Checks if the player is a mod without admin permissions.
         *
         * @return true if the player is an admin and not a mod.
         */
        this.isMod = function () {
            return _this.lists.modlist.includes(_this.name) && !_this.isAdmin();
        };
        /**
         * Checks if the player is an admin or a mod.
         *
         * @return true if the player is an admin or a mod.
         */
        this.isStaff = function () {
            return _this.isAdmin() || _this.isMod();
        };
        /**
         * Checks if the player is whitelisted.
         *
         * @return true if the player can join the server when it is whitelisted.
         */
        this.isWhitelisted = function () {
            return _this.lists.whitelist.includes(_this.name) || _this.isStaff();
        };
        /**
         * Checks if the player is banned.
         *
         * @return true if the player is on the blacklist.
         */
        this.isBanned = function () {
            return _this.lists.blacklist.includes(_this.name);
        };
        this.name = name;
        this.info = info;
        this.lists = lists;
    }
    return Player;
}());
exports.Player = Player;
