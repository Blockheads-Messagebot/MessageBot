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
        var _this = this;
        /**
         * Function called whenever new commands come in.
         *
         * @param sender the world
         * @param player the player doing the command
         * @param command the command used
         * @param args any arguments supplied
         */
        //tslint:disable-next-line:cyclomatic-complexity
        this.listener = function (_a) {
            var player = _a.player, command = _a.command, args = _a.args;
            var target = _this.getPlayer(args);
            switch (command.toLocaleLowerCase()) {
                case 'ban':
                case 'ban-no-device':
                    _this.ban(player, target);
                    break;
                case 'unban':
                    _this.unban(player, target);
                    break;
                case 'whitelist':
                    _this.whitelist(player, target);
                    break;
                case 'unwhitelist':
                    _this.unwhitelist(player, target);
                    break;
                case 'mod':
                    _this.mod(player, target);
                    break;
                case 'unmod':
                    _this.unmod(player, target);
                    break;
                case 'admin':
                    _this.admin(player, target);
                    break;
                case 'unadmin':
                    _this.unadmin(player, target);
                    break;
                case 'clear-blacklist':
                case 'clear-whitelist':
                case 'clear-modlist':
                case 'clear-adminlist':
                    _this.clear(command.substr(6), player);
                    break;
            }
        };
        /**
         * Handles /ban and /ban-no-device commands
         *
         * @param player the player sending the message
         * @param target the player to ban
         */
        this.ban = function (player, target) {
            if (player.isStaff()) {
                if (player.isMod() && target.isStaff()) {
                    return;
                }
                else if (target.isOwner()) {
                    return;
                }
                _this.add('blacklist', target);
                _this.remove('adminlist', target);
                _this.remove('modlist', target);
                _this.remove('whitelist', target);
            }
        };
        /**
         * Handles the /unban command.
         *
         * @param player the player sending the command
         * @param target the player to unban.
         */
        this.unban = function (player, target) {
            if (player.isStaff()) {
                _this.remove('blacklist', target);
            }
        };
        /**
         * Handles the /whitelist command.
         *
         * @param player the player sending the command.
         * @param target the player to whitelist.
         */
        this.whitelist = function (player, target) {
            if (player.isStaff()) {
                _this.add('whitelist', target);
                _this.remove('blacklist', target);
            }
        };
        /**
         * Handles the /unwhitelist command.
         *
         * @param player the player sending the command.
         * @param target the player to remove from the whitelist.
         */
        this.unwhitelist = function (player, target) {
            if (player.isStaff()) {
                _this.remove('whitelist', target);
            }
        };
        /**
         * Handles the /mod command.
         *
         * @param player the player sending the command.
         * @param target the player to mod.
         */
        this.mod = function (player, target) {
            if (player.isAdmin()) {
                _this.add('modlist', target);
                _this.remove('blacklist', target);
            }
        };
        /**
         * Handles the /unmod command.
         *
         * @param player the player sending the command
         * @param target the player to remove from the modlist.
         */
        this.unmod = function (player, target) {
            if (player.isAdmin()) {
                _this.remove('modlist', target);
            }
        };
        /**
         * Handles the /admin command.
         *
         * @param player the player sending the command.
         * @param target the player to admin.
         */
        this.admin = function (player, target) {
            if (player.isAdmin()) {
                _this.add('adminlist', target);
                _this.remove('blacklist', target);
            }
        };
        /**
         * Handles the /unadmin command.
         *
         * @param player the player sending the command.
         * @param target the player to remove from the adminlist.
         */
        this.unadmin = function (player, target) {
            if (player.isAdmin() && !target.isOwner()) {
                _this.remove('adminlist', target);
            }
        };
        /**
         * Handles /clear-list commands.
         *
         * @param list the list to clear.
         * @param player the payer sending the command.
         */
        this.clear = function (list, player) {
            if (player.isAdmin()) {
                _this.lists[list].length = 0;
            }
        };
        /**
         * Handles adding a player to a list.
         *
         * @param list the list to add the player to.
         * @param player the player to add to the list.
         */
        this.add = function (list, player) {
            if (!_this.lists[list].includes(player.getName())) {
                _this.lists[list].push(player.getName());
            }
        };
        /**
         * Handles removing players from a list.
         *
         * @param list the list to remove the player from.
         * @param player the player to remove.
         */
        this.remove = function (list, player) {
            if (_this.lists[list].includes(player.getName())) {
                _this.lists[list].splice(_this.lists[list].indexOf(player.getName()), 1);
            }
        };
        this.lists = lists;
        this.getPlayer = getPlayer;
    }
    return CommandWatcher;
}());
exports.CommandWatcher = CommandWatcher;
