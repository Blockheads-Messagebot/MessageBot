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
 * Parses chat in the format received from the mac API.
 *
 * This is only used by the [[MacChatWatcher]] class.
 */
var MacChatParser = (function () {
    /**
     * Creates a new instance of the ChatParser class.
     *
     * @param name the name of the world
     * @param online currently online players.
     */
    function MacChatParser(online) {
        this.online = online;
        this.parse = this.parse.bind(this);
    }
    /**
     * Parses a string as a chat message and emits an event for the message.
     *
     * @param messages the messages to parse.
     */
    MacChatParser.prototype.parse = function (message) {
        this.messages = [];
        if (message.startsWith("Player Connected ")) {
            var temp = message.match(/^Player Connected (.*) \| ([\d.]+) \| ([\w]{32})\s*$/);
            if (temp) {
                var _a = __read(temp, 3), name_1 = _a[1], ip = _a[2];
                this.handleJoin(name_1, ip);
            }
            else {
                this.messages.push({ type: chat_1.ChatType.other, message: message });
            }
        }
        else if (message.startsWith("Player Disconnected ")) {
            var name_2 = message.substring(20);
            this.handleLeave(name_2);
        }
        else if (message.includes(': ')) {
            var name_3 = this.getUsername(message);
            if (name_3) {
                var msg = message.substring(name_3.length + 2);
                this.handleChat(name_3, msg);
            }
            else {
                this.messages.push({ type: chat_1.ChatType.other, message: message });
            }
        }
        else {
            this.messages.push({ type: chat_1.ChatType.other, message: message });
        }
        return this.messages;
    };
    /**
     * Keeps the online list up to date and emits join events.
     *
     * @param name the name of the player who is joining.
     * @param ip the ip of the player who is joining.
     */
    MacChatParser.prototype.handleJoin = function (name, ip) {
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
    MacChatParser.prototype.handleLeave = function (name) {
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
    MacChatParser.prototype.handleChat = function (name, message) {
        if (name == 'SERVER') {
            // Server chat must be ignored to avoid an infinite loop.
            return;
        }
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
    MacChatParser.prototype.getUsername = function (message) {
        for (var i = 18; i > 4; i--) {
            var possibleName = message.substring(0, message.lastIndexOf(': ', i));
            if (this.online.includes(possibleName) || possibleName == 'SERVER') {
                return possibleName;
            }
        }
        // Should ideally never happen.
        return message.substring(0, message.lastIndexOf(': ', 18));
    };
    return MacChatParser;
}());
exports.MacChatParser = MacChatParser;
