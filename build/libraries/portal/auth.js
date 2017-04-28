"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ajax_1 = require("../ajax");
var sha1 = require('sha1');
/**
 * Class used to connect to the portal.
 */
var PortalAuth = (function () {
    /**
     * Creates a new instance of the PortalAuth class.
     *
     * @param username the username to use when logging in.
     * @param password the password to log in with.
     */
    function PortalAuth(username, password) {
        this.username = username.toLocaleUpperCase();
        this.password = password;
    }
    /**
     * Tries to log in to the portal
     *
     * @return true if logging in was successful, otherwise false.
     */
    PortalAuth.prototype.login = function () {
        var _this = this;
        return ajax_1.Ajax.postJSON('/login', { username: this.username })
            .then(function (data) {
            if (data.status != 'ok') {
                throw new Error("Bad API response.");
            }
            var hashedPass = sha1(data.salt + _this.password);
            hashedPass = sha1(hashedPass + data.salt2);
            return ajax_1.Ajax.post('/login', {
                seed: data.seed,
                password: hashedPass,
                username: _this.username,
            });
        }).then(function (page) {
            if (page.includes('<p id="message">Invalid username / password</p>')) {
                throw new Error('Invalid username or password. Login failed.');
            }
        });
    };
    return PortalAuth;
}());
exports.PortalAuth = PortalAuth;
