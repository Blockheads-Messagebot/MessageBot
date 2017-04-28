"use strict";
// See ajax.ts for documentation.
Object.defineProperty(exports, "__esModule", { value: true });
var Ajax = (function () {
    function Ajax() {
    }
    Ajax.get = function (url, params) {
        if (url === void 0) { url = '/'; }
        if (params === void 0) { params = {}; }
        if (Object.keys(params).length) {
            var addition = urlStringify(params);
            if (url.includes('?')) {
                url += "&" + addition;
            }
            else {
                url += "?" + addition;
            }
        }
        return xhr('GET', url, {});
    };
    Ajax.getJSON = function (url, params) {
        if (url === void 0) { url = '/'; }
        if (params === void 0) { params = {}; }
        return Ajax.get(url, params).then(function (data) {
            try {
                return JSON.parse(data);
            }
            catch (e) {
                return {};
            }
        });
    };
    Ajax.post = function (url, params) {
        if (url === void 0) { url = '/'; }
        if (params === void 0) { params = {}; }
        return xhr('POST', url, params);
    };
    Ajax.postJSON = function (url, params) {
        if (url === void 0) { url = '/'; }
        if (params === void 0) { params = {}; }
        return Ajax.post(url, params).then(function (data) {
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
/**
 * Helper function to make XHR requests.
 */
function xhr(protocol, url, params) {
    if (url === void 0) { url = '/'; }
    if (params === void 0) { params = {}; }
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
 */
function urlStringify(obj) {
    return Object.keys(obj)
        .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(obj[k].toString()); })
        .join('&');
}
