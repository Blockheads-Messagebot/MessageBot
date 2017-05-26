import { WorldLists } from './types/world';
/**
 * Player class which is returned by the [[World.getPlayer]] method. Should not be created by any other method.
 */
export declare class Player {
    private name;
    private info;
    private lists;
    /**
     * Creates a new instance of the Player class.
     *
     * @param name - the name of the player.
     * @param info - the player info stored between bot launches.
     */
    constructor(name: string, info: {
        ip: string;
        ips: string[];
        joins: number;
        owner?: boolean;
    }, lists: WorldLists);
    /**
     * Checks if the player has joined the server.
     *
     * @return true if the player has joined before, otherwise false.
     */
    hasJoined(): boolean;
    /**
     * Gets the player's name.
     *
     * @return The name of the player.
     */
    getName(): string;
    /**
     * Gets the most recently used IP of the player.
     *
     * @return the player's IP
     */
    getIP(): string;
    /**
     * Gets the all IPs used by the player on the world.
     *
     * @return an array of IPs
     */
    getIPs(): string[];
    /**
     * Gets the number of times the player has joined the server.
     *
     * @return how many times the player has joined.
     */
    getJoins(): number;
    /**
     * Returns true if the player is the owner of the server or is the server.
     *
     * @return true if the player is the owner.
     */
    isOwner(): boolean;
    /**
     * Checks if the player is an admin.
     *
     * @return true if the player is an admin.
     */
    isAdmin(): boolean;
    /**
     * Checks if the player is a mod without admin permissions.
     *
     * @return true if the player is an admin and not a mod.
     */
    isMod(): boolean;
    /**
     * Checks if the player is an admin or a mod.
     *
     * @return true if the player is an admin or a mod.
     */
    isStaff(): boolean;
    /**
     * Checks if the player is whitelisted.
     *
     * @return true if the player can join the server when it is whitelisted.
     */
    isWhitelisted(): boolean;
    /**
     * Checks if the player is banned.
     *
     * @return true if the player is on the blacklist.
     */
    isBanned(): boolean;
}
