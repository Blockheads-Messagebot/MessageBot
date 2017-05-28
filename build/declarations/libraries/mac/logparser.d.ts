import { LogEntry } from '../blockheads/types/logs';
/**
 * Parses logs from the portal into a standard format. This is only used by the [[PortalApi]] class.
 */
export declare class MacLogParser {
    private entries;
    private name;
    /**
     * Creates a new instance of the class.
     *
     * @param name the name of the world.
     */
    constructor(name: string);
    /**
     * Parses the logs into a standard format.
     *
     * @param lines {string[]} the raw log lines.
     */
    parse: (lines: string[]) => LogEntry[];
    private isValidLine;
    private addLine;
}
