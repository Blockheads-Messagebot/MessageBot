"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var simpleevent_1 = require("../simpleevent");
var chatparser_1 = require("./chatparser");
var ajax_1 = require("../ajax");
/**
 * This class watches a world for new chat and reports any events through the 'message' event.
 *
 * Unless you are creating instances of the World class, you don't need to know anything about this class.
 */
var PortalChatWatcher = (function () {
    /**
     * Creates a new instance of the PortalChatWatcher class.
     *
     * @param options the configuration for this chat watcher.
     */
    function PortalChatWatcher(_a) {
        var worldId = _a.worldId, firstId = _a.firstId;
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
    PortalChatWatcher.prototype.setup = function (name, online) {
        this.parser = new chatparser_1.PortalChatParser(name, online);
        this.queueChatCheck();
    };
    /**
     * Continually checks chat for new messages.
     */
    PortalChatWatcher.prototype.checkChat = function () {
        var _this = this;
        this.getMessages()
            .then(this.parser.parse)
            .then(function (msgs) { return msgs.forEach(_this.onMessage.dispatch); })
            .then(function () { return _this.queueChatCheck(); });
    };
    /**
     * Queues checking for new chat to parse.
     */
    PortalChatWatcher.prototype.queueChatCheck = function () {
        var _this = this;
        setTimeout(function () { return _this.checkChat(); }, 5000);
    };
    /**
     * Gets the unread messages from the server queue.
     */
    PortalChatWatcher.prototype.getMessages = function () {
        var _this = this;
        return ajax_1.Ajax.postJSON('/api', { command: 'getchat', worldId: this.worldId, firstId: this.firstId })
            .then(function (data) {
            if (data.status == 'ok' && data.nextId != _this.firstId) {
                _this.firstId = data.nextId;
                return data.log;
            }
            // Expected to have error status sometimes, just return an empty array.
            return [];
        }, function () { return []; }); // Even if the request fails, this method should not throw.
    };
    return PortalChatWatcher;
}());
exports.PortalChatWatcher = PortalChatWatcher;
