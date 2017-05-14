"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var querystring_1 = require("querystring");
var baseRequest = request.defaults({
    headers: {
        'x-requested-with': 'XMLHttpRequest',
    },
    jar: true,
    baseUrl: 'http://portal.theblockheads.net/'
});
/**
 * System generic class for making http requests. Extensions can use through ex.ajax.
 */
var Ajax = (function () {
    function Ajax() {
    }
    /**
     * Function to GET a page. Passes the response of the XHR in the resolve promise.
     *
     * @param url the url to fetch.
     * @param params any parameters to add to the URL in the format of key=value
     * @return the raw page.
     * @example
     * get('/some/url.php', {a: 'test'}).then(console.log)
     * //sends a GET request to /some/url.php?a=test
     */
    Ajax.get = function (url, params) {
        if (url === void 0) { url = '/'; }
        if (params === void 0) { params = {}; }
        var paramStr = querystring_1.stringify(params);
        if (paramStr.length) {
            url = (url.includes('?') ? url + '&' : url + '?') + paramStr;
        }
        return new Promise(function (resolve, reject) {
            baseRequest.get(url, {}, function (err, _req, body) {
                if (err) {
                    return reject(err);
                }
                resolve(body);
            });
        });
    };
    /**
     * Returns a JSON object from the response.
     *
     * @param url the url to fetch.
     * @param params any parameters to add to the URL in the format of key=value
     * @return the result parsed as JSON
     * @example
     * getJSON('/', {id: '123'}).then(console.log);
     */
    Ajax.getJSON = function (url, params) {
        if (url === void 0) { url = '/'; }
        if (params === void 0) { params = {}; }
        return Ajax.get(url, params)
            .then(function (data) {
            try {
                return JSON.parse(data);
            }
            catch (e) {
                return {};
            }
        });
    };
    /**
     * Function to make a post request
     * @param url the url to fetch.
     * @param params any parameters to add to the body of the request in the format of key=value
     * @return the raw result.
     * @example
     * post('/', {id: '123'}).then(console.log);
     */
    Ajax.post = function (url, params) {
        if (url === void 0) { url = '/'; }
        if (params === void 0) { params = {}; }
        return new Promise(function (resolve, reject) {
            baseRequest.post(url, {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
                body: querystring_1.stringify(params),
            }, function (err, _req, body) {
                if (err) {
                    return reject(err);
                }
                resolve(body);
            });
        });
    };
    /**
     * Function to fetch JSON from a page through post.
     * @param url the url to fetch.
     * @param params any parameters to add to the body of the request in the format of key=value
     * @return the result parsed as JSON.
     * @example
     * postJSON('/', {id: 'test'}).then(console.log);
     */
    Ajax.postJSON = function (url, params) {
        if (url === void 0) { url = '/'; }
        if (params === void 0) { params = {}; }
        return Ajax.post(url, params)
            .then(function (data) {
            try {
                return JSON.parse(data);
            }
            catch (e) {
                return {};
            }
        });
    };
    return Ajax;
}());
exports.Ajax = Ajax;
