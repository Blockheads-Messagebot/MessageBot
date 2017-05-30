"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
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
var fs = require("fs");
var path = require("path");
var fileStorage = new Map();
var jsonPath = path.join(__dirname, '..', '..', '..', 'config', 'localStorage.json');
// Import from the config if it exists
if (fs.existsSync(jsonPath)) {
    var parsed = void 0;
    try {
        var json = fs.readFileSync(jsonPath, 'utf8');
        parsed = JSON.parse(json);
        if (parsed) {
            try {
                for (var _a = __values(Object.keys(parsed)), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var key = _b.value;
                    fileStorage.set(key, parsed[key]);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    }
    catch (e) {
        console.error('Error importing localStorage.json', e);
    }
}
var lastSave = Date.now();
var lastChange = 0;
// Write at most every 30 seconds
setInterval(function () {
    if (lastChange > lastSave) {
        lastSave = Date.now();
        var objMap = {};
        try {
            for (var _a = __values(fileStorage.entries()), _b = _a.next(); !_b.done; _b = _a.next()) {
                var _c = __read(_b.value, 2), key = _c[0], value = _c[1];
                objMap[key] = value;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
            }
            finally { if (e_2) throw e_2.error; }
        }
        try {
            fs.writeFileSync(jsonPath, JSON.stringify(objMap), 'utf8');
        }
        catch (e) {
            console.error('Failed to save config', e);
        }
    }
    var e_2, _d;
}, 30 * 1000);
/**
 * @inheritdoc
 */
var Storage = (function () {
    /**
     * Creates a new instance of the storage class, should not be used by extensions.
     */
    function Storage(namespace) {
        var _this = this;
        /**
         * @inheritdoc
         */
        this.getString = function (key, fallback, local) {
            if (local === void 0) { local = true; }
            var result;
            if (local) {
                result = fileStorage.get("" + key + _this.namespace);
            }
            else {
                result = fileStorage.get(key);
            }
            return (result == null) ? fallback : result;
        };
        /**
         * @inheritdoc
         */
        this.getObject = function (key, fallback, local) {
            var raw = _this.getString(key, '', local);
            if (!raw) {
                return fallback;
            }
            var result;
            try {
                result = JSON.parse(raw);
            }
            catch (e) {
                result = fallback;
            }
            if (!result) {
                result = fallback;
            }
            return result;
        };
        /**
         * @inheritdoc
         */
        this.set = function (key, data, local) {
            if (local === void 0) { local = true; }
            if (local) {
                key = "" + key + _this.namespace;
            }
            if (typeof data == 'string') {
                fileStorage.set(key, data);
            }
            else {
                fileStorage.set(key, JSON.stringify(data));
            }
            lastChange = Date.now();
        };
        /**
         * @inheritdoc
         */
        this.clearNamespace = function (namespace) {
            var toDelete = [];
            try {
                for (var _a = __values(fileStorage.keys()), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var key = _b.value;
                    if (key.startsWith(namespace)) {
                        toDelete.push(key);
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_3) throw e_3.error; }
            }
            toDelete.forEach(fileStorage.delete);
            lastChange = Date.now();
            var e_3, _c;
        };
        /**
         * @inheritdoc
         */
        this.migrate = function (key, actor) {
            var keys = [];
            try {
                for (var _a = __values(fileStorage.keys()), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var sKey = _b.value;
                    if (sKey.startsWith(key)) {
                        keys.push(sKey);
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_4) throw e_4.error; }
            }
            keys.forEach(function (key) {
                _this.set(key, actor(_this.getObject(key, {}, false)), false);
            });
            lastChange = Date.now();
            var e_4, _c;
        };
        this.namespace = String(namespace);
    }
    return Storage;
}());
exports.Storage = Storage;
var e_1, _c;
