import {Player} from './player';
import {WorldLists} from './types/world';

/**
 * Class to watch chat for commands and update the stored lists as needed. You don't need to know anything about this class. It is only used by the [[World]] class internally to keep lists up to date.
 */
export class CommandWatcher {
    private lists: WorldLists;
    private getPlayer: (name: string) => Player;

    /**
     * Creates a new instance of the class.
     *
     * @param lists the lists to keep up to date.
     * @param getPlayer a callback to be used for getting player info. Must return an instance of Player
     */
    constructor(lists: WorldLists, getPlayer: (name: string) => Player) {
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
    listener({player, command, args}: {player: Player, command: string, args: string}) {
        let target = this.getPlayer(args);

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
                this.clear((<keyof WorldLists>command.substr(6)), player);
                break;
        }
    }

    /**
     * Handles /ban and /ban-no-device commands
     *
     * @param player the player sending the message
     * @param target the player to ban
     */
    private ban(player: Player, target: Player) {
        if (player.isStaff()) {
            if (player.isMod() && target.isStaff()) {
                return;
            } else if (target.isOwner()) {
                return;
            }

            this.add('blacklist', target);
            this.remove('adminlist', target);
            this.remove('modlist', target);
            this.remove('whitelist', target);
        }
    }

    /**
     * Handles the /unban command.
     *
     * @param player the player sending the command
     * @param target the player to unban.
     */
    private unban(player: Player, target: Player) {
        if (player.isStaff()) {
            this.remove('blacklist', target);
        }
    }

    /**
     * Handles the /whitelist command.
     *
     * @param player the player sending the command.
     * @param target the player to whitelist.
     */
    private whitelist(player: Player, target: Player) {
        if (player.isStaff()) {
            this.add('whitelist', target);
            this.remove('blacklist', target);
        }
    }

    /**
     * Handles the /unwhitelist command.
     *
     * @param player the player sending the command.
     * @param target the player to remove from the whitelist.
     */
    private unwhitelist(player: Player, target: Player) {
        if (player.isStaff()) {
            this.remove('whitelist', target);
        }
    }

    /**
     * Handles the /mod command.
     *
     * @param player the player sending the command.
     * @param target the player to mod.
     */
    private mod(player: Player, target: Player) {
        if (player.isAdmin()) {
            this.add('modlist', target);
            this.remove('blacklist', target);
        }
    }

    /**
     * Handles the /unmod command.
     *
     * @param player the player sending the command
     * @param target the player to remove from the modlist.
     */
    private unmod(player: Player, target: Player) {
        if (player.isAdmin()) {
            this.remove('modlist', target);
        }
    }

    /**
     * Handles the /admin command.
     *
     * @param player the player sending the command.
     * @param target the player to admin.
     */
    private admin(player: Player, target: Player) {
        if (player.isAdmin()) {
            this.add('adminlist', target);
            this.remove('blacklist', target);
        }
    }

    /**
     * Handles the /unadmin command.
     *
     * @param player the player sending the command.
     * @param target the player to remove from the adminlist.
     */
    private unadmin(player: Player, target: Player) {
        if (player.isAdmin() && !target.isOwner()) {
            this.remove('adminlist', target);
        }
    }

    /**
     * Handles /clear-list commands.
     *
     * @param list the list to clear.
     * @param player the payer sending the command.
     */
    private clear(list: keyof WorldLists, player: Player) {
        if (player.isAdmin()) {
            this.lists[list].length = 0;
        }
    }

    /**
     * Handles adding a player to a list.
     *
     * @param list the list to add the player to.
     * @param player the player to add to the list.
     */
    private add(list: keyof WorldLists, player: Player) {
        if (!this.lists[list].includes(player.getName())) {
            this.lists[list].push(player.getName());
        }
    }

    /**
     * Handles removing players from a list.
     *
     * @param list the list to remove the player from.
     * @param player the player to remove.
     */
    private remove(list: keyof WorldLists, player: Player) {
        if (this.lists[list].includes(player.getName())) {
            this.lists[list].splice(this.lists[list].indexOf(player.getName()), 1);
        }
    }
}
