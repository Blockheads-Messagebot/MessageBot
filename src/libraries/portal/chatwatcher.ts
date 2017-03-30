import {SimpleEvent} from '../simpleevent';
import {ChatWatcher, ChatMessage} from '../blockheads/types/chat';
import {PortalChatParser as ChatParser} from './chatparser';
import {Ajax} from '../ajax';

/**
 * This class watches a world for new chat and reports any events through the 'message' event.
 *
 * Unless you are creating instances of the World class, you don't need to know anything about this class.
 */
export class PortalChatWatcher implements ChatWatcher {
    /** @hidden */
    private parser: ChatParser;
    /** @hidden */
    private firstId: number;
    /** @hidden */
    private worldId: number;

    /**
     * Event fired whenever new chat comes in.
     */
    public onMessage = new SimpleEvent<ChatMessage>();


    /**
     * Creates a new instance of the PortalChatWatcher class.
     *
     * @param options the configuration for this chat watcher.
     */
    constructor({worldId, firstId}: {worldId: number, firstId: number}) {
        this.firstId = firstId;
        this.worldId = worldId;
    }

    /**
     * @inheritdoc
     */
    setup(name: string, online: string[]) {
        this.parser = new ChatParser(name, online);
        this.queueChatCheck();
    }

    /**
     * Continually checks chat for new messages.
     *
     * @hidden
     */
    private checkChat() {
        this.getMessages()
            .then(this.parser.parse)
            .then(msgs => msgs.forEach(this.onMessage.dispatch))
            .then(() => this.queueChatCheck());
    }

    /**
     * Queues checking for new chat to parse.
     *
     * @hidden
     */
    private queueChatCheck() {
        setTimeout(() => this.checkChat(), 5000);
    }

    /**
     * Gets the unread messages from the server queue.
     *
     * @hidden
     */
    private getMessages(): Promise<string[]> {
        return Ajax.postJSON('/api', {command: 'getchat', worldId: this.worldId, firstId: this.firstId})
            .then((data: {
                status: string;
                log: string[];
                nextId: number;
                message: string;
            }) => {
                if (data.status == 'ok' && data.nextId != this.firstId) {
                    this.firstId = data.nextId;
                    return data.log;
                }
                // Expected to have error status sometimes, just return an empty array.

                return [];
            }, () =>[]); // Even if the request fails, this method should not throw.
    }
}
