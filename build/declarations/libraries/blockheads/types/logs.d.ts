/**
 * Standard log entry to enable simpler code for extensions which support both mac servers and cloud servers.
 */
export interface LogEntry {
    /**
     * The raw line, in general should not be used.
     */
    raw: string;
    /**
     * The time that the log line was entered.
     */
    timestamp: Date;
    /**
     * The message logged.
     */
    message: string;
}
