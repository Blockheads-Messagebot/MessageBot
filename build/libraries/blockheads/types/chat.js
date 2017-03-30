"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Enum which indicates the properties included in a [[ChatMessage]].
 */
var ChatType;
(function (ChatType) {
    /**
     * For when a player joins the server.
     */
    ChatType[ChatType["join"] = 0] = "join";
    /**
     * When a player who is currently online leaves the server.
     */
    ChatType[ChatType["leave"] = 1] = "leave";
    /**
     * For all chat, from server and players. Includes messages starting with /
     */
    ChatType[ChatType["message"] = 2] = "message";
    /**
     * For commands from the server and players.
     */
    ChatType[ChatType["command"] = 3] = "command";
    /**
     * For log messages from the world, and messages which fail to parse, including leave messages from players who are not online.
     */
    ChatType[ChatType["other"] = 4] = "other";
})(ChatType = exports.ChatType || (exports.ChatType = {}));
