/**
 * Class used to connect to the portal.
 */
export declare class PortalAuth {
    private username;
    private password;
    /**
     * Creates a new instance of the PortalAuth class.
     *
     * @param username the username to use when logging in.
     * @param password the password to log in with.
     */
    constructor(username: string, password: string);
    /**
     * Tries to log in to the portal
     *
     * @return true if logging in was successful, otherwise false.
     */
    login(): Promise<void>;
}
