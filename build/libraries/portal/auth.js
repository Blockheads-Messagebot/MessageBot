"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ajax_1 = require("../ajax");
const sha1 = require('sha1');
/**
 * Class used to connect to the portal.
 */
class PortalAuth {
    /**
     * Creates a new instance of the PortalAuth class.
     *
     * @param username the username to use when logging in.
     * @param password the password to log in with.
     */
    constructor(username, password) {
        this.username = username.toLocaleUpperCase();
        this.password = password;
    }
    /**
     * Tries to log in to the portal
     *
     * @return true if logging in was successful, otherwise false.
     */
    login() {
        return ajax_1.Ajax.postJSON('/login', { username: this.username })
            .then((data) => {
            if (data.status != 'ok') {
                throw new Error("Bad API response.");
            }
            let hashedPass = sha1(data.salt + this.password);
            hashedPass = sha1(hashedPass + data.salt2);
            return ajax_1.Ajax.post('/login', {
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
exports.PortalAuth = PortalAuth;
