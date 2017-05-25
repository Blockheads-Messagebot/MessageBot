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
var bot_1 = require("../../bot");
var fs = require("fs");
var settingDefaults = [
    // General
    ['messages/announcementDelay', 10],
    ['messages/maxResponses', 3],
    ['console/logJoinIps', true],
    ['console/logUnparsedMessages', true],
    // Advanced
    ['messages/regexTriggers', false],
    ['messages/disableWhitespaceTrimming', false],
    ['splitMessages', false],
    ['splitToken', '<split>'],
];
bot_1.MessageBot.registerExtension('settings-ui', function (ex) {
    if (ex.isNode || !ex.bot.getExports('ui')) {
        throw new Error('This extension must be loaded in a browser after the UI has been loaded.');
    }
    var settingsRoot = ex.bot.settings;
    var ui = ex.bot.getExports('ui');
    var tab = ui.addTab('Settings');
    tab.innerHTML = fs.readFileSync(__dirname + '/tab.html', 'utf8');
    try {
        for (var settingDefaults_1 = __values(settingDefaults), settingDefaults_1_1 = settingDefaults_1.next(); !settingDefaults_1_1.done; settingDefaults_1_1 = settingDefaults_1.next()) {
            var _a = __read(settingDefaults_1_1.value, 2), key = _a[0], def = _a[1];
            var el = tab.querySelector("[data-target=\"" + key + "\"]");
            if (typeof def == 'boolean') {
                el.checked = settingsRoot.get(key, def);
            }
            else {
                el.value = String(settingsRoot.get(key, def));
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (settingDefaults_1_1 && !settingDefaults_1_1.done && (_b = settingDefaults_1.return)) _b.call(settingDefaults_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    tab.addEventListener('input', function () {
        try {
            for (var settingDefaults_2 = __values(settingDefaults), settingDefaults_2_1 = settingDefaults_2.next(); !settingDefaults_2_1.done; settingDefaults_2_1 = settingDefaults_2.next()) {
                var _a = __read(settingDefaults_2_1.value, 2), key = _a[0], def = _a[1];
                var el = tab.querySelector("[data-target=\"" + key + "\"]");
                if (typeof def == 'boolean') {
                    settingsRoot.set(key, el.checked);
                }
                else if (typeof def == 'number') {
                    settingsRoot.set(key, +el.value);
                }
                else {
                    settingsRoot.set(key, el.value);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (settingDefaults_2_1 && !settingDefaults_2_1.done && (_b = settingDefaults_2.return)) _b.call(settingDefaults_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var e_2, _b;
    });
    ex.uninstall = function () {
        ui.removeTab(tab);
    };
    var e_1, _b;
});
