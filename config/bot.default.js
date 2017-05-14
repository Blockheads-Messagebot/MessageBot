/**
 * Copy this file into bot.js in the same directory and modify as necessary for the bot type you are running.
 */
module.exports = {
    /**
     * The username to log into the cloud portal with. Cloud servers only.
     */
    username: 'USER',
    /**
     * The password to log into the cloud portal with. Cloud servers only.
     */
    password: 'PASSWORD',
    /**
     * For cloud servers, use the world ID in the URL when viewing the overview page.
     * For mac servers, choose a unique ID for each server.
     * For mac servers, this can also be a string.
     */
    worldId: 0,
    /**
     * The path to the world you want to watch chat for. Mac servers only.
     */
    path: '~/Library/Containers/com.majicjungle.BlockheadsServer/Data/Library/Application Support/TheBlockheads/saves/YOUR_SAVE_ID'
};
