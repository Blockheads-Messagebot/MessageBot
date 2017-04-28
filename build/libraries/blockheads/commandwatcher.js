"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class to watch chat for commands and update the stored lists as needed. You don't need to know anything about this class. It is only used by the [[World]] class internally to keep lists up to date.
 */
var CommandWatcher = (function () {
    /**
     * Creates a new instance of the class.
     *
     * @param lists the lists to keep up to date.
     * @param getPlayer a callback to be used for getting player info. Must return an instance of Player
     */
    function CommandWatcher(lists, getPlayer) {
        this.lists = lists;
        this.getPlayer = getPlayer;
        this.listener = this.listener.bind(this);
    }
    /**
     * Function called whenever new commands come in.
     *
     * @param sender the world
     * @param player the player doing the command
     * @param command the command used
     * @param args any arguments supplied
     */
    //tslint:disable-next-line:cyclomatic-complexity
    CommandWatcher.prototype.listener = function (_a) {
        var player = _a.player, command = _a.command, args = _a.args;
        var target = this.getPlayer(args);
        switch (command.toLocaleLowerCase()) {
            case 'ban':
            case 'ban-no-device':
                this.ban(player, target);
                break;
            case 'unban':
                this.unban(player, target);
                break;
            case 'whitelist':
                this.whitelist(player, target);
                break;
            case 'unwhitelist':
                this.unwhitelist(player, target);
                break;
            case 'mod':
                this.mod(player, target);
                break;
            case 'unmod':
                this.unmod(player, target);
                break;
            case 'admin':
                this.admin(player, target);
                break;
            case 'unadmin':
                this.unadmin(player, target);
                break;
            case 'clear-blacklist':
            case 'clear-whitelist':
            case 'clear-modlist':
            case 'clear-adminlist':
                this.clear(command.substr(6), player);
                break;
        }
    };
    /**
     * Handles /ban and /ban-no-device commands
     *
     * @param player the player sending the message
     * @param target the player to ban
     */
    CommandWatcher.prototype.ban = function (player, target) {
        if (player.isStaff()) {
            if (player.isMod() && target.isStaff()) {
                return;
            }
            else if (target.isOwner()) {
                return;
            }
            this.add('blacklist', target);
            this.remove('adminlist', target);
            this.remove('modlist', target);
            this.remove('whitelist', target);
        }
    };
    /**
     * Handles the /unban command.
     *
     * @param player the player sending the command
     * @param target the player to unban.
     */
    CommandWatcher.prototype.unban = function (player, target) {
        if (player.isStaff()) {
            this.remove('blacklist', target);
        }
    };
    /**
     * Handles the /whitelist command.
     *
     * @param player the player sending the command.
     * @param target the player to whitelist.
     */
    CommandWatcher.prototype.whitelist = function (player, target) {
        if (player.isStaff()) {
            this.add('whitelist', target);
            this.remove('blacklist', target);
        }
    };
    /**
     * Handles the /unwhitelist command.
     *
     * @param player the player sending the command.
     * @param target the player to remove from the whitelist.
     */
    CommandWatcher.prototype.unwhitelist = function (player, target) {
        if (player.isStaff()) {
            this.remove('whitelist', target);
        }
    };
    /**
     * Handles the /mod command.
     *
     * @param player the player sending the command.
     * @param target the player to mod.
     */
    CommandWatcher.prototype.mod = function (player, target) {
        if (player.isAdmin()) {
            this.add('modlist', target);
            this.remove('blacklist', target);
        }
    };
    /**
     * Handles the /unmod command.
     *
     * @param player the player sending the command
     * @param target the player to remove from the modlist.
     */
    CommandWatcher.prototype.unmod = function (player, target) {
        if (player.isAdmin()) {
            this.remove('modlist', target);
        }
    };
    /**
     * Handles the /admin command.
     *
     * @param player the player sending the command.
     * @param target the player to admin.
     */
    CommandWatcher.prototype.admin = function (player, target) {
        if (player.isAdmin()) {
            this.add('adminlist', target);
            this.remove('blacklist', target);
        }
    };
    /**
     * Handles the /unadmin command.
     *
     * @param player the player sending the command.
     * @param target the player to remove from the adminlist.
     */
    CommandWatcher.prototype.unadmin = function (player, target) {
        if (player.isAdmin() && !target.isOwner()) {
            this.remove('adminlist', target);
        }
    };
    /**
     * Handles /clear-list commands.
     *
     * @param list the list to clear.
     * @param player the payer sending the command.
     */
    CommandWatcher.prototype.clear = function (list, player) {
        if (player.isAdmin()) {
            this.lists[list].length = 0;
        }
    };
    /**
     * Handles adding a player to a list.
     *
     * @param list the list to add the player to.
     * @param player the player to add to the list.
     */
    CommandWatcher.prototype.add = function (list, player) {
        if (!this.lists[list].includes(player.getName())) {
            this.lists[list].push(player.getName());
        }
    };
    /**
     * Handles removing players from a list.
     *
     * @param list the list to remove the player from.
     * @param player the player to remove.
     */
    CommandWatcher.prototype.remove = function (list, player) {
        if (this.lists[list].includes(player.getName())) {
            this.lists[list].splice(this.lists[list].indexOf(player.getName()), 1);
        }
    };
    return CommandWatcher;
}());
exports.CommandWatcher = CommandWatcher;
