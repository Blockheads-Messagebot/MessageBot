"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chat_1 = require("../blockheads/types/chat");
/**
 * Parses chat in the format recieved from the portal API.
 *
 * This is only used by the [[PortalChatWatcher]] class.
 */
class PortalChatParser {
    /**
     * Creates a new instance of the ChatParser class.
     *
     * @param name the name of the world
     * @param online currently online players.
     */
    constructor(name, online) {
        this.name = name;
        this.online = online;
        this.parse = this.parse.bind(this);
    }
    /**
     * Parses a string as a chat message and emits an event for the message.
     *
     * @param messages the messages to parse.
     */
    parse(messages) {
        this.messages = [];
        messages.forEach(message => {
            if (message.startsWith(`${this.name} - Player Connected `)) {
                let temp = message.match(/ - Player Connected (.*) \| ([\d.]+) \| ([\w]{32})\s*$/);
                if (temp) {
                    let [, name, ip] = temp;
                    this.handleJoin(name, ip);
                }
                else {
                    this.messages.push({ type: chat_1.ChatType.other, message });
                }
            }
            else if (message.startsWith(`${this.name} - Player Disconnected `)) {
                let name = message.substring(this.name.length + 23);
                this.handleLeave(name);
            }
            else if (message.includes(': ')) {
                let name = this.getUsername(message);
                if (name) {
                    let msg = message.substring(name.length + 2);
                    this.handleChat(name, msg);
                }
                else {
                    this.messages.push({ type: chat_1.ChatType.other, message });
                }
            }
            else {
                this.messages.push({ type: chat_1.ChatType.other, message });
            }
        });
        return this.messages;
    }
    /**
     * Keeps the online list up to date and emits join events.
     *
     * @param name the name of the player who is joining.
     * @param ip the ip of the player who is joining.
     */
    handleJoin(name, ip) {
        if (!this.online.includes(name)) {
            this.online.push(name);
        }
        this.messages.push({ type: chat_1.ChatType.join, name, ip });
    }
    /**
     * Keeps the online list up to date and emits leave events.
     *
     * @param name the name of the player leaving.
     */
    handleLeave(name) {
        if (this.online.includes(name)) {
            this.online.splice(this.online.indexOf(name), 1);
            this.messages.push({ type: chat_1.ChatType.leave, name });
        }
    }
    /**
     * Checks the chat type and parses accordingly.
     *
     * @param name the name of the player chatting.
     * @param message the message sent.
     */
    handleChat(name, message) {
        if (name == 'SERVER') {
            // Handled by the world class
            return;
        }
        this.messages.push({ type: chat_1.ChatType.message, name, message });
        if (message.startsWith('/') && !message.startsWith('/ ')) {
            let command = message.substr(1);
            let args = '';
            if (command.includes(' ')) {
                command = command.substring(0, command.indexOf(' '));
                args = message.substring(message.indexOf(' ') + 1);
            }
            this.messages.push({ type: chat_1.ChatType.command, name, command, args });
        }
    }
    /**
     * Tries to guess a player's name from chat.
     *
     * @param message the message to extract a username from.
     */
    getUsername(message) {
        for (let i = 18; i > 4; i--) {
            let possibleName = message.substring(0, message.lastIndexOf(': ', i));
            if (this.online.includes(possibleName) || possibleName == 'SERVER') {
                return possibleName;
            }
        }
        // Should ideally never happen.
        return message.substring(0, message.lastIndexOf(': ', 18));
    }
}
exports.PortalChatParser = PortalChatParser;
