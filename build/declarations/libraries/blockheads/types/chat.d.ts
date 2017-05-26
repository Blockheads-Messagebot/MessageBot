import { SimpleEvent } from '../../simpleevent';
/**
 * Class used to watch chat for new messages. For cloud worlds, [[PortalChatWatcher]] is used.
 */
export interface ChatWatcher {
    /**
     * Configures the watcher and starts watching chat.
     * @param name the name of the world.
    * @param online the currently online players.
     */
    setup(name: string, online: string[]): void;
    /**
     * Fired whenever a new message is received.
     */
    onMessage: SimpleEvent<ChatMessage>;
}
/**
 * Enum which indicates the properties included in a [[ChatMessage]].
 */
export declare enum ChatType {
    /**
     * For when a player joins the server.
     */
    join = 0,
    /**
     * When a player who is currently online leaves the server.
     */
    leave = 1,
    /**
     * For all chat, from server and players. Includes messages starting with /
     */
    message = 2,
    /**
     * For commands from the server and players.
     */
    command = 3,
    /**
     * For log messages from the world, and messages which fail to parse, including leave messages from players who are not online.
     */
    other = 4,
}
/**
 * Object emitted whenever a message is received from the server.
 */
export interface ChatMessage {
    /**
     * The type of the message. Determines what properties are included.
     */
    type: ChatType;
    /**
     * The name of the player who sent the message. Included in all types but [[ChatType.other]]
     */
    name?: string;
    /**
     * The IP of the player. Included only if the type is [[ChatType.join]]
     */
    ip?: string;
    /**
     * The message sent, included if the chat type is [[ChatType.message]] or [[ChatType.other]]
     */
    message?: string;
    /**
     * The command used, included if the chat type is [[ChatType.command]]
     */
    command?: string;
    /**
     * Any arguments for the command, included if the chat type is [[ChatType.command]]
     */
    args?: string;
}
