import {ChatMessage, ChatType} from '../blockheads/types/chat';

/**
 * Parses chat in the format recieved from the portal API.
 *
 * This is only used by the [[PortalChatWatcher]] class.
 */
export class PortalChatParser {
    /**
     * A list of currently online players, kept up to date by this class.
     *
     * @hidden
     */
    private online: string[];

    /**
     * The name of the world.
     *
     * @hidden
     */
    private name: string;

    /**
     * The last parsed messages.
     *
     * @hidden
     */
    private messages: ChatMessage[];

    /**
     * Creates a new instance of the ChatParser class.
     *
     * @param name the name of the world
     * @param online currently online players.
     */
    constructor(name: string, online: string[]) {
        this.name = name;
        this.online = online;

        this.parse = this.parse.bind(this);
    }

    /**
     * Parses a string as a chat message and emits an event for the message.
     *
     * @param messages the messages to parse.
     */
    parse(messages: string[]): ChatMessage[] {
        this.messages = [];
        messages.forEach(message => {
            if (message.startsWith(`${this.name} - Player Connected `)) {
                let temp = message.match(/ - Player Connected (.*) \| ([\d.]+) \| ([\w]{32})\s*$/);
                if (temp) {
                    let [, name, ip] = temp;
                    this.handleJoin(name, ip);
                } else {
                    this.messages.push({type: ChatType.other, message});
                }

            } else if (message.startsWith(`${this.name} - Player Disconnected `)) {
                let name = message.substring(this.name.length + 23);
                this.handleLeave(name);

            } else if (message.includes(': ')) {
                let name = this.getUsername(message);
                if (name) {
                    let msg = message.substring(name.length + 2);
                    this.handleChat(name, msg);
                } else {
                    this.messages.push({type: ChatType.other, message});
                }

            } else {
                this.messages.push({type: ChatType.other, message});

            }
        });

        return this.messages;
    }

    /**
     * Keeps the online list up to date and emits join events.
     *
     * @hidden
     * @param name the name of the player who is joining.
     * @param ip the ip of the player who is joining.
     */
    private handleJoin(name: string, ip: string): void {
        if (!this.online.includes(name)) {
            this.online.push(name);
        }

        this.messages.push({type: ChatType.join, name, ip});
    }

    /**
     * Keeps the online list up to date and emits leave events.
     *
     * @hidden
     * @param name the name of the player leaving.
     */
    private handleLeave(name: string): void {
        if (this.online.includes(name)) {
            this.online.splice(this.online.indexOf(name), 1);
            this.messages.push({type: ChatType.leave, name});
        }
    }

    /**
     * Checks the chat type and parses accordingly.
     *
     * @hidden
     * @param name the name of the player chatting.
     * @param message the message sent.
     */
    private handleChat(name: string, message: string): void {
        if (name == 'SERVER') {
            // Handled by the world class
            return;
        }

        this.messages.push({type: ChatType.message, name, message});

        if (message.startsWith('/') && !message.startsWith('/ ')) {
            let command = message.substr(1);
            let args = '';

            if (command.includes(' ')) {
                command = command.substring(0, command.indexOf(' '));
                args = message.substring(message.indexOf(' ') + 1);
            }

            this.messages.push({type: ChatType.command, name, command, args});
        }
    }

    /**
     * Tries to guess a player's name from chat.
     *
     * @hidden
     * @param message the message to extract a username from.
     */
    private getUsername(message: string): string {
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
