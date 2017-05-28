"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var logparser_1 = require("./logparser");
var plist = require('simple-plist');
var child_process_1 = require("child_process");
var fs = require("fs");
var request = require("request");
/**
 * This class is only used by the [[World]] class. You don't need to know anything about it unless you are creating new instances of the [[World]] class.
 */
var MacApi = (function () {
    /**
     * Creates a new instance of the MacApi class.
     *
     * @param path the path to the world save folder.
     */
    function MacApi(path) {
        var _this = this;
        /**
         * @inheritdoc
         */
        this.getLists = function () {
            return Promise.all([
                _this.readText('adminlist'),
                _this.readText('modlist'),
                _this.readText('blacklist'),
                _this.readText('whitelist'),
            ])
                .then(function (lists) { return lists.map(function (list) { return list.splice(2); }); }) //remove instructions
                .then(function (_a) {
                var _b = __read(_a, 4), adminlist = _b[0], modlist = _b[1], blacklist = _b[2], whitelist = _b[3];
                return { adminlist: adminlist, modlist: modlist, blacklist: blacklist, whitelist: whitelist };
            });
        };
        /**
         * @inheritdoc
         */
        this.getOverview = function () {
            var translateWorldSize = function (size) {
                switch (size) {
                    case 512 * 1 / 16:
                        return '1/16x';
                    case 512 * 1 / 4:
                        return '1/4x';
                    case 512 * 1:
                        return '1x';
                    case 512 * 4:
                        return '4x';
                    case 512 * 16:
                        return '16x';
                    default:
                        return '1x';
                }
            };
            return Promise.all([
                _this.readText('whitelist'),
                new Promise(function (resolve) {
                    request.get('https://api.ipify.org?format=json', {}, function (_err, _req, body) {
                        try {
                            var ip = JSON.parse(body).ip;
                            resolve(ip ? ip : '0.0.0.0');
                        }
                        catch (e) {
                            resolve('0.0.0.0');
                        }
                    });
                })
            ]).then(function (_a) {
                var _b = __read(_a, 2), whitelist = _b[0], ip = _b[1];
                return {
                    name: _this.worldv2.worldName,
                    owner: 'SERVER',
                    created: _this.worldv2.creationDate,
                    last_activity: _this.worldv2.saveDate,
                    credit_until: new Date('12/30/9999'),
                    link: "http://theblockheads.net/join.php?ip=" + ip + "&port=" + _this.worldv2.hostPort + "&name=" + _this.worldv2.worldName,
                    pvp: !_this.worldv2.pvpDisabled,
                    privacy: 'private',
                    size: translateWorldSize(_this.worldv2.worldSize),
                    password: false,
                    whitelist: !whitelist.length,
                    online: [],
                };
            });
        };
        /**
         * @inheritdoc
         */
        this.getLogs = function () {
            return _this.readText('logs')
                .then(_this.parser.parse);
        };
        /**
         * @inheritdoc
         */
        this.send = function (message) {
            child_process_1.spawn("osascript", [
                '-l', 'JavaScript',
                __dirname + '/send.scpt',
                _this.worldv2.worldName,
                message
            ]);
        };
        /**
         * Gets the specified list for the world.
         *
         * @param file the file to read
         */
        this.readText = function (file) {
            return new Promise(function (resolve) {
                fs.readFile(_this.path + ("/" + file + ".txt"), 'utf8', function (err, data) {
                    if (err) {
                        resolve([]);
                    }
                    resolve(data.split('\n'));
                });
            });
        };
        // Strip trailing slash if present
        this.path = path.replace(/\/$/, '');
        if ([
            fs.existsSync(path + '/worldv2'),
        ].some(function (exists) { return !exists; })) {
            throw new Error("Invalid world path, missing worldv2 file.");
        }
        try {
            this.worldv2 = plist.readFileSync(this.path + '/worldv2');
        }
        catch (err) {
            throw new Error("Unable to read worldv2 file. Likely not a world folder.");
        }
        this.parser = new logparser_1.MacLogParser(this.worldv2.worldName);
    }
    return MacApi;
}());
exports.MacApi = MacApi;
