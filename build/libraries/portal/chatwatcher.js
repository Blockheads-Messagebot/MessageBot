"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simpleevent_1 = require("../simpleevent");
const chatparser_1 = require("./chatparser");
const ajax_1 = require("../ajax");
/**
 * This class watches a world for new chat and reports any events through the 'message' event.
 *
 * Unless you are creating instances of the World class, you don't need to know anything about this class.
 */
class PortalChatWatcher {
    /**
     * Creates a new instance of the PortalChatWatcher class.
     *
     * @param options the configuration for this chat watcher.
     */
    constructor({ worldId, firstId }) {
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
    setup(name, online) {
        this.parser = new chatparser_1.PortalChatParser(name, online);
        this.queueChatCheck();
    }
    /**
     * Continually checks chat for new messages.
     *
     * @hidden
     */
    checkChat() {
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
    queueChatCheck() {
        setTimeout(() => this.checkChat(), 5000);
    }
    /**
     * Gets the unread messages from the server queue.
     *
     * @hidden
     */
    getMessages() {
        return ajax_1.Ajax.postJSON('/api', { command: 'getchat', worldId: this.worldId, firstId: this.firstId })
            .then((data) => {
            if (data.status == 'ok' && data.nextId != this.firstId) {
                this.firstId = data.nextId;
                return data.log;
            }
            // Expected to have error status sometimes, just return an empty array.
            return [];
        }, () => []); // Even if the request fails, this method should not throw.
    }
}
exports.PortalChatWatcher = PortalChatWatcher;
