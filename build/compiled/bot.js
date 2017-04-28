(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
Object.defineProperty(exports, "__esModule", { value: true });
var extension_1 = require("./extension");
var settings_1 = require("./settings");
var simpleevent_1 = require("../libraries/simpleevent");
var extensions = new Map();
var extensionRegistered = new simpleevent_1.SimpleEvent();
var extensionDeregistered = new simpleevent_1.SimpleEvent();
/**
 * The MessageBot class, this is used to send messages and register extensions.
 */
var MessageBot = (function () {
    /**
     * Creates a new instance of the class.
     *
     * @param world the world to use for sending messages.
     */
    function MessageBot(world) {
        this.world = world;
        this.settings = new settings_1.Settings(world.storage);
        this.botSettings = this.settings.prefix('mb_');
        this.extensions = new Map();
        extensionRegistered.sub(this.registerExtension.bind(this));
        extensionDeregistered.sub(this.deregisterExtension.bind(this));
        try {
            for (var _a = __values(extensions.keys()), _b = _a.next(); !_b.done; _b = _a.next()) {
                var key = _b.value;
                this.registerExtension(key);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var e_1, _c;
    }
    /**
     * Adds an extension to the bot, this is the entry point for all extensions.
     *
     * @param id the unique name/extension ID for this extension.
     * @param creator the function to call in order to initialize the extension.
     */
    MessageBot.registerExtension = function (id, creator) {
        console.log('Launching extension', id);
        if (extensions.has(id)) {
            console.log("Extension " + id + " was already registered. Abort.");
            return;
        }
        extensions.set(id, creator);
        extensionRegistered.dispatch(id);
    };
    /**
     * Removes an extension and calls it's uninstall function.
     *
     * @param id the extension to remove.
     */
    MessageBot.deregisterExtension = function (id) {
        if (extensions.has(id)) {
            extensions.delete(id);
            extensionDeregistered.dispatch(id);
        }
    };
    /**
     * Loads an extension into this bot.
     *
     * @param id the extension to load
     */
    MessageBot.prototype.registerExtension = function (id) {
        if (this.extensions.has(id)) {
            return;
        }
        var creator = extensions.get(id);
        if (creator) {
            try {
                var ex = new extension_1.MessageBotExtension(this);
                ex.settings = this.settings.prefix(id);
                this.extensions.set(id, ex);
                creator.call(ex, ex, ex.world);
            }
            catch (err) {
                console.log('Error creating extension:', err);
            }
        }
    };
    /**
     * Removes an extension from this bot
     *
     * @param id the extension to remove.
     */
    MessageBot.prototype.deregisterExtension = function (id) {
        var ex = this.extensions.get(id);
        if (!ex) {
            return;
        }
        try {
            ex.uninstall();
        }
        catch (err) {
            console.log('Error uninstalling:', err);
        }
        finally {
            this.extensions.delete(id);
        }
    };
    /**
     * Gets an extension's exports, if it has been registered. Otherwise returns undefined.
     *
     * @param extensionId the id of the extension to get the exports for.
     */
    MessageBot.prototype.getExports = function (extensionId) {
        var ex = this.extensions.get(extensionId);
        if (ex) {
            return ex.exports;
        }
    };
    /**
     * Sends a message to the world for this bot, should usually be used in place of world.send.
     *
     * @param message the message to send
     * @param params any variables to inject into the message.
     */
    MessageBot.prototype.send = function (message, params) {
        var _this = this;
        if (params === void 0) { params = {}; }
        var messages;
        // Split the message if splitting is enabled.
        if (this.botSettings.get('splitMessages', false)) {
            messages = message.split(this.botSettings.get('splitToken', '<split>'));
        }
        else {
            messages = [message];
        }
        // Common enough to be done here, set the name of the player up right.
        if (params['name'] && params['name'].length) {
            var player = params['name'];
            params['name'] = player.toLocaleLowerCase();
            params['Name'] = player[0].toLocaleUpperCase() + player.substr(1).toLocaleLowerCase();
            params['NAME'] = player.toLocaleUpperCase();
        }
        // Loop through messages, replacing variables, then send the message
        messages.forEach(function (msg) {
            Object.keys(params).forEach(function (key) {
                // Escape RegExp special characters in key
                var safeKey = key.replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1');
                msg = msg.replace(new RegExp("{{" + safeKey + "}}", 'g'), params[key]);
            });
            // Allow {{ip}} if {{name}} exists and the message is "private"
            if (msg.startsWith('/') && params['name']) {
                msg = msg.replace(/{{ip}}/gi, _this.world.getPlayer(params['name']).getIP());
            }
            _this.world.send(msg);
        });
    };
    return MessageBot;
}());
exports.MessageBot = MessageBot;

},{"../libraries/simpleevent":21,"./extension":2,"./settings":4}],2:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ajax_1 = require("../libraries/ajax");
/**
 * Extension class, created by the bot with bot.registerExtension. Should not be created directly.
 */
var MessageBotExtension = (function () {
    /**
     * Creates a new instance of the class.
     *
     * @param bot the bot to attach this extension to.
     */
    function MessageBotExtension(bot) {
        /**
         * Used to check if the bot is loaded in a browser or in a node environment.
         */
        this.isNode = !!global.process;
        this.world = bot.world;
        this.bot = bot;
        this.ajax = ajax_1.Ajax;
        this.exports = {};
    }
    /**
     * Removes the extension. All listeners should be removed here.
     */
    MessageBotExtension.prototype.uninstall = function () { };
    /**
     * Convenience method to export a property for other extensions to use.
     *
     * @param key the export name
     * @param prop the property to export
     */
    MessageBotExtension.prototype.export = function (key, prop) {
        return this.exports[key] = prop;
    };
    return MessageBotExtension;
}());
exports.MessageBotExtension = MessageBotExtension;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../libraries/ajax":12}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bot_1 = require("./bot");
exports.MessageBot = bot_1.MessageBot;
var extension_1 = require("./extension");
exports.MessageBotExtension = extension_1.MessageBotExtension;
var settings_1 = require("./settings");
exports.Settings = settings_1.Settings;

},{"./bot":1,"./extension":2,"./settings":4}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Convenience class to make saving settings easier.
 */
var Settings = (function () {
    /**
     * Creates a new instance of the Settings class. Extensions shouldn't need to use this as it is provided through ex.storage.
     *
     * @param storage the storage instance to save settings in.
     * @param prefix the prefix to save settings with.
     */
    function Settings(storage, prefix) {
        this.STORAGE_ID = 'mb_preferences';
        this.storage = storage;
        this._prefix = prefix || '';
    }
    /**
     * Gets a setting from storage, returns the fallback if the setting has not been saved.
     *
     * @param key the setting name
     * @param fallback what to return if the key wasn't found or was the wrong type.
     */
    Settings.prototype.get = function (key, fallback) {
        var items = this.storage.getObject(this.STORAGE_ID, {});
        if (typeof fallback == typeof items[this._prefix + key]) {
            return items[key];
        }
        return fallback;
    };
    /**
     * Saves a setting for future use.
     *
     * @param key the setting name to save
     * @param pref what to save.
     */
    Settings.prototype.set = function (key, pref) {
        var items = this.storage.getObject(this.STORAGE_ID, {});
        items[this._prefix + key] = pref;
        this.storage.set(this.STORAGE_ID, items);
    };
    /**
     * Removes a setting key, if it exists.
     *
     * @param key the setting name to remove.
     */
    Settings.prototype.remove = function (key) {
        var items = this.storage.getObject(this.STORAGE_ID, {});
        delete items[this._prefix + key];
        this.storage.set(this.STORAGE_ID, items);
    };
    /**
     * Removes all settings under a prefix, if set, or all settings.
     */
    Settings.prototype.removeAll = function () {
        var _this = this;
        var items = this.storage.getObject(this.STORAGE_ID, {});
        Object.keys(items).forEach(function (key) {
            if (key.startsWith(_this._prefix)) {
                delete items[key];
            }
        });
        this.storage.set(this.STORAGE_ID, items);
    };
    /**
     * Creates a new instance of the class, with a prefixed name.
     *
     * @param prefix the prefix to save settings with.
     */
    Settings.prototype.prefix = function (prefix) {
        return new Settings(this.storage, this._prefix + prefix);
    };
    return Settings;
}());
exports.Settings = Settings;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bot_1 = require("../../bot");
bot_1.MessageBot.registerExtension('console', function (ex, world) {
    if (ex.isNode || !ex.bot.getExports('ui')) {
        throw new Error("This extension should only be loaded in a browser, and must be loaded after the UI is loaded.");
    }
    var log = ex.export('log', function (message) {
        console.log(message);
    });
    function logJoins(player) {
        var message;
        if (ex.settings.get('logJoinIps', true)) {
            message = player.getName() + " (" + player.getIP() + ") joined.";
        }
        else {
            message = player.getName() + " joined.";
        }
        log(message);
    }
    world.onJoin.sub(logJoins);
    function logLeaves(player) {
        log(player.getName() + ' left');
    }
    world.onLeave.sub(logLeaves);
    function logMessages(_a) {
        var player = _a.player, message = _a.message;
        log(player.getName() + ' ' + message);
    }
    world.onMessage.sub(logMessages);
    ex.uninstall = function () {
        world.onJoin.unsub(logJoins);
        world.onLeave.unsub(logLeaves);
    };
});

},{"../../bot":3}],6:[function(require,module,exports){
"use strict";
// Handles the UI of the page, is not available in the node bot.
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
Object.defineProperty(exports, "__esModule", { value: true });
var bot_1 = require("../../bot");
var template_1 = require("./template");
var tabs_1 = require("./tabs");

bot_1.MessageBot.registerExtension('ui', function (ex) {
    if (ex.isNode) {
        throw new Error('Node bots cannot run this extension.');
    }
    ex.uninstall = function () {
        throw new Error("The UI extension cannot be removed once loaded");
    };
    // Page creation
    document.body.innerHTML = "<header class=\"header is-fixed-top\">\n    <nav class=\"nav-inverse nav has-shadow\">\n        <div class=\"nav-left\">\n            <div class=\"nav-item nav-slider-toggle\">\n                <img src=\"https://i.imgsafe.org/80a1129a36.png\">\n            </div>\n            <a class=\"nav-item is-tab nav-slider-toggle\">Menu</a>\n        </div>\n    </nav>\n</header>\n\n<div class=\"nav-slider-container\">\n    <nav class=\"nav-slider\"></nav>\n    <div class=\"is-overlay nav-slider-toggle\"></div>\n</div>\n<div id=\"container\" class=\"has-fixed-nav\"></div>\n\n\n<div id=\"alert\" class=\"modal\">\n    <div class=\"modal-background\"></div>\n    <div class=\"modal-card\">\n        <header class=\"modal-card-head\"></header>\n        <section class=\"modal-card-body\"></section>\n        <footer class=\"modal-card-foot\"></footer>\n    </div>\n</div>\n";
    // Bulma tries to make this scroll
    var el = document.createElement('style');
    el.textContent = "/*! bulma.io v0.4.1 | MIT License | github.com/jgthms/bulma */@keyframes spinAround{from{transform:rotate(0deg)}to{transform:rotate(359deg)}}/*! minireset.css v0.0.2 | MIT License | github.com/jgthms/minireset.css */html,body,p,ol,ul,li,dl,dt,dd,blockquote,figure,fieldset,legend,textarea,pre,iframe,hr,h1,h2,h3,h4,h5,h6{margin:0;padding:0}h1,h2,h3,h4,h5,h6{font-size:100%;font-weight:normal}ul{list-style:none}button,input,select,textarea{margin:0}html{box-sizing:border-box}*{box-sizing:inherit}*:before,*:after{box-sizing:inherit}img,embed,object,audio,video{height:auto;max-width:100%}iframe{border:0}table{border-collapse:collapse;border-spacing:0}td,th{padding:0;text-align:left}html{background-color:#fff;font-size:16px;-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;min-width:300px;overflow-x:hidden;overflow-y:scroll;text-rendering:optimizeLegibility}article,aside,figure,footer,header,hgroup,section{display:block}body,button,input,select,textarea{font-family:BlinkMacSystemFont,-apple-system,\"Segoe UI\",\"Roboto\",\"Oxygen\",\"Ubuntu\",\"Cantarell\",\"Fira Sans\",\"Droid Sans\",\"Helvetica Neue\",\"Helvetica\",\"Arial\",sans-serif}code,pre{-moz-osx-font-smoothing:auto;-webkit-font-smoothing:auto;font-family:monospace}body{color:#4a4a4a;font-size:1rem;font-weight:400;line-height:1.5}a{color:#182b73;cursor:pointer;text-decoration:none;transition:none 86ms ease-out}a:hover{color:#363636}code{background-color:#f5f5f5;color:red;font-size:0.8em;font-weight:normal;padding:0.25em 0.5em 0.25em}hr{background-color:#dbdbdb;border:none;display:block;height:1px;margin:1.5rem 0}img{max-width:100%}input[type=\"checkbox\"],input[type=\"radio\"]{vertical-align:baseline}small{font-size:0.8em}span{font-style:inherit;font-weight:inherit}strong{color:#363636;font-weight:700}pre{background-color:#f5f5f5;color:#4a4a4a;font-size:0.8em;white-space:pre;word-wrap:normal}pre code{-webkit-overflow-scrolling:touch;background:none;color:inherit;display:block;font-size:1em;overflow-x:auto;padding:1.25rem 1.5rem}table{width:100%}table td,table th{text-align:left;vertical-align:top}table th{color:#363636}.is-block{display:block}@media screen and (max-width: 768px){.is-block-mobile{display:block !important}}@media screen and (min-width: 769px), print{.is-block-tablet{display:block !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-block-tablet-only{display:block !important}}@media screen and (max-width: 999px){.is-block-touch{display:block !important}}@media screen and (min-width: 1000px){.is-block-desktop{display:block !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-block-desktop-only{display:block !important}}@media screen and (min-width: 1192px){.is-block-widescreen{display:block !important}}.is-flex{display:flex}@media screen and (max-width: 768px){.is-flex-mobile{display:flex !important}}@media screen and (min-width: 769px), print{.is-flex-tablet{display:flex !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-flex-tablet-only{display:flex !important}}@media screen and (max-width: 999px){.is-flex-touch{display:flex !important}}@media screen and (min-width: 1000px){.is-flex-desktop{display:flex !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-flex-desktop-only{display:flex !important}}@media screen and (min-width: 1192px){.is-flex-widescreen{display:flex !important}}.is-inline{display:inline}@media screen and (max-width: 768px){.is-inline-mobile{display:inline !important}}@media screen and (min-width: 769px), print{.is-inline-tablet{display:inline !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-tablet-only{display:inline !important}}@media screen and (max-width: 999px){.is-inline-touch{display:inline !important}}@media screen and (min-width: 1000px){.is-inline-desktop{display:inline !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-desktop-only{display:inline !important}}@media screen and (min-width: 1192px){.is-inline-widescreen{display:inline !important}}.is-inline-block{display:inline-block}@media screen and (max-width: 768px){.is-inline-block-mobile{display:inline-block !important}}@media screen and (min-width: 769px), print{.is-inline-block-tablet{display:inline-block !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-block-tablet-only{display:inline-block !important}}@media screen and (max-width: 999px){.is-inline-block-touch{display:inline-block !important}}@media screen and (min-width: 1000px){.is-inline-block-desktop{display:inline-block !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-block-desktop-only{display:inline-block !important}}@media screen and (min-width: 1192px){.is-inline-block-widescreen{display:inline-block !important}}.is-inline-flex{display:inline-flex}@media screen and (max-width: 768px){.is-inline-flex-mobile{display:inline-flex !important}}@media screen and (min-width: 769px), print{.is-inline-flex-tablet{display:inline-flex !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-inline-flex-tablet-only{display:inline-flex !important}}@media screen and (max-width: 999px){.is-inline-flex-touch{display:inline-flex !important}}@media screen and (min-width: 1000px){.is-inline-flex-desktop{display:inline-flex !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-inline-flex-desktop-only{display:inline-flex !important}}@media screen and (min-width: 1192px){.is-inline-flex-widescreen{display:inline-flex !important}}.is-clearfix:after{clear:both;content:\" \";display:table}.is-pulled-left{float:left}.is-pulled-right{float:right}.is-clipped{overflow:hidden !important}.is-overlay{bottom:0;left:0;position:absolute;right:0;top:0}.has-text-centered{text-align:center}.has-text-left{text-align:left}.has-text-right{text-align:right}.has-text-white{color:#fff}a.has-text-white:hover,a.has-text-white:focus{color:#e6e6e6}.has-text-black{color:#0a0a0a}a.has-text-black:hover,a.has-text-black:focus{color:#000}.has-text-light{color:#f5f5f5}a.has-text-light:hover,a.has-text-light:focus{color:#dbdbdb}.has-text-dark{color:#363636}a.has-text-dark:hover,a.has-text-dark:focus{color:#1c1c1c}.has-text-primary{color:#182b73}a.has-text-primary:hover,a.has-text-primary:focus{color:#0f1b49}.has-text-info{color:#3273dc}a.has-text-info:hover,a.has-text-info:focus{color:#205bbc}.has-text-success{color:#23d160}a.has-text-success:hover,a.has-text-success:focus{color:#1ca64c}.has-text-warning{color:#ffdd57}a.has-text-warning:hover,a.has-text-warning:focus{color:#ffd324}.has-text-danger{color:red}a.has-text-danger:hover,a.has-text-danger:focus{color:#c00}.is-hidden{display:none !important}@media screen and (max-width: 768px){.is-hidden-mobile{display:none !important}}@media screen and (min-width: 769px), print{.is-hidden-tablet{display:none !important}}@media screen and (min-width: 769px) and (max-width: 999px){.is-hidden-tablet-only{display:none !important}}@media screen and (max-width: 999px){.is-hidden-touch{display:none !important}}@media screen and (min-width: 1000px){.is-hidden-desktop{display:none !important}}@media screen and (min-width: 1000px) and (max-width: 1191px){.is-hidden-desktop-only{display:none !important}}@media screen and (min-width: 1192px){.is-hidden-widescreen{display:none !important}}.is-marginless{margin:0 !important}.is-paddingless{padding:0 !important}.is-unselectable{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.box{background-color:#fff;border-radius:5px;box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px rgba(10,10,10,0.1);display:block;padding:1.25rem}.box:not(:last-child){margin-bottom:1.5rem}a.box:hover,a.box:focus{box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px #182b73}a.box:active{box-shadow:inset 0 1px 2px rgba(10,10,10,0.2),0 0 0 1px #182b73}.button{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:1px solid transparent;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.25em;justify-content:flex-start;line-height:1.5;padding-bottom:calc(0.375em - 1px);padding-left:calc(0.625em - 1px);padding-right:calc(0.625em - 1px);padding-top:calc(0.375em - 1px);position:relative;vertical-align:top;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;background-color:#fff;border-color:#dbdbdb;color:#363636;cursor:pointer;justify-content:center;padding-left:0.75em;padding-right:0.75em;text-align:center;white-space:nowrap}.button:focus,.button.is-focused,.button:active,.button.is-active{outline:none}.button[disabled]{cursor:not-allowed}.button strong{color:inherit}.button .icon,.button .icon.is-small,.button .icon.is-medium,.button .icon.is-large{height:1.5em;width:1.5em}.button .icon:first-child:not(:last-child){margin-left:calc(-0.375em - 1px);margin-right:0.1875em}.button .icon:last-child:not(:first-child){margin-left:0.1875em;margin-right:calc(-0.375em - 1px)}.button .icon:first-child:last-child{margin-left:calc(-0.375em - 1px);margin-right:calc(-0.375em - 1px)}.button:hover,.button.is-hovered{border-color:#b5b5b5;color:#363636}.button:focus,.button.is-focused{border-color:#182b73;box-shadow:0 0 0.5em rgba(24,43,115,0.25);color:#363636}.button:active,.button.is-active{border-color:#4a4a4a;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#363636}.button.is-link{background-color:transparent;border-color:transparent;color:#4a4a4a;text-decoration:underline}.button.is-link:hover,.button.is-link.is-hovered,.button.is-link:focus,.button.is-link.is-focused,.button.is-link:active,.button.is-link.is-active{background-color:#f5f5f5;color:#363636}.button.is-link[disabled]{background-color:transparent;border-color:transparent;box-shadow:none}.button.is-white{background-color:#fff;border-color:transparent;color:#0a0a0a}.button.is-white:hover,.button.is-white.is-hovered{background-color:#f9f9f9;border-color:transparent;color:#0a0a0a}.button.is-white:focus,.button.is-white.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,255,255,0.25);color:#0a0a0a}.button.is-white:active,.button.is-white.is-active{background-color:#f2f2f2;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#0a0a0a}.button.is-white[disabled]{background-color:#fff;border-color:transparent;box-shadow:none}.button.is-white.is-inverted{background-color:#0a0a0a;color:#fff}.button.is-white.is-inverted:hover{background-color:#000}.button.is-white.is-inverted[disabled]{background-color:#0a0a0a;border-color:transparent;box-shadow:none;color:#fff}.button.is-white.is-loading:after{border-color:transparent transparent #0a0a0a #0a0a0a !important}.button.is-white.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-white.is-outlined:hover,.button.is-white.is-outlined:focus{background-color:#fff;border-color:#fff;color:#0a0a0a}.button.is-white.is-outlined.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-white.is-outlined[disabled]{background-color:transparent;border-color:#fff;box-shadow:none;color:#fff}.button.is-white.is-inverted.is-outlined{background-color:transparent;border-color:#0a0a0a;color:#0a0a0a}.button.is-white.is-inverted.is-outlined:hover,.button.is-white.is-inverted.is-outlined:focus{background-color:#0a0a0a;color:#fff}.button.is-white.is-inverted.is-outlined[disabled]{background-color:transparent;border-color:#0a0a0a;box-shadow:none;color:#0a0a0a}.button.is-black{background-color:#0a0a0a;border-color:transparent;color:#fff}.button.is-black:hover,.button.is-black.is-hovered{background-color:#040404;border-color:transparent;color:#fff}.button.is-black:focus,.button.is-black.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(10,10,10,0.25);color:#fff}.button.is-black:active,.button.is-black.is-active{background-color:#000;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-black[disabled]{background-color:#0a0a0a;border-color:transparent;box-shadow:none}.button.is-black.is-inverted{background-color:#fff;color:#0a0a0a}.button.is-black.is-inverted:hover{background-color:#f2f2f2}.button.is-black.is-inverted[disabled]{background-color:#fff;border-color:transparent;box-shadow:none;color:#0a0a0a}.button.is-black.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-black.is-outlined{background-color:transparent;border-color:#0a0a0a;color:#0a0a0a}.button.is-black.is-outlined:hover,.button.is-black.is-outlined:focus{background-color:#0a0a0a;border-color:#0a0a0a;color:#fff}.button.is-black.is-outlined.is-loading:after{border-color:transparent transparent #0a0a0a #0a0a0a !important}.button.is-black.is-outlined[disabled]{background-color:transparent;border-color:#0a0a0a;box-shadow:none;color:#0a0a0a}.button.is-black.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-black.is-inverted.is-outlined:hover,.button.is-black.is-inverted.is-outlined:focus{background-color:#fff;color:#0a0a0a}.button.is-black.is-inverted.is-outlined[disabled]{background-color:transparent;border-color:#fff;box-shadow:none;color:#fff}.button.is-light{background-color:#f5f5f5;border-color:transparent;color:#363636}.button.is-light:hover,.button.is-light.is-hovered{background-color:#eee;border-color:transparent;color:#363636}.button.is-light:focus,.button.is-light.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(245,245,245,0.25);color:#363636}.button.is-light:active,.button.is-light.is-active{background-color:#e8e8e8;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#363636}.button.is-light[disabled]{background-color:#f5f5f5;border-color:transparent;box-shadow:none}.button.is-light.is-inverted{background-color:#363636;color:#f5f5f5}.button.is-light.is-inverted:hover{background-color:#292929}.button.is-light.is-inverted[disabled]{background-color:#363636;border-color:transparent;box-shadow:none;color:#f5f5f5}.button.is-light.is-loading:after{border-color:transparent transparent #363636 #363636 !important}.button.is-light.is-outlined{background-color:transparent;border-color:#f5f5f5;color:#f5f5f5}.button.is-light.is-outlined:hover,.button.is-light.is-outlined:focus{background-color:#f5f5f5;border-color:#f5f5f5;color:#363636}.button.is-light.is-outlined.is-loading:after{border-color:transparent transparent #f5f5f5 #f5f5f5 !important}.button.is-light.is-outlined[disabled]{background-color:transparent;border-color:#f5f5f5;box-shadow:none;color:#f5f5f5}.button.is-light.is-inverted.is-outlined{background-color:transparent;border-color:#363636;color:#363636}.button.is-light.is-inverted.is-outlined:hover,.button.is-light.is-inverted.is-outlined:focus{background-color:#363636;color:#f5f5f5}.button.is-light.is-inverted.is-outlined[disabled]{background-color:transparent;border-color:#363636;box-shadow:none;color:#363636}.button.is-dark{background-color:#363636;border-color:transparent;color:#f5f5f5}.button.is-dark:hover,.button.is-dark.is-hovered{background-color:#2f2f2f;border-color:transparent;color:#f5f5f5}.button.is-dark:focus,.button.is-dark.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(54,54,54,0.25);color:#f5f5f5}.button.is-dark:active,.button.is-dark.is-active{background-color:#292929;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#f5f5f5}.button.is-dark[disabled]{background-color:#363636;border-color:transparent;box-shadow:none}.button.is-dark.is-inverted{background-color:#f5f5f5;color:#363636}.button.is-dark.is-inverted:hover{background-color:#e8e8e8}.button.is-dark.is-inverted[disabled]{background-color:#f5f5f5;border-color:transparent;box-shadow:none;color:#363636}.button.is-dark.is-loading:after{border-color:transparent transparent #f5f5f5 #f5f5f5 !important}.button.is-dark.is-outlined{background-color:transparent;border-color:#363636;color:#363636}.button.is-dark.is-outlined:hover,.button.is-dark.is-outlined:focus{background-color:#363636;border-color:#363636;color:#f5f5f5}.button.is-dark.is-outlined.is-loading:after{border-color:transparent transparent #363636 #363636 !important}.button.is-dark.is-outlined[disabled]{background-color:transparent;border-color:#363636;box-shadow:none;color:#363636}.button.is-dark.is-inverted.is-outlined{background-color:transparent;border-color:#f5f5f5;color:#f5f5f5}.button.is-dark.is-inverted.is-outlined:hover,.button.is-dark.is-inverted.is-outlined:focus{background-color:#f5f5f5;color:#363636}.button.is-dark.is-inverted.is-outlined[disabled]{background-color:transparent;border-color:#f5f5f5;box-shadow:none;color:#f5f5f5}.button.is-primary{background-color:#182b73;border-color:transparent;color:#fff}.button.is-primary:hover,.button.is-primary.is-hovered{background-color:#162768;border-color:transparent;color:#fff}.button.is-primary:focus,.button.is-primary.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(24,43,115,0.25);color:#fff}.button.is-primary:active,.button.is-primary.is-active{background-color:#14235e;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-primary[disabled]{background-color:#182b73;border-color:transparent;box-shadow:none}.button.is-primary.is-inverted{background-color:#fff;color:#182b73}.button.is-primary.is-inverted:hover{background-color:#f2f2f2}.button.is-primary.is-inverted[disabled]{background-color:#fff;border-color:transparent;box-shadow:none;color:#182b73}.button.is-primary.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-primary.is-outlined{background-color:transparent;border-color:#182b73;color:#182b73}.button.is-primary.is-outlined:hover,.button.is-primary.is-outlined:focus{background-color:#182b73;border-color:#182b73;color:#fff}.button.is-primary.is-outlined.is-loading:after{border-color:transparent transparent #182b73 #182b73 !important}.button.is-primary.is-outlined[disabled]{background-color:transparent;border-color:#182b73;box-shadow:none;color:#182b73}.button.is-primary.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-primary.is-inverted.is-outlined:hover,.button.is-primary.is-inverted.is-outlined:focus{background-color:#fff;color:#182b73}.button.is-primary.is-inverted.is-outlined[disabled]{background-color:transparent;border-color:#fff;box-shadow:none;color:#fff}.button.is-info{background-color:#3273dc;border-color:transparent;color:#fff}.button.is-info:hover,.button.is-info.is-hovered{background-color:#276cda;border-color:transparent;color:#fff}.button.is-info:focus,.button.is-info.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(50,115,220,0.25);color:#fff}.button.is-info:active,.button.is-info.is-active{background-color:#2366d1;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-info[disabled]{background-color:#3273dc;border-color:transparent;box-shadow:none}.button.is-info.is-inverted{background-color:#fff;color:#3273dc}.button.is-info.is-inverted:hover{background-color:#f2f2f2}.button.is-info.is-inverted[disabled]{background-color:#fff;border-color:transparent;box-shadow:none;color:#3273dc}.button.is-info.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-info.is-outlined{background-color:transparent;border-color:#3273dc;color:#3273dc}.button.is-info.is-outlined:hover,.button.is-info.is-outlined:focus{background-color:#3273dc;border-color:#3273dc;color:#fff}.button.is-info.is-outlined.is-loading:after{border-color:transparent transparent #3273dc #3273dc !important}.button.is-info.is-outlined[disabled]{background-color:transparent;border-color:#3273dc;box-shadow:none;color:#3273dc}.button.is-info.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-info.is-inverted.is-outlined:hover,.button.is-info.is-inverted.is-outlined:focus{background-color:#fff;color:#3273dc}.button.is-info.is-inverted.is-outlined[disabled]{background-color:transparent;border-color:#fff;box-shadow:none;color:#fff}.button.is-success{background-color:#23d160;border-color:transparent;color:#fff}.button.is-success:hover,.button.is-success.is-hovered{background-color:#22c65b;border-color:transparent;color:#fff}.button.is-success:focus,.button.is-success.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(35,209,96,0.25);color:#fff}.button.is-success:active,.button.is-success.is-active{background-color:#20bc56;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-success[disabled]{background-color:#23d160;border-color:transparent;box-shadow:none}.button.is-success.is-inverted{background-color:#fff;color:#23d160}.button.is-success.is-inverted:hover{background-color:#f2f2f2}.button.is-success.is-inverted[disabled]{background-color:#fff;border-color:transparent;box-shadow:none;color:#23d160}.button.is-success.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-success.is-outlined{background-color:transparent;border-color:#23d160;color:#23d160}.button.is-success.is-outlined:hover,.button.is-success.is-outlined:focus{background-color:#23d160;border-color:#23d160;color:#fff}.button.is-success.is-outlined.is-loading:after{border-color:transparent transparent #23d160 #23d160 !important}.button.is-success.is-outlined[disabled]{background-color:transparent;border-color:#23d160;box-shadow:none;color:#23d160}.button.is-success.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-success.is-inverted.is-outlined:hover,.button.is-success.is-inverted.is-outlined:focus{background-color:#fff;color:#23d160}.button.is-success.is-inverted.is-outlined[disabled]{background-color:transparent;border-color:#fff;box-shadow:none;color:#fff}.button.is-warning{background-color:#ffdd57;border-color:transparent;color:rgba(0,0,0,0.7)}.button.is-warning:hover,.button.is-warning.is-hovered{background-color:#ffdb4a;border-color:transparent;color:rgba(0,0,0,0.7)}.button.is-warning:focus,.button.is-warning.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,221,87,0.25);color:rgba(0,0,0,0.7)}.button.is-warning:active,.button.is-warning.is-active{background-color:#ffd83d;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:rgba(0,0,0,0.7)}.button.is-warning[disabled]{background-color:#ffdd57;border-color:transparent;box-shadow:none}.button.is-warning.is-inverted{background-color:rgba(0,0,0,0.7);color:#ffdd57}.button.is-warning.is-inverted:hover{background-color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted[disabled]{background-color:rgba(0,0,0,0.7);border-color:transparent;box-shadow:none;color:#ffdd57}.button.is-warning.is-loading:after{border-color:transparent transparent rgba(0,0,0,0.7) rgba(0,0,0,0.7) !important}.button.is-warning.is-outlined{background-color:transparent;border-color:#ffdd57;color:#ffdd57}.button.is-warning.is-outlined:hover,.button.is-warning.is-outlined:focus{background-color:#ffdd57;border-color:#ffdd57;color:rgba(0,0,0,0.7)}.button.is-warning.is-outlined.is-loading:after{border-color:transparent transparent #ffdd57 #ffdd57 !important}.button.is-warning.is-outlined[disabled]{background-color:transparent;border-color:#ffdd57;box-shadow:none;color:#ffdd57}.button.is-warning.is-inverted.is-outlined{background-color:transparent;border-color:rgba(0,0,0,0.7);color:rgba(0,0,0,0.7)}.button.is-warning.is-inverted.is-outlined:hover,.button.is-warning.is-inverted.is-outlined:focus{background-color:rgba(0,0,0,0.7);color:#ffdd57}.button.is-warning.is-inverted.is-outlined[disabled]{background-color:transparent;border-color:rgba(0,0,0,0.7);box-shadow:none;color:rgba(0,0,0,0.7)}.button.is-danger{background-color:red;border-color:transparent;color:#fff}.button.is-danger:hover,.button.is-danger.is-hovered{background-color:#f20000;border-color:transparent;color:#fff}.button.is-danger:focus,.button.is-danger.is-focused{border-color:transparent;box-shadow:0 0 0.5em rgba(255,0,0,0.25);color:#fff}.button.is-danger:active,.button.is-danger.is-active{background-color:#e60000;border-color:transparent;box-shadow:inset 0 1px 2px rgba(10,10,10,0.2);color:#fff}.button.is-danger[disabled]{background-color:red;border-color:transparent;box-shadow:none}.button.is-danger.is-inverted{background-color:#fff;color:red}.button.is-danger.is-inverted:hover{background-color:#f2f2f2}.button.is-danger.is-inverted[disabled]{background-color:#fff;border-color:transparent;box-shadow:none;color:red}.button.is-danger.is-loading:after{border-color:transparent transparent #fff #fff !important}.button.is-danger.is-outlined{background-color:transparent;border-color:red;color:red}.button.is-danger.is-outlined:hover,.button.is-danger.is-outlined:focus{background-color:red;border-color:red;color:#fff}.button.is-danger.is-outlined.is-loading:after{border-color:transparent transparent red red !important}.button.is-danger.is-outlined[disabled]{background-color:transparent;border-color:red;box-shadow:none;color:red}.button.is-danger.is-inverted.is-outlined{background-color:transparent;border-color:#fff;color:#fff}.button.is-danger.is-inverted.is-outlined:hover,.button.is-danger.is-inverted.is-outlined:focus{background-color:#fff;color:red}.button.is-danger.is-inverted.is-outlined[disabled]{background-color:transparent;border-color:#fff;box-shadow:none;color:#fff}.button.is-small{border-radius:2px;font-size:.75rem}.button.is-medium{font-size:1.25rem}.button.is-large{font-size:1.5rem}.button[disabled]{background-color:#fff;border-color:#dbdbdb;box-shadow:none;opacity:0.5}.button.is-fullwidth{display:flex;width:100%}.button.is-loading{color:transparent !important;pointer-events:none}.button.is-loading:after{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1em;position:relative;width:1em;position:absolute;left:calc(50% - (1em / 2));top:calc(50% - (1em / 2));position:absolute !important}button.button,input[type=\"submit\"].button{line-height:1;padding-bottom:0.4em;padding-top:0.35em}.content{color:#4a4a4a}.content:not(:last-child){margin-bottom:1.5rem}.content li+li{margin-top:0.25em}.content p:not(:last-child),.content dl:not(:last-child),.content ol:not(:last-child),.content ul:not(:last-child),.content blockquote:not(:last-child),.content pre:not(:last-child),.content table:not(:last-child){margin-bottom:1em}.content h1,.content h2,.content h3,.content h4,.content h5,.content h6{color:#363636;font-weight:400;line-height:1.125}.content h1{font-size:2em;margin-bottom:0.5em}.content h1:not(:first-child){margin-top:1em}.content h2{font-size:1.75em;margin-bottom:0.5714em}.content h2:not(:first-child){margin-top:1.1428em}.content h3{font-size:1.5em;margin-bottom:0.6666em}.content h3:not(:first-child){margin-top:1.3333em}.content h4{font-size:1.25em;margin-bottom:0.8em}.content h5{font-size:1.125em;margin-bottom:0.8888em}.content h6{font-size:1em;margin-bottom:1em}.content blockquote{background-color:#f5f5f5;border-left:5px solid #dbdbdb;padding:1.25em 1.5em}.content ol{list-style:decimal outside;margin-left:2em;margin-right:2em;margin-top:1em}.content ul{list-style:disc outside;margin-left:2em;margin-right:2em;margin-top:1em}.content ul ul{list-style-type:circle;margin-top:0.5em}.content ul ul ul{list-style-type:square}.content dd{margin-left:2em}.content pre{-webkit-overflow-scrolling:touch;overflow-x:auto;padding:1.25em 1.5em;white-space:pre;word-wrap:normal}.content table{width:100%}.content table td,.content table th{border:1px solid #dbdbdb;border-width:0 0 1px;padding:0.5em 0.75em;vertical-align:top}.content table th{color:#363636;text-align:left}.content table tr:hover{background-color:#f5f5f5}.content table thead td,.content table thead th{border-width:0 0 2px;color:#363636}.content table tfoot td,.content table tfoot th{border-width:2px 0 0;color:#363636}.content table tbody tr:last-child td,.content table tbody tr:last-child th{border-bottom-width:0}.content.is-small{font-size:.75rem}.content.is-medium{font-size:1.25rem}.content.is-large{font-size:1.5rem}.input,.textarea{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:1px solid transparent;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.25em;justify-content:flex-start;line-height:1.5;padding-bottom:calc(0.375em - 1px);padding-left:calc(0.625em - 1px);padding-right:calc(0.625em - 1px);padding-top:calc(0.375em - 1px);position:relative;vertical-align:top;background-color:#fff;border-color:#dbdbdb;color:#363636;box-shadow:inset 0 1px 2px rgba(10,10,10,0.1);max-width:100%;width:100%}.input:focus,.input.is-focused,.input:active,.input.is-active,.textarea:focus,.textarea.is-focused,.textarea:active,.textarea.is-active{outline:none}.input[disabled],.textarea[disabled]{cursor:not-allowed}.input:hover,.input.is-hovered,.textarea:hover,.textarea.is-hovered{border-color:#b5b5b5}.input:focus,.input.is-focused,.input:active,.input.is-active,.textarea:focus,.textarea.is-focused,.textarea:active,.textarea.is-active{border-color:#182b73}.input[disabled],.textarea[disabled]{background-color:#f5f5f5;border-color:#f5f5f5;box-shadow:none;color:#7a7a7a}.input[disabled]::-moz-placeholder,.textarea[disabled]::-moz-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]::-webkit-input-placeholder,.textarea[disabled]::-webkit-input-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]:-moz-placeholder,.textarea[disabled]:-moz-placeholder{color:rgba(54,54,54,0.3)}.input[disabled]:-ms-input-placeholder,.textarea[disabled]:-ms-input-placeholder{color:rgba(54,54,54,0.3)}.input[type=\"search\"],.textarea[type=\"search\"]{border-radius:290486px}.input.is-white,.textarea.is-white{border-color:#fff}.input.is-black,.textarea.is-black{border-color:#0a0a0a}.input.is-light,.textarea.is-light{border-color:#f5f5f5}.input.is-dark,.textarea.is-dark{border-color:#363636}.input.is-primary,.textarea.is-primary{border-color:#182b73}.input.is-info,.textarea.is-info{border-color:#3273dc}.input.is-success,.textarea.is-success{border-color:#23d160}.input.is-warning,.textarea.is-warning{border-color:#ffdd57}.input.is-danger,.textarea.is-danger{border-color:red}.input.is-small,.textarea.is-small{border-radius:2px;font-size:.75rem}.input.is-medium,.textarea.is-medium{font-size:1.25rem}.input.is-large,.textarea.is-large{font-size:1.5rem}.input.is-fullwidth,.textarea.is-fullwidth{display:block;width:100%}.input.is-inline,.textarea.is-inline{display:inline;width:auto}.textarea{display:block;max-height:600px;max-width:100%;min-height:120px;min-width:100%;padding:0.625em;resize:vertical}.checkbox,.radio{cursor:pointer;display:inline-block;line-height:1.25;position:relative}.checkbox input,.radio input{cursor:pointer}.checkbox:hover,.radio:hover{color:#363636}.checkbox[disabled],.radio[disabled]{color:#7a7a7a;cursor:not-allowed}.radio+.radio{margin-left:0.5em}.select{display:inline-block;height:2.25em;position:relative;vertical-align:top}.select:after{border:1px solid #182b73;border-right:0;border-top:0;content:\" \";display:block;height:0.5em;pointer-events:none;position:absolute;transform:rotate(-45deg);width:0.5em;margin-top:-0.375em;right:1.125em;top:50%;z-index:4}.select select{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:1px solid transparent;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.25em;justify-content:flex-start;line-height:1.5;padding-bottom:calc(0.375em - 1px);padding-left:calc(0.625em - 1px);padding-right:calc(0.625em - 1px);padding-top:calc(0.375em - 1px);position:relative;vertical-align:top;background-color:#fff;border-color:#dbdbdb;color:#363636;cursor:pointer;display:block;font-size:1em;outline:none;padding-right:2.5em}.select select:focus,.select select.is-focused,.select select:active,.select select.is-active{outline:none}.select select[disabled]{cursor:not-allowed}.select select:hover,.select select.is-hovered{border-color:#b5b5b5}.select select:focus,.select select.is-focused,.select select:active,.select select.is-active{border-color:#182b73}.select select[disabled]{background-color:#f5f5f5;border-color:#f5f5f5;box-shadow:none;color:#7a7a7a}.select select[disabled]::-moz-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]::-webkit-input-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]:-moz-placeholder{color:rgba(54,54,54,0.3)}.select select[disabled]:-ms-input-placeholder{color:rgba(54,54,54,0.3)}.select select:hover{border-color:#b5b5b5}.select select::-ms-expand{display:none}.select select[disabled]:hover{border-color:#f5f5f5}.select:hover:after{border-color:#363636}.select.is-white select{border-color:#fff}.select.is-black select{border-color:#0a0a0a}.select.is-light select{border-color:#f5f5f5}.select.is-dark select{border-color:#363636}.select.is-primary select{border-color:#182b73}.select.is-info select{border-color:#3273dc}.select.is-success select{border-color:#23d160}.select.is-warning select{border-color:#ffdd57}.select.is-danger select{border-color:red}.select.is-small{border-radius:2px;font-size:.75rem}.select.is-medium{font-size:1.25rem}.select.is-large{font-size:1.5rem}.select.is-disabled:after{border-color:#7a7a7a}.select.is-fullwidth{width:100%}.select.is-fullwidth select{width:100%}.select.is-loading:after{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1em;position:relative;width:1em;margin-top:0;position:absolute;right:0.625em;top:0.625em;transform:none}.label{color:#363636;display:block;font-size:1rem;font-weight:700}.label:not(:last-child){margin-bottom:0.5em}.label.is-small{font-size:.75rem}.label.is-medium{font-size:1.25rem}.label.is-large{font-size:1.5rem}.help{display:block;font-size:.75rem;margin-top:0.25rem}.help.is-white{color:#fff}.help.is-black{color:#0a0a0a}.help.is-light{color:#f5f5f5}.help.is-dark{color:#363636}.help.is-primary{color:#182b73}.help.is-info{color:#3273dc}.help.is-success{color:#23d160}.help.is-warning{color:#ffdd57}.help.is-danger{color:red}.field:not(:last-child){margin-bottom:0.75rem}.field.has-addons{display:flex;justify-content:flex-start}.field.has-addons .control{margin-right:-1px}.field.has-addons .control:first-child .button,.field.has-addons .control:first-child .input,.field.has-addons .control:first-child .select select{border-bottom-left-radius:3px;border-top-left-radius:3px}.field.has-addons .control:last-child .button,.field.has-addons .control:last-child .input,.field.has-addons .control:last-child .select select{border-bottom-right-radius:3px;border-top-right-radius:3px}.field.has-addons .control .button,.field.has-addons .control .input,.field.has-addons .control .select select{border-radius:0}.field.has-addons .control .button:hover,.field.has-addons .control .button.is-hovered,.field.has-addons .control .input:hover,.field.has-addons .control .input.is-hovered,.field.has-addons .control .select select:hover,.field.has-addons .control .select select.is-hovered{z-index:2}.field.has-addons .control .button:focus,.field.has-addons .control .button.is-focused,.field.has-addons .control .button:active,.field.has-addons .control .button.is-active,.field.has-addons .control .input:focus,.field.has-addons .control .input.is-focused,.field.has-addons .control .input:active,.field.has-addons .control .input.is-active,.field.has-addons .control .select select:focus,.field.has-addons .control .select select.is-focused,.field.has-addons .control .select select:active,.field.has-addons .control .select select.is-active{z-index:3}.field.has-addons .control .button:focus:hover,.field.has-addons .control .button.is-focused:hover,.field.has-addons .control .button:active:hover,.field.has-addons .control .button.is-active:hover,.field.has-addons .control .input:focus:hover,.field.has-addons .control .input.is-focused:hover,.field.has-addons .control .input:active:hover,.field.has-addons .control .input.is-active:hover,.field.has-addons .control .select select:focus:hover,.field.has-addons .control .select select.is-focused:hover,.field.has-addons .control .select select:active:hover,.field.has-addons .control .select select.is-active:hover{z-index:4}.field.has-addons .control.is-expanded{flex-grow:1;flex-shrink:0}.field.has-addons.has-addons-centered{justify-content:center}.field.has-addons.has-addons-right{justify-content:flex-end}.field.has-addons.has-addons-fullwidth .control{flex-grow:1;flex-shrink:0}.field.is-grouped{display:flex;justify-content:flex-start}.field.is-grouped>.control{flex-shrink:0}.field.is-grouped>.control:not(:last-child){margin-bottom:0;margin-right:0.75rem}.field.is-grouped>.control.is-expanded{flex-grow:1;flex-shrink:1}.field.is-grouped.is-grouped-centered{justify-content:center}.field.is-grouped.is-grouped-right{justify-content:flex-end}@media screen and (min-width: 769px), print{.field.is-horizontal{display:flex}}.field-label .label{font-size:inherit}@media screen and (max-width: 768px){.field-label{margin-bottom:0.5rem}}@media screen and (min-width: 769px), print{.field-label{flex-basis:0;flex-grow:1;flex-shrink:0;margin-right:1.5rem;text-align:right}.field-label.is-small{font-size:.75rem;padding-top:0.375em}.field-label.is-normal{padding-top:0.375em}.field-label.is-medium{font-size:1.25rem;padding-top:0.375em}.field-label.is-large{font-size:1.5rem;padding-top:0.375em}}@media screen and (min-width: 769px), print{.field-body{display:flex;flex-basis:0;flex-grow:5;flex-shrink:1}.field-body .field{flex-shrink:1}.field-body .field:not(.is-narrow){flex-grow:1}.field-body .field:not(:last-child){margin-bottom:0;margin-right:0.75rem}}.control{font-size:1rem;position:relative;text-align:left}.control.has-icon .icon{color:#dbdbdb;height:2.25em;pointer-events:none;position:absolute;top:0;width:2.25em;z-index:4}.control.has-icon .input:focus+.icon{color:#7a7a7a}.control.has-icon .input.is-small+.icon{font-size:.75rem}.control.has-icon .input.is-medium+.icon{font-size:1.25rem}.control.has-icon .input.is-large+.icon{font-size:1.5rem}.control.has-icon:not(.has-icon-right) .icon{left:0}.control.has-icon:not(.has-icon-right) .input{padding-left:2.25em}.control.has-icon.has-icon-right .icon{right:0}.control.has-icon.has-icon-right .input{padding-right:2.25em}.control.has-icons-left .input:focus ~ .icon,.control.has-icons-right .input:focus ~ .icon{color:#7a7a7a}.control.has-icons-left .input.is-small ~ .icon,.control.has-icons-right .input.is-small ~ .icon{font-size:.75rem}.control.has-icons-left .input.is-medium ~ .icon,.control.has-icons-right .input.is-medium ~ .icon{font-size:1.25rem}.control.has-icons-left .input.is-large ~ .icon,.control.has-icons-right .input.is-large ~ .icon{font-size:1.5rem}.control.has-icons-left .icon,.control.has-icons-right .icon{color:#dbdbdb;height:2.25em;pointer-events:none;position:absolute;top:0;width:2.25em;z-index:4}.control.has-icons-left .input{padding-left:2.25em}.control.has-icons-left .icon.is-left{left:0}.control.has-icons-right .input{padding-right:2.25em}.control.has-icons-right .icon.is-right{right:0}.control.is-loading:after{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1em;position:relative;width:1em;position:absolute !important;right:0.625em;top:0.625em}.icon{align-items:center;display:inline-flex;justify-content:center;height:1.5rem;width:1.5rem}.icon .fa{font-size:21px}.icon.is-small{height:1rem;width:1rem}.icon.is-small .fa{font-size:14px}.icon.is-medium{height:2rem;width:2rem}.icon.is-medium .fa{font-size:28px}.icon.is-large{height:3rem;width:3rem}.icon.is-large .fa{font-size:42px}.image{display:block;position:relative}.image img{display:block;height:auto;width:100%}.image.is-square img,.image.is-1by1 img,.image.is-4by3 img,.image.is-3by2 img,.image.is-16by9 img,.image.is-2by1 img{bottom:0;left:0;position:absolute;right:0;top:0;height:100%;width:100%}.image.is-square,.image.is-1by1{padding-top:100%}.image.is-4by3{padding-top:75%}.image.is-3by2{padding-top:66.6666%}.image.is-16by9{padding-top:56.25%}.image.is-2by1{padding-top:50%}.image.is-16x16{height:16px;width:16px}.image.is-24x24{height:24px;width:24px}.image.is-32x32{height:32px;width:32px}.image.is-48x48{height:48px;width:48px}.image.is-64x64{height:64px;width:64px}.image.is-96x96{height:96px;width:96px}.image.is-128x128{height:128px;width:128px}.notification{background-color:#f5f5f5;border-radius:3px;padding:1.25rem 2.5rem 1.25rem 1.5rem;position:relative}.notification:not(:last-child){margin-bottom:1.5rem}.notification a:not(.button){color:currentColor;text-decoration:underline}.notification code,.notification pre{background:#fff}.notification pre code{background:transparent}.notification>.delete{position:absolute;right:0.5em;top:0.5em}.notification .title,.notification .subtitle,.notification .content{color:inherit}.notification.is-white{background-color:#fff;color:#0a0a0a}.notification.is-black{background-color:#0a0a0a;color:#fff}.notification.is-light{background-color:#f5f5f5;color:#363636}.notification.is-dark{background-color:#363636;color:#f5f5f5}.notification.is-primary{background-color:#182b73;color:#fff}.notification.is-info{background-color:#3273dc;color:#fff}.notification.is-success{background-color:#23d160;color:#fff}.notification.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.notification.is-danger{background-color:red;color:#fff}.progress{-moz-appearance:none;-webkit-appearance:none;border:none;border-radius:290486px;display:block;height:1rem;overflow:hidden;padding:0;width:100%}.progress:not(:last-child){margin-bottom:1.5rem}.progress::-webkit-progress-bar{background-color:#dbdbdb}.progress::-webkit-progress-value{background-color:#4a4a4a}.progress::-moz-progress-bar{background-color:#4a4a4a}.progress.is-white::-webkit-progress-value{background-color:#fff}.progress.is-white::-moz-progress-bar{background-color:#fff}.progress.is-black::-webkit-progress-value{background-color:#0a0a0a}.progress.is-black::-moz-progress-bar{background-color:#0a0a0a}.progress.is-light::-webkit-progress-value{background-color:#f5f5f5}.progress.is-light::-moz-progress-bar{background-color:#f5f5f5}.progress.is-dark::-webkit-progress-value{background-color:#363636}.progress.is-dark::-moz-progress-bar{background-color:#363636}.progress.is-primary::-webkit-progress-value{background-color:#182b73}.progress.is-primary::-moz-progress-bar{background-color:#182b73}.progress.is-info::-webkit-progress-value{background-color:#3273dc}.progress.is-info::-moz-progress-bar{background-color:#3273dc}.progress.is-success::-webkit-progress-value{background-color:#23d160}.progress.is-success::-moz-progress-bar{background-color:#23d160}.progress.is-warning::-webkit-progress-value{background-color:#ffdd57}.progress.is-warning::-moz-progress-bar{background-color:#ffdd57}.progress.is-danger::-webkit-progress-value{background-color:red}.progress.is-danger::-moz-progress-bar{background-color:red}.progress.is-small{height:.75rem}.progress.is-medium{height:1.25rem}.progress.is-large{height:1.5rem}.table{background-color:#fff;color:#363636;margin-bottom:1.5rem;width:100%}.table td,.table th{border:1px solid #dbdbdb;border-width:0 0 1px;padding:0.5em 0.75em;vertical-align:top}.table td.is-narrow,.table th.is-narrow{white-space:nowrap;width:1%}.table th{color:#363636;text-align:left}.table tr:hover{background-color:#fafafa}.table tr.is-selected{background-color:#182b73;color:#fff}.table tr.is-selected a,.table tr.is-selected strong{color:currentColor}.table tr.is-selected td,.table tr.is-selected th{border-color:#fff;color:currentColor}.table thead td,.table thead th{border-width:0 0 2px;color:#7a7a7a}.table tfoot td,.table tfoot th{border-width:2px 0 0;color:#7a7a7a}.table tbody tr:last-child td,.table tbody tr:last-child th{border-bottom-width:0}.table.is-bordered td,.table.is-bordered th{border-width:1px}.table.is-bordered tr:last-child td,.table.is-bordered tr:last-child th{border-bottom-width:1px}.table.is-narrow td,.table.is-narrow th{padding:0.25em 0.5em}.table.is-striped tbody tr:nth-child(even){background-color:#fafafa}.table.is-striped tbody tr:nth-child(even):hover{background-color:#f5f5f5}.tag{align-items:center;background-color:#f5f5f5;border-radius:290486px;color:#4a4a4a;display:inline-flex;font-size:.75rem;height:2em;justify-content:center;line-height:1.5;padding-left:0.875em;padding-right:0.875em;white-space:nowrap}.tag .delete{margin-left:0.25em;margin-right:-0.375em}.tag.is-white{background-color:#fff;color:#0a0a0a}.tag.is-black{background-color:#0a0a0a;color:#fff}.tag.is-light{background-color:#f5f5f5;color:#363636}.tag.is-dark{background-color:#363636;color:#f5f5f5}.tag.is-primary{background-color:#182b73;color:#fff}.tag.is-info{background-color:#3273dc;color:#fff}.tag.is-success{background-color:#23d160;color:#fff}.tag.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.tag.is-danger{background-color:red;color:#fff}.tag.is-medium{font-size:1rem}.tag.is-large{font-size:1.25rem}.title,.subtitle{word-break:break-word}.title:not(:last-child),.subtitle:not(:last-child){margin-bottom:1.5rem}.title em,.title span,.subtitle em,.subtitle span{font-weight:300}.title strong,.subtitle strong{font-weight:500}.title .tag,.subtitle .tag{vertical-align:middle}.title{color:#363636;font-size:2rem;font-weight:300;line-height:1.125}.title strong{color:inherit}.title+.highlight{margin-top:-0.75rem}.title:not(.is-spaced)+.subtitle{margin-top:-1.5rem}.title.is-1{font-size:3rem}.title.is-2{font-size:2.5rem}.title.is-3{font-size:2rem}.title.is-4{font-size:1.5rem}.title.is-5{font-size:1.25rem}.title.is-6{font-size:1rem}.subtitle{color:#4a4a4a;font-size:1.25rem;font-weight:300;line-height:1.25}.subtitle strong{color:#363636}.subtitle:not(.is-spaced)+.title{margin-top:-1.5rem}.subtitle.is-1{font-size:3rem}.subtitle.is-2{font-size:2.5rem}.subtitle.is-3{font-size:2rem}.subtitle.is-4{font-size:1.5rem}.subtitle.is-5{font-size:1.25rem}.subtitle.is-6{font-size:1rem}.block:not(:last-child){margin-bottom:1.5rem}.container{position:relative}@media screen and (min-width: 1000px){.container{margin:0 auto;max-width:960px;width:960px}.container.is-fluid{margin:0 20px;max-width:none;width:auto}}@media screen and (min-width: 1192px){.container{max-width:1152px;width:1152px}}@media screen and (min-width: 1384px){.container{max-width:1344px;width:1344px}}.delete{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-moz-appearance:none;-webkit-appearance:none;background-color:rgba(10,10,10,0.2);border:none;border-radius:290486px;cursor:pointer;display:inline-block;font-size:1rem;height:20px;outline:none;position:relative;vertical-align:top;width:20px}.delete:before,.delete:after{background-color:#fff;content:\"\";display:block;left:50%;position:absolute;top:50%;transform:translateX(-50%) translateY(-50%) rotate(45deg);transform-origin:center center}.delete:before{height:2px;width:50%}.delete:after{height:50%;width:2px}.delete:hover,.delete:focus{background-color:rgba(10,10,10,0.3)}.delete:active{background-color:rgba(10,10,10,0.4)}.delete.is-small{height:16px;width:16px}.delete.is-medium{height:24px;width:24px}.delete.is-large{height:32px;width:32px}.fa{font-size:21px;text-align:center;vertical-align:top}.heading{display:block;font-size:11px;letter-spacing:1px;margin-bottom:5px;text-transform:uppercase}.highlight{font-weight:400;max-width:100%;overflow:hidden;padding:0}.highlight:not(:last-child){margin-bottom:1.5rem}.highlight pre{overflow:auto;max-width:100%}.loader{animation:spinAround 500ms infinite linear;border:2px solid #dbdbdb;border-radius:290486px;border-right-color:transparent;border-top-color:transparent;content:\"\";display:block;height:1em;position:relative;width:1em}.number{align-items:center;background-color:#f5f5f5;border-radius:290486px;display:inline-flex;font-size:1.25rem;height:2em;justify-content:center;margin-right:1.5rem;min-width:2.5em;padding:0.25rem 0.5rem;text-align:center;vertical-align:top}.card-header{align-items:stretch;box-shadow:0 1px 2px rgba(10,10,10,0.1);display:flex}.card-header-title{align-items:center;color:#363636;display:flex;flex-grow:1;font-weight:700;padding:0.75rem}.card-header-icon{align-items:center;cursor:pointer;display:flex;justify-content:center;padding:0.75rem}.card-image{display:block;position:relative}.card-content{padding:1.5rem}.card-footer{border-top:1px solid #dbdbdb;align-items:stretch;display:flex}.card-footer-item{align-items:center;display:flex;flex-basis:0;flex-grow:1;flex-shrink:0;justify-content:center;padding:0.75rem}.card-footer-item:not(:last-child){border-right:1px solid #dbdbdb}.card{background-color:#fff;box-shadow:0 2px 3px rgba(10,10,10,0.1),0 0 0 1px rgba(10,10,10,0.1);color:#4a4a4a;max-width:100%;position:relative}.card .media:not(:last-child){margin-bottom:0.75rem}.level-item{align-items:center;display:flex;flex-basis:auto;flex-grow:0;flex-shrink:0;justify-content:center}.level-item .title,.level-item .subtitle{margin-bottom:0}@media screen and (max-width: 768px){.level-item:not(:last-child){margin-bottom:0.75rem}}.level-left,.level-right{flex-basis:auto;flex-grow:0;flex-shrink:0}.level-left .level-item:not(:last-child),.level-right .level-item:not(:last-child){margin-right:0.75rem}.level-left .level-item.is-flexible,.level-right .level-item.is-flexible{flex-grow:1}.level-left{align-items:center;justify-content:flex-start}@media screen and (max-width: 768px){.level-left+.level-right{margin-top:1.5rem}}@media screen and (min-width: 769px), print{.level-left{display:flex}}.level-right{align-items:center;justify-content:flex-end}@media screen and (min-width: 769px), print{.level-right{display:flex}}.level{align-items:center;justify-content:space-between}.level:not(:last-child){margin-bottom:1.5rem}.level code{border-radius:3px}.level img{display:inline-block;vertical-align:top}.level.is-mobile{display:flex}.level.is-mobile .level-left,.level.is-mobile .level-right{display:flex}.level.is-mobile .level-left+.level-right{margin-top:0}.level.is-mobile .level-item:not(:last-child){margin-bottom:0}.level.is-mobile .level-item:not(.is-narrow){flex-grow:1}@media screen and (min-width: 769px), print{.level{display:flex}.level>.level-item:not(.is-narrow){flex-grow:1}}.media-left,.media-right{flex-basis:auto;flex-grow:0;flex-shrink:0}.media-left{margin-right:1rem}.media-right{margin-left:1rem}.media-content{flex-basis:auto;flex-grow:1;flex-shrink:1;text-align:left}.media{align-items:flex-start;display:flex;text-align:left}.media .content:not(:last-child){margin-bottom:0.75rem}.media .media{border-top:1px solid rgba(219,219,219,0.5);display:flex;padding-top:0.75rem}.media .media .content:not(:last-child),.media .media .control:not(:last-child){margin-bottom:0.5rem}.media .media .media{padding-top:0.5rem}.media .media .media+.media{margin-top:0.5rem}.media+.media{border-top:1px solid rgba(219,219,219,0.5);margin-top:1rem;padding-top:1rem}.media.is-large+.media{margin-top:1.5rem;padding-top:1.5rem}.menu{font-size:1rem}.menu-list{line-height:1.25}.menu-list a{border-radius:2px;color:#4a4a4a;display:block;padding:0.5em 0.75em}.menu-list a:hover{background-color:#f5f5f5;color:#182b73}.menu-list a.is-active{background-color:#182b73;color:#fff}.menu-list li ul{border-left:1px solid #dbdbdb;margin:0.75em;padding-left:0.75em}.menu-label{color:#7a7a7a;font-size:0.8em;letter-spacing:0.1em;text-transform:uppercase}.menu-label:not(:first-child){margin-top:1em}.menu-label:not(:last-child){margin-bottom:1em}.message{background-color:#f5f5f5;border-radius:3px;font-size:1rem}.message:not(:last-child){margin-bottom:1.5rem}.message.is-white{background-color:#fff}.message.is-white .message-header{background-color:#fff;color:#0a0a0a}.message.is-white .message-body{border-color:#fff;color:#4d4d4d}.message.is-black{background-color:#fafafa}.message.is-black .message-header{background-color:#0a0a0a;color:#fff}.message.is-black .message-body{border-color:#0a0a0a;color:#090909}.message.is-light{background-color:#fafafa}.message.is-light .message-header{background-color:#f5f5f5;color:#363636}.message.is-light .message-body{border-color:#f5f5f5;color:#505050}.message.is-dark{background-color:#fafafa}.message.is-dark .message-header{background-color:#363636;color:#f5f5f5}.message.is-dark .message-body{border-color:#363636;color:#2a2a2a}.message.is-primary{background-color:#f7f8fd}.message.is-primary .message-header{background-color:#182b73;color:#fff}.message.is-primary .message-body{border-color:#182b73;color:#162662}.message.is-info{background-color:#f6f9fe}.message.is-info .message-header{background-color:#3273dc;color:#fff}.message.is-info .message-body{border-color:#3273dc;color:#22509a}.message.is-success{background-color:#f6fef9}.message.is-success .message-header{background-color:#23d160;color:#fff}.message.is-success .message-body{border-color:#23d160;color:#0e301a}.message.is-warning{background-color:#fffdf5}.message.is-warning .message-header{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.message.is-warning .message-body{border-color:#ffdd57;color:#3b3108}.message.is-danger{background-color:#fff5f5}.message.is-danger .message-header{background-color:red;color:#fff}.message.is-danger .message-body{border-color:red;color:#ad0606}.message-header{align-items:center;background-color:#4a4a4a;border-radius:3px 3px 0 0;color:#fff;display:flex;justify-content:space-between;line-height:1.25;padding:0.5em 0.75em;position:relative}.message-header a,.message-header strong{color:inherit}.message-header a{text-decoration:underline}.message-header .delete{flex-grow:0;flex-shrink:0;margin-left:0.75em}.message-header+.message-body{border-top-left-radius:0;border-top-right-radius:0;border-top:none}.message-body{border:1px solid #dbdbdb;border-radius:3px;color:#4a4a4a;padding:1em 1.25em}.message-body a,.message-body strong{color:inherit}.message-body a{text-decoration:underline}.message-body code,.message-body pre{background:#fff}.message-body pre code{background:transparent}.modal-background{bottom:0;left:0;position:absolute;right:0;top:0;background-color:rgba(10,10,10,0.86)}.modal-content,.modal-card{margin:0 20px;max-height:calc(100vh - 160px);overflow:auto;position:relative;width:100%}@media screen and (min-width: 769px), print{.modal-content,.modal-card{margin:0 auto;max-height:calc(100vh - 40px);width:640px}}.modal-close{-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-moz-appearance:none;-webkit-appearance:none;background-color:rgba(10,10,10,0.2);border:none;border-radius:290486px;cursor:pointer;display:inline-block;font-size:1rem;height:20px;outline:none;position:relative;vertical-align:top;width:20px;background:none;height:40px;position:fixed;right:20px;top:20px;width:40px}.modal-close:before,.modal-close:after{background-color:#fff;content:\"\";display:block;left:50%;position:absolute;top:50%;transform:translateX(-50%) translateY(-50%) rotate(45deg);transform-origin:center center}.modal-close:before{height:2px;width:50%}.modal-close:after{height:50%;width:2px}.modal-close:hover,.modal-close:focus{background-color:rgba(10,10,10,0.3)}.modal-close:active{background-color:rgba(10,10,10,0.4)}.modal-close.is-small{height:16px;width:16px}.modal-close.is-medium{height:24px;width:24px}.modal-close.is-large{height:32px;width:32px}.modal-card{display:flex;flex-direction:column;max-height:calc(100vh - 40px);overflow:hidden}.modal-card-head,.modal-card-foot{align-items:center;background-color:#f5f5f5;display:flex;flex-shrink:0;justify-content:flex-start;padding:20px;position:relative}.modal-card-head{border-bottom:1px solid #dbdbdb;border-top-left-radius:5px;border-top-right-radius:5px}.modal-card-title{color:#363636;flex-grow:1;flex-shrink:0;font-size:1.5rem;line-height:1}.modal-card-foot{border-bottom-left-radius:5px;border-bottom-right-radius:5px;border-top:1px solid #dbdbdb}.modal-card-foot .button:not(:last-child){margin-right:10px}.modal-card-body{-webkit-overflow-scrolling:touch;background-color:#fff;flex-grow:1;flex-shrink:1;overflow:auto;padding:20px}.modal{bottom:0;left:0;position:absolute;right:0;top:0;align-items:center;display:none;justify-content:center;overflow:hidden;position:fixed;z-index:20}.modal.is-active{display:flex}.nav-toggle{cursor:pointer;display:block;height:3.25rem;position:relative;width:3.25rem}.nav-toggle span{background-color:#4a4a4a;display:block;height:1px;left:50%;margin-left:-7px;position:absolute;top:50%;transition:none 86ms ease-out;transition-property:background, left, opacity, transform;width:15px}.nav-toggle span:nth-child(1){margin-top:-6px}.nav-toggle span:nth-child(2){margin-top:-1px}.nav-toggle span:nth-child(3){margin-top:4px}.nav-toggle:hover{background-color:#f5f5f5}.nav-toggle.is-active span{background-color:#182b73}.nav-toggle.is-active span:nth-child(1){margin-left:-5px;transform:rotate(45deg);transform-origin:left top}.nav-toggle.is-active span:nth-child(2){opacity:0}.nav-toggle.is-active span:nth-child(3){margin-left:-5px;transform:rotate(-45deg);transform-origin:left bottom}@media screen and (min-width: 769px), print{.nav-toggle{display:none}}.nav-item{align-items:center;display:flex;flex-grow:0;flex-shrink:0;font-size:1rem;justify-content:center;line-height:1.5;padding:0.5rem 0.75rem}.nav-item a{flex-grow:1;flex-shrink:0}.nav-item img{max-height:1.75rem}.nav-item .tag:first-child:not(:last-child){margin-right:0.5rem}.nav-item .tag:last-child:not(:first-child){margin-left:0.5rem}@media screen and (max-width: 768px){.nav-item{justify-content:flex-start}}.nav-item a,a.nav-item{color:#7a7a7a}.nav-item a:hover,a.nav-item:hover{color:#363636}.nav-item a.is-active,a.nav-item.is-active{color:#363636}.nav-item a.is-tab,a.nav-item.is-tab{border-bottom:1px solid transparent;border-top:1px solid transparent;padding-bottom:calc(0.75rem - 1px);padding-left:1rem;padding-right:1rem;padding-top:calc(0.75rem - 1px)}.nav-item a.is-tab:hover,a.nav-item.is-tab:hover{border-bottom-color:#182b73;border-top-color:transparent}.nav-item a.is-tab.is-active,a.nav-item.is-tab.is-active{border-bottom:3px solid #182b73;color:#182b73;padding-bottom:calc(0.75rem - 3px)}@media screen and (min-width: 1000px){.nav-item a.is-brand,a.nav-item.is-brand{padding-left:0}}.nav-left,.nav-right{-webkit-overflow-scrolling:touch;align-items:stretch;display:flex;flex-grow:1;flex-shrink:0;max-width:100%;overflow:auto}@media screen and (min-width: 1192px){.nav-left,.nav-right{flex-basis:0}}.nav-left{justify-content:flex-start;white-space:nowrap}.nav-right{justify-content:flex-end}.nav-center{align-items:stretch;display:flex;flex-grow:0;flex-shrink:0;justify-content:center;margin-left:auto;margin-right:auto}@media screen and (max-width: 768px){.nav-menu.nav-right{background-color:#fff;box-shadow:0 4px 7px rgba(10,10,10,0.1);left:0;display:none;right:0;top:100%;position:absolute}.nav-menu.nav-right .nav-item{border-top:1px solid rgba(219,219,219,0.5);padding:0.75rem}.nav-menu.nav-right.is-active{display:block}}.nav{align-items:stretch;background-color:#fff;display:flex;height:3.25rem;position:relative;text-align:center;z-index:10}.nav>.container{align-items:stretch;display:flex;min-height:3.25rem;width:100%}.nav.has-shadow{box-shadow:0 2px 3px rgba(10,10,10,0.1)}.pagination{font-size:1rem;margin:-0.25rem}.pagination.is-small{font-size:.75rem}.pagination.is-medium{font-size:1.25rem}.pagination.is-large{font-size:1.5rem}.pagination,.pagination-list{align-items:center;display:flex;justify-content:center;text-align:center}.pagination-previous,.pagination-next,.pagination-link,.pagination-ellipsis{-moz-appearance:none;-webkit-appearance:none;align-items:center;border:1px solid transparent;border-radius:3px;box-shadow:none;display:inline-flex;font-size:1rem;height:2.25em;justify-content:flex-start;line-height:1.5;padding-bottom:calc(0.375em - 1px);padding-left:calc(0.625em - 1px);padding-right:calc(0.625em - 1px);padding-top:calc(0.375em - 1px);position:relative;vertical-align:top;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;font-size:1em;padding-left:0.5em;padding-right:0.5em;justify-content:center;margin:0.25rem;text-align:center}.pagination-previous:focus,.pagination-previous.is-focused,.pagination-previous:active,.pagination-previous.is-active,.pagination-next:focus,.pagination-next.is-focused,.pagination-next:active,.pagination-next.is-active,.pagination-link:focus,.pagination-link.is-focused,.pagination-link:active,.pagination-link.is-active,.pagination-ellipsis:focus,.pagination-ellipsis.is-focused,.pagination-ellipsis:active,.pagination-ellipsis.is-active{outline:none}.pagination-previous[disabled],.pagination-next[disabled],.pagination-link[disabled],.pagination-ellipsis[disabled]{cursor:not-allowed}.pagination-previous,.pagination-next,.pagination-link{border-color:#dbdbdb;min-width:2.25em}.pagination-previous:hover,.pagination-next:hover,.pagination-link:hover{border-color:#b5b5b5;color:#363636}.pagination-previous:focus,.pagination-next:focus,.pagination-link:focus{border-color:#182b73}.pagination-previous:active,.pagination-next:active,.pagination-link:active{box-shadow:inset 0 1px 2px rgba(10,10,10,0.2)}.pagination-previous[disabled],.pagination-next[disabled],.pagination-link[disabled]{background-color:#dbdbdb;border-color:#dbdbdb;box-shadow:none;color:#7a7a7a;opacity:0.5}.pagination-previous,.pagination-next{padding-left:0.75em;padding-right:0.75em;white-space:nowrap}.pagination-link.is-current{background-color:#182b73;border-color:#182b73;color:#fff}.pagination-ellipsis{color:#b5b5b5;pointer-events:none}.pagination-list{flex-wrap:wrap}@media screen and (max-width: 768px){.pagination{flex-wrap:wrap}.pagination-previous,.pagination-next{flex-grow:1;flex-shrink:1}.pagination-list li{flex-grow:1;flex-shrink:1}}@media screen and (min-width: 769px), print{.pagination-list{flex-grow:1;flex-shrink:1;justify-content:flex-start;order:1}.pagination-previous{order:2}.pagination-next{order:3}.pagination{justify-content:space-between}.pagination.is-centered .pagination-previous{order:1}.pagination.is-centered .pagination-list{justify-content:center;order:2}.pagination.is-centered .pagination-next{order:3}.pagination.is-right .pagination-previous{order:1}.pagination.is-right .pagination-next{order:2}.pagination.is-right .pagination-list{justify-content:flex-end;order:3}}.panel{font-size:1rem}.panel:not(:last-child){margin-bottom:1.5rem}.panel-heading,.panel-tabs,.panel-block{border-bottom:1px solid #dbdbdb;border-left:1px solid #dbdbdb;border-right:1px solid #dbdbdb}.panel-heading:first-child,.panel-tabs:first-child,.panel-block:first-child{border-top:1px solid #dbdbdb}.panel-heading{background-color:#f5f5f5;border-radius:3px 3px 0 0;color:#363636;font-size:1.25em;font-weight:300;line-height:1.25;padding:0.5em 0.75em}.panel-tabs{align-items:flex-end;display:flex;font-size:0.875em;justify-content:center}.panel-tabs a{border-bottom:1px solid #dbdbdb;margin-bottom:-1px;padding:0.5em}.panel-tabs a.is-active{border-bottom-color:#4a4a4a;color:#363636}.panel-list a{color:#4a4a4a}.panel-list a:hover{color:#182b73}.panel-block{align-items:center;color:#363636;display:flex;justify-content:flex-start;padding:0.5em 0.75em}.panel-block input[type=\"checkbox\"]{margin-right:0.75em}.panel-block>.control{flex-grow:1;flex-shrink:1;width:100%}.panel-block.is-wrapped{flex-wrap:wrap}.panel-block.is-active{border-left-color:#182b73;color:#363636}.panel-block.is-active .panel-icon{color:#182b73}a.panel-block,label.panel-block{cursor:pointer}a.panel-block:hover,label.panel-block:hover{background-color:#f5f5f5}.panel-icon{display:inline-block;font-size:14px;height:1em;line-height:1em;text-align:center;vertical-align:top;width:1em;color:#7a7a7a;margin-right:0.75em}.panel-icon .fa{font-size:inherit;line-height:inherit}.tabs{-webkit-overflow-scrolling:touch;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;align-items:stretch;display:flex;font-size:1rem;justify-content:space-between;overflow:hidden;overflow-x:auto;white-space:nowrap}.tabs:not(:last-child){margin-bottom:1.5rem}.tabs a{align-items:center;border-bottom:1px solid #dbdbdb;color:#4a4a4a;display:flex;justify-content:center;margin-bottom:-1px;padding:0.5em 1em;vertical-align:top}.tabs a:hover{border-bottom-color:#363636;color:#363636}.tabs li{display:block}.tabs li.is-active a{border-bottom-color:#182b73;color:#182b73}.tabs ul{align-items:center;border-bottom:1px solid #dbdbdb;display:flex;flex-grow:1;flex-shrink:0;justify-content:flex-start}.tabs ul.is-left{padding-right:0.75em}.tabs ul.is-center{flex:none;justify-content:center;padding-left:0.75em;padding-right:0.75em}.tabs ul.is-right{justify-content:flex-end;padding-left:0.75em}.tabs .icon:first-child{margin-right:0.5em}.tabs .icon:last-child{margin-left:0.5em}.tabs.is-centered ul{justify-content:center}.tabs.is-right ul{justify-content:flex-end}.tabs.is-boxed a{border:1px solid transparent;border-radius:3px 3px 0 0}.tabs.is-boxed a:hover{background-color:#f5f5f5;border-bottom-color:#dbdbdb}.tabs.is-boxed li.is-active a{background-color:#fff;border-color:#dbdbdb;border-bottom-color:transparent !important}.tabs.is-fullwidth li{flex-grow:1;flex-shrink:0}.tabs.is-toggle a{border:1px solid #dbdbdb;margin-bottom:0;position:relative}.tabs.is-toggle a:hover{background-color:#f5f5f5;border-color:#b5b5b5;z-index:2}.tabs.is-toggle li+li{margin-left:-1px}.tabs.is-toggle li:first-child a{border-radius:3px 0 0 3px}.tabs.is-toggle li:last-child a{border-radius:0 3px 3px 0}.tabs.is-toggle li.is-active a{background-color:#182b73;border-color:#182b73;color:#fff;z-index:1}.tabs.is-toggle ul{border-bottom:none}.tabs.is-small{font-size:.75rem}.tabs.is-medium{font-size:1.25rem}.tabs.is-large{font-size:1.5rem}.column{display:block;flex-basis:0;flex-grow:1;flex-shrink:1;padding:0.75rem}.columns.is-mobile>.column.is-narrow{flex:none}.columns.is-mobile>.column.is-full{flex:none;width:100%}.columns.is-mobile>.column.is-three-quarters{flex:none;width:75%}.columns.is-mobile>.column.is-two-thirds{flex:none;width:66.6666%}.columns.is-mobile>.column.is-half{flex:none;width:50%}.columns.is-mobile>.column.is-one-third{flex:none;width:33.3333%}.columns.is-mobile>.column.is-one-quarter{flex:none;width:25%}.columns.is-mobile>.column.is-offset-three-quarters{margin-left:75%}.columns.is-mobile>.column.is-offset-two-thirds{margin-left:66.6666%}.columns.is-mobile>.column.is-offset-half{margin-left:50%}.columns.is-mobile>.column.is-offset-one-third{margin-left:33.3333%}.columns.is-mobile>.column.is-offset-one-quarter{margin-left:25%}.columns.is-mobile>.column.is-1{flex:none;width:8.33333%}.columns.is-mobile>.column.is-offset-1{margin-left:8.33333%}.columns.is-mobile>.column.is-2{flex:none;width:16.66667%}.columns.is-mobile>.column.is-offset-2{margin-left:16.66667%}.columns.is-mobile>.column.is-3{flex:none;width:25%}.columns.is-mobile>.column.is-offset-3{margin-left:25%}.columns.is-mobile>.column.is-4{flex:none;width:33.33333%}.columns.is-mobile>.column.is-offset-4{margin-left:33.33333%}.columns.is-mobile>.column.is-5{flex:none;width:41.66667%}.columns.is-mobile>.column.is-offset-5{margin-left:41.66667%}.columns.is-mobile>.column.is-6{flex:none;width:50%}.columns.is-mobile>.column.is-offset-6{margin-left:50%}.columns.is-mobile>.column.is-7{flex:none;width:58.33333%}.columns.is-mobile>.column.is-offset-7{margin-left:58.33333%}.columns.is-mobile>.column.is-8{flex:none;width:66.66667%}.columns.is-mobile>.column.is-offset-8{margin-left:66.66667%}.columns.is-mobile>.column.is-9{flex:none;width:75%}.columns.is-mobile>.column.is-offset-9{margin-left:75%}.columns.is-mobile>.column.is-10{flex:none;width:83.33333%}.columns.is-mobile>.column.is-offset-10{margin-left:83.33333%}.columns.is-mobile>.column.is-11{flex:none;width:91.66667%}.columns.is-mobile>.column.is-offset-11{margin-left:91.66667%}.columns.is-mobile>.column.is-12{flex:none;width:100%}.columns.is-mobile>.column.is-offset-12{margin-left:100%}@media screen and (max-width: 768px){.column.is-narrow-mobile{flex:none}.column.is-full-mobile{flex:none;width:100%}.column.is-three-quarters-mobile{flex:none;width:75%}.column.is-two-thirds-mobile{flex:none;width:66.6666%}.column.is-half-mobile{flex:none;width:50%}.column.is-one-third-mobile{flex:none;width:33.3333%}.column.is-one-quarter-mobile{flex:none;width:25%}.column.is-offset-three-quarters-mobile{margin-left:75%}.column.is-offset-two-thirds-mobile{margin-left:66.6666%}.column.is-offset-half-mobile{margin-left:50%}.column.is-offset-one-third-mobile{margin-left:33.3333%}.column.is-offset-one-quarter-mobile{margin-left:25%}.column.is-1-mobile{flex:none;width:8.33333%}.column.is-offset-1-mobile{margin-left:8.33333%}.column.is-2-mobile{flex:none;width:16.66667%}.column.is-offset-2-mobile{margin-left:16.66667%}.column.is-3-mobile{flex:none;width:25%}.column.is-offset-3-mobile{margin-left:25%}.column.is-4-mobile{flex:none;width:33.33333%}.column.is-offset-4-mobile{margin-left:33.33333%}.column.is-5-mobile{flex:none;width:41.66667%}.column.is-offset-5-mobile{margin-left:41.66667%}.column.is-6-mobile{flex:none;width:50%}.column.is-offset-6-mobile{margin-left:50%}.column.is-7-mobile{flex:none;width:58.33333%}.column.is-offset-7-mobile{margin-left:58.33333%}.column.is-8-mobile{flex:none;width:66.66667%}.column.is-offset-8-mobile{margin-left:66.66667%}.column.is-9-mobile{flex:none;width:75%}.column.is-offset-9-mobile{margin-left:75%}.column.is-10-mobile{flex:none;width:83.33333%}.column.is-offset-10-mobile{margin-left:83.33333%}.column.is-11-mobile{flex:none;width:91.66667%}.column.is-offset-11-mobile{margin-left:91.66667%}.column.is-12-mobile{flex:none;width:100%}.column.is-offset-12-mobile{margin-left:100%}}@media screen and (min-width: 769px), print{.column.is-narrow,.column.is-narrow-tablet{flex:none}.column.is-full,.column.is-full-tablet{flex:none;width:100%}.column.is-three-quarters,.column.is-three-quarters-tablet{flex:none;width:75%}.column.is-two-thirds,.column.is-two-thirds-tablet{flex:none;width:66.6666%}.column.is-half,.column.is-half-tablet{flex:none;width:50%}.column.is-one-third,.column.is-one-third-tablet{flex:none;width:33.3333%}.column.is-one-quarter,.column.is-one-quarter-tablet{flex:none;width:25%}.column.is-offset-three-quarters,.column.is-offset-three-quarters-tablet{margin-left:75%}.column.is-offset-two-thirds,.column.is-offset-two-thirds-tablet{margin-left:66.6666%}.column.is-offset-half,.column.is-offset-half-tablet{margin-left:50%}.column.is-offset-one-third,.column.is-offset-one-third-tablet{margin-left:33.3333%}.column.is-offset-one-quarter,.column.is-offset-one-quarter-tablet{margin-left:25%}.column.is-1,.column.is-1-tablet{flex:none;width:8.33333%}.column.is-offset-1,.column.is-offset-1-tablet{margin-left:8.33333%}.column.is-2,.column.is-2-tablet{flex:none;width:16.66667%}.column.is-offset-2,.column.is-offset-2-tablet{margin-left:16.66667%}.column.is-3,.column.is-3-tablet{flex:none;width:25%}.column.is-offset-3,.column.is-offset-3-tablet{margin-left:25%}.column.is-4,.column.is-4-tablet{flex:none;width:33.33333%}.column.is-offset-4,.column.is-offset-4-tablet{margin-left:33.33333%}.column.is-5,.column.is-5-tablet{flex:none;width:41.66667%}.column.is-offset-5,.column.is-offset-5-tablet{margin-left:41.66667%}.column.is-6,.column.is-6-tablet{flex:none;width:50%}.column.is-offset-6,.column.is-offset-6-tablet{margin-left:50%}.column.is-7,.column.is-7-tablet{flex:none;width:58.33333%}.column.is-offset-7,.column.is-offset-7-tablet{margin-left:58.33333%}.column.is-8,.column.is-8-tablet{flex:none;width:66.66667%}.column.is-offset-8,.column.is-offset-8-tablet{margin-left:66.66667%}.column.is-9,.column.is-9-tablet{flex:none;width:75%}.column.is-offset-9,.column.is-offset-9-tablet{margin-left:75%}.column.is-10,.column.is-10-tablet{flex:none;width:83.33333%}.column.is-offset-10,.column.is-offset-10-tablet{margin-left:83.33333%}.column.is-11,.column.is-11-tablet{flex:none;width:91.66667%}.column.is-offset-11,.column.is-offset-11-tablet{margin-left:91.66667%}.column.is-12,.column.is-12-tablet{flex:none;width:100%}.column.is-offset-12,.column.is-offset-12-tablet{margin-left:100%}}@media screen and (min-width: 1000px){.column.is-narrow-desktop{flex:none}.column.is-full-desktop{flex:none;width:100%}.column.is-three-quarters-desktop{flex:none;width:75%}.column.is-two-thirds-desktop{flex:none;width:66.6666%}.column.is-half-desktop{flex:none;width:50%}.column.is-one-third-desktop{flex:none;width:33.3333%}.column.is-one-quarter-desktop{flex:none;width:25%}.column.is-offset-three-quarters-desktop{margin-left:75%}.column.is-offset-two-thirds-desktop{margin-left:66.6666%}.column.is-offset-half-desktop{margin-left:50%}.column.is-offset-one-third-desktop{margin-left:33.3333%}.column.is-offset-one-quarter-desktop{margin-left:25%}.column.is-1-desktop{flex:none;width:8.33333%}.column.is-offset-1-desktop{margin-left:8.33333%}.column.is-2-desktop{flex:none;width:16.66667%}.column.is-offset-2-desktop{margin-left:16.66667%}.column.is-3-desktop{flex:none;width:25%}.column.is-offset-3-desktop{margin-left:25%}.column.is-4-desktop{flex:none;width:33.33333%}.column.is-offset-4-desktop{margin-left:33.33333%}.column.is-5-desktop{flex:none;width:41.66667%}.column.is-offset-5-desktop{margin-left:41.66667%}.column.is-6-desktop{flex:none;width:50%}.column.is-offset-6-desktop{margin-left:50%}.column.is-7-desktop{flex:none;width:58.33333%}.column.is-offset-7-desktop{margin-left:58.33333%}.column.is-8-desktop{flex:none;width:66.66667%}.column.is-offset-8-desktop{margin-left:66.66667%}.column.is-9-desktop{flex:none;width:75%}.column.is-offset-9-desktop{margin-left:75%}.column.is-10-desktop{flex:none;width:83.33333%}.column.is-offset-10-desktop{margin-left:83.33333%}.column.is-11-desktop{flex:none;width:91.66667%}.column.is-offset-11-desktop{margin-left:91.66667%}.column.is-12-desktop{flex:none;width:100%}.column.is-offset-12-desktop{margin-left:100%}}@media screen and (min-width: 1192px){.column.is-narrow-widescreen{flex:none}.column.is-full-widescreen{flex:none;width:100%}.column.is-three-quarters-widescreen{flex:none;width:75%}.column.is-two-thirds-widescreen{flex:none;width:66.6666%}.column.is-half-widescreen{flex:none;width:50%}.column.is-one-third-widescreen{flex:none;width:33.3333%}.column.is-one-quarter-widescreen{flex:none;width:25%}.column.is-offset-three-quarters-widescreen{margin-left:75%}.column.is-offset-two-thirds-widescreen{margin-left:66.6666%}.column.is-offset-half-widescreen{margin-left:50%}.column.is-offset-one-third-widescreen{margin-left:33.3333%}.column.is-offset-one-quarter-widescreen{margin-left:25%}.column.is-1-widescreen{flex:none;width:8.33333%}.column.is-offset-1-widescreen{margin-left:8.33333%}.column.is-2-widescreen{flex:none;width:16.66667%}.column.is-offset-2-widescreen{margin-left:16.66667%}.column.is-3-widescreen{flex:none;width:25%}.column.is-offset-3-widescreen{margin-left:25%}.column.is-4-widescreen{flex:none;width:33.33333%}.column.is-offset-4-widescreen{margin-left:33.33333%}.column.is-5-widescreen{flex:none;width:41.66667%}.column.is-offset-5-widescreen{margin-left:41.66667%}.column.is-6-widescreen{flex:none;width:50%}.column.is-offset-6-widescreen{margin-left:50%}.column.is-7-widescreen{flex:none;width:58.33333%}.column.is-offset-7-widescreen{margin-left:58.33333%}.column.is-8-widescreen{flex:none;width:66.66667%}.column.is-offset-8-widescreen{margin-left:66.66667%}.column.is-9-widescreen{flex:none;width:75%}.column.is-offset-9-widescreen{margin-left:75%}.column.is-10-widescreen{flex:none;width:83.33333%}.column.is-offset-10-widescreen{margin-left:83.33333%}.column.is-11-widescreen{flex:none;width:91.66667%}.column.is-offset-11-widescreen{margin-left:91.66667%}.column.is-12-widescreen{flex:none;width:100%}.column.is-offset-12-widescreen{margin-left:100%}}.columns{margin-left:-0.75rem;margin-right:-0.75rem;margin-top:-0.75rem}.columns:last-child{margin-bottom:-0.75rem}.columns:not(:last-child){margin-bottom:0.75rem}.columns.is-centered{justify-content:center}.columns.is-gapless{margin-left:0;margin-right:0;margin-top:0}.columns.is-gapless:last-child{margin-bottom:0}.columns.is-gapless:not(:last-child){margin-bottom:1.5rem}.columns.is-gapless>.column{margin:0;padding:0}@media screen and (min-width: 769px), print{.columns.is-grid{flex-wrap:wrap}.columns.is-grid>.column{max-width:33.3333%;padding:0.75rem;width:33.3333%}.columns.is-grid>.column+.column{margin-left:0}}.columns.is-mobile{display:flex}.columns.is-multiline{flex-wrap:wrap}.columns.is-vcentered{align-items:center}@media screen and (min-width: 769px), print{.columns:not(.is-desktop){display:flex}}@media screen and (min-width: 1000px){.columns.is-desktop{display:flex}}.tile{align-items:stretch;display:block;flex-basis:0;flex-grow:1;flex-shrink:1;min-height:min-content}.tile.is-ancestor{margin-left:-0.75rem;margin-right:-0.75rem;margin-top:-0.75rem}.tile.is-ancestor:last-child{margin-bottom:-0.75rem}.tile.is-ancestor:not(:last-child){margin-bottom:0.75rem}.tile.is-child{margin:0 !important}.tile.is-parent{padding:0.75rem}.tile.is-vertical{flex-direction:column}.tile.is-vertical>.tile.is-child:not(:last-child){margin-bottom:1.5rem !important}@media screen and (min-width: 769px), print{.tile:not(.is-child){display:flex}.tile.is-1{flex:none;width:8.33333%}.tile.is-2{flex:none;width:16.66667%}.tile.is-3{flex:none;width:25%}.tile.is-4{flex:none;width:33.33333%}.tile.is-5{flex:none;width:41.66667%}.tile.is-6{flex:none;width:50%}.tile.is-7{flex:none;width:58.33333%}.tile.is-8{flex:none;width:66.66667%}.tile.is-9{flex:none;width:75%}.tile.is-10{flex:none;width:83.33333%}.tile.is-11{flex:none;width:91.66667%}.tile.is-12{flex:none;width:100%}}.hero-video{bottom:0;left:0;position:absolute;right:0;top:0;overflow:hidden}.hero-video video{left:50%;min-height:100%;min-width:100%;position:absolute;top:50%;transform:translate3d(-50%, -50%, 0)}.hero-video.is-transparent{opacity:0.3}@media screen and (max-width: 768px){.hero-video{display:none}}.hero-buttons{margin-top:1.5rem}@media screen and (max-width: 768px){.hero-buttons .button{display:flex}.hero-buttons .button:not(:last-child){margin-bottom:0.75rem}}@media screen and (min-width: 769px), print{.hero-buttons{display:flex;justify-content:center}.hero-buttons .button:not(:last-child){margin-right:1.5rem}}.hero-head,.hero-foot{flex-grow:0;flex-shrink:0}.hero-body{flex-grow:1;flex-shrink:0;padding:3rem 1.5rem}@media screen and (min-width: 1192px){.hero-body{padding-left:0;padding-right:0}}.hero{align-items:stretch;background-color:#fff;display:flex;flex-direction:column;justify-content:space-between}.hero .nav{background:none;box-shadow:0 1px 0 rgba(219,219,219,0.3)}.hero .tabs ul{border-bottom:none}.hero.is-white{background-color:#fff;color:#0a0a0a}.hero.is-white a:not(.button),.hero.is-white strong{color:inherit}.hero.is-white .title{color:#0a0a0a}.hero.is-white .subtitle{color:rgba(10,10,10,0.9)}.hero.is-white .subtitle a:not(.button),.hero.is-white .subtitle strong{color:#0a0a0a}.hero.is-white .nav{box-shadow:0 1px 0 rgba(10,10,10,0.2)}@media screen and (max-width: 768px){.hero.is-white .nav-menu{background-color:#fff}}.hero.is-white a.nav-item,.hero.is-white .nav-item a:not(.button){color:rgba(10,10,10,0.7)}.hero.is-white a.nav-item:hover,.hero.is-white a.nav-item.is-active,.hero.is-white .nav-item a:not(.button):hover,.hero.is-white .nav-item a:not(.button).is-active{color:#0a0a0a}.hero.is-white .tabs a{color:#0a0a0a;opacity:0.9}.hero.is-white .tabs a:hover{opacity:1}.hero.is-white .tabs li.is-active a{opacity:1}.hero.is-white .tabs.is-boxed a,.hero.is-white .tabs.is-toggle a{color:#0a0a0a}.hero.is-white .tabs.is-boxed a:hover,.hero.is-white .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-white .tabs.is-boxed li.is-active a,.hero.is-white .tabs.is-boxed li.is-active a:hover,.hero.is-white .tabs.is-toggle li.is-active a,.hero.is-white .tabs.is-toggle li.is-active a:hover{background-color:#0a0a0a;border-color:#0a0a0a;color:#fff}.hero.is-white.is-bold{background-image:linear-gradient(141deg, #e6e6e6 0%, #fff 71%, #fff 100%)}@media screen and (max-width: 768px){.hero.is-white.is-bold .nav-menu{background-image:linear-gradient(141deg, #e6e6e6 0%, #fff 71%, #fff 100%)}}@media screen and (max-width: 768px){.hero.is-white .nav-toggle span{background-color:#0a0a0a}.hero.is-white .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-white .nav-toggle.is-active span{background-color:#0a0a0a}.hero.is-white .nav-menu .nav-item{border-top-color:rgba(10,10,10,0.2)}}.hero.is-black{background-color:#0a0a0a;color:#fff}.hero.is-black a:not(.button),.hero.is-black strong{color:inherit}.hero.is-black .title{color:#fff}.hero.is-black .subtitle{color:rgba(255,255,255,0.9)}.hero.is-black .subtitle a:not(.button),.hero.is-black .subtitle strong{color:#fff}.hero.is-black .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-black .nav-menu{background-color:#0a0a0a}}.hero.is-black a.nav-item,.hero.is-black .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-black a.nav-item:hover,.hero.is-black a.nav-item.is-active,.hero.is-black .nav-item a:not(.button):hover,.hero.is-black .nav-item a:not(.button).is-active{color:#fff}.hero.is-black .tabs a{color:#fff;opacity:0.9}.hero.is-black .tabs a:hover{opacity:1}.hero.is-black .tabs li.is-active a{opacity:1}.hero.is-black .tabs.is-boxed a,.hero.is-black .tabs.is-toggle a{color:#fff}.hero.is-black .tabs.is-boxed a:hover,.hero.is-black .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-black .tabs.is-boxed li.is-active a,.hero.is-black .tabs.is-boxed li.is-active a:hover,.hero.is-black .tabs.is-toggle li.is-active a,.hero.is-black .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#0a0a0a}.hero.is-black.is-bold{background-image:linear-gradient(141deg, #000 0%, #0a0a0a 71%, #181616 100%)}@media screen and (max-width: 768px){.hero.is-black.is-bold .nav-menu{background-image:linear-gradient(141deg, #000 0%, #0a0a0a 71%, #181616 100%)}}@media screen and (max-width: 768px){.hero.is-black .nav-toggle span{background-color:#fff}.hero.is-black .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-black .nav-toggle.is-active span{background-color:#fff}.hero.is-black .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-light{background-color:#f5f5f5;color:#363636}.hero.is-light a:not(.button),.hero.is-light strong{color:inherit}.hero.is-light .title{color:#363636}.hero.is-light .subtitle{color:rgba(54,54,54,0.9)}.hero.is-light .subtitle a:not(.button),.hero.is-light .subtitle strong{color:#363636}.hero.is-light .nav{box-shadow:0 1px 0 rgba(54,54,54,0.2)}@media screen and (max-width: 768px){.hero.is-light .nav-menu{background-color:#f5f5f5}}.hero.is-light a.nav-item,.hero.is-light .nav-item a:not(.button){color:rgba(54,54,54,0.7)}.hero.is-light a.nav-item:hover,.hero.is-light a.nav-item.is-active,.hero.is-light .nav-item a:not(.button):hover,.hero.is-light .nav-item a:not(.button).is-active{color:#363636}.hero.is-light .tabs a{color:#363636;opacity:0.9}.hero.is-light .tabs a:hover{opacity:1}.hero.is-light .tabs li.is-active a{opacity:1}.hero.is-light .tabs.is-boxed a,.hero.is-light .tabs.is-toggle a{color:#363636}.hero.is-light .tabs.is-boxed a:hover,.hero.is-light .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-light .tabs.is-boxed li.is-active a,.hero.is-light .tabs.is-boxed li.is-active a:hover,.hero.is-light .tabs.is-toggle li.is-active a,.hero.is-light .tabs.is-toggle li.is-active a:hover{background-color:#363636;border-color:#363636;color:#f5f5f5}.hero.is-light.is-bold{background-image:linear-gradient(141deg, #dfd8d9 0%, #f5f5f5 71%, #fff 100%)}@media screen and (max-width: 768px){.hero.is-light.is-bold .nav-menu{background-image:linear-gradient(141deg, #dfd8d9 0%, #f5f5f5 71%, #fff 100%)}}@media screen and (max-width: 768px){.hero.is-light .nav-toggle span{background-color:#363636}.hero.is-light .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-light .nav-toggle.is-active span{background-color:#363636}.hero.is-light .nav-menu .nav-item{border-top-color:rgba(54,54,54,0.2)}}.hero.is-dark{background-color:#363636;color:#f5f5f5}.hero.is-dark a:not(.button),.hero.is-dark strong{color:inherit}.hero.is-dark .title{color:#f5f5f5}.hero.is-dark .subtitle{color:rgba(245,245,245,0.9)}.hero.is-dark .subtitle a:not(.button),.hero.is-dark .subtitle strong{color:#f5f5f5}.hero.is-dark .nav{box-shadow:0 1px 0 rgba(245,245,245,0.2)}@media screen and (max-width: 768px){.hero.is-dark .nav-menu{background-color:#363636}}.hero.is-dark a.nav-item,.hero.is-dark .nav-item a:not(.button){color:rgba(245,245,245,0.7)}.hero.is-dark a.nav-item:hover,.hero.is-dark a.nav-item.is-active,.hero.is-dark .nav-item a:not(.button):hover,.hero.is-dark .nav-item a:not(.button).is-active{color:#f5f5f5}.hero.is-dark .tabs a{color:#f5f5f5;opacity:0.9}.hero.is-dark .tabs a:hover{opacity:1}.hero.is-dark .tabs li.is-active a{opacity:1}.hero.is-dark .tabs.is-boxed a,.hero.is-dark .tabs.is-toggle a{color:#f5f5f5}.hero.is-dark .tabs.is-boxed a:hover,.hero.is-dark .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-dark .tabs.is-boxed li.is-active a,.hero.is-dark .tabs.is-boxed li.is-active a:hover,.hero.is-dark .tabs.is-toggle li.is-active a,.hero.is-dark .tabs.is-toggle li.is-active a:hover{background-color:#f5f5f5;border-color:#f5f5f5;color:#363636}.hero.is-dark.is-bold{background-image:linear-gradient(141deg, #1f191a 0%, #363636 71%, #46403f 100%)}@media screen and (max-width: 768px){.hero.is-dark.is-bold .nav-menu{background-image:linear-gradient(141deg, #1f191a 0%, #363636 71%, #46403f 100%)}}@media screen and (max-width: 768px){.hero.is-dark .nav-toggle span{background-color:#f5f5f5}.hero.is-dark .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-dark .nav-toggle.is-active span{background-color:#f5f5f5}.hero.is-dark .nav-menu .nav-item{border-top-color:rgba(245,245,245,0.2)}}.hero.is-primary{background-color:#182b73;color:#fff}.hero.is-primary a:not(.button),.hero.is-primary strong{color:inherit}.hero.is-primary .title{color:#fff}.hero.is-primary .subtitle{color:rgba(255,255,255,0.9)}.hero.is-primary .subtitle a:not(.button),.hero.is-primary .subtitle strong{color:#fff}.hero.is-primary .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-primary .nav-menu{background-color:#182b73}}.hero.is-primary a.nav-item,.hero.is-primary .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-primary a.nav-item:hover,.hero.is-primary a.nav-item.is-active,.hero.is-primary .nav-item a:not(.button):hover,.hero.is-primary .nav-item a:not(.button).is-active{color:#fff}.hero.is-primary .tabs a{color:#fff;opacity:0.9}.hero.is-primary .tabs a:hover{opacity:1}.hero.is-primary .tabs li.is-active a{opacity:1}.hero.is-primary .tabs.is-boxed a,.hero.is-primary .tabs.is-toggle a{color:#fff}.hero.is-primary .tabs.is-boxed a:hover,.hero.is-primary .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-primary .tabs.is-boxed li.is-active a,.hero.is-primary .tabs.is-boxed li.is-active a:hover,.hero.is-primary .tabs.is-toggle li.is-active a,.hero.is-primary .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#182b73}.hero.is-primary.is-bold{background-image:linear-gradient(141deg, #0b244d 0%, #182b73 71%, #181d8c 100%)}@media screen and (max-width: 768px){.hero.is-primary.is-bold .nav-menu{background-image:linear-gradient(141deg, #0b244d 0%, #182b73 71%, #181d8c 100%)}}@media screen and (max-width: 768px){.hero.is-primary .nav-toggle span{background-color:#fff}.hero.is-primary .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-primary .nav-toggle.is-active span{background-color:#fff}.hero.is-primary .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-info{background-color:#3273dc;color:#fff}.hero.is-info a:not(.button),.hero.is-info strong{color:inherit}.hero.is-info .title{color:#fff}.hero.is-info .subtitle{color:rgba(255,255,255,0.9)}.hero.is-info .subtitle a:not(.button),.hero.is-info .subtitle strong{color:#fff}.hero.is-info .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-info .nav-menu{background-color:#3273dc}}.hero.is-info a.nav-item,.hero.is-info .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-info a.nav-item:hover,.hero.is-info a.nav-item.is-active,.hero.is-info .nav-item a:not(.button):hover,.hero.is-info .nav-item a:not(.button).is-active{color:#fff}.hero.is-info .tabs a{color:#fff;opacity:0.9}.hero.is-info .tabs a:hover{opacity:1}.hero.is-info .tabs li.is-active a{opacity:1}.hero.is-info .tabs.is-boxed a,.hero.is-info .tabs.is-toggle a{color:#fff}.hero.is-info .tabs.is-boxed a:hover,.hero.is-info .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-info .tabs.is-boxed li.is-active a,.hero.is-info .tabs.is-boxed li.is-active a:hover,.hero.is-info .tabs.is-toggle li.is-active a,.hero.is-info .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#3273dc}.hero.is-info.is-bold{background-image:linear-gradient(141deg, #1577c6 0%, #3273dc 71%, #4366e5 100%)}@media screen and (max-width: 768px){.hero.is-info.is-bold .nav-menu{background-image:linear-gradient(141deg, #1577c6 0%, #3273dc 71%, #4366e5 100%)}}@media screen and (max-width: 768px){.hero.is-info .nav-toggle span{background-color:#fff}.hero.is-info .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-info .nav-toggle.is-active span{background-color:#fff}.hero.is-info .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-success{background-color:#23d160;color:#fff}.hero.is-success a:not(.button),.hero.is-success strong{color:inherit}.hero.is-success .title{color:#fff}.hero.is-success .subtitle{color:rgba(255,255,255,0.9)}.hero.is-success .subtitle a:not(.button),.hero.is-success .subtitle strong{color:#fff}.hero.is-success .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-success .nav-menu{background-color:#23d160}}.hero.is-success a.nav-item,.hero.is-success .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-success a.nav-item:hover,.hero.is-success a.nav-item.is-active,.hero.is-success .nav-item a:not(.button):hover,.hero.is-success .nav-item a:not(.button).is-active{color:#fff}.hero.is-success .tabs a{color:#fff;opacity:0.9}.hero.is-success .tabs a:hover{opacity:1}.hero.is-success .tabs li.is-active a{opacity:1}.hero.is-success .tabs.is-boxed a,.hero.is-success .tabs.is-toggle a{color:#fff}.hero.is-success .tabs.is-boxed a:hover,.hero.is-success .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-success .tabs.is-boxed li.is-active a,.hero.is-success .tabs.is-boxed li.is-active a:hover,.hero.is-success .tabs.is-toggle li.is-active a,.hero.is-success .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:#23d160}.hero.is-success.is-bold{background-image:linear-gradient(141deg, #12af2f 0%, #23d160 71%, #2ce28a 100%)}@media screen and (max-width: 768px){.hero.is-success.is-bold .nav-menu{background-image:linear-gradient(141deg, #12af2f 0%, #23d160 71%, #2ce28a 100%)}}@media screen and (max-width: 768px){.hero.is-success .nav-toggle span{background-color:#fff}.hero.is-success .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-success .nav-toggle.is-active span{background-color:#fff}.hero.is-success .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}.hero.is-warning{background-color:#ffdd57;color:rgba(0,0,0,0.7)}.hero.is-warning a:not(.button),.hero.is-warning strong{color:inherit}.hero.is-warning .title{color:rgba(0,0,0,0.7)}.hero.is-warning .subtitle{color:rgba(0,0,0,0.9)}.hero.is-warning .subtitle a:not(.button),.hero.is-warning .subtitle strong{color:rgba(0,0,0,0.7)}.hero.is-warning .nav{box-shadow:0 1px 0 rgba(0,0,0,0.2)}@media screen and (max-width: 768px){.hero.is-warning .nav-menu{background-color:#ffdd57}}.hero.is-warning a.nav-item,.hero.is-warning .nav-item a:not(.button){color:rgba(0,0,0,0.7)}.hero.is-warning a.nav-item:hover,.hero.is-warning a.nav-item.is-active,.hero.is-warning .nav-item a:not(.button):hover,.hero.is-warning .nav-item a:not(.button).is-active{color:rgba(0,0,0,0.7)}.hero.is-warning .tabs a{color:rgba(0,0,0,0.7);opacity:0.9}.hero.is-warning .tabs a:hover{opacity:1}.hero.is-warning .tabs li.is-active a{opacity:1}.hero.is-warning .tabs.is-boxed a,.hero.is-warning .tabs.is-toggle a{color:rgba(0,0,0,0.7)}.hero.is-warning .tabs.is-boxed a:hover,.hero.is-warning .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-warning .tabs.is-boxed li.is-active a,.hero.is-warning .tabs.is-boxed li.is-active a:hover,.hero.is-warning .tabs.is-toggle li.is-active a,.hero.is-warning .tabs.is-toggle li.is-active a:hover{background-color:rgba(0,0,0,0.7);border-color:rgba(0,0,0,0.7);color:#ffdd57}.hero.is-warning.is-bold{background-image:linear-gradient(141deg, #ffaf24 0%, #ffdd57 71%, #fffa70 100%)}@media screen and (max-width: 768px){.hero.is-warning.is-bold .nav-menu{background-image:linear-gradient(141deg, #ffaf24 0%, #ffdd57 71%, #fffa70 100%)}}@media screen and (max-width: 768px){.hero.is-warning .nav-toggle span{background-color:rgba(0,0,0,0.7)}.hero.is-warning .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-warning .nav-toggle.is-active span{background-color:rgba(0,0,0,0.7)}.hero.is-warning .nav-menu .nav-item{border-top-color:rgba(0,0,0,0.2)}}.hero.is-danger{background-color:red;color:#fff}.hero.is-danger a:not(.button),.hero.is-danger strong{color:inherit}.hero.is-danger .title{color:#fff}.hero.is-danger .subtitle{color:rgba(255,255,255,0.9)}.hero.is-danger .subtitle a:not(.button),.hero.is-danger .subtitle strong{color:#fff}.hero.is-danger .nav{box-shadow:0 1px 0 rgba(255,255,255,0.2)}@media screen and (max-width: 768px){.hero.is-danger .nav-menu{background-color:red}}.hero.is-danger a.nav-item,.hero.is-danger .nav-item a:not(.button){color:rgba(255,255,255,0.7)}.hero.is-danger a.nav-item:hover,.hero.is-danger a.nav-item.is-active,.hero.is-danger .nav-item a:not(.button):hover,.hero.is-danger .nav-item a:not(.button).is-active{color:#fff}.hero.is-danger .tabs a{color:#fff;opacity:0.9}.hero.is-danger .tabs a:hover{opacity:1}.hero.is-danger .tabs li.is-active a{opacity:1}.hero.is-danger .tabs.is-boxed a,.hero.is-danger .tabs.is-toggle a{color:#fff}.hero.is-danger .tabs.is-boxed a:hover,.hero.is-danger .tabs.is-toggle a:hover{background-color:rgba(10,10,10,0.1)}.hero.is-danger .tabs.is-boxed li.is-active a,.hero.is-danger .tabs.is-boxed li.is-active a:hover,.hero.is-danger .tabs.is-toggle li.is-active a,.hero.is-danger .tabs.is-toggle li.is-active a:hover{background-color:#fff;border-color:#fff;color:red}.hero.is-danger.is-bold{background-image:linear-gradient(141deg, #c02 0%, red 71%, #ff401a 100%)}@media screen and (max-width: 768px){.hero.is-danger.is-bold .nav-menu{background-image:linear-gradient(141deg, #c02 0%, red 71%, #ff401a 100%)}}@media screen and (max-width: 768px){.hero.is-danger .nav-toggle span{background-color:#fff}.hero.is-danger .nav-toggle:hover{background-color:rgba(10,10,10,0.1)}.hero.is-danger .nav-toggle.is-active span{background-color:#fff}.hero.is-danger .nav-menu .nav-item{border-top-color:rgba(255,255,255,0.2)}}@media screen and (min-width: 769px), print{.hero.is-medium .hero-body{padding-bottom:9rem;padding-top:9rem}}@media screen and (min-width: 769px), print{.hero.is-large .hero-body{padding-bottom:18rem;padding-top:18rem}}.hero.is-fullheight{min-height:100vh}.hero.is-fullheight .hero-body{align-items:center;display:flex}.hero.is-fullheight .hero-body>.container{flex-grow:1;flex-shrink:1}.section{background-color:#fff;padding:3rem 1.5rem}@media screen and (min-width: 1000px){.section.is-medium{padding:9rem 1.5rem}.section.is-large{padding:18rem 1.5rem}}.footer{background-color:#f5f5f5;padding:3rem 1.5rem 6rem}html{overflow-y:auto !important}.header.is-fixed-top{z-index:1030;position:fixed;top:0;left:0;right:0}.has-fixed-nav{margin-top:50px}.section.is-small{padding:1rem 1.5rem}.textarea.is-fluid{min-height:1em;overflow:hidden;resize:none;transition:min-height 0.3s}.textarea.is-fluid:focus{min-height:6em;overflow:auto}.nav-inverse{background:#182b73}.nav-inverse a.nav-item{color:#f2f2f2}.nav-inverse a.nav-item:hover{color:#d1d5e3}.nav-inverse a.nav-item.is-active{color:#fff}.nav-inverse a.nav-item.is-tab:hover{border-bottom-color:#fff}.nav-inverse a.nav-item.is-tab.is-active{border-bottom:3px solid #fff;color:#fff}.nav-slider-container .nav-slider{position:fixed;top:0;bottom:0;z-index:1040;overflow-y:auto;text-align:center;background:#182b73;color:#fff;left:-250px;width:250px;transition:left 0.5s}.nav-slider-container .nav-slider.is-active{left:0}.nav-slider-container .nav-slider .nav-item{cursor:pointer;display:block;padding-top:10px;padding-bottom:9px;background:rgba(255,255,255,0.1)}.nav-slider-container .nav-slider .nav-item.is-active{background:linear-gradient(to right, rgba(255,255,255,0.4), rgba(255,255,255,0.1) 5%)}.nav-slider-container .nav-slider .nav-item[open]>summary{margin-bottom:9px}.nav-slider-container .nav-slider .nav-item:not(:last-child){border-bottom:1px solid #fff}.nav-slider-container .nav-slider ~ .is-overlay{background:rgba(0,0,0,0.5);z-index:1035;visibility:hidden;position:fixed;opacity:0;transition:opacity 0.75s}.nav-slider-container .nav-slider.is-active ~ .is-overlay{visibility:visible;opacity:1}#container>div:not(.visible){display:none}#container>div{position:relative;height:calc(100vh - 50px);overflow-y:auto;-webkit-overflow-scrolling:touch}.bot-notification{position:fixed;top:0.6em;right:1em;z-index:1035;min-width:200px;border-radius:5px;padding:5px;background:#fff;color:#182b73;opacity:0;transition:opacity 1s}.bot-notification.is-active{opacity:1}\n";
    document.head.appendChild(el);
    // Polyfill for Edge
    if (!('open' in document.createElement('details'))) {
        var style = document.createElement('style');
        style.textContent += "details:not([open]) > :not(summary) { display: none !important; } details > summary:before { content: \"\u25B6\"; display: inline-block; font-size: .8em; width: 1.5em; font-family:\"Courier New\"; } details[open] > summary:before { transform: rotate(90deg); }";
        document.head.appendChild(style);
        window.addEventListener('click', function (event) {
            var target = event.target;
            if (target.tagName == 'SUMMARY') {
                var details = target.parentNode;
                if (!details) {
                    return;
                }
                if (details.getAttribute('open')) {
                    details.open = false;
                    details.removeAttribute('open');
                }
                else {
                    details.open = true;
                    details.setAttribute('open', 'open');
                }
            }
        });
    }
    var tabManager = new tabs_1.TabManager(document.querySelector('.nav-slider-container .nav-slider'), document.querySelector('#container'));
    // Exports
    var _a = require('./notifications'), notify = _a.notify, alert = _a.alert;
    var uiExports = {
        toggleMenu: function () {
            document.querySelector('.nav-slider-container .nav-slider').classList.toggle('is-active');
        },
        addTab: function (text, groupName) { return tabManager.addTab(text, groupName); },
        removeTab: function (content) { return tabManager.removeTab(content); },
        addTabGroup: function (text, groupName, parent) {
            return tabManager.addTabGroup(text, groupName, parent);
        },
        removeTabGroup: function (groupName) { return tabManager.removeTabGroup(groupName); },
        tabShown: tabManager.tabShown,
        buildTemplate: template_1.buildTemplate,
        notify: notify,
        alert: alert,
        TabManager: tabs_1.TabManager,
    };
    ex.exports = uiExports;
    try {
        // Showing / hiding the menu
        for (var _b = __values(document.querySelectorAll('.nav-slider-toggle')), _c = _b.next(); !_c.done; _c = _b.next()) {
            var node = _c.value;
            node.addEventListener('click', uiExports.toggleMenu);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_d = _b.return)) _d.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var e_1, _d;
});

},{"../../bot":3,"./notifications":8,"./tabs":9,"./template":10}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Holds the current alert and queue of further alerts.
 */
var modal = document.querySelector('#alert');
var modalBody = modal.querySelector('.modal-card-body');
var modalFooter = modal.querySelector('.modal-card-foot');
var instance = {
    active: false,
    queue: [],
};
modalFooter.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || target.tagName != 'A') {
        return;
    }
    if (instance.current && instance.current.callback) {
        // Text is a special property of anchor elements that always contains the text, textContent can be null.
        try {
            instance.current.callback(target.text);
        }
        catch (e) {
            console.error("Error running button handler: ", e);
        }
    }
    modal.classList.remove('is-active');
    modalFooter.innerHTML = '';
    instance.active = false;
    // Are more alerts waiting to be shown?
    var next = instance.queue.shift();
    if (next) {
        alert(next.html, next.buttons, next.callback);
    }
});
function addButton(button) {
    if (typeof button == 'string') {
        addButton({ text: button });
        return;
    }
    var el = document.createElement('a');
    el.innerHTML = button.text;
    el.classList.add('button');
    if (button.style) {
        el.classList.add(button.style);
    }
    modalFooter.appendChild(el);
}
function alert(html, buttons, callback) {
    if (instance.active) {
        instance.queue.push({ html: html, buttons: buttons, callback: callback });
        return;
    }
    instance.active = true;
    instance.current = { html: html, buttons: buttons, callback: callback };
    modalBody.innerHTML = html;
    if (Array.isArray(buttons)) {
        buttons.forEach(addButton);
    }
    modal.classList.add('is-active');
}
exports.alert = alert;

},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function notify(text, displayTime) {
    if (displayTime === void 0) { displayTime = 2; }
    var el = document.createElement('div');
    el.classList.add('bot-notification', 'is-active');
    el.textContent = text;
    document.body.appendChild(el);
    var timeouts = [
        // Fade out after displayTime
        setTimeout(function () {
            el.classList.remove('is-active');
        }, displayTime * 1000),
        // Remove after fade out
        setTimeout(function () {
            el.remove();
        }, displayTime * 1000 + 2100)
    ];
    el.addEventListener('click', function (event) {
        timeouts.forEach(clearTimeout);
        event.target.remove();
    });
}
exports.notify = notify;
var alert_1 = require("./alert");
exports.alert = alert_1.alert;

},{"./alert":7}],9:[function(require,module,exports){
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
Object.defineProperty(exports, "__esModule", { value: true });
var simpleevent_1 = require("../../libraries/simpleevent");
/**
 * Class which manages a set of tabs, exported by the UI extension.
 * Extensions may use this class to manage tabs internally.
 */
var TabManager = (function () {
    /**
     * Creates a new TabManager instance.
     *
     * @param navigationRoot the root element for navigation items
     * @param contentRoot the root element which content should be added to.
     */
    function TabManager(navigationRoot, contentRoot) {
        var _this = this;
        this.tabUID = 0;
        /**
         * Fired whenever a tab is shown
         *
         * @param <TEvent> the tab which was shown
         */
        this.tabShown = new simpleevent_1.SimpleEvent();
        this.navigationRoot = navigationRoot;
        this.contentRoot = contentRoot;
        this.navigationRoot.addEventListener('click', function (event) {
            var tabNav = event.target;
            var tabName = tabNav.dataset.tabName;
            var content = _this.contentRoot.querySelector("[data-tab-name=" + tabName + "]");
            if (!tabName || !content) {
                return;
            }
            try {
                for (var _a = __values(_this.contentRoot.querySelectorAll('.visible')), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var el = _b.value;
                    el.classList.remove('visible');
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
            }
            content.classList.add('visible');
            try {
                for (var _d = __values(_this.navigationRoot.querySelectorAll('.is-active')), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var el = _e.value;
                    el.classList.remove('is-active');
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_f = _d.return)) _f.call(_d);
                }
                finally { if (e_2) throw e_2.error; }
            }
            tabNav.classList.add('is-active');
            _this.tabShown.dispatch(content);
            var e_1, _c, e_2, _f;
        });
    }
    /**
     * Removes all tabs in the collection. Does not remove tab groups.
     */
    TabManager.prototype.removeAll = function () {
        for (var i = this.contentRoot.children.length; i >= 0; i--) {
            this.removeTab(this.contentRoot.children[i]);
        }
    };
    /**
     * Adds a tab to the content root, the children of the returned <div> may be modified however you like.
     *
     * @param text the text which should appear in the menu for the tab
     * @param groupName the tab group to add the tab to, if omitted the tab will be added to the root navigation.
     * @return the div which the tab content should be placed in.
     */
    TabManager.prototype.addTab = function (text, groupName) {
        var tabName = 'tab_' + this.tabUID++;
        var tab = document.createElement('span');
        var content = document.createElement('div');
        tab.textContent = text;
        tab.classList.add('nav-item');
        tab.dataset.tabName = content.dataset.tabName = tabName;
        var navParent;
        if (groupName) {
            navParent = this.navigationRoot.querySelector("[data-tab-group=" + groupName + "]");
            if (!navParent) {
                throw new Error("Tab group " + groupName + " does not exist.");
            }
        }
        else {
            navParent = this.contentRoot;
        }
        navParent.appendChild(tab);
        this.contentRoot.appendChild(content);
        return content;
    };
    /**
     * Removes a tab from the tab root, if it exists, otherwise has no effect.
     *
     * @param content the tab which should be removed.
     */
    TabManager.prototype.removeTab = function (content) {
        var nav = this.navigationRoot.querySelector(".nav-item[data-tab-name=" + content.dataset.tabName + "]");
        if (nav) {
            nav.remove();
            content.remove();
            return true;
        }
        return false;
    };
    /**
     * Adds a new tab group to the tab content, if it does not already exist. If it exists, the text of the group will be updated. Supplying a new parent name will not update the parent. (TODO)
     *
     * @param text the text to display in group dropdown
     * @param groupName the name of the group to create or update
     * @param parent the parent of this group, if not provided the group will be added to the root of the navigation tree.
     */
    TabManager.prototype.addTabGroup = function (text, groupName, parent) {
        var group = this.navigationRoot.querySelector("[data-tab-group=\"" + groupName + "\"]");
        if (group) {
            group.querySelector('summary').textContent = text;
            return;
        }
        group = document.createElement('details');
        var summary = document.createElement('summary');
        summary.textContent = text;
        group.appendChild(summary);
        var parentNav = this.navigationRoot.querySelector("[data-tab-group=\"" + parent + "\"]");
        if (parentNav) {
            parentNav.appendChild(group);
        }
        else {
            throw new Error('Parent group does not exist.');
        }
    };
    /**
     * Removes a tab group and all tabs contained within the group.
     *
     * @param groupName the group to remove.
     * @return boolean true if the group existed and was removed, otherwise false.
     */
    TabManager.prototype.removeTabGroup = function (groupName) {
        var group = this.navigationRoot.querySelector("[data-tab-group=\"" + groupName + "\"]");
        if (!group) {
            return false;
        }
        try {
            for (var _a = __values(group.querySelectorAll('span')), _b = _a.next(); !_b.done; _b = _a.next()) {
                var item = _b.value;
                this.contentRoot.querySelector("[data-tab-name=\"" + item.dataset.tabName + "\"]").remove();
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_3) throw e_3.error; }
        }
        group.remove();
        return true;
        var e_3, _c;
    };
    return TabManager;
}());
exports.TabManager = TabManager;

},{"../../libraries/simpleevent":21}],10:[function(require,module,exports){
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Updates an element according to the passed rule.
 *
 * @param el the element to update.
 * @param rule the rule to use to update the element.
 */
function updateElement(el, rule) {
    if (typeof rule.text == 'string') {
        el.textContent = rule.text;
    }
    else if (typeof rule.html == 'string') {
        el.innerHTML = rule.html;
    }
    Object.keys(rule)
        .filter(function (key) { return !['selector', 'text', 'html', 'remove', 'multiple'].includes(key); })
        .forEach(function (key) { return el.setAttribute(key, rule[key]); });
}
/**
 * Finds elements to update using the passed rule.
 *
 * @param parent the parent to check for matching nodes.
 * @param rule the rule to use.
 */
function handleRule(parent, rule) {
    if (rule.multiple) {
        Array.from(parent.querySelectorAll(rule.selector)).forEach(function (el) {
            updateElement(el, rule);
        });
    }
    else {
        var el = parent.querySelector(rule.selector);
        if (!el) {
            console.warn("Unable to update " + rule.selector + ".", rule);
            return;
        }
        updateElement(el, rule);
    }
}
/**
 * Builds a template into a new node using the provided rules.
 *
 * @hidden
 * @param template the template to clone.
 * @param target the parent node to append the cloned template to.
 * @param rules the rules to apply to the cloned template before appending it to the target.
 */
function buildTemplate(template, target, rules) {
    if (typeof template == 'string') {
        template = document.querySelector(template);
        if (!template)
            throw new Error("Template not found.");
    }
    if (typeof target == 'string') {
        target = document.querySelector(target);
        if (!target)
            throw new Error("Target not found.");
    }
    // Remove this cast when Typedoc updates to Typescript 2.3
    var parent = document.importNode(template.content, true);
    try {
        for (var rules_1 = __values(rules), rules_1_1 = rules_1.next(); !rules_1_1.done; rules_1_1 = rules_1.next()) {
            var rule = rules_1_1.value;
            handleRule(parent, rule);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (rules_1_1 && !rules_1_1.done && (_a = rules_1.return)) _a.call(rules_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    target.appendChild(parent);
    var e_1, _a;
}
exports.buildTemplate = buildTemplate;

},{}],11:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chatwatcher_1 = require("./libraries/portal/chatwatcher");
var api_1 = require("./libraries/portal/api");
var world_1 = require("./libraries/blockheads/world");
var storage_1 = require("./libraries/storage");
var bot_1 = require("./bot");
global.MessageBot = bot_1.MessageBot;
var simpleevent_1 = require("./libraries/simpleevent");
global.SimpleEvent = simpleevent_1.SimpleEvent;
require("./extensions/ui");
require("./extensions/console-browser");
var world = new world_1.World({
    api: new api_1.PortalApi(worldId),
    chatWatcher: new chatwatcher_1.PortalChatWatcher({
        worldId: worldId,
        firstId: window.firstId - 50 || 0,
    }),
    storage: new storage_1.Storage(worldId)
});
new bot_1.MessageBot(world);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./bot":3,"./extensions/console-browser":5,"./extensions/ui":6,"./libraries/blockheads/world":16,"./libraries/portal/api":17,"./libraries/portal/chatwatcher":19,"./libraries/simpleevent":21,"./libraries/storage":22}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class to watch chat for commands and update the stored lists as needed. You don't need to know anything about this class. It is only used by the [[World]] class internally to keep lists up to date.
 */
var CommandWatcher = (function () {
    /**
     * Creates a new instance of the class.
     *
     * @param lists the lists to keep up to date.
     * @param getPlayer a callback to be used for getting player info. Must return an instance of Player
     */
    function CommandWatcher(lists, getPlayer) {
        this.lists = lists;
        this.getPlayer = getPlayer;
        this.listener = this.listener.bind(this);
    }
    /**
     * Function called whenever new commands come in.
     *
     * @param sender the world
     * @param player the player doing the command
     * @param command the command used
     * @param args any arguments supplied
     */
    //tslint:disable-next-line:cyclomatic-complexity
    CommandWatcher.prototype.listener = function (_a) {
        var player = _a.player, command = _a.command, args = _a.args;
        var target = this.getPlayer(args);
        switch (command.toLocaleLowerCase()) {
            case 'ban':
            case 'ban-no-device':
                this.ban(player, target);
                break;
            case 'unban':
                this.unban(player, target);
                break;
            case 'whitelist':
                this.whitelist(player, target);
                break;
            case 'unwhitelist':
                this.unwhitelist(player, target);
                break;
            case 'mod':
                this.mod(player, target);
                break;
            case 'unmod':
                this.unmod(player, target);
                break;
            case 'admin':
                this.admin(player, target);
                break;
            case 'unadmin':
                this.unadmin(player, target);
                break;
            case 'clear-blacklist':
            case 'clear-whitelist':
            case 'clear-modlist':
            case 'clear-adminlist':
                this.clear(command.substr(6), player);
                break;
        }
    };
    /**
     * Handles /ban and /ban-no-device commands
     *
     * @param player the player sending the message
     * @param target the player to ban
     */
    CommandWatcher.prototype.ban = function (player, target) {
        if (player.isStaff()) {
            if (player.isMod() && target.isStaff()) {
                return;
            }
            else if (target.isOwner()) {
                return;
            }
            this.add('blacklist', target);
            this.remove('adminlist', target);
            this.remove('modlist', target);
            this.remove('whitelist', target);
        }
    };
    /**
     * Handles the /unban command.
     *
     * @param player the player sending the command
     * @param target the player to unban.
     */
    CommandWatcher.prototype.unban = function (player, target) {
        if (player.isStaff()) {
            this.remove('blacklist', target);
        }
    };
    /**
     * Handles the /whitelist command.
     *
     * @param player the player sending the command.
     * @param target the player to whitelist.
     */
    CommandWatcher.prototype.whitelist = function (player, target) {
        if (player.isStaff()) {
            this.add('whitelist', target);
            this.remove('blacklist', target);
        }
    };
    /**
     * Handles the /unwhitelist command.
     *
     * @param player the player sending the command.
     * @param target the player to remove from the whitelist.
     */
    CommandWatcher.prototype.unwhitelist = function (player, target) {
        if (player.isStaff()) {
            this.remove('whitelist', target);
        }
    };
    /**
     * Handles the /mod command.
     *
     * @param player the player sending the command.
     * @param target the player to mod.
     */
    CommandWatcher.prototype.mod = function (player, target) {
        if (player.isAdmin()) {
            this.add('modlist', target);
            this.remove('blacklist', target);
        }
    };
    /**
     * Handles the /unmod command.
     *
     * @param player the player sending the command
     * @param target the player to remove from the modlist.
     */
    CommandWatcher.prototype.unmod = function (player, target) {
        if (player.isAdmin()) {
            this.remove('modlist', target);
        }
    };
    /**
     * Handles the /admin command.
     *
     * @param player the player sending the command.
     * @param target the player to admin.
     */
    CommandWatcher.prototype.admin = function (player, target) {
        if (player.isAdmin()) {
            this.add('adminlist', target);
            this.remove('blacklist', target);
        }
    };
    /**
     * Handles the /unadmin command.
     *
     * @param player the player sending the command.
     * @param target the player to remove from the adminlist.
     */
    CommandWatcher.prototype.unadmin = function (player, target) {
        if (player.isAdmin() && !target.isOwner()) {
            this.remove('adminlist', target);
        }
    };
    /**
     * Handles /clear-list commands.
     *
     * @param list the list to clear.
     * @param player the payer sending the command.
     */
    CommandWatcher.prototype.clear = function (list, player) {
        if (player.isAdmin()) {
            this.lists[list].length = 0;
        }
    };
    /**
     * Handles adding a player to a list.
     *
     * @param list the list to add the player to.
     * @param player the player to add to the list.
     */
    CommandWatcher.prototype.add = function (list, player) {
        if (!this.lists[list].includes(player.getName())) {
            this.lists[list].push(player.getName());
        }
    };
    /**
     * Handles removing players from a list.
     *
     * @param list the list to remove the player from.
     * @param player the player to remove.
     */
    CommandWatcher.prototype.remove = function (list, player) {
        if (this.lists[list].includes(player.getName())) {
            this.lists[list].splice(this.lists[list].indexOf(player.getName()), 1);
        }
    };
    return CommandWatcher;
}());
exports.CommandWatcher = CommandWatcher;

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Player class which is returned by the [[World.getPlayer]] method. Should not be created by any other method.
 */
var Player = (function () {
    /**
     * Creates a new instance of the Player class.
     *
     * @param name - the name of the player.
     * @param info - the player info stored between bot launches.
     */
    function Player(name, info, lists) {
        this.name = name;
        this.info = info;
        this.lists = lists;
    }
    /**
     * Checks if the player has joined the server.
     *
     * @return true if the player has joined before, otherwise false.
     */
    Player.prototype.hasJoined = function () {
        return this.info.joins > 0;
    };
    /**
     * Gets the player's name.
     *
     * @return The name of the player.
     */
    Player.prototype.getName = function () {
        return this.name;
    };
    /**
     * Gets the most recently used IP of the player.
     *
     * @return the player's IP
     */
    Player.prototype.getIP = function () {
        return this.info.ip;
    };
    /**
     * Gets the all IPs used by the player on the world.
     *
     * @return an array of IPs
     */
    Player.prototype.getIPs = function () {
        return this.info.ips.slice(0);
    };
    /**
     * Gets the number of times the player has joined the server.
     *
     * @return how many times the player has joined.
     */
    Player.prototype.getJoins = function () {
        return this.info.joins;
    };
    /**
     * Returns true if the player is the owner of the server or is the server.
     *
     * @return true if the player is the owner.
     */
    Player.prototype.isOwner = function () {
        return !!this.info.owner || this.name == 'SERVER';
    };
    /**
     * Checks if the player is an admin.
     *
     * @return true if the player is an admin.
     */
    Player.prototype.isAdmin = function () {
        return this.lists.adminlist.includes(this.name) || this.isOwner();
    };
    /**
     * Checks if the player is a mod without admin permissions.
     *
     * @return true if the player is an admin and not a mod.
     */
    Player.prototype.isMod = function () {
        return this.lists.modlist.includes(this.name) && !this.isAdmin();
    };
    /**
     * Checks if the player is an admin or a mod.
     *
     * @return true if the player is an admin or a mod.
     */
    Player.prototype.isStaff = function () {
        return this.isAdmin() || this.isMod();
    };
    /**
     * Checks if the player is whitelisted.
     *
     * @return true if the player can join the server when it is whitelisted.
     */
    Player.prototype.isWhitelisted = function () {
        return this.lists.whitelist.includes(this.name) || this.isStaff();
    };
    /**
     * Checks if the player is banned.
     *
     * @return true if the player is on the blacklist.
     */
    Player.prototype.isBanned = function () {
        return this.lists.blacklist.includes(this.name);
    };
    return Player;
}());
exports.Player = Player;

},{}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Enum which indicates the properties included in a [[ChatMessage]].
 */
var ChatType;
(function (ChatType) {
    /**
     * For when a player joins the server.
     */
    ChatType[ChatType["join"] = 0] = "join";
    /**
     * When a player who is currently online leaves the server.
     */
    ChatType[ChatType["leave"] = 1] = "leave";
    /**
     * For all chat, from server and players. Includes messages starting with /
     */
    ChatType[ChatType["message"] = 2] = "message";
    /**
     * For commands from the server and players.
     */
    ChatType[ChatType["command"] = 3] = "command";
    /**
     * For log messages from the world, and messages which fail to parse, including leave messages from players who are not online.
     */
    ChatType[ChatType["other"] = 4] = "other";
})(ChatType = exports.ChatType || (exports.ChatType = {}));

},{}],16:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var chat_1 = require("./types/chat");
var simpleevent_1 = require("../simpleevent");
var player_1 = require("./player");
var commandwatcher_1 = require("./commandwatcher");
/**
 * Class which contains functions for interacting with a world. Extensions can access this through ex.world.
 */
var World = (function () {
    /**
     * Creates an instance of the World class. Note: These parameters are all passed in a single object.
     *
     * @param options the options to use when creating the class.
     */
    function World(_a) {
        var api = _a.api, storage = _a.storage, chatWatcher = _a.chatWatcher;
        var _this = this;
        this.STORAGE_ID = 'mb_players';
        // Events
        /**
         * Event fired whenever a player joins the server.
         */
        this.onJoin = new simpleevent_1.SimpleEvent();
        /**
         * Event fired whenever a player leaves the server.
         */
        this.onLeave = new simpleevent_1.SimpleEvent();
        /**
         * Event fired for all chat.
         */
        this.onMessage = new simpleevent_1.SimpleEvent();
        /**
         * Event fired for commands by all players.
         */
        this.onCommand = new simpleevent_1.SimpleEvent();
        /**
         * Event fired for all messages which failed to be parsed.
         */
        this.onOther = new simpleevent_1.SimpleEvent();
        this.storage = storage;
        this.api = api;
        this.players = this.storage.getObject(this.STORAGE_ID, {});
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var overview, lists, watcher;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!chatWatcher) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.getOverview()];
                    case 1:
                        overview = _a.sent();
                        if (this.players[overview.owner]) {
                            this.players[overview.owner].owner = true;
                        }
                        chatWatcher.setup(overview.name, overview.online);
                        chatWatcher.onMessage.subscribe(this.messageWatcher.bind(this));
                        return [4 /*yield*/, this.getLists()];
                    case 2:
                        lists = _a.sent();
                        watcher = new commandwatcher_1.CommandWatcher(lists, this.getPlayer);
                        this.onCommand.subscribe(watcher.listener);
                        return [2 /*return*/];
                }
            });
        }); })();
    }
    //Methods
    /**
     * Gets the current admin, mod, white, and black lists. The returned object should not be mutated.
     *
     * @return the current server lists.
     * @example
     * getLists().then(lists => {
     *   console.log(Object.keys(lists));
     * });
     */
    World.prototype.getLists = function () {
        var _this = this;
        if (this.lists) {
            return Promise.resolve(this.lists);
        }
        return this.api.getLists()
            .then(function (lists) { return _this.lists = lists; });
    };
    /**
     * Gets the server logs and resolves with an array of the lines. The returned array should not be mutated.
     *
     * @param refresh whether or not the logs should be downloaded again.
     * @return the server logs.
     * @example
     * getLogs().then(lines => {
     *   lines.forEach(line => {
     *     //something
     *   });
     * });
     */
    World.prototype.getLogs = function (refresh) {
        var _this = this;
        if (refresh === void 0) { refresh = false; }
        if (this.logs && !refresh) {
            return Promise.resolve(this.logs);
        }
        return this.api.getLogs()
            .then(function (logs) { return _this.logs = logs; });
    };
    /**
     * Gets an overview of the server info, the returned object should not be mutated.
     *
     * @param refresh whether or not to re-fetch the page.
     * @return the world info.
     * @example
     * getOverview().then(console.log);
     */
    World.prototype.getOverview = function (refresh) {
        var _this = this;
        if (refresh === void 0) { refresh = false; }
        if (this.overview && !refresh) {
            return Promise.resolve(this.overview);
        }
        var online = this.overview ? this.overview.online : [];
        return this.api.getOverview().then(function (overview) {
            overview.online.forEach(function (name) {
                if (!online.includes(name)) {
                    online.push(name);
                }
            });
            overview.online = online;
            return _this.overview = overview;
        });
    };
    /**
     * Adds a message into the queue of messages to send.
     *
     * @param message the message to send.
     * @example
     * send('Hello!');
     */
    World.prototype.send = function (message) {
        this.api.send(message);
    };
    /**
     * Gets the names of all players which have joined the server.
     *
     * @return an array of names.
     * @example
     * world.getPlayerNames().forEach(name => {
     *   if (world.getPlayer(name).isAdmin()) {
     *     console.log(name);
     *   }
     * });
     */
    World.prototype.getPlayerNames = function () {
        return Object.keys(this.players);
    };
    /**
     * Gets an instance of the Player class for the specified name.
     *
     * @param name the player name to get.
     * @return the player, or a dummy player if they do not exist.
     * @example
     * let player = getPlayer('someone');
     * if (player.hasJoined()) { ... }
     */
    World.prototype.getPlayer = function (name) {
        name = name.toLocaleUpperCase();
        var info = this.players[name] || { ip: '', ips: [], joins: 0 };
        if (this.overview && this.overview.owner == name) {
            this.players[name].owner = true;
        }
        return new player_1.Player(name, info, this.lists || { adminlist: [], modlist: [], whitelist: [], blacklist: [] });
    };
    // Private methods
    /**
     * Continually watches chat for new messages and emits events when new messages come in.
     *
     * @param message the message to emit events for.
     */
    World.prototype.messageWatcher = function (message) {
        var player = this.getPlayer(message.name || '');
        switch (message.type) {
            case chat_1.ChatType.join:
                return this.handleJoin(message.name, message.ip);
            case chat_1.ChatType.leave:
                return this.onLeave.dispatch(player);
            case chat_1.ChatType.command:
                return this.onCommand.dispatch({ player: player, command: message.command, args: message.args });
            case chat_1.ChatType.message:
                return this.onMessage.dispatch({ player: player, message: message.message });
            case chat_1.ChatType.other:
                return this.onOther.dispatch(message.message);
        }
    };
    /**
     * Increments a player's joins and saves their IP.
     *
     * @param name the player's name
     * @param ip the player's IP
     */
    World.prototype.handleJoin = function (name, ip) {
        if (!name || !ip) {
            return;
        }
        var player = this.players[name] = this.players[name] || {
            ip: ip, ips: [ip], joins: 0
        };
        player.joins++;
        player.ip = ip;
        if (!player.ips.includes(ip)) {
            player.ips.push(ip);
        }
        this.storage.set(this.STORAGE_ID, this.players);
        this.onJoin.dispatch(this.getPlayer(name));
    };
    return World;
}());
exports.World = World;

},{"../simpleevent":21,"./commandwatcher":13,"./player":14,"./types/chat":15}],17:[function(require,module,exports){
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
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ajax_1 = require("../../ajax");
var logparser_1 = require("../logparser");
/**
 * This class is only used by the [[World]] class. Unless you are creating new instances of the [[World]] class, you probably don't need to know anything about this class.
 *
 */
var PortalApi = (function () {
    /**
     * Creates a new instance of the class.
     *
     * @param worldId the worldId to use when communicating with the server.
     */
    function PortalApi(worldId) {
        this.worldId = worldId;
        this.messageQueue = [];
        this.logParser = new logparser_1.PortalLogParser();
        this.postMessage = this.postMessage.bind(this);
        this.postMessage();
    }
    /**
     * @inheritdoc
     */
    PortalApi.prototype.getLists = function () {
        var _this = this;
        return this.worldOnline()
            .then(function () { return ajax_1.Ajax.get("/worlds/lists/" + _this.worldId); })
            .then(function (html) {
            function getList(name) {
                var list = html.match(new RegExp("<textarea name=\"" + name + "\">([\\s\\S]*?)</textarea>"));
                if (list) {
                    var temp = list[1].replace(/(&.*?;)/g, function (_match, first) {
                        var map = {
                            '&lt;': '<',
                            '&gt;': '>',
                            '&amp;': '&',
                            '&#39;': '\''
                        }; //It seems these are the only escaped characters.
                        return map[first] || '';
                    });
                    var names = temp.toLocaleUpperCase().split('\n');
                    return __spread(new Set(names)).filter(Boolean); // Remove duplicates
                }
                return []; // World offline, just to be safe.
            }
            var lists = {
                adminlist: getList('admins'),
                modlist: getList('modlist'),
                whitelist: getList('whitelist'),
                blacklist: getList('blacklist'),
            };
            // Remove device IDs
            lists.blacklist = lists.blacklist.map(function (name) {
                var match = name.match(/(.*)(?:\\.{32})/);
                if (match)
                    return match[1];
                return name;
            });
            // Remove blacklisted staff
            lists.blacklist = lists.blacklist
                .filter(function (name) { return !lists.adminlist.includes(name) && !lists.modlist.includes(name); });
            return lists;
        });
    };
    /**
     * @inheritdoc
     */
    PortalApi.prototype.getOverview = function () {
        return ajax_1.Ajax.get("/worlds/" + this.worldId)
            .then(function (html) {
            var firstMatch = function (r) {
                var m = html.match(r);
                return m ? m[1] : '';
            };
            var temp = html.match(/^\$\('#privacy'\).val\('(.*?)'\)/m);
            var privacy;
            if (temp) {
                privacy = temp[1];
            }
            else {
                privacy = 'public';
            }
            var online = [];
            var match = html.match(/^\t<tr><td class="left">(.*?)(?=<\/td>)/gm);
            if (match) {
                online = online.concat(match.map(function (s) { return s.substr(22); }));
            }
            // This is very messy, refactoring welcome.
            return {
                name: firstMatch(/^\t<title>(.*?) Manager \| Portal<\/title>$/m),
                owner: firstMatch(/^\t\t<td class="right">Owner:<\/td>\r?\n\t\t<td>(.*?)<\/td>$/m),
                created: new Date(firstMatch(/^\t\t<td>Created:<\/td><td>(.*?)<\/td>$/m) + ' GMT-0000'),
                last_activity: new Date(firstMatch(/^\t\t<td>Last Activity:<\/td><td>(.*?)<\/td>$/m) + ' GMT-0000'),
                credit_until: new Date(firstMatch(/^\t\t<td>Credit Until:<\/td><td>(.*?)<\/td>$/m) + ' GMT-0000'),
                link: firstMatch(/^\t<tr><td>Link:<\/td><td><a href="(.*)">\1<\/a>/m),
                pvp: !!firstMatch(/^\$\('#pvp'\)\./m),
                privacy: privacy,
                password: firstMatch(/^\t\t<td>Password:<\/td><td>(Yes|No)<\/td><\/tr>$/m) == 'Yes',
                size: firstMatch(/^\t\t<td>Size:<\/td><td>(.*?)<\/td>$/m),
                whitelist: firstMatch(/<td>Whitelist:<\/td><td>(Yes|No)<\/td>/m) == 'Yes',
                online: online,
            };
        });
    };
    /**
     * @inheritdoc
     */
    PortalApi.prototype.getLogs = function () {
        var _this = this;
        return this.worldOnline()
            .then(function () { return ajax_1.Ajax.get("/worlds/logs/" + _this.worldId); })
            .then(function (logs) { return logs.split('\n'); })
            .then(this.logParser.parse);
    };
    /**
     * @inheritdoc
     */
    PortalApi.prototype.send = function (message) {
        this.messageQueue.push(message);
    };
    /**
     * Waits until the world is online before resolving.
     */
    PortalApi.prototype.worldOnline = function () {
        var _this = this;
        return ajax_1.Ajax.postJSON("/api", { command: 'status', worldId: this.worldId })
            .then(function (response) {
            if (response.status != 'ok') {
                throw new Error('Api error');
            }
            if (response.worldStatus != 'online') {
                ajax_1.Ajax.postJSON("/api", { command: 'start', worldId: _this.worldId })
                    .catch(console.error);
                throw new Error('World should be online');
            }
        })
            .catch(function () { return _this.worldOnline(); });
    };
    /**
     * Sends the oldest queued message if possible.
     */
    PortalApi.prototype.postMessage = function () {
        var _this = this;
        if (this.messageQueue.length) {
            ajax_1.Ajax.postJSON("/api", {
                command: 'send',
                worldId: this.worldId,
                message: this.messageQueue.shift()
            })
                .then(function () {
                setTimeout(_this.postMessage, 500);
            }, function () {
                setTimeout(_this.postMessage, 1000);
            });
        }
        else {
            setTimeout(this.postMessage, 500);
        }
    };
    return PortalApi;
}());
exports.PortalApi = PortalApi;

},{"../../ajax":12,"../logparser":20}],18:[function(require,module,exports){
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
var chat_1 = require("../blockheads/types/chat");
/**
 * Parses chat in the format recieved from the portal API.
 *
 * This is only used by the [[PortalChatWatcher]] class.
 */
var PortalChatParser = (function () {
    /**
     * Creates a new instance of the ChatParser class.
     *
     * @param name the name of the world
     * @param online currently online players.
     */
    function PortalChatParser(name, online) {
        this.name = name;
        this.online = online;
        this.parse = this.parse.bind(this);
    }
    /**
     * Parses a string as a chat message and emits an event for the message.
     *
     * @param messages the messages to parse.
     */
    PortalChatParser.prototype.parse = function (messages) {
        var _this = this;
        this.messages = [];
        messages.forEach(function (message) {
            if (message.startsWith(_this.name + " - Player Connected ")) {
                var temp = message.match(/ - Player Connected (.*) \| ([\d.]+) \| ([\w]{32})\s*$/);
                if (temp) {
                    var _a = __read(temp, 3), name_1 = _a[1], ip = _a[2];
                    _this.handleJoin(name_1, ip);
                }
                else {
                    _this.messages.push({ type: chat_1.ChatType.other, message: message });
                }
            }
            else if (message.startsWith(_this.name + " - Player Disconnected ")) {
                var name_2 = message.substring(_this.name.length + 23);
                _this.handleLeave(name_2);
            }
            else if (message.includes(': ')) {
                var name_3 = _this.getUsername(message);
                if (name_3) {
                    var msg = message.substring(name_3.length + 2);
                    _this.handleChat(name_3, msg);
                }
                else {
                    _this.messages.push({ type: chat_1.ChatType.other, message: message });
                }
            }
            else {
                _this.messages.push({ type: chat_1.ChatType.other, message: message });
            }
        });
        return this.messages;
    };
    /**
     * Keeps the online list up to date and emits join events.
     *
     * @param name the name of the player who is joining.
     * @param ip the ip of the player who is joining.
     */
    PortalChatParser.prototype.handleJoin = function (name, ip) {
        if (!this.online.includes(name)) {
            this.online.push(name);
        }
        this.messages.push({ type: chat_1.ChatType.join, name: name, ip: ip });
    };
    /**
     * Keeps the online list up to date and emits leave events.
     *
     * @param name the name of the player leaving.
     */
    PortalChatParser.prototype.handleLeave = function (name) {
        if (this.online.includes(name)) {
            this.online.splice(this.online.indexOf(name), 1);
            this.messages.push({ type: chat_1.ChatType.leave, name: name });
        }
    };
    /**
     * Checks the chat type and parses accordingly.
     *
     * @param name the name of the player chatting.
     * @param message the message sent.
     */
    PortalChatParser.prototype.handleChat = function (name, message) {
        this.messages.push({ type: chat_1.ChatType.message, name: name, message: message });
        if (message.startsWith('/') && !message.startsWith('/ ')) {
            var command = message.substr(1);
            var args = '';
            if (command.includes(' ')) {
                command = command.substring(0, command.indexOf(' '));
                args = message.substring(message.indexOf(' ') + 1);
            }
            this.messages.push({ type: chat_1.ChatType.command, name: name, command: command, args: args });
        }
    };
    /**
     * Tries to guess a player's name from chat.
     *
     * @param message the message to extract a username from.
     */
    PortalChatParser.prototype.getUsername = function (message) {
        for (var i = 18; i > 4; i--) {
            var possibleName = message.substring(0, message.lastIndexOf(': ', i));
            if (this.online.includes(possibleName) || possibleName == 'SERVER') {
                return possibleName;
            }
        }
        // Should ideally never happen.
        return message.substring(0, message.lastIndexOf(': ', 18));
    };
    return PortalChatParser;
}());
exports.PortalChatParser = PortalChatParser;

},{"../blockheads/types/chat":15}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var simpleevent_1 = require("../simpleevent");
var chatparser_1 = require("./chatparser");
var ajax_1 = require("../ajax");
/**
 * This class watches a world for new chat and reports any events through the 'message' event.
 *
 * Unless you are creating instances of the World class, you don't need to know anything about this class.
 */
var PortalChatWatcher = (function () {
    /**
     * Creates a new instance of the PortalChatWatcher class.
     *
     * @param options the configuration for this chat watcher.
     */
    function PortalChatWatcher(_a) {
        var worldId = _a.worldId, firstId = _a.firstId;
        /**
         * Event fired whenever new chat comes in.
         */
        this.onMessage = new simpleevent_1.SimpleEvent();
        this.firstId = firstId;
        this.worldId = worldId;
    }
    /**
     * @inheritdoc
     */
    PortalChatWatcher.prototype.setup = function (name, online) {
        this.parser = new chatparser_1.PortalChatParser(name, online);
        this.queueChatCheck();
    };
    /**
     * Continually checks chat for new messages.
     */
    PortalChatWatcher.prototype.checkChat = function () {
        var _this = this;
        this.getMessages()
            .then(this.parser.parse)
            .then(function (msgs) { return msgs.forEach(_this.onMessage.dispatch); })
            .then(function () { return _this.queueChatCheck(); });
    };
    /**
     * Queues checking for new chat to parse.
     */
    PortalChatWatcher.prototype.queueChatCheck = function () {
        var _this = this;
        setTimeout(function () { return _this.checkChat(); }, 5000);
    };
    /**
     * Gets the unread messages from the server queue.
     */
    PortalChatWatcher.prototype.getMessages = function () {
        var _this = this;
        return ajax_1.Ajax.postJSON('/api', { command: 'getchat', worldId: this.worldId, firstId: this.firstId })
            .then(function (data) {
            if (data.status == 'ok' && data.nextId != _this.firstId) {
                _this.firstId = data.nextId;
                return data.log;
            }
            // Expected to have error status sometimes, just return an empty array.
            return [];
        }, function () { return []; }); // Even if the request fails, this method should not throw.
    };
    return PortalChatWatcher;
}());
exports.PortalChatWatcher = PortalChatWatcher;

},{"../ajax":12,"../simpleevent":21,"./chatparser":18}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Parses logs from the portal into a standard format. This is only used by the [[PortalAPI]] class.
 */
var PortalLogParser = (function () {
    /**
     * Creates a new instance of the PortalLogParser class.
     */
    function PortalLogParser() {
        this.entries = [];
        this.parse = this.parse.bind(this);
    }
    /**
     * Parses the logs into a standard format.
     *
     * @param lines {string[]} the raw log lines.
     */
    PortalLogParser.prototype.parse = function (lines) {
        // Copy the lines array
        lines = lines.slice(0);
        // Assume first line is valid, if it isn't it will be dropped.
        for (var i = lines.length - 1; i > 0; i--) {
            var line = lines[i];
            if (!this.isValidLine(line)) {
                lines[i - 1] += '\n' + lines.splice(i, 1);
                continue;
            }
            this.addLine(line);
        }
        if (this.isValidLine(lines[0])) {
            this.addLine(lines[0]);
        }
        var entries = this.entries.reverse();
        this.entries = [];
        return entries;
    };
    PortalLogParser.prototype.isValidLine = function (line) {
        return /^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d\.\d\d\d blockheads_server/.test(line);
    };
    PortalLogParser.prototype.addLine = function (line) {
        var ts = line.substr(0, 24)
            .replace(' ', 'T')
            .replace(' ', 'Z');
        this.entries.push({
            raw: line,
            timestamp: new Date(ts),
            message: line.substr(line.indexOf(']') + 2)
        });
    };
    return PortalLogParser;
}());
exports.PortalLogParser = PortalLogParser;

},{}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Generic class which emits events.
 */
var SimpleEvent = (function () {
    /**
     * Creates a new instance of the class.
     */
    function SimpleEvent() {
        this.listeners = [];
        this.dispatch = this.dispatch.bind(this);
    }
    /**
     * Subscribes to the event, whenever it is fired, the passed callback will be called with the event args.
     *
     * @param callback the handler to add.
     */
    SimpleEvent.prototype.subscribe = function (callback) {
        if (!this.has(callback)) {
            this.listeners.push({ cb: callback, once: false });
        }
    };
    /**
     * Subscribes to the event, whenever it is fired, the passed callback will be called with the event args.
     * This method is an alias of the subscribe method.
     *
     * @param callback the handler to add.
     */
    SimpleEvent.prototype.sub = function (callback) {
        this.subscribe(callback);
    };
    /**
     * Registers an event handler that will only be called once.
     *
     * @param callback the handler to add.
     */
    SimpleEvent.prototype.once = function (callback) {
        if (!this.has(callback)) {
            this.listeners.push({ cb: callback, once: true });
        }
    };
    /**
     * Removes an event handler, if it is attached to the event.
     *
     * @param callback the callback to remove as a handler.
     */
    SimpleEvent.prototype.unsubscribe = function (callback) {
        for (var i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].cb == callback) {
                this.listeners.splice(i, 1);
                break;
            }
        }
    };
    /**
     * Removes an event handler, if it is attached to the event. This method is an alias of the unsubscribe method.
     *
     * @param callback the callback to remove as a handler.
     */
    SimpleEvent.prototype.unsub = function (callback) {
        this.unsubscribe(callback);
    };
    /**
     * Fires the event, calling all handlers.
     *
     * @param event the arguments to be passed to the handlers.
     */
    SimpleEvent.prototype.dispatch = function (event) {
        var len = this.listeners.length;
        for (var i = 0; i < len; i++) {
            if (this.listeners[i].once) {
                try {
                    len--;
                    this.listeners.splice(i--, 1)[0].cb(event);
                }
                catch (e) { }
            }
            else {
                try {
                    this.listeners[i].cb(event);
                }
                catch (e) { }
            }
        }
    };
    /**
     * Checks if the provided callback has been attached as an event handler.
     *
     * @param callback the handler which may be attached to the event.
     */
    SimpleEvent.prototype.has = function (callback) {
        return this.listeners.some(function (_a) {
            var cb = _a.cb;
            return cb == callback;
        });
    };
    return SimpleEvent;
}());
exports.SimpleEvent = SimpleEvent;

},{}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Storage class which manages saving and retriving data between bot launches.
 * Extensions can access this class through ex.world.storage.
 */
var Storage = (function () {
    function Storage(namespace) {
        this.namespace = String(namespace);
    }
    /**
     * Gets a string from the storage if it exists and returns it, otherwise returns fallback.
     *
     * @example
     * var x = getString('stored_prefs', 'nothing');
     * var y = getString('stored_prefs', 'nothing', false);
     *
     * @param key the key to retrieve.
     * @param fallback what to return if the key was not found.
     * @param local whether or not to use a namespace when checking for the key.
     */
    Storage.prototype.getString = function (key, fallback, local) {
        var result;
        if (local) {
            result = localStorage.getItem("" + key + this.namespace);
        }
        else {
            result = localStorage.getItem(key);
        }
        return (result === null) ? fallback : result;
    };
    /**
     * Gets a stored object if it exists, otherwise returns fallback.
     *
     * @example
     * var x = getObject('stored_key', [1, 2, 3]);
     *
     * @param key the item to retrieve.
     * @param fallback what to return if the item does not exist or fails to parse correctly.
     * @param local whether or not a namespace should be used.
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
     * Sets an object in the storage, stringifying it first if neccessary.
     *
     * @example
     * set('some_key', {a: [1, 2, 3], b: 'test'});
     * //returns '{"a":[1,2,3],"b":"test"}'
     * getString('some_key');
     * @param key the item to overwrite or create.
     * @param data any stringifyable type.
     * @param local whether to save the item with a namespace.
     */
    Storage.prototype.set = function (key, data, local) {
        if (local) {
            key = "" + key + this.namespace;
        }
        if (typeof data == 'string') {
            localStorage.setItem(key, data);
        }
        else {
            localStorage.setItem(key, JSON.stringify(data));
        }
    };
    /**
     * Removes all items starting with namespace from the storage.
     *
     * Note: Using Object.keys(localStorage) works, but is not covered in the spec.
     *
     * @example
     * set('key+test', 1);
     * set('key+test2', 2);
     * clearNamespace('key+'); //both key+test and key+test2 have been removed.
     *
     * @param namespace the prefix to check for when removing items.
     */
    Storage.prototype.clearNamespace = function (namespace) {
        var remove = [];
        for (var i = 0; i < localStorage.length + 5; i++) {
            var key = localStorage.key(i);
            if (key && key.startsWith(namespace)) {
                remove.push(key);
            }
        }
        remove.forEach(function (key) { return localStorage.removeItem(key); });
    };
    return Storage;
}());
exports.Storage = Storage;

},{}]},{},[11]);
