import {Ajax} from '../ajax';
const sha1 = require('sha1') as (input: string) => string;

/**
 * Class used to connect to the portal.
 */
export class PortalAuth {
    private username: string;
    private password: string;

    /**
     * Creates a new instance of the PortalAuth class.
     *
     * @param username the username to use when logging in.
     * @param password the password to log in with.
     */
    constructor(username: string, password: string) {
        this.username = username.toLocaleUpperCase();
        this.password = password;

    }

    /**
     * Tries to log in to the portal
     *
     * @return true if logging in was successful, otherwise false.
     */
    login = (): Promise<void> => {
        return Ajax.postJSON('/login', {username: this.username})
            .then((data: {salt: string, salt2: string, seed: string, status: string}) => {
                if (data.status != 'ok') {
                    throw new Error("Bad API response.");
                }

                let hashedPass = sha1(data.salt + this.password);
                hashedPass = sha1(hashedPass + data.salt2);

                return Ajax.post('/login', {
                    seed: data.seed,
                    password: hashedPass,
                    username: this.username,
                });
            }).then(page => {
                if (page.includes('<p id="message">Invalid username / password</p>')) {
                    throw new Error('Invalid username or password. Login failed.');
                }
            });
    }
}


