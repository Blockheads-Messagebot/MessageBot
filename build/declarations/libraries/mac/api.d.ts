import { WorldApi, WorldLists, WorldOverview } from '../blockheads/types/world';
import { LogEntry } from '../blockheads/types/logs';
/**
 * This class is only used by the [[World]] class. You don't need to know anything about it unless you are creating new instances of the [[World]] class.
 */
export declare class MacApi implements WorldApi {
    private path;
    private worldv2;
    private parser;
    /**
     * Creates a new instance of the MacApi class.
     *
     * @param path the path to the world save folder.
     */
    constructor(path: string);
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
     * Gets the specified list for the world.
     *
     * @param file the file to read
     */
    private readText(file);
}
