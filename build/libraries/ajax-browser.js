// See ajax.ts for documentation.
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Ajax {
    static get(url = '/', params = {}) {
        if (Object.keys(params).length) {
            var addition = urlStringify(params);
            if (url.includes('?')) {
                url += `&${addition}`;
            }
            else {
                url += `?${addition}`;
            }
        }
        return xhr('GET', url, {});
    }
    static getJSON(url = '/', params = {}) {
        return Ajax.get(url, params).then(data => {
            try {
                return JSON.parse(data);
            }
            catch (e) {
                return {};
            }
        });
    }
    static post(url = '/', params = {}) {
        return xhr('POST', url, params);
    }
    static postJSON(url = '/', params = {}) {
        return Ajax.post(url, params).then(data => {
            try {
                return JSON.parse(data);
            }
            catch (e) {
                return {};
            }
        });
    }
}
exports.Ajax = Ajax;
/**
 * Helper function to make XHR requests.
 *
 * @hidden
 */
function xhr(protocol, url = '/', params = {}) {
    var paramStr = urlStringify(params);
    return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest();
        req.open(protocol, url);
        req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        if (protocol == 'POST') {
            req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        req.onload = function () {
            if (req.status == 200) {
                resolve(req.response);
            }
            else {
                reject(new Error(req.statusText));
            }
        };
        // Handle network errors
        req.onerror = function () {
            reject(new Error("Network Error"));
        };
        if (paramStr) {
            req.send(paramStr);
        }
        else {
            req.send();
        }
    });
}
/**
 * Internal function used to stringify url parameters
 *
 * @hidden
 */
function urlStringify(obj) {
    return Object.keys(obj)
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k].toString())}`)
        .join('&');
}
