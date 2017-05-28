import { SimpleEvent } from '../simpleevent';
import { ChatWatcher, ChatMessage } from '../blockheads/types/chat';
/**
 * This class watches a world for new chat and reports any events through the 'message' event.
 *
 * Unless you are creating instances of the World class, you don't need to know anything about this class.
 */
export declare class PortalChatWatcher implements ChatWatcher {
    private parser;
    private firstId;
    private worldId;
    /**
     * Event fired whenever new chat comes in.
     */
    onMessage: SimpleEvent<ChatMessage>;
    /**
     * Creates a new instance of the PortalChatWatcher class.
     *
     * @param options the configuration for this chat watcher.
     */
    constructor({worldId, firstId}: {
        worldId: number;
        firstId: number;
    });
    /**
     * @inheritdoc
     */
    setup: (name: string, online: string[]) => void;
    /**
     * Continually checks chat for new messages.
     */
    private checkChat;
    /**
     * Queues checking for new chat to parse.
     */
    private queueChatCheck;
    /**
     * Gets the unread messages from the server queue.
     */
    private getMessages;
}
