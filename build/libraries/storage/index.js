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
            fs.writeFileSync(jsonPath, objMap, 'utf8');
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
        this.namespace = String(namespace);
    }
    /**
     * @inheritdoc
     */
    Storage.prototype.getString = function (key, fallback, local) {
        if (local === void 0) { local = true; }
        var result;
        if (local) {
            result = fileStorage.get("" + key + this.namespace);
        }
        else {
            result = fileStorage.get(key);
        }
        return (result == null) ? fallback : result;
    };
    /**
     * @inheritdoc
     */
    Storage.prototype.getObject = function (key, fallback, local) {
        var raw = this.getString(key, '', local);
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
    Storage.prototype.set = function (key, data, local) {
        if (local === void 0) { local = true; }
        if (local) {
            key = "" + key + this.namespace;
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
    Storage.prototype.clearNamespace = function (namespace) {
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
    return Storage;
}());
exports.Storage = Storage;
var e_1, _c;
