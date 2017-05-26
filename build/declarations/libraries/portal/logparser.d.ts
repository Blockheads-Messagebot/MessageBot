import { LogEntry } from '../blockheads/types/logs';
/**
 * Parses logs from the portal into a standard format. This is only used by the [[PortalApi]] class.
 */
export declare class PortalLogParser {
    private entries;
    /**
     * Creates a new instance of the PortalLogParser class.
     */
    constructor();
    /**
     * Parses the logs into a standard format.
     *
     * @param lines the raw log lines.
     */
    parse(lines: string[]): LogEntry[];
    private isValidLine(line);
    private addLine(line);
}
