import { ChatWatcher, ChatMessage } from '../blockheads/types/chat';
import { SimpleEvent } from '../simpleevent';
export declare class MacChatWatcher implements ChatWatcher {
    private tail;
    private logs;
    private path;
    private parser;
    /**
     * @inheritdoc
     */
    onMessage: SimpleEvent<ChatMessage>;
    /**
     * Creates a new instance of the MacChatWatcher class.
     *
     * @param path the path to where the world is stored.
     */
    constructor(path: string);
    /**
     * @inheritdoc
     */
    setup: (name: string, online: string[]) => void;
}
