export const config: BotConfig = {
    username: 'USER',
    password: 'PASSWORD',
    worldId: 123456,
};

/**
 * The configuration interface to ensure that all required fields are provided.
 */
interface BotConfig {
    /**
     * The username to log into the portal with.
     */
    username: string;
    /**
     * The password to log into the portal with.
     */
    password: string;
    /**
     * The worldId of the world to watch chat for, get this from the URL.
     */
    worldId: number;
}
