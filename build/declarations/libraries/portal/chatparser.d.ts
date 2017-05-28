import { ChatMessage } from '../blockheads/types/chat';
/**
 * Parses chat in the format received from the portal API.
 *
 * This is only used by the [[PortalChatWatcher]] class.
 */
export declare class PortalChatParser {
    /**
     * A list of currently online players, kept up to date by this class.
     */
    private online;
    /**
     * The name of the world.
     */
    private name;
    /**
     * The last parsed messages.
     */
    private messages;
    /**
     * Creates a new instance of the ChatParser class.
     *
     * @param name the name of the world
     * @param online currently online players.
     */
    constructor(name: string, online: string[]);
    /**
     * Parses a string as a chat message and emits an event for the message.
     *
     * @param messages the messages to parse.
     */
    parse: (messages: string[]) => ChatMessage[];
    /**
     * Keeps the online list up to date and emits join events.
     *
     * @param name the name of the player who is joining.
     * @param ip the ip of the player who is joining.
     */
    private handleJoin;
    /**
     * Keeps the online list up to date and emits leave events.
     *
     * @param name the name of the player leaving.
     */
    private handleLeave;
    /**
     * Checks the chat type and parses accordingly.
     *
     * @param name the name of the player chatting.
     * @param message the message sent.
     */
    private handleChat;
    /**
     * Tries to guess a player's name from chat.
     *
     * @param message the message to extract a username from.
     */
    private getUsername;
}
