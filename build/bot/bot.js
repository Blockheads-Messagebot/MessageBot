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
        id = id.toLocaleLowerCase();
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
     * @param params any variables to inject into the message. If `name` is provided, it will be available through {{NAME}}, {{Name}} and {{name}}
     */
    MessageBot.prototype.send = function (message, params) {
        var _this = this;
        if (params === void 0) { params = {}; }
        var messages;
        // Split the message if splitting is enabled.
        if (this.settings.get('splitMessages', false)) {
            messages = message.split(this.settings.get('splitToken', '<split>'));
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
