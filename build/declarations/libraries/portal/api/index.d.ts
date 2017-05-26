import { WorldLists, WorldOverview, WorldApi } from '../../blockheads/types/world';
import { LogEntry } from '../../blockheads/types/logs';
/**
 * This class is only used by the [[World]] class. Unless you are creating new instances of the [[World]] class, you probably don't need to know anything about this class.
 *
 */
export declare class PortalApi implements WorldApi {
    private worldId;
    private messageQueue;
    private logParser;
    /**
     * Creates a new instance of the class.
     *
     * @param worldId the worldId to use when communicating with the server.
     */
    constructor(worldId: number);
    /**
     * @inheritdoc
     */
    getLists(): Promise<WorldLists>;
    /**
     * @inheritdoc
     */
    getOverview(): Promise<WorldOverview>;
    /**
     * @inheritdoc
     */
    getLogs(): Promise<LogEntry[]>;
    /**
     * @inheritdoc
     */
    send(message: string): void;
    /**
     * Waits until the world is online before resolving.
     */
    private worldOnline();
    /**
     * Sends the oldest queued message if possible.
     */
    private postMessage();
}
