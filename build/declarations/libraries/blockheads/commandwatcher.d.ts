import { Player } from './player';
import { WorldLists } from './types/world';
/**
 * Class to watch chat for commands and update the stored lists as needed. You don't need to know anything about this class. It is only used by the [[World]] class internally to keep lists up to date.
 */
export declare class CommandWatcher {
    private lists;
    private getPlayer;
    /**
     * Creates a new instance of the class.
     *
     * @param lists the lists to keep up to date.
     * @param getPlayer a callback to be used for getting player info. Must return an instance of Player
     */
    constructor(lists: WorldLists, getPlayer: (name: string) => Player);
    /**
     * Function called whenever new commands come in.
     *
     * @param sender the world
     * @param player the player doing the command
     * @param command the command used
     * @param args any arguments supplied
     */
    listener({player, command, args}: {
        player: Player;
        command: string;
        args: string;
    }): void;
    /**
     * Handles /ban and /ban-no-device commands
     *
     * @param player the player sending the message
     * @param target the player to ban
     */
    private ban(player, target);
    /**
     * Handles the /unban command.
     *
     * @param player the player sending the command
     * @param target the player to unban.
     */
    private unban(player, target);
    /**
     * Handles the /whitelist command.
     *
     * @param player the player sending the command.
     * @param target the player to whitelist.
     */
    private whitelist(player, target);
    /**
     * Handles the /unwhitelist command.
     *
     * @param player the player sending the command.
     * @param target the player to remove from the whitelist.
     */
    private unwhitelist(player, target);
    /**
     * Handles the /mod command.
     *
     * @param player the player sending the command.
     * @param target the player to mod.
     */
    private mod(player, target);
    /**
     * Handles the /unmod command.
     *
     * @param player the player sending the command
     * @param target the player to remove from the modlist.
     */
    private unmod(player, target);
    /**
     * Handles the /admin command.
     *
     * @param player the player sending the command.
     * @param target the player to admin.
     */
    private admin(player, target);
    /**
     * Handles the /unadmin command.
     *
     * @param player the player sending the command.
     * @param target the player to remove from the adminlist.
     */
    private unadmin(player, target);
    /**
     * Handles /clear-list commands.
     *
     * @param list the list to clear.
     * @param player the payer sending the command.
     */
    private clear(list, player);
    /**
     * Handles adding a player to a list.
     *
     * @param list the list to add the player to.
     * @param player the player to add to the list.
     */
    private add(list, player);
    /**
     * Handles removing players from a list.
     *
     * @param list the list to remove the player from.
     * @param player the player to remove.
     */
    private remove(list, player);
}
